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
 * silence: the bugs stop here; every one of the Unwilling knows where you are.
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
      api.status("reversed", 2.4);
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
  door:    {}, // tent flap the Unwilling step out of (see OBSTACLES.spawner)
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
    desc: "A two-tined fork, still sugared. Jab one of the Unwilling back a few steps.",
    use(api) { return api.melee({ range: 50, arc: 1.3, force: 430, stun: 1.0 }); },
  },
  hat: {
    name: "Cowboy Hat", short: "Hat", uses: 7, cooldown: 0.25, color: "#c9873f",
    desc: "Thrown like a boomerang. Comes back. Usually. Stuns everything it clips.",
    use(api) { return api.projectile("hat", { speed: 430 }); },
  },
  candy: {
    name: "Cotton-Candy Snare", short: "Snare", uses: 3, cooldown: 0.6, color: "#ff7ad9",
    desc: "Lob a sticky pink cloud. Anything caught in it is stuck fast.",
    use(api) { return api.projectile("candy", { speed: 300 }); },
  },
  rings: {
    name: "Ring-Toss Rings", short: "Rings", uses: 10, cooldown: 0.18, color: "#7af0ff",
    desc: "Fast, light, rapid. Each ring knocks them off their stride.",
    use(api) { return api.projectile("ring", { speed: 560 }); },
  },
  popcorn: {
    name: "Popcorn Flash-Bang", short: "Popcorn", uses: 2, cooldown: 1.2, color: "#fff2a8",
    desc: "A bag that bursts in a hot white bloom. Everything near you reels.",
    use(api) { return api.burst({ radius: 140, force: 500, stun: 2.0, kind: "popcorn" }); },
  },
  mallet: {
    name: "High-Striker Mallet", short: "Mallet", uses: 4, cooldown: 0.85, color: "#ff4d4d",
    desc: "DING. Slow and heavy. Sends them clean across the midway. Only a few swings left in the handle.",
    use(api) { return api.melee({ range: 60, arc: 1.5, force: 860, stun: 1.4, heavy: true }); },
  },
  popgun: {
    name: "Shooting-Gallery Popgun", short: "Popgun", uses: 8, cooldown: 0.55, color: "#8fd16a",
    desc: "Chained to a counter once. One cork, far and straight, and it rings their bell. Knocks a camera out of steady hands.",
    use(api) { return api.projectile("cork", { speed: 720 }); },
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
  cork:  { r: 6, life: 0.6, spin: 0,
           hit(p, e, api) { api.knock(e, p.x, p.y, 380, 1.8); return true; } },
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
 * onCatch(e, api): optional, runs after a contact hit lands.
 *
 * Canon (see tabs/clowns/, "The Unwilling", file 31-W): they are not clowns —
 * clowns choose it. They are the people who refused the light, taken in the
 * night, painted white with a second red mouth, and sent to fetch the next
 * one who refuses. Victims and monsters both.
 */
export const ENEMIES = {
  unwilling: {
    name: "The Unwilling", behavior: "hunter", r: 13, speed: 104, accel: 700,
    sense: 300, stunMul: 1, mass: 1, damage: 18, dreadAura: 3,
    lore: "Someone who stayed home when the light came. Whitened face, a second mouth painted over the first. Sent to fetch you.",
  },
  tobias: {
    unique: true, name: "Tobias Fenn", behavior: "hunter", r: 15, speed: 86, accel: 500,
    sense: 320, stunMul: 0.8, mass: 1.8, damage: 24, dreadAura: 4,
    lore: "The dairyman in overalls, white handprints on the bib. Slow. When he takes hold of something, he does not let go.",
    // he holds you (stuck), then sits back down for a moment: a hard grab, never a chain of them
    onCatch(e, api) { api.status("stuck", 0.7); e.stun = 1.7; api.toast("Tobias Fenn holds on, the way he held the arms of that chair."); },
  },
  sam: {
    unique: true, name: "Samuel Hale", behavior: "hunter", r: 13, speed: 160, accel: 260,
    sense: 380, stunMul: 1.5, mass: 1.3, damage: 24, dreadAura: 4,
    lore: "Marched toward every light on every island. Fast in a straight line; turns like a falling tree. Two discs on a chain.",
  },
  lettie: {
    // ramps up over rampTime after you look away, and scratches chalk (event) while she moves near you
    unique: true, name: "Lettie Ames", behavior: "weeper", r: 12, speed: 178, accel: 1400, rampTime: 0.55, seeCone: 1.1,
    sense: 9999, stunMul: 0.8, mass: 0.9, damage: 18, dreadAura: 2, silent: true,
    lore: "Fingers white to the second knuckle with chalk. She only moves while you are not looking. Heads down, class.",
    // after she lands a hit she is back at her desk: one punishing touch, never a chain of them
    onCatch(e, api) { e.x = e.hx; e.y = e.hy; e.vx = e.vy = 0; e.stun = 2.5; e.ramp = 0; api.toast("Chalk dust. When you look up, Miss Ames is back at the front of the room."); },
  },
  eli: {
    unique: true, name: "Eli Pruitt", behavior: "hunter", r: 9, speed: 138, accel: 900,
    sense: 330, stunMul: 1.3, mass: 0.6, damage: 10, dreadAura: 3,
    lore: "The little one, no shoes, skipping. He asks everyone if they have seen a yellow dog. He cannot remember her name.",
  },
  arthur: {
    unique: true, name: "Arthur Benning", r: 12, speed: 112, accel: 600, sense: 380,
    stunMul: 1.2, mass: 1, damage: 12, dreadAura: 2,
    flashRange: 340, flashCharge: 1.0, flashLock: 0.4, flashCone: 0.2, flashEvery: 5.5, markSecs: 5,
    lore: "Pharmacist's clerk, photographer of birds. He set up his camera at the window to see what came for the ones who stayed home. It still has one exposure left, and it is for you.",
    update(e, api, dt, stunned) { arthurUpdate(e, api, dt, stunned); },
  },
  barker: {
    unique: true, boss: true, name: "The Barker", r: 20, speed: 86, accel: 420, sense: 9999,
    stunMul: 0.45, mass: 3.2, damage: 26, dreadAura: 6,
    lore: "Striped coat, straw boater, a cane with a brass hook. He has called the show every night for seventy years. He cannot be stopped. He can only be kept talking.",
    update(e, api, dt, stunned) { barkerUpdate(e, api, dt, stunned); },
  },
  rabbit: {
    name: "Morphed Rabbit", behavior: "hopper", r: 11, speed: 0, accel: 0, hop: 420,
    hopEvery: 1.0, sense: 170, stunMul: 1.2, mass: 0.6, damage: 10, dreadAura: 1,
    lore: "Too many teeth. Too many legs. Still twitches its nose.",
  },
};

/* ---------------------------------------------------------------- special behaviours
 * Arthur Benning and the Barker replace the stock behaviours (ENEMIES[id].update).
 * Every telegraph is also an event, so audio and UI can carry it without art.
 */
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* Arthur keeps a photographer's distance. When he can see you he raises the
 * camera (flashCharge, ~1 s), tracks you until flashLock seconds before it
 * fires, then flashes. Caught in it = `marked`: every enemy knows where you are.
 * Counters: break line of sight, step out of the narrow cone after the aim
 * locks, dash through it (i-frames), or knock him (any hit cancels the shot). */
function arthurUpdate(e, api, dt, stunned) {
  const d = e.def, p = api.player;
  if (e.charge == null) { e.charge = 0; e.cool = 2 + Math.random() * 2; e.aim = 0; e.chargeDur = d.flashCharge; }
  if (stunned) {
    if (e.charge > 0) {
      e.charge = 0; e.cool = 2.5;
      api.emit("flashCancel", { x: e.x, y: e.y });
      api.toast("The camera jerks aside. The flash goes off into the dark.");
    }
    return;
  }
  const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy);
  e.cool -= dt;
  if (e.charge > 0) {
    const k = Math.exp(-8 * dt); e.vx *= k; e.vy *= k;
    e.charge -= dt;
    if (e.charge > d.flashLock) e.aim = Math.atan2(dy, dx);
    e.face = e.aim;
    if (e.charge <= 0) {
      e.charge = 0; e.cool = (api.level.flashEvery || d.flashEvery) * (0.85 + Math.random() * 0.3);
      const off = Math.abs(wrapAngle(Math.atan2(dy, dx) - e.aim));
      const hit = dist < d.flashRange && off < d.flashCone + Math.atan2(p.r, Math.max(dist, 1)) &&
        p.invuln <= 0 && api.los(e.x, e.y, p.x, p.y);
      api.emit("flash", { x: e.x, y: e.y, face: e.aim, range: d.flashRange, hit });
      if (hit) {
        api.status("marked", d.markSecs); api.sanity(-10);
        api.emit("marked", { x: p.x, y: p.y, secs: d.markSecs });
        api.toast("Click. Arthur Benning has your picture. Every painted face knows where you are.");
      }
    }
    return;
  }
  if (e.alert > 0) {
    const sees = dist < d.flashRange && api.los(e.x, e.y, p.x, p.y);
    if (e.cool <= 0 && sees) {
      e.charge = e.chargeDur = d.flashCharge; e.aim = Math.atan2(dy, dx);
      api.emit("flashCharge", { x: e.x, y: e.y, face: e.aim, dur: d.flashCharge });
      return;
    }
    if (!sees || dist > 250) api.chase(e, d.speed * e.slow, d.accel, dt);
    else if (dist < 150) api.steer(e, e.x - dx, e.y - dy, d.speed * 0.8 * e.slow, d.accel, dt);
    else { const k = Math.exp(-4 * dt); e.vx *= k; e.vy *= k; e.face = Math.atan2(dy, dx); }
  } else {
    if (!e.wander || Math.hypot(e.wander.x - e.x, e.wander.y - e.y) < 8 || Math.random() < dt * 0.25) {
      const a = Math.random() * 6.283, r = Math.random() * 96;
      const wx = e.hx + Math.cos(a) * r, wy = e.hy + Math.sin(a) * r;
      e.wander = api.solidAt(wx, wy) ? { x: e.hx, y: e.hy } : { x: wx, y: wy };
    }
    api.steer(e, e.wander.x, e.wander.y, d.speed * 0.3, d.accel, dt);
  }
}

