# Service contracts — the Odoo-ready boundary

This directory holds **TypeScript interfaces only**. No implementations.

It exists to enforce one architectural commitment from `ARCHITECTURE.md`:

> UI components import service _interfaces_, never implementations.

When the backend lands (Postgres + Auth + Files) the implementations go in
`src/services/impl/platform/`. When Odoo lands as source-of-truth for
products and inventory, the affected implementations move to
`src/services/impl/odoo/`. **UI consumers never change** — they keep
importing from `@/services/contracts/products` or whichever domain.

## Adoption guide

### 1. Reading from a service (UI side)

```tsx
import { useProductService } from "@/services";

export default async function ShopPage() {
  const products = await useProductService().list({ status: "in-stock" });
  return <ProductGrid products={products} />;
}
```

The component **never** imports from `data/catalog.ts` directly. The
service is the only path.

### 2. Adding a method to a contract

1. Open the relevant `*.ts` interface file (e.g. `products.ts`).
2. Add the method signature.
3. Update every implementation (`impl/demo/`, `impl/platform/`, `impl/odoo/`).
4. Update consumers.

TypeScript catches the implementation gap at compile time — that's the
whole point.

### 3. Adding a new domain

1. Drop a new file in `contracts/` with the interface.
2. Re-export from `contracts/index.ts`.
3. Implement in `impl/demo/` first (cheapest), then `impl/platform/` when
   the database is ready.

## Rules

| ✅ Do | ❌ Don't |
|---|---|
| Import from `@/services/contracts/*` in UI | Import from `@/server/db`, `@/services/impl/*` in UI |
| Return immutable domain objects (`Readonly<T>`) | Return Prisma/Drizzle row types directly |
| Use the shared types in `types.ts` | Define `Product` locally in 4 different files |
| Make every mutating method emit an `AuditEvent` via `AuditService` | Mutate state without logging |
| Validate inputs with `zod` at the service boundary | Trust UI-supplied values inside the service |
| Throw typed errors (`NotFoundError`, `ForbiddenError`, `ValidationError`) | Return `{ ok: false, error: "..." }` ad-hoc shapes |

## Status

These contracts are **design artifacts** in v1.0. They compile so the
folder lays the groundwork for Phase 2 implementation work, but no UI
code imports them yet. The plan:

1. **Phase 2 kickoff** — implement `impl/demo/` adapters wrapping the
   current Zustand stores. UI imports migrate from stores to contracts,
   one domain at a time.
2. **Phase 2 cutover** — `impl/platform/` lands with real DB. Service
   registry swaps implementations behind a feature flag.
3. **Phase 3** — `impl/odoo/` lands for catalog domains.

See `ARCHITECTURE.md` at the project root for the full rationale.
