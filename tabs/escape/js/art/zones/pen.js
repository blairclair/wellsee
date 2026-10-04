/* Stage backdrop for the "pen" zone: the Petting Pen. Owned by ONE agent; see art/zones/README.md.
 *
 * A petting zoo dressed for a party nobody left. Past the walls: a skyline of striped
 * tents, two Ferris wheels with rabbits riding the gondolas, a stalled coaster, and a
 * giant inflatable rabbit with no face, only a grin; neon that promises "LET THEM PET YOU";
 * balloons rising against the wind. Below the south wall a row of "your face here" rabbit
 * cutouts, and something is already looking out of every hole. Inside the map, decor stays
 * on solid tiles: candy-painted fence pickets, fairy bulbs, hand-painted signs, pennants.
 *
 * Cost: the void bands are painted once into offscreen canvases (per level); each frame
 * blits only the visible slice, then a handful of cached sprites (wheels, neon) and cheap
 * shapes (balloons, eyes, pennants). The void is drawn in `glow` (after the darkness pass,
 * which would otherwise black it out) and clipped so it never touches the map itself.
 */
import { TILE, TILES } from "../../content.js";
import { TAU, hash, clamp, circle, ellipse, rgba } from "../util.js";
import { isReduced } from "../../settings.js";

const D = 200;         // depth of the painted void around the map, world px
const T = TILE;
const VIVID = ["#ff3d8b", "#7dff4a", "#ffd23a", "#4ad8ff", "#b46cff", "#ff8a2a"];
const PASTEL = ["#ff8fc4", "#9dffb0", "#fff07a", "#8fe6ff", "#d8a6ff"];
const pick = (arr, i) => arr[((Math.floor(i) % arr.length) + arr.length) % arr.length];
const FONT = "Impact, 'Arial Black', 'Helvetica Neue', sans-serif";

const reducedOf = (view) => !!(view && view.reduced) || isReduced();
const solid = (game, tx, ty) => tx < 0 || ty < 0 || tx >= game.w || ty >= game.h || !!TILES[game.tiles[ty * game.w + tx]].solid;
const tileAt = (game, tx, ty) => (tx < 0 || ty < 0 || tx >= game.w || ty >= game.h ? "" : game.tiles[ty * game.w + tx]);

/* ------------------------------------------------------------------ cache */
let C = null; // { game, top, bot, left, right, fences, corners, signs, ... }

