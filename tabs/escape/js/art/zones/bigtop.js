/* Stage backdrop for the "bigtop" zone. Owned by ONE agent; see art/zones/README.md.
 * The Big Top: the bleachers are FULL. A painted audience in party hats sits on
 * every bench, grinning, and every pair of eyes turns to follow you. Beyond the
 * tent walls the stands climb into the dark, more of them. Neon slogans burn on
 * the canvas, marquee bulbs chase round the walls, bunting sags, balloons are
 * tied to the empty seats, and someone in very big shoes walks circles in the sawdust.
 *   paint    — bleachers + audience, ring curb, confetti, shoe prints, posters, crawlspace slats, coloured lights
 *   backdrop — the stands beyond the walls (pattern fill, so it costs one fill per band)
 *   ambient  — bunting fluttering along the walls, balloons bobbing on their strings
 *   glow     — neon signs (cached sprites), chasing marquee bulbs, the audience's eyes, a roaming spot in the stands
 */
import { TILE, TILES } from "../../content.js";
import { TAU, hash, clamp, circle, ellipse, rgba, glowSprite } from "../util.js";

const FH = 13; // wall front-face height (tiles.js)
const VIVID = ["#ff2a4d", "#ffd23f", "#3fb8ff", "#7dff4a", "#ff7ad9", "#b46cff", "#ff8a2a"];
const PLANK = ["#c8102e", "#f2c230", "#1f7ae0", "#2fae4a", "#e0409a"];
const NEON = ["#ff3fa4", "#3fe8ff", "#ffb43f", "#b46cff"];
const FONT = "'IM Fell English SC', Georgia, serif";

const isSolid = (g, tx, ty) => tx < 0 || ty < 0 || tx >= g.w || ty >= g.h || !!TILES[g.tiles[ty * g.w + tx]].solid;
const nameAt = (g, tx, ty) => (tx < 0 || ty < 0 || tx >= g.w || ty >= g.h ? "tent" : g.tiles[ty * g.w + tx]);
const reducedOf = (view) => !!(view && view.reduced);

/* ---------------------------------------------------------------- per-level layout (cached) */
const layouts = new WeakMap();
function layout(g) {
  let L = layouts.get(g);
  if (L) return L;
  const seats = [], crawl = [], mw = g.w * TILE, mh = g.h * TILE;
  for (let ty = 0; ty < g.h; ty++) for (let tx = 0; tx < g.w; tx++) {
    const n = nameAt(g, tx, ty);
    if (n === "booth") {
      const front = !isSolid(g, tx, ty + 1), top = front ? TILE - FH - 6 : TILE;
      const x = tx * TILE, y = ty * TILE;
      // seated rows: one along the front lip; a second, higher row on deep tiles
      const rows = front ? [y + top] : [y + 15, y + 29];
      rows.forEach((fy, r) => {
        for (let i = 0; i < 2; i++) {
          const h = hash(tx, ty, 900 + r * 7 + i);
          const kind = h < 0.5 ? "clown" : h < 0.66 ? "grin" : h < 0.76 ? "blank" : h < 0.86 ? "cutout" : h < 0.94 ? "balloon" : "back";
          const sc = front ? 0.82 : 0.92;
          seats.push({ x: x + 8 + i * 16 + (hash(tx, ty, 930 + r + i) - 0.5) * 3, y: fy, sc, kind, seed: h, col: VIVID[(hash(tx, ty, 940 + r * 3 + i) * VIVID.length) | 0], tx, ty });
        }
      });
    } else if (!TILES[n].solid && n !== "silence") {
      // under the bleachers: a narrow run of floor with bleacher boards close on both sides
      const near = (dx, dy) => { for (let k = 1; k <= 3; k++) if (nameAt(g, tx + dx * k, ty + dy * k) === "booth") return true; return false; };
      if ((near(-1, 0) && near(1, 0)) || (near(0, -1) && near(0, 1))) crawl.push([tx, ty]);
    }
  }
  // top-wall stretches with floor below (for bunting), avoiding the exit corner
  const signs = [
    { text: "THE SHOW MUST GO ON", x: 11.5 * TILE, y: 11, col: NEON[0], dead: 9 },
    { text: "SMILE!", x: 29.5 * TILE, y: 11, col: NEON[2], dead: -1, buzz: 4 },
    { text: "★ THE GREATEST SHOW ★", x: 40.5 * TILE, y: 11, col: NEON[1], dead: 14 },
    { text: "NOBODY LEAVES EARLY", x: 55 * TILE, y: 11, col: NEON[3], dead: 1 },
    { text: "ENCORE! ENCORE!", x: 13 * TILE, y: mh - 15, col: NEON[2], dead: -1, buzz: 9 },
    { text: "STAY IN YOUR SEATS", x: 40.5 * TILE, y: mh - 15, col: NEON[0], dead: 5 },
    { text: "LAUGH OR ELSE", x: 66 * TILE, y: mh - 15, col: NEON[1], dead: -1, buzz: 0 },
  ];
  // ring curb: centred on the silent sawdust (the ring)
  let sx = 0, sy = 0, sn = 0;
  for (let i = 0; i < g.tiles.length; i++) if (g.tiles[i] === "silence") { sx += i % g.w; sy += (i / g.w) | 0; sn++; }
  const ring = sn ? { x: (sx / sn + 0.5) * TILE, y: (sy / sn + 0.5) * TILE, rx: 12.6 * TILE, ry: 6.1 * TILE } : null;
  L = { seats, crawl, signs, ring, mw, mh };
  layouts.set(g, L);
  return L;
}

