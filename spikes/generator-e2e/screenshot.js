// Stage 5: screenshot the assembled site (desktop hero at scroll=0, desktop
// mid-scroll to prove the scrub works, and mobile) so the walking skeleton can
// be judged visually, not just by reading the HTML.
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const input = require(path.join(ROOT, 'input.json'));
const slug = input.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const siteDir = path.join(ROOT, 'out', 'site', slug);
const fileUrl = 'file:///' + path.join(siteDir, 'index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();

  // Desktop, top of page
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(fileUrl);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'out', 'screenshot-desktop-top.png') });

  // Desktop, scrolled partway into the hero scroll-track (proves the scrub animates)
  await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.15)));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ROOT, 'out', 'screenshot-desktop-hero-midscroll.png') });

  // Desktop, full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(ROOT, 'out', 'screenshot-desktop-fullpage.png'), fullPage: true });
  await page.close();

  // Mobile viewport, top of page (should show the STATIC hero + sticky call bar per Thread 2)
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(fileUrl);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ROOT, 'out', 'screenshot-mobile-top.png') });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(ROOT, 'out', 'screenshot-mobile-fullpage.png'), fullPage: true });
  await page.close();

  await browser.close();
  console.log('Screenshots written to out/');
})();
