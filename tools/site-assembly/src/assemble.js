// Orchestrates the deterministic Thread 2 pipeline: Thread 1 tokens ->
// Thread 3 sprite generation -> font self-hosting -> template assembly ->
// static file set, matching generated-sites/birds-barbershop/'s Output
// Structure exactly (index.html/styles.css/script.js/assets/meta.json).
// This is what orb/app.py's /generate-website route calls instead of the
// LLM-freeform `claude -p` subprocess, for the existing-website input path.

const path = require('path');
const fs = require('fs');
const { captureFrames } = require('../../frame-generation/src/capture');
const { compositeSpriteSheet } = require('../../frame-generation/src/composite');
const { buildMetadata } = require('../../frame-generation/src/metadata');
const { selfHostFont } = require('./fonts');
const { getCategoryCopy } = require('./category-copy');
const { buildIndexHtml, buildStylesCss, SCRIPT_JS, EXTRA_FIELD_BY_CATEGORY } = require('./template');

async function assembleSite({ tokens, outDir, businessName, web3formsAccessKey, clientContact, price, licenseType, reviews }) {
  const warnings = [];
  const knownGaps = [
    'No trust-bar facts (years in business, license, service area) - Thread 1 does not currently capture these',
    'No social proof / reviews - none supplied at generation time, not fabricated',
    'No before/after or category gallery - no client-supplied photos available',
    'No verified phone number or address (NAP) - Thread 1 does not currently capture these; omitted from footer/click-to-call rather than guessed',
  ];

  if (!tokens.archetype || !tokens.archetype.recommended) {
    throw new Error(`tokens.archetype.recommended is not set - cannot assemble (reason: ${tokens.archetype && tokens.archetype.reason})`);
  }
  const archetypeName = tokens.archetype.recommended;
  const categoryCopy = getCategoryCopy(tokens.category);
  if (!categoryCopy) {
    throw new Error(`no category copy defined for category "${tokens.category}" - add an entry to src/category-copy.js`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const assetsDir = path.join(outDir, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  // --- Thread 3: sprite generation ---
  const capture = await captureFrames({ archetypeName, tokens, outDir });
  const spriteSheetPath = path.join(outDir, 'sprite.webp');
  const spriteSheet = await compositeSpriteSheet({
    framesDir: capture.framesDir,
    frameCount: capture.frameCount,
    dims: capture.dims,
    grid: capture.archetype.grid,
    outPath: spriteSheetPath,
    fallbackFrame: capture.archetype.fallbackFrame,
  });
  const metadata = buildMetadata({ archetype: capture.archetype, capture, spriteSheet, spriteSheetRelPath: 'sprite.webp' });
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // Move the sprite into assets/ (Output Structure convention) and fix up
  // the CSS/HTML snippet's relative path to match - same fixup the
  // Birds Barbershop hand-build needed, done here once and for all.
  fs.renameSync(spriteSheetPath, path.join(assetsDir, 'sprite.webp'));
  const heroSnippetCss = metadata.css.replace("url('sprite.webp')", "url('assets/sprite.webp')");
  const heroSnippetHtml = metadata.html;

  if (capture.archetype.stylized) {
    knownGaps.push(`Hero shows a stylized/generic ${archetypeName.toLowerCase()} scene, not the client's actual building/space: ${capture.archetype.stylizedNote}`);
  }

  // --- Nav logo (gated the same way the hero sprite's logo compositing is:
  // an unreviewed extracted asset is never shown) ---
  const reviewed = tokens.meta && tokens.meta.reviewStatus === 'approved';
  let logoFilename = null;
  if (reviewed && tokens.logo && !tokens.logo.wordmarkFallback && tokens.logo.assetPath && fs.existsSync(tokens.logo.assetPath)) {
    // Found by generating a second real site (Grace Family Roofing, .png
    // logo) after this pipeline was only ever exercised against Birds
    // Barbershop's .jpg - the first draft hardcoded assets/logo.jpg in the
    // template. Fixed: pass the real extension through instead of assuming.
    const ext = path.extname(tokens.logo.assetPath) || '.jpg';
    logoFilename = `logo${ext}`;
    fs.copyFileSync(tokens.logo.assetPath, path.join(assetsDir, logoFilename));
  } else if (tokens.logo && tokens.logo.wordmarkFallback) {
    // text wordmark only - no image asset, nav already falls back to text via hasLogo=false
  } else if (tokens.logo && tokens.logo.assetPath && !reviewed) {
    knownGaps.push('Logo was extracted but is NOT reviewed/approved yet - not composited into the hero or shown in the nav, per Thread 1\'s mandatory review gate. Run bin/review-gate.js and regenerate once approved.');
  }

  // --- Fonts: self-hosted by default, template-wide ---
  const headingFont = tokens.typography.heading;
  const bodyFont = tokens.typography.body;
  const headingResult = await selfHostFont({ family: headingFont.resolved, weights: [500, 700], assetsDir });
  const bodyResult = await selfHostFont({ family: bodyFont.resolved, weights: [400, 600], assetsDir });
  if (!headingResult.ok) throw new Error(`heading font self-host failed: ${headingResult.error}`);
  if (!bodyResult.ok) throw new Error(`body font self-host failed: ${bodyResult.error}`);
  if (headingResult.fellBackToDefaultWeight) {
    warnings.push(`heading font "${headingFont.resolved}" doesn't ship weights [500,700] - fell back to its default weight(s) [${headingResult.actualWeights.join(',')}]`);
  }
  const headingWeight = headingResult.actualWeights.includes(700) ? 700 : Math.max(...headingResult.actualWeights);
  const fontsCss = `${headingResult.css}\n${bodyResult.css}`;

  const heroTrackBg = (tokens.frameGeneration && tokens.frameGeneration.backgroundForFrames) || tokens.color.background.value;
  const extraField = EXTRA_FIELD_BY_CATEGORY[tokens.category] || null;

  const html = buildIndexHtml({
    businessName, categoryCopy, heroSnippetHtml, logoFilename,
    web3formsAccessKey: web3formsAccessKey || null, extraField,
    servicesList: categoryCopy.genericServices,
  });
  const css = buildStylesCss({ tokens, fontsCss, headingWeight, heroSnippetCss, heroTrackBg });

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(outDir, 'styles.css'), css);
  fs.writeFileSync(path.join(outDir, 'script.js'), SCRIPT_JS);

  if (!web3formsAccessKey) knownGaps.push('Contact form has no live submission destination - no Web3Forms access key was provided for this generation');

  const meta = {
    business_name: businessName,
    slug: path.basename(outDir),
    prompt_used: `Assembled deterministically by tools/site-assembly from a Thread 1 tokens.json (source: ${tokens.meta && tokens.meta.sourceUrl}) - not LLM-generated HTML.`,
    reviews_used: reviews || [],
    created_date: new Date().toISOString(),
    status: 'draft',
    client_contact: clientContact || null,
    price: price != null ? price : null,
    license_type: licenseType || null,
    archetype: archetypeName,
    category: tokens.category,
    known_gaps: knownGaps,
    assembly_warnings: warnings,
  };
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

  return { outDir, archetypeName, category: tokens.category, knownGaps, warnings };
}

module.exports = { assembleSite };
