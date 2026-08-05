// Category -> Thread 3 archetype mapping, per the vault note's per-category
// variant table (Thread 2, 2026-08-05) and the dental/medical resolution
// (general/family -> FLYTHROUGH, cosmetic-leaning -> TRANSFORM). Thread 1
// only needs to emit `archetype.recommended` + `.reason`; it doesn't build
// the archetypes themselves (Thread 3, out of scope here).
//
// `category` is a client-declared/intake field, not something scraped from
// the site (a business's own category isn't reliably readable from its
// markup) - callers pass it in alongside the source URL.

const CATEGORY_ARCHETYPE = {
  'food-beverage': { archetype: 'REVEAL', label: 'Food & Beverage (restaurant, cafe, bakery)' },
  'construction-trades': { archetype: 'ASSEMBLE', label: 'Construction & Trades (roofer, contractor, plumber)' },
  'retail-product': { archetype: 'SPIN', label: 'Retail & Product (boutique, manufacturer)' },
  'real-estate-hospitality': { archetype: 'FLYTHROUGH', label: 'Real Estate & Hospitality (agent, hotel, venue)' },
  'gyms-fitness': { archetype: 'FLYTHROUGH', label: 'Gyms & Fitness Studios' },
  'beauty-personal-care': { archetype: 'TRANSFORM', label: 'Beauty & Personal Care (salon, spa)' },
  // Dental/medical isn't one archetype (2026-08-05 resolution): general/family
  // practice -> FLYTHROUGH (calm environment tour, addresses appointment
  // anxiety); cosmetic/aesthetic practice -> TRANSFORM (a real before/after
  // story). Category slug carries the split explicitly rather than guessing.
  'health-dental-general': { archetype: 'FLYTHROUGH', label: 'Health & Dental (general/family practice)' },
  'health-dental-cosmetic': { archetype: 'TRANSFORM', label: 'Health & Dental (cosmetic/aesthetic practice)' },
  'professional-services-saas': { archetype: 'INTERFACE', label: 'Professional Services & SaaS (law, consulting, agency, software)' },
};

function recommendArchetype(category) {
  const key = (category || '').toLowerCase().trim();
  const entry = CATEGORY_ARCHETYPE[key];
  if (entry) {
    return {
      recommended: entry.archetype,
      reason: `category: ${key}, per Thread 3 archetype-to-category mapping (${entry.label})`,
    };
  }
  return {
    recommended: null,
    reason: `category "${category || '(none supplied)'}" does not match a known category slug - ` +
      `valid slugs: ${Object.keys(CATEGORY_ARCHETYPE).join(', ')}. Flagged for manual archetype ` +
      `assignment rather than guessed.`,
  };
}

module.exports = { CATEGORY_ARCHETYPE, recommendArchetype };
