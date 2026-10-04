/* p02: The long school corridor after hours; Rusty mopping, the floor shining behind him.
   Span 6, viewBox 1200x600, mood day, wear 0. */
RUSTY.panel({
  id: "p02", w: 1200, h: 600,
  alt: "An empty elementary-school corridor after hours, lined with teal lockers and doors decorated with paper hand-print turkeys. One fluorescent tube flickers. Rusty, in his olive work shirt and RUSTY nametag, mops the floor to a shine beside a yellow bucket and a WET FLOOR sign.",
  captions: [
    { at: "tl", text: "For thirty-one years, Russell Pruitt mopped the halls of Hollis Creek Elementary.", w: 46 },
    { at: "br", text: "The kids called him Rusty. Most of the teachers never learned his last name.", w: 44 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "", VX = 640, VY = 250;
    /* box: back wall 560..720 x 200..330 */
    s += P("M0,0 H1200 L720,200 H560Z", "#d8ccaa", INK, 3);            /* ceiling */
    s += P("M0,0 L560,200 V330 L0,600Z", "#c4b48a", INK, 3);              /* left wall */
    s += P("M1200,0 L720,200 V330 L1200,600Z", "#cdbf98", INK, 3);        /* right wall */
    s += P("M0,600 L560,330 H720 L1200,600Z", "#b2a27c", INK, 3);         /* floor */
    s += P("M560,200 H720 V330 H560Z", "#a89870", INK, 3);                /* back wall */
    s += P("M610,240 h60 v90 h-60Z", "#6a5a40", INK, 2) + P("M622,252 h36 v30 h-36Z", "#e8dfc0", INK, 2);  /* far door + window */
    s += R.sfx("EXIT", 640, 230, 18, { anchor: "middle", fill: "#c0221b", sw: 1.5 });
    /* ceiling lights */
    [0.12, 0.3, 0.5, 0.72].forEach(function (t, i) {
      var y = 200 * (1 - t) * 0 + (1 - t) * 0 + t * 200, half = 600 - (600 - 80) * t, y2 = y + 10 + 18 * (1 - t);
      var x0 = 600 - half * .22, x1 = 600 + half * .22 + 40 * (1 - t);
      var dead = i === 1;
      s += P("M" + x0 + "," + y + " H" + x1 + " L" + (x1 + 6) + "," + y2 + " H" + (x0 - 6) + "Z", dead ? "#8a8470" : "#fffbe6", INK, 2);
      if (!dead) s += R.glow(k, (x0 + x1) / 2, y2, 140 * (1 - t) + 40, .45);
    });
    s += P("M440,58 l-12,-14 M470,62 l2,-18 M510,58 l14,-12", "none", INK, 2);     /* flicker */
    /* lockers on left wall (perspective spacing) */
    var lk = "";
    for (var i = 1; i < 26; i++) {
      var x = 560 * (i / (i + 4)), yt = 200 * (x / 560) + 60 * (1 - x / 560), yb = 600 - 270 * (x / 560) - 70 * (1 - x / 560);
      lk += "M" + x.toFixed(1) + "," + yt.toFixed(1) + " L" + x.toFixed(1) + "," + yb.toFixed(1) + " ";
      if (i % 1 === 0 && x < 520) {
        var vy = yt + (yb - yt) * .14, ww = 10 * (1 - x / 560) + 2;
        lk += "M" + (x + 4).toFixed(1) + "," + vy.toFixed(1) + " h" + ww.toFixed(1) + " M" + (x + 4).toFixed(1) + "," + (vy + 5).toFixed(1) + " h" + ww.toFixed(1) + " ";
      }
    }
    s += P("M0,60 L560,224 V318 L0,530Z", "#5f7d7c", INK, 3);
    s += P(lk, "none", INK, 2);
    s += R.tone(k, "M0,60 L300,148 L300,400 L0,530Z", .25);
    /* right wall: classroom doors + paper turkeys */
    [[1200, 1040], [930, 860], [800, 765]].forEach(function (d, i) {
      var t0 = (1200 - d[0]) / 480, t1 = (1200 - d[1]) / 480;
      var y0t = 0 + 200 * t0 + 70 * (1 - t0), y1t = 200 * t1 + 70 * (1 - t1), y0b = 600 - 270 * t0, y1b = 600 - 270 * t1;
      s += P("M" + d[0] + "," + y0t + " L" + d[1] + "," + y1t + " L" + d[1] + "," + y1b + " L" + d[0] + "," + y0b + "Z", "#7a5a3a", INK, 3);
      var wy0 = y0t + (y0b - y0t) * .12, wy1 = y1t + (y1b - y1t) * .12, wb0 = y0t + (y0b - y0t) * .4, wb1 = y1t + (y1b - y1t) * .4;
      var dx = (d[1] - d[0]) * .25;
      s += P("M" + (d[0] + dx) + "," + wy0 + " L" + (d[1] - dx) + "," + wy1 + " L" + (d[1] - dx) + "," + wb1 + " L" + (d[0] + dx) + "," + wb0 + "Z", "#e8e0c4", INK, 2);
    });
    function turkey(x, y, sc, c) {
      var t = "", cols = ["#c0392b", "#d98a2b", "#e3c03a", "#5a8a3a", "#3d6a9a"];
      for (var i = 0; i < 5; i++) {
        var a = (-150 + i * 30) * Math.PI / 180;
        t += R.limb([[x, y], [x + Math.cos(a) * 30 * sc, y + Math.sin(a) * 30 * sc]], 12 * sc, cols[(i + c) % 5], 2);
      }
      return t + '<circle cx="' + x + '" cy="' + (y + 6 * sc) + '" r="' + (16 * sc) + '" fill="#8a5a32" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="' + (x + 4 * sc) + '" cy="' + (y + 2 * sc) + '" r="' + (2 * sc) + '" fill="' + INK + '"/>' + P("M" + (x + 10 * sc) + "," + (y + 4 * sc) + " l" + (8 * sc) + "," + (3 * sc) + " l" + (-8 * sc) + "," + (3 * sc) + "Z", "#e3a02a", INK, 1);
    }
    s += turkey(1135, 150, 1.6, 0) + turkey(1000, 190, 1.2, 2) + turkey(900, 205, 1, 1) + turkey(745, 225, .6, 3);
    s += '<rect x="955" y="105" width="70" height="26" fill="#efe9da" stroke="' + INK + '" stroke-width="2" transform="rotate(-3 990 118)"/>' +
      '<text x="990" y="124" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="16" fill="#a3171c" transform="rotate(-3 990 118)">THANKFUL</text>';
    /* floor shine: the mopped part behind him gleams */
    s += P("M470,345 L680,345 L760,470 L360,470Z", "#d9cfae", null, 0, 'opacity=".55"');
    s += P("M520,360 L540,470 M600,355 L606,470 M660,360 L700,470", "none", "#fffbe6", 4, 'opacity=".6"');
    s += P("M0,600 L360,470 L760,470 L1200,600Z", "#a8987a", null, 0, 'opacity=".4"');
    s += R.tone(k, "M0,600 L300,500 L200,600Z", .3);
    /* bucket + Rusty */
    s += '<ellipse cx="590" cy="498" rx="110" ry="14" fill="#5a4a30" opacity=".45"/>';
    s += R.bucket(k, { x: 470, y: 494, s: .75 });
    s += R.person(k, { x: 590, y: 494, s: .82, pose: "mop", outfit: "work", expr: "tender", turn: -.2, light: -1 });
    /* wet floor sign */
    s += P("M170,590 L210,440 L250,590 M210,440 L240,590", "#e3c03a", INK, 4);
    s += P("M170,590 L210,440 L250,590Z", "#e3c03a", INK, 4);
    s += P("M210,470 l-14,30 h28Z", INK);
    s += R.sfx("WET", 210, 535, 22, { anchor: "middle", fill: INK, stroke: "#e3c03a", sw: 0 }) + R.sfx("FLOOR", 210, 558, 18, { anchor: "middle", fill: INK, stroke: "#e3c03a", sw: 0 });
    s += R.vignette(k, 1200, 600, .45);
    return s;
  }
});
