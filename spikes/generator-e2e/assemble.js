// Stage 4: assemble the final site from tokens.json (Thread 1) + input.json,
// following Thread 2's skeleton, the resolved native-CSS flipbook hero (with
// mandatory @supports static fallback, reused for mobile per Thread 2's
// decision), and the Web3Forms + mailto + click-to-call form backend decision.
//
// Throwaway spike glue code - not part of the real generator.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const input = JSON.parse(fs.readFileSync(path.join(ROOT, 'input.json'), 'utf8'));
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'out', 'tokens.json'), 'utf8'));

const slug = input.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const siteDir = path.join(ROOT, 'out', 'site', slug);
const assetsDir = path.join(siteDir, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// ---- copy assets ----
const c = tokens.color;
const logoSrc = tokens.logo.assetPath ? tokens.logo._rawDownloadedPath : null;
let logoAssetName = null;
if (logoSrc && fs.existsSync(logoSrc)) {
  logoAssetName = 'logo' + path.extname(logoSrc);
  fs.copyFileSync(logoSrc, path.join(assetsDir, logoAssetName));
}
const FLIPBOOK_DIR = path.join(ROOT, '..', 'flipbook-scrub');
fs.copyFileSync(path.join(FLIPBOOK_DIR, 'spritesheet.png'), path.join(assetsDir, 'hero-spritesheet.png'));
fs.copyFileSync(path.join(FLIPBOOK_DIR, 'frames', 'frame-095.png'), path.join(assetsDir, 'hero-static.png'));

// ---- derive a few page-level values ----
const avgRating = (input.reviews.reduce((s, r) => s + r.rating, 0) / input.reviews.length).toFixed(1);
const accentTextColor = c.accessibility.accentTextOverride.resolution.includes('#FFFFFF') ? '#FFFFFF' : '#000000';
const stars = (n) => '&#9733;'.repeat(Math.round(n)) + '&#9734;'.repeat(5 - Math.round(n));

// Category table from Thread 2: construction & trades -> ASSEMBLE, quote form +
// click-to-call, trust bar (license/insurance) + service-area. No real project
// photos supplied for this fake client, so the category deep-section (gallery)
// is OMITTED per Thread 2's own "never a placeholder" rule - see build report.

const faqs = [
  { q: 'Are you licensed and insured?', a: `Yes - fully licensed (${input.license_number}) and insured for every job we take on in the ${input.service_area}.` },
  { q: 'Do you offer free estimates?', a: 'Yes, every estimate is free and comes with a written scope before any work starts.' },
  { q: 'How long does a typical project take?', a: 'Depends on scope - a deck rebuild might be days, a full addition can run weeks. We give you a realistic timeline at the estimate, not an optimistic one.' },
  { q: 'What areas do you serve?', a: `We serve the ${input.service_area}. If you're not sure you're in range, just call - it takes ten seconds to check.` },
];

const services = [
  'Additions & Second Stories', 'Full & Partial Remodels', 'Deck Design & Rebuilds',
  'Foundation Repair', 'Framing & Structural Work', 'Permit Handling',
];

// ---------------------------------------------------------------------------
const css = `
:root {
  --color-primary: ${c.primary.value};
  --color-secondary: ${c.secondary.value};
  --color-accent: ${c.accent.value};
  --color-accent-text: ${accentTextColor};
  --color-text: ${c.text.value};
  --color-background: ${c.background.value};
  --color-surface: ${c.surface.value};
  --color-border: ${c.border.value};
  --font-heading: ${tokens.typography.heading.fallbackStack};
  --font-body: ${tokens.typography.body.fallbackStack};
  --unit: ${tokens.spacing.unit};
  --radius-sm: ${tokens.spacing.radius.sm};
  --radius-md: ${tokens.spacing.radius.md};
  --radius-lg: ${tokens.spacing.radius.lg};
  /* INVENTED (not in Thread 1's schema): distinct panel tint. tokens.color.surface
     came back IDENTICAL to background (both #ffffff) for this light-background
     site, per extract2.js's own derivation rule (isNearWhite -> surface = pure
     white, not a tint). That makes alternating-section separation impossible
     using the token as-is, so this build invents its own light gray here
     instead of trusting the token. Flagged in the breakage report. */
  --color-panel: #f4f5f7;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-background);
  line-height: 1.55;
}
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.15; }
a { color: inherit; }
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.btn {
  display: inline-block; padding: 14px 28px; border-radius: var(--radius-md);
  font-weight: 700; text-decoration: none; border: none; cursor: pointer; font-size: 1rem;
}
.btn-call {
  background: var(--color-accent); color: var(--color-accent-text);
}
.btn-outline {
  background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary);
}

/* ---- header ---- */
.site-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--unit) 0; background: var(--color-primary); color: #fff;
}
.site-header .container { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand img { height: 36px; }
.brand-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.2rem; color: #fff; }
.header-call { color: #fff; font-weight: 700; text-decoration: none; font-size: 1.05rem; }

/* ---- hero: native CSS scroll-scrub, mandatory static base state ----
   Base/unconditional state = the fully-assembled static frame. EVERY browser
   gets this by default - Firefox (no animation-timeline support) AND mobile
   (Thread 2 decision: reuse the same static fallback, don't run the scrub). */
.hero-track { position: relative; }
.hero-sticky {
  height: 78vh; min-height: 460px; display: flex; align-items: flex-end;
  justify-content: center; position: relative; overflow: hidden;
  background-image: url('assets/hero-static.png');
  background-size: cover; background-position: center;
}
.hero-overlay {
  position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55));
}
.hero-content { position: relative; z-index: 2; color: #fff; text-align: center; padding: 48px 24px; max-width: 720px; }
.hero-content h1 { font-size: clamp(2.1rem, 5vw, 3.25rem); margin-bottom: 12px; }
.hero-content p { font-size: 1.15rem; margin-bottom: 24px; opacity: 0.95; }
.hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* Enhanced state: ONLY when the browser supports scroll-driven animations AND
   viewport is wide enough (Thread 2: mobile stays on the static path even in
   Chrome/Safari - this isn't a Firefox-only fallback, it's a deliberate
   default for every small viewport). */
@supports (animation-timeline: scroll()) {
  @media (min-width: 769px) {
    /* REAL BUG FOUND AND WORKED AROUND HERE, disclosed in the breakage report:
       the flipbook-scrub spike proved this technique at a fixed 400x600 box
       exactly one-frame-wide. Stretched across a full-bleed hero (this box is
       ~1440px wide), background-size at the sprite's true native pixel size
       (38400x600, unscaled) lets several adjacent 400px-wide frames show
       through side-by-side instead of one - confirmed by screenshotting this
       exact page before this fix (frames 047/048/049 visible simultaneously).
       Workaround: keep the animated sprite at its proven native scale as a
       centered element WITHIN the hero, instead of stretching it full-bleed.
       Not a real fix - Thread 3 (real per-client frame generation, presumably
       at hero resolution) hasn't been researched yet. */
    .hero-track { height: 500vh; }
    .hero-sticky {
      position: sticky; top: 0; height: 100vh; min-height: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px;
      background-image: none; background-color: var(--color-secondary);
    }
    .hero-sticky .hero-overlay { display: none; }
    .hero-sticky .hero-content { position: static; order: 2; }
    .hero-sticky::before {
      order: 1;
      content: ''; display: block; width: 400px; height: 600px;
      background-image: url('assets/hero-spritesheet.png');
      background-repeat: no-repeat;
      background-size: 38400px 600px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.5);
      animation: scrub-tower steps(95, jump-none) both;
      animation-timeline: scroll(root block);
    }
    @keyframes scrub-tower {
      from { background-position-x: 0px; }
      to   { background-position-x: -38000px; }
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-sticky { animation: none !important; background-image: url('assets/hero-static.png') !important; background-size: cover !important; }
}

/* ---- trust bar ---- */
.trust-bar { background: var(--color-panel); border-bottom: 1px solid var(--color-border); padding: 14px 0; }
.trust-bar .container { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; font-size: 0.92rem; font-weight: 600; }
.trust-bar .stars { color: var(--color-accent); }

/* ---- generic section ---- */
section { padding: 64px 0; }
section.alt { background: var(--color-panel); }
.section-title { text-align: center; font-size: 2rem; margin-bottom: 8px; }
.section-sub { text-align: center; color: #555; margin-bottom: 40px; }

.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--unit); }
.service-card {
  background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md);
  padding: 24px; font-weight: 700; font-family: var(--font-heading); font-size: 1.1rem;
  border-top: 4px solid var(--color-accent);
}

.reviews-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--unit); }
.review-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 24px; }
.review-card .stars { color: var(--color-accent); margin-bottom: 8px; display: block; }
.review-card .author { font-weight: 700; margin-top: 12px; display: block; }

.faq-item { border-bottom: 1px solid var(--color-border); padding: 16px 0; }
.faq-item summary { font-weight: 700; cursor: pointer; font-family: var(--font-heading); font-size: 1.05rem; }
.faq-item p { margin-top: 10px; color: #444; }

/* ---- contact / conversion ---- */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
@media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }
.call-panel {
  background: var(--color-primary); color: #fff; border-radius: var(--radius-lg);
  padding: 32px; text-align: center;
}
.call-panel .btn-call { font-size: 1.3rem; margin-top: 16px; }
.contact-form { display: flex; flex-direction: column; gap: 12px; }
.contact-form input, .contact-form select, .contact-form textarea {
  padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); font: inherit;
}
.contact-form button { margin-top: 4px; }
.form-fallback { font-size: 0.9rem; color: #555; margin-top: 4px; }

/* ---- footer ---- */
footer { background: #16181d; color: #cfd3da; padding: 40px 0 90px 0; font-size: 0.92rem; }
footer .container { display: flex; flex-wrap: wrap; gap: 32px; justify-content: space-between; }
footer a { color: #fff; }

/* ---- sticky mobile call bar: default ON for call/book categories (Thread 2) ---- */
.sticky-call-bar {
  display: none;
}
@media (max-width: 768px) {
  .sticky-call-bar {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: var(--color-accent); color: var(--color-accent-text);
    padding: 14px; justify-content: center; font-weight: 700; text-decoration: none; font-size: 1.05rem;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
  }
}
`;

const headerHtml = `
<header class="site-header">
  <div class="container">
    <div class="brand">
      ${logoAssetName ? `<img src="assets/${logoAssetName}" alt="${input.business_name} logo">` : ''}
      <span class="brand-name">${input.business_name}</span>
    </div>
    <a class="header-call" href="tel:${input.phone_tel}">&#128222; ${input.phone}</a>
  </div>
</header>`;

const heroHtml = `
<div class="hero-track">
  <div class="hero-sticky">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>${input.business_name}</h1>
      <p>${input.description}</p>
      <div class="hero-ctas">
        <a class="btn btn-call" href="tel:${input.phone_tel}">Call Now: ${input.phone}</a>
        <a class="btn btn-outline" href="#contact" style="color:#fff;border-color:#fff;">Get a Free Estimate</a>
      </div>
    </div>
  </div>
</div>`;

const trustBarHtml = `
<div class="trust-bar">
  <div class="container">
    <span><span class="stars">${stars(avgRating)}</span> ${avgRating} (${input.reviews.length} reviews)</span>
    <span>${input.years_in_business}+ years in business</span>
    <span>Licensed &amp; insured (${input.license_number})</span>
    <span>Serving ${input.service_area}</span>
  </div>
</div>`;

const servicesHtml = `
<section id="services">
  <div class="container">
    <h2 class="section-title">What We Do</h2>
    <p class="section-sub">Full-service construction, start to finish.</p>
    <div class="services-grid">
      ${services.map((s) => `<div class="service-card">${s}</div>`).join('\n      ')}
    </div>
  </div>
</section>`;

const reviewsHtml = `
<section class="alt" id="reviews">
  <div class="container">
    <h2 class="section-title">What Clients Say</h2>
    <div class="reviews-grid">
      ${input.reviews.map((r) => `<div class="review-card">
        <span class="stars">${stars(r.rating)}</span>
        <p>"${r.text}"</p>
        <span class="author">${r.author}</span>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`;

// NOTE: Thread 2's category table calls for a category-conditional deep
// section here (project gallery / before-after) for construction & trades.
// DELIBERATELY OMITTED: no real client-supplied project photos exist for this
// fake client, and Thread 2's own rule says no stock-photo/placeholder filler
// - real content or no section, never a placeholder. See breakage report.

const faqHtml = `
<section id="faq">
  <div class="container">
    <h2 class="section-title">Common Questions</h2>
    ${faqs.map((f) => `<details class="faq-item">
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join('\n    ')}
  </div>
</section>`;

const contactHtml = `
<section class="alt" id="contact">
  <div class="container">
    <h2 class="section-title">Get Your Free Estimate</h2>
    <p class="section-sub">Call now, or send us the details and we'll call you back.</p>
    <div class="contact-grid">
      <div class="call-panel">
        <p style="font-size:1.1rem;">Fastest way to reach us:</p>
        <a class="btn btn-call" href="tel:${input.phone_tel}">&#128222; ${input.phone}</a>
        <p style="margin-top:16px;font-size:0.9rem;opacity:0.85;">${input.hours.join(' &middot; ')}</p>
      </div>
      <form class="contact-form" action="https://api.web3forms.com/submit" method="POST">
        <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY_HERE">
        <input type="hidden" name="subject" value="New lead from ${input.business_name} website">
        <input type="text" name="name" placeholder="Your name" required>
        <input type="tel" name="phone" placeholder="Phone number" required>
        <select name="job_type" required>
          <option value="">What do you need? (select one)</option>
          <option>New addition</option>
          <option>Remodel</option>
          <option>Deck</option>
          <option>Foundation repair</option>
          <option>Other</option>
        </select>
        <textarea name="message" placeholder="Tell us a bit about the project" rows="3"></textarea>
        <button type="submit" class="btn btn-call">Get My Free Estimate</button>
        <p class="form-fallback">Form backend is a PLACEHOLDER access key (per the Thread 2 decision: Web3Forms now, self-hosted later) - this will not actually deliver a submission. Prefer email? Reach us directly at <a href="mailto:${input.email}">${input.email}</a></p>
      </form>
    </div>
  </div>
</section>`;

const footerHtml = `
<footer>
  <div class="container">
    <div>
      <strong style="color:#fff;">${input.business_name}</strong><br>
      ${input.address}<br>
      <a href="tel:${input.phone_tel}">${input.phone}</a> &middot; <a href="mailto:${input.email}">${input.email}</a>
    </div>
    <div>
      <strong style="color:#fff;">Hours</strong><br>
      ${input.hours.join('<br>')}
    </div>
    <div>
      <strong style="color:#fff;">Service Area</strong><br>
      ${input.service_area}<br>
      Licensed &amp; insured: ${input.license_number}
    </div>
  </div>
</footer>
<a class="sticky-call-bar" href="tel:${input.phone_tel}">&#128222; Call Now: ${input.phone}</a>`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${input.business_name} - ${input.service_area} General Contractor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="${tokens.typography.heading.url}" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
${headerHtml}
${heroHtml}
${trustBarHtml}
${servicesHtml}
${reviewsHtml}
${faqHtml}
${contactHtml}
${footerHtml}
</body>
</html>
`;

fs.writeFileSync(path.join(siteDir, 'index.html'), html);
fs.writeFileSync(path.join(siteDir, 'styles.css'), css);
fs.copyFileSync(path.join(ROOT, 'out', 'tokens.json'), path.join(siteDir, 'tokens.json'));

const meta = {
  business_name: input.business_name,
  slug,
  prompt_used: input.description,
  reviews_used: input.reviews.length,
  created_date: new Date().toISOString().slice(0, 10),
  status: 'draft',
  client_contact: input.email,
  price: null,
  license_type: null,
  _spike_note: 'Walking-skeleton output, C:\\Jarvis\\spikes\\generator-e2e - throwaway, not a real client deliverable.',
};
fs.writeFileSync(path.join(siteDir, 'meta.json'), JSON.stringify(meta, null, 2));

console.log('Wrote site to: ' + siteDir);
console.log('Open: ' + path.join(siteDir, 'index.html'));
