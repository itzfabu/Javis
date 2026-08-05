// Drives compose/composite.html (see that file's header) to stitch a
// captured frame sequence into one horizontal sprite-sheet PNG.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('./static-server');

const COMPOSE_ROOT = path.join(__dirname, '..', 'compose');

async function compositeSpriteSheet({ framesDir, frameCount, dims, outPath }) {
  const server = await startServer({
    '/compose/': COMPOSE_ROOT,
    '/frames/': framesDir,
  });
  const browser = await chromium.launch();
  try {
    const totalWidth = dims.width * frameCount;
    const page = await browser.newPage({ viewport: { width: Math.min(totalWidth, 4000), height: dims.height } });
    const qs = new URLSearchParams({
      frameCount: String(frameCount),
      frameW: String(dims.width),
      frameH: String(dims.height),
    });
    await page.goto(`${server.baseUrl}/compose/composite.html?${qs.toString()}`);
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 120000 });

    const errored = await page.evaluate('window.__error');
    if (errored) throw new Error('composite.html failed: ' + errored);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    // Screenshot the canvas element directly rather than the viewport - the
    // canvas is the full totalWidth x height regardless of viewport size,
    // and Playwright's element screenshot captures its actual pixel content.
    await page.locator('#sheet').screenshot({ path: outPath });

    await page.close();
    const stat = fs.statSync(outPath);
    return { outPath, width: totalWidth, height: dims.height, bytes: stat.size };
  } finally {
    await browser.close();
    await server.close();
  }
}

module.exports = { compositeSpriteSheet };
