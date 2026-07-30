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

## Links

## Related
- [[Ideas/Website Generator (Landing Pages + Clone-and-Rebuild)]]
- [[Projects/Jarvis System]]
