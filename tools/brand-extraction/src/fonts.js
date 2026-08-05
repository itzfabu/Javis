// Font detection support: normalization, web-safe/Google-Fonts/commercial
// classification, and the substitution table Thread 1 flagged as unbuilt.
//
// Per Thread 1's decision: a maintained static mapping table, not a live
// matching API (WhatFontIs, Fontspring Matcherator, etc. are explicitly out).
// Seeded from public free-alternative guidance (FontBench/Typewolf-style
// commercial-to-Google-Fonts pairings), hand-curated here as a static table -
// not scraped live, consistent with the anti-external-dependency bias.

// This project's own already-vetted shortlist (per Thread 1: prefer these
// first when a reasonable category fit exists, before falling back to the
// wider Google Fonts catalog by category).
const PROJECT_SHORTLIST = {
  serif: 'Fraunces',
  sans: 'Instrument Sans',
  display: 'Instrument Serif',
  mono: 'JetBrains Mono',
};

// OS-provided, no redistribution issue - legally fine as-is, but Thread 1
// flags these for substitution anyway on quality grounds. `qualityUpgrade`
// records what a quality-motivated substitution would use.
const WEB_SAFE_FONTS = {
  'arial': { qualityUpgrade: 'Inter' },
  'helvetica': { qualityUpgrade: 'Inter' },
  'times new roman': { qualityUpgrade: 'Lora' },
  'times': { qualityUpgrade: 'Lora' },
  'georgia': { qualityUpgrade: 'Fraunces' },
  'verdana': { qualityUpgrade: 'Work Sans' },
  'tahoma': { qualityUpgrade: 'Work Sans' },
  'trebuchet ms': { qualityUpgrade: 'Jost' },
  'courier new': { qualityUpgrade: 'JetBrains Mono' },
  'courier': { qualityUpgrade: 'JetBrains Mono' },
  'segoe ui': { qualityUpgrade: 'Inter' },
  'system-ui': { qualityUpgrade: 'Inter' },
  '-apple-system': { qualityUpgrade: 'Inter' },
  'sans-serif': { qualityUpgrade: 'Instrument Sans' }, // bare generic fallback with no real family before it
  'serif': { qualityUpgrade: 'Fraunces' },
  'monospace': { qualityUpgrade: 'JetBrains Mono' },
  'lucida console': { qualityUpgrade: 'JetBrains Mono' },
  'palatino': { qualityUpgrade: 'Cormorant Garamond' },
  'palatino linotype': { qualityUpgrade: 'Cormorant Garamond' },
  'century gothic': { qualityUpgrade: 'Poppins' },
  'impact': { qualityUpgrade: 'Anton' },
  'comic sans ms': { qualityUpgrade: 'Comfortaa' },
};

// Reasonably wide set of common Google Fonts - used to detect the "already a
// Google Font, zero risk, reuse directly" case per Thread 1.
const GOOGLE_FONTS_KNOWN = new Set([
  'roboto', 'open sans', 'lato', 'montserrat', 'poppins', 'inter', 'nunito', 'nunito sans',
  'raleway', 'oswald', 'playfair display', 'playfair display sc', 'merriweather', 'pt sans', 'pt serif',
  'source sans pro', 'source sans 3', 'source serif pro', 'source serif 4', 'work sans', 'fira sans',
  'barlow', 'barlow condensed', 'barlow semi condensed', 'rubik', 'quicksand', 'karla', 'mukta',
  'dm sans', 'dm serif display', 'dm serif text', 'josefin sans', 'josefin slab', 'bebas neue',
  'anton', 'bangers', 'righteous', 'lobster', 'pacifico', 'dancing script', 'cormorant',
  'cormorant garamond', 'eb garamond', 'libre baskerville', 'crimson text', 'crimson pro', 'lora',
  'noto sans', 'noto serif', 'ibm plex sans', 'ibm plex serif', 'ibm plex mono', 'jetbrains mono',
  'space mono', 'fraunces', 'instrument serif', 'instrument sans', 'manrope', 'sora', 'space grotesk',
  'outfit', 'plus jakarta sans', 'figtree', 'epilogue', 'bricolage grotesque', 'archivo',
  'archivo black', 'bitter', 'zilla slab', 'spectral', 'domine', 'vollkorn', 'alegreya', 'cabin',
  'assistant', 'hind', 'heebo', 'comfortaa', 'quattrocento', 'jost', 'urbanist',
]);

