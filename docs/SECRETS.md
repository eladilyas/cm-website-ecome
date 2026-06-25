# Secrets

Policy + inventory + rotation runbook.

## Policy

1. Real values live **only** in untracked files: `.env.local` on dev machines, `.env.production` on the VPS. Both are matched by `.gitignore`.
2. Templates (`*.example`) are tracked. They MUST contain placeholders only.
3. Any secret that has appeared in a chat session, screenshot, ticket, or email thread is **presumed leaked** and must be rotated before being used against production.
4. Pasting a production secret into the editor, terminal history, or chat is the same as leaking it.
5. Secrets never enter git history. If one slips in, treat it as compromised and rotate immediately — `git filter-repo` and force-push do not erase what's in the GitHub cache, mirror clones, or anyone's local checkout.

## Inventory

| Secret | Used by | Where it lives | Where to rotate |
|---|---|---|---|
| `DATABASE_URL` | Prisma at runtime (pooled connection) | `.env.local` / `.env.production` | Neon dashboard → project → connection details |
| `DIRECT_DATABASE_URL` | `prisma migrate` (direct connection) | same as above | same as above |
| `BETTER_AUTH_SECRET` | Better-Auth session signing | `.env.local` / `.env.production` | `openssl rand -base64 32` → update both → restart service. All active sessions invalidated. |
| `BETTER_AUTH_URL` | Better-Auth absolute URL base | same | env file only, not a credential |
| `R2_ACCOUNT_ID` | R2 endpoint resolution | same | Cloudflare → R2 → settings (not strictly secret but bundled with the keys) |
| `R2_ACCESS_KEY_ID` | R2 S3 client | same | Cloudflare → R2 → Manage API tokens → revoke + create |
| `R2_SECRET_ACCESS_KEY` | R2 S3 client | same | same as above |
| `R2_BUCKET` | Target bucket name | same | not a credential, but loss = file write failures |
| `RESEND_API_KEY` | Transactional email | same | Resend dashboard → API keys → revoke + create |
| `EMAIL_FROM` | Sender address | same | DNS / Resend domain config |
| `NEXT_PUBLIC_SITE_URL` | Public origin (canonical, hreflang, emails) | same | env file only |
| `NODE_ENV` | Runtime mode | systemd / env file | systemd `Environment=NODE_ENV=production` |
| `FORCE_HTTPS_CSP` | Toggles HSTS + CSP upgrade-insecure-requests | env file | set `=1` only when behind HTTPS |

## Rotation runbook

1. Generate the new value in the provider's UI (or with `openssl rand` for HMAC secrets).
2. Update `.env.local` on every dev machine that has it.
3. SSH to the VPS, edit `/var/www/caisse-manager/.env.production`, then `systemctl restart caisse-manager.service`.
4. Revoke the previous credential in the provider's UI (don't just rotate — explicitly disable the old one).
5. Tail `journalctl -u caisse-manager.service -n 50 --no-pager` to confirm the service came back up cleanly.

## What is *not* a secret

- The Postgres host (`ep-quiet-morning-aio8uuxa.c-4.us-east-1.aws.neon.tech`)
- The R2 bucket name + account ID (handy for support tickets; useless without the keys)
- The systemd unit, nginx config, deploy script (all in `ops/`)
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL` — these are public origins

These can appear in chat, tickets, screenshots without rotation.

## Known historical leaks

Prior to git initialization, the `.env.local.example` file in the workspace contained real-looking R2 + Resend credentials. Those keys must be considered compromised and rotated. The scrubbed template now ships placeholders only. See the rotation runbook above.
