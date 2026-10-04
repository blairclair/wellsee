/* Stage backdrop for the "mirrors" zone (the Hall of Mirrors). Owned by ONE agent; see art/zones/README.md.
 *
 * The idea: a glass funhouse dressed up like a birthday party. The backstage loop (the corridor
 * round the outside) is a garish, bunting-hung carnival lane lit in neon; the maze inside stays
 * dark glass, where the reflections are not quite yours, and some of them look at you.
 *   paint    signs and boards on the tent walls (one is written backwards), clown mouths you walk
 *            into, ornate funhouse panels on the thick mirror masses, candy-tinted and chalked glass,
 *            confetti in the corridor gutters, coloured light pools + marquee bulbs.
 *   backdrop the carnival beyond the tent: sky, smiling moon, tents, a helter-skelter, a coaster,
 *            two Ferris wheels; below the map the same carnival reflected in glass, with a face in it.
 *   ambient  fluttering pennants, balloon clusters, and pupils in the reflections that follow you.
 *   glow     neon signs and letters burning through the dark, eyes that track you, and the
 *            backdrop (it lives outside the lightmap, so it is drawn after the darkness).
 * Heavy drawing is cached (sprite canvases); per frame is a handful of blits and small shapes.
 */
import { TAU, PAL, hash, clamp, circle, ellipse, rgba, glowSprite, sprite } from "../util.js";
import { TILE, TILES } from "../../content.js";

const T = TILE;
const NEON = ["#ff3fb4", "#3ff0ff", "#ffd23f", "#8dff4a", "#b46cff", "#ff6a3f"];
const BH = 175;   // height of the backdrop band above / below the map (world px)
const PX = 70;    // width of the side bands
const FONT = "'Trebuchet MS', 'Arial Black', Impact, sans-serif";

const tileAt = (g, tx, ty) => (tx < 0 || ty < 0 || tx >= g.w || ty >= g.h ? "tent" : g.tiles[ty * g.w + tx]);
const solid = (g, tx, ty) => { const d = TILES[tileAt(g, tx, ty)]; return !d || !!d.solid; };
const isM = (g, tx, ty) => tileAt(g, tx, ty) === "mirror";
const isTent = (g, tx, ty) => tileAt(g, tx, ty) === "tent";
const reducedOf = (view) => !!(view && view.reduced);

/* ================================================================ layout (once per level) */
let LAY = null, LAYFOR = null;
function lay(game) {
  if (LAYFOR === game && LAY) return LAY;
  const W = game.w * T, H = game.h * T;
  const L = { W, H, signs: [], boards: [], letters: [], faces: [], doorEyes: [], panels: [], mirrors: [], pennants: [], balloons: [] };
  // row-3 / row-21 tent rows with a 1-tile gap: the mouths you walk through
  const gapsIn = (ty) => { const out = []; for (let tx = 4; tx < game.w - 4; tx++) if (!solid(game, tx, ty) && isTent(game, tx - 1, ty) && isTent(game, tx + 1, ty)) out.push(tx); return out; };
  const innerTop = 3, innerBot = game.h - 4; // the tent walls round the maze
  for (const gx of gapsIn(innerTop)) L.faces.push({ gx, ty: innerTop, side: -1 });
  for (const gx of gapsIn(innerBot)) L.faces.push({ gx, ty: innerBot, side: 1 });
  const g0 = L.faces.length ? L.faces[0].gx : (game.w / 2) | 0;
  // big neon signs on the inner tent roofs, either side of the mouths
  const rowY = (ty, front) => (front ? [ty * T + 1.5, 16] : [ty * T + 3, 26]);
  {
    const [y, h] = rowY(innerTop, false);
    L.signs.push({ x0: 6 * T, x1: (g0 - 4) * T, y, h, text: "HALL OF MIRRORS", color: "#ff3fb4", rim: "#3ff0ff", mirrored: true, key: "hom" });
    L.signs.push({ x0: (g0 + 5) * T, x1: (game.w - 6) * T, y, h, text: "SEE YOURSELF AS THEY SEE YOU", color: "#ffd23f", rim: "#ff3fb4", key: "sys" });
  }
  {
    const front = !solid(game, 10, innerBot + 1), [y, h] = rowY(innerBot, front);
    L.signs.push({ x0: 6 * T, x1: (g0 - 4) * T, y, h, text: "COME IN! EVERYONE ELSE ALREADY DID", color: "#3ff0ff", rim: "#ff3fb4", key: "ci" });
    L.signs.push({ x0: (g0 + 5) * T, x1: (game.w - 6) * T, y, h, text: "WHICH ONE OF YOU IS YOU?", color: "#8dff4a", rim: "#b46cff", key: "wh" });
  }
  // painted boards on the outer tent (rows 0 and h-1), slogans gone wrong
  const SLOG_TOP = ["SMILE! THEY ARE", "FUN FOR THE WHOLE FAMILY", "COUNT YOUR FACES", "NO ONE LEAVES THE SAME", "DON'T LOOK AWAY", "LAUGH! LAUGH!"];
  const SLOG_BOT = ["THANK YOU FOR VISITING YOURSELF", "MIND THE GLASS", "KEEP SMILING", "HEADS DOWN, CHILDREN", "YOU LOOK WONDERFUL", "1 2 3 DON'T BLINK"];
  const nb = 6, span = (game.w - 6) * T / nb;
  for (let i = 0; i < nb; i++) {
    const cx = 3 * T + span * (i + 0.5), bw = Math.min(span - 40, 220);
    const front0 = !solid(game, Math.floor(cx / T), 1);
    L.boards.push({ x: cx - bw / 2, y: 1.5, w: bw, h: front0 ? 15 : 26, text: SLOG_TOP[i], col: NEON[i % NEON.length], i });
    L.boards.push({ x: cx - bw / 2, y: (game.h - 1) * T + 5, w: bw, h: 22, text: SLOG_BOT[i], col: NEON[(i + 3) % NEON.length], i: i + 10 });
  }
  // vertical neon letters on the inner tent columns (left: by the way in; right: by the way out)
  const colL = 3, colR = game.w - 4;
  const midRow = (game.h / 2) | 0;
  const putWord = (tx, ty0, word, color) => { for (let i = 0; i < word.length; i++) { const ty = ty0 + i; if (word[i] !== " " && isTent(game, tx, ty)) L.letters.push({ x: tx * T + T / 2, y: ty * T + T / 2, ch: word[i], color }); } };
  putWord(colL, 5, "LOOK", "#ffd23f"); putWord(colL, midRow + 3, "AT ME", "#ff3fb4");
  putWord(colR, 4, "SMILE", "#3ff0ff"); putWord(colR, midRow + 3, "BACK", "#8dff4a");
  // the way in is a mouth: an eye above and below it
  for (let ty = 4; ty < game.h - 4; ty++) if (!solid(game, colL, ty) && isTent(game, colL, ty - 1) && isTent(game, colL, ty + 1)) {
    L.faces.push({ door: true, tx: colL, ty });
    L.doorEyes.push({ x: colL * T + T / 2, y: (ty - 1.6) * T }, { x: colL * T + T / 2, y: (ty + 2.6) * T });
  }
  // funhouse panels: 3x3 blocks of glass, then 4x2 strips, greedily, non-overlapping
  const used = new Set();
  const free = (tx, ty, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!isM(game, tx + i, ty + j) || used.has((ty + j) * game.w + tx + i)) return false; return true; };
  const take = (tx, ty, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used.add((ty + j) * game.w + tx + i); };
  let k = 0;
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) if (free(tx, ty, 3, 3)) { take(tx, ty, 3, 3); L.panels.push({ tx, ty, w: 3, h: 3, kind: k++ % 4 }); }
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx += 1) if ((tx % 9 === 2 || tx % 9 === 6) && free(tx, ty, 3, 2)) { take(tx, ty, 3, 2); L.panels.push({ tx, ty, w: 3, h: 2, kind: k++ % 4 }); }
  // every other mirror tile: its reflection may be watching
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) if (isM(game, tx, ty) && !used.has(ty * game.w + tx)) L.mirrors.push({ tx, ty, watch: hash(tx, ty, 61) < 0.55 });
  // pennant strings: along the front of the top outer wall, the front of the inner bottom wall, the top of the bottom wall
  const runs = (ty, y, hang) => { let x0 = -1; for (let tx = 0; tx <= game.w; tx++) { const ok = tx < game.w && isTent(game, tx, ty) && !solid(game, tx, ty + hang); if (ok && x0 < 0) x0 = tx; if (!ok && x0 >= 0) { if (tx - x0 > 1) L.pennants.push({ x0: x0 * T + 4, x1: tx * T - 4, y }); x0 = -1; } } };
  runs(0, 20.5, 1); runs(innerBot, innerBot * T + 20.5, 1);
  L.pennants.push({ x0: T + 4, x1: W - T - 4, y: (game.h - 1) * T + 1.2, roof: true });
  // balloon clusters tied to the inner tent corners
  for (const [tx, ty] of [[colL, innerTop], [colR, innerTop], [colL, innerBot], [colR, innerBot]]) L.balloons.push({ x: tx * T + T / 2, y: ty * T + T * 0.75, seed: tx * 7 + ty });
  LAY = L; LAYFOR = game;
  return L;
}

