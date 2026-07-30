---
date: 2026-07-30
type: debug
tags:
  - debug
ai-first: true
project: "[[Projects/Jarvis System]]"
status: resolved
---

# Bug - Subagents Not Loading (BOM + CRLF)

## For future Claude

Bug investigation note. All 8 custom subagents in `.claude/agents/*.md` were silently
non-functional - never actually available to the Agent tool - despite [[Knowledge/AI Context
Efficiency Research]] and [[Projects/Jarvis System]] both asserting they were working. Found
as a side effect of a token-audit task, not something anyone was actively debugging. Pull this
if subagent delegation looks broken again, or before trusting an unverified "✓" claim about
this system's architecture.

## Symptom

Discovered during an empirical token-consumption audit of Jarvis startup (2026-07-30, matching
`orb/app.py`'s exact `claude -p ... --permission-mode acceptEdits --session-id ...` invocation).
The live "Available agent types" listing for a session running in `C:\Jarvis` showed only Claude
Code's 6 built-in agent types (`claude`, `claude-code-guide`, `Explore`, `general-purpose`, `Plan`,
`statusline-setup`) - none of the 8 project-custom ones (`business-analyst`, `coder`, `debugger`,
`planner`, `project-manager`, `researcher`, `webdesigner`, `writer`).

## Repro

1. Fresh `claude -p` session, cwd = `C:\Jarvis` (matches `orb/app.py:63-66`).
2. Check the "Available agent types for the Agent tool" listing surfaced at session start.
3. Custom agents absent; only built-ins present.

Startup debug log (`--debug-file`) corroborated this: no line ever logged loading project-level
custom agents from `C:\Jarvis\.claude\agents`. The only related line was `Total plugin agents
loaded: 0`, which is a different code path (plugin-bundled agents, not project agents).

## Investigation

Inspected `.claude/agents/coder.md` directly at the byte level:

```
b'\xef\xbb\xbf---\r\n'
```

UTF-8 BOM (`EF BB BF`) sitting *before* the opening `---` of the YAML frontmatter, plus CRLF line
endings throughout. Checked all 8 files individually (not assumed) - all 8 had the identical
BOM + CRLF pattern. Checked the working `CLAUDE.md` for comparison - no BOM, LF only. Frontmatter
parsers generally expect the file to start with a literal `---` at byte 0; the BOM breaks that,
so the parser most likely silently skipped every one of these files rather than erroring loudly.

## Root Cause

All 8 files in `.claude/agents/` were saved as UTF-8-with-BOM with CRLF line endings (likely a
Windows editor default), which doesn't match the plain UTF-8/LF convention the rest of the repo
(`CLAUDE.md`, hooks, etc.) uses. The leading BOM byte sequence prevented the YAML frontmatter
parser from recognizing the `---` delimiter, so none of the 8 agents were ever registered -
probably since the day they were created, not a recent regression.

## Fix

Stripped the BOM and normalized CRLF → LF in all 8 files (`business-analyst.md`, `coder.md`,
`debugger.md`, `planner.md`, `project-manager.md`, `researcher.md`, `webdesigner.md`, `writer.md`).
No content changes - byte-level cleanup only.

**Re-verified empirically, not just "BOM is gone":** ran a fresh production-matching session and
asked it to enumerate every available Agent-tool subagent type. All 8 custom agents now appear
alongside the 6 built-ins, each with its correct description - confirming they're actually loaded
and callable, not just that the parsing symptom cleared.

**Corrected the record:** [[Knowledge/AI Context Efficiency Research]]'s "8 subagents = sub-agent
architecture ✓" line asserted this was working without it ever having been verified live - updated
to reflect it wasn't actually functional until this fix. [[Projects/Jarvis System]] carries the
same unverified "verifiziert: alle 8 referenzieren PROJECTS.md/vault" claim under "Kern-System -
fertig" - flagging here too since it's the same underlying claim, though not edited as part of
this note (out of scope of what was asked).
