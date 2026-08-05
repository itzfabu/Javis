// Archetype registry for Thread 3 frame generation. Each entry maps one of
// the six archetypes (per vault/Projects/Website Generator.md, Visual
// Richness > Archetype library) to its template scene file, native aspect
// ratio, frame count, and output resolution.
//
// Resolution rule: long edge fixed at 1200px, matching the one concretely
// tested/recommended number in the vault note's sprite-scaling resolution
// (ASSEMBLE's "2x (recommended): 800x1200/frame"). The short edge is derived
// from each archetype's native aspect ratio. This generalizes the one
// validated number rather than inventing an unrelated one, but only
// ASSEMBLE's own 800x1200 was independently measured - the other five are a
// disclosed generalization, not separately re-verified.
//
// Frame counts: ASSEMBLE (96) and SPIN (24) trace to prior spikes
// (flipbook-scale/flipbook-scrub and this project's own template_spin.py /
// scene.html respectively). REVEAL/TRANSFORM/FLYTHROUGH/INTERFACE counts
// below are this build's own reasoned defaults, not independently tested -
// see the divergence note in the vault writeup. All are plain config here,
// safe to tune later without touching capture/composite logic.

const LONG_EDGE_2X = 1200;
const WEBP_MAX_DIM = 16383; // libwebp's hard per-dimension limit - the reason a 1xN horizontal
                            // strip is impossible at these frame counts/resolutions (every
                            // archetype's old strip width exceeded this), and the reason the grid
                            // layout below exists at all.

function dimsFromRatio(wRatio, hRatio) {
  if (wRatio >= hRatio) {
    const w = LONG_EDGE_2X;
    const h = Math.round((LONG_EDGE_2X * hRatio) / wRatio);
    return { width: w, height: h };
  }
  const h = LONG_EDGE_2X;
  const w = Math.round((LONG_EDGE_2X * wRatio) / hRatio);
  return { width: w, height: h };
}

// Grid layout replacing the old 1xN horizontal strip (see vault note, Thread 3 > GRID SPRITE
// LAYOUT). Picks the near-square cols x rows that fits frameCount frames, preferring the smallest
// grid whose row/col counts keep both axes comfortably under WEBP_MAX_DIM - not just "a" grid that
// fits, since a near-square grid keeps both axes away from the limit rather than trading one axis
// down to the wire while leaving slack on the other.
function computeGrid(frameCount, dims) {
  const maxCols = Math.floor(WEBP_MAX_DIM / dims.width);
  const maxRows = Math.floor(WEBP_MAX_DIM / dims.height);
  let cols = Math.max(1, Math.min(maxCols, Math.round(Math.sqrt((frameCount * dims.height) / dims.width))));
  let rows = Math.ceil(frameCount / cols);
  while (rows > maxRows && cols < maxCols) {
    cols++;
    rows = Math.ceil(frameCount / cols);
  }
  if (rows > maxRows || cols > maxCols) {
    throw new Error(
      `Cannot fit ${frameCount} frames of ${dims.width}x${dims.height} into a grid under ` +
      `${WEBP_MAX_DIM}px per axis (maxCols=${maxCols}, maxRows=${maxRows}).`
    );
  }
  return {
    cols,
    rows,
    sheetWidth: cols * dims.width,
    sheetHeight: rows * dims.height,
  };
}

// The last real frame's (col, row) - not necessarily (cols-1, rows-1), since frameCount doesn't
// always divide the grid evenly (e.g. SPIN: 24 frames in a 5x5=25-cell grid leaves one empty
// trailing cell). CSS needs this exact cell for the unconditional static-frame fallback and the
// final @keyframes stop - "100% 100%" would be wrong whenever the grid isn't perfectly filled.
function lastFrameCell(frameCount, grid) {
  const lastIndex = frameCount - 1;
  return { col: lastIndex % grid.cols, row: Math.floor(lastIndex / grid.cols) };
}

const ARCHETYPES = {
  ASSEMBLE: {
    scene: 'assemble.html',
    frameCount: 96,
    aspectRatio: [2, 3],
    dims: dimsFromRatio(2, 3), // 800x1200 - matches the tested/recommended figure exactly
    grid: computeGrid(96, dimsFromRatio(2, 3)),
    stylized: true, // per Recommendation #2: ships generic/disclosed-as-stylized by default; real capture is a paid add-on, out of this pipeline's scope
    stylizedNote: 'Template shows a generic assembling structure, not the client\'s actual building. Disclose to the client as a stylized representation; real photogrammetry capture is a separate, manually-scoped paid add-on (not produced by this pipeline).',
  },
  REVEAL: {
    scene: 'reveal.html',
    frameCount: 48,
    aspectRatio: [4, 5],
    dims: dimsFromRatio(4, 5),
    grid: computeGrid(48, dimsFromRatio(4, 5)),
    stylized: false,
  },
  SPIN: {
    scene: 'spin.html',
    frameCount: 24,
    aspectRatio: [1, 1],
    dims: dimsFromRatio(1, 1),
    grid: computeGrid(24, dimsFromRatio(1, 1)),
    stylized: false,
  },
  TRANSFORM: {
    scene: 'transform.html',
    frameCount: 32,
    aspectRatio: [3, 2],
    dims: dimsFromRatio(3, 2),
    grid: computeGrid(32, dimsFromRatio(3, 2)),
    stylized: false,
  },
  FLYTHROUGH: {
    scene: 'flythrough.html',
    frameCount: 72,
    aspectRatio: [16, 9],
    dims: dimsFromRatio(16, 9),
    grid: computeGrid(72, dimsFromRatio(16, 9)),
    stylized: true, // per Recommendation #2: same disclosed-stylized default as ASSEMBLE
    stylizedNote: 'Template shows a generic environment glide, not the client\'s actual space. Disclose to the client as a stylized representation; real photogrammetry capture is a separate, manually-scoped paid add-on (not produced by this pipeline).',
  },
  INTERFACE: {
    scene: 'interface.html',
    frameCount: 48,
    aspectRatio: [16, 9],
    dims: dimsFromRatio(16, 9),
    grid: computeGrid(48, dimsFromRatio(16, 9)),
    stylized: false,
  },
};

function getArchetype(name) {
  const key = (name || '').toUpperCase().trim();
  const entry = ARCHETYPES[key];
  if (!entry) {
    throw new Error(
      `Unknown archetype "${name}". Valid archetypes: ${Object.keys(ARCHETYPES).join(', ')}`
    );
  }
  return { key, ...entry };
}

module.exports = { ARCHETYPES, getArchetype, LONG_EDGE_2X, WEBP_MAX_DIM, computeGrid, lastFrameCell };
