// Headless engine smoke test: node tabs/escape/tests/engine.test.mjs
// Loads every level, simulates a bot that walks the flow field toward the exit
// while swinging, and checks nothing throws and outcomes resolve.
import { LEVELS, WEAPONS, TILE } from "../js/content.js";
import { newRun, loadLevel, update, input, giveWeapon, summarizeLevel, updateCamera } from "../js/engine.js";

let failed = 0;
const assert = (c, m) => { if (!c) { failed++; console.log("FAIL", m); } };

// BFS on tiles from exit so the bot can follow it
function exitField(g) {
  const d = new Int32Array(g.w * g.h).fill(1e9), q = [];
  g.exits.forEach((e) => { const i = Math.floor(e.y / TILE) * g.w + Math.floor(e.x / TILE); d[i] = 0; q.push(i); });
  while (q.length) {
    const c = q.shift(), x = c % g.w, y = (c / g.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * g.w + nx;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const t = g.tiles[n]; if (["tent", "fence", "booth", "tree", "lamp", "mirror"].includes(t)) continue;
      if (d[n] > d[c] + 1) { d[n] = d[c] + 1; q.push(n); }
    }
  }
  return d;
}

for (const id of Object.keys(LEVELS)) {
  const s = summarizeLevel(id);
  assert(s.name && s.length >= 1, id + " summary");
  for (const mode of ["bot", "idle"]) {
    const run = newRun();
    if (mode === "bot") { run.health = 1e6; run.sanity = 1e6; }
    const g = loadLevel(run, id);
    giveWeapon(g, "fork", 99); giveWeapon(g, "hat", 99); giveWeapon(g, "popcorn", 99);
    const field = exitField(g);
    let steps = 0;
    try {
      for (; steps < 60 * 240 && !g.outcome; steps++) {
        input.virt.x = input.virt.y = 0;
        if (mode === "bot") {
          const p = g.player, tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
          let best = field[ty * g.w + tx], bx = 0, by = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = field[(ty + dy) * g.w + tx + dx]; if (v < best) { best = v; bx = dx; by = dy; } }
          const cx = (tx + bx + 0.5) * TILE - p.x, cy = (ty + by + 0.5) * TILE - p.y, m = Math.hypot(cx, cy) || 1;
          input.virt.x = cx / m; input.virt.y = cy / m;
          if (steps % 20 === 0) { input.press("attack"); input.press(steps % 120 ? "next" : "dash"); }
          g.run.health = 1e6; g.run.sanity = 1e6;
        }
        update(g, 1 / 60);
        updateCamera({ x: null, y: null, zoom: 1 }, g, 800, 600, 1 / 60);
        g.events.length = 0;
      }
    } catch (e) { failed++; console.log("FAIL", id, mode, "threw at step", steps, e.stack); continue; }
    if (mode === "bot") assert(g.outcome && g.outcome.type === "exit", `${id} bot should reach exit (outcome ${JSON.stringify(g.outcome)} after ${steps} steps)`);
    if (mode === "idle") console.log(`  ${id} idle: ${g.outcome ? g.outcome.type + " by " + g.outcome.by : "survived"} after ${(steps / 60).toFixed(1)}s, enemies ${g.entities.filter((e) => e.cat === "enemy").length}`);
    if (mode === "bot") console.log(`  ${id} bot: ${g.outcome && g.outcome.type} in ${(steps / 60).toFixed(1)}s, repelled ${run.repelled}`);
  }
}
for (const id of Object.keys(WEAPONS)) assert(typeof WEAPONS[id].use === "function", id + " use()");
console.log(failed ? `${failed} failure(s)` : "engine smoke test passed");
process.exit(failed ? 1 : 0);
