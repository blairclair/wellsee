/* ui.js — every DOM element over the canvas: HUD, menus, route map, touch
 * controls, toasts, curtain transitions, settings, records, gamepad + keyboard
 * menu navigation. Styles live in ui.css. Owned by the UI agent.
 *
 *   createUI(root, handlers) -> ui
 *   handlers: input, onStart, onChoose(levelId), onResume, onPause, onQuit, onRetry, onSound
 *   ui.show(screen, data)   "title" "howto" "settings" "route" "intro" "pause" "lost" "won" or null (playing)
 *   ui.hud(game)            every frame while playing/paused (diffed: see set())
 *   ui.onEvent(ev)          engine events; unknown types are ignored
 *   ui.curtain(midway)      close curtains, run midway(), open; returns a Promise
 *   ui.toast(msg)  ui.setSound(on)  ui.resetHud()
 *
 * Everything new from the engine is handled generically: any key of game.status
 * with time left becomes a chip, game.finale drives the gate objective, and
 * events only ever add flavour (priority for toasts, warnings, records).
 */
import { WEAPONS, ENEMIES, OBSTACLES, ITEMS, ROUTE, LEVELS, TEXT, PLAYER } from "./content.js";
import { paintIcon } from "./art.js";
import { summarizeLevel } from "./engine.js";
import { audio } from "./audio.js";
import { settings, setSetting, onSettings, isReduced, records, saveRecords, clearRecords } from "./settings.js";

const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icon = (id, size = 32, cls = "ico") => { const c = h("canvas", cls); c.style.width = c.style.height = size + "px"; try { paintIcon(c, id, size); } catch (e) { /* art missing: blank */ } c.setAttribute("aria-hidden", "true"); return c; };
const titleCase = (s) => String(s).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const nameOf = (id) => (WEAPONS[id] || ITEMS[id] || ENEMIES[id] || OBSTACLES[id] || {}).name || titleCase(id);
const levelName = (id) => (LEVELS[id] ? LEVELS[id].name : titleCase(id));
export function fmtTime(s) { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; }

const HAZARD_NAMES = { mirror: "Funhouse mirrors", silence: "Silence", water: "Deep water" };
const STATUS = { // known statuses; anything else gets a title-cased chip
  marked: { label: "Seen", hint: "Every one of them knows where you are", glyph: "eye" },
  reversed: { label: "Reversed", hint: "Left is right", glyph: "swap" },
  stuck: { label: "Held", hint: "Something has your ankle", glyph: "hand" },
};
const GLYPH = {
  eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="currentColor"/></svg>`,
  swap: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21v-8l-3-3m3 3V5a1.5 1.5 0 013 0v6m0-7a1.5 1.5 0 013 0v7m0-6a1.5 1.5 0 013 0v7m0-4a1.5 1.5 0 013 0v6c0 4-3 7-7 7h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  hush: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  dot: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>`,
  heart: `<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29S1 19.5 1 9.6C1 4.8 4.6 1 9 1c3 0 5.4 1.7 7 4.3C17.6 2.7 20 1 23 1c4.4 0 8 3.8 8 8.6C31 19.5 16 29 16 29z"/></svg>`,
  speakerOn: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M16 8a5 5 0 010 8M18.5 5.5a8.5 8.5 0 010 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  speakerOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor"/><path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm9 4.6v-2.2l-2.3-.6a7 7 0 00-.7-1.6l1.2-2-1.6-1.6-2 1.2a7 7 0 00-1.6-.7L13.1 3h-2.2l-.6 2.3a7 7 0 00-1.6.7l-2-1.2-1.6 1.6 1.2 2a7 7 0 00-.7 1.6L3 10.9v2.2l2.3.6c.2.6.4 1.1.7 1.6l-1.2 2 1.6 1.6 2-1.2c.5.3 1 .5 1.6.7l.6 2.3h2.2l.6-2.3c.6-.2 1.1-.4 1.6-.7l2 1.2 1.6-1.6-1.2-2c.3-.5.5-1 .7-1.6z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>`,
};
// events that make the next toast in the same frame urgent
const DANGER = new Set(["hurt", "grab", "spawn", "marked", "flash", "flashCharge", "caught", "silenceEnter", "break", "cookie", "splash", "mirror", "bite", "barkerCall", "barkerWindup", "barkerLunge", "jackSpring"]);
const GOOD = new Set(["pickup", "heal", "breaker", "gateOpen", "exit", "flashCancel"]);
// short-lived HUD warnings for telegraphed attacks: [label, default seconds]
const WARN = { flashCharge: ["Camera charging", 1], barkerWindup: ["The Barker winds up", 0.8], jackCrank: ["Jack is cranking", 1.2] };

