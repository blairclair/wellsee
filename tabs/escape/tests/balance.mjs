// Balance report (not a pass/fail test): node tabs/escape/tests/balance.mjs [trials]
// Per zone: escape rate, mean time and damage for a "rush" bot (shortest path)
// and a "looter" bot (picks up everything first), fresh 100 hp.
// Per weapon: the same zones, rush bot, starting with only that weapon.
// Per route: whole runs with health carried between zones.
import { LEVELS, WEAPONS } from "../js/content.js";
import { newRun } from "../js/engine.js";
import { playZone, playRoute, allRoutes } from "./bot.mjs";

const N = +process.argv[2] || 12;
// bot profile: SKILL=0.5 REACT=0.2 approximates an average player (dashes late, half the time)
const PROF = { skill: process.env.SKILL ? +process.env.SKILL : 1, react: +process.env.REACT || 0 };
console.log("bot profile", JSON.stringify(PROF));
const pct = (a) => (100 * a).toFixed(0).padStart(3) + "%";
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function zoneStats(id, opts, weapon) {
  const rs = [];
  for (let i = 0; i < N; i++) {
    const run = newRun();
    if (weapon) run.inventory.push({ id: weapon, uses: WEAPONS[weapon].uses });
    rs.push(playZone(run, id, { ...PROF, ...opts }));
  }
  const ok = rs.filter((r) => r.outcome === "exit");
  const by = {}; rs.filter((r) => r.outcome !== "exit").forEach((r) => { const k = r.by || r.outcome; by[k] = (by[k] || 0) + 1; });
  return { esc: ok.length / N, t: avg(ok.map((r) => r.time)), dmg: avg(rs.map((r) => r.dmg)), by };
}
const fmt = (s) => `${pct(s.esc)}  ${s.t.toFixed(1).padStart(5)}s  dmg ${s.dmg.toFixed(0).padStart(3)}  ${Object.entries(s.by).map(([k, v]) => k + ":" + v).join(" ")}`;

console.log(`== zones (N=${N}) ==   rush | loot`);
for (const id of Object.keys(LEVELS)) {
  const a = zoneStats(id, { loot: false }), b = zoneStats(id, { loot: true });
  console.log(id.padEnd(10), fmt(a).padEnd(46), "|", fmt(b));
}
if (!process.env.SKIP_WEAPONS) {
  console.log(`\n== weapons: escape % over all zones, rush bot, start with only that weapon ==`);
  for (const w of [null, ...Object.keys(WEAPONS)]) {
    const ss = Object.keys(LEVELS).map((id) => zoneStats(id, { loot: false }, w));
    console.log((w || "none").padEnd(8), pct(avg(ss.map((s) => s.esc))), " dmg", avg(ss.map((s) => s.dmg)).toFixed(0), " ", ss.map((s) => pct(s.esc)).join(" "));
  }
}
console.log(`\n== routes (N=${N}, bot grabs pickups within 10 tiles, health carried) ==`);
for (const r of allRoutes()) {
  let won = 0; const reach = {}, times = [], hpGate = [], weps = [];
  for (let i = 0; i < N; i++) {
    const res = playRoute(r, { ...PROF, loot: 10 });
    if (res.won) { won++; times.push(res.run.time); }
    const fin = res.zones.find((z) => LEVELS[z.id].final);
    if (fin) { hpGate.push(fin.hpIn); weps.push(fin.wepIn); }
    const last = res.zones[res.zones.length - 1]; if (!res.won) reach[last.id] = (reach[last.id] || 0) + 1;
  }
  console.log(r.join(" > ").padEnd(46), pct(won / N), " run", avg(times).toFixed(0).padStart(3) + "s",
    " at gate: hp", avg(hpGate).toFixed(0).padStart(3), "weapon uses", avg(weps).toFixed(0).padStart(2), " died in:", JSON.stringify(reach));
}
