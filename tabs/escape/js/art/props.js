/* art/props.js — weapon icons, pickups, projectiles, the rabbits and every
 * obstacle on the grounds. ENTITY_ART signatures: (ctx, e, t, view), ctx at the feet. */
import { TAU, PAL, clamp, hash, ellipse, circle, shadow, limb, line, glowSprite } from "./util.js";
import { paintedHead, glint } from "./figures.js"; // call-time only, so the import cycle with figures.js is safe

/* ================================================================ icons (HUD + pickups + held) */
export const ICONS = {
  fork(ctx, s) {
    ctx.save(); ctx.rotate(-0.6); const k = s / 32;
    ctx.fillStyle = "#8a7a5a"; ctx.fillRect(-1.8 * k, 0, 3.6 * k, 15 * k);              // wooden grip
    ctx.fillStyle = "#c9c2b0"; ctx.fillRect(-1.2 * k, -6 * k, 2.4 * k, 8 * k);
    ctx.fillStyle = "#e9e2d0"; ctx.fillRect(-5 * k, -6 * k, 10 * k, 2.4 * k);
    ctx.fillRect(-5 * k, -16 * k, 2.2 * k, 11 * k); ctx.fillRect(2.8 * k, -16 * k, 2.2 * k, 11 * k);
    ctx.beginPath(); ctx.moveTo(-5 * k, -16 * k); ctx.lineTo(-3.9 * k, -19 * k); ctx.lineTo(-2.8 * k, -16 * k); ctx.moveTo(2.8 * k, -16 * k); ctx.lineTo(3.9 * k, -19 * k); ctx.lineTo(5 * k, -16 * k); ctx.fill();
    // a twist of funnel cake still speared on it, powdered sugar
    ctx.strokeStyle = "#c9873f"; ctx.lineWidth = 2.4 * k; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7 * k, -11 * k); ctx.bezierCurveTo(-2 * k, -15 * k, 2 * k, -7 * k, 7 * k, -12 * k); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -10 * k, 3.4 * k, 0.5, 5.2); ctx.stroke();
    ctx.fillStyle = "#fff"; for (let i = 0; i < 6; i++) ctx.fillRect((-6 + i * 2.4) * k, (-13 + (i % 3) * 1.6) * k, 1.1 * k, 1.1 * k);
    ctx.fillStyle = "rgba(140,10,20,.8)"; ctx.fillRect(-4.6 * k, -18 * k, 1.2 * k, 3 * k); // one tine has been used
    ctx.restore();
  },
  hat(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#4a2a12"; ctx.beginPath(); ctx.ellipse(0, 5 * k, 15.5 * k, 5.5 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#7a4a1e"; ctx.beginPath(); ctx.ellipse(0, 4 * k, 15 * k, 4.6 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#9c6028"; ctx.beginPath(); ctx.moveTo(-8 * k, 4 * k); ctx.bezierCurveTo(-10 * k, -8 * k, -4 * k, -11 * k, 0, -7 * k); ctx.bezierCurveTo(4 * k, -11 * k, 10 * k, -8 * k, 8 * k, 4 * k); ctx.fill();
    ctx.fillStyle = "#6a3a14"; ctx.beginPath(); ctx.moveTo(-1 * k, -7 * k); ctx.lineTo(1 * k, -7 * k); ctx.lineTo(0.5 * k, 2 * k); ctx.lineTo(-0.5 * k, 2 * k); ctx.fill(); // crease
    ctx.fillStyle = PAL.candy; ctx.fillRect(-8.4 * k, -0.5 * k, 16.8 * k, 3 * k);
    ctx.fillStyle = "#f6d27a"; for (let i = 0; i < 4; i++) ctx.fillRect((-7 + i * 4.4) * k, 0.2 * k, 1.4 * k, 1.4 * k); // studs
    circle(ctx, 4.5 * k, -4 * k, 1 * k, "#140a04"); // a hole clean through it
  },
  candy(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#e8dcc4"; ctx.beginPath(); ctx.moveTo(-2 * k, 15 * k); ctx.lineTo(2 * k, 15 * k); ctx.lineTo(1 * k, 0); ctx.lineTo(-1 * k, 0); ctx.fill();
    for (const [x, y, r, c] of [[-6, -5, 7, "#ff9ae0"], [6, -6, 7, "#ff7ad9"], [0, -12, 7.5, "#ffc2ee"], [0, -3, 6.5, "#ff5fc8"], [-3, -10, 4, "#ffd8f4"]]) circle(ctx, x * k, y * k, r * k, c);
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 0.7 * k; ctx.beginPath(); ctx.arc(2 * k, -7 * k, 5 * k, 3.5, 5.5); ctx.stroke();
    circle(ctx, -3 * k, -8 * k, 1.3 * k, "#1a0010"); circle(ctx, 3 * k, -8 * k, 1.3 * k, "#1a0010"); // it looks at you
    ctx.strokeStyle = "#1a0010"; ctx.lineWidth = 0.9 * k; ctx.beginPath(); ctx.arc(0, -5 * k, 2.4 * k, 0.3, Math.PI - 0.3); ctx.stroke();
  },
  rings(ctx, s) {
    const k = s / 32;
    for (const [x, y, c, d] of [[-5, 4, "#7af0ff", "#2a8a9a"], [5, 4, "#ff2a4d", "#8a1020"], [0, -5, "#f6d27a", "#9a7a20"]]) {
      ctx.lineWidth = 3.6 * k; ctx.strokeStyle = d; ctx.beginPath(); ctx.ellipse(x * k, y * k + 0.8 * k, 7.5 * k, 6.5 * k, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2.6 * k; ctx.strokeStyle = c; ctx.beginPath(); ctx.ellipse(x * k, y * k, 7.5 * k, 6.5 * k, 0, 0, TAU); ctx.stroke();
    }
  },
  popcorn(ctx, s) {
    const k = s / 32;
    for (let i = 0; i < 9; i++) { const x = (-8 + (i % 4) * 5.4) * k, y = (-10 + ((i / 4) | 0) * 3.6 + (i % 2) * 2) * k; circle(ctx, x, y, 3.8 * k, i % 3 ? "#fff8d8" : "#ffe58a"); circle(ctx, x - 1 * k, y - 1 * k, 1.6 * k, "#fff"); }
    ctx.fillStyle = "#f2ead8"; ctx.beginPath(); ctx.moveTo(-10 * k, -6 * k); ctx.lineTo(10 * k, -6 * k); ctx.lineTo(7 * k, 14 * k); ctx.lineTo(-7 * k, 14 * k); ctx.fill();
    ctx.fillStyle = PAL.candy; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((-8.5 + i * 6.5) * k, -6 * k); ctx.lineTo((-5.5 + i * 6.5) * k, -6 * k); ctx.lineTo((-3.5 + i * 5) * k, 14 * k); ctx.lineTo((-6 + i * 5) * k, 14 * k); ctx.fill(); }
    ctx.fillStyle = "#1a0306"; ctx.font = `bold ${6 * k}px Georgia, serif`; ctx.textAlign = "center"; ctx.fillText("BANG", 0, 6 * k);
    ctx.strokeStyle = "#ffcf5a"; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(6 * k, -12 * k); ctx.quadraticCurveTo(10 * k, -16 * k, 8 * k, -19 * k); ctx.stroke(); // fuse
    circle(ctx, 8 * k, -19 * k, 1.4 * k, "#ff8a2a");
  },
  mallet(ctx, s) {
    ctx.save(); ctx.rotate(0.6); const k = s / 32;
    ctx.fillStyle = "#c9a070"; ctx.fillRect(-1.6 * k, -4 * k, 3.2 * k, 20 * k);
    ctx.fillStyle = "#8a6040"; ctx.fillRect(-1.6 * k, 10 * k, 3.2 * k, 6 * k);
    ctx.fillStyle = PAL.candy; ctx.fillRect(-10 * k, -15 * k, 20 * k, 11 * k);
    ctx.fillStyle = "#fff"; ctx.fillRect(-10 * k, -11 * k, 20 * k, 3 * k);
    ctx.fillStyle = "#5a0a14"; ctx.fillRect(-10 * k, -15 * k, 3 * k, 11 * k); ctx.fillRect(7 * k, -15 * k, 3 * k, 11 * k);
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-7 * k, -14 * k, 14 * k, 1.4 * k);
    ctx.fillStyle = "#3a0408"; ctx.fillRect(7 * k, -6 * k, 3 * k, 2 * k); // dented, stained
    ctx.restore();
  },
  popgun(ctx, s) {
    ctx.save(); ctx.rotate(-0.5); const k = s / 32;
    ctx.fillStyle = "#7a4a22"; ctx.beginPath(); ctx.moveTo(-15 * k, 2 * k); ctx.lineTo(-4 * k, -1 * k); ctx.lineTo(-4 * k, 4 * k); ctx.lineTo(-14 * k, 7 * k); ctx.fill(); // stock
    ctx.fillStyle = "#5a3416"; ctx.fillRect(-6 * k, 1 * k, 3 * k, 5 * k);
    ctx.fillStyle = "#9a9aa8"; ctx.fillRect(-5 * k, -2 * k, 18 * k, 3 * k);   // barrel
    ctx.fillStyle = "#c8c8d4"; ctx.fillRect(-5 * k, -2 * k, 18 * k, 1 * k);
    ctx.fillStyle = "#3a3a44"; ctx.fillRect(12 * k, -2.6 * k, 2 * k, 4.2 * k);
    ellipse(ctx, 16 * k, -0.5 * k, 2.4 * k, 2 * k, "#c9a070"); ctx.fillStyle = "#a07a48"; ctx.fillRect(15 * k, -1.6 * k, 0.8 * k, 2.4 * k); // the cork
    ctx.strokeStyle = "#e8dcc4"; ctx.lineWidth = 0.5 * k; ctx.beginPath(); ctx.moveTo(16 * k, 1 * k); ctx.quadraticCurveTo(8 * k, 7 * k, 0, 2 * k); ctx.stroke(); // on a string
    ctx.fillStyle = PAL.candy; ctx.fillRect(-12 * k, 3 * k, 5 * k, 1.2 * k);
    ctx.restore();
  },
  apple(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#c9a070"; ctx.fillRect(-1 * k, -17 * k, 2 * k, 9 * k);
    circle(ctx, 0, 0, 10 * k, "#c00a22"); circle(ctx, 2 * k, 1 * k, 8 * k, "#a00818");
    circle(ctx, -3.5 * k, -3.5 * k, 3.2 * k, "rgba(255,255,255,.4)"); circle(ctx, -4.5 * k, -4.5 * k, 1.2 * k, "#fff");
    ctx.fillStyle = "#6a0010"; ctx.beginPath(); ctx.moveTo(-9 * k, 6 * k); ctx.quadraticCurveTo(0, 13 * k, 9 * k, 6 * k); ctx.lineTo(10 * k, 10 * k); ctx.quadraticCurveTo(0, 15 * k, -10 * k, 10 * k); ctx.fill(); // candy pooled at the base
    ctx.fillStyle = "#2a0006"; ctx.fillRect(3 * k, 2 * k, 1 * k, 4 * k); ctx.fillRect(5 * k, 0, 1 * k, 3 * k); // something poked through
  },
  lantern(ctx, s, t = 0) {
    const k = s / 32;
    ctx.fillStyle = "#3a3a3a"; ctx.fillRect(-6 * k, -14 * k, 12 * k, 3 * k); ctx.fillRect(-7 * k, 10 * k, 14 * k, 3 * k);
    ctx.strokeStyle = "#5a5040"; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(0, -15 * k, 4 * k, Math.PI, TAU); ctx.stroke();
    ctx.fillStyle = "rgba(198,255,106,.28)"; ctx.fillRect(-8 * k, -11 * k, 16 * k, 21 * k);
    ctx.strokeStyle = "#9c8f78"; ctx.lineWidth = k; ctx.strokeRect(-8 * k, -11 * k, 16 * k, 21 * k);
    for (let i = 0; i < 5; i++) { const x = Math.sin(t * 2 + i * 2) * 5 * k, y = Math.cos(t * 1.7 + i) * 7 * k; circle(ctx, x, y, 2.6 * k, "rgba(230,255,140,.35)"); circle(ctx, x, y, 1.3 * k, "#f4ffb0"); }
  },
};

