// ProductService — catalog contract.
//
// Ownership timeline:
//   Phase 1 (now)    — static `data/catalog.ts`, wrapped by impl/demo/
//   Phase 2          — Platform Postgres, full CRUD by impl/platform/
//   Phase 3 (Odoo)   — read-through to Odoo by impl/odoo/. Writes only
//                      via admin operations in Odoo directly; the
//                      website becomes a consumer.
//
// "disabled" products MUST be excluded from public listing methods.
// Admin listing methods include them. The status filter is explicit.

import type {
  Money,
  Product,
  ProductCategory,
  ProductSlug,
  ProductStatus,
} from "./types";

export type ProductFilter = Readonly<{
  category?: ProductCategory;
  status?: ProductStatus | "any";
  /** Defaults to false — public callers get only published products. */
  includeDisabled?: boolean;
  search?: string;
  limit?: number;
  cursor?: string;
}>;

export type CreateProductInput = Readonly<{
  slug: ProductSlug;
  name: string;
  subline?: string;
  tagline: string;
  category: ProductCategory;
  heroImage: string;
  alt: string;
  shortDescription: string;
  features: string[];
  specs: ReadonlyArray<{ label: string; value: string }>;
  priceFrom: Money;
  leadWeeks?: number;
  complementaryWith?: ProductSlug[];
}>;

export type UpdateProductInput = Readonly<Partial<Omit<CreateProductInput, "slug">>>;

export interface ProductService {
  // Read ────────────────────────────────────────────────────────────────
  /** Public catalog browse. Filters disabled products by default. */
  list(filter?: ProductFilter): Promise<Product[]>;
  get(slug: ProductSlug): Promise<Product | null>;

  /** Admin browse — includes disabled products. Gated upstream. */
  listAll(filter?: ProductFilter): Promise<Product[]>;

  // Write (admin) ───────────────────────────────────────────────────────
  create(input: CreateProductInput): Promise<Product>;
  update(slug: ProductSlug, patch: UpdateProductInput): Promise<Product>;
  setStatus(slug: ProductSlug, status: ProductStatus): Promise<Product>;
  /** Soft delete — disables instead of removing, preserves order history. */
  delete(slug: ProductSlug): Promise<void>;
}
