# Building on the Wellsee Carnival site

Static site, no build step. Deployed to GitHub Pages by `.github/workflows/pages.yml`
on every push to `main`: https://blairclair.github.io/wellsee/

## Layout

```
index.html            landing page
assets/site.css       shared base styles + nav (keep small)
assets/tabs.js        tab registry — the ONLY shared file tab authors touch
assets/nav.js         renders <nav id="site-nav"> from the registry
tabs/<slug>/          one directory per tab, fully owned by that tab
  index.html          standalone page
  style.css           tab styles
  assets/             tab images, scripts, credits
```

## Adding a tab

1. Create `tabs/<slug>/index.html`. Include, with paths relative to that page:
   ```html
   <link rel="stylesheet" href="../../assets/site.css">
   <link rel="stylesheet" href="style.css">
   ...
   <nav id="site-nav"></nav>
   ...
   <script src="../../assets/tabs.js"></script>
   <script src="../../assets/nav.js" data-active="<slug>"></script>
   ```
2. Add (or flip to `ready: true`) one line in `assets/tabs.js`.
3. Touch nothing outside `tabs/<slug>/` and that one registry line.

## Rules

- **Relative paths only.** The site lives at `/wellsee/`, so `/assets/x` 404s in production.
- Test with `python3 -m http.server` from the repo root, not `file://`.
- Images: no hotlinking. Original inline SVG / CSS art preferred. Public-domain or CC0
  images only if verified, committed under `tabs/<slug>/assets/`, credited in
  `tabs/<slug>/assets/CREDITS.md`.
- Must work at phone width with no horizontal scroll; respect `prefers-reduced-motion`.

## Deploying (do this as soon as your work is done)

```sh
scripts/deploy.sh "<tab>: <what>"
```
Always use the script; never hand-roll push sequences. It commits, takes a lock in the
shared git dir (worktrees share one `.git`, so parallel fetch/push race on ref locks),
rebases onto `origin/main`, auto-resolves `assets/tabs.js` conflicts by slug
(`scripts/merge_tabs.py`), retries rejected pushes, and follows the Pages run (a newer
push cancels a pending run; the script follows the run that superseded it). Any other
rebase conflict aborts with the file list: fix by hand and rerun. Never force-push.
Then confirm your page's live URL returns 200 and renders.

## Questions

Agents working on this site report to the orchestrating session. If you hit a question
you can't settle yourself (design direction, scope, a trade-off the brief doesn't cover,
anything blocking), send it with `SendMessage` to `"main"` along with your recommended
answer. Keep working on whatever it doesn't block; the reply arrives at your next tool
round. If you'd be blocked before a reply comes, go with your recommendation and flag it
in your final report. Don't ask what you can verify in the repo.

## Messages from the orchestrator

Messages arrive between your tool calls, but they are queued work, not interrupts.
Finish the edit or command you're in and leave your files consistent (tests runnable,
nothing half-written) before acting on one. A message marked **URGENT** is the only
exception: act on it at once (e.g. stop a deploy, or don't push a known-broken build).
