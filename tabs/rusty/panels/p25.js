/* p25: The inside of the broom-closet door: thousands of tally marks, and then they stop.
   On the shelf, a crooked popsicle-stick rabbit and the old sobriety chip. Span 2, 400x600, mood grey, wear 0.6. */
RUSTY.panel({
  id: "p25", w: 400, h: 600,
  alt: "The inside of a broom-closet door under one bare bulb, scratched top to bottom with tally marks, thousands of them, neat at first and then shakier and deeper, until they simply stop partway along a row. A thin line of red carnival light leaks under the door's edge. On the shelf below lie the bent nail he scratched them with, a crooked rabbit whittled from a popsicle stick, and a worn bronze nine-year sobriety chip.",
  captions: [{ at: "bl", text: "He stopped counting at 14,000.", w: 84 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
    s += "<defs>" +
      '<radialGradient id="' + k.id("bulb") + '" cx="50%" cy="0%" r="95%"><stop offset="0" stop-color="#fffbe8" stop-opacity=".5"/><stop offset=".6" stop-color="#fffbe8" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>' +
      "</defs>";
    s += '<rect width="400" height="600" fill="#4e4a45"/>';
    /* the door: painted plank, chipped */
    s += P("M20,0 H380 V440 H20Z", "#7c786e", INK, 4);
    var grain = ""; for (var y = 10; y < 440; y += 19) grain += "M20," + y + " C120," + (y + 5) + " 260," + (y - 5) + " 380," + y + " ";
    s += P(grain, "none", "#6e6a62", 1.6);
    s += P("M40,30 c10,-4 18,2 12,8 c-8,4 -16,0 -12,-8Z M330,300 c14,-2 18,8 8,10 c-10,2 -14,-4 -8,-10Z", "#5e5a52");
    /* the stile edge, hinges */
    s += P("M20,0 V440", "none", INK, 7) + P("M26,40 h14 v46 h-14Z M26,330 h14 v46 h-14Z", "#5a5650", INK, 2.5);

    /* the tallies: neat and shallow at the top, ragged and gouged deeper as the years go */
    var dark = "", pale = "", n = 0, ROWS = 21, COLS = 12, gx = 44, gy = 12, last = null;
    for (var row = 0; row < ROWS; row++) {
      var age = row / (ROWS - 1), j = .4 + age * 3.2;
      for (var col = 0; col < COLS; col++) {
        if (row === ROWS - 1 && col > 6) break;
        var x0 = gx + col * 27.5 + (rnd(n) - .5) * age * 3, y0 = gy + row * 15.6 + (rnd(n + 3) - .5) * age * 2;
        var marks = (row === ROWS - 1 && col === 6) ? 3 : 4;
        for (var m = 0; m < marks; m++) {
          var x = x0 + m * 4.6 + (rnd(n + m) - .5) * j, h = 12 + (rnd(n + m + 7) - .5) * j * 1.5, d = (rnd(n + m + 11) - .5) * j;
          dark += "M" + f(x) + "," + f(y0) + " l" + f(d) + "," + f(h) + " ";
          pale += "M" + f(x + 1.2) + "," + f(y0 + 1) + " l" + f(d) + "," + f(h - 1) + " ";
          last = [x, y0, h];
        }
        if (marks === 4) {
          var dy = (rnd(n + 21) - .5) * j;
          dark += "M" + f(x0 - 3) + "," + f(y0 + 11 + dy) + " L" + f(x0 + 18) + "," + f(y0 + 2 - dy) + " ";
          pale += "M" + f(x0 - 2) + "," + f(y0 + 12 + dy) + " L" + f(x0 + 19) + "," + f(y0 + 3 - dy) + " ";
        }
        n += 5;
      }
    }
    s += P(pale, "none", "#b5b0a2", 1.4, 'opacity=".75"') + P(dark, "none", "#262422", 1.9);
    /* the last one: one deep stroke, and a slip where the nail skidded off */
    s += P("M" + f(last[0] + 5) + "," + f(last[1]) + " l1," + f(last[2] + 2) + " l7,22", "none", "#1a1816", 2.6) + P("M" + f(last[0] + 6.2) + "," + f(last[1] + 1) + " l1," + f(last[2] + 2), "none", "#c9c4b4", 1.2);
    /* then nothing: bare paint, a single bulb's light on it */
    s += P("M20,0 H380 V440 H20Z", k.url("bulb"));
    /* the bulb itself, top of frame */
    s += P("M200,0 V12", "none", INK, 2) + R.glow(k, 200, 20, 60, .9) + '<circle cx="200" cy="20" r="7" fill="#fffbe0" stroke="' + INK + '" stroke-width="1.5"/>';

    /* a sliver of carnival red under the door's edge */
    s += P("M380,0 V440", "none", "#e0402a", 4, 'opacity=".75"') + R.glow(k, 384, 220, 70, .35, true) + P("M384,0 V440 H400 V0Z", "#1a1616");

    /* shelf */
    s += P("M0,440 H400 V466 H0Z", "#3a3432", INK, 3) + P("M0,447 H400", "none", "#4e4642", 2);
    /* the bent nail */
    s += P("M54,436 L96,431 L104,421", "none", INK, 5) + P("M54,436 L96,431 L104,421", "none", "#8a8478", 2.5) + P("M50,432 v8", "none", INK, 5);
    /* the popsicle-stick rabbit: whittled crooked from one flat stick, leaning on the chip */
    s += '<g transform="rotate(-8 196 440)">' + R.woodRabbit(k, { x: 200, y: 440, s: 1.05, color: "#dcc392" }) +
      P("M178,426 l10,-6 M186,432 l12,-8 M205,404 l6,-4", "none", "#a8905a", 1.6, 'opacity=".8"') +
      P("M168,440 h64", "none", "#c9b07a", 3) + "</g>";
    s += '<circle cx="290" cy="420" r="24" fill="#8a6a3a" stroke="' + INK + '" stroke-width="3"/><circle cx="290" cy="420" r="18" fill="none" stroke="#5a4020" stroke-width="1.5"/>' + P("M290,404 L304,428 H276Z", "none", "#4a3010", 2.5) + R.sfx("9", 290, 428, 15, { anchor: "middle", fill: "#4a3010", stroke: "#c9a070", sw: 1 });
    s += P("M276,406 c6,-4 14,-4 20,0", "none", "#d9b07a", 2, 'opacity=".8"');
    s += P("M0,466 H400 V600 H0Z", "#2a2826", INK, 3);
    /* in the dark under the shelf: his bucket, and the mop leaning up across the door's edge */
    s += '<g opacity=".55">' + R.bucket(k, { x: 300, y: 590, s: .9, water: "#4a0e10", color: "#8a7030" }) + "</g>";
    s += R.limb([[352, 600], [386, 150]], 8, "#7a6a50", 3);
    s += R.vignette(k, 400, 600, .75);
    return s;
  }
});
