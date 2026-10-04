/* Stage backdrop for the "midway" zone. Owned by ONE agent; see art/zones/README.md.
 *
 * The Midway, the opening stage: a carnival that is far too happy to see you.
 *  - paint:    the Fun House is a giant clown head whose open mouth is the shortcut
 *              (teeth, too many of them, on both lips); the east booth block becomes a
 *              striped prize pavilion with a grinning finial; painted slogans gone wrong
 *              stand behind the booths; a mural of grinning faces and a calliope run along
 *              the south wall; plywood cutouts stand on the fences; confetti everywhere.
 *  - backdrop: past the map edges, the carnival beyond: Ferris wheels, a coaster, big tops.
 *  - ambient:  bunting that flutters with the wind, balloons that drift against it, eyes
 *              that follow you (the Fun House, the pavilion, the cutouts).
 *  - glow:     neon that burns through the dark (FUN HOUSE, PRIZES!, FUN! that keeps
 *              losing its F), chasing marquee bulbs, the rides' lights on the skyline.
 * Every heavy piece is cached; per-frame work is culled to the view box.
 */
import { TILE, TILES } from "../../content.js";
import { TAU, hash, clamp, circle, ellipse, rgba, glowSprite, sprite } from "../util.js";

const C = {
  red: "#ff1f3d", redD: "#a3122e", pink: "#ff3fa4", yel: "#ffd23f", cyan: "#3ff0ff", vio: "#a24bff",
  org: "#ff8a1f", mint: "#5dffb0", cream: "#f6e7c8", face: "#efe4d2", ink: "#14060c", blue: "#2a48ff",
};
const FONT = "'IM Fell English SC', Georgia, serif";
const BAL = ["#ff3fa4", "#3ff0ff", "#ffd23f", "#a24bff", "#ff8a1f"]; // no red/green: those are pickup colours
const FH = 13;

/* ------------------------------------------------------------ layout (per game) */
const layouts = new WeakMap();
const tileAt = (g, tx, ty) => (tx < 0 || ty < 0 || tx >= g.w || ty >= g.h ? "tent" : g.tiles[ty * g.w + tx]);
const solid = (g, tx, ty) => !!TILES[tileAt(g, tx, ty)].solid;

function layout(game) {
  let L = layouts.get(game);
  if (L) return L;
  const g = game, W = g.w, H = g.h;
  L = { lamps: [], trees: [], signs: [], banners: [], cutouts: [], eyes: [], strings: [], bunches: [], fh: null, pav: null, neons: [], marquee: [], mw: W * TILE, mh: H * TILE };
  // the Fun House: interior tent tiles (not the border)
  let fx0 = 1e9, fx1 = -1, fy0 = 1e9, fy1 = -1;
  for (let ty = 1; ty < H - 1; ty++) for (let tx = 1; tx < W - 1; tx++) if (tileAt(g, tx, ty) === "tent") { fx0 = Math.min(fx0, tx); fx1 = Math.max(fx1, tx); fy0 = Math.min(fy0, ty); fy1 = Math.max(fy1, ty); }
  if (fx1 >= 0) {
    let mouth = -1;
    for (let ty = fy0; ty <= fy1; ty++) { let any = false; for (let tx = fx0; tx <= fx1; tx++) if (tileAt(g, tx, ty) === "tent") any = true; if (!any) { mouth = ty; break; } }
    if (mouth > 0) L.fh = { x0: fx0 * TILE, x1: (fx1 + 1) * TILE, y0: fy0 * TILE, my0: mouth * TILE, my1: (mouth + 1) * TILE, y1: (fy1 + 1) * TILE, cx: (fx0 + fx1 + 1) / 2 * TILE };
  }
  // the prize pavilion: booth tiles with booth above and below
  let px0 = 1e9, px1 = -1, py0 = 1e9, py1 = -1;
  for (let ty = 1; ty < H - 1; ty++) for (let tx = 1; tx < W - 1; tx++)
    if (tileAt(g, tx, ty) === "booth" && tileAt(g, tx, ty - 1) === "booth" && tileAt(g, tx, ty + 1) === "booth") { px0 = Math.min(px0, tx); px1 = Math.max(px1, tx); py0 = Math.min(py0, ty); py1 = Math.max(py1, ty); }
  if (px1 - px0 >= 3 && py1 - py0 >= 3) L.pav = { x0: px0 * TILE, y0: py0 * TILE, x1: (px1 + 1) * TILE, y1: (py1 + 1) * TILE, cx: (px0 + px1 + 1) / 2 * TILE, cy: (py0 + py1 + 1) / 2 * TILE, R: Math.min(px1 - px0 + 1, py1 - py0 + 1) * TILE / 2 - 8 };
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const n = tileAt(g, tx, ty);
    if (n === "lamp") L.lamps.push({ tx, ty, x: (tx + 0.5) * TILE, y: ty * TILE - 6 });
    if (n === "tree") L.trees.push({ tx, ty, x: (tx + 0.5) * TILE, y: ty * TILE + 4 });
  }
  // bunting between neighbouring lamps on the same row, if nothing solid stands between
  for (const a of L.lamps) {
    const b = L.lamps.filter((o) => o.ty === a.ty && o.tx > a.tx).sort((p, q) => p.tx - q.tx)[0];
    if (!b) continue;
    let clear = true; for (let tx = a.tx + 1; tx < b.tx; tx++) if (solid(g, tx, a.ty)) clear = false;
    if (clear) L.strings.push({ x0: a.x + 3, y0: a.y + 2, x1: b.x - 3, y1: b.y + 2, sag: 16, seed: a.tx * 7 + a.ty });
  }
  // balloon bunches: trees, and the lamps on the upper side of the lane (their balloons float over the booths)
  const minLampRow = Math.min(...L.lamps.map((l) => l.ty));
  for (const tr of L.trees) L.bunches.push({ x: tr.x + 2, y: tr.y + 6, n: 3 + ((hash(tr.tx, tr.ty, 3) * 3) | 0), seed: tr.tx * 13 + tr.ty, lift: 26 });
  for (const l of L.lamps) if (l.ty === minLampRow && hash(l.tx, l.ty, 9) < 0.75) L.bunches.push({ x: l.x + 4, y: l.y + 2, n: 3 + ((hash(l.tx, l.ty, 4) * 2) | 0), seed: l.tx * 5 + l.ty, lift: 22 });
  // signs and banners along booth rows
  const northSlogans = ["EVERYONE'S A WINNER!", "FUN!", "SMILE! WE CAN SEE YOU", "KIDS RIDE FREE", "FUN!", "NO REFUNDS ~ NO EXITS", "TRY YOUR LUCK!", "FUN!", "ALL DAY ~ ALL NIGHT ~ ALWAYS"];
  const southSlogans = ["STAY A WHILE", "HA HA HA HA HA HA", "DON'T LOOK BACK", "HAPPY HAPPY HAPPY", "WE MISSED YOU", "SMILE WIDER", "YOU'RE HOME NOW"];
  const boardCols = [[C.yel, C.redD], [C.red, C.cream], [C.cyan, "#3a0d4a"], [C.pink, C.cream], [C.org, "#2a0a10"], [C.vio, C.yel]];
  let ni = 0, si = 0;
  for (let ty = 1; ty < H - 1; ty++) {
    let tx = 1;
    while (tx < W - 5) {
      let ok = true;
      for (let k = 0; k < 4; k++) { const x = tx + k; if (tileAt(g, x, ty) !== "booth" || solid(g, x, ty + 1) || solid(g, x, ty - 1)) ok = false; }
      if (!ok) { tx++; continue; }
      const above = tileAt(g, tx, ty - 1);
      if (above === "grass") {
        const text = northSlogans[ni % northSlogans.length], col = boardCols[(ni * 5 + 1) % boardCols.length]; ni++;
        L.signs.push({ x: tx * TILE + 6, y: ty * TILE - 12, w: 4 * TILE - 12, h: 22, text, bg: col[0], fg: col[1], neon: text === "FUN!", seed: tx });
        tx += 8;
      } else {
        const text = southSlogans[si % southSlogans.length], col = boardCols[(si * 3 + 2) % boardCols.length]; si++;
        L.banners.push({ x: tx * TILE + 2, y: ty * TILE + 1, w: 4 * TILE - 4, h: 11, text, bg: col[0], fg: col[1] });
        tx += 7;
      }
    }
  }
  // plywood cutouts standing on fence runs
  let lastCut = -99, kinds = 0;
  for (let ty = 1; ty < H - 1; ty++) for (let tx = 2; tx < W - 2; tx++) {
    if (tileAt(g, tx, ty) !== "fence" || tileAt(g, tx - 1, ty) !== "fence" || tileAt(g, tx + 1, ty) !== "fence" || solid(g, tx, ty - 1)) continue;
    if (ty * 1000 + tx - lastCut < 5 || hash(tx, ty, 41) > 0.3) continue;
    lastCut = ty * 1000 + tx;
    const kind = ["clown", "mascot", "hole", "clown", "twins"][kinds++ % 5];
    const cu = { kind, x: (tx + 0.5) * TILE, y: ty * TILE + 26, seed: tx * 3 + ty };
    L.cutouts.push(cu);
    if (kind === "clown") L.eyes.push({ x: cu.x - 3.4, y: cu.y - 29, r: 2.3, p: 1.1, iris: "#1b8f3a" }, { x: cu.x + 3.4, y: cu.y - 29, r: 2.3, p: 1.1, iris: "#1b8f3a" });
    if (kind === "twins") for (const s of [-6, 6]) L.eyes.push({ x: cu.x + s - 1.8, y: cu.y - 27, r: 1.5, p: 0.7, iris: "#2a48ff" }, { x: cu.x + s + 1.8, y: cu.y - 27, r: 1.5, p: 0.7, iris: "#2a48ff" });
  }
  const fh = L.fh;
  if (fh) {
    const ey = fh.y0 + 40;
    for (const s of [-1, 1]) L.eyes.push({ x: fh.cx + s * 52, y: ey, r: 13, ry: 12, p: 8, iris: C.mint, big: true, fx: fh.cx });
  }
  if (L.pav) L.eyes.push({ x: L.pav.cx - 7, y: L.pav.cy - 6, r: 4, p: 2, iris: C.vio }, { x: L.pav.cx + 7, y: L.pav.cy - 6, r: 4, p: 2, iris: C.vio });
  layouts.set(game, L);
  return L;
}

