/* p09: Saturday dawn. School parking lot; on the hill where the cornfield was, a carnival lit in daylight.
   Span 6, viewBox 1200x600, mood dawn, wear 0.
   Rusty is seen from behind (no face drawn): model proportions, colours from R.CH.rusty / R.OUTFIT.work.
   The carnival's light is the wrong light: it is brighter than the dawn, it throws coloured beams into a
   morning sky, and it rims Rusty from the front. The dead light pole at the far end of the lot is empty
   here; in p13 one of the Unwilling stands under it. */
RUSTY.panel({
  id: "p09", w: 1200, h: 600,
  alt: "Saturday dawn in the school parking lot. Seen from behind, Rusty stands beside his rusted pickup, thermos hanging from one hand, staring at the hill beyond town. Where there was only a cornfield yesterday, a whole carnival blazes on the hilltop in the daylight: a striped big top, a Ferris wheel strung with bulbs, searchlight beams of red, gold and green sweeping a morning sky. Its light rims him in gold and turns the school windows red. At the far end of the lot a dead light pole stands empty. Crickets still chirp in the grass.",
  captions: [{ at: "tl", text: "Saturday. Dawn.", w: 24 }],
  balloons: [],
  draw: function (k, R) {
    var P = R.P, INK = R.INK, f = R.f, mix = R.mix, s = "";
    var GOLD = "#f6d27a", BLOOD = "#c0221b", POISON = "#8fe04a";
    var of = R.OUTFIT.work, ch = R.CH.rusty;
    var skin = ch.skin, hair = mix(ch.hair, "#dcd8cf", ch.grey), shirt = of.shirt, pants = of.pants;

    s += "<defs>" +
      '<linearGradient id="' + k.id("sky") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#23233f"/><stop offset=".38" stop-color="#5a4a6e"/><stop offset=".66" stop-color="#c98a7a"/><stop offset=".86" stop-color="#efc191"/><stop offset="1" stop-color="#f6dcaa"/></linearGradient>' +
      '<radialGradient id="' + k.id("green") + '"><stop offset="0" stop-color="#c8ff8a" stop-opacity=".9"/><stop offset=".4" stop-color="' + POISON + '" stop-opacity=".4"/><stop offset="1" stop-color="' + POISON + '" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + k.id("lot") + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5d5560"/><stop offset="1" stop-color="#2e2a31"/></linearGradient>' +
      '<linearGradient id="' + k.id("sheen") + '" x1="1" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff7a3d" stop-opacity=".55"/><stop offset=".5" stop-color="' + GOLD + '" stop-opacity=".18"/><stop offset="1" stop-color="' + GOLD + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + k.id("rim") + '" x1="0" x2="1" y1="0" y2="0"><stop offset=".55" stop-color="#ffd76a" stop-opacity="0"/><stop offset=".86" stop-color="#ffd76a" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c0" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="' + k.id("beam") + '" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="' + k.id("glass") + '"><rect x="18" y="214" width="214" height="200"/></clipPath>' +
      "</defs>";

    /* ---- sky: an ordinary dawn, and something brighter than it ---- */
    s += '<rect width="1200" height="600" fill="' + k.url("sky") + '"/>';
    s += R.tone(k, "M0,0 H1200 V170 H0Z", .18);
    /* the wrong bloom over the hill */
    s += R.glow(k, 860, 330, 460, .55, true);
    s += '<circle cx="1010" cy="300" r="260" fill="' + k.url("green") + '" opacity=".35"/>';
    s += R.glow(k, 830, 320, 300, .85);
    /* searchlights in a morning sky: red, gold, green */
    [[780, 300, -128, 12, BLOOD, .38], [850, 296, -98, 9, GOLD, .45], [960, 300, -64, 10, POISON, .32], [1040, 304, -40, 8, BLOOD, .3], [720, 304, -150, 8, POISON, .22]].forEach(function (b) {
      var a = b[2] * Math.PI / 180, L = 760, sp = b[3] * Math.PI / 180 / 2;
      var p1 = [b[0] + Math.cos(a - sp) * L, b[1] + Math.sin(a - sp) * L], p2 = [b[0] + Math.cos(a + sp) * L, b[1] + Math.sin(a + sp) * L];
      s += '<path d="M' + b[0] + "," + b[1] + " L" + f(p1[0]) + "," + f(p1[1]) + " L" + f(p2[0]) + "," + f(p2[1]) + 'Z" fill="' + b[4] + '" opacity="' + b[5] + '"/>';
    });
    /* a few pale stars still out, cloud bars lit wrong from below */
    s += '<g fill="#f3ead8" opacity=".7"><circle cx="90" cy="40" r="1.6"/><circle cx="330" cy="70" r="1.3"/><circle cx="520" cy="30" r="1.8"/><circle cx="1150" cy="56" r="1.4"/><circle cx="700" cy="88" r="1.1"/></g>';
    s += P("M680,150 C730,140 790,142 840,150 C800,156 740,158 680,150Z M880,118 C960,104 1080,108 1160,122 C1080,128 960,128 880,118Z", "#4a3a5a", null, 0, 'opacity=".75"');
    s += P("M690,152 C740,148 790,150 830,152 M900,122 C980,116 1080,118 1150,124", "none", "#ff8a5a", 2.5, 'opacity=".8"');

    /* ---- the hill: last night a cornfield ---- */
    s += P("M520,404 C640,330 780,292 900,290 C1010,288 1120,310 1200,334 V420 H520Z", "#3d2c3f", INK, 3);
    /* flattened corn rows sweeping in toward the carnival */
    var rows = "";
    for (var i = 0; i < 16; i++) {
      var bx = 540 + i * 44, by = 418 - Math.max(0, 40 - Math.abs(i - 8) * 4);
      rows += "M" + bx + ",418 Q" + f(bx + (880 - bx) * .4) + "," + f(by - 30) + " " + f(880 + (bx - 880) * .45) + "," + f(318 + Math.abs(bx - 880) * .05) + " ";
    }
    s += P(rows, "none", "#6a5a3a", 2, 'opacity=".55"');
    s += P("M560,404 l4,-14 l3,14 M600,396 l3,-12 l4,12 M1150,350 l3,-14 l4,14 M1110,342 l3,-12 l3,12", "none", "#8a7a4a", 2);
    s += R.tone(k, "M520,404 C640,330 780,292 900,290 L900,420 H520Z", .3);

    /* ---- the carnival ---- */
    s += R.ferris(k, { x: 1010, y: 168, s: .6, color: "#1c0f1a", car: "#7a1414", lights: true });
    /* extra bulbs on the wheel: red, gold, poison green, with halos */
    for (var j = 0; j < 24; j++) {
      var aa = j / 24 * Math.PI * 2, rx = 1010 + Math.cos(aa) * 90, ry = 168 + Math.sin(aa) * 90, col = [GOLD, BLOOD, POISON][j % 3];
      s += '<circle cx="' + f(rx) + '" cy="' + f(ry) + '" r="9" fill="' + col + '" opacity=".35"/><circle cx="' + f(rx) + '" cy="' + f(ry) + '" r="2.6" fill="#fff6d0"/>';
    }
    s += R.bigTop(k, { x: 850, y: 300, s: .5, a: "#a3171c", b: "#efe4c8", flag: "#8fe04a" });
    s += R.glow(k, 850, 282, 40, .9);
    s += R.bigTop(k, { x: 720, y: 314, s: .24, a: "#6a1428", b: "#d8c8a8" });
    s += R.bigTop(k, { x: 1120, y: 318, s: .2, a: "#2a5a1a", b: "#e8dcb4" });
    /* helter-skelter tower, booths */
    s += P("M940,300 L952,214 L964,300Z", "#2a1a24", INK, 2) + P("M942,288 L962,270 M944,268 L960,252 M946,248 L958,234", "none", GOLD, 2.5);
    s += P("M660,322 h40 v-16 l-20,-10 l-20,10Z M760,316 h30 v-14 l-15,-8 l-15,8Z", "#2a1a24", INK, 2);
    /* bulb strings from the big top's peak */
    s += R.bulbWire(k, [850, 150], [680, 300], 10, 9, { r: 2.6 });
    s += R.bulbWire(k, [850, 150], [1000, 300], 10, 9, { r: 2.6, red: true, color: "#ffb08a" });
    s += R.bulbWire(k, [690, 312], [1170, 316], 16, 26, { r: 2.4 });

    /* ---- town in between ---- */
    s += P("M0,420 V352 h70 v-22 h44 v22 h48 v-46 l18,-22 l18,22 v46 h66 v-20 h50 v20 h40 v-40 h12 l6,-34 l6,34 h12 v40 h70 v-28 h80 v28 h40 v-18 h62 v18 h70 v-26 h86 v26 h110 v-12 h120 v12 h150 v68Z", "#2c2434", INK, 2);
    /* water tower */
    s += P("M612,326 V290 M648,326 V290 M606,290 C606,262 654,262 654,290Z", "#2c2434", INK, 2.5) + P("M600,268 L630,250 L660,268Z", "#2c2434", INK, 2);
    s += '<g fill="#f6d27a" opacity=".85"><rect x="84" y="340" width="6" height="8"/><rect x="250" y="362" width="6" height="8"/><rect x="452" y="360" width="6" height="8"/><rect x="792" y="378" width="6" height="8"/><rect x="1020" y="380" width="6" height="8"/></g>';
    /* the far edge of the lot: chain-link and a curb */
    s += P("M0,420 H1200", "none", INK, 3);
    var fence = ""; for (var fx = 470; fx < 1200; fx += 34) fence += "M" + fx + ",420 V398 ";
    s += P(fence + "M470,400 H1200", "none", "#3a3440", 2.5);

    /* ---- school, its windows full of the wrong light ---- */
    s += P("M0,196 H246 V432 H0Z", "#8a5a42", INK, 4);
    var brick = ""; for (var by2 = 212; by2 < 432; by2 += 14) { brick += "M0," + by2 + " H246 "; for (var bxx = ((by2 / 14) % 2) * 18; bxx < 246; bxx += 36) brick += "M" + bxx + "," + by2 + " v14 "; }
    s += P(brick, "none", "#5a3628", 1.2, 'opacity=".55"');
    s += P("M0,186 H258 V202 H0Z", "#5a3a2e", INK, 3);
    s += R.tone(k, "M0,196 H246 V432 H0Z", .35);
    for (var wi = 0; wi < 3; wi++) for (var wj = 0; wj < 2; wj++) {
      var wx = 22 + wi * 76, wy = 224 + wj * 92;
      s += '<rect x="' + wx + '" y="' + wy + '" width="54" height="64" fill="#3a1a22" stroke="' + INK + '" stroke-width="3"/>';
      /* the glass throws back the carnival: red, then gold, a sliver of green */
      s += P("M" + (wx + 54) + "," + wy + " L" + (wx + 20) + "," + (wy + 64) + " L" + (wx + 54) + "," + (wy + 64) + "Z", BLOOD, null, 0, 'opacity=".75"');
      s += P("M" + (wx + 54) + "," + (wy + 6) + " L" + (wx + 34) + "," + (wy + 64) + " L" + (wx + 44) + "," + (wy + 64) + " L" + (wx + 54) + "," + (wy + 30) + "Z", GOLD, null, 0, 'opacity=".8"');
      s += P("M" + (wx + 6) + "," + (wy + 4) + " L" + (wx + 12) + "," + (wy + 4) + " L" + (wx + 4) + "," + (wy + 30) + "Z", POISON, null, 0, 'opacity=".5"');
      s += P("M" + (wx + 27) + "," + wy + " V" + (wy + 64) + " M" + wx + "," + (wy + 32) + " H" + (wx + 54), "none", INK, 2.5);
    }
    s += '<text x="123" y="180" text-anchor="middle" font-family="IM Fell English SC, serif" font-size="17" fill="#f3e2c0" stroke="' + INK + '" stroke-width="3" paint-order="stroke">HOLLIS CREEK ELEM.</text>';

    /* ---- the lot ---- */
    s += P("M0,420 H1200 V600 H0Z", k.url("lot"), INK, 3);
    s += P("M1200,420 L1200,470 C900,520 700,560 420,600 L300,600 C620,540 900,470 1200,420Z", k.url("sheen"));
    /* stripes converge on the hill */
    var vp = [900, 400];
    [-260, 40, 340, 640, 980, 1320, 1700].forEach(function (x0) {
      var t = (452 - 600) / (vp[1] - 600), x1 = x0 + (vp[0] - x0) * t;
      s += P("M" + x0 + ",600 L" + f(x1) + ",452", "none", "#e8e0c4", 5, 'opacity=".55"');
    });
    s += P("M0,452 H1200", "none", "#e8e0c4", 3, 'opacity=".35"');
    /* cracks, oil, tar seams */
    s += P("M60,560 l40,-10 l20,14 l36,-6 M700,470 l30,6 l10,-8 l24,4 M980,540 l-30,12 l-12,-8 l-30,10 M820,590 l26,-18 l18,4", "none", INK, 1.8, 'opacity=".6"');
    s += '<ellipse cx="760" cy="520" rx="46" ry="9" fill="#1a1620" opacity=".55"/><ellipse cx="1040" cy="480" rx="30" ry="6" fill="#1a1620" opacity=".5"/>';
    s += R.tone(k, "M0,520 H1200 V600 H0Z", .32);

    /* ---- the dead light pole, empty (in p13 it won't be) ---- */
    s += P("M1094,462 V214 C1094,200 1086,194 1070,194 H1034", "none", INK, 13) + P("M1094,462 V214 C1094,200 1086,194 1070,194 H1034", "none", "#3a3440", 7);
    s += P("M1006,188 h36 l-4,14 h-28Z", "#2a2630", INK, 2.5) + P("M1012,202 h24", "none", "#4a4650", 3);
    s += '<ellipse cx="1094" cy="464" rx="22" ry="5" fill="#1a1620" opacity=".6"/>';
    s += P("M1097,462 V218", "none", "#ffd76a", 2, 'opacity=".6"');

    /* ---- the pickup, three-quarter rear, nose toward the school ---- */
    var tk = "";
    tk += '<ellipse cx="250" cy="520" rx="230" ry="20" fill="#16121a" opacity=".55"/>';
    /* cab side + hood (far) */
    tk += P("M118,346 L50,354 L28,402 L0,404 V478 L118,488Z", "#8a3e22", INK, 4);
    tk += P("M110,356 L60,362 L44,398 L110,396Z", "#4a5468", INK, 3) + P("M70,370 L100,366", "none", "#a8b4c4", 3, 'opacity=".6"');
    tk += P("M0,412 H118", "none", INK, 2);
    /* cab back wall above the bed */
    tk += P("M118,346 L276,340 L282,404 L118,410Z", "#9a4a2a", INK, 4);
    tk += P("M136,354 L262,350 L266,392 L136,396Z", "#3a3448", INK, 3);
    tk += P("M140,360 L200,358 L150,394 L138,394Z", GOLD, null, 0, 'opacity=".45"') + P("M226,352 L260,352 L262,372Z", BLOOD, null, 0, 'opacity=".5"');
    tk += '<rect x="186" y="368" width="34" height="18" fill="#2a2a34" stroke="' + INK + '" stroke-width="2"/>';
    /* bed: far side wall, floor, near side, tailgate */
    tk += P("M118,410 L282,404 L418,418 L232,424Z", "#2a1c1a", INK, 3);
    tk += P("M282,404 L282,420 L418,432 L418,418Z", "#6a2e1a", INK, 2.5);
    /* mop handle and bucket rim in the bed: the job comes home with him */
    tk += R.limb([[236, 336], [300, 420]], 6, "#a07a4a", 2.5) + P("M226,330 h18 v8 h-18Z", "#7a7a72", INK, 2);
    tk += '<ellipse cx="330" cy="416" rx="26" ry="6" fill="#d9a62b" stroke="' + INK + '" stroke-width="2.5"/>';
    /* near side panel, receding left */
    tk += P("M118,410 L232,424 L232,506 L118,490Z", "#a24c26", INK, 4);
    tk += P("M140,492 C140,462 196,462 200,498", "#1a1416", INK, 3);
    tk += '<ellipse cx="170" cy="500" rx="24" ry="30" fill="#1a1a1a" stroke="' + INK + '" stroke-width="4"/><ellipse cx="172" cy="502" rx="10" ry="14" fill="#7a7a72" stroke="' + INK + '" stroke-width="2"/>';
    tk += '<ellipse cx="44" cy="486" rx="20" ry="26" fill="#1a1a1a" stroke="' + INK + '" stroke-width="4"/>';
    /* tailgate, square to us */
    tk += P("M232,424 L418,418 L418,494 L232,502Z", "#b0562c", INK, 4.5);
    tk += P("M244,436 L406,431 L406,484 L244,490Z", "none", "#6a2a14", 2.5);
    tk += P("M300,446 c18,-6 30,8 46,2 c10,-4 18,4 22,12 c-16,8 -40,2 -60,6 c-10,2 -14,-12 -8,-20Z M250,470 c10,-2 18,6 16,14 c-8,2 -18,0 -16,-14Z M380,474 c8,0 14,4 14,10 l-18,2Z", "#5a2412", null, 0, 'opacity=".85"');
    tk += R.tone(k, "M232,470 L418,464 L418,494 L232,502Z", .45);
    tk += '<text x="325" y="462" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="11" letter-spacing="2.5" fill="#e8d8b8" opacity=".6" transform="rotate(-1.6 325 462)">PRUITT &amp; SON HAULING</text>';
    tk += P("M244,450 L244,464 M232,424 v78", "none", INK, 2);
    /* taillights, bumper, tires */
    tk += P("M226,428 L238,428 L238,462 L226,462Z M412,422 L424,422 L424,456 L412,456Z", BLOOD, INK, 2.5);
    tk += P("M218,498 L428,490 L430,510 L216,518Z", "#8a8a84", INK, 3.5) + P("M222,506 L426,498", "none", "#d8d8d0", 2, 'opacity=".6"');
    tk += P("M244,518 h34 v18 h-34Z M368,512 h34 v18 h-34Z", "#141414", INK, 3);
    tk += '<rect x="304" y="502" width="40" height="12" fill="#e8e0c4" stroke="' + INK + '" stroke-width="2"/>';
    /* a rim of carnival light on the truck's far edges */
    tk += P("M276,340 L282,404 M418,418 L418,494", "none", "#ffd76a", 2.5, 'opacity=".75"');
    s += tk;

    /* ---- Rusty, from behind, looking at the hill ---- */
    function backRusty(o) {
      var g = "", lw = 4;
      var legs = R.POSE.stand.legs;
      var arms = [[[-46, -298], [-58, -236], [-58, -170]], [[46, -298], [60, -238], [64, -178]]];
      /* long shadow thrown toward us by the light behind him */
      g += P("M-34,0 L-300,190 L-150,190 L34,0Z", "#120e16", null, 0, 'opacity=".45"');
      legs.forEach(function (L) {
        g += R.limb(L, 34, pants, lw);
        var ft = L[2];
        g += P("M" + f(ft[0] - 17) + "," + f(ft[1] + 9) + " L" + f(ft[0] - 16) + "," + f(ft[1] - 10) + " C" + f(ft[0] - 8) + "," + f(ft[1] - 16) + " " + f(ft[0] + 8) + "," + f(ft[1] - 16) + " " + f(ft[0] + 16) + "," + f(ft[1] - 10) + " L" + f(ft[0] + 17) + "," + f(ft[1] + 9) + "Z", of.boots, INK, lw * .8);
      });
      /* pant creases, back pockets, a red shop rag */
      g += P("M-20,-150 C-22,-110 -18,-70 -20,-30 M20,-150 C22,-110 18,-70 20,-30", "none", INK, 1.6, 'opacity=".4"');
      g += P("M-40,-192 L40,-192 L37,-160 L-37,-160Z", pants, INK, lw * .8);
      g += P("M-34,-178 h24 l-2,26 h-20Z M10,-178 h24 l-2,26 h-20Z", "none", INK, 1.8, 'opacity=".7"');
      g += P("M14,-176 C10,-150 18,-132 12,-112 C20,-116 28,-112 32,-118 C26,-136 32,-154 30,-176Z", "#a3201c", INK, 2.2);
      /* thick neck, behind the shirt */
      g += R.limb([[0, -318], [0, -336]], 42, skin, lw);
      /* shirt from the back: yoke seam, centre pleat, creases pulled to the elbows */
      var torso = "M-46,-305 C-56,-268 -50,-220 -42,-184 L42,-184 C50,-220 56,-268 46,-305 C24,-316 -24,-316 -46,-305Z";
      g += P(torso, shirt, INK, lw);
      g += P("M-46,-282 C-20,-276 20,-276 46,-282", "none", INK, 1.8, 'opacity=".75"');
      g += P("M0,-278 V-200 M-30,-262 C-24,-250 -26,-236 -34,-226 M30,-262 C24,-250 26,-236 34,-226 M-22,-204 C-12,-198 12,-198 22,-204", "none", INK, 1.6, 'opacity=".55"');
      g += P("M-12,-250 C-4,-244 4,-244 12,-250 C8,-238 -8,-238 -12,-250Z", mix(shirt, "#2a2a20", .4), null, 0, 'opacity=".55"');
      g += P(torso, "#1e1626", null, 0, 'opacity=".28"') + R.tone(k, torso, .32);
      g += P(torso, k.url("rim"));
      g += P("M-40,-190 L40,-190", "none", "#1d1612", 8);
      /* keys swing on his right hip (our right, from behind) */
      g += '<circle cx="34" cy="-178" r="7" fill="none" stroke="#b8b1a0" stroke-width="2.5"/>' + P("M30,-172 l-3,13 M35,-171 l1,13 M39,-173 l5,10", "none", "#cfc8b4", 3);
      /* heavy shoulders rising into the neck (trapezius under the shirt), then the collar */
      g += P("M-50,-300 C-40,-314 -28,-322 -18,-326 L18,-326 C28,-322 40,-314 50,-300 C30,-306 -30,-306 -50,-300Z", shirt, null, 0);
      g += P("M-50,-300 C-40,-314 -28,-322 -18,-326 M18,-326 C28,-322 40,-314 50,-300", "none", INK, lw);
      g += P("M18,-326 C28,-322 40,-314 50,-300", "none", "#ffe48a", 2.4, 'opacity=".85"');
      g += P("M-24,-322 C-10,-330 10,-330 24,-322 L22,-312 C8,-317 -8,-317 -22,-312Z", mix(shirt, "#fff", .1), INK, lw * .6);
      /* arms: left hangs with the thermos, right hangs loose, fingers open */
      var thermos = '<g transform="translate(-62,-160) rotate(4)">' + P("M-10,-6 H10 V64 H-10Z", "#3d6a5a", INK, 3) + P("M-10,8 H10 M-10,54 H10", "none", "#2a4a3e", 3) + P("M-12,64 H12 V74 H-12Z", "#9c9586", INK, 2.5) + P("M7,-2 V60", "none", "#ffd76a", 2, 'opacity=".7"') + "</g>";
      g += thermos;
      arms.forEach(function (A, i) {
        var el = A[1], hd = A[2], wr = [hd[0] + (el[0] - hd[0]) * .15, hd[1] + (el[1] - hd[1]) * .15];
        g += R.limb([A[0], el, wr], 24, shirt, lw);
        g += R.limb([[A[0][0] * .9, A[0][1] + 10], [el[0] * .96, el[1]]], 3, "#1e1626", 0);
        if (i === 0) g += P("M-70,-176 C-74,-162 -66,-150 -54,-152 C-46,-156 -46,-170 -52,-176Z", skin, INK, 3.2) + P("M-70,-166 h16 M-70,-158 h16", "none", INK, 1.6, 'opacity=".7"');
        else {
          /* the back of a big, loose hand: knuckles, fingers half open, thumb tucked forward */
          g += P("M52,-184 C48,-170 50,-150 54,-134 C56,-124 62,-122 64,-128 C66,-120 72,-120 74,-128 C78,-124 82,-128 81,-138 C82,-154 80,-170 76,-184Z", skin, INK, 3.4);
          g += P("M58,-150 C58,-142 60,-134 61,-128 M68,-150 C68,-142 69,-134 70,-127", "none", INK, 1.8, 'opacity=".8"');
          g += P("M56,-160 q4,-3 8,0 M66,-160 q4,-3 8,0", "none", mix(skin, "#5a3a3a", .4), 1.8);
          g += P("M76,-184 C80,-170 81,-150 81,-138", "none", "#ffe48a", 2.2, 'opacity=".9"');
        }
      });
      /* rim light down his right side: shoulder, arm, leg */
      g += P("M46,-305 C60,-286 64,-268 64,-246 M74,-232 C78,-210 78,-196 76,-182 M34,-180 C38,-140 38,-100 40,-20", "none", "#ffe48a", 2.6, 'opacity=".9"');
      g += P("M-58,-290 C-66,-270 -70,-250 -68,-232", "none", "#ff8a5a", 2, 'opacity=".6"');
      /* back of the head (no face): Rusty's broad skull and ears, the rust-grey fringe ringing it
         at ear height, bare nape below, three comb-over wisps on top */
      var skull = "M-47,-22 C-49,-70 -26,-82 0,-82 C26,-82 49,-70 47,-22 C48,8 44,32 34,46 C20,54 -20,54 -34,46 C-44,32 -48,8 -47,-22Z";
      var hd = '<g transform="translate(2,-356) scale(.54)">';
      [-1, 1].forEach(function (sd) {
        var ex = sd * 45;
        hd += P("M" + ex + ",-22 C" + (ex + sd * 18) + ",-32 " + (ex + sd * 22) + ",10 " + (ex - sd * 1) + ",16Z", mix(skin, "#c9614a", .3), INK, 5);
        hd += P("M" + (ex + sd * 5) + ",-14 C" + (ex + sd * 12) + ",-16 " + (ex + sd * 12) + ",4 " + (ex + sd * 4) + ",8", "none", INK, 2.4);
      });
      hd += P(skull, skin, INK, 6);
      hd += P(skull, "#2a1a26", null, 0, 'opacity=".2"');
      /* fringe: wraps the back of the skull from ear to ear and runs down to a ragged nape line */
      hd += P("M-48,-32 C-50,-6 -46,24 -36,44 l6,-5 l5,7 l6,-6 l6,7 l6,-6 l7,6 l6,-6 l6,6 l6,-7 l5,5 C46,24 50,-6 48,-32 C40,-22 28,-14 14,-11 C6,-10 -6,-10 -14,-11 C-28,-14 -40,-22 -48,-32Z", hair, INK, 5);
      hd += P("M-40,-12 c2,12 6,24 12,34 M-24,-4 c2,12 4,24 8,36 M-6,-2 c0,12 2,26 4,38 M12,-2 c0,12 -1,26 -3,38 M28,-6 c-2,12 -4,24 -8,34 M42,-14 c-2,12 -6,24 -12,34", "none", mix(hair, INK, .4), 2, 'opacity=".55"');
      hd += P("M-20,-6 c6,2 14,2 20,0", "none", mix(hair, "#fff", .4), 3, 'opacity=".6"');
      hd += P("M-22,-74 C-14,-88 0,-86 6,-74 M-6,-78 C2,-92 16,-90 22,-76 M8,-70 C16,-82 28,-78 32,-66", "none", hair, 4.5);
      hd += P("M-18,-62 C-6,-70 10,-70 20,-62", "none", "#fff6c8", 5, 'opacity=".3"');
      hd += P(skull, k.url("rim"));
      hd += P("M47,-22 C48,8 44,32 34,46 M30,-74 C44,-62 49,-44 47,-24", "none", "#ffe48a", 4, 'opacity=".95"');
      hd += P("M64,-20 C66,-6 62,8 56,14", "none", "#ffe48a", 3, 'opacity=".9"');
      hd += "</g>";
      g += hd;
      return '<g transform="translate(' + o.x + "," + o.y + ") scale(" + o.s + ')">' + g + "</g>";
    }
    s += backRusty({ x: 600, y: 566, s: 1.06 });

    /* ---- crickets in the curb grass, the last sound in town ---- */
    s += P("M0,600 l10,-34 l6,34 l9,-26 l4,26 l12,-40 l6,40 l8,-22 l4,22Z M1100,600 l9,-28 l5,28 l12,-36 l6,36 l10,-24 l4,24 l12,-30 l5,30Z", "#3a4a2a", INK, 2);
    s += R.sfx("chrrr", 30, 548, 24, { fill: "#d8e8a0", rot: -8 }) + R.sfx("chrrr", 1090, 548, 22, { fill: "#d8e8a0", rot: 6 }) + R.sfx("chrrr", 1000, 512, 16, { fill: "#d8e8a0", rot: -4, extra: 'opacity=".8"' });
    s += R.vignette(k, 1200, 600, .45);
    return s;
  }
});
