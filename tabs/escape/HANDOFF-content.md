# Handoff: content & gameplay (Escape the Midway)

Owner files: `js/content.js`, `js/engine.js`, `tests/`. Contract: `ARCHITECTURE.md`.

## Live (deployed)
- Event fix: events are built as `{...payload, type}`. `hit{enemy}` and `spawn{enemy}` replace the old `type` field that overwrote the event name. `throw` and `burst` carry `weapon`; `marked` carries `secs`.
- Route has 5 tiers: `midway` → `mirrors | pen` → `carousel | silent | gallery` → `bigtop` → `gate` (final).
- Every map is about 2–3× bigger, with real branches (the lanes per zone are listed in the comments in `tests/genmaps.py`). Straight runs went from 7–11 s to 14–20 s.
- New enemies:
  - **Arthur Benning** (`arthur`, map char `A`): he keeps his distance and raises the camera (`flashCharge`, 1.0 s). The aim locks 0.4 s before the `flash`. If it hits, you are `marked` for 5 s. Counters: break line of sight, sidestep, dash through it (i-frames), or knock him, which fires `flashCancel`.
  - **The Barker** (`barker`, `R`): the finale boss. Unkillable, with low stun and high mass. He lunges after a telegraph (`barkerWindup` then `barkerLunge`) and calls waves from the flaps farthest from you (`barkerCall`). His phase rises with each breaker thrown.
- The finale (`gate` level) has 3 `breaker`s (`Y`). Standing on a breaker for 2.4 s throws it; progress pauses (it never resets) if you step off or get hit. `gate` obstacles block the exits through `api.block` until all three are thrown, then `gateOpen` fires. `game.finale = { thrown, total, working, open, barker }`.
- New obstacle **Jack-in-the-box** (`jack`, `j`): `jackCrank` (0.75 s) then `jackSpring` (78 px). It springs on enemies too, so you can lure them into it.
- New weapon **popgun** (`G`, projectile `cork`): long range and high stun. It is the anti-Arthur tool.
- Lettie telegraph: she fires a `chalk` event while moving unseen nearby. She ramps up over 0.55 s, and after a hit she returns to her desk, so she can't chain-kill.
- Engine API additions: `api.block`, `los`, `steer`, `chase`, `pathDist`. Levels get `init`/`update` hooks and `silenceBoost`. Stun now decays for custom-behaviour enemies too. The tent-flap cap counts only the relentless hunters the flaps sent, so dormant posed figures no longer switch the clock off.
- Balance changes:
  - Mallet: 6→4 uses, stun 1.8→1.4.
  - Popcorn: stun 2.4→2.0, radius 150→140.
  - Snare: 6→4.5 s.
  - Mirror reversal: 3.2→2.4 s.
  - Unwilling damage: 20→18. Rabbit damage: 12→10.
  - Tobias sits back down after a grab, so no chain-grab.
  - Pressure was retuned per level.

## Committed and being deployed with this handoff
- Pen, Tobias and rabbit tuning.
- Phone camera: zoom floor 0.85→**1.0** when W < 500, and look-ahead 30→**72 px** in the movement direction.
- `settings.js` and the settings screen are documented in ARCHITECTURE.md.

## Balance numbers (`node tests/balance.mjs 24`)
Bot profiles: "sharp" is the default; "average" is `SKILL=0.5 REACT=0.2` (dashes late, half the time).

Before (original maps, average bot), rush escape %:
- midway 100% (8.9 s), mirrors **0%** (Lettie 19/24), pen 100% (11 s, 4 dmg), carousel 100%, silent 100% (8 s), bigtop 0%.
- Every route: 71–83%, about 60 s, no finale.
- Sharp bot: everything 100% except mirrors at 8%; silent and pen took 0 damage.

After (average bot), rush / loot-everything:
- midway 100% 18 s / 100% 53 s
- mirrors 58–92% / 92%
- pen 100% 20 s, 3 dmg / 63–83% 77 s
- carousel 100% / 100%
- silent 83–92% 15 s, 85+ dmg / 100% 36 s, 20 dmg (the short way through the silence now really costs you)
- gallery 100% / 100%
- gate with fresh hp and no weapons: 0–8% (you arrive armed in a real run)

Full routes after (average bot, grabs pickups within 10 tiles):
- mirrors routes: 54–88%, 121–128 s
- pen > carousel: 38–46%
- pen > silent and pen > gallery: 0–4%

The sharp bot wins 92–100% of routes. In engine.test, the finale with a fork is won 20/20. N=24 is noisy (about ±10%).

## Remaining weaknesses / next steps
1. **The pen branch is dominated.** It is about 45 s slower, and the extra tent spawns kill the looting bot later in the run. It's safe if you skip the troughs (rush: 3 dmg). Next: lower `pen.pressure` further or give the pen a unique reward (e.g. a guaranteed mallet + lantern), then rerun `SKILL=0.5 REACT=0.2 node tests/balance.mjs 24`.
2. The gallery is a little easy for its threat rating (rush: 30 dmg). Consider a second Arthur flash window, or a shorter `flashEvery` in the hall.
3. The bot never looks back at Lettie and aims with assist, so its numbers are only relative. Playtest by hand: the mirrors maze and the finale waves (Tobias + Sam) are the likely pain points.
4. Desktop fps in headless Chromium was 29–41 (phone 85–111). The bigger maps make the prerendered tile canvas larger, so the art agent should check this.
5. `tests/genmaps.py --write` rewrites every map. Hand edits in content.js must be ported back to genmaps.py first.
