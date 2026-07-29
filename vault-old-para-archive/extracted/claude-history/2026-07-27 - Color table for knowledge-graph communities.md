---
title: "Color table for knowledge-graph communities"
created: 2026-07-27T11:30:35.158728Z
uuid: 66da5447-b9db-410b-b645-7075f0425359
source: claude-export-extracted
raw_note: "[[2026-07-27 - Color table for knowledge-graph communities.md]]"
tags: [claude-history, extracted]
---

# Color table for knowledge-graph communities (extracted)

## Entities
- **Jarvis** — Fabio's personal AI system at `C:\Jarvis` (Flask backend, Obsidian vault, 8 subagents, hooks, knowledge graph).
- **graphify** — skill turning the Jarvis codebase/vault into a 3D knowledge graph (Obsidian plugin).
- **OmniRoute** — self-hosted multi-provider LLM gateway, installed via npm, secured to localhost-only.
- **OpenSpace (HKUDS)**, **hyperframes (HeyGen)**, **camofox-browser (jo-inc)**, **OpenMontage (calesthio)**, **claude-code-best-practice** — five tools installed/cloned this session.
- **claude-code-security-kit**, **gsd-build/get-shit-done**, **rtk-ai/rtk** — evaluated and rejected (fake CVEs, crypto rug-pull, Windows incompatibility).
- **CAPABILITIES.md** — new living catalog of external tools/repos for Jarvis.
- **Streamer HUD Widget**, **Jarvis-as-a-Service** — Fabio's two business projects tracked in the vault.

## Decisions
- Rejected using OmniRoute's `CLAUDE_USER_AGENT`/OAuth-passthrough feature (impersonates Claude Code to get "free" API access) — deemed ToS violation risking Fabio's Claude account.
- All installed tools get network bindings forced to `127.0.0.1` only (OmniRoute, camofox-browser) rather than `0.0.0.0`.
- Any secret pasted in chat (API keys, passwords) is treated as compromised and must be rotated, even for low-risk internal keys.
- Temporary/generated files (vault junctions, OmniRoute's DB, graphify intermediates) get added to `.gitignore` rather than tracked.
- FinceptTerminal removed entirely from CAPABILITIES.md (AGPL commercial-use risk); Docker rejected in favor of npm/npx installs to avoid extra system weight.

## Patterns
- Heavy verification discipline: user repeatedly asks Claude to double-check Jarvis's truncated-looking terminal/diff output via raw-byte/Get-Content -Raw checks before approving — most were chat-rendering artifacts, but a few were real bugs (encryption-key bug, escaped-quote doubling, gitlink issue), validating the caution.
- Before installing any third-party tool/repo, check trust signals (stars, commits, CVE claims) and read the actual install scripts/READMEs rather than trusting marketing.
- User frequently pastes secrets directly into chat despite repeated warnings — recurring risk pattern (see existing memory `secrets_in_chat_pattern`).
- Prefers concise, chunked responses over long fused paragraphs, especially for status/results.
- Consistently confirms via `git status`/`git log` and asks Jarvis to show diffs before committing risky changes.
