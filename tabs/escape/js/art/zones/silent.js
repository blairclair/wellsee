/* Stage backdrop for the "silent" zone (The Silent Field). Owned by ONE agent; see art/zones/README.md.
 *
 * The carnival's cheerful edge presses in on a dead-quiet field. Past the tent walls the midway is
 * still lit and turning: Ferris wheels, a coaster, striped tents, a helter-skelter, a grinning
 * billboard whose eyes follow you, prize stalls and string lights. Across the field two garlands of
 * bunting and bulbs hang between the dead trees, fluttering one way while their balloons lean the
 * other. Wherever the silence band crosses, everything stops: the bulbs are dead, the pennants hang
 * grey and limp, and the skyline above it is dark and still (a stopped wheel, a fallen "FUN").
 *
 * paint    : banners, unlit neon tubes and posters on the walls, face-in-hole clown cutouts by the
 *            lone trees, confetti/ticket litter; pushes the garland bulbs and neon lights.
 * backdrop : the cached far skyline (north) and near stalls (south), dark, behind the map.
 * ambient  : bunting + balloons on the tree rows (under the darkness, lit by their own bulbs).
 * glow     : the lit carnival past the walls (clipped outside the map), turning wheels, coaster,
 *            searchlights, sky balloons, the neon signs on the wall, and eyes that follow you.
 */
import { TAU, hash, clamp, circle, ellipse, rgba, glowSprite, coneSprite, sprite } from "../util.js";
import { TILE } from "../../content.js";

const CANDY = ["#ff2a4d", "#ffd23a", "#2ad1ff", "#ff5ad8", "#7dff4a", "#ff8a1e", "#b46cff"];
const BULBC = ["#ffd23a", "#ff2a4d", "#7dff4a", "#2ad1ff", "#ff5ad8"];
const SIDE = 96, TOPH = 250, BOTH = 210, CS = 2; // band sizes (world px) and cache scale
const FONT = (px, w = "bold") => `${w} ${px}px Georgia, 'Times New Roman', serif`;
const greyOf = (c, k) => { // desaturate + darken a hex colour by k (0..1)
  const n = parseInt(c.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, l = (r * 0.3 + g * 0.59 + b * 0.11) * 0.55;
  return `rgb(${Math.round(r + (l - r) * k)},${Math.round(g + (l - g) * k)},${Math.round(b + (l - b) * k)})`;
};

/* ---------------------------------------------------------------- per-level model */
let M = null;
function model(game) {
  if (M && M.game === game) return M;
  const w = game.w, h = game.h, mw = w * TILE, mh = h * TILE;
  const at = (tx, ty) => (tx < 0 || ty < 0 || tx >= w || ty >= h ? null : game.tiles[ty * w + tx]);
  // how "silenced" each column is, near the top and near the bottom wall (spread a few tiles)
  const mask = (rows) => {
    const m = new Uint8Array(w), out = new Float32Array(w);
    for (let tx = 0; tx < w; tx++) for (const ty of rows) if (at(tx, ty) === "silence") m[tx] = 1;
    for (let tx = 0; tx < w; tx++) { let v = 0; for (let d = -4; d <= 4; d++) if (m[tx + d]) v = Math.max(v, 1 - Math.abs(d) / 5); out[tx] = v; }
    return out;
  };
  const qT = mask([1, 2, 3, 4, 5, 6]), qB = mask([h - 7, h - 6, h - 5, h - 4, h - 3, h - 2]), qAll = mask(Array.from({ length: h }, (_, i) => i));
  const q = (arr, x) => arr[clamp(Math.floor(x / TILE), 0, w - 1)];
  // trees: rows of them carry garlands; lone ones get a face-in-hole cutout
  const spans = [], cutouts = [], anchors = [];
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    if (at(tx, ty) !== "tree") continue;
    let nx = 0; for (let d = 2; d <= 4; d++) if (at(tx + d, ty) === "tree") { nx = d; break; }
    const row = nx || at(tx - 3, ty) === "tree" || at(tx - 2, ty) === "tree";
    if (nx) {
      const x0 = tx * TILE + 16, x1 = (tx + nx) * TILE + 16, y = ty * TILE + 2, mid = (x0 + x1) / 2;
      const dq = q(qAll, mid) > 0.6 ? 1 : 0;
      spans.push({ x0, x1, y, sag: 6 + dq * 6 + hash(tx, ty, 1) * 2, dead: dq, seed: hash(tx, ty, 2) });
    }
    if (!row) cutouts.push({ x: tx * TILE + 16, y: ty * TILE + 30, seed: hash(tx, ty, 9), tx, ty });
    else if (q(qAll, tx * TILE + 16) < 0.3 && hash(tx, ty, 21) < 0.34) anchors.push({ x: tx * TILE + 14, y: ty * TILE - 4, seed: hash(tx, ty, 22) });
  }
  // the far skyline (north) and the near stalls (south)
  const deadT = (x) => q(qT, x) > 0.45, deadB = (x) => q(qB, x) > 0.45;
  const wheels = [{ x: 200, y: -86, r: 56, n: 10 }, { x: 1180, y: -74, r: 48, n: 8 }, { x: 2280, y: -90, r: 60, n: 12 }]
    .map((o) => ({ ...o, dead: deadT(o.x), spin: (hash(o.x, 7) < 0.5 ? 1 : -1) * 0.09 }));
  const tents = [];
  for (const [x, tw, th] of [[-40, 80, 40], [60, 70, 34], [340, 96, 52], [455, 62, 36], [820, 84, 44], [960, 70, 38], [1330, 90, 48], [1480, 74, 40], [1590, 64, 34], [1830, 96, 54], [2090, 84, 46], [2400, 90, 50], [2530, 70, 38], [2620, 80, 42]])
    tents.push({ x, w: tw, h: th, c: CANDY[(Math.abs(x) / 10 | 0) % CANDY.length], dead: deadT(x) });
  const stalls = [];
  const SIGNS = ["RING TOSS", "WIN A PRIZE", "KISS THE CLOWN", "GUESS YOUR WEIGHT", "DUCK POND", "HIT THE BELL", "POPCORN", "BALLOON DARTS", "FISH A FRIEND", "TEST YOUR HEART"];
  for (let x = -60, i = 0; x < mw + SIDE; x += 128 + (hash(i, 4) * 30 | 0), i++)
    stalls.push({ x, w: 98, c: CANDY[i % CANDY.length], c2: i % 3 ? "#f3e6c8" : "#2a0a12", sign: SIGNS[i % SIGNS.length], dead: deadB(x + 49), seed: hash(i, 5) });
  const coaster = { x0: 470, x1: 760, dead: deadT(615) };
  const billboard = { x: 1960, y: -64, w: 128, h: 50, dead: deadT(1960) };
  M = { game, mw, mh, qT, qB, qAll, q, deadT, deadB, spans, cutouts, anchors, wheels, tents, stalls, coaster, billboard, skyBulbs: [], lowBulbs: [], top: null, bot: null };
  M.coasterY = (x) => -34 - 22 * Math.abs(Math.sin((x - coaster.x0) / 52)) - 12 * Math.sin((x - coaster.x0) / 140);
  return M;
}

