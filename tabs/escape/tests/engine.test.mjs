// Headless engine smoke test: node tabs/escape/tests/engine.test.mjs
// 1. Every level: an invincible bot walks the flow field to the exit while
//    fighting (in the finale it throws every breaker first), and an idle run
//    resolves without throwing.
// 2. Event shapes: payloads can't clobber the event name; knockback emits hit{enemy}.
// 3. Mechanics: Arthur's flash marks you in the open and misses behind a wall;
//    the finale gate is solid until the last breaker, then the exit works.
// 4. The finale is winnable by a mortal bot (real health) often enough.
import { LEVELS, WEAPONS, TILE, ENEMIES, OBSTACLES, LEGEND } from "../js/content.js";
import { newRun, loadLevel, update, input, giveWeapon, summarizeLevel, updateCamera, solidAt } from "../js/engine.js";
import { botTick, playZone, playRoute, allRoutes } from "./bot.mjs";

let failed = 0;
const assert = (c, m) => { if (!c) { failed++; console.log("FAIL", m); } };

/* ---- 1. every level, invincible bot + idle ---- */
for (const id of Object.keys(LEVELS)) {
  const s = summarizeLevel(id);
  assert(s.name && s.length >= 1, id + " summary");
  for (const mode of ["bot", "idle"]) {
    const run = newRun();
    const g = loadLevel(run, id);
    giveWeapon(g, "fork", 99); giveWeapon(g, "hat", 99); giveWeapon(g, "popcorn", 99);
    const bot = { loot: false, fight: true, cache: {} };
    let steps = 0;
    input.clear();
    try {
      for (; steps < 60 * 300 && !g.outcome; steps++) {
        if (mode === "bot") { botTick(g, bot); g.run.health = 1e6; g.run.sanity = 1e6; if (steps % 120 === 0) input.press("next"); }
        else { input.virt.x = input.virt.y = 0; }
        update(g, 1 / 60);
        updateCamera({ x: null, y: null, zoom: 1 }, g, 800, 600, 1 / 60);
        for (const ev of g.events) if (typeof ev.type !== "string") throw new Error("event without a type: " + JSON.stringify(ev));
        g.events.length = 0;
      }
    } catch (e) { failed++; console.log("FAIL", id, mode, "threw at step", steps, e.stack); continue; }
    if (mode === "bot") {
      assert(g.outcome && g.outcome.type === "exit", `${id} bot should reach exit (outcome ${JSON.stringify(g.outcome)} after ${steps} steps)`);
      if (LEVELS[id].final) assert(g.finale && g.finale.open && g.finale.thrown === g.finale.total, id + " finale should be open when exited");
      console.log(`  ${id} bot: ${g.outcome && g.outcome.type} in ${(steps / 60).toFixed(1)}s, repelled ${run.repelled}`);
    } else {
      console.log(`  ${id} idle: ${g.outcome ? g.outcome.type + " by " + g.outcome.by : "survived"} after ${(steps / 60).toFixed(1)}s, enemies ${g.entities.filter((e) => e.cat === "enemy").length}`);
    }
  }
}

/* ---- content tables ---- */
for (const id of Object.keys(WEAPONS)) assert(typeof WEAPONS[id].use === "function", id + " use()");
for (const [ch, lg] of Object.entries(LEGEND)) {
  if (lg.enemy) assert(ENEMIES[lg.enemy], `legend ${ch}: unknown enemy ${lg.enemy}`);
  if (lg.obstacle) assert(OBSTACLES[lg.obstacle], `legend ${ch}: unknown obstacle ${lg.obstacle}`);
  if (lg.weapon) assert(WEAPONS[lg.weapon], `legend ${ch}: unknown weapon ${lg.weapon}`);
}

/* ---- 2. event shapes ---- */
{
  const g = loadLevel(newRun(), "midway"), p = g.player;
  const e = g.api.spawn("unwilling", p.x + 30, p.y);
  g.api.knock(e, p.x, p.y, 300, 1);
  const hit = g.events.find((ev) => ev.enemy === "unwilling");
  assert(hit && hit.type === "hit", "knockback should emit type 'hit' with an enemy field, got " + JSON.stringify(hit));
  g.api.emit("probe", { type: "clobber", x: 1 });
  assert(g.events[g.events.length - 1].type === "probe", "payload must not overwrite the event type");
}

