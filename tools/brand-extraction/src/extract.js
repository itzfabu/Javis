// Raw brand extraction from a live, existing website (Thread 1, input path a).
// Playwright directly, not Dembrandt (2026-08-04 decision) - renders the real
// page and reads computed styles from ~6-8 structural selectors, not
// color-frequency counting across the page.
//
// This is the production module version of the throwaway spike
// (spikes/brand-extract/extract2.js), carrying forward its four validated
// fixes (img-heuristic logo priority, scored CTA detection, screenshot-crop
// header fallback, transparent->white normalization) plus an alpha-channel
// check on raster logos that the spike measured but didn't wire in.

const { chromium } = require('playwright');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { execFileSync } = require('child_process');
const { parseColor, colorsRoughlyEqual } = require('./color-utils');
const { normalizeFontName, firstNonEmptyFont } = require('./fonts');

const CUSTOM_PROP_NAMES = [
  '--primary', '--color-primary', '--brand-primary', '--brand-color', '--brand',
  '--secondary', '--color-secondary', '--brand-secondary',
  '--accent', '--color-accent', '--brand-accent',
  '--background', '--color-background', '--bg',
  '--text', '--color-text', '--foreground',
];

const CTA_TEXT_KEYWORDS = [
  'book', 'call', 'contact', 'order', 'quote', 'estimate', 'shop', 'schedule',
  'buy', 'get started', 'apply', 'request', 'reserve', 'appointment', 'visit',
  'learn more', 'sign up',
];
const CTA_EXCLUDE_PATTERNS = [
  /cookie/i, /consent/i, /gdpr/i, /accept.?all/i, /decline/i, /manage.?(cookies|settings)/i,
  /newsletter/i, /klaviyo/i, /mailchimp/i, /subscribe/i,
  /carousel/i, /slick/i, /swiper/i, /\bslide\b/i, /\bnext\b/i, /\bprev(ious)?\b/i, /arrow/i,
  /dropdown/i, /caret/i, /\btoggle\b/i,
];
const ICON_FONT_CLASS_PATTERNS = [
  /^e-fas-/, /^e-far-/, /^e-fab-/, /^fa-/, /^fas\b/, /^far\b/, /^fab\b/,
  /icon-font/i, /^e-font-icon/,
];

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (jarvis-brand-extraction)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { const buf = Buffer.concat(chunks); fs.writeFileSync(destPath, buf); resolve(buf.length); });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function dominantColorFromCrop(imgPath) {
  try {
    const out = execFileSync('python', ['-c', `
from PIL import Image
img = Image.open(r"${imgPath}").convert("RGB")
small = img.resize((1, 1))
r, g, b = small.getpixel((0, 0))
print(f"rgb({r}, {g}, {b})")
`]).toString().trim();
    return out;
  } catch (e) {
    return null;
  }
}

// Format handling per Thread 1: raster (PNG/JPG) checked for an alpha
// channel. Returns { hasTransparency, mode } or null if the check fails
// (missing Pillow, unreadable file, etc.) - a failed check is a "don't know",
// not "false", and is surfaced as such rather than silently assumed opaque.
function checkAlphaChannel(imgPath) {
  try {
    const out = execFileSync('python', ['-c', `
from PIL import Image
img = Image.open(r"${imgPath}")
mode = img.mode
has_alpha = mode in ("RGBA", "LA") or (mode == "P" and "transparency" in img.info)
if has_alpha and mode in ("RGBA", "LA"):
    alpha = img.getchannel("A")
    extrema = alpha.getextrema()
    has_alpha = extrema[0] < 255  # fully-opaque alpha channel doesn't count as real transparency
print(f"{mode}|{has_alpha}")
`]).toString().trim();
    const [mode, hasAlphaStr] = out.split('|');
    return { mode, hasTransparency: hasAlphaStr === 'True' };
  } catch (e) {
    return null;
  }
}

