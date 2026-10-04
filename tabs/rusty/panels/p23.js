/* p23: Behind the big top, in the mud, a Player presents Rusty with a mop, a bucket, and a nametag already reading RUSTY.
   Span 3, viewBox 600x600, mood lurid, wear 0.15. */
RUSTY.panel({
  id: "p23", w: 600, h: 600,
  alt: "In the mud behind the big top, a tall clown in a bowler hat holds out a mop and a red nametag that already reads RUSTY. A yellow bucket waits at its huge shoes. Rusty, in his torn suit, looks at the mop.",
  captions: [],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 3, y: 4, w: 44, tail: [76, 28], text: "Most who make us come for them, we paint." },
    { kind: "clown", who: "One of the Unwilling", x: 58, y: 4, w: 30, tail: [79, 26], text: "<em>You, we KEEP.</em>" },
    { kind: "clown", who: "One of the Unwilling", x: 3, y: 25, w: 40, tail: [74, 30], text: "Forever is a long shift, Rusty." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="600" height="600" fill="#2a0e10"/>';
    /* tent canvas wall, stained */
    s += P("M0,0 H600 V420 H0Z", "#6a2020", INK, 3);
    var st = ""; for (var x = 30; x < 600; x += 80) st += '<rect x="' + x + '" y="0" width="40" height="420" fill="#b8a888" opacity=".5"/>';
    s += st + P("M0,40 C150,70 450,70 600,40", "none", INK, 4);
    s += P("M120,420 C130,360 110,320 140,260 M420,420 c-6,-40 10,-60 0,-100", "none", "#3a0a0a", 8, 'opacity=".6"');
    s += R.tone(k, "M0,0 H600 V420 H0Z", .35, true);
    /* a caged work-light on the tent pole: one hard source, front right */
    s += R.glow(k, 560, 70, 220, .55) + P("M600,52 H548", "none", INK, 5) + '<circle cx="548" cy="70" r="14" fill="#fff3c0" stroke="' + INK + '" stroke-width="3"/>' + P("M536,60 L560,80 M536,80 L560,60 M548,56 V84", "none", INK, 2);
    /* its shadow, huge on the canvas behind Rusty, a long arm already over him */
    s += '<defs><filter id="' + k.id("sh") + '"><feColorMatrix type="matrix" values="0 0 0 0 .06  0 0 0 0 .01  0 0 0 0 .02  0 0 0 .78 0"/></filter></defs>';
    s += '<g filter="url(#' + k.id("sh") + ')">' + R.player(k, { x: 330, y: 610, s: .9, variant: 2, pose: "reach", flip: -1 }) + "</g>";
    /* mud */
    s += P("M0,420 H600 V600 H0Z", "#2e2018", INK, 3);
    s += '<ellipse cx="300" cy="520" rx="140" ry="16" fill="#5a1414" opacity=".6"/><ellipse cx="80" cy="560" rx="60" ry="8" fill="#5a1414" opacity=".6"/>';
    /* Rusty */
    s += R.person(k, { x: 170, y: 560, s: .86, pose: "slump", outfit: "suit", expr: "resigned", turn: .5, look: 1, wear: .15, light: 1 });
    s += P("M150,350 l10,14 l-8,6 M190,420 l12,4", "none", INK, 2);
    /* Player offering the mop + nametag */
    s += R.bucket(k, { x: 400, y: 566, s: .9 });
    s += R.player(k, { x: 490, y: 556, s: .74, variant: 2, pose: "offer", flip: -1, glow: "#ff3b2f", grin: 1 });
    var hx = 490 - 150 * .74, hy = 556 - 310 * .74;
    s += R.limb([[hx + 30, hy - 120], [hx - 30, hy + 150]], 7, "#a07a4a", 3);
    var mb = [hx - 30, hy + 150], strands = "";
    /* a new mop head: clamp, then cotton strands hanging straight down, a few kinked */
    for (var m = -6; m <= 6; m++) strands += "M" + (mb[0] + m * 2.2) + "," + (mb[1] + 6) + " c" + (m * 1.5) + ",16 " + (m * 3 + (m % 2 ? 4 : -3)) + ",30 " + (m * 3.4) + "," + (52 + (m * m) % 7 * 2) + " ";
    s += P(strands, "none", INK, 7) + P(strands, "none", "#e6dfca", 4) + P("M" + (mb[0] - 16) + "," + (mb[1] - 4) + " h32 v12 h-32Z", "#8a8a82", INK, 2.5);
    var tx = 490 - 120 * .74, ty = 556 - 300 * .74;
    s += '<g transform="rotate(-12 ' + tx + " " + (ty + 20) + ')"><ellipse cx="' + tx + '" cy="' + (ty + 26) + '" rx="34" ry="15" fill="#a3171c" stroke="' + INK + '" stroke-width="3"/>' +
      '<text x="' + tx + '" y="' + (ty + 32) + '" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-weight="700" font-size="17" fill="#f6d27a">RUSTY</text></g>';
    s += '<rect width="600" height="600" fill="' + k.url("dotsR") + '" opacity=".14"/>';
    s += R.vignette(k, 600, 600, .8);
    return s;
  }
});
