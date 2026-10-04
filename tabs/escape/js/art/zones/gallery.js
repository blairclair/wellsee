/* Stage backdrop for the "gallery" zone: The Portrait Gallery, Arthur Benning's shooting gallery.
   Owned by ONE agent; see art/zones/README.md.

   The lit hall is a shooting gallery: a painted backboard of bullseyes and too-toothy clowns
   with neon slogans over it (some slogans change when you are not reading them), a conveyor of
   tin ducks (one in seven is a doll's head), and the shooting counter with chained popguns along
   the far side. The dark side rooms are Arthur's portrait studio: framed photographs of past
   guests and face-in-the-hole cutout boards whose holes are not empty; their eyes follow you.
   Beyond the map edges: the fair at night (Ferris wheels, striped tent peaks, a clown billboard,
   balloons drifting against the wind) to the north; to the south, tent roofs and a queue of
   guests standing very still, waiting their turn.

   Lighting: everything outside the map is drawn in `glow` (after the darkness, clipped to the
   void) because the darkness pass multiplies the void down to ~3%. Inside the map, colour comes
   from api.lights / api.bulbs baked into the static lightmap plus neon sprites in `glow`. */
import { TILE, TILES } from "../../content.js";
import { TAU, hash, circle, ellipse, sprite, glowSprite, clamp } from "../util.js";

const FH = 13; // wall front-face height (matches tiles.js)
const NEON = ["#ff3da8", "#3df0ff", "#ffe04a", "#7dff4a", "#ff8a2a", "#c070ff"];
const PANEL = ["#ffcf26", "#ff3d7f", "#21c7c7", "#8a3dff", "#ff7a1a", "#3ddc6a"];
const SIGNS = [
  ["SHOOTING GALLERY", null], ["HOLD STILL", null], ["SAY CHEESE!", "SAY NOTHING"], ["EVERYBODY WINS", "EVERYBODY STAYS"],
  ["KNOCK 'EM DOWN", "KEEP 'EM"], ["SMILE!", "SMILE FOREVER"], ["WIN A PORTRAIT", "BE A PORTRAIT"], ["NO ONE LEAVES UGLY", "NO ONE LEAVES"],
  ["STEP RIGHT UP", "STEP RIGHT IN"],
];
const SIGN_FONT = '900 9px "Arial Black", Impact, "Helvetica Neue", sans-serif';

/* ---------------------------------------------------------------- layout (per game, cached) */
let L = null;
function solid(game, tx, ty) { return tx < 0 || ty < 0 || tx >= game.w || ty >= game.h || !!TILES[game.tiles[ty * game.w + tx]].solid; }
function nameAt(game, tx, ty) { return game.tiles[ty * game.w + tx]; }
function layout(game) {
  if (L && L.game === game) return L;
  const lampRows = [];
  for (let ty = 0; ty < game.h; ty++) { let n = 0; for (let tx = 0; tx < game.w; tx++) if (nameAt(game, tx, ty) === "lamp") n++; if (n > 2) lampRows.push(ty); }
  const NW = lampRows.length ? lampRows[0] - 1 : 9, SW = lampRows.length ? lampRows[lampRows.length - 1] + 1 : 15;
  // horizontal runs of wall on a row (tent only, so lamps/doors break them)
  const runs = (ty, test) => {
    const out = []; let s = -1;
    for (let tx = 0; tx <= game.w; tx++) {
      const ok = tx < game.w && nameAt(game, tx, ty) === "tent" && test(tx);
      if (ok && s < 0) s = tx;
      if (!ok && s >= 0) { out.push([s, tx - 1]); s = -1; }
    }
    return out;
  };
  const north = runs(NW, (tx) => !solid(game, tx, NW + 1));
  const counter = runs(SW, (tx) => !solid(game, tx, SW - 1));
  const top = runs(0, (tx) => !solid(game, tx, 1));
  const lowerTop = runs(SW, (tx) => !solid(game, tx, SW + 1));
  const bottom = runs(game.h - 1, (tx) => !solid(game, tx, game.h - 2));
  // single-column partitions in the side rooms: wall with floor left and right
  const posts = [];
  for (let tx = 0; tx < game.w; tx++) {
    let s = -1;
    for (let ty = 0; ty <= game.h; ty++) {
      const ok = ty < game.h && ty !== NW && ty !== SW && ty > 0 && ty < game.h - 1 && nameAt(game, tx, ty) === "tent" &&
        (tx === 0 || tx === game.w - 1 || (!solid(game, tx - 1, ty) && !solid(game, tx + 1, ty)));
      if (ok && s < 0) s = ty;
      if (!ok && s >= 0) { if (ty - s >= 2) posts.push([tx, s, ty - 1]); s = -1; }
    }
  }
  L = { game, NW, SW, north, counter, top, lowerTop, bottom, posts, signs: [], eyes: [], ducks: [], flags: [] };
  // the signs: one per north run, centred
  north.forEach(([a, b], i) => {
    const [txt, alt] = SIGNS[i % SIGNS.length], w = Math.min((b - a + 1) * TILE - 24, measure(txt) + 14);
    const cx = (a + b + 1) / 2 * TILE;
    L.signs.push({ x0: cx - w / 2, x1: cx + w / 2, cx, y: NW * TILE + 1, h: 17, txt, alt, color: NEON[i % NEON.length], seed: hash(i, 9, 3) });
  });
  // cutout boards along the partitions, every 3 tiles, not next to a doorway
  for (const [tx, y0, y1] of L.posts) {
    for (let ty = y0; ty + 1 <= y1; ty += 3) {
      if (ty + 1 > y1) break;
      L.eyes.push({ kind: "cut", x: (tx + 0.5) * TILE, y: ty * TILE + 13, v: (tx * 7 + ty) % 4, tx, ty });
    }
  }
  return L;
}
let mctx = null;
function measure(txt) {
  if (!mctx) mctx = document.createElement("canvas").getContext("2d");
  mctx.font = SIGN_FONT; return mctx.measureText(txt).width;
}

