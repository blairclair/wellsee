/* art.js — every pixel on the game canvas.
 *
 * Owned by the ART agent. Pure drawing: reads game state, never changes it
 * (except its own particle/shake/flash state in `fx`).
 *
 * Contract (see ARCHITECTURE.md):
 *   TILE_ART[tileName](ctx, x, y, s, tx, ty, game)      static, prerendered once per level
 *   TILE_FX[tileName](ctx, x, y, s, t)                   animated overlay, per frame, visible tiles
 *   ENTITY_ART[type](ctx, e, t, view)                    ctx is translated to the entity's feet (e.x,e.y)
 *   ICONS[weaponOrItemId](ctx, size)                     centred at 0,0, fits in `size`; used by HUD too
 *   onEvent(ev, view)                                    particles/shake/flash for engine events
 *   render(ctx, game, cam, view)                         whole frame
 *   renderTitle / renderCaught / renderWin(ctx, w, h, t, ...) cinematics
 * Unknown entity types fall back to a labelled placeholder, so content can
 * add enemies before art exists.
 */
import { TILE, TILES, OBSTACLES, ENEMIES, ITEMS } from "./content.js";

const TAU = Math.PI * 2;
const PAL = {
  void: "#07060a", blood: "#8b1414", candy: "#ff2a4d", candyDark: "#a3122e", poison: "#7dff4a",
  poisonDark: "#2f7a1a", bulb: "#f6d27a", bulbHot: "#fff3b0", bruise: "#6b2a8f", bruiseDark: "#341447",
  cream: "#efe2c6", teal: "#1f6f78", ink: "#e8dcc4", face: "#f4efe6", pink: "#ff7ad9", cyan: "#7af0ff",
};
const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

function ellipse(ctx, x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
function circle(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
function shadow(ctx, rx, ry = rx * 0.45) { ellipse(ctx, 0, 0, rx, ry, "rgba(0,0,0,.45)"); }

/* ================================================================ tiles (static) */
function noiseFill(ctx, x, y, s, tx, ty, base, specks, n = 14, size = 2) {
  ctx.fillStyle = base; ctx.fillRect(x, y, s, s);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = specks[(hash(tx, ty, i) * specks.length) | 0];
    ctx.fillRect(x + hash(tx, ty, i + 50) * s, y + hash(tx, ty, i + 99) * s, size, size);
  }
}

export const TILE_ART = {
  dirt(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#241a18", ["#2f2320", "#1a1210", "#3a2a22", "#16100e"], 18);
    if (hash(tx, ty, 7) < 0.12) { // footprint
      ctx.fillStyle = "#15100e"; ctx.beginPath(); ctx.ellipse(x + s * 0.4, y + s * 0.5, 3, 5, 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + s * 0.62, y + s * 0.3, 3, 5, 0.3, 0, TAU); ctx.fill();
    }
  },
  boards(ctx, x, y, s, tx, ty) {
    const plank = s / 4;
    for (let i = 0; i < 4; i++) {
      const v = hash(tx, ty, i);
      ctx.fillStyle = v < 0.3 ? "#3b2418" : v < 0.7 ? "#45291b" : "#4f2f1e";
      ctx.fillRect(x, y + i * plank, s, plank - 1);
      ctx.fillStyle = "#1b0f0a"; ctx.fillRect(x, y + i * plank + plank - 1, s, 1);
      ctx.fillStyle = "rgba(255,220,180,.05)"; ctx.fillRect(x, y + i * plank, s, 1);
      const seam = ((tx * 7 + i * 13) % 4) * (s / 4);
      ctx.fillStyle = "#1b0f0a"; ctx.fillRect(x + seam, y + i * plank, 1, plank);
      ctx.fillStyle = "#8a7a6a"; ctx.fillRect(x + seam + 2, y + i * plank + 2, 1, 1);
    }
    if (hash(tx, ty, 3) < 0.07) { ctx.fillStyle = "rgba(139,20,20,.55)"; ctx.beginPath(); ctx.ellipse(x + s * hash(tx, ty, 4), y + s * hash(tx, ty, 5), 6, 3, 0.4, 0, TAU); ctx.fill(); }
    if (hash(tx, ty, 9) < 0.06) { // dropped popcorn
      for (let i = 0; i < 4; i++) circle(ctx, x + hash(tx, ty, 20 + i) * s, y + hash(tx, ty, 30 + i) * s, 1.6, "#f3e7b0");
    }
  },
  grass(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#122013", ["#1a2e17", "#0c170d", "#203a1a", "#2a2a14"], 10);
    ctx.strokeStyle = "#2c4a22"; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const gx = x + hash(tx, ty, i + 200) * s, gy = y + hash(tx, ty, i + 300) * s;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + (hash(tx, ty, i) - 0.5) * 4, gy - 4); ctx.stroke();
    }
    if (hash(tx, ty, 11) < 0.05) { ctx.fillStyle = "#e8dcc4"; ctx.fillRect(x + 12, y + 14, 6, 2); ctx.fillRect(x + 14, y + 12, 2, 6); } // a ticket stub / bone
  },
  sawdust(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#4a3524", ["#5c4430", "#3a2818", "#6b5038", "#2e2016"], 26, 1.5);
    if (hash(tx, ty, 5) < 0.09) { ctx.fillStyle = "rgba(160,20,30,.5)"; ctx.beginPath(); ctx.arc(x + s * hash(tx, ty, 6), y + s * hash(tx, ty, 8), 4, 0, TAU); ctx.fill(); }
  },
  silence(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#2a2a2e", ["#38383e", "#1e1e22", "#45454c"], 16);
    for (let i = 0; i < 3; i++) { // dead bugs, legs up
      if (hash(tx, ty, i + 400) > 0.5) continue;
      const bx = x + hash(tx, ty, i + 410) * s, by = y + hash(tx, ty, i + 420) * s;
      ellipse(ctx, bx, by, 2.2, 1.4, "#0d0d0f");
      ctx.strokeStyle = "#0d0d0f"; ctx.lineWidth = 0.6;
      for (let l = -1; l <= 1; l++) { ctx.beginPath(); ctx.moveTo(bx + l * 1.2, by); ctx.lineTo(bx + l * 1.8, by - 2.4); ctx.stroke(); }
    }
  },
  water(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#0c2a33", ["#0f3a44", "#08202a", "#134652"], 10, 3);
  },
  door(ctx, x, y, s, tx, ty, game) {
    TILE_ART.sawdust(ctx, x, y, s, tx, ty);
    ctx.fillStyle = "#14070a"; ctx.beginPath(); ctx.moveTo(x + 2, y + s); ctx.lineTo(x + s / 2, y - 6); ctx.lineTo(x + s - 2, y + s); ctx.fill();
    ctx.strokeStyle = PAL.candyDark; ctx.lineWidth = 2; ctx.stroke();
  },
  exit(ctx, x, y, s, tx, ty) {
    noiseFill(ctx, x, y, s, tx, ty, "#163016", ["#1f4a1c", "#0f220f", "#2c5a24"], 12);
    ctx.strokeStyle = "rgba(157,255,106,.35)"; ctx.lineWidth = 1; ctx.strokeRect(x + 3.5, y + 3.5, s - 7, s - 7);
  },
  tent(ctx, x, y, s, tx, ty, game) {
    const stripe = s / 4;
    for (let i = 0; i < 4; i++) {
      const red = ((tx * 4 + i) % 2) === 0;
      ctx.fillStyle = red ? "#7a1020" : "#c9b48c"; ctx.fillRect(x + i * stripe, y, stripe, s);
    }
    const g = ctx.createLinearGradient(x, y, x, y + s); g.addColorStop(0, "rgba(0,0,0,.05)"); g.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
    // stains
    if (hash(tx, ty, 1) < 0.3) { ctx.fillStyle = "rgba(40,20,10,.4)"; ctx.beginPath(); ctx.ellipse(x + s * hash(tx, ty, 2), y + s * 0.7, 7, 10, 0, 0, TAU); ctx.fill(); }
    // front lip where the floor begins below
    const below = game && ty + 1 < game.h && !TILES[game.tiles[(ty + 1) * game.w + tx]].solid;
    if (below) {
      ctx.fillStyle = "#2a0a10"; ctx.fillRect(x, y + s - 5, s, 5);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#c9b48c" : "#7a1020"; ctx.beginPath(); ctx.arc(x + i * stripe + stripe / 2, y + s - 5, stripe / 2, 0, Math.PI); ctx.fill(); }
    }
  },
  fence(ctx, x, y, s, tx, ty) {
    TILE_ART.dirt(ctx, x, y, s, tx, ty);
    ctx.fillStyle = "#3d2a1c"; ctx.fillRect(x, y + s * 0.35, s, 4); ctx.fillRect(x, y + s * 0.65, s, 4);
    for (let i = 0; i < 3; i++) {
      const px = x + 3 + i * (s / 3);
      ctx.fillStyle = hash(tx, ty, i) < 0.15 ? "#2a1a10" : "#5a4030"; ctx.fillRect(px, y + 2, 6, s - 4);
      ctx.fillStyle = "#6e5240"; ctx.beginPath(); ctx.moveTo(px, y + 2); ctx.lineTo(px + 3, y - 2); ctx.lineTo(px + 6, y + 2); ctx.fill();
    }
  },
  booth(ctx, x, y, s, tx, ty) {
    const cols = [["#c2183c", "#f2e6c8"], ["#2a8a3a", "#f2e6c8"], ["#6b2a8f", "#f6d27a"], ["#d9822b", "#2a0a10"], ["#1f6f78", "#f2e6c8"]];
    const [a, b] = cols[((tx / 3) | 0) % cols.length];
    ctx.fillStyle = "#2a1810"; ctx.fillRect(x, y, s, s);
    // shelf with prizes (tiny plush heads with button eyes)
    ctx.fillStyle = "#3d2418"; ctx.fillRect(x, y + s * 0.45, s, s * 0.55);
    for (let i = 0; i < 3; i++) {
      const px = x + 5 + i * 10, py = y + s * 0.62;
      const pc = ["#d98fb0", "#a0d0ff", "#f0e08a", "#b08060"][(hash(tx, ty, i) * 4) | 0];
      circle(ctx, px, py, 4, pc); ctx.fillStyle = "#000"; ctx.fillRect(px - 2, py - 1, 1, 1); ctx.fillRect(px + 1, py - 1, 1, 1);
    }
    ctx.fillStyle = "#1b0f0a"; ctx.fillRect(x, y + s - 7, s, 7);
    ctx.fillStyle = "#5a3a26"; ctx.fillRect(x, y + s - 8, s, 2);
    // awning stripes + scallops
    const st = s / 4;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? b : a; ctx.fillRect(x + i * st, y, st, s * 0.38); ctx.beginPath(); ctx.arc(x + i * st + st / 2, y + s * 0.38, st / 2, 0, Math.PI); ctx.fill(); }
    const g = ctx.createLinearGradient(x, y, x, y + s * 0.4); g.addColorStop(0, "rgba(255,255,255,.12)"); g.addColorStop(1, "rgba(0,0,0,.3)");
    ctx.fillStyle = g; ctx.fillRect(x, y, s, s * 0.4);
  },
  tree(ctx, x, y, s, tx, ty, game) {
    TILE_ART.grass(ctx, x, y, s, tx, ty);
    ctx.strokeStyle = "#0a0607"; ctx.lineCap = "round";
    const cx = x + s / 2, cy = y + s / 2;
    for (let i = 0; i < 6; i++) {
      const a = hash(tx, ty, i) * TAU, l = 10 + hash(tx, ty, i + 9) * 12;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy);
      const mx = cx + Math.cos(a) * l * 0.6, my = cy + Math.sin(a) * l * 0.6;
      ctx.lineTo(mx, my); ctx.lineTo(cx + Math.cos(a + 0.4) * l, cy + Math.sin(a + 0.4) * l); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a - 0.7) * 7, my + Math.sin(a - 0.7) * 7); ctx.stroke();
    }
    circle(ctx, cx, cy, 6, "#160c0a");
  },
  lamp(ctx, x, y, s, tx, ty, game) {
    const under = game ? game.level.base : "dirt";
    (TILE_ART[under] || TILE_ART.dirt)(ctx, x, y, s, tx, ty, game);
    ellipse(ctx, x + s / 2, y + s * 0.8, 9, 4, "rgba(0,0,0,.5)");
    ctx.fillStyle = "#1a1a1e"; ctx.fillRect(x + s / 2 - 2, y + 2, 4, s * 0.78);
    ctx.fillStyle = "#2c2c32"; ctx.fillRect(x + s / 2 - 5, y + s * 0.74, 10, 4);
    circle(ctx, x + s / 2, y + 4, 7, PAL.bulb); circle(ctx, x + s / 2, y + 4, 4, PAL.bulbHot);
  },
  mirror(ctx, x, y, s, tx, ty) {
    ctx.fillStyle = "#1a1c24"; ctx.fillRect(x, y, s, s);
    const g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, "#8fb8c8"); g.addColorStop(0.45, "#dff6ff"); g.addColorStop(0.55, "#6f8f9f"); g.addColorStop(1, "#2d4250");
    ctx.fillStyle = g; ctx.fillRect(x + 3, y + 3, s - 6, s - 6);
    // warped silhouette in the glass
    ctx.fillStyle = "rgba(20,10,30,.45)";
    ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.42, 4 + hash(tx, ty) * 4, 7, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * 0.75, 7, 6 + hash(tx, ty, 2) * 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = PAL.bulb; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(x + 6, y + 5, 2, s - 12);
  },
};

