---
date: 2026-07-30
updated: 2026-07-30
type: project
status: active
tags:
  - project
related-people: []
related-projects: ["[[Projects/Jarvis System]]"]
job:
repo:
ai-first: true
---

# Website Generator

## For future Claude

Graduated from [[Ideas/Website Generator (Landing Pages + Clone-and-Rebuild)]] on 2026-07-30 once
the three open technical questions there were resolved and MVP scope was decided. The Ideas note
holds the full background — market landscape, clone-mode legal guardrails, design vocabulary, and
sourced research — and is not repeated here. This Project note tracks build state going forward;
the Ideas note stays as the record of why the idea exists and what was ruled out.

## Overview

Generate a modern landing page from a prompt plus manually-entered Google reviews, outputting
real static HTML/CSS/JS files rather than a templated system — the differentiator identified in
the Ideas note's market research versus platform-locked builders (Wix, Squarespace, Hostinger).
Dual-purpose: building sites for Fabio's own future products, and selling website-generation as a
service to companies across industries. Clone-and-rebuild (paste an existing site, rebrand it for
a different client) is deferred out of MVP scope — different technical problem, and carries the
legal-guardrail judgment already flagged in the Ideas note.

## Key Decisions

- **Google reviews input:** entered manually, not pulled via API — the Places API only surfaces a
  handful of "most relevant" reviews per business, and full access needs the business's own Google
  Business Profile OAuth. Full reasoning: [[Ideas/Website Generator (Landing Pages + Clone-and-Rebuild)]].
- **Output format:** real static HTML/CSS/JS files, not a templated system — proven working today
  via the same approach used to build both the Projects and Background dashboards.
- **MVP scope:** generate-from-prompt only. Clone-and-rebuild deferred.

### Clone-and-Rebuild Scoping (deferred feature — not yet built)

Scoping this now so the eventual build has a clear technical and legal shape, even though MVP
scope above defers actual implementation.

