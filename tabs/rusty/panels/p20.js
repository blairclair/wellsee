/* p20: Dusk at closing. Danny in the doorway with the rabbit, looking down the road. On the horizon,
   a small stooped man walks into the sunset, three tall figures behind him. Span 6, 1200x600, mood dusk. */
RUSTY.panel({
  id: "p20", w: 1200, h: 600,
  alt: "Dusk. Mae's Diner is closing, its neon flickering CLOSED. Danny stands in the lit doorway holding the little wooden rabbit, looking down the empty road. Far away on the horizon, a small stooped man walks into the red sunset, and three too-tall figures follow behind him at a respectful distance.",
  captions: [
    { at: "tr", text: "Danny found it when they closed up.", w: 32 },
    { at: "br", text: "He never knew how close his father came.", w: 36 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2a1a3a"/><stop offset=".5" stop-color="#a3342c"/><stop offset=".8" stop-color="#e0703a"/><stop offset="1" stop-color="#f3b06a"/></linearGradient></defs>';
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    /* setting sun */
    s += R.glow(k, 900, 330, 300, .8, true) + '<circle cx="900" cy="330" r="60" fill="#f6b06a" opacity=".9"/>';
    s += P("M840,320 H960 M850,336 H950", "none", "#e0703a", 4);
    /* land */
    s += P("M0,360 H1200 V600 H0Z", "#3a2028", INK, 3);
    /* road to the horizon */
    s += P("M890,360 L910,360 L1200,520 L1200,600 L560,600Z", "#4a3a3a", INK, 3);
    s += P("M900,366 L880,600", "none", "#e3c03a", 3, 'stroke-dasharray="14 18" opacity=".7"');
    /* the walkers on the horizon */
    s += '<g fill="#1a0a10">';
    s += R.person(k, { x: 890, y: 366, s: .12, outfit: { shirt: "#1a0a10", pants: "#1a0a10", boots: "#1a0a10" }, pose: "walk", stoop: 14, lw: 3 });
    s += R.player(k, { x: 936, y: 366, s: .13, variant: 1, pose: "escort", lw: 3 }) + R.player(k, { x: 962, y: 366, s: .135, variant: 0, pose: "escort", lw: 3 }) + R.player(k, { x: 988, y: 366, s: .125, variant: 2, pose: "escort", lw: 3 });
    s += "</g>";
    /* telephone wire */
    s += P("M0,140 Q300,200 600,170 T1200,220", "none", INK, 2);
    /* diner */
    s += P("M0,120 H520 V600 H0Z", "#8a8a84", INK, 4);
    var ch = ""; for (var y = 130; y < 600; y += 14) ch += "M0," + y + " H520 ";
    s += P(ch, "none", "#6a6a64", 2) + P("M0,170 H520 V196 H0Z", "#7a1414", INK, 3);
    s += R.tone(k, "M0,120 H520 V600 H0Z", .35);
    s += P("M40,30 H360 V110 H40Z", "#1a1a20", INK, 4);
    s += R.sfx("MAE'S", 140, 90, 50, { anchor: "middle", fill: "#ff7aa0", stroke: "#a3175a", sw: 2, ls: 4 });
    s += R.sfx("CLOSED", 280, 88, 30, { anchor: "middle", fill: "#ff3b2f", stroke: "#5a0a0a", sw: 1.5, extra: 'opacity=".75"' });
    /* window (dark) + doorway (lit) */
    s += P("M30,240 H250 V460 H30Z", "#2a1a1a", INK, 4) + P("M40,250 L100,250 L40,330Z", "#fff", null, 0, 'opacity=".15"');
    s += P("M320,230 H470 V600 H320Z", "#f6d27a", INK, 5);
    s += P("M470,600 L640,600 L520,430 L470,430Z", "#f6d27a", null, 0, 'opacity=".25"');
    /* Danny holding the rabbit */
    s += R.person(k, { x: 400, y: 590, s: .88, ch: "danny", outfit: "danny", pose: "hold", carry: R.woodRabbit(k, { s: .5, y: 14 }), expr: "sad", turn: .7, look: 1, light: -1 });
    s += R.vignette(k, 1200, 600, .55);
    return s;
  }
});