/* ================================================================ pickups & projectiles */
export const PROPS = {
  pickup(ctx, e, t) {
    const b = Math.sin(t * 3 + (e.bob || 0)) * 3;
    ellipse(ctx, 0, 0, 9 - b * 0.5, 3.6, "rgba(0,0,0,.5)");
    const col = (e.def && e.def.color) || (e.item === "apple" ? "#ff3b3b" : e.item === "lantern" ? "#c6ff6a" : PAL.bulb);
    const r = 20 + Math.sin(t * 2 + (e.bob || 0)) * 2;
    ctx.globalAlpha = 0.9; ctx.drawImage(glowSprite(col), -r, -14 + b - r, r * 2, r * 2); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(0, -14 + b);
    const id = e.weapon || e.item;
    if (ICONS[id]) ICONS[id](ctx, 22, t); else circle(ctx, 0, 0, 6, col);
    ctx.restore();
    if (e.weapon) { const a = t * 2.2 + (e.bob || 0); ctx.fillStyle = "#fff"; ctx.save(); ctx.translate(Math.cos(a) * 12, -14 + b + Math.sin(a) * 7); ctx.rotate(a); ctx.fillRect(-2, -0.5, 4, 1); ctx.fillRect(-0.5, -2, 1, 4); ctx.restore(); }
  },
  hat(ctx, e) {
    ellipse(ctx, 0, 0, 9, 3, "rgba(0,0,0,.4)");
    ctx.save(); ctx.translate(0, -12); ctx.scale(1, 0.75); ctx.rotate(e.rot || 0); ICONS.hat(ctx, 24); ctx.restore();
    ctx.strokeStyle = "rgba(255,230,180,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -12, 14, 6, 0, (e.rot || 0), (e.rot || 0) + 2); ctx.stroke();
  },
  ring(ctx, e) {
    ellipse(ctx, 0, 0, 6, 2, "rgba(0,0,0,.4)");
    ctx.lineWidth = 3.4; ctx.strokeStyle = "#2a8a9a"; ctx.beginPath(); ctx.ellipse(0, -9, 7.5, 4.6, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.strokeStyle = PAL.cyan; ctx.beginPath(); ctx.ellipse(0, -10, 7.5, 4.6, 0, 0, TAU); ctx.stroke();
  },
  candy(ctx, e) {
    const h = Math.sin(((e.age || 0) / (e.life || 1)) * Math.PI) * 18;
    ellipse(ctx, 0, 0, 7, 2.5, "rgba(0,0,0,.4)");
    ctx.save(); ctx.translate(0, -10 - h); ctx.rotate(e.rot || 0);
    circle(ctx, 0, 0, 8, "#ff9ae0"); circle(ctx, -3, -3, 4.5, "#ffc2ee"); circle(ctx, 4, 2, 3.5, "#ff5fc8");
    ctx.restore();
  },
  cork(ctx, e) {
    ellipse(ctx, 0, 0, 4, 1.6, "rgba(0,0,0,.4)");
    const a = Math.atan2(e.vy || 0, e.vx || 1);
    ctx.save(); ctx.translate(0, -12); ctx.rotate(a);
    ctx.strokeStyle = "rgba(232,220,196,.5)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-12, 3, -22, 0); ctx.stroke();
    ctx.fillStyle = "rgba(255,240,200,.25)"; ctx.fillRect(-14, -1.5, 10, 3);
    ctx.fillStyle = "#c9a070"; ctx.beginPath(); ctx.moveTo(-3, -2.4); ctx.lineTo(3, -3); ctx.lineTo(3, 3); ctx.lineTo(-3, 2.4); ctx.fill();
    ctx.fillStyle = "#a07a48"; ctx.fillRect(2.4, -3, 0.8, 6);
    ctx.restore();
  },
};

/* ================================================================ the rabbits: morphed */
PROPS.rabbit = function rabbit(ctx, e, t) {
  const sp = Math.hypot(e.vx || 0, e.vy || 0), air = clamp((sp - 60) / 360, 0, 1);
  const stun = (e.stun || 0) > 0, alert = (e.alert || 0) > 0;
  shadow(ctx, 11 - air * 3, 4, 0.5);
  const flash = (e.hitFlash || 0) > 0, C = (c) => (flash ? "#fff0ea" : c);
  ctx.save(); ctx.translate(0, -air * 16);
  if (stun) ctx.rotate(Math.sin(t * 8) * 0.25);
  const dir = Math.cos(e.face || 0) >= 0 ? 1 : -1; ctx.scale(dir, 1);
  const tw = Math.sin(t * 23 + (e.id || 0)) > 0.6 ? 1 : 0; // nose twitch, still
  // hind legs: far too long, jointed backwards like something else's
  const ext = air; // 0 crouched, 1 stretched out behind
  for (const [o, col] of [[1.5, "#9a7470"], [-1, "#b88a84"]]) {
    const hipX = -6 + o, hipY = -9;
    const footX = -8 - ext * 18 + o, footY = ext * 4 - 0.5;
    const kneeX = hipX + 7 - ext * 4, kneeY = -18 + ext * 8;
    ctx.strokeStyle = C(col); ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(kneeX, kneeY); ctx.stroke();
    ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(kneeX, kneeY); ctx.lineTo(footX + 3, footY - 4); ctx.lineTo(footX, footY); ctx.stroke();
    ctx.strokeStyle = C("#3a2020"); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(footX, footY); ctx.lineTo(footX - 3, footY + 0.6); ctx.moveTo(footX, footY); ctx.lineTo(footX - 2.4, footY - 1.2); ctx.stroke(); // toes, clawed
  }
  // front legs: thin, almost hands
  for (const o of [0, 2.5]) {
    const reach = ext * 8;
    limb(ctx, 6 + o, -9, 8 + o + reach, -0.5 - ext * 3, 1.5, 1.6, C(o ? "#b88a84" : "#9a7470"));
    ctx.strokeStyle = C("#e8d0c8"); ctx.lineWidth = 0.6; ctx.beginPath(); for (let f = -1; f <= 1; f++) { ctx.moveTo(8 + o + reach, -0.5 - ext * 3); ctx.lineTo(9.5 + o + reach + f * 0.6, 0.6 - ext * 3); } ctx.stroke();
  }
  // body: lumpy, patchy, opened and sewn shut
  ctx.save(); ctx.rotate(-ext * 0.25);
  ellipse(ctx, 0, -11, 12, 7.5, C("#cfb0a8"));
  circle(ctx, -6, -14, 4.6, C("#dcc0b8")); circle(ctx, 4, -15, 3.8, C("#c09a92"));
  ellipse(ctx, -2, -8, 8, 3, "rgba(0,0,0,.18)");
  ctx.fillStyle = "rgba(130,60,70,.55)"; ctx.beginPath(); ctx.ellipse(1, -12, 3.5, 2.5, 0.4, 0, TAU); ctx.fill(); // bald patch, raw
  ctx.strokeStyle = C("#e8d4cc"); ctx.lineWidth = 0.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-3 + i * 0.4, -10, 3 + i * 1.6, 0.3, 1.4); ctx.stroke(); } // ribs under the skin
  ctx.strokeStyle = "#5a0a10"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-8, -15); ctx.lineTo(4, -17); ctx.stroke();
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-7 + i * 2.6, -16.5 - i * 0.2); ctx.lineTo(-6.4 + i * 2.6, -14.8 - i * 0.2); ctx.stroke(); } // stitches
  circle(ctx, -12, -12, 3, C("#f0e0dc")); circle(ctx, -13, -13, 1.4, C("#fff"));
  ctx.restore();
  // head: long skull, split mouth with too many teeth
  const hx = 11 + ext * 3, hy = -17 + ext * 2;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.15 + ext * 0.2);
  ellipse(ctx, 0, 0, 7.5, 5, C("#dcc0b8"));
  ellipse(ctx, 5, 1.5, 4, 3, C("#cfb0a8"));
  // ears: long, and they branch
  const earSw = Math.sin(t * 3 + (e.id || 0)) * 0.1 + ext * 0.6;
  for (const [ex, a, col] of [[-3, -0.35 - earSw, "#c09a92"], [0, 0.05 - earSw, "#dcc0b8"]]) {
    ctx.save(); ctx.translate(ex, -3); ctx.rotate(a);
    ctx.fillStyle = C(col); ctx.beginPath(); ctx.ellipse(0, -9, 2, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#b45a6a"; ctx.beginPath(); ctx.ellipse(0, -9, 0.9, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = C(col); ctx.lineWidth = 1.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-4, -18); ctx.lineTo(-6, -19); ctx.moveTo(0, -16); ctx.lineTo(3, -22); ctx.moveTo(-4, -18); ctx.lineTo(-3.5, -22); ctx.stroke();
    ctx.restore();
  }
  // gold eyes, goat pupils
  for (const [x, y, r] of [[1.5, -1.5, 2.2], [-2.5, -0.5, 1.4]]) {
    circle(ctx, x, y, r, "#d8a020"); circle(ctx, x, y, r * 0.65, "#f4c430");
    ctx.fillStyle = "#120806"; ctx.fillRect(x - r * 0.8, y - r * 0.2, r * 1.6, r * 0.4);
  }
  if (alert) { const m = ctx.getTransform(); void m; }
  // nose
  circle(ctx, 9 + tw * 0.6, 0.5, 1.2, "#7a3040");
  // mouth split back to the cheek, rows of small human teeth
  ctx.fillStyle = "#2a0408"; ctx.beginPath(); ctx.moveTo(8.5, 2); ctx.quadraticCurveTo(3, 4.5, -2, 3); ctx.quadraticCurveTo(3, 7 + ext * 3, 8.5, 3.6); ctx.fill();
  ctx.fillStyle = "#efe6cc"; for (let i = 0; i < 6; i++) { ctx.fillRect(7.5 - i * 1.5, 2.6 + i * 0.15, 0.9, 1.2); ctx.fillRect(7.3 - i * 1.5, 4.3 + i * 0.2 + ext * 1.5, 0.9, 1.1); }
  ctx.restore();
  if (stun) { for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; circle(ctx, Math.cos(a) * 9, -30 + Math.sin(a) * 3, 1.5, [PAL.bulb, PAL.pink, PAL.poison][i]); } }
  ctx.restore();
};

