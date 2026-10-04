/* art/tiles.js — floor and wall tiles (prerendered once per level) and animated tile overlays. */
import { TILE, TILES } from "../content.js";
import { TAU, PAL, hash, ellipse, circle } from "./util.js";

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
      { const sd = hash(tx, ty, 77); bulbs.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 3, color: ["#f6d27a", "#ff2a4d", "#7dff4a", "#b46cff"][(tx * 3 + ty) % 4], seed: sd, state: sd < 0.4 ? "dead" : sd < 0.55 ? "flicker" : "on" }); }
  }
  // lights from tiles
  const lights = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) {
    const d = TILES[game.tiles[ty * game.w + tx]];
    if (d.light) lights.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE - (game.tiles[ty * game.w + tx] === "lamp" ? 12 : 0), ...d.light, r: d.light.r * 0.72, seed: hash(tx, ty, 5) });
  }
  const fxTiles = [];
  for (let ty = 0; ty < game.h; ty++) for (let tx = 0; tx < game.w; tx++) if (TILE_FX[game.tiles[ty * game.w + tx]]) fxTiles.push([tx, ty, game.tiles[ty * game.w + tx]]);
  return { canvas: c, scale, bulbs, lights, fxTiles };
}
