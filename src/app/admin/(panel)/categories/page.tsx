// Admin / Categories — full list + activate / reorder controls.

import Link from "next/link";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  EmptyState,
} from "@/components/admin/AdminPrimitives";
import { CategoriesTable } from "./CategoriesTable";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");

  const [categories, productCounts] = await Promise.all([
    db.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    }),
    db.product.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const productCountBySlug: Record<string, number> = {};
  for (const row of productCounts) {
    productCountBySlug[row.category] = row._count._all;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Drive the /shop filter rail + the homepage chip row. Deactivating a category hides it from the public site without deleting any products."
        actions={
          <Link
            href="/admin/categories/new"
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            New category
          </Link>
        }
      />

      <SectionCard
        title={`Categories (${categories.length})`}
        description="Reorder via the arrow buttons. Status toggles on click."
      >
        {categories.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No categories yet"
              description="Run `npm run categories:seed` to bootstrap from the static catalog, or create one manually."
            />
          </div>
        ) : (
          <CategoriesTable
            rows={categories.map((c) => ({
              id: c.id,
              slug: c.slug,
              label: c.label,
              description: c.description,
              isActive: c.isActive,
              displayOrder: c.displayOrder,
              productCount: productCountBySlug[c.slug] ?? 0,
            }))}
          />
        )}
      </SectionCard>

      <p className="mt-6 text-[12px] text-ink-mute">
        Active categories appear on the public site (in the /shop filter
        rail, the home page chip row, and breadcrumbs).{" "}
        <StatusPill label="Inactive" tone="neutral" />{" "}
        categories remain in the DB but stay hidden from customers.
      </p>
    </div>
  );
}
