// Assembles index.html/styles.css/script.js from Thread 1 tokens + Thread 3
// sprite output + category copy - the deterministic replacement for
// orb/app.py's LLM-freeform HTML generation. Structure mirrors
// generated-sites/birds-barbershop/ (the hand-built first pass): nav with
// gated logo, a static hero-intro section (never sharing the sticky sprite
// box - that overflowed on the hand-built page), Thread 3's snippet.css/
// snippet.html dropped in unmodified except the sprite path, a generic
// category-driven services section, a contact section wired to Web3Forms
// when an access key is provided, a minimal footer. Every section requiring
// a fact this pipeline doesn't have (trust bar, social proof, gallery, NAP)
// is omitted and recorded in meta.json's known_gaps - never fabricated.

const EXTRA_FIELD_BY_CATEGORY = {
  'construction-trades': { label: 'Job Type', options: ['New Installation', 'Repair', 'Inspection', 'Other'] },
  'health-dental-general': { label: 'New or Existing Patient?', options: ['New Patient', 'Existing Patient'] },
  'health-dental-cosmetic': { label: 'New or Existing Patient?', options: ['New Patient', 'Existing Patient'] },
};

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildIndexHtml({ businessName, categoryCopy, heroSnippetHtml, logoFilename, web3formsAccessKey, extraField, servicesList }) {
  const nav = logoFilename
    ? `<img src="assets/${escapeHtml(logoFilename)}" alt="${escapeHtml(businessName)}" class="brand-logo">\n  <span class="brand-name">${escapeHtml(businessName)}</span>`
    : `<span class="brand-name">${escapeHtml(businessName)}</span>`;

  const formActionAttrs = web3formsAccessKey
    ? `action="https://api.web3forms.com/submit" method="POST"`
    : `action="#" onsubmit="return false;"`;
  const web3formsHiddenFields = web3formsAccessKey
    ? `<input type="hidden" name="access_key" value="${escapeHtml(web3formsAccessKey)}">\n      <input type="hidden" name="subject" value="New booking request - ${escapeHtml(businessName)}">`
    : '';
  const extraFieldHtml = extraField
    ? `<label>${escapeHtml(extraField.label)}<select name="detail">${extraField.options.map((o) => `<option>${escapeHtml(o)}</option>`).join('')}</select></label>\n      `
    : '';
  const formGapComment = web3formsAccessKey
    ? ''
    : `<p class="section-note">This form isn't wired to a live destination yet - no Web3Forms access key was provided for this generation. It will submit nowhere until one is.</p>\n    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(businessName)}</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>

<header class="site-header">
  <a class="brand" href="#top">
  ${nav}
  </a>
  <a class="btn btn-accent nav-cta" href="#contact">${escapeHtml(categoryCopy.ctaLabel)}</a>
</header>

<section class="hero-intro" id="top">
  <h1>${escapeHtml(businessName)}</h1>
  <p class="hero-sub">${escapeHtml(categoryCopy.subhead)}</p>
  <a class="btn btn-accent hero-cta" href="#contact">${escapeHtml(categoryCopy.ctaLabel)}</a>
</section>

<div class="hero-track">
  <div class="hero-sticky">
    <!-- Thread 3 output, dropped in unmodified except the sprite.webp path (fixture-relative -> assets/) -->
    ${heroSnippetHtml}
  </div>
</div>

<main>
  <section class="services" id="services">
    <h2>Services</h2>
    <p class="section-note">Menu below, generated from the business category - confirm exact offerings and pricing before this page goes live.</p>
    <div class="service-grid">
      ${servicesList.map((s) => `<div class="card">${escapeHtml(s)}</div>`).join('\n      ')}
    </div>
  </section>

  <!--
    Trust bar, social proof, and the category-conditional gallery are
    omitted, not forgotten: this pipeline's Thread 1 extraction captures
    design tokens (color/font/logo) but no intake-form facts (years in
    business, reviews, before/after photos, NAP). Per Thread 2's own rule,
    these are client-supplied or omitted - never fabricated, especially not
    for a real business. See meta.json's known_gaps.
  -->

  <section class="contact" id="contact">
    <h2>${escapeHtml(categoryCopy.ctaLabel)}?</h2>
    ${formGapComment}<form class="contact-form" ${formActionAttrs}>
      ${web3formsHiddenFields}
      <label>Name<input type="text" name="name" autocomplete="name" required></label>
      <label>Phone<input type="tel" name="phone" autocomplete="tel" required></label>
      ${extraFieldHtml}<label>What do you need?<textarea name="message" rows="3"></textarea></label>
      <button type="submit" class="btn btn-accent">${escapeHtml(categoryCopy.ctaLabel)}</button>
    </form>
  </section>
</main>

<footer class="site-footer">
  <span class="brand-name">${escapeHtml(businessName)}</span>
</footer>

<script src="script.js"></script>
</body>
</html>
`;
}

