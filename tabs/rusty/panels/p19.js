/* p19: Inside. Danny checks his watch: 1:40. Coffee cold. Jess's hand on his.
   Span 2, viewBox 400x600, mood noon. */
RUSTY.panel({
  id: "p19", w: 400, h: 600,
  alt: "Inside the diner, Danny sits slumped in the red booth, eyes down, his coffee cold. Jess's hand rests on his. An inset shows his wristwatch: 1:40.",
  captions: [],
  balloons: [
    { kind: "speech", who: "Danny", x: 3, y: 3, w: 50, tail: [44, 38], text: "He's not coming." },
    { kind: "speech", who: "Danny", x: 36, y: 15, w: 60, tail: [52, 38], text: "He was never coming, Jess." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#c98a5a"/>';
    s += P("M0,0 H400 V120 H0Z", "#e8c890") + R.glow(k, 320, 40, 200, .4);
    s += P("M20,170 C20,130 380,130 380,170 V600 H20Z", "#a3342c", INK, 4);
    s += P("M60,180 V600 M140,170 V600 M220,170 V600 M300,170 V600", "none", "#7a221c", 4);
    /* Danny */
    s += R.person(k, { x: 190, y: 780, s: 1.55, ch: "danny", outfit: "danny", pose: "sit", expr: "sad", turn: .2, light: 1, headTilt: 12, look: 0 });
    /* table + cold coffee */
    s += P("M0,470 H400 V600 H0Z", "#efe9da", INK, 4) + R.tone(k, "M0,540 H400 V600 H0Z", .25);
    s += P("M250,470 V420 H310 V470Z", "#efe9da", INK, 3) + P("M310,432 c18,0 18,26 0,26", "none", INK, 3) + '<ellipse cx="280" cy="420" rx="30" ry="6" fill="#4a2a14" stroke="' + INK + '" stroke-width="2"/>';
    s += P("M256,474 C254,480 314,480 312,474", "none", INK, 2);
    /* hands on the table: his, then Jess's over it */
    s += R.fist(k, { x: 130, y: 500, s: .8, rot: -10, skin: R.CH.danny.skin, sleeve: "#45627a" });
    s += R.openHand(k, { x: 190, y: 500, s: .7, rot: -110, skin: R.CH.jess.skin, curl: .4, sleeve: "#b46a58" });
    /* watch inset */
    s += '<circle cx="330" cy="250" r="56" fill="#efe9da" stroke="' + INK + '" stroke-width="5"/><circle cx="330" cy="250" r="46" fill="none" stroke="#9c9586" stroke-width="2"/>';
    s += P("M330,250 L330,218 M330,250 L306,262", "none", INK, 5);   /* 1:40 hands: minute at 8, hour near 2 */
    s += P("M330,250 L314,272", "none", INK, 3) + P("M330,250 L348,238", "none", INK, 6);
    [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].forEach(function (a) {
      var r = a * Math.PI / 180; s += '<circle cx="' + (330 + Math.sin(r) * 40).toFixed(1) + '" cy="' + (250 - Math.cos(r) * 40).toFixed(1) + '" r="2.5" fill="' + INK + '"/>';
    });
    s += '<text x="330" y="290" text-anchor="middle" font-family="Bangers, sans-serif" font-size="16" fill="#8b1414">1:40</text>';
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
