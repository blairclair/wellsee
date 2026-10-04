/* p21: SPLASH. Night. Rusty waits in his good suit, facing the door. It bursts inward: carnival light,
   a Player leaning in, rabbit-things crowding the hall. Span 6, viewBox 1200x800, mood lurid, wear 0. */
RUSTY.panel({
  id: "p21", w: 1200, h: 800,
  alt: "Night in Rusty's apartment. He sits upright in a kitchen chair in his good brown suit, hands on his knees, facing the door, which has burst off its hinges. Red and gold carnival light floods in. A towering clown leans through the doorway reaching for him, long white-gloved fingers curled around the frame, and behind it rabbit-things with glowing eyes crowd the hallway.",
  captions: [{ at: "tl", text: "He didn't run. He was already wearing his good suit.", w: 30 }],
  balloons: [
    { kind: "clown", who: "One of the Unwilling", x: 56, y: 3, w: 38, tail: [74, 20], text: "YOU <em>REFUSED</em> US, RUSSELL." },
    { kind: "speech", who: "Rusty", x: 2, y: 30, w: 12, tail: [21, 47], text: "Yeah." },
    { kind: "speech", who: "Rusty", x: 2, y: 41, w: 12, tail: [21, 50], text: "I did." }
  ],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="1200" height="800" fill="#120a10"/>';
    var st = ""; for (var x = 0; x < 1200; x += 40) st += "M" + x + ",0 V600 ";
    s += P(st, "none", "#1a1018", 14);
    s += P("M0,600 H1200 V800 H0Z", "#1a1010", INK, 3);
    /* the light pouring from the door across the floor toward Rusty */
    s += P("M770,600 L1060,600 L700,800 L140,800Z", "#f6a04a", null, 0, 'opacity=".35"');
    s += R.rays(920, 380, 36, 1100, "#ffb84a", .14, 140, 110);
    s += R.glow(k, 920, 380, 520, .7, true);
    /* calendar, the X's all the way to the 14th */
    s += P("M90,120 H210 V260 H90Z", "#cfc6b0", INK, 3) + P("M90,120 H210 V150 H90Z", "#6b1010", INK, 3);
    s += P("M100,166 l12,14 M112,166 l-12,14 M120,166 l12,14 M132,166 l-12,14 M100,190 l12,14 M112,190 l-12,14", "none", "#3a0a0a", 2);
    s += '<ellipse cx="146" cy="197" rx="14" ry="12" fill="none" stroke="#c0221b" stroke-width="3"/>';
    /* clock: midnight */
    s += '<circle cx="520" cy="150" r="44" fill="#d8cfb8" stroke="' + INK + '" stroke-width="4"/>' + P("M520,150 V112 M520,150 V118", "none", INK, 5);
    /* doorway */
    s += P("M770,130 H1070 V610 H770Z", "#ffcf7a", INK, 6);
    s += R.glow(k, 920, 380, 220, .9);
    /* rabbit-things crowding the hall */
    s += '<g opacity=".92">' + R.monsterRabbit(k, { x: 1060, y: 620, s: .78, flip: -1, fur: "#3a2a2a" }) + R.monsterRabbit(k, { x: 840, y: 610, s: .62, flip: -1, fur: "#2a1a1e" }) + "</g>";
    s += '<rect x="770" y="130" width="300" height="480" fill="#ff7a2a" opacity=".22"/>';
    /* the Player leaning in */
    s += R.player(k, { x: 960, y: 640, s: 1.02, variant: 0, pose: "reach", flip: -1, lean: 22, glow: "#fff1a0" });
    /* fingers curled around the frame */
    var fing = "";
    [0, 1, 2, 3].forEach(function (i) { fing += R.limb([[792, 220 + i * 26], [758, 224 + i * 26], [752, 240 + i * 26]], 11, "#efe9da", 3.5); });
    s += P("M770,130 H784 V610 H770Z", "#3a2418", INK, 3) + fing;
    /* the door, burst off a hinge, splinters */
    s += P("M1070,140 L1190,90 L1196,700 L1076,620Z", "#4a3428", INK, 5) + '<circle cx="1094" cy="400" r="8" fill="#c9a23a" stroke="' + INK + '" stroke-width="2"/>';
    s += P("M770,300 l-30,-10 l26,-6 M772,420 l-36,4 l30,8 M1070,200 l30,-20", "#8a6a4a", INK, 2);
    s += R.sfx("KRAKK", 860, 110, 64, { fill: "#f6d27a", rot: -8, sw: 6 });
    /* Rusty, seated, facing the door */
    s += P("M240,800 L250,560 L268,560 L262,800 M330,800 l4,-120", "none", "#2a1a14", 12);
    s += P("M140,790 C200,780 260,770 330,772", "none", "#000", 40, 'opacity=".55"');
    s += R.person(k, { x: 280, y: 790, s: 1.28, pose: "sit", outfit: "suit", expr: "resigned", turn: .55, light: 1, look: 1 });
    /* lurid wash */
    s += '<rect width="1200" height="800" fill="#c0221b" style="mix-blend-mode:multiply" opacity=".28"/>';
    s += R.vignette(k, 1200, 800, .85);
    return s;
  }
});
