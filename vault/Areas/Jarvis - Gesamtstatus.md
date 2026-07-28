---
tags: [status]
updated: 2026-07-28
---
# Jarvis - Gesamtstatus (Idee: bei Bedarf aktualisieren)

## OmniRoute + Tool-Installationen (2026-07-28)
- OmniRoute (lokaler LLM-Unified-Router, `C:\Jarvis\omniroute`) installiert 
  per npm/npx, abgesichert: nur `127.0.0.1`-Bindung, Secrets zufaellig 
  generiert (nie im Klartext gezeigt), Passwort-Reset ueber echtes Terminal 
  statt Pipe. Bewusst OHNE OAuth-Cloaking-Mechanismus verbunden (der haette 
  Claude Codes eigene Anthropic-Session missbraucht, ToS-Risiko) - noch kein 
  Provider aktiv, Anthropic-Anbindung wegen separater API-Kosten vorerst 
  zurueckgestellt. Siehe [[Jarvis Provider-Unabhaengigkeit - Roadmap]].
- 5 Tools/Repos geprueft und installiert (Details: [[CAPABILITIES]]): 
  HKUDS/OpenSpace (als MCP-Server registriert), hyperframes (HTML-zu-Video, 
  automatisch installierte globale Skills inkl. eines Critical-Risk-Skills 
  wieder entfernt), camofox-browser (Stealth-Browser, Bindung ebenfalls auf 
  localhost korrigiert), OpenMontage (Setup manuell nachgebildet, `make` 
  fehlte), claude-code-best-practice (reine Referenz).
- Git-Repo-Hygiene: OpenSpace war versehentlich als eingebettetes Repo 
  committet (Gitlink), OmniRoutes Laufzeit-DB/Logs wurden versehentlich 
  mitversioniert - beides korrigiert, `.gitignore` entsprechend erweitert.

## Session-Rotation gegen Token-Wachstum (2026-07-28)
- Problem: `orb/app.py` hat `localhost:8420` (Webchat) immer per `--resume` 
  auf dieselbe, nie rotierende `WEBCHAT_SESSION_ID` laufen lassen - jede 
  Nachricht musste das komplette, seit Tagen wachsende Transkript neu laden. 
  Das war der konkrete Grund fuer "zu viele Tokens".
- Fix: `session_state.json` (Session-ID + Turn-Zaehler) ersetzt die 
  statische ID. Nach `ROTATE_AFTER_TURNS` (aktuell 20) startet automatisch 
  eine frische Session ohne `--resume`.
- Warum das nichts verliert: CLAUDE.md, knowledge/PROJECTS.md/GOALS.md/
  TASKS.md, der Vault und die Auto-Memory-Dateien werden bei jedem 
  Subprocess-Aufruf ohnehin frisch neu gelesen, unabhaengig von der 
  Session-ID. Nur das rohe Chat-Transkript wird gekappt - das "Second Brain" 
  traegt die Kontinuitaet, nicht der teure Rohverlauf.
- Achtung: Fix greift erst nach Neustart von `orb/app.py` (kein Auto-Reload).
- Idee dahinter direkt aus [[CAPABILITIES]] uebernommen (claude-mem: 
  komprimiert/spielt relevanten Kontext zurueck statt Rohverlauf; 
  knowledge-graph: Git-natives Memory statt Transkript-Replay) - beide 
  Repos selbst nicht installiert, nur das Funktionsprinzip nachgebaut.

## Kern-System - fertig
- orb/app.py: Flask-Backend, Chat-Endpoint, Claude-CLI-Shellout, TTS 
  (edge-tts), Task-Integration, OpenAI-Fallback
- orb/index.html: Orb-Dashboard, Partikel-Sphere, Knowledge-Graph-
  Visualisierung, audio-reaktiv
