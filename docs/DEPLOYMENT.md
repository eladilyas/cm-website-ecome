# Deployment

How the Caisse Manager website gets from your laptop to the public internet.

## Topology

- **One Hostinger VPS** at `46.202.171.97`, Ubuntu 24.04.
- The Node process runs as the dedicated `caisse` user from `/var/www/caisse-manager`.
- `next start` binds directly to **port 3100** on `0.0.0.0`. No nginx reverse proxy in front of it yet — there's no domain, and HTTPS isn't terminated. The VPS hosts other unrelated applications (CRM, HR, ShiftManager) under their own nginx vhosts; the caisse website is intentionally separate from those.
- Database is **Neon Postgres** (`ep-quiet-morning-aio8uuxa`). The dev and prod environments share a single branch today — keep this in mind before running destructive scripts.
- Secrets live in `/var/www/caisse-manager/.env.production` (gitignored, owned by `caisse`).

## Prerequisites (one-time, already done)

| Step | Status |
|---|---|
| `caisse` user created with `/var/www/caisse-manager` as `$HOME` | ✓ |
| Project checked out at `/var/www/caisse-manager` | ✓ |
| `.env.production` populated with real secrets | ✓ |
| `ops/caisse-manager.service` installed at `/etc/systemd/system/caisse-manager.service` | ✓ |
| `systemctl enable --now caisse-manager.service` | ✓ |
| SSH key authorized for the deploy user (`~/.ssh/caisse_deploy`) | ✓ |
| Node 24 installed system-wide | ✓ |

If you're standing up a fresh VPS, walk through each item above before running `ops/deploy.sh`.

## Deploying

```bash
# From your dev machine, in the project root:
npm run deploy
```

This wraps `ops/deploy.sh` which performs, in order:

1. **`rsync`** the working tree to the VPS, excluding `node_modules`, `.next`, `.git`, `.env*`, and scratch dirs.
2. **`npm ci`** — reproducible install from `package-lock.json`.
3. **`npx prisma generate`** — regenerate the client to match the deployed schema.
4. **`npx prisma migrate deploy`** — apply any new migrations against Neon. This is idempotent; if no migrations are pending it's a no-op.
5. **`npm run build`** — Next.js production build into `.next/`.
6. **`systemctl restart caisse-manager.service`** — restart the Node process so it picks up the new build.
7. Print the last 15 journal lines so a broken boot surfaces in the deploy output.

Override targets via env vars if needed:

```bash
DEPLOY_HOST=root@1.2.3.4 \
DEPLOY_PATH=/var/www/staging \
DEPLOY_SERVICE=caisse-manager-staging.service \
npm run deploy
```

## Schema changes

The codebase uses **migration-driven** Prisma. Don't use `prisma db push` against shared environments — it bypasses migration history and creates rollback ambiguity.

```bash
# Edit prisma/schema.prisma, then:
npm run db:migrate -- --name <descriptive_change>
# Commits a new migration to prisma/migrations/<timestamp>_<name>/
# AND applies it locally via your DIRECT_DATABASE_URL.

# Deploy applies via:
npm run deploy   # runs `prisma migrate deploy` on the VPS
```

If a migration creates a destructive change (drop column, change type), generate it locally first, review the SQL by hand, and stage it carefully.

## Verifying a deploy

```bash
# From your dev machine:
curl -I http://46.202.171.97:3100/                   # 200 OK
curl -I http://46.202.171.97:3100/shop               # 200 OK
curl -I http://46.202.171.97:3100/admin/signin       # 200 OK

# On the VPS:
systemctl status caisse-manager.service
journalctl -u caisse-manager.service -n 100 --no-pager
```

If `/admin/signin` returns 404, the middleware probably failed to detect the `/admin/*` route and routed it through next-intl — restart the service and check `src/middleware.ts`.

## Rollback

There's no automated rollback today. Two manual paths:

**Code-only rollback** (no schema change):

```bash
git revert <bad-commit>
npm run deploy
```

**With schema change** — Prisma doesn't generate down migrations. To roll back a schema change, author a new migration that reverses it and deploy that. Never edit a deployed migration.

## When things break

| Symptom | First check |
|---|---|
| `systemctl status` shows `activating (auto-restart)` looping | `journalctl -u caisse-manager.service -n 50` — usually a missing env var or DB unreachable |
| Site loads but assets don't | CSP `upgrade-insecure-requests` was enabled while on HTTP. Ensure `FORCE_HTTPS_CSP=0` (or unset) in `.env.production`. |
| `/admin/*` returns 404 in browser | next-intl rewrote the path. Check the admin-path bypass in `src/middleware.ts`. |
| `migrate deploy` fails with "table already exists" on a fresh DB | The migration baseline (`prisma/migrations/0_init`) was applied to a DB that wasn't actually fresh. Run `prisma migrate resolve --applied 0_init` against the existing DB and re-deploy. |
| Sign-in suddenly broken | `BETTER_AUTH_SECRET` was rotated and processes weren't restarted — restart the service. All existing sessions will need to re-authenticate. |

## What this doc does NOT cover

- HTTPS / domain setup — planned for when the domain transitions to this server.
- Nginx reverse-proxy front-end — same.
- Database backup + restore — Neon handles backups; documented in their dashboard.
- Other applications hosted on the same VPS (CRM, HR, ShiftManager) — those are independent projects.
