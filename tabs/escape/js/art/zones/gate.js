/* Stage backdrop for the "gate" zone (The Front Gate, the finale). Owned by ONE agent; see art/zones/README.md.
 *
 * The way out, dressed up like a goodbye party nobody is allowed to leave:
 *  - paint:    a garish painted facade along the north wall (billboards with slogans gone wrong, two clown
 *              murals with too many teeth, a one-way ticket window, a Barker poster), marquee bulbs on every
 *              frame, candy-striped arch pylons with smiling welcome cutouts, the dark road beyond the gate,
 *              pinwheel tent tops along the side and south walls, confetti on the cobbles.
 *  - backdrop: the road out, dark, behind the gate bars (the darkness pass keeps it dark).
 *  - ambient:  bunting fluttering east along the facade, pennants and balloons on the stalls (the balloons
 *              lean west, into the wind), confetti still drifting down.
 *  - glow:     the carnival beyond the walls (skyline, Ferris wheel, chair swing ride, balloons rising against
 *              the wind, pinwheel tents to the south), the arch board with neon COME AGAIN and chasing
 *              marquee bulbs, neon SMILE!, and eyeshine in every painted face that turns to follow you.
 * Void bands are cached to offscreen canvases; per frame is a few blits, two rides and some small sprites.
 */
import { TILE, TILES } from "../../content.js";
import { TAU, PAL, hash, clamp, circle, ellipse, sprite, glowSprite } from "../util.js";

const T = TILE;
const POSTER = "Impact, 'Haettenschweiler', 'Arial Black', 'Helvetica Neue', sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const GOLD = "#e8b84a", GOLD_D = "#8a6420", RED = "#c8102e", RED_D = "#5e0614", CREAM = "#f1e3c0";
const PINK = "#ff3d8b", CYAN = "#4ff0ff", TEAL = "#139c8f", PURP = "#6a1fb0", ORANGE = "#ff8a1e", YEL = "#ffd23a";
const FLAG = [RED, YEL, TEAL, PINK, PURP, ORANGE, CREAM];
const PX = 64, PT = 210, PB = 200; // void bands: side width, top and bottom depth (world px)
const BS = 1.5;                     // band canvas scale (2x made blits ~35ms/frame; 1.5 + tiles is free)

const solidAt = (g, tx, ty) => tx < 0 || ty < 0 || tx >= g.w || ty >= g.h || !!TILES[g.tiles[ty * g.w + tx]].solid;
const tileAt = (g, tx, ty) => g.tiles[ty * g.w + tx];

/* ------------------------------------------------------------ layout (cached per game, never stored on it) */
const LAY = new WeakMap();
function layout(game) {
  let L = LAY.get(game);
  if (L) return L;
  const mw = game.w * T, mh = game.h * T;
  let gx0 = Infinity, gx1 = -Infinity;
  for (const e of game.exits || []) { gx0 = Math.min(gx0, e.x - T / 2); gx1 = Math.max(gx1, e.x + T / 2); }
  if (!isFinite(gx0)) { gx0 = mw / 2 - 3 * T; gx1 = mw / 2 + 3 * T; }
  let wallH = 3 * T;
  for (let ty = 0; ty < game.h; ty++) if (!solidAt(game, 1, ty)) { wallH = ty * T; break; }
  const Lp = [gx0 - 96, gx0 - 2], Rp = [gx1 + 2, gx1 + 96];
  const cx = (gx0 + gx1) / 2;
  L = {
    mw, mh, gx0, gx1, cx, wallH, Lp, Rp,
    facL: [T, Lp[0]], facR: [Rp[1], mw - T],
    board: { x0: Lp[0] + 30, x1: Rp[1] - 30, yb: -30, ye: -78, top: -150 },
    eyes: [], blocks: [], bands: null, neon: null,
  };
  // stall blocks inside the yard: the top-left tile of each booth cluster
  for (let ty = 3; ty < game.h - 1; ty++) for (let tx = 1; tx < game.w - 1; tx++) {
    if (tileAt(game, tx, ty) !== "booth") continue;
    if (tileAt(game, tx - 1, ty) === "booth" || tileAt(game, tx, ty - 1) === "booth") continue;
    let w = 1, h = 1;
    while (tileAt(game, tx + w, ty) === "booth") w++;
    while (ty + h < game.h && tileAt(game, tx, ty + h) === "booth") h++;
    L.blocks.push({ x: tx * T, y: ty * T, w: w * T, h: h * T, seed: hash(tx, ty, 9) });
  }
  LAY.set(game, L);
  return L;
}

