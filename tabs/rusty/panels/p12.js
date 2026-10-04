/* p12: Extreme close-up of Rusty, lit gold from above, sweating. "Any other day."
   Span 2, viewBox 400x600, mood light, wear 0. */
RUSTY.panel({
  id: "p12", w: 400, h: 600,
  alt: "Extreme close-up of Rusty's face, lit gold from above, sweat on his bald scalp, eyes wide with fear.",
  captions: [],
  balloons: [
    { kind: "thought", who: "Rusty, thinking", x: 6, y: 4, w: 46, tail: [40, 30], text: "Any other day." },
    { kind: "thought", who: "Rusty, thinking", x: 44, y: 78, w: 52, tail: [62, 70], text: "Any other day, I'd come quiet." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#5a3a14"/>';
    s += R.rays(200, -40, 26, 900, "#f6d27a", .35, 120, 30);
    s += R.glow(k, 200, 120, 300, .8);
    s += R.head(k, { x: 205, y: 330, s: 2.65, expr: "fear", turn: -.12, light: 1, lw: 2.6 });
    /* gold light from above: overlay on the scalp, dark under the jaw */
    s += '<ellipse cx="205" cy="160" rx="110" ry="40" fill="#fff1b8" opacity=".35"/>';
    s += P("M60,520 C120,500 300,500 360,520 L400,600 H0Z", "#1a0c06", null, 0, 'opacity=".6"');
    /* sweat */
    [[120, 190], [300, 200], [270, 150], [100, 280]].forEach(function (p) {
      s += P("M" + p[0] + "," + p[1] + " c-6,10 -6,18 0,20 c6,-2 6,-10 0,-20Z", "#e8f4f8", INK, 2);
    });
    s += R.vignette(k, 400, 600, .7);
    return s;
  }
});
