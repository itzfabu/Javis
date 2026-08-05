# Walking-skeleton E2E run — breakage report

2026-08-05. One fake client (Ironclad Construction Co., construction/trades, ASSEMBLE archetype),
brand extracted from a real live site (gfryork.com / Grace Family Roofing, reused from the Thread 1
validation spike), run through every stage to `out/site/ironclad-construction-co/index.html`.
Nothing here was polished — the goal was finding out what breaks when the three threads' designs
actually have to fit together. They mostly did. Four things didn't, and they're the real find.

Pipeline: `input.json` → `extract-and-tokenize.js` (extract2.js, unmodified, + terminal review gate
+ Thread 1 schema mapping) → `assemble.js` (Thread 2 skeleton + hero + Web3Forms) → `screenshot.js`.

## What actually broke

### 1. The flipbook hero technique doesn't work at hero scale — this is the big one

The flipbook-scrub spike proved native-CSS scroll-scrubbing at a fixed **400×600px box**, exactly
one sprite-frame wide. Thread 2/3's hero, by every other description in this note ("one confident
centerpiece," full-bleed archetype frames), is a full-width hero section — 1440px+ on desktop.

Wiring the sprite sheet straight into a full-width hero (background-size at the sprite's true
native pixel dimensions, `38400px 600px`, per the proven spike CSS) doesn't scale the frame to fit
the box — it shows a **1440px-wide slice of the unscaled 38400px strip**, which is wide enough to
reveal 3-4 *adjacent* frames side by side instead of one. First screenshot of this run
(`out/screenshot-desktop-top.png`, before the fix, not kept) showed frames 047/048/049 tiled
horizontally next to each other. Nobody caught this in Thread 1, 2, or 3's research because the
flipbook spike's own accuracy testing (`sampled at 10/25/50/100% scroll`) only ever checked *which
frame number* was showing, never checked it inside a real, full-width hero layout.

**Worked around here, not fixed:** the animated sprite now renders as a centered 400×600 box
*within* the hero (drop shadow, dark background) instead of full-bleed — matching the scale the
technique was actually proven at. This is legitimate for a placeholder but almost certainly wrong
for a real archetype hero, which the rest of this note describes as filling the viewport. The real
fix needs one of: (a) generating frames at actual hero resolution (which breaks the note's own
100.1KB sprite-sheet file-weight finding — that number was measured at 400×600, not at whatever a
real hero resolution turns out to be), or (b) a fundamentally different CSS approach for a
full-bleed scrub that this spike didn't have scope to invent. **Flagging back to whoever picks up
Thread 3: the proven technique and the described use case are not the same scale, and that gap is
unpriced in every estimate in this note so far.**

### 2. The 500vh scroll-track is invisible to anything that isn't a live scrolling viewport

Related to #1 but distinct. The enhanced hero uses `.hero-track { height: 500vh }` with a
`position: sticky` element pinned inside it — this is what makes the scrub work while a real user
scrolls. But a **full-page screenshot** (`out/screenshot-desktop-fullpage.png`) renders the entire
document height at once rather than emulating a scrolling viewport, and shows exactly what's really
there: ~400vh of blank white space between the hero and the trust bar, because outside the moment
of being actively scrolled-past, the sticky element's container is just an empty tall box.

This will affect **any tool that renders the full page without emulating scroll** — screenshot
tools, PDF export, print stylesheets, and some SEO/preview crawlers that don't run a real scroll
loop. Mobile doesn't have this problem (confirmed: `out/screenshot-mobile-fullpage.png` shows no
gap) only because Thread 2's mobile decision already routes mobile to the static fallback, which
never sets the 500vh height in the first place — an accidental save, not a designed one. **This is
a real, previously undiscussed cost of the adopted flipbook approach that only shows up outside a
live browser scroll session**, and it's not mentioned anywhere in the Visual Richness research.

### 3. Thread 1's schema has real fields with no defined fallback when extraction returns null

Hit immediately, not a hypothetical: the live extraction against gfryork.com returned
`color.footer: null` (no distinct footer background detected — this exact null was already
documented in Thread 1's own validation results, so it wasn't a surprise that it happened, but
**what to do about it in the token schema was never decided**). Thread 1's schema has a `secondary`
field sourced from footer background with no documented behavior for "footer came back null."

Improvised here (`extract-and-tokenize.js`): derive `secondary` as a 40%-darkened shade of
`primary`, using the same tint/shade derivation rule Thread 1 already uses for border/surface. It's
a reasonable improvisation, but it's an improvisation — Thread 1's schema doesn't say this is the
rule, and a different builder could reasonably invent a different fallback and get a different
result from the same extraction.

### 4. `surface` and `background` collapse to the same value on light-background sites, silently

`extract2.js`'s FIX4 derivation rule sets `surface = pure white` whenever the detected background
is near-white (rather than tinting it) — which means for this site (background `#ffffff`), the
token JSON's `color.surface` and `color.background` are **byte-identical**. Thread 2's skeleton
depends on visual separation between sections (alternating background/surface panels is how a
trust bar or an "alt" section reads as a distinct block rather than bleeding into the next one) —
with surface===background, that separation is structurally impossible using the tokens as extracted.