/* ---------------------------------------------------------------- small painted things */
function clownFace(g, x, y, r, seed) {
  circle(g, x, y, r, "#f4ece0");
  g.fillStyle = "#1a0a10"; // diamond eyes
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * r * 0.4, y - r * 0.62); g.lineTo(x + s * r * 0.58, y - r * 0.32); g.lineTo(x + s * r * 0.4, y - r * 0.02); g.lineTo(x + s * r * 0.22, y - r * 0.32); g.fill(); }
  circle(g, x, y + r * 0.05, r * 0.2, "#e01030"); // nose
  // the grin: far too wide, far too many teeth
  g.fillStyle = "#b0102a"; g.beginPath(); g.moveTo(x - r * 0.95, y + r * 0.15); g.quadraticCurveTo(x, y + r * 1.25, x + r * 0.95, y + r * 0.15); g.quadraticCurveTo(x, y + r * 0.55, x - r * 0.95, y + r * 0.15); g.fill();
  g.fillStyle = "#fff8e8"; const n = 9;
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n, tx = x - r * 0.85 + k * r * 1.7, ty = y + r * 0.32 + Math.sin(k * Math.PI) * r * 0.2;
    g.beginPath(); g.moveTo(tx - r * 0.09, ty); g.lineTo(tx + r * 0.09, ty); g.lineTo(tx, ty + r * 0.2); g.fill();
  }
  if (seed < 0.4) { g.fillStyle = "rgba(150,10,20,.8)"; g.fillRect(x + r * 0.3, y + r * 0.7, 0.8, r * 0.7); } // a drip
}
function bullseye(g, x, y, r, holes) {
  const cols = ["#e8102c", "#fff4e0", "#e8102c", "#fff4e0", "#1a0a10"];
  for (let i = 0; i < cols.length; i++) circle(g, x, y, r * (1 - i * 0.2), cols[i]);
  for (let i = 0; i < holes; i++) circle(g, x + (hash(x, i, 1) - 0.5) * r * 1.4, y + (hash(y, i, 2) - 0.5) * r * 1.4, 0.7, "#000");
}
function duckShape(g, x, y, s, col) {
  g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 4.2 * s, 2.8 * s, 0, 0, TAU); g.fill();
  circle(g, x + 3 * s, y - 2.8 * s, 2 * s, col);
  g.fillStyle = "#e0601a"; g.fillRect(x + 4.6 * s, y - 3 * s, 2 * s, 1 * s);
  circle(g, x + 3.4 * s, y - 3.2 * s, 0.5 * s, "#000");
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x - 3 * s, y + 0.8 * s, 6 * s, 1 * s);
}
function star(g, x, y, r, col) {
  g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.fill();
}
function plush(g, x, y, seed) { // a prize bear; its eyes are stitched shut, or it has none
  const c = ["#d98fb0", "#a0d0ff", "#f0e08a", "#c0a0ff"][(seed * 4) | 0];
  circle(g, x, y + 2, 4.5, c); circle(g, x, y - 3, 3.6, c); circle(g, x - 3, y - 6, 1.4, c); circle(g, x + 3, y - 6, 1.4, c);
  g.strokeStyle = "#2a0a10"; g.lineWidth = 0.6; g.beginPath();
  g.moveTo(x - 2, y - 4); g.lineTo(x - 0.6, y - 2.6); g.moveTo(x - 0.6, y - 4); g.lineTo(x - 2, y - 2.6);
  g.moveTo(x + 0.6, y - 4); g.lineTo(x + 2, y - 2.6); g.moveTo(x + 2, y - 4); g.lineTo(x + 0.6, y - 2.6);
  g.moveTo(x - 1.6, y - 1.2); g.lineTo(x + 1.6, y - 1.2); g.stroke();
}

/* a framed photograph of a past guest */
function portrait(g, x, y, w, h, seed, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
  g.fillStyle = "#c8962e"; g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle = "#7a5414"; g.fillRect(-w / 2 + 0.8, -h / 2 + 0.8, w - 1.6, h - 1.6);
  g.fillStyle = "#e0b448"; g.fillRect(-w / 2 + 1.6, -h / 2 + 1.6, w - 3.2, h - 3.2);
  const iw = w - 5, ih = h - 5;
  const gr = g.createLinearGradient(0, -ih / 2, 0, ih / 2); gr.addColorStop(0, "#8a7050"); gr.addColorStop(1, "#3e2c1a");
  g.fillStyle = gr; g.fillRect(-iw / 2, -ih / 2, iw, ih);
  // the sitter: shoulders, a head, a face that is wrong
  const hr = Math.min(iw, ih) * 0.24, hy = -ih * 0.08;
  g.fillStyle = "#1e1410"; g.beginPath(); g.ellipse(0, ih / 2, iw * 0.42, ih * 0.3, 0, Math.PI, TAU); g.fill();
  ellipse(g, 0, hy, hr, hr * 1.2, "#d8c4a0");
  const v = (seed * 5) | 0;
  if (v === 0) { // a painted grin, ear to ear
    g.fillStyle = "#8a0a1a"; g.beginPath(); g.moveTo(-hr * 0.9, hy + hr * 0.2); g.quadraticCurveTo(0, hy + hr * 1.1, hr * 0.9, hy + hr * 0.2); g.quadraticCurveTo(0, hy + hr * 0.55, -hr * 0.9, hy + hr * 0.2); g.fill();
    circle(g, -hr * 0.4, hy - hr * 0.25, 0.8, "#000"); circle(g, hr * 0.4, hy - hr * 0.25, 0.8, "#000");
  } else if (v === 1) { // eyes scratched out
    g.strokeStyle = "#0a0505"; g.lineWidth = 0.8; g.beginPath();
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.moveTo(s * hr * 0.6, hy - hr * 0.5 + i * 0.6); g.lineTo(s * hr * 0.15, hy + i * 0.6 - hr * 0.05); }
    g.stroke(); g.fillStyle = "#3a1010"; g.fillRect(-hr * 0.3, hy + hr * 0.45, hr * 0.6, 0.7);
  } else if (v === 2) { // no face at all
    g.fillStyle = "rgba(255,255,255,.18)"; g.beginPath(); g.ellipse(-hr * 0.3, hy - hr * 0.4, hr * 0.3, hr * 0.2, -0.5, 0, TAU); g.fill();
  } else if (v === 3) { // a clown, of course
    circle(g, 0, hy + hr * 0.05, hr * 0.22, "#d0102a");
    g.fillStyle = "#000"; g.fillRect(-hr * 0.55, hy - hr * 0.4, hr * 0.3, hr * 0.3); g.fillRect(hr * 0.25, hy - hr * 0.4, hr * 0.3, hr * 0.3);
    g.fillStyle = "#8a0a1a"; g.fillRect(-hr * 0.7, hy + hr * 0.45, hr * 1.4, hr * 0.25);
    g.fillStyle = "#f0e8d8"; for (let i = 0; i < 6; i++) g.fillRect(-hr * 0.65 + i * hr * 0.23, hy + hr * 0.45, hr * 0.12, hr * 0.12);
  } else { // looking over its own shoulder, at you
    ellipse(g, hr * 0.25, hy, hr * 0.75, hr * 1.15, "#c8b490");
    circle(g, hr * 0.55, hy - hr * 0.2, 0.9, "#000"); circle(g, hr * 0.05, hy - hr * 0.2, 0.9, "#000");
  }
  g.fillStyle = "rgba(255,240,200,.08)"; g.fillRect(-iw / 2, -ih / 2, iw * 0.45, ih); // glass sheen
  g.restore();
}

