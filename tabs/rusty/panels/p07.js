/* p07: The letter, filling the panel, held in trembling fingers.
   Span 2, viewBox 400x600, mood day, wear 0.
   Hands are a local helper: the hand sits BEHIND the sheet (only what clears the paper edge shows),
   the thumb lies on the FRONT and dents the paper. Tremble = offset ghost contours. */
RUSTY.panel({
  id: "p07", w: 400, h: 600,
  alt: "A lined letter in a son's ballpoint scrawl, held up close in two trembling hands, thumbs pressing the paper: Dad, Saturday the 14th, noon. Mae's Diner on Route 9. Jess is due in March. I think she should know her grandpa. Danny. A started line, I'm sorry I never, is crossed out. A tear has fallen on the word grandpa. Below it, the torn-open envelope on the kitchen table.",
  captions: [{ at: "tl", text: "Then, ten years later, the mail came.", w: 80 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    var SK = "#e2b48f", SKD = R.mix(SK, "#6a3a30", .38), SLV = "#7f8b6c";

    /* Hand behind the sheet. Local frame: paper occupies x>0, y<0 (we hold its lower-left corner at 0,0). */
    function behind(o) {
      var g = "";
      g += P("M-120,240 L-150,120 C-120,90 -80,80 -60,90 L-30,240Z", SLV, INK, 4);                              /* sleeve */
      g += P("M-60,96 C-80,70 -82,30 -70,-10 C-62,-40 -48,-70 -30,-96 C-22,-108 -6,-108 -2,-96 L60,-60 L60,40 C30,70 0,100 -20,110 C-40,120 -56,112 -60,96Z", SK, INK, 4.5);
      g += P("M-58,-62 C-48,-70 -40,-70 -34,-62 M-66,-18 C-56,-26 -46,-24 -40,-16", "none", SKD, 2);              /* knuckle creases on the index side */
      g += P("M-30,-96 C-26,-86 -24,-76 -24,-66", "none", INK, 1.8);
      g += R.tone(k, "M-60,96 C-80,70 -82,30 -70,-10 C-66,10 -60,50 -40,96Z", .4);
      return '<g transform="translate(' + f(o.x) + "," + f(o.y) + ") rotate(" + f(o.rot || 0) + ") scale(" + f(o.flip || 1) + ',1)">' + g + "</g>";
    }
    /* Thumb in front, pressing the paper. */
    function thumb(o) {
      var g = "", d = "M-74,104 C-68,62 -42,26 -10,2 C10,-14 32,-30 54,-32 C78,-34 88,-10 74,6 C62,20 40,30 22,44 C4,60 -8,82 -10,106Z";
      g += P("M44,-34 C60,-40 76,-30 84,-20 M40,-14 C52,0 64,8 80,10", "none", "#b8ae94", 1.6);              /* paper dent radiating from the pad */
      g += P(d, "none", INK, 2, 'opacity=".3" transform="translate(4,-3)"');                                    /* tremble ghost */
      g += P(d, SK, INK, 4.5);
      g += P("M50,-26 C62,-30 74,-26 76,-16 C76,-6 68,-2 58,-4 C50,-8 48,-18 50,-26Z", "#efcbb0", INK, 2);     /* nail */
      g += P("M10,0 q8,10 6,22 M18,-6 q6,8 6,16", "none", INK, 2) + P("M-40,64 C-26,44 -8,30 12,20", "none", SKD, 2);
      g += R.tone(k, "M-30,106 C-24,78 -8,54 16,38 C38,24 60,12 72,0 L76,6 C62,20 40,30 22,44 C4,60 -8,82 -10,106Z", .45);
      return '<g transform="translate(' + f(o.x) + "," + f(o.y) + ") rotate(" + f(o.rot || 0) + ") scale(" + f(o.flip || 1) + ',1)">' + g + "</g>";
    }

    /* ---------- kitchen table under a lamp ---------- */
    s += '<rect width="400" height="600" fill="#5a3e2a"/>';
    var gr = ""; for (var y = 10; y < 600; y += 22) gr += "M0," + y + " C120," + (y + 8) + " 260," + (y - 8) + " 400," + (y + 4) + " ";
    s += P(gr, "none", "#4a3220", 3) + P("M0,190 H400 M0,404 H400", "none", "#2a1a10", 3);
    s += R.glow(k, 320, 40, 420, .5);
    s += R.tone(k, "M0,0 H400 V600 H0Z", .25, true);
    /* the envelope, torn open */
    s += '<g transform="rotate(12 250 520)">' + P("M90,440 H420 V620 H90Z", "#e8dcc0", INK, 3) +
      P("M90,440 L130,452 L150,442 L176,456 L200,444 L232,458 L260,446 L290,456 L330,444 L360,456 L420,446", "none", INK, 2.5) +
      '<rect x="356" y="466" width="46" height="54" fill="#3d5a8a" stroke="' + INK + '" stroke-width="2"/>' + P("M362,472 h34 v42 h-34Z", "none", "#efe9da", 1.5, 'stroke-dasharray="3 2"') +
      '<circle cx="350" cy="492" r="24" fill="none" stroke="#3a3a3a" stroke-width="2" opacity=".6"/>' + P("M310,486 h80 M310,494 h80 M310,502 h80", "none", "#3a3a3a", 1.5, 'opacity=".5"') +
      '<text x="170" y="520" font-family="Patrick Hand, sans-serif" font-size="20" fill="#1f2f7a">Russell Pruitt</text>' +
      '<text x="170" y="544" font-family="Patrick Hand, sans-serif" font-size="17" fill="#1f2f7a">14 Alder Ct. Apt 2</text></g>';

    /* ---------- the letter, held up close ---------- */
    s += '<g transform="rotate(-3 200 300)">';
    s += behind({ x: 40, y: 470 }) + behind({ x: 366, y: 470, flip: -1 });
    s += P("M40,60 H366 V560 H40Z", "#000", null, 0, 'opacity=".3" transform="translate(8,10)"');
    s += P("M40,60 H366 V560 H40Z", "#f7f1e0", INK, 3.5);
    var lines = ""; for (var y2 = 130; y2 < 555; y2 += 40) lines += "M40," + y2 + " H366 ";
    s += P(lines, "none", "#9ab0d0", 1.6) + P("M80,60 V560", "none", "#d08080", 1.8);
    /* folded in thirds: creases catch the light */
    s += P("M40,226 C140,222 260,230 366,224", "none", "#fffaf0", 3) + P("M40,229 C140,225 260,233 366,227", "none", "#b8ab8c", 1.6);
    s += P("M40,394 C140,398 260,390 366,396", "none", "#fffaf0", 3) + P("M40,397 C140,401 260,393 366,399", "none", "#b8ab8c", 1.6);
    s += R.tone(k, "M40,229 H366 V394 H40Z", .06);
    s += P("M40,60 H366 V560 H40Z", "none", "#d9c9a0", 10, 'opacity=".35"');
    var hand = "font-family=\"Patrick Hand, sans-serif\" fill=\"#1f2f7a\"";
    var txt = [["Dad —", 122, 34], ["Saturday the 14th, noon.", 162, 25], ["Mae's Diner on Route 9.", 202, 25], ["Jess is due in March.", 242, 25],
      ["I think she should", 282, 25], ["know her grandpa.", 322, 25], ["— Danny", 402, 30]];
    txt.forEach(function (t, i) {
      s += '<text x="' + (i === 6 ? 200 : 92) + '" y="' + (t[1] - 6) + '" ' + hand + ' font-size="' + t[2] + '" transform="rotate(' + (i % 2 ? -.6 : .5) + ' 200 ' + t[1] + ')">' + R.esc(t[0]) + "</text>";
    });
    s += P("M150,250 C190,240 240,246 268,242", "none", "#1f2f7a", 1.5, 'opacity=".5"');
    s += '<text x="92" y="364" ' + hand + ' font-size="20" opacity=".55" text-decoration="line-through">I\'m sorry I never</text>';
    s += P("M90,358 C120,352 160,362 190,354 C210,350 230,360 250,354", "none", "#1f2f7a", 2.2, 'opacity=".7"');   /* scribbled out */
    /* a tear on "grandpa": wet blot, the ink bleeding */
    s += '<ellipse cx="218" cy="310" rx="20" ry="16" fill="#b9c4cc" opacity=".45"/><ellipse cx="216" cy="312" rx="12" ry="9" fill="#5a6aa8" opacity=".25"/>';
    s += P("M200,300 c6,-6 14,-8 22,-6", "none", "#fff", 2, 'opacity=".7"');
    s += thumb({ x: 40, y: 470 }) + thumb({ x: 366, y: 470, flip: -1 });
    s += "</g>";
    /* the tremble: ghost edges and shake ticks */
    s += P("M26,300 l-10,-2 M22,330 l-12,2 M380,290 l10,-4 M384,320 l12,0", "none", "#efe4c8", 3);
    s += '<g transform="rotate(-3.8 200 300) translate(-3,2)">' + P("M40,60 V560", "none", "#efe4c8", 1.5, 'opacity=".5"') + P("M366,60 V560", "none", "#efe4c8", 1.5, 'opacity=".5"') + "</g>";
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
