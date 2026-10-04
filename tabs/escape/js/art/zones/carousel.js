/* Stage backdrop for the "carousel" zone (Carousel Row). Owned by ONE agent; see art/zones/README.md.
 *
 * The look: a row of carousels that never stop. Past the north wall the skyline is a
 * line of striped canopies with painted horses bobbing under them (mouths open), a
 * Ferris wheel, a steaming calliope, grinning cut-outs whose eyes follow you and a
 * faceless mascot with balloons that drift against the wind. Past the south wall a
 * boardwalk runs along a black lake full of carnival reflections and floating prizes;
 * something pale waits just under the surface. Inside: the carousel's painted
 * platform, its turning canopy and chasing bulbs, a totem of grinning clown faces by
 * the exit, candy-striped dunk-tank rims and neon slogans gone wrong.
 *
 * Lighting: past the map edge the darkness pass leaves almost nothing, so the
 * carnival beyond is drawn in `glow` (after the darkness) with its own dim overlay,
 * then only its bulbs, neon and eyes on top. Inside, colour comes from api.lights
 * (baked into the static lightmap: free per frame) and small cached neon sprites.
 */
import { TILE, TILES } from "../../content.js";
import { TAU, hash, clamp, circle, ellipse } from "../util.js";
import { isReduced } from "../../settings.js";

const FONT = "'IM Fell English SC', Georgia, serif";
const SIDE = 170, TOPH = 210, BOTH = 210; // how far the world beyond the map is drawn
const C = {
  red: "#c8142e", cream: "#f0dcb4", gold: "#e7b73e", teal: "#159a94", pink: "#ff4fae", violet: "#7b2cbf",
  lime: "#8fe03a", orange: "#ff8a1f", sky: "#3cc8ff", wood: "#2a1a12", ink: "#12060c",
};
const CANOPY = [[C.red, C.cream], [C.violet, C.gold], [C.teal, C.cream], [C.orange, "#5a1034"], [C.pink, C.cream], [C.lime, "#2a0c3a"]];
const BULBS = ["#ffd56a", "#ff3a6a", "#7dff4a", "#c47bff", "#6ae8ff"];
const SKY_SIGNS = ["RIDE AGAIN!", "ROUND & ROUND & ROUND", "NOBODY GETS OFF", "SMILE! YOU'RE STAYING", "ONE MORE TIME", "THE MUSIC NEVER STOPS"];
const LAKE_SIGNS = ["DUNK THE CLOWN! 3 BALLS 5¢", "HE'S STILL DOWN THERE", "SWIM FOREVER", "NO LIFEGUARD ON DUTY"];
const reducedOf = (view) => !!((view && view.reduced) || isReduced());
const solid = (game, tx, ty) => tx < 0 || ty < 0 || tx >= game.w || ty >= game.h || !!TILES[game.tiles[ty * game.w + tx]].solid;
const tileAt = (game, tx, ty) => (tx < 0 || ty < 0 || tx >= game.w || ty >= game.h ? "" : game.tiles[ty * game.w + tx]);