/* ================================================================ tiles (animated) */
export const TILE_FX = {
  water(ctx, x, y, s, t) {
    ctx.strokeStyle = "rgba(122,240,255,.18)"; ctx.lineWidth = 1;
    const o = (t * 12 + x * 0.3) % s;
    ctx.beginPath(); ctx.moveTo(x, y + o); ctx.quadraticCurveTo(x + s / 2, y + o - 3, x + s, y + o); ctx.stroke();
  },
  silence(ctx, x, y, s, t) {
    const a = 0.05 + 0.04 * Math.sin(t * 0.8 + x * 0.05 + y * 0.03);
    ctx.fillStyle = `rgba(200,200,230,${a})`; ctx.fillRect(x, y, s, s);
  },
  exit(ctx, x, y, s, t) {
    const a = 0.18 + 0.1 * Math.sin(t * 2 + x * 0.1);
    ctx.fillStyle = `rgba(157,255,106,${a})`; ctx.fillRect(x, y, s, s);
  },
};

export function prerenderLevel(game, scale = 2) {
  const c = document.createElement("canvas");
  c.width = game.w * TILE * scale; c.height = game.h * TILE * scale;
  const ctx = c.getContext("2d"); ctx.scale(scale, scale);
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const name = game.tiles[ty * game.w + tx];
    (TILE_ART[name] || TILE_ART.dirt)(ctx, tx * TILE, ty * TILE, TILE, tx, ty, game);
  }
  // soft shadow cast below solid tiles onto floors
  for (let ty = 0; ty < game.h - 1; ty++) for (let tx = 0; tx < game.w; tx++) {
    const a = TILES[game.tiles[ty * game.w + tx]], b = TILES[game.tiles[(ty + 1) * game.w + tx]];
    if (a.solid && !b.solid) {
      const g = ctx.createLinearGradient(0, (ty + 1) * TILE, 0, (ty + 1) * TILE + 10);
      g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(tx * TILE, (ty + 1) * TILE, TILE, 10);
    }
  }
  // bulb strings along the top edge of tent/booth runs
  const bulbs = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const n = game.tiles[ty * game.w + tx];
    if ((n === "booth" || n === "tent") && ty + 1 < game.h && !TILES[game.tiles[(ty + 1) * game.w + tx]].solid && (tx + ty) % 2 === 0)
      bulbs.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 3, hue: (tx * 3 + ty) % 4, seed: hash(tx, ty, 77) });
  }
  // lights from tiles
  const lights = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const d = TILES[game.tiles[ty * game.w + tx]];
    if (d.light) lights.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE - (game.tiles[ty * game.w + tx] === "lamp" ? 12 : 0), ...d.light, seed: hash(tx, ty, 5) });
  }
  const fxTiles = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) if (TILE_FX[game.tiles[ty * game.w + tx]]) fxTiles.push([tx, ty, game.tiles[ty * game.w + tx]]);
  return { canvas: c, scale, bulbs, lights, fxTiles };
}

