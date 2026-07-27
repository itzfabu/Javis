# Insights

## 2026-07-27 Weekly Review

### Suggested links
- Add `[[Streamer HUD Widget]]` to **Jarvis-as-a-Service Launch.md** — the Streamer HUD Widget project is an explicit pivot away from this one ("A pivot away from [[Jarvis-as-a-Service Launch]] (paused)"), but the Launch note never links forward to where the pivot went; a reader landing on Launch has no way to find its successor.
- Add `[[Streamer HUD Widget Market Research]]` to **Jarvis-as-a-Service Pricing Research.md** — the Streamer HUD market research explicitly calls back to this note ("same caveat as [[Jarvis-as-a-Service Pricing Research]]") and both share the identical WebSearch-snippet-aggregation confidence caveat and pricing-comparable methodology, but the link isn't reciprocated.
- Add `[[Streamer HUD Widget Market Research]]` to **Streamer HUD Widget - Premium Persona Tier Idea.md** — the persona tier's upsell pricing would sit on top of the base widget's price band, which is exactly what the market research note establishes ($19–$29 one-time / $5–$10/month); currently the idea note only links to the parent project note, not the pricing evidence behind it.

### Recurring themes
- **"AI/reactive" doesn't buy a price premium.** Both pricing research notes independently land on the same conclusion: Jarvis's real differentiators (knowledge graph, multi-agent delegation) aren't provable to a cold buyer without a demo, and the one direct AI-reactive comparable for the streamer widget (Kudos.tv's AI TTS Companion) prices at the same $12 tier as purely decorative products. Across both active monetization tracks, "AI-powered" framing alone isn't moving price — only a live demo or concrete automation framing does.
- **Personal-machine hardcoding is the recurring blocker to shipping anything public.** The Jarvis-as-a-Service demo site can't safely embed the real orb dashboard because it's wired to a hardcoded token and Fabio's real Claude Code session; the Streamer HUD widget has the same problem one level down (`app.py` shells out to Fabio's CLI session, hardcoded Windows paths, a plaintext secret token in shipped JS, personal panels tied to his real files). Every public-facing plan under the "Monetize the Jarvis System" goal currently stalls on the same de-personalization/hardening work.
- **Research is consistently outrunning execution.** All three research-heavy notes (both pricing research notes, both project notes) report "validation done, no build work started yet" as the current status. Two parallel monetization tracks are now in this same holding pattern — worth flagging so a build step gets scheduled rather than a third research pass.
- **Organizational note:** the two notes tagged `resource` (Jarvis-as-a-Service Pricing Research, Streamer HUD Widget Market Research) physically live in `vault/Projects/` rather than `vault/Resources/`, despite the vault's stated PARA convention (per vault/README.md) that reference material belongs in Resources. Not fixed here since moving files is an edit, not an insight — flagging for a deliberate decision.

### Consolidation / Archive candidates
- None this round — every reviewed note (all 5 in vault/Projects/) was last touched 2026-07-23 or 2026-07-24, well inside the 60-day staleness window. vault/Areas/ and vault/Resources/ currently contain no notes (only `.gitkeep`), so nothing to assess there.
