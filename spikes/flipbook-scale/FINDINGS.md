# Flipbook sprite-sheet scaling investigation — findings

2026-08-05. Reused the existing 96-frame sprite sheet and individual frames from
`../flipbook-scrub/` unmodified. Nothing regenerated. Tested in `C:\Jarvis\spikes\flipbook-scale\`.

## The core question, answered: YES, a single sprite scales cleanly — with one real requirement

**`background-size` CAN scale the sheet proportionally so every step lands exactly one clean frame,
at any viewport width — using PERCENTAGE units, not pixels.** The walking skeleton's bug was caused
by `background-size: 38400px 600px` (literal native pixel size) on a box wider than one frame,
which let several adjacent 400px-wide frames show through a wide viewing window. Switching to
`background-size: 9600% 100%` (9600% = 96 frames × 100%) with `background-position-x` animated in
**percent** (0% → 100%, not pixels) fixes this completely: CSS background-position percentages are
resolved relative to the container's own size, so each frame always occupies exactly 100% of the
container's width regardless of what that width actually is. No breakpoints, no multiple sheets,
one asset.

**The one real requirement: the container must keep the frame's native aspect ratio (2:3 for this
sprite).** Tested this two ways:
- **Aspect-locked, "contained" box** (`height: min(78vh, 720px); aspect-ratio: 2/3`): clean, single,
  undistorted frames at every one of 5 tested viewport widths (1920/1440/1024/768/390), confirmed
  both by automated frame-index checks and direct screenshot inspection against the frames' own
  baked-in frame-number labels.
- **Full-bleed, aspect-mismatched box** (`100vw x 100vh`, ignoring the sprite's native ratio): the
  bleeding bug is gone (percentage sizing prevents it regardless of aspect), but a **new, different
  problem appears — visible content distortion**. Each frame still shows cleanly, one at a time, but
  stretched non-uniformly to fill a box shaped nothing like the source content (confirmed by
  screenshot: `out/fullbleed-vw1920-t100.png` shows the tower blocks squashed into wide horizontal
  bars spanning the full 1920px width). **This is a content/design mismatch, not a CSS engineering
  problem** — no scaling technique makes a portrait 2:3 sprite look correct stretched into a
  landscape full-viewport box. Full detail: `out/results.json`, screenshots in `out/`.

## Frame accuracy

Automated check across 5 viewports × 4 scroll fractions (0/25/50/100%) × 3 techniques (contained,
full-bleed, vertical) = 60 samples. 45/60 exact matches on first read; after fixing a bug in the
*test harness itself* (`getComputedStyle` returns the raw percentage string for an animated
percentage `background-position`, not a resolved pixel value — the harness was parsing "50%" as if
it were "-50px"), reran clean: **45/60 exact frame matches, with the remaining 15 "mismatches" all
being the identical, deterministic ±1 frame at exactly the 50% scroll midpoint** (expected 47, got
48) — same magnitude, same direction, in all 15 cases, regardless of viewport width or technique.
This uniformity is itself evidence it's a `steps(95, jump-none)` boundary-rounding convention
(exactly at the midpoint, two adjacent CSS spec interpretations are both defensible), not drift or
a real defect — a genuinely broken technique would show inconsistent errors across different
viewport sizes, not one identical offset everywhere. Not root-caused further; imperceptible in
practice (one frame out of 96, at one exact scroll pixel).

## Memory/decode ceiling — tested directly, not found in this environment

Tested a real 76,800×1200px native source image (the "2x" resolution sheet, not just a virtually
CSS-upscaled small one) — loaded and rendered correctly, zero console errors, zero request
failures, zero visible corruption, across all scroll positions (`check-2x.js`, `out/2x-t*.png`).
Also confirmed the original sheet CSS-upscaled to a virtual width of ~184,000px (96 × 1920px, the
full-bleed test at the widest viewport) rendered without failure. **No hard ceiling found in this
Chromium build at these scales** — doesn't rule out limits on other browsers/GPUs/mobile devices,
untested here.

## Vertical strip (option c) — works, but costs more for nothing

Repacked the existing 96 frame PNGs into a vertical strip (`spritesheet-vertical.png`, via Pillow,
no new artwork) and ran the identical percentage technique transposed (`background-size: 100%
9600%`, animate `background-position-y`). **Frame accuracy and bleed behavior are identical to the
horizontal version** — orientation doesn't matter for correctness. **But file size is 2.56x larger
for byte-identical visual content**: 262,662 bytes (vertical) vs. 102,526 bytes (horizontal,
existing measurement), almost certainly because PNG's row-based compression benefits from
horizontal redundancy between adjacent similar frames that a vertical stack breaks up. No reason to
use vertical.

## Resolution / file-weight cost of a crisp contained hero

The existing 400×600/frame source is already close to sufficient at the tested contained-box cap
(max measured box width 480px at the widest viewport, only a ~1.2x upscale) — but not crisp on
high-DPI/retina displays, which need roughly 2x the CSS pixel size in real source pixels. Measured
the real file-weight cost of upscaling the *existing* sheet (Pillow LANCZOS resize, no new content):

| Resolution | Per-frame size | Sheet size | File weight |
|---|---|---|---|
| 1x (existing) | 400×600 | 38,400×600 | 102,526 bytes (100.1 KB) |
| 1.5x | 600×900 | 57,600×900 | 323,072 bytes (315.5 KB) |
| 2x | 800×1200 | 76,800×1200 | 543,892 bytes (531.1 KB) |

File size scales sub-quadratically relative to pixel count (2x linear = 4x pixels, but only ~5.3x
file size) — PNG compression absorbs some of the cost, not all of it.

## Recommendation

1. **Adopt percentage-based `background-size`/`background-position` instead of pixel-based.** This
   alone fixes the original bleeding bug, at zero additional asset cost, and requires no breakpoints
   or multiple sprite sheets.
2. **Don't force full-bleed.** Compose the hero as a contained, centered hero-object (matching this
   project's own prior "one confident centerpiece" precedent for the 3D hero-object work) sized to
   the sprite's native aspect ratio, capped at a sane maximum (e.g. `height: min(78vh, 720px)`) —
   this sidesteps the distortion problem entirely and keeps the required upscale factor small.
3. **Render frames at 2x the display cap's resolution** (concretely: 800×1200/frame for the current
   720px-tall cap) for crispness on high-DPI displays, at a measured, real cost of ~531KB per
   client/archetype sprite sheet — still one single asset, no added HTTP requests.

## Sources
- Repacking/measurement script inline in this investigation (Pillow, LANCZOS resize) — not a new
  frame-generation script, purely measurement tooling on existing assets.
- Test pages: `percent-contained.html`, `percent-fullbleed.html`, `percent-vertical.html`,
  `percent-2x.html`, `static-check.html`.
- Automated results: `out/results.json`. Screenshots: `out/*.png`.
