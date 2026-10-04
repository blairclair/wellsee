/* p16: THE TURN. In the diner window's reflection, three Players stand across the road behind Rusty.
   One points past him, at Danny. Span 6, viewBox 1200x600, mood noon, wear 0. */
RUSTY.panel({
  id: "p16", w: 1200, h: 600,
  alt: "The diner window. Through it, Danny and Jess wait in their booth. On the glass, as a ghostly reflection: the road behind Rusty, and three too-tall clowns standing on it in the noon sun, casting no shadows. One points through the glass at Danny. At the right edge, Rusty stares at the reflection, frozen.",
  captions: [
    { at: "tl", text: "And in the glass, he saw them.", w: 34 },
    { at: "bl", text: "Waiting. Watching to see who he'd lead them to.", w: 40 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "", cid = k.id("glass");
    s += '<defs><clipPath id="' + cid + '"><path d="M30,40 H900 V540 H30Z"/></clipPath></defs>';
    s += '<rect width="1200" height="600" fill="#b8b8b0"/>';
    var ch = ""; for (var y = 0; y < 600; y += 14) ch += "M0," + y + " H1200 ";
    s += P(ch, "none", "#9a9a92", 2);
    /* interior through the glass */
    s += '<g clip-path="url(#' + cid + ')">';
    s += '<rect x="30" y="40" width="870" height="500" fill="#d9a870"/>';
    s += P("M30,40 H900 V170 H30Z", "#c98a5a") + P("M30,170 H900", "none", "#8a2a24", 10);
    s += P("M60,300 C60,270 200,270 200,300 V540 H60Z", "#a3342c", INK, 3) + P("M520,300 C520,270 660,270 660,300 V540 H520Z", "#a3342c", INK, 3);
    s += R.person(k, { x: 240, y: 640, s: .95, ch: "danny", outfit: "danny", pose: "sit", expr: "neutral", turn: .5, light: -1, look: -1 });
    s += R.person(k, { x: 480, y: 640, s: .92, ch: "jess", outfit: "jess", pose: "sit", expr: "neutral", turn: -.5, flip: -1, light: 1 });
    s += P("M220,440 H500 V466 H220Z", "#efe9da", INK, 3) + P("M300,440 v-28 h28 v28Z M400,440 v-22 h34 v22Z", "#efe9da", INK, 2);
    /* reflection layer: road, sun, three Players (pale, mirrored) */
    var ref = "";
    ref += '<rect x="30" y="40" width="870" height="500" fill="#dfe8ee" opacity=".45"/>';
    ref += P("M30,420 H900 V540 H30Z", "#6a6a6a", null, 0, 'opacity=".35"');
    ref += P("M30,470 H900", "none", "#e3c03a", 4, 'opacity=".5" stroke-dasharray="30 30"');
    ref += R.glow(k, 760, 90, 140, .7);
    ref += '<g opacity=".78">' +
      R.player(k, { x: 380, y: 470, s: .66, variant: 0, pose: "point", flip: -1, glow: "#ff3b2f" }) +
      R.player(k, { x: 560, y: 474, s: .7, variant: 2, pose: "stand", flip: -1, glow: "#ff3b2f" }) +
      R.player(k, { x: 720, y: 466, s: .62, variant: 1, pose: "escort", flip: -1, glow: "#ff3b2f" }) + "</g>";
    /* Rusty's own reflection, faint, on the right */
    ref += '<g opacity=".35">' + R.head(k, { x: 840, y: 250, s: 1.6, expr: "fear", turn: .5, flip: -1 }) + "</g>";
    ref += P("M80,40 L200,40 L60,400 L30,400Z M260,40 L300,40 L120,540 L90,540Z", "#fff", null, 0, 'opacity=".25"');
    s += ref + "</g>";
    s += P("M30,40 H900 V540 H30Z", "none", "#e0e0d8", 14) + P("M30,40 H900 V540 H30Z", "none", INK, 4);
    s += P("M22,32 H908 V548 H22Z", "none", INK, 3);
    /* Rusty, real, right edge, frozen */
    s += R.person(k, { x: 1070, y: 760, s: 1.55, outfit: "suit", pose: "hold", carry: P("M-28,-22 L24,-28 L30,18 L-22,24Z", "#d9d0b8", INK, 2.5), expr: "fear", turn: -.65, flip: -1, light: -1 });
    s += P("M1150,70 l16,-14 M1160,96 l22,-4 M960,80 l-16,-14", "none", INK, 3);
    s += R.vignette(k, 1200, 600, .5);
    return s;
  }
});
