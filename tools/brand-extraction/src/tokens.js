// Assembles the final Thread 1 token schema (the locked deliverable in the
// vault note) from raw extraction + the Derivation Layer + font resolution +
// category/archetype. Emitted BEFORE the mandatory human/client review gate -
// meta.reviewStatus starts "pending" and stays that way until the review
// gate (src/review-gate.js) writes back a reviewed copy.

const { parseColor, toHex, shade, contrastRatio } = require('./color-utils');
const { resolveFont } = require('./fonts');
const { recommendArchetype } = require('./archetype');
const { deriveColors } = require('./derive');

const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };

// The conflict decision, per Thread 1: a real brand color that fails 4.5:1
// is never silently swapped for a generic substitute. Steps 1-3 exactly as
// specified in the vault note's "Colors: palette roles and the accessibility
// conflict" section.
function resolveAccentTextOverride(accentHex) {
  const accentRgb = parseColor(accentHex);
  const whiteRatio = contrastRatio(WHITE, accentRgb);
  const blackRatio = contrastRatio(BLACK, accentRgb);

  if (whiteRatio >= 4.5 || blackRatio >= 4.5) {
    const useWhite = whiteRatio >= blackRatio;
    const ratio = useWhite ? whiteRatio : blackRatio;
    return {
      reason: `accent ${accentHex} - text contrast resolved directly`,
      resolution: `use ${useWhite ? '#FFFFFF' : '#000000'} text on accent surfaces`,
      ratio: +ratio.toFixed(2),
      passesAA: true,
      textColor: useWhite ? '#FFFFFF' : '#000000',
      accentForText: accentHex, // step 1: decorative/large-scale use keeps the real brand color
    };
  }

  // Step 3: neither white nor black text passes directly - generate a
  // darkened variant of the SAME hue for any text-bearing surface, hue
  // identity preserved, only lightness changes. Iterate shade amount until
  // white text clears 4.5:1 (accent is light/desaturated by construction
  // here, so darkening toward black is the correct direction).
  let amount = 0.05;
  let darkened = shade(accentRgb, amount);
  let ratio = contrastRatio(WHITE, darkened);
  let guard = 0;
  while (ratio < 4.5 && amount < 0.95 && guard < 30) {
    amount += 0.05;
    darkened = shade(accentRgb, amount);
    ratio = contrastRatio(WHITE, darkened);
    guard++;
  }
  const darkHex = toHex(darkened);
  return {
    reason: `accent ${accentHex} fails 4.5:1 against both white and black text`,
    resolution: `generated same-hue darkened variant ${darkHex} for text-bearing surfaces; decorative/large-scale use (hero backgrounds, brand accents) keeps the original ${accentHex} per WCAG's 3:1 large-object threshold`,
    ratio: +ratio.toFixed(2),
    passesAA: ratio >= 4.5,
    textColor: '#FFFFFF',
    accentForText: darkHex, // step 3: text-bearing surfaces use the darkened variant, not the original
  };
}

function buildAccessibilityBlock(colors) {
  const textRgb = parseColor(colors.text.value);
  const backgroundRgb = parseColor(colors.background.value);
  const primaryRgb = parseColor(colors.primary.value);

  const textOnBackground = contrastRatio(textRgb, backgroundRgb);
  const primaryOnBackground = contrastRatio(primaryRgb, backgroundRgb);
  const accentOverride = resolveAccentTextOverride(colors.accent.value);

  return {
    textOnBackground: { ratio: +textOnBackground.toFixed(2), passesAA: textOnBackground >= 4.5 },
    primaryOnBackground: { ratio: +primaryOnBackground.toFixed(2), passesAA: primaryOnBackground >= 4.5 },
    accentTextOverride: accentOverride,
  };
}

function overallConfidence(colors, logoConfidence) {
  const levels = [colors.primary.confidence, colors.accent.confidence, logoConfidence];
  if (levels.every((l) => l === 'high')) return 'high';
  if (levels.some((l) => l === 'low')) return 'mixed - see per-field confidence below (primary/accent/logo are the fields most likely to need review)';
  return 'medium';
}

function buildLogoBlock(raw) {
  const logo = raw.logo || {};
  if (logo.downloadedPath) {
    return {
      format: logo.format,
      source: logo.tier,
      assetPath: logo.downloadedPath,
      hasTransparency: logo.hasTransparency ?? null,
      wordmarkFallback: false,
      backgroundRemovalApplied: false,
      needsBackgroundRemoval: logo.needsBackgroundRemoval ?? null,
      confidence: raw.confidence.logo.level,
      confidenceNote: raw.confidence.logo.note,
      derived: false,
    };
  }
  return {
    format: 'text-wordmark',
    source: 'no-logo-found',
    assetPath: null,
    hasTransparency: null,
    wordmarkFallback: true,
    backgroundRemovalApplied: false,
    needsBackgroundRemoval: false,
    confidence: 'low',
    confidenceNote: 'no logo candidate found by any retrieval tier; falls back to a text wordmark per Thread 1 path (a)/(c)/(d) rule',
    derived: true,
  };
}

function buildTokens({ raw, client, sourceUrl, category }) {
  const colors = deriveColors(raw);
  const accessibility = buildAccessibilityBlock(colors);
  const logoBlock = buildLogoBlock(raw);
  const archetype = recommendArchetype(category);

  const headingFont = resolveFont(raw.font.headingFont, { weights: [500, 700] });
  const bodyFont = resolveFont(raw.font.bodyFont, { weights: [400, 600] });

  const tokens = {
    meta: {
      client,
      sourcePath: 'existing-website',
      sourceUrl,
      extractedAt: raw.extractedAt,
      confidence: overallConfidence(colors, logoBlock.confidence),
      reviewStatus: 'pending', // mandatory gate - see review-gate.js; never ships as "pending"
      reviewRequired: { logo: true, accent: true }, // mandatory regardless of measured hit rate, per Thread 1's 2026-08-05 decision
    },
    category: category || null,
    color: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      text: colors.text,
      background: colors.background,
      surface: colors.surface,
      border: colors.border,
      accessibility,
    },
    typography: {
      heading: headingFont,
      body: bodyFont,
      scale: { h1: '3.5rem', h2: '2.25rem', h3: '1.5rem', body: '1rem', small: '0.875rem' },
    },
    logo: logoBlock,
    spacing: { unit: '8px', radius: { sm: '4px', md: '8px', lg: '16px' } },
    archetype,
    frameGeneration: {
      paletteForFrames: [colors.primary.value, colors.accent.value, colors.secondary.value],
      backgroundForFrames: colors.background.value,
      logoCompositing: {
        enabled: !!logoBlock.assetPath,
        assetPath: logoBlock.assetPath,
        appearsAtFrameFraction: 1.0,
        note: logoBlock.assetPath
          ? 'logo composites in on the final settled frame - pending the same mandatory review gate as the page-level logo (Thread 1 -> Thread 3 handoff)'
          : 'no logo asset available; frame sequence composites nothing (or a text wordmark, per Thread 3\'s own design, not decided here)',
      },
    },
  };

  return tokens;
}

module.exports = { buildTokens, resolveAccentTextOverride, buildAccessibilityBlock };
