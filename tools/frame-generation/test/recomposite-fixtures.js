// Re-runs the composite stage ONLY (no recapture) for all real fixtures in
// test/cost-study/, against their already-captured frames/ directories -
// used when a composite-stage parameter (WEBP_QUALITY) changes and the
// scene/capture output itself is unaffected, so a full recapture would be
// wasted work re-rendering pixels that didn't change.
//
// capture.elapsedMs/msPerFrame/logoPlan are carried over unchanged from each
// fixture's existing metadata.json (buildMetadata's `capture` param) since
// recompositing doesn't touch capture timing or the logo-compositing
// decision - only sprite.webp's bytes and the metadata/snippet files that
// report them change.
//
// verifySheetIntegrity runs automatically inside compositeSpriteSheet (see
// src/composite.js) and throws on failure - this script does not duplicate
// that check, it just doesn't swallow the throw.

const path = require('path');
const fs = require('fs');
const { compositeSpriteSheet } = require('../src/composite');
const { buildMetadata } = require('../src/metadata');
const { getArchetype, ARCHETYPES } = require('../src/archetypes');

async function main() {
  const base = path.join(__dirname, 'cost-study');
  const archNames = Object.keys(ARCHETYPES);
  const results = [];

  for (const archName of archNames) {
    const archetype = getArchetype(archName);
    for (const state of ['no-logo', 'approved-logo']) {
      const dirName = state === 'approved-logo' ? `${archName.toLowerCase()}-approved` : archName.toLowerCase();
      const archDir = path.join(base, dirName);
      const framesDir = path.join(archDir, 'frames');
      const metaPath = path.join(archDir, 'metadata.json');
      if (!fs.existsSync(framesDir) || !fs.existsSync(metaPath)) {
        console.error(`SKIP ${archName} ${state}: ${archDir} missing frames/ or metadata.json`);
        continue;
      }
      const oldMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      const oldBytes = oldMeta.spriteSheet.bytes;

      const spriteSheetPath = path.join(archDir, 'sprite.webp');
      const spriteSheet = await compositeSpriteSheet({
        framesDir,
        frameCount: archetype.frameCount,
        dims: archetype.dims,
        grid: archetype.grid,
        outPath: spriteSheetPath,
        fallbackFrame: archetype.fallbackFrame,
      });

      const capture = {
        frameCount: archetype.frameCount,
        dims: archetype.dims,
        elapsedMs: oldMeta.capture.elapsedMs,
        msPerFrame: oldMeta.capture.msPerFrame,
        logoPlan: oldMeta.logo,
      };
      const metadata = buildMetadata({ archetype, capture, spriteSheet, spriteSheetRelPath: 'sprite.webp' });
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
      fs.writeFileSync(path.join(archDir, 'snippet.css'), metadata.css);
      fs.writeFileSync(path.join(archDir, 'snippet.html'), metadata.html);

      const delta = spriteSheet.bytes - oldBytes;
      const row = { archetype: archName, state, oldBytes, newBytes: spriteSheet.bytes, deltaBytes: delta, deltaPct: +((delta / oldBytes) * 100).toFixed(1) };
      results.push(row);
      console.log(
        `${archName.padEnd(11)} ${state.padEnd(14)} ${(oldBytes/1024).toFixed(1)}KB -> ${(spriteSheet.bytes/1024).toFixed(1)}KB ` +
        `(${row.deltaPct}%)  integrity=${spriteSheet.integrity.ok ? 'OK' : 'FAIL'}`
      );
    }
  }

  console.log('\nAll fixtures recomposited and passed sheet-integrity.');
  return results;
}

main().catch((e) => { console.error(e); process.exit(1); });
