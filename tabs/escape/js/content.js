/* content.js — DATA for Escape the Midway.
 *
 * Owned by the CONTENT agent. Pure data tables plus small behaviour hooks.
 * Nothing here touches the DOM or the canvas. Hooks receive `api` (see
 * engine.js `makeApi` and ARCHITECTURE.md) and the entity they belong to.
 *
 * To add things:
 *   weapon   -> WEAPONS[id]   + a map char in LEGEND (pickup)  + ART.icons[id]/ART.pickups (optional)
 *   enemy    -> ENEMIES[id]   + a map char in LEGEND          + ART.entities[id] (optional; placeholder drawn otherwise)
 *   obstacle -> OBSTACLES[id] + a map char in LEGEND          + ART.entities[id] (optional)
 *   level    -> LEVELS[id]    + list it in a ROUTE tier
 */

export const TILE = 32;

/* ---------------------------------------------------------------- tiles
 * solid: blocks movement.  slow: speed multiplier while standing on it.
 * silence: the bugs stop here; every Player knows where you are.
 * exit: standing on it finishes the zone.
 * light: {r, color, flicker} — a light source at the tile centre.
 * touch(api, ent): called when a walker bumps a solid tile (player only).
 */
export const TILES = {
  tent:    { solid: true },
  fence:   { solid: true },
  booth:   { solid: true },
  tree:    { solid: true },
  lamp:    { solid: true, light: { r: 150, color: "#f6d27a", flicker: 0.12 } },
  mirror:  {
    solid: true,
    touch(api) {
      if (api.hasStatus("reversed")) return;
      api.status("reversed", 3.2);
      api.sanity(-5);
      api.emit("mirror", { x: api.player.x, y: api.player.y });
      api.toast("The mirror smiles back. LEFT IS RIGHT.");
    },
  },
  dirt:    {},
  boards:  {},
  grass:   {},
  sawdust: {},
  silence: { silence: true },
  water:   { slow: 0.45 },
  exit:    { exit: true, light: { r: 210, color: "#9dff6a", flicker: 0.05 } },
  door:    {}, // tent flap a Player can step out of (see OBSTACLES.spawner)
};

/* ---------------------------------------------------------------- weapons
 * uses: durability / ammo. The weapon breaks (is removed) at 0.
 * cooldown: seconds between uses.
 * use(api, player): perform the attack. Return false to NOT spend a use.
 * Helpers on api: melee(opts) projectile(type, opts) burst(opts)
 * color/glyph are UI hints; art draws the real icon via ART.icons[id].
 */
export const WEAPONS = {
  fork: {
    name: "Funnel-Cake Fork", short: "Fork", uses: 14, cooldown: 0.32, color: "#f6d27a",
    desc: "A two-tined fork, still sugared. Jab a Player back a few steps.",
    use(api) { return api.melee({ range: 50, arc: 1.3, force: 430, stun: 1.0 }); },
  },
  hat: {
    name: "Cowboy Hat", short: "Hat", uses: 7, cooldown: 0.25, color: "#c9873f",
    desc: "Thrown like a boomerang. Comes back. Usually. Stuns everything it clips.",
    use(api) { return api.projectile("hat", { speed: 430 }); },
  },
  candy: {
    name: "Cotton-Candy Snare", short: "Snare", uses: 3, cooldown: 0.6, color: "#ff7ad9",
    desc: "Lob a sticky pink cloud. Players caught in it are stuck fast.",
    use(api) { return api.projectile("candy", { speed: 300 }); },
  },
  rings: {
    name: "Ring-Toss Rings", short: "Rings", uses: 10, cooldown: 0.18, color: "#7af0ff",
    desc: "Fast, light, rapid. Each ring knocks a Player off its stride.",
    use(api) { return api.projectile("ring", { speed: 560 }); },
  },
  popcorn: {
    name: "Popcorn Flash-Bang", short: "Popcorn", uses: 2, cooldown: 1.2, color: "#fff2a8",
    desc: "A bag that bursts in a hot white bloom. Everything near you reels.",
    use(api) { return api.burst({ radius: 150, force: 520, stun: 2.4, kind: "popcorn" }); },
  },
  mallet: {
    name: "High-Striker Mallet", short: "Mallet", uses: 6, cooldown: 0.7, color: "#ff4d4d",
    desc: "DING. Slow and heavy. Sends a Player clean across the midway.",
    use(api) { return api.melee({ range: 62, arc: 1.7, force: 900, stun: 1.8, heavy: true }); },
  },
};