function makeBand(x0, y0, w, h, scale, draw) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const g = c.getContext("2d");
  g.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
  draw(g);
  return { c, x0, y0, w, h, scale };
}
function blit(ctx, b, box) {
  const x0 = Math.max(b.x0, box.x0), y0 = Math.max(b.y0, box.y0), x1 = Math.min(b.x0 + b.w, box.x1), y1 = Math.min(b.y0 + b.h, box.y1);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(b.c, (x0 - b.x0) * b.scale, (y0 - b.y0) * b.scale, (x1 - x0) * b.scale, (y1 - y0) * b.scale, x0, y0, x1 - x0, y1 - y0);
}
function sprite(w, h, scale, draw) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
  const g = c.getContext("2d"); g.scale(scale, scale); draw(g, w, h);
  return c;
}
const dim = (col, k) => { // darken a hex colour toward night
  const n = parseInt(col.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k + 6 * (1 - k))})`;
};

/* ------------------------------------------------------------------ painted pieces */
function bunting(g, x0, x1, y, sag, step, k = 0.8, seed = 0) {
  g.strokeStyle = "rgba(20,10,14,.9)"; g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
  const n = Math.max(1, Math.floor((x1 - x0) / step));
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + (x1 - x0) * u, yy = y + sag * 4 * u * (1 - u);
    g.fillStyle = dim(pick(VIVID, i + seed), k);
    g.beginPath(); g.moveTo(x - step * 0.36, yy); g.lineTo(x + step * 0.36, yy); g.lineTo(x, yy + step * 0.8); g.fill();
  }
}
function stripedTent(g, cx, base, w, h, c1, c2, k) {
  const l = cx - w / 2, r = cx + w / 2, eave = base - h * 0.42;
  g.save();
  g.beginPath(); g.moveTo(l, base); g.lineTo(l, eave); g.quadraticCurveTo(cx - w * 0.18, base - h * 0.62, cx, base - h);
  g.quadraticCurveTo(cx + w * 0.18, base - h * 0.62, r, eave); g.lineTo(r, base); g.closePath(); g.clip();
  g.fillStyle = dim(c2, k); g.fillRect(l, base - h, w, h);
  g.fillStyle = dim(c1, k);
  const n = 7;
  for (let i = 0; i < n; i += 2) { g.beginPath(); g.moveTo(cx, base - h); g.lineTo(l + (w / n) * i, base); g.lineTo(l + (w / n) * (i + 1), base); g.fill(); }
  const sh = g.createLinearGradient(l, 0, r, 0); sh.addColorStop(0, "rgba(0,0,0,.45)"); sh.addColorStop(0.5, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.5)");
  g.fillStyle = sh; g.fillRect(l, base - h, w, h);
  g.restore();
  // scalloped valance at the eave and a pennant on the pole
  for (let x = l; x < r - 1; x += 7) { g.fillStyle = dim(((x - l) / 7) % 2 < 1 ? c1 : "#ffe9b0", k * 0.9); g.beginPath(); g.arc(x + 3.5, eave, 3.5, 0, Math.PI); g.fill(); }
  g.strokeStyle = "#1a1014"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, base - h); g.lineTo(cx, base - h - 9); g.stroke();
  g.fillStyle = dim(c1, k + 0.1); g.beginPath(); g.moveTo(cx, base - h - 9); g.lineTo(cx + 8, base - h - 6.5); g.lineTo(cx, base - h - 4); g.fill();
}
function stall(g, x, base, w, c1, k, seed) {
  g.fillStyle = "#140a0e"; g.fillRect(x, base - 20, w, 20);
  g.fillStyle = dim("#ffd8a0", k * 0.5); g.fillRect(x + 2, base - 13, w - 4, 9); // the lit counter
  for (let i = 0; i < Math.floor((w - 4) / 6); i++) { // plush rabbits on the shelf, one headless
    const px = x + 5 + i * 6, pc = dim(pick(PASTEL, i + seed), k);
    ellipse(g, px, base - 7, 2.2, 2.6, pc);
    if (hash(seed, i, 3) > 0.15) { circle(g, px, base - 10.5, 1.8, pc); ellipse(g, px - 1, base - 13.5, 0.6, 2, pc); ellipse(g, px + 1, base - 13.5, 0.6, 2, pc); g.fillStyle = "#000"; g.fillRect(px - 1, base - 11, 0.6, 0.6); g.fillRect(px + 0.5, base - 11, 0.6, 0.6); }
  }
  for (let i = 0; i < w / 5; i++) { g.fillStyle = dim(i % 2 ? "#fff0d0" : c1, k); g.fillRect(x + i * 5, base - 27, 5, 7); }
  for (let i = 0; i < w / 5; i++) { g.fillStyle = dim(i % 2 ? "#fff0d0" : c1, k); g.beginPath(); g.arc(x + i * 5 + 2.5, base - 20, 2.5, 0, Math.PI); g.fill(); }
}
/* a clown-rabbit face with far too many teeth (billboards, signs) */
function grinFace(g, cx, cy, r, k, skin = "#fff0e0") {
  ellipse(g, cx - r * 0.42, cy - r * 1.25, r * 0.22, r * 0.75, dim(skin, k), -0.2);
  ellipse(g, cx + r * 0.42, cy - r * 1.25, r * 0.22, r * 0.75, dim(skin, k), 0.25);
  ellipse(g, cx - r * 0.42, cy - r * 1.2, r * 0.1, r * 0.5, dim("#ff7ab8", k), -0.2);
  ellipse(g, cx + r * 0.42, cy - r * 1.2, r * 0.1, r * 0.5, dim("#ff7ab8", k), 0.25);
  circle(g, cx, cy, r, dim(skin, k));
  circle(g, cx - r * 0.55, cy + r * 0.2, r * 0.22, dim("#ff5a9a", k * 0.9));
  circle(g, cx + r * 0.55, cy + r * 0.2, r * 0.22, dim("#ff5a9a", k * 0.9));
  // eyes: too big, pupils pinned to the corners
  circle(g, cx - r * 0.35, cy - r * 0.25, r * 0.26, dim("#ffffff", k)); circle(g, cx + r * 0.35, cy - r * 0.25, r * 0.26, dim("#ffffff", k));
  circle(g, cx - r * 0.27, cy - r * 0.2, r * 0.1, "#050203"); circle(g, cx + r * 0.43, cy - r * 0.2, r * 0.1, "#050203");
  // the mouth: ear to ear, two rows of teeth
  g.fillStyle = "#3a0410"; g.beginPath(); g.moveTo(cx - r * 0.85, cy + r * 0.05); g.quadraticCurveTo(cx, cy + r * 1.15, cx + r * 0.85, cy + r * 0.05); g.quadraticCurveTo(cx, cy + r * 0.45, cx - r * 0.85, cy + r * 0.05); g.fill();
  g.fillStyle = dim("#fffbe8", k);
  const n = 11;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, x = cx - r * 0.8 + u * r * 1.6, yt = cy + r * 0.05 + Math.sin(u * Math.PI) * r * 0.4, yb = cy + r * 0.05 + Math.sin(u * Math.PI) * r * 0.95;
    g.beginPath(); g.moveTo(x - r * 0.07, yt - 0.3); g.lineTo(x + r * 0.07, yt - 0.3); g.lineTo(x, yt + r * 0.16); g.fill();
    g.beginPath(); g.moveTo(x - r * 0.07, yb + 0.3); g.lineTo(x + r * 0.07, yb + 0.3); g.lineTo(x, yb - r * 0.16); g.fill();
  }
}
function drips(g, x0, x1, y, col, seed, n = 6, len = 7) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed, i, 1) * (x1 - x0), l = 2 + hash(seed, i, 2) * len, w = 0.7 + hash(seed, i, 3) * 0.8;
    g.fillRect(x - w / 2, y, w, l); circle(g, x, y + l, w * 0.9, col);
  }
}
function billboard(g, cx, base, text, seed, k) {
  const w = 78, h = 30, top = base - 14 - h, fx = cx - 25; // face on the left, slogan on the right
  g.fillStyle = "#1a1014"; g.fillRect(cx - w / 2 + 6, top + h, 2.4, base - top - h); g.fillRect(cx + w / 2 - 8, top + h, 2.4, base - top - h);
  g.fillStyle = dim(["#ffd23a", "#4ad8ff", "#9dff6a"][seed % 3], k * 0.85); g.fillRect(cx - w / 2, top, w, h);
  for (let i = 0; i < 9; i++) { // sunburst
    const a0 = (i / 9) * TAU, a1 = a0 + TAU / 18;
    g.fillStyle = dim("#ffffff", k * 0.25); g.beginPath(); g.moveTo(fx, top + h / 2);
    g.lineTo(fx + Math.cos(a0) * 70, top + h / 2 + Math.sin(a0) * 70); g.lineTo(fx + Math.cos(a1) * 70, top + h / 2 + Math.sin(a1) * 70); g.fill();
  }
  g.save(); g.beginPath(); g.rect(cx - w / 2, top - 20, w, h + 20); g.clip();
  grinFace(g, fx, top + h / 2 + 2, 9.5, k);
  g.restore();
  g.strokeStyle = dim("#ff3d8b", k); g.lineWidth = 1.6; g.strokeRect(cx - w / 2, top, w, h);
  g.fillStyle = dim("#ff1f5a", k); g.font = `11px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text[0], cx + 13, top + 10, 46); g.fillStyle = dim("#2a0a40", k); g.font = `8px ${FONT}`; g.fillText(text[1], cx + 13, top + 22, 46);
  drips(g, cx - 8, cx + 34, top + 15.5, dim("#c0122c", k), seed * 7 + 1, 3, 2.5); // the headline's paint runs, between the lines
  drips(g, cx - w / 2, cx + w / 2, top + h, dim("#8b1414", k), seed * 7 + 2, 5);
}

