// Sheet-integrity guard for the composite stage. Every existing regression
// guard (frustum, occlusion) runs during CAPTURE, checking the scene before
// any frame is ever composited - none of them can catch a bug that happens
// DURING compositing itself. That gap is real, not theoretical: the
// blank-canvas bug found while filling in the PNG+grid measurement cell
// (locator.screenshot() silently painting only a small region near the
// canvas origin, leaving the rest blank white, for canvases wider than
// ~65,535-76,800px in this Chromium build) happened at exactly this stage,
// in the ORIGINAL pre-rework composite.js, and produced real shipped sprite
// sheets that were mostly blank with nothing catching it. See vault:
// "FORMAT/LAYOUT CELL FILLED..." section for the full account.
//
// This module drives compose/verify-sheet.html to load the ACTUAL WRITTEN
// sheet file back (not the in-memory pre-encode canvas - the bug above
// happens during encode/screenshot, so only the real on-disk file can
// reveal it) and checks three things against what the caller (composite.js)
// expects the sheet to be:
//   1. Sheet dimensions match cols*frameW x rows*frameH exactly.
//   2. Every frame cell is non-uniform (not a flat fill) - a std-dev floor
//      on the cell's own luma values.
//   3. Adjacent (temporally sequential) cells aren't ALL near-identical -
//      NOT a per-pair requirement (see below for why), but a ceiling on
//      what fraction of adjacent pairs may be near-identical.
//   4. The caller's chosen fallbackFrame (optional param - src/archetypes.js
//      per-archetype choice, see that file's own header) is checked AGAIN,
//      separately and by name, against the same non-uniform floor as check
//      2 - not because the math differs, but because this ONE frame is the
//      entire hero image for every visitor who never sees the animation at
//      all (src/metadata.js points both the unconditional base state and
//      prefers-reduced-motion at it). A blank fallback frame deserves its
//      own named failure, not a slot in check 2's generic list where its
//      severity could be missed.
//
// WHY THE ADJACENT-PAIR CHECK IS A FRACTION CEILING, NOT A PER-PAIR FLOOR:
// tested a strict "every adjacent pair must differ above some floor" rule
// against real captured frames first, per the task's own instruction to
// measure before choosing. It fails immediately on real, correctly
// rendered content: ASSEMBLE has 19 of 95 adjacent pairs that are BYTE-
// IDENTICAL (mostly-static-until-triggered blocks genuinely hold the same
// frame while nothing is dropping yet) and REVEAL has 6 of 47 (a held
// start before elements begin falling) - both real, both legitimate, both
// would false-positive under a strict per-pair rule. A per-pair floor is
// therefore the wrong check, not a floor that needs tuning - stated
// plainly rather than forcing the originally-imagined design to "pass" by
// picking degenerate numbers. The fraction-ceiling design below still
// catches the actual bug (see calibration data): a genuinely blank/
// corrupted sheet has NEARLY ALL adjacent pairs near-identical (blank
// next to blank), a real archetype's worst legitimate case tops out at
// ~25%.
//
// FLOORS, CALIBRATED FROM REAL DATA (test/cost-study/*/frames/, all six
// archetypes), not guessed - measured via a one-off Python/Pillow pass
// (throwaway, not shipped) over the raw captured frame PNGs:
//
// NEAR_ZERO_MEAN_DIFF = 0.05 (mean absolute per-channel luma difference,
// 0-255 scale, between two temporally-adjacent cells, below which they
// count as "near-identical" for the fraction-ceiling check). Chosen well
// below SPIN's measured real minimum: SPIN is a continuous 360-degree
// rotation with no static holds, so its slowest-changing real adjacent
// pair is the tightest legitimate case across all six archetypes -
// measured minimum mean-abs-diff 0.209 (pair 15->16, frameCount=24).
// 0.05 sits with >4x margin below that, so genuine SPIN motion is never
// misclassified as a duplicate, while still sitting decisively above true
// byte-identical duplicates (0.0000, measured on ASSEMBLE/REVEAL's real
// static-hold pairs).
const NEAR_ZERO_MEAN_DIFF = 0.05;

