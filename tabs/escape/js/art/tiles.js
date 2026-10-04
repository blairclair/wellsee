/* art/tiles.js — floor and wall tiles (prerendered once per level) and animated tile overlays.
 *
 * Pseudo-3D top-down: a solid tile with open floor below it shows a front face
 * (the bottom FH pixels of the tile) under its top, so walls read as having
 * height. prerenderLevel paints every floor first, then the solids row by row
 * (top to bottom) so anything that overhangs (branches, lamp heads, bulb wire)
 * lands on top of the floors around it, then cast shadows. Zones get their own
 * dressing from game.levelId (the shooting gallery, the front gate, ...).
 */
import { TILE, TILES } from "../content.js";
import { TAU, PAL, hash, ellipse, circle } from "./util.js";

const FH = 13; // front-face height of a wall, in world px

function speckle(ctx, x, y, s, tx, ty, base, specks, n = 14, size = 2, salt = 0) {
  ctx.fillStyle = base; ctx.fillRect(x, y, s, s);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = specks[(hash(tx, ty, i + salt) * specks.length) | 0];
    const sz = size * (0.5 + hash(tx, ty, i + 77 + salt));
    ctx.fillRect(x + hash(tx, ty, i + 50 + salt) * s, y + hash(tx, ty, i + 99 + salt) * s, sz, sz);
  }
}
const solidAt = (game, tx, ty) => !game || tx < 0 || ty < 0 || tx >= game.w || ty >= game.h || !!TILES[game.tiles[ty * game.w + tx]].solid;
const floorBelow = (game, tx, ty) => game && ty + 1 < game.h && !solidAt(game, tx, ty + 1);
const zone = (game) => (game && game.levelId) || "";

/* litter shared by the floors: things people dropped while running */
function litter(ctx, x, y, s, tx, ty, game, amt = 1) {
  const h = (k) => hash(tx, ty, k);
  if (h(201) < 0.07 * amt) { // a ticket stub: ADMIT ONE
    ctx.save(); ctx.translate(x + h(202) * s, y + h(203) * s); ctx.rotate(h(204) * TAU);
    ctx.fillStyle = h(205) < 0.5 ? "#b8323a" : "#c9a54a"; ctx.fillRect(-4, -2, 8, 4);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(1, -2, 0.6, 4); ctx.fillRect(-3, -0.4, 3, 0.8);
    ctx.restore();
  }
  if (h(211) < 0.06 * amt) for (let i = 0; i < 5; i++) { const px = x + h(212 + i) * s, py = y + h(220 + i) * s; circle(ctx, px, py, 1.5, "#efe3b0"); circle(ctx, px + 0.5, py - 0.4, 0.8, "#fff8e0"); } // popcorn
  if (h(231) < 0.05 * amt) { ctx.fillStyle = "rgba(90,8,14,.55)"; ctx.beginPath(); ctx.ellipse(x + h(232) * s, y + h(233) * s, 4 + h(234) * 5, 2 + h(235) * 2, h(236) * 3, 0, TAU); ctx.fill(); circle(ctx, x + h(237) * s, y + h(238) * s, 1.2, "rgba(90,8,14,.55)"); } // stains
  if (h(241) < 0.04 * amt) { // a lost shoe, a dropped glove
    ctx.save(); ctx.translate(x + h(242) * s, y + h(243) * s); ctx.rotate(h(244) * TAU);
    ctx.fillStyle = "#1e1612"; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2, 0, 0, TAU); ctx.fill(); ctx.fillRect(-4.5, -2.4, 3, 2.4); ctx.restore();
  }
  if (h(251) < 0.05 * amt) { ctx.strokeStyle = PAL.pink; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + h(252) * s, y + h(253) * s); ctx.lineTo(x + h(254) * s, y + h(255) * s); ctx.stroke(); } // a candy-floss stick
  if (zone(game) === "gallery" && h(261) < 0.18) { // spent corks and pellets
    for (let i = 0; i < 3; i++) { const px = x + h(262 + i) * s, py = y + h(270 + i) * s; ctx.fillStyle = "#b08a58"; ctx.fillRect(px, py, 2.2, 1.6); }
  }
}

