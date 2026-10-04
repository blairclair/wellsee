/* p18: The wooden rabbit on the outside windowsill, beside a scrap of paper: "for the baby".
   In the glass behind, faint: the road, and a small stooped man already walking away, tall shapes in step.
   Span 2, viewBox 400x600, mood noon. */
RUSTY.panel({
  id: "p18", w: 400, h: 600,
  alt: "On the diner's chrome outside windowsill, in hard noon sun, sits the little hand-carved wooden rabbit, knife marks still on it, beside a torn scrap of paper that says, in shaky pencil, for the baby. The newspaper it was wrapped in lies crumpled beside them. Through the glass, the warm blur of the diner and Danny in his booth. Faint on the glass, reflected: the road behind, and a small stooped man in a brown suit walking away, three tall pale shapes falling in step behind him.",
  captions: [{ at: "tl", text: "He'd done the one thing he came here to do.", w: 88 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, s = "";
    s += '<defs><clipPath id="' + k.id("glass") + '"><path d="M0,0 H400 V404 H0Z"/></clipPath>' +
      '<filter id="' + k.id("ghost") + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .14  0 0 0 0 .12  0 0 0 0 .14  0 0 0 1 0"/></filter>' +
      '<linearGradient id="' + k.id("sill") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f0f0ea"/><stop offset="1" stop-color="#a8a8a0"/></linearGradient></defs>';

    /* ---------- the glass: warm inside, Danny small in his booth ---------- */
    s += '<g clip-path="' + k.url("glass") + '">';
    s += '<rect width="400" height="404" fill="#7a4a30"/>' + R.glow(k, 250, 120, 220, .7);
    var pan = ""; for (var x = 14; x < 400; x += 34) pan += "M" + x + ",0 V236 ";
    s += P(pan, "none", "#6a3e28", 4, 'opacity=".7"') + P("M0,236 H400 V246 H0Z", "#8a5a38");
    s += P("M250,0 V96", "none", INK, 2.5) + P("M222,120 L240,96 H260 L278,120Z", "#2e5a4a", INK, 3) + '<ellipse cx="250" cy="122" rx="14" ry="5" fill="#fff4cc"/>' + R.glow(k, 250, 150, 130, .6);
    s += P("M40,60 H170 V160 H40Z", "#1e1a18", INK, 3) + P("M54,84 H150 M54,104 H136 M54,124 H156 M54,144 H128", "none", "#e8e0c8", 4, 'opacity=".35"');
    s += P("M150,250 C150,226 360,226 360,250 V404 H150Z", "#a3342c", INK, 3);
    s += R.person(k, { x: 262, y: 520, s: .62, ch: "danny", outfit: "danny", pose: "sit", expr: "neutral", turn: .2, light: -1, look: -1 });
    s += P("M180,400 H380 V404 H180Z", "#efe9da");
    s += '<rect width="400" height="404" fill="#e8d0a0" opacity=".38"/>';
    /* reflection: road behind him, and Rusty walking away, the Unwilling in step */
    s += P("M0,300 H400 V404 H0Z", "#8a8a8a", null, 0, 'opacity=".3"') + P("M0,352 H400", "none", "#f0d870", 3, 'stroke-dasharray="22 18" opacity=".5"');
    var ref = 

      R.person(k, { x: 96, y: 330, s: .2, outfit: "suit", pose: "walk", stoop: 14, flip: -1, lw: 6 }) +
      R.player(k, { x: 40, y: 340, s: .23, variant: 0, pose: "stand", lw: 6 }) + R.player(k, { x: 150, y: 342, s: .24, variant: 2, pose: "stand", lw: 6 }) + R.player(k, { x: 6, y: 352, s: .26, variant: 1, pose: "stand", lw: 6 });
    s += '<g opacity=".34" filter="' + k.url("ghost") + '">' + ref + "</g>";
    s += P("M20,0 L110,0 L20,260Z M140,0 L156,0 L20,380 L20,350Z", "#fff", null, 0, 'opacity=".22"');
    s += "</g>";
    s += P("M0,404 H400", "none", INK, 4);

    /* ---------- the sill: chrome, its top surface seen from just above ---------- */
    s += P("M0,404 H400 V480 H0Z", k.url("sill"), INK, 4);
    s += P("M0,480 H400 V600 H0Z", "#9a9a92", INK, 3);
    var ch = ""; for (var y = 492; y < 600; y += 13) ch += "M0," + y + " H400 ";
    s += P(ch, "none", "#7a7a74", 2) + P(ch.replace(/M0,(\d+)/g, function (m, yy) { return "M0," + (+yy + 3); }), "none", "#d0d0c8", 1.2, 'opacity=".6"');
    s += P("M0,412 H400", "none", "#fff", 2, 'opacity=".8"');
    s += '<circle cx="20" cy="470" r="3" fill="#7a7a74" stroke="' + INK + '" stroke-width="1.2"/><circle cx="380" cy="470" r="3" fill="#7a7a74" stroke="' + INK + '" stroke-width="1.2"/>';

    /* newspaper, crumpled, right */
    s += '<ellipse cx="338" cy="452" rx="58" ry="7" fill="#000" opacity=".3"/>';
    s += P("M282,450 L300,420 L332,428 L350,408 L388,424 L394,452 L360,458 L320,456Z", "#d9d0b8", INK, 2.5) + P("M306,430 h28 M300,440 h44 M352,422 h26 M346,444 h36", "none", "#7a7468", 1.5) + P("M332,428 L326,454 M350,408 L360,458", "none", "#9a9070", 1.5);
    s += R.tone(k, "M350,408 L388,424 L394,452 L360,458Z", .3);

    /* the note: torn scrap, shaky pencil */
    s += '<ellipse cx="216" cy="470" rx="80" ry="5" fill="#000" opacity=".3"/>';
    s += P("M140,446 L292,440 L294,452 L288,458 L296,466 L144,474 L138,462 L144,456Z", "#f7f1e0", INK, 2.5);
    s += P("M150,452 L280,447 M152,464 L284,459", "none", "#a8c4d8", 1, 'opacity=".6"');
    s += '<text x="217" y="465" text-anchor="middle" font-family="Patrick Hand, sans-serif" font-size="22" fill="#3a3a44" transform="rotate(-2.5 217 460)">for the baby</text>';

    /* the rabbit: smaller, so the note reads; hard noon shadow straight down; knife facets */
    s += '<ellipse cx="96" cy="452" rx="62" ry="8" fill="#000" opacity=".45"/>';
    s += R.woodRabbit(k, { x: 92, y: 450, s: 1.55 });
    s += '<g transform="translate(92,450) scale(1.55)">' +
      P("M-22,-28 l8,-6 M-8,-34 l9,2 M4,-30 l8,8 M-26,-10 l6,-8 M16,-8 l6,6 M24,-44 l6,-4 M36,-38 l4,6", "none", "#6a4220", 1.2, 'opacity=".85"') +
      P("M-28,-20 C-26,-32 -12,-38 2,-36", "none", "#e8c08a", 2, 'opacity=".7"') + P("M14,-46 C18,-54 26,-56 32,-52", "none", "#e8c08a", 1.6, 'opacity=".7"') +
      "</g>";
    /* a few curls of shaving he missed */
    s += P("M160,440 c4,-6 10,-4 8,2 c-2,4 -8,2 -6,-2 M44,446 c3,-5 9,-3 7,2", "none", "#c08a52", 2);
    s += R.vignette(k, 400, 600, .5);
    return s;
  }
});
