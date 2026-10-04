/* art/figures.js — people: the guest (player) and the Unwilling.
 *
 * Canon (tabs/clowns/): the Unwilling are not clowns. Ordinary people in their
 * own night clothes and work clothes, faces whitened with greasepaint, a second
 * wide red mouth painted over a jaw that is fixed open. Victims and monsters both.
 *
 * One rig (`figure`) for all of them, built to look wrong: shoulders hunched up
 * round the ears, arms that hang past the knees, elbows that bend the wrong way,
 * long fingers, a stop-motion gait (poses held, then snapped forward), heads
 * that twitch to angles a neck should not allow. Faces: cracked greasepaint over
 * grey skin, black sockets with a pinprick of eyeshine, a painted mouth wider
 * than the face, the real jaw hanging open beneath it, red running from both.
 * Facing (front, side lean, back view walking away) and three state poses come
 * from engine fields: knocked back (stun + speed), dazed (stun), frozen (Lettie).
 * Eyeshine, the pale face and the painted mouth register `glint()`s, drawn after
 * the lighting pass so they still show in the dark.
 */
import { TAU, PAL, clamp, hash, ellipse, circle, shadow, limb, line } from "./util.js";
import { ICONS } from "./props.js";

/* ---- glints: device-space points collected while drawing, drawn after the darkness ---- */
export const glints = [];
export function glint(ctx, x, y, r, color, a = 1) {
  if (glints.length > 120) return;
  const m = ctx.getTransform();
  glints.push({ x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, r: r * Math.hypot(m.a, m.b), color, a });
}

