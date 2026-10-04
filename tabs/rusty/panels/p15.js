/* p15: Mae's Diner at 11:58. Through the window, Danny and pregnant Jess in a booth. Rusty's hand on the glass.
   Span 3, viewBox 600x600, mood noon, wear 0. */
RUSTY.panel({
  id: "p15", w: 600, h: 600,
  alt: "Outside Mae's Diner, all chrome and neon, the sign clock reading 11:58. Through the big window: Danny in a booth with his pregnant wife Jess, his hand on her belly. Rusty, in his suit, presses one hand to the glass, his face softening.",
  captions: [{ at: "tl", text: "11:58.", w: 20 }],
  balloons: [
    { kind: "thought", who: "Rusty, thinking", x: 4, y: 20, w: 34, tail: [20, 42], text: "Look at you, son." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="600" height="600" fill="#9ab8c8"/>';
    /* diner body: chrome + red stripe */
    s += P("M140,40 H600 V600 H140Z", "#c9c9c0", INK, 4);
    var ch = ""; for (var y = 60; y < 600; y += 14) ch += "M140," + y + " H600 ";
    s += P(ch, "none", "#a8a8a0", 2) + P("M140,90 H600 V118 H140Z", "#a3171c", INK, 3);
    /* neon sign + clock */
    s += P("M200,-10 H560 V80 H200Z", "#1a1a20", INK, 4);
    s += R.sfx("MAE'S", 330, 62, 54, { anchor: "middle", fill: "#ff7aa0", stroke: "#a3175a", sw: 2, ls: 4 });
    s += '<circle cx="490" cy="34" r="38" fill="#efe9da" stroke="' + INK + '" stroke-width="4"/>';
    s += P("M490,34 L488,6 M490,34 L478,22", "none", INK, 4);
    s += '<text x="490" y="62" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="11" fill="' + INK + '">11:58</text>';
    /* window */
    s += P("M180,150 H580 V470 H180Z", "#e8c890", INK, 6);
    s += '<rect x="186" y="156" width="388" height="308" fill="#d9a870"/>';
    s += P("M186,330 H574 V464 H186Z", "#8a2a24");                /* booth */
    s += P("M186,300 C186,280 280,280 280,300 V464 H186Z", "#a3342c", INK, 3);
    s += P("M480,300 C480,280 574,280 574,300 V464 H480Z", "#a3342c", INK, 3);
    s += P("M290,380 H470 V398 H290Z", "#efe9da", INK, 3);        /* table */
    s += P("M350,380 v-18 h20 v18Z M410,380 v-14 h24 v14Z", "#efe9da", INK, 2);
    /* Danny + Jess inside */
    var inside = R.person(k, { x: 330, y: 470, s: .62, ch: "danny", outfit: "danny", pose: "sit", expr: "neutral", turn: .5, light: -1 }) +
      R.person(k, { x: 445, y: 470, s: .6, ch: "jess", outfit: "jess", pose: "sit", expr: "tender", turn: -.5, flip: -1, light: 1 });
    s += inside;
    s += P("M290,380 H470 V398 H290Z", "#efe9da", INK, 3);
    /* glass sheen */
    s += P("M200,170 L260,170 L190,300Z M300,160 L330,160 L230,330 L220,330Z", "#fff", null, 0, 'opacity=".35"');
    s += P("M180,150 H580 V470 H180Z", "none", "#d0d0c8", 10) + P("M180,150 H580 V470 H180Z", "none", INK, 3);
    /* Rusty at the glass */
    var press = { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [22, -95], [26, -8]]], arms: [[[-46, -298], [-55, -235], [-52, -172]], [[46, -298], [96, -300], [150, -330]]] };
    s += R.person(k, { x: 90, y: 690, s: 1.25, pose: press, outfit: "suit", expr: "tender", turn: .55, light: 1, headTilt: 4 });
    s += R.openHand(k, { x: 284, y: 270, s: .75, rot: 10 });
    s += R.vignette(k, 600, 600, .4);
    return s;
  }
});
