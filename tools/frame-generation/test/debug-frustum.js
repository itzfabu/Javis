// Fast iteration helper for tuning signboard placement - loads one scene,
// renders to t=1 (or an overridden t), runs the frustum check, prints
// corners, and exits. Not part of the pipeline; throwaway tuning tool.
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
    const result = await page.evaluate(() => window.__frustumCheck());
    console.log(JSON.stringify(result, null, 2));
    if (process.argv[4] === '--shot') {
      await page.locator('#c').screenshot({ path: path.join(__dirname, `debug-${archName}.png`) });
    }
    await page.close();
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