export function createUI(root, H) {
  root.innerHTML = "";
  const input = H.input;
  let screen = null, curEl = null, soundOn = false, lastGame = null, frameNo = 0;
  const applyMotion = () => root.classList.toggle("rm", isReduced());
  applyMotion();
  onSettings(applyMotion);
  try { matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyMotion); } catch (e) { /* old Safari */ }
  const sfx = (type) => audio.onEvent({ type });

  /* ---------------------------------------------------------------- run tracking (weapons used, records) */
  const runStats = new WeakMap(), recorded = new WeakSet();
  const stat = (run) => { if (!runStats.has(run)) runStats.set(run, { used: {}, hits: 0 }); return runStats.get(run); };
  const heldId = () => { const g = lastGame; if (!g) return null; const s = g.run.inventory[g.run.sel]; return s ? s.id : null; };
  const noteUse = (id) => { if (!id || !lastGame || !WEAPONS[id]) return; const u = stat(lastGame.run).used; u[id] = (u[id] || 0) + 1; };

  /* ---------------------------------------------------------------- mood + screens + curtain layers */
  const mood = h("div", "mood", `<div class="fog"></div><div class="grain"></div>`); mood.setAttribute("aria-hidden", "true"); root.appendChild(mood);

  /* ---------------------------------------------------------------- HUD */
  const hud = h("div", "hud"); hud.hidden = true;
  const TICKETS = 10;
  hud.innerHTML = `
    <div class="hurt-vig" aria-hidden="true"></div><div class="mark-vig" aria-hidden="true"></div>
    <div class="hud-top">
      <div class="hud-vitals">
        <div class="tickets" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="${PLAYER.maxHealth}">
          <span class="v-label">Health</span>
          <div class="ticket-row">${Array.from({ length: TICKETS }, () => `<span class="tk"><i></i></span>`).join("")}</div>
          <b class="v-num"></b>
        </div>
        <div class="sanity" role="meter" aria-label="Sanity" aria-valuemin="0" aria-valuemax="${PLAYER.maxSanity}">
          <span class="v-label">Sanity</span>
          <div class="tube"><i></i>
            <svg class="cracks" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
              <path class="c1" d="M38 0l5 7-6 5 8 8M43 7l9-2"/>
              <path class="c2" d="M104 20l-3-6 7-5-4-9M101 14l-10 1M108 9l9 3"/>
              <path class="c3" d="M160 0l-4 6 6 4-5 10M156 6l-12-2M162 10l12 4 6-6M70 20l4-8-5-5 3-7"/>
            </svg>
          </div>
          <b class="v-num"></b>
        </div>
        <div class="chips" aria-live="polite"></div>
      </div>
      <div class="hud-objective">
        <div class="zone-plaque"><span class="zone-name"></span><span class="run-time" aria-label="Run time"></span></div>
        <div class="compass"><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12h15M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="dist"></span></div>
        <div class="finale" hidden>
          <div class="fin-title">The Front Gate</div>
          <div class="fin-row"><span class="fin-pips"></span><span class="fin-text"></span></div>
          <div class="fin-work"><i></i></div>
        </div>
        <div class="warns" aria-live="assertive"></div>
      </div>
      <div class="hud-right">
        <div class="hud-dread" role="meter" aria-label="Dread" aria-valuemin="0" aria-valuemax="100">
          <span class="heart">${GLYPH.heart}</span>
          <div class="dread-body"><span class="dread-word">Calm</span><div class="dread-gauge"><i></i></div></div>
        </div>
        <div class="hud-btns">
          <button class="hud-btn btn-sound" aria-label="Sound off" aria-pressed="false">${GLYPH.speakerOff}</button>
          <button class="hud-btn btn-pause" aria-label="Pause">${GLYPH.pause}</button>
        </div>
      </div>
    </div>
    <div class="hud-bottom">
      <div class="slots"></div>
      <div class="dash-pip" title="Dash (Shift / K)"><span>Dash</span></div>
    </div>
    <div class="toasts" aria-live="polite"></div>`;
  root.appendChild(hud);
  const $ = (s) => hud.querySelector(s);
  const tickets = $(".tickets"), tks = [...hud.querySelectorAll(".tk")], hpNum = tickets.querySelector(".v-num");
  const sanityEl = $(".sanity"), sanNum = sanityEl.querySelector(".v-num");
  const chips = $(".chips"), zoneName = $(".zone-name"), runTime = $(".run-time");
  const compass = $(".compass"), arrow = $(".arrow"), dist = $(".dist");
  const finEl = $(".finale"), finPips = $(".fin-pips"), finText = $(".fin-text"), finWork = $(".fin-work"), warns = $(".warns");
  const dreadBox = $(".hud-dread"), dreadWord = $(".dread-word");
  const slotsEl = $(".slots"), dashPip = $(".dash-pip"), toastsEl = $(".toasts");
  $(".btn-pause").addEventListener("click", () => H.onPause());
  $(".btn-sound").addEventListener("click", () => H.onSound());

  /* ---------------------------------------------------------------- touch controls
     Floating stick: touch anywhere on the left of the screen and the stick centres under your thumb. */
  const touch = h("div", "touch"); touch.hidden = true;
  touch.innerHTML = `<div class="stick-zone" aria-hidden="true"><div class="stick"><div class="knob"></div></div></div>
    <div class="tbtns">
      <button class="tbtn t-swap" aria-label="Swap weapon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-4-4M20 16H6l4 4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="tbtn t-dash" aria-label="Dash">Dash</button>
      <button class="tbtn t-atk" aria-label="Strike">Strike</button>
    </div>`;
  root.appendChild(touch);
  const zone = touch.querySelector(".stick-zone"), stick = touch.querySelector(".stick"), knob = touch.querySelector(".knob");
  let stickId = null, sc = { x: 0, y: 0 };
  const R = 46;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const restStick = () => { stick.style.left = stick.style.top = ""; stick.classList.remove("live"); setKnob(0, 0); };
  zone.addEventListener("pointerdown", (e) => {
    e.preventDefault(); stickId = e.pointerId; zone.setPointerCapture(e.pointerId);
    const zr = zone.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX, zr.left + 60), zr.right - 60), y = Math.min(Math.max(e.clientY, zr.top + 60), zr.bottom - 60);
    sc = { x, y }; stick.classList.add("live");
    stick.style.left = (x - zr.left) + "px"; stick.style.top = (y - zr.top) + "px";
    moveStick(e);
  });
  const moveStick = (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - sc.x, dy = e.clientY - sc.y; const m = Math.hypot(dx, dy);
    if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; }
    setKnob(dx, dy); input.virt.x = dx / R; input.virt.y = dy / R;
    if (Math.hypot(input.virt.x, input.virt.y) < 0.16) input.virt.x = input.virt.y = 0;
  };
  zone.addEventListener("pointermove", moveStick);
  const endStick = (e) => { if (e.pointerId !== stickId) return; stickId = null; restStick(); input.virt.x = input.virt.y = 0; };
  zone.addEventListener("pointerup", endStick); zone.addEventListener("pointercancel", endStick);
  const tb = (sel, down, up) => {
    const b = touch.querySelector(sel);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); down(); b.classList.add("on"); if (navigator.vibrate && settings.shake) try { navigator.vibrate(8); } catch (_) { /* no haptics */ } });
    const off = () => { b.classList.remove("on"); up && up(); };
    b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
  };
  tb(".t-atk", () => { input.press("attack"); input.held.attack = true; }, () => { input.held.attack = false; });
  tb(".t-dash", () => input.press("dash"));
  tb(".t-swap", () => input.press("next"));
  let isTouch = matchMedia("(pointer: coarse)").matches;
  window.addEventListener("touchstart", () => { if (!isTouch) { isTouch = true; if (screen === null) touch.hidden = false; root.classList.add("is-touch"); } }, { passive: true });
  root.classList.toggle("is-touch", isTouch);

  /* ---------------------------------------------------------------- screens + curtain */
  const layer = h("div", "screens"); root.appendChild(layer);
  const curtainEl = h("div", "curtain", `<div class="c-left"></div><div class="c-right"></div><div class="c-valance"></div><div class="c-seal" aria-hidden="true"><span>W</span></div>`);
  curtainEl.setAttribute("aria-hidden", "true"); root.appendChild(curtainEl);

  const soundLabel = () => (soundOn ? "Sound on" : "Sound off");
  const soundBtn = (cls = "btn btn-ghost") => `<button class="${cls} js-sound" aria-pressed="${soundOn}"><span class="b-ico">${soundOn ? GLYPH.speakerOn : GLYPH.speakerOff}</span><span class="b-txt">${soundLabel()}</span></button>`;
  const bindCommon = (el, data) => {
    el.querySelectorAll(".js-sound").forEach((b) => b.addEventListener("click", () => H.onSound()));
    el.querySelectorAll(".js-howto").forEach((b) => b.addEventListener("click", () => { sfx("uiClick"); ui.show("howto", { back: screen, backData: data }); }));
    el.querySelectorAll(".js-settings").forEach((b) => b.addEventListener("click", () => { sfx("uiClick"); ui.show("settings", { back: screen, backData: data }); }));
    el.querySelectorAll(".js-back").forEach((b) => b.addEventListener("click", () => { sfx("uiBack"); ui.show(data && data.back ? data.back : "title", data && data.backData); }));
    el.querySelectorAll("button").forEach((b) => b.addEventListener("pointerenter", () => { if (!isTouch) sfx("uiMove"); }));
  };
  const bestOverall = () => { const v = Object.values(records.best); return v.length ? Math.min(...v) : null; };
  const takenLine = () => records.deaths ? `You have been taken <b>${records.deaths}</b> time${records.deaths === 1 ? "" : "s"}.` : "No one has taken you. Yet.";

  /* ---- title ------------------------------------------------------------------ */
  function titleScreen() {
    const el = h("section", "screen screen-title");
    const word = (w, cls) => `<span class="word ${cls}">${[...w].map((c) => `<span class="lt">${c}</span>`).join("")}</span>`;
    const best = bestOverall();
    el.innerHTML = `
      <div class="marquee">
        <div class="bulb-frame" aria-hidden="true"></div>
        <p class="kicker">The Wellsee Carnival presents</p>
        <h1 class="title" aria-label="Escape the Midway">${word("Escape", "w1")} <span class="word w2">the</span> ${word("Midway", "w3")}</h1>
        <p class="sub">${esc(TEXT.subtitle)}</p>
      </div>
      <div class="menu">
        <button class="btn btn-primary js-start">Run for the Gate</button>
        <button class="btn js-howto">How to Survive</button>
        <div class="menu-row">
          <button class="btn btn-ghost js-settings"><span class="b-ico">${GLYPH.gear}</span><span class="b-txt">Settings</span></button>
          ${soundBtn()}
        </div>
      </div>
      <p class="tally">${takenLine()}${best != null ? ` <span class="sep">·</span> Best escape <b>${fmtTime(best)}</b>` : ""}${records.wins ? ` <span class="sep">·</span> Escaped <b>${records.wins}</b>` : ""}</p>
      <p class="whisper">Don't call them clowns. Clowns choose it.</p>`;
    el.querySelector(".js-start").addEventListener("click", () => { sfx("uiClick"); H.onStart(); });
    // bulbs around the sign; a few are dead, a few are dying
    const frame = el.querySelector(".bulb-frame"), bulbs = [];
    const add = (l, t) => { const b = h("i"); b.style.left = l + "%"; b.style.top = t + "%"; if (Math.random() < 0.09) b.className = "dead"; frame.appendChild(b); bulbs.push(b); };
    const NX = 24, NY = 7;
    for (let i = 0; i <= NX; i++) { add((i / NX) * 100, 0); add((i / NX) * 100, 100); }
    for (let j = 1; j < NY; j++) { add(0, (j / NY) * 100); add(100, (j / NY) * 100); }
    bulbs.forEach((b, i) => { b.style.animationDelay = (-(i % 3) * 0.8) + "s"; });
    const letters = [...el.querySelectorAll(".lt")];
    letters.forEach((l, i) => { l.dataset.ch = l.textContent; l.style.setProperty("--i", i); });
    // dying bulbs: one element at a time sputters; at most one sputter starts every 0.7 s (well under 3 flashes/s)
    const sputter = () => {
      if (!el.isConnected) return;
      if (!isReduced()) {
        const r = Math.random();
        if (r < 0.45) { const l = letters[(Math.random() * letters.length) | 0]; l.classList.add("dying"); setTimeout(() => l.classList.remove("dying"), 1300); }
        else if (r < 0.6) { const l = letters[(Math.random() * letters.length) | 0]; l.classList.add("dead"); setTimeout(() => l.classList.remove("dead"), 2500 + Math.random() * 4000); }
        else { const b = bulbs[(Math.random() * bulbs.length) | 0]; b.classList.add("dying"); setTimeout(() => b.classList.remove("dying"), 1300); }
      }
      setTimeout(sputter, 700 + Math.random() * 1500);
    };
    setTimeout(sputter, 1200);
    return el;
  }

  /* ---- how to survive: tabs of illustrated cards ------------------------------ */
  let howtoTab = 0;
  function howtoScreen(data) {
    const el = h("section", "screen screen-howto");
    const card = (ico, name, body, extra = "") => `<article class="hcard"><div class="hc-art"${ico && !ico.startsWith("<") ? ` data-ico="${ico}"` : ""}>${ico && ico.startsWith("<") ? ico : ""}</div><div class="hc-txt"><h4>${name}</h4><p>${body}</p>${extra}</div></article>`;
    const k = (s) => `<kbd>${s}</kbd>`;
    const pad = (s) => `<kbd class="pad">${s}</kbd>`;
    const ctrl = (svg) => `<svg viewBox="0 0 48 48" aria-hidden="true">${svg}</svg>`;
    const finalLevel = Object.values(LEVELS).find((l) => l.final);
    const tabs = [
      ["Run", [
        card(ctrl(`<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M24 10l-4 6h8zM24 38l-4-6h8zM10 24l6-4v8zM38 24l-6-4v8z" fill="currentColor"/>`), "Move", `${k("WASD")} or ${k("Arrows")} · left stick · left thumb anywhere on the left half of a phone.`),
        card(ctrl(`<path d="M10 38L34 14M30 10l8 8M8 34l6 6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`), "Strike", `${k("Space")} or ${k("J")} · ${pad("A")} · the red button. Uses the weapon in your prize booth.`),
        card(ctrl(`<path d="M6 30h18M10 22h18M14 14h18M30 10l10 14-10 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`), "Dash", `${k("Shift")} or ${k("K")} · ${pad("B")}. Slip through grasping hands. It needs a breath to recharge.`),
        card(ctrl(`<path d="M8 16h28l-6-6M40 32H12l6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`), "Swap", `${k("Q")} ${k("E")} or ${k("1")}-${k("3")} · ${pad("LB")} ${pad("RB")}. Three hands' worth of pockets.`),
        card(ctrl(`<rect x="13" y="10" width="7" height="28" rx="2" fill="currentColor"/><rect x="28" y="10" width="7" height="28" rx="2" fill="currentColor"/>`), "Pause", `${k("Esc")} or ${k("P")} · ${pad("Start")}. ${k("M")} toggles sound. They are only being polite.`),
      ]],
      ["Survive", [
        card(ctrl(`<rect x="6" y="12" width="36" height="24" rx="3" fill="#ff2a4d"/><circle cx="6" cy="24" r="4" fill="#120a0e"/><circle cx="42" cy="24" r="4" fill="#120a0e"/><path d="M30 12v24" stroke="#120a0e" stroke-dasharray="3 3"/>`), "Health tickets", "Every grab tears a ticket off your strip. Run out of tickets and you stay."),
        card(ctrl(`<rect x="4" y="18" width="40" height="12" rx="6" fill="none" stroke="currentColor" stroke-width="2"/><rect x="7" y="21" width="22" height="6" rx="3" fill="#7dff4a"/><path d="M30 18l-3 6 4 2-2 4" stroke="#fff" fill="none"/>`), "Sanity", "Drains near the Unwilling, in the silence and under the light. The glass cracks as it goes. Fireflies mend it."),
        card(ctrl(`<path d="M24 41S6 30 6 17c0-5 4-9 9-9 4 0 7 2 9 5 2-3 5-5 9-5 5 0 9 4 9 9 0 13-18 24-18 24z" fill="#ff2a4d"/>`), "Dread", "Your heart knows before you do. The faster it beats, the closer they are."),
        card(ctrl(`<path d="M8 20h8l10-8v24l-10-8H8z" fill="currentColor"/><path d="M32 18l10 12m0-12L32 30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`), "Silence", "Grey ground where the bugs are dead. In silence every one of them hears you."),
        card(ctrl(`<path d="M6 40C14 30 12 20 22 18s14-10 20-12" fill="none" stroke="#c43a2a" stroke-width="3" stroke-dasharray="1 0"/><circle cx="6" cy="40" r="4" fill="currentColor"/><path d="M38 2l6 6m0-6l-6 6" stroke="#c43a2a" stroke-width="3"/>`), "Choose your way", "Short routes are watched. Long routes have more to carry, but every minute you linger, another tent flap opens."),
      ]],
      ["Carry", Object.entries(WEAPONS).map(([id, w]) => card(id, esc(w.name), esc(w.desc || ""), `<span class="hc-meta">${w.uses} uses</span>`)).concat(Object.entries(ITEMS).map(([id, it]) => card(id, esc(it.name), esc(it.desc || it.lore || (id === "apple" ? "Mends a few tickets." : "Restores sanity."))))) ],
      ["The Unwilling", Object.entries(ENEMIES).map(([id, e]) => card(id, esc(e.name), esc(e.lore || "")))],
      ["Attractions", Object.entries(OBSTACLES).filter(([id]) => id !== "spawner").map(([id, o]) => card(id, esc(o.name), esc(o.lore || "")))
        .concat([card("mirror", "Funhouse Mirror", "Touch one and your left becomes your right."), card(OBSTACLES.spawner ? "spawner" : "", esc((OBSTACLES.spawner && OBSTACLES.spawner.name) || "Tent Flaps"), esc((OBSTACLES.spawner && OBSTACLES.spawner.lore) || "Linger, and someone steps out."))])],
    ];
    if (finalLevel) tabs.push(["The Gate", [
      card(ctrl(`<rect x="12" y="6" width="24" height="36" rx="3" fill="#2a2a30" stroke="currentColor" stroke-width="2"/><rect x="20" y="12" width="8" height="14" rx="2" fill="#f6d27a"/><circle cx="24" cy="34" r="3" fill="#ff2a4d"/>`), "Throw the breakers", "The front gate is chained shut and wired to the lights. Stand at each breaker until it throws. Every one you throw, the carnival notices."),
      card(ENEMIES.barker ? "barker" : "", esc((ENEMIES.barker && ENEMIES.barker.name) || "The Barker"), esc((ENEMIES.barker && ENEMIES.barker.lore) || "He calls the crowd. When he shouts STEP RIGHT UP, more of them come.") + " Watch for the wind-up, then get out of the line of his lunge."),
      card(ctrl(`<path d="M6 42V14l18-8 18 8v28" fill="none" stroke="#9dff6a" stroke-width="3"/><path d="M16 42V22h16v20" fill="none" stroke="#9dff6a" stroke-width="2"/>`), "Gate open: run", "When the last breaker throws, the gate opens. Don't stop for anything."),
    ]]);
    howtoTab = Math.min(howtoTab, tabs.length - 1);
    el.innerHTML = `
      <div class="panel howto-panel">
        <h2>How to Survive</h2>
        <div class="tabs" role="tablist" aria-label="Topics">${tabs.map(([t], i) => `<button class="tab" role="tab" id="ht-${i}" aria-controls="hp-${i}" aria-selected="${i === howtoTab}" tabindex="${i === howtoTab ? 0 : -1}">${t}</button>`).join("")}</div>
        ${tabs.map(([, cards], i) => `<div class="tabpanel" role="tabpanel" id="hp-${i}" aria-labelledby="ht-${i}" ${i === howtoTab ? "" : "hidden"}><div class="hcards">${cards.join("")}</div></div>`).join("")}
        <div class="menu"><button class="btn btn-primary js-back">Back</button></div>
      </div>`;
    el.querySelectorAll(".hc-art[data-ico]").forEach((a) => { const id = a.dataset.ico; if (id && !a.firstChild) {
      // mini entities are drawn at world scale, so paint small and blow them up: a portrait, not a speck
      if (ENEMIES[id]) { const c = icon(id, 32); c.style.width = c.style.height = "60px"; c.classList.add("portrait"); a.appendChild(c); }
      else a.appendChild(icon(id, 52));
    } });
    const tabBtns = [...el.querySelectorAll(".tab")], panels = [...el.querySelectorAll(".tabpanel")];
    const pick = (i) => {
      howtoTab = i;
      tabBtns.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; });
      panels.forEach((p, j) => { p.hidden = j !== i; });
    };
    tabBtns.forEach((b, i) => { b.addEventListener("click", () => { sfx("uiMove"); pick(i); }); b.addEventListener("focus", () => pick(i)); });
    return el;
  }

  /* ---- settings ----------------------------------------------------------------- */
  function settingsScreen() {
    const el = h("section", "screen screen-settings");
    const seg = (key, opts) => `<div class="seg" role="radiogroup" aria-label="${key}">${opts.map(([v, l]) => `<button role="radio" data-k="${key}" data-v="${v}" aria-checked="${settings[key] === v}">${l}</button>`).join("")}</div>`;
    el.innerHTML = `
      <div class="panel small settings-panel">
        <h2>Settings</h2>
        <div class="set-rows">
          <div class="set-row"><span class="set-name">Sound<small>Always starts off. Nothing plays until you ask.</small></span>${soundBtn("toggle js-sound")}</div>
          <div class="set-row"><label class="set-name" for="set-vol">Volume</label><span class="range"><input id="set-vol" type="range" min="0" max="100" step="5" value="${Math.round(settings.volume * 100)}"><output>${Math.round(settings.volume * 100)}</output></span></div>
          <div class="set-row"><span class="set-name">Screen shake</span><button class="toggle js-shake" aria-pressed="${settings.shake}"><span class="b-txt">${settings.shake ? "On" : "Off"}</span></button></div>
          <div class="set-row"><span class="set-name">Flashes<small>Camera flashes and hit flashes</small></span>${seg("flash", [[1, "Full"], [0.5, "Soft"], [0, "Off"]])}</div>
          <div class="set-row"><span class="set-name">Motion<small>Reduced stills the bulbs, shake and sway</small></span>${seg("reduced", [[false, "System"], [true, "Reduced"]])}</div>
          <div class="set-row rec"><span class="set-name">Records<small>${takenLine()} Escaped ${records.wins || 0}.</small></span><button class="toggle danger js-erase">Erase</button></div>
        </div>
        <div class="menu"><button class="btn btn-primary js-back">Back</button></div>
      </div>`;
    const vol = el.querySelector("#set-vol"), out = el.querySelector("output");
    vol.addEventListener("input", () => { out.textContent = vol.value; setSetting("volume", vol.value / 100); });
    vol.addEventListener("change", () => sfx("uiClick"));
    const shake = el.querySelector(".js-shake");
    shake.addEventListener("click", () => { setSetting("shake", !settings.shake); shake.setAttribute("aria-pressed", settings.shake); shake.querySelector(".b-txt").textContent = settings.shake ? "On" : "Off"; sfx("uiClick"); });
    el.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
      const key = b.dataset.k, raw = b.dataset.v, v = raw === "true" ? true : raw === "false" ? false : +raw;
      setSetting(key, v); b.parentNode.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", x === b)); sfx("uiClick");
    }));
    const erase = el.querySelector(".js-erase"); let armed = 0;
    erase.addEventListener("click", () => {
      if (Date.now() - armed < 3000) { clearRecords(); erase.textContent = "Erased"; erase.disabled = true; el.querySelector(".rec small").innerHTML = "Nothing remembers you."; sfx("uiBack"); return; }
      armed = Date.now(); erase.textContent = "Sure?"; setTimeout(() => { if (!erase.disabled) erase.textContent = "Erase"; }, 3000);
    });
    return el;
  }

  /* ---- route: a stained carnival map with your path inked in ------------------- */
  function bestThrough(tier, id) {
    let best = null;
    for (const [key, t] of Object.entries(records.best)) if (key.split(">")[tier] === id && (best == null || t < best)) best = t;
    return best;
  }
  function mapSVG(run, vertical) {
    const tiers = ROUTE.length, cols = tiers + 2; // entrance + tiers + the road home
    const rowH = 62, W = vertical ? 340 : 1000, Hh = vertical ? 40 + (cols - 1) * rowH + 30 : 250;
    // deterministic wobble so the ink looks hand-drawn but stable between renders
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const pos = (col, i, n) => {
      const along = (col + 0.5) / cols, across = n === 1 ? 0.5 : 0.22 + (0.56 * i) / (n - 1);
      if (vertical) return { x: (n === 1 ? 0.5 : 0.17 + (0.66 * i) / (n - 1)) * W, y: 26 + col * rowH };
      return { x: 30 + along * (W - 60), y: across * Hh };
    };
    const nodes = [[{ id: "@start", label: "The Ticket Booth", ...pos(0, 0, 1) }]];
    ROUTE.forEach((ids, t) => nodes.push(ids.map((id, i) => ({ id, label: levelName(id), tier: t, ...pos(t + 1, i, ids.length) }))));
    nodes.push([{ id: "@home", label: "The Road Home", ...pos(cols - 1, 0, 1) }]);
    const curve = (a, b, j = 10) => { const mx = (a.x + b.x) / 2 + (rnd() - 0.5) * j, my = (a.y + b.y) / 2 + (rnd() - 0.5) * j; return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`; };
    let faint = "", ink = "", nodesSvg = "";
    for (let c = 0; c < nodes.length - 1; c++) for (const a of nodes[c]) for (const b of nodes[c + 1]) faint += `<path d="${curve(a, b, 26)}"/>`;
    // the inked path: entrance -> each taken zone (-> home if all done)
    const taken = [nodes[0][0]];
    run.path.forEach((id, t) => { const n = (nodes[t + 1] || []).find((x) => x.id === id); if (n) taken.push(n); });
    if (screenData && screenData.won) taken.push(nodes[nodes.length - 1][0]);
    seed = 31;
    for (let i = 0; i < taken.length - 1; i++) ink += `<path d="${curve(taken[i], taken[i + 1], 14)}"/>`;
    const here = taken[taken.length - 1];
    const nextTier = run.tier, choosing = run.path.length === run.tier; // waiting to choose ROUTE[run.tier]
    nodes.forEach((col, c) => col.forEach((n) => {
      const isTaken = taken.includes(n), isOption = choosing && n.tier === nextTier, final = LEVELS[n.id] && LEVELS[n.id].final;
      const cls = ["node", isTaken ? "taken" : "", isOption ? "option" : "", final ? "final" : "", n.id[0] === "@" ? "end" : "", c < run.path.length + 1 && !isTaken ? "lost" : ""].join(" ");
      const lbl = n.label.replace(/^The /, "");
      const words = [], max = vertical ? 12 : 15;
      for (const w of lbl.split(" ")) { if (words.length && (words[words.length - 1] + " " + w).length <= max) words[words.length - 1] += " " + w; else words.push(w); }
      const ty = vertical ? 25 : 30;
      nodesSvg += `<g class="${cls}" data-id="${esc(n.id)}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})">
        ${isOption ? `<circle class="ring" r="17"/>` : ""}
        ${final ? `<path class="gate" d="M-11 9V-6l11-6 11 6V9M-5 9V-2h10V9"/>` : n.id[0] === "@" ? `<circle class="dot" r="6"/>` : `<path class="tent" d="M-12 8L0-11 12 8zM-4 8L0 0 4 8"/>`}
        ${isTaken && n !== here ? `<path class="x" d="M-6-6L6 6M6-6L-6 6"/>` : ""}
        <text class="lbl" x="0" y="${ty}" text-anchor="middle">${words.map((w, i) => `<tspan x="0" dy="${i ? 13 : 0}">${esc(w)}</tspan>`).join("")}</text>
      </g>`;
    }));
    const pin = `<g class="pin" transform="translate(${here.x.toFixed(1)} ${(here.y - 16).toFixed(1)})"><g class="pin-b"><path d="M0 0c-6-8-9-11-9-16a9 9 0 0118 0c0 5-3 8-9 16z"/><circle cy="-16" r="3.2"/></g></g>`;
    const rose = vertical ? "" : `<g class="rose" transform="translate(${W - 34} 34)"><circle r="16"/><path d="M0-22L4 0 0 22-4 0zM-22 0L0-4 22 0 0 4z"/><text y="-25" text-anchor="middle">N</text></g>`;
    return `<svg class="map-svg" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Map of the grounds. You are at ${esc(here.label)}.">
      <defs><filter id="inkf"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter></defs>
      ${rose}<g class="faint">${faint}</g><g class="ink" filter="url(#inkf)">${ink}</g><g class="preview"></g>${nodesSvg}${pin}</svg>`;
  }
  let screenData = null;
  function routeScreen(data) {
    const { run } = data; const tier = run.tier, ids = ROUTE[tier] || [];
    const el = h("section", "screen screen-route");
    const first = tier === 0, final = ids.some((id) => LEVELS[id] && LEVELS[id].final);
    el.innerHTML = `<div class="panel route-panel">
      <h2>${first ? "The Gates Close Behind You" : final ? "The Front Gate" : "Choose Your Way"}</h2>
      <p class="route-hint">${first ? "There is only one way in. The exit is on the far side of everything." : final ? "One last stretch. The gate is wired shut, and someone is calling the crowd." : "Short and watched, or long and hungry. Every second you spend, the tents send someone new."}</p>
      <div class="map"><div class="map-head"><span>Map of the Grounds</span><span class="map-time">${run.time ? fmtTime(run.time) + " on the clock" : "Zone " + (tier + 1) + " of " + ROUTE.length}</span></div><div class="map-body"></div></div>
      <div class="choices" role="group" aria-label="Choose a zone"></div>
      <p class="nav-hint" aria-hidden="true"><kbd>&larr;</kbd><kbd>&rarr;</kbd> choose &nbsp; <kbd>Enter</kbd> go</p></div>`;
    const body = el.querySelector(".map-body");
    const drawMap = () => { const vertical = (layer.clientWidth || innerWidth) < 600; body.innerHTML = mapSVG(run, vertical); body.dataset.v = vertical ? "v" : "h"; };
    drawMap(); el._redraw = drawMap;
    const choices = el.querySelector(".choices");
    const pips = (n, cls) => Array.from({ length: 5 }, (_, i) => `<i class="${cls}${i < n ? " on" : ""}"></i>`).join("");
    ids.forEach((id, idx) => {
      const s = summarizeLevel(id), best = bestThrough(tier, id);
      const card = h("button", "choice" + (s.final ? " final" : ""));
      card.dataset.id = id;
      card.innerHTML = `<span class="c-num">${ids.length > 1 ? "Path " + "ABC"[idx] : "The only way"}</span>
        <span class="c-name">${esc(s.name)}</span><span class="c-tag">${esc(s.tag)}</span>${s.reward ? `<span class="c-reward">${esc(s.reward)}</span>` : ""}
        <span class="c-stats"><span class="c-row"><span>Length</span><span class="pips">${pips(s.length, "len")}</span></span>
        <span class="c-row"><span>Threat</span><span class="pips">${pips(s.threat, "thr")}</span></span></span>
        <span class="c-blurb">${esc(s.blurb)}</span>
        <span class="c-grid"><span class="c-sec">Loot</span><span class="c-icons loot"></span>
        <span class="c-sec">Hazards</span><span class="c-icons haz"></span>
        <span class="c-sec">Unwilling</span><span class="c-icons foes"></span></span>
        <span class="c-foot"><span class="c-best">${best != null ? "Best escape via here " + fmtTime(best) : ""}</span><span class="c-go">${ids.length > 1 ? "Go this way" : "Enter"} &rarr;</span></span>`;
      const add = (sel, id2, n, label) => { const w = h("span", "ci"); w.title = label; w.setAttribute("aria-label", label + (n > 1 ? " ×" + n : "")); w.appendChild(icon(id2, 24)); if (n > 1) w.appendChild(h("b", "", "×" + n)); card.querySelector(sel).appendChild(w); };
      for (const [k, n] of Object.entries(s.loot)) add(".loot", k, n, nameOf(k));
      for (const [k] of Object.entries(s.hazards)) { if (OBSTACLES[k]) add(".haz", k, 1, OBSTACLES[k].name); else card.querySelector(".haz").appendChild(h("span", "ci txt", esc(HAZARD_NAMES[k] || titleCase(k)))); }
      for (const [k, n] of Object.entries(s.foes)) add(".foes", k, n, nameOf(k));
      if (!Object.keys(s.loot).length) card.querySelector(".loot").appendChild(h("span", "ci txt", "nothing"));
      if (!Object.keys(s.hazards).length) card.querySelector(".haz").appendChild(h("span", "ci txt", "only the animals"));
      if (!Object.keys(s.foes).length) card.querySelector(".foes").appendChild(h("span", "ci txt", "quiet. too quiet"));
      card.addEventListener("click", () => { sfx("uiClick"); H.onChoose(id); });
      const preview = (on) => {
        el.querySelectorAll(".node").forEach((n) => n.classList.toggle("hot", on && n.dataset.id === id));
        const g = el.querySelector(".preview"), here = el.querySelector(".pin"), node = el.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
        if (!g) return; g.innerHTML = "";
        if (on && here && node) { const a = here.transform.baseVal[0].matrix, b = node.transform.baseVal[0].matrix; g.innerHTML = `<path d="M${a.e} ${a.f + 16} L${b.e} ${b.f}"/>`; }
      };
      card.addEventListener("focus", () => preview(true)); card.addEventListener("mouseenter", () => preview(true));
      card.addEventListener("blur", () => preview(false)); card.addEventListener("mouseleave", () => preview(document.activeElement === card));
      card.style.animationDelay = 0.15 + idx * 0.12 + "s";
      choices.appendChild(card);
    });
    choices.dataset.n = ids.length;
    return el;
  }

  /* ---- intro card ------------------------------------------------------------------ */
  function introScreen(data) {
    const el = h("section", "screen screen-intro");
    const lv = Object.values(LEVELS).find((l) => l.name === data.name) || {};
    const obj = lv.final ? "Throw the breakers. Open the gate. Run." : "Find the exit. Don't stop moving.";
    el.innerHTML = `<div class="intro-card"><p class="intro-kicker">Zone ${data.index} of ${ROUTE.length}</p><h2>${esc(data.name)}</h2><p class="intro-tag">${esc(data.tag)}</p>
      ${lv.threat ? `<p class="intro-threat"><span>Threat</span><span class="pips">${Array.from({ length: 5 }, (_, i) => `<i class="thr${i < lv.threat ? " on" : ""}"></i>`).join("")}</span></p>` : ""}
      <p class="intro-obj">${obj}</p></div>`;
    return el;
  }

  /* ---- pause: the booth is closed ---------------------------------------------------- */
  function pauseScreen() {
    const el = h("section", "screen screen-pause");
    const g = lastGame, run = g && g.run;
    el.innerHTML = `<div class="sign-wrap"><div class="chains" aria-hidden="true"></div>
      <div class="pause-sign"><p class="ps-kicker">This booth is</p><h2>Closed</h2><p class="whisper">They are not paused. They are only being polite.</p>
      ${run ? `<p class="ps-stats"><span>${esc(g.level.name)}</span><span>${fmtTime(run.time)}</span><span>${run.repelled} repelled</span></p>` : ""}
      <div class="menu"><button class="btn btn-primary js-resume">Keep Running</button>
        <div class="menu-row"><button class="btn js-howto">How to</button><button class="btn js-settings"><span class="b-ico">${GLYPH.gear}</span><span class="b-txt">Settings</span></button></div>
        ${soundBtn()}<button class="btn btn-ghost js-quit">Give Up</button></div></div></div>`;
    el.querySelector(".js-resume").addEventListener("click", () => { sfx("uiClick"); H.onResume(); });
    const quit = el.querySelector(".js-quit"); let armed = 0;
    quit.addEventListener("click", () => {
      if (Date.now() - armed < 3000) { sfx("uiBack"); H.onQuit(); return; }
      armed = Date.now(); quit.textContent = "Truly? They'll keep you."; quit.classList.add("armed");
      setTimeout(() => { quit.textContent = "Give Up"; quit.classList.remove("armed"); }, 3000);
    });
    return el;
  }

  /* ---- end screens: a run summary on a torn ticket -------------------------------------- */
  function summaryHtml(run, won) {
    const used = stat(run).used, key = run.path.join(">"), best = records.best[key];
    const isBest = won && best != null && Math.abs(best - run.time) < 0.001 && recordsNew.has(run);
    const weapons = Object.entries(used).sort((a, b) => b[1] - a[1]);
    return `<div class="summary">
      <div class="sum-route" aria-label="Route taken">${run.path.map((id) => `<span>${esc(levelName(id))}</span>`).join('<i aria-hidden="true">&rarr;</i>')}${won ? '<i aria-hidden="true">&rarr;</i><span class="home">Home</span>' : ""}</div>
      <dl class="stats">
        <div><dt>Time</dt><dd>${fmtTime(run.time)}${isBest ? '<em class="stamp">New best</em>' : ""}</dd></div>
        ${won && best != null && !isBest ? `<div><dt>Route best</dt><dd>${fmtTime(best)}</dd></div>` : ""}
        <div><dt>Repelled</dt><dd>${run.repelled}</dd></div>
        <div><dt>Wounds</dt><dd>${run.hurtCount}</dd></div>
        <div class="wpn"><dt>Weapons used</dt><dd class="sum-wpns">${weapons.length ? "" : "<span class='bare'>bare hands</span>"}</dd></div>
      </dl></div>`;
  }
  const recordsNew = new WeakSet();
  function fillWeapons(el, run) {
    const box = el.querySelector(".sum-wpns"); if (!box) return;
    Object.entries(stat(run).used).sort((a, b) => b[1] - a[1]).forEach(([id, n]) => { const w = h("span", "sw"); w.title = nameOf(id); w.setAttribute("aria-label", `${nameOf(id)} ×${n}`); w.appendChild(icon(id, 26)); w.appendChild(h("b", "", "×" + n)); box.appendChild(w); });
  }
  function lostScreen(data) {
    const run = data.run;
    if (run && !recorded.has(run)) { recorded.add(run); records.deaths = (records.deaths || 0) + 1; saveRecords(); }
    const el = h("section", "screen screen-lost");
    el.innerHTML = `<div class="end-text"><h2 class="drip">You Stay</h2><p class="cause">${esc(TEXT.caught[data.by] || TEXT.caught.default)}</p><p class="coda">${esc(TEXT.caughtCoda)}</p>
      ${run ? summaryHtml(run, false) : ""}<p class="tally">${takenLine()}</p>
      <div class="menu"><button class="btn btn-primary js-retry">Try to Leave Again</button><button class="btn btn-ghost js-title">Back to the Gate</button></div></div>`;
    if (run) fillWeapons(el, run);
    el.querySelector(".js-retry").addEventListener("click", () => { sfx("uiClick"); H.onRetry(); });
    el.querySelector(".js-title").addEventListener("click", () => { sfx("uiBack"); H.onQuit(); });
    return el;
  }
  function wonScreen(data) {
    const run = data.run;
    if (run && !recorded.has(run)) {
      recorded.add(run); records.wins = (records.wins || 0) + 1;
      const key = run.path.join(">");
      if (records.best[key] == null || run.time < records.best[key]) { records.best[key] = run.time; recordsNew.add(run); }
      saveRecords();
    }
    const el = h("section", "screen screen-won");
    el.innerHTML = `<div class="end-text"><h2>You Got Out</h2><p class="cause">${esc(TEXT.won)}</p><p class="coda">${esc(TEXT.wonCoda)}</p>
      ${run ? summaryHtml(run, true) : ""}
      <div class="menu"><button class="btn btn-primary js-retry">Go Back In</button><button class="btn btn-ghost js-title">Title</button></div></div>`;
    if (run) fillWeapons(el, run);
    el.querySelector(".js-retry").addEventListener("click", () => { sfx("uiClick"); H.onRetry(); });
    el.querySelector(".js-title").addEventListener("click", () => { sfx("uiBack"); H.onQuit(); });
    return el;
  }

  const SCREENS = { title: titleScreen, howto: howtoScreen, settings: settingsScreen, route: routeScreen, intro: introScreen, pause: pauseScreen, lost: lostScreen, won: wonScreen };
  const MENU = new Set(["title", "howto", "settings", "route", "pause", "lost", "won"]);
  addEventListener("resize", () => { if (screen === "route" && curEl && curEl._redraw) curEl._redraw(); });

  /* ---------------------------------------------------------------- toasts: queued, merged, prioritised */
  const MAX_VIS = 2;
  let queue = [], visible = [], lastEvType = "", lastEvFrame = -1;
  function pushToast(msg, pri = 1, kind = "info") {
    const now = performance.now();
    const v = visible.find((t) => t.msg === msg && !t.leaving);
    if (v) { v.count++; v.until = Math.max(v.until, now + 1600); v.badge.textContent = "×" + v.count; v.el.classList.remove("bump"); void v.el.offsetWidth; v.el.classList.add("bump"); return; }
    const q = queue.find((t) => t.msg === msg);
    if (q) { q.count++; q.pri = Math.max(q.pri, pri); return; }
    queue.push({ msg, pri, kind, count: 1, at: now });
    // an urgent message never waits behind chatter: retire the oldest calm one
    if (pri >= 2 && visible.filter((t) => !t.leaving).length >= MAX_VIS) {
      const calm = visible.filter((t) => !t.leaving && t.pri < 2).sort((a, b) => a.shown - b.shown)[0];
      if (calm) calm.until = 0;
    }
    if (queue.length > 6) { queue.sort((a, b) => a.pri - b.pri || a.at - b.at); queue.shift(); }
  }
  function tickToasts(now) {
    for (const t of visible) if (!t.leaving && now > t.until) {
      t.leaving = true; t.el.classList.add("fade"); setTimeout(() => { t.el.remove(); visible = visible.filter((x) => x !== t); }, 380);
    }
    queue = queue.filter((t) => t.pri >= 2 || now - t.at < 4500); // stale chatter is dropped
    while (queue.length && visible.filter((t) => !t.leaving).length < MAX_VIS) {
      queue.sort((a, b) => b.pri - a.pri || a.at - b.at);
      const t = queue.shift();
      t.el = h("div", `toast t-${t.kind}${t.pri >= 2 ? " urgent" : ""}`, `<span class="t-msg">${esc(t.msg)}</span><b class="t-count">${t.count > 1 ? "×" + t.count : ""}</b>`);
      t.badge = t.el.querySelector(".t-count");
      t.shown = now; t.until = now + 1900 + Math.min(2200, t.msg.length * 38) + (t.pri >= 2 ? 700 : 0);
      toastsEl.prepend(t.el); visible.push(t);
    }
  }
  const showWarn = (label, secs) => {
    const w = h("div", "warn", `<span class="w-ico">!</span>${esc(label)}`); warns.appendChild(w);
    setTimeout(() => { w.classList.add("fade"); setTimeout(() => w.remove(), 300); }, Math.max(500, secs * 1000));
    while (warns.children.length > 2) warns.firstChild.remove();
  };

  /* ---------------------------------------------------------------- keyboard + gamepad menu navigation */
  const FOCUSABLE = "button:not([disabled]):not([tabindex='-1']), input:not([disabled]), [role=tab][aria-selected=true]";
  const visibleEls = () => curEl ? [...curEl.querySelectorAll(FOCUSABLE)].filter((e) => e.offsetParent !== null || e.getClientRects().length) : [];
  function navMove(dx, dy) {
    const items = visibleEls(); if (!items.length) return;
    const cur = document.activeElement;
    if (!items.includes(cur)) { (curEl.querySelector(".btn-primary, .choice") || items[0]).focus(); return; }
    const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let best = null, bs = Infinity;
    for (const e of items) {
      if (e === cur) continue;
      const rr = e.getBoundingClientRect(), vx = rr.left + rr.width / 2 - cx, vy = rr.top + rr.height / 2 - cy;
      const along = vx * dx + vy * dy; if (along <= 4) continue;
      const ortho = Math.abs(vx * dy - vy * dx), s = along + ortho * 2.2;
      if (s < bs) { bs = s; best = e; }
    }
    // tabs: left/right always cycle through tab buttons
    if (cur.getAttribute("role") === "tab" && dx) {
      const tabs = [...curEl.querySelectorAll("[role=tab]")], i = tabs.indexOf(cur);
      best = tabs[(i + dx + tabs.length) % tabs.length];
    }
    if (best) { best.focus(); best.scrollIntoView({ block: "nearest", inline: "nearest" }); sfx("uiMove"); }
  }
  const goBack = () => {
    const b = curEl && (curEl.querySelector(".js-back") || (screen === "pause" && curEl.querySelector(".js-resume")));
    if (b) { b.click(); return true; } return false;
  };
  document.addEventListener("keydown", (ev) => {
    if (!MENU.has(screen) || !curEl) return;
    const a = document.activeElement;
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[ev.code]) {
      if (a && a.type === "range" && ev.code.match(/Left|Right/)) return; // let the slider slide
      ev.preventDefault(); navMove(...dirs[ev.code]);
    } else if ((ev.code === "Escape" || ev.code === "Backspace") && (screen === "howto" || screen === "settings")) {
      ev.preventDefault(); ev.stopPropagation(); // don't let the game also read Esc as "unpause"
      goBack();
    }
  }, true);

  let pads = false, padPrev = {}, padRepeat = 0, padAxisWas = false, padHeld = false;
  addEventListener("gamepadconnected", () => { pads = true; root.classList.add("has-pad"); if (screen === null) pushToast("Controller found. It's shaking too.", 1); });
  addEventListener("gamepaddisconnected", () => { pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].some(Boolean); });
  function pollPad(dt) {
    if (!pads || !navigator.getGamepads) return;
    const gp = [...navigator.getGamepads()].find(Boolean); if (!gp) return;
    const btn = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const edge = (i) => { const now = btn(i), was = padPrev[i]; padPrev[i] = now; return now && !was; };
    const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    const dl = btn(14), dr = btn(15), du = btn(12), dd = btn(13);
    const start = edge(9), a = edge(0), b = edge(1), x = edge(2), y = edge(3), lb = edge(4), rb = edge(5), sel = edge(8);
    if (start) input.press("pause");
    if (sel) input.press("mute");
    if (screen === null) { // playing
      let vx = ax, vy = ay; if (Math.hypot(vx, vy) < 0.22) vx = vy = 0;
      vx += (dr ? 1 : 0) - (dl ? 1 : 0); vy += (dd ? 1 : 0) - (du ? 1 : 0);
      const active = vx || vy;
      if (active) { input.virt.x = Math.max(-1, Math.min(1, vx)); input.virt.y = Math.max(-1, Math.min(1, vy)); padAxisWas = true; }
      else if (padAxisWas && stickId === null) { input.virt.x = input.virt.y = 0; padAxisWas = false; }
      if (a || x) input.press("attack");
      const holding = btn(0) || btn(2); if (holding !== padHeld) { input.held.attack = holding; padHeld = holding; }
      if (b || btn(7) && edge(7)) input.press("dash");
      if (rb || y) input.press("next"); if (lb) input.press("prev");
      return;
    }
    if (padAxisWas) { input.virt.x = input.virt.y = 0; padAxisWas = false; }
    if (!MENU.has(screen)) return;
    let mx = dr || ax > 0.6 ? 1 : dl || ax < -0.6 ? -1 : 0, my = dd || ay > 0.6 ? 1 : du || ay < -0.6 ? -1 : 0;
    const act = document.activeElement;
    if (mx || my) {
      padRepeat -= dt;
      if (padRepeat <= 0) {
        if (act && act.type === "range" && mx) { act.value = +act.value + mx * 5; act.dispatchEvent(new Event("input")); }
        else navMove(mx, my);
        padRepeat = padRepeat < -1 ? 0.38 : 0.16;
      }
    } else padRepeat = -2;
    if (a && act && curEl && curEl.contains(act) && act.click) act.click();
    else if (a && curEl) { const p = curEl.querySelector(".btn-primary, .choice"); p && p.focus(); }
    if (b) goBack();
    if ((lb || rb) && screen === "howto") { const t = curEl.querySelector("[role=tab][aria-selected=true]"); if (t) { t.focus(); navMove(rb ? 1 : -1, 0); } }
  }

  // one cheap loop for toasts + gamepad, independent of game state
  let loopT = performance.now();
  const loop = (ts) => { const dt = Math.min(0.1, (ts - loopT) / 1000); loopT = ts; tickToasts(ts); pollPad(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  /* ---------------------------------------------------------------- hud state */
  let last = {}, chipEls = new Map(), chipMax = {}, lastHurtFx = 0;
  const set = (k, v, fn) => { if (last[k] !== v) { const prev = last[k]; last[k] = v; fn(v, prev); } };
  const DREAD_WORDS = ["Calm", "Uneasy", "Watched", "Hunted", "They're close", "RUN"];

  const ui = {
    get screen() { return screen; },
    show(name, data) {
      screen = name; screenData = data || null;
      const old = [...layer.children];
      old.forEach((c) => { c.classList.add("leaving"); c.setAttribute("aria-hidden", "true"); setTimeout(() => c.remove(), 260); });
      const playing = name === null;
      hud.hidden = !(playing || name === "pause");
      touch.hidden = !(playing && isTouch);
      if (!playing) { stickId = null; restStick(); }
      root.classList.toggle("in-menu", !playing && name !== "intro");
      root.classList.toggle("in-pause", name === "pause");
      root.dataset.screen = name || "play";
      curEl = null;
      if (!name) return;
      const el = SCREENS[name](data || {});
      bindCommon(el, data);
      layer.appendChild(el); curEl = el;
      const focus = name === "howto" ? el.querySelector("[role=tab][aria-selected=true]") : el.querySelector(".btn-primary, .choice, .btn");
      if (focus && name !== "intro") setTimeout(() => { if (el.isConnected) focus.focus({ preventScroll: true }); }, 40);
    },
    setSound(on) {
      soundOn = on;
      root.querySelectorAll(".js-sound").forEach((b) => { b.setAttribute("aria-pressed", on); const t = b.querySelector(".b-txt"), i = b.querySelector(".b-ico"); if (t) t.textContent = soundLabel(); if (i) i.innerHTML = on ? GLYPH.speakerOn : GLYPH.speakerOff; });
      const hb = $(".btn-sound"); hb.innerHTML = on ? GLYPH.speakerOn : GLYPH.speakerOff; hb.setAttribute("aria-pressed", on); hb.setAttribute("aria-label", on ? "Sound on" : "Sound off");
    },
    curtain(midway) {
      return new Promise((resolve) => {
        const reduced = isReduced();
        curtainEl.classList.toggle("instant", reduced);
        curtainEl.classList.add("closed");
        setTimeout(() => { midway && midway(); setTimeout(() => { curtainEl.classList.remove("closed"); resolve(); }, reduced ? 120 : 260); }, reduced ? 160 : 600);
      });
    },
    toast(msg) { pushToast(msg, 1); },
    onEvent(ev) {
      const t = ev.type;
      if (t === "toast") {
        const recent = lastEvFrame === frameNo;
        const pri = recent && DANGER.has(lastEvType) || /finale|barker|gate/i.test(lastEvType) && recent ? 2 : 1;
        const kind = pri >= 2 ? "danger" : recent && GOOD.has(lastEvType) ? "good" : "info";
        pushToast(ev.msg, pri, kind);
        return;
      }
      lastEvType = t; lastEvFrame = frameNo;
      if (t === "hurt") {
        if (settings.shake && !isReduced()) { hud.classList.remove("hurt"); void hud.offsetWidth; hud.classList.add("hurt"); }
        const now = performance.now();
        if (now - lastHurtFx > 450 && settings.flash > 0) { lastHurtFx = now; hud.style.setProperty("--flash", settings.flash); const v = $(".hurt-vig"); v.classList.remove("on"); void v.offsetWidth; v.classList.add("on"); }
      }
      if (t === "swing") noteUse(ev.weapon || heldId());
      if (t === "throw" || t === "burst") noteUse(ev.weapon || heldId());
      if (t === "break") { last.slots = null; }
      if (t === "pickup" || t === "select") last.slots = null;
      if (WARN[t]) showWarn(WARN[t][0], ev.dur || WARN[t][1]);
      if (t === "gateOpen") pushToast("The gate is open. RUN.", 3, "good");
      if (t === "barkerCall") pushToast("STEP RIGHT UP!", 2, "danger");
    },
    resetHud() {
      last = {}; queue = []; visible.forEach((t) => t.el.remove()); visible = []; warns.innerHTML = "";
      chipEls.forEach((c) => c.remove()); chipEls = new Map(); chipMax = {};
    },
    hud(game) {
      lastGame = game; frameNo++;
      const run = game.run, p = game.player;
      // health: a strip of admission tickets, torn off as you're hurt
      set("hp", Math.max(0, Math.ceil(run.health)), (v, prev) => {
        const per = PLAYER.maxHealth / TICKETS;
        tks.forEach((tk, i) => {
          const f = Math.max(0, Math.min(1, (v - i * per) / per));
          tk.style.setProperty("--f", f.toFixed(2));
          const was = tk.classList.contains("gone"), gone = f <= 0;
          tk.classList.toggle("gone", gone); tk.classList.toggle("part", f > 0 && f < 1);
          if (gone && !was && prev != null) { tk.classList.remove("tear"); void tk.offsetWidth; tk.classList.add("tear"); }
        });
        hpNum.textContent = v; tickets.setAttribute("aria-valuenow", v); tickets.classList.toggle("low", v <= 30);
      });
      // sanity: a glass tube that cracks
      set("san", Math.max(0, Math.ceil(run.sanity)), (v) => {
        const f = v / PLAYER.maxSanity;
        sanityEl.style.setProperty("--v", f.toFixed(3)); sanNum.textContent = v; sanityEl.setAttribute("aria-valuenow", v);
        sanityEl.dataset.crack = f < 0.25 ? 3 : f < 0.5 ? 2 : f < 0.75 ? 1 : 0;
        sanityEl.classList.toggle("low", v <= 35);
      });
      set("zone", game.level.name, (v) => { zoneName.textContent = v; });
      set("time", Math.floor(run.time || 0), (v) => { runTime.textContent = fmtTime(v); });
      // statuses: every key in game.status with time left, plus silence
      const st = game.status || {}, live = [];
      if (game.silence) live.push(["silence", 0]);
      for (const k in st) if (st[k] > 0) live.push([k, st[k]]);
      set("chips", live.map((c) => c[0]).join(), () => {
        const keep = new Set(live.map((c) => c[0]));
        chipEls.forEach((el, k) => { if (!keep.has(k)) { el.remove(); chipEls.delete(k); delete chipMax[k]; } });
        for (const [k] of live) if (!chipEls.has(k)) {
          const def = k === "silence" ? { label: "Silence", hint: "They all hear you", glyph: "hush" } : STATUS[k] || { label: titleCase(k), glyph: "dot" };
          const el = h("span", `chip chip-${k.replace(/[^\w-]/g, "")}`, `<span class="chip-ico">${GLYPH[def.glyph] || GLYPH.dot}</span><span class="chip-txt">${esc(def.label)}</span><i class="chip-t"></i>`);
          if (def.hint) el.title = def.hint;
          chips.appendChild(el); chipEls.set(k, el);
        }
      });
      for (const [k, secs] of live) {
        if (!secs) continue;
        if (!chipMax[k] || secs > chipMax[k] + 0.05) chipMax[k] = secs;
        const el = chipEls.get(k); if (el) { const pct = Math.round((secs / chipMax[k]) * 40) / 40; if (el._p !== pct) { el._p = pct; el.style.setProperty("--p", pct); } }
      }
      set("marked", st.marked > 0, (v) => hud.classList.toggle("is-marked", v));
      // finale objective
      const fin = game.finale;
      set("fin", fin ? `${fin.thrown}|${fin.total}|${fin.open ? 1 : 0}|${fin.working == null ? "-" : Math.round(fin.working * 25)}` : "", (v) => {
        finEl.hidden = !fin; hud.classList.toggle("in-finale", !!fin); compass.classList.toggle("locked", !!fin && !fin.open);
        if (!fin) return;
        const total = Math.max(0, fin.total | 0), thrown = Math.min(total, fin.thrown | 0);
        finEl.classList.toggle("open", !!fin.open);
        finPips.innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < thrown ? "on" : ""}"></i>`).join("");
        finText.textContent = fin.open ? "GATE OPEN — RUN" : `Breakers ${thrown}/${total}`;
        const working = fin.working != null && !fin.open;
        finWork.hidden = !working; if (working) finWork.style.setProperty("--w", Math.max(0, Math.min(1, fin.working)));
      });
      if (game.exitPos) {
        const dx = game.exitPos.x - p.x, dy = game.exitPos.y - p.y;
        const ang = Math.round((Math.atan2(dy, dx) * 180) / Math.PI / 5) * 5;
        set("ang", ang, (v) => { arrow.style.transform = `rotate(${v}deg)`; });
        const locked = fin && !fin.open;
        set("dist", Math.round(Math.hypot(dx, dy) / 32) + (locked ? "L" : ""), () => { const n = Math.round(Math.hypot(dx, dy) / 32); dist.textContent = locked ? `${n} paces · gate locked` : `${n} paces to exit`; });
      }
      // dread: a heart that beats faster, a gauge, and a word
      const d = Math.max(0, Math.min(1, game.dread || 0));
      set("dread", Math.round(d * 20), (v) => {
        const dd = v / 20;
        dreadBox.style.setProperty("--d", dd); dreadBox.style.setProperty("--beat", (60 / (58 + dd * 92)).toFixed(3) + "s");
        dreadBox.setAttribute("aria-valuenow", Math.round(dd * 100));
        const word = DREAD_WORDS[Math.min(5, Math.floor(dd * 5.2))];
        if (dreadWord.textContent !== word) dreadWord.textContent = word;
        dreadBox.classList.toggle("hot", dd >= 0.7);
      });
      set("slots", run.inventory.map((s) => s.id + s.uses).join() + "|" + run.sel, () => renderSlots(run));
      set("dash", p.dashCd <= 0, (v) => dashPip.classList.toggle("ready", v));
    },
  };

  /* the held weapon sits in a little prize booth; the other pockets beside it */
  function renderSlots(run) {
    slotsEl.innerHTML = "";
    for (let i = 0; i < PLAYER.slots; i++) {
      const s = run.inventory[i], sel = s && i === run.sel;
      const b = h("button", "slot" + (sel ? " sel" : "") + (s ? "" : " empty"));
      b.setAttribute("aria-label", s ? `${nameOf(s.id)}, ${s.uses} uses${sel ? ", held" : ""}` : "Empty pocket");
      if (sel) b.appendChild(h("span", "awning", "")).setAttribute("aria-hidden", "true");
      b.appendChild(h("span", "slot-key", String(i + 1)));
      if (s) {
        const w = WEAPONS[s.id] || { name: nameOf(s.id), uses: s.uses };
        b.appendChild(icon(s.id, sel ? 46 : 32));
        b.appendChild(h("span", "slot-name", esc(w.short || w.name)));
        const max = Math.max(w.uses || 1, s.uses), pct = s.uses / max;
        const dur = h("span", "dur"); dur.style.setProperty("--v", pct); if (w.color) dur.style.setProperty("--c", w.color);
        b.appendChild(dur); b.appendChild(h("span", "uses", "×" + s.uses));
        if (s.uses <= 2) b.classList.add("fragile");
      } else b.appendChild(h("span", "slot-name", "empty"));
      b.addEventListener("click", () => { if (s) input.press("slot" + i); });
      slotsEl.appendChild(b);
    }
  }

  return ui;
}
