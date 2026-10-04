/* p20: Dusk at closing. Danny in the lit doorway with the rabbit, looking down the road. Far down Route 9,
   silhouetted against a huge setting sun: a small stooped man walking away, and three too-tall figures
   following at a respectful distance. Only the man throws a long shadow back toward the diner.
   Span 6, viewBox 1200x600, mood dusk. */
RUSTY.panel({
  id: "p20", w: 1200, h: 600,
  alt: "Dusk. Mae's Diner is closing, its neon flickering CLOSED. Danny stands in the lit doorway holding the little wooden rabbit, looking down the long empty road. Far away, black against an enormous red setting sun, a small stooped man walks away down Route 9, and three too-tall figures with long arms follow behind him at a respectful distance. Only the old man casts a shadow: it stretches all the way back down the road toward his son.",
  captions: [
    { at: "tr", text: "Danny found it when they closed up.", w: 32 },
    { at: "br", text: "He never knew how close his father came.", w: 36 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var VP = [860, 352];   /* vanishing point on the horizon, centre of the sun */
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1e1430"/><stop offset=".35" stop-color="#5a1e38"/><stop offset=".62" stop-color="#b8362a"/><stop offset=".85" stop-color="#ec7a3a"/><stop offset="1" stop-color="#f6b46a"/></linearGradient>' +
      '<linearGradient id="' + k.id("sun") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#f0602e"/></linearGradient>' +
      '<linearGradient id="' + k.id("road") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#c06a4a"/><stop offset=".25" stop-color="#5a3a3c"/><stop offset="1" stop-color="#2a1e24"/></linearGradient>' +
      '<linearGradient id="' + k.id("door") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe2a0"/><stop offset="1" stop-color="#f2b860"/></linearGradient>' +
      '<filter id="' + k.id("sil") + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .09  0 0 0 0 .03  0 0 0 0 .05  0 0 0 1 0"/></filter>' +
      '<clipPath id="' + k.id("sunclip") + '"><path d="M0,0 H1200 V' + VP[1] + ' H0Z"/></clipPath></defs>';
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    /* clouds, low streaks */
    s += P("M560,150 C640,140 760,146 900,138 C980,134 1080,142 1200,150 L1200,160 C1080,154 980,150 900,154 C760,160 640,160 560,162Z", "#7a2a3a", null, 0, 'opacity=".7"');
    s += P("M620,232 C700,226 820,230 960,222 C1040,220 1120,226 1200,230 L1200,238 C1100,236 980,234 900,238 C800,240 700,240 620,240Z", "#c0483a", null, 0, 'opacity=".7"');

    /* ---------- the sun: enormous, sinking, retro-striped at the bottom ---------- */
    s += R.glow(k, VP[0], VP[1], 380, .9, true);
    s += '<g clip-path="' + k.url("sunclip") + '"><circle cx="' + VP[0] + '" cy="' + VP[1] + '" r="150" fill="' + k.url("sun") + '"/>';
    [[300, 8], [318, 10], [334, 12], [346, 10]].forEach(function (b) { s += P("M600," + b[0] + " H1120", "none", "#c9442a", b[1]); });
    s += "</g>";

    /* ---------- land + road to the vanishing point ---------- */
    s += P("M0," + VP[1] + " H1200 V600 H0Z", "#3a2028");
    s += P("M0," + VP[1] + " C200,348 500,350 " + (VP[0] - 160) + ",350 L1200,348 V" + (VP[1] + 4) + " H0Z", "#5a2a30");
    var furrows = ""; for (var i = -16; i <= 16; i++) furrows += "M" + VP[0] + "," + VP[1] + " L" + (VP[0] + i * 140) + ",600 ";
    s += P(furrows, "none", "#2a1418", 2.5, 'opacity=".5"');
    s += P("M" + (VP[0] - 4) + "," + VP[1] + " L" + (VP[0] + 4) + "," + VP[1] + " L1200,560 L1200,600 L470,600Z", k.url("road"), INK, 3);
    s += P("M" + VP[0] + "," + (VP[1] + 2) + " L760,600", "none", "#e3b03a", 4, 'stroke-dasharray="26 30" opacity=".75"');
    /* sun glare on the road surface */
    s += P("M" + (VP[0] - 3) + "," + (VP[1] + 1) + " L" + (VP[0] + 3) + "," + (VP[1] + 1) + " L880,600 L820,600Z", "#ffc27a", null, 0, 'opacity=".22"');

    /* telephone poles converging on the right shoulder, wires to the VP */
    var wires = "";
    [0.08, 0.16, 0.3, 0.52, 0.85].forEach(function (t) {
      var x = VP[0] + (1260 - VP[0]) * t + 12 * t, yb = VP[1] + (560 - VP[1]) * t, h = 30 + 520 * t, w = 2 + 12 * t;
      s += P("M" + f(x) + "," + f(yb) + " V" + f(yb - h) + " M" + f(x - h * .14) + "," + f(yb - h * .93) + " H" + f(x + h * .14), "none", "#1a0c10", w);
      wires += (wires ? " L" : "M") + f(x - h * .12) + "," + f(yb - h * .93);
    });
    s += P("M" + VP[0] + "," + (VP[1] - 26) + " " + wires.replace(/^M/, "L"), "none", "#1a0c10", 2);

    /* ---------- the walkers, black against the sun ---------- */
    /* Rusty's long shadow (and only his) runs back down the road toward the diner */
    s += P("M" + (VP[0] - 2) + "," + (VP[1] + 1) + " L" + (VP[0] + 2) + "," + (VP[1] + 1) + " L1000,600 L640,600Z", "#ffb070", null, 0, 'opacity=".28"');
    s += P("M852,367 C800,420 740,480 640,600 L586,600 C700,470 790,410 846,366Z", "#0e060a", null, 0, 'opacity=".85"');
    s += P("M612,600 C640,560 670,530 700,500", "none", "#0e060a", 3, 'opacity=".6"');
    var walkL = [[[-18, -258], [-34, -132], [-58, -14]], [[18, -258], [34, -130], [52, -14]]];
    var walkR = [[[-18, -258], [10, -132], [26, -14]], [[18, -258], [-4, -130], [-30, -14]]];
    var hang = { arms: [[[-40, -415], [-62, -300], [-70, -170]], [[40, -415], [60, -300], [66, -170]]] };
    var walkers = R.person(k, { x: 862, y: 368, s: .26, outfit: "suit", pose: "walk", stoop: 18, flip: -1, lw: 6 }) +
      R.player(k, { x: 748, y: 402, s: .33, variant: 1, pose: hang, legs: walkL, lw: 6 }) +
      R.player(k, { x: 968, y: 398, s: .31, variant: 0, pose: hang, legs: walkR, lw: 6 }) +
      R.player(k, { x: 1046, y: 432, s: .38, variant: 2, pose: hang, legs: walkR, lw: 6 });
    s += '<g filter="' + k.url("sil") + '">' + walkers + "</g>";

    /* ---------- Mae's at closing ---------- */
    s += P("M0,100 H540 V600 H0Z", "#7a7a76", INK, 4);
    var ch = ""; for (var y = 110; y < 600; y += 13) ch += "M0," + y + " H540 ";
    s += P(ch, "none", "#5e5e5a", 2) + P(ch.replace(/M0,(\d+)/g, function (m, yy) { return "M0," + (+yy + 3); }), "none", "#b07a6a", 1.2, 'opacity=".5"');
    s += P("M0,150 H540 V178 H0Z", "#6a1212", INK, 3);
    s += R.tone(k, "M0,100 H540 V600 H0Z", .32);
    s += P("M540,100 V600", "none", "#f0804a", 4, 'opacity=".6"');   /* sunset rim on the corner */
    /* neon sign */
    s += P("M30,14 H380 V94 H30Z", "#141018", INK, 4) + P("M60,94 V100 M350,94 V100", "none", INK, 4);
    s += R.sfx("MAE'S", 128, 76, 50, { anchor: "middle", fill: "#5a2a3a", stroke: "#2a1418", sw: 2, ls: 4 });
    s += R.glow(k, 300, 66, 80, .7, true);
    s += R.sfx("CLOSED", 300, 72, 34, { anchor: "middle", fill: "#ff4a3a", stroke: "#5a0a0a", sw: 1.5 });
    /* dark window with the chairs up on tables */
    s += P("M30,230 H270 V450 H30Z", "#1e1416", INK, 5);
    s += P("M60,380 H140 M90,380 V330 M110,380 V330 M80,330 H120 M170,380 H250 M200,380 V330 M220,380 V330 M190,330 H230", "none", "#3a2a2a", 5);
    s += P("M40,240 L110,240 L40,340Z", "#fff", null, 0, 'opacity=".1"');
    /* the lit doorway */
    s += P("M320,214 H490 V600 H320Z", "#2a1a14", INK, 6);
    s += P("M330,224 H480 V600 H330Z", k.url("door"));
    s += P("M330,224 H480 V250 H330Z", "#f6d27a") + R.glow(k, 405, 300, 160, .5);
    s += P("M480,600 L700,600 L560,470 L480,470Z", "#f6d27a", null, 0, 'opacity=".22"');
    /* Danny, in the doorway, rabbit held to his chest, turned toward the road */
    var rab = R.woodRabbit(k, { s: 1.05, y: 4, x: 0 });
    var cradle = { legs: R.POSE.hold.legs, arms: [[[-46, -298], [-40, -222], [2, -184]], [[46, -298], [62, -222], [40, -180]]], carry: [18, -190] };
    s += R.person(k, { x: 398, y: 596, s: 1.0, ch: "danny", outfit: "danny", pose: cradle, carry: rab, expr: "sad", turn: .75, look: 1, light: -1, headTilt: 4 });
    s += P("M330,224 V600", "none", INK, 3);
    s += R.vignette(k, 1200, 600, .5);
    return s;
  }
});
