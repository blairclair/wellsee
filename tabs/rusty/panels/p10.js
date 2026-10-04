/* p10: SILENT. A cicada on a fencepost, huge. Its song stops mid-note.
   Span 2, viewBox 400x600, mood dawn.
   Shallow focus: the cicada and post are sharp; the carnival on the hill behind is out-of-focus
   bokeh in the carnival's three colours (bulb gold, blood red, poison green). */
RUSTY.panel({
  id: "p10", w: 400, h: 600,
  alt: "Close on a cicada clinging to a weathered fencepost strung with barbed wire, dew on the wood. Behind it, out of focus, the carnival on the hill blurs into balls of gold, red and green light. Its red eyes hold two tiny points of carnival light. The word chrrr hangs in the air, struck through in red. Nothing is singing.",
  captions: [{ at: "bl", text: "And all the bugs went quiet.", w: 86 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var GOLD = "#f6d27a", BLOOD = "#c0221b", POISON = "#8fe04a";
    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a3a5e"/><stop offset=".45" stop-color="#b9707a"/><stop offset=".75" stop-color="#e8a983"/><stop offset="1" stop-color="#f3d2a0"/></linearGradient>' +
      '<radialGradient id="' + k.id("bk") + '"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset=".8" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + k.id("wood") + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6a5a48"/><stop offset=".45" stop-color="#9a8a70"/><stop offset=".8" stop-color="#7a6a54"/><stop offset="1" stop-color="#4a3a2e"/></linearGradient>' +
      "</defs>";
    s += '<rect width="400" height="600" fill="' + k.url("sky") + '"/>';
    /* the hill, soft and far, and the carnival smeared into light */
    s += P("M0,330 C90,300 220,290 400,310 V600 H0Z", "#5a3a4e", null, 0, 'opacity=".75"');
    s += P("M140,300 L190,240 L240,300Z", "#8b2a30", null, 0, 'opacity=".45"');
    s += '<circle cx="320" cy="250" r="64" fill="none" stroke="#3a2030" stroke-width="7" opacity=".35"/>';
    s += R.glow(k, 200, 290, 220, .5, true) + R.glow(k, 190, 280, 140, .55);
    [[52, 150, 30, GOLD, .5], [118, 96, 18, BLOOD, .55], [330, 160, 34, POISON, .38], [282, 74, 16, GOLD, .5], [36, 276, 20, BLOOD, .5], [360, 298, 24, GOLD, .45],
      [300, 236, 14, BLOOD, .6], [342, 218, 12, POISON, .5], [262, 270, 10, GOLD, .7], [70, 220, 12, POISON, .45], [160, 60, 11, POISON, .4], [380, 90, 15, BLOOD, .45], [20, 70, 13, GOLD, .45]].forEach(function (b) {
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] * 1.9 + '" fill="' + b[3] + '" opacity="' + f(b[4] * .3) + '"/>';
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + b[3] + '" opacity="' + b[4] + '"/>';
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + k.url("bk") + '" opacity="' + f(b[4] * .6) + '"/>';
    });
    s += R.tone(k, "M0,0 H400 V600 H0Z", .12);

    /* barbed wire, sagging off both sides of the post */
    var barb = function (x, y) { return "M" + (x - 6) + "," + (y - 6) + " L" + (x + 6) + "," + (y + 6) + " M" + (x + 6) + "," + (y - 6) + " L" + (x - 6) + "," + (y + 6) + " "; };
    var wire = "M0,318 Q70,330 132,322 M268,330 Q330,342 400,334 M0,440 Q66,452 134,446 M266,452 Q340,462 400,456";
    s += P(wire, "none", INK, 4.5) + P(wire, "none", "#8a8680", 2);
    s += P(barb(44, 324) + barb(100, 326) + barb(310, 336) + barb(366, 337) + barb(40, 446) + barb(96, 449) + barb(318, 457) + barb(372, 457), "none", INK, 2.4);

    /* fencepost: split grain, a knot, lichen, a staple holding the wire */
    s += P("M118,600 L128,184 C148,164 252,164 272,184 L284,600Z", k.url("wood"), INK, 5.5);
    s += P("M128,184 C150,200 250,200 272,184 C252,170 148,170 128,184Z", "#b4a284", INK, 3.5);
    s += P("M150,180 C170,186 196,186 214,182 M232,180 l14,4", "none", "#6a5a48", 2);
    s += P("M148,224 C160,320 144,420 158,600 M222,204 C230,300 214,450 232,600 M186,210 C190,280 184,330 190,400 M250,262 l6,60 M140,360 c6,20 4,40 10,60", "none", "#4a3a2e", 2.4, 'opacity=".85"');
    s += P("M246,250 C266,272 270,410 262,560", "none", "#4a3a2e", 4, 'opacity=".7"');
    s += '<ellipse cx="160" cy="520" rx="12" ry="20" fill="#5a4a3a" stroke="' + INK + '" stroke-width="2.5"/><ellipse cx="160" cy="520" rx="5" ry="9" fill="#3a2a20"/>';
    s += P("M128,250 c10,-6 18,4 14,12 c-6,8 -14,2 -14,-12Z M134,420 c8,-2 12,6 8,12 c-6,4 -10,-4 -8,-12Z", "#9aa86a", INK, 1.5, 'opacity=".8"');
    s += R.tone(k, "M236,176 L272,184 L284,600 L240,600Z", .5);
    s += P("M276,318 h-12 v10 h12 M276,442 h-12 v10 h12", "none", "#5a5650", 3);
    /* dew, catching the wrong light */
    [[200, 470, 5], [176, 500, 3.5], [214, 520, 4], [146, 300, 3.5], [258, 400, 3]].forEach(function (d) {
      s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="#e8f4f0" stroke="' + INK + '" stroke-width="1.4" opacity=".9"/><circle cx="' + (d[0] + d[2] * .35) + '" cy="' + (d[1] - d[2] * .35) + '" r="' + f(d[2] * .35) + '" fill="' + GOLD + '"/>';
    });

    /* the cicada, head up, clinging */
    var c = '<g transform="translate(200,352) rotate(-6)">';
    /* legs first, claws hooked into the grain */
    var legs = "M-24,-118 L-58,-130 L-70,-96 l-8,4 M24,-118 L58,-130 L70,-96 l8,4 M-26,-72 L-64,-64 L-74,-30 l-8,6 M26,-72 L64,-64 L74,-30 l8,6 M-20,-30 L-56,-6 L-58,34 l-8,8 M20,-30 L56,-6 L58,34 l8,8";
    c += P(legs, "none", INK, 7) + P(legs, "none", "#4a3a20", 3.5);
    /* wings: glassy, veined, catching red and green at the edges */
    var wl = "M-26,-136 C-104,-60 -100,110 -44,196 C-22,160 -28,10 -18,-120Z", wr = "M26,-136 C104,-60 100,110 44,196 C22,160 28,10 18,-120Z";
    c += P(wl, "#e4ecdc", null, 0, 'opacity=".55"') + P(wr, "#e4ecdc", null, 0, 'opacity=".55"');
    c += P("M-34,-90 C-80,-20 -80,80 -48,160", "none", BLOOD, 6, 'opacity=".25"') + P("M34,-90 C80,-20 80,80 48,160", "none", POISON, 6, 'opacity=".3"');
    var vein = "M-28,-120 C-64,-50 -66,60 -46,170 M-26,-100 C-44,-20 -44,80 -34,150 M-60,-40 L-40,-30 M-66,20 L-42,26 M-64,80 L-40,84 M-56,130 L-38,132 " +
      "M28,-120 C64,-50 66,60 46,170 M26,-100 C44,-20 44,80 34,150 M60,-40 L40,-30 M66,20 L42,26 M64,80 L40,84 M56,130 L38,132";
    c += P(vein, "none", "#3a4a2a", 1.8, 'opacity=".85"');
    c += P(wl, "none", INK, 3) + P(wr, "none", INK, 3);
    /* body: thorax plate, segmented abdomen */
    c += P("M-30,-130 C-38,-40 -30,60 0,124 C30,60 38,-40 30,-130Z", "#4a5a2a", INK, 4);
    c += P("M-28,-56 Q0,-48 28,-56 M-26,-28 Q0,-20 26,-28 M-22,0 Q0,8 22,0 M-17,30 Q0,37 17,30 M-11,60 Q0,66 11,60 M-6,88 Q0,92 6,88", "none", "#22300f", 3);
    c += P("M10,-120 C16,-60 14,20 6,90", "none", "#a8c070", 3, 'opacity=".6"');
    c += R.tone(k, "M-30,-130 C-38,-40 -30,60 0,124 L-2,-130Z", .5);
    c += P("M-34,-140 C-34,-118 34,-118 34,-140 C30,-152 -30,-152 -34,-140Z", "#3a4a1e", INK, 3.5);
    c += P("M-20,-146 l8,10 l8,-10 l8,10 l8,-10", "none", "#8aa04a", 2.2, 'opacity=".8"');
    /* head + eyes holding the carnival */
    c += P("M-38,-170 C-42,-202 42,-202 38,-170 C36,-142 -36,-142 -38,-170Z", "#5a6a3a", INK, 4);
    c += P("M-10,-190 l4,10 l6,-12 l6,12 l4,-10", "none", "#c0221b", 2.5, 'opacity=".8"');
    c += '<circle cx="-38" cy="-176" r="14" fill="#9b1218" stroke="' + INK + '" stroke-width="3.5"/><circle cx="38" cy="-176" r="14" fill="#9b1218" stroke="' + INK + '" stroke-width="3.5"/>';
    c += '<circle cx="-41" cy="-180" r="4.5" fill="' + GOLD + '"/><circle cx="35" cy="-180" r="4.5" fill="' + GOLD + '"/><circle cx="-34" cy="-171" r="1.8" fill="' + POISON + '"/><circle cx="42" cy="-171" r="1.8" fill="' + POISON + '"/>';
    c += P("M-14,-198 l-10,-22 M14,-198 l10,-22", "none", INK, 2.5);
    c += "</g>";
    s += c;

    /* the song, cut off: the word sags and is struck through */
    s += R.sfx("chrrr...", 52, 84, 46, { fill: "#d8e8a0", rot: -6, extra: 'opacity=".6"' });
    s += R.sfx("chrr", 280, 120, 22, { fill: "#d8e8a0", rot: 8, extra: 'opacity=".35"' });
    s += P("M36,72 L252,50", "none", INK, 11) + P("M36,72 L252,50", "none", "#c0221b", 6);
    s += P("M272,108 L340,118", "none", "#c0221b", 4, 'opacity=".7"');
    s += R.vignette(k, 400, 600, .55);
    return s;
  }
});