/* ---------------------------------------------------------------- shared drawing */
function stripes(g, x, y, w, h, a, b, n) { const sw = w / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(x + i * sw, y, sw + 0.3, h); } }
function scallops(g, x, y, w, n, a, b, r) { const sw = w / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.beginPath(); g.moveTo(x + i * sw, y); g.lineTo(x + i * sw + sw, y); g.arc(x + i * sw + sw / 2, y, sw / 2, 0, Math.PI); g.fill(); } if (r) { g.fillStyle = r; g.fillRect(x, y - 1, w, 1.2); } }
function drips(g, x, y, w, col, seed, n = 4) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) { const dx = x + hash(seed * 99, i) * w, l = 3 + hash(seed * 77, i) * 9; g.fillRect(dx, y, 1.1, l); circle(g, dx + 0.55, y + l, 1, col); }
}
function bannerText(g, text, x, y, px, fill, stroke) {
  g.font = FONT(px); g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.lineWidth = Math.max(1, px * 0.22); g.strokeStyle = stroke; g.strokeText(text, x, y); }
  g.fillStyle = fill; g.fillText(text, x, y);
}
function balloon(g, x, y, col, face, dead) {
  ellipse(g, x, y, 4.3, 5.4, col);
  ellipse(g, x - 1.4, y - 2, 1.1, 1.8, dead ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.55)", -0.4);
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 1, y + 5.6); g.lineTo(x + 1, y + 5.6); g.lineTo(x, y + 4.4); g.fill();
  if (face) { // the one with the grin
    circle(g, x - 1.5, y - 0.6, 0.7, "#120306"); circle(g, x + 1.5, y - 0.6, 0.7, "#120306");
    g.fillStyle = "#120306"; g.beginPath(); g.ellipse(x, y + 1.8, 2.6, 1.3, 0, 0, Math.PI); g.fill();
    g.fillStyle = "#fff6e0"; for (let i = -2; i <= 2; i++) g.fillRect(x + i * 0.95 - 0.3, y + 1.8, 0.6, 0.8);
  }
}

