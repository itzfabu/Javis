---
date: 2026-07-30
updated: 2026-08-04
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

## Next Steps — Research Roadmap (Fabio's note, 2026-08-04)

Three threads, strictly ordered — each depends on the one before it. Tracked as tasks in
TASKS.md under #website-generator.

1. **Brand extraction (do first).** Everything downstream needs it. How does Jarvis pull a
   client's real colors, fonts, and logo from an existing site / logo / brand input, so each
   generated site feels like *theirs*, not a template — and feed those tokens into both the hero
   frames (see Visual Richness open question above) and the rest of the page.
2. **Conversion skeleton (do second).** The archetypes (see Open Question above) nail the hero;
   a full site still has to convert. Research the proven page structure below the hero — services,
   social proof, contact/lead flow — the layout that turns visitors into leads. Goal: sites that
   *sell*, not just look modern. Ties directly into the Conversion Requirements section below.
3. **Frame generation (do last — heaviest, depends on brand being locked).** Which tool reliably
   renders the archetype frame sequences from Visual Richness above? Options to evaluate: (a) AI
   text-to-video → split to frames — fast, weaker control/consistency; (b) real 3D render → export
   frames — precise, slow, needs a 3D pipeline; (c) hybrid template scenes tweaked per client.
   Accuracy is non-negotiable for a client wanting *their* actual building — a generic tower will
   be noticed. This thread only starts once the flipbook-vs-GSAP open question above is resolved
   *and* Thread 1 has locked how brand tokens flow into a frame set. **Status 2026-08-04: the
   flipbook-vs-GSAP gate is now resolved (native CSS adopted, see Open Question above) — one of
   Thread 3's two gating conditions is cleared. It remains blocked on Thread 1 (brand extraction),
   which has not started.**

## Thread 1: Brand Extraction — PROPOSAL (2026-08-04), awaiting Fabio's approval

**Status: research + design only, nothing built.** This is a proposal to review and approve or
redirect, not an adopted decision — unlike the rest of this note, nothing here changes how the
generator works until Fabio signs off. Gates Thread 2 (conversion skeleton needs to know what it's
styling) and Thread 3 (frame generation needs locked brand tokens, per the roadmap above).

**The problem:** the generator must go from "whatever a client gives us" — a URL, a logo file, a
typed-out brand guide, or nothing at all — to a structured set of design tokens, automatically,
reliably, across many different clients, with no per-site hand-tuning. That token set then has to
drive both the static page templates *and* the hero sprite-sheet frames (Thread 3's ASSEMBLE/
REVEAL/SPIN/etc. archetypes) from the same source of truth.

### Input path (a): existing website

**Approach: render with a headless browser, read computed styles from structural selectors, not
raw color-frequency counting across the page.** A raw scrape of every color in a site's CSS
regularly turns up 30-40 distinct values with no indication of what's decorative noise versus the
actual brand palette — the fix is to tie each extracted color to *where* it's used (header
background, primary CTA background, link color, body text, body background, footer background),
which the selector itself tells you, rather than guessing from frequency alone. This needs a real
browser engine, not a static HTML/CSS parse: modern sites resolve most of these values through the
cascade, media queries, or CSS-in-JS, so what's in the source files often isn't what's actually
rendered.