/* ------------------------------------------------------------ small helpers */
function fitText(ctx, text, cx, cy, maxW, size, fill, stroke) {
  ctx.font = `bold ${size}px ${FONT}`;
  const w = ctx.measureText(text).width, k = w > maxW ? maxW / w : 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, 1);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.strokeText(text, 0, 0); }
  ctx.fillStyle = fill; ctx.fillText(text, 0, 0);
  ctx.restore();
  return w * k;
}
function drips(ctx, x0, x1, y, col, seed, n = 6, len = 7) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed, i, 1) * (x1 - x0), l = 2 + hash(seed, i, 2) * len;
    ctx.fillRect(x - 0.6, y, 1.2, l); circle(ctx, x, y + l, 0.95, col);
  }
}
function teeth(ctx, x0, x1, yBase, dir, len, n, seed) { // dir -1: points up, +1: points down
  const w = (x1 - x0) / n;
  // the row behind: smaller, greyer, crowding in between
  for (let i = 0; i < n - 1; i++) {
    const x = x0 + (i + 1) * w, l = len * (0.55 + 0.25 * hash(seed, i, 9));
    ctx.fillStyle = "#b8ab88"; ctx.beginPath(); ctx.moveTo(x - w * 0.45, yBase); ctx.lineTo(x, yBase + dir * l); ctx.lineTo(x + w * 0.45, yBase); ctx.fill();
  }
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w, h = hash(seed, i, 3), l = len * (0.75 + 0.35 * hash(seed, i, 4));
    if (h < 0.06) continue; // a gap
    ctx.fillStyle = h > 0.95 ? "#e0b030" : h > 0.85 ? "#cdbb8a" : "#f4ecd2";
    ctx.beginPath(); ctx.moveTo(x + 0.6, yBase); ctx.lineTo(x + w * 0.5 + (hash(seed, i, 5) - 0.5) * 2, yBase + dir * l); ctx.lineTo(x + w - 0.6, yBase); ctx.fill();
    ctx.strokeStyle = "rgba(40,10,10,.55)"; ctx.lineWidth = 0.5; ctx.stroke();
  }
}
// slow, irregular on/off for neon (never more than ~1 change a second; constant under reduced motion)
const neonOn = (t, seed, view, dutyOff = 0.82) => view.reduced || Math.sin(t * 0.71 + seed * 3.1) * Math.sin(t * 0.37 + seed * 1.7) < dutyOff;

