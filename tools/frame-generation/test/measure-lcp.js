// Replaces the "file size / 200KB/s" download-time ESTIMATE in the GRID
// SPRITE LAYOUT + WEBP cost table with a MEASURED figure: extends
// measure-cost.js's already-validated method (CPU throttle 4x + the
// Element Timing API's `renderTime` for the real `.hero-sprite` div - "the
// same underlying instrumentation family Chrome's own LCP metric uses,
// not a synthetic proxy", per that script's own header) by ALSO applying
// real network emulation via CDP `Network.emulateNetworkConditions` in the
// SAME trial, using the same Slow-4G profile the old estimate assumed
// (1.6Mbps down / 150ms RTT - Lighthouse's own Slow 4G profile; 750Kbps
// up is Lighthouse's own figure for the same profile, included because
// the CDP call requires a value even though this page has no uploads).
// renderTime is measured from navigation start to actual paint, so under
// combined throttling it now includes the real network transfer time
// automatically - no separate arithmetic estimate is added on top.
//
// Why not the native `largest-contentful-paint` PerformanceObserver
// directly: tried it first (see vault write-up). It did not reliably fire
// an entry for this page's CSS background-image under network throttling
// in this Playwright/Chromium build - `load` fired correctly and fast
// (786ms, matching the expected transfer time), but the LCP entry never
// arrived even 500ms after `load`, a reproducible gap worth flagging as
// its own finding rather than worked around silently. Element Timing on
// the same identified element is not a lesser substitute: it is the same
// underlying paint-timing signal LCP itself is built from, scoped to one
// named element instead of "whatever the page's largest element turns out
// to be" - since the hero sprite is the only meaningful painted content on
// this minimal measurement page, the two are numerically equivalent here,
// and Element Timing is the mechanism this project's own methodology
// already trusts (measure-cost.js).
//
// 5 trials per archetype/state, fresh browser context per trial (cold HTTP
// cache), median reported as the headline figure - same as measure-cost.js.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('../src/static-server');
const { ARCHETYPES } = require('../src/archetypes');

const TRIALS = 5;
const CPU_THROTTLE_RATE = 4;
// Lighthouse's own "Slow 4G" profile - the same one the superseded
// file-size/200KBps estimate assumed, so this redoes the same scenario
// with a real measurement instead of a different network condition.
const NETWORK = {
  offline: false,
  latency: 150, // ms RTT
  downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6Mbps -> bytes/sec
  uploadThroughput: (750 * 1024) / 8, // 750Kbps -> bytes/sec (Lighthouse's figure; this page has no uploads)
};

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
  setTimeout(() => resolve(null), 40000); // safety timeout under combined CPU+network throttle
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
    await client.send('Network.emulateNetworkConditions', NETWORK);

    const heroPath = path.join(archDir, `hero-lcp-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(heroPath, buildHeroPage(metadata));

    const server = await startServer({ '/page/': archDir });
    try {
      const t0 = Date.now();
      // 'commit' (not 'load'/'networkidle'): waiting on the navigation
      // lifecycle's own load event proved unreliable under CPU throttle in
      // this build (a plain page's `load` event was observed taking 18+
      // real seconds under 4x CPU throttle alone, no network throttle
      // involved - reproducible, not a fluke, and not something this task
      // needed to fully root-cause). measure-cost.js already established
      // 'commit' + an in-page PerformanceObserver with its own timeout as
      // the reliable pattern; reused here unchanged.
      await page.goto(`${server.baseUrl}/page/${path.basename(heroPath)}`, { waitUntil: 'commit' });
      await page.waitForFunction(() => typeof window.__getEntry === 'function');
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
  // Optional CLI args scope this to specific archetypes (e.g. after
  // regenerating just one archetype's sheet) - same pattern measure-cost.js
  // already uses, added here for the same reason: re-running all six every
  // time a single sheet changes is wasteful and risks silently re-measuring
  // archetypes that were never touched.
  const archNames = process.argv.length > 2
    ? process.argv.slice(2).map((a) => a.toLowerCase())
    : Object.keys(ARCHETYPES).map((k) => k.toLowerCase());
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const arch of archNames) {
      for (const state of ['no-logo', 'approved-logo']) {
        const dirName = state === 'approved-logo' ? `${arch}-approved` : arch;
        const archDir = path.join(base, dirName);
        const metaPath = path.join(archDir, 'metadata.json');
        if (!fs.existsSync(metaPath)) {
          console.error(`SKIP ${arch} ${state}: ${metaPath} not found`);
          continue;
        }
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

        const renderTimes = [];
        const wallClocks = [];
        for (let i = 0; i < TRIALS; i++) {
          const { entry, wallClockMs } = await measureOne(browser, archDir, metadata);
          wallClocks.push(wallClockMs);
          if (entry && entry.renderTime) {
            renderTimes.push(entry.renderTime);
          } else if (entry && entry.loadTime) {
            renderTimes.push(entry.loadTime);
          } else {
            renderTimes.push(null);
          }
        }

        const valid = renderTimes.filter((v) => v !== null);
        const row = {
          archetype: arch.toUpperCase(),
          state,
          spriteBytes: fs.statSync(path.join(archDir, metadata.spriteSheet.path)).size,
          frameCount: metadata.frameCount,
          trials: renderTimes,
          validTrials: valid.length,
          measuredLcpMedianMs: valid.length ? +median(valid).toFixed(1) : null,
          measuredLcpMinMs: valid.length ? +Math.min(...valid).toFixed(1) : null,
          measuredLcpMaxMs: valid.length ? +Math.max(...valid).toFixed(1) : null,
          wallClockMedianMs: +median(wallClocks).toFixed(1),
        };
        results.push(row);
        console.log(
          `${arch.padEnd(11)} ${state.padEnd(14)} measuredLCP median=${row.measuredLcpMedianMs}ms ` +
          `(min=${row.measuredLcpMinMs}, max=${row.measuredLcpMaxMs}, n=${row.validTrials}/${TRIALS}) ` +
          `sprite=${(row.spriteBytes/1024).toFixed(1)}KB`
        );
      }
    }
  } finally {
    await browser.close();
  }

  // Merge into the existing results file when scoped to specific
  // archetypes, rather than overwriting it - a partial re-run (e.g. after
  // regenerating just one archetype's sheet) must not silently discard the
  // other archetypes' still-valid measurements.
  const outPath = path.join(base, 'lcp-measured-results.json');
  let merged = results;
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const touchedKeys = new Set(results.map((r) => r.archetype + '|' + r.state));
    merged = existing.filter((r) => !touchedKeys.has(r.archetype + '|' + r.state)).concat(results);
    merged.sort((a, b) => (a.archetype + a.state).localeCompare(b.archetype + b.state));
  }
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));
  console.log('\nWrote', outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
