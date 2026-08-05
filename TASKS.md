# Tasks

Format: - \[ ] Task text | priority: high/medium/low | due: YYYY-MM-DD | #project-tag

## Active

- [ ] Write up "Claude Flowstate" idea as a note | priority: low

- [ ] Research how to improve the Jarvis system further (architecture, tools, capabilities, possible new dashboards e.g. a finance dashboard for project income once there's income to track) | priority: medium | #jarvis-system
  - Input ready for this one: vault/Ideas/Multi-Page Orb Dashboard.md (multi-page dashboard concept + notes-panel cleanup) and vault/Ideas/Finance Dashboard for Project Income.md - start here tomorrow morning.

- [ ] Small Thread 1 schema addition: promote `category` to a first-class token field (e.g. "category": "food-beverage") instead of leaving it inside archetype.reason free text | priority: low | #website-generator

- [ ] Research frame generation for the flipbook archetypes: evaluate AI text-to-video->frames vs. real 3D render->export vs. hybrid template scenes; accuracy is non-negotiable for clients wanting their actual building/product (Thread 3 of 3, do last - depends on brand tokens being locked) | priority: medium | #website-generator
  - Sprite-scaling prerequisite CLEARED 2026-08-05, see Done section below - Thread 3 can proceed once otherwise ready. Output spec now defined: one sprite sheet per client/archetype, horizontal layout, 2x display-cap resolution, percentage-based CSS. Open item Thread 3 still needs to decide: the native aspect ratio per archetype (only the placeholder tower's 2:3 was tested).

- [ ] Package for end customers (clean file + setup guide, no dev/diag mode visible) | priority: high | #streamer-hud
- [ ] Write customer-facing setup instructions (OBS flag + one-time mic click) | priority: medium | #streamer-hud
- [ ] Decide delivery/sales channel (Gumroad, Etsy, itch.io, own site) | priority: medium | #streamer-hud
- [ ] Write basic licensing terms | priority: low | #streamer-hud

## Done

(move completed tasks here instead of deleting them)

- [x] Add color/theme customization options to the streamer HUD widget | priority: high | #streamer-hud

- [x] Research brand extraction: pull a client's real colors/fonts/logo from an existing site or brand input, feed as tokens into hero frames + page (Thread 1 of 3) | priority: high | #website-generator
  - DONE 2026-08-05: approved as validated architecture, token pipeline not yet built (diminishing returns on further polish spikes — the mandatory human review gate on logo/accent holds regardless of hit rate). Open product question recorded, not resolved: who performs the review (Fabio vs. client) — see new task above. Full record in vault/Projects/Website Generator.md, Thread 1 section.

- [x] Research the conversion skeleton: proven page structure below the hero (services, social proof, contact/lead flow) that turns visitors into leads (Thread 2 of 3) | priority: medium | #website-generator
  - DONE 2026-08-05: approved as architecture, nothing built. Skeleton, category table, omit-by-default list, and content-input table all adopted. Surfaced a real blocker (no form backend) — see form-backend entry below. Full record in vault/Projects/Website Generator.md, Thread 2 section.

- [x] Settle the form-backend blocker Thread 2 surfaced: generated sites' contact form has nowhere to submit to (static output, no server) | priority: high | #website-generator
  - DECIDED 2026-08-05: Web3Forms adopted now (one account, many generated sites) + a visible mailto: line as zero-cost redundancy + prominent click-to-call as primary, per Thread 2. The proposal's self-hosted Flask-endpoint-relaying-through-Resend design is NOT rejected, just deferred — its cost is ongoing operational responsibility (personal uptime liability for other people's leads) that isn't worth taking on before there are any clients, and orb/app.py currently runs on a workstation that gets restarted routinely, not an always-on host. SWITCH TRIGGER: build the self-hosted endpoint when EITHER 5+ paying clients exist OR the Web3Forms free tier starts capping out — prerequisites at that point are an always-on host for the Flask app and a designed alerting/health-check mechanism (currently undesigned). Full record in vault/Projects/Website Generator.md, Thread 2 → Form Backend section.

- [x] Add a derivation layer to Thread 1's token schema (null fallback per color role, `surface` always derived from `background` with a minimum lightness delta instead of extracted directly, `derived: true/false` flag per token value) | priority: medium | #website-generator
  - DONE 2026-08-05: schema addition, backward-compatible, not a reopening of Thread 1's architecture decision. Prompted directly by two walking-skeleton findings: a null footer color with no defined fallback, and surface/background collapsing to the same value on light-background sites (the majority case per Thread 1's own 9-site validation). Full record in vault/Projects/Website Generator.md, Thread 1 → Derivation Layer section.

