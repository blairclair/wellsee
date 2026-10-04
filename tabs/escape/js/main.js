/* main.js — boot, main loop and the state machine.
 *
 *   title -> route -> intro -> playing <-> paused
 *                ^                 |-> (exit)  -> route ... -> won
 *                |                 '-> (caught) -> lost
 *                '------------------- retry ---------'
 *
 * Owns the canvas sizing (devicePixelRatio-aware), the run lifecycle and the
 * event fan-out: each frame, game.events -> art.onEvent / audio.onEvent / ui.onEvent.
 */
import { ROUTE, LEVELS, PLAYER } from "./content.js";
import { input, newRun, loadLevel, update, updateCamera } from "./engine.js";
import * as art from "./art.js";
import { audio } from "./audio.js";
import { createUI } from "./ui.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const stage = document.getElementById("stage");
const reducedMQ = matchMedia("(prefers-reduced-motion: reduce)");

const S = {
  state: "title", run: null, game: null, cam: { x: null, y: null, zoom: 1 },
  t: 0, stateT: 0, W: 0, H: 0, dpr: 1, busy: false,
};
window.__escape = S; // handy for debugging and automated play-tests

/* ---------------------------------------------------------------- sizing */
function resize() {
  const r = stage.getBoundingClientRect();
  S.W = Math.max(1, Math.floor(r.width)); S.H = Math.max(1, Math.floor(r.height));
  // devicePixelRatio-aware, but cap the backing store (~2.6 MP) so big HiDPI screens keep 60fps
  S.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1, Math.sqrt(2.6e6 / (S.W * S.H))));
  canvas.width = Math.floor(S.W * S.dpr); canvas.height = Math.floor(S.H * S.dpr);
  canvas.style.width = S.W + "px"; canvas.style.height = S.H + "px";
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------------------------------------------------------- ui */
const ui = createUI(document.getElementById("ui"), {
  input,
  onStart: () => startRun(),
  onChoose: (id) => enterZone(id),
  onPause: () => setPaused(true),
  onResume: () => setPaused(false),
  onQuit: () => transition(() => { S.game = null; go("title"); ui.show("title"); }),
  onRetry: () => startRun(),
  onSound: () => toggleSound(),
});
input.attach(window);
input.shouldCapture = () => S.state === "playing" || S.state === "intro";

function toggleSound() { const on = audio.toggle(); ui.setSound(on); audio.onEvent({ type: "uiClick" }); }
function go(state) { S.state = state; S.stateT = 0; }
async function transition(mid) {
  if (S.busy) return; S.busy = true;
  await ui.curtain(mid);
  S.busy = false;
}

function startRun() {
  transition(() => {
    S.run = newRun(); S.game = null;
    go("route"); ui.show("route", { run: S.run });
  });
}

function enterZone(id) {
  transition(() => {
    const run = S.run;
    if (run.path.length) { // a breath between zones
      run.health = Math.min(PLAYER.maxHealth, run.health + 15);
      run.sanity = Math.min(PLAYER.maxSanity, run.sanity + 20);
    }
    run.path.push(id);
    S.game = loadLevel(run, id);
    S.cam = { x: null, y: null, zoom: 1 };
    updateCamera(S.cam, S.game, S.W, S.H, 0, true);
    input.clear(); ui.resetHud();
    go("intro");
    ui.show("intro", { name: LEVELS[id].name, tag: LEVELS[id].tag, index: run.tier + 1 });
  });
}

function setPaused(p) {
  if (p && S.state === "playing") { go("paused"); ui.show("pause"); input.clear(); }
  else if (!p && S.state === "paused") { go("playing"); ui.show(null); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden) setPaused(true); });

function finishZone() {
  const g = S.game, run = S.run;
  if (g.level.final) {
    transition(() => { go("won"); ui.show("won", { run }); audio.stopAmbience(); });
  } else {
    run.tier = Math.min(run.tier + 1, ROUTE.length - 1);
    transition(() => { go("route"); ui.show("route", { run }); });
  }
}

/* ---------------------------------------------------------------- loop */
let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min(1 / 30, Math.max(0, (ts - lastTs) / 1000)); lastTs = ts;
  S.t += dt; S.stateT += dt;
  const view = { W: S.W, H: S.H, dpr: S.dpr, t: S.t, dt, reduced: reducedMQ.matches, heldWeapon: null };

  if (input.take("mute")) toggleSound();
  if (input.take("pause")) { if (S.state === "playing") setPaused(true); else if (S.state === "paused") setPaused(false); }

  const g = S.game;
  switch (S.state) {
    case "title": case "route":
      art.renderTitle(ctx, S.W, S.H, S.t, view);
      if (S.state === "route") { ctx.fillStyle = "rgba(7,6,10,.55)"; ctx.fillRect(0, 0, S.W, S.H); }
      audio.frame(null, dt);
      break;
    case "intro":
      view.dt = dt;
      drawGame(g, view, dt);
      if (S.stateT > 1.9 && !S.busy) { go("playing"); ui.show(null); input.pressed.clear(); }
      break;
    case "playing":
      update(g, dt);
      updateCamera(S.cam, g, S.W, S.H, dt);
      dispatch(g, view);
      drawGame(g, view, dt);
      ui.hud(g);
      audio.frame(g, dt);
      if (g.outcome && !S.busy) {
        if (g.outcome.type === "exit") { go("leaving"); finishZone(); }
        else { go("lost"); S.lostBy = g.outcome.by; }
      }
      break;
    case "leaving":
      drawGame(g, view, dt);
      break;
    case "paused":
      view.dt = 0; drawGame(g, view, 0); ui.hud(g);
      break;
    case "lost":
      if (S.stateT < 1.3) { view.dt = dt * 0.3; drawGame(g, view, dt * 0.3); ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); ctx.fillStyle = `rgba(10,0,4,${S.stateT / 1.3})`; ctx.fillRect(0, 0, S.W, S.H); }
      else {
        if (!S.lostShown) { S.lostShown = true; ui.show("lost", { by: S.lostBy, run: S.run }); audio.stopAmbience(); }
        art.renderCaught(ctx, S.W, S.H, S.stateT - 1.3, view, S.lostBy);
      }
      break;
    case "won":
      art.renderWin(ctx, S.W, S.H, S.stateT, view);
      break;
  }
  if (S.state !== "lost") S.lostShown = false;
  requestAnimationFrame(frame);
}

function drawGame(g, view, dt) {
  if (!g) return;
  const inv = g.run.inventory[g.run.sel];
  view.heldWeapon = inv ? inv.id : null; view.dt = dt;
  art.render(ctx, g, S.cam, view);
}

function dispatch(g, view) {
  if (!g.events.length) return;
  const evs = g.events; g.events = [];
  for (const ev of evs) { art.onEvent(ev, view); audio.onEvent(ev); ui.onEvent(ev); }
}

ui.show("title");
requestAnimationFrame(frame);