async function extractRaw(url, outBase) {
  const result = { url, extractedAt: new Date().toISOString(), errors: [], confidence: {} };

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      result.errors.push('networkidle timed out, fell back to domcontentloaded: ' + e.message);
    } catch (e2) {
      result.fatalError = e2.message;
      await browser.close();
      return result;
    }
  }
  await page.waitForTimeout(1000);

  result.color = {};

  // ---- background: transparent -> assume white ----
  const rawBackground = await page.evaluate(() => {
    const b = getComputedStyle(document.body).backgroundColor;
    const h = getComputedStyle(document.documentElement).backgroundColor;
    return (b && b !== 'rgba(0, 0, 0, 0)') ? b : h;
  });
  if (!rawBackground || rawBackground === 'rgba(0, 0, 0, 0)') {
    result.color.background = 'rgb(255, 255, 255)';
    result.confidence.background = { level: 'medium', note: 'transparent computed value, normalized to assumed white' };
  } else {
    result.color.background = rawBackground;
    result.confidence.background = { level: 'high', note: 'direct computed value' };
  }
  const backgroundRgb = parseColor(result.color.background);

  // ---- text ----
  result.color.text = await page.evaluate(() => getComputedStyle(document.body).color);
  result.confidence.text = { level: 'high', note: 'direct computed value' };

  // ---- header: computed style first, screenshot-crop sample fallback second ----
  const headerCheck = await page.evaluate(() => {
    const sels = ['header', '.header', '#header', 'nav', '.navbar', '.nav'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        const rect = el.getBoundingClientRect();
        if (bg && bg !== 'rgba(0, 0, 0, 0)') return { color: bg, selector: s, rect: null };
        return { color: null, selector: s, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
      }
    }
    return { color: null, selector: null, rect: null };
  });
  if (headerCheck.color) {
    result.color.header = headerCheck.color;
    result.confidence.header = { level: 'high', note: 'direct computed value on ' + headerCheck.selector };
  } else if (headerCheck.rect && headerCheck.rect.width > 10 && headerCheck.rect.height > 10) {
    const cropPath = outBase + '.header-crop.png';
    try {
      await page.screenshot({ path: cropPath, clip: headerCheck.rect });
      const sampled = dominantColorFromCrop(cropPath);
      if (sampled) {
        result.color.header = sampled;
        result.confidence.header = { level: 'medium', note: 'sampled from screenshot crop (image-based header, no computed background-color)' };
      } else {
        result.color.header = null;
        result.confidence.header = { level: 'low', note: 'no computed color and pixel-sampling failed' };
      }
    } catch (e) {
      result.color.header = null;
      result.confidence.header = { level: 'low', note: 'crop screenshot failed: ' + e.message };
      result.errors.push('header crop failed: ' + e.message);
    }
  } else {
    result.color.header = null;
    result.confidence.header = { level: 'low', note: 'no header/nav element matched, or no distinct background found' };
  }

  // ---- footer ----
  result.color.footer = await page.evaluate(() => {
    const sels = ['footer', '.footer', '#footer'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) { const bg = getComputedStyle(el).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)') return bg; }
    }
    return null;
  });
  result.confidence.footer = { level: result.color.footer ? 'high' : 'low', note: result.color.footer ? 'direct computed value' : 'no distinct background found' };

  // ---- CTA/accent via scoring, not first-match ----
  const ctaResult = await page.evaluate(({ keywords, excludePatterns, viewportH }) => {
    const excludeRe = excludePatterns.map((p) => new RegExp(p.source, p.flags));
    const candidates = Array.from(document.querySelectorAll(
      'button, a[class*="btn" i], a[class*="button" i], a[class*="cta" i], a[role="button"], input[type="submit"]'
    ));
    let best = null, bestScore = -Infinity;
    for (const el of candidates) {
      const text = (el.textContent || el.value || '').trim();
      const cls = el.className && el.className.toString ? el.className.toString() : '';
      const aria = el.getAttribute('aria-label') || '';
      const combined = (text + ' ' + cls + ' ' + aria).toLowerCase();
      if (excludeRe.some((re) => re.test(combined))) continue;
      if (el.getAttribute('aria-haspopup') === 'true' || el.hasAttribute('aria-expanded')) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width < 30 || rect.height < 15) continue;
      if (!text) continue;

      let score = 0;
      const lowerText = text.toLowerCase();
      for (const kw of keywords) { if (lowerText.includes(kw)) { score += 10; break; } }
      if (rect.top >= 0 && rect.top < viewportH) score += 5;
      score += Math.min(5, (rect.width * rect.height) / 2000);
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const hasBorder = cs.borderWidth !== '0px' && !cs.borderColor.includes('rgba(0, 0, 0, 0)');
      if ((bg && bg !== 'rgba(0, 0, 0, 0)') || hasBorder) score += 3;

      if (score > bestScore) {
        bestScore = score;
        best = { text: text.slice(0, 40), backgroundColor: bg, color: cs.color, borderColor: cs.borderColor, score, selectorClass: cls.slice(0, 60) };
      }
    }
    return best && bestScore >= 8 ? best : null;
  }, { keywords: CTA_TEXT_KEYWORDS, excludePatterns: CTA_EXCLUDE_PATTERNS.map((p) => ({ source: p.source, flags: p.flags })), viewportH: 900 });

  result.color.cta = ctaResult;
  if (ctaResult && ctaResult.backgroundColor && ctaResult.backgroundColor !== 'rgba(0, 0, 0, 0)') {
    result.confidence.cta = { level: 'medium', note: 'scored candidate match (score ' + ctaResult.score.toFixed(1) + '), still needs human review' };
  } else if (ctaResult) {
    result.confidence.cta = { level: 'low', note: 'scored candidate is an outlined/transparent element - color role ambiguous, needs human review' };
  } else {
    result.confidence.cta = { level: 'low', note: 'no candidate cleared the minimum confidence bar - flagged for manual entry, not guessed' };
  }

  // ---- link ----
  const linkColor = await page.evaluate((bodyTextColor) => {
    const candidates = Array.from(document.querySelectorAll('main a, article a, p a'));
    for (const el of candidates) {
      const c = getComputedStyle(el).color;
      if (!c) continue;
      const m = c.match(/rgba?\((\d+), (\d+), (\d+)/);
      if (!m) continue;
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      if (r > 245 && g > 245 && b > 245) continue;
      if (c === bodyTextColor) continue;
      return c;
    }
    return null;
  }, result.color.text);
  result.color.link = linkColor;
  result.confidence.link = { level: linkColor ? 'medium' : 'low', note: linkColor ? 'filtered for near-white and body-text-color matches, still not independently verified' : 'no candidate passed the near-white/body-text filter' };

  // ---- CSS custom properties, cross-checked against independently observed colors ----
  const customProps = await page.evaluate((names) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const found = {};
    for (const n of names) { const v = rootStyle.getPropertyValue(n).trim(); if (v) found[n] = v; }
    return found;
  }, CUSTOM_PROP_NAMES);

  const normalizedCustomProps = {};
  for (const [name, rawVal] of Object.entries(customProps)) {
    const normalized = await page.evaluate((val) => {
      const d = document.createElement('div');
      d.style.color = val;
      document.body.appendChild(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    }, rawVal);
    normalizedCustomProps[name] = { raw: rawVal, normalized };
  }
  result.customProperties = normalizedCustomProps;

  result.customPropertyCrossCheck = {};
  for (const [name, { normalized }] of Object.entries(normalizedCustomProps)) {
    const propRgb = parseColor(normalized);
    const matchesHeader = propRgb && result.color.header && colorsRoughlyEqual(propRgb, parseColor(result.color.header));
    const matchesCta = propRgb && ctaResult && ctaResult.backgroundColor && colorsRoughlyEqual(propRgb, parseColor(ctaResult.backgroundColor));
    const confirmed = matchesHeader || matchesCta;
    result.customPropertyCrossCheck[name] = {
      confirmedByStructuralMatch: !!confirmed,
      matchedAgainst: matchesHeader ? 'header' : (matchesCta ? 'cta' : null),
    };
  }

  // ---- FONTS ----
  result.font = await page.evaluate(() => {
    const heading = document.querySelector('h1') || document.querySelector('h2');
    return { headingFont: heading ? getComputedStyle(heading).fontFamily : null, bodyFont: getComputedStyle(document.body).fontFamily };
  });
  result.font.headingFirst = firstNonEmptyFont(result.font.headingFont);
  result.font.bodyFirst = firstNonEmptyFont(result.font.bodyFont);
  result.font.headingNormalized = normalizeFontName(result.font.headingFirst);
  result.font.bodyNormalized = normalizeFontName(result.font.bodyFirst);

  // ---- LOGO: img heuristic first, validated inline-svg second ----
  const logoInfo = await page.evaluate((iconClassPatterns) => {
    function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return u; } }

    const imgSels = [
      'header img[class*="logo" i]', 'header img[id*="logo" i]', 'header img[alt*="logo" i]',
      'nav img[class*="logo" i]', 'nav img[alt*="logo" i]',
      '.logo img', 'a[class*="logo" i] img',
      'img[class*="logo" i]', 'img[id*="logo" i]', 'img[alt*="logo" i]',
    ];
    for (const s of imgSels) {
      const el = document.querySelector(s);
      if (el && el.src) {
        const format = el.src.split('?')[0].split('.').pop().toLowerCase();
        return { tier: 'img-logo-heuristic', format, selector: s, url: abs(el.src) };
      }
    }

    function isInDisplayNone(el) {
      let cur = el;
      while (cur) { if (getComputedStyle(cur).display === 'none') return true; cur = cur.parentElement; }
      return false;
    }
    function hasIconFontClass(el) {
      const cls = el.className && el.className.toString ? el.className.toString() : '';
      return iconClassPatterns.some((p) => new RegExp(p.source, p.flags).test(cls));
    }
    function resolveUseRefs(svgEl) {
      const uses = svgEl.querySelectorAll('use');
      if (uses.length === 0) return { hasUnresolvedUse: false, inlinedMarkup: svgEl.outerHTML };
      let clone = svgEl.cloneNode(true);
      let allResolved = true;
      clone.querySelectorAll('use').forEach((useEl) => {
        const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
        if (!href || !href.startsWith('#')) { allResolved = false; return; }
        const target = document.querySelector(href);
        if (!target) { allResolved = false; return; }
        const inlined = target.cloneNode(true);
        inlined.removeAttribute('id');
        useEl.replaceWith(inlined);
      });
      return { hasUnresolvedUse: !allResolved, inlinedMarkup: clone.outerHTML };
    }

    const svgSels = ['header svg', '.header svg', 'nav svg', 'a[class*="logo" i] svg', '.logo svg'];
    for (const s of svgSels) {
      const el = document.querySelector(s);
      if (!el) continue;
      if (isInDisplayNone(el)) continue;
      if (hasIconFontClass(el)) continue;
      const rect = el.getBoundingClientRect();
      const MIN_DIM = 32;
      if (rect.width < MIN_DIM && rect.height < MIN_DIM) continue;
      const resolved = resolveUseRefs(el);
      return {
        tier: 'inline-svg-validated',
        format: 'svg',
        selector: s,
        renderedSize: { width: rect.width, height: rect.height },
        hadUseRef: el.querySelectorAll('use').length > 0,
        unresolvedUseRef: resolved.hasUnresolvedUse,
        svgOuterHTMLLength: resolved.inlinedMarkup.length,
        inlinedMarkup: resolved.inlinedMarkup,
      };
    }

    const og = document.querySelector('meta[property="og:image"]');
    if (og && og.content) { const format = og.content.split('?')[0].split('.').pop().toLowerCase(); return { tier: 'og-image', format, url: abs(og.content) }; }

    const ati = document.querySelector('link[rel="apple-touch-icon"]');
    if (ati && ati.href) { const format = ati.href.split('?')[0].split('.').pop().toLowerCase(); return { tier: 'apple-touch-icon', format, url: abs(ati.href) }; }

    const fav = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (fav && fav.href) { const format = fav.href.split('?')[0].split('.').pop().toLowerCase(); return { tier: 'favicon', format, url: abs(fav.href) }; }

    return { tier: 'none', format: null, url: null };
  }, ICON_FONT_CLASS_PATTERNS.map((p) => ({ source: p.source, flags: p.flags })));

  result.logo = logoInfo;
  const logoConfidenceByTier = {
    'img-logo-heuristic': { level: 'medium', note: 'heuristic match on class/id/alt - confirmed reliable in the validation spike, still worth a quick human glance' },
    'inline-svg-validated': { level: 'medium', note: 'passed display:none / icon-font / size / use-ref validation, but validation is heuristic, not certain' },
    'og-image': { level: 'low', note: 'often a marketing/share graphic, not a clean logo mark - flag for manual review' },
    'apple-touch-icon': { level: 'low', note: 'usually an icon mark, not a full logotype' },
    'favicon': { level: 'low', note: 'last resort, usually a small icon mark only' },
    'none': { level: 'low', note: 'no logo found - falls back to text wordmark' },
  };
  result.confidence.logo = logoConfidenceByTier[logoInfo.tier] || { level: 'low', note: 'unknown tier' };

  if (logoInfo.url) {
    const ext = (logoInfo.format || 'bin').slice(0, 5);
    const logoPath = outBase + '.logo.' + ext;
    try {
      const bytes = await downloadFile(logoInfo.url, logoPath);
      result.logo.downloadedPath = logoPath;
      result.logo.downloadedBytes = bytes;
      // Format handling: raster checked for an alpha channel.
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
        const alphaCheck = checkAlphaChannel(logoPath);
        if (alphaCheck) {
          result.logo.hasTransparency = alphaCheck.hasTransparency;
          result.logo.pillowMode = alphaCheck.mode;
          result.logo.needsBackgroundRemoval = !alphaCheck.hasTransparency;
        } else {
          result.logo.hasTransparency = null;
          result.logo.needsBackgroundRemoval = null;
          result.errors.push('alpha-channel check failed (Pillow unavailable or unreadable image)');
        }
      } else {
        result.logo.hasTransparency = true; // svg: transparency is inherent, not raster-checked
        result.logo.needsBackgroundRemoval = false;
      }
    } catch (e) { result.logo.downloadError = e.message; }
  } else if (logoInfo.tier === 'inline-svg-validated' && logoInfo.inlinedMarkup) {
    const logoPath = outBase + '.logo.svg';
    fs.writeFileSync(logoPath, logoInfo.inlinedMarkup);
    result.logo.downloadedPath = logoPath;
    result.logo.downloadedBytes = logoInfo.inlinedMarkup.length;
    result.logo.hasTransparency = true;
    result.logo.needsBackgroundRemoval = false;
    delete result.logo.inlinedMarkup;
  }

  try { await page.screenshot({ path: outBase + '.screenshot.png', fullPage: false }); }
  catch (e) { result.errors.push('screenshot failed: ' + e.message); }

  await browser.close();
  return result;
}

module.exports = { extractRaw, CUSTOM_PROP_NAMES };
