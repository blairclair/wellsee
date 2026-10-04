/* p04: Rusty kneels by the LOST & FOUND, pinning a small red mitten at a child's eye level.
   Span 2, viewBox 400x600, mood day, wear 0. */
RUSTY.panel({
  id: "p04", w: 400, h: 600,
  alt: "Rusty kneels beside a cardboard LOST AND FOUND box and pins one small red mitten to the corkboard, low, where its owner will see it.",
  captions: [{ at: "bl", text: "But he tried to do his part.", w: 84 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#cdbd92"/>';
    /* glazed-tile wainscot to child height, painted block above */
    s += P("M0,300 H400 V450 H0Z", "#7f9c8a", INK, 2.5);
    var wt = ""; for (var ty = 330; ty < 450; ty += 30) wt += "M0," + ty + " H400 "; for (var tx = 0; tx < 400; tx += 40) wt += "M" + tx + ",300 V450 ";
    s += P(wt, "none", "#5f7a6a", 1.6) + P("M0,296 H400 V304 H0Z", "#4f6a5a", INK, 2);
    s += '<rect y="470" width="400" height="130" fill="#a8987a"/>' + P("M0,470 H400", "none", INK, 3);
    s += P("M0,500 L60,470 M120,600 L200,470 M300,600 L330,470", "none", "#8f8064", 2);
    s += P("M0,450 H400 V470 H0Z", "#6a5a40", INK, 2);
    /* late sun through the classroom door window, a slanted bar across the wall */
    s += P("M40,0 L170,0 L330,470 L200,470Z", "#fff1c0", null, 0, 'opacity=".28"');
    /* kids' coat hooks, labelled, at their height */
    [["MAYA", 18], ["LEO", 96]].forEach(function (h) {
      s += '<rect x="' + (h[1] - 2) + '" y="262" width="56" height="18" fill="#efe9da" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<text x="' + (h[1] + 26) + '" y="276" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="14" fill="#a3171c">' + h[0] + "</text>" +
        P("M" + (h[1] + 26) + ",284 v14 c0,8 10,8 10,0", "none", INK, 5) + P("M" + (h[1] + 26) + ",284 v14 c0,8 10,8 10,0", "none", "#b8b1a0", 2.5);
    });
    s += P("M106,298 C92,300 86,330 90,350 C94,368 130,370 136,350 C140,330 134,300 120,298Z", "#5a3a8a", INK, 3) + P("M98,320 H130 V340 H98Z", "#7a5aaa", INK, 2);   /* backpack on LEO's hook */
    /* corkboard */
    s += P("M150,90 H392 V380 H150Z", "#b07a46", INK, 5);
    s += R.tone(k, "M150,90 H392 V380 H150Z", .3, true);
    s += P("M150,90 H392 V380 H150Z", "none", "#6a4a2a", 10, 'opacity=".6"');
    /* notes pinned on the board */
    s += '<g transform="rotate(-5 230 150)"><rect x="180" y="110" width="100" height="70" fill="#efe9da" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="230" y="136" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="16" fill="#2a3a8a">LOST: one</text><text x="230" y="156" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="16" fill="#2a3a8a">tooth (mine)</text>' +
      '<circle cx="230" cy="114" r="4" fill="#c0221b"/></g>';
    s += '<g transform="rotate(6 330 150)"><rect x="300" y="110" width="80" height="90" fill="#f3e3a6" stroke="' + INK + '" stroke-width="2"/>' +
      P("M314,180 l14,-30 l14,20 l10,-12 l14,22Z", "#5a8a3a", INK, 1.5) + '<circle cx="360" cy="132" r="9" fill="#e3c03a"/><circle cx="340" cy="114" r="4" fill="#3d6a9a"/></g>';
    s += '<g transform="rotate(-2 260 230)"><rect x="200" y="210" width="120" height="44" fill="#efe9da" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="260" y="238" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="17" fill="#a3171c">MR. RUSTY ROCKS</text></g>';
    /* the red mitten, pinned low */
    s += P("M268,300 C262,282 270,268 284,268 L300,268 C308,252 324,256 322,272 L320,300 C322,322 310,336 292,336 C276,336 266,322 268,300Z", "#c0221b", INK, 3.5);
    s += P("M268,326 H318 V344 H268Z", "#efe4c8", INK, 3) + P("M276,326 v18 M286,326 v18 M296,326 v18 M306,326 v18", "none", "#c0221b", 2);
    s += '<circle cx="292" cy="276" r="5" fill="#e3c03a" stroke="' + INK + '" stroke-width="2"/>';
    /* lost & found box */
    s += P("M14,470 L20,370 H140 L146,470Z", "#a87c4a", INK, 4);
    s += P("M20,370 L40,346 H124 L140,370Z", "#8a6238", INK, 3);
    s += P("M30,384 h104 v26 h-104Z", "#efe9da", INK, 2);
    s += '<text x="82" y="403" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="17" font-weight="700" fill="' + INK + '">LOST &amp; FOUND</text>';
    s += P("M36,356 C36,320 86,318 88,354Z", "#3d6a9a", INK, 3) + P("M34,348 H90 V360 H34Z", "#2d5a8a", INK, 2.5) + P("M44,348 v12 M54,348 v12 M64,348 v12 M74,348 v12", "none", "#1d3a5a", 1.5) +
      '<circle cx="62" cy="318" r="8" fill="#efe9da" stroke="' + INK + '" stroke-width="2"/>';                         /* knit hat with pompom */
    s += P("M98,354 L102,316 H118 L116,340 L134,342 C138,348 136,356 130,358Z", "#e3c03a", INK, 3) + P("M100,322 h16", "none", INK, 2);   /* rain boot */
    s += P("M140,372 C152,380 156,400 148,420 L138,416 C144,400 142,388 134,380Z", "#c0392b", INK, 2.5);                 /* sweater sleeve over the edge */
    /* Rusty kneeling */
    s += '<ellipse cx="190" cy="580" rx="110" ry="12" fill="#5a4a30" opacity=".4"/>';
    s += R.person(k, { x: 190, y: 578, s: .98, pose: "kneel", outfit: "work", expr: "tender", turn: .35, light: 1, look: 1, headTilt: -8 });
    s += R.vignette(k, 400, 600, .4);
    return s;
  }
});
