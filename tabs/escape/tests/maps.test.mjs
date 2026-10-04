// Map validator: node tabs/escape/tests/maps.test.mjs
// Checks every level: rectangular rows, known legend chars, closed border,
// exactly one start, at least one exit reachable from the start.
import { LEVELS, LEGEND, TILES, ROUTE } from "../js/content.js";

let failed = 0;
const fail = (id, msg) => { failed++; console.log("FAIL", id, msg); };

for (const [id, L] of Object.entries(LEVELS)) {
  const h = L.map.length, w = Math.max(...L.map.map((r) => r.length));
  L.map.forEach((r, y) => { if (r.length !== w) fail(id, `row ${y} has width ${r.length}, expected ${w}`); });
  const solid = (x, y) => {
    const c = (L.map[y] || "")[x] ?? "#"; const lg = LEGEND[c] || LEGEND["#"];
    return !!TILES[lg.tile || L.base].solid;
  };
  let S = null, starts = 0; const X = [];
  L.map.forEach((r, y) => [...r].forEach((c, x) => {
    if (!LEGEND[c]) fail(id, `unknown char '${c}' at ${x},${y}`);
    if (c === "S") { S = [x, y]; starts++; }
    if (c === "X") X.push([x, y]);
  }));
  if (starts !== 1) fail(id, `expected 1 start, got ${starts}`);
  if (!X.length) fail(id, "no exit");
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if ((y === 0 || y === h - 1 || x === 0 || x === w - 1) && !solid(x, y)) fail(id, `open border at ${x},${y}`);
  if (S) {
    const seen = new Set([S + ""]); const q = [S];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [x + dx, y + dy];
        if (!seen.has(n + "") && !solid(...n)) { seen.add(n + ""); q.push(n); }
      }
    }
    if (!X.some((e) => seen.has(e + ""))) fail(id, "exit unreachable from start");
    let unreach = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(x, y) && !seen.has([x, y] + "")) unreach++;
    if (unreach) console.log("note", id, unreach, "walkable tiles unreachable from start");
  }
  console.log("ok?", id, `${w}x${h}`);
}
for (const tier of ROUTE) for (const id of tier) if (!LEVELS[id]) fail("ROUTE", "unknown level " + id);
if (!LEVELS[ROUTE[ROUTE.length - 1][0]].final) fail("ROUTE", "last tier should be a final level");
console.log(failed ? `${failed} failure(s)` : "all maps valid");
process.exit(failed ? 1 : 0);
