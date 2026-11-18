#!/usr/bin/env bash
# Deploy md3.io to the floor.io server: push main first, then run this.
#
# The site is reset to origin/main and installs its dependencies (including
# material from npm) from bun.lock. pm2 reloads only when both the install and
# the build succeed; if either fails, the running process keeps serving the
# previous build from memory.
#
# Override the host with DEPLOY_HOST, the directory with DEPLOY_DIR.
# DRY_RUN=1 prints the remote script and does not open ssh.
set -euo pipefail

host="${DEPLOY_HOST:-floor.io}"
dir="${DEPLOY_DIR:-/home/floor}"

# The directory value is pasted into the remote script. Check the whole value
# before that text exists (grep would accept a valid first line and let the
# rest through), then write it inside quotes: /[A-Za-z0-9._/-]+ with no ".."
# segment.
if [[ ! "$dir" =~ ^/[A-Za-z0-9._/-]+$ ]] || [[ "$dir" =~ (^|/)\.\.(/|$) ]]; then
  echo "Refusing to deploy: directory must be an absolute path of [A-Za-z0-9._/-] with no .. segment." >&2
  exit 1
fi

# One remote script. The directory value above is written into it once: a dry
# run prints that text, a real run pipes the same text to ssh, so the two
# cannot differ. Read line by line; a command substitution would end at the
# first ")" under bash 3.2, which is what a dry run here runs.
remote=
while IFS= read -r line; do
  remote+="$line"$'\n'
done <<'REMOTE'
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"

echo "md3.io:"
cd '@@DIR@@/md3.io'
git fetch -q origin main
git reset -q --hard origin/main
git log --oneline -1
if [ -L node_modules/material ] || [ -L node_modules/material/package.json ]; then
  mv node_modules/material "/tmp/md3io-material-link-$$"
fi
if ! bun install --frozen-lockfile || ! bun run build; then
  echo "md3.io is at origin/main but the build did not succeed; the running process is unchanged." >&2
  exit 1
fi

# pm2 pid prints 0 or nothing when the process is not there.
if [ "$(pm2 pid md3.io)" -gt 0 ] 2>/dev/null; then
  pm2 reload md3.io > /dev/null
else
  pm2 start ecosystem.production.config.cjs > /dev/null
fi

for attempt in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4300/ || true)
  [ "$code" = 200 ] && { echo "md3.io answers 200."; exit 0; }
  sleep 1
done
echo "md3.io did not answer 200 on port 4300 (last: $code)." >&2
exit 1
REMOTE
remote=${remote//@@DIR@@/$dir}

if [ "${DRY_RUN:-}" = 1 ]; then
  echo "host: $host"
  echo "directory: $dir"
  printf '%s\n' "$remote"
  exit 0
fi

ssh "$host" bash -s <<<"$remote"
