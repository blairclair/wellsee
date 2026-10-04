/* p14: Route 9. Rusty walks six miles in his good suit; red balloons on every mailbox turn to follow him.
   Span 3, viewBox 600x600, mood noon, wear 0. */
RUSTY.panel({
  id: "p14", w: 600, h: 600,
  alt: "A long country road under a hard noon sun. Rusty walks it in his brown suit, holding the newspaper-wrapped rabbit to his chest. A red balloon is tied to every mailbox along the road, and every one of them leans toward him.",
  captions: [{ at: "tl", text: "Six miles. The truck wouldn't start. Of course it wouldn't.", w: 62 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9ab8c8"/><stop offset="1" stop-color="#e8e0c4"/></linearGradient></defs>';
    s += '<rect width="600" height="600" fill="' + k.url("sky") + '"/>';
    s += R.glow(k, 470, 70, 120, .8);
    /* fields */
    s += P("M0,250 H600 V600 H0Z", "#c9a85a", INK, 3);
    var rows = ""; for (var i = -8; i < 16; i++) rows += "M" + (300 + i * 10) + ",250 L" + (300 + i * 90) + ",600 ";
    s += P(rows, "none", "#a8863a", 2.5, 'opacity=".6"');
    /* road */
    s += P("M290,250 L310,250 L520,600 L80,600Z", "#4a4644", INK, 3);
    s += P("M300,256 L300,600", "none", "#e3c03a", 4, 'stroke-dasharray="18 22"');
    /* telephone poles + crows */
    [[360, 260, .3], [420, 300, .55], [520, 380, 1]].forEach(function (p, i) {
      var x = p[0], y = p[1], sc = p[2];
      s += P("M" + x + "," + (y + 10 * sc) + " V" + (y - 120 * sc) + " M" + (x - 30 * sc) + "," + (y - 110 * sc) + " H" + (x + 30 * sc), "none", "#3a2a20", 8 * sc + 2);
    });
    s += P("M372,226 Q420,250 488,248 Q520,260 600,262", "none", INK, 1.5);
    [[440, 246], [470, 248], [560, 258]].forEach(function (c) { s += P("M" + c[0] + "," + c[1] + " c-4,-12 6,-16 10,-8 l8,-2 l-6,6 c2,6 -10,8 -12,4Z", INK); });
    /* mailboxes with balloons, all leaning toward Rusty */
    var rx = 230, ry = 330;
    [[90, 600, 1.3], [470, 520, 1.0], [150, 420, .8], [400, 340, .5], [255, 300, .4], [340, 285, .32]].forEach(function (m, i) {
      var x = m[0], y = m[1], sc = m[2];
      s += P("M" + x + "," + y + " V" + (y - 70 * sc), "none", "#5a4030", 7 * sc + 1);
      s += P("M" + (x - 18 * sc) + "," + (y - 70 * sc) + " v-22 a18,18 0 0 1 " + (36 * sc) + ",0 v22Z", "#7a7a72", INK, 2);
      var bx = x + (rx - x) * .3, by = y - 190 * sc;
      s += P("M" + x + "," + (y - 80 * sc) + " Q" + (x + (bx - x) * .2) + "," + (y - 140 * sc) + " " + bx + "," + (by + 34 * sc), "none", "#ddd", 1.5);
      s += '<ellipse cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" rx="' + (26 * sc).toFixed(1) + '" ry="' + (32 * sc).toFixed(1) + '" fill="#c0221b" stroke="' + INK + '" stroke-width="2.5" transform="rotate(' + (x < rx ? 18 : -18) + " " + bx.toFixed(1) + " " + by.toFixed(1) + ')"/>';
      s += '<ellipse cx="' + (bx - 8 * sc).toFixed(1) + '" cy="' + (by - 10 * sc).toFixed(1) + '" rx="' + (6 * sc).toFixed(1) + '" ry="' + (9 * sc).toFixed(1) + '" fill="#fff" opacity=".5"/>';
    });
    /* Rusty, walking */
    var pkg = P("M-26,-22 L24,-28 L30,18 L-22,24Z", "#d9d0b8", INK, 2.5) + P("M-16,-14 h30 M-14,-4 h34 M-12,6 h30", "none", "#7a7468", 1.5);
    s += '<ellipse cx="270" cy="582" rx="70" ry="10" fill="#000" opacity=".35"/>';
    s += R.person(k, { x: 270, y: 580, s: .92, pose: "walkCarry", carry: pkg, outfit: "suit", expr: "resolve", turn: -.2, light: 1 });
    s += P("M360,420 q16,-6 22,6 M372,400 q10,-4 14,4", "none", "#7a9ab0", 2.5);   /* sweat */
    return s;
  }
});
