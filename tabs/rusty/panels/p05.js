/* p05: The janitor's closet. A taped photo of a five-year-old on a training-wheel bike and his laughing mother;
   a 9-year sobriety chip on the shelf under it. Span 2, viewBox 400x600, mood day. No Rusty in frame, just his life.
   Danny is ~5 in the photo ('03; class of 2016 at 18), so he is drawn with child proportions (big head, short limbs). */
RUSTY.panel({
  id: "p05", w: 400, h: 600,
  alt: "Inside the janitor's closet, under a bare bulb: an old snapshot is taped to the cinderblock wall. In it a freckled five-year-old boy with a gap-toothed grin sits on a little red bike with training wheels while his auburn-haired mother crouches beside him with an arm around him, head thrown back, laughing. It is labelled Carol and Danny, '03. On the shelf below sit a hot plate, a dented thermos, a faded #1 DAD mug full of pencils, and a bronze nine-year sobriety chip catching the light.",
  captions: [
    { at: "tl", text: "Nine years sober.", w: 56 },
    { at: "bl", text: "Nine years too late for the only person it should have mattered to.", w: 92 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    function circ(cx, cy, r, fill, sw, extra) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + (fill || "none") + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + (extra ? " " + extra : "") + "/>"; }
    function ell(cx, cy, rx, ry, fill, sw, extra) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + (fill || "none") + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + (extra ? " " + extra : "") + "/>"; }

    /* ---------- the closet wall: painted cinderblock, one bulb ---------- */
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c4c8"/><stop offset="1" stop-color="#efe2bc"/></linearGradient>' +
      '<clipPath id="' + k.id("img") + '"><rect x="44" y="84" width="312" height="272"/></clipPath>' +
      '<radialGradient id="' + k.id("leak") + '" cx="85%" cy="10%" r="60%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".75"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>';
    s += '<rect width="400" height="600" fill="#9c8a66"/>';
    var bl = "";
    for (var r = 0; r < 16; r++) {
      var y = r * 38 + 10; bl += "M0," + y + " H400 ";
      for (var x = (r % 2) * 50 - 50; x < 400; x += 100) bl += "M" + x + "," + y + " v38 ";
    }
    s += P(bl, "none", "#7a6a4c", 2.2);
    s += R.glow(k, 330, 30, 360, .65);
    s += R.tone(k, "M0,0 H140 V600 H0Z", .22) + R.tone(k, "M0,300 H400 V600 H0Z", .18);
    /* bulb, top right, out of the caption's way */
    s += P("M336,0 V22", "none", INK, 3) + P("M328,20 h16 v10 h-16Z", "#6a6a62", INK, 2) + ell(336, 40, 11, 13, "#fff6d2", 2);
    s += P("M344,44 V128", "none", "#8c8576", 1.8, 'stroke-dasharray="2 3"') + circ(344, 131, 3, "#8c8576");

    /* ---------- the photo ---------- */
    s += ell(206, 396, 150, 10, "#000", 0, 'opacity=".18"');
    s += '<g transform="rotate(-4 200 240)">';
    s += P("M36,76 H364 V408 H36Z", "#000", null, 0, 'opacity=".25" transform="translate(6,7)"');            /* drop shadow */
    s += P("M36,76 H364 V384 L340,408 H36Z", "#efe6cc", INK, 3);                                          /* card, corner folded */
    s += P("M364,384 L340,408 L346,386Z", "#cdbf9c", INK, 2.2);                                           /* the curl */
    s += '<g clip-path="' + k.url("img") + '">';
    /* summer backyard, '03 */
    s += '<rect x="44" y="84" width="312" height="272" fill="' + k.url("sky") + '"/>';
    s += P("M44,200 C60,150 90,140 112,160 C130,120 176,128 186,166 C210,150 240,160 246,190 L246,230 H44Z", "#6f8a5a");    /* tree line */
    s += P("M246,186 C270,150 320,150 356,176 V230 H246Z", "#7c9662");
    s += circ(312, 112, 18, "#fff3cc", 0, 'opacity=".9"') + R.glow(k, 312, 112, 90, .7);
    var fence = ""; for (var fx = 40; fx < 360; fx += 18) fence += "M" + fx + ",250 V214 l7,-8 l7,8 V250Z ";
    s += P(fence, "#d8ccb0", INK, 1.6) + P("M40,222 H360 M40,242 H360", "none", "#a89c80", 3);
    s += P("M44,248 H356 V356 H44Z", "#93a964");
    s += P("M60,280 l3,-7 l3,7 M100,300 l3,-8 l3,8 M300,290 l3,-7 l3,7 M330,330 l3,-8 l3,8 M70,340 l3,-7 l3,7", "none", "#6d8446", 2);
    s += ell(176, 352, 120, 9, "#4f6a36", 0, 'opacity=".55"');

    /* Carol, crouched behind the bike, arm around him */
    var cs = "#e9bf9c", ch = "#9a4a22", blouse = "#d98a5a";
    s += P("M226,350 C222,320 236,300 262,300 C290,300 300,326 296,350Z", "#4a5a7a", INK, 3);              /* folded knees */
    s += P("M234,202 C224,232 228,282 240,312 L294,312 C302,272 300,224 290,204 C282,190 264,186 250,188 C242,190 236,196 234,202Z", blouse, INK, 3.2);   /* torso */
    s += R.tone(k, "M236,196 C222,226 226,280 240,312 L256,312 C246,270 244,226 252,190Z", .18);
    s += P("M246,210 L252,238 M266,206 L262,236", "none", INK, 1.5, 'opacity=".6"');                    /* blouse placket */
    s += R.limb([[242, 204], [204, 214], [170, 196]], 14, blouse, 3);                                     /* arm around his back */
    s += R.limb([[282, 210], [300, 256], [286, 296]], 14, blouse, 3) + circ(284, 300, 7.5, cs, 2.6);     /* far hand on her knee */
    s += R.limb([[258, 196], [262, 176]], 14, cs, 2.6);                                                 /* neck */
    /* her hair falls back as she laughs */
    s += P("M252,112 C280,94 312,106 318,138 C324,170 318,198 302,216 C298,192 292,172 284,160Z", ch, INK, 2.6);
    s += R.head(k, { x: 268, y: 140, s: .42, rot: -16, ch: "carol", expr: { bi: 4, bo: 3, eye: 0, curve: 1, open: .75 }, turn: -.35, light: 1, lw: 3.2 });
    s += P("M226,108 l-8,-8 M222,122 l-11,-3 M232,98 l-3,-11", "none", INK, 2);                        /* laugh ticks */

    /* the bike: little red one, training wheels */
    var red = "#c63a2c";
    s += circ(96, 336, 13, "#2a2a2a", 3) + circ(96, 336, 5, "#bbb", 1.5) + P("M96,336 L120,316", "none", "#8a8a84", 4);   /* training wheel */
    s += circ(120, 316, 34, "none", 0) + circ(120, 316, 34, "none", 0, 'stroke="#222" stroke-width="7"') + circ(120, 316, 34, "none", 0, 'stroke="' + INK + '" stroke-width="1.6"');
    var spokes = ""; for (var a = 0; a < 12; a++) { var an = a * Math.PI / 6; spokes += "M120,316 L" + f(120 + Math.cos(an) * 31) + "," + f(316 + Math.sin(an) * 31) + " "; }
    s += P(spokes, "none", "#8a8a84", 1);
    /* kid's far leg */
    var shorts = "#3a5a8a", shirtY = "#e8c23a", kskin = "#f0c7a2";
    s += R.limb([[150, 252], [176, 274], [172, 304]], 13, mix(kskin, "#5a3a3a", .2), 2.6) + P("M162,304 h22 c6,0 8,8 0,8 h-22Z", "#3a3a5a", INK, 2.4);
    /* frame */
    s += P("M120,316 L146,256 L210,250 L226,316 M146,256 L158,316 L210,250 M120,316 L158,316", "none", INK, 9) +
      P("M120,316 L146,256 L210,250 L226,316 M146,256 L158,316 L210,250 M120,316 L158,316", "none", red, 5.5);
    s += circ(158, 316, 9, "#555", 2.4) + P("M150,318 h-10 M166,312 h10", "none", INK, 4);
    s += P("M128,252 C130,242 158,240 162,250 C156,256 134,258 128,252Z", "#2a2a2a", INK, 2.2);              /* seat */
    s += P("M210,250 L206,226 M192,222 C200,216 214,216 222,224", "none", INK, 6) + P("M210,250 L206,226 M192,222 C200,216 214,216 222,224", "none", "#c9c9c0", 3);
    s += P("M218,222 l10,10 M222,218 l12,8", "none", "#e04a8a", 2);                                         /* streamers */
    /* front wheel */
    s += circ(226, 316, 34, "none", 0, 'stroke="#222" stroke-width="7"') + circ(226, 316, 34, "none", 0, 'stroke="' + INK + '" stroke-width="1.6"');
    spokes = ""; for (var b = 0; b < 12; b++) { var bn = b * Math.PI / 6 + .2; spokes += "M226,316 L" + f(226 + Math.cos(bn) * 31) + "," + f(316 + Math.sin(bn) * 31) + " "; }
    s += P(spokes, "none", "#8a8a84", 1) + circ(226, 316, 4, "#999", 1.5);
    /* the kid: ~5, head a quarter of his height */
    s += P("M128,250 C126,236 136,230 150,232 C162,234 168,244 164,256 C150,262 136,260 128,250Z", shorts, INK, 2.8);     /* shorts */
    s += R.limb([[154, 250], [184, 262], [180, 300]], 14, kskin, 2.8);                                      /* near leg, bare knee */
    s += P("M178,262 h10 v6 h-10Z", "#f2e6c8", INK, 1.2, 'transform="rotate(20 183 265)"');                   /* bandaid */
    s += P("M168,298 h24 c7,0 9,9 0,9 h-24Z", "#c63a2c", INK, 2.6) + P("M172,303 h18", "none", "#fff", 1.5);       /* sneaker */
    s += P("M128,250 C122,226 124,198 134,184 C146,176 166,178 172,190 C176,210 170,236 164,252Z", shirtY, INK, 3); /* tee */
    s += P("M126,206 C140,210 160,210 174,204 M125,222 C140,226 160,226 171,220", "none", "#d0702a", 3.5);      /* stripes */
    s += R.limb([[164, 196], [190, 214], [204, 224]], 11, kskin, 2.6) + circ(206, 224, 6.5, kskin, 2.4);   /* arm to grip */
    s += circ(168, 196, 8, kskin, 0) ;
    /* Carol's hand on his shoulder, in front */
    s += P("M156,188 c4,-8 16,-8 18,2 c-2,6 -12,8 -18,-2Z", cs, INK, 2.4) + P("M160,186 l2,6 M166,184 l1,6", "none", INK, 1.2);
    /* head */
    var hx = 150, hy = 146;
    s += P("M" + (hx - 30) + "," + (hy + 2) + " c-9,-2 -10,14 0,14Z M" + (hx + 30) + "," + (hy + 2) + " c9,-2 10,14 0,14Z", kskin, INK, 2.4);  /* ears */
    s += P("M" + hx + "," + (hy - 34) + " C" + (hx + 26) + "," + (hy - 34) + " " + (hx + 32) + "," + (hy - 12) + " " + (hx + 31) + "," + (hy + 6) + " C" + (hx + 30) + "," + (hy + 26) + " " + (hx + 16) + "," + (hy + 34) + " " + hx + "," + (hy + 34) +
      " C" + (hx - 16) + "," + (hy + 34) + " " + (hx - 30) + "," + (hy + 26) + " " + (hx - 31) + "," + (hy + 6) + " C" + (hx - 32) + "," + (hy - 12) + " " + (hx - 26) + "," + (hy - 34) + " " + hx + "," + (hy - 34) + "Z", kskin, INK, 3);
    s += P("M" + (hx - 33) + "," + (hy - 2) + " C" + (hx - 36) + "," + (hy - 34) + " " + (hx - 14) + "," + (hy - 44) + " " + (hx + 4) + "," + (hy - 42) + " C" + (hx + 26) + "," + (hy - 40) + " " + (hx + 38) + "," + (hy - 24) + " " + (hx + 32) + "," + (hy - 2) +
      " C" + (hx + 26) + "," + (hy - 14) + " " + (hx + 18) + "," + (hy - 20) + " " + (hx + 8) + "," + (hy - 18) + " l-6,6 l-4,-7 C" + (hx - 10) + "," + (hy - 16) + " " + (hx - 24) + "," + (hy - 14) + " " + (hx - 33) + "," + (hy - 2) + "Z", "#5a3a24", INK, 2.8);   /* bowl cut */
    s += P("M" + (hx - 14) + "," + (hy + 1) + " q4,-6 8,0 M" + (hx + 6) + "," + (hy + 1) + " q4,-6 8,0", "none", INK, 2.6);       /* squinting with joy */
    s += P("M" + (hx - 18) + "," + (hy - 9) + " q6,-4 11,-1 M" + (hx + 7) + "," + (hy - 10) + " q6,-3 11,1", "none", "#5a3a24", 2.4);
    s += P("M" + (hx - 3) + "," + (hy + 6) + " q3,5 7,1", "none", INK, 1.8);                                   /* button nose */
    s += P("M" + (hx - 13) + "," + (hy + 15) + " C" + (hx - 8) + "," + (hy + 28) + " " + (hx + 10) + "," + (hy + 28) + " " + (hx + 15) + "," + (hy + 14) + " Q" + hx + "," + (hy + 19) + " " + (hx - 13) + "," + (hy + 15) + "Z", "#7a2020", INK, 2.2);   /* big grin */
    s += P("M" + (hx - 10) + "," + (hy + 17) + " H" + (hx - 2) + " M" + (hx + 5) + "," + (hy + 17) + " H" + (hx + 12), "none", "#fff", 2.6);   /* gap tooth */
    s += circ(hx - 20, hy + 12, 5, "#e08a7a", 0, 'opacity=".5"') + circ(hx + 21, hy + 12, 5, "#e08a7a", 0, 'opacity=".5"');
    var fr = ""; [[-19, 6], [-15, 9], [-22, 10], [-11, 7], [13, 7], [18, 9], [22, 6], [16, 4]].forEach(function (q) { fr += "M" + (hx + q[0]) + "," + (hy + q[1]) + "h.1 "; });
    s += P(fr, "none", "#a0603a", 2.4);
    /* print fade, light leak, grain, crease */
    s += '<rect x="44" y="84" width="312" height="272" fill="#e3b87a" opacity=".22"/>';
    s += '<rect x="44" y="84" width="312" height="272" fill="' + k.url("leak") + '"/>';
    s += '<rect x="44" y="84" width="312" height="272" fill="' + k.url("dots") + '" opacity=".06"/>';
    s += P("M44,84 H356 V356 H44Z", "#5a3a20", null, 0, 'opacity=".12"');
    s += "</g>";
    s += P("M44,84 H356 V356 H44Z", "none", INK, 2);
    s += P("M44,290 C120,282 240,300 356,286", "none", "#fff8e6", 2, 'opacity=".55"');                     /* crease */
    s += P("M44,291.5 C120,283.5 240,301.5 356,287.5", "none", "#5a4a30", 1, 'opacity=".35"');
    s += '<text x="196" y="384" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="21" fill="#2f3a7a" transform="rotate(-1.5 196 384)">Carol &amp; Danny, \'03</text>';
    s += "</g>";
    /* tape strips */
    s += P("M168,58 L238,62 L236,92 L166,88Z", "#efe6b8", null, 0, 'opacity=".75"') + P("M168,58 l2,4 l-2,4 l2,4 l-2,4 M238,62 l-2,4 l2,4 l-2,4", "none", "#c9bf8e", 1);

    s += '<g transform="translate(0,46)">';
    /* ---------- shelf ---------- */
    s += P("M0,424 H400 V446 H0Z", "#6a4a2a", INK, 3) + P("M0,446 H400 V456 H0Z", "#3a2814") + R.tone(k, "M0,436 H400 V446 H0Z", .4);
    s += P("M40,446 l14,40 M360,446 l-14,40", "none", INK, 6);                                            /* brackets */
    /* hot plate + dented pot */
    s += P("M6,424 V402 H112 V424Z", "#3a3a3a", INK, 3) + circ(28, 414, 4, "#c0221b", 1.2);
    s += P("M24,400 C20,370 32,358 58,358 C84,358 96,370 92,400Z", "#9a9a92", INK, 3) + P("M40,372 c8,6 6,16 -2,20", "none", INK, 2) + P("M92,370 h16", "none", INK, 5);
    s += R.tone(k, "M24,400 C20,370 32,358 46,358 L46,400Z", .35);
    /* #1 DAD mug of pencils */
    s += P("M126,424 V384 H166 V424Z", "#e6dcc4", INK, 3) + P("M166,392 c14,0 14,24 0,24", "none", INK, 3);
    s += P("M132,384 l-4,-26 M144,384 l2,-30 M156,384 l6,-24", "none", INK, 7) + P("M132,384 l-4,-26 M144,384 l2,-30 M156,384 l6,-24", "none", "#e3b23a", 4);
    s += '<text x="146" y="410" text-anchor="middle" font-family="Bangers, sans-serif" font-size="15" letter-spacing="1" fill="#9a3a30" opacity=".75">#1 DAD</text>';
    s += P("M131,392 l6,4 M160,400 l3,6", "none", "#9c9076", 1.5);
    /* the chip, leaning on the mug, catching the bulb */
    s += ell(222, 424, 40, 6, "#2a1a08", 0, 'opacity=".45"');
    s += '<g transform="rotate(-8 222 388)">' + circ(222, 388, 34, "#b98238", 3.5) + circ(222, 388, 26, "none", 0, 'stroke="#7a4a1a" stroke-width="2.4"') +
      P("M222,368 L242,402 H202Z", "none", "#5a3010", 3) + R.sfx("9", 222, 398, 22, { anchor: "middle", fill: "#5a3010", stroke: "#e8c07a", sw: 1 }) +
      P("M199,372 C206,362 220,358 232,360", "none", "#ffe9b0", 3, 'opacity=".85"') +
      R.tone(k, "M222,422 A34,34 0 0 1 188,388 A34,34 0 0 0 222,412Z", .4) + "</g>";
    s += P("M258,356 l8,-8 M262,370 l10,-2 M250,348 l2,-10", "none", "#fff6d2", 2.2);                      /* glint */
    /* thermos, dented */
    s += P("M312,424 V322 C312,312 356,312 356,322 V424Z", "#3d6a5a", INK, 3) + P("M308,322 H360 V302 H308Z", "#9c9586", INK, 3);
    s += P("M324,360 c8,10 6,22 -2,26", "none", INK, 2) + R.tone(k, "M338,322 H356 V424 H338Z", .35);

    s += "</g>";
    /* ---------- under the shelf: in shadow ---------- */
    s += P("M0,502 H400 V600 H0Z", "#1e160e", null, 0, 'opacity=".6"');
    s += P("M262,600 L272,548 H362 L372,600Z", "#7a6224", INK, 3) + P("M266,548 H368", "none", INK, 5);   /* mop bucket, in shadow */
    s += P("M240,600 L300,504", "none", INK, 9) + P("M240,600 L300,504", "none", "#6a5034", 5);           /* mop handle */
    s += P("M40,600 V560 C40,544 74,544 74,560 V600Z", "#2d4a6a", INK, 3) + P("M52,544 V530 H66 L78,536 V542 H62 V544Z", "#a8a090", INK, 2);
    s += R.vignette(k, 400, 600, .75);
    return s;
    function mix(a, b, t) { return R.mix(a, b, t); }
  }
});
