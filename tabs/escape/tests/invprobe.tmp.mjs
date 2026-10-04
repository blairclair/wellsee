// temporary probe: inventory entering the 3rd zone, and silent dmg by starting inventory
import { playZone } from "./bot.mjs";
import { newRun } from "../js/engine.js";
const PROF = { skill: 0.5, react: 0.2, loot: 10 };
const third = process.argv[2] || "silent";
for (const second of ["mirrors", "pen"]) {
  const invs = {}; const dmg = {};
  for (let i = 0; i < 40; i++) {
    const run = newRun(); let ok = true;
    for (const id of ["midway", second]) {
      if (run.path.length) { run.health = Math.min(100, run.health + 15); run.sanity = Math.min(100, run.sanity + 20); }
      run.path.push(id);
      if (playZone(run, id, PROF).outcome !== "exit") { ok = false; break; }
    }
    if (!ok) continue;
    const k = run.inventory.map((s) => s.id + s.uses).join("+") || "none";
    invs[k] = (invs[k] || 0) + 1;
    run.health = 100; run.sanity = 100; run.path.push(third);
    const r = playZone(run, third, PROF);
    (dmg[k] ||= []).push(r.outcome === "exit" ? r.dmg : 100);
  }
  console.log(second, Object.entries(invs).map(([k, v]) => `${k}:${v} dmg ${(dmg[k].reduce((a, b) => a + b, 0) / dmg[k].length).toFixed(0)}`).join(" | "));
}
