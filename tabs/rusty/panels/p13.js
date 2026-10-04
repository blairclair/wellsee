/* p13: Rusty tears the ticket in half. The light turns red. Under the dead light pole, a Player waves.
   Span 6, viewBox 1200x600, mood light->red, wear 0. */
RUSTY.panel({
  id: "p13", w: 1200, h: 600,
  alt: "Rusty rips the ticket in two and shouts. The sky goes blood red. At the far end of the parking lot, under a dead light pole, a too-tall clown in a striped suit stands and slowly waves.",
  captions: [],
  balloons: [
    { kind: "shout", who: "Rusty", x: 2, y: 5, w: 24, tail: [37, 25], text: "Not today. You hear me?" },
    { kind: "shout", who: "Rusty", x: 4, y: 36, w: 20, tail: [36, 28], text: "<b>NOT TODAY.</b>" },
    { kind: "clown", who: "One of the Unwilling", x: 66, y: 8, w: 22, tail: [84, 42], text: "...tonight, then." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3a0606"/><stop offset=".6" stop-color="#a3171c"/><stop offset="1" stop-color="#e0623a"/></linearGradient></defs>';
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    s += R.rays(330, 300, 30, 1100, "#2a0404", .35);
    /* far hill + carnival silhouette */
    s += P("M500,380 C700,320 950,320 1200,350 V420 H500Z", "#2a0808", INK, 2);
    s += R.ferris(k, { x: 1060, y: 300, s: .3, color: "#1a0404", car: "#1a0404" });
    s += R.bigTop(k, { x: 900, y: 360, s: .2, a: "#1a0404", b: "#3a0808" });
    /* lot */
    s += P("M0,420 H1200 V600 H0Z", "#3a2222", INK, 3);
    s += P("M200,600 L260,440 M560,600 L580,440 M940,600 L920,440", "none", "#a87a6a", 5, 'opacity=".5"');
    /* dead light pole + Player */
    s += P("M1000,470 V150 H940", "none", "#1a0c0c", 8) + P("M930,146 h30 v12 h-30Z", "#1a0c0c", INK, 2);
    s += '<ellipse cx="1000" cy="476" rx="40" ry="6" fill="#000" opacity=".4"/>';
    s += R.player(k, { x: 1000, y: 474, s: .44, pose: "wave", variant: 1, flip: -1, glow: "#ffdf6a" });
    /* Rusty tearing the ticket */
    var tear = { legs: [[[-18, -185], [-30, -95], [-44, -8]], [[18, -185], [32, -95], [44, -8]]],
      arms: [[[-46, -298], [-86, -280], [-40, -330]], [[46, -298], [96, -284], [70, -334]]], stoop: -4 };
    s += '<ellipse cx="470" cy="590" rx="140" ry="12" fill="#000" opacity=".5"/>';
    s += R.person(k, { x: 470, y: 588, s: 1.25, pose: tear, outfit: "work", expr: "anger", turn: .15, light: 1, headTilt: -4 });
    /* ticket halves at his hands */
    var lh = [470 - 40 * 1.25, 588 - 330 * 1.25], rh = [470 + 70 * 1.25, 588 - 334 * 1.25];
    s += '<g transform="rotate(-30 ' + lh[0] + " " + lh[1] + ')">' + P("M" + (lh[0] - 50) + "," + (lh[1] - 22) + " H" + (lh[0] + 6) + " l-6,8 l8,8 l-6,8 l6,6 H" + (lh[0] - 50) + "Z", "#c0221b", INK, 3) + "</g>";
    s += '<g transform="rotate(26 ' + rh[0] + " " + rh[1] + ')">' + P("M" + (rh[0] + 50) + "," + (rh[1] - 22) + " H" + (rh[0] - 6) + " l6,8 l-8,8 l6,8 l-6,6 H" + (rh[0] + 50) + "Z", "#c0221b", INK, 3) + "</g>";
    s += R.sfx("RRRIP!", 560, 230, 70, { fill: "#f6d27a", rot: -12, sw: 7 });
    s += P("M430,170 l-20,-30 M460,160 l-4,-34 M530,168 l14,-30", "none", "#f6d27a", 4);
    s += R.vignette(k, 1200, 600, .7);
    return s;
  }
});
