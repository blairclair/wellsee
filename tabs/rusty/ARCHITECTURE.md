# Rusty comic: architecture and how to work on it

## Files and who owns them

| file | owner | what |
|------|-------|------|
| `index.html` | tab lead only | Page and grid layout: which panel goes on which page and its span class (`s2` third, `s3` half, `s4` two-thirds, `s6` full), plus the `<script>` list. |
| `style.css` | tab lead only | Newsprint pages, grid, panel borders, caption, balloon and SFX styles, mobile reflow. |
| `comic.js` | tab lead only | Renderer. Draws each registered panel, lays out captions and balloons, draws balloon tails, and handles the scroll reveal. |
| `model.js` | shared, **add-only** | Character model and drawing helpers (see MODEL.md). |
| `panels/pNN.js` | **one artist per panel** | That panel's art, lettering and alt text. |
| `SCRIPT.md` | story | Panel table (id, span, viewBox, mood, wear) plus beats and lettering. |
| `MODEL.md` | story | Model sheet in words. |
| `tools/modelsheet.html` | anyone | Visual model sheet. |
| `tools/preview.html?p=pNN` | anyone | Renders one panel with its lettering (`&mood=grey`, `&w=380`). |
| `tools/render.mjs` | anyone | Renders panels to standalone `.svg` and runs `xmllint`. |

**Rules for `model.js` while several artists work at once:** you may *append* new helpers or presets at the end of the file. Do **not** change existing function signatures, defaults, colours or pose coordinates, because every panel depends on them. If a shared change is really needed, ask the tab lead.

## Anatomy of a panel file

```js
RUSTY.panel({
  id: "p13", w: 1200, h: 600,          // viewBox. w = 200 × span (s2=400, s3=600, s4=800, s6=1200), h = 600 unless the script says otherwise
  alt: "…what a sighted reader sees…",  // becomes the SVG aria-label
  captions: [ { at: "tl", text: "…", w: 40 } ],         // at: tl tc tr bl bc br; w = max width in % of the panel
  balloons: [ { kind: "speech", who: "Rusty", x: 2, y: 5, w: 24, tail: [37, 25], text: "…" } ],
  draw: function (k, R) { var s = ""; /* … */ return s; }  // returns SVG markup (no outer <svg>)
});
```

- `balloons[].kind` is one of `speech`, `thought`, `shout`, `whisper`, `small`, `clown` (the Unwilling: black with a red edge, Creepster font). `x`, `y` and `w` are percentages of the art box: the top-left corner and the width. `tail` is the tip position in %. `who` is read by screen readers and shown in the mobile lettering strip. `text` may contain `<b>` and `<em>`.
- Captions overlay the art on desktop and become flow strips above or below the art on phones. On phones, wide panels (w/h ≥ 1.5) move their balloons into a strip under the art. Write lettering that still makes sense that way. Other panels keep their balloons over the art on phones with a minimum width of about 36% of the panel; if a balloon would then cover key art, set `phoneStrip: true` on the panel to letter it under the art on phones as well (p27 does).
- `mood` (optional) on a panel styles that panel's captions with a different mood from its page, e.g. `mood: "dusk"` for a sunset panel on a noon page. Page moods live on `<section class="page" data-mood>` in `index.html`: `cover`, `day`, `light`, `noon`, `dusk`, `lurid`, `grey`.
- `draw(k, R)`. Always reference ids through `k`:
  - `k.id("sky")` gives `"p13-sky"`, `k.url("sky")` gives `"url(#p13-sky)"`, and `k.uid("x")` gives a fresh unique id.
  - **Every `id` in a panel must start with `pNN-`.** All 27 SVGs are inline in one document, so a bare `id="sky"` collides with another panel. `render.mjs` fails on this.
  - Shared defs are already present in every panel: `dots`, `dotsL`, `dotsR`, `hatch`, `vig`, `glow`, `redglow`. Use them with `k.url("dots")`.
- Keep panels static. Use CSS animation only (never SMIL `<animate>`), so `prefers-reduced-motion` keeps working. Avoid `feTurbulence` and other heavy filters, because 27 inline SVGs have to stay fast on a phone.
- Escape `&` as `&amp;` inside SVG text, or use `R.esc()`. Browsers forgive a bare `&`; xmllint does not.

## Editing one panel safely

1. Only touch `panels/pNN.js` for the panels you own. If you need a new shared helper, append it to `model.js`.
2. Serve the repo root: `python3 -m http.server 8000`. Open `http://localhost:8000/tabs/rusty/tools/preview.html?p=pNN&mood=<mood>`, then check the whole page at `/tabs/rusty/` on desktop and at 375px width.
3. Validate with `node tabs/rusty/tools/render.mjs /tmp/out pNN`. It must print `ok`.
4. Keep Rusty on-model: use `R.person` / `R.head` with the panel's `wear` from SCRIPT.md. Don't hand-draw a new Rusty face.
5. Deploy with the repo's `scripts/deploy.sh "rusty: pNN …"` (see SITE.md).

## Suggested split for 3–4 artist agents (contiguous story beats)

- **Artist A: Hollis Creek and the letter (p02–p08).** Mostly interiors and warm light.
- **Artist B: the light (p09–p13).** Dawn, the bugs going silent, the ticket, the refusal.
- **Artist C: Mae's Diner (p14–p20).** Includes the key reflection panel, p16.
- **Artist D: the taking and forever (p21–p26).** p01 (cover) and p27 (finale) stay with the tab lead or go to D only with care, since p27 is the strongest image on the page.

With only 3 artists, merge B into A.

## Panels that most need more art

1. **p05 (closet photo).** The kid in the photo is a small adult. Needs child proportions, a better bicycle, and photo grain.
2. **p09 (dawn lot).** Rusty faces the camera instead of looking at the hill. A back or three-quarter view would sell the awe. The truck reads as a sedan.
3. **p19 (Danny at 1:40).** The hands on the table are awkward (Jess's hand especially) and the booth is flat.
4. **p26 (rabbit break).** The upturned-bucket seat is crude and the rabbit's bone is a placeholder. This is the most heartbreaking line and deserves better staging.
5. **p14 (Route 9).** The perspective of the balloons and mailboxes is rough, and Rusty is large in frame.
6. **p21 (the taking).** The fingers curled around the doorframe read as a ladder, and the rabbits in the hall need more depth.
7. **p03, p07 (hand close-ups).** The fists are blocky. Real knuckles and finger overlap would help.
8. **p20.** The walkers on the horizon are tiny and could be bolder silhouettes against the sun.

Strongest as they stand: p27, p16, p01, p13, p12, p25.