- 8 Subagents (.claude/agents/*.md), alle mit Knowledge/Vault-Awareness 
  nachgeruestet (verifiziert: alle 8 referenzieren PROJECTS.md/vault)
- Knowledge-System: knowledge/PROJECTS.md, GOALS.md, TASKS.md + 
  sync-knowledge.ps1
- Hooks (alle 7 verifiziert vorhanden): sync-knowledge, watch-knowledge, 
  fetch-context, git-backup, guard-connectors, set-thinking, 
  speak-response
- Obsidian-Vault mit PARA-Struktur eingerichtet
- 3D-Wissensgraph vollstaendig konfiguriert (23 Gruppen/Farben im 
  3D-Graph-Plugin, verifiziert - ueber Junctions/Hardlinks erweitert)
- CAPABILITIES.md - Faehigkeiten-Katalog externer Tools
- ChatGPT/OpenAI-Fallback bei Claude-Nutzungslimit in app.py (committed, 
  Syntax geprueft, ABER NOCH NICHT LIVE GETESTET)
- Daily News Brief (Cloud-Routine, DAILY-BRIEF.md wird real erzeugt)
- Weekly Vault Insights Review (Cloud-Routine, vault/Resources/Insights.md 
  real vorhanden, schlaegt bereits Wikilinks vor)

## Streamer HUD Widget (Produktlinie) - grossteils fertig, nicht final
- 14 visuelle Styles verifiziert im Code (nicht 5): 2 kostenlos 
  (Sphere, Waveform), 12 Pro (Orbit Rings, Hologram Grid, Radar Sweep, 
  Data Stream, Radar+Sphere Combo, Mirrored Waveform, VU Ring, Arc 
  Gauge, Heartbeat Monitor, Lightning, Particle Burst, Firework, 
  Twitch Events)
- Farb-/Theme-Anpassung: erledigt (TASKS.md: "Add color/theme 
  customization options to the streamer HUD widget" abgehakt)
- Twitch-Integration: OAuth + EventSub-WebSocket-Code vorhanden 
  (follow/subscribe/raid-Events, Client-ID-Eingabe im UI) - Code 
  bestaetigt, "real getestet" bzw. Bug-Anzahl aus den Dateien nicht 
  verifizierbar
- Freemium-Lizenzschluessel-System: Generator 
  (License-Key-Generator-SELLER-ONLY.html) + Validator 
  (isValidLicenseKey im Widget-Code) beide vorhanden - Bugfix-Historie 
  nicht aus den Dateien verifizierbar
- Distribution: StreamerHUD-v1.zip, Setup-Guide.md und 
  Start-Widget-Server.bat existieren bereits im Code - aber laut 
  TASKS.md noch NICHT final abgeschlossen (siehe Noch offen)
- OBS-Integration: laut Vorgabe real getestet mit 3 behobenen Bugs - 
  aus den Dateien allein nicht verifizierbar (kein Changelog), aber 
  plausibel angesichts des Reifegrads des Codes

## Noch offen
- Package for end customers (clean file + setup guide, no dev/diag 
  mode visible) - laut TASKS.md noch offen, trotz vorhandenem 
  StreamerHUD-v1.zip
- Write customer-facing setup instructions (OBS flag + one-time mic 
  click) - laut TASKS.md noch offen, trotz vorhandenem Setup-Guide.md
- Twitch-WebSocket-Reconnect (verifiziert: kein onclose/onerror-Handler 
  im Code - kein automatisches Reconnect bei Verbindungsabbruch)
- Sensitivity-Slider fuers Streamer HUD (verifiziert: kein 
  Sensitivity/Threshold-Code vorhanden, Reaktivitaets-Schwelle fix)
- Performance-/CPU-Last-Test nie gemacht
- Cross-Platform-Test (nur auf einem PC getestet, kein Mac/anderes 
  Windows)
- Demo-Video, Landing-Page, Sales-Channel-Entscheidung fuer Streamer 
  HUD (TASKS.md: Sales-Channel-Entscheidung offen)
- Lizenzbedingungen-Dokument fuer Endkunden (TASKS.md: offen)
- OpenAI-Fallback: noch nicht live durchgespielt
- #jarvis-business vs #jarvis-as-a-service Tag-Mismatch: KEIN ECHTER 
  MISMATCH - "#jarvis-business" kommt im System nirgends als 
  tatsaechlich genutzter Tag vor, nur als hypothetisches Beispiel in 
  [[Jarvis Proaktiv statt Reaktiv]]. TASKS.md nutzt durchgaengig 
  #jarvis-as-a-service. Erledigt/geklaert, keine offene Frage mehr.
- [[Jarvis Provider-Unabhaengigkeit - Roadmap]]: Idee, Phase 1 
  (OpenAI-Fallback) erledigt, Phasen 2-7 nicht begonnen
- [[Jarvis Proaktiv statt Reaktiv]]: Idee, nicht begonnen
- [[Automatisches Wikilinking]]: Idee, nicht begonnen
- Mobile-Zugriff: nicht begonnen
- Sprachsteuerung/Wake-Word: nicht begonnen

## Related
- [[Jarvis-README]]
- [[Streamer HUD Widget]]
- [[Streamer HUD Widget Market Research]]
- [[CAPABILITIES]]
- [[Jarvis Provider-Unabhaengigkeit - Roadmap]]
