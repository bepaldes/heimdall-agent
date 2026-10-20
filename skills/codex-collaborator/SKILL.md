---
name: codex-collaborator
description: >
  Coordinate with OpenAI Codex CLI (codex.exe) to cross-validate changes, request second-opinion
  adversarial reviews on git diffs, or validate test and build executions.
upstream: https://github.com/bepaldes/heimdall-agent
version: 1.0.0
---

# Codex Collaborator Skill

This skill enables Google Antigravity and Claude Code to orchestrate tasks with OpenAI Codex CLI (`codex.exe`), delegating complex architectural reasoning, diff reviews, and adversarial validation across the tri-directional bridge.

## Real-Time Visibility in Herdr (Right Split & Auto-Close)

By default when running inside Herdr, all bridge invocations automatically:
- **Split the calling screen to the right**: Creates a side-by-side split pane in your current Herdr window.
- **Display a prominent request banner**:
  - Caller AI $\rightarrow$ Target Model (`gpt-6-astra`)
  - Action & Working Directory
  - **`>> WHAT IS BEING REQUESTED:`** A highlighted box showing the exact prompt/instructions.
  - Summary of modified files (`git diff --stat`) for code reviews.
- **Stream Codex's live execution**: Real-time display of reasoning, tool calls, and output right in that split pane.
- **Auto-close when complete**: Automatically closes the right pane after finishing and collapses your screen back to normal, returning the captured output to the caller.

## When to Activate

- When the user asks to "review with Codex", "validate with Astra", or "get a second opinion from Codex".
- In multi-agent plans requiring tri-directional cross-model validation (Claude $\rightarrow$ Codex, or Gemini $\rightarrow$ Codex).
- When validating complex TypeScript types, database migrations, or edge-case logic with an alternative reasoning perspective.

## Available Actions via `tools/codex-bridge.ps1`

Run commands using the project PowerShell helper script:

### 1. Adversarial Code Review of Git Diff
Splits the screen to the right, runs Codex CLI review, streams live, and auto-closes:
```powershell
powershell -ExecutionPolicy Bypass -File tools/codex-bridge.ps1 review
```
To provide specific review instructions:
```powershell
powershell -ExecutionPolicy Bypass -File tools/codex-bridge.ps1 review "Focus on security vulnerabilities and boundary conditions"
```

### 2. Consult Codex for Architectural Second Opinion
Sends an inquiry or architectural prompt directly to Codex (Astra) in a right-split pane:
```powershell
powershell -ExecutionPolicy Bypass -File tools/codex-bridge.ps1 ask "How should we design idempotency keys for external webhook processing?"
```

### 3. Validate Test or Build Run
Runs a test command and has Codex analyze output and errors in a right-split pane:
```powershell
powershell -ExecutionPolicy Bypass -File tools/codex-bridge.ps1 validate "pnpm test"
```

### 4. Interactive Handoff to Codex in a Right Split Pane
Launches a full interactive Codex session in a right split pane pre-loaded with a task:
```powershell
powershell -ExecutionPolicy Bypass -File tools/codex-bridge.ps1 interactive "Let's investigate this edge case together"
```

### Display & Control Flags:
- *(default)*: Splits the current Herdr screen to the right, streams live, and auto-closes when done.
- `-KeepOpen`: Keeps the split pane open after completion instead of auto-closing.
- `-Tab`: Opens in a new Herdr tab instead of splitting the screen.
- `-Window`: Forces a standalone OS console window instead of Herdr.
- `-Headless`: Runs silently in the background (for CI/unattended scripts).
- `-NoFocus`: Prevents switching focus to the right pane.
- `-Model <name>`: Override model (e.g. `-Model gpt-6-astra`).
- `-Effort <level>`: Reasoning effort (`low`, `medium`, `high`, `xhigh`).

## Guidelines for Collaborating Agents

- **Synthesize, Don't Blindly Echo**: When Codex returns feedback, analyze its critiques against the project's requirements and design system.
- **Iterate**: If Codex identifies valid issues (e.g. boundary exceptions, unhandled race conditions), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved.

---

## Upstream Provenance & Governance Protocol

- **Source Repository**: [bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Update Directive**:
  > *Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report.*