/* ================================================================ cached sprites */
/* Cache resolution (px per world px). Never above the screen's own scale: a cached canvas drawn
   smaller than 1:1 takes Chrome's slow downscale path (about 4x a plain blit), so we only ever upscale. */
const scaleFor = (ctx) => clamp(Math.floor((Math.abs(ctx.getTransform().a) || 2) * 2) / 2, 1, 3);
let RES = 2;
function fitFont(g, text, w, h, weight = "900") {
  let size = h; g.font = `${weight} ${size}px ${FONT}`;
  const m = g.measureText(text).width; if (m > w) { size = Math.max(5, size * w / m); g.font = `${weight} ${size}px ${FONT}`; }
  return size;
}
/** A neon tube sign: letters only (the glow pass adds them additively). */
function neonSprite(s) {
  const w = s.x1 - s.x0, h = s.h, pad = 10;
  return sprite("mir-neon-" + s.key + RES, (w + pad * 2) * RES, (h + pad * 2) * RES, (g) => {
    g.scale(RES, RES); g.translate(pad, pad);
    // outline tube round the board
    g.shadowColor = s.rim; g.shadowBlur = 5 * RES; g.strokeStyle = rgba(s.rim, 0.95); g.lineWidth = 1.2;
    g.beginPath(); g.roundRect ? g.roundRect(1, 1, w - 2, h - 2, 4) : g.rect(1, 1, w - 2, h - 2); g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    fitFont(g, s.text, w - 16, h * 0.62);
    g.save(); g.translate(w / 2, h / 2 + 0.5); if (s.mirrored) g.scale(-1, 1);
    g.shadowColor = s.color; g.shadowBlur = 7 * RES; g.fillStyle = s.color; g.fillText(s.text, 0, 0);
    g.shadowBlur = 2 * RES; g.fillStyle = "#fff6fb"; g.globalAlpha = 0.85;
    g.lineWidth = 0.5; g.strokeStyle = "#ffffff"; g.strokeText(s.text, 0, 0);
    g.restore();
  });
}
function letterSprite(ch, color) {
  return sprite("mir-let-" + ch + color + RES, 40 * RES, 40 * RES, (g) => {
    g.scale(RES, RES); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 20px ${FONT}`;
    g.shadowColor = color; g.shadowBlur = 8 * RES; g.fillStyle = color; g.fillText(ch, 20, 21);
    g.shadowBlur = 2 * RES; g.strokeStyle = "#fffaf0"; g.lineWidth = 0.8; g.strokeText(ch, 20, 21);
  });
}

/* ================================================================ paint helpers */
function teeth(ctx, x, y0, y1, dir, n, len) { // a row of too many teeth along a vertical edge, pointing dir (+1 right)
  const step = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const a = y0 + i * step, b = a + step, l = len * (0.7 + 0.6 * hash(i, x | 0, y0 | 0));
    ctx.fillStyle = i % 5 === 3 ? "#d8c070" : "#f7f1e2";
    ctx.beginPath(); ctx.moveTo(x, a + 0.3); ctx.lineTo(x + dir * l, (a + b) / 2); ctx.lineTo(x, b - 0.3); ctx.fill();
    ctx.strokeStyle = "rgba(80,10,20,.6)"; ctx.lineWidth = 0.4; ctx.stroke();
  }
}
function teethH(ctx, y, x0, x1, dir, n, len) { // along a horizontal edge, pointing dir (+1 down)
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * step, b = a + step, l = len * (0.7 + 0.6 * hash(i, y | 0, x0 | 0));
    ctx.fillStyle = i % 5 === 2 ? "#d8c070" : "#f7f1e2";
    ctx.beginPath(); ctx.moveTo(a + 0.3, y); ctx.lineTo((a + b) / 2, y + dir * l); ctx.lineTo(b - 0.3, y); ctx.fill();
    ctx.strokeStyle = "rgba(80,10,20,.6)"; ctx.lineWidth = 0.4; ctx.stroke();
  }
}
function drips(ctx, x0, x1, y, col, seed, maxLen) {
  ctx.fillStyle = col;
  for (let i = 0; i < 9; i++) {
    const x = x0 + hash(seed, i, 3) * (x1 - x0), l = 2 + hash(seed, i, 4) * maxLen, w = 0.8 + hash(seed, i, 5) * 1.2;
    ctx.fillRect(x - w / 2, y, w, l); circle(ctx, x, y + l, w * 0.75, col);
  }
}
function stars(ctx, x, y, r, col) { // a five-point star
  ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.fill();
}
function grinFace(ctx, cx, cy, r, skin, teethN = 14) { // a painted clown face with a grin far too wide
  circle(ctx, cx, cy, r, skin);
  ellipse(ctx, cx - r * 0.38, cy - r * 0.2, r * 0.22, r * 0.3, "#1a0a20"); ellipse(ctx, cx + r * 0.38, cy - r * 0.2, r * 0.22, r * 0.3, "#1a0a20");
  ctx.strokeStyle = "#2a6aff"; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.38, cy - r * 0.6); ctx.lineTo(cx - r * 0.38, cy - r * 0.1); ctx.moveTo(cx + r * 0.38, cy - r * 0.6); ctx.lineTo(cx + r * 0.38, cy - r * 0.1); ctx.stroke(); // painted tear lines
  circle(ctx, cx - r * 0.34, cy - r * 0.24, r * 0.07, "#fff8d0"); circle(ctx, cx + r * 0.42, cy - r * 0.24, r * 0.07, "#fff8d0");
  circle(ctx, cx, cy + r * 0.08, r * 0.16, "#ff2a4d");
  ctx.fillStyle = PAL.mouth; ctx.beginPath(); ctx.moveTo(cx - r * 0.85, cy + r * 0.12);
  ctx.quadraticCurveTo(cx, cy + r * 1.05, cx + r * 0.85, cy + r * 0.12); ctx.quadraticCurveTo(cx, cy + r * 0.55, cx - r * 0.85, cy + r * 0.12); ctx.fill();
  ctx.fillStyle = "#fbf6ea";
  for (let i = 0; i < teethN; i++) { // tiny teeth along the upper lip
    const k = (i + 0.5) / teethN, x = cx - r * 0.75 + k * r * 1.5, yl = cy + r * 0.2 + Math.sin(k * Math.PI) * r * 0.36;
    ctx.beginPath(); ctx.moveTo(x - r * 0.05, yl); ctx.lineTo(x + r * 0.05, yl); ctx.lineTo(x, yl + r * 0.12); ctx.fill();
  }
}

/* ================================================================ paint */
function paint(ctx, game, api) {
  const L = lay(game), W = L.W, H = L.H;
  ctx.save();
  // ---- confetti and tickets in the gutters of the backstage loop (right against the walls only)
  const CONF = ["#ff3fb4", "#3ff0ff", "#ffd23f", "#8dff4a", "#b46cff", "#fff4e0"];
  for (let ty = 1; ty < game.h - 1; ty++) for (let tx = 1; tx < game.w - 1; tx++) {
    if (solid(game, tx, ty)) continue;
    const up = solid(game, tx, ty - 1), dn = solid(game, tx, ty + 1), lf = solid(game, tx - 1, ty), rt = solid(game, tx + 1, ty);
    if (!(up || dn || lf || rt) || isM(game, tx, ty - 1) || isM(game, tx, ty + 1)) continue;
    for (let i = 0; i < 9; i++) {
      let px = tx * T + hash(tx, ty, i + 300) * T, py = ty * T + hash(tx, ty, i + 320) * T;
      if (up && !dn) py = ty * T + 2 + hash(tx, ty, i + 340) * 7; else if (dn && !up) py = ty * T + T - 2 - hash(tx, ty, i + 340) * 6;
      else if (lf && !rt) px = tx * T + 1 + hash(tx, ty, i + 360) * 6; else if (rt && !lf) px = tx * T + T - 1 - hash(tx, ty, i + 360) * 6;
      ctx.save(); ctx.translate(px, py); ctx.rotate(hash(tx, ty, i + 380) * TAU);
      ctx.fillStyle = CONF[(hash(tx, ty, i + 400) * CONF.length) | 0]; ctx.globalAlpha = 0.75; ctx.fillRect(-1.1, -0.6, 2.2, 1.2); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // ---- painted boards on the outer tent: cheerful slogans, dripping
  for (const b of L.boards) {
    ctx.fillStyle = "#1a0710"; ctx.fillRect(b.x - 1.5, b.y - 1, b.w + 3, b.h + 2);
    const gr = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, "#fff1d6"); gr.addColorStop(1, "#e6c99a");
    ctx.fillStyle = gr; ctx.fillRect(b.x, b.y, b.w, b.h);
    for (let x = b.x; x < b.x + b.w; x += 10) { ctx.fillStyle = ((x - b.x) / 10) % 2 < 1 ? b.col : "#fff8ec"; ctx.fillRect(x, b.y, Math.min(10, b.x + b.w - x), 2); ctx.fillRect(x, b.y + b.h - 2, Math.min(10, b.x + b.w - x), 2); }
    stars(ctx, b.x + 7, b.y + b.h / 2, 3.4, b.col); stars(ctx, b.x + b.w - 7, b.y + b.h / 2, 3.4, b.col);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; fitFont(ctx, b.text, b.w - 22, b.h * 0.6);
    ctx.fillStyle = "#7a0a1e"; ctx.fillText(b.text, b.x + b.w / 2 + 0.5, b.y + b.h / 2 + 1);
    ctx.fillStyle = "#c8102e"; ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2 + 0.5);
    drips(ctx, b.x + 12, b.x + b.w - 12, b.y + b.h * 0.72, "rgba(170,10,30,.85)", b.i + 1, b.h * 0.3);
    if (hash(b.i, 9) < 0.5) { ctx.strokeStyle = "rgba(30,0,10,.5)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.6, b.y); ctx.lineTo(b.x + b.w * 0.64, b.y + b.h * 0.5); ctx.lineTo(b.x + b.w * 0.6, b.y + b.h); ctx.stroke(); } // split board
    api.lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2 + (b.y < T ? 14 : -10), r: 58, color: b.col, flicker: 0.12, seed: hash(b.i, 4) });
  }

  // ---- the backing boards of the neon signs, and a frame of marquee bulbs
  for (const s of L.signs) {
    const w = s.x1 - s.x0;
    ctx.fillStyle = "#12060e"; ctx.fillRect(s.x0, s.y, w, s.h);
    ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 1.4; ctx.strokeRect(s.x0 + 0.7, s.y + 0.7, w - 1.4, s.h - 1.4);
    for (let x = s.x0 + 4; x < s.x1 - 4; x += 3) { ctx.fillStyle = (((x - s.x0) / 3) | 0) % 2 ? "#3a0a1e" : "#1d0a26"; ctx.fillRect(x, s.y + 2, 3, s.h - 4); } // velvet
    // the tube letters, dark (they light up in the glow pass)
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; fitFont(ctx, s.text, w - 16, s.h * 0.62);
    ctx.save(); ctx.translate((s.x0 + s.x1) / 2, s.y + s.h / 2 + 0.5); if (s.mirrored) ctx.scale(-1, 1);
    ctx.fillStyle = rgba(s.color, 0.55); ctx.fillText(s.text, 0, 0); ctx.restore();
    const step = s.h > 20 ? 14 : 16;
    for (let x = s.x0 + 6; x < s.x1 - 3; x += step) for (const y of [s.y + 0.5, s.y + s.h - 0.5]) {
      const sd = hash(x | 0, y | 0, 5);
      api.bulbs.push({ x, y, color: ["#f6d27a", "#ff3fb4", "#3ff0ff"][((x - s.x0) / step | 0) % 3], seed: sd, state: sd < 0.18 ? "dead" : sd < 0.3 ? "flicker" : "on" });
    }
    for (let i = 0; i < 3; i++) api.lights.push({ x: s.x0 + w * (0.2 + 0.3 * i), y: s.y + s.h / 2, r: 66, color: s.color, flicker: 0.1, seed: hash(s.x0 | 0, i) });
  }

  // ---- clown mouths: the gaps into the maze are mouths with too many teeth
  for (const f of L.faces) {
    if (f.door) { // the way in, on the left column: lips and teeth, an eye above and below
      const x0 = f.tx * T, y0 = f.ty * T;
      ctx.fillStyle = "#b0102a"; ctx.fillRect(x0, y0 - 9, T, 9); ctx.fillRect(x0, y0 + T, T, 9);
      ctx.fillStyle = "#ff2a4d"; ctx.fillRect(x0, y0 - 9, T, 3); ctx.fillRect(x0, y0 + T + 6, T, 3);
      teethH(ctx, y0, x0, x0 + T, -1, 9, 6); teethH(ctx, y0 + T, x0, x0 + T, 1, 9, 6);
      for (const e of L.doorEyes) { circle(ctx, e.x, e.y, 12, "#fffbe8"); circle(ctx, e.x, e.y, 8.5, "#3ff0ff"); circle(ctx, e.x, e.y, 4, "#05030a"); ctx.strokeStyle = "#1a0a20"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, TAU); ctx.stroke(); }
      api.lights.push({ x: x0 + T / 2, y: y0 + T / 2, r: 50, color: "#ff2a4d", flicker: 0.2, seed: 0.31 });
      continue;
    }
    const cx = f.gx * T + T / 2, y0 = f.ty * T, xl = f.gx * T, xr = (f.gx + 1) * T;
    ctx.save(); // clip to the roof of this tent row, minus the gap
    ctx.beginPath(); ctx.rect(cx - 5 * T, y0, 4.5 * T, T); ctx.rect(xr, y0, 4.5 * T, T); ctx.clip();
    // face paint: white greasepaint band, cheeks, eyes with rainbow rings
    const g = ctx.createLinearGradient(0, y0, 0, y0 + T); g.addColorStop(0, "#fff4e4"); g.addColorStop(1, "#e8d2bc");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, y0 + T / 2, 4.6 * T, T * 0.62, 0, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) {
      const ex = cx + s * 3 * T;
      for (let i = 0; i < 5; i++) circle(ctx, ex, y0 + T / 2, 13 - i * 2, NEON[(i + (s > 0 ? 2 : 0)) % NEON.length]);
      circle(ctx, ex, y0 + T / 2, 4.5, "#fffbe8");
      circle(ctx, cx + s * 1.9 * T, y0 + T * 0.62, 6, "rgba(255,60,110,.55)"); // rouge
    }
    // the lips, then teeth lining the gap
    ctx.fillStyle = "#b0102a"; ctx.fillRect(xl - 12, y0, 12, T); ctx.fillRect(xr, y0, 12, T);
    ctx.fillStyle = "#ff2a4d"; ctx.fillRect(xl - 12, y0, 4, T); ctx.fillRect(xr + 8, y0, 4, T);
    ctx.restore();
    teeth(ctx, xl, y0, y0 + T, 1, 7, 5.5); teeth(ctx, xr, y0, y0 + T, -1, 7, 5.5);
    api.lights.push({ x: cx, y: y0 + T / 2, r: 54, color: "#ff2a4d", flicker: 0.18, seed: hash(f.gx, f.ty) });
  }

  // ---- vertical letters: dark tube shapes on a striped pole (lit in glow)
  for (const l of L.letters) {
    ctx.fillStyle = "#12060e"; ctx.fillRect(l.x - 12, l.y - 13, 24, 26);
    ctx.strokeStyle = "#c9a54a"; ctx.lineWidth = 1; ctx.strokeRect(l.x - 11.5, l.y - 12.5, 23, 25);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `900 20px ${FONT}`; ctx.fillStyle = rgba(l.color, 0.5); ctx.fillText(l.ch, l.x, l.y + 1);
    api.lights.push({ x: l.x, y: l.y, r: 44, color: l.color, flicker: 0.15, seed: hash(l.x | 0, l.y | 0) });
  }

  // ---- mirror tiles: candy-tinted glass, grins, balloons, handprints, Miss Ames's chalk
  const CHALK = ["DON'T BLINK", "1 2 3", "HEADS DOWN", "I SEE YOU", "STAY", "BEHIND YOU"];
  for (const m of L.mirrors) {
    const x = m.tx * T, y = m.ty * T, h = (k) => hash(m.tx, m.ty, k);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 3, y + 3, T - 6, T - 6); ctx.clip();
    if (h(70) < 0.38) { ctx.globalCompositeOperation = "overlay"; ctx.fillStyle = rgba(NEON[(h(71) * NEON.length) | 0], 0.75); ctx.fillRect(x, y, T, T); ctx.globalCompositeOperation = "source-over"; }
    const r = h(72);
    if (r < 0.16) { // the reflection is wearing greasepaint
      grinFace(ctx, x + T / 2, y + T * 0.3, 5.2, "#f4ece0", 9);
    } else if (r < 0.27) { // it is holding a balloon you are not
      const bc = NEON[(h(73) * NEON.length) | 0];
      ctx.strokeStyle = "rgba(240,230,220,.7)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x + T * 0.62, y + T * 0.62); ctx.quadraticCurveTo(x + T * 0.8, y + T * 0.45, x + T * 0.74, y + T * 0.28); ctx.stroke();
      ellipse(ctx, x + T * 0.74, y + T * 0.2, 4, 5, bc); circle(ctx, x + T * 0.7, y + T * 0.16, 1.2, "rgba(255,255,255,.7)");
    } else if (r < 0.36) { // handprints from the inside
      for (let i = 0; i < 2; i++) {
        const hx = x + 9 + i * 12 + h(74 + i) * 3, hy = y + 12 + h(76 + i) * 8;
        ctx.fillStyle = "rgba(255,240,250,.35)"; ctx.beginPath(); ctx.ellipse(hx, hy, 3, 3.6, 0, 0, TAU); ctx.fill();
        for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(hx - 3 + f * 2, hy - 5.5 - (f === 1 || f === 2 ? 1 : 0), 0.8, 2, 0, 0, TAU); ctx.fill(); }
      }
    } else if (r < 0.45) { // chalk
      ctx.save(); ctx.translate(x + T / 2, y + T * 0.55); ctx.rotate((h(78) - 0.5) * 0.5);
      ctx.font = `700 6px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "rgba(245,245,235,.85)";
      const txt = CHALK[(h(79) * CHALK.length) | 0], words = txt.split(" ");
      if (words.length > 1 && txt.length > 6) { ctx.fillText(words[0], 0, -3.5); ctx.fillText(words.slice(1).join(" "), 0, 3.5); } else ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- funhouse panels on the thick glass: ornate marquee frames round warped reflections
  for (const p of L.panels) {
    const x = p.tx * T + 2, y = p.ty * T + 2, w = p.w * T - 4, hh = p.h * T - 4;
    // gold frame with carved scallops
    ctx.fillStyle = "#5a3a10"; ctx.fillRect(x, y, w, hh);
    ctx.fillStyle = "#e0b040"; ctx.fillRect(x + 1, y + 1, w - 2, hh - 2);
    ctx.fillStyle = "#8a6020"; ctx.fillRect(x + 3, y + 3, w - 6, hh - 6);
    const gx = x + 5, gy = y + 5, gw = w - 10, gh = hh - 10;
    const glass = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
    const pair = [["#ff7ad9", "#3ff0ff"], ["#ffd23f", "#ff3fb4"], ["#8dff4a", "#3a6aff"], ["#b46cff", "#ffd23f"]][p.kind];
    glass.addColorStop(0, pair[0]); glass.addColorStop(0.5, "#e8fbff"); glass.addColorStop(1, pair[1]);
    ctx.fillStyle = glass; ctx.fillRect(gx, gy, gw, gh);
    ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
    const cx = gx + gw / 2, cy = gy + gh / 2;
    if (p.kind === 0) { // TALL: you, stretched thin, grinning
      ctx.fillStyle = "rgba(25,10,35,.75)"; ctx.beginPath(); ctx.ellipse(cx, cy + gh * 0.12, gw * 0.08, gh * 0.42, 0, 0, TAU); ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = "rgba(25,10,35,.75)"; ctx.beginPath(); ctx.moveTo(cx - 2, cy - gh * 0.1); ctx.lineTo(cx - gw * 0.3, cy + gh * 0.25); ctx.moveTo(cx + 2, cy - gh * 0.1); ctx.lineTo(cx + gw * 0.3, cy + gh * 0.25); ctx.stroke();
      grinFace(ctx, cx, cy - gh * 0.28, Math.min(gw, gh) * 0.13, "#f4ece0", 12);
    } else if (p.kind === 1) { // WIDE: one face filling the glass
      grinFace(ctx, cx, cy - gh * 0.08, Math.min(gw * 0.42, gh * 0.48), "#f6e8dc", 22);
    } else if (p.kind === 2) { // the little girl with the ribbon and the balloon; her face scratched out
      const r = Math.min(gw, gh) * 0.14;
      ctx.fillStyle = "rgba(25,10,35,.8)"; ctx.beginPath(); ctx.moveTo(cx - r * 1.6, cy + gh * 0.45); ctx.lineTo(cx, cy - r * 0.3); ctx.lineTo(cx + r * 1.6, cy + gh * 0.45); ctx.fill();
      circle(ctx, cx, cy - r * 1.2, r, "rgba(25,10,35,.85)");
      ctx.fillStyle = "#ff2a4d"; ctx.beginPath(); ctx.moveTo(cx + r * 0.4, cy - r * 2.1); ctx.lineTo(cx + r * 1.4, cy - r * 2.6); ctx.lineTo(cx + r * 1.3, cy - r * 1.6); ctx.fill(); // ribbon
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let i = 0; i < 7; i++) { ctx.moveTo(cx - r * 0.7 + i * r * 0.2, cy - r * 1.8); ctx.lineTo(cx - r * 0.5 + i * r * 0.2, cy - r * 0.6); } ctx.stroke();
      ctx.strokeStyle = "rgba(240,230,220,.8)"; ctx.beginPath(); ctx.moveTo(cx + r * 1.2, cy); ctx.quadraticCurveTo(cx + gw * 0.3, cy - gh * 0.1, cx + gw * 0.3, cy - gh * 0.3); ctx.stroke();
      ellipse(ctx, cx + gw * 0.3, cy - gh * 0.36, r * 0.75, r * 0.9, "#ff2a4d"); circle(ctx, cx + gw * 0.28, cy - gh * 0.4, r * 0.2, "rgba(255,255,255,.8)");
    } else { // MANY: a crowd of little faces, all turned toward the glass
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
        const fx = gx + gw * (0.14 + i * 0.24) + (j % 2) * 3, fy = gy + gh * (0.2 + j * 0.3), r = Math.min(gw, gh) * 0.09;
        circle(ctx, fx, fy, r, j === 1 && i === 2 ? "#f4ece0" : "rgba(25,10,35,.7)");
        if (j === 1 && i === 2) { circle(ctx, fx - r * 0.35, fy - r * 0.15, r * 0.18, "#000"); circle(ctx, fx + r * 0.35, fy - r * 0.15, r * 0.18, "#000"); ctx.strokeStyle = PAL.mouth; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(fx, fy + r * 0.1, r * 0.55, 0.2, Math.PI - 0.2); ctx.stroke(); }
        else { circle(ctx, fx - r * 0.35, fy - r * 0.1, r * 0.14, "rgba(255,250,220,.8)"); circle(ctx, fx + r * 0.35, fy - r * 0.1, r * 0.14, "rgba(255,250,220,.8)"); }
      }
    }
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(gx + gw * 0.08, gy); ctx.lineTo(gx + gw * 0.2, gy); ctx.lineTo(gx + gw * 0.05, gy + gh); ctx.lineTo(gx - gw * 0.07, gy + gh); ctx.fill(); // shine
    if (hash(p.tx, p.ty, 3) < 0.5) { ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.5; const kx = gx + gw * 0.7, ky = gy + gh * 0.3; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.3; ctx.moveTo(kx, ky); ctx.lineTo(kx + Math.cos(a) * 14, ky + Math.sin(a) * 12); } ctx.stroke(); }
    ctx.restore();
    // a crest on top and a placard: YOU / ALSO YOU / NOT YOU
    ctx.fillStyle = "#e0b040"; ctx.beginPath(); ctx.arc(x + w / 2, y + 2, 6, Math.PI, 0); ctx.fill(); stars(ctx, x + w / 2, y - 0.5, 3, "#ff3fb4");
    const plac = ["YOU", "ALSO YOU", "NOT YOU", "WHICH?"][p.kind];
    ctx.fillStyle = "#1a0a10"; ctx.fillRect(x + w / 2 - 15, y + hh - 6, 30, 7); ctx.fillStyle = "#f6d27a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 5px ${FONT}`; ctx.fillText(plac, x + w / 2, y + hh - 2.4);
    for (let i = 0; i < 2 * (p.w + p.h); i++) { // painted bulbs on the frame, a few real ones
      const per = 2 * (w + hh), d = (i + 0.5) / (2 * (p.w + p.h)) * per;
      let bx, by; if (d < w) { bx = x + d; by = y + 1.5; } else if (d < w + hh) { bx = x + w - 1.5; by = y + d - w; } else if (d < 2 * w + hh) { bx = x + w - (d - w - hh); by = y + hh - 1.5; } else { bx = x + 1.5; by = y + hh - (d - 2 * w - hh); }
      if (i % 3 === 0) api.bulbs.push({ x: bx, y: by, color: NEON[i % NEON.length], seed: hash(p.tx, i), state: hash(p.tx, i) < 0.25 ? "dead" : "on" });
      else circle(ctx, bx, by, 1.6, i % 2 ? "#fff1b0" : "#5a3a10");
    }
    api.lights.push({ x: x + w / 2, y: y + hh / 2, r: 30 + p.w * 6, color: pair[0], flicker: 0.25, seed: hash(p.tx, p.ty, 9) });
  }
  ctx.restore();
}

