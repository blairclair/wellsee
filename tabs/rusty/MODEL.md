# Rusty: character model sheet

All characters are drawn in code by **`tabs/rusty/model.js`**, the one shared drawing file. Every panel calls these functions, so Rusty is the same man in every frame.

To see the model sheet, serve the repo root (`python3 -m http.server 8000`) and open `tabs/rusty/tools/modelsheet.html`. It shows every preset, pose, expression, and the wear progression.

## Rusty: Russell Pruitt, 61
- **Build:** about 400 units tall at `s:1`. Stocky through the middle with a mild paunch. He stoops more as `wear` rises: the stoop is `pose.stoop + wear*12`.
- **Face** (`R.CH.rusty`): broad jowly skull, bald on top, with a rust-grey fringe at the ears and a few comb-over wisps (they disappear as wear rises). Bulbous flushed nose (`nose: 1.25`), droopy eyes with bags, bushy rust brows, and a walrus mustache that droops further with wear. Forehead lines, nasolabial folds, crow's feet.
- **Outfits** (`R.OUTFIT`):
  - `work`: faded olive work shirt, navy work pants, brown boots, a key ring on his belt, and an oval cream nametag reading **RUSTY** in red stitching.
  - `suit`: his one good brown thrift suit, white shirt, maroon tie (worn on the diner day and the night he is taken).
  - `eternal`: grey, stained work shirt with the *same tie*, filthy and loosened. The nametag is now carnival red with gold letters plus a gold diamond pin. Blood stains on the shirt and knee. Keys still on the belt.
- **Wear** (`wear: 0..1`) is used only in the eternity pages. It greys the skin toward `#b3aea3`, whitens the hair and mustache, deepens the eye bags, adds stubble halftone, drops the mustache, greys the clothes, reddens the mop, and increases the stoop.
  - p01: 0.6. p02–p21: 0. p22: 0.1. p23: 0.15. p24: 0.4. p25: 0.6. p26: 0.8. p27: 1.0.
- **Props:** a mop (`pose:"mop"`, `"lean"`, or `prop:"mopUp"`), a broom (`pose:"broom"`), a yellow bucket (`R.bucket`), and the carved rabbit (`R.woodRabbit`; pass `color:"#d9c08c"` for the later popsicle-stick version).
- **Hands:** `R.fist` (gripping a bar at x≈36; `ring:true` adds the worn wedding band, `sleeve` a cuff colour), `R.grip` (the full close-up gripping hand from p03: knuckles, overlapping fingers, crossing thumb, chapped skin; `ring`, `wear`, `skin`, `sleeve`, `arm:false` for a wrist only, `rolled:false` for a full sleeve) and `R.openHand` (`curl`, `ring`, `tremble`, `sleeve`, `wear`; tapered three-segment fingers with joint creases and pads; the finger skeleton is unchanged, so overlays drawn against it still line up).

## Views and poses (`R.person`)
- **Three-quarter view:** `o.view` 0 (front, default) to about .7 turns the body: the far half narrows, the button line, tie and nametag slide toward the near side, the far arm goes behind the torso and the head turn defaults to `.25 + .45*view`. Poses may carry a default `view`.
- **Seated:** `sit` (front-on, the original), and three-quarter `sit3q` (forearms on a table edge at about y=-185, `carry` at the near hand), `sitChin` (near hand propping the chin, far forearm on the table) and `sitSlump` (stooped, hands in the lap). Use `flip:-1` for a sitter facing left.
- **Kneeling:** `kneel` (front, back knee on the floor) and `kneel3q` (three-quarter, near arm reaching up and forward, e.g. pinning something to a board).
- **The `dy` frame:** a pose with `dy` (sit, sitLow, sit3q, sitChin, sitSlump, kneel, kneel3q) lowers the torso, neck and head by `dy`. Its `legs`, `arms` and `carry` are *all* written in that already-lowered frame (shoulders at `-298 + dy`), so a custom seated pose copies its shoulder points from an existing seated pose, and `carry` is given in the same frame as the hands.
- **Back view:** `R.personBack(k, o)` draws any character from behind with the same anchors (feet 0, hips -185, shoulders -298), outfits and wear. `o.pose` is `"stand"`, `"walk"` (stepping away, near heel lifted) or `"slump"` (`R.BPOSE`); `stoop` rounds the shoulders and sinks the head; `light` (1 = lit from the right) puts halftone on the far half; `rim:"#ffe48a"` adds a rim light on the lit side; `holdL`/`holdR` draw an svg string at a hand (a thermos); `headTurn` (-1..1) shows an ear and the tip of the mustache; `op` sets opacity. Fringe, full and long hair styles all have a back.
- **Flashback** (`R.CH.rustyYoung`, p06): ten years younger, with more red hair, a flushed face, and the `coat` outfit. Use `expr:"drunk"`.

## Danny Pruitt, 28 (`R.CH.danny`)
Lanky, with dark full hair and light stubble. He has his father's nose, smaller (`nose: 1.05`), and no mustache. Outfit `danny` is a blue flannel and jeans. At 18 (`danny18`) he wears outfit `gown` with `hat:"mortar"`.

## Jess (`R.CH.jess`) and Carol (`R.CH.carol`)
Jess is Danny's wife: long dark hair, outfit `jess` (rust sweater, with a belly bump through `belly:true`). Carol is Rusty's late wife: auburn hair, seen only in the closet photo (p05).

## The Unwilling (`R.player`)
These are the clown-takers. The site's `tabs/clowns/` page calls them *the Unwilling*: refusers who were painted and sent out to fetch the next one.
- About 560 units tall at `s:1` (taller than Rusty). Very long arms that hang past the knees, white four-fingered gloves, a ruff, baggy striped suits, long shoes.
- The face (`R.playerHead`) has cracked white greasepaint, black diamond eye paint with pinprick lights (`glow` colour; red `#ff3b2f` for menace), a red painted grin over a real grin with teeth (`grin:1`), and a red nose.
- `variant` 0 is cream with red stripes and a cone hat. Variant 1 is dark with gold stripes and a cone hat. Variant 2 is maroon with cream stripes and a bowler.
- Poses (`R.PPOSE`): `stand`, `wave`, `point`, `reach`, `escort`, `grab`, `offer`, `clap`. Pass `lean` to bend at the hips, or give `arms` to set custom arm positions.

## Rabbit-things (`R.monsterRabbit`)
Hunched and about 420 tall, with a skull-like snout, needle teeth in a split grin, mismatched glowing red eyes, one tall veined ear and one torn hanging ear, visible ribs, and long clawed arms. `blood:true` adds drool.

## Drawing conventions
- Ink is `#15100d` (`R.INK`). Limbs are drawn as an ink stroke under a colour stroke (`R.limb`), which gives inked tubes.
- For shading, pass `light: 1` (lit from the right) or `light: -1` (lit from the left) on heads and figures. Use `R.tone(k, path, opacity)` for halftone dots, `k.url("dotsR")` for red Ben-Day dots, and `R.vignette`.
- Lettering inside the art (SFX, signs) uses `R.sfx` (Bangers). Dialogue and captions are not SVG; they live in the panel's `balloons` and `captions` arrays (see ARCHITECTURE.md).