/* ================================================================ icons (HUD + pickups) */
export const ICONS = {
  fork(ctx, s) {
    ctx.save(); ctx.rotate(-0.6); const k = s / 32;
    ctx.fillStyle = "#c9c2b0"; ctx.fillRect(-1.5 * k, -2 * k, 3 * k, 16 * k);
    ctx.fillStyle = "#e9e2d0"; ctx.fillRect(-5 * k, -14 * k, 2.4 * k, 12 * k); ctx.fillRect(2.6 * k, -14 * k, 2.4 * k, 12 * k);
    ctx.fillRect(-5 * k, -4 * k, 10 * k, 3 * k);
    ctx.fillStyle = "#c9873f"; ctx.beginPath(); ctx.ellipse(0, 14 * k, 4 * k, 3 * k, 0, 0, TAU); ctx.fill(); // funnel cake crumb
    ctx.fillStyle = "#fff"; for (let i = 0; i < 4; i++) ctx.fillRect((-4 + i * 2.6) * k, (-12 + i * 3) * k, 1.2 * k, 1.2 * k); // sugar
    ctx.restore();
  },
  hat(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#6b3f1a"; ctx.beginPath(); ctx.ellipse(0, 5 * k, 15 * k, 5 * k, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#8c5524"; ctx.beginPath(); ctx.moveTo(-8 * k, 4 * k); ctx.quadraticCurveTo(-9 * k, -10 * k, 0, -8 * k); ctx.quadraticCurveTo(9 * k, -10 * k, 8 * k, 4 * k); ctx.fill();
    ctx.fillStyle = PAL.candy; ctx.fillRect(-8 * k, 0, 16 * k, 3 * k);
    ctx.fillStyle = "#b47838"; ctx.beginPath(); ctx.ellipse(0, 5 * k, 15 * k, 5 * k, 0, Math.PI, TAU); ctx.lineWidth = k; ctx.strokeStyle = "#b47838"; ctx.stroke();
  },
  candy(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#e8dcc4"; ctx.beginPath(); ctx.moveTo(-2 * k, 14 * k); ctx.lineTo(2 * k, 14 * k); ctx.lineTo(1 * k, 0); ctx.lineTo(-1 * k, 0); ctx.fill();
    for (const [x, y, r, c] of [[-5, -6, 7, "#ff9ae0"], [5, -7, 7, "#ff7ad9"], [0, -12, 7, "#ffc2ee"], [0, -4, 6, "#ff5fc8"]]) circle(ctx, x * k, y * k, r * k, c);
    circle(ctx, -3 * k, -9 * k, 1.2 * k, "#000"); circle(ctx, 3 * k, -9 * k, 1.2 * k, "#000"); // it looks at you
  },
  rings(ctx, s) {
    const k = s / 32; ctx.lineWidth = 3 * k;
    for (const [x, y, c] of [[-5, 3, "#7af0ff"], [5, 3, "#ff2a4d"], [0, -5, "#f6d27a"]]) { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x * k, y * k, 7 * k, 0, TAU); ctx.stroke(); }
  },
  popcorn(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#fff8d8";
    for (let i = 0; i < 7; i++) circle(ctx, (-8 + (i % 4) * 5.5) * k, (-9 + ((i / 4) | 0) * 4 + (i % 2) * 2) * k, 4 * k, i % 3 ? "#fff8d8" : "#ffe58a");
    ctx.fillStyle = "#e8e0d0"; ctx.beginPath(); ctx.moveTo(-10 * k, -6 * k); ctx.lineTo(10 * k, -6 * k); ctx.lineTo(7 * k, 14 * k); ctx.lineTo(-7 * k, 14 * k); ctx.fill();
    ctx.fillStyle = PAL.candy; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo((-8 + i * 6) * k, -6 * k); ctx.lineTo((-5 + i * 6) * k, -6 * k); ctx.lineTo((-4 + i * 5) * k, 14 * k); ctx.lineTo((-6 + i * 5) * k, 14 * k); ctx.fill(); }
  },
  mallet(ctx, s) {
    ctx.save(); ctx.rotate(0.6); const k = s / 32;
    ctx.fillStyle = "#c9a070"; ctx.fillRect(-1.6 * k, -4 * k, 3.2 * k, 19 * k);
    ctx.fillStyle = PAL.candy; ctx.fillRect(-10 * k, -14 * k, 20 * k, 11 * k);
    ctx.fillStyle = "#fff"; ctx.fillRect(-10 * k, -10 * k, 20 * k, 3 * k);
    ctx.fillStyle = "#5a0a14"; ctx.fillRect(-10 * k, -14 * k, 3 * k, 11 * k); ctx.fillRect(7 * k, -14 * k, 3 * k, 11 * k);
    ctx.restore();
  },
  apple(ctx, s) {
    const k = s / 32;
    ctx.fillStyle = "#c9a070"; ctx.fillRect(-1 * k, -16 * k, 2 * k, 8 * k);
    circle(ctx, 0, 0, 10 * k, "#d0102a"); circle(ctx, -3 * k, -3 * k, 3.5 * k, "rgba(255,255,255,.35)");
    ctx.fillStyle = "#7a0010"; ctx.beginPath(); ctx.ellipse(0, 9 * k, 9 * k, 3 * k, 0, 0, Math.PI); ctx.fill();
  },
  lantern(ctx, s, t = 0) {
    const k = s / 32;
    ctx.fillStyle = "#2a2a2a"; ctx.fillRect(-6 * k, -13 * k, 12 * k, 3 * k);
    ctx.fillStyle = "rgba(198,255,106,.25)"; ctx.fillRect(-8 * k, -10 * k, 16 * k, 20 * k);
    ctx.strokeStyle = "#9c8f78"; ctx.lineWidth = k; ctx.strokeRect(-8 * k, -10 * k, 16 * k, 20 * k);
    for (let i = 0; i < 4; i++) circle(ctx, Math.sin(t * 2 + i * 2) * 5 * k, (Math.cos(t * 1.7 + i) * 6) * k, 1.6 * k, "#e8ff8a");
  },
};

/* ================================================================ figures */
function clownHead(ctx, x, y, r, t, e, opts = {}) {
  // hair tufts
  const hair = opts.hair || PAL.candy;
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) circle(ctx, x + sx * (r * 0.95 + i * 1.5), y - r * 0.2 + i * 3 - 3, r * 0.42, hair);
  // face
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  g.addColorStop(0, "#fffdf6"); g.addColorStop(1, "#cfc6b4");
  circle(ctx, x, y, r, g);
  // eyes: black hollows, tiny pupils that glow when hunting
  const alert = e && e.alert > 0;
  for (const sx of [-1, 1]) {
    ctx.fillStyle = "#120a10"; ctx.beginPath(); ctx.ellipse(x + sx * r * 0.38, y - r * 0.18, r * 0.24, r * 0.32, sx * 0.3, 0, TAU); ctx.fill();
    circle(ctx, x + sx * r * 0.36, y - r * 0.16, r * 0.07, alert ? PAL.bulbHot : "#555");
    ctx.strokeStyle = "#3a6bd9"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + sx * r * 0.38, y - r * 0.6); ctx.lineTo(x + sx * r * 0.38, y - r * 0.85); ctx.stroke();
  }
  // grin
  const w = opts.grin || 0.75;
  ctx.fillStyle = "#b0102a"; ctx.beginPath();
  ctx.moveTo(x - r * w, y + r * 0.12); ctx.quadraticCurveTo(x, y + r * 1.05, x + r * w, y + r * 0.12);
  ctx.quadraticCurveTo(x, y + r * 0.55, x - r * w, y + r * 0.12); ctx.fill();
  ctx.fillStyle = "#1a0306"; ctx.beginPath();
  ctx.moveTo(x - r * w * 0.8, y + r * 0.22); ctx.quadraticCurveTo(x, y + r * 0.85, x + r * w * 0.8, y + r * 0.22);
  ctx.quadraticCurveTo(x, y + r * 0.5, x - r * w * 0.8, y + r * 0.22); ctx.fill();
  ctx.fillStyle = "#f4ead0";
  for (let i = -3; i <= 3; i++) { const tx = x + i * r * 0.17; ctx.fillRect(tx - r * 0.06, y + r * 0.34 + Math.abs(i) * -r * 0.035, r * 0.12, r * 0.14); }
  circle(ctx, x, y + r * 0.06, r * 0.18, PAL.candy); circle(ctx, x - r * 0.05, y, r * 0.06, "rgba(255,255,255,.6)");
}

function stunStars(ctx, y, t, n = 3) {
  for (let i = 0; i < n; i++) {
    const a = t * 5 + (i * TAU) / n;
    const x = Math.cos(a) * 12, yy = y + Math.sin(a) * 4;
    ctx.fillStyle = i % 2 ? PAL.bulb : PAL.pink;
    ctx.save(); ctx.translate(x, yy); ctx.rotate(a); ctx.fillRect(-2.5, -0.8, 5, 1.6); ctx.fillRect(-0.8, -2.5, 1.6, 5); ctx.restore();
  }
}

