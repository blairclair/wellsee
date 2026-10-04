# Escape the Midway — module contract

A top-down escape game. There is no build step: plain ES modules, loaded by
`index.html` via `<script type="module" src="js/main.js">`. Test from the repo
root with `python3 -m http.server`, then open `/tabs/escape/`.

## Who owns what

| File | Owner | Owns |
|---|---|---|
| `index.html` | shared (rarely touched) | page shell: nav, `#stage` > `canvas#game` + `div#ui` |
| `style.css` | shared | page layout only (stage fills the viewport under the nav) |
| `js/main.js` | shared | boot, rAF loop, state machine, canvas sizing, event fan-out |
| `js/engine.js` | **content/gameplay** | input, level loading, movement, collision, AI, pathfinding, weapons, statuses, win/lose, camera, the `api` |
| `js/content.js` | **content agent** | DATA: tiles, weapons, projectiles, enemies, obstacles, items, legend, levels, route, player tuning, all story text |
| `js/art.js` | **art agent** | every canvas pixel: tiles, entities, icons, particles, lighting, post-fx, cinematics |
| `js/ui.js` + `ui.css` | **UI agent** | all DOM: HUD, menus, route map, touch controls, toasts, curtain transitions |
| `js/audio.js` | anyone | WebAudio synth. Muted by default, toggled by the player only |
| `tests/*.mjs` | anyone | `node tests/maps.test.mjs`, `node tests/engine.test.mjs` (no browser needed) |

Rules: engine never draws or builds DOM; art never mutates game state (only its own
`fx`); ui never touches the canvas except painting icons via `art.paintIcon`;
content has no imports. If you must change a cross-module signature, update this file.

## Data flow

```
input (keyboard / ui touch) -> engine.update(game, dt) -> game.events[]
main.js each frame: events -> art.onEvent / audio.onEvent / ui.onEvent
                     art.render(ctx, game, cam, view)   ui.hud(game)   audio.frame(game, dt)
```

### State machine (main.js)
`title -> route -> intro -> playing <-> paused`; from `playing`: exit -> `leaving` ->
`route` (next tier) or `won` (if `level.final`); caught -> `lost` (1.3 s slow-mo, then
`art.renderCaught` under the lost screen). Retry = new run. `window.__escape` exposes
the state for debugging and automated play-tests.

## Shapes

**run** (survives across zones): `{ health, sanity, inventory:[{id, uses}], sel, path:[levelId], tier, time, repelled, hurtCount }`

**game** (one zone): `{ run, levelId, level, w, h, tiles:[tileName], entities:[], events:[], time, status:{name:secondsLeft}, silence, dread(0..1, smoothed), player, exits:[{x,y}], exitPos, outcome:null|{type:"exit"}|{type:"caught", by}, api }`

**entity**: `{ id, cat:"enemy"|"obstacle"|"proj"|"pickup", type, def, x, y, hx, hy (spawn point), vx, vy, r, face (radians), t (age) ... }`
- enemy adds `stun, alert, frozen (mime is being watched), hitFlash, relentless, snared`
- pickup adds `weapon` or `item`, `uses`
- proj adds `life, age, rot, returning, hitIds`
- obstacles keep whatever their hooks put on them (`phase, spin, lit, ang, len, open, age`)

**player**: `{ x, y, vx, vy, r, face, moving, step, invuln, dashT, dashCd, atkCd, swing, swingArc, swingRange }`

World units are pixels; `TILE = 32`. Entity `x,y` is the **feet** (ground contact).

## Adding content (content.js only — art falls back to a labelled placeholder)

**Weapon**: add `WEAPONS.id = { name, short, uses, cooldown, color, desc, use(api) }`.
`use` calls one of `api.melee({range, arc, force, stun, heavy})`, `api.projectile(type, {speed})`,
`api.burst({radius, force, stun, kind})` and returns `false` to not spend a use
(melee already returns false on a whiff). Add a pickup char in `LEGEND` (`{ weapon: "id" }`).
Optional art: `ICONS.id(ctx, size, t)` (used by the HUD, route map and floor pickups).

**Projectile**: `PROJECTILES.id = { r, life, spin, boomerang?, out?, hit(p, enemy, api) -> removeBool, expire?(p, api) }`.
Art: `ENTITY_ART.id`.

**Enemy**: `ENEMIES.id = { name, lore, behavior: "hunter"|"weeper"|"hopper", r, speed, accel, sense, stunMul, mass, damage, dreadAura, hop?, hopEvery? }`
or give it `update(e, api, dt)` to replace the behaviour. They can't be killed, only knocked/stunned.
Add a `LEGEND` char, optionally list it in a level's `pressure.types`, add `TEXT.caught.id`.
Art: `ENTITY_ART.id`.

