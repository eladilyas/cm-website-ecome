// Admin / Products — list of every catalog row.

import Link from "next/link";
import Image from "next/image";
import type { ProductStatus } from "@prisma/client";

import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth-helpers";
import {
  PageHeader,
  SectionCard,
  EmptyState,
  StatsStrip,
} from "@/components/admin/AdminPrimitives";
import {
  getCategoryLabelMap,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  PRODUCT_STATUSES,
} from "@/server/products/labels";
import { ProductStatusControl } from "@/components/admin/ProductStatusControl";
import { ImportCatalogButton } from "./ImportCatalogButton";
import { ProductsListSearch } from "./ProductsListSearch";

export const dynamic = "force-dynamic";

function parseStatusFilter(raw: string | undefined): ProductStatus | null {
  if (!raw) return null;
  return (PRODUCT_STATUSES as readonly string[]).includes(raw)
    ? (raw as ProductStatus)
    : null;
}

/** Build a /admin/products href preserving the q + status query params
 *  selectively. Pass `null` to clear a key. */
function hrefWith(input: { q?: string; status?: ProductStatus | null }): string {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdmin("/admin/products");
  const { status: rawStatus, q: rawQ } = await searchParams;
  const statusFilter = parseStatusFilter(rawStatus);
  const q = (rawQ ?? "").trim();

  // Free-text search across name, slug, subline, tagline. Case-
  // insensitive contains — good enough for a 10-100 product catalog;
  // we'll add full-text indexing if the catalog ever grows past ~1k rows.
  const searchClause = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { slug: { contains: q, mode: "insensitive" as const } },
          { subline: { contains: q, mode: "insensitive" as const } },
          { tagline: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, categoryLabels, countsByStatus] = await Promise.all([
    db.product.findMany({
      where: {
        deletedAt: null,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...searchClause,
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    }),
    getCategoryLabelMap(),
    db.product.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map<ProductStatus, number>();
  for (const row of countsByStatus) {
    countByStatus.set(row.status, row._count._all);
  }
  const totalActive = countsByStatus.reduce((s, r) => s + r._count._all, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Every active product. Status drives the en stock / en arrivage badge on /shop and the cart eligibility."
        actions={
          <div className="flex items-center gap-2">
            <ImportCatalogButton hasProducts={products.length > 0} />
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft transition-colors"
            >
              New product
            </Link>
          </div>
        }
      />

      {/* Stats strip — at-a-glance KPIs in CRM-style format. Includes
          all four statuses so admins see the catalog distribution
          before they start filtering. */}
      <StatsStrip
        items={[
          { label: "All products", value: totalActive },
          {
            label: "En stock",
            value: countByStatus.get("IN_STOCK") ?? 0,
            tone: "good",
          },
          {
            label: "En arrivage",
            value: countByStatus.get("INCOMING") ?? 0,
            tone: "warn",
          },
          {
            label: "Rupture",
            value: countByStatus.get("OUT_OF_STOCK") ?? 0,
            tone: "bad",
          },
          {
            label: "Désactivé",
            value: countByStatus.get("DISABLED") ?? 0,
            tone: "neutral",
          },
        ]}
      />

      {/* Filter row — status chips on the left, search on the right.
          Both mirror to the URL so refresh preserves scope. */}
      <div className="flex flex-wrap items-center gap-3 justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusFilterChip
            href={hrefWith({ q, status: null })}
            active={statusFilter === null}
            label={`All (${totalActive})`}
          />
          {PRODUCT_STATUSES.map((s) => {
            const count = countByStatus.get(s) ?? 0;
            return (
              <StatusFilterChip
                key={s}
                href={hrefWith({ q, status: s })}
                active={statusFilter === s}
                label={`${PRODUCT_STATUS_LABEL[s]} (${count})`}
                tone={PRODUCT_STATUS_TONE[s]}
              />
            );
          })}
        </div>
        <ProductsListSearch initialQuery={q} statusFilter={statusFilter} />
      </div>

      <SectionCard
        title={
          statusFilter
            ? `${PRODUCT_STATUS_LABEL[statusFilter]} (${products.length})`
            : `Products (${products.length})`
        }
        description="Click a row to edit any field. Status changes propagate to /shop, the home rail, and product detail pages on save."
      >
        {products.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No products in Postgres yet"
              description={`Use "Import catalog" to mirror the static catalog into the database in one click. New products land in /shop immediately.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Product</th>
                  <th className="text-left font-medium px-5 py-3">Category</th>
                  <th className="text-right font-medium px-5 py-3">
                    Price (HT)
                  </th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Updated</th>
                  <th className="w-12 px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-canvas/60 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-fog flex-shrink-0">
                          {p.heroImage ? (
                            <Image
                              src={p.heroImage}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate">
                            {p.name}
                            {p.subline && (
                              <span className="ml-1.5 text-ink-mute font-normal">
                                {p.subline}
                              </span>
                            )}
                          </p>
                          <p className="text-[11.5px] text-ink-mute truncate">
                            /{p.slug}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {categoryLabels[p.category] ?? p.category}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink tabular-nums">
                      {(p.priceFromMinor / 100).toLocaleString("fr-FR")}{" "}
                      <span className="text-[11px] text-ink-mute">
                        {p.currency}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Inline segmented control — one click flips the
                          status. The wrapping <Link> on the product cell
                          ignores clicks on the control because the
                          component calls e.stopPropagation. */}
                      <ProductStatusControl
                        productId={p.id}
                        current={p.status}
                        variant="row"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                      {new Date(p.updatedAt).toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-ink-mute hover:text-ink"
                        aria-label="Edit product"
                      >
                        →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Status filter chip ────────────────────────────────────────────────
// Small primitive used in the filter row above the products table.
// Active state borrows the StatusPill tone so the active chip visually
// echoes the row badges it filters to.

function StatusFilterChip({
  href,
  active,
  label,
  tone,
}: {
  href: string;
  active: boolean;
  label: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const dot =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "bad"
          ? "bg-red-500"
          : tone === "neutral"
            ? "bg-ink-mute"
            : null;
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-[12.5px] font-medium transition-colors " +
        (active
          ? "bg-ink text-paper border-ink"
          : "bg-paper text-ink-soft border-hairline hover:border-hairline-strong hover:text-ink")
      }
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {label}
    </Link>
  );
}
