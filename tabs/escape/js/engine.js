/* engine.js — simulation for Escape the Midway.
 *
 * Owns: input (keyboard + virtual/touch), level loading, movement, tile and
 * circle collision, enemy behaviours + pathfinding, weapons/projectiles,
 * statuses, win/lose detection, and the `api` handed to content hooks.
 *
 * It never draws and never touches DOM other than keyboard listeners.
 * It reports everything that happened through `game.events` (see
 * ARCHITECTURE.md "Events"); main.js forwards those to art, audio and ui.
 */
import {
  TILE, TILES, WEAPONS, PROJECTILES, ENEMIES, OBSTACLES, ITEMS, LEGEND, LEVELS, PLAYER,
} from "./content.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let nextId = 1;

/* ================================================================ input */
export const input = {
  keys: new Set(),
  pressed: new Set(),          // edge-triggered actions, cleared each tick by consume()
  virt: { x: 0, y: 0 },        // touch joystick, -1..1
  held: { attack: false, dash: false },
  enabled: true,
  press(action) { this.pressed.add(action); },
  take(action) { const had = this.pressed.has(action); this.pressed.delete(action); return had; },
  clear() { this.pressed.clear(); this.keys.clear(); this.virt.x = this.virt.y = 0; this.held.attack = this.held.dash = false; },
  axis() {
    let x = 0, y = 0; const k = this.keys;
    if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
    if (k.has("KeyW") || k.has("ArrowUp")) y -= 1;
    if (k.has("KeyS") || k.has("ArrowDown")) y += 1;
    x += this.virt.x; y += this.virt.y;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y };
  },
  attach(target = window) {
    const KEYMAP = {
      Space: "attack", KeyJ: "attack", KeyZ: "attack",
      ShiftLeft: "dash", ShiftRight: "dash", KeyK: "dash", KeyX: "dash",
      KeyQ: "prev", KeyE: "next", Tab: "next",
      Digit1: "slot0", Digit2: "slot1", Digit3: "slot2",
      Escape: "pause", KeyP: "pause", Enter: "confirm", KeyM: "mute",
    };
    const GAME_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"]);
    target.addEventListener("keydown", (ev) => {
      if (!this.enabled) return;
      const tag = ev.target && ev.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (GAME_KEYS.has(ev.code) && this.shouldCapture()) ev.preventDefault();
      if (!ev.repeat && KEYMAP[ev.code]) this.press(KEYMAP[ev.code]);
      if (KEYMAP[ev.code] === "attack") this.held.attack = true;
      this.keys.add(ev.code);
    });
    target.addEventListener("keyup", (ev) => {
      this.keys.delete(ev.code);
      if (ev.code === "Space" || ev.code === "KeyJ" || ev.code === "KeyZ") this.held.attack = false;
    });
    target.addEventListener("blur", () => this.keys.clear());
  },
  shouldCapture: () => true, // main.js replaces this (only capture while the game is on screen)
};

/* ================================================================ level */
export function newRun() {
  return {
    health: PLAYER.maxHealth, sanity: PLAYER.maxSanity,
    inventory: [], sel: 0,
    path: [], time: 0, repelled: 0, hurtCount: 0, tier: 0,
  };
}