function neonSprite(text, size, color) {
  const key = "mwneon" + text + size + color, SC = 3;
  const m = document.createElement("canvas").getContext("2d");
  m.font = `bold ${size}px ${FONT}`;
  const tw = m.measureText(text).width, w = (tw + 16) * SC, h = (size + 14) * SC;
  return sprite(key, w, h, (g) => {
    g.scale(SC, SC); g.font = `bold ${size}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
    const cx = (tw + 16) / 2, cy = (size + 14) / 2;
    g.shadowColor = color; g.shadowBlur = 7; g.strokeStyle = color; g.lineWidth = 2.2; g.strokeText(text, cx, cy);
    g.shadowBlur = 3; g.lineWidth = 1.1; g.strokeStyle = "rgba(255,255,255,.85)"; g.strokeText(text, cx, cy);
  });
}
// a bulb with a hot white core: reads as a light source from far away (glowSprite is only a soft halo)
function bulbSprite(color) {
  return sprite("mwbulb" + color, 48, 48, (g, w) => {
    const r = w / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, rgba(color, 1)); gr.addColorStop(0.3, rgba(color, 0.35)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}
function drawNeon(ctx, text, size, color, x, y, a) {
  const s = neonSprite(text, size, color);
  ctx.globalAlpha = a; ctx.drawImage(s, x - s.width / 6, y - s.height / 6, s.width / 3, s.height / 3);
}
function balloonSprite(col, face) {
  return sprite("mwbal" + col + (face ? "f" : ""), 48, 60, (g) => {
    g.scale(4, 4);
    const gr = g.createRadialGradient(4.5, 5, 0.5, 6, 7, 7);
    gr.addColorStop(0, "#fff"); gr.addColorStop(0.18, col); gr.addColorStop(1, rgba(col, 0.75));
    g.fillStyle = gr; g.beginPath(); g.ellipse(6, 7, 5.4, 6.4, 0, 0, TAU); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(5, 13.2); g.lineTo(7, 13.2); g.lineTo(6, 12); g.fill();
    if (face) { // a smiley, drawn on in marker, with too many teeth
      g.fillStyle = "#14060c"; g.beginPath(); g.ellipse(4.2, 5.6, 0.7, 1.1, 0, 0, TAU); g.ellipse(7.8, 5.6, 0.7, 1.1, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(2.4, 8); g.quadraticCurveTo(6, 12.4, 9.6, 8); g.quadraticCurveTo(6, 10, 2.4, 8); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 0.35; g.beginPath();
      for (let i = 0; i < 7; i++) { const x = 3.2 + i; g.moveTo(x, 8.6 + Math.abs(i - 3) * -0.2); g.lineTo(x, 9.8 - Math.abs(i - 3) * 0.25); }
      g.stroke();
    }
  });
}

/* ------------------------------------------------------------ paint: the Fun House */
function paintFunHouse(ctx, fh, api) {
  const { x0, x1, y0, my0, my1, y1, cx } = fh, fx0 = x0 + 12, fx1 = x1 - 12;
  // ---- upper block: hat, hair, face, eyes, nose, the upper lip
  ctx.fillStyle = "#1a0710"; ctx.fillRect(x0, y0, x1 - x0, my0 - y0);
  // frizz: candy-coloured tufts at the temples
  for (let i = 0; i < 14; i++) for (const s of [-1, 1]) {
    const bx = s < 0 ? x0 + 10 : x1 - 10, by = y0 + 14 + i * 5.5;
    circle(ctx, bx + s * hash(i, s, 1) * 6, by, 7 + hash(i, s, 2) * 4, i % 3 === 0 ? C.org : i % 3 === 1 ? C.pink : "#ff5a1f");
  }
  // the face
  ctx.fillStyle = C.face; ctx.beginPath();
  ctx.moveTo(fx0, my0); ctx.lineTo(fx0, y0 + 22); ctx.quadraticCurveTo(fx0, y0 + 2, fx0 + 26, y0 + 2); ctx.lineTo(fx1 - 26, y0 + 2); ctx.quadraticCurveTo(fx1, y0 + 2, fx1, y0 + 22); ctx.lineTo(fx1, my0); ctx.fill();
  const shade = ctx.createLinearGradient(0, y0, 0, my0); shade.addColorStop(0, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(60,0,20,.22)");
  ctx.fillStyle = shade; ctx.fill();
  // crazing in the old paint
  ctx.strokeStyle = "rgba(90,60,50,.35)"; ctx.lineWidth = 0.5;
  for (let i = 0; i < 14; i++) { const sx = fx0 + hash(i, 7, 1) * (fx1 - fx0), sy = y0 + 4 + hash(i, 7, 2) * (my0 - y0 - 20); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4 - hash(i, 7, 3) * 8, sy + 3 + hash(i, 7, 4) * 5); ctx.lineTo(sx + 6 - hash(i, 7, 5) * 12, sy + 7 + hash(i, 7, 6) * 4); ctx.stroke(); }
  const ey = y0 + 40;
  for (const s of [-1, 1]) {
    const ex = cx + s * 52;
    // diamond makeup, top and bottom, and the mascara that ran
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(ex, ey - 32); ctx.lineTo(ex + 8, ey - 14); ctx.lineTo(ex, ey + 30); ctx.lineTo(ex - 8, ey + 14); ctx.fill();
    ctx.strokeStyle = "rgba(10,4,20,.8)"; ctx.lineWidth = 1.3;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); const tx = ex - 8 + k * 7 + s * 2; ctx.moveTo(tx, ey + 10); ctx.bezierCurveTo(tx + 1, ey + 20, tx - 1, ey + 28, tx + 0.5, my0 - 20 - k * 3); ctx.stroke(); }
    // brow: high, arched, surprised to see you
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(ex - 22, ey - 16); ctx.quadraticCurveTo(ex - s * 4, ey - 34, ex + 22, ey - 18); ctx.stroke();
    // sclera, bloodshot (iris and pupil are drawn live, so they can follow you)
    ellipse(ctx, ex, ey, 22, 14, "#fbf6ea");
    ctx.strokeStyle = "rgba(200,20,40,.7)"; ctx.lineWidth = 0.6;
    for (let k = 0; k < 7; k++) { const a = hash(k, s, 8) * TAU; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 21, ey + Math.sin(a) * 13); ctx.quadraticCurveTo(ex + Math.cos(a + 0.3) * 15, ey + Math.sin(a + 0.3) * 9, ex + Math.cos(a) * 11, ey + Math.sin(a) * 7); ctx.stroke(); }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(ex, ey, 22, 14, 0, 0, TAU); ctx.stroke();
    // blush
    ctx.fillStyle = "rgba(255,63,164,.45)"; ctx.beginPath(); ctx.arc(cx + s * 86, y0 + 66, 12, 0, TAU); ctx.fill();
  }
  // nose: a red ball, shiny
  circle(ctx, cx, y0 + 64, 14, C.red); circle(ctx, cx - 4, y0 + 59, 4, "rgba(255,255,255,.55)"); circle(ctx, cx + 5, y0 + 70, 3, "rgba(80,0,10,.35)");
  // the grin: corner to corner, curling up past the cheeks
  ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath();
  ctx.moveTo(fx0 + 4, my0 - 40); ctx.quadraticCurveTo(fx0 + 10, my0 - 14, fx0 + 28, my0 - 13); ctx.lineTo(fx1 - 28, my0 - 13); ctx.quadraticCurveTo(fx1 - 10, my0 - 14, fx1 - 4, my0 - 40); ctx.stroke();
  ctx.fillStyle = "#3a0410"; ctx.fillRect(fx0 + 22, my0 - 11, fx1 - fx0 - 44, 11); // gum shadow
  teeth(ctx, fx0 + 22, fx1 - 22, my0 - 11, 1, 10, 22, 31);
  // the hat: a striped cone over the booths, with a pompom
  const hb = y0 + 8, ha = y0 - 34;
  for (let i = 0; i < 6; i++) {
    const k0 = i / 6, k1 = (i + 1) / 6;
    ctx.fillStyle = i % 2 ? C.yel : C.vio;
    const lx0 = cx - 28 + 28 * k0, lx1 = cx - 28 + 28 * k1, rx0 = cx + 28 - 28 * k0, rx1 = cx + 28 - 28 * k1;
    const yA = hb + (ha - hb) * k0, yB = hb + (ha - hb) * k1;
    ctx.beginPath(); ctx.moveTo(lx0, yA); ctx.lineTo(rx0, yA); ctx.lineTo(rx1, yB); ctx.lineTo(lx1, yB); ctx.fill();
  }
  ctx.fillStyle = C.pink; for (let i = 0; i < 8; i++) circle(ctx, cx - 26 + i * 7.4, hb, 3.6, i % 2 ? C.pink : C.cyan);
  circle(ctx, cx, ha, 7, "#fff1f8"); circle(ctx, cx - 2, ha - 2, 2.2, "#fff");
  // ---- lower block: lower lip, chin, the marquee, the ruff
  ctx.fillStyle = "#1a0710"; ctx.fillRect(x0, my1, x1 - x0, y1 - my1);
  // ruff: a frilled collar along the bottom
  for (let i = 0; i < 16; i++) { const rx = x0 + 4 + i * ((x1 - x0 - 8) / 15); circle(ctx, rx, y1 - 10, 11, i % 2 ? C.yel : C.pink); circle(ctx, rx, y1 - 8, 6, i % 2 ? "#c99a10" : "#b81c74"); }
  ctx.fillStyle = C.face; ctx.beginPath();
  ctx.moveTo(fx0, my1); ctx.lineTo(fx1, my1); ctx.lineTo(fx1, y1 - 40); ctx.quadraticCurveTo(fx1, y1 - 16, cx + 40, y1 - 16); ctx.lineTo(cx - 40, y1 - 16); ctx.quadraticCurveTo(fx0, y1 - 16, fx0, y1 - 40); ctx.fill();
  ctx.fillStyle = "#3a0410"; ctx.fillRect(fx0 + 22, my1, fx1 - fx0 - 44, 10);
  teeth(ctx, fx0 + 22, fx1 - 22, my1 + 10, -1, 9, 22, 57);
  ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(fx0 + 18, my1 + 12); ctx.quadraticCurveTo(cx, my1 + 22, fx1 - 18, my1 + 12); ctx.stroke();
  // it has been eating: drips from the corners of the mouth
  drips(ctx, fx0 + 16, fx0 + 40, my1 + 14, "#8b0a1e", 3, 4, 26); drips(ctx, fx1 - 40, fx1 - 16, my1 + 14, "#8b0a1e", 4, 4, 26);
  // the marquee board on the chin; letters are dark glass tubes until the glow pass lights them
  const bw = 150, bh = 30, bx = cx - bw / 2, by = my1 + 30;
  ctx.fillStyle = "#c9a54a"; ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
  ctx.fillStyle = "#2a0616"; ctx.fillRect(bx, by, bw, bh);
  fitText(ctx, "FUN HOUSE", cx, by + bh / 2 + 1, bw - 16, 20, "#5a1838", "#1a0410");
  for (let i = 0; i <= 12; i++) { const b = { x: bx + i * bw / 12, y: by - 3, color: i % 2 ? C.yel : C.pink, seed: hash(i, 1, 77), state: "on" }; api.bulbs.push(b); fh.marquee = fh.marquee || []; fh.marquee.push(b); }
  for (let i = 0; i <= 12; i++) { const b = { x: bx + i * bw / 12, y: by + bh + 3, color: i % 2 ? C.pink : C.yel, seed: hash(i, 2, 77), state: hash(i, 2, 78) < 0.15 ? "dead" : "on" }; api.bulbs.push(b); fh.marquee.push(b); }
  fitText(ctx, "LAUGH UNTIL IT STOPS", cx, by + bh + 13, bw, 8, "#8b0a1e");
  // lip bulbs: the mouth is a lit doorway
  fh.lips = [];
  for (let i = 0; i < 16; i++) {
    const x = fx0 + 18 + i * ((fx1 - fx0 - 36) / 15);
    fh.lips.push({ x, y: my0 - 15 }, { x, y: my1 + 16 });
  }
  api.lights.push({ x: cx, y: y0 + 36, r: 120, color: C.pink, flicker: 0.1, seed: 0.31 });
  api.lights.push({ x: cx, y: my1 + 46, r: 95, color: C.yel, flicker: 0.06, seed: 0.62 });
}

/* ------------------------------------------------------------ paint: the prize pavilion */
function paintPavilion(ctx, pv, api) {
  const { x0, y0, x1, y1, cx, cy, R } = pv;
  ctx.fillStyle = "#1c0a16"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // guy ropes to the corners
  ctx.strokeStyle = "#6a5a40"; ctx.lineWidth = 0.8;
  for (const [ax, ay] of [[x0 + 4, y0 + 4], [x1 - 4, y0 + 4], [x0 + 4, y1 - 4], [x1 - 4, y1 - 4]]) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx + (ax - cx) * 0.62, cy + (ay - cy) * 0.62); ctx.stroke(); circle(ctx, ax, ay, 2, "#3a2a1a"); }
  // scalloped rim
  const NS = 36;
  for (let i = 0; i < NS; i++) { const a = (i + 0.5) / NS * TAU; circle(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 9, i % 2 ? C.yel : C.red); }
  // the canopy: wedges
  const NW = 20;
  for (let i = 0; i < NW; i++) {
    const a0 = i / NW * TAU, a1 = (i + 1) / NW * TAU;
    ctx.fillStyle = i % 2 ? C.cream : i % 4 === 0 ? C.red : C.vio;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
  }
  const sh = ctx.createRadialGradient(cx - 20, cy - 24, 10, cx, cy, R);
  sh.addColorStop(0, "rgba(255,255,255,.12)"); sh.addColorStop(0.7, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(30,0,20,.45)");
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
  // water stains and a long slit someone cut to get out
  ctx.fillStyle = "rgba(40,16,8,.35)"; ctx.beginPath(); ctx.ellipse(cx + 44, cy + 30, 16, 10, 0.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#07020a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 70, cy + 20); ctx.lineTo(cx - 52, cy + 44); ctx.stroke();
  // lettered band
  const bandR = R - 22;
  ctx.strokeStyle = "#3a0d4a"; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, bandR, 0, TAU); ctx.stroke();
  ctx.strokeStyle = C.yel; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, bandR - 8, 0, TAU); ctx.arc(cx, cy, bandR + 8, 0, TAU); ctx.stroke();
  const ring = "PRIZES FOR EVERYONE * EVERYONE WINS * NOBODY LEAVES * ";
  ctx.font = `bold 10px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = C.yel;
  for (let i = 0; i < ring.length; i++) {
    const a = -Math.PI / 2 + i / ring.length * TAU;
    ctx.save(); ctx.translate(cx + Math.cos(a) * bandR, cy + Math.sin(a) * bandR); ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = ring[i] === "*" ? C.pink : C.yel; ctx.fillText(ring[i] === "*" ? "★" : ring[i], 0, 0.5); ctx.restore();
  }
  // the finial: a painted face looking up at you; eyes are drawn live
  circle(ctx, cx, cy, 30, "#2a0616"); circle(ctx, cx, cy, 27, C.face);
  ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(cx - 20, cy + 6); ctx.quadraticCurveTo(cx, cy + 28, cx + 20, cy + 6); ctx.quadraticCurveTo(cx, cy + 14, cx - 20, cy + 6); ctx.fill();
  ctx.fillStyle = "#f4ecd2"; for (let i = 0; i < 9; i++) { const tx = cx - 15 + i * 3.7; ctx.beginPath(); ctx.moveTo(tx, cy + 10 + Math.abs(i - 4) * -0.6); ctx.lineTo(tx + 1.6, cy + 14); ctx.lineTo(tx + 3.2, cy + 10 + Math.abs(i - 4) * -0.6); ctx.fill(); }
  circle(ctx, cx, cy + 2, 4, C.red);
  for (const s of [-7, 7]) { ellipse(ctx, cx + s, cy - 6, 5.5, 5, "#fbf6ea"); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx + s, cy - 6, 5.5, 5, 0, 0, TAU); ctx.stroke(); }
  // bulbs around the rim
  pv.rim = [];
  for (let i = 0; i < 28; i++) {
    const a = i / 28 * TAU, b = { x: cx + Math.cos(a) * (R - 6), y: cy + Math.sin(a) * (R - 6), color: [C.yel, C.pink, C.cyan, C.yel][i % 4], seed: hash(i, 5, 7), state: hash(i, 5, 8) < 0.12 ? "dead" : hash(i, 5, 8) < 0.25 ? "flicker" : "on" };
    api.bulbs.push(b); pv.rim.push(b);
  }
  api.lights.push({ x: cx, y: cy, r: 125, color: C.vio, flicker: 0.05, seed: 0.13 });
  api.lights.push({ x: x0 - 10, y: cy, r: 80, color: C.pink, seed: 0.4 });
}

/* ------------------------------------------------------------ paint: signs, banners, cutouts */
function paintSign(ctx, s, api) {
  const { x, y, w, h } = s;
  // posts down into the booth
  ctx.fillStyle = "#2a1a10"; ctx.fillRect(x + 8, y + h - 2, 3, 12); ctx.fillRect(x + w - 11, y + h - 2, 3, 12);
  if (s.neon) { // a neon sign's dark rack: the glow pass draws the letters
    ctx.fillStyle = "#160812"; ctx.fillRect(x + w / 2 - 30, y, 60, h);
    ctx.strokeStyle = "#3a2030"; ctx.lineWidth = 1; ctx.strokeRect(x + w / 2 - 30, y, 60, h);
    fitText(ctx, "FUN!", x + w / 2, y + h / 2 + 1, 52, 18, "#4a1830");
    api.lights.push({ x: x + w / 2, y: y + h / 2 + 6, r: 70, color: C.pink, flicker: 0.15, seed: s.seed * 0.01 });
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = s.bg; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(x, y, w, 2);
  ctx.strokeStyle = s.fg; ctx.lineWidth = 1.2; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  // peeling: a corner of the paint gone
  ctx.fillStyle = "#6a4a30"; ctx.beginPath(); ctx.moveTo(x + w, y + h); ctx.lineTo(x + w - 10, y + h); ctx.lineTo(x + w, y + h - 7); ctx.fill();
  fitText(ctx, s.text, x + w / 2, y + h / 2 + 1, w - 10, 11, s.fg);
  drips(ctx, x + 10, x + w - 10, y + h - 4, s.fg, s.seed, 7, 9);
  for (const bx of [x + 3, x + w - 3]) api.bulbs.push({ x: bx, y: y - 1, color: C.yel, seed: hash(bx, y, 1), state: hash(bx, y, 2) < 0.3 ? "flicker" : "on" });
  api.lights.push({ x: x + w / 2, y: y + h / 2, r: 46, color: s.bg, seed: s.seed * 0.013 });
}
function paintBanner(ctx, b) {
  const { x, y, w, h } = b;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 1, y + 2, w, h);
  ctx.fillStyle = b.bg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 4, y + h / 2); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x + 4, y + h / 2); ctx.fill();
  fitText(ctx, b.text, x + w / 2, y + h / 2 + 0.5, w - 14, 8, b.fg);
}
function paintCutout(ctx, c) {
  const { x, y } = c;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#3a2616"; ctx.fillRect(-1, -6, 2, 6); // the prop stick
  if (c.kind === "clown") {
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(0, -16, 10.5, 13, 0, 0, TAU); ctx.fill(); // plywood edge
    ctx.fillStyle = C.yel; ctx.fillRect(-10, -18, 20, 12); ctx.fillStyle = C.red; for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 5, -18, 2.5, 12); // striped body
    for (const s of [-1, 1]) { ctx.fillStyle = C.pink; ctx.beginPath(); ctx.ellipse(s * 11, -16, 3.5, 7, s * 0.6, 0, TAU); ctx.fill(); circle(ctx, s * 14, -21, 2.6, C.face); } // arms up: hooray
    circle(ctx, -6, -32, 5, C.org); circle(ctx, 6, -32, 5, C.org);
    circle(ctx, 0, -28, 8, C.face);
    ellipse(ctx, -3.4, -29, 2.4, 2.6, "#fff"); ellipse(ctx, 3.4, -29, 2.4, 2.6, "#fff");
    circle(ctx, 0, -26, 1.6, C.red);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(-6, -24.5); ctx.quadraticCurveTo(0, -18, 6, -24.5); ctx.quadraticCurveTo(0, -21.5, -6, -24.5); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.4; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(-4.2 + i * 1.7, -23.6); ctx.lineTo(-4.2 + i * 1.7, -22.2); } ctx.stroke();
  } else if (c.kind === "mascot") { // the bear, waving, with no face at all
    ellipse(ctx, 0, -14, 9, 11, "#8a5a30"); ellipse(ctx, 0, -12, 5, 7, "#c89a60");
    circle(ctx, -7, -35, 3.6, "#8a5a30"); circle(ctx, 7, -35, 3.6, "#8a5a30");
    circle(ctx, 0, -29, 8.5, "#8a5a30"); ellipse(ctx, 0, -28, 6, 6.4, "#d8b688");
    ctx.strokeStyle = "#8a5a30"; ctx.lineWidth = 3.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(13, -30); ctx.stroke();
    ctx.fillStyle = C.pink; ctx.fillRect(-9, -21, 18, 3); fitText(ctx, "HUG ME", 0, -19.4, 16, 3, "#fff");
  } else if (c.kind === "hole") { // stick your face in: the strongman, the hole is dark, something is in it
    ctx.fillStyle = C.cyan; ctx.fillRect(-11, -36, 22, 31); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.strokeRect(-11, -36, 22, 31);
    ctx.fillStyle = C.red; ctx.fillRect(-8, -20, 16, 10); ctx.fillStyle = C.yel; ctx.fillRect(-8, -16, 16, 1.6);
    circle(ctx, 0, -27, 5, "#050204");
    fitText(ctx, "YOUR FACE", 0, -33, 18, 3.6, C.redD);
  } else { // twins: two little painted girls, holding hands, matching smiles
    for (const s of [-6, 6]) {
      ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(s - 5, -8); ctx.lineTo(s + 5, -8); ctx.lineTo(s + 3, -20); ctx.lineTo(s - 3, -20); ctx.fill();
      circle(ctx, s, -26, 5, C.face); ctx.fillStyle = "#3a1a0a"; ctx.fillRect(s - 5, -31, 10, 3);
      ellipse(ctx, s - 1.8, -27, 1.6, 1.7, "#fff"); ellipse(ctx, s + 1.8, -27, 1.6, 1.7, "#fff");
      ctx.strokeStyle = C.red; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(s, -25.5, 2.6, 0.2, Math.PI - 0.2); ctx.stroke();
    }
    ctx.strokeStyle = C.face; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, -16); ctx.lineTo(2, -16); ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------ paint: walls and floor */
