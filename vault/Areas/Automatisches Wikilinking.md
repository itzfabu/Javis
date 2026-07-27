---
tags: [idea]
captured: 2026-07-27
---
# Automatisches Wikilinking zwischen Notizen (Idee)

Ziel: neue Notizen bekommen automatisch Vorschlaege fuer [[Wikilinks]] 
zu inhaltlich verwandten bestehenden Notizen, statt dass das von Hand 
passieren muss (wie z.B. bei CAPABILITIES.md und der Provider-
Unabhaengigkeits-Roadmap gerade eben gemacht).

## Status quo
Verlinkung zwischen Notizen ist aktuell komplett manuell - ein Subagent 
oder ich muss die relevanten Notizen selbst lesen und echte 
Ueberschneidungen von Hand identifizieren. Teilweise existiert das 
Konzept aber schon: die woechentliche Weekly Vault Insights Review 
(siehe [[Insights]]) schlaegt bereits fehlende Wikilinks zwischen 
bestehenden Notizen vor - allerdings nur wochenweise rueckblickend, 
nicht beim Anlegen einer neuen Notiz selbst.

## Ansatz
- Ein Subagent-Task, der beim Anlegen/Bearbeiten einer Notiz automatisch 
  eine kurze Suche ueber bestehende Vault-Notizen macht (Stichworte aus 
  der neuen Notiz gegen Titel/Inhalt bestehender Notizen).
- Nur echte Ueberschneidungen vorschlagen (wie im CLAUDE.md-Regelwerk 
  gefordert: "keine erzwungenen Links nur um Links zu haben"), keine 
  automatische Verlinkung ohne Pruefung - Vorschlag statt automatischer 
  Ausfuehrung, damit ich am Ende entscheide.
- Koennte sich an claude-obsidian (siehe CAPABILITIES.md) orientieren, 
  das genau dieses Problem bereits loest (Quellen automatisch verlinken 
  und einsortieren).

## Offene Fragen
- Lohnt sich ein eigener Subagent dafuer, oder reicht eine Erweiterung 
  des bestehenden project-manager/researcher-Workflows?
- Wie verhindern, dass zu viele/irrelevante Vorschlaege kommen?
- Reicht es, die bestehende Weekly Insights Review haeufiger laufen zu 
  lassen, statt einen eigenen Mechanismus zu bauen?

## Related
- [[CAPABILITIES]] (claude-obsidian als moeglicher Ansatz-Referenz)
- [[Insights]] (macht bereits woechentlich einen Teil davon)
- [[Jarvis-README]] (dokumentiert die Weekly Vault Insights Review Routine)
