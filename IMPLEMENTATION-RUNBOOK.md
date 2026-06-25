# Implementation Runbook — Phase 2 Onwards

This runbook is the operational complement to `ARCHITECTURE.md v2`. It
documents the **concrete steps** the engineering team executes to move
the platform from Phase 1 (contracts + design) to Phase 2 (live
backend).

The runbook is **honest about scope** — a production backend requires
provisioned cloud resources (Neon database, Cloudflare R2 bucket, Resend
account, Sentry project), secrets, and migration runs. None of those can
be created from inside the repo. What the repo **does** ship is every
artifact that *doesn't* require external resources: the schema, the
service contracts, the environment validation, and the demo
implementations that keep the site running today.

---

## What shipped in this turn (Phase 2 foundation)

| Artifact | Path | Purpose |
|---|---|---|
| **Prisma schema** | `prisma/schema.prisma` | Complete database schema covering all 12 bounded contexts. ~30 models, all enums, all indexes. Team runs `prisma migrate dev` once Neon credentials are provisioned. |
| **Environment validation** | `src/server/env.ts` | Zod-validated env vars. Fails fast at boot with a clear error if anything required is missing. `isFeatureReady()` helper lets services gracefully degrade pre-cutover. |
| **Service registry** | `src/services/index.ts` | DI point. Returns the demo impl today; flips to platform/odoo impls when their feature is configured. UI imports never change. |
| **Demo ProductService** | `src/services/impl/demo/products.ts` | Read-through wrapper over `data/catalog.ts`. Implements the full `ProductService` contract; writes throw `ForbiddenError` with a clear "demo mode" message. |
| **`zod` installed** | `package.json` | Only runtime dependency added. ~50KB, no native deps, used by env validation + future service input parsing. |

---

## Why we did not install Prisma + Better-Auth in this turn

These are **production-critical** dependencies that should be installed
in a focused dev session, not autonomously by an agent. Specifically:

1. **Prisma installs the `@prisma/client` binary engine** (~50MB,
   platform-specific). It needs `DATABASE_URL` to generate the typed
   client. Installing it without a database to point at creates a half-
   wired state that's worse than not installing.
2. **Better-Auth requires `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`**
   before it can be configured. Generating those secrets is a deliberate
   human action.
3. **Trigger.dev, Sentry, R2, Resend** all require accounts to be created
   and API keys provisioned by the operations owner.

The runbook below is the **execution checklist** for the human team to
run these installs in sequence, with no surprises.

---

## Execution checklist

### Step 0 — Provision external resources (1 day, ops owner)

Before any code change:

- [ ] Create Neon project (one branch per environment: `production`,
  `preview`, `dev`). Capture `DATABASE_URL` + `DIRECT_DATABASE_URL`.
- [ ] Create Cloudflare R2 bucket `cm-platform-files` (or per-env). Set
  bucket-level access to private. Generate API token with R2 read+write
  scope. Capture `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
- [ ] Create Resend project. Verify the sending domain (`caissemanager.com`).
  Capture `RESEND_API_KEY` + set `EMAIL_FROM`.
- [ ] Create Sentry project (Next.js). Capture `SENTRY_DSN`.
- [ ] Create Axiom dataset. Capture `AXIOM_TOKEN` + `AXIOM_DATASET`.
- [ ] Generate `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and set
  `BETTER_AUTH_URL` to the deployment URL.
- [ ] Drop all values into Vercel env vars (and `.env.local` for dev).

### Step 1 — Install Phase 2 dependencies

```bash
# Database + ORM
npm install prisma @prisma/client
npm install -D prisma

# Auth
npm install better-auth

# Files
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Observability
npm install @sentry/nextjs

# Email
npm install resend @react-email/components @react-email/render

# Background jobs (when ready for Phase 3A)
npm install @trigger.dev/sdk

# tRPC
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query

# Test framework
npm install -D vitest @vitest/ui @testing-library/react @testing-library/dom
npm install -D playwright @playwright/test
```

### Step 2 — Initialize Prisma