/* ================================================================ obstacles */
PROPS.teacup = function teacup(ctx, e, t) {
  const spin = e.spin || 0, id = e.id || 0;
  // what has slopped over the rim: a dark pool under the saucer, dragged round by the spin
  ellipse(ctx, 0, 5, 34, 14, "rgba(0,0,0,.6)");
  ellipse(ctx, 6, 7, 22, 7, "rgba(70,4,12,.75)");
  // the saucer: yellowed, cracked, rimmed with old blood
  ellipse(ctx, 0, 0, 31, 14.5, "#a89c84"); ellipse(ctx, 0, -1, 28.5, 12.6, "#c8bca2"); ellipse(ctx, 0, -1, 24, 10.4, "#9c8e74");
  ctx.fillStyle = "rgba(90,6,16,.85)"; ctx.beginPath(); ctx.ellipse(0, -1, 26, 11.4, 0, spin * 0.5, spin * 0.5 + 2.4); ctx.ellipse(0, -1, 22, 9.4, 0, spin * 0.5 + 2.4, spin * 0.5, true); ctx.fill();
  ctx.strokeStyle = "rgba(30,18,12,.85)"; ctx.lineWidth = 0.9;
  for (let i = 0; i < 4; i++) { const a = spin * 0.3 + i * 1.6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 6); ctx.lineTo(Math.cos(a + 0.25) * 22, Math.sin(a + 0.25) * 9.5); ctx.lineTo(Math.cos(a + 0.1) * 30, Math.sin(a + 0.1) * 13.6); ctx.stroke(); }
  // drips off the front lip of the saucer
  ctx.fillStyle = "#6e0714";
  for (let i = 0; i < 4; i++) { const x = -18 + i * 11 + hash(id, i, 1) * 4, len = 2 + ((t * 2.2 + hash(id, i, 2) * 3) % 4); ctx.fillRect(x, 11 + Math.abs(x) * -0.08, 1.4, len); circle(ctx, x + 0.7, 11 + len - Math.abs(x) * 0.08, 1, "#6e0714"); }
  // the cup: faded pink gone grey with grime, gradient-shaded
  const g = ctx.createLinearGradient(-23, 0, 23, 0);
  g.addColorStop(0, "#8a4a5e"); g.addColorStop(0.35, "#b05a78"); g.addColorStop(0.7, "#7a3248"); g.addColorStop(1, "#3a1420");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-23, -14); ctx.bezierCurveTo(-22, 6, -10, 9, 0, 9); ctx.bezierCurveTo(10, 9, 22, 6, 23, -14); ctx.fill();
  // grime runs down from the rim
  ctx.fillStyle = "rgba(30,14,10,.35)";
  for (let i = 0; i < 7; i++) { const x = -20 + i * 6.5 + hash(id, i, 3) * 2; ctx.fillRect(x, -13, 1.6, 6 + hash(id, i, 4) * 12); }
  // polka dots: dirty, half gone
  for (let i = 0; i < 7; i++) { const a = spin + (i * TAU) / 7, c = Math.cos(a); if (c < -0.15) continue; const x = Math.sin(a) * 18, y = -4 + (i % 2) * 5; circle(ctx, x, y, 2.6 * (0.45 + c * 0.55), i === 3 || i === 5 ? "#5a4a48" : "#c8b880"); }
  // a crack straight down the cup, and it is leaking
  ctx.strokeStyle = "#140406"; ctx.lineWidth = 1.6; ctx.lineJoin = "miter";
  ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-3, -8); ctx.lineTo(-7, -3); ctx.lineTo(-4, 2); ctx.lineTo(-6, 8); ctx.stroke();
  ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(1, -6); ctx.moveTo(-7, -3); ctx.lineTo(-11, -1); ctx.stroke();
  ctx.fillStyle = "#8a0a1c"; ctx.fillRect(-5, -2, 1.6, 9 + ((t * 1.5) % 3)); ctx.fillRect(-7, 3, 1.2, 6);
  // the rim, gilt flaked to black, a bite of china gone from it
  ctx.fillStyle = "#6a5020"; ctx.fillRect(-23, -15.5, 46, 2);
  ellipse(ctx, 0, -14, 23, 8, "#d8c8b0"); ellipse(ctx, 0, -14, 20.5, 6.6, "#22040a");
  // it is not tea: thick, dark, turning slowly, a skin on it
  ellipse(ctx, 0, -13.6, 18.5, 5.6, "#4a0610");
  ctx.strokeStyle = "rgba(200,60,80,.45)"; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(0, -13.6, 12, 3.4, 0, spin * 2, spin * 2 + 2.2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -13.6, 6, 1.8, 0, -spin * 2.6, -spin * 2.6 + 2); ctx.stroke();
  for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; circle(ctx, -10 + i * 6, -13 - k * 0.6, 0.6 + k * 1.1, `rgba(150,20,40,${0.8 - k * 0.8})`); } // bubbles
  // chipped notch, the broken china showing
  ctx.fillStyle = "#e8dcc8"; ctx.beginPath(); ctx.moveTo(13, -19.4); ctx.lineTo(16, -15.5); ctx.lineTo(19, -18.6); ctx.fill();
  ctx.fillStyle = "#22040a"; ctx.beginPath(); ctx.moveTo(13.5, -19.2); ctx.lineTo(16, -16.6); ctx.lineTo(18.4, -18.8); ctx.fill();
  // the handle, swinging round
  const ha = spin % TAU, hx = Math.sin(ha) * 24, front = Math.cos(ha) > 0;
  if (front) { ctx.strokeStyle = "#7a3248"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, -5, 5, 0, TAU); ctx.stroke(); ctx.strokeStyle = "rgba(20,8,6,.5)"; ctx.lineWidth = 1; ctx.stroke(); }
  // a second hand comes up out of it, fingers hooked on the far rim
  ctx.strokeStyle = "#8a8276"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
  const cl = Math.sin(t * 1.3 + id) * 0.6;
  for (let i = 0; i < 4; i++) { const x = -15 + i * 2.2; ctx.beginPath(); ctx.moveTo(x, -13); ctx.lineTo(x - 0.5, -18.5 + cl * (i % 2)); ctx.lineTo(x + 0.6, -20.2 + cl); ctx.stroke(); }
  ctx.fillStyle = "#5a0a14"; ctx.fillRect(-16, -14.4, 8, 1.6);
  // the rider: slumped against the rim, head lolled, one long arm hanging over the side
  ctx.fillStyle = "#1a0a10"; ctx.beginPath(); ctx.ellipse(5, -18, 8.5, 6, -0.2, 0, TAU); ctx.fill(); // shoulders, a nightshirt gone black
  ctx.fillStyle = "#3a2a30"; ctx.fillRect(10, -20, 3, 3);
  // the arm over the front: elbow on the rim, the forearm down the outside, fingers too long
  ctx.strokeStyle = "#1a0a10"; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(9, -18); ctx.lineTo(12, -13); ctx.stroke();
  ctx.strokeStyle = "#8a8276"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(12, -13); ctx.lineTo(13.5, -3); ctx.stroke();
  ctx.lineWidth = 0.9; const sw = Math.sin(t * 1.1 + id) * 0.8;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(13.5, -3); ctx.lineTo(12 + i * 1.2 + sw * 0.3, 2); ctx.lineTo(12.4 + i * 1.3 + sw, 5.5 + (i % 2)); ctx.stroke(); }
  ctx.fillStyle = "#8a0a1c"; ctx.fillRect(14, 4, 0.9, 3 + ((t * 2) % 3)); // running off the fingertips
  ctx.save(); ctx.translate(4, -25); ctx.rotate(0.55 + Math.sin(t * 0.8 + id) * 0.06);
  paintedHead(ctx, 6.2, { id: id + 3, alert: 1 }, t, { hair: "#20140e", hairStyle: "long", jaw: 0.75, grin: 1.2 }, 0.3, false);
  ctx.restore();
};

