const { chromium } = require(require.resolve("playwright", { paths: [process.cwd()] }));
// Browser play-test (boot -> how-to -> route -> play -> pause -> exit -> lose -> win, desktop + 375px phone).
// Needs Playwright outside the repo:  npm i playwright  (in any scratch dir), then from that dir:
//   python3 -m http.server 8743   (repo root, separate shell)
//   node /path/to/tabs/escape/tests/play.browser.cjs [baseUrl]
// Screenshots go to ./shots/ in the current directory; console errors are printed.
const OUT = process.cwd() + "/shots/";
require("fs").mkdirSync(OUT, { recursive: true });
const BASE = process.argv[2] || "http://localhost:8743/tabs/escape/";

(async () => {
  const b = await chromium.launch();
  for (const vp of [{ name: "desk", width: 1280, height: 760 }, { name: "phone", width: 375, height: 700, mobile: true }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, hasTouch: !!vp.mobile, isMobile: !!vp.mobile });
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errs.push(m.type() + ": " + m.text()); });
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("requestfailed", (r) => errs.push("reqfail: " + r.url()));
    page.on("response", (r) => { if (r.status() >= 400) errs.push("HTTP " + r.status() + " " + r.url()); });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: OUT + vp.name + "-1title.png" });
    const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth, document.documentElement.scrollHeight, window.innerHeight]);
    console.log(vp.name, "scrollW/innerW/scrollH/innerH", sw);
    // how-to
    await page.click(".js-howto"); await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + vp.name + "-2howto.png" });
    await page.click(".js-back"); await page.waitForTimeout(500);
    await page.click(".js-start"); await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + vp.name + "-3route.png" });
    await page.click(".choice"); await page.waitForTimeout(1300);
    await page.screenshot({ path: OUT + vp.name + "-4intro.png" });
    await page.waitForTimeout(1500);
    // walk right & fight
    const st = await page.evaluate(() => window.__escape.state);
    console.log(vp.name, "state after intro:", st);
    await page.keyboard.down("KeyD");
    for (let i = 0; i < 6; i++) { await page.keyboard.press("Space"); await page.waitForTimeout(250); }
    await page.screenshot({ path: OUT + vp.name + "-5play.png" });
    await page.keyboard.up("KeyD");
    // pause
    await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + vp.name + "-6pause.png" });
    await page.click(".js-resume"); await page.waitForTimeout(400);
    // fps sample
    const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
    console.log(vp.name, "fps", fps);
    // force a win of this zone: teleport to exit
    await page.evaluate(() => { const g = window.__escape.game; g.player.x = g.exits[0].x; g.player.y = g.exits[0].y; });
    await page.waitForTimeout(1600);
    console.log(vp.name, "after exit:", await page.evaluate(() => window.__escape.state));
    await page.screenshot({ path: OUT + vp.name + "-7route2.png" });
    // choose second option then die
    const choices = await page.$$(".choice"); await choices[choices.length - 1].click();
    await page.waitForTimeout(3600);
    await page.screenshot({ path: OUT + vp.name + "-8zone2.png" });
    await page.evaluate(() => { const g = window.__escape.game, p = g.player; const api = g.api;
      const a = api.spawn("unwilling", p.x + 70, p.y + 10); a.stun = 0; a.relentless = true;
      const b = api.spawn("sam", p.x - 60, p.y + 40); b.relentless = true; api.spawn("rabbit", p.x + 30, p.y + 70);
      api.spawn("pickup", p.x + 40, p.y - 30, { weapon: "hat", uses: 7 }); api.spawn("teacup", p.x - 90, p.y - 60); api.spawn("horse", p.x + 120, p.y - 60); api.spawn("cookie", p.x - 30, p.y - 50);
      p.invuln = 99; });
    await page.waitForTimeout(700);
    await page.keyboard.press("Space"); await page.waitForTimeout(120);
    await page.screenshot({ path: OUT + vp.name + "-8zone2-fight.png" });
    await page.evaluate(() => { window.__escape.game.player.invuln = 0; });
    await page.evaluate(() => { window.__escape.run.health = 1; window.__escape.game.player.invuln = 0; window.__escape.game.api.hurt(5, 0, 0, "unwilling"); });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: OUT + vp.name + "-9lost-a.png" });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: OUT + vp.name + "-9lost-b.png" });
    console.log(vp.name, "lost state:", await page.evaluate(() => window.__escape.state));
    // retry and jump to final level win
    await page.click(".js-retry"); await page.waitForTimeout(1400);
    await page.evaluate(() => { window.__escape.run.tier = 3; });
    await page.evaluate(() => { document.querySelector(".choice") && 0; });
    // re-render route for tier 3 by finishing via internals: enter bigtop directly
    await page.click(".choice"); await page.waitForTimeout(3600);
    await page.screenshot({ path: OUT + vp.name + "-10zone.png" });
    await page.evaluate(() => { const S = window.__escape; S.game.level = Object.assign({}, S.game.level, { final: true }); const g = S.game; g.player.x = g.exits[0].x; g.player.y = g.exits[0].y; });
    await page.waitForTimeout(6000);
    await page.screenshot({ path: OUT + vp.name + "-11won.png" });
    console.log(vp.name, "final state:", await page.evaluate(() => window.__escape.state));
    console.log(vp.name, "errors:", errs.length ? errs : "none");
    await ctx.close();
  }
  await b.close();
})();
