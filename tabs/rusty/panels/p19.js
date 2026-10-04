/* p19: Inside. 1:40. Danny slumped in the booth, coffee cold, a third cup still upside-down on its saucer.
   His hand flat on the table, the watch on his wrist; Jess's hand laid over it from across the table.
   Span 2, viewBox 400x600, mood noon. Hands are drawn here (flat, seen from above), not with the
   shared fist/openHand, which are gripping / palm-forward. */
RUSTY.panel({
  id: "p19", w: 400, h: 600,
  alt: "Inside the diner, early afternoon. Danny sits slumped in the red booth, eyes down. Through the blinds behind him, a red balloon bobs on a mailbox across the road. His coffee has gone cold, and the third place setting is untouched, its cup still upside down on the saucer. His hand lies flat on the table; Jess's smaller hand reaches across and rests on top of it. The watch on his wrist reads twenty to two.",
  captions: [],
  balloons: [
    { kind: "speech", who: "Danny", x: 3, y: 3, w: 46, tail: [36, 47], text: "He's not coming." },
    { kind: "speech", who: "Danny", x: 46, y: 9, w: 51, tail: [57, 45], text: "He was never coming, Jess." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, mix = R.mix, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f3e2b0"/><stop offset="1" stop-color="#e8b878"/></linearGradient>' +
      '<linearGradient id="' + k.id("top") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9e1cc"/><stop offset="1" stop-color="#f6f0e0"/></linearGradient>' +
      '<clipPath id="' + k.id("win") + '"><path d="M0,0 H400 V236 H0Z"/></clipPath>' +
      '</defs>';

    /* ---------- window + blinds, afternoon light; across the road a red balloon on a mailbox ---------- */
    s += '<g clip-path="' + k.url("win") + '"><rect width="400" height="236" fill="' + k.url("sky") + '"/>';
    s += P("M0,150 C120,140 260,146 400,138 V236 H0Z", "#c9a85a") + P("M0,170 H400 V196 H0Z", "#7a7470");
    s += P("M286,170 V128", "none", "#5a4030", 4) + P("M276,130 v-12 a10,10 0 0 1 20,0 v12Z", "#8a8a84", INK, 2);
    s += P("M292,118 C300,96 286,76 300,56", "none", "#eee", 1.4) + '<ellipse cx="302" cy="40" rx="14" ry="17" fill="#c0221b" stroke="' + INK + '" stroke-width="2.5" transform="rotate(-14 302 40)"/><ellipse cx="297" cy="34" rx="4" ry="6" fill="#fff" opacity=".5"/>';
    var bl = ""; for (var y = 4; y < 236; y += 15) bl += "M0," + y + " H400 ";
    s += P(bl, "none", "#e8d6a8", 7, 'opacity=".9"') + P(bl.replace(/M0,(\d+)/g, function (m, yy) { return "M0," + (+yy + 4); }), "none", "#8a6a3a", 1.5, 'opacity=".55"');
    s += "</g>" + P("M0,236 H400 V250 H0Z", "#c9c9c0", INK, 3);
    /* wall below the sill, dim */
    s += P("M0,250 H400 V600 H0Z", "#7a4a30");

    /* ---------- the booth: tufted back seen at an angle, its end panel shows depth ---------- */
    s += P("M-10,262 C40,240 220,244 296,262 L302,600 H-10Z", "#a3342c", INK, 4);
    var tufts = ""; [18, 64, 110, 156, 202, 248].forEach(function (x, i) { tufts += "M" + x + "," + (254 - i * .3) + " C" + (x - 4) + ",380 " + (x + 2) + ",470 " + x + ",600 "; });
    s += P(tufts, "none", "#6e1c17", 5) + P(tufts.replace(/M(\d+)/g, function (m, x) { return "M" + (+x + 6); }), "none", "#d0574a", 2, 'opacity=".6"');
    s += R.tone(k, "M-10,262 C40,240 220,244 296,262 L298,330 C200,316 60,316 -10,330Z", .18);
    s += P("M296,262 C312,262 330,272 334,290 L338,600 H302Z", "#7a221c", INK, 4) + R.tone(k, "M296,262 C312,262 330,272 334,290 L338,600 H302Z", .4, true);
    s += P("M6,256 C60,238 210,242 290,258", "none", "#e0705e", 3, 'opacity=".75"');

    /* ---------- Danny, slumped ---------- */
    var downcast = { bi: 8, bo: -4, eye: .3, curve: -.65, open: 0 };
    s += R.person(k, { x: 140, y: 745, s: 1.35, ch: "danny", outfit: "danny", pose: "sit", expr: downcast, turn: .3, light: 1, headTilt: 10, stoop: 10 });

    /* ---------- table, in perspective (back edge rises left to right) ---------- */
    var top = "M-10,452 L410,426 L410,600 L-10,600Z";
    s += P(top, k.url("top"), INK, 4);
    var boom = ""; [[40, 520], [130, 560], [250, 500], [330, 560], [90, 590], [360, 470]].forEach(function (b) { boom += "M" + b[0] + "," + b[1] + " q12,-10 24,0 q-12,-4 -24,0Z "; });
    s += P(boom, "#c9b9a0", null, 0, 'opacity=".6"');
    s += P("M-10,452 L410,426", "none", "#9a9a92", 7) + P("M-10,452 L410,426", "none", INK, 2.5);
    s += R.tone(k, "M-10,560 L410,540 L410,600 L-10,600Z", .18);

    /* the third place setting: cup upside-down on its saucer, napkin roll */
    s += '<ellipse cx="52" cy="462" rx="34" ry="9" fill="#efe9da" stroke="' + INK + '" stroke-width="2.5"/>';
    s += P("M30,460 C30,438 74,438 74,460 C68,464 36,464 30,460Z", "#efe9da", INK, 2.5) + P("M40,446 C46,442 58,442 64,446", "none", "#fff", 2);
    s += R.tone(k, "M58,442 C68,446 74,452 74,460 L62,462Z", .3);
    s += P("M90,462 L126,458 L128,468 L92,472Z", "#f6f0e0", INK, 2) + P("M100,461 l2,10", "none", "#9a9a92", 1.5);
    /* Danny's mug: cold, a skin on it, no steam */
    s += P("M226,474 L230,438 H274 L278,474 C270,480 234,480 226,474Z", "#efe9da", INK, 3) + P("M276,446 c18,-2 20,22 0,22", "none", INK, 3.5);
    s += '<ellipse cx="252" cy="438" rx="22" ry="5" fill="#3a2414" stroke="' + INK + '" stroke-width="2"/>' + P("M236,439 C246,436 258,441 268,437", "none", "#7a5a3a", 1.2);
    s += R.tone(k, "M258,440 H274 L278,474 C272,478 262,479 258,479Z", .3);

    /* ---------- hands, flat on the table, seen from above ---------- */
    function flatHand(o) {
      var sk = o.skin, dk = mix(sk, "#5a3a3a", .4), lt = mix(sk, "#ffffff", .25), h = "";
      var L = o.slim ? .85 : 1, W = o.slim ? .82 : 1;
      if (o.sleeve) h += P("M-170," + (-34 * W) + " L-36," + (-30 * W) + " L-36," + (30 * W) + " L-170," + (40 * W) + "Z", o.sleeve, INK, 4) + (o.cuff ? P("M-46," + (-31 * W) + " V" + (31 * W), "none", INK, 2.5) : "");
      /* fingers (index nearest the thumb at -y), slightly fanned, knuckles bent, nails */
      var bases = [[58, -24], [64, -8], [62, 8], [54, 22]], lens = [62, 70, 66, 52], ang = [-7, -2, 3, 9];
      bases.forEach(function (b, i) {
        var a = ang[i] * Math.PI / 180, ln = lens[i] * L, bx = b[0], by = b[1] * W;
        var m = [bx + Math.cos(a) * ln * .5, by + Math.sin(a) * ln * .5], t = [bx + Math.cos(a + .05) * ln, by + Math.sin(a + .05) * ln];
        h += R.limb([[bx - 6, by], m, t], (o.slim ? 12 : 15) - i * .6, sk, 3);
        h += P("M" + f(m[0] - 2) + "," + f(m[1] - 5) + " q3,5 0,10", "none", dk, 1.6);
        var nx = t[0] - Math.cos(a) * 6, ny = t[1] - Math.sin(a) * 6;
        h += '<ellipse cx="' + f(nx) + '" cy="' + f(ny) + '" rx="5" ry="' + (o.slim ? 4.2 : 5) + '" fill="' + (o.nail || lt) + '" stroke="' + INK + '" stroke-width="1.2" transform="rotate(' + ang[i] + " " + f(nx) + " " + f(ny) + ')"/>';
        if (o.ring && i === 2) h += R.limb([[bx + 10, by], [bx + 16, by + .5]], 16, "#d9b23a", 1.5);
      });
      /* back of the hand */
      h += P("M-40," + (-28 * W) + " C0," + (-36 * W) + " 40," + (-36 * W) + " 62," + (-30 * W) + " C70," + (-12 * W) + " 70," + (14 * W) + " 60," + (30 * W) + " C30," + (36 * W) + " -10," + (34 * W) + " -40," + (28 * W) + "Z", sk, INK, 3.5);
      h += P("M10," + (-20 * W) + " L56," + (-22 * W) + " M12," + (-6 * W) + " L60," + (-8 * W) + " M12," + (8 * W) + " L58," + (8 * W) + " M10," + (20 * W) + " L52," + (22 * W), "none", dk, 1.4, 'opacity=".5"');
      [[58, -24], [64, -8], [62, 8], [54, 22]].forEach(function (b) { h += '<ellipse cx="' + b[0] + '" cy="' + f(b[1] * W) + '" rx="4" ry="5" fill="' + lt + '" opacity=".7"/>'; });
      h += R.tone(k, "M-40," + (10 * W) + " C0," + (20 * W) + " 40," + (24 * W) + " 60," + (30 * W) + " C30," + (36 * W) + " -10," + (34 * W) + " -40," + (28 * W) + "Z", .4);
      /* thumb, tucked along the -y side */
      h += R.limb([[-6, -30 * W], [24, -44 * W], [50, -46 * W]], o.slim ? 14 : 17, sk, 3);
      h += '<ellipse cx="' + 44 + '" cy="' + f(-46 * W) + '" rx="5" ry="4" fill="' + (o.nail || lt) + '" stroke="' + INK + '" stroke-width="1.2"/>';
      if (o.watch) h += P("M-32," + (-34 * W) + " L-12," + (-34 * W) + " L-12," + (34 * W) + " L-32," + (34 * W) + "Z", "#3a2a1e", INK, 2.5);
      return '<g transform="translate(' + f(o.x) + "," + f(o.y) + ") rotate(" + f(o.rot) + ") scale(" + f(o.s) + "," + f(o.s * (o.mirror ? -1 : 1)) + ')">' + h + "</g>";
    }
    /* Danny's hand comes in from the lower left (from his body), fingers toward the empty seat */
    s += flatHand({ x: 112, y: 528, rot: -14, s: .95, skin: R.CH.danny.skin, sleeve: "#45627a", cuff: true, watch: true });
    /* cast shadow of Jess's hand on his, then her hand from the right, laid over his knuckles */
    s += '<ellipse cx="190" cy="522" rx="70" ry="22" fill="#3a1a10" opacity=".22" transform="rotate(-10 190 522)"/>';
    s += flatHand({ x: 268, y: 494, rot: 168, s: .88, skin: R.CH.jess.skin, sleeve: "#b46a58", slim: true, mirror: true, nail: "#c96a6a", ring: true });
    /* the watch on his wrist, big enough to read, drawn upright: 1:40 = hour hand 50deg, minute hand 240deg */
    var wx = 92, wy = 534, wr = 25;
    s += '<circle cx="' + wx + '" cy="' + wy + '" r="' + (wr + 5) + '" fill="#b8b0a0" stroke="' + INK + '" stroke-width="3.5"/><circle cx="' + wx + '" cy="' + wy + '" r="' + wr + '" fill="#f3ecdc" stroke="' + INK + '" stroke-width="1.5"/>';
    for (var i = 0; i < 12; i++) {
      var a = i * 30 * Math.PI / 180, r1 = i % 3 ? wr - 6 : wr - 9;
      s += P("M" + f(wx + Math.sin(a) * r1) + "," + f(wy - Math.cos(a) * r1) + " L" + f(wx + Math.sin(a) * (wr - 2)) + "," + f(wy - Math.cos(a) * (wr - 2)), "none", INK, i % 3 ? 1.5 : 3);
    }
    var wh = function (deg, ln, w) { var a = deg * Math.PI / 180; return P("M" + wx + "," + wy + " L" + f(wx + Math.sin(a) * ln) + "," + f(wy - Math.cos(a) * ln), "none", INK, w); };
    s += wh(50, 12, 4.5) + wh(240, 19, 2.5) + '<circle cx="' + wx + '" cy="' + wy + '" r="2.5" fill="#8b1414"/>';
    s += P("M" + (wx - 18) + "," + (wy - 14) + " q8,-10 20,-10", "none", "#fff", 3, 'opacity=".8"');


    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