function paintBorders(ctx, game, L, api) {
  const { mw, mh } = L;
  // top border: a garland of pennants on its front face and WELCOME boards on top
  ctx.strokeStyle = "#141010"; ctx.lineWidth = 0.6;
  for (let x = TILE; x < mw - TILE; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 19); ctx.quadraticCurveTo(x + 32, 25, x + 64, 19); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const k = (i + 0.5) / 7, px = x + 64 * k, py = 19 + 6 * 4 * k * (1 - k) * 0.95;
      ctx.fillStyle = BAL[(i + x / 64) % BAL.length | 0] || C.yel; ctx.beginPath(); ctx.moveTo(px - 3.4, py); ctx.lineTo(px + 3.4, py); ctx.lineTo(px, py + 7); ctx.fill();
    }
  }
  for (let x = TILE + 16, i = 0; x < mw - TILE; x += 32, i++) {
    const sd = hash(i, 3, 501);
    api.bulbs.push({ x, y: 20, color: [C.yel, C.pink, C.cyan, C.vio][i % 4], seed: sd, state: sd < 0.2 ? "dead" : sd < 0.32 ? "flicker" : "on" });
  }
  const welcome = ["WELCOME!", "WELCOME BACK!", "WELCOME HOME", "WELCOME!", "WELCOME!!!"];
  for (let i = 0, x = 7 * TILE; x < mw - 6 * TILE; x += 17 * TILE, i++) {
    ctx.fillStyle = C.ink; ctx.fillRect(x - 1, 1, 98, 16);
    ctx.fillStyle = i % 2 ? C.cyan : C.yel; ctx.fillRect(x, 2, 96, 14);
    fitText(ctx, welcome[i % welcome.length], x + 48, 9.5, 88, 10, C.redD);
    drips(ctx, x + 8, x + 88, 14, C.redD, i + 40, 5, 6);
    api.lights.push({ x: x + 48, y: 14, r: 60, color: i % 2 ? C.cyan : C.yel, seed: i * 0.21 });
  }
  // bottom border: a mural of grinning faces, and the calliope
  const y0 = mh - TILE;
  ctx.fillStyle = "#e8d6b0"; ctx.fillRect(TILE, y0 + 3, mw - 2 * TILE, TILE - 6);
  ctx.fillStyle = C.red; ctx.fillRect(TILE, y0 + 3, mw - 2 * TILE, 2); ctx.fillRect(TILE, y0 + TILE - 5, mw - 2 * TILE, 2);
  for (let x = TILE + 16, i = 0; x < mw - TILE; x += 32, i++) {
    const sd = hash(i, 4, 501);
    api.bulbs.push({ x, y: y0 + 4, color: [C.pink, C.yel, C.cyan, C.org][i % 4], seed: sd, state: sd < 0.2 ? "dead" : sd < 0.32 ? "flicker" : "on" });
  }
  const calX = Math.round(mw * 0.47);
  const words = ["SMILE", "HA HA HA", "SMILE", "LAUGH!", "SMILE", "HA HA HA"];
  let wi = 0;
  for (let x = TILE * 3; x < mw - TILE * 3; x += TILE * 7) {
    if (Math.abs(x - calX) < TILE * 5) continue;
    const fy = y0 + 16, fx = x;
    circle(ctx, fx, fy, 11, i2c(wi)); circle(ctx, fx, fy, 9.5, C.face);
    ctx.fillStyle = "#050204"; ctx.beginPath(); ctx.ellipse(fx - 3.5, fy - 3, 1.4, 2.2, 0, 0, TAU); ctx.ellipse(fx + 3.5, fy - 3, 1.4, 2.2, 0, 0, TAU); ctx.fill();
    // the smile is wider than the face
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(fx - 15, fy - 1); ctx.quadraticCurveTo(fx, fy + 14, fx + 15, fy - 1); ctx.quadraticCurveTo(fx, fy + 6, fx - 15, fy - 1); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = 0; i < 11; i++) { const tx = fx - 10 + i * 2; ctx.moveTo(tx, fy + 3.6 - Math.abs(i - 5) * 0.3); ctx.lineTo(tx, fy + 6.2 - Math.abs(i - 5) * 0.32); } ctx.stroke();
    const wc = ["#c0122c", "#6a1aa8", "#d0168a"][wi % 3];
    fitText(ctx, words[wi % words.length], x + TILE * 3.5, y0 + 15, TILE * 4, 14, wc, C.yel);
    drips(ctx, x + TILE * 2, x + TILE * 5, y0 + 21, wc, wi + 90, 6, 5);
    api.lights.push({ x: fx, y: fy - 10, r: 62, color: wi % 2 ? C.red : i2c(wi), flicker: 0.25, seed: wi * 0.17 });
    api.lights.push({ x: x + TILE * 3.5, y: y0 - 4, r: 48, color: C.yel, seed: wi * 0.29 });
    wi++;
  }
  // the calliope: brass pipes against the south wall, a painted wagon front
  ctx.fillStyle = "#5a0e3a"; ctx.fillRect(calX - 78, y0 + 2, 156, TILE - 4);
  ctx.strokeStyle = C.yel; ctx.lineWidth = 1.2; ctx.strokeRect(calX - 76, y0 + 4, 152, TILE - 8);
  for (let i = 0; i < 17; i++) {
    const px = calX - 64 + i * 8, ph = 8 + Math.abs(Math.sin(i * 0.55)) * 18 + (8 - Math.abs(i - 8)) * 0.6;
    const gr = ctx.createLinearGradient(px - 2.5, 0, px + 2.5, 0); gr.addColorStop(0, "#7a5a18"); gr.addColorStop(0.4, "#f6d27a"); gr.addColorStop(1, "#6a4a10");
    ctx.fillStyle = gr; ctx.fillRect(px - 2.5, y0 + TILE - 6 - ph, 5, ph);
    ctx.fillStyle = "#1a0a04"; ctx.fillRect(px - 1.6, y0 + TILE - 6 - ph + 3, 3.2, 1.6);
  }
  fitText(ctx, "CALLIOPE", calX, y0 + TILE - 6, 60, 6, C.yel);
  api.lights.push({ x: calX, y: y0 + 2, r: 85, color: C.yel, flicker: 0.12, seed: 0.77 });
}
function i2c(i) { return [C.pink, C.cyan, C.yel, C.vio, C.org][((i % 5) + 5) % 5]; }

