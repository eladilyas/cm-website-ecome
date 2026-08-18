// Mirror of src/data/catalog.ts → Postgres Product table.
//
// Usage:
//   npx dotenv-cli -e .env.local -- npx tsx scripts/import-catalog.ts
//     → insert-only. Existing slugs are skipped (original contract).
//
//   … scripts/import-catalog.ts --upsert
//     → inserts new slugs AND refreshes the editorial content of rows
//       that already exist (name, tagline, copy, features, specs, image,
//       price, availability, category). Merchandising fields owned by
//       the admin panel (featured, displayOrder, badges) are left alone
//       on update; only new rows get a seeded displayOrder.
//
//   … scripts/import-catalog.ts --upsert --dry
//     → prints the plan, writes nothing.
//
// ── Category mapping ──────────────────────────────────────────────────
// src/data/catalog.ts still uses the legacy taxonomy (pos-terminals,
// mobile-pos, …). The live storefront taxonomy in Postgres is the flat
// eight-slug set created by scripts/restructure-shop-categories.ts, and
// Product.category is an FK onto Category.slug — so seeding the legacy
// slugs would park every product in a soft-disabled category and hide
// it from /shop and the header nav. CATEGORY_REMAP translates on the
// way in. Keep it in sync with the CatalogCategory union.

import { PrismaClient } from "@prisma/client";

import { CATALOG, type CatalogCategory } from "../src/data/catalog";

const db = new PrismaClient();

/** Legacy catalog category → live storefront category slug. */
const CATEGORY_REMAP: Record<CatalogCategory, string> = {
  "pos-terminals": "pos",
  "mobile-pos": "handheld",
  "kiosks": "kiosk",
  "kds": "peripherals",
  "cash-drawers": "peripherals",
  "printers": "peripherals",
  "scanners": "peripherals",
  "paging": "syscall",
  "rfid": "access-presence",
  "time-attendance": "access-presence",
  "accessories": "accessories",
};

const upsert = process.argv.includes("--upsert");
const dry = process.argv.includes("--dry");

async function main(): Promise<void> {
  // Fail fast if a mapped category row is missing — the FK would reject
  // the insert anyway, and a clear message beats a Prisma constraint
  // dump.
  const targets = [...new Set(Object.values(CATEGORY_REMAP))];
  const known = await db.category.findMany({
    where: { slug: { in: targets } },
    select: { slug: true },
  });
  const missing = targets.filter((t) => !known.some((k) => k.slug === t));
  if (missing.length > 0) {
    throw new Error(
      `[import-catalog] missing Category rows: ${missing.join(", ")} — run \`npm run shop:restructure\` first.`,
    );
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, p] of CATALOG.entries()) {
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    const status =
      p.availability?.status === "incoming" ? "INCOMING" : "IN_STOCK";
    const category = CATEGORY_REMAP[p.category];

    // Editorial payload — shared by create and update.
    const content = {
      name: p.name,
      subline: p.subline ?? null,
      tagline: p.tagline,
      category,
      heroImage: p.heroImage,
      alt: p.alt,
      shortDescription: p.shortDescription,
      features: p.features,
      specs: p.specs,
      priceFromMinor: Math.round(p.priceFrom * 100),
      currency: "MAD",
      status,
      leadWeeks: p.availability?.leadWeeks ?? null,
      complementaryWithSlugs: p.complementaryWith,
    } as const;

    if (existing) {
      if (!upsert) {
        skipped++;
        continue;
      }
      if (!dry) {
        await db.product.update({
          where: { slug: p.slug },
          // Deliberately not touching featured / displayOrder / badges:
          // those are merchandising decisions made in /admin.
          data: content,
        });
      }
      updated++;
      console.log(`  ~ ${p.slug} → ${category} / ${status}`);
      continue;
    }

    if (!dry) {
      await db.product.create({
        data: {
          slug: p.slug,
          ...content,
          featured: false,
          displayOrder: (index + 1) * 10,
          badges: [],
        },
      });
    }
    inserted++;
    console.log(`  + ${p.slug} → ${category} / ${status}`);
  }

  const total = await db.product.count();
  console.log(
    `[import-catalog]${dry ? " DRY RUN —" : ""} inserted=${inserted}, updated=${updated}, skipped=${skipped}, catalog=${CATALOG.length}, productsInDb=${total}`,
  );
}

main()
  .catch((err) => {
    console.error("[import-catalog] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
