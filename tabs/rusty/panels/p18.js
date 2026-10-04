/* p18: The wooden rabbit on the outside windowsill, on a scrap of paper: "for the baby".
   Span 2, viewBox 400x600, mood noon. */
RUSTY.panel({
  id: "p18", w: 400, h: 600,
  alt: "The little hand-carved wooden rabbit sits on the diner's outside windowsill on a torn scrap of paper that says, in shaky pencil, for the baby. The newspaper it was wrapped in lies crumpled beside it.",
  captions: [{ at: "tl", text: "He'd done the one thing he came here to do.", w: 88 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    /* window glass behind: warm interior, Danny's silhouette */
    s += '<rect width="400" height="600" fill="#d9a870"/>';
    s += R.person(k, { x: 210, y: 620, s: .9, ch: "danny", outfit: "danny", pose: "sit", expr: "neutral", turn: .3, light: -1 });
    s += '<rect width="400" height="430" fill="#e8d0a0" opacity=".55"/>';
    s += P("M20,0 L120,0 L20,300Z", "#fff", null, 0, 'opacity=".25"');
    /* sill */
    s += P("M0,430 H400 V470 H0Z", "#c9c9c0", INK, 4) + P("M0,470 H400 V600 H0Z", "#a8a8a0", INK, 3);
    var ch = ""; for (var y = 484; y < 600; y += 14) ch += "M0," + y + " H400 ";
    s += P(ch, "none", "#8a8a84", 2);
    /* newspaper, crumpled */
    s += P("M250,438 L300,404 L340,420 L372,400 L390,436 L360,452 L300,450Z", "#d9d0b8", INK, 2.5) + P("M300,420 h40 M296,430 h50 M310,440 h30", "none", "#7a7468", 1.5);
    /* the note */
    s += P("M80,452 L240,446 L246,470 L84,476Z", "#f7f1e0", INK, 2.5);
    s += '<text x="160" y="468" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="20" fill="#4a4a4a" transform="rotate(-2 160 462)">for the baby</text>';
    /* rabbit */
    s += '<ellipse cx="170" cy="452" rx="80" ry="10" fill="#000" opacity=".25"/>';
    s += R.woodRabbit(k, { x: 160, y: 450, s: 2.4 });
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
