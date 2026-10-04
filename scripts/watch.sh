#!/usr/bin/env bash
# Passive fleet health check. Silent while healthy; prints a report and exits
# (waking the orchestrator) only when something needs attention.
#   usage: scripts/watch.sh <interval-seconds> <running-agent-id>...
interval=$1; shift; running="$*"
repo="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
wt=$repo/.claude/worktrees
lock="$(git -C $repo rev-parse --path-format=absolute --git-common-dir)/wellsee-deploy.lock"
state=$(mktemp -d); stale_after=3   # 3 unchanged checks = 30 min at 10-min interval
urls="'' tabs/about/ tabs/clowns/ tabs/escape/ tabs/rusty/"
while true; do
  problems=()
  for id in $running; do
    d=$wt/agent-$id
    [ -d "$d" ] || { problems+=("agent $id: worktree missing"); continue; }
    fp=$( { git -C $d rev-parse HEAD; git -C $d status --porcelain;
            git -C $d status --porcelain | awk '{print $NF}' | while read f; do stat -f '%m' "$d/$f" 2>/dev/null; done; } | md5 -q)
    if [ "$fp" = "$(cat $state/$id.fp 2>/dev/null)" ]; then n=$(( $(cat $state/$id.n) + 1 )); else n=0; fi
    echo "$fp" > $state/$id.fp; echo $n > $state/$id.n
    [ $n -ge $stale_after ] && problems+=("agent $id: no file or commit changes for $((n*interval/60)) min")
  done
  [ -d "$lock" ] && [ -n "$(find "$lock" -maxdepth 0 -mmin +15)" ] && problems+=("deploy lock held >15 min: $lock")
  concl=$(gh run list -R blairclair/wellsee -w pages.yml -L1 --json conclusion,status -q '.[0] | "\(.status) \(.conclusion)"' 2>/dev/null)
  case "$concl" in "completed failure"*|"completed timed_out"*|"completed startup_failure"*) problems+=("latest Pages run: $concl");; esac
  for u in $urls; do u=${u//\'/}; c=$(curl -s -o /dev/null -w '%{http_code}' "https://blairclair.github.io/wellsee/$u"); [ "$c" = 200 ] || problems+=("live /$u returned $c"); done
  for pid in $(lsof -nP -iTCP -sTCP:LISTEN -t -c Python 2>/dev/null); do
    cwd=$(lsof -a -p $pid -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
    case "$cwd" in $wt/agent-*) aid=${cwd##*agent-}; case " $running " in *" $aid "*) ;; *) problems+=("leftover server pid $pid from finished agent $aid");; esac;; esac
  done
  if [ ${#problems[@]} -gt 0 ]; then echo "HEALTH CHECK $(date '+%H:%M'): ${#problems[@]} problem(s)"; printf ' - %s\n' "${problems[@]}"; exit 0; fi
  sleep $interval
done
