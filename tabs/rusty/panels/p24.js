/* p24: Under the screaming booth, Rusty mops a floor of blood. Red bucket water. His tie still on, filthy.
   Span 2, viewBox 400x600, mood grey, wear 0.4. */
RUSTY.panel({
  id: "p24", w: 400, h: 600,
  alt: "Under the floorboards of a booth, blood drips through the gaps. Greyer now, Rusty mops a floor slick with it, his filthy tie still knotted, his bucket water red.",
  captions: [
    { at: "tl", text: "Every night.", w: 50 },
    { at: "br", text: "The same night.", w: 56 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#232224"/>';
    /* booth floorboards overhead with gaps of red light */
    s += P("M0,0 H400 V120 H0Z", "#3a3432", INK, 3);
    var g = ""; for (var x = 0; x < 400; x += 50) g += "M" + x + ",0 V120 ";
    s += P(g, "none", "#7a1414", 4) + P("M0,120 H400", "none", INK, 5);
    s += R.sfx("aaaaahh", 220, 50, 26, { fill: "#8a8a84", rot: -4, extra: 'opacity=".6"' });
    /* support posts */
    s += P("M30,120 V470 M370,120 V470", "none", "#2a2624", 22) + P("M30,120 V470 M370,120 V470", "none", INK, 2);
    /* drips */
    [50, 100, 150, 200, 250, 300, 350].forEach(function (x, i) {
      var L = 30 + (i * 37) % 90;
      s += P("M" + x + ",120 V" + (120 + L), "none", "#7a1414", 4) + P("M" + x + "," + (126 + L) + " c-4,7 -4,12 0,13 c4,-1 4,-6 0,-13Z", "#8b1414", INK, 1);
    });
    /* floor of blood */
    s += P("M0,470 H400 V600 H0Z", "#3a3634", INK, 3);
    s += P("M0,480 C80,470 200,490 400,476 V600 H0Z", "#5c0f12", null, 0, 'opacity=".9"');
    s += P("M140,520 C200,500 290,505 330,520", "none", "#a33a3a", 3, 'opacity=".5"');
    /* bucket of red */
    s += R.bucket(k, { x: 320, y: 586, s: .75, water: "#7a1012" });
    /* Rusty mopping */
    s += R.person(k, { x: 170, y: 576, s: .9, pose: "mop", outfit: "eternal", wear: .4, expr: "resigned", turn: .2, light: -1, headTilt: 10 });
    s += R.vignette(k, 400, 600, .75);
    return s;
  }
});