/* ================================================================ backdrop (the carnival beyond the glass) */
let BG = null; // { S, sky, front, side, ghost }
function buildBackdrop(game, S) {
  const L = lay(game), W = L.W, H = L.H, BW = W + PX * 2;
  const mk = (w, h, s) => { const c = document.createElement("canvas"); c.width = Math.ceil(w * s); c.height = Math.ceil(h * s); return c; };
  // ---- sky: low resolution is fine (gradients, stars, the moon)
  const drawSky = (g) => {

  const gr = g.createLinearGradient(0, -BH, 0, 0);
  gr.addColorStop(0, "#04030c"); gr.addColorStop(0.45, "#160a2e"); gr.addColorStop(0.8, "#3c0f44"); gr.addColorStop(1, "#5a1640");
  g.fillStyle = gr; g.fillRect(-PX, -BH, BW, BH);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(255,250,230,${0.25 + hash(i, 1) * 0.6})`; g.fillRect(-PX + hash(i, 2) * BW, -BH + hash(i, 3) * (BH - 70), 1, 1); }
  // the moon is smiling
  const mx = W * 0.71, my = -140;
  const mg = g.createRadialGradient(mx, my, 6, mx, my, 40); mg.addColorStop(0, "rgba(255,240,200,.35)"); mg.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = mg; g.fillRect(mx - 40, my - 40, 80, 80);
  circle(g, mx, my, 16, "#f4ead0"); circle(g, mx - 5, my - 4, 3, "#d9cca8"); circle(g, mx + 6, my + 5, 2, "#d9cca8");
  circle(g, mx - 5, my - 3, 1.6, "#1a0a20"); circle(g, mx + 5, my - 3, 1.6, "#1a0a20");
  g.fillStyle = "#6e0714"; g.beginPath(); g.moveTo(mx - 10, my + 3); g.quadraticCurveTo(mx, my + 16, mx + 10, my + 3); g.quadraticCurveTo(mx, my + 9, mx - 10, my + 3); g.fill();
  for (let i = 0; i < 9; i++) { const k = (i + 0.5) / 9; g.fillStyle = "#fffbe8"; g.fillRect(mx - 8 + k * 16 - 0.5, my + 3 + Math.sin(k * Math.PI) * 4.5, 1, 1.4); }
  // far hill
  g.fillStyle = "#12061a"; g.beginPath(); g.moveTo(-PX, 0);
  for (let x = -PX; x <= W + PX; x += 40) g.lineTo(x, -34 - 14 * Math.sin(x * 0.004) - 8 * Math.sin(x * 0.013));
  g.lineTo(W + PX, 0); g.fill();
  };

  // ---- front: tents, a helter-skelter, the coaster, booths, string lights, a fence (sharp)
  const drawFront = (f) => {

  // coaster lattice, far right and far left
  const coaster = (x0, x1, base) => {
    f.strokeStyle = "#3a1630"; f.lineWidth = 1;
    const yAt = (x) => base - 40 - 34 * Math.abs(Math.sin((x - x0) * 0.012)) - 10 * Math.sin((x - x0) * 0.031);
    for (let x = x0; x < x1; x += 12) { f.beginPath(); f.moveTo(x, yAt(x)); f.lineTo(x, base); f.moveTo(x, yAt(x)); f.lineTo(x + 12, base); f.stroke(); }
    f.strokeStyle = "#ff3fb4"; f.lineWidth = 2; f.beginPath(); for (let x = x0; x <= x1; x += 4) f.lineTo(x, yAt(x)); f.stroke();
    f.strokeStyle = "#ffd23f"; f.lineWidth = 0.6; f.beginPath(); for (let x = x0; x <= x1; x += 4) f.lineTo(x, yAt(x) + 2); f.stroke();
    for (let x = x0 + 10; x < x1; x += 22) circle(f, x, yAt(x) - 1.5, 1.3, NEON[(x / 22 | 0) % NEON.length]);
  };
  coaster(W * 0.78, W + PX, -18); coaster(-PX, W * 0.12, -18);
  // helter-skelter
  const hs = (x, base, hgt) => {
    f.fillStyle = "#e8d6b0"; f.beginPath(); f.moveTo(x - 13, base); f.lineTo(x - 8, base - hgt); f.lineTo(x + 8, base - hgt); f.lineTo(x + 13, base); f.fill();
    f.strokeStyle = "#d0102e"; f.lineWidth = 4; f.beginPath();
    for (let i = 0; i <= 60; i++) { const k = i / 60, yy = base - k * hgt, ww = 13 - k * 5; f.lineTo(x + Math.sin(k * 6 * Math.PI) * (ww + 3), yy); } f.stroke();
    f.fillStyle = "#ff3fb4"; f.beginPath(); f.moveTo(x - 12, base - hgt); f.lineTo(x, base - hgt - 22); f.lineTo(x + 12, base - hgt); f.fill();
    f.fillStyle = "#ffd23f"; f.beginPath(); f.moveTo(x, base - hgt - 22); f.lineTo(x + 10, base - hgt - 18); f.lineTo(x, base - hgt - 15); f.fill();
  };
  hs(W * 0.36, -20, 92); hs(W * 0.93, -20, 70);
  // striped tent peaks
  const tent = (x, base, w, hgt, a, b) => {
    for (let i = 0; i < 8; i++) {
      f.fillStyle = i % 2 ? a : b; f.beginPath(); f.moveTo(x, base - hgt);
      f.lineTo(x - w / 2 + (i / 8) * w, base); f.lineTo(x - w / 2 + ((i + 1) / 8) * w, base); f.fill();
    }
    f.fillStyle = "rgba(0,0,0,.25)"; f.beginPath(); f.moveTo(x, base - hgt); f.lineTo(x + w / 2, base); f.lineTo(x, base); f.fill();
    f.strokeStyle = "#1a0a10"; f.lineWidth = 1; f.beginPath(); f.moveTo(x, base - hgt); f.lineTo(x, base - hgt - 12); f.stroke();
    f.fillStyle = a; f.beginPath(); f.moveTo(x, base - hgt - 12); f.lineTo(x + 9, base - hgt - 9); f.lineTo(x, base - hgt - 6); f.fill();
    for (let i = 0; i < 9; i++) circle(f, x - w / 2 + (i + 0.5) * w / 9, base - 1.5, 1.2, NEON[i % NEON.length]); // scallop bulbs
  };
  const TC = [["#d0102e", "#f4e6c8"], ["#2a8aff", "#f4e6c8"], ["#ff3fb4", "#fff1b0"], ["#18a050", "#f4e6c8"], ["#8a2adf", "#ffd23f"]];
  for (let i = 0, x = 60; x < W; i++, x += 150 + hash(i, 7) * 110) { const [a, b] = TC[i % TC.length]; tent(x, -14, 70 + hash(i, 8) * 50, 34 + hash(i, 9) * 26, a, b); }
  // a giant clown cutout over the booths, waving; its grin is too wide
  const cut = (x, base) => {
    f.fillStyle = "#3a1020"; f.fillRect(x - 2, base - 50, 4, 50);
    f.fillStyle = "#e8102e"; f.beginPath(); f.moveTo(x - 30, base - 30); f.lineTo(x + 30, base - 30); f.lineTo(x + 20, base - 4); f.lineTo(x - 20, base - 4); f.fill();
    for (let i = 0; i < 5; i++) circle(f, x - 16 + i * 8, base - 18, 3, NEON[i % NEON.length]);
    grinFace(f, x, base - 52, 20, "#f8efe2", 20);
    f.fillStyle = "#ff3fb4"; for (let i = 0; i < 6; i++) circle(f, x - 18 + i * 7, base - 72 - Math.sin(i) * 3, 6, i % 2 ? "#ff6a3f" : "#ff3fb4"); // hair
    f.fillStyle = "#ffd23f"; f.beginPath(); f.moveTo(x - 10, base - 74); f.lineTo(x, base - 98); f.lineTo(x + 10, base - 74); f.fill(); stars(f, x, base - 98, 4, "#3ff0ff");
  };
  cut(W * 0.5, -10); cut(W * 0.13, -10);
  // booths along the edge with striped awnings and words in lights
  const WORDS = ["FUN!", "PRIZES", "SMILE", "WIN!", "JOY", "TICKETS", "LAUGH", "CANDY"];
  for (let i = 0, x = -PX + 10; x < W + PX; i++, x += 92) {
    const [a, b] = TC[(i * 2) % TC.length], bw = 78, top = -26;
    f.fillStyle = "#1a0a12"; f.fillRect(x, top + 8, bw, 18);
    f.fillStyle = "#ffcf7a"; f.fillRect(x + 8, top + 14, bw - 16, 8); // lit counter
    f.fillStyle = "rgba(26,10,18,.85)"; for (let j = 0; j < 3; j++) { const px = x + 16 + j * 22; circle(f, px, top + 17, 3, "#1a0a12"); f.fillRect(px - 3, top + 17, 6, 5); } // shapes behind the counter
    for (let j = 0; j < 8; j++) { f.fillStyle = j % 2 ? a : b; f.fillRect(x + j * bw / 8, top, bw / 8, 9); f.beginPath(); f.arc(x + (j + 0.5) * bw / 8, top + 9, bw / 16, 0, Math.PI); f.fill(); }
    const word = WORDS[i % WORDS.length]; f.font = `900 9px ${FONT}`; f.textAlign = "center"; f.textBaseline = "middle";
    f.fillStyle = "#1a0a12"; f.fillRect(x + bw / 2 - 22, top - 11, 44, 11);
    f.fillStyle = NEON[i % NEON.length]; f.fillText(word, x + bw / 2, top - 5);
  }
  // string lights across the poles
  for (let x = -PX; x < W + PX; x += 120) {
    f.fillStyle = "#1a0a12"; f.fillRect(x - 1, -48, 2, 48);
    f.strokeStyle = "#140a10"; f.lineWidth = 0.6; f.beginPath(); f.moveTo(x, -46); f.quadraticCurveTo(x + 60, -30, x + 120, -46); f.stroke();
    for (let i = 1; i < 12; i++) { const k = i / 12, bx = x + k * 120, by = -46 + 32 * k * (1 - k); if (hash(x | 0, i) > 0.2) { circle(f, bx, by + 1.5, 2.4, rgba(NEON[(i + (x / 120 | 0)) % NEON.length], 0.35)); circle(f, bx, by + 1.5, 1.3, NEON[(i + (x / 120 | 0)) % NEON.length]); } else circle(f, bx, by + 1.5, 1.2, "#2a2024"); }
  }
  // the fence and the ground at the tent's edge
  const ground = f.createLinearGradient(0, -10, 0, 0); ground.addColorStop(0, "rgba(10,4,10,0)"); ground.addColorStop(1, "rgba(10,4,10,1)");
  f.fillStyle = ground; f.fillRect(-PX, -10, BW, 10);
  f.fillStyle = "#0c060c"; for (let x = -PX; x < W + PX; x += 7) { f.fillRect(x, -9, 2.5, 9); f.beginPath(); f.moveTo(x - 0.5, -9); f.lineTo(x + 1.25, -12); f.lineTo(x + 3, -9); f.fill(); }
  f.fillRect(-PX, -6, BW, 1.2);
  };

  // ---- sides: a corridor of tall funhouse mirrors in gold frames, beyond the tent
  const drawSide = (sd) => {

  sd.fillStyle = "#0e0614"; sd.fillRect(0, 0, PX, H);
  for (let y = 6, i = 0; y < H - 40; y += 74, i++) {
    sd.fillStyle = "#c9a54a"; sd.fillRect(10, y, PX - 20, 66);
    const gg = sd.createLinearGradient(14, y, PX - 14, y + 62); gg.addColorStop(0, NEON[i % NEON.length]); gg.addColorStop(0.5, "#cfeeff"); gg.addColorStop(1, "#1a2a44");
    sd.fillStyle = gg; sd.fillRect(13, y + 3, PX - 26, 60);
    sd.fillStyle = "rgba(20,8,30,.7)"; sd.beginPath(); sd.ellipse(PX / 2, y + 20, 4, 6, 0, 0, TAU); sd.fill(); sd.beginPath(); sd.ellipse(PX / 2, y + 44, 6 + (i % 3) * 3, 16, 0, 0, TAU); sd.fill();
    sd.strokeStyle = PAL.mouth; sd.lineWidth = 1; sd.beginPath(); sd.arc(PX / 2, y + 21, 3, 0.3, Math.PI - 0.3); sd.stroke();
    for (let j = 0; j < 7; j++) circle(sd, 11.5, y + 4 + j * 9.5, 1.3, NEON[(i + j) % NEON.length]), circle(sd, PX - 11.5, y + 4 + j * 9.5, 1.3, NEON[(i + j + 3) % NEON.length]);
  }

  };
  // ---- the face in the reflection (only below the map, in the glass)
  const ghost = mk(220, 150, S), gh = ghost.getContext("2d");
  gh.setTransform(S, 0, 0, S, 0, 0);
  const rg = gh.createRadialGradient(110, 70, 10, 110, 70, 90); rg.addColorStop(0, "rgba(240,235,255,.55)"); rg.addColorStop(0.6, "rgba(200,220,255,.18)"); rg.addColorStop(1, "rgba(200,220,255,0)");
  gh.fillStyle = rg; gh.fillRect(0, 0, 220, 150);
  ellipse(gh, 80, 58, 13, 18, "rgba(4,2,8,.85)"); ellipse(gh, 140, 58, 13, 18, "rgba(4,2,8,.85)");
  gh.fillStyle = "rgba(110,7,20,.8)"; gh.beginPath(); gh.moveTo(30, 88); gh.quadraticCurveTo(110, 150, 190, 88); gh.quadraticCurveTo(110, 118, 30, 88); gh.fill();
  gh.fillStyle = "rgba(255,250,235,.85)";
  for (let i = 0; i < 26; i++) { const k = (i + 0.5) / 26, x = 36 + k * 148, y = 92 + Math.sin(k * Math.PI) * 18; gh.beginPath(); gh.moveTo(x - 2.4, y); gh.lineTo(x + 2.4, y); gh.lineTo(x, y + 6); gh.fill(); }

  // ---- cracks across the glass below the map
  const drawCrack = (ck) => {

  ck.strokeStyle = "rgba(220,250,255,.55)"; ck.lineWidth = 0.7;
  for (let c = 0; c < 7; c++) {
    const ox = hash(c, 11) * W, oy = 20 + hash(c, 12) * (BH - 40);
    ck.beginPath(); for (let i = 0; i < 8; i++) { const a = i * 0.8 + hash(c, i) * 0.6, l = 20 + hash(c, i, 3) * 50; ck.moveTo(ox, oy); const mx2 = ox + Math.cos(a) * l * 0.5, my2 = oy + Math.sin(a) * l * 0.5; ck.lineTo(mx2, my2); ck.lineTo(ox + Math.cos(a + 0.2) * l, oy + Math.sin(a + 0.2) * l); } ck.stroke();
  }
  ck.fillStyle = "rgba(122,240,255,.08)"; ck.fillRect(-PX, 0, BW, BH);
  };
  // ---- bake every layer into chunks no wider/taller than CH device px (a canvas bigger than the GPU
  // limit falls back to software and is re-uploaded on every draw), and bake the reflections pre-flipped
  // (drawing a big image through a negative scale is a slow path too).
  // memory matters more than sharpness here: the carnival is a backdrop (<= 2x), the reflection is soft glass (1x)
  const S2 = Math.min(S, 2), S1 = 1;
  const flip = (fn) => (c) => { c.save(); c.translate(0, H); c.scale(1, -1); fn(c); c.restore(); };
  return {
    S, game,
    skyT: chunked(-PX, -BH, BW, BH, S2, drawSky),
    frontT: chunked(-PX, -BH, BW, BH, S2, drawFront),
    farR: chunked(-PX, H, BW, BH, S1, flip((c) => { drawSky(c); c.globalAlpha = 0.85; c.drawImage(ghost, W * 0.4, -BH + 4, 220, 150); c.globalAlpha = 1; })),
    nearR: chunked(-PX, H, BW, BH, S1, (c) => { flip(drawFront)(c); c.save(); c.translate(0, H); drawCrack(c); c.restore(); }),
    sideL: chunked(-PX, 0, PX, H, S2, (c) => { c.translate(-PX, 0); drawSide(c); }),
    sideR: chunked(W, 0, PX, H, S2, (c) => { c.translate(W + PX, 0); c.scale(-1, 1); drawSide(c); }),
  };

}
function bg(game, ctx) {
  const S = Math.min(2, scaleFor(ctx));
  // rebuild when we'd have to shrink the cache (slow) or it's become clearly blurry; the close-range
  // push-in only ever zooms in, so it never thrashes this
  if (!BG || BG.game !== game || S < BG.S || S > BG.S + 0.75) BG = buildBackdrop(game, S);
  return BG;
}
/* blit the part of a cached layer (world origin ox,oy, scale s) that falls inside box */
function blit(ctx, cv, s, ox, oy, box) {
  const cw = cv.width / s, ch = cv.height / s;
  const x0 = Math.max(box.x0, ox), x1 = Math.min(box.x1, ox + cw), y0 = Math.max(box.y0, oy), y1 = Math.min(box.y1, oy + ch);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(cv, (x0 - ox) * s, (y0 - oy) * s, (x1 - x0) * s, (y1 - y0) * s, x0, y0, x1 - x0, y1 - y0);
}
const CH = 2048; // max chunk side in device px
/* a world rect [x0,x0+w]x[y0,y0+h] cached at scale s, split into GPU-sized chunks; draw(g) paints in world coords */
function chunked(x0, y0, w, h, s, draw) {
  const out = [], step = Math.floor(CH / s);
  for (let cx = x0; cx < x0 + w; cx += step) for (let cy = y0; cy < y0 + h; cy += step) {
    const ww = Math.min(step, x0 + w - cx), hh = Math.min(step, y0 + h - cy);
    const c = document.createElement("canvas"); c.width = Math.ceil(ww * s); c.height = Math.ceil(hh * s);
    const g = c.getContext("2d"); g.setTransform(s, 0, 0, s, -cx * s, -cy * s); draw(g);
    out.push({ c, x: cx, y: cy, s });
  }
  return out;
}
function blitC(ctx, chunks, box) { for (const k of chunks) blit(ctx, k.c, k.s, k.x, k.y, box); }
function wheelSprite(r, k) {
  return sprite("mir-wheel" + r + "-" + k + "@" + RES, (r * 2 + 8) * RES, (r * 2 + 8) * RES, (g, w) => {
    g.scale(RES, RES); const c = r + 4; g.translate(c, c);
    g.strokeStyle = "#5a2a50"; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.82, 0, TAU); g.stroke();
    g.lineWidth = 0.8; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke();
    for (let i = 0; i < 32; i++) { const a = i * TAU / 32; circle(g, Math.cos(a) * r, Math.sin(a) * r, 1.5, NEON[(i + k) % NEON.length]); }
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + 0.1; circle(g, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 1, "#fff1b0"); }
    circle(g, 0, 0, 5, "#ffd23f"); grinFace(g, 0, 0, 4.2, "#f8efe2", 7);
  });
}
/* the same wheel, upside down, for the reflection (baked once: no negative-scale draws per frame) */
function wheelSpriteF(r, k) {
  const src = wheelSprite(r, k);
  return sprite("mir-wheelF" + r + "-" + k + "@" + RES, src.width, src.height, (g) => { g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0); });
}
const WHEELS = (W) => [{ x: W * 0.23, y: -82, r: 62, k: 0, dir: 1, sp: 0.11 }, { x: W * 0.64, y: -70, r: 48, k: 2, dir: -1, sp: 0.15 }];
/* Animated skyline. Coordinates are "top band" (y < 0); with fy = H the scene is drawn reflected
   below the map (y -> H - y), mirrored by hand rather than through a flipped transform. */
function drawWheels(ctx, game, t, box, reduced, fy = 0) {
  const W = game.w * T, tt = reduced ? 0 : t, sy = fy ? -1 : 1, Y = (y) => (fy ? fy - y : y);
  for (const wh of WHEELS(W)) {
    const cy = Y(wh.y), lo = Math.min(cy, Y(0)) - wh.r - 12, hi = Math.max(cy, Y(0)) + wh.r + 12;
    if (wh.x + wh.r + 10 < box.x0 || wh.x - wh.r - 10 > box.x1 || hi < box.y0 || lo > box.y1) continue;
    ctx.strokeStyle = "#2a1424"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wh.x, cy); ctx.lineTo(wh.x - wh.r * 0.6, Y(0)); ctx.moveTo(wh.x, cy); ctx.lineTo(wh.x + wh.r * 0.6, Y(0)); ctx.stroke(); // legs
    const a = tt * wh.sp * wh.dir, spr = fy ? wheelSpriteF(wh.r, wh.k) : wheelSprite(wh.r, wh.k), sz = wh.r * 2 + 8;
    ctx.save(); ctx.translate(wh.x, cy); ctx.rotate(a * sy); ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
    for (let i = 0; i < 8; i++) { // gondolas hang straight down; one is swinging when the rest are not
      const ga = a + i * TAU / 8, gx = wh.x + Math.cos(ga) * wh.r, gy = Y(wh.y + Math.sin(ga) * wh.r);
      const sw = i === 3 && !reduced ? Math.sin(t * 2.1) * 0.5 : 0;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(sw * sy);
      ctx.fillStyle = NEON[(i + wh.k) % NEON.length]; ctx.beginPath(); ctx.moveTo(-5, 3 * sy); ctx.lineTo(5, 3 * sy); ctx.lineTo(4, 10 * sy); ctx.lineTo(-4, 10 * sy); ctx.fill();
      ctx.fillStyle = "#fff4e0"; ctx.fillRect(-5.5, fy ? -3.5 : 2, 11, 1.5);
      if (i % 3 === 1) { circle(ctx, -1.5, 1 * sy, 1.6, "#1a0a20"); circle(ctx, 1.8, 0.6 * sy, 1.6, "#1a0a20"); } // riders, still in their seats
      ctx.restore();
    }
  }
}
function drawSkyLife(ctx, game, t, box, reduced, fy = 0) {
  const W = game.w * T, sy = fy ? -1 : 1, Y = (y) => (fy ? fy - y : y);
  // searchlights sweeping slowly from behind the hill
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const x = W * (0.15 + i * 0.35), a = -Math.PI / 2 + (reduced ? (i - 1) * 0.3 : Math.sin(t * 0.25 + i * 2) * 0.55);
    if (x < box.x0 - 200 || x > box.x1 + 200) continue;
    const gr = ctx.createLinearGradient(x, Y(-20), x + Math.cos(a) * 200, Y(-20 + Math.sin(a) * 200));
    gr.addColorStop(0, rgba(i === 1 ? "#ff7ad9" : "#9fe8ff", 0.16)); gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, Y(-20));
    ctx.lineTo(x + Math.cos(a - 0.08) * 220, Y(-20 + Math.sin(a - 0.08) * 220)); ctx.lineTo(x + Math.cos(a + 0.08) * 220, Y(-20 + Math.sin(a + 0.08) * 220)); ctx.fill();
  }
  ctx.restore();
  // loose balloons drifting up and to the LEFT (the pennants blow right)
  for (let i = 0; i < 14; i++) {
    const sp = 7 + hash(i, 41) * 6, life = BH + 40;
    const k = reduced ? hash(i, 44) : ((t * sp / life + hash(i, 44)) % 1);
    const x = ((hash(i, 42) * (W + 400) - (reduced ? 0 : t * (5 + hash(i, 43) * 6))) % (W + 400) + (W + 400)) % (W + 400) - 200;
    const y0 = -10 - k * life + Math.sin(t * 0.7 + i) * (reduced ? 0 : 3), y = Y(y0);
    if (x < box.x0 - 10 || x > box.x1 + 10 || y < box.y0 - 20 || y > box.y1 + 20) continue;
    const c = NEON[i % NEON.length];
    ctx.strokeStyle = "rgba(240,230,220,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, Y(y0 + 6)); ctx.quadraticCurveTo(x - 3, Y(y0 + 12), x + 1, Y(y0 + 18)); ctx.stroke();
    ellipse(ctx, x, y, 4.4, 5.6, c); circle(ctx, x - 1.5, y - 2 * sy, 1.2, "rgba(255,255,255,.75)");
    if (i % 5 === 0) { // a smiley one
      circle(ctx, x - 1.4, y - 0.5 * sy, 0.7, "#1a0a20"); circle(ctx, x + 1.4, y - 0.5 * sy, 0.7, "#1a0a20");
      ctx.strokeStyle = "#1a0a20"; ctx.lineWidth = 0.6; ctx.beginPath();
      if (fy) ctx.arc(x, y - 1, 2, Math.PI + 0.2, TAU - 0.2); else ctx.arc(x, y + 1, 2, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
}
/* Each region is drawn under its own axis-aligned rect clip (cheap), never one big path clip.
   m: margin kept clear above the top wall (tall heads reach up there when this runs over the figures). */
function region(ctx, r, fn) {
  if (r.x1 <= r.x0 || r.y1 <= r.y0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0); ctx.clip(); fn(r); ctx.restore();
}
function drawBackdrop(ctx, game, t, view, box, m) {
  const B = bg(game, ctx), L = lay(game), W = L.W, H = L.H, reduced = reducedOf(view);
  // the carnival above the map
  region(ctx, { x0: box.x0, x1: box.x1, y0: Math.max(box.y0, -BH), y1: Math.min(box.y1, -m) }, (r) => {
    blitC(ctx, B.skyT, r); drawSkyLife(ctx, game, t, r, reduced); drawWheels(ctx, game, t, r, reduced); blitC(ctx, B.frontT, r);
  });
  // below: the same carnival, reflected in floor-length cracked glass; something big is standing in it
  region(ctx, { x0: box.x0, x1: box.x1, y0: Math.max(box.y0, H), y1: Math.min(box.y1, H + BH) }, (r) => {
    blitC(ctx, B.farR, r); drawSkyLife(ctx, game, t, r, reduced, H); drawWheels(ctx, game, t, r, reduced, H); blitC(ctx, B.nearR, r);
    // the eyes in the reflected face: only they move, and they follow you
    const p = game.player, ex = W * 0.4 + 110, ey = H + BH - 4 - 58;
    if (r.x1 > ex - 60 && r.x0 < ex + 60 && r.y1 > ey - 20) for (const s of [-30, 30]) {
      const dx = p.x - (ex + s), dy = p.y - ey, d = Math.hypot(dx, dy) || 1;
      circle(ctx, ex + s + dx / d * 5, ey + dy / d * 7, 3.4, "#fff3b0");
    }
  });
  if (box.x0 < 0) blitC(ctx, B.sideL, { x0: box.x0, x1: Math.min(box.x1, 0), y0: box.y0, y1: box.y1 });
  if (box.x1 > W) blitC(ctx, B.sideR, { x0: Math.max(box.x0, W), x1: box.x1, y0: box.y0, y1: box.y1 });
}
/* Under the map only the thin strip by the top wall is ever seen (the glow pass draws the rest above the darkness). */
function backdrop(ctx, game, t, view, box) {
  if (box.y0 >= 0) return;
  const B = bg(game, ctx), r = { x0: box.x0, x1: box.x1, y0: Math.max(box.y0, -16), y1: 0 };
  blitC(ctx, B.skyT, r); blitC(ctx, B.frontT, r);
}

/* ================================================================ ambient */
function ambient(ctx, game, t, view, box) {
  const L = lay(game), reduced = reducedOf(view), tt = reduced ? 0 : t;
  // pennants: fluttering in a wind that blows to the right
  for (const r of L.pennants) {
    if (r.y < box.y0 - 20 || r.y > box.y1 + 20 || r.x1 < box.x0 || r.x0 > box.x1) continue;
    const step = 9, i0 = Math.max(0, Math.floor((box.x0 - r.x0) / step) - 1), i1 = Math.min(Math.floor((r.x1 - r.x0) / step), Math.ceil((box.x1 - r.x0) / step) + 1);
    ctx.strokeStyle = "#1a0e0c"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = i0; i <= i1; i++) { const x = r.x0 + i * step; ctx.lineTo(x, r.y + Math.sin(i * 0.9) * 0.6 + 1.4 * Math.sin((i % 12) / 12 * Math.PI)); } ctx.stroke();
    for (let c = 0; c < NEON.length + 1; c++) {
      ctx.fillStyle = c === NEON.length ? "#151015" : NEON[c]; ctx.beginPath();
      for (let i = i0; i < i1; i++) {
        const torn = hash(i, r.y | 0, 7) < 0.08, col = torn ? NEON.length : i % NEON.length; if (col !== c) continue;
        const x = r.x0 + i * step, y = r.y + 1.4 * Math.sin((i % 12) / 12 * Math.PI);
        const fl = Math.sin(tt * 4.2 + i * 0.8) * 1.6 + 1.2, len = r.roof ? 8 : 9;
        ctx.moveTo(x + 0.6, y); ctx.lineTo(x + step - 1.2, y); ctx.lineTo(x + step / 2 + fl, y + len * (torn ? 0.6 : 1));
      }
      ctx.fill();
    }
  }
  // balloon clusters on the inner corners, bobbing
  for (const b of L.balloons) {
    if (b.x < box.x0 - 30 || b.x > box.x1 + 30 || b.y < box.y0 - 30 || b.y > box.y1 + 30) continue;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.32, bx = b.x + Math.cos(a) * 12 + Math.sin(tt * 1.3 + i + b.seed) * 1.2, by = b.y - 4 + Math.sin(a) * 12 + Math.cos(tt * 1.1 + i) * 1;
      ctx.strokeStyle = "rgba(230,220,210,.6)"; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(b.x, b.y + 4); ctx.lineTo(bx, by + 4); ctx.stroke();
      ellipse(ctx, bx, by, 3.6, 4.4, NEON[(i + b.seed) % NEON.length]); circle(ctx, bx - 1.1, by - 1.6, 0.9, "rgba(255,255,255,.7)");
    }
    circle(ctx, b.x, b.y + 4, 1.4, "#c9a54a");
  }
  // the reflections near you turn their heads to look
  const p = game.player;
  for (const m of L.mirrors) {
    if (!m.watch) continue;
    const hx = m.tx * T + T / 2, hy = m.ty * T + T * 0.3;
    const dx = p.x - hx, dy = (p.y - 14) - hy, d = Math.hypot(dx, dy);
    if (d > 170 || hx < box.x0 || hx > box.x1 || hy < box.y0 || hy > box.y1) continue;
    const ux = dx / (d || 1), uy = dy / (d || 1);
    for (const s of [-1.6, 1.6]) { circle(ctx, hx + s, hy - 0.5, 1.15, "#f2f6ff"); circle(ctx, hx + s + ux * 0.55, hy - 0.5 + uy * 0.55, 0.6, "#05030a"); }
  }
}

/* ================================================================ glow */
function glow(ctx, game, t, view, box) {
  RES = scaleFor(ctx);
  const L = lay(game), reduced = reducedOf(view), W = L.W, H = L.H;
  ctx.save();
  // 1) the world beyond the tent, drawn again above the darkness (it is not in the lightmap)
  ctx.globalAlpha = 0.9; drawBackdrop(ctx, game, t, view, box, 14);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  // 2) neon (additive: it lights what it passes, never hides a figure)
  ctx.globalCompositeOperation = "lighter";
  const buzz = (seed) => { // slow breathing, plus a rare soft dip (well under 3 per second)
    if (reduced) return 0.85;
    const dip = Math.max(0, Math.sin(t * 0.37 + seed * 9) - 0.96) * 18;
    return clamp(0.78 + 0.1 * Math.sin(t * 1.7 + seed * 5) - dip, 0.25, 1);
  };
  for (const s of L.signs) {
    if (s.x1 < box.x0 || s.x0 > box.x1 || s.y + s.h < box.y0 || s.y > box.y1) continue;
    const spr = neonSprite(s), pad = 10;
    ctx.globalAlpha = buzz(s.x0 * 0.001 + s.y * 0.01);
    ctx.drawImage(spr, s.x0 - pad, s.y - pad, s.x1 - s.x0 + pad * 2, s.h + pad * 2);
    // chase lights running along the frame (slow; under reduced motion they stand still)
    const step = s.h > 20 ? 14 : 16, n = Math.floor((s.x1 - s.x0 - 9) / step) + 1, ph = reduced ? 0 : Math.floor(t * 2.5) % 3;
    const gs = glowSprite("#fff1b0");
    for (let i = 0; i < n; i++) {
      if ((i + ph) % 3) continue;
      const x = s.x0 + 6 + i * step; if (x < box.x0 || x > box.x1) continue;
      ctx.globalAlpha = 0.55; ctx.drawImage(gs, x - 5, s.y - 4.5, 10, 10); ctx.drawImage(gs, x - 5, s.y + s.h - 5.5, 10, 10);
    }
  }
  for (const l of L.letters) {
    if (l.x < box.x0 - 20 || l.x > box.x1 + 20 || l.y < box.y0 - 20 || l.y > box.y1 + 20) continue;
    ctx.globalAlpha = buzz(l.y * 0.013 + l.x * 0.001); ctx.drawImage(letterSprite(l.ch, l.color), l.x - 20, l.y - 21, 40, 40);
  }
  // 3) eyes that follow you: the clown faces at the mouths, and the eyes round the way in
  const p = game.player;
  const eye = (ex, ey, r) => {
    if (ex < box.x0 - 20 || ex > box.x1 + 20 || ey < box.y0 - 20 || ey > box.y1 + 20) return;
    const dx = p.x - ex, dy = p.y - 14 - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 120) * r * 0.45;
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.6; ctx.drawImage(glowSprite("#fff3b0"), ex - r * 2.2, ey - r * 2.2, r * 4.4, r * 4.4);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 0.9;
    circle(ctx, ex + dx / d * k, ey + dy / d * k, r * 0.42, "#05030a");
    circle(ctx, ex + dx / d * k - r * 0.12, ey + dy / d * k - r * 0.12, r * 0.12, "#fffbe8");
  };
  for (const f of L.faces) if (!f.door) for (const s of [-1, 1]) eye(f.gx * T + T / 2 + s * 3 * T, f.ty * T + T / 2, 5);
  for (const e of L.doorEyes) eye(e.x, e.y, 8.5);
  ctx.restore();
}

export default { paint, backdrop, ambient, glow };
