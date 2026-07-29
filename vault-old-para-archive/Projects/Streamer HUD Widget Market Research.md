---
tags: [resource]
---

# Streamer HUD Widget Market Research

## Summary

**Thumbs up, conditionally.** More viable than the earlier "sell Jarvis as a service" pivot — the streamer overlay/widget market is a real, transacting channel at $10–$40 price points, and the existing orb visual (`C:\Jarvis\orb`) already has a genuine, demoable differentiator: it reacts to real audio amplitude and state, unlike the pre-rendered loops most competitors sell. But this only holds if the product is de-scoped to a pure audio/event-reactive visual widget and the Claude Code chat backend is dropped — keeping it re-imports the exact multi-tenant/hosting/auth problem that sank [[Jarvis-as-a-Service Launch]]. Market pricing evidence also does not support an "AI premium" in this channel: the one directly comparable AI-reactive product found (Kudos.tv's AI TTS Stream Companion) sells at $12, the same tier as purely decorative widgets.

## Key details

**Market pricing found (Etsy, OWN3D, Kudos.tv, Nerd or Die — July 2026, via WebSearch snippet aggregation, not verified logged-in browsing):**

| Comparable | Price | Tier |
|---|---|---|
| Etsy animated Twitch overlays | $2–$32, median ~$10–15 | Decorative loop |
| OWN3D entry animated overlay / full package | $10 / $30 | Decorative |
| OWN3D Pro (full library access, subscription) | $60/yr (~$5/mo) | Subscription/decorative |
| Kudos.tv single widget / full themed pack | ~$12 / $29–$39 | Decorative |
| **Kudos.tv "AI TTS Stream Companion"** (closest real reactive/AI comparable, requires buyer's own OpenAI key) | **$12** | AI/reactive — priced same as decorative, not at a premium |
| Twitch Extensions (Bits revenue share) | 80/20 split, dev gets $0.002/bit | Different model entirely — usage-based, requires Twitch review/hosting, not equivalent to an MVP overlay sale |

**Key finding:** the market does not reward "reactive/AI" with a price premium in this channel — the one comparable found sits at the bottom of the decorative price band, not above it. Any pricing above ~$40 one-time or ~$15/month is an unvalidated assumption.

**Technical reality check (from reading `C:\Jarvis\orb\app.py` and `C:\Jarvis\orb\index.html` directly):**
- Reusable: the three.js particle-sphere core is a genuine state machine (idle/thinking/speaking → color, wobble amplitude, rotation speed) driven by real Web Audio API amplitude analysis (`getAudioAmplitude()`) — this is the actual product-worthy differentiator and needs no rebuild to prove visually.
- **Prototyped and live-tested in a real Chrome tab** (`C:\Jarvis\orb\prototypes\streamer-hud-prototype.html` — bare Three.js sphere + Web Audio, no click handlers, no Claude/Flask backend). Confirmed empirically:
  - The particle-sphere visual initializes and renders fully independent of audio/mic state — zero gesture needed for the visual core itself.
  - `getUserMedia()` fires automatically on page load with no click gating in the code.
  - But Chrome's native mic-permission prompt then blocks indefinitely on `prompt` state, and this is browser-chrome-level UI that no page script — and no browser automation tooling — can click through or pre-authorize (confirmed by directly attempting it: blocked navigating to `chrome://settings` to pre-grant, and the permission bubble doesn't even appear in extension-captured screenshots, which only cover the page viewport, not browser chrome). This is a deliberate web-platform security boundary, not a fixable bug.
  - **Revised bar: "click once, ever" is the correct target, not "zero clicks."** A true zero-click experience (including the very first use) is not achievable with `getUserMedia` in any Chromium-based renderer, OBS's CEF included. This is normal for any OBS overlay needing mic access (same requirement other reactive overlay products have) and should not be treated as a blocker — it should be treated as a one-time setup step (right-click source → Interact → Allow), documented for the customer.
  - **Persistence across reload: empirically confirmed, not just documented.** Fabio manually clicked "Allow" once (browser automation cannot click native permission UI itself — confirmed separately, see above). After that single grant, reloading the same prototype page skipped the permission prompt entirely: `AudioContext: running`, `Mic permission: granted`, `Auto-start (no click): YES`, live amplitude reading real ambient mic input (0.052) — full pipeline came up with zero clicks on the second load. This confirms the browser-level half of persistence directly rather than relying only on documented Chromium behavior.
  - **Still open:** the OBS-specific half — whether a grant made via right-click → Interact → Allow inside an actual OBS Browser Source similarly persists across OBS restarts. This still rests on documented OBS/CEF cache-persistence behavior (per-source persistent cache by default) rather than a direct test, since no OBS installation was available to verify. Only remaining step to fully close this question: repeat the same click-once-then-reload check inside real OBS.
- Not reusable / must be rebuilt: `app.py` shells out to Fabio's real local Claude Code CLI session (`--resume WEBCHAT_SESSION_ID`), reads/writes hardcoded absolute Windows paths (`C:\Jarvis\TASKS.md`, `status.json`, etc.), and gates `/chat` with a single hardcoded secret token that's also embedded in plaintext in the shipped `index.html` JS. None of this is portable — a real product needs generic audio-input reactivity (game/mic loopback or stream events), not an LLM shell-out.
- UI elements tied to Fabio personally (knowledge-graph panel, task list, activity log pulling his real files) must be stripped before any public demo — same class of data-exposure risk flagged for the earlier orb-based demo-site plan.
- Distribution/hosting undecided and changes cost structure: local companion app (cheap, but install friction) vs. hosted URL (zero-install, but now carries hosting/auth/abuse-cost risk per customer) — must be decided before finalizing price.

**Price recommendation:**
- One-time visual asset (no chat backend): **$19–$29**, top of the decorative single-widget band, not above it.
- Ongoing-service framing (subscription, since it needs a running process unlike a static asset): **$5–$10/month**, closer to OWN3D Pro precedent than to a large one-time price.
- Data-confidence caveat: figures come from WebSearch snippet aggregation, not a manual logged-in browse of live listings — same caveat as [[Jarvis-as-a-Service Pricing Research]] — treat as directional, not precise.

**Opportunities:**
- Real, transacting marketplace channel (unlike the commoditized $15–45 Fiverr "Claude Code setup" niche the prior pivot hit).
- Demoable today: a screen recording of the existing reactive core is a stronger proof asset than anything the prior pivot had, since differentiation there was invisible without a live demo.
- Shorter path to v1 than a personal-assistant product — no multi-tenant hardening needed if the LLM backend is dropped.

**Risks:**
- No evidence market pays more for "reactive/AI" — flagged above as the core pricing risk.
- Largely resolved: a true zero-click experience is impossible (browser security, confirmed), but "click once, ever" is an acceptable, normal bar for this product category, and browser-level persistence across reload is now empirically confirmed. Only remaining sliver of risk: whether the same holds for an OBS Browser Source specifically (vs. a regular Chrome tab), still unverified.
- Current build is 100% wired to Fabio's personal machine/session — not a stripping exercise, needs new software for generic reactivity.
- Distribution model undecided; changes both COGS and applicable comparable set.
- Modest revenue ceiling even in the best case ($10–$40 one-time / ~$5/mo), and distribution/visibility on these marketplaces is untested.

**Next steps:**
1. Repeat the click-once-then-reload check inside an actual OBS Browser Source (right-click → Interact → Allow, then restart OBS) — the browser-tab version of this is now confirmed, only the OBS-specific persistence remains open.
2. Decide what it reacts to (game/mic audio, stream/chat events, or an optional AI co-host) — recommend dropping the LLM chat backend for v1 to avoid re-importing the multi-tenant problem.
3. Decide distribution model (local companion app vs. hosted subscription) before finalizing price.
4. Strip Fabio-specific elements (Claude CLI shell-out, hardcoded token/paths, personal panels) from `app.py`/`index.html` before any public demo.
5. Manually browse 15–20 live "reactive"/"AI"-tagged listings on Kudos.tv/OWN3D/Etsy to firm up the pricing comparable set — one data point (Kudos AI TTS Companion) is not enough to price with full confidence.

## Related
- [[Streamer HUD Widget]]
- [[Jarvis-as-a-Service Pricing Research]]
- [[Jarvis-as-a-Service Launch]]
