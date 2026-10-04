/* p26: A break. Rusty sits on an upturned bucket beside a rabbit-thing gnawing something, talking softly.
   Span 2, viewBox 400x600, mood grey, wear 0.8. */
RUSTY.panel({
  id: "p26", w: 400, h: 600,
  alt: "On a break behind the tents, a grey, thin Rusty sits on an upturned bucket beside a hunched rabbit-thing gnawing on a bone, and talks to it softly.",
  captions: [],
  balloons: [
    { kind: "speech", who: "Rusty", x: 3, y: 18, w: 66, tail: [30, 56], text: "My boy's got a little girl by now. Maybe two." },
    { kind: "speech", who: "Rusty", x: 30, y: 33, w: 62, tail: [34, 57], text: "I bet she's got his eyes." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#4a4a4c"/>';
    s += R.bigTop(k, { x: 300, y: 380, s: .6, a: "#4a3a3a", b: "#8a8580" });
    s += '<rect width="400" height="400" fill="#9a9a98" opacity=".35"/>';
    s += P("M0,400 H400 V600 H0Z", "#3a3836", INK, 3);
    /* bucket seat */
    s += '<g transform="translate(110,560) scale(.9,-.9) translate(0,70)">' + R.bucket(k, {}) + "</g>";
    s += R.person(k, { x: 100, y: 560, s: .82, pose: "sitLow", outfit: "eternal", wear: .8, expr: "tender", turn: .5, look: 1, light: 1 });
    /* rabbit-thing gnawing */
    s += R.monsterRabbit(k, { x: 330, y: 580, s: .55, flip: -1, fur: "#5a544c" });
    s += P("M260,460 l40,-10 c6,-6 14,0 8,6 c6,4 0,12 -6,8 l-40,10 c-6,6 -14,0 -8,-6 c-6,-4 0,-12 6,-8Z", "#e8e0c8", INK, 2.5);
    s += R.vignette(k, 400, 600, .7);
    return s;
  }
});
