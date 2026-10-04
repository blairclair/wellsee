// Shared headless bot for the escape tests (engine.test.mjs, balance.mjs).
// It plays with real health: follows a BFS field to a goal (the exit, the
// nearest pickup when looting, or the next gate breaker in the finale),
// attacks when something is in reach and dashes away from close contact.
import { TILE, TILES, LEVELS, ROUTE, WEAPONS, PLAYER } from "../js/content.js";
import { newRun, loadLevel, update, input, giveWeapon } from "../js/engine.js";

const isSolid = (g, i) => {
  if (g.blocked && g.blocked.has(i)) return true;
  return !!TILES[g.tiles[i]].solid;
};

/** 4-way BFS distance field to a set of tile indices. */
export function fieldTo(g, targets) {
  const d = new Int32Array(g.w * g.h).fill(1e9), q = [];
  for (const i of targets) { d[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const c = q[h], x = c % g.w, y = (c / g.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * g.w + nx;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || isSolid(g, n)) continue;
      if (d[n] > d[c] + 1) { d[n] = d[c] + 1; q.push(n); }
    }
  }
  return d;
}
const tileIdx = (g, x, y) => Math.floor(y / TILE) * g.w + Math.floor(x / TILE);

function goal(g, bot) {
  const f = g.finale;
  if (f && !f.open) {
    const b = g.entities.filter((e) => e.type === "breaker" && !e.done);
    if (b.length) return { key: "breaker" + b.map((e) => e.id).join(","), tiles: b.map((e) => tileIdx(g, e.x, e.y)), hold: true };
  }
  if (bot.loot) {
    const p = g.player;
    const reach = bot.loot === true ? 1e9 : bot.loot * TILE; // loot: true = everything, or a number = only pickups within that many tiles
    const inv = g.run.inventory;
    // weapons only when there's a free slot or it tops up one we hold (otherwise the bot swap-loops)
    const wanted = (e) => e.item || inv.length < PLAYER.slots || inv.some((s) => s.id === e.weapon);
    // commit to one target until it's gone (nearest-by-distance flips around fences otherwise)
    let t = bot.target && !bot.target.dead && wanted(bot.target) ? bot.target : null;
    if (!t) {
      const picks = g.entities.filter((e) => e.cat === "pickup" && !e.noPick && wanted(e) && Math.hypot(e.x - p.x, e.y - p.y) < reach);
      picks.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      t = bot.target = picks[0] || null;
    }
    if (t) return { key: "pick" + t.id, tiles: [tileIdx(g, t.x, t.y)] };
  }
  return { key: "exit" + (g.blocked ? g.blocked.size : 0), tiles: g.exits.map((e) => tileIdx(g, e.x, e.y)) };
}

