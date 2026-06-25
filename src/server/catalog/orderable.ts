// Authoritative product lookup used by the order + financing services
// when a customer submits a cart. The catalog service exposes read
// helpers for marketing surfaces; this helper exists so the SERVER
// always derives unit price, name, and subline from the DB — never
// from client-supplied values.
//
// Why a separate file: keeps the cached read helpers in service.ts
// pure (no caller-specific business rules) and gives the trust-
// boundary concern an obvious home for future maintainers.

import { db } from "@/server/db";

/** What the order service needs from a product to safely write a line item. */
export type OrderableProductLine = Readonly<{
  slug: string;
  name: string;
  subline: string | null;
  /** Authoritative price in integer minor units (centimes). */
  priceFromMinor: number;
}>;

export type ResolveOrderableResult =
  | { ok: true; bySlug: ReadonlyMap<string, OrderableProductLine> }
  | { ok: false; error: string };

/**
 * Resolve a set of slugs to their authoritative product rows.
 *
 * Rules:
 *   • Products must exist, not be soft-deleted, and have status
 *     IN_STOCK or INCOMING. OUT_OF_STOCK and DISABLED rows are
 *     rejected — a buyer cannot order them even if their cart
 *     remembered them from a previous session.
 *   • Any missing/disallowed slug fails the whole resolution. We
 *     don't silently drop lines because totals would mismatch the
 *     customer's expectation and produce a confusing error later.
 *   • Caller is responsible for combining the resolved name/price
 *     with the per-line qty the customer chose.
 *
 * Bypasses the marketing catalog cache (unstable_cache) on purpose —
 * a successful order write should always see the freshest pricing
 * + availability rather than a 60s-old snapshot.
 */
export async function resolveOrderableProducts(
  slugs: readonly string[],
): Promise<ResolveOrderableResult> {
  const unique = Array.from(new Set(slugs));
  if (unique.length === 0) {
    return { ok: false, error: "No items to order." };
  }
  const rows = await db.product.findMany({
    where: {
      slug: { in: unique },
      deletedAt: null,
      status: { in: ["IN_STOCK", "INCOMING"] },
    },
    select: {
      slug: true,
      name: true,
      subline: true,
      priceFromMinor: true,
    },
  });
  const bySlug = new Map<string, OrderableProductLine>();
  for (const r of rows) {
    bySlug.set(r.slug, {
      slug: r.slug,
      name: r.name,
      subline: r.subline ?? null,
      priceFromMinor: r.priceFromMinor,
    });
  }
  const missing = unique.filter((s) => !bySlug.has(s));
  if (missing.length > 0) {
    const tail = missing.length > 1 ? "products" : "product";
    return {
      ok: false,
      error: `Unavailable ${tail}: ${missing.join(", ")}`,
    };
  }
  return { ok: true, bySlug };
}