function paintFloor(ctx, game, L) {
  const conf = [C.pink, C.cyan, C.yel, C.vio, C.org, "#ffffff"];
  for (let ty = 1; ty < game.h - 1; ty++) for (let tx = 1; tx < game.w - 1; tx++) {
    const n = tileAt(game, tx, ty);
    if (TILES[n].solid || n === "exit" || n === "door") continue;
    const nearWall = solid(game, tx, ty - 1) || solid(game, tx, ty + 1) || solid(game, tx - 1, ty) || solid(game, tx + 1, ty);
    const cnt = Math.floor(hash(tx, ty, 301) * (nearWall ? 6 : 3));
    for (let i = 0; i < cnt; i++) {
      const x = tx * TILE + hash(tx, ty, 310 + i) * TILE, y = ty * TILE + hash(tx, ty, 320 + i) * TILE;
      ctx.save(); ctx.translate(x, y); ctx.rotate(hash(tx, ty, 330 + i) * TAU);
      ctx.globalAlpha = 0.55; ctx.fillStyle = conf[(hash(tx, ty, 340 + i) * conf.length) | 0]; ctx.fillRect(-1, -0.5, 2, 1.1);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
  // a big clown shoe's prints, wandering, too far apart for walking
  const trails = [[6, 5, 1], [44, 17, 1], [60, 21, -1]];
  for (const [sx, sy, dir] of trails) for (let i = 0; i < 9; i++) {
    const x = (sx + i * 1.4 * dir) * TILE + 16, y = sy * TILE + 16 + (i % 2 ? 7 : -7) + Math.sin(i * 0.7) * 6;
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (solid(game, tx, ty)) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(dir > 0 ? 0 : Math.PI);
    ctx.fillStyle = "rgba(20,8,6,.35)"; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-11, 0, 3.4, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/* ------------------------------------------------------------ backdrop: the carnival beyond */
function wheelSprite(R, neon) {
  return sprite("mwwheel" + R + (neon ? "n" : ""), (R + 4) * 4, (R + 4) * 4, (g, w) => {
    g.scale(2, 2); const c = R + 4;
    g.strokeStyle = neon ? C.cyan : "#2a1430"; g.lineWidth = neon ? 1.2 : 2.4;
    g.beginPath(); g.arc(c, c, R, 0, TAU); g.stroke();
    g.beginPath(); g.arc(c, c, R * 0.8, 0, TAU); g.stroke();
    g.lineWidth = neon ? 0.7 : 1.2; g.strokeStyle = neon ? C.pink : "#24102a";
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * R, c + Math.sin(a) * R); g.stroke(); }
    g.fillStyle = neon ? C.yel : "#3a1a40"; g.beginPath(); g.arc(c, c, 5, 0, TAU); g.fill();
  });
}
function skyline(mw) { // fixed scenery north of the map
  const rides = [];
  for (let x = -260; x < mw + 260; x += 150) {
    const h = hash(x, 1, 9);
    rides.push({ kind: "tent", x: x + h * 60, h: 26 + h * 34, w: 70 + hash(x, 2, 9) * 50, seed: x });
  }
  rides.push({ kind: "wheel", x: mw * 0.22, R: 82, cy: -96 }, { kind: "wheel", x: mw * 0.78, R: 70, cy: -84 });
  rides.push({ kind: "coaster", x0: mw * 0.4, x1: mw * 0.62 });
  return rides;
}
const skyCache = new WeakMap();
function sky(L) { let s = skyCache.get(L); if (!s) { s = skyline(L.mw); skyCache.set(L, s); } return s; }

function backdrop(ctx, game, t, view, box) {
  const L = layout(game), { mw, mh } = L;
  if (box.x0 >= 0 && box.y0 >= 0 && box.x1 <= mw && box.y1 <= mh) return;
  // night sky over the fairground, bruised red at the horizon
  const gr = ctx.createLinearGradient(0, -170, 0, 0);
  gr.addColorStop(0, "#0a0410"); gr.addColorStop(0.7, "#2a0a26"); gr.addColorStop(1, "#4a0e22");
  ctx.fillStyle = gr; ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
  if (box.y0 < 0) { // north: the skyline
    const spin = t * (view.reduced ? 0.01 : 0.06);
    for (const r of sky(L)) {
      if (r.kind === "tent") {
        if (r.x + r.w < box.x0 || r.x - r.w > box.x1) continue;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? "#3a1828" : "#5a0e1e"; ctx.beginPath();
          ctx.moveTo(r.x, -r.h); ctx.lineTo(r.x - r.w / 2 + i * r.w / 6, 0); ctx.lineTo(r.x - r.w / 2 + (i + 1) * r.w / 6, 0); ctx.fill();
        }
        ctx.strokeStyle = "#1a0810"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r.x, -r.h); ctx.lineTo(r.x, -r.h - 10); ctx.stroke();
      } else if (r.kind === "wheel") {
        if (r.x + r.R < box.x0 || r.x - r.R > box.x1) continue;
        ctx.strokeStyle = "#1e0c22"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(r.x - r.R * 0.6, 0); ctx.lineTo(r.x, r.cy); ctx.lineTo(r.x + r.R * 0.6, 0); ctx.stroke();
        const s = wheelSprite(r.R, false);
        ctx.save(); ctx.translate(r.x, r.cy); ctx.rotate(spin); ctx.drawImage(s, -s.width / 4, -s.height / 4, s.width / 2, s.height / 2); ctx.restore();
        for (let i = 0; i < 8; i++) { const a = spin + i / 8 * TAU; const gx = r.x + Math.cos(a) * r.R, gy = r.cy + Math.sin(a) * r.R; ctx.fillStyle = i % 2 ? "#4a1a3a" : "#2a2a4a"; ctx.fillRect(gx - 5, gy + 1, 10, 8); }
      } else if (r.kind === "coaster") {
        if (r.x1 < box.x0 || r.x0 > box.x1) continue;
        ctx.strokeStyle = "#1e0c1a"; ctx.lineWidth = 1;
        for (let x = r.x0; x <= r.x1; x += 12) { const y = coasterY(r, x); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, 0); ctx.moveTo(x, y); ctx.lineTo(x + 12, 0); ctx.stroke(); }
        ctx.lineWidth = 2.4; ctx.beginPath(); for (let x = r.x0; x <= r.x1; x += 6) { const y = coasterY(r, x); x === r.x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      }
    }
  }
  // south / west / east: big-top canopies seen from above, crowding the fence line
  for (const c of canopies(L)) {
    if (c.x + c.r < box.x0 || c.x - c.r > box.x1 || c.y + c.r < box.y0 || c.y - c.r > box.y1) continue;
    const s = canopySprite(c.r, c.col);
    ctx.drawImage(s, c.x - c.r - 6, c.y - c.r - 6, (c.r + 6) * 2, (c.r + 6) * 2);
  }
}
const coasterY = (r, x) => { const k = (x - r.x0) / (r.x1 - r.x0); return -18 - 44 * Math.abs(Math.sin(k * Math.PI * 2.2)) * (1 - 0.4 * k); };
const canCache = new WeakMap();
function canopies(L) {
  let c = canCache.get(L); if (c) return c;
  c = []; const { mw, mh } = L, cols = [C.red, C.vio, C.cyan, C.org, C.pink];
  for (let x = -60, i = 0; x < mw + 120; x += 170, i++) c.push({ x: x + hash(i, 1, 3) * 50, y: mh + 64 + hash(i, 2, 3) * 30, r: 52 + hash(i, 3, 3) * 26, col: cols[i % 5] });
  for (let y = -40, i = 0; y < mh + 80; y += 160, i++) { c.push({ x: -66 - hash(i, 4, 3) * 20, y, r: 50, col: cols[(i + 2) % 5] }); c.push({ x: mw + 66 + hash(i, 5, 3) * 20, y: y + 60, r: 50, col: cols[(i + 3) % 5] }); }
  canCache.set(L, c); return c;
}
function canopySprite(r, col) {
  return sprite("mwcan" + r.toFixed(0) + col, (r + 6) * 4, (r + 6) * 4, (g) => {
    g.scale(2, 2); const c = r + 6;
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? "#3a2a30" : rgba(col, 0.55); g.beginPath(); g.moveTo(c, c); g.arc(c, c, r, i / 14 * TAU, (i + 1) / 14 * TAU); g.closePath(); g.fill(); }
    const sh = g.createRadialGradient(c, c, 4, c, c, r); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,.5)");
    g.fillStyle = sh; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill();
    g.fillStyle = "#c9a54a"; g.beginPath(); g.arc(c, c, 3, 0, TAU); g.fill();
  });
}