export function loadLevel(run, levelId) {
  const def = LEVELS[levelId];
  if (!def) throw new Error("Unknown level " + levelId);
  const rows = def.map;
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const base = def.base || "dirt";
  const game = {
    run, levelId, level: def, w, h, tiles: new Array(w * h),
    entities: [], events: [], time: 0,
    status: {}, silence: false, dread: 0, dreadRaw: 0,
    flow: new Int32Array(w * h), flowTile: -1,
    outcome: null, nearestEnemy: null, exitPos: null, exits: [],
    player: null,
  };
  let start = { x: 1.5 * TILE, y: 1.5 * TILE };
  const spawns = [];
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = rows[ty][tx] ?? "#";
      const lg = LEGEND[ch] || LEGEND["#"];
      const tile = lg.tile || base;
      game.tiles[ty * w + tx] = TILES[tile] ? tile : base;
      const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
      if (lg.start) start = { x: cx, y: cy };
      if (tile === "exit") game.exits.push({ x: cx, y: cy });
      if (lg.enemy || lg.obstacle || lg.weapon || lg.item) spawns.push({ lg, x: cx, y: cy });
    }
  }
  if (game.exits.length) {
    const sx = game.exits.reduce((a, e) => a + e.x, 0) / game.exits.length;
    const sy = game.exits.reduce((a, e) => a + e.y, 0) / game.exits.length;
    game.exitPos = { x: sx, y: sy };
  }
  game.player = {
    id: nextId++, cat: "player", type: "player", x: start.x, y: start.y, vx: 0, vy: 0,
    r: PLAYER.r, face: 0, invuln: 0, dashT: 0, dashCd: 0, atkCd: 0, swing: 0, moving: false, step: 0,
  };
  const api = makeApi(game);
  game.api = api;
  for (const s of spawns) {
    if (s.lg.enemy) api.spawn(s.lg.enemy, s.x, s.y);
    else if (s.lg.obstacle) api.spawn(s.lg.obstacle, s.x, s.y);
    else if (s.lg.weapon) api.spawn("pickup", s.x, s.y, { weapon: s.lg.weapon, uses: WEAPONS[s.lg.weapon].uses });
    else if (s.lg.item) api.spawn("pickup", s.x, s.y, { item: s.lg.item });
  }
  computeFlow(game, true);
  return game;
}

/** Route-map summary of a level, computed from its map (used by ui). */
export function summarizeLevel(levelId) {
  const def = LEVELS[levelId];
  const loot = {}, hazards = {}, foes = {};
  for (const row of def.map) for (const ch of row) {
    const lg = LEGEND[ch]; if (!lg) continue;
    if (lg.weapon) loot[lg.weapon] = (loot[lg.weapon] || 0) + 1;
    if (lg.item) loot[lg.item] = (loot[lg.item] || 0) + 1;
    if (lg.enemy) foes[lg.enemy] = (foes[lg.enemy] || 0) + 1;
    if (lg.obstacle && lg.obstacle !== "spawner") hazards[lg.obstacle] = (hazards[lg.obstacle] || 0) + 1;
    if (lg.tile === "mirror") hazards.mirror = 1;
    if (lg.tile === "silence") hazards.silence = 1;
    if (lg.tile === "water") hazards.water = 1;
  }
  if (def.pressure) for (const t of def.pressure.types) foes[t] = foes[t] || 0;
  return { id: levelId, name: def.name, tag: def.tag, blurb: def.blurb, length: def.length, threat: def.threat, loot, hazards, foes, final: !!def.final };
}

/* ================================================================ tiles */
export function tileAt(game, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= game.w || ty >= game.h) return "tent";
  return game.tiles[ty * game.w + tx];
}
export function solidAt(game, x, y) {
  const t = tileAt(game, Math.floor(x / TILE), Math.floor(y / TILE));
  return !!TILES[t].solid;
}
function walkable(game, tx, ty) { return !TILES[tileAt(game, tx, ty)].solid; }

export function lineOfSight(game, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / (TILE / 3));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (solidAt(game, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

/* BFS distance field from the player's tile (8-way, no corner cutting). */
function computeFlow(game, force) {
  const p = game.player;
  const ptx = Math.floor(p.x / TILE), pty = Math.floor(p.y / TILE), pt = pty * game.w + ptx;
  if (!force && pt === game.flowTile) return;
  game.flowTile = pt;
  const { w, h, flow } = game;
  flow.fill(1e9);
  // weighted 8-way relaxation can re-enqueue a tile, so the queue must be larger than w*h
  const q = new Int32Array(w * h * 8); let qh = 0, qt = 0;
  flow[pt] = 0; q[qt++] = pt;
  while (qh < qt) {
    const c = q[qh++], cx = c % w, cy = (c / w) | 0, cd = flow[c];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !walkable(game, nx, ny)) continue;
      if (dx && dy && (!walkable(game, cx + dx, cy) || !walkable(game, cx, cy + dy))) continue;
      const ni = ny * w + nx, nd = cd + (dx && dy ? 14 : 10);
      if (nd < flow[ni]) { flow[ni] = nd; q[qt++] = ni; }
    }
  }
}

