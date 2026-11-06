# Design Record: Native Herdr Multi-Agent Orchestration & Performance Synthesis

**Date:** 2026-11-06  
**Status:** IMPLEMENTED & VERIFIED  
**Author:** Antigravity Orchestrator  
**Upstream Integration:** Herdr CLI (`herdr.exe` v0.9.5+)

---

## 1. Executive Summary & BLUF

Historically, Heimdall relied on custom PowerShell bridge scripts (`claude-bridge.ps1`, `codex-bridge.ps1`, `gemini-bridge.ps1`) to spawn panes, parse diffs, and invoke secondary models with batch flags (`-p`). While effective outside multiplexers, this approach suffered from:
1. **Cold-boot latency**: Each invocation incurred 20–30s of initialization, shell bootstrapping, and authentication checks.
2. **Ephemeral loss of context**: Panes auto-closed immediately upon command completion, preventing persistent multi-turn follow-ups.
3. **Approval blindness**: Headless scripts could not handle interactive questions or tool approvals (`blocked` states).

Herdr natively includes first-class agent orchestration primitives (`herdr agent start`, `prompt`, `read`, `wait`, `send-keys`) and an integrated `herdr` skill. This design standardizes direct Herdr agent multiplexing as the primary multi-model communication protocol across Heimdall, while preserving `*-bridge.ps1` as a secondary fallback for headless CI and non-Herdr environments.

---

## 2. Benchmark Findings & Optimization Rules

During live multi-agent verification (`claude` and `codex` invoked from `antigravity`), sequential tool turns resulted in ~60s total latency. Analysis revealed two root causes:
1. **Sequential Discovery Overhead**: Splitting panes, checking shell readiness, starting agents, and issuing prompts across separate conversation turns multiplied network and thinking round-trips.
2. **Model Tier Latency**: Invoking `claude-opus-5-5` with max effort for sanity checks introduced 3+ minutes of deliberation plus upstream API retries, whereas `gpt-6-astra` responded in 14 seconds.

### The 3 Optimization Rules Embedded in `skills/herdr/SKILL.md`:
1. **Hot-Agent Re-use**: Inspect `herdr agent list` before spawning new panes. Re-use existing live idle agents with zero startup penalty.
2. **Batched Execution**: Combine layout creation (`herdr pane split`), agent startup (`herdr agent start`), and initial prompt (`herdr agent prompt`) into a single PowerShell / bash command block.
3. **Speed-Tier Model Selection**: Pass fast model tiers (e.g. `--model claude-sonnet-5`) after `--` for validation and review turns, reserving Opus 5.5 for deep architectural planning.

---

## 3. Changes Applied

1. **Installed Skill**: [`skills/herdr/SKILL.md`](../../skills/herdr/SKILL.md) exported directly from `herdr --skill` and enriched with batching/speed standards.
2. **Catalog Registration**: Added `herdr` to `config/skills.json` under `suites` and `skills` (54 modular skills, 22 toolkits).
3. **Collaborator Skills**: Updated `claude-collaborator`, `gemini-collaborator`, and `codex-collaborator` to lead with native `herdr agent` commands.
4. **Agent Personas & Playbooks**:
   - `agents/orchestrator.md`: Added `herdr` skill and updated Directive 5.
   - `playbooks/03-adversarial-code-review.md`: Documented Herdr primary route for Goldfish code review.
   - `playbooks/05-canonical-plan-template.md`: Documented native Herdr cross-validation prompts.
   - `playbooks/06-model-registry-matrix.md`: Clarified Herdr multiplexing vs GhostCLI gateway.
5. **Ecosystem Sync**: Synchronized across `~/.claude/`, `~/.gemini/`, `~/.codex/`, `~/.agents/`, and `~/.hermes/`.
6. **Test Verification**: Terminating test suite executed via `npm test` passing 32/32 tests.
