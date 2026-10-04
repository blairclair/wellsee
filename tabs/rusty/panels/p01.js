/* p01: COVER. Title splash; Rusty under one bare bulb, the carnival glowing behind.
   Span 6, viewBox 1200x700, mood cover, wear 0.6. */
RUSTY.panel({
  id: "p01", w: 1200, h: 700,
  alt: "Comic cover: THE TALE OF RUSTY THE JANITOR. In blackness, one bare bulb hangs over an old stooped janitor leaning on a mop in a slick of dark red. Far behind him a red-and-white big top and a Ferris wheel glow.",
  captions: [{ at: "bl", text: "He never hurt anyone.", w: 40 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<defs><linearGradient id="' + k.id("sky") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050304"/><stop offset=".72" stop-color="#2a0b0d"/><stop offset="1" stop-color="#5a1612"/></linearGradient>' +
      '<linearGradient id="' + k.id("floor") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0e0e"/><stop offset="1" stop-color="#070506"/></linearGradient></defs>';
    s += '<rect width="1200" height="700" fill="' + k.url("sky") + '"/>';
    /* carnival on the horizon */
    s += R.glow(k, 560, 540, 380, .8, true);
    s += R.ferris(k, { x: 1090, y: 380, s: .65, color: "#120808", car: "#2a0c0c", lights: true });
    s += R.bigTop(k, { x: 560, y: 545, s: .62, a: "#5e1010", b: "#b8a888", fade: .55 });
    s += R.bigTop(k, { x: 390, y: 545, s: .4, a: "#3e0c0c", b: "#7a6a58", fade: .5 });
    s += R.bulbWire(k, [300, 480], [700, 470], 26, 9, { r: 3, red: true, dead: 3 });
    /* something waits in the doorway of the big top */
    s += '<circle cx="551" cy="520" r="1.8" fill="#ffe9a8"/><circle cx="560" cy="520" r="1.8" fill="#ffe9a8"/><circle cx="572" cy="528" r="1.6" fill="#ff3b2f"/><circle cx="580" cy="528" r="1.6" fill="#ff3b2f"/>';
    /* low haze: puts the carnival far behind */
    s += '<defs><linearGradient id="' + k.id("haze") + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1612" stop-opacity="0"/><stop offset=".7" stop-color="#5a1612" stop-opacity=".55"/><stop offset="1" stop-color="#2a0b0d" stop-opacity=".7"/></linearGradient></defs>';
    s += '<rect x="0" y="470" width="1200" height="78" fill="' + k.url("haze") + '"/>';
    /* floor: wet, reflecting */
    s += P("M0,545 H1200 V700 H0Z", k.url("floor"));
    s += P("M0,545 H1200", "none", INK, 3);
    /* the big top, broken up in the wet floor */
    var rf = "", rr = "";
    for (var ry = 556; ry < 690; ry += 8) {
      var wv = 150 - (ry - 556) * .75, jx = (ry % 16 ? 7 : -5), wr = wv * .38;
      rf += "M" + (560 - wv / 2 + jx).toFixed(0) + "," + ry + " h" + wv.toFixed(0) + " ";
      rr += "M" + (560 - wr / 2 - jx).toFixed(0) + "," + (ry + 3) + " h" + wr.toFixed(0) + " ";
    }
    s += P(rf, "none", "#b8a888", 2, 'opacity=".1"') + P(rr, "none", "#c0221b", 3, 'opacity=".32"');
    /* the slick */
    s += P("M640,655 C700,628 900,626 990,646 C1060,664 1000,690 900,694 C800,698 600,690 640,655Z", "#4a0a0c", null, 0, 'opacity=".95"');
    s += P("M700,660 C780,648 880,648 940,660", "none", "#c0221b", 2.5, 'opacity=".5"');
    s += '<ellipse cx="952" cy="664" rx="12" ry="4" fill="#fff4cc" opacity=".85"/>' + R.glow(k, 952, 664, 40, .5);
    s += '<ellipse cx="952" cy="664" rx="26" ry="6" fill="none" stroke="#e85a4a" stroke-width="1.6" opacity=".6"/><ellipse cx="952" cy="664" rx="42" ry="10" fill="none" stroke="#c0221b" stroke-width="1.4" opacity=".45"/>';
    s += P("M560,684 C610,676 650,676 700,682", "none", "#4a0a0c", 6, 'opacity=".7"') + P("M470,692 C520,686 560,688 590,692", "none", "#4a0a0c", 4, 'opacity=".5"');   /* mop trail, back toward the tent */
    /* the bulb */
    s += P("M830,0 L830,150", "none", "#2a2020", 3);
    s += R.glow(k, 830, 170, 420, .55) + R.glow(k, 830, 170, 120, .9);
    s += P("M818,150 h24 v14 h-24Z", "#555", INK, 2) + '<ellipse cx="830" cy="178" rx="15" ry="18" fill="#fff4cc" stroke="' + INK + '" stroke-width="2"/>';
    /* light cone */
    s += P("M816,180 L844,180 L1080,680 L590,680Z", "#ffe9a8", null, 0, 'opacity=".07"');
    /* Rusty */
    s += '<ellipse cx="830" cy="666" rx="120" ry="16" fill="#000" opacity=".7"/>';
    s += R.person(k, { x: 820, y: 662, s: 1.05, pose: "mop", outfit: "eternal", wear: .6, expr: "resigned", turn: -.1, headTilt: 8, light: 1, mopColor: "#8a2a24" });
    /* rim darkness */
    s += R.vignette(k, 1200, 700, .9);
    /* masthead */
    s += '<rect x="24" y="22" width="250" height="58" fill="#8b1414" stroke="' + INK + '" stroke-width="3"/>';
    s += R.sfx("WELLSEE CARNIVAL", 149, 50, 24, { anchor: "middle", fill: "#f6d27a", sw: 2, ls: 2 });
    s += R.sfx("COMICS · No. 4 · 13¢", 149, 72, 16, { anchor: "middle", fill: "#efe4c8", sw: 1.5, ls: 2 });
    /* title */
    s += R.sfx("THE TALE OF", 52, 150, 54, { fill: "#efe4c8", ls: 5, sw: 5 });
    s += '<g transform="rotate(-4 60 300)">' +
      R.sfx("RUSTY", 64, 322, 168, { fill: "#8b1414", stroke: "#8b1414", sw: 0, ls: 6, extra: 'opacity=".9" transform="translate(9,9)"' }) +
      R.sfx("RUSTY", 52, 312, 168, { fill: "#f6d27a", sw: 14, ls: 6 }) + "</g>";
    s += R.sfx("THE JANITOR", 60, 410, 86, { fill: "#efe4c8", sw: 8, ls: 6 });
    s += P("M60,430 H520", "none", "#8b1414", 6);
    return s;
  }
});
