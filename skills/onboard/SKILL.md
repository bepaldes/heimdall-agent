---
name: onboard
description: Interview the user once per workspace to capture stack, test runner, lint/build commands, deploy target, and strictness preferences in .heimdall/workspace.md. Use when onboarding a new repository or when /onboard is invoked.
---

# Workspace Onboarding (`/onboard`)

Capture persistent project context in `.heimdall/workspace.md` so `/plan`, `/grill-me`, and subagents start with verified project defaults instead of re-asking recurring setup questions.

## Step 1: Fact-Find Before Asking
Inspect existing repository files before asking the user anything:
- Check `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `Dockerfile`, and `docker-compose.yml`.
- Check `.heimdall/workspace.md` if it already exists; if present, offer to update only changed fields.
- Never ask for information already explicitly declared in repository manifests.

## Step 2: 5-Point Workspace Interview
Ask only for missing or ambiguous items across these 5 fields:
1. **Primary Stack & Runtime**: Language, framework, and package manager.
2. **Test Command**: Non-interactive terminating test command (e.g., `npm test`, `pytest`, `cargo test`).
3. **Lint & Build Commands**: Static typecheck, linter, and production build commands.
4. **Deployment Target & Constraints**: Hosting environment, database, and zero-downtime or migration constraints.
5. **Heimdall Strictness (`ponytail`)**: Preferred diff/reply mode (`lite`, `full`, or `ultra`) and whether Playwright E2E is required.

## Step 3: Persist `.heimdall/workspace.md`
Write the confirmed answers to `.heimdall/workspace.md` in the workspace root using this exact schema:

```markdown
# Heimdall Workspace Profile

- **Stack**: <language / framework / package manager>
- **Test Command**: `<exact terminating command>`
- **Lint & Typecheck**: `<exact command>`
- **Build Command**: `<exact command>`
- **Deploy Target**: <hosting / database / key constraints>
- **Ponytail Mode**: <lite | full | ultra>
- **Playwright E2E**: <required | optional | not-applicable>
```

## Guardrails
- Never start a dev server during onboarding.
- Never invent commands that were not observed in manifests or confirmed by the user.
- Keep `.heimdall/workspace.md` under 30 lines so it loads with minimal token overhead.
