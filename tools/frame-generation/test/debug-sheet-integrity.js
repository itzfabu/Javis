// Fast iteration/verification helper for the sheet-integrity guard (mirrors
// debug-frustum.js / debug-occlusion.js). Not part of the pipeline.
//
// Usage:
//   node test/debug-sheet-integrity.js <ARCHETYPE>
//     Verifies that archetype's currently-shipped sprite sheet in
//     test/cost-study/<archetype>/sprite.webp against its real grid.
//
//   node test/debug-sheet-integrity.js <ARCHETYPE> --reconstruct-broken-strip
//     Reconstructs a 1xN strip via the exact historical broken path
//     (locator.screenshot() on a very wide canvas - see vault: SHEET
//     INTEGRITY GUARD) from that archetype's already-captured frames, runs
//     the guard against it, prints the result, then discards the
//     reconstruction. Useful to re-confirm the guard still catches the
//     class of bug it was built for after any future change to
//     src/sheet-integrity.js or compose/verify-sheet.html.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { getArchetype } = require('../src/archetypes');
const { startServer } = require('../src/static-server');
const { verifySheetIntegrity } = require('../src/sheet-integrity');

async function reconstructBrokenStrip(archetype) {
  const framesDir = path.join(__dirname, 'cost-study', archetype.key.toLowerCase(), 'frames');
  const composeRoot = path.join(__dirname, '..', 'compose');
  const outPath = path.join(__dirname, 'cost-study', archetype.key.toLowerCase(), '_debug-reconstructed-strip.png');

  const server = await startServer({ '/compose/': composeRoot, '/frames/': framesDir });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const qs = new URLSearchParams({
      frameCount: String(archetype.frameCount), frameW: String(archetype.dims.width), frameH: String(archetype.dims.height),
      cols: String(archetype.frameCount), rows: '1', // 1xN strip - the exact historical layout
    });
    await page.goto(`${server.baseUrl}/compose/composite.html?${qs.toString()}`);
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 180000 });
    await page.locator('#sheet').screenshot({ path: outPath }); // the exact historical broken mechanism
    await page.close();
  } finally {
    await browser.close();
    await server.close();
  }
  return { outPath, grid: { cols: archetype.frameCount, rows: 1 } };
}

async function main() {
  const archName = process.argv[2];
  const reconstruct = process.argv.includes('--reconstruct-broken-strip');
  if (!archName) {
    console.error('Usage: node test/debug-sheet-integrity.js <ARCHETYPE> [--reconstruct-broken-strip]');
    process.exit(1);
  }
  const archetype = getArchetype(archName);

  let sheetPath, grid;
  if (reconstruct) {
    console.log(`Reconstructing a broken 1xN strip for ${archetype.key} via the historical mechanism...`);
    const built = await reconstructBrokenStrip(archetype);
    sheetPath = built.outPath;
    grid = built.grid;
    console.log(`  wrote ${sheetPath} (${fs.statSync(sheetPath).size} bytes)`);
  } else {
    sheetPath = path.join(__dirname, 'cost-study', archetype.key.toLowerCase(), 'sprite.webp');
    grid = archetype.grid;
  }

  try {
    const result = await verifySheetIntegrity({
      sheetPath, frameCount: archetype.frameCount, dims: archetype.dims, grid, fallbackFrame: archetype.fallbackFrame,
    });
    console.log(JSON.stringify(result, null, 2));
    console.log(result.ok ? '\nPASS' : '\nFAIL (see problems above)');
  } finally {
    if (reconstruct) {
      fs.unlinkSync(sheetPath);
      console.log('Reconstruction discarded.');
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
