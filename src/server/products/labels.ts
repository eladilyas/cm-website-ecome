// Product / category label helpers shared by admin pages.
//
// Status labels are static (Moroccan-French copy live in the brief).
// Category labels are LIVE — derived from the Category table via
// `listAllCategories()` so admin-managed renames flow through every
// surface without redeploys.

import type { ProductStatus } from "@prisma/client";

import { listAllCategories } from "@/server/catalog/service";

// ── Status labels ──────────────────────────────────────────────────────

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  IN_STOCK: "En stock",
  INCOMING: "En arrivage",
  OUT_OF_STOCK: "Rupture",
  DISABLED: "Désactivé",
};

export const PRODUCT_STATUS_TONE: Record<
  ProductStatus,
  "good" | "warn" | "bad" | "neutral"
> = {
  IN_STOCK: "good",
  INCOMING: "warn",
  OUT_OF_STOCK: "bad",
  DISABLED: "neutral",
};

export const PRODUCT_STATUSES: ProductStatus[] = [
  "IN_STOCK",
  "INCOMING",
  "OUT_OF_STOCK",
  "DISABLED",
];

// ── Categories (live) ──────────────────────────────────────────────────

/** Map of `slug → label`, derived from the live Category table. Use
 *  inside server components / route handlers. */
export async function getCategoryLabelMap(): Promise<Record<string, string>> {
  const list = await listAllCategories();
  const map: Record<string, string> = {};
  for (const c of list) map[c.slug] = c.label;
  return map;
}

/** Dropdown options for admin product forms. Includes EVERY category
 *  (even inactive ones) so admins can move a product from one category
 *  to another even if the destination is hidden from the public site. */
export async function getCategoryOptionsForAdmin(): Promise<
  { slug: string; label: string; isActive: boolean }[]
> {
  const list = await listAllCategories();
  return list.map((c) => ({
    slug: c.slug,
    label: c.label,
    isActive: c.isActive,
  }));
}