/* ------------------------------------------------------------ small painters */
function drips(ctx, x0, x1, y, n, col, seed, maxLen = 9) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed, i, 1) * (x1 - x0), l = 2 + hash(seed, i, 2) * maxLen, w = 0.7 + hash(seed, i, 3) * 1.1;
    ctx.fillRect(x - w / 2, y, w, l); circle(ctx, x, y + l, w * 0.75, col);
  }
}
function text(ctx, s, x, y, font, fill, stroke, sw = 2, align = "center", maxW) {
  ctx.font = font; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  if (stroke) { ctx.lineJoin = "round"; ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(s, x, y, maxW); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y, maxW);
}
function pinwheel(g, x, y, r, c1, c2, n = 12, rot = 0) {
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU, a1 = rot + ((i + 1) / n) * TAU;
    g.fillStyle = i % 2 ? c2 : c1; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, a0, a1); g.closePath(); g.fill();
  }
  const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r);
  gr.addColorStop(0, "rgba(255,240,220,.12)"); gr.addColorStop(1, "rgba(0,0,0,.45)");
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  for (let i = 0; i < n; i++) { const a = rot + ((i + 0.5) / n) * TAU; circle(g, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.14, i % 2 ? c1 : c2); } // scalloped hem
  circle(g, x, y, r * 0.16, GOLD); circle(g, x - r * 0.05, y - r * 0.05, r * 0.06, "#fff3c0");
}
/* a painted clown face; the eye sockets are left black: the eyeshine (glow) lives in them and follows you */
function clownFace(ctx, cx, cy, r, seed, eyes, hair = [ORANGE, "#2fbf3a"]) {
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) circle(ctx, cx + s * r * (0.9 + 0.12 * Math.sin(i * 2)), cy - r * 0.5 + i * r * 0.22, r * 0.3, hair[(i + (s > 0 ? 1 : 0)) % 2]);
  ellipse(ctx, cx, cy, r, r * 1.06, PAL.paint);
  const gr = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.2, cx, cy, r * 1.1);
  gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(120,90,70,.45)");
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 1.06, 0, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) {
    const ex = cx + s * r * 0.38, ey = cy - r * 0.28;
    ctx.fillStyle = "#2a49c8"; ctx.beginPath(); ctx.moveTo(ex, ey - r * 0.5); ctx.lineTo(ex + r * 0.12, ey); ctx.lineTo(ex, ey + r * 0.5); ctx.lineTo(ex - r * 0.12, ey); ctx.fill();
    ellipse(ctx, ex, ey, r * 0.2, r * 0.24, "#fffaf0"); ellipse(ctx, ex, ey, r * 0.15, r * 0.19, "#07020a");
    eyes.push({ x: ex, y: ey, r: r * 0.09 });
    ctx.strokeStyle = "#1a0a08"; ctx.lineWidth = Math.max(0.6, r * 0.04); ctx.beginPath(); ctx.moveTo(ex - s * r * 0.25, ey - r * 0.36); ctx.lineTo(ex + s * r * 0.22, ey - r * 0.28); ctx.stroke(); // angled brows
  }
  // the grin: ear to ear, with far too many teeth
  const mx0 = cx - r * 0.86, mx1 = cx + r * 0.86, my = cy + r * 0.2;
  const mouth = () => { ctx.beginPath(); ctx.moveTo(mx0, my - r * 0.12); ctx.quadraticCurveTo(cx, my + r * 0.25, mx1, my - r * 0.12); ctx.quadraticCurveTo(cx, my + r * 1.0, mx0, my - r * 0.12); ctx.closePath(); };
  ctx.fillStyle = PAL.mouth; mouth(); ctx.fill();
  ctx.save(); mouth(); ctx.clip();
  ctx.fillStyle = PAL.gap; ctx.beginPath(); ctx.moveTo(mx0 + r * 0.1, my); ctx.quadraticCurveTo(cx, my + r * 0.35, mx1 - r * 0.1, my); ctx.quadraticCurveTo(cx, my + r * 0.82, mx0 + r * 0.1, my); ctx.fill();
  const nT = 15;
  ctx.fillStyle = "#f4ecd0";
  for (let i = 0; i < nT; i++) { // top row: little points
    const u = i / (nT - 1), x = mx0 + r * 0.12 + u * (mx1 - mx0 - r * 0.24), yy = my + r * 0.25 * (1 - (2 * u - 1) ** 2) - r * 0.02, w = (mx1 - mx0) / nT * 0.48;
    ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x, yy + r * (0.16 + 0.06 * hash(seed, i))); ctx.fill();
  }
  for (let i = 0; i < nT - 2; i++) { // bottom row, and a second row behind it
    const u = i / (nT - 3), x = mx0 + r * 0.25 + u * (mx1 - mx0 - r * 0.5), yy = my + r * 0.78 * (1 - 0.5 * (2 * u - 1) ** 2) - r * 0.12, w = (mx1 - mx0) / nT * 0.45;
    ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x, yy - r * 0.17); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x - w * 0.6, yy - r * 0.12); ctx.lineTo(x + w * 0.6, yy - r * 0.12); ctx.lineTo(x + w * 0.4, yy - r * 0.26); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.strokeStyle = PAL.mouthDark; ctx.lineWidth = Math.max(0.8, r * 0.06); mouth(); ctx.stroke();
  circle(ctx, cx, cy - r * 0.02, r * 0.17, RED); circle(ctx, cx - r * 0.05, cy - r * 0.07, r * 0.05, "#ffb0b0");
  drips(ctx, mx1 - r * 0.15, mx1 - r * 0.05, my + r * 0.1, 2, PAL.mouth, seed, r * 0.5);
  ctx.strokeStyle = "rgba(40,20,10,.55)"; ctx.lineWidth = 0.6; ctx.beginPath(); // the paint has cracked
  ctx.moveTo(cx + r * 0.3, cy - r * 1.0); ctx.lineTo(cx + r * 0.42, cy - r * 0.6); ctx.lineTo(cx + r * 0.3, cy - r * 0.45); ctx.moveTo(cx + r * 0.42, cy - r * 0.6); ctx.lineTo(cx + r * 0.62, cy - r * 0.55); ctx.stroke();
}
function bulbRow(api, x0, y0, x1, y1, step, colors, seed) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
  for (let i = 0; i <= n; i++) {
    const u = i / n, sd = hash(seed, i, 7);
    api.bulbs.push({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, color: colors[i % colors.length], seed: sd, state: sd < 0.2 ? "dead" : sd < 0.32 ? "flicker" : "on" });
  }
}
function bulbFrame(api, x0, y0, x1, y1, colors, seed, step = 13) {
  bulbRow(api, x0, y0, x1, y0, step, colors, seed);
  bulbRow(api, x0, y0 + step, x0, y1, step, colors, seed + 1);
  bulbRow(api, x1, y0 + step, x1, y1, step, colors, seed + 2);
}
function board(ctx, x0, y0, x1, y1, bg, edge = GOLD) {
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x0 + 2, y0 + 3, x1 - x0, y1 - y0);
  ctx.fillStyle = edge; ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  ctx.fillStyle = bg; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x0, y0, x1 - x0, 2);
}
function stripes(ctx, x0, y0, x1, y1, a, b, w, diag = 0) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = a; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillStyle = b;
  const h = y1 - y0;
  for (let x = x0 - h * Math.abs(diag) - w * 2; x < x1 + w * 2; x += w * 2) {
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + w, y1); ctx.lineTo(x + w + h * diag, y0); ctx.lineTo(x + h * diag, y0); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------ the arch (in-map part goes to paint, the rest to the top band) */
function drawPylon(ctx, x0, x1, yTop, yBase, seed) {
  const w = x1 - x0;
  ctx.fillStyle = "#1a0408"; ctx.fillRect(x0, yTop, w, yBase - yTop);
  stripes(ctx, x0 + 10, yTop + 18, x1 - 10, yBase - 16, "#e9dcc0", "#c8102e", 7, 0.55); // the candy-stripe shaft
  const sh = ctx.createLinearGradient(x0, 0, x1, 0);
  sh.addColorStop(0, "rgba(0,0,0,.55)"); sh.addColorStop(0.35, "rgba(0,0,0,0)"); sh.addColorStop(0.7, "rgba(0,0,0,.1)"); sh.addColorStop(1, "rgba(0,0,0,.6)");
  ctx.fillStyle = sh; ctx.fillRect(x0 + 10, yTop + 18, w - 20, yBase - yTop - 34);
  ctx.fillStyle = GOLD; ctx.fillRect(x0 + 4, yTop + 10, 6, yBase - yTop - 22); ctx.fillRect(x1 - 10, yTop + 10, 6, yBase - yTop - 22);
  ctx.fillStyle = GOLD_D; ctx.fillRect(x0 + 8, yTop + 10, 2, yBase - yTop - 22); ctx.fillRect(x1 - 6, yTop + 10, 2, yBase - yTop - 22);
  // capital and finial
  ctx.fillStyle = GOLD; ctx.fillRect(x0, yTop + 4, w, 10); ctx.fillStyle = RED_D; ctx.fillRect(x0 + 3, yTop + 7, w - 6, 4);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? CREAM : RED; ctx.beginPath(); const sx = x0 + (i / 6) * w; ctx.moveTo(sx, yTop + 14); ctx.lineTo(sx + w / 6, yTop + 14); ctx.arc(sx + w / 12, yTop + 14, w / 12, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = PURP; ctx.beginPath(); ctx.moveTo(x0 + 8, yTop + 4); ctx.quadraticCurveTo(x0 + w / 2, yTop - 40, x1 - 8, yTop + 4); ctx.fill(); // onion dome
  ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + 8 + i * (w - 16) / 4, yTop + 4); ctx.quadraticCurveTo(x0 + w / 2, yTop - 24, x0 + w / 2, yTop - 18); ctx.stroke(); }
  ctx.fillStyle = GOLD; ctx.fillRect(x0 + w / 2 - 1.2, yTop - 40, 2.4, 22); circle(ctx, x0 + w / 2, yTop - 40, 4, GOLD);
  // plinth
  ctx.fillStyle = "#2a0a10"; ctx.fillRect(x0 - 2, yBase - 16, w + 4, 16);
  ctx.fillStyle = GOLD; ctx.fillRect(x0 - 2, yBase - 17, w + 4, 2.4);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? TEAL : PINK; ctx.beginPath(); const dx = x0 + 12 + i * (w - 24) / 3; ctx.moveTo(dx, yBase - 13); ctx.lineTo(dx + 5, yBase - 8); ctx.lineTo(dx, yBase - 3); ctx.lineTo(dx - 5, yBase - 8); ctx.fill(); }
}
function welcomeCutout(ctx, cx, yb, seed, eyes, flip) {
  // a plywood clown, arms flung wide: WELCOME! Its smile was painted on by someone in a hurry.
  ctx.save(); ctx.translate(cx, yb); if (flip) ctx.scale(-1, 1);
  ellipse(ctx, 0, 0, 22, 4, "rgba(0,0,0,.5)");
  ctx.fillStyle = "#4a3420"; ctx.fillRect(-2, -14, 4, 14); // prop stake
  ctx.fillStyle = "#c8102e"; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, -14); ctx.lineTo(9, -44); ctx.lineTo(-9, -44); ctx.fill();
  for (let i = 0; i < 3; i++) circle(ctx, 0, -20 - i * 8, 2.2, YEL);
  ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(-24, -52); ctx.moveTo(8, -40); ctx.lineTo(25, -55); ctx.stroke();
  circle(ctx, -25, -53, 3.6, "#f4efe6"); circle(ctx, 26, -56, 3.6, "#f4efe6");
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI; circle(ctx, Math.cos(a) * 10, -44 - Math.sin(a) * 2, 3, i % 2 ? "#fff" : PINK); } // ruff
  ctx.restore();
  clownFace(ctx, cx, yb - 56, 10, seed, eyes, flip ? ["#2fbf3a", PURP] : [ORANGE, PURP]);
  ctx.fillStyle = YEL; ctx.beginPath(); ctx.moveTo(cx - 9, yb - 64); ctx.lineTo(cx + (flip ? -4 : 4), yb - 82); ctx.lineTo(cx + 9, yb - 64); ctx.fill(); circle(ctx, cx + (flip ? -4 : 4), yb - 82, 2.2, RED);
}
function drawBoardShape(ctx, B, inset = 0) {
  const { x0, x1, yb, ye, top } = B, cx = (x0 + x1) / 2;
  ctx.beginPath();
  ctx.moveTo(x0 + inset, yb - inset); ctx.lineTo(x0 + inset, ye);
  ctx.bezierCurveTo(x0 + inset, top + inset * 1.2, x1 - inset, top + inset * 1.2, x1 - inset, ye);
  ctx.lineTo(x1 - inset, yb - inset); ctx.lineTo(cx + 26, yb - inset); ctx.lineTo(cx, yb + 6 - inset); ctx.lineTo(cx - 26, yb - inset); ctx.closePath();
}
function drawBoard(ctx, L, eyes) {
  const B = L.board, cx = (B.x0 + B.x1) / 2;
  ctx.save(); ctx.translate(3, 4); drawBoardShape(ctx, B); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fill(); ctx.restore();
  drawBoardShape(ctx, B); ctx.fillStyle = GOLD; ctx.fill();
  drawBoardShape(ctx, B, 4); ctx.fillStyle = "#8a0a22"; ctx.fill();
  ctx.save(); drawBoardShape(ctx, B, 4); ctx.clip();
  for (let i = 0; i < 24; i++) { // sunburst
    const a0 = Math.PI + (i / 24) * Math.PI, a1 = a0 + Math.PI / 24;
    ctx.fillStyle = i % 2 ? "#b8122c" : "#d8501a"; ctx.beginPath(); ctx.moveTo(cx, B.yb + 10); ctx.arc(cx, B.yb + 10, 300, a0, a1); ctx.fill();
  }
  const vg = ctx.createLinearGradient(0, B.top, 0, B.yb); vg.addColorStop(0, "rgba(40,0,20,.1)"); vg.addColorStop(0.6, "rgba(40,0,20,.35)"); vg.addColorStop(1, "rgba(30,0,10,.75)");
  ctx.fillStyle = vg; ctx.fillRect(B.x0, B.top, B.x1 - B.x0, B.yb - B.top + 10);
  ctx.restore();
  drawBoardShape(ctx, B, 9); ctx.strokeStyle = CREAM; ctx.lineWidth = 1.4; ctx.stroke();
  // the face at the apex, beaming down at everyone who leaves
  circle(ctx, cx, B.top + 40, 30, YEL);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.fillStyle = i % 2 ? PINK : CYAN; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 29, B.top + 40 + Math.sin(a) * 29, 4, 0, TAU); ctx.fill(); }
  clownFace(ctx, cx, B.top + 40, 22, 401, eyes);
  text(ctx, "~ YOU ALWAYS DO ~", cx, B.yb - 26, `italic bold 9px ${SERIF}`, CREAM, "#3a0010", 2.4);
  // painted COME AGAIN under the neon (the neon is drawn by glow; when a letter dies the paint still shows)
  text(ctx, "COME AGAIN", cx, B.yb - 5, `22px ${POSTER}`, "#3a0614", GOLD, 3);
  // where the bulbs go
  const pts = [];
  const N = 46;
  for (let i = 0; i <= N; i++) { // along the bezier crown
    const u = i / N, x0 = B.x0 + 1, x1 = B.x1 - 1, y0 = B.ye, yt = B.top + 1.5;
    const bx = (1 - u) ** 3 * x0 + 3 * (1 - u) ** 2 * u * x0 + 3 * (1 - u) * u * u * x1 + u ** 3 * x1;
    const by = (1 - u) ** 3 * y0 + 3 * (1 - u) ** 2 * u * yt + 3 * (1 - u) * u * u * yt + u ** 3 * y0;
    pts.push([bx, by]);
  }
  for (let y = B.ye + 10; y <= B.yb - 2; y += 10) { pts.push([B.x0 + 1, y]); pts.push([B.x1 - 1, y]); }
  return pts;
}

