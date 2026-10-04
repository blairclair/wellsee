/* p26: A break. Rusty sits on an upturned bucket beside a rabbit-thing gnawing something, talking softly.
   Span 2, viewBox 400x600, mood grey, wear 0.8. */
RUSTY.panel({
  id: "p26", w: 400, h: 600,
  alt: "On a break behind the big top, under one bulb on a pole, a grey, thin Rusty sits hunched on an upturned mop bucket, turning a little popsicle-stick rabbit in his hands. Beside him a rabbit-thing squats against the tent canvas, gnawing a long bone held in its claws. Rusty talks to it softly. The canvas glows faintly red from the carnival beyond.",
  captions: [],
  balloons: [
    { kind: "speech", who: "Rusty", x: 3, y: 4, w: 62, tail: [38, 44], text: "My boy's got a little girl by now. Maybe two." },
    { kind: "speech", who: "Rusty", x: 41, y: 21, w: 56, tail: [49, 45], text: "I bet she's got his eyes." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var GR = 560;   /* ground line under them */
    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c3b3e"/><stop offset=".7" stop-color="#5a5658"/><stop offset="1" stop-color="#6e5a58"/></linearGradient>' +
      '<radialGradient id="' + k.id("pool") + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4ecd0" stop-opacity=".38"/><stop offset="1" stop-color="#f4ecd0" stop-opacity="0"/></radialGradient>' +
      "</defs>";
    s += '<rect width="400" height="600" fill="' + k.url("sky") + '"/>';
    /* far off: the tops of other tents and a dark ferris wheel, all colour drained */
    s += R.ferris(k, { x: 70, y: 250, s: .55, color: "#2e2c2e", car: "#2e2c2e" });
    s += R.bigTop(k, { x: 150, y: 400, s: .5, a: "#4a4446", b: "#6e6a68", flag: "#5a3a3a" });
    /* the back of the big top: a wall of canvas, red carnival light glowing through it */
    s += P("M200,170 C260,150 340,140 400,132 V" + GR + " H200Z", "#7a7270", INK, 4);
    var seams = ""; for (var x = 220; x < 400; x += 36) seams += "M" + x + "," + (172 - (x - 200) * .2) + " C" + (x + 6) + ",300 " + (x - 4) + ",440 " + (x + 2) + "," + GR + " ";
    s += P(seams, "none", "#5e5654", 3);
    s += R.glow(k, 330, 300, 170, .45, true);
    s += R.tone(k, "M200,170 C260,150 340,140 400,132 V" + GR + " H200Z", .3, true);
    /* guy ropes down to stakes */
    s += P("M214,176 L120," + (GR + 6) + " M260,160 L180," + (GR + 4), "none", "#2a2626", 2.5);
    s += P("M114," + (GR - 4) + " l8,16 M174," + (GR - 6) + " l8,16", "none", INK, 5);
    /* the ground: trampled grey mud, a crushed popcorn box, a ticket stub */
    s += P("M0," + (GR - 30) + " C120," + (GR - 36) + " 260," + (GR - 24) + " 400," + (GR - 30) + " V600 H0Z", "#3c3a38", INK, 3);
    s += R.tone(k, "M0," + (GR + 10) + " H400 V600 H0Z", .4, true);
    s += P("M318,586 l26,-8 l10,16 l-28,8Z", "#8a3a3a", INK, 2) + P("M322,584 l8,10 M332,580 l8,10", "none", "#c9c0a8", 2);
    s += P("M40,584 h24 l-3,5 l3,5 h-24Z", "#7a2a2a", INK, 1.5);
    /* the one bulb on its pole, and its pool of light */
    s += P("M226,0 V130", "none", INK, 7) + P("M226,0 V130", "none", "#4a4442", 3) + P("M226,40 H182", "none", INK, 4);
    s += R.glow(k, 182, 62, 80, .7) + '<circle cx="182" cy="62" r="7" fill="#fffbe0" stroke="' + INK + '" stroke-width="2"/>' + P("M182,40 V54", "none", INK, 2);
    s += '<ellipse cx="200" cy="' + (GR + 2) + '" rx="190" ry="34" fill="' + k.url("pool") + '"/>';

    /* the upturned mop bucket: base up, rim in the mud, wheels in the air, the handle flopped over */
    var bx = 102, bt = GR - 64, bb = GR + 4;
    s += '<ellipse cx="' + bx + '" cy="' + (bb + 2) + '" rx="62" ry="8" fill="#000" opacity=".4"/>';
    s += P("M" + (bx - 34) + "," + bt + " L" + (bx + 34) + "," + bt + " L" + (bx + 44) + "," + (bb - 6) + " L" + (bx - 44) + "," + (bb - 6) + "Z", "#a08a4a", INK, 3.5);
    s += R.tone(k, "M" + (bx + 12) + "," + bt + " L" + (bx + 34) + "," + bt + " L" + (bx + 44) + "," + (bb - 6) + " L" + (bx + 16) + "," + (bb - 6) + "Z", .45);
    s += P("M" + (bx - 46) + "," + (bb - 8) + " H" + (bx + 46) + " V" + bb + " H" + (bx - 46) + "Z", "#8a7640", INK, 3);
    s += P("M" + (bx - 30) + "," + (bt + 14) + " c2,10 -2,18 0,26 M" + (bx + 22) + "," + (bt + 22) + " c-2,8 2,14 0,20", "none", "#6a1a1a", 3, 'opacity=".8"');
    s += P("M" + (bx - 40) + "," + (bb - 20) + " C" + (bx - 70) + "," + (bb - 10) + " " + (bx - 74) + "," + (bb + 6) + " " + (bx - 52) + "," + (bb + 8), "none", "#77736a", 3);
    s += P("M" + (bx - 28) + "," + (bt + 30) + " l6,8", "none", INK, 1.5);

    /* the rabbit-thing, squatting against the canvas, gnawing */
    var RX = 336, RS = .56;
    s += R.monsterRabbit(k, { x: RX, y: GR + 8, s: RS, flip: -1, fur: "#5a544c", blood: true });
    /* its other arm brought up to its mouth, claws round a long bone */
    var sh = [RX - 40 * RS, GR + 8 - 260 * RS], hand = [RX - 112 * RS, GR + 8 - 300 * RS];
    s += R.limb([sh, [RX - 70 * RS, GR + 8 - 196 * RS], hand], 13, "#5a544c", 3);
    var b0 = [hand[0] - 2, hand[1] + 52], b1 = [hand[0] - 12, hand[1] - 22];
    var ang = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
    s += P("M" + f(b0[0] + nx * 4) + "," + f(b0[1] + ny * 4) + " L" + f(b1[0] + nx * 4) + "," + f(b1[1] + ny * 4) + " L" + f(b1[0] - nx * 4) + "," + f(b1[1] - ny * 4) + " L" + f(b0[0] - nx * 4) + "," + f(b0[1] - ny * 4) + "Z", "#e2dac2", INK, 2.5);
    s += '<circle cx="' + f(b0[0] + nx * 6) + '" cy="' + f(b0[1] + ny * 6) + '" r="7" fill="#e2dac2" stroke="' + INK + '" stroke-width="2.5"/><circle cx="' + f(b0[0] - nx * 6) + '" cy="' + f(b0[1] - ny * 6) + '" r="7" fill="#e2dac2" stroke="' + INK + '" stroke-width="2.5"/>';
    s += '<circle cx="' + f(b1[0] + nx * 5) + '" cy="' + f(b1[1] + ny * 5) + '" r="6.5" fill="#d9c0b0" stroke="' + INK + '" stroke-width="2.5"/><circle cx="' + f(b1[0] - nx * 5) + '" cy="' + f(b1[1] - ny * 5) + '" r="6.5" fill="#d9c0b0" stroke="' + INK + '" stroke-width="2.5"/>';
    s += P("M" + f(b1[0] - 4) + "," + f(b1[1] - 4) + " c4,-2 8,2 6,6", "none", "#8b1414", 3);   /* the raw end it's working on */
    s += P("M" + f(hand[0] - 8) + "," + f(hand[1] - 6) + " l-6,10 M" + f(hand[0] - 2) + "," + f(hand[1] - 8) + " l-2,14 M" + f(hand[0] + 4) + "," + f(hand[1] - 6) + " l2,12", "none", "#e8e0c8", 3.5) +
      P("M" + f(hand[0] - 8) + "," + f(hand[1] - 6) + " l-6,10 M" + f(hand[0] - 2) + "," + f(hand[1] - 8) + " l-2,14 M" + f(hand[0] + 4) + "," + f(hand[1] - 6) + " l2,12", "none", INK, 1);
    s += R.sfx("gnnk", 222, 446, 16, { fill: "#cfc8b8", stroke: "#2a2626", sw: 2, rot: 8 });
    /* bone chips in the mud */
    s += P("M262," + (GR + 14) + " l6,-3 l2,4Z M276," + (GR + 20) + " l5,-2 l1,4Z", "#e2dac2", INK, 1.2);

    /* Rusty, hunched on the bucket, elbows on his knees, the little stick rabbit in his hands */
    s += R.person(k, { x: 98, y: GR, s: .82, pose: "sitLow", outfit: "eternal", wear: .8, expr: "tender", turn: .5, look: 1, light: 1 });
    s += R.woodRabbit(k, { x: 158, y: GR - 82, s: .38, color: "#dcc392", rot: -6 });

    s += R.vignette(k, 400, 600, .75);
    return s;
  }
});
