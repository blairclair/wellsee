/* Liber Wellsee: small hauntings. Everything here is optional; the book reads without it. */
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var folios = [].slice.call(document.querySelectorAll(".folio"));

  /* deterministic jitter so the hand shakes the same way each visit */
  var seed = 1307;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  /* 1. the scribe's hand grows unsteady (static, not animated) */
  folios.forEach(function (folio) {
    var hand = +folio.getAttribute("data-hand") || 0;
    folio.querySelectorAll(".verse").forEach(function (p) {
      var amp = hand;
      if (p.classList.contains("hand4")) amp = 4;
      if (p.classList.contains("hand5")) amp = 6;
      if (amp < 2) return;
      var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var el = n.parentNode;
          if (el.closest(".turn, .v, .drop, .sr, .char")) return NodeFilter.FILTER_REJECT;
          return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        var frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          var r = (rnd() - 0.5) * 0.9 * amp, y = (rnd() - 0.5) * 0.7 * amp;
          s.style.transform = "rotate(" + r.toFixed(2) + "deg) translateY(" + y.toFixed(2) + "px)";
          if (amp >= 4 && rnd() < 0.18) s.style.opacity = (0.55 + rnd() * 0.3).toFixed(2);
          frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      });
    });
  });

  /* 2. pages settle into place as they arrive */
  if (!reduce && "IntersectionObserver" in window) {
    root.classList.add("js-reveal");
    var settle = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("seen"); settle.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });
    folios.forEach(function (f) { settle.observe(f); });
  }

  /* 3. lines that were not there a moment ago */
  function show(el) { if (el && !el.classList.contains("shown")) el.classList.add("shown"); }
  var lates = [].slice.call(document.querySelectorAll(".late"));
  if ("IntersectionObserver" in window) {
    lates.forEach(function (el) {
      var mode = el.getAttribute("data-late");
      if (mode === "linger") {
        /* appears once the reader has lingered near it for a while */
        var t = null;
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { t = t || setTimeout(function () { show(el); }, 9000); }
            else if (!el.classList.contains("shown")) { clearTimeout(t); t = null; }
          });
        }, { threshold: 0 }).observe(el.closest(".folio"));
      } else if (mode === "return") {
        /* appears only after you have looked away and come back */
        var seenOnce = false, left = false;
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { if (seenOnce && left) show(el); seenOnce = true; }
            else if (seenOnce) left = true;
          });
        }, { threshold: 0 }).observe(el);
      }
    });
    var warn = document.querySelector('[data-late="end"]');
    var end = document.getElementById("f-colophon");
    if (warn && end) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) show(warn); });
      }, { threshold: 0.3 }).observe(end);
    }
  }

  /* 4. words that change if you rest on them too long */
  [].forEach.call(document.querySelectorAll(".turn"), function (el) {
    var timer = null;
    function turn() {
      if (el.classList.contains("moved")) return;
      var alt = el.getAttribute("data-alt");
      if (reduce) { el.textContent = alt; el.classList.add("moved"); return; }
      el.classList.add("moving");
      setTimeout(function () {
        el.textContent = alt;
        el.classList.remove("moving");
        el.classList.add("moved");
      }, 900);
    }
    function arm(ms) { clearTimeout(timer); timer = setTimeout(turn, ms); }
    function disarm() { clearTimeout(timer); }
    el.addEventListener("mouseenter", function () { arm(2200); });
    el.addEventListener("mouseleave", disarm);
    el.addEventListener("touchstart", function () { arm(1300); }, { passive: true });
    el.addEventListener("touchend", disarm);
    el.addEventListener("touchcancel", disarm);
  });

  /* 5. the moon watches the reader's pointer */
  var iris = document.getElementById("moon-iris");
  if (iris && !reduce) {
    var svg = iris.ownerSVGElement;
    window.addEventListener("pointermove", function (e) {
      var r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var sx = r.width / 800, ex = r.left + 548 * sx, ey = r.top + 186 * sx;
      var dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1;
      var k = Math.min(d / 200, 1);
      iris.style.transform = "translate(" + (dx / d * 10 * k).toFixed(1) + "px," + (dy / d * 4 * k).toFixed(1) + "px)";
    }, { passive: true });
  }

  /* 6. when you look away, the book notices */
  var title = document.title, back = null;
  document.addEventListener("visibilitychange", function () {
    clearTimeout(back);
    if (document.hidden) { document.title = "Come back."; }
    else { document.title = "We'll see."; back = setTimeout(function () { document.title = title; }, 2600); }
  });
})();