/* ---- 3a. Arthur's flash ---- */
function flashTrial(behindWall) {
  const g = loadLevel(newRun(), "gallery");
  g.entities = g.entities.filter((e) => e.cat !== "enemy");
  const p = g.player;
  // find an open horizontal run of 8 tiles in the hall row of the player
  const ty = Math.floor(p.y / TILE);
  const ax = p.x + TILE * 6;
  const a = g.api.spawn("arthur", ax, p.y); a.stun = 0; a.alert = 5;
  let flashed = null, charged = false;
  for (let i = 0; i < 60 * 8 && !flashed; i++) {
    input.clear(); update(g, 1 / 60); p.x = Math.min(p.x, ax - TILE * 5); // hold still
    for (const ev of g.events) {
      if (ev.type === "flashCharge" && !charged) {
        charged = true;
        // the player ducks behind cover while the camera comes up (runtime wall between them)
        if (behindWall) { const wx = Math.floor((p.x + a.x) / 2 / TILE); for (let dy = -1; dy <= 1; dy++) g.api.block(wx, ty + dy, true); }
      }
      if (ev.type === "flash") flashed = ev;
    }
    g.events.length = 0;
  }
  return { charged, flashed, marked: g.api.hasStatus("marked") };
}
{
  const open = flashTrial(false);
  assert(open.charged && open.flashed && open.flashed.hit && open.marked, "Arthur should telegraph and mark a still player in the open: " + JSON.stringify(open));
  const hidden = flashTrial(true);
  assert(!hidden.marked, "Arthur's flash must not mark through a wall: " + JSON.stringify(hidden));
}

/* ---- 3b. finale gate ---- */
{
  const g = loadLevel(newRun(), "gate");
  assert(g.finale && g.finale.total === 3 && !g.finale.open, "gate finale initialised: " + JSON.stringify({ ...g.finale, barker: !!g.finale?.barker }));
  assert(g.finale.barker && g.finale.barker.type === "barker", "finale knows the barker");
  const ex = g.exits[0];
  assert(solidAt(g, ex.x, ex.y), "closed gate is solid");
  g.entities = g.entities.filter((e) => e.cat !== "enemy" || e.type === "barker");
  const barker = g.finale.barker; barker.x = barker.hx = 60; barker.y = barker.hy = 60;
  for (const b of g.entities.filter((e) => e.type === "breaker")) {
    for (let i = 0; i < 60 * 4 && !b.done; i++) {
      g.player.x = b.x; g.player.y = b.y; g.player.invuln = 0; g.run.health = 100;
      barker.x = 60; barker.y = 60; barker.stun = 1;
      input.clear(); update(g, 1 / 60); g.events.length = 0;
    }
    assert(b.done, "breaker throws after standing on it");
  }
  assert(g.finale.open && !solidAt(g, ex.x, ex.y), "gate opens after all breakers");
  g.player.x = ex.x; g.player.y = ex.y + TILE; input.virt.y = -1;
  for (let i = 0; i < 120 && !g.outcome; i++) { barker.stun = 1; update(g, 1 / 60); }
  input.virt.y = 0;
  assert(g.outcome && g.outcome.type === "exit", "walking through the open gate exits");
}

/* ---- 4. mortal bots: the finale is winnable, no route crashes ---- */
{
  let won = 0; const N = 20;
  for (let i = 0; i < N; i++) {
    const run = newRun(); run.inventory.push({ id: "fork", uses: WEAPONS.fork.uses });
    if (playZone(run, "gate", { loot: false }).outcome === "exit") won++;
  }
  console.log(`  finale (fresh 100 hp + fork): bot won ${won}/${N}`);
  assert(won >= N * 0.3, "the finale should be winnable by the bot at least 30% of the time");
  for (const r of allRoutes()) {
    try { playRoute(r, { loot: true }); } catch (e) { failed++; console.log("FAIL route", r.join(">"), e.stack); }
  }
}

console.log(failed ? `${failed} failure(s)` : "engine smoke test passed");
process.exit(failed ? 1 : 0);
