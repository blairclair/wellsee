/* art.js — every pixel on the game canvas.
 *
 * Owned by the ART agent. Pure drawing: reads game state, never changes it
 * (except its own particle/shake/flash state in `fx`). Split across js/art/:
 *   art/util.js     palette, hashing, shape helpers, cached sprites
 *   art/tiles.js    TILE_ART / TILE_FX / prerenderLevel
 *   art/figures.js  the guest and the Unwilling (shared rig), eye glints
 *   art/props.js    ICONS, pickups, projectiles, rabbits, obstacles
 *   art/face.js     the big painted face (title, caught scene, face-flash)
 *
 * Contract (see ARCHITECTURE.md):
 *   TILE_ART[tileName](ctx, x, y, s, tx, ty, game)      static, prerendered once per level
 *   TILE_FX[tileName](ctx, x, y, s, t)                   animated overlay, per frame, visible tiles
 *   ENTITY_ART[type](ctx, e, t, view)                    ctx is translated to the entity's feet (e.x,e.y)
 *   ICONS[weaponOrItemId](ctx, size, t)                  centred at 0,0; used by the HUD too
 *   onEvent(ev, view)  render(ctx, game, cam, view)  renderTitle / renderCaught / renderWin / renderBackdrop
 *
 * Performance: the darkness is a half-resolution screen layer built from a
 * per-level static lightmap (lamps, bulbs, exits baked once) plus a few
 * dynamic lights stamped from cached sprites; the vignette and dread pulse are
 * folded into the same layer, so the frame has one full-screen composite.
 * Add ?fps to the URL for a frame-time readout.
 */
import { TILE, TILES, ENEMIES } from "./content.js";
import { TAU, PAL, hash, clamp, circle, ellipse, rgba, lerpColor, hex, sprite, lightSprite, glowSprite, coneSprite } from "./art/util.js";
import { TILE_ART, TILE_FX, prerenderLevel } from "./art/tiles.js";
import { PEOPLE, glints, guestGhost } from "./art/figures.js";
import { ICONS, PROPS } from "./art/props.js";
import { bigFace } from "./art/face.js";

export { TILE_ART, TILE_FX, ICONS, prerenderLevel };

/* Player settings (UI agent's settings.js). Loaded defensively: the game must
   not break if that module has not been deployed yet. */
let SET = { shake: true, flash: 1, reduced: false };
let isRed = () => false;
import("./settings.js").then((m) => { if (m.settings) SET = m.settings; if (m.isReduced) isRed = m.isReduced; }).catch(() => {});
const reducedNow = (view) => !!((view && view.reduced) || isRed());

export const ENTITY_ART = { ...PROPS, ...PEOPLE };
const ENEMY_SCALE = 1.22; // the Unwilling are drawn larger than their collision circles: they loom

function placeholder(ctx, e) {
  shadow0(ctx, e.r || 10);
  circle(ctx, 0, -(e.r || 10), e.r || 10, e.cat === "enemy" ? PAL.candy : PAL.bruise);
  ctx.fillStyle = "#fff"; ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillText(e.type, 0, -(e.r || 10) * 2 - 4);
}
function shadow0(ctx, r) { ellipse(ctx, 0, 0, r, r * 0.42, "rgba(0,0,0,.45)"); }

/* ================================================================ fx state */
export const fx = {
  parts: [], words: [], decals: [], lights: [], trail: [], shake: 0, flash: 0, flashColor: "#ff0000", lastFlash: -9, time: 0,
  face: 0, faceCd: 0, zoomK: 0, swingDur: 0.2, swingHeavy: false, lastSwing: 0, trailT: 0,
};
const WORDS = ["HONK!", "BONK!", "SQUEAK!", "WHAP!", "THWACK!"];
function burstParts(x, y, n, opt) {
  for (let i = 0; i < n; i++) {
    const a = opt.angle != null ? opt.angle + (Math.random() - 0.5) * (opt.spread || 1) : Math.random() * TAU;
    const sp = (opt.speed || 120) * (0.4 + Math.random() * 0.8);
    fx.parts.push({ x, y, z: opt.z ?? 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: opt.vz ?? 60 + Math.random() * 80,
      life: (opt.life || 0.8) * (0.6 + Math.random() * 0.6), age: 0, size: opt.size || 2.5,
      color: Array.isArray(opt.color) ? opt.color[(Math.random() * opt.color.length) | 0] : opt.color,
      kind: opt.kind || "dot", rot: Math.random() * TAU, grav: opt.grav ?? 260, id: opt.id, side: i % 2 ? 1 : -1 });
  }
}
function part(p) { fx.parts.push({ z: 0, vx: 0, vy: 0, vz: 0, age: 0, grav: 0, rot: 0, size: 1, ...p }); }
/* full-screen flashes: rate-limited (<= 2.5/s), scaled by the player's flash setting, weakened under reduced motion */
function flash(color, strength, view) {
  if (fx.time - fx.lastFlash < 0.4) return false;
  const mul = SET.flash == null ? 1 : SET.flash;
  if (mul <= 0) return false;
  fx.lastFlash = fx.time; fx.flashColor = color;
  fx.flash = strength * mul * (reducedNow(view) ? 0.4 : 1);
  return true;
}
function shake(m, view) { if (reducedNow(view) || SET.shake === false) return; fx.shake = Math.min(14, fx.shake + m); }
function word(x, y, text, color, big) { fx.words.push({ x, y, text, color, age: 0, life: big ? 1.6 : 0.9, big }); }
function decal(x, y, kind, life = 8, extra = {}) { fx.decals.push({ x, y, kind, age: 0, life, rot: Math.random() * TAU, seed: Math.random() * 1000, ...extra }); if (fx.decals.length > 90) fx.decals.shift(); }
function tempLight(x, y, r, color, life, strength = 1) { fx.lights.push({ x, y, r, color, life, age: 0, strength }); }

