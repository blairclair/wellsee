#!/usr/bin/env bash
# Commit, rebase onto origin/main, push, and wait for the Pages deploy.
# Safe to run from many worktrees at once: a lock in the shared git dir
# serializes fetch/rebase/push, and assets/tabs.js conflicts auto-resolve.
#   usage: scripts/deploy.sh "commit message"
set -uo pipefail
msg="${1:?usage: scripts/deploy.sh \"commit message\"}"
root="$(git rev-parse --show-toplevel)"; cd "$root"
lock="$(git rev-parse --path-format=absolute --git-common-dir)/wellsee-deploy.lock"

# acquire lock (mkdir is atomic); break locks older than 15 minutes
for i in $(seq 1 180); do
  mkdir "$lock" 2>/dev/null && break
  if [ -n "$(find "$lock" -maxdepth 0 -mmin +15 2>/dev/null)" ]; then rmdir "$lock" 2>/dev/null; continue; fi
  [ "$i" = 1 ] && echo "deploy: waiting for another agent's deploy to finish..."
  sleep 5
done
[ -d "$lock" ] || { echo "deploy: could not acquire lock"; exit 1; }
trap 'rmdir "$lock" 2>/dev/null' EXIT

git add -A
git diff --cached --quiet || git commit -q -m "$msg" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

rebase() {
  git rebase origin/main >/dev/null 2>&1 && return 0
  while [ -d "$(git rev-parse --git-path rebase-merge)" ] || [ -d "$(git rev-parse --git-path rebase-apply)" ]; do
    conflicts="$(git diff --name-only --diff-filter=U)"
    if [ "$conflicts" = "assets/tabs.js" ]; then
      python3 scripts/merge_tabs.py && git add assets/tabs.js || { git rebase --abort; return 1; }
      GIT_EDITOR=true git rebase --continue >/dev/null 2>&1 && return 0
    else
      echo "deploy: rebase conflict outside the registry, fix by hand:"; echo "$conflicts"
      git rebase --abort; return 1
    fi
  done
}

pushed=""
for attempt in 1 2 3 4 5; do
  git fetch -q origin main || { sleep 3; continue; }
  rebase || exit 1
  if git push -q origin HEAD:main; then pushed=1; break; fi
  echo "deploy: push rejected (attempt $attempt), retrying"; sleep 2
done
[ -n "$pushed" ] || { echo "deploy: push failed after 5 attempts"; exit 1; }
sha="$(git rev-parse HEAD)"
rmdir "$lock" 2>/dev/null; trap - EXIT
echo "deploy: pushed ${sha:0:7}; waiting for Pages run"

for i in $(seq 1 30); do
  run="$(gh run list -w pages.yml -c "$sha" -L1 --json databaseId -q '.[0].databaseId' 2>/dev/null)"
  [ -n "$run" ] && break; sleep 4
done
[ -n "$run" ] || { echo "deploy: no Pages run found for ${sha:0:7}"; exit 1; }
# A newer push cancels our pending run (concurrency group); the newer run
# contains our commit, so follow the latest run until one actually finishes.
for i in 1 2 3 4 5 6; do
  gh run watch "$run" --exit-status >/dev/null 2>&1
  concl="$(gh run view "$run" --json conclusion -q .conclusion)"
  [ "$concl" = success ] && { echo "deploy: live at https://blairclair.github.io/wellsee/"; exit 0; }
  [ "$concl" = cancelled ] || { echo "deploy: Pages run $run ended: $concl"; gh run view "$run" --log-failed | tail -20; exit 1; }
  sleep 5; run="$(gh run list -w pages.yml -b main -L1 --json databaseId -q '.[0].databaseId')"
done
echo "deploy: gave up following superseded runs"; exit 1
