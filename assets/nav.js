/* Shared navigation. Include after tabs.js on every page:
     <script src="ROOT/assets/tabs.js"></script>
     <script src="ROOT/assets/nav.js" data-active="your-slug"></script>
   It renders into <nav id="site-nav"></nav>. Root is derived from this
   script's own URL, so it works at /wellsee/ on Pages and on localhost. */
(function () {
  var me = document.currentScript;
  var root = me.src.replace(/assets\/nav\.js(\?.*)?$/, "");
  var active = me.getAttribute("data-active") || "home";
  var nav = document.getElementById("site-nav");
  if (!nav) return;
  var html = '<a class="nav-sigil' + (active === "home" ? " is-active" : "") +
    '" href="' + root + '">Wellsee</a><ul>';
  (window.WELLSEE_TABS || []).forEach(function (t) {
    if (t.ready) {
      html += '<li><a href="' + root + t.path + '"' +
        (t.slug === active ? ' class="is-active" aria-current="page"' : "") +
        ">" + t.label + "</a></li>";
    } else {
      html += '<li><span class="is-sealed" title="Not yet. Not yet.">' + t.label + "</span></li>";
    }
  });
  nav.innerHTML = html + "</ul>";
})();
