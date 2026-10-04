/* ui.js — every DOM element over the canvas: HUD, menus, route map, touch
 * controls, toasts, curtain transitions. Styles live in ui.css.
 *
 * Owned by the UI agent. Talks to the game only through:
 *   createUI(root, handlers) -> ui
 *   handlers: onStart, onChoose(levelId), onResume, onPause, onQuit, onRetry, onSound
 *   ui.show(screen, data)   screens: "title" "howto" "route" "intro" "pause" "lost" "won" or null
 *   ui.hud(game)            every frame while playing (cheap; diffed)
 *   ui.onEvent(ev)          engine events (toasts, damage pulses)
 *   ui.curtain(midway)      close curtains, run midway(), open; returns a Promise
 *   ui.setSound(on)         reflect the sound toggle
 * Touch controls write into engine `input` (passed in handlers.input).
 */
import { WEAPONS, ENEMIES, OBSTACLES, ITEMS, ROUTE, LEVELS, TEXT, PLAYER } from "./content.js";
import { paintIcon } from "./art.js";
import { summarizeLevel } from "./engine.js";

const h = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icon = (id, size = 32, cls = "ico") => { const c = h("canvas", cls); c.style.width = c.style.height = size + "px"; paintIcon(c, id, size); c.setAttribute("aria-hidden", "true"); return c; };

const HAZARD_NAMES = { mirror: "Funhouse mirrors", silence: "Silence", water: "Deep water", ...Object.fromEntries(Object.entries(OBSTACLES).map(([k, v]) => [k, v.name])) };

