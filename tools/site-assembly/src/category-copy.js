// Deterministic, category-driven copy defaults - not an LLM call. Thread 1's
// architecture note ("deterministic script, not LLM improvisation") is about
// factual/structural content; Thread 2's own Content Input table explicitly
// allows the hero headline to be LLM-generated from the client's prompt.
// This assembly pass doesn't wire a second LLM subprocess into the pipeline
// it's replacing one for - these are clearly-generic per-category template
// defaults, disclosed as such in meta.json, meant to be replaced by real
// client copy (LLM-assisted or otherwise) before a site ships, not final
// copywriting.
//
// Structural fields (primaryAction, genericServices) follow Thread 2's own
// per-category variant table (vault/Projects/Website Generator.md, Thread 2
// > Per-category variant table) directly - those aren't placeholders, they're
// the approved architecture.

const CATEGORY_COPY = {
  'food-beverage': {
    headline: 'Fresh. Local. Unforgettable.',
    subhead: 'See what\'s waiting for you - keep scrolling.',
    ctaLabel: 'Reserve a Table',
    primaryAction: 'Reservation/order link, click-to-call',
    genericServices: ['Dine-In', 'Takeout', 'Catering', 'Private Events'],
  },
  'construction-trades': {
    headline: 'Built Right. Built to Last.',
    subhead: 'Quality craftsmanship, on time and on budget - keep scrolling to see the work.',
    ctaLabel: 'Get a Free Quote',
    primaryAction: 'Quote-request form + click-to-call',
    genericServices: ['New Installation', 'Repairs', 'Inspections', 'Free Estimates'],
  },
  'retail-product': {
    headline: 'Crafted to Last.',
    subhead: 'Take a closer look - keep scrolling.',
    ctaLabel: 'Shop Now',
    primaryAction: 'Shop/contact link',
    genericServices: ['New Arrivals', 'Bestsellers', 'Gift Cards'],
  },
  'real-estate-hospitality': {
    headline: 'Step Inside.',
    subhead: 'Take the tour - keep scrolling.',
    ctaLabel: 'Schedule a Tour',
    primaryAction: 'Schedule tour/book',
    genericServices: ['Availability', 'Amenities', 'Location'],
  },
  'gyms-fitness': {
    headline: 'Your Next Chapter Starts Here.',
    subhead: 'See the space - keep scrolling.',
    ctaLabel: 'Book a Free Trial',
    primaryAction: 'Book a class / free trial',
    genericServices: ['Group Classes', 'Personal Training', 'Open Gym', 'Free Trial'],
  },
  'beauty-personal-care': {
    headline: 'Look Your Best.',
    subhead: 'See the transformation - keep scrolling.',
    ctaLabel: 'Book Now',
    primaryAction: 'Book appointment + click-to-call',
    genericServices: ['Haircut', 'Styling', 'Treatments', 'Consultations'],
  },
  'health-dental-general': {
    headline: 'Care You Can Trust.',
    subhead: 'Take a look around - keep scrolling.',
    ctaLabel: 'Book an Appointment',
    primaryAction: 'Book appointment + click-to-call',
    genericServices: ['Checkups', 'Cleanings', 'New Patients Welcome'],
  },
  'health-dental-cosmetic': {
    headline: 'See the Difference.',
    subhead: 'Real results, real transformation - keep scrolling.',
    ctaLabel: 'Book a Consultation',
    primaryAction: 'Book appointment + click-to-call',
    genericServices: ['Consultations', 'Treatment Plans', 'Financing Available'],
  },
  'professional-services-saas': {
    headline: 'Clarity, From Day One.',
    subhead: 'See how it works - keep scrolling.',
    ctaLabel: 'Request a Demo',
    primaryAction: 'Contact/demo-request form',
    genericServices: ['Consultations', 'Case Studies', 'Get in Touch'],
  },
};

function getCategoryCopy(categorySlug) {
  return CATEGORY_COPY[categorySlug] || null;
}

module.exports = { CATEGORY_COPY, getCategoryCopy };
