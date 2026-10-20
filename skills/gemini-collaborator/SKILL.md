---
name: gemini-collaborator
description: Coordinate with Google Antigravity / Gemini CLI (agy.exe) to cross-validate changes, request second opinions on architecture/diffs, or execute adversarial code reviews.
---

# Gemini Collaborator Skill

This skill enables Claude Code to orchestrate tasks with Google Antigravity / Gemini CLI (`agy.exe`), delegating complex architectural reasoning, diff reviews, codebase scans, and adversarial validation.

## Real-Time Visibility in Herdr (Right Split & Auto-Close)

By default when running inside Herdr, all bridge invocations automatically:
- **Split the calling screen to the right**: Creates a side-by-side split pane in your current Herdr window.
- **Display a prominent request banner**:
  - Caller AI $\rightarrow$ Target Model (Claude Code $\rightarrow$ Antigravity / Gemini)
  - Action & Working Directory
  - **`>> WHAT IS BEING REQUESTED:`** A highlighted box showing the exact prompt/instructions.
  - Summary of modified files (`git diff --stat`) for code reviews.
- **Stream Gemini's live execution**: Real-time display of reasoning, tool calls, and output right in that split pane.
- **Auto-close when complete**: Automatically closes the right pane after finishing and collapses your screen back to normal, returning the captured output to Claude Code.

## When to Activate

- When the user asks to "review with Gemini", "validate with Gemini", "ask Antigravity", or "get a second opinion from Gemini".
- After making non-trivial code edits or architectural refactors, to verify there are no hidden regressions from Gemini's perspective.
- When facing ambiguous design choices where Gemini's large context window and deep multi-perspective reasoning help pick the best approach.

## Available Actions via `tools/gemini-bridge.ps1`

Run commands using the project PowerShell helper script:

### 1. Adversarial Code Review of Git Diff
Splits the screen to the right, runs Antigravity review, streams live, and auto-closes:
```powershell
powershell -ExecutionPolicy Bypass -File tools/gemini-bridge.ps1 review
```
To provide specific review instructions:
```powershell
powershell -ExecutionPolicy Bypass -File tools/gemini-bridge.ps1 review "Focus on security vulnerabilities, memory leaks, and concurrency edge cases"
```

### 2. Consult Gemini for Architectural Second Opinion
Sends an inquiry or architectural prompt directly to Gemini in a right-split pane:
```powershell
powershell -ExecutionPolicy Bypass -File tools/gemini-bridge.ps1 ask "How should we structure this module's caching and database connection pooling?"
```

### 3. Scan Monorepo or Codebase
Instructs Gemini to scan the repository for specific patterns or consistency with doctrine:
```powershell
powershell -ExecutionPolicy Bypass -File tools/gemini-bridge.ps1 scan "Find all authentication token refresh and session handling references"
```

### 4. Interactive Handoff to Gemini in a Right Split Pane
Launches a full interactive Antigravity CLI session in a right split pane pre-loaded with a task:
```powershell
powershell -ExecutionPolicy Bypass -File tools/gemini-bridge.ps1 interactive "Let's refactor the data access layer together"
```

### Display & Control Flags:
- *(default)*: Splits the current Herdr screen to the right, streams live, and auto-closes when done.
- `-KeepOpen`: Keeps the split pane open after completion instead of auto-closing.
- `-Tab`: Opens in a new Herdr tab instead of splitting the screen.
- `-Window`: Forces a standalone OS console window instead of Herdr.
- `-Headless`: Runs silently in the background (invokes `agy -p` directly).
- `-NoFocus`: Prevents switching focus to the right pane.
- `-Timeout <seconds>`: Custom timeout in seconds (default: 300).

## Fallback Direct CLI Invocations (Headless / Standalone)

If `tools/gemini-bridge.ps1` is not present in the workspace, Claude Code can invoke `agy` directly from the terminal:
- **Headless prompt**:
  ```powershell
  agy --dangerously-skip-permissions -p "Review the latest changes in git diff and identify potential regressions."
  ```
- **Interactive session**:
  ```powershell
  agy --dangerously-skip-permissions -i "Let's work through this problem together."
  ```

## Guidelines for Claude Code

- **Synthesize, Don't Blindly Echo**: When Gemini returns feedback, analyze its critiques against the project's requirements, architectural documentation, and existing patterns.
- **Iterate**: If Gemini identifies valid issues (e.g. edge cases, unhandled promises, memory leaks, or missing error branches), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved through the collaboration.
