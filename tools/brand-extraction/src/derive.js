// The Derivation Layer (vault note, added 2026-08-05 per walking-skeleton
// findings). Turns raw extraction output into the seven locked color roles,
// with defined fallback behavior for every role that extraction can fail to
// produce - the gap the walking skeleton hit (a null role with no documented
// fallback, `surface` collapsing onto `background`).
//
// Every returned role carries { value, source, derived, confidence }.
// `derived: true` marks a computed/fallback value; `derived: false` marks a
// fact read directly off the site (even if downgraded-confidence).

const { parseColor, toHex, shade, colorsRoughlyEqual, deriveDistinctLightness, isNearWhite } = require('./color-utils');

const FIXED_DARK_NEUTRAL = { r: 0x1a, g: 0x1a, b: 0x1a }; // #1A1A1A

// Does any CSS custom property look like it's naming this role, and is its
// value usable? Used only as a fallback signal when the structural selector
// itself found nothing - per Thread 1, a variable being *named* "primary"
// doesn't guarantee it's dominant, so this is never preferred over a real
// structural match, only used when structural extraction is empty.
function findCustomPropForRole(customProperties, roleNames) {
  if (!customProperties) return null;
  for (const [name, entry] of Object.entries(customProperties)) {
    const shortName = name.replace(/^--/, '').replace(/^(color-|brand-)/, '');
    if (roleNames.includes(shortName) || roleNames.some((r) => name.includes(r))) {
      const rgb = parseColor(entry.normalized);
      if (rgb) return { rgb, propName: name, raw: entry.raw };
    }
  }
  return null;
}

function crossCheckConfirmed(customPropertyCrossCheck, propName) {
  return !!(customPropertyCrossCheck && customPropertyCrossCheck[propName] && customPropertyCrossCheck[propName].confirmedByStructuralMatch);
}

// Is a directly-extracted structural value (header or cta) independently
// confirmed by a CSS custom property? Per Thread 1's validation spike, this
// is "the single strongest signal measured" when present - it should upgrade
// confidence even on the common path (header/CTA found directly), not only
// inside the no-structural-match fallback branch.
function anyCrossCheckConfirms(customPropertyCrossCheck, target) {
  if (!customPropertyCrossCheck) return null;
  for (const [propName, entry] of Object.entries(customPropertyCrossCheck)) {
    if (entry.confirmedByStructuralMatch && entry.matchedAgainst === target) return propName;
  }
  return null;
}

