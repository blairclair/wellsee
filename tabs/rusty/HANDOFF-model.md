# Rusty model: handoff (paused 2026-10-03)

## Live (deployed in 4564f1a, "rusty: shared model and style follow-up")
- **Phone balloons** (`style.css`): on phones, overlaid balloons get `min-width: max(6.4em, 36%)` (`.small`: `max(5em, 28%)`), so they stop turning into narrow towers. A new panel flag, `phoneStrip: true`, letters a panel's balloons under the art on phones, the way wide panels already work. p27 uses it, because its clown balloon would otherwise cover the EMPLOYEE OF THE MONTH plaque at 375px.
- **Dusk mood**: there is a `.page[data-mood="dusk"]` rule. A panel can also set `mood: "dusk"`, and `comic.js` copies it onto the figure, so a single panel's captions can use dusk styling. **Nothing uses it yet**: p20 sits on the noon page and has no `mood` field.
- **model.js additions**:
  - Curve primitives: `R.crSample`, `R.smooth`, `R.tubeShape`, `R.tube` (a tapered, bulging organic limb with heavier ink on one side), and `R.warpPath`.
  - `R.person` `o.view` gives a three-quarter body view.
  - New poses: `sit3q`, `sitChin`, `sitSlump`, `kneel3q`. The `kneel` legs were also softened.
  - `R.personBack` is a back view with `R.BPOSE` stand/walk/slump, rim light, hand-held props and head turn.
  - `R.grip` is the hand promoted from p03. `R.fist` now draws through `R.grip`, with the same frame as before.
  - `R.openHand` has tapered, jointed fingers. Its finger skeleton is unchanged, so p11's overlays still line up.
  - In `R.head`, the nose bridge no longer reads as a block between the eyes.
- MODEL.md and ARCHITECTURE.md document all of the above, including the `dy` frame rule: in a seated or kneeling pose, `legs`, `arms` and `carry` are all given in the already-lowered frame.
- `tools/modelsheet.html` has two new rows: back views, seated three-quarter poses, kneels, and hands.

