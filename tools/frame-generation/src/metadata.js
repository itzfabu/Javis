// Builds the CSS/HTML snippet + metadata JSON a generated site's page
// template drops in directly, per the RESOLVED sprite-scaling output spec
// in vault/Projects/Website Generator.md: percentage-based background-size/
// background-position (never pixel-based - that's what caused the original
// bleed bug), a contained/centered hero-object sized to the sprite's native
// aspect ratio (never full-bleed), steps(frameCount-1, jump-none) driven by
// animation-timeline: scroll(), wrapped in @supports with an unconditional
// static-frame fallback (required for every Firefox visitor today, not an
// edge case - per that same section), and prefers-reduced-motion respected
// (per UI Craft > Motion Accessibility - a hard requirement, not optional).
//
// Display-cap axis (disclosed extension): only the portrait 2:3 case
// (ASSEMBLE) was tested end-to-end with a height cap. Landscape archetypes
// (TRANSFORM, FLYTHROUGH, INTERFACE) are capped by width instead here, since
// a landscape hero composed with a height cap the same way a portrait one is
// would run absurdly wide - not independently verified in a real page layout
// the way ASSEMBLE's height cap was.

function buildCssSnippet({ archetypeKey, frameCount, aspectRatio, spriteSheetRelPath }) {
  const [w, h] = aspectRatio;
  const isLandscape = w > h;
  const capRule = isLandscape
    ? 'width: min(90vw, 1200px);\n  height: auto;'
    : 'height: min(78vh, 720px);\n  width: auto;';
  const bgSizePercent = 100 * frameCount;
  const stepsArg = Math.max(1, frameCount - 1);

  const css = `/* Thread 3 hero sprite - archetype: ${archetypeKey}, ${frameCount} frames, native ratio ${w}:${h} */
.hero-sprite {
  aspect-ratio: ${w} / ${h};
  ${capRule}
  margin: 0 auto;
  background-image: url('${spriteSheetRelPath}');
  background-repeat: no-repeat;
  background-size: ${bgSizePercent}% 100%; /* percentage, not px - required, see this project's own bleed-bug finding */
  background-position-x: 100%; /* unconditional base state: settled/final frame, shown to every visitor before any animation applies */
}

@supports (animation-timeline: scroll()) {
  .hero-sprite {
    animation: hero-scrub-${archetypeKey.toLowerCase()} steps(${stepsArg}, jump-none) both;
    animation-timeline: scroll(root block);
  }
}

@keyframes hero-scrub-${archetypeKey.toLowerCase()} {
  from { background-position-x: 0%; }
  to   { background-position-x: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-sprite {
    animation: none !important;
    background-position-x: 100%;
  }
}
`;

  const html = `<div class="hero-sprite" role="img" aria-label="${archetypeKey} hero animation"></div>`;

  return { css, html };
}

function buildMetadata({ archetype, capture, spriteSheet, cssRelPath, spriteSheetRelPath }) {
  const { css, html } = buildCssSnippet({
    archetypeKey: archetype.key,
    frameCount: capture.frameCount,
    aspectRatio: archetype.aspectRatio,
    spriteSheetRelPath,
  });

  return {
    archetype: archetype.key,
    stylized: !!archetype.stylized,
    stylizedNote: archetype.stylizedNote || null,
    frameCount: capture.frameCount,
    aspectRatio: archetype.aspectRatio,
    frameDims: capture.dims,
    spriteSheet: {
      path: spriteSheetRelPath,
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

module.exports = { buildCssSnippet, buildMetadata };