/* ================================================================ the painted head */
export function paintedHead(ctx, r, e, t, o, look, flash) {
  const id = (e && e.id) || 0;
  const hair = flash ? "#ffe8e0" : o.hair || "#2a1c14";
  const paint = flash ? "#ffffff" : o.paint || "#e8e2d6";
  const skin = flash ? "#ffffff" : "#8a8276";
  const fx = look * r * 0.24;
  const jawDrop = r * (o.jaw ?? 0.55);
  // hair behind the head
  ctx.fillStyle = hair;
  if (o.hairStyle !== "crop" && o.hairStyle !== "bald") {
    ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 1.06, r * 1.1, 0, Math.PI * 0.88, Math.PI * 2.12); ctx.fill();
    if (o.hairStyle === "long") { ctx.beginPath(); ctx.moveTo(-r * 1.05, -r * 0.1); ctx.quadraticCurveTo(-r * 1.35, r * 1.2, -r * 0.8, r * 1.8); ctx.lineTo(-r * 0.4, r * 1.2); ctx.lineTo(r * 0.4, r * 1.2); ctx.lineTo(r * 0.8, r * 1.8); ctx.quadraticCurveTo(r * 1.35, r * 1.2, r * 1.05, -r * 0.1); ctx.fill(); }
    else for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * r * 0.9, -r * 0.4); ctx.lineTo(sx * r * 1.15, r * 0.6); ctx.lineTo(sx * r * 0.95, r * 0.3); ctx.lineTo(sx * r * 1.0, r * 0.9); ctx.lineTo(sx * r * 0.7, r * 0.2); ctx.fill(); } // lank, greasy hanks
  }
  if (o.back) { // the back of an ordinary head, and the line where the paint stops
    ellipse(ctx, 0, 0, r * 0.95, r * 1.05, hair);
    ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(-r * 0.5, -r * 0.7, r * 0.22, r * 0.9);
    ellipse(ctx, 0, r * 0.95, r * 0.55, r * 0.22, paint);
    ctx.fillStyle = skin; ctx.fillRect(-r * 0.35, r * 1.02, r * 0.7, r * 0.2);
    if (o.bun) circle(ctx, 0, -r * 0.55, r * 0.48, hair);
    return;
  }
  // the lower jaw, hanging: grey skin where the paint gave out
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.moveTo(-r * 0.62, r * 0.35); ctx.quadraticCurveTo(-r * 0.55, r * 0.95 + jawDrop, fx * 0.5, r * 1.0 + jawDrop); ctx.quadraticCurveTo(r * 0.55, r * 0.95 + jawDrop, r * 0.62, r * 0.35); ctx.fill();
  ctx.fillStyle = paint; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.6); ctx.quadraticCurveTo(-r * 0.4, r * 0.88 + jawDrop, fx * 0.5, r * 0.92 + jawDrop); ctx.quadraticCurveTo(r * 0.3, r * 0.9 + jawDrop, r * 0.35, r * 0.6 + jawDrop * 0.6); ctx.fill();
  // skull: greasepaint over grey skin
  ellipse(ctx, 0, 0, r * 0.88, r * 0.98, skin);
  ellipse(ctx, -r * 0.02, -r * 0.04, r * 0.84, r * 0.92, paint);
  if (!flash) {
    ctx.fillStyle = "rgba(60,50,60,.35)"; // shade on the far side, hollow cheeks
    ctx.beginPath(); ctx.ellipse(r * 0.42, r * 0.05, r * 0.4, r * 0.8, 0.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-r * 0.55, r * 0.35, r * 0.18, r * 0.3, 0.2, 0, TAU); ctx.fill();
    // cracks and flakes
    ctx.strokeStyle = "rgba(50,40,36,.75)"; ctx.lineWidth = Math.max(0.35, r * 0.04);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      let x = (hash(id, i, 1) - 0.5) * r * 1.3, y = (hash(id, i, 2) - 0.6) * r * 1.3; ctx.moveTo(x, y);
      for (let j = 0; j < 3; j++) { x += (hash(id, i, j + 3) - 0.5) * r * 0.5; y += hash(id, i, j + 6) * r * 0.3; ctx.lineTo(x, y); }
    }
    ctx.stroke();
    ctx.fillStyle = skin;
    for (let i = 0; i < 3; i++) { const x = (hash(id, i, 11) - 0.5) * r * 1.2, y = (hash(id, i, 12) - 0.7) * r; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.16, y + r * 0.05); ctx.lineTo(x + r * 0.08, y + r * 0.16); ctx.fill(); }
  }
  // eyes: black sockets, a pinprick that catches the light, red running down
  const alert = e && (e.alert > 0 || o.alwaysAlert);
  const eyeY = -r * 0.18, wide = o.eyeW || 1;
  for (const sx of (o.noEyes ? [] : [-1, 1])) {
    const ex = sx * r * 0.35 + fx;
    ctx.fillStyle = flash ? "#ffd0d0" : "#060203";
    ctx.beginPath(); ctx.ellipse(ex, eyeY, r * 0.26 * wide, r * 0.3, sx * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(20,4,10,.6)"; ctx.beginPath(); ctx.ellipse(ex, eyeY - r * 0.05, r * 0.36 * wide, r * 0.4, sx * 0.3, Math.PI, TAU); ctx.fill(); // smudge above
    if (!flash && (sx === 1 || id % 2)) { // a red run from the socket
      const len = r * (0.45 + hash(id, sx + 3, 4) * 0.5);
      ctx.fillStyle = "#9a0a1c"; ctx.fillRect(ex - r * 0.04, eyeY + r * 0.22, r * 0.08, len); circle(ctx, ex, eyeY + r * 0.22 + len, r * 0.06, "#9a0a1c");
    }
    const pc = o.eyeColor || (alert ? PAL.bulbHot : "#d8d0b0");
    const px = ex + look * r * 0.06;
    circle(ctx, px, eyeY, Math.max(0.35, r * 0.05), pc);
    glint(ctx, px, eyeY, r * (alert ? 0.1 : 0.06), o.eyeColor || (alert ? "#fff0b0" : "#c8c0a0"), alert ? 1 : 0.45);
  }
  if (o.eyeOverride) o.eyeOverride(ctx, r, eyeY, fx);
  // the second mouth: painted wider than the face, the corners curling up to the eyes
  const w = (o.grin || 1.12) * r, mx = fx * 0.6, my = r * 0.18, dip = r * (o.grinDip || 0.62);
  ctx.fillStyle = flash ? "#ff9aa8" : PAL.mouth;
  ctx.beginPath();
  ctx.moveTo(mx - w, my - r * 0.42);
  ctx.quadraticCurveTo(mx - w * 0.8, my + dip, mx, my + dip * 1.05);
  ctx.quadraticCurveTo(mx + w * 0.8, my + dip, mx + w, my - r * 0.42);
  ctx.quadraticCurveTo(mx + w * 0.62, my + dip * 0.35, mx, my + dip * 0.42);
  ctx.quadraticCurveTo(mx - w * 0.62, my + dip * 0.35, mx - w, my - r * 0.42);
  ctx.fill();
  ctx.strokeStyle = PAL.mouthDark; ctx.lineWidth = Math.max(0.4, r * 0.05); ctx.stroke();
  // the real mouth beneath: fixed open, the jaw hung down out of it, teeth
  const oy = my + r * 0.45, oh = r * 0.22 + jawDrop * 0.5;
  ctx.fillStyle = PAL.gap; ctx.beginPath(); ctx.ellipse(mx, oy + oh * 0.4, r * 0.2, oh, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#d8cca8";
  for (let i = -1; i <= 1; i++) { ctx.fillRect(mx + i * r * 0.11 - r * 0.04, oy + oh * 0.4 - oh + r * 0.02, r * 0.08, r * 0.11); ctx.fillRect(mx + i * r * 0.11 - r * 0.04, oy + oh * 0.4 + oh - r * 0.13, r * 0.08, r * 0.1); }
  // red running from the corners and the lip, down the chin
  if (!flash) {
    ctx.fillStyle = "#a00c1e";
    ctx.fillRect(mx - w * 0.55, my + dip * 0.7, r * 0.07, r * 0.35 + jawDrop * 0.5);
    ctx.fillRect(mx + r * 0.1, oy + oh * 1.3, r * 0.06, r * 0.25 + jawDrop * 0.4);
    ctx.fillRect(mx + w * 0.45, my + dip * 0.6, r * 0.06, r * 0.22);
  }
  // in the dark, the white of the paint and the red of the grin still show, faintly
  glint(ctx, mx, my + dip * 0.6, r * 0.55, "#ff2a3a", 0.22);
  glint(ctx, 0, -r * 0.2, r * 0.9, "#d8d4cc", 0.1);
}

/* ================================================================ the rig */
/* o: coat, sleeve, legs, shoes, hair, hairStyle, h (height), width, r (head), dress, gait,
      over(ctx,k,C,e,t) chest details, hand / lhand(ctx,k,C,e,t) held items, pose(...) -> [lh, rh],
      eyeColor, grin, grinDip, jaw, alwaysAlert, stains, armLen, smooth (no stop-motion),
      backBody (body seen from behind while the face still looks at you) */
export function figure(ctx, e, t, o, view) {
  const k = o.h || 1, wd = o.width || 1, r = o.r || 10.5, id = e.id || 0;
  const vx = e.vx || 0, vy = e.vy || 0, sp = Math.hypot(vx, vy), face = e.face || 0;
  const stun = (e.stun || 0) > 0, knocked = stun && sp > 70, dazed = stun && !knocked;
  const frozen = !!e.frozen, alert = (e.alert || 0) > 0;
  const walking = !stun && !frozen && sp > 12;
  const run = clamp(sp / 150, 0, 1.3);
  const cx = Math.cos(face), sy = Math.sin(face);
  const back = (walking && sy < -0.6) || !!o.backBody;
  const look = clamp(cx * 1.4, -1, 1);
  const flash = (e.hitFlash || 0) > 0;
  const C = (c) => (flash ? "#ffe6de" : c);
  // stop-motion: poses are held for a beat, then snap forward (the player's animation stays smooth)
  const fps = o.smooth ? 60 : 7 + run * 3;
  const et = Math.floor(((e.t || 0) + hash(id, 1) * 3) * fps) / fps;
  const tq = o.smooth ? t : Math.floor(t * fps) / fps;
  const ph = et * (5 + run * 7) * (o.gait || 1);
  const sw = walking ? Math.sin(ph) : 0;
  const bob = walking ? -Math.abs(Math.cos(ph)) * (1 + run * 1.5) : 0;
  const breathe = frozen ? 0 : Math.sin(tq * 1.7 + id) * 0.8;
  const tw = ((tq * 0.31 + id * 0.17) % 1);
  const twitch = !frozen && tw < 0.06 ? (tw < 0.03 ? 0.75 : 0.4) : 0; // the head snaps over, holds, comes back

  shadow(ctx, 11 * wd * (knocked ? 0.8 : 1), 4.4 * wd, 0.55);
  ctx.save();
  if (knocked) { const vd = Math.sign(vx) || 1; ctx.translate(0, -Math.min(10, sp * 0.03)); ctx.rotate(vd * 0.5); }
  else if (dazed) ctx.rotate(Math.sin(tq * 3.1 + id) * 0.16);
  else if (walking) ctx.rotate(Math.sign(cx || 1) * Math.abs(cx) * run * 0.12 + (o.lean || 0));
  else if (o.lean) ctx.rotate(o.lean);
  ctx.translate(0, bob);

  const hipY = -12 * k, shY = -28 * k + breathe * 0.4, hx = 3.2 * wd;
  const side = Math.abs(cx);
  // legs: thigh + shin, knees bend, the trailing foot lifts
  if (!o.dress) {
    for (const s of [-1, 1]) {
      const st = sw * s;
      let fxx = s * hx + st * 5 * side * Math.sign(cx || 1) * 0.9, fyy = -Math.max(0, st) * 3.5 * (0.4 + run);
      if (knocked) { fxx = s * hx * 1.6 - (Math.sign(vx) || 1) * 4; fyy = -3; }
      if (dazed) { fxx = s * hx * 1.6; }
      limb(ctx, s * hx * 0.9, hipY, fxx, fyy, s * (walking ? 1.5 + st : 0.6), 3.8 * wd, C(o.legs));
      ellipse(ctx, fxx + 0.5, fyy - 0.6, 3.2 * wd, 1.8, C(o.shoes || (o.barefoot ? "#b8b0a0" : "#151012")));
      if (o.barefoot) { ctx.fillStyle = "#4a2a1a"; ctx.fillRect(fxx - 2, fyy - 0.4, 4 * wd, 1); }
    }
  } else {
    const sway = walking ? sw * 2 : 0;
    ctx.fillStyle = C(o.coat); ctx.beginPath(); ctx.moveTo(-10 * wd, -1);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-10 * wd + i * (20 * wd / 6), (i % 2 ? 1.5 : -1.2) + sway * (i / 6)); // a ragged, torn hem
    ctx.lineTo(6 * wd, -22 * k); ctx.lineTo(-6 * wd, -22 * k); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.3)"; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -20 * k); ctx.lineTo(i * 5 + sway * 0.5, -1); ctx.lineTo(i * 5 + 1.2 + sway * 0.5, -1); ctx.fill(); }
    ctx.fillStyle = "rgba(40,8,10,.55)"; ctx.fillRect(-9 * wd, -4, 18 * wd, 3); // dragged through mud and worse
    ellipse(ctx, -3, 0, 2.6, 1.4, C("#151012")); ellipse(ctx, 3, 0, 2.6, 1.4, C("#151012"));
  }
  // torso: shoulders hunched up around the ears
  const shH = shY - 4.5; // shoulder tops ride above the neck
  ctx.fillStyle = C(o.coat);
  ctx.beginPath(); ctx.moveTo(-7.5 * wd, hipY + 1);
  for (let i = 0; i <= 5; i++) ctx.lineTo(-7.5 * wd + i * (15 * wd / 5), hipY + 1 + (i % 2 ? 2.2 : 0)); // torn
  ctx.quadraticCurveTo(9.5 * wd, shY + 4, 8 * wd, shH); ctx.quadraticCurveTo(5 * wd, shH - 2.5, 2.5 * wd, shY);
  ctx.lineTo(-2.5 * wd, shY); ctx.quadraticCurveTo(-5 * wd, shH - 2.5, -8 * wd, shH); ctx.quadraticCurveTo(-9.5 * wd, shY + 4, -7.5 * wd, hipY + 1); ctx.fill();
  if (!flash) {
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.moveTo(2.5 * wd, hipY + 1); ctx.lineTo(7.5 * wd, hipY + 1); ctx.quadraticCurveTo(9.5 * wd, shY + 4, 8 * wd, shH); ctx.lineTo(4 * wd, shY); ctx.fill();
    if (o.stripes) { ctx.fillStyle = o.stripes; for (let i = 0; i < 4; i++) ctx.fillRect(-7.4 * wd, shY + 3 + i * 4.4 * k, 14.8 * wd, 1.8); }
    // stains, dark and old, different on each of them
    ctx.fillStyle = o.stains || "rgba(50,6,10,.55)";
    for (let i = 0; i < 3; i++) { const x = (hash(id, i, 31) - 0.5) * 11 * wd, y = hipY - 2 - hash(id, i, 32) * (hipY - shY - 4); ctx.beginPath(); ctx.ellipse(x, y, 1.5 + hash(id, i, 33) * 2.5, 1.2 + hash(id, i, 34) * 3, hash(id, i) * 3, 0, TAU); ctx.fill(); }
  }
  if (o.over && !back) o.over(ctx, k, C, e, t);
  if (back && !flash) { ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(-0.6, shY + 1, 1.2, hipY - shY - 1); } // spine seam
  // arms: too long. They hang past the knees, swing, reach for you, fling, point
  const shL = [-7.8 * wd, shH + 2.5], shR = [7.8 * wd, shH + 2.5];
  const al = o.armLen || 1;
  let lh, rh;
  if (knocked) { lh = [-14 * wd, shY - 12]; rh = [14 * wd, shY - 14]; }
  else if (dazed) { const d = Math.sin(tq * 3 + id) * 2; lh = [-9 * wd + d, hipY + 9 * al]; rh = [9 * wd + d, hipY + 10 * al]; }
  else if (o.pose) { [lh, rh] = o.pose(e, tq, k, wd, shY, hipY, sw); }
  else if (alert && !back) { const rx = cx * 8 * al, reach = shY + 4 - Math.sin(tq * 2 + id) * 1.5; lh = [-10 * wd + rx, reach - 1 + sw * 2]; rh = [10 * wd + rx, reach + 1 - sw * 2]; }
  else { lh = [-9.5 * wd - sw * side * 3, hipY + 8 * al + sw * 2]; rh = [9.5 * wd + sw * side * 3, hipY + 8 * al - sw * 2]; }
  const armW = 3.2 * wd;
  limb(ctx, shL[0], shL[1], lh[0], lh[1], 2.6, armW, C(o.sleeve || o.coat));   // elbows bend the wrong way
  limb(ctx, shR[0], shR[1], rh[0], rh[1], -2.6, armW, C(o.sleeve || o.coat));
  for (const [hx2, hy2, s] of [[lh[0], lh[1], -1], [rh[0], rh[1], 1]]) {
    circle(ctx, hx2, hy2, 2.3 * wd, C("#e2dccf"));
    const ang = Math.atan2(hy2 - shY, hx2 - s * 7) ; // fingers continue the arm
    ctx.strokeStyle = C("#e2dccf"); ctx.lineWidth = 0.95; ctx.lineCap = "round"; ctx.beginPath();
    for (let f = -1.5; f <= 1.5; f += 1) { const a = ang + f * 0.28; ctx.moveTo(hx2, hy2); ctx.lineTo(hx2 + Math.cos(a) * 3.2, hy2 + Math.sin(a) * 3.2); ctx.lineTo(hx2 + Math.cos(a + 0.4 * s) * 5.6, hy2 + Math.sin(a + 0.4 * s) * 5.6); }
    ctx.stroke();
    if (o.chalk) { ctx.fillStyle = "#ffffff"; circle(ctx, hx2 + Math.cos(ang) * 4.5, hy2 + Math.sin(ang) * 4.5, 1.8, "#ffffff"); }
  }
  if (o.hand) { ctx.save(); ctx.translate(rh[0], rh[1]); o.hand(ctx, k, C, e, t); ctx.restore(); }
  if (o.lhand) { ctx.save(); ctx.translate(lh[0], lh[1]); o.lhand(ctx, k, C, e, t); ctx.restore(); }
  // the head sits low between the shoulders, pushed forward
  ctx.save();
  ctx.translate(cx * 1.5, shY - r * 0.72 - 0.5);
  const tilt = (dazed ? Math.sin(tq * 2.3) * 0.55 : 0) + twitch * ((id % 2) ? 1 : -1) + (alert ? cx * 0.1 : 0) + (o.tilt || 0) + (frozen ? 0.22 : 0);
  ctx.rotate(tilt);
  paintedHead(ctx, r, e, t, { ...o, back: back && !o.backBody }, look, flash);
  if (o.headwear) o.headwear(ctx, r, C, e, t, back && !o.backBody);
  ctx.restore();
  if (dazed) stunBulbs(ctx, shY - r * 2.2, t);
  ctx.restore();
}

