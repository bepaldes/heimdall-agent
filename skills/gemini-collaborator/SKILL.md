---
name: gemini-collaborator
description: Coordinate with Google Antigravity / Gemini CLI (agy.exe) via Herdr to cross-validate changes, request second opinions on architecture/diffs, or execute adversarial code reviews.
---

# Gemini Collaborator Skill

This skill enables Claude Code to orchestrate tasks with Google Antigravity / Gemini CLI (`agy.exe`) directly through native Herdr multiplexing, delegating complex architectural reasoning, diff reviews, codebase scans, and adversarial validation.

## When to Activate

- When the user asks to "review with Gemini", "validate with Gemini", "ask Antigravity", or "get a second opinion from Gemini".
- After making non-trivial code edits or architectural refactors, to verify there are no hidden regressions from Gemini's perspective.
- When facing ambiguous design choices where Gemini's large context window and deep multi-perspective reasoning help pick the best approach.

## Orchestration Method: Native Herdr Agent (`herdr` skill)

When running inside Herdr (`$env:HERDR_ENV = "1"`), communicate directly using Herdr's native agent orchestration. This maintains a persistent session across turns, preserves context, respects interactive approvals (`blocked`), and handles bracketed paste:

### 1. Fast Path: Re-use Active Idle Agent
Before splitting a pane, check if a Gemini/Antigravity agent is already running and idle:
```bash
herdr agent list
```
If an agent named `gemini-reviewer` or `agy` is idle or done, prompt it directly:
```bash
herdr agent prompt gemini-reviewer "Review the latest changes." --wait --timeout 120000
```

### 2. Spawning a New Gemini Agent (Single-Execution Batch)
If no active Gemini agent exists, batch pane creation and agent startup in a single command:
```bash
PANE_ID=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus | jq -r '.result.pane.pane_id')
herdr agent start gemini-reviewer --kind agy --pane "$PANE_ID"
herdr agent prompt gemini-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000
```

### 3. Read Findings into Context
```bash
herdr agent read gemini-reviewer --source recent-unwrapped --lines 120
```

### 4. Interactive Collaboration
When an interactive session or clarification is needed, send keys or prompt interactively:
```bash
herdr agent send-keys gemini-reviewer enter
```

## Guidelines for Claude Code

- **Synthesize, Don't Blindly Echo**: When Gemini returns feedback, analyze its critiques against the project's requirements, architectural documentation, and existing patterns.
- **Iterate**: If Gemini identifies valid issues (e.g. edge cases, unhandled promises, memory leaks, or missing error branches), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved through the collaboration.
