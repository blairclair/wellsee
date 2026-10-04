/* p16: THE TURN. In the diner window's reflection, three of the Unwilling stand across the road behind Rusty.
   One points past him, through the glass, at Danny. Span 6, viewBox 1200x600, mood noon, wear 0.
   Staging: we stand beside Rusty, looking at the glass. Through it, warm and real: Danny and Jess in the booth.
   On it, cold and pale: the noon road behind him. A telephone pole and a mailbox cast hard noon shadows;
   the Unwilling cast none. The pointer's fingertip lands on Danny's head. */
RUSTY.panel({
  id: "p16", w: 1200, h: 600,
  alt: "The diner window at noon. Through the glass, warm and close, Danny and pregnant Jess sit across from each other in a red booth. Laid over them, pale as a reflection, is the sunny road behind Rusty: a telephone pole and a mailbox throw hard black shadows, and three too-tall painted figures stand on the far shoulder casting no shadows at all. One stretches an impossibly long arm and points, through the glass, straight at Danny's head. Rusty's own faint reflection stands among them. At the right edge, the real Rusty clutches the wrapped rabbit and stares, frozen, sweat on his scalp.",
  captions: [
    { at: "tl", text: "And in the glass, he saw them.", w: 34 },
    { at: "bl", text: "Waiting. Watching to see who he'd lead them to.", w: 40 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "", gx0 = 34, gy0 = 34, gx1 = 872, gy1 = 566;
    var glassD = "M" + gx0 + "," + gy0 + " H" + gx1 + " V" + gy1 + " H" + gx0 + "Z";
    s += '<defs><clipPath id="' + k.id("glass") + '"><path d="' + glassD + '"/></clipPath>' +
      '<linearGradient id="' + k.id("refsky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#eef4f6"/><stop offset=".7" stop-color="#c9d9e0"/><stop offset="1" stop-color="#b9c8cc"/></linearGradient>' +
      '<linearGradient id="' + k.id("wall") + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#d4d4cc"/><stop offset=".5" stop-color="#bdbdb4"/><stop offset="1" stop-color="#9a9a92"/></linearGradient>' +
      '<filter id="' + k.id("ghost") + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.2 0.4 0.08 0 0.12  0.23 0.46 0.09 0 0.15  0.26 0.52 0.1 0 0.2  0 0 0 1 0"/></filter>' +
      '<radialGradient id="' + k.id("lamp") + '"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient></defs>';

    /* ---------- diner exterior wall (chrome siding) ---------- */
    s += '<rect width="1200" height="600" fill="' + k.url("wall") + '"/>';
    var ch = ""; for (var y = 6; y < 600; y += 13) ch += "M0," + y + " H1200 ";
    s += P(ch, "none", "#8a8a84", 2) + P(ch.replace(/M0,(\d+)/g, function (m, yy) { return "M0," + (+yy + 3); }), "none", "#ecece6", 1.2, 'opacity=".7"');
    s += R.tone(k, "M960,0 H1200 V600 H960Z", .22);

    /* ---------- INSIDE (through the glass): warm, dim back wall, booth, Danny + Jess ---------- */
    var inn = "";
    inn += '<rect x="' + gx0 + '" y="' + gy0 + '" width="' + (gx1 - gx0) + '" height="' + (gy1 - gy0) + '" fill="#5a3324"/>';
    /* wood panelling + chair rail */
    var pan = ""; for (var x = 40; x < 880; x += 46) pan += "M" + x + ",40 V330 ";
    inn += P(pan, "none", "#47271b", 4) + P("M30,330 H880 V346 H30Z", "#7a4a30", INK, 2);
    inn += P("M30,346 H880 V566 H30Z", "#8a2a24");
    /* pendant lamps */
    [[200, 120], [560, 120]].forEach(function (l) {
      inn += P("M" + l[0] + ",34 V" + (l[1] - 18), "none", INK, 2) + '<circle cx="' + l[0] + '" cy="' + (l[1] + 30) + '" r="150" fill="' + k.url("lamp") + '"/>' +
        P("M" + (l[0] - 26) + "," + l[1] + " L" + (l[0] - 10) + "," + (l[1] - 20) + " H" + (l[0] + 10) + " L" + (l[0] + 26) + "," + l[1] + "Z", "#2e5a4a", INK, 2.5) +
        '<ellipse cx="' + l[0] + '" cy="' + (l[1] + 2) + '" rx="12" ry="5" fill="#fff4cc"/>';
    });
    /* menu board */
    inn += P("M640,70 H840 V200 H640Z", "#1e1a18", INK, 3);
    ["PIE ......... 2.50", "COFFEE ..... .90", "BLUE PLATE 6.75", "MEATLOAF .. 5.25"].forEach(function (t, i) {
      inn += '<text x="652" y="' + (100 + i * 26) + '" font-family="Patrick Hand, sans-serif" font-size="17" fill="#e8e0c8" opacity=".45">' + t + "</text>";
    });
    /* booth backs (tufted), in a gentle perspective: left back nearer, right back further */
    var booth = function (x0, x1, top) {
      var b = P("M" + x0 + "," + (top + 20) + " C" + x0 + "," + (top - 4) + " " + x1 + "," + (top - 4) + " " + x1 + "," + (top + 20) + " V566 H" + x0 + "Z", "#a3342c", INK, 4);
      var t = ""; for (var xx = x0 + 22; xx < x1 - 10; xx += 30) t += "M" + xx + "," + (top + 22) + " V566 ";
      b += P(t, "none", "#7a221c", 3) + P("M" + (x0 + 6) + "," + (top + 16) + " C" + (x0 + 10) + "," + (top + 4) + " " + (x1 - 10) + "," + (top + 4) + " " + (x1 - 6) + "," + (top + 16), "none", "#e0705e", 3, 'opacity=".7"');
      return b + R.tone(k, "M" + x0 + "," + (top + 20) + " H" + (x0 + 26) + " V566 H" + x0 + "Z", .35);
    };
    inn += booth(46, 236, 300) + booth(500, 690, 300);
    /* Jess (left, facing right, hand on her belly) and Danny (right, facing her) */
    inn += R.person(k, { x: 168, y: 690, s: .95, ch: "jess", outfit: "jess", pose: "sit", expr: "tender", turn: .45, light: 1, look: .6 });
    inn += R.person(k, { x: 560, y: 691, s: .95, ch: "danny", outfit: "danny", pose: "sit", expr: "neutral", turn: .45, flip: -1, light: -1, look: .4 });
    /* table */
    inn += P("M196,468 H560 L572,500 H184Z", "#efe9da", INK, 3.5) + P("M184,500 H572 V512 H184Z", "#b8b0a0", INK, 3);
    inn += P("M300,470 v-30 h28 v30Z M430,470 v-24 h32 v24Z", "#efe9da", INK, 2.5) + P("M328,448 c12,0 12,16 0,16 M462,452 c10,0 10,14 0,14", "none", INK, 2.5);
    inn += '<ellipse cx="314" cy="440" rx="14" ry="3.5" fill="#4a2a14"/><ellipse cx="446" cy="446" rx="16" ry="3.5" fill="#4a2a14"/>';
    s += '<g clip-path="' + k.url("glass") + '">' + inn;

    /* ---------- REFLECTION (on the glass): the noon road behind Rusty, cold and pale ---------- */
    var ref = "";
    ref += '<rect x="' + gx0 + '" y="' + gy0 + '" width="' + (gx1 - gx0) + '" height="300" fill="' + k.url("refsky") + '" opacity=".42"/>';
    ref += R.glow(k, 120, 70, 170, .55);
    /* far fields + the hill (the carnival is up there, a smudge of red) */
    ref += P("M30,330 C200,300 420,318 600,306 C720,298 820,310 880,316 V455 H30Z", "#c9b07a", null, 0, 'opacity=".35"');
    ref += P("M30,330 C200,300 420,318 600,306 C720,298 820,310 880,316", "none", "#5a5048", 2, 'opacity=".5"');
    ref += P("M210,312 l14,-26 l14,26Z M246,314 l8,-14 l8,14Z", "#8b1414", null, 0, 'opacity=".45"');
    /* the road: far shoulder at 455, centre line, near edge off the bottom */
    ref += P("M30,455 H880 V566 H30Z", "#5c5c5c", null, 0, 'opacity=".26"');
    ref += P("M30,455 H880", "none", "#e8e8e0", 3, 'opacity=".55"');
    ref += P("M30,540 H880", "none", "#e3c03a", 5, 'opacity=".45" stroke-dasharray="44 34"');
    /* telephone pole + mailbox WITH hard noon shadows */
    ref += '<g opacity=".6">' + P("M96,456 V250 M66,264 H126 M70,280 H122", "none", "#3a2a20", 9) +
      P("M88,458 H150 L140,466 H84Z", "#141010") +
      P("M400,456 V408", "none", "#4a3a2c", 6) + P("M386,410 v-16 a14,14 0 0 1 28,0 v16Z", "#8a8a84", INK, 2) +
      P("M392,458 H446 L438,465 H388Z", "#141010") + "</g>";
    s += ref;

    /* the three Unwilling: no shadows. Pointer's fingertip computed to land on Danny's head. */
    var dannyHead = [560 - 2 * .95, 691 - (362 - 35) * .95];
    var px = 712, py = 468, ps = .63;
    var S = [40, -415], T = [(px - dannyHead[0]) / ps, (dannyHead[1] - py) / ps];
    var len = Math.hypot(T[0] - S[0], T[1] - S[1]), ux = (T[0] - S[0]) / len, uy = (T[1] - S[1]) / len;
    var el = [S[0] + (T[0] - S[0]) * .42 - uy * 26, S[1] + (T[1] - S[1]) * .42 + ux * 26];
    var dl = Math.hypot(T[0] - el[0], T[1] - el[1]), hd = [T[0] - (T[0] - el[0]) / dl * 54, T[1] - (T[1] - el[1]) / dl * 54];
    var pointArms = [[[-40, -415], [-54, -290], [-52, -150]], [S, el, hd]];
    var players = R.player(k, { x: 822, y: 472, s: .6, variant: 1, pose: "stand", flip: -1, glow: "#ff3b2f", headTilt: 8 }) +
      R.player(k, { x: 300, y: 462, s: .58, variant: 2, pose: "stand", flip: -1, glow: "#ff3b2f", headTilt: -6 }) +
      R.player(k, { x: px, y: py, s: ps, variant: 0, pose: "point", arms: pointArms, flip: -1, glow: "#ff3b2f", lean: -4 });
    s += '<g opacity=".74" filter="' + k.url("ghost") + '">' + players + "</g>";
    /* their pinprick eyes burn through the glass at full strength */
    [[822, 472, .6, 8], [300, 462, .58, -6], [px, py, ps, -4]].forEach(function (q) {
      [-15, 15].forEach(function (ex) {
        var lx = 4 + ex * .62, ly = -478 - 16 * .62;
        var wx = q[0] - lx * q[2], wy = q[1] + ly * q[2];
        s += '<circle cx="' + f(wx) + '" cy="' + f(wy) + '" r="7" fill="#ff3b2f" opacity=".35"/><circle cx="' + f(wx) + '" cy="' + f(wy) + '" r="2.2" fill="#ff6a4a"/>';
      });
    });
    /* a cold ring of light where the finger touches the glass over Danny */
    s += '<circle cx="' + f(dannyHead[0]) + '" cy="' + f(dannyHead[1]) + '" r="62" fill="none" stroke="#ff3b2f" stroke-width="2" opacity=".35" stroke-dasharray="4 7"/>';

    /* Rusty's own reflection: faint, mirrored, near the right edge at his real head height. An Unwilling looms over it. */
    s += '<g opacity=".42" filter="' + k.url("ghost") + '">' + R.person(k, { x: 805, y: 800, s: 1.3, outfit: "suit", pose: "hold", carry: P("M-28,-22 L24,-28 L30,18 L-22,24Z", "#d9d0b8", INK, 2.5), expr: "fear", turn: .55, light: 1 }) + "</g>";

    /* cool wash + glass glare streaks */
    s += '<rect x="' + gx0 + '" y="' + gy0 + '" width="' + (gx1 - gx0) + '" height="' + (gy1 - gy0) + '" fill="#a8c4d0" opacity=".12"/>';
    s += P("M70,34 L170,34 L34,330 L34,250Z M220,34 L250,34 L34,520 L34,470Z", "#fff", null, 0, 'opacity=".22"');
    s += "</g>";

    /* window frame: chrome with ink, heavy outer line */
    s += P(glassD, "none", "#ecece6", 14) + P(glassD, "none", "#8a8a84", 4, 'transform="translate(3,3)"') + P(glassD, "none", INK, 4);
    s += P("M22,22 H884 V578 H22Z", "none", INK, 3);
    s += P("M22,578 H884 V592 H22Z", "#c9c9c0", INK, 3);

    /* ---------- the real Rusty, right edge, frozen ---------- */
    var pkg = P("M-28,-22 L24,-28 L30,18 L-22,24Z", "#d9d0b8", INK, 2.5) + P("M-18,-14 h30 M-16,-4 h34 M-14,6 h30", "none", "#7a7468", 1.5);
    s += R.glow(k, 1050, 230, 200, .35);
    s += R.person(k, { x: 1062, y: 800, s: 1.62, outfit: "suit", pose: "hold", carry: pkg, expr: "fear", turn: -.6, flip: -1, light: 1, look: -1 });
    /* sweat + shock ticks */
    s += P("M1010,150 q-5,12 0,16 q5,-4 0,-16Z M1112,170 q-4,10 0,13 q4,-3 0,-13Z", "#cfe6f0", INK, 1.6);
    s += P("M1150,70 l18,-16 M1166,100 l26,-4 M948,74 l-18,-16 M934,104 l-24,-4", "none", INK, 4);
    s += R.vignette(k, 1200, 600, .45);
    return s;
  }
});
