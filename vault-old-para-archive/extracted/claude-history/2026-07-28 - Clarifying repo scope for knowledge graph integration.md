---
title: "Clarifying repo scope for knowledge graph integration"
created: 2026-07-28T21:31:35.965448Z
uuid: 69b40228-ed4f-40f4-af8a-49afe237ea3c
source: claude-export-extracted
raw_note: "[[2026-07-28 - Clarifying repo scope for knowledge graph integration.md]]"
tags: [claude-history, extracted]
---

# Clarifying repo scope for knowledge graph integration (extracted)

## Entities
- **orb/app.py** — Flask backend at localhost:8420; shells out to `claude -p --resume <session>` per chat message, rotates session every 20 turns to cap token cost.
- **graphify** — knowledge graph tool; already run over C:\Jarvis (61 files/194 nodes).
- **itzfabu/javis** — only GitHub repo confirmed tracked (this C:\Jarvis repo).
- **breferrari/obsidian-mind**, **eugeniughelbur/obsidian-second-brain**, **kepano/obsidian-skills** — candidate Obsidian AI-vault systems.
- **HananoshikaYomaru/obsidian-3d-graph** — 3D graph plugin candidate.

## Decisions
- Chose **obsidian-mind** as vault backbone over obsidian-second-brain, since its "procedural code owns environment, agent owns content" philosophy matches the orb architecture's token-cost-control goal; cherry-pick `/obsidian-architect` and `/research-deep` from second-brain instead of full install. `kepano/obsidian-skills` comes bundled free.
- Chose **HananoshikaYomaru/obsidian-3d-graph** for 3D graph (actively maintained, installable without BRAT).
- Claude.ai data export (Settings → Privacy → Export data, 24h download link) should land in an immutable `raw/` folder, then get parsed into entity/decision/pattern notes rather than dumped as raw JSON — avoids bloating token cost.

## Patterns
- Fabio scopes multi-part decisions via explicit menus before delegating work.
- Recurring priority: minimize token/context cost in any Jarvis-related integration (delegation to subagents, session rotation, avoiding raw-dump ingestion).
