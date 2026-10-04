// Render every panel (or the ones named) to standalone .svg files and XML-validate them.
//   node tabs/rusty/tools/render.mjs [outDir] [p07 p12 ...]
// Default outDir: $TMPDIR/rusty-panels. Exits non-zero if any panel throws or fails to parse.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const tab = path.resolve(here, "..");
const args = process.argv.slice(2);
const out = args[0] && !/^p\d+$/.test(args[0]) ? args.shift() : path.join(os.tmpdir(), "rusty-panels");
const only = new Set(args);
fs.mkdirSync(out, { recursive: true });

globalThis.window = globalThis;
const run = (f) => vm.runInThisContext(fs.readFileSync(f, "utf8"), { filename: f });
run(path.join(tab, "model.js"));
const html = fs.readFileSync(path.join(tab, "index.html"), "utf8");
const files = [...html.matchAll(/src="(panels\/p\d+\.js)"/g)].map((m) => m[1]);
let bad = 0;
for (const f of files) {
  const id = path.basename(f, ".js");
  if (only.size && !only.has(id)) continue;
  try { run(path.join(tab, f)); } catch (e) { console.error(`${id}: script error: ${e.message}`); bad++; continue; }
  const p = globalThis.RUSTY.panels[id];
  if (!p) { console.error(`${id}: did not register RUSTY.panel({id:"${id}"})`); bad++; continue; }
  let svg;
  try { svg = globalThis.RUSTY.svg(p); } catch (e) { console.error(`${id}: draw error: ${e.message}`); bad++; continue; }
  const file = path.join(out, id + ".svg");
  fs.writeFileSync(file, '<?xml version="1.0" encoding="utf-8"?>\n' + svg);
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const foreign = ids.filter((x) => !x.startsWith(id + "-"));
  if (foreign.length) { console.error(`${id}: ids not prefixed with "${id}-": ${foreign.slice(0, 5).join(", ")}`); bad++; }
  try { execFileSync("xmllint", ["--noout", file], { stdio: "pipe" }); console.log(`ok  ${id}  ${(svg.length / 1024).toFixed(0)} KB  ${file}`); }
  catch (e) { console.error(`${id}: XML error\n${e.stderr}`); bad++; }
}
process.exit(bad ? 1 : 0);
