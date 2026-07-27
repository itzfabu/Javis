---
tags: [idea]
captured: 2026-07-27
---
# Jarvis proaktiv statt reaktiv (Idee)

Ziel: Jarvis meldet sich von selbst zu bestimmten Anlaessen, statt nur 
auf Anfragen zu reagieren. Kein aktuelles Projekt - Idee fuer spaeter.

## Status quo
orb/app.py reagiert nur auf eingehende /chat-Anfragen. Es gibt keinen 
Mechanismus, der von sich aus etwas meldet oder zusammenfasst.

## Mögliche Ausloeser
- Taeglich (z.B. morgens): offene Tasks aus TASKS.md + Projekt-Status 
  aus knowledge/PROJECTS.md automatisch zusammenfassen, per TTS oder 
  im Dashboard anzeigen, ohne dass gefragt werden muss.
- Bei Aenderungen: watch-knowledge.ps1 laeuft schon als Datei-Watcher - 
  liesse sich erweitern, um bei bestimmten Aenderungen (z.B. neues 
  #jarvis-business Tag) direkt eine Meldung auszuloesen statt nur die 
  JSON zu resynchronisieren.
- Bei Inaktivitaet: ein Projekt/Task, das lange nicht angefasst wurde, 
  aktiv ansprechen statt stillschweigend liegen zu lassen.

## Offene Fragen
- Wo landet die proaktive Meldung - TTS, Dashboard-Popup, beides?
- Wie verhindern, dass es nervig/aufdringlich wird (Haeufigkeit, 
  Uhrzeit-Fenster)?

## Related
- [[Jarvis-README]] (dokumentiert bestehende Cron-Routinen wie Daily 
  News Brief und Weekly Vault Insights Review - teilweise schon 
  proaktiv, nur nicht per Chat/TTS zugestellt)
- [[Insights]] (das woechentliche Auto-Review ist selbst schon ein 
  bestehendes proaktives Artefakt, nur als Datei statt als Meldung)
