# Monthly Staleness Review — 2026-08-01

Automated review of CLAUDE.md and TASKS.md for outdated or stale content. No edits were made to either file — findings only.

Note: this repo's history only goes back to 2026-07-28 (4 days as of this review), so "stale" here means inconsistent with current state, not literally old.

## CLAUDE.md

- **"Laufende Projekte" section is an unfilled placeholder** (still reads `(wird laufend ergänzt, sobald Projekte anfallen)`, unchanged since the file's initial commit on 2026-07-28). `knowledge/PROJECTS.md` now lists three real projects (Jarvis System, Jarvis-as-a-Service Launch, Streamer HUD Widget). Suggestion: either populate this section with the current active projects (or a pointer to `knowledge/PROJECTS.md`), or remove the placeholder text if `knowledge/PROJECTS.md` is meant to be the single source of truth for project tracking.

No other stale content found in CLAUDE.md — the rest (rules, personality, startup routine, language preference) shows no sign of being outdated and isn't contradicted by anything elsewhere in the repo.

## TASKS.md

- **"start here tomorrow morning" note is now time-stale** (line under the `#jarvis-system` research task, added 2026-07-29). "Tomorrow" meant 2026-07-30; today is 2026-08-01, so the note has been pointing at a date that's already passed for two days while the task is still unstarted. Suggestion: either do the task and check it off, or reword the note to drop the relative "tomorrow" phrasing (e.g. just "start here:") so it doesn't keep implying urgency tied to a date that's gone.

- **Minor structural note (not urgent):** the seven cancelled `#jarvis-as-a-service` items are filed under `## Done`, but the section's own instructions say "(move completed tasks here instead of deleting them)" — these were cancelled, not completed. They're clearly marked with ❌ and a `cancelled:` date, so this reads fine in practice, but worth confirming the "Done" section is meant to double as a "Done + Cancelled" archive, or whether cancelled items deserve their own subsection.

Everything else in TASKS.md (the four `#streamer-hud` active tasks, the low-priority Claude Flowstate note task) is recent (added 2026-07-28/30) and shows no sign of neglect yet.