/* Move a circle by (dx,dy) with tile collision, in sub-steps. */
function moveCircle(game, e, dx, dy, onTouchTile) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  const sx = dx / steps, sy = dy / steps;
  let bumped = false;
  for (let i = 0; i < steps; i++) {
    e.x += sx; e.y += sy;
    for (let pass = 0; pass < 2; pass++) {
      const x0 = Math.floor((e.x - e.r) / TILE), x1 = Math.floor((e.x + e.r) / TILE);
      const y0 = Math.floor((e.y - e.r) / TILE), y1 = Math.floor((e.y + e.r) / TILE);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const tn = tileAt(game, tx, ty);
        if (!TILES[tn].solid) continue;
        const nx = clamp(e.x, tx * TILE, tx * TILE + TILE), ny = clamp(e.y, ty * TILE, ty * TILE + TILE);
        let ox = e.x - nx, oy = e.y - ny; const d = Math.hypot(ox, oy);
        if (d >= e.r) continue;
        if (d < 1e-4) { ox = 0; oy = -1; } else { ox /= d; oy /= d; }
        const push = e.r - d + 0.01;
        e.x += ox * push; e.y += oy * push;
        if (Math.abs(ox) > 0.5) e.vx *= 0.2; if (Math.abs(oy) > 0.5) e.vy *= 0.2;
        bumped = true;
        if (onTouchTile && TILES[tn].touch) onTouchTile(tn);
      }
    }
  }
  return bumped;
}

