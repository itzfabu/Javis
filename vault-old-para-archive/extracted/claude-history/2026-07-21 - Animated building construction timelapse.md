---
title: "Animated building construction timelapse"
created: 2026-07-21T08:06:24.906020Z
uuid: aaf0c8a2-3c72-432b-adf8-b1a82f96ea22
source: claude-export-extracted
raw_note: "[[2026-07-21 - Animated building construction timelapse.md]]"
tags: [claude-history, extracted]
---

# Animated building construction timelapse (extracted)

## Entities
- **Three.js** (r160, ES modules via CDN) — used to build all 3D iterations of the animation/scene.
- **Higgsfield** — MCP video-generation connector, mentioned but not used (user wanted coded animation instead).
- **Universitätsspital Zürich Mitte 1/2** — real hospital construction project used as reference; architects **Christ & Gantenbein**, site on Gloriastrasse, Zürich; ~940M CHF budget, completion ~2031.

## Decisions
- User rejected a text-to-video prompt approach; wanted actual coded HTML/CSS/JS/Three.js output.
- Progression: CSS/SVG timelapse → Three.js 3D animated timelapse (14s loop) → static (no auto-animation, manual orbit only), detailed model based on real USZ MITTE 1/2 building.
- Assistant explicitly decided **not** to add a depth-of-field (BokehPass) postprocessing pass — deemed too risky to ship untested since a broken DOF pass could blank the whole render, unlike bloom which degrades gracefully.
- Assistant flagged that a hand-built procedural WebGL scene is near its realism ceiling without real architectural source data or a baked/Blender pipeline, and offered to generate a photorealistic still image instead as an alternative path.

## Patterns
- User gives short, iterative escalation prompts ("3d and way more detailed, and faster", "way more realistic like in the pictures", "as realistic as possible") rather than detailed specs — assistant infers scope each round.
- No sandbox rendering/GPU/screenshot capability — assistant repeatedly relies on Node syntax checks and manual code review to catch bugs (e.g., swapped `faceList` arguments, phantom shadow on transparent mesh, bad bloom resize override) before shipping, and is transparent about not having visually verified output.