**Reference-site capture method:** fetch the live page's structure and content, then feed a
*summary* of that content into the generation prompt — never pass literal scraped HTML through to
the generator. The output is reconstructed as fresh code from that summary, not a copy-with-
substitutions of the original markup. This is both a technical choice (keeps the pipeline
consistent with generate-from-prompt's real-code-not-templated approach) and a legal one
(reconstructing from a description, rather than literally copying source HTML/CSS, is the same
distinction the Ideas note's clone-tool research draws between legitimate reference-based redesign
and direct copying).
Fetching and summarizing a reference site also opens a prompt-injection surface — the site's own
text is attacker-controlled if the site is hostile or compromised — but this is an accepted,
already-mitigated tradeoff, not an unexamined gap: the generation subprocess is scoped to
`--tools Write` only (no Bash, Read, or network access), so even a successful injection is capped
at writing content inside the job's own output folder, the same blast-radius boundary already
established for the unsanitized business_name/prompt/reviews fields.

**robots.txt compliance:** `validate_reference_url` checks the target site's `robots.txt` (via
`check_robots_txt_allowed`, Python's `urllib.robotparser`) and rejects the request with a clear
error if automated access is disallowed for our user agent. This is a deliberate compliance
decision, not an accident of tooling — `requests` does not consult `robots.txt` on its own, so the
check has to be explicit. A missing or unreachable `robots.txt` fails open (treated as allowed),
matching standard crawler behavior when a site publishes no policy at all.

**Legal guardrail as an actual form field:** the generation form gets a required question — "Is
this the business's own current website?" — with a yes/no answer. If no, a second required field,
"What business is this for?", captures who the output is actually going to. This operationalizes
the legal-guardrail judgment already established in the Ideas note (rebuilding a business's own
site is safe; using another site as a structural/design reference for a *different* client is
normal industry practice; cloning a company's site to hand a lookalike to their direct competitor
is the line not to cross) as a real, answered field on every clone-and-rebuild job, not just a
principle documented in a note nobody checks at generation time.

**`meta.json` additions for clone-and-rebuild jobs:** two new fields, alongside the existing
schema in Output Structure —
- `reference_url` — the site that was used as a reference
- `legal_basis` — `own-site` or `reference-with-rebrand`, recorded from the form answer above

These make the legal basis for each clone-and-rebuild job auditable after the fact, not just
asserted once at generation time.

## Output Structure

Each generated site lives in its own self-contained folder under
`C:\Jarvis\generated-sites\<slug>\`:

```
C:\Jarvis\generated-sites\<slug>\
  ├── index.html
  ├── styles.css
  ├── script.js
  ├── assets/
  └── meta.json
```

- **Slug rule:** slugified business name (lowercase, spaces/special characters to hyphens). On
  collision, append an incrementing counter suffix (`-2`, `-3`, ...) rather than a date-based
  suffix — keeps slugs short and stable if the same business is regenerated.
- **`assets/`:** starts empty for MVP. Fonts are linked via Google Fonts (external `<link>`/`@import`)
  rather than bundled locally. Image generation is explicitly deferred — not part of this pipeline
  yet — so there's nothing to populate the folder with until that's built.
- **`meta.json` schema:**
  - `business_name`
  - `slug`
  - `prompt_used`
  - `reviews_used`
  - `created_date`
  - `status` (`draft` / `delivered` / `sold`)
  - `client_contact`
  - `price`
  - `license_type`

  `price` and `status` are included now specifically so a future Finance dashboard (tracking
  project income, per [[Projects/Jarvis System]]) can read generated-site inventory directly
  without a schema migration later.

## Conversion Requirements

Sourced from CRO research (Landingi, Lovable, Apexure, Aimers): **form-length reduction is the
highest-lift lever** — cutting long forms down to 3-4 fields is documented at up to ~120%
conversion lift across sources, ahead of every other single change. Behind that: **headline
clarity** (a straightforward headline answering "what's in it for me?" within seconds
outperforms a creative one), **one CTA per page** (a single, repeated, unambiguous call-to-action
beats multiple competing ones — one link on a page averaged 13.5% conversion vs. 11.9% for two to
four), **trust signals** (testimonials, client logos, and social proof placed near the CTA,
documented at 19-34% lift), and **load speed as a hard requirement** — pages loading in ~1 second
convert roughly 3x better than pages taking 5 seconds, with 53% of mobile users abandoning
anything over 3 seconds.

**Tension with the design-vocabulary research:** the Ideas note's Awwwards/Dribbble research
calls for GSAP-driven scroll animation and video/motion embedded directly in hero sections as
the mark of "modern." That cuts directly against the CRO findings above — heavy motion/video
assets loaded above the fold work against the exact load-speed and single-clear-CTA behavior
that actually converts.

**Resolution principle:** fast, clear value prop and one obvious CTA above the fold, with
minimal blocking assets. Motion/scroll/video content lives further down the page, not on the
critical path to the first impression or the CTA.

## Visual Richness (3D)

**Library:** Three.js, self-hosted locally (vendored into the project, not loaded from a CDN).
This follows directly from the portability decision in Overview — a CDN dependency would break
the "genuinely portable static files" differentiator the moment that CDN is unreachable,
deprecated, or blocked in a region. Self-hosting removes that single point of failure entirely.

**Library version:** r128 (UMD/classic `<script>` build), confirmed as the working baseline —
tested end-to-end with PBR materials, HDRI image-based lighting, and a 3-pass `EffectComposer`
chain (bloom + custom color-grade) at a clean, sustained 60fps. Upgrading to the current stable
release (0.185.1, ES-modules-only — Three.js dropped the classic UMD build and flat `examples/js/`
addons entirely in recent versions) was attempted and abandoned for now: it resolved the
`thickness`/`specularIntensity` material-property gap described below, but introduced a severe,
unresolved performance collapse (60fps → effectively 0fps) and a *worse* overexposure result (the
podium, not just the glass, blown out to solid white), neither of which was root-caused. That
regression is deferred to a dedicated future investigation rather than pursued further inline —
r128 stays the working default until then.

**Scope:** exactly one hero-section 3D object per site — never a full 3D environment. This follows
the "one confident centerpiece" principle from current research: the standout sites "pick one hard
idea and execute it cleanly... a single object rendered with real weight," and "a single well-lit
hero object plus a reveal-on-interaction is enough to reposition a corporate site as premium" —
without needing a whole explorable world. Two current Awwwards-recognized examples (Oryzo, Site of
the Month April 2026; Hubtown, Site of the Day June 2026) both use exactly one object this way.

**Position relative to Conversion Requirements:** the 3D object sits below/outside the above-the-fold
critical path — the same resolution principle already established for motion/scroll/video content.
This isn't optional polish: a single 3D hero scene alone can cost 800kB–2MB of JS runtime before
anything is visible, which collapses Core Web Vitals/Lighthouse scores if it sits on the critical
path. It renders as a below-the-fold reveal or secondary section, never blocking first paint or the
CTA.

**Explicit exception flag:** this is a deliberate, scoped exception to the "vanilla JS only, no
external frameworks" rule in Conversion Requirements — not a silent violation of it. Three.js is
added specifically and only for this one hero-object use case; it is not a general license to add
other libraries or frameworks elsewhere in a generated site.

**Glass-material overexposure — fixed 2026-08-01.** On r128, `MeshPhysicalMaterial`'s `thickness` and
`specularIntensity` properties aren't recognized (added to Three.js after r128); the original defect
was the glass curtain-wall band rendering as a blown-out solid white block instead of transparent
glass. The property-level fix (using only `transmission`/`roughness`/`ior`/`color`/`opacity`, no
`thickness`/`specularIntensity`) was already in place going into this pass, but live re-testing found
a *residual* specular-highlight bloom clip on the glass at certain viewing angles — a smaller,
related symptom of the same underlying cause (key light + bloom tuned too hot for a low-roughness
transmission material under ACES tone mapping). Fixed by reducing key light intensity (1.1-1.2 → 0.9-0.95)
and raising `UnrealBloomPass` threshold (0.86-0.87 → 0.93) in both test files. Re-verified across
multiple rotation angles in-browser: no flat-white block, no bloom-clipped hotspot.

**Hero-object category palette:** structurally validated across two categories — a building
(architecture massing study) and a product (bottled beverage). The procedural-geometry approach,
PBR material loading, the r128-safe glass recipe, HDRI image-based lighting, the `EffectComposer`
chain, and the lazy-load pattern all generalized correctly to the second category, not just the
first. Both known lighting/material defects are now fixed (glass overexposure and diffuse-surface
overexposure, both 2026-08-01 — see Engineering board Done for specifics). The palette is
confirmed-clean as of this pass.

**Lesson for future material/lighting debugging:** don't diagnose a visual defect from the
screenshot alone — raycast the actual on-screen hotspot pixel against the live scene
(`raycaster.intersectObjects`) to confirm which mesh/material is actually responsible before
touching code. The first attempt at the diffuse-surface fix guessed "label material" from visual
proximity and was wrong (the label edit had zero visible effect); the real source, confirmed by
raycast, was the liquid's flat top cap — a different mesh entirely, requiring a different fix
(`envMapIntensity` + roughness on that material, not a color change to the label).

**Asset resolution:** 1K HDRI + PBR textures are confirmed as the standard — a 4K comparison
test (same scene, same geometry, single-variable swap) was
run and rejected. The 4K asset set was +116MB / 15.3x the size of the 1K set (124.16MB vs.
8.09MB) for a real-world load cost of roughly 18-90 extra seconds depending on connection speed,
against **no perceptible visual improvement** at actual hero-object render scale — confirmed by
direct side-by-side comparison of identical texture regions, not just a size-on-paper assumption.
The cause is ordinary GPU texture mipmapping: a web hero-object canvas never approaches 4K worth
of on-screen pixel coverage per surface, so the extra resolution is discarded before it's ever
visible. 2K wasn't separately tested — the mipmapping explanation already covers that middle
ground, since the same downsampling logic applies at any resolution above what the canvas can
actually display.

## Sources (Visual Richness)
- [Best Three.js Websites 2026: 8 Sites + Techniques | Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026) — "one confident centerpiece" principle, Awwwards examples (Oryzo, Hubtown)
- [Web Design Trends 2026: What Actually Held Up After Six Months | Studio Meyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check) — performance cost of 3D hero elements, "brand is the experience" scoping
- [Self-hosting third-party resources: the good, the bad and the ugly | Web Performance Calendar](https://calendar.perfplanet.com/2019/self-hosting-third-party-resources-the-good-the-bad-and-the-ugly/) — self-hosting vs CDN reliability reasoning

## UI Craft

Parallel track to Visual Richness (3D), not a replacement for it — where that section covers the
one-hero-object 3D layer, this one covers the surrounding UI craft (motion, layout, typography)
that carries the rest of the page.

**Award criteria and why this doesn't fight Conversion Requirements:** Awwwards scores submissions
on Design (40%), Usability (30%), Creativity (20%), and Content (10%). Usability outweighs
creativity by a full 10 points in the rubric itself — award-level sites are not rewarded for being
clever at the expense of being usable. That means the Conversion Requirements section's emphasis on
clarity, speed, and a single obvious CTA isn't in tension with chasing award-level quality; it's
literally what the majority of the score is measuring.

**Anchoring evidence — Longbow:** Awwwards Site of the Day, 12 Jul 2026, scoring 7.21/10. Built on a
two-colour palette (`#888C8F` / `#FFFFFF`), Webflow + Figma stack, tagged Typography / UI design /
Footer Design — notably *no* WebGL/Three.js/GSAP-heavy tags. It's evidence that award recognition
doesn't require a 3D/WebGL layer at all; restrained typography, layout, and interaction craft alone
clears the bar.

**Two-build model (Digital Butlers, 109 awards) — evidence, not our production model:** their
process splits into a production build (tuned for speed and conversion) and a separate
competition build (tuned for showcase, submitted to award sites). Effort split is roughly 88h
production vs. 186h competition — competition work is over 2x the production build. That split is
driven by human labour cost: a second, hand-built competition version is expensive to produce
manually. That cost structure doesn't transfer to a generator — the marginal cost of the fuller
build here is a longer prompt, not ~100 extra hours of manual work. So there is no Standard/Premium
split: every generated site ships at a single, premium/full-UI-craft quality level.

**Conversion Requirements remains the floor, not a competing tier:** none of the above changes
Conversion Requirements' status as the non-negotiable baseline — above-the-fold speed, one
dominant CTA, minimal form fields, no CDN/framework dependencies. UI Craft is a layer that sits on
top of that floor; it never overrides it.

**Technique catalogue** — all achievable with native CSS and vanilla JS, no animation library and no
WebGL required:
- Unified easing language applied consistently site-wide, rather than per-component defaults
- Scroll pinning
- Staggered entrance tempos (elements arriving in sequence, not all at once)
- 2.5D layering (parallax/depth via layered flat elements) as a lighter alternative to real 3D
- Cursor-as-active-element (the cursor itself becomes a designed, responsive object)
- Footer-as-episode (footer treated as a final designed beat, not an afterthought)
- Motif repetition (a recurring visual element tying sections together)
- Serif + grotesque typeface pairing
- Microtiming polish (small, precise timing adjustments across interactions)

**Why GSAP was considered and rejected:** every failure encountered in the earlier 3D work (see
Visual Richness above) traced back to dependency management — library versions, CDN/self-hosting,
build-step drift — never to the generator's own code output. Native CSS scroll-driven animations
(`animation-timeline: view()` / `scroll()`) now cover reveals, parallax, and scroll-progress effects
running on the compositor thread, at zero added KB and with no dependency to manage at all. That
removes the entire failure class GSAP would have reintroduced, for the same visual result.

**Browser-support caveat and the resulting requirement:** scroll-driven animations are still behind
a flag in Firefox stable (~82.6% global support as of this writing). Every technique built on them
must therefore be written as progressive enhancement — the element's default, unconditional state
fully visible and correctly positioned, with the animation added only inside an `@supports
(animation-timeline: ...)` block, never as a base-hidden state. This is now a hard requirement in
the generation prompt itself, not just a design note.

**Governing principle:** animation is treated as a language on par with type and colour — a design
variable in its own right, not decoration layered on top afterward. The idea leads the visuals,
not the other way around.

### Typography

Variable fonts are the baseline: a single font file carries the full weight range, cutting request
count and serving the load-speed requirement already established in Conversion Requirements — and
enabling kinetic type (weight/width animation) purely in CSS, no WebGL needed.

The expected Google-Fonts-vs-commercial-fonts quality gap doesn't actually show up in current
research — the free/commercial gap has narrowed substantially, so defaulting to Google Fonts isn't
a quality compromise the way it might have been a few years ago. Current picks worth defaulting to:
Instrument Serif + Instrument Sans, Fraunces, JetBrains Mono, Space Mono.

**Category mapping:** soft serifs read warm, human, and premium at once — best fit for food and
beverage, wellness, boutique hospitality, lifestyle editorial, and real estate/interior design
clients specifically.

Oversized type is now a standing hero-layout option in its own right (type as the dominant visual
element, not just a label over an image). Colour direction has also shifted: 2022–23's high-contrast
palettes have given way to softer palettes that are still deliberately chosen, not muted by default.

### Responsive & Mobile

Current gap: every generated site so far has only been evaluated desktop-only. Animation stability
across breakpoints hasn't had deliberate QA. This is the stricter target, not a secondary one — the
53% mobile-abandonment-past-3-seconds figure already cited in Conversion Requirements means mobile
is where load-speed and motion-weight mistakes cost the most. Mobile-viewport verification is
required before any delivery, not optional follow-up.

### Motion Accessibility

All motion must respect `prefers-reduced-motion` — scroll animation, parallax, and cursor effects
reduced or disabled when it's set. This is a standard web-platform requirement, not something
pulled from the design-trend research above, and it isn't optional polish either: usability is 30%
of the Awwwards rubric against creativity's 20%, so motion that ignores an explicit accessibility
signal is scored against, not just ethically owed.

## Sources (UI Craft)
- [Longbow — Awwwards](https://www.awwwards.com/sites/longbow) — rubric, palette, stack, tags evidence
- [UI Design — Awwwards](https://www.awwwards.com/websites/ui-design/) — Webflow/Framer prevalence among award-winning sites
- [Award-Winning Websites: WOW Effect, Performance & Awards — Digital Butlers](https://main.digitalbutlers.team/works/award-winning-websites-wow-effect-performance-awards) — two-build model, technique catalogue, effort data
- [Scroll-driven Animations — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) — `animation-timeline: view()`/`scroll()` mechanics, compositor-thread performance characteristics
- [animation-timeline — Can I Use](https://caniuse.com/mdn-css_properties_animation-timeline) — Firefox stable behind-flag status, ~82.6% global support figure, basis for the progressive-enhancement requirement
- [Trending Fonts — Made Good Designs](https://madegooddesigns.com/trending-fonts) — variable fonts as baseline, free-font quality, category mapping
- [Typography Trends 2026 — Design Flea](https://designflea.com/typography-trends-2026) — variable fonts as baseline, free-font quality, category mapping
- [Web Design Trends 2026: Colors & Fonts — No Panic Design](https://nopanicdesign.com/blog/web-design-trends-2026-colors-fonts) — colour-palette shift evidence

## Links

## Related
- [[Ideas/Website Generator (Landing Pages + Clone-and-Rebuild)]]
- [[Projects/Jarvis System]]