**Obstacle**: `OBSTACLES.id = { name, lore, r, light?, init?(e, api), update?(e, api, dt), touch?(e, api, dt) }`.
`touch` runs every frame the player overlaps (use `api.hurt`'s return value or your own cooldown).

**Tile**: `TILES.name = { solid?, slow?, silence?, exit?, light?:{r,color,flicker}, touch?(api) }` + a `LEGEND` char.
Art: `TILE_ART.name(ctx, x, y, size, tx, ty, game)` (static, prerendered) and optionally `TILE_FX.name(ctx, x, y, size, t)` (animated).

**Level**: `LEVELS.id = { name, tag, blurb, base, ambient, length(1-5), threat(1-5), pressure:{every, max, types}, palette, final?, map:[rows] }`
then put the id in a `ROUTE` tier. Maps need a closed border, one `S`, at least one `X`.
Run `node tests/normalize-maps.mjs` (pads ragged rows) and `node tests/maps.test.mjs`.
Route-map loot/hazards/foes are computed from the map by `engine.summarizeLevel`.

### Legend
`#` tent `=` fence `B` booth `T` dead tree `l` lamp `m` mirror · `.` dirt `,` boards `"` grass `:` sawdust
`s` silence `~` water `X` exit `S` start `V` tent flap (spawner) · `C` Grinner `L` Stiltwalker `M` Mime `r` rabbit ·
`u` teacup `h` carousel horse `k` cursed cookie `D` dunk tank `*` searchlight ·
`f` fork `H` hat `c` cotton-candy snare `o` rings `p` popcorn `g` mallet · `a` candy apple `b` bug lantern

## The `api` (engine.makeApi) handed to every hook
`player, entities, level, run, time, game` ·
`emit(type, data)` `toast(msg)` `status(name, secs)` `hasStatus(name)` `solidAt(x,y)` ·
`heal(n)` `sanity(delta)` `hurt(n, sx, sy, cause) -> applied` `shove(sx, sy, force)` (player) ·
`knock(enemy, sx, sy, force, stun)` `enemiesNear(x, y, r)` `countEnemies()` `spawn(type, x, y, props) -> e` `remove(e)` ·
`melee(opts)` `projectile(type, opts)` `burst(opts)`.
Statuses in use: `reversed` (mirror), `stuck` (dunk tank), `marked` (cookie / searchlight: every Player knows where you are).

## Events (`game.events`, consumed by art / audio / ui)
`hit{x,y,type,force}` `ding` `hurt{x,y,n,cause}` `grab{x,y,enemy}` `swing{x,y,face,range,arc,heavy,weapon}`
`throw{x,y,face,proj}` `burst{x,y,radius,kind}` `pickup{x,y,weapon|item,res}` `break{weapon}` `select`
`spawn{x,y,type}` `cookie` `splash` `mirror` `bite` `marked` `dash{face}` `hop` `catch` `projEnd{proj}`
`silenceEnter` `silenceExit` `exit` `caught{by}` `toast{msg}` `heal` `sanityHit`.
Unknown events must be ignored by consumers, so anyone can add new ones.

## Art contract (art.js)
- `ENTITY_ART[type](ctx, e, t, view)` — ctx is already translated to the entity's feet; draw upward
  (negative y). `view = { W, H, dpr, t, dt, reduced, heldWeapon }`. The player is `ENTITY_ART.player`.
  Unknown types use `placeholder()`.
- `TILE_ART[name](ctx, x, y, s, tx, ty, game)` — prerendered once per level at 2x into an offscreen canvas.
- `TILE_FX[name](ctx, x, y, s, t)` — per frame, only for visible tiles.
- `ICONS[id](ctx, size, t)` — centred at 0,0. `paintIcon(canvas, id, cssSize)` paints an icon or a
  mini entity into a DOM canvas (used by ui.js).
- Lighting: darkness layer at half resolution with `ambient` from the level; light sources come from
  `TILES[*].light`, `def.light` on entities, pickups, alerted enemies, bulbs along booth/tent edges, and the
  player's lantern (radius shrinks with sanity).
- Post-fx: silence desaturates, `reversed` tints cyan, low sanity shows grins at the edges, vignette tightens
  with `game.dread`, heartbeat pulse at high dread.
- **Safety**: full-screen flashes go through `flash()` which rate-limits to one per 0.4 s (< 3/s) and
  weakens them under `view.reduced`; `shake()` is disabled under reduced motion. Keep it that way.
- Cinematics: `renderTitle`, `renderCaught(ctx, W, H, t, view, cause)` (face painted into a Player over 4 s;
  keep it in the top ~half — the lost text sits below), `renderWin` (top half, same reason), `renderBackdrop`.

## UI contract (ui.js)
`createUI(root, { input, onStart, onChoose(levelId), onPause, onResume, onQuit, onRetry, onSound })` returns
`{ show(screen|null, data), hud(game), onEvent(ev), curtain(midwayFn) -> Promise, toast(msg), setSound(on), resetHud() }`.
Screens: `title`, `howto {back}`, `route {run}`, `intro {name, tag, index}`, `pause`, `lost {by, run}`, `won {run}`.
`hud()` runs every frame — keep it diffed (see `set()`). Touch controls write `input.virt`, `input.press(action)`,
`input.held.attack`. Actions: `attack dash next prev slot0..2 pause mute confirm`.
The nav is forced onto one line on phones by `style.css` so the stage keeps its height.

## Testing
```
node tabs/escape/tests/maps.test.mjs     # every map rectangular, closed, start->exit reachable
node tabs/escape/tests/engine.test.mjs   # bot walks every level to the exit, idle run resolves, no throws
```
For a browser check, Playwright works: load the page, click `.js-start`, `.choice`, play, and inspect
`window.__escape` (see the phase-1 report for the script used).
