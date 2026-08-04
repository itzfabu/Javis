// Minimal brand-extraction spike. Throwaway - not part of the generator.
// Usage: node extract.js <url> <output-basename>
// Pulls: 6-8 structural-selector color roles, heading+body font-family,
// logo via retrieval-priority list, CSS custom properties matching
// --brand*/--color-* naming conventions.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CUSTOM_PROP_NAMES = [
  '--primary', '--color-primary', '--brand-primary', '--brand-color', '--brand',
  '--secondary', '--color-secondary', '--brand-secondary',
  '--accent', '--color-accent', '--brand-accent',
  '--background', '--color-background', '--bg',
  '--text', '--color-text', '--foreground',
];

const CTA_SELECTORS = [
  '.btn-primary', '.button-primary', 'a.cta', '[class*="btn-primary" i]',
  '[class*="cta" i]', 'button[type="submit"]', '.btn', 'button', 'a[class*="btn" i]',
];

function firstNonEmptyFont(fontFamily) {
  if (!fontFamily) return null;
  return fontFamily.split(',')[0].replace(/['"]/g, '').trim();
}

function isTransparentOrNone(color) {
  if (!color) return true;
  return color === 'rgba(0, 0, 0, 0)' || color === 'transparent';
}

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (brand-extract-spike)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error('HTTP ' + res.statusCode));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(destPath, buf);
        resolve(buf.length);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extract(url, outBase) {
  const result = { url, extractedAt: new Date().toISOString(), errors: [] };

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

  // ---- COLORS: structural selectors ----
  result.color = {};

  result.color.background = await page.evaluate(() => {
    const b = getComputedStyle(document.body).backgroundColor;
    const h = getComputedStyle(document.documentElement).backgroundColor;
    return (b && b !== 'rgba(0, 0, 0, 0)') ? b : h;
  });
  result.color.text = await page.evaluate(() => getComputedStyle(document.body).color);

  result.color.header = await page.evaluate(() => {
    const sels = ['header', '.header', '#header', 'nav', '.navbar', '.nav'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') return bg;
      }
    }
    return null;
  });

  result.color.footer = await page.evaluate(() => {
    const sels = ['footer', '.footer', '#footer'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') return bg;
      }
    }
    return null;
  });

  const ctaResult = await page.evaluate((selectors) => {
    for (const s of selectors) {
      const els = document.querySelectorAll(s);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 30 || rect.height < 15) continue;
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return { selector: s, backgroundColor: bg, color: cs.color, text: el.textContent.trim().slice(0, 40) };
        }
      }
    }
    return null;
  }, CTA_SELECTORS);
  result.color.cta = ctaResult;

  result.color.link = await page.evaluate(() => {
    const mains = ['main a', 'article a', 'section a', 'p a', 'a'];
    for (const s of mains) {
      const el = document.querySelector(s);
      if (el) {
        const c = getComputedStyle(el).color;
        if (c) return c;
      }
    }
    return null;
  });

  result.color.surface = await page.evaluate(() => {
    const sels = ['.card', 'article', 'main section', '.section', 'section'];
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    for (const s of sels) {
      const els = document.querySelectorAll(s);
      for (const el of els) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== bodyBg) return bg;
      }
    }
    return null;
  });

  result.color.borderSample = await page.evaluate(() => {
    const sels = ['.card', 'button', 'input', 'section'];
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) {
        const bc = getComputedStyle(el).borderColor;
        const bw = getComputedStyle(el).borderWidth;
        if (bc && bw !== '0px' && !bc.includes('rgba(0, 0, 0, 0)')) return bc;
      }
    }
    return null;
  });

  // ---- CSS custom properties ----
  result.customProperties = await page.evaluate((names) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const found = {};
    for (const n of names) {
      const v = rootStyle.getPropertyValue(n).trim();
      if (v) found[n] = v;
    }
    return found;
  }, CUSTOM_PROP_NAMES);

  // Also scan stylesheet rules directly for any --brand*/--color-* custom prop
  // declaration (catches ones not resolved onto :root inline but declared in
  // a class or media query) - best effort, cross-origin sheets will throw.
  result.customPropertiesFromRules = await page.evaluate(() => {
    const found = {};
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const rule of rules) {
        if (!rule.style) continue;
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith('--brand') || prop.startsWith('--color-') || prop === '--primary' || prop === '--accent') {
            found[prop] = rule.style.getPropertyValue(prop).trim();
          }
        }
      }
    }
    return found;
  }).catch((e) => { result.errors.push('customPropertiesFromRules failed: ' + e.message); return {}; });

  // ---- FONTS ----
  result.font = await page.evaluate(() => {
    const heading = document.querySelector('h1') || document.querySelector('h2');
    const headingFont = heading ? getComputedStyle(heading).fontFamily : null;
    const bodyFont = getComputedStyle(document.body).fontFamily;
    return { headingFont, bodyFont };
  });
  result.font.headingFirst = firstNonEmptyFont(result.font.headingFont);
  result.font.bodyFirst = firstNonEmptyFont(result.font.bodyFont);

  // ---- LOGO: retrieval priority ----
  const logoInfo = await page.evaluate(() => {
    function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return u; } }

    // 1. inline SVG in header/logo area
    const svgSels = ['header svg', '.header svg', 'nav svg', 'a[class*="logo" i] svg', '.logo svg'];
    for (const s of svgSels) {
      const el = document.querySelector(s);
      if (el) return { tier: 'inline-svg', format: 'svg', selector: s, svgOuterHTMLLength: el.outerHTML.length };
    }

    // 2. <img> with logo in class/id/alt, prioritizing header/nav scope
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

    // 3. og:image
    const og = document.querySelector('meta[property="og:image"]');
    if (og && og.content) {
      const format = og.content.split('?')[0].split('.').pop().toLowerCase();
      return { tier: 'og-image', format, url: abs(og.content) };
    }

    // 4. apple-touch-icon (higher res than favicon)
    const ati = document.querySelector('link[rel="apple-touch-icon"]');
    if (ati && ati.href) {
      const format = ati.href.split('?')[0].split('.').pop().toLowerCase();
      return { tier: 'apple-touch-icon', format, url: abs(ati.href) };
    }

    // 5. favicon last resort
    const fav = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (fav && fav.href) {
      const format = fav.href.split('?')[0].split('.').pop().toLowerCase();
      return { tier: 'favicon', format, url: abs(fav.href) };
    }
    return { tier: 'none', format: null, url: null };
  });
  result.logo = logoInfo;

  // Download the logo (if raster/svg url found) for alpha-channel inspection
  if (logoInfo.url) {
    const ext = (logoInfo.format || 'bin').slice(0, 5);
    const logoPath = outBase + '.logo.' + ext;
    try {
      const bytes = await downloadFile(logoInfo.url, logoPath);
      result.logo.downloadedPath = logoPath;
      result.logo.downloadedBytes = bytes;
    } catch (e) {
      result.logo.downloadError = e.message;
    }
  } else if (logoInfo.tier === 'inline-svg') {
    // save the raw inline SVG markup itself
    const svgMarkup = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? el.outerHTML : null;
    }, logoInfo.selector);
    if (svgMarkup) {
      const logoPath = outBase + '.logo.svg';
      fs.writeFileSync(logoPath, svgMarkup);
      result.logo.downloadedPath = logoPath;
      result.logo.downloadedBytes = svgMarkup.length;
    }
  }

  // Screenshot for manual sensibility judgment
  try {
    await page.screenshot({ path: outBase + '.screenshot.png', fullPage: false });
  } catch (e) {
    result.errors.push('screenshot failed: ' + e.message);
  }

  await browser.close();
  return result;
}

(async () => {
  const [, , url, outBase] = process.argv;
  if (!url || !outBase) {
    console.error('Usage: node extract.js <url> <output-basename>');
    process.exit(1);
  }
  const result = await extract(url, outBase);
  fs.writeFileSync(outBase + '.json', JSON.stringify(result, null, 2));
  console.log('wrote ' + outBase + '.json');
})();