export function onEvent(ev, view) {
  const type = ev.type;
  const x = ev.x ?? 0, y = ev.y ?? 0;
  switch (type) {
    case "hit": {
      const heavy = (ev.force || 0) > 600;
      burstParts(x, y, heavy ? 22 : 14, { color: [PAL.candy, PAL.bulb, PAL.poison, PAL.pink, PAL.cyan], kind: "confetti", speed: heavy ? 220 : 160, life: 1 });
      burstParts(x, y, 6, { color: ["#efe6d6", "#d8cfc0"], kind: "flake", speed: 90, life: 1.1, size: 2 }); // greasepaint chips
      part({ x, y: y - 22, kind: "impact", life: 0.22, size: heavy ? 30 : 20 });
      tempLight(x, y - 20, heavy ? 90 : 60, "#fff3b0", 0.18, 0.7);
      shake(heavy ? 7 : 3, view);
      if (Math.random() < 0.6) word(x, y - 60, WORDS[(Math.random() * WORDS.length) | 0], PAL.bulb);
      break;
    }
    case "ding": word(x, y - 70, "DING!", PAL.candy, true); shake(6, view); tempLight(x, y - 20, 140, "#ff2a4d", 0.3, 0.6); break;
    case "hurt":
      burstParts(x, y, 14, { color: ["#8b1414", "#c41a2a", "#5a0a10"], speed: 140, life: 0.7 });
      decal(x + (Math.random() - 0.5) * 10, y + 2, "blood", 12);
      shake(9, view); flash("#c4102a", 0.45, view); break;
    case "grab": word(x, y - 64, "gotcha", "#ffb3c0"); part({ x, y, kind: "hand", life: 0.5 }); break;
    case "swing": {
      const a = ev.face || 0;
      burstParts(x + Math.cos(a) * 20, y + Math.sin(a) * 20, ev.heavy ? 6 : 3, { color: "rgba(255,243,176,.8)", speed: 80, life: 0.25, angle: a, spread: 1.2, kind: "spark" });
      break;
    }
    case "throw": burstParts(x + Math.cos(ev.face || 0) * 14, y + Math.sin(ev.face || 0) * 14, 5, { color: "#fff", speed: 70, life: 0.3, kind: "spark" }); break;
    case "burst":
      burstParts(x, y, 50, { color: ["#fff8d8", "#ffe58a", "#fff"], kind: "popcorn", speed: 290, life: 1.3, size: 3.5 });
      part({ x, y, kind: "ring", life: 0.5, size: ev.radius || 140, color: "#fff8d8" });
      for (let i = 0; i < 14; i++) decal(x + (Math.random() - 0.5) * (ev.radius || 140), y + (Math.random() - 0.5) * (ev.radius || 140) * 0.7, "popcorn", 20);
      tempLight(x, y - 10, (ev.radius || 140) * 1.6, "#fff6d0", 0.5, 1);
      flash("#fff6d0", 0.55, view); shake(8, view); break;
    case "pickup": burstParts(x, y, 16, { color: [PAL.bulb, PAL.bulbHot, "#fff"], kind: "spark", speed: 90, life: 0.8 }); tempLight(x, y - 14, 70, PAL.bulb, 0.4, 0.6); break;
    case "break": { // the weapon snaps: its two halves fly apart, splinters and a SNAP
      const id = ev.weapon;
      if (ICONS[id]) for (const side of [-1, 1]) part({ x, y, z: 18, vx: side * (60 + Math.random() * 40), vy: -20 + Math.random() * 30, vz: 140, grav: 420, kind: "half", id, side, life: 1.1, rot: 0, spin: side * 9 });
      burstParts(x, y, 16, { color: ["#c9c2b0", "#8a7a5a", "#fff", "#5a4030"], kind: "splinter", speed: 170, life: 0.8, size: 3 });
      decal(x, y, "shards", 14);
      word(x, y - 58, "SNAP", "#ff6a6a", true); shake(5, view); break;
    }
    case "bite": // the carousel horse: real teeth, closing
      part({ x, y: y - 16, kind: "bite", life: 0.45, size: 26 });
      burstParts(x, y, 10, { color: ["#8b1414", "#c41a2a"], speed: 110, life: 0.6 });
      decal(x, y + 4, "bite", 14); shake(8, view); break;
    case "spawn":
      burstParts(x, y, 20, { color: [PAL.candy, "#2a0a10", "#5a0a10"], kind: "confetti", speed: 120 });
      part({ x, y, kind: "ring", life: 0.6, size: 50, color: "#ff2a4d" });
      tempLight(x, y - 20, 80, "#ff2a4d", 0.8, 0.6); break;
    case "cookie": burstParts(x, y, 22, { color: ["#b46cff", "#3a1e0c", "#c89048"], speed: 100 }); flash("#6b2a8f", 0.4, view); break;
    case "splash": burstParts(x, y, 26, { color: ["#5fd0ff", "#c8f4ff"], speed: 150, vz: 160 }); decal(x, y, "wet", 10); shake(4, view); break;
    case "mirror": flash("#bfefff", 0.3, view); burstParts(x, y, 12, { color: ["#dff6ff", "#8fb8c8"], kind: "shard", speed: 90 }); break;
    case "marked": flash("#e8f4ff", 0.2, view); fx.trail.length = 0; break;
    case "dash": burstParts(x, y, 6, { color: "rgba(122,240,255,.8)", speed: 40, life: 0.35, angle: (ev.face || 0) + Math.PI, spread: 0.8 }); break;
    case "hop": burstParts(x, y, 4, { color: "#3a2a22", speed: 30, life: 0.4, vz: 20 }); decal(x, y, "print", 6); break;
    case "catch": burstParts(x, y, 6, { color: [PAL.bulb, "#c9873f"], kind: "spark", speed: 60, life: 0.4 }); break;
    case "projEnd":
      if (ev.proj === "candy") burstParts(x, y, 12, { color: ["#ff9ae0", "#ffc2ee"], speed: 70 });
      else if (ev.proj === "cork") { burstParts(x, y, 5, { color: ["#c9a070", "#fff"], speed: 60, life: 0.4 }); word(x, y - 30, "pop", "#e8dcc4"); }
      break;
    case "caught": shake(12, view); break;
    /* ---- Arthur Benning's camera ---- */
    case "flashCharge": part({ x, y: y - 40, kind: "charge", life: ev.dur || 1, size: 16 }); break;
    case "flash": {
      part({ x, y: y - 30, kind: "cone", life: 0.45, size: ev.range || 220, rot: ev.face || 0 });
      tempLight(x, y - 30, (ev.range || 220) * 1.2, "#ffffff", 0.35, 1);
      burstParts(x, y - 40, 10, { color: ["#fff", "#e8f4ff"], kind: "spark", speed: 160, life: 0.4 });
      if (ev.hit) { flash("#ffffff", 0.7, view); fx.trail.length = 0; } else flash("#e8f4ff", 0.25, view);
      word(x, y - 70, "CLICK", "#e8f4ff");
      break;
    }
    case "flashCancel": burstParts(x, y - 40, 12, { color: ["#e8f4ff", "#9ab", "#fff"], kind: "shard", speed: 110, life: 0.6 }); word(x, y - 64, "pop", "#9ab"); break;
    /* ---- the Barker ---- */
    case "barkerWindup": part({ x, y, kind: "ring", life: ev.dur || 0.8, size: 46, color: "#ff2a4d", shrink: true }); burstParts(x, y, 8, { color: "#3a2a22", speed: 50, life: 0.5, vz: 30 }); break;
    case "barkerLunge": shake(9, view); burstParts(x, y, 14, { color: ["#3a2a22", "#5a4030"], speed: 120, life: 0.6, angle: (ev.face || 0) + Math.PI, spread: 1.2, vz: 40 }); break;
    case "barkerCall":
      word(x, y - 110, "STEP RIGHT UP!", "#ff3a4a", true);
      for (let i = 0; i < 3; i++) part({ x, y: y - 50, kind: "ring", life: 0.9 + i * 0.25, size: 160 + i * 50, color: "#ff8a5a" });
      shake(6, view); flash("#5a0010", 0.35, view); tempLight(x, y - 40, 200, "#ff2a4d", 1.0, 0.8); break;
    case "breaker":
      burstParts(x, y - 30, 22, { color: ["#ffcf5a", "#fff", "#7dff4a"], kind: "spark", speed: 160, life: 0.7 });
      word(x, y - 70, ev.thrown >= ev.total ? "THE GATE!" : "CLUNK", ev.thrown >= ev.total ? "#7dff4a" : "#ffcf5a", ev.thrown >= ev.total);
      tempLight(x, y - 30, 120, "#7dff4a", 0.6, 0.8); shake(5, view); break;
    case "gateOpen": shake(10, view); burstParts(x, y - 20, 30, { color: ["#ffcf5a", "#fff", "#c87a3a"], kind: "spark", speed: 200, life: 0.9 }); flash("#9dff6a", 0.3, view); tempLight(x, y, 260, "#9dff6a", 1.5, 1); break;
    /* ---- jack-in-the-box ---- */
    case "jackCrank": word(x, y - 44, "tk tk tk", "#e8dcc4"); break;
    case "jackSpring":
      burstParts(x, y - 20, 28, { color: [PAL.candy, PAL.bulb, "#fff", PAL.pink], kind: "confetti", speed: 220, life: 1 });
      part({ x, y, kind: "ring", life: 0.4, size: ev.radius || 70, color: "#ffcf5a" });
      word(x, y - 80, "HA!", PAL.candy, true); shake(7, view); tempLight(x, y - 20, 100, PAL.bulb, 0.4, 0.8); break;
    case "chalk": decal(x, y, "chalk", 4.5); burstParts(x, y, 3, { color: "rgba(255,255,255,.7)", speed: 20, life: 0.6, vz: 10, size: 1.5 }); break;
  }
}

