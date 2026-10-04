/* art/face.js — the big painted face used by the title, the caught scene and
 * the close-range face-flash. Drawn procedurally at any size.
 *
 * bigFace(ctx, cx, cy, r, t, o)
 *   o.paint 0..1   how far the greasepaint has covered the skin
 *   o.jaw   0..1   how far the jaw has been fixed open
 *   o.hollow 0..1  eyes: wet and frightened (0) -> sunk black with a pinprick of light (1)
 *   o.skin         base skin colour under the paint
 *   o.shirt        collar colour
 *   o.seed         varies cracks and hair
 *   o.tilt         head tilt (radians)
 *   o.guest        dress it as the player: striped jumper, teal lapels, mustard scarf, short hair, fringe and tuft
 */
import { TAU, hash, lerpColor, clamp } from "./util.js";

function crackPath(ctx, x, y, a, len, seed, depth) {
  ctx.moveTo(x, y);
  let px = x, py = y;
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const aa = a + (hash(seed, i, 3) - 0.5) * 1.1;
    px += Math.cos(aa) * len / n; py += Math.sin(aa) * len / n;
    ctx.lineTo(px, py);
    if (depth > 0 && hash(seed, i, 9) < 0.35) { crackPath(ctx, px, py, aa + (hash(seed, i, 4) < 0.5 ? 0.9 : -0.9), len * 0.4, seed * 7 + i, depth - 1); ctx.moveTo(px, py); }
  }
}