```bash
# Generates the client based on prisma/schema.prisma
npx prisma generate

# Creates the initial migration from the schema
npx prisma migrate dev --name init

# Sanity-check the database in Studio
npx prisma studio
```

The schema ships ready in `prisma/schema.prisma`. No manual editing
should be needed for the initial migration.

### Step 3 — Seed the roles + permissions table

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const ROLES = [
  { slug: "customer", name: "Customer" },
  { slug: "support", name: "Support Agent" },
  { slug: "sales", name: "Sales" },
  { slug: "inventory-manager", name: "Inventory Manager" },
  { slug: "finance-manager", name: "Finance Manager" },
  { slug: "marketing", name: "Marketing" },
  { slug: "admin", name: "Administrator" },
  { slug: "super-admin", name: "Super Administrator" },
] as const;

const RESOURCES = ["products", "orders", "financing", "users", "files", "audit", "settings"];
const ACTIONS = ["view", "create", "update", "delete", "approve"];

async function main() {
  // Insert roles.
  for (const r of ROLES) {
    await db.role.upsert({ where: { slug: r.slug }, update: {}, create: r });
  }
  // Insert all (resource, action) combinations.
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      await db.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
    }
  }
  // Grant default role permissions per the matrix in ARCHITECTURE.md §7.
  // ... (omitted here — runbook reader copies from §7 of the architecture doc)
}

main().finally(() => db.$disconnect());
```

Run: `npx prisma db seed`.

### Step 4 — Wire the Prisma client (server-only)

Create `src/server/db/client.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { env } from "@/server/env";

// Module-singleton pattern: one PrismaClient per Node process, reused
// across all server-side calls. In dev, Next.js HMR creates multiple
// processes — we cache on globalThis to prevent connection leaks.

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma._prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma._prisma = db;
```

### Step 5 — Implement `PlatformProductService` (the template for every service)

Create `src/services/impl/platform/products.ts`:

```typescript
import { db } from "@/server/db/client";
import type {
  Product,
  ProductFilter,
  ProductService,
  ProductSlug,
  ProductStatus,
  CreateProductInput,
  UpdateProductInput,
} from "@/services/contracts";
import { NotFoundError, ValidationError } from "@/services/contracts";