PROPS.horse = function horse(ctx, e, t) {
  const bob = (e.bob || 0) * 5, ph = e.phase || 0, id = e.id || 0;
  shadow(ctx, 16, 5.5, 0.55);
  ellipse(ctx, 3, 1, 6, 2, "rgba(80,4,12,.7)"); // it drips where it stands
  // the pole, tarnished and greasy, running straight through it
  ctx.fillStyle = "#5a4418"; ctx.fillRect(-1.8, -80, 3.6, 80);
  ctx.strokeStyle = "#a08038"; ctx.lineWidth = 0.8; for (let y = -78; y < 0; y += 5) { ctx.beginPath(); ctx.moveTo(-1.8, y + ((t * 20) % 5)); ctx.lineTo(1.8, y + 2.5 + ((t * 20) % 5)); ctx.stroke(); }
  circle(ctx, 0, -80, 3.4, "#7a6020"); circle(ctx, -0.8, -81, 1, "#d8c080");
  ctx.save(); ctx.translate(0, -28 + bob);
  const dir = Math.cos(ph + Math.PI / 2) >= 0 ? 1 : -1; ctx.scale(dir, 1);
  const g = Math.sin(ph * 4);
  // legs: thin, the joints bending the wrong way, one snapped and dangling
  for (const [x0, a, back, broke] of [[-9, 0.5 + g * 0.3, 1, 0], [-6, 0.2 - g * 0.3, 1, 1], [8, -0.6 + g * 0.4, 0, 0], [11, -0.9 - g * 0.3, 0, 0]]) {
    ctx.save(); ctx.translate(x0, 3); ctx.rotate(a);
    ctx.strokeStyle = back ? "#a89c88" : "#d8cebc"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const kx = back ? 3.5 : -3.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(kx, 7); ctx.lineTo(broke ? kx + 4 : 0, broke ? 10 : 14); ctx.stroke();
    ctx.fillStyle = "#7a1020"; circle(ctx, kx, 7, 1.6, "#7a1020"); // the knee: paint gone, wet
    if (broke) { ctx.strokeStyle = "#e8e0cc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(kx + 4, 10); ctx.lineTo(kx + 6, 9); ctx.stroke(); }
    else { ctx.fillStyle = "#1a100a"; ctx.fillRect(-1.6, 12.6, 3.2, 2.6); }
    ctx.restore();
  }
  // tail: lank human hair
  ctx.strokeStyle = "#1a120c"; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-14, -2); ctx.quadraticCurveTo(-21 - i, -1 + g * 3, -18 - i * 0.8, 10 + i); ctx.stroke(); }
  // body: dirty bone-white, the paint flaking to bare wood
  ellipse(ctx, 0, 0, 15, 7.5, "#d8cebc");
  ellipse(ctx, 0, 2.5, 13, 4, "rgba(40,20,10,.25)");
  ctx.fillStyle = "#6a4a2a"; ctx.beginPath(); ctx.ellipse(-9, -2, 3, 1.6, 0.3, 0, TAU); ctx.fill();
  // ...and under the wood, not wood: a flayed flank, raw muscle, ribs
  ctx.fillStyle = "#5a0610"; ctx.beginPath(); ctx.ellipse(3, 1.5, 7.5, 4.6, -0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = "#9a1828"; ctx.beginPath(); ctx.ellipse(3, 1.2, 6.4, 3.6, -0.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = "rgba(255,140,150,.35)"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(-2.5 + i * 2.6, -1.8); ctx.lineTo(-1.2 + i * 2.4, 4); } ctx.stroke();
  ctx.strokeStyle = "#ece2cc"; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const x = -1.5 + i * 2.6; ctx.beginPath(); ctx.moveTo(x, -2); ctx.quadraticCurveTo(x + 1.8, 0.8, x + 0.6, 4.2); ctx.stroke(); } // ribs, curving down out of the spine
  ctx.strokeStyle = "#2a0206"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(3, 1.5, 7.5, 4.6, -0.1, 0, TAU); ctx.stroke(); // torn edge
  ctx.fillStyle = "#7a0a18"; ctx.fillRect(4, 5.5, 1, 4 + ((t * 2 + id) % 3)); ctx.fillRect(0, 5.8, 0.8, 2.5);
  // saddle: rotted velvet, torn
  ctx.fillStyle = "#5a0a1a"; ctx.beginPath(); ctx.ellipse(-3, -6, 6.5, 3.2, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-9.5, -6, 13, 4);
  ctx.fillStyle = "#8a7030"; ctx.fillRect(-9.5, -2.4, 13, 1.2);
  ctx.fillStyle = "#1a0408"; ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-3, -2.4); ctx.lineTo(-1, -6); ctx.fill();
  // the pole goes in through the back and out under the belly: a wet ring where it enters
  ctx.fillStyle = "#5a4418"; ctx.fillRect(-1.8, -9, 3.6, 8);
  ellipse(ctx, 0, -2, 3.4, 1.4, "#6e0714");
  // neck and head: thrown back, too long, a skull under the paint
  ctx.fillStyle = "#d8cebc"; ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(13, -21); ctx.lineTo(20, -18); ctx.lineTo(15, 1); ctx.fill();
  ctx.strokeStyle = "rgba(60,40,30,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = 0; i < 4; i++) { ctx.moveTo(10 + i * 1.2, -6 - i * 3.4); ctx.lineTo(16 + i * 0.6, -4 - i * 3.6); } ctx.stroke(); // neck tendons
  ctx.save(); ctx.translate(18, -20); ctx.rotate(0.5 + g * 0.08);
  ellipse(ctx, 0, 0, 5.2, 4.4, "#d8cebc");
  ctx.fillStyle = "#d8cebc"; ctx.beginPath(); ctx.moveTo(2, -3.2); ctx.lineTo(12.5, -1.6); ctx.lineTo(12, 0.6); ctx.lineTo(2, 1.4); ctx.fill(); // upper muzzle
  ctx.fillStyle = "#b8ac98"; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(11, 4.5 + g * 1.2); ctx.lineTo(10.5, 6.4 + g * 1.2); ctx.lineTo(1.5, 4.2); ctx.fill(); // the jaw, dropped too far
  // gums peeled back, a long row of human teeth top and bottom
  const jy = 4.5 + g * 1.2;
  ctx.fillStyle = "#1a0204"; ctx.beginPath(); ctx.moveTo(3, 1); ctx.lineTo(12, 0.4); ctx.lineTo(11, jy); ctx.lineTo(2.6, 3); ctx.fill();
  ctx.fillStyle = "#c0303e"; ctx.fillRect(3, 0.2, 9, 1.2); ctx.beginPath(); ctx.moveTo(2.6, 3); ctx.lineTo(11, jy); ctx.lineTo(11, jy - 1); ctx.lineTo(2.6, 2.2); ctx.fill();
  ctx.fillStyle = "#efe6cc"; for (let i = 0; i < 6; i++) { ctx.fillRect(3.4 + i * 1.4, 1.3, 1, 1.8); const by = 2.4 + (jy - 2.4) * (i / 6); ctx.fillRect(3.4 + i * 1.4, by - 1.4, 1, 1.4); }
  ctx.fillStyle = "rgba(150,10,24,.85)"; ctx.fillRect(10, jy, 0.8, 3 + ((t * 3) % 3)); ctx.fillRect(7, jy - 0.4, 0.6, 2 + ((t * 2.3) % 2));
  // nostril, and the eye: a black socket, a red pinprick that follows you
  circle(ctx, 11.2, -1, 0.7, "#1a0204");
  ctx.fillStyle = "#060203"; ctx.beginPath(); ctx.ellipse(0.6, -1, 2.4, 2, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = "#8a0a1c"; ctx.fillRect(0.4, 0.6, 0.6, 3); // a red run
  circle(ctx, 1.2, -1, 0.55, "#ff3040"); glint(ctx, 1.2, -1, 1.4, "#ff4050", 0.9);
  // ear, torn
  ctx.fillStyle = "#d8cebc"; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-1.5, -8.5); ctx.lineTo(0, -6); ctx.lineTo(1, -3.5); ctx.fill();
  ctx.restore();
  // mane: lank black hanks
  ctx.strokeStyle = "#140c08"; ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { const x = 10 + i * 1.4, y = -3 - i * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4, y + 2 + g, x - 3, y + 6); ctx.stroke(); }
  glint(ctx, 0, 0, 10, "#d8cebc", 0.08);
  ctx.restore();
};

