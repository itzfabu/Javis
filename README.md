# Jarvis — System Documentation

Personal AI assistant built on Claude Code. Lives at `C:\Jarvis`, backed up to `github.com/itzfabu/Javis`.

## Quick start

Double-click `start-everything.bat` (or it runs automatically at login). This opens:
- A minimized knowledge watcher
- A minimized Flask server (the orb/chat backend)
- Your browser at `http://localhost:8420`

Everything happens through that browser tab — type or use the mic button. You don't need a terminal for daily use.

For direct terminal access instead: run `start-jarvis.bat`.

## Folder structure

```
C:\Jarvis
├── CLAUDE.md - Core instructions: personality, rules, memory system, startup routine
├── TASKS.md - Task list: "- [ ] text | priority: x | due: date | #project-tag"
├── knowledge
│ └── PROJECTS.md - Project tracker (name, status, owner agent)
├── vault\ - Obsidian vault (the "second brain")
│ ├── Projects\ - PARA: things with a goal + end date
│ ├── Areas\ - PARA: ongoing responsibilities
│ ├── Resources\ - PARA: reference material
│ │ └── Insights.md - Weekly auto-generated insight review
│ ├── Archive\ - PARA: inactive items
│ ├── Templates\ - Note templates (enabled in Obsidian's core Templates plugin)
│ └── Decisions-Log.md - Log of notable decisions and why they were made
├── orb\ - The web dashboard
│ ├── index.html - The whole UI: sphere, globe, knowledge graph, chat, tasks
│ ├── app.py - Flask backend, handles /chat, runs claude -p
│ ├── status.json, history.json, knowledge.json, latest.mp3 - generated, not edited by hand
├── .claude
│ ├── agents\ - 8 subagents (see below)
│ ├── hooks\ - Automation scripts (see below)
│ └── settings.json - Hook registrations
├── start-everything.bat - Combined launcher (auto-starts at login)
├── start-jarvis.bat - Terminal-only launcher (manual)
└── .gitignore - Excludes generated files, secrets, node_modules
```

## Subagents (`.claude/agents/`)

| Agent | Role |
|---|---|
| researcher | Web research, fact-checking, source comparison |
| coder | Writes/refactors code, senior-engineer standards |
| debugger | Systematic bug diagnosis, hypothesis-driven |
| business-analyst | Market/financial analysis, chances vs. risks |
| writer | Professional text editing/formulation |
| planner | Prioritization, scheduling, Chief-of-Staff style |
| webdesigner | UI/web design and implementation |
| project-manager | Coordinates the other 7, checks knowledge/PROJECTS.md first |

All 8 check `knowledge/PROJECTS.md` for context and can save findings into the vault.

## Hooks (`.claude/hooks/`)

| File | Fires on | What it does |
|---|---|---|
| set-thinking.ps1 | UserPromptSubmit | Sets orb status to "thinking" |
| speak-response.ps1 | Stop | Generates voice (edge-tts), updates status.json/history.json. Skips itself for the web-chat session (app.py handles that separately) |
| fetch-context.ps1 | SessionStart | Fetches weather/time/tasks *before* Claude starts, so the greeting doesn't need a live web search |
| git-backup.ps1 | SessionEnd | Commits + pushes to GitHub, then re-runs sync-knowledge.ps1 |
| sync-knowledge.ps1 | (called by others) | Parses PROJECTS.md, TASKS.md, and vault notes into orb/knowledge.json for the graph |
| watch-knowledge.ps1 | (runs continuously) | File-watches knowledge/TASKS.md/vault and re-syncs instantly on any change |
| guard-connectors.ps1 | PreToolUse | Blocks Outlook write actions (send/delete/edit) except calendar event creation |

## The orb dashboard (`orb/index.html`)

- **Center**: particle sphere (Three.js) — teal idle, amber thinking, brighter+rippling while speaking, reacts to real audio amplitude
- **Top-left**: KNOWLEDGE graph (zoomable/pannable, force-directed) — agents, projects, tasks, vault notes as connected nodes; ACTIVITY log below it
- **Top-center**: live clock/date
- **Top-right**: open tasks
- **Bottom-left**: last response text
- **Bottom-right**: rotating wireframe Earth (WORLD)
- **Bottom-center**: chat bar + mic button — talks to Claude via `app.py`'s `/chat` endpoint, which runs `claude -p` in its own dedicated session (separate from your terminal session, so they don't cross-contaminate)

## Connectors & tools

| Tool | Status | Notes |
|---|---|---|
| Google Drive | Connected, read/write | Via claude.ai account connector |
| Outlook | Paused | Personal-account OAuth kept failing across multiple tools; parked for now |
| GitHub | Connected | Via `gh` CLI, not an MCP server |
| Playwright | Connected | Browser automation MCP |
| document-skills | Installed | PDF/Excel/Word/PowerPoint (official Anthropic plugin) |
| obsidian-skills | Installed | Teaches proper wikilink/note format |

## Cloud routines (`/schedule` in a terminal session, or claude.ai/code/routines)

| Name | Frequency | Output |
|---|---|---|
| Daily News Brief | Daily 7am | DAILY-BRIEF.md |
| Monthly CLAUDE.md / TASKS.md Staleness Review | Monthly, 1st | REVIEW-NOTES.md |
| Weekly Vault Insights Review | Weekly, Monday | vault/Resources/Insights.md (prepended) |

Note: all cron schedules are fixed UTC — times drift by ~1 hour between summer/winter. Not adjusted, since it doesn't matter for these tasks.

## Security

- The web chat (`app.py`) requires a secret token (`X-Jarvis-Token` header) and rejects requests with a foreign Origin — prevents other websites/tabs from silently triggering actions
- Flask binds to `127.0.0.1` only — not reachable from the network
- `guard-connectors.ps1` technically blocks Outlook writes regardless of what's asked, not just by instruction
- Generated/sensitive files (tokens, session flags, mp3s, status files) are gitignored

## Common gotchas (things that have actually broken before)

- **PowerShell `Get-Content -Raw | ... | Set-Content` round-trips can corrupt umlauts/encoding** on PS 5.1. Prefer having Claude Code edit files directly with its own Edit tool for anything with special characters.
- **JSON paths need forward slashes or double-escaped backslashes** — `C:/Jarvis/...` is safer than `C:\\Jarvis\\...` in settings.json.
- **Starting two `python app.py` instances** silently both bind to port 8420 on Windows without erroring — `app.py` now refuses to start if the port's already in use, but check for stray `python.exe` processes if the orb ever behaves strangely.
- **Any command meant for your own PowerShell window must be run there directly** — pasting local setup commands into a running Claude Code session (terminal or web) doesn't work the same way and can trigger the auto-mode permission classifier.
- **The web chat and terminal sessions are intentionally separate** (different Claude session IDs) so they don't cross-contaminate context or double-fire hooks.

## If everything breaks

1. Everything is backed up to `github.com/itzfabu/Javis` — worst case, `git clone` fresh and reconnect the pieces
2. Check `.claude/settings.json` is valid JSON and all 5 hooks are present
3. Check `orb/app.py` and `watch-knowledge.ps1` aren't both already running before starting fresh copies
