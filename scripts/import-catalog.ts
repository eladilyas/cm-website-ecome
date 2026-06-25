// One-shot mirror of src/data/catalog.ts → Postgres Product table.
// Idempotent: existing slugs are skipped.

import { PrismaClient } from "@prisma/client";

import { CATALOG } from "../src/data/catalog";

const db = new PrismaClient();

async function main(): Promise<void> {
  let inserted = 0;
  let skipped = 0;
  for (const p of CATALOG) {
    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      skipped++;
      continue;
    }
    const status =
      p.availability?.status === "incoming" ? "INCOMING" : "IN_STOCK";
    await db.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        subline: p.subline ?? null,
        tagline: p.tagline,
        category: p.category,
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
        featured: false,
        displayOrder: 100,
        badges: [],
      },
    });
    inserted++;
    console.log(`  + ${p.slug}`);
  }
  console.log(
    `[import-catalog] inserted=${inserted}, skipped=${skipped}, total=${CATALOG.length}`,
  );
}

main()
  .catch((err) => {
    console.error("[import-catalog] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
