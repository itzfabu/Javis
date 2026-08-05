// Runs the real pipeline (extract -> derive -> tokens) against the same 9
// sites the Thread 1 spike used, for an honest before/after comparison. Does
// NOT drive the review gate (that's a browser-interactive step, judged
// separately) - this measures what extraction+derivation produce before a
// human ever looks at it, the same thing the original spike measured.

const fs = require('fs');
const path = require('path');
const { extractRaw } = require('../src/extract');
const { buildTokens } = require('../src/tokens');

const sites = JSON.parse(fs.readFileSync(path.join(__dirname, 'sites.json'), 'utf8'));
const OUT_DIR = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const summary = [];
  for (const site of sites) {
    const outBase = path.join(OUT_DIR, site.id);
    console.log(`\n=== ${site.client} (${site.url}) ===`);
    let raw;
    try {
      raw = await extractRaw(site.url, outBase);
    } catch (e) {
      console.log('  FATAL: ' + e.message);
      summary.push({ ...site, fatalError: e.message });
      continue;
    }
    if (raw.fatalError) {
      console.log('  FATAL: ' + raw.fatalError);
      summary.push({ ...site, fatalError: raw.fatalError });
      continue;
    }
    fs.writeFileSync(outBase + '.raw.json', JSON.stringify(raw, null, 2));
    const tokens = buildTokens({ raw, client: site.client, sourceUrl: site.url, category: site.category });
    fs.writeFileSync(outBase + '.tokens.json', JSON.stringify(tokens, null, 2));

    console.log('  primary:    ' + tokens.color.primary.value + '  (' + tokens.color.primary.confidence + (tokens.color.primary.derived ? ', DERIVED' : '') + ')');
    console.log('  accent:     ' + tokens.color.accent.value + '  (' + tokens.color.accent.confidence + (tokens.color.accent.derived ? ', DERIVED' : '') + ')  cta-text: ' + (raw.color.cta ? raw.color.cta.text : '(none)'));
    console.log('  secondary:  ' + tokens.color.secondary.value + (tokens.color.secondary.derived ? '  DERIVED' : ''));
    console.log('  surface:    ' + tokens.color.surface.value + '  vs background ' + tokens.color.background.value);
    console.log('  logo tier:  ' + (raw.logo ? raw.logo.tier : 'n/a') + '  -> ' + tokens.logo.assetPath);
    console.log('  fonts:      heading="' + tokens.typography.heading.detected + '" -> ' + tokens.typography.heading.resolved + '  (' + tokens.typography.heading.source + ')');
    console.log('              body="' + tokens.typography.body.detected + '" -> ' + tokens.typography.body.resolved);
    console.log('  archetype:  ' + tokens.archetype.recommended);

    summary.push({
      id: site.id, client: site.client, url: site.url,
      primary: tokens.color.primary, accent: tokens.color.accent, secondary: tokens.color.secondary,
      surfaceEqualsBackground: tokens.color.surface.value === tokens.color.background.value,
      logoTier: raw.logo ? raw.logo.tier : null, logoAssetPath: tokens.logo.assetPath,
      headingDetected: tokens.typography.heading.detected, headingResolved: tokens.typography.heading.resolved,
      bodyDetected: tokens.typography.body.detected, bodyResolved: tokens.typography.body.resolved,
      archetype: tokens.archetype.recommended,
      ctaCandidateText: raw.color.cta ? raw.color.cta.text : null,
      customPropsFound: Object.keys(raw.customProperties || {}),
    });
  }
  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nWrote ' + path.join(OUT_DIR, 'summary.json'));
}

main().catch((e) => { console.error(e); process.exit(1); });