- [x] Solve the flipbook sprite-sheet's full-bleed hero scaling gap (Thread 3 prerequisite) | priority: high | #website-generator
  - RESOLVED 2026-08-05: root cause was pixel-based `background-size`, not a limit of the technique. Fix: percentage-based `background-size`/`background-position` (one sprite sheet, no breakpoints needed) + compose the hero as a contained/centered hero-object matching the sprite's native aspect ratio, not literal full-bleed (full-bleed causes a different problem, content distortion, regardless of CSS technique — a design mismatch, not fixable in CSS). Verified across 5 real viewport widths, no bleed, frame-accurate. Vertical sprite orientation tested and rejected (2.56x larger file for identical content). No memory/decode ceiling found up to a real 76,800px-wide source. Real cost: crisp rendering needs ~2x resolution (531KB vs. the original 100.1KB measurement) — stated honestly, does not reverse the CSS-vs-GSAP decision. Thread 3 output spec now defined. Full record in vault/Projects/Website Generator.md, RESOLVED Flipbook Alternative section.

- [x] Decide who performs the mandatory brand-review step (Fabio vs. the client) before the Thread 1 token pipeline is built | priority: high | #website-generator
  - DECIDED 2026-08-05: the CLIENT reviews, not Fabio. Fabio reviewing caps throughput at his own attention and contradicts the "no per-site hand-tuning" premise; the client is better suited anyway (they know their own brand, Fabio would just be guessing). Reframes the mandatory review gate as a "confirm your brand" onboarding feature rather than a visible limitation. Consequence: the token pipeline needs a review UI + correction round-trip, not a fire-and-forget script — the review step must surface the logo, accent/primary color, and detected fonts with an easy correction path, and should visually distinguish `derived: true` values from extracted ones. Also closes the wrong-URL gap the walking skeleton found, for free — a client reviewing their own "confirm your brand" screen would catch an unfamiliar logo/colors extracted from the wrong site. Full record in vault/Projects/Website Generator.md, Thread 1 section.

- [x] Fix the flipbook hero's scroll-track rendering gap (full-page screenshot/PDF export show ~400vh of blank white space between hero and content) | priority: high | #website-generator
  - RESOLVED 2026-08-05: established concretely which contexts break (full-page screenshot composite and print/PDF export — confirmed broken) vs. which don't (normal single-viewport render, most crawlers — confirmed fine, never at risk). Print/PDF: fully fixed via `@media print` collapsing the hero to a normal 100vh static frame — verified, zero blank space. General full-page-screenshot case: no complete fix is possible (no reliable way to detect a non-scrolling composite render, confirmed by investigation) — real mitigation adopted instead, `.hero-track` given a background-color matching the hero's own theme, so the failure mode changed from "jarring blank-white void" to "static themed panel, no motion" — verified by before/after screenshot. Honest constraint stated precisely: no page-level fix can restore the animation in a tool that doesn't emulate real scrolling. Both fixes adopted for the real generator template. Full record in vault/Projects/Website Generator.md, RESOLVED Scroll-track rendering gap section.

- [x] Thread 3 gap: dental/medical doesn't map to any of the six hero archetypes | priority: low | #website-generator
  - RESOLVED 2026-08-05: not a seventh archetype. Dental/medical splits in two — cosmetic/aesthetic practices already fit TRANSFORM (unchanged), and the actual gap (general/family practice) now maps to FLYTHROUGH: a calm environment tour (reception → hallway → treatment room → friendly staff → front desk) that reduces dental/medical anxiety the same way FLYTHROUGH already builds trust for gyms/hotels — ties directly to Thread 2's own finding that booking/insurance/credentials, not visual drama, convert this category, so a slower, quieter FLYTHROUGH pacing is the correct tone. Recommended native aspect ratio: landscape ~16:9 (genre convention for space walkthroughs), contrasting with ASSEMBLE's portrait 2:3 — not independently tested, flagged for Thread 3 to verify when it starts. Full record in vault/Projects/Website Generator.md, Visual Richness → archetype library section.

- [ ] ❌ Validate pricing and positioning against direct competitors on Fiverr/Upwork | priority: high | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Build a portfolio/demo site showcasing the orb dashboard | priority: high | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Draft the actual gig/listing copy | priority: medium | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Record a 3-5 min demo video of the orb dashboard and agent delegation in action | priority: high | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Decide target buyer: individual assistant-seekers vs. small-business automation clients | priority: high | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Scope a productization checklist (auth, config isolation, docs) before quoting client work | priority: medium | cancelled: 2026-07-29 | #jarvis-as-a-service
- [ ] ❌ Build v1 static demo site (screen-recording hero, no live backend) once the recording exists | priority: medium | cancelled: 2026-07-29 | #jarvis-as-a-service