/* face-in-the-hole cutout board; the hole is at (0, 0) relative to x,y */
function cutout(g, x, y, v) {
  g.save(); g.translate(x, y);
  const board = ["#ff4f9a", "#ffd23a", "#38d6d0", "#e8402a"][v], trim = ["#ffe04a", "#e8102c", "#ff3da8", "#ffe8b0"][v];
  g.fillStyle = "rgba(0,0,0,.5)"; g.beginPath(); g.ellipse(0, 34, 13, 3, 0, 0, TAU); g.fill();
  g.fillStyle = "#4a2a14"; g.fillRect(-1.5, 22, 3, 12); // the prop stand
  // board silhouette: a rounded body
  g.fillStyle = trim; g.beginPath(); g.moveTo(-13, 30); g.lineTo(-13, 2); g.quadraticCurveTo(-13, -12, 0, -12); g.quadraticCurveTo(13, -12, 13, 2); g.lineTo(13, 30); g.closePath(); g.fill();
  g.fillStyle = board; g.beginPath(); g.moveTo(-11.5, 28.5); g.lineTo(-11.5, 2); g.quadraticCurveTo(-11.5, -10.5, 0, -10.5); g.quadraticCurveTo(11.5, -10.5, 11.5, 2); g.lineTo(11.5, 28.5); g.closePath(); g.fill();
  if (v === 0) { // strongman: leotard stripes and a barbell
    g.fillStyle = "#1a0a10"; for (let i = 0; i < 4; i++) g.fillRect(-8, 10 + i * 4, 16, 2);
    g.fillStyle = "#2a2a30"; g.fillRect(-12, 7, 24, 1.6); circle(g, -12, 7.8, 3, "#1a1a20"); circle(g, 12, 7.8, 3, "#1a1a20");
  } else if (v === 1) { // clown: ruffle collar and polka dots
    for (let i = 0; i < 6; i++) circle(g, -9 + i * 3.6, 9, 2.2, i % 2 ? "#ff3d7f" : "#fff4e0");
    for (let i = 0; i < 7; i++) circle(g, -8 + hash(i, v, 1) * 16, 14 + hash(i, v, 2) * 13, 1.3, ["#3df0ff", "#ff3d7f", "#7dff4a"][i % 3]);
  } else if (v === 2) { // bathing beauty: striped suit
    for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#fff4e0" : "#e8102c"; g.fillRect(-7, 9 + i * 3.4, 14, 3.4); }
    g.fillStyle = "#f0c8a0"; g.fillRect(-7, 26, 4, 3); g.fillRect(3, 26, 4, 3);
  } else { // ringmaster: a painted top hat above the hole, gold buttons
    g.fillStyle = "#1a0a10"; g.fillRect(-6, -19, 12, 10); g.fillRect(-9, -10, 18, 2);
    g.fillStyle = "#e8102c"; g.fillRect(-6, -12, 12, 1.5);
    for (let i = 0; i < 4; i++) circle(g, 0, 11 + i * 4.5, 1.2, "#ffd23a");
  }
  // the hole, and the dark behind it that is not empty
  ellipse(g, 0, 0, 5.8, 7, "#ffe8b0");
  ellipse(g, 0, 0, 5, 6.2, "#050203");
  g.fillStyle = "#1a0a10"; g.font = '900 4px "Arial Black", Impact, sans-serif'; g.textAlign = "center";
  g.fillText(["SMILE!", "SAY CHEESE", "HOLD STILL", "YOUR FACE"][v], 0, 26.5);
  g.restore();
}

