// Categories seeder — mirrors the static `CATEGORY_LABEL` in
// src/data/catalog.ts into Postgres so the admin has a starting set.
//
// Idempotent: rerun anytime; existing categories are updated, missing
// ones inserted. Never destructive — admin-added categories survive.

import { PrismaClient } from "@prisma/client";

import { CATEGORY_LABEL } from "../src/data/catalog";

const db = new PrismaClient();

const SEED: Array<{
  slug: string;
  label: string;
  displayOrder: number;
}> = Object.entries(CATEGORY_LABEL).map(([slug, label], index) => ({
  slug,
  label,
  displayOrder: (index + 1) * 10,
}));

async function main(): Promise<void> {
  console.log(
    `[seed-categories] upserting ${SEED.length} categories from CATEGORY_LABEL…`,
  );
  for (const c of SEED) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        displayOrder: c.displayOrder,
        isActive: true,
      },
      update: {
        label: c.label,
      },
    });
    console.log(`  ✓ ${c.slug}`);
  }
  console.log("[seed-categories] done.");
}

main()
  .catch((err) => {
    console.error("[seed-categories] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
