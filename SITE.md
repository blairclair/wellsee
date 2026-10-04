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
git add -A && git commit -m "<tab>: <what>"
git fetch origin && git rebase origin/main     # registry conflict? keep every line from both sides
git push origin HEAD:main                      # rejected? fetch + rebase + push again
gh run watch "$(gh run list -w pages.yml -L1 --json databaseId -q '.[0].databaseId')" --exit-status
```
Then confirm the live URL returns 200 and renders.
