/* p22: Rusty dragged down the midway between two of the Unwilling. A caged man screams; rabbits gone wrong.
   Span 3, viewBox 600x600, mood lurid, wear 0.1. */
RUSTY.panel({
  id: "p22", w: 600, h: 600,
  alt: "Night on the carnival midway, strung with bulbs and lined with striped tents that run off into the dark toward a glowing big top. Two grinning clowns drag Rusty toward us by his wrists, his heels gouging two long furrows in the mud behind him. Above them, a man in a hanging cage grips the bars and screams, his mouth stretched long. A rabbit-thing hunches by the tents, and red eyes watch from a tent flap.",
  captions: [{ at: "bl", text: "Men screamed until their lungs gave out.", w: 56 }],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 62, y: 3, w: 36, tail: [83, 25], text: "The ones who come get to go <em>HOME.</em>" }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var VP = [300, 330];
    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12060a"/><stop offset=".55" stop-color="#3a0c12"/><stop offset="1" stop-color="#8a2a1a"/></linearGradient>' +
      '<linearGradient id="' + k.id("mud") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3a1e"/><stop offset=".35" stop-color="#4a2216"/><stop offset="1" stop-color="#1e0e0a"/></linearGradient>' +
      '<filter id="' + k.id("sh") + '"><feColorMatrix type="matrix" values="0 0 0 0 .04  0 0 0 0 .01  0 0 0 0 .01  0 0 0 .7 0"/></filter>' +
      "</defs>";
    s += '<rect width="600" height="600" fill="' + k.url("sky") + '"/>';
    /* the big top at the end of the midway, lit from inside */
    s += R.glow(k, VP[0], VP[1] - 30, 200, .8, true);
    s += R.bigTop(k, { x: VP[0], y: VP[1] + 8, s: .42, a: "#7a1414", b: "#e0c890" });
    s += R.glow(k, VP[0], VP[1] - 6, 40, .9);
    /* tents down both sides, shrinking toward it */
    s += R.bigTop(k, { x: 196, y: 352, s: .26, a: "#3a1a3a", b: "#a89878" }) + R.bigTop(k, { x: 410, y: 350, s: .25, a: "#5e1010", b: "#b8a888" });
    s += R.bigTop(k, { x: 60, y: 410, s: .5, a: "#5e1010", b: "#c9b090" }) + R.bigTop(k, { x: 560, y: 404, s: .48, a: "#3a1a3a", b: "#b0a080" });
    /* red eyes in a tent flap */
    s += '<circle cx="553" cy="388" r="3.4" fill="#ff3b2f"/><circle cx="566" cy="390" r="2.2" fill="#ff3b2f"/>' + R.glow(k, 560, 389, 18, .6, true);
    /* the mud midway, in perspective */
    s += P("M0,600 L0,430 L" + (VP[0] - 70) + "," + (VP[1] + 12) + " L" + (VP[0] + 70) + "," + (VP[1] + 12) + " L600,426 L600,600Z", k.url("mud"), INK, 3);
    var ruts = ""; for (var i = -6; i <= 6; i++) ruts += "M" + f(VP[0] + i * 9) + "," + (VP[1] + 14) + " L" + f(300 + i * 110) + ",600 ";
    s += P(ruts, "none", "#1c0c08", 2, 'opacity=".45"');
    /* puddles catching bulb light */
    s += '<ellipse cx="150" cy="470" rx="46" ry="7" fill="#e0a050" opacity=".35"/><ellipse cx="452" cy="452" rx="34" ry="5" fill="#e0a050" opacity=".3"/><ellipse cx="300" cy="372" rx="30" ry="4" fill="#ffd27a" opacity=".45"/>';
    /* bulb strings zig-zagging away over the midway */
    s += R.bulbWire(k, [0, 120], [600, 132], 34, 13, { r: 4.6, dead: 5 });
    s += R.bulbWire(k, [70, 230], [530, 236], 16, 11, { r: 3.2, dead: 4 });
    s += R.bulbWire(k, [170, 290], [430, 292], 8, 8, { r: 2.2, red: true });

    /* the heels' furrows, running back up the midway the way he came */
    s += P("M238,580 C256,500 282,430 296,346 M272,592 C282,510 300,440 304,346", "none", "#120806", 7) + P("M238,580 C256,500 282,430 296,346 M272,592 C282,510 300,440 304,346", "none", "#6a3a22", 2, 'opacity=".6"');
    /* a rabbit-thing hunched by the tents, watching him go by */
    s += R.monsterRabbit(k, { x: 196, y: 404, s: .2, fur: "#3a2a2a", blood: true });
    /* the cage, hung from a gibbet arm, a man inside screaming */
    s += P("M200,0 V24 M200,24 C240,20 300,22 316,30", "none", INK, 7) + P("M316,30 V54", "none", INK, 3);
    var cx0 = 244, cx1 = 392, cy0 = 54, cy1 = 214;
    s += P("M" + cx0 + "," + cy0 + " H" + cx1 + " V" + cy1 + " H" + cx0 + "Z", "#1a0a0c", INK, 4);
    s += R.glow(k, 318, 120, 90, .45);
    var man = { face: R.FACE.danny, skin: "#d8ae92", hair: "#1e1a18", grey: 0, brow: "#1e1a18", hairStyle: "full", must: false, nose: 1.15, droop: 2, age: .9, browW: 1.2, stubble: .7, flush: .3 };
    s += R.head(k, { x: 304, y: 128, s: .8, ch: man, expr: { bi: 14, bo: -7, eye: 1.5, curve: -1, open: 0 }, turn: 0, light: 1, lw: 4 });
    /* the scream: jaw dropped past the chin, mouth stretched long */
    s += P("M290,148 C286,172 292,196 304,200 C316,196 322,172 318,148 C312,142 296,142 290,148Z", "#d8ae92", INK, 3.5);
    s += P("M294,152 C291,172 296,190 304,193 C312,190 317,172 314,152 C308,148 300,148 294,152Z", "#2a0606", INK, 2);
    s += P("M296,153 h16 l-2,5 h-12Z", "#e9e1cf", INK, 1.2) + P("M299,186 c2,-6 8,-6 10,0 c-3,3 -7,3 -10,0Z", "#8a2a2a");
    s += P("M286,150 c-4,10 -4,20 0,28 M322,150 c4,10 4,20 0,28", "none", INK, 2);
    /* the bars, and his hands white-knuckled round them */
    var bars = ""; for (var bx = cx0 + 15; bx < cx1; bx += 30) bars += "M" + bx + "," + cy0 + " V" + cy1 + " ";
    s += P(bars, "none", INK, 7.5) + P(bars, "none", "#8a857a", 3.5);
    s += P("M" + cx0 + "," + (cy0 + 8) + " H" + cx1 + " M" + cx0 + "," + (cy1 - 8) + " H" + cx1, "none", "#5a564e", 8) + P("M" + cx0 + "," + cy0 + " H" + cx1 + " V" + cy1 + " H" + cx0 + "Z", "none", INK, 4);
    s += R.fist(k, { x: 249, y: 172, s: .3, skin: "#d8ae92", rot: 4 }) + R.fist(k, { x: 359, y: 172, s: .3, skin: "#d8ae92", flip: -1, rot: -4 });
    s += R.sfx("AAAAAAAHHH", 236, 96, 34, { anchor: "end", fill: "#f6d27a", rot: -12, sw: 5, ls: 0 });
    s += P("M246,118 l-30,6 M244,134 l-34,14 M250,82 l-28,-10", "none", "#f6d27a", 3);

    /* long shadows thrown toward us by the bulbs behind them */
    s += '<g filter="url(#' + k.id("sh") + ')">' +
      '<g transform="translate(117,560) matrix(1,0,-.3,-.18,0,0)">' + R.player(k, { s: .75, variant: 1, pose: "grab" }) + "</g>" +
      '<g transform="translate(485,560) matrix(1,0,.3,-.18,0,0)">' + R.player(k, { s: .75, variant: 0, pose: "grab", flip: -1 }) + "</g></g>";

    /* the drag */
    s += R.player(k, { x: 117, y: 560, s: .75, variant: 1, pose: "grab", glow: "#ff3b2f", grin: 1 });
    s += R.person(k, { x: 300, y: 600, s: .85, pose: "dragged", outfit: "suit", expr: "anguish", turn: 0, wear: .1, light: 1, headTilt: -6 });
    s += R.player(k, { x: 485, y: 560, s: .75, variant: 0, pose: "grab", flip: -1, glow: "#ff3b2f", grin: 1 });
    /* clods of mud kicked up at his heels */
    s += P("M250,590 l-8,-10 l10,2Z M346,586 l10,-12 l-2,12Z M236,574 l-4,-6 l6,1Z", "#3a1c10", INK, 1.5);
    s += P("M90,540 l-40,10 M100,560 l-50,0 M520,540 l40,10", "none", "#f6d27a", 3, 'opacity=".5"');

    /* lurid Ben-Day dots + vignette */
    s += '<rect width="600" height="600" fill="' + k.url("dotsR") + '" opacity=".16"/>';
    s += R.vignette(k, 600, 600, .85);
    return s;
  }
});
