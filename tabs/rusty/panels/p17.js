/* p17: SILENT. Rusty's hand on the diner door handle, fingers uncurling. He lets go.
   Span 2, viewBox 400x600, mood noon, wear 0. */
RUSTY.panel({
  id: "p17", w: 400, h: 600,
  alt: "Silent close-up: Rusty's hand on the chrome handle of the diner door, beside a sign that says PULL. His fingers are uncurling. He is letting go.",
  captions: [],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, s = "";
    /* door glass with warm interior blur */
    s += '<rect width="400" height="600" fill="#d9a870"/>';
    s += R.glow(k, 120, 200, 200, .5) + '<circle cx="60" cy="380" r="70" fill="#8a2a24" opacity=".5"/><circle cx="140" cy="300" r="40" fill="#45627a" opacity=".45"/>';
    s += P("M0,0 H40 V600 H0Z M360,0 H400 V600 H360Z", "#c9c9c0", INK, 4);
    s += P("M40,0 L120,0 L40,260Z", "#fff", null, 0, 'opacity=".3"');
    /* PULL sticker + OPEN sign */
    s += '<rect x="70" y="60" width="110" height="44" fill="#efe9da" stroke="' + INK + '" stroke-width="3"/>' + R.sfx("PULL", 125, 95, 32, { anchor: "middle", fill: "#a3171c", stroke: "#efe9da", sw: 0 });
    s += '<rect x="210" y="40" width="130" height="56" rx="8" fill="#1a1a20" stroke="' + INK + '" stroke-width="3"/>' + R.sfx("OPEN", 275, 82, 36, { anchor: "middle", fill: "#ff7aa0", stroke: "#a3175a", sw: 1.5 });
    /* the handle */
    s += P("M250,140 h14 v330 h-14Z", "#9a9a92", INK, 3) + R.limb([[257, 160], [300, 170], [300, 450], [257, 460]], 16, "#d8d8d0", 3);
    s += P("M296,180 V440", "none", "#fff", 4, 'opacity=".7"');
    /* hand, half-open, sliding away */
    s += R.openHand(k, { x: 236, y: 330, s: 1.45, rot: 96, curl: .55, sleeve: "#6c4f37", ring: true });
    s += P("M150,250 l-30,-6 M150,290 l-40,0 M150,330 l-30,6", "none", INK, 2.5, 'opacity=".6"');
    s += R.vignette(k, 400, 600, .55);
    return s;
  }
});