export function bigFace(ctx, cx, cy, r, t, o = {}) {
  const paint = clamp(o.paint ?? 1, 0, 1), jaw = clamp(o.jaw ?? 1, 0, 1), hollow = clamp(o.hollow ?? 1, 0, 1);
  const seed = o.seed || 3;
  const skin = o.skin || "#a49c8c";
  const chin = r * (1.18 + jaw * 0.32);   // the jaw hangs: the face gets longer
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.tilt || 0);

  // shoulders and collar
  ctx.fillStyle = o.shirt || "#2a2620";
  ctx.beginPath(); ctx.moveTo(-r * 2.3, r * 3.2); ctx.quadraticCurveTo(-r * 2.1, r * 1.55, -r * 0.5, r * 1.35 + jaw * r * 0.2); ctx.lineTo(r * 0.5, r * 1.35 + jaw * r * 0.2); ctx.quadraticCurveTo(r * 2.1, r * 1.55, r * 2.3, r * 3.2); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 1.3); ctx.lineTo(0, r * 2.2); ctx.lineTo(r * 0.5, r * 1.3); ctx.fill();
  if (o.guest) { // the guest's own clothes: the teal coat open over the striped jumper, the mustard scarf
    ctx.save(); ctx.beginPath(); ctx.moveTo(-r * 0.62, r * 1.4); ctx.lineTo(0, r * 3.2); ctx.lineTo(r * 0.62, r * 1.4); ctx.closePath(); ctx.clip();
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? "#e6d8bc" : "#a8283a"; ctx.fillRect(-r, r * 1.35 + i * r * 0.16, r * 2, r * 0.16); }
    ctx.restore();
    ctx.fillStyle = "#40707a"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.62, r * 1.4); ctx.lineTo(s * r * 1.05, r * 1.5); ctx.lineTo(s * r * 0.35, r * 2.6); ctx.fill(); }
  }
  // neck, grey where the paint stopped
  ctx.fillStyle = lerpColor(skin, "#7a7266", 0.4); ctx.fillRect(-r * 0.42, r * 0.7, r * 0.84, r * 0.9);
  // red run down the neck from the mouth
  if (paint > 0.4) { ctx.fillStyle = `rgba(150,8,24,${(paint - 0.4) * 1.4})`; ctx.fillRect(r * 0.18, r * 1.1, r * 0.07, r * (0.5 + jaw * 0.6)); ctx.fillRect(-r * 0.3, r * 1.15, r * 0.05, r * 0.35 * jaw); }

  // hair behind: matted, hanging (the guest's is short)
  const hair = o.hair || "#1e1612", hairK = o.guest ? 0.22 : 1;
  ctx.strokeStyle = hair; ctx.lineCap = "round";
  for (let i = 0; i < 46; i++) {
    const a = Math.PI * (0.92 + (i / 45) * 1.16), sx = Math.cos(a) * r * 0.98, sy = Math.sin(a) * r * 1.05 - r * 0.1;
    const len = r * (0.5 + hash(seed, i, 1) * 0.9) * (Math.abs(Math.cos(a)) > 0.6 ? 1.6 : 0.4) * hairK;
    ctx.lineWidth = r * (0.05 + hash(seed, i, 2) * 0.07);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx * 1.15, sy + len * 0.5, sx * (1.05 + hash(seed, i, 5) * 0.2), sy + len); ctx.stroke();
  }

  // head shape: gaunt, cheekbones, the long hanging jaw
  const head = new Path2D();
  head.moveTo(0, -r * 1.12);
  head.bezierCurveTo(r * 0.72, -r * 1.12, r * 0.98, -r * 0.6, r * 0.95, -r * 0.05);
  head.bezierCurveTo(r * 0.94, r * 0.3, r * 0.78, r * 0.45, r * 0.7, r * 0.62);
  head.bezierCurveTo(r * 0.6, chin * 0.85, r * 0.35, chin, 0, chin);
  head.bezierCurveTo(-r * 0.35, chin, -r * 0.6, chin * 0.85, -r * 0.7, r * 0.62);
  head.bezierCurveTo(-r * 0.78, r * 0.45, -r * 0.94, r * 0.3, -r * 0.95, -r * 0.05);
  head.bezierCurveTo(-r * 0.98, -r * 0.6, -r * 0.72, -r * 1.12, 0, -r * 1.12);
  ctx.fillStyle = skin; ctx.fill(head);

  ctx.save(); ctx.clip(head);
  // the greasepaint, laid on in strokes from the brow down
  const cover = -r * 1.2 + paint * (chin + r * 1.4);
  ctx.fillStyle = "#ece6d8";
  ctx.beginPath(); ctx.moveTo(-r * 1.2, -r * 1.3);
  for (let i = 0; i <= 12; i++) { const x = -r * 1.2 + (i / 12) * r * 2.4; ctx.lineTo(x, cover + (hash(seed, i, 8) - 0.5) * r * 0.25); }
  ctx.lineTo(r * 1.2, -r * 1.3); ctx.fill();
  // shading: light from above, cheek hollows, the side in shadow
  const sh = ctx.createLinearGradient(-r, 0, r, 0);
  sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.55, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(20,10,20,.55)");
  ctx.fillStyle = sh; ctx.fillRect(-r * 1.2, -r * 1.3, r * 2.4, chin + r * 1.4);
  const vs = ctx.createLinearGradient(0, -r, 0, chin);
  vs.addColorStop(0, "rgba(0,0,0,0)"); vs.addColorStop(0.55, "rgba(0,0,0,.05)"); vs.addColorStop(1, "rgba(20,8,14,.55)");
  ctx.fillStyle = vs; ctx.fillRect(-r * 1.2, -r * 1.3, r * 2.4, chin + r * 1.4);
  for (const s of [-1, 1]) { ctx.fillStyle = "rgba(60,40,50,.28)"; ctx.beginPath(); ctx.ellipse(s * r * 0.6, r * 0.32, r * 0.2, r * 0.38, s * 0.3, 0, TAU); ctx.fill(); }
  // cracks in the paint and flakes peeled back to grey skin
  if (paint > 0.5) {
    const ca = (paint - 0.5) * 2;
    ctx.strokeStyle = `rgba(60,48,40,${0.55 * ca})`; ctx.lineWidth = Math.max(0.6, r * 0.012);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) crackPath(ctx, (hash(seed, i, 11) - 0.5) * r * 1.6, (hash(seed, i, 12) - 0.6) * r * 1.6, hash(seed, i, 13) * TAU, r * (0.3 + hash(seed, i, 14) * 0.4), seed * 31 + i, 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(150,140,124,${0.9 * ca})`;
    for (let i = 0; i < 7; i++) {
      const fx = (hash(seed, i, 21) - 0.5) * r * 1.5, fy = (hash(seed, i, 22) - 0.55) * r * 1.7, fs = r * (0.05 + hash(seed, i, 23) * 0.1);
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + fs, fy + fs * 0.3); ctx.lineTo(fx + fs * 0.7, fy + fs * 1.1); ctx.lineTo(fx - fs * 0.2, fy + fs * 0.8); ctx.fill();
    }
  }
  ctx.restore();

  if (o.guest) { // the scarf, the fringe and the tuft that won't lie down
    ctx.fillStyle = "#c8922e"; ctx.beginPath(); ctx.moveTo(-r * 0.75, chin * 0.82); ctx.quadraticCurveTo(0, chin * 1.2, r * 0.75, chin * 0.82); ctx.lineTo(r * 0.85, chin * 1.12); ctx.quadraticCurveTo(0, chin * 1.5, -r * 0.85, chin * 1.12); ctx.fill();
    ctx.fillStyle = "#8a5e18"; ctx.fillRect(-r * 0.75, chin * 1.06, r * 1.5, r * 0.05);
    ctx.fillStyle = "#c8922e"; ctx.fillRect(-r * 0.6, chin * 1.15, r * 0.3, r * 1.2);
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.ellipse(0, -r * 0.78, r * 0.98, r * 0.5, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const x = -r * 0.8 + i * r * 0.32; ctx.moveTo(x - r * 0.18, -r * 0.82); ctx.lineTo(x + r * 0.04, -r * (0.42 + hash(seed, i, 61) * 0.18)); ctx.lineTo(x + r * 0.2, -r * 0.84); }
    ctx.fill();
    ctx.strokeStyle = hair; ctx.lineWidth = r * 0.09; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 1.2); ctx.quadraticCurveTo(r * 0.2, -r * 1.55, r * 0.5, -r * 1.55); ctx.moveTo(-r * 0.08, -r * 1.2); ctx.quadraticCurveTo(-r * 0.1, -r * 1.5, r * 0.12, -r * 1.62); ctx.stroke();
  }
  // painted eyebrows, high and arched, surprised forever
  if (paint > 0.3) {
    ctx.strokeStyle = `rgba(14,6,10,${clamp((paint - 0.3) * 2, 0, 0.9)})`; ctx.lineWidth = r * 0.035;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.12, -r * 0.55); ctx.quadraticCurveTo(s * r * 0.38, -r * 1.0, s * r * 0.7, -r * 0.62); ctx.stroke(); }
  }

  // eyes
  const eyeY = -r * 0.22;
  for (const s of [-1, 1]) {
    const ex = s * r * 0.37;
    // socket smudge, bleeding outward
    const g = ctx.createRadialGradient(ex, eyeY, r * 0.05, ex, eyeY, r * (0.3 + hollow * 0.12));
    g.addColorStop(0, `rgba(6,2,4,${0.5 + hollow * 0.5})`); g.addColorStop(0.6, `rgba(20,6,12,${0.35 + hollow * 0.45})`); g.addColorStop(1, "rgba(20,6,12,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, eyeY, r * (0.32 + hollow * 0.1), r * (0.3 + hollow * 0.16), s * 0.2, 0, TAU); ctx.fill();
    // the eye: white and wet at first; then only black with a pinprick
    const w = r * 0.17, h = r * (0.11 + (1 - hollow) * 0.05);
    ctx.fillStyle = lerpColor("#f2ece0", "#050203", hollow);
    ctx.beginPath(); ctx.ellipse(ex, eyeY, w, h, 0, 0, TAU); ctx.fill();
    if (hollow < 0.8) { ctx.fillStyle = `rgba(30,20,16,${1 - hollow})`; ctx.beginPath(); ctx.arc(ex + s * r * 0.02, eyeY, r * 0.07, 0, TAU); ctx.fill(); }
    if (hollow > 0.5) { // eyeshine
      const k = (hollow - 0.5) * 2, flick = 0.75 + 0.25 * Math.sin(t * 3 + s);
      const eg = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, r * 0.16);
      eg.addColorStop(0, `rgba(255,236,160,${0.75 * k * flick})`); eg.addColorStop(1, "rgba(255,236,160,0)");
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, eyeY, r * 0.16, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,250,220,${k})`; ctx.beginPath(); ctx.arc(ex + s * r * 0.015, eyeY - r * 0.01, r * 0.025, 0, TAU); ctx.fill();
    }
    // runs from the eyes: tears first, then red
    const runC = paint > 0.6 ? `rgba(150,8,24,${0.85})` : `rgba(170,210,240,${0.5 * (1 - paint)})`;
    ctx.fillStyle = runC;
    const rl = r * (0.35 + hash(seed, s + 5, 1) * 0.4) * (0.6 + paint * 0.6);
    ctx.fillRect(ex - r * 0.03 + s * r * 0.06, eyeY + h * 0.8, r * 0.045, rl);
    ctx.beginPath(); ctx.arc(ex - r * 0.008 + s * r * 0.06, eyeY + h * 0.8 + rl, r * 0.035, 0, TAU); ctx.fill();
  }

  // nose: grey, the paint split across the bridge
  ctx.fillStyle = "rgba(60,40,40,.35)"; ctx.beginPath(); ctx.moveTo(-r * 0.05, -r * 0.1); ctx.lineTo(-r * 0.12, r * 0.18); ctx.lineTo(r * 0.06, r * 0.2); ctx.fill();
  ctx.fillStyle = "#2a1414"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.06, r * 0.19, r * 0.035, r * 0.022, s * 0.4, 0, TAU); ctx.fill(); }

  // the second mouth: painted on, wider than the face, upturned to the ears
  const mY = r * 0.36, mw = r * (0.35 + paint * 0.75), dip = r * (0.15 + paint * 0.55);
  if (paint > 0.05) {
    ctx.fillStyle = "#b80e26";
    ctx.beginPath();
    ctx.moveTo(-mw, mY - r * 0.25 * paint);
    ctx.bezierCurveTo(-mw * 0.7, mY + dip * 1.1, mw * 0.7, mY + dip * 1.1, mw, mY - r * 0.25 * paint);
    ctx.bezierCurveTo(mw * 0.55, mY + dip * 0.45, -mw * 0.55, mY + dip * 0.45, -mw, mY - r * 0.25 * paint);
    ctx.fill();
    ctx.strokeStyle = "#5e0410"; ctx.lineWidth = r * 0.025; ctx.stroke();
    // brush texture, smeared edges, drips
    ctx.strokeStyle = "rgba(255,90,100,.25)"; ctx.lineWidth = r * 0.02;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-mw * 0.8 + i * mw * 0.35, mY + dip * 0.55); ctx.lineTo(-mw * 0.6 + i * mw * 0.35, mY + dip * 0.75); ctx.stroke(); }
    ctx.fillStyle = "#b80e26";
    for (let i = 0; i < 6; i++) { const x = (hash(seed, i, 41) - 0.5) * mw * 1.8, l = r * (0.08 + hash(seed, i, 42) * 0.3) * paint; ctx.fillRect(x, mY + dip * 0.85, r * 0.03, l); ctx.beginPath(); ctx.arc(x + r * 0.015, mY + dip * 0.85 + l, r * 0.025, 0, TAU); ctx.fill(); }
  }
  // the real mouth beneath: open, fixed open, the jaw hanging
  const oh = r * (0.1 + jaw * 0.42), ow = r * (0.16 + jaw * 0.05), oy = mY + r * 0.18 + jaw * r * 0.12;
  ctx.fillStyle = "#0a0204"; ctx.beginPath(); ctx.ellipse(0, oy, ow, oh, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#4a0a14"; ctx.beginPath(); ctx.ellipse(0, oy + oh * 0.55, ow * 0.6, oh * 0.3, 0, 0, TAU); ctx.fill(); // tongue, far back
  ctx.fillStyle = "#d8cca8";
  for (let i = -2; i <= 2; i++) {
    const tw = ow * 0.3, tx = i * ow * 0.34 - tw / 2, tl = r * (0.05 + hash(seed, i + 9, 2) * 0.05);
    ctx.fillRect(tx, oy - oh * 0.92, tw * 0.85, tl);
    if (jaw > 0.3) ctx.fillRect(tx + tw * 0.1, oy + oh * 0.92 - tl * 0.9, tw * 0.8, tl * 0.9);
  }
  ctx.fillStyle = "rgba(150,8,24,.85)"; ctx.fillRect(ow * 0.3, oy + oh * 0.85, r * 0.03, r * 0.22 * jaw); // something runs from it
  ctx.restore();
}
