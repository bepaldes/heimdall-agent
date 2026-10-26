---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch a code reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history.

**Core principle:** Review early, review often. Enforce the **Google Elephant-Goldfish Model (EGM)**: the reviewer operates as an isolated, stateless **Goldfish** that evaluates raw code artifacts without being polluted by author debates or conversational rationalizations.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## Two-Tier Review Trigger

- **Tier 1 (Bounded & Routine Tasks)**: Single-pass adversarial critique targeting edge cases, type safety, missing tests, and anti-slop hygiene.
- **Tier 2 (Architectural & High-Stakes Tasks)**: Mandatory **5-round convergence loop** with a structured findings ledger.

## Adaptive Execution Ladder (Cross-Model Bridge vs. Same-Model Fallback)

When dispatching the Goldfish reviewer:
1. **Check for Multi-Model Bridges**:
   Inspect if shared bridges exist in `C:\Apps\tools\` or PATH:
   - For Claude sessions: check for `gemini-bridge.ps1` or `codex-bridge.ps1`.
   - For Gemini sessions: check for `claude-bridge.ps1` or `codex-bridge.ps1`.
   - For Codex sessions: check for `claude-bridge.ps1` or `gemini-bridge.ps1`.
2. **If Bridge & API Credentials Present**:
   Execute the cross-model validator:
   ```powershell
   powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"
   ```
3. **If Bridges Absent (Graceful Fallback)**:
   Spawn a fresh child subagent on the **same model / native harness** (e.g., `invoke_subagent` in Antigravity, Agent tool in Claude Code) with zero parent conversation context. The stateless Goldfish discipline is strictly preserved.

## How to Request (The Blinded Packet Builder)

**1. Get git SHAs and Diff:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or: git merge-base origin/main HEAD
HEAD_SHA=$(git rev-parse HEAD)
git diff $BASE_SHA..$HEAD_SHA
```

**2. Assemble the Blinded Packet:**
- Strip conversational history, justifications, and author debates.
- Hand the reviewer ONLY:
  - `{DESCRIPTION}`: Brief, objective summary of the change.
  - `{PLAN_OR_REQUIREMENTS}`: Explicit acceptance criteria.
  - `{DIFF}`: Raw git diff and touched source files.

**3. Dispatch code reviewer subagent:**

Dispatch a `general-purpose` or `reviewer` subagent, filling the template at [code-reviewer.md](code-reviewer.md).

**Placeholders:**
- `{DESCRIPTION}` - Brief summary of what you built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit

**4. Act on feedback:**
- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch code reviewer subagent]
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'll just review the diff myself instead of dispatching a reviewer" | You're the coordinator — reviewing the diff inline burns the context window you need to keep driving the work. Dispatch a reviewer subagent: the diff and the evaluation live in its context, and only the findings come back to you. |
| "The reviewer needs my whole session history to understand the change" | Hand it precisely crafted context, never your session's history. That keeps the reviewer on the work product, not your thought process. |

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: [code-reviewer.md](code-reviewer.md)