PROPS.cookie = function cookie(ctx, e, t) {
  const id = e.id || 0, b = Math.sin(t * 2.5 + id) * 1.5, breathe = 1 + Math.sin(t * 1.6 + id) * 0.05;
  shadow(ctx, 10, 3.8, 0.55);
  ctx.save(); ctx.translate(0, -12 + b); ctx.scale(breathe, breathe);
  // steam: it is warm, like something just taken out
  ctx.strokeStyle = "rgba(200,170,255,.3)"; ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) { const o = (t * 8 + i * 5) % 12; ctx.beginPath(); ctx.moveTo(i * 4, -12 - o); ctx.quadraticCurveTo(i * 4 + 2, -15 - o, i * 4, -18 - o); ctx.stroke(); }
  // the biscuit: burnt at the edge, a bite out of it
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, 11.5, 0, TAU); ctx.arc(9, -8, 5.2, 0, TAU, true); ctx.clip("evenodd");
  circle(ctx, 0, 0, 11.5, "#4a2a10"); circle(ctx, -0.5, -0.5, 10.3, "#a06a30"); circle(ctx, -2, -2, 7, "#b47a3c");
  // the bite shows the inside: pink, wet, red jam that isn't
  ctx.restore();
  ctx.fillStyle = "#c04858"; ctx.beginPath(); ctx.arc(9, -8, 5.4, 2.0, 4.0); ctx.arc(9, -8, 4.2, 4.0, 2.0, true); ctx.fill();
  ctx.fillStyle = "#7a0a18"; ctx.beginPath(); ctx.arc(9, -8, 5.4, 2.4, 3.6); ctx.lineTo(4, -3); ctx.fill();
  ctx.fillRect(4.6, -4.5, 1, 4 + ((t * 1.7) % 3)); // dripping
  // chips like scabs; one of them moves
  for (let i = 0; i < 5; i++) { const a = i * 2.3 + 0.4; circle(ctx, Math.cos(a) * 8, Math.sin(a) * 7.5, 1.2, "#2a1206"); }
  circle(ctx, -7 + Math.sin(t * 3 + id) * 0.8, 4 + Math.cos(t * 2.4) * 0.6, 0.8, "#1a0a04");
  // the face pressed into the dough. It is yours: eyes wide, mouth stretched in a scream
  ellipse(ctx, -0.5, 0.5, 6.6, 7.6, "#d8b48a");
  ctx.strokeStyle = "rgba(60,30,10,.6)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(-0.5, 0.5, 6.6, 7.6, 0, 0, TAU); ctx.stroke();
  const look = Math.sin(t * 0.9 + id) > 0.3 ? 0.7 : Math.sin(t * 0.9 + id) < -0.5 ? -0.7 : 0; // darting
  for (const sx of [-1, 1]) {
    const ex = -0.5 + sx * 2.7, ey = -2;
    ctx.fillStyle = "#3a1a0a"; ctx.beginPath(); ctx.ellipse(ex, ey, 2.3, 2.5, 0, 0, TAU); ctx.fill(); // sunken socket
    ellipse(ctx, ex, ey, 1.7, 1.9, "#f4ecdc"); // real, wet
    circle(ctx, ex + look, ey + 0.2, 0.85, "#3a2a1a"); circle(ctx, ex + look, ey + 0.2, 0.4, "#000");
    circle(ctx, ex + look - 0.3, ey - 0.3, 0.25, "#fff");
    glint(ctx, ex, ey, 1.4, "#e8dcff", 0.55);
  }
  // purple icing tears, and brows drawn up in icing
  ctx.strokeStyle = "#c88cff"; ctx.lineWidth = 0.8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-5.5, -5.6); ctx.lineTo(-2, -4.8); ctx.moveTo(4.5, -5.6); ctx.lineTo(1, -4.8); ctx.moveTo(-3.4, 0); ctx.lineTo(-3.6, 3.2); ctx.moveTo(2.2, 0); ctx.lineTo(2.4, 2.4); ctx.stroke();
  // the mouth: torn open in the dough, teeth set in it, icing stitches across that didn't hold
  const mo = 1 + Math.sin(t * 2 + id) * 0.15;
  ctx.fillStyle = "#1a0408"; ctx.beginPath(); ctx.ellipse(-0.5, 4, 2.6, 2.8 * mo, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#efe6cc"; for (let i = -1; i <= 1; i++) { ctx.fillRect(-0.9 + i * 1.3, 1.6, 0.8, 1); ctx.fillRect(-0.9 + i * 1.3, 5.6 * mo, 0.8, 0.9); }
  ctx.strokeStyle = "#c88cff"; ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(-1 + i * 1.6, 1.2); ctx.lineTo(-0.4 + i * 1.6 + (i === 0 ? 0 : 0.6), 2.2); } ctx.stroke();
  ctx.fillStyle = "#8a0a1c"; ctx.fillRect(0.6, 6.4, 0.7, 2.2 + ((t * 1.3) % 2));
  // a crack through it all, seeping
  ctx.strokeStyle = "#2a1206"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-6.5, -3); ctx.lineTo(-7.5, 1); ctx.stroke();
  glint(ctx, 0, 0, 6, "#b46cff", 0.18);
  ctx.restore();
};