export const TILE_ART = {
  dirt(ctx, x, y, s, tx, ty, game) {
    if (zone(game) === "gate") { // cobbles worn down the middle, the road out
      ctx.fillStyle = "#1d1618"; ctx.fillRect(x, y, s, s);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const cx = x + (i + (j % 2) * 0.5) * (s / 4), cy = y + j * (s / 4) + 4, v = hash(tx * 4 + i, ty * 4 + j);
        ctx.fillStyle = v < 0.3 ? "#2c2326" : v < 0.7 ? "#33292a" : "#3b3030";
        ctx.beginPath(); ctx.ellipse(cx, cy, s / 9, s / 11, v, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,240,220,.05)"; ctx.fillRect(cx - 2, cy - 2.5, 3, 1);
      }
      litter(ctx, x, y, s, tx, ty, game, 0.6);
      return;
    }
    speckle(ctx, x, y, s, tx, ty, "#231816", ["#2f2320", "#1a1210", "#3a2a22", "#16100e", "#2a1a14"], 22);
    const h = (k) => hash(tx, ty, k);
    if (h(7) < 0.16) { // trodden mud, wet and black, catching a little light
      ellipse(ctx, x + h(8) * s, y + h(9) * s, 6 + h(10) * 8, 3 + h(11) * 3, "#120c0b", h(12));
      ctx.fillStyle = "rgba(200,180,160,.08)"; ctx.fillRect(x + h(8) * s - 3, y + h(9) * s - 1.5, 4, 0.8);
    }
    if (h(13) < 0.14) { // footprints, all heading the same way
      ctx.fillStyle = "rgba(10,6,5,.6)";
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(x + s * (0.35 + i * 0.25), y + s * (0.65 - i * 0.3), 2.2, 4, 0.25, 0, TAU); ctx.fill(); }
    }
    if (h(15) < 0.12) { ctx.strokeStyle = "#5a4a2a"; ctx.lineWidth = 0.7; for (let i = 0; i < 4; i++) { ctx.beginPath(); const sx = x + h(16 + i) * s, sy = y + h(20 + i) * s; ctx.moveTo(sx, sy); ctx.lineTo(sx + 5 * Math.cos(h(24 + i) * 6), sy + 5 * Math.sin(h(24 + i) * 6)); ctx.stroke(); } } // straw
    litter(ctx, x, y, s, tx, ty, game);
  },
  boards(ctx, x, y, s, tx, ty, game) {
    const plank = s / 4;
    for (let i = 0; i < 4; i++) {
      const v = hash(tx, ty, i);
      ctx.fillStyle = v < 0.3 ? "#36211a" : v < 0.7 ? "#40271c" : "#4a2e1f";
      ctx.fillRect(x, y + i * plank, s, plank - 1);
      ctx.strokeStyle = "rgba(20,10,6,.35)"; ctx.lineWidth = 0.5; // grain
      ctx.beginPath(); ctx.moveTo(x, y + i * plank + 2 + v * 3); ctx.bezierCurveTo(x + s * 0.3, y + i * plank + 1 + v * 4, x + s * 0.7, y + i * plank + 5 - v * 2, x + s, y + i * plank + 3); ctx.stroke();
      ctx.fillStyle = "#120806"; ctx.fillRect(x, y + i * plank + plank - 1, s, 1); // the gap
      ctx.fillStyle = "rgba(255,220,180,.05)"; ctx.fillRect(x, y + i * plank, s, 1);
      const seam = ((tx * 7 + i * 13) % 4) * (s / 4);
      ctx.fillStyle = "#120806"; ctx.fillRect(x + seam, y + i * plank, 1, plank);
      ctx.fillStyle = "#6a5e52"; ctx.fillRect(x + seam + 2, y + i * plank + 2, 1, 1); ctx.fillRect(x + seam + 2, y + i * plank + plank - 3, 1, 1); // nails
      if (hash(tx, ty, i + 40) < 0.012) { ctx.fillStyle = "#0a0404"; ctx.fillRect(x + s * 0.4, y + i * plank, s * 0.35, plank - 1); ctx.fillStyle = "#3a0a0a"; circle(ctx, x + s * 0.5, y + i * plank + plank / 2, 0.9, PAL.bulbHot); } // a missing board, and something under it
    }
    if (zone(game) === "gallery" && hash(tx, ty, 61) < 0.15) for (let i = 0; i < 3; i++) circle(ctx, x + hash(tx, ty, 62 + i) * s, y + hash(tx, ty, 66 + i) * s, 0.9, "#0a0606"); // pellet holes
    litter(ctx, x, y, s, tx, ty, game);
  },
  grass(ctx, x, y, s, tx, ty, game) {
    speckle(ctx, x, y, s, tx, ty, "#111d12", ["#1a2e17", "#0c170d", "#203a1a", "#2a2a14", "#18240f"], 14);
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const gx = x + hash(tx, ty, i + 200) * s, gy = y + hash(tx, ty, i + 300) * s, l = 3 + hash(tx, ty, i + 400) * 4;
      ctx.strokeStyle = i % 3 ? "#2c4a22" : "#3a5a2a";
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(tx, ty, i) - 0.5) * 4, gy - l); ctx.stroke();
    }
    if (hash(tx, ty, 11) < 0.05) { ctx.fillStyle = "#d8ccb0"; ctx.fillRect(x + 12, y + 14, 7, 2); circle(ctx, x + 12, y + 15, 1.6, "#d8ccb0"); circle(ctx, x + 19, y + 15, 1.6, "#d8ccb0"); } // a bone
    if (hash(tx, ty, 12) < 0.06) { ctx.fillStyle = "rgba(40,20,10,.6)"; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, 6, 3, 0.3, 0, TAU); ctx.fill(); } // turned earth
    litter(ctx, x, y, s, tx, ty, game, 0.5);
  },
  sawdust(ctx, x, y, s, tx, ty, game) {
    speckle(ctx, x, y, s, tx, ty, "#46321f", ["#5c4430", "#3a2818", "#6b5038", "#2e2016", "#7a5c3c"], 34, 1.5);
    const h = (k) => hash(tx, ty, k);
    if (h(5) < 0.1) { ctx.fillStyle = "rgba(120,14,22,.55)"; ctx.beginPath(); ctx.ellipse(x + s * h(6), y + s * h(8), 5, 3.5, h(9) * 3, 0, TAU); ctx.fill(); ctx.fillStyle = "rgba(80,8,14,.5)"; ctx.fillRect(x + s * h(6), y + s * h(8), 6, 1); } // soaked through
    if (h(14) < 0.08) { ctx.strokeStyle = "rgba(30,18,10,.6)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y + s * h(15)); ctx.quadraticCurveTo(x + s / 2, y + s * h(16), x + s, y + s * h(17)); ctx.stroke(); } // drag marks
    if (zone(game) === "mirrors" && h(18) < 0.12) { ctx.fillStyle = "rgba(220,240,255,.55)"; for (let i = 0; i < 3; i++) { ctx.beginPath(); const gx = x + h(19 + i) * s, gy = y + h(23 + i) * s; ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy + 1); ctx.lineTo(gx + 1, gy + 2.5); ctx.fill(); } } // glass
    litter(ctx, x, y, s, tx, ty, game);
  },
  silence(ctx, x, y, s, tx, ty) {
    speckle(ctx, x, y, s, tx, ty, "#262629", ["#323238", "#1c1c20", "#3c3c44"], 16);
    for (let i = 0; i < 5; i++) { // dead bugs, legs up
      if (hash(tx, ty, i + 400) > 0.55) continue;
      const bx = x + hash(tx, ty, i + 410) * s, by = y + hash(tx, ty, i + 420) * s;
      ellipse(ctx, bx, by, 2.2, 1.4, "#0b0b0d");
      ctx.strokeStyle = "#0b0b0d"; ctx.lineWidth = 0.6;
      for (let l = -1; l <= 1; l++) { ctx.beginPath(); ctx.moveTo(bx + l * 1.2, by); ctx.lineTo(bx + l * 1.8, by - 2.4); ctx.stroke(); }
    }
  },
  water(ctx, x, y, s, tx, ty) {
    speckle(ctx, x, y, s, tx, ty, "#0a2129", ["#0d303a", "#061820", "#103a46"], 10, 3);
    if (hash(tx, ty, 3) < 0.1) { ctx.fillStyle = "rgba(220,230,220,.25)"; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s / 2, 3, 1.5, 0, 0, TAU); ctx.fill(); } // something floating
  },
  door(ctx, x, y, s, tx, ty, game) {
    TILE_ART.sawdust(ctx, x, y, s, tx, ty, game);
    ctx.fillStyle = "#0e0306"; ctx.beginPath(); ctx.moveTo(x + 3, y + s); ctx.quadraticCurveTo(x + s / 2, y - 14, x + s - 3, y + s); ctx.fill();
    ctx.strokeStyle = PAL.candyDark; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#5a0a14"; ctx.beginPath(); ctx.moveTo(x + 3, y + s); ctx.quadraticCurveTo(x + 8, y + 6, x + s / 2 - 2, y + 2); ctx.lineTo(x + 7, y + s); ctx.fill(); // flap pulled aside
  },
  exit(ctx, x, y, s, tx, ty) {
    speckle(ctx, x, y, s, tx, ty, "#14281a", ["#1f4a1c", "#0f220f", "#2c5a24"], 12);
    ctx.strokeStyle = "rgba(157,255,106,.3)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(x + 3.5, y + 3.5, s - 7, s - 7); ctx.setLineDash([]);
  },

  /* ---- solids: a top, and a front face when there is floor below ---- */
  tent(ctx, x, y, s, tx, ty, game) {
    const stripe = s / 4, front = floorBelow(game, tx, ty), top = front ? s - FH : s;
    const red = PAL.candyDark, cream = "#c4ae86";
    for (let i = 0; i < 4; i++) { // canvas roof
      const r = ((tx * 4 + i) % 2) === 0;
      ctx.fillStyle = r ? "#6e0e1c" : "#b29c76"; ctx.fillRect(x + i * stripe, y, stripe, top);
      ctx.fillStyle = "rgba(255,240,220,.07)"; ctx.fillRect(x + i * stripe, y, 1.2, top); // seam highlight
    }
    const g = ctx.createLinearGradient(x, y, x, y + top); g.addColorStop(0, "rgba(0,0,0,.25)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = g; ctx.fillRect(x, y, s, top);
    if (hash(tx, ty, 1) < 0.35) { ctx.fillStyle = "rgba(30,14,6,.45)"; ctx.beginPath(); ctx.ellipse(x + s * hash(tx, ty, 2), y + top * 0.6, 6, 9, 0.3, 0, TAU); ctx.fill(); } // water stains
    if (hash(tx, ty, 3) < 0.1) { ctx.strokeStyle = "#2a1a10"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 12, y + 9); ctx.lineTo(x + 9, y + 14); ctx.moveTo(x + 7, y + 8); ctx.lineTo(x + 11, y + 7); ctx.stroke(); } // a stitched patch
    if (!front) return;
    // the front: canvas wall in shadow, a scalloped valance, a muddy hem
    const fy = y + top;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ((tx * 4 + i) % 2) === 0 ? "#4a0812" : "#7a6a50"; ctx.fillRect(x + i * stripe, fy, stripe, FH); }
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x, fy, s, FH);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? cream : red; ctx.beginPath(); ctx.moveTo(x + i * stripe, fy); ctx.lineTo(x + i * stripe + stripe, fy); ctx.arc(x + i * stripe + stripe / 2, fy, stripe / 2, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = "#c9a54a"; ctx.fillRect(x, fy - 1, s, 1.4);
    ctx.fillStyle = "rgba(40,20,10,.7)"; ctx.fillRect(x, y + s - 3, s, 3);
    if (hash(tx, ty, 5) < 0.12) { // a slit in the canvas, and something looking through
      ctx.fillStyle = "#050203"; ctx.beginPath(); ctx.ellipse(x + s * 0.55, fy + FH * 0.6, 1.6, FH * 0.32, 0, 0, TAU); ctx.fill();
      circle(ctx, x + s * 0.55, fy + FH * 0.55, 0.6, PAL.bulbHot);
    }
  },
  booth(ctx, x, y, s, tx, ty, game) {
    const cols = [["#b2163a", "#eadcbc"], ["#24803a", "#eadcbc"], ["#5f2682", "#f0c86e"], ["#c9782a", "#2a0a10"], ["#1b666e", "#eadcbc"]];
    const [a, b] = cols[((tx / 3) | 0) % cols.length];
    const front = floorBelow(game, tx, ty), top = front ? s - FH - 6 : s;
    // awning, seen from above: stripes, sagging, a tear
    const st = s / 4;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? b : a; ctx.fillRect(x + i * st, y, st, top); }
    const g = ctx.createLinearGradient(x, y, x, y + top); g.addColorStop(0, "rgba(255,255,255,.1)"); g.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = g; ctx.fillRect(x, y, s, top);
    if (hash(tx, ty, 8) < 0.15) { ctx.fillStyle = "#0e0608"; ctx.beginPath(); ctx.moveTo(x + 8, y + 5); ctx.lineTo(x + 14, y + 9); ctx.lineTo(x + 9, y + 12); ctx.fill(); }
    if (!front) return;
    // valance scallops, then the counter and its shelf of prizes
    const fy = y + top;
    ctx.fillStyle = "#1a0e0a"; ctx.fillRect(x, fy, s, s - top);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? b : a; ctx.beginPath(); ctx.moveTo(x + i * st, fy); ctx.lineTo(x + i * st + st, fy); ctx.arc(x + i * st + st / 2, fy, st / 2, 0, Math.PI); ctx.fill(); }
    if (zone(game) === "gallery") { // the shooting gallery: tin ducks on a rail, one knocked down
      ctx.fillStyle = "#2a2a30"; ctx.fillRect(x, fy + 10, s, 1.2);
      for (let i = 0; i < 3; i++) {
        const dx = x + 5 + i * 10, down = hash(tx, ty, i + 70) < 0.2;
        ctx.fillStyle = down ? "#6a5a20" : "#d8b030";
        if (down) ctx.fillRect(dx - 3, fy + 9, 7, 2);
        else { ctx.beginPath(); ctx.ellipse(dx, fy + 7.5, 3.4, 2.4, 0, 0, TAU); ctx.fill(); circle(ctx, dx + 2.6, fy + 5, 1.6, "#d8b030"); ctx.fillStyle = "#c9601a"; ctx.fillRect(dx + 3.8, fy + 4.8, 1.6, 0.8); circle(ctx, dx + 2.8, fy + 4.6, 0.4, "#000"); circle(ctx, dx - 1, fy + 7, 0.6, "#000"); }
      }
    } else {
      for (let i = 0; i < 3; i++) { // plush prizes with button eyes; one has lost its head
        const px = x + 5 + i * 10, py = fy + 7;
        const pc = ["#d98fb0", "#a0d0ff", "#f0e08a", "#b08060"][(hash(tx, ty, i) * 4) | 0];
        if (hash(tx, ty, i + 9) < 0.15) { ellipse(ctx, px, py + 1.5, 3.4, 2.4, pc); ctx.fillStyle = "#e8e0d0"; ctx.fillRect(px - 1.5, py - 0.6, 3, 1.2); continue; }
        circle(ctx, px, py, 3.4, pc); circle(ctx, px - 2.4, py - 2.6, 1.3, pc); circle(ctx, px + 2.4, py - 2.6, 1.3, pc);
        ctx.fillStyle = "#000"; ctx.fillRect(px - 1.8, py - 0.8, 1.1, 1.1); ctx.fillRect(px + 0.8, py - 0.8, 1.1, 1.1);
      }
    }
    ctx.fillStyle = "#4a2e1e"; ctx.fillRect(x, y + s - 6, s, 2); // counter lip
    ctx.fillStyle = "#2a160e"; ctx.fillRect(x, y + s - 4, s, 4);
    ctx.fillStyle = "rgba(255,220,160,.12)"; ctx.fillRect(x, y + s - 6, s, 0.8);
  },
  fence(ctx, x, y, s, tx, ty, game) {
    (TILE_ART[(game && game.level.base) || "dirt"] || TILE_ART.dirt)(ctx, x, y, s, tx, ty, game);
    if (zone(game) === "gate") { // wrought iron, painted red and gold, spear-topped
      ctx.fillStyle = "#3a0a10"; ctx.fillRect(x, y + s * 0.3, s, 2.4); ctx.fillRect(x, y + s * 0.82, s, 2.4);
      for (let i = 0; i < 4; i++) {
        const px = x + 4 + i * (s / 4);
        ctx.fillStyle = "#5a0e16"; ctx.fillRect(px - 1, y - 2, 2.2, s);
        ctx.fillStyle = "#c9a54a"; ctx.beginPath(); ctx.moveTo(px - 2.4, y - 1); ctx.lineTo(px + 0.1, y - 7); ctx.lineTo(px + 2.6, y - 1); ctx.fill();
      }
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(x, y + s - 2, s, 2);
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x, y + s - 4, s, 4);
    ctx.fillStyle = "#3a281a"; ctx.fillRect(x, y + s * 0.32, s, 3.4); ctx.fillRect(x, y + s * 0.66, s, 3.4);
    for (let i = 0; i < 3; i++) {
      const px = x + 3 + i * (s / 3), broken = hash(tx, ty, i) < 0.12;
      const top = broken ? y + 8 : y - 2;
      ctx.fillStyle = "#4e3828"; ctx.fillRect(px, top, 6, y + s - 3 - top);
      ctx.fillStyle = "#614634"; ctx.fillRect(px, top, 2, y + s - 3 - top);
      ctx.fillStyle = "#6e5240"; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + 3, top - (broken ? -2 : 4)); ctx.lineTo(px + 6, top); ctx.fill();
      if (hash(tx, ty, i + 5) < 0.15) { ctx.fillStyle = "rgba(240,240,235,.8)"; ctx.fillRect(px + 1, y + s * 0.45, 4, 0.8); ctx.fillRect(px + 1, y + s * 0.5, 3, 0.8); } // chalk marks: a tally
    }
    if (zone(game) === "gallery" && hash(tx, ty, 9) < 0.3) { // a paper target pinned up, shot through
      circle(ctx, x + s / 2, y + s * 0.5, 6, "#e8dcc4"); circle(ctx, x + s / 2, y + s * 0.5, 4, "#b8323a"); circle(ctx, x + s / 2, y + s * 0.5, 2, "#e8dcc4");
      for (let i = 0; i < 3; i++) circle(ctx, x + s / 2 + (hash(tx, ty, 10 + i) - 0.5) * 9, y + s * 0.5 + (hash(tx, ty, 14 + i) - 0.5) * 9, 0.7, "#0a0606");
    }
  },
  tree(ctx, x, y, s, tx, ty, game) {
    TILE_ART.grass(ctx, x, y, s, tx, ty, game);
    const cx = x + s / 2, cy = y + s * 0.62;
    ellipse(ctx, cx + 3, cy + 5, 11, 4, "rgba(0,0,0,.5)");
    // trunk: dead, split, nailed with old handbills
    ctx.fillStyle = "#1a100c"; ctx.beginPath(); ctx.moveTo(cx - 5, cy + 4); ctx.lineTo(cx - 3, cy - 14); ctx.lineTo(cx + 3, cy - 14); ctx.lineTo(cx + 6, cy + 4); ctx.fill();
    ctx.fillStyle = "#2a1a12"; ctx.fillRect(cx - 2, cy - 12, 1.5, 14);
    if (hash(tx, ty, 3) < 0.4) { ctx.fillStyle = "#c8b890"; ctx.fillRect(cx - 3, cy - 6, 5, 6); ctx.fillStyle = "#8a1414"; ctx.fillRect(cx - 2, cy - 5, 3, 1); ctx.fillRect(cx - 2, cy - 3, 2, 0.8); }
  },
  lamp(ctx, x, y, s, tx, ty, game) {
    const under = game ? game.level.base : "dirt";
    (TILE_ART[under] || TILE_ART.dirt)(ctx, x, y, s, tx, ty, game);
    ellipse(ctx, x + s / 2, y + s * 0.82, 8, 3.4, "rgba(0,0,0,.55)");
    ctx.fillStyle = "#2c2c32"; ctx.fillRect(x + s / 2 - 5, y + s * 0.74, 10, 4);
  },
  mirror(ctx, x, y, s, tx, ty, game) {
    const front = floorBelow(game, tx, ty);
    ctx.fillStyle = "#14161c"; ctx.fillRect(x, y, s, s);
    const g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, "#7fa8b8"); g.addColorStop(0.45, "#d8f0fa"); g.addColorStop(0.55, "#5f7f8f"); g.addColorStop(1, "#24384a");
    ctx.fillStyle = g; ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
    // the warped figure in the glass is not you: too tall, and grinning
    ctx.fillStyle = "rgba(20,10,30,.5)";
    ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.3, 3 + hash(tx, ty) * 3, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.7, 5, 9 + hash(tx, ty, 2) * 4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(200,20,40,.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + s / 2, y + s * 0.3, 3, 0.3, Math.PI - 0.3); ctx.stroke();
    if (hash(tx, ty, 4) < 0.25) { ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 14, y + 16); ctx.lineTo(x + 12, y + 24); ctx.moveTo(x + 14, y + 16); ctx.lineTo(x + 22, y + 14); ctx.stroke(); } // cracked
    ctx.strokeStyle = PAL.bulb; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.fillRect(x + 6, y + 5, 2, s - 12);
    if (front) { ctx.fillStyle = "#3a2a10"; ctx.fillRect(x, y + s - 4, s, 4); ctx.fillStyle = "#8a6a20"; ctx.fillRect(x, y + s - 4, s, 1); }
  },
};