Worked around here by inventing a `--color-panel: #f4f5f7` CSS variable that doesn't exist anywhere
in Thread 1's schema, specifically because the real token was unusable for this purpose. This is a
second undocumented-fallback situation like #3, but on the *design* side rather than the
*extraction* side — Thread 2's skeleton assumes a token that Thread 1's schema, as specified,
cannot reliably provide for any light-background site (which, per Thread 1's own 9-site validation
spike, is most of them).

## Smaller things that surfaced

- **The identity mismatch is real, not just theoretical.** The extracted logo correctly says "THE
  GRACE FAMILY ROOFING COMPANY" — because that's genuinely whose site was scraped — sitting right
  next to "Ironclad Construction Co." in the header (visible directly in every screenshot). This
  was deliberate for this spike (a fake client needs a real site to scrape from) and doesn't
  invalidate anything, but it's a vivid, concrete reminder that Thread 1's pipeline only makes
  sense when the URL a client provides is genuinely *their own* site — there's no field anywhere
  that would catch "client gave us a competitor's URL by mistake" versus "client gave us their own
  site." Not this session's problem to solve, just worth having actually seen it happen.
- **The extracted logo asset is a white-on-transparent mark**, meaning it only works on a dark
  surface. It renders fine in this build (dark navy header) by luck, not by design — nothing in
  Thread 1's token schema records "this logo variant needs a dark background," so a page template
  that tried to place the same logo asset on a light surface (e.g. a light footer) would render it
  invisible. Another schema gap the research didn't anticipate.
- **The FAQ accordion, using bare `<details>/<summary>`, needed zero CSS or JS to be fully
  functional** — genuinely easier than expected, and consistent with this project's established
  vanilla-only bias.
- **The Google Fonts step got lucky.** The extracted fonts (Barlow / Barlow Condensed) happen to
  already be real Google Fonts, so the substitution table Thread 1 flagged as unbuilt was never
  actually exercised. This run doesn't prove that gap is fine — it proves this run didn't test it.
- **The terminal review-gate concept works, but confirmed how crude "crude" really is.** Typing a
  raw hex code (`#d5253f`) into a terminal prompt to override a bad accent extraction is a real,
  working mechanism — and also a genuinely bad interface for a non-technical client, which lands
  directly on Thread 1's still-open question of who performs the review. Watching it happen made
  the "if the client reviews, it becomes a real feature" argument more concrete: a client would
  need to see a color swatch, not read a hex code off a JSON dump.
- **Windows/git-bash + Node's `readline` only resolves the first `question()` call against piped
  stdin, then hangs forever on the second** — a real, reproduced environment quirk (confirmed with
  a 3-line minimal repro), not a design flaw. Worked around with a stdin-queue fallback for
  non-interactive runs; real interactive terminal use is unaffected and still goes through
  `readline` normally. Noting this only because it cost real time and would trip up anyone else
  scripting this pipeline non-interactively on Windows.

## What was easier than expected

- Extraction → token mapping was mechanical once the role mapping (primary←header, secondary←footer,
  accent←CTA) was made explicit — Thread 1's schema *implies* this mapping only through inline
  comments in its worked example, never states it as a rule, but it was consistent enough in
  practice to code directly.
- The WCAG contrast math (Thread 1's "implement directly, no dependency" decision) was genuinely
  about 15 lines, exactly as estimated, and worked first try.
- Web3Forms + mailto + click-to-call wired together with no surprises — the Thread 2 form-backend
  decision translated to HTML directly, no gaps found here.

## The screenshot verdict, honestly

`out/screenshot-desktop-fullpage.png` / `out/screenshot-mobile-fullpage.png`. It reads as a real,
navigable small-business page — header, hero, trust bar, services, reviews, FAQ, contact, footer,
sticky mobile call bar all present and in the right order. But it **looks generated**, not premium:
flat card grids, no real photography (the omitted project-gallery section leaves a visible gap for
exactly the category — construction — where "photos of what we built" would matter most), and the
hero's placeholder tower graphic reads as a coding demo, not a client's actual building. That's
expected and correct for this stage — Thread 3 (real per-client frames) and the later UI Craft
polish (motif repetition, microtiming, 2.5D layering) were explicitly out of scope here — but it's
worth being direct: nothing about this output would close a sale today. It proves the pipeline
connects end-to-end, not that the product is close to done.

## Honest gaps in this spike itself

- Only one client, one category, one real extraction source tested — none of the above is validated
  across the variety Thread 1's original 9-site spike covered.
- The Web3Forms integration was never actually tested against a live account (placeholder access
  key, per instructions) — the HTML is correct per Web3Forms' documented API shape, not confirmed
  by an actual successful submission.
- No accessibility/contrast testing beyond the WCAG math already computed into the tokens — no
  screen-reader pass, no keyboard-nav check.
- Mobile was only checked at one viewport width (390px); no tablet or landscape check.
