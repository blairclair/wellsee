/* p21: SPLASH. Night. Rusty waits in his good suit, facing the door. It bursts inward: carnival light,
   one of the Unwilling stooping through the frame, rabbit-things crowding the hall behind.
   Span 6, viewBox 1200x800, mood lurid, wear 0. */
RUSTY.panel({
  id: "p21", w: 1200, h: 800,
  alt: "Midnight in Rusty's small apartment. He sits upright in a kitchen chair in his good brown suit, hands on his knees, facing the door, which has burst inward off its chain. Red and gold carnival light floods in. A clown too tall for the doorway stoops through it, one long white glove clamped around the doorframe, the other arm reaching across the room, its shadow already stretching over the floor to Rusty's shoes. Behind it, rabbit-things with glowing red eyes crowd the hallway, one after another into the light. On the table beside Rusty lie the two torn halves of his ticket and the knife he carved the rabbit with.",
  captions: [{ at: "tl", text: "He didn't run. He was already wearing his good suit.", w: 30 }],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 34, y: 4, w: 34, tail: [60, 20], text: "YOU <em>REFUSED</em> US, RUSSELL." },
    { kind: "speech", who: "Rusty", x: 3, y: 33, w: 12, tail: [20, 42], text: "Yeah." },
    { kind: "speech", who: "Rusty", x: 4, y: 44, w: 12, tail: [21, 46], text: "I did." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var DX0 = 760, DX1 = 1000, DY0 = 104, DY1 = 600;      /* door opening */
    var VP = [890, 352];                                   /* hallway vanishing point */
    /* local defs */
    s += "<defs>" +
      '<linearGradient id="' + k.id("pool") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf6a" stop-opacity=".75"/><stop offset="1" stop-color="#f08a2a" stop-opacity=".12"/></linearGradient>' +
      '<radialGradient id="' + k.id("hall") + '" cx="50%" cy="52%" r="60%"><stop offset="0" stop-color="#fff3c0"/><stop offset=".28" stop-color="#ffb347"/><stop offset=".7" stop-color="#d2361e"/><stop offset="1" stop-color="#5a0c10"/></radialGradient>' +
      '<radialGradient id="' + k.id("room") + '" cx="74%" cy="44%" r="70%"><stop offset="0" stop-color="#6a2a1c"/><stop offset=".5" stop-color="#2c1216"/><stop offset="1" stop-color="#0e070a"/></radialGradient>' +
      '<clipPath id="' + k.id("door") + '"><path d="M' + DX0 + "," + DY0 + " H" + DX1 + " V" + DY1 + " H" + DX0 + 'Z"/></clipPath>' +
      '<filter id="' + k.id("shadow") + '"><feColorMatrix type="matrix" values="0 0 0 0 .03  0 0 0 0 .01  0 0 0 0 .02  0 0 0 .88 0"/></filter>' +
      "</defs>";

    /* ---------- the room ---------- */
    s += '<rect width="1200" height="800" fill="' + k.url("room") + '"/>';
    /* tired wallpaper: thin stripes + a little diamond print */
    var wp = ""; for (var x = 0; x < 1200; x += 46) wp += "M" + x + ",0 V600 ";
    s += P(wp, "none", "#3e1c1c", 10, 'opacity=".55"');
    var dm = ""; for (var yy = 30; yy < 590; yy += 60) for (var xx = 23 + ((yy / 60) % 2) * 23; xx < 1200; xx += 92) dm += "M" + xx + "," + (yy - 7) + " l6,7 l-6,7 l-6,-7Z ";
    s += P(dm, "#4a2420", null, 0, 'opacity=".6"');
    /* water stain + a hairline crack */
    s += '<ellipse cx="320" cy="60" rx="120" ry="44" fill="#5a3a20" opacity=".22"/>' + P("M610,0 l-8,40 l10,22 l-12,48 l6,30", "none", "#0e0608", 2.5);
    /* baseboard + floor */
    s += P("M0,600 H1200 V800 H0Z", "#221214", INK, 3);
    s += P("M0,584 H" + DX0 + " M" + DX1 + ",584 H1200", "none", "#3a201a", 18) + P("M0,594 H1200", "none", INK, 4);
    var fb = ""; for (var b = -1400; b < 2600; b += 120) fb += "M" + f(VP[0] + (b - VP[0]) * .2) + ",600 L" + b + ",800 ";
    s += P(fb, "none", "#120809", 3);
    [626, 660, 712].forEach(function (y) { s += P("M0," + y + " H1200", "none", "#170a0b", 2, 'opacity=".7"'); });

    /* calendar: every day X'd to the 14th, the 14th circled */
    s += P("M70,118 H200 V266 H70Z", "#cfc3a8", INK, 3) + P("M70,118 H200 V150 H70Z", "#6b1010", INK, 3);
    s += P("M135,104 v18", "none", INK, 3) + '<circle cx="135" cy="104" r="4" fill="' + INK + '"/>';
    var cal = "";
    for (var ci = 0; ci < 17; ci++) {
      var cx = 82 + (ci % 6) * 19, cy = 160 + Math.floor(ci / 6) * 30;
      if (ci < 13) cal += "M" + cx + "," + cy + " l12,14 M" + (cx + 12) + "," + cy + " l-12,14 ";
      else if (ci > 13) cal += "M" + (cx + 2) + "," + (cy + 7) + " h8 ";
    }
    s += P(cal, "none", "#3a0a0a", 2);
    s += '<ellipse cx="' + (82 + 1 * 19 + 6) + '" cy="' + (160 + 2 * 30 + 7) + '" rx="14" ry="12" fill="none" stroke="#c0221b" stroke-width="3"/>';
    /* framed photo of Carol, crooked */
    s += '<g transform="rotate(-4 300 200)">' + P("M262,160 H338 V250 H262Z", "#4a2c18", INK, 3) + P("M272,170 H328 V240 H272Z", "#b9a27e", INK, 2) +
      P("M300,184 c-14,0 -16,24 -14,34 c2,8 26,8 28,0 c2,-10 0,-34 -14,-34Z", "#7a4428", null, 0, 'opacity=".75"') +
      P("M284,240 c2,-14 30,-14 32,0Z", "#5a3a2a", null, 0, 'opacity=".75"') + "</g>";
    /* clock: midnight on the nose */
    s += '<circle cx="520" cy="150" r="46" fill="#d8cfb8" stroke="' + INK + '" stroke-width="5"/>';
    var tk = ""; for (var h = 0; h < 12; h++) { var a = h * Math.PI / 6; tk += "M" + f(520 + Math.sin(a) * 36) + "," + f(150 - Math.cos(a) * 36) + " L" + f(520 + Math.sin(a) * 42) + "," + f(150 - Math.cos(a) * 42) + " "; }
    s += P(tk, "none", INK, 3) + P("M520,150 V114 M520,150 V124", "none", INK, 5) + '<circle cx="520" cy="150" r="4" fill="' + INK + '"/>';
    /* bare bulb, switched off: the only light is theirs */
    s += P("M620,0 V62", "none", INK, 2.5) + P("M612,62 h16 v10 h-16Z", "#4a4038", INK, 2) + '<circle cx="620" cy="84" r="13" fill="#3a3226" stroke="' + INK + '" stroke-width="2.5"/>';

    /* ---------- the hallway, seen through the door ---------- */
    var hall = '<rect x="' + DX0 + '" y="' + DY0 + '" width="' + (DX1 - DX0) + '" height="' + (DY1 - DY0) + '" fill="' + k.url("hall") + '"/>';
    var FX0 = 852, FX1 = 928, FY0 = 300, FY1 = 412;          /* the far end */
    hall += P("M" + DX0 + "," + DY0 + " L" + FX0 + "," + FY0 + " L" + FX0 + "," + FY1 + " L" + DX0 + "," + DY1 + "Z", "#8a2418", INK, 2, 'opacity=".75"');
    hall += P("M" + DX1 + "," + DY0 + " L" + FX1 + "," + FY0 + " L" + FX1 + "," + FY1 + " L" + DX1 + "," + DY1 + "Z", "#5a1418", INK, 2, 'opacity=".8"');
    hall += P("M" + DX0 + "," + DY1 + " L" + FX0 + "," + FY1 + " L" + FX1 + "," + FY1 + " L" + DX1 + "," + DY1 + "Z", "#c9692a", INK, 2);
    hall += P("M" + DX0 + "," + DY0 + " L" + FX0 + "," + FY0 + " L" + FX1 + "," + FY0 + " L" + DX1 + "," + DY0 + "Z", "#3a0c10", INK, 2);
    /* the far door wide open on carnival light */
    hall += '<rect x="' + FX0 + '" y="' + FY0 + '" width="' + (FX1 - FX0) + '" height="' + (FY1 - FY0) + '" fill="#fff3c0"/>';
    hall += R.rays(890, 360, 28, 260, "#fff1b0", .28, 360, 0);
    /* side doors receding */
    [[.25], [.55]].forEach(function (d) {
      var t = d[0], lx = DX0 + (FX0 - DX0) * t, ly0 = DY0 + (FY0 - DY0) * t, ly1 = DY1 + (FY1 - DY1) * t, t2 = t + .12;
      var lx2 = DX0 + (FX0 - DX0) * t2, ly02 = DY0 + (FY0 - DY0) * t2, ly12 = DY1 + (FY1 - DY1) * t2;
      hall += P("M" + f(lx) + "," + f(ly0 + (ly1 - ly0) * .3) + " L" + f(lx2) + "," + f(ly02 + (ly12 - ly02) * .3) + " L" + f(lx2) + "," + f(ly12) + " L" + f(lx) + "," + f(ly1) + "Z", "#3a0c0c", INK, 2);
    });
    /* hanging bulbs down the hall, all burning */
    [[.18, 7], [.42, 5], [.66, 3.4]].forEach(function (b) {
      var t = b[0], bx = 880 + (890 - 880) * t, by = DY0 + (FY0 - DY0) * t + 30 * (1 - t);
      hall += P("M" + f(bx) + "," + f(DY0 + (FY0 - DY0) * t) + " V" + f(by), "none", INK, 1.5) + R.glow(k, bx, by + b[1], b[1] * 8, .8) + '<circle cx="' + f(bx) + '" cy="' + f(by + b[1]) + '" r="' + b[1] + '" fill="#fffbe0" stroke="' + INK + '" stroke-width="1.5"/>';
    });
    /* rabbit-things crowding the hall: three depths, backlit to silhouettes, eyes lit */
    hall += R.monsterRabbit(k, { x: 912, y: 414, s: .17, flip: -1, fur: "#1c0b0e" });
    hall += R.monsterRabbit(k, { x: 862, y: 418, s: .2, fur: "#1c0b0e" });
    hall += R.monsterRabbit(k, { x: 958, y: 486, s: .34, flip: -1, fur: "#210c10" });
    hall += R.monsterRabbit(k, { x: 800, y: 500, s: .38, fur: "#210c10", blood: true });
    hall += R.monsterRabbit(k, { x: 1010, y: 610, s: .62, flip: -1, fur: "#2a1014", blood: true });
    hall += '<rect x="' + DX0 + '" y="' + DY0 + '" width="' + (DX1 - DX0) + '" height="' + (DY1 - DY0) + '" fill="' + k.url("dotsR") + '" opacity=".22"/>';
    s += '<g clip-path="' + k.url("door") + '">' + hall + "</g>";

    /* light thrown into the room: a pool across the floor, wedges on the walls */
    s += P("M" + DX0 + ",600 L" + DX1 + ",600 L1200,700 L1200,800 L120,800Z", k.url("pool"), null, 0, 'opacity=".8"');
    s += P("M" + DX0 + "," + DY0 + " L560,0 L1200,0 L" + DX1 + "," + DY0 + "Z", "#ffb347", null, 0, 'opacity=".12"');
    s += R.glow(k, 880, 360, 560, .55, true);

    /* the Unwilling's shadow, cast down the light toward Rusty's shoes */
    var PX = 905, PY = 606, PS = 1.06, LEAN = 30;
    var shadowArms = [[[-40, -415], [-120, -320], [-200, -380]], [[40, -415], [110, -400], [262, -330]]];
    s += '<g filter="url(#' + k.id("shadow") + ')"><g transform="translate(' + PX + "," + PY + ') matrix(-1,0,1.18,-.33,0,0)">' +
      R.player(k, { x: 0, y: 0, s: PS, lean: 24, arms: shadowArms, legs: [[[-18, -258], [-40, -130], [-30, -14]], [[18, -258], [10, -130], [36, -14]]] }) + "</g></g>";
    /* door frame: casing + splintered strike side */
    var casing = "M" + (DX0 - 22) + "," + (DY0 - 22) + " H" + (DX1 + 22) + " V" + DY1 + " H" + DX1 + " V" + DY0 + " H" + DX0 + " V" + DY1 + " H" + (DX0 - 22) + "Z";
    s += P(casing, "#4a2a1c", INK, 4) + R.tone(k, "M" + (DX0 - 22) + "," + (DY0 - 22) + " H" + DX0 + " V" + DY1 + " H" + (DX0 - 22) + "Z", .45);
    s += P("M" + (DX0 - 22) + "," + (DY0 - 10) + " H" + (DX1 + 22), "none", "#7a4a2a", 3);
    s += P("M" + DX0 + ",332 l-30,-16 l20,10 l-34,-4 l30,14 M" + DX0 + ",352 l-40,6 l34,2 l-26,10 l32,-6", "#c79a62", INK, 2);
    s += P("M" + (DX0 - 18) + ",330 h14 v30 h-14Z", "#8a8478", INK, 2);           /* torn-out strike plate */
    /* the door itself: burst inward off its hinges, swinging into the room */
    s += P("M" + DX1 + "," + (DY0 + 2) + " L1188,58 L1196,760 L" + DX1 + "," + (DY1 - 4) + "Z", "#3e2418", INK, 5);
    s += P("M1022,150 L1166,96 L1170,340 L1024,346Z M1024,380 L1170,384 L1176,690 L1026,560Z", "none", "#24120c", 5);
    s += R.tone(k, "M" + DX1 + "," + (DY0 + 2) + " L1188,58 L1196,760 L" + DX1 + "," + (DY1 - 4) + "Z", .4, true);
    s += P("M1006,120 L1032,108", "none", "#c9a23a", 6);                         /* hinge sheared */
    s += '<circle cx="1150" cy="370" r="11" fill="#c9a23a" stroke="' + INK + '" stroke-width="2.5"/>';
    s += P("M1148,388 C1120,430 1132,470 1112,500", "none", "#9c9586", 3, 'stroke-dasharray="5 3"');   /* snapped chain */
    s += P("M1188,58 l-14,-24 l20,10 M1196,760 l-26,10 l20,8", "#a07a4a", INK, 2);
    /* splinters in the air */
    s += P("M700,262 l-26,-6 l24,-4Z M672,410 l-30,8 l28,4Z M716,470 l-18,-14 l22,6Z M640,330 l-16,2 l14,6Z", "#c79a62", INK, 2);
    s += R.sfx("KRAKK", 1108, 236, 70, { anchor: "middle", fill: "#f6d27a", rot: 12, sw: 7 });

    /* ---------- the Unwilling, stooping in under the lintel ---------- */
    function toLocal(wx, wy) {
      var lx = (wx - PX) / (-PS), ly = (wy - PY) / PS;
      return R.rot([lx, ly], -LEAN, [0, -258]);
    }
    /* far arm: up from the shoulder to the lintel he has to duck under (drawn first, so the body overlaps it) */
    var shF = R.rot([40, -415], LEAN, [0, -258]), shW = [PX - shF[0] * PS, PY + shF[1] * PS];
    s += R.limb([shW, [990, 250], [932, 196]], 19, "#d8cdb4", 4);
    /* near arm: out across the room toward him, fingers spread */
    var reach = [toLocal(858, 196), toLocal(700, 300), toLocal(600, 352)];
    s += R.player(k, { x: PX, y: PY, s: PS, flip: -1, variant: 0, lean: LEAN, headTilt: -14, glow: "#fff1a0", grin: 1,
      arms: [reach, reach], legs: [[[-18, -258], [-26, -130], [-34, -14]], [[18, -258], [30, -132], [48, -14]]] });

    /* the gloved hand clamped over the lintel: back of the glove toward us, cuff at the wrist, three
       stitched seams, four long fingers of unequal length hooked over the top edge, fanned and overlapping */
    function grip(gx, gy, sc, rotd) {
      var g = "", sk = "#efe9da", sd = "#bcb3a0";
      /* local y=0 is the top edge of the lintel; the fingers lie over its face and hook out of sight over the top */
      g += P("M-25,92 C-31,110 -27,126 -21,134 L23,134 C29,122 31,108 25,92 C10,86 -10,86 -25,92Z", sk, INK, 3.5) +
        P("M-25,98 C-8,104 8,104 25,98", "none", INK, 2.5);
      g += P("M-34,40 C-36,26 -20,22 0,22 C20,22 36,26 34,40 C34,62 28,82 22,94 L-22,94 C-28,82 -34,62 -34,40Z", sk, INK, 4);
      g += R.tone(k, "M14,22 C26,24 36,28 34,40 C34,62 28,82 22,94 L12,94 C20,72 22,46 14,22Z", .35);
      g += P("M-12,34 C-13,52 -11,70 -8,86 M0,32 C0,52 0,70 0,88 M12,34 C13,52 11,70 8,86", "none", INK, 2.2);
      /* fingers: [x at knuckle, x at top, width]; little finger lowest, middle highest, so the row is uneven */
      [[-27, -30, 14, 4], [27, 31, 14, 2], [-9, -11, 17, -5], [9, 10, 16, -3]].forEach(function (q) {
        g += R.limb([[q[0], 30], [q[1], q[3]]], q[2], sk, 3.5);
        g += P("M" + f(q[0] - q[2] / 2 + 2) + ",18 q" + f(q[2] / 2 - 2) + ",4 " + f(q[2] - 4) + ",0", "none", sd, 2.2);
      });
      return '<g transform="translate(' + gx + "," + gy + ") rotate(" + rotd + ") scale(" + sc + ')">' + g + "</g>";
    }
    s += grip(930, 88, .85, -4);
    /* the head-cap moulding over the casing: the fingertips hook in behind it */
    s += P("M" + (DX0 - 34) + ",72 H" + (DX1 + 34) + " L" + (DX1 + 26) + ",90 H" + (DX0 - 26) + "Z", "#5a3422", INK, 4);
    s += P("M906,90 c4,6 10,8 16,6 M926,88 c4,8 12,10 18,6 M946,90 c4,6 10,6 14,4", "none", INK, 2.5);
    /* splinters where it grips */
    s += P("M884,80 l-14,-16 l18,8Z M968,82 l14,-18 l-4,20Z", "#c79a62", INK, 2);

    /* ---------- Rusty, waiting ---------- */
    /* a little table: coffee gone cold, the carving knife, curls of shaving, the torn ticket */
    s += P("M18,560 H170 V578 H18Z", "#4a2c1c", INK, 3.5) + P("M30,578 V800 M158,578 V800", "none", INK, 13) + P("M30,578 V800 M158,578 V800", "none", "#3a2016", 7);
    s += P("M40,520 h34 v38 c0,6 -34,6 -34,0Z", "#d8cfb8", INK, 3) + P("M74,530 c14,0 14,20 0,20", "none", INK, 3);
    s += P("M92,552 l44,-6 l4,6 l-44,8Z", "#9c9a92", INK, 2) + P("M84,560 l12,-6 l2,6Z", "#3a2016", INK, 2);
    s += P("M118,556 c6,-10 16,-4 10,4 M136,558 c4,-8 14,-2 8,2 M60,562 c4,-8 14,-4 8,2", "none", "#d9b07a", 3);
    s += '<g transform="rotate(-14 108 540)">' + P("M88,530 h22 l-3,6 l3,6 l-3,6 l3,6 h-22Z", "#a3171c", INK, 2) + "</g>" +
      '<g transform="rotate(10 140 534)">' + P("M128,524 h24 v24 h-24 l3,-6 l-3,-6 l3,-6Z", "#a3171c", INK, 2) + "</g>";
    /* the chair */
    s += P("M234,800 L244,566 L262,566 L256,800 M376,800 l6,-216 M300,800 l2,-210", "none", INK, 14) + P("M234,800 L244,566 L262,566 L256,800 M376,800 l6,-216 M300,800 l2,-210", "none", "#3a2016", 8);
    s += P("M226,566 L238,350 L266,350 L262,566Z", "#3a2016", INK, 4);
    /* Rusty: upright, hands on his knees, lit from the door */
    s += R.person(k, { x: 290, y: 790, s: 1.28, pose: "sit", outfit: "suit", expr: "resigned", turn: .55, light: 1, look: 1, stoop: -4 });
    /* lurid wash + vignette */
    s += '<rect width="1200" height="800" fill="#c0221b" style="mix-blend-mode:multiply" opacity=".22"/>';
    s += R.vignette(k, 1200, 800, .9);
    return s;
  }
});