/* things drawn after all floors, so they can overhang their tile */
const OVERHANG = {
  tree(ctx, x, y, s, tx, ty) {
    const cx = x + s / 2, cy = y + s * 0.62 - 14;
    ctx.strokeStyle = "#0b0607"; ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (hash(tx, ty, i) - 0.5) * 2.8, l = 14 + hash(tx, ty, i + 9) * 16;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy);
      const mx = cx + Math.cos(a) * l * 0.6, my = cy + Math.sin(a) * l * 0.6;
      ctx.lineTo(mx, my); ctx.lineTo(cx + Math.cos(a + 0.4) * l, cy + Math.sin(a + 0.4) * l); ctx.stroke();
      ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a - 0.7) * 8, my + Math.sin(a - 0.7) * 8); ctx.stroke();
    }
    if (hash(tx, ty, 30) < 0.3) { // something hung from a branch, turning
      const hx = cx + (hash(tx, ty, 31) - 0.5) * 16, hy = cy - 6;
      ctx.strokeStyle = "#5a4a3a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hx, hy - 8); ctx.lineTo(hx, hy); ctx.stroke();
      ellipse(ctx, hx, hy + 2, 2.2, 3, "#c8b0a8"); circle(ctx, hx - 0.8, hy + 1.5, 0.4, "#000"); circle(ctx, hx + 0.8, hy + 1.5, 0.4, "#000"); // a plush rabbit, hanged
    }
  },
  lamp(ctx, x, y, s, tx, ty) {
    const cx = x + s / 2;
    ctx.fillStyle = "#18181c"; ctx.fillRect(cx - 1.8, y - 12, 3.6, s * 0.86 + 12);
    ctx.fillStyle = "#2a2a30"; ctx.fillRect(cx - 1.8, y - 12, 1, s * 0.86 + 12);
    ctx.fillStyle = "#18181c"; ctx.beginPath(); ctx.moveTo(cx - 7, y - 10); ctx.lineTo(cx + 7, y - 10); ctx.lineTo(cx + 4, y - 15); ctx.lineTo(cx - 4, y - 15); ctx.fill();
    circle(ctx, cx, y - 8, 5, PAL.bulb); circle(ctx, cx, y - 8.5, 2.8, PAL.bulbHot);
  },
};

