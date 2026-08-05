// Fast iteration/calibration helper for the occlusion guard - loads one
// scene, renders to t (default: logoFraction=1), runs the occlusion check,
// prints the result. Not part of the pipeline; throwaway tuning/verification
// tool (mirrors debug-frustum.js).
const path = require('path');
const { chromium } = require('playwright');
const { getArchetype } = require('../src/archetypes');
const { startServer } = require('../src/static-server');

async function main() {
  const archName = process.argv[2];
  const t = process.argv[3] !== undefined ? parseFloat(process.argv[3]) : 1;
  const archetype = getArchetype(archName);
  const server = await startServer({
    '/scenes/': path.join(__dirname, '..', 'scenes'),
    '/vendor/': path.join(__dirname, '..', 'vendor'),
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: archetype.dims.width, height: archetype.dims.height } });
    const qs = new URLSearchParams({
      w: String(archetype.dims.width), h: String(archetype.dims.height),
      primary: 'C4622D', accent: 'E8A23D', tertiary: '2B3A55', bg: 'FBF6EF',
      logoText: 'TEST LOGO', logoFraction: '1.0',
    });
    await page.goto(`${server.baseUrl}/scenes/${archetype.scene}?${qs.toString()}`);
    await page.waitForFunction('window.__ready === true');
    await page.evaluate((t) => window.__renderFrame(t), t);
    const colorTol = process.argv[4] !== undefined && process.argv[4] !== '--shot' ? parseFloat(process.argv[4]) : undefined;
    const result = await page.evaluate((ct) => window.__occlusionCheck(ct !== undefined ? { colorTol: ct, threshold: 0 } : undefined), colorTol);
    console.log(JSON.stringify(result, null, 2));
    if (process.argv[4] === '--shot' || process.argv[5] === '--shot') {
      await page.locator('#c').screenshot({ path: path.join(__dirname, `debug-occ-${archName}.png`) });
    }
    await page.close();
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