export class PlatformProductService implements ProductService {
  async list(filter?: ProductFilter): Promise<Product[]> {
    const rows = await db.product.findMany({
      where: {
        deletedAt: null,
        status: filter?.includeDisabled ? undefined : { not: "DISABLED" },
        category: filter?.category,
      },
      take: filter?.limit,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toContractProduct);
  }
  // …rest of the methods
}
```

The pattern repeats for every service. Each method translates a contract
call into a Prisma query and adapts the row to the contract type.

### Step 6 — Flip the registry

Edit `src/services/index.ts`, uncomment the `isFeatureReady("database")`
branch in `useProductService()`:

```typescript
export function useProductService(): ProductService {
  if (_productService) return _productService;
  if (isFeatureReady("database")) {
    _productService = new PlatformProductService();
  } else {
    _productService = new DemoProductService();
  }
  return _productService;
}
```

That's the cutover. UI imports stay identical; the implementation moved
from in-memory data to Postgres without any consumer touching their code.

### Step 7 — Repeat steps 5-6 for the other 9 contracts

`OrderService` → `PlatformOrderService` (uses `db.order` + state-machine
guard on `transitionStatus`).

`FinancingService` → `PlatformFinancingService`.

`FileService` → `PlatformFileService` (wraps the R2 client; signed-URL
generation via `@aws-sdk/s3-request-presigner`).

`AuditService` → `PlatformAuditService` (append-only writes to
`AuditEvent`).

`NotificationService` → `PlatformNotificationService` (writes
`NotificationDelivery` rows, enqueues a Trigger.dev job that picks the
template + fires the channel adapters).

`CustomerSuccessService`, `ContentService`, `AIAssistantService`,
`AuthService` — same pattern.

Each one is a focused 1-2 day exercise once the previous is shipping.

### Step 8 — Stand up the admin portal

Routes scaffolded per ARCHITECTURE.md §12. Each list page is `1 contract
call + table render`. Each detail page is `1-2 contract calls + tabbed
detail`. Per the IA, no design decisions remain — only implementation.

### Step 9 — Stand up the customer portal

Already partially shipped under `/account/*`. Migrate each page from its
current Zustand-backed reads to `useOrderService().list({ customerId })`
etc. UI doesn't change; the data source does.

### Step 10 — Odoo bridge (Phase 4A)

Create `src/services/impl/odoo/products.ts` implementing `ProductService`
via the Odoo XML-RPC or REST API. The OdooClient lives in
`src/server/odoo/client.ts`.

Flip `useProductService()` to prefer `OdooProductService` when
`isFeatureReady("odoo")` returns true. The platform DB stays as a fast
read replica; writes go to Odoo via the bridge.

---

## What WON'T work until the runbook is executed

The repo state after this turn:

- ✅ `prisma/schema.prisma` is valid and complete.
- ✅ `src/server/env.ts` validates env without errors when no backend vars
  are set (because they're all `.optional()`).
- ✅ `src/services/index.ts` returns the demo `ProductService` and the
  rest of the contracts are typed but not yet served.
- ❌ The Postgres database does not exist (Step 1).
- ❌ `npx prisma generate` has not been run, so `@prisma/client` types
  aren't generated — any platform impl would fail to import.
- ❌ Better-Auth is not configured.
- ❌ R2 is not configured.
- ❌ The admin portal pages don't exist (Step 8).

This is **deliberate**. The previous architecture phase committed to
"design before implement" and Phase 2's first move is provisioning, not
code. The runbook makes provisioning a 1-day operations task instead of
a discovery exercise.

---

## Estimated effort to reach Phase 2 complete

| Step | Owner | Estimated effort |
|---|---|---|
| 0. Provision external resources | Ops + Security | 1 day |
| 1. Install dependencies | Backend lead | 30 min |
| 2. Run initial migration | Backend lead | 30 min |
| 3. Seed roles + permissions | Backend lead | 30 min |
| 4. Wire Prisma client | Backend lead | 30 min |
| 5-6. Build first platform impl + flip registry | Backend lead | 1 day |
| 7. Build remaining 9 platform impls | Backend team | 1-2 weeks |
| 8. Admin portal pages | Frontend + Backend | 1 week |
| 9. Customer portal migration | Frontend | 1 week |
| 10. Odoo bridge | Backend + Odoo team | 2 weeks (parallel with Phase 4) |

**Total to Phase 2 complete (steps 0-9): 3-4 senior-engineering-weeks.**

---

## Anti-patterns to refuse on PR review

In addition to the 10 anti-patterns from ARCHITECTURE.md v2 §17:

11. **Importing from `@prisma/client` in components** — server-only code.
    Components stay on contracts.
12. **Calling `db.*` from a tRPC procedure directly** — go through the
    service. Procedures are thin transport adapters.
13. **Skipping `isFeatureReady()` guards** — code paths that assume
    `DATABASE_URL` is set must guard at the boundary.
14. **Hardcoded admin user IDs in seed scripts** — seed scripts use
    `upsert` patterns, never inline UUIDs.
15. **Schema edits without a migration name** — every `prisma migrate
    dev` invocation gets a descriptive `--name`. The migrations folder
    is the project's history.

---

## When this runbook is done

The criteria for declaring Phase 2 complete:

- [ ] Customer portal pages read live data from `/account/orders`,
      `/account/financing` — no Zustand fallback in prod.
- [ ] Admin portal renders the order queue + financing queue + product
      catalog management.
- [ ] At least one auth flow (email signup + sign-in) works end-to-end.
- [ ] Files can be uploaded to R2 + retrieved via signed URLs.
- [ ] Audit events stream into `AuditEvent` for every order/financing
      transition.
- [ ] Sentry catches uncaught errors in production.
- [ ] CI runs `vitest` + `playwright` on every PR (preview branch with
      Neon branch DB).

When all the boxes check, the platform crosses from "marketing site with
a simulator" to "platform with a marketing surface". That's the point at
which Phase 3 (Notifications + AI) becomes valuable to start.
