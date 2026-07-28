# Graph Report - C:/Jarvis  (2026-07-28)

## Corpus Check
- 22 files · ~27,829 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 194 nodes · 244 edges · 35 communities (16 shown, 19 thin omitted)
- Extraction: 86% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.86)
- Token cost: 178,758 input · 0 output

## Community Hubs (Navigation)
- Subagent Roster & Automation Hooks
- CLAUDE.md Rules & Connector Docs
- CAPABILITIES.md Tool Catalog
- Subagent Definitions (8 Roles)
- License Key Generator & Setup Guide
- Jarvis-as-a-Service Launch & Pricing
- Orb Flask Backend (app.py)
- Streamer HUD Market Research
- Daily News Brief
- Jarvis-as-a-Service Demo/Dashboard Plan
- Sphere Style Initialization
- Knowledge Graph Sync Functions
- Animation Loop / Polling
- Knowledge Graph Render Loop
- HUD Visual Themes
- Twitch Chat Burst Effects
- Audio Band Level Extraction
- Mic Audio Init
- Assistant Persona Rules
- Task Format Convention
- Globe Initialization
- History Polling
- HUD Size Config
- Decisions Log (Empty)
- Etsy Marketplace Comparable
- Nerd or Die Comparable
- OWN3D Comparable
- Twitch Extensions Comparable
- Vault README
- Area Note Template
- Idea Note Template
- Project Note Template
- Resource Note Template
- Vault Welcome Page

## God Nodes (most connected - your core abstractions)
1. `Jarvis System Documentation (README)` - 26 edges
2. `Jarvis - Gesamtstatus` - 22 edges
3. `External Capabilities Catalog` - 19 edges
4. `CAPABILITIES (vault pointer note)` - 13 edges
5. `Project Manager Agent` - 10 edges
6. `Jarvis Provider-Unabhaengigkeit - Roadmap (Idee)` - 9 edges
7. `Jarvis-as-a-Service Pricing Research` - 8 edges
8. `Jarvis proaktiv statt reaktiv (Idee)` - 8 edges
9. `Streamer HUD Widget` - 8 edges
10. `Obsidian Vault Memory System` - 7 edges

## Surprising Connections (you probably didn't know these)
- `OmniRoute (local unified LLM router)` --semantically_similar_to--> `call_openai_fallback()`  [INFERRED] [semantically similar]
  vault/Areas/Jarvis - Gesamtstatus.md → orb/app.py
- `Automatisches Wikilinking (Idee)` --semantically_similar_to--> `knowledge-graph (hilyfux)`  [INFERRED] [semantically similar]
  vault/Areas/Automatisches Wikilinking.md → knowledge/CAPABILITIES.md
- `call_llm(provider, message, tools) planned abstraction (Phase 2)` --conceptually_related_to--> `call_openai_fallback()`  [INFERRED]
  vault/Areas/Jarvis Provider-Unabhaengigkeit - Roadmap.md → orb/app.py
- `Jarvis Provider-Unabhaengigkeit - Roadmap (Idee)` --references--> `call_openai_fallback()`  [EXTRACTED]
  vault/Areas/Jarvis Provider-Unabhaengigkeit - Roadmap.md → orb/app.py
- `License-Key-Generator-SELLER-ONLY.html` --shares_data_with--> `isValidLicenseKey() (product)`  [INFERRED]
  vault/Projects/Streamer HUD Widget.md → orb/product/StreamerHUD/reactive-hud-pack.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Jarvis Future Ideas Backlog (Noch Offen)** — vault_areas_jarvis_gesamtstatus, vault_areas_automatisches_wikilinking, vault_areas_jarvis_proaktiv_statt_reaktiv, vault_areas_jarvis_provider_unabhaengigkeit_roadmap [EXTRACTED 1.00]