const BARKER_CALLS = [
  "“STEP RIGHT UP! Nobody leaves before the finale!”",
  "“Don’t go, friend. Everybody you ever knew is in the audience.”",
  "“One does not refuse the show! Bring the lights up!”",
  "“LAST CALL! Last call for the one at the gate!”",
];

/* The Barker: slower than you, unkillable, barely stunnable (stunMul 0.45, mass 3.2).
 * Close in, he winds up a lunge (barkerWindup, ~0.85 s, aim locks for the last
 * 0.25 s) then charges (barkerLunge): sidestep or dash. Every so often, and right
 * after each breaker, he calls a wave out of the tent flaps (barkerCall). Each
 * breaker thrown raises his phase: faster, shorter windups, bigger waves. */
function barkerUpdate(e, api, dt, stunned) {
  const d = e.def, p = api.player, f = api.game.finale;
  if (e.windup == null) { e.windup = 0; e.lunging = 0; e.phase = e.phase || 0; e.calling = 0; e.callT = 3.5; e.lungeCd = 2; e.aim = 0; }
  if (f && !f.barker) f.barker = e;
  if (stunned) { e.windup = 0; e.lunging = 0; return; }
  const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy), ph = e.phase || 0;
  e.callT -= dt; e.lungeCd -= dt;
  if (e.lunging > 0) {
    e.lunging -= dt;
    if (e.lunging <= 0) { e.lunging = 0; e.vx *= 0.3; e.vy *= 0.3; }
    return;
  }
  if (e.windup > 0) {
    e.windup -= dt; const k = Math.exp(-10 * dt); e.vx *= k; e.vy *= k;
    if (e.windup > 0.25) e.aim = Math.atan2(dy, dx);
    e.face = e.aim;
    if (e.windup <= 0) {
      e.windup = 0; const sp = 400 + 30 * ph;
      e.lunging = 0.42; e.vx = Math.cos(e.aim) * sp; e.vy = Math.sin(e.aim) * sp;
      api.emit("barkerLunge", { x: e.x, y: e.y, face: e.aim });
    }
    return;
  }
  if (e.calling > 0) { e.calling -= dt; const k = Math.exp(-8 * dt); e.vx *= k; e.vy *= k; return; }
  if (e.callT <= 0) {
    e.callT = Math.max(8, 15 - 2.5 * ph); e.calling = 1.1;
    api.emit("barkerCall", { x: e.x, y: e.y });
    api.toast(BARKER_CALLS[Math.min(ph, BARKER_CALLS.length - 1)]);
    barkerWave(api, 1 + ph);
    return;
  }
  if (e.lungeCd <= 0 && dist < 190 && api.los(e.x, e.y, p.x, p.y)) {
    const dur = Math.max(0.55, 0.85 - 0.08 * ph);
    e.windup = dur; e.aim = Math.atan2(dy, dx); e.lungeCd = Math.max(1.6, 3.2 - 0.4 * ph) + dur;
    api.emit("barkerWindup", { x: e.x, y: e.y, face: e.aim, dur });
    return;
  }
  api.chase(e, d.speed * (1 + 0.1 * ph) * e.slow, d.accel, dt);
}

