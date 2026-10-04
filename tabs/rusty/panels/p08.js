/* p08: Night. Rusty's one-room apartment, one lamp. Carving the wooden rabbit. Suit on the door, Saturday circled.
   Span 6, viewBox 1200x600, mood night, wear 0. */
RUSTY.panel({
  id: "p08", w: 1200, h: 600,
  alt: "Night in Rusty's one-room apartment. Under a single lamp, he sits at a kitchen table whittling a small wooden rabbit with a pocketknife, shavings everywhere. On the wall, a calendar with Saturday the 14th circled in red. His one good brown suit hangs pressed on the door, the price tag still on the tie.",
  captions: [{ at: "tl", text: "He spent four nights on it. He'd never made anything for anyone.", w: 40 }],
  balloons: [
    { kind: "thought", who: "Rusty, thinking", x: 4, y: 40, w: 24, tail: [27, 40], text: "Don't you mess this up, Russ. Not this one." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="1200" height="600" fill="#1c2230"/>';
    /* wallpaper stripes */
    var st = ""; for (var x = 0; x < 1200; x += 40) st += "M" + x + ",0 V470 ";
    s += P(st, "none", "#232a3a", 14);
    s += '<rect y="470" width="1200" height="130" fill="#2a2220"/>' + P("M0,470 H1200", "none", INK, 3);
    /* window, night, distant red glow on the hills */
    s += P("M90,90 H300 V330 H90Z", "#0c0f1a", INK, 6);
    s += '<rect x="96" y="250" width="198" height="74" fill="#3a0e10" opacity=".7"/>' + R.glow(k, 230, 300, 70, .7, true);
    s += P("M96,290 C140,270 200,276 294,262 V324 H96Z", "#08080c");
    s += P("M195,90 V330 M90,210 H300", "none", INK, 6);
    [[130, 130], [250, 120], [160, 180], [270, 170]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="#efe9da"/>'; });
    /* calendar */
    s += P("M340,110 H460 V250 H340Z", "#efe9da", INK, 3) + P("M340,110 H460 V140 H340Z", "#8b1414", INK, 3);
    s += '<text x="400" y="132" text-anchor="middle" font-family="Bangers, sans-serif" font-size="18" fill="#efe9da">NOVEMBER</text>';
    var cal = ""; for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) cal += '<rect x="' + (348 + c * 18) + '" y="' + (150 + r * 24) + '" width="14" height="18" fill="none" stroke="#9c8f78" stroke-width="1"/>';
    s += cal + '<ellipse cx="373" cy="183" rx="15" ry="13" fill="none" stroke="#c0221b" stroke-width="3.5"/>';
    s += P("M352,174 l6,8 l-6,8 M370,166 l4,10", "none", INK, 1.4, 'opacity=".7"');   /* X's through the days before */
    /* lamp glow */
    s += R.glow(k, 800, 330, 520, .55) + R.glow(k, 800, 330, 200, .6);
    /* door with suit hanging */
    s += P("M960,40 H1160 V470 H960Z", "#4a3428", INK, 4) + '<circle cx="980" cy="270" r="7" fill="#c9a23a" stroke="' + INK + '" stroke-width="2"/>';
    s += P("M1060,70 l-8,16 h16Z", "none", "#9c9586", 3);
    s += P("M1000,110 C1030,92 1090,92 1120,110 L1128,330 H992Z", "#6c4f37", INK, 4);
    s += P("M1044,100 L1060,180 L1076,100", "#efe8d8", INK, 2.5) + P("M1056,104 h8 l3,60 l-7,12 l-7,-12Z", "#7a1f24", INK, 2);
    s += P("M1036,100 L1052,190 L1044,250 M1084,100 L1068,190 L1076,250", "none", INK, 2.5);
    s += P("M1067,150 l30,24", "none", "#c9c0ae", 1.5) + '<rect x="1090" y="168" width="26" height="16" fill="#efe9da" stroke="' + INK + '" stroke-width="1.5" transform="rotate(30 1103 176)"/>' +
      '<text x="1103" y="180" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="10" fill="#a3171c" transform="rotate(30 1103 176)">$4.99</text>';
    /* Rusty seated, carving */
    var carvePose = { dy: 35, legs: [[[-12, -150], [66, -150], [64, -8]], [[14, -150], [86, -146], [86, -8]]],
      arms: [[[-46, -263], [0, -190], [70, -176]], [[46, -263], [100, -210], [98, -182]]], stoop: 10 };
    s += P("M430,560 L440,380 L460,380 L452,560 M372,560 l4,-90", "none", "#3a2a20", 10);   /* chair */
    s += R.person(k, { x: 450, y: 560, s: 1.02, pose: carvePose, outfit: "work", expr: "tender", turn: .45, light: 1, look: 1, headTilt: 8 });
    /* table */
    s += P("M500,402 H1000 V424 H500Z", "#6a4a30", INK, 4) + P("M520,424 V600 M980,424 V600", "none", "#4a3424", 16);
    s += R.tone(k, "M500,412 H1000 V424 H500Z", .4);
    /* lamp */
    s += P("M780,402 L790,330 H810 L820,402Z", "#4a4a44", INK, 3) + P("M740,330 L770,250 H830 L860,330Z", "#c9a86a", INK, 3);
    s += P("M740,330 L860,330 L920,402 L680,402Z", "#ffe9a8", null, 0, 'opacity=".2"');
    /* rabbit in progress, knife, shavings */
    s += R.woodRabbit(k, { x: 548, y: 398, s: .55 });
    s += P("M580,360 l40,-30 l6,6 l-38,32Z", "#c9c9c0", INK, 2) + P("M574,366 l10,-8 l6,8 l-10,8Z", "#5a3a2a", INK, 2);
    var sh = ""; [[600, 396], [640, 398], [700, 394], [660, 400], [720, 398], [560, 380], [610, 380], [740, 396]].forEach(function (p, i) {
      sh += "M" + p[0] + "," + p[1] + " c6,-8 14,-6 12,2 c-2,4 -8,2 -6,-2 ";
    });
    s += P(sh, "none", "#d9a86a", 3);
    s += P("M610,470 c8,-6 14,-2 10,4 M700,520 c8,-6 14,-2 10,4 M560,540 c8,-6 14,-2 10,4", "none", "#d9a86a", 3);
    /* coffee mug, not a bottle */
    s += P("M880,402 V360 H920 V402Z", "#efe9da", INK, 3) + P("M920,370 c14,0 14,22 0,22", "none", INK, 3) + P("M890,350 c-4,-10 6,-14 2,-24 M906,350 c-4,-10 6,-14 2,-24", "none", "#c9c0ae", 2, 'opacity=".7"');
    s += R.vignette(k, 1200, 600, .9);
    return s;
  }
});
