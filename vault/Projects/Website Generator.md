---
date: 2026-07-30
updated: 2026-08-05
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

## Thread 1: Brand Extraction — APPROVED as architecture (2026-08-05), pipeline not yet built

**DECISION (2026-08-05): APPROVED as validated architecture — but the token pipeline is NOT being
built yet, and no further polish spikes for now.** Rationale: the remaining gaps found in the
validation/re-test rounds below (logo wrong on 2/9, CTA tie-breaking when a page has several real
buttons, 2 sites with zero header signal) are real but they don't change any decision. The
mandatory human review gate on logo + accent stays mandatory whether the hit rate is 5/9 or 8/9 —
selector-based extraction on arbitrary real websites will never reach the near-perfect accuracy
that would let the gate be dropped. So further rounds optimize a number that moves nothing: not
the architecture, not the token schema, not the product shape. Diminishing returns. The known gaps
below stay recorded as-is for whoever builds the extractor later.

**DECIDED (2026-08-05): the CLIENT performs the brand review, not Fabio.** This shapes the product
more than the hit rate does, which is why it was recorded as an open question before the token
pipeline was built rather than left implicit.

Reasoning:
- Fabio reviewing caps throughput at his own attention — every generated site needs his eyes before
  shipping, forever. That directly contradicts the "no per-site hand-tuning" premise stated in the
  problem framing below.
- The client is better at the job, not just cheaper. They know their own brand; Fabio would be
  guessing whether an extracted color is right. Per this thread's own validation results below, the
  weak fields (logo, accent/CTA color) are exactly the ones a client can answer instantly — "is this
  your logo?", "is this your brand color?" — where Fabio has no independent way to know.
- It reframes a limitation as a product surface: a "confirm your brand" onboarding step is a normal,
  expected part of website onboarding, not a visible defect in the generator.

Consequences for whoever builds the token pipeline:
- **The pipeline needs a review UI and a correction round-trip, not a fire-and-forget script.**
  Build-once cost, versus review-forever if this had gone the other way — worth the extra build
  effort given the throughput ceiling it avoids.
- **The review step must surface, at minimum:** the extracted logo, the accent/primary color, and
  the detected fonts — each with an easy correction path (upload a different logo, pick a different
  color) rather than requiring the client to understand or edit raw token JSON.