- **PARA Method Template System** — vault_readme, vault_templates_area_note, vault_templates_idea_note, vault_templates_project_note, vault_templates_resource_note [INFERRED 0.85]
- **Security Hooks/Tools Review Cluster** — knowledge_capabilities_claude_code_security_hooks, knowledge_capabilities_claude_code_security_kit, knowledge_capabilities_agento_patronum [EXTRACTED 1.00]
- **Jarvis Multi-Agent Delegation Roster** — claude_agents_business_analyst_business_analyst, claude_agents_coder_coder, claude_agents_debugger_debugger, claude_agents_planner_planner, claude_agents_project_manager_project_manager, claude_agents_researcher_researcher, claude_agents_webdesigner_webdesigner, claude_agents_writer_writer [EXTRACTED 1.00]
- **SHUD License Key Checksum Protocol** — orb_license_key_generator_seller_only_checksum, orb_product_streamerhud_reactive_hud_pack_isvalidlicensekey, orb_product_stage_reactive_hud_pack_isvalidlicensekey [INFERRED 0.95]
- **Shared Particle-Sphere Visualization Pattern** — orb_index_initcore, orb_prototypes_streamer_hud_prototype_initcore, orb_product_streamerhud_reactive_hud_pack_sphere_style, orb_product_stage_reactive_hud_pack_sphere_style [INFERRED 0.85]
- **'AI Doesn't Buy a Price Premium' Cross-Track Finding** — vault_projects_jarvis_as_a_service_pricing_research_jarvis_as_a_service_pricing_research, vault_projects_streamer_hud_widget_market_research_streamer_hud_widget_market_research, vault_resources_insights_ai_reactive_no_premium [INFERRED 0.85]
- **Personal-Machine Hardcoding Blocker Across Products** — vault_projects_jarvis_as_a_service_launch_orb_dashboard, vault_projects_streamer_hud_widget_market_research_app_py, vault_projects_streamer_hud_widget_market_research_index_html, vault_resources_insights_personal_machine_hardcoding_blocker [INFERRED 0.85]

## Communities (35 total, 19 thin omitted)