/* ------------------------------------------------------------ ambient: wind, balloons, eyes */
// the Fun House blinks: slowly, about every 5 s, the right eye a beat behind the left (never under reduced motion)
const eyeShut = (e, t, view) => !view.reduced && ((t + (e.x > (e.fx || 0) ? 0.22 : 0)) % 5.3) < 0.2;
function ambient(ctx, game, t, view, box) {
  const L = layout(game), red = view.reduced, wt = red ? t * 0.15 : t;
  const inBox = (x, y, m = 40) => x > box.x0 - m && x < box.x1 + m && y > box.y0 - m && y < box.y1 + m;
  // bunting across the lane, lamp to lamp; the wind blows east
  for (const s of L.strings) {
    if (s.x1 < box.x0 || s.x0 > box.x1 || s.y0 + 30 < box.y0 || s.y0 - 10 > box.y1) continue;
    ctx.strokeStyle = "#1a1010"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.quadraticCurveTo((s.x0 + s.x1) / 2, s.y0 + s.sag * 2, s.x1, s.y1); ctx.stroke();
    const n = Math.floor((s.x1 - s.x0) / 10);
    for (let i = 1; i < n; i++) {
      const k = i / n, px = s.x0 + (s.x1 - s.x0) * k, py = s.y0 + 4 * s.sag * k * (1 - k);
      if (px < box.x0 - 8 || px > box.x1 + 8) continue;
      const fl = Math.sin(wt * 3.1 + i * 0.9 + s.seed) * 1.6;
      ctx.fillStyle = BAL[(i + s.seed) % BAL.length];
      ctx.beginPath(); ctx.moveTo(px - 3, py); ctx.lineTo(px + 3, py); ctx.lineTo(px + 1.2 + fl, py + 7.5); ctx.fill();
    }
  }
  // balloon bunches, tied to trees and lamp posts; they lean INTO the wind
  for (const b of L.bunches) {
    if (!inBox(b.x, b.y - 30)) continue;
    for (let i = 0; i < b.n; i++) {
      const a = -Math.PI / 2 + (i - (b.n - 1) / 2) * 0.32, len = b.lift + hash(b.seed, i, 1) * 10;
      const sw = Math.sin(wt * 0.9 + b.seed + i * 1.3) * 3 - 2.5;
      const bx = b.x + Math.cos(a) * len * 0.6 + sw, by = b.y + Math.sin(a) * len;
      ctx.strokeStyle = "rgba(230,220,200,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + sw * 0.5, (b.y + by) / 2, bx, by + 6); ctx.stroke();
      const s = balloonSprite(BAL[(b.seed + i) % BAL.length], i === 0 && b.seed % 2 === 0);
      ctx.drawImage(s, bx - 6, by - 7, 12, 15);
    }
  }
  // loose balloons drifting west, against the wind, over the back lot and the alleys
  const { mw } = L;
  for (let i = 0; i < 6; i++) {
    const lane = i % 2 ? 2.2 + (i % 3) * 1.2 : 17.5 + (i % 3) * 1.6;
    const x = ((hash(i, 9, 1) * mw - wt * (9 + i * 2)) % mw + mw) % mw, y = lane * TILE + Math.sin(wt * 0.6 + i) * 8;
    if (!inBox(x, y)) continue;
    ctx.strokeStyle = "rgba(230,220,200,.45)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.quadraticCurveTo(x + 4, y + 14, x + 1 + Math.sin(wt * 2 + i) * 2, y + 22); ctx.stroke();
    ctx.drawImage(balloonSprite(BAL[i % BAL.length], i % 3 === 0), x - 6, y - 7, 12, 15);
  }
  // the pavilion's pennant on its finial
  if (L.pav && inBox(L.pav.cx, L.pav.cy - 40)) {
    const { cx, cy } = L.pav, top = cy - 52;
    ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, top); ctx.stroke();
    const fl = Math.sin(wt * 3.4) * 2.5;
    ctx.fillStyle = C.pink; ctx.beginPath(); ctx.moveTo(cx, top); ctx.quadraticCurveTo(cx + 9, top + 2 + fl, cx + 18, top + 4 + fl); ctx.lineTo(cx, top + 9); ctx.fill();
  }
  // eyes that follow you
  const p = game.player;
  for (const e of L.eyes) {
    if (!inBox(e.x, e.y)) continue;
    const dx = p.x - e.x, dy = (p.y - 20) - e.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120);
    const ox = dx / d * e.p * k, oy = dy / d * e.p * k * (e.ry ? e.ry / e.r : 1) * 0.8;
    if (e.big) {
      if (eyeShut(e, t, view)) { // the lid: painted, cracked, with lashes drawn on in marker
        ellipse(ctx, e.x, e.y, 23, 15, C.face);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(e.x - 22, e.y); ctx.quadraticCurveTo(e.x, e.y + 7, e.x + 22, e.y); ctx.stroke();
        ctx.lineWidth = 1; ctx.beginPath(); for (let k = -3; k <= 3; k++) { const lx = e.x + k * 6; ctx.moveTo(lx, e.y + 3.5 - Math.abs(k) * 0.6); ctx.lineTo(lx + k * 0.8, e.y + 8 - Math.abs(k) * 0.4); } ctx.stroke();
        continue;
      }
      circle(ctx, e.x + ox, e.y + oy, 8.5, e.iris); circle(ctx, e.x + ox, e.y + oy, 8.5 * 0.55, "#050204");
      circle(ctx, e.x + ox - 3, e.y + oy - 3, 2, "#fff");
    } else {
      circle(ctx, e.x + ox, e.y + oy, e.r * 0.62, e.iris); circle(ctx, e.x + ox, e.y + oy, e.r * 0.36, "#050204");
    }
  }
}

