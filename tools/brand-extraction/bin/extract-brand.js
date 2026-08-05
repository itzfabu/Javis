#!/usr/bin/env node
// CLI entrypoint for Thread 1 brand extraction (input path a: existing website).
//
// Usage:
//   node bin/extract-brand.js <url> --client "Business Name" --category food-beverage --out out/some-client
//
// Runs extraction -> derivation -> schema assembly and writes:
//   <out>.raw.json     - unmodified raw extraction (debugging/audit trail)
//   <out>.tokens.json  - the Thread 1 token schema, meta.reviewStatus = "pending"
//   <out>.screenshot.png, <out>.logo.<ext> - assets extraction produced
//
// Does NOT ship the tokens as final - run bin/review-gate.js next.

const path = require('path');
const fs = require('fs');
const { extractRaw } = require('../src/extract');
const { buildTokens } = require('../src/tokens');
const { CATEGORY_ARCHETYPE } = require('../src/archetype');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = args._[0];
  if (!url) {
    console.error('Usage: node bin/extract-brand.js <url> --client "Business Name" --category <slug> --out <path-base>');
    console.error('Known category slugs: ' + Object.keys(CATEGORY_ARCHETYPE).join(', '));
    process.exit(1);
  }
  const client = args.client || '(unnamed client)';
  const category = args.category || null;
  const outBase = args.out || path.join('out', client.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  fs.mkdirSync(path.dirname(outBase), { recursive: true });

  console.log(`Extracting brand tokens from ${url} ...`);
  const raw = await extractRaw(url, outBase);
  if (raw.fatalError) {
    console.error('FATAL: extraction could not load the page: ' + raw.fatalError);
    process.exit(1);
  }
  fs.writeFileSync(outBase + '.raw.json', JSON.stringify(raw, null, 2));

  const tokens = buildTokens({ raw, client, sourceUrl: url, category });
  fs.writeFileSync(outBase + '.tokens.json', JSON.stringify(tokens, null, 2));

  console.log('Wrote:');
  console.log('  ' + outBase + '.raw.json');
  console.log('  ' + outBase + '.tokens.json');
  console.log('  ' + outBase + '.screenshot.png');
  if (tokens.logo.assetPath) console.log('  ' + tokens.logo.assetPath);
  console.log('');
  console.log('meta.reviewStatus = "pending" - run bin/review-gate.js next before this ships.');
  if (!category) {
    console.log('WARNING: no --category supplied, archetype.recommended is null. Pass --category <slug>.');
  } else if (!tokens.archetype.recommended) {
    console.log('WARNING: category "' + category + '" did not match a known slug - archetype.recommended is null.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