function buildStylesCss({ tokens, fontsCss, headingWeight, heroSnippetCss, heroTrackBg }) {
  const c = tokens.color;
  return `/* Assembled by tools/site-assembly - Thread 1 tokens + Thread 3 sprite + category copy. */

${fontsCss}

:root {
  --color-primary: ${c.primary.value};
  --color-secondary: ${c.secondary.value};
  --color-accent: ${c.accent.value};
  --color-accent-text: ${c.accessibility.accentTextOverride ? c.accessibility.accentTextOverride.textColor : '#FFFFFF'};
  --color-text: ${c.text.value};
  --color-background: ${c.background.value};
  --color-surface: ${c.surface.value};
  --color-border: ${c.border.value};

  --font-heading: '${tokens.typography.heading.resolved}', sans-serif;
  --font-body: '${tokens.typography.body.resolved}', sans-serif;

  --h1: ${tokens.typography.scale.h1};
  --h2: ${tokens.typography.scale.h2};
  --h3: ${tokens.typography.scale.h3};
  --body: ${tokens.typography.scale.body};
  --small: ${tokens.typography.scale.small};

  --space: 8px;
  --radius-sm: ${tokens.spacing.radius.sm};
  --radius-md: ${tokens.spacing.radius.md};
  --radius-lg: ${tokens.spacing.radius.lg};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-body);
  font-size: var(--body);
  color: var(--color-text);
  background: var(--color-background);
  line-height: 1.5;
}

h1, h2, h3 { font-family: var(--font-heading); font-weight: ${headingWeight}; line-height: 1.15; }
h1 { font-size: var(--h1); }
h2 { font-size: var(--h2); margin-bottom: calc(var(--space) * 2); }
h3 { font-size: var(--h3); }

.btn {
  display: inline-block;
  font-family: var(--font-body);
  font-weight: 600;
  padding: calc(var(--space) * 1.5) calc(var(--space) * 3);
  border-radius: var(--radius-md);
  text-decoration: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
}
/* border above is defensive, not decorative: found generating a second real
   site (Grace Family Roofing) whose extracted accent color is #FFFFFF,
   identical to its background - a real Thread 1 extraction-quality issue,
   not a template bug - which made every button invisible (no visible
   boundary, even though its text-on-accent contrast technically passes AA).
   A visible border keeps the button legible as a shape regardless of how
   degenerate the accent/background pairing turns out to be for a given
   client, without guessing a "better" color Thread 1 didn't actually find. */
.btn-accent { background: var(--color-accent); color: var(--color-accent-text); }

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--space) * 2) calc(var(--space) * 3);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  position: relative;
  z-index: 2;
}
.brand { display: flex; align-items: center; gap: var(--space); text-decoration: none; color: var(--color-text); }
.brand-logo { height: 36px; width: auto; border-radius: var(--radius-sm); object-fit: cover; }
.brand-name { font-family: var(--font-heading); font-size: 1.1rem; }
.nav-cta { font-size: var(--small); padding: var(--space) calc(var(--space) * 2); }

/* Hero intro copy sits OUTSIDE .hero-sticky - sharing that 100vh box with
   the sprite overflowed on the hand-built Birds Barbershop page (the
   sprite alone runs up to ~800px tall at its own sizing rule). */
.hero-intro {
  text-align: center;
  padding: calc(var(--space) * 8) calc(var(--space) * 3) calc(var(--space) * 6);
  max-width: 640px;
  margin: 0 auto;
}
.hero-sub { font-size: 1.15rem; margin: calc(var(--space) * 2) 0; color: var(--color-secondary); }
.hero-cta { font-size: 1.05rem; }

.hero-track {
  height: 500vh;
  position: relative;
  background-color: ${heroTrackBg};
}
.hero-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: calc(var(--space) * 3);
}

@media print {
  .hero-track { height: 100vh !important; }
  .hero-sticky { position: static !important; }
}

${heroSnippetCss}

main { max-width: 900px; margin: 0 auto; padding: calc(var(--space) * 6) calc(var(--space) * 3); }
.section-note { color: var(--color-secondary); font-size: var(--small); margin-bottom: calc(var(--space) * 3); }

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: calc(var(--space) * 2);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: calc(var(--space) * 3);
  font-weight: 600;
  text-align: center;
}

.contact { margin-top: calc(var(--space) * 6); }
.contact-form { display: flex; flex-direction: column; gap: calc(var(--space) * 2); max-width: 420px; }
.contact-form label { display: flex; flex-direction: column; gap: var(--space); font-size: var(--small); font-weight: 600; }
.contact-form input, .contact-form select, .contact-form textarea {
  font-family: var(--font-body);
  font-size: var(--body);
  padding: var(--space) calc(var(--space) * 1.5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-text);
}
.contact-form button { align-self: flex-start; margin-top: var(--space); }

.site-footer { padding: calc(var(--space) * 4); text-align: center; background: var(--color-accent); color: var(--color-accent-text); }
.site-footer .brand-name { font-family: var(--font-heading); }
`;
}

const SCRIPT_JS = `// The scroll-scrubbed hero needs zero JS (background-position + steps() +
// animation-timeline: scroll()). Nothing else on this generated page needs
// client-side behavior.
`;

module.exports = { buildIndexHtml, buildStylesCss, SCRIPT_JS, EXTRA_FIELD_BY_CATEGORY, escapeHtml };
