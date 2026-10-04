/* Per-zone stage decor registry. One file per zone, one owner per file. */
import midway from "./midway.js";
import mirrors from "./mirrors.js";
import pen from "./pen.js";
import carousel from "./carousel.js";
import silent from "./silent.js";
import gallery from "./gallery.js";
import bigtop from "./bigtop.js";
import gate from "./gate.js";
export const ZONES = { midway, mirrors, pen, carousel, silent, gallery, bigtop, gate };
export const zoneOf = (game) => ZONES[(game && game.levelId) || ""] || {};
// Run a hook without letting one zone's bug take the whole frame down.
export function runZone(game, hook, ...args) {
  const f = zoneOf(game)[hook];
  if (!f) return;
  try { f(...args); } catch (e) { if (!runZone.warned) { runZone.warned = 1; console.warn("zone hook", hook, e); } }
}
