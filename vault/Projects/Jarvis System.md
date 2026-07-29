---
date: 2026-07-29
updated: 2026-07-28
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

### OmniRoute + Tool-Installationen (2026-07-28)
- OmniRoute (lokaler LLM-Unified-Router, `C:\Jarvis\omniroute`) installiert per npm/npx, abgesichert: nur `127.0.0.1`-Bindung, Secrets zufaellig generiert (nie im Klartext gezeigt), Passwort-Reset ueber echtes Terminal statt Pipe. Bewusst OHNE OAuth-Cloaking-Mechanismus verbunden (der haette Claude Codes eigene Anthropic-Session missbraucht, ToS-Risiko) - noch kein Provider aktiv, Anthropic-Anbindung wegen separater API-Kosten vorerst zurueckgestellt. Siehe [[Ideas/Jarvis Provider-Unabhaengigkeit - Roadmap]].
- 5 Tools/Repos geprueft und installiert (Details: [[Knowledge/CAPABILITIES]]): HKUDS/OpenSpace (als MCP-Server registriert), hyperframes (HTML-zu-Video, automatisch installierte globale Skills inkl. eines Critical-Risk-Skills wieder entfernt), camofox-browser (Stealth-Browser, Bindung ebenfalls auf localhost korrigiert), OpenMontage (Setup manuell nachgebildet, `make` fehlte), claude-code-best-practice (reine Referenz).
- Git-Repo-Hygiene: OpenSpace war versehentlich als eingebettetes Repo committet (Gitlink), OmniRoutes Laufzeit-DB/Logs wurden versehentlich mitversioniert - beides korrigiert, `.gitignore` entsprechend erweitert.

### Session-Rotation gegen Token-Wachstum (2026-07-28)
- Problem: `orb/app.py` hat `localhost:8420` (Webchat) immer per `--resume` auf dieselbe, nie rotierende `WEBCHAT_SESSION_ID` laufen lassen - jede Nachricht musste das komplette, seit Tagen wachsende Transkript neu laden. Das war der konkrete Grund fuer "zu viele Tokens".
- Fix: `session_state.json` (Session-ID + Turn-Zaehler) ersetzt die statische ID. Nach `ROTATE_AFTER_TURNS` (aktuell 20) startet automatisch eine frische Session ohne `--resume`.
- Warum das nichts verliert: CLAUDE.md, knowledge/PROJECTS.md/GOALS.md/TASKS.md, der Vault und die Auto-Memory-Dateien werden bei jedem Subprocess-Aufruf ohnehin frisch neu gelesen, unabhaengig von der Session-ID. Nur das rohe Chat-Transkript wird gekappt - das "Second Brain" traegt die Kontinuitaet, nicht der teure Rohverlauf.
- Achtung: Fix greift erst nach Neustart von `orb/app.py` (kein Auto-Reload).
- Idee dahinter direkt aus [[Knowledge/CAPABILITIES]] uebernommen (claude-mem: komprimiert/spielt relevanten Kontext zurueck statt Rohverlauf; knowledge-graph: Git-natives Memory statt Transkript-Replay) - beide Repos selbst nicht installiert, nur das Funktionsprinzip nachgebaut.

### Kern-System - fertig
- orb/app.py: Flask-Backend, Chat-Endpoint, Claude-CLI-Shellout, TTS (edge-tts), Task-Integration, OpenAI-Fallback
- orb/index.html: Orb-Dashboard, Partikel-Sphere, Knowledge-Graph-Visualisierung, audio-reaktiv
- 8 Subagents (.claude/agents/*.md), alle mit Knowledge/Vault-Awareness nachgeruestet (verifiziert: alle 8 referenzieren PROJECTS.md/vault)
- Knowledge-System: knowledge/PROJECTS.md, GOALS.md, TASKS.md + sync-knowledge.ps1
- Hooks (alle 7 verifiziert vorhanden): sync-knowledge, watch-knowledge, fetch-context, git-backup, guard-connectors, set-thinking, speak-response
- Obsidian-Vault mit PARA-Struktur eingerichtet (Anmerkung: diese Zeile beschreibt den alten Vault, nicht diesen)
- 3D-Wissensgraph vollstaendig konfiguriert (23 Gruppen/Farben im 3D-Graph-Plugin, verifiziert - ueber Junctions/Hardlinks erweitert) - **Bestaetigt beim Import (2026-07-29):** `.obsidian/plugins/new-3d-graph/data.json` im alten Vault enthaelt tatsaechlich genau 23 Gruppen-Eintraege (Pfad-Query + Hex-Farbe je Eintrag, z.B. Jarvis-README.md, CLAUDE.md, .claude/hooks/*, Projects/*). Das aehnlich benannte, ebenfalls aktivierte Plugin `3d-graph-new` (andere Plugin-ID, andere Codebasis) hat dagegen eine leere `groups: []` - dort existiert keine Farbkonfiguration. Beide Plugins sind laut `community-plugins.json` gleichzeitig aktiviert, was nach ungenutzter Redundanz aussieht, nicht nach Absicht.
- CAPABILITIES.md - Faehigkeiten-Katalog externer Tools
- ChatGPT/OpenAI-Fallback bei Claude-Nutzungslimit in app.py (committed, Syntax geprueft, ABER NOCH NICHT LIVE GETESTET)
- Daily News Brief (Cloud-Routine, DAILY-BRIEF.md wird real erzeugt)
- Weekly Vault Insights Review (Cloud-Routine, vault/Resources/Insights.md real vorhanden, schlaegt bereits Wikilinks vor)

### Streamer HUD Widget (Produktlinie) - grossteils fertig, nicht final
- 14 visuelle Styles verifiziert im Code (nicht 5): 2 kostenlos (Sphere, Waveform), 12 Pro (Orbit Rings, Hologram Grid, Radar Sweep, Data Stream, Radar+Sphere Combo, Mirrored Waveform, VU Ring, Arc Gauge, Heartbeat Monitor, Lightning, Particle Burst, Firework, Twitch Events)
- Farb-/Theme-Anpassung: erledigt (TASKS.md: "Add color/theme customization options to the streamer HUD widget" abgehakt)
- Twitch-Integration: OAuth + EventSub-WebSocket-Code vorhanden (follow/subscribe/raid-Events, Client-ID-Eingabe im UI) - Code bestaetigt, "real getestet" bzw. Bug-Anzahl aus den Dateien nicht verifizierbar
- Freemium-Lizenzschluessel-System: Generator (License-Key-Generator-SELLER-ONLY.html) + Validator (isValidLicenseKey im Widget-Code) beide vorhanden - Bugfix-Historie nicht aus den Dateien verifizierbar
- Distribution: StreamerHUD-v1.zip, Setup-Guide.md und Start-Widget-Server.bat existieren bereits im Code - aber laut TASKS.md noch NICHT final abgeschlossen (siehe Noch offen)
- OBS-Integration: laut Vorgabe real getestet mit 3 behobenen Bugs - aus den Dateien allein nicht verifizierbar (kein Changelog), aber plausibel angesichts des Reifegrads des Codes

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

## Related
- [[Architecture/Jarvis System Architecture]]
- [[Projects/Streamer HUD Widget]]
- [[Projects/Jarvis-as-a-Service Launch]]
- [[Knowledge/CAPABILITIES]]
- [[Ideas/Jarvis Provider-Unabhaengigkeit - Roadmap]]
