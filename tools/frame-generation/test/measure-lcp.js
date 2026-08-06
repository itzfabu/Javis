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
//
// CONTROL ARCHETYPE - added 2026-08-06, closing a real methodology gap: a
// same-machine re-measurement of SPIN with zero code change came back
// 1992-2000ms against a stored 1476-1480ms - about 35% drift across
// sessions on the same box (see vault: TRANSFORM GRAIN MADE LUMINANCE-
// CONDITIONAL + STD FLOOR CORRECTED). Every absolute figure in this
// project's LCP tables was taken on a different day, and several
// decisions (REVEAL's 0.59-0.71s "gap," the 60-unit-grain discard at
// 2.54s against a 2.5s threshold) rest on margins that size of drift can
// swallow whole. So every run of this script now ALSO measures one fixed,
// never-modified archetype/state and reports every other figure alongside
// that session's own control reading and the ratio between them - a
// reader can then tell "this number moved because the code changed" from
// "this number moved because the machine was under different load today"
// without having to remember to re-measure a second thing by hand.
//
// Why INTERFACE/no-logo, specifically, and not the first name in the
// archetype list: it has no open LCP task, unlike ASSEMBLE/FLYTHROUGH
// (high-priority open gaps with untried levers - frame count, resolution,
// WebP quality - all of which are expected to change their captured
// content) or REVEAL (an open medium-priority gap with the same kind of
// untried levers). TRANSFORM is under active per-session modification
// (this same day's grain work). SPIN's format task is closed, but its
// frame-count-reduction idea was reported, not applied, and remains live
// per TASKS.md - not a safe "nobody will touch this" bet either. INTERFACE
// is the one archetype with zero open or lingering ideas attached to it.
// Its own captured content (three fixed-geometry dashboard panels sliding
// in + a canvas-text counter, no lighting/material experimentation of the
// kind TRANSFORM/REVEAL involve) is also simple and deterministic to
// render, which is what a stable reference reading needs. no-logo (not
// approved-logo) is used for the control specifically because it has one
// fewer moving part (no extracted logo texture load).
//
// Control readings are appended to their OWN file (lcp-control-log.json),
// NEVER to lcp-measured-results.json - the previous session's ad-hoc
// control check overwrote SPIN's stored baseline there and needed a
// manual revert. Keeping the two files structurally separate makes that
// mistake impossible to repeat, not just something to remember not to do.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('../src/static-server');
const { ARCHETYPES } = require('../src/archetypes');

let TRIALS = 5; // overridable per-invocation via --trials=N (see main()) - median error shrinks
// with trial count, so a specific investigation can afford more without paying the cost on every
// run. Never changed globally: this stays a per-call override, not a new default.
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

const CONTROL_ARCHETYPE = 'interface';
const CONTROL_STATE = 'no-logo';
const CONTROL_LOG_PATH = path.join(__dirname, 'cost-study', 'lcp-control-log.json');

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
// Decomposition (added 2026-08-06): a blended end-to-end renderTime conflates two components with
// different load sensitivity - network transfer (throttled bandwidth + fixed 150ms RTT, barely
// touched by CPU contention) and render/decode (competes directly with a CPU stressor). Resource
// Timing gives the sprite image's own fetch window; Element Timing gives the paint. transferMs =
// responseEnd - startTime (DNS/connect/request/download for the sprite specifically); decodeMs =
// renderTime - responseEnd (whatever happens after the bytes arrive: image decode + paint). The two
// sum with the resource's own startTime (HTML-parse-to-fetch-start) to exactly the blended
// renderTime already measured - no time is double-counted or dropped.
window.__getEntry = () => new Promise((resolve) => {
  let elementEntry = null, resourceEntry = null;
  let done = false;
  function tryResolve() {
    if (done || !elementEntry || !resourceEntry) return; // wait for both - resolving on elementEntry alone would silently drop the decomposition on the (rare) race where the resource observer callback hasn't run yet
    done = true;
    resolve({
      renderTime: elementEntry.renderTime, loadTime: elementEntry.loadTime, startTime: elementEntry.startTime,
      resourceStartTime: resourceEntry ? resourceEntry.startTime : null,
      resourceResponseEnd: resourceEntry ? resourceEntry.responseEnd : null,
    });
  }
  const po = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.identifier === 'hero-sprite') { elementEntry = e; tryResolve(); }
    }
  });
  po.observe({ type: 'element', buffered: true });
  const ro = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (e.name.endsWith('.webp') || e.name.endsWith('.png')) { resourceEntry = e; tryResolve(); }
    }
  });
  ro.observe({ type: 'resource', buffered: true });
  setTimeout(() => { done = true; resolve(elementEntry ? {
    renderTime: elementEntry.renderTime, loadTime: elementEntry.loadTime, startTime: elementEntry.startTime,
    resourceStartTime: resourceEntry ? resourceEntry.startTime : null,
    resourceResponseEnd: resourceEntry ? resourceEntry.responseEnd : null,
  } : null); }, 40000); // safety timeout under combined CPU+network throttle
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