/* ---------------------------------------------------------------- the far skyline (north), cached */
function drawTop(g, m) {
  m.skyBulbs = [];
  const x0 = -SIDE, x1 = m.mw + SIDE;
  // sky: bruised violet overhead, a sick carnival-pink haze at the horizon
  const sk = g.createLinearGradient(0, -TOPH, 0, 0);
  sk.addColorStop(0, "#07040d"); sk.addColorStop(0.55, "#1c0a26"); sk.addColorStop(0.85, "#4a1240"); sk.addColorStop(1, "#7a2050");
  g.fillStyle = sk; g.fillRect(x0, -TOPH, x1 - x0, TOPH + 8);
  // over the silence the sky goes grey and flat
  for (let x = x0; x < x1; x += 8) { const k = m.q(m.qT, x); if (k > 0) { g.fillStyle = `rgba(14,14,20,${k * 0.85})`; g.fillRect(x, -TOPH, 8.5, TOPH + 8); } }
  for (let i = 0; i < 120; i++) { const sx = x0 + hash(i, 1) * (x1 - x0), sy = -TOPH + hash(i, 2) * (TOPH - 90); circle(g, sx, sy, hash(i, 3) < 0.1 ? 0.9 : 0.5, `rgba(255,240,230,${0.2 + hash(i, 4) * 0.4})`); }
  // a blood-orange moon wearing a smile somebody painted on it
  const mx = 640, my = -196; circle(g, mx, my, 15, "#e8a060"); circle(g, mx + 4, my - 3, 13, "#f2c27e");
  g.strokeStyle = "#7a1418"; g.lineWidth = 1.3; g.beginPath(); g.arc(mx + 2, my - 1, 9, 0.3, Math.PI - 0.3); g.stroke();
  circle(g, mx - 2, my - 5, 1.4, "#3a0a0a"); circle(g, mx + 6, my - 5, 1.4, "#3a0a0a");
  // hill
  g.fillStyle = "#12081a"; g.beginPath(); g.moveTo(x0, 8);
  for (let x = x0; x <= x1; x += 12) g.lineTo(x, -26 - 12 * Math.sin(x / 170) - 6 * Math.sin(x / 53 + 1));
  g.lineTo(x1, 8); g.fill();
  // Ferris wheel supports (the wheels themselves turn, in glow)
  for (const wh of m.wheels) {
    g.strokeStyle = wh.dead ? "#24242a" : "#3a1830"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(wh.x - wh.r * 0.7, 2); g.lineTo(wh.x, wh.y); g.lineTo(wh.x + wh.r * 0.7, 2); g.stroke();
    g.lineWidth = 1; g.beginPath(); g.moveTo(wh.x - wh.r * 0.45, -24); g.lineTo(wh.x + wh.r * 0.45, -24); g.stroke();
    // a ticket booth at its foot
    g.fillStyle = wh.dead ? "#2a2a30" : "#5a1030"; g.fillRect(wh.x - 9, -14, 18, 14);
    stripes(g, wh.x - 11, -20, 22, 6, wh.dead ? "#3a3a40" : "#ff2a4d", wh.dead ? "#55555c" : "#f3e6c8", 6);
  }
  // the coaster: a lattice of supports and a track that loops into the dark
  { const co = m.coaster, col = co.dead ? "#2a2a30" : "#4a1a3a";
    g.strokeStyle = col; g.lineWidth = 0.8;
    for (let x = co.x0; x <= co.x1; x += 14) { const y = m.coasterY(x); g.beginPath(); g.moveTo(x, y); g.lineTo(x, 2); g.moveTo(x, y + 6); g.lineTo(x + 14, m.coasterY(x + 14) + 14); g.stroke(); }
    g.lineWidth = 2.4; g.strokeStyle = co.dead ? "#3a3a40" : "#c4204a"; g.beginPath();
    for (let x = co.x0; x <= co.x1; x += 4) { const y = m.coasterY(x); x === co.x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    g.lineWidth = 0.8; g.strokeStyle = co.dead ? "#55555c" : "#ffd23a"; g.beginPath();
    for (let x = co.x0; x <= co.x1; x += 4) { const y = m.coasterY(x) + 2.4; x === co.x0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    bannerText(g, "THE SCREAMER", co.x0 + 60, -6, 7, co.dead ? "#55555c" : "#ffd23a", "#1a0610");
  }
  // the helter-skelter: a striped tower with a slide wound round it
  { const hx = 1700, hd = m.deadT(hx), top = -118;
    g.fillStyle = hd ? "#2a2a30" : "#f3e6c8"; g.beginPath(); g.moveTo(hx - 13, 2); g.lineTo(hx - 8, top + 16); g.lineTo(hx + 8, top + 16); g.lineTo(hx + 13, 2); g.fill();
    for (let i = 0; i < 7; i++) { const y = top + 22 + i * 15; g.fillStyle = hd ? "#44444a" : CANDY[i % 2 ? 0 : 3]; g.beginPath(); g.moveTo(hx - 15 - i * 0.6, y); g.lineTo(hx + 15 + i * 0.6, y - 6); g.lineTo(hx + 15 + i * 0.6, y - 2); g.lineTo(hx - 15 - i * 0.6, y + 4); g.fill(); }
    g.fillStyle = hd ? "#33333a" : "#ff2a4d"; g.beginPath(); g.moveTo(hx - 12, top + 16); g.lineTo(hx, top); g.lineTo(hx + 12, top + 16); g.fill();
    g.strokeStyle = "#1a0610"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(hx, top); g.lineTo(hx, top - 10); g.stroke();
    g.fillStyle = "#ffd23a"; g.beginPath(); g.moveTo(hx, top - 10); g.lineTo(hx + 8, top - 7); g.lineTo(hx, top - 4); g.fill();
  }
  // tents: striped, pennant-topped, scalloped
  for (const tn of m.tents) {
    const a = tn.dead ? greyOf(tn.c, 0.9) : tn.c, b = tn.dead ? "#3a3a40" : "#f3e6c8", base = 0, ty = base - tn.h, x = tn.x;
    g.save(); g.beginPath(); g.moveTo(x, base); g.lineTo(x, ty + tn.h * 0.45); g.lineTo(x + tn.w / 2, ty); g.lineTo(x + tn.w, ty + tn.h * 0.45); g.lineTo(x + tn.w, base); g.closePath(); g.clip();
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? b : a; g.beginPath(); g.moveTo(x + tn.w / 2, ty); g.lineTo(x + (i / 10) * tn.w, base); g.lineTo(x + ((i + 1) / 10) * tn.w, base); g.fill(); }
    g.fillStyle = "rgba(10,0,10,.35)"; g.fillRect(x, ty, tn.w, tn.h);
    g.restore();
    scallops(g, x, ty + tn.h * 0.45, tn.w, 8, a, b, tn.dead ? null : "#ffd23a");
    g.strokeStyle = "#1a0610"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x + tn.w / 2, ty); g.lineTo(x + tn.w / 2, ty - 10); g.stroke();
    g.fillStyle = tn.dead ? "#55555c" : CANDY[(tn.x / 7 | 0) % CANDY.length]; g.beginPath(); g.moveTo(x + tn.w / 2, ty - 10); g.lineTo(x + tn.w / 2 + 7, ty - 8); g.lineTo(x + tn.w / 2, ty - 6); g.fill();
    g.fillStyle = "#0a0208"; g.beginPath(); g.moveTo(x + tn.w / 2 - 6, base); g.lineTo(x + tn.w / 2, base - 14); g.lineTo(x + tn.w / 2 + 6, base); g.fill(); // the open flap
  }
  // the fallen "FUN" marquee over the silence
  { const fx = 1010, fy = -8;
    g.save(); g.translate(fx, fy); g.fillStyle = "#2c2c32"; g.strokeStyle = "#1a1a1e"; g.lineWidth = 0.8;
    const L = [["F", -22, 0], ["U", 0, 0], ["N", 24, 1.3]];
    for (const [ch, lx, rot] of L) {
      g.save(); g.translate(lx, rot ? 4 : 0); g.rotate(rot);
      g.fillRect(-8, -24, 16, 22); g.strokeRect(-8, -24, 16, 22);
      bannerText(g, ch, 0, -13, 15, "#4a4a52"); for (let i = 0; i < 6; i++) circle(g, -6 + (i % 3) * 6, -22 + (i > 2 ? 18 : 0), 1, "#18181c");
      g.restore();
      if (!rot) { g.fillStyle = "#2c2c32"; g.fillRect(lx - 1, -2, 2, 10); }
    }
    g.restore();
  }
  // the billboard: a clown the size of a house, grinning with too many teeth
  { const bb = m.billboard, bx = bb.x - bb.w / 2, by = bb.y;
    g.fillStyle = "#1a0e10"; g.fillRect(bx + 16, by + bb.h, 3, -by - bb.h + 2); g.fillRect(bx + bb.w - 19, by + bb.h, 3, -by - bb.h + 2);
    g.fillStyle = "#f7e9c8"; g.fillRect(bx, by, bb.w, bb.h);
    stripes(g, bx, by, bb.w, 5, "#ff2a4d", "#f7e9c8", 16); g.fillStyle = "#ffd23a"; g.fillRect(bx, by + bb.h - 3, bb.w, 3);
    const fx = bx + 30, fy = by + 27;
    for (let i = 0; i < 7; i++) circle(g, fx - 16 + i * 5.3, fy - 14 + Math.sin(i) * 2, 5, "#ff5a1e"); // hair
    circle(g, fx, fy, 15, "#fffaf0");
    for (const s of [-1, 1]) { ellipse(g, fx + s * 6, fy - 5, 4.2, 5, "#ffffff"); g.strokeStyle = "#2a0a12"; g.lineWidth = 0.7; g.beginPath(); g.ellipse(fx + s * 6, fy - 5, 4.2, 5, 0, 0, TAU); g.stroke(); }
    circle(g, fx, fy + 1, 2.8, "#e0102c");
    g.fillStyle = "#6a0618"; g.beginPath(); g.moveTo(fx - 13, fy + 3); g.quadraticCurveTo(fx, fy + 20, fx + 13, fy + 3); g.quadraticCurveTo(fx, fy + 10, fx - 13, fy + 3); g.fill();
    g.fillStyle = "#fff8e8"; for (let i = 0; i < 12; i++) { const tx = fx - 11 + i * 2, k = (tx - fx) / 13, ty = fy + 3 + 7 * (1 - k * k) * 0.55; g.beginPath(); g.moveTo(tx - 0.9, ty); g.lineTo(tx + 0.9, ty); g.lineTo(tx, ty + 2.6); g.fill(); }
    bannerText(g, "SMILE!", bx + 88, by + 18, 15, "#ff2a4d", "#2a0a12");
    bannerText(g, "NOBODY LEAVES SAD", bx + 88, by + 34, 6, "#2a0a12");
    drips(g, bx + 60, by + bb.h - 3, 60, "#b0102a", 3, 6);
    m.billEyes = [{ x: fx - 6, y: fy - 5 }, { x: fx + 6, y: fy - 5 }];
  }
  // string lights on poles all the way along; over the silence the wires are down and dark
  g.lineWidth = 0.6;
  let prev = null;
  for (let x = x0 + 20, i = 0; x < x1; x += 70 + hash(i, 8) * 30, i++) {
    const dead = m.deadT(x), py = -44 - hash(i, 9) * 14;
    g.fillStyle = "#1a0e14"; g.fillRect(x - 1, py, 2, -py + 2);
    if (prev) {
      const sag = prev.dead || dead ? 18 : 9;
      g.strokeStyle = "#1a0e14"; g.beginPath(); g.moveTo(prev.x, prev.y);
      if (prev.dead && dead && hash(i, 10) < 0.5) g.lineTo(prev.x + 12, prev.y + 26); // snapped
      else g.quadraticCurveTo((prev.x + x) / 2, (prev.y + py) / 2 + sag * 2, x, py);
      g.stroke();
      for (let k = 1; k < 7; k++) {
        const u = k / 7, bx2 = prev.x + (x - prev.x) * u, by2 = prev.y + (py - prev.y) * u + sag * 4 * u * (1 - u);
        const bd = m.deadT(bx2);
        if (k % 2) { g.fillStyle = bd ? "#3a3a40" : CANDY[(i + k) % CANDY.length]; g.beginPath(); g.moveTo(bx2 - 2.5, by2); g.lineTo(bx2 + 2.5, by2); g.lineTo(bx2, by2 + 5); g.fill(); }
        else if (!bd) m.skyBulbs.push({ x: bx2, y: by2 + 1, c: BULBC[(i + k) % BULBC.length], s: hash(i, k) });
        else circle(g, bx2, by2 + 1, 1, "#1a1a1e");
      }
    }
    prev = { x, y: py, dead };
  }
  for (const b of m.skyBulbs) circle(g, b.x, b.y, 1.2, b.c);
  // tent-top bulbs
  for (const tn of m.tents) if (!tn.dead) for (let k = 0; k <= 8; k++) m.skyBulbs.push({ x: tn.x + (k / 8) * tn.w, y: -tn.h * 0.55 + 1, c: BULBC[k % BULBC.length], s: hash(tn.x, k) });
}