/* a little ring of carnival bulbs circling a dazed head */
export function stunBulbs(ctx, y, t, n = 4, rad = 11) {
  for (let i = 0; i < n; i++) {
    const a = t * 4 + (i * TAU) / n, x = Math.cos(a) * rad, yy = y + Math.sin(a) * rad * 0.32;
    const on = Math.sin(t * 3 + i * 2) > -0.2;
    circle(ctx, x, yy, 1.8, on ? [PAL.bulb, PAL.candy, PAL.poison, PAL.pink][i % 4] : "#3a3020");
    if (on) circle(ctx, x - 0.5, yy - 0.5, 0.6, "#fff");
  }
}

/* ================================================================ the guest (player)
 * An ordinary night at the fair: a teal wool coat worn open over a red-and-cream
 * striped jumper, a mustard scarf, dark jeans, white-soled sneakers, a paper
 * wristband, messy brown hair with a tuft that won't lie down. Not a hero.
 * Everything is driven by view.guest, set by art.render:
 *   { hp 0..1, san 0..1, dread 0..1, hurtT (s since the last hit), stuck, caught, hatOut, flash }
 * Fear: brows up, eyes wide with small pupils, breath fogging, a hunched run at high
 * dread, a trembling lantern at low sanity. Wear: torn jeans, a torn coat, blood,
 * a limp; at the very bottom of sanity, a smear of white greasepaint on one cheek.
 * Poses: walk, run, idle (breathing, glancing round), dash, hit, stuck, caught.
 * Under reduced motion there is no trembling, struggling or shaking. */
const G = {
  coat: "#2f5560", coatDark: "#1e3a42", coatLight: "#40707a", lining: "#7a2a30",
  jumper: "#a8283a", jumper2: "#e6d8bc", scarf: "#c8922e", scarfDark: "#8a5e18",
  jeans: "#2c3650", jeansDark: "#1c2234", shoe: "#3a2a22", sole: "#e8e0d0",
  skin: "#e2c09e", skinShade: "#c49a78", hair: "#4a2c18", hairDark: "#2a180c", blood: "#7a0a16",
};
const smooth = (k) => k * k * (3 - 2 * k);

function guestState(p, t, view) {
  const gs = p.guest || (view && view.guest) || {}; // p.guest: an override for previews and cinematics
  const sp = Math.hypot(p.vx || 0, p.vy || 0);
  return {
    sp, moving: !!p.moving || sp > 20, run: clamp(sp / 160, 0, 1.4),
    hp: gs.hp ?? 1, san: gs.san ?? 1, dread: gs.dread ?? 0,
    hurtK: gs.hurtT != null && gs.hurtT < 0.45 ? 1 - gs.hurtT / 0.45 : 0,
    stuck: !!gs.stuck, caught: !!gs.caught, dash: (p.dashT || 0) > 0, hatOut: !!gs.hatOut,
    reduced: !!(view && view.reduced), flash: gs.flash ?? 1, held: p.held !== undefined ? p.held : (view && view.heldWeapon) || null,
  };
}

/* The body. hooks.arms(ctx, B) draws arms, lantern and weapon in the body's frame
   (before the torso when the guest faces away, after it otherwise); hooks.hat(ctx, B) on the head. */
