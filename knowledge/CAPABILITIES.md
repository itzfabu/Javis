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

## Referenz-Architekturen (aehnliche Projekte, kein Fertigprodukt)
- Ramsbaby/jarvis - Sehr aehnliches Konzept zu unserem System: claude -p 
  headless als 24/7-Ops-Plattform, Discord als mobile UI, 4-Schichten-
  Self-Healing, Obsidian-Memory-Integration, 98% Kontext-Kompression. 
  ACHTUNG: nur macOS/Linux nativ (launchd/pm2), kein natives Windows - 
  fuer uns nur als Architektur-Referenz nutzbar, nicht direkt installierbar. 
  Relevant fuer [[Jarvis Proaktiv statt Reaktiv]] (Self-Healing-Ansatz) 
  und [[Jarvis Provider-Unabhaengigkeit - Roadmap]] (claude -p headless 
  Pattern, das wir selbst schon nutzen).

## Memory/Proaktivitaet
- claude-mem (thedotmack, 35.9k Sterne) - erfasst automatisch alles was 
  Claude tut, komprimiert per KI, spielt relevanten Kontext in 
  zukuenftige Sessions zurueck. Direkt relevant fuer 
  [[Jarvis Proaktiv statt Reaktiv]].
- knowledge-graph (hilyfux) - Git-natives Memory-Layer fuer Claude Code, 
  ~3ms/Event, privacy-first. Referenz-Kandidat fuer unser bestehendes 
  Knowledge-System, aehnlich wie claude-obsidian.

## Sicherheit - WICHTIG, sollte geprueft werden
- claude-code-security-hooks (slavaspitsyn) - 7 Verteidigungsschichten 
  gegen Prompt-Injection, blockiert automatisch Exfiltrations-Versuche 
  von SSH-Keys/Cloud-Credentials/.env ueber Bash- und Read-Tool-Zugriffe. 
  47 Tests.
- claude-code-security-kit (kagioneko) - UserPromptSubmit-Hook, der vor 
  jedem Prompt auf gefaehrliche Settings, Credential-Leaks und MCP-
  Risiken prueft. Fuegt automatisch .env, *.pem, *.key zur globalen 
  .gitignore hinzu.
  GEPRUEFT UND ABGELEHNT (2026-07-28): Repo hat nur 1 Stern, 0 Forks, 
  3 Commits, keine Contributors. README zitiert "CVE-2025-59536" und 
  "CVE-2026-21852" als angeblich gepatchte Luecken - beide Nummern 
  wirken erfunden (zukunftsdatiert, nicht verifizierbar), klassisches 
  Muster um ein unaudited Tool legitim wirken zu lassen. install.sh 
  patcht global ~/.claude/settings.json (neuer UserPromptSubmit-Hook, 
  system-weit) und globalen git core.excludesfile direkt per Skript. 
  Nicht installiert. Nicht erneut vorschlagen ohne neue, vertrauenswuerdigere 
  Quelle fuer dieselbe Funktionalitaet.
- agento-patronum - schuetzt sensible Dateien/Credentials/Shell-Befehle 
  ueber Hooks als eigene Enforcement-Schicht (nicht nur settings.json 
  deny-Regeln). Defaults fuer .env, SSH-Keys, AWS/kubeconfig.
  BEGRUENDUNG FUER PRUEFUNG: Claude Code laedt .env-Dateien laut 
  mehreren Quellen automatisch, auch wenn in Settings blockiert - genau 
  die Kategorie Vorfall, die uns heute Abend mit dem OpenAI-Key passiert 
  ist (Key wurde im Chat-Klartext geteilt). Diese Hooks haetten das 
  zwar nicht verhindert (das war user-seitiges Teilen, kein Claude-Code-
  Zugriff), aber sie adressieren das verwandte Risiko dass Claude Code 
  selbst orb/.env unbeabsichtigt ausliest/verbreitet.

## Token-Kosten-Tracking (Windows-taugliche Alternative zu rtk)
- ccusage (11.5k Sterne) - analysiert Claude-Code-Nutzung aus lokalen 
  JSONL-Dateien (Tages-/Monats-/Session-/Billing-Fenster-Reports), 
  offline, keine API-Calls. Reine Datei-Auswertung statt Bash-Hook-
  Rewriting wie rtk - sollte nativ unter Windows funktionieren.
- cc-cost (lob-labs) - Single-File Python-CLI, parst Claude-Code-
  Transcript-JSONL, zeigt Kosten/Cache-Hit-Rate/teuerste Turns. MIT, 
  keine Drittanbieter-Abhaengigkeiten.
- getburnd (garvitsurana271) - liest ~/.claude/projects/*.jsonl, 
  identifiziert 8 Verschwendungsmuster (z.B. verbose Context, Tool-
  Loops), zeigt Einsparpotenzial. MIT, keine Telemetrie.

## Skill-Evolution / Referenzlisten
- awesome-claude-code (hesreallyhim) - Die etablierte kuratierte 
  Referenzliste fuer Claude-Code-Skills/Hooks/Agents/Plugins, 40k+ 
  Sterne. Erster Anlaufpunkt vor Eigenbau.
- HKUDS/OpenSpace - Self-Evolving Skill Engine der University of Hong 
  Kong Data Science Lab. Agents lernen aus echten Task-Ausfuehrungen, 
  reparieren/verbessern/leiten Skills automatisch ab, teilbar ueber 
  Cloud-Community (open-space.cloud). Seriöser Absender, gut 
  dokumentiert, noch nicht installiert.

## SICHERHEITSWARNUNG - NIEMALS INSTALLIEREN
- gsd-build/get-shit-done (Original-Repo) - NICHT INSTALLIEREN, auch 
  nicht zum Ausprobieren. Der urspruengliche Ersteller (TÂCHES/Lex 
  Christopherson) hat im Mai 2026 einen an das Projekt gekoppelten 
  $GSD-Krypto-Token per Rug-Pull leergeraeumt, alle Social-Media-Konten 
  geloescht und ist verschwunden (dokumentierter Exit-Scam, mehrfach 
  von Sicherheitsmedien bestaetigt). Die urspruenglichen npm-Pakete 
  (get-shit-done-cc, get-shit-done) sind weiterhin live und stellen ein 
  Supply-Chain-Risiko dar (Namespace-Uebernahme durch Dritte moeglich).
  Falls die GSD-Funktionalitaet (Context-Engineering/Spec-Driven-
  Workflow) je gebraucht wird: NUR ueber den auditierten Community-Fork 
  open-gsd/get-shit-done-redux (bit-genaue Spiegelung des Codes von vor 
  dem Rug Pull, keine Token-Referenzen) oder Ableitungen davon wie 
  buildomator/buildomator.
