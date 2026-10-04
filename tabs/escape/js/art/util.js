/* art/util.js — shared palette, hashing, shape helpers and the sprite cache.
 * Part of the ART agent's files (art.js imports everything under js/art/). */
export const TAU = Math.PI * 2;
export const PAL = {
  void: "#07060a", blood: "#8b1414", candy: "#ff2a4d", candyDark: "#a3122e", poison: "#7dff4a",
  poisonDark: "#2f7a1a", bulb: "#f6d27a", bulbHot: "#fff3b0", bruise: "#6b2a8f", bruiseDark: "#341447",
  cream: "#efe2c6", teal: "#1f6f78", ink: "#e8dcc4", face: "#f4efe6", pink: "#ff7ad9", cyan: "#7af0ff",
  paint: "#f3eee4", paintShade: "#c9bfae", mouth: "#c0122c", mouthDark: "#6e0714", gap: "#12040a",
};
export const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function ellipse(ctx, x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function shadow(ctx, rx, ry = rx * 0.42, a = 0.5) { ellipse(ctx, 0, 0, rx, ry, `rgba(0,0,0,${a})`); }
export function line(ctx, x0, y0, x1, y1, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
/** Two-segment limb from (x0,y0) through a bent joint to (x2,y2). bend > 0 bends to +x. */
export function limb(ctx, x0, y0, x2, y2, bend, w, col) {
  const mx = (x0 + x2) / 2, my = (y0 + y2) / 2, dx = x2 - x0, dy = y2 - y0, d = Math.hypot(dx, dy) || 1;
  const jx = mx + (-dy / d) * bend, jy = my + (dx / d) * bend;
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(jx, jy); ctx.lineTo(x2, y2); ctx.stroke();
  return [jx, jy];
}

export function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function lerpColor(a, b, k) {
  const [r0, g0, b0] = hex(a), [r1, g1, b1] = hex(b);
  return `rgb(${Math.round(r0 + (r1 - r0) * k)},${Math.round(g0 + (g1 - g0) * k)},${Math.round(b0 + (b1 - b0) * k)})`;
}
export function rgba(c, a) { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; }

/* ---- sprite cache: offscreen canvases built once, reused every frame ---- */
const cache = new Map();
export function sprite(key, w, h, draw) {
  let c = cache.get(key);
  if (!c) {
    c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    draw(c.getContext("2d"), c.width, c.height); cache.set(key, c);
  }
  return c;
}
/** White radial falloff, used both to punch the darkness and (tinted) as glow. */
export function lightSprite(soft) {
  return sprite("light" + (soft ? "s" : "h"), 128, 128, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    if (soft) { gr.addColorStop(0, "rgba(255,255,255,.6)"); gr.addColorStop(0.35, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
    else { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,.85)"); gr.addColorStop(0.7, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
export function glowSprite(color) {
  return sprite("glow" + color, 96, 96, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(color, 0.55)); gr.addColorStop(0.3, rgba(color, 0.2)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
/** A wedge of light pointing along +x from the left-centre, length = width. */
export function coneSprite() {
  return sprite("cone", 160, 160, (g, w, h) => {
    const gr = g.createRadialGradient(0, h / 2, 0, 0, h / 2, w);
    gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.6, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, 0); g.lineTo(w, h); g.closePath(); g.fill();
  });
}
