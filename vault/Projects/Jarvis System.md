---
date: 2026-07-29
updated: 2026-08-05
type: project
status: active
tags:
  - project
related-people: []
related-projects: ["[[Projects/Streamer HUD Widget]]"]
job:
repo: 'C:\Jarvis'
ai-first: true
---

# Jarvis System

## For future Claude

Jarvis System is Fabio's personal AI assistant project, built on Claude Code, as of 2026-07-28 (source note's last update). Imported from the prior vault's `Areas/Jarvis - Gesamtstatus.md` on 2026-07-29.

`status: active` above is **inferred, not stated directly in the source**. The source note carries no status keyword at all - only `tags: [status]` and `updated: 2026-07-28`. "Active" was derived from: an 11-item "Noch offen" (still open) list at the end of the source, "grossteils fertig, nicht final" (largely done, not final) language on the Streamer HUD sub-thread, and the absence of any archive/completion marker anywhere in the note. Treat it as a reasonable read of the evidence, not a fact the source asserted.

The Overview/Recent Activity/Open Items sections below preserve the source's own dated, running-log structure rather than being reshaped into a different template, since that structure is how the source tracks state.

## Overview

Personal AI assistant system (`C:\Jarvis`), covering the core Claude Code-based assistant (orb dashboard, subagents, hooks, knowledge system) plus two monetization sub-tracks: [[Projects/Jarvis-as-a-Service Launch]] and [[Projects/Streamer HUD Widget]]. See [[Architecture/Jarvis System Architecture]] for the full system architecture doc, including the GitHub backup remote.

## Recent Activity

### Improvement research: dashboards + architecture (2026-08-05, overnight)

Overnight research task (TASKS.md, `#jarvis-system`) to evaluate the two staged ideas
([[Ideas/Multi-Page Orb Dashboard]], [[Ideas/Finance Dashboard for Project Income]]) plus anything
else genuinely warranted, grounded in a direct read of `orb/app.py` (941 lines, all routes checked)
and `orb/index.html` (nav shell + view containers checked), not just the vault notes describing them.

**Goal-link flag restated, not resolved:** this project's link to a goal in `knowledge/GOALS.md`
remains tentative - "Get Jarvis into daily use", explicitly marked "(tentative...)" in
`knowledge/PROJECTS.md`. Nothing below resolves this; flagging again per this project's own pattern
of surfacing goal-fit questions rather than assuming. Where a recommendation below leans on a goal
for its reasoning, the specific goal it leans on is named explicitly.

**1. Multi-Page Orb Dashboard ([[Ideas/Multi-Page Orb Dashboard]]) - status update, one new sub-finding.**
Point 1 (multi-page split) is further along than the idea note's last update suggested: verified in
code that `main`, `background`, and `projects` views are fully wired to real data
(`/background-dashboard.json`, `/projects-dashboard.json`), and `websites` is *also* now fully wired
- a real generation form (`#generateWebsiteForm`) posting to `/generate-website` plus a live grid
reading `/generated-sites.json` (`orb/index.html` lines ~207-258). Only two of the six pages remain
literal placeholders in the markup: `view-finance` and `view-system-health` both render just
`<div class="dash-placeholder">... COMING SOON</div>` (lines 206 and 263). Point 2 (notes panel
should drop filed/actioned items) is untouched - confirmed by reading
`.claude/hooks/sync-knowledge.ps1` lines 75-84: it still does an unconditional directory listing of
every `.md` under `Projects/Ideas/Architecture/Knowledge/Boards/Daily`, with no filter for
already-actioned items, exactly as the idea note describes.
- **Notes panel cleanup: signed off by Fabio and implemented (2026-08-05, evening).** Rule adopted
  as proposed: Ideas notes only show in the NOTES panel while `status: captured`
  (`evaluating`/`building`/`shelved` have been looked at, drop them); Projects/Architecture/
  Knowledge/Boards/Daily notes drop once referenced via `related-projects`/wikilink from an *active*
  Project note. Implemented in `.claude/hooks/sync-knowledge.ps1` (front-matter status parser +
  active-project wikilink scan feeding a "filed titles" set). Verified against the actual vault:
  count went from 20 notes to 11 - correctly dropped 2 non-`captured` ideas (`AI Practitioner
  Knowledge + Token-Reduction Loops` at `evaluating`, `Website Generator (Landing Pages +
  Clone-and-Rebuild)` at `evaluating`) plus 7 filed notes referenced from active projects
  ([[Knowledge/Ideas Index]], [[Knowledge/CAPABILITIES]], `Jarvis System Architecture`,
  `Streamer HUD Widget Market Research`, and the [[Projects/Streamer HUD Widget]],
  [[Projects/Jarvis-as-a-Service Launch]], and this note's own project entries, each cross-linked
  from another active project). No false drops found on inspection.
- **Recommendation - System Health page: build next, ahead of Finance.** Not one of the two staged
  ideas, but a direct consequence of reading this project's own "Noch offen" list below: several
  things are marked "not live tested" (OpenAI fallback, Twitch reconnect) or carry caveats like
  "fix only takes effect after an `orb/app.py` restart, no auto-reload" (session rotation). A System
  Health page has zero external dependency (unlike Finance, which is blocked on an actual sale) and
  directly serves "Get Jarvis into daily use" by making the system's own reliability visible instead
  of relying on prose caveats in a vault note. Scope minimally to start: last-run timestamp/success
  state for the 7 hooks, the daily-brief and weekly-insights cloud routines, and current session
  rotation state (`orb/session_state.json` turn count) - resist scope creep into a heavier monitoring
  system until this minimal version proves useful.

