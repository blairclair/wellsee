/* p25: The inside of the broom-closet door: thousands of tally marks, and then they stop.
   On the shelf, a crooked popsicle-stick rabbit and the old sobriety chip. Span 2, 400x600, mood grey, wear 0.6. */
RUSTY.panel({
  id: "p25", w: 400, h: 600,
  alt: "The inside of a broom-closet door, covered top to bottom in scratched tally marks, thousands of them, until they simply stop. On the shelf below sit a crooked rabbit made of popsicle sticks and a worn bronze nine-year sobriety chip.",
  captions: [{ at: "bl", text: "He stopped counting at 14,000.", w: 84 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#5a5650"/>';
    s += P("M20,0 H380 V440 H20Z", "#77736a", INK, 4);
    var grain = ""; for (var y = 10; y < 440; y += 22) grain += "M20," + y + " C120," + (y + 6) + " 260," + (y - 6) + " 380," + y + " ";
    s += P(grain, "none", "#6a665e", 2);
    /* tally marks, groups of five, getting shakier, then stopping */
    var t = "", n = 0;
    for (var row = 0; row < 15; row++) {
      for (var col = 0; col < 9; col++) {
        if (row === 14 && col > 3) break;
        var x = 34 + col * 38, y = 16 + row * 28, j = row * .25;
        for (var m = 0; m < 4; m++) t += "M" + (x + m * 7) + "," + (y + Math.sin(n++) * j) + " l" + (Math.sin(n) * j).toFixed(1) + ",22 ";
        t += "M" + (x - 3) + "," + (y + 18) + " L" + (x + 26) + "," + (y + 3) + " ";
      }
    }
    s += P(t, "none", "#2a2826", 2.2);
    s += P("M178,410 l3,22", "none", "#2a2826", 2.2);  /* the last single mark */
    /* shelf */
    s += P("M0,440 H400 V466 H0Z", "#3a3432", INK, 3);
    s += '<g transform="rotate(-6 150 440)">' + R.woodRabbit(k, { x: 140, y: 440, s: 1.25, color: "#d9c08c" }) + "</g>";
    s += P("M104,420 l60,-8 M110,400 l50,6", "none", "#a8905a", 3, 'opacity=".7"');
    s += '<circle cx="290" cy="420" r="24" fill="#8a6a3a" stroke="' + INK + '" stroke-width="3"/>' + P("M290,404 L304,428 H276Z", "none", "#4a3010", 2.5) + R.sfx("9", 290, 428, 15, { anchor: "middle", fill: "#4a3010", stroke: "#c9a070", sw: 1 });
    s += P("M0,466 H400 V600 H0Z", "#2a2826", INK, 3);
    s += R.vignette(k, 400, 600, .7);
    return s;
  }
});
