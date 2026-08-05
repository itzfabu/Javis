/*
 * Headless capture for the hybrid-template SPIN spike.
 * Renders the same scene.html (fixed geometry, fixed camera path) twice,
 * once per simulated "client" (different primary/accent/bg/logo params —
 * standing in for Thread 1's paletteForFrames/backgroundForFrames/
 * logoCompositing token fields), and captures N deterministic frames per
 * client via window.__renderFrame(t), matching the frame-count/step
 * pattern used by ../flipbook-scrub/generate_frames.py.
 *
 * Throwaway spike script, not part of the generator.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const N_FRAMES = 24; // enough to see a smooth 360 spin, matches this
                      // archetype's lower frame-count need vs ASSEMBLE's 96

const CLIENTS = [
  { name: 'clientA-roastery', primary: 'C4622D', accent: 'E8A23D', bg: 'FBF6EF', logo: 'MAPLE & RYE' },
  { name: 'clientB-tech',     primary: '2B3A55', accent: '4FD1C5', bg: 'F4F6F8', logo: 'NIMBUS' },
];

async function main() {
  const browser = await chromium.launch();
  const outRoot = path.join(__dirname, 'out');
  fs.mkdirSync(outRoot, { recursive: true });

  const timings = [];

  for (const client of CLIENTS) {
    const clientDir = path.join(outRoot, client.name);
    fs.mkdirSync(clientDir, { recursive: true });

    const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
    const url = `file://${path.join(__dirname, 'scene.html')}` +
      `?primary=${client.primary}&accent=${client.accent}&bg=${client.bg}&logo=${encodeURIComponent(client.logo)}`;

    const t0 = Date.now();
    await page.goto(url);
    await page.waitForFunction('window.__ready === true');

    const canvas = page.locator('#c');
    for (let i = 0; i < N_FRAMES; i++) {
      const t = i / (N_FRAMES - 1);
      await page.evaluate((t) => window.__renderFrame(t), t);
      const frameName = `frame-${String(i).padStart(3, '0')}.png`;
      await canvas.screenshot({ path: path.join(clientDir, frameName) });
    }
    const elapsedMs = Date.now() - t0;
    timings.push({ client: client.name, frames: N_FRAMES, elapsedMs });
    console.log(`[${client.name}] ${N_FRAMES} frames in ${elapsedMs}ms (${(elapsedMs / N_FRAMES).toFixed(0)}ms/frame)`);

    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outRoot, 'timings.json'), JSON.stringify(timings, null, 2));
  console.log('done:', JSON.stringify(timings));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
