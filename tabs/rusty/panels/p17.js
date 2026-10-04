/* p17: SILENT. Rusty's hand at the diner door handle, fingers uncurling, a finger's width off the chrome.
   He lets go. Span 2, viewBox 400x600, mood noon, wear 0.
   The hand is drawn here (back of the right hand, side-on, relaxing): neither shared hand helper does
   "releasing". Faint in the door glass: a white glove and two red pinpricks, reflected. */
RUSTY.panel({
  id: "p17", w: 400, h: 600,
  alt: "Silent close-up: Rusty's weathered hand, gold wedding band on the ring finger and a white shirt cuff under the brown suit sleeve, has just come off the chrome handle of the diner door. His fingers are uncurling, a finger's width from the bar, where his grip has left a fading fog. Through the door glass, the warm blur of the diner. Faint on the glass, reflected, two red pinpricks of light and a white glove.",
  captions: [],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, mix = R.mix, s = "";
    var sk = R.CH.rusty.skin, dk = mix(sk, "#5a3a3a", .42), lt = mix(sk, "#fff3e0", .35);
    s += '<defs><radialGradient id="' + k.id("blur") + '"><stop offset="0" stop-color="#f6d27a" stop-opacity=".9"/><stop offset="1" stop-color="#d9a870" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + k.id("chrome") + '" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6a6a66"/><stop offset=".35" stop-color="#f4f4ee"/><stop offset=".55" stop-color="#b8b8b0"/><stop offset="1" stop-color="#5a5a56"/></linearGradient>' +
      '<filter id="' + k.id("ghost") + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.2 0.4 0.08 0 0.12  0.23 0.46 0.09 0 0.15  0.26 0.52 0.1 0 0.2  0 0 0 1 0"/></filter></defs>';

    /* ---------- door glass: the diner, out of focus ---------- */
    s += '<rect width="400" height="600" fill="#c99560"/>';
    s += '<circle cx="150" cy="170" r="150" fill="' + k.url("blur") + '"/>';
    s += '<ellipse cx="90" cy="420" rx="110" ry="80" fill="#8a2a24" opacity=".55"/><ellipse cx="300" cy="430" rx="80" ry="70" fill="#8a2a24" opacity=".45"/>';
    s += '<ellipse cx="170" cy="330" rx="46" ry="70" fill="#45627a" opacity=".45"/><circle cx="170" cy="240" r="34" fill="#e6bb98" opacity=".35"/><circle cx="170" cy="226" r="34" fill="#3b2a20" opacity=".25"/>';
    s += '<ellipse cx="290" cy="340" rx="40" ry="60" fill="#b46a58" opacity=".4"/>';
    s += R.tone(k, "M0,0 H400 V600 H0Z", .07, true);
    /* reflection on the glass: one of them, behind him */
    s += '<g opacity=".22" filter="' + k.url("ghost") + '">' + R.playerHead(k, { x: 330, y: 150, s: 1.1, variant: 0, glow: "#ff3b2f" }) + "</g>";
    [[313.5, 132.4], [346.5, 132.4]].forEach(function (e) { s += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="6" fill="#ff3b2f" opacity=".3"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="2" fill="#ff5a3a" opacity=".85"/>'; });
    s += P("M40,0 L130,0 L40,250Z M160,0 L180,0 L40,380 L40,330Z", "#fff", null, 0, 'opacity=".22"');

    /* ---------- door frame + stickers ---------- */
    s += P("M0,0 H40 V600 H0Z M372,0 H400 V600 H372Z", "#c9c9c0", INK, 4) + P("M8,0 V600 M380,0 V600", "none", "#f4f4ee", 3, 'opacity=".8"');
    s += '<rect x="66" y="44" width="104" height="40" fill="#efe9da" stroke="' + INK + '" stroke-width="3" transform="rotate(-2 118 64)"/>' + R.sfx("PULL", 118, 76, 30, { anchor: "middle", fill: "#a3171c", stroke: "#efe9da", sw: 0, rot: -2 });
    s += '<rect x="214" y="30" width="128" height="54" rx="8" fill="#1a1a20" stroke="' + INK + '" stroke-width="3"/>' + R.glow(k, 278, 58, 60, .45, true) + R.sfx("OPEN", 278, 72, 34, { anchor: "middle", fill: "#ff7aa0", stroke: "#a3175a", sw: 1.5 });
    s += P("M240,30 L230,6 M318,30 L328,6", "none", INK, 2);

    /* ---------- the handle: chrome bar on two standoffs ---------- */
    s += P("M262,150 h26 v20 h-26Z M262,470 h26 v20 h-26Z", "#9a9a92", INK, 3);
    s += '<rect x="282" y="132" width="26" height="376" rx="13" fill="' + k.url("chrome") + '" stroke="' + INK + '" stroke-width="4"/>';
    s += P("M292,150 V490", "none", "#fff", 3, 'opacity=".8"');
    /* where his grip was: fog on the chrome, fading */
    s += '<ellipse cx="295" cy="318" rx="11" ry="56" fill="#fff" opacity=".35"/>' + P("M288,282 q6,-4 12,0 M288,300 q6,-4 12,0 M288,318 q6,-4 12,0 M288,336 q6,-4 12,0", "none", "#fff", 1.6, 'opacity=".5"');

    /* ---------- the hand, letting go ---------- */
    s += "<g transform=\"translate(-34,6)\">";
    /* sleeve + cuff */
    s += P("M-10,268 L96,276 C104,312 104,352 96,392 L-10,404Z", "#6c4f37", INK, 4) + R.tone(k, "M-10,350 L98,360 C100,376 98,386 96,392 L-10,404Z", .4);
    s += P("M20,276 C18,320 18,360 22,400", "none", "#4a3424", 3) + P("M40,290 l20,6 M36,372 l24,-4", "none", "#4a3424", 2.5);
    s += P("M92,284 L118,288 C124,318 124,350 118,380 L92,386 C100,352 100,318 92,284Z", "#efe8d8", INK, 3.5);
    s += '<circle cx="108" cy="334" r="3" fill="#cfc6b4" stroke="' + INK + '" stroke-width="1.2"/>';
    /* fingers: index (top) to pinky (bottom); each joint opens a little: curl .4, tips stop short of the bar */
    var curl = .42, fingers = [
      { b: [196, 300], len: [40, 26, 21], a: -4, w: 21 },
      { b: [200, 324], len: [44, 28, 22], a: 4, w: 21 },
      { b: [196, 348], len: [40, 26, 21], a: 12, w: 20 },
      { b: [186, 370], len: [32, 21, 17], a: 22, w: 17 }
    ];
    fingers.slice().reverse().forEach(function (fi, ri) {
      var i = 3 - ri, a = fi.a * Math.PI / 180, pts = [fi.b], cur = fi.b.slice();
      fi.len.forEach(function (L, j) {
        var aj = a + j * curl * .55;
        cur = [cur[0] + Math.cos(aj) * L, cur[1] + Math.sin(aj) * L];
        pts.push(cur.slice());
      });
      s += R.limb(pts, fi.w, sk, 3.5);
      /* knuckle creases on the finger joints + nail on the tip */
      [1, 2].forEach(function (j) { var p = pts[j]; s += P("M" + f(p[0] - 3) + "," + f(p[1] - fi.w * .4) + " q4," + f(fi.w * .4) + " 0," + f(fi.w * .8), "none", dk, 1.8); });
      var tip = pts[3], ta = a + 2 * curl * .55;
      s += '<ellipse cx="' + f(tip[0] - Math.cos(ta) * 4) + '" cy="' + f(tip[1] - Math.sin(ta) * 4 - fi.w * .18) + '" rx="7" ry="4.5" fill="' + lt + '" stroke="' + INK + '" stroke-width="1.4" transform="rotate(' + f(ta * 180 / Math.PI) + " " + f(tip[0] - Math.cos(ta) * 4) + " " + f(tip[1] - Math.sin(ta) * 4 - fi.w * .18) + ')"/>';
      if (i === 2) { var r0 = pts[0], r1 = pts[1]; s += R.limb([[r0[0] + (r1[0] - r0[0]) * .45, r0[1] + (r1[1] - r0[1]) * .45], [r0[0] + (r1[0] - r0[0]) * .62, r0[1] + (r1[1] - r0[1]) * .62]], fi.w + 3, "#d9b23a", 2) + P("M" + f(r0[0] + (r1[0] - r0[0]) * .5) + "," + f(r0[1] + (r1[1] - r0[1]) * .5 - 9) + " l2,6", "none", "#fff3b0", 2); }
    });
    /* back of the hand */
    var back = "M112,286 C140,276 182,282 206,294 C216,318 214,356 196,384 C170,394 140,392 116,384 C108,352 108,318 112,286Z";
    s += P(back, sk, INK, 4);
    s += R.tone(k, "M116,384 C140,392 170,394 196,384 C200,372 204,362 206,352 C176,368 140,366 112,352Z", .38);
    /* tendons, knuckle bumps, age spots, hair */
    s += P("M124,304 C150,300 176,298 198,300 M126,326 C152,324 178,322 202,324 M126,346 C150,346 174,346 198,348", "none", dk, 1.6, 'opacity=".55"');
    [[200, 300], [204, 324], [200, 348], [190, 370]].forEach(function (q) { s += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="6" ry="8" fill="' + lt + '" opacity=".75"/>' + P("M" + (q[0] - 4) + "," + (q[1] - 7) + " q5,7 0,14", "none", dk, 1.4); });
    s += '<circle cx="150" cy="312" r="3.5" fill="#b07a58" opacity=".7"/><circle cx="168" cy="340" r="2.5" fill="#b07a58" opacity=".7"/><circle cx="138" cy="356" r="3" fill="#b07a58" opacity=".6"/>';
    s += P("M130,292 l4,-3 M142,290 l4,-3 M154,290 l4,-3 M136,298 l4,-3", "none", "#8a5a3a", 1.2, 'opacity=".7"');
    /* thumb, drifting up and away */
    s += R.limb([[132, 292], [164, 262], [190, 246]], 22, sk, 3.5);
    s += P("M161,256 q4,6 0,12", "none", dk, 1.6) + '<ellipse cx="186" cy="246" rx="7" ry="5" fill="' + lt + '" stroke="' + INK + '" stroke-width="1.4" transform="rotate(-32 186 246)"/>';
    s += "</g>";
    /* the gap: a held breath between fingertips and chrome */
    s += P("M262,296 v8 M262,322 v8 M262,348 v8", "none", INK, 2.2, 'opacity=".55"');
    s += R.vignette(k, 400, 600, .55);
    return s;
  }
});
