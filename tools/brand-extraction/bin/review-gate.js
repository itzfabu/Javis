#!/usr/bin/env node
// Launches the mandatory human/client review gate for a given tokens.json.
// Usage: node bin/review-gate.js <path-to>.tokens.json [--port 4173] [--stay-open]

const { startReviewServer } = require('../src/review-gate');

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

const args = parseArgs(process.argv.slice(2));
const tokensPath = args._[0];
if (!tokensPath) {
  console.error('Usage: node bin/review-gate.js <path-to>.tokens.json [--port 4173] [--stay-open]');
  process.exit(1);
}
const port = args.port ? Number(args.port) : 4173;
startReviewServer(tokensPath, { port, exitAfterSubmit: !args['stay-open'] });
console.log(`Review gate running: http://localhost:${port}`);
console.log('Open this URL and confirm/correct the brand — writes a .reviewed.json on submit.');