function hitTint(ctx, e, draw) {
  draw();
  if (e.hitFlash > 0) { ctx.globalCompositeOperation = "source-atop"; ctx.globalAlpha = 0.5; draw(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }
}

export const ENTITY_ART = {
  player(ctx, p, t, view) {
    const bob = p.moving ? Math.sin(p.step * 2) * 1.5 : Math.sin(t * 2) * 0.5;
    const fx = Math.cos(p.face), fy = Math.sin(p.face);
    shadow(ctx, 10);
    if (p.invuln > 0 && !p.dashT) ctx.globalAlpha = 0.6;
    if (p.dashT > 0) { // dash streak
      ctx.fillStyle = "rgba(122,240,255,.25)";
      for (let i = 1; i <= 3; i++) circle(ctx, -fx * i * 7, -14 - fy * i * 7, 8 - i, "rgba(122,240,255," + (0.3 - i * 0.07) + ")");
    }
    // legs
    const l = p.moving ? Math.sin(p.step * 2) * 3 : 0;
    ctx.fillStyle = "#1c1820"; ctx.fillRect(-5, -8 + l * 0.3, 4, 8 - l * 0.3); ctx.fillRect(1, -8 - l * 0.3, 4, 8 + l * 0.3);
    // coat
    ctx.fillStyle = "#2f5560"; ctx.beginPath(); ctx.moveTo(-8, -6 + bob); ctx.lineTo(8, -6 + bob); ctx.lineTo(6, -22 + bob); ctx.lineTo(-6, -22 + bob); ctx.fill();
    ctx.fillStyle = "#3e6e7a"; ctx.fillRect(-1, -22 + bob, 2, 16);
    // scarf
    ctx.fillStyle = "#b8862b"; ctx.fillRect(-6, -23 + bob, 12, 3);
    // head
    circle(ctx, 0, -28 + bob, 6.5, "#e9c9a8");
    ctx.fillStyle = "#3a2418"; ctx.beginPath(); ctx.arc(0, -29 + bob, 6.8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    // eyes look where you face (wide with fear)
    if (fy > -0.6) { circle(ctx, -2.4 + fx * 1.6, -28 + bob + fy, 1.3, "#fff"); circle(ctx, 2.4 + fx * 1.6, -28 + bob + fy, 1.3, "#fff"); circle(ctx, -2.4 + fx * 2, -28 + bob + fy * 1.2, 0.6, "#000"); circle(ctx, 2.4 + fx * 2, -28 + bob + fy * 1.2, 0.6, "#000"); }
    // lantern hand (opposite to weapon)
    const lx = -fy * 9 - fx * 2, ly = -14 + fx * 4 + bob;
    ctx.fillStyle = "#2a2a2a"; ctx.fillRect(lx - 2.5, ly - 4, 5, 2);
    circle(ctx, lx, ly, 3.2, "rgba(246,210,122,.9)");
    // held weapon / swing arc
    const held = view && view.heldWeapon;
    if (p.swing > 0) {
      const k = p.swing / 0.25, arc = p.swingArc || 1.2, R = (p.swingRange || 50) * 0.9;
      ctx.strokeStyle = `rgba(255,243,176,${0.6 * k})`; ctx.lineWidth = 5 * k + 1;
      ctx.beginPath(); ctx.arc(0, -14, R, p.face - arc / 2, p.face + arc / 2); ctx.stroke();
    }
    if (held && ICONS[held]) {
      const reach = p.swing > 0 ? 18 : 10;
      ctx.save(); ctx.translate(fx * reach + fy * 4, -14 + fy * reach * 0.7 + bob); ctx.rotate(p.face + Math.PI / 2 * 0.3);
      ICONS[held](ctx, 18, t); ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
  grinner(ctx, e, t, view) {
    const sway = Math.sin(e.t * 6) * (Math.hypot(e.vx, e.vy) > 20 ? 2.5 : 0.6);
    shadow(ctx, 13);
    hitTint(ctx, e, () => {
      ctx.save(); if (e.stun > 0) ctx.rotate(Math.sin(t * 9) * 0.12);
      // big shoes
      ellipse(ctx, -6 + sway * 0.4, -2, 7, 3.5, "#b0102a"); ellipse(ctx, 6 - sway * 0.4, -2, 7, 3.5, "#b0102a");
      // baggy suit: diamonds of poison green and bruise purple
      ctx.fillStyle = PAL.poisonDark; ctx.beginPath(); ctx.moveTo(-11, -4); ctx.quadraticCurveTo(-14, -20, -8, -30); ctx.lineTo(8, -30); ctx.quadraticCurveTo(14, -20, 11, -4); ctx.fill();
      ctx.fillStyle = PAL.bruise;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const dx = -6 + j * 12 - (i % 2) * 6 + 3, dy = -8 - i * 8; ctx.beginPath(); ctx.moveTo(dx, dy - 4); ctx.lineTo(dx + 4, dy); ctx.lineTo(dx, dy + 4); ctx.lineTo(dx - 4, dy); ctx.fill(); }
      circle(ctx, 0, -18, 1.8, PAL.bulb); circle(ctx, 0, -12, 1.8, PAL.bulb);
      // arms reaching forward when hunting
      const reach = e.alert > 0 && e.stun <= 0 ? 1 : 0.3;
      ctx.strokeStyle = PAL.poisonDark; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-9, -26); ctx.lineTo(-13, -14 - reach * 8 + sway); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -26); ctx.lineTo(13, -14 - reach * 8 - sway); ctx.stroke();
      circle(ctx, -13, -14 - reach * 8 + sway, 3.4, "#fff"); circle(ctx, 13, -14 - reach * 8 - sway, 3.4, "#fff");
      // ruff collar
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; circle(ctx, Math.cos(a) * 9, -31 + Math.sin(a) * 3, 3.5, i % 2 ? "#fff" : PAL.candy); }
      clownHead(ctx, 0, -42, 10, t, e);
      if (e.stun > 0) stunStars(ctx, -56, t);
      ctx.restore();
    });
  },
  stilt(ctx, e, t) {
    const stride = Math.sin(e.t * 7) * (Math.hypot(e.vx, e.vy) > 20 ? 5 : 0.5);
    shadow(ctx, 16, 5);
    hitTint(ctx, e, () => {
      ctx.save(); if (e.stun > 0) ctx.rotate(Math.sin(t * 6) * 0.18);
      // stilts striped
      for (const [sx, off] of [[-5, stride], [5, -stride]]) {
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#f2e6c8" : PAL.candy; ctx.fillRect(sx - 2 + off * (i / 6), -6 - i * 7, 4, 7); }
      }
      // long coat
      ctx.fillStyle = PAL.bruiseDark; ctx.beginPath(); ctx.moveTo(-10, -42); ctx.lineTo(10, -42); ctx.lineTo(7, -68); ctx.lineTo(-7, -68); ctx.fill();
      ctx.fillStyle = PAL.bulb; for (let i = 0; i < 3; i++) circle(ctx, 0, -48 - i * 6, 1.5, PAL.bulb);
      ctx.strokeStyle = PAL.bruiseDark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, -64); ctx.lineTo(-16, -48 + stride); ctx.moveTo(7, -64); ctx.lineTo(16, -48 - stride); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circle(ctx, Math.cos(a) * 7, -69 + Math.sin(a) * 2.5, 3, i % 2 ? PAL.poison : "#fff"); }
      // tiny top hat
      clownHead(ctx, 0, -78, 8, t, e, { hair: PAL.poison, grin: 0.85 });
      ctx.fillStyle = "#111"; ctx.fillRect(-6, -96, 12, 9); ctx.fillRect(-9, -88, 18, 2);
      ctx.fillStyle = PAL.candy; ctx.fillRect(-6, -90, 12, 2);
      if (e.stun > 0) stunStars(ctx, -100, t);
      ctx.restore();
    });
  },
  mime(ctx, e, t) {
    shadow(ctx, 11);
    const moving = !e.frozen && Math.hypot(e.vx, e.vy) > 20;
    hitTint(ctx, e, () => {
      ctx.save(); if (e.stun > 0) ctx.rotate(Math.sin(t * 9) * 0.12);
      if (moving) ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#0b0b0e"; ctx.fillRect(-5, -10, 4, 10); ctx.fillRect(1, -10, 4, 10);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#0b0b0e" : "#f2f2f2"; ctx.fillRect(-8, -12 - i * 3.6, 16, 3.6); }
      // arms: frozen in a pose (pressing on an invisible wall)
      ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-7, -26); ctx.lineTo(e.frozen ? -12 : -10, e.frozen ? -38 : -18); ctx.moveTo(7, -26); ctx.lineTo(e.frozen ? 12 : 10, e.frozen ? -38 : -18); ctx.stroke();
      circle(ctx, e.frozen ? -12 : -10, e.frozen ? -39 : -17, 3, "#fff"); circle(ctx, e.frozen ? 12 : 10, e.frozen ? -39 : -17, 3, "#fff");
      // face: white, black teardrops, a thin red line mouth
      ctx.beginPath(); ctx.ellipse(0, -36, 7.5, 9, 0, 0, TAU); ctx.fillStyle = "#f7f5f0"; ctx.fill();
      ctx.fillStyle = "#000"; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 3, -38, 1.6, 2.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx * 3 - 1, -35); ctx.lineTo(sx * 3, -31); ctx.lineTo(sx * 3 + 1, -35); ctx.fill(); }
      ctx.strokeStyle = PAL.candy; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -31); ctx.quadraticCurveTo(0, e.frozen ? -30 : -28, 3, -31); ctx.stroke();
      ctx.fillStyle = "#0b0b0e"; ctx.beginPath(); ctx.ellipse(1, -45, 8, 3, -0.2, 0, TAU); ctx.fill(); circle(ctx, 4, -47, 1.5, "#0b0b0e");
      if (e.stun > 0) stunStars(ctx, -52, t);
      ctx.restore();
    });
  },
  rabbit(ctx, e, t) {
    const air = Math.max(0, Math.hypot(e.vx, e.vy) - 40) / 400;
    shadow(ctx, 10 - air * 3);
    hitTint(ctx, e, () => {
      ctx.save(); ctx.translate(0, -air * 14); if (e.stun > 0) ctx.rotate(Math.sin(t * 9) * 0.2);
      const dir = Math.cos(e.face) >= 0 ? 1 : -1; ctx.scale(dir, 1);
      // too many legs
      ctx.strokeStyle = "#b88a8a"; ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { const lx = -7 + i * 2.8, w = Math.sin(t * 14 + i) * 2; ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx + w - 2, 0); ctx.stroke(); }
      // lumpy body
      ellipse(ctx, 0, -9, 11, 7, "#d9b8b0"); circle(ctx, -6, -11, 4, "#e6c8c0"); circle(ctx, 5, -13, 3, "#c49890");
      ctx.fillStyle = "#8b1414"; ctx.fillRect(-2, -12, 1, 3); // stitches
      ctx.fillStyle = "#fff"; circle(ctx, -11, -9, 3, "#f0e0dc"); // tail
      // head
      circle(ctx, 9, -16, 6, "#e6c8c0");
      // ears, one torn
      ctx.fillStyle = "#e6c8c0"; ctx.beginPath(); ctx.ellipse(6, -27, 2.2, 8, -0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(11, -24, 2.2, 6, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#c46a7a"; ctx.beginPath(); ctx.ellipse(6, -27, 1, 6, -0.2, 0, TAU); ctx.fill();
      // red eyes (three)
      circle(ctx, 10, -18, 1.5, "#ff1a1a"); circle(ctx, 13, -16, 1.1, "#ff1a1a"); circle(ctx, 8, -15, 0.9, "#ff1a1a");
      // teeth
      ctx.fillStyle = "#3a0a0a"; ctx.beginPath(); ctx.ellipse(13, -12, 3.5, 2.4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff"; for (let i = 0; i < 4; i++) ctx.fillRect(10.5 + i * 1.4, -13.5, 1, 2);
      if (e.stun > 0) stunStars(ctx, -30, t, 2);
      ctx.restore();
    });
  },
  teacup(ctx, e, t) {
    ellipse(ctx, 0, 4, 30, 14, "rgba(0,0,0,.45)");
    ellipse(ctx, 0, 0, 30, 15, "#e8dcc4"); ellipse(ctx, 0, -1, 26, 12, "#c9b48c");
    ctx.save(); ctx.rotate((e.spin || 0) * 0.15);
    ctx.restore();
    // cup body
    ctx.fillStyle = "#ff5fa2"; ctx.beginPath(); ctx.ellipse(0, -10, 22, 11, 0, 0, Math.PI); ctx.lineTo(-22, -10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-22, -10); ctx.quadraticCurveTo(-20, 8, 0, 8); ctx.quadraticCurveTo(20, 8, 22, -10); ctx.fill();
    // polka dots rotating around
    for (let i = 0; i < 6; i++) { const a = (e.spin || 0) + (i * TAU) / 6; const c = Math.cos(a); if (c < -0.2) continue; circle(ctx, Math.sin(a) * 18, -3, 2.5 * (0.5 + c / 2), "#fff2a8"); }
    ellipse(ctx, 0, -10, 22, 8, "#5a1030"); ellipse(ctx, 0, -10, 18, 6, "#2a0614");
    // handle
    const ha = (e.spin || 0) % TAU; const hx = Math.sin(ha) * 24;
    ctx.strokeStyle = "#ff5fa2"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(hx, -4, 5, 0, TAU); ctx.stroke();
    // someone is still riding: a slumped silhouette, one eye
    ellipse(ctx, 2, -14, 7, 5, "#100308"); circle(ctx, 4, -15, 1.3, PAL.bulbHot);
  },
  horse(ctx, e, t) {
    const bob = (e.bob || 0) * 5;
    shadow(ctx, 14);
    ctx.fillStyle = "#c9a54a"; ctx.fillRect(-1.5, -64, 3, 64); // pole
    circle(ctx, 0, -64, 3, PAL.bulb);
    ctx.save(); ctx.translate(0, -24 + bob);
    const dir = Math.cos(e.phase + Math.PI / 2) >= 0 ? 1 : -1; ctx.scale(dir, 1);
    ctx.strokeStyle = "#e8dcc4"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-12, 14); ctx.moveTo(8, 4); ctx.lineTo(13, 12); ctx.stroke();
    ellipse(ctx, 0, 0, 14, 7, "#efe6d6");
    ctx.fillStyle = PAL.candy; ctx.fillRect(-6, -7, 10, 5); // saddle
    ctx.fillStyle = PAL.bulb; ctx.fillRect(-6, -2, 10, 2);
    ctx.fillStyle = "#efe6d6"; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(16, -16); ctx.lineTo(22, -12); ctx.lineTo(14, 0); ctx.fill();
    ctx.fillStyle = "#6b2a8f"; for (let i = 0; i < 4; i++) circle(ctx, 11 + i * 2, -6 - i * 3, 2.2, "#6b2a8f"); // mane
    // open mouth with real teeth
    ctx.fillStyle = "#3a0606"; ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(25, -9); ctx.lineTo(20, -8); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(20, -11, 1, 2); ctx.fillRect(22, -10, 1, 2);
    circle(ctx, 17, -14, 1.5, "#000"); circle(ctx, 17.3, -14.3, 0.5, "#ff2a2a");
    ctx.restore();
  },
  cookie(ctx, e, t) {
    const b = Math.sin(t * 2.5 + e.id) * 2;
    shadow(ctx, 9);
    ctx.save(); ctx.translate(0, -10 + b);
    circle(ctx, 0, 0, 10, "#9a6a34"); circle(ctx, 0, 0, 8.5, "#b8823e");
    for (let i = 0; i < 5; i++) circle(ctx, Math.cos(i * 2.3) * 5, Math.sin(i * 2.3) * 5, 1.4, "#3a1e0c");
    // icing face — your face
    ctx.strokeStyle = "#e8d8ff"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(-3, -2, 1.5, 0, TAU); ctx.moveTo(4.5, -2); ctx.arc(3, -2, 1.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 2, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  },
  dunk(ctx, e, t) {
    ellipse(ctx, 0, 6, 24, 9, "rgba(0,0,0,.4)");
    ctx.fillStyle = "rgba(95,208,255,.25)"; ctx.fillRect(-18, -30, 36, 34);
    ctx.strokeStyle = "#c9c9d6"; ctx.lineWidth = 2; ctx.strokeRect(-18, -30, 36, 34);
    ctx.fillStyle = "rgba(20,80,110,.7)"; ctx.fillRect(-17, -16 + Math.sin(t * 2) * 1.5, 34, 19);
    // a hand pressed to the glass, slowly sliding
    const hy = -12 + Math.sin(t * 0.7) * 4;
    ctx.fillStyle = "#c8d8d0"; ctx.beginPath(); ctx.ellipse(-4, hy, 4, 5, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) ctx.fillRect(-7 + i * 2, hy - 10, 1.4, 6);
    // seat plank + target arm
    ctx.fillStyle = "#5a4030"; ctx.fillRect(-18, -32, 36, 4);
    ctx.strokeStyle = "#8a8a96"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, -20); ctx.lineTo(30, -20); ctx.stroke();
    circle(ctx, 32, -20, 7, "#fff"); circle(ctx, 32, -20, 5, PAL.candy); circle(ctx, 32, -20, 2.5, "#fff");
  },
  searchlight(ctx, e, t) {
    shadow(ctx, 10);
    ctx.fillStyle = "#2a2a30"; ctx.fillRect(-6, -10, 12, 10);
    ctx.save(); ctx.translate(0, -12); ctx.rotate(e.ang);
    ctx.fillStyle = "#3a3a44"; ctx.fillRect(-6, -6, 14, 12); circle(ctx, 8, 0, 6, e.lit ? "#fff" : PAL.bulbHot);
    ctx.restore();
  },
  snare(ctx, e, t) {
    const life = 1 - (e.age || 0) / 6;
    ctx.globalAlpha = Math.min(1, life * 2) * 0.85;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + t * 0.3, r = 26 + Math.sin(t * 2 + i) * 4;
      circle(ctx, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.55, 13, i % 2 ? "#ff9ae0" : "#ffc2ee");
    }
    circle(ctx, 0, 0, 18, "#ffb3ea");
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(0, 0, 8 + i * 6, t + i, t + i + 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },
  spawner(ctx, e, t) {
    if (!(e.open > 0)) {
      // eyes in the dark of the flap, occasionally
      if (Math.sin(t * 0.7 + e.id) > 0.85) { circle(ctx, -3, -14, 1.2, PAL.bulbHot); circle(ctx, 3, -14, 1.2, PAL.bulbHot); }
      return;
    }
    ctx.globalAlpha = Math.min(1, e.open);
    ellipse(ctx, 0, -8, 14, 18, "rgba(255,42,77,.25)");
    ctx.globalAlpha = 1;
  },
  pickup(ctx, e, t) {
    const b = Math.sin(t * 3 + e.bob) * 3;
    ellipse(ctx, 0, 0, 10, 4, "rgba(0,0,0,.45)");
    const g = ctx.createRadialGradient(0, -14 + b, 2, 0, -14 + b, 20);
    const col = (e.def && e.def.color) || "#f6d27a";
    g.addColorStop(0, col + "88"); g.addColorStop(1, col + "00");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -14 + b, 20, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(0, -14 + b);
    const id = e.weapon || e.item;
    if (ICONS[id]) ICONS[id](ctx, 22, t);
    else circle(ctx, 0, 0, 6, col);
    ctx.restore();
    if (e.weapon) { // sparkle
      const a = t * 2 + e.bob; ctx.fillStyle = "#fff"; ctx.fillRect(Math.cos(a) * 12, -14 + b + Math.sin(a) * 8, 1.5, 1.5);
    }
  },
  hat(ctx, e) { ctx.save(); ctx.translate(0, -10); ctx.rotate(e.rot); ICONS.hat(ctx, 22); ctx.restore(); },
  ring(ctx, e) { ctx.strokeStyle = PAL.cyan; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -10, 7, 5, 0, 0, TAU); ctx.stroke(); },
  candy(ctx, e, t) { ctx.save(); ctx.translate(0, -10 - Math.sin((e.age / e.life) * Math.PI) * 18); circle(ctx, 0, 0, 8, "#ff9ae0"); circle(ctx, -3, -3, 4, "#ffc2ee"); ctx.restore(); },
};