/* ------------------------------------------------------------ the north facade */
function facadeBase(ctx, x0, x1, H) {
  for (let x = x0, i = 0; x < x1; x += 14, i++) { ctx.fillStyle = i % 2 ? "#6a0a1a" : "#7e1226"; ctx.fillRect(x, 0, Math.min(14, x1 - x), H); }
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(0,0,0,.45)"); g.addColorStop(0.5, "rgba(0,0,0,.1)"); g.addColorStop(1, "rgba(0,0,0,.3)");
  ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H);
  ctx.fillStyle = GOLD; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = GOLD_D; ctx.fillRect(x0, 5, x1 - x0, 1.5);
  for (let x = x0, i = 0; x < x1; x += 12, i++) { ctx.fillStyle = i % 2 ? CREAM : RED; ctx.beginPath(); ctx.moveTo(x, 6.5); ctx.lineTo(x + 12, 6.5); ctx.arc(x + 6, 6.5, 6, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = "#24100a"; ctx.fillRect(x0, H - 14, x1 - x0, 14); ctx.fillStyle = GOLD; ctx.fillRect(x0, H - 15, x1 - x0, 1.6);
  for (let x = x0 + 8; x < x1 - 4; x += 22) { ctx.fillStyle = "#3a1a10"; ctx.fillRect(x, H - 11, 14, 8); ctx.fillStyle = "rgba(255,210,58,.25)"; ctx.fillRect(x, H - 11, 14, 1); }
}
function pilaster(ctx, x, H) {
  stripes(ctx, x - 4, 10, x + 4, H - 15, CREAM, RED, 4, 0.8);
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 1.5, 10, 2.5, H - 25);
  circle(ctx, x, 11, 4.5, GOLD); circle(ctx, x - 1, 10, 1.4, "#fff3c0");
}
const PANELS = {
  thanks(ctx, x0, x1, api, s) {
    board(ctx, x0, 18, x1, 72, CREAM);
    stripes(ctx, x0, 18, x1, 26, RED, CREAM, 6);
    const cx = (x0 + x1) / 2;
    text(ctx, "THANK YOU", cx, 46, `20px ${POSTER}`, RED, RED_D, 1.5, "center", x1 - x0 - 12);
    text(ctx, "FOR STAYING!", cx, 66, `16px ${POSTER}`, "#1a6cc8", "#0a2a50", 1.2, "center", x1 - x0 - 12);
    drips(ctx, cx - 50, cx + 50, 47, 7, RED, s, 10);
    ctx.fillStyle = RED; ctx.font = `bold 8px ${SERIF}`; ctx.textAlign = "right"; ctx.fillText("forever", x1 - 6, 71); // scrawled under it
    bulbFrame(api, x0 - 2, 16, x1 + 2, 68, [YEL, "#fff3b0"], s);
    api.lights.push({ x: cx, y: 86, r: 80, color: "#ffd27a", flicker: 0.1, seed: s });
  },
  mural(ctx, x0, x1, api, s, eyes) {
    const cx = (x0 + x1) / 2, cy = 46;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 10, x1 - x0, 70); ctx.clip();
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; ctx.fillStyle = i % 2 ? YEL : ORANGE; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 120, a, a + TAU / 20); ctx.fill(); }
    ctx.fillStyle = "rgba(60,0,20,.35)"; ctx.fillRect(x0, 10, x1 - x0, 70);
    ctx.restore();
    clownFace(ctx, cx, cy, 30, s, eyes);
    drips(ctx, x0 + 10, x1 - 10, 76, 9, "#7a0a14", s + 3, 6);
    text(ctx, "HA HA HA", x0 + 26, 24, `9px ${POSTER}`, CREAM, RED_D, 2);
    text(ctx, "HA HA", x1 - 22, 76, `9px ${POSTER}`, CREAM, RED_D, 2);
    api.lights.push({ x: cx, y: 84, r: 90, color: "#ff7a3a", flicker: 0.14, seed: s });
  },
  tickets(ctx, x0, x1, api, s, eyes) {
    const cx = (x0 + x1) / 2;
    board(ctx, x0 + 6, 14, x1 - 6, 28, RED);
    text(ctx, "TICKETS", cx, 26, `12px ${POSTER}`, YEL, RED_D, 2);
    ctx.fillStyle = "#3a1408"; ctx.fillRect(x0 + 14, 30, x1 - x0 - 28, 46);
    ctx.fillStyle = "#07030a"; ctx.fillRect(x0 + 20, 34, x1 - x0 - 40, 32);
    // someone is still at the window
    ctx.fillStyle = "#16080c"; ctx.beginPath(); ctx.ellipse(cx, 46, 8, 9, 0, 0, TAU); ctx.fill(); ctx.fillRect(cx - 13, 54, 26, 12);
    eyes.push({ x: cx - 3, y: 45, r: 1.1 }, { x: cx + 3, y: 45, r: 1.1 });
    ctx.strokeStyle = GOLD_D; ctx.lineWidth = 1; for (let x = x0 + 24; x < x1 - 20; x += 6) { ctx.beginPath(); ctx.moveTo(x, 34); ctx.lineTo(x, 66); ctx.stroke(); }
    ctx.fillStyle = GOLD; ctx.fillRect(x0 + 16, 66, x1 - x0 - 32, 3);
    text(ctx, "ONE WAY ONLY", cx, 77, `bold 7px ${SERIF}`, CREAM, null);
    bulbRow(api, x0 + 8, 12, x1 - 8, 12, 12, [PINK, YEL], s);
    api.lights.push({ x: cx, y: 86, r: 70, color: "#ff5aa0", flicker: 0.12, seed: s });
  },
  barker(ctx, x0, x1, api, s) {
    const cx = (x0 + x1) / 2;
    board(ctx, x0, 16, x1, 76, PURP);
    stripes(ctx, x0, 16, x1, 76, "rgba(0,0,0,0)", "rgba(0,0,0,.15)", 5, 0.3);
    ctx.fillStyle = "#0e0410"; ctx.fillRect(cx - 13, 20, 26, 18); ctx.fillRect(cx - 20, 37, 40, 4); // the hat
    ctx.fillStyle = RED; ctx.fillRect(cx - 13, 32, 26, 3);
    ctx.fillStyle = PAL.paint; ctx.beginPath(); ctx.ellipse(cx, 49, 9, 8, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = PAL.mouth; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, 48, 7, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = YEL; ctx.beginPath(); ctx.moveTo(cx + 6, 50); ctx.lineTo(cx + 26, 40); ctx.lineTo(cx + 26, 60); ctx.closePath(); ctx.fill(); // megaphone
    circle(ctx, cx - 3, 47, 1.2, "#000"); circle(ctx, cx + 3, 47, 1.2, "#000");
    text(ctx, "HEAR HIM CALL", cx, 66, `10px ${POSTER}`, YEL, "#2a0040", 2, "center", x1 - x0 - 8);
    text(ctx, "YOUR NAME", cx, 75, `8px ${POSTER}`, CREAM, "#2a0040", 2);
    for (let i = 0; i < 5; i++) { const sx = x0 + 6 + hash(s, i) * 20, sy = 22 + hash(s, i, 2) * 30; ctx.fillStyle = YEL; ctx.font = `bold 6px ${SERIF}`; ctx.textAlign = "center"; ctx.fillText("★", sx, sy); }
    bulbFrame(api, x0 - 2, 14, x1 + 2, 74, [YEL, PINK, "#fff3b0"], s);
    api.lights.push({ x: cx, y: 86, r: 80, color: "#c07aff", flicker: 0.1, seed: s });
  },
  refunds(ctx, x0, x1, api, s) {
    const cx = (x0 + x1) / 2;
    board(ctx, x0, 16, x1, 76, "#e6d6a8");
    stripes(ctx, x0, 16, x1, 22, TEAL, CREAM, 5);
    text(ctx, "NO REFUNDS", cx, 37, `13px ${POSTER}`, "#163a78", null, 0, "center", x1 - x0 - 10);
    text(ctx, "NO RETURNS", cx, 53, `13px ${POSTER}`, "#163a78", null, 0, "center", x1 - x0 - 10);
    text(ctx, "NO LEAVING", cx, 70, `14px ${POSTER}`, RED, RED_D, 1, "center", x1 - x0 - 10);
    drips(ctx, cx - 40, cx + 40, 70, 8, RED, s, 9);
    bulbFrame(api, x0 - 2, 14, x1 + 2, 74, [CYAN, YEL], s);
    api.lights.push({ x: cx, y: 86, r: 80, color: "#7af0ff", flicker: 0.1, seed: s });
  },
  moon(ctx, x0, x1, api, s, eyes) {
    const cx = (x0 + x1) / 2, cy = 50;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 10, x1 - x0, 70); ctx.clip();
    ctx.fillStyle = "#14093a"; ctx.fillRect(x0, 10, x1 - x0, 70);
    for (let i = 0; i < 26; i++) circle(ctx, x0 + hash(s, i) * (x1 - x0), 12 + hash(s, i, 3) * 66, 0.5 + hash(s, i, 4) * 1.2, i % 3 ? "#fff3b0" : PINK);
    ctx.restore();
    clownFace(ctx, cx, cy, 26, s, eyes, [CYAN, PINK]);
    text(ctx, "SMILE!", cx, 22, `13px ${POSTER}`, "#2a0a3a", CYAN, 1.5); // the neon tube sits on this (glow)
    drips(ctx, x0 + 20, x1 - 20, 78, 7, "#a0102a", s, 5);
    api.lights.push({ x: cx, y: 84, r: 90, color: "#4ff0ff", flicker: 0.1, seed: s });
  },
  exit(ctx, x0, x1, api, s) {
    const cx = (x0 + x1) / 2;
    board(ctx, x0 + 10, 18, x1 - 10, 46, "#1a1a1a", "#555");
    text(ctx, "EXIT", cx, 41, `20px ${POSTER}`, "#3a0a0a", RED, 1.2);
    // the arrow points back into the park
    ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(cx - 4, 50); ctx.lineTo(cx + 4, 50); ctx.lineTo(cx + 4, 62); ctx.lineTo(cx + 10, 62); ctx.lineTo(cx, 74); ctx.lineTo(cx - 10, 62); ctx.lineTo(cx - 4, 62); ctx.fill();
    ctx.save(); ctx.translate(cx + 24, 62); ctx.rotate(-0.18); text(ctx, "this way :)", 0, 0, `italic bold 8px ${SERIF}`, CREAM, null); ctx.restore();
    ctx.strokeStyle = "rgba(240,230,210,.8)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + 14, 22); ctx.lineTo(x1 - 14, 44); ctx.stroke(); // someone crossed it out
    api.lights.push({ x: cx, y: 86, r: 70, color: "#ff3a3a", flicker: 0.16, seed: s });
  },
  again(ctx, x0, x1, api, s) {
    const cx = (x0 + x1) / 2;
    board(ctx, x0, 16, x1, 76, "#1f6f78");
    stripes(ctx, x0, 70, x1, 76, YEL, RED, 5);
    text(ctx, "COME AGAIN!", cx, 38, `17px ${POSTER}`, YEL, "#0a2a30", 2, "center", x1 - x0 - 8);
    ctx.globalAlpha = 0.75; text(ctx, "and again", cx, 52, `italic 10px ${SERIF}`, CREAM, null);
    ctx.globalAlpha = 0.5; text(ctx, "and again", cx, 62, `italic 8px ${SERIF}`, CREAM, null);
    ctx.globalAlpha = 0.3; text(ctx, "and again", cx, 69, `italic 6px ${SERIF}`, CREAM, null); ctx.globalAlpha = 1;
    bulbFrame(api, x0 - 2, 14, x1 + 2, 74, [YEL, CREAM, PINK], s);
    api.lights.push({ x: cx, y: 86, r: 80, color: "#ffd23a", flicker: 0.1, seed: s });
  },
};
function facade(ctx, L, api, x0, x1, list, seed) {
  const H = L.wallH;
  facadeBase(ctx, x0, x1, H);
  const span = x1 - x0, n = list.length, slot = span / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * slot + 10, b = x0 + (i + 1) * slot - 10;
    PANELS[list[i]](ctx, a, b, api, seed + i * 17, L.eyes);
    if (i > 0) pilaster(ctx, x0 + i * slot, H);
  }
  pilaster(ctx, x0 + 3, H); pilaster(ctx, x1 - 3, H);
}