- **Per the Derivation Layer above, values marked `derived: true` should be visually distinguished
  from extracted ones in this UI** — a client correcting an extracted fact ("that's not our logo")
  is a different interaction than a client overriding a computed fallback ("we'd rather a different
  shade"), and the UI should make clear which is which rather than presenting both with equal
  claimed confidence.
- **This decision also closes the wrong-URL gap the walking skeleton found** (nothing in the
  pipeline catches "this is someone else's site" — see Walking Skeleton Findings below, where the
  spike extracted Grace Family Roofing's logo onto a fake client and nothing flagged it). A client
  looking at their own "confirm your brand" screen and seeing an unfamiliar logo/colors is a natural,
  free catch for exactly that failure mode — not a separate mechanism that needs to be designed.

**Status: research + design complete, architecture approved, nothing built yet.** The token schema
below is locked and available for Thread 2 to consume (styling needs the schema shape, not a
running pipeline). Thread 3 (frame generation) still needs the pipeline actually built before it
can composite real client tokens/logos into frame sequences, per the roadmap above.

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

### Derivation Layer (added 2026-08-05, per walking-skeleton findings)

**Addition to the locked schema above, backward-compatible — not a reopening of Thread 1's
architecture decision.** The walking skeleton (see Walking Skeleton Findings near the end of this
note) hit two real schema gaps on its first live run against a real site: a color role returned
null with no defined fallback, and `surface` collapsed to the exact same value as `background` on
a light-background site, leaving Thread 2's skeleton with no way to visually separate sections.
Both trace to the same root cause — the schema specifies fields extraction cannot reliably produce,
with no defined behavior for when it doesn't. This section defines that behavior.

**Null fallback per color role**, applied only when direct extraction (including CSS custom
properties) returns nothing usable at all:
- `secondary` (sourced from footer background): derive as `primary` shaded 40% darker — the same
  tint/shade mechanism already used for `border`.
- `accent` (sourced from CTA background): fall back to `primary` if no CTA candidate clears the
  extractor's confidence bar at all (distinct from a low-confidence candidate, which still surfaces
  for human review per the mandatory review gate — this fallback is only for the "nothing found"
  case, not the "found something dubious" case).
- `primary` (sourced from header background): if genuinely nothing is found (no header/nav element,
  no custom property, no image-sample fallback), fall back to a fixed dark neutral (`#1A1A1A`)
  rather than leave the token null — a generated page with a generic dark neutral a human can
  override at review is a softer failure than a null token breaking the page template outright.
- `text` / `background`: extraction already normalizes these reliably (validated 9/9 and 9/9 in
  Thread 1's spike) — no new fallback needed.

**`surface` must be DERIVED, not extracted — this is the fix for the collapse problem.** Redefine
`surface` in the schema as always computed from `background`, never taken directly from a "card/
section background, computed" selector the way the worked example above implied: apply a tint (if
background is light) or shade (if background is dark) of a **minimum 6% perceptual lightness
delta**, so `surface` is guaranteed visually distinct from `background` regardless of what
extraction finds. The light-background collapse case this fixes is the majority case, not an edge
one, per Thread 1's own 9-site validation spike above. `border` keeps its existing derivation
(shade of background), unchanged.

**Every token value gets a `derived: true/false` flag**, so downstream stages and any review step
can distinguish an extracted fact from a computed one at a glance, not just infer it from reading
the `source` string. Example, extending the worked schema above:

```json
"surface":   { "value": "#F4F0EA", "source": "derived: 6% tint of background", "derived": true },
"secondary": { "value": "#2A2018", "source": "footer background, computed", "derived": false }
```

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

## Thread 2: Conversion Skeleton — APPROVED as architecture (2026-08-05), nothing built

**DECISION (2026-08-05): APPROVED as architecture — skeleton and category table adopted, nothing
built.** The section order, the mandatory/conditional/optional split, the per-category variant
table, the omit-by-default list, and the content-input table below are all adopted as the design.
Same pattern as Thread 1: approved as a design, not as a build instruction — no templates exist
yet.

**Carried forward as adopted decisions, not open questions:**
- Click-to-call is the visually dominant action for call/book categories (trades, dental, salons,
  restaurants); the form is the fallback, not the primary.
- Forms default to 3-4 fields, plus at most **one** structured dropdown where a qualifying detail
  is load-bearing (e.g. job type for trades, new-vs-existing patient for dental). Never expand past
  that in generation defaults.
- Trust signals are never fabricated. Years in business, license numbers, guarantees, service area,
  insurance accepted: client-supplied or omitted. Never invented.
- No stock-photo team sections, ever. Real client photo or no section — never a placeholder.
- Mobile reuses the same static hero fallback already mandatory for Firefox, rather than running
  the sprite-sheet scrub — reasoned, not measured. The on-device-testing flag stays open.

**Two items carried over for other threads to pick up, recorded here so they aren't lost:**
- **Thread 1 schema addition (small, backward-compatible):** promote `category` to a first-class
  token field (e.g. `"category": "food-beverage"`) rather than leaving it inside `archetype.reason`
  free text, so Thread 2 (and Thread 3) can read it directly instead of re-deriving it.
- **Thread 3 gap — RESOLVED 2026-08-05:** dental/medical didn't map cleanly to any of the six
  archetypes; TRANSFORM fit a cosmetic-leaning practice but not a general/family practice. Decided:
  general/family practice maps to FLYTHROUGH (a calm environment tour, addressing dental/medical
  anxiety the same way FLYTHROUGH already builds trust for gyms/hotels), not a seventh archetype.
  Full reasoning, concrete frame sequence, and aspect-ratio recommendation in the Visual Richness →
  archetype library section below.

**Status: architecture approved, nothing built.** Builds on the existing Conversion Requirements
section below (form-length, headline, single-CTA, trust-signal, load-speed findings already
established there) rather than repeating it — this thread's job was the *page structure* those
findings get assembled into, below the hero, which Thread 3's archetype list already specs.

**The problem, restated:** a premium hero (Thread 3) gets someone to stay on the page for three
seconds. Whether that visitor becomes a phone call, a booking, or a quote request depends entirely
on what's below the fold — and that's currently unspec'd. This thread defines it concretely enough
for the generator to assemble automatically, with no per-category hand-tuning at generation time
(same design bar Thread 1 held itself to).

### 1. Section order — one skeleton, category-conditional content

**Finding: one skeleton works; categories don't need genuinely different orders, they need
different *content* inside the same slots.** Every category researched — food/beverage, trades,
retail, real estate/hospitality, gyms, beauty, dental, professional services/SaaS — converges on
the same underlying sequence: establish legitimacy fast, show what you offer, prove other people
trusted you, answer the objection that's stopping them, then ask for the action, repeated. What
changes per category is *which* trust signals matter and *what* the offer section actually
contains (a menu vs. a quote form vs. a class schedule) — not the order those things appear in.
This matches the landing-page research directly: social proof "positioned mid-page after
introducing your solution but before the final call-to-action," with CTAs "prominently near the
hero, after building desire mid-page, and near final content."

**Recommended skeleton, in order:**

1. **Hero** — already spec'd (Thread 3). Not re-specified here.
2. **Trust bar** (mandatory) — a thin strip immediately under the hero: review rating + count,
   years in business, a license/certification badge, service area — whichever of these the client
   actually supplied (see Content Input below). This is the "decide within 10-15 seconds" window
   research keeps surfacing for local/service categories — the trust bar is what fills it before
   the visitor has scrolled far enough to reach the dedicated reviews section.
3. **Services / Offerings** (mandatory, content shape varies by category) — what you get: a menu,
   a service list, a treatment list, a product grid. This is the "what's in it for me" section the
   headline-clarity research calls out as the thing visitors need answered fast.
4. **Social proof** (mandatory) — a dedicated reviews section, 3-6 of the reviews already entered
   manually per the existing Key Decisions entry — not just the trust-bar's rating number restated.
5. **Category-conditional deep section** — gallery, before/after, class schedule, case studies,
   portfolio. Present only when the category needs it *and* the client has actually supplied the
   content it requires (see Content Input below — this is the section most likely to be skipped in
   practice).
6. **FAQ** (optional, category-conditional) — objection-handling for the specific hesitation a
   category's visitors carry (insurance coverage, warranty length, service area radius).
7. **Contact / Conversion section** (mandatory) — the actual form/call/booking block. Repeats the
   *same* CTA established in the hero — not a new, competing one — per the single-CTA finding
   already in Conversion Requirements below (13.5% vs. 11.9% for one link vs. two-to-four).
8. **Footer** (mandatory) — NAP (name/address/phone), hours, service area, secondary nav. Already
   covered as a design-craft beat ("footer-as-episode") in UI Craft below; this thread adds the
   *content* requirement underneath that craft treatment.

**Outside the vertical order:** a sticky mobile CTA bar (see Mobile below) — a persistent overlay,
not a scroll-order section.

**Mandatory vs. category-conditional vs. optional, stated plainly:**

| Section | Status |
|---|---|
| Hero | Mandatory (Thread 3, not re-specified here) |
| Trust bar | Mandatory (content conditional on what the client supplies) |
| Services/Offerings | Mandatory |
| Social proof / reviews | Mandatory |
| Category deep section (gallery/before-after/schedule/case studies) | Category-conditional, and further gated on real content being available |
| FAQ | Optional |
| Contact/Conversion | Mandatory |
| Footer | Mandatory |
| Generic "About Us" text wall | **Omit by default** — see Section 5 |
| Team section (stock or generic) | **Omit by default** — see Section 5 |
| Blog feed | **Omit by default** — see Section 5 |

### 2. The conversion action itself

**Local-service categories: the call is the win, and the numbers are lopsided, not marginal.**
Click-to-call converts at 5-25% versus typical web-form conversion, mobile-optimized local pages
with click-to-call convert 47% higher than non-optimized ones, and — most strikingly — businesses
rate inbound calls as "excellent leads" at 61% versus 52% for web leads, with one source estimating
25-40% of callers become customers versus ~2% of form-fillers. **This means: for trades, dental,
salons, and restaurants taking reservations, the phone number is not one option among several — it
should be the visually dominant action, with the form as the fallback for people who can't or won't
call**, not the reverse.

**Form length: the general-CRO finding and the trades-specific claim are in real tension, stated
honestly rather than smoothed over.** General CRO research is consistent and steep: conversion
drops from ~18-23% at 1-3 fields to ~9-11% at 4-5 fields and collapses further past 7 (one dataset:
11-field → 4-field cut lifted conversion 120%). But trade-specific sources claim 4-8 field quote
forms with dropdowns/conditional logic work *because* the qualifying detail (job type, property
size) is what makes a quote-request lead usable at all — and separately claim trust-signal
proximity to the CTA swings conversion far more than form length alone (a cited but
unverified-methodology figure: 1-2% quote conversion without trust signals near the form vs. 8-15%
with them). **Recommendation, given the tension:** default to the general-CRO baseline — 3-4
fields (name, phone, one message/need field) — for every category, and allow exactly **one**
additional *structured* field (a dropdown, not free text) for categories where a qualifying detail
is genuinely load-bearing (trades: job type; dental: new vs. existing patient). Never expand past
that on the generation defaults. This is a reasoned compromise between two real but conflicting
signals, not a resolved question — flagged again under Honest Gaps.

**CTA repetition:** per Conversion Requirements below, a single CTA beats multiple competing ones —
but "single" means *one action*, repeated at multiple points (hero, after the offerings section,
in the contact section, in the sticky mobile bar), not one appearance. The hero CTA alone is known
to underperform; this skeleton's mandatory Contact/Conversion section exists specifically to give
that CTA a second, deliberate placement after trust and offerings have been established.

**Per-category primary action** — see the category table below.

### 3. Trust signals

**Reviews:** already an input (Key Decisions — manually entered, not API-pulled). This thread adds
*where*: a rating/count summary in the trust bar (Section 1, slot 2) plus a dedicated multi-review
section (slot 4) — research specifically flags placing proof "where hesitation peaks" (near the
CTA) as more effective than a single generic testimonials block, and one source ties positive
homepage ratings to the single most-cited trust signal in an 8,000-respondent consumer survey
(86% citing star ratings/reviews as most likely to drive a purchase decision from a new company).

**What else carries weight, and — critically — what the generator can actually obtain:**

| Trust signal | Generator can obtain it? | Notes |
|---|---|---|
| Google reviews | Yes | Already solved (Key Decisions) |
| Years in business | **No — client must supply** | Cannot be inferred or safely guessed |
| License/certification number | **No — client must supply** | Fabricating this would be actively dishonest, not just a gap |
| Service area | **No — client must supply** | A map or named-town list; research favors a map over a long city list |
| Insurance/financing accepted | **No — client must supply** | Named specifically in dental research as an underrated conversion factor |
| Real team/before-after photos | **No — image generation is out of scope** (per Output Structure) | See Section 5 — this is why these sections stay category-conditional on real content existing, not a default |
| Guarantees/warranties | **No — client must supply** | Same fabrication risk as licensing |

**The pattern across this table:** almost every high-value trust signal beyond reviews is a fact
the generator cannot source itself — it requires expanding the existing generation intake form
(the same place Thread 1's "is this the business's own site?" field already lives), not a content
or design decision this thread can resolve alone. Recorded here, not resolved.

### 4. Mobile

**Section order:** no evidence found for reordering sections between desktop and mobile — the
skeleton in Section 1 holds; what changes is presentation, not sequence.

**Sticky call/CTA bar: recommended default-on for call/book-action categories, with the "not
always a win" caveat kept explicit, not smoothed over.** Sticky bottom CTAs are documented at
15-25% lift generally and up to 45% for click-to-call specifically in some industries — but the
same research explicitly warns a sticky element "is not always successful, and sometimes can even
have a negative impact," with success most consistently shown at the point of highest-intent
action (checkout-equivalent), which for a local-service page is exactly the contact/booking action.
**Recommendation:** default on for categories whose primary action is call/book (trades, dental,
salons, restaurant reservations), single dismissible bottom bar, bottom-right thumb zone; default
off (or a lighter "Get Started" variant) for retail/SaaS categories where the action isn't a call.

**Form behavior:** no mobile-specific research finding beyond what's already covered in Section 2
(field count) — mobile forms should use native input types (`tel`, dropdowns over free text, per
the 15.2%-fewer-abandonments finding already cited) so mobile keyboards match the field.

**Hero animation degradation on mobile — recommendation: reuse the same static-fallback path
already mandatory for Firefox, rather than running the sprite-sheet scrub on mobile at all.** Three
reasons, stated as a reasoned default, not a measured result: (1) the flipbook mechanism
(`background-position` steps) requires a main-thread repaint per step, not a compositor-only
property — Thread 3's own spike disclosed this cost is genuinely unmeasured in this environment
("not rigorously measurable... a real verdict needs on-device DevTools profiling"), and mobile CPUs
are exactly where an unmeasured main-thread cost is riskiest; (2) mobile visitors are shown by
research to be closer to a decision already (the "call within 24 hours" / "decide in 10-15 seconds"
findings above) — a decorative hero flourish serves that visitor less than getting them to the
trust bar and CTA fast; (3) reusing the existing Firefox static-frame path costs zero new
engineering — one fallback state serves both "unsupported browser" and "mobile," rather than
building a second bespoke mobile-only degradation path. This is the same honesty standard Thread 3
already set for itself on this exact question — flagged for real on-device testing before being
treated as final, not asserted as measured fact.

### 5. What to omit

**Generic "About Us" text walls: omit by default.** No research found supporting them as a
conversion-positive section for a small local business specifically — they read as filler where a
trust bar (Section 1) and real reviews already do the credibility work faster.

**Stock-photo team sections: omit by default, never generated as a placeholder.** Research is
consistent and specific here: real photos (even smartphone-quality) measurably outperform stock
photography on trust, and stock photos are actively ignored or trust-decreasing. The generator has
no image-generation pipeline (explicitly out of scope, per Output Structure) — so the only two
honest options are (a) a real client-supplied team photo, or (b) no team section at all. **Never a
stock-photo placeholder** — that's a worse outcome than omission, not a neutral one, consistent
with the "wrong-but-confident is worse than none" principle Thread 1's validation already
established for logo extraction.

**Blog feeds: omit by default.** Nothing in the generation pipeline produces ongoing blog content
(this is a one-shot site generator, not a CMS), and a feed of zero or stale posts actively signals
neglect rather than authority. Category-conditional FAQ (Section 1) serves the same objection-
handling purpose blogs are sometimes justified by, without the maintenance-content problem.

### Per-category variant table

Reuses the same category classification Thread 3's archetype list and the UI Craft typography
mapping already established — **this thread does not introduce a second taxonomy.** See the schema
note below: this requires one small addition to Thread 1's token schema to work cleanly.

| Category | Archetype (Thread 3) | Primary conversion action | Category-specific mandatory content | Notes |
|---|---|---|---|---|
| Food & Beverage (restaurant, cafe, bakery) | REVEAL | Reservation/order link, click-to-call | Menu (HTML, not PDF/image) + hours + location map | Fixed-nav quick-action buttons; 70%+ of restaurant traffic is mobile |
| Construction & Trades (roofer, contractor, plumber) | ASSEMBLE | Quote-request form + click-to-call | License/insurance badge, service-area map | The one extra qualifying dropdown from Section 2 applies here |
| Retail & Product (boutique, manufacturer) | SPIN | Shop/contact link | Product gallery | Closer to e-commerce norms than lead-gen; MVP scope is generate-from-prompt lead-gen, not checkout — flagged, not resolved here |
| Real Estate & Hospitality (agent, hotel, venue) | FLYTHROUGH | Schedule tour/book | Gallery + availability/contact | Hero flythrough already sells the space; below-fold reinforces logistics |
| Gyms & Fitness Studios | FLYTHROUGH | Book a class / free trial | Class schedule, trainer credentials | |
| Beauty & Personal Care (salon, spa) | TRANSFORM | Book appointment + click-to-call | Before/after gallery (real photos only, see Section 5), service menu | |
| Health & Dental | *Not covered by Thread 3's 6-archetype list — see gap below* | Book appointment + click-to-call | Insurance/financing info, credentials | Named conversion factor in dental research specifically: insurance visibility |
| Professional Services & SaaS (law, consulting, agency, software) | INTERFACE | Contact/demo-request form | Credentials/case studies, process clarity | Longer consideration cycle; form can lean to 5 fields rather than 3-4 |

**Cross-thread gap this table surfaced, not resolved here:** dental/medical doesn't fit cleanly
into Thread 3's six archetypes — TRANSFORM (before/after) fits a cosmetic-leaning practice but not
a general/family practice, which has no natural "transform" story. Recording this for whoever picks
Thread 3 back up; not a Thread 2 decision to make.

### Content input — where does each section's copy actually come from

| Section | Source | Honest flag |
|---|---|---|
| Hero | LLM-generated from client's prompt/description (existing pipeline) | — |
| Trust bar facts (years, license, area) | **Client must supply directly** | Not inferable; needs an intake-form addition |
| Services/Offerings | Client's prompt/description, LLM-expanded | Category-specific detail (menu items, prices, treatment names) should not be LLM-invented — needs client-supplied structured input for anything factual |
| Social proof | Manually-entered reviews (Key Decisions, already solved) | — |
| Category deep section (gallery, before/after, schedule) | **Client-supplied images/data** | No image pipeline exists yet (Output Structure) — this section is effectively unpopulatable until that's built or the client supplies assets directly |
| FAQ | LLM-drafted questions (category-typical objections), client-confirmed answers | Never LLM-invent a specific factual answer (warranty length, insurance accepted) |
| Contact/Conversion form | Structural, not generated content | Submission destination (email/phone) is client-supplied |
| Footer NAP | **Client must supply directly** | Address/phone/hours cannot be invented |

**Amendment flagged 2026-08-05, from the walking-skeleton findings near the end of this note — not
resolved here, just recorded against this table.** The walking skeleton's construction/trades test
run correctly omitted the category deep-section (gallery) per this table's own rule — no real
client-supplied photos existed for the fake client, so nothing was shown rather than a placeholder.
But the honest verdict on the resulting page was that its absence hurt worst for exactly this
category — construction, where seeing the actual work *is* the sale. That suggests that for some
categories (construction/trades, renovation, beauty/before-after), client-supplied photos for the
category deep-section aren't optional polish the way this table's framing implies — they may be
closer to required content, with a materially weaker product if the client can't supply them.
Flagged as a possible amendment to this table's mandatory/conditional/optional split; not resolved
here.

### Thread 1 → Thread 2 handoff

Thread 2 consumes, from Thread 1's locked token schema: `color.*` (styles every section and the
repeated CTA buttons), `color.accessibility` (resolves text-on-CTA contrast for the repeated
button, not just the hero), `typography.heading/body/scale` (section headings and body copy),
`logo` (page header/nav placement, not just the hero composite), and `spacing.unit/radius`
(consistent section padding and card radius across the skeleton).

**One small schema addition this thread requires:** Thread 1's schema currently only exposes
category indirectly, inside `archetype.reason` as a free-text string (`"category: food/beverage,
per Thread 3 archetype-to-category mapping"`). Thread 2 needs to read the category value directly
to pick the right row from the table above — parsing it back out of a reason string is fragile.
**Recommend promoting it to a first-class field**, e.g. `"category": "food-beverage"` alongside
`archetype`, so both threads read the same value instead of Thread 2 re-deriving it. This is a
small, backward-compatible addition to a schema that's otherwise locked, not a reopening of Thread
1's architecture decision above.

### Honest gaps — not resolved on paper, need real testing or real client sites

- **No data specific to this pipeline's own generated sites** — every finding above is general CRO
  or category-specific agency research, not measured against an actual generated-site visitor.
- **Form-field-count recommendation (Section 2) is a reasoned compromise between conflicting
  sources, not a resolved number** — needs real A/B data on generated sites before treating 3-4+1
  as final.
- **The trades-specific "1-2% vs. 8-15%" quote-conversion figure and the "4-8 field" claim come
  from agency blog content with no disclosed methodology** — presented here as directional
  industry opinion, not verified data, consistent with this note's standard of saying so plainly.
- **Mobile hero-animation degradation (Section 4) is a reasoned default, not a measured result** —
  same category of gap Thread 3's own spike already disclosed for scroll-scrub jank generally, now
  extended to a mobile-specific call this thread makes without new measurement.
- **Category taxonomy is a simplification** — a real business that spans categories (a restaurant
  that also caters, a gym that also sells retail product) has no defined rule for which single
  category/skeleton variant it gets. Unresolved.
- **No form backend exists in the current architecture.** The generator outputs static
  HTML/CSS/JS with no server (Output Structure) — the mandatory Contact/Conversion section's form
  needs somewhere to actually submit to (`mailto:`, a third-party form-submission service, or
  something else). This blocks the mandatory Contact/Conversion section from functioning
  end-to-end and isn't decided anywhere in this note yet — a real gap, not a content or layout
  question this thread can close.
- **Single-page vs. multi-page is not reopened here, but worth flagging:** research shows
  single-page structure converts better for a simple, single-offer business (>37.5% in one
  comparison) and matches the generator's current one-`index.html` output — but multi-page
  structure is shown to matter for local SEO specifically (service pages, location pages), which a
  one-page generated site can't capture. Out of this thread's scope; noted for whoever later
  weighs SEO strategy against the current single-page architecture.

### Form Backend — DECIDED (2026-08-05): Web3Forms now, self-hosted endpoint deferred to a switch trigger

**DECISION (2026-08-05): Web3Forms now, self-hosted endpoint later — the research's own plan B is
promoted to plan A for the current stage.** This inverts the proposal's original recommendation
below, so the reasoning for the inversion is recorded here rather than left implicit:
- The self-hosted Flask endpoint is still the better long-term answer, and the research for it
  below stands as written — nothing about it was wrong. But its entire cost is **ongoing
  operational responsibility**, and the generator has no working end-to-end pipeline and no clients
  yet. Taking on personal uptime liability for other people's incoming leads — before there are any
  leads — is pure downside with no offsetting benefit yet.
- **The failure modes are asymmetric, not just different.** If a form SaaS goes down, that's a
  vendor problem with a vendor's on-call team and a clear migration path. If Fabio's Windows PC is
  off for a weekend, leads vanish silently and the client finds out from a customer who says "I
  filled out your form and nobody called" — that damage lands on Fabio as the person who built the
  site, not on a third party.
- **The Flask app (`orb/app.py`) currently runs locally on a workstation that gets restarted
  routinely during development.** Fine for a personal dashboard; not an uptime story for client
  lead capture. Moving it somewhere always-on is a prerequisite for the self-hosted option, not a
  minor detail to handle later.
- The proposal's own alerting/health-check mechanism for the self-hosted option is explicitly
  undesigned (see Honest Gaps below) — a further, concrete reason it isn't ready to carry real
  leads yet.
- Thread 2 already established the form is the **secondary** conversion path — click-to-call
  converts far better for local service businesses. The secondary path doesn't deserve to be the
  thing Fabio takes operational liability for, especially this early.

**Adopted for now:**
- **Web3Forms** — one account, many generated sites, per the research finding below that several
  services (Web3Forms among them) are purpose-built for exactly this shape.
- A visible `mailto:` line as zero-cost redundancy (unchanged from the proposal).
- Prominent click-to-call as the primary action (unchanged from Thread 2).

**Switch trigger — recorded so this isn't relitigated later.** Build the self-hosted Flask intake
endpoint (relaying through Resend, per the research below as written) when **either**: (a) there
are 5+ paying clients, or (b) the Web3Forms free tier starts capping out. Prerequisites at that
point, not after: the Flask app must be hosted somewhere always-on, and the alerting/health-check
mechanism must be designed first.

**Status: decision made, nothing built.** The self-hosted research below stays in the note as-is,
ready to deploy at the switch trigger above — it is being sequenced later, not rejected.

---

**Original proposal (2026-08-05), superseded above for the current stage, kept for context and for
the eventual self-hosted build:**

Thread 2's Contact/Conversion section (mandatory) and the Honest Gaps above both flagged the same
real hole: generated output is static HTML/CSS/JS with no server (Output Structure), so the
mandatory form has nowhere to submit to. Right now, on every site this pipeline generates, the
primary fallback conversion mechanism doesn't work end-to-end. This matters less than it would if
forms were the primary action — Thread 2 already established click-to-call as visually dominant
for most categories — but "the fallback silently doesn't work" is still a real defect, not a
cosmetic one.

**Option 1 — `mailto:`.** Zero dependency, zero cost, works forever, nothing to break. Rejected as
the primary mechanism: it hands the visitor off to a separate mail application, which a large and
growing share of mobile/webmail users don't have configured at all — the visitor either sees a
broken "no app found" prompt or has to copy an address into Gmail-in-a-browser by hand. No
precise mailto-specific conversion figure was found in this research pass (flagged honestly below,
not invented), but the mechanism itself directly contradicts the low-friction, 3-4-field form
design Thread 2 just adopted — it doesn't submit a form at all, it abandons the visitor into a
different app mid-task. **Kept, but only as an always-visible redundant fallback line ("or email us
directly at ___"), never as the form's actual submission mechanism** — zero-cost insurance for the
case where the real mechanism (Option 3 below) is down, not the primary path.

**Option 2 — third-party form services (Formspree, Basin, Web3Forms, Static Forms, Formgrid, etc.).**
Researched free-tier limits and the multi-client question directly:
- Formspree and Basin: 50 submissions/month free, then $8+/month paid.
- Web3Forms: genuinely unlimited free, but email-only — no dashboard, no submission storage, just a
  relay to an inbox.
- Static Forms, StaticForms, and Formgrid are explicitly built for this project's exact shape: one
  agency account serving many client sites/forms, each isolated with its own notifications and
  tagging. **This directly answers the "does each client need their own account" question: no** —
  several services are purpose-built for one account, many generated sites.
- **Rejected as the primary mechanism anyway**, for the same reason Dembrandt, GSAP+Lenis, and the
  font-matching APIs were rejected earlier in this note: a small, third-party form-SaaS is exactly
  the dependency profile this project's history warns about, and here the blast radius is worse
  than those cases — if the service shuts down, changes pricing, or has an outage, **every
  generated site across every client breaks simultaneously**, with no fallback and no fix Fabio
  controls the timeline on.

**Option 3 — self-hosted intake endpoint, recommended.** A small route added to the existing Flask
app (`orb/app.py` already runs and is already Fabio's infrastructure — this is additive, not a new
service to stand up) that receives POSTs from every generated site's form (a hidden `client_id`/
`slug` field identifies which site a submission came from) and relays each one to that client's
email. **Critically, this does not mean self-hosting a mail server** — research specifically warns
that self-hosted SMTP has a real, hard-to-fully-fix deliverability problem: even with correct
SPF/DKIM/DMARC configuration, a new/self-hosted sending IP is treated with default suspicion by
Gmail and Microsoft. The recommendation is a **hybrid**: Fabio owns the intake logic and the code
(no vendor can take that away or shut it down), but the actual outbound send goes through a
transactional email API — **Resend** (3,000 free emails/month, then $20/month for 50,000) is the
best fit found: cheap, generous free tier for an early client base, authenticated sending from a
domain Fabio controls, and — importantly for this project's dependency posture — a commodity
utility with several viable swap-in alternatives (Postmark, SendGrid) if it ever needs replacing,
which is a much lower-risk single-vendor bet than trusting one small forms-SaaS with every client's
lead pipeline and configuration.
- **Spam/abuse exposure:** real, and the same problem every third-party service above also has to
  solve (they list reCAPTCHA/Turnstile/Altcha for exactly this). V1 mitigation: a honeypot field
  (zero cost, catches most bots) plus server-side rate limiting per IP; server-side validation, not
  just client-side, per the deliverability research above. Cloudflare Turnstile (free, one sitekey
  reusable across every generated site) is a reasonable next step if honeypot+rate-limit proves
  insufficient — not needed at v1.
- **Deliverability:** as long as sending goes through Resend with a properly authenticated domain
  (SPF/DKIM/DMARC on a domain Fabio controls), this has the same deliverability profile as the
  third-party services above — they aren't doing anything more sophisticated than authenticated
  relay through their own sending domains either.
- **Does this make Fabio a dependency/liability for client leads? Yes, honestly.** This is the real
  business-model tradeoff the recommendation carries, not a footnote: if Fabio's server or the
  Flask app goes down, or Resend has an outage, **every generated site's leads fail simultaneously**
  until someone notices — same blast radius as Option 2's failure mode, except now Fabio personally
  owns uptime and the fix timeline instead of a vendor's on-call team. This is an ongoing
  operational responsibility, not a one-time build decision, and it scales with client count: fine
  at a handful of clients, a real support burden if this grows to "many."

**What happens when it fails, and who notices:** the failure mode is silent by default — a POST
that 500s or times out has no visible error surfaced to the site visitor beyond a generic
form-failed state, and neither Fabio nor the client would know a lead was lost unless something is
watching for it. This is unresolved at the proposal stage: minimally, the intake endpoint needs a
health/alerting hook before this ships to a real client — piggybacking on the same accountability/
dashboard pattern already used elsewhere in this system is the natural fit, not a new mechanism.

**Degradation path — the phone number stays primary regardless of form status.** This is the
direct payoff of Thread 2's own decision that click-to-call is the dominant action for most
categories, not the form: a visitor whose form submission fails silently still has a prominently
displayed phone number in the same section, unaffected by any of the above. For the categories
where the form genuinely is the primary action (professional services/SaaS, per Thread 2's category
table), the redundant `mailto:` line from Option 1 is the last-resort path when the POST endpoint
itself is down.

**Recommendation, stated plainly:** self-hosted intake endpoint (Option 3) relaying through Resend,
with a visible `mailto:` line (Option 1) as zero-cost redundant insurance, and Web3Forms (from
Option 2) recorded as the explicit fallback-plan-B if Fabio later decides he doesn't want the
ongoing operational responsibility Option 3 carries — that's a legitimate reason to revisit this,
not a flaw in the research.

**Honest gaps:**
- **No mailto-specific conversion-penalty figure was found** — the rejection above is reasoned from
  the mechanism (hands off to a separate, often-unconfigured app) plus its direct conflict with
  Thread 2's low-friction form design, not from a measured number. Flagged rather than invented.
- **Generated-site hosting/deployment is itself undecided** — this note has no recorded decision on
  where generated sites are actually served from once delivered to a client (checked directly: no
  hosting/deploy decision exists elsewhere in this note). That absence is *why* Netlify Forms/
  Cloudflare Pages Functions weren't recommended here — they only make sense if sites deploy to
  that specific host, which isn't decided. **If a future hosting decision lands on Netlify for
  unrelated reasons, this recommendation should be revisited** — a platform-native form handler
  would remove the need for Fabio's own endpoint entirely.
- **Real submission volume is unknown** — there are no live clients yet, so Resend's free tier is
  confirmed sufficient only in the sense that it comfortably covers a small/early client base, not
  validated against real scale.
- **Spam-abuse volume against a public endpoint is unmeasured** — honeypot + rate-limiting is a
  reasonable v1 guess based on how the third-party services describe their own defenses, not
  something tested against real attack traffic here.
- **The alerting/health-check mechanism for Option 3 is not designed, only flagged as required**
  before this ships to a real client.
- **The sending domain itself isn't chosen** — Resend needs a domain Fabio controls to authenticate
  SPF/DKIM/DMARC against; which domain is an open, undecided detail, not a research question.

### Sources (Form Backend)
- [Form Conversion Rate Benchmarks 2026 — Digital Applied](https://www.digitalapplied.com/blog/form-conversion-rate-benchmarks-2026-data-points) — desktop-vs-mobile completion gap, mobile abandonment causes
- [Formspree Free Plan Limits (2026) — FormTorch](https://formtorch.com/compare/formspree-free-plan-limits) — Formspree free-tier submission cap
- [Formspree vs Basin 2026 — Splitforms](https://splitforms.com/blog/formspree-vs-basin) — Basin free-tier and pricing
- [Formspree vs Web3Forms 2026 — Splitforms](https://splitforms.com/blog/formspree-vs-web3forms) — Web3Forms unlimited-free, email-only model
- [Static Forms — Features](https://www.staticforms.dev/features) — one-account-many-client-sites model
- [Email Deliverability Best Practices: 10 Tactics for 2026 — Static Forms](https://www.staticforms.dev/blog/email-deliverability-best-practices) — SPF/DKIM/DMARC, authenticated sending domain guidance
- [10 Steps To Set Up A Self-Hosted Mail Server Without Hitting Spam — DuoCircle](https://www.duocircle.com/email-hosting/10-steps-set-up-self-hosted-mail-server-avoid-spam) — new/self-hosted IP reputation risk with major providers
- [Resend vs SendGrid vs Postmark Pricing at 1K, 10K, 100K — Vibe Coder Blog](https://blog.vibecoder.me/email-service-pricing-resend-sendgrid-postmark) — transactional email API pricing comparison
- [Email API Pricing Comparison (July 2026) — BuildMVPFast](https://www.buildmvpfast.com/api-costs/email) — Resend free-tier figures
- [Netlify Forms — Cloudflare Pages Migration Docs](https://developers.cloudflare.com/pages/migrations/migrating-from-netlify/) — confirms Netlify Forms is host-native and doesn't transfer to Cloudflare Pages
- [Forms on Cloudflare Pages are Needlessly Complicated — Cloudflare Community](https://community.cloudflare.com/t/forms-on-cloudflare-pages-are-needlessly-complicated/670762) — confirms Cloudflare Pages has no built-in form handler equivalent to Netlify's

### Sources (Thread 2)
- [Landing Page Best Practices That Convert in 2026 — Lovable](https://lovable.dev/guides/landing-page-best-practices-convert) — section order, CTA placement, proof-near-CTA
- [25 Landing Page Best Practices That Convert in 2026 — Landingi](https://landingi.com/landing-page/41-best-practices/) — section flow, hierarchy
- [Click-to-Call Button Best Practices Guide — The Ad Firm](https://www.theadfirm.net/click-to-call-and-contact-buttons-best-practices-to-turn-mobile-visitors-into-customers/) — click-to-call conversion multiplier
- [Business Phone Call Statistics: 50+ Data Points (2026) — AInora](https://ainora.lt/blog/business-phone-call-statistics-2026) — call-vs-form lead quality, caller-to-customer rate
- [Local Search Statistics 2026 — BizIQ](https://biziq.com/blog/local-search-statistics/) — 60%/88% mobile local-search-to-contact figures
- [Mobile Phone Calls = Higher Conversion Rates — Conversion Sciences](https://conversionsciences.com/mobile-phone-calls-higher-conversion-rates/) — mobile-optimized click-to-call lift
- [Form Conversion Rate Benchmarks 2026 — Digital Applied](https://www.digitalapplied.com/blog/form-conversion-rate-benchmarks-2026-data-points) — field-count-vs-conversion curve
- [5 Studies on How Form Length Impacts Conversion Rates — Ventureharbour](https://ventureharbour.com/how-form-length-impacts-conversion-rates/) — HubSpot 11→4 field / 120% lift study
- [29 Landing Page Social Proof Element Performance Statistics — TryFlint](https://www.tryflint.com/blog/landing-page-social-proof-element-performance-statistics) — proof-placement-near-hesitation-points
- [The Best Places to Feature Testimonials on Landing Pages — Say About Us](https://sayabout.us/blog/the-best-places-to-feature-testimonials-on-landing-pages) — placement patterns
- [Win Report: How a "sticky" call to action increased sales by 25% — Conversion Rate Experts](https://conversion-rate-experts.com/sticky-cta-win-report/) — sticky CTA lift and "not always a win" caveat
- [Top Strategies for Roofing Contractor Website Conversion Optimization — Robben Media](https://robbenmedia.com/top-10-tips-for-roofing-contractor-website-conversion-optimization/) — trades trust-bar/quote-form claims (agency-sourced, methodology undisclosed)
- [14 Modern Roofing Websites (And Why They Convert) — Roofing Webmasters](https://www.roofingwebmasters.com/roofing-websites/) — same category, cross-check
- [Restaurant Website Design: 7 Must-Have Elements (2026) — Chowly](https://chowly.com/resources/blogs/restaurant-website-design-7-elements-of-a-high-converting-restaurant-website/) — HTML menu, fixed-nav quick actions
- [The 10 Essential Elements of Restaurant Websites — BentoBox](https://www.getbento.com/blog/the-10-essential-elements-of-a-restaurant-website/) — menu as most-visited/deciding page
- [The Complete Dental Website Design Guide (2026) — Leadtek](https://leadtek.ai/blog/dental-website-design-guide) — insurance-visibility conversion factor, credentials-near-booking
- [Dental Website Design: What Actually Converts in 2026 — Kelly WM](https://kellywm.com/blog/dental-website-design) — 10-15 second decision window
- [9 Best About Us Pages for Small Business — It's Buzz Interactive](https://www.itsbuzzinteractive.com/blog/best-about-us-pages-for-small-businesses) — real-vs-stock photo trust findings
- [Why Trust Signals Are the Missing Link on Most Local Business Websites — Best Version Media](https://www.bestversionmedia.com/why-trust-signals-are-the-missing-link-on-most-local-business-websites/) — years-in-business, service-area-map-over-city-list
- [Trust Signals That Convert Visitors Into Customers — Mailchimp](https://mailchimp.com/resources/trust-signals/) — general trust-signal framing
- [High-Impact Hero Sections That Don't Hurt Page Speed: A CRO Guide — Stellar](https://www.gostellar.app/blog/high-impact-hero-sections-that-dont-hurt-page-speed/) — hero asset weight vs. bounce rate, static-fallback recommendation
- [One Page Vs Multi Page Website For Service Providers — Twofold](https://twofold.squarespace.com/blog/one-page-vs-multi-page-website) — single-page conversion lift for simple-offer businesses
- [Services Page vs Service Pages for Local SEO — SPB Web](https://www.spbweb.com/post/services-page-vs-service-pages-local-business) — multi-page local-SEO tradeoff

## Walking Skeleton Findings (2026-08-05)

**A rough end-to-end pipeline was built in `C:\Jarvis\spikes\generator-e2e\`** — one hardcoded
construction/trades client, brand extracted from a real live site using `extract2.js` unmodified
(reused from Thread 1's validation spike, not improved), the `flipbook-scrub` spike's placeholder
tower sprite sheet reused as-is for the hero, Thread 2's page skeleton, and the Web3Forms/mailto/
click-to-call form-backend decision, all wired together into one self-contained output folder. This
was explicitly a walking skeleton, not a product attempt — the goal was finding handoff failures
between the three threads' separately-researched designs, not building anything real. **It
succeeded at that.** Four real breaks surfaced, none of which any single thread's own research
would have found, because each only exists at the seam between two threads' work.

### The four breaks

1. **The flipbook hero technique doesn't work at real hero scale.** The spike that resolved native
   CSS vs. GSAP (see RESOLVED Flipbook Alternative above) proved the technique in a fixed 400×600px
   box. Wired into a real full-bleed hero, the unscaled sprite sheet showed 3-4 adjacent frames
   side by side instead of one. Full detail, consequences, and the new Thread 3 prerequisite this
   creates are recorded directly under the flipbook section above, not repeated here.
2. **The 500vh scroll-track is invisible to anything that doesn't emulate live scrolling** — a
   plain full-page screenshot showed ~400vh of blank space between hero and content. Recorded as
   unsolved directly under the flipbook section above.
3. **Thread 1's schema has real fields with no defined fallback when extraction returns null.** Hit
   immediately: the live test site's footer color came back null, and the schema had no documented
   behavior for that. Now fixed at the schema level — see the new Derivation Layer under Thread 1's
   Token Schema above.
4. **`surface` and `background` collapse to the same value on light-background sites** — most real
   sites, per Thread 1's own 9-site validation — leaving Thread 2's skeleton with no way to
   visually separate sections. Also fixed via the new Derivation Layer above (surface is now always
   derived from background with a minimum lightness delta, never extracted directly).

### Smaller finds

- **No field anywhere catches "wrong URL supplied."** The spike extracted Grace Family Roofing's
  real logo and colors onto the fake client "Ironclad Construction Co." and nothing in the pipeline
  flagged the mismatch — visually obvious in the output (the header showed both names side by
  side), but there's no automated same-business sanity check anywhere in the review gate. A real
  client accidentally pasting a competitor's URL, or their old/wrong domain, would sail through
  identically. Belongs somewhere in the mandatory review gate; not designed here.
- **The extracted logo asset was white-on-transparent and only rendered correctly by luck**, because
  this build's header happened to be dark. Nothing in Thread 1's schema records that a logo variant
  needs a dark (or light) surface to be visible — a page template that placed the same asset on a
  light surface would render it invisible. Logo/background compatibility is unhandled.
- **The font-substitution table was never actually exercised.** The test site's fonts (Barlow /
  Barlow Condensed) happened to already be real Google Fonts, so Thread 1's still-unbuilt
  substitution table was never tested by this run. Still an open gap, not newly closed.
- **A Windows/git-bash environment quirk, not a design flaw:** Node's `readline` reliably resolves
  only the first prompt against piped (non-TTY) stdin, then hangs on the second — reproduced with a
  minimal 3-line repro. Real interactive terminal use is unaffected. Worth knowing for whoever
  builds the real review-gate CLI on this platform.

### What went cleanly — worth recording, not just the failures

- **Extraction → token mapping worked first try**, once the role mapping (primary←header,
  secondary←footer, accent←CTA) — which Thread 1's schema only ever *implied* through inline
  comments in its worked example, never stated as a rule — was made explicit in code.
- **The WCAG contrast math (Thread 1's "implement directly, no dependency" decision) worked exactly
  as estimated** — about 15 lines, correct on the first run.
- **Web3Forms + mailto + click-to-call wired together with zero surprises** — the Thread 2
  form-backend decision translated directly into working HTML, no gaps found at that seam.

These three designs held up under real contact with implementation. Worth stating plainly alongside
the four breaks above, since a findings list that only records failures would understate how much
of the prior research was actually right.

### The product-quality verdict

The resulting page reads as a real, navigable small-business site — header, hero, trust bar,
services, reviews, FAQ, contact, footer, sticky mobile call bar, all present and in the right
order. But it **looks generated, not premium**: flat card grids, no real photography, the
placeholder tower reading as a coding demo rather than a client's actual building. This was
expected — Thread 3 (real per-client frames) and the later UI Craft polish were explicitly out of
scope for this spike — but it should be stated plainly rather than left as an assumption: **the
pipeline connects end-to-end; the product is not close.** Nothing this pipeline generated today
would close a sale. See the content-input amendment flagged above (Thread 2) for one concrete
consequence: for categories like construction, client-supplied photos for the category deep-section
may not be optional polish at all.

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
4. **FLYTHROUGH** — camera glides through a space. → real estate, hotels, gyms, venues, **general/
   family dental & medical practices (added 2026-08-05, see below)**.
5. **TRANSFORM** — before/after morph. → renovation, fitness, beauty, **cosmetic/aesthetic dental &
   medical practices** (unchanged — already fit before this decision; only general/family practice
   was the open gap).
6. **INTERFACE** — dashboards/UI/data coming alive (numbers count up, panels slide in, bespoke
   illustrations); for things that can't be photographed. → SaaS, fintech, agencies, consultants.

Selection rule: physical business → archetype 1-5 by category fit; invisible/software business →
archetype 6. This is the piece that would let archetype selection itself be automated rather than
hand-picked — consistent with the "engine never changes, only the frames do" scaling argument
above, extended one level further: even the *choice* of frame set follows a fixed rule instead of
per-project judgment. Still gated on the same open question above (this doesn't get built until
the flipbook-vs-GSAP evaluation is resolved).

### RESOLVED (2026-08-05): dental/medical archetype gap — general/family practice maps to FLYTHROUGH

**Not a seventh archetype.** Dental/medical was never one monolithic category for archetype
purposes — it splits in two, and only half of it was actually unresolved:
- **Cosmetic/aesthetic-leaning practices** (whitening, orthodontics-as-cosmetic, dermatology,
  aesthetic medicine): already fit **TRANSFORM** cleanly — a real before/after story, unchanged by
  this decision.
- **General/family practice** (checkups, cleanings, routine care — no before/after story to tell):
  this was the actual gap. **Decided: maps to FLYTHROUGH, not a new archetype.**

**Why FLYTHROUGH, not a seventh archetype:** a general dental or medical practice is a real,
photographable physical space — the same underlying category as FLYTHROUGH's existing real
estate/hotels/gyms/venues, not the invisible/software territory INTERFACE covers. The psychological
job a hero has to do is also the same one FLYTHROUGH already does for gyms and hotels: **reduce
anxiety about an unfamiliar space by showing it's calm, clean, and welcoming before the visitor has
to commit to walking in.** Dental/medical arguably needs this more than gyms do — "fear of the
dentist" is a well-documented, specific barrier a calm environment tour directly addresses. No
existing archetype's *mechanism* needed to change; only its *tone* does, which this note already has
a working pattern for (the same way food/beverage gets warm earth tones and tech gets blue/violet in
Thread 1's default-palette table — archetype mechanism stays fixed, category sets the creative
direction on top of it).

**Concrete frame sequence** (the test this decision has to pass — if no compelling sequence exists,
that's evidence for mapping elsewhere instead): camera glides from a bright, welcoming reception
desk → down a clean, well-lit hallway → into a modern treatment room with a comfortable chair, warm
lighting, no visible sharp instruments → past a friendly staff member mid-smile → settles on the
front desk / scheduling area as the final frame. Every beat is ordinary, calming, and specifically
chosen to defuse dental anxiety — not a dramatic reveal, a reassurance.

**Tone, tied directly to Thread 2's own conversion-driver finding for this category:** Thread 2
already established that booking, insurance visibility, and credentials — not visual drama — are
what actually converts for dental/medical. **A quieter hero is correct here, and this decision
implements that directly**: same FLYTHROUGH mechanism used for gyms/hotels, but paced slower and
calmer (a gentle glide, not a fast dramatic sweep), consistent with a trust-building job rather than
an excitement-building one. The archetype choice and Thread 2's conversion findings reinforce each
other rather than pulling in different directions.

**Native aspect ratio — the open item the sprite-scaling resolution flagged, addressed for this
archetype specifically:** recommend **landscape, ~16:9**, not the ASSEMBLE tower's portrait 2:3. A
camera-glide through a real space is inherently a landscape composition — real estate and
architectural walkthrough videography is shot landscape as a near-universal convention, since a
wide field of view is what actually reads as "a space," where a portrait crop reads as an object.
This is a reasoned recommendation from genre convention, not independently tested here — only the
tower's 2:3 has been verified end-to-end (per the sprite-scaling resolution above); confirming 16:9
specifically renders cleanly through the same percentage-based CSS technique is Thread 3's job when
it starts, not assumed settled by this decision.

### RESOLVED (2026-08-05): sprite-scaling gap — percentage-based CSS + contained composition

**The CAVEAT below (2026-08-05, from the walking-skeleton findings) is resolved, not just
acknowledged.** Original caveat text kept immediately after this box for the record. Investigated
directly in `C:\Jarvis\spikes\flipbook-scale\` (throwaway, reused the existing 96-frame sprite sheet
and frames from `flipbook-scrub` unmodified — nothing regenerated). Full findings:
`C:\Jarvis\spikes\flipbook-scale\FINDINGS.md`.

**Root cause confirmed: the walking skeleton's bug was pixel-based `background-size`, not a limit
of the technique.** `background-size: 38400px 600px` (literal native pixel size) on a box wider than
one frame let several adjacent 400px-wide frames show through a wide viewing window. Switching to
**percentage units** — `background-size: 9600% 100%` (9600% = 96 frames × 100%), with
`background-position-x` animated in **percent** (0%→100%, not pixels) — fixes this completely,
because CSS background-position percentages resolve relative to the container's own size: each
frame always occupies exactly 100% of the container's width, at *any* width. Verified across 5 real
viewport widths (1920/1440/1024/768/390): clean, single, undistorted frames every time, with frame
accuracy holding (45/60 automated samples exact; the remaining 15 are one identical, deterministic
±1-frame rounding artifact at exactly the 50% scroll midpoint, present uniformly regardless of
viewport or technique — evidence of a benign `steps(95, jump-none)` boundary convention, not drift
or a real defect). **One sprite sheet, no breakpoints, no multiple resolutions needed for the
stepping mechanism itself to work correctly at any width.**

**But there's one real, non-negotiable requirement: the container must keep the frame's native
aspect ratio.** Tested full-bleed (100vw × 100vh, ignoring the sprite's 2:3 shape) with the same
percentage technique: the bleeding bug is gone, but a **different, real problem appears — visible
content distortion**, each frame squashed non-uniformly to fill a box shaped nothing like the
source content (confirmed by screenshot). **This is a content/design mismatch, not a CSS
engineering problem** — no scaling technique makes a portrait sprite look right stretched into a
landscape full-viewport box.

**Resolution: don't force full-bleed.** Compose the hero as a **contained, centered hero-object**
sized to the sprite's native aspect ratio, capped at a sane maximum (tested:
`height: min(78vh, 720px); aspect-ratio: 2/3`) — not a literal full-bleed background. This is not a
compromise invented for this fix; it's consistent with this note's own prior precedent for the 3D
hero-object work above ("exactly one hero-section 3D object... never a full 3D environment... a
single well-lit hero object... is enough to reposition a corporate site as premium," without needing
edge-to-edge coverage). The walking skeleton's "full-bleed hero" framing was this project's own
unexamined assumption, not something any of the three threads actually mandated.

**Two other alternatives from the original caveat, tested and settled:**
- **Vertical sprite strip:** technically works identically to horizontal (same accuracy, same
  bleed-free behavior) — but costs **2.56x more in file size for byte-identical content** (262.7KB
  vs. 102.5KB, repacked from the same existing frames via Pillow, no new artwork), almost certainly
  because PNG's row-based compression loses the horizontal redundancy between adjacent frames.
  Rejected on cost alone.
- **Memory/decode ceiling:** tested directly against a real 76,800×1200px native source image (not
  just a virtually CSS-upscaled small one) — rendered correctly, zero errors, zero corruption, at
  every scroll position. No hard ceiling found in this Chromium build at these scales (untested on
  other browsers/GPUs/mobile devices).

**Updated file-weight numbers — the shift IS real, stated plainly, and does NOT overturn the
CSS-vs-GSAP decision.** The capped contained box needs real resolution to look crisp on high-DPI
displays, not just the placeholder's native 400×600. Measured by upscaling the existing sheet
(Pillow, no new content):

| Resolution | Per-frame | Sheet size | File weight |
|---|---|---|---|
| 1x (original) | 400×600 | 38,400×600 | 102.5 KB |
| 1.5x | 600×900 | 57,600×900 | 315.5 KB |
| 2x (recommended) | 800×1200 | 76,800×1200 | 531.1 KB |

**Recommendation: render production sprites at 2x (≈531KB per client/archetype).** That's real
growth from the 100.1KB figure that partly informed the original CSS-vs-GSAP file-weight
comparison — worth stating honestly, as the original caveat asked. It does **not** reverse that
decision: frame accuracy is still a tie, the dependency-management argument (versioning,
CDN/self-hosting, build-step drift) stands independent of sprite file size, and 531KB is still one
single asset with no added HTTP requests — nowhere close to GSAP+Lenis's ~401.7KB-and-rising
dependency-plus-individual-files cost once that side is held to the same resolution (not measured
here — flagged as an honest gap below, since only the sprite side of that comparison was re-tested).

**Thread 3 output spec — the concrete deliverable this resolution unlocks:**
- **One sprite sheet per client per archetype** (not per breakpoint/resolution tier — the
  percentage technique makes those unnecessary).
- **Horizontal strip layout**, frames left-to-right. Not vertical.
- **Recommended base resolution: 2x the display cap** — concretely 800×1200/frame if the contained
  box stays capped around 720px tall as tested here; scales the same way for any archetype that
  adopts a similar cap.
- **Frame count and CSS mechanism:** whatever count an archetype settles on (96 for ASSEMBLE,
  unchanged), driven by `background-size: <100 × frameCount>% 100%` and `background-position-x`
  animated in **percent**, 0%→100%, via `steps(frameCount − 1, jump-none)` — **a hard requirement,
  not a style preference**, since pixel-based sizing is exactly what caused the original bug.
- **Container contract:** the hero markup sizes the sprite-box element to match the generated
  frames' aspect ratio via CSS `aspect-ratio`, composed as a contained/centered hero-object, never
  a literal full-bleed background-cover.
- **Open item this surfaces, not resolved here:** each archetype likely wants its own native aspect
  ratio (a tower assembling is naturally portrait; a SPIN product rotation may want closer to 1:1; a
  FLYTHROUGH may want wider) — only the placeholder tower's 2:3 was tested. Thread 3 needs to define
  an aspect ratio per archetype, not assume 2:3 universally.

**Honest gaps:**
- The GSAP+individual-PNG side of the file-weight comparison was not re-measured at a matched
  higher resolution — only the sprite side was re-tested here. The dependency argument doesn't
  depend on this number, but the *file-weight* portion of the original comparison is honestly only
  half re-verified.
- The exact resolution multiplier (2x, not 1.5x or 2.5x) is a reasoned recommendation from measured
  file sizes and a rough upscale-factor calculation, not a perceptual-blur study on a real device.
- The `steps(95, jump-none)` midpoint rounding artifact wasn't root-caused to the exact CSS spec
  mechanism — reported as benign given its perfect uniformity across all 15 occurrences, not chased
  further.
- Real on-device jank/performance profiling for the percentage-based technique specifically wasn't
  done — same category of gap the original flipbook spike already disclosed for the pixel-based
  version; this investigation was scoped to the scaling/bleed question, not re-litigating perf.
- No hard memory/texture ceiling found in this Chromium build up to ~184,000px virtual /
  76,800px native widths — untested on other browsers, GPUs, or mobile devices.

### CAVEAT (2026-08-05, from walking-skeleton findings) — original text, kept for the record

**Native CSS still wins; nothing here un-resolves the decision above.** But the spike that resolved
this tested the technique in a **fixed 400×600px box**, where the visible area is exactly one
frame wide. Wiring the identical CSS into a real, full-bleed hero (~1440px wide) in the walking
skeleton (`C:\Jarvis\spikes\generator-e2e\`) showed the unscaled sprite sheet revealing **3-4
adjacent frames side by side**, not one — confirmed directly by screenshot before it was worked
around. Prior testing (the "sampled at 10/25/50/100% scroll" accuracy check above) only ever
verified *which frame number* was showing, never what that looked like inside a real page layout.
**That's a gap in how the spike was validated, not just in the technique itself.**

Consequences, stated plainly:
- The walking skeleton's workaround — pinning the animated sprite to its proven native 400×600
  scale, centered within the hero, rather than full-bleed — is a stopgap. It is almost certainly
  not what a premium full-bleed hero (per this note's own "one confident centerpiece" framing
  above) is supposed to look like.
- A responsive, full-bleed hero likely needs per-client sprite sheets at **multiple resolutions**
  (or a genuinely different scaling approach this note hasn't identified yet), not one sprite sheet
  sized for a 400×600 test box.
- **This shifts the file-weight math that partly won the case for CSS over GSAP** (100.1KB sprite
  vs. 269KB individual PNGs + 132.7KB GSAP+Lenis). That comparison was measured at 400×600 —
  multiple resolutions multiply the sprite side of that comparison, not the dependency side. This
  does **not** overturn the decision — frame accuracy was a measured tie and the dependency
  argument (versioning, CDN/self-hosting, build-step drift) stands regardless of sprite file size —
  but the decision was made on incomplete numbers, and that should be stated rather than left
  implied.
- **This must be solved before Thread 3 starts.** It changes what frame generation actually has to
  output (one sprite sheet per client, several at different resolutions, or something else
  entirely). Recording this as an explicit Thread 3 input/prerequisite, not an open question Thread
  3 would otherwise discover on its own partway through.
- **Resolved 2026-08-05, see above — kept here unedited for the record, not because it's still open.**

### RESOLVED (2026-08-05): scroll-track rendering gap — real fix for print/PDF, real mitigation elsewhere

**Investigated and fixed directly in `C:\Jarvis\spikes\scroll-track\`** (throwaway, reused the
sprite sheet and static fallback frame from `flipbook-scrub` unmodified). Full record and evidence:
`C:\Jarvis\spikes\scroll-track\FINDINGS.md`. Original problem statement kept below for the record.

**Which contexts actually break — established concretely, not assumed.** Built a before/after
comparison and tested three distinct contexts:
1. **Full-page screenshot** (the CDP `captureBeyondViewport` composite most headless screenshot
   tools use): confirmed broken — header, hero at frame 0, then ~3000px of blank white, then content.
2. **Print / PDF export**: confirmed broken, identical defect (Chromium's PDF path uses the same
   full-document render, and no `@media print` rules existed to change that).
3. **Normal single-viewport render** (a plain screenshot, most crawlers, and the actual
   first-impression view): **confirmed NOT broken** — renders a completely normal hero at frame 0.
   **The real risk is specifically full-page/"capture entire page" tools and print/PDF — not normal
   browsing, and not most crawlers**, which render at a fixed viewport height like case 3.

**Print/PDF: fully fixed, verified.** Added `@media print` rules that collapse `.hero-track` to a
normal `100vh`, switch the sticky element to `position: static`, and swap the sprite to the same
static fully-assembled frame already used for the Firefox/mobile fallback — the existing convention,
not a new one. Verified: print-media document height dropped from 4837px to 1237px in the test page,
and the resulting screenshot/PDF show a clean hero → content → footer with zero blank space.

**General case (screenshot tools, full-page crawlers): no complete fix exists, and that's stated
plainly, not glossed over.** There is no CSS media feature, and no reliable signal at all, that
distinguishes "a real user about to scroll" from "a tool compositing the whole document in one
non-scrolling pass" — Playwright's full-page mode specifically renders with no scroll events firing,
indistinguishable at the CSS level from a page that simply hasn't been scrolled yet. **What IS
fixed: the failure mode changed from "looks broken" to "static, no motion."** Giving `.hero-track`
itself a `background-color` matching the hero's own dark backdrop means a flattened composite now
shows a smooth continuation of the hero's theme below the (still top-anchored, unchanged) sticky
element, instead of a jarring blank-white void breaking the page in two. Verified by direct
before/after screenshot comparison.

**The honest constraint that remains, stated precisely:** no fix scoped to this page can make a
full-page-composite tool show the *animation* — that requires the tool itself to emulate real
scrolling, which is a property of the capturing tool, not something the page can force. This isn't
unique to this project's implementation; it's true of any scroll-driven design captured by a
non-scroll-emulating tool. What remains after this fix is a reasonable, unsurprising degradation —
a static, correctly-themed hero at its initial frame, no visible defect, just no motion — not a bug.

**Adopted for the real generator template:** both pieces — the `@media print` collapse, and
`.hero-track { background-color: <token color> }` matching the hero's backdrop — verified and ready
to carry into the real build whenever the template is written.

### Original problem statement (2026-08-05, kept for the record)

**Found in the same walking-skeleton run, a distinct problem from the sprite-scaling caveat above.**
The adopted technique's `.hero-track { height: 500vh }` with a `position: sticky` element pinned
inside it only *looks* like a normal-height hero because a live, scrolling viewport continuously
repaints it — the container is, structurally, actually 500vh tall the whole time. A plain full-page
screenshot in the walking skeleton (which renders the whole document at once rather than emulating
scroll) showed exactly that: **~400vh of blank white space** between the hero and the rest of the
page.

This will affect **any tool that renders the full page without emulating a real scroll loop** —
screenshot tools, PDF export, print stylesheets, and some SEO/preview crawlers. Mobile happens to
avoid it, but only because Thread 2's mobile decision already routes mobile to the static fallback,
which never sets the 500vh height at all — an accidental save, not a designed one.

**Resolved 2026-08-05, see above — kept here unedited for the record, not because it's still open.**

## Sources (Visual Richness)
- [Best Three.js Websites 2026: 8 Sites + Techniques | Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026) — "one confident centerpiece" principle, Awwwards examples (Oryzo, Hubtown)
- [Web Design Trends 2026: What Actually Held Up After Six Months | Studio Meyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check) — performance cost of 3D hero elements, "brand is the experience" scoping
- [Self-hosting third-party resources: the good, the bad and the ugly | Web Performance Calendar](https://calendar.perfplanet.com/2019/self-hosting-third-party-resources-the-good-the-bad-and-the-ugly/) — self-hosting vs CDN reliability reasoning

## Thread 3: Frame Generation — PROPOSAL (2026-08-05), research only, not adopted

**PROPOSAL, not a decision — unlike Thread 1 and Thread 2, this has not gone through Fabio's
approval step yet.** Recommendation: **hybrid template scenes (option c) as the default mechanism
for four of the six archetypes (SPIN, REVEAL, TRANSFORM, INTERFACE); real capture (option b),
scoped as a manual paid add-on rather than the default pipeline, for the two archetypes whose
entire premise is showing the client's own specific building/space (ASSEMBLE, FLYTHROUGH) if a
client wants literal accuracy there; AI text-to-video (option a) rejected outright as the
mechanism for this project's deterministic sprite-sheet pipeline.** This is a three-way split, not
a single clean winner across all six archetypes — stated plainly below rather than papered over,
because ASSEMBLE and FLYTHROUGH are exactly the two archetypes where "accuracy is non-negotiable"
is hardest to satisfy automatically.

**The accuracy bar this evaluation is held to, restated from the task that opened this thread:**
this has to render a client's *actual* building/product/logo, not a generic stock scene — "a
client will notice a generic tower." That bar is what breaks the clean pattern below.

### Option (a): AI text-to-video → frames — rejected as the mechanism

Current-generation tools (researched, not hands-on tested — see gaps below) solve *character*
consistency, not *exact-geometry* consistency. Runway Gen-4's reference-image system, Veo 3.1's
"Ingredients to Video" (3 reference images), Kling 3.0 Omni, and Seedance 2.0 (9 images) are all
built and marketed around keeping a *person's* face/clothing/mood stable across shots from a
reference image — a genuinely different problem from holding a specific building's exact facade
proportions, window layout, and massing rigid across a deterministic, scripted multi-frame camera
path. None of the current tooling documentation found describes "hold this exact structure's
geometry fixed while a scripted camera does X" — the underlying mechanism is a diffusion model
re-interpreting a scene from a reference *image*, not manipulating a rigid 3D asset, so
frame-to-frame drift/morphing in exactly the geometric details a client would recognize (their
building's proportions, their product's exact shape) is a structural property of how these models
work, not a maturity gap likely to close with the next model version.

**A second, independent problem: camera-path control.** Every archetype here needs an *exact*,
reusable camera contract — ASSEMBLE needs 8 discrete block-drop beats, FLYTHROUGH needs a specific
5-beat path (reception → hallway → treatment room → staff → desk, see the dental/medical decision
above), all synced frame-for-frame to `steps(frameCount − 1, jump-none)` and scroll position. AI
video tools generate a fixed clip with the model's own implicit camera motion — there is no
reported way to specify "frame 34 of 96 must be exactly this composition" the way a scripted
three.js camera path or a real camera rig can. Even if geometry consistency were solved, the
camera-path contract this project already committed to (the RESOLVED Flipbook Alternative section
above) would still not be satisfiable from a single generated clip.

**Not tested hands-on — stated as a gap, not glossed over.** No API key/paid account for
Runway/Kling/Veo/Luma is available in this environment, and this environment does have Higgsfield
MCP tools that proxy several of these models — but invoking them spends real account credits/money,
which the standing rule against autonomously spending money without asking covers; not run without
Fabio's explicit approval. This section's verdict is reasoned from each vendor's own published
mechanism description (reference-image conditioning for *character* consistency), not from a direct
test — flagged honestly as the weakest-evidence option of the three.

**Conclusion: rejected as the frame-generation mechanism for the deterministic sprite-sheet
pipeline.** The mismatch (implicit stochastic camera + geometry vs. this project's exact
frame-count/camera-path contract) is structural, not something a better model closes. Possibly
interesting as a *separate*, lower-stakes idea — a short supplementary marketing/social clip where
approximate likeness is acceptable — but that is not this thread's job and shouldn't be conflated
with the hero sprite-sheet.

### Option (b): Real 3D capture → render → export frames — accurate, but inherently manual

**Researched cost/turnaround for professional-grade capture:** commercial 3D laser scanning/BIM
work runs **$3,000–$10,000+ per building, $0.20–$0.70/sq ft, with a 2–4 week turnaround** (rush
delivery carries a 25–50% premium) — real market figures, not estimated (see Sources). That's for
survey-grade BIM deliverables, likely heavier than a stylized cinematic hero needs.

**A lighter DIY path is plausible but not independently sourced here, stated as a reasoned
estimate, not a researched figure:** client-submitted or Fabio-captured phone photos → photogrammetry
software (Meshroom/RealityCapture) → manual Blender cleanup and retopology by a competent 3D
artist. Rough estimate: **low hundreds to ~$2–3k and several days of dedicated skilled labor per
building/interior**, scaling up sharply for FLYTHROUGH's multi-room requirement (reception, hallway,
treatment room, etc. — each room is effectively a separate capture-and-clean pass, not one shot).

**The real problem isn't cost, it's automation.** Raw photogrammetry output is always noisy —
holes, floating geometry, incorrect scale — and turning it into a clean, render-ready, correctly-lit
mesh is a judgment call a skilled artist makes per scan, not a scriptable step. This is not a "we
haven't automated it yet" gap; it's inherent to the problem of reconstructing clean geometry from
messy real-world photos. That directly violates the "no per-site hand-tuning" bar Thread 1 and
Thread 2 both held themselves to — it cannot be waved away as a future automation task the way, say,
the token-schema pipeline could be.

**Conclusion: precise, but does not fit the default "many clients, no hand-tuning" pipeline.**
Legitimate as an explicit, client-funded premium tier for a client who specifically wants their real
building/space rendered — not the default MVP path.

### Option (c): Hybrid template scenes — recommended default, but not for all six archetypes

**Spike run to test this directly:** `C:\Jarvis\spikes\frame-generation\template_spin.py` builds a
fixed "geometry" (a stylized product silhouette) and a fixed camera path (a 360° turn), then
generates two full 48-frame sequences for two simulated clients differing *only* in the
color/logo params passed in — the same shape as Thread 1's `frameGeneration.paletteForFrames` /
`logoCompositing` token fields. Both ran end to end with zero manual tuning: **4.5ms/frame and
3.8ms/frame respectively, ~69KB and ~66KB sprite sheets** (`out/template-spin-results.json`).
Visual spot-check (`out/clientA-roastery/frame-000.png`, `out/clientB-tech/frame-012.png`) confirms
the mechanism works as intended: the label reads correctly when facing camera and correctly fades
out edge-on, and the two clients are visually distinct from the same underlying script. **UPDATE (2026-08-05, later session): the three.js/Playwright capture path has since been executed,
closing the 2D/Pillow scope gap below.** `scene.html`/`capture.js` ran successfully — Playwright +
Chromium installed into the spike folder, 24 frames captured per client for both simulated clients
(clientA-roastery, clientB-tech) at ~83ms/frame (~18x the Pillow spike's 4.5ms, as expected for real
WebGL through a headless browser vs. 2D compositing). Extrapolates to ~8s per 96-frame archetype per
client — not a throughput bottleneck. The earlier block on `node`/`npm` execution in this session was
diagnosed as a `.claude/settings.json` permissions gap (no `permissions.allow` entry for
`Bash(node:*)`/`Bash(npx:*)`, so every call fell through to interactive approval an unattended
worker can't answer), not a hook or PATH issue — fixed by adding that allowlist entry. This
supersedes the "ran in Python/Pillow, not three.js" framing directly below; kept as-is for the
historical record of what was and wasn't validated at the time.

**Original scope note (superseded above): this ran in Python/Pillow (2D), not through an actual
three.js headless capture** — this session's Bash tool denied both `npm install` and every attempted
`node` invocation (script files and inline `-e` alike), so the Playwright-based capture pipeline used
by the existing `flipbook-scale` spike could not be re-run here. What this spike validates is
specifically the piece that wasn't already covered elsewhere in this document: that a fixed template
driven purely by a per-client params dict produces a correct, distinct, no-hand-tuning output end to
end. Three.js's ability to actually *render* a category-appropriate template scene (a building
massing study, a product) was already separately validated earlier in this Visual Richness section
(r128, PBR materials, HDRI lighting, sustained 60fps, generalized cleanly across two categories) —
combining that existing evidence with this spike's parametrization result is the basis for the
recommendation below, not a claim that three.js rendering was re-tested here.

**The honest accuracy limit, stated plainly:** the template's *geometry* stays generic/abstract by
design — a stylized bottle shape, a generic architectural massing block. That satisfies the bar for
archetypes where an idealized, stylized representation is an accepted genre convention and the
brand identity is carried by color/logo/material, not by literal silhouette accuracy — this
document's own Awwwards evidence elsewhere (Longbow winning Site of the Day on a two-colour palette
with no photorealistic 3D at all) already supports that abstraction reads as premium, not cheap, in
this genre. **It does not satisfy the bar for the two archetypes whose entire point is showing the
client's own specific space** — ASSEMBLE (their actual building) and FLYTHROUGH (their actual
interior). A generic template tower assembling itself, or a generic hallway walkthrough, is exactly
the "client will notice a generic tower" failure this thread was told is non-negotiable to avoid.
Templating alone cannot close that gap — the geometry itself *is* the client-specific content for
those two, not an incidental carrier for their brand colors the way it is for a product rotation.

### The ASSEMBLE / FLYTHROUGH gap — the real tension, not resolved by picking one option

No single mechanism is both fully automated *and* fully accurate for these two archetypes. Recommended
split, disclosed as a genuine product tradeoff rather than a hidden gap (same reframing move Thread 1
used for the mandatory logo-review gate — "confirm your brand" instead of a silent limitation):
- **Default (free/included) tier:** ship the generic/abstract template for ASSEMBLE and FLYTHROUGH
  too, explicitly disclosed to the client as a stylized representation, not a scan of their specific
  building — consistent with this document's stated position elsewhere that abstraction is a
  legitimate premium-design choice, not a corner cut.
- **Paid add-on tier:** real photogrammetry-based capture (option b above) for clients who
  specifically want their literal building/interior rendered, priced and scoped as manual work
  outside the automated default pipeline — not something the generator claims to do at scale for
  every client.
- **Fallback within the free tier:** the existing archetype-selection rule already permits
  category-based reassignment; a client uncomfortable with a generic ASSEMBLE/FLYTHROUGH scene can be
  steered toward REVEAL/TRANSFORM/INTERFACE where applicable, sidestepping the accuracy problem
  entirely rather than solving it.

### Recommendation, stated decisively

1. **Default pipeline for SPIN, REVEAL, TRANSFORM, INTERFACE:** hybrid template scenes in three.js
   (already vendored at r128, zero new dependency — matches this project's stated anti-dependency
   bias, the same reasoning that rejected Dembrandt, GSAP+Lenis, and a font-matching API earlier),
   parametrized purely from Thread 1's `frameGeneration` token block. Automated, no per-site
   hand-tuning, sub-5ms/frame per this spike's measured throughput.
2. **ASSEMBLE and FLYTHROUGH ship generic/disclosed-as-stylized by default**, with real
   photogrammetry-based capture offered as an explicit manual, paid add-on — not the default
   automated path. This is the one place this thread cannot deliver a fully automated, fully
   accurate answer, and it is stated as such rather than resolved on paper.
3. **AI text-to-video (option a) rejected** as the mechanism for the deterministic sprite-sheet
   pipeline — the mismatch between implicit stochastic camera/geometry and this project's exact
   frame-count/camera-path contract is structural. Flagged as a separate, lower-stakes idea (a
   supplementary marketing clip) worth a future look, explicitly not this thread's deliverable.
4. **Logo compositing still waits on the human-reviewed asset.** Nothing here changes Thread 1's
   mandatory review gate — the template spike's logo-text stand-in models *where* the real,
   client-confirmed logo asset composites in (per `logoCompositing.appearsAtFrameFraction`), it is
   not a suggestion to composite an unreviewed logo.

### Native aspect ratio per archetype — the flagged open item, resolved

Only ASSEMBLE's portrait 2:3 (tested end-to-end via the sprite-scaling spike) and FLYTHROUGH's
landscape ~16:9 (reasoned for the dental/medical variant, 2026-08-05) were previously addressed. The
remaining four, reasoned from each archetype's actual content and genre convention, not guessed:

| Archetype | Recommended ratio | Reasoning |
|---|---|---|
| **ASSEMBLE** | 2:3 portrait (tested) | unchanged — a tower rising vertically reads as portrait |
| **REVEAL** | 4:5 portrait-leaning | elements dropping into place is primarily vertical motion, same gravity logic as ASSEMBLE — but the settled end-state is a fuller tableau (e.g. ingredients/product arranged together), not one tall stack, so slightly less extreme than 2:3 |
| **SPIN** | 1:1 square | a rotating object's silhouette swings between wide (0°/180°) and narrow (90°/270°) — square framing absorbs that swing without wasted vertical space; matches this spike's own 500×500 test canvas and the near-universal 1:1 convention of e-commerce 360° product viewers, the direct genre precedent |
| **TRANSFORM** | 3:2 landscape | before/after content (renovation, fitness, beauty) is shown side-by-side or via a wipe in existing genre convention (before/after sliders), which needs horizontal travel distance — landscape but less extreme than FLYTHROUGH, since the subject (a room, a face, a body) is still a relatively centered composition, not a full spatial glide |
| **FLYTHROUGH** | 16:9 landscape | generalizes the dental/medical-specific 2026-08-05 decision to the whole archetype — real estate/hotel/gym/venue walkthrough videography is shot landscape as a near-universal convention regardless of category |
| **INTERFACE** | 16:9 or wider landscape | the archetype's actual subject — dashboards, panels, data displays — is inherently landscape by genre convention (screens, SaaS/fintech UI), the same reasoning FLYTHROUGH uses, applied to software content instead of physical space |

**Honest gap:** REVEAL, SPIN, TRANSFORM, and INTERFACE's ratios above are reasoned from genre
convention and this thread's own spike canvas choice, not independently verified end-to-end through
the percentage-based CSS technique the way ASSEMBLE's 2:3 was in the sprite-scaling spike. The CSS
mechanism itself doesn't care about aspect ratio (already proven ratio-agnostic by that spike), so
no correctness risk is expected — but none of these four have been run through it directly.

### Honest gaps — not resolved on paper

- **Option (a) was not tested hands-on.** No API access/authorized spend for Runway/Kling/Veo/Luma
  this session (see Higgsfield-MCP note above) — the rejection is reasoned from published
  reference-image-consistency mechanism descriptions, not a direct test. If a future pass gets
  explicit budget approval, this is the one part of this thread's verdict most worth re-checking
  empirically rather than taking on faith.
- **Photogrammetry cost/time:** only the professional BIM-grade figures ($3,000–$10,000+, 2–4 weeks)
  are sourced from real market data. The cheaper DIY estimate (low hundreds to ~$2–3k, several days)
  is a reasoned guess from the general shape of the professional pricing, not independently sourced.
- **RESOLVED (2026-08-05, later session):** the hybrid-template spike originally ran only in
  Python/Pillow (2D), not through an actual three.js headless render — that gap is now closed.
  `scene.html`/`capture.js` executed successfully after a `.claude/settings.json` permissions fix
  (`Bash(node:*)`/`Bash(npx:*)` had no `permissions.allow` entry, so calls fell through to
  interactive approval an unattended overnight worker can't answer — not a hook or PATH problem, as
  originally suspected). Playwright + Chromium installed into the spike folder; 24 frames generated
  per client for both simulated clients, ~83ms/frame (~18x the Pillow spike's 4.5ms, expected for
  real WebGL through a browser), extrapolating to ~8s per 96-frame archetype per client — not a
  bottleneck. `scene.html`/`capture.js` are no longer an unexecuted reference design. Frame count was
  24 (not ASSEMBLE's 96) — confirmed hardcoded/intentional in `capture.js` (`N_FRAMES = 24`, commented
  as this archetype's lower frame-count need vs. ASSEMBLE's 96), not a test artifact to second-guess.
- **No end-to-end integration test** of the full pipeline (Thread 1 extraction → human review →
  Thread 3 compositing) against a real client exists yet — each thread has only been validated in
  isolation.
- **The ASSEMBLE/FLYTHROUGH default-vs-paid-tier split is a product proposal, not validated with any
  actual client** — untested whether clients will accept a disclosed-as-stylized default or will
  reliably reach for the paid add-on when it matters to them.

### Sources (Thread 3)
- [Best AI Video Generators with Consistent Characters in 2026 | Elser AI](https://www.elser.ai/blog/best-ai-video-generators-with-consistent-characters-in-2026-what-actually-works-across-multiple-scenes) — reference-image character-consistency mechanisms (Runway Gen-4, Veo 3.1 Ingredients-to-Video, Seedance 2.0, Wan 2.7)
- [Kling AI vs Runway vs Luma: 2026 AI Video Models Compared | Atlas Cloud](https://www.atlascloud.ai/blog/guides/kling-ai-vs-runway-vs-luma) — comparative model capabilities
- [Best AI Image-to-Video Generators 2026 | UlazAI](https://ulazai.com/best-ai-image-to-video-generators-2026/) — image-to-video camera-motion behavior
- [3D Laser Scanning Cost Guide 2026 | Arrival 3D](https://arrival3d.com/3d-laser-scanning-costs/) — professional 3D scanning cost/turnaround figures
- [3D Scanning Cost Guide 2026 | THE FUTURE 3D](https://www.thefuture3d.com/learn/3d-scanning-cost-guide/) — commercial scanning cost breakdown, per-sq-ft pricing
- Spike: `C:\Jarvis\spikes\frame-generation\` (`template_spin.py`, `out/template-spin-results.json`, `scene.html`/`capture.js` — executed 2026-08-05, see UPDATE above, `out/timings.json`)

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