function placeholder(ctx, e) {
  shadow(ctx, e.r || 10);
  circle(ctx, 0, -(e.r || 10), e.r || 10, e.cat === "enemy" ? PAL.candy : PAL.bruise);
  ctx.fillStyle = "#fff"; ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillText(e.type, 0, -(e.r || 10) * 2 - 4);
}

/* ================================================================ fx state */
export const fx = { parts: [], words: [], shake: 0, flash: 0, flashColor: "#ff0000", lastFlash: -9, time: 0 };
const WORDS = ["HONK!", "BONK!", "SQUEAK!", "WHAP!", "HONK!"];
function burstParts(x, y, n, opt) {
  for (let i = 0; i < n; i++) {
    const a = opt.angle != null ? opt.angle + (Math.random() - 0.5) * (opt.spread || 1) : Math.random() * TAU;
    const sp = (opt.speed || 120) * (0.4 + Math.random() * 0.8);
    fx.parts.push({ x, y, z: opt.z ?? 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: opt.vz ?? 60 + Math.random() * 80,
      life: (opt.life || 0.8) * (0.6 + Math.random() * 0.6), age: 0, size: opt.size || 2.5, color: Array.isArray(opt.color) ? opt.color[(Math.random() * opt.color.length) | 0] : opt.color,
      kind: opt.kind || "dot", rot: Math.random() * TAU, grav: opt.grav ?? 260 });
  }
}
function flash(color, strength, view) {
  // never more than ~2.5 flashes per second (photosensitivity)
  if (fx.time - fx.lastFlash < 0.4) return;
  fx.lastFlash = fx.time; fx.flashColor = color; fx.flash = view && view.reduced ? strength * 0.4 : strength;
}
function shake(m, view) { if (view && view.reduced) return; fx.shake = Math.min(14, fx.shake + m); }
function word(x, y, text, color) { fx.words.push({ x, y, text, color, age: 0, life: 0.9 }); }