/* ---------------------------------------------------------------- projectiles
 * Spawned by api.projectile(type, opts). r: radius, life: seconds.
 * hit(p, enemy, api): called on enemy contact; return true to remove p.
 * expire(p, api): called when life runs out or it hits a wall.
 * boomerang: returns to the thrower after `out` seconds.
 */
export const PROJECTILES = {
  hat:   { r: 12, life: 2.2, boomerang: true, out: 0.42, spin: 14,
           hit(p, e, api) { api.knock(e, p.x, p.y, 320, 1.4); return false; } },
  ring:  { r: 8, life: 0.55, spin: 0,
           hit(p, e, api) { api.knock(e, p.x, p.y, 280, 0.75); return true; } },
  candy: { r: 10, life: 0.55, spin: 6,
           hit(p, e, api) { api.spawn("snare", p.x, p.y); return true; },
           expire(p, api) { api.spawn("snare", p.x, p.y); } },
};

/* ---------------------------------------------------------------- enemies
 * They do not die. They are knocked back and stunned, and they keep coming.
 * behavior: "hunter" (pathfinds to you), "weeper" (moves only when you are
 *   not facing it), "hopper" (lunges in bursts). Or supply update(e, api, dt)
 *   to replace the behaviour entirely.
 * sense: px radius at which it notices you (silence/marked = infinite).
 * stunMul: multiplier on incoming stun. mass: divides knockback.
 * damage: health lost on contact. dreadAura: sanity drain/s when near.
 */
export const ENEMIES = {
  grinner: {
    name: "The Grinner", behavior: "hunter", r: 13, speed: 104, accel: 700,
    sense: 300, stunMul: 1, mass: 1, damage: 20, dreadAura: 3,
    lore: "Once a man who would not come. Now he will not stop smiling.",
  },
  stilt: {
    name: "The Stiltwalker", behavior: "hunter", r: 14, speed: 158, accel: 260,
    sense: 380, stunMul: 1.5, mass: 1.3, damage: 25, dreadAura: 4,
    lore: "Fast in a straight line. Turns like a falling tree.",
  },
  mime: {
    name: "The Mime", behavior: "weeper", r: 12, speed: 210, accel: 2000,
    sense: 9999, stunMul: 0.8, mass: 0.9, damage: 18, dreadAura: 2, silent: true,
    lore: "It only moves while you are not looking. Do not turn your back.",
  },
  rabbit: {
    name: "Morphed Rabbit", behavior: "hopper", r: 11, speed: 0, accel: 0, hop: 420,
    hopEvery: 1.0, sense: 170, stunMul: 1.2, mass: 0.6, damage: 12, dreadAura: 1,
    lore: "Too many teeth. Too many legs. Still twitches its nose.",
  },
};

/* ---------------------------------------------------------------- obstacles
 * Static or moving hazards. Fields: r (collision radius), solid (blocks the
 * player like a wall circle), light ({r,color,flicker}),
 * init(e, api) once on spawn, update(e, api, dt) every frame,
 * touch(e, api, dt) every frame the player overlaps it.
 * e.x/e.y is the current centre; e.hx/e.hy is where it was placed.
 */
