---
date: 2026-07-27
type: idea
tags:
  - idea
ai-first: true
status: captured
related-projects: []
---

# Automatisches Wikilinking zwischen Notizen

## For future Claude

Idea captured on 2026-07-27, imported from the prior vault's `Areas/Automatisches Wikilinking.md` on 2026-07-29. `status: captured` is inferred, not stated in the source - a proposed approach with open questions, no evidence any of it was built or started.

## The idea

Ziel: neue Notizen bekommen automatisch Vorschlaege fuer [[Wikilinks]] zu inhaltlich verwandten bestehenden Notizen, statt dass das von Hand passieren muss (wie z.B. bei CAPABILITIES.md und der Provider-Unabhaengigkeits-Roadmap gerade eben gemacht).

## Why it matters / context

### Status quo
Verlinkung zwischen Notizen ist aktuell komplett manuell - ein Subagent oder ich muss die relevanten Notizen selbst lesen und echte Ueberschneidungen von Hand identifizieren. Teilweise existiert das Konzept aber schon: die woechentliche Weekly Vault Insights Review (siehe [[Knowledge/Insights]]) schlaegt bereits fehlende Wikilinks zwischen bestehenden Notizen vor - allerdings nur wochenweise rueckblickend, nicht beim Anlegen einer neuen Notiz selbst.

### Ansatz
- Ein Subagent-Task, der beim Anlegen/Bearbeiten einer Notiz automatisch eine kurze Suche ueber bestehende Vault-Notizen macht (Stichworte aus der neuen Notiz gegen Titel/Inhalt bestehender Notizen).
- Nur echte Ueberschneidungen vorschlagen (wie im CLAUDE.md-Regelwerk gefordert: "keine erzwungenen Links nur um Links zu haben"), keine automatische Verlinkung ohne Pruefung - Vorschlag statt automatischer Ausfuehrung, damit ich am Ende entscheide.
- Koennte sich an claude-obsidian (siehe [[Knowledge/CAPABILITIES]]) orientieren, das genau dieses Problem bereits loest (Quellen automatisch verlinken und einsortieren).

## Next step if pursued

Offene Fragen (aus der Quelle):
- Lohnt sich ein eigener Subagent dafuer, oder reicht eine Erweiterung des bestehenden project-manager/researcher-Workflows?
- Wie verhindern, dass zu viele/irrelevante Vorschlaege kommen?
- Reicht es, die bestehende Weekly Insights Review haeufiger laufen zu lassen, statt einen eigenen Mechanismus zu bauen?

## Related
- [[Knowledge/CAPABILITIES]] (claude-obsidian als moeglicher Ansatz-Referenz)
- [[Knowledge/Insights]] (macht bereits woechentlich einen Teil davon)
- [[Architecture/Jarvis System Architecture]] (dokumentiert die Weekly Vault Insights Review Routine)
