/* Rusty comic renderer: turns RUSTY.panels (registered by panels/pNN.js) into
   comic panels inside <figure class="panel" data-panel="pNN">.
   Panel files own art + lettering; this file owns lettering layout and tails. */
(function () {
  "use strict";
  var R = window.RUSTY;
  if (!R) return;
  var esc = R.esc;

  function capHTML(c) {
    var at = c.at || "tl", cls = "cap" + (at[1] === "r" ? " r" : at[1] === "c" ? " c" : "") + (c.dark ? " dark" : "");
    return '<p class="' + cls + '"' + (c.w ? ' style="--cw:' + c.w + '%"' : "") + ">" + c.text + "</p>";
  }

  function balHTML(b) {
    var kind = b.kind || "speech", st = "--w:" + (b.w || 30) + ";top:" + b.y + "%;";
    /* anchor from the right when a balloon sits on the right half, so min-width grows inward */
    if ((b.x + (b.w || 30)) > 62) st += "right:" + (100 - b.x - (b.w || 30)) + "%;";
    else st += "left:" + b.x + "%;";
    return '<p class="bal ' + kind + '" style="' + st + '"' +
      (b.tail ? ' data-tx="' + b.tail[0] + '" data-ty="' + b.tail[1] + '"' : "") +
      (b.who ? ' aria-label="' + esc(b.who) + ' says"' : "") + ">" +
      (b.who ? '<span class="who sr-only">' + esc(b.who) + ": </span>" : "") + b.text + "</p>";
  }

  function render(fig) {
    var id = fig.getAttribute("data-panel"), p = R.panels[id];
    if (!p) {
      fig.classList.add("missing");
      fig.innerHTML = '<div class="art" style="--ar:2/1"><span>' + id + "</span></div>";
      return;
    }
    var caps = p.captions || [];
    var top = caps.filter(function (c) { return (c.at || "tl")[0] === "t"; });
    var bot = caps.filter(function (c) { return (c.at || "tl")[0] === "b"; });
    var svg;
    try { svg = R.svg(p); }
    catch (e) { svg = ""; if (window.console) console.error("panel " + id + " failed to draw", e); }
    fig.innerHTML =
      (top.length ? '<div class="caps top">' + top.map(capHTML).join("") + "</div>" : "") +
      '<div class="art" style="--ar:' + p.w + "/" + p.h + '">' + svg +
      '<div class="letters">' + (p.balloons || []).map(balHTML).join("") +
      '<svg class="tails" aria-hidden="true"></svg></div></div>' +
      (bot.length ? '<div class="caps bottom">' + bot.map(capHTML).join("") + "</div>" : "");
    fig.setAttribute("aria-label", "Panel " + id.replace("p", ""));
    if (p.w / p.h >= 1.5) fig.classList.add("wide");
    if (p.phoneStrip) fig.classList.add("strip");
    /* optional per-panel mood (e.g. a dusk panel on a noon page): restyles its captions */
    if (p.mood) fig.setAttribute("data-mood", p.mood);
  }

  /* Balloon tails: wedge from the balloon's edge to the tip, or bubbles for thoughts. */
  function tails(fig) {
    var art = fig.querySelector(".art"), svg = fig.querySelector("svg.tails");
    if (!art || !svg) return;
    var W = art.clientWidth, H = art.clientHeight, out = "";
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    fig.querySelectorAll(".bal[data-tx]").forEach(function (b) {
      var tx = +b.getAttribute("data-tx") / 100 * W, ty = +b.getAttribute("data-ty") / 100 * H;
      var w = b.offsetWidth, h = b.offsetHeight, cx = b.offsetLeft + w / 2, cy = b.offsetTop + h / 2;
      var dx = tx - cx, dy = ty - cy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      var rx = w / 2, ry = h / 2, t = 1 / Math.sqrt((ux / rx) * (ux / rx) + (uy / ry) * (uy / ry));
      var cs = getComputedStyle(b), bg = cs.backgroundColor, ink = cs.borderTopColor;
      if (b.classList.contains("thought")) {
        var ex = cx + ux * (t + 6), ey = cy + uy * (t + 6), rem = Math.hypot(tx - ex, ty - ey);
        [0.0, 0.45, 0.85].forEach(function (k, i) {
          var r = Math.max(3, 9 - i * 3), px = ex + (tx - ex) * k, py = ey + (ty - ey) * k;
          if (rem < 6) return;
          out += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + r + '" fill="' + bg + '" stroke="' + ink + '" stroke-width="2.5"/>';
        });
        return;
      }
      if (t >= L) return; /* tip is inside the balloon */
      var bx = cx + ux * (t - 7), by = cy + uy * (t - 7), px = -uy, py = ux, hw = Math.max(6, Math.min(13, w / 7));
      var a = [bx + px * hw, by + py * hw], c = [bx - px * hw, by - py * hw];
      /* slight curl */
      var m = [(a[0] + tx) / 2 + px * hw * .5, (a[1] + ty) / 2 + py * hw * .5];
      var d = "M" + a[0].toFixed(1) + "," + a[1].toFixed(1) + " Q" + m[0].toFixed(1) + "," + m[1].toFixed(1) + " " + tx.toFixed(1) + "," + ty.toFixed(1) + " L" + c[0].toFixed(1) + "," + c[1].toFixed(1);
      var bw = parseFloat(cs.borderTopWidth) || 2.5;
      out += '<path d="' + d + 'Z" fill="' + bg + '"/>' +
        '<path d="' + d + '" fill="none" stroke="' + ink + '" stroke-width="' + bw + '" stroke-linejoin="round"' + (b.classList.contains("whisper") ? ' stroke-dasharray="5 4"' : "") + "/>";
    });
    svg.innerHTML = out;
  }

  var figs = Array.prototype.slice.call(document.querySelectorAll("figure.panel[data-panel]"));
  figs.forEach(render);
  function allTails() { figs.forEach(tails); }
  allTails();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(allTails);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { tails(e.target); }); });
    figs.forEach(function (f) { ro.observe(f); });
  } else window.addEventListener("resize", allTails);

  /* gentle reveal on scroll */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .05 });
    figs.forEach(function (f) { io.observe(f); });
  }
})();