// Commercial/proprietary fonts that cannot be redistributed - the "hard
// constraint, not a formality" case. Mapped to a Google Fonts alternative,
// with a `category` used to fall back to PROJECT_SHORTLIST for anything not
// explicitly in this table. Roughly 40 entries, seeded from public
// free-alternative references (FontBench, Typewolf's guide) per Thread 1.
const COMMERCIAL_FONT_MAP = {
  'helvetica neue': { resolved: 'Inter', category: 'sans' },
  'futura': { resolved: 'Poppins', category: 'sans' },
  'futura pt': { resolved: 'Poppins', category: 'sans' },
  'proxima nova': { resolved: 'Montserrat', category: 'sans' },
  'circular': { resolved: 'DM Sans', category: 'sans' },
  'gotham': { resolved: 'Poppins', category: 'sans' },
  'brandon grotesque': { resolved: 'Jost', category: 'sans' },
  'brandon text': { resolved: 'Jost', category: 'sans' },
  'avenir': { resolved: 'Nunito Sans', category: 'sans' },
  'avenir next': { resolved: 'Nunito Sans', category: 'sans' },
  'din': { resolved: 'Barlow', category: 'sans' },
  'din next': { resolved: 'Barlow', category: 'sans' },
  'univers': { resolved: 'Work Sans', category: 'sans' },
  'frutiger': { resolved: 'PT Sans', category: 'sans' },
  'myriad pro': { resolved: 'PT Sans', category: 'sans' },
  'calibri': { resolved: 'Lato', category: 'sans' },
  'gill sans': { resolved: 'Nunito Sans', category: 'sans' },
  'trade gothic': { resolved: 'Oswald', category: 'sans' },
  'knockout': { resolved: 'Bebas Neue', category: 'display' },
  'champion gothic': { resolved: 'Bebas Neue', category: 'display' },
  'zing rust': { resolved: 'Righteous', category: 'display' },
  'founders grotesk': { resolved: 'Work Sans', category: 'sans' },
  'objektiv': { resolved: 'Inter', category: 'sans' },
  'objektiv mk1': { resolved: 'Inter', category: 'sans' },
  'objektiv mk2': { resolved: 'Inter', category: 'sans' },
  'neue haas grotesk': { resolved: 'Inter', category: 'sans' },
  'neue haas unica': { resolved: 'Inter', category: 'sans' },
  'gt walsheim': { resolved: 'Poppins', category: 'sans' },
  'gt america': { resolved: 'Inter', category: 'sans' },
  'sohne': { resolved: 'Inter', category: 'sans' },
  'soehne': { resolved: 'Inter', category: 'sans' },
  'whitney': { resolved: 'Karla', category: 'sans' },
  'sofia pro': { resolved: 'Quicksand', category: 'sans' },
  'klavika': { resolved: 'Poppins', category: 'sans' },
  'effra': { resolved: 'Mukta', category: 'sans' },
  'aktiv grotesk': { resolved: 'Inter', category: 'sans' },
  'graphik': { resolved: 'Work Sans', category: 'sans' },
  'national': { resolved: 'IBM Plex Sans', category: 'sans' },
  'tungsten': { resolved: 'Oswald', category: 'display' },
  'chronicle': { resolved: 'Lora', category: 'serif' },
  'chronicle text': { resolved: 'Lora', category: 'serif' },
  'freight text': { resolved: 'Lora', category: 'serif' },
  'freight sans': { resolved: 'Work Sans', category: 'sans' },
  'sabon': { resolved: 'EB Garamond', category: 'serif' },
  'adobe garamond': { resolved: 'EB Garamond', category: 'serif' },
  'adobe garamond pro': { resolved: 'EB Garamond', category: 'serif' },
  'garamond premier pro': { resolved: 'EB Garamond', category: 'serif' },
  'bembo': { resolved: 'Cormorant Garamond', category: 'serif' },
  'didot': { resolved: 'Playfair Display', category: 'serif' },
  'bodoni': { resolved: 'Playfair Display', category: 'serif' },
  'bodoni mt': { resolved: 'Playfair Display', category: 'serif' },
  'baskerville': { resolved: 'Libre Baskerville', category: 'serif' },
  'minion pro': { resolved: 'Source Serif 4', category: 'serif' },
};

