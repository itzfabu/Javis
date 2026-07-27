# Graph Report - .  (2026-07-27)

## Corpus Check
- Corpus is ~25,364 words - fits in a single context window. You may not need a graph.

## Summary
- 168 nodes · 197 edges · 37 communities (22 shown, 15 thin omitted)
- Extraction: 84% EXTRACTED · 15% INFERRED · 2% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.86)
- Token cost: 44,432 input · 0 output

## Community Hubs (Navigation)
- Business Planning & Pricing Notes
- Jarvis System Documentation (README)
- Subagent Roster & Knowledge System
- TASKS.md Task List & Tags
- Orb Flask Backend (app.py)
- Streamer HUD Market Research
- Daily News Brief
- License Key & Setup Guide
- Demo Site & Hardcoding Blocker
- Particle Sphere Init & Style
- Knowledge Graph Sync Loop
- Sphere Animation Loop
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
- Area Note Template
- Vault Welcome Page

## God Nodes (most connected - your core abstractions)
1. `Jarvis System Documentation (README)` - 26 edges
2. `Project Manager Agent` - 10 edges
3. `Jarvis-as-a-Service Launch` - 9 edges
4. `Jarvis-as-a-Service Pricing Research` - 9 edges
5. `Streamer HUD Widget` - 9 edges
6. `chat()` - 7 edges
7. `Obsidian Vault Memory System` - 7 edges
8. `Streamer HUD Widget Market Research` - 7 edges
9. `#jarvis-as-a-service (project tag)` - 7 edges
10. `Daily Brief 2026-07-27` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Jarvis System Documentation (README)` --references--> `Business Analyst Agent`  [EXTRACTED]
  README.md → .claude/agents/business-analyst.md
- `Jarvis System Documentation (README)` --references--> `Coder Agent`  [EXTRACTED]
  README.md → .claude/agents/coder.md
- `Jarvis System Documentation (README)` --references--> `Debugger Agent`  [EXTRACTED]
  README.md → .claude/agents/debugger.md
- `Jarvis System Documentation (README)` --references--> `Planner Agent`  [EXTRACTED]
  README.md → .claude/agents/planner.md
- `Jarvis System Documentation (README)` --references--> `Project Manager Agent`  [EXTRACTED]
  README.md → .claude/agents/project-manager.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Jarvis Multi-Agent Delegation Roster** — claude_agents_business_analyst_business_analyst, claude_agents_coder_coder, claude_agents_debugger_debugger, claude_agents_planner_planner, claude_agents_project_manager_project_manager, claude_agents_researcher_researcher, claude_agents_webdesigner_webdesigner, claude_agents_writer_writer [EXTRACTED 1.00]
- **SHUD License Key Checksum Protocol** — orb_license_key_generator_seller_only_checksum, orb_product_streamerhud_reactive_hud_pack_isvalidlicensekey, orb_product_stage_reactive_hud_pack_isvalidlicensekey [INFERRED 0.95]
- **Shared Particle-Sphere Visualization Pattern** — orb_index_initcore, orb_prototypes_streamer_hud_prototype_initcore, orb_product_streamerhud_reactive_hud_pack_sphere_style, orb_product_stage_reactive_hud_pack_sphere_style [INFERRED 0.85]
- **Jarvis Monetization Pivot Chain (Launch -> Streamer HUD -> Persona Tier)** — vault_projects_jarvis_as_a_service_launch_jarvis_as_a_service_launch, vault_projects_streamer_hud_widget_streamer_hud_widget, vault_projects_streamer_hud_widget_premium_persona_tier_idea_premium_persona_tier [INFERRED 0.85]
- **'AI Doesn't Buy a Price Premium' Cross-Track Finding** — vault_projects_jarvis_as_a_service_pricing_research_jarvis_as_a_service_pricing_research, vault_projects_streamer_hud_widget_market_research_streamer_hud_widget_market_research, vault_resources_insights_ai_reactive_no_premium [INFERRED 0.85]
- **Personal-Machine Hardcoding Blocker Across Products** — vault_projects_jarvis_as_a_service_launch_orb_dashboard, vault_projects_streamer_hud_widget_market_research_app_py, vault_projects_streamer_hud_widget_market_research_index_html, vault_resources_insights_personal_machine_hardcoding_blocker [INFERRED 0.85]
- **Jarvis-as-a-Service launch preparation tasks** — tasks_tag_jarvis_as_a_service, tasks_task_validate_pricing_positioning, tasks_task_build_portfolio_demo_site, tasks_task_draft_gig_listing_copy, tasks_task_record_demo_video, tasks_task_decide_target_buyer, tasks_task_scope_productization_checklist, tasks_task_build_v1_static_demo_site [INFERRED 0.85]
- **Streamer HUD product shipping/packaging tasks** — tasks_tag_streamer_hud, tasks_task_package_for_end_customers, tasks_task_write_customer_facing_setup_instructions, tasks_task_decide_delivery_sales_channel, tasks_task_write_basic_licensing_terms [INFERRED 0.85]

## Communities (37 total, 15 thin omitted)

### Community 0 - "Business Planning & Pricing Notes"
Cohesion: 0.12
Nodes (25): business-analyst agent (pricing/positioning contributor), Jarvis-as-a-Service Launch, Jarvis Personal AI Assistant System, Monetize the Jarvis System (goal), project-manager agent (owner), Demo-Driven Lead Magnet Positioning, Fiverr Marketplace ('Claude Code setup' gigs), Jarvis-as-a-Service Pricing Research (+17 more)

### Community 1 - "Jarvis System Documentation (README)"
Cohesion: 0.12
Nodes (21): Feste Regeln (Fixed Safety Rules), Startup Routine (Greeting + Weather/Tasks Summary), sendMessage() - POST /chat, GitHub Connector (gh CLI), Google Drive Connector, Outlook Connector (Paused), Playwright Connector, Jarvis System Documentation (README) (+13 more)

### Community 2 - "Subagent Roster & Knowledge System"
Cohesion: 0.25
Nodes (15): Business Analyst Agent, Coder Agent, Debugger Agent, Planner Agent, Project Manager Agent, Researcher Agent, Webdesigner Agent, Writer Agent (+7 more)

### Community 3 - "TASKS.md Task List & Tags"
Cohesion: 0.21
Nodes (16): Claude Flowstate (idea), #jarvis-as-a-service (project tag), #streamer-hud (project tag), Add color/theme customization options to the streamer HUD widget (done), Build a portfolio/demo site showcasing the orb dashboard, Build v1 static demo site (screen-recording hero, no live backend) once the recording exists, Write up "Claude Flowstate" idea as a note, Decide delivery/sales channel (Gumroad, Etsy, itch.io, own site) (+8 more)

### Community 4 - "Orb Flask Backend (app.py)"
Cohesion: 0.26
Nodes (10): before_request, add_history(), background_backup(), chat(), check_origin(), get_open_tasks(), index(), run_claude() (+2 more)

### Community 5 - "Streamer HUD Market Research"
Cohesion: 0.20
Nodes (10): Jarvis Real Differentiators (knowledge graph, multi-agent delegation, dashboard), 'Click once, ever' revised target, getUserMedia() mic permission gating, Kudos.tv AI TTS Stream Companion, OBS Browser Source Persistence (open question), Orb Dashboard particle-sphere core (C:\Jarvis\orb), Particle-Sphere State Machine (idle/thinking/speaking), Mic Permission Persistence Across Reload (empirically confirmed) (+2 more)

### Community 6 - "Daily News Brief"
Cohesion: 0.29
Nodes (7): Berlin Pride Terror Attack, Daily Brief 2026-07-27, Strait of Hormuz Mine Explosion, Kyiv Attacks / Lavrov-Rubio Meeting, Oil Prices Rise, China Growth Slows, US 12.5% Tariff on Switzerland, Daily News Brief Cloud Routine

### Community 7 - "License Key & Setup Guide"
Cohesion: 0.38
Nodes (7): checksum() function, generate() function, isValidLicenseKey() (_stage), Streamer HUD Setup Guide (_stage), isValidLicenseKey() (product), Streamer HUD Setup Guide (product), OBS Transparency Test Page

### Community 8 - "Demo Site & Hardcoding Blocker"
Cohesion: 0.33
Nodes (6): Static Demo Site Plan (v1), Orb Dashboard (C:\Jarvis\orb), webdesigner agent (demo site contributor), app.py (Flask backend shelling out to Claude Code CLI), index.html (shipped widget UI with plaintext token), Personal-Machine Hardcoding as Recurring Blocker

### Community 9 - "Particle Sphere Init & Style"
Cohesion: 0.50
Nodes (4): initCore() - Jarvis Orb Particle Sphere, Sphere Style Renderer (_stage), Sphere Style Renderer (product), initCore() (early prototype)

### Community 11 - "Sphere Animation Loop"
Cohesion: 0.67
Nodes (3): animateCore() - Orb Sphere Animation Loop, poll() - Polls status.json, drives sphere state, animateCore() (early prototype)

### Community 12 - "Knowledge Graph Render Loop"
Cohesion: 0.67
Nodes (3): kgLoop(), kgRender() - Canvas Draw, kgStep() - Force-directed Layout

### Community 13 - "HUD Visual Themes"
Cohesion: 0.67
Nodes (3): THEMES constant (_stage), THEMES constant (product), THEMES preset (customization option #1)

### Community 14 - "Twitch Chat Burst Effects"
Cohesion: 0.67
Nodes (3): checkBurst() (product), spawnBurst() (product), twitchMain() Twitch EventSub (product)

## Ambiguous Edges - Review These
- `Jarvis-as-a-Service Pricing Research` → `Resource Note Template`  [AMBIGUOUS]
  vault/Projects/Jarvis-as-a-Service Pricing Research.md · relation: conceptually_related_to
- `Streamer HUD Widget Market Research` → `Resource Note Template`  [AMBIGUOUS]
  vault/Projects/Streamer HUD Widget Market Research.md · relation: conceptually_related_to
- `Orb Dashboard particle-sphere core (C:\Jarvis\orb)` → `Kudos.tv AI TTS Stream Companion`  [AMBIGUOUS]
  vault/Projects/Streamer HUD Widget Market Research.md · relation: conceptually_related_to

## Knowledge Gaps
- **54 isolated node(s):** `Tasks Format Convention`, `Jarvis Persona (Sachlich-neutral, effizient)`, `Startup Routine (Greeting + Weather/Tasks Summary)`, `Berlin Pride Terror Attack`, `Strait of Hormuz Mine Explosion` (+49 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Jarvis-as-a-Service Pricing Research` and `Resource Note Template`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Streamer HUD Widget Market Research` and `Resource Note Template`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Orb Dashboard particle-sphere core (C:\Jarvis\orb)` and `Kudos.tv AI TTS Stream Companion`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Jarvis System Documentation (README)` connect `Jarvis System Documentation (README)` to `Subagent Roster & Knowledge System`, `Daily News Brief`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `Knowledge System (PROJECTS.md/GOALS.md/TASKS.md)` connect `Subagent Roster & Knowledge System` to `TASKS.md Task List & Tags`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `Project Manager Agent` connect `Subagent Roster & Knowledge System` to `Jarvis System Documentation (README)`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `Tasks Format Convention`, `Jarvis Persona (Sachlich-neutral, effizient)`, `Startup Routine (Greeting + Weather/Tasks Summary)` to the rest of the system?**
  _54 weakly-connected nodes found - possible documentation gaps or missing edges._