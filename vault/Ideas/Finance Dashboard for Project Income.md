---
date: 2026-07-30
type: idea
tags:
  - idea
ai-first: true
status: captured
related-projects: ["[[Projects/Jarvis System]]", "[[Projects/Streamer HUD Widget]]"]
---

# Finance Dashboard for Project Income

## For future Claude

Idea captured on 2026-07-30, alongside the "research how to improve the Jarvis system" task
(TASKS.md, #jarvis-system). Explicitly conditional - not worth building until there's actual
income to track. Pull this when Streamer HUD Widget (or any other product Jarvis helps build)
starts generating real income, or when scoping the #jarvis-system research task.

## The idea

Add a finance dashboard to the orb dashboard (localhost:8420) alongside the existing knowledge-graph
view - an overview of income coming out of projects built with Jarvis (e.g. Streamer HUD Widget
sales), once there's actual income to show. Not a general budgeting tool - scoped specifically to
tracking revenue from products/research Jarvis helps produce, matching the "Monetize the Jarvis
System" goal framing (income comes from products Jarvis builds, not from Jarvis itself).

## Why it matters / context

Currently there's no income yet, so this has no data to run on - premature to build. But it's a
natural companion once the goal "Monetize the Jarvis System" (knowledge/GOALS.md) starts producing
actual revenue: without an overview, income tracking would otherwise live scattered across sales
channel dashboards (Gumroad/Etsy/itch.io - see TASKS.md #streamer-hud sales-channel decision) with
no single view in the system Fabio actually looks at daily.

## Next step if pursued

- Trigger: first real sale/income event from any Jarvis-built product (Streamer HUD Widget or
  otherwise).
- Then: decide data source per sales channel (manual entry vs. API pull, e.g. Gumroad API), and
  design the dashboard panel/view to add to orb/index.html.

## Related
- [[Projects/Jarvis System]]
- [[Projects/Streamer HUD Widget]]