// NEAR_ZERO_FRACTION_CEILING = 0.5 (fraction of adjacent pairs allowed to
// be near-identical before the sheet fails). ASSEMBLE's measured real
// worst case is 24/95 (~25.3%) of pairs near-identical (its static holds);
// REVEAL's is 6/47 (~12.8%). 0.5 sits comfortably above the highest real
// legitimate case with ~2x margin, while a genuinely blank/corrupted
// sheet - only the first frame painted, everything else identical blank -
// would show close to 100% of pairs near-identical, nowhere near this
// ceiling.
const NEAR_ZERO_FRACTION_CEILING = 0.5;

// NON_UNIFORM_STD_FLOOR = 0.5 (a cell's own luma standard deviation must
// exceed this to count as real rendered content, not a flat fill).
//
// CORRECTED 2026-08-06: originally set to 1.0, calibrated against a wrong
// belief that the lowest real legitimate std was TRANSFORM's final frame at
// ~4.99 (~5x margin). Re-measuring across all six archetypes' actual
// captures found the true minimum is INTERFACE's earliest frames (indices
// 0-8, std 1.29-1.47) - only a ~1.3x cushion above the old 1.0 floor, not
// 5x. These frames are legitimate, not a bug: INTERFACE's three dashboard
// panels slide in on staggered delays (see scenes/interface.html's PANELS
// array), so at t~0.06 (frame 3 of 48) all three are still off-screen -
// the only on-screen content is the small "+N%" counter digit against flat
// background, confirmed by direct inspection of the captured frame, not
// assumed from the std number alone. Nothing in the scene is broken or
// worth "fixing" to raise this number - the choreography is working as
// designed, and forcing the panels to appear earlier just to pad this
// guard's own margin would be tuning the content to please a test, not
// fixing a defect.
//
// Chosen the floor down instead, to 0.5 - a fresh ~2.6x margin below the
// real 1.29 minimum (roughly the same proportion of headroom
// NEAR_ZERO_MEAN_DIFF and NEAR_ZERO_FRACTION_CEILING above use relative to
// their own real calibration data, not the ~5x this constant was
// mistakenly assumed to have). A different client's counter-text/background
// combination could legitimately land lower than Family Law in
// Partnership's real 1.29 (a low-contrast palette makes an even smaller
// contribution from the same tiny counter digit) - this margin exists for
// that case, not for this one specifically, which already passed even
// under the old floor. Still catches an actually-blank frame with total
// confidence: FLYTHROUGH's real, previously-shipped bug measured std=0.000,
// excluded from this calibration for the same reason noted originally (a
// genuine defect, not a low-variance case to calibrate against) - 0.5 sits
// nowhere near it.
const NON_UNIFORM_STD_FLOOR = 0.5;

const path = require('path');
const { chromium } = require('playwright');
const { startServer } = require('./static-server');