/* ---------------------------------------------------------------- figures */
function partyHat(ctx, x, y, s, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 3 * s, y); ctx.lineTo(x, y - 7 * s); ctx.lineTo(x + 3 * s, y); ctx.fill();
  ctx.fillStyle = "#fff4d8"; ctx.beginPath(); ctx.moveTo(x - 1.9 * s, y - 2.4 * s); ctx.lineTo(x + 1.6 * s, y - 2.8 * s); ctx.lineTo(x + 1.1 * s, y - 4.2 * s); ctx.lineTo(x - 1.2 * s, y - 4.0 * s); ctx.fill();
  circle(ctx, x, y - 7 * s, 1.1 * s, "#fff4d8");
}
function grin(ctx, x, y, s, wide, teeth) {
  ctx.fillStyle = "#8a0716"; ctx.beginPath();
  ctx.moveTo(x - wide * s, y); ctx.quadraticCurveTo(x, y + 3.6 * s, x + wide * s, y); ctx.quadraticCurveTo(x, y + 1.4 * s, x - wide * s, y); ctx.fill();
  ctx.fillStyle = "#fff8ec";
  for (let i = 0; i < teeth; i++) { const k = (i + 0.5) / teeth, tx = x - wide * s + k * wide * 2 * s; ctx.fillRect(tx - 0.3 * s, y + 0.4 * s + Math.sin(k * Math.PI) * 1.1 * s, 0.6 * s, 0.9 * s); }
}
function spectator(ctx, st) {
  const { x, y, sc: s, kind, col, seed } = st;
  if (kind === "balloon") { // an empty seat; a balloon is tied to it (drawn in ambient)
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x - 4 * s, y - 1.2, 8 * s, 1.2);
    circle(ctx, x, y - 1.5, 0.9, "#ddd");
    return;
  }
  // shoulders
  ctx.fillStyle = kind === "cutout" ? "#d9c9a4" : col;
  ctx.beginPath(); ctx.moveTo(x - 4.6 * s, y); ctx.quadraticCurveTo(x - 4.4 * s, y - 6 * s, x, y - 6.2 * s); ctx.quadraticCurveTo(x + 4.4 * s, y - 6 * s, x + 4.6 * s, y); ctx.fill();
  if (kind !== "cutout") { ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(x - 0.5 * s, y - 5.5 * s, 1 * s, 5 * s); } // a ruffle stripe
  const hy = y - 9.4 * s;
  if (kind === "back") { // turned away; someone painted a face on the back of its head anyway
    circle(ctx, x, hy, 3.6 * s, "#2a1810");
    ctx.fillStyle = "#f4efe6"; ctx.fillRect(x - 1.8 * s, hy - 0.8 * s, 1 * s, 1 * s); ctx.fillRect(x + 0.8 * s, hy - 0.8 * s, 1 * s, 1 * s);
    ctx.strokeStyle = "#c0122c"; ctx.lineWidth = 0.5 * s; ctx.beginPath(); ctx.arc(x, hy + 0.4 * s, 1.8 * s, 0.2, Math.PI - 0.2); ctx.stroke();
    return;
  }
  if (kind === "cutout") { // a painted cardboard cutout on a stick: face hole
    ctx.fillStyle = "#e9dcbc"; ctx.fillRect(x - 4 * s, hy - 4.5 * s, 8 * s, 8.5 * s);
    ctx.strokeStyle = "#7a1a20"; ctx.lineWidth = 0.6; ctx.strokeRect(x - 4 * s, hy - 4.5 * s, 8 * s, 8.5 * s);
    circle(ctx, x, hy, 2.6 * s, "#0a0406");
    grin(ctx, x, hy + 2.3 * s, s, 3.2, 6);
    ctx.fillStyle = col; ctx.font = `bold ${2.4 * s}px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("HA", x, hy - 3 * s);
    return;
  }
  circle(ctx, x, hy, 3.7 * s, "#f6f1e6"); // greasepaint white
  if (kind === "blank") { // a mascot with no face at all
    ellipse(ctx, x - 1.1 * s, hy - 1.3 * s, 1.2 * s, 0.8 * s, "rgba(255,255,255,.7)");
    partyHat(ctx, x, hy - 3 * s, s, col);
    return;
  }
  // cheeks, nose, eye sockets (eyes go in at glow), a grin
  circle(ctx, x - 2.3 * s, hy + 0.9 * s, 0.9 * s, "rgba(255,60,90,.55)"); circle(ctx, x + 2.3 * s, hy + 0.9 * s, 0.9 * s, "rgba(255,60,90,.55)");
  ctx.fillStyle = "#1a0408"; ctx.beginPath(); ctx.ellipse(x - 1.35 * s, hy - 0.8 * s, 0.95 * s, 1.15 * s, 0, 0, TAU); ctx.ellipse(x + 1.35 * s, hy - 0.8 * s, 0.95 * s, 1.15 * s, 0, 0, TAU); ctx.fill();
  if (kind === "grin") grin(ctx, x, hy + 0.9 * s, s, 3.5, 9); // too many teeth, too wide
  else { grin(ctx, x, hy + 1.2 * s, s, 2.4, 4); circle(ctx, x, hy + 0.3 * s, 0.9 * s, "#ff2a3a"); }
  if (seed > 0.12) partyHat(ctx, x + (seed - 0.5) * 1.2, hy - 3 * s, s, VIVID[((seed * 97) | 0) % VIVID.length]);
  else { ctx.fillStyle = "#ff5a1f"; for (const sd of [-1, 1]) { circle(ctx, x + sd * 3.6 * s, hy - 1.6 * s, 1.7 * s, "#ff5a1f"); } } // a clown's fright wig
}

/* bleacher tile: painted bench planks, a slatted riser, someone hiding underneath */
function bleacher(ctx, g, tx, ty) {
  const x = tx * TILE, y = ty * TILE, front = !isSolid(g, tx, ty + 1), top = front ? TILE - FH - 6 : TILE;
  ctx.fillStyle = "#1a0d0a"; ctx.fillRect(x, y, TILE, top);
  const tiers = front ? 2 : 4, th = top / tiers;
  for (let i = 0; i < tiers; i++) {
    const c = PLANK[(tx + ty + i) % PLANK.length];
    ctx.fillStyle = c; ctx.fillRect(x, y + i * th + 1, TILE, th - 2.4);
    ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(x, y + i * th + 1, TILE, 0.8);
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x, y + i * th + th - 1.6, TILE, 1.6);
    for (let k = 0; k < 3; k++) if (hash(tx, ty, 960 + i * 5 + k) < 0.5) { ctx.fillStyle = "#5a3a22"; ctx.fillRect(x + hash(tx, ty, 970 + i * 5 + k) * 28, y + i * th + 1.5 + hash(tx, ty, 980 + k) * (th - 4), 3 + hash(tx, ty, 985 + k) * 4, 1.4); } // chipped paint
    if (hash(tx, ty, 990 + i) < 0.18) { ctx.fillStyle = "rgba(120,6,18,.7)"; const dx = x + hash(tx, ty, 995 + i) * 28; ctx.fillRect(dx, y + i * th + th - 2, 1.2, 3 + hash(tx, ty, 999) * 4); circle(ctx, dx + 0.6, y + i * th + th + 2.5, 0.9, "rgba(120,6,18,.7)"); } // something dripped off the bench
  }
  if (!front) return;
  // the riser: dark slats with gaps you can see through, X-braces
  const fy = y + top;
  ctx.fillStyle = "#0a0405"; ctx.fillRect(x, fy, TILE, TILE - top);
  ctx.fillStyle = "#3a2216"; for (let i = 0; i < 4; i++) ctx.fillRect(x + i * 8 + 1, fy, 2.4, TILE - top - 2);
  ctx.strokeStyle = "#2a160e"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, fy + 1); ctx.lineTo(x + TILE, fy + TILE - top - 3); ctx.moveTo(x + TILE, fy + 1); ctx.lineTo(x, fy + TILE - top - 3); ctx.stroke();
  ctx.fillStyle = PLANK[(tx + ty) % PLANK.length]; ctx.fillRect(x, y + TILE - 3, TILE, 3); // painted kick-board
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(x, y + TILE - 1, TILE, 1);
}

/* ---------------------------------------------------------------- paint (static, once) */
function paint(ctx, g, api) {
  const L = layout(g), { mw, mh } = L;
  // the crawlspace under the bleachers: bands of shadow from the boards overhead, a support post, what got dropped
  for (const [tx, ty] of L.crawl) {
    const x = tx * TILE, y = ty * TILE;
    ctx.fillStyle = "rgba(0,0,0,.32)";
    for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 8 + 2, TILE, 3);
    if (hash(tx, ty, 700) < 0.22) { ctx.fillStyle = "rgba(10,4,4,.6)"; ctx.fillRect(x + 4 + hash(tx, ty, 701) * 20, y, 3, TILE); } // a strut's shadow
    if (hash(tx, ty, 702) < 0.12) { // a half-eaten candy apple, a dropped mask
      const px = x + 6 + hash(tx, ty, 703) * 20, py = y + 6 + hash(tx, ty, 704) * 20;
      if (hash(tx, ty, 705) < 0.5) { circle(ctx, px, py, 2.6, "#b0101e"); ctx.fillStyle = "#f2e2c0"; ctx.fillRect(px - 0.8, py - 1, 1.8, 1.6); }
      else { ellipse(ctx, px, py, 3.6, 2.8, "#e9e2d2"); circle(ctx, px - 1.2, py - 0.5, 0.6, "#000"); circle(ctx, px + 1.2, py - 0.5, 0.6, "#000"); ctx.strokeStyle = "#c0122c"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(px, py + 0.4, 1.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    }
  }
  // confetti and ticket litter on the sawdust; streamers
  for (let ty = 1; ty < g.h - 1; ty++) for (let tx = 1; tx < g.w - 1; tx++) {
    const n = nameAt(g, tx, ty); if (TILES[n].solid || n === "exit") continue;
    const x = tx * TILE, y = ty * TILE, gray = n === "silence";
    const k = (hash(tx, ty, 600) * 6) | 0;
    for (let i = 0; i < k; i++) {
      ctx.save(); ctx.translate(x + hash(tx, ty, 610 + i) * TILE, y + hash(tx, ty, 620 + i) * TILE); ctx.rotate(hash(tx, ty, 630 + i) * TAU);
      ctx.fillStyle = gray ? "rgba(170,170,180,.35)" : rgba(VIVID[(hash(tx, ty, 640 + i) * VIVID.length) | 0], 0.75); ctx.fillRect(-1.2, -0.6, 2.4, 1.2); ctx.restore();
    }
    if (!gray && hash(tx, ty, 650) < 0.035) { // a curl of streamer
      ctx.strokeStyle = rgba(VIVID[(hash(tx, ty, 651) * VIVID.length) | 0], 0.6); ctx.lineWidth = 1;
      ctx.beginPath(); const sx = x + hash(tx, ty, 652) * 20, sy = y + hash(tx, ty, 653) * 24; ctx.moveTo(sx, sy);
      for (let i = 1; i <= 6; i++) ctx.quadraticCurveTo(sx + i * 2.6, sy + (i % 2 ? -3 : 3), sx + i * 3, sy + (i % 2 ? -1 : 1));
      ctx.stroke();
    }
    if (!gray && hash(tx, ty, 660) < 0.018) { // a striped popcorn tub on its side, spilling
      const px = x + 8 + hash(tx, ty, 661) * 16, py = y + 10 + hash(tx, ty, 662) * 14;
      ctx.save(); ctx.translate(px, py); ctx.rotate(hash(tx, ty, 663) * TAU);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#f2ead8" : "#d01a2a"; ctx.fillRect(-5 + i * 2.5, -3, 2.5, 6); }
      for (let i = 0; i < 5; i++) circle(ctx, 6 + i * 1.8, (hash(tx, ty, 664 + i) - 0.5) * 6, 1.2, "#f3e7b0");
      ctx.restore();
    }
    if (!gray && hash(tx, ty, 670) < 0.012) { // a popped balloon, its string
      const px = x + 6 + hash(tx, ty, 671) * 20, py = y + 6 + hash(tx, ty, 672) * 20, c = VIVID[(hash(tx, ty, 673) * VIVID.length) | 0];
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px, py); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, r = 2 + hash(tx, ty, 674 + i) * 3; ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.7); } ctx.fill();
      ctx.strokeStyle = "rgba(230,230,230,.5)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 6, py + 4, px + 3, py + 11); ctx.stroke();
    }
  }
  // the ring curb: worn red-and-cream paint around the ring, gold stars, and a smear where something was dragged across
  if (L.ring) {
    const { x: cx, y: cy, rx, ry } = L.ring, segs = 72;
    for (let i = 0; i < segs; i++) {
      if (hash(i, 3, 810) < 0.08) continue; // worn away
      const a0 = (i / segs) * TAU, a1 = ((i + 0.82) / segs) * TAU;
      ctx.strokeStyle = i % 2 ? "rgba(236,222,196,.55)" : "rgba(200,16,46,.7)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a0, a1); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(242,194,48,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) { // painted stars round the curb
      const a = (i / 12) * TAU + 0.13, px = cx + Math.cos(a) * (rx + 11), py = cy + Math.sin(a) * (ry + 11);
      if (isSolid(g, (px / TILE) | 0, (py / TILE) | 0)) continue;
      ctx.fillStyle = "rgba(242,194,48,.55)"; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const aa = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? 1.6 : 4; ctx.lineTo(px + Math.cos(aa) * rr, py + Math.sin(aa) * rr); }
      ctx.fill();
    }
    ctx.fillStyle = "rgba(110,8,16,.45)"; ctx.beginPath(); ctx.ellipse(cx + rx * 0.7, cy + ry * 0.72, 18, 4, 0.5, 0, TAU); ctx.fill(); // the drag
  }
  // greasepaint footprints: someone in enormous shoes walks the same loop round and round
  const loops = [{ x: 8.5 * TILE, y: 14 * TILE, rx: 4.6 * TILE, ry: 9 * TILE }, { x: 71 * TILE, y: 15 * TILE, rx: 4.2 * TILE, ry: 8.5 * TILE }];
  for (const lp of loops) {
    const per = 2 * Math.PI * Math.sqrt((lp.rx * lp.rx + lp.ry * lp.ry) / 2), steps = Math.floor(per / 26);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU, side = i % 2 ? 1 : -1;
      const dx = -Math.sin(a) * lp.rx, dy = Math.cos(a) * lp.ry, ang = Math.atan2(dy, dx);
      const px = lp.x + Math.cos(a) * lp.rx + Math.cos(ang + Math.PI / 2) * side * 5, py = lp.y + Math.sin(a) * lp.ry + Math.sin(ang + Math.PI / 2) * side * 5;
      if (isSolid(g, (px / TILE) | 0, (py / TILE) | 0)) continue;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
      ctx.fillStyle = "rgba(170,14,34,.38)"; ctx.beginPath(); ctx.ellipse(2, 0, 6.5, 3.2, 0, 0, TAU); ctx.fill(); // the huge toe
      ctx.beginPath(); ctx.ellipse(-6, 0, 2.6, 2.2, 0, 0, TAU); ctx.fill(); // heel
      ctx.restore();
    }
  }
  // the bleachers, full
  for (let ty = 0; ty < g.h; ty++) for (let tx = 0; tx < g.w; tx++) if (nameAt(g, tx, ty) === "booth") bleacher(ctx, g, tx, ty);
  const seats = L.seats.slice().sort((a, b) => a.y - b.y);
  for (const st of seats) spectator(ctx, st);
  // posters pasted on the side walls: a clown head with too many teeth
  for (let ty = 2; ty < g.h - 2; ty += 5) for (const tx of [0, g.w - 1]) {
    if (nameAt(g, tx, ty) !== "tent") continue;
    const x = tx * TILE + 3, y = ty * TILE + 2, w = 26, h = 34;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((hash(tx, ty, 500) - 0.5) * 0.12);
    ctx.fillStyle = "#efe0b8"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = ["#c8102e", "#1f7ae0", "#2fae4a", "#7a2aa8"][ty % 4]; ctx.fillRect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3);
    circle(ctx, 0, -2, 9, "#f6f1e6");
    circle(ctx, -8, -6, 4, "#ff5a1f"); circle(ctx, 8, -6, 4, "#ff5a1f");
    ctx.fillStyle = "#14040a"; ctx.beginPath(); ctx.ellipse(-3.2, -4.5, 2, 2.6, 0.2, 0, TAU); ctx.ellipse(3.2, -4.5, 2, 2.6, -0.2, 0, TAU); ctx.fill();
    circle(ctx, 0, -1.2, 1.8, "#ff2a3a");
    grin(ctx, 0, 1.4, 1.5, 4.6, 12);
    ctx.fillStyle = "#fff4d8"; ctx.font = `bold 5px ${FONT}`; ctx.textAlign = "center";
    ctx.fillText(["SMILE", "HA HA", "JOIN US", "ENCORE"][(ty / 5 | 0) % 4], 0, h / 2 - 4);
    ctx.fillStyle = "rgba(120,6,18,.75)"; for (let i = 0; i < 3; i++) ctx.fillRect(-6 + i * 5, 6, 1, 3 + hash(tx, ty, 510 + i) * 7); // the paint ran
    ctx.restore();
  }
  // coloured footlights along the tent walls, and red lamps at the ring
  const add = (x, y, r, color, fl = 0.1) => api.lights.push({ x, y, r, color, flicker: fl, seed: hash(x | 0, y | 0, 7) });
  for (let i = 0, x = 6 * TILE; x < 70 * TILE; x += 8 * TILE, i++) { add(x, 1.4 * TILE, 88, NEON[i % 4]); add(x + 4 * TILE, mh - 1.6 * TILE, 80, NEON[(i + 2) % 4]); }
  for (let y = 5 * TILE, i = 0; y < mh - 3 * TILE; y += 7 * TILE, i++) { add(1.3 * TILE, y, 70, NEON[(i + 1) % 4]); add(mw - 1.3 * TILE, y + 3 * TILE, 70, NEON[(i + 3) % 4]); }
  // house lights left on low over the bleachers, so the painted crowd shows its colours
  let bi = 0;
  for (let ty = 0; ty < g.h; ty++) for (let tx = 0; tx < g.w; tx++) if (nameAt(g, tx, ty) === "booth" && hash(tx, ty, 880) < 0.16) add((tx + 0.5) * TILE, (ty + 0.4) * TILE, 46, ["#ffb43f", "#ff3fa4", "#ffd23f"][bi++ % 3], 0.15);
  if (L.ring) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.5; add(L.ring.x + Math.cos(a) * L.ring.rx, L.ring.y + Math.sin(a) * L.ring.ry, 52, "#ff2a3a", 0.2); }
}

/* ---------------------------------------------------------------- backdrop: the stands beyond the walls */
const CW = 96, CH = 56;
function standsCanvas(lit) {
  const c = document.createElement("canvas"); c.width = CW * 2; c.height = CH * 2;
  const g = c.getContext("2d"); g.scale(2, 2);
  g.fillStyle = lit ? "#1c0a10" : "#0d0508"; g.fillRect(0, 0, CW, CH);
  for (let r = 0; r < 2; r++) {
    const by = r * 28 + 26, off = r * 12;
    g.fillStyle = PLANK[r * 2 % PLANK.length]; g.fillRect(0, by - 3, CW, 3);
    g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(0, by - 0.8, CW, 0.8);
    for (let i = 0; i < 4; i++) {
      const x = off + 12 + i * 24, h = hash(i, r, 77);
      spectator(g, { x: x % CW, y: by - 3, sc: 1.2, kind: h < 0.15 ? "blank" : h < 0.3 ? "grin" : h < 0.4 ? "back" : "clown", seed: 0.2 + h * 0.8, col: VIVID[(i * 3 + r * 2) % VIVID.length] });
    }
  }
  if (!lit) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, CW, CH); }
  return c;
}
let stands = null, standsLit = null;
function voidRects(L, box, inset = 0) {
  const R = [], { mw, mh } = L;
  if (box.y0 < -inset) R.push([box.x0, box.y0, box.x1 - box.x0, -inset - box.y0]);
  if (box.y1 > mh + inset) R.push([box.x0, mh + inset, box.x1 - box.x0, box.y1 - mh - inset]);
  const y0 = Math.max(box.y0, -inset), y1 = Math.min(box.y1, mh + inset);
  if (y1 > y0) {
    if (box.x0 < -inset) R.push([box.x0, y0, -inset - box.x0, y1 - y0]);
    if (box.x1 > mw + inset) R.push([mw + inset, y0, box.x1 - mw - inset, y1 - y0]);
  }
  return R;
}
function backdrop(ctx, g, t, view, box) {
  const L = layout(g), R = voidRects(L, box);
  if (!R.length) return;
  if (!stands) stands = standsCanvas(false);
  const pat = ctx.createPattern(stands, "repeat");
  pat.setTransform && pat.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
  ctx.fillStyle = pat;
  for (const r of R) ctx.fillRect(r[0], r[1], r[2], r[3]);
}

/* ---------------------------------------------------------------- ambient: bunting and balloons */
function bunting(ctx, x0, x1, y, t, sway, phase) {
  ctx.strokeStyle = "#1a1010"; ctx.lineWidth = 0.7; ctx.beginPath();
  const span = 96;
  for (let x = x0; x < x1; x += span) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + span / 2, y + 7, x + span, y); }
  ctx.stroke();
  for (let x = x0; x < x1; x += 8) {
    const k = ((x - x0) % span) / span, sag = 7 * 4 * k * (1 - k) * 0.5 * 2 / 2 * 1.0, yy = y + sag;
    const f = sway ? Math.sin(t * 2.2 + x * 0.09 + phase) * 1.6 : 0;
    const c = VIVID[((x / 8) | 0) % VIVID.length];
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 3, yy); ctx.lineTo(x + 3, yy); ctx.lineTo(x + f, yy + 7); ctx.fill();
    if (((x / 8) | 0) % 9 === 4) { circle(ctx, x + f * 0.5, yy + 2.6, 0.7, "#000"); } // a pennant with an eye
  }
}
function ambient(ctx, g, t, view, box) {
  const L = layout(g), red = reducedOf(view), tt = red ? 0 : t;
  const x0 = Math.max(TILE, Math.floor(box.x0 / 96) * 96 + 32), x1 = Math.min(L.mw - TILE, box.x1);
  if (box.y0 < 2 * TILE && x1 > x0) bunting(ctx, x0, x1, TILE + 1, tt, !red, 0);
  if (box.y1 > L.mh - 2 * TILE && x1 > x0) bunting(ctx, x0, x1, L.mh - TILE + 2, tt, !red, 2);
  // balloons tied to the empty seats; they lean toward you, not with the draught
  const p = g.player;
  for (const st of L.seats) {
    if (st.kind !== "balloon" || st.x < box.x0 - 20 || st.x > box.x1 + 20 || st.y < box.y0 - 10 || st.y > box.y1 + 40) continue;
    const lean = clamp((p.x - st.x) / 300, -1, 1) * 5, bob = Math.sin(tt * 1.3 + st.seed * 30) * 1.5;
    const bx = st.x + lean, by = st.y - 22 + bob;
    ctx.strokeStyle = "rgba(230,225,215,.7)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(st.x, st.y - 1.5); ctx.quadraticCurveTo(st.x + lean * 0.2 + 2, st.y - 10, bx, by + 6); ctx.stroke();
    ellipse(ctx, bx, by, 4.6, 5.8, st.col);
    ctx.fillStyle = st.col; ctx.beginPath(); ctx.moveTo(bx - 1.2, by + 6.4); ctx.lineTo(bx + 1.2, by + 6.4); ctx.lineTo(bx, by + 5); ctx.fill();
    ellipse(ctx, bx - 1.6, by - 2.2, 1.2, 1.8, "rgba(255,255,255,.55)");
    if (st.seed > 0.9) { ctx.strokeStyle = "#1a0408"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(bx, by + 0.6, 2.4, 0.3, Math.PI - 0.3); ctx.stroke(); circle(ctx, bx - 1.4, by - 1, 0.6, "#1a0408"); circle(ctx, bx + 1.4, by - 1, 0.6, "#1a0408"); }
  }
}

/* ---------------------------------------------------------------- glow: neon, marquee bulbs, eyes */
const signCache = new Map();
function fontsReady() { try { return !document.fonts || document.fonts.status === "loaded"; } catch (e) { return true; } }
function signSprite(s, ready) {
  const key = s.text + s.col + (ready ? 1 : 0);
  let c = signCache.get(key);
  if (c) return c;
  const S = 4, fs = 9, pad = 7;
  const m = document.createElement("canvas").getContext("2d"); m.font = `bold ${fs}px ${FONT}`;
  const chars = [...s.text], widths = chars.map((ch) => m.measureText(ch).width), tw = widths.reduce((a, b) => a + b, 0) + chars.length * 0.6;
  const w = tw + pad * 2, h = fs + pad * 2;
  c = document.createElement("canvas"); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
  const g = c.getContext("2d"); g.scale(S, S);
  g.fillStyle = "rgba(14,4,10,.85)"; g.fillRect(3, 3, w - 6, h - 6); // backing board
  g.strokeStyle = rgba(s.col, 0.5); g.lineWidth = 0.6; g.strokeRect(3.5, 3.5, w - 7, h - 7);
  g.font = `bold ${fs}px ${FONT}`; g.textBaseline = "middle"; g.textAlign = "left";
  let x = pad; c.letters = [];
  for (let i = 0; i < chars.length; i++) {
    const dead = i === s.dead;
    g.shadowColor = s.col; g.shadowBlur = dead ? 0 : 3 * S;
    g.fillStyle = dead ? "#2a1a20" : s.col; g.fillText(chars[i], x, h / 2 + 0.5);
    if (!dead) { g.shadowBlur = 0; g.fillStyle = "rgba(255,250,240,.75)"; g.fillText(chars[i], x, h / 2 + 0.5); g.fillStyle = rgba(s.col, 0.45); g.fillText(chars[i], x, h / 2 + 0.5); }
    c.letters.push([x, widths[i]]); x += widths[i] + 0.6;
  }
  c.w = w; c.h = h;
  signCache.set(key, c);
  return c;
}
function glow(ctx, g, t, view, box) {
  const L = layout(g), red = reducedOf(view), p = g.player, ready = fontsReady();
  // the stands beyond the walls, caught in a roaming pink spot; their eyes find you
  const R = voidRects(L, box, 6);
  if (R.length) {
    if (!standsLit) standsLit = standsCanvas(true);
    ctx.save(); ctx.beginPath(); for (const r of R) ctx.rect(r[0], r[1], r[2], r[3]); ctx.clip();
    const pat = ctx.createPattern(standsLit, "repeat"); pat.setTransform && pat.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
    ctx.globalAlpha = 0.38; ctx.fillStyle = pat; for (const r of R) ctx.fillRect(r[0], r[1], r[2], r[3]);
    ctx.globalCompositeOperation = "lighter";
    const sxp = red ? (box.x0 + box.x1) / 2 : box.x0 + ((Math.sin(t * 0.23) * 0.5 + 0.5) * (box.x1 - box.x0));
    const spr = glowSprite("#ff3fa4");
    for (const yy of [-30, L.mh + 30]) { ctx.globalAlpha = 0.7; ctx.drawImage(spr, sxp - 110, yy - 70, 220, 140); }
    ctx.globalCompositeOperation = "source-over";
    // eyes: each seat in the stands (pattern geometry: 2 rows per CH, 4 per row)
    const gx0 = Math.floor(box.x0 / CW) - 1, gx1 = Math.ceil(box.x1 / CW), gy0 = Math.floor(box.y0 / CH) - 1, gy1 = Math.ceil(box.y1 / CH);
    for (let cy = gy0; cy <= gy1; cy++) for (let cx = gx0; cx <= gx1; cx++) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const hh = hash(i, r, 77); if (hh < 0.15 || (hh >= 0.3 && hh < 0.4)) continue; // faceless ones, turned ones
      const hx = cx * CW + ((r * 12 + 12 + i * 24) % CW), hy = cy * CH + r * 28 + 23 - 9.4 * 1.2;
      if (hx > -8 && hx < L.mw + 8 && hy > -8 && hy < L.mh + 8) continue;
      if (hx < box.x0 || hx > box.x1 || hy < box.y0 || hy > box.y1) continue;
      eyes(ctx, hx, hy - 0.8 * 1.2, 1.2, p, t, hash(cx, cy, r * 4 + i), red, 0.75);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // neon slogans (sprites), a marquee of chasing bulbs round each board
  for (let si = 0; si < L.signs.length; si++) {
    const s = L.signs[si], c = signSprite(s, ready);
    const x = s.x - c.w / 2, y = s.y - c.h / 2;
    if (x > box.x1 || x + c.w < box.x0 || y > box.y1 || y + c.h < box.y0) continue;
    // buzzing: the whole board breathes slowly; one letter on some boards dies and returns (slow, never a strobe)
    const breathe = red ? 0.9 : 0.82 + 0.12 * Math.sin(t * 1.1 + si * 2);
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35 * breathe;
    ctx.drawImage(glowSprite(s.col), x - 10, y - 14, c.w + 20, c.h + 28);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = breathe;
    ctx.drawImage(c, x, y, c.w, c.h);
    if (s.buzz != null && s.buzz >= 0 && !red) {
      const off = Math.sin(t * 0.9 + si) * Math.sin(t * 2.1 + si * 3) > 0.45;
      if (off) { const [lx, lw] = c.letters[s.buzz]; ctx.globalAlpha = 0.85; ctx.fillStyle = "#0e040a"; ctx.fillRect(x + lx - 0.3, y + 5, lw + 0.6, c.h - 10); }
    }
    // chase: one bright bulb in three, stepping ~2.5 times a second
    const step = red ? 0 : Math.floor(t * 2.5);
    const per = 2 * (c.w + c.h - 12), n = Math.floor(per / 6);
    ctx.globalAlpha = 1;
    for (let k = 0; k < n; k++) {
      let d = (k / n) * per, bx, by;
      const ww = c.w - 6, hh = c.h - 6;
      if (d < ww) { bx = x + 3 + d; by = y + 3; } else if ((d -= ww) < hh) { bx = x + 3 + ww; by = y + 3 + d; } else if ((d -= hh) < ww) { bx = x + 3 + ww - d; by = y + 3 + hh; } else { d -= ww; bx = x + 3; by = y + 3 + hh - d; }
      const on = (k + step) % 3 === 0;
      circle(ctx, bx, by, on ? 1.15 : 0.85, on ? "#fff3b0" : "rgba(246,210,122,.35)");
    }
  }
  // the audience in the bleachers: every pair of eyes turns to watch you
  for (const st of L.seats) {
    if (st.kind === "balloon" || st.kind === "blank" || st.kind === "back") continue;
    if (st.x < box.x0 || st.x > box.x1 || st.y < box.y0 || st.y > box.y1 + 12) continue;
    const s = st.sc, hy = st.y - 9.4 * s;
    if (st.kind === "cutout") { eyes(ctx, st.x, hy, s, p, t, st.seed, red, 0.6, true); continue; }
    eyes(ctx, st.x, hy - 0.8 * s, s, p, t, st.seed, red, 0.62);
  }
  // under the risers: something crouched in the dark, two eyes each
  for (let i = 0; i < L.seats.length; i += 5) {
    const st = L.seats[i];
    if (st.sc > 0.85 || st.seed < 0.5 || st.x < box.x0 || st.x > box.x1 || st.y < box.y0 || st.y > box.y1) continue;
    const ex = st.x + 4, ey = st.y + 8;
    const open = red || Math.sin(t * 0.5 + st.seed * 40) > -0.6;
    if (!open) continue;
    ctx.globalAlpha = 0.7; circle(ctx, ex - 1.3, ey, 0.75, "#ffd23f"); circle(ctx, ex + 1.3, ey, 0.75, "#ffd23f");
  }
  ctx.globalAlpha = 1;
}
/* eye whites with pupils turned to the player; a slow blink now and then (eyes shut, not a flash) */
function eyes(ctx, x, y, s, p, t, seed, red, a, single) {
  if (!red && Math.sin(t * 0.37 + seed * 61) > 0.985) return; // blinking
  const dx = p.x - x, dy = (p.y - 14) - y, d = Math.hypot(dx, dy) || 1, ox = (dx / d) * 0.5 * s, oy = (dy / d) * 0.45 * s;
  ctx.globalAlpha = a;
  if (single) { circle(ctx, x, y, 1.3 * s, "#f4efe6"); circle(ctx, x + ox * 1.6, y + oy * 1.6, 0.7 * s, "#0a0204"); ctx.globalAlpha = 1; return; }
  const red2 = seed > 0.8;
  for (const sd of [-1, 1]) {
    circle(ctx, x + sd * 1.35 * s, y, 0.85 * s, red2 ? "#ff8a8a" : "#f4efe6");
    circle(ctx, x + sd * 1.35 * s + ox, y + oy, 0.45 * s, "#0a0204");
  }
  ctx.globalAlpha = 1;
}

export default { paint, backdrop, ambient, glow };