// FIX4's honest gap, addressed here: strip webfont-loader tokens (`xx`,
// `web`) in addition to weight suffixes, so a name like `circularxxweb-book`
// normalizes far enough to actually hit the table under `circular`.
function normalizeFontName(raw) {
  if (!raw) return null;
  let s = raw.trim();
  // Order matters: a name like "circularxxweb-book" has the weight suffix
  // outermost, then the webfont-loader "web" token, then the "xx" token
  // closest to the real name - stripping in the wrong order (as an earlier
  // version of this function did) leaves "web" sitting where "xx$" can never
  // match it, so "circularxxweb-book" stopped at "Circularxxweb" instead of
  // reducing to "Circular". Strip from the outside in.
  s = s.replace(/-?(book|regular|normal|light|medium|semibold|bold|black|thin|italic|oblique)$/i, '');
  s = s.replace(/-?web(font)?$/i, '');
  s = s.replace(/xx$/i, ''); // webfont-loader token, e.g. "circularxx" -> "circular"
  s = s.replace(/[-_]+/g, ' ').trim();
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/\b\w/g, (c) => c.toUpperCase());
  return s;
}

function firstNonEmptyFont(fontFamilyCss) {
  if (!fontFamilyCss) return null;
  return fontFamilyCss.split(',')[0].replace(/['"]/g, '').trim();
}

// Guess a coarse category from the CSS font-family fallback chain itself
// (e.g. `..., sans-serif` at the end) when the detected name isn't in either
// table - used to pick a PROJECT_SHORTLIST entry rather than guessing blind.
function guessCategoryFromFallbackChain(fontFamilyCss) {
  if (!fontFamilyCss) return 'sans';
  const lower = fontFamilyCss.toLowerCase();
  if (/monospace/.test(lower)) return 'mono';
  if (/serif/.test(lower) && !/sans-serif/.test(lower)) return 'serif';
  return 'sans';
}

function googleFontsUrl(families) {
  // families: [{ name, weights: [400,700] }]
  const parts = families.map((f) => {
    const fam = f.name.replace(/\s+/g, '+');
    const weights = (f.weights || [400, 700]).join(';');
    return `family=${fam}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}

// Resolve a raw computed font-family value into { detected, resolved, source,
// fallbackStack, note }, per Thread 1's three-case licensing rule.
function resolveFont(fontFamilyCss, { weights = [400, 700], fallbackGeneric = 'sans-serif' } = {}) {
  const detected = firstNonEmptyFont(fontFamilyCss);
  const normalized = normalizeFontName(detected);
  const key = (normalized || '').toLowerCase();

  if (GOOGLE_FONTS_KNOWN.has(key)) {
    return {
      detected, resolved: normalized, source: 'google-fonts',
      url: googleFontsUrl([{ name: normalized, weights }]),
      fallbackStack: `'${normalized}', ${fallbackGeneric}`,
      note: 'already a Google Font, reused directly, zero licensing risk',
      derived: false,
    };
  }
  if (WEB_SAFE_FONTS[key]) {
    const upgrade = WEB_SAFE_FONTS[key].qualityUpgrade;
    return {
      detected, resolved: upgrade, source: 'google-fonts',
      url: googleFontsUrl([{ name: upgrade, weights }]),
      fallbackStack: `'${upgrade}', '${detected}', ${fallbackGeneric}`,
      note: 'web-safe/system font, legally fine as-is, substituted for quality per Thread 1\'s typography bar',
      derived: true,
    };
  }
  if (COMMERCIAL_FONT_MAP[key]) {
    const entry = COMMERCIAL_FONT_MAP[key];
    return {
      detected, resolved: entry.resolved, source: 'google-fonts',
      url: googleFontsUrl([{ name: entry.resolved, weights }]),
      fallbackStack: `'${entry.resolved}', ${fallbackGeneric}`,
      note: `licensed/not redistributable, substituted per commercial-font table (category: ${entry.category})`,
      derived: true,
    };
  }

  // Not in either table: unknown provenance, treated as commercial-unsafe by
  // default (never assume a redistribution right we haven't confirmed) and
  // resolved via the project's own vetted shortlist by guessed category.
  const category = guessCategoryFromFallbackChain(fontFamilyCss);
  const fallback = PROJECT_SHORTLIST[category] || PROJECT_SHORTLIST.sans;
  return {
    detected, resolved: fallback, source: 'google-fonts',
    url: googleFontsUrl([{ name: fallback, weights }]),
    fallbackStack: `'${fallback}', ${fallbackGeneric}`,
    note: `unknown font provenance ("${detected}", normalized "${normalized}") - not in the web-safe or commercial-substitution table, treated as unsafe-to-redistribute by default and substituted from this project's vetted shortlist by guessed category (${category})`,
    derived: true,
  };
}

module.exports = {
  PROJECT_SHORTLIST, WEB_SAFE_FONTS, GOOGLE_FONTS_KNOWN, COMMERCIAL_FONT_MAP,
  normalizeFontName, firstNonEmptyFont, guessCategoryFromFallbackChain,
  googleFontsUrl, resolveFont,
};
