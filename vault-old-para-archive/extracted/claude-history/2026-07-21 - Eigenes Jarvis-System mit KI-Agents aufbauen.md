---
title: "Eigenes Jarvis-System mit KI-Agents aufbauen"
created: 2026-07-21T21:00:34.231295Z
uuid: 8fbc687c-3612-4190-a5fc-470a4a3d3a58
source: claude-export-extracted
raw_note: "[[2026-07-21 - Eigenes Jarvis-System mit KI-Agents aufbauen.md]]"
tags: [claude-history, extracted]
---

# Eigenes Jarvis-System mit KI-Agents aufbauen (extracted)

# Summary

## Entities
- **Fabio (itzfabu)** — building a personal AI assistant ("Jarvis") on Claude Code, Windows PC, C:\Jarvis; GitHub backup repo `itzfabu/Javis`.
- **Jarvis system** — Claude Code + CLAUDE.md memory, PowerShell hooks, voice (edge-tts, Ryan GB voice), web dashboard (`orb/index.html` + `app.py` Flask backend), 8 subagents + project-manager, Obsidian vault (PARA method), knowledge graph, Google Drive/GitHub/Playwright connectors, 4 cloud routines.
- **Streamer HUD Widget / Reactive HUD Pack** — pivoted business project: standalone OBS browser-source audio-reactive visual widget (15 styles), freemium license-key system, real Twitch EventSub integration.
- **graphify** — third-party pip/Claude Code skill that builds a persistent knowledge graph of the project; used to audit C:\Jarvis and caught a real tag/regex data bug.
- Tools/services touched: Obsidian, OBS Studio, edge-tts, Flask, Three.js, Twitch Dev Console, DaVinci Resolve (abandoned, free version lacks scripting API), FFmpeg (video-editor agent, parked).

## Decisions
- Personal-assistant-as-a-service business idea abandoned twice (Fiverr/Upwork commoditized; AI co-host market already dominated by Neuro-sama/Streamlabs/Questie) in favor of a **standalone audio-reactive OBS widget pack**, sold freemium (2 free styles, rest Pro via license key).
- Outlook integration paused indefinitely — personal Microsoft accounts kept failing OAuth across two different connector implementations; deemed not worth further effort.
- DaVinci Resolve video editing dropped (free version has no scripting API); FFmpeg-based `video-editor` subagent built instead but not yet used.
- All local setup/config commands must run in a plain PowerShell window, never pasted into a Claude Code/Jarvis session (recurring confusion throughout).
- Google Drive granted full read/write; Outlook kept read-only-except-calendar via a `guard-connectors.ps1` hook.

## Patterns
- Constant confusion between "run in your own PowerShell" vs. "type into the Jarvis session" — recurs dozens of times; user needs very explicit, separated instructions each time.
- Strong preference for testing/verifying claims empirically (real OBS, real Twitch account, real restore-from-clone) rather than trusting assumptions — user and assistant repeatedly insist on "prove it" over "should work."
- Frequent scope creep/pivoting on the business idea; assistant repeatedly grounds enthusiasm in real market research before building.
- User often pastes ambiguous/incomplete fragments requiring clarifying questions before assistant can act.
- Heavy reliance on PowerShell heredocs (`Set-Content -Encoding UTF8`) after early encoding-corruption bugs with `Get-Content -Raw` round-trips.
