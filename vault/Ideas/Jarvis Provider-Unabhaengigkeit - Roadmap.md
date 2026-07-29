---
date: 2026-07-27
type: idea
tags:
  - idea
ai-first: true
status: captured
related-projects: []
---

# Jarvis Provider-Unabhaengigkeit - Roadmap

## For future Claude

Idea captured on 2026-07-27, imported from the prior vault's `Areas/Jarvis Provider-Unabhaengigkeit - Roadmap.md` on 2026-07-29. `status: captured` is inferred, not stated in the source. It's more ambiguous than most captures: the source explicitly says "kein aktuelles Projekt... nicht jetzt, nur als Notiz fuer spaeter" for phases 2-7, but Phase 1 of the 7-phase roadmap is marked ERLEDIGT (done) and is real shipped code (the OpenAI fallback in `orb/app.py`) - so part of this idea has actually been executed. Treat `captured` as a judgment call, not a stated fact.

## The idea

Ziel: Jarvis schrittweise von der Claude-Code-CLI loesen, langfristig komplett anbieter-unabhaengig (auch von Anthropic), ohne dass bestehende Funktionalitaet dabei kaputt geht. Kein aktuelles Projekt - Ideen-Sammlung fuer spaeter, wenn eine der Luecken konkret wird.

## Why it matters / context

### Status quo
app.py ruft aktuell per subprocess die interaktive Claude-Code-CLI auf ("claude -p ..."). Subagents (.claude/agents/*.md) und Hooks (.claude/hooks/*.ps1) sind Claude-Code-spezifische Konzepte.

### Phasen
1. Provider-Fallback (ERLEDIGT) - OpenAI-Fallback in app.py bei Claude-Limit, siehe orb/app.py call_openai_fallback().
2. Abstraktionsschicht - eine gemeinsame call_llm(provider, message, tools=None) Funktion statt fest an "claude -p" gekoppelt.
3. Eigener Tool-Loop - Datei lesen/schreiben, Bash-Ausfuehrung, Web-Suche selbst als Funktionen definieren statt Claude Codes eingebaute Tools zu nutzen.
4. Subagents ohne Claude Code - eigene Routing-Logik statt .claude/agents/*.md, jeder Subagent = eigener System-Prompt + Tool-Auswahl.
5. Hooks ohne Claude Code - fetch-context/sync-knowledge etc. direkt an den richtigen Stellen im eigenen app.py-Code aufrufen statt ueber Claude Codes Hook-Trigger-System.
6. Lokale Modelle als Option - Ollama/llama.cpp als zusaetzliches Backend fuer Offline-Faehigkeit (Qualitaetsabstrich gegenueber Claude/GPT).
7. Eigene Coding-Faehigkeit - Datei-Editier-/Bash-Tools selbst nachbauen (read_file, write_file, edit_file diff-basiert, run_bash, search_files). Aufwendigster Teil.

### Einordnung
Mehrmonatiges Projekt, kein Wochenend-Umbau. Jede Phase funktioniert einzeln, Jarvis bleibt waehrend der Umstellung nutzbar. Naechster sinnvoller Schritt waere Phase 2, direkt auf dem bestehenden OpenAI-Fallback aufbauend - aber nicht jetzt, nur als Notiz fuer spaeter.

### Externes Tool: OmniRoute (2026-07-28)
OmniRoute (`C:\Jarvis\omniroute`) installiert und abgesichert (localhost-only, zufaellig generierte Secrets) - ein lokaler Unified-LLM-Router (160+ Provider), kein Ersatz fuer die eigene Abstraktionsschicht aus Phase 2, aber eine externe Alternative dafuer, falls Phase 2 nie umgesetzt wird. Noch kein Provider verbunden (Anthropic-API-Key kostet extra, zurueckgestellt). Bewusst NICHT ueber den mitgelieferten OAuth-Cloaking-Mechanismus verbunden, der Claude Codes eigene Session missbraucht haette. Details: [[Knowledge/CAPABILITIES]].

## Next step if pursued
Phase 2 (Abstraktionsschicht), direkt auf dem bestehenden OpenAI-Fallback aufbauend - aber laut Quelle explizit nicht jetzt, nur als Notiz fuer spaeter.

## Related
- [[Architecture/Jarvis System Architecture]]
- [[Knowledge/Streamer HUD Widget Market Research]]
- [[Knowledge/CAPABILITIES]]
