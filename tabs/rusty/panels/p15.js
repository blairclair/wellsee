/* p15: Mae's Diner at 11:58. Through the window, Danny and pregnant Jess in a booth, his hand on her belly.
   Rusty, outside, presses the back of his hand flat to the glass; his breath fogs it.
   Span 3, viewBox 600x600, mood noon, wear 0. */
RUSTY.panel({
  id: "p15", w: 600, h: 600,
  alt: "Outside Mae's Diner, all chrome and pink neon, the clock in the sign reading two minutes to noon. Through the big window, warm under pendant lamps: Danny in a red booth across from his pregnant wife Jess, smiling, his hand resting on her belly. Rusty, in his good brown suit, has stepped up to the glass and laid his hand flat against it, a little fog of breath around it. His face has gone soft.",
  captions: [{ at: "tl", text: "11:58.", w: 20 }],
  balloons: [
    { kind: "thought", who: "Rusty, thinking", x: 3, y: 8, w: 33, tail: [18, 31], text: "Look at you, son." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, mix = R.mix, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6f9ab8"/><stop offset="1" stop-color="#c9dbe0"/></linearGradient>' +
      '<linearGradient id="' + k.id("chrome") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e4e4dc"/><stop offset=".5" stop-color="#b8b8b0"/><stop offset="1" stop-color="#8a8a84"/></linearGradient>' +
      '<radialGradient id="' + k.id("lamp") + '"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".95"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + k.id("win") + '"><path d="M186,166 H574 V464 H186Z"/></clipPath></defs>';
    s += '<rect width="600" height="600" fill="' + k.url("sky") + '"/>';

    /* ---------- diner body: chrome siding + red band ---------- */
    s += P("M140,40 H600 V600 H140Z", k.url("chrome"), INK, 4);
    var ch = ""; for (var y = 52; y < 600; y += 13) ch += "M140," + y + " H600 ";
    s += P(ch, "none", "#8a8a84", 2) + P(ch.replace(/M140,(\d+)/g, function (m, yy) { return "M140," + (+yy + 3); }), "none", "#f4f4ee", 1.2, 'opacity=".7"');
    s += P("M140,104 H600 V132 H140Z", "#a3171c", INK, 3) + P("M140,110 H600", "none", "#e04a4a", 2, 'opacity=".6"');
    s += R.tone(k, "M140,40 H200 V600 H140Z", .3);

    /* ---------- neon sign + clock (11:58: hour hand -1deg, minute hand -12deg) ---------- */
    s += P("M196,-10 H566 V86 H196Z", "#16141a", INK, 4);
    s += R.glow(k, 320, 50, 120, .35, true);
    s += R.sfx("MAE'S", 318, 66, 56, { anchor: "middle", fill: "#ff8ab0", stroke: "#a3175a", sw: 2, ls: 4 });
    s += P("M226,74 H410", "none", "#ff8ab0", 3, 'opacity=".7"');
    var cx = 498, cy = 38, r = 38;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r + 5) + '" fill="#c9c9c0" stroke="' + INK + '" stroke-width="4"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#efe9da" stroke="' + INK + '" stroke-width="2"/>';
    for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6, r1 = i % 3 ? 31 : 27; s += P("M" + f(cx + Math.sin(a) * r1) + "," + f(cy - Math.cos(a) * r1) + " L" + f(cx + Math.sin(a) * 35) + "," + f(cy - Math.cos(a) * 35), "none", INK, i % 3 ? 1.5 : 3); }
    var hand = function (deg, ln, w) { var a = deg * Math.PI / 180; return P("M" + cx + "," + cy + " L" + f(cx + Math.sin(a) * ln) + "," + f(cy - Math.cos(a) * ln), "none", INK, w); };
    s += hand(-1, 20, 5) + hand(-12, 31, 3) + '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#a3171c"/>';

    /* ---------- window: the warm inside ---------- */
    s += P("M178,158 H582 V472 H178Z", "#d8d8d0", INK, 5);
    var inn = '<rect x="186" y="166" width="388" height="298" fill="#6a3a26"/>';
    var pan = ""; for (var x = 196; x < 574; x += 30) pan += "M" + x + ",166 V320 ";
    inn += P(pan, "none", "#55301f", 3) + P("M186,318 H574 V328 H186Z", "#8a5a38");
    [[300, 200], [470, 200]].forEach(function (l) {
      inn += '<circle cx="' + l[0] + '" cy="' + (l[1] + 30) + '" r="120" fill="' + k.url("lamp") + '"/>' + P("M" + l[0] + ",166 V" + (l[1] - 14), "none", INK, 2) +
        P("M" + (l[0] - 22) + "," + l[1] + " L" + (l[0] - 8) + "," + (l[1] - 16) + " H" + (l[0] + 8) + " L" + (l[0] + 22) + "," + l[1] + "Z", "#2e5a4a", INK, 2.5) + '<ellipse cx="' + l[0] + '" cy="' + (l[1] + 2) + '" rx="10" ry="4" fill="#fff4cc"/>';
    });
    /* booth backs */
    inn += P("M186,318 C186,296 276,296 276,318 V464 H186Z", "#a3342c", INK, 3) + P("M484,318 C484,296 574,296 574,318 V464 H484Z", "#a3342c", INK, 3);
    inn += P("M206,320 V464 M228,316 V464 M250,320 V464 M504,320 V464 M526,316 V464 M548,320 V464", "none", "#7a221c", 3);
    inn += P("M186,340 H574 V464 H186Z", "#7a221c", null, 0, 'opacity=".25"');
    /* Jess (right, facing left) and Danny (left, facing her, his hand on her belly) */
    var DX = 372, JX = 492, BY = 530, DS = .76, JS = .74;
    var belly = [JX - 70 * JS, BY - 195 * JS], dl = [(belly[0] - DX) / DS, (belly[1] - BY) / DS];
    var reachSit = { dy: 35, legs: R.POSE.sit.legs, arms: [R.POSE.sit.arms[0], [[46, -263], [96, -222], dl]] };
    inn += R.person(k, { x: JX, y: BY, s: JS, ch: "jess", outfit: "jess", pose: "sit", expr: "smile", turn: -.45, flip: -1, light: -1 });
    inn += R.person(k, { x: DX, y: BY, s: DS, ch: "danny", outfit: "danny", pose: reachSit, expr: "smile", turn: .45, light: -1, look: .6 });
    /* table + cups */
    inn += P("M300,420 H520 L528,436 H292Z", "#efe9da", INK, 3) + P("M292,436 H528 V444 H292Z", "#b8b0a0", INK, 2) + P("M300,444 H520 V464 H300Z", "#5a2a20", INK, 2);
    inn += P("M330,422 v-18 h20 v18Z M466,422 v-16 h22 v16Z", "#efe9da", INK, 2) + '<ellipse cx="340" cy="404" rx="9" ry="2.5" fill="#4a2a14"/>';
    inn += P("M332,398 q-4,-10 2,-18 M340,396 q-4,-10 2,-18", "none", "#fff", 1.5, 'opacity=".6"');
    /* glass: sky reflection + glare streaks */
    inn += '<rect x="186" y="166" width="388" height="298" fill="#bcd4e0" opacity=".14"/>';
    inn += P("M200,166 L262,166 L186,330 L186,290Z M300,166 L326,166 L210,464 L186,464Z", "#fff", null, 0, 'opacity=".26"');
    s += '<g clip-path="' + k.url("win") + '">' + inn + "</g>";
    s += P("M178,158 H582 V472 H178Z", "none", "#f4f4ee", 3, 'transform="translate(3,3)"') + P("M186,166 H574 V464 H186Z", "none", INK, 3);
    s += P("M170,472 H590 V486 H170Z", "#c9c9c0", INK, 3);

    /* ---------- Rusty at the glass ---------- */
    var press = { legs: [[[-18, -185], [-19, -95], [-20, -8]], [[18, -185], [22, -95], [26, -8]]], arms: [[[-46, -298], [-55, -235], [-52, -172]], [[46, -298], [96, -276], [124, -282]]] };
    s += R.glow(k, 70, 260, 180, .3);
    s += R.person(k, { x: 84, y: 696, s: 1.25, pose: press, outfit: "suit", expr: "tender", turn: .55, light: 1, headTilt: 5, look: 1 });
    /* his hand, back toward us, flat on the glass, fingers up; breath-fog around it */
    var hx = 240, hy = 334, sk = R.CH.rusty.skin, dk = mix(sk, "#5a3a3a", .42), lt = mix(sk, "#fff3e0", .35);
    s += '<ellipse cx="' + (hx + 6) + '" cy="' + (hy - 34) + '" rx="62" ry="70" fill="#fff" opacity=".18"/>';
    var h = "";
    [[-20, -10, -100, 46], [-6, -14, -92, 54], [8, -12, -84, 50], [21, -6, -74, 40]].forEach(function (q, i) {
      var a = q[2] * Math.PI / 180, tip = [q[0] + Math.cos(a) * q[3], q[1] + Math.sin(a) * q[3]], mid = [q[0] + Math.cos(a) * q[3] * .55, q[1] + Math.sin(a) * q[3] * .55];
      h += R.limb([[q[0], q[1]], mid, tip], 14 - i * .5, sk, 3);
      h += P("M" + f(mid[0] - 6) + "," + f(mid[1]) + " q6,-3 12,0", "none", dk, 1.4);
      h += '<ellipse cx="' + f(tip[0]) + '" cy="' + f(tip[1] + 4) + '" rx="4.5" ry="5.5" fill="' + lt + '" stroke="' + INK + '" stroke-width="1.2"/>';
      if (i === 2) h += R.limb([[q[0] + Math.cos(a) * 10, q[1] + Math.sin(a) * 10], [q[0] + Math.cos(a) * 15, q[1] + Math.sin(a) * 15]], 16, "#d9b23a", 1.5);
    });
    h += R.limb([[-22, 20], [-40, 2], [-46, -16]], 15, sk, 3) + '<ellipse cx="-46" cy="-14" rx="4.5" ry="5.5" fill="' + lt + '" stroke="' + INK + '" stroke-width="1.2"/>';
    h += P("M-26,-14 C-10,-20 12,-18 28,-10 C32,8 26,28 14,36 C0,40 -16,38 -26,30 C-32,12 -30,-2 -26,-14Z", sk, INK, 3.5);
    h += R.tone(k, "M8,-16 C18,-14 26,-12 28,-10 C32,8 26,28 14,36 C10,20 10,0 8,-16Z", .35);
    h += P("M-14,-6 L-12,22 M-2,-8 L0,24 M12,-6 L10,22", "none", dk, 1.2, 'opacity=".5"') + '<circle cx="-8" cy="10" r="2.5" fill="#b07a58" opacity=".7"/>';
    s += '<g transform="translate(' + hx + "," + hy + ') rotate(8) scale(.95)">' + h + "</g>";
    s += R.vignette(k, 600, 600, .4);
    return s;
  }
});
