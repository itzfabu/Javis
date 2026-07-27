---
tags: [project]
status: active
---

# Streamer HUD Widget

## Summary

Package the orb dashboard's audio-reactive particle-sphere as an OBS browser-source widget for livestreamers, sold as a functional/reactive HUD asset rather than a decorative overlay. A pivot away from [[Jarvis-as-a-Service Launch]] (paused), which tried to sell Jarvis as a personal-assistant service and hit a commoditized $15–45 Fiverr market. Tracked in knowledge/PROJECTS.md, owner agent: webdesigner. Linked to the "Monetize the Jarvis System" goal (knowledge/GOALS.md, quarterly, active).

## Key details

- **Market validation (business-analyst):** conditional thumbs up. The streamer overlay market is a real, transacting channel at $10–$40 price points, and the orb's real Web Audio-driven reactivity is a genuine, demoable differentiator versus competitors' pre-rendered loops (Etsy, OWN3D, Kudos.tv, Nerd or Die). But the market doesn't pay an "AI/reactive" premium — the one direct comparable found (Kudos.tv's AI TTS Stream Companion) sells at $12, the same tier as purely decorative widgets. Full findings: [[Streamer HUD Widget Market Research]].
- **Price recommendation:** $19–$29 one-time as a pure visual asset, or $5–$10/month if sold as an ongoing service — both flagged as directional estimates, not confirmed ceilings (WebSearch snippet data, not a manual logged-in browse).
- **Technical condition (updated 2026-07-27):** the build has moved well past prototyping. `orb/product/StreamerHUD/reactive-hud-pack.html` is a standalone product file (no Claude/Flask backend) implementing 14 visual styles — 2 free (Sphere, Waveform), 12 Pro (Orbit Rings, Hologram Grid, Radar Sweep, Data Stream, Radar+Sphere Combo, Mirrored Waveform, VU Ring, Arc Gauge, Heartbeat Monitor, Lightning, Particle Burst, Firework, Twitch Events) — plus a freemium license-key system (`License-Key-Generator-SELLER-ONLY.html` + an in-widget validator) and Twitch OAuth + EventSub WebSocket integration (follow/subscribe/raid trigger effects).
- **Current status (updated 2026-07-27):** build is largely done, not just validated — corrects the "no build work started" status below, which was stale. Packaged as `StreamerHUD-v1.zip` with `Setup-Guide.md` and `Start-Widget-Server.bat`. Still open per TASKS.md: final customer-facing packaging/setup instructions, sales-channel decision, licensing terms, a WebSocket auto-reconnect (none exists yet), and a sensitivity/threshold slider (reactivity is currently fixed). Full breakdown: [[Jarvis - Gesamtstatus]].

## Related
- [[Streamer HUD Widget Market Research]]
- [[Jarvis-as-a-Service Launch]]
- [[Streamer HUD Widget - Premium Persona Tier Idea]]
- [[Jarvis - Gesamtstatus]]