/* ---------------------------------------------------------------- the near side (south), cached */
function drawBot(g, m) {
  m.lowBulbs = [];
  const H = BOTH + 8;
  const x0 = -SIDE, x1 = m.mw + SIDE, y0 = m.mh - 8;
  const gr = g.createLinearGradient(0, y0, 0, y0 + H); gr.addColorStop(0, "#1e1412"); gr.addColorStop(1, "#0c0809");
  g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, H);
  // a boardwalk
  for (let y = m.mh + 6; y < m.mh + 30; y += 6) { g.fillStyle = (y / 6) % 2 ? "#3a2618" : "#33200f"; g.fillRect(x0, y, x1 - x0, 5.4); }
  for (let x = x0; x < x1; x += 22) { g.fillStyle = "#1a0e08"; g.fillRect(x + hash(x, 1) * 8, m.mh + 6, 0.8, 24); }
  // litter: popcorn, tickets, confetti, a lost shoe
  for (let i = 0; i < 900; i++) {
    const lx = x0 + hash(i, 11) * (x1 - x0), ly = m.mh + 2 + hash(i, 12) * (BOTH - 8), dead = m.deadB(lx), r = hash(i, 13);
    if (r < 0.5) { g.fillStyle = dead ? "#55555c" : CANDY[i % CANDY.length]; g.fillRect(lx, ly, 1.6, 1); }
    else if (r < 0.75) circle(g, lx, ly, 1.1, dead ? "#6a6a70" : "#f3e7b0");
    else if (r < 0.82) { g.save(); g.translate(lx, ly); g.rotate(r * 9); g.fillStyle = dead ? "#4a4a50" : (i % 2 ? "#e0102c" : "#ffd23a"); g.fillRect(-3, -1.5, 6, 3); g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(-1, -1.5, 0.5, 3); g.restore(); }
  }
  // string lights along the wall
  g.strokeStyle = "#140a0a"; g.lineWidth = 0.6; g.beginPath();
  for (let x = x0; x < x1; x += 48) { g.moveTo(x, m.mh + 4); g.quadraticCurveTo(x + 24, m.mh + 12 + (m.deadB(x) ? 8 : 0), x + 48, m.mh + 4); }
  g.stroke();
  for (let x = x0 + 8; x < x1; x += 16) {
    const u = ((x - x0) % 48) / 48, y = m.mh + 4 + (8 + (m.deadB(x) ? 8 : 0)) * 4 * u * (1 - u) * 0.5 + 1;
    if (m.deadB(x)) circle(g, x, y, 1, "#1e1e22"); else { const b = { x, y, c: BULBC[(x / 16 | 0) % BULBC.length], s: hash(x, 3) }; m.lowBulbs.push(b); circle(g, x, y, 1.2, b.c); }
  }
  // prize stalls: striped roof, scalloped valance, a counter of prizes that are looking at you
  for (const st of m.stalls) {
    const sx = st.x, sy = m.mh + 40, dead = st.dead, a = dead ? greyOf(st.c, 0.92) : st.c, b = dead ? "#34343a" : st.c2;
    g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(sx + 3, sy + 4, st.w, 70);
    // sign board above
    g.fillStyle = dead ? "#2a2a30" : "#2a0a12"; g.fillRect(sx + 14, sy - 14, st.w - 28, 12);
    g.strokeStyle = dead ? "#3a3a40" : "#ffd23a"; g.lineWidth = 0.8; g.strokeRect(sx + 14.5, sy - 13.5, st.w - 29, 11);
    bannerText(g, st.sign, sx + st.w / 2, sy - 7.6, 6.2, dead ? "#55555c" : "#fff3c0");
    if (!dead) for (let k = 0; k < 9; k++) m.lowBulbs.push({ x: sx + 16 + k * (st.w - 32) / 8, y: sy - 15, c: BULBC[k % BULBC.length], s: hash(sx, k), small: 1 });
    // roof + valance
    stripes(g, sx, sy, st.w, 20, a, b, 8);
    g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(sx, sy, st.w, 6);
    scallops(g, sx, sy + 20, st.w, 8, a, b, dead ? null : "#ffd23a");
    // posts
    g.fillStyle = dead ? "#2a2a30" : "#e8dcc4"; g.fillRect(sx, sy + 20, 3, 54); g.fillRect(sx + st.w - 3, sy + 20, 3, 54);
    // inside / shutter
    if (dead) {
      g.fillStyle = "#26262c"; g.fillRect(sx + 3, sy + 26, st.w - 6, 40);
      g.fillStyle = "#1c1c20"; for (let y = sy + 28; y < sy + 66; y += 3) g.fillRect(sx + 3, y, st.w - 6, 1);
      bannerText(g, "CLOSED FOR QUIET", sx + st.w / 2, sy + 46, 6, "#6a6a72");
    } else {
      g.fillStyle = "#14060c"; g.fillRect(sx + 3, sy + 26, st.w - 6, 40);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) { // hanging plush prizes, button eyes
        const px = sx + 11 + k * 12.5, py = sy + 34 + r * 14, pc = CANDY[(k + r * 3 + (st.seed * 7 | 0)) % CANDY.length];
        g.strokeStyle = "#3a2a20"; g.lineWidth = 0.4; g.beginPath(); g.moveTo(px, sy + 26); g.lineTo(px, py - 4); g.stroke();
        circle(g, px, py, 4, pc); circle(g, px - 3, py - 3.4, 1.6, pc); circle(g, px + 3, py - 3.4, 1.6, pc);
        circle(g, px - 1.4, py - 0.6, 0.8, "#0a0204"); circle(g, px + 1.4, py - 0.6, 0.8, "#0a0204");
        if (hash(sx, k, r) < 0.3) { g.fillStyle = "#f4ecd8"; g.fillRect(px - 0.6, py - 1.6, 1.2, 1.2); g.fillRect(px - 0.3, py + 1, 0.6, 1.8); } // one eye's button is missing; the stuffing shows
        if (hash(sx, k, r + 5) < 0.2) { g.fillStyle = "#8a0a1a"; g.fillRect(px - 0.4, py + 2, 0.8, 4); } // leaking
      }
      g.fillStyle = "#c4204a"; g.fillRect(sx + 3, sy + 62, st.w - 6, 8); stripes(g, sx + 3, sy + 62, st.w - 6, 2, "#ffd23a", "#c4204a", 12);
    }
  }
  // a giant inflatable clown, deflated across the walk where the silence starts
  { let dx = 0; for (let x = 0; x < m.mw; x += 32) if (m.deadB(x)) { dx = x; break; }
    if (dx) {
      const cx = dx + 40, cy = m.mh + 22;
      g.fillStyle = "#5c5a5e"; g.beginPath(); g.moveTo(cx - 40, cy + 10); g.quadraticCurveTo(cx - 20, cy - 16, cx + 6, cy - 4); g.quadraticCurveTo(cx + 36, cy - 10, cx + 44, cy + 12); g.quadraticCurveTo(cx, cy + 22, cx - 40, cy + 10); g.fill();
      ellipse(g, cx - 4, cy - 2, 13, 9, "#d8d0c4", 0.2); // the face, slumped
      circle(g, cx - 3, cy - 1, 2.6, "#b0102a");
      g.strokeStyle = "#3a0a10"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 12, cy + 3); g.quadraticCurveTo(cx - 3, cy + 1, cx + 6, cy + 6); g.stroke();
      g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx - 9, cy - 6); g.lineTo(cx - 6, cy - 4); g.moveTo(cx + 1, cy - 6); g.lineTo(cx + 4, cy - 4); g.stroke(); // x'd out eyes
      for (let i = 0; i < 5; i++) circle(g, cx - 34 + i * 16, cy + 9 + Math.sin(i) * 3, 3, ["#7a7a80", "#6a6a70"][i % 2]); // limp balloon-arms
    }
  }
}

