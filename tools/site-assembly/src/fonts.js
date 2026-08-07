// Self-hosts a Google Font: fetches the actual CSS Google serves, downloads
// the real woff2 files (latin + latin-ext subsets only - every generated
// site's copy is English), and returns @font-face CSS pointing at local
// files instead of fonts.googleapis.com/fonts.gstatic.com. Template default
// for every generated site (per the Birds Barbershop follow-up) - not a
// one-off page fix.
//
// Handles a real bug found while building this: tools/brand-extraction's
// resolveFont() always requests the caller's weight list (e.g. 500;700 for
// headings) regardless of whether the resolved font actually ships those
// weights - Righteous (a single-weight display font) 400s on that request.
// Rather than crash generation over a font-catalog mismatch, retry once
// with a bare family name (Google's default: whatever weights exist) and
// report which weights actually came back, so the template can avoid
// requesting a synthetic-bold weight the font doesn't have.

const https = require('https');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function httpsGet(url, { binary = false } = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location, { binary }));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ statusCode: res.statusCode, body: binary ? buf : buf.toString('utf8') });
      });
    }).on('error', reject);
  });
}

function extractFaces(css) {
  // Returns [{ subset, weight, url }] for latin/latin-ext blocks only.
  const blocks = css.split(/(?=\/\* )/);
  const faces = [];
  for (const b of blocks) {
    const subsetM = b.match(/\/\* (\S+) \*\//);
    if (!subsetM || (subsetM[1] !== 'latin' && subsetM[1] !== 'latin-ext')) continue;
    const weightM = b.match(/font-weight:\s*(\d+)/);
    const urlM = b.match(/url\(([^)]+)\)/);
    const rangeM = b.match(/unicode-range:\s*([^;]+);/);
    if (weightM && urlM) {
      faces.push({ subset: subsetM[1], weight: weightM[1], url: urlM[1], unicodeRange: rangeM ? rangeM[1].trim() : null });
    }
  }
  return faces;
}

// family: resolved Google Fonts family name (e.g. "Righteous")
// weights: requested static weights, e.g. [500, 700]
// assetsDir: filesystem dir to write woff2 files into
// assetUrlPrefix: how the generated CSS should reference them (e.g. "assets/")
async function selfHostFont({ family, weights, assetsDir, assetUrlPrefix = 'assets/' }) {
  const famParam = family.replace(/\s+/g, '+');
  let res = await httpsGet(`https://fonts.googleapis.com/css2?family=${famParam}:wght@${weights.join(';')}&display=swap`);
  let fellBack = false;
  if (res.statusCode !== 200) {
    // Known catalog-mismatch case (e.g. a single-weight display font asked
    // for weights it doesn't have) - retry with no weight list, Google's
    // default resolves to whatever the family actually ships.
    res = await httpsGet(`https://fonts.googleapis.com/css2?family=${famParam}&display=swap`);
    fellBack = true;
  }
  if (res.statusCode !== 200) {
    return { ok: false, error: `Google Fonts returned ${res.statusCode} for "${family}" (both weighted and bare requests failed)`, css: '', actualWeights: [] };
  }

  const faces = extractFaces(res.body);
  if (!faces.length) {
    return { ok: false, error: `no latin/latin-ext @font-face blocks found for "${family}"`, css: '', actualWeights: [] };
  }

  fs.mkdirSync(assetsDir, { recursive: true });
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const downloaded = new Map(); // source url -> local filename (files are often reused across weights - a variable font instance)
  const cssBlocks = [];
  const actualWeights = new Set();

  for (const face of faces) {
    let filename = downloaded.get(face.url);
    if (!filename) {
      filename = `${slug}-${face.subset}.woff2`;
      const dl = await httpsGet(face.url, { binary: true });
      if (dl.statusCode !== 200) {
        return { ok: false, error: `failed to download ${face.url} (${dl.statusCode})`, css: '', actualWeights: [] };
      }
      fs.writeFileSync(path.join(assetsDir, filename), dl.body);
      downloaded.set(face.url, filename);
    }
    actualWeights.add(face.weight);
    cssBlocks.push(`@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url('${assetUrlPrefix}${filename}') format('woff2');
  unicode-range: ${face.unicodeRange};
}`);
  }

  return {
    ok: true,
    css: cssBlocks.join('\n'),
    actualWeights: [...actualWeights].map(Number).sort((a, b) => a - b),
    requestedWeights: weights,
    fellBackToDefaultWeight: fellBack,
    fileCount: downloaded.size,
  };
}

module.exports = { selfHostFont };
