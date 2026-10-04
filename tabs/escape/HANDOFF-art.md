# Escape the Midway: art handoff

Owner: the art agent. Files: `js/art.js` plus `js/art/{util,tiles,figures,props,face}.js`. These are ES-module imports from art.js, so index.html needs no change.

## Live
- **Horror character redesign** (deploy 8ac4e01). All the Unwilling share one rig in `art/figures.js`:
  - Body: hunched shoulders, overlong arms with elbows that bend the wrong way, long fingers, a stop-motion gait, and head twitches.
  - Face: cracked greasepaint over grey skin, black sockets with eyeshine, a painted grin wider than the face, the jaw hanging open, and red runs.
  - Per-character: Tobias, Sam, Lettie, Eli, Arthur and the Barker each get their own signature details (see the comments in `PEOPLE`).
  - Presentation (in `render` in art.js): enemies drawn at 1.22x, a dark aura, a long shadow toward the player, double vision at close range, a slight camera push-in, and a rate-limited face-flash. Glints are drawn after the lighting.
  - The title shows a huge painted face. The caught scene paints the guest's face (`art/face.js`, `bigFace`).
- **Lighting rewrite** (`drawLighting`): a colour lightmap multiplied over the scene.
  - Ambient is tinted by the zone fog. Lamps, bulbs and exits are baked once per level into a 1/4-scale static map.
  - Dynamic lights are stamped from cached sprites: the player's lantern pool and facing cone, entity lights, and temporary event lights.
  - The vignette and dread pulse are folded into the same layer, giving one full-screen composite per frame.
- **Effects**: new effects for `break`, `bite`, `flash`, `flashCharge`, `flashCancel`, `barker*`, `breaker`, `gateOpen`, `jack*`, `chalk` and `marked`. The `marked` effect is a negative-film afterimage trail.
  - Decals on the ground: blood, chalk, popcorn, shards.
  - Settings come from `settings.js`, imported dynamically. `flash()` is rate-limited to 0.4 s, scaled by `settings.flash` and weakened under reduced motion. `shake` respects `settings.shake` and reduced motion.
- **New types are drawn**: arthur, barker, gate, breaker, jack, popgun (icon), cork.

## In this deploy (tile pass)
- `art/tiles.js`:
  - Walls have pseudo-3D front faces.
  - Overhang pass: tree branches and lamp heads draw over the neighbouring tiles.
  - Richer floors: mud, footprints, straw, tickets, popcorn, stains, shoes, nails and grain.
  - Zone dressing by `game.levelId`: gallery (tin ducks, targets, pellets), gate (cobbles, red-and-gold iron fence), mirrors (glass).
  - Bulb strings hang on a sagging wire, and many bulbs are dead.
- Gate prop redrawn in red and gold iron, taller.

## Performance
- Headless Chromium uses software rasterising, so it is not representative of a laptop.
  - Before: art.render took about 28-36 ms/frame (rAF about 28-38 fps) on desktop 1280x760 at DPR 2.
  - After: about 24-31 ms software; play-test fps went from 28 to 41.
  - With the GPU flags (`prof.cjs ... gpu`), render takes about 1-7 ms.
- Profiling switches: `window.__artProf = {noLight, noLevel, noEnt}`. Frame readout: add `?fps` to the URL, or set `localStorage['escape.fps']='1'`.

## Next steps
1. Remove the pre-fix event compatibility shim in `onEvent` (the `if (ENEMIES[type])` line). The content fix is live, so `hit`/`spawn` now carry `enemy`.
2. Phone readability: ask content/engine to raise the camera zoom floor on narrow screens (`updateCamera` `Math.max(0.85, …)`, to about 1.15 when W < 500). Already requested via main.
3. Remaining art:
   - Grotesque pass on the teacup, horse and cookie at gameplay zoom.
   - Weapon hit effects per weapon (the `hit` event has `enemy`; `throw`/`burst` carry `weapon`).
   - A distinct look for `bigtop`/`carousel`.
   - The bloom/glow additive pass is the next software-render cost.
4. Re-check the GPU timing variance (1.2 ms vs 7 ms runs) with a longer sample.
5. Harness scripts used (scratchpad, not in repo): `artshots.cjs` (zones/enemies/end scenes), `closeup.cjs` (enemy close-ups lit, dark and in states), `prof.cjs` (ablation).
