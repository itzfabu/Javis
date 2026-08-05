// Tests which rendering contexts actually break on the current (or fixed) hero
// pattern: full-page screenshot, print emulation, PDF export, and a normal
// single-viewport render (the "crawler/first-impression" case, for contrast).
// Usage: node test-contexts.js <before.html|after.html> <output-prefix>
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const [, , fileName, prefix] = process.argv;
if (!fileName || !prefix) { console.error('Usage: node test-contexts.js <file.html> <prefix>'); process.exit(1); }

function fileUrl(p) { return 'file:///' + path.join(__dirname, p).replace(/\\/g, '/'); }
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();

  // 1. Full-page screenshot (Playwright's default fullPage mode - CDP
  //    captureBeyondViewport composite, no real scrolling happens)
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(fileUrl(fileName));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${prefix}-fullpage.png`), fullPage: true });
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`[${prefix}] document scrollHeight: ${docHeight}px`);
  await page.close();

  // 2. Print emulation (a reliably CSS-detectable context via @media print)
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(fileUrl(fileName));
  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(100);
  const printHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`[${prefix}] print-media document scrollHeight: ${printHeight}px`);
  await page.screenshot({ path: path.join(OUT, `${prefix}-print-fullpage.png`), fullPage: true });
  try {
    await page.pdf({ path: path.join(OUT, `${prefix}.pdf`) });
    console.log(`[${prefix}] PDF export succeeded`);
  } catch (e) {
    console.log(`[${prefix}] PDF export failed: ${e.message}`);
  }
  await page.close();

  // 3. Normal single-viewport render, scrollY=0 - the "crawler / first
  //    impression" case, for contrast against the full-page-composite case.
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(fileUrl(fileName));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${prefix}-singleviewport.png`) }); // fullPage:false (default)
  await page.close();

  await browser.close();
})();
