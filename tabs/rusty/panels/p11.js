/* p11: A shaft of gold light falls on Rusty alone; a ticket flutters into his open palm: ADMIT ONE · TONIGHT.
   Span 2, viewBox 400x600, mood light.
   Low angle from behind his hand: the lot and town go cold and grey around him; only the shaft is warm. */
RUSTY.panel({
  id: "p11", w: 400, h: 600,
  alt: "Low angle in the grey dawn parking lot. A single shaft of gold light slants down out of the sky onto Rusty alone, dust turning in it, while the town and lot around him go cold and colourless. In the foreground his big open hand, wedding band worn thin, waits palm-out as a red carnival ticket flutters down into it: ADMIT ONE, TONIGHT.",
  captions: [],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var GOLD = "#f6d27a";
    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1c1a24"/><stop offset=".55" stop-color="#3a3844"/><stop offset="1" stop-color="#5a5660"/></linearGradient>' +
      '<linearGradient id="' + k.id("shaft") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".85"/><stop offset=".6" stop-color="' + GOLD + '" stop-opacity=".5"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity=".25"/></linearGradient>' +
      '<clipPath id="' + k.id("beam") + '"><path d="M196,-10 L290,-10 L392,600 L40,600Z"/></clipPath>' +
      "</defs>";
    /* cold world: grey dawn, the town and lot drained of colour */
    s += '<rect width="400" height="600" fill="' + k.url("sky") + '"/>';
    s += P("M0,318 V290 h30 v-16 h26 v16 h40 v-30 l12,-14 l12,14 v30 h44 v-12 h50 v12 h60 v-22 h40 v22 h86 V318Z", "#24222c", INK, 2);
    s += P("M0,318 H400 V600 H0Z", "#3e3c44", INK, 2.5);
    [[-200, 120], [60, 170], [330, 230], [620, 300]].forEach(function (l) {
      s += P("M" + l[0] + ",600 L" + l[1] + ",318", "none", "#8a8890", 4, 'opacity=".45"');
    });
    /* his pickup, a dark shape off to the left; the school's corner */
    s += P("M0,330 L70,326 L84,300 L130,298 L140,326 L166,328 L166,366 L0,370Z", "#2a2830", INK, 3) + '<circle cx="40" cy="370" r="14" fill="#141418" stroke="' + INK + '" stroke-width="3"/><circle cx="136" cy="368" r="14" fill="#141418" stroke="' + INK + '" stroke-width="3"/>';
    s += P("M360,318 V200 H400 V318Z", "#2e2a30", INK, 3);
    s += R.tone(k, "M0,0 H400 V600 H0Z", .32, true);

    /* the shaft: warm, slanting out of the sky, and the world inside it gets its colour back */
    s += P("M196,-10 L290,-10 L392,600 L40,600Z", k.url("shaft"));
    s += '<g clip-path="' + k.url("beam") + '">' +
      P("M0,318 H400 V600 H0Z", "#9a7a4a", null, 0, 'opacity=".55"') +
      [[60, 170], [330, 230]].map(function (l) { return P("M" + (l[0] < 200 ? -200 : 620) + ",600 L" + l[1] + ",318", "none", "#fff1b8", 5, 'opacity=".7"'); }).join("") +
      P("M228,-10 L258,-10 L340,600 L130,600Z", "#fff6d8", null, 0, 'opacity=".35"') +
      "</g>";
    s += P("M196,-10 L40,600 M290,-10 L392,600", "none", "#fff1b8", 2, 'opacity=".6"');
    s += '<ellipse cx="216" cy="580" rx="180" ry="26" fill="#ffe9a8" opacity=".35"/>';
    s += R.glow(k, 220, 280, 240, .55);
    /* dust turning in the light */
    [[214, 60, 2.5], [250, 110, 2], [232, 170, 3], [276, 210, 2], [200, 250, 2.5], [300, 300, 2], [170, 320, 3], [262, 40, 1.6], [224, 130, 1.4], [288, 150, 1.6], [190, 190, 1.8]].forEach(function (p) {
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#fffbe6"/>';
    });

    /* his hand, palm out, big in the foreground, lit from above */
    s += R.openHand(k, { x: 214, y: 476, s: 1.9, rot: 4, curl: .22, sleeve: "#7f8b6c", ring: false });
    s += '<g transform="translate(214,476) rotate(4) scale(1.9)">';
    /* a thin, worn wedding band across the base of the ring finger */
    var a = -84 * Math.PI / 180, b = [8, -31], cx = b[0] + Math.cos(a) * 17, cy = b[1] + Math.sin(a) * 17, px = -Math.sin(a) * 10.5, py = Math.cos(a) * 10.5;
    s += P("M" + f(cx - px) + "," + f(cy - py) + " L" + f(cx + px) + "," + f(cy + py), "none", INK, 6.5) + P("M" + f(cx - px) + "," + f(cy - py) + " L" + f(cx + px) + "," + f(cy + py), "none", "#e0b84a", 3.2);
    /* knuckle creases on each finger (same geometry as R.openHand), calluses, the life line round the thumb */
    var bases = [[-26, -26], [-9, -32], [8, -31], [24, -24]], lens = [54, 64, 60, 46], angs = [-104, -94, -84, -72], cr = "";
    bases.forEach(function (bb, i) {
      var aa = angs[i] * Math.PI / 180, L = lens[i], m = [bb[0] + Math.cos(aa) * L * .55, bb[1] + Math.sin(aa) * L * .55];
      var a2 = aa + .22 * 1.4, w = 6.5, q = [m[0] + Math.cos(a2) * L * .22, m[1] + Math.sin(a2) * L * .22];
      [[m, aa], [q, a2]].forEach(function (pp) {
        var nx = -Math.sin(pp[1]) * w, ny = Math.cos(pp[1]) * w;
        cr += "M" + f(pp[0][0] - nx) + "," + f(pp[0][1] - ny) + " Q" + f(pp[0][0] + Math.cos(pp[1]) * 2) + "," + f(pp[0][1] + Math.sin(pp[1]) * 2) + " " + f(pp[0][0] + nx) + "," + f(pp[0][1] + ny) + " ";
      });
    });
    s += P(cr, "none", "#7a4a3a", 1.5, 'opacity=".85"');
    s += P("M-30,4 C-20,-6 -26,-22 -36,-28", "none", "#7a4a3a", 1.6, 'opacity=".8"');
    s += P("M-12,-28 c4,-3 10,-3 14,0 M14,-26 c4,-3 8,-3 12,0", "#f0cfa8", "#7a4a3a", 1, 'opacity=".9"');
    s += P("M-56,-30 l6,-3", "none", "#7a4a3a", 1.4);
    /* light pooling on the fingertips and heel of the palm; grime in the creases */
    s += P("M-50,-84 c4,-4 10,-4 12,0 M-18,-96 c4,-4 10,-4 12,0 M14,-92 c4,-4 10,-4 12,0 M36,-70 c4,-4 10,-4 12,0", "none", "#fff4c8", 3.2, 'opacity=".9"');
    s += P("M-34,-24 C-14,-30 14,-30 32,-24", "none", "#fff4c8", 2.5, 'opacity=".6"');
    s += P("M-18,24 C-6,30 10,30 22,22", "none", "#5a3a3a", 1.4, 'opacity=".6"');
    s += P("M-34,52 L-34,120 M34,52 L34,120", "none", "#ffe48a", 2.5, 'opacity=".5"');
    s += P("M-36,46 L36,46 L38,64 L-38,64Z", "#6a7658", INK, 3);
    s += "</g>";

    /* the ticket, fluttering down: notched ends, perforation, a serial number */
    s += '<g transform="translate(212,214) rotate(-16)">';
    s += '<path d="M-92,-40 H92 V40 H-92Z" fill="#000" opacity=".25" transform="translate(10,14)"/>';
    var edge = "M-92,-40 "; for (var y = -40; y < 40; y += 8) edge += "l-6,4 l6,4 "; edge += "H92 "; for (var y2 = 40; y2 > -40; y2 -= 8) edge += "l6,-4 l-6,-4 "; edge += "Z";
    s += P(edge, "#c0221b", INK, 3.5);
    s += P("M-80,-30 H80 V30 H-80Z", "none", GOLD, 2, 'stroke-dasharray="6 4"');
    s += P("M52,-40 V40", "none", "#5a0a0a", 2, 'stroke-dasharray="3 4"');
    s += R.sfx("ADMIT ONE", -14, 2, 28, { anchor: "middle", fill: GOLD, sw: 2.6 });
    s += '<text x="-14" y="24" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="16" fill="#f6e2b0" letter-spacing="4">· TONIGHT ·</text>';
    s += '<text x="0" y="0" transform="translate(70,0) rotate(-90)" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="10" fill="#f6e2b0" letter-spacing="1">No. 1</text>';
    s += P("M-60,-40 l20,0 M30,40 l24,0", "none", "#ff8a6a", 2, 'opacity=".6"');
    s += "</g>";
    /* flutter: arcs of its fall */
    s += P("M96,130 q-24,-22 -10,-56 M330,150 q26,-24 14,-58 M336,262 q22,6 30,-14 M112,276 q-18,10 -30,-6", "none", "#fffbe6", 3.2, 'opacity=".85"');
    s += R.vignette(k, 400, 600, .85);
    return s;
  }
});