/* ------------------------------------------------------------------ the void bands */
function paintTop(g, mw) {
  const x0 = -D, x1 = mw + D;
  const sky = g.createLinearGradient(0, -D, 0, 0);
  sky.addColorStop(0, "#030206"); sky.addColorStop(0.4, "#0d0818"); sky.addColorStop(0.75, "#24102a"); sky.addColorStop(1, "#4a1a3c");
  g.fillStyle = sky; g.fillRect(x0, -D, x1 - x0, D);
  // carnival haze: coloured light thrown up from the grounds
  for (let i = 0; i < 14; i++) {
    const hx = x0 + (i + hash(i, 1, 9)) * (x1 - x0) / 14, col = ["#ff3d8b", "#7dff4a", "#b46cff", "#ff8a2a"][i % 4];
    const gr = g.createRadialGradient(hx, 0, 0, hx, 0, 140); gr.addColorStop(0, rgba(col, 0.22)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(hx - 140, -140, 280, 140);
  }
  for (let i = 0; i < 90; i++) circle(g, x0 + hash(i, 2, 1) * (x1 - x0), -D + hash(i, 3, 1) * 120, 0.4 + hash(i, 4, 1) * 0.6, `rgba(255,240,220,${0.2 + hash(i, 5, 1) * 0.4})`);
  // a sick green moon with a bite out of it
  circle(g, 1560, -150, 16, "#b8d890"); circle(g, 1570, -156, 14, "#120a1c");
  // far rank of tents, dim
  for (let x = x0; x < x1; x += 46 + hash(x, 1, 2) * 30) {
    stripedTent(g, x, 0, 40 + hash(x, 2, 2) * 30, 26 + hash(x, 3, 2) * 24, VIVID[(hash(x, 4, 2) * 6) | 0], "#2a1a24", 0.34);
  }
  // the roller coaster, stalled, a car tipped at the crest
  const coast = [[1640, -6], [1720, -52], [1790, -98], [1860, -40], [1930, -22], [2010, -74], [2080, -40], [2160, -8]];
  const pts = [];
  for (let i = 0; i < coast.length - 1; i++) for (let s = 0; s < 12; s++) {
    const u = s / 12, a = coast[i], b = coast[i + 1], e = (1 - Math.cos(u * Math.PI)) / 2; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * e]);
  }
  g.strokeStyle = "#3a1828"; g.lineWidth = 0.8;
  for (let i = 0; i < pts.length; i += 3) { const [px, py] = pts[i]; g.beginPath(); g.moveTo(px, py); g.lineTo(px, 0); g.stroke(); if (i + 3 < pts.length) { g.beginPath(); g.moveTo(px, py + 4); g.lineTo(pts[i + 3][0], 0); g.stroke(); } }
  g.strokeStyle = "#a82a48"; g.lineWidth = 2.2; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
  g.strokeStyle = "#ffb0c8"; g.lineWidth = 0.5; g.stroke();
  g.save(); g.translate(1792, -101); g.rotate(0.6); g.fillStyle = "#c9a54a"; g.fillRect(-7, -6, 14, 6); g.fillStyle = "#ff3d8b"; g.fillRect(-7, -3, 14, 2); g.restore();
  // the giant inflatable rabbit: no face, only the grin someone painted on afterwards
  const rx = 1250, ry = -84;
  g.fillStyle = "#6a3e52";
  g.save(); g.translate(rx - 20, ry - 40); g.rotate(-0.25); ellipse(g, 0, -40, 13, 46, "#6a3e52"); ellipse(g, 0, -40, 6, 36, "#8a4a64"); g.restore();
  g.save(); g.translate(rx + 22, ry - 38); g.rotate(1.1); ellipse(g, 0, -34, 12, 40, "#5e3648"); g.restore(); // one ear has gone soft and folded over
  ellipse(g, rx, ry, 52, 46, "#7a4a5e"); ellipse(g, rx - 14, ry - 16, 22, 14, "rgba(255,220,240,.12)");
  g.strokeStyle = "rgba(30,10,20,.6)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(rx, ry - 46); g.lineTo(rx, ry + 46); g.stroke(); // the seam
  g.fillStyle = "#2a0410"; g.beginPath(); g.moveTo(rx - 40, ry + 6); g.quadraticCurveTo(rx, ry + 52, rx + 40, ry + 6); g.quadraticCurveTo(rx, ry + 22, rx - 40, ry + 6); g.fill();
  g.fillStyle = "#e8d8c0";
  for (let i = 0; i < 17; i++) { const u = (i + 0.5) / 17, x = rx - 38 + u * 76, yt = ry + 6 + Math.sin(u * Math.PI) * 15, yb = ry + 6 + Math.sin(u * Math.PI) * 34; g.beginPath(); g.moveTo(x - 2, yt); g.lineTo(x + 2, yt); g.lineTo(x, yt + 5); g.fill(); g.beginPath(); g.moveTo(x - 2, yb); g.lineTo(x + 2, yb); g.lineTo(x, yb - 5); g.fill(); }
  drips(g, rx - 30, rx + 30, ry + 30, "#7a0a1a", 77, 8);
  // tethers
  g.strokeStyle = "rgba(220,200,180,.35)"; g.lineWidth = 0.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(rx + s * 40, ry + 20); g.lineTo(rx + s * 90, 0); g.stroke(); }
  // the big top in front of it
  stripedTent(g, 1250, 0, 150, 58, "#ff2a4d", "#ffe9b0", 0.62);
  g.fillStyle = "#0a0406"; g.beginPath(); g.moveTo(1238, 0); g.quadraticCurveTo(1250, -26, 1262, 0); g.fill(); // its flap, open
  // Ferris-wheel legs (the wheels themselves turn in glow)
  for (const w of WHEELS) { g.strokeStyle = "#2a1620"; g.lineWidth = 2.2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(w.x + s * 42, 0); g.stroke(); } g.lineWidth = 1; g.beginPath(); g.moveTo(w.x - 26, w.y + 34); g.lineTo(w.x + 26, w.y + 34); g.stroke(); }
  // nearer: more tents, bright
  const near = [[90, 70, 44, "#ff3d8b"], [340, 60, 38, "#4ad8ff"], [880, 84, 46, "#7dff4a"], [1460, 64, 40, "#b46cff"], [2310, 80, 50, "#ff8a2a"], [2560, 64, 36, "#ff3d8b"]];
  for (const [x, w, h, c] of near) stripedTent(g, x, 0, w, h, c, "#fff0d0", 0.6);
  // prize stalls along the foot of the wall
  for (let x = x0 + 10; x < x1 - 40; x += 120 + hash(x, 5, 3) * 80) stall(g, x, 0, 30 + ((hash(x, 6, 3) * 3) | 0) * 6, VIVID[(hash(x, 7, 3) * 6) | 0], 0.7, (x / 10) | 0);
  // painted billboards with slogans gone wrong
  const slog = [["PET ME!", "so soft  so soft"], ["HUG A BUNNY", "they hug back"], ["FEED TIME", "is it yours?"], ["SO MANY!", "they multiply"], ["SMILE!", "they're watching"]];
  [[620, 0], [1050, 1], [1520, 2], [2200, 3], [60, 4]].forEach(([x, i]) => billboard(g, x, 0, slog[i], i, 0.72));
  // bunting strung across the whole skyline
  for (let x = x0; x < x1; x += 150) bunting(g, x, x + 150, -46 - hash(x, 9, 9) * 10, 8, 8, 0.75, (x / 150) | 0);
  for (let x = x0 + 70; x < x1; x += 190) bunting(g, x, x + 190, -16, 6, 7, 0.65, ((x / 190) | 0) + 3);
  // the foot of the wall in shadow, and the far sky fading to nothing
  let gr = g.createLinearGradient(0, -14, 0, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.55)"); g.fillStyle = gr; g.fillRect(x0, -14, x1 - x0, 14);
  gr = g.createLinearGradient(0, -D, 0, -D + 60); gr.addColorStop(0, "rgba(3,2,6,1)"); gr.addColorStop(1, "rgba(3,2,6,0)"); g.fillStyle = gr; g.fillRect(x0, -D, x1 - x0, 60);
}