export const OBSTACLES = {
  teacup: {
    name: "Spinning Teacup", r: 26, light: { r: 90, color: "#ff5fa2", flicker: 0.1 },
    lore: "It spins whether or not anyone is riding.",
    init(e) { e.phase = Math.random() * 6.28; },
    update(e, api, dt) {
      e.phase += dt * 0.9; e.spin = (e.spin || 0) + dt * 7;
      e.x = e.hx + Math.cos(e.phase) * 46; e.y = e.hy + Math.sin(e.phase * 1.3) * 30;
    },
    touch(e, api) {
      if (api.hurt(14, e.x, e.y, "teacup")) api.shove(e.x, e.y, 520);
    },
  },
  horse: {
    name: "Carousel Horse", r: 15, light: { r: 70, color: "#f6d27a", flicker: 0.2 },
    lore: "Painted smile. Real teeth.",
    init(e) { e.phase = Math.random() * 6.28; },
    update(e, api, dt) {
      e.phase += dt * 1.15;
      e.x = e.hx + Math.cos(e.phase) * 52; e.y = e.hy + Math.sin(e.phase) * 52;
      e.bob = Math.sin(e.phase * 4);
    },
    touch(e, api) {
      if (api.hurt(16, e.x, e.y, "horse")) { api.shove(e.x, e.y, 380); api.emit("bite", { x: e.x, y: e.y }); }
    },
  },
  cookie: {
    name: "Cursed Cookie", r: 12, light: { r: 60, color: "#b46cff", flicker: 0.3 },
    lore: "Warm. Sweet. It has a face. The face is yours.",
    touch(e, api) {
      api.heal(30); api.sanity(-30); api.status("marked", 7);
      api.emit("cookie", { x: e.x, y: e.y });
      api.toast("You ate the cookie. Every Player turns toward you.");
      api.remove(e);
    },
  },
  dunk: {
    name: "Dunk Tank", r: 22, solid: false, light: { r: 80, color: "#5fd0ff", flicker: 0.1 },
    lore: "Step right up. Hit the target. Someone is still in the water.",
    update(e, api, dt) { e.cool = Math.max(0, (e.cool || 0) - dt); },
    touch(e, api) {
      if (e.cool > 0) return;
      e.cool = 4;
      api.status("stuck", 1.3); api.sanity(-8); api.hurt(6, e.x, e.y, "dunk");
      api.emit("splash", { x: e.x, y: e.y });
      api.toast("A wet hand closes on your ankle.");
    },
  },
  searchlight: {
    name: "The Light", r: 0, lore: "When its light shines upon you, you do not refuse.",
    init(e) { e.ang = Math.random() * 6.28; e.len = 230; },
    update(e, api, dt) {
      e.ang += dt * 0.55;
      const p = api.player; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
      let diff = Math.atan2(dy, dx) - e.ang; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      e.lit = d < e.len && Math.abs(diff) < 0.32;
      if (e.lit) {
        api.sanity(-9 * dt);
        if (!api.hasStatus("marked")) { api.status("marked", 3); api.emit("marked", { x: p.x, y: p.y }); api.toast("The light finds you."); }
      }
    },
  },
  snare: {
    name: "Cotton-Candy Snare", r: 46, life: 6,
    update(e, api, dt) {
      e.age = (e.age || 0) + dt;
      for (const en of api.enemiesNear(e.x, e.y, e.r)) { en.stun = Math.max(en.stun, 0.25); en.snared = 0.25; }
      if (e.age > 6) api.remove(e);
    },
  },
  spawner: {
    name: "Tent Flap", r: 0,
    init(e, api) { e.timer = api.level.pressure ? api.level.pressure.every * (0.5 + Math.random() * 0.7) : 1e9; },
    update(e, api, dt) {
      const pr = api.level.pressure; if (!pr) return;
      e.timer -= dt; e.open = Math.max(0, (e.open || 0) - dt);
      if (e.timer > 0) return;
      e.timer = pr.every * (0.8 + Math.random() * 0.4);
      if (api.countEnemies() >= pr.max) return;
      const type = pr.types[(Math.random() * pr.types.length) | 0];
      // Players sent out by the tents never stop hunting you.
      const en = api.spawn(type, e.x, e.y); en.alert = 4; en.relentless = true; e.open = 1.2;
      api.emit("spawn", { x: e.x, y: e.y, type });
      api.toast("A tent flap opens. Someone steps out.");
    },
  },
};

/* ---------------------------------------------------------------- pickups
 * Weapons are picked up automatically by walking over them (if a slot is
 * free, or the same weapon is held — then uses are topped up).
 * Items: touch(api) when collected.
 */
