const path = require('path');
const { chromium } = require('playwright');
function fileUrl(p) { return 'file:///' + path.join(__dirname, p).replace(/\\/g, '/'); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  await page.goto(fileUrl('percent-2x.html'));
  await page.waitForTimeout(300);
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await page.screenshot({ path: path.join(__dirname, 'out', '2x-t0.png') });

  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * 0.5));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'out', '2x-t50.png') });

  await page.evaluate((y) => window.scrollTo(0, y), maxScroll);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'out', '2x-t100.png') });

  console.log('errors/failures:', errors.length ? errors : 'NONE');
  await browser.close();
})();
