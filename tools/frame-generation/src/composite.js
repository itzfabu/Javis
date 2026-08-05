// Drives compose/composite.html (see that file's header) to stitch a
// captured frame sequence into a 2D grid sprite-sheet, encoded as WebP via
// the browser's native canvas.toDataURL - no image-processing dependency.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('./static-server');

const COMPOSE_ROOT = path.join(__dirname, '..', 'compose');
const WEBP_QUALITY = 0.8; // matches the quality used in this project's own cost-study measurements, for a fair before/after comparison

async function compositeSpriteSheet({ framesDir, frameCount, dims, grid, outPath }) {
  const server = await startServer({
    '/compose/': COMPOSE_ROOT,
    '/frames/': framesDir,
  });
  const browser = await chromium.launch();
  try {
    // Viewport doesn't need to match the sheet's full size - a <canvas>'s
    // pixel buffer renders correctly regardless of how much of it is
    // actually visible on screen; toDataURL reads the buffer directly, not
    // a screenshot of the visible viewport.
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const qs = new URLSearchParams({
      frameCount: String(frameCount),
      frameW: String(dims.width),
      frameH: String(dims.height),
      cols: String(grid.cols),
      rows: String(grid.rows),
    });
    await page.goto(`${server.baseUrl}/compose/composite.html?${qs.toString()}`);
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 180000 });

    const errored = await page.evaluate('window.__error');
    if (errored) throw new Error('composite.html failed: ' + errored);

    const dataUrl = await page.evaluate((q) => window.__toWebpDataUrl(q), WEBP_QUALITY);
    const prefix = 'data:image/webp;base64,';
    if (!dataUrl.startsWith(prefix)) {
      throw new Error(`canvas.toDataURL did not return a WebP data URL (got: ${dataUrl.slice(0, 40)}...) - this Chromium build may not support WebP canvas export.`);
    }
    const buffer = Buffer.from(dataUrl.slice(prefix.length), 'base64');

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buffer);

    await page.close();
    return { outPath, width: grid.sheetWidth, height: grid.sheetHeight, bytes: buffer.length };
  } finally {
    await browser.close();
    await server.close();
  }
}

module.exports = { compositeSpriteSheet, WEBP_QUALITY };