/* "your face here" rabbit cutouts below the south wall; the face holes are filled in glow */
function cutout(g, cx, top, seed) {
  const body = PASTEL[seed % PASTEL.length], vest = VIVID[(seed + 2) % VIVID.length], k = 0.62;
  const hy = top + 30;
  // silhouette board: ears, head, body
  g.fillStyle = "#1a0e12";
  ellipse(g, cx - 9, top + 10, 6.5, 15, "#140a0e", -0.15); ellipse(g, cx + 9, top + 10, 6.5, 15, "#140a0e", seed % 2 ? 0.7 : 0.15);
  ellipse(g, cx - 9, top + 9, 5.5, 14, dim(body, k), -0.15); ellipse(g, cx + 9, top + 9, 5.5, 14, dim(body, k), seed % 2 ? 0.7 : 0.15);
  ellipse(g, cx - 9, top + 10, 2.4, 10, dim("#ff7ab8", k), -0.15); ellipse(g, cx + 9, top + 10, 2.4, 10, dim("#ff7ab8", k), seed % 2 ? 0.7 : 0.15);
  ellipse(g, cx, top + 80, 26, 36, dim(body, k)); // body
  g.fillStyle = dim(vest, k); g.beginPath(); g.moveTo(cx - 22, top + 58); g.lineTo(cx + 22, top + 58); g.lineTo(cx + 18, top + 112); g.lineTo(cx - 18, top + 112); g.fill();
  for (let i = 0; i < 4; i++) { g.fillStyle = dim("#fff6d8", k); g.fillRect(cx - 20 + i * 11, top + 58, 4, 54); }
  circle(g, cx, hy, 21, dim(body, k));
  // bow tie
  g.fillStyle = dim("#ff1f5a", k); g.beginPath(); g.moveTo(cx, top + 53); g.lineTo(cx - 9, top + 48); g.lineTo(cx - 9, top + 58); g.fill(); g.beginPath(); g.moveTo(cx, top + 53); g.lineTo(cx + 9, top + 48); g.lineTo(cx + 9, top + 58); g.fill(); circle(g, cx, top + 53, 2, dim("#ffd23a", k));
  // cheeks and a painted grin under the hole, too wide, too many teeth
  circle(g, cx - 14, hy + 6, 4, dim("#ff5a9a", k)); circle(g, cx + 14, hy + 6, 4, dim("#ff5a9a", k));
  g.fillStyle = "#3a0410"; g.beginPath(); g.moveTo(cx - 17, hy + 9); g.quadraticCurveTo(cx, hy + 26, cx + 17, hy + 9); g.quadraticCurveTo(cx, hy + 15, cx - 17, hy + 9); g.fill();
  g.fillStyle = dim("#fffbe8", k);
  for (let i = 0; i < 12; i++) { const u = (i + 0.5) / 12, x = cx - 16 + u * 32, yt = hy + 9 + Math.sin(u * Math.PI) * 6, yb = hy + 9 + Math.sin(u * Math.PI) * 15; g.beginPath(); g.moveTo(x - 1.2, yt); g.lineTo(x + 1.2, yt); g.lineTo(x, yt + 3); g.fill(); g.beginPath(); g.moveTo(x - 1.2, yb); g.lineTo(x + 1.2, yb); g.lineTo(x, yb - 3); g.fill(); }
  // the hole itself, painted dark here; something looks out of it in glow
  circle(g, cx, hy - 4, 10.5, "#3a2a18"); circle(g, cx, hy - 4, 9.5, "#030102");
  g.fillStyle = dim("#1a0e12", k); g.font = `7px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(["YOUR FACE HERE", "SMILE!", "SAY CARROTS!", "STAY A WHILE"][seed % 4], cx, top + 74, 40);
  drips(g, cx - 18, cx + 18, top + 78, dim("#a3122e", k), seed * 13, 3);
  // the stake it stands on
  g.fillStyle = "#120a0c"; g.fillRect(cx - 1.5, top + 112, 3, 30);
}
function paintBottom(g, mw, mh, cutX) {
  const x0 = -D, x1 = mw + D;
  const gr = g.createLinearGradient(0, mh, 0, mh + D); gr.addColorStop(0, "#1a0f18"); gr.addColorStop(0.5, "#0e0a0e"); gr.addColorStop(1, "#030206");
  g.fillStyle = gr; g.fillRect(x0, mh, x1 - x0, D);
  for (let i = 0; i < 260; i++) { // confetti and popcorn trodden into the mud
    const x = x0 + hash(i, 1, 4) * (x1 - x0), y = mh + 4 + hash(i, 2, 4) * (D - 8);
    g.fillStyle = i % 4 === 0 ? "rgba(240,230,190,.35)" : rgba(VIVID[i % VIVID.length], 0.28); g.fillRect(x, y, 1.6, 1.2);
  }
  // a candy-striped kick board along the wall, chipped
  for (let x = x0; x < x1; x += 8) { g.fillStyle = dim(((x - x0) / 8) % 2 ? "#ff3d8b" : "#fff0d0", 0.5); g.fillRect(x, mh, 8, 5); }
  g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(x0, mh + 5, x1 - x0, 3);
  // balloon bundles on stakes between the cutouts
  for (let i = 0; i < cutX.length - 1; i++) {
    const bx = (cutX[i] + cutX[i + 1]) / 2;
    if (bx > mw - 260) continue; // leave room by the exit for the farewell sign
    for (let j = 0; j < 4; j++) {
      const ox = (hash(i, j, 5) - 0.5) * 22, oy = 18 + hash(i, j, 6) * 22, col = VIVID[(i + j) % VIVID.length];
      g.strokeStyle = "rgba(200,190,180,.35)"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(bx, mh + 96); g.lineTo(bx + ox, mh + oy + 8); g.stroke();
      ellipse(g, bx + ox, mh + oy, 7, 8.5, dim(col, 0.62)); ellipse(g, bx + ox - 2.5, mh + oy - 3, 1.8, 2.6, "rgba(255,255,255,.3)");
    }
    g.fillStyle = "#120a0c"; g.fillRect(bx - 1, mh + 92, 2, 40);
  }
  for (let i = 0; i < cutX.length; i++) cutout(g, cutX[i], mh + 10, i);
  const f = g.createLinearGradient(0, mh + D - 70, 0, mh + D); f.addColorStop(0, "rgba(3,2,6,0)"); f.addColorStop(1, "rgba(3,2,6,1)"); g.fillStyle = f; g.fillRect(x0, mh + D - 70, x1 - x0, 70);
}
/* the side strips: stacked hutches with wire fronts, candy poles, streamers */
function paintSide(g, x0, mh, flip) {
  const gr = g.createLinearGradient(flip ? x0 : x0 + D, 0, flip ? x0 + D : x0, 0); gr.addColorStop(0, "#1a0f18"); gr.addColorStop(1, "#030206");
  g.fillStyle = gr; g.fillRect(x0, 0, D, mh);
  const ex = flip ? x0 : x0 + D; // the edge against the map
  const dir = flip ? 1 : -1;
  for (let y = 6; y < mh - 30; y += 36) {
    const hx = ex + dir * 6 + (flip ? 0 : -30), seed = (y / 36) | 0;
    g.fillStyle = dim(VIVID[seed % VIVID.length], 0.45); g.fillRect(hx, y, 30, 30);
    g.fillStyle = "#050203"; g.fillRect(hx + 3, y + 3, 24, 22);
    g.strokeStyle = "rgba(190,190,200,.35)"; g.lineWidth = 0.5;
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(hx + 3 + i * 4, y + 3); g.lineTo(hx + 3 + i * 4, y + 25); g.stroke(); }
    g.fillStyle = dim("#fff0d0", 0.5); g.font = `5px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(["BUN-BUN", "MR. NIBS", "#47", "DAISY", "SOLD", "HUNGRY"][seed % 6], hx + 15, y + 28);
  }
  // candy pole with streamers, further out
  const px = ex + dir * 52;
  for (let y = 0; y < mh; y += 6) { g.fillStyle = dim((y / 6) % 2 ? "#ff3d8b" : "#fff0d0", 0.5); g.fillRect(px - 2.5, y, 5, 6); }
  for (let y = 40; y < mh; y += 120) for (let i = 0; i < 5; i++) {
    g.strokeStyle = dim(VIVID[(i + y) % VIVID.length], 0.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(px, y);
    g.quadraticCurveTo(px + dir * 18, y + 10 + i * 4, px + dir * 10, y + 30 + i * 6); g.stroke();
  }
  const f = g.createLinearGradient(flip ? x0 + D - 70 : x0 + 70, 0, flip ? x0 + D : x0, 0); f.addColorStop(0, "rgba(3,2,6,0)"); f.addColorStop(1, "rgba(3,2,6,1)"); g.fillStyle = f; g.fillRect(x0, 0, D, mh);
}

