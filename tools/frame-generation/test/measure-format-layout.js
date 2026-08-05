// Fills in the missing PNG+grid experiment cell (vault: GRID SPRITE LAYOUT
// follow-up). The original regression finding compared PNG+strip (old) vs
// WebP+grid (new), changing layout AND encoder at once. This isolates the
// two variables: for every archetype, in both the no-logo and
// approved-logo state, composite the SAME already-captured frames
// (test/cost-study/<arch>[-approved]/frames/) into:
//   - grid layout, PNG   (the missing cell)
//   - grid layout, WebP  (cross-check against the already-shipped sprite.webp)
//   - strip layout (1xN), PNG   (for the layout-effect comparison)
//   - strip layout, WebP is not attempted: already proven impossible by
//     libwebp's 16383px/axis limit for every archetype at these frame counts.
//
// All PNG measurements use Playwright's ELEMENT SCREENSHOT
// (`locator.screenshot()`), never `canvas.toDataURL('image/png')`. Two
// encoder issues were found and worked around, both measured directly, not
// assumed:
//   1. `canvas.toDataURL('image/png')` produces ~5x LARGER files than
//      `locator.screenshot()` for the identical rendered canvas in this
//      Chromium build (758.8KB vs 153.1KB on a TRANSFORM grid sheet,
//      cross-checked against the sum of individual frame PNGs, which
//      toDataURL's number implausibly exceeded). `locator.screenshot()`
//      uses Chromium's real screenshot encoder - the same path
//      src/composite.js used for PNG before the WebP rework, and the one
//      that reproduces the historical cost-study PNG-strip byte counts
//      almost exactly (see below).
//   2. `canvas.toDataURL()` ALSO silently fails (returns the empty
//      "data:," sentinel, no exception) above a per-axis width somewhere
//      between 65535 and 76800px - would have blocked ASSEMBLE's
//      (76800px) and FLYTHROUGH's (86400px) strip layouts. Verified this
//      limit is specific to toDataURL: `locator.screenshot()` captures
//      both correctly regardless of viewport size (tested at both 800x600
//      and the old build's capped 4000px viewport) - FLYTHROUGH's strip
//      screenshot came back as 172,078 bytes (168.0KB) and ASSEMBLE's as
//      271,406 bytes (265.1KB), matching the vault's original COST STUDY
//      figures (0.164MB / 0.259MB) almost exactly - both the encoder
//      AND the content are confirmed unchanged since that study.
//
// WebP still uses `canvas.toDataURL('image/webp', quality)` (Playwright's
// screenshot() only supports png/jpeg) - already validated correct: this
// script's grid-WebP numbers reproduce the GRID SPRITE LAYOUT table's
// published figures exactly (e.g. REVEAL 506.7KB, FLYTHROUGH 1319.0KB).

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { getArchetype, ARCHETYPES } = require('../src/archetypes');
const { startServer } = require('../src/static-server');

const COMPOSE_ROOT = path.join(__dirname, '..', 'compose');
const WEBP_QUALITY = 0.8; // matches production src/composite.js, for a fair comparison

async function compositeOne(server, browser, { frameCount, dims, cols, rows }, tmpPngPath) {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  try {
    const qs = new URLSearchParams({
      frameCount: String(frameCount),
      frameW: String(dims.width),
      frameH: String(dims.height),
      cols: String(cols),
      rows: String(rows),
    });
    await page.goto(`${server.baseUrl}/compose/composite.html?${qs.toString()}`);
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 180000 });
    const errored = await page.evaluate('window.__error');
    if (errored) throw new Error('composite.html failed: ' + errored);

    await page.locator('#sheet').screenshot({ path: tmpPngPath });
    const pngBytes = fs.statSync(tmpPngPath).size;
    fs.unlinkSync(tmpPngPath);

    const webpUrl = await page.evaluate((q) => window.__toWebpDataUrl(q), WEBP_QUALITY);
    const webpPrefix = 'data:image/webp;base64,';
    const webpBytes = webpUrl.startsWith(webpPrefix) ? Buffer.from(webpUrl.slice(webpPrefix.length), 'base64').length : null;

    return {
      width: dims.width * cols,
      height: dims.height * rows,
      pngBytes,
      webpBytes,
      webpOk: webpUrl.length > 100,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const base = path.join(__dirname, 'cost-study');
  const archNames = Object.keys(ARCHETYPES);
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const archName of archNames) {
      const archetype = getArchetype(archName);
      for (const state of ['no-logo', 'approved-logo']) {
        const dirName = state === 'approved-logo' ? `${archName.toLowerCase()}-approved` : archName.toLowerCase();
        const archDir = path.join(base, dirName);
        const framesDir = path.join(archDir, 'frames');
        if (!fs.existsSync(framesDir)) {
          console.error(`SKIP ${archName} ${state}: ${framesDir} not found`);
          continue;
        }

        const server = await startServer({ '/compose/': COMPOSE_ROOT, '/frames/': framesDir });
        try {
          const grid = await compositeOne(server, browser, {
            frameCount: archetype.frameCount, dims: archetype.dims,
            cols: archetype.grid.cols, rows: archetype.grid.rows,
          }, path.join(archDir, `_tmp-grid-${Date.now()}.png`));

          const strip = await compositeOne(server, browser, {
            frameCount: archetype.frameCount, dims: archetype.dims,
            cols: archetype.frameCount, rows: 1,
          }, path.join(archDir, `_tmp-strip-${Date.now()}.png`));

          const row = {
            archetype: archName,
            state,
            frameCount: archetype.frameCount,
            dims: archetype.dims,
            grid: { cols: archetype.grid.cols, rows: archetype.grid.rows, width: grid.width, height: grid.height },
            stripWidth: strip.width,
            gridPngBytes: grid.pngBytes,
            gridWebpBytes: grid.webpBytes,
            stripPngBytes: strip.pngBytes,
          };
          results.push(row);
          console.log(
            `${archName.padEnd(11)} ${state.padEnd(14)} grid=${archetype.grid.cols}x${archetype.grid.rows} ` +
            `gridPNG=${(row.gridPngBytes/1024).toFixed(1)}KB gridWebP=${(row.gridWebpBytes/1024).toFixed(1)}KB ` +
            `stripPNG=${(row.stripPngBytes/1024).toFixed(1)}KB`
          );
        } finally {
          await server.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(base, 'format-layout-results.json'), JSON.stringify(results, null, 2));
  console.log('\nWrote', path.join(base, 'format-layout-results.json'));
}

main().catch((e) => { console.error(e); process.exit(1); });
