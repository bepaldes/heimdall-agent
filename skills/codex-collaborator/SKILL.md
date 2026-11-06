---
name: codex-collaborator
description: >
  Coordinate with OpenAI Codex CLI (codex.exe) via Herdr to cross-validate changes, request second-opinion
  adversarial reviews on git diffs, or validate test and build executions.
upstream: https://github.com/bepaldes/heimdall-agent
version: 1.0.0
---

# Codex Collaborator Skill

This skill enables Google Antigravity and Claude Code to orchestrate tasks with OpenAI Codex CLI (`codex.exe`) directly through native Herdr multiplexing, delegating complex architectural reasoning, diff reviews, and adversarial validation.

## When to Activate

- When the user asks to "review with Codex", "validate with Astra", or "get a second opinion from Codex".
- In multi-agent plans requiring tri-directional cross-model validation (Claude $\rightarrow$ Codex, or Gemini $\rightarrow$ Codex).
- When validating complex TypeScript types, database migrations, or edge-case logic with an alternative reasoning perspective.

## Orchestration Method: Native Herdr Agent (`herdr` skill)

When running inside Herdr (`$env:HERDR_ENV = "1"`), communicate directly using Herdr's native agent orchestration. This maintains a persistent session across turns, preserves context, respects interactive approvals (`blocked`), and handles bracketed paste:

### 1. Fast Path: Re-use Active Idle Agent
Before splitting a pane, check if a Codex agent is already running and idle:
```bash
herdr agent list
```
If an agent named `codex-reviewer` or `codex` is idle or done, prompt it directly:
```bash
herdr agent prompt codex-reviewer "Review the latest changes." --wait --timeout 120000
```

### 2. Spawning a New Codex Agent (Single-Execution Batch)
If no active Codex agent exists, batch pane creation and agent startup in a single command:
```bash
PANE_ID=$(herdr pane split --current --direction right --cwd "$PWD" --no-focus | jq -r '.result.pane.pane_id')
herdr agent start codex-reviewer --kind codex --pane "$PANE_ID"
herdr agent prompt codex-reviewer "Review git diff for security regressions and boundary conditions." --wait --timeout 120000
```

### 3. Read Findings into Context
```bash
herdr agent read codex-reviewer --source recent-unwrapped --lines 120
```

### 4. Interactive Collaboration
When an interactive session or clarification is needed, send keys or prompt interactively:
```bash
herdr agent send-keys codex-reviewer enter
```

## Guidelines for Collaborating Agents

- **Synthesize, Don't Blindly Echo**: When Codex returns feedback, analyze its critiques against the project's requirements and design system.
- **Iterate**: If Codex identifies valid issues (e.g. boundary exceptions, unhandled race conditions), implement the fixes and run the validation again.
- **Report**: Present the consensus to the user with clear notes on what was improved.

---

## Upstream Provenance & Governance Protocol

- **Source Repository**: [bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Update Directive**:
  > *Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report.*
