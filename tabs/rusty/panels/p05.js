/* p05: The janitor's closet. A taped photo of a boy on a bike and his laughing mother; a 9-year sobriety chip.
   Span 2, viewBox 400x600, mood day. No Rusty in frame, just his life. */
RUSTY.panel({
  id: "p05", w: 400, h: 600,
  alt: "Inside the janitor's closet, under a bare bulb: a hot plate, a dented thermos, and a faded photo taped to the wall of a freckled boy with a bicycle beside a laughing auburn-haired woman. On the shelf below it sits a bronze nine-year sobriety chip.",
  captions: [
    { at: "tl", text: "Nine years sober.", w: 70 },
    { at: "bl", text: "Nine years too late for the only person it should have mattered to.", w: 92 }
  ],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#8a7a5c"/>';
    s += R.glow(k, 200, 60, 340, .6);
    /* pegboard texture */
    var d = ""; for (var y = 20; y < 600; y += 24) for (var x = 12; x < 400; x += 24) d += "M" + x + "," + y + "h.1";
    s += P(d, "none", "#4a3e2c", 4, 'opacity=".5"');
    /* bulb + pull chain */
    s += P("M200,0 V40", "none", INK, 3) + '<ellipse cx="200" cy="52" rx="13" ry="15" fill="#fff4cc" stroke="' + INK + '" stroke-width="2"/>' + P("M212,58 V150", "none", "#9c9586", 2, 'stroke-dasharray="2 3"');
    /* the photo */
    s += '<g transform="rotate(-7 200 230)">' +
      '<rect x="92" y="120" width="216" height="232" fill="#f3ead2" stroke="' + INK + '" stroke-width="3"/>' +
      '<rect x="106" y="134" width="188" height="170" fill="#9fb7a8"/>' +
      '<rect x="106" y="240" width="188" height="64" fill="#7a9a5a"/>' +
      R.glow(k, 260, 160, 80, .5) +
      R.person(k, { x: 236, y: 300, s: .36, ch: "carol", outfit: { shirt: "#d98a5a", pants: "#4a5a7a", boots: "#3a2a24" }, expr: "smile", turn: -.4, flip: -1 }) +
      '<circle cx="132" cy="286" r="18" fill="none" stroke="' + INK + '" stroke-width="3"/><circle cx="186" cy="286" r="18" fill="none" stroke="' + INK + '" stroke-width="3"/>' +
      P("M132,286 L152,262 L180,262 L186,286 M152,262 L160,286 L180,262 M150,256 h12", "none", "#c0221b", 3.5) +
      R.person(k, { x: 166, y: 302, s: .26, ch: "danny18", outfit: { shirt: "#e3c03a", pants: "#3a4a6a", boots: "#2a2a2a" }, expr: "smile", turn: .3 }) +
      '<rect x="106" y="134" width="188" height="170" fill="#e3c08a" opacity=".22"/>' +
      '<text x="200" y="336" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="18" fill="#3a3a7a">Carol &amp; Danny, \'03</text>' +
      '<rect x="168" y="110" width="64" height="20" fill="#e8e0b0" opacity=".85" transform="rotate(4 200 120)"/></g>';
    /* shelf */
    s += P("M0,420 H400 V440 H0Z", "#6a4a2a", INK, 3) + R.tone(k, "M0,430 H400 V440 H0Z", .4);
    /* hot plate + dented pot */
    s += P("M20,420 V396 H130 V420Z", "#3a3a3a", INK, 3) + '<ellipse cx="75" cy="396" rx="40" ry="7" fill="#5a2a1a" stroke="' + INK + '" stroke-width="2"/>';
    s += P("M44,394 C40,360 52,346 76,346 C100,346 112,360 106,394Z", "#8a8a84", INK, 3) + P("M60,360 c6,6 6,14 0,18", "none", INK, 2) + P("M106,362 h18 v18 h-14", "none", INK, 4);
    /* thermos */
    s += P("M320,420 V320 C320,310 360,310 360,320 V420Z", "#3d6a5a", INK, 3) + P("M316,320 H364 V300 H316Z", "#9c9586", INK, 3) + P("M330,360 c8,10 6,20 -2,24", "none", INK, 2);
    /* the chip */
    s += '<ellipse cx="208" cy="414" rx="40" ry="11" fill="#5a3a10" opacity=".5"/>';
    s += '<circle cx="208" cy="384" r="34" fill="#b07c3a" stroke="' + INK + '" stroke-width="3.5"/><circle cx="208" cy="384" r="26" fill="none" stroke="#7a4a1a" stroke-width="2"/>';
    s += P("M208,364 L226,396 H190Z", "none", "#5a3010", 3);
    s += R.sfx("9", 208, 394, 22, { anchor: "middle", fill: "#5a3010", stroke: "#e0b070", sw: 1 });
    s += P("M190,362 l8,6", "none", "#f6e2a0", 3, 'opacity=".8"');
    /* below shelf: rags, spray bottle */
    s += P("M40,600 V520 C40,500 80,500 80,520 V600Z", "#3d6a9a", INK, 3) + P("M54,500 V480 H74 L88,488 V496 H68 V500Z", "#e8e0c4", INK, 2);
    s += P("M240,600 C250,560 300,550 340,570 C370,590 360,600 360,600Z", "#cfc7b0", INK, 3);
    s += R.vignette(k, 400, 600, .7);
    return s;
  }
});