**2. Finance Dashboard for Project Income ([[Ideas/Finance Dashboard for Project Income]]) - precondition checked, still not met.**
The idea note's own trigger is explicit: "first real sale/income event from any Jarvis-built
product." Checked `TASKS.md` `#streamer-hud` items directly (the only product close to sellable):
all four remaining items are still open and unchecked - package for end customers, customer-facing
setup instructions, delivery/sales channel decision (Gumroad/Etsy/itch.io/own site), and licensing
terms. No sales channel has been chosen yet, and no income event appears anywhere in
`knowledge/PROJECTS.md`, `TASKS.md`, or this project's own log. Website Generator is further from a
sale still - `generated-sites.json` currently reflects draft/demo sites, not paid deliveries.
- **Recommendation: defer, unchanged from the idea note's own assessment.** Nothing found tonight
  changes the "no data to run on yet" conclusion. Revisit when the trigger actually fires (first
  sale/income event) - at that point the idea note's own next steps (data source per channel, manual
  vs. API pull) are still the right starting questions.

**3. Other architecture observations (read-only, no code touched per task scope) - none rise to a
new recommendation, noted for completeness:**
- The accountability/sign-off layer (`orb/accountability.json`, `/accountability/respond`) is
  reasonably well-built as implemented - queue, signoff states, and briefing block all present and
  match what CLAUDE.md documents. `CLAUDE.md` already flags "no mid-work interrupts yet" as a known,
  deliberate limitation with a stated trigger for revisiting it ("only if overnight work is later
  observed drifting on large jobs") - no new evidence found tonight that it's actually biting, so not
  elevating this to a recommendation, just noting the existing flag still stands.
- Session rotation fix (`ROTATE_AFTER_TURNS = 20` in `orb/app.py`) carries a documented caveat above
  ("only takes effect after a restart, no auto-reload") - whether `orb/app.py` has actually been
  restarted since that fix landed isn't verifiable from a static code read. Open question, not a
  finding - worth a quick manual check (is `orb/session_state.json`'s turn counter behaving as
  expected) next time the dashboard is used, rather than something to fix blind.

## Open Items (Noch offen)

- Package for end customers (clean file + setup guide, no dev/diag mode visible) - laut TASKS.md noch offen, trotz vorhandenem StreamerHUD-v1.zip
- Write customer-facing setup instructions (OBS flag + one-time mic click) - laut TASKS.md noch offen, trotz vorhandenem Setup-Guide.md
- Twitch-WebSocket-Reconnect (verifiziert: kein onclose/onerror-Handler im Code - kein automatisches Reconnect bei Verbindungsabbruch)
- Sensitivity-Slider fuers Streamer HUD (verifiziert: kein Sensitivity/Threshold-Code vorhanden, Reaktivitaets-Schwelle fix)
- Performance-/CPU-Last-Test nie gemacht
- Cross-Platform-Test (nur auf einem PC getestet, kein Mac/anderes Windows)
- Demo-Video, Landing-Page, Sales-Channel-Entscheidung fuer Streamer HUD (TASKS.md: Sales-Channel-Entscheidung offen)
- Lizenzbedingungen-Dokument fuer Endkunden (TASKS.md: offen)
- OpenAI-Fallback: noch nicht live durchgespielt
- #jarvis-business vs #jarvis-as-a-service Tag-Mismatch: KEIN ECHTER MISMATCH - "#jarvis-business" kommt im System nirgends als tatsaechlich genutzter Tag vor, nur als hypothetisches Beispiel in [[Ideas/Jarvis Proaktiv statt Reaktiv]]. TASKS.md nutzt durchgaengig #jarvis-as-a-service. Erledigt/geklaert, keine offene Frage mehr.
- [[Ideas/Jarvis Provider-Unabhaengigkeit - Roadmap]]: Idee, Phase 1 (OpenAI-Fallback) erledigt, Phasen 2-7 nicht begonnen
- [[Ideas/Jarvis Proaktiv statt Reaktiv]]: Idee, nicht begonnen
- [[Ideas/Automatisches Wikilinking]]: Idee, nicht begonnen
- Mobile-Zugriff: nicht begonnen
- Sprachsteuerung/Wake-Word: nicht begonnen
- ~~NOTES panel doesn't drop filed/actioned items~~ - fixed 2026-08-05 (see Recent Activity above), rule implemented in `sync-knowledge.ps1`.
- Finance dashboard page still a placeholder - correctly deferred, no income event yet (see 2026-08-05 research above).
- System Health dashboard page still a placeholder - proposed as the next build target, ahead of Finance (see 2026-08-05 research above).

## Related
- [[Architecture/Jarvis System Architecture]]
- [[Projects/Streamer HUD Widget]]
- [[Projects/Jarvis-as-a-Service Launch]]
- [[Knowledge/CAPABILITIES]]
- [[Ideas/Jarvis Provider-Unabhaengigkeit - Roadmap]]
- [[Ideas/Multi-Page Orb Dashboard]]
- [[Ideas/Finance Dashboard for Project Income]]