/** Set input for one tick. bot = { loot:bool, fight:bool, cache:{} } */
export function botTick(g, bot) {
  const p = g.player;
  input.virt.x = input.virt.y = 0; input.held.attack = false;
  const gl = goal(g, bot);
  if (bot.cache.key !== gl.key || g.blockedVersion !== bot.cache.bv) {
    bot.cache = { key: gl.key, field: fieldTo(g, gl.tiles), bv: g.blockedVersion };
  }
  const field = bot.cache.field;
  const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
  let best = field[ty * g.w + tx], bx = 0, by = 0;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const v = field[(ty + dy) * g.w + tx + dx]; if (v < best) { best = v; bx = dx; by = dy; }
  }
  let cx = (tx + bx + 0.5) * TILE - p.x, cy = (ty + by + 0.5) * TILE - p.y;
  const onGoal = best === 0 && bx === 0 && by === 0;
  if (onGoal && gl.hold) { cx = (tx + 0.5) * TILE - p.x; cy = (ty + 0.5) * TILE - p.y; if (Math.hypot(cx, cy) < 4) cx = cy = 0; }
  const m = Math.hypot(cx, cy);
  if (m > 0.5) { input.virt.x = cx / m; input.virt.y = cy / m; }
  // threats
  let near = null, nd = 1e9;
  for (const e of g.entities) {
    if (e.cat !== "enemy") continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; near = e; }
  }
  if (!bot.fight || !near) return;
  const inv = g.run.inventory, slot = inv[g.run.sel];
  if (slot) {
    const w = slot.id;
    const reach = { fork: 70, mallet: 80, popcorn: 110, hat: 260, rings: 240, candy: 160, popgun: 360 }[w] || 80;
    const charging = near.charge > 0 || near.windup > 0;
    if (nd < reach && (near.stun <= 0.15 || charging)) input.press("attack");
    // ranged weapons need facing: turn toward the enemy for a frame when throwing
    if (nd < reach && reach > 120 && near.stun <= 0.15) {
      const a = Math.atan2(near.y - p.y, near.x - p.x); p.face = a;
    }
    // switch to a melee weapon when cornered, if we have one
    if (nd < 60 && inv.length > 1 && reach > 120) {
      const mi = inv.findIndex((s) => ["fork", "mallet", "popcorn"].includes(s.id));
      if (mi >= 0) g.run.sel = mi;
    }
  }
  const close = nd < near.r + p.r + 26 && near.stun <= 0;
  bot.closeT = close ? (bot.closeT || 0) + 1 / 60 : 0; if (!close) bot.decided = false;
  // human-ish: react after `react` s, and only dash for `skill` of the threats
  if (close && p.dashCd <= 0 && bot.closeT >= (bot.react || 0) && !bot.decided && (bot.decided = true) && Math.random() < (bot.skill ?? 1)) {
    // dash away, perpendicular-ish to the threat, toward the goal when possible
    const a = Math.atan2(p.y - near.y, p.x - near.x);
    input.virt.x = Math.cos(a) * 0.7 + (m > 0.5 ? cx / m : 0) * 0.5;
    input.virt.y = Math.sin(a) * 0.7 + (m > 0.5 ? cy / m : 0) * 0.5;
    input.press("dash");
  }
}

/** Play one zone. Returns { outcome, by, time, dmg, sanity, repelled }. */
export function playZone(run, levelId, { loot = false, fight = true, maxT = 300, onTick, skill = 1, react = 0 } = {}) {
  const g = loadLevel(run, levelId);
  const bot = { loot, fight, cache: {}, skill, react };
  const h0 = run.health; let t = 0;
  input.clear();
  for (; t < maxT && !g.outcome; t += 1 / 60) {
    botTick(g, bot);
    update(g, 1 / 60);
    if (onTick) onTick(g);
    g.events.length = 0;
  }
  return { outcome: g.outcome ? g.outcome.type : "timeout", by: g.outcome && g.outcome.by, time: g.time, dmg: h0 - run.health, sanity: run.sanity, repelled: run.repelled, game: g };
}

/** Play a whole route (array of level ids), carrying the run between zones like main.js does. */
export function playRoute(route, opts = {}) {
  const run = newRun();
  if (opts.weapon) run.inventory.push({ id: opts.weapon, uses: WEAPONS[opts.weapon].uses });
  const zones = [];
  for (const id of route) {
    if (run.path.length) { run.health = Math.min(PLAYER.maxHealth, run.health + 15); run.sanity = Math.min(PLAYER.maxSanity, run.sanity + 20); }
    run.path.push(id);
    const wepIn = run.inventory.reduce((a, s) => a + s.uses, 0);
    const r = playZone(run, id, opts);
    zones.push({ id, ...r, hpIn: run.health + r.dmg, wepIn, game: undefined });
    if (r.outcome !== "exit") return { won: false, zones, run };
  }
  return { won: true, zones, run };
}

/** Every route through ROUTE (cartesian product of tiers). */
export function allRoutes() {
  let out = [[]];
  for (const tier of ROUTE) out = out.flatMap((r) => tier.map((id) => [...r, id]));
  return out;
}

export { LEVELS, giveWeapon };
