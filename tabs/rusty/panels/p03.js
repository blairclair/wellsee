/* p03: Close-up: big chapped hands wringing a mop over a yellow bucket. Wedding band worn thin.
   Span 2, viewBox 400x600, mood day, wear 0. */
RUSTY.panel({
  id: "p03", w: 400, h: 600,
  alt: "Close-up of Rusty's big, chapped hands twisting grey water out of a mop into a yellow bucket. A thin wedding band on one finger.",
  captions: [{ at: "bl", text: "He never amounted to much.", w: 80 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    /* tiled wall */
    s += '<rect width="400" height="600" fill="#cfc4a4"/>';
    var g = ""; for (var y = 0; y < 420; y += 40) g += "M0," + y + " H400 "; for (var x = 0; x < 400; x += 40) g += "M" + x + ",0 V420 ";
    s += P(g, "none", "#a89c7c", 2) + R.tone(k, "M0,0 H400 V420 H0Z", .15);
    s += '<rect y="420" width="400" height="180" fill="#8a7c5c"/>' + P("M0,420 H400", "none", INK, 3);
    /* bucket */
    s += P("M-20,420 L420,420 L400,640 L0,640Z", "#d9a62b", INK, 4);
    s += R.tone(k, "M300,420 L420,420 L400,640 L300,640Z", .35);
    s += '<ellipse cx="200" cy="420" rx="230" ry="30" fill="#6d7568" stroke="' + INK + '" stroke-width="4"/>';
    /* wringer */
    s += P("M40,380 H360 V420 H40Z", "#8a8a84", INK, 4) + P("M60,392 H340", "none", "#c9c9c0", 4);
    /* twisted mop strands */
    var strands = "";
    for (var i = 0; i < 9; i++) {
      var x0 = 150 + i * 12;
      strands += "M" + x0 + ",90 C" + (x0 + 40) + ",160 " + (x0 - 40) + ",230 " + (x0 + 10) + ",300 C" + (x0 + 30) + ",330 " + (x0 - 10) + ",360 " + (x0 + 4) + ",392 ";
    }
    s += P(strands, "none", INK, 11) + P(strands, "none", "#cfc7b0", 7);
    s += R.tone(k, "M140,90 H200 V392 H140Z", .3);
    /* drips + splash */
    s += P("M200,400 c-3,12 -3,20 0,24 c3,-4 3,-12 0,-24Z M180,404 c-2,8 -2,13 0,16 c2,-3 2,-8 0,-16Z M224,406 c-2,8 -2,13 0,16 c2,-3 2,-8 0,-16Z", "#9ab0b4", INK, 1.5);
    s += P("M150,430 q10,-14 20,0 M230,434 q10,-12 20,0", "none", "#c9d6d8", 3);
    s += R.sfx("drip", 270, 370, 30, { fill: "#9ab0b4", rot: 8 });
    /* two fists twisting opposite ways */
    s += R.fist(k, { x: 132, y: 150, s: 1.45, rot: -14, sleeve: "#7f8b6c", ring: true });
    s += R.fist(k, { x: 270, y: 290, s: 1.45, rot: 196, sleeve: "#7f8b6c" });
    s += P("M90,230 q-20,10 -26,30 M330,200 q20,-10 22,-34", "none", INK, 3);   /* twist lines */
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