export function onEvent(ev, view) {
  switch (ev.type) {
    case "hit":
      burstParts(ev.x, ev.y, 14, { color: [PAL.candy, PAL.bulb, PAL.poison, PAL.pink, PAL.cyan], kind: "confetti", speed: 160, life: 1 });
      shake(ev.force > 600 ? 7 : 3, view);
      if (Math.random() < 0.55) word(ev.x, ev.y - 50, WORDS[(Math.random() * WORDS.length) | 0], PAL.bulb);
      break;
    case "ding": word(ev.x, ev.y - 60, "DING!", PAL.candy); shake(6, view); break;
    case "hurt":
      burstParts(ev.x, ev.y, 12, { color: ["#8b1414", "#c41a2a", "#5a0a10"], speed: 140, life: 0.7 });
      shake(9, view); flash("#c4102a", 0.45, view); break;
    case "grab": word(ev.x, ev.y - 56, "gotcha", "#ffb3c0"); break;
    case "swing": break;
    case "throw": burstParts(ev.x + Math.cos(ev.face) * 14, ev.y + Math.sin(ev.face) * 14, 4, { color: "#fff", speed: 60, life: 0.3 }); break;
    case "burst":
      burstParts(ev.x, ev.y, 46, { color: ["#fff8d8", "#ffe58a", "#fff"], kind: "popcorn", speed: 280, life: 1.2, size: 3.5 });
      fx.parts.push({ x: ev.x, y: ev.y, z: 0, vx: 0, vy: 0, vz: 0, life: 0.5, age: 0, size: ev.radius, color: "#fff8d8", kind: "ring", grav: 0 });
      flash("#fff6d0", 0.55, view); shake(8, view); break;
    case "pickup": burstParts(ev.x, ev.y, 16, { color: [PAL.bulb, PAL.bulbHot, "#fff"], kind: "spark", speed: 90, life: 0.8 }); break;
    case "break": burstParts(ev.x, ev.y, 10, { color: ["#9c8f78", "#5a4030"], speed: 120, life: 0.6 }); word(ev.x, ev.y - 50, "snap", "#9c8f78"); break;
    case "spawn": burstParts(ev.x, ev.y, 18, { color: [PAL.candy, "#2a0a10"], kind: "confetti", speed: 120 }); break;
    case "cookie": burstParts(ev.x, ev.y, 20, { color: ["#b46cff", "#3a1e0c"], speed: 100 }); flash("#6b2a8f", 0.4, view); break;
    case "splash": burstParts(ev.x, ev.y, 24, { color: ["#5fd0ff", "#c8f4ff"], speed: 150, vz: 160 }); shake(4, view); break;
    case "mirror": flash("#bfefff", 0.3, view); burstParts(ev.x, ev.y, 10, { color: ["#dff6ff", "#8fb8c8"], kind: "spark", speed: 80 }); break;
    case "marked": flash("#f6d27a", 0.25, view); break;
    case "dash": burstParts(ev.x, ev.y, 6, { color: "rgba(122,240,255,.8)", speed: 40, life: 0.35, angle: ev.face + Math.PI, spread: 0.8 }); break;
    case "hop": burstParts(ev.x, ev.y, 3, { color: "#3a2a22", speed: 30, life: 0.4, vz: 20 }); break;
    case "projEnd": if (ev.proj === "candy") burstParts(ev.x, ev.y, 12, { color: ["#ff9ae0", "#ffc2ee"], speed: 70 }); break;
    case "caught": shake(12, view); break;
  }
}

function updateFx(dt) {
  fx.time += dt;
  fx.shake = Math.max(0, fx.shake - dt * 30);
  fx.flash = Math.max(0, fx.flash - dt * 2.2);
  for (const p of fx.parts) {
    p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96;
    p.vz -= p.grav * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; }
    p.rot += dt * 8;
  }
  fx.parts = fx.parts.filter((p) => p.age < p.life);
  if (fx.parts.length > 600) fx.parts.splice(0, fx.parts.length - 600);
  for (const w of fx.words) w.age += dt;
  fx.words = fx.words.filter((w) => w.age < w.life);
}

