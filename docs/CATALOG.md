# Catalog

Product + Category schema, the cache contract, and how the storefront stays consistent.

## Data model

```
Category                       Product
├─ id                          ├─ id
├─ slug          UNIQUE        ├─ slug                UNIQUE
├─ label                       ├─ name
├─ description                 ├─ subline
├─ heroImage                   ├─ tagline
├─ isActive                    ├─ category            FK-by-string → Category.slug
├─ displayOrder                ├─ heroImage
├─ parentId      self-ref      ├─ alt
├─ parent                      ├─ shortDescription
├─ children[]                  ├─ features (Json)
├─ deletedAt                   ├─ specs (Json)
                               ├─ priceFromMinor      integer minor (centimes)
                               ├─ status              IN_STOCK | INCOMING |
                               │                       OUT_OF_STOCK | DISABLED
                               ├─ leadWeeks           int? (for INCOMING)
                               ├─ availability  derived from status
                               ├─ featured           boolean
                               ├─ displayOrder       int
                               ├─ badges (Json)
                               ├─ complementaryWithSlugs (Json)
                               ├─ deletedAt
```

The **6-category top-level taxonomy** (after `shop:restructure`):

```
POS Terminal       (pos-terminal)        — Swan 1, WDLink WD15M
POS Tablette       (pos-tablette)        — empty for now
POS Portable       (pos-portable)        — Swift 1 Pro, Swift 2 Pro, Swift 2 Ultra
POS Périphériques  (pos-peripheriques)
  ├─ Écran         (peripheriques-ecran)
  ├─ Scanner       (peripheriques-scanner)
  ├─ Imprimante    (peripheriques-imprimante)
  ├─ Tiroir caisse (peripheriques-tiroir-caisse)
  ├─ Afficheur     (peripheriques-afficheur)
  └─ Lecteur       (peripheriques-lecteur)
POS Kiosk          (pos-kiosk)           — Heron 1 / Heron 1 Mini
Accès & Présence   (acces-presence)      — empty for now
```

## Read path

```
Server component / route handler
   │
   ▼
src/server/catalog/service.ts
   ├─ listPublicProducts()         active products
   ├─ listAllProducts()             includes disabled (admin)
   ├─ getPublicProductBySlug(slug)
   ├─ listFeaturedProducts(limit)
   ├─ listPublicCategories()        active categories
   ├─ listAllCategories()           includes inactive (admin)
   ├─ getPublicProductIndex()       slug → product map
   └─ getActiveCategoryLabels()     slug → label map
   │
   ▼  (server only — wrapped in unstable_cache)
   │
db.product.findMany / db.category.findMany
```

Every public-facing reader is wrapped in `unstable_cache` with the tag `catalog`. Cold-start failures (Neon free-tier wake-up) are caught by `withDbFallback` and surfaced as empty arrays / `null` instead of crashing the request.

## Client hydration

```
CatalogHydrator (server) ────fetches catalog once per request────► CatalogProvider (client)
                                                                       │
                                                                       ▼  via useCatalog()
                                                  Header, CartDrawer, RailProductCard,
                                                  ProductCard, CategoryStrip,
                                                  StoreShowcaseSection, ProductDetailPage
```

[`<CatalogProvider />`](../src/components/catalog/CatalogProvider.tsx) is mounted once at the root via `SiteChrome` and exposes:

```ts
const { products, productsBySlug, categories, categoryLabels } = useCatalog();
```

Client surfaces NEVER fetch the catalog directly. They read the hydrated context.

## Cache invalidation contract

**Admin mutations MUST call `revalidateTag("catalog")` after any catalog change.**

Mutations that change the catalog:
- Product CRUD (`src/server/products/*` actions)
- Category CRUD (admin/(panel)/categories/* actions)
- `shop:restructure` script

The tag is the constant `CATALOG_TAG` exported from `src/server/catalog/service.ts` — always reference the constant, never the string literal, so a rename is a compile error.

## Order-time price lookup

Carts hold `{slug, qty}` only. At checkout the server resolves them via [`resolveOrderableProducts()`](../src/server/catalog/orderable.ts):

```
resolveOrderableProducts(["swan-1-gen-2", "swift-2-pro"])
  ↓
db.product.findMany({
  where: {
    slug: { in: [...] },
    deletedAt: null,
    status: { in: ["IN_STOCK", "INCOMING"] },
  },
})
  ↓
Returns { ok: true, bySlug: Map<slug, { name, subline, priceFromMinor }> }
or { ok: false, error: "Unavailable products: …" }
```

This helper deliberately **bypasses the unstable_cache** — a successful order write should always see the freshest pricing + availability, not a 60s-old snapshot. See [PAYMENTS.md](PAYMENTS.md#trust-boundary-critical) for why.

## Parent / child filtering on the storefront

The `?category=` URL param accepts any category slug. The shop page expands a parent slug to include its children:

```
/shop?category=pos-peripheriques
  ↓
products.filter(p => allowed.has(p.category)) where allowed = {
  "pos-peripheriques",
  "peripheriques-ecran",
  "peripheriques-scanner",
  "peripheriques-imprimante",
  "peripheriques-tiroir-caisse",
  "peripheriques-afficheur",
  "peripheriques-lecteur",
}
```

The Store dropdown (`src/lib/nav.tsx`) wires the parent slug as the top-level link and the children as sub-items.

## The shop:restructure script

[`scripts/restructure-shop-categories.ts`](../scripts/restructure-shop-categories.ts) is the migration script that established the 6-category tree:

1. Snapshot current state to console.
2. Upsert the 6 top-level + 6 sub-categories (idempotent).
3. Remap every existing product to its new category slug via the `PRODUCT_REMAP` table inside the script.
4. Soft-disable legacy top-level slugs that are no longer surfaced.

Idempotent — safe to re-run. Adding a new product? Edit `PRODUCT_REMAP` and re-run.

## Catalog provider lifecycle

```
Request enters
   │
   ▼
RootLayout (server)
   ├─ SiteChrome (server)
   │   ├─ CatalogHydrator (server)
   │   │   ├─ listPublicProducts()      ───┐
   │   │   └─ listPublicCategories()    ───┤  hit unstable_cache
   │   │                                   │
   │   ▼                                   │
   ├─ CatalogProvider (client)  ◄──────────┘  hydrated payload
   │   └─ children
```

Every public page wraps in CatalogProvider. Admin pages don't — they read directly from the service.

## Known sharp edges

- **`Product.category` is a string referencing `Category.slug`, not a real FK.** Renaming a slug silently orphans every product in that category. Use `shop:restructure` (or the admin UI) to remap explicitly. Tracked as a follow-up — converting to a real FK requires care with the cascade behavior.
- **`Category.parent` is a self-relation via `parentId`**, which IS a real FK. Children CASCADE on parent delete; in practice parents are never hard-deleted (they have `deletedAt` and `isActive`).
- **Cache invalidation forgetting** — if a new admin mutation skips `revalidateTag("catalog")`, the storefront serves stale data until the next deploy. Always include it in new mutations.
