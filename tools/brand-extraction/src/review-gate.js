// The mandatory human/client review gate (2026-08-05 decision: the CLIENT
// performs the brand review, not Fabio). A local HTTP server serving a
// self-contained "confirm your brand" page - no build step, no framework,
// consistent with this project's vanilla-only bias.
//
// Surfaces, at minimum, per Thread 1: the extracted logo, the accent/primary
// color, and the detected fonts, each with an easy correction path. Fields
// with `derived: true` are visually distinguished from extracted facts
// (`derived: false`) rather than presented with equal claimed confidence.
//
// This is a real, working gate, not a mockup: submitting writes a
// `.reviewed.json` file with meta.reviewStatus = "approved" and the
// accessibility block recomputed against whatever the client corrected.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseColor } = require('./color-utils');
const { resolveAccentTextOverride } = require('./tokens');
const { contrastRatio } = require('./color-utils');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function confidenceBadge(field) {
  const cls = field.derived ? 'badge derived' : `badge extracted conf-${field.confidence || 'medium'}`;
  const label = field.derived ? 'COMPUTED' : `EXTRACTED · ${(field.confidence || 'medium').toUpperCase()}`;
  return `<span class="${cls}">${label}</span>`;
}

function renderPage(tokens, tokensPath) {
  const c = tokens.color;
  const swatchRow = (key, field) => `
    <div class="row" data-role="${key}">
      <div class="swatch" style="background:${field.value}"></div>
      <div class="meta">
        <div class="label">${key} ${confidenceBadge(field)}</div>
        <div class="source">${escapeHtml(field.source)}</div>
        <input type="color" name="color-${key}" value="${field.value}" />
        <input type="text" class="hex" data-hexfor="${key}" value="${field.value}" maxlength="7" />
      </div>
    </div>`;

  const logo = tokens.logo;
  const logoImg = logo.assetPath
    ? `<img src="/asset?path=${encodeURIComponent(logo.assetPath)}" alt="extracted logo" class="logo-preview" />`
    : `<div class="logo-preview logo-none">No logo found — text wordmark fallback</div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Confirm your brand — ${escapeHtml(tokens.meta.client)}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1a1a;background:#fafafa}
  h1{font-size:1.5rem} h2{font-size:1.1rem;margin-top:2.5rem;border-bottom:1px solid #ddd;padding-bottom:.4rem}
  .sub{color:#666;margin-top:-.5rem}
  .row{display:flex;gap:16px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #eee}
  .swatch{width:56px;height:56px;border-radius:8px;border:1px solid #ccc;flex-shrink:0}
  .meta{flex:1}
  .label{font-weight:600;text-transform:capitalize;display:flex;align-items:center;gap:8px}
  .source{color:#777;font-size:.85rem;margin:2px 0 8px}
  .badge{font-size:.7rem;padding:2px 7px;border-radius:10px;font-weight:600;letter-spacing:.02em}
  .badge.derived{background:#eee;color:#555;border:1px solid #ccc}
  .badge.extracted.conf-high{background:#dcf5e0;color:#1a6b2a}
  .badge.extracted.conf-medium{background:#fdf0d5;color:#8a5a00}
  .badge.extracted.conf-low{background:#fbe1e1;color:#a3231f}
  input[type=color]{vertical-align:middle;width:40px;height:28px;border:none;padding:0;background:none}
  input.hex{width:90px;font-family:monospace}
  .logo-block{display:flex;gap:20px;align-items:center;padding:16px 0}
  .logo-preview{max-width:220px;max-height:120px;border:1px dashed #ccc;padding:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:.85rem;color:#888;text-align:center}
  .logo-actions label{display:block;margin:6px 0;font-size:.9rem}
  .font-row{padding:10px 0;border-bottom:1px solid #eee}
  .font-row .detected{color:#777;font-size:.85rem}
  .font-row .resolved{font-size:1.2rem;margin:4px 0}
  button{background:#1a1a1a;color:#fff;border:none;padding:12px 22px;border-radius:6px;font-size:1rem;cursor:pointer;margin-top:24px}
  button:hover{background:#333}
  .screenshot{max-width:100%;border:1px solid #ddd;margin-top:8px;border-radius:6px}
  #result{margin-top:20px;padding:14px;border-radius:6px;display:none}
  #result.ok{background:#dcf5e0;color:#1a6b2a;display:block}
</style></head>
<body>
<h1>Confirm your brand</h1>
<p class="sub">for ${escapeHtml(tokens.meta.client)} — extracted from ${escapeHtml(tokens.meta.sourceUrl || '(no source url)')}</p>
<p class="sub">Fields marked <span class="badge derived">COMPUTED</span> were calculated, not read off your site — check those more carefully. Fields marked <span class="badge extracted conf-high">EXTRACTED</span> were read directly.</p>

<h2>Logo</h2>
<div class="logo-block">
  ${logoImg}
  <div class="logo-actions">
    <label><input type="radio" name="logoAction" value="keep" checked /> This is our logo — keep it</label>
    <label><input type="radio" name="logoAction" value="reject" /> Not our logo — use a text wordmark instead</label>
    <label><input type="radio" name="logoAction" value="upload" /> Not our logo — upload the real one: <input type="file" id="logoFile" accept="image/*,.svg" /></label>
  </div>
</div>

<h2>Colors</h2>
${swatchRow('primary', c.primary)}
${swatchRow('accent', c.accent)}
${swatchRow('secondary', c.secondary)}
${swatchRow('background', c.background)}
${swatchRow('text', c.text)}

<h2>Fonts</h2>
<div class="font-row">
  <div class="label">Heading ${confidenceBadge({ derived: tokens.typography.heading.derived })}</div>
  <div class="detected">detected: ${escapeHtml(tokens.typography.heading.detected || '(none)')}</div>
  <div class="resolved" style="font-family:'${tokens.typography.heading.resolved}',sans-serif">${escapeHtml(tokens.typography.heading.resolved)}</div>
</div>
<div class="font-row">
  <div class="label">Body ${confidenceBadge({ derived: tokens.typography.body.derived })}</div>
  <div class="detected">detected: ${escapeHtml(tokens.typography.body.detected || '(none)')}</div>
  <div class="resolved" style="font-family:'${tokens.typography.body.resolved}',serif">${escapeHtml(tokens.typography.body.resolved)}</div>
</div>

<h2>Reference screenshot</h2>
<img class="screenshot" src="/asset?path=${encodeURIComponent(tokensPath.replace(/\.tokens\.json$/, '') + '.screenshot.png')}" alt="site screenshot" onerror="this.style.display='none'" />

<button id="submitBtn">Confirm and approve</button>
<div id="result"></div>

<script>
async function fileToDataUrl(file) {
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
}
document.getElementById('submitBtn').addEventListener('click', async () => {
  const colors = {};
  document.querySelectorAll('[data-hexfor]').forEach((el) => { colors[el.dataset.hexfor] = el.value; });
  const logoAction = document.querySelector('input[name=logoAction]:checked').value;
  let logoUpload = null;
  if (logoAction === 'upload') {
    const f = document.getElementById('logoFile').files[0];
    if (f) logoUpload = { name: f.name, dataUrl: await fileToDataUrl(f) };
  }
  const res = await fetch('/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colors, logoAction, logoUpload }),
  });
  const json = await res.json();
  const box = document.getElementById('result');
  box.className = 'ok';
  box.textContent = json.message || 'Approved.';
});
// keep hex input and color picker in sync
document.querySelectorAll('input[type=color]').forEach((el) => {
  el.addEventListener('input', () => {
    const key = el.name.replace('color-', '');
    document.querySelector('[data-hexfor="' + key + '"]').value = el.value.toUpperCase();
  });
});
</script>
</body></html>`;
}

