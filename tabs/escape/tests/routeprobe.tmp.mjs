// temporary probe (deleted before commit): per-zone hp/sanity/inventory along routes
import { playRoute } from "./bot.mjs";
const N = +process.argv[2] || 16;
const PROF = { skill: 0.5, react: 0.2, loot: 10 };
const routes = (process.argv[3] || "midway,mirrors,silent,bigtop,gate;midway,pen,silent,bigtop,gate").split(";").map((s) => s.split(","));
for (const r of routes) {
  const agg = {};
  for (let i = 0; i < N; i++) {
    const res = playRoute(r, PROF);
    for (const z of res.zones) {
      const a = (agg[z.id] ||= { n: 0, hpIn: 0, dmg: 0, san: 0, t: 0, wep: 0, died: {} });
      a.n++; a.hpIn += z.hpIn; a.dmg += z.dmg; a.san += z.sanity; a.t += z.time; a.wep += z.wepIn;
      if (z.outcome !== "exit") a.died[z.by || z.outcome] = (a.died[z.by || z.outcome] || 0) + 1;
    }
  }
  console.log(r.join(">"));
  for (const [id, a] of Object.entries(agg)) console.log("  ", id.padEnd(9), "n", a.n, "hpIn", (a.hpIn / a.n).toFixed(0), "dmg", (a.dmg / a.n).toFixed(0), "sanOut", (a.san / a.n).toFixed(0), "t", (a.t / a.n).toFixed(0), "wepIn", (a.wep / a.n).toFixed(0), JSON.stringify(a.died));
}