/* bands are cached in 1024-world-px chunks (2048 canvas px): one huge canvas blows past GPU texture limits */
function buildChunks(m, draw, wy0, wy1) {
  const out = [], CW = 1024;
  for (let cx = -SIDE; cx < m.mw + SIDE; cx += CW) {
    const w = Math.min(CW, m.mw + SIDE - cx), c = document.createElement("canvas");
    c.width = Math.ceil(w * CS); c.height = Math.ceil((wy1 - wy0) * CS);
    const g = c.getContext("2d"); g.setTransform(CS, 0, 0, CS, -cx * CS, -wy0 * CS);
    draw(g, m);
    out.push({ c, x0: cx, x1: cx + w, y0: wy0, y1: wy1 });
  }
  return out;
}
function blitBand(ctx, list, box) {
  for (const k of list) {
    const ax = Math.max(box.x0, k.x0), ay = Math.max(box.y0, k.y0), bx = Math.min(box.x1, k.x1), by = Math.min(box.y1, k.y1);
    if (bx <= ax || by <= ay) continue;
    ctx.drawImage(k.c, (ax - k.x0) * CS, (ay - k.y0) * CS, (bx - ax) * CS, (by - ay) * CS, ax, ay, bx - ax, by - ay);
  }
}
function ensureBands(m) {
  if (!m.top) m.top = buildChunks(m, drawTop, -TOPH, 8);
  if (!m.bot) m.bot = buildChunks(m, drawBot, m.mh - 8, m.mh + BOTH);
}
function bands(ctx, m, box) {
  ensureBands(m);
  if (box.y0 < 0) blitBand(ctx, m.top, box);
  if (box.y1 > m.mh) blitBand(ctx, m.bot, box);
  // the thin side margins: trampled ground and a picket of fence posts
  ctx.fillStyle = "#130d0e";
  if (box.x0 < 0) { ctx.fillRect(box.x0, Math.max(0, box.y0), -box.x0, Math.min(m.mh, box.y1) - Math.max(0, box.y0)); }
  if (box.x1 > m.mw) { ctx.fillRect(m.mw, Math.max(0, box.y0), box.x1 - m.mw, Math.min(m.mh, box.y1) - Math.max(0, box.y0)); }
}

