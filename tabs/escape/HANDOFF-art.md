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

## Player character detail pass (this deploy)
The guest (`art/figures.js`: `guestBody`, `drawPlayer`, `carry`, `guestGhost`) now has the Unwilling's level of detail:
- **Look**: an ordinary night out. A teal wool coat worn open (lapels, buttons, a pocket with the ticket stub, a half-belt at the back) over a red-and-cream striped jumper; a mustard scarf with a fringed tail; dark jeans; white-soled sneakers; a paper wristband; messy brown hair with a fringe and a tuft that won't lie down.
- **State** comes from `view.guest`, set in `art.render`: `{ hp, san, dread, hurtT, stuck, caught, hatOut, flash }`. A figure can carry its own `p.guest` / `p.held` override (used by previews).
- **Fear**: brows drawn up, eyes widening with the pupils shrinking, a mouth that opens with dread, breath fogging (quicker when afraid), sweat at high dread, and a hunched, forward-leaning run as they close in.
- **Poses**: walk and run (the stride, knee bend and lean scale with speed; the coat tail flares; the scarf streams), idle (breathing, nervous glances), dash (lunge plus the cyan ghosts), hit (jerked back, eyes squeezed shut, a hand up, a brief red flinch scaled by the flash setting), stuck (struggling, arms up), caught (lifted, arms limp, head back, a pinprick-eyed scream).
- **Lantern**: hangs from its bail in the off hand, swings with the stride and velocity, is raised toward the face at high dread, and has a flickering flame and a glint (drawn after the lighting). The light pool is now centred on the lantern hand (`drawLighting`). At low sanity it trembles and the flame gutters; the pool shakes too, except under reduced motion.
- **Weapons carried** (`carry`): the fork held point-out; the cowboy hat **worn** (it leaves your head while it's thrown: `hatOut`); the cotton-candy cone held up by the head; rings stacked up the forearm; the popcorn bag hugged to the chest, spilling; the mallet over the shoulder; the popgun at the hip. Swings use the old arc plus the arm.
- **Wear**: below 75% health, ripped knees and a scratched cheek; below 45%, a torn coat hem showing the lining, blood on the jumper and from the hairline; below 25%, a soaked side, a bruise, a pale face, a limp and blood dripping from the fingers. Below 50% sanity, stray hair and the trembling lantern; below 25%, a white greasepaint smear on one cheek and the mouth's corner pulled up in red.
- **Marked afterimage**: `guestGhost` was redrawn to the new silhouette (tuft, scarf end, coat, lantern). It is also used for the hit flinch.
- **Caught scene**: `bigFace` takes `o.guest`, which adds the striped jumper, teal lapels, mustard scarf, short hair, fringe and tuft, so the face being painted over is recognisably the player's.
- **Reduced motion**: no trembling, struggling or head shake, and the lantern pool doesn't jitter. The hit flinch is halved.
- Review harnesses (in the scratchpad, `game/`): `player.cjs` (every pose, weapon and wear state as a grid of clones at 2.375×, 5× and phone 1×), `marked.cjs` (afterimage and a worn guest in play), `caught.cjs` (renderCaught at 0, 1.5, 3 and 5 s).

## Polish pass
- **Teacup, carousel horse, cursed cookie redrawn** (`art/props.js`) to match the Unwilling, readable at gameplay zoom (2.4 desktop, 1.0 phone):
  - Teacup: grimy faded china with a leaking crack, a chipped rim, blood slopped over the saucer and dripping; the "tea" is thick and turning, with bubbles; a second hand hooked on the far rim; the rider is one of the Unwilling (`paintedHead`, now exported from figures.js), lolled over the rim, one long arm hanging down the outside, fingers dripping.
  - Horse: tarnished pole run through its back with a wet ring; a flayed flank showing muscle and ribs; wrong-way knees, one leg snapped; skull-like head, black socket with a red eyeshine glint; gums peeled back over two rows of human teeth, jaw dropped, drool; mane and tail of lank human hair.
  - Cookie: burnt edge, a bite out of it showing wet pink and red; a human face pressed into the dough: real eyes in sunken sockets that dart about, icing tears, a torn screaming mouth with teeth and broken icing stitches; chips like scabs (one moves).
  - Props now `import { paintedHead, glint } from "./figures.js"` (an import cycle with figures.js → ICONS, safe because both are only used at call time).
- Phone UI (ui.css): route cards come before the map on phones (both 2- and 3-choice tiers fit a 375×667 screen); the HUD in the finale is ~85 px tall (was ~140) and the pockets are smaller.

## Performance
- Headless Chromium uses software rasterising, so it is not representative of a laptop.
  - Before: art.render took about 28-36 ms/frame (rAF about 28-38 fps) on desktop 1280x760 at DPR 2.
  - After: about 24-31 ms software; play-test fps went from 28 to 41.
  - With the GPU flags (`prof.cjs ... gpu`), render takes about 1-7 ms.
- The `window.__artProf` ablation switches were removed (cleanup deploy). Frame readout: add `?fps` to the URL, or set `localStorage['escape.fps']='1'`.

## Next steps
1. Done: the pre-fix event shim in `onEvent` is gone; `hit`/`spawn` carry `enemy`.
2. Phone readability: ask content/engine to raise the camera zoom floor on narrow screens (`updateCamera` `Math.max(0.85, …)`, to about 1.15 when W < 500). Already requested via main.
3. Remaining art:
   - Weapon hit effects per weapon (the `hit` event has `enemy`; `throw`/`burst` carry `weapon`).
   - A distinct look for `bigtop`/`carousel`.
   - The bloom/glow additive pass is the next software-render cost.
4. Re-check the GPU timing variance (1.2 ms vs 7 ms runs) with a longer sample.
5. Harness scripts used (scratchpad, not in repo): `artshots.cjs` (zones/enemies/end scenes), `closeup.cjs` (enemy close-ups lit, dark and in states), `prof.cjs` (ablation).