function drawParts(ctx) {
  for (const p of fx.parts) {
    const a = 1 - p.age / p.life;
    ctx.globalAlpha = Math.max(0, a);
    if (p.kind === "ring") {
      ctx.strokeStyle = p.color; ctx.lineWidth = 6 * a; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size * (1 - a * 0.7), p.size * 0.6 * (1 - a * 0.7), 0, 0, TAU); ctx.stroke();
    } else if (p.kind === "confetti") {
      ctx.save(); ctx.translate(p.x, p.y - p.z); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); ctx.restore();
    } else if (p.kind === "popcorn") {
      circle(ctx, p.x, p.y - p.z, p.size, p.color); circle(ctx, p.x + 1.5, p.y - p.z - 1, p.size * 0.6, "#fff");
    } else if (p.kind === "spark") {
      ctx.fillStyle = p.color; ctx.fillRect(p.x - 1, p.y - p.z - 3, 2, 6); ctx.fillRect(p.x - 3, p.y - p.z - 1, 6, 2);
    } else { circle(ctx, p.x, p.y - p.z, p.size, p.color); }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.font = "bold 15px 'IM Fell English SC', Georgia, serif";
  for (const w of fx.words) {
    const k = w.age / w.life, s = 1 + Math.min(1, w.age * 8) * 0.3 - k * 0.2;
    ctx.save(); ctx.translate(w.x, w.y - k * 24); ctx.scale(s, s); ctx.rotate(-0.12);
    ctx.globalAlpha = 1 - k * k; ctx.lineWidth = 4; ctx.strokeStyle = "#1a0306"; ctx.strokeText(w.text, 0, 0); ctx.fillStyle = w.color; ctx.fillText(w.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ================================================================ lighting */
let lightCanvas = null;
function flick(seed, t, amt) {
  if (!amt) return 1;
  // smooth, irregular flicker; deliberately slow (no strobing)
  return 1 - amt * (0.5 + 0.5 * Math.sin(t * 2.3 + seed * 40) * Math.sin(t * 0.9 + seed * 17));
}

function collectLights(game, pre, t) {
  const L = [];
  for (const l of pre.lights) L.push({ x: l.x, y: l.y, r: l.r * flick(l.seed, t, l.flicker), color: l.color });
  for (const b of pre.bulbs) if (Math.sin(t * 0.4 + b.seed * 50) > -0.7) L.push({ x: b.x, y: b.y, r: 46, color: ["#f6d27a", "#ff2a4d", "#7dff4a", "#b46cff"][b.hue], soft: true });
  for (const e of game.entities) {
    const lt = e.def && e.def.light;
    if (lt) L.push({ x: e.x, y: e.y - 10, r: lt.r * flick(e.id * 0.13, t, lt.flicker), color: lt.color });
    if (e.cat === "pickup") L.push({ x: e.x, y: e.y - 14, r: 46, color: (e.def && e.def.color) || PAL.bulb, soft: true });
    if (e.type === "searchlight") L.push({ x: e.x, y: e.y, r: 0, cone: true, ang: e.ang, len: e.len, color: PAL.bulbHot });
    if (e.cat === "enemy" && e.alert > 0) L.push({ x: e.x, y: e.y - 40, r: 26, color: "#ff2a4d", soft: true });
  }
  const p = game.player, s = game.run.sanity / 100;
  L.push({ x: p.x, y: p.y - 14, r: 95 + 85 * s, color: "#f6d27a", player: true });
  return L;
}

function drawLighting(ctx, game, cam, pre, t, W, H, view) {
  const scale = 0.5;
  const lw = Math.ceil(W * scale), lh = Math.ceil(H * scale);
  if (!lightCanvas) lightCanvas = document.createElement("canvas");
  if (lightCanvas.width !== lw || lightCanvas.height !== lh) { lightCanvas.width = lw; lightCanvas.height = lh; }
  const lc = lightCanvas.getContext("2d");
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.globalCompositeOperation = "source-over";
  const amb = game.level.ambient ?? 0.85;
  lc.fillStyle = `rgba(4,2,8,${amb})`; lc.fillRect(0, 0, lw, lh);
  lc.setTransform(cam.zoom * scale, 0, 0, cam.zoom * scale, -cam.x * cam.zoom * scale, -cam.y * cam.zoom * scale);
  lc.globalCompositeOperation = "destination-out";
  const lights = collectLights(game, pre, t);
  const vx0 = cam.x - 200, vy0 = cam.y - 200, vx1 = cam.x + W / cam.zoom + 200, vy1 = cam.y + H / cam.zoom + 200;
  for (const l of lights) {
    if (l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    if (l.cone) {
      lc.save(); lc.translate(l.x, l.y - 12); lc.rotate(l.ang);
      const g = lc.createLinearGradient(0, 0, l.len, 0); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
      lc.fillStyle = g; lc.beginPath(); lc.moveTo(0, 0); lc.lineTo(l.len, -l.len * 0.33); lc.lineTo(l.len, l.len * 0.33); lc.fill(); lc.restore();
      continue;
    }
    const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    g.addColorStop(0, `rgba(0,0,0,${l.soft ? 0.55 : 1})`); g.addColorStop(l.soft ? 0.3 : 0.55, `rgba(0,0,0,${l.soft ? 0.3 : 0.75})`); g.addColorStop(1, "rgba(0,0,0,0)");
    lc.fillStyle = g; lc.beginPath(); lc.arc(l.x, l.y, l.r, 0, TAU); lc.fill();
  }
  ctx.save(); ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.drawImage(lightCanvas, 0, 0, W, H);
  ctx.restore();
  // coloured glow on top, additive
  ctx.globalCompositeOperation = "lighter";
  for (const l of lights) {
    if (l.cone || l.player || l.soft || l.x < vx0 || l.x > vx1 || l.y < vy0 || l.y > vy1) continue;
    const r = l.r * 0.8;
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    g.addColorStop(0, l.color + "40"); g.addColorStop(1, l.color + "00");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y, r, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

/* ================================================================ frame */
let pre = null, preFor = null;
export function render(ctx, game, cam, view) {
  const { W, H, dpr, t, dt } = view;
  updateFx(dt);
  if (preFor !== game) { pre = prerenderLevel(game); preFor = game; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, W, H);

  const sx = fx.shake ? (Math.random() - 0.5) * fx.shake : 0, sy = fx.shake ? (Math.random() - 0.5) * fx.shake : 0;
  const z = cam.zoom;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, (-cam.x * z + sx) * dpr, (-cam.y * z + sy) * dpr);

  // floor & walls
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(pre.canvas, 0, 0, pre.canvas.width / pre.scale, pre.canvas.height / pre.scale);

  // animated tile overlays (visible only)
  const vx0 = cam.x - TILE, vy0 = cam.y - TILE, vx1 = cam.x + W / z + TILE, vy1 = cam.y + H / z + TILE;
  for (const [tx, ty, name] of pre.fxTiles) {
    const x = tx * TILE, y = ty * TILE; if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    TILE_FX[name](ctx, x, y, TILE, t);
  }
  // searchlight cones (under entities)
  for (const e of game.entities) if (e.type === "searchlight") {
    ctx.save(); ctx.translate(e.x, e.y - 12); ctx.rotate(e.ang);
    const g = ctx.createLinearGradient(0, 0, e.len, 0); g.addColorStop(0, e.lit ? "rgba(255,243,176,.5)" : "rgba(255,243,176,.28)"); g.addColorStop(1, "rgba(255,243,176,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(e.len, -e.len * 0.33); ctx.lineTo(e.len, e.len * 0.33); ctx.fill(); ctx.restore();
  }
  // bulbs
  for (const b of pre.bulbs) {
    if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
    const on = Math.sin(t * 0.4 + b.seed * 50) > -0.7;
    circle(ctx, b.x, b.y, 2.6, on ? ["#f6d27a", "#ff2a4d", "#7dff4a", "#b46cff"][b.hue] : "#2a2420");
  }

  // entities, y-sorted; flat things first
  const flat = [], tall = [];
  for (const e of game.entities) (e.type === "snare" || e.type === "spawner" ? flat : tall).push(e);
  tall.push(game.player);
  tall.sort((a, b) => a.y - b.y);
  for (const e of flat.concat(tall)) {
    if (e.x < vx0 - 40 || e.x > vx1 + 40 || e.y < vy0 - 40 || e.y > vy1 + 120) continue;
    ctx.save(); ctx.translate(e.x, e.y);
    const fn = ENTITY_ART[e.type] || (e.cat === "pickup" ? ENTITY_ART.pickup : null);
    if (fn) fn(ctx, e, t, view); else placeholder(ctx, e);
    ctx.restore();
  }
  drawParts(ctx);

  drawLighting(ctx, game, cam, pre, t, W, H, view);

  // ---- screen-space post ----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (game.silence) {
    ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "rgba(128,128,128,0.75)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }
  if (game.status.reversed > 0) {
    ctx.fillStyle = `rgba(122,240,255,${0.06 + 0.04 * Math.sin(t * 3)})`; ctx.fillRect(0, 0, W, H);
  }
  // sanity hallucinations: grins at the edges of sight
  const san = game.run.sanity;
  if (san < 45) {
    const k = (45 - san) / 45;
    for (let i = 0; i < 3; i++) {
      const a = t * 0.15 + i * 2.1, x = W / 2 + Math.cos(a) * W * 0.46, y = H / 2 + Math.sin(a * 1.3) * H * 0.42;
      ctx.globalAlpha = k * (0.25 + 0.2 * Math.sin(t * 0.8 + i));
      ctx.strokeStyle = "#ff2a4d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 18, 0.2, Math.PI - 0.2); ctx.stroke();
      circle(ctx, x - 8, y - 8, 2.5, PAL.bulbHot); circle(ctx, x + 8, y - 8, 2.5, PAL.bulbHot);
    }
    ctx.globalAlpha = 1;
  }
  // vignette tightens with dread
  const d = game.dread;
  const inner = Math.min(W, H) * (0.55 - d * 0.32), outer = Math.max(W, H) * (0.78 - d * 0.18);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.max(10, inner), W / 2, H / 2, outer);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(${(20 + d * 60) | 0},0,${(10 + d * 10) | 0},${0.75 + d * 0.2})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // heartbeat pulse at high dread (slow: ~1.2Hz, low amplitude)
  if (d > 0.6 && !view.reduced) {
    const beat = Math.max(0, Math.sin(t * 7.5)) ** 8 * (d - 0.6) * 0.5;
    ctx.fillStyle = `rgba(139,20,20,${beat})`; ctx.fillRect(0, 0, W, H);
  }
  if (fx.flash > 0) { ctx.globalAlpha = Math.min(0.6, fx.flash); ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // grain
  ctx.fillStyle = "rgba(255,255,255,.025)";
  for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
}

/* ================================================================ cinematics */
function bigTop(ctx, W, H, t, glow = 1) {
  const g = ctx.createRadialGradient(W / 2, H * 0.85, 10, W / 2, H * 0.8, Math.max(W, H) * 0.7);
  g.addColorStop(0, `rgba(217,130,43,${0.38 * glow})`); g.addColorStop(0.5, `rgba(139,20,20,${0.16 * glow})`); g.addColorStop(1, "rgba(7,6,10,0)");
  ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, W, H); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, base = H, top = H * 0.38, half = Math.min(W * 0.42, H * 0.6);
  ctx.fillStyle = "#120b0e"; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx - half, base - H * 0.18); ctx.lineTo(cx - half, base); ctx.lineTo(cx + half, base); ctx.lineTo(cx + half, base - H * 0.18); ctx.fill();
  ctx.strokeStyle = "#1e1216"; ctx.lineWidth = Math.max(6, W * 0.012);
  for (let i = -2; i <= 2; i++) { if (!i) continue; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + i * half * 0.35, base); ctx.stroke(); }
  ctx.fillStyle = "#5a0f0f"; ctx.beginPath(); ctx.moveTo(cx, top - 30); ctx.lineTo(cx + 30, top - 22); ctx.lineTo(cx, top - 14); ctx.fill();
  ctx.fillStyle = "#1a1416"; ctx.fillRect(cx - 2, top - 32, 4, 34);
  // bulbs down the guy-lines
  const cols = [PAL.bulb, PAL.candy, PAL.poison, "#b46cff"];
  for (const side of [-1, 1]) for (let i = 0; i <= 10; i++) {
    const k = i / 10, x = cx + side * half * k, y = top + (base - H * 0.18 - top) * k;
    const on = Math.sin(t * 1.3 + i * 1.7 + side) > -0.5;
    if (on) { ctx.fillStyle = cols[i % 4] + "55"; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); }
    circle(ctx, x, y, 3.2, on ? cols[i % 4] : "#2a2420");
  }
  // mouth & eyes
  const mw = half * 0.22;
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.moveTo(cx - mw, base); ctx.lineTo(cx - mw, base - H * 0.12); ctx.quadraticCurveTo(cx, base - H * 0.2, cx + mw, base - H * 0.12); ctx.lineTo(cx + mw, base); ctx.fill();
  const blink = (t % 6) > 5.85 ? 0.15 : 1;
  ctx.fillStyle = PAL.bulb; ctx.beginPath(); ctx.ellipse(cx - 9, base - H * 0.08, 2.4, 2.4 * blink, 0, 0, TAU); ctx.ellipse(cx + 9, base - H * 0.08, 2.4, 2.4 * blink, 0, 0, TAU); ctx.fill();
}

export function renderTitle(ctx, W, H, t, view) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  bigTop(ctx, W, H, t);
  // fog bands
  for (let i = 0; i < 3; i++) {
    const y = H * (0.7 + i * 0.1) + Math.sin(t * 0.3 + i) * 8;
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 40); g.addColorStop(0, "rgba(90,70,80,0)"); g.addColorStop(0.5, "rgba(90,70,80,.12)"); g.addColorStop(1, "rgba(90,70,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 80);
  }
  // a few Players at the treeline, standing very still
  for (let i = 0; i < 4; i++) {
    const x = W * (0.08 + i * 0.27) + (i % 2) * 30, y = H * 0.93;
    ctx.save(); ctx.translate(x, y); ctx.scale(0.9, 0.9); ctx.globalAlpha = 0.55;
    ENTITY_ART.grinner(ctx, { t: 0, vx: 0, vy: 0, alert: (Math.sin(t * 0.5 + i * 2) > 0.6) ? 1 : 0, stun: 0, hitFlash: 0 }, t, view);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  vignette(ctx, W, H, 0.3);
}

function vignette(ctx, W, H, d) {
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (0.45 - d * 0.2), W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(10,0,4,.9)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

/* The lose screen: the guest's face, slowly painted into a Player's. k: 0..1 */
export function renderCaught(ctx, W, H, t, view, cause) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = "#0a0306"; ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, t / 4);
  const ease = k * k * (3 - 2 * k);
  // keep the face in the upper part of the screen; ui.css puts the words below it
  const cx = W / 2, cy = H * 0.24, r = Math.min(W * 0.24, H * 0.13);
  // spotlight
  const sg = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 3);
  sg.addColorStop(0, `rgba(246,210,122,${0.25 + ease * 0.15})`); sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
  // shoulders + ruff growing in
  ctx.fillStyle = "#2f5560"; ctx.beginPath(); ctx.ellipse(cx, cy + r * 1.9, r * 1.5, r * 0.9, 0, Math.PI, TAU); ctx.fill();
  if (ease > 0.3) {
    const rk = (ease - 0.3) / 0.7;
    for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 11) * Math.PI; circle(ctx, cx + Math.cos(a) * r * 1.1, cy + r * 1.15 + Math.sin(a) * r * 0.25, r * 0.22 * rk, i % 2 ? "#fff" : PAL.candy); }
  }
  // hair: brown -> red tufts
  const hair = ease > 0.5 ? PAL.candy : "#3a2418";
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) circle(ctx, cx + sx * (r * 0.95 + i * 4), cy - r * 0.3 + i * r * 0.25, r * (0.2 + ease * 0.22), hair);
  // skin to greasepaint
  const skin = lerpColor("#e9c9a8", "#f7f3ea", ease);
  circle(ctx, cx, cy, r, skin);
  // eyes: wide and wet, then hollowed
  for (const sx of [-1, 1]) {
    ctx.fillStyle = lerpColor("#ffffff", "#120a10", ease);
    ctx.beginPath(); ctx.ellipse(cx + sx * r * 0.38, cy - r * 0.15, r * 0.2, r * (0.14 + ease * 0.16), 0, 0, TAU); ctx.fill();
    circle(ctx, cx + sx * r * 0.38, cy - r * 0.15, r * 0.06, ease > 0.7 ? PAL.bulbHot : "#1a1a1a");
    if (ease < 0.6) { ctx.fillStyle = `rgba(160,220,255,${0.6 - ease})`; ctx.fillRect(cx + sx * r * 0.38 - 1, cy - r * 0.02, 2, r * 0.3 * (1 - ease)); } // tears
  }
  // mouth: a scream stretching into a grin
  ctx.fillStyle = "#b0102a";
  const w = r * (0.25 + ease * 0.55), dip = r * (0.35 + ease * 0.45);
  ctx.beginPath(); ctx.moveTo(cx - w, cy + r * 0.25); ctx.quadraticCurveTo(cx, cy + r * 0.25 + dip, cx + w, cy + r * 0.25);
  ctx.quadraticCurveTo(cx, cy + r * (0.5 - ease * 0.1), cx - w, cy + r * 0.25); ctx.fill();
  if (ease > 0.5) { ctx.fillStyle = "#f4ead0"; for (let i = -4; i <= 4; i++) ctx.fillRect(cx + i * w * 0.18 - 2, cy + r * 0.32, 4, r * 0.1); }
  // nose
  circle(ctx, cx, cy + r * 0.1, r * 0.08 + ease * r * 0.12, lerpColor("#d9a888", PAL.candy, ease));
  // paint brush strokes drifting across
  if (k < 1) {
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - k)})`; ctx.lineWidth = r * 0.25; ctx.lineCap = "round";
    const by = cy - r + k * r * 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.9, by); ctx.lineTo(cx + r * 0.9, by + r * 0.1); ctx.stroke();
  }
  vignette(ctx, W, H, 0.5);
}

/* The win screen: the gate behind you, the road ahead; the bulbs turn. */
export function renderWin(ctx, W, Hfull, t, view) {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, Hfull); sky.addColorStop(0, "#05070c"); sky.addColorStop(1, "#0c1410");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Hfull);
  ctx.fillStyle = "#0b140b"; ctx.fillRect(0, Hfull * 0.5, W, Hfull * 0.5);
  const H = Hfull * 0.52; // the scene lives in the top half; the words sit below it
  for (let i = 0; i < 70; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H * 0.5; ctx.fillStyle = `rgba(232,220,196,${0.3 + 0.3 * Math.sin(t + i)})`; ctx.fillRect(x, y, 1, 1); }
  // road receding
  ctx.fillStyle = "#14130f"; ctx.beginPath(); ctx.moveTo(W * 0.48, H * 0.55); ctx.lineTo(W * 0.52, H * 0.55); ctx.lineTo(W * 0.8, H); ctx.lineTo(W * 0.2, H); ctx.fill();
  // fields
  ctx.fillStyle = "#0b140b"; ctx.fillRect(0, H * 0.55, W * 0.48, H * 0.45); ctx.fillRect(W * 0.52, H * 0.55, W * 0.48, H * 0.45);
  // fireflies: the bugs are singing again
  for (let i = 0; i < 26; i++) { const x = hash(i, 9) * W + Math.sin(t * 0.7 + i) * 14, y = H * 0.6 + hash(i, 8) * H * 0.38 + Math.cos(t * 0.9 + i) * 8; circle(ctx, x, y, 1.6, `rgba(220,255,140,${0.4 + 0.4 * Math.sin(t * 2 + i * 3)})`); }
  // the gate behind, small, at the horizon
  const gx = W / 2, gy = H * 0.55;
  ctx.fillStyle = "#1a1012"; ctx.fillRect(gx - 40, gy - 50, 6, 50); ctx.fillRect(gx + 34, gy - 50, 6, 50);
  ctx.strokeStyle = "#1a1012"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(gx, gy - 50, 37, Math.PI, TAU); ctx.stroke();
  // bulbs on the arch turn to face you, one by one
  const turned = Math.min(12, Math.floor(t * 1.4));
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + (i / 11) * Math.PI, x = gx + Math.cos(a) * 37, y = gy - 50 + Math.sin(a) * 37;
    if (i < turned) {
      ctx.fillStyle = "rgba(246,210,122,.35)"; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      circle(ctx, x, y, 3, PAL.bulbHot); circle(ctx, x, y + 0.5, 1.2, "#3a0a0a"); // a pupil
    } else circle(ctx, x, y, 2.5, "#4a3a20");
  }
  // a long beam reaching down the road toward the viewer once all have turned
  if (turned >= 12) {
    const k = Math.min(1, (t - 12 / 1.4) / 3);
    const g = ctx.createLinearGradient(0, gy, 0, H); g.addColorStop(0, `rgba(246,210,122,${0.25 * k})`); g.addColorStop(1, `rgba(246,210,122,${0.08 * k})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(gx - 10, gy - 40); ctx.lineTo(gx + 10, gy - 40); ctx.lineTo(W * 0.62, H); ctx.lineTo(W * 0.38, H); ctx.fill();
  }
  // you, small, walking away
  ctx.save(); ctx.translate(W / 2, H * 0.92); ctx.scale(1.6, 1.6);
  ENTITY_ART.player(ctx, { face: -Math.PI / 2, moving: true, step: t * 3, swing: 0, invuln: 0, dashT: 0 }, t, view);
  ctx.restore();
  vignette(ctx, W, H, 0.2);
}