function guestBody(ctx, p, t, view, o = {}, hooks = {}) {
  const S = guestState(p, t, view), C = o.colors ? { ...G, ...o.colors } : G;
  const face = p.face || 0, cx = Math.cos(face), sy = Math.sin(face);
  const back = sy < -0.6, side = Math.abs(cx), dir = Math.sign(cx) || 1;
  const ph = p.step != null ? p.step * 2 : t * 6;
  const frozen = S.stuck || S.caught;
  const sw = S.moving && !frozen ? Math.sin(ph) : 0;
  const fear = clamp(Math.max(S.dread, (1 - S.san) * 0.9, S.hurtK, S.caught ? 1 : 0), 0, 1);
  const tr = S.reduced ? 0 : Math.max(0, S.dread - 0.45) * 0.9 + Math.max(0, 0.5 - S.san) * 1.4;
  const trem = tr ? Math.sin(t * 47) * 0.32 * tr : 0;
  const breath = Math.sin(t * (2.2 + S.dread * 5 + S.run * 3));
  const hunch = S.caught ? 0 : clamp(S.dread * 0.95 + S.run * 0.25, 0, 1); // the hunched run when they're close
  let lean = 0, lift = 0;
  if (S.moving && !frozen) lean = dir * side * S.run * (0.08 + hunch * 0.14);
  if (S.dash) lean = dir * side * 0.36;
  if (S.hurtK) lean -= dir * (side > 0.3 ? 0.28 : 0.1) * smooth(S.hurtK); // jerked back
  if (S.stuck && !S.reduced) lean = Math.sin(t * 9) * 0.13;                  // struggling
  if (S.caught) lift = -2.5;                                                 // lifted off the ground
  const bob = S.moving && !frozen ? -Math.abs(Math.cos(ph)) * (1.1 + S.run * 1.5) : breath * 0.3;
  ctx.save();
  ctx.translate(trem, 0); ctx.rotate(lean); ctx.translate(0, bob + lift);
  const hipY = -9.5 + hunch * 0.8, shY = -22 + hunch * 2.4 - (S.moving ? 0 : breath * 0.3);
  const B = { S, C, face, cx, sy, back, side, dir, sw, ph, shY, hipY, hunch, fear, tr, breath, bob, lean };

  // ---- legs: jeans, sneakers with white soles; a limp when badly hurt
  const amp = S.dash ? 7 : 2.8 + S.run * 3.2, lifted = 1.8 + S.run * 2.6;
  const legs = [];
  for (const s of [-1, 1]) {
    let st = sw * s;
    if (S.hp < 0.3 && s === 1) st *= 0.4;
    if (S.dash) st = s * 0.9;
    let fx = s * 3 + st * amp * side * dir, fy = -Math.max(0, st) * lifted * (1 - side * 0.35);
    let bend = s * (1.1 + Math.abs(st) * 0.8 + S.run * 0.6);
    if (S.stuck) { fx = s * 3.6; fy = 0; bend = s * 2.6; }
    if (S.caught) { fx = s * 1.6; fy = 0; bend = s * 0.3; }
    legs.push([s, fx, fy, bend]);
  }
  for (const [s, fx, fy, bend] of legs) {
    const [jx, jy] = limb(ctx, s * 2.7, hipY, fx, fy - 1, bend, 3.9, s === dir && side > 0.4 ? C.jeansDark : C.jeans);
    if (S.hp < 0.75 && (s === -1 || S.hp < 0.45)) { // ripped at the knee
      ellipse(ctx, jx, jy, 1.3, 0.9, C.skin);
      ctx.strokeStyle = "#c8c0b0"; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(jx - 1.2, jy - 0.6); ctx.lineTo(jx + 1.2, jy - 0.4); ctx.moveTo(jx - 1, jy + 0.6); ctx.lineTo(jx + 1.1, jy + 0.7); ctx.stroke();
      if (S.hp < 0.45) { ctx.fillStyle = C.blood; ctx.fillRect(jx - 0.3, jy, 0.7, 2.2); }
    }
    ellipse(ctx, fx + dir * side * 0.9, fy - 0.9, 3.1, 1.8, C.shoe);
    ctx.fillStyle = C.sole; ctx.fillRect(fx - 2.9 + dir * side * 0.9, fy - 0.1, 5.8, 0.9);
  }

  if (back && hooks.arms) hooks.arms(ctx, B);

  // ---- the coat: open over the jumper, its tail flaring when you run
  const flare = S.run * 1.6 + (S.dash ? 3 : 0), hemY = hipY + 3.2;
  ctx.fillStyle = C.coat;
  ctx.beginPath();
  ctx.moveTo(-7 - flare * (dir < 0 ? 1 : 0.3), hemY + sw * 0.5);
  ctx.lineTo(7 + flare * (dir > 0 ? 1 : 0.3), hemY - sw * 0.6);
  ctx.quadraticCurveTo(8, shY + 4, 6.4, shY - hunch * 1.2);
  ctx.quadraticCurveTo(0, shY - 2, -6.4, shY - hunch * 1.2);
  ctx.quadraticCurveTo(-8, shY + 4, -7 - flare * (dir < 0 ? 1 : 0.3), hemY + sw * 0.5);
  ctx.fill();
  // the side away from the lantern in shadow
  ctx.fillStyle = C.coatDark; ctx.beginPath(); ctx.moveTo(2.5, hemY); ctx.lineTo(7 + flare * (dir > 0 ? 1 : 0.3), hemY - sw * 0.6); ctx.quadraticCurveTo(8, shY + 4, 6.4, shY - hunch * 1.2); ctx.lineTo(3.4, shY); ctx.fill();
  if (back) {
    ctx.strokeStyle = C.coatDark; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, shY + 1); ctx.lineTo(0, hemY); ctx.stroke(); // centre seam
    ctx.fillStyle = C.coatDark; ctx.fillRect(-4.5, hipY - 1.5, 9, 1.6); // half belt
    circle(ctx, -3.6, hipY - 0.7, 0.55, "#c9b48c"); circle(ctx, 3.6, hipY - 0.7, 0.55, "#c9b48c");
  } else {
    // the jumper showing between the lapels: red and cream stripes
    const jx0 = -2.6 + cx * 0.6, jw = 5.2;
    for (let y = shY + 1.5, i = 0; y < hipY + 2.5; y += 1.7, i++) { ctx.fillStyle = i % 2 ? C.jumper2 : C.jumper; ctx.fillRect(jx0, y, jw, 1.75); }
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(jx0 + jw * 0.6, shY + 1.5, jw * 0.4, hipY - shY + 1);
    if (S.hp < 0.5) { circle(ctx, jx0 + 1.6, shY + 7, 1.5, C.blood); circle(ctx, jx0 + 3.6, shY + 9.5, 1, C.blood); }
    if (S.hp < 0.25) { ctx.fillStyle = C.blood; ctx.beginPath(); ctx.ellipse(jx0 + 2.6, hipY - 1, 3.2, 3.6, 0.2, 0, TAU); ctx.fill(); }
    // lapels and buttons, a pocket with the ticket stub poking out
    ctx.fillStyle = C.coatLight; ctx.beginPath(); ctx.moveTo(jx0, shY + 1); ctx.lineTo(jx0 - 1.8, shY + 1); ctx.lineTo(jx0, shY + 6); ctx.fill();
    ctx.fillStyle = C.coatDark; ctx.beginPath(); ctx.moveTo(jx0 + jw, shY + 1); ctx.lineTo(jx0 + jw + 1.8, shY + 1); ctx.lineTo(jx0 + jw, shY + 6); ctx.fill();
    for (let i = 0; i < 3; i++) circle(ctx, jx0 - 0.9, shY + 6.5 + i * 3, 0.55, "#c9b48c");
    ctx.fillStyle = C.coatDark; ctx.fillRect(-6.5, hipY - 2.5, 3.4, 1.2);
    ctx.fillStyle = "#e8c860"; ctx.fillRect(-6, hipY - 3.8, 1.6, 1.6); // admit one
  }
  if (S.hp < 0.5) { // a tear in the hem, the lining showing
    const tx = back ? 3 : -5;
    ctx.fillStyle = C.lining; ctx.beginPath(); ctx.moveTo(tx - 1.5, hemY - 0.2); ctx.lineTo(tx, hemY - 3.6); ctx.lineTo(tx + 0.6, hemY - 1.6); ctx.lineTo(tx + 1.8, hemY - 0.2); ctx.fill();
    ctx.strokeStyle = "#0e1a1e"; ctx.lineWidth = 0.4; ctx.stroke();
  }

  // ---- scarf: wound round, one end hanging, streaming behind when you run
  const nx = back ? 0 : cx * 0.4;
  ctx.fillStyle = C.scarf; ctx.fillRect(-5.6 + nx, shY - 2 - hunch * 0.8, 11.2, 3.6);
  ctx.fillStyle = C.scarfDark; ctx.fillRect(-5.6 + nx, shY - 0.2 - hunch * 0.8, 11.2, 0.8);
  {
    const tx0 = (back ? 2.5 : -3) + nx, ty0 = shY + 1;
    const stream = (S.run + (S.dash ? 1 : 0)) * 6, ex = tx0 - dir * side * stream + sw * 0.8, ey = ty0 + 7 - stream * 0.45;
    ctx.strokeStyle = C.scarf; ctx.lineWidth = 2.4; ctx.lineCap = "butt";
    ctx.beginPath(); ctx.moveTo(tx0, ty0); ctx.quadraticCurveTo(tx0 + sw * 0.5, ty0 + 3, ex, ey); ctx.stroke();
    ctx.strokeStyle = C.scarfDark; ctx.lineWidth = 0.4; ctx.beginPath();
    for (let i = -1; i <= 1; i++) { ctx.moveTo(ex + i * 0.8, ey); ctx.lineTo(ex + i * 0.8 - dir * side * 0.5, ey + 1.3); } ctx.stroke(); // fringe
  }

  if (!back && hooks.arms) hooks.arms(ctx, B);

  // ---- head
  const hx = (back ? 0 : cx * 0.6) + dir * side * hunch * 1.2, hy = shY - 7 + hunch * 1.4;
  ctx.save(); ctx.translate(hx, hy);
  let tilt = 0;
  if (S.hurtK) tilt = -dir * 0.32 * smooth(S.hurtK);
  if (S.caught) tilt = 0.12 + (S.reduced ? 0 : Math.sin(t * 2) * 0.03);
  if (S.stuck && !S.reduced) tilt = Math.sin(t * 11) * 0.12;
  if (tr && !S.moving) tilt += Math.sin(t * 31) * 0.03 * tr;
  ctx.rotate(tilt);
  ctx.fillStyle = C.skinShade; ctx.fillRect(-1.6, 4.5, 3.2, 3); // neck
  let skin = C.skin;
  if (S.hp < 0.25 || S.san < 0.2) skin = "#cdb8a2"; // the colour going out of you
  if (back) {
    ellipse(ctx, 0, 0, 6.2, 6.6, skin);
    ellipse(ctx, 0, -0.6, 6.5, 6.6, C.hair);
    ctx.fillStyle = C.hairDark; ctx.beginPath(); ctx.ellipse(0, 3.6, 4.6, 2.4, 0, 0, Math.PI); ctx.fill(); // nape
    ctx.strokeStyle = C.hairDark; ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 1.6, -5); ctx.quadraticCurveTo(i * 2, 0, i * 1.8, 4.5); } ctx.stroke();
  } else {
    const look = cx * 1.7 + (S.moving || S.reduced ? 0 : (Math.sin(t * 0.7) > 0.75 ? 1 : Math.sin(t * 0.7) < -0.75 ? -1 : 0) * 1.1); // glancing round
    for (const s of [-1, 1]) if (s * cx < 0.7) ellipse(ctx, s * 6 + look * 0.2, 0.8, 1.2, 1.7, C.skinShade); // ears
    ellipse(ctx, 0, 0, 6.1, 6.5, skin);
    ctx.fillStyle = "rgba(150,90,60,.22)"; ctx.beginPath(); ctx.ellipse(2.6 - look * 0.5, 0.6, 3.4, 5.6, 0, 0, TAU); ctx.fill(); // far side in shadow
    if (S.run > 0.6 || S.dread > 0.5) { ctx.fillStyle = "rgba(210,80,70,.28)"; ctx.fillRect(-4.8 + look * 0.4, 1.8, 2, 1.1); ctx.fillRect(2.8 + look * 0.4, 1.8, 2, 1.1); }
    // eyes: wide, the pupils small; squeezed shut when hit
    const ey = 0.4 + Math.max(-0.5, sy) * 0.5;
    for (const s of [-1, 1]) {
      const ex = s * 2.4 + look;
      if (S.hurtK > 0.35) { ctx.strokeStyle = "#2a140c"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ex - 1.3, ey - 0.4); ctx.lineTo(ex, ey + 0.4); ctx.lineTo(ex + 1.3, ey - 0.4); ctx.stroke(); continue; }
      ellipse(ctx, ex, ey, 1.55 + fear * 0.15, 1.75 + fear * 0.35, "#fbf6ee");
      const pr = S.caught ? 0.35 : 0.8 - fear * 0.3, pdx = look * 0.28 + (tr ? Math.sin(t * 23 + s) * 0.12 * tr : 0);
      circle(ctx, ex + pdx, ey + 0.15 + Math.max(0, sy) * 0.3, pr, "#1a0e08");
      circle(ctx, ex + pdx - 0.35, ey - 0.35, 0.25, "#fff");
      // brows drawn up in the middle: afraid
      ctx.strokeStyle = C.hairDark; ctx.lineWidth = 0.75; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(ex + s * 1.7, ey - 2.2 - fear * 0.2); ctx.lineTo(ex - s * 1.1, ey - 2.6 - fear * 0.8); ctx.stroke();
    }
    ellipse(ctx, look * 0.6 + 0.3, 2.5, 0.7, 0.5, C.skinShade); // nose
    // mouth: open, breathing hard; a grimace when hit; a scream when caught
    const mx = look * 0.7, my = 4.1;
    if (S.hurtK > 0.35) { ctx.fillStyle = "#3a1210"; ctx.fillRect(mx - 1.8, my - 0.5, 3.6, 1.2); ctx.fillStyle = "#f4ecd8"; ctx.fillRect(mx - 1.5, my - 0.4, 3, 0.45); }
    else {
      const mh = S.caught ? 2.3 : 0.7 + fear * 0.8 + Math.max(0, B.breath) * 0.25 * (S.run + S.dread), mw = S.caught ? 1.5 : 1 + fear * 0.35;
      ellipse(ctx, mx, my + mh * 0.3, mw, mh, "#4a1a18");
      if (mh > 1.3) { ctx.fillStyle = "#f4ecd8"; ctx.fillRect(mx - mw * 0.6, my + mh * 0.3 - mh + 0.1, mw * 1.2, 0.4); }
    }
    // sweat at the temple
    if (S.dread > 0.55) { const k = (t * 0.6) % 1; ctx.fillStyle = "rgba(200,230,255,.8)"; ctx.beginPath(); ctx.ellipse(-5.2 + look * 0.3, -2 + k * 4, 0.45, 0.7, 0, 0, TAU); ctx.fill(); }
    // wear: a scratch, then blood from the hairline, a bruise
    if (S.hp < 0.75) { ctx.strokeStyle = "#a02028"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(3.2 + look, 2.2); ctx.lineTo(4.8 + look, 1.4); ctx.moveTo(3.4 + look, 3); ctx.lineTo(4.6 + look, 2.4); ctx.stroke(); }
    if (S.hp < 0.45) { ctx.fillStyle = C.blood; ctx.fillRect(-3.4 + look, -5, 0.7, 4.2); circle(ctx, -3.05 + look, -0.8, 0.45, C.blood); }
    if (S.hp < 0.25) { ctx.fillStyle = "rgba(90,40,90,.45)"; ctx.beginPath(); ctx.ellipse(2.4 + look, 2.1, 1.5, 0.8, 0, 0, TAU); ctx.fill(); }
    // the very bottom of sanity: a white smear across one cheek, the mouth's corner pulled up in red
    if (S.san < 0.25) {
      const k = clamp((0.25 - S.san) * 6, 0, 1);
      ctx.fillStyle = `rgba(240,236,226,${0.85 * k})`; ctx.beginPath(); ctx.moveTo(-5.6 + look * 0.3, -0.5); ctx.quadraticCurveTo(-3, 1.2, -1.2 + look, 4); ctx.lineTo(-2.6 + look, 4.4); ctx.quadraticCurveTo(-4.6, 2.6, -5.8 + look * 0.3, 1.6); ctx.fill();
      ctx.strokeStyle = `rgba(192,18,44,${k})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(mx + 1.1, my + 0.2); ctx.quadraticCurveTo(mx + 2.6, my - 0.4, mx + 3.4, my - 2); ctx.stroke();
    }
    // breath fogging in the cold, quicker when afraid
    if (!S.caught) for (let i = 0; i < 3; i++) {
      const k = (t * (0.7 + S.dread * 1.4 + S.run * 0.6) + i / 3) % 1;
      ctx.fillStyle = `rgba(220,226,236,${0.32 * (1 - k)})`;
      circle(ctx, mx + cx * (2 + k * 5), my + 1 - k * 4, 0.8 + k * 2.4, ctx.fillStyle);
    }
    // hair: a messy brown mop, a fringe, a tuft that won't lie down
    ctx.fillStyle = C.hair;
    ctx.beginPath(); ctx.ellipse(0, -1.9, 6.6, 5.4, 0, Math.PI * 0.98, Math.PI * 2.02); ctx.fill();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6.5, -2); ctx.lineTo(s * 6.6, 1.2); ctx.lineTo(s * 5.4, -0.4); ctx.fill(); }
    ctx.beginPath(); // fringe clumps falling over the forehead
    for (let i = 0; i < 4; i++) { const x = -4.6 + i * 2.6 + look * 0.5; ctx.moveTo(x - 1.6, -3.4); ctx.lineTo(x + 0.4, -1.2 + (i % 2) * 0.6); ctx.lineTo(x + 1.4, -3.6); }
    ctx.fill();
    ctx.fillStyle = C.hairDark; ctx.beginPath(); ctx.ellipse(-1 - look * 0.3, -5.2, 3.6, 1.2, -0.2, 0, TAU); ctx.fill();
  }
  // the tuft, and stray strands as your nerve goes
  ctx.strokeStyle = C.hair; ctx.lineWidth = 1.1; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0.8, -6.4); ctx.quadraticCurveTo(1.6, -9.4, 3.6, -9.6); ctx.moveTo(-0.4, -6.4); ctx.quadraticCurveTo(-0.6, -8.8, 1, -9.8); ctx.stroke();
  if (S.san < 0.5) { ctx.lineWidth = 0.45; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = -2.6 + i * 0.55; ctx.moveTo(Math.cos(a) * 5.5, Math.sin(a) * 5.5 - 1.5); ctx.lineTo(Math.cos(a) * 8.2, Math.sin(a) * 8.2 - 1.5 + (i % 2)); } ctx.stroke(); }
  if (hooks.hat) hooks.hat(ctx, B);
  ctx.restore();
  ctx.restore();
  return B;
}

/* weapon carried at rest: each one held its own way. Called inside the body's frame. */
function carry(ctx, B, id, wsx, t) {
  const { shY, S } = B, sh = [wsx * 6.2, shY + 1.5];
  const arm = (hx, hy, bend) => { limb(ctx, sh[0], sh[1], hx, hy, bend, 2.6, B.C.coat); circle(ctx, hx, hy, 1.4, B.C.skin); };
  const icon = (x, y, rot, size) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ICONS[id](ctx, size, t); ctx.restore(); };
  switch (id) {
    case "fork": arm(wsx * 7.5, shY + 8, wsx * -1.5); icon(wsx * 7.8, shY + 6, B.face + Math.PI / 2 + 0.3, 16); circle(ctx, wsx * 7.5, shY + 8, 1.4, B.C.skin); break;
    case "hat": arm(wsx * 7, shY + 10, wsx * -1); ctx.fillStyle = B.C.skinShade; circle(ctx, wsx * 7, shY + 10, 1.6, B.C.skin); break; // the hat is on your head
    case "candy": icon(wsx * 7.5, shY - 6, wsx * 0.2, 14); arm(wsx * 7.5, shY - 1, wsx * 2); ctx.fillStyle = "rgba(255,122,217,.7)"; ctx.fillRect(wsx * 7.5 - 1, shY - 1.6, 2, 1.2); break;
    case "rings": {
      const hx = wsx * 7.6, hy = shY + 9; arm(hx, hy, wsx * -1.2);
      for (const [k, c] of [[0.35, "#7af0ff"], [0.55, "#ff2a4d"], [0.75, "#f6d27a"]]) { // stacked up the forearm
        const x = sh[0] + (hx - sh[0]) * k + wsx * 0.6, y = sh[1] + (hy - sh[1]) * k + 1.5;
        ctx.strokeStyle = c; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 1.5, wsx * 0.3, 0, TAU); ctx.stroke();
      }
      break;
    }
    case "popcorn": {
      icon(wsx * 2.4, shY + 6.5, 0, 12); arm(wsx * 3.6, shY + 8, wsx * 2.2); // hugged to the chest
      const k = (t * 0.9) % 1; if (S.moving && k < 0.5) circle(ctx, wsx * 3 + k * 2, shY + 9 + k * 14, 0.8, "#fff8d8"); // spilling
      break;
    }
    case "mallet": icon(wsx * 5.5, shY - 4, wsx > 0 ? 0 : -1.2, 22); arm(wsx * 4.5, shY + 2.5, wsx * 2.5); break; // over the shoulder
    case "popgun": { // at the hip, the barrel toward where you face (across the body when facing the camera or away)
      const sideOn = B.side > 0.5, gx = sideOn ? B.dir * 4 : wsx * 3.5, gy = shY + 9;
      ctx.save(); ctx.translate(gx, gy); ctx.scale(sideOn ? B.dir : wsx, 1); ctx.rotate(sideOn ? 0.5 : 0.85); ICONS.popgun(ctx, 22, t); ctx.restore();
      arm(gx - (sideOn ? B.dir : wsx) * 1.5, gy + 0.5, wsx * -1.2); break;
    }
    default: if (ICONS[id]) { icon(wsx * 7.5, shY + 7, B.face + 0.5, 15); } arm(wsx * 7.5, shY + 9, wsx * -1.2);
  }
}

export function drawPlayer(ctx, p, t, view) {
  view = view || {};
  const S = guestState(p, t, view);
  const fxv = Math.cos(p.face || 0), fyv = Math.sin(p.face || 0);
  shadow(ctx, 9.5, 4, S.caught ? 0.35 : 0.55);
  if (p.dashT > 0) for (let i = 3; i >= 1; i--) { // dash ghosts
    ctx.save(); ctx.globalAlpha = 0.16 * (4 - i); ctx.translate(-fxv * i * 9, -fyv * i * 9);
    guestBody(ctx, p, t, view, { colors: { coat: "#7af0ff", coatDark: "#3aa0b0", coatLight: "#a8f6ff" } }); ctx.restore();
  }
  if (p.invuln > 0 && !p.dashT && !S.hurtK) ctx.globalAlpha = 0.62;
  const held = S.held;
  const swinging = p.swing > 0;
  const dur = view.swingDur || 0.2;
  const k = swinging ? clamp(1 - p.swing / dur, 0, 1) : 0;
  const arc = p.swingArc || 1.2;
  const wAng = swinging ? (p.face - arc / 2 + arc * smooth(k)) : p.face + 0.5;
  // lantern in one hand, the weapon in the other
  const lsx = Math.abs(fyv) > 0.35 ? -Math.sign(fyv) : -0.35 * Math.sign(fxv);
  const wsx = Math.abs(lsx) < 0.5 ? -lsx * 2 : -lsx;
  const arms = (c, B) => {
    const { shY, S: s, sw, side, dir, tr } = B;
    // ---- the lantern arm: hanging, swinging with the stride, raised toward the face when they're close
    const shx = lsx * 6.2, shy = shY + 1.5;
    let hx = lsx * 7.2 + sw * side * dir * -2.4, hy = shY + 9.5 - s.dread * 4.5 - sw * 0.6 * (1 - side);
    if (s.dash) { hx = lsx * 6 - dir * side * 6; hy = shY + 6; }
    if (s.stuck && !s.reduced) { hx = lsx * 9; hy = shY - 3 + Math.sin(t * 12) * 2; }
    if (s.caught) { hx = lsx * 6.8; hy = shY + 11; }
    if (s.hurtK) { hx = lsx * 4; hy = shY + 1; } // a hand up to the face
    limb(c, shx, shy, hx, hy, lsx * 1.6, 2.6, B.back ? B.C.coatDark : B.C.coat);
    c.fillStyle = "#c0303e"; c.fillRect(hx - 1.2, hy - 1.8, 2.4, 0.8); // paper wristband
    circle(c, hx, hy, 1.4, B.C.skin);
    // the lantern hangs from the bail and swings; it trembles when your nerve goes
    let la = clamp(-(p.vx || 0) * 0.0022, -0.5, 0.5) + sw * 0.22;
    if (tr) la += Math.sin(t * 29) * 0.12 * tr;
    if (s.caught) la = 0;
    const lx = hx + Math.sin(la) * 5.2, ly = hy + Math.cos(la) * 5.2;
    c.strokeStyle = "#5a5040"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(hx, hy); c.lineTo(lx, ly - 2.6); c.stroke();
    c.save(); c.translate(lx, ly); c.rotate(-la * 0.5);
    c.fillStyle = "#2a2622"; c.fillRect(-2.6, -2.8, 5.2, 1.4); c.fillRect(-2.9, 3.6, 5.8, 1.4);
    const g = c.createLinearGradient(0, -1.6, 0, 3.6); g.addColorStop(0, "rgba(255,236,170,.95)"); g.addColorStop(1, "rgba(255,170,70,.95)");
    c.fillStyle = g; c.fillRect(-2.2, -1.5, 4.4, 5.2);
    const gutter = s.san < 0.3 && Math.sin(t * 5.3) > 0.55 ? 0.35 : 1;
    const fh = 2.3 * gutter * (0.85 + 0.15 * Math.sin(t * 17));
    c.fillStyle = "#fff8d8"; c.beginPath(); c.moveTo(-0.8, 2.6); c.quadraticCurveTo(0, 2.6 - fh * 1.4, 0.8, 2.6); c.fill();
    c.strokeStyle = "#2a2622"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-2.2, -1.5); c.lineTo(-2.2, 3.7); c.moveTo(2.2, -1.5); c.lineTo(2.2, 3.7); c.moveTo(0, -1.5); c.lineTo(0, -0.4); c.stroke();
    glint(c, 0, 1.2, 3.2 * gutter, "#ffd890", 0.55);
    c.restore();
    // ---- the weapon arm
    if (swinging) {
      const reach = 15, wx = Math.cos(wAng) * reach, wy = shY + 9 + Math.sin(wAng) * reach * 0.6;
      limb(c, wsx * 6.2, shY + 1.5, wx, wy, wsx * -1.2, 2.6, B.C.coat);
      if (held && ICONS[held]) { c.save(); c.translate(wx, wy); c.rotate(wAng + Math.PI / 2); ICONS[held](c, held === "mallet" ? 22 : 17, t); c.restore(); }
      circle(c, wx, wy, 1.5, B.C.skin);
    } else if (s.stuck && !s.reduced) {
      limb(c, wsx * 6.2, shY + 1.5, wsx * 9, shY - 3 + Math.sin(t * 12 + 2) * 2, wsx * 1.5, 2.6, B.C.coat); circle(c, wsx * 9, shY - 3 + Math.sin(t * 12 + 2) * 2, 1.4, B.C.skin);
    } else if (s.caught) {
      limb(c, wsx * 6.2, shY + 1.5, wsx * 6.8, shY + 11, 0, 2.6, B.C.coat); circle(c, wsx * 6.8, shY + 11, 1.4, B.C.skin);
    } else if (held && !(held === "hat") && ICONS[held]) {
      carry(c, B, held, wsx, t);
    } else {
      const hx2 = wsx * 7.2 - sw * side * dir * -2.4, hy2 = shY + 9.5 + sw * 0.6 * (1 - side);
      limb(c, wsx * 6.2, shY + 1.5, s.dash ? wsx * 6 - dir * side * 6 : hx2, s.dash ? shY + 6 : hy2, wsx * -1.2, 2.6, B.back ? B.C.coatDark : B.C.coat);
      circle(c, s.dash ? wsx * 6 - dir * side * 6 : hx2, s.dash ? shY + 6 : hy2, 1.4, B.C.skin);
    }
    // blood running off the fingers when badly hurt
    if (s.hp < 0.25) { const kk = (t * 1.3) % 1; circle(c, lsx * 7.2, shY + 11 + kk * 8, 0.5 * (1 - kk) + 0.2, B.C.blood); }
  };
  const hat = (c, B) => {
    if (held !== "hat" || S.hatOut || swinging) return;
    c.save(); c.translate(0, -5.6); c.rotate(B.back ? 0 : -B.cx * 0.1); ICONS.hat(c, 17, t); c.restore();
  };
  const B = guestBody(ctx, p, t, view, {}, { arms, hat });
  // hit: a red flinch over the whole silhouette (scaled by the flash setting)
  if (S.hurtK > 0 && S.flash > 0) {
    ctx.save(); ctx.globalAlpha = 0.22 * S.hurtK * S.flash * (S.reduced ? 0.5 : 1); ctx.rotate(B.lean); ctx.translate(0, B.bob); guestGhost(ctx, p, t, "#ff2a3a"); ctx.restore();
  }
  // swing trail: a hot crescent through the arc
  if (swinging) {
    const R = (p.swingRange || 50) * 0.85, a0 = p.face - arc / 2, a1 = wAng;
    ctx.save(); ctx.translate(0, -13); ctx.scale(1, 0.72);
    ctx.globalAlpha = 0.55 * (1 - k * 0.6);
    ctx.fillStyle = view.swingHeavy ? "rgba(255,90,90,.8)" : "rgba(255,243,176,.75)";
    ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.arc(0, 0, R * 0.62, a1, a0, true); ctx.fill();
    ctx.globalAlpha = 0.9 * (1 - k * 0.5); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, R, Math.max(a0, a1 - 0.5), a1); ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* the guest's silhouette: the negative-film afterimage when marked, and the hit flinch.
   Head with its tuft, the scarf end, the coat, legs, the lantern: readable at a glance. */
export function guestGhost(ctx, p, t, col) {
  ctx.save();
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = "round";
  ctx.beginPath(); ctx.ellipse(0, -29, 6.6, 6.8, 0, 0, TAU); ctx.fill();
  ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0.5, -35); ctx.quadraticCurveTo(1.6, -38.5, 3.8, -38.6); ctx.stroke(); // the tuft
  ctx.beginPath(); ctx.moveTo(-7.4, -6); ctx.lineTo(7.4, -6); ctx.quadraticCurveTo(8, -18, 6.4, -22.5); ctx.lineTo(-6.4, -22.5); ctx.quadraticCurveTo(-8, -18, -7.4, -6); ctx.fill();
  ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-3, -21); ctx.quadraticCurveTo(-4, -16, -5.5, -13); ctx.stroke(); // scarf end
  ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-3, 0); ctx.moveTo(3, -8); ctx.lineTo(3, 0); ctx.stroke();
  ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6.4, -20); ctx.lineTo(-7.4, -12.5); ctx.stroke();
  ctx.fillRect(-10, -12, 5.2, 6.4); // the lantern
  ctx.restore();
}

/* ================================================================ the cast */
const LOOKS = [ // the generic Unwilling: taken in the night, in whatever they wore to bed or to work
  { coat: "#5a4a5e", legs: "#2a2230", hair: "#4a3626", stripes: "rgba(220,210,230,.2)", hairStyle: "messy" },     // striped pyjamas
  { coat: "#2f4a32", legs: "#1e2a1e", hair: "#1e140e", sleeve: "#2a4030" },                                       // field coat
  { coat: "#6e5040", legs: "#2a1c14", hair: "#9c8f78", hairStyle: "crop", apron: true },                          // butcher's apron
  { coat: "#4a1a22", legs: "#4a1a22", hair: "#c9b48c", dress: true, hairStyle: "long" },                          // Sunday dress
  { coat: "#b8b0a0", legs: "#b8b0a0", hair: "#3a2a20", dress: true, hairStyle: "long", stains: "rgba(90,10,14,.6)" }, // nightgown
];

export const PEOPLE = {
  player: drawPlayer,
  unwilling(ctx, e, t, view) {
    const L = LOOKS[(e.id || 0) % LOOKS.length];
    const o = { ...L, h: 1 + ((e.id || 0) % 3) * 0.04, tilt: ((e.id || 0) % 3 - 1) * 0.12 };
    if (L.apron) o.over = (c, k, C) => { c.fillStyle = C("#cfc6b4"); c.fillRect(-5, -26 * k, 10, 15 * k); c.fillStyle = "rgba(110,10,16,.75)"; c.fillRect(-3, -19 * k, 5, 4); c.fillRect(1, -15 * k, 3, 4); c.fillRect(-4, -13 * k, 2, 2); };
    figure(ctx, e, t, o, view);
  },
  tobias(ctx, e, t, view) {
    const dir = Math.cos(e.face || 0) >= 0 ? 1 : -1;
    figure(ctx, e, t, { coat: "#d0c6b4", sleeve: "#d0c6b4", legs: "#2c3f5e", hair: "#8a8a86", h: 1.22, width: 1.25, r: 11, hairStyle: "crop", gait: 0.75, armLen: 1.5,
      over(c, k, C) { // overalls bib, two white handprints wiped on it, big
        c.fillStyle = C("#34507a"); c.beginPath(); c.moveTo(-6.5, -11 * k); c.lineTo(6.5, -11 * k); c.lineTo(5.5, -26 * k); c.lineTo(-5.5, -26 * k); c.fill();
        c.strokeStyle = C("#34507a"); c.lineWidth = 1.8; c.beginPath(); c.moveTo(-5.5, -26 * k); c.lineTo(-7, -31 * k); c.moveTo(5.5, -26 * k); c.lineTo(7, -31 * k); c.stroke();
        c.fillStyle = C("#c9b48c"); c.fillRect(-6, -26 * k, 1.8, 1.8); c.fillRect(4.2, -26 * k, 1.8, 1.8);
        c.fillStyle = "rgba(255,255,255,.95)";
        for (const sx of [-2.6, 2.8]) { c.beginPath(); c.ellipse(sx, -17 * k, 2.4, 2.8, sx * 0.1, 0, TAU); c.fill(); for (let i = 0; i < 4; i++) c.fillRect(sx - 2.3 + i * 1.3, -22.6 * k + Math.abs(i - 1.5) * 0.5, 0.85, 3.2); c.fillRect(sx + 1.8, -18.5 * k, 2.2, 0.9); }
      },
      pose(e2, tq, k, wd, shY, hipY, sw) { // the arms reach too far: open hands held out at you, low and wide
        if (e2.alert > 0) return [[dir * 22 - 6, shY + 6 + sw], [dir * 26 + 6, shY + 4 - sw]];
        return [[-12 * wd, hipY + 10 + sw * 2], [12 * wd, hipY + 10 - sw * 2]];
      } }, view);
  },
  sam(ctx, e, t, view) {
    const fast = Math.hypot(e.vx || 0, e.vy || 0) > 90, dir = Math.cos(e.face || 0) >= 0 ? 1 : -1;
    figure(ctx, e, t, { coat: "#4a5230", legs: "#3a3f26", hair: "#2a1c14", h: 1.12, hairStyle: "crop", lean: fast ? 0.14 * dir : 0, gait: 1.15, jaw: 0.35,
      over(c, k, C, e2, t2) { // dog tags on a chain, swinging with each step
        const sw = Math.sin((e2.t || 0) * 12) * (fast ? 2.4 : 0.6);
        c.strokeStyle = "#9c9c9c"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-3, -29 * k); c.lineTo(sw, -21 * k); c.lineTo(3, -29 * k); c.stroke();
        c.fillStyle = "#d8d8d0"; c.fillRect(sw - 1.8, -21.5 * k, 2, 3.2); c.fillRect(sw + 0.4, -20.8 * k, 2, 3.2);
        c.fillStyle = C("#3a4226"); c.fillRect(-6, -25 * k, 4, 3); c.fillRect(2, -25 * k, 4, 3);
      },
      pose(e2, tq, k, wd, shY, hipY, sw) { // hammer raised when he has you
        if (e2.alert > 0) return [[-10 * wd, hipY + 6 + sw * 2], [8 * dir, shY - 12]];
        return [[-9.5 * wd, hipY + 8 + sw * 2], [9.5 * wd, hipY + 8 - sw * 2]];
      },
      hand(c, k, C, e2) { // a claw hammer, the head bloodied
        c.save(); if (e2.alert > 0) c.rotate(Math.PI + 0.4 * dir);
        c.fillStyle = C("#5a3a20"); c.fillRect(-0.9, -1, 1.8, 12); c.fillStyle = C("#7a7a80"); c.fillRect(-3.4, 10, 6.8, 2.8);
        c.strokeStyle = C("#7a7a80"); c.lineWidth = 1.1; c.beginPath(); c.moveTo(3.2, 11); c.quadraticCurveTo(6, 9, 5.4, 6.5); c.stroke();
        c.fillStyle = "rgba(120,8,16,.8)"; c.fillRect(-3.4, 11.5, 3, 1.4);
        c.restore();
      },
      headwear(c, r, C, e2, t2, back) { // nails: through the lips, and one in the brow. He nailed it shut himself
        if (back) return;
        c.strokeStyle = "#8a8a90"; c.lineWidth = Math.max(0.5, r * 0.07);
        c.beginPath();
        for (const [x0, y0, x1, y1] of [[-0.45, 0.2, 0.0, 0.95], [0.4, 0.2, -0.05, 0.95], [0.05, 0.15, 0.1, 1.0], [-0.2, -0.95, -0.12, -0.6]]) { c.moveTo(x0 * r, y0 * r); c.lineTo(x1 * r, y1 * r); }
        c.stroke();
        for (const [x, y] of [[-0.45, 0.2], [0.4, 0.2], [0.05, 0.15], [-0.2, -0.95]]) { circle(c, x * r, y * r, r * 0.09, "#b0b0b8"); circle(c, x * r, y * r + r * 0.12, r * 0.05, "#7a0a14"); }
      } }, view);
  },
  lettie(ctx, e, t, view) {
    const moving = !e.frozen && Math.hypot(e.vx || 0, e.vy || 0) > 20;
    if (moving) { // a smear of her where she just was, and chalk in the air
      ctx.save(); ctx.globalAlpha = 0.2; ctx.translate(-(e.vx || 0) * 0.07, -(e.vy || 0) * 0.07); ellipse(ctx, 0, -26, 8, 22, "#e8dcc4"); ctx.restore();
      for (let i = 0; i < 4; i++) circle(ctx, Math.sin(t * 3 + i * 2) * 8, -8 - ((t * 20 + i * 9) % 26), 0.9, "rgba(255,255,255,.7)");
      ctx.globalAlpha = 0.6;
    }
    // watched, she freezes; the body is turned away, and the head has turned all the way round to you
    figure(ctx, e, t, { coat: "#3a1a3a", legs: "#3a1a3a", hair: "#4a2a18", h: 1.06, dress: true, bun: true, chalk: true, hairStyle: "long", grin: 1.05, eyeW: 1.2, armLen: 1.3,
      backBody: !!e.frozen, tilt: e.frozen ? 0.35 : 0,
      over(c, k, C) { c.fillStyle = C("#e8dcc4"); c.fillRect(-2.5, -29 * k, 5, 2); c.fillStyle = "rgba(255,255,255,.4)"; c.fillRect(-6, -20 * k, 3, 4); c.fillRect(3, -15 * k, 2, 3); },
      pose: e.frozen ? (e2, tq, k, wd, shY) => [[-8 * wd, shY + 16], [17, shY - 10]] : null,
      headwear(c, r, C, e2, t2, back) { circle(c, 0, -r * 0.95, r * 0.45, C("#4a2a18")); c.strokeStyle = C("#e8dcc4"); c.lineWidth = 0.8; c.beginPath(); c.moveTo(-r * 0.3, -r * 1.2); c.lineTo(r * 0.5, -r * 0.6); c.stroke(); } }, view);
    ctx.globalAlpha = 1;
  },
  eli(ctx, e, t, view) {
    const sp = Math.hypot(e.vx || 0, e.vy || 0);
    const skip = sp > 20 && !(e.stun > 0) ? Math.abs(Math.sin(Math.floor((e.t || 0) * 10) / 10 * 9)) * 6 : 0;
    ctx.save(); ctx.scale(0.8, 0.8);
    shadow(ctx, 9, 3.6, 0.35);
    ctx.translate(0, -skip);
    figure(ctx, e, t, { coat: "#c9b48c", stripes: "#6b2a8f", legs: "#34507a", hair: "#b8862b", h: 0.86, barefoot: true, r: 14, hairStyle: "messy", gait: 1.3, grin: 1.3, grinDip: 0.75, jaw: 0.3,
      lhand(c, k, C, e2, t2) { // an empty leash and collar, dragging: he cannot remember her name
        c.strokeStyle = C("#7a4a20"); c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, 2);
        c.quadraticCurveTo(-8, 12 + Math.sin(t2 * 3) * 2, -16, 15 + skip); c.stroke();
        c.strokeStyle = C("#d8b030"); c.lineWidth = 1.6; c.beginPath(); c.ellipse(-18, 14 + skip, 3, 1.6, 0, 0, TAU); c.stroke();
      },
      headwear(c, r, C, e2, t2, back) {
        c.strokeStyle = C("#b8862b"); c.lineWidth = 2; c.beginPath(); c.moveTo(1, -r); c.quadraticCurveTo(4, -r * 1.8, 7, -r * 1.35); c.stroke();
        if (back) return;
        // the rictus: a row of small teeth all the way along the painted grin
        c.fillStyle = "#efe6cc";
        for (let i = -5; i <= 5; i++) { const x = i * r * 0.16, y = r * 0.18 + r * 0.42 * (1 - (i / 6) ** 2) * 0.9 + r * 0.05; c.fillRect(x - r * 0.05, y - r * 0.08, r * 0.1, r * 0.14); }
      } }, view);
    ctx.restore();
  },

  /* Arthur Benning: the pharmacist's clerk who set a camera at the window to
     photograph the light. His camera had one exposure on it. Now it is his face. */
  arthur(ctx, e, t, view) {
    const charging = (e.charge || 0) > 0, dur = e.chargeDur || 1;
    const ck = charging ? clamp(1 - e.charge / dur, 0, 1) : 0;
    const aim = e.aim != null ? e.aim : e.face || 0;
    if (charging) { // telegraph: the aim cone creeping out along the ground
      ctx.save(); ctx.scale(1, 0.55); ctx.rotate(aim);
      ctx.globalAlpha = 0.1 + ck * 0.25;
      ctx.fillStyle = "#e8f4ff"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 40 + ck * 150, -0.38, 0.38); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.5 * ck; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.arc(0, 0, 40 + ck * 150, -0.38, 0.38); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    const dirx = Math.cos(aim) >= 0 ? 1 : -1;
    figure(ctx, { ...e, face: charging ? aim : e.face }, t, {
      coat: "#3a3830", sleeve: "#d8d0c0", legs: "#26241e", hair: "#3a2a1c", h: 1.08, hairStyle: "part", grin: 1.0, jaw: 0.45, noEyes: true,
      over(c, k, C) { // shirt sleeves and waistcoat, bow tie, watch chain
        c.fillStyle = C("#d8d0c0"); c.beginPath(); c.moveTo(-2.5, -29 * k); c.lineTo(2.5, -29 * k); c.lineTo(0, -16 * k); c.fill();
        c.fillStyle = C("#5a1018"); c.beginPath(); c.moveTo(-3, -29.5 * k); c.lineTo(0, -28 * k); c.lineTo(3, -29.5 * k); c.lineTo(3, -26.5 * k); c.lineTo(0, -28 * k); c.lineTo(-3, -26.5 * k); c.fill();
        c.fillStyle = "#c9a54a"; for (let i = 0; i < 3; i++) c.fillRect(-0.6, (-24 + i * 3.5) * k, 1.2, 1.2);
        c.strokeStyle = C("#c9a54a"); c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, -21 * k); c.quadraticCurveTo(4, -19 * k, 5, -21 * k); c.stroke();
      },
      pose(e2, tq, k, wd, shY) { return [[-6 * dirx, shY - 6], [7 * dirx, shY - 7]]; }, // both hands up at the camera, always
      headwear(c, r, C, e2, t2, back) {
        if (back) return;
        c.save(); c.scale(dirx, 1);
        // the camera where a face should be: box, bellows, the lens for one eye
        // straps of grey skin pulled over the box, stitched: it is fastened on
        c.fillStyle = "#141216"; c.fillRect(-r * 1.0, -r * 1.0, r * 1.75, r * 1.2);
        c.fillStyle = "#2a2a30"; c.fillRect(-r * 1.0, -r * 1.0, r * 1.75, r * 0.12);
        c.fillStyle = "#8a8276"; c.fillRect(-r * 1.05, -r * 0.55, r * 0.2, r * 0.75); c.fillRect(r * 0.6, -r * 0.55, r * 0.18, r * 0.75);
        c.strokeStyle = "#3a0a10"; c.lineWidth = 0.5; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(-r * 1.08, -r * 0.45 + i * r * 0.17); c.lineTo(-r * 0.82, -r * 0.45 + i * r * 0.17); c.moveTo(r * 0.57, -r * 0.45 + i * r * 0.17); c.lineTo(r * 0.8, -r * 0.45 + i * r * 0.17); } c.stroke();
        c.fillStyle = "#2a2622"; c.beginPath(); c.moveTo(r * 0.3, -r * 0.85); c.lineTo(r * 0.95, -r * 0.7); c.lineTo(r * 0.95, -r * 0.05); c.lineTo(r * 0.3, r * 0.1); c.fill();
        c.strokeStyle = "#0a0a0a"; c.lineWidth = 0.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(r * (0.42 + i * 0.16), -r * 0.8); c.lineTo(r * (0.42 + i * 0.16), 0); c.stroke(); }
        // the lens, where one eye was
        circle(c, r * 0.2, -r * 0.4, r * 0.42, "#3a3a40"); circle(c, r * 0.2, -r * 0.4, r * 0.3, "#05050a"); circle(c, r * 0.2, -r * 0.4, r * 0.16, "#101826");
        circle(c, r * 0.24, -r * 0.44, r * 0.06, "#c8f0ff"); glint(c, r * 0.22, -r * 0.42, r * 0.14, "#bfe8ff", 0.9);
        c.fillStyle = "#9a0a1c"; c.fillRect(r * 0.12, -r * 0.05, r * 0.08, r * 0.45); // and it weeps
        // the flash, where the other eye was: reflector dish and bulb
        c.strokeStyle = "#7a7a80"; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.6, -r * 0.95); c.lineTo(-r * 0.55, -r * 0.6); c.stroke();
        c.fillStyle = "#c8c8d0"; c.beginPath(); c.ellipse(-r * 0.75, -r * 1.65, r * 0.55, r * 0.45, 0, 0, TAU); c.fill();
        c.fillStyle = "#8a8a94"; c.beginPath(); c.ellipse(-r * 0.72, -r * 1.65, r * 0.38, r * 0.3, 0, 0, TAU); c.fill();
        const glow = charging ? ck : 0.2 + 0.12 * Math.sin(t2 * 2);
        circle(c, -r * 0.72, -r * 1.65, r * (0.14 + glow * 0.12), glow > 0.5 ? "#ffffff" : "#efe6c8");
        glint(c, -r * 0.72, -r * 1.65, r * (0.2 + glow * 0.9), "#ffffff", 0.5 + glow * 0.5);
        c.restore();
      },
    }, view);
  },

  /* The Barker: at the gate, where he has always been. Taller than anyone. The face
     is almost all painted smile, and the megaphone has grown into the jaw.
     Phase 0..3 = how far gone he is. */
  barker(ctx, e, t, view) {
    const ph = clamp(e.phase || 0, 0, 3);
    const winding = (e.windup || 0) > 0, lunging = !!e.lunging, calling = (e.calling || 0) > 0;
    const jit = ph >= 2 && !(view && view.reduced) ? Math.sin(t * 37) * 0.6 * (ph - 1) : 0;
    const face = e.face || 0, dir = Math.cos(face) >= 0 ? 1 : -1;
    ctx.save();
    if (winding) { ctx.translate(-dir * 2, 0); ctx.scale(1.05, 0.88); }
    if (lunging) { ctx.save(); ctx.globalAlpha = 0.22; ctx.translate(-Math.cos(face) * 16, -Math.sin(face) * 8); ellipse(ctx, 0, -46, 13, 34, "#ff2a4d"); ctx.restore(); }
    ctx.translate(jit, 0);
    const o = {
      coat: "#7a1020", stripes: "rgba(240,226,200,.85)", legs: "#1a1418", hair: "#1a1012", h: 1.62, width: 1.3, r: 12.5, hairStyle: "crop",
      grin: 1.38 + ph * 0.06, grinDip: 0.8 + ph * 0.08, jaw: 0.8 + ph * 0.15, alwaysAlert: true, eyeW: 0.65, armLen: 1.6, smooth: false,
      eyeColor: ph >= 3 ? "#ff2a2a" : PAL.bulbHot, tilt: ph >= 1 ? 0.14 * dir : 0, gait: 0.8, lean: lunging ? 0.38 * dir : winding ? -0.16 * dir : 0,
      over(c, k, C) {
        c.fillStyle = C("#1a0a0e"); c.beginPath(); c.moveTo(-3, -28 * k); c.lineTo(3, -28 * k); c.lineTo(0, -14 * k); c.fill();
        for (let i = 0; i < 3; i++) circle(c, 0, (-24 + i * 4) * k, 0.9, C("#f6d27a"));
        c.fillStyle = C("#5a0a16"); c.beginPath(); c.moveTo(-8, -12 * k); c.lineTo(-11, -1 * k); c.lineTo(-5, -9 * k); c.fill(); c.beginPath(); c.moveTo(8, -12 * k); c.lineTo(11, -1 * k); c.lineTo(5, -9 * k); c.fill();
        if (ph >= 2) { c.fillStyle = "#12040a"; c.beginPath(); c.moveTo(4, -22 * k); c.lineTo(8, -20 * k); c.lineTo(5, -16 * k); c.fill(); c.fillStyle = "rgba(140,10,20,.85)"; c.fillRect(-7, -18 * k, 3, 9); }
      },
      pose(e2, tq, k, wd, shY, hipY, sw) {
        if (calling) return [[-12 * wd, hipY - 2], [14 * dir, shY - 14]];       // one hand flung up to the crowd
        if (lunging) return [[20 * dir, shY + 2], [26 * dir, shY + 5]];         // both arms out, reaching
        if (winding) return [[-17 * wd, shY - 6], [17 * wd, shY - 8]];         // arms flung wide
        return [[-12 * wd, hipY + 4 + sw * 2], [13 * wd, hipY + 10 + Math.sin(tq * 1.5) * 2]];
      },
      lhand(c, k, C) { // the cane: black, silver-topped
        c.strokeStyle = C("#0e0a0c"); c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, -3); c.lineTo(lunging ? 8 : 1, lunging ? 12 : 22); c.stroke();
        circle(c, 0, -3.5, 2, C("#c8c8d0"));
      },
      headwear(c, r, C, e2, t2, back) {
        // the megaphone, grown into the jaw: the bell where the chin should be, a seam of grey flesh and stitches
        if (!back) {
          c.save(); c.translate(0, r * 0.95); c.rotate(dir * 0.5 + (calling ? -dir * 0.6 : 0));
          c.fillStyle = "#8a8276"; c.beginPath(); c.ellipse(0, 0, r * 0.42, r * 0.22, 0, 0, TAU); c.fill();
          c.scale(0.72, 0.72); c.fillStyle = C("#d8c8a0"); c.beginPath(); c.moveTo(-r * 0.3, 0); c.lineTo(-r * 0.75, r * 1.3); c.lineTo(r * 0.75, r * 1.3); c.lineTo(r * 0.3, 0); c.fill();
          c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(r * 0.05, 0); c.lineTo(r * 0.3, r * 1.3); c.lineTo(r * 0.75, r * 1.3); c.lineTo(r * 0.3, 0); c.fill();
          c.fillStyle = C("#7a1020"); c.beginPath(); c.ellipse(0, r * 1.3, r * 0.78, r * 0.2, 0, 0, TAU); c.fill();
          c.fillStyle = "#0a0204"; c.beginPath(); c.ellipse(0, r * 1.32, r * 0.62, r * 0.13, 0, 0, TAU); c.fill();
          c.strokeStyle = "#3a0a10"; c.lineWidth = 0.6; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(i * r * 0.14, -r * 0.18); c.lineTo(i * r * 0.14, r * 0.18); } c.stroke();
          c.fillStyle = "rgba(150,8,24,.85)"; c.fillRect(r * 0.2, r * 0.15, r * 0.08, r * 0.6);
          c.restore();
        }
        // the top hat, sliding off as he comes apart
        if (ph >= 3) { c.fillStyle = "rgba(140,10,20,.9)"; c.fillRect(-r * 0.5, -r * 1.02, r * 0.3, r * 0.5); return; }
        c.save(); c.translate(ph * 1.2, -r * 0.82); c.rotate(-0.08 + ph * 0.12);
        c.fillStyle = C("#0e0a0c"); c.beginPath(); c.ellipse(0, 0, r * 1.25, r * 0.28, 0, 0, TAU); c.fill();
        c.fillRect(-r * 0.72, -r * 1.7, r * 1.44, r * 1.7);
        c.fillStyle = C("#7a1020"); c.fillRect(-r * 0.72, -r * 0.42, r * 1.44, r * 0.3);
        c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(-r * 0.6, -r * 1.65, r * 0.18, r * 1.5);
        if (ph >= 1) { c.fillStyle = "#1a0a0e"; c.beginPath(); c.moveTo(r * 0.3, -r * 1.7); c.lineTo(r * 0.72, -r * 1.7); c.lineTo(r * 0.72, -r * 1.2); c.fill(); }
        c.restore();
      },
    };
    figure(ctx, e, t, o, view);
    const headY = -28 * 1.62 - 12.5 * 0.72;
    ctx.fillStyle = PAL.mouth; // paint drips, more as he comes apart
    for (let i = 0; i < 2 + ph * 2; i++) { const dx = (i % 2 ? 1 : -1) * (5 + i * 1.8), len = 3 + ((t * 2 + i * 0.7) % 3) * (1 + ph * 0.6); ctx.fillRect(dx, headY + 6, 1, len); }
    if (calling) { // the call: rings out of the bell
      ctx.strokeStyle = "rgba(255,210,140,.6)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const rr = 10 + ((t * 60 + i * 14) % 42); ctx.globalAlpha = 1 - rr / 52; ctx.beginPath(); ctx.arc(dir * 10, headY + 20, rr, -0.6 + (dir < 0 ? Math.PI : 0), 0.6 + (dir < 0 ? Math.PI : 0)); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};
