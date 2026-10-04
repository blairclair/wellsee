/* p09: Saturday dawn. School parking lot; on the hill where the cornfield was, a carnival lit in daylight.
   Span 6, viewBox 1200x600, mood dawn, wear 0. */
RUSTY.panel({
  id: "p09", w: 1200, h: 600,
  alt: "Dawn over the school parking lot. Rusty, thermos in hand beside his rusted pickup, stares at the hill beyond town, where yesterday there was only a cornfield and now a whole carnival stands lit up in the daylight: a big top, a Ferris wheel, strings of bulbs.",
  captions: [{ at: "tl", text: "Saturday. Dawn.", w: 24 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4a5a7a"/><stop offset=".45" stop-color="#d98a6a"/><stop offset=".75" stop-color="#f3c98a"/><stop offset="1" stop-color="#f6e2b0"/></linearGradient></defs>';
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    s += R.glow(k, 300, 330, 220, .6);
    /* the hill + carnival */
    s += P("M400,330 C560,230 860,220 1200,300 V380 H400Z", "#5a4a5a", INK, 3);
    s += R.glow(k, 850, 250, 260, .7);
    s += R.ferris(k, { x: 980, y: 170, s: .5, color: "#2a1a24", car: "#5a1a1a", lights: true });
    s += R.bigTop(k, { x: 800, y: 268, s: .38, a: "#8b1414", b: "#efe4c8" });
    s += R.bigTop(k, { x: 690, y: 278, s: .22, a: "#6a1414", b: "#d8c8a8" });
    s += R.bulbWire(k, [600, 270], [1150, 260], 14, 22, { r: 2.4 });
    /* town between */
    s += P("M0,380 V340 h60 v-30 h40 v30 h50 v-50 l20,-20 l20,20 v50 h70 v-24 h60 v24 h80 v-36 h50 v36 h120 v-20 h80 v20 h120 v-30 h90 v30 h160 v-10 h180 v50Z", "#3a3040", INK, 2);
    s += '<g fill="#f6d27a" opacity=".8"><rect x="74" y="320" width="6" height="8"/><rect x="232" y="332" width="6" height="8"/><rect x="430" y="340" width="6" height="8"/><rect x="760" y="352" width="6" height="8"/></g>';
    /* school at left */
    s += P("M0,200 H260 V420 H0Z", "#9a6a4a", INK, 4) + P("M0,190 H272 V206 H0Z", "#6a4a3a", INK, 3);
    var win = ""; for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) win += '<rect x="' + (20 + i * 80) + '" y="' + (226 + j * 80) + '" width="54" height="56" fill="#3a3a4a" stroke="' + INK + '" stroke-width="3"/>';
    s += win + '<text x="136" y="184" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="17" fill="#2a1a14">HOLLIS CREEK ELEMENTARY</text>';
    /* lot */
    s += P("M0,420 H1200 V600 H0Z", "#5a5654", INK, 3);
    s += P("M380,600 L440,440 M620,600 L640,440 M860,600 L840,440 M1100,600 L1040,440", "none", "#e8e0c4", 5, 'opacity=".7"');
    s += R.tone(k, "M0,500 H1200 V600 H0Z", .3);
    /* rusty pickup */
    var tr = '<g transform="translate(140,410)">' +
      P("M0,120 V60 H180 L210,20 H300 L330,60 H380 V120Z", "#9a4a2a", INK, 4) +
      P("M220,28 H292 L316,60 H214Z", "#5a6a7a", INK, 3) +
      '<circle cx="80" cy="124" r="30" fill="#1a1a1a" stroke="' + INK + '" stroke-width="4"/><circle cx="80" cy="124" r="12" fill="#7a7a72"/>' +
      '<circle cx="310" cy="124" r="30" fill="#1a1a1a" stroke="' + INK + '" stroke-width="4"/><circle cx="310" cy="124" r="12" fill="#7a7a72"/>' +
      P("M20,80 c20,10 40,-4 60,8 M150,74 c20,6 30,20 50,10 M250,84 c14,6 30,0 44,8", "none", "#5a2a14", 6, 'opacity=".7"') +
      R.tone(k, "M0,90 H380 V120 H0Z", .4) + "</g>";
    s += tr;
    /* Rusty with thermos, turned toward the hill */
    var thermos = P("M-8,-30 H8 V22 H-8Z", "#3d6a5a", INK, 2.5) + P("M-10,-36 H10 V-28 H-10Z", "#9c9586", INK, 2);
    s += '<ellipse cx="640" cy="570" rx="90" ry="12" fill="#2a2624" opacity=".5"/>';
    s += R.person(k, { x: 640, y: 568, s: .95, pose: "hold", carry: thermos, outfit: "work", expr: "neutral", turn: .75, look: 1, light: -1 });
    /* crickets */
    s += P("M0,600 l12,-30 l6,30 l10,-24 l4,24 l14,-34 l6,34Z M1080,600 l10,-26 l6,26 l12,-30 l6,30 l12,-22 l4,22Z", "#3a4a2a", INK, 2);
    s += R.sfx("chrrr", 40, 520, 26, { fill: "#d8e8a0", rot: -8 }) + R.sfx("chrrr", 1050, 520, 24, { fill: "#d8e8a0", rot: 6 }) + R.sfx("chrrr", 980, 470, 18, { fill: "#d8e8a0", rot: -4 });
    s += R.vignette(k, 1200, 600, .4);
    return s;
  }
});