/* ================================================================ api */
export function makeApi(game) {
  const ev = (type, data = {}) => { game.events.push({ type, ...data }); };
  const api = {
    get player() { return game.player; },
    get entities() { return game.entities; },
    get level() { return game.level; },
    get run() { return game.run; },
    get time() { return game.time; },
    game,
    emit: ev,
    toast(msg) { ev("toast", { msg }); },
    status(name, secs) { game.status[name] = Math.max(game.status[name] || 0, secs); },
    hasStatus(name) { return (game.status[name] || 0) > 0; },
    solidAt: (x, y) => solidAt(game, x, y),
    heal(n) { const r = game.run; r.health = clamp(r.health + n, 0, PLAYER.maxHealth); ev("heal", { n }); },
    sanity(n) { const r = game.run; r.sanity = clamp(r.sanity + n, 0, PLAYER.maxSanity); if (n <= -5) ev("sanityHit", { n }); },
    /** Damage the player. Returns false if invulnerable. */
    hurt(n, sx, sy, cause = "default") {
      const p = game.player;
      if (p.invuln > 0 || game.outcome) return false;
      game.run.health = clamp(game.run.health - n, 0, PLAYER.maxHealth);
      game.run.hurtCount++;
      p.invuln = PLAYER.invuln;
      game.lastCause = cause;
      ev("hurt", { x: p.x, y: p.y, n, cause });
      if (game.run.health <= 0) { game.outcome = { type: "caught", by: cause }; ev("caught", { by: cause, x: p.x, y: p.y }); }
      return true;
    },
    /** Push the player away from (sx,sy). */
    shove(sx, sy, force) {
      const p = game.player; let dx = p.x - sx, dy = p.y - sy; const d = Math.hypot(dx, dy) || 1;
      p.vx += (dx / d) * force; p.vy += (dy / d) * force;
    },
    /** Knock an enemy away from (sx,sy) and stun it. */
    knock(e, sx, sy, force, stun) {
      const def = e.def; let dx = e.x - sx, dy = e.y - sy; const d = Math.hypot(dx, dy) || 1;
      const m = def.mass || 1;
      e.vx = (dx / d) * force / m; e.vy = (dy / d) * force / m;
      e.stun = Math.max(e.stun, stun * (def.stunMul || 1));
      e.hitFlash = 0.18;
      game.run.repelled++;
      ev("hit", { x: e.x, y: e.y, type: e.type, force });
    },
    enemiesNear(x, y, r) {
      return game.entities.filter((e) => e.cat === "enemy" && Math.hypot(e.x - x, e.y - y) < r + e.r);
    },
    countEnemies() { return game.entities.filter((e) => e.cat === "enemy" && e.type !== "rabbit").length; },
    remove(e) { e.dead = true; },
    /** Spawn an enemy/obstacle/projectile/pickup by type id. */
    spawn(type, x, y, props = {}) {
      let e;
      if (ENEMIES[type]) {
        const d = ENEMIES[type];
        e = { cat: "enemy", def: d, r: d.r, stun: 0.4, alert: 0, hopT: Math.random(), wander: null, hitFlash: 0 };
      } else if (OBSTACLES[type]) {
        const d = OBSTACLES[type];
        e = { cat: "obstacle", def: d, r: d.r };
      } else if (PROJECTILES[type]) {
        const d = PROJECTILES[type];
        e = { cat: "proj", def: d, r: d.r, life: d.life, age: 0, hitIds: new Set(), rot: 0 };
      } else if (type === "pickup") {
        e = { cat: "pickup", def: props.weapon ? WEAPONS[props.weapon] : ITEMS[props.item], r: 12, bob: Math.random() * 6 };
      } else {
        throw new Error("Unknown spawn type " + type);
      }
      Object.assign(e, { id: nextId++, type, x, y, hx: x, hy: y, vx: 0, vy: 0, face: 0, t: 0 }, props);
      game.entities.push(e);
      if (e.def && e.def.init) e.def.init(e, api);
      return e;
    },

    /* ---- weapon helpers (used by WEAPONS[id].use) ---- */
    /** Melee arc in front of the player. Returns true if anything was hit. */
    melee({ range = 50, arc = 1.2, force = 400, stun = 1, heavy = false }) {
      const p = game.player; aimAtNearest(game, range + 40, Math.PI);
      p.swing = heavy ? 0.32 : 0.2; p.swingArc = arc; p.swingRange = range;
      ev("swing", { x: p.x, y: p.y, face: p.face, range, arc, heavy, weapon: currentWeaponId(game) });
      let hits = 0;
      for (const e of game.entities) {
        if (e.cat !== "enemy") continue;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d > range + e.r) continue;
        let diff = Math.atan2(dy, dx) - p.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (Math.abs(diff) > arc / 2 + 0.25 && d > e.r + p.r + 4) continue;
        api.knock(e, p.x, p.y, force, stun); hits++;
      }
      if (hits && heavy) ev("ding", { x: p.x, y: p.y });
      return hits > 0;
    },
    /** Throw a PROJECTILES[type] along the player's facing (auto-aimed). */
    projectile(type, { speed = 400 } = {}) {
      const p = game.player; aimAtNearest(game, 420, 1.3);
      const pr = api.spawn(type, p.x + Math.cos(p.face) * 14, p.y + Math.sin(p.face) * 14,
        { vx: Math.cos(p.face) * speed, vy: Math.sin(p.face) * speed, speed, owner: p });
      ev("throw", { x: p.x, y: p.y, face: p.face, proj: type });
      return !!pr;
    },
    /** Radial burst around the player. */
    burst({ radius = 140, force = 500, stun = 2, kind = "burst" }) {
      const p = game.player;
      ev("burst", { x: p.x, y: p.y, radius, kind });
      for (const e of api.enemiesNear(p.x, p.y, radius)) api.knock(e, p.x, p.y, force, stun);
      return true;
    },
  };
  return api;
}

function currentWeaponId(game) { const s = game.run.inventory[game.run.sel]; return s ? s.id : null; }

/* Turn the player toward the nearest enemy within range/cone (keeps melee and
   throws forgiving, especially on touch screens). */
function aimAtNearest(game, range, cone) {
  const p = game.player; let best = null, bd = range;
  for (const e of game.entities) {
    if (e.cat !== "enemy") continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y); if (d > bd) continue;
    let diff = Math.atan2(e.y - p.y, e.x - p.x) - p.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) > cone) continue;
    if (!lineOfSight(game, p.x, p.y, e.x, e.y)) continue;
    best = e; bd = d;
  }
  if (best) p.face = Math.atan2(best.y - p.y, best.x - p.x);
}

