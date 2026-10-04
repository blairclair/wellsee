/* Tab registry — the ONLY file shared between tab authors.
   One line per tab. Paths are relative to the site root, no leading slash.
   ready:false renders the tab as "sealed" (not clickable) until it ships.
   On a rebase conflict here: keep every line from both sides. */
window.WELLSEE_TABS = [
  { slug: "about",  label: "The Legend",  path: "tabs/about/",  ready: true  },
  { slug: "clowns", label: "The Unwilling", path: "tabs/clowns/", ready: true },
  { slug: "escape", label: "Escape the Midway", path: "tabs/escape/", ready: true },
];
