/* p04: Rusty kneels by the LOST & FOUND, pinning a small red mitten at a child's eye level.
   Span 2, viewBox 400x600, mood day, wear 0. */
RUSTY.panel({
  id: "p04", w: 400, h: 600,
  alt: "Rusty kneels beside a cardboard LOST AND FOUND box and pins one small red mitten to the corkboard, low, where its owner will see it.",
  captions: [{ at: "bl", text: "But he tried to do his part.", w: 84 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#c9b98f"/>';
    s += '<rect y="470" width="400" height="130" fill="#a8987a"/>' + P("M0,470 H400", "none", INK, 3);
    s += P("M0,450 H400 V470 H0Z", "#6a5a40", INK, 2);
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
    s += P("M46,352 C50,320 80,318 84,346Z", "#3d6a9a", INK, 3) + P("M90,350 L100,320 L120,328 L112,352Z", "#e3c03a", INK, 3);
    /* Rusty kneeling */
    s += '<ellipse cx="190" cy="580" rx="110" ry="12" fill="#5a4a30" opacity=".4"/>';
    s += R.person(k, { x: 190, y: 578, s: .98, pose: "kneel", outfit: "work", expr: "tender", turn: .35, light: 1, look: 1, headTilt: -8 });
    s += R.vignette(k, 400, 600, .4);
    return s;
  }
});
