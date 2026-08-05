// Tests whether the percentage-based background-size/position technique keeps
// frame stepping exact and bleed-free across real viewport widths, in both an
// aspect-locked contained box and a deliberately mismatched full-bleed box.
// Throwaway - not part of the real generator.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 1920, h: 1080, label: '1920' },
  { w: 1440, h: 900, label: '1440' },
  { w: 1024, h: 768, label: '1024' },
  { w: 768, h: 1024, label: '768' },
  { w: 390, h: 844, label: '390' },
];
const SCROLL_FRACTIONS = [0, 0.25, 0.5, 1.0];
const N_STEPS = 95; // steps(95, jump-none) -> 96 discrete values, 0..95

function expectedFrame(t) {
  // steps(95, jump-none) over a 0%->100% keyframe range driven 1:1 by
  // animation-timeline: scroll(root block): same quantization logic as the
  // original a-native-css.html spike used to validate frame accuracy.
  return Math.min(N_STEPS, Math.floor(t * N_STEPS + 1e-9));
}

async function testPage(browser, fileName, label, results) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto('file:///' + path.join(ROOT, fileName).replace(/\\/g, '/'));
    await page.waitForTimeout(200);

    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

    for (const t of SCROLL_FRACTIONS) {
      const scrollY = Math.round(maxScroll * t);
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(150);

      const state = await page.evaluate(() => {
        const out = {};
        if (window.__currentFrame) out.frame = window.__currentFrame();
        if (window.__boxRect) out.boxRect = window.__boxRect();
        return out;
      });

      const exp = expectedFrame(t);
      const actualFrame = state.frame ? state.frame.frame : null;
      const match = actualFrame === exp;
      results.push({
        page: label, viewport: vp.label, t, scrollY,
        expectedFrame: exp, actualFrame, match,
        boxWidth: state.boxRect ? state.boxRect.width : (state.frame ? state.frame.boxW : null),
      });

      const shotName = `${label}-vw${vp.label}-t${Math.round(t * 100)}.png`;
      await page.screenshot({ path: path.join(OUT, shotName) });
    }
    await page.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  const results = [];

  await testPage(browser, 'percent-contained.html', 'contained', results);
  await testPage(browser, 'percent-fullbleed.html', 'fullbleed', results);
  await testPage(browser, 'percent-vertical.html', 'vertical', results);

  await browser.close();

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

  console.log('\n=== FRAME ACCURACY SUMMARY ===');
  const byPage = {};
  for (const r of results) {
    byPage[r.page] = byPage[r.page] || { total: 0, match: 0, mismatches: [] };
    byPage[r.page].total++;
    if (r.match) byPage[r.page].match++;
    else byPage[r.page].mismatches.push(r);
  }
  for (const [page, stats] of Object.entries(byPage)) {
    console.log(`${page}: ${stats.match}/${stats.total} exact matches`);
    for (const m of stats.mismatches) {
      console.log(`  MISMATCH: vw=${m.viewport} t=${m.t} expected=${m.expectedFrame} actual=${m.actualFrame} boxWidth=${m.boxWidth}`);
    }
  }
  console.log('\nFull results: ' + path.join(OUT, 'results.json'));
})();