/* ---------------------------------------------------------------- small art */
let measureCtx = null;
function textWidth(text, px) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx.font = `bold ${px}px ${FONT}`; return measureCtx.measureText(text).width;
}
/* a neon tube word: blurred colour halo + a hot core, cached; drawn centred */
const neonCache = new Map();
function neon(text, color, px) {
  const key = text + color + px; let n = neonCache.get(key);
  if (n) return n;
  const S = 3, pad = 8, w = textWidth(text, px) + pad * 2, h = px + pad * 2;
  const c = document.createElement("canvas"); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
  const g = c.getContext("2d"); g.scale(S, S); g.font = `bold ${px}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = color; g.shadowBlur = 5 * S; g.strokeStyle = color; g.lineWidth = 1.6; g.strokeText(text, w / 2, h / 2 + 0.5);
  g.shadowBlur = 2 * S; g.fillStyle = color; g.fillText(text, w / 2, h / 2 + 0.5);
  g.shadowBlur = 0; g.globalAlpha = 0.85; g.fillStyle = "#fff6ea"; g.font = `${px}px ${FONT}`; g.fillText(text, w / 2, h / 2 + 0.5);
  n = { c, w, h }; neonCache.set(key, n); return n;
}
function drawNeon(ctx, n, x, y, a) { ctx.globalAlpha = a; ctx.drawImage(n.c, x - n.w / 2, y - n.h / 2, n.w, n.h); ctx.globalAlpha = 1; }

/* a painted clown face, white greasepaint, a grin with far too many teeth.
   Returns the eye whites [[x,y,r]] so glow can draw pupils that follow you. */
function clownFace(ctx, x, y, r, hair, seed = 0) {
  const h = (k) => hash(seed, 31, k);
  for (const s of [-1, 1]) { circle(ctx, x + s * r * 0.92, y - r * 0.25, r * 0.5, hair); circle(ctx, x + s * r * 0.72, y - r * 0.62, r * 0.36, hair); circle(ctx, x + s * r * 1.08, y + r * 0.12, r * 0.34, hair); }
  circle(ctx, x, y, r, "#efe6d6");
  ctx.fillStyle = "rgba(120,90,80,.25)"; ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.15, r * 0.9, -0.6, 1.8); ctx.fill(); // greasepaint gone grey on one side
  const eyes = [];
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.36, ey = y - r * 0.24;
    ctx.fillStyle = h(1) < 0.5 ? "#2a6fd0" : "#7b2cbf"; // diamond eye paint
    ctx.beginPath(); ctx.moveTo(ex, ey - r * 0.46); ctx.lineTo(ex + r * 0.2, ey); ctx.lineTo(ex, ey + r * 0.42); ctx.lineTo(ex - r * 0.2, ey); ctx.fill();
    ellipse(ctx, ex, ey, r * 0.19, r * 0.17, "#f7f3e8");
    circle(ctx, ex, ey, r * 0.08, "#0a0306"); // painted pupils; glow draws the ones that move
    eyes.push([ex, ey, r * 0.17]);
  }
  // the grin, painted wider than the mouth under it
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(x - r * 0.86, y + r * 0.05); ctx.quadraticCurveTo(x, y + r * 1.15, x + r * 0.86, y + r * 0.05);
  ctx.quadraticCurveTo(x, y + r * 0.62, x - r * 0.86, y + r * 0.05); ctx.fill();
  ctx.fillStyle = "#3a0410"; ctx.beginPath(); ctx.moveTo(x - r * 0.66, y + r * 0.22); ctx.quadraticCurveTo(x, y + r * 0.98, x + r * 0.66, y + r * 0.22);
  ctx.quadraticCurveTo(x, y + r * 0.5, x - r * 0.66, y + r * 0.22); ctx.fill();
  ctx.fillStyle = "#f4ecd8"; // two rows of little teeth, too many
  const n = 11;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, tx = x - r * 0.62 + u * r * 1.24, top = y + r * (0.27 + 0.27 * Math.sin(u * Math.PI)), bot = y + r * (0.3 + 0.62 * Math.sin(u * Math.PI));
    const tw = r * 0.055;
    ctx.beginPath(); ctx.moveTo(tx - tw, top); ctx.lineTo(tx + tw, top); ctx.lineTo(tx, top + r * 0.12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - tw, bot); ctx.lineTo(tx + tw, bot); ctx.lineTo(tx, bot - r * 0.11); ctx.fill();
  }
  circle(ctx, x, y + r * 0.02, r * 0.17, "#e0102a"); circle(ctx, x - r * 0.05, y - r * 0.03, r * 0.05, "#ff9aa8"); // nose
  if (h(2) < 0.6) { ctx.fillStyle = "rgba(160,10,30,.75)"; ctx.fillRect(x + r * 0.42, y + r * 0.5, r * 0.07, r * (0.4 + h(3) * 0.5)); } // a drip from the corner of the grin
  return eyes;
}
/* pupils that follow the guest; the whites burn faintly in the dark */
function pupils(ctx, eyes, px, py, a = 0.7) {
  for (const [ex, ey, r] of eyes) {
    const dx = px - ex, dy = py - ey, d = Math.hypot(dx, dy) || 1, o = r * 0.45;
    ctx.globalAlpha = a; ellipse(ctx, ex, ey, r, r * 0.9, "#f2ead0");
    ctx.globalAlpha = 1; circle(ctx, ex + (dx / d) * o, ey + (dy / d) * o * 0.8, r * 0.5, "#090205");
  }
  ctx.globalAlpha = 1;
}
/* a side-view carousel horse at (x,y) (belly), f = facing ±1. Returns its eye. */
function horse(ctx, x, y, f, k, body, mane, saddle) {
  ctx.save(); ctx.translate(x, y); ctx.scale(f * k, k);
  ctx.strokeStyle = body; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(13, -3); ctx.lineTo(16, 2); ctx.moveTo(6, 3); ctx.lineTo(10, 9); // front legs, prancing
  ctx.moveTo(-8, 3); ctx.lineTo(-13, 8); ctx.lineTo(-12, 12); ctx.moveTo(-5, 4); ctx.lineTo(-5, 12); ctx.stroke();
  ellipse(ctx, 0, 0, 12, 6, body);
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(11, -15); ctx.lineTo(19, -14); ctx.lineTo(22, -9); ctx.lineTo(15, -8); ctx.lineTo(12, 1); ctx.fill();
  ctx.fillStyle = "#3a0410"; ctx.beginPath(); ctx.moveTo(16, -10.5); ctx.lineTo(23, -11); ctx.lineTo(22, -7.5); ctx.lineTo(15.5, -8.2); ctx.fill(); // open mouth
  ctx.fillStyle = "#f4ecd8"; for (let i = 0; i < 3; i++) { ctx.fillRect(17 + i * 1.8, -10.6, 0.8, 1.2); ctx.fillRect(17 + i * 1.8, -8.6, 0.8, 1); }
  ctx.strokeStyle = mane; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, -6); ctx.quadraticCurveTo(7, -13, 12, -16); ctx.moveTo(-12, -1); ctx.quadraticCurveTo(-18, 0, -17, 7); ctx.stroke(); // mane, tail
  ctx.fillStyle = saddle; ctx.fillRect(-5, -6.5, 8, 4);
  ctx.restore();
  return [x + f * 16.5 * k, y - 12 * k];
}

/* ---------------------------------------------------------------- layout */
let S = null; // per-game caches
function scene(game) {
  if (S && S.game === game) return S;
  const mw = game.w * TILE, mh = game.h * TILE;
  // the skyline: a row of carousels, with signs, cut-outs, a calliope and a mascot between them
  const sky = [], cycle = ["carousel", "sign", "clown", "carousel", "calliope", "carousel", "mascot", "sign", "carousel", "clown", "carousel", "mascot"];
  let x = -SIDE + 30, i = 0;
  while (x < mw + SIDE) {
    const type = cycle[i % cycle.length], r = hash(i, 7, 3);
    if (type === "carousel") { const R = 92 + r * 36; sky.push({ type, x: x + R, R, pal: CANOPY[i % CANOPY.length], apex: -165 - r * 45, rim: -48, n: 7, spd: (0.22 + r * 0.18) * (i % 2 ? 1 : -1), seed: i, w: 2 * R }); x += 2 * R + 22; }
    else if (type === "sign") { const text = SKY_SIGNS[((i / 2) | 0) % SKY_SIGNS.length], w = textWidth(text, 13) + 22; sky.push({ type, x: x + w / 2, w, text, col: BULBS[i % BULBS.length], seed: i }); x += w + 26; }
    else if (type === "clown") { sky.push({ type, x: x + 34, w: 70, hair: [C.orange, C.lime, C.sky, C.pink][i % 4], seed: i }); x += 84; }
    else if (type === "calliope") { sky.push({ type, x: x + 70, w: 140, seed: i }); x += 156; }
    else { sky.push({ type, x: x + 30, w: 70, col: [C.violet, C.teal, C.orange][i % 3], seed: i }); x += 80; }
    i++;
  }
  const wheels = [{ x: Math.min(mw * 0.18, 460), r: 185 }, { x: mw * 0.78, r: 205 }];
  const lake = [];
  for (let k = 0, lx = 60; lx < mw + SIDE; k++, lx += 230 + hash(k, 3) * 140) lake.push({ x: lx, kind: ["duck", "cup", "face", "duck", "balloons", "sign", "duck", "face", "cup", "sign"][k % 10], seed: k, text: LAKE_SIGNS[((k / 5) | 0) % LAKE_SIGNS.length] });
  // the far layer: sky, a hill of distant tents, haze. Cached once (soft is fine: it is far away)
  const far = document.createElement("canvas"); far.width = mw + SIDE * 2; far.height = TOPH;
  const g = far.getContext("2d"); g.translate(SIDE, TOPH);
  const sg = g.createLinearGradient(0, -TOPH, 0, 0); sg.addColorStop(0, "#07030c"); sg.addColorStop(0.55, "#1d0828"); sg.addColorStop(0.9, "#3e0f3c"); sg.addColorStop(1, "#5a1838");
  g.fillStyle = sg; g.fillRect(-SIDE, -TOPH, far.width, TOPH);
  for (let k = 0; k < 160; k++) { g.fillStyle = `rgba(255,240,220,${0.1 + hash(k, 1) * 0.3})`; g.fillRect(-SIDE + hash(k, 2) * far.width, -TOPH + hash(k, 3) * TOPH * 0.6, 1, 1); }
  for (let k = 0; k < 9; k++) { // searchlight beams, frozen, faint
    const bx = -SIDE + hash(k, 9) * far.width, ang = (hash(k, 10) - 0.5) * 0.7;
    const bg = g.createLinearGradient(bx, 0, bx + Math.sin(ang) * 220, -TOPH); bg.addColorStop(0, "rgba(255,220,240,.10)"); bg.addColorStop(1, "rgba(255,220,240,0)");
    g.fillStyle = bg; g.beginPath(); g.moveTo(bx - 4, 0); g.lineTo(bx + Math.sin(ang) * 230 - 26, -TOPH); g.lineTo(bx + Math.sin(ang) * 230 + 26, -TOPH); g.lineTo(bx + 4, 0); g.fill();
  }
  g.fillStyle = "#1a0718"; g.beginPath(); g.moveTo(-SIDE, 0);
  for (let px = -SIDE; px <= mw + SIDE; px += 40) g.lineTo(px, -30 - 14 * Math.sin(px * 0.004) - 8 * hash(px, 4));
  g.lineTo(mw + SIDE, 0); g.fill();
  for (let px = -SIDE + 20; px < mw + SIDE; px += 70 + hash(px, 6) * 60) { // distant tents, striped, a few lit windows
    const ty = -26 - 14 * Math.sin(px * 0.004), w = 18 + hash(px, 7) * 16, hh = 20 + hash(px, 8) * 18;
    for (let s = 0; s < 4; s++) { g.fillStyle = s % 2 ? "#3a1030" : "#5e1432"; g.beginPath(); g.moveTo(px, ty - hh); g.lineTo(px - w + s * w / 2, ty); g.lineTo(px - w + (s + 1) * w / 2, ty); g.fill(); }
    g.fillStyle = "rgba(255,200,120,.5)"; g.fillRect(px - 2, ty - 6, 3, 5);
  }
  const hz = g.createLinearGradient(0, -60, 0, 0); hz.addColorStop(0, "rgba(255,90,150,0)"); hz.addColorStop(1, "rgba(255,90,150,.18)");
  g.fillStyle = hz; g.fillRect(-SIDE, -60, far.width, 60);
  // the lake, cached
  const lk = document.createElement("canvas"); lk.width = mw + SIDE * 2; lk.height = BOTH;
  const lg = lk.getContext("2d"); lg.translate(SIDE, 0);
  const wg = lg.createLinearGradient(0, 0, 0, BOTH); wg.addColorStop(0, "#0d2230"); wg.addColorStop(0.4, "#081521"); wg.addColorStop(1, "#030609");
  lg.fillStyle = wg; lg.fillRect(-SIDE, 0, lk.width, BOTH);
  for (let k = 0; k < 220; k++) { lg.fillStyle = `rgba(120,200,230,${0.04 + hash(k, 21) * 0.07})`; lg.fillRect(-SIDE + hash(k, 22) * lk.width, 30 + hash(k, 23) * (BOTH - 30), 6 + hash(k, 24) * 14, 1); }
  S = { game, mw, mh, sky, wheels, lake, far, lk, pools: findPools(game), signs: mapSigns(game), eyes: [], hub: null };
  return S;
}
function findPools(game) { // dunk tanks: runs of water, clustered by column
  const pools = [];
  const row = game.tiles.map((n, i) => n === "water" ? i : -1).filter((i) => i >= 0);
  for (const i of row) {
    const tx = i % game.w, ty = (i / game.w) | 0;
    let p = pools.find((q) => tx >= q.x0 - 1 && tx <= q.x1 + 1 && ty <= q.y1 + 1);
    if (!p) { p = { x0: tx, x1: tx, y0: ty, y1: ty }; pools.push(p); }
    p.x0 = Math.min(p.x0, tx); p.x1 = Math.max(p.x1, tx); p.y1 = Math.max(p.y1, ty);
  }
  return pools.map((p) => ({ x0: p.x0 * TILE, y0: p.y0 * TILE, x1: (p.x1 + 1) * TILE, y1: (p.y1 + 1) * TILE }));
}
/* painted signs on the booth tops and the outer walls: [tx0, tx1, ty, text, colour] */
function mapSigns(game) {
  const want = [
    [0, "THE MAD TEA PARTY", C.pink, 16], [0, "★ CAROUSEL ROW ★", "#ffd56a", 40], [0, "SPIN 'TIL YOU'RE SICK", C.sky, 64],
    [4, "RIDE AGAIN", C.pink, 4], [4, "TEACUPS ↑ NO REFUNDS", "#ffd56a", 18], [4, "THE HORSES ARE HUNGRY", C.sky, 61], [4, "FUN!", "#ff3a4a", 74.5],
    [20, "SMILE!", "#ffd56a", 4], [20, "DUNK THE CLOWN ↓ HE'S STILL DOWN THERE", C.sky, 18], [20, "HOLD YOUR BREATH", C.pink, 61], [20, "WHEE!", C.lime, 74.5],
    [game.h - 1, "EVERYBODY RIDES · NOBODY GETS OFF", "#ffd56a", 22], [game.h - 1, "ROUND AND ROUND AND ROUND AND ROUND", C.pink, 58],
  ];
  const out = [];
  for (const [ty, text, col, tc] of want) {
    const n = tileAt(game, Math.floor(tc), ty); if (n !== "booth" && n !== "tent") continue; // map changed: skip, never paint floor
    const px = 9, w = textWidth(text, px) + 14, x = tc * TILE + (Number.isInteger(tc) ? TILE / 2 : 0);
    const front = !solid(game, Math.floor(tc), ty + 1), top = front ? (n === "booth" ? 13 : 19) : 32;
    out.push({ x, y: ty * TILE + Math.min(top, 20) / 2 + 0.5, w, h: Math.min(top, 20) - 3, text, col, px, seed: out.length });
  }
  return out;
}

/* ---------------------------------------------------------------- paint (static, baked) */
function paintPlatform(ctx, game, cx, cy) {
  const rx = 300, ry = 225;
  ctx.save(); ctx.beginPath();
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const dx = (tx + 0.5) * TILE - cx, dy = (ty + 0.5) * TILE - cy;
    if ((dx / rx) ** 2 + (dy / ry) ** 2 < 1 && !solid(game, tx, ty)) ctx.rect(tx * TILE, ty * TILE, TILE, TILE);
  }
  ctx.clip();
  ctx.translate(cx, cy); ctx.scale(1, ry / rx);
  const N = 28;
  for (let i = 0; i < N; i++) { // the turntable's painted wedges, faded and scuffed
    ctx.fillStyle = i % 2 ? "rgba(240,210,150,.10)" : "rgba(200,20,50,.17)";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rx + 20, (i / N) * TAU, ((i + 1) / N) * TAU); ctx.fill();
  }
  ctx.strokeStyle = "rgba(231,183,62,.28)";
  for (const k of [0.42, 0.7, 0.97]) { ctx.lineWidth = k > 0.9 ? 5 : 2.5; ctx.beginPath(); ctx.arc(0, 0, rx * k, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; circle(ctx, Math.cos(a) * rx * 0.97, Math.sin(a) * rx * 0.97, 2.4, i % 2 ? "rgba(255,213,106,.35)" : "rgba(40,10,10,.5)"); } // dead bulb sockets on the rim
  ctx.restore();
}
function paintHubBase(ctx, cx, cy) {
  ellipse(ctx, cx + 3, cy + 8, 54, 48, "rgba(0,0,0,.45)");
  ellipse(ctx, cx, cy + 2, 50, 46, "#2a1410");
  for (let i = 0; i < 16; i++) { // mirrored panels round the drum, some cracked
    const a = (i / 16) * TAU, x = cx + Math.cos(a) * 44, y = cy + 2 + Math.sin(a) * 40;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i % 2 ? "#8fb8c8" : "#c9a54a"; ctx.fillRect(-5, -3, 10, 6);
    if (hash(i, 77) < 0.3) { ctx.strokeStyle = "#1a0a0a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(3, 2); ctx.stroke(); }
    ctx.restore();
  }
}
function paintSign(ctx, s) {
  const x0 = s.x - s.w / 2, y0 = s.y - s.h / 2;
  ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x0 + 1.5, y0 + 2, s.w, s.h);
  ctx.fillStyle = "#1c0a12"; ctx.fillRect(x0, y0, s.w, s.h);
  ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, s.w - 1, s.h - 1);
  ctx.font = `bold ${s.px}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = s.col; ctx.globalAlpha = 0.55; ctx.fillText(s.text, s.x, s.y + 0.5); ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(170,10,30,.8)"; // paint running off the board
  for (let i = 0; i < 4; i++) { const dx = x0 + 4 + hash(s.seed, i, 5) * (s.w - 8), l = 2 + hash(s.seed, i, 6) * 5; ctx.fillRect(dx, y0 + s.h - 1, 1, l); circle(ctx, dx + 0.5, y0 + s.h - 1 + l, 0.9, "rgba(170,10,30,.8)"); }
}
function paintBunting(ctx, x0, x1, y, seed) { // pennants along a wall front
  let i = 0;
  for (let x = x0; x < x1; x += 64) {
    const xe = Math.min(x + 64, x1);
    ctx.strokeStyle = "#0e0608"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo((x + xe) / 2, y + 5, xe, y); ctx.stroke();
    for (let px = x + 3; px < xe - 2; px += 7, i++) {
      const u = (px - x) / (xe - x), py = y + 4 * 2 * u * (1 - u) * 1.25, col = BULBS[(i + seed) % 5];
      ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.moveTo(px - 2.6, py); ctx.lineTo(px + 2.6, py); ctx.lineTo(px + 0.4, py + 6.5); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
function paintTotem(ctx, game, tx, ty0, ty1, api) { // a column of grinning faces stacked by the exit
  const x = tx * TILE + TILE / 2, y0 = ty0 * TILE + 2, y1 = ty1 * TILE + TILE - 14, eyes = [];
  ctx.fillStyle = "#1a0a10"; ctx.fillRect(x - 13, y0, 26, y1 - y0);
  for (let y = y0; y < y1; y += 12) { ctx.fillStyle = ((y - y0) / 12) % 2 ? C.red : C.cream; ctx.fillRect(x - 13, y, 3, 12); ctx.fillRect(x + 10, y, 3, 12); }
  const hairs = [C.orange, C.lime, C.pink, C.sky, C.violet, C.gold];
  const n = Math.max(1, Math.floor((y1 - y0) / 54));
  for (let i = 0; i < n; i++) {
    const fy = y0 + 28 + i * ((y1 - y0 - 40) / Math.max(1, n - 1 || 1));
    eyes.push(...clownFace(ctx, x, fy, 11.5, hairs[i % hairs.length], i + 3));
  }
  for (let y = y0 + 6; y < y1; y += 18) for (const s of [-1, 1]) { const sd = hash(tx, y, s + 5); api.bulbs.push({ x: x + s * 14, y, color: BULBS[((y / 18) | 0) % 5], seed: sd, state: sd < 0.25 ? "dead" : sd < 0.4 ? "flicker" : "on" }); }
  return eyes;
}
function paintRims(ctx, game) { // candy-striped rims round the dunk tanks (makes the hazard edge read, too)
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    if (tileAt(game, tx, ty) !== "water") continue;
    const x = tx * TILE, y = ty * TILE;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nb = tileAt(game, tx + dx, ty + dy); if (nb === "water" || solid(game, tx + dx, ty + dy)) continue;
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = (k + tx + ty) % 2 ? "#e8dcc4" : "#c8142e";
        if (dy) ctx.fillRect(x + k * 8, dy < 0 ? y : y + TILE - 3, 8, 3); else ctx.fillRect(dx < 0 ? x : x + TILE - 3, y + k * 8, 3, 8);
      }
    }
  }
}
function paintConfetti(ctx, game) {
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    if (solid(game, tx, ty) || tileAt(game, tx, ty) === "water" || hash(tx, ty, 901) > 0.35) continue;
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(tx * TILE + hash(tx, ty, 910 + i) * TILE, ty * TILE + hash(tx, ty, 920 + i) * TILE); ctx.rotate(hash(tx, ty, 930 + i) * TAU);
      ctx.fillStyle = BULBS[(hash(tx, ty, 940 + i) * 5) | 0]; ctx.globalAlpha = 0.45; ctx.fillRect(-1, -0.6, 2.2, 1.2); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

/* the hub canopy, seen from above: wedges, scallops; cached and turned in `ambient` */
let canopySprite = null;
function canopy() {
  if (canopySprite) return canopySprite;
  const R = 50, K = 3, c = document.createElement("canvas"); c.width = c.height = (R + 6) * 2 * K;
  const g = c.getContext("2d"); g.scale(K, K); g.translate(R + 6, R + 6);
  const N = 16;
  for (let i = 0; i < N; i++) { g.fillStyle = i % 2 ? C.cream : C.red; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R - 4, (i / N) * TAU, ((i + 1) / N) * TAU); g.fill(); }
  for (let i = 0; i < N * 2; i++) { const a = ((i + 0.5) / (N * 2)) * TAU; g.fillStyle = i % 2 ? C.gold : C.teal; g.beginPath(); g.arc(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), 4.6, 0, TAU); g.fill(); }
  const sh = g.createRadialGradient(-12, -14, 4, 0, 0, R); sh.addColorStop(0, "rgba(255,240,220,.18)"); sh.addColorStop(1, "rgba(0,0,0,.4)");
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  g.strokeStyle = C.gold; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, R - 5, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.stroke();
  canopySprite = { c, R: R + 6 };
  return canopySprite;
}
let finialSprite = null, finialEyes = null;
function finial() {
  if (finialSprite) return finialSprite;
  const K = 3, r = 13, c = document.createElement("canvas"); c.width = c.height = 40 * K;
  const g = c.getContext("2d"); g.scale(K, K);
  finialEyes = clownFace(g, 20, 20, r, C.orange, 11).map(([x, y, er]) => [x - 20, y - 20, er]);
  finialSprite = c; return c;
}

