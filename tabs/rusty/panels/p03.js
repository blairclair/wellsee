/* p03: Close-up: big chapped hands wringing a mop over a yellow bucket. Wedding band worn thin.
   Span 2, viewBox 400x600, mood day, wear 0.
   Hands are drawn by a local helper (grip) rather than R.fist: real knuckles, overlapping fingers,
   a thumb that crosses the grip, creases, hair and chapped skin. */
RUSTY.panel({
  id: "p03", w: 400, h: 600,
  alt: "Close-up of Rusty's big, chapped hands wringing a grey mop over a yellow bucket, twisting in opposite directions until water runs out of the strands. A thin, worn wedding band on his left hand.",
  captions: [{ at: "tl", text: "He never amounted to much.", w: 70 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var SK = "#e2b48f", SKD = R.mix(SK, "#6a3a30", .38), SKL = R.mix(SK, "#fff3e0", .35), CHAP = "#d9806a", SLV = "#7f8b6c";

    /* One gripping hand. Local frame: wrist at -x, fingers curl around a vertical bundle at x≈0..40.
       We look at the finger side of the fist. o = {x,y,s,rot,flip,ring} */
    function grip(o) {
      var g = "";
      /* forearm, rolled sleeve */
      g += P("M-260,-58 C-200,-56 -150,-48 -96,-40 L-92,46 C-150,52 -200,58 -260,62Z", SK, INK, 4.5);
      g += R.tone(k, "M-260,22 C-200,26 -150,34 -94,30 L-92,46 C-150,52 -200,58 -260,62Z", .45);
      g += P("M-230,-40 l6,-6 M-210,-44 l7,-5 M-190,-38 l6,-7 M-170,-40 l7,-5 M-150,-34 l6,-6 M-220,-24 l6,-5 M-180,-22 l7,-5 M-140,-20 l6,-6", "none", R.mix(SK, "#5a3020", .6), 1.6);
      g += P("M-200,-6 C-170,0 -140,-4 -110,4", "none", SKD, 2.2);                                    /* vein */
      g += P("M-300,-74 L-226,-70 C-216,-30 -214,30 -224,76 L-300,80Z", SLV, INK, 4.5);               /* rolled cuff */
      g += P("M-246,-70 C-238,-30 -236,30 -246,78", "none", INK, 2.5) + R.tone(k, "M-300,20 L-222,24 L-224,76 L-300,80Z", .45);
      /* back of hand / palm mass */
      g += P("M-104,-44 C-80,-60 -40,-64 -18,-56 C-6,-50 -2,-36 -6,-24 L-8,48 C-30,60 -70,60 -98,48 C-110,20 -112,-20 -104,-44Z", SK, INK, 4.5);
      g += P("M-70,-56 C-60,-62 -44,-64 -32,-60 M-48,-58 C-40,-62 -30,-62 -22,-58", "none", SKD, 2);       /* knuckle ridge */
      g += R.tone(k, "M-104,-44 C-110,-20 -110,20 -98,48 C-80,56 -60,58 -50,56 C-70,30 -76,-10 -70,-56Z", .35);
      /* fingers, pinky first so each upper finger overlaps the one below: [y, h, reach] */
      var fs = [[40, 19, 28], [17, 22, 40], [-7, 24, 46], [-32, 23, 40]];
      fs.forEach(function (F, i) {
        var y = F[0], h = F[1], r = F[2], t = y - h / 2, b = y + h / 2;
        var d = "M-30," + f(t + 2) + " C-10," + f(t - 2) + " " + f(r - 18) + "," + f(t - 3) + " " + f(r - 4) + "," + f(t + 1) +
          " C" + f(r + 8) + "," + f(t + 5) + " " + f(r + 8) + "," + f(b - 3) + " " + f(r - 4) + "," + f(b) +
          " C" + f(r - 14) + "," + f(b + 2) + " -10," + f(b + 1) + " -30," + f(b - 1) + "Z";
        g += P(d, SK);
        g += P("M-16," + f(t + .5) + " C" + f(r - 22) + "," + f(t - 3) + " " + f(r - 18) + "," + f(t - 3) + " " + f(r - 4) + "," + f(t + 1) +
          " C" + f(r + 8) + "," + f(t + 5) + " " + f(r + 8) + "," + f(b - 3) + " " + f(r - 4) + "," + f(b) +
          " C" + f(r - 14) + "," + f(b + 2) + " -10," + f(b + 1) + " -18," + f(b - .5), "none", INK, i === 3 ? 4.5 : 3.6);
        g += P("M" + f(-22) + "," + f(b - 3) + " C" + f(r * .4) + "," + f(b) + " " + f(r - 10) + "," + f(b + 1) + " " + f(r - 4) + "," + f(b - 1) + " L" + f(r - 4) + "," + f(y + 2) + " C" + f(r * .4) + "," + f(y + 4) + " -10," + f(y + 3) + " -22," + f(y + 1) + "Z", SKD, null, 0, 'opacity=".35"');
        g += P("M" + f(r - 16) + "," + f(t + 4) + " q-4," + f(h * .35) + " 0," + f(h * .7), "none", INK, 1.8);   /* DIP crease */
        g += P("M" + f(r - 22) + "," + f(t + 6) + " q-3," + f(h * .25) + " 0," + f(h * .5), "none", SKD, 1.4);
        g += '<ellipse cx="' + f(r - 2) + '" cy="' + f(y - 2) + '" rx="5" ry="' + f(h * .26) + '" fill="' + CHAP + '" opacity=".55"/>';  /* chapped knuckle */
        g += P("M" + f(r - 6) + "," + f(t + 4) + " c4,1 6,3 6,6", "none", SKL, 2, 'opacity=".8"');
        if (o.ring && i === 1) g += P("M-14," + f(t - 1) + " C-10," + f(t + 4) + " -10," + f(b - 4) + " -14," + f(b + 1) + " L-6," + f(b + 1) + " C-2," + f(b - 4) + " -2," + f(t + 4) + " -6," + f(t - 1) + "Z", "#c9a23a", INK, 2) +
          P("M-11," + f(t + 3) + " v" + f(h - 6), "none", "#f3dc8a", 1.5);
      });
      /* thumb, crossing over index and middle, nail at the tip */
      g += P("M-96,30 C-86,6 -60,-14 -30,-24 C-6,-32 14,-34 26,-28 C34,-22 30,-10 20,-8 C2,-6 -20,-2 -40,10 C-58,22 -70,40 -84,50Z", SK, INK, 4.5);
      g += P("M10,-30 C20,-33 28,-30 28,-24 C28,-18 22,-15 14,-16 C10,-20 8,-26 10,-30Z", "#efcbb0", INK, 2);   /* nail */
      g += P("M-14,-24 q-3,8 2,16", "none", INK, 2) + P("M-60,-2 C-50,-8 -40,-12 -30,-14", "none", SKD, 2);
      g += R.tone(k, "M-84,50 C-70,40 -58,22 -40,10 C-20,-2 2,-6 20,-8 L18,-2 C-10,4 -40,20 -60,46Z", .4);
      g += '<ellipse cx="-12" cy="-20" rx="7" ry="4" fill="' + CHAP + '" opacity=".5"/>';
      return '<g transform="translate(' + f(o.x) + "," + f(o.y) + ") rotate(" + f(o.rot || 0) + ") scale(" + f(o.s * (o.flip || 1)) + "," + f(o.s) + ')">' + g + "</g>";
    }

    /* ---------- set: tiled utility wall, light from a high window at right ---------- */
    s += '<rect width="400" height="600" fill="#c9bfa0"/>';
    var g = ""; for (var y = 0; y < 440; y += 34) g += "M0," + y + " H400 "; for (var x = 0; x < 400; x += 34) g += "M" + x + ",0 V440 ";
    s += P(g, "none", "#a39678", 2);
    s += R.glow(k, 360, 60, 320, .5);
    s += P("M0,0 H400 L0,440Z", "#3a3020", null, 0, 'opacity=".12"');
    s += R.tone(k, "M0,0 H180 L0,300Z", .22);
    /* bucket rim + grey water */
    s += P("M-20,440 L420,440 L404,640 L-4,640Z", "#d9a62b", INK, 5);
    s += R.tone(k, "M290,440 L420,440 L404,640 L280,640Z", .4) + P("M30,456 L20,600", "none", "#f6d27a", 6, 'opacity=".7"');
    s += '<g opacity=".55" transform="rotate(-2 200 530)"><text x="196" y="518" text-anchor="middle" font-family="Bangers, sans-serif" font-size="30" letter-spacing="3" fill="#6a4a10">PROPERTY OF</text>' +
      '<text x="196" y="556" text-anchor="middle" font-family="Bangers, sans-serif" font-size="30" letter-spacing="3" fill="#6a4a10">HOLLIS CREEK ELEM.</text></g>';
    s += P("M120,580 c10,-4 30,-6 50,-2 M250,586 c14,-6 30,-4 44,0", "none", "#8a6a20", 2.5, 'opacity=".6"');   /* scuffs */
    s += '<ellipse cx="200" cy="440" rx="232" ry="30" fill="#5d665b" stroke="' + INK + '" stroke-width="5"/>';
    s += '<ellipse cx="200" cy="440" rx="200" ry="20" fill="none" stroke="#7d877a" stroke-width="2" opacity=".7"/>';
    /* wringer press */
    s += P("M70,404 H330 V432 H70Z", "#8a8a84", INK, 4) + P("M84,412 H316", "none", "#d0d0c6", 4) + R.tone(k, "M70,424 H330 V432 H70Z", .4);
    /* ripples where the water lands */
    s += '<ellipse cx="204" cy="446" rx="34" ry="6" fill="none" stroke="#a9b9b8" stroke-width="2.5"/><ellipse cx="204" cy="446" rx="60" ry="10" fill="none" stroke="#8a9a98" stroke-width="2" opacity=".7"/>';

    /* ---------- the mop: loose above, twisted rope between the fists, fanned below ---------- */
    var ST = "#bdb5a0", STD = "#8c8470";
    var top = "";
    for (var i = 0; i < 8; i++) { var x0 = 176 + i * 7; top += "M" + (x0 - 6) + ",-10 C" + (x0 + 8) + ",40 " + (x0 - 10) + ",80 " + (x0 + 2) + ",130 "; }
    s += P(top, "none", INK, 9) + P(top, "none", ST, 5.5);
    /* twisted section 200..300 */
    s += P("M178,190 C176,230 184,270 182,306 L232,306 C230,270 236,230 232,190Z", ST, INK, 4.5);
    var tw = "";
    for (var ty = 196; ty < 304; ty += 13) tw += "M180," + (ty + 10) + " C196," + (ty + 8) + " 214," + (ty - 4) + " 232," + (ty - 6) + " ";
    s += P(tw, "none", INK, 2.6) + P(tw.replace(/M180,(\d+)/g, function (m, a) { return "M181," + (+a + 4); }), "none", STD, 2);
    s += R.tone(k, "M178,190 C176,230 184,270 182,306 L198,306 C200,270 194,230 194,190Z", .45);
    /* water squeezed out of the twist */
    function drop(x, y, r, a) {
      return '<g transform="rotate(' + a + " " + x + " " + y + ')">' + P("M" + x + "," + (y - r * 2.2) + " C" + (x + r) + "," + (y - r * .6) + " " + (x + r) + "," + (y + r) + " " + x + "," + (y + r) + " C" + (x - r) + "," + (y + r) + " " + (x - r) + "," + (y - r * .6) + " " + x + "," + (y - r * 2.2) + "Z", "#a8c4c8", INK, 1.8) +
        '<circle cx="' + (x - r * .3) + '" cy="' + (y - r * .1) + '" r="' + (r * .3) + '" fill="#fff"/></g>';
    }
    s += drop(158, 236, 5, -60) + drop(146, 262, 4, -70) + drop(254, 222, 5, 60) + drop(266, 250, 4, 70) + drop(250, 280, 3.5, 50) + drop(150, 210, 3.5, -50);
    s += P("M168,240 l-14,-4 M244,232 l14,-6 M246,262 l12,2", "none", INK, 1.8);
    /* fanned strands under the lower fist + the stream */
    var low = "";
    for (var j = 0; j < 9; j++) { var bx = 186 + j * 5; low += "M" + bx + ",350 C" + (bx + (j - 4) * 3) + ",370 " + (bx + (j - 4) * 7) + ",386 " + (bx + (j - 4) * 9 + 4) + ",404 "; }
    s += P(low, "none", INK, 8) + P(low, "none", STD, 4.5);
    s += P("M200,380 C198,400 206,420 202,446 M212,384 C214,404 208,424 212,444", "none", "#9cb8bc", 4, 'opacity=".9"');
    s += drop(222, 418, 4, 0) + drop(186, 428, 3.5, 0);

    /* ---------- the hands: left from the left (ring), right from the right, wrenching opposite ways ---------- */
    s += grip({ x: 186, y: 158, s: 1.12, rot: -8, ring: true });
    s += grip({ x: 230, y: 334, s: 1.12, rot: 172, flip: 1 });
    /* torque arcs */
    s += P("M64,96 C40,120 38,150 52,176", "none", INK, 3.5) + P("M52,176 l-12,-4 M52,176 l4,-12", "none", INK, 3.5);
    s += P("M342,382 C368,360 372,328 360,300", "none", INK, 3.5) + P("M360,300 l12,4 M360,300 l-4,12", "none", INK, 3.5);
    s += R.sfx("sqqk", 300, 236, 32, { fill: "#efe4c8", rot: 10 });
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