export const ITEMS = {
  apple:   { name: "Candy Apple", r: 11, light: { r: 50, color: "#ff3b3b" },
             collect(api) { api.heal(25); api.toast("Candy apple. Sweet. Something inside crunched."); } },
  lantern: { name: "Bug Lantern", r: 11, light: { r: 80, color: "#c6ff6a", flicker: 0.25 },
             collect(api) { api.sanity(40); api.toast("A jar of living fireflies. They still sing."); } },
};

/* ---------------------------------------------------------------- legend
 * Map characters -> { tile } and optionally { enemy | obstacle | weapon | item }.
 * Entity chars stand on the level's `base` floor tile unless `tile` is given.
 */
export const LEGEND = {
  "#": { tile: "tent" }, "=": { tile: "fence" }, "B": { tile: "booth" }, "T": { tile: "tree" },
  "l": { tile: "lamp" }, "m": { tile: "mirror" },
  ".": { tile: "dirt" }, ",": { tile: "boards" }, '"': { tile: "grass" }, ":": { tile: "sawdust" },
  "s": { tile: "silence" }, "~": { tile: "water" }, "X": { tile: "exit" },
  "S": { start: true },
  "V": { tile: "door", obstacle: "spawner" },
  "C": { enemy: "grinner" }, "L": { enemy: "stilt" }, "M": { enemy: "mime" }, "r": { enemy: "rabbit" },
  "u": { obstacle: "teacup" }, "h": { obstacle: "horse" }, "k": { obstacle: "cookie" },
  "D": { obstacle: "dunk", tile: "water" }, "*": { obstacle: "searchlight" },
  "f": { weapon: "fork" }, "H": { weapon: "hat" }, "c": { weapon: "candy" }, "o": { weapon: "rings" },
  "p": { weapon: "popcorn" }, "g": { weapon: "mallet" },
  "a": { item: "apple" }, "b": { item: "lantern" },
};

/* ---------------------------------------------------------------- levels
 * map: rows of LEGEND chars (ragged rows are padded with tent walls).
 * base: floor tile under entity chars.  ambient: darkness 0..1.
 * pressure: Players stepping out of tent flaps ('V') over time.
 * length/threat (1-5) are shown on the route map; hazards & loot are
 * computed from the map automatically.
 * palette: hints for art (floor tint, fog colour).
 */