### Community 0 - "Subagent Roster & Automation Hooks"
Cohesion: 0.11
Nodes (17): 8 Subagents (.claude/agents/*.md), claude-mem (thedotmack), claude-obsidian (AgriciDaniel), knowledge-graph (hilyfux), Ramsbaby/jarvis reference architecture, PROJECTS.md (project tracker, referenced), OmniRoute (local unified LLM router), call_openai_fallback() (+9 more)

### Community 1 - "CLAUDE.md Rules & Connector Docs"
Cohesion: 0.11
Nodes (22): Feste Regeln (Fixed Safety Rules), Startup Routine (Greeting + Weather/Tasks Summary), sendMessage() - POST /chat, GitHub Connector (gh CLI), Google Drive Connector, Outlook Connector (Paused), Playwright Connector, Jarvis System Documentation (README) (+14 more)

### Community 2 - "CAPABILITIES.md Tool Catalog"
Cohesion: 0.13
Nodes (21): External Capabilities Catalog, agento-patronum - hook-based credential protection layer, awesome-claude-code (hesreallyhim), camofox-browser (jo-inc), cc-cost (lob-labs), ccusage, claude-ads (AgriciDaniel), claude-code-security-hooks (slavaspitsyn) (+13 more)

### Community 3 - "Subagent Definitions (8 Roles)"
Cohesion: 0.25
Nodes (15): Business Analyst Agent, Coder Agent, Debugger Agent, Planner Agent, Project Manager Agent, Researcher Agent, Webdesigner Agent, Writer Agent (+7 more)

### Community 4 - "License Key Generator & Setup Guide"
Cohesion: 0.15
Nodes (17): checksum() function, generate() function, isValidLicenseKey() (_stage), Streamer HUD Setup Guide (_stage), License-Key-Generator-SELLER-ONLY.html, reactive-hud-pack.html (standalone product file, 14 styles), isValidLicenseKey() (product), Streamer HUD Setup Guide (product) (+9 more)

### Community 5 - "Jarvis-as-a-Service Launch & Pricing"
Cohesion: 0.17
Nodes (16): business-analyst agent (pricing/positioning contributor), Jarvis-as-a-Service Launch, Jarvis Personal AI Assistant System, Monetize the Jarvis System (goal), project-manager agent (owner), Demo-Driven Lead Magnet Positioning, Fiverr Marketplace ('Claude Code setup' gigs), Jarvis-as-a-Service Pricing Research (+8 more)

### Community 6 - "Orb Flask Backend (app.py)"
Cohesion: 0.24
Nodes (9): before_request, background_backup(), chat(), check_origin(), get_open_tasks(), index(), run_claude(), write_status() (+1 more)

### Community 7 - "Streamer HUD Market Research"
Cohesion: 0.20
Nodes (10): Jarvis Real Differentiators (knowledge graph, multi-agent delegation, dashboard), 'Click once, ever' revised target, getUserMedia() mic permission gating, Kudos.tv AI TTS Stream Companion, OBS Browser Source Persistence (open question), Orb Dashboard particle-sphere core (C:\Jarvis\orb), Particle-Sphere State Machine (idle/thinking/speaking), Mic Permission Persistence Across Reload (empirically confirmed) (+2 more)

### Community 8 - "Daily News Brief"
Cohesion: 0.40
Nodes (6): Daily Brief 2026-07-28, Monsunfluten Assam (Indien), Ölpreise brechen nach Iran-Waffenruhe ein, Russlands Notenbank senkt Wachstumsprognose, Waffenruhe USA-Iran wackelt, Waldbrände Spanien/Frankreich

### Community 9 - "Jarvis-as-a-Service Demo/Dashboard Plan"
Cohesion: 0.33
Nodes (6): Static Demo Site Plan (v1), Orb Dashboard (C:\Jarvis\orb), webdesigner agent (demo site contributor), app.py (Flask backend shelling out to Claude Code CLI), index.html (shipped widget UI with plaintext token), Personal-Machine Hardcoding as Recurring Blocker

### Community 10 - "Sphere Style Initialization"
Cohesion: 0.50
Nodes (4): initCore() - Jarvis Orb Particle Sphere, Sphere Style Renderer (_stage), Sphere Style Renderer (product), initCore() (early prototype)

### Community 12 - "Animation Loop / Polling"
Cohesion: 0.67
Nodes (3): animateCore() - Orb Sphere Animation Loop, poll() - Polls status.json, drives sphere state, animateCore() (early prototype)

### Community 13 - "Knowledge Graph Render Loop"
Cohesion: 0.67
Nodes (3): kgLoop(), kgRender() - Canvas Draw, kgStep() - Force-directed Layout

### Community 14 - "HUD Visual Themes"
Cohesion: 0.67
Nodes (3): THEMES constant (_stage), THEMES constant (product), THEMES preset (customization option #1)

### Community 15 - "Twitch Chat Burst Effects"
Cohesion: 0.67
Nodes (3): checkBurst() (product), spawnBurst() (product), twitchMain() Twitch EventSub (product)

## Ambiguous Edges - Review These
- `Kudos.tv AI TTS Stream Companion` → `Orb Dashboard particle-sphere core (C:\Jarvis\orb)`  [AMBIGUOUS]
  vault/Projects/Streamer HUD Widget Market Research.md · relation: conceptually_related_to

## Knowledge Gaps
- **64 isolated node(s):** `Tasks Format Convention`, `Jarvis Persona (Sachlich-neutral, effizient)`, `Startup Routine (Greeting + Weather/Tasks Summary)`, `Google Drive Connector`, `Outlook Connector (Paused)` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Kudos.tv AI TTS Stream Companion` and `Orb Dashboard particle-sphere core (C:\Jarvis\orb)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Jarvis - Gesamtstatus` connect `Subagent Roster & Automation Hooks` to `Daily News Brief`, `CAPABILITIES.md Tool Catalog`, `License Key Generator & Setup Guide`, `Orb Flask Backend (app.py)`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `CAPABILITIES (vault pointer note)` connect `CAPABILITIES.md Tool Catalog` to `Subagent Roster & Automation Hooks`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Streamer HUD Widget` connect `License Key Generator & Setup Guide` to `Subagent Roster & Automation Hooks`, `CAPABILITIES.md Tool Catalog`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `Tasks Format Convention`, `Jarvis Persona (Sachlich-neutral, effizient)`, `Startup Routine (Greeting + Weather/Tasks Summary)` to the rest of the system?**
  _64 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Subagent Roster & Automation Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._
- **Should `CLAUDE.md Rules & Connector Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._