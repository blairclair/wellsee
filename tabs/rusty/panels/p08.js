/* p08: Night. Rusty's one-room apartment, one lamp. Carving the wooden rabbit. Suit on the door, Saturday circled.
   Span 6, viewBox 1200x600, mood night, wear 0. */
RUSTY.panel({
  id: "p08", w: 1200, h: 600,
  alt: "Night in Rusty's one-room apartment. Under a single lamp, he sits at a kitchen table holding up a small wooden rabbit and whittling it with a pocketknife, shavings everywhere, two lumpy failed attempts beside a page of rabbit sketches. The lamp throws his hunched shadow huge across the wall behind him. On the wall, a calendar with Saturday the 14th circled in red. His one good brown suit hangs pressed on the door, the price tag still on the tie.",
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
    var fb = ""; for (var bx = -600; bx < 1800; bx += 90) fb += "M" + (600 + (bx - 600) * .55) + ",470 L" + bx + ",600 ";
    s += P(fb, "none", "#1a1412", 2.5) + P("M0,520 H1200 M0,566 H1200", "none", "#1a1412", 1.5, 'opacity=".6"');
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
    /* his shadow thrown huge across the wall by the lamp: hunched, hands raised to the work */
    s += P("M70,470 C60,400 80,330 120,290 C150,262 180,250 196,232 C186,200 190,150 226,130 C262,112 300,126 312,160 C322,190 310,222 290,240 C320,250 352,262 372,280 L420,250 C436,240 452,250 444,264 L392,312 C400,360 404,420 400,470Z", "#07080d", null, 0, 'opacity=".7"');
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
    /* the dark the lamp doesn't reach */
    s += '<defs><linearGradient id="' + k.id("dk") + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05060a" stop-opacity=".6"/><stop offset=".45" stop-color="#05060a" stop-opacity=".15"/><stop offset=".62" stop-color="#05060a" stop-opacity="0"/><stop offset=".85" stop-color="#05060a" stop-opacity=".1"/><stop offset="1" stop-color="#05060a" stop-opacity=".45"/></linearGradient></defs>';
    s += '<rect width="1200" height="600" fill="' + k.url("dk") + '"/>';
    /* Rusty seated, carving */
    var carvePose = { dy: 35, legs: [[[-12, -150], [66, -150], [64, -8]], [[14, -150], [86, -146], [86, -8]]],
      arms: [[[-46, -263], [-4, -200], [76, -236]], [[46, -263], [72, -188], [124, -204]]], stoop: 14, carry: [76, -244] };
    s += P("M430,560 L440,380 L460,380 L452,560 M372,560 l4,-90", "none", "#3a2a20", 10);   /* chair */
    var rab = R.woodRabbit(k, { x: 6, y: -4, s: .85 }) + P("M-14,-2 c6,-4 14,-4 20,0", "none", "#efcb9a", 2);   /* fresh cut, pale wood */
    s += R.person(k, { x: 450, y: 560, s: 1.02, pose: carvePose, outfit: "work", expr: "tender", turn: .45, light: 1, look: 1, headTilt: 12, carry: rab });
    /* pocketknife in the right hand, blade turned toward the rabbit; a curl of wood lifting off it */
    var kh = R.rot([124, -204], 14, [0, -150]), kx = 450 + kh[0] * 1.02, ky = 560 + kh[1] * 1.02;
    s += '<g transform="translate(' + R.f(kx) + "," + R.f(ky) + ') rotate(-160)">' + P("M0,-5 h26 l4,5 l-4,5 h-26Z", "#5a3a2a", INK, 2) + P("M28,-3 L58,-1 L54,4 L28,3Z", "#d8d8d0", INK, 2) + P("M32,-1 h18", "none", "#fff", 1.2) + "</g>";
    s += '<circle cx="' + R.f(kx) + '" cy="' + R.f(ky) + '" r="11" fill="#e2b48f" stroke="' + INK + '" stroke-width="3.2"/>' + P("M" + R.f(kx - 6) + "," + R.f(ky - 4) + " q4,4 10,2 M" + R.f(kx - 6) + "," + R.f(ky + 2) + " q4,3 10,1", "none", INK, 1.4);
    s += P("M" + R.f(kx - 40) + "," + R.f(ky - 20) + " c-6,-10 2,-18 10,-14 c6,4 0,10 -4,6", "none", "#e3b47a", 3);
    /* table */
    s += P("M500,402 H1000 V424 H500Z", "#6a4a30", INK, 4) + P("M520,424 V600 M980,424 V600", "none", "#4a3424", 16);
    s += R.tone(k, "M500,412 H1000 V424 H500Z", .4);
    /* lamp */
    s += P("M780,402 L790,330 H810 L820,402Z", "#4a4a44", INK, 3) + P("M740,330 L770,250 H830 L860,330Z", "#c9a86a", INK, 3);
    s += P("M740,330 L860,330 L920,402 L680,402Z", "#ffe9a8", null, 0, 'opacity=".2"');
    /* four nights: the ones that didn't come out right, a page of drawings, sandpaper */
    s += '<g transform="rotate(-4 700 398)">' + P("M640,402 L650,382 H760 L770,402Z", "#efe9da", INK, 2) + "</g>";
    s += P("M660,394 c4,-10 14,-12 18,-4 c2,-8 8,-8 8,0 M700,394 c4,-10 14,-12 18,-4 c2,-8 8,-8 8,0 M736,394 c4,-8 10,-10 14,-4", "none", "#5a5a6a", 1.5);
    s += P("M600,401 C598,388 606,380 618,382 C626,384 628,394 624,401Z", "#a8794a", INK, 2) + P("M612,382 l-2,-10 l6,8", "#a8794a", INK, 1.5);   /* lumpy attempt */
    s += P("M786,400 l34,-4 l2,6 l-34,4Z", "#b85a3a", INK, 1.5);
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
