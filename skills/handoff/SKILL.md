---
name: handoff
description: Compact the current conversation and session context into an isolated handoff document so a fresh agent or subagent can pick up work without drift.
---

# The Handoff Protocol

When ending a session, switching agent contexts, or spawning a fresh child agent (e.g. via `invoke_subagent`, `herdr`, or `claude --bg`), create a lean, structured handoff document.

---

## 1. Zero-Duplication & Pointer-First Principle

Do **not** dump raw source code, large file bodies, verbose conversational histories, or full plan duplicates into the handoff artifact.
- **Reference existing artifacts by path or commit hash**:
  - Plan / Spec: `docs/designs/YYYY-MM-DD-<feature>.md`
  - ADRs: `docs/adr/`
  - Git branch & diff: `feature/xyz` (`git diff origin/main..HEAD`)
  - Failing test paths: `tests/integration/...`
- **Redact secrets**: Strip API keys, session tokens, or sensitive credentials.

---

## 2. Storage Location

Write the handoff file to the operating system's temporary directory to avoid polluting the git working tree:
- **Windows**: `$env:TEMP\handoff-<feature>-<timestamp>.md` (e.g. `C:\Users\<user>\AppData\Local\Temp\...`)
- **Linux / macOS**: `/tmp/handoff-<feature>-<timestamp>.md`

---

## 3. Mandatory Document Structure

A handoff document must follow this template:

```markdown
# Session Handoff: <Feature or Task Name>

### 1. Status & Blast Radius
- **Current State**: [WIP / Blocked / Ready for Verification / Awaiting Review]
- **Target Branch**: `<branch-name>`
- **Last Verified Commit**: `<short-hash>` (or unstaged changes in working copy)

### 2. Settled Decisions & Pointers
- **Spec / Plan**: [docs/designs/YYYY-MM-DD-feature.md](file:///path/to/spec)
- **ADR**: [docs/adr/...](file:///path/to/adr)
- **Decided Invariants**: <1-2 bullet summary of settled boundaries>

### 3. Open Frontier & Next Immediate Actions
1. <Exact first command or test to execute>
2. <Expected failure or next component to modify>

### 4. Suggested Skills for Next Agent
- `<skill-name-1>`: <Why the next agent should call this skill>
- `<skill-name-2>`: <Why the next agent should call this skill>
```

---

## 4. Seeding the Next Agent

- **Antigravity / Subagent**: Launch the subagent with the handoff path or concise summary containing the pointer.
- **Claude Code CLI**: Run `claude --bg --name "<Task Name>" -- "$(cat <path-to-temp-handoff>)"`. Passing via file keeps the shell from misinterpreting special characters (`$`, backticks).
- **Herdr Multiplexing**: Seed the target agent pane via `herdr agent prompt <agent> "..."`.