/* ---------------------------------------------------------------- paint: baked once */
function paint(ctx, game, api) {
  const Lt = layout(game), NW = Lt.NW, SW = Lt.SW;
  ctx.save();
  // --- the backboard over the hall's north wall
  for (const [a, b] of Lt.north) {
    const x0 = a * TILE, x1 = (b + 1) * TILE, y0 = NW * TILE, top = TILE - FH;
    ctx.fillStyle = "#2a1208"; ctx.fillRect(x0, y0, x1 - x0, top + 1);
    for (let tx = a; tx <= b; tx++) {
      const x = tx * TILE, col = PANEL[(tx * 5 + 3) % PANEL.length];
      ctx.fillStyle = col; ctx.fillRect(x + 1, y0 + 1.5, TILE - 2, top - 2);
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x + 1, y0 + 1.5, TILE - 2, 1.4);
      ctx.fillStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 4; i++) ctx.fillRect(x + 1 + i * 8, y0 + 1.5, 4, top - 2); // painted stripes
    }
    // the icons, skipping where the sign sits
    const sign = Lt.signs.find((s) => s.cx > x0 && s.cx < x1);
    for (let tx = a; tx <= b; tx++) {
      const cx = (tx + 0.5) * TILE, cy = y0 + top / 2 + 0.5, k = hash(tx, NW, 11);
      if (sign && cx + 12 > sign.x0 && cx - 12 < sign.x1) continue;
      const kind = (tx * 3) % 5;
      if (kind === 0) bullseye(ctx, cx, cy, 7.5, 3 + ((k * 4) | 0));
      else if (kind === 1) clownFace(ctx, cx, cy - 1, 7.5, k);
      else if (kind === 2) { duckShape(ctx, cx - 1, cy + 2, 1.3, "#ffd23a"); circle(ctx, cx - 3, cy + 1, 0.9, "#000"); circle(ctx, cx + 2, cy, 0.7, "#000"); }
      else if (kind === 3) { star(ctx, cx, cy, 8, "#fff4e0"); star(ctx, cx, cy, 5.5, "#e8102c"); }
      else { plush(ctx, cx - 5, cy + 1, k); plush(ctx, cx + 6, cy + 1, hash(tx, 2, 7)); }
    }
    // the front face: a conveyor slot the ducks run along
    const fy = y0 + top;
    ctx.fillStyle = "#120806"; ctx.fillRect(x0, fy, x1 - x0, FH);
    ctx.fillStyle = "#3a3a44"; ctx.fillRect(x0, fy + FH - 3, x1 - x0, 1.5);
    ctx.fillStyle = "#8a6a20"; ctx.fillRect(x0, fy, x1 - x0, 1);
    for (const ex of [x0 + 3, x1 - 3]) { circle(ctx, ex, fy + FH - 2.5, 2.4, "#2a2a30"); circle(ctx, ex, fy + FH - 2.5, 0.8, "#6a6a70"); }
  }
  // the signs: a cream board with a bulb-studded border, unlit tubes painted on (neon in glow)
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const s of Lt.signs) {
    ctx.fillStyle = "#1a0a10"; ctx.fillRect(s.x0 - 2, s.y - 1, s.x1 - s.x0 + 4, s.h + 2);
    ctx.fillStyle = "#e8102c"; ctx.fillRect(s.x0 - 1, s.y, s.x1 - s.x0 + 2, s.h);
    ctx.fillStyle = "#24080e"; ctx.fillRect(s.x0 + 1.5, s.y + 2.5, s.x1 - s.x0 - 3, s.h - 5);
    ctx.font = SIGN_FONT; ctx.fillStyle = "#4a2030"; ctx.fillText(s.txt, s.cx, s.y + s.h / 2 + 0.5);
    const n = Math.max(3, Math.floor((s.x1 - s.x0) / 13));
    for (let i = 0; i <= n; i++) {
      const bx = s.x0 + (s.x1 - s.x0) * i / n, sd = hash(i, s.cx, 5);
      api.bulbs.push({ x: bx, y: s.y + 0.5, color: i % 2 ? "#fff3b0" : s.color, seed: sd, state: sd < 0.15 ? "dead" : sd < 0.3 ? "flicker" : "on" });
    }
    api.lights.push({ x: s.cx, y: s.y + s.h + 10, r: 92, color: s.color, flicker: 0.05, seed: s.seed });
  }
  // --- the shooting counter along the hall's south side
  for (const [a, b] of Lt.counter) {
    const x0 = a * TILE, x1 = (b + 1) * TILE, y0 = SW * TILE, top = TILE - FH;
    ctx.fillStyle = "#3a1a0c"; ctx.fillRect(x0, y0, x1 - x0, top);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#5a2e16" : "#4e2812"; ctx.fillRect(x0, y0 + 2 + i * 4, x1 - x0, 4); }
    ctx.fillStyle = "#9a6a30"; ctx.fillRect(x0, y0, x1 - x0, 2); // worn front lip
    ctx.fillStyle = "rgba(255,220,160,.25)"; ctx.fillRect(x0, y0, x1 - x0, 0.7);
    for (let tx = a; tx <= b; tx++) {
      const cx = (tx + 0.5) * TILE, k = hash(tx, SW, 4), kind = (tx + a) % 4;
      if (kind === 0) { // a popgun on a chain, pointed at the targets
        ctx.save(); ctx.translate(cx, y0 + 10); ctx.rotate(-0.25 + k * 0.5);
        ctx.fillStyle = "#6a3a1a"; ctx.fillRect(-2, 1, 4, 7);
        ctx.fillStyle = "#3a3a44"; ctx.fillRect(-1.2, -9, 2.4, 11); ctx.fillStyle = "#c8a060"; ctx.fillRect(-1.6, -10, 3.2, 1.6);
        ctx.restore();
        ctx.strokeStyle = "#8a8a90"; ctx.lineWidth = 0.6; ctx.setLineDash([1, 0.8]); ctx.beginPath(); ctx.moveTo(cx, y0 + 17); ctx.quadraticCurveTo(cx + 6, y0 + 18, cx + 9, y0 + 14); ctx.stroke(); ctx.setLineDash([]);
      } else if (kind === 1) { // price card
        ctx.fillStyle = "#fff4e0"; ctx.fillRect(cx - 13, y0 + 4, 26, 11); ctx.fillStyle = "#e8102c"; ctx.fillRect(cx - 13, y0 + 4, 26, 2);
        ctx.fillStyle = "#1a0a10"; ctx.font = '900 4.4px "Arial Black", Impact, sans-serif';
        ctx.fillText(["3 SHOTS 10¢", "NO REFUNDS", "ALL PRIZES FINAL", "AIM FOR THE EYES"][((tx * 7) >> 1) % 4], cx, y0 + 11);
      } else if (kind === 2) { // a pyramid of tin cans, painted with smiles
        for (let r = 0; r < 3; r++) for (let i = 0; i <= r; i++) {
          const px = cx - r * 2.6 + i * 5.2, py = y0 + 5 + r * 4.4;
          ctx.fillStyle = ["#e8102c", "#ffd23a", "#38d6d0"][(i + r) % 3]; ctx.fillRect(px - 2.3, py - 2, 4.6, 4.2);
          ctx.fillStyle = "#1a0a10"; ctx.fillRect(px - 1.2, py + 0.6, 2.4, 0.5);
        }
      } else plush(ctx, cx, y0 + 10, k);
      if ((tx - a) % 6 === 2) api.lights.push({ x: cx, y: y0 + 6, r: 64, color: "#ffb060", flicker: 0.1, seed: k }); // a hooded lamp over the counter
    }
  }
  // --- the portrait studio: photographs on the outer walls of the side rooms
  Lt.eyes = Lt.eyes.filter((e) => e.kind !== "pic"); // paint reruns on zoom changes
  const lampX = (runs) => runs.filter(([a, b]) => b - a >= 3).map(([a, b]) => (a + b + 1) / 2 * TILE);
  const topLamps = lampX(Lt.top), lowLamps = lampX(Lt.lowerTop); // the darkroom safelights (below) take these slots
  for (const [a, b] of Lt.top) for (let x = a * TILE + 18; x < (b + 1) * TILE - 12; x += 38) {
    if (topLamps.some((q) => Math.abs(q - x) < 28)) continue;
    const k = hash(x, 0, 21); portrait(ctx, x, 16, 22, 26, k, (k - 0.5) * 0.12);
    if (k > 0.55) Lt.eyes.push({ kind: "pic", x: x, y: 14, v: 0 });
  }
  for (const [a, b] of Lt.lowerTop) for (let x = a * TILE + 14; x < (b + 1) * TILE - 10; x += 30) {
    if (lowLamps.some((q) => Math.abs(q - x) < 24)) continue;
    const k = hash(x, SW, 22); portrait(ctx, x, SW * TILE + TILE - 7, 14, 12, k, (k - 0.5) * 0.25);
  }
  for (const [a, b] of Lt.bottom) for (let x = a * TILE + 20; x < (b + 1) * TILE - 12; x += 44) {
    const k = hash(x, game.h, 23); portrait(ctx, x, (game.h - 1) * TILE + 12, 20, 18, k, (k - 0.5) * 0.5); // stacked, leaning, waiting
  }
  // --- face-in-the-hole boards along the partitions
  for (const e of Lt.eyes) if (e.kind === "cut") cutout(ctx, e.x, e.y, e.v);
  // --- the side rooms are Arthur's darkrooms: a sign and a red safelight per room, in a gap among the photographs.
  //     A small pool only (constraint: the rooms must stay dark for gameplay; this lights the wall decor, not the floor)
  Lt.safe = [];
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const [lamps, row] of [[topLamps, 0], [lowLamps, SW]]) for (const cx of lamps) {
    const wy = row * TILE + TILE - 4;
    if (row === 0) { // a full sign on the outer wall
      ctx.fillStyle = "#1a0a10"; ctx.fillRect(cx - 18, wy - 23, 36, 13);
      ctx.fillStyle = "#e8102c"; ctx.fillRect(cx - 17, wy - 22, 34, 11);
      ctx.font = '900 5px "Arial Black", Impact, sans-serif'; ctx.fillStyle = "#fff4e0"; ctx.fillText("DARKROOM", cx, wy - 18.6);
      ctx.font = '900 3px "Arial Black", Impact, sans-serif'; ctx.fillStyle = "#ffe04a"; ctx.fillText("KEEP SMILING", cx, wy - 13.6);
    } else { // the counter's back face is only 13px tall: a slim plate
      ctx.fillStyle = "#e8102c"; ctx.fillRect(cx - 15, wy - 12, 30, 6);
      ctx.font = '900 4px "Arial Black", Impact, sans-serif'; ctx.fillStyle = "#fff4e0"; ctx.fillText("DARKROOM", cx, wy - 8.8);
    }
    ctx.fillStyle = "#14080a"; ctx.beginPath(); ctx.moveTo(cx - 6, wy - 1); ctx.lineTo(cx - 3, wy - 7); ctx.lineTo(cx + 3, wy - 7); ctx.lineTo(cx + 6, wy - 1); ctx.fill();
    ctx.fillStyle = "#5a0a0e"; ctx.fillRect(cx - 4, wy - 1.5, 8, 2);
    api.lights.push({ x: cx, y: wy + 22, r: 92, color: "#9a0a12", flicker: 0.03, seed: hash(cx, row, 77) });
    Lt.safe.push({ x: cx, y: wy, seed: hash(cx, row, 78) });
  }
  // --- floor: a little confetti and spent photographs, along the walls only
  for (let ty = 1; ty < game.h - 1; ty++) for (let tx = 1; tx < game.w - 1; tx++) {
    if (solid(game, tx, ty) || nameAt(game, tx, ty) !== "dirt") continue;
    const nearWall = solid(game, tx, ty - 1) || solid(game, tx, ty + 1);
    if (!nearWall) continue;
    const hall = ty > NW && ty < SW, k = hash(tx, ty, 41);
    if (hall && k < 0.55) {
      const wy = solid(game, tx, ty - 1) ? ty * TILE + 2 : (ty + 1) * TILE - 6;
      for (let i = 0; i < 6; i++) { ctx.fillStyle = PANEL[(i + tx) % PANEL.length]; ctx.globalAlpha = 0.75; ctx.fillRect(tx * TILE + hash(tx, ty, 50 + i) * TILE, wy + hash(tx, ty, 60 + i) * 4, 1.6, 1.1); }
      ctx.globalAlpha = 1;
    } else if (!hall && k < 0.12) { // a print, face down; or face up
      const px = tx * TILE + 6 + hash(tx, ty, 42) * 20, py = solid(game, tx, ty - 1) ? ty * TILE + 5 : (ty + 1) * TILE - 6;
      ctx.save(); ctx.translate(px, py); ctx.rotate(hash(tx, ty, 43) * 1.4 - 0.7);
      ctx.fillStyle = "#d8d0c0"; ctx.fillRect(-3.5, -4, 7, 8); ctx.fillStyle = "#3a2a1a"; ctx.fillRect(-2.6, -3.2, 5.2, 5);
      circle(ctx, 0, -1.2, 1.3, "#c8b490"); ctx.fillStyle = "#8a0a1a"; ctx.fillRect(-0.9, -0.6, 1.8, 0.4);
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- ambient: ducks, bunting, spinners */
function duckSprite(head) {
  return sprite(head ? "gal-head" : "gal-duck", 40, 32, (g) => {
    g.scale(3, 3);
    if (head) { // a doll's head on the duck's post
      g.fillStyle = "#3a3a44"; g.fillRect(6, 7, 1, 3);
      circle(g, 6.5, 5, 3.4, "#f0e2d0"); g.fillStyle = "#6a3a18"; g.beginPath(); g.arc(6.5, 4.4, 3.5, Math.PI, TAU); g.fill();
      circle(g, 5.2, 5, 0.6, "#000"); circle(g, 7.8, 5, 0.6, "#000");
      g.fillStyle = "#c0122c"; g.beginPath(); g.moveTo(4.6, 6.4); g.quadraticCurveTo(6.5, 8.2, 8.4, 6.4); g.fill();
      circle(g, 4.6, 6, 0.7, "rgba(220,60,80,.5)"); circle(g, 8.4, 6, 0.7, "rgba(220,60,80,.5)");
    } else {
      g.fillStyle = "#3a3a44"; g.fillRect(6, 7, 1, 3);
      duckShape(g, 5.5, 6, 1, "#ffd23a");
    }
  });
}
function ambient(ctx, game, t, view, box) {
  const Lt = layout(game), NW = Lt.NW, SW = Lt.SW, red = view.reduced;
  const ts = red ? t * 0.2 : t;
  // the duck conveyor
  const fy = NW * TILE + TILE - FH;
  if (fy > box.y0 - 20 && fy < box.y1 + 20) {
    const gap = 21, v = 16;
    for (const [a, b] of Lt.north) {
      const x0 = a * TILE + 6, x1 = (b + 1) * TILE - 6, len = x1 - x0;
      if (x1 < box.x0 || x0 > box.x1) continue;
      const off = (ts * v) % gap;
      for (let i = -1; i * gap < len; i++) {
        const x = x0 + i * gap + off; if (x < x0 || x > x1) continue;
        const id = Math.floor((ts * v) / gap) - i + a * 31, head = ((id % 7) + 7) % 7 === 3;
        const spr = duckSprite(head);
        ctx.drawImage(spr, x - 6.5, fy - 1, 40 / 3, 32 / 3);
      }
    }
  }
  // bunting along the counter's back edge, fluttering
  const by = SW * TILE + 2;
  if (by > box.y0 - 20 && by < box.y1 + 20) {
    for (const [a, b] of Lt.counter) {
      const x0 = a * TILE + 2, x1 = (b + 1) * TILE - 2;
      if (x1 < box.x0 || x0 > box.x1) continue;
      ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, by); ctx.lineTo(x1, by); ctx.stroke();
      for (let x = x0 + 2, i = 0; x < x1 - 6; x += 8, i++) {
        if (x < box.x0 - 8 || x > box.x1) continue;
        const fl = Math.sin(ts * 3.1 + x * 0.21) * 1.6;
        ctx.fillStyle = PANEL[(i + a) % PANEL.length];
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + 6, by); ctx.lineTo(x + 3 + fl, by + 7 + fl * 0.3); ctx.fill();
      }
    }
  }
  // a spinning target wheel at the end of each backboard run
  const sy = NW * TILE + (TILE - FH) / 2 + 0.5;
  if (sy > box.y0 - 20 && sy < box.y1 + 20) for (const [a, b] of Lt.north) {
    if (b - a < 4) continue;
    const cx = a * TILE + TILE / 2; if (cx < box.x0 - 20 || cx > box.x1 + 20) continue;
    ctx.save(); ctx.translate(cx, sy); ctx.rotate(ts * 1.4 + a);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? "#fff4e0" : "#e8102c"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 8.5, i * TAU / 8, (i + 1) * TAU / 8); ctx.fill(); }
    circle(ctx, 0, 0, 2.2, "#1a0a10"); ctx.restore();
  }
}

