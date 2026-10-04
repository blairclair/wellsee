/* p27: FINAL SPLASH. Rusty, grey and resigned, beside an overlarge EMPLOYEE OF THE MONTH trophy.
   Owner: see ARCHITECTURE.md. Span 6, viewBox 1200x1000, mood grey, wear 1.0. */
RUSTY.panel({
  id: "p27", w: 1200, h: 1000, phoneStrip: true,   /* on phones the clown balloon goes under the art, off the plaque and ladder */
  alt: "On an empty carnival stage after closing, among confetti, popcorn and smeared blood, Rusty, grey, stooped and wearing his filthy tie, leans on his mop beside a towering gold trophy topped with a grinning clown figurine. Its plaque reads EMPLOYEE OF THE MONTH and lists RUSTY for every month, and a paper scroll of more months unrolls past his feet and off the stage. Footprints from long clown shoes track through the blood into the wings, a stepladder leans against the cup for polishing it, and his own face shows small and bent in the gold. White-gloved hands clap from off-stage.",
  captions: [
    { at: "tl", text: "Every month.", w: 34 },
    { at: "br", text: "Forever.", w: 30 }
  ],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 73, y: 62, w: 26, tail: [93, 54], text: "Smile, Rusty. It's <em>always</em> your month." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    function rnd(i) { var x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); }
    /* panel-local defs */
    s += '<defs>' +
      '<linearGradient id="' + k.id("gold") + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6a4410"/><stop offset=".22" stop-color="#c9952e"/><stop offset=".4" stop-color="#fff1b8"/><stop offset=".55" stop-color="#f6d27a"/><stop offset=".8" stop-color="#b07c22"/><stop offset="1" stop-color="#4f320a"/></linearGradient>' +
      '<linearGradient id="' + k.id("goldV") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".5" stop-color="#d9a640"/><stop offset="1" stop-color="#7a5418"/></linearGradient>' +
      '<linearGradient id="' + k.id("cone") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".22"/><stop offset="1" stop-color="#fff6d8" stop-opacity=".06"/></linearGradient>' +
      '<radialGradient id="' + k.id("dark") + '" cx="47%" cy="62%" r="62%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".82"/></radialGradient>' +
      '<filter id="' + k.id("goldf") + '"><feColorMatrix type="matrix" values="0.36 0.7 0.13 0 0.22  0.28 0.55 0.1 0 0.12  0.1 0.2 0.04 0 0.0  0 0 0 1 0"/></filter>' +
      '<path id="' + k.id("scroll") + '" d="M-40,990 C120,972 250,1000 380,986 C470,976 560,962 612,905"/>' +
      "</defs>";
    /* back wall + dead bulbs */
    s += '<rect width="1200" height="1000" fill="#18171a"/>';
    s += R.tone(k, "M0,0 H1200 V640 H0Z", .25, true);
    s += R.bulbWire(k, [-20, 150], [1220, 130], 46, 18, { dead: 1, glow: false, color: "#5a5040" });
    s += R.glow(k, 955, 196, 40, .7) + '<circle cx="955" cy="196" r="4" fill="#ffe9a8"/>';
    /* curtains */
    function drape(x0, x1, flip) {
      var d = "M" + x0 + ",0 L" + x1 + ",0 C" + (x1 - flip * 30) + ",300 " + (x1 + flip * 20) + ",520 " + (x1 - flip * 60) + ",660 L" + x0 + ",660Z", f = "";
      for (var i = 1; i < 6; i++) { var xx = x0 + (x1 - x0) * i / 6; f += "M" + xx + ",0 C" + (xx + 14) + ",240 " + (xx - 12) + ",460 " + (xx + 4) + ",660 "; }
      return P(d, "#3b1216", INK, 4) + P(f, "none", "#1c0709", 7) + R.tone(k, d, .35);
    }
    s += drape(0, 230, 1) + drape(1200, 990, -1);
    var val = "M0,0 H1200 V58 ";
    for (var v = 1200; v >= 0; v -= 75) val += "Q" + (v - 37) + ",104 " + (v - 75) + ",58 ";
    s += P(val + "V0Z", "#4a171c", INK, 4) + P(val.replace("M0,0 H1200 V58 ", "M1200,58 "), "none", "#7d6a3e", 3, 'stroke-dasharray="2 5"');
    /* floor boards in perspective (vanishing point 600,250) */
    s += P("M0,640 H1200 V1000 H0Z", "#2e2925", INK, 3);
    var boards = "";
    for (var xb = -900; xb <= 2100; xb += 110) boards += "M" + (600 + (xb - 600) * .52).toFixed(1) + ",640 L" + xb + ",1000 ";
    [668, 706, 760, 840, 950].forEach(function (y) { boards += "M0," + y + " H1200 "; });
    s += P(boards, "none", "#1a1614", 3);
    s += P("M0,640 H1200", "none", INK, 6);
    /* blood smears + mop arcs */
    s += P("M90,760 C160,730 300,748 330,776 C350,800 250,812 180,806 C120,800 60,790 90,760Z M760,980 C820,940 980,950 1060,980 L1060,1000 L760,1000Z M940,700 c40,-8 90,4 80,20 c-14,14 -80,10 -80,-20Z", "#5c0f12", null, 0, 'opacity=".9"');
    s += P("M1000,760 c4,30 -6,60 2,90 M1010,760 c10,24 4,50 12,70", "none", "#5c0f12", 6);
    s += P("M430,900 C520,860 650,862 700,900 M450,930 C560,890 690,896 760,940", "none", "#6c625a", 5, 'opacity=".35"');
    /* confetti, popcorn, teeth */
    var conf = "", cols = ["#8b1414", "#c7b37a", "#3d5a73", "#b06a2a", "#6a7a5a"];
    for (var i = 0; i < 90; i++) {
      var cx = rnd(i) * 1200, cy = 660 + rnd(i + 100) * 330;
      if (cx > 560 && cx < 900 && cy > 900) continue;
      conf += '<rect x="' + cx.toFixed(0) + '" y="' + cy.toFixed(0) + '" width="' + (6 + rnd(i + 7) * 8).toFixed(0) + '" height="5" fill="' + cols[i % 5] + '" opacity=".75" transform="rotate(' + (rnd(i + 9) * 180).toFixed(0) + " " + cx.toFixed(0) + " " + cy.toFixed(0) + ')"/>';
    }
    for (var j = 0; j < 26; j++) {
      var px = 40 + rnd(j + 300) * 1120, py = 690 + rnd(j + 400) * 290;
      conf += '<g fill="#e9dfc4" stroke="' + INK + '" stroke-width="1.5"><circle cx="' + px.toFixed(0) + '" cy="' + py.toFixed(0) + '" r="6"/><circle cx="' + (px + 6).toFixed(0) + '" cy="' + (py - 3).toFixed(0) + '" r="5"/></g>';
    }
    conf += P("M260,792 l5,-9 l5,9Z M282,800 l4,-8 l4,8Z M300,790 l5,-10 l5,10Z", "#efe9da", INK, 1.5);
    s += conf;
    /* deflated balloon */
    s += P("M1080,880 C1050,860 1060,830 1090,836 C1120,842 1124,872 1096,884Z", "#7a1414", INK, 3) + P("M1094,884 C1080,920 1110,940 1086,980", "none", "#ccc", 2);
    /* their shoe prints, long and flat, tracked through the blood and off into the wings */
    [[930, 990, -8], [990, 925, -14], [1032, 968, -10], [1084, 902, -18], [1120, 950, -12], [1170, 884, -20]].forEach(function (q, i) {
      s += '<g transform="rotate(' + q[2] + " " + q[0] + " " + q[1] + ')" opacity="' + (.85 - i * .1) + '"><ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="40" ry="11" fill="#7a161a"/>' +
        '<ellipse cx="' + (q[0] - 22) + '" cy="' + q[1] + '" rx="12" ry="7" fill="#2e2925" opacity=".6"/></g>';
    });
    /* spotlight cone */
    s += P("M470,-10 L640,-10 L1040,1000 L80,1000Z", k.url("cone"));
    s += '<ellipse cx="560" cy="955" rx="470" ry="56" fill="#fff6d8" opacity=".08"/>';
    /* shadows */
    s += '<ellipse cx="350" cy="958" rx="150" ry="20" fill="#000" opacity=".55"/><ellipse cx="732" cy="968" rx="230" ry="22" fill="#000" opacity=".6"/>';
    /* the scroll of months, unrolling past Rusty's feet */
    s += R.limb([[-40, 990], [120, 980], [250, 994], [380, 986], [470, 976], [560, 950], [612, 905]], 30, "#e5d8b2", 3);
    s += '<text font-family="IM Fell English SC, Georgia, serif" font-size="17" fill="#3a2a14" dy="6"><textPath href="#' + k.id("scroll") + '" startOffset="100%" text-anchor="end">RUSTY · JUNE · RUSTY · JULY · RUSTY · AUGUST · RUSTY · SEPTEMBER · RUSTY · OCTOBER · RUSTY · NOVEMBER · RUSTY · DECEMBER · RUSTY · JANUARY · RUSTY · FEB</textPath></text>';
    /* bucket of red water, with the popsicle-stick rabbit on its rim */
    s += R.bucket(k, { x: 150, y: 962, s: 1.35, water: "#6a1012" });
    s += R.woodRabbit(k, { x: 176, y: 866, s: .62, color: "#d9c08c", flip: -1 });
    /* RUSTY */
    s += R.person(k, { x: 345, y: 950, s: 1.45, pose: "lean", outfit: "eternal", wear: 1, expr: "resigned", turn: .12, stoop: -6, headTilt: 4, light: 1, glint: false });
    s += R.glow(k, 560, 560, 300, .28);
    /* ---------- THE TROPHY ---------- */
    var G = k.url("gold"), t = "";
    /* pedestal */
    t += P("M540,935 H920 V968 H540Z", G, INK, 4);
    t += P("M572,575 H888 V935 H572Z", "#151113", INK, 4);
    t += P("M582,585 H878 V925 H582Z", "none", "#8a6a2a", 2);
    t += P("M552,548 H908 V580 H552Z", G, INK, 4);
    /* marquee bulbs round the plaque, a couple long dead */
    var mq = [], bi;
    for (bi = 0; bi < 9; bi++) mq.push([587 + bi * 35.75, 590]);
    for (bi = 1; bi < 10; bi++) mq.push([873, 590 + bi * 33.3]);
    for (bi = 8; bi >= 0; bi--) mq.push([587 + bi * 35.75, 923]);
    for (bi = 9; bi > 0; bi--) mq.push([587, 590 + bi * 33.3]);
    mq.forEach(function (q, i) {
      var dead = i === 7 || i === 22 || i === 31;
      if (!dead) t += R.glow(k, q[0], q[1], 22, .55);
      t += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="6" fill="' + (dead ? "#3a3026" : "#fff1b8") + '" stroke="' + INK + '" stroke-width="1.6"/>';
    });
    /* plaque */
    t += P("M602,605 H858 V912 H602Z", "#d8b25a", INK, 3.5);
    t += P("M612,615 H848 V902 H612Z", "none", "#7a5418", 2);
    t += R.sfx("EMPLOYEE", 730, 672, 62, { anchor: "middle", fill: "#3a2408", stroke: "#f6e2a0", sw: 2.5, ls: 2, extra: 'textLength="228" lengthAdjust="spacingAndGlyphs"' });
    t += R.sfx("OF THE MONTH", 730, 720, 42, { anchor: "middle", fill: "#3a2408", stroke: "#f6e2a0", sw: 2, ls: 1.5, extra: 'textLength="228" lengthAdjust="spacingAndGlyphs"' });
    t += P("M630,732 H830", "none", "#7a5418", 3);
    ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY"].forEach(function (m, i) {
      var y = 760 + i * 22;
      t += '<text x="624" y="' + y + '" font-family="IM Fell English SC, Georgia, serif" font-size="18" fill="#4a3010">RUSTY</text>' +
        '<text x="838" y="' + y + '" text-anchor="end" font-family="IM Fell English SC, Georgia, serif" font-size="18" fill="#4a3010">' + m + "</text>" +
        P("M690," + (y - 5) + " H" + (790 - m.length * 4), "none", "#7a5418", 1.6, 'stroke-dasharray="1 5"');
    });
    t += P("M602,905 C596,925 610,935 622,928", "#e5d8b2", INK, 2);
    /* stem + knot */
    t += P("M690,548 C700,510 708,474 700,440 L760,440 C752,474 760,510 770,548Z", G, INK, 4);
    t += '<ellipse cx="730" cy="486" rx="46" ry="17" fill="' + G + '" stroke="' + INK + '" stroke-width="4"/>';
    /* handles (behind bowl) */
    t += R.limb([[574, 236], [500, 228], [474, 300], [530, 356], [612, 352]], 18, "#d9a640", 4);
    t += R.limb([[886, 236], [960, 228], [986, 300], [930, 356], [848, 352]], 18, "#b07c22", 4);
    /* bowl */
    t += P("M556,210 C560,336 640,430 730,442 C820,430 900,336 904,210Z", G, INK, 5);
    t += '<ellipse cx="730" cy="210" rx="174" ry="24" fill="#8a5c18" stroke="' + INK + '" stroke-width="5"/>';
    t += '<defs><clipPath id="' + k.id("bowl") + '"><path d="M556,210 C560,336 640,430 730,442 C820,430 900,336 904,210Z"/></clipPath></defs>';
    t += '<g clip-path="' + k.url("bowl") + '"><g filter="url(#' + k.id("goldf") + ')" opacity=".5"><g transform="translate(596,330) skewY(-12) scale(.62,.8)">' +
      R.head(k, { x: 0, y: 0, s: 1, ch: "rusty", expr: "resigned", turn: .45, wear: 1, flip: 1 }) + '</g></g></g>';
    t += P("M612,240 C618,320 650,380 690,410", "none", "#fffbe6", 9, 'opacity=".55"');
    t += P("M700,300 l14,-30 l14,30 l32,4 l-24,20 l8,32 l-30,-16 l-30,16 l8,-32 l-24,-20Z", "#7a5418", INK, 2.5);
    t += R.sfx("No.1", 730, 400, 42, { anchor: "middle", fill: "#5a3a0c", stroke: "#f6e2a0", sw: 2 });
    /* lid + clown figurine, arms raised */
    t += P("M588,212 C600,150 860,150 872,212Z", k.url("goldV"), INK, 4);
    t += '<g filter="url(#' + k.id("goldf") + ')">' + R.player(k, {
      x: 730, y: 168, s: .25, variant: 0, grin: 1,
      arms: [[[-40, -415], [-120, -480], [-136, -590]], [[40, -415], [120, -480], [136, -590]]]
    }) + "</g>";
    /* sparkles */
    [[570, 196, 16], [884, 300, 12], [748, 30, 14], [622, 560, 10], [902, 560, 9]].forEach(function (p) {
      var x = p[0], y = p[1], r = p[2];
      t += P("M" + x + "," + (y - r) + " L" + (x + r * .25) + "," + (y - r * .25) + " L" + (x + r) + "," + y + " L" + (x + r * .25) + "," + (y + r * .25) + " L" + x + "," + (y + r) + " L" + (x - r * .25) + "," + (y + r * .25) + " L" + (x - r) + "," + y + " L" + (x - r * .25) + "," + (y - r * .25) + "Z", "#fffbe6", INK, 1.5);
    });
    s += t;
    /* the stepladder he has to climb to polish it, a rag over the top rung */
    var L0 = [[930, 972], [866, 262]], L1 = [[1004, 972], [934, 262]], rungs = "";
    for (var ri = 1; ri < 9; ri++) {
      var tt = ri / 9;
      rungs += "M" + (L0[0][0] + (L0[1][0] - L0[0][0]) * tt).toFixed(1) + "," + (L0[0][1] + (L0[1][1] - L0[0][1]) * tt).toFixed(1) +
        " L" + (L1[0][0] + (L1[1][0] - L1[0][0]) * tt).toFixed(1) + "," + (L1[0][1] + (L1[1][1] - L1[0][1]) * tt).toFixed(1) + " ";
    }
    s += P(rungs, "none", INK, 11) + P(rungs, "none", "#8a6a40", 5);
    s += R.limb(L0, 9, "#9a7848", 3.5) + R.limb(L1, 9, "#7a5a34", 3.5);
    s += P("M876,300 C900,292 930,296 944,304 L940,350 C930,344 918,352 906,346 C896,356 884,350 878,342Z", "#cfc6b0", INK, 2.5) +
      P("M890,306 l-2,38 M914,302 l-2,44", "none", "#a89a80", 2);
    /* darkness outside the spot */
    s += '<rect width="1200" height="1000" fill="' + k.url("dark") + '"/>';
    /* clapping gloves from off-panel right: white four-fingered gloves in profile, palms meeting, striped sleeves */
    function glove(x, y, a, sl) {
      var g = '<g transform="translate(' + x + "," + y + ") rotate(" + a + ')">';
      g += R.limb([[230, 30], [110, 10], [40, 0]], 26, sl, 4);
      g += P("M150,0 l0,40 M190,10 l0,40", "none", "#e4d7bd", 7, 'opacity=".8"');
      g += P("M40,-20 C56,-24 66,-14 64,0 C66,14 56,24 40,20Z", "#efe9da", INK, 4);            /* cuff */
      g += P("M44,-18 C30,-26 6,-24 -10,-18 C-34,-14 -50,-8 -52,0 C-50,8 -34,14 -10,16 C8,20 30,22 44,16Z", "#efe9da", INK, 4);
      g += P("M-46,-4 C-30,-6 -14,-6 2,-4 M-44,6 C-28,6 -12,6 4,6", "none", "#bcb3a0", 2.5);
      g += P("M18,-18 C10,-32 -6,-36 -14,-30 C-18,-24 -4,-18 6,-14", "#efe9da", INK, 3.5);     /* thumb */
      g += P("M30,-8 C24,-4 24,4 30,8", "none", INK, 2);
      return g + "</g>";
    }
    s += glove(1126, 468, -12, "#7a1b25") + glove(1134, 488, 14, "#6a1520");
    s += P("M1050,440 l-26,-14 M1046,478 l-30,0 M1050,516 l-26,14", "none", "#efe9da", 4, 'opacity=".8"');
    s += R.sfx("clap.", 960, 400, 38, { fill: "#efe9da", rot: -10 }) + R.sfx("clap.", 1010, 330, 30, { fill: "#cfc8b8", rot: 6 }) + R.sfx("clap.", 1062, 272, 24, { fill: "#a9a296", rot: -4 });
    return s;
  }
});
