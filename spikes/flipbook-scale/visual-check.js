const path = require('path');
const { chromium } = require('playwright');

function fileUrl(p) { return 'file:///' + path.join(__dirname, p).replace(/\\/g, '/'); }

(async () => {
  const browser = await chromium.launch();

  // static-check.html: fixed (non-animated) percentage positions, plus a
  // known-good pixel-based control box, to isolate rendering from animation.
  let page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  const failures = [];
  page.on('requestfailed', (req) => failures.push(req.url()));
  await page.goto(fileUrl('static-check.html'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'out', 'static-check-v2.png') });
  console.log('static-check.html request failures:', failures);
  await page.close();

  // percent-contained.html at t=0.5 and t=1.0
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures2 = [];
  page.on('requestfailed', (req) => failures2.push(req.url()));
  await page.goto(fileUrl('percent-contained.html'));
  await page.waitForTimeout(200);
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * 0.5));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'out', 'contained-t50-v2.png') });
  await page.evaluate((y) => window.scrollTo(0, y), maxScroll);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'out', 'contained-t100-v2.png') });
  console.log('percent-contained.html request failures:', failures2);
  await page.close();

  await browser.close();
})();
