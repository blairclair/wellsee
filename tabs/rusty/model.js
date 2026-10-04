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

  /* ---------- curve geometry (organic shapes) ---------- */
  /* Catmull-Rom spline through pts, sampled `per` points per segment. */
  function crSample(pts, per) {
    per = per || 8;
    var out = [];
    if (pts.length < 2) return pts.slice();
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (var j = 0; j < per; j++) {
        var t = j / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (c) {
          return .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
        }));
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  /* Smooth cubic path through pts (Catmull-Rom -> bezier). closed adds Z and wraps. */
  function smooth(pts, closed, tension) {
    var n = pts.length, k6 = (tension == null ? 1 : tension) / 6;
    if (n < 2) return "";
    var g = function (i) { return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; };
    var d = "M" + pt(pts[0]), last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += " C" + pt([p1[0] + (p2[0] - p0[0]) * k6, p1[1] + (p2[1] - p0[1]) * k6]) + " " +
        pt([p2[0] - (p3[0] - p1[0]) * k6, p2[1] - (p3[1] - p1[1]) * k6]) + " " + pt(p2);
    }
    return d + (closed ? "Z" : "");
  }
  /* Outline of a tapered, slightly bulging tube along a smooth centreline.
     Returns {d: closed outline, a: one side (open path), b: other side}. */
  function tubeShape(pts, w0, w1, o) {
    o = o || {};
    var c = crSample(pts, o.per || 6), n = c.length, L = [], Rr = [], bul = o.bulge || 0;
    for (var i = 0; i < n; i++) {
      var p = c[i], q = c[Math.min(n - 1, i + 1)], r = c[Math.max(0, i - 1)];
      var dx = q[0] - r[0], dy = q[1] - r[1], m = Math.hypot(dx, dy) || 1, t = i / (n - 1);
      var w = (w0 + (w1 - w0) * t + bul * Math.sin(Math.PI * Math.min(1, t * 1.15))) / 2;
      L.push([p[0] - dy / m * w, p[1] + dx / m * w]); Rr.push([p[0] + dy / m * w, p[1] - dx / m * w]);
    }
    /* round caps */
    function cap(cen, from, dir, steps) {
      var a0 = Math.atan2(from[1] - cen[1], from[0] - cen[0]), rr = Math.hypot(from[0] - cen[0], from[1] - cen[1]);
      var want = Math.atan2(dir[1], dir[0]), da = Math.PI;
      var mid = a0 + Math.PI / 2;
      if (Math.cos(mid - want) < 0) da = -Math.PI;
      var out = []; for (var s2 = 1; s2 < steps; s2++) { var a = a0 + da * s2 / steps; out.push([cen[0] + Math.cos(a) * rr, cen[1] + Math.sin(a) * rr]); }
      return out;
    }
    var de = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], ds = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
    var endCap = cap(c[n - 1], L[n - 1], de, 4), startCap = cap(c[0], Rr[0], ds, 4);
    var ring = L.concat(endCap, Rr.slice().reverse(), startCap);
    return { d: smooth(ring, true), a: smooth(L), b: smooth(Rr) };
  }
  /* R.tube(pts, w0, w1, color, lw, o): organic limb. Tapers from w0 to w1, o.bulge adds belly
     to the middle, and the ink is heavier on the shadow side (o.shade: 1 = the right-hand side
     of the direction of travel, -1 the left, 0 even). */
  function tube(pts, w0, w1, color, lw, o) {
    o = o || {};
    lw = lw == null ? 4 : lw;
    var t = tubeShape(pts, w0, w1, o), s = P(t.d, color, INK, lw);
    if (o.shade) s += P(o.shade > 0 ? t.b : t.a, "none", INK, lw * 1.9);
    return s;
  }
  R.crSample = crSample; R.smooth = smooth; R.tubeShape = tubeShape; R.tube = tube;
  /* Bend the x of every coordinate in a path (absolute commands only; relative deltas are
     scaled). Used for three-quarter views. */
  function warpPath(d, wx, scaleRel) {
    var out = "", cmd = "", re = /([MLCQSTHVAZmlcqsthvaz])|(-?\d*\.?\d+(?:e-?\d+)?)/g, m, nums = [];
    function flush() {
      if (!cmd) return;
      var up = cmd === cmd.toUpperCase(), c = cmd.toUpperCase(), r = [];
      if (c === "H") r = nums.map(function (x) { return up ? wx(x) : x * scaleRel; });
      else if (c === "V" || c === "Z") r = nums;
      else if (c === "A") r = nums.map(function (x, i) { return i % 7 === 5 ? (up ? wx(x) : x * scaleRel) : (i % 7 === 0 ? x * scaleRel : x); });
      else r = nums.map(function (x, i) { return i % 2 ? x : (up ? wx(x) : x * scaleRel); });
      out += cmd + r.map(function (x) { return f(x); }).join(",");
      nums = [];
    }
    while ((m = re.exec(d))) {
      if (m[1]) { flush(); cmd = m[1]; if (cmd === "Z" || cmd === "z") { out += cmd; cmd = ""; } }
      else nums.push(+m[2]);
    }
    flush();
    return out;
  }
  R.warpPath = warpPath;

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
    closed: { bi: 3, bo: -3, eye: 0, curve: -.2, open: 0 },
    /* grief: brows knotted up in the middle, lids heavy, mouth pulled down, no tears
       (Rusty doesn't cry on-panel except p49, which uses "cry"). */
    grief: { bi: 12, bo: -7, eye: .32, curve: -.95, open: .04, socket: .25, knit: 1 },
    /* hollow: the blank, resigned stare. Flat brows, level lids, small unlit pupils fixed
       straight ahead, a flat mouth, deep sockets. Reads "unhappy but resigned" at wear 1. */
    hollow: { bi: 1, bo: -2, eye: .52, curve: -.18, open: 0, glint: false, pupil: .6, socket: .35 }
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
    /* eye sockets: a soft shadow round each eye, deeper with age, wear and e.socket
       (faint on young faces); cheekbone shadow beneath them from age .4 */
    var sockOp = Math.min(.62, .06 + age * .2 + w * .18 + (e.socket || 0));
    [-1, 1].forEach(function (sd) {
      var ex = sd * 17 + dx;
      sh += '<ellipse cx="' + f(ex) + '" cy="-11" rx="' + f(15 + age * 2) + '" ry="' + f(10 + age * 2.5 + w * 2) + '" fill="' + mix(skin, "#3a2228", .55) + '" opacity="' + f(sockOp) + '"/>';
      if (age > .4) sh += P("M" + f(sd * 44 + dx * .5) + ",4 C" + f(sd * 36 + dx) + ",10 " + f(sd * 28 + dx) + ",14 " + f(sd * 18 + dx) + ",14 C" + f(sd * 28 + dx) + ",20 " + f(sd * 38 + dx) + ",22 " + f(sd * 46 + dx * .5) + ",18Z",
        mix(skin, "#3a2228", .4), null, 0, 'opacity="' + f(Math.min(.4, (age - .4) * .45 + w * .1)) + '"');
    });
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
      if (age > .4) [-1, 1].forEach(function (sd) {
        /* cheekbone arc under the eye, jowl line from the mouth corner to the jaw */
        wr += P("M" + f(sd * 38 + dx * .6) + ",2 Q" + f(sd * 32 + dx) + ",9 " + f(sd * 22 + dx) + ",10", "none", INK, lw * .45);
        if (age > .7) wr += P("M" + f(sd * 27 + dx) + "," + f(42 + w * 3) + " C" + f(sd * 31 + dx) + ",50 " + f(sd * 30 + dx) + ",56 " + f(sd * 22 + dx) + ",62", "none", INK, lw * .5);
      });
      if (age > .9 || e.knit) {
        /* vertical frown lines between the brows */
        wr += P("M" + f(dx - 5) + ",-34 C" + f(dx - 6) + ",-28 " + f(dx - 5) + ",-24 " + f(dx - 3) + ",-20 M" + f(dx + 5) + ",-34 C" + f(dx + 6) + ",-28 " + f(dx + 5) + ",-24 " + f(dx + 3) + ",-20", "none", INK, lw * .45);
      }
      if (w > .6) {
        /* deep wear: a broken extra forehead line and a fold under the bags */
        wr += P("M" + f(dx - 26) + ",-43 Q" + f(dx - 12) + ",-48 " + f(dx - 2) + ",-44 M" + f(dx + 4) + ",-45 Q" + f(dx + 16) + ",-48 " + f(dx + 26) + ",-42", "none", INK, lw * .45);
        [-1, 1].forEach(function (sd) { wr += P("M" + f(sd * 10 + dx) + ",6 Q" + f(sd * 18 + dx) + ",11 " + f(sd * 28 + dx) + ",5", "none", INK, lw * .4); });
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
        var pr = Math.min(4, h1 * .45 + 1.2) * (e.pupil || 1), px = ex + t * 3 + (o.look || 0) * 3.5;
        s += '<circle cx="' + f(px) + '" cy="' + f(ey + .5) + '" r="' + f(pr) + '" fill="' + INK + '"/>';
        if (o.glint !== false && e.glint !== false) s += '<circle cx="' + f(px + 1.3) + '" cy="' + f(ey - 1) + '" r="' + f(pr * .32) + '" fill="#fff"/>';
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
    /* the flush sits on the bulb only; the bridge is skin with a soft shadow line on the
       turned-away side, so it doesn't read as a block between the eyes at small scale */
    var nd = "M" + f(nx - 6 * nz) + "," + f(-5) + " C" + f(nx - 11 * nz) + "," + f(0) + " " + f(nx - 14 * nz) + "," + f(5 * nz) + " " + f(nx - 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx - 11 * nz) + "," + f(21 * nz) + " " + f(nx + 11 * nz) + "," + f(21 * nz) + " " + f(nx + 13 * nz) + "," + f(13 * nz) +
      " C" + f(nx + 14 * nz) + "," + f(5 * nz) + " " + f(nx + 11 * nz) + "," + f(0) + " " + f(nx + 6 * nz) + "," + f(-5) + " C" + f(nx + 3 * nz) + ",-8 " + f(nx - 3 * nz) + ",-8 " + f(nx - 6 * nz) + ",-5Z";
    s += P(nd, nose, null, 0);
    var bsd = t > .05 ? -1 : (t < -.05 ? 1 : (o.light ? (o.light > 0 ? -1 : 1) : -1));
    s += P("M" + f(nx + bsd * 3.5) + ",-17 C" + f(nx + bsd * 4) + ",-11 " + f(nx + bsd * 5.5 * nz) + ",-6 " + f(nx + bsd * 8 * nz) + ",-2", "none", INK, lw * .45, 'opacity=".5"');
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
    kneel: { dy: 70, legs: [[[-12, -115], [-8, -20], [-70, -10]], [[14, -115], [60, -102], [66, -8]]], arms: [[[-46, -228], [-50, -170], [-44, -110]], [[46, -228], [74, -262], [88, -300]]] },
    dragged: { legs: [[[-14, -185], [-44, -110], [-78, -30]], [[14, -185], [-8, -100], [-36, -18]]], arms: [[SH[0], [-70, -330], [-84, -372]], [SH[1], [72, -330], [86, -372]]], stoop: -12 },
    slump: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[SH[0], [-40, -232], [-26, -170]], [SH[1], [56, -232], [50, -170]]], stoop: 14 }
  };
  /* Added poses. A pose with `dy` (seated, kneeling) lowers the torso and head by dy; its legs,
     arms and `carry` are all given in that already-lowered frame (e.g. shoulders at -298+dy).
     `view` gives the pose a default three-quarter turn (see R.person o.view). */
  (function (A) {
    var add = {
      /* seated three-quarter, forearms resting on a table edge at about y=-185 */
      sit3q: { dy: 35, view: .55, stoop: 6, legs: [[[-10, -150], [62, -150], [58, -8]], [[14, -150], [86, -146], [84, -8]]],
        arms: [[[-46, -263], [-22, -196], [50, -186]], [[46, -263], [64, -194], [116, -188]]], carry: [84, -192] },
      /* seated three-quarter, near hand propping the chin, far forearm on the table */
      sitChin: { dy: 35, view: .55, stoop: 10, legs: [[[-10, -150], [62, -150], [58, -8]], [[14, -150], [86, -146], [84, -8]]],
        arms: [[[-46, -263], [-22, -196], [50, -186]], [[46, -263], [72, -198], [24, -290]]] },
      /* seated, slumped, hands in the lap: waiting */
      sitSlump: { dy: 35, view: .3, stoop: 14, legs: [[[-10, -150], [64, -150], [60, -8]], [[14, -150], [84, -146], [84, -8]]],
        arms: [[[-46, -263], [-34, -200], [34, -160]], [[46, -263], [62, -200], [58, -156]]] },
      /* kneeling three-quarter, reaching up and forward (pinning something to a board) */
      kneel3q: { dy: 70, view: .5, stoop: 4, legs: [[[-12, -115], [-8, -20], [-70, -10]], [[14, -115], [60, -102], [66, -8]]],
        arms: [[[-46, -228], [-26, -176], [34, -160]], [[46, -228], [86, -250], [106, -292]]] }
    };
    for (var key in add) A[key] = add[key];
  })(R.POSE);

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
    /* three-quarter view: o.view 0 (front, default) .. ~.7. The far (-x) half of the body
       narrows, the centre line (buttons, tie, nametag) slides toward the near side, and the
       far arm goes behind the torso. Poses may carry a default `view`. */
    var v = Math.max(0, Math.min(.8, o.view != null ? o.view : (pose.view || 0)));
    var wx = function (x) { return v ? (x < 0 ? x * (1 - .45 * v) : x * (1 - .1 * v)) + 12 * v : x; };
    var wpt = function (p) { return [wx(p[0]), p[1]]; };
    var legs = v ? pose.legs.map(function (L) { return [wpt(L[0]), L[1], L[2]]; }) : pose.legs;
    var arms = pose.arms.map(function (a) { return [R_(v ? wpt(a[0]) : a[0]), R_(a[1]), R_(a[2])]; });
    /* legs */
    /* organic construction: shadow side sx (-1 = local -x) follows o.light like R.head */
    var sx = o.light ? (o.light > 0 ? -1 : 1) : -1;
    /* which tubeShape side (a = left normal of travel) faces the shadow: -1 -> a, 1 -> b */
    function shadeOf(pts) {
      var a = pts[0], b = pts[pts.length - 1], dx0 = b[0] - a[0], dy0 = b[1] - a[1];
      return (-dy0 * sx + dx0 * .6) > 0 ? -1 : 1;
    }
    /* a soft fold on the inside of a bend (elbow, knee) */
    function crease(A, len) {
      var u = [A[0][0] - A[1][0], A[0][1] - A[1][1]], d = [A[2][0] - A[1][0], A[2][1] - A[1][1]];
      var mu = Math.hypot(u[0], u[1]) || 1, md = Math.hypot(d[0], d[1]) || 1;
      var bx = u[0] / mu + d[0] / md, by = u[1] / mu + d[1] / md, mb = Math.hypot(bx, by);
      if (mb < .25) return "";
      bx /= mb; by /= mb;
      var e = A[1];
      return P("M" + pt([e[0] + bx * 3, e[1] + by * 3]) + " Q" + pt([e[0] + bx * (len * .6) - by * 3, e[1] + by * (len * .6) + bx * 3]) + " " + pt([e[0] + bx * len, e[1] + by * len]), "none", INK, lw * .55, 'opacity=".7"');
    }
    var legW = of.gown ? 22 : 34;
    legs.forEach(function (L) {
      if (of.gown) s += tube(L, 22, 17, mix(skin, "#333", .2), lw, { bulge: 2, shade: shadeOf(L) });
      else {
        s += tube(L, legW + 6, legW - 7, pants, lw, { bulge: 3, shade: shadeOf(L) });
        s += crease(L, 16);
        var fa = L[2];
        s += P("M" + f(fa[0] - 12) + "," + f(fa[1] - 18) + " q6,4 12,0 M" + f(fa[0] - 4) + "," + f(fa[1] - 28) + " q7,3 13,-1", "none", INK, lw * .45, 'opacity=".55"');
      }
      var ft = L[2];
      s += P("M" + f(ft[0] - 16) + "," + f(ft[1] + 8) + " L" + f(ft[0] - 15) + "," + f(ft[1] - 10) + " C" + f(ft[0] - 4) + "," + f(ft[1] - 17) + " " + f(ft[0] + 10) + "," + f(ft[1] - 13) + " " + f(ft[0] + 16) + "," + f(ft[1] - 6) +
        " C" + f(ft[0] + 30) + "," + f(ft[1] - 4) + " " + f(ft[0] + 32) + "," + f(ft[1] + 6) + " " + f(ft[0] + 27) + "," + f(ft[1] + 8) + "Z", of.boots, INK, lw * .8);
    });
    if (of.stains) s += '<circle cx="' + f(legs[1][1][0] + 4) + '" cy="' + f(legs[1][1][1] + 10) + '" r="9" fill="#4a1512" opacity=".7"/>';
    /* seated (thighs near horizontal): a flatter pelvis whose underside sits on the seat line
       just below the thighs, instead of the standing pelvis hanging under them like a cushion */
    var seated = dy && Math.abs(legs[0][1][1] - legs[0][0][1]) < 30;
    if (seated && !of.gown) {
      var sy = legs[0][0][1];
      s += P(warpPath("M-41," + f(-192 + dy) + " L41," + f(-192 + dy) + " C46," + f(sy - 22) + " 50," + f(sy - 6) + " 44," + f(sy + 12) +
        " C30," + f(sy + 17) + " -30," + f(sy + 17) + " -42," + f(sy + 13) + " C-50," + f(sy + 4) + " -48," + f(sy - 18) + " -41," + f(-192 + dy) + "Z", wx, 1), pants, INK, lw * .8) +
        P(warpPath("M-30," + f(sy + 2) + " C-12," + f(sy + 8) + " 12," + f(sy + 8) + " 30," + f(sy + 2), wx, 1), "none", INK, lw * .45, 'opacity=".5"');
    } else if (!of.gown) s += P(warpPath("M-41," + f(-192 + dy) + " L41," + f(-192 + dy) + " C44," + f(-178 + dy) + " 43," + f(-166 + dy) + " 35," + f(-157 + dy) +
      " C20," + f(-150 + dy) + " -20," + f(-150 + dy) + " -35," + f(-157 + dy) + " C-43," + f(-166 + dy) + " -44," + f(-178 + dy) + " -41," + f(-192 + dy) + "Z", wx, 1), pants, INK, lw * .8);
    function armSvgFar(A) { return armSvg(A); }
    /* torso group (rotated by stoop around hip) */
    var tg = "";
    var torso = of.gown ?
      "M-46,-305 C-62,-240 -70,-150 -72,-60 L72,-60 C70,-150 62,-240 46,-305 C24,-316 -24,-316 -46,-305Z" :
      /* sloped shoulders from the neck base (±18,-321) down to the caps (±54,-298), mild paunch */
      "M-18,-321 C-32,-317 -47,-311 -54,-298 C-60,-272 -57,-240 -51,-216 C-48,-200 -45,-190 -40,-182 L40,-182 C" +
      (of.belly ? "78,-200 76,-262 54,-298" : "45,-190 48,-200 51,-216 C57,-240 60,-272 54,-298") + " C47,-311 32,-317 18,-321 C8,-324 -8,-324 -18,-321Z";
    var tcid = k.uid("torso");
    tg += '<defs><clipPath id="' + tcid + '"><path d="' + torso + '"/></clipPath></defs>';
    tg += P(torso, shirt, null, 0);
    /* shadow side: darker fill + halftone, then folds from the armpits toward the belly */
    var shd = "M-18,-324 C-32,-319 -48,-312 -58,-298 C-64,-270 -60,-238 -54,-214 C-50,-198 -46,-188 -42,-180 L-14,-180 C-24,-220 -30,-268 -22,-322Z";
    if (sx > 0) shd = warpPath(shd, function (x) { return -x; }, -1);
    var tsh = P(shd, mix(shirt, "#2a2018", .35), null, 0, 'opacity=".55"') + R.tone(k, shd, .3) +
      P("M-44,-282 C-36,-260 -30,-240 -22,-224 M44,-282 C36,-262 30,-244 24,-230 M-30,-204 C-12,-196 12,-196 30,-204", "none", INK, lw * .5, 'opacity=".45"');
    tg += '<g clip-path="url(#' + tcid + ')">' + tsh + "</g>";
    tg += P(torso, "none", INK, lw);
    tg += P(sx < 0 ? "M-18,-321 C-32,-317 -47,-311 -54,-298 C-60,-272 -57,-240 -51,-216 C-48,-200 -45,-190 -40,-182" : "M18,-321 C32,-317 47,-311 54,-298 C60,-272 57,-240 51,-216 C48,-200 45,-190 40,-182", "none", INK, lw * 1.8);
    if (of.flannel) {
      for (var i = -40; i <= 40; i += 16) tg += P("M" + i + ",-310 L" + (i + 2) + ",-184", "none", mix(shirt, "#1a2a3a", .5), 4, 'opacity=".55"');
      for (var j = -296; j < -186; j += 18) tg += P("M-50," + j + " L52," + j, "none", mix(shirt, "#9a3030", .6), 3, 'opacity=".5"');
    }
    if (of.jacket || of.carnival) {
      tg += P("M-16,-320 L0,-262 L16,-320Z", of.under, INK, lw * .6);
      tg += P("M-4,-316 L4,-316 L7,-268 L0,-256 L-7,-268Z", of.tie, INK, lw * .6);
      if (of.jacket) tg += P("M-18,-320 L-4,-262 L-12,-226 M18,-320 L4,-262 L12,-226", "none", INK, lw * .7) +
        '<circle cx="3" cy="-228" r="3" fill="' + INK + '"/><circle cx="3" cy="-206" r="3" fill="' + INK + '"/>';
    } else if (!of.gown) {
      tg += P("M-18,-321 L0,-298 L-5,-288 L-24,-308Z M18,-321 L0,-298 L5,-288 L24,-308Z", mix(shirt, "#fff", .1), INK, lw * .6);
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
    if (v) {
      var sr = 1 - .3 * v;
      tg = tg.replace(/ d="([^"]*)"/g, function (m, d) { return ' d="' + warpPath(d, wx, sr) + '"'; })
        .replace(/ cx="(-?[\d.]+)"/g, function (m, x) { return ' cx="' + f(wx(+x)) + '"'; })
        .replace(/ rx="(-?[\d.]+)"/g, function (m, x) { return ' rx="' + f(+x * (1 - .1 * v)) + '"'; })
        .replace(/translate\((-?[\d.]+),/g, function (m, x) { return "translate(" + f(wx(+x)) + ","; });
      s += armSvgFar(arms[0]);
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
    var sleeve = shirt;
    function armSvg(A) {
      var el = A[1], hd = A[2], wr = [hd[0] + (el[0] - hd[0]) * .15, hd[1] + (el[1] - hd[1]) * .15];
      /* tapered sleeve (heavier ink on the shadow side), elbow fold, cuff, then a small
         oriented mitten hand centred on the hand point (same footprint as the old r=11 dot) */
      var arm = [A[0], el, wr];
      var out = tube(arm, 29, 20, shirt, lw, { bulge: 2, shade: shadeOf(arm) }) + crease(arm, 12);
      var ang = Math.atan2(hd[1] - el[1], hd[0] - el[0]) * 180 / Math.PI, ts = A === arms[0] ? 1 : -1;
      var hand = P(smooth([[-9, -9], [2, -11], [12, -8], [16, -1], [13, 7], [3, 10], [-8, 9], [-11, 0]], true), skin, INK, lw * .75) +
        P(smooth([[-2, -8 * ts], [6, -15 * ts], [12, -13 * ts], [9, -7 * ts]]), skin, INK, lw * .6) +
        P("M8,-3 L15,-2 M8,3 L14,4", "none", INK, lw * .4, 'opacity=".7"');
      out += '<g transform="translate(' + f(hd[0]) + "," + f(hd[1]) + ") rotate(" + f(ang) + ')">' + hand + "</g>";
      return out;
    }
    if (!v) s += armSvg(arms[0]);
    s += ps;
    /* carried object */
    if (o.carry && pose.carry) { var cp = R_(pose.carry); s += '<g transform="translate(' + f(cp[0]) + "," + f(cp[1] + dy * 0) + ')">' + o.carry + "</g>"; }
    s += armSvg(arms[1]);
    /* neck + head */
    var R0 = function (p) { var q = rot(p, stoop, [0, -185]); return [q[0], q[1] + dy]; };
    var nb = R0([wx(0), -300]), nt = R0([wx(0), -328]);
    var neck = tube([nb, nt], 28, 24, skin, lw, { shade: sx });
    if (w > .5) neck += P("M" + pt([nb[0] - 6, nb[1] - 2]) + " L" + pt([nt[0] - 4, nt[1] + 4]) + " M" + pt([nb[0] + 6, nb[1] - 2]) + " L" + pt([nt[0] + 4, nt[1] + 4]), "none", INK, lw * .45, 'opacity="' + f((w - .5) * 1.4) + '"');
    var hc = R0([wx(0) + 2, -362]);
    var head = R.head(k, { x: hc[0], y: hc[1], s: .52, rot: stoop + (o.headTilt || 0), ch: ch, expr: o.expr, turn: o.turn == null ? .25 + .45 * v : o.turn, wear: w, light: o.light, lw: 5.5, hat: o.hat, look: o.look, glint: o.glint });
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
    clap: { arms: [[PSH[0], [50, -330], [70, -380]], [PSH[1], [90, -340], [76, -386]]] },
    /* crouch-hover (p48): squatting low, hands open close to someone small without touching.
       dy frame: legs and arms are given in the lowered frame (shoulders at -415 + dy). */
    crouch: { dy: 138, lean: 8, legs: [[[-18, -120], [62, -112], [-6, -14]], [[18, -120], [92, -100], [44, -14]]],
      arms: [[[-40, -277], [30, -214], [112, -190]], [[40, -277], [118, -236], [184, -214]]] },
    /* arm-on-shoulder (p54): the near hand resting on the shoulder of someone beside it at +x */
    shoulder: { arms: [[PSH[0], [-54, -290], [-52, -150]], [PSH[1], [100, -392], [128, -306]]] }
  };
  R.player = function (k, o) {
    o = o || {};
    var v = PLAYER_SUITS[(o.variant || 0) % 3], pose = typeof o.pose === "object" ? o.pose : (R.PPOSE[o.pose || "stand"] || R.PPOSE.stand);
    /* pose.dy lowers the body (crouch); pose.legs, pose.arms are then in the lowered frame */
    var pdy = pose.dy || 0, lean = o.lean != null ? o.lean : (pose.lean || 0), hipP = [0, -258 + pdy];
    var Rt = function (p) { return rot(p, lean, hipP); };
    /* joints 0..1 bends elbows and knees the wrong way: the middle point is reflected across
       the line from the root to the end (1 = fully reversed); knees also kick back */
    var jn = o.joints || 0;
    function wrongBend(A, kick) {
      if (!jn) return A;
      var a = A[0], b = A[2], m = A[1], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy || 1;
      var t = ((m[0] - a[0]) * vx + (m[1] - a[1]) * vy) / L2, q = [a[0] + vx * t, a[1] + vy * t];
      return [a, [m[0] + 2 * jn * (q[0] - m[0]) - (kick || 0) * jn, m[1] + 2 * jn * (q[1] - m[1])], b];
    }
    var arms = (o.arms || pose.arms).map(function (a) { return wrongBend(a.map(Rt)); });
    var lw = o.lw || 4, s = "", organic = o.tube !== false;
    /* legs */
    var legs = (o.legs || pose.legs || [[[-18, -258], [-24, -130], [-28, -14]], [[18, -258], [24, -130], [30, -14]]]).map(function (L) { return wrongBend(L, 22); });
    legs.forEach(function (L) {
      s += organic ? tube(L, 30, 21, v.a, lw, { bulge: 2, shade: L[2][0] > L[0][0] ? 1 : -1 }) : limb(L, 26, v.a, lw);
      var ft = L[2];
      s += '<ellipse cx="' + f(ft[0] + 18) + '" cy="' + f(ft[1] + 4) + '" rx="36" ry="12" fill="#2a0c0e" stroke="' + INK + '" stroke-width="' + lw + '"/>';
    });
    /* torso */
    var cid = k.uid("pt"), torso = "M-40,-425 C-72,-380 -66,-300 -48,-255 L48,-255 C66,-300 72,-380 40,-425 C20,-432 -20,-432 -40,-425Z";
    var tg = '<defs><clipPath id="' + cid + '"><path d="' + torso + '"/></clipPath></defs>' + P(torso, v.a, null, 0) +
      '<g clip-path="url(#' + cid + ')">' + [-48, -16, 16, 48].map(function (x) { return '<rect x="' + (x - 8) + '" y="-440" width="16" height="200" fill="' + v.b + '" opacity=".8"/>'; }).join("") +
      R.tone(k, "M-80,-440 L-20,-440 L-20,-240 L-80,-240Z", .4) + "</g>" + P(torso, "none", INK, lw) +
      [-385, -340, -295].map(function (y) { return '<circle cx="0" cy="' + y + '" r="8" fill="' + v.b + '" stroke="' + INK + '" stroke-width="2.5"/>'; }).join("");
    s += '<g transform="rotate(' + f(lean) + " 0 " + f(-258 + pdy) + ')"><g transform="translate(0,' + pdy + ')">' + tg + "</g></g>";
    /* arms + gloves */
    arms.forEach(function (A) {
      s += organic ? tube(A, 22, 15, v.a, lw, { bulge: 1.5 }) : limb(A, 18, v.a, lw);
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
    var nk = Rt([0, -432 + pdy]), ruff = "";
    for (var i = 0; i <= 20; i++) {
      var a = i / 20 * Math.PI * 2, r = i % 2 ? 30 : 50;
      ruff += (i ? " L" : "M") + f(nk[0] + Math.cos(a) * r) + "," + f(nk[1] + Math.sin(a) * r * .42);
    }
    s += P(ruff + "Z", "#ece4d0", INK, 3);
    /* head */
    var hc = Rt([4, -478 + pdy]);
    s += R.playerHead(k, { x: hc[0], y: hc[1], s: .62, rot: lean + (o.headTilt || 0), variant: o.variant, glow: o.glow, grin: o.grin, hat: o.hat, paint: o.paint, mouth2: o.mouth2, pin: o.pin });
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
    var grey = o.paint === "grey";
    s += P(face, grey ? "#cfcbc1" : "#f1ebde", INK, 3.5);
    if (grey) s += R.tone(k, "M-40,-80 L40,-80 L40,70 L-40,70Z", .12) +
      P("M-12,-70 l3,12 l-5,9 M30,-30 l-7,4 l2,9 l-6,6 M-34,0 l7,5 l-1,8", "none", INK, 1, 'opacity=".5"');
    s += R.tone(k, "M14,-74 C30,-60 40,-30 36,-10 C36,28 22,58 0,64 L40,70 L40,-80Z", .25);
    /* cracks */
    s += P("M-30,-40 l8,6 l-2,9 l7,5 M22,-56 l-4,10 l6,6 M10,40 l6,-6 l7,3 M-26,24 l9,2", "none", INK, 1.2, 'opacity=".55"');
    /* eyes: black diamonds, pinprick light */
    [-1, 1].forEach(function (sd) {
      var ex = sd * 15, ey = -16;
      s += P("M" + ex + "," + (ey - 26) + " L" + (ex + 10) + "," + ey + " L" + ex + "," + (ey + 24) + " L" + (ex - 10) + "," + ey + "Z", INK);
      if (o.pin) s += '<circle cx="' + ex + '" cy="' + ey + '" r="1.3" fill="' + (o.glow || "#fff") + '"/>';
      else s += '<circle cx="' + ex + '" cy="' + ey + '" r="7" fill="' + g + '" opacity=".25"/><circle cx="' + ex + '" cy="' + ey + '" r="2.2" fill="' + g + '"/>';
    });
    s += P("M-26,-50 Q-15,-60 -4,-50 M4,-50 Q15,-60 26,-50", "none", INK, 2.5);
    /* painted grin */
    s += P("M-34,6 C-22,46 22,46 34,6 C24,26 -24,26 -34,6Z", "#a3121a", INK, 2.5);
    if ((o.grin == null ? 1 : o.grin) > .5) {
      s += P("M-24,18 C-12,36 12,36 24,18 C12,27 -12,27 -24,18Z", INK);
      var teeth = ""; for (var i = -18; i <= 18; i += 6) teeth += "M" + i + "," + f(22 + Math.abs(i) * -.15) + " l0,6 ";
      s += P(teeth, "none", "#e9e1cf", 2);
    } else s += P("M-22,20 C-10,30 10,30 22,20", "none", INK, 3);
    if (o.mouth2) {
      /* the real mouth: small, human, down-turned, showing below and off-centre from the paint */
      s += P("M-4,47 C1,44 9,44 15,48 C9,52 1,52 -4,47Z", "#7b4a44", INK, 1.6) + P("M-4,47 C2,49 9,49 15,48", "none", INK, 1.4) +
        P("M-6,50 l-3,3 M17,50 l3,3", "none", INK, 1, 'opacity=".6"');
    }
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
  function gT(o) {
    return 'transform="translate(' + f(o.x || 0) + "," + f(o.y || 0) + ") rotate(" + f(o.rot || 0) + ") scale(" + f((o.s || 1) * (o.flip || 1) * 1000) / 1000 + "," + f((o.s || 1) * 1000) / 1000 + ')"';
  }
  /* R.grip(k, o): one big working hand gripping a vertical bundle (mop strands, a bar, a handle).
     Local frame: wrist at -x, the fingers curl around the bundle at x≈0..40; we look at the
     finger side. Knuckles, overlapping fingers (pinky first), a thumb crossing the grip, DIP
     creases, chapped knuckles. Promoted from artist A's p03 helper.
     o = {x,y,s,rot,flip, ring, skin, wear, sleeve (cuff colour, default work olive),
          arm (default true: bare forearm + rolled cuff; false: a short wrist only),
          rolled (default true; false = a full sleeve down to the wrist)} */
  R.grip = function (k, o) {
    o = o || {};
    var SK = handSkin(o), SKD = mix(SK, "#6a3a30", .38), SKL = mix(SK, "#fff3e0", .35), CHAP = mix(SK, "#c9503a", .42), SLV = o.sleeve || "#7f8b6c";
    var g = "", arm = o.arm !== false;
    if (arm && o.rolled === false) {
      g += P("M-300,-70 C-220,-66 -150,-52 -92,-42 L-90,48 C-150,56 -220,64 -300,70Z", SLV, INK, 4.5);
      g += P("M-120,-46 C-112,-14 -112,22 -118,52", "none", INK, 2.5) + R.tone(k, "M-300,26 C-220,30 -150,38 -92,32 L-90,48 C-150,56 -220,64 -300,70Z", .45);
      g += P("M-240,-30 C-210,-20 -180,-26 -150,-16 M-250,16 C-220,24 -190,18 -160,26", "none", mix(SLV, INK, .45), 2);
    } else if (arm) {
      g += P("M-260,-58 C-200,-56 -150,-48 -96,-40 L-92,46 C-150,52 -200,58 -260,62Z", SK, INK, 4.5);
      g += R.tone(k, "M-260,22 C-200,26 -150,34 -94,30 L-92,46 C-150,52 -200,58 -260,62Z", .45);
      g += P("M-230,-40 l6,-6 M-210,-44 l7,-5 M-190,-38 l6,-7 M-170,-40 l7,-5 M-150,-34 l6,-6 M-220,-24 l6,-5 M-180,-22 l7,-5 M-140,-20 l6,-6", "none", mix(SK, "#5a3020", .6), 1.6);
      g += P("M-200,-6 C-170,0 -140,-4 -110,4", "none", SKD, 2.2);
      g += P("M-300,-74 L-226,-70 C-216,-30 -214,30 -224,76 L-300,80Z", SLV, INK, 4.5);
      g += P("M-246,-70 C-238,-30 -236,30 -246,78", "none", INK, 2.5) + R.tone(k, "M-300,20 L-222,24 L-224,76 L-300,80Z", .45);
    } else {
      g += P("M-150,-40 C-130,-44 -112,-44 -96,-40 L-92,46 C-110,50 -130,50 -150,46 C-156,20 -156,-14 -150,-40Z", SK, INK, 4.5);
      g += R.tone(k, "M-150,22 C-130,26 -112,30 -94,30 L-92,46 C-110,50 -130,50 -150,46Z", .45);
    }
    /* back of hand / palm mass */
    g += P("M-104,-44 C-80,-60 -40,-64 -18,-56 C-6,-50 -2,-36 -6,-24 L-8,48 C-30,60 -70,60 -98,48 C-110,20 -112,-20 -104,-44Z", SK, INK, 4.5);
    g += P("M-70,-56 C-60,-62 -44,-64 -32,-60 M-48,-58 C-40,-62 -30,-62 -22,-58", "none", SKD, 2);
    g += R.tone(k, "M-104,-44 C-110,-20 -110,20 -98,48 C-80,56 -60,58 -50,56 C-70,30 -76,-10 -70,-56Z", .35);
    /* fingers, pinky first so each upper finger overlaps the one below: [y, h, reach] */
    [[40, 19, 28], [17, 22, 40], [-7, 24, 46], [-32, 23, 40]].forEach(function (F, i) {
      var y = F[0], h = F[1], r = F[2], t = y - h / 2, b = y + h / 2;
      var d = "M-30," + f(t + 2) + " C-10," + f(t - 2) + " " + f(r - 18) + "," + f(t - 3) + " " + f(r - 4) + "," + f(t + 1) +
        " C" + f(r + 8) + "," + f(t + 5) + " " + f(r + 8) + "," + f(b - 3) + " " + f(r - 4) + "," + f(b) +
        " C" + f(r - 14) + "," + f(b + 2) + " -10," + f(b + 1) + " -30," + f(b - 1) + "Z";
      g += P(d, SK);
      g += P("M-16," + f(t + .5) + " C" + f(r - 22) + "," + f(t - 3) + " " + f(r - 18) + "," + f(t - 3) + " " + f(r - 4) + "," + f(t + 1) +
        " C" + f(r + 8) + "," + f(t + 5) + " " + f(r + 8) + "," + f(b - 3) + " " + f(r - 4) + "," + f(b) +
        " C" + f(r - 14) + "," + f(b + 2) + " -10," + f(b + 1) + " -18," + f(b - .5), "none", INK, i === 3 ? 4.5 : 3.6);
      g += P("M-22," + f(b - 3) + " C" + f(r * .4) + "," + f(b) + " " + f(r - 10) + "," + f(b + 1) + " " + f(r - 4) + "," + f(b - 1) + " L" + f(r - 4) + "," + f(y + 2) + " C" + f(r * .4) + "," + f(y + 4) + " -10," + f(y + 3) + " -22," + f(y + 1) + "Z", SKD, null, 0, 'opacity=".35"');
      g += P("M" + f(r - 16) + "," + f(t + 4) + " q-4," + f(h * .35) + " 0," + f(h * .7), "none", INK, 1.8);
      g += P("M" + f(r - 22) + "," + f(t + 6) + " q-3," + f(h * .25) + " 0," + f(h * .5), "none", SKD, 1.4);
      g += '<ellipse cx="' + f(r - 2) + '" cy="' + f(y - 2) + '" rx="5" ry="' + f(h * .26) + '" fill="' + CHAP + '" opacity=".55"/>';
      g += P("M" + f(r - 6) + "," + f(t + 4) + " c4,1 6,3 6,6", "none", SKL, 2, 'opacity=".8"');
      if (o.ring && i === 1) g += P("M-14," + f(t - 1) + " C-10," + f(t + 4) + " -10," + f(b - 4) + " -14," + f(b + 1) + " L-6," + f(b + 1) + " C-2," + f(b - 4) + " -2," + f(t + 4) + " -6," + f(t - 1) + "Z", "#c9a23a", INK, 2) +
        P("M-11," + f(t + 3) + " v" + f(h - 6), "none", "#f3dc8a", 1.5);
    });
    /* thumb, crossing over index and middle, nail at the tip */
    g += P("M-96,30 C-86,6 -60,-14 -30,-24 C-6,-32 14,-34 26,-28 C34,-22 30,-10 20,-8 C2,-6 -20,-2 -40,10 C-58,22 -70,40 -84,50Z", SK, INK, 4.5);
    g += P("M10,-30 C20,-33 28,-30 28,-24 C28,-18 22,-15 14,-16 C10,-20 8,-26 10,-30Z", mix(SK, "#fff3e8", .4), INK, 2);
    g += P("M-14,-24 q-3,8 2,16", "none", INK, 2) + P("M-60,-2 C-50,-8 -40,-12 -30,-14", "none", SKD, 2);
    g += R.tone(k, "M-84,50 C-70,40 -58,22 -40,10 C-20,-2 2,-6 20,-8 L18,-2 C-10,4 -40,20 -60,46Z", .4);
    g += '<ellipse cx="-12" cy="-20" rx="7" ry="4" fill="' + CHAP + '" opacity=".5"/>';
    return "<g " + gT(o) + ">" + g + "</g>";
  };
  /* Fist gripping a vertical bar at x≈36 (fingers wrap to +x). o.ring = wedding band, o.sleeve = cuff colour.
     Drawn with R.grip (knuckles, overlapping fingers); same frame and footprint as before. */
  R.fist = function (k, o) {
    o = o || {};
    var inner = R.grip(k, { x: 16, y: -2, s: .86, ring: o.ring, skin: o.skin, wear: o.wear, sleeve: o.sleeve, arm: !!o.sleeve, rolled: false });
    return "<g " + gT(o) + ">" + inner + "</g>";
  };
  /* Open hand, palm toward viewer, fingers up. o.curl 0..1 bends fingers in.
     Same skeleton as before (finger bases, lengths and angles, so panel overlays still line up),
     drawn as tapered three-segment fingers with joint creases and fingertip pads, a thumb that
     grows out of a fleshy thenar mound, and palm lines. */
  R.openHand = function (k, o) {
    o = o || {};
    var sk = handSkin(o), dk = mix(sk, "#5a3a3a", .35), lt = mix(sk, "#fff3e0", .3), c = o.curl || 0, s = "";
    if (o.sleeve) s += P("M-36,30 C-40,110 -46,190 -46,260 L46,260 C46,190 40,110 36,30 C12,38 -12,38 -36,30Z", o.sleeve, INK, 4) +
      P("M-38,48 C-12,58 12,58 38,48", "none", INK, 3) + R.tone(k, "M10,40 C30,40 36,36 38,48 L46,260 L20,260Z", .4);
    /* wrist */
    s += P("M-30,24 C-32,36 -34,44 -36,52 L36,52 C34,44 32,36 30,24Z", sk, INK, 3.5);
    var bases = [[-26, -26], [-9, -32], [8, -31], [24, -24]], lens = [54, 64, 60, 46], angs = [-104, -94, -84, -72];
    var fingers = "";
    bases.forEach(function (b, i) {
      var a = angs[i] * Math.PI / 180, L = lens[i];
      var m = [b[0] + Math.cos(a) * L * .55, b[1] + Math.sin(a) * L * .55];
      var a2 = a + c * 1.4, tip = [m[0] + Math.cos(a2) * L * .45, m[1] + Math.sin(a2) * L * .45];
      var j2 = [m[0] + Math.cos(a2) * L * .22, m[1] + Math.sin(a2) * L * .22];
      var w0 = 19 - i * .5, w1 = 14.5 - i * .6;
      fingers += tube([b, m, tip], w0, w1, sk, 3.2, { per: 5 });
      /* joint creases across the finger (palm side) */
      [m, j2].forEach(function (q, qi) {
        var nx = -Math.sin(qi ? a2 : (a + a2) / 2), ny = Math.cos(qi ? a2 : (a + a2) / 2), hw = (qi ? w1 + 2 : w0) * .36;
        fingers += P("M" + pt([q[0] - nx * hw, q[1] - ny * hw]) + " Q" + pt([q[0] + Math.cos(a2) * 2, q[1] + Math.sin(a2) * 2]) + " " + pt([q[0] + nx * hw, q[1] + ny * hw]), "none", dk, 1.4, 'opacity=".5"');
      });
      /* fingertip pad */
      fingers += '<ellipse cx="' + f(tip[0] - Math.cos(a2) * 4) + '" cy="' + f(tip[1] - Math.sin(a2) * 4) + '" rx="' + f(w1 * .3) + '" ry="' + f(w1 * .38) + '" fill="' + lt + '" opacity=".75"/>';
      if (o.ring && i === 2) fingers += limb([[b[0] + Math.cos(a) * 15, b[1] + Math.sin(a) * 15], [b[0] + Math.cos(a) * 19, b[1] + Math.sin(a) * 19]], w0 - 1, "#d9b23a", 1.6);
    });
    s += fingers;
    /* thumb (under the palm's edge, so it grows out of the thenar mound) */
    s += tube([[-22, 18], [-50, -8], [-66, -34]], 24, 16, sk, 3.4, { per: 5, bulge: 3 });
    s += P("M-58,-18 Q-54,-22 -50,-18", "none", dk, 1.5);
    s += '<ellipse cx="-63" cy="-30" rx="5" ry="6" fill="' + lt + '" opacity=".7"/>';
    /* palm, with heel pads */
    s += P("M-40,-30 C-46,-6 -40,26 -30,36 C-18,46 18,46 30,38 C42,24 46,-6 38,-30 C26,-36 14,-38 0,-38 C-16,-38 -30,-36 -40,-30Z", sk, INK, 4);
    s += P("M38,-30 C46,-6 42,24 30,38", "none", INK, 6, 'opacity=".55"');
    /* palm lines + mounds */
    s += P("M-32,-10 C-12,-2 12,-6 34,-18 M-30,6 C-12,14 8,12 24,4 M-22,32 C-30,16 -30,0 -22,-14", "none", dk, 2.2);
    s += P("M-28,-22 C-14,-26 0,-26 14,-24", "none", dk, 1.4, 'opacity=".6"');
    s += R.tone(k, "M14,-36 C30,-34 38,-30 38,-30 C46,-6 42,24 30,38 C22,42 16,44 12,44 C20,20 20,-10 14,-36Z", .35);
    if (o.tremble) s += P("M-80,-60 l-10,-6 M-84,-40 l-12,0 M76,-70 l10,-6 M80,-50 l12,0", "none", INK, 2.5);
    return "<g " + gT(o) + ">" + s + "</g>";
  };

  /* ---------- back view ---------- */
  /* R.personBack(k, o): a figure seen from behind (walking away, looking at something).
     Same proportions, anchors, outfits and wear as R.person: feet at 0, hips at -185,
     shoulders at -298, Rusty ~400 tall. Developed from artist B's p09 helper.
     o = {x,y,s,flip, ch, outfit, pose ("stand" | "walk" | "slump"), wear, stoop, light (1 = lit
          from the right), rim (rim-light colour, e.g. "#ffe48a"; drawn on the lit side),
          holdL / holdR (svg drawn at the left / right hand, e.g. a thermos), lw, headTurn (-1..1:
          the skull turns a little, showing an ear and the edge of the mustache)} */
  var BPOSE = {
    stand: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[[-46, -298], [-58, -236], [-58, -170]], [[46, -298], [60, -238], [64, -176]]] },
    walk: { legs: [[[-17, -185], [-22, -94], [-24, -6]], [[17, -185], [22, -104], [24, -30]]], arms: [[[-46, -298], [-60, -232], [-62, -166]], [[46, -298], [52, -242], [50, -200]]], lift: 1 },
    slump: { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [19, -95], [20, -8]]], arms: [[[-46, -298], [-52, -234], [-46, -172]], [[46, -298], [54, -234], [50, -172]]], stoop: 14 }
  };
  R.BPOSE = BPOSE;
  R.personBack = function (k, o) {
    o = o || {};
    var ch = o.ch || "rusty", c = R.CH[ch], of = typeof o.outfit === "object" ? o.outfit : R.OUTFIT[o.outfit || "work"];
    var pose = typeof o.pose === "object" ? o.pose : (BPOSE[o.pose || "stand"] || BPOSE.stand);
    var w = o.wear || 0, lw = o.lw || 4, rim = o.rim, lt = o.light || 1;
    var stoop = (o.stoop != null ? o.stoop : (pose.stoop || 0)) + (ch.indexOf("rusty") === 0 ? w * 12 : 0);
    var shirt = mix(of.shirt, "#77746c", w * .5), pants = mix(of.pants, "#3a3a3a", w * .4), skin = mix(c.skin, "#b3aea3", w * .6);
    var hair = mix(c.hair, "#dcd8cf", Math.min(1, (c.grey || 0) + w * .8));
    var hunch = stoop * .9, s = "";
    /* legs + heels (boots seen from behind) */
    pose.legs.forEach(function (L, i) {
      s += tube(L, of.gown ? 22 : 36, of.gown ? 20 : 30, of.gown ? mix(skin, "#333", .2) : pants, lw, { bulge: 3, shade: lt > 0 ? (i ? 0 : 1) : (i ? -1 : 0) });
      var ft = L[2], lifted = pose.lift && i === 1;
      if (lifted) s += P("M" + f(ft[0] - 15) + "," + f(ft[1] - 4) + " C" + f(ft[0] - 16) + "," + f(ft[1] + 14) + " " + f(ft[0] + 16) + "," + f(ft[1] + 14) + " " + f(ft[0] + 15) + "," + f(ft[1] - 4) + " C" + f(ft[0] + 8) + "," + f(ft[1] - 10) + " " + f(ft[0] - 8) + "," + f(ft[1] - 10) + " " + f(ft[0] - 15) + "," + f(ft[1] - 4) + "Z", mix(of.boots, "#000", .35), INK, lw * .8) +
        P("M" + f(ft[0] - 10) + "," + f(ft[1] + 4) + " h20", "none", "#5a4a3a", 2);
      else s += P("M" + f(ft[0] - 17) + "," + f(ft[1] + 9) + " L" + f(ft[0] - 16) + "," + f(ft[1] - 10) + " C" + f(ft[0] - 8) + "," + f(ft[1] - 16) + " " + f(ft[0] + 8) + "," + f(ft[1] - 16) + " " + f(ft[0] + 16) + "," + f(ft[1] - 10) + " L" + f(ft[0] + 17) + "," + f(ft[1] + 9) + "Z", of.boots, INK, lw * .8);
    });
    if (!of.gown) {
      s += P("M-20,-150 C-22,-110 -18,-70 -20,-30 M20,-150 C22,-110 18,-70 20,-30", "none", INK, 1.6, 'opacity=".35"');
      s += P("M-41,-194 C-20,-190 20,-190 41,-194 L38,-160 C20,-150 -20,-150 -38,-160Z", pants, INK, lw * .8);
      s += P("M0,-190 V-156", "none", INK, 1.8, 'opacity=".6"');
      if (!of.jacket) s += P("M-34,-178 h22 l-2,24 h-18Z M12,-178 h22 l-2,24 h-18Z", "none", INK, 1.8, 'opacity=".65"');
    }
    /* neck */
    s += limb([[0, -312 + hunch * .5], [0, -334 + hunch]], 40, skin, lw);
    /* torso from the back */
    var top = -305 + hunch * .3;
    var torso = of.gown ? "M-46," + top + " C-62,-240 -70,-150 -72,-60 L72,-60 C70,-150 62,-240 46," + top + " C24," + (top - 11) + " -24," + (top - 11) + " -46," + top + "Z" :
      "M-46," + top + " C-56,-268 -50,-220 -42,-184 C-20,-180 20,-180 42,-184 C50,-220 56,-268 46," + top + " C24," + (top - 11) + " -24," + (top - 11) + " -46," + top + "Z";
    s += P(torso, shirt, INK, lw);
    if (of.jacket) {
      s += P("M0,-300 V-184 M0,-214 l-3,30", "none", INK, 2, 'opacity=".7"');
      s += P("M-40,-286 C-30,-250 -32,-220 -36,-190 M40,-286 C30,-250 32,-220 36,-190", "none", INK, 1.4, 'opacity=".4"');
    } else if (!of.gown) {
      s += P("M-46,-282 C-20,-276 20,-276 46,-282", "none", INK, 1.8, 'opacity=".7"');
      s += P("M0,-278 V-200 M-30,-262 C-24,-250 -26,-236 -34,-226 M30,-262 C24,-250 26,-236 34,-226 M-22,-204 C-12,-198 12,-198 22,-204", "none", INK, 1.6, 'opacity=".5"');
    }
    if (of.flannel) {
      for (var i = -40; i <= 40; i += 16) s += P("M" + i + ",-306 L" + (i + 2) + ",-186", "none", mix(shirt, "#1a2a3a", .5), 4, 'opacity=".5"');
      for (var j = -292; j < -186; j += 18) s += P("M-50," + j + " L52," + j, "none", mix(shirt, "#9a3030", .6), 3, 'opacity=".45"');
    }
    if (of.stains) s += '<path d="M-24,-240 c8,-6 18,2 14,10 c-4,8 -18,6 -14,-10Z M18,-214 c6,-2 10,4 6,8 c-6,3 -10,-4 -6,-8Z" fill="#4a1512" opacity=".6"/>';
    /* shadow half (away from the light) */
    var shadowHalf = lt > 0 ? "M-80,-330 L4,-330 L-2,-170 L-80,-170Z" : "M80,-330 L-4,-330 L2,-170 L80,-170Z";
    var cid = k.uid("bk");
    s += '<defs><clipPath id="' + cid + '"><path d="' + torso + '"/></clipPath></defs><g clip-path="url(#' + cid + ')">' +
      P(shadowHalf, "#1e1626", null, 0, 'opacity=".22"') + R.tone(k, shadowHalf, .3) + "</g>";
    if (!of.gown && !of.jacket) {
      s += P("M-41,-190 C-20,-187 20,-187 41,-190", "none", "#1d1612", 8);
      if (of.keys) s += '<circle cx="34" cy="-178" r="7" fill="none" stroke="#b8b1a0" stroke-width="2.5"/>' + P("M30,-172 l-3,13 M35,-171 l1,13 M39,-173 l5,10", "none", "#cfc8b4", 3);
    }
    /* shoulders rising into the neck (rounder and higher as he stoops), then the collar */
    var tr = -326 + hunch;
    s += P("M-50,-300 C-40,-314 -28," + f(tr + 4) + " -18," + f(tr) + " L18," + f(tr) + " C28," + f(tr + 4) + " 40,-314 50,-300 C30,-306 -30,-306 -50,-300Z", shirt, null, 0);
    s += P("M-50,-300 C-40,-314 -28," + f(tr + 4) + " -18," + f(tr) + " M18," + f(tr) + " C28," + f(tr + 4) + " 40,-314 50,-300", "none", INK, lw);
    if (hunch > 4) s += P("M-30," + f(-296 + hunch * .2) + " C-10," + f(-306 + hunch * .1) + " 10," + f(-306 + hunch * .1) + " 30," + f(-296 + hunch * .2), "none", INK, 1.6, 'opacity=".5"');
    if (of.jacket) s += P("M-26," + f(tr + 6) + " C-10," + f(tr - 4) + " 10," + f(tr - 4) + " 26," + f(tr + 6) + " L24," + f(tr + 18) + " C8," + f(tr + 12) + " -8," + f(tr + 12) + " -24," + f(tr + 18) + "Z", mix(shirt, INK, .15), INK, lw * .6) +
      P("M-10," + f(tr) + " C-4," + f(tr - 3) + " 4," + f(tr - 3) + " 10," + f(tr), "none", of.under || "#efe8d8", 3);
    else if (!of.gown) s += P("M-24," + f(tr + 4) + " C-10," + f(tr - 4) + " 10," + f(tr - 4) + " 24," + f(tr + 4) + " L22," + f(tr + 14) + " C8," + f(tr + 9) + " -8," + f(tr + 9) + " -22," + f(tr + 14) + "Z", mix(shirt, "#fff", .1), INK, lw * .6);
    /* arms + backs of the hands */
    var holds = [o.holdL, o.holdR];
    pose.arms.forEach(function (A, i) {
      var el = A[1], hd = A[2], wr = [hd[0] + (el[0] - hd[0]) * .2, hd[1] + (el[1] - hd[1]) * .2];
      if (holds[i]) s += '<g transform="translate(' + f(hd[0]) + "," + f(hd[1]) + ')">' + holds[i] + "</g>";
      s += tube([A[0], el, wr], 27, 21, shirt, lw, { bulge: 2, shade: (i === 0) === (lt > 0) ? -1 : 0 });
      s += P("M" + f(el[0] - 8) + "," + f(el[1] - 4) + " q6,5 14,2", "none", INK, 1.5, 'opacity=".5"');
      var ang = Math.atan2(hd[1] - el[1], hd[0] - el[0]) * 180 / Math.PI - 90;
      s += '<g transform="translate(' + f(wr[0]) + "," + f(wr[1]) + ") rotate(" + f(ang) + ')">' +
        P("M-12,-2 C-14,10 -12,26 -9,38 C-7,46 -2,48 0,43 C2,50 8,50 10,43 C13,46 17,42 16,34 C17,22 16,8 12,-2Z", skin, INK, lw * .8) +
        P("M-4,22 C-4,30 -3,36 -2,42 M5,22 C5,30 6,36 6,42", "none", INK, 1.6, 'opacity=".75"') +
        P("M-8,12 q4,-3 8,0 M2,12 q4,-3 8,0", "none", mix(skin, "#5a3a3a", .4), 1.6) + "</g>";
    });
    /* rim light on the lit side */
    if (rim) {
      var sd = lt > 0 ? 1 : -1, A = pose.arms[lt > 0 ? 1 : 0], Lg = pose.legs[lt > 0 ? 1 : 0];
      s += P("M" + (46 * sd) + ",-305 C" + (60 * sd) + ",-286 " + (64 * sd) + ",-268 " + f(A[1][0] + 13 * sd) + "," + f(A[1][1]) + " L" + f(A[2][0] + 12 * sd) + "," + f(A[2][1]), "none", rim, 2.6, 'opacity=".9"');
      s += P("M" + f(Lg[0][0] + 17 * sd) + ",-182 L" + f(Lg[1][0] + 17 * sd) + "," + f(Lg[1][1]) + " L" + f(Lg[2][0] + 15 * sd) + "," + f(Lg[2][1] - 12), "none", rim, 2.4, 'opacity=".85"');
    }
    /* back of the head (no face): skull, ears, hair by style */
    var ht = o.headTurn || 0, skull = "M-47,-22 C-49,-70 -26,-82 0,-82 C26,-82 49,-70 47,-22 C48,8 44,32 34,46 C20,54 -20,54 -34,46 C-44,32 -48,8 -47,-22Z";
    var hd = "";
    [-1, 1].forEach(function (sd2) {
      var ex = sd2 * 45 + ht * 6;
      hd += P("M" + f(ex) + ",-22 C" + f(ex + sd2 * 18) + ",-32 " + f(ex + sd2 * 22) + ",10 " + f(ex - sd2) + ",16Z", mix(skin, "#c9614a", .3), INK, 5);
      hd += P("M" + f(ex + sd2 * 5) + ",-14 C" + f(ex + sd2 * 12) + ",-16 " + f(ex + sd2 * 12) + ",4 " + f(ex + sd2 * 4) + ",8", "none", INK, 2.4);
    });
    hd += P(skull, skin, INK, 6);
    hd += P(skull, "#2a1a26", null, 0, 'opacity=".18"');
    if (c.must && Math.abs(ht) > .2) {
      var mx = ht > 0 ? 44 : -44;
      hd += P("M" + mx + ",30 c" + (ht > 0 ? 8 : -8) + ",6 " + (ht > 0 ? 6 : -6) + ",16 " + (ht > 0 ? 2 : -2) + ",20", mix(c.hair, "#d9d4ca", Math.min(1, (c.grey || 0) * .7 + w * .8)), INK, 3);
    }
    if (c.hairStyle === "fringe") {
      /* a band of fringe from ear to ear, ragged where it meets the bare nape */
      hd += P("M-48,-30 C-50,-10 -46,8 -40,20 l6,-3 l5,6 l6,-5 l6,6 l6,-4 l7,5 l6,-5 l6,5 l6,-6 l5,5 l6,-4 C46,8 50,-10 48,-30 C40,-18 28,-10 14,-8 C6,-7 -6,-7 -14,-8 C-28,-10 -40,-18 -48,-30Z", hair, INK, 5);
      hd += P("M-40,-12 c2,8 4,16 8,24 M-24,-4 c2,8 3,16 6,22 M-6,-2 c0,8 1,16 2,22 M12,-2 c0,8 -1,16 -2,22 M28,-6 c-2,8 -3,16 -6,22 M42,-14 c-2,8 -4,16 -8,24", "none", mix(hair, INK, .4), 2, 'opacity=".55"');
      hd += P("M-30,26 C-16,34 16,34 30,26", "none", mix(skin, "#5a3a3a", .45), 2.5, 'opacity=".6"');
      var wisps = Math.max(0, Math.round(3 - w * 3));
      if (wisps) hd += P(["M-22,-74 C-14,-88 0,-86 6,-74", "M-6,-78 C2,-92 16,-90 22,-76", "M8,-70 C16,-82 28,-78 32,-66"].slice(0, wisps).join(" "), "none", hair, 4.5);
      hd += P("M-18,-62 C-6,-70 10,-70 20,-62", "none", "#fff6c8", 5, 'opacity=".25"');
    } else if (c.hairStyle === "young" || c.hairStyle === "full") {
      hd += P("M-50,-20 C-56,-70 -30,-90 0,-90 C30,-90 56,-70 50,-20 C50,10 44,30 32,44 l-6,-4 l-6,6 l-6,-5 l-7,5 l-7,-5 l-7,5 l-6,-6 l-6,4 C-44,30 -50,10 -50,-20Z", hair, INK, 5);
      hd += P("M-30,-70 C-26,-40 -24,-10 -20,30 M0,-84 C2,-50 2,-10 0,34 M30,-70 C26,-40 24,-10 20,30", "none", mix(hair, INK, .4), 2, 'opacity=".5"');
    } else if (c.hairStyle === "long") {
      hd += P("M-50,-20 C-56,-74 -28,-92 0,-92 C28,-92 56,-74 50,-20 C56,40 60,90 50,140 C20,150 -20,150 -50,140 C-60,90 -56,40 -50,-20Z", hair, INK, 5);
      hd += P("M-30,-60 C-34,0 -32,60 -28,130 M0,-80 C0,0 2,70 0,140 M30,-60 C34,0 32,60 28,130", "none", mix(hair, INK, .4), 2, 'opacity=".5"');
    }
    if (rim) {
      var rs = lt > 0 ? 1 : -1;
      hd += P("M" + (47 * rs) + ",-22 C" + (48 * rs) + ",8 " + (44 * rs) + ",32 " + (34 * rs) + ",46 M" + (30 * rs) + ",-74 C" + (44 * rs) + ",-62 " + (49 * rs) + ",-44 " + (47 * rs) + ",-24", "none", rim, 4, 'opacity=".95"');
    }
    s += '<g transform="translate(' + f(2 + ht * 4) + "," + f(-356 + hunch * 1.25) + ') scale(.54)">' + hd + "</g>";
    return '<g ' + T(o) + (o.op != null ? ' opacity="' + o.op + '"' : "") + ">" + s + "</g>";
  };

  /* ---------- creepy rendering helpers (no feTurbulence: phone performance) ---------- */
  function rng(seed) { var x = Math.abs(Math.round((seed || 1) * 9301)) % 2147483646 + 1; return function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
  R.rng = rng;
  /* R.hatch(k, d, o): fill path d with parallel ink hatching (one pattern per call).
     o = {angle:-35, gap:8, w:1.6, color:INK, op:.5, cross:false} */
  R.hatch = function (k, d, o) {
    o = o || {};
    var id = k.uid("hatch"), g = o.gap || 8, c = o.color || INK, w = o.w || 1.6;
    var pat = '<pattern id="' + id + '" width="' + g + '" height="' + g + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + (o.angle == null ? -35 : o.angle) + ')">' +
      '<line x1="0" y1="0" x2="0" y2="' + g + '" stroke="' + c + '" stroke-width="' + w + '"/>' +
      (o.cross ? '<line x1="0" y1="0" x2="' + g + '" y2="0" stroke="' + c + '" stroke-width="' + f(w * .8) + '"/>' : "") + "</pattern>";
    return "<defs>" + pat + "</defs>" + P(d, "url(#" + id + ")", null, 0, 'opacity="' + (o.op == null ? .5 : o.op) + '"');
  };
  /* R.spatter(cx, cy, r, o): a seeded blood/paint spatter. o = {n:14, color:"#5a0f0e", seed:1, drips:0, op:.9} */
  R.spatter = function (cx, cy, r, o) {
    o = o || {};
    var rnd = rng(o.seed || 1), c = o.color || "#5a0f0e", n = o.n || 14, s = "";
    s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(r * .42) + '" ry="' + f(r * .34) + '" fill="' + c + '"/>';
    for (var i = 0; i < n; i++) {
      var a = rnd() * Math.PI * 2, d = r * (.3 + rnd() * .9), rr = r * (.03 + rnd() * .1) * (1.2 - d / r * .7);
      s += '<circle cx="' + f(cx + Math.cos(a) * d) + '" cy="' + f(cy + Math.sin(a) * d * .8) + '" r="' + f(Math.max(.8, rr)) + '" fill="' + c + '"/>';
      if (rnd() < .3) s += P("M" + f(cx + Math.cos(a) * r * .3) + "," + f(cy + Math.sin(a) * r * .24) + " L" + f(cx + Math.cos(a) * d) + "," + f(cy + Math.sin(a) * d * .8), "none", c, Math.max(.8, rr * .7));
    }
    for (var j = 0; j < (o.drips || 0); j++) {
      var dx = cx + (rnd() - .5) * r * .7, len = r * (.4 + rnd() * .9), dw = r * (.04 + rnd() * .04);
      s += P("M" + f(dx - dw) + "," + f(cy) + " L" + f(dx - dw * .7) + "," + f(cy + len) + " a" + f(dw) + "," + f(dw) + " 0 0 0 " + f(dw * 1.6) + ",0 L" + f(dx + dw) + "," + f(cy) + "Z", c);
    }
    return '<g opacity="' + (o.op == null ? .9 : o.op) + '">' + s + "</g>";
  };
  /* R.dryBrush(pts, w, color, o): a dry-brush stroke along pts: n broken parallel bristle lines
     spread over width w. o = {n:7, seed:1, op:.85} */
  R.dryBrush = function (pts, w, color, o) {
    o = o || {};
    var rnd = rng(o.seed || 1), n = o.n || 7, s = "", sp = crSample(pts, 8);
    for (var i = 0; i < n; i++) {
      var off = (i / Math.max(1, n - 1) - .5) * w, line = [];
      for (var j = 0; j < sp.length; j++) {
        var a = sp[Math.max(0, j - 1)], b = sp[Math.min(sp.length - 1, j + 1)], tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
        line.push([sp[j][0] - ty / m * off, sp[j][1] + tx / m * off]);
      }
      var dash = f(10 + rnd() * 40) + " " + f(2 + rnd() * 14) + " " + f(6 + rnd() * 30) + " " + f(3 + rnd() * 10);
      s += P(smooth(line), "none", color, f(w / n * (.5 + rnd() * .7)), 'stroke-linecap="round" stroke-dasharray="' + dash + '" stroke-dashoffset="' + f(rnd() * 40) + '"');
    }
    return '<g opacity="' + (o.op == null ? .85 : o.op) + '">' + s + "</g>";
  };
  /* R.wrongShadow(k, markup, o): a flat silhouette of markup (any svg) cast as a shadow that is
     a little wrong. o = {x, y (shadow origin, e.g. the feet), skew:-30, stretch:1.1 (x),
     squash:.45 (y), color:INK, op:.6, extra: svg drawn only in the shadow (too-long fingers)} */
  R.wrongShadow = function (k, markup, o) {
    o = o || {};
    var id = k.uid("wsh"), x = o.x || 0, y = o.y || 0;
    var flt = '<defs><filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feFlood flood-color="' + (o.color || INK) + '"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>';
    return flt + '<g opacity="' + (o.op == null ? .6 : o.op) + '" filter="url(#' + id + ')" transform="translate(' + f(x) + "," + f(y) + ") skewX(" + f(o.skew == null ? -30 : o.skew) + ") scale(" + f(o.stretch || 1.1) + "," + f(o.squash == null ? .45 : o.squash) + ") translate(" + f(-x) + "," + f(-y) + ')">' + markup + (o.extra || "") + "</g>";
  };
  /* R.grain(k, w, h, op): fine irregular film grain over a w x h panel (one dot tile). */
  R.grain = function (k, w, h, op) {
    var id = k.uid("grain"), rnd = rng(7), d = "";
    for (var i = 0; i < 26; i++) d += '<circle cx="' + f(rnd() * 31) + '" cy="' + f(rnd() * 31) + '" r="' + f(.4 + rnd() * .9) + '" fill="' + (i % 3 ? INK : "#fff") + '"/>';
    return '<defs><pattern id="' + id + '" width="31" height="31" patternUnits="userSpaceOnUse">' + d + '</pattern></defs><rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')" opacity="' + (op == null ? .18 : op) + '" pointer-events="none"/>';
  };
  /* R.darkEdges(k, w, h, o): a heavier, uneven darkening toward the panel edges and corners.
     o = {color:"#000", inner:.45 (where the darkening starts, 0..1), op:.85} */
  R.darkEdges = function (k, w, h, o) {
    o = o || {};
    var id = k.uid("dedge"), c = o.color || "#000", inr = o.inner == null ? .45 : o.inner;
    return '<defs><radialGradient id="' + id + '" cx="50%" cy="46%" r="75%"><stop offset="' + inr + '" stop-color="' + c + '" stop-opacity="0"/><stop offset="' + f(inr + (1 - inr) * .55) + '" stop-color="' + c + '" stop-opacity=".45"/><stop offset="1" stop-color="' + c + '" stop-opacity="1"/></radialGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')" opacity="' + (o.op == null ? .85 : o.op) + '" pointer-events="none"/>' +
      P("M0,0 L" + w + ",0 L" + w + "," + f(h * .06) + " C" + f(w * .7) + "," + f(h * .02) + " " + f(w * .3) + "," + f(h * .07) + " 0," + f(h * .03) + "Z", c, null, 0, 'opacity="' + f((o.op == null ? .85 : o.op) * .5) + '"');
  };
})(typeof window !== "undefined" ? window : globalThis);
