// One-shot restructure for the storefront shop categories.
//
// Renames the legacy flat 8-category taxonomy
//   (pos-terminals · mobile-pos · kiosks · kds · cash-drawers ·
//    printers · scanners · paging)
// into the new 6-top-level / 1-with-sub-categories tree:
//
//   POS Terminal           (no children)
//   POS Tablette           (no children — empty for now)
//   POS Portable           (handhelds)
//   POS Périphériques      (parent)
//     ├─ Écran
//     ├─ Scanner
//     ├─ Imprimante
//     ├─ Tiroir Caisse
//     ├─ Afficheur
//     └─ Lecteur
//   POS Kiosk              (no children)
//   Accès & Présence       (no children — ZKTeco MB20 etc., empty for now)
//
// Run with:   npm run restructure:shop
// Idempotent: every operation is upsert / explicit "if-then" — safe to
// re-run, no duplicates, no destructive deletes. Legacy categories are
// soft-disabled (isActive=false), not hard-deleted, so existing audit
// trails and order history that reference them stay valid.
//
// Before-state snapshot is written to `prisma/snapshots/categories-<ts>.json`
// so we can roll back by hand if needed.

import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();

type NewTopCategory = {
  slug: string;
  label: string;
  order: number;
};

type NewSubCategory = NewTopCategory & {
  parentSlug: string;
};

/** Top-level categories in display order. */
const TOPS: NewTopCategory[] = [
  { slug: "pos-terminal", label: "POS Terminal", order: 10 },
  { slug: "pos-tablette", label: "POS Tablette", order: 20 },
  { slug: "pos-portable", label: "POS Portable", order: 30 },
  { slug: "pos-peripheriques", label: "POS Périphériques", order: 40 },
  { slug: "pos-kiosk", label: "POS Kiosk", order: 50 },
  { slug: "acces-presence", label: "Accès & Présence", order: 60 },
];

/** Sub-categories — all children of pos-peripheriques. */
const SUBS: NewSubCategory[] = [
  { slug: "peripheriques-ecran", label: "Écran", order: 10, parentSlug: "pos-peripheriques" },
  { slug: "peripheriques-scanner", label: "Scanner", order: 20, parentSlug: "pos-peripheriques" },
  { slug: "peripheriques-imprimante", label: "Imprimante", order: 30, parentSlug: "pos-peripheriques" },
  { slug: "peripheriques-tiroir-caisse", label: "Tiroir Caisse", order: 40, parentSlug: "pos-peripheriques" },
  { slug: "peripheriques-afficheur", label: "Afficheur", order: 50, parentSlug: "pos-peripheriques" },
  { slug: "peripheriques-lecteur", label: "Lecteur", order: 60, parentSlug: "pos-peripheriques" },
];

/** Existing product slug → new category slug. */
const PRODUCT_REMAP: Record<string, string> = {
  "swan-1-gen-2": "pos-terminal",
  "swan-1k-gen-2": "peripheriques-ecran", // KDS = kitchen display screen
  "wdlink-wd15m": "pos-terminal", // tabletop touch monitor — belongs with Swan terminals
  "swift-1-pro": "pos-portable",
  "swift-2-pro": "pos-portable",
  "swift-2-ultra": "pos-portable",
  "heron-1": "pos-kiosk",
  "heron-1-mini": "pos-kiosk",
  drawer: "peripheriques-tiroir-caisse",
  "epson-printer": "peripheriques-imprimante",
  "2d-scanner": "peripheriques-scanner",
  "signature-guest-pager": "peripheriques-lecteur",
};

/** Legacy top-level slugs that should be deactivated after the
 *  remap — they're no longer surfaced by the new tree. We keep the
 *  rows for FK integrity (audit log, historic orders) but flip
 *  isActive=false so nothing in the storefront renders them. */
const LEGACY_SLUGS = [
  "pos-terminals",
  "mobile-pos",
  "kiosks",
  "kds",
  "cash-drawers",
  "printers",
  "scanners",
  "paging",
];

async function main() {
  console.log("=== shop-category restructure — start ===");

  // 1. Snapshot before-state to a JSON file (idempotent run will write
  //    a fresh snapshot each invocation).
  const cats = await db.category.findMany({
    orderBy: { displayOrder: "asc" },
  });
  const prods = await db.product.findMany({
    select: { id: true, slug: true, name: true, category: true },
  });
  const dir = join(process.cwd(), "prisma", "snapshots");
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapPath = join(dir, `categories-${stamp}.json`);
  writeFileSync(
    snapPath,
    JSON.stringify({ categories: cats, products: prods }, null, 2),
  );
  console.log(`  snapshot → ${snapPath} (${cats.length} cats, ${prods.length} products)`);

  // 2. Upsert all 6 top-level categories.
  for (const top of TOPS) {
    await db.category.upsert({
      where: { slug: top.slug },
      create: {
        slug: top.slug,
        label: top.label,
        isActive: true,
        displayOrder: top.order,
        parentId: null,
      },
      update: {
        label: top.label,
        isActive: true,
        displayOrder: top.order,
        parentId: null,
      },
    });
    console.log(`  ✓ top: ${top.slug.padEnd(20)} → ${top.label}`);
  }

  // 3. Upsert sub-categories. Look up parent id by slug.
  const parentMap = new Map<string, string>();
  for (const top of TOPS) {
    const row = await db.category.findUnique({ where: { slug: top.slug } });
    if (row) parentMap.set(top.slug, row.id);
  }
  for (const sub of SUBS) {
    const parentId = parentMap.get(sub.parentSlug);
    if (!parentId) throw new Error(`Parent not found: ${sub.parentSlug}`);
    await db.category.upsert({
      where: { slug: sub.slug },
      create: {
        slug: sub.slug,
        label: sub.label,
        isActive: true,
        displayOrder: sub.order,
        parentId,
      },
      update: {
        label: sub.label,
        isActive: true,
        displayOrder: sub.order,
        parentId,
      },
    });
    console.log(`  ✓ sub: ${sub.slug.padEnd(28)} (parent=${sub.parentSlug}) → ${sub.label}`);
  }

  // 4. Remap existing products. Anything not in PRODUCT_REMAP is left
  //    untouched (with a warning) so the script never silently
  //    re-points unknown products to wrong categories.
  let mapped = 0;
  const unmapped: string[] = [];
  for (const p of prods) {
    const next = PRODUCT_REMAP[p.slug];
    if (!next) {
      unmapped.push(p.slug);
      continue;
    }
    if (p.category === next) {
      mapped++;
      continue; // already correct
    }
    await db.product.update({
      where: { id: p.id },
      data: { category: next },
    });
    mapped++;
    console.log(`  → product ${p.slug.padEnd(28)} ${p.category} → ${next}`);
  }
  console.log(`  remapped ${mapped} / ${prods.length} products`);
  if (unmapped.length > 0) {
    console.warn(`  ⚠ unmapped (review manually): ${unmapped.join(", ")}`);
  }

  // 5. Soft-disable legacy top-level categories.
  for (const slug of LEGACY_SLUGS) {
    const row = await db.category.findUnique({ where: { slug } });
    if (!row) continue;
    if (!row.isActive) continue;
    await db.category.update({
      where: { slug },
      data: { isActive: false },
    });
    console.log(`  ✓ disabled legacy: ${slug}`);
  }

  console.log("=== shop-category restructure — done ===");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
