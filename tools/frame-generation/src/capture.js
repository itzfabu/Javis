// Headless Playwright capture: renders one archetype's template scene N
// times (once per deterministic frame index, via window.__renderFrame(t) -
// no animation loop, no timing races, same contract as the original
// hybrid-template spike) and screenshots each frame as a PNG.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { getArchetype } = require('./archetypes');
const { startServer } = require('./static-server');

const TOOL_ROOT = path.join(__dirname, '..');

function stripHash(hex) {
  return (hex || '').replace(/^#/, '');
}

// Decides how (or whether) to composite a logo, per Thread 3 Recommendation
// #4: a real extracted logo asset waits on Thread 1's mandatory review gate
// (meta.reviewStatus === 'approved'); a text-wordmark fallback was never an
// extraction guess in the first place, so it doesn't need that gate.
function resolveLogoPlan(tokens, outDir) {
  const logo = tokens.logo || {};
  const fg = tokens.frameGeneration || {};
  const logoCfg = fg.logoCompositing || {};
  const reviewed = tokens.meta && tokens.meta.reviewStatus === 'approved';

  if (logo.wordmarkFallback) {
    return {
      logoText: tokens.meta && tokens.meta.client ? tokens.meta.client : '',
      logoAssetUrl: '',
      assetDir: null,
      logoFraction: logoCfg.appearsAtFrameFraction != null ? logoCfg.appearsAtFrameFraction : 1.0,
      note: 'text-wordmark fallback used directly - not an extraction guess, so not gated on the review step',
    };
  }

  if (logoCfg.enabled && logoCfg.assetPath) {
    if (!reviewed) {
      return {
        logoText: '',
        logoAssetUrl: '',
        assetDir: null,
        logoFraction: 1.0,
        note: `SKIPPED: tokens.logo is an extracted asset (${logoCfg.assetPath}) but tokens.meta.reviewStatus is "${tokens.meta && tokens.meta.reviewStatus}", not "approved" - per Thread 3 Recommendation #4, an unreviewed extracted logo is never composited. Run the Thread 1 review gate first.`,
      };
    }
    const absAssetPath = path.isAbsolute(logoCfg.assetPath)
      ? logoCfg.assetPath
      : path.resolve(process.cwd(), logoCfg.assetPath);
    if (!fs.existsSync(absAssetPath)) {
      return {
        logoText: '',
        logoAssetUrl: '',
        assetDir: null,
        logoFraction: 1.0,
        note: `SKIPPED: reviewed logo asset path does not exist on disk: ${absAssetPath}`,
      };
    }
    const assetDir = path.join(outDir, 'assets');
    fs.mkdirSync(assetDir, { recursive: true });
    const ext = path.extname(absAssetPath) || '.png';
    const destName = 'logo' + ext;
    fs.copyFileSync(absAssetPath, path.join(assetDir, destName));
    return {
      logoText: '',
      logoAssetUrl: '/asset/' + destName,
      assetDir,
      logoFraction: logoCfg.appearsAtFrameFraction != null ? logoCfg.appearsAtFrameFraction : 1.0,
      note: 'reviewed logo asset composited',
    };
  }

  return {
    logoText: '',
    logoAssetUrl: '',
    assetDir: null,
    logoFraction: 1.0,
    note: 'no logo asset or wordmark available - frame sequence composites nothing, per Thread 1\'s own frameGeneration.logoCompositing note',
  };
}

async function captureFrames({ archetypeName, tokens, outDir }) {
  const archetype = getArchetype(archetypeName || (tokens.archetype && tokens.archetype.recommended));
  const fg = tokens.frameGeneration || {};
  const palette = fg.paletteForFrames || [];
  const primary = stripHash(palette[0]) || 'C4622D';
  const accent = stripHash(palette[1]) || 'E8A23D';
  const tertiary = stripHash(palette[2]) || primary;
  const bg = stripHash(fg.backgroundForFrames) || 'FFFFFF';

  const framesDir = path.join(outDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });

  const logoPlan = resolveLogoPlan(tokens, outDir);

  const server = await startServer({
    '/scenes/': path.join(TOOL_ROOT, 'scenes'),
    '/vendor/': path.join(TOOL_ROOT, 'vendor'),
    '/asset/': logoPlan.assetDir,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: archetype.dims.width, height: archetype.dims.height } });

    const qs = new URLSearchParams({
      w: String(archetype.dims.width),
      h: String(archetype.dims.height),
      primary, accent, tertiary, bg,
      logoText: logoPlan.logoText,
      logoAsset: logoPlan.logoAssetUrl,
      logoFraction: String(logoPlan.logoFraction),
    });
    const url = `${server.baseUrl}/scenes/${archetype.scene}?${qs.toString()}`;

    const t0 = Date.now();
    await page.goto(url);
    await page.waitForFunction('window.__ready === true && window.__logoReady !== false');

    // Frustum regression guard: move to the frame where the logo is actually
    // supposed to be visible (its appearsAtFrameFraction - for FLYTHROUGH
    // specifically the camera has moved by then, so checking at t=0 would
    // silently check the wrong camera position) and assert the logo mesh's
    // world-space bounding-box corners project inside the camera's view.
    // Fails the whole capture loudly rather than silently shipping a
    // clipped/invisible logo - see vault note for the ASSEMBLE finding this
    // caught.
    const checkT = Math.max(0, Math.min(1, logoPlan.logoFraction));
    await page.evaluate((t) => window.__renderFrame(t), checkT);
    const frustumResult = await page.evaluate(() => (window.__frustumCheck ? window.__frustumCheck() : null));
    if (frustumResult && !frustumResult.ok) {
      const failing = frustumResult.corners.filter((c) => !c.within);
      throw new Error(
        `FRUSTUM CHECK FAILED for archetype ${archetype.key}: the logo signboard's bounding-box ` +
        `corners fall outside the camera's view at t=${checkT} (margin ${frustumResult.margin}, ` +
        `bound ${frustumResult.bound}). ${failing.length}/${frustumResult.corners.length} corners ` +
        `out of bounds: ${JSON.stringify(failing)}. Retune the camera or signboard placement in ` +
        `scenes/${archetype.scene} - do not loosen the margin to make this pass.`
      );
    }
    await page.evaluate(() => window.__renderFrame(0)); // reset before the real capture loop below

    const canvas = page.locator('#c');
    const frameCount = archetype.frameCount;
    for (let i = 0; i < frameCount; i++) {
      const t = frameCount === 1 ? 0 : i / (frameCount - 1);
      await page.evaluate((t) => window.__renderFrame(t), t);
      const frameName = `frame-${String(i).padStart(4, '0')}.png`;
      await canvas.screenshot({ path: path.join(framesDir, frameName) });
    }
    const elapsedMs = Date.now() - t0;

    await page.close();
    return {
      archetype,
      framesDir,
      frameCount,
      dims: archetype.dims,
      elapsedMs,
      msPerFrame: elapsedMs / frameCount,
      logoPlan,
    };
  } finally {
    await browser.close();
    await server.close();
  }
}

module.exports = { captureFrames, resolveLogoPlan };