export const LEVELS = {
  midway: {
    name: "The Midway", tag: "where the bulbs still burn",
    blurb: "Booths line the boardwalk. The lit lane is quick, and watched. The alleys behind are long, dark, and full of things people dropped while running.",
    base: "boards", ambient: 0.9, length: 2, threat: 2,
    pressure: { every: 26, max: 4, types: ["grinner"] },
    palette: { fog: "#3a0f2a", tint: "#ff4d6d" },
    map: [
      "############################################",
      '#T""""""""""T"""""""""""""""""T"""""""""""T#',
      '#""H""=====""""""r""""""======"""""""a"""""#',
      '#""""""""""""""""""""""=====""""""""""""""X#',
      '#"""=====""""""""""""""""""""""""""""=====X#',
      '#BBBBB""BBBBBBBBBB""BBBBBBBBBBBBBB""BBBBB""#',
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,l,,,,,,,,,l,,,,,,,,,,,,l,,,,,,,,,,,l,,,,#",
      "#S,,f,,,,,,,,,,,,,,k,,,,,,,,,,,u,,,,,,,,,,X#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,C,,,,,,,,,,,,,,,,X#",
      "#,,l,,,,,,,,,l,,,,,,,,,,,,l,,,,,,,,,,,l,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#BBBBBBB..BBBBBBBBBBBVBBBBBBBBBBB..BBBBBBBB#",
      "#..........................................#",
      "#..====...........======.........=====...b.#",
      "#..o.....................*.................#",
      "#..................C.......................#",
      "############################################",
    ],
  },
  mirrors: {
    name: "Hall of Mirrors", tag: "short, and it looks back",
    blurb: "The quickest way through. Glass on every side. Touch a mirror and your hands forget which way is which. Something in here only moves when you look away.",
    base: "sawdust", ambient: 0.9, length: 1, threat: 4,
    pressure: { every: 30, max: 4, types: ["mime", "grinner"] },
    palette: { fog: "#10233a", tint: "#7af0ff" },
    map: [
      "#######################################",
      "#S:::::m::::::::m::::::::::m::::::::X:#",
      "#::f:::m::mmmm::m::mmmmmm::m::mmmm::X:#",
      "#::::::m::m:::::::::m::::::m:::::m::::#",
      "#mmm:::m::m::mmmmmmmm::M:::m::m::m::::#",
      "#::::::::::::::l:::::::::::::::m:::mmm#",
      "#::mmmmmmmmm::::::mmmmmmmmm::mmm::::::#",
      "#::::::::::m::::::m::::::::::::::::a::#",
      "#mmmmm:::::m::k:::m:::mmmmmm:::mmmmm::#",
      "#::::m::M::m::::::m:::m::::m:::::::m::#",
      "#::H:m:::::mmmmV:mm:::m::l:m:::M:::m::#",
      "#:::::::::::::::::::::::::::::::::::::#",
      "#######################################",
    ],
  },
  pen: {
    name: "The Petting Pen", tag: "long, and something is feeding",
    blurb: "The long way round, through the pens. The rabbits were sweet once. There is food left in the troughs, and things worth carrying. It takes time. Time is what the tents want.",
    base: "grass", ambient: 0.86, length: 4, threat: 2,
    pressure: { every: 20, max: 5, types: ["grinner"] },
    palette: { fog: "#1c2a10", tint: "#9dff6a" },
    map: [
      "#################################################",
      '#S""""""=""""""""""""""""""=""""""""""""""""""""#',
      '#""""""""=""r"""""c"""""""""=""""""r""""""a"""""#',
      '#""""""""=""""""""""""""""""="""""""""""""""""""#',
      '#""f"""""======""=======""""======"""""=======""#',
      '#"""""""""""""""""""""""""""""""""""""""""""""""#',
      '#""l"""""""""""""""l""""""""""""""""l"""""""""""#',
      '#====""=====""""""""""=========""""""""=====""==#',
      '#"""""""""""=""r""""o""=""""""""""="""""""""""""#',
      '#"""a""""""""=""""""""""=""""r""""""=""""""p""""#',
      '#""""""""r"""=""""""""""=""""""""""=""""""""""""#',
      '#"""""""""""""=====V=====""""""""""=""""""""""""#',
      '#""""""""""""""""""""""""""""""C""""""""""""""""#',
      '#"""b"""""""""""""""""""""""""""""""""""""""""XX#',
      "#################################################",
    ],
  },
  carousel: {
    name: "Carousel Row", tag: "round and round",
    blurb: "Painted horses circle off their poles. Teacups spin without riders. The dunk tank never drains. There is a mallet on the high-striker if you can reach it.",
    base: "boards", ambient: 0.85, length: 3, threat: 3,
    pressure: { every: 22, max: 5, types: ["grinner", "grinner", "stilt"] },
    palette: { fog: "#2a1236", tint: "#ffb347" },
    map: [
      "##############################################",
      "#S,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,h,,,,,,,,,,,,,,,,,u,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,l,,,,,,,,,,,,,,,,,,h,,,,,,#",
      "#BBBB,,,,,,,,,BBBBBBBBB,,,,,,,,BBBBB,,,,,,,,,#",
      "#,,g,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,~~~~~~,,,,,,,,,,,,,,,,,,,,k,,,,,,,,,,#",
      "#,,,,,,,~~D~~~,,,,,,,u,,,,,,C,,,,,,,,,,,,,a,,#",
      "#,,,,,,,~~~~~~,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#BBBBBBBBBBBB,,,,,,,BBBBBBVBBBBBB,,,,,,BBBBBB#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,c,,,,,,h,,,,,,,,,,,,,,,,,l,,,,,,,,,,,,,,XX#",
      "##############################################",
    ],
  },
  silent: {
    name: "The Silent Field", tag: "short, and nothing sings",
    blurb: "Straight across the trampled field. No bugs. No crickets. No sound at all, and in that silence every Player hears your heart. Stiltwalkers cross it in four strides.",
    base: "grass", ambient: 0.9, length: 2, threat: 5,
    pressure: { every: 18, max: 4, types: ["stilt", "grinner"] },
    palette: { fog: "#1a1a22", tint: "#c8c8ff" },
    map: [
      "########################################",
      '#S"""""""""""""""""T"""""""""""""""""""#',
      '#""p"""""sssssss"""""""""ssssss"""""""X#',
      '#"""""""ssssssssss""""""sssssssss"""""X#',
      '#"""T"""sssssssssss"""""ssssLsss"""""""#',
      '#"""""""ssssssssss""""*""ssssssss""""""#',
      '#""""""""ssssssss""""""""""ssssss"""T""#',
      '#""""b"""""""""""""""""""""""""""""""""#',
      '#"""""""""""""T"""""V""""""""""o"""""""#',
      '#""""""""""""""""""""""""""""""""""""""#',
      "########################################",
    ],
  },
  bigtop: {
    name: "The Big Top", tag: "the gate is through the ring",
    blurb: "The only way out is through the ring. The audience is all Players now, and the show has been waiting for you. Beyond the far flap: the gate.",
    base: "sawdust", ambient: 0.88, length: 3, threat: 5, final: true,
    pressure: { every: 15, max: 7, types: ["grinner", "stilt", "mime"] },
    palette: { fog: "#3a0808", tint: "#ff2a2a" },
    map: [
      "##############################################",
      "#S::::::#::::::::::::::::::::::::::#:::::::XX#",
      "#:::f:::#:::::::::::V::::::::::::::#:::::::::#",
      "#:::::::#::::l:::::::::::::::l:::::#::::k::::#",
      "#:::::::::::::::::::::u::::::::::::::::::::::#",
      "#::a::::#:::::::sssssssssss::::::::#:::::::::#",
      "#:::::::#::::C::sssssssssss::::L:::#:::::::::#",
      "#########:::::::sssss*sssss::::::::####:::####",
      "#:::::::::::::::sssssssssss::::::::::::::::::#",
      "#::o::::#:::::::sssssssssss:::::::::#:::::H::#",
      "#:::::::#::::l:::::::::::::::l:::::#:::::::::#",
      "#::b::::#::::::::::::::::::::M:::::#::p::::::#",
      "#:::::::#::::::::::::V:::::::::::::#:::::::::#",
      "##############################################",
    ],
  },
};

