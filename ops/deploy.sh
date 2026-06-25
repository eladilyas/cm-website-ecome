#!/usr/bin/env bash
# Deploy the Caisse Manager website to the production VPS.
#
# Usage:
#   ops/deploy.sh
#
# Required environment / setup (configure once, see docs/DEPLOYMENT.md):
#   DEPLOY_HOST          — root@46.202.171.97 (or equivalent)
#   DEPLOY_PATH          — /var/www/caisse-manager on the VPS
#   DEPLOY_SSH_KEY       — path to the private key (default ~/.ssh/caisse_deploy)
#   DEPLOY_SERVICE       — systemd unit name (default caisse-manager.service)
#
# What this script does, in order:
#   1. rsync the working tree to the VPS, excluding node_modules / .next /
#      .git / .env / scratch dirs (all listed below).
#   2. On the VPS: `npm ci` (reproducible install) + `prisma generate` +
#      `prisma migrate deploy` (applies any new migrations).
#   3. `npm run build` (Next.js production build).
#   4. systemctl restart so the new process picks up the new build.
#   5. Print recent journal lines so a failed boot surfaces immediately.
#
# Safety:
#   • Never runs `wipe-data` or `db:reset` — those are local-only scripts.
#   • Never copies `.env.local` — the VPS uses `.env.production` which
#     lives ONLY on the VPS and is not in this repo.
#   • Aborts on the first failure (set -euo pipefail).

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-root@46.202.171.97}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/caisse-manager}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/caisse_deploy}"
DEPLOY_SERVICE="${DEPLOY_SERVICE:-caisse-manager.service}"

if [[ ! -f "$DEPLOY_SSH_KEY" ]]; then
  echo "deploy: SSH key not found at $DEPLOY_SSH_KEY" >&2
  echo "deploy: set DEPLOY_SSH_KEY=<path> or create the key first" >&2
  exit 1
fi

SSH="ssh -i $DEPLOY_SSH_KEY -o StrictHostKeyChecking=no"
RSYNC_SSH="ssh -i $DEPLOY_SSH_KEY -o StrictHostKeyChecking=no"

echo "deploy: syncing tree → $DEPLOY_HOST:$DEPLOY_PATH"
rsync -avz --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='scripts/output/' \
  --exclude='scripts/tmp/' \
  --exclude='*.tsbuildinfo' \
  -e "$RSYNC_SSH" \
  ./ "$DEPLOY_HOST:$DEPLOY_PATH/"

echo "deploy: installing deps + applying migrations + building on VPS"
$SSH "$DEPLOY_HOST" "cd $DEPLOY_PATH && npm ci --omit=dev=false && npx prisma generate && npx prisma migrate deploy && npm run build"

echo "deploy: restarting $DEPLOY_SERVICE"
$SSH "$DEPLOY_HOST" "systemctl restart $DEPLOY_SERVICE"

echo "deploy: tailing recent journal (15 lines) — Ctrl-C to stop"
$SSH "$DEPLOY_HOST" "journalctl -u $DEPLOY_SERVICE -n 15 --no-pager"

echo "deploy: done"
