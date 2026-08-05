// Sprite-sheet cost study: decode/paint time under CPU throttling, for the
// "measure first, then decide" request. One-off measurement script, not
// part of the shipping pipeline (bin/generate-frames.js has no throttling/
// tracing logic - this only reads an already-generated metadata.json/
// sprite.png per archetype and measures them as a real browser would render
// them as a page's hero).
//
// Method: embeds each archetype's ACTUAL snippet.css/snippet.html (unmodified
// except adding an `elementtiming` attribute to the hero div) into a minimal
// page, throttles CPU 4x via CDP (Emulation.setCPUThrottlingRate - Chrome's
// own mid-range-mobile approximation), navigates fresh (new browser context
// per trial - Chromium partitions HTTP cache per context, so every trial is
// a cold load, not warmed by a previous one), and reads the real Element
// Timing API's `renderTime` for that element - the same underlying paint
// instrumentation family Chrome's LCP metric itself uses, not a synthetic
// proxy. 5 trials per archetype; reports min/median/max (single numbers from
// one run are noisy - median is the headline figure).

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('../src/static-server');

const ARCHETYPES = ['assemble', 'reveal', 'spin', 'transform', 'flythrough', 'interface'];
const TRIALS = 5;
const CPU_THROTTLE_RATE = 4; // Chrome DevTools' own "mid-tier mobile" slowdown factor

function buildHeroPage(metadata) {
  const html = metadata.html.replace(
    'class="hero-sprite"',
    'class="hero-sprite" elementtiming="hero-sprite"'
  );
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
html, body { margin: 0; padding: 0; background: #fff; }
${metadata.css}
</style></head>
<body>
${html}
<script>
window.__getEntry = () => new Promise((resolve) => {
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.identifier === 'hero-sprite') {
        resolve({ renderTime: e.renderTime, loadTime: e.loadTime, startTime: e.startTime });
        po.disconnect();
        return;
      }
    }
  });
  po.observe({ type: 'element', buffered: true });
  setTimeout(() => resolve(null), 15000); // safety timeout under heavy throttle + huge sprites
});
</script>
</body></html>`;
}

async function measureOne(browser, archDir, metadata) {
  const context = await browser.newContext(); // fresh context = cold HTTP cache
  try {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    const heroPath = path.join(archDir, `hero-measure-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(heroPath, buildHeroPage(metadata));

    const server = await startServer({ '/page/': archDir });
    try {
      const t0 = Date.now();
      await page.goto(`${server.baseUrl}/page/${path.basename(heroPath)}`, { waitUntil: 'commit' });
      const entry = await page.evaluate(() => window.__getEntry());
      const wallClockMs = Date.now() - t0;
      return { entry, wallClockMs };
    } finally {
      await server.close();
      fs.unlinkSync(heroPath);
    }
  } finally {
    await context.close();
  }
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function main() {
  const base = path.join(__dirname, 'cost-study');
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const arch of ARCHETYPES) {
      const archDir = path.join(base, arch);
      const metadata = JSON.parse(fs.readFileSync(path.join(archDir, 'metadata.json'), 'utf8'));

      const renderTimes = [];
      const wallClocks = [];
      for (let i = 0; i < TRIALS; i++) {
        const { entry, wallClockMs } = await measureOne(browser, archDir, metadata);
        wallClocks.push(wallClockMs);
        if (entry && entry.renderTime) {
          renderTimes.push(entry.renderTime);
        } else if (entry && entry.loadTime) {
          renderTimes.push(entry.loadTime); // renderTime can be 0 for some resource types; loadTime is the documented fallback
        } else {
          renderTimes.push(null);
        }
      }

      const valid = renderTimes.filter((v) => v !== null);
      const row = {
        archetype: arch,
        spriteBytes: fs.statSync(path.join(archDir, 'sprite.png')).size,
        frameCount: metadata.frameCount,
        trials: renderTimes,
        validTrials: valid.length,
        renderTimeMedianMs: valid.length ? +median(valid).toFixed(1) : null,
        renderTimeMinMs: valid.length ? +Math.min(...valid).toFixed(1) : null,
        renderTimeMaxMs: valid.length ? +Math.max(...valid).toFixed(1) : null,
        wallClockMedianMs: +median(wallClocks).toFixed(1),
      };
      results.push(row);
      console.log(
        `${arch.padEnd(12)} renderTime median=${row.renderTimeMedianMs}ms ` +
        `(min=${row.renderTimeMinMs}, max=${row.renderTimeMaxMs}, n=${row.validTrials}/${TRIALS}) ` +
        `sprite=${(row.spriteBytes / 1024).toFixed(1)}KB frames=${row.frameCount}`
      );
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(base, 'decode-paint-results.json'), JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