/* ------------------------------------------------------------ walls: pinwheel tent tops seen from above */
function wallTents(ctx, L, game, api) {
  const COLS = [[RED, CREAM], [TEAL, CREAM], [PURP, YEL], [ORANGE, CREAM], [PINK, "#fff0f6"]];
  const draw = (x, y, k) => {
    const sd = hash(x, y, 3), [a, b] = COLS[(k + (sd * 5 | 0)) % COLS.length];
    if (sd < 0.16) { // a face plate staring up out of the tents
      circle(ctx, x, y, 14, GOLD);
      clownFace(ctx, x, y, 11, k + 50, L.eyes, [a, b]);
      return;
    }
    pinwheel(ctx, x, y, 14.5, a, b, 10, sd * TAU);
  };
  const H = game.h, W = game.w;
  ctx.save();
  // sides: one column of tents, from under the facade to the south wall
  for (let ty = Math.round(L.wallH / T); ty < H; ty++) { draw(T / 2, ty * T + T / 2, ty); draw(L.mw - T / 2, ty * T + T / 2, ty + 2); }
  // south wall: a row of tents, bunting along its lip
  for (let tx = 1; tx < W - 1; tx++) draw(tx * T + T / 2, L.mh - T / 2, tx);
  ctx.restore();
  for (let tx = 1; tx < W - 1; tx += 4) bulbRow(api, tx * T, L.mh - T + 4, Math.min(W - 1, tx + 4) * T, L.mh - T + 4, 16, [YEL, PINK, CYAN, "#7dff4a"], tx);
}

