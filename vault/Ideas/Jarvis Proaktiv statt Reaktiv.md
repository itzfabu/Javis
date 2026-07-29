---
date: 2026-07-27
type: idea
tags:
  - idea
ai-first: true
status: captured
related-projects: []
---

# Jarvis proaktiv statt reaktiv

## For future Claude

Idea captured on 2026-07-27, imported from the prior vault's `Areas/Jarvis Proaktiv statt Reaktiv.md` on 2026-07-29. `status: captured` is inferred, not stated in the source - "Idee fuer spaeter, kein aktuelles Projekt" argues for captured over exploring, despite the note having more structure (status quo, 3 brainstormed triggers, 2 open questions) than a bare one-line capture.

## The idea

Ziel: Jarvis meldet sich von selbst zu bestimmten Anlaessen, statt nur auf Anfragen zu reagieren. Kein aktuelles Projekt - Idee fuer spaeter.

## Why it matters / context

### Status quo
orb/app.py reagiert nur auf eingehende /chat-Anfragen. Es gibt keinen Mechanismus, der von sich aus etwas meldet oder zusammenfasst.

### Moegliche Ausloeser
- Taeglich (z.B. morgens): offene Tasks aus TASKS.md + Projekt-Status aus knowledge/PROJECTS.md automatisch zusammenfassen, per TTS oder im Dashboard anzeigen, ohne dass gefragt werden muss.
- Bei Aenderungen: watch-knowledge.ps1 laeuft schon als Datei-Watcher - liesse sich erweitern, um bei bestimmten Aenderungen (z.B. neues #jarvis-business Tag) direkt eine Meldung auszuloesen statt nur die JSON zu resynchronisieren.
- Bei Inaktivitaet: ein Projekt/Task, das lange nicht angefasst wurde, aktiv ansprechen statt stillschweigend liegen zu lassen.

## Next step if pursued

Offene Fragen (aus der Quelle):
- Wo landet die proaktive Meldung - TTS, Dashboard-Popup, beides?
- Wie verhindern, dass es nervig/aufdringlich wird (Haeufigkeit, Uhrzeit-Fenster)?

## Related
- [[Architecture/Jarvis System Architecture]] (dokumentiert bestehende Cron-Routinen wie Daily News Brief und Weekly Vault Insights Review - teilweise schon proaktiv, nur nicht per Chat/TTS zugestellt)
- [[Knowledge/Insights]] (das woechentliche Auto-Review ist selbst schon ein bestehendes proaktives Artefakt, nur als Datei statt als Meldung)
