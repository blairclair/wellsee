/* p13: Rusty tears the ticket in half. The light turns red. Under the dead light pole, one of the Unwilling waves.
   Span 6, viewBox 1200x600, mood light->red, wear 0.
   Same lot as p09, the light gone to blood: the carnival's bulbs on the hill burn red, the school
   windows bleed, and at the far end of the lot, under the pole that was empty in p09, something
   too tall stands and waves. Its shadow runs the length of the lot toward Rusty. */
RUSTY.panel({
  id: "p13", w: 1200, h: 600,
  alt: "Rusty rips the red ticket in two and shouts, scraps of it flying, his face twisted with anger. The whole sky goes blood red, the carnival on the hill burns red, and the school windows bleed. Behind him his rusted pickup sits in the red light. At the far end of the parking lot, under the dead light pole that was empty a moment ago, one of the Unwilling stands far too tall in a dark striped suit, pinprick red eyes, slowly waving. Its long shadow stretches across the lot toward Rusty.",
  captions: [],
  balloons: [
    { kind: "shout", who: "Rusty", x: 2, y: 5, w: 24, tail: [36, 26], text: "Not today. You hear me?" },
    { kind: "shout", who: "Rusty", x: 4, y: 37, w: 20, tail: [35, 29], text: "<b>NOT TODAY.</b>" },
    { kind: "clown", who: "One of the Unwilling", x: 62, y: 6, w: 22, tail: [80, 39], text: "...tonight, then." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var BLOOD = "#c0221b";
    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a0404"/><stop offset=".5" stop-color="#8b1414"/><stop offset=".72" stop-color="#c8341f"/><stop offset="1" stop-color="#ee7a3e"/></linearGradient>' +
      '<linearGradient id="' + k.id("lot") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5a2420"/><stop offset="1" stop-color="#1e0c0c"/></linearGradient>' +
      '<linearGradient id="' + k.id("shadow") + '" x1="1" x2="0" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>' +
      "</defs>";
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    s += R.rays(470, 260, 34, 1300, "#2a0404", .38);
    s += R.glow(k, 470, 230, 260, .5, true);
    s += R.tone(k, "M0,0 H1200 V200 H0Z", .25, true);

    /* the hill and the carnival, all its bulbs gone red */
    s += P("M560,410 C680,350 840,318 960,318 C1060,318 1140,334 1200,348 V430 H560Z", "#2a0606", INK, 2.5);
    s += R.glow(k, 860, 330, 200, .6, true);
    s += R.ferris(k, { x: 1110, y: 236, s: .42, color: "#140202", car: "#3a0606" });
    for (var j = 0; j < 16; j++) {
      var a = j / 16 * Math.PI * 2, bx = 1110 + Math.cos(a) * 63, by = 236 + Math.sin(a) * 63;
      s += '<circle cx="' + f(bx) + '" cy="' + f(by) + '" r="6" fill="#ff3b2f" opacity=".35"/><circle cx="' + f(bx) + '" cy="' + f(by) + '" r="2.2" fill="#ffb08a"/>';
    }
    s += R.bigTop(k, { x: 860, y: 330, s: .3, a: "#3a0606", b: "#6a1010", flag: "#140202" });
    s += R.bigTop(k, { x: 760, y: 340, s: .16, a: "#2a0404", b: "#4a0808" });
    s += R.bulbWire(k, [700, 340], [1180, 338], 10, 24, { r: 2, red: true, color: "#ff8a6a" });

    /* town, fence, the school with its windows bleeding */
    s += P("M0,432 V380 h60 v-18 h40 v18 h60 v-36 l16,-18 l16,18 v36 h60 v-16 h50 v16 h80 v-24 h40 v24 h90 v-12 h70 v12 h120 v-20 h60 v20 h120 v-10 h130 v74Z", "#200606", INK, 2);
    var fence = ""; for (var fx = 340; fx < 1200; fx += 34) fence += "M" + fx + ",432 V410 ";
    s += P(fence + "M340,412 H1200", "none", "#3a1010", 2.5);
    s += P("M0,236 H150 V440 H0Z", "#4a1612", INK, 4) + P("M0,226 H160 V240 H0Z", "#2a0a08", INK, 3);
    [[14, 262], [84, 262], [14, 350], [84, 350]].forEach(function (w) {
      s += '<rect x="' + w[0] + '" y="' + w[1] + '" width="50" height="58" fill="#ff4a2a" stroke="' + INK + '" stroke-width="3"/>' + P("M" + (w[0] + 25) + "," + w[1] + " V" + (w[1] + 58) + " M" + w[0] + "," + (w[1] + 29) + " H" + (w[0] + 50), "none", INK, 2.5);
      s += P("M" + (w[0] + 8) + "," + (w[1] + 58) + " v14 M" + (w[0] + 34) + "," + (w[1] + 58) + " v22", "none", "#8b1414", 3);
    });
    s += R.tone(k, "M0,236 H150 V440 H0Z", .35);

    /* the lot */
    s += P("M0,432 H1200 V600 H0Z", k.url("lot"), INK, 3);
    var vp = [900, 410];
    [-300, 60, 420, 780, 1140, 1500].forEach(function (x0) {
      var t = (462 - 600) / (vp[1] - 600), x1 = x0 + (vp[0] - x0) * t;
      s += P("M" + x0 + ",600 L" + f(x1) + ",462", "none", "#c08a7a", 5, 'opacity=".45"');
    });
    s += P("M0,462 H1200", "none", "#c08a7a", 3, 'opacity=".3"');
    s += P("M60,560 l40,-10 l20,14 l36,-6 M700,500 l30,6 l10,-8 l24,4 M980,560 l-30,12 l-12,-8 l-30,10", "none", INK, 1.8, 'opacity=".6"');
    s += R.tone(k, "M0,520 H1200 V600 H0Z", .35);

    /* its shadow, running the whole length of the lot toward him */
    s += P("M966,476 L620,560 L600,600 L700,600 L984,478Z", k.url("shadow"));
    s += P("M640,556 l-46,-30 M640,562 l-40,4", "none", "#000", 7, 'opacity=".25"');

    /* his pickup, behind him in the red */
    /* side view: open bed with its rail and the mop handle sticking up, a gap, then the cab and hood */
    s += '<g transform="translate(150,438)">' +
      R.limb([[40, -26], [70, 40]], 5, "#7a5a3a", 2.5) +
      P("M0,96 V36 L8,30 H146 V96Z", "#5a1a10", INK, 4) +
      P("M8,30 H146 L140,42 H12Z", "#1a0606", INK, 2.5) +
      P("M0,52 H146", "none", INK, 2) +
      P("M154,96 V40 L174,10 H252 L264,40 H330 L336,60 V96Z", "#5a1a10", INK, 4) +
      P("M182,18 H246 L256,40 H172Z", "#ff5a3a", INK, 3, 'opacity=".85"') +
      P("M146,40 V96 M206,40 V92", "none", INK, 2.5) +
      P("M38,96 C38,66 94,66 94,96 M240,96 C240,66 296,66 296,96", "#120606", INK, 3) +
      '<circle cx="66" cy="98" r="22" fill="#120606" stroke="' + INK + '" stroke-width="4"/><circle cx="268" cy="98" r="22" fill="#120606" stroke="' + INK + '" stroke-width="4"/>' +
      '<rect x="-4" y="44" width="8" height="16" fill="#ff3b2f" stroke="' + INK + '" stroke-width="2"/>' +
      R.tone(k, "M0,70 H336 V96 H0Z", .45) + "</g>";

    /* the dead light pole, and what stands under it now */
    /* the pole is a full-size lamp post; the thing under it is nearly as tall */
    s += P("M1010,472 V226 C1010,216 1004,210 992,210 H962", "none", INK, 11) + P("M1010,472 V226 C1010,216 1004,210 992,210 H962", "none", "#2a1414", 6);
    s += P("M938,205 h30 l-4,12 h-22Z", "#1a0c0c", INK, 2.5);
    s += '<ellipse cx="972" cy="476" rx="40" ry="6" fill="#000" opacity=".5"/>';
    s += R.player(k, { x: 972, y: 474, s: .42, pose: "wave", variant: 1, flip: -1, glow: "#ff3b2f" });
    s += R.glow(k, 970, 272, 30, .5, true);

    /* Rusty tearing the ticket: on-model, anger, rimmed red */
    var tear = { legs: [[[-18, -185], [-30, -95], [-44, -8]], [[18, -185], [32, -95], [44, -8]]],
      arms: [[[-46, -298], [-86, -280], [-40, -330]], [[46, -298], [96, -284], [70, -334]]], stoop: -4 };
    s += '<ellipse cx="470" cy="590" rx="150" ry="13" fill="#000" opacity=".55"/>';
    s += R.person(k, { x: 470, y: 588, s: 1.25, pose: tear, outfit: "work", expr: "anger", turn: .15, light: 1, headTilt: -4 });
    s += P("M528,216 C540,250 542,300 534,354 M520,374 C526,440 530,500 528,574", "none", "#ff8a5a", 3, 'opacity=".75"');
    /* ticket halves at his hands */
    var lh = [470 - 40 * 1.25, 588 - 330 * 1.25], rh = [470 + 70 * 1.25, 588 - 334 * 1.25];
    s += '<g transform="rotate(-30 ' + lh[0] + " " + lh[1] + ')">' + P("M" + (lh[0] - 50) + "," + (lh[1] - 22) + " H" + (lh[0] + 6) + " l-6,8 l8,8 l-6,8 l6,6 H" + (lh[0] - 50) + "Z", BLOOD, INK, 3) + P("M" + (lh[0] - 42) + "," + (lh[1] - 14) + " H" + (lh[0] - 4), "none", "#f6d27a", 2, 'stroke-dasharray="5 4"') + "</g>";
    s += '<g transform="rotate(26 ' + rh[0] + " " + rh[1] + ')">' + P("M" + (rh[0] + 50) + "," + (rh[1] - 22) + " H" + (rh[0] - 6) + " l6,8 l-8,8 l6,8 l-6,6 H" + (rh[0] + 50) + "Z", BLOOD, INK, 3) + P("M" + (rh[0] + 42) + "," + (rh[1] - 14) + " H" + (rh[0] + 4), "none", "#f6d27a", 2, 'stroke-dasharray="5 4"') + "</g>";
    /* scraps of it, flying */
    [[540, 120, 20], [590, 160, -30], [500, 100, 50], [620, 110, 10], [560, 70, -60], [650, 190, 40]].forEach(function (c, i) {
      s += '<path d="M-7,-5 L7,-4 L5,5 L-6,4Z" fill="' + (i % 2 ? BLOOD : "#e8c06a") + '" stroke="' + INK + '" stroke-width="1.8" transform="translate(' + c[0] + "," + c[1] + ") rotate(" + c[2] + ')"/>';
    });
    s += R.sfx("RRRIP!", 560, 236, 72, { fill: "#f6d27a", rot: -12, sw: 7 });
    s += P("M430,170 l-20,-30 M460,160 l-4,-34 M530,168 l14,-30", "none", "#f6d27a", 4);
    s += R.vignette(k, 1200, 600, .7);
    return s;
  }
});