PROPS.dunk = function dunk(ctx, e, t) {
  ellipse(ctx, 0, 6, 26, 9, "rgba(0,0,0,.45)");
  ctx.fillStyle = "#3a3a44"; ctx.fillRect(-20, -32, 3, 36); ctx.fillRect(17, -32, 3, 36);
  ctx.fillStyle = "rgba(95,208,255,.18)"; ctx.fillRect(-17, -30, 34, 34);
  const wl = -15 + Math.sin(t * 2) * 1.5;
  ctx.fillStyle = "rgba(18,70,96,.82)"; ctx.fillRect(-17, wl, 34, 4 - wl);
  ctx.strokeStyle = "rgba(160,230,255,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-17, wl); for (let x = -17; x <= 17; x += 4) ctx.lineTo(x, wl + Math.sin(t * 4 + x) * 0.8); ctx.stroke();
  // someone under the water: a pale face, eyes open, hair floating
  ctx.fillStyle = "rgba(40,30,20,.6)"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 1.5, -6); ctx.quadraticCurveTo(6 + i * 2 + Math.sin(t * 1.5 + i) * 2, -14, 2 + i * 2.4, -16); ctx.lineTo(3 + i * 2.4, -16); ctx.quadraticCurveTo(7 + i * 2 + Math.sin(t * 1.5 + i) * 2, -14, 5 + i * 1.5, -6); ctx.fill(); }
  ellipse(ctx, 7, -4, 5, 6, "rgba(200,220,215,.75)");
  circle(ctx, 5.4, -5, 0.9, "#0a1418"); circle(ctx, 8.6, -5, 0.9, "#0a1418");
  ctx.fillStyle = "rgba(170,20,40,.7)"; ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(7, 0.5, 10, -2); ctx.quadraticCurveTo(7, -0.6, 4, -2); ctx.fill();
  // a hand pressed flat to the glass, sliding
  const hy = -12 + Math.sin(t * 0.7) * 4;
  ctx.fillStyle = "rgba(210,226,220,.9)"; ctx.beginPath(); ctx.ellipse(-7, hy, 3.6, 4.4, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 2, hy - 9.5, 1.4, 6);
  ctx.fillRect(-4, hy - 2, 4, 1.4);
  ctx.strokeStyle = "rgba(200,240,255,.6)"; ctx.lineWidth = 1.2; ctx.strokeRect(-17, -30, 34, 34);
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-15, -28, 2, 28);
  // seat plank + target arm
  ctx.fillStyle = "#5a4030"; ctx.fillRect(-18, -34, 36, 4);
  ctx.strokeStyle = "#8a8a96"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(31, -20); ctx.stroke();
  circle(ctx, 34, -20, 7.5, "#fff"); circle(ctx, 34, -20, 5.5, PAL.candy); circle(ctx, 34, -20, 3, "#fff"); circle(ctx, 34, -20, 1.2, PAL.candy);
};