/* ---------------------------------------------------------------- route
 * Tiers of zones. After finishing a zone you pick one zone of the next tier.
 * The last tier must contain the final level.
 */
export const ROUTE = [
  ["midway"],
  ["mirrors", "pen"],
  ["carousel", "silent"],
  ["bigtop"],
];

/* ---------------------------------------------------------------- player */
export const PLAYER = {
  r: 11, speed: 158, accel: 1500, friction: 9,
  dashSpeed: 430, dashTime: 0.17, dashCooldown: 1.1,
  maxHealth: 100, maxSanity: 100, invuln: 0.9, slots: 3,
  sanityRegen: 1.2,       // per second when nothing is near
  silenceDrain: 4,        // per second inside a silence zone
};

/* ---------------------------------------------------------------- words */
export const TEXT = {
  title: "Escape the Midway",
  subtitle: "One does not refuse the carnival when its light shines upon them.",
  caught: {
    grinner: "The Grinner caught your wrist. It was gentle. It was so gentle.",
    stilt: "The Stiltwalker folded down over you like a tent coming down.",
    mime: "You turned around. It was already there. It had been there the whole time.",
    rabbit: "The rabbits were hungry. The Players were patient.",
    teacup: "The teacup spun you until you forgot which way was out.",
    horse: "The carousel horse would not let go.",
    dunk: "The water was warm. Hands helped you up. They had white gloves.",
    sanity: "You stopped running. You started laughing. You could not stop.",
    default: "They were kind about it. They always are.",
  },
  caughtCoda: "You did not refuse. You were simply taken. Now you wear the paint, and the light is warm, and there is someone new at the gate to chase.",
  won: "You pass under the gate. The road beyond is dark and cool and full of crickets.",
  wonCoda: "Behind you, one by one, the bulbs turn to face you. The light still finds you. It always will.",
};
