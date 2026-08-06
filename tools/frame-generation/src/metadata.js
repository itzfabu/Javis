// Builds the CSS/HTML snippet + metadata JSON a generated site's page
// template drops in directly, per the RESOLVED sprite-scaling output spec
// in vault/Projects/Website Generator.md, as reworked by the GRID SPRITE
// LAYOUT change: frames are laid out in a 2D grid (cols x rows), not a 1xN
// horizontal strip - percentage-based background-size/background-position
// still governs both axes (never pixel-based - that's what caused the
// original bleed bug), a contained/centered hero-object sized to the
// sprite's native aspect ratio (never full-bleed), and prefers-reduced-motion
// is respected (per UI Craft > Motion Accessibility - a hard requirement).
//
// CSS mechanism change from the 1xN strip version: `steps(frameCount-1,
// jump-none)` animating a single background-position-x axis doesn't
// generalize to two axes (there's no such thing as "step through a 2D grid"
// via a single steps() timing function on two independent properties without
// them getting out of sync at row boundaries). Per-frame explicit
// @keyframes stops are used instead: one stop per frame, each carrying its
// own `animation-timing-function: steps(1, jump-end)` so the browser holds
// that exact background-position for the whole segment and jumps
// discretely to the next frame's position at the segment's end, rather than
// smoothly interpolating (tweening) between grid cells - which is what
// would happen with plain keyframes and no per-stop timing function, and
// would look like the sprite sliding/smearing between frames instead of
// stepping. Verbosity (one stop per frame) is an accepted tradeoff, not a
// gap - this stylesheet is generated, not hand-authored.
//
// Display-cap axis (disclosed extension, unchanged from the 1xN version):
// only the portrait 2:3 case (ASSEMBLE) was tested end-to-end with a height
// cap. Landscape archetypes are capped by width instead.

function frameBackgroundPosition(index, grid) {
  const col = index % grid.cols;
  const row = Math.floor(index / grid.cols);
  const x = grid.cols > 1 ? (col / (grid.cols - 1)) * 100 : 0;
  const y = grid.rows > 1 ? (row / (grid.rows - 1)) * 100 : 0;
  return { x: +x.toFixed(3), y: +y.toFixed(3) };
}

function buildCssSnippet({ archetypeKey, frameCount, aspectRatio, grid, spriteSheetRelPath, fallbackFrame }) {
  const [w, h] = aspectRatio;
  const isLandscape = w > h;
  const capRule = isLandscape
    ? 'width: min(90vw, 1200px);\n  height: auto;'
    : 'height: min(78vh, 720px);\n  width: auto;';
  const bgSizeXPercent = 100 * grid.cols;
  const bgSizeYPercent = 100 * grid.rows;

  // fallbackFrame (default: the last frame, via getArchetype()) is what
  // renders for every visitor who never sees the animation at all - the
  // unconditional base state below AND the prefers-reduced-motion state
  // both use it, per src/archetypes.js's own per-archetype reasoning (a
  // deliberate choice looked at frame-by-frame, not always the last frame -
  // see the vault's FALLBACK FRAME section).
  const fbIndex = fallbackFrame != null ? fallbackFrame : frameCount - 1;
  const fallbackCell = { col: fbIndex % grid.cols, row: Math.floor(fbIndex / grid.cols) };
  const fallbackPos = frameBackgroundPosition(fbIndex, grid);
  const animName = `hero-scrub-${archetypeKey.toLowerCase()}`;

  const keyframeLines = [];
  for (let i = 0; i < frameCount; i++) {
    const percent = frameCount > 1 ? (i / (frameCount - 1)) * 100 : 0;
    const pos = frameBackgroundPosition(i, grid);
    const timingFn = i < frameCount - 1 ? ' animation-timing-function: steps(1, jump-end);' : '';
    keyframeLines.push(`  ${percent.toFixed(3)}% { background-position: ${pos.x}% ${pos.y}%;${timingFn} }`);
  }

  const css = `/* Thread 3 hero sprite - archetype: ${archetypeKey}, ${frameCount} frames, ${grid.cols}x${grid.rows} grid, native ratio ${w}:${h} */
.hero-sprite {
  aspect-ratio: ${w} / ${h};
  ${capRule}
  margin: 0 auto;
  background-image: url('${spriteSheetRelPath}');
  background-repeat: no-repeat;
  background-size: ${bgSizeXPercent}% ${bgSizeYPercent}%; /* percentage, not px - required, see this project's own bleed-bug finding */
  background-position: ${fallbackPos.x}% ${fallbackPos.y}%; /* unconditional base state: the chosen fallback frame's grid cell (${fallbackCell.col},${fallbackCell.row}), frame index ${fbIndex} - per-archetype choice (src/archetypes.js), not always the last frame and NOT always "100% 100%" even when it is, since frameCount doesn't always fill the grid exactly */
}

@supports (animation-timeline: scroll()) {
  .hero-sprite {
    animation: ${animName} linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes ${animName} {
${keyframeLines.join('\n')}
}

@media (prefers-reduced-motion: reduce) {
  .hero-sprite {
    animation: none !important;
    background-position: ${fallbackPos.x}% ${fallbackPos.y}%;
  }
}
`;

  const html = `<div class="hero-sprite" role="img" aria-label="${archetypeKey} hero animation"></div>`;

  return { css, html };
}

function buildMetadata({ archetype, capture, spriteSheet, spriteSheetRelPath }) {
  const { css, html } = buildCssSnippet({
    archetypeKey: archetype.key,
    frameCount: capture.frameCount,
    aspectRatio: archetype.aspectRatio,
    grid: archetype.grid,
    spriteSheetRelPath,
    fallbackFrame: archetype.fallbackFrame,
  });

  return {
    archetype: archetype.key,
    stylized: !!archetype.stylized,
    stylizedNote: archetype.stylizedNote || null,
    frameCount: capture.frameCount,
    aspectRatio: archetype.aspectRatio,
    frameDims: capture.dims,
    grid: archetype.grid,
    fallbackFrame: archetype.fallbackFrame,
    spriteSheet: {
      path: spriteSheetRelPath,
      format: 'webp',
      width: spriteSheet.width,
      height: spriteSheet.height,
      bytes: spriteSheet.bytes,
    },
    capture: {
      elapsedMs: capture.elapsedMs,
      msPerFrame: +capture.msPerFrame.toFixed(2),
    },
    logo: capture.logoPlan,
    css,
    html,
  };
}

module.exports = { buildCssSnippet, buildMetadata, frameBackgroundPosition };
