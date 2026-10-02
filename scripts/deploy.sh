#!/usr/bin/env bash
# Deploy md3.io to the floor.io server: push main first, then run this.
#
# The library is built beside md3.io, so `file:../material` resolves the same way.
# It is checked out detached at LIBRARY_REF (default origin/main). A branch name
# means that branch on origin, so main is origin/main; the server's local branch
# is never moved. A tag or a commit hash is used as itself. A ref written as
# refs/heads/ is refused. Then the site is reset to origin/main. pm2 reloads
# only when both builds succeed. A missing library checkout is cloned from
# LIBRARY_URL (default the GitHub repository; a test points it at a local bare
# repository).
#
# Override the host with DEPLOY_HOST, the directory with DEPLOY_DIR.
# DRY_RUN=1 prints the remote script and does not open ssh.
set -euo pipefail

host="${DEPLOY_HOST:-floor.io}"
dir="${DEPLOY_DIR:-/home/floor}"
ref="${LIBRARY_REF:-origin/main}"
url="${LIBRARY_URL:-https://github.com/floor/material.git}"

# One remote script. The three values above are written into it once: a dry run
# prints that text, a real run pipes the same text to ssh, so the two cannot differ.
# Read line by line. A command substitution would end at the first ")" under
# bash 3.2, which is what a dry run here runs.
remote=
while IFS= read -r line; do
  remote+="$line"$'\n'
done <<'REMOTE'
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"

# The library, completely, before the site. A failure here (the wrong origin,
# an unknown ref, the install, the build) exits before the site is fetched or
# reset, so the site's tree stays as it was.
if [ ! -d "@@DIR@@/material" ]; then
  echo "Cloning @@LIBRARY_URL@@ into @@DIR@@/material."
  git clone -q "@@LIBRARY_URL@@" "@@DIR@@/material"
else
  # The configured origin, not an insteadOf rewrite: a renamed checkout still says floor/mtrl.
  origin=$(git -C "@@DIR@@/material" config --get remote.origin.url)
  # https or ssh, with or without .git. A renamed floor/mtrl checkout is not this.
  case "${origin%.git}" in
    https://github.com/floor/material|git@github.com:floor/material|ssh://git@github.com/floor/material)
      ;;
    *)
      echo "Refusing to deploy: @@DIR@@/material origin is $origin, not floor/material." >&2
      exit 1
      ;;
  esac
fi

cd "@@DIR@@/material"
git fetch -q origin --tags
# After the fetch, a branch name is the remote's branch. Nothing else moves
# refs/heads/ (the checkout is detached), so that form is refused.
ref="@@LIBRARY_REF@@"
case "$ref" in
  refs/heads/*)
    echo "Refusing to deploy: library ref $ref names a local branch. Pass the branch name (it means origin's branch) or origin/<branch>." >&2
    exit 1
    ;;
esac
form=
commit=
if git show-ref --verify --quiet "refs/remotes/origin/$ref"; then
  form="remote branch refs/remotes/origin/$ref"
  commit=$(git rev-parse --verify "refs/remotes/origin/$ref^{commit}")
elif git show-ref --verify --quiet "refs/tags/$ref"; then
  form="tag refs/tags/$ref"
  commit=$(git rev-parse --verify "refs/tags/$ref^{commit}")
elif printf '%s\n' "$ref" | grep -Eq '^[0-9a-fA-F]{4,}$' \
  && ! git show-ref --verify --quiet "refs/heads/$ref" \
  && commit=$(git rev-parse --verify --quiet "${ref}^{commit}"); then
  form="commit"
elif [[ "$ref" == origin/* ]] && commit=$(git rev-parse --verify --quiet "${ref}^{commit}"); then
  form="origin ref $ref"
else
  echo "Refusing to deploy: library ref $ref does not resolve to a commit." >&2
  exit 1
fi
git checkout -q --detach "$commit"
echo "material: $form $commit"

bun install --frozen-lockfile
bun run build

# The site, only after the library built. The reset is before the build, so a
# failed install or build leaves this tree on origin/main with no new build.
# The process already running keeps serving the previous build from memory;
# the operator still sees the old site, until that process is restarted.
echo "md3.io:"
cd "@@DIR@@/md3.io"
git fetch -q origin main
git reset -q --hard origin/main
git log --oneline -1
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
remote=${remote//@@LIBRARY_URL@@/$url}
remote=${remote//@@LIBRARY_REF@@/$ref}

if [ "${DRY_RUN:-}" = 1 ]; then
  echo "host: $host"
  echo "directory: $dir"
  echo "library: $url"
  echo "library ref: $ref"
  printf '%s\n' "$remote"
  exit 0
fi

ssh "$host" bash -s <<<"$remote"