/* a Ferris wheel's rim + spokes, cached once per size */
function wheelSprite(r, n, dead) {
  return sprite("silentWheel" + r + n + (dead ? "d" : ""), (r * 2 + 8) * 3, (r * 2 + 8) * 3, (g, w) => {
    g.scale(3, 3); g.translate(r + 4, r + 4);
    g.strokeStyle = dead ? "#3a3a42" : "#6a2a5a"; g.lineWidth = 0.9;
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    g.lineWidth = 2; g.strokeStyle = dead ? "#44444c" : "#c42a6a"; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.lineWidth = 1; g.strokeStyle = dead ? "#2e2e34" : "#ffd23a"; g.beginPath(); g.arc(0, 0, r * 0.62, 0, TAU); g.stroke();
    circle(g, 0, 0, 4, dead ? "#2a2a30" : "#ffd23a"); circle(g, 0, 0, 1.6, "#1a0610");
  });
}
function drawWheel(ctx, wh, t, reduced, lit) {
  const ang = wh.dead ? 0.21 : (reduced ? 0.3 : t * wh.spin);
  const spr = wheelSprite(wh.r, wh.n, wh.dead), s = wh.r * 2 + 8;
  ctx.save(); ctx.translate(wh.x, wh.y); ctx.rotate(ang); ctx.drawImage(spr, -s / 2, -s / 2, s, s); ctx.restore();
  for (let i = 0; i < wh.n; i++) { // gondolas hang plumb
    const a = ang + (i / wh.n) * TAU, gx = wh.x + Math.cos(a) * wh.r, gy = wh.y + Math.sin(a) * wh.r;
    const sw = wh.dead ? (i === 3 ? 1.2 : 0.08 * Math.sin(i)) : (reduced ? 0 : Math.sin(t * 0.8 + i) * 0.12);
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(sw);
    ctx.fillStyle = "#1a0610"; ctx.fillRect(-0.4, 0, 0.8, 4);
    ctx.fillStyle = wh.dead ? "#3a3a42" : CANDY[i % CANDY.length]; ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(5, 4); ctx.lineTo(4, 10); ctx.lineTo(-4, 10); ctx.fill();
    if (!wh.dead && hash(i, wh.x) < 0.25) circle(ctx, 0, 5.5, 1.5, "#f4efe6"); // someone is still riding
    ctx.restore();
  }
  if (lit && !wh.dead) { // chasing rim bulbs (steps at 1.5/s, all-on under reduced motion)
    const step = reduced ? 0 : Math.floor(t * 1.5), gs = glowSprite("#ffd23a");
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < wh.n * 3; i++) {
      const a = ang + (i / (wh.n * 3)) * TAU, bx = wh.x + Math.cos(a) * wh.r, by = wh.y + Math.sin(a) * wh.r;
      const on = reduced || (i + step) % 3 !== 0, c = BULBC[i % BULBC.length];
      if (!on) continue;
      ctx.globalAlpha = 0.9; circle(ctx, bx, by, 1.3, c);
      if (i % 2 === 0) { ctx.globalAlpha = 0.5; ctx.drawImage(i % 4 ? glowSprite(c) : gs, bx - 7, by - 7, 14, 14); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
}

/* neon, letter by letter, cached */
function neonLetter(ch, col, px) {
  return sprite("silentNeon" + ch + col + px, px * 1.6, px * 1.8, (g, w, h) => {
    g.font = FONT(px); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    for (const [lw, a] of [[px * 0.42, 0.08], [px * 0.26, 0.16], [px * 0.13, 0.4]]) { g.lineWidth = lw; g.strokeStyle = rgba(col, a); g.strokeText(ch, w / 2, h / 2); }
    g.lineWidth = px * 0.06; g.strokeStyle = "#ffffff"; g.strokeText(ch, w / 2, h / 2);
  });
}
const NEON = [
  { x: 330, text: "FUN!", col: "#ff3fa8", px: 15, bad: 1 },
  { x: 1880, text: "SMILE", col: "#2ad1ff", px: 14, bad: 4 },
  { x: 2330, text: "COME AGAIN", col: "#ffd23a", px: 10, bad: 5 },
];

/* ---------------------------------------------------------------- hooks */
export default {
  paint(ctx, game, api) {
    const m = model(game), { mw, mh } = m;
    ensureBands(m); // build the skyline caches now, during level load, not on the first frame
    // --- top wall: neon backing boards (tubes unlit here; they burn in glow), cloth banners with slogans gone wrong
    for (const n of NEON) {
      if (m.deadT(n.x)) continue;
      const w = n.text.length * n.px * 0.84 + 12;
      ctx.fillStyle = "#14060c"; ctx.fillRect(n.x - w / 2, 1, w, 18); ctx.strokeStyle = "#3a1a20"; ctx.lineWidth = 1; ctx.strokeRect(n.x - w / 2 + 0.5, 1.5, w - 1, 17);
      api.lights.push({ x: n.x, y: 30, r: 110, color: n.col, flicker: 0, seed: hash(n.x, 1) });
    }
    const BANNERS = [
      [620, "NO CRICKETS PAST THIS POINT", "#f3e6c8", "#c4204a"], [1150, "SHHH!  THE FUN IS SLEEPING", "#9a9aa0", "#2a2a30"],
      [1520, "KEEP SMILING", "#ffd23a", "#2a0a12"], [2100, "THEY CAN HEAR YOUR HEART", "#2ad1ff", "#14060c"], [110, "FUN FOR EVERY BODY", "#ff5ad8", "#2a0a12"],
    ];
    for (const [bx, txt, bg, fg] of BANNERS) {
      const dead = m.deadT(bx), w = txt.length * 4.4 + 16, x = bx - w / 2, y = 4;
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(x + 2, y + 2, w, 20);
      ctx.fillStyle = dead ? "#5a5a60" : bg; ctx.fillRect(x, y, w, 18);
      scallops(ctx, x, y + 18, w, Math.round(w / 8), dead ? "#5a5a60" : bg, dead ? "#45454a" : fg);
      bannerText(ctx, txt, bx, y + 9.5, 7.5, dead ? "#2a2a30" : fg);
      if (!dead) drips(ctx, x + 6, y + 13, w - 12, "#a00c22", bx, 5);
      else { ctx.strokeStyle = "#2a2a30"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + w * 0.7, y); ctx.lineTo(x + w * 0.74, y + 10); ctx.lineTo(x + w * 0.69, y + 18); ctx.stroke(); } // torn
      if (!dead) for (let k = 0; k < 5; k++) api.bulbs.push({ x: x + 4 + k * (w - 8) / 4, y: y - 1, color: BULBC[k % BULBC.length], seed: hash(bx, k), state: hash(bx, k, 2) < 0.2 ? "flicker" : "on" });
    }
    // --- bottom wall top: handbills and a bunting line
    for (let x = 40, i = 0; x < mw - 40; x += 150 + hash(i, 30) * 80, i++) {
      const dead = m.deadB(x), y = mh - 26 + hash(i, 31) * 6;
      ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i, 32) - 0.5) * 0.25);
      ctx.fillStyle = dead ? "#55555a" : "#efe2c6"; ctx.fillRect(-9, -11, 18, 22);
      if (!dead) { // a clown handbill: face, too many teeth, "TONIGHT ONLY"
        circle(ctx, 0, -3, 5, "#fffaf0"); circle(ctx, 0, -2.6, 1.2, "#e0102c"); circle(ctx, -2, -5, 0.8, "#120306"); circle(ctx, 2, -5, 0.8, "#120306");
        ctx.fillStyle = "#6a0618"; ctx.fillRect(-3.5, -0.5, 7, 1.8); ctx.fillStyle = "#fff"; for (let k = 0; k < 6; k++) ctx.fillRect(-3.3 + k * 1.2, -0.5, 0.6, 0.9);
        bannerText(ctx, "TONIGHT", 0, 6, 3.6, "#c4204a"); bannerText(ctx, "& EVERY NIGHT", 0, 9, 2.4, "#2a0a12");
      } else bannerText(ctx, "LOST", 0, 0, 5, "#2a2a30");
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.moveTo(9, 11); ctx.lineTo(9, 3); ctx.lineTo(3, 11); ctx.fill(); // torn corner
      ctx.restore();
    }
    // --- the right wall beside the exit: a cheerful farewell
    { const x = mw - 16; let ey = 0, n = 0; for (const e of game.exits || []) { ey += e.y; n++; }
      ey = n ? ey / n : mh / 2;
      for (const [yy, txt, col] of [[ey - 92, "COME", "#ffd23a"], [ey - 64, "AGAIN", "#ff5ad8"], [ey + 66, "YOU", "#2ad1ff"], [ey + 92, "WILL", "#ff2a4d"]]) {
        ctx.fillStyle = "#14060c"; ctx.fillRect(x - 14, yy - 9, 28, 18); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(x - 13.5, yy - 8.5, 27, 17);
        bannerText(ctx, txt, x, yy + 0.5, 7.5, col);
      }
      api.lights.push({ x: x - 20, y: ey - 78, r: 70, color: "#ff5ad8", flicker: 0.2, seed: 0.41 }, { x: x - 20, y: ey + 78, r: 70, color: "#2ad1ff", flicker: 0.2, seed: 0.73 });
    }
    // --- face-in-hole clown cutouts by the lone trees (eyes appear in the hole, in glow)
    for (const cu of m.cutouts) {
      const dead = m.q(m.qAll, cu.x) > 0.5, x = cu.x + (cu.tx < game.w / 2 ? 7 : -7), y = cu.y;
      const body = dead ? "#6a6a70" : CANDY[(cu.seed * 7 | 0) % CANDY.length];
      ellipse(ctx, x + 2, y + 1, 11, 3, "rgba(0,0,0,.5)");
      ctx.fillStyle = "#2a1a10"; ctx.fillRect(x - 1, y - 6, 2, 6); // the prop stand
      ctx.save(); ctx.translate(x, y - 4); ctx.rotate((cu.seed - 0.5) * 0.12);
      ctx.fillStyle = "#e8dcc4"; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-11, -22); ctx.quadraticCurveTo(-11, -36, 0, -37); ctx.quadraticCurveTo(11, -36, 11, -22); ctx.lineTo(11, 0); ctx.fill();
      ctx.fillStyle = body; ctx.fillRect(-10, -20, 20, 20); // the suit
      ctx.fillStyle = dead ? "#4a4a50" : "#fff6e0"; for (let i = 0; i < 6; i++) circle(ctx, -6 + (i % 3) * 6, -15 + (i / 3 | 0) * 8, 1.5, ctx.fillStyle); // polka dots
      ctx.fillStyle = dead ? "#5a5a60" : "#ffd23a"; ctx.beginPath(); ctx.moveTo(-8, -20); ctx.lineTo(0, -16); ctx.lineTo(8, -20); ctx.lineTo(0, -23); ctx.fill(); // ruff
      ctx.fillStyle = dead ? "#55555a" : "#ff2a4d"; ctx.beginPath(); ctx.moveTo(-7, -31); ctx.lineTo(0, -44); ctx.lineTo(7, -31); ctx.fill(); circle(ctx, 0, -44, 1.6, "#fff6e0"); // hat
      circle(ctx, 0, -27, 5.6, "#050203"); // the hole where your face goes
      ctx.strokeStyle = "#2a0a12"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, -27, 5.6, 0, TAU); ctx.stroke();
      ctx.fillStyle = "#b0102a"; for (const s of [-1, 1]) ctx.fillRect(s * 9.5 - 0.5, -18, 1, 4); // painted hands waving, dripping
      bannerText(ctx, "YOUR FACE", 0, -6, 3.6, dead ? "#2a2a30" : "#1a0610"); bannerText(ctx, "HERE", 0, -2.5, 3.6, dead ? "#2a2a30" : "#1a0610");
      ctx.restore();
      cu.hole = { x: x + Math.sin((cu.seed - 0.5) * 0.12) * 27, y: y - 4 - 27 };
      cu.dead = dead;
      if (!dead) api.lights.push({ x, y: y - 20, r: 46, color: body, flicker: 0.35, seed: cu.seed });
    }
    // --- garland bulbs on the tree rows (dead where the silence crosses)
    for (const sp of m.spans) if (sp.dead < 0.5 && m.q(m.qAll, (sp.x0 + sp.x1) / 2) < 0.6) // a coloured pool under each lit swag
      api.lights.push({ x: (sp.x0 + sp.x1) / 2, y: sp.y + sp.sag + 10, r: 58, color: BULBC[Math.round(sp.x0 / 96) % BULBC.length], flicker: 0.15, seed: sp.seed });
    for (const sp of m.spans) for (let k = 0; k < 3; k++) {
      const u = k / 3, x = sp.x0 + (sp.x1 - sp.x0) * u, y = sp.y + sp.sag * 4 * u * (1 - u) + 1.5, s = hash(x, sp.y, 4);
      const dead = sp.dead > 0.5 || m.q(m.qAll, x) > 0.85;
      api.bulbs.push({ x, y, color: BULBC[(Math.round(x / 32) + k) % BULBC.length], seed: s, state: dead ? "dead" : s < 0.1 ? "dead" : s < 0.24 ? "flicker" : "on" });
    }
    // --- litter across the field: confetti, tickets, a popped balloon; grey in the silence. Never on/near pickups.
    const ents = game.entities || [];
    for (let i = 0; i < 700; i++) {
      const x = 40 + hash(i, 51) * (mw - 80), y = 40 + hash(i, 52) * (mh - 80), tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      const tn = game.tiles[ty * game.w + tx]; if (tn !== "grass" && tn !== "silence") continue;
      let near = false; for (const e of ents) if (Math.abs(e.x - x) < 22 && Math.abs(e.y - y) < 22) { near = true; break; }
      if (near) continue;
      const dead = tn === "silence", r = hash(i, 53);
      ctx.globalAlpha = 0.75;
      if (r < 0.7) { ctx.save(); ctx.translate(x, y); ctx.rotate(r * 20); ctx.fillStyle = dead ? "#5a5a62" : CANDY[i % CANDY.length]; ctx.fillRect(-1, -0.5, 2, 1); ctx.restore(); }
      else if (r < 0.88) { ctx.save(); ctx.translate(x, y); ctx.rotate(r * 13); ctx.fillStyle = dead ? "#4a4a50" : (i % 2 ? "#c4204a" : "#e0b030"); ctx.fillRect(-2.8, -1.3, 5.6, 2.6); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(-0.8, -1.3, 0.4, 2.6); ctx.restore(); } // ticket stub
      else if (r < 0.95) { // a burst balloon skin and its string
        const c = dead ? "#55555c" : CANDY[(i * 3) % CANDY.length];
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 1.5); ctx.lineTo(x + 2, y + 1); ctx.lineTo(x + 4, y + 2); ctx.lineTo(x, y + 2); ctx.fill();
        ctx.strokeStyle = "rgba(220,220,220,.4)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.quadraticCurveTo(x - 5, y + 4, x - 9, y + 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  },

  backdrop(ctx, game, t, view, box) {
    const m = model(game);
    bands(ctx, m, box); // dark version; the lit pass happens in glow, clipped to outside the map
  },

  ambient(ctx, game, t, view, box) {
    const m = model(game), reduced = view.reduced;
    // garlands between the trees: pennants flutter east with a wind you can't feel; dead ones hang still
    for (const sp of m.spans) {
      if (sp.x1 < box.x0 || sp.x0 > box.x1 || sp.y < box.y0 - 20 || sp.y > box.y1 + 20) continue;
      const dead = sp.dead > 0.5;
      ctx.strokeStyle = dead ? "#2a2a2e" : "#1a1210"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(sp.x0, sp.y);
      ctx.quadraticCurveTo((sp.x0 + sp.x1) / 2, sp.y + sp.sag * 2, sp.x1, sp.y); ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const u = (k + 0.5) / 6, x = sp.x0 + (sp.x1 - sp.x0) * u, y = sp.y + sp.sag * 4 * u * (1 - u);
        const pd = dead || m.q(m.qAll, x) > 0.85;
        if (pd && hash(x, sp.y, 5) < 0.35) continue; // torn off
        const col = pd ? (hash(x, 6) < 0.5 ? "#4a4a50" : "#5c5c62") : CANDY[(Math.round(x / 16) + k) % CANDY.length];
        const fl = pd || reduced ? 0 : 2.4 + 1.6 * Math.sin(t * 4.2 + sp.seed * 9 + k * 1.3);
        const len = pd ? 5 + hash(x, 7) * 3 : 7;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.lineTo(x + fl, y + len - Math.abs(fl) * 0.3); ctx.fill();
        if (!pd) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(x - 3, y, 6, 0.7); }
      }
    }
    // balloons tied to the trees lean WEST, into the wind, and bob
    for (const a of m.anchors) {
      if (a.x < box.x0 - 30 || a.x > box.x1 + 30 || a.y < box.y0 - 40 || a.y > box.y1 + 10) continue;
      for (let i = 0; i < 3; i++) {
        const sw = reduced ? 0 : Math.sin(t * 0.55 + a.seed * 20 + i) * 2.5, bob = reduced ? 0 : Math.sin(t * 0.9 + a.seed * 30 + i * 2) * 1.5;
        const bx = a.x - 7 - i * 5 + sw, by = a.y - 20 - (i % 2) * 6 + bob;
        ctx.strokeStyle = "rgba(230,220,210,.5)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(a.x - 2, by + 10, bx, by + 5.5); ctx.stroke();
        balloon(ctx, bx, by, CANDY[(Math.floor(a.seed * 40) + i * 2) % CANDY.length], i === 1 && a.seed < 0.5, false);
      }
    }
  },

  glow(ctx, game, t, view, box) {
    const m = model(game), { mw, mh } = m, reduced = view.reduced, p = game.player;
    const outside = box.x0 < 0 || box.y0 < 0 || box.x1 > mw || box.y1 > mh;
    if (outside) {
      ctx.save();
      ctx.beginPath(); ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); ctx.rect(0, 0, mw, mh); ctx.clip("evenodd");
      // the carnival past the walls is lit; the field is not
      ctx.globalAlpha = 0.72; bands(ctx, m, box); ctx.globalAlpha = 1;
      if (box.y0 < 0) {
        // searchlights sweeping the sky (slow; frozen under reduced motion)
        ctx.globalCompositeOperation = "lighter";
        for (const [sx, ph, col] of [[560, 0, "#ffd0f0"], [2050, 2, "#d0f4ff"], [1620, 4, "#fff0c0"]]) {
          if (m.deadT(sx) || sx < box.x0 - 300 || sx > box.x1 + 300) continue;
          const a = -Math.PI / 2 + (reduced ? 0.3 : Math.sin(t * 0.22 + ph) * 0.55);
          ctx.save(); ctx.translate(sx, -6); ctx.rotate(a); ctx.globalAlpha = 0.16;
          ctx.drawImage(sprite("silentBeam" + col, 160, 160, (g, w, h) => { g.drawImage(coneSprite(), 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, w, h); }), 0, -26, 260, 52);
          ctx.restore();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        // wheels
        for (const wh of m.wheels) if (wh.x + wh.r > box.x0 && wh.x - wh.r < box.x1 && wh.y - wh.r < box.y1) drawWheel(ctx, wh, t, reduced, true);
        // the coaster's train, lit, climbing and dropping
        const co = m.coaster;
        if (!co.dead && co.x1 > box.x0 && co.x0 < box.x1) {
          const u = reduced ? 0.4 : (t * 0.07) % 1, span = co.x1 - co.x0;
          for (let k = 0; k < 4; k++) {
            const x = co.x0 + ((u * span + k * 9) % span), y = m.coasterY(x) - 3;
            ctx.fillStyle = CANDY[k]; ctx.fillRect(x - 3.5, y - 3, 7, 4);
            circle(ctx, x, y - 4, 1.2, "#f4efe6"); // arms up. or something like arms
          }
          const hx = co.x0 + ((u * span + 27) % span), hy = m.coasterY(hx) - 3;
          ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.7; ctx.drawImage(glowSprite("#fff3b0"), hx - 10, hy - 10, 20, 20);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        }
        // balloons that got away, drifting west across the sky against the wind
        for (let i = 0; i < 9; i++) {
          const span = mw + SIDE * 2, bx = ((hash(i, 70) * span - (reduced ? 0 : t * (4 + hash(i, 71) * 5))) % span + span) % span - SIDE;
          const by = -60 - hash(i, 72) * 160 + (reduced ? 0 : Math.sin(t * 0.5 + i) * 4);
          if (bx < box.x0 - 10 || bx > box.x1 + 10 || by < box.y0 - 10 || by > 0) continue;
          ctx.strokeStyle = "rgba(240,230,220,.45)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(bx, by + 5); ctx.quadraticCurveTo(bx + 4, by + 12, bx + 2, by + 18); ctx.stroke();
          ctx.globalAlpha = 0.85; balloon(ctx, bx, by, CANDY[i % CANDY.length], i % 3 === 0, false); ctx.globalAlpha = 1;
        }
        // the billboard clown's eyes follow you
        if (m.billEyes) for (const e of m.billEyes) {
          if (e.x < box.x0 - 20 || e.x > box.x1 + 20 || e.y < box.y0 - 10) continue;
          const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
          circle(ctx, e.x + (dx / d) * 2.2, e.y + (dy / d) * 2.6, 1.9, "#120306");
          circle(ctx, e.x + (dx / d) * 2.2 - 0.6, e.y + (dy / d) * 2.6 - 0.6, 0.5, "#ffffff");
        }
      }
      // static bulbs: skyline strings and tent tops, the stall marquees; a few stutter (slowly)
      ctx.globalCompositeOperation = "lighter";
      for (const list of [box.y0 < 0 ? m.skyBulbs : null, box.y1 > mh ? m.lowBulbs : null]) {
        if (!list) continue;
        for (const b of list) {
          if (b.x < box.x0 - 8 || b.x > box.x1 + 8 || b.y < box.y0 - 8 || b.y > box.y1 + 8) continue;
          const on = reduced || b.s > 0.12 || Math.sin(t * 1.1 + b.s * 60) > 0;
          if (!on) continue;
          const r = b.small ? 6 : 9;
          ctx.globalAlpha = 0.55; ctx.drawImage(glowSprite(b.c), b.x - r, b.y - r, r * 2, r * 2);
          ctx.globalAlpha = 0.9; circle(ctx, b.x, b.y, b.small ? 0.9 : 1.2, "#fff6d8");
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }
    // neon on the top wall: one tube in each sign is dying (a slow sag in brightness, never a strobe)
    if (box.y0 < 24) for (const n of NEON) {
      if (m.deadT(n.x) || n.x < box.x0 - 100 || n.x > box.x1 + 100) continue;
      const cw = n.px * 0.84, x0 = n.x - (n.text.length - 1) * cw / 2;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < n.text.length; i++) {
        const ch = n.text[i]; if (ch === " ") continue;
        const spr = neonLetter(ch, n.col, n.px), sw = spr.width, sh = spr.height;
        let a = 0.85 + (reduced ? 0 : 0.1 * Math.sin(t * 1.7 + i));
        if (i === n.bad) a = reduced ? 0.25 : 0.12 + 0.7 * Math.max(0, Math.sin(t * 0.9 + n.x)) ** 3;
        ctx.globalAlpha = a; ctx.drawImage(spr, x0 + i * cw - sw / 2, 10 - sh / 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    // the cutouts: when you're close, something is looking out of the face hole
    for (const cu of m.cutouts) {
      if (!cu.hole || cu.dead) continue;
      const h = cu.hole, dx = p.x - h.x, dy = p.y - 14 - h.y, d = Math.hypot(dx, dy) || 1;
      if (d > 230 || h.x < box.x0 || h.x > box.x1 || h.y < box.y0 || h.y > box.y1) continue;
      const k = clamp((230 - d) / 120, 0, 1), blink = !reduced && ((t + cu.seed * 7) % 5.3) < 0.13;
      if (blink) continue;
      ctx.globalAlpha = 0.85 * k;
      for (const s of [-1, 1]) {
        circle(ctx, h.x + s * 2.2, h.y - 0.6, 1.4, "#f4ecd8");
        circle(ctx, h.x + s * 2.2 + (dx / d) * 0.7, h.y - 0.6 + (dy / d) * 0.7, 0.7, "#200006");
      }
      ctx.fillStyle = "#f4ecd8"; ctx.fillRect(h.x - 2.4, h.y + 2.4, 4.8, 0.8); // teeth
      ctx.globalAlpha = 1;
    }
  },
};
