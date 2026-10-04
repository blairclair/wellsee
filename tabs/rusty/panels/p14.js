/* p14: Route 9 at noon. Rusty walks six miles in his good suit; red balloons tied to every mailbox lean toward him.
   Span 3, viewBox 600x600, mood noon, wear 0.
   One-point perspective: VP on the horizon; mailboxes, poles and fence posts are placed parametrically along the
   shoulders and scale with distance. Each balloon's tether bends toward Rusty's head. On the far hill, the carnival. */
RUSTY.panel({
  id: "p14", w: 600, h: 600,
  alt: "Route 9 under a hard noon sun, the road running straight to the horizon through dry wheat. Rusty walks toward us in his brown suit, sweating, the newspaper-wrapped rabbit held to his chest. A red balloon is tied to every mailbox along both shoulders, and every one of them leans toward him as he passes. Crows sit on the telephone wire. Far off on a hill, small in the heat haze, the carnival's tent and Ferris wheel.",
  captions: [{ at: "tl", text: "Six miles. The truck wouldn't start. Of course it wouldn't.", w: 62 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var VP = [352, 262], BL = 40, BR = 650;   /* road edges at the bottom */
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5f8fb0"/><stop offset=".6" stop-color="#b8d0d8"/><stop offset="1" stop-color="#ece2c0"/></linearGradient>' +
      '<linearGradient id="' + k.id("road") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9a948a"/><stop offset=".3" stop-color="#5e5a56"/><stop offset="1" stop-color="#3c3a38"/></linearGradient>' +
      '<linearGradient id="' + k.id("field") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d9c27a"/><stop offset="1" stop-color="#b8903e"/></linearGradient></defs>';
    s += '<rect width="600" height="600" fill="' + k.url("sky") + '"/>';
    /* the sun, high and white, half out of frame */
    s += R.glow(k, 520, -10, 230, .9) + '<circle cx="520" cy="-10" r="46" fill="#fffbe8"/>';

    /* far hill with the carnival on it, faint in the haze */
    s += P("M0,262 C40,236 110,214 170,218 C220,222 250,246 290,262Z", "#a8a890", null, 0, 'opacity=".8"');
    var carn = R.bigTop(k, { x: 150, y: 224, s: .1, fade: .8 }) + R.ferris(k, { x: 196, y: 206, s: .1, color: "#5a3030" });
    s += '<g opacity=".6">' + carn + "</g>";

    /* fields: perspective furrows radiating from the VP */
    s += P("M0,262 H600 V600 H0Z", k.url("field"));
    var fur = ""; for (var i = -22; i <= 22; i++) if (Math.abs(i) > 2) fur += "M" + VP[0] + "," + VP[1] + " L" + (VP[0] + i * 70) + ",600 ";
    s += P(fur, "none", "#9a7a34", 2, 'opacity=".5"');
    s += P("M0,262 H600", "none", "#7a6a40", 2);
    /* wheat tufts in the near corners, inked */
    var wheat = ""; for (var j = 0; j < 26; j++) { var wx = j < 13 ? j * 3.4 : 560 + (j - 13) * 3.2, wb = 600, wh = 50 + (j * 37 % 30); wheat += "M" + f(wx) + "," + wb + " Q" + f(wx + 6) + "," + (wb - wh * .6) + " " + f(wx + 2 + (j % 3) * 4) + "," + (wb - wh) + " "; }
    s += P(wheat, "none", "#7a5a20", 2.5);

    /* the road */
    var road = "M" + (VP[0] - 3) + "," + VP[1] + " L" + (VP[0] + 3) + "," + VP[1] + " L" + BR + ",600 L" + BL + ",600Z";
    s += P(road, k.url("road"), INK, 3);
    s += R.tone(k, "M" + VP[0] + "," + VP[1] + " L" + BL + ",600 L" + (BL + 120) + ",600Z", .25);
    /* centre dashes, foreshortened */
    var mid = (BL + BR) / 2, dsh = "";
    for (var t = .04; t < 1; t *= 1.42) { var t2 = Math.min(1, t * 1.2); dsh += "M" + f(VP[0] + (mid - VP[0]) * t) + "," + f(VP[1] + (600 - VP[1]) * t) + " L" + f(VP[0] + (mid - VP[0]) * t2) + "," + f(VP[1] + (600 - VP[1]) * t2) + " "; }
    s += P(dsh, "none", "#e3c03a", 1, 'stroke-width="6"').replace('stroke-width="1"', "");
    /* heat shimmer at the vanishing point */
    s += P("M312,256 q10,-4 20,0 t20,0 t20,0 M300,250 q12,-4 24,0 t24,0 t24,0", "none", "#f6f0dc", 2, 'opacity=".7"');

    /* telephone poles on the right, converging, with a sagging wire and crows */
    var poles = [], wire = "";
    [.1, .2, .36, .62, 1.05].forEach(function (t) {
      var x = VP[0] + (BR + 40 - VP[0]) * t + 14 * t, yb = VP[1] + (600 - VP[1]) * t, h = 26 + 360 * t;
      poles.push([x, yb - h * .92, t]);
      s += P("M" + f(x) + "," + f(yb) + " V" + f(yb - h), "none", "#4a3426", 2 + 9 * t) + P("M" + f(x - h * .13) + "," + f(yb - h * .9) + " H" + f(x + h * .13), "none", "#4a3426", 1.5 + 5 * t);
    });
    for (var p = 0; p < poles.length - 1; p++) {
      var a = poles[p], b = poles[p + 1];
      wire += "M" + f(a[0]) + "," + f(a[1]) + " Q" + f((a[0] + b[0]) / 2) + "," + f((a[1] + b[1]) / 2 + 22 * b[2]) + " " + f(b[0]) + "," + f(b[1]) + " ";
    }
    s += P(wire, "none", INK, 1.6);
    [[468, 210, .7], [492, 216, .8], [528, 220, 1]].forEach(function (c) {
      s += '<g transform="translate(' + c[0] + "," + c[1] + ") scale(" + c[2] + ')">' + P("M0,0 c-4,-14 8,-18 12,-9 l9,-2 l-6,7 c2,6 -12,9 -15,4Z", INK) + "</g>";
    });

    /* route marker, near right */
    s += P("M552,600 V430", "none", "#5a5a52", 6) + P("M530,380 H574 V420 C574,436 552,444 552,444 C552,444 530,436 530,420Z", "#efe9da", INK, 3);
    s += '<text x="552" y="414" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="26" fill="' + INK + '">9</text>';

    /* ---------- Rusty ---------- */
    var rx = 205, ry = 526, rs = .64, head = [rx + 2 * rs, ry - 362 * rs];

    /* mailboxes + balloons, parametric along both shoulders; tethers bend toward Rusty's head */
    function mailbox(side, t) {
      var ex = side < 0 ? BL - 30 : BR + 30;
      var x = VP[0] + (ex - VP[0]) * t, y = VP[1] + (600 - VP[1]) * t, sc = .12 + t * 1.15, out = "";
      out += '<ellipse cx="' + f(x) + '" cy="' + f(y + 2 * sc) + '" rx="' + f(14 * sc) + '" ry="' + f(3 * sc) + '" fill="#000" opacity=".3"/>';
      out += P("M" + f(x) + "," + f(y) + " V" + f(y - 70 * sc), "none", "#5a4030", 2 + 6 * sc);
      out += P("M" + f(x - 16 * sc) + "," + f(y - 70 * sc) + " v" + f(-18 * sc) + " a" + f(16 * sc) + "," + f(16 * sc) + " 0 0 1 " + f(32 * sc) + ",0 v" + f(18 * sc) + "Z", "#8a8a84", INK, 1 + 1.6 * sc);
      out += P("M" + f(x + 16 * sc) + "," + f(y - 96 * sc) + " v" + f(-14 * sc) + " h" + f(8 * sc) + " v" + f(6 * sc) + "Z", "#c0221b", INK, 1);
      /* the balloon leans toward him */
      var ax = x, ay = y - 88 * sc, dx = head[0] - ax, dy = head[1] - ay, dl = Math.hypot(dx, dy) || 1;
      var L = 120 * sc + 20, ux = dx / dl * .62, uy = -.78 + dy / dl * .25, ul = Math.hypot(ux, uy);
      ux /= ul; uy /= ul;
      var bx = ax + ux * L, by = ay + uy * L, ang = Math.atan2(uy, ux) * 180 / Math.PI + 90;
      out += P("M" + f(ax) + "," + f(ay) + " Q" + f(ax + ux * L * .2) + "," + f(ay + uy * L * .6) + " " + f(bx - ux * 26 * sc) + "," + f(by - uy * 30 * sc), "none", "#f4f0e4", .8 + .8 * sc);
      out += '<g transform="translate(' + f(bx) + "," + f(by) + ") rotate(" + f(ang) + ")\">" +
        '<ellipse rx="' + f(24 * sc) + '" ry="' + f(30 * sc) + '" fill="#c0221b" stroke="' + INK + '" stroke-width="' + f(1 + 1.6 * sc) + '"/>' +
        P("M" + f(-4 * sc) + "," + f(30 * sc) + " l" + f(4 * sc) + "," + f(6 * sc) + " l" + f(4 * sc) + "," + f(-6 * sc) + "Z", "#8b1414", INK, 1) +
        '<ellipse cx="' + f(-8 * sc) + '" cy="' + f(-12 * sc) + '" rx="' + f(5 * sc) + '" ry="' + f(9 * sc) + '" fill="#fff" opacity=".55"/>' +
        '<path d="M' + f(6 * sc) + "," + f(-20 * sc) + " a" + f(22 * sc) + "," + f(28 * sc) + " 0 0 1 " + f(14 * sc) + "," + f(28 * sc) + '" fill="none" stroke="#7a0a0a" stroke-width="' + f(4 * sc) + '" opacity=".5"/>' +
        "</g>";
      return out;
    }
    /* far to near so the near ones overlap */
    var boxes = [[-1, .06], [1, .09], [-1, .11], [1, .17], [-1, .17], [1, .3], [1, .5], [1, .78], [-1, .92]];
    boxes.forEach(function (b) { if (b[1] < .8) s += mailbox(b[0], b[1]); });

    /* Rusty: three-quarter toward us, mid-stride, the parcel held to his chest */
    var pkg = P("M-26,-22 L24,-28 L30,18 L-22,24Z", "#d9d0b8", INK, 2.5) + P("M-16,-14 h30 M-14,-4 h34 M-12,6 h30", "none", "#7a7468", 1.5) + P("M-24,-2 L28,-6", "none", "#a08a5a", 3);
    s += '<ellipse cx="' + (rx + 4) + '" cy="' + (ry + 2) + '" rx="52" ry="9" fill="#000" opacity=".4"/>';
    s += R.person(k, { x: rx, y: ry, s: rs, pose: "walkCarry", carry: pkg, outfit: "suit", expr: "resolve", turn: .3, light: 1, stoop: 6 });
    /* sweat and heat */
    s += P("M" + (head[0] + 34) + "," + (head[1] - 28) + " q-4,9 0,12 q4,-3 0,-12Z M" + (head[0] - 32) + "," + (head[1] - 18) + " q-3,7 0,9 q3,-2 0,-9Z", "#cfe6f0", INK, 1.4);
    s += P("M" + (head[0] + 48) + "," + (head[1] - 40) + " q6,-4 10,2 M" + (head[0] + 52) + "," + (head[1] - 24) + " q6,-2 9,3", "none", "#5a7a90", 2);

    /* the near mailboxes, over everything */
    boxes.forEach(function (b) { if (b[1] >= .8) s += mailbox(b[0], b[1]); });
    s += R.vignette(k, 600, 600, .4);
    return s;
  }
});
