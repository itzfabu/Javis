# Externe Faehigkeiten-Kataloge (nicht integriert, nur Referenz)

Diese Tools wurden geprueft, aber bewusst noch nicht eingebaut. Bevor ein 
Subagent (oder du) fuer ein neues Projekt eine Faehigkeit von Grund auf 
baut, hier zuerst nachschauen ob es passt. Gilt fuer alle moeglichen 
Business-Richtungen, nicht nur fuer ein bestimmtes Projekt.

## Wissensmanagement
- claude-obsidian (AgriciDaniel) - Automatisches Einsortieren/Verlinken 
  von Quellen in einen Obsidian-Vault, 15 Skills, Hybrid-Retrieval 
  (contextual prefix + BM25 + Cosine-Rerank). Referenz fuer Verbesserungen 
  am eigenen Knowledge-System (sync-knowledge.ps1/PARA), siehe [[Jarvis-README]].

## Web/Recherche
- camofox-browser (jo-inc) - Stealth-Headless-Browser fuer AI-Agents, 
  umgeht Bot-Erkennung/Cloudflare. Koennte jedem Subagent robustes 
  Web-Browsing geben. Vorbehalt: bewusst einsetzen, ToS-Frage je nach 
  Zielseite. Relevant fuer [[Jarvis-as-a-Service Pricing Research]] 
  (Fiverr blockte WebFetch/403) und [[Streamer HUD Widget Market Research]] 
  (naechster Schritt dort: manuelles Durchsehen von 15-20 Live-Listings).

## Content-Erstellung
- hyperframes (heygen-com) - HTML/CSS zu MP4-Video, agent-gesteuert 
  (npx hyperframes render). Fuer Produkt-Demos, Social-Clips, 
  Praesentationsvideos - generisch einsetzbar, nicht projektspezifisch.

## Finance/Trading (falls diese Richtung mal relevant wird)
- Vibe-Trading (HKUDS) - Multi-Agent-Finance-Workspace, 22 MCP-Tools, 
  Backtesting, Broker-Anbindung. Liesse sich als MCP-Server einbinden, 
  aehnlich wie Google Drive/Canva/Higgsfield.

## Marketing (falls ein Business bezahlte Werbung schaltet)
- claude-ads (AgriciDaniel) - Paid-Media-Audit-Skill, 12 Plattformen 
  (Google, Meta, TikTok etc.).

## Bewusst nicht empfohlen
- Open-Generative-AI (Anil-matcha) - Bild/Video-Generator, explizit 
  "no content filters" beworben. Nicht integrieren.

Diese Liste bei Bedarf erweitern, wenn neue Tools geprueft werden - Ziel 
ist ein wachsendes Nachschlagewerk, keine Verpflichtung, irgendwas davon 
tatsaechlich einzubauen.