/* ------------------------------------------------------------ the void bands (cached; drawn in glow) */
function catenary(g, pts, sag, col, bulbCols, every = 10) {
  g.strokeStyle = col; g.lineWidth = 0.7;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); g.stroke();
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / every));
    for (let k = 1; k < n; k++) {
      const u = k / n, x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * ((y0 + y1) / 2 + sag) + u * u * y1;
      const c = bulbCols[(i * 7 + k) % bulbCols.length];
      if (hash(i, k, 31) < 0.2) { circle(g, x, y + 1.2, 1.1, "#2a2020"); continue; }
      g.globalAlpha = 0.35; g.drawImage(glowSprite(c), x - 6, y - 6 + 1.2, 12, 12); g.globalAlpha = 1;
      circle(g, x, y + 1.2, 1.1, c);
    }
  }
}
function tentPeak(g, x, w, peak, base, a, b, seed) {
  g.save(); g.beginPath(); g.moveTo(x - w / 2, base); g.quadraticCurveTo(x - w * 0.18, base - (base - peak) * 0.55, x, peak); g.quadraticCurveTo(x + w * 0.18, base - (base - peak) * 0.55, x + w / 2, base); g.closePath(); g.clip();
  const n = 8; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.beginPath(); g.moveTo(x, peak); g.lineTo(x - w / 2 + (i / n) * w, base); g.lineTo(x - w / 2 + ((i + 1) / n) * w, base); g.fill(); }
  const sh = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); sh.addColorStop(0, "rgba(0,0,0,.5)"); sh.addColorStop(0.45, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = sh; g.fillRect(x - w / 2, peak, w, base - peak);
  const vg = g.createLinearGradient(0, peak, 0, base); vg.addColorStop(0, "rgba(10,0,20,.15)"); vg.addColorStop(1, "rgba(10,0,20,.5)");
  g.fillStyle = vg; g.fillRect(x - w / 2, peak, w, base - peak);
  g.restore();
  g.strokeStyle = "#1a0a10"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, peak); g.lineTo(x, peak - 10); g.stroke();
  g.fillStyle = FLAG[(seed * 7 | 0) % FLAG.length]; g.beginPath(); g.moveTo(x, peak - 10); g.lineTo(x + 8, peak - 7.5); g.lineTo(x, peak - 5); g.fill();
}
function buildTop(L) {
  const W = L.mw + 2 * PX;
  const c = document.createElement("canvas"); c.width = Math.ceil(W * BS); c.height = Math.ceil(PT * BS);
  const g = c.getContext("2d"); g.setTransform(BS, 0, 0, BS, PX * BS, PT * BS);
  const x0 = -PX, x1 = L.mw + PX;
  const sky = g.createLinearGradient(0, -PT, 0, 0);
  sky.addColorStop(0, "#040208"); sky.addColorStop(0.45, "#12061c"); sky.addColorStop(0.8, "#3a0a2c"); sky.addColorStop(1, "#5a1430");
  g.fillStyle = sky; g.fillRect(x0, -PT, W, PT);
  for (let i = 0; i < 4; i++) { // searchlights raking the low cloud, slowly (static here: they never move, which is worse)
    const bx = 120 + i * 520, a = -1.9 + i * 0.45;
    g.save(); g.translate(bx, 0); g.rotate(a); const bg = g.createLinearGradient(0, 0, 260, 0); bg.addColorStop(0, "rgba(255,240,210,.14)"); bg.addColorStop(1, "rgba(255,240,210,0)");
    g.fillStyle = bg; g.beginPath(); g.moveTo(0, 0); g.lineTo(260, -26); g.lineTo(260, 26); g.fill(); g.restore();
  }
  g.fillStyle = "#170820"; g.beginPath(); g.moveTo(x0, -40); // the hill everything stands on
  for (let x = x0; x <= x1; x += 40) g.lineTo(x, -42 - 14 * Math.sin(x * 0.004) - 8 * Math.sin(x * 0.013 + 1));
  g.lineTo(x1, 0); g.lineTo(x0, 0); g.fill();
  // skyline rides (static parts; the wheels turn in glow)
  const coaster = (sx, ex, peak) => {
    g.strokeStyle = "#2a1030"; g.lineWidth = 1.2;
    for (let x = sx; x <= ex; x += 12) { const y = trackY(x); g.beginPath(); g.moveTo(x, y); g.lineTo(x, 0); g.stroke(); }
    g.strokeStyle = "#4a1c3a"; g.lineWidth = 2.4; g.beginPath(); for (let x = sx; x <= ex; x += 4) { const y = trackY(x); x === sx ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    for (let x = sx; x <= ex; x += 10) { const y = trackY(x); g.globalAlpha = 0.4; g.drawImage(glowSprite(YEL), x - 5, y - 6, 10, 10); g.globalAlpha = 1; circle(g, x, y - 1, 0.9, "#fff0a0"); }
    function trackY(x) { const u = (x - sx) / (ex - sx); return -20 - (peak - 20) * Math.max(0, Math.sin(u * Math.PI * 1.5)) * (u < 0.66 ? 1 : 0.55) - 10 * Math.sin(u * 14); }
  };
  coaster(1150, 1400, 130);
  // helter skelter
  { const hx = 640, top = -150; g.fillStyle = "#3a1830"; g.beginPath(); g.moveTo(hx - 14, 0); g.lineTo(hx - 7, top + 10); g.lineTo(hx + 7, top + 10); g.lineTo(hx + 14, 0); g.fill();
    for (let i = 0; i < 9; i++) { const y = top + 18 + i * 15; g.strokeStyle = i % 2 ? YEL : RED; g.lineWidth = 3; g.beginPath(); g.moveTo(hx - 15 - i * 0.6, y + 6); g.lineTo(hx + 15 + i * 0.6, y); g.stroke(); }
    g.fillStyle = RED; g.beginPath(); g.moveTo(hx - 12, top + 10); g.lineTo(hx, top - 12); g.lineTo(hx + 12, top + 10); g.fill(); circle(g, hx, top - 13, 2, YEL); }
  // Ferris wheel A-frame and the swing ride's mast
  const FW = L.ferris, SW = L.swing;
  g.strokeStyle = "#2c1238"; g.lineWidth = 3; g.beginPath(); g.moveTo(FW.x - 40, 0); g.lineTo(FW.x, FW.y); g.lineTo(FW.x + 40, 0); g.stroke();
  g.fillStyle = "#2c1238"; g.fillRect(SW.x - 3, SW.y, 6, -SW.y);
  // big tops on the horizon
  tentPeak(g, 140, 220, -118, -6, "#8a1020", "#c8b890", 0.1);
  tentPeak(g, 1720, 240, -128, -6, "#6a1a8a", "#e0c070", 0.5);
  // a crowd of stall roofs along the horizon, strung with lights
  const peaks = [];
  for (let x = x0 + 20, i = 0; x < x1; x += 46 + hash(i, 1) * 28, i++) {
    if (x > L.Lp[0] - 30 && x < L.Rp[1] + 30) continue; // the arch stands here
    const w = 40 + hash(i, 2) * 26, pk = -30 - hash(i, 3) * 26;
    const cs = [[RED, CREAM], [TEAL, CREAM], [PURP, YEL], [ORANGE, "#2a0a10"], [PINK, CREAM], ["#1a6cc8", YEL]][(hash(i, 4) * 6) | 0];
    tentPeak(g, x, w, pk, 2, cs[0], cs[1], hash(i, 5));
    peaks.push([x, pk - 10]);
  }
  for (let i = 0; i < peaks.length - 1; i++) if (peaks[i + 1][0] - peaks[i][0] < 110) catenary(g, [peaks[i], peaks[i + 1]], 9, "#140a10", [YEL, PINK, CYAN, "#7dff4a", ORANGE]);
  // the arch's upper storeys
  g.save(); g.beginPath(); g.rect(x0, -PT, W, PT); g.clip();
  drawPylon(g, L.Lp[0], L.Lp[1], -76, 96, 1); drawPylon(g, L.Rp[0], L.Rp[1], -76, 96, 2);
  L.boardEyes = []; L.boardBulbs = drawBoard(g, L, L.boardEyes);
  g.restore();
  // the gap under the board is the road out: leave it for the backdrop
  g.clearRect(L.Lp[1], L.board.yb + 1, L.Rp[0] - L.Lp[1], -L.board.yb);
  { const ga = g.createLinearGradient(0, -PT, 0, -60); ga.addColorStop(0, "rgba(4,2,8,.7)"); ga.addColorStop(1, "rgba(4,2,8,0)"); g.fillStyle = ga; g.fillRect(x0, -PT, W, PT - 60); }
  return { c, x0, y0: -PT, w: W, h: PT };
}
function buildBottom(L) {
  const W = L.mw + 2 * PX;
  const c = document.createElement("canvas"); c.width = Math.ceil(W * BS); c.height = Math.ceil(PB * BS);
  const g = c.getContext("2d"); g.setTransform(BS, 0, 0, BS, PX * BS, -L.mh * BS);
  const y0 = L.mh;
  g.fillStyle = "#0e070c"; g.fillRect(-PX, y0, W, PB);
  for (let i = 0; i < 400; i++) circle(g, -PX + hash(i, 1, 5) * W, y0 + hash(i, 2, 5) * PB, 1.6, hash(i, 3, 5) < 0.5 ? "#1a1014" : "#22161a");
  // the midway you came through, seen from above: tent after tent after tent
  const COLS = [[RED, CREAM], [TEAL, CREAM], [PURP, YEL], [ORANGE, CREAM], [PINK, "#fff0f6"], ["#1a6cc8", YEL]];
  const tops = [];
  for (let row = 0; row < 2; row++) for (let x = -PX + 30 + row * 60, i = 0; x < L.mw + PX; x += 110 + hash(i, row) * 40, i++) {
    const y = y0 + 52 + row * 92 + hash(i, row, 2) * 14, r = 34 + hash(i, row, 3) * 20, cs = COLS[(hash(i, row, 4) * COLS.length) | 0];
    g.globalAlpha = 0.5; g.drawImage(glowSprite(YEL), x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6); g.globalAlpha = 1;
    pinwheel(g, x, y, r, cs[0], cs[1], 14, hash(i, row, 6));
    if (row === 0) tops.push([x, y]);
  }
  for (let i = 0; i < tops.length - 1; i++) catenary(g, [tops[i], tops[i + 1]], 12, "#1a0a10", [YEL, PINK, CYAN, ORANGE], 9);
  const fg = g.createLinearGradient(0, y0, 0, y0 + PB); fg.addColorStop(0, "rgba(4,2,8,.25)"); fg.addColorStop(0.35, "rgba(4,2,8,.35)"); fg.addColorStop(1, "rgba(4,2,8,.9)");
  g.fillStyle = fg; g.fillRect(-PX, y0, W, PB);
  const sh = g.createLinearGradient(0, y0, 0, y0 + 14); sh.addColorStop(0, "rgba(0,0,0,.7)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.fillRect(-PX, y0, W, 14);
  return { c, x0: -PX, y0, w: W, h: PB };
}
function buildSide(L, right) {
  const c = document.createElement("canvas"); c.width = Math.ceil(PX * BS); c.height = Math.ceil(L.mh * BS);
  const g = c.getContext("2d"); const bx = right ? L.mw : -PX; g.setTransform(BS, 0, 0, BS, -bx * BS, 0);
  g.fillStyle = "#0e070c"; g.fillRect(bx, 0, PX, L.mh);
  const COLS = [[RED, CREAM], [TEAL, CREAM], [PURP, YEL], [ORANGE, CREAM], [PINK, "#fff0f6"]];
  const cxs = right ? L.mw + 34 : -34;
  const tops = [];
  for (let y = 30, i = 0; y < L.mh + 40; y += 88, i++) { const cs = COLS[(i + (right ? 2 : 0)) % COLS.length]; pinwheel(g, cxs + (i % 2 ? 6 : -6) * (right ? 1 : -1), y, 32, cs[0], cs[1], 12, i); tops.push([cxs, y]); }
  catenary(g, tops, 10, "#1a0a10", [YEL, PINK, CYAN], 10);
  const fg = g.createLinearGradient(right ? L.mw : 0, 0, right ? L.mw + PX : -PX, 0); fg.addColorStop(0, "rgba(4,2,8,.3)"); fg.addColorStop(1, "rgba(4,2,8,.9)");
  g.fillStyle = fg; g.fillRect(bx, 0, PX, L.mh);
  return { c, x0: bx, y0: 0, w: PX, h: L.mh };
}
function bands(L) {
  if (!L.bands) {
    L.ferris = { x: 420, y: -104, r: 82 };
    L.swing = { x: 1560, y: -118 };
    L.bands = [buildTop(L), buildBottom(L), buildSide(L, false), buildSide(L, true)].flatMap(tile);
  }
  return L.bands;
}
/* One huge band canvas (~4000px) drops off the GPU path and costs ~35ms/frame to blit, so cut each band
 * into tiles no bigger than TS canvas px on a side and blit only the visible ones. */
const TS = 512;
function tile(b) {
  const out = [], cw = b.c.width, ch = b.c.height;
  for (let sy = 0; sy < ch; sy += TS) for (let sx = 0; sx < cw; sx += TS) {
    const w = Math.min(TS, cw - sx), h = Math.min(TS, ch - sy);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(b.c, sx, sy, w, h, 0, 0, w, h);
    const t = { c, x0: b.x0 + sx / BS, y0: b.y0 + sy / BS, w: w / BS, h: h / BS };
    out.push(t);
  }
  return out;
}
function blit(ctx, b, box) {
  const ix0 = Math.max(box.x0, b.x0), iy0 = Math.max(box.y0, b.y0), ix1 = Math.min(box.x1, b.x0 + b.w), iy1 = Math.min(box.y1, b.y0 + b.h);
  if (ix1 <= ix0 || iy1 <= iy0) return;
  ctx.drawImage(b.c, (ix0 - b.x0) * BS, (iy0 - b.y0) * BS, (ix1 - ix0) * BS, (iy1 - iy0) * BS, ix0, iy0, ix1 - ix0, iy1 - iy0);
}

/* ------------------------------------------------------------ cached animated sprites */
const NS = 3;
const neonCache = new Map();
function neonBuild(ch, px, color) {
  const key = ch + px + color;
  let s = neonCache.get(key);
  if (s) return s;
  const m = document.createElement("canvas").getContext("2d");
  m.font = `${px}px ${POSTER}`;
  const w = Math.max(2, m.measureText(ch).width), pad = 8;
  const c = document.createElement("canvas"); c.width = Math.ceil((w + pad * 2) * NS); c.height = Math.ceil((px * 1.2 + pad * 2) * NS);
  const g = c.getContext("2d"); g.scale(NS, NS);
  g.font = `${px}px ${POSTER}`; g.textAlign = "left"; g.textBaseline = "alphabetic";
  const bx = pad, by = pad + px * 0.95;
  g.shadowColor = color; g.shadowBlur = 7 * NS; g.lineJoin = "round";
  g.strokeStyle = color; g.lineWidth = 2.2; g.strokeText(ch, bx, by); g.strokeText(ch, bx, by);
  g.shadowBlur = 0; g.strokeStyle = "#fff4f8"; g.lineWidth = 0.7; g.strokeText(ch, bx, by);
  s = { c, w, h: px * 1.2, pad, by };
  neonCache.set(key, s);
  return s;
}
function neonWord(ctx, word, cx, baseline, px, colorAt, alphaAt) {
  let total = 0; const parts = [];
  for (const ch of word) { if (ch === " ") { parts.push(null); total += px * 0.3; continue; } const s = neonBuild(ch, px, colorAt(parts.length)); parts.push(s); total += s.w + px * 0.04; }
  let x = cx - total / 2;
  for (let i = 0; i < parts.length; i++) {
    const s = parts[i]; if (!s) { x += px * 0.3; continue; }
    const a = alphaAt(i); if (a > 0.01) { ctx.globalAlpha = a; ctx.drawImage(s.c, x - s.pad, baseline - s.by, s.c.width / NS, s.c.height / NS); }
    x += s.w + px * 0.04;
  }
  ctx.globalAlpha = 1;
}
function wheelSprite(r) {
  return sprite("gateWheel" + r, (r * 2 + 16) * BS, (r * 2 + 16) * BS, (g, w) => {
    g.setTransform(BS, 0, 0, BS, w / 2, w / 2);
    g.strokeStyle = "#5a2a6a"; g.lineWidth = 2.6; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    g.strokeStyle = "#3a1848"; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, r * 0.82, 0, TAU); g.stroke();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; g.strokeStyle = "#3a1848"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU, c = i % 2 ? YEL : PINK; g.globalAlpha = 0.5; g.drawImage(glowSprite(c), Math.cos(a) * r - 6, Math.sin(a) * r - 6, 12, 12); g.globalAlpha = 1; circle(g, Math.cos(a) * r, Math.sin(a) * r, 1.3, i % 4 === 3 ? "#3a2a20" : "#fff3c0"); }
    circle(g, 0, 0, 7, GOLD); circle(g, 0, 0, 3, RED);
  });
}

