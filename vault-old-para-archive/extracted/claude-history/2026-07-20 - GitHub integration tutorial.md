---
title: "GitHub integration tutorial"
created: 2026-07-20T18:37:04.993170Z
uuid: b5b52cc8-b484-499c-bfdd-573d1b855b28
source: claude-export-extracted
raw_note: "[[2026-07-20 - GitHub integration tutorial.md]]"
tags: [claude-history, extracted]
---

# GitHub integration tutorial (extracted)

## Entities
- Claude.ai GitHub integration — connects repos to Claude for codebase context, available on all plans (Free included), currently in beta.
- Claude Desktop app — user's platform; distinct from web app and from third-party MCP server configs.
- Connectors Directory (Settings → Connectors) — separate from the dedicated "Add from GitHub" entry point in chat/project knowledge.

## Decisions
- No fix was confirmed working; conversation ended mid-troubleshooting with the user on Claude Desktop and GitHub still not appearing in their connectors list.

## Patterns
- User gives very terse, fragmentary replies ("it doesnt show github", "dont find it", "desktop") rather than full descriptions, requiring the assistant to repeatedly ask clarifying questions to narrow down platform/account/location before troubleshooting.
- Assistant relied on fetching official Anthropic docs/support articles rather than answering from memory for a product-support question.