/* ================================================================ animated */
export const TILE_FX = {
  water(ctx, x, y, s, t) {
    ctx.strokeStyle = "rgba(122,240,255,.16)"; ctx.lineWidth = 1;
    const o = (t * 10 + x * 0.3) % s;
    ctx.beginPath(); ctx.moveTo(x, y + o); ctx.quadraticCurveTo(x + s / 2, y + o - 3, x + s, y + o); ctx.stroke();
  },
  silence(ctx, x, y, s, t) {
    const a = 0.04 + 0.035 * Math.sin(t * 0.8 + x * 0.05 + y * 0.03);
    ctx.fillStyle = `rgba(200,200,230,${a})`; ctx.fillRect(x, y, s, s);
  },
  exit(ctx, x, y, s, t) {
    const a = 0.12 + 0.08 * Math.sin(t * 2 + x * 0.1);
    ctx.fillStyle = `rgba(157,255,106,${a})`; ctx.fillRect(x, y, s, s);
  },
};

export function prerenderLevel(game, scale = 2) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(game.w * TILE * scale); c.height = Math.ceil(game.h * TILE * scale);
  const ctx = c.getContext("2d"); ctx.scale(scale, scale);
  const name = (tx, ty) => game.tiles[ty * game.w + tx];
  // pass 1: every floor (solids paint their own floor/top too)
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const n = name(tx, ty);
    (TILE_ART[n] || TILE_ART.dirt)(ctx, tx * TILE, ty * TILE, TILE, tx, ty, game);
  }
  // shadows cast down onto the floor below each wall, and a softer one to the right
  for (let ty = 0; ty < game.h - 1; ty++) for (let tx = 0; tx < game.w; tx++) {
    const a = TILES[name(tx, ty)], b = TILES[name(tx, ty + 1)];
    if (a.solid && !b.solid && name(tx, ty) !== "lamp") {
      const g = ctx.createLinearGradient(0, (ty + 1) * TILE, 0, (ty + 1) * TILE + 14);
      g.addColorStop(0, "rgba(0,0,0,.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(tx * TILE, (ty + 1) * TILE, TILE, 14);
    }
    if (tx + 1 < game.w && a.solid && !TILES[name(tx + 1, ty)].solid && name(tx, ty) !== "lamp") {
      const g = ctx.createLinearGradient((tx + 1) * TILE, 0, (tx + 1) * TILE + 7, 0);
      g.addColorStop(0, "rgba(0,0,0,.35)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect((tx + 1) * TILE, ty * TILE, 7, TILE);
    }
  }
  // pass 2: overhangs, top row first
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const f = OVERHANG[name(tx, ty)]; if (f) f(ctx, tx * TILE, ty * TILE, TILE, tx, ty, game);
  }
  // bulb strings along the valance of tent/booth runs: a sagging wire; many bulbs dead
  const bulbs = [];
  for (let ty = 0; ty < game.h; ty++) {
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        ctx.strokeStyle = "#141010"; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let i = 0; i < run.length - 1; i++) { const a = run[i], b = run[i + 1]; ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, a.y + 4, b.x, b.y); }
        ctx.stroke();
      }
      run = [];
    };
    for (let tx = 0; tx < game.w; tx++) {
      const n = name(tx, ty);
      if ((n === "booth" || n === "tent") && floorBelow(game, tx, ty)) {
        if (tx % 2 === 0) {
          const sd = hash(tx, ty, 77), y0 = ty * TILE + TILE - FH - (n === "booth" ? 4 : 0);
          const b = { x: tx * TILE + TILE / 2, y: y0 + 3, color: ["#f6d27a", "#ff2a4d", "#7dff4a", "#b46cff"][(tx * 3 + ty) % 4], seed: sd, state: sd < 0.4 ? "dead" : sd < 0.55 ? "flicker" : "on" };
          bulbs.push(b); run.push(b);
        }
      } else flush();
    }
    flush();
  }
  // lights from tiles (lamp heads sit above their tile now)
  const lights = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const n = name(tx, ty), d = TILES[n];
    if (d.light) lights.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE - (n === "lamp" ? 22 : 0), ...d.light, r: d.light.r * 0.72, seed: hash(tx, ty, 5) });
  }
  const fxTiles = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) if (TILE_FX[name(tx, ty)]) fxTiles.push([tx, ty, name(tx, ty)]);
  return { canvas: c, scale, bulbs, lights, fxTiles };
}
