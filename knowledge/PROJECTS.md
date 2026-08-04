# Projects

Format for each project below:

## Project Name
- Status: planning | active | paused | done
- Owner agent: business-analyst | coder | writer | planner | webdesigner | researcher | debugger | project-manager
- Goal: (name of a goal from knowledge/GOALS.md, optional)
- Notes: short context so any agent can pick this up cold

Tag related tasks in TASKS.md with #project-name to link them here.

---

## Jarvis System
- Status: active
- Owner agent: researcher
- Goal: Get Jarvis into daily use (tentative - "improve the system itself" doesn't cleanly fit any existing goal's wording; flagging rather than silently assuming. Fabio's call whether this needs its own goal.)
- Notes: The core assistant system itself (orb dashboard, subagents, hooks, knowledge system) as distinct from the products/monetization sub-tracks it's used to build (Jarvis-as-a-Service, Streamer HUD Widget). Full running log: vault/Projects/Jarvis System.md. Added to PROJECTS.md 2026-07-30 to track the "research how to improve Jarvis further" task under #jarvis-system - overlaps with but is broader than vault/Ideas/AI Practitioner Knowledge + Token-Reduction Loops.md (that one is scoped narrowly to token/context efficiency; this covers general improvements incl. new dashboards).

## Jarvis-as-a-Service Launch
- Status: shelved
- Owner agent: project-manager
- Goal: Monetize the Jarvis System
- Notes: Permanently shelved 2026-07-29 - Jarvis itself is not sold as a product/service; it's the internal tool used to research, ideate, and build other sellable products (see vault/Knowledge/Ideas Index.md). Not "paused pending pivot" - this is the pivot: Streamer HUD Widget (see below) is one resulting product, not a temporary substitute for this one. Pricing/demo-site research from this phase still stands as background reference; see vault/Projects/Jarvis-as-a-Service Pricing Research.md.

## Streamer HUD Widget
- Status: active
- Owner agent: webdesigner
- Goal: Monetize the Jarvis System
- Notes: Standalone widget, no Claude/Flask backend - just the audio-reactive sphere as a pure OBS Browser Source. De-scoped deliberately from the earlier personal-assistant pivot to avoid the multi-tenant/hosting problem. Full findings: vault/Projects/Streamer HUD Widget Market Research.md.

## Website Generator
- Status: active
- Owner agent: webdesigner
- Goal: Monetize the Jarvis System
- Notes: Generates real static HTML/CSS/JS landing sites from a prompt + reviews, not a templated system. Dual-purpose - Fabio's own future products, and website-generation as a service. MVP is generate-from-prompt only; clone-and-rebuild is scoped but deferred. Currently working through a flipbook-vs-live-Three.js open question for the hero animation layer, plus an ordered three-thread research plan (brand extraction -> conversion skeleton -> frame generation). Full detail: vault/Projects/Website Generator.md, background: vault/Ideas/Website Generator (Landing Pages + Clone-and-Rebuild).md. Added to PROJECTS.md 2026-08-04 - the project note existed already but was never registered here.