/* ================================================================ camera */
/** Zoom so roughly 15x10 tiles are visible; follow the player, clamp to map. */
export function updateCamera(cam, game, W, H, dt, snap = false) {
  cam.zoom = Math.max(0.85, Math.min(W / (TILE * 15), H / (TILE * 10), 2.4));
  const vw = W / cam.zoom, vh = H / cam.zoom, p = game.player;
  const lead = 30;
  let tx = p.x + Math.cos(p.face) * (p.moving ? lead : 0) - vw / 2;
  let ty = p.y - 14 + Math.sin(p.face) * (p.moving ? lead : 0) - vh / 2;
  // overscroll past the map edges so the HUD bars never cover the player
  const padX = 24 / cam.zoom, padTop = 110 / cam.zoom, padBot = 110 / cam.zoom;
  const mw = game.w * TILE, mh = game.h * TILE;
  tx = mw + 2 * padX <= vw ? (mw - vw) / 2 : clamp(tx, -padX, mw - vw + padX);
  ty = mh + padTop + padBot <= vh ? (mh - vh) / 2 : clamp(ty, -padTop, mh - vh + padBot);
  if (snap || cam.x == null) { cam.x = tx; cam.y = ty; return cam; }
  const k = 1 - Math.exp(-6 * dt);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  return cam;
}

/* ================================================================ inventory */
export function giveWeapon(game, id, uses) {
  const run = game.run, def = WEAPONS[id];
  const held = run.inventory.find((s) => s.id === id);
  if (held) { held.uses = Math.min(held.uses + uses, def.uses * 2); return "topped"; }
  if (run.inventory.length < PLAYER.slots) { run.inventory.push({ id, uses }); run.sel = run.inventory.length - 1; return "new"; }
  // full: swap the selected weapon for this one, drop the old one
  const old = run.inventory[run.sel];
  run.inventory[run.sel] = { id, uses };
  const p = game.player;
  game.api.spawn("pickup", p.x - Math.cos(p.face) * 30, p.y - Math.sin(p.face) * 30, { weapon: old.id, uses: old.uses, noPick: 1.2 });
  return "swapped";
}

