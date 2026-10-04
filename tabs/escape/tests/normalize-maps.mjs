// Dev helper: node tabs/escape/tests/normalize-maps.mjs
// Rewrites content.js so every level map is rectangular (mode width): long rows
// lose a floor char near the right wall, short rows gain one; wall rows use '#'.
import { readFileSync, writeFileSync } from "node:fs";
import { LEVELS } from "../js/content.js";

const path = new URL("../js/content.js", import.meta.url);
let src = readFileSync(path, "utf8");
const FLOOR = new Set(['"', ".", ",", ":"]);
for (const L of Object.values(LEVELS)) {
  const counts = {};
  for (const r of L.map) counts[r.length] = (counts[r.length] || 0) + 1;
  const w = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  for (const row of L.map) {
    if (row.length === w) continue;
    let fixed = row;
    if (/^#+$/.test(row)) fixed = "#".repeat(w);
    while (fixed.length > w) {
      let i = fixed.length - 2; while (i > 0 && !FLOOR.has(fixed[i])) i--;
      fixed = fixed.slice(0, i) + fixed.slice(i + 1);
    }
    while (fixed.length < w) {
      let i = fixed.length - 2; while (i > 0 && !FLOOR.has(fixed[i])) i--;
      const c = FLOOR.has(fixed[i]) ? fixed[i] : ".";
      fixed = fixed.slice(0, fixed.length - 1) + c + fixed.slice(fixed.length - 1);
    }
    const q = (s) => (s.includes('"') ? `'${s}'` : `"${s}"`);
    src = src.replace(q(row), q(fixed));
  }
}
writeFileSync(path, src);
console.log("normalized");
