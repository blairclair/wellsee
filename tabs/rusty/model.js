/* Rusty comic: shared character model + drawing helpers.
   Every panel draws its people through these functions so Rusty is the same
   man in every frame (see MODEL.md). Artists: you may ADD helpers at the end
   of this file; do not change existing signatures or defaults.

   Conventions
   - Every function returns an SVG markup string.
   - Figures are drawn in local units: feet at (0,0), +x is the way they face,
     Rusty is ~400 units tall at s=1. Use o.x, o.y, o.s, o.flip (-1 = face left).
   - Pass the panel context `k` first: it makes ids unique per panel
     (k.id("x") -> "p07-x", k.url("x") -> "url(#p07-x)", k.uid("x") -> fresh id).
*/
(function (root) {
  "use strict";
  var R = root.RUSTY = root.RUSTY || { panels: {}, order: [] };
  var INK = R.INK = "#15100d";
  var seq = 0;

  /* ---------- tiny utils ---------- */
  function f(v) { return Math.round(v * 10) / 10; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function hex(c) { c = c.replace("#", ""); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mix(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var A = hex(a), B = hex(b);
    return "#" + A.map(function (v, i) {
      var x = Math.round(v + (B[i] - v) * t).toString(16); return x.length < 2 ? "0" + x : x;
    }).join("");
  }
  function pt(p) { return f(p[0]) + "," + f(p[1]); }
  function P(d, fill, stroke, sw, extra) {
    return '<path d="' + d + '" fill="' + (fill || "none") + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="' + f(sw || 3) + '" stroke-linejoin="round" stroke-linecap="round"' : "") +
      (extra ? " " + extra : "") + "/>";
  }
  function rot(p, deg, c) {
    var a = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
  }
  /* Inked limb: thick ink stroke under a colour stroke = outlined tube. */
  function limb(pts, w, color, lw) {
    lw = lw == null ? 4 : lw;
    var d = "M" + pts.map(pt).join(" L");
    return P(d, "none", INK, w + lw * 2) + P(d, "none", color, w);
  }
  function T(o) {
    var s = o.s == null ? 1 : o.s, fl = o.flip || 1;
    return 'transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") scale(" + f(s * fl * 1000) / 1000 + "," + f(s * 1000) / 1000 + ')"';
  }
  R.f = f; R.esc = esc; R.mix = mix; R.P = P; R.limb = limb; R.rot = rot;

  /* ---------- panel registration / rendering ---------- */
  R.ctx = function (pid) {
    return {
      pid: pid,
      id: function (x) { return pid + "-" + x; },
      url: function (x) { return "url(#" + pid + "-" + x + ")"; },
      uid: function (x) { return pid + "-" + (x || "u") + (++seq); }
    };
  };
  R.panel = function (p) { R.panels[p.id] = p; };
  R.svg = function (p) {
    var k = R.ctx(p.id);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + p.w + " " + p.h +
      '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(p.alt || "") + '">' +
      R.defs(k) + p.draw(k, R) + "</svg>";
  };

  /* Shared defs, one copy per panel with panel-prefixed ids:
     dots / dotsL (halftone), hatch, vig (vignette gradient), glow (warm radial). */
  R.defs = function (k) {
    return "<defs>" +
      '<pattern id="' + k.id("dots") + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.6" fill="' + INK + '"/></pattern>' +
      '<pattern id="' + k.id("dotsL") + '" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="7" cy="7" r="3.4" fill="' + INK + '"/></pattern>' +
      '<pattern id="' + k.id("dotsR") + '" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="6" cy="6" r="2.8" fill="#c0221b"/></pattern>' +
      '<pattern id="' + k.id("hatch") + '" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="8" stroke="' + INK + '" stroke-width="2"/></pattern>' +
      '<radialGradient id="' + k.id("vig") + '" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>' +
      '<radialGradient id="' + k.id("glow") + '"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".35" stop-color="#f6d27a" stop-opacity=".45"/><stop offset="1" stop-color="#f6d27a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + k.id("redglow") + '"><stop offset="0" stop-color="#ff6a3d" stop-opacity=".9"/><stop offset=".4" stop-color="#c0221b" stop-opacity=".45"/><stop offset="1" stop-color="#8b1414" stop-opacity="0"/></radialGradient>' +
      "</defs>";
  };
  R.vignette = function (k, w, h, op) {
    return '<rect width="' + w + '" height="' + h + '" fill="' + k.url("vig") + '" opacity="' + (op == null ? 1 : op) + '"/>';
  };
  /* halftone over any path: R.tone(k, d, .4) */
  R.tone = function (k, d, op, big) {
    return P(d, k.url(big ? "dotsL" : "dots"), null, 0, 'opacity="' + (op == null ? .35 : op) + '"');
  };
  R.glow = function (k, cx, cy, r, op, red) {
    return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + k.url(red ? "redglow" : "glow") + '" opacity="' + (op == null ? 1 : op) + '"/>';
  };
  /* Comic SFX lettering (Bangers). */
  R.sfx = function (text, x, y, size, o) {
    o = o || {};
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-family="Bangers, Impact, sans-serif" font-size="' + size +
      '" letter-spacing="' + (o.ls || 2) + '" fill="' + (o.fill || "#f6d27a") + '" stroke="' + (o.stroke || INK) +
      '" stroke-width="' + (o.sw || size / 9) + '" paint-order="stroke" stroke-linejoin="round"' +
      (o.rot ? ' transform="rotate(' + o.rot + " " + f(x) + " " + f(y) + ')"' : "") +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : "") + (o.extra ? " " + o.extra : "") + ">" + esc(text) + "</text>";
  };
  /* Radiating light rays from a point. */
  R.rays = function (cx, cy, n, len, color, op, spread, start) {
    var s = "", sp = spread || 360, st = start || 0;
    for (var i = 0; i < n; i++) {
      var a0 = (st + sp * i / n) * Math.PI / 180, a1 = (st + sp * (i + .45) / n) * Math.PI / 180;
      s += P("M" + f(cx) + "," + f(cy) + " L" + f(cx + Math.cos(a0) * len) + "," + f(cy + Math.sin(a0) * len) +
        " L" + f(cx + Math.cos(a1) * len) + "," + f(cy + Math.sin(a1) * len) + "Z", color);
    }
    return '<g opacity="' + (op == null ? .25 : op) + '">' + s + "</g>";
  };
  /* Furry / ragged closed outline around an ellipse. */
  R.fur = function (cx, cy, rx, ry, n, jag, seed) {
    var d = "", sd = seed || 1;
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2, r = (i % 2) ? 1 : 1 + jag * (0.6 + 0.4 * Math.sin(i * 7.3 + sd));
      d += (i ? " L" : "M") + f(cx + Math.cos(a) * rx * r) + "," + f(cy + Math.sin(a) * ry * r);
    }
    return d + "Z";
  };
  /* Bulb string along a sagging wire from a to b. */
  R.bulbWire = function (k, a, b, sag, n, o) {
    o = o || {};
    var mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag];
    var s = P("M" + pt(a) + " Q" + pt([mid[0], mid[1] + sag]) + " " + pt(b), "none", o.wire || "#1b1416", o.ww || 2);
    for (var i = 1; i < n; i++) {
      var t = i / n, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mid[0] + t * t * b[0],
        y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * (mid[1] + sag) + t * t * b[1];
      var dead = o.dead && (i % o.dead === 0);
      if (!dead && o.glow !== false) s += R.glow(k, x, y + 4, (o.r || 4) * 5, .55, o.red);
      s += '<circle cx="' + f(x) + '" cy="' + f(y + 4) + '" r="' + (o.r || 4) + '" fill="' + (dead ? "#3a3026" : (o.color || "#ffe9a8")) + '" stroke="' + INK + '" stroke-width="1"/>';
    }
    return s;
  };

  /* ---------- faces ---------- */
  var FACE = {
    rusty: "M-46,-20 C-48,-70 -26,-80 0,-80 C26,-80 48,-70 46,-20 C47,8 42,38 26,54 C15,63 -15,63 -26,54 C-42,38 -47,8 -46,-20Z",
    danny: "M-42,-24 C-44,-70 -24,-82 0,-82 C24,-82 44,-70 42,-24 C42,6 36,34 20,52 C10,62 -10,62 -20,52 C-36,34 -42,6 -42,-24Z",
    jess: "M-40,-24 C-42,-70 -22,-80 0,-80 C22,-80 42,-70 40,-24 C40,8 32,36 16,50 C8,58 -8,58 -16,50 C-32,36 -40,8 -40,-24Z"
  };
  R.FACE = FACE;

  /* Character presets (MODEL.md). */
  R.CH = {
    rusty: { face: FACE.rusty, skin: "#e2b48f", hair: "#b0643a", grey: .45, brow: "#7d4426", hairStyle: "fringe", must: true, nose: 1.25, droop: 3, age: 1, browW: 1.25, flush: .25 },
    rustyYoung: { face: FACE.rusty, skin: "#e8b08a", hair: "#b5532a", grey: 0, brow: "#8a3f1f", hairStyle: "young", must: true, nose: 1.2, droop: 2, age: .55, browW: 1.2, flush: .7 },
    danny: { face: FACE.danny, skin: "#e6bb98", hair: "#3b2a20", grey: 0, brow: "#2d1f17", hairStyle: "full", must: false, nose: 1.05, droop: 1, age: .2, browW: 1, stubble: .35, flush: 0 },
    danny18: { face: FACE.danny, skin: "#ecc3a0", hair: "#4a3324", grey: 0, brow: "#3a281b", hairStyle: "full", must: false, nose: 1, droop: 0, age: 0, browW: .9, flush: .1 },
    carol: { face: FACE.jess, skin: "#e9bf9c", hair: "#9a4a22", grey: 0, brow: "#6a3018", hairStyle: "long", must: false, nose: .75, droop: 0, age: .1, browW: .75, lashes: true, flush: .2 },
    jess: { face: FACE.jess, skin: "#d9a27c", hair: "#5a2e1c", grey: 0, brow: "#3e2014", hairStyle: "long", must: false, nose: .7, droop: 0, age: 0, browW: .75, lashes: true, flush: .15 }
  };

  /* Expressions: bi/bo = inner/outer brow raise, eye = openness, curve = smile(+)/frown(-),
     open = mouth open, tears, look = pupil shift (-1..1). */
  R.EXPR = {
    neutral: { bi: 0, bo: 0, eye: .75, curve: -.1, open: 0 },
    tender: { bi: 4, bo: -1, eye: .55, curve: .55, open: 0 },
    smile: { bi: 2, bo: 1, eye: .6, curve: .8, open: .15 },
    sad: { bi: 7, bo: -4, eye: .55, curve: -.6, open: 0 },
    fear: { bi: 9, bo: 6, eye: 1.25, curve: -.4, open: .55 },
    resolve: { bi: -6, bo: 2, eye: .7, curve: -.35, open: 0 },
    anger: { bi: -9, bo: 4, eye: .95, curve: -.6, open: .9 },
    resigned: { bi: 4, bo: -5, eye: .4, curve: -.4, open: 0 },
    anguish: { bi: 11, bo: -5, eye: .2, curve: -1, open: .7, tears: true },
    cry: { bi: 9, bo: -4, eye: .45, curve: -.7, open: .1, tears: true },
    drunk: { bi: -3, bo: 5, eye: .38, curve: .25, open: .35 },
    hurt: { bi: 8, bo: -2, eye: .8, curve: -.8, open: .2 },
    closed: { bi: 3, bo: -3, eye: 0, curve: -.2, open: 0 }
  };

  /* R.head(k, o): o = {x,y,s,rot, ch, expr, turn(-1..1), wear(0..1), light(-1 left lit / 1 right lit), lw, hat, look} */
  R.head = function (k, o) {
    var c = typeof o.ch === "string" ? R.CH[o.ch] : (o.ch || R.CH.rusty);
    var e = typeof o.expr === "object" ? o.expr : (R.EXPR[o.expr || "neutral"] || R.EXPR.neutral);
    var t = o.turn || 0, w = o.wear || 0, lw = o.lw || 3;
    var skin = mix(c.skin, "#b3aea3", w * .6);
    var hair = mix(c.hair, "#dcd8cf", Math.min(1, (c.grey || 0) + w * .8));
    var brow = mix(c.brow, "#cfcac0", Math.min(1, (c.grey || 0) * .6 + w * .8));
    var nose = mix(skin, "#c9614a", (c.flush || 0) * (1 - w * .7));
    var dx = t * 12, s = "", face = c.face, age = Math.min(1.4, (c.age || 0) + w * .6);
    var cid = k.uid("face");
    s += '<defs><clipPath id="' + cid + '"><path d="' + face + '"/></clipPath></defs>';
    /* long hair behind */
    if (c.hairStyle === "long") {
      s += P("M-44,-30 C-60,20 -58,70 -46,100 L-24,100 C-32,60 -36,20 -30,0 L30,0 C36,20 32,60 24,100 L46,100 C58,70 60,20 44,-30 C30,-90 -30,-90 -44,-30Z", hair, INK, lw);
    }
    /* ears */
    [-1, 1].forEach(function (sd) {
      if (t * sd > .45) return;
      var ex = sd * 45 - t * 6;
      s += P("M" + f(ex) + ",-16 C" + f(ex + sd * 14) + ",-24 " + f(ex + sd * 16) + ",12 " + f(ex - sd * 1) + ",17Z", skin, INK, lw);
      s += P("M" + f(ex + sd * 3) + ",-8 C" + f(ex + sd * 10) + ",-10 " + f(ex + sd * 9) + ",6 " + f(ex + sd * 2) + ",8", "none", INK, lw * .5);
    });
    s += P(face, skin, INK, lw * 1.15);
    /* shading (clipped to face) */
    var sh = "";
    if (o.light) {
      var sx = o.light > 0 ? -1 : 1;
      var d = "M" + f(sx * 10 + dx) + ",-95 C" + f(sx * 40 + dx) + ",-40 " + f(sx * 36 + dx) + ",20 " + f(sx * 6 + dx) + ",75 L" + (sx * 80) + ",75 L" + (sx * 80) + ",-95Z";
      sh += P(d, mix(skin, "#5a3a3a", .45), null, 0, 'opacity=".55"') + R.tone(k, d, .35);
    }
    sh += P("M-30,58 C-10,66 10,66 30,58 L30,80 L-30,80Z", mix(skin, "#5a3a3a", .3), null, 0, 'opacity=".5"');
    if (c.stubble || w > .2) {
      var st = Math.max(c.stubble || 0, (w - .2) * 1.2);
      sh += P("M-48,8 C-40,46 -20,64 0,64 C20,64 40,46 48,8 C34,28 18,24 0,26 C-18,24 -34,28 -48,8Z", k.url("dots"), null, 0, 'opacity="' + f(st * .55) + '"');
    }
    s += '<g clip-path="url(#' + cid + ')">' + sh + "</g>";
    /* wrinkles */
    if (age > .05) {
      var wl = 'opacity="' + f(Math.min(.8, age * .6)) + '"';
      var wr = "";
      if (c.hairStyle === "fringe" || c.hairStyle === "young") {
        wr += P("M" + f(-20 + dx) + ",-50 Q" + f(dx) + ",-56 " + f(20 + dx) + ",-50", "none", INK, lw * .55);
        wr += P("M" + f(-16 + dx) + ",-58 Q" + f(dx) + ",-63 " + f(16 + dx) + ",-58", "none", INK, lw * .5);
        if (age > .8) wr += P("M" + f(-12 + dx) + ",-65 Q" + f(dx) + ",-69 " + f(12 + dx) + ",-65", "none", INK, lw * .45);
      }
      wr += P("M" + f(dx - 14) + ",12 C" + f(dx - 24) + ",22 " + f(dx - 24) + ",34 " + f(dx - 19) + ",46", "none", INK, lw * .6);
      wr += P("M" + f(dx + 14) + ",12 C" + f(dx + 24) + ",22 " + f(dx + 24) + ",34 " + f(dx + 19) + ",46", "none", INK, lw * .6);
      if (age > .5) {
        wr += P("M-34,30 C-32,40 -28,46 -24,50", "none", INK, lw * .5);
        wr += P("M34,30 C32,40 28,46 24,50", "none", INK, lw * .5);
      }
      s += "<g " + wl + ">" + wr + "</g>";
    }
    /* eyes */
    [-1, 1].forEach(function (sd) {
      var ex = sd * 17 + dx, ey = -12;
      var ew = 9 * (1 - sd * t * .3), op = e.eye;
      var inner = ex - sd * ew, outer = ex + sd * ew, dr = c.droop || 0;
      if (op < .12) {
        s += P("M" + f(inner) + "," + ey + " Q" + f(ex) + "," + (ey + 5) + " " + f(outer) + "," + (ey + 1 + dr * .5), "none", INK, lw * 1.1);
      } else {
        var h1 = 9 * op, h2 = 5 * op;
        var top = "M" + f(inner) + "," + ey + " C" + f(ex - sd * ew * .4) + "," + f(ey - h1) + " " + f(ex + sd * ew * .5) + "," + f(ey - h1) + " " + f(outer) + "," + f(ey + dr);
        var full = top + " C" + f(ex + sd * ew * .4) + "," + f(ey + h2 + dr * .5) + " " + f(ex - sd * ew * .5) + "," + f(ey + h2) + " " + f(inner) + "," + ey + "Z";
        s += P(full, "#f3ead8", INK, lw * .6);
        var pr = Math.min(4, h1 * .45 + 1.2), px = ex + t * 3 + (o.look || 0) * 3.5;
        s += '<circle cx="' + f(px) + '" cy="' + f(ey + .5) + '" r="' + f(pr) + '" fill="' + INK + '"/>';
        if (o.glint !== false) s += '<circle cx="' + f(px + 1.3) + '" cy="' + f(ey - 1) + '" r="' + f(pr * .32) + '" fill="#fff"/>';
        s += P(top, "none", INK, lw * 1.25);
        if (c.lashes) s += P("M" + f(outer) + "," + f(ey + dr) + " l" + (sd * 5) + ",-4", "none", INK, lw * .7);
      }
      /* bags + crow's feet */
      if (age > .3) {
        s += P("M" + f(inner) + "," + f(ey + 7) + " Q" + f(ex) + "," + f(ey + 12 + w * 3) + " " + f(outer) + "," + f(ey + 6 + dr), "none", INK, lw * .5, 'opacity="' + f(Math.min(.9, age * .6)) + '"');
        s += P("M" + f(outer + sd * 3) + "," + f(ey - 2) + " l" + (sd * 7) + ",-3 M" + f(outer + sd * 3) + "," + f(ey + 2) + " l" + (sd * 7) + ",2", "none", INK, lw * .45, 'opacity=".6"');
      }
      if (e.tears && op >= 0) {
        s += P("M" + f(ex + sd * 2) + "," + f(ey + 6) + " C" + f(ex + sd * 4) + "," + f(ey + 18) + " " + f(ex) + "," + f(ey + 26) + " " + f(ex + sd * 3) + "," + f(ey + 36), "none", "#d7eef7", lw * 1.1, 'opacity=".9"');
        s += P("M" + f(ex + sd * 3) + "," + f(ey + 36) + " c-3,4 -3,8 0,9 c3,-1 3,-5 0,-9Z", "#d7eef7", INK, lw * .35);
      }
      /* brows */
      var bin = [ex - sd * 9, -28 - e.bi], bout = [ex + sd * 13, -27 - e.bo], bm = [ex + sd * 2, -33 - (e.bi + e.bo) / 2];
      var bd = "M" + pt(bin) + " Q" + pt(bm) + " " + pt(bout);
      s += P(bd, "none", INK, 6 * c.browW + lw * 1.2) + P(bd, "none", brow, 6 * c.browW);
    });
    /* nose */
    var nz = c.nose || 1, nx = dx * 1.35;
    var nd = "M" + f(nx - 5 * nz) + "," + f(-16) + " C" + f(nx - 7 * nz) + "," + f(-2) + " " + f(nx - 14 * nz) + "," + f(4 * nz) + " " + f(nx - 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx - 11 * nz) + "," + f(21 * nz) + " " + f(nx + 11 * nz) + "," + f(21 * nz) + " " + f(nx + 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx + 14 * nz) + "," + f(4 * nz) + " " + f(nx + 7 * nz) + "," + f(-2) + " " + f(nx + 5 * nz) + "," + f(-16);
    s += P(nd, nose, null, 0);
    s += P("M" + f(nx - 8 * nz) + ",-3 C" + f(nx - 12 * nz) + "," + f(2) + " " + f(nx - 15 * nz) + "," + f(6 * nz) + " " + f(nx - 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx - 11 * nz) + "," + f(21 * nz) + " " + f(nx + 11 * nz) + "," + f(21 * nz) + " " + f(nx + 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx + 15 * nz) + "," + f(6 * nz) + " " + f(nx + 12 * nz) + ",2 " + f(nx + 8 * nz) + ",-3", "none", INK, lw);
    s += P("M" + f(nx - 6 * nz) + "," + f(15 * nz) + " q2,-3 4,0 M" + f(nx + 2 * nz) + "," + f(15 * nz) + " q2,-3 4,0", "none", INK, lw * .6);
    /* mouth */
    var my = c.must ? 42 : 36, mx = dx * 1.15, mw = c.must ? 14 : 12;
    if (e.open > .05) {
      var ry = 2.5 + e.open * 10;
      s += '<ellipse cx="' + f(mx) + '" cy="' + f(my + e.open * 3) + '" rx="' + f(mw * (1 - e.open * .25)) + '" ry="' + f(ry) + '" fill="#3a0f0f" stroke="' + INK + '" stroke-width="' + f(lw) + '"/>';
      if (e.open > .5) s += P("M" + f(mx - mw * .55) + "," + f(my + e.open * 3 - ry * .6) + " L" + f(mx + mw * .55) + "," + f(my + e.open * 3 - ry * .6), "none", "#e9e1cf", lw * 1.2);
    } else {
      s += P("M" + f(mx - mw) + "," + f(my - e.curve * 5) + " Q" + f(mx) + "," + f(my + e.curve * 6) + " " + f(mx + mw) + "," + f(my - e.curve * 5), "none", INK, lw * 1.1);
    }
    if (!c.must) s += P("M" + f(mx - 6) + "," + f(my + 12) + " Q" + f(mx) + "," + f(my + 15) + " " + f(mx + 6) + "," + f(my + 12), "none", INK, lw * .5, 'opacity=".6"');
    /* mustache: walrus, droops further with wear */
    if (c.must) {
      var mc = mix(c.hair, "#d9d4ca", Math.min(1, (c.grey || 0) * .7 + w * .8)), dd = 4 + w * 4;
      s += P("M" + f(mx - 27) + "," + f(36 + dd) + " C" + f(mx - 24) + ",22 " + f(mx - 8) + ",19 " + f(mx) + ",24 C" + f(mx + 8) + ",19 " + f(mx + 24) + ",22 " + f(mx + 27) + "," + f(36 + dd) +
        " C" + f(mx + 22) + ",31 " + f(mx + 16) + ",33 " + f(mx + 12) + ",30 C" + f(mx + 6) + ",34 " + f(mx - 6) + ",34 " + f(mx - 12) + ",30 C" + f(mx - 16) + ",33 " + f(mx - 22) + ",31 " + f(mx - 27) + "," + f(36 + dd) + "Z", mc, INK, lw);
      s += P("M" + f(mx - 16) + ",27 l-3,6 M" + f(mx - 8) + ",26 l-2,6 M" + f(mx + 8) + ",26 l2,6 M" + f(mx + 16) + ",27 l3,6", "none", INK, lw * .4, 'opacity=".6"');
    }
    /* hair */
    if (c.hairStyle === "fringe" || c.hairStyle === "young") {
      [-1, 1].forEach(function (sd) {
        s += P("M" + (sd * 44) + ",-44 C" + (sd * 58) + ",-36 " + (sd * 58) + ",-2 " + (sd * 47) + ",6 C" + (sd * 50) + ",-8 " + (sd * 47) + ",-20 " + (sd * 40) + ",-34 l" + (sd * 3) + ",-6 l" + (sd * -2) + ",-2Z", hair, INK, lw * .8);
      });
      var wisps = c.hairStyle === "young" ? 7 : Math.max(0, Math.round(3 - w * 3));
      for (var i = 0; i < wisps; i++) {
        var xx = -24 + i * (48 / Math.max(1, wisps - 1));
        s += P("M" + f(xx - 8) + ",-74 C" + f(xx - 2) + ",-86 " + f(xx + 10) + ",-84 " + f(xx + 16) + ",-74", "none", hair, c.hairStyle === "young" ? lw * 2.4 : lw * .9);
      }
      if (c.hairStyle === "young") s += P("M-40,-50 C-38,-80 -10,-90 12,-86 C34,-84 46,-68 42,-48 C30,-66 18,-70 0,-68 C-14,-66 -30,-62 -40,-50Z", hair, INK, lw * .8);
    } else if (c.hairStyle === "full") {
      s += P("M-46,-14 C-54,-74 -22,-96 6,-92 C36,-90 56,-70 46,-14 C44,-38 36,-52 26,-58 C16,-48 -4,-50 -14,-60 C-22,-50 -34,-44 -40,-34 C-42,-26 -44,-20 -46,-14Z", hair, INK, lw);
      s += P("M-20,-80 C-10,-70 0,-68 10,-72 M14,-84 C22,-74 30,-70 38,-62", "none", INK, lw * .5, 'opacity=".6"');
    } else if (c.hairStyle === "long") {
      s += P("M-44,-20 C-50,-78 -18,-94 4,-90 C32,-88 52,-70 44,-20 C40,-46 30,-58 18,-64 C4,-52 -22,-50 -36,-46 C-40,-36 -42,-28 -44,-20Z", hair, INK, lw);
    }
    if (o.hat === "mortar") {
      s += P("M-60,-86 L4,-110 L66,-86 L2,-64Z", "#1d2350", INK, lw) + P("M-34,-80 L-34,-60 C-10,-50 14,-50 36,-60 L36,-80", "#1d2350", INK, lw) +
        P("M4,-88 C30,-80 46,-70 50,-44", "none", "#d9b23a", lw * 1.2) + '<circle cx="50" cy="-42" r="4" fill="#d9b23a"/>';
    }
    return '<g transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") rotate(" + f(o.rot || 0) + ") scale(" + f((o.s || 1) * (o.flip || 1) * 1000) / 1000 + "," + f((o.s || 1) * 1000) / 1000 + ')">' + s + "</g>";
  };

  /* ---------- outfits ---------- */
  R.OUTFIT = {
    work: { shirt: "#7f8b6c", pants: "#30384a", boots: "#3b2a1e", tag: "RUSTY", keys: true },
    suit: { shirt: "#6c4f37", pants: "#5e4530", boots: "#2b1d14", under: "#efe8d8", tie: "#7a1f24", jacket: true },
    eternal: { shirt: "#6b6e66", pants: "#2b2d31", boots: "#2a2420", under: "#d9d2c0", tie: "#4f1d1f", tag: "RUSTY", carnival: true, stains: true, keys: true },
    danny: { shirt: "#45627a", pants: "#2c3d5c", boots: "#3a3330", flannel: true },
    gown: { shirt: "#26306b", pants: "#26306b", boots: "#1a1a1a", gown: true },
    jess: { shirt: "#b46a58", pants: "#3a3f55", boots: "#3a2a24", belly: true },
    coat: { shirt: "#4b4237", pants: "#3a3530", boots: "#2b1d14", under: "#c9c0ae", tie: "#5a2a22", jacket: true }
  };

  /* ---------- poses (feet at 0, +x forward). arms/legs: [shoulder|hip, elbow|knee, hand|foot] ---------- */
  var SH = [[-46, -298], [46, -298]];
  R.POSE = {
    stand: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[SH[0], [-55, -235], [-52, -172]], [SH[1], [55, -235], [52, -172]]] },
    mop: { legs: [[[-16, -185], [-24, -95], [-30, -8]], [[18, -185], [28, -96], [34, -8]]], arms: [[SH[0], [-14, -236], [54, -252]], [SH[1], [86, -240], [76, -186]]], prop: "mop", stoop: 8 },
    broom: { legs: [[[-16, -185], [-24, -95], [-30, -8]], [[18, -185], [28, -96], [34, -8]]], arms: [[SH[0], [-14, -236], [54, -252]], [SH[1], [86, -240], [76, -186]]], prop: "broom", stoop: 8 },
    lean: { legs: [[[-16, -185], [-18, -95], [-22, -8]], [[18, -185], [22, -95], [26, -8]]], arms: [[SH[0], [-8, -238], [76, -250]], [SH[1], [88, -228], [82, -240]]], prop: "mopUp", stoop: 2 },
    walk: { legs: [[[-12, -185], [-32, -100], [-62, -10]], [[12, -185], [36, -104], [44, -8]]], arms: [[SH[0], [-64, -240], [-78, -186]], [SH[1], [62, -238], [82, -190]]] },
    walkCarry: { legs: [[[-12, -185], [-32, -100], [-62, -10]], [[12, -185], [36, -104], [44, -8]]], arms: [[SH[0], [-30, -246], [18, -246]], [SH[1], [58, -250], [30, -250]]], carry: [24, -250] },
    hold: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[SH[0], [-36, -236], [14, -246]], [SH[1], [58, -236], [26, -244]]], carry: [20, -248] },
    reach: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [24, -95], [28, -8]]], arms: [[SH[0], [-55, -235], [-52, -172]], [SH[1], [88, -272], [128, -262]]] },
    sit: { dy: 35, legs: [[[-12, -150], [66, -150], [64, -8]], [[14, -150], [86, -146], [86, -8]]], arms: [[[-46, -263], [-40, -200], [44, -160]], [[46, -263], [62, -200], [80, -158]]] },
    sitLow: { dy: 110, legs: [[[-12, -75], [70, -95], [68, -8]], [[14, -75], [90, -92], [92, -8]]], arms: [[[-46, -188], [-34, -128], [50, -104]], [[46, -188], [64, -128], [84, -100]]], stoop: 16 },
    kneel: { dy: 70, legs: [[[-12, -115], [-6, -14], [-74, -8]], [[14, -115], [72, -112], [72, -8]]], arms: [[[-46, -228], [-50, -170], [-44, -110]], [[46, -228], [74, -262], [88, -300]]] },
    dragged: { legs: [[[-14, -185], [-44, -110], [-78, -30]], [[14, -185], [-8, -100], [-36, -18]]], arms: [[SH[0], [-70, -330], [-84, -372]], [SH[1], [72, -330], [86, -372]]], stoop: -12 },
    slump: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[SH[0], [-40, -232], [-26, -170]], [SH[1], [56, -232], [50, -170]]], stoop: 14 }
  };

  /* R.person(k, o): o = {x,y,s,flip, ch, outfit, pose, expr, turn, wear, stoop, headTilt, light, prop, carry(svg string drawn at carry point), hat, look, lw}
     Rusty is ~400 units tall. */
  R.person = function (k, o) {
    var ch = o.ch || "rusty", c = R.CH[ch];
    var pose = typeof o.pose === "object" ? o.pose : (R.POSE[o.pose || "stand"] || R.POSE.stand);
    var of = typeof o.outfit === "object" ? o.outfit : R.OUTFIT[o.outfit || "work"];
    var w = o.wear || 0, lw = o.lw || 4, dy = pose.dy || 0;
    var stoop = (o.stoop != null ? o.stoop : (pose.stoop || 0)) + (ch.indexOf("rusty") === 0 ? w * 12 : 0);
    var hip = [0, -185 + dy];
    var R_ = function (p) { return rot([p[0], p[1]], stoop, hip); };
    var shirt = mix(of.shirt, "#77746c", w * .5), pants = mix(of.pants, "#3a3a3a", w * .4);
    var skin = mix(c.skin, "#b3aea3", w * .6);
    var s = "";
    var legs = pose.legs, arms = pose.arms.map(function (a) { return a.map(R_); });
    /* legs */
    var legW = of.gown ? 22 : 34;
    legs.forEach(function (L) {
      s += limb(L, legW, of.gown ? mix(skin, "#333", .2) : pants, lw);
      var ft = L[2];
      s += P("M" + f(ft[0] - 16) + "," + f(ft[1] + 8) + " L" + f(ft[0] - 15) + "," + f(ft[1] - 10) + " C" + f(ft[0] - 4) + "," + f(ft[1] - 17) + " " + f(ft[0] + 10) + "," + f(ft[1] - 13) + " " + f(ft[0] + 16) + "," + f(ft[1] - 6) +
        " C" + f(ft[0] + 30) + "," + f(ft[1] - 4) + " " + f(ft[0] + 32) + "," + f(ft[1] + 6) + " " + f(ft[0] + 27) + "," + f(ft[1] + 8) + "Z", of.boots, INK, lw * .8);
    });
    if (of.stains) s += '<circle cx="' + f(legs[1][1][0] + 4) + '" cy="' + f(legs[1][1][1] + 10) + '" r="9" fill="#4a1512" opacity=".7"/>';
    if (!of.gown) s += P("M-40," + f(-192 + dy) + " L40," + f(-192 + dy) + " L37," + f(-160 + dy) + " L-37," + f(-160 + dy) + "Z", pants, INK, lw * .8);
    /* torso group (rotated by stoop around hip) */
    var tg = "";
    var torso = of.gown ?
      "M-46,-305 C-62,-240 -70,-150 -72,-60 L72,-60 C70,-150 62,-240 46,-305 C24,-316 -24,-316 -46,-305Z" :
      "M-46,-305 C-56,-268 -50,-220 -40,-182 L40,-182 C" + (of.belly ? "78,-200 74,-262 46,-305" : "54,-222 58,-268 46,-305") + " C24,-316 -24,-316 -46,-305Z";
    tg += P(torso, shirt, INK, lw);
    tg += R.tone(k, "M-46,-305 C-56,-268 -50,-220 -40,-182 L-14,-182 C-24,-230 -26,-270 -20,-312Z", .3);
    if (of.flannel) {
      for (var i = -40; i <= 40; i += 16) tg += P("M" + i + ",-310 L" + (i + 2) + ",-184", "none", mix(shirt, "#1a2a3a", .5), 4, 'opacity=".55"');
      for (var j = -296; j < -186; j += 18) tg += P("M-50," + j + " L52," + j, "none", mix(shirt, "#9a3030", .6), 3, 'opacity=".5"');
    }
    if (of.jacket || of.carnival) {
      tg += P("M-15,-312 L0,-262 L15,-312Z", of.under, INK, lw * .6);
      tg += P("M-4,-308 L4,-308 L7,-268 L0,-256 L-7,-268Z", of.tie, INK, lw * .6);
      if (of.jacket) tg += P("M-17,-312 L-4,-262 L-12,-226 M17,-312 L4,-262 L12,-226", "none", INK, lw * .7) +
        '<circle cx="3" cy="-228" r="3" fill="' + INK + '"/><circle cx="3" cy="-206" r="3" fill="' + INK + '"/>';
    } else if (!of.gown) {
      tg += P("M-17,-313 L0,-292 L-4,-284 L-20,-303Z M17,-313 L0,-292 L4,-284 L20,-303Z", mix(shirt, "#fff", .1), INK, lw * .6);
      tg += [-276, -252, -228, -204].map(function (y) { return '<circle cx="2" cy="' + y + '" r="2.4" fill="' + INK + '"/>'; }).join("");
    }
    if (of.gown) tg += P("M-20,-312 L0,-282 L20,-312", "none", "#d9b23a", 6);
    if (of.belly) tg += P("M40,-270 C62,-250 64,-214 46,-192", "none", mix(shirt, "#ffffff", .35), 5, 'opacity=".7"');
    if (of.tag) {
      var tagFill = of.carnival ? "#a3171c" : "#efe8d8", tagInk = of.carnival ? "#f6d27a" : "#a3171c";
      tg += '<ellipse cx="26" cy="-268" rx="16" ry="7.5" fill="' + tagFill + '" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<text x="0" y="0" transform="translate(26,-265.4) scale(' + (o.flip || 1) + ',1)" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="8" font-weight="700" fill="' + tagInk + '">' + esc(of.tag) + "</text>";
      if (of.carnival) tg += P("M8,-282 l8,-8 l8,8 l-8,8Z", "#f6d27a", INK, 1.2);
    }
    if (of.stains) tg += '<path d="M-20,-230 c8,-6 18,2 14,10 c-4,8 -18,6 -14,-10Z M14,-206 c6,-2 10,4 6,8 c-6,3 -10,-4 -6,-8Z" fill="#4a1512" opacity=".65"/>' +
      P("M-30,-290 l6,14 M30,-200 l-4,10", "none", INK, 1.5, 'opacity=".5"');
    if (!of.gown && !of.jacket) {
      tg += P("M-40,-190 L40,-190", "none", "#1d1612", 8);
      if (of.keys) tg += '<circle cx="-34" cy="-178" r="7" fill="none" stroke="#9c9586" stroke-width="2.5"/>' +
        P("M-38,-172 l-4,12 M-33,-171 l1,13 M-29,-173 l5,10", "none", "#b8b1a0", 3);
    }
    s += '<g transform="translate(0,' + dy + ") rotate(" + f(stoop) + ' 0 -185)">' + tg + "</g>";
    /* prop line through the hands */
    var h1 = arms[0][2], h2 = arms[1][2], prop = o.prop !== undefined ? o.prop : pose.prop, ps = "";
    if (prop === "mop" || prop === "broom" || prop === "mopUp") {
      var top, bot;
      if (prop === "mopUp") { top = [h1[0] + 2, h1[1] - 150]; bot = [h1[0] + 22, -4]; }
      else {
        var vx = h2[0] - h1[0], vy = h2[1] - h1[1], tt = (-6 - h1[1]) / vy;
        bot = [h1[0] + vx * tt, -6]; top = [h1[0] - vx * .55, h1[1] - vy * .55];
      }
      ps += limb([top, bot], 7, "#a07a4a", 3);
      if (prop === "broom") {
        ps += P("M" + f(bot[0] - 40) + "," + f(bot[1] + 6) + " L" + f(bot[0] - 26) + "," + f(bot[1] - 22) + " L" + f(bot[0] + 26) + "," + f(bot[1] - 22) + " L" + f(bot[0] + 44) + "," + f(bot[1] + 6) + "Z", "#c7a052", INK, 3);
        ps += P("M" + f(bot[0] - 20) + "," + f(bot[1] - 14) + " l-8,18 M" + f(bot[0]) + "," + f(bot[1] - 14) + " l0,18 M" + f(bot[0] + 20) + "," + f(bot[1] - 14) + " l8,18", "none", INK, 1.5, 'opacity=".6"');
      } else {
        var mopc = mix(o.mopColor || "#cfc7b0", "#6a2420", Math.min(.85, w * .9));
        var strands = "";
        for (var m = -5; m <= 5; m++) strands += "M" + f(bot[0]) + "," + f(bot[1] - 18) + " C" + f(bot[0] + m * 5) + "," + f(bot[1] - 6) + " " + f(bot[0] + m * 7) + "," + f(bot[1]) + " " + f(bot[0] + m * 8 + 4) + "," + f(bot[1] + 7) + " ";
        ps += P(strands, "none", INK, 7) + P(strands, "none", mopc, 4);
        ps += P("M" + f(bot[0] - 10) + "," + f(bot[1] - 24) + " h20 v8 h-20Z", "#7a7a72", INK, 2);
      }
    }
    /* arms */
    var sleeve = of.jacket ? shirt : shirt;
    var armSvg = function (A) {
      var el = A[1], hd = A[2], wr = [hd[0] + (el[0] - hd[0]) * .15, hd[1] + (el[1] - hd[1]) * .15];
      return limb([A[0], el, wr], 24, sleeve, lw) +
        '<circle cx="' + f(hd[0]) + '" cy="' + f(hd[1]) + '" r="11" fill="' + skin + '" stroke="' + INK + '" stroke-width="' + f(lw * .8) + '"/>';
    };
    s += armSvg(arms[0]);
    s += ps;
    /* carried object */
    if (o.carry && pose.carry) { var cp = R_(pose.carry); s += '<g transform="translate(' + f(cp[0]) + "," + f(cp[1] + dy * 0) + ')">' + o.carry + "</g>"; }
    s += armSvg(arms[1]);
    /* neck + head */
    var R0 = function (p) { var q = rot(p, stoop, [0, -185]); return [q[0], q[1] + dy]; };
    var nb = R0([0, -300]), nt = R0([0, -328]);
    var neck = limb([nb, nt], 26, skin, lw);
    var hc = R0([2, -362]);
    var head = R.head(k, { x: hc[0], y: hc[1], s: .52, rot: stoop + (o.headTilt || 0), ch: ch, expr: o.expr, turn: o.turn == null ? .25 : o.turn, wear: w, light: o.light, lw: 5.5, hat: o.hat, look: o.look, glint: o.glint });
    return "<g " + T(o) + ">" + neck + s + head + "</g>";
  };
  R.rusty = function (k, o) { o.ch = o.ch || "rusty"; return R.person(k, o); };

  /* ---------- props ---------- */
  /* The carved wooden rabbit (the gift). ~60 units tall at s=1, sits on (0,0). */
  R.woodRabbit = function (k, o) {
    o = o || {};
    var wd = o.color || "#c08a52", dk = mix(wd, "#3a2010", .45), s = "";
    s += P("M-30,0 C-36,-26 -18,-40 4,-36 C22,-34 30,-18 26,0Z", wd, INK, 2.5);
    s += P("M12,-30 C8,-46 20,-56 32,-50 C42,-44 40,-30 30,-26Z", wd, INK, 2.5);
    s += P("M20,-50 C14,-72 16,-88 22,-90 C28,-86 28,-68 26,-50Z", wd, INK, 2.2);
    s += P("M28,-50 C30,-70 38,-82 42,-80 C46,-74 38,-60 33,-48Z", wd, INK, 2.2);
    s += '<circle cx="-30" cy="-16" r="6" fill="' + mix(wd, "#fff", .2) + '" stroke="' + INK + '" stroke-width="2"/>';
    s += '<circle cx="31" cy="-42" r="2" fill="' + INK + '"/>';
    s += P("M-20,-24 C-10,-28 0,-26 10,-22 M-14,-12 C-4,-16 6,-14 14,-8 M-24,-6 C-16,-8 -8,-6 0,-2", "none", dk, 1.2, 'opacity=".7"');
    return "<g " + T(o) + ">" + s + "</g>";
  };
  /* A mop bucket (yellow) with optional red water. ~70 tall. */
  R.bucket = function (k, o) {
    o = o || {};
    var s = P("M-44,-70 L44,-70 L36,0 L-36,0Z", o.color || "#d9a62b", INK, 3) +
      R.tone(k, "M14,-70 L44,-70 L36,0 L10,0Z", .35) +
      P("M-44,-70 L44,-70", "none", INK, 5) +
      '<ellipse cx="0" cy="-70" rx="42" ry="6" fill="' + (o.water || "#6d7568") + '" stroke="' + INK + '" stroke-width="2"/>' +
      P("M-40,-56 C-30,-100 30,-100 40,-56", "none", "#77736a", 3) +
      '<circle cx="-30" cy="4" r="6" fill="#222" /><circle cx="30" cy="4" r="6" fill="#222"/>';
    return "<g " + T(o) + ">" + s + "</g>";
  };

  /* ---------- the Players (clown-takers) ~560 tall ---------- */
  var PLAYER_SUITS = [
    { a: "#d8cdb4", b: "#9b1b1b", hat: "#9b1b1b", hair: "#c4562a" },
    { a: "#2b2b35", b: "#c7b37a", hat: "#c7b37a", hair: "#5a5a5a" },
    { a: "#7a1b25", b: "#e4d7bd", hat: "#1e1a1c", hair: "#e4d7bd" }
  ];
  var PSH = [[-40, -415], [40, -415]];
  R.PPOSE = {
    stand: { arms: [[PSH[0], [-54, -290], [-52, -150]], [PSH[1], [54, -290], [52, -150]]] },
    wave: { arms: [[PSH[0], [-54, -290], [-52, -150]], [PSH[1], [110, -470], [120, -572]]] },
    point: { arms: [[PSH[0], [-54, -290], [-52, -150]], [PSH[1], [140, -420], [250, -410]]] },
    reach: { arms: [[PSH[0], [60, -400], [170, -380]], [PSH[1], [130, -414], [230, -396]]] },
    escort: { arms: [[PSH[0], [-70, -330], [-40, -262]], [PSH[1], [10, -330], [-26, -268]]] },
    grab: { arms: [[PSH[0], [-54, -290], [-52, -150]], [PSH[1], [96, -360], [150, -330]]] },
    offer: { arms: [[PSH[0], [30, -320], [120, -300]], [PSH[1], [90, -330], [150, -310]]] },
    clap: { arms: [[PSH[0], [50, -330], [70, -380]], [PSH[1], [90, -340], [76, -386]]] }
  };
  R.player = function (k, o) {
    o = o || {};
    var v = PLAYER_SUITS[(o.variant || 0) % 3], pose = typeof o.pose === "object" ? o.pose : (R.PPOSE[o.pose || "stand"] || R.PPOSE.stand);
    var lean = o.lean || 0, hipP = [0, -258];
    var Rt = function (p) { return rot(p, lean, hipP); };
    var arms = (o.arms || pose.arms).map(function (a) { return a.map(Rt); });
    var lw = o.lw || 4, s = "";
    /* legs */
    var legs = o.legs || [[[-18, -258], [-24, -130], [-28, -14]], [[18, -258], [24, -130], [30, -14]]];
    legs.forEach(function (L) {
      s += limb(L, 26, v.a, lw);
      var ft = L[2];
      s += '<ellipse cx="' + f(ft[0] + 18) + '" cy="' + f(ft[1] + 4) + '" rx="36" ry="12" fill="#2a0c0e" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    });
    /* torso */
    var cid = k.uid("pt"), torso = "M-40,-425 C-72,-380 -66,-300 -48,-255 L48,-255 C66,-300 72,-380 40,-425 C20,-432 -20,-432 -40,-425Z";
    var tg = '<defs><clipPath id="' + cid + '"><path d="' + torso + '"/></clipPath></defs>' + P(torso, v.a, null, 0) +
      '<g clip-path="url(#' + cid + ')">' + [-48, -16, 16, 48].map(function (x) { return '<rect x="' + (x - 8) + '" y="-440" width="16" height="200" fill="' + v.b + '" opacity=".8"/>'; }).join("") +
      R.tone(k, "M-80,-440 L-20,-440 L-20,-240 L-80,-240Z", .4) + "</g>" + P(torso, "none", INK, lw) +
      [-385, -340, -295].map(function (y) { return '<circle cx="0" cy="' + y + '" r="8" fill="' + v.b + '" stroke="' + INK + '" stroke-width="2.5"/>'; }).join("");
    s += '<g transform="rotate(' + f(lean) + ' 0 -258)">' + tg + "</g>";
    /* arms + gloves */
    arms.forEach(function (A) {
      s += limb(A, 18, v.a, lw);
      var hd = A[2], el = A[1], ang = Math.atan2(hd[1] - el[1], hd[0] - el[0]);
      if (A === arms[1] && (o.pose === "wave")) ang = -Math.PI / 2;
      var fingers = "";
      var spread = o.pose === "point" && A === arms[1] ? [0] : [-.5, -.17, .17, .5];
      spread.forEach(function (sp) {
        var a = ang + sp, L = o.pose === "point" && A === arms[1] ? 54 : 36;
        var mid = [hd[0] + Math.cos(a) * L * .55, hd[1] + Math.sin(a) * L * .55], tip = [hd[0] + Math.cos(a + sp * .4) * L, hd[1] + Math.sin(a + sp * .4) * L];
        fingers += limb([hd, mid, tip], 7, "#efe9da", 3);
      });
      s += fingers + '<circle cx="' + f(hd[0]) + '" cy="' + f(hd[1]) + '" r="14" fill="#efe9da" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    });
    /* ruff */
    var nk = Rt([0, -432]), ruff = "";
    for (var i = 0; i <= 20; i++) {
      var a = i / 20 * Math.PI * 2, r = i % 2 ? 30 : 50;
      ruff += (i ? " L" : "M") + f(nk[0] + Math.cos(a) * r) + "," + f(nk[1] + Math.sin(a) * r * .42);
    }
    s += P(ruff + "Z", "#ece4d0", INK, 3);
    /* head */
    var hc = Rt([4, -478]);
    s += R.playerHead(k, { x: hc[0], y: hc[1], s: .62, rot: lean + (o.headTilt || 0), variant: o.variant, glow: o.glow, grin: o.grin, hat: o.hat });
    return '<g ' + T(o) + (o.op != null ? ' opacity="' + o.op + '"' : "") + ">" + s + "</g>";
  };
  /* R.playerHead(k, o): face center 0,0, ~130 tall plus hat; o.grin 0..1 (1 = open with teeth). */
  R.playerHead = function (k, o) {
    o = o || {};
    var v = PLAYER_SUITS[(o.variant || 0) % 3], g = o.glow || "#f6d27a", s = "";
    /* frizz hair */
    [-1, 1].forEach(function (sd) {
      s += P(R.fur(sd * 40, -18, 20, 24, 14, .35, sd + 3), v.hair, INK, 3);
    });
    var face = "M-36,-14 C-38,-58 -18,-74 0,-74 C18,-74 38,-58 36,-14 C36,28 22,58 0,64 C-22,58 -36,28 -36,-14Z";
    s += P(face, "#f1ebde", INK, 3.5);
    s += R.tone(k, "M14,-74 C30,-60 40,-30 36,-10 C36,28 22,58 0,64 L40,70 L40,-80Z", .25);
    /* cracks */
    s += P("M-30,-40 l8,6 l-2,9 l7,5 M22,-56 l-4,10 l6,6 M10,40 l6,-6 l7,3 M-26,24 l9,2", "none", INK, 1.2, 'opacity=".55"');
    /* eyes: black diamonds, pinprick light */
    [-1, 1].forEach(function (sd) {
      var ex = sd * 15, ey = -16;
      s += P("M" + ex + "," + (ey - 26) + " L" + (ex + 10) + "," + ey + " L" + ex + "," + (ey + 24) + " L" + (ex - 10) + "," + ey + "Z", INK);
      s += '<circle cx="' + ex + '" cy="' + ey + '" r="7" fill="' + g + '" opacity=".25"/><circle cx="' + ex + '" cy="' + ey + '" r="2.2" fill="' + g + '"/>';
    });
    s += P("M-26,-50 Q-15,-60 -4,-50 M4,-50 Q15,-60 26,-50", "none", INK, 2.5);
    /* painted grin */
    s += P("M-34,6 C-22,46 22,46 34,6 C24,26 -24,26 -34,6Z", "#a3121a", INK, 2.5);
    if ((o.grin == null ? 1 : o.grin) > .5) {
      s += P("M-24,18 C-12,36 12,36 24,18 C12,27 -12,27 -24,18Z", INK);
      var teeth = ""; for (var i = -18; i <= 18; i += 6) teeth += "M" + i + "," + f(22 + Math.abs(i) * -.15) + " l0,6 ";
      s += P(teeth, "none", "#e9e1cf", 2);
    } else s += P("M-22,20 C-10,30 10,30 22,20", "none", INK, 3);
    s += '<circle cx="0" cy="2" r="9" fill="#b3141c" stroke="' + INK + '" stroke-width="2.5"/><circle cx="-3" cy="-1" r="2.5" fill="#fff" opacity=".7"/>';
    /* hat */
    if (o.hat !== false) {
      if ((o.variant || 0) % 3 === 2) s += P("M-30,-64 C-30,-96 30,-96 30,-64Z", v.hat, INK, 3) + P("M-46,-64 L46,-64", "none", INK, 6);
      else s += P("M-22,-66 L8,-150 L26,-62Z", v.hat, INK, 3) + '<circle cx="8" cy="-152" r="10" fill="#ece4d0" stroke="' + INK + '" stroke-width="2.5"/>';
    }
    return '<g transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") rotate(" + f(o.rot || 0) + ") scale(" + f(o.s || 1) + ')">' + s + "</g>";
  };

  /* ---------- rabbit-things ~420 tall, hunched, facing +x ---------- */
  R.monsterRabbit = function (k, o) {
    o = o || {};
    var fur = o.fur || "#6f665c", dk = mix(fur, "#000", .45), eye = o.eye || "#ff3b2f", s = "";
    /* back ear (torn, hanging) */
    s += P("M40,-372 C10,-420 -20,-430 -40,-400 C-30,-396 -6,-388 26,-356Z", fur, INK, 3.5) + P("M30,-372 C10,-400 -10,-410 -26,-400", "none", "#b06a6a", 5);
    /* body */
    s += P(R.fur(0, -180, 92, 150, 46, .1, 2), fur, INK, 4);
    s += R.tone(k, "M-100,-330 C-110,-200 -80,-60 -20,-30 L-100,-30Z", .45);
    s += P("M-50,-260 C-40,-230 -50,-200 -40,-170 M-20,-120 C-10,-100 -16,-80 -8,-60", "none", dk, 3);
    /* ribs showing */
    s += P("M20,-250 C40,-246 54,-232 60,-214 M18,-226 C38,-222 50,-210 56,-194 M18,-202 C34,-198 44,-188 50,-174", "none", dk, 3, 'opacity=".8"');
    /* haunch + foot */
    s += P(R.fur(-40, -60, 64, 58, 30, .12, 5), mix(fur, "#000", .1), INK, 3.5);
    s += P("M-50,-8 C-20,-14 60,-14 96,-4 C100,2 90,6 80,6 L-50,6Z", mix(fur, "#000", .2), INK, 3);
    /* long arm + claws */
    s += limb([[40, -270], [96, -170], [104, -36]], 22, fur, 4);
    s += P("M96,-30 l-8,30 M106,-30 l2,32 M114,-32 l12,26", "none", "#e8e0c8", 4) + P("M96,-30 l-8,30 M106,-30 l2,32 M114,-32 l12,26", "none", INK, 1);
    /* head: long skull-like snout */
    s += P("M10,-330 C10,-380 70,-392 100,-370 C130,-356 168,-340 172,-322 C170,-306 140,-296 110,-294 C70,-292 14,-296 10,-330Z", mix(fur, "#c9c0b0", .25), INK, 4);
    s += R.tone(k, "M10,-330 C14,-300 60,-292 110,-294 C70,-310 30,-318 10,-330Z", .5);
    /* split grin with needle teeth */
    s += P("M70,-312 C100,-300 140,-302 170,-322 C150,-314 110,-312 70,-312Z", "#2a0606", INK, 2.5);
    var t = ""; for (var x = 80; x < 166; x += 7) t += "M" + x + "," + f(-311 + (x - 80) * -.05) + " l2,7 l2,-7 ";
    s += P(t, "#e8e0c8", INK, .8);
    /* eyes: mismatched, glowing */
    s += '<circle cx="70" cy="-350" r="16" fill="' + eye + '" opacity=".3"/><circle cx="70" cy="-350" r="8" fill="' + eye + '" stroke="' + INK + '" stroke-width="2.5"/><circle cx="72" cy="-351" r="2.5" fill="#fff6c8"/>';
    s += '<circle cx="104" cy="-356" r="4" fill="' + eye + '" stroke="' + INK + '" stroke-width="1.5"/>';
    /* front ear, tall, veined */
    s += P("M54,-380 C40,-470 46,-540 70,-548 C92,-540 88,-460 78,-378Z", fur, INK, 3.5);
    s += P("M60,-388 C52,-460 58,-520 70,-530 C80,-516 78,-460 72,-388Z", "#b06a6a", null, 0);
    s += P("M66,-400 C62,-440 70,-470 68,-500 M66,-440 l-6,-14", "none", "#7a2d2d", 1.6);
    if (o.blood) s += P("M120,-300 C118,-280 124,-270 120,-256 M140,-302 c0,10 4,14 2,22", "none", "#8b1414", 4);
    return "<g " + T(o) + ">" + s + "</g>";
  };

  /* ---------- scenery helpers ---------- */
  R.bigTop = function (k, o) {
    o = o || {};
    var a = o.a || "#7a1414", b = o.b || "#d8cdb4", s = "", cid = k.uid("bt");
    var body = "M-200,0 L-200,-120 L0,-300 L200,-120 L200,0Z";
    s += '<defs><clipPath id="' + cid + '"><path d="' + body + '"/></clipPath></defs>';
    s += P(body, a);
    s += '<g clip-path="url(#' + cid + ')">';
    for (var i = -5; i <= 5; i += 2) s += P("M0,-300 L" + (i * 40) + ",0 L" + ((i + 1) * 40) + ",0Z", b, null, 0, 'opacity="' + (o.fade == null ? 1 : o.fade) + '"');
    s += R.tone(k, "M40,-300 L240,-120 L240,0 L60,0Z", .35) + "</g>";
    s += P(body, "none", INK, 4) + P("M-200,-120 C-140,-100 -70,-100 0,-120 C70,-100 140,-100 200,-120", "none", INK, 4);
    s += P("M0,-300 L0,-350", "none", INK, 5) + P("M0,-350 L34,-338 L0,-326Z", o.flag || "#8b1414", INK, 2);
    s += P("M-34,0 L-34,-60 C-20,-84 20,-84 34,-60 L34,0Z", "#050304");
    return "<g " + T(o) + ">" + s + "</g>";
  };
  R.ferris = function (k, o) {
    o = o || {};
    var r = 150, s = "", n = 12;
    s += '<circle r="' + r + '" fill="none" stroke="' + (o.color || INK) + '" stroke-width="5"/><circle r="' + (r * .55) + '" fill="none" stroke="' + (o.color || INK) + '" stroke-width="3"/>';
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r;
      s += P("M0,0 L" + f(x) + "," + f(y), "none", o.color || INK, 2.5);
      s += '<rect x="' + f(x - 9) + '" y="' + f(y) + '" width="18" height="16" fill="' + (o.car || "#3a1414") + '" stroke="' + INK + '" stroke-width="2"/>';
      if (o.lights) s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="4" fill="' + (i % 4 === 1 ? "#3a3026" : "#ffe9a8") + '"/>';
    }
    s += P("M0,0 L-90," + (r + 70) + " M0,0 L90," + (r + 70), "none", o.color || INK, 7);
    return "<g " + T(o) + ">" + s + "</g>";
  };

  /* ---------- hands (close-ups). ~100 units across at s=1. o.wear greys the skin. ---------- */
  function handSkin(o) { return mix(o.skin || R.CH.rusty.skin, "#b3aea3", (o.wear || 0) * .6); }
  /* Fist gripping a vertical bar at x≈36 (fingers wrap to +x). o.ring = wedding band, o.sleeve = cuff colour. */
  R.fist = function (k, o) {
    o = o || {};
    var sk = handSkin(o), dk = mix(sk, "#5a3a3a", .35), s = "";
    if (o.sleeve) s += P("M-44,-44 L-260,-60 L-260,60 L-40,44Z", o.sleeve, INK, 4) + P("M-60,-46 L-60,46", "none", INK, 3);
    s += P("M-52,-40 C-58,-10 -52,30 -32,46 L36,46 C50,20 50,-20 42,-44 C10,-58 -26,-56 -52,-40Z", sk, INK, 4);
    s += R.tone(k, "M-52,-40 C-58,-10 -52,30 -32,46 L-10,46 C-24,20 -30,-20 -20,-52Z", .35);
    for (var i = 0; i < 4; i++) {
      var y = -42 + i * 21;
      s += '<rect x="16" y="' + y + '" width="48" height="20" rx="10" fill="' + sk + '" stroke="' + INK + '" stroke-width="3.5"/>';
      s += P("M30," + (y + 4) + " q4,6 0,12", "none", dk, 2);
    }
    if (o.ring) s += '<rect x="22" y="1" width="7" height="20" rx="2" fill="#d9b23a" stroke="' + INK + '" stroke-width="2"/>';
    s += P("M-42,-42 C-30,-66 12,-68 34,-52 C42,-44 34,-34 22,-37 C2,-42 -20,-36 -32,-26Z", sk, INK, 4);
    s += P("M-20,10 l6,-4 M-8,20 l6,-3 M-28,-6 l7,-3", "none", dk, 2);
    return '<g transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") rotate(" + f(o.rot || 0) + ") scale(" + f((o.s || 1) * (o.flip || 1) * 1000) / 1000 + "," + f((o.s || 1) * 1000) / 1000 + ')">' + s + "</g>";
  };
  /* Open hand, palm toward viewer, fingers up. o.curl 0..1 bends fingers in. */
  R.openHand = function (k, o) {
    o = o || {};
    var sk = handSkin(o), dk = mix(sk, "#5a3a3a", .35), c = o.curl || 0, s = "";
    if (o.sleeve) s += P("M-34,30 L-44,260 L44,260 L34,30Z", o.sleeve, INK, 4);
    var bases = [[-26, -26], [-9, -32], [8, -31], [24, -24]], lens = [54, 64, 60, 46], angs = [-104, -94, -84, -72];
    bases.forEach(function (b, i) {
      var a = angs[i] * Math.PI / 180, L = lens[i], m = [b[0] + Math.cos(a) * L * .55, b[1] + Math.sin(a) * L * .55];
      var a2 = a + c * 1.4, tip = [m[0] + Math.cos(a2) * L * .45, m[1] + Math.sin(a2) * L * .45];
      s += limb([b, m, tip], 19 - i * .5, sk, 3.5);
      if (o.ring && i === 2) s += limb([[b[0] + Math.cos(a) * 14, b[1] + Math.sin(a) * 14], [b[0] + Math.cos(a) * 20, b[1] + Math.sin(a) * 20]], 21, "#d9b23a", 2);
    });
    s += limb([[-30, 6], [-56, -14], [-70, -40]], 22, sk, 3.5);
    s += P("M-40,-30 C-44,0 -36,34 0,40 C34,36 44,0 38,-30 C20,-38 -20,-38 -40,-30Z", sk, INK, 4);
    s += P("M-30,-6 C-10,4 14,0 30,-14 M-24,12 C-6,20 12,18 26,6", "none", dk, 2.2);
    if (o.tremble) s += P("M-80,-60 l-10,-6 M-84,-40 l-12,0 M76,-70 l10,-6 M80,-50 l12,0", "none", INK, 2.5);
    return '<g transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") rotate(" + f(o.rot || 0) + ") scale(" + f((o.s || 1) * (o.flip || 1) * 1000) / 1000 + "," + f((o.s || 1) * 1000) / 1000 + ')">' + s + "</g>";
  };
})(typeof window !== "undefined" ? window : globalThis);