## Deliberately not done (left for the panel-artist fleet)
Per the coordinator, no panels were redrawn. The only panel change is p27's one-line `phoneStrip` flag. These are still to do:
- p03 still uses its local `grip()`. Switch it to `R.grip(k, {...})`, which takes the same options plus `skin` and `wear`.
- p09 still uses its local `backRusty()`. Switch it to `R.personBack(k, {pose:"stand", rim:"#ffe48a", holdL: thermosSvg, ...})` and keep the panel-specific shadow and rag.
- p15/p16 (and optionally p19): replace the front-on `sit` with `sit3q`/`sitChin`. p15 derives Danny's reach arm from `R.POSE.sit`, so re-derive it from `sit3q`.
- p20: Rusty walks *away* down the road, so use `R.personBack(... pose:"walk", stoop:18)` inside the existing silhouette filter. p18's reflection walks sideways, so the profile walk there is correct.
- p04: use `kneel3q` so he faces the box rather than the viewer.
- p27: the trophy-scale rework (3× Rusty's height) was not attempted.

## In progress: the user's "less boxy / higher quality / creepier" request
**Live (2026-10-03, "rusty model: organic figure rebuild"), step 1 only, stopped early for usage:**
`R.person` now draws legs and sleeves with `R.tube` (tapered, heavier ink on the shadow side chosen
from `o.light`, default shadow on local -x), knee/elbow creases, ankle folds, a curved pelvis,
a torso with sloped shoulders (neck base ±18,-321 to caps ±54,-298), a mild paunch, a clipped
shadow side with halftone and armpit-to-belly folds, a heavy shadow-side contour, a small oriented
mitten hand (same footprint as the old r=11 dot), and a tube neck with cords at wear > .5. Collar,
tie and lapels moved up to the new neckline. All anchors, signatures and `R.limb` are unchanged;
all 27 panels render, and a contact-sheet comparison showed no regressions.
Not done from step 1: nothing in `R.person` reads differently at panel scale for seated poses
beyond the pelvis; check `sit` on the modelsheet (the curved pelvis reads a little like a cushion).

**Live (2026-10-04, "rusty model: head structure, grief/hollow, seated pelvis"), step 2 done:**
`R.head` adds eye-socket shadow (clipped; opacity .06 + age*.2 + wear*.18 + `expr.socket`, faint
on Jess/Danny), cheekbone shadow + arcs (age > .4), jowl lines (age > .7), frown lines between the
brows (age > .9 or `expr.knit`), and an extra broken forehead line + under-bag folds at wear > .6.
New `R.EXPR.grief` (knotted brows, heavy lids, no tears) and `R.EXPR.hollow` (blank stare: small
unlit pupils via new optional `expr.pupil`/`expr.glint:false`). Seated poses (dy with near-horizontal
thighs: sit, sitLow, sit3q, sitChin, sitSlump) get a flatter pelvis that sits on the seat line
instead of the cushion-like standing pelvis. p12 and p27 checked; all 27 panels render.

**Live (2026-10-04, "rusty model: creepy helpers, Unwilling options, v2 cast and props"), steps 3-4 + cast:**
- Helpers (end of model.js): `R.hatch`, `R.spatter`, `R.dryBrush`, `R.wrongShadow` (feFlood/feComposite),
  `R.grain`, `R.darkEdges`, seeded `R.rng`. No feTurbulence.
- `R.player`: limbs are now organic tubes by default (`tube:false` restores the old limb); new options
  `paint:"grey"`, `mouth2`, `pin`, `joints:0..1`; poses may carry `legs`, `dy`, `lean`; new
  `R.PPOSE.crouch` (p48 hover, dy frame) and `R.PPOSE.shoulder` (p54).
- Cast: `R.CH.rustyYounger`, `danny6`, `danny37`, `jess37`, `girl` (+ `R.GIRL[4|6|7|8]` size/outfit),
  `townA/B/C`; `FACE.child`; CH fields `headS`, `freckles`, `cowlick`. Outfits `tee`, `kid`, `carol`,
  `pyjamas`, `puffy`, `robe`, `townCoat` (flags `tee`, `short`, `stripes`, `puffy`).
- Figures/props: `R.townsfolk`, `R.choir` (red thread from the mouth to `o.to`), `R.kept` (pale, palms
  on the glass, `fog`), `R.POSE.press`, `R.sockRabbit`, `R.whiskey`, `R.baby`, `R.woodRabbit` `worn`/`carve`.
- Nametag: `R.person` `o.tag` overrides the text (`"RUST"`, `"R"`, `""`), `o.tagFade` 0..1 fades it.
- Seen on the model test sheet: players, cast row. **Not yet eyeballed** (review-round cap; XML-valid
  only): choir, kept, sock rabbit, whiskey, baby, carved rabbit, and the helper demos. Shoot the
  modelsheet once before the fleet relies on them.

**Next, in this order (steps 2-4 and the cast/props above are now done; style.css and the guide remain):** step 2 (head structure + `grief`/`hollow`),
step 3 (creepy helpers), step 4 (Unwilling options + organic player limbs), then the SCRIPT-v2 model
needs (Rusty 39, Danny 6, Carol adult, the granddaughter baby/4/6/8, Danny and Jess at 37, crowd,
Choir, kept-in-mirrors, two Unwilling poses `crouch`/`shoulder` (needs `pose.legs`/`pose.dy`/absolute
arms support in `R.player`), props: sock rabbit, sealed whiskey, worn wooden rabbit; `o.tag` text
on `R.person`), then `style.css` (`.panel.thin` for >=3:1, `mirror` and `night` moods: copy every
`dusk` rule incl. the phone `.caps` background; `night` currently has no rules at all), then the
MODEL.md "draw in the new style" guide (granddaughter is `who: "Girl"` until p51).
Review tooling idea: render all panels with `tools/render.mjs <dir>`, put the SVGs as `<img>` in one
HTML grid and screenshot it with headless Chrome: one image per review round.

Original plan for reference:
1. **De-box `R.person`, keeping every anchor in place** (feet, hips at -185+dy, shoulders, pose hand points, `carry`, head centre and scale). Panels compute positions from these.
   - Draw legs as `R.tube(L, 38, 28, pants, lw, {bulge:4, shade})` and arms as `R.tube([sh, el, wrist], 27, 20, ...)`. Put the heavier ink on the side away from `o.light`. On a downward limb, `tubeShape().a` is the left side.
   - Replace the rectangle pelvis with a curved hip shape.
   - Give the torso sloped shoulders (neck base at ±18,-322 rounding down to ±52,-300), a mild paunch, armpit-to-belly folds, and a heavier contour on the shadow side.
   - Replace the r=11 circle hands with a small oriented mitten (palm, thumb, finger hints), centred on the hand point.
   - Draw the neck as a tube, and add neck cords when wear > .5.
   - **Keep `R.limb` unchanged.** Panels use it for rings, wires and thermoses.
2. **Head structure.**
   - Add eye-socket shadow (scaled by age/wear, faint on Jess and Danny), cheekbone arcs, jowl lines, and more wrinkles at high wear.
   - Add new `R.EXPR` entries: `grief` and `hollow` (a blank, resigned stare).
   - Acid tests: p12 (extreme close-up) and p27 at 375px with wear 1. The face must still read as "unhappy but resigned".
3. **Creepy primitives** (append these):
   - `R.hatch(k, d, {angle, gap, w, color, op, cross})`: one pattern per call, using a `k.uid` id.
   - `R.spatter(cx, cy, r, {n, color, seed, drips})`.
   - `R.dryBrush(pts, w, color, {n, seed})`: broken parallel bristle strokes.
   - `R.wrongShadow(k, markup, {x, y, skew, stretch, squash, color, op, extra})`: a flattened silhouette made with an feFlood/feComposite filter (cheap). `extra` is markup that appears only in the shadow, such as fingers that are too long.
   - `R.grain(k, w, h, op)`: a dot-pattern tile.
   - `R.darkEdges(k, w, h, {color, inner, op})`.
   - Don't use feTurbulence (phone performance).
4. **Unwilling treatment** (`R.player` and `R.playerHead`), as new options:
   - `paint:"grey"` for grey-white greasepaint
   - `mouth2:true`: a real mouth showing under or offset from the painted one
   - `pin:true`: pure pinprick eyes
   - `joints:0..1`: elbows and knees bent the wrong way
   - organic tube limbs
5. Document every option in MODEL.md, with a short "how to draw in the new style" guide. Shoot `tools/modelsheet.html` before and after. Render all 27 panels and compare them at 1280 and 375. Then deploy once with `scripts/deploy.sh "rusty model: de-boxed figures + creepy rendering helpers"`.

## What the fleet needs from the model
- The new style primitives above (steps 3 and 4).
- Organic figures, so that panels improve without code changes.
- Stable anchors.
- A modelsheet row for each new helper.

Until step 1 lands, the figures are still the old tube-and-box construction. Only hands, back views and three-quarter poses use the new curve code.
