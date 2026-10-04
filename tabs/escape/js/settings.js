/* settings.js — player preferences and records, persisted in localStorage.
 * Owned by the UI agent. Every storage access is try/catch-wrapped: private
 * windows and blocked storage just fall back to defaults for the session.
 *
 *   settings            live object, mutate via setSetting(); read it every frame
 *     volume 0..1       master volume (sound itself always starts muted)
 *     shake  bool       screen shake
 *     flash  0|.5|1     full-screen flash intensity multiplier
 *     reduced bool      force reduced motion on (in addition to the OS setting)
 *   isReduced()         settings.reduced || prefers-reduced-motion
 *   onSettings(fn)      called after any change
 *   records             { best:{routeKey:secs}, deaths, wins, runs }
 *   saveRecords()
 */
const SKEY = "wellsee.escape.settings.v1", RKEY = "wellsee.escape.records.v1";
const DEFAULTS = { volume: 0.7, shake: true, flash: 1, reduced: false };

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); if (raw) return { ...fallback, ...JSON.parse(raw) }; } catch (e) { /* storage unavailable */ }
  return { ...fallback };
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* storage unavailable */ } }

export const settings = load(SKEY, DEFAULTS);
// sanitise anything odd that was stored
settings.volume = Math.min(1, Math.max(0, +settings.volume || 0));
settings.flash = [0, 0.5, 1].includes(settings.flash) ? settings.flash : 1;
settings.shake = settings.shake !== false;
settings.reduced = settings.reduced === true;

const listeners = new Set();
export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setSetting(k, v) {
  settings[k] = v; save(SKEY, settings);
  listeners.forEach((fn) => { try { fn(settings, k); } catch (e) { console.error(e); } });
}

let mq = null;
try { mq = matchMedia("(prefers-reduced-motion: reduce)"); } catch (e) { /* no matchMedia (node tests) */ }
export function isReduced() { return settings.reduced || !!(mq && mq.matches); }

export const records = load(RKEY, { best: {}, deaths: 0, wins: 0, runs: 0 });
if (!records.best || typeof records.best !== "object") records.best = {};
export function saveRecords() { save(RKEY, records); }
export function clearRecords() { records.best = {}; records.deaths = 0; records.wins = 0; records.runs = 0; saveRecords(); }
