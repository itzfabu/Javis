#!/usr/bin/env node
// CLI entrypoint for the deterministic Thread 2 pipeline.
//
// From an existing tokens.json (already extracted + reviewed or not):
//   node bin/generate-site.js --tokens <path>.tokens.json --out <dir> [--business-name "..."] [--web3forms-key KEY]
//
// From a live reference URL (runs Thread 1 extraction first - input path a,
// "existing website" - tokens.meta.reviewStatus will be "pending", so the
// hero/nav logo won't composite until bin/review-gate.js approves it and
// this is re-run - that's the correct, safe default, not a bug):
//   node bin/generate-site.js --url <url> --client "Business Name" --category <slug> --out <dir> [--web3forms-key KEY]

const path = require('path');
const fs = require('fs');
const { assembleSite } = require('../src/assemble');
const { extractRaw } = require('../../brand-extraction/src/extract');
const { buildTokens } = require('../../brand-extraction/src/tokens');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    } else { args._.push(a); }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = args.out;
  if (!outDir) {
    console.error('Usage: node bin/generate-site.js (--tokens <path> | --url <url> --client "Name" --category <slug>) --out <dir>');
    process.exit(1);
  }

  let tokens;
  if (args.tokens) {
    tokens = JSON.parse(fs.readFileSync(args.tokens, 'utf8'));
  } else if (args.url) {
    if (!args.client || !args.category) {
      console.error('--url requires --client "Business Name" and --category <slug>');
      process.exit(1);
    }
    console.log(`Extracting brand tokens from ${args.url} (Thread 1, live) ...`);
    const rawOutBase = path.join(outDir, '_extract');
    fs.mkdirSync(outDir, { recursive: true });
    const raw = await extractRaw(args.url, rawOutBase);
    if (raw.fatalError) {
      console.error('FATAL: extraction could not load the page: ' + raw.fatalError);
      process.exit(1);
    }
    tokens = buildTokens({ raw, client: args.client, sourceUrl: args.url, category: args.category });
    fs.writeFileSync(rawOutBase + '.tokens.json', JSON.stringify(tokens, null, 2));
    console.log(`  extracted, meta.reviewStatus="${tokens.meta.reviewStatus}" (logo will not composite until this is "approved" via bin/review-gate.js)`);
  } else {
    console.error('Must pass either --tokens <path> or --url <url>.');
    process.exit(1);
  }

  const businessName = args['business-name'] || (tokens.meta && tokens.meta.client) || 'Unnamed Business';
  const web3formsAccessKey = args['web3forms-key'] || process.env.WEB3FORMS_ACCESS_KEY || null;
  const reviews = args.reviews ? JSON.parse(fs.readFileSync(args.reviews, 'utf8')) : [];

  console.log(`Assembling site for "${businessName}" (archetype ${tokens.archetype && tokens.archetype.recommended}, category ${tokens.category}) -> ${outDir}`);
  const result = await assembleSite({
    tokens, outDir, businessName, web3formsAccessKey, reviews,
    clientContact: args['client-contact'] || null,
    price: args.price ? Number(args.price) : null,
    licenseType: args['license-type'] || null,
  });

  console.log('Wrote:');
  for (const f of ['index.html', 'styles.css', 'script.js', 'meta.json']) console.log('  ' + path.join(outDir, f));
  if (result.warnings.length) {
    console.log('\nWarnings:');
    for (const w of result.warnings) console.log('  - ' + w);
  }
  console.log('\nKnown gaps (recorded in meta.json):');
  for (const g of result.knownGaps) console.log('  - ' + g);
}

main().catch((e) => { console.error(e); process.exit(1); });
