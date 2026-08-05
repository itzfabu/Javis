// Color math shared across extraction, derivation, and accessibility resolution.
// Per Thread 1's decision: WCAG 2.x contrast implemented directly, no dependency.

function clamp(v) { return Math.max(0, Math.min(255, v)); }

function parseColor(str) {
  if (!str) return null;
  str = str.trim();
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    if (full.length !== 6) return null;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
}

function toHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbStr({ r, g, b }) { return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`; }

function tint(rgb, amount) { // lighten toward white, amount in [0,1]
  return { r: clamp(rgb.r + (255 - rgb.r) * amount), g: clamp(rgb.g + (255 - rgb.g) * amount), b: clamp(rgb.b + (255 - rgb.b) * amount) };
}
function shade(rgb, amount) { // darken toward black, amount in [0,1]
  return { r: clamp(rgb.r * (1 - amount)), g: clamp(rgb.g * (1 - amount)), b: clamp(rgb.b * (1 - amount)) };
}

// Perceptual lightness (HSL L, 0-100) - used to guarantee the Derivation
// Layer's "minimum 6% perceptual lightness delta" rule for `surface`, rather
// than trusting a fixed RGB tint/shade amount to always produce a visible gap.
function hslLightness({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  return ((max + min) / 2) * 100;
}

function isNearWhite(rgb) { return rgb && rgb.r > 245 && rgb.g > 245 && rgb.b > 245; }
function isNearBlack(rgb) { return rgb && rgb.r < 15 && rgb.g < 15 && rgb.b < 15; }

function colorsRoughlyEqual(a, b, tol = 12) {
  if (!a || !b) return false;
  return Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;
}

// WCAG 2.x relative luminance + contrast ratio (~15 lines, per Thread 1's
// "implement directly" decision - matches the walking skeleton's version,
// confirmed correct there on first try).
function srgbToLinear(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relLuminance(rgb) {
  return 0.2126 * srgbToLinear(rgb.r) + 0.7152 * srgbToLinear(rgb.g) + 0.0722 * srgbToLinear(rgb.b);
}
function contrastRatio(rgb1, rgb2) {
  const L1 = relLuminance(rgb1), L2 = relLuminance(rgb2);
  const lighter = Math.max(L1, L2), darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Derive a color guaranteed to be at least `minDeltaPct` HSL-lightness points
// away from `base`, tinting if base is light-leaning, shading if dark-leaning.
// Walks the tint/shade amount up until the delta is met (or the amount tops
// out at 1.0, for near-white/near-black bases where a fixed 0.5/0.10 amount
// used in the throwaway spike could still collapse the delta).
function deriveDistinctLightness(baseRgb, minDeltaPct, direction) {
  const baseL = hslLightness(baseRgb);
  const goLighter = direction === 'tint' || (direction == null && baseL < 50);
  let amount = 0.06;
  let candidate = goLighter ? tint(baseRgb, amount) : shade(baseRgb, amount);
  let guard = 0;
  while (Math.abs(hslLightness(candidate) - baseL) < minDeltaPct && amount < 1 && guard < 50) {
    amount += 0.04;
    candidate = goLighter ? tint(baseRgb, amount) : shade(baseRgb, amount);
    guard++;
  }
  return candidate;
}

module.exports = {
  parseColor, toHex, rgbStr, tint, shade, hslLightness, isNearWhite, isNearBlack,
  colorsRoughlyEqual, relLuminance, contrastRatio, deriveDistinctLightness, clamp,
};
