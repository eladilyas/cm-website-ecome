// One-shot restructure for the storefront shop categories.
//
// Flattens the previous tree (POS Terminal / POS Tablette / POS Portable
// / POS Périphériques + 6 children / POS Kiosk / Accès & Présence) into
// a flat 8-category taxonomy:
//
//   POS                Swan terminals + WDLink touch monitor
//   Handheld           Swift 1 / 2 Pro / 2 Ultra
//   Kiosk              Heron 1 / Heron 1 Mini
//   Peripherals        Kitchen display, cash drawer, printer, scanner
//   Syscall            Guest pagers + Syscall-brand accessories
//   Accessories        TPE stands, cables, mounts
//   Consumables        Receipt rolls, label paper, TPE tape
//   Access & Presence  ZKTeco access + time tracking devices
//
// Run with:   npm run shop:restructure
// Idempotent: every operation is upsert / explicit "if-then" — safe to
// re-run, no duplicates, no destructive deletes. Legacy categories are
// soft-disabled (isActive=false), not hard-deleted, so existing audit
// trails and order history that reference them stay valid.
//
// Before-state snapshot is written to `prisma/snapshots/categories-<ts>.json`.

import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();

type Cat = {
  slug: string;
  label: string;
  order: number;
};

/** Flat top-level taxonomy. */
const CATEGORIES: Cat[] = [
  { slug: "pos", label: "POS", order: 10 },
  { slug: "handheld", label: "Handheld", order: 20 },
  { slug: "kiosk", label: "Kiosk", order: 30 },
  { slug: "peripherals", label: "Peripherals", order: 40 },
  { slug: "syscall", label: "Syscall", order: 50 },
  { slug: "accessories", label: "Accessories", order: 60 },
  { slug: "consumables", label: "Consumables", order: 70 },
  { slug: "access-presence", label: "Access & Presence", order: 80 },
];

/** Product slug → new category slug. */
const PRODUCT_REMAP: Record<string, string> = {
  "swan-1-gen-2": "pos",
  "swan-1k-gen-2": "peripherals",
  "wdlink-wd15m": "pos",
  "swift-1-pro": "handheld",
  "swift-2-pro": "handheld",
  "swift-2-ultra": "handheld",
  "heron-1": "kiosk",
  "heron-1-mini": "kiosk",
  drawer: "peripherals",
  "epson-printer": "peripherals",
  "2d-scanner": "peripherals",
  "signature-guest-pager": "syscall",
};

/** Global product displayOrder. Drives "All" sort on the home rail —
 *  POS first, then Handheld, Kiosk, Peripherals, Syscall. */
const PRODUCT_ORDER: Record<string, number> = {
  "swan-1-gen-2": 10,
  "wdlink-wd15m": 20,
  "swift-1-pro": 30,
  "swift-2-pro": 40,
  "swift-2-ultra": 50,
  "heron-1": 60,
  "heron-1-mini": 70,
  "swan-1k-gen-2": 80,
  drawer: 90,
  "epson-printer": 100,
  "2d-scanner": 110,
  "signature-guest-pager": 120,
};

/** Slugs from older taxonomies — soft-disable so the storefront hides
 *  them but FK + audit history stays intact. */
const LEGACY_SLUGS = [
  "pos-terminals",
  "mobile-pos",
  "kiosks",
  "kds",
  "cash-drawers",
  "printers",
  "scanners",
  "paging",
  "pos-terminal",
  "pos-tablette",
  "pos-portable",
  "pos-peripheriques",
  "pos-kiosk",
  "acces-presence",
  "peripheriques-ecran",
  "peripheriques-scanner",
  "peripheriques-imprimante",
  "peripheriques-tiroir-caisse",
  "peripheriques-afficheur",
  "peripheriques-lecteur",
];

async function main() {
  console.log("=== shop-category restructure — start ===");

  const cats = await db.category.findMany({
    orderBy: { displayOrder: "asc" },
  });
  const prods = await db.product.findMany({
    select: { id: true, slug: true, name: true, category: true, displayOrder: true },
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

  // Upsert all categories.
  for (const c of CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        isActive: true,
        displayOrder: c.order,
        parentId: null,
      },
      update: {
        label: c.label,
        isActive: true,
        displayOrder: c.order,
        parentId: null,
      },
    });
    console.log(`  ✓ ${c.slug.padEnd(20)} → ${c.label}`);
  }

  // Remap product → new category + apply displayOrder.
  let mapped = 0;
  const unmapped: string[] = [];
  for (const p of prods) {
    const nextCat = PRODUCT_REMAP[p.slug];
    if (!nextCat) {
      unmapped.push(p.slug);
      continue;
    }
    const nextOrder = PRODUCT_ORDER[p.slug] ?? p.displayOrder;
    if (p.category === nextCat && p.displayOrder === nextOrder) {
      mapped++;
      continue;
    }
    await db.product.update({
      where: { id: p.id },
      data: { category: nextCat, displayOrder: nextOrder },
    });
    mapped++;
    console.log(
      `  → ${p.slug.padEnd(28)} ${p.category} → ${nextCat} (order ${nextOrder})`,
    );
  }
  console.log(`  remapped ${mapped} / ${prods.length} products`);
  if (unmapped.length > 0) {
    console.warn(`  ⚠ unmapped (review manually): ${unmapped.join(", ")}`);
  }

  // Soft-disable legacy slugs.
  for (const slug of LEGACY_SLUGS) {
    const row = await db.category.findUnique({ where: { slug } });
    if (!row || !row.isActive) continue;
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
