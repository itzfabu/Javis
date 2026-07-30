---
date: 2026-07-30
type: idea
tags:
  - idea
ai-first: true
status: captured
related-projects: ["[[Projects/Jarvis System]]", "[[Projects/Streamer HUD Widget]]"]
---

# Multi-Page Orb Dashboard

## For future Claude

Idea captured on 2026-07-30, as input for the "research how to improve the Jarvis system further"
task (TASKS.md, #jarvis-system). Saved specifically so this is ready to pick up first thing
tomorrow morning rather than needing to be re-explained. Two separate but related points from
Fabio, both about the orb dashboard (localhost:8420):

1. Split the single dashboard into multiple pages, website-style.
2. The existing NOTES panel (`orb/index.html` `#notesPanel`) should drop entries once they've been
   filed/actioned, not just accumulate forever.

## Status (updated 2026-07-30)

Split status, not all-or-nothing: point 1 (multi-page split) is now substantially built - the orb
dashboard (`orb/index.html`) has a nav shell with a 6-way switcher (main/background/finance/
websites/projects/system-health), each its own view container, and the Projects dashboard is fully
wired to real data (`knowledge/PROJECTS.md` + vault Project notes + `Boards/Engineering.md`) via a
new `/projects-dashboard.json` endpoint. Point 2 (notes panel dropping filed items) has not been
touched - still open, still describes current behavior accurately. `status: captured` above stays
as-is per [[Knowledge/Ideas Index]]'s defined lifecycle (captured/evaluating/building/shelved) -
this hasn't been promoted to its own Project note tracked on [[Boards/Engineering]], so "building"
doesn't fit either; the split is noted here in prose instead of inventing a new status value.

## The idea

**1. Multiple dashboard pages, like a website.** ✅ Done 2026-07-30 (nav shell + Projects page live;
Background/Finance/Websites/System Health still placeholders). Instead of one single orb view,
structure it as several pages/sections:
- Main - the current orb view (Jarvis + overall status at a glance)
- Jarvis/Claude info - system-level info about Jarvis and Claude itself (capabilities, usage,
  session/token state)
- Projects - status across active projects (Streamer HUD Widget, Jarvis System, etc.)
- Websites - overview of any websites/products shipped
- Finance - income overview once there's real income to show (see
  [[Ideas/Finance Dashboard for Project Income]], captured 2026-07-30 - that note covers this page
  in detail; treat it as the finance-page spec within this bigger structure, not a separate
  competing idea)

**2. Notes panel should cut filed items, not just accumulate.** Right now `sync-knowledge.ps1`
(lines 75-84) populates the NOTES panel by listing every `.md` file under
`Projects/Ideas/Architecture/Knowledge/Boards/Daily` - a raw, ever-growing directory listing with no
distinction between "new/unprocessed" and "already actioned." Fabio's instruction: once an idea or
note has been added/filed somewhere (e.g. an Idea graduates into an active project or task), it's
fine to cut it from that raw NOTES panel display rather than leaving it cluttering the list
indefinitely.

## Why it matters / context

This is direct input toward the #jarvis-system research task (dashboards are explicitly in scope
there). The multi-page idea turns the orb dashboard from a single status view into something closer
to a real personal ops console - separating "how is Jarvis itself doing" from "how are my projects/
products doing" from "what's my income." The notes-panel point is a smaller, standalone UX fix
uncovered while discussing the bigger idea - the current behavior (list every file, forever) doesn't
distinguish signal (a new idea worth looking at) from noise (an idea already acted on weeks ago).

## Next step if pursued

- Fold into the #jarvis-system research task as one concrete design question: what should each
  dashboard page contain, and what's the navigation model (tabs, sidebar, separate routes)?
- For the notes panel: define what "filed/actioned" means precisely (task created from it? linked
  from a project note? status changed away from "captured"?) before changing
  `sync-knowledge.ps1`/`orb/index.html` - needs a rule, not just ad hoc removal.

## Related
- [[Projects/Jarvis System]]
- [[Ideas/Finance Dashboard for Project Income]]
- [[Architecture/Jarvis System Architecture]]
