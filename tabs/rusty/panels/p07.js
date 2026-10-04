/* p07: The letter, filling the panel, held in trembling fingers.
   Span 2, viewBox 400x600, mood day, wear 0. */
RUSTY.panel({
  id: "p07", w: 400, h: 600,
  alt: "A lined letter in a son's ballpoint scrawl, held in two trembling thumbs: Dad, Saturday the 14th, noon. Mae's Diner on Route 9. Jess is due in March. I think she should know her grandpa. Danny.",
  captions: [{ at: "tl", text: "Then, ten years later, the mail came.", w: 86 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    s += '<rect width="400" height="600" fill="#5a4a3a"/>' + R.tone(k, "M0,0 H400 V600 H0Z", .3, true);
    /* envelope behind */
    s += '<g transform="rotate(9 220 520)">' + P("M60,440 H380 V600 H60Z", "#e8dcc0", INK, 3) + P("M60,440 L220,530 L380,440", "none", INK, 2.5) +
      '<rect x="320" y="452" width="44" height="50" fill="#9a3030" stroke="' + INK + '" stroke-width="2"/></g>';
    /* letter */
    s += '<g transform="rotate(-3 200 300)">';
    s += P("M40,70 H366 V560 H40Z", "#f7f1e0", INK, 3.5);
    var lines = ""; for (var y = 140; y < 550; y += 40) lines += "M40," + y + " H366 ";
    s += P(lines, "none", "#9ab0d0", 1.6) + P("M80,70 V560", "none", "#d08080", 1.8);
    s += P("M40,70 H366 V560 H40Z", "none", "#d9c9a0", 10, 'opacity=".35"');
    var hand = "font-family=\"Patrick Hand, sans-serif\" fill=\"#1f2f7a\"";
    var txt = [["Dad —", 132, 34], ["Saturday the 14th, noon.", 172, 25], ["Mae's Diner on Route 9.", 212, 25], ["Jess is due in March.", 252, 25],
      ["I think she should", 292, 25], ["know her grandpa.", 332, 25], ["— Danny", 412, 30]];
    txt.forEach(function (t, i) {
      s += '<text x="' + (i === 6 ? 200 : 92) + '" y="' + (t[1] - 6) + '" ' + hand + ' font-size="' + t[2] + '" transform="rotate(' + (i % 2 ? -.6 : .5) + ' 200 ' + t[1] + ')">' + R.esc(t[0]) + "</text>";
    });
    s += P("M150,260 C190,250 240,256 268,252", "none", "#1f2f7a", 1.5, 'opacity=".5"');   /* crossed-out restart */
    s += '<text x="92" y="374" ' + hand + ' font-size="20" opacity=".55" text-decoration="line-through">I\'m sorry I never</text>';
    s += '<circle cx="300" cy="470" r="16" fill="#c9b07a" opacity=".35"/>';                /* old coffee ring / tear */
    s += "</g>";
    /* trembling thumbs at the bottom corners */
    s += R.fist(k, { x: 40, y: 540, s: 1.05, rot: -60, sleeve: "#7f8b6c", ring: true });
    s += R.fist(k, { x: 372, y: 534, s: 1.05, rot: 60, flip: -1, sleeve: "#7f8b6c" });
    s += P("M10,470 l-8,-8 M20,456 l-4,-12 M390,460 l8,-8 M378,446 l4,-12", "none", "#efe4c8", 3);
    s += R.vignette(k, 400, 600, .45);
    return s;
  }
});
