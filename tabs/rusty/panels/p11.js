/* p11: A shaft of gold light falls on Rusty alone; a ticket flutters into his open palm: ADMIT ONE · TONIGHT.
   Span 2, viewBox 400x600, mood light. */
RUSTY.panel({
  id: "p11", w: 400, h: 600,
  alt: "A shaft of gold carnival light cuts down through the dawn. A red ticket reading ADMIT ONE, TONIGHT flutters down into Rusty's open, upturned hand.",
  captions: [],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#2a2228"/>' + R.tone(k, "M0,0 H400 V600 H0Z", .35, true);
    /* the shaft */
    s += P("M150,-10 L270,-10 L420,600 L-20,600Z", "#f6d27a", null, 0, 'opacity=".35"');
    s += P("M180,-10 L240,-10 L330,600 L70,600Z", "#fff1b8", null, 0, 'opacity=".35"');
    s += R.glow(k, 200, 300, 260, .6);
    /* dust motes */
    [[160, 120], [230, 80], [210, 200], [260, 160], [140, 240], [290, 260], [180, 330]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.5" fill="#fffbe6"/>'; });
    /* hand from below */
    s += R.openHand(k, { x: 200, y: 450, s: 1.9, rot: 0, curl: .25, sleeve: "#7f8b6c", ring: true });
    /* the ticket, falling */
    s += '<g transform="rotate(-14 200 200)">';
    var edge = "M110,160 "; for (var y = 160; y < 240; y += 8) edge += "l-6,4 l6,4 "; edge += "H290 "; for (var y2 = 240; y2 > 160; y2 -= 8) edge += "l6,-4 l-6,-4 "; edge += "Z";
    s += P(edge, "#c0221b", INK, 3);
    s += P("M124,170 H276 V230 H124Z", "none", "#f6d27a", 2, 'stroke-dasharray="6 4"');
    s += R.sfx("ADMIT ONE", 200, 200, 30, { anchor: "middle", fill: "#f6d27a", sw: 2.5 });
    s += '<text x="200" y="224" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="18" fill="#f6e2b0" letter-spacing="4">· TONIGHT ·</text>';
    s += "</g>";
    s += P("M90,120 q-20,-20 -10,-50 M310,130 q24,-20 14,-50 M300,250 q20,6 30,-10", "none", "#fffbe6", 3, 'opacity=".8"');
    s += R.vignette(k, 400, 600, .8);
    return s;
  }
});
