// Measures the REAL generated page (generated-sites/birds-barbershop/),
// not the isolated hero-alone harness measure-lcp.js uses. Every LCP figure
// in the vault so far was taken with the sprite alone on a blank test page
// (measure-lcp.js's buildHeroPage) - this answers a different question:
// what does LCP look like once the hero sits inside a real page (nav,
// fonts, services section, contact form, footer)?
//
// Same throttling profile as measure-lcp.js (4x CPU, Lighthouse Slow-4G),
// same control archetype (INTERFACE/no-logo) read in the same session for
// cross-session comparability, same fresh-context-per-trial cold-cache
// discipline.
//
// Two LCP signals are collected, not one:
//   1. The NATIVE `largest-contentful-paint` PerformanceObserver - the real
//      metric, not a proxy. measure-lcp.js's header records this didn't
//      reliably fire for a CSS background-image div under throttling in
//      this build; a real page with an <img> logo and real text is a
//      different case, worth actually testing rather than assuming the
//      same result.
//   2. Element Timing on three named above-fold candidates (headline,
//      hero-sprite, nav logo) as a disclosed fallback/cross-check, same
//      mechanism measure-lcp.js already trusts.
// Whichever the native observer names as the final LCP element is reported
// as the answer to "is the hero still the LCP element."

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startServer } = require('../src/static-server');

const TRIALS = process.argv.includes('--trials')
  ? parseInt(process.argv[process.argv.indexOf('--trials') + 1], 10)
  : 15;
const CPU_THROTTLE_RATE = 4;
const NETWORK = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

const SITE_DIR = path.join(__dirname, '..', '..', '..', 'generated-sites', 'birds-barbershop');
const CONTROL_DIR = path.join(__dirname, 'cost-study', 'interface');

