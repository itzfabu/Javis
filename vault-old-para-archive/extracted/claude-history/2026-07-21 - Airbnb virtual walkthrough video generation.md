---
title: "Airbnb virtual walkthrough video generation"
created: 2026-07-21T12:52:15.518944Z
uuid: 1635b67b-53b2-4c0c-9eab-1dde584e48b1
source: claude-export-extracted
raw_note: "[[2026-07-21 - Airbnb virtual walkthrough video generation.md]]"
tags: [claude-history, extracted]
---

# Airbnb virtual walkthrough video generation (extracted)

## Entities
- **Higgsfield** — third-party MCP video generation connector (image-to-video animation).
- **Airbnb listing** — 6 room photos used as source material for a promotional walkthrough video.
- Models mentioned: Kling3_0_turbo, seedance_2_0 (Higgsfield's video generation options).

## Decisions
- User confirmed the fallback approach: generate individually-animated clips per room (subtle dolly/pan/parallax) and stitch them into one sequence, rather than a true single continuous walkthrough — accepted after being told the latter isn't technically achievable without hallucination.
- User chose to proceed via Higgsfield for generation.
- Task stalled: required video models need a paid Higgsfield plan; user's account is free-tier. Options presented (3-day free trial w/ 100 credits, Plus $39/mo, Ultra $99/mo) — no plan selection made yet.

## Patterns
- Assistant was explicit about technical limitations before proceeding, refusing to overpromise seamless multi-room continuity from static photos.
- Preference for being asked directly ("Want me to proceed this way?") before committing to a workaround approach.
- Local file uploads to third-party MCP tools required a browser upload widget due to sandboxed network egress.