/* ------------------------------------------------------------ glow: neon through the dark */
function glow(ctx, game, t, view, box) {
  const L = layout(game), red = view.reduced, { mw, mh } = L;
  const inBox = (x, y, m = 60) => x > box.x0 - m && x < box.x1 + m && y > box.y0 - m && y < box.y1 + m;
  ctx.globalCompositeOperation = "lighter";
  const step = red ? -1 : Math.floor(t * 2.4); // marquee chase: each bulb peaks under once a second
  const fh = L.fh;
  if (fh && inBox(fh.cx, (fh.y0 + fh.y1) / 2, 200)) {
    // FUN HOUSE in pink neon; the nose throbs slowly
    drawNeon(ctx, "FUN HOUSE", 20, C.pink, fh.cx, fh.my1 + 46, neonOn(t, 1.3, view, 0.9) ? 0.95 : 0.25);
    const nose = red ? 0.5 : 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.6));
    const gs = glowSprite(C.red); ctx.globalAlpha = nose; ctx.drawImage(gs, fh.cx - 34, fh.y0 + 64 - 34, 68, 68);
    const gy = glowSprite(C.yel);
    if (fh.lips) fh.lips.forEach((b, i) => {
      const hot = step >= 0 && ((i >> 1) + step) % 4 === 0;
      ctx.globalAlpha = hot ? 0.7 : 0.22; ctx.drawImage(gy, b.x - 9, b.y - 9, 18, 18);
    });
    // a glint in each eye
    for (const e of L.eyes) if (e.big && !eyeShut(e, t, view)) {
      const p = game.player, dx = p.x - e.x, dy = p.y - 20 - e.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120);
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite(C.mint), e.x + dx / d * e.p * k - 9, e.y + dy / d * e.p * k * 0.75 - 9, 18, 18);
    }
  }
  if (L.pav && inBox(L.pav.cx, L.pav.cy, 160)) {
    const pv = L.pav;
    drawNeon(ctx, "PRIZES!", 18, C.cyan, pv.cx, pv.cy + 50, neonOn(t, 2.9, view) ? 0.9 : 0.2);
    const gp = glowSprite(C.pink);
    if (pv.rim) pv.rim.forEach((b, i) => {
      if (b.state === "dead") return;
      const hot = step >= 0 && (i + step) % 4 === 0;
      ctx.globalAlpha = hot ? 0.65 : 0.18; ctx.drawImage(i % 2 ? gp : glowSprite(b.color), b.x - 8, b.y - 8, 16, 16);
    });
  }
  // the FUN! signs: the F keeps going out, so it says UN!
  for (const s of L.signs) {
    if (!s.neon || !inBox(s.x + s.w / 2, s.y)) continue;
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2 + 1;
    drawNeon(ctx, "UN!", 18, C.pink, cx + 6, cy, 0.9);
    drawNeon(ctx, "F", 18, C.pink, cx - 15, cy, neonOn(t, s.seed, view, 0.35) ? 0.9 : 0.08);
  }
  // the carnival beyond the edges: lights only (the dark has eaten the rest)
  if (box.x0 < 0 || box.y0 < 0 || box.x1 > mw || box.y1 > mh) {
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0); ctx.rect(0, 0, mw, mh); ctx.clip("evenodd");
    if (box.y0 < 0) {
      // the sky over the fairground glows like a fever: carnival light pollution on the clouds
      const hz = ctx.createLinearGradient(0, -200, 0, 0); hz.addColorStop(0, "rgba(120,20,90,0)"); hz.addColorStop(0.6, "rgba(200,40,110,.18)"); hz.addColorStop(1, "rgba(255,90,60,.34)");
      ctx.globalAlpha = 1; ctx.fillStyle = hz; ctx.fillRect(box.x0, Math.max(box.y0, -200), box.x1 - box.x0, Math.min(0, box.y1) - Math.max(box.y0, -200));
      const spin = t * (red ? 0.01 : 0.06);
      for (const r of sky(L)) {
        if (r.kind === "wheel" && r.x + r.R + 20 > box.x0 && r.x - r.R - 20 < box.x1) {
          const s = wheelSprite(r.R, true);
          ctx.save(); ctx.translate(r.x, r.cy); ctx.rotate(spin); ctx.globalAlpha = 0.9; ctx.drawImage(s, -s.width / 4, -s.height / 4, s.width / 2, s.height / 2); ctx.restore();
          ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite(C.pink), r.x - r.R * 1.3, r.cy - r.R * 1.3, r.R * 2.6, r.R * 2.6);
          for (let i = 0; i < 24; i++) { // rim bulbs chase; one in three dark at a time
            const a = spin + i / 24 * TAU, on = step < 0 || (i + step) % 3 !== 0;
            ctx.globalAlpha = on ? 0.95 : 0.25; ctx.drawImage(bulbSprite(i % 2 ? C.yel : C.pink), r.x + Math.cos(a) * r.R - 7, r.cy + Math.sin(a) * r.R - 7, 14, 14);
          }
          for (let i = 0; i < 8; i++) { // lit gondolas: little windows, nobody in them... mostly
            const a = spin + i / 8 * TAU, gx = r.x + Math.cos(a) * r.R, gy = r.cy + Math.sin(a) * r.R;
            ctx.globalAlpha = 0.75; ctx.fillStyle = i % 2 ? C.cyan : C.org; ctx.fillRect(gx - 4, gy + 3, 8, 4);
            if (i === 3) { ctx.fillStyle = "#fff"; ctx.fillRect(gx - 2, gy + 4, 1, 1); ctx.fillRect(gx + 1, gy + 4, 1, 1); } // someone's still up there
          }
        } else if (r.kind === "coaster" && r.x1 > box.x0 && r.x0 < box.x1) {
          ctx.globalAlpha = 0.85; ctx.strokeStyle = C.cyan; ctx.lineWidth = 1.2; ctx.beginPath();
          for (let x = r.x0; x <= r.x1; x += 6) { const y = coasterY(r, x); x === r.x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
          const gc = bulbSprite(C.cyan);
          for (let x = r.x0, i = 0; x <= r.x1; x += 16, i++) { ctx.globalAlpha = step < 0 || (i + step) % 4 ? 0.8 : 0.2; ctx.drawImage(gc, x - 5, coasterY(r, x) - 5, 10, 10); }
        } else if (r.kind === "tent" && r.x + r.w > box.x0 && r.x - r.w < box.x1) {
          // stripes catch the glow; bulb strings run down both eaves
          ctx.globalAlpha = 0.28;
          for (let i = 0; i < 6; i += 2) { ctx.fillStyle = i % 4 ? C.yel : C.red; ctx.beginPath(); ctx.moveTo(r.x, -r.h); ctx.lineTo(r.x - r.w / 2 + i * r.w / 6, 0); ctx.lineTo(r.x - r.w / 2 + (i + 1) * r.w / 6, 0); ctx.fill(); }
          const gb = bulbSprite(C.yel);
          for (let i = 0; i <= 6; i++) { const k = i / 6; ctx.globalAlpha = 0.7; ctx.drawImage(gb, r.x - r.w / 2 * k - 4, -r.h * (1 - k) - 4, 8, 8); ctx.drawImage(gb, r.x + r.w / 2 * k - 4, -r.h * (1 - k) - 4, 8, 8); }
        }
      }
    }
    for (const c of canopies(L)) {
      if (c.x + c.r < box.x0 || c.x - c.r > box.x1 || c.y + c.r < box.y0 || c.y - c.r > box.y1) continue;
      ctx.globalAlpha = 0.4; ctx.drawImage(canopySprite(c.r, c.col), c.x - c.r - 6, c.y - c.r - 6, (c.r + 6) * 2, (c.r + 6) * 2); // the stripes show through the dark
      const g = bulbSprite(c.col);
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, on = step < 0 || (i + step) % 3 !== 1; ctx.globalAlpha = on ? 0.85 : 0.2; ctx.drawImage(g, c.x + Math.cos(a) * c.r - 6, c.y + Math.sin(a) * c.r - 6, 12, 12); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
}

/* ------------------------------------------------------------ paint entry */
function paint(ctx, game, api) {
  layouts.delete(game); // paint runs again on a zoom change: rebuild cleanly
  const L = layout(game);
  paintFloor(ctx, game, L);
  paintBorders(ctx, game, L, api);
  for (const b of L.banners) { paintBanner(ctx, b); api.lights.push({ x: b.x + b.w / 2, y: b.y + 4, r: 44, color: b.bg, seed: b.x * 0.001 }); }
  for (const s of L.signs) paintSign(ctx, s, api);
  for (const c of L.cutouts) { paintCutout(ctx, c); api.lights.push({ x: c.x, y: c.y - 20, r: 44, color: c.kind === "mascot" ? C.org : c.kind === "hole" ? C.cyan : C.pink, flicker: 0.2, seed: c.seed * 0.03 }); }
  if (L.fh) paintFunHouse(ctx, L.fh, api);
  if (L.pav) paintPavilion(ctx, L.pav, api);
}

export default { paint, backdrop, ambient, glow };