// Shared by both the control measurement and the main per-archetype loop below - one code path
// for "run TRIALS trials against one archetype/state directory," not two copies that could
// quietly drift apart from each other.
async function measureArchetypeState(browser, base, archName, state) {
  const dirName = state === 'approved-logo' ? `${archName}-approved` : archName;
  const archDir = path.join(base, dirName);
  const metaPath = path.join(archDir, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  const renderTimes = [];
  const transferTimes = []; // resourceResponseEnd - resourceStartTime: network component
  const decodeTimes = [];   // renderTime - resourceResponseEnd: decode+paint component
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
    if (entry && entry.resourceStartTime != null && entry.resourceResponseEnd != null) {
      transferTimes.push(entry.resourceResponseEnd - entry.resourceStartTime);
      const total = entry.renderTime || entry.loadTime;
      decodeTimes.push(total != null ? total - entry.resourceResponseEnd : null);
    } else {
      transferTimes.push(null);
      decodeTimes.push(null);
    }
  }

  const valid = renderTimes.filter((v) => v !== null);
  const validTransfer = transferTimes.filter((v) => v !== null);
  const validDecode = decodeTimes.filter((v) => v !== null);
  return {
    archetype: archName.toUpperCase(),
    state,
    spriteBytes: fs.statSync(path.join(archDir, metadata.spriteSheet.path)).size,
    frameCount: metadata.frameCount,
    trials: renderTimes,
    validTrials: valid.length,
    measuredLcpMedianMs: valid.length ? +median(valid).toFixed(1) : null,
    measuredLcpMinMs: valid.length ? +Math.min(...valid).toFixed(1) : null,
    measuredLcpMaxMs: valid.length ? +Math.max(...valid).toFixed(1) : null,
    transferTrials: transferTimes,
    transferMedianMs: validTransfer.length ? +median(validTransfer).toFixed(1) : null,
    decodeTrials: decodeTimes,
    decodeMedianMs: validDecode.length ? +median(validDecode).toFixed(1) : null,
    wallClockMedianMs: +median(wallClocks).toFixed(1),
  };
}

// Measures the control archetype/state and appends the reading to its own append-only log file -
// see the header comment for why this never touches lcp-measured-results.json.
async function measureControl(browser, base) {
  const row = await measureArchetypeState(browser, base, CONTROL_ARCHETYPE, CONTROL_STATE);
  if (!row) {
    throw new Error(
      `Control fixture not found: ${CONTROL_ARCHETYPE}/${CONTROL_STATE} - is test/cost-study/${CONTROL_ARCHETYPE}/metadata.json built?`
    );
  }
  const entry = { measuredAt: new Date().toISOString(), ...row };
  const log = fs.existsSync(CONTROL_LOG_PATH) ? JSON.parse(fs.readFileSync(CONTROL_LOG_PATH, 'utf8')) : [];
  log.push(entry);
  fs.writeFileSync(CONTROL_LOG_PATH, JSON.stringify(log, null, 2));
  return entry;
}

