// Catalog service — single source of truth for product + category reads.
//
// Server components and route handlers call these directly. Client
// surfaces consume via CatalogProvider which is hydrated server-side
// once per request.
//
// Cache: Next's `unstable_cache` with tag-based revalidation. Admin
// mutations call `revalidateTag("catalog")` to invalidate; reads
// outside an admin mutation hit the cache.

import { unstable_cache } from "next/cache";
import type { Product as DbProduct, Category as DbCategory } from "@prisma/client";

import { db } from "@/server/db";
import type {
  CatalogCategory,
  CatalogProduct,
  ProductAvailability,
  ProductSpec,
} from "./types";

export const CATALOG_TAG = "catalog";

// ── DB resilience helper ───────────────────────────────────────────────
//
// Neon's free-tier serverless Postgres cold-starts can take 3–6 seconds
// to wake from idle, and during that window every Prisma call rejects
// with `PrismaClientKnownRequestError: Can't reach database server …`.
// Every public-facing read flows through these cached helpers, so a
// single cold-start was 500-ing entire pages (home, shop, product
// detail) until the connection warmed up.
//
// `withDbFallback` swallows reach-the-server errors and returns a safe
// empty value. Genuine query bugs still throw (they have different
// error codes). Server logs the failure so we know when cold-starts
// are happening in prod.
async function withDbFallback<T>(
  label: string,
  query: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await query();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Match the connection-class errors Neon emits during cold-start
    // and during the rare deploy where the pooler is briefly
    // unreachable. Everything else re-throws so unexpected bugs stay
    // loud in dev.
    const isReachError =
      /Can't reach database server|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated|getaddrinfo/i.test(
        msg,
      );
    if (!isReachError) throw err;
    console.error(`[catalog] ${label} fallback — db unreachable: ${msg}`);
    return fallback;
  }
}

// ── Row mappers ────────────────────────────────────────────────────────

function toCatalogProduct(row: DbProduct): CatalogProduct {
  const features = (Array.isArray(row.features) ? row.features : []) as string[];
  const specs = (Array.isArray(row.specs) ? row.specs : []) as ProductSpec[];
  const complementary = (Array.isArray(row.complementaryWithSlugs)
    ? row.complementaryWithSlugs
    : []) as string[];
  const badges = (Array.isArray(row.badges) ? row.badges : []) as string[];

  // Status → public availability mapping. OUT_OF_STOCK and DISABLED
  // don't reach this function (callers filter via `activeOnly`).
  const availability: ProductAvailability | undefined =
    row.status === "IN_STOCK"
      ? { status: "in-stock" }
      : row.status === "INCOMING"
        ? { status: "incoming", leadWeeks: row.leadWeeks ?? undefined }
        : undefined;

  return {
    slug: row.slug,
    name: row.name,
    subline: row.subline ?? undefined,
    tagline: row.tagline,
    category: row.category,
    heroImage: row.heroImage,
    alt: row.alt,
    shortDescription: row.shortDescription,
    features,
    specs,
    priceFrom: Math.round(row.priceFromMinor) / 100,
    availability,
    complementaryWith: complementary,
    featured: row.featured,
    displayOrder: row.displayOrder,
    badges,
  };
}

function toCatalogCategory(
  row: DbCategory & { parent?: { slug: string } | null },
): CatalogCategory {
  return {
    slug: row.slug,
    label: row.label,
    description: row.description ?? null,
    heroImage: row.heroImage ?? null,
    isActive: row.isActive,
    displayOrder: row.displayOrder,
    parentSlug: row.parent?.slug ?? null,
  };
}

// ── Cached readers ─────────────────────────────────────────────────────

/** Every product visible to the public site. Excludes disabled +
 *  soft-deleted rows. Ordered by displayOrder asc, then name. */
export const listPublicProducts = unstable_cache(
  async (): Promise<CatalogProduct[]> =>
    withDbFallback(
      "listPublicProducts",
      async () => {
        const rows = await db.product.findMany({
          where: {
            deletedAt: null,
            status: { in: ["IN_STOCK", "INCOMING"] },
          },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        });
        return rows.map(toCatalogProduct);
      },
      [],
    ),
  ["catalog:listPublicProducts"],
  { tags: [CATALOG_TAG] },
);

/** Internal — every product including disabled, for admin reads. */
export const listAllProducts = unstable_cache(
  async (): Promise<CatalogProduct[]> =>
    withDbFallback(
      "listAllProducts",
      async () => {
        const rows = await db.product.findMany({
          where: { deletedAt: null },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        });
        return rows.map(toCatalogProduct);
      },
      [],
    ),
  ["catalog:listAllProducts"],
  { tags: [CATALOG_TAG] },
);

/** Single product by slug, public-visible. Null when not found / hidden.
 *  Also null when the DB is unreachable — the caller (product detail
 *  page) renders notFound() in that case, which is recoverable. */
export const getPublicProductBySlug = unstable_cache(
  async (slug: string): Promise<CatalogProduct | null> =>
    withDbFallback(
      `getPublicProductBySlug(${slug})`,
      async () => {
        const row = await db.product.findFirst({
          where: {
            slug,
            deletedAt: null,
            status: { in: ["IN_STOCK", "INCOMING"] },
          },
        });
        return row ? toCatalogProduct(row) : null;
      },
      null,
    ),
  ["catalog:getPublicProductBySlug"],
  { tags: [CATALOG_TAG] },
);

/** Featured products — drives the home page rail. Bounded by `limit`. */
export const listFeaturedProducts = unstable_cache(
  async (limit = 12): Promise<CatalogProduct[]> =>
    withDbFallback(
      "listFeaturedProducts",
      async () => {
        const rows = await db.product.findMany({
          where: {
            deletedAt: null,
            featured: true,
            status: { in: ["IN_STOCK", "INCOMING"] },
          },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          take: limit,
        });
        return rows.map(toCatalogProduct);
      },
      [],
    ),
  ["catalog:listFeaturedProducts"],
  { tags: [CATALOG_TAG] },
);

/** Active categories — public-visible, ordered by displayOrder. */
export const listPublicCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> =>
    withDbFallback(
      "listPublicCategories",
      async () => {
        const rows = await db.category.findMany({
          where: { isActive: true },
          orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
          include: { parent: { select: { slug: true } } },
        });
        return rows.map(toCatalogCategory);
      },
      [],
    ),
  ["catalog:listPublicCategories"],
  { tags: [CATALOG_TAG] },
);

/** All categories including inactive — admin-only. */
export const listAllCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> =>
    withDbFallback(
      "listAllCategories",
      async () => {
        const rows = await db.category.findMany({
          orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
          include: { parent: { select: { slug: true } } },
        });
        return rows.map(toCatalogCategory);
      },
      [],
    ),
  ["catalog:listAllCategories"],
  { tags: [CATALOG_TAG] },
);

/** Lookup map by slug — convenience for cart/order rendering. */
export async function getPublicProductIndex(): Promise<
  Record<string, CatalogProduct>
> {
  const list = await listPublicProducts();
  const map: Record<string, CatalogProduct> = {};
  for (const p of list) map[p.slug] = p;
  return map;
}

/** Active category label map — same shape as legacy CATEGORY_LABEL. */
export async function getActiveCategoryLabels(): Promise<
  Record<string, string>
> {
  const list = await listPublicCategories();
  const map: Record<string, string> = {};
  for (const c of list) map[c.slug] = c.label;
  return map;
}
