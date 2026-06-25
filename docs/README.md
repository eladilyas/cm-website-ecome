# Documentation

Onboarding-order index. Each doc is self-contained; deeper docs assume you've read the ones above them.

## Getting up to speed

1. **[Local dev setup](../README.md#local-development-setup)** — env, install, scripts, repo layout.
2. **[DECISIONS.md](DECISIONS.md)** — *why* the stack is shaped the way it is. Skim before changing infra.
3. **[DEPLOYMENT.md](DEPLOYMENT.md)** — VPS topology, build + transfer flow, rollback notes.
4. **[SECRETS.md](SECRETS.md)** — what's secret, where it lives, how to rotate.

## Domain reference

| Doc | Covers |
|---|---|
| [AUTH.md](AUTH.md) | Better-Auth wiring, session model, operator vs customer redirect rule |
| [RBAC.md](RBAC.md) | Role catalog, permission matrix, how to grant a role |
| [CATALOG.md](CATALOG.md) | Product + Category schema, CatalogProvider hydration, cache tag contract |
| [PAYMENTS.md](PAYMENTS.md) | CMI + Wafasalaf + Bank Transfer + COD flows, trust boundary |
| [I18N.md](I18N.md) | next-intl 4 setup, FR/EN catalogs, bilingual surface tracker |

## Roadmap

[ROADMAP.md](ROADMAP.md) — forward-looking work, not a deploy guide.

## Aspirational / stale

The root-level `ARCHITECTURE.md` predates the shipped code and describes a stack that didn't ship (tRPC + Trigger.dev + Axiom + service registry). Read it as design notes only — DECISIONS.md tracks the real shape.
