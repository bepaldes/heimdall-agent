---
name: claude-collaborator
description: Coordinate with Claude Code CLI (claude.exe) to cross-validate changes, request second-opinion reviews on git diffs, or validate test runs.
---

# Claude Collaborator Skill

This skill enables Antigravity (Gemini) to orchestrate tasks with Claude Code (`claude.exe`), delegating complex architectural reasoning, diff reviews, and adversarial validation.

## Real-Time Visibility in Herdr (Right Split & Auto-Close)

By default when running inside Herdr, all bridge invocations automatically:
- **Split the calling screen to the right**: Creates a side-by-side split pane in your current Herdr window.
- **Display a prominent request banner**:
  - Caller AI $\rightarrow$ Target Model
  - Action & Working Directory
  - **`>> WHAT IS BEING REQUESTED:`** A highlighted box showing the exact prompt/instructions.
  - Summary of modified files (`git diff --stat`) for code reviews.
- **Stream Claude's live execution**: Real-time display of reasoning, tool calls, and output right in that split pane.
- **Auto-close when complete**: Automatically closes the right pane after finishing and collapses your screen back to normal, returning the captured output to Antigravity.

## When to Activate

- When the user asks to "review with Claude", "validate with Claude", or "get a second opinion from Claude".
- After making non-trivial code edits or architectural refactors, to verify there are no hidden regressions.
- When facing ambiguous design choices where a second model's critique helps pick the best approach.

## Available Actions via `tools/claude-bridge.ps1`

Run commands using the project PowerShell helper script:

### 1. Adversarial Code Review of Git Diff
Splits the screen to the right, runs Claude Code review, streams live, and auto-closes:
```powershell
powershell -ExecutionPolicy Bypass -File tools/claude-bridge.ps1 review
```
To provide specific review instructions:
```powershell
powershell -ExecutionPolicy Bypass -File tools/claude-bridge.ps1 review "Focus on security vulnerabilities and ZITADEL OIDC session handling"
```

### 2. Consult Claude for Architectural Second Opinion
Sends an inquiry or architectural prompt directly to Claude in a right-split pane:
```powershell
powershell -ExecutionPolicy Bypass -File tools/claude-bridge.ps1 ask "How should we model group permission scopes for module pulse in Postgres?"
```

### 3. Validate Test or Build Run
Runs a test command and has Claude analyze output and errors in a right-split pane:
```powershell
powershell -ExecutionPolicy Bypass -File tools/claude-bridge.ps1 validate "pnpm test"
```

### 4. Interactive Handoff to Claude in a Right Split Pane
Launches a full interactive Claude session in a right split pane pre-loaded with a task:
```powershell
powershell -ExecutionPolicy Bypass -File tools/claude-bridge.ps1 interactive "Let's refactor the router together"
```

### Display & Control Flags:
- *(default)*: Splits the current Herdr screen to the right, streams live, and auto-closes when done.
- `-KeepOpen`: Keeps the split pane open after completion instead of auto-closing.
- `-Tab`: Opens in a new Herdr tab instead of splitting the screen.
- `-Window`: Forces a standalone OS console window instead of Herdr.
- `-Headless`: Runs silently in the background (for CI/unattended scripts).
- `-NoFocus`: Prevents switching focus to the right pane.
- `-Model <name>`: Override model (e.g. `-Model opus-5`, `-Model sonnet-5`, `-Model fable-5.1`).

## Guidelines for Antigravity

- **Synthesize, Don't Blindly Echo**: When Claude returns feedback, analyze its critiques against the platform's requirements (`docs/03.REQUIREMENTS.md`, `docs/06.DECISIONS.md`, `docs/02.GLOSSARY.md`).
- **Iterate**: If Claude identifies valid issues (e.g. edge cases, unhandled promises, type mismatches), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved.