async function main() {
  const base = path.join(__dirname, 'cost-study');
  const rawArgs = process.argv.slice(2);
  const controlOnly = rawArgs.includes('--control-only');
  const trialsArg = rawArgs.find((a) => a.startsWith('--trials='));
  if (trialsArg) {
    const n = parseInt(trialsArg.split('=')[1], 10);
    if (!Number.isFinite(n) || n < 1) throw new Error(`--trials must be a positive integer, got: ${trialsArg}`);
    TRIALS = n;
  }
  // Optional CLI args scope this to specific archetypes (e.g. after
  // regenerating just one archetype's sheet) - same pattern measure-cost.js
  // already uses, added here for the same reason: re-running all six every
  // time a single sheet changes is wasteful and risks silently re-measuring
  // archetypes that were never touched. Flags (anything starting with --)
  // are filtered out so they aren't mistaken for archetype names.
  const positional = rawArgs.filter((a) => !a.startsWith('--'));
  const archNames = positional.length
    ? positional.map((a) => a.toLowerCase())
    : Object.keys(ARCHETYPES).map((k) => k.toLowerCase());

  const browser = await chromium.launch();
  const results = [];

  try {
    const control = await measureControl(browser, base);
    const spread = control.measuredLcpMaxMs - control.measuredLcpMinMs;
    console.log(
      `CONTROL ${control.archetype}/${control.state}  median=${control.measuredLcpMedianMs}ms ` +
      `(min=${control.measuredLcpMinMs}, max=${control.measuredLcpMaxMs}, spread=${spread.toFixed(1)}ms) ` +
      `sprite=${(control.spriteBytes / 1024).toFixed(1)}KB  [transfer=${control.transferMedianMs}ms decode=${control.decodeMedianMs}ms]  ` +
      `[logged to ${path.basename(CONTROL_LOG_PATH)}]`
    );

    if (controlOnly) {
      const log = JSON.parse(fs.readFileSync(CONTROL_LOG_PATH, 'utf8'));
      const medians = log.map((e) => e.measuredLcpMedianMs).filter((v) => v != null);
      if (medians.length > 1) {
        const lo = Math.min(...medians), hi = Math.max(...medians);
        console.log(
          `\n${medians.length} control readings on record: median range ${lo}-${hi}ms ` +
          `(spread ${(hi - lo).toFixed(1)}ms, ${(((hi - lo) / lo) * 100).toFixed(1)}% of the lowest reading)`
        );
      }
      return;
    }

    for (const arch of archNames) {
      for (const state of ['no-logo', 'approved-logo']) {
        const row = await measureArchetypeState(browser, base, arch, state);
        if (!row) {
          console.error(`SKIP ${arch} ${state}: ${path.join(base, state === 'approved-logo' ? `${arch}-approved` : arch, 'metadata.json')} not found`);
          continue;
        }
        row.controlMedianMs = control.measuredLcpMedianMs;
        row.ratioToControl = row.measuredLcpMedianMs != null && control.measuredLcpMedianMs
          ? +(row.measuredLcpMedianMs / control.measuredLcpMedianMs).toFixed(3)
          : null;
        // Component ratios - each against the control's OWN matching component, not the control's
        // blended figure, so a network-heavy archetype's transfer time is judged against the
        // control's transfer time specifically, not diluted by the control's own decode cost.
        row.transferRatioToControl = row.transferMedianMs != null && control.transferMedianMs
          ? +(row.transferMedianMs / control.transferMedianMs).toFixed(3)
          : null;
        row.decodeRatioToControl = row.decodeMedianMs != null && control.decodeMedianMs
          ? +(row.decodeMedianMs / control.decodeMedianMs).toFixed(3)
          : null;
        results.push(row);
        console.log(
          `${arch.padEnd(11)} ${state.padEnd(14)} measuredLCP median=${row.measuredLcpMedianMs}ms ` +
          `(min=${row.measuredLcpMinMs}, max=${row.measuredLcpMaxMs}, n=${row.validTrials}/${TRIALS}) ` +
          `sprite=${(row.spriteBytes/1024).toFixed(1)}KB  ratioToControl=${row.ratioToControl}x  ` +
          `[transfer=${row.transferMedianMs}ms(${row.transferRatioToControl}x) decode=${row.decodeMedianMs}ms(${row.decodeRatioToControl}x)]`
        );
      }
    }
  } finally {
    await browser.close();
  }

  // Merge into the existing results file when scoped to specific
  // archetypes, rather than overwriting it - a partial re-run (e.g. after
  // regenerating just one archetype's sheet) must not silently discard the
  // other archetypes' still-valid measurements. The control reading itself
  // is never part of this merge/write - see measureControl() above.
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
