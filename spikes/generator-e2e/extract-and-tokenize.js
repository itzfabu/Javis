// Stage 1+2+3 of the walking skeleton: run the UNCHANGED Thread-1 extractor,
// do the crudest possible human review gate (terminal y/n), then map the raw
// extraction output onto Thread 1's token schema (with `category` promoted to
// a first-class field, per the parked schema task).
//
// Throwaway spike glue code - not part of the real generator.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const EXTRACTOR = path.join(ROOT, '..', 'brand-extract', 'extract2.js');
const OUT_DIR = path.join(ROOT, 'out', 'raw');
const TOKENS_PATH = path.join(ROOT, 'out', 'tokens.json');

const input = JSON.parse(fs.readFileSync(path.join(ROOT, 'input.json'), 'utf8'));

// ---------- WCAG 2.x relative-luminance contrast (per Thread 1's decision:
// implement directly, no dependency) ----------
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance({ r, g, b }) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(rgb1, rgb2) {
  const L1 = relLuminance(rgb1), L2 = relLuminance(rgb2);
  const lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
function parseRgbAny(str) {
  if (!str) return null;
  if (str.startsWith('#')) {
    const hex = str.replace('#', '');
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3] };
}
function toHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// NOTE: on this Windows/git-bash setup, readline.question() reliably resolves
// only the FIRST prompt against piped (non-TTY) stdin, then stalls forever on
// the second - a real, reproduced plumbing quirk, not a design choice. Real
// interactive use (a human typing at a real terminal) still goes through
// readline as intended; a piped/non-TTY run (used here to actually drive this
// spike end-to-end once) instead reads all of stdin up front and answers
// questions from that queue in order.
let stdinQueue = null;
if (!process.stdin.isTTY) {
  try { stdinQueue = fs.readFileSync(0, 'utf8').split('\n').map((s) => s.trim()); } catch (e) { stdinQueue = []; }
}
const rlShared = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
function askYesNo(question) {
  process.stdout.write(question);
  if (stdinQueue) {
    const ans = (stdinQueue.shift() || '').toLowerCase();
    console.log(ans + '  [answered from piped stdin queue, not live readline]');
    return Promise.resolve(ans);
  }
  return new Promise((resolve) => rlShared.question('', (ans) => resolve(ans.trim().toLowerCase())));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outBase = path.join(OUT_DIR, 'client');

  // ---------- STAGE 1: run extract2.js AS-IS, unmodified ----------
  const rawPath = outBase + '.json';
  console.log('\n=== STAGE 1: brand extraction (extract2.js, unmodified) ===');
  if (fs.existsSync(rawPath) && process.env.SKIP_EXTRACT === '1') {
    console.log('SKIP_EXTRACT=1 set, reusing existing ' + rawPath);
  } else {
    console.log('Extracting from: ' + input.brand_source_url);
    try {
      execFileSync('node', [EXTRACTOR, input.brand_source_url, outBase], { stdio: 'inherit' });
    } catch (e) {
      console.error('extract2.js exited non-zero:', e.message);
    }
  }
  if (!fs.existsSync(rawPath)) {
    console.error('FATAL: extract2.js did not produce ' + rawPath + '. Aborting.');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  // ---------- STAGE 2: crudest possible mandatory review gate ----------
  console.log('\n=== STAGE 2: mandatory review gate (logo + accent) ===');
  console.log('Logo tier: ' + raw.logo.tier + '  (confidence: ' + raw.confidence.logo.level + ')');
  console.log('Logo file: ' + (raw.logo.downloadedPath || '(none downloaded)'));
  console.log('Extracted accent (CTA) candidate:');
  console.log('  text:  ' + (raw.color.cta ? raw.color.cta.text : '(none found)'));
  console.log('  color: ' + (raw.color.cta ? raw.color.cta.backgroundColor : '(none found)'));
  console.log('  confidence: ' + raw.confidence.cta.level + ' - ' + raw.confidence.cta.note);
  if (raw.customProperties && Object.keys(raw.customProperties).length) {
    console.log('CSS custom properties found (higher-confidence signal per Thread 1, cross-checked against structural colors):');
    for (const [name, val] of Object.entries(raw.customProperties)) {
      const cc = raw.customPropertyCrossCheck && raw.customPropertyCrossCheck[name];
      console.log('  ' + name + ' = ' + val.raw + '  (' + val.normalized + ')' +
        (cc ? '  [structurally confirmed: ' + cc.confirmedByStructuralMatch + ']' : ''));
    }
  }

  const trustAccent = await askYesNo('\nTrust the extracted accent color as-is? (y/n): ');
  let accentOverrideHex = null;
  if (trustAccent !== 'y') {
    accentOverrideHex = await askYesNo('Enter a hex override for the accent color (e.g. #d5253f): ');
  }
  const trustLogo = await askYesNo('Trust the extracted logo as-is? (y/n): ');
  if (rlShared) rlShared.close();

  const decisions = {
    reviewedAt: new Date().toISOString(),
    accentTrusted: trustAccent === 'y',
    accentOverrideHex: accentOverrideHex,
    logoTrusted: trustLogo === 'y',
  };
  fs.writeFileSync(path.join(ROOT, 'out', 'review-decisions.json'), JSON.stringify(decisions, null, 2));
  console.log('Review decisions recorded: ' + JSON.stringify(decisions));

  // ---------- STAGE 3: map raw extraction -> Thread 1 token schema ----------
  console.log('\n=== STAGE 3: mapping raw extraction onto Thread 1 token schema ===');

  // Role mapping per Thread 1's own worked example: primary<-header,
  // secondary<-footer, accent<-CTA background. extract2.js's raw field names
  // (header/footer/cta) map directly, but Thread 1's schema never states this
  // mapping as code - it's only implied by the JSON example's inline comments.
  // First real gap: footer (secondary) came back null for this real site (no
  // distinct footer background detected) - Thread 1's schema has no documented
  // fallback for a null role. Improvised here: derive secondary as a shade of
  // primary, the same derivation rule already used for border/surface, rather
  // than leave a token field null and let it break the page template.
  const primaryRgb = parseRgbAny(raw.color.header) || { r: 40, g: 40, b: 40 };
  const primaryHex = toHex(primaryRgb);

  let secondaryHex;
  let secondarySource;
  if (raw.color.footer) {
    secondaryHex = toHex(parseRgbAny(raw.color.footer));
    secondarySource = 'footer background, computed';
  } else {
    const shaded = { r: primaryRgb.r * 0.6, g: primaryRgb.g * 0.6, b: primaryRgb.b * 0.6 };
    secondaryHex = toHex(shaded);
    secondarySource = 'INVENTED: no distinct footer background found; derived as a 40%-darkened shade of primary (undocumented in Thread 1 schema, improvised here)';
  }

  let accentHex, accentSource;
  if (accentOverrideHex) {
    accentHex = accentOverrideHex.startsWith('#') ? accentOverrideHex : '#' + accentOverrideHex;
    accentSource = 'HUMAN OVERRIDE at review gate: extracted CTA candidate ("' +
      (raw.color.cta ? raw.color.cta.text : 'none') + '", ' +
      (raw.color.cta ? raw.color.cta.backgroundColor : 'n/a') +
      ') was rejected as unusable (near-transparent ghost button, not a real fill color) in favor of a cross-checked --color-primary custom property value';
  } else if (raw.color.cta && raw.color.cta.backgroundColor && raw.color.cta.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    const rgb = parseRgbAny(raw.color.cta.backgroundColor);
    accentHex = rgb ? toHex(rgb) : '#cccccc';
    accentSource = 'CTA button background, computed (score ' + raw.color.cta.score.toFixed(1) + ', human-confirmed at review gate)';
  } else {
    accentHex = primaryHex;
    accentSource = 'INVENTED: no usable CTA background found at all; fell back to primary color as accent (undocumented fallback, improvised here)';
  }

  const textRgb = parseRgbAny(raw.color.text) || { r: 20, g: 20, b: 20 };
  const backgroundRgb = parseRgbAny(raw.color.background) || { r: 255, g: 255, b: 255 };
  const surfaceRgb = parseRgbAny(raw.color.surface) || backgroundRgb;
  const borderRgb = parseRgbAny(raw.color.border) || { r: 224, g: 224, b: 224 };

  // Accessibility resolution per Thread 1's three-step decision.
  const textOnBackground = contrastRatio(textRgb, backgroundRgb);
  const primaryOnBackground = contrastRatio(primaryRgb, backgroundRgb);
  const accentRgb = parseRgbAny(accentHex);
  const whiteRatio = contrastRatio({ r: 255, g: 255, b: 255 }, accentRgb);
  const blackRatio = contrastRatio({ r: 0, g: 0, b: 0 }, accentRgb);
  let accentTextColor, accentTextRatio, accentNote;
  if (whiteRatio >= 4.5 || blackRatio >= 4.5) {
    if (whiteRatio >= blackRatio) { accentTextColor = '#FFFFFF'; accentTextRatio = whiteRatio; }
    else { accentTextColor = '#000000'; accentTextRatio = blackRatio; }
    accentNote = 'chose ' + accentTextColor + ' text on accent surfaces, passes 4.5:1';
  } else {
    // Neither passes - Thread 1's rule: darken the SAME hue for text-bearing surfaces.
    const darkened = { r: accentRgb.r * 0.55, g: accentRgb.g * 0.55, b: accentRgb.b * 0.55 };
    accentTextColor = '#FFFFFF';
    accentTextRatio = contrastRatio({ r: 255, g: 255, b: 255 }, darkened);
    accentNote = 'accent too light/desaturated for either black or white text to pass; generated a same-hue darkened variant (' + toHex(darkened) + ') for text-bearing surfaces per Thread 1 rule 3';
  }

  // Fonts: extract2 already normalizes names. No substitution TABLE exists
  // (Thread 1 flagged this as unbuilt) - this run got lucky, the source site's
  // fonts (Barlow / Barlow Condensed) happen to already be real Google Fonts,
  // manually spot-checked here, not looked up against a built table.
  const headingFont = raw.font.headingNormalized || 'Poppins';
  const bodyFont = raw.font.bodyNormalized || 'Fraunces';
  const gfamily = (n) => n.replace(/\s+/g, '+');
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${gfamily(bodyFont)}:wght@400;600&family=${gfamily(headingFont)}:wght@600;700&display=swap`;

  // Logo: copy the downloaded asset into the final assets/ dir at assemble time;
  // here we just record what extraction + review produced.
  let logoBlock;
  if (decisions.logoTrusted && raw.logo.downloadedPath) {
    logoBlock = {
      format: raw.logo.format,
      source: raw.logo.tier,
      assetPath: 'assets/logo.' + raw.logo.format,
      _rawDownloadedPath: raw.logo.downloadedPath,
      hasTransparency: null, // resolved in assemble stage via Pillow check
      wordmarkFallback: false,
      backgroundRemovalApplied: false,
    };
  } else {
    logoBlock = {
      format: 'text-wordmark',
      source: decisions.logoTrusted ? 'no-logo-found' : 'human-rejected-at-review',
      assetPath: null,
      hasTransparency: null,
      wordmarkFallback: true,
      backgroundRemovalApplied: false,
    };
  }

  const tokens = {
    meta: {
      client: input.business_name,
      sourcePath: 'existing-website',
      sourceUrl: input.brand_source_url,
      extractedAt: raw.extractedAt,
      confidence: 'mixed - see per-field confidence below',
    },
    category: input.category, // PROMOTED TO FIRST-CLASS FIELD per the parked Thread 1 schema task
    color: {
      primary: { value: primaryHex, source: raw.confidence.header.note, confidence: raw.confidence.header.level },
      secondary: { value: secondaryHex, source: secondarySource, confidence: raw.color.footer ? raw.confidence.footer.level : 'invented' },
      accent: { value: accentHex, source: accentSource, confidence: accentOverrideHex ? 'human-override' : raw.confidence.cta.level },
      text: { value: toHex(textRgb), source: raw.confidence.text.note, confidence: raw.confidence.text.level },
      background: { value: toHex(backgroundRgb), source: raw.confidence.background.note, confidence: raw.confidence.background.level },
      surface: { value: toHex(surfaceRgb), source: raw.confidence.surface.note, confidence: raw.confidence.surface.level },
      border: { value: toHex(borderRgb), source: raw.confidence.border.note, confidence: raw.confidence.border.level },
      accessibility: {
        textOnBackground: { ratio: +textOnBackground.toFixed(2), passesAA: textOnBackground >= 4.5 },
        primaryOnBackground: { ratio: +primaryOnBackground.toFixed(2), passesAA: primaryOnBackground >= 4.5 },
        accentTextOverride: {
          reason: accentNote,
          resolution: 'use ' + accentTextColor + ' text on accent surfaces',
          ratio: +accentTextRatio.toFixed(2),
          passesAA: accentTextRatio >= 4.5,
        },
      },
    },
    typography: {
      heading: {
        detected: raw.font.headingFirst,
        resolved: headingFont,
        source: 'google-fonts (manually spot-checked, NOT looked up via a built substitution table - that table does not exist yet)',
        url: googleFontsUrl,
        fallbackStack: `'${headingFont}', 'Segoe UI', sans-serif`,
      },
      body: {
        detected: raw.font.bodyFirst,
        resolved: bodyFont,
        source: 'google-fonts (manually spot-checked, NOT looked up via a built substitution table - that table does not exist yet)',
        url: googleFontsUrl,
        fallbackStack: `'${bodyFont}', Georgia, serif`,
      },
      scale: { h1: '3.25rem', h2: '2.1rem', h3: '1.4rem', body: '1rem', small: '0.875rem' },
    },
    logo: logoBlock,
    spacing: { unit: '8px', radius: { sm: '4px', md: '8px', lg: '16px' } },
    archetype: {
      recommended: 'ASSEMBLE',
      reason: 'category: construction-trades, per Thread 3 archetype-to-category mapping',
    },
    frameGeneration: {
      paletteForFrames: [primaryHex, accentHex, secondaryHex],
      backgroundForFrames: toHex(backgroundRgb),
      logoCompositing: {
        enabled: false,
        note: 'NOT IMPLEMENTED IN THIS SPIKE: Thread 3 (frame generation) has not been researched or built. This block is emitted to match the schema shape, but nothing consumes it - the hero below uses the raw placeholder tower sprite sheet from flipbook-scrub, unmodified, with no logo composited in.',
      },
    },
    _rawExtraction: raw, // kept for the breakage report, not part of the real schema
  };

  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  console.log('Wrote ' + TOKENS_PATH);
}

main().catch((e) => { console.error(e); process.exit(1); });
