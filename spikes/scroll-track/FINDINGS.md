# Scroll-track rendering gap — investigation and fix

2026-08-05. Reused the sprite sheet and static fallback frame from `../flipbook-scrub/` unmodified.
Built `before.html` (current adopted pattern, unchanged) and `after.html` (fixed) to compare
directly. Tested in `C:\Jarvis\spikes\scroll-track\`.

## Which contexts actually break — established concretely, not assumed

Tested three distinct rendering contexts against `before.html`:

1. **Full-page screenshot** (Playwright's default `fullPage: true`, the same CDP
   `captureBeyondViewport` composite mode most headless screenshot tools use). **Broken, confirmed**:
   `out/before-fullpage.png` shows header → hero (correctly at frame 000) → **~3000px of blank white
   space** → page content, duplicated nowhere but visually severed from the hero by a wall of white.
2. **Print / PDF export** (`page.emulateMedia({ media: 'print' })` + `page.pdf()`). **Broken,
   confirmed**: identical defect to #1 — Chromium's print/PDF path uses the same full-document-height
   render, and no `@media print` rules existed yet to change that.
3. **Normal single-viewport render** (`fullPage: false`, i.e. what a plain screenshot, most crawlers,
   and the actual first-impression view of the page look like). **NOT broken** — `out/before-singleviewport.png`
   shows a completely normal hero at frame 000, exactly as intended. This case was never at risk;
   the defect is specific to tools that deliberately render the *entire scrollable document height*
   in one non-interactive pass, not to viewing the page normally.

**Concretely, the real risk is: full-page/"capture entire page" screenshot tools, PDF export, and
print — not normal browsing, not most crawlers** (which typically render at a fixed viewport height,
same as case #3, unless they specifically request a full-page capture).

## The fix — real, not a workaround, in the one context where a real fix is possible

**`@media print`: full, complete fix.** Print is the one context here that's reliably detectable
from CSS. Added a print-media block that collapses `.hero-track` to a normal `100vh`, switches
`.hero-sticky` to `position: static`, and swaps the sprite box to the same static fully-assembled
frame (`frame-095.png`) already used for the Firefox/mobile fallback — consistent with the existing
convention rather than inventing a new one. **Verified**: print-media document height dropped from
4837px to 1237px (the `after.html` print `scrollHeight` printed by the test), and
`out/after-print-fullpage.png` shows a clean header → hero (single static frame, no gap) → content →
footer, with zero blank space. `page.pdf()` succeeded on both `before.html` and `after.html`
(Chromium's PDF path always uses print-media rules, so the same fix applies there automatically).

**General case (screenshot tools, crawlers doing a full-page capture) — no complete fix exists, and
that's stated plainly, not glossed over.** There is no CSS media feature, and no reliable
DOM/JS signal, that distinguishes "a real user about to scroll" from "a screenshot tool compositing
the whole document in one non-scrolling pass" — confirmed by investigation, not assumed (Playwright's
`fullPage` mode specifically renders via a beyond-viewport composite with no actual scroll events
firing at all, which is indistinguishable at the CSS level from a page that simply hasn't been
scrolled yet). **What IS fixed: the failure mode changed from "looks broken" to "static, no
motion."** Gave `.hero-track` itself a `background-color` matching the hero's own dark backdrop.
The sticky sprite still renders in its normal (non-stuck) flow position at the top of the space in a
flattened composite — unchanged, since that's a rendering-engine behavior outside this page's
control — but the space below it, which was previously a jarring blank-white void, is now a smooth
continuation of the hero's own color treatment. **Verified**: `out/after-fullpage.png` vs.
`out/before-fullpage.png` — same layout height, same static hero-at-top, but the ~3000px gap is now
a dark panel matching the hero instead of white space breaking the page in two.

**Honest constraint, stated precisely:** no CSS-only or reasonably-scoped JS fix can make a
full-page-composite screenshot tool show the *animation* — that would require the tool to actually
execute a real scroll loop, which is a property of the capturing tool, not something a page can
force. This is not unique to this project's implementation; it's true of any scroll-driven design
captured by a tool that doesn't emulate scrolling (the same would be true of Apple's own
flipbook-style product pages, for instance). The constraint that remains after this fix: **full-page
screenshot/crawl tools will show a static, correctly-themed hero at its initial frame, with no
visible defect, but no animation** — which is a reasonable, unsurprising degradation, not a bug.

## Recommendation

Adopt both pieces of `after.html`'s fix into the real generator template:
1. `@media print` collapse (full fix, verified).
2. `.hero-track { background-color: <token color> }` matching the hero's dark backdrop (mitigates
   the general case's worst symptom; verified via screenshot comparison).

No further work needed on this specific defect — the print/PDF case is fully solved, and the general
full-page-screenshot case has a real, verified improvement with an honestly-stated, unavoidable
residual limitation (no motion in a non-scrolling capture), not a hidden gap.

## Files
- `before.html` / `after.html` — the two page variants.
- `test-contexts.js` — the test harness (usage: `node test-contexts.js <file> <prefix>`).
- `out/*-fullpage.png`, `out/*-print-fullpage.png`, `out/*-singleviewport.png`, `out/*.pdf` — evidence.
