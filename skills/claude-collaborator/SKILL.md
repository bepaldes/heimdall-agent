---
name: claude-collaborator
description: Coordinate with Claude Code CLI (claude.exe) via Herdr to cross-validate changes, request second-opinion reviews on git diffs, or validate test runs.
---

# Claude Collaborator Skill

This skill enables Antigravity (Gemini) to orchestrate tasks with Claude Code (`claude.exe`) directly through native Herdr multiplexing, delegating complex architectural reasoning, diff reviews, and adversarial validation.

## When to Activate

- When the user asks to "review with Claude", "validate with Claude", or "get a second opinion from Claude".
- After making non-trivial code edits or architectural refactors, to verify there are no hidden regressions.
- When facing ambiguous design choices where a second model's critique helps pick the best approach.

## Orchestration Method: Native Herdr Agent (`herdr` skill)

When running inside Herdr (`$env:HERDR_ENV = "1"`), communicate directly using Herdr's native agent orchestration. This maintains a persistent session across turns, preserves context, respects interactive approvals (`blocked`), and handles bracketed paste:

### 1. Fast Path: Re-use Active Idle Agent
Before splitting a pane, check if a Claude agent is already running and idle:
```bash
herdr agent list
```
If an agent named `claude-reviewer` or `claude` is idle or done, prompt it directly:
```bash
herdr agent prompt claude-reviewer "Review the latest changes." --wait --timeout 120000
```

### 2. Spawning a New Claude Agent (Single-Execution Batch)
If no active Claude agent exists, batch pane creation and agent startup in a single command:
```bash
PANE_ID=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus | jq -r '.result.pane.pane_id')
herdr agent start claude-reviewer --kind claude --pane "$PANE_ID" -- --model claude-sonnet-5
herdr agent prompt claude-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000
```

### 3. Read Findings into Context
```bash
herdr agent read claude-reviewer --source recent-unwrapped --lines 120
```

### 4. Interactive Collaboration
When an interactive session or clarification is needed, send keys or prompt interactively:
```bash
herdr agent send-keys claude-reviewer enter
```

## Guidelines for Antigravity

- **Synthesize, Don't Blindly Echo**: When Claude returns feedback, analyze its critiques against the platform's requirements (`docs/03.REQUIREMENTS.md`, `docs/06.DECISIONS.md`, `docs/02.GLOSSARY.md`).
- **Iterate**: If Claude identifies valid issues (e.g. edge cases, unhandled promises, type mismatches), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved.
