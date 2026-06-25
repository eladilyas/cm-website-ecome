// Shared catalog types — the single shape consumed by every product
// surface (server + client). Matches the historical `CatalogProduct`
// shape so the frontend migration touches imports + async boundaries
// only; no field-by-field rewrite needed at call sites.

export type CatalogCategorySlug = string;

export type CatalogCategory = Readonly<{
  slug: CatalogCategorySlug;
  label: string;
  description: string | null;
  heroImage: string | null;
  isActive: boolean;
  displayOrder: number;
  /** Slug of the parent category — null for top-level. The shop +
   *  header consume this to render a two-level tree (POS Périphériques
   *  → Écran / Scanner / etc.). */
  parentSlug: string | null;
}>;

export type ProductSpec = Readonly<{
  label: string;
  value: string;
}>;

export type ProductAvailability = Readonly<{
  status: "in-stock" | "incoming";
  leadWeeks?: number;
}>;

export type CatalogProduct = Readonly<{
  slug: string;
  name: string;
  subline?: string;
  tagline: string;
  category: CatalogCategorySlug;
  heroImage: string;
  alt: string;
  shortDescription: string;
  features: string[];
  specs: ProductSpec[];
  /** Display price in MAD whole units (HT). */
  priceFrom: number;
  availability?: ProductAvailability;
  complementaryWith: string[];

  // Merchandising — optional on the type so the legacy static
  // CATALOG export (which doesn't carry them) still type-checks
  // during the migration. Postgres rows always have values.
  featured?: boolean;
  displayOrder?: number;
  badges?: string[];
}>;

/** Status badge label tone used by AvailabilityBadge / Pill. */
export type AvailabilityTone = "in-stock" | "incoming" | "disabled";
