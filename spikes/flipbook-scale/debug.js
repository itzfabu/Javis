const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = 'file:///' + path.join(__dirname, 'percent-contained.html').replace(/\\/g, '/');
  await page.goto(url);
  await page.waitForTimeout(200);
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  console.log('maxScroll', maxScroll);
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * 0.5));
  await page.waitForTimeout(300);
  const raw = await page.evaluate(() => {
    const sprite = document.getElementById('sprite');
    const cs = getComputedStyle(sprite);
    return {
      backgroundPositionX: cs.backgroundPositionX,
      backgroundPosition: cs.backgroundPosition,
      backgroundSize: cs.backgroundSize,
      scrollY: window.scrollY,
      rect: sprite.getBoundingClientRect(),
    };
  });
  console.log(JSON.stringify(raw, null, 2));
  await browser.close();
})();
