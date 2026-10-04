/* p02: The long school corridor after hours; Rusty mopping toward us, the floor shining behind him.
   Span 6, viewBox 1200x600, mood day, wear 0.
   Built in true one-point perspective (pr() projects corridor coordinates): tiles, lockers, doors and the
   ceiling lights all converge on one vanishing point, and the lights mirror only in the floor he has already mopped. */
RUSTY.panel({
  id: "p02", w: 1200, h: 600,
  alt: "A long elementary-school corridor after hours, drawn in deep perspective: teal lockers down the left, classroom doors and paper hand-print turkeys down the right, a red EXIT sign glowing at the far end where the lights are already off. One ceiling tube flickers. Rusty, in his olive work shirt and RUSTY nametag, mops toward us beside his yellow bucket; behind him the wet floor mirrors the lights, ahead of him it is dull. A WET FLOOR sign stands in the foreground.",
  captions: [
    { at: "tl", text: "For thirty-one years, Russell Pruitt mopped the halls of Hollis Creek Elementary.", w: 40 },
    { at: "br", text: "The kids called him Rusty. Most of the teachers never learned his last name.", w: 38 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var VX = 600, VY = 250, F = 600, E = .7, H = 1.5, ZB = 9;
    function pr(X, Y, Z) { return [VX + F * X / Z, VY + F * (E - Y) / Z]; }
    function q(pts) { return "M" + pts.map(function (p) { return f(p[0]) + "," + f(p[1]); }).join(" L") + "Z"; }
    function wallQ(X, Y0, Y1, Z0, Z1) { return q([pr(X, Y0, Z0), pr(X, Y1, Z0), pr(X, Y1, Z1), pr(X, Y0, Z1)]); }
    function floorQ(X0, X1, Z0, Z1, Y) { Y = Y || 0; return q([pr(X0, Y, Z0), pr(X1, Y, Z0), pr(X1, Y, Z1), pr(X0, Y, Z1)]); }
    function ln(a, b) { return "M" + f(a[0]) + "," + f(a[1]) + " L" + f(b[0]) + "," + f(b[1]) + " "; }

    s += '<defs><linearGradient id="' + k.id("dark") + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0a08" stop-opacity="0"/><stop offset="1" stop-color="#0d0a08" stop-opacity=".55"/></linearGradient></defs>';
    /* ---------- shell ---------- */
    s += P(q([pr(-1, H, .6), pr(1, H, .6), pr(1, H, ZB), pr(-1, H, ZB)]), "#d6ccb0");                 /* ceiling */
    s += P(q([pr(-1, 0, .6), pr(-1, H, .6), pr(-1, H, ZB), pr(-1, 0, ZB)]), "#c7b88e");                /* left wall */
    s += P(q([pr(1, 0, .6), pr(1, H, .6), pr(1, H, ZB), pr(1, 0, ZB)]), "#d0c29a");                   /* right wall */
    s += P(q([pr(-1, 0, .6), pr(1, 0, .6), pr(1, 0, ZB), pr(-1, 0, ZB)]), "#b9ab86");                 /* floor */
    s += P(q([pr(-1, 0, ZB), pr(1, 0, ZB), pr(1, H, ZB), pr(-1, H, ZB)]), "#6d6250", INK, 2.5);        /* far wall, in the dark */
    /* ceiling tiles */
    var ct = "";
    for (var cx = -1; cx <= 1.001; cx += .4) ct += ln(pr(cx, H, .6), pr(cx, H, ZB));
    for (var cz = 1; cz < ZB; cz += .6) ct += ln(pr(-1, H, cz), pr(1, H, cz));
    s += P(ct, "none", "#b3a888", 1.6);
    /* floor tiles: checker of cream and speckled tan, darker squares every few */
    var ft = "", alt = "";
    var zs = []; for (var z = .6; z < ZB; z *= 1.0) { zs.push(z); z += .3; }
    var xs = []; for (var x = -1; x <= 1.001; x += .25) xs.push(x);
    for (var i = 0; i < zs.length - 1; i++) for (var j = 0; j < xs.length - 1; j++) if ((i + j) % 2 === 0) alt += floorQ(xs[j], xs[j + 1], zs[i], zs[i + 1]) + " ";
    s += P(alt, "#a99a74");
    xs.forEach(function (X) { ft += ln(pr(X, 0, .6), pr(X, 0, ZB)); });
    zs.forEach(function (Z) { ft += ln(pr(-1, 0, Z), pr(1, 0, Z)); });
    s += P(ft, "none", "#8f8264", 1.4);

    /* ---------- left wall: lockers ---------- */
    s += P(wallQ(-1, .06, 1.02, .6, ZB), "#5f7d7c", INK, 2.5);
    var lk = "", vents = "", hand = "";
    for (var lz = .6; lz < ZB; lz += .22) {
      lk += ln(pr(-1, .06, lz), pr(-1, 1.02, lz));
      var a = pr(-1, .92, lz + .04), b = pr(-1, .92, lz + .18), a2 = pr(-1, .86, lz + .04), b2 = pr(-1, .86, lz + .18);
      if (lz < 5) vents += ln(a, b) + ln(a2, b2);
      if (lz < 4) { var h0 = pr(-1, .55, lz + .17), h1 = pr(-1, .47, lz + .17); hand += ln(h0, h1); }
    }
    s += P(lk, "none", INK, 2) + P(vents, "none", "#2f4444", 2) + P(hand, "none", "#c9c9c0", 3);
    s += P(wallQ(-1, 0, .06, .6, ZB), "#3a3a34", INK, 2);                                              /* base trim */
    s += R.tone(k, wallQ(-1, .06, 1.02, .6, 2.4), .22);
    /* kids' paintings above the lockers */
    [[1.1, "#c0392b"], [1.9, "#3d6a9a"], [2.9, "#e3c03a"], [4.2, "#5a8a3a"]].forEach(function (p) {
      s += P(wallQ(-1, 1.08, 1.32, p[0], p[0] + .32), "#efe9da", INK, 2);
      var c0 = pr(-1, 1.2, p[0] + .16);
      s += '<circle cx="' + f(c0[0]) + '" cy="' + f(c0[1]) + '" r="' + f(36 / p[0]) + '" fill="' + p[1] + '" opacity=".8"/>';
    });

    /* ---------- right wall: classroom doors, fountain, turkeys ---------- */
    [[1.0, 1.45], [2.7, 3.0], [4.6, 4.8], [6.6, 6.75]].forEach(function (d, n) {
      s += P(wallQ(1, 0, 1.05, d[0], d[1]), "#7a5a3a", INK, 2.5);
      s += P(wallQ(1, .6, .95, d[0] + (d[1] - d[0]) * .2, d[1] - (d[1] - d[0]) * .25), n === 1 ? "#f3e6b0" : "#2a2a30", INK, 2);  /* one room still lit */
      var kn = pr(1, .5, d[0] + (d[1] - d[0]) * .85);
      s += '<circle cx="' + f(kn[0]) + '" cy="' + f(kn[1]) + '" r="' + f(9 / d[0]) + '" fill="#c9a23a" stroke="' + INK + '" stroke-width="1.5"/>';
      var nm = pr(1, 1.13, (d[0] + d[1]) / 2);
      s += '<rect x="' + f(nm[0] - 40 / d[0]) + '" y="' + f(nm[1] - 12 / d[0]) + '" width="' + f(80 / d[0]) + '" height="' + f(24 / d[0]) + '" fill="#efe9da" stroke="' + INK + '" stroke-width="1.5"/>';
    });
    var lit = pr(1, .78, 2.84); s += R.glow(k, lit[0] - 30, lit[1], 70, .5);
    function turkey(X, Y, Z, c) {
      var p0 = pr(X, Y, Z), sc = 1.7 / Z, t = "", cols = ["#c0392b", "#d98a2b", "#e3c03a", "#5a8a3a", "#3d6a9a"];
      for (var i = 0; i < 5; i++) {
        var an = (-160 + i * 30) * Math.PI / 180;
        t += R.limb([[p0[0], p0[1]], [p0[0] + Math.cos(an) * 30 * sc * .7, p0[1] + Math.sin(an) * 30 * sc]], 12 * sc, cols[(i + c) % 5], 2);
      }
      return t + '<ellipse cx="' + f(p0[0]) + '" cy="' + f(p0[1] + 6 * sc) + '" rx="' + f(12 * sc) + '" ry="' + f(16 * sc) + '" fill="#8a5a32" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="' + f(p0[0] - 3 * sc) + '" cy="' + f(p0[1] + 2 * sc) + '" r="' + f(2 * sc) + '" fill="' + INK + '"/>' + P("M" + f(p0[0] - 10 * sc) + "," + f(p0[1] + 4 * sc) + " l" + f(-7 * sc) + "," + f(3 * sc) + " l" + f(7 * sc) + "," + f(3 * sc) + "Z", "#e3a02a", INK, 1);
    }
    s += turkey(1, .82, 1.62, 0) + turkey(1, .92, 1.85, 2) + turkey(1, .8, 2.2, 1) + turkey(1, .86, 3.4, 3) + turkey(1, .9, 3.9, 4) + turkey(1, .86, 5.5, 0);
    var tb = pr(1, 1.3, 2.1);
    s += '<g transform="translate(' + f(tb[0]) + "," + f(tb[1]) + ') skewY(-24)"><rect x="-70" y="-18" width="140" height="34" fill="#efe9da" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="0" y="8" text-anchor="middle" font-family="Bangers, sans-serif" font-size="24" letter-spacing="2" fill="#a3171c">WE ARE THANKFUL</text></g>';

    /* ---------- far end: lights already off, EXIT glowing ---------- */
    var dw0 = pr(-.3, 0, ZB), dw1 = pr(.3, .95, ZB);
    s += P("M" + f(dw0[0]) + "," + f(dw0[1]) + " H" + f(dw1[0]) + " V" + f(dw1[1]) + " H" + f(dw0[0]) + "Z", "#3a3026", INK, 2) + P("M" + f(VX) + "," + f(dw0[1]) + " V" + f(dw1[1]), "none", INK, 2);
    s += P("M" + f(dw0[0] + 6) + "," + f(dw1[1] + 8) + " h18 v20 h-18Z M" + f(VX + 6) + "," + f(dw1[1] + 8) + " h18 v20 h-18Z", "#8a8470", INK, 1.2);
    var ex = pr(0, 1.15, ZB);
    s += R.glow(k, ex[0], ex[1], 90, .9, true);
    s += '<rect x="' + f(ex[0] - 22) + '" y="' + f(ex[1] - 9) + '" width="44" height="18" fill="#2a0a0a" stroke="' + INK + '" stroke-width="1.5"/>';
    s += '<text x="' + f(ex[0]) + '" y="' + f(ex[1] + 6) + '" text-anchor="middle" font-family="Bangers, sans-serif" font-size="15" letter-spacing="2" fill="#ff4a3a">EXIT</text>';
    /* darkness pooling at the far end */
    s += '<rect x="0" y="0" width="1200" height="600" fill="#0d0a08" opacity="0"/>';
    var dark = q([pr(-1, 0, 4.2), pr(-1, H, 4.2), pr(1, H, 4.2), pr(1, 0, 4.2)]);
    s += P(dark, "#140f0a", null, 0, 'opacity=".38"');
    s += P(q([pr(-1, 0, 6.2), pr(-1, H, 6.2), pr(1, H, 6.2), pr(1, 0, 6.2)]), "#140f0a", null, 0, 'opacity=".35"');

    /* ---------- ceiling lights (on the centreline) + their reflections in the wet floor ---------- */
    var LZ = [1.15, 1.9, 2.8, 3.9], refl = "";
    LZ.forEach(function (Z, n) {
      var dead = n === 1;
      var a = pr(-.12, H, Z), b = pr(.12, H, Z), c = pr(.12, H, Z + .45), d = pr(-.12, H, Z + .45);
      s += P(q([a, b, c, d]), dead ? "#8a8470" : "#fffbe6", INK, 2);
      if (!dead) s += R.glow(k, (a[0] + b[0]) / 2, (a[1] + c[1]) / 2 + 10, 240 / Z, .5);
    });
    /* the dead tube, flickering */
    var dt = pr(0, H, 2.1);
    s += P("M" + f(dt[0] - 70) + "," + f(dt[1] + 14) + " l-16,8 M" + f(dt[0] - 50) + "," + f(dt[1] + 24) + " l-6,14 M" + f(dt[0] + 60) + "," + f(dt[1] + 20) + " l14,10 M" + f(dt[0] + 38) + "," + f(dt[1] + 26) + " l6,14", "none", INK, 2.5);
    s += R.sfx("bzzt", dt[0] + 96, dt[1] + 40, 26, { fill: "#fffbe6", rot: 8 });
    /* wet sheen behind him: lighter floor, mirrored lights, streaks */
    var wet = floorQ(-.75, .8, 2.0, 7);
    s += P(wet, "#efe6c8", null, 0, 'opacity=".35"');
    /* what the wet floor mirrors: the red EXIT, the one lit classroom, the teal lockers */
    var r0 = pr(-.08, 0, ZB - .2), r1 = pr(.08, 0, ZB - .2), r2 = pr(.2, 0, 2.05), r3 = pr(0, 0, 2.05);
    s += P(q([r0, r1, r2, r3]), "#ff4a3a", null, 0, 'opacity=".28"') + P(q([pr(-.03, 0, ZB - .2), pr(.03, 0, ZB - .2), pr(.04, 0, 2.6), pr(-.04, 0, 2.6)]), "#ff8a6a", null, 0, 'opacity=".35"');
    s += P(q([pr(.62, 0, 2.95), pr(.8, 0, 2.95), pr(.8, 0, 2.3), pr(.62, 0, 2.3)]), "#f3e6b0", null, 0, 'opacity=".4"');
    s += P(q([pr(-.75, 0, 7), pr(-.55, 0, 7), pr(-.55, 0, 2.05), pr(-.75, 0, 2.05)]), "#5f7d7c", null, 0, 'opacity=".25"');
    var st = "";
    [-.5, -.25, .05, .3, .55].forEach(function (X, n) { st += ln(pr(X, 0, 2.05), pr(X + .05, 0, 4.5 + n * .4)); });
    s += P(st, "none", "#fffbe6", 3, 'opacity=".45"');
    var wedge = pr(-.75, 0, 2.0), wedge2 = pr(.8, 0, 2.0);
    s += P("M" + f(wedge[0]) + "," + f(wedge[1]) + " C" + f(wedge[0] + 150) + "," + f(wedge[1] + 8) + " " + f(wedge2[0] - 150) + "," + f(wedge2[1] - 6) + " " + f(wedge2[0]) + "," + f(wedge2[1]), "none", "#8f8264", 2.5, 'stroke-dasharray="10 6"');
    /* dry floor in front: scuffs and grit */
    s += P("M200,560 c30,-6 60,-4 80,2 M860,540 c24,-8 60,-6 76,0 M640,590 c20,-4 40,-4 56,2 M420,520 l6,-2 M980,580 l4,-3", "none", "#7a6a4c", 3);
    s += R.tone(k, "M0,600 L0,520 L300,470 L120,600Z", .25);
    s += R.tone(k, "M1200,600 L1200,520 L900,470 L1080,600Z", .25);

    /* ---------- Rusty, bucket ---------- */
    var feet = pr(.2, 0, 1.75);
    s += '<ellipse cx="' + f(feet[0]) + '" cy="' + f(feet[1]) + '" rx="120" ry="14" fill="#3a2e1c" opacity=".4"/>';
    var bk = pr(-.14, 0, 1.85);
    s += R.bucket(k, { x: bk[0], y: bk[1], s: .8 });
    s += R.person(k, { x: feet[0], y: feet[1], s: .76, pose: "mop", outfit: "work", expr: "neutral", turn: -.15, light: -1, headTilt: 6 });

    /* ---------- WET FLOOR sign, foreground ---------- */
    var ws = pr(-.6, 0, 1.3);
    s += '<g transform="translate(' + f(ws[0]) + "," + f(ws[1] - 10) + ')">' +
      '<ellipse cx="0" cy="8" rx="70" ry="10" fill="#3a2e1c" opacity=".35"/>' +
      P("M-46,6 L-6,-176 L34,6Z", "#c79a1e", INK, 4) + P("M-60,10 L0,-180 L56,10Z", "#e3c03a", INK, 4.5) +
      P("M0,-138 l-18,36 h36Z", INK) + '<text x="0" y="-108" text-anchor="middle" font-family="Bangers, sans-serif" font-size="14" fill="#e3c03a">!</text>' +
      R.sfx("WET", 0, -58, 28, { anchor: "middle", fill: INK, stroke: "#e3c03a", sw: 0 }) + R.sfx("FLOOR", 0, -28, 22, { anchor: "middle", fill: INK, stroke: "#e3c03a", sw: 0 }) +
      R.tone(k, "M10,-150 L56,10 L20,10Z", .35) + "</g>";
    /* inking: corner lines of the corridor, heavy in front, thin into the distance */
    s += P(ln(pr(-1, 0, .6), pr(-1, 0, ZB)) + ln(pr(1, 0, .6), pr(1, 0, ZB)) + ln(pr(-1, H, .6), pr(-1, H, ZB)) + ln(pr(1, H, .6), pr(1, H, ZB)), "none", INK, 3.5);
    s += R.vignette(k, 1200, 600, .55);
    return s;
  }
});