Found existing prior art validating this exact approach: **[Dembrandt](https://github.com/dembrandt/dembrandt)**
(MIT, actively maintained, `npx dembrandt <url>`) uses Playwright to render a page, extract computed
styles, score color-usage confidence, group typography, and export to the W3C Design Tokens (DTCG)
standard — the same architecture reasoned toward independently here.

**DECIDED (2026-08-04): build narrow on Playwright directly. Do not adopt Dembrandt.** Same
reasoning that settled the GSAP question: a small, solo-maintained tool is exactly the dependency
profile this project's failure history warns about, however good it looks today. Playwright is
Microsoft-maintained and stable; we only need ~6-8 selectors, not Dembrandt's full scope (spacing,
shadows, motion, components we'll never use). Owning the extraction code directly also means we can
tune it when real sites break it — which the validation spike below shows happens often enough to
matter.

Also check for CSS custom properties matching common naming conventions (`--primary`,
`--brand-color`, `--color-accent`, etc.) as a high-confidence shortcut when a site already exposes
its own design tokens this way — cross-checking that signal against the selector-based extraction
gives a usable confidence score per color, which is worth surfacing in the token output (see schema
below) rather than presenting every extracted value with false certainty.

### Input path (b): logo file only

**Approach: `node-vibrant` on the logo's pixels.** Both `colorthief` and `node-vibrant` are mature
and actively maintained; `node-vibrant` specifically classifies extracted colors into semantic
swatches (Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted) rather than a flat
frequency list, which maps directly onto the primary/secondary/accent role problem instead of
requiring bespoke clustering logic to be built here.

**Real gap this doesn't solve:** a logo alone gives brand colors but no background/text/surface
signal — there's no "page background" or "body text" to sample from a logo image. The proposal is
to algorithmically derive the supporting neutral scale (near-white background, near-black text, a
tinted surface color) from the extracted primary using standard tint/shade generation, rather than
defaulting to a generic neutral gray scale — keeps the derived palette visually tied to the one
real signal we have. This is a real design choice, stated explicitly rather than left implicit.

### Input path (c): stated brand guide / structured input

Simplest path: parse explicit hex/RGB/named-CSS-color values the client provides directly into
roles when labeled ("primary: #1A2B3C"). When given an unlabeled list of colors instead, reuse the
*same* role-inference heuristic as path (b) — one shared subsystem, not a third bespoke one.

**Explicitly out of scope: Pantone code conversion.** If a brand guide cites a Pantone name/number
rather than a hex value, do not embed a Pantone-to-RGB conversion table — Pantone's own color data
is itself commercially licensed, and public approximation tables are exactly the kind of
legally-murky dependency this project has been careful to avoid elsewhere (see the clone-and-rebuild
legal-guardrail reasoning above). Ask the client for the hex/RGB equivalent instead.

### Input path (d): no brand at all

**This matters as much as path (a) — many small clients have nothing.** Proposal: infer a starting
palette from industry category, extending the category-to-aesthetic mapping this note already
established for typography (soft serifs for food/beverage, wellness, boutique hospitality, real
estate) and for hero archetypes (Visual Richness / Thread 3 archetype list above) — a small curated
per-category default-palette table (e.g. food/beverage → warm earth tones, tech/SaaS → blue/violet,
construction/trades → industrial grays plus a safety-orange accent), then let explicit color words
in the client's own prompt nudge the specific hue if present ("our brand is green"). Deliberately
heuristic and table-driven rather than generative/AI-improvised, for predictability and consistency
with how this note has already chosen determinism over improvisation elsewhere in the pipeline (see
Architecture note below).

### Colors: palette roles and the accessibility conflict

**Roles needed, minimal set:** `primary`, `secondary`, `accent`, `text`, `background`, `surface`,
`border`. Enough to drive both page templates and frame generation without over-engineering a
larger token set this thread doesn't need yet.

**WCAG-AA contrast: implement the relative-luminance formula directly, no dependency.** Verified
2026-08-04: WCAG 2.2 (4.5:1 normal text / 3:1 large text and UI components) remains the operative,
legally-relevant standard — WCAG 3.0's contrast algorithm (APCA was a candidate, not adopted) is
still undetermined and not expected before 2030. The WCAG 2.x contrast math is a short, stable,
unchanging W3C formula (~15 lines) — implementing it directly is more consistent with this
project's established anti-dependency bias than pulling in a package for something this small and
this stable.

**The conflict decision, stated plainly, not left as an edge case:** when a client's real brand
color fails 4.5:1 against a reasonable background, **the brand color is never silently swapped for
a generic accessible substitute** — that breaks the entire point of brand extraction. Instead:
1. The brand color is kept as-is for decorative/large-scale use (hero backgrounds, brand accents),
   where WCAG's 3:1 threshold for large graphical objects applies, not 4.5:1.
2. Wherever text sits *on* a brand color, the TEXT color is chosen to pass contrast (usually a
   binary choice between near-black or near-white), not the brand color itself.
3. If a brand color is so light or desaturated that neither text choice passes against it directly
   (rare but real — pale yellow is the classic case), auto-generate a darkened/shaded variant of
   the *same hue* for any text-bearing surface, rather than substituting an unrelated color. Hue
   identity is preserved; only lightness changes.

This resolution should be recorded per-color in the token output (see `accessibility` block in the
schema below) so it's auditable, not just asserted.

### Fonts: detection, licensing, substitution

**Detection:** same Playwright computed-style mechanism as color extraction — read `font-family` on
heading and body selectors. One shared extraction pass, not a separate mechanism per concern.

**Licensing is a hard constraint, not a formality.** Three real cases:
- **Already a Google Font:** zero risk, reuse directly, link via `<link>` per the Google Fonts URL
  — this project already decided fonts are the one CDN-link exception to "vanilla, no external
  deps" (see Conversion Requirements above); this thread doesn't reopen that, just confirms it
  applies here too.
- **Web-safe/system font** (Arial, Georgia, Times New Roman, etc.): no redistribution issue at all
  — these are OS-provided, referenced by name, no file is ever shipped. Legally fine to keep as-is,
  but flagged for substitution anyway on quality grounds (reads as dated/generic), matching this
  note's existing typography bar, not a legal requirement.
- **Paid/proprietary/custom font** (Helvetica Neue, Futura, a paid Adobe Fonts family, a bespoke
  wordmark font): **cannot be redistributed**, full stop. Must be substituted.

**Substitution: a maintained static mapping table, not a live matching API.** Verified 2026-08-04
that curated commercial-to-Google-Fonts mapping resources already exist publicly (FontBench,
Typewolf's free-alternatives guide) — validating a maintained lookup table as the established
approach, not something invented here. Proposal: build a small in-repo JSON table (~30-50 common
commercial fonts seeded from these public references), matched first against this project's own
already-vetted shortlist (Instrument Serif/Sans, Fraunces, JetBrains Mono, Space Mono) when a
reasonable category fit exists, falling back to the wider Google Fonts catalog by category
(serif/sans/display/mono) otherwise. Explicitly **against** relying on a third-party font-matching
API/service (WhatFontIs, Fontspring Matcherator, etc.) — reintroduces exactly the external-service
dependency-availability risk this project has avoided elsewhere (GSAP+Lenis rejection, self-hosted
Three.js over CDN).

### Logo: retrieval, format, background removal

**Retrieval priority** (path a, existing site): inline `<svg>` matching header/logo heuristics
(best — vector, exact colors readable straight from source) → `<img>` in header/nav with
class/id/alt containing "logo" (the most common real-world case) → `<link rel="apple-touch-icon">`
(higher-res than favicon, still just a mark) → standard favicon (last resort) → `og:image`
deliberately placed **lowest priority, flagged for manual review only** — it's frequently a full
social-share marketing graphic, not a clean logo mark, and using it as "the logo" risks looking
wrong more often than it helps.

**Path (b):** client-uploaded file is ground truth, skip retrieval, extract colors from it directly
(feeds the color pipeline above too).

**Paths (c)/(d) with no logo available:** fall back to a **text wordmark** — the business name set
in the resolved brand font, in the primary color — as the logo for both page header and hero-frame
compositing. A necessary, explicit fallback, not an implicit gap.

**Format handling:** SVG kept as-is. Raster (PNG/JPG) checked for an alpha channel; if opaque
(typically a JPG or a flattened PNG), background removal would run — **conditionally, only when
actually needed**, not as a mandatory pipeline stage for every client. Verified 2026-08-04:
**[rembg](https://github.com/danielgatis/rembg)** remains the open-source standard (16k+ GitHub
stars, actively maintained — updated Apr 2026, released Jul 2026), runs fully local/self-hosted, no
external API dependency.

**DECIDED (2026-08-04): approved in principle, deferred out of the first pass.** rembg is a
genuinely heavier dependency than everything else in this pipeline (ML model weights, real
inference cost/latency) — carrying that weight is only justified if most real client logos actually
need it. Rather than assume, the validation spike below measures how many real logos arrive without
an alpha channel. If most do, build it in the first pass; if few, manual handling (ask the client
for a transparent logo, or flag for one-off manual background removal) is cheaper than carrying an
ML dependency for a rare case. See Validation Results below for the measured number and the
resulting call.

### Architecture note: deterministic script, not LLM improvisation

Proposal: brand extraction runs as a **deterministic preprocessing script** (Playwright + node-vibrant
+ the curated font table + the WCAG math), producing the token JSON below *before* the existing
`claude -p` generation call — not something delegated to the LLM to figure out from a raw URL. The
existing generation pipeline already accepts structured input (business name, description, reviews)
that shapes the prompt; the token JSON would be added the same way. Determinism and
reproducibility matter more here than in the freeform copywriting parts of the pipeline — computed
CSS values are exactly the kind of thing an LLM is unreliable at reading precisely without dedicated
tooling, and a client's brand tokens shouldn't vary between two generation runs of the same site.

### Token schema (the actual deliverable of this thread)

Consumed by both the page templates and Thread 3's frame generation from one source of truth.
Example for a hypothetical client, existing-website path:

```json
{
  "meta": {
    "client": "Maple & Rye Bakery",
    "sourcePath": "existing-website",
    "sourceUrl": "https://example-bakery.com",
    "extractedAt": "2026-08-04T00:00:00Z",
    "confidence": "high"
  },
  "color": {
    "primary":    { "value": "#C4622D", "source": "header background, computed" },
    "secondary":  { "value": "#3B2A20", "source": "footer background, computed" },
    "accent":     { "value": "#E8A23D", "source": "CTA button background, computed" },
    "text":       { "value": "#2A1F18", "source": "body computed color" },
    "background": { "value": "#FBF6EF", "source": "body computed background" },
    "surface":    { "value": "#FFFFFF", "source": "card/section background, computed" },
    "border":     { "value": "#E4D8C8", "source": "derived: background darkened 8%" },
    "accessibility": {
      "textOnBackground": { "ratio": 12.1, "passesAA": true },
      "primaryOnBackground": { "ratio": 5.8, "passesAA": true },
      "accentTextOverride": {
        "reason": "accent #E8A23D fails 4.5:1 against white text",
        "resolution": "use text color #2A1F18 on accent surfaces, not white",
        "ratio": 7.9,
        "passesAA": true
      }
    }
  },
  "typography": {
    "heading": {
      "detected": "Futura PT (licensed, not redistributable)",
      "resolved": "Poppins",
      "source": "google-fonts",
      "url": "https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap",
      "fallbackStack": "'Poppins', 'Segoe UI', sans-serif"
    },
    "body": {
      "detected": "Georgia (web-safe)",
      "resolved": "Fraunces",
      "source": "google-fonts",
      "url": "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&display=swap",
      "fallbackStack": "'Fraunces', Georgia, serif",
      "note": "web-safe, legally fine as-is, substituted for quality per this note's typography bar"
    },
    "scale": { "h1": "3.5rem", "h2": "2.25rem", "h3": "1.5rem", "body": "1rem", "small": "0.875rem" }
  },
  "logo": {
    "format": "svg",
    "source": "header-svg",
    "assetPath": "assets/logo.svg",
    "hasTransparency": true,
    "wordmarkFallback": false,
    "backgroundRemovalApplied": false
  },
  "spacing": { "unit": "8px", "radius": { "sm": "4px", "md": "8px", "lg": "16px" } },
  "archetype": {
    "recommended": "REVEAL",
    "reason": "category: food/beverage, per Thread 3 archetype-to-category mapping"
  },
  "frameGeneration": {
    "paletteForFrames": ["#C4622D", "#E8A23D", "#3B2A20"],
    "backgroundForFrames": "#FBF6EF",
    "logoCompositing": {
      "enabled": true,
      "assetPath": "assets/logo.svg",
      "appearsAtFrameFraction": 1.0,
      "note": "logo composites in on the final settled frame"
    }
  }
}
```

**The Thread 1 → Thread 3 handoff, stated explicitly:** the frame generator reads
`frameGeneration.paletteForFrames` and cycles it across whatever repeating elements the chosen
archetype has (e.g. ASSEMBLE's tower blocks each take the next color in the array instead of the
spike's placeholder rainbow), reads `backgroundForFrames` for the frame background, and — new
requirement this thread surfaces — composites `logo.assetPath` into the sequence per
`logoCompositing`, so the client's actual mark appears in their hero animation, not just their
colors.

### VALIDATION RESULTS (2026-08-04) — spike against 9 real sites

**Still a PROPOSAL, not adopted — this spike informs Thread 1, it doesn't approve it.** Built a
minimal Playwright extractor in `C:\Jarvis\spikes\brand-extract\` (throwaway) implementing exactly
what's described above: 6-8 structural-selector color roles, heading/body font-family, the logo
retrieval-priority list, and a scan for `--brand*`/`--color-*` custom properties. Ran it against 9
real, live small-business sites, picked for a genuine spread: **Franklin BBQ** (restaurant, custom
site), **Cedar Village Dentistry** (dental, WordPress), **Hiut Denim** (retail/manufacturer,
custom/Shopify-ish), **Birds Barbershop** (salon, WordPress/Elementor), **Mark Fisher Fitness /
Speakeasy of Strength** (gym, since-rebranded — still real and live), **Newman Roofing**
(construction/trades, WordPress), **Family Law in Partnership** (law firm, custom — note: returned
403 to a plain `curl` pre-check, loaded fine under real Playwright, a useful reminder that
bot-protection checks with a bare HTTP client don't predict real-browser behavior),
**Oslo Coffee Roasters** (cafe, Shopify), **Grace Family Roofing** (construction/trades, WordPress,
second trades site for a same-category comparison point). Every extraction was judged against a
screenshot of the real page, by eye, honestly — not just against the JSON output in isolation.

**Headline finding — the logo retrieval priority order is backwards.** Inline `<svg>` in the header
was ranked highest on the theory that vector beats raster. In this sample it was the least reliable
source by far: of 5 sites where the extractor reported a "successful" `inline-svg` match, inspecting
the actual saved SVG content showed **3 were confirmed wrong** (two were Font Awesome/Elementor
dropdown-caret icons — `e-fas-caret-down`, `e-fas-angle-down` — not a logo at all; one was a hidden
`display:none` icon-*sprite* definition block that happened to be the first `<svg>` in the header),
**1 was non-functional** (a bare `<use xlink:href="#logo">` reference with no actual path data — it
only renders inside the original page's DOM, where the referenced `<symbol>` lives elsewhere; saved
in isolation it's an empty file), and **1 was likely wrong** (a 24×24 `size-6`-classed utility icon,
not the "HIUT" wordmark visible on the page). **Zero of the five "successful" inline-SVG matches
were confirmed to be the real logo.** Meanwhile every site where the lower-priority `<img>`
class/id/alt heuristic matched at all (3 of 9 — Newman Roofing, Oslo Coffee, Grace Family Roofing)
was visually confirmed correct against the screenshot, no exceptions. This is exactly the
"wrong-but-confident answer is worse than none" failure mode called out as the thing to watch for —
the extractor reported a tier and a byte count for every one of those 5 wrong SVGs with no signal
that anything was off. **The fix is identifiable, not a dead end:** validate an SVG candidate before
trusting it — reject anything inside `display:none`, reject known icon-font classes
(`e-fas-*`/`fa-*`/similar), reject bare `<use>` references without inlining the referenced
`<symbol>`, reject implausibly small viewBox/rendered-size icons — and/or simply try the `<img>`
heuristic first, since it proved more reliable here despite being "lower tech."

**Color roles: background and text are reliable; the primary/accent (CTA) role is the weak point.**
- `background` and `text`: sensible on 9/9 and 9/9 sites respectively (two sites returned a fully
  transparent background rather than a color — not wrong, just needs a "transparent → assume white"
  normalization step that isn't built yet).
- `header`: correct on 3/9, plausible-but-unverifiable-null on 3/9 (genuinely no distinct header
  background may be the true state), confirmed missed on 3/9 — at least two of those misses trace to
  a real *mechanistic* limit, not a selector bug: a header whose visible darkness comes from a
  background *image*, not a CSS `background-color`, is invisible to a computed-style check no matter
  how the selector is written. That needs a different technique entirely (e.g. sampling pixels from
  a screenshot crop), not a better selector.
- **`primary`/accent (the CTA selector) was the least reliable role measured: 1 of 9 sites (Family
  Law in Partnership) got a clean, correct match.** Failure patterns, all real and distinct: matched
  a cookie-consent banner's "Accept all" button instead of the real CTA (Franklin BBQ — the color
  happened to coincidentally match the real CTA, which is worse than an obvious failure, not better);
  missed the actual brand-defining color entirely because it's styled as an outlined/transparent-
  background "ghost button," which the extractor's `bg !== transparent` filter actively excludes
  (Oslo Coffee, and arguably Birds Barbershop's real "BOOK NOW" pill); grabbed a generic first-match
  `button`/`a` element — a newsletter signup, a carousel arrow, a dropdown toggle — instead of the
  actual primary call-to-action (Hiut Denim, Grace Family Roofing, Mark Fisher Fitness). The
  `CTA_SELECTORS` list's fallback to a bare `button`/`a[class*="btn"]` when nothing more specific
  matches is doing real damage — it grabs *a* button, not *the* button, and reports it with the same
  confidence as a correct match.
- `link`, `surface`, `border`: consistently the least useful signals — `link` returned white
  (almost always wrong/junk, likely catching light text on a dark element) on 4 of 9 sites; `border`
  returned either nothing or a value with no visible correspondence on the page (a bright, unrelated
  blue on one site) on the large majority. These roles need either better selectors or should be
  *derived* from the other, more reliable roles (e.g. `border` as a computed tint of `background`)
  rather than extracted directly.

**CSS custom properties: rare, but a near-perfect signal when present.** Present and usable on 2 of
9 sites (Newman Roofing, Grace Family Roofing — both WordPress builds with deliberately-named design
tokens like `--color-primary`/`--color-accent`). On both, the extracted hex values were an *exact*
match to the visually dominant brand color, confirmed against the screenshot — the single strongest
signal measured in this entire spike, whenever it's available. One nuance worth recording: Hiut
Denim also exposed a `--color-primary` custom property, but its value (an orange-red in OKLCH) does
not match the site's actual dominant black/white/cream palette by eye — a reminder that a variable
being *named* "primary" doesn't guarantee it's the visually dominant color; it may just be a rarely-
used accent (e.g. for sale badges or error states). Confidence scoring, not blind trust, is still
warranted even for this best-case signal.

**Fonts: detection never technically failed, but roughly half the sample needs substitution.**
Every one of the 9 sites returned *some* font name for both heading and body — no nulls. Of those,
3 sites (Cedar Village Dentistry, Newman Roofing, Grace Family Roofing) had both heading and body
already on Google Fonts — zero risk, direct reuse. The rest had at least one clearly commercial or
unclear-provenance font (Founders Grotesk, Zing Rust, Circular, Objektiv, a custom display face) that
would need substitution — confirming the substitution table isn't an edge case, it's the majority
path. One concrete implementation note the spike surfaced: raw computed `font-family` values often
carry vendor/webfont-loader suffixes (`circularxxweb-book`, not `Circular`) — a substitution-table
lookup needs name normalization first, or it will silently fail to match fonts that actually are in
the table under their real name.

**rembg data point: 0 of 3 measured raster logos needed background removal, but the sample is too
small to be the deciding factor alone.** Of the 3 confirmed-correct logo retrievals (all `<img>`-
heuristic raster PNGs — Newman Roofing, Oslo Coffee, Grace Family Roofing), all 3 already had a
working alpha channel, verified directly with Pillow (`mode=RGBA`/`P+transparency`, real 0-255 alpha
range, not just a channel present but fully opaque). Zero would have needed rembg. That said: n=3 is
genuinely too small to generalize, and the logo-tier bug above means the *true* mix of raster-vs-SVG
logos a fixed extractor would actually retrieve is still unknown — fixing the SVG-priority bug could
shift more real logos toward clean SVG (which never needs background removal at all), making this
number even less central, or it could surface more raster cases that do need it. **The rembg call,
given this data: the original deferred-pending-measurement decision holds — nothing here justifies
building it now, but re-measure with a larger sample once the logo-retrieval fix lands, rather than
treating 0-of-3 as final.**

**Verdict — does the structural-selector premise hold?** Qualified yes, not a clean yes. It clearly
beats "nothing" and clearly beats blind raw color-frequency counting: `background`/`text` are highly
reliable, CSS custom properties are excellent when present, and the `<img>`-heuristic logo path is
100% correct on every real match in this sample. But the single most brand-defining color role —
the primary/accent CTA color — was only cleanly correct on 1 of 9 sites, and the logo-retrieval
*priority order* actively favored the least reliable source. **Being honest about what this means
for "no per-site hand-tuning":** at minimum 6 of 9 sites in this sample would need a human to
check or correct the extracted accent color, and 5 of 9 would need a human to correct or reject the
extracted logo, before the output could be trusted as-is. That is not a rare-edge-case correction
rate — it's the majority case for exactly the two fields most visible on a generated hero. **This
does not mean the structural-selector approach is wrong; every failure pattern found here is
concrete and fixable** (validate SVG candidates before trusting them, stop excluding outlined/
transparent-background buttons from CTA detection, prefer call-to-action-shaped link text over
first-match, add an image-sampling fallback for header/hero backgrounds that come from a photo not
a color). But it does mean: **the current design's implicit assumption of a fully automatic,
zero-review pipeline needs to change.** The concrete recommendation is to keep the structural-
selector approach, apply the fixes above, and add a **mandatory confidence-scored review step for
the primary/accent color and the logo specifically** (surface both to Fabio or the client before a
site ships) rather than treating either as safe to fully automate on the first pass — the other
roles (background, text, and CSS-custom-property-sourced values) earned enough reliability in this
sample to ship unreviewed.

### RE-TEST (2026-08-04) — fixes applied, same 9 sites, honest before/after

**Still a PROPOSAL.** Applied the four fixes the validation spike surfaced (`extract2.js` in the
same throwaway spike dir) and re-ran against the identical 9 sites, judged the same way — by eye,
against a fresh screenshot, not by whether the JSON looked populated. FIX 1: `<img>` heuristic tried
before inline `<svg>`; SVG candidates now rejected if inside `display:none`, icon-font-classed,
implausibly small, or a bare unresolved `<use>` reference (resolved by inlining the referenced
`<symbol>` when it is the real logo). FIX 2: CTA/accent now found by scoring candidates (keyword
match, above-the-fold position, size) with an explicit exclusion list (cookie/consent, newsletter,
carousel, dropdown), no more bare first-match fallback, and outlined/transparent "ghost" buttons no
longer auto-excluded. FIX 3: header background falls back to sampling a screenshot crop when
`background-color` is transparent (image-based headers). FIX 4: transparent background normalized
to assumed white; font names normalized before what would be a table lookup; `border`/`surface` now
derived (tint/shade) from `background` instead of extracted directly; every field carries a
confidence level, and CSS custom properties are cross-checked against independently observed
structural colors before being trusted.

**Logo — genuine improvement, honestly short of "solved."**

| Site | Before | After |
|---|---|---|
| Franklin BBQ | Wrong (hidden icon-defs SVG matched as "success") | **Still wrong** — new failure: an unscoped `img[alt*="logo"]` fallback matched a gift-card graphic elsewhere on the page, not the header mark. Flagged medium confidence, not high. |
| Cedar Village Dentistry | Found, download blocked (403) | Unchanged — same block, unrelated to these fixes |
| Hiut Denim | Wrong (24×24 utility icon, reported as a "successful" match) | **Not found, and now says so** — real logo is styled text; extractor correctly found nothing valid and fell back to a favicon at low confidence, instead of confidently reporting the wrong icon |
| Birds Barbershop | Wrong (Font Awesome caret-down icon) | **Still wrong** — fell back to a generic `og:image` social-share graphic — but now correctly flagged low confidence instead of reported as a clean SVG "success" |
| Mark Fisher Fitness | Wrong (Font Awesome angle-down icon) | **Fixed — confirmed correct**, visually verified against the real "Speakeasy of Strength" wordmark |
| Newman Roofing | Correct | Unchanged — still correct |
| Family Law in Partnership | Non-functional (empty `<use>` reference, no path data) | **Mostly fixed** — the reference is now resolved and the file contains real path data matching the site's navy brand color (confirmed: extracted fill `#192744` vs. independently extracted text color `rgb(26, 40, 68)` — the same color). One remaining rough edge: the resolved markup keeps the outer `<symbol>` tag, which doesn't render standalone without one more trivial transform (swap it for `<svg>`) — flagged honestly, not swept under "fixed" |
| Oslo Coffee Roasters | Correct | Unchanged — still correct |
| Grace Family Roofing | Correct | Unchanged — still correct |

Net: confirmed-correct logos went from **3 of 9 to 4 of 9**, plus one more now "mostly correct with
a disclosed rough edge" (5 of 9 good outcomes total). More importantly than the raw count: **the
"confidently wrong" failure mode — reporting a wrong SVG with the same success-looking tier as a
right one — is gone.** Every remaining miss now surfaces as an honestly low-confidence result
(favicon fallback, flagged og:image, or a medium-not-high heuristic match), which is what the
confidence system exists to do. Two sites (Franklin BBQ, Birds Barbershop) are still wrong outright
— the unscoped `<img>` fallback and the `og:image` fallback both need their own tightening (scope
the `<img>` fallback to header/nav-adjacent containers only; drop `og:image` entirely rather than
treat it as a weak signal, since it was wrong both times it fired across both test rounds).

**Accent/CTA — the clearest win, still not "solved" for every site.**

| Site | Before | After |
|---|---|---|
| Franklin BBQ | Wrong (cookie-banner "Accept all", right color by coincidence) | **Fixed** — correctly grabbed "Order in Advance", the real CTA, exact color |
| Cedar Village Dentistry | Missing (null) | **Fixed** — correctly grabbed "Book Virtual Consult", real element and color |
| Hiut Denim | Ambiguous ("Sign up" newsletter button, real color) | **Unchanged** — same result; arguably the best available answer, since this homepage has no stronger hero CTA to prefer |
| Birds Barbershop | Wrong (missed the real yellow-green "BOOK NOW", grabbed a generic submit) | **Partial** — now correctly matches "Book Now" *text*, but picks the black nav-bar variant over the yellow-green hero variant (both buttons share the same label) — the real distinctive brand color is still missed |
| Mark Fisher Fitness | Junk (transparent background, wrong text captured) | **Fixed** — exact match on "Explore Our Locations", both the lime background and purple text colors |
| Newman Roofing | Ambiguous (real color, wrong specific button) | **Fixed** — exact match on "Request A Quote", cross-check-confirmed against `--secondary` |
| Family Law in Partnership | Correct | Unchanged — still correct |
| Oslo Coffee Roasters | Missing (outlined "ghost" buttons excluded by design) | **Improved, honestly incomplete** — now finds "Shop Coffee" (the right element), but correctly reports low confidence on the *color* specifically, since a ghost button has no fill to extract |
| Grace Family Roofing | Wrong (a carousel arrow icon) | **Partial, with a real trade-off** — now grabs "Contact Us", a genuine CTA-shaped button, but not the more prominent red "GET A FREE ESTIMATE" button; this page has three legitimate keyword-matching CTAs ("estimate," "contact," and "request" on a form button), and the scoring doesn't reliably converge on the most prominent one when several tie |

Net: clean, correct matches went from **1 of 9 to 5 of 9**. Zero sites now land on a completely
unrelated element (cookie banners, carousel arrows, and generic form-submit buttons are gone from
the results) — every remaining imperfect result is at minimum a real, on-topic CTA, just not always
*the* primary one when a page legitimately has more than one. That's a materially different, much
smaller class of error than before.

**A real, disclosed side effect: CTA ambiguity degrades the custom-property cross-check.** On Grace
Family Roofing, all four `--color-*` custom properties are known-correct (confirmed by direct visual
inspection both rounds — the hex values exactly match the visible red CTA, navy header, etc.). But
this round's cross-check flagged all four as *not* confirmed, because the independently-scored CTA
landed on "Contact Us" (a near-transparent ghost button) rather than the red "GET A FREE ESTIMATE"
button the custom property actually matches. **The cross-check is only as reliable as the structural
signals it compares against — when the CTA scorer picks a different-but-still-real button, a
genuinely correct custom property can get an undeserved "unconfirmed" flag.** This is a real
limitation of the cross-checking design itself, not a bug to quietly patch — worth knowing before
leaning on cross-check confirmation as a hard gate.

**Header:** improved substantially. Confirmed-good values (correct or a plausible sampled estimate)
went from 3 of 9 to 7 of 9. FIX 3's image-sampling fallback is directly responsible for turning three
prior misses (Mark Fisher Fitness, Oslo Coffee, Birds Barbershop) into plausible-to-correct results
— Mark Fisher Fitness and Oslo Coffee were visually confirmed correct. Two sites remain null: Hiut
Denim hit a real, undismissed bug (`page.screenshot: Clipped area is either empty or outside the
resulting image` — the crop rect was invalid), and Newman Roofing's header still isn't matched by
any selector at all, so there's nothing to even attempt a crop against — a real, unresolved gap in
selector coverage, not something FIX 3 could reach.

**Background/text:** stable and reliable in both rounds, as expected — FIX 4's transparent-to-white
normalization now gives those two sites (Family Law in Partnership, Grace Family Roofing) a usable
value with correctly-downgraded medium confidence instead of a raw, useless `rgba(0, 0, 0, 0)`.

**Fonts:** normalization helps, partially. `objektiv-mk1` cleanly became `Objektiv Mk1` — a real win
for a future substitution-table lookup. `circularxxweb-book` only normalized to `Circularxxweb` —
the weight suffix was correctly stripped, but the normalizer doesn't know to strip the `xx`
webfont-loader token, so it still wouldn't match `Circular` in a table without a smarter rule. **Say
this plainly: font normalization is a partial fix, not a complete one** — good enough to help on
clean cases, not yet good enough to guarantee a table lookup succeeds on messier vendor-generated
names.

**rembg re-measured with the improved logo mix — still points the same direction, still a small
sample.** Confirmed-correct raster logo retrievals across both test rounds (no double-counting
repeats): Newman Roofing, Oslo Coffee Roasters, Grace Family Roofing (unchanged both rounds) plus
Mark Fisher Fitness (newly correct this round) — **4 confirmed-correct raster logos, all 4 already
carrying a working alpha channel**, verified with Pillow. Zero would have needed rembg. n=4 is still
too small to close the question definitively, but it's now a stronger, not weaker, signal in the
same direction as the original n=3 — **the deferred decision holds.**

**Updated verdict — is the mandatory review step still warranted?** For the logo: **yes, still
mandatory** — even after the fixes, the true positive rate is around 5 of 9 (55-60%), and the
failure mode that's left (wrong asset, honestly low-confidence) still needs a human to catch it
before it ships. For the accent/CTA color: **yes, still mandatory, but the review just got
meaningfully lighter** — 5 of 9 sites now need no correction at all, and the remaining 4 need a
human to pick between real, on-brand candidates rather than reject an obviously wrong one. That's a
smaller, faster review than before, not a review that can be dropped. Background, text, and
CSS-custom-property values (when cross-check-confirmed) remain safe to ship unreviewed, as before —
with the caveat just found that an *unconfirmed* custom property isn't necessarily wrong, just
unverified, and should still get a quick glance rather than being discarded outright.

**Knock-on for Thread 3:** frame generation composites the extracted logo into the hero sequence
(see the Thread 1 → Thread 3 handoff in the token schema above). Logo retrieval is meaningfully
better but still wrong on roughly 1 in 3 sites even after these fixes — **Thread 3's logo
compositing step inherits the same mandatory-review requirement**, and should not composite a logo
into a generated hero sprite sheet without the same human confirmation gate the page-level logo
needs. This doesn't block Thread 3 from starting once Thread 1 is otherwise approved, but it does
mean Thread 3's design should treat "confirmed logo asset" as an input it receives after review, not
something it can trust straight out of extraction.

### Honest gaps — not resolved on paper, need a real test before adoption

- **Selector-based extraction hit rate: now partially measured, see Validation Results above** —
  9 real sites is enough to show clear, diagnosable breakage (especially the logo-tier ordering and
  the CTA selector's fallback behavior), not enough to produce a precise, generalizable hit-rate
  percentage. The failure patterns found are concrete and specific to what was tested; a
  differently-styled or differently-built sample (heavier CSS-in-JS sites, more app-shell/SPA
  builds, more custom non-WordPress/non-Shopify sites) could easily surface different failure modes
  not seen here.
- **`node-vibrant`'s semantic swatches → brand roles mapping is an assumption**, not validated
  against real logos of varying styles (flat vs. gradient vs. multi-color marks).
- **Path (d)'s industry-category default palette risks reading as templated**, not brand-specific,
  if 50 different no-brand plumbing companies all get visually similar output. This is a real
  product-quality risk that only real client variety (or feedback) can surface, not something
  resolvable from research alone.
- **Font-substitution table coverage is unknown** — how many distinct commercial fonts will
  realistically appear across real client sites, and whether ~30-50 entries is enough for a good
  hit rate, isn't determinable without testing against real data.
- **rembg's inference cost/latency in this pipeline is unmeasured** — whether local background
  removal is fast enough to run synchronously in the generation flow, or needs to be async/queued,
  is unknown until it's actually run.
- **Nothing here has been run against a single real client website.** This entire thread is
  research and design, exactly as scoped — the next step, if approved, is a small build against a
  handful of real, diverse sites before treating any of the above as settled.

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

### RESOLVED (2026-08-04): Flipbook Alternative to Live Three.js — native CSS adopted for scrubbing

Fabio's note, 2026-08-04: award-tier "self-building" scroll effects (e.g. a building assembling
as the user scrolls) are typically *not* live 3D. Sites like Apple's product pages use a
FLIPBOOK — a pre-rendered image sequence flipped through on a `<canvas>`, driven by scroll
position via GSAP's `ScrollTrigger` (scrub mode) plus Lenis for smooth scroll. Looks like video,
but scrubs exactly to scroll position. Originally proposed stack: GSAP (ScrollTrigger, scrub) +
Lenis + Three.js reserved only for scenes that must be genuinely interactive.

**Why this bears on the scaling problem already documented above:** the "Hero-object category
palette" and glass-overexposure entries above show real per-project cost — HDRI/PBR tuning, a
glass-material bug hunt, a mesh-vs-raycast debugging session just to find which mesh was actually
responsible for a visual defect. A flipbook needs none of that tuning at generation time: render
the frame sequence once per client (their building, product, etc.) into a folder of numbered
images, then reuse one shared canvas + scroll-scrub engine across every generated site. The engine
never changes; only the frames do. That fits a generator producing many sites better than
hand-tuning a live 3D scene per client — which is exactly the gap this note calls out ("live
Three.js must be hand-tuned per project → doesn't scale").

**The question this reopened:** "Why GSAP was considered and rejected" in UI Craft below was
based on avoiding dependency/version-drift failures, evaluated against reveals/parallax — which
native CSS `animation-timeline` covers at zero dependency cost. Flipbook scroll-*scrubbing* (frame
index tied continuously and frame-accurately to scroll offset) is a materially different animation
category than reveals/parallax, and it was not established whether native CSS could drive that.

**Settled with a real spike, not assumption.** Built two working implementations of the identical
96-frame placeholder sequence (a block-tower assembling), side by side, in
`C:\Jarvis\spikes\flipbook-scrub\` (throwaway, not part of the generator):
- **A — native CSS only:** sprite-sheet `background-position` stepped via `steps(95, jump-none)`,
  driven by `animation-timeline: scroll(root block)`. Zero JS for the animation itself.
  (Canvas content cannot be driven by CSS at all — CSS has no property that invokes a `drawImage`
  call, so "drive a `<canvas>` via pure CSS" is a category error, not a maturity gap. The
  background-position sprite-sheet technique is the actual zero-JS mechanism CSS permits, and is
  visually equivalent for this use case.)
- **B — GSAP ScrollTrigger (`scrub: 0`) + Lenis + canvas,** individual PNG frames, matching the
  originally-proposed stack exactly.

**Findings:**
- **Frame accuracy: tie, both exact.** Sampled at 10/25/50/100% scroll (instant jumps, including
  reverse-direction jumps back to a previously-sampled point) — both implementations landed on the
  mathematically exact frame every time (e.g. exactly frame 048 at 50%, exactly frame 095 at 100%
  with no overshoot), with zero drift and zero hysteresis on reverse. This tie is real but
  conditional: it holds because GSAP was deliberately configured `scrub: 0` (no smoothing) for a
  fair comparison. Both `scroll()` timelines and `scrub: 0` are, by spec/design, pure functions of
  scroll offset — neither can drift regardless of scroll speed or direction. A production GSAP
  setup would likely use `scrub: 0.5–1+` for a smoothed feel, which *does* introduce lag — a
  stylistic choice, not a capability gap. Lenis also smooths raw scroll input itself (separate from
  scrub), which real usage would want and which has no zero-dependency CSS equivalent.
- **Smoothness/jank: not rigorously measurable in this environment, disclosed rather than guessed.**
  The automated test tab ran with `document.hidden = true`, which suspends `requestAnimationFrame`
  and scroll-timeline recalculation except when a compositor frame is explicitly forced (e.g. a
  screenshot) — confirmed directly (a tight synchronous scroll+read loop never updated the timeline
  at all). A real verdict needs on-device DevTools performance profiling with a focused, visible
  tab. Architecturally, neither has an inherent edge: CSS `background-position` steps require a
  main-thread repaint per step (not a compositor-only property like `transform`/`opacity`), and
  canvas `drawImage` also costs a main-thread paint per frame — same cost class, no a priori winner.
- **File weight: A wins decisively.** Sprite sheet (A, 1 file, 96 frames): **100.1 KB**. Individual
  PNG sequence (B, 96 files, identical visual content): **269.0 KB** (96 separate HTTP requests,
  2.7x larger — PNG header overhead × 96 plus lost cross-frame compression redundancy). GSAP core +
  ScrollTrigger + Lenis: **132.7 KB raw / 50.4 KB gzip**, real numbers from `npm install`, not
  estimated. B's total: ~400 KB more per generated site than A. Caveat for fairness: the
  sprite-sheet-vs-individual-files gap is a format choice, not an inherent GSAP limitation — B
  could also use a sprite sheet, which would close that specific portion of the gap and leave only
  the ~133 KB dependency weight as B's real cost.
- **Browser support: verified current, sharpened 2026-08-04 with a per-feature check against our
  actual CSS, not a generic "animation-timeline support" figure.** Chrome/Edge since 115
  (Jul 2023). **Safari since 26 (Sep 2025)** — shipped, *not* the disqualifying gap originally
  worried about. Firefox is the real gap, and the question worth asking precisely was: does
  `a-native-css.html` even touch the sub-features that are furthest behind, or just the mature
  core? Checked line by line against `a-native-css.html` and cross-referenced against raw MDN
  browser-compat-data (fetched directly, not summarized) plus Firefox's own tracking bug:

  | Feature | Used by our implementation? | Firefox status |
  |---|---|---|
  | `animation-timeline` property | **Yes** — the only property from this spec family we use | Not shipped to Release/Beta/Dev Edition (raw BCD: `"version_added": "preview"`, no flag entry — Nightly-tier only) |
  | `scroll()` functional notation | **Yes** — `animation-timeline: scroll(root block)`, no named timeline | Same status as above (BCD groups it with the base property) |
  | `steps()` easing | **Yes** — but this is CSS Animations Level 1, unrelated to the scroll-driven-animations spec entirely | Universally supported for years, not part of this compat question at all |
  | Named `scroll-timeline-name` / `scroll-timeline-axis` | No | Same "preview"-tier status — moot for us either way |
  | `view()` / `view-timeline-*` | No | Same status — moot |
  | `timeline-scope` | No | Same status (tracked in Firefox bug 1676779) — moot |
  | `animation-range` / `-start` / `-end` | No | Same status, also separately flagged as its own unimplemented piece — moot |

  **This is a less forgiving finding than "behind a flag," not a more forgiving one.** Our
  implementation already uses the minimum possible surface from this spec — bare `scroll()`, none
  of the named-timeline/range/scope extras. That minimalism doesn't help here, because the raw BCD
  data shows even that minimal core (`animation-timeline`, `scroll()`) has no `flags` entry for
  Firefox at all — its `version_added` value is `"preview"`, meaning Nightly-channel only, not
  reachable via `about:config` in Release, Beta, or Developer Edition. This conflicts with secondary
  sources (including MDN's own aggregate Experimental Features page as fetched earlier) that
  describe it as "off by default behind `layout.css.scroll-driven-animations.enabled` in stable" —
  implying at least an opt-in path for technical users. The sources disagree on the exact mechanism;
  they do **not** disagree on the outcome that matters here: an ordinary Firefox visitor, on
  Release, Beta, or Developer Edition, gets the animation in neither telling of it. Global usage
  of the broader animation-timeline feature is ~84%, which already prices in Firefox being
  unsupported — it is not a "some Firefox users get it" number.
  **Verdict: does `a-native-css.html` run as-written in stable Firefox today? No.** And there is no
  narrower CSS rewrite that dodges this — `scroll()` (or an equivalent named `scroll-timeline`,
  which carries the identical support status) is the only way to construct a scroll-linked CSS
  timeline at all, so the feature we depend on is the exact one that's missing, not a peripheral
  extra we could trim. Practical consequence: the `@supports (animation-timeline: scroll()) { }`
  fallback will fire for **essentially every real Firefox visitor**, not rarely as the previous
  version of this note implied.
  **Fallback behavior (reasoned from spec, not directly observed — no Firefox available in this
  test harness):** an unsupported browser drops the invalid `animation-timeline` declaration, and
  with this CSS's implicit 0s duration + `both` fill-mode, the element would silently freeze on the
  *last* keyframe (fully-assembled state), not frame 0, and not scroll-linked. The
  `@supports (animation-timeline: scroll()) { }` progressive-enhancement pattern already mandated
  elsewhere in this note's UI Craft section is not optional polish here — it is required, and given
  it will be the *normal* Firefox experience rather than a rare degradation, the unconditional base
  state deserves a deliberately chosen static frame (most likely the fully-assembled hero shot, not
  an arbitrary mid-sequence one) treated as a first-class designed state, not an afterthought.
- **Code complexity: A wins decisively.** A's entire mechanism is ~15 lines of CSS, 0 lines of JS,
  no image-preload bookkeeping (the browser handles one declarative background-image). B needs
  ~45–50 lines of JS (image-array preload with onload handlers, Lenis/ticker wiring, ScrollTrigger
  config, a dedupe-on-change draw function) plus 3 vendored files to version-pin and keep in sync
  per site, forever.

**Recommendation: adopt native CSS (implementation A) for scroll-scrubbing, with mandatory
`@supports` progressive enhancement for the Firefox gap — held after sharpening the Firefox
finding, not despite it.** The 2026-08-04 per-feature recheck above found the Firefox gap is worse
than first stated (essentially every Firefox visitor, not a rare edge case), and that finding was
weighed honestly, not minimized, before keeping this verdict. It holds because none of the other
axes moved: frame accuracy is still a measured *tie*, and B still reintroduces the exact
dependency-management surface area (3 files to vendor and keep in sync across every generated
site, forever) that the original rejection specifically existed to avoid — for every visitor, not
just non-Firefox ones. A guaranteed, well-designed static fallback for a real but definable slice
of traffic is a materially different, smaller problem than reintroducing an ongoing
dependency-drift risk for 100% of traffic on every generated site. The core technical uncertainty
this question was opened to resolve — can native CSS drive frame-accurate scroll-scrubbing — is
answered yes, unambiguously, when configured correctly (`steps(n, jump-none)` + `scroll()`).
Marking this **RESOLVED** on that basis, with the Firefox fallback promoted from a footnote to a
required, first-class deliverable of adopting this approach (see below).

**Where this would be wrong** (residual, disclosed, not swept under the rug):
- If real on-device profiling (not available in this test harness) shows CSS background-position
  repaints are meaningfully janker than canvas `drawImage` in practice — plausible, unmeasured
  either way here.
- **Sharpened 2026-08-04 — this is no longer a "Firefox-heavy client" edge case; it's the default
  Firefox experience on every generated site.** The frozen-last-frame fallback isn't a rare
  degradation to accept for unusual traffic mixes; it is what *every* Firefox visitor sees, on
  every site, until Firefox ships this outside Nightly. That changes what "adopt native CSS" has
  to include: the static fallback frame is not optional polish, it's a required, deliberately
  designed piece of every generated site's hero, on the same footing as the animated version — not
  something to leave as an implicit side effect of an unsupported CSS declaration. If a specific
  client's audience is verifiably Firefox-majority (checkable via their existing analytics, not
  assumed), that's the case to reconsider B or a hybrid for that one site rather than as a general
  policy.
- If a future requirement needs JS hooks keyed to specific frames (e.g. "reveal the CTA at frame
  47"), pure CSS has no natural hook without adding JS anyway — at that point a **hybrid** (CSS
  drives the frame number as the source of truth via an animated custom property; minimal vanilla
  JS polls it via `requestAnimationFrame` and reacts, zero libraries) is the better fit than
  reaching for the full GSAP+Lenis stack.
- The 269 KB vs 100.1 KB asset-weight gap partly reflects B using individual files per the
  originally-proposed stack, not a re-test with B on a sprite sheet too — re-run before treating
  that specific number as final if B is ever reconsidered.

**Adopted pipeline (supersedes the GSAP-based proposal below, which stays for historical record):**
1. Generate/render the frame set for the client (their building, product, etc.) into a single
   sprite-sheet image, not individual files (per the measured file-weight finding above).
2. Drop the sprite sheet into a shared `background-position` + `steps()` + `animation-timeline:
   scroll()` template — the engine never changes, only the sprite sheet does.
3. Wrap in `@supports (animation-timeline: scroll()) { }` with an unconditional static-frame base
   state, per the browser-support finding above.
4. Ship.

**Original GSAP-based proposal (historical, not adopted — kept for context):**
1. Generate/render the frame set for the client (their building, product, etc.)
2. Drop frames into a shared canvas + GSAP ScrollTrigger scrub template
3. Ship — the engine never changes, only the frames do

**Perf notes from the source note (still apply to the adopted CSS pipeline):** preload frames (a
single sprite-sheet image preloads as one request); passive scroll listeners are moot for the CSS
approach (no scroll listener at all); only redraw when the frame index actually changes is
inherent to `steps()` (it only updates at step boundaries by construction).

**Archetype library, if adopted (Fabio's note, 2026-08-04):** one shared flipbook engine, swappable
frame sets — Jarvis picks an archetype from the business type at generation time rather than a
human choosing per-project. Five archetypes cover physical businesses; a sixth covers businesses
with nothing physical to film/render.

1. **ASSEMBLE** — something builds itself. → construction, architecture, furniture, craft/trades.
2. **REVEAL** — elements fall/drop into place. → food, cosmetics, product/CPG brands.
3. **SPIN** — a hero product rotates in space. → retail, tech, automotive.
4. **FLYTHROUGH** — camera glides through a space. → real estate, hotels, gyms, venues.
5. **TRANSFORM** — before/after morph. → renovation, fitness, beauty.
6. **INTERFACE** — dashboards/UI/data coming alive (numbers count up, panels slide in, bespoke
   illustrations); for things that can't be photographed. → SaaS, fintech, agencies, consultants.

Selection rule: physical business → archetype 1-5 by category fit; invisible/software business →
archetype 6. This is the piece that would let archetype selection itself be automated rather than
hand-picked — consistent with the "engine never changes, only the frames do" scaling argument
above, extended one level further: even the *choice* of frame set follows a fixed rule instead of
per-project judgment. Still gated on the same open question above (this doesn't get built until
the flipbook-vs-GSAP evaluation is resolved).

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