function applyReviewDecisions(tokens, decisions, rawLogoPathBase) {
  const reviewed = JSON.parse(JSON.stringify(tokens));
  const corrections = [];

  // Colors: any hex the client changed becomes ground truth (derived:false,
  // confidence 'human-confirmed'), matching the vault note's framing that
  // this is a correction round-trip, not a fire-and-forget script.
  for (const [role, hex] of Object.entries(decisions.colors || {})) {
    if (!reviewed.color[role]) continue;
    const before = reviewed.color[role].value;
    if (hex && hex.toUpperCase() !== before.toUpperCase()) {
      reviewed.color[role] = {
        value: hex.toUpperCase(), source: 'human-confirmed at review gate (client override)',
        derived: false, confidence: 'human-confirmed',
      };
      corrections.push(`${role}: ${before} -> ${hex.toUpperCase()}`);
    } else {
      reviewed.color[role].confidence = 'human-confirmed';
    }
  }

  // Accent changed -> accessibility block and frame palette must be
  // recomputed, not left stale from the pre-review extraction.
  reviewed.color.accessibility.accentTextOverride = resolveAccentTextOverride(reviewed.color.accent.value);
  reviewed.frameGeneration.paletteForFrames = [
    reviewed.color.primary.value, reviewed.color.accent.value, reviewed.color.secondary.value,
  ];
  reviewed.frameGeneration.backgroundForFrames = reviewed.color.background.value;

  // Logo decision
  if (decisions.logoAction === 'reject') {
    reviewed.logo = {
      format: 'text-wordmark', source: 'human-rejected-at-review', assetPath: null,
      hasTransparency: null, wordmarkFallback: true, backgroundRemovalApplied: false,
      needsBackgroundRemoval: false, confidence: 'human-confirmed', derived: true,
    };
    reviewed.frameGeneration.logoCompositing = { enabled: false, assetPath: null, appearsAtFrameFraction: 1.0, note: 'client rejected extracted logo at review; no replacement uploaded, falls back to no logo compositing' };
    corrections.push('logo: rejected, falls back to text wordmark');
  } else if (decisions.logoAction === 'upload' && decisions.logoUpload) {
    const m = /^data:(.+?);base64,(.+)$/.exec(decisions.logoUpload.dataUrl || '');
    if (m) {
      const ext = (decisions.logoUpload.name.split('.').pop() || 'png').toLowerCase();
      const newPath = rawLogoPathBase + '.logo-client-upload.' + ext;
      fs.writeFileSync(newPath, Buffer.from(m[2], 'base64'));
      reviewed.logo = {
        format: ext, source: 'client-uploaded-at-review', assetPath: newPath,
        hasTransparency: null, wordmarkFallback: false, backgroundRemovalApplied: false,
        needsBackgroundRemoval: null, confidence: 'human-confirmed', derived: false,
      };
      reviewed.frameGeneration.logoCompositing = { enabled: true, assetPath: newPath, appearsAtFrameFraction: 1.0, note: 'client-uploaded replacement logo, ground truth' };
      corrections.push('logo: client uploaded replacement (' + decisions.logoUpload.name + ')');
    }
  } else {
    reviewed.logo.confidence = 'human-confirmed';
    corrections.push('logo: confirmed as-is');
  }

  reviewed.meta.reviewStatus = 'approved';
  reviewed.meta.reviewedAt = new Date().toISOString();
  reviewed.meta.reviewedBy = 'client';
  reviewed.meta.corrections = corrections;
  return reviewed;
}

function startReviewServer(tokensPath, { port = 4173, exitAfterSubmit = true } = {}) {
  const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
  const rawBase = tokensPath.replace(/\.tokens\.json$/, '');

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderPage(tokens, tokensPath));
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/asset?path=')) {
      const p = decodeURIComponent(req.url.slice('/asset?path='.length));
      if (!fs.existsSync(p)) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(p).toLowerCase();
      const type = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      fs.createReadStream(p).pipe(res);
      return;
    }
    if (req.method === 'POST' && req.url === '/submit') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const decisions = JSON.parse(body);
          const reviewed = applyReviewDecisions(tokens, decisions, rawBase);
          const outPath = rawBase + '.reviewed.json';
          fs.writeFileSync(outPath, JSON.stringify(reviewed, null, 2));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Approved. Wrote ' + outPath, corrections: reviewed.meta.corrections }));
          if (exitAfterSubmit) setTimeout(() => server.close(), 200);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }
    res.writeHead(404); res.end('not found');
  });

  server.listen(port);
  return server;
}

module.exports = { startReviewServer, renderPage, applyReviewDecisions };
