# Heimdall AI-Assisted Installer

Use this file when a user asks you to install `heimdall-agent` via a single prompt (for example: `Read https://raw.githubusercontent.com/bepaldes/heimdall-agent/main/INSTALL.md and install Heimdall for me.`).

## Rules for the Installing AI
- **Do NOT hand-edit** `~/.claude/`, `~/.gemini/`, `~/.codex/`, `~/.hermes/`, `~/.openclaw/`, or MCP configs manually. Always delegate filesystem linking, hook registration, and MCP resolution to `node setup.mjs`.
- **Ask for explicit consent** before cloning or modifying anything on the user's machine.
- **Keep every step deterministic** by running the exact CLI commands below.

## Step 1: Consent & Clone
1. Tell the user what Heimdall will touch:
   - Clones `https://github.com/bepaldes/heimdall-agent.git` (if not already inside the repo).
   - Links `skills/`, `agents/`, `playbooks/`, and `doctrine/AGENTS.md` into detected AI harnesses (`~/.claude`, `~/.gemini`, `~/.codex`, `~/.hermes`, `~/.openclaw`).
   - Registers lifecycle hooks (`hooks/heimdall-hook.cjs`) and resolves MCP server configs (`config/mcp.template.json`).
2. Ask the user for confirmation to proceed and where to clone if not already inside `heimdall-agent`.
3. Verify Node.js `>= 18.0.0` (`node -v`). If missing, stop and ask the user to install Node 18+.
4. If not already in the `heimdall-agent` directory, run:
   ```bash
   git clone https://github.com/bepaldes/heimdall-agent.git
   cd heimdall-agent
   ```

## Step 2: Detect Installed Harnesses
Run the non-destructive audit:
```bash
node setup.mjs --audit
```
Show the user which AI harnesses were detected.

## Step 3: Select Profile
Ask the user which skill profile to install:
- **`full`** *(Default)* — Complete suite (`skills`, all 10 agents). Best for everyday engineering.
- **`minimal`** — Core 16+ skills & 4 agents (`orchestrator`, `tester`, `code-sentinel`, `reviewer`). Best for smaller context windows.
- **`security`** — AppSec & pentesting suite (`security-auditor`, OWASP, Snyk, Trail of Bits).
- **`design`** — Frontend & mobile design suite (`frontend-designer`, `mobile-designer`, `taste-skill`, `antislop-ui`).

## Step 4: Execute Deterministic Setup
Run `setup.mjs` with the user's chosen profile:
```bash
node setup.mjs --profile <chosen_profile> --link --clean --yes
```
*(If the user prefers copies instead of symlinks/junctions, replace `--link` with `--no-link`.)*

## Step 5: Verify Health (`doctor`)
Run the post-install healthcheck:
```bash
node setup.mjs doctor
```
Report the pass/warn/fail summary to the user. If any check fails, surface the exact failing check and remediation command.

## Step 6: Optional Workspace Onboarding
Ask the user if they want to run `/onboard` in their target project repository to generate `.heimdall/workspace.md` (stack, test runner, lint/build commands, deploy target).
