// Demo ProductService — wraps the existing static `data/catalog.ts` so
// the contract layer becomes usable in the marketing site immediately,
// without any database.
//
// This is a fully-functional implementation in the contract sense —
// reads return real Product shapes; writes throw a clear "not supported
// in demo" error. When Phase 2 lands, PlatformProductService replaces
// this without UI changes.
//
// Read methods:
//   ✓ list() filters disabled products (none in catalog today, but the
//     filter is correct so the contract behaviour holds).
//   ✓ get() returns null for unknown slugs (not throw — contract requires
//     null on miss).
//   ✓ listAll() returns everything including any disabled (parity with
//     production).
//
// Write methods throw ForbiddenError — demo mode is read-only.

import { CATALOG, CATALOG_BY_SLUG, type CatalogProduct } from "@/data/catalog";
import {
  ForbiddenError,
  NotFoundError,
  type CreateProductInput,
  type Product,
  type ProductFilter,
  type ProductService,
  type ProductSlug,
  type ProductStatus,
  type UpdateProductInput,
} from "@/services/contracts";

const DEMO_READONLY_REASON =
  "Demo mode — product writes require the platform backend " +
  "(Phase 2A). Set DATABASE_URL to enable.";

export class DemoProductService implements ProductService {
  // ── Read ──────────────────────────────────────────────────────────

  async list(filter?: ProductFilter): Promise<Product[]> {
    let items = CATALOG.map(toContractProduct);

    // Public listing filters out disabled products by default.
    if (!filter?.includeDisabled) {
      items = items.filter((p) => p.status !== "disabled");
    }

    if (filter?.category) {
      items = items.filter((p) => p.category === filter.category);
    }
    if (filter?.status && filter.status !== "any") {
      items = items.filter((p) => p.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q),
      );
    }

    if (filter?.limit && filter.limit > 0) {
      items = items.slice(0, filter.limit);
    }
    return items;
  }

  async get(slug: ProductSlug): Promise<Product | null> {
    const raw = CATALOG_BY_SLUG[slug];
    return raw ? toContractProduct(raw) : null;
  }

  async listAll(filter?: ProductFilter): Promise<Product[]> {
    return this.list({ ...filter, includeDisabled: true });
  }

  // ── Write — demo is read-only ──────────────────────────────────────

  async create(input: CreateProductInput): Promise<Product> {
    void input;
    throw new ForbiddenError(DEMO_READONLY_REASON);
  }

  async update(slug: ProductSlug, patch: UpdateProductInput): Promise<Product> {
    void patch;
    // Validate the slug exists so the error message is helpful, then
    // refuse the write.
    if (!CATALOG_BY_SLUG[slug]) {
      throw new NotFoundError("Product", slug);
    }
    throw new ForbiddenError(DEMO_READONLY_REASON);
  }

  async setStatus(slug: ProductSlug, status: ProductStatus): Promise<Product> {
    void status;
    if (!CATALOG_BY_SLUG[slug]) {
      throw new NotFoundError("Product", slug);
    }
    throw new ForbiddenError(DEMO_READONLY_REASON);
  }

  async delete(slug: ProductSlug): Promise<void> {
    if (!CATALOG_BY_SLUG[slug]) {
      throw new NotFoundError("Product", slug);
    }
    throw new ForbiddenError(DEMO_READONLY_REASON);
  }
}

// ── Adapter: CatalogProduct (data/) → Product (contract) ────────────────
// The contract's `Product` is the stable shape every consumer sees. The
// raw `CatalogProduct` shape is the data-file format. This adapter is
// the only place the two are coupled — when Phase 2 lands and the data
// moves to Postgres, only this function disappears.

function toContractProduct(p: CatalogProduct): Product {
  // Map the catalog's `availability.status` (in-stock | incoming) +
  // implicit-active state to the contract's ProductStatus union.
  const status: ProductStatus =
    p.availability?.status === "incoming" ? "incoming" : "in-stock";

  return Object.freeze({
    slug: p.slug,
    name: p.name,
    subline: p.subline,
    tagline: p.tagline,
    category: p.category,
    status,
    heroImage: p.heroImage,
    alt: p.alt,
    shortDescription: p.shortDescription,
    features: [...p.features],
    specs: p.specs.map((s) => Object.freeze({ ...s })),
    priceFrom: Object.freeze({ amount: p.priceFrom, currency: "MAD" as const }),
    leadWeeks: p.availability?.leadWeeks,
    complementaryWith: [...p.complementaryWith],
    // The data file doesn't store timestamps — synthesize stable values
    // so the contract type is satisfied. Phase 2 reads real timestamps.
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}
