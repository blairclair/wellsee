/* p10: SILENT. A cicada on a fencepost, huge. Its song stops mid-note.
   Span 2, viewBox 400x600, mood dawn. */
RUSTY.panel({
  id: "p10", w: 400, h: 600,
  alt: "Close on a cicada clinging to a weathered fencepost at dawn, the far carnival lights blurred behind it. The word chrrr hangs in the air, struck through. Nothing is singing.",
  captions: [{ at: "bl", text: "And all the bugs went quiet.", w: 86 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d98a6a"/><stop offset="1" stop-color="#f3d9a8"/></linearGradient></defs>';
    s += '<rect width="400" height="600" fill="' + k.url("sky") + '"/>';
    /* bokeh carnival lights */
    [[60, 120, 22], [120, 90, 14], [330, 140, 26], [280, 70, 12], [40, 260, 16], [360, 300, 20]].forEach(function (b) {
      s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="#ffe9a8" opacity=".55"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] * 1.8 + '" fill="#f6d27a" opacity=".18"/>';
    });
    /* fencepost */
    s += P("M120,600 L130,180 C150,160 250,160 270,180 L280,600Z", "#8a7a64", INK, 5);
    s += P("M150,220 C160,320 146,420 160,600 M220,200 C228,300 214,450 232,600 M250,260 l6,60", "none", "#5a4a3a", 3);
    s += R.tone(k, "M230,170 L270,180 L280,600 L236,600Z", .45);
    s += P("M0,330 H130 M270,340 H400", "none", "#7a7a72", 3) + P("M0,330 l14,-8 l-4,12 M300,340 l10,-8 l-2,12", "none", "#7a7a72", 2);
    /* the cicada, head up */
    var c = '<g transform="translate(200,360) rotate(-6)">';
    c += P("M-70,-150 C-110,-40 -96,120 -40,190 C-20,150 -30,0 -24,-120Z", "#d8e0d0", INK, 3, 'opacity=".75"');
    c += P("M70,-150 C110,-40 96,120 40,190 C20,150 30,0 24,-120Z", "#d8e0d0", INK, 3, 'opacity=".75"');
    c += P("M-60,-100 C-70,0 -60,90 -40,150 M-46,-80 C-50,20 -46,80 -32,120 M60,-100 C70,0 60,90 40,150 M46,-80 C50,20 46,80 32,120", "none", "#3a4a2a", 2);
    c += P("M-30,-130 C-36,-40 -30,60 0,120 C30,60 36,-40 30,-130Z", "#4a5a2a", INK, 4);
    c += P("M-26,-60 H26 M-24,-30 H24 M-20,0 H20 M-16,30 H16 M-10,60 H10", "none", "#2a3418", 3);
    c += P("M-36,-170 C-40,-200 40,-200 36,-170 C34,-140 -34,-140 -36,-170Z", "#5a6a3a", INK, 4);
    c += '<circle cx="-36" cy="-176" r="13" fill="#b3141c" stroke="' + INK + '" stroke-width="3"/><circle cx="36" cy="-176" r="13" fill="#b3141c" stroke="' + INK + '" stroke-width="3"/>';
    c += '<circle cx="-39" cy="-180" r="4" fill="#fff" opacity=".8"/><circle cx="33" cy="-180" r="4" fill="#fff" opacity=".8"/>';
    c += P("M-30,-120 l-40,-10 l-16,30 M30,-120 l40,-10 l16,30 M-30,-70 l-46,6 l-10,30 M30,-70 l46,6 l10,30", "none", INK, 5);
    c += "</g>";
    s += c;
    /* the song, cut off */
    s += R.sfx("chrrr...", 60, 82, 46, { fill: "#d8e8a0", rot: -6, extra: 'opacity=".75"' });
    s += P("M40,70 L250,52", "none", "#8b1414", 7);
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
