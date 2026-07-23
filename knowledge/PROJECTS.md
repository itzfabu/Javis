# Projects

Format for each project below:

## Project Name
- Status: planning | active | paused | done
- Owner agent: business-analyst | coder | writer | planner | webdesigner | researcher | debugger | project-manager
- Goal: (name of a goal from knowledge/GOALS.md, optional)
- Notes: short context so any agent can pick this up cold

Tag related tasks in TASKS.md with #project-name to link them here.

---

## Some Real Project
- Status: active
- Owner agent: planner
- Goal: Get Jarvis into daily use

## Jarvis-as-a-Service Launch
- Status: paused
- Owner agent: project-manager
- Goal: Monetize the Jarvis System
- Notes: Pivoted to the Streamer HUD Widget project (see below) - moved from "sell personal Jarvis builds" to a productized OBS widget. Pricing/demo-site research from this phase still stands as background; see vault/Projects/Jarvis-as-a-Service Pricing Research.md.

## Streamer HUD Widget
- Status: active
- Owner agent: business-analyst
- Goal: Monetize the Jarvis System
- Notes: Pivoted from "sell personal Jarvis builds" to "live, audio-reactive HUD widget for streamers" - packaging the orb dashboard as an OBS browser-source, not a personal assistant service. Differentiator vs. existing Etsy/Nerd or Die overlays: theirs are pre-rendered loops, ours actually reacts to real voice/data live. Core mechanic validated: a bare Three.js-sphere + Web Audio prototype (no Claude/Flask backend) was built and live-tested in Chrome - mic-reactive audio pipeline auto-starts with no code-side click gating, and the one unavoidable browser permission grant persists across reload with zero further clicks (confirmed empirically, not just assumed). Remaining open item: confirm the same persistence holds inside an actual OBS Browser Source restart, not just a browser tab. Full findings: vault/Projects/Streamer HUD Widget Market Research.md.