async function verifySheetIntegrity({ sheetPath, frameCount, dims, grid, fallbackFrame }) {
  const sheetDir = path.dirname(sheetPath);
  const sheetName = path.basename(sheetPath);
  const composeRoot = path.join(__dirname, '..', 'compose');

  const server = await startServer({ '/compose/': composeRoot, '/sheet/': sheetDir });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    const qs = new URLSearchParams({
      sheetUrl: `${server.baseUrl}/sheet/${sheetName}`,
      frameCount: String(frameCount),
      cols: String(grid.cols),
      rows: String(grid.rows),
      frameW: String(dims.width),
      frameH: String(dims.height),
    });
    await page.goto(`${server.baseUrl}/compose/verify-sheet.html?${qs.toString()}`);
    await page.waitForFunction('window.__verifyResult || window.__verifyError', { timeout: 60000 });

    const error = await page.evaluate('window.__verifyError');
    if (error) throw new Error(`sheet-integrity check could not load/read the sheet: ${error}`);

    const result = await page.evaluate('window.__verifyResult');
    await page.close();

    const problems = [];

    if (!result.dimsOk) {
      problems.push(
        `dimensions mismatch: sheet is ${result.actualWidth}x${result.actualHeight}px, ` +
        `expected ${result.expectedWidth}x${result.expectedHeight}px (${grid.cols}x${grid.rows} grid ` +
        `of ${dims.width}x${dims.height} frames)`
      );
    }

    const flatCells = result.cellStds
      .map((std, i) => ({ std, i }))
      .filter((c) => c.std <= NON_UNIFORM_STD_FLOOR);
    if (flatCells.length > 0) {
      problems.push(
        `${flatCells.length}/${frameCount} frame cell(s) are flat fills (std <= ${NON_UNIFORM_STD_FLOOR}): ` +
        `frame indices ${flatCells.slice(0, 10).map((c) => c.i).join(', ')}` +
        (flatCells.length > 10 ? ', ...' : '')
      );
    }

    // The fallback frame's own cell gets a SEPARATE, named check, not just
    // a slot in the generic flatCells list above. It carries more weight
    // than every other frame combined: src/metadata.js points BOTH the
    // unconditional @supports base state AND prefers-reduced-motion at it,
    // so it is the entire hero image for every visitor who never runs the
    // animation at all - exactly the failure mode that shipped undetected
    // before this guard existed (see vault: SHEET INTEGRITY GUARD's
    // FLYTHROUGH finding, a real blank frame that was the fallback for
    // every such visitor). A generic "N cells are flat" message could
    // easily be misread as low-severity; this can't be.
    let fallbackFrameOk = true;
    if (fallbackFrame != null) {
      const fbStd = result.cellStds[fallbackFrame];
      fallbackFrameOk = fbStd != null && fbStd > NON_UNIFORM_STD_FLOOR;
      if (!fallbackFrameOk) {
        problems.push(
          `FALLBACK FRAME IS BLANK: frame index ${fallbackFrame} (std=${fbStd}, floor=${NON_UNIFORM_STD_FLOOR}) is a flat fill. ` +
          `This is the frame src/metadata.js uses for the unconditional base state AND prefers-reduced-motion - ` +
          `every Firefox visitor and every reduced-motion visitor sees THIS frame as the entire hero image. ` +
          `Do not ship this sheet - fix the scene/camera at this frame fraction, or reconsider the archetype's ` +
          `fallbackFrame choice in src/archetypes.js if the frame itself is inherently unsuitable.`
        );
      }
    }

    const nearZeroPairs = result.adjacentDiffs.filter((d) => d <= NEAR_ZERO_MEAN_DIFF).length;
    const nearZeroFraction = result.adjacentDiffs.length > 0 ? nearZeroPairs / result.adjacentDiffs.length : 0;
    if (nearZeroFraction > NEAR_ZERO_FRACTION_CEILING) {
      problems.push(
        `${nearZeroPairs}/${result.adjacentDiffs.length} adjacent frame pairs (${(nearZeroFraction * 100).toFixed(1)}%) ` +
        `are near-identical (mean diff <= ${NEAR_ZERO_MEAN_DIFF}), over the ${(NEAR_ZERO_FRACTION_CEILING * 100).toFixed(0)}% ` +
        `ceiling - looks like a blank/duplicated sheet, not real animated content`
      );
    }

    return {
      ok: problems.length === 0,
      problems,
      dimsOk: result.dimsOk,
      flatCellCount: flatCells.length,
      flatCellIndices: flatCells.map((c) => c.i),
      fallbackFrame: fallbackFrame != null ? fallbackFrame : null,
      fallbackFrameOk,
      fallbackFrameStd: fallbackFrame != null ? result.cellStds[fallbackFrame] : null,
      nearZeroPairCount: nearZeroPairs,
      nearZeroPairFraction: +nearZeroFraction.toFixed(3),
      cellStds: result.cellStds,
      adjacentDiffs: result.adjacentDiffs,
    };
  } finally {
    await browser.close();
    await server.close();
  }
}

module.exports = {
  verifySheetIntegrity,
  NEAR_ZERO_MEAN_DIFF,
  NEAR_ZERO_FRACTION_CEILING,
  NON_UNIFORM_STD_FLOOR,
};