/* ---------------------------------------------------------------- glow: neon, eyes, the fair beyond */
function neonSprite(txt, color) {
  const w = measure(txt) + 16, h = 22, S = 4;
  return sprite("galneon|" + txt + color, w * S, h * S, (g) => {
    g.scale(S, S); g.font = SIGN_FONT; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = color; g.shadowBlur = 6 * S; g.fillStyle = color; g.fillText(txt, w / 2, h / 2);
    g.shadowBlur = 2 * S; g.fillText(txt, w / 2, h / 2);
    g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,.75)"; g.fillText(txt, w / 2, h / 2);
  });
}

let pops = []; // camera flash pops on the backboard
let nextPop = 2;

function glow(ctx, game, t, view, box) {
  const Lt = layout(game), red = view.reduced, p = game.player;
  const mw = game.w * TILE, mh = game.h * TILE;
  // --- the fair beyond the map edges
  if (box.x0 < 0 || box.y0 < 0 || box.x1 > mw || box.y1 > mh) beyond(ctx, game, t, view, box, mw, mh);
  // --- neon over the backboard
  ctx.globalCompositeOperation = "lighter";
  for (const s of Lt.signs) {
    if (s.x1 < box.x0 - 20 || s.x0 > box.x1 + 20 || s.y < box.y0 - 30 || s.y > box.y1 + 30) continue;
    let alt = 0, prim = 1;
    if (s.alt) { // it says something else for a moment, when you are not quite reading it
      // the slogan goes out, the other one comes on, then the slogan again (once per ~9 s, never a strobe)
      const c = red ? 0 : (t * 0.11 + s.seed) % 1;
      if (c >= 0.86 && c < 0.875) prim = 1 - (c - 0.86) / 0.015;
      else if (c >= 0.875 && c < 0.97) { prim = 0; alt = Math.min(1, (c - 0.875) / 0.012, (0.97 - c) / 0.012); }
      else if (c >= 0.97) prim = (c - 0.97) / 0.03;
    }
    const dip = red ? 1 : 0.82 + 0.18 * Math.sin(t * 2.3 + s.seed * 40) * Math.sin(t * 0.7 + s.seed * 9);
    for (const [txt, a] of [[s.txt, prim], [s.alt, alt]]) {
      if (!txt || a < 0.02) continue;
      const spr = neonSprite(txt, txt === s.alt ? "#ff2a3a" : s.color), w = spr.width / 4, h = spr.height / 4;
      ctx.globalAlpha = a * dip; ctx.drawImage(spr, s.cx - w / 2, s.y + s.h / 2 + 0.5 - h / 2, w, h);
    }
  }
  // camera flash pops: Arthur's spare bulbs going off along the backboard (never under reduced motion, never fast)
  if (!red && view.dt > 0) {
    nextPop -= view.dt;
    if (nextPop <= 0 && Lt.north.length) {
      nextPop = 1.6 + Math.random() * 3.5;
      const [a, b] = Lt.north[(Math.random() * Lt.north.length) | 0];
      const x = (a + Math.random() * (b - a + 1)) * TILE;
      if (x > box.x0 && x < box.x1) pops.push({ x, y: Lt.NW * TILE + 6, age: 0 });
    }
    for (const q of pops) q.age += view.dt;
    pops = pops.filter((q) => q.age < 0.45);
  }
  for (const q of pops) {
    const k = 1 - q.age / 0.45, r = 20 + 30 * (1 - k);
    ctx.globalAlpha = 0.7 * k; ctx.drawImage(glowSprite("#e8f4ff"), q.x - r, q.y - r, r * 2, r * 2);
    ctx.globalAlpha = k; circle(ctx, q.x, q.y, 1.8, "#ffffff");
  }
  // --- the darkroom safelights: a slow red breathing, never a flash
  for (const s of Lt.safe || []) {
    if (s.x < box.x0 - 40 || s.x > box.x1 + 40 || s.y < box.y0 - 40 || s.y > box.y1 + 40) continue;
    const k = red ? 0.8 : 0.7 + 0.3 * Math.sin(t * 0.9 + s.seed * 20);
    ctx.globalAlpha = 0.5 * k; ctx.drawImage(glowSprite("#ff1a2a"), s.x - 22, s.y - 18, 44, 44);
    ctx.globalAlpha = 0.9 * k; ctx.fillStyle = "#ff3a3a"; ctx.fillRect(s.x - 4, s.y - 1.5, 8, 2);
  }
  // --- eyes in the cutout holes and some of the photographs: they follow you
  for (const e of Lt.eyes) {
    if (e.x < box.x0 || e.x > box.x1 || e.y < box.y0 || e.y > box.y1) continue;
    const dx = p.x - e.x, dy = p.y - 20 - e.y, d = Math.hypot(dx, dy) || 1, ox = dx / d * 1.3, oy = dy / d * 1;
    const near = clamp(1 - d / 520, 0.25, 1), sp = e.kind === "pic" ? 3 : 2.4;
    ctx.globalAlpha = 0.55 * near;
    for (const s of [-1, 1]) ctx.drawImage(glowSprite("#ff5a3a"), e.x + s * sp - 4 + ox, e.y - 4 + oy, 8, 8);
    ctx.globalAlpha = 0.9 * near;
    for (const s of [-1, 1]) circle(ctx, e.x + s * sp + ox, e.y + oy, e.kind === "pic" ? 0.55 : 0.8, "#fff2c8");
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
}

/* ---- the fair outside: cached strips (static) + live rides, flags and balloons, clipped to the void */
const SKY_H = 140, CH = 512;
const chunks = new Map();
function chunk(game, side, i, scale) {
  const key = side + i + "@" + scale;
  let c = chunks.get(key);
  if (c) { chunks.delete(key); chunks.set(key, c); return c; }
  c = document.createElement("canvas"); c.width = Math.ceil(CH * scale); c.height = Math.ceil(SKY_H * scale);
  const g = c.getContext("2d"); g.scale(scale, scale);
  const mh = game.h * TILE;
  if (side === "n") { g.translate(-i * CH, SKY_H); drawNorth(g, game, i * CH - 40, (i + 1) * CH + 40); }
  else { g.translate(-i * CH, -mh); drawSouth(g, game, i * CH - 40, (i + 1) * CH + 40); }
  chunks.set(key, c);
  while (chunks.size > 10) chunks.delete(chunks.keys().next().value);
  return c;
}
/* north: the skyline (side view), drawn upward from y = 0 */
function drawNorth(g, game, xa, xb) {
  const mw = game.w * TILE;
  const sky = g.createLinearGradient(0, -SKY_H, 0, 0);
  sky.addColorStop(0, "#0a0418"); sky.addColorStop(0.55, "#2a0a34"); sky.addColorStop(0.85, "#6a1440"); sky.addColorStop(1, "#a83a2a");
  g.fillStyle = sky; g.fillRect(xa, -SKY_H, xb - xa, SKY_H);
  for (let i = 0; i < 40; i++) { const x = xa + hash(i, xa, 1) * (xb - xa), y = -SKY_H + hash(i, xa, 2) * 60; circle(g, x, y, 0.5 + hash(i, 3, xa) * 0.6, "rgba(255,240,220,.6)"); }
  // the hill and the far midway glow
  g.fillStyle = "#1a0820"; g.beginPath(); g.moveTo(xa, 0);
  for (let x = xa; x <= xb; x += 16) g.lineTo(x, -22 - Math.sin(x * 0.004) * 10 - Math.sin(x * 0.013 + 1) * 5);
  g.lineTo(xb, 0); g.fill();
  // a roller coaster's lattice
  for (let x = Math.floor(xa / 8) * 8; x < xb; x += 8) {
    const k = (x % 1400) / 1400; if (k > 0.55) continue;
    const ty = -40 - Math.sin(k / 0.55 * Math.PI) * 52 - Math.sin(k * 40) * 6;
    g.strokeStyle = "#240a26"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ty); g.moveTo(x, ty + 8); g.lineTo(x + 8, ty + 18); g.stroke();
    g.fillStyle = "#3a1236"; g.fillRect(x, ty - 1.5, 8, 2.5);
    if ((x / 8) % 3 === 0) circle(g, x, ty - 2, 1, "#ffe04a");
  }
  // tent peaks with bulb strings between them
  let prev = null;
  for (let x = Math.floor(xa / 230) * 230 - 230; x < xb + 230; x += 230) {
    const k = hash(x, 7, 5), cx = x + 60 + k * 100, w = 70 + hash(x, 8, 5) * 60, h = 55 + hash(x, 9, 5) * 35;
    if ((x % 690) === 0) continue; // a gap for the billboard
    const cols = [["#d0102c", "#fff0d0"], ["#ffcf26", "#7a1a8a"], ["#21c7c7", "#fff0d0"], ["#ff3d7f", "#ffe04a"]][(k * 4) | 0];
    for (let s = 0; s < 8; s++) {
      g.fillStyle = cols[s % 2]; g.beginPath(); g.moveTo(cx, -h);
      g.lineTo(cx - w / 2 + s * w / 8, 0); g.lineTo(cx - w / 2 + (s + 1) * w / 8, 0); g.fill();
    }
    g.fillStyle = "rgba(10,2,16,.35)"; g.beginPath(); g.moveTo(cx, -h); g.lineTo(cx, 0); g.lineTo(cx + w / 2, 0); g.fill();
    g.fillStyle = "#1a0a10"; g.fillRect(cx - 0.8, -h - 12, 1.6, 12);
    for (let s = 0; s < 9; s++) circle(g, cx - w / 2 + s * w / 8, -2, 1.3, s % 2 ? "#fff3b0" : "#ff3d7f");
    if (prev) {
      g.strokeStyle = "#140810"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(prev[0], prev[1]); g.quadraticCurveTo((prev[0] + cx) / 2, -h * 0.2, cx, -h); g.stroke();
      for (let j = 1; j < 10; j++) { const u = j / 10, bx = (1 - u) * (1 - u) * prev[0] + 2 * u * (1 - u) * (prev[0] + cx) / 2 + u * u * cx, by = (1 - u) * (1 - u) * prev[1] + 2 * u * (1 - u) * (-h * 0.2) + u * u * -h; circle(g, bx, by, 1.2, NEON[j % NEON.length]); }
    }
    prev = [cx, -h];
  }
  // the billboard: a clown the size of a house, SMILE!  (its eyes are live, in glow)
  for (let x = Math.floor(xa / 690) * 690; x < xb + 690; x += 690) {
    if (x < -100 || x > mw + 100) continue;
    const cx = x + 115, cy = -62;
    g.fillStyle = "#1a0a10"; g.fillRect(cx - 40, cy + 28, 3, 40); g.fillRect(cx + 37, cy + 28, 3, 40);
    g.fillStyle = "#ffe04a"; g.fillRect(cx - 52, cy - 40, 104, 70);
    g.fillStyle = "#e8102c"; g.fillRect(cx - 49, cy - 37, 98, 64);
    g.fillStyle = "#2a0a34"; g.fillRect(cx - 46, cy - 34, 92, 58);
    clownFace(g, cx - 14, cy - 8, 22, 0.2);
    g.fillStyle = "#2a0a34"; circle(g, cx - 22, cy - 15, 3.6, "#1a0a10"); circle(g, cx - 6, cy - 15, 3.6, "#1a0a10");
    g.font = '900 15px "Arial Black", Impact, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#ffe04a"; g.fillText("SMILE!", cx + 26, cy - 14);
    g.font = '900 6px "Arial Black", Impact, sans-serif'; g.fillStyle = "#fff4e0"; g.fillText("HE'S WATCHING", cx + 26, cy + 2);
    g.fillStyle = "rgba(160,10,20,.85)"; for (let i = 0; i < 4; i++) g.fillRect(cx + 10 + i * 9, cy - 6, 1.4, 6 + hash(i, x, 3) * 12); // the paint ran
    for (let i = 0; i < 18; i++) circle(g, cx - 52 + i * (104 / 17), cy - 40, 1.4, i % 2 ? "#fff3b0" : "#ff3d7f");
    for (let i = 0; i < 18; i++) circle(g, cx - 52 + i * (104 / 17), cy + 30, 1.4, i % 2 ? "#ff3d7f" : "#fff3b0");
  }
  // the near fence line at the map edge
  g.fillStyle = "#0c0408"; g.fillRect(xa, -8, xb - xa, 8);
  for (let x = Math.floor(xa / 12) * 12; x < xb; x += 12) { g.fillStyle = "#1e0c12"; g.fillRect(x, -14, 3, 14); }
}
/* south: the midway seen from above, tent roofs and a queue of guests waiting their turn */
function drawSouth(g, game, xa, xb) {
  const mh = game.h * TILE, mw = game.w * TILE;
  g.fillStyle = "#140a10"; g.fillRect(xa, mh, xb - xa, SKY_H);
  for (let x = Math.floor(xa / 24) * 24; x < xb; x += 24) for (let y = mh; y < mh + SKY_H; y += 24) {
    if (hash(x, y, 1) < 0.5) { g.fillStyle = "#1c1016"; g.fillRect(x, y, 24, 24); }
  }
  // a giant word painted on the ground, peeling
  g.save(); g.font = '900 64px "Arial Black", Impact, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
  for (let x = 380; x < mw + 400; x += 900) { if (x < xa - 300 || x > xb + 300) continue; g.fillStyle = "rgba(255,210,58,.22)"; g.fillText("SMILE", x, mh + 52); g.fillStyle = "rgba(232,16,44,.18)"; g.fillText("SMILE", x + 3, mh + 55); }
  g.restore();
  // tent roofs from above
  for (let x = Math.floor(xa / 300) * 300 - 300; x < xb + 300; x += 300) {
    const k = hash(x, 11, 1), cx = x + 150 + (k - 0.5) * 80, cy = mh + 80 + k * 30, r = 48 + hash(x, 12, 1) * 22;
    if ((x / 300) % 3 === 1) continue; // room for the queue
    const cols = [["#d0102c", "#fff0d0"], ["#8a3dff", "#ffe04a"], ["#21c7c7", "#fff0d0"]][(k * 3) | 0];
    for (let s = 0; s < 16; s++) { g.fillStyle = cols[s % 2]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, s * TAU / 16, (s + 1) * TAU / 16); g.fill(); }
    for (let s = 0; s < 16; s++) circle(g, cx + Math.cos((s + 0.5) * TAU / 16) * r, cy + Math.sin((s + 0.5) * TAU / 16) * r, r * 0.1, cols[s % 2]);
    circle(g, cx, cy, 4, "#ffe04a"); circle(g, cx, cy, 1.6, "#1a0a10");
    for (let s = 0; s < 16; s++) circle(g, cx + Math.cos(s * TAU / 16) * (r + 6), cy + Math.sin(s * TAU / 16) * (r + 6), 1.3, s % 3 ? "#fff3b0" : "#ff3d7f");
  }
  // the queue: guests from above, in rows, facing the gallery, perfectly still
  for (let x = Math.floor(xa / 300) * 300; x < xb + 300; x += 300) {
    if ((x / 300) % 3 !== 1) continue;
    const qx = x + 60;
    g.strokeStyle = "#c8a04a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(qx - 8, mh + 12); g.lineTo(qx - 8, mh + 130); g.moveTo(qx + 104, mh + 12); g.lineTo(qx + 104, mh + 130); g.stroke();
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const px = qx + 8 + c * 16 + (hash(r, c, x) - 0.5) * 4, py = mh + 22 + r * 18, k = hash(c, r, x + 1);
      ellipse(g, px, py + 2, 7, 4.5, ["#3a1a2a", "#1a2a3a", "#4a3a1a", "#2a3a2a"][(k * 4) | 0]); // shoulders
      circle(g, px, py, 3.6, k < 0.3 ? "#1a0e08" : k < 0.6 ? "#5a3a1a" : "#c8b490"); // hair / hat
      if (k > 0.85) { circle(g, px, py, 5, "#e8102c"); circle(g, px, py, 3.6, "#c8b490"); } // a party hat brim
    }
    g.fillStyle = "#fff4e0"; g.fillRect(qx + 18, mh + 4, 60, 11); g.fillStyle = "#e8102c"; g.fillRect(qx + 18, mh + 4, 60, 2);
    g.fillStyle = "#1a0a10"; g.font = '900 5px "Arial Black", Impact, sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LINE STARTS HERE", qx + 48, mh + 10.5);
  }
  g.fillStyle = "#0c0408"; g.fillRect(xa, mh, xb - xa, 5);
}
/* a Ferris wheel, live */
function wheel(ctx, cx, cy, r, ang, seed) {
  ctx.strokeStyle = "#2a0a2a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - r * 0.55, 0); ctx.lineTo(cx, cy); ctx.lineTo(cx + r * 0.55, 0); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = "#5a1a4a";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r * 0.92, 0, TAU); ctx.stroke();
  const n = 12;
  ctx.beginPath(); for (let i = 0; i < n; i++) { const a = ang + i * TAU / n; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.stroke();
  for (let i = 0; i < n; i++) {
    const a = ang + i * TAU / n, gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r;
    ctx.fillStyle = PANEL[(i + seed) % PANEL.length]; ctx.fillRect(gx - 4, gy + 1, 8, 6);
    ctx.fillStyle = "#1a0a10"; ctx.fillRect(gx - 3, gy + 2, 6, 2.5);
    if ((i + seed) % 5 === 0) circle(ctx, gx, gy + 3, 1.4, "#c8b490"); // someone is still riding
  }
  for (let i = 0; i < n * 2; i++) { const a = ang + i * TAU / (n * 2); circle(ctx, cx + Math.cos(a) * r * 0.96, cy + Math.sin(a) * r * 0.96, 1.4, i % 2 ? "#fff3b0" : NEON[(i >> 1) % NEON.length]); }
  circle(ctx, cx, cy, 5, "#ffe04a"); circle(ctx, cx, cy, 2, "#1a0a10");
}
function beyond(ctx, game, t, view, box, mw, mh) {
  const red = view.reduced, ts = red ? t * 0.15 : t;
  const scale = clamp(Math.round(ctx.getTransform().a * 2) / 2, 1, 4);
  ctx.save();
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  const i0 = Math.floor(Math.max(box.x0, -CH) / CH), i1 = Math.floor(Math.min(box.x1, mw + CH) / CH);
  // blit only the visible part of each cached chunk (a whole chunk is ~2k x 560 px)
  const blit = (side, ya, yb, y0) => {
    for (let i = i0; i <= i1; i++) {
      const xa = Math.max(box.x0, i * CH), xb = Math.min(box.x1, (i + 1) * CH);
      if (xb <= xa || yb <= ya) continue;
      const c = chunk(game, side, i, scale);
      ctx.drawImage(c, (xa - i * CH) * scale, (ya - y0) * scale, (xb - xa) * scale, (yb - ya) * scale, xa, ya, xb - xa, yb - ya);
    }
  };
  if (box.y0 < 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(box.x0 - 4, box.y0 - 4, box.x1 - box.x0 + 8, -box.y0 + 4); ctx.clip();
    blit("n", Math.max(box.y0, -SKY_H), 0, -SKY_H);
    // Ferris wheels turning (behind nothing: they are drawn over the strip, but stand behind the fence line visually)
    for (let k = 0; k < 3; k++) {
      const cx = mw * (0.14 + k * 0.36), r = 92 + k * 8, cy = -r - 26;
      if (cx + r < box.x0 || cx - r > box.x1 || cy + r < box.y0) continue;
      wheel(ctx, cx, cy, r, ts * (0.07 + k * 0.02) * (k % 2 ? -1 : 1), k);
    }
    // flags on the tent peaks blow east; the balloons drift west, against the wind
    for (let x = Math.floor(box.x0 / 230) * 230 - 230; x < box.x1 + 230; x += 230) {
      if ((x % 690) === 0) continue;
      const k = hash(x, 7, 5), cx = x + 60 + k * 100, h = 55 + hash(x, 9, 5) * 35, top = -h - 12;
      const f = Math.sin(ts * 4 + x) * 2;
      ctx.fillStyle = NEON[(x / 230 % NEON.length + NEON.length) % NEON.length];
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.quadraticCurveTo(cx + 6, top + 1 + f, cx + 12, top + 3 + f * 0.5); ctx.lineTo(cx, top + 6); ctx.fill();
    }
    for (let i = 0; i < 14; i++) {
      const span = mw + 600, sp = 9 + hash(i, 1, 9) * 8;
      const x = ((hash(i, 2, 9) * span - ts * sp) % span + span) % span - 300;
      const y = -20 - ((hash(i, 3, 9) * 120 + ts * (3 + hash(i, 4, 9) * 3)) % 120);
      if (x < box.x0 - 10 || x > box.x1 + 10 || y < box.y0 - 10) continue;
      const col = NEON[i % NEON.length], sway = Math.sin(ts * 1.3 + i) * 1.5;
      ctx.strokeStyle = "rgba(220,200,180,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x + sway, y + 7); ctx.quadraticCurveTo(x + 3, y + 12, x + sway, y + 17); ctx.stroke();
      ellipse(ctx, x + sway, y, 5.5, 6.8, col); circle(ctx, x + sway - 1.8, y - 2.5, 1.3, "rgba(255,255,255,.6)");
      if (i % 3 === 0) { circle(ctx, x + sway - 1.8, y - 0.5, 0.7, "#000"); circle(ctx, x + sway + 1.8, y - 0.5, 0.7, "#000"); ctx.strokeStyle = "#000"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x + sway, y + 1, 2.4, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
    // the billboard clown's eyes follow you
    const p = game.player;
    for (let x = Math.floor(box.x0 / 690) * 690 - 690; x < box.x1 + 690; x += 690) {
      if (x < -100 || x > mw + 100) continue;
      const cx = x + 115, cy = -62;
      for (const ex of [cx - 22, cx - 6]) {
        const dx = p.x - ex, dy = p.y - (cy - 15), d = Math.hypot(dx, dy) || 1;
        circle(ctx, ex + dx / d * 1.6, cy - 15 + dy / d * 1.6, 1.5, "#fff2c8");
      }
    }
    ctx.restore();
  }
  if (box.y1 > mh) {
    ctx.save(); ctx.beginPath(); ctx.rect(box.x0 - 4, mh, box.x1 - box.x0 + 8, box.y1 - mh + 4); ctx.clip();
    blit("s", mh, Math.min(box.y1, mh + SKY_H), mh);
    for (let i = 0; i < 10; i++) { // balloons tethered to the queue rail, bobbing (from above)
      const x = (i * 263 + 140) % (mw + 200) - 100, y = mh + 18 + (i % 3) * 24;
      if (x < box.x0 - 10 || x > box.x1 + 10 || y > box.y1 + 10) continue;
      const bx = x + Math.sin(ts * 0.9 + i) * 3, by = y + Math.cos(ts * 0.7 + i * 2) * 2;
      ctx.strokeStyle = "rgba(220,200,180,.4)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(bx, by); ctx.stroke();
      circle(ctx, bx, by, 6, NEON[(i + 2) % NEON.length]); circle(ctx, bx - 2, by - 2, 1.6, "rgba(255,255,255,.55)");
    }
    ctx.restore();
  }
  // the thin sides: a dark canvas wall and a string of bulbs
  for (const [x0, x1] of [[box.x0 - 4, 0], [mw, box.x1 + 4]]) {
    if (x1 <= x0) continue;
    ctx.fillStyle = "#12060e"; ctx.fillRect(x0, Math.max(box.y0, 0), x1 - x0, Math.min(box.y1, mh) - Math.max(box.y0, 0));
    const bx = x0 < 0 ? -8 : mw + 8;
    for (let y = Math.max(0, Math.floor(box.y0 / 16) * 16); y < Math.min(mh, box.y1); y += 16) circle(ctx, bx, y, 1.3, (y / 16) % 2 ? "#fff3b0" : "#ff3d7f");
  }
  // the void is still night: a soft fade toward the far edge
  ctx.restore();
}

export default { paint, ambient, glow };
