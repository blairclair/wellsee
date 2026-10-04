#!/usr/bin/env python3
"""Resolve an assets/tabs.js rebase conflict without losing anyone's tab.

Start from upstream's registry (stage 2 during a rebase) and re-apply every
entry line the commit being replayed (stage 3) added or changed relative to
the merge base (stage 1). Entries are matched by slug."""
import re, subprocess, sys

PATH = "assets/tabs.js"
SLUG = re.compile(r'\{\s*slug:\s*"([^"]+)"')

def stage(n):
    r = subprocess.run(["git", "show", f":{n}:{PATH}"], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ""

def entries(text):
    return {m.group(1): line for line in text.splitlines() if (m := SLUG.search(line))}

base, upstream, mine = stage(1), stage(2), stage(3)
if not upstream:
    sys.exit("merge_tabs: no upstream stage for " + PATH)
changed = {s: l for s, l in entries(mine).items() if entries(base).get(s) != l}

out = upstream.splitlines()
for slug, line in changed.items():
    idx = next((i for i, l in enumerate(out) if (m := SLUG.search(l)) and m.group(1) == slug), None)
    if idx is not None:
        out[idx] = line
    else:
        close = max(i for i, l in enumerate(out) if l.strip().startswith("];"))
        out.insert(close, line)

with open(PATH, "w") as f:
    f.write("\n".join(out) + "\n")
print("merge_tabs: applied", ", ".join(changed) or "nothing")