/* ================================================================ update */
export function update(game, dt) {
  if (game.outcome) return;
  const api = game.api, run = game.run, p = game.player;
  game.time += dt; run.time += dt;
  for (const k in game.status) game.status[k] = Math.max(0, game.status[k] - dt);

  /* ---- inventory actions ---- */
  const inv = run.inventory;
  if (inv.length) {
    if (input.take("next")) { run.sel = (run.sel + 1) % inv.length; game.events.push({ type: "select" }); }
    if (input.take("prev")) { run.sel = (run.sel - 1 + inv.length) % inv.length; game.events.push({ type: "select" }); }
    for (let i = 0; i < 3; i++) if (input.take("slot" + i) && i < inv.length) { run.sel = i; game.events.push({ type: "select" }); }
  }
  run.sel = clamp(run.sel, 0, Math.max(0, inv.length - 1));

  /* ---- player movement ---- */
  const tileName = tileAt(game, Math.floor(p.x / TILE), Math.floor(p.y / TILE));
  const tdef = TILES[tileName];
  let { x: ax, y: ay } = input.axis();
  if (api.hasStatus("reversed")) { ax = -ax; ay = -ay; }
  if (api.hasStatus("stuck")) { ax = 0; ay = 0; }
  p.moving = Math.hypot(ax, ay) > 0.15;
  if (p.moving) p.face = Math.atan2(ay, ax);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.atkCd = Math.max(0, p.atkCd - dt);
  p.swing = Math.max(0, p.swing - dt);
  if (input.take("dash") && p.dashCd <= 0 && !api.hasStatus("stuck")) {
    p.dashT = PLAYER.dashTime; p.dashCd = PLAYER.dashCooldown;
    p.invuln = Math.max(p.invuln, PLAYER.dashTime + 0.08);
    game.events.push({ type: "dash", x: p.x, y: p.y, face: p.face });
  }
  const slow = tdef.slow || 1;
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = Math.cos(p.face) * PLAYER.dashSpeed * slow; p.vy = Math.sin(p.face) * PLAYER.dashSpeed * slow;
  } else {
    const tvx = ax * PLAYER.speed * slow, tvy = ay * PLAYER.speed * slow;
    const k = 1 - Math.exp(-PLAYER.friction * dt);
    p.vx += (tvx - p.vx) * k; p.vy += (tvy - p.vy) * k;
  }
  moveCircle(game, p, p.vx * dt, p.vy * dt, (tn) => TILES[tn].touch(api, p));
  if (p.moving) p.step += dt * Math.hypot(p.vx, p.vy) / 18;

  /* ---- attack ---- */
  const wantAttack = input.take("attack");
  if ((wantAttack || input.held.attack) && p.atkCd <= 0 && inv.length) {
    const slot = inv[run.sel], w = WEAPONS[slot.id];
    const spent = w.use(api, p);
    p.atkCd = w.cooldown;
    if (spent !== false) {
      slot.uses--;
      if (slot.uses <= 0) {
        inv.splice(run.sel, 1); run.sel = clamp(run.sel, 0, Math.max(0, inv.length - 1));
        game.events.push({ type: "break", weapon: slot.id, x: p.x, y: p.y });
        api.toast(w.name + " broke.");
      }
    }
  } else if (wantAttack && !inv.length) {
    api.toast("Empty hands. Find something to fight with.");
  }

  /* ---- silence ---- */
  const nowSilent = !!tdef.silence;
  if (nowSilent !== game.silence) {
    game.silence = nowSilent;
    game.events.push({ type: nowSilent ? "silenceEnter" : "silenceExit", x: p.x, y: p.y });
    if (nowSilent) api.toast("The bugs stop. Every one of the Unwilling hears you now.");
  }
  if (game.silence) api.sanity(-PLAYER.silenceDrain * dt);
  const globalAlert = game.silence || api.hasStatus("marked");

  /* ---- entities ---- */
  computeFlow(game, false);
  let nearest = null, nd = 1e9, aura = 0;
  for (const e of game.entities) {
    if (e.dead) continue;
    e.t += dt;
    if (e.cat === "enemy") {
      updateEnemy(game, e, dt, globalAlert);
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if ((e.alert > 0 || globalAlert) && d < nd) { nd = d; nearest = e; }
      if (d < 120) aura += (e.def.dreadAura || 0) * (1 - d / 120);
      if (d < e.r + p.r && e.stun <= 0 && !game.outcome) {
        if (api.hurt(e.def.damage, e.x, e.y, e.type)) {
          api.shove(e.x, e.y, 420);
          e.stun = 0.8; const dd = d || 1; e.vx = ((e.x - p.x) / dd) * 160; e.vy = ((e.y - p.y) / dd) * 160;
          game.events.push({ type: "grab", x: e.x, y: e.y, enemy: e.type });
          if (e.def.onCatch) e.def.onCatch(e, api);
        }
      }
    } else if (e.cat === "obstacle") {
      if (e.def.update) e.def.update(e, api, dt);
      if (e.def.touch && e.r > 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r) e.def.touch(e, api, dt);
    } else if (e.cat === "proj") {
      updateProjectile(game, e, dt);
    } else if (e.cat === "pickup") {
      e.noPick = Math.max(0, (e.noPick || 0) - dt);
      if (e.noPick <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r + 4) collect(game, e);
    }
  }
  separateEnemies(game);
  game.entities = game.entities.filter((e) => !e.dead);
  game.nearestEnemy = nearest;

  /* ---- sanity & dread ---- */
  if (aura > 0) api.sanity(-aura * dt);
  else if (!game.silence && game.dread < 0.25) api.sanity(PLAYER.sanityRegen * dt);
  game.dreadRaw = clamp((400 - nd) / 330, 0, 1);
  const target = clamp(game.dreadRaw + (globalAlert ? 0.2 : 0), 0, 1);
  game.dread += (target - game.dread) * (1 - Math.exp(-3 * dt));
  if (run.sanity <= 0 && !game.outcome) { game.outcome = { type: "caught", by: "sanity" }; game.events.push({ type: "caught", by: "sanity", x: p.x, y: p.y }); }

  /* ---- exit ---- */
  if (!game.outcome && TILES[tileAt(game, Math.floor(p.x / TILE), Math.floor(p.y / TILE))].exit) {
    game.outcome = { type: "exit" };
    game.events.push({ type: "exit", x: p.x, y: p.y });
  }
  input.pressed.delete("confirm");
}

