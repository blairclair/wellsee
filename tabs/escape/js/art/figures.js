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

/* ================================================================ the guest (player) */
function guestBody(ctx, p, t, view, o = {}) {
  const sp = Math.hypot(p.vx || 0, p.vy || 0), moving = p.moving || sp > 20;
  const face = p.face || 0, cx = Math.cos(face), sy = Math.sin(face);
  const back = sy < -0.6, side = Math.abs(cx);
  const ph = (p.step != null ? p.step * 2 : t * 6);
  const sw = moving ? Math.sin(ph) : 0;
  const bob = moving ? -Math.abs(Math.cos(ph)) * 1.6 : Math.sin(t * 2) * 0.4;
  const run = clamp(sp / 160, 0, 1.4);
  const coat = o.coat || "#2f5560", coatDark = o.coatDark || "#203c44";
  ctx.save();
  if (moving) ctx.rotate(Math.sign(cx || 1) * side * run * 0.1);
  ctx.translate(0, bob);
  const hipY = -9, shY = -22;
  for (const s of [-1, 1]) {
    const st = sw * s, fx = s * 3 + st * 4.5 * side * Math.sign(cx || 1), fy = -Math.max(0, st) * 3;
    limb(ctx, s * 2.8, hipY, fx, fy, s * (1.2 + st), 3.6, "#1e1a22");
    ellipse(ctx, fx, fy - 0.5, 3, 1.7, "#3a2418");
  }
  // coat with a tail that swings
  ctx.fillStyle = coat;
  ctx.beginPath(); ctx.moveTo(-7, hipY + 3); ctx.lineTo(7, hipY + 3 - sw); ctx.quadraticCurveTo(8, shY + 4, 6, shY); ctx.quadraticCurveTo(0, shY - 1.5, -6, shY); ctx.quadraticCurveTo(-8, shY + 4, -7, hipY + 3); ctx.fill();
  ctx.fillStyle = coatDark; ctx.beginPath(); ctx.moveTo(2, hipY + 3); ctx.lineTo(7, hipY + 3 - sw); ctx.quadraticCurveTo(8, shY + 4, 6, shY); ctx.lineTo(3, shY); ctx.fill();
  if (!back) { ctx.fillStyle = "#c9b48c"; for (let i = 0; i < 3; i++) circle(ctx, 0.5, shY + 4 + i * 3.6, 0.7, "#c9b48c"); }
  // a ticket stub still in the hatband pocket: admit one
  if (!back) { ctx.fillStyle = "#e8c860"; ctx.fillRect(-5.5, shY + 3, 3, 2); }
  // scarf
  ctx.fillStyle = "#b8862b"; ctx.fillRect(-5.5, shY - 1.5, 11, 3.2);
  ctx.fillRect(back ? 2 : -4, shY + 1, 2.4, 6 + sw);
  // head
  const hy = shY - 6.8;
  ellipse(ctx, 0, hy, 6.2, 6.6, "#e2c09e");
  ctx.fillStyle = "#3a2418";
  if (back) { ellipse(ctx, 0, hy - 0.5, 6.4, 6.6, "#3a2418"); }
  else {
    ctx.beginPath(); ctx.ellipse(0, hy - 1.5, 6.6, 5.6, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-cx * 2 - 2, hy - 3.6, 4, 2.4, -0.3, 0, TAU); ctx.fill();
    // eyes wide with fear, looking where you face
    const ex = cx * 1.8, ey = Math.max(-0.5, sy) * 1.2;
    for (const s of [-1, 1]) { ellipse(ctx, s * 2.3 + ex, hy + 0.4 + ey * 0.4, 1.5, 1.7, "#fbf6ee"); circle(ctx, s * 2.3 + ex * 1.25, hy + 0.5 + ey * 0.6, 0.75, "#120a08"); }
    ellipse(ctx, ex * 0.8, hy + 3.6, 1.1, 1.4, "#5a2a22"); // mouth open, breathing hard
    ctx.fillStyle = "rgba(160,60,50,.25)"; ctx.fillRect(-5, hy + 1.5, 2, 1.2); ctx.fillRect(3, hy + 1.5, 2, 1.2);
  }
  ctx.restore();
  return { bob, sw, back, cx, sy, shY, hipY };
}

export function drawPlayer(ctx, p, t, view) {
  view = view || {};
  const fxv = Math.cos(p.face || 0), fyv = Math.sin(p.face || 0);
  shadow(ctx, 9.5, 4, 0.55);
  if (p.dashT > 0) for (let i = 3; i >= 1; i--) { // dash ghosts
    ctx.save(); ctx.globalAlpha = 0.16 * (4 - i); ctx.translate(-fxv * i * 9, -fyv * i * 9);
    guestBody(ctx, p, t, view, { coat: "#7af0ff", coatDark: "#3aa0b0" }); ctx.restore();
  }
  if (p.invuln > 0 && !p.dashT) ctx.globalAlpha = 0.62;
  const held = view.heldWeapon;
  const behind = fyv < -0.3; // weapon arm drawn behind the body when facing away
  const swinging = p.swing > 0;
  const dur = view.swingDur || 0.2;
  const k = swinging ? clamp(1 - p.swing / dur, 0, 1) : 0;
  const arc = p.swingArc || 1.2;
  const wAng = swinging ? (p.face - arc / 2 + arc * (k * k * (3 - 2 * k))) : p.face + 0.5;
  const reach = swinging ? 15 : 9;
  const handX = Math.cos(wAng) * reach, handY = -13 + Math.sin(wAng) * reach * 0.6;
  const drawWeapon = () => {
    if (held && ICONS[held]) { ctx.save(); ctx.translate(handX, handY); ctx.rotate(wAng + Math.PI / 2); ICONS[held](ctx, 17, t); ctx.restore(); }
    circle(ctx, handX, handY, 2.2, "#e2c09e");
  };
  if (behind) drawWeapon();
  const body = guestBody(ctx, p, t, view);
  // lantern hand, the other side
  const lx = -fyv * 8 - fxv * 3, ly = -12 + body.bob + Math.abs(fxv) * 1.5 + body.sw * 1.2;
  line(ctx, lx, ly - 7, lx, ly - 3.5, 0.8, "#4a4030");
  ctx.fillStyle = "#2a2622"; ctx.fillRect(lx - 2.6, ly - 4, 5.2, 1.6); ctx.fillRect(lx - 2.6, ly + 3, 5.2, 1.4);
  ctx.fillStyle = "rgba(255,214,120,.95)"; ctx.fillRect(lx - 2.1, ly - 2.4, 4.2, 5.4);
  circle(ctx, lx, ly + 0.3, 1.4, "#fff8d8");
  if (!behind) drawWeapon();
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

/* the guest's silhouette, for the negative-film afterimage when marked */
export function guestGhost(ctx, p, t, col) {
  ctx.save();
  ctx.fillStyle = col; ctx.strokeStyle = col;
  ctx.beginPath(); ctx.ellipse(0, -29, 6.4, 6.8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(6, -22); ctx.lineTo(-6, -22); ctx.fill();
  ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-3, 0); ctx.moveTo(3, -8); ctx.lineTo(3, 0); ctx.stroke();
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