/* ------------------------------------------------------------ hooks */
export default {
  paint(ctx, game, api) {
    const L = layout(game);
    L.eyes.length = 0;
    // the road beyond, through the bars: dark, cool, empty
    {
      const x0 = L.Lp[1], x1 = L.Rp[0], y1 = Math.max(T, (game.exits[0] ? game.exits[0].y - T / 2 : T));
      const rg = ctx.createLinearGradient(0, 0, 0, y1); rg.addColorStop(0, "#06070c"); rg.addColorStop(1, "#141418");
      ctx.fillStyle = rg; ctx.fillRect(x0, 0, x1 - x0, y1);
      ctx.fillStyle = "#1c1c22"; ctx.beginPath(); ctx.moveTo(L.cx - 40, 0); ctx.lineTo(L.cx + 40, 0); ctx.lineTo(L.cx + 70, y1); ctx.lineTo(L.cx - 70, y1); ctx.fill();
      ctx.fillStyle = "rgba(200,200,170,.18)"; for (let y = 3; y < y1; y += 8) ctx.fillRect(L.cx - 1, y, 2, 4);
      for (let i = 0; i < 18; i++) circle(ctx, x0 + hash(i, 4) * (x1 - x0), hash(i, 5) * y1, 0.8, "#2a3020"); // grass at the verge
    }
    facade(ctx, L, api, L.facL[0], L.facL[1], ["thanks", "mural", "tickets", "barker"], 101);
    facade(ctx, L, api, L.facR[0], L.facR[1], ["refunds", "moon", "exit", "again"], 211);
    // the arch's feet, and the welcome cutouts in front of them
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, L.mw, L.wallH); ctx.clip();
    drawPylon(ctx, L.Lp[0], L.Lp[1], -76, L.wallH, 1); drawPylon(ctx, L.Rp[0], L.Rp[1], -76, L.wallH, 2);
    ctx.restore();
    welcomeCutout(ctx, (L.Lp[0] + L.Lp[1]) / 2, L.wallH - 4, 61, L.eyes, false);
    welcomeCutout(ctx, (L.Rp[0] + L.Rp[1]) / 2, L.wallH - 4, 62, L.eyes, true);
    // put back any lamp heads the arch was painted over
    for (let tx = 0; tx < game.w; tx++) {
      const ty = Math.round(L.wallH / T); if (tileAt(game, tx, ty) !== "lamp") continue;
      const cx = tx * T + T / 2, y = ty * T;
      ctx.fillStyle = "#18181c"; ctx.fillRect(cx - 1.8, y - 12, 3.6, 16);
      ctx.beginPath(); ctx.moveTo(cx - 7, y - 10); ctx.lineTo(cx + 7, y - 10); ctx.lineTo(cx + 4, y - 15); ctx.lineTo(cx - 4, y - 15); ctx.fill();
      circle(ctx, cx, y - 8, 5, PAL.bulb); circle(ctx, cx, y - 8.5, 2.8, PAL.bulbHot);
    }
    for (const p of [L.Lp, L.Rp]) api.lights.push({ x: (p[0] + p[1]) / 2, y: L.wallH - 10, r: 95, color: "#ff4a7a", flicker: 0.08, seed: p[0] });
    wallTents(ctx, L, game, api);
    // confetti and popped balloons on the cobbles (tiny; never near the size of a pickup)
    for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
      if (solidAt(game, tx, ty) || TILES[tileAt(game, tx, ty)].exit) continue;
      const x = tx * T, y = ty * T;
      for (let i = 0; i < 4; i++) {
        if (hash(tx, ty, 300 + i) > 0.55) continue;
        ctx.save(); ctx.translate(x + hash(tx, ty, 310 + i) * T, y + hash(tx, ty, 320 + i) * T); ctx.rotate(hash(tx, ty, 330 + i) * TAU);
        ctx.globalAlpha = 0.55; ctx.fillStyle = FLAG[(hash(tx, ty, 340 + i) * FLAG.length) | 0]; ctx.fillRect(-1.2, -0.7, 2.4, 1.4); ctx.restore();
      }
      const edge = solidAt(game, tx, ty - 1) || solidAt(game, tx, ty + 1) || solidAt(game, tx - 1, ty) || solidAt(game, tx + 1, ty);
      if (edge && hash(tx, ty, 360) < 0.1) { // a popped balloon, string and all
        const bx = x + 6 + hash(tx, ty, 361) * 20, by = y + 6 + hash(tx, ty, 362) * 20, col = FLAG[(hash(tx, ty, 363) * 6) | 0];
        ctx.globalAlpha = 0.8; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx - 1, by - 3); ctx.lineTo(bx + 2, by - 2); ctx.lineTo(bx + 3, by + 1); ctx.lineTo(bx, by + 2); ctx.fill();
        ctx.strokeStyle = "rgba(230,220,200,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(bx, by + 2); ctx.quadraticCurveTo(bx + 5, by + 6, bx + 2, by + 10); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  },

  backdrop(ctx, game, t, view, box) {
    const L = layout(game);
    // the road out, past the gate, in the dark: the only thing out there that isn't painted
    const x0 = L.Lp[1], x1 = L.Rp[0], y0 = L.board.yb - 2;
    if (box.y0 > 0 || box.x1 < x0 || box.x0 > x1) return;
    ctx.fillStyle = "#07080c"; ctx.fillRect(x0, y0, x1 - x0, -y0 + 1);
    ctx.fillStyle = "#121318"; ctx.beginPath(); ctx.moveTo(L.cx - 30, y0); ctx.lineTo(L.cx + 30, y0); ctx.lineTo(L.cx + 40, 1); ctx.lineTo(L.cx - 40, 1); ctx.fill();
  },

  ambient(ctx, game, t, view, box) {
    const L = layout(game), red = view.reduced, tt = red ? 0 : t;
    // bunting along the top of the facade, blowing east
    for (const [a, b] of [L.facL, L.facR]) {
      const x0 = Math.max(a, box.x0 - 20), x1 = Math.min(b, box.x1 + 20);
      if (x1 <= x0 || box.y0 > 30) continue;
      for (let x = a + 4; x < b - 8; x += 9) {
        if (x < x0 || x > x1) continue;
        const k = Math.round((x - a) / 9), seg = ((x - a) % 90) / 90, y = 10 + Math.sin(seg * Math.PI) * 6;
        const flap = Math.sin(tt * 3.1 + k * 0.7) * 1.6;
        ctx.fillStyle = FLAG[k % FLAG.length];
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y + 0.5); ctx.lineTo(x + 4.5 + flap, y + 8); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = "#2a1410"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let x = a; x < b; x += 90) { ctx.moveTo(x, 10); ctx.quadraticCurveTo(x + 45, 22, Math.min(b, x + 90), 10); }
      ctx.stroke();
    }
    // stalls in the yard: a pennant on a pole, and a bunch of balloons that leans INTO the wind
    for (const B of L.blocks) {
      if (B.x > box.x1 || B.x + B.w < box.x0 || B.y > box.y1 || B.y + B.h < box.y0) continue;
      const px = B.x + 7, top = B.y + 4, base = B.y + B.h - 22;
      ctx.fillStyle = "#2a1a10"; ctx.fillRect(px - 0.8, top, 1.6, base - top);
      circle(ctx, px, top, 1.6, GOLD);
      const f = Math.sin(tt * 4 + B.seed * 20), f2 = Math.sin(tt * 4 + B.seed * 20 - 1.2);
      ctx.fillStyle = FLAG[(B.seed * 7 | 0) % FLAG.length];
      ctx.beginPath(); ctx.moveTo(px, top + 2); ctx.quadraticCurveTo(px + 7, top + 2 + f * 1.5, px + 15, top + 5 + f2 * 2); ctx.quadraticCurveTo(px + 7, top + 8 + f * 1.5, px, top + 10); ctx.fill();
      const ax = B.x + B.w - 10, ay = B.y + B.h - 22;
      for (let i = 0; i < 3; i++) {
        const sway = Math.sin(tt * 1.3 + i * 2 + B.seed * 9) * 1.5, bx = ax - 6 - i * 5 + sway, by = B.y + 9 + i * 4 + Math.sin(tt * 1.7 + i) * 1.2;
        ctx.strokeStyle = "rgba(220,210,190,.6)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax - 2, (ay + by) / 2, bx, by + 5); ctx.stroke();
        const col = [PINK, YEL, CYAN, RED, PURP][(i + (B.seed * 5 | 0)) % 5];
        ellipse(ctx, bx, by, 4.2, 5, col); circle(ctx, bx - 1.4, by - 1.8, 1, "rgba(255,255,255,.7)");
        if (i === 1) { // this one has a face, and it is smiling at you
          circle(ctx, bx - 1.3, by - 0.3, 0.5, "#000"); circle(ctx, bx + 1.3, by - 0.3, 0.5, "#000");
          ctx.strokeStyle = "#000"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(bx, by + 0.6, 2, 0.2, Math.PI - 0.2); ctx.stroke();
        }
      }
    }
    // confetti, still coming down, long after anyone stopped celebrating
    if (!red) {
      const C = 200, cx0 = Math.floor(box.x0 / C), cy0 = Math.floor(box.y0 / C), cx1 = Math.floor(box.x1 / C), cy1 = Math.floor(box.y1 / C);
      for (let gy = cy0; gy <= cy1; gy++) for (let gx = cx0; gx <= cx1; gx++) for (let i = 0; i < 3; i++) {
        const h1 = hash(gx, gy, i * 3 + 1), h2 = hash(gx, gy, i * 3 + 2);
        const x = gx * C + ((h1 * C + t * 5 + Math.sin(t * 0.9 + h2 * 9) * 6) % C), y = gy * C + ((h2 * C + t * 11) % C);
        if (x < 0 || y < 0 || x > L.mw || y > L.mh) continue;
        const w = 2.2 * Math.abs(Math.cos(t * 2.2 + h1 * 30));
        ctx.globalAlpha = 0.75; ctx.fillStyle = FLAG[(h2 * FLAG.length) | 0]; ctx.fillRect(x - w / 2, y, Math.max(0.4, w), 1.4);
      }
      ctx.globalAlpha = 1;
    }
  },

  glow(ctx, game, t, view, box) {
    const L = layout(game), red = view.reduced, tt = red ? 0 : t;
    const B = bands(L);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    for (const b of B) blit(ctx, b, box);
    const p = game.player;
    // the rides beyond, turning
    if (box.y0 < 0) {
      const F = L.ferris;
      if (F.x + F.r + 20 > box.x0 && F.x - F.r - 20 < box.x1 && F.y - F.r - 20 < box.y1) {
        const ws = wheelSprite(F.r), sz = ws.width / BS, a = tt * 0.12;
        ctx.save(); ctx.translate(F.x, F.y); ctx.rotate(a); ctx.drawImage(ws, -sz / 2, -sz / 2, sz, sz); ctx.restore();
        for (let i = 0; i < 10; i++) { // the cars hang level; one swings when nothing should be moving it
          const ga = a + (i / 10) * TAU, gx = F.x + Math.cos(ga) * F.r, gy = F.y + Math.sin(ga) * F.r;
          if (gy + 12 > 0) continue;
          const sw = i === 3 && !red ? Math.sin(t * 2.6) * 0.5 : 0;
          ctx.save(); ctx.translate(gx, gy); ctx.rotate(sw);
          ctx.strokeStyle = "#5a2a6a"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 4); ctx.stroke();
          ctx.fillStyle = [RED, TEAL, YEL, PURP, PINK][i % 5]; ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(5, 4); ctx.lineTo(4, 11); ctx.lineTo(-4, 11); ctx.fill();
          ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(-4, 7.5, 8, 3.5);
          ctx.restore();
        }
      }
      const S = L.swing;
      if (S.x + 90 > box.x0 && S.x - 90 < box.x1) {
        ctx.fillStyle = PINK; ctx.beginPath(); ctx.moveTo(S.x - 34, S.y + 10); ctx.lineTo(S.x, S.y - 14); ctx.lineTo(S.x + 34, S.y + 10); ctx.fill();
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? CREAM : PURP; ctx.beginPath(); ctx.moveTo(S.x, S.y - 14); ctx.lineTo(S.x - 34 + i * 11.3, S.y + 10); ctx.lineTo(S.x - 34 + (i + 1) * 11.3, S.y + 10); ctx.fill(); }
        circle(ctx, S.x, S.y - 15, 2.5, YEL);
        const chairs = [];
        for (let i = 0; i < 10; i++) { const a = tt * 0.9 + (i / 10) * TAU; chairs.push({ a, z: Math.cos(a), x: S.x + Math.sin(a) * 62 }); }
        chairs.sort((u, v) => u.z - v.z);
        for (const ch of chairs) { // the swings are empty and still flying outward
          const top = S.x + Math.sin(ch.a) * 30, cy = S.y + 72, k = 0.7 + 0.3 * (ch.z + 1) / 2;
          ctx.globalAlpha = k; ctx.strokeStyle = "#a08070"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(top, S.y + 10); ctx.lineTo(ch.x, cy); ctx.stroke();
          ctx.fillStyle = ch.z > 0 ? YEL : "#a07a20"; ctx.fillRect(ch.x - 3, cy, 6, 3); ctx.globalAlpha = 1;
        }
        for (let i = 0; i < 12; i++) { const bx = S.x - 34 + i * (68 / 11), on = red ? i % 2 : ((i + Math.floor(t * 3)) % 3) !== 0; if (on) { ctx.globalAlpha = 0.6; ctx.drawImage(glowSprite(YEL), bx - 4, S.y + 6, 8, 8); ctx.globalAlpha = 1; circle(ctx, bx, S.y + 10, 0.9, "#fff3c0"); } }
      }
      // balloons let go of, rising, drifting west while every flag blows east
      for (let i = 0; i < 12; i++) {
        const h1 = hash(i, 71), h2 = hash(i, 72), span = L.mw + 2 * PX;
        let x = -PX + ((h1 * span - tt * (4 + h2 * 4)) % span + span) % span;
        const y = -((h2 * 200 + tt * (5 + h1 * 4)) % 210) - 4;
        if (x > L.Lp[0] - 6 && x < L.Rp[1] + 6 && y > L.board.top) continue; // never over the arch or the gate
        if (x < box.x0 - 10 || x > box.x1 + 10 || y < box.y0 - 10) continue;
        x += Math.sin(tt * 0.8 + i) * 3;
        const col = [RED, YEL, PINK, CYAN, PURP, ORANGE][i % 6];
        ctx.strokeStyle = "rgba(220,210,190,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + 3, y + 12, x + 1, y + 18); ctx.stroke();
        ellipse(ctx, x, y, 4.5, 5.6, col); circle(ctx, x - 1.5, y - 2, 1.1, "rgba(255,255,255,.75)");
      }
    }
    // the arch: chasing marquee bulbs up the pylons and round the board, then the neon
    const step = red ? 0 : Math.floor(t * 5);
    ctx.globalCompositeOperation = "lighter";
    const bulb = (x, y, i, col) => {
      if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1) return;
      const on = red ? i % 3 !== 0 : (i + step) % 4 !== 0;
      ctx.globalAlpha = on ? 0.7 : 0.15; ctx.drawImage(glowSprite(col), x - 6, y - 6, 12, 12);
      ctx.globalAlpha = on ? 1 : 0.3; circle(ctx, x, y, 1.2, on ? "#fff4d0" : col);
    };
    for (const pp of [L.Lp, L.Rp]) for (let y = L.wallH - 22, i = 0; y > -66; y -= 9, i++) { bulb(pp[0] + 2, y, i, YEL); bulb(pp[1] - 2, y, i + 2, YEL); }
    if (L.boardBulbs) L.boardBulbs.forEach(([x, y], i) => bulb(x, y, i, i % 2 ? PINK : YEL));
    ctx.globalAlpha = 1;
    // COME AGAIN in neon; the I goes, comes back (slowly; never a strobe)
    const Bd = L.board, bcx = (Bd.x0 + Bd.x1) / 2;
    if (box.y0 < Bd.yb && box.x1 > Bd.x0 && box.x0 < Bd.x1) {
      const dead = !red && Math.sin(t * 1.3) * Math.sin(t * 0.47 + 1) > 0.45;
      neonWord(ctx, "COME AGAIN", bcx, Bd.yb - 5, 22, (i) => (i < 4 ? PINK : YEL), (i) => (i === 8 && dead ? 0.12 : 0.85));
    }
    // SMILE! over the moon mural
    {
      const slot = (L.facR[1] - L.facR[0]) / 4, mx = L.facR[0] + slot * 1.5;
      if (box.y0 < 30 && mx > box.x0 - 60 && mx < box.x1 + 60) {
        const buzz = red ? 0.8 : 0.7 + 0.15 * Math.sin(t * 1.9);
        neonWord(ctx, "SMILE!", mx, 22, 13, () => CYAN, () => buzz);
      }
    }
    // eyeshine: every painted face is watching the guest
    ctx.globalCompositeOperation = "lighter";
    for (const e of L.boardEyes ? L.eyes.concat(L.boardEyes) : L.eyes) {
      if (e.x < box.x0 || e.x > box.x1 || e.y < box.y0 || e.y > box.y1) continue;
      const dx = p.x - e.x, dy = p.y - 20 - e.y, d = Math.hypot(dx, dy) || 1, off = e.r * 1.1;
      const ex = e.x + (dx / d) * off, ey = e.y + (dy / d) * off * 0.8, rr = Math.max(4, e.r * 5);
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite("#ffcc33"), ex - rr, ey - rr, rr * 2, rr * 2);
      ctx.globalAlpha = 0.9; circle(ctx, ex, ey, Math.max(0.6, e.r * 0.8), "#fff0b0");
    }
    // balloon highlights in the yard, so the bunches read in the dark
    for (const Bk of L.blocks) {
      if (Bk.x > box.x1 || Bk.x + Bk.w < box.x0 || Bk.y > box.y1 || Bk.y + Bk.h < box.y0) continue;
      const ax = Bk.x + Bk.w - 10;
      for (let i = 0; i < 3; i++) {
        const sway = Math.sin(tt * 1.3 + i * 2 + Bk.seed * 9) * 1.5, bx = ax - 6 - i * 5 + sway, by = Bk.y + 9 + i * 4 + Math.sin(tt * 1.7 + i) * 1.2;
        ctx.globalAlpha = 0.28; ctx.drawImage(glowSprite([PINK, YEL, CYAN, RED, PURP][(i + (Bk.seed * 5 | 0)) % 5]), bx - 7, by - 7, 14, 14);
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  },
};