export function createUI(root, H) {
  root.innerHTML = "";
  const input = H.input;
  let screen = null, soundOn = false;

  /* ---------------------------------------------------------------- HUD */
  const hud = h("div", "hud"); hud.hidden = true;
  hud.innerHTML = `
    <div class="hud-top">
      <div class="hud-vitals">
        <div class="bar bar-health" role="meter" aria-label="Health" aria-valuemin="0" aria-valuemax="100"><span class="bar-label">Health</span><i></i><b></b></div>
        <div class="bar bar-sanity" role="meter" aria-label="Sanity" aria-valuemin="0" aria-valuemax="100"><span class="bar-label">Sanity</span><i></i><b></b></div>
        <div class="chips" aria-live="polite"></div>
      </div>
      <div class="hud-objective">
        <div class="zone-name"></div>
        <div class="compass"><span class="arrow" aria-hidden="true">&#10148;</span><span class="dist"></span></div>
      </div>
      <div class="hud-dread" aria-label="Dread">
        <div class="dread-label">Dread</div>
        <div class="dread-faces">${"<span></span>".repeat(5)}</div>
      </div>
      <button class="hud-btn btn-pause" aria-label="Pause">II</button>
    </div>
    <div class="hud-bottom">
      <div class="slots"></div>
      <div class="dash-pip" title="Dash">Dash</div>
    </div>
    <div class="toasts" aria-live="polite"></div>`;
  root.appendChild(hud);
  const $ = (s) => hud.querySelector(s);
  const healthBar = $(".bar-health"), sanityBar = $(".bar-sanity"), chips = $(".chips"), zoneName = $(".zone-name");
  const arrow = $(".arrow"), dist = $(".dist"), faces = [...hud.querySelectorAll(".dread-faces span")], dreadBox = $(".hud-dread");
  const slotsEl = $(".slots"), dashPip = $(".dash-pip"), toasts = $(".toasts");
  $(".btn-pause").addEventListener("click", () => H.onPause());

  /* ---------------------------------------------------------------- touch */
  const touch = h("div", "touch"); touch.hidden = true;
  touch.innerHTML = `<div class="stick" aria-hidden="true"><div class="knob"></div></div>
    <div class="tbtns"><button class="tbtn t-swap" aria-label="Swap weapon">&#8635;</button><button class="tbtn t-dash" aria-label="Dash">Dash</button><button class="tbtn t-atk" aria-label="Attack">Strike</button></div>`;
  root.appendChild(touch);
  const stick = touch.querySelector(".stick"), knob = touch.querySelector(".knob");
  let stickId = null, sc = { x: 0, y: 0 };
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  stick.addEventListener("pointerdown", (e) => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); const r = stick.getBoundingClientRect(); sc = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; moveStick(e); });
  const moveStick = (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - sc.x, dy = e.clientY - sc.y; const m = Math.hypot(dx, dy), R = 44;
    if (m > R) { dx = (dx / m) * R; dy = (dy / m) * R; }
    setKnob(dx, dy); input.virt.x = dx / R; input.virt.y = dy / R;
    if (Math.hypot(input.virt.x, input.virt.y) < 0.18) input.virt.x = input.virt.y = 0;
  };
  stick.addEventListener("pointermove", moveStick);
  const endStick = (e) => { if (e.pointerId !== stickId) return; stickId = null; setKnob(0, 0); input.virt.x = input.virt.y = 0; };
  stick.addEventListener("pointerup", endStick); stick.addEventListener("pointercancel", endStick);
  const tb = (sel, down, up) => { const b = touch.querySelector(sel); b.addEventListener("pointerdown", (e) => { e.preventDefault(); down(); b.classList.add("on"); }); const off = () => { b.classList.remove("on"); up && up(); }; b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off); };
  tb(".t-atk", () => { input.press("attack"); input.held.attack = true; }, () => { input.held.attack = false; });
  tb(".t-dash", () => input.press("dash"));
  tb(".t-swap", () => input.press("next"));
  let isTouch = matchMedia("(pointer: coarse)").matches;
  window.addEventListener("touchstart", () => { if (!isTouch) { isTouch = true; if (screen === null) touch.hidden = false; } }, { passive: true });

  /* ---------------------------------------------------------------- screens */
  const layer = h("div", "screens"); root.appendChild(layer);
  const curtainEl = h("div", "curtain", `<div class="c-left"></div><div class="c-right"></div><div class="c-valance"></div>`); root.appendChild(curtainEl);

  const soundBtn = () => `<button class="btn btn-ghost js-sound" aria-pressed="${soundOn}">${soundOn ? "Sound: on" : "Sound: off"}</button>`;
  const bindCommon = (el) => {
    el.querySelectorAll(".js-sound").forEach((b) => b.addEventListener("click", () => { H.onSound(); }));
    el.querySelectorAll(".js-howto").forEach((b) => b.addEventListener("click", () => ui.show("howto", { back: screen })));
  };

  function titleScreen() {
    const el = h("section", "screen screen-title");
    el.innerHTML = `
      <div class="marquee">
        <div class="marquee-bulbs" aria-hidden="true">${"<i></i>".repeat(28)}</div>
        <p class="kicker">The Wellsee Carnival presents</p>
        <h1 class="title"><span class="t1">Escape</span> <span class="t2">the</span> <span class="t3">Midway</span></h1>
        <p class="sub">${esc(TEXT.subtitle)}</p>
      </div>
      <div class="menu">
        <button class="btn btn-primary js-start">Run for the Gate</button>
        <button class="btn js-howto">How to Survive</button>
        ${soundBtn()}
      </div>
      <p class="whisper">Don't call them clowns. Clowns choose it.</p>`;
    el.querySelector(".js-start").addEventListener("click", () => H.onStart());
    return el;
  }

  function howtoScreen(data) {
    const el = h("section", "screen screen-howto");
    const weapons = Object.entries(WEAPONS).map(([id, w]) => `<li data-ico="${id}"><b>${esc(w.name)}</b> <em>${w.uses} uses</em><br>${esc(w.desc)}</li>`).join("");
    const foes = Object.entries(ENEMIES).map(([id, e]) => `<li data-ico="${id}"><b>${esc(e.name)}</b><br>${esc(e.lore)}</li>`).join("");
    const hz = ["teacup", "horse", "cookie", "dunk", "searchlight"].filter((k) => OBSTACLES[k]).map((id) => `<li data-ico="${id}"><b>${esc(OBSTACLES[id].name)}</b><br>${esc(OBSTACLES[id].lore || "")}</li>`).join("");
    el.innerHTML = `
      <div class="panel scroll">
        <h2>How to Survive</h2>
        <div class="cols">
          <div>
            <h3>Run</h3>
            <ul class="keys">
              <li><kbd>WASD</kbd>/<kbd>Arrows</kbd> move</li>
              <li><kbd>Space</kbd>/<kbd>J</kbd> strike with held weapon</li>
              <li><kbd>Shift</kbd>/<kbd>K</kbd> dash (slip past grasping hands)</li>
              <li><kbd>Q</kbd>/<kbd>E</kbd> or <kbd>1</kbd>-<kbd>3</kbd> change weapon</li>
              <li><kbd>Esc</kbd>/<kbd>P</kbd> pause &nbsp; <kbd>M</kbd> sound</li>
              <li>On a phone: left thumb moves, right thumb strikes.</li>
            </ul>
            <h3>Choose your way</h3>
            <p>Between zones you pick the next stretch of carnival. Short routes are watched. Long routes have more to carry, but every minute you linger, another tent flap opens.</p>
            <p>The <b>Unwilling</b> were people once: the ones who stayed home when the light came. They cannot be killed. Strike them and they reel; then run. <b>Health</b> runs out when they catch you. <b>Sanity</b> drains near them, in the silence, and under the light. Lose either and you stay. Forever. Smiling.</p>
            <p>Follow the green arrow to the exit. Watch the <b>Dread</b> faces: they light up as the Unwilling close in.</p>
          </div>
          <div>
            <h3>Carry</h3><ul class="lore">${weapons}</ul>
          </div>
          <div>
            <h3>The Unwilling</h3><ul class="lore">${foes}</ul>
            <h3>The Attractions</h3><ul class="lore">${hz}<li data-ico="mirror"><b>Funhouse Mirror</b><br>Touch one and your left becomes your right.</li><li><b>Silence</b><br>Grey ground where the bugs are dead. In silence, every one of the Unwilling hears you.</li></ul>
          </div>
        </div>
        <div class="menu"><button class="btn btn-primary js-back">${data && data.back === "pause" ? "Back" : "Back"}</button></div>
      </div>`;
    el.querySelectorAll("[data-ico]").forEach((li) => { const id = li.dataset.ico; if (id !== "mirror") li.prepend(icon(id, 34)); });
    el.querySelector(".js-back").addEventListener("click", () => ui.show(data && data.back ? data.back : "title", data && data.backData));
    return el;
  }

  function routeScreen(data) {
    const { run } = data; const tier = run.tier;
    const el = h("section", "screen screen-route");
    const legend = `<div class="route-key"><span><i class="k-len"></i>length</span><span><i class="k-thr"></i>threat</span></div>`;
    el.innerHTML = `<div class="panel"><h2>${tier === 0 ? "The Gates Close Behind You" : "Choose Your Way"}</h2>
      <p class="route-hint">${tier === 0 ? "There is only one way in. The exit is on the far side of everything." : "Short and watched, or long and hungry. Every second you spend, the tents send someone new."}</p>
      <div class="route-track"></div>${legend}
      <div class="choices"></div></div>`;
    const track = el.querySelector(".route-track");
    ROUTE.forEach((ids, i) => {
      const col = h("div", "rt-col" + (i < tier ? " done" : i === tier ? " now" : ""));
      ids.forEach((id) => { const n = h("div", "rt-node" + (run.path.includes(id) ? " taken" : ""), esc(LEVELS[id].name)); col.appendChild(n); });
      track.appendChild(col);
      if (i < ROUTE.length - 1) track.appendChild(h("div", "rt-link" + (i < tier ? " done" : ""), ""));
    });
    track.appendChild(h("div", "rt-col gate", `<div class="rt-node">The Gate</div>`));
    const choices = el.querySelector(".choices");
    ROUTE[tier].forEach((id, idx) => {
      const s = summarizeLevel(id);
      const card = h("button", "choice");
      const pips = (n, cls) => Array.from({ length: 5 }, (_, i) => `<i class="${cls}${i < n ? " on" : ""}"></i>`).join("");
      card.innerHTML = `<span class="c-name">${esc(s.name)}</span><span class="c-tag">${esc(s.tag)}</span>
        <span class="c-stats"><span class="c-row"><span>Length</span><span class="pips">${pips(s.length, "len")}</span></span>
        <span class="c-row"><span>Threat</span><span class="pips">${pips(s.threat, "thr")}</span></span></span>
        <span class="c-blurb">${esc(s.blurb)}</span>
        <span class="c-sec">Loot</span><span class="c-icons loot"></span>
        <span class="c-sec">Hazards</span><span class="c-icons haz"></span>
        <span class="c-sec">The Unwilling</span><span class="c-icons foes"></span>
        <span class="c-go">${ROUTE[tier].length > 1 ? "Go this way" : "Enter"}</span>`;
      const add = (sel, id, n, label) => { const w = h("span", "ci"); w.title = label; w.appendChild(icon(id, 26)); if (n > 1) w.appendChild(h("b", "", "×" + n)); card.querySelector(sel).appendChild(w); };
      for (const [k, n] of Object.entries(s.loot)) add(".loot", k, n, (WEAPONS[k] || ITEMS[k]).name);
      for (const [k] of Object.entries(s.hazards)) { if (OBSTACLES[k]) add(".haz", k, 1, HAZARD_NAMES[k]); else card.querySelector(".haz").appendChild(h("span", "ci txt", esc(HAZARD_NAMES[k] || k))); }
      for (const [k, n] of Object.entries(s.foes)) add(".foes", k, n, ENEMIES[k].name);
      if (!Object.keys(s.loot).length) card.querySelector(".loot").appendChild(h("span", "ci txt", "nothing"));
      if (!Object.keys(s.hazards).length) card.querySelector(".haz").appendChild(h("span", "ci txt", "only the animals"));
      card.addEventListener("click", () => H.onChoose(id));
      card.style.animationDelay = idx * 0.12 + "s";
      choices.appendChild(card);
    });
    return el;
  }

  function introScreen(data) {
    const el = h("section", "screen screen-intro");
    el.innerHTML = `<div class="intro-card"><p class="intro-kicker">Zone ${data.index} of ${ROUTE.length}</p><h2>${esc(data.name)}</h2><p class="intro-tag">${esc(data.tag)}</p></div>`;
    return el;
  }

  function pauseScreen() {
    const el = h("section", "screen screen-pause");
    el.innerHTML = `<div class="panel small"><h2>Paused</h2><p class="whisper">They are not paused. They are only being polite.</p>
      <div class="menu"><button class="btn btn-primary js-resume">Keep Running</button><button class="btn js-howto">How to Survive</button>${soundBtn()}<button class="btn btn-ghost js-quit">Give Up</button></div></div>`;
    el.querySelector(".js-resume").addEventListener("click", () => H.onResume());
    el.querySelector(".js-quit").addEventListener("click", () => H.onQuit());
    return el;
  }

  const statsHtml = (run) => `<dl class="stats"><div><dt>Time</dt><dd>${fmtTime(run.time)}</dd></div><div><dt>Unwilling repelled</dt><dd>${run.repelled}</dd></div><div><dt>Zones</dt><dd>${run.path.length}</dd></div><div><dt>Wounds</dt><dd>${run.hurtCount}</dd></div></dl>`;

  function lostScreen(data) {
    const el = h("section", "screen screen-lost");
    el.innerHTML = `<div class="end-text"><h2 class="drip">You Stay</h2><p class="cause">${esc(TEXT.caught[data.by] || TEXT.caught.default)}</p><p class="coda">${esc(TEXT.caughtCoda)}</p>${statsHtml(data.run)}
      <div class="menu"><button class="btn btn-primary js-retry">Try to Leave Again</button><button class="btn btn-ghost js-title">Back to the Gate</button></div></div>`;
    el.querySelector(".js-retry").addEventListener("click", () => H.onRetry());
    el.querySelector(".js-title").addEventListener("click", () => H.onQuit());
    return el;
  }

  function wonScreen(data) {
    const el = h("section", "screen screen-won");
    el.innerHTML = `<div class="end-text"><h2>You Got Out</h2><p class="cause">${esc(TEXT.won)}</p><p class="coda">${esc(TEXT.wonCoda)}</p>${statsHtml(data.run)}
      <div class="menu"><button class="btn btn-primary js-retry">Go Back In</button><button class="btn btn-ghost js-title">Title</button></div></div>`;
    el.querySelector(".js-retry").addEventListener("click", () => H.onRetry());
    el.querySelector(".js-title").addEventListener("click", () => H.onQuit());
    return el;
  }

  const SCREENS = { title: titleScreen, howto: howtoScreen, route: routeScreen, intro: introScreen, pause: pauseScreen, lost: lostScreen, won: wonScreen };

  /* ---------------------------------------------------------------- hud state */
  let last = {};
  const set = (k, v, fn) => { if (last[k] !== v) { last[k] = v; fn(v); } };

  const ui = {
    get screen() { return screen; },
    show(name, data) {
      screen = name;
      const old = [...layer.children];
      old.forEach((c) => { c.classList.add("leaving"); setTimeout(() => c.remove(), 260); });
      const playing = name === null;
      hud.hidden = !(playing || name === "pause");
      touch.hidden = !(playing && isTouch);
      root.classList.toggle("in-menu", !playing);
      if (!name) return;
      const el = SCREENS[name](data || {});
      bindCommon(el);
      layer.appendChild(el);
      const focus = el.querySelector(".btn-primary, .choice, .btn");
      if (focus && name !== "intro") setTimeout(() => focus.focus({ preventScroll: true }), 30);
    },
    setSound(on) {
      soundOn = on;
      root.querySelectorAll(".js-sound").forEach((b) => { b.textContent = on ? "Sound: on" : "Sound: off"; b.setAttribute("aria-pressed", on); });
    },
    curtain(midway) {
      return new Promise((resolve) => {
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        curtainEl.classList.add("closed");
        setTimeout(() => { midway && midway(); setTimeout(() => { curtainEl.classList.remove("closed"); resolve(); }, reduced ? 50 : 220); }, reduced ? 60 : 560);
      });
    },
    toast(msg) {
      if (toasts.firstChild && toasts.firstChild.dataset.msg === msg && !toasts.firstChild.classList.contains("fade")) return;
      const t = h("div", "toast", esc(msg)); t.dataset.msg = msg; toasts.prepend(t);
      while (toasts.children.length > 3) toasts.lastChild.remove();
      setTimeout(() => t.classList.add("fade"), 2600); setTimeout(() => t.remove(), 3300);
    },
    onEvent(ev) {
      if (ev.type === "toast") ui.toast(ev.msg);
      if (ev.type === "hurt") { hud.classList.remove("hurt"); void hud.offsetWidth; hud.classList.add("hurt"); }
      if (ev.type === "pickup" || ev.type === "break" || ev.type === "select") last.slots = null;
    },
    resetHud() { last = {}; toasts.innerHTML = ""; },
    hud(game) {
      const run = game.run, p = game.player;
      set("hp", Math.ceil(run.health), (v) => { healthBar.style.setProperty("--v", v / PLAYER.maxHealth); healthBar.querySelector("b").textContent = v; healthBar.setAttribute("aria-valuenow", v); healthBar.classList.toggle("low", v <= 30); });
      set("san", Math.ceil(run.sanity), (v) => { sanityBar.style.setProperty("--v", v / PLAYER.maxSanity); sanityBar.querySelector("b").textContent = v; sanityBar.setAttribute("aria-valuenow", v); sanityBar.classList.toggle("low", v <= 35); });
      set("zone", game.level.name, (v) => { zoneName.textContent = v; });
      const st = game.status, chipList = [];
      if (game.silence) chipList.push(["silence", "Silence"]);
      if (st.marked > 0) chipList.push(["marked", "Seen"]);
      if (st.reversed > 0) chipList.push(["reversed", "Reversed"]);
      if (st.stuck > 0) chipList.push(["stuck", "Held"]);
      set("chips", chipList.map((c) => c[0]).join(), () => { chips.innerHTML = chipList.map(([k, l]) => `<span class="chip chip-${k}">${l}</span>`).join(""); });
      if (game.exitPos) {
        const dx = game.exitPos.x - p.x, dy = game.exitPos.y - p.y;
        const ang = Math.round((Math.atan2(dy, dx) * 180) / Math.PI / 5) * 5;
        set("ang", ang, (v) => { arrow.style.transform = `rotate(${v}deg)`; });
        set("dist", Math.round(Math.hypot(dx, dy) / 32), (v) => { dist.textContent = v + " paces to exit"; });
      }
      const lit = Math.round(game.dread * 5 + 0.15);
      set("dread", lit, (v) => { faces.forEach((f, i) => f.classList.toggle("on", i < v)); dreadBox.classList.toggle("hot", v >= 4); });
      set("slots", run.inventory.map((s) => s.id + s.uses).join() + "|" + run.sel, () => renderSlots(run));
      set("dash", p.dashCd <= 0, (v) => dashPip.classList.toggle("ready", v));
    },
  };

  function renderSlots(run) {
    slotsEl.innerHTML = "";
    for (let i = 0; i < PLAYER.slots; i++) {
      const s = run.inventory[i];
      const b = h("button", "slot" + (s && i === run.sel ? " sel" : "") + (s ? "" : " empty"));
      b.setAttribute("aria-label", s ? `${WEAPONS[s.id].name}, ${s.uses} uses${i === run.sel ? ", held" : ""}` : "Empty slot");
      b.appendChild(h("span", "slot-key", String(i + 1)));
      if (s) {
        const w = WEAPONS[s.id];
        b.appendChild(icon(s.id, 34));
        b.appendChild(h("span", "slot-name", esc(w.short || w.name)));
        const max = Math.max(w.uses, s.uses), pct = s.uses / max;
        const dur = h("span", "dur"); dur.style.setProperty("--v", pct); dur.style.setProperty("--c", w.color);
        b.appendChild(dur); b.appendChild(h("span", "uses", "×" + s.uses));
        if (s.uses <= 2) b.classList.add("fragile");
        b.addEventListener("click", () => { input.press("slot" + i); });
      } else b.appendChild(h("span", "slot-name", "empty"));
      slotsEl.appendChild(b);
    }
  }

  return ui;
}

function fmtTime(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; }
