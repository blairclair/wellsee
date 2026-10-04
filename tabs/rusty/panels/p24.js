/* p24: Under the screaming booth, Rusty mops a floor of blood. Red bucket water. His tie still on, filthy.
   Span 2, viewBox 400x600, mood grey, wear 0.4. */
RUSTY.panel({
  id: "p24", w: 400, h: 600,
  alt: "The crawlspace under a carnival booth. Red light knifes down through the gaps in the floorboards overhead, and blood drips through them in long threads. Greyer now, Rusty mops a floor slick with it, his filthy tie still knotted. Behind his mop a clean swath is already spotting red again. His bucket water is red, and rows of posts run back into the dark.",
  captions: [
    { at: "tl", text: "Every night.", w: 50 },
    { at: "br", text: "The same night.", w: 56 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    function rnd(i) { var x = Math.sin(i * 91.7 + 2.3) * 43758.5453; return x - Math.floor(x); }
    var FL = 470;   /* floor line at the back */
    s += "<defs>" +
      '<linearGradient id="' + k.id("shaft") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff4a2a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + k.id("pool") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0a0c"/><stop offset=".5" stop-color="#5c0f12"/><stop offset="1" stop-color="#2a0608"/></linearGradient>' +
      '<filter id="' + k.id("refl") + '"><feColorMatrix type="matrix" values=".5 0 0 0 .2  0 .1 0 0 0  0 0 .1 0 0  0 0 0 .45 0"/></filter>' +
      "</defs>";
    /* the dark back of the crawlspace, posts receding */
    s += '<rect width="400" height="600" fill="#1c1b1d"/>';
    for (var r = 0; r < 4; r++) {
      var sc = .35 + r * .2, top = 120, bot = FL - 70 + r * 22, op = .25 + r * .2;
      [70, 330].forEach(function (x0) {
        var x = 200 + (x0 - 200) * sc;
        s += P("M" + f(x) + "," + top + " V" + f(bot), "none", "#2c2a2a", 8 + r * 4, 'opacity="' + op + '"');
      });
      s += P("M" + f(200 - 130 * sc) + "," + f(top + 40 + r * 6) + " L" + f(200 + 130 * sc) + "," + f(bot - 30), "none", "#2c2a2a", 3 + r, 'opacity="' + op + '"');
    }
    /* the floor back there: grey dirt, going black */
    s += P("M0," + (FL - 70) + " H400 V600 H0Z", "#2a2828");
    s += R.tone(k, "M0," + (FL - 70) + " H400 V" + FL + " H0Z", .3, true);

    /* the booth floor overhead: boards with gaps of carnival red */
    s += P("M0,0 H400 V128 H0Z", "#3a3634", INK, 3);
    var gaps = [34, 92, 148, 214, 268, 330, 384];
    gaps.forEach(function (x) { s += P("M" + x + ",0 V128", "none", "#ff5a2a", 4) + P("M" + (x - 3) + ",0 V128 M" + (x + 3) + ",0 V128", "none", INK, 1.5); });
    s += R.tone(k, "M0,0 H400 V128 H0Z", .35);
    s += P("M0,128 H400", "none", INK, 6) + P("M0,118 H400", "none", "#4a4442", 6);
    /* joists */
    [0, 200, 400].forEach(function (x) { s += P("M" + (x - 10) + ",128 h20 v16 h-20Z", "#2a2624", INK, 2.5); });
    s += R.sfx("aaaaaahhh", 210, 70, 30, { anchor: "middle", fill: "#9a9690", stroke: "#1a1818", sw: 3, rot: -3, extra: 'opacity=".75"' });
    s += R.sfx("thump", 70, 104, 18, { fill: "#7a7670", stroke: "#1a1818", sw: 2, rot: 6, extra: 'opacity=".7"' });
    /* light shafts slanting down through the gaps */
    gaps.forEach(function (x, i) {
      s += P("M" + (x - 2) + ",128 L" + (x + 2) + ",128 L" + (x + 46) + ",600 L" + (x + 22) + ",600Z", k.url("shaft"), null, 0, 'opacity="' + (.55 + (i % 3) * .15) + '"');
    });

    /* the blood floor: glossy, the shafts reflected in it */
    s += P("M0," + FL + " C80," + (FL - 8) + " 220," + (FL + 10) + " 400," + (FL - 4) + " V600 H0Z", k.url("pool"), INK, 2);
    gaps.forEach(function (x, i) {
      s += P("M" + (x + 26) + "," + (FL + 14 + i % 3 * 6) + " L" + (x + 40) + ",600", "none", "#c0402a", 3, 'opacity=".45"');
    });
    /* the mopped swath behind him: grey wet boards, already spotting red again */
    var sw = "";
    for (var j = 0; j < 7; j++) sw += "M" + (8 + j * 6) + "," + (548 + j * 6) + " C" + (70 + j * 4) + "," + (526 + j * 5) + " " + (160 - j * 3) + "," + (528 + j * 4) + " " + (226 - j * 4) + "," + (546 + j * 3) + " ";
    s += P(sw, "none", "#5a4a48", 5, 'opacity=".55"') + P(sw, "none", "#7a6a66", 1.5, 'opacity=".5"');
    var spots = ""; for (var i = 0; i < 14; i++) { var sx = 24 + rnd(i) * 190, sy = 540 + rnd(i + 30) * 40; spots += '<ellipse cx="' + f(sx) + '" cy="' + f(sy) + '" rx="' + f(2 + rnd(i + 9) * 4) + '" ry="' + f(1 + rnd(i + 9) * 2) + '" fill="#7a1214"/>'; }
    s += spots;

    /* threads of blood falling from the gaps, and the rings where they land */
    gaps.forEach(function (x, i) {
      var L = 90 + (i * 53) % 210, y1 = 128 + L;
      s += P("M" + x + ",128 C" + (x + 1) + "," + (128 + L * .4) + " " + (x - 1) + "," + (128 + L * .7) + " " + x + "," + y1, "none", "#8b1414", 3);
      s += P("M" + x + "," + (y1 + 8) + " c-4,7 -4,12 0,13 c4,-1 4,-6 0,-13Z", "#9b1818", INK, 1);
      var ry = FL + 30 + (i * 37) % 80;
      s += '<ellipse cx="' + (x + 4) + '" cy="' + ry + '" rx="10" ry="2.6" fill="none" stroke="#b03a2a" stroke-width="1.5" opacity=".6"/><ellipse cx="' + (x + 4) + '" cy="' + ry + '" rx="18" ry="4.4" fill="none" stroke="#b03a2a" stroke-width="1" opacity=".35"/>';
    });

    /* bucket of red, with its wringer */
    s += R.bucket(k, { x: 332, y: 588, s: .78, water: "#7a1012" });
    s += P("M300,530 h50 l6,-22 h-62Z", "#7a7a72", INK, 2.5) + P("M352,510 l22,-30", "none", INK, 6) + P("M352,510 l22,-30", "none", "#8a8a82", 3);
    s += P("M312,534 c-2,10 2,18 0,26 M336,534 c2,8 -2,14 0,22", "none", "#8b1414", 3);

    /* Rusty's reflection in the blood, dim and upside down */
    s += '<g filter="url(#' + k.id("refl") + ')" opacity=".6"><g transform="translate(0,1160) scale(1,-1)">' +
      R.person(k, { x: 170, y: 584, s: .9, pose: "mop", outfit: "eternal", wear: .4, expr: "resigned", turn: .2, light: -1, headTilt: 10 }) + "</g></g>";
    /* Rusty mopping */
    s += R.person(k, { x: 170, y: 584, s: .9, pose: "mop", outfit: "eternal", wear: .4, expr: "resigned", turn: .2, light: -1, headTilt: 10 });
    /* the push of the mop, a bow wave of blood ahead of it */
    s += P("M240,594 C262,580 300,580 322,590", "none", "#a3171c", 4) + P("M244,598 C270,588 296,588 318,596", "none", "#c0402a", 2, 'opacity=".6"');

    s += R.vignette(k, 400, 600, .8);
    return s;
  }
});
