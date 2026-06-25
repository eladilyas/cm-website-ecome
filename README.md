# Caisse Manager — website

Marketing site, B2B commerce flow, customer portal, and admin panel for [Caisse Manager](https://caissemanager.com) — a Moroccan POS platform. Single Next.js application, deployed on a self-managed VPS.

```
Public marketing       /[locale]/                        (FR default, EN under /en)
Commerce               /shop · /cart · /checkout
Customer portal        /account/orders · /financing · /profile
Admin panel            /admin/(panel)/*                  RBAC-gated
POS simulator          /[locale]/demo                    (client-only, localStorage)
```

## Stack at a glance

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC, route groups, middleware |
| UI | React 19 + Tailwind v4 + framer-motion | |
| i18n | next-intl 4 | FR default + EN, as-needed prefix |
| DB | Postgres on Neon | Serverless, single shared branch (dev = prod for now) |
| ORM | Prisma 6 | Migration-driven schema since v0.1 |
| Auth | Better-Auth (self-hosted) | Session cookies, no third party |
| File storage | Cloudflare R2 (S3 API) | Payment proofs, future invoices |
| Email | Resend | Transactional |
| Hosting | Hostinger VPS (Ubuntu) | systemd + `npx next start` on port 3100 |

See [docs/DECISIONS.md](docs/DECISIONS.md) for the trade-offs.

## Local development setup

Prerequisites: **Node ≥ 20** (VPS runs 24, CI tests 20), npm, access to the Neon DB.

```bash
# 1. Copy env template and fill in real values (never commit .env.local)
cp .env.local.example .env.local

# 2. Install deps from the lock file
npm ci

# 3. Generate the Prisma client + verify DB connectivity
npm run db:generate
npm run db:status   # should print "Database schema is up to date!"

# 4. (First-time bootstrap on a fresh DB only — skip if Neon is already seeded)
npm run db:deploy            # apply baseline migration
npm run rbac:seed            # seed roles + permissions
npm run categories:seed      # seed initial category tree
npm run grant-role -- <email> super-admin  # bless your first super-admin

# 5. Run the dev server
npm run dev
```

The first sign-up at `/signup` creates a customer-only account; super-admins are minted via the `grant-role` script.

## NPM scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on `:3000` |
| `npm run build` | Production build (`next build`) |
| `npm start` | Run the production build |
| `npm run lint` | ESLint over the whole tree |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run ci` | Full local CI mirror: lint + typecheck + i18n parity + build |
| `npm run i18n:check` | FR/EN catalog parity (fails on missing keys) |
| `npm run db:generate` | Re-generate the Prisma client |
| `npm run db:migrate` | `prisma migrate dev` — author + apply a new migration locally |
| `npm run db:deploy` | `prisma migrate deploy` — apply pending migrations to the target DB |
| `npm run db:status` | `prisma migrate status` |
| `npm run db:studio` | Launch Prisma Studio against the local DB |
| `npm run db:reset` | **Destructive**: drop everything and reapply migrations. Local DBs only. |
| `npm run rbac:seed` | Seed roles + permissions + bindings (idempotent) |
| `npm run categories:seed` | Seed the initial category taxonomy (idempotent) |
| `npm run shop:restructure` | Re-map products into the current 6-category tree (idempotent) |
| `npm run grant-role -- <email> <role-slug>` | Assign a role to an existing user |
| `npm run wipe-data` | **Destructive**: clear non-staff data. Dry-run by default. Refuses to run against `NODE_ENV=production` without `--i-know-this-is-prod`. |
| `npm run deploy` | Deploy current tree to the VPS (`ops/deploy.sh`) |

## Repository layout

```
src/
  app/                  Next.js App Router
    [locale]/           Public marketing + commerce + customer portal
      (auth)/           /signin /signup (route group, no URL prefix)
      account/          /account/* — customer portal (auth-gated)
      checkout/         /checkout, /checkout/success
      shop/             /shop, /shop/[slug]
      ...
    admin/              Operator-only chrome (NO locale prefix)
      signin/           Dedicated admin sign-in (outside the (panel) gate)
      (panel)/          RBAC-gated admin routes
    api/                REST endpoints (orders, financing, auth, etc.)
  components/           UI by area (account, admin, auth, cart, layout, sections, shop, ui)
  data/                 Static design-data (demo simulator seeds, etc.)
  lib/                  Pure utilities (formatPrice, refs, safeNext, wafasalaf, …)
  i18n/                 next-intl config (request.ts, routing.ts, navigation.ts)
  middleware.ts         Locale + auth-gate routing
  server/               Server-only modules (Prisma + business logic)
    auth.ts             Better-Auth instance
    auth-helpers.ts     Session helpers
    catalog/            Product + category reads
    db.ts               Prisma client singleton
    env.ts              Validated env (Zod)
    financing/          Financing service + state machine
    orders/             Order service + state machine
    policy/             Authorization (loadActor + scope helpers)
    products/           Admin product writes
    rbac/               Role catalog + grant helpers
    rate-limit.ts       In-memory per-route rate limiter
prisma/
  schema.prisma         Single source of truth
  migrations/           Versioned migration history
scripts/                Maintenance scripts (seeds, grants, wipes)
messages/               next-intl translation catalogs (fr.json, en.json)
ops/                    Deployment artifacts (systemd unit, deploy.sh)
docs/                   Architecture + ops docs
```

## Where to start reading

- **Doc index** — [docs/README.md](docs/README.md)
- **Deploy something** — [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Add a role / understand RBAC** — [docs/RBAC.md](docs/RBAC.md)
- **Auth flows** — [docs/AUTH.md](docs/AUTH.md)
- **Payments (CMI + Wafasalaf)** — [docs/PAYMENTS.md](docs/PAYMENTS.md)
- **Translations** — [docs/I18N.md](docs/I18N.md)
- **Catalog (products + categories)** — [docs/CATALOG.md](docs/CATALOG.md)
- **Stack decisions / why this is shaped the way it is** — [docs/DECISIONS.md](docs/DECISIONS.md)
- **Secrets policy + rotation** — [docs/SECRETS.md](docs/SECRETS.md)

`ARCHITECTURE.md` at the root predates the shipped implementation — treat it as aspirational until rewritten.

## Reporting issues

For security issues, do not open a public issue — contact the team directly.
