# Decisions

Short, dated rationales for the choices that shaped this codebase. New decisions get appended; old decisions are marked stale, not deleted, so future readers can understand the trajectory.

## DB: Prisma 6 on Neon Postgres

**Decision.** Single Postgres on Neon for everything. Prisma 6 with migration history.

**Why.** Neon's serverless model fits a B2B site whose load is bursty + low-volume. Free tier covers dev; pooled connection scales horizontally. Prisma's type-safety + the schema's annotations (every table tagged with its bounded context) give us a single auditable source of truth for the data model.

**Sharp edges.**
- Cold starts take 3–6 seconds when the project is idle. `withDbFallback` in `src/server/catalog/service.ts` swallows the reach-the-server error and returns empty arrays so pages don't 500.
- Dev and prod share **one Neon branch** today. Destructive scripts (`db:reset`, `wipe-data`) carry NODE_ENV guards but the safer fix is splitting the branches.

## Auth: Better-Auth, not NextAuth / Clerk

**Decision.** Self-hosted [Better-Auth](https://www.better-auth.com/) with Prisma adapter.

**Why.** NextAuth's session-cookie story has rough edges with the App Router + RSC + middleware. Better-Auth is purpose-built for that stack — its session API is callable from server components without re-fetch. No third party means no per-MAU pricing and customer email addresses never leave our infrastructure.

**Sharp edges.**
- Smaller community than NextAuth. Custom flows (password reset, magic link) require reading the source.
- 2FA isn't wired today. Better-Auth ships a plugin; enabling it is a future task.

## Auth: Customer vs operator split

**Decision.** Same Better-Auth instance, two sign-in pages, role-driven redirect after sign-in.

**Why.** Customers and operators share an email-and-password backend, but the UX surfaces are entirely different: customers see a buyer-friendly Apple-store-style site; operators see a dark admin panel. Routing operators into the customer chrome by accident was a real bug; mounting the admin sign-in OUTSIDE the `(panel)` route group means it can render without itself triggering the operator-gate.

## i18n: next-intl with as-needed prefix

**Decision.** FR default at `/`, EN under `/en`, `/admin` and `/api` never localized.

**Why.** Most visitors land in French (Morocco). Putting `/fr/` on every page is noise. The as-needed prefix gives French the cleanest URLs without losing English. Admin is an internal tool — translating it would slow new operators down with localized error strings during onboarding.

**Sharp edges.**
- Middleware has to know which paths to skip (admin/api/_next). Misconfiguring this is what caused the early `/admin/(panel)` 404s.
- Static metadata generation needs explicit `generateMetadata` per page so hreflang attributes are correct — easy to forget on new routes.

## Routing: route groups for layout swap

**Decision.** `src/app/admin/(panel)/*` is a route group. The folder name is in parens so it doesn't appear in the URL.

**Why.** `/admin/(panel)/orders` is reachable as `/admin/orders`, but the `(panel)` segment carries its own `layout.tsx` that wraps every page in the admin chrome + operator gate. Sibling `src/app/admin/signin/` is OUTSIDE the panel, so it can render without that gate. Same trick used for `(auth)` under `[locale]`.

## Money: integer minor units (centimes)

**Decision.** All money values in Postgres are integer minor units. Conversion to whole MAD happens at the display boundary.

**Why.** `Number.parseFloat("12.45") + 0.10 = 12.549999...` — floating-point drift is a real money risk. Integer-only math keeps totals exact.

**Convention.** Field naming: any column ending in `Minor` is centimes. `minorToWhole()` + `wholeToMinor()` helpers live in the order service.

## Payment: stubs first, integrations later

**Decision.** Today CMI is a 1.5-second "Redirecting to CMI…" overlay that ends on a success page with the order in `AWAITING_PAYMENT`. Wafasalaf doesn't connect to Wafasalaf's APIs either.

**Why.** Real integrations need merchant credentials + signed callbacks + production-grade error paths. We needed the user-facing flow shipped before that paperwork closed. Treating CMI orders as `AWAITING_PAYMENT` (not `PROCESSING`) means a stubbed flow can't be exploited to mint paid orders.

**See.** [PAYMENTS.md](PAYMENTS.md) for the trust boundary, [src/server/orders/service.ts](../src/server/orders/service.ts) for the resolver, [src/lib/wafasalaf.ts](../src/lib/wafasalaf.ts) for the calculator.

## Catalog: cached reads, server-side resolution on write

**Decision.** Public catalog reads go through `unstable_cache` tagged `catalog`. Order-time price lookup bypasses the cache.

**Why.** Most visitors will never order — the storefront has to be fast, and the catalog rarely changes. Admin mutations call `revalidateTag("catalog")` for immediate consistency. But a successful order write must see the FRESHEST prices + availability, not a 60s snapshot, so it queries the DB directly via `resolveOrderableProducts()`.

## State machines: enforced server-side

**Decision.** Order + financing transitions are validated by `canTransitionTo()` (orders) and the equivalent for financing. The UI only OFFERS legal next states; the server REJECTS illegal ones.

**Why.** UI guards are usability; server guards are security. A hostile client can POST any `toStatus` it wants — the server is the only thing that decides whether the transition is legal.

## POS simulator: localStorage-only, deliberately

**Decision.** Everything under `/[locale]/demo` runs on a Zustand + localStorage store. Nothing under `src/components/demo/*` imports from `src/server/*`.

**Why.** The simulator is a marketing tool — visitors should be able to play without creating an account or filling a DB with junk transactions. Wiring it to the real backend would conflate two unrelated systems and slow the demo down.

**Convention.** Any change that crosses the boundary is a bug. `src/server/policy/index.ts` and friends are off-limits from demo code; the demo store lives only in `src/lib/demoStore.ts`.

## Deployment: VPS, not Vercel

**Decision.** A single Hostinger VPS with systemd, deployed by rsync + npm ci + build + restart. No Vercel.

**Why.** Hosting cost predictability + the VPS already runs other apps (CRM, HR, ShiftManager) on the same hardware. A single SSH key gets you to any of them. Vercel would mean two billing relationships and split tooling.

**Sharp edges.**
- No automatic preview deploys. PR review = "trust the diff + the CI gate."
- HTTPS isn't terminated upstream yet. CSP/HSTS knobs are env-gated to handle the HTTP-only window.

## Git: introduced in F1 of the production-hardening pass

**Decision.** The repo was put under version control as a single baseline commit on `main`. No history before that.

**Why.** The prior development used timestamped backup folders (`cm-website-backup-v1..v4`) instead of git. Carrying that across the handover would have been confusing; starting clean lets the new team build a clean history forward.

**Caveat.** Anything that was leaked-in-chat (R2 keys, Resend API keys) is presumed compromised regardless of git status — see [SECRETS.md](SECRETS.md).