/* A wave out of the tent flaps farthest from you (it comes at you, never on top of you). */
function barkerWave(api, n) {
  const p = api.player;
  const flaps = api.entities.filter((o) => o.type === "spawner")
    .sort((a, b) => Math.hypot(b.x - p.x, b.y - p.y) - Math.hypot(a.x - p.x, a.y - p.y));
  const types = ["unwilling", "unwilling", "eli", "sam", "tobias"];
  for (let i = 0; i < Math.min(n, flaps.length); i++) {
    if (api.countEnemies() >= 9) break;
    let type = types[(Math.random() * types.length) | 0];
    if (ENEMIES[type].unique && api.entities.some((o) => o.type === type)) type = "unwilling";
    const fl = flaps[i], en = api.spawn(type, fl.x, fl.y);
    en.alert = 4; en.relentless = true; fl.open = 1.2;
    api.emit("spawn", { x: fl.x, y: fl.y, enemy: type });
  }
}

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
      api.toast("You ate the cookie. Every painted face turns toward you.");
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
  jack: {
    name: "Jack-in-the-Box", r: 13, light: { r: 46, color: "#ffb347", flicker: 0.35 },
    lore: "Turn the crank and it plays the song. Nobody is turning the crank. It springs for anyone close: you, or whatever is chasing you.",
    init(e) { e.crank = 0; e.sprung = 0; e.cool = 0; },
    update(e, api, dt) {
      e.cool = Math.max(0, e.cool - dt);
      if (e.sprung > 0) { e.sprung += dt; if (e.sprung > 3.2) e.sprung = 0; }
      if (e.crank > 0) {
        e.crank -= dt;
        if (e.crank <= 0) {
          e.crank = 0; e.sprung = 0.001; e.cool = 4.5;
          const R = 78, p = api.player;
          api.emit("jackSpring", { x: e.x, y: e.y, radius: R });
          for (const en of api.enemiesNear(e.x, e.y, R)) api.knock(en, e.x, e.y, 520, 2.4);
          if (Math.hypot(p.x - e.x, p.y - e.y) < R + p.r && api.hurt(14, e.x, e.y, "jack")) {
            api.shove(e.x, e.y, 520); api.sanity(-6);
          }
        }
        return;
      }
      if (e.cool > 0 || e.sprung > 0) return;
      const p = api.player;
      const near = Math.hypot(p.x - e.x, p.y - e.y) < 64 || api.enemiesNear(e.x, e.y, 52).some((en) => en.stun <= 0);
      if (near) { e.crank = 0.75; api.emit("jackCrank", { x: e.x, y: e.y, dur: 0.75 }); }
    },
  },
  breaker: {
    // finale: stand on it to throw it. Progress pauses (never resets) if you step off or get hit.
    name: "Gate Breaker", r: 16, light: { r: 70, color: "#ff3b3b", flicker: 0.15 }, work: 2.4,
    lore: "A knife switch in an iron box, the wires running to the gate. It is stiff. It takes both hands.",
    init(e, api) { e.progress = 0; e.done = false; e.index = api.entities.filter((o) => o.type === "breaker").length - 1; },
    touch(e, api, dt) {
      const f = api.game.finale;
      if (e.done || !f || api.player.invuln > 0.3) return;
      e.progress = Math.min(1, e.progress + dt / e.def.work);
      f.working = e.progress;
      if (e.progress < 1) return;
      e.done = true; f.thrown++; f.working = null;
      api.emit("breaker", { x: e.x, y: e.y, index: e.index, thrown: f.thrown, total: f.total });
      if (f.barker) { f.barker.phase = f.thrown; f.barker.callT = Math.min(f.barker.callT || 0, 1.2); }
      if (f.thrown < f.total) {
        api.toast(`CLUNK. A breaker throws. ${f.total - f.thrown} to go. The Barker raises his voice.`);
        return;
      }
      f.open = true;
      for (const g of api.entities) if (g.type === "gate") api.block(g.tx, g.ty, false);
      api.emit("gateOpen", { x: api.game.exitPos.x, y: api.game.exitPos.y });
      api.toast("The chains drop. The gate groans open. RUN.");
    },
  },
  gate: {
    name: "The Front Gate", r: 0,
    lore: "Iron, painted red and gold, taller than the tents. Chained. The breakers are wired to the chains.",
    init(e) { e.open = 0; },
    update(e, api, dt) { const f = api.game.finale; if (f && f.open) e.open = Math.min(1, e.open + dt * 1.4); },
  },
  snare: {
    name: "Cotton-Candy Snare", r: 40, life: 4.5,
    update(e, api, dt) {
      e.age = (e.age || 0) + dt;
      for (const en of api.enemiesNear(e.x, e.y, e.r)) { en.stun = Math.max(en.stun, 0.25); en.snared = 0.25; }
      if (e.age > 4.5) api.remove(e);
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
      // only the hunters the tents sent count toward the cap: dormant figures posed
      // around the map must not switch the clock off
      if (api.entities.filter((o) => o.relentless).length >= pr.max || api.countEnemies() >= 12) return;
      let type = pr.types[(Math.random() * pr.types.length) | 0];
      if (ENEMIES[type].unique && api.entities.some((o) => o.type === type)) type = "unwilling";
      // The Unwilling sent out by the tents never stop hunting you.
      const en = api.spawn(type, e.x, e.y); en.alert = 4; en.relentless = true; e.open = 1.2;
      api.emit("spawn", { x: e.x, y: e.y, enemy: type });
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
  "C": { enemy: "unwilling" }, "F": { enemy: "tobias" }, "L": { enemy: "sam" }, "M": { enemy: "lettie" }, "E": { enemy: "eli" },
  "r": { enemy: "rabbit" }, "A": { enemy: "arthur" }, "R": { enemy: "barker" },
  "j": { obstacle: "jack" }, "Y": { obstacle: "breaker" }, "G": { weapon: "popgun" },
  "u": { obstacle: "teacup" }, "h": { obstacle: "horse" }, "k": { obstacle: "cookie" },
  "D": { obstacle: "dunk", tile: "water" }, "*": { obstacle: "searchlight" },
  "f": { weapon: "fork" }, "H": { weapon: "hat" }, "c": { weapon: "candy" }, "o": { weapon: "rings" },
  "p": { weapon: "popcorn" }, "g": { weapon: "mallet" },
  "a": { item: "apple" }, "b": { item: "lantern" },
};

/* ---------------------------------------------------------------- levels
 * map: rows of LEGEND chars (ragged rows are padded with tent walls).
 * base: floor tile under entity chars.  ambient: darkness 0..1.
 * pressure: the Unwilling stepping out of tent flaps ('V') over time.
 * length/threat (1-5) are shown on the route map; hazards & loot are
 * computed from the map automatically.
 * palette: hints for art (floor tint, fog colour).
 * reward: optional { text, heal, sanity, restock (fraction of a fresh weapon's uses added to each held weapon),
 *   gift: [weaponId, uses] (tops up, fills a free slot, or replaces your most worn-out weapon), toast }
 *   applied when you reach the exit; `text` is shown on the zone's route card.
 * flashEvery: optional override of Arthur's reload time in this zone.
 */
/* LEVELS may also have init(api) (once, after spawns) and update(api, dt) (every
 * frame before entities): the finale uses them to set up game.finale and the gate. */
export const LEVELS = {
  midway: {
    name: "The Midway", tag: "where the bulbs still burn",
    blurb: "Booths line the boardwalk. The lit lane is quick, and watched. The alleys behind are long, dark, and full of things people dropped while running.",
    base: "boards", ambient: 0.9, length: 2, threat: 2,
    pressure: { every: 26, max: 4, types: ["unwilling", "unwilling", "eli"] },
    palette: { fog: "#3a0f2a", tint: "#ff4d6d" },
    map: [
      "####################################################################################",
      '#T""""""""""T""""""""""""""T""""""""""""""""""""""b"""""""""T"""""""""""""""""="""X#',
      '#"""""H"""""""""""""""""""r"""""""""""==============="""""""""""""""""="""""""="""X#',
      '#"""================="""""""""""""""""""""""""""""""""""""r"""""""""""="""""""="""X#',
      '#"""""""""""""""""""""""""""""""""""""""""""""""""""""==============="="""""""=""""#',
      '#"""""""""""""""""""""============="""""""""""""""""""""""""""""""a"""=""""""""""""#',
      '#"""""""""""""""""""""""""""""""""""""""""""""T"""""""""""""""""""""""=""""""T"""""#',
      "#BBBBBBBB,,BBBBBBBBBBBBBBBBBBB,,BBBBBBBBBBBBBBBBBBBBBBBB,,BBBBVBBBBBBBBBBB,,BBBBBBB#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#######,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,BBBBBBB#",
      "#,,l,,,,,,,,,,,l,,,,,,,,,,,l,,,,,,,,#######,,,,l,,,,,,,,,,,l,,,,,,,,,,,l,,,,BBBBBBB#",
      "#,,,,f,,,,,,,,,,,,,,,,,,,,,,,,u,,,,,#######,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,BBBBBBB#",
      "#,S,,,,,,,,,,,,,,,,,,,,,C,,,,,,,,,,,,,,j,,,,,,,,,,,,*,,,,,,,,,,,,,,,,,,,,,,,BBBBBBB#",
      "#,,,,,,,,,,,,,,,,,,,,,k,,,,,,,,,,,,,#######,,,,,,,,,,,,,,,,,,,,,u,,,,,,,,,,,BBBBBBB#",
      "#,,l,,,,,,,,,,,l,,,,,,,,,,,l,,,,,,,,#######,,,,l,,,,,,,,,,,l,,,,,,,,,,,l,,,,BBBBBBB#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#######,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,BBBBBBB#",
      "#BBBBBBBBBBBBBBB,,BBBBBBBVBBBBBBBBBBBBBBBBBB,,BBBBBBBBBBBBBBBBBBBB,,BBBBBBBBBBBBBBB#",
      "#.....................................................................=............#",
      "#.....................................................................=............#",
      "#...===========.................E...............=============.........=............#",
      "#.................................................................j...=............#",
      "#.......o...........===============...................................=............#",
      "#.......................................r...........G...........................a..#",
      "#..................................................................................#",
      "####################################################################################",
    ],
  },
  mirrors: {
    name: "Hall of Mirrors", tag: "short, and it looks back",
    blurb: "The quickest way through. Glass on every side. Touch a mirror and your hands forget which way is which. Something in here only moves when you look away.",
    base: "sawdust", ambient: 0.9, length: 1, threat: 4,
    pressure: { every: 24, max: 4, types: ["lettie", "unwilling"] },
    palette: { fog: "#10233a", tint: "#7af0ff" },
    map: [
      "##############################################################",
      "#:::::::::l:::::::::::l:::::::::::::::l:::::a:::::l:::::::V::#",
      "#:::::::::::::::H:::::::::::::::::C:::::::::::::::::::::::::p#",
      "#::###########################:############################::#",
      "#:f#mmmmmmmmmmmmmmmmmmmmmmmmmm:mmmmmmmmmmmmmmmmmmmmmmmmmmm#::#",
      "#::#m:::::m:::::::::::::::::::::::::::::::::::m::::::::mmm#::#",
      "#::#m:::::m:::::::::::::::::::::::::::::::::::m::::::::mmm#::#",
      "#::#mmmm::mmmmmmmmmm::m::mmmm:lmmmmmmmmmmmmm::m::m::m::mmm#::#",
      "#::#m::m:::::m:::::::::::m:::::m::::::::::::::m::m:::::mmm#::#",
      "#::#m::m:::::m:::::::::::m:::::m::::::::::::::m::m:::::mmm#::#",
      "#::#m::mmmm::m::mmmmmmmmmm::mmmm::mmmm::mmmm::m::mmmmmmmmm#::#",
      "#::#m:::::m:::::m:::::m:::::::::M:m::m::::::::m::::::::mmm#:X#",
      "#S::::::::m:::::m:::::m::::::k::::m::m::::::::m:::::::::::::X#",
      "#::#m::mmmmmmmmmm:ammmm::mmmm::mmmm::mmmmmmmmmm::mmmm::mmm#:X#",
      "#::#m::::::::::::::m:::::m::::::::::::::m::::::::::::::mmm#::#",
      "#::#m::::::::::::::m:::::m::::::::::::::m::::::::::::::mmm#::#",
      "#::#m::mmmmmmm::mmmm::m::m::m:lmmmmmmm::mmmmmmm::mmmm::mmm#::#",
      "#::#m::::::::m:::::::::::::::::m:::::::::::::::::m:::::mmm#::#",
      "#::#m::::::::m:::::::::::::::::m:::::::::::::::::m:::::mmm#::#",
      "#::#mmmmmmmmmmmmmmmmmmmmmmmmmm:mmmmmmmmmmmmmmmmmmmmmmmmmmm#::#",
      "#::#mmmmmmmmmmmmmmmmmmmmmmmmmm:mmmmmmmmmmmmmmmmmmmmmmmmmmm#::#",
      "#::###########################:############################::#",
      "#:::::::::::::::::::o:::::::C::::::::::::::::::::::::::::::::#",
      "#:::::::::l:::::::::::::l:::::::::::::::l:::::b:::::l::::::::#",
      "##############################################################",
    ],
  },
  pen: {
    name: "The Petting Pen", tag: "long, and something is feeding",
    blurb: "The long way round, through the pens. The rabbits were sweet once. There is food left in the troughs, and things worth carrying. It takes time. Time is what the tents want.",
    base: "grass", ambient: 0.86, length: 4, threat: 2,
    // the slow branch: fewer tent flaps opening, and you leave it fed (see reward)
    pressure: { every: 60, max: 2, types: ["unwilling", "eli", "unwilling"] },
    reward: { text: "Leave fed: +35 health, +25 sanity, weapons restocked by half, and the feed shed's popcorn (+4 flash-bangs)", heal: 35, sanity: 25, restock: 0.5, gift: ["popcorn", 4],
      toast: "You leave the pens fed on trough-food, your weapons bound with fence wire, a sack of popcorn from the feed shed under your arm. It tastes of nothing. You feel stronger." },
    palette: { fog: "#1c2a10", tint: "#9dff6a" },
    map: [
      "################################################################################",
      '#"""""""""l"""""""""""""""l"""""""""""""""""l"""""""""""""""l"""""""""""""l""""#',
      '#"S"""""""""""""""""""""""""""""""""""p""""""""""""""""""""""""""""""""""""""""#',
      '#""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""#',
      '#"""""============="""""============="""""======"======"""""=============""""""#',
      '#"""""="""""""""""="""""="""""""""""="""""="""""""""""="""""="""""""""""=""""""#',
      '#"""""=""c""""""""="""""="""""p"""""="""""="""""""""""="""""="""""""""a"=""""""#',
      '#"""""="""""""""""="""""""""""""""""="""""="""""""""""="""""="""""""""""=""""""#',
      '#"""""="""""""r"""="""""="""""""""""="""""="""""r"""""="""""="""r"""""""=""""""#',
      '#"""""="""""""""""="""""=""""""""o""="""""="""""""""""="""""="""""""""""=""""""#',
      '#"""""======"======"""""============="""""============="""""======"======""""""#',
      '#"""""""""""""""""""""""""""~~~~~~~~~~~~~~~~~~~~~~~""""""""""""""""""""""""""""#',
      "#~~~~~~~~~~~~~~~~~~~~~~~~~D~~~~~~~~~~~~~r~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#",
      "#~~~f~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~V~#",
      '#"""""""""""""""""""""""""""~~~~~~~~~~~~~~~~~~~~~~~""""""""""""""""""""""""""""#',
      '#"""""""""""======"======"""""============="""""""======"======""""""""""""""""#',
      '#"""""""""""="""""""""""="""""="""""""""""="""""""="""""""""""="""""""E""""""""#',
      '#"""""""""""="""""""""""="""""=""""""""g""="""""""="""""""""""=""""""""""""""""#',
      '#"""""""""""="""""""""""="""""="""""""""""""""""""="""""""""""=""""""""""""j"""#',
      '#"""""""""""=""""""""b""="""""="""""r"""""="""""""="""""""""""=""""""""""""""""#',
      '#"""""""""""="""""""""""="""""="""""""""""="""""""="""""""""a"=""""""""""""""""#',
      '#"""""""""""============="""""============="""""""=============""""""""""""""""#',
      '#"""=======""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""#',
      '#"""""""""""""""""""""""""""""""""""""""""""""F"""""""""""""""""""========="""X#',
      '#"""""""""""""""""""""""""""""V"""""""""""""""""""""""""""""""""""""""""""""""X#',
      "################################################################################",
    ],
  },
  carousel: {
    name: "Carousel Row", tag: "round and round",
    blurb: "Painted horses circle off their poles. Teacups spin without riders. The dunk tank never drains. There is a mallet on the high-striker if you can reach it.",
    base: "boards", ambient: 0.85, length: 3, threat: 3,
    pressure: { every: 20, max: 5, types: ["unwilling", "tobias", "sam"] },
    palette: { fog: "#2a1236", tint: "#ffb347" },
    map: [
      "##############################################################################",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,l,,,,,,,,V,,,,,,,,,,l,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,u,,,,,,,,,,,,,,,,,,,u,,,,,,,,,,,,,,,,,,,u,,,,,k,,,,,,,b,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#BBBBBBB,,BBBBBBBBBBBBBBBBB,,,,,,,,,,,,,,,,,,,,,,,,,BBBBBBBBBBBBBBBBBB,,BBBBB#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,===,===,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,===,,,,,,,===,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,==,,,,,,,,,,,,,C,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,h,,,,,,,,,,,,,,,,,,=,,,,,,,,,,,,h,,=,,,,,,,,,,,,,,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,=,,h,,,,,,,,,,,,,,=,,,,,,,,,,,,,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,=,,,,,,,,,,,,,,,,,=,,,,,,,,,,,,,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,BBB,,,,,,,==,,,,,,,,,,,,,,,,B,,,,,,,,,X#",
      "#,S,,,,,,,,,,,,,,,,,,,,,C,,,,,,,,,,l,,BBB,,l,,,,,,,,j,,,,,,,,,,,,,,,,,,,,,,,X#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,BBB,,,,,,,==,,,,,,,,,,,,,,,,B,,,,,,,,,X#",
      "#,,,,f,,,,,,,,,,,,,,,,,,,,,,,,=,,,,,,,,g,,,,,,,,=,,,,,,,,,,,,,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,=,,,,,,,,,,,,,,h,,=,,,,,,,,,,,,,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,=,,h,,,,,,,,,,,,=,,,,,,,,,,,,u,,,,,B,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,==,,,,,,,,,,,==,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,===,,,,,,,===,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,===,===,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#",
      "#BBBBBBB,,BBBBBBBBBBBBBBBBB,,,,,,,,,,,,,,,,,,,,,,,,,BBBBBBBBBBBBBBBBBB,,BBBBB#",
      "#,,,,,,,,,,,,,~~~~~~~~~~~~~~~~~,,,,,,,,,,,,,,,,,~~~~~~~~~~~~~,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,~~~~~~~~D~~~~~~~~,,,,,,,,,,,,,,,,,~~~~~~~~~~~~~,,,a,,,,,,,,,,,,#",
      "#,,,,,,,c,,,,,~~~~~~~~~~~~~~~~~,,,,,a,,,,,,,,,,,~~~~~~D~~~~~~,,,,,,,,,,,,,,,,#",
      "#,,,,,,,,,,,,,~~~~~~~~~~~~~~~~~,,,,,,,,V,,,,H,,,~~~~~~~~~~~~~,,,,,,,,,,,,,,,,#",
      "##############################################################################",
    ],
  },
  silent: {
    name: "The Silent Field", tag: "short, and nothing sings",
    blurb: "Straight across the trampled field. No bugs. No crickets. No sound at all, and in that silence every one of the Unwilling hears your heart. Samuel Hale crosses it in four strides.",
    base: "grass", ambient: 0.9, length: 3, threat: 5, silenceBoost: 1.4, // in this field the silence makes them fast
    pressure: { every: 18, max: 5, types: ["sam", "unwilling", "eli"] },
    palette: { fog: "#1a1a22", tint: "#c8c8ff" },
    map: [
      "################################################################################",
      '#"""""""""""""""""""""""""""""""""""""""""""V"""""""r""""""""""""""""""""""""""#',
      '#"""p"""""""""""""""""""r"""""""""""""""o"""""""""""""""""""""""*"""""""""""a""#',
      '#""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""#',
      '#"""""T""T""T""T""T""T""T"sTssTssTssTssTssTssT""T""T""T""T""T""T""T""T""T""""""#',
      '#"""""""""""""""""""""""""sssssssssssssssssss""""""""""""""""""""""""""""""""""#',
      '#"""""""""""""""""""""""""sssssssssssssssssss"C"""""""""""""C""""""""""""""""""#',
      '#"""""T""""""""""""""""""""sssssssssssssssssss"""""""""""""""""""""""""""T"""""#',
      '#"""""""""""""""""""C""""""sssssssssssssssssss""""""""""ssssssssss"""""""""""""#',
      '#""""""""""""""""""""""""""sssssssssssssksssss""""""""""ssssssssss"""""""""""""#',
      '#"""""T"""""""""""""""""""""sssssssssssssssssss"""""""""ssssssssss""""C""T"""""#',
      '#"""""""""""""""""""""""""""sssssssssssssssssss"""""""""ssssssssss""""""""""""X#',
      '#"S"""""""""""""""""""""""""ssssssssLssssssssss"""""""""ssEsssssss""""""""""""X#',
      '#"""""T""""""""""""""""""""""sssssssssssssssssss""""""""ssssssssss"""""""T""""X#',
      '#""""""""""""""""""""""""""""sssssssssssssssssss""""""""ssssssssss"""""""""""""#',
      '#""""""""""""""""""""""""""""sssssssssssssssssss""""""""ssssssssss""""C""""""""#',
      '#"""""T"""""""""""""""""""""""sssssssssssssssssss"""""""ssssssssss"""""""T"""""#',
      '#"""""""""""""""""""""C"""""""sssssssssssssssssss"""""""ssssssssss"""""""""""""#',
      '#"""""""""""""""""""""""""""""sssssssssssssssssss""""""""""""""""""""""""""""""#',
      '#""""""""""""""""""""""""""""""sssssssssssssssssCs""""""""""""C""""""""""""""""#',
      '#""""""""""""""""""""""""""""""sssssssssssssssssss"""""""""""""""""""""""""""""#',
      '#"""""T""T""T""T""T""T""T""T""TssTssTssTssTssTssTs"T""T""T""T""T""T""T""T""""""#',
      '#""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""#',
      '#"b"""""""""""*"""""""""""""""""r"""""""""""""""""G"""""""""""""""""""""""""a""#',
      '#"""""""""""""""""""""""""""""""""""V"""""""""""""""""""""r""""""""""""""""""""#',
      "################################################################################",
    ],
  },
  bigtop: {
    name: "The Big Top", tag: "the gate is through the ring",
    blurb: "Across the ring is quickest: sawdust gone silent under a searchlight. Round the bleachers is long and the audience is restless. Under the bleachers is tight, dark, and someone left supplies. Beyond the far flap: the gate.",
    base: "sawdust", ambient: 0.88, length: 4, threat: 4,
    pressure: { every: 14, max: 7, types: ["unwilling", "sam", "lettie", "tobias", "eli"] },
    palette: { fog: "#3a0808", tint: "#ff2a2a" },
    map: [
      "################################################################################",
      "#:::::::::::::::::::l:::::::::::::::::::V:::::::::::::::::::l::::::::::::::::::#",
      "#:b::::::::::::::::::::::::::::::::::::::B:::::::::::::::::::::::::::::::::::XX#",
      "#::::::::::::::::::::::::::::::BBB:::::::::::::BBB::::::::::::::::A:::::::::::X#",
      "#:::::::F:::::::::::::::::::BB::::::::::j::::::::::BB::::::::::::::::::::::::::#",
      "#::::::::::::::::::::::::BB:::::::BBBBBBBBBBBBB:::::::BB:::::::::::::::::::::::#",
      "#::::::::::::::::::::::BB:::::BBB:::::::::::::::BBB:::::BB:::::::::::::::::::::#",
      "#:::::::::::::::::::::B:::::BB:::::::::::::::::::::Bo:::::B::::::::::::::::::::#",
      "#::::::::::::::::::::B::::aB:::::::::::::::::::::::::BB::::B:::::::::::::::::::#",
      "#:::::::::::::::::::B::::B:::::::::::::::::::::::::::::B::::B::::::::::::::::::#",
      "#::::::::::::::::::B::::B:::::::::C:::::::::::::::::::::B::::B:::::::::::::::::#",
      "#:::::::::::::::::B::::B::::::::sssssssssssssssss::::::::B::::B::::::::::::::::#",
      "#:::::::::::::::::B::::B::::::::sssssssssssssssss:M::::::B::::B::::::::::::::::#",
      "#:::::::::::::::::B:::BB::::::::sssssssssssssssss::::::::BB:::B::::::::::::::::#",
      "#:::::::::V:::::::B:::B:::::::::ssssssss*ssssssss:::::::::B:::B:::::::V::::::::#",
      "#:::::::::::::::::B:::BB::::::::sssssssssssssssss::::::::BB:::B::::::::::::::::#",
      "#:::::::::::::::::B::::B::::::L:sssssssssssssssss::::::::B::::B::::::::::::::::#",
      "#:::::::::::::::::B::::B::::::::sssssssssssssssss::::::::B::::B::::::::::::::::#",
      "#::::::::::::::::::B::::B:::::::::::::::::::::C:::::::::B::::B:::::::::::::::g:#",
      "#:::::::::::::::::::B::::B:::::::::::::::::::::::::::::B::::B::::::::::::::::::#",
      "#::::::::::::::::::::B::::BB:::::::::::::::::::::::::Bp::::B:::::::::::::::::::#",
      "#:::::::::::::::::::::B:::::HB:::::::::::::::::::::BB:::::B::::::::::::::::::::#",
      "#:::f::::::::::::::::::BB:::::BBB:::::::::::::::BBB:::::BB:::::::::::::::::::::#",
      "#::::::::::::::::::::::::BB:::::::BBBBBBBBBBBBB:::::::BB:::::::::::::::::::::::#",
      "#:::::::::::::::::::::::::::BB::::::::::j::::::::::BB:::::::::::::::::E::::::::#",
      "#:S::::::::::::::::::::::::::::BBB:::::::::::::BBB:::::::::::::::::::::::::::::#",
      "#:::::::::::::::::::l::::::::::::::::::BV:::::::::::::::::::l::::::::::::::::::#",
      "################################################################################",
    ],
  },
  gallery: {
    name: "The Portrait Gallery", tag: "hold still",
    blurb: "Arthur Benning's gallery. The lit hall is quick and it is his: when the camera comes up, get behind something or get out of the way. The dark rooms either side are long, full of supplies, and full of the Unwilling, posed and patient. One flash and every one of them turns.",
    base: "dirt", ambient: 0.9, length: 3, threat: 4, flashEvery: 3.6, // Arthur reloads faster in his own hall
    pressure: { every: 15, max: 6, types: ["unwilling", "eli", "unwilling"] },
    palette: { fog: "#241a10", tint: "#fff2c8" },
    map: [
      "##############################################################################",
      "#.............#...........#...........V...........#...........#...........#..#",
      "#.............#...........#...a.......#...........#...........#.......p...#..#",
      "#.............#.....C.....#...........#...........#.......C...#...........#..#",
      "#.............j..............................................................#",
      "#.....G.......#...........#...........#...........#...........#...........#..#",
      "#.............#...........#...........#.....C.....#...........#...........#..#",
      "#.............#...........#...........#...........#.H.........#...........#..#",
      "#.............#...........#...........#...........#...........#...........#..#",
      "########.########.########.########.########.########.########.########.######",
      "#.....l.........l.........l.........l.........l...C.....l.........l.C........#",
      "#.................................................................u.........X#",
      "#.S.....................................A...............j...................X#",
      "#.............................k.............................................X#",
      "#..........l.........l..C......l.........l..C......l.........C.........l.....#",
      "############.########.########.########.########.########.########.########.##",
      "#.........#...........#...........#...........#...........#...........#......#",
      "#.........#...........#...........#...........#...........#...........#......#",
      "#.........#...........#...........#...........C...........#.........E.#......#",
      "#...f.....#...........#...........#...........#...........#...........#......#",
      "#.........#...........C...........#...........#...........#...a.......#......#",
      "#.........................j..................................................#",
      "#.........#...........#...........b...........#...........#.....C.....#......#",
      "#.........#...........#...........#...........#.........o.#...........#......#",
      "#.........#...........#...........#...........#...V.......#...........#......#",
      "##############################################################################",
    ],
  },
  gate: {
    name: "The Front Gate", tag: "it will not open by itself",
    blurb: "The gate is chained and the chains are wired to three breakers. Throw them all. The Barker is between you and the way out, and he is not going to stop talking.",
    base: "dirt", ambient: 0.84, length: 2, threat: 5, final: true,
    pressure: { every: 30, max: 7, types: ["unwilling", "eli"] },
    palette: { fog: "#2a0610", tint: "#ffcf4d" },
    init(api) {
      const g = api.game;
      g.finale = {
        thrown: 0, total: api.entities.filter((e) => e.type === "breaker").length,
        working: null, open: false, barker: api.entities.find((e) => e.type === "barker") || null,
      };
      for (const ex of g.exits) {
        const tx = Math.floor(ex.x / TILE), ty = Math.floor(ex.y / TILE);
        api.block(tx, ty, true); api.spawn("gate", ex.x, ex.y, { tx, ty });
      }
    },
    update(api) { if (api.game.finale) api.game.finale.working = null; },
    map: [
      "##########################################################",
      "########################BBXXXXXXBB########################",
      "#######################BBB......BBB#######################",
      "#.......................l........l.......................#",
      "#.V.......l.....H........................g.....l.......V.#",
      "#...........................R............................#",
      "#...T................................................T...#",
      "#........................................................#",
      "#...........BB..............................BB...........#",
      "#...........BB..............BB..............BB...........#",
      "#...........................BB...........................#",
      "#........................................................#",
      "#........................................................#",
      "#....Y...j..................G...................j...Y....#",
      "#...................BB..............BB...................#",
      "#...................BB..............BB...................#",
      "#........................................................#",
      "#........................................................#",
      "#...........................j............................#",
      "#...........BB..............................BB...........#",
      "#..a........BB..............................BB........a..#",
      "#........................................................#",
      "#...........................Y............................#",
      "#.....T.................f.......p..................T.....#",
      "#.............V.....l.......S........l.....V.............#",
      "##########################################################",
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
  ["carousel", "silent", "gallery"],
  ["bigtop"],
  ["gate"],
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
    unwilling: "White-greased hands took your wrist. They were gentle. They were so gentle.",
    tobias: "Tobias Fenn held on to you the way he held the arms of that chair. He did not let go.",
    sam: "Samuel Hale said he was sorry. He said it while he nailed the door shut behind you, from the outside.",
    lettie: "You turned around. Miss Ames was already there. \"Put your head down,\" she said. Your name was on a blackboard a week ago.",
    eli: "The little one asked if you had a dog. You didn't. He laughed anyway, and skipped, and then he had your shoes.",
    rabbit: "The rabbits were hungry. The Unwilling were patient.",
    teacup: "The teacup spun you until you forgot which way was out.",
    horse: "The carousel horse would not let go.",
    dunk: "The water was warm. Hands helped you up. They had white gloves.",
    arthur: "The flash went off. When your eyes cleared, you were in the picture, standing in the yard with the others, smiling.",
    barker: "\u201cAnd here she is, folks! Here he is!\u201d The Barker held your arm up to the lights, and the audience, who were everyone, applauded.",
    jack: "The box sprang. The song kept playing. It played for a long, long time.",
    sanity: "You stopped running. You started laughing. You could not stop.",
    default: "They were kind about it. They always are.",
  },
  caughtCoda: "You did not refuse. You were simply taken. Now you wear the paint, and the light is warm, and there is someone new at the gate to chase.",
  won: "You pass under the gate. The road beyond is dark and cool and full of crickets.",
  wonCoda: "Behind you, one by one, the bulbs turn to face you. The light still finds you. It always will.",
};
