/* p12: Extreme close-up of Rusty, lit gold from above, sweating. "Any other day."
   Span 2, viewBox 400x600, mood light, wear 0.
   Top light: bright scalp, the lower face falling into shadow. The carnival burns as two tiny
   points in each eye. Fear, with the brows already starting to pull down into resolve. */
RUSTY.panel({
  id: "p12", w: 400, h: 600,
  alt: "Extreme close-up of Rusty's face, lit hard and gold from straight above. Sweat beads on his bald scalp and runs down his temple; the bottom of his face falls into shadow. His eyes are wide with fear, and in each one burns a tiny point of carnival light, but his brows are already starting to pull down.",
  captions: [],
  balloons: [
    { kind: "thought", who: "Rusty, thinking", x: 3, y: 2, w: 44, tail: [30, 14], text: "Any other day." },
    { kind: "thought", who: "Rusty, thinking", x: 3, y: 85, w: 56, tail: [36, 80], text: "Any other day, I'd come quiet." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, mix = R.mix, s = "";
    var GOLD = "#f6d27a", HX = 200, HY = 300, HS = 2.8, T = -.12;
    var skin = R.CH.rusty.skin;
    s += "<defs>" +
      '<radialGradient id="' + k.id("bg") + '" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#ffe7a0"/><stop offset=".35" stop-color="#b07a2a"/><stop offset=".75" stop-color="#4a2a10"/><stop offset="1" stop-color="#1a0a06"/></radialGradient>' +
      '<linearGradient id="' + k.id("top") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff3c0" stop-opacity=".75"/><stop offset=".28" stop-color="#ffe08a" stop-opacity=".25"/><stop offset=".5" stop-color="#ffe08a" stop-opacity="0"/><stop offset=".7" stop-color="#2a0e06" stop-opacity="0"/><stop offset="1" stop-color="#2a0e06" stop-opacity=".6"/></linearGradient>' +
      '<radialGradient id="' + k.id("hot") + '"><stop offset="0" stop-color="#fffbe0" stop-opacity=".8"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + k.id("face") + '"><path d="' + R.FACE.rusty + '" transform="translate(' + HX + "," + HY + ") scale(" + HS + ')"/></clipPath>' +
      "</defs>";
    s += '<rect width="400" height="600" fill="' + k.url("bg") + '"/>';
    s += R.rays(200, -60, 30, 900, GOLD, .3, 140, 20);
    s += R.glow(k, 200, 40, 280, .9);
    /* red creeping in at the bottom: what comes next */
    s += P("M0,600 V470 C100,500 300,500 400,470 V600Z", "#8b1414", null, 0, 'opacity=".45"');
    s += R.tone(k, "M0,0 H400 V600 H0Z", .16, true);

    /* collar and heavy shoulders, sinking into shadow */
    s += P("M-20,600 C10,520 90,486 150,478 L250,478 C310,486 390,520 420,600Z", "#5a6248", INK, 6);
    s += P("M150,478 L200,540 L250,478", "none", INK, 5) + P("M150,478 L176,474 L200,520 M250,478 L224,474 L200,520", "#6f7a5a", INK, 4);
    s += '<ellipse cx="290" cy="548" rx="34" ry="16" fill="#efe8d8" stroke="' + INK + '" stroke-width="3"/><text x="290" y="554" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="16" font-weight="700" fill="#a3171c">RUSTY</text>';
    s += P("M-20,600 C10,520 90,486 150,478 L250,478 C310,486 390,520 420,600Z", "#1a0c06", null, 0, 'opacity=".35"');

    /* the head: fear, eyes wide, brows already pulling down at the inner ends */
    s += R.head(k, { x: HX, y: HY, s: HS, expr: { bi: 5, bo: 7, eye: 1.15, curve: -.5, open: .3 }, turn: T, lw: 2.5 });
    /* hard top light: scalp blazing, jaw and mouth in shadow (clipped to the face) */
    s += '<g clip-path="' + k.url("face") + '">' +
      '<rect x="60" y="60" width="280" height="440" fill="' + k.url("top") + '"/>' +
      R.tone(k, "M60,390 H340 V500 H60Z", .35) +
      '<ellipse cx="196" cy="100" rx="120" ry="60" fill="' + k.url("hot") + '"/>' +
      "</g>";
    /* a rim of gold along the top of the skull */
    s += P("M84,190 C88,110 140,78 200,78 C260,78 312,110 316,190", "none", "#fff1b8", 5, 'opacity=".8"');
    /* the carnival, burning in both eyes */
    [-1, 1].forEach(function (sd) {
      var ex = HX + (sd * 17 + T * 12 + T * 3) * HS, ey = HY - 11.5 * HS;
      s += '<circle cx="' + f(ex - 5) + '" cy="' + f(ey - 3) + '" r="3.2" fill="' + GOLD + '"/><circle cx="' + f(ex + 3) + '" cy="' + f(ey + 1) + '" r="2" fill="#ff3b2f"/><circle cx="' + f(ex - 1) + '" cy="' + f(ey + 4) + '" r="1.4" fill="#8fe04a"/>';
    });

    /* sweat: beads on the scalp catching gold, one running down the temple */
    var drop = function (x, y, sz) {
      return P("M" + x + "," + y + " c" + (-6 * sz) + "," + (10 * sz) + " " + (-6 * sz) + "," + (18 * sz) + " 0," + (20 * sz) + " c" + (6 * sz) + "," + (-2 * sz) + " " + (6 * sz) + "," + (-10 * sz) + " 0," + (-20 * sz) + "Z", "#eaf6f8", INK, 2) +
        '<circle cx="' + f(x - 1.5 * sz) + '" cy="' + f(y + 12 * sz) + '" r="' + f(2 * sz) + '" fill="' + GOLD + '"/>';
    };
    s += drop(150, 120, 1) + drop(244, 112, .8) + drop(276, 150, 1.1) + drop(118, 176, .9) + drop(200, 140, .7) + drop(300, 214, 1);
    s += P("M92,214 C88,236 92,256 88,280", "none", "#eaf6f8", 4, 'opacity=".9"') + drop(84, 278, 1.2);
    s += P("M70,130 l-14,-8 M64,160 l-16,-2 M330,130 l14,-8 M336,160 l16,-2", "none", INK, 3);
    s += R.vignette(k, 400, 600, .75);
    return s;
  }
});
