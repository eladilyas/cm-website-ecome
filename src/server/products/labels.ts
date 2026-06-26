// Server-only helpers that read the live Category table.
//
// The `server-only` import makes this file unusable from a `use client`
// component: Next will refuse to compile any client module that
// transitively imports it. Combined with the constants split in
// `labels.constants.ts`, the boundary is enforced at build time.
//
// If you need PRODUCT_STATUS_LABEL / PRODUCT_STATUS_TONE / PRODUCT_STATUSES
// from a client component, import from `labels.constants` instead.

import "server-only";

import { listAllCategories } from "@/server/catalog/service";

// Re-export the pure constants for server callers that want a single
// entry point. Server code is welcome to import from either file.
export {
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  PRODUCT_STATUSES,
} from "./labels.constants";

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
