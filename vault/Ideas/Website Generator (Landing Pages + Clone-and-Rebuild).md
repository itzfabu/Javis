---
date: 2026-07-30
type: idea
tags:
  - idea
ai-first: true
status: evaluating
related-projects: ["[[Projects/Jarvis System]]"]
---

# Website Generator (Landing Pages + Clone-and-Rebuild)

## For future Claude

Grew out of the dashboard conversation on 2026-07-30, once "generate websites" turned out to be
a real product idea, not a dashboard feature. Confirmed as its own project and logged directly
at evaluating status — assessed with real research (market landscape, legal guardrails, design
vocabulary) before deciding whether to graduate it to a full Project note, rather than sitting
at captured first.

## The idea

Two build modes:
1. **Generate** — a modern landing page from a prompt plus Google reviews as input.
2. **Clone-and-rebuild** — paste an existing website URL and remake it with new branding/details
   for a different client.

## Why it matters / context

**Market landscape** — two real categories exist: template-locked all-in-one builders (Wix,
Squarespace, Hostinger) whose exported code doesn't run anywhere else, versus AI-first code
generators (Lovable, v0, Bolt.new) that produce real, portable components. Since most major
players deliberately lock users into their own hosting, a Jarvis-built version that outputs
genuinely portable static files is a real differentiator, not just a smaller competitor.

**Clone-mode legal guardrails** — rebuilding a client's own outdated site for them is safe
territory. Using another site as a structural/design reference while swapping in fresh branding
and content for a different client is accepted normal practice across this whole tool category
(Repaint, Anima, UXMagic, Clonyfy all work this way). Cloning a company's site to hand a
lookalike to their direct competitor is the actual line not to cross. Not legal advice — worth
real legal judgment if this gets built and sold commercially.

**Design vocabulary ("modern," concretely)** — GSAP-driven scroll-triggered animation (the
dominant engine behind current award-winning sites), single-page or few-page flowing structure
over deep click-navigation, video/motion embedded directly in hero sections rather than static
images, confident typography. Sourced from Awwwards' own current category taxonomy and today's
SOTD/trending work, plus Dribbble's current top shots.

**Business model** — dual-purpose: building sites for Fabio's own future products, and selling
website-generation as a service to companies across industries.

## Resolved technical decisions
- **Google reviews input** — entered manually, not pulled via API. The standard Places API only
  surfaces a handful of "most relevant" reviews per business; full access requires the business's
  own Google Business Profile OAuth — real complexity not justified for an idea still at
  evaluating.
- **Output format** — real static HTML/CSS/JS files, not a templated system. This is the actual
  competitive differentiator identified in the research (most builders lock users into their own
  platform), and it's already proven working today via the same approach used to build both the
  Projects and Background dashboards.
- **MVP scope** — generate-from-prompt only. Clone-and-rebuild is deferred: it's a different
  technical problem (fetching and analyzing an external site) and carries the legal-guardrail
  judgment already flagged above.

## Next step if pursued
- Scope what generate-from-prompt actually needs technically: what Claude Code is prompted with,
  what the output file structure looks like, and how a user's prompt becomes a working page.

## Sources

**Builder comparisons (portability/lock-in):**
- [Best AI Website Builders in 2026: 15 Tools Ranked and Compared](https://playcode.io/best-ai-website-builders) — dedicated code-export/portability comparison across 13 builders
- [allaboutcookies.org — Best AI Website Builder 2026](https://www.allaboutcookies.org/best-AI-website-builder)
- [tech.co — Best AI Website Builders 2026](https://tech.co/website-builders/best-ai-website-builders)
- [elementor.com — 10 Best AI Website Design Generators 2026](https://elementor.com/blog/10-best-ai-website-design-generators-2026)
- [website-builders.cybernews.com — AI Website Builders](https://website-builders.cybernews.com/ai-website-builders)
- [technoparkai.com — Best AI Website Builders 2026](https://technoparkai.com/best-ai-website-builders-2026)
- [emergent.sh — Best AI Website Builders](https://emergent.sh/learn/best-ai-website-builders)

**Clone-website tools and legal/ethical framing:**
- [designrevision.com — Copying a Website with AI](https://designrevision.com/blog/copy-website-with-ai) — covers screenshot-to-code tools, code ownership, and the legal line on copying competitor designs
- [Repaint — Website Redesign](https://repaint.com/website-redesign)
- [Anima — Clone Website to Code](https://www.animaapp.com/blog/design-to-code/clone-website/)
- [UXMagic — AI Website Cloner](https://uxmagic.ai/clone-any-website)
- [Clonyfy — Clone Any Website Instantly with AI](https://www.clonyfy.com/)

**Design vocabulary (Awwwards/Dribbble):**
- [awwwards.com](https://www.awwwards.com) — Sites of the Day, GSAP/WebGL/scroll-trigger category filters
- [dribbble.com](https://dribbble.com) — current design shots across web/UI/motion categories

## Related
- [[Knowledge/Ideas Index]]
- [[Projects/Jarvis System]]