PROPS.searchlight = function searchlight(ctx, e, t) {
  shadow(ctx, 11, 4, 0.5);
  ctx.strokeStyle = "#2a2a30"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -12); ctx.lineTo(8, 0); ctx.moveTo(0, 2); ctx.lineTo(0, -12); ctx.stroke();
  ctx.save(); ctx.translate(0, -14); ctx.rotate(e.ang || 0);
  ctx.fillStyle = "#3a3a44"; ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(6, -7); ctx.lineTo(6, 7); ctx.lineTo(-8, 5); ctx.fill();
  ctx.fillStyle = "#5a5a66"; ctx.fillRect(-8, -5, 3, 10);
  ellipse(ctx, 6, 0, 2.4, 7, e.lit ? "#ffffff" : PAL.bulbHot);
  ctx.restore();
};

PROPS.snare = function snare(ctx, e, t) {
  const life = 1 - (e.age || 0) / 6;
  ctx.globalAlpha = clamp(life * 2, 0, 1) * 0.85;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + t * 0.3, r = 26 + Math.sin(t * 2 + i) * 4;
    circle(ctx, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.55 - 6, 12 + (i % 3) * 2, i % 2 ? "#ff9ae0" : "#ffc2ee");
  }
  circle(ctx, 0, -6, 18, "#ffb3ea"); circle(ctx, -6, -12, 9, "#ffd8f4");
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 0.7;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(0, -6, 8 + i * 6, t + i, t + i + 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
};

PROPS.spawner = function spawner(ctx, e, t) {
  const open = clamp(e.open || 0, 0, 1);
  if (open <= 0) { // eyes in the dark of the flap, sometimes
    if (Math.sin(t * 0.7 + (e.id || 0)) > 0.82) { circle(ctx, -3, -16, 1.2, PAL.bulbHot); circle(ctx, 3, -16, 1.2, PAL.bulbHot); }
    return;
  }
  ctx.fillStyle = `rgba(10,0,4,${0.9 * open})`;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(-12 * open, -14, -10 * open, 0); ctx.lineTo(10 * open, 0); ctx.quadraticCurveTo(12 * open, -14, 0, -30); ctx.fill();
  ctx.globalAlpha = open * 0.6; ctx.drawImage(glowSprite("#ff2a4d"), -22, -36, 44, 44); ctx.globalAlpha = 1;
};

/* ---- the finale: the front gate, its breakers, and the jack-in-the-box ---- */
PROPS.gate = function gate(ctx, e, t) {
  // iron, painted red and gold, taller than the tents; it swings in toward you as it opens
  const open = clamp(e.open || 0, 0, 1);
  const W = 32, H = 64;
  ellipse(ctx, 0, 2, 18, 4, "rgba(0,0,0,.5)");
  ctx.fillStyle = "#3a0810"; ctx.fillRect(-W / 2 - 2.5, -H - 6, 5, H + 6); ctx.fillRect(W / 2 - 2.5, -H - 6, 5, H + 6);
  for (const px of [-W / 2, W / 2]) { circle(ctx, px, -H - 8, 3.4, "#c9a54a"); circle(ctx, px - 0.8, -H - 9, 1, "#fff0b0"); }
  const sx = 1 - open * 0.88;
  ctx.save(); ctx.translate(-W / 2 + 2.5, 0); ctx.scale(sx, 1);
  ctx.strokeStyle = "#6a0e18"; ctx.lineWidth = 2.4;
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * 6.2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -H + 6); ctx.stroke();
    ctx.fillStyle = "#c9a54a"; ctx.beginPath(); ctx.moveTo(x - 2.2, -H + 6); ctx.lineTo(x, -H - 1); ctx.lineTo(x + 2.2, -H + 6); ctx.fill();
  }
  ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(W - 5, -9); ctx.moveTo(0, -H + 12); ctx.lineTo(W - 5, -H + 12); ctx.stroke();
  // ironwork in the middle: a painted face, smiling
  ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc((W - 5) / 2, -H / 2 - 2, 8, 0, TAU); ctx.stroke();
  ctx.strokeStyle = "#d0102a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc((W - 5) / 2, -H / 2 - 3, 5, 0.3, Math.PI - 0.3); ctx.stroke();
  circle(ctx, (W - 5) / 2 - 3, -H / 2 - 5, 1, "#c9a54a"); circle(ctx, (W - 5) / 2 + 3, -H / 2 - 5, 1, "#c9a54a");
  ctx.restore();
  if (open < 0.05) { // chain and padlock, wired to the breakers
    ctx.strokeStyle = "#7a7080"; ctx.lineWidth = 1.2; ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.ellipse(-5 + i * 2, -26 + Math.abs(i - 2.5) * 1.2, 1.4, 0.9, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = "#8a7a40"; ctx.fillRect(-3, -24, 6, 6); circle(ctx, 0, -21.5, 0.9, "#1a1408");
    ctx.strokeStyle = "rgba(255,207,90,.5)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(3, -21); ctx.quadraticCurveTo(10, -6, 18, -2); ctx.stroke();
  }
  ctx.fillStyle = "rgba(160,60,30,.45)"; ctx.fillRect(-W / 2 - 2.5, -14, 5, 7);
};

