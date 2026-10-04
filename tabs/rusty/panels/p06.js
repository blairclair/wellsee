/* p06: FLASHBACK (sepia). Danny's graduation, ten years ago. Drunk young Rusty; Danny, 18, turns away.
   Span 4, viewBox 800x600, mood flashback, wear -. */
RUSTY.panel({
  id: "p06", w: 800, h: 600,
  alt: "Sepia flashback: a high-school graduation on a football field. Folding chairs knocked over, the crowd in the bleachers staring. A younger, red-faced Rusty sways with a bottle in his coat pocket, reaching out. His son Danny, eighteen, in cap and gown, clutches his diploma and turns away, shouting.",
  captions: [
    { at: "tl", text: "Ten years ago. Danny's graduation. Rusty doesn't remember what he said.", w: 52 },
    { at: "br", text: "Danny does.", w: 26 }
  ],
  balloons: [
    { kind: "shout", who: "Danny", x: 58, y: 3, w: 38, tail: [70, 27], text: "Don't come. Don't call. Don't <b>EVER.</b>" }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    function rnd(i) { var x = Math.sin(i * 91.7 + 2.3) * 43758.5453; return x - Math.floor(x); }
    s += '<rect width="800" height="600" fill="#d8c8a0"/>';
    /* bleachers + staring crowd */
    s += P("M0,120 H800 V330 H0Z", "#9a8a6a", INK, 3);
    var rows = "";
    for (var r = 0; r < 5; r++) rows += "M0," + (150 + r * 38) + " H800 ";
    s += P(rows, "none", "#6a5a40", 4);
    var crowd = "";
    for (var i = 0; i < 46; i++) {
      var row = i % 5, x = (i * 53 + row * 27) % 800, y = 146 + row * 38;
      if (x > 120 && x < 240 && row > 2) continue;
      crowd += '<circle cx="' + x + '" cy="' + (y - 12) + '" r="11" fill="#7a6a4e" stroke="' + INK + '" stroke-width="2"/>' +
        P("M" + (x - 16) + "," + (y + 14) + " C" + (x - 14) + "," + (y - 4) + " " + (x + 14) + "," + (y - 4) + " " + (x + 16) + "," + (y + 14), "#7a6a4e", INK, 2) +
        '<circle cx="' + (x - 4) + '" cy="' + (y - 13) + '" r="1.6" fill="' + INK + '"/><circle cx="' + (x + 4) + '" cy="' + (y - 13) + '" r="1.6" fill="' + INK + '"/>';
    }
    s += crowd + R.tone(k, "M0,120 H800 V330 H0Z", .3);
    /* banner */
    s += '<g transform="rotate(-2 400 100)">' + P("M180,70 H620 L606,92 L620,114 H180 L194,92Z", "#efe4c8", INK, 3) +
      '<text x="400" y="101" text-anchor="middle" font-family="Bangers, sans-serif" font-size="28" letter-spacing="3" fill="#5a3a20">CONGRATULATIONS CLASS OF 2016</text></g>';
    /* field */
    s += P("M0,330 H800 V600 H0Z", "#a8a070", INK, 3);
    s += P("M0,420 H800 M0,520 H800", "none", "#efe9da", 4, 'opacity=".6"');
    /* knocked-over folding chairs */
    function chair(x, y, a) {
      return '<g transform="rotate(' + a + " " + x + " " + y + ')">' + P("M" + (x - 20) + "," + y + " L" + (x - 14) + "," + (y - 70) + " M" + (x + 20) + "," + y + " L" + (x + 14) + "," + (y - 70) +
        " M" + (x - 22) + "," + (y - 36) + " H" + (x + 22) + " M" + (x - 16) + "," + (y - 70) + " H" + (x + 16), "none", "#4a4a44", 5) +
        P("M" + (x - 16) + "," + (y - 74) + " h32 v-24 h-32Z", "#6a6a60", INK, 2) + "</g>";
    }
    s += chair(80, 500, -70) + chair(360, 470, 15) + chair(700, 520, 0) + chair(740, 520, 0) + chair(40, 440, 0);
    s += P("M300,560 C320,540 360,548 380,560", "none", "#6a5a40", 3);
    /* young Rusty, swaying, reaching */
    s += '<ellipse cx="230" cy="568" rx="80" ry="10" fill="#5a4a30" opacity=".4"/>';
    s += '<g transform="rotate(-5 230 566)">' + R.person(k, { x: 230, y: 566, s: .98, ch: "rustyYoung", outfit: "coat", pose: "reach", expr: "drunk", turn: .4, stoop: -7, light: 1 }) + "</g>";
    s += P("M178,368 l-6,-40 h18 l-4,40Z", "#5a6a3a", INK, 2.5);                 /* bottle in pocket */
    s += P("M140,240 q-10,-8 -4,-18 M150,250 q-14,-2 -16,-14", "none", INK, 2);        /* sway lines */
    /* Danny, 18, walking away, looking back */
    s += '<ellipse cx="570" cy="568" rx="80" ry="10" fill="#5a4a30" opacity=".4"/>';
    var diploma = P("M-26,-8 L26,-14 L28,4 L-24,10Z", "#efe9da", INK, 2) + P("M-2,-12 l2,20", "none", "#8b1414", 4);
    s += R.person(k, { x: 570, y: 566, s: 1.0, ch: "danny18", outfit: "gown", pose: "walkCarry", carry: diploma, expr: "anger", turn: -.6, hat: "mortar", light: -1, headTilt: -6 });
    /* sepia wash + grain */
    s += '<rect width="800" height="600" fill="#a0763a" style="mix-blend-mode:multiply" opacity=".55"/>';
    s += '<rect width="800" height="600" fill="' + k.url("dots") + '" opacity=".12"/>';
    var scratch = ""; for (var j = 0; j < 10; j++) { var sx = rnd(j) * 800; scratch += "M" + sx.toFixed(0) + ",0 L" + (sx + rnd(j + 20) * 20 - 10).toFixed(0) + ",600 "; }
    s += P(scratch, "none", "#f6eedb", 1.2, 'opacity=".35"');
    s += R.vignette(k, 800, 600, 1);
    return s;
  }
});