function deriveColors(raw) {
  const out = {};
  const cross = raw.customPropertyCrossCheck || {};

  // ---- primary (header) ----
  if (raw.color.header) {
    const rgb = parseColor(raw.color.header);
    const confirmedBy = anyCrossCheckConfirms(cross, 'header');
    out.primary = {
      value: toHex(rgb),
      source: confirmedBy ? `${raw.confidence.header.note}; independently confirmed by CSS custom property ${confirmedBy}` : raw.confidence.header.note,
      derived: false,
      confidence: confirmedBy ? 'high' : raw.confidence.header.level,
    };
  } else {
    const propMatch = findCustomPropForRole(raw.customProperties, ['primary', 'brand', 'brand-color']);
    if (propMatch) {
      out.primary = {
        value: toHex(propMatch.rgb),
        source: `derived: no header/nav background found; used CSS custom property ${propMatch.propName} as fallback signal`,
        derived: false,
        confidence: crossCheckConfirmed(cross, propMatch.propName) ? 'high' : 'medium',
      };
    } else {
      out.primary = {
        value: toHex(FIXED_DARK_NEUTRAL),
        source: 'derived: no header/nav element, no custom property, and no image-sample fallback found anything usable; fixed dark neutral fallback per Derivation Layer rule',
        derived: true,
        confidence: 'low',
      };
    }
  }
  const primaryRgb = parseColor(out.primary.value);

  // ---- secondary (footer) ----
  if (raw.color.footer) {
    const rgb = parseColor(raw.color.footer);
    out.secondary = {
      value: toHex(rgb), source: raw.confidence.footer.note, derived: false,
      confidence: raw.confidence.footer.level,
    };
  } else {
    const shaded = shade(primaryRgb, 0.40);
    out.secondary = {
      value: toHex(shaded),
      source: 'derived: no distinct footer background found; primary shaded 40% darker per Derivation Layer rule',
      derived: true,
      confidence: 'low',
    };
  }

  // ---- accent (CTA) ----
  const cta = raw.color.cta;
  const ctaBgRgb = cta && cta.backgroundColor ? parseColor(cta.backgroundColor) : null;
  // A low-alpha fill (e.g. a `.btn--ghost` class using rgba(255,255,255,0.08)
  // as a hover-tint, not a real background) is functionally the same "no fill
  // to extract" case as a literally transparent background - checking only
  // the literal `rgba(0, 0, 0, 0)` string missed this and silently reported
  // the raw channel color (often white) as if it were a real, confident fill.
  const ctaHasRealFill = ctaBgRgb && (ctaBgRgb.a === undefined || ctaBgRgb.a >= 0.5);
  if (cta && ctaHasRealFill) {
    const rgb = ctaBgRgb;
    const confirmedBy = anyCrossCheckConfirms(cross, 'cta');
    out.accent = {
      value: toHex(rgb),
      source: confirmedBy
        ? `CTA button background, computed ("${cta.text}", score ${cta.score.toFixed(1)}); independently confirmed by CSS custom property ${confirmedBy}`
        : `CTA button background, computed ("${cta.text}", score ${cta.score.toFixed(1)})`,
      derived: false,
      confidence: confirmedBy ? 'high' : raw.confidence.cta.level,
    };
  } else if (cta) {
    // Found a real, on-topic CTA-shaped element, but it has no fill to
    // extract (an outlined/"ghost" button) - the "found something dubious"
    // case, distinct from "nothing found". Per Thread 1: this still surfaces
    // for human review rather than silently falling back to primary. Best
    // available proxy: the element's border or text color, since a ghost
    // button typically expresses the brand color there instead of a fill.
    const borderRgb = cta.borderColor ? parseColor(cta.borderColor) : null;
    const textRgb = cta.color ? parseColor(cta.color) : null;
    const proxyRgb = (borderRgb && !colorsRoughlyEqual(borderRgb, { r: 0, g: 0, b: 0 }, 3)) ? borderRgb : textRgb;
    if (proxyRgb) {
      out.accent = {
        value: toHex(proxyRgb),
        source: `derived: CTA ("${cta.text}") found but has no fill (outlined/ghost button) - using its ${borderRgb ? 'border' : 'text'} color as a best-available proxy, needs human confirmation`,
        derived: true,
        confidence: 'low',
      };
    } else {
      out.accent = {
        value: out.primary.value,
        source: `derived: CTA ("${cta.text}") found but neither fill, border, nor text color was usable; fell back to primary`,
        derived: true,
        confidence: 'low',
      };
    }
  } else {
    out.accent = {
      value: out.primary.value,
      source: 'derived: no CTA candidate cleared the confidence bar at all (nothing-found case); fell back to primary per Derivation Layer rule',
      derived: true,
      confidence: 'low',
    };
  }

  // ---- text ----
  const textRgb = parseColor(raw.color.text) || { r: 0x1a, g: 0x1a, b: 0x1a };
  out.text = { value: toHex(textRgb), source: raw.confidence.text.note, derived: false, confidence: raw.confidence.text.level };

  // ---- background ----
  const backgroundRgb = parseColor(raw.color.background) || { r: 255, g: 255, b: 255 };
  const backgroundWasNormalized = raw.confidence.background.note.includes('normalized to assumed white');
  out.background = {
    value: toHex(backgroundRgb),
    source: raw.confidence.background.note,
    derived: backgroundWasNormalized,
    confidence: raw.confidence.background.level,
  };

  // ---- surface: ALWAYS derived from background, never extracted directly.
  // Minimum 6% perceptual (HSL) lightness delta, guaranteed regardless of
  // what a fixed tint/shade amount would produce - this is the fix for the
  // surface===background collapse the walking skeleton hit on light sites.
  const surfaceRgb = deriveDistinctLightness(backgroundRgb, 6);
  out.surface = {
    value: toHex(surfaceRgb),
    source: `derived: ${isNearWhite(backgroundRgb) ? 'tint' : 'tint/shade'} of background, minimum 6% perceptual lightness delta`,
    derived: true,
    confidence: 'medium',
  };

  // ---- border: kept as background shaded 10%, unchanged per Derivation Layer note ----
  const borderRgb = shade(backgroundRgb, 0.10);
  out.border = {
    value: toHex(borderRgb),
    source: 'derived: background darkened 10%',
    derived: true,
    confidence: 'medium',
  };

  return out;
}

module.exports = { deriveColors, findCustomPropForRole, FIXED_DARK_NEUTRAL };