/* ---------------------------------------------------------------- the skyline (drawn in glow) */
function drawWheel(ctx, w, t, em) {
  const cx = w.x, cy = -w.r - 35, r = w.r, rot = t * 0.05;
  ctx.strokeStyle = "#2a1236"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - r * 0.55, 0); ctx.lineTo(cx, cy); ctx.lineTo(cx + r * 0.55, 0); ctx.stroke(); // A-frame
  ctx.strokeStyle = "#3a1a4a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, r * 0.93, 0, TAU);
  for (let i = 0; i < 16; i++) { const a = rot + (i / 16) * TAU; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.stroke();
  for (let i = 0; i < 12; i++) { // gondolas hang straight down; one swings, empty, the rest are not
    const a = rot + (i / 12) * TAU, gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r;
    if (gy < -TOPH - 10) continue;
    ctx.strokeStyle = "#1a0a14"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + 6); ctx.stroke();
    ctx.fillStyle = CANOPY[i % 6][0]; ctx.beginPath(); ctx.moveTo(gx - 9, gy + 6); ctx.lineTo(gx + 9, gy + 6); ctx.lineTo(gx + 7, gy + 17); ctx.lineTo(gx - 7, gy + 17); ctx.fill();
    ctx.fillStyle = "#0a0408"; ctx.fillRect(gx - 5, gy + 3, 10, 4);
    if (i % 3 === 1) { circle(ctx, gx - 2, gy + 2.5, 2.4, "#d8d0c0"); em.push(["dot", gx - 2.8, gy + 2.2, 0.6, "#fff3b0"]); } // someone is still riding
  }
  for (let i = 0; i < 32; i++) { const a = -rot * 0.5 + (i / 32) * TAU; em.push(["bulb", cx + Math.cos(a) * r, cy + Math.sin(a) * r, BULBS[i % 5], (i + Math.floor(t * 1.5)) % 4 === 0 ? 0.25 : 1]); }
}
function drawCarousel(ctx, c, t, red, em) {
  const { x, R, rim, apex, pal } = c, rot = c.seed + t * c.spd;
  ellipse(ctx, x, -5, R * 0.98, 7, "#140810"); // platform
  ctx.fillStyle = pal[0]; ctx.fillRect(x - R * 0.96, -8, R * 1.92, 3);
  ctx.fillStyle = "#3a2418"; ctx.fillRect(x - 9, rim, 18, -8 - rim); // centre column, mirrored
  for (let y = rim + 3; y < -10; y += 7) { ctx.fillStyle = (y | 0) % 2 ? "#6a8a9a" : "#a0843a"; ctx.fillRect(x - 6, y, 12, 4); }
  const hs = [];
  for (let k = 0; k < c.n; k++) { const a = rot + (k / c.n) * TAU; hs.push({ s: Math.sin(a), d: Math.cos(a), k }); }
  hs.sort((a, b) => a.d - b.d);
  for (const h of hs) {
    const hx = x + h.s * R * 0.8, bob = red ? 0 : Math.sin(t * 2.2 + h.k * 1.9) * 4, hy = -20 + bob - (h.d < 0 ? 3 : 0), back = h.d < 0;
    ctx.strokeStyle = back ? "#5a4a28" : "#c9a54a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx, rim); ctx.lineTo(hx, -6); ctx.stroke();
    const f = Math.sign(h.d * c.spd) || 1, k = back ? 0.62 : 0.8;
    const body = back ? "#6e665c" : (h.k === 2 ? "#3a3030" : "#e6dccb"), mane = back ? "#3a1a20" : CANOPY[(h.k + c.seed) % 6][0];
    const eye = horse(ctx, hx, hy, f, k, body, mane, pal[0]);
    if (!back && h.s > -0.85 && h.s < 0.85) em.push(["eye", eye[0], eye[1], 1.4, "#ff3030"]);
  }
  // the canopy: turning stripes, a scalloped valance, bulbs
  const N = 12, ph = ((rot / TAU) * N * 2) % 2, base = Math.floor(ph), fr = ph - base;
  for (let j = -1; j < N; j++) {
    const a0 = clamp(((j + fr) / N) * Math.PI - Math.PI / 2, -Math.PI / 2, Math.PI / 2), a1 = clamp(((j + 1 + fr) / N) * Math.PI - Math.PI / 2, -Math.PI / 2, Math.PI / 2);
    if (a1 <= a0) continue;
    ctx.fillStyle = pal[(j + base + 4) & 1]; ctx.beginPath(); ctx.moveTo(x, apex); ctx.lineTo(x + R * Math.sin(a0), rim); ctx.lineTo(x + R * Math.sin(a1), rim); ctx.fill();
  }
  const sh = ctx.createLinearGradient(x - R, 0, x + R, 0); sh.addColorStop(0, "rgba(0,0,0,.35)"); sh.addColorStop(0.4, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.5)");
  ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(x, apex); ctx.lineTo(x - R, rim); ctx.lineTo(x + R, rim); ctx.fill();
  const sc = 14, sw = (2 * R) / sc;
  for (let i = 0; i < sc; i++) { ctx.fillStyle = i % 2 ? pal[1] : pal[0]; ctx.beginPath(); ctx.arc(x - R + (i + 0.5) * sw, rim, sw / 2, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = C.gold; ctx.fillRect(x - R, rim - 1.5, 2 * R, 2.5);
  ctx.strokeStyle = "#1a0a10"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, apex); ctx.lineTo(x, apex - 16); ctx.stroke();
  const fl = red ? 0 : Math.sin(t * 3 + c.seed) * 2;
  ctx.fillStyle = pal[0]; ctx.beginPath(); ctx.moveTo(x, apex - 16); ctx.lineTo(x + 12, apex - 13 + fl); ctx.lineTo(x, apex - 9); ctx.fill(); // pennant, blowing east
  for (let i = 0; i <= sc; i++) { const on = red ? hash(c.seed, i, 3) > 0.15 : (i + Math.floor(t * 2.5)) % 3 !== 0; em.push(["bulb", x - R + i * sw, rim + 1, BULBS[(i + c.seed) % 5], on ? 1 : 0.2]); }
}
function drawSkySign(ctx, s, t, red, em) {
  const x0 = s.x - s.w / 2, y0 = -56, h = 24;
  ctx.fillStyle = "#24140e"; ctx.fillRect(x0 + 10, y0 + h, 4, -y0 - h); ctx.fillRect(x0 + s.w - 14, y0 + h, 4, -y0 - h);
  ctx.fillStyle = "#1a0a12"; ctx.fillRect(x0, y0, s.w, h);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + 1, y0 + 1, s.w - 2, h - 2);
  ctx.fillStyle = "rgba(170,10,30,.85)";
  for (let i = 0; i < 6; i++) { const dx = x0 + 6 + hash(s.seed, i, 8) * (s.w - 12), l = 4 + hash(s.seed, i, 9) * 14; ctx.fillRect(dx, y0 + h - 2, 1.4, l); circle(ctx, dx + 0.7, y0 + h - 2 + l, 1.3, "rgba(170,10,30,.85)"); }
  if (em) skySignEm(s, t, red, em);
}
function skySignEm(s, t, red, em) {
  const x0 = s.x - s.w / 2, y0 = -56, h = 24;
  em.push(["neon", neon(s.text, s.col, 13), s.x, y0 + h / 2, red ? 0.85 : 0.75 + 0.2 * Math.sin(t * 0.9 + s.seed)]);
  for (let x = x0 + 4; x < x0 + s.w - 2; x += 9) { const dead = hash(s.seed, x, 4) < 0.2; em.push(["bulb", x, y0 - 2, "#ffd56a", dead ? 0.15 : 1]); }
}
function drawSteam(ctx, c, t) {
  for (let i = 0; i < 11; i++) {
    if ((i * 7 + Math.floor(t * 2)) % 5 !== 0) continue;
    const px = c.x - 50 + i * 10, hgt = 22 + 26 * Math.sin((i / 10) * Math.PI);
    for (let k = 0; k < 3; k++) { const u = ((t * 0.6 + k / 3 + i * 0.13) % 1); ctx.globalAlpha = 0.25 * (1 - u); circle(ctx, px + Math.sin(u * 6 + i) * 3, -44 - hgt - u * 30, 3 + u * 6, "#e8e0f0"); }
  }
  ctx.globalAlpha = 1;
}
function drawClownCutout(ctx, c, em) {
  const x = c.x, y = -36;
  ctx.fillStyle = "#24140e"; ctx.fillRect(x - 2, y + 20, 4, -y - 20); ctx.fillRect(x - 16, -10, 32, 3);
  ctx.fillStyle = "#e6d6b6"; ctx.beginPath(); ctx.arc(x, y, 31, 0, TAU); ctx.fill(); // the plywood edge
  const eyes = clownFace(ctx, x, y, 26, c.hair, c.seed);
  ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.moveTo(x - 14, y - 26); ctx.lineTo(x, y - 52); ctx.lineTo(x + 14, y - 26); ctx.fill(); // a little hat
  circle(ctx, x, y - 52, 3.5, C.red);
  em.push(["eyes", eyes]);
}
function drawMascot(ctx, m, t, red, em) {
  const x = m.x, sway = red ? 0 : Math.sin(t * 0.8 + m.seed) * 1.2;
  ctx.fillStyle = m.col; ctx.beginPath(); ctx.moveTo(x - 14, 0); ctx.quadraticCurveTo(x - 18, -30, x - 10, -42); ctx.lineTo(x + 10, -42); ctx.quadraticCurveTo(x + 18, -30, x + 14, 0); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x - 1, -40, 2, 38);
  ctx.strokeStyle = m.col; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + 9, -36); ctx.lineTo(x + 20, -58); ctx.moveTo(x - 9, -36); ctx.lineTo(x - 16, -18); ctx.stroke(); // one arm waving
  circle(ctx, x - 12, -66, 6, m.col); circle(ctx, x + 12, -66, 6, m.col);
  ellipse(ctx, x + sway, -55, 15, 14, m.col);
  ellipse(ctx, x + sway, -53, 10, 9, "#e8dcc8"); // the face: nothing on it
  ctx.strokeStyle = "rgba(60,30,30,.35)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + sway - 6, -52); ctx.quadraticCurveTo(x + sway, -50, x + sway + 6, -52); ctx.stroke(); // a seam where a mouth would be
  for (let i = 0; i < 3; i++) { // balloons, tied to the waving hand, leaning WEST (the pennants blow east)
    const bx = x + 20 - 8 - i * 9 + (red ? 0 : Math.sin(t * 0.7 + i) * 1.5), by = -100 - i * 9;
    ctx.strokeStyle = "rgba(230,220,200,.5)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + 20, -58); ctx.quadraticCurveTo(bx + 4, by + 30, bx, by + 10); ctx.stroke();
    ellipse(ctx, bx, by, 7, 9, BULBS[(i + m.seed) % 5]); circle(ctx, bx - 2.2, by - 3.2, 1.6, "rgba(255,255,255,.5)");
  }
}
function drawCalliope(ctx, c, t, red, em) {
  const x = c.x;
  ctx.fillStyle = "#6e0e1c"; ctx.fillRect(x - 62, -44, 124, 36);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.strokeRect(x - 60, -42, 120, 32);
  for (let i = 0; i < 11; i++) { // the pipes, brass, longest in the middle
    const px = x - 50 + i * 10, hgt = 22 + 26 * Math.sin((i / 10) * Math.PI);
    ctx.fillStyle = i % 2 ? "#c9a54a" : "#e7c76a"; ctx.fillRect(px - 3, -44 - hgt, 6, hgt);
    ctx.fillStyle = "#1a0a06"; ctx.fillRect(px - 3, -44 - hgt + 4, 6, 2);
    if (!red && (i * 7 + Math.floor(t * 2)) % 5 === 0) for (let k = 0; k < 3; k++) { const u = ((t * 0.6 + k / 3 + i * 0.13) % 1); ctx.globalAlpha = 0.25 * (1 - u); circle(ctx, px + Math.sin(u * 6 + i) * 3, -44 - hgt - u * 30, 3 + u * 6, "#e8e0f0"); ctx.globalAlpha = 1; } // steam
  }
  ctx.font = `bold 11px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = C.gold; ctx.fillText("CALLIOPE", x, -20);
  for (const s of [-1, 1]) { ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + s * 42, -6, 9, 0, TAU); ctx.stroke(); }
  em.push(["eyes", clownFace(ctx, x, -32, 8, C.lime, c.seed)]);
}
function drawSkyBunting(ctx, x0, x1, y, sag, t, red, seed) {
  const step = 120, cols = BULBS;
  for (let a = Math.floor(x0 / step) * step; a < x1; a += step) {
    ctx.strokeStyle = "#0e0608"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a, y); ctx.quadraticCurveTo(a + step / 2, y + sag * 2, a + step, y); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const u = (i + 0.5) / 12, px = a + u * step, py = y + sag * 4 * u * (1 - u), fl = red ? 1.5 : 1.5 + Math.sin(t * 3 + px * 0.05) * 1.5;
      ctx.fillStyle = cols[(i + seed + Math.floor(a / step)) % 5]; ctx.beginPath(); ctx.moveTo(px - 3.5, py); ctx.lineTo(px + 3.5, py); ctx.lineTo(px + fl, py + 9); ctx.fill();
    }
  }
}
function drawBalloons(ctx, x0, x1, ylo, yhi, t, red, salt, mw) {
  const span = mw + SIDE * 2;
  for (let i = 0; i < 26; i++) {
    const v = 5 + hash(i, salt, 1) * 9, bx = ((hash(i, salt, 2) * span - (red ? 0 : t * v)) % span + span) % span - SIDE; // drifting west, into the wind
    if (bx < x0 - 12 || bx > x1 + 12) continue;
    const by = ylo + hash(i, salt, 3) * (yhi - ylo) + (red ? 0 : Math.sin(t * 0.7 + i) * 4), col = BULBS[i % 5];
    ctx.strokeStyle = "rgba(230,220,200,.35)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(bx, by + 8); ctx.quadraticCurveTo(bx + 3, by + 14, bx - 1, by + 22); ctx.stroke();
    ellipse(ctx, bx, by, 6.5, 8, col); circle(ctx, bx - 2, by - 3, 1.5, "rgba(255,255,255,.45)");
    if (i % 4 === 0) { circle(ctx, bx - 2, by - 1, 0.9, "#0a0306"); circle(ctx, bx + 2, by - 1, 0.9, "#0a0306"); ctx.strokeStyle = "#0a0306"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(bx, by + 1, 3, 0.2, Math.PI - 0.2); ctx.stroke(); } // a face drawn on in marker
  }
}
function drawBoardwalk(ctx, x0, x1, mh, t, red) {
  ctx.fillStyle = "#2e1c12"; ctx.fillRect(x0, mh, x1 - x0, 24);
  ctx.strokeStyle = "#140a06"; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) { ctx.moveTo(x, mh); ctx.lineTo(x, mh + 24); }
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x0, mh, x1 - x0, 5);
  // railing: posts with gold caps, bunting between
  ctx.fillStyle = "#3a2418";
  for (let x = Math.floor(x0 / 48) * 48; x < x1 + 48; x += 48) { ctx.fillRect(x - 2, mh + 14, 4, 14); circle(ctx, x, mh + 14, 2.6, C.gold); }
  ctx.fillStyle = "#4a2e1e"; ctx.fillRect(x0, mh + 19, x1 - x0, 2);
  drawSkyBunting(ctx, x0, x1, mh + 20, 3, t, red, 2);
}
function drawLake(ctx, s, t, red, x0, x1, em, cached) {
  const mh = s.mh;
  if (cached) blitStrip(ctx, s.walk, mh, LAKE_H, x0, x1, mh, mh + LAKE_H);
  else drawBoardwalk(ctx, x0, x1, mh, t, red);
  // reflections of everything that is lit, broken up by the water
  for (let k = Math.floor((x0 - 40) / 70); k * 70 < x1 + 40; k++) {
    const rx = k * 70 + hash(k, 41) * 30, col = BULBS[((k % 5) + 5) % 5];
    for (let j = 0; j < 7; j++) {
      const off = red ? 0 : Math.sin(t * 1.4 + j * 0.9 + k) * 3;
      ctx.globalAlpha = 0.32 - j * 0.035; ctx.fillStyle = col; ctx.fillRect(rx + off - (9 - j), mh + 36 + j * 9, (9 - j) * 2, 1.6);
    }
  }
  ctx.globalAlpha = 1;
  for (const o of s.lake) {
    if (o.x < x0 - 120 || o.x > x1 + 120) continue;
    const bob = red ? 0 : Math.sin(t * 1.1 + o.seed * 2) * 1.5, y = mh + 62 + hash(o.seed, 5) * 60 + bob;
    if (o.kind === "duck") {
      ellipse(ctx, o.x, y + 3, 9, 2.5, "rgba(0,0,0,.4)"); ellipse(ctx, o.x, y, 7, 4.5, "#e8c030"); circle(ctx, o.x + 5, y - 4, 3.6, "#e8c030");
      ctx.fillStyle = "#e86a1a"; ctx.fillRect(o.x + 8, y - 4.5, 3, 1.6); em.push(["dot", o.x + 6, y - 5, 0.7, "#ff3030"]);
    } else if (o.kind === "cup") { // a teacup, upside down, drifting
      ellipse(ctx, o.x, y, 12, 5, C.pink); ellipse(ctx, o.x, y - 2, 9, 3.5, "#b02a70"); ctx.strokeStyle = C.pink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x + 12, y - 1, 3, -1.2, 1.4); ctx.stroke();
    } else if (o.kind === "balloons") {
      for (let i = 0; i < 3; i++) { ellipse(ctx, o.x + i * 7 - 7, y + (i % 2) * 2, 5, 3.4, BULBS[(i + o.seed) % 5]); }
    } else if (o.kind === "face") { // just under the surface, looking up
      ctx.globalAlpha = 0.28; ellipse(ctx, o.x, y, 13, 16, "#d8e0dc"); ctx.globalAlpha = 1;
      em.push(["eyes", [[o.x - 4.5, y - 3, 2.2], [o.x + 4.5, y - 3, 2.2]], 0.35]);
      ctx.strokeStyle = "rgba(120,10,30,.55)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(o.x, y + 3, 6, 0.2, Math.PI - 0.2); ctx.stroke();
    } else { // a sign on two posts, sinking
      const w = textWidth(o.text, 11) + 18, sx = o.x - w / 2, sy = mh + 30;
      ctx.fillStyle = "#24140e"; ctx.fillRect(sx + 6, sy + 16, 3, 24); ctx.fillRect(sx + w - 9, sy + 16, 3, 24);
      ctx.save(); ctx.translate(o.x, sy + 9); ctx.rotate(-0.04); ctx.fillStyle = "#1a0a12"; ctx.fillRect(-w / 2, -9, w, 18); ctx.strokeStyle = C.gold; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 + 1, -8, w - 2, 16); ctx.restore();
      em.push(["neon", neon(o.text, o.seed % 2 ? C.sky : C.pink, 11), o.x, sy + 9, red ? 0.8 : 0.7 + 0.2 * Math.sin(t * 0.6 + o.seed)]);
    }
  }
}

function drawEmissive(ctx, em, px, py) {
  ctx.globalCompositeOperation = "lighter";
  for (const e of em) if (e[0] === "bulb" && e[4] > 0.05) { ctx.globalAlpha = 0.35 * e[4]; ctx.drawImage(glowSpr(e[3]), e[1] - 7, e[2] - 7, 14, 14); }
  ctx.globalCompositeOperation = "source-over";
  for (const e of em) {
    if (e[0] === "bulb") { if (e[4] > 0.05) { ctx.globalAlpha = Math.max(0.3, e[4]); circle(ctx, e[1], e[2], 1.8, e[4] > 0.5 ? e[3] : "#3a3028"); if (e[4] > 0.5) circle(ctx, e[1] - 0.4, e[2] - 0.4, 0.7, "#fff"); } }
    else if (e[0] === "neon") drawNeon(ctx, e[1], e[2], e[3], e[4]);
    else if (e[0] === "eyes") pupils(ctx, e[1], px, py, e[2] ?? 0.7);
    else if (e[0] === "eye" || e[0] === "dot") { ctx.globalAlpha = 0.9; circle(ctx, e[1], e[2], e[3], e[4]); }
  }
  ctx.globalAlpha = 1;
}
const glowCache = new Map();
function glowSpr(color) {
  let c = glowCache.get(color); if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, color); gr.addColorStop(0.3, color + "88"); gr.addColorStop(1, color + "00"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  glowCache.set(color, c); return c;
}

/* Phones (≤2 device px per world px): the skyline's static pieces (signs, cut-outs,
   calliope, mascots, both bunting lines) and the boardwalk are baked once into 2x
   strips, so per frame only the turning carousels, the wheel, balloons, steam and the
   lights are drawn. At desktop zoom (~4.8 px/world px) a sharp cache would cost ~50MB,
   and the live vector path is cheap there, so desktop keeps drawing it live. */
const CK = 2, MID_Y = -140, FRONT_Y = -16, LAKE_H = 36;
function strip(w, y0, y1, draw) {
  const c = document.createElement("canvas"); c.width = Math.ceil(w * CK); c.height = Math.ceil((y1 - y0) * CK);
  const g = c.getContext("2d"); g.scale(CK, CK); g.translate(SIDE, -y0); draw(g); return c;
}
function caches(s) {
  if (s.mid) return s;
  const W = s.mw + SIDE * 2, x0 = -SIDE, x1 = s.mw + SIDE;
  s.midEyes = [];
  s.mid = strip(W, MID_Y, 0, (g) => {
    drawSkyBunting(g, x0, x1, -92, 10, 0, true, 0);
    for (const it of s.sky) {
      if (it.type === "sign") drawSkySign(g, it, 0, true, null);
      else if (it.type === "clown") { const em = []; drawClownCutout(g, it, em); s.midEyes.push(...em[0][1]); }
      else if (it.type === "calliope") { const em = []; drawCalliope(g, it, 0, true, em); s.midEyes.push(...em[0][1]); }
      else if (it.type === "mascot") drawMascot(g, it, 0, true, null);
    }
  });
  s.front = strip(W, FRONT_Y, 0, (g) => drawSkyBunting(g, x0, x1, -10, 4, 0, true, 3));
  s.walk = strip(W, 0, LAKE_H, (g) => drawBoardwalk(g, x0, x1, 0, 0, true));
  return s;
}
function blitStrip(ctx, c, y0, h, x0, x1, ya, yb) { // world rows [ya, yb) of a strip that starts at y0
  const a = Math.max(ya, y0), b = Math.min(yb, y0 + h); if (b <= a) return;
  ctx.drawImage(c, (x0 + SIDE) * CK, (a - y0) * CK, (x1 - x0) * CK, (b - a) * CK, x0, a, x1 - x0, b - a);
}

/* everything past the map edge, clipped so it never draws over the map */
function drawBeyond(ctx, game, t, view, box) {
  const s = scene(game), { mw, mh } = s, red = reducedOf(view), tt = red ? 0 : t;
  if (box.x0 >= 0 && box.y0 >= 0 && box.x1 <= mw && box.y1 <= mh) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); ctx.rect(0, 0, mw, mh); ctx.clip("evenodd");
  const x0 = Math.max(box.x0, -SIDE), x1 = Math.min(box.x1, mw + SIDE), em = [];
  const cached = ctx.getTransform().a <= CK + 0.05; // phone scale: blit the baked strips
  if (cached) caches(s);
  // sides: striped canvas walls of the next tents over
  for (const [sx0, sx1] of [[box.x0, 0], [mw, box.x1]]) {
    if (sx1 <= sx0) continue;
    ctx.fillStyle = "#14060e"; ctx.fillRect(sx0, box.y0, sx1 - sx0, box.y1 - box.y0);
    for (let x = Math.floor(sx0 / 16) * 16; x < sx1; x += 16) if ((x / 16) % 2 === 0) { ctx.fillStyle = "#3a0a18"; ctx.fillRect(x, box.y0, 8, box.y1 - box.y0); }
  }
  if (box.y0 < 0 && x1 > x0) { // north: the skyline
    const ya = Math.max(box.y0, -TOPH);
    ctx.drawImage(s.far, x0 + SIDE, ya + TOPH, x1 - x0, -ya, x0, ya, x1 - x0, -ya);
    if (box.y0 < -TOPH) { ctx.fillStyle = "#07030c"; ctx.fillRect(x0, box.y0, x1 - x0, -TOPH - box.y0); }
    for (const w of s.wheels) if (w.x + w.r > x0 && w.x - w.r < x1) drawWheel(ctx, w, tt, em);
    if (cached) {
      drawBalloons(ctx, x0, x1, -190, -70, tt, red, 1, mw);
      blitStrip(ctx, s.mid, MID_Y, -MID_Y, x0, x1, ya, 0);
      for (const it of s.sky) {
        if (it.x + it.w / 2 + 20 < x0 || it.x - it.w / 2 - 20 > x1) continue;
        if (it.type === "carousel") drawCarousel(ctx, it, tt, red, em);
        else if (it.type === "sign") skySignEm(it, tt, red, em);
        else if (it.type === "calliope" && !red) drawSteam(ctx, it, tt);
      }
      const eyes = s.midEyes.filter((e) => e[0] > x0 - 30 && e[0] < x1 + 30); if (eyes.length) em.push(["eyes", eyes]);
      blitStrip(ctx, s.front, FRONT_Y, -FRONT_Y, x0, x1, ya, 0);
    } else {
      drawSkyBunting(ctx, x0, x1, -92, 10, tt, red, 0);
      drawBalloons(ctx, x0, x1, -190, -70, tt, red, 1, mw);
      for (const it of s.sky) {
        if (it.x + it.w / 2 + 20 < x0 || it.x - it.w / 2 - 20 > x1) continue;
        if (it.type === "carousel") drawCarousel(ctx, it, tt, red, em);
        else if (it.type === "sign") drawSkySign(ctx, it, tt, red, em);
        else if (it.type === "clown") drawClownCutout(ctx, it, em);
        else if (it.type === "calliope") drawCalliope(ctx, it, tt, red, em);
        else drawMascot(ctx, it, tt, red, em);
      }
      drawSkyBunting(ctx, x0, x1, -10, 4, tt, red, 3);
    }
    // night falls on all of it, heavier the further it is from the wall
    const dg = ctx.createLinearGradient(0, 0, 0, -TOPH); dg.addColorStop(0, "rgba(8,2,12,.32)"); dg.addColorStop(0.5, "rgba(8,2,12,.5)"); dg.addColorStop(1, "rgba(8,2,12,.8)");
    ctx.fillStyle = dg; ctx.fillRect(x0, ya, x1 - x0, -ya);
  }
  if (box.y1 > mh && x1 > x0) { // south: the boardwalk and the lake
    const yb = Math.min(box.y1, mh + BOTH);
    ctx.drawImage(s.lk, x0 + SIDE, 0, x1 - x0, yb - mh, x0, mh, x1 - x0, yb - mh);
    if (box.y1 > mh + BOTH) { ctx.fillStyle = "#030609"; ctx.fillRect(x0, mh + BOTH, x1 - x0, box.y1 - mh - BOTH); }
    drawLake(ctx, s, tt, red, x0, x1, em, cached);
    const dg = ctx.createLinearGradient(0, mh, 0, mh + BOTH); dg.addColorStop(0, "rgba(4,4,10,.3)"); dg.addColorStop(1, "rgba(4,4,10,.75)");
    ctx.fillStyle = dg; ctx.fillRect(x0, mh, x1 - x0, yb - mh);
  }
  if (box.x0 < 0 || box.x1 > mw) { ctx.fillStyle = "rgba(6,2,8,.45)"; if (box.x0 < 0) ctx.fillRect(box.x0, box.y0, -box.x0, box.y1 - box.y0); if (box.x1 > mw) ctx.fillRect(mw, box.y0, box.x1 - mw, box.y1 - box.y0); }
  drawEmissive(ctx, em, game.player.x, game.player.y - 20);
  ctx.restore();
}

/* ---------------------------------------------------------------- hooks */
export default {
  paint(ctx, game, api) {
    const s = scene(game);
    // the hub: the 3x3 block of booths at the centre of the fence ring
    let hub = null;
    for (let ty = 1; ty < game.h - 3 && !hub; ty++) for (let tx = 1; tx < game.w - 3 && !hub; tx++) {
      let ok = true; for (let j = 0; j < 3 && ok; j++) for (let i = 0; i < 3 && ok; i++) ok = tileAt(game, tx + i, ty + j) === "booth";
      if (ok && tileAt(game, tx - 1, ty + 1) !== "booth" && tileAt(game, tx + 3, ty + 1) !== "booth" && tileAt(game, tx + 1, ty - 1) !== "booth") hub = { x: (tx + 1.5) * TILE, y: (ty + 1.5) * TILE };
    }
    s.hub = hub;
    paintConfetti(ctx, game);
    if (hub) { paintPlatform(ctx, game, hub.x, hub.y); paintHubBase(ctx, hub.x, hub.y); }
    paintRims(ctx, game);
    paintBunting(ctx, TILE, (game.w - 1) * TILE, 21, 0); // along the north wall's valance
    for (const sg of s.signs) paintSign(ctx, sg);
    // the totem: the tall single-tile column of booths nearest the exit
    s.eyes = [];
    const cols = [];
    for (let tx = 1; tx < game.w - 1; tx++) {
      let ty = 1;
      while (ty < game.h - 1) {
        if (tileAt(game, tx, ty) === "booth" && tileAt(game, tx - 1, ty) !== "booth" && tileAt(game, tx + 1, ty) !== "booth") {
          let e = ty; while (tileAt(game, tx, e + 1) === "booth" && tileAt(game, tx - 1, e + 1) !== "booth" && tileAt(game, tx + 1, e + 1) !== "booth") e++;
          if (e - ty >= 3) cols.push({ tx, s: ty, e });
          ty = e + 1;
        } else ty++;
      }
    }
    for (const c of cols) s.eyes.push(...paintTotem(ctx, game, c.tx, c.s, c.e, api));
    // lights: colour that survives the dark, kept low so the dark still wins
    if (hub) api.lights.push({ x: hub.x, y: hub.y - 6, r: 175, color: "#ffb347", flicker: 0.1, seed: 0.31 });
    for (const c of cols) api.lights.push({ x: c.tx * TILE + 16, y: (c.s + c.e + 1) / 2 * TILE, r: 110, color: "#ff4f7a", flicker: 0.15, seed: 0.57 + c.s * 0.1 });
    // coloured pools along the long north and south walls, so the bunting and stripes read in the dark
    for (let tx = 6, k = 0; tx < game.w - 3; tx += 9, k++) for (const ty of [1, game.h - 2]) {
      if (solid(game, tx, ty)) continue;
      api.lights.push({ x: tx * TILE + 16, y: ty * TILE + (ty === 1 ? 0 : 32), r: 85, color: [C.pink, C.sky, "#ffd56a", C.lime][(k + ty) % 4], flicker: 0.12, seed: tx * 0.013 + ty });
    }
    for (const p of s.pools) api.lights.push({ x: (p.x0 + p.x1) / 2, y: (p.y0 + p.y1) / 2, r: Math.min(170, (p.x1 - p.x0) * 0.45 + 40), color: "#2fc4ff", flicker: 0.18, seed: p.x0 * 0.001 });
    for (const sg of s.signs) if (sg.w > 60) api.lights.push({ x: sg.x, y: sg.y + 10, r: 70, color: sg.col, flicker: 0.08, seed: sg.seed * 0.17 });
    for (const e of game.entities) if (e.type === "teacup") api.lights.push({ x: e.hx ?? e.x, y: (e.hy ?? e.y) - 8, r: 85, color: C.pink, flicker: 0.1, seed: (e.id || 1) * 0.07 });
  },
  backdrop(ctx, game, t, view, box) { // the void past the edges, before the darkness (glow re-lights it)
    const s = scene(game);
    if (box.y0 < 0) { ctx.fillStyle = "#1d0828"; ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, -box.y0); }
    if (box.y1 > s.mh) { ctx.fillStyle = "#081521"; ctx.fillRect(box.x0, s.mh, box.x1 - box.x0, box.y1 - s.mh); }
  },
  ambient(ctx, game, t, view, box) {
    const s = scene(game), red = reducedOf(view);
    // dunk tanks: something breathing under the water
    for (const p of s.pools) {
      if (p.x1 < box.x0 || p.x0 > box.x1 || p.y1 < box.y0 || p.y0 > box.y1) continue;
      for (let i = 0; i < 9; i++) {
        const k = red ? 0.5 : ((t * 0.45 + hash(i, p.x0, 1)) % 1), bx = p.x0 + 8 + hash(i, p.x0, 2) * (p.x1 - p.x0 - 16), by = p.y0 + 8 + hash(i, p.x0, 3) * (p.y1 - p.y0 - 16);
        ctx.strokeStyle = `rgba(190,240,255,${0.35 * (1 - k)})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(bx, by, 1 + k * 4, 0, TAU); ctx.stroke();
      }
    }
    // the hub canopy turns; the face on top does not
    const hub = s.hub;
    if (hub && hub.x + 60 > box.x0 && hub.x - 60 < box.x1 && hub.y + 60 > box.y0 && hub.y - 60 < box.y1) {
      const cs = canopy();
      ctx.save(); ctx.translate(hub.x, hub.y - 6); ctx.rotate(red ? 0.2 : t * 0.3);
      ctx.drawImage(cs.c, -cs.R, -cs.R, cs.R * 2, cs.R * 2); ctx.restore();
      ctx.drawImage(finial(), hub.x - 20, hub.y - 26, 40, 40);
    }
  },
  glow(ctx, game, t, view, box) {
    const s = scene(game), red = reducedOf(view), p = game.player;
    // neon slogans on the walls and booths
    for (const sg of s.signs) {
      if (sg.x + sg.w < box.x0 || sg.x - sg.w > box.x1 || sg.y < box.y0 - 20 || sg.y > box.y1 + 20) continue;
      const a = red ? 0.75 : 0.62 + 0.18 * Math.sin(t * 0.8 + sg.seed * 1.7) * Math.sin(t * 0.37 + sg.seed); // a slow, sick pulse; never a strobe
      drawNeon(ctx, neon(sg.text, sg.col, sg.px), sg.x, sg.y, a);
    }
    // the hub: chasing bulbs round the canopy rim, the face's eyes
    const hub = s.hub;
    if (hub && hub.x + 70 > box.x0 && hub.x - 70 < box.x1 && hub.y + 70 > box.y0 && hub.y - 70 < box.y1) {
      const em = [], step = red ? 0 : Math.floor(t * 3);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU + (red ? 0.2 : t * 0.3), on = red ? hash(i, 5) > 0.2 : (i + step) % 3 !== 0; em.push(["bulb", hub.x + Math.cos(a) * 52, hub.y - 6 + Math.sin(a) * 52, BULBS[i % 5], on ? 1 : 0.15]); }
      finial(); em.push(["eyes", finialEyes.map(([x, y, r]) => [hub.x + x, hub.y - 6 + y, r]), 0.6]);
      drawEmissive(ctx, em, p.x, p.y - 20);
    }
    if (s.eyes.length) { const e0 = s.eyes[0], e1 = s.eyes[s.eyes.length - 1]; if (e0[0] + 30 > box.x0 && e0[0] - 30 < box.x1 && e1[1] + 30 > box.y0 && e0[1] - 30 < box.y1) pupils(ctx, s.eyes, p.x, p.y - 20, 0.55); }
    drawBeyond(ctx, game, t, view, box);
  },
};