function collect(game, e) {
  const api = game.api;
  if (e.weapon) {
    const res = giveWeapon(game, e.weapon, e.uses);
    game.events.push({ type: "pickup", weapon: e.weapon, x: e.x, y: e.y, res });
    api.toast(res === "topped" ? WEAPONS[e.weapon].name + " — more uses." :
      res === "swapped" ? "Hands full: swapped for the " + WEAPONS[e.weapon].name + "." :
      "Picked up the " + WEAPONS[e.weapon].name + ".");
  } else if (e.item) {
    ITEMS[e.item].collect(api);
    game.events.push({ type: "pickup", item: e.item, x: e.x, y: e.y });
  }
  e.dead = true;
}

function steer(e, tx, ty, speed, accel, dt) {
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
  const dvx = (dx / d) * speed - e.vx, dvy = (dy / d) * speed - e.vy;
  const m = Math.hypot(dvx, dvy), lim = accel * dt;
  if (m > lim) { e.vx += (dvx / m) * lim; e.vy += (dvy / m) * lim; } else { e.vx += dvx; e.vy += dvy; }
}

function pathTarget(game, e) {
  const p = game.player;
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (d < TILE * 3 && lineOfSight(game, e.x, e.y, p.x, p.y)) return { x: p.x, y: p.y };
  const { w, flow } = game; const tx = Math.floor(e.x / TILE), ty = Math.floor(e.y / TILE);
  let best = flow[ty * w + tx], bx = p.x, by = p.y, found = false;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = tx + dx, ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= game.h) continue;
    if (dx && dy && (!walkable(game, tx + dx, ty) || !walkable(game, tx, ty + dy))) continue;
    const v = flow[ny * w + nx];
    if (v < best) { best = v; bx = (nx + 0.5) * TILE; by = (ny + 0.5) * TILE; found = true; }
  }
  return found ? { x: bx, y: by } : { x: p.x, y: p.y };
}

function updateEnemy(game, e, dt, globalAlert) {
  const def = e.def, p = game.player;
  e.hitFlash = Math.max(0, e.hitFlash - dt);
  e.snared = Math.max(0, (e.snared || 0) - dt);
  const tdef = TILES[tileAt(game, Math.floor(e.x / TILE), Math.floor(e.y / TILE))];
  const slow = (tdef.slow || 1) * (game.silence ? 1.15 : 1);
  const d = Math.hypot(p.x - e.x, p.y - e.y);
  if (d < def.sense || globalAlert || e.relentless) e.alert = Math.max(e.alert, 2.5);
  else e.alert = Math.max(0, e.alert - dt);
  e.frozen = false;

  if (def.update) { def.update(e, game.api, dt); }
  else if (e.stun > 0) {
    e.stun -= dt;
    const k = Math.exp(-5 * dt); e.vx *= k; e.vy *= k;
  } else if (def.behavior === "weeper") {
    let diff = Math.atan2(e.y - p.y, e.x - p.x) - p.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const seen = Math.abs(diff) < 0.95 && d < 460 && lineOfSight(game, p.x, p.y, e.x, e.y);
    if (seen) { e.vx = 0; e.vy = 0; e.frozen = true; }
    else { const t = pathTarget(game, e); steer(e, t.x, t.y, def.speed * slow, def.accel, dt); }
  } else if (def.behavior === "hopper") {
    e.hopT -= dt;
    const k = Math.exp(-4 * dt); e.vx *= k; e.vy *= k;
    if (e.hopT <= 0) {
      e.hopT = (def.hopEvery || 1) * (0.7 + Math.random() * 0.6);
      if (e.alert > 0 && lineOfSight(game, e.x, e.y, p.x, p.y)) {
        const a = Math.atan2(p.y - e.y, p.x - e.x) + (Math.random() - 0.5) * 0.4;
        e.vx = Math.cos(a) * def.hop * slow; e.vy = Math.sin(a) * def.hop * slow; e.face = a;
        game.events.push({ type: "hop", x: e.x, y: e.y });
      } else {
        const a = Math.random() * Math.PI * 2;
        e.vx = Math.cos(a) * 90; e.vy = Math.sin(a) * 90; e.face = a;
      }
    }
  } else { // hunter
    if (e.alert > 0) {
      const t = pathTarget(game, e);
      steer(e, t.x, t.y, def.speed * slow, def.accel, dt);
    } else {
      if (!e.wander || Math.hypot(e.wander.x - e.x, e.wander.y - e.y) < 8 || Math.random() < dt * 0.3) {
        const a = Math.random() * Math.PI * 2, r = Math.random() * TILE * 3;
        const wx = e.hx + Math.cos(a) * r, wy = e.hy + Math.sin(a) * r;
        e.wander = solidAt(game, wx, wy) ? { x: e.hx, y: e.hy } : { x: wx, y: wy };
      }
      steer(e, e.wander.x, e.wander.y, def.speed * 0.3, def.accel, dt);
    }
  }
  if (Math.hypot(e.vx, e.vy) > 5) e.face = Math.atan2(e.vy, e.vx);
  moveCircle(game, e, e.vx * dt, e.vy * dt);
}

