/* p22: Rusty dragged down the midway between two Players. A caged man screams; rabbits gone wrong.
   Span 3, viewBox 600x600, mood lurid, wear 0.1. */
RUSTY.panel({
  id: "p22", w: 600, h: 600,
  alt: "Rusty is dragged down the carnival midway by both arms between two grinning clowns, his heels scraping the dirt. Behind him, a man in a cage screams with his mouth stretched open, and a rabbit-thing watches from between the striped tents.",
  captions: [{ at: "bl", text: "Men screamed until their lungs gave out.", w: 56 }],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 58, y: 5, w: 40, tail: [80, 26], text: "The ones who come get to go <em>HOME.</em>" }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="600" height="600" fill="#2a0a0c"/>';
    s += R.bigTop(k, { x: 80, y: 380, s: .7, a: "#5e1010", b: "#c9b090" }) + R.bigTop(k, { x: 560, y: 360, s: .6, a: "#3a1a3a", b: "#b0a080" });
    s += R.bulbWire(k, [0, 60], [600, 90], 40, 12, { r: 4, red: true, dead: 4 });
    /* caged screaming man */
    s += P("M40,14 H200 V180 H40Z", "#1a0a0c", INK, 4);
    s += R.head(k, { x: 120, y: 100, s: .8, ch: "danny", expr: { bi: 12, bo: 10, eye: 1.3, curve: -1, open: 1.6 }, turn: 0, light: 1 });
    var bars = ""; for (var x = 52; x < 200; x += 22) bars += "M" + x + ",14 V180 ";
    s += P(bars, "none", "#6a6a64", 6) + P(bars, "none", INK, 1.5);
    s += R.sfx("AAAAAAHHH", 196, 46, 40, { fill: "#f6d27a", rot: 10, sw: 5 });
    /* rabbit between the tents */
    s += R.monsterRabbit(k, { x: 470, y: 420, s: .42, flip: -1, blood: true });
    /* ground */
    s += P("M0,430 H600 V600 H0Z", "#3a2018", INK, 3);
    s += P("M200,600 C220,560 240,520 270,500 M240,600 C250,560 270,530 300,505", "none", "#1a0c08", 4);   /* heel drag marks */
    /* the drag */
    s += R.player(k, { x: 117, y: 560, s: .75, variant: 1, pose: "grab", glow: "#ff3b2f" });
    s += R.person(k, { x: 300, y: 600, s: .85, pose: "dragged", outfit: "suit", expr: "anguish", turn: 0, wear: .1, light: 1, headTilt: -6 });
    s += R.player(k, { x: 485, y: 560, s: .75, variant: 0, pose: "grab", flip: -1, glow: "#ff3b2f" });
    s += P("M90,540 l-40,10 M100,560 l-50,0 M520,540 l40,10", "none", "#f6d27a", 3, 'opacity=".6"');
    s += '<rect width="600" height="600" fill="' + k.url("dotsR") + '" opacity=".18"/>';
    s += R.vignette(k, 600, 600, .8);
    return s;
  }
});
