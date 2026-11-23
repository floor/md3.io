#!/usr/bin/env bash
# Deploy md3.io to floor-vps after the coordinator authorizes the deploy.
#
# The site is reset to origin/main and installs its dependencies (including
# material from npm) from bun.lock. Verify the systemd-owned PM2 daemon before
# touching the checkout. A failure after reset needs operator recovery: the
# running process can read the newly changed files even without a reload.
#
# Override the host with DEPLOY_HOST, the directory with DEPLOY_DIR.
# DRY_RUN=1 prints the remote script and does not open ssh.
set -euo pipefail

host="${DEPLOY_HOST:-admin@46.226.104.226}"
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

# Paths verified against pm2-admin.service on floor-vps, 2026-11-23. The CLI
# must use the unit's Bun runtime and PM2_HOME, never a shell-selected PM2.
bun='/home/admin/.bun/bin/bun'
pm2_cli='/home/admin/.local/share/fnm/node-versions/v18.17.1/installation/lib/node_modules/pm2/bin/pm2'
export PM2_HOME='/home/admin/.pm2'
expected_daemon_pid=
fail() { echo "Refusing deploy: $*" >&2; exit 1; }

guard_daemon() {
  local unit property value state= main_pid= pid_file
  unit=$(systemctl show pm2-admin --property=ActiveState --property=MainPID) || fail 'cannot read pm2-admin.'
  while IFS='=' read -r property value; do
    case "$property" in
      ActiveState) state=$value ;;
      MainPID) main_pid=$value ;;
    esac
  done <<<"$unit"
  [[ "$state" = active ]] || fail 'pm2-admin is not active; check the unit, do not start PM2 by hand.'
  [[ "$main_pid" =~ ^[1-9][0-9]*$ ]] || fail 'pm2-admin has no MainPID.'
  pid_file=$(cat "$PM2_HOME/pm2.pid") || fail 'cannot read the PM2 daemon pid.'
  [[ "$pid_file" = "$main_pid" ]] || fail 'pm2.pid does not match pm2-admin MainPID (possible stale socket).'
  kill -0 "$main_pid" 2>/dev/null || fail 'pm2-admin MainPID is not alive.'
  [[ -S "$PM2_HOME/rpc.sock" ]] || fail 'PM2 RPC socket is missing.'
  [[ -z "$expected_daemon_pid" || "$main_pid" = "$expected_daemon_pid" ]] || fail 'pm2-admin daemon changed during deploy.'
  daemon_pid=$main_pid
}
pm2() {
  # Even a read-only CLI command can spawn a daemon; guard every invocation.
  guard_daemon
  "$bun" --bun "$pm2_cli" "$@"
}

[[ -x "$bun" ]] || fail "Bun runtime is not executable: $bun"
[[ -f "$pm2_cli" && -x "$pm2_cli" ]] || fail "PM2 executable is missing: $pm2_cli"
guard_daemon
expected_daemon_pid=$daemon_pid
app_pids=$(pm2 pid md3.io) || fail 'cannot query md3.io in the systemd-owned PM2 daemon.'
[[ -n "$app_pids" ]] || fail 'md3.io is not a known running PM2 process; report it, do not start it.'
while IFS= read -r app_pid; do
  [[ "$app_pid" =~ ^[1-9][0-9]*$ ]] || fail 'md3.io is not a known running PM2 process; report it, do not start it.'
done <<<"$app_pids"

echo "md3.io:"
cd '@@DIR@@/md3.io'
previous_commit=$(git rev-parse --verify HEAD)
checkout_moved=0
report_failure() {
  local result=$?
  if [[ "$result" -ne 0 && "$checkout_moved" = 1 ]]; then
    echo "DEPLOY FAILED AFTER CHECKOUT UPDATE. Previous commit: $previous_commit" >&2
    echo 'The live process may be serving changed files. No automatic rollback was performed.' >&2
    echo "Restore checkout: git -C '@@DIR@@/md3.io' reset --hard '$previous_commit'" >&2
    echo 'Check pm2-admin before any recovery reload; reinstall and rebuild the restored checkout. Never start PM2 by hand.' >&2
  fi
}
trap report_failure EXIT
git fetch -q origin main
# A reset can partially change files even if it exits unsuccessfully.
checkout_moved=1
git reset -q --hard origin/main
git log --oneline -1
if [ -L node_modules/material ] || [ -L node_modules/material/package.json ]; then
  mv node_modules/material "/tmp/md3io-material-link-$$"
fi
if ! "$bun" install --frozen-lockfile || ! "$bun" run build; then
  echo 'md3.io install/build failed; the checkout has moved and the process has not been reloaded.' >&2
  exit 1
fi

if ! pm2 reload md3.io > /dev/null; then
  echo 'md3.io reload failed after checkout update; check pm2-admin. Do not hand-start a daemon or process.' >&2
  exit 1
fi
# A successful CLI exit is insufficient if it attached to a different daemon.
guard_daemon

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