function instrumentedHtml() {
  let html = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');
  html = html
    .replace('<h1>Walk In Rough', '<h1 elementtiming="hero-headline">Walk In Rough')
    .replace('class="hero-sprite"', 'class="hero-sprite" elementtiming="hero-sprite"')
    .replace('class="brand-logo"', 'class="brand-logo" elementtiming="hero-logo"');
  const instrumentation = `
<script>
window.__getEntry = () => new Promise((resolve) => {
  let lcpEntries = [];
  const elementEntries = {};
  let done = false;
  let quietTimer = null;

  function finish() {
    if (done) return;
    done = true;
    lcpObserver.disconnect();
    elObserver.disconnect();
    clearTimeout(quietTimer);
    clearTimeout(safetyTimer);
    const lastLcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1] : null;
    resolve({
      nativeLcp: lastLcp ? {
        renderTime: lastLcp.renderTime, loadTime: lastLcp.loadTime, size: lastLcp.size,
        elementTag: lastLcp.element ? lastLcp.element.tagName : null,
        elementClass: lastLcp.element ? lastLcp.element.className : null,
        url: lastLcp.url || null,
        entryCount: lcpEntries.length,
      } : null,
      elementTimings: elementEntries,
    });
  }

  // A fixed "load + Nms" window can close BEFORE a later, bigger candidate
  // (the hero sprite) finishes decoding under heavy throttle - a real bug
  // found while smoke-testing this script: 2 of 3 first trials finalized on
  // the H1 alone (entryCount:1) while the sprite was still mid-decode.
  // Debounce instead: every new LCP entry resets a quiet window; finalize
  // once QUIET_MS passes with no new (bigger) candidate, capped by an
  // absolute safety timeout so a trial can't hang forever.
  const QUIET_MS = 4000;
  const lcpObserver = new PerformanceObserver((list) => {
    lcpEntries = lcpEntries.concat(list.getEntries());
    clearTimeout(quietTimer);
    quietTimer = setTimeout(finish, QUIET_MS);
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  quietTimer = setTimeout(finish, QUIET_MS);

  const elObserver = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) elementEntries[e.identifier] = { renderTime: e.renderTime, loadTime: e.loadTime };
  });
  elObserver.observe({ type: 'element', buffered: true });

  const safetyTimer = setTimeout(finish, 45000); // absolute cap - this page is much heavier than the isolated hero harness
});
</script>`;
  return html.replace('</body>', `${instrumentation}\n</body>`);
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function measureRealPage(browser) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });
    await client.send('Network.emulateNetworkConditions', NETWORK);

    const tmpPath = path.join(SITE_DIR, `_lcp-measure-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(tmpPath, instrumentedHtml());
    const server = await startServer({ '/site/': SITE_DIR });
    try {
      const t0 = Date.now();
      await page.goto(`${server.baseUrl}/site/${path.basename(tmpPath)}`, { waitUntil: 'commit' });
      await page.waitForFunction(() => typeof window.__getEntry === 'function');
      const entry = await page.evaluate(() => window.__getEntry());
      const wallClockMs = Date.now() - t0;
      return { entry, wallClockMs };
    } finally {
      await server.close();
      fs.unlinkSync(tmpPath);
    }
  } finally {
    await context.close();
  }
}

async function measureControlOnce(browser) {
  const metadata = JSON.parse(fs.readFileSync(path.join(CONTROL_DIR, 'metadata.json'), 'utf8'));
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });
    await client.send('Network.emulateNetworkConditions', NETWORK);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}${metadata.css}</style></head><body>${metadata.html.replace('class="hero-sprite"', 'class="hero-sprite" elementtiming="hero-sprite"')}
<script>window.__getEntry=()=>new Promise((resolve)=>{const po=new PerformanceObserver((list)=>{for(const e of list.getEntries()){if(e.identifier==='hero-sprite'){resolve({renderTime:e.renderTime});po.disconnect();return;}}});po.observe({type:'element',buffered:true});setTimeout(()=>resolve(null),40000);});</script>
</body></html>`;
    const tmpPath = path.join(CONTROL_DIR, `_lcp-control-${Date.now()}.html`);
    fs.writeFileSync(tmpPath, html);
    const server = await startServer({ '/page/': CONTROL_DIR });
    try {
      await page.goto(`${server.baseUrl}/page/${path.basename(tmpPath)}`, { waitUntil: 'commit' });
      const entry = await page.evaluate(() => window.__getEntry());
      return entry && entry.renderTime;
    } finally {
      await server.close();
      fs.unlinkSync(tmpPath);
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch();
  try {
    console.log(`Running ${TRIALS} trials against the real page (${SITE_DIR}) + control...\n`);

    const controlTimes = [];
    for (let i = 0; i < TRIALS; i++) {
      controlTimes.push(await measureControlOnce(browser));
    }
    const validControl = controlTimes.filter((v) => v != null);
    const controlMedian = median(validControl);
    console.log(`CONTROL (interface/no-logo, isolated hero)  median=${controlMedian.toFixed(1)}ms  (n=${validControl.length}/${TRIALS})`);

    const renderTimes = [];
    const wallClocks = [];
    const nativeLcpSamples = [];
    const elementTimingSamples = [];
    for (let i = 0; i < TRIALS; i++) {
      const { entry, wallClockMs } = await measureRealPage(browser);
      wallClocks.push(wallClockMs);
      if (entry) {
        if (entry.nativeLcp) nativeLcpSamples.push(entry.nativeLcp);
        elementTimingSamples.push(entry.elementTimings);
        const rt = entry.nativeLcp ? entry.nativeLcp.renderTime || entry.nativeLcp.loadTime : null;
        renderTimes.push(rt);
      } else {
        renderTimes.push(null);
      }
      console.log(`trial ${i + 1}/${TRIALS}: nativeLcp=${entry && entry.nativeLcp ? JSON.stringify(entry.nativeLcp) : 'NONE'}  elementTimings=${JSON.stringify(entry && entry.elementTimings)}  wallClock=${wallClockMs}ms`);
    }

    const validRender = renderTimes.filter((v) => v != null && v > 0);
    console.log(`\nNative LCP fired in ${nativeLcpSamples.length}/${TRIALS} trials.`);
    if (validRender.length) {
      const med = median(validRender);
      console.log(`REAL PAGE native-LCP median=${med.toFixed(1)}ms (min=${Math.min(...validRender).toFixed(1)}, max=${Math.max(...validRender).toFixed(1)}, n=${validRender.length}/${TRIALS})`);
      console.log(`ratioToControl=${(med / controlMedian).toFixed(3)}x`);
    }

    // Element Timing summary across all trials, per candidate
    const candidates = ['hero-headline', 'hero-sprite', 'hero-logo'];
    for (const id of candidates) {
      const times = elementTimingSamples.map((e) => e && e[id] && e[id].renderTime).filter((v) => v != null && v > 0);
      if (times.length) {
        console.log(`  elementTiming[${id}]: median=${median(times).toFixed(1)}ms (n=${times.length}/${TRIALS})`);
      } else {
        console.log(`  elementTiming[${id}]: no valid samples`);
      }
    }

    const outPath = path.join(SITE_DIR, 'lcp-real-page-results.json');
    fs.writeFileSync(outPath, JSON.stringify({
      measuredAt: new Date().toISOString(),
      trials: TRIALS,
      controlMedianMs: +controlMedian.toFixed(1),
      controlTrials: controlTimes,
      nativeLcpFiredCount: nativeLcpSamples.length,
      nativeLcpSamples,
      elementTimingSamples,
      wallClocks,
    }, null, 2));
    console.log('\nWrote', outPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
