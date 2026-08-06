#!/usr/bin/env node
// CLI entrypoint for Thread 3 frame generation (Website Generator project).
// Consumes a Thread 1 token JSON (tools/brand-extraction output) and
// produces one hero sprite sheet + a ready-to-drop-in CSS/HTML snippet.
//
// Usage:
//   node bin/generate-frames.js <tokens.json> --out out/some-client [--archetype SPIN]
//
// Reads tokens.archetype.recommended unless --archetype overrides it.
// Reads tokens.frameGeneration.{paletteForFrames,backgroundForFrames,
// logoCompositing} and tokens.meta.reviewStatus - a real extracted logo
// asset is only composited when reviewStatus is "approved" (see
// src/capture.js's resolveLogoPlan); a text-wordmark fallback is used
// regardless, since it was never an extraction guess needing review.
//
// Writes into --out:
//   frames/frame-NNNN.png   - individually captured frames (debugging/audit)
//   sprite.webp             - the composited grid sprite sheet (cols x rows,
//                              WebP - see src/archetypes.js's computeGrid)
//   metadata.json           - frame count, grid, aspect ratio, sprite dims,
//                              the CSS/HTML snippet, and the logo-compositing
//                              decision that was actually made
//   snippet.css, snippet.html - the same CSS/HTML pulled out as plain files

const path = require('path');
const fs = require('fs');
const { captureFrames } = require('../src/capture');
const { compositeSpriteSheet } = require('../src/composite');
const { buildMetadata } = require('../src/metadata');
const { ARCHETYPES } = require('../src/archetypes');

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
  const tokensPath = args._[0];
  if (!tokensPath) {
    console.error('Usage: node bin/generate-frames.js <tokens.json> --out <dir> [--archetype <ARCHETYPE>]');
    console.error('Known archetypes: ' + Object.keys(ARCHETYPES).join(', '));
    process.exit(1);
  }

  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const archetypeOverride = args.archetype;
  const archetypeName = archetypeOverride || (tokens.archetype && tokens.archetype.recommended);
  if (!archetypeName) {
    console.error('FATAL: tokens.archetype.recommended is null and no --archetype override was given.');
    console.error('Reason recorded in tokens: ' + (tokens.archetype && tokens.archetype.reason));
    process.exit(1);
  }

  const outDir = args.out || path.join('out', (tokens.meta && tokens.meta.client || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Capturing ${archetypeName} frames for ${tokens.meta && tokens.meta.client} ...`);
  const capture = await captureFrames({ archetypeName, tokens, outDir });
  console.log(`  ${capture.frameCount} frames, ${capture.dims.width}x${capture.dims.height}, ${capture.elapsedMs}ms (${capture.msPerFrame.toFixed(1)}ms/frame)`);
  console.log(`  logo: ${capture.logoPlan.note}`);

  const spriteSheetPath = path.join(outDir, 'sprite.webp');
  console.log(`Compositing ${capture.archetype.grid.cols}x${capture.archetype.grid.rows} grid sprite sheet ...`);
  const spriteSheet = await compositeSpriteSheet({
    framesDir: capture.framesDir,
    frameCount: capture.frameCount,
    dims: capture.dims,
    grid: capture.archetype.grid,
    outPath: spriteSheetPath,
    fallbackFrame: capture.archetype.fallbackFrame,
  });
  console.log(`  wrote ${spriteSheetPath} (${spriteSheet.width}x${spriteSheet.height}, ${(spriteSheet.bytes / 1024).toFixed(1)}KB)`);

  const metadata = buildMetadata({
    archetype: capture.archetype,
    capture,
    spriteSheet,
    spriteSheetRelPath: 'sprite.webp',
  });
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  fs.writeFileSync(path.join(outDir, 'snippet.css'), metadata.css);
  fs.writeFileSync(path.join(outDir, 'snippet.html'), metadata.html);

  console.log('Wrote:');
  console.log('  ' + path.join(outDir, 'metadata.json'));
  console.log('  ' + path.join(outDir, 'snippet.css'));
  console.log('  ' + path.join(outDir, 'snippet.html'));
  if (capture.archetype.stylized) {
    console.log('');
    console.log('DISCLOSURE (' + capture.archetype.key + '): ' + capture.archetype.stylizedNote);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