function separateEnemies(game) {
  const es = game.entities.filter((e) => e.cat === "enemy");
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const a = es[i], b = es[j]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = a.r + b.r;
    if (d > 0 && d < m) { const push = (m - d) / 2; a.x -= (dx / d) * push; a.y -= (dy / d) * push; b.x += (dx / d) * push; b.y += (dy / d) * push; }
  }
}

function updateProjectile(game, pr, dt) {
  const def = pr.def, api = game.api, p = game.player;
  pr.age += dt; pr.rot += (def.spin || 0) * dt;
  if (def.boomerang) {
    if (!pr.returning && pr.age > def.out) { pr.returning = true; pr.hitIds.clear(); }
    if (pr.returning) {
      const dx = p.x - pr.x, dy = p.y - pr.y, d = Math.hypot(dx, dy) || 1;
      const sp = pr.speed * 1.1;
      pr.vx += ((dx / d) * sp - pr.vx) * Math.min(1, dt * 8); pr.vy += ((dy / d) * sp - pr.vy) * Math.min(1, dt * 8);
      if (d < p.r + pr.r) { pr.dead = true; game.events.push({ type: "catch", x: p.x, y: p.y, proj: pr.type }); return; }
    }
  }
  pr.x += pr.vx * dt; pr.y += pr.vy * dt;
  if (!pr.returning && solidAt(game, pr.x, pr.y)) {
    if (def.boomerang) { pr.returning = true; pr.hitIds.clear(); pr.x -= pr.vx * dt; pr.y -= pr.vy * dt; }
    else { pr.x -= pr.vx * dt; pr.y -= pr.vy * dt; if (def.expire) def.expire(pr, api); pr.dead = true; game.events.push({ type: "projEnd", x: pr.x, y: pr.y, proj: pr.type }); return; }
  }
  for (const e of game.entities) {
    if (e.cat !== "enemy" || pr.hitIds.has(e.id)) continue;
    if (Math.hypot(e.x - pr.x, e.y - pr.y) < e.r + pr.r) {
      pr.hitIds.add(e.id);
      if (def.hit && def.hit(pr, e, api)) { pr.dead = true; game.events.push({ type: "projEnd", x: pr.x, y: pr.y, proj: pr.type }); return; }
    }
  }
  if (pr.age > pr.life) {
    if (def.boomerang) { pr.dead = true; game.events.push({ type: "catch", x: p.x, y: p.y, proj: pr.type }); return; }
    if (def.expire) def.expire(pr, api);
    pr.dead = true; game.events.push({ type: "projEnd", x: pr.x, y: pr.y, proj: pr.type });
  }
}