/* ------------------------------------------------------------------ neon + wheels (cached sprites) */
const WHEELS = [{ x: 470, y: -84, r: 66, dir: 1 }, { x: 2020, y: -88, r: 72, dir: -1 }];
const NEON = [
  // [x, y, text, colour, sub, subColour, deadWord]
  { x: 250, y: -28, text: "PETTING PEN", col: "#ff3d8b", sub: "♥ LET THEM PET YOU ♥", sc: "#7dff4a", size: 16, dead: "LET THEM ", alt: "♥ PET YOU ♥" },
  { x: 900, y: -28, text: "FEED THEM", col: "#7dff4a", sub: "they are always hungry", sc: "#ffd23a", size: 15, dead: "always ", alt: "they are hungry" },
  { x: 1660, y: -132, text: "HOLD THEM TIGHT", col: "#4ad8ff", sub: "♥ never let go ♥", sc: "#ff3d8b", size: 15, dead: "never ", alt: "♥ let go ♥" },
  { x: 2380, y: -28, text: "BUNNY HUGS 5¢", col: "#ffd23a", sub: "all you can bear", sc: "#ff3d8b", size: 15, dead: "", alt: "" },
];
function neonSprite(text, col, size, sub, sc) {
  const S = 2.4, padX = 14, w = Math.max(text.length * size * 0.62, sub.length * size * 0.36) + padX * 2, h = size * 2.0 + 12;
  return { w, h, c: sprite(w, h, S, (g) => {
    g.textAlign = "center"; g.textBaseline = "middle";
    // the backing board: dark, with a marquee of bulbs
    g.fillStyle = "rgba(14,6,14,.82)"; g.fillRect(2, 1, w - 4, h - 2);
    for (let x = 6; x < w - 4; x += 7) { circle(g, x, 3.5, 1.2, "#ffe9a0"); circle(g, x, h - 3.5, 1.2, "#ffe9a0"); }
    const draw = (t, font, y, c) => {
      g.font = font; g.shadowColor = c; g.shadowBlur = 10; g.fillStyle = c; g.fillText(t, w / 2, y);
      g.shadowBlur = 4; g.fillText(t, w / 2, y); g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,.75)"; g.font = font; g.fillText(t, w / 2, y);
    };
    draw(text, `${size}px ${FONT}`, 6 + size * 0.75, col);
    if (sub) draw(sub, `italic ${Math.round(size * 0.52)}px Georgia, serif`, 6 + size * 1.62, sc);
  }) };
}
function wheelSprite(r) {
  const S = 2.2, w = r * 2 + 12;
  return sprite(w, w, S, (g) => {
    const c = w / 2;
    g.strokeStyle = "#6a2a46"; g.lineWidth = 2.4; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke();
    g.strokeStyle = "#c83a6a"; g.lineWidth = 1; g.beginPath(); g.arc(c, c, r - 4, 0, TAU); g.stroke();
    g.strokeStyle = "#4a1c34"; g.lineWidth = 0.8;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); g.stroke(); }
    g.strokeStyle = "#ffd23a"; g.lineWidth = 0.6; g.beginPath(); g.arc(c, c, r * 0.4, 0, TAU); g.stroke();
    circle(g, c, c, 6, "#2a0a18"); grinFace(g, c, c, 5.2, 0.9); // the hub has a face
  });
}

function build(game) {
  const mw = game.w * T, mh = game.h * T;
  const scale = Math.min(1.7, 8000 / (mw + 2 * D));
  const cutX = [];
  for (let x = 60; x < mw - 240; x += 128) cutX.push(x);
  const c = {
    game, mw, mh,
    top: makeBand(-D, -D, mw + 2 * D, D, scale, (g) => paintTop(g, mw)),
    bot: makeBand(-D, mh, mw + 2 * D, D, scale, (g) => paintBottom(g, mw, mh, cutX)),
    left: makeBand(-D, 0, D, mh, scale, (g) => paintSide(g, -D, mh, false)),
    right: makeBand(mw, 0, D, mh, scale, (g) => paintSide(g, mw, mh, true)),
    holes: cutX.map((x, i) => ({ x, y: mh + 10 + 26, i })),
    hutches: [],
    wheels: WHEELS.map((w) => ({ ...w, spr: wheelSprite(w.r) })),
    neon: NEON.map((n) => ({ ...n, on: neonSprite(n.text, n.col, n.size, n.sub, n.sc), off: n.alt ? neonSprite(n.text, n.col, n.size, n.alt, n.sc) : null })),
    farewell: neonSprite("COME BACK SOON", "#ff3d8b", 15, "☺ you will ☺", "#7dff4a"),
    balloons: [],
  };
  for (let y = 6, i = 0; y < mh - 30; y += 36, i++) if (hash(i, 7, 7) < 0.45) c.hutches.push({ x: -21, y: y + 13, i });
  for (let y = 6, i = 0; y < mh - 30; y += 36, i++) if (hash(i, 8, 7) < 0.45) c.hutches.push({ x: mw + 21, y: y + 13, i: i + 50 });
  const nb = Math.round((mw + 2 * D) / 60);
  for (let i = 0; i < nb; i++) c.balloons.push({ x: -D + hash(i, 1, 11) * (mw + 2 * D), ph: hash(i, 2, 11), sp: 5 + hash(i, 3, 11) * 6, col: VIVID[i % VIVID.length], bunny: hash(i, 4, 11) < 0.3, s: 0.8 + hash(i, 5, 11) * 0.5 });
  return c;
}
const cacheFor = (game) => (C && C.game === game ? C : (C = build(game)));