PROPS.breaker = function breaker(ctx, e, t) {
  const done = !!e.done, pr = clamp(e.progress || 0, 0, 1);
  shadow(ctx, 10, 3.6, 0.5);
  ctx.fillStyle = "#3a2a1c"; ctx.fillRect(-2.5, -26, 5, 26); // post
  ctx.fillStyle = "#2a2a30"; ctx.fillRect(-8, -36, 16, 14); ctx.fillStyle = "#3a3a44"; ctx.fillRect(-8, -36, 16, 2.4);
  ctx.fillStyle = "#f6d27a"; ctx.font = "bold 5px monospace"; ctx.textAlign = "center"; ctx.fillText(["I", "II", "III", "IV"][(e.index || 0) % 4], 0, -26.5);
  // warning stripes
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#1a1a1a" : "#c9a020"; ctx.fillRect(-8 + i * 4, -24, 4, 2); }
  // the lever: up, working, thrown
  const a = done ? 1.2 : -1.0 + pr * 2.2 + (pr > 0 && !done ? Math.sin(t * 30) * 0.05 : 0);
  ctx.save(); ctx.translate(5, -30); ctx.rotate(a);
  ctx.fillStyle = "#8a8a96"; ctx.fillRect(-1, -12, 2, 12); circle(ctx, 0, -12.5, 2.4, PAL.candy);
  ctx.restore();
  // the indicator lamp
  const lamp = done ? "#7dff4a" : pr > 0 ? (Math.sin(t * 12) > 0 ? "#ffcf5a" : "#7a5a10") : "#ff2a4d";
  circle(ctx, -4, -31, 2.2, lamp); circle(ctx, -4.6, -31.6, 0.7, "#fff");
  if (pr > 0 && !done) { // progress ring under it
    ctx.strokeStyle = "rgba(255,207,90,.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 15, 6, 0, -Math.PI / 2, -Math.PI / 2 + pr * TAU); ctx.stroke();
  }
  if (done) { ctx.strokeStyle = "rgba(125,255,74,.6)"; ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { const sa = t * 9 + i * 2; ctx.beginPath(); ctx.moveTo(-4, -31); ctx.lineTo(-4 + Math.cos(sa) * 5, -31 + Math.sin(sa) * 5); ctx.stroke(); } }
};

PROPS.jack = function jack(ctx, e, t) {
  const crank = (e.crank || 0) > 0, sprung = (e.sprung || 0) > 0 && e.sprung < 2.6;
  const shake = crank ? Math.sin(t * 40) * 0.8 : 0;
  shadow(ctx, 11, 4, 0.5);
  ctx.save(); ctx.translate(shake, 0);
  // the box: red and yellow, a face painted on each side
  ctx.fillStyle = "#a3122e"; ctx.fillRect(-10, -18, 20, 18);
  ctx.fillStyle = "#c9a020"; ctx.fillRect(-10, -18, 20, 3); ctx.fillRect(-10, -3, 20, 3);
  ctx.fillStyle = "#f2e6c8"; ctx.beginPath(); ctx.arc(-1, -9, 4.5, 0, TAU); ctx.fill();
  ctx.fillStyle = PAL.mouth; ctx.beginPath(); ctx.moveTo(-4.6, -9); ctx.quadraticCurveTo(-1, -4.5, 2.6, -9); ctx.quadraticCurveTo(-1, -7, -4.6, -9); ctx.fill();
  circle(ctx, -2.6, -10.6, 0.7, "#000"); circle(ctx, 0.6, -10.6, 0.7, "#000");
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(4, -18, 6, 18);
  // the crank turning
  const ca = crank ? t * 14 : 0.4;
  ctx.strokeStyle = "#8a8a96"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(13, -10); ctx.lineTo(13 + Math.cos(ca) * 4, -10 + Math.sin(ca) * 4); ctx.stroke();
  circle(ctx, 13 + Math.cos(ca) * 4, -10 + Math.sin(ca) * 4, 1.3, "#e8dcc4");
  if (!sprung) { ctx.fillStyle = "#7a0c20"; ctx.fillRect(-11, -20, 22, 3); } // lid shut
  else {
    const s = e.sprung, boing = Math.exp(-s * 2.5) * Math.sin(s * 22), hgt = 22 + boing * 8;
    ctx.save(); ctx.translate(-10, -18); ctx.rotate(-2.2); ctx.fillStyle = "#7a0c20"; ctx.fillRect(0, -1.5, 22, 3); ctx.restore();
    ctx.strokeStyle = "#b8b8c4"; ctx.lineWidth = 1.4; ctx.beginPath(); // the spring
    for (let i = 0; i <= 12; i++) { const y = -18 - (i / 12) * hgt, x = (i % 2 ? 4 : -4) + boing * 2 * (i / 12); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // what lives in it: a painted head on a ruff
    ctx.save(); ctx.translate(boing * 2, -18 - hgt - 6); ctx.rotate(boing * 0.3);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; circle(ctx, Math.cos(a) * 7, 5 + Math.sin(a) * 2, 2.6, i % 2 ? "#fff" : PAL.candy); }
    ellipse(ctx, 0, 0, 6.4, 7.2, PAL.paint);
    circle(ctx, -2.4, -1.5, 1.6, "#0a0306"); circle(ctx, 2.4, -1.5, 1.6, "#0a0306"); circle(ctx, -2.4, -1.5, 0.5, PAL.bulbHot); circle(ctx, 2.4, -1.5, 0.5, PAL.bulbHot);
    ctx.fillStyle = PAL.mouth; ctx.beginPath(); ctx.moveTo(-5.5, 1); ctx.quadraticCurveTo(0, 8, 5.5, 1); ctx.quadraticCurveTo(0, 4, -5.5, 1); ctx.fill();
    ellipse(ctx, 0, 3.4, 1.3, 2, PAL.gap);
    ctx.fillStyle = PAL.candy; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -15); ctx.lineTo(5, -5); ctx.fill(); circle(ctx, 0, -15, 1.6, PAL.bulb);
    ctx.restore();
  }
  ctx.restore();
};