function updateFx(dt, game) {
  fx.time += dt;
  fx.shake = Math.max(0, fx.shake - dt * 30);
  fx.flash = Math.max(0, fx.flash - dt * 2.2);
  fx.face = Math.max(0, fx.face - dt * 3);
  fx.faceCd = Math.max(0, fx.faceCd - dt);
  for (const p of fx.parts) {
    p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
    p.vz -= p.grav * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; if (p.spin) p.spin *= 0.5; }
    p.rot += dt * (p.spin != null ? p.spin : 8);
  }
  fx.parts = fx.parts.filter((p) => p.age < p.life);
  if (fx.parts.length > 600) fx.parts.splice(0, fx.parts.length - 600);
  for (const w of fx.words) w.age += dt;
  fx.words = fx.words.filter((w) => w.age < w.life);
  for (const d of fx.decals) d.age += dt;
  fx.decals = fx.decals.filter((d) => d.age < d.life);
  for (const l of fx.lights) l.age += dt;
  fx.lights = fx.lights.filter((l) => l.age < l.life);
}

function drawDecals(ctx, vx0, vy0, vx1, vy1) {
  for (const d of fx.decals) {
    if (d.x < vx0 || d.x > vx1 || d.y < vy0 || d.y > vy1) continue;
    const a = Math.min(1, (d.life - d.age) / 1.5);
    ctx.globalAlpha = a; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot);
    if (d.kind === "blood") { ellipse(ctx, 0, 0, 6, 3, "rgba(110,8,16,.7)"); circle(ctx, 7, 1, 1.4, "rgba(110,8,16,.7)"); circle(ctx, -6, -2, 1, "rgba(110,8,16,.7)"); }
    else if (d.kind === "bite") { ctx.strokeStyle = "rgba(120,8,16,.8)"; ctx.lineWidth = 1.2; for (const s of [-1, 1]) { ctx.beginPath(); for (let i = -3; i <= 3; i++) { ctx.moveTo(i * 2.4, s * 4); ctx.lineTo(i * 2.4, s * 2.2); } ctx.stroke(); } }
    else if (d.kind === "chalk") { ctx.strokeStyle = "rgba(240,240,235,.55)"; ctx.lineWidth = 0.9; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-6, -3 + i * 2.5); ctx.lineTo(6, -4 + i * 2.5 + (hash(d.seed, i) - 0.5) * 2); } ctx.stroke(); }
    else if (d.kind === "popcorn") { circle(ctx, 0, 0, 2, "#f3e7b0"); circle(ctx, 1, -0.6, 1.2, "#fff"); }
    else if (d.kind === "shards") { ctx.fillStyle = "rgba(200,190,170,.7)"; for (let i = 0; i < 5; i++) ctx.fillRect(hash(d.seed, i) * 14 - 7, hash(d.seed, i, 1) * 8 - 4, 2.5, 1); }
    else if (d.kind === "wet") { ellipse(ctx, 0, 0, 14, 6, "rgba(40,90,110,.35)"); }
    else if (d.kind === "print") { ellipse(ctx, 0, 0, 2, 1.2, "rgba(0,0,0,.35)"); ellipse(ctx, 4, 1, 2, 1.2, "rgba(0,0,0,.35)"); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawParts(ctx, t) {
  for (const p of fx.parts) {
    const k = p.age / p.life, a = 1 - k;
    ctx.globalAlpha = Math.max(0, a);
    switch (p.kind) {
      case "ring": {
        const s = p.shrink ? p.size * (1 - k) : p.size * (0.3 + k * 0.7);
        ctx.strokeStyle = p.color; ctx.lineWidth = 5 * a + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, s, s * 0.55, 0, 0, TAU); ctx.stroke(); break;
      }
      case "confetti": ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); ctx.restore(); break;
      case "splinter": ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -0.6, p.size * 2, 1.2); ctx.restore(); break;
      case "flake": case "shard": ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(0, -p.size * 0.8); ctx.lineTo(p.size, p.size * 0.5); ctx.fill(); ctx.restore(); break;
      case "popcorn": circle(ctx, p.x, p.y - p.z, p.size, p.color); circle(ctx, p.x + 1.5, p.y - p.z - 1, p.size * 0.6, "#fff"); break;
      case "spark": ctx.fillStyle = p.color; ctx.fillRect(p.x - 1, p.y - p.z - 3, 2, 6); ctx.fillRect(p.x - 3, p.y - p.z - 1, 6, 2); break;
      case "half": // one half of a broken weapon, tumbling
        ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.rect(p.side < 0 ? -20 : 0, -20, 20, 40); ctx.clip();
        ICONS[p.id](ctx, 20, t); ctx.restore(); break;
      case "impact": { // white star where the blow lands
        const s = p.size * (0.5 + k);
        ctx.fillStyle = "#fffbe8"; ctx.beginPath();
        for (let i = 0; i < 16; i++) { const aa = (i / 16) * TAU, rr = i % 2 ? s * 0.35 : s; ctx.lineTo(p.x + Math.cos(aa) * rr, p.y + Math.sin(aa) * rr * 0.8); }
        ctx.fill(); break;
      }
      case "bite": { // two rows of teeth closing on you
        const c = Math.min(1, k * 3), gap = (1 - c) * p.size;
        ctx.fillStyle = "#f4ecd8"; ctx.strokeStyle = "#3a0606"; ctx.lineWidth = 1;
        for (const s of [-1, 1]) { ctx.beginPath(); for (let i = -4; i <= 4; i++) { const bx = p.x + i * 4.2; ctx.moveTo(bx - 2, p.y + s * (gap + 6)); ctx.lineTo(bx, p.y + s * gap); ctx.lineTo(bx + 2, p.y + s * (gap + 6)); } ctx.fill(); ctx.stroke(); }
        break;
      }
      case "hand": { // a white hand closing where it grabbed
        ctx.fillStyle = "rgba(240,234,224,.8)"; ellipse(ctx, p.x, p.y - 22, 6, 5, "rgba(240,234,224,.8)");
        for (let i = 0; i < 4; i++) ctx.fillRect(p.x - 6 + i * 3.4, p.y - 34 + k * 6, 2, 10);
        break;
      }
      case "charge": { // the flash powder building
        ctx.globalAlpha = 0.3 + k * 0.6; const r = p.size * (1 - k * 0.6);
        ctx.strokeStyle = "#e8f4ff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke(); break;
      }
      case "cone": { // the camera flash: a blown-out wedge of light
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.85 * a * a;
        ctx.drawImage(coneSprite(), 0, -p.size * 0.42, p.size, p.size * 0.84); ctx.restore(); break;
      }
      default: circle(ctx, p.x, p.y - p.z, p.size, p.color);
    }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  for (const w of fx.words) {
    const k = w.age / w.life, s = 1 + Math.min(1, w.age * 8) * 0.3 - k * 0.2;
    ctx.font = w.big ? "bold 22px 'IM Fell English SC', Georgia, serif" : "bold 15px 'IM Fell English SC', Georgia, serif";
    ctx.save(); ctx.translate(w.x, w.y - k * 24); ctx.scale(s, s); ctx.rotate(-0.12);
    ctx.globalAlpha = 1 - k * k; ctx.lineWidth = 4; ctx.strokeStyle = "#1a0306"; ctx.strokeText(w.text, 0, 0); ctx.fillStyle = w.color; ctx.fillText(w.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ================================================================ lighting */
const LS = 0.25;       // static lightmap scale (world px -> map px)
const LIGHT_RES = 0.5; // screen lightmap resolution
function flick(seed, t, amt) {
  if (!amt) return 1;
  return 1 - amt * (0.5 + 0.5 * Math.sin(t * 2.3 + seed * 40) * Math.sin(t * 0.9 + seed * 17)); // slow, irregular: no strobing
}
function darkColor(level) {
  const fog = (level.palette && level.palette.fog) || "#140810";
  const [r, g, b] = hex(fog);
  return [Math.round(3 + r * 0.12), Math.round(2 + g * 0.12), Math.round(6 + b * 0.12)];
}
function ambientOf(level) { return clamp((level.ambient ?? 0.88) + 0.07, 0, 0.975); }

function darkSprite() {
  return sprite("dark", 64, 64, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(0,0,0,.85)"); gr.addColorStop(0.5, "rgba(0,0,0,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}

/* The light layer is a colour map multiplied over the scene: ambient (very dark,
   tinted by the zone's fog) plus coloured light added on top. One full-screen
   composite per frame, and coloured lamps tint what they light for free. */
function ambientRGB(level) {
  const [r, g, b] = darkColor(level), amb = ambientOf(level), k = (1 - amb) * 255;
  return [Math.round(k * 0.8 + r * 0.6), Math.round(k * 0.7 + g * 0.6), Math.round(k * 0.95 + b * 0.8)];
}
function tintLight(color) {
  return sprite("tl" + color, 128, 128, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(0.35, rgba(color, 0.75)); gr.addColorStop(0.7, rgba(color, 0.25)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
function tintCone(color) {
  return sprite("tc" + color, 160, 160, (g, w, h) => {
    g.drawImage(coneSprite(), 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = color; g.fillRect(0, 0, w, h);
  });
}
function lerpHex(a, b, k) { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); }
/* static per-level light: ambient, with lamps, bulbs and exits already added */
function buildStaticLight(game, pre) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(game.w * TILE * LS); c.height = Math.ceil(game.h * TILE * LS);
  const g = c.getContext("2d");
  const [r, gg, b] = ambientRGB(game.level);
  g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(0, 0, c.width, c.height);
  g.setTransform(LS, 0, 0, LS, 0, 0);
  g.globalCompositeOperation = "lighter";
  for (const l of pre.lights) { const rr = l.r; g.globalAlpha = 0.95; g.drawImage(tintLight(lerpHex(l.color, "#ffffff", 0.35)), l.x - rr, l.y - rr, rr * 2, rr * 2); }
  for (const bl of pre.bulbs) if (bl.state !== "dead") { const rr = 34; g.globalAlpha = bl.state === "on" ? 0.45 : 0.25; g.drawImage(tintLight(bl.color), bl.x - rr, bl.y - rr + 8, rr * 2, rr * 2); }
  g.globalAlpha = 1;
  return c;
}

let lightCanvas = null, vigCache = { key: "", c: null };
function vignetteCanvas(lw, lh, d, darkRGB) {
  const q = Math.round(d * 20) / 20, key = lw + "x" + lh + ":" + q + ":" + darkRGB.join(",");
  if (vigCache.key === key) return vigCache.c;
  const c = vigCache.c && vigCache.c.width === lw && vigCache.c.height === lh ? vigCache.c : document.createElement("canvas");
  c.width = lw; c.height = lh;
  const g = c.getContext("2d"); g.clearRect(0, 0, lw, lh);
  const inner = Math.min(lw, lh) * (0.42 - q * 0.26), outer = Math.max(lw, lh) * (0.72 - q * 0.16);
  const vg = g.createRadialGradient(lw / 2, lh / 2, Math.max(4, inner), lw / 2, lh / 2, outer);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, `rgba(${Math.round(darkRGB[0] + q * 50)},${darkRGB[1]},${Math.round(darkRGB[2] + q * 8)},${0.88 + q * 0.1})`);
  g.fillStyle = vg; g.fillRect(0, 0, lw, lh);
  vigCache = { key, c };
  return c;
}

function dynamicLights(game, t, view) {
  const L = [];
  for (const e of game.entities) {
    const lt = e.def && e.def.light;
    if (lt) L.push({ x: e.x, y: e.y - 10, r: lt.r * 0.85 * flick((e.id || 0) * 0.13, t, lt.flicker), color: lt.color, a: 0.9 });
    if (e.cat === "pickup" && !lt) L.push({ x: e.x, y: e.y - 14, r: 42, color: (e.def && e.def.color) || PAL.bulb, a: 0.5 });
    if (e.type === "arthur" && e.charge > 0) { const k = clamp(1 - e.charge / (e.chargeDur || 1), 0, 1); L.push({ x: e.x, y: e.y - 48, r: 30 + k * 60, color: "#e8f4ff", a: 0.4 + k * 0.5 }); }
    if (e.type === "barker") L.push({ x: e.x, y: e.y - 10, r: 70 + (e.phase || 0) * 10, color: "#ff2a2a", a: 0.45, under: true });
    if (e.type === "breaker" && e.done) L.push({ x: e.x, y: e.y - 30, r: 60, color: "#7dff4a", a: 0.7 });
    if (e.type === "jack" && e.sprung > 0 && e.sprung < 2.6) L.push({ x: e.x, y: e.y - 30, r: 50, color: PAL.bulb, a: 0.6 });
    if (e.type === "gate" && e.open > 0) L.push({ x: e.x, y: e.y - 10, r: 90 * e.open, color: "#9dff6a", a: 0.7 });
  }
  for (const l of fx.lights) { const k = 1 - l.age / l.life; L.push({ x: l.x, y: l.y, r: l.r * (0.6 + 0.4 * k), color: l.color, a: l.strength * k }); }
  return L;
}

function drawLighting(ctx, game, cam, z, pre, t, W, H, view) {
  const lw = Math.ceil(W * LIGHT_RES), lh = Math.ceil(H * LIGHT_RES);
  if (!lightCanvas) lightCanvas = document.createElement("canvas");
  if (lightCanvas.width !== lw || lightCanvas.height !== lh) { lightCanvas.width = lw; lightCanvas.height = lh; }
  const lc = lightCanvas.getContext("2d");
  const darkRGB = darkColor(game.level), amb = ambientRGB(game.level);
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = "source-over"; lc.globalAlpha = 1;
  lc.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`; lc.fillRect(0, 0, lw, lh);
  const vw = W / z, vh = H / z;
  const sx = cam.x * LS, sy = cam.y * LS, sw = vw * LS, shh = vh * LS;
  const cx0 = Math.max(0, sx), cy0 = Math.max(0, sy), cx1 = Math.min(pre.light.width, sx + sw), cy1 = Math.min(pre.light.height, sy + shh);
  if (cx1 > cx0 && cy1 > cy0) {
    const dx = (cx0 - sx) / sw * lw, dy = (cy0 - sy) / shh * lh, dw = (cx1 - cx0) / sw * lw, dh = (cy1 - cy0) / shh * lh;
    lc.drawImage(pre.light, cx0, cy0, cx1 - cx0, cy1 - cy0, dx, dy, dw, dh);
  }
  const s = z * LIGHT_RES;
  lc.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
  const vx0 = cam.x - 250, vy0 = cam.y - 250, vx1 = cam.x + vw + 250, vy1 = cam.y + vh + 250;
  const dk = darkSprite();
  // flicker: a lamp that dips darkens its own pool (slow, irregular, never a strobe)
  for (const l of pre.lights) {
    if (!l.flicker || l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    const f = 1 - flick(l.seed, t, l.flicker); if (f < 0.02) continue;
    lc.globalAlpha = clamp(f * 2.2, 0, 0.7); lc.drawImage(dk, l.x - l.r * 0.8, l.y - l.r * 0.8, l.r * 1.6, l.r * 1.6);
  }
  // dynamic coloured light
  lc.globalCompositeOperation = "lighter";
  const L = dynamicLights(game, t, view);
  for (const l of L) {
    if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    lc.globalAlpha = clamp(l.a, 0, 1); lc.drawImage(tintLight(l.color), l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  for (const e of game.entities) if (e.type === "searchlight") {
    lc.save(); lc.translate(e.x, e.y - 12); lc.rotate(e.ang || 0); lc.globalAlpha = e.lit ? 1 : 0.75;
    const len = e.len || 230; lc.drawImage(tintCone("#fff6d8"), 0, -len * 0.36, len, len * 0.72); lc.restore();
  }
  // the guest's lantern: a small warm pool and a narrow throw where you face; both shrink with sanity
  const p = game.player, san = clamp(game.run.sanity / 100, 0, 1);
  const lr = (58 + 62 * san) * flick(0.77, t, 0.08);
  lc.globalAlpha = 0.95; lc.drawImage(tintLight("#ffd9a0"), p.x - lr, p.y - 14 - lr, lr * 2, lr * 2);
  const cl = 120 + 90 * san;
  lc.save(); lc.translate(p.x, p.y - 12); lc.rotate(p.face || 0); lc.globalAlpha = 0.45 + 0.25 * san;
  lc.drawImage(tintCone("#ffe8c0"), -6, -cl * 0.38, cl, cl * 0.76); lc.restore();
  // the Unwilling carry their own dark with them
  lc.globalCompositeOperation = "source-over";
  for (const e of game.entities) if (e.cat === "enemy") {
    if (e.x < vx0 || e.x > vx1 || e.y < vy0 || e.y > vy1) continue;
    const rr = e.type === "barker" ? 70 : 40;
    lc.globalAlpha = e.type === "rabbit" ? 0.2 : 0.38; lc.drawImage(dk, e.x - rr, e.y - 22 - rr, rr * 2, rr * 2);
  }
  // vignette and the dread pulse, folded into the same layer
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalAlpha = 1;
  lc.drawImage(vignetteCanvas(lw, lh, game.dread || 0, darkRGB), 0, 0);
  const d = game.dread || 0;
  if (d > 0.6 && !reducedNow(view)) {
    const beat = Math.max(0, Math.sin(t * 7.5)) ** 8 * (d - 0.6) * 0.55;
    if (beat > 0.01) { lc.fillStyle = `rgba(110,8,16,${beat})`; lc.fillRect(0, 0, lw, lh); }
  }
  ctx.save(); ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(lightCanvas, 0, 0, W, H);
  ctx.restore();
  // a little bloom on the strongest sources only
  ctx.globalCompositeOperation = "lighter";
  for (const l of pre.lights) {
    if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    const f = flick(l.seed, t, l.flicker), r = l.r * 0.45;
    ctx.globalAlpha = 0.4 * f; ctx.drawImage(glowSprite(l.color), l.x - r, l.y - r, r * 2, r * 2);
  }
  for (const l of L) {
    if (l.a < 0.5 || l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    const r = l.r * 0.5; ctx.globalAlpha = clamp(l.a * 0.45, 0, 1); ctx.drawImage(glowSprite(l.color), l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
}

/* ================================================================ frame */
let pre = null, preFor = null, preScale = 0;
let showFps = false;
try { showFps = /[?&]fps\b/.test(location.search) || localStorage.getItem("escape.fps") === "1"; } catch (e) { /* no storage */ }
const frameTimes = [];

function prepare(game, view, z) {
  const want = clamp(Math.round(view.dpr * z * 2) / 2, 1, 3);
  const maxDim = Math.max(game.w, game.h) * TILE;
  const scale = Math.min(want, 4096 / maxDim);
  if (preFor !== game || Math.abs(scale - preScale) > 0.6) {
    pre = prerenderLevel(game, scale); pre.light = buildStaticLight(game, pre);
    preFor = game; preScale = scale;
    fx.decals.length = 0; fx.trail.length = 0; fx.lights.length = 0;
  }
}

export function render(ctx, game, cam, view) {
  const t0 = performance.now();
  const { W, H, dpr, t, dt } = view;
  updateFx(dt, game);
  const reduced = reducedNow(view);
  const p = game.player;
  // proximity: the nearest of the Unwilling
  let near = null, nd = 1e9;
  for (const e of game.entities) if (e.cat === "enemy" && e.type !== "rabbit") { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; near = e; } }
  // close-range push-in: the camera leans toward you when they are close (off under reduced motion)
  const closeK = reduced ? 0 : clamp((150 - nd) / 110, 0, 1);
  fx.zoomK += (closeK - fx.zoomK) * (1 - Math.exp(-4 * dt));
  const z = cam.zoom * (1 + 0.09 * fx.zoomK);
  const camX = cam.x + (W / cam.zoom - W / z) * ((p.x - cam.x) / (W / cam.zoom));
  const camY = cam.y + (H / cam.zoom - H / z) * ((p.y - 14 - cam.y) / (H / cam.zoom));
  const vcam = { x: camX, y: camY, zoom: z };
  prepare(game, view, z);
  // face-flash: the first time one gets right up close, a painted face (rate-limited, setting-scaled, never under reduced motion)
  if (near && nd < 58 && fx.faceCd <= 0 && !reduced && (SET.flash ?? 1) > 0 && dt > 0) {
    if (fx.time - fx.lastFlash >= 0.4) { fx.lastFlash = fx.time; fx.face = 1; fx.faceSeed = (near.id || 1) % 7 + 1; }
    fx.faceCd = 9;
  }
  // swing duration (the engine sets p.swing to its full length when a swing starts)
  if (p.swing > fx.lastSwing + 0.01) { fx.swingDur = p.swing; fx.swingHeavy = p.swing > 0.25; }
  fx.lastSwing = p.swing || 0;
  view.swingDur = fx.swingDur; view.swingHeavy = fx.swingHeavy;
  // the negative afterimage trail while marked
  const marked = game.status && game.status.marked > 0;
  fx.trailT += dt;
  if (fx.trailT > 0.07) { fx.trailT = 0; fx.trail.push({ x: p.x, y: p.y, face: p.face }); if (fx.trail.length > 14) fx.trail.shift(); }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, W, H);
  const sx = fx.shake ? (Math.random() - 0.5) * fx.shake : 0, sy = fx.shake ? (Math.random() - 0.5) * fx.shake : 0;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, (-camX * z + sx) * dpr, (-camY * z + sy) * dpr);

  // floor & walls: blit only the visible part of the prerendered level
  const vw = W / z, vh = H / z, mw = game.w * TILE, mh = game.h * TILE;
  const bx0 = clamp(camX - 2, 0, mw), by0 = clamp(camY - 2, 0, mh), bx1 = clamp(camX + vw + 2, 0, mw), by1 = clamp(camY + vh + 2, 0, mh);
  ctx.imageSmoothingEnabled = true;
  if (bx1 > bx0 && by1 > by0) ctx.drawImage(pre.canvas, bx0 * pre.scale, by0 * pre.scale, (bx1 - bx0) * pre.scale, (by1 - by0) * pre.scale, bx0, by0, bx1 - bx0, by1 - by0);

  const vx0 = camX - TILE, vy0 = camY - TILE, vx1 = camX + vw + TILE, vy1 = camY + vh + TILE;
  for (const [tx, ty, name] of pre.fxTiles) {
    const x = tx * TILE, y = ty * TILE; if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    TILE_FX[name](ctx, x, y, TILE, t);
  }
  drawDecals(ctx, vx0, vy0, vx1, vy1);
  // bulbs (many are dead; some stutter)
  for (const b of pre.bulbs) {
    if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
    const on = b.state === "on" || (b.state === "flicker" && Math.sin(t * 1.3 + b.seed * 50) > 0.2);
    circle(ctx, b.x, b.y, 2.4, on ? b.color : "#2a2420");
    if (on) circle(ctx, b.x - 0.6, b.y - 0.6, 0.9, "#fff");
  }

  // long shadows: each hunting figure's shadow reaches toward you before it does
  for (const e of game.entities) {
    if (e.cat !== "enemy" || !(e.alert > 0) || e.type === "rabbit") continue;
    if (e.x < vx0 - 200 || e.x > vx1 + 200 || e.y < vy0 - 200 || e.y > vy1 + 200) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const len = clamp(260 - d * 0.6, 30, 170) * (e.type === "barker" ? 1.5 : 1);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(dy, dx));
    ctx.globalAlpha = 0.5; ctx.drawImage(darkSprite(), 0, -9, len, 18);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(len * 0.8, -2); ctx.lineTo(len * 0.8, 2); ctx.lineTo(0, 5); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  }

  // entities, y-sorted; flat things first
  const flat = [], tall = [];
  for (const e of game.entities) (e.type === "snare" || e.type === "spawner" ? flat : tall).push(e);
  tall.push(p);
  tall.sort((a, b) => a.y - b.y);
  glints.length = 0;
  for (const e of flat.concat(tall)) {
    if (e.x < vx0 - 60 || e.x > vx1 + 60 || e.y < vy0 - 40 || e.y > vy1 + 140) continue;
    if (e === p && marked) drawMarkedTrail(ctx, game, t);
    const fn = ENTITY_ART[e.type] || (e.cat === "pickup" ? ENTITY_ART.pickup : null);
    const enemy = e.cat === "enemy";
    const ed = enemy ? Math.hypot(e.x - p.x, e.y - p.y) : 1e9;
    if (enemy && ed < 90 && !reduced && fn) { // doubled vision when one is on top of you
      const k = (90 - ed) / 90, j = 2 + k * 3;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(e.x + s * j * (0.6 + 0.4 * Math.sin(t * 13 + s)), e.y); ctx.scale(ENEMY_SCALE, ENEMY_SCALE);
        ctx.globalAlpha = 0.22 * k; fn(ctx, e, t, view); ctx.restore();
      }
      ctx.globalAlpha = 1; glints.length = Math.max(0, glints.length - 4);
    }
    ctx.save(); ctx.translate(e.x, e.y);
    if (enemy) ctx.scale(ENEMY_SCALE, ENEMY_SCALE);
    if (fn) fn(ctx, e, t, view); else placeholder(ctx, e);
    ctx.restore();
    if (e === p && marked) drawMarkedOutline(ctx, p, t, game.status.marked);
  }
  drawParts(ctx, t);

  drawLighting(ctx, game, vcam, z, pre, t, W, H, view);

  // ---- screen-space post ----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // eyeshine: what catches the light in the dark
  ctx.globalCompositeOperation = "lighter";
  for (const g of glints) {
    const gx = g.x / dpr, gy = g.y / dpr, gr = Math.max(2.5, g.r / dpr * 2.2);
    ctx.globalAlpha = 0.85 * (g.a ?? 1); ctx.drawImage(glowSprite(g.color), gx - gr * 2, gy - gr * 2, gr * 4, gr * 4);
  }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  for (const g of glints) if ((g.a ?? 1) >= 0.6 && g.r / dpr < 6) circle(ctx, g.x / dpr, g.y / dpr, Math.max(0.7, g.r / dpr * 0.5), "#fffbe8");

  if (game.silence) {
    ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "rgba(128,128,128,0.75)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }
  if (game.status && game.status.reversed > 0) { ctx.fillStyle = `rgba(122,240,255,${0.06 + 0.04 * Math.sin(t * 3)})`; ctx.fillRect(0, 0, W, H); }
  // sanity hallucinations: painted grins at the edges of sight
  const san = game.run.sanity;
  if (san < 45) {
    const k = (45 - san) / 45;
    for (let i = 0; i < 3; i++) {
      const a = t * 0.15 + i * 2.1, x = W / 2 + Math.cos(a) * W * 0.44, y = H / 2 + Math.sin(a * 1.3) * H * 0.4;
      ctx.globalAlpha = k * (0.22 + 0.18 * Math.sin(t * 0.8 + i));
      ctx.fillStyle = PAL.mouth; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.quadraticCurveTo(x, y + 26, x + 24, y); ctx.quadraticCurveTo(x, y + 12, x - 24, y); ctx.fill();
      circle(ctx, x - 9, y - 10, 2.2, PAL.bulbHot); circle(ctx, x + 9, y - 10, 2.2, PAL.bulbHot);
    }
    ctx.globalAlpha = 1;
  }
  // face-flash
  if (fx.face > 0) {
    const fs = Math.min(W, H) * 0.42;
    const img = sprite("faceflash" + (fx.faceSeed || 1), 360, 520, (g, w, h) => { bigFace(g, w / 2, h * 0.36, w * 0.36, 0, { seed: fx.faceSeed || 1, skin: "#9a9284" }); });
    ctx.globalAlpha = Math.min(0.32, fx.face * 0.4) * (SET.flash ?? 1);
    ctx.drawImage(img, W / 2 - fs * 0.5, H * 0.46 - fs * 0.52, fs, fs * 520 / 360);
    ctx.globalAlpha = 1;
  }
  if (fx.flash > 0) { ctx.globalAlpha = Math.min(0.6, fx.flash); ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // grain
  ctx.fillStyle = "rgba(255,255,255,.03)";
  for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);

  // optional frame-time readout (?fps)
  const ms = performance.now() - t0;
  frameTimes.push(ms); if (frameTimes.length > 60) frameTimes.shift();
  fx.renderMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  if (showFps) {
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(8, H - 26, 150, 18);
    ctx.fillStyle = "#9dff6a"; ctx.font = "11px monospace"; ctx.textAlign = "left";
    ctx.fillText(`render ${fx.renderMs.toFixed(1)}ms  dt ${(dt * 1000).toFixed(0)}`, 12, H - 13);
  }
}

/* marked: a negative-film afterimage of you lags behind, and an outline crawls on you */
function drawMarkedTrail(ctx, game, t) {
  const tr = fx.trail;
  for (let i = 0; i < tr.length - 2; i += 3) {
    const q = tr[i], a = (i + 1) / tr.length;
    ctx.save(); ctx.translate(q.x + Math.sin(t * 7 + i) * 1.2, q.y);
    ctx.globalAlpha = 0.16 + a * 0.18; guestGhost(ctx, null, t, "#d8fbff");
    ctx.translate(2, 0); ctx.globalAlpha = 0.12 + a * 0.1; guestGhost(ctx, null, t, "#ff3ad0");
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function drawMarkedOutline(ctx, p, t, secs) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 5);
  ctx.strokeStyle = "#e8fbff"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 20;
  ctx.beginPath(); ctx.ellipse(0, -16, 12, 21, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore(); ctx.globalAlpha = 1;
}

/* ================================================================ cinematics */
function bigTop(ctx, W, H, t, glow = 1) {
  const g = ctx.createRadialGradient(W / 2, H * 0.85, 10, W / 2, H * 0.8, Math.max(W, H) * 0.7);
  g.addColorStop(0, `rgba(217,130,43,${0.3 * glow})`); g.addColorStop(0.5, `rgba(139,20,20,${0.14 * glow})`); g.addColorStop(1, "rgba(7,6,10,0)");
  ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, W, H); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, base = H, top = H * 0.5, half = Math.min(W * 0.46, H * 0.62);
  ctx.fillStyle = "#120b0e"; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx - half, base - H * 0.14); ctx.lineTo(cx - half, base); ctx.lineTo(cx + half, base); ctx.lineTo(cx + half, base - H * 0.14); ctx.fill();
  ctx.strokeStyle = "#1e1216"; ctx.lineWidth = Math.max(6, W * 0.012);
  for (let i = -2; i <= 2; i++) { if (!i) continue; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + i * half * 0.35, base); ctx.stroke(); }
  ctx.fillStyle = "#5a0f0f"; ctx.beginPath(); ctx.moveTo(cx, top - 30); ctx.lineTo(cx + 30, top - 22); ctx.lineTo(cx, top - 14); ctx.fill();
  ctx.fillStyle = "#1a1416"; ctx.fillRect(cx - 2, top - 32, 4, 34);
  const cols = [PAL.bulb, PAL.candy, PAL.poison, "#b46cff"];
  for (const side of [-1, 1]) for (let i = 0; i <= 10; i++) {
    const k = i / 10, x = cx + side * half * k, y = top + (base - H * 0.14 - top) * k;
    const dead = hash(i, side + 3) < 0.3, on = !dead && Math.sin(t * 1.3 + i * 1.7 + side) > -0.5;
    if (on) { ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite(cols[i % 4]), x - 12, y - 12, 24, 24); ctx.globalAlpha = 1; }
    circle(ctx, x, y, 3, on ? cols[i % 4] : "#2a2420");
  }
}

/* The title: something waits behind the big top, and it has been painted. */
export function renderTitle(ctx, W, H, t, view) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  bigTop(ctx, W, H, t);
  // the face, huge, rising over the tent from the dark; lit from below by the bulbs
  // so big it fills the sky behind the menu: the grin spills out past both sides of it
  const r = Math.min(W * 0.32, H * 0.55);
  const breathe = Math.sin(t * 0.6) * r * 0.015;
  const tilt = Math.sin(t * 0.23) * 0.05 + (((t * 0.29) % 1) < 0.025 ? 0.1 : 0);
  ctx.save();
  bigFace(ctx, W / 2, H * 0.4 + breathe, r, t, { paint: 1, jaw: 1, hollow: 1, seed: 5, tilt, skin: "#8e8678", shirt: "#1a1416" });
  ctx.restore();
  ctx.fillStyle = "rgba(7,6,10,.38)"; ctx.fillRect(0, 0, W, H); // it is mostly in the dark
  // darkness eating the brow, a bulb-light from below
  const top = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  top.addColorStop(0, "rgba(7,6,10,.85)"); top.addColorStop(0.5, "rgba(7,6,10,.2)"); top.addColorStop(1, "rgba(7,6,10,0)");
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, H * 0.4);
  // its eyes burn through whatever is in front of them
  ctx.globalCompositeOperation = "lighter";
  for (const s2 of [-1, 1]) {
    const ex = W / 2 + Math.cos(tilt) * s2 * r * 0.37, ey = H * 0.4 + breathe - r * 0.22 + Math.sin(tilt) * s2 * r * 0.37;
    ctx.globalAlpha = 0.6 + 0.2 * Math.sin(t * 1.7 + s2); ctx.drawImage(glowSprite("#ffe6a0"), ex - r * 0.18, ey - r * 0.18, r * 0.36, r * 0.36);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  const under = ctx.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.5, r * 2.2);
  under.addColorStop(0, `rgba(255,120,60,${0.14 + 0.05 * Math.sin(t * 2.1)})`); under.addColorStop(1, "rgba(255,120,60,0)");
  ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = under; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
  // the big top again in front of its chin
  const cx = W / 2, half = Math.min(W * 0.46, H * 0.62);
  ctx.fillStyle = "#120b0e"; ctx.beginPath(); ctx.moveTo(cx, H * 0.5); ctx.lineTo(cx - half, H * 0.86); ctx.lineTo(cx - half, H); ctx.lineTo(cx + half, H); ctx.lineTo(cx + half, H * 0.86); ctx.fill();
  // fog bands
  for (let i = 0; i < 3; i++) {
    const y = H * (0.72 + i * 0.1) + Math.sin(t * 0.3 + i) * 8;
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 40); g.addColorStop(0, "rgba(90,70,80,0)"); g.addColorStop(0.5, "rgba(90,70,80,.12)"); g.addColorStop(1, "rgba(90,70,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 80);
  }
  // a few of the Unwilling at the treeline, standing very still
  for (let i = 0; i < 4; i++) {
    const x = W * (0.08 + i * 0.27) + (i % 2) * 30, y = H * 0.95;
    ctx.save(); ctx.translate(x, y); ctx.scale(1.1, 1.1); ctx.globalAlpha = 0.6;
    ENTITY_ART.unwilling(ctx, { id: i, t: 0, vx: 0, vy: 0, alert: (Math.sin(t * 0.5 + i * 2) > 0.6) ? 1 : 0, stun: 0, hitFlash: 0, face: Math.PI / 2 }, t, view);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  vignette(ctx, W, H, 0.3);
}

function vignette(ctx, W, H, d) {
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.45 - d * 0.2), W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(10,0,4,.9)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

/* The lose screen: the guest's face, painted over the course of four seconds
   into one of the Unwilling. Kept in the top ~half; the lost text sits below. */
export function renderCaught(ctx, W, H, t, view, cause) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = "#0a0306"; ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, t / 4), ease = k * k * (3 - 2 * k);
  const cx = W / 2, cy = H * 0.2, r = Math.min(W * 0.2, H * 0.11);
  // one bulb overhead
  const sg = ctx.createRadialGradient(cx, cy - r, r * 0.2, cx, cy, r * 3.2);
  sg.addColorStop(0, `rgba(246,210,122,${0.22 + ease * 0.12})`); sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  // whoever did it stands behind you, out of focus
  if (cause && ENEMIES[cause] && ease > 0.15) {
    ctx.save(); ctx.globalAlpha = 0.3 * ease; ctx.translate(cx + r * 2.2, cy + r * 3.4); ctx.scale(r / 9.5, r / 9.5);
    (ENTITY_ART[cause] || ENTITY_ART.unwilling)(ctx, { id: 2, t: 0, vx: 0, vy: 0, alert: 1, stun: 0, hitFlash: 0, face: Math.PI, phase: 3, aim: Math.PI }, t, view);
    ctx.restore();
  }
  const skin = lerpColor("#e2c09e", "#a49c8c", ease);
  bigFace(ctx, cx, cy, r, t, { paint: ease, jaw: clamp(ease * 1.3 - 0.2, 0, 1), hollow: clamp(ease * 1.4 - 0.3, 0, 1), skin, shirt: "#2f5560", hair: "#3a2418", seed: 9, tilt: Math.sin(t * 0.7) * 0.03 * (1 - ease) });
  // the brush still working
  if (k < 1) {
    ctx.strokeStyle = `rgba(240,234,220,${0.5 * (1 - k)})`; ctx.lineWidth = r * 0.22; ctx.lineCap = "round";
    const by = cy - r + k * r * 2.2; ctx.beginPath(); ctx.moveTo(cx - r * 0.9, by); ctx.lineTo(cx + r * 0.9, by + r * 0.12); ctx.stroke();
    ctx.fillStyle = "#3a2418"; ctx.save(); ctx.translate(cx + r * 0.9 + 8, by + r * 0.1); ctx.rotate(-0.6); ctx.fillRect(0, -3, r * 0.9, 6); ctx.fillStyle = "#c9c0b0"; ctx.fillRect(-r * 0.15, -4, r * 0.18, 8); ctx.restore();
  }
  vignette(ctx, W, H, 0.5);
}

/* The win screen: the gate behind you, the road ahead; the bulbs turn. */
export function renderWin(ctx, W, Hfull, t, view) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, Hfull); sky.addColorStop(0, "#05070c"); sky.addColorStop(0.5, "#0c1014"); sky.addColorStop(1, "#0a120c");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Hfull);
  ctx.fillStyle = "#0b140b"; ctx.fillRect(0, Hfull * 0.5, W, Hfull * 0.5);
  const H = Hfull * 0.52;
  for (let i = 0; i < 90; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H * 0.5; ctx.fillStyle = `rgba(232,220,196,${0.25 + 0.3 * Math.sin(t + i)})`; ctx.fillRect(x, y, 1, 1); }
  // the first grey of morning at the horizon
  const dawn = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.58); dawn.addColorStop(0, "rgba(90,70,90,0)"); dawn.addColorStop(1, `rgba(120,90,100,${Math.min(0.3, t * 0.03)})`);
  ctx.fillStyle = dawn; ctx.fillRect(0, H * 0.35, W, H * 0.23);
  ctx.fillStyle = "#14130f"; ctx.beginPath(); ctx.moveTo(W * 0.48, H * 0.55); ctx.lineTo(W * 0.52, H * 0.55); ctx.lineTo(W * 0.8, H); ctx.lineTo(W * 0.2, H); ctx.fill();
  ctx.fillStyle = "#0b140b"; ctx.fillRect(0, H * 0.55, W * 0.48, H * 0.45); ctx.fillRect(W * 0.52, H * 0.55, W * 0.48, H * 0.45);
  for (let i = 0; i < 26; i++) { const x = hash(i, 9) * W + Math.sin(t * 0.7 + i) * 14, y = H * 0.6 + hash(i, 8) * H * 0.38 + Math.cos(t * 0.9 + i) * 8; circle(ctx, x, y, 1.6, `rgba(220,255,140,${0.4 + 0.4 * Math.sin(t * 2 + i * 3)})`); }
  // the gate behind, small, at the horizon; tent peaks behind it
  const gx = W / 2, gy = H * 0.55;
  ctx.fillStyle = "#140c10"; for (const [dx, h] of [[-90, 40], [-55, 60], [60, 52], [95, 34]]) { ctx.beginPath(); ctx.moveTo(gx + dx - 26, gy); ctx.lineTo(gx + dx, gy - h); ctx.lineTo(gx + dx + 26, gy); ctx.fill(); }
  ctx.fillStyle = "#1a1012"; ctx.fillRect(gx - 40, gy - 50, 6, 50); ctx.fillRect(gx + 34, gy - 50, 6, 50);
  ctx.strokeStyle = "#1a1012"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gx, gy - 50, 37, Math.PI, TAU); ctx.stroke();
  const turned = Math.min(12, Math.floor(t * 1.4));
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + (i / 11) * Math.PI, x = gx + Math.cos(a) * 37, y = gy - 50 + Math.sin(a) * 37;
    if (i < turned) { ctx.globalAlpha = 0.6; ctx.drawImage(glowSprite(PAL.bulb), x - 9, y - 9, 18, 18); ctx.globalAlpha = 1; circle(ctx, x, y, 3, PAL.bulbHot); circle(ctx, x, y + 0.5, 1.2, "#3a0a0a"); }
    else circle(ctx, x, y, 2.5, "#4a3a20");
  }
  if (turned >= 12) {
    const k = Math.min(1, (t - 12 / 1.4) / 3);
    const g = ctx.createLinearGradient(0, gy, 0, H); g.addColorStop(0, `rgba(246,210,122,${0.25 * k})`); g.addColorStop(1, `rgba(246,210,122,${0.08 * k})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(gx - 10, gy - 40); ctx.lineTo(gx + 10, gy - 40); ctx.lineTo(W * 0.62, H); ctx.lineTo(W * 0.38, H); ctx.fill();
  }
  // you, walking away; a long shadow ahead of you from the light behind
  ctx.save(); ctx.translate(W / 2, H * 0.92); ctx.scale(1.7, 1.7);
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(4, 40); ctx.lineTo(-4, 40); ctx.fill();
  ENTITY_ART.player(ctx, { face: -Math.PI / 2, moving: true, step: t * 3, swing: 0, invuln: 0, dashT: 0, vx: 0, vy: -60 }, t, view);
  ctx.restore();
  vignette(ctx, W, H, 0.2);
}

export function renderBackdrop(ctx, W, H, t, view) { // used behind route map / menus
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  bigTop(ctx, W, H, t, 0.6);
  ctx.fillStyle = "rgba(7,6,10,.55)"; ctx.fillRect(0, 0, W, H);
}

/** Draw an icon into a standalone canvas element (HUD/inventory/route map). */
export function paintIcon(canvas, id, cssSize = 40) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = cssSize * dpr; canvas.height = cssSize * dpr;
  const c = canvas.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, cssSize / 2 * dpr, cssSize / 2 * dpr);
  c.clearRect(-cssSize, -cssSize, cssSize * 2, cssSize * 2);
  if (ICONS[id]) ICONS[id](c, cssSize * 0.85, 0);
  else if (ENTITY_ART[id]) {
    c.translate(0, cssSize * 0.4);
    const e = { t: 0, vx: 0, vy: 0, stun: 0, hitFlash: 0, alert: 1, face: Math.PI / 2, phase: 0, bob: 0, spin: 0, id: 1, ang: -0.6, age: 0, r: 10, open: 0, progress: 0 };
    const sc = { eli: 0.95, teacup: 0.5, horse: 0.42, barker: 0.42, tobias: 0.55, dunk: 0.6, gate: 0.6 }[id] || 0.62;
    c.scale(sc * cssSize / 40, sc * cssSize / 40); ENTITY_ART[id](c, e, 0, {});
  }
}