/* ------------------------------------------------------------------ in-map decor helpers */
function fenceRuns(game) {
  // horizontal fence tiles (a fence with fence to its left or right) with open floor below: their faces show
  const out = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    if (tileAt(game, tx, ty) !== "fence") continue;
    const horiz = tileAt(game, tx - 1, ty) === "fence" || tileAt(game, tx + 1, ty) === "fence";
    const vert = tileAt(game, tx, ty - 1) === "fence" || tileAt(game, tx, ty + 1) === "fence";
    out.push({ tx, ty, horiz, vert, corner: horiz && vert });
  }
  return out;
}
let F = null;
const fencesFor = (game) => (F && F.game === game ? F : (F = { game, list: fenceRuns(game) }));

const SIGNS = ["PET ME", "HUG ME", "HOLD ME", "FEED ME", "GOOD BUNNY", "DON'T RUN", "NO TAPPING", "THEY KNOW", "SO SOFT", "STAY"];

export default {
  // paint(ctx, game, api): static decor baked once into the level canvas (world px, after tiles/overhangs).
  paint(ctx, game, api) {
    const fences = fencesFor(game).list, mw = game.w * T, mh = game.h * T;
    // candy paint on the pickets, chipped and weathered (same picket layout as tiles.js)
    for (const f of fences) {
      const x = f.tx * T, y = f.ty * T;
      for (let i = 0; i < 3; i++) {
        const px = x + 3 + i * (T / 3), broken = hash(f.tx, f.ty, i) < 0.12, top = broken ? y + 8 : y - 2;
        const col = PASTEL[(f.tx + i + f.ty) % PASTEL.length];
        ctx.fillStyle = rgba(col, 0.5); ctx.fillRect(px, top, 6, y + T - 3 - top);
        ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + 3, top - (broken ? -2 : 4)); ctx.lineTo(px + 6, top); ctx.fill();
        ctx.fillStyle = "rgba(40,24,16,.7)"; // chips
        for (let k = 0; k < 3; k++) if (hash(f.tx, f.ty, i * 10 + k + 40) < 0.5) ctx.fillRect(px + hash(f.tx, f.ty, i * 10 + k + 50) * 5, top + 3 + hash(f.tx, f.ty, i * 10 + k + 60) * (T - 8), 1.5, 2.2);
      }
    }
    // fairy bulbs strung along the horizontal fences (a sagging wire; some dead, some stuttering)
    for (const f of fences) {
      if (!f.horiz) continue;
      const x = f.tx * T, y = f.ty * T + 3;
      ctx.strokeStyle = "#141010"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + T / 2, y + 5, x + T, y); ctx.stroke();
      const sd = hash(f.tx, f.ty, 91);
      api.bulbs.push({ x: x + T / 2, y: y + 2.4, color: PASTEL[(f.tx * 7 + f.ty) % PASTEL.length], seed: sd, state: sd < 0.3 ? "dead" : sd < 0.45 ? "flicker" : "on" });
    }
    // hand-painted signs nailed to the fence fronts, one per run, plus prize rosettes on posts
    let runStart = -1;
    for (let i = 0; i <= fences.length; i++) {
      const f = fences[i], prev = fences[i - 1];
      const cont = f && prev && f.ty === prev.ty && f.tx === prev.tx + 1 && f.horiz && prev.horiz;
      if (!cont) {
        if (prev && runStart >= 0 && i - runStart >= 5) {
          const mid = fences[runStart + ((i - runStart) >> 1)];
          const sx = mid.tx * T + T / 2, sy = mid.ty * T + T * 0.5, seed = mid.tx * 31 + mid.ty;
          ctx.fillStyle = "#1a0e0a"; ctx.fillRect(sx - 18, sy - 7, 36, 15);
          ctx.fillStyle = PASTEL[seed % PASTEL.length]; ctx.fillRect(sx - 17, sy - 6, 34, 13);
          ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(sx - 17, sy - 6, 34, 2);
          grinFace(ctx, sx - 11, sy + 1, 4, 1);
          ctx.fillStyle = "#8b1414"; ctx.font = `6px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(SIGNS[seed % SIGNS.length], sx + 4, sy + 0.5, 22);
          drips(ctx, sx - 4, sx + 15, sy + 4, "rgba(139,20,20,.9)", seed, 3);
          circle(ctx, sx - 16, sy - 5, 0.8, "#888"); circle(ctx, sx + 16, sy - 5, 0.8, "#888"); // nails
          api.lights.push({ x: sx, y: sy + 14, r: 46, color: "#ff7ad9", flicker: 0.15, seed: hash(mid.tx, mid.ty, 3) });
        }
        runStart = f && f.horiz ? i : -1;
      }
    }
    for (const f of fences) if (f.vert && !f.horiz && hash(f.tx, f.ty, 71) < 0.3) { // a prize rosette, the ribbons gone brown
      const cx = f.tx * T + T / 2, cy = f.ty * T + T * 0.45, col = VIVID[(f.tx + f.ty) % VIVID.length];
      ctx.fillStyle = "#5a0e16"; ctx.fillRect(cx - 3, cy + 2, 2.4, 9); ctx.fillStyle = "#3a2410"; ctx.fillRect(cx + 0.6, cy + 2, 2.4, 8);
      for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; circle(ctx, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 2, col); }
      circle(ctx, cx, cy, 3.2, "#ffd23a"); ctx.fillStyle = "#3a0a10"; ctx.font = `4px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("1st", cx, cy + 0.3);
    }
    // painted banners across the roof of the border tents
    const banners = ["PETTING PEN", "PET  •  FEED  •  HOLD", "BUNNIES ♥ YOU", "NO ONE LEAVES HUNGRY", "OPEN ALL NIGHT"];
    let bi = 0;
    for (let tx = 4; tx < game.w - 8; tx += 14) {
      for (const ty of [0, game.h - 1]) {
        if (tileAt(game, tx, ty) !== "tent") continue;
        const x = tx * T, y = ty * T + (ty === 0 ? 2 : 6), w = T * 5, h = 14;
        ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x + 1.5, y + 1.5, w, h);
        for (let i = 0; i < w; i += 6) { ctx.fillStyle = (i / 6) % 2 ? "#ffd23a" : "#ff3d8b"; ctx.fillRect(x + i, y, Math.min(6, w - i), 2.4); ctx.fillRect(x + i, y + h - 2.4, Math.min(6, w - i), 2.4); }
        ctx.fillStyle = "#f6ecd2"; ctx.fillRect(x, y + 2.4, w, h - 4.8);
        ctx.fillStyle = ["#c0122c", "#24803a", "#5f2682", "#1b666e"][bi % 4]; ctx.font = `8px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(banners[bi % banners.length], x + w / 2, y + h / 2 + 0.5);
        drips(ctx, x + 10, x + w - 10, y + h, "rgba(160,14,30,.85)", tx * 3 + ty, 5);
        bi++;
      }
    }
    // confetti and torn ticket stubs in the grass (tiny, low contrast: never mistaken for a pickup)
    for (let ty = 1; ty < game.h - 1; ty++) for (let tx = 1; tx < game.w - 1; tx++) {
      if (tileAt(game, tx, ty) !== "grass") continue;
      for (let k = 0; k < 4; k++) if (hash(tx, ty, 500 + k) < 0.35) {
        ctx.fillStyle = rgba(VIVID[(tx + ty + k) % VIVID.length], 0.45);
        ctx.fillRect(tx * T + hash(tx, ty, 510 + k) * T, ty * T + hash(tx, ty, 520 + k) * T, 1.4, 1);
      }
    }
    // coloured light: carnival colour spilling over the border walls (dim, slow flicker)
    const cols = ["#ff3d8b", "#7dff4a", "#4ad8ff", "#b46cff", "#ffd23a"];
    let li = 0;
    for (let x = 6 * T; x < mw - 2 * T; x += 9 * T) {
      api.lights.push({ x: x + T / 2, y: T + 4, r: 92, color: cols[li % 5], flicker: 0.12, seed: hash(li, 1, 33) });
      api.lights.push({ x: x + 4 * T, y: mh - T - 6, r: 84, color: cols[(li + 2) % 5], flicker: 0.12, seed: hash(li, 2, 33) });
      li++;
    }
  },

  // ambient: pennants on the fences (they flutter east) and balloons tied to fence corners (they lean west)
  ambient(ctx, game, t, view, box) {
    const red = reducedOf(view), tt = red ? 0 : t;
    const fences = fencesFor(game).list;
    for (const f of fences) {
      const x = f.tx * T, y = f.ty * T + 3;
      if (x > box.x1 || x + T < box.x0 || y > box.y1 + 20 || y < box.y0 - 30) continue;
      if (f.horiz) for (let i = 0; i < 3; i++) {
        const px = x + 5 + i * 10.6, py = y + 2 + Math.sin(((px - x) / T) * Math.PI) * 2.4;
        const fl = Math.sin(tt * 3.1 + px * 0.21) * 1.6 + 1.2;
        ctx.fillStyle = VIVID[(f.tx * 3 + i) % VIVID.length];
        ctx.beginPath(); ctx.moveTo(px - 3.4, py); ctx.lineTo(px + 3.4, py); ctx.lineTo(px + fl, py + 7.5); ctx.fill();
      }
      if (f.corner && hash(f.tx, f.ty, 81) < 0.55) for (let k = 0; k < 3; k++) {
        const ax = x + T / 2, ay = y + 2;
        const bx = ax - 4 - k * 3 + Math.sin(tt * 0.9 + k * 2 + f.tx) * 1.6, by = y - 16 - k * 4 + Math.sin(tt * 1.3 + k) * 1.2;
        ctx.strokeStyle = "rgba(220,210,200,.5)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by + 5); ctx.stroke();
        const col = VIVID[(f.tx + k * 2) % VIVID.length];
        ellipse(ctx, bx, by, 4.2, 5, col); ellipse(ctx, bx - 1.4, by - 1.8, 1, 1.5, "rgba(255,255,255,.55)");
        if (k === 1) { ellipse(ctx, bx - 2, by - 6, 1.1, 3, col, -0.2); ellipse(ctx, bx + 2, by - 6, 1.1, 3, col, 0.2); // a bunny balloon, X-eyed
          ctx.strokeStyle = "#1a0408"; ctx.lineWidth = 0.4; for (const s of [-1.4, 1.4]) { ctx.beginPath(); ctx.moveTo(bx + s - 0.6, by - 0.6); ctx.lineTo(bx + s + 0.6, by + 0.6); ctx.moveTo(bx + s + 0.6, by - 0.6); ctx.lineTo(bx + s - 0.6, by + 0.6); ctx.stroke(); } }
      }
    }
  },

  // glow: the carnival beyond the walls. Drawn after the darkness (it would be black otherwise),
  // clipped to the void so the map itself is untouched.
  glow(ctx, game, t, view, box) {
    const mw = game.w * T, mh = game.h * T;
    if (box.x0 >= 0 && box.y0 >= 0 && box.x1 <= mw && box.y1 <= mh) return; // no void in view
    const c = cacheFor(game), red = reducedOf(view), p = game.player, dread = game.dread || 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); ctx.rect(0, 0, mw, mh); ctx.clip("evenodd");
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    blit(ctx, c.top, box); blit(ctx, c.bot, box); blit(ctx, c.left, box); blit(ctx, c.right, box);
    const vis = (x, y, r) => x + r > box.x0 && x - r < box.x1 && y + r > box.y0 && y - r < box.y1;
    // searchlights sweeping the sky from behind the big top (slow; still under reduced motion)
    if (box.y0 < 0) {
      ctx.globalCompositeOperation = "lighter";
      for (const [sx, ph] of [[1180, 0], [1330, 2.1], [380, 4]]) {
        if (!vis(sx, -100, 220)) continue;
        const a = -Math.PI / 2 + (red ? 0.3 * Math.sin(ph) : 0.45 * Math.sin(t * 0.23 + ph));
        ctx.save(); ctx.translate(sx, -10); ctx.rotate(a);
        const gr = ctx.createLinearGradient(0, 0, 230, 0); gr.addColorStop(0, "rgba(255,240,200,.16)"); gr.addColorStop(1, "rgba(255,240,200,0)");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(230, -26); ctx.lineTo(230, 26); ctx.lineTo(0, 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = "source-over";
    }
    // Ferris wheels: they turn; the riders are rabbits, and they're all facing you
    for (const w of c.wheels) {
      if (!vis(w.x, w.y, w.r + 20)) continue;
      const rot = (red ? 0.004 : 0.05) * t * w.dir;
      const sz = w.r * 2 + 12;
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(rot); ctx.drawImage(w.spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      for (let i = 0; i < 16; i++) { // rim bulbs: a slow chase
        const a = rot + (i / 16) * TAU, bx = w.x + Math.cos(a) * w.r, by = w.y + Math.sin(a) * w.r;
        const on = red ? (i % 2 ? 0.9 : 0.5) : 0.45 + 0.55 * Math.max(0, Math.sin(i * 0.8 - t * 1.4));
        circle(ctx, bx, by, 1.6, rgba(VIVID[i % 6], 0.35 + 0.65 * on));
      }
      for (let i = 0; i < 8; i++) { // gondolas hang straight down
        const a = rot + (i / 8) * TAU, gx = w.x + Math.cos(a) * w.r, gy = w.y + Math.sin(a) * w.r;
        ctx.strokeStyle = "#2a1620"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + 5); ctx.stroke();
        const col = VIVID[(i * 2 + (w.dir > 0 ? 0 : 1)) % 6];
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(gx - 7, gy + 5); ctx.lineTo(gx + 7, gy + 5); ctx.lineTo(gx + 5, gy + 13); ctx.lineTo(gx - 5, gy + 13); ctx.fill();
        if (i % 3 !== 1) { // a rider: rabbit ears, two pinpricks of eyeshine that follow you
          ellipse(ctx, gx, gy + 3, 3.4, 3, "#1a1014"); ellipse(ctx, gx - 1.6, gy - 1.5, 0.9, 3, "#1a1014", -0.2); ellipse(ctx, gx + 1.6, gy - 1.5, 0.9, 3, "#1a1014", 0.2);
          const dx = clamp((p.x - gx) / 400, -0.6, 0.6);
          circle(ctx, gx - 1.2 + dx, gy + 3, 0.6, dread > 0.5 ? "#ff3030" : "#fff3b0"); circle(ctx, gx + 1.2 + dx, gy + 3, 0.6, dread > 0.5 ? "#ff3030" : "#fff3b0");
        }
      }
    }
    // balloons rising against the wind (the pennants blow east; these drift west)
    const spd = red ? 0.25 : 1;
    for (const b of c.balloons) {
      const cyc = 220, k = (b.ph + (t * b.sp * spd) / cyc) % 1;
      const by = 8 - k * cyc, bx = b.x - k * 70 + Math.sin(t * 0.7 * spd + b.ph * 9) * 4;
      if (!vis(bx, by, 16)) continue;
      const a = k < 0.12 ? k / 0.12 : k > 0.75 ? (1 - k) / 0.25 : 1;
      ctx.globalAlpha = a * 0.92;
      ctx.strokeStyle = "rgba(220,210,200,.45)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(bx, by + 6 * b.s); ctx.quadraticCurveTo(bx + 3, by + 14, bx + 1, by + 20 * b.s); ctx.stroke();
      if (b.bunny) { ellipse(ctx, bx - 2.4 * b.s, by - 7 * b.s, 1.4 * b.s, 4 * b.s, b.col, -0.2); ellipse(ctx, bx + 2.4 * b.s, by - 7 * b.s, 1.4 * b.s, 4 * b.s, b.col, 0.2); }
      ellipse(ctx, bx, by, 5 * b.s, 6 * b.s, b.col); ellipse(ctx, bx - 1.6 * b.s, by - 2 * b.s, 1.2 * b.s, 1.8 * b.s, "rgba(255,255,255,.6)");
      if (b.bunny) { circle(ctx, bx - 1.5 * b.s, by, 0.6 * b.s, "#14040a"); circle(ctx, bx + 1.5 * b.s, by, 0.6 * b.s, "#14040a"); ctx.strokeStyle = "#14040a"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(bx, by + 1.2 * b.s, 2.2 * b.s, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // neon: a word sometimes goes out (a slow fade, well under 1 Hz; never under reduced motion)
    const neonOne = (n, s2, x, y, seed) => {
      if (!vis(x, y, s2.w)) return;
      const pulse = red ? 1 : 0.88 + 0.12 * Math.sin(t * 0.8 + seed * 3);
      ctx.globalAlpha = pulse; ctx.drawImage(s2.c, x - s2.w / 2, y - s2.h / 2, s2.w, s2.h);
      if (n && n.off && !red) {
        const k = Math.max(0, Math.sin(t * 0.37 + seed * 5)) ** 6;
        if (k > 0.02) { ctx.globalAlpha = k; ctx.drawImage(n.off.c, x - s2.w / 2, y - s2.h / 2, s2.w, s2.h); }
      }
      ctx.globalAlpha = 1;
    };
    c.neon.forEach((n, i) => neonOne(n, n.on, n.x, n.y, i));
    neonOne(null, c.farewell, mw - 120, mh + 28, 7);
    // the cutouts: something stands behind each one, looking out of the face hole at you
    for (const h of c.holes) {
      const hy = h.y - 4;
      if (!vis(h.x, hy, 14)) continue;
      const empty = hash(h.i, 3, 21) < 0.2;
      if (empty) continue;
      const dx = p.x - h.x, dy = p.y - hy, d = Math.hypot(dx, dy) || 1, ox = (dx / d) * 2.2, oy = (dy / d) * 1.6;
      const pale = hash(h.i, 4, 21) < 0.35;
      if (pale) { circle(ctx, h.x, hy + 0.5, 8.6, "#3a3230"); circle(ctx, h.x, hy + 1.5, 7.6, "#5a4c46"); } // a face, right up against it
      const blink = red ? 1 : (Math.sin(t * 0.5 + h.i * 1.7) > 0.985 ? 0.1 : 1);
      const ec = dread > 0.5 ? "#ff3030" : pale ? "#f4efe6" : "#fff3b0";
      for (const s of [-1, 1]) {
        const ex = h.x + s * 3.6 + ox, ey = hy - 1 + oy;
        ellipse(ctx, ex, ey, 1.9, 1.9 * blink, ec);
        if (blink > 0.5) circle(ctx, ex + ox * 0.3, ey + oy * 0.3, 0.8, "#0a0204");
      }
      if (pale) { ctx.strokeStyle = "#1a0408"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(h.x + ox * 0.5, hy + 3.6, 3.6, 0.15, Math.PI - 0.15); ctx.stroke(); }
    }
    // hutch eyes on the sides, following you
    for (const h of c.hutches) {
      if (!vis(h.x, h.y, 10)) continue;
      const ox = clamp((p.x - h.x) / 300, -1, 1), oy = clamp((p.y - h.y) / 300, -1, 1);
      for (const s of [-1, 1]) circle(ctx, h.x + s * 3 + ox, h.y + oy, 1.1, dread > 0.5 ? "#ff3030" : "#ff7ad9");
    }
    // dread: the whole carnival out there dims and reddens as they close in
    if (dread > 0.05) { ctx.fillStyle = `rgba(40,0,8,${dread * 0.45})`; ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); }
    ctx.restore();
  },
};