export function renderBackdrop(ctx, W, H, t, view) { // used behind route map / menus
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  bigTop(ctx, W, H, t, 0.6);
  ctx.fillStyle = "rgba(7,6,10,.55)"; ctx.fillRect(0, 0, W, H);
}

function lerpColor(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * k);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * k);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k);
  return `rgb(${r},${g},${bl})`;
}

/** Draw an icon into a standalone canvas element (HUD/inventory/route map). */
export function paintIcon(canvas, id, cssSize = 40) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = cssSize * dpr; canvas.height = cssSize * dpr;
  const c = canvas.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, cssSize / 2 * dpr, cssSize / 2 * dpr);
  c.clearRect(-cssSize, -cssSize, cssSize * 2, cssSize * 2);
  if (ICONS[id]) ICONS[id](c, cssSize * 0.85, 0);
  else if (ENTITY_ART[id]) { c.translate(0, cssSize * 0.36); const e = { t: 0, vx: 0, vy: 0, stun: 0, hitFlash: 0, alert: 1, face: 0, phase: 0, bob: 0, spin: 0, id: 1, ang: -0.6, age: 0, r: 10 };
    const sc = id === "stilt" ? 0.32 : id === "teacup" ? 0.55 : id === "horse" ? 0.45 : 0.65; c.scale(sc, sc); ENTITY_ART[id](c, e, 0, {}); }
}
