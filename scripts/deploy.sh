#!/usr/bin/env bash
# Deploy md3.io to the floor.io server: push main first, then run this.
#
# The server keeps an mtrl checkout beside md3.io, as locally, so `file:../mtrl` resolves
# the same way. Both are reset to origin/main and built there; the pm2 process reloads only
# when both builds succeed. Override the host with DEPLOY_HOST, the directory with DEPLOY_DIR.
set -euo pipefail

host="${DEPLOY_HOST:-floor.io}"
dir="${DEPLOY_DIR:-/home/floor}"

ssh "$host" DIR="$dir" bash -s <<'REMOTE'
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"

for repo in mtrl md3.io; do
  echo "$repo:"
  cd "$DIR/$repo"
  git fetch -q origin main
  git reset -q --hard origin/main
  git log --oneline -1
  bun install --frozen-lockfile
  bun run build
done

# pm2 pid prints 0 or nothing when the process is not there.
if [ "$(pm2 pid md3.io)" -gt 0 ] 2>/dev/null; then
  pm2 reload md3.io
else
  pm2 start ecosystem.production.cjs
fi

for attempt in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4300/ || true)
  [ "$code" = 200 ] && { echo "md3.io answers 200."; exit 0; }
  sleep 1
done
echo "md3.io did not answer 200 on port 4300 (last: $code)." >&2
exit 1
REMOTE
