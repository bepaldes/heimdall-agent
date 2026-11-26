# Plan: Cross-Harness Persona, Skill & Plan Enforcement

**Date:** 2026-11-25  
**Status:** COMPLETED (2026-11-25)  
**Author:** Gemini 4 Hydrogen  
**Scope:** `playbooks/05-canonical-plan-template.md`, `agents/orchestrator.md`, `agents/reviewer.md`, `doctrine/AGENTS.md`, `hooks/heimdall-hook.cjs`, `test/plan-integrity.test.mjs`, `test/hook-sentinel.test.mjs`

---

## 1. Active Skills & Directives Checklist
- [x] `grill-me` — Design tree interviewed and settled (multi-layer enforcement, Option 1 hooks + `reviewer.md` gate, all 10 personas + sentinel)
- [x] `karpathy-guidelines` — Surgical updates to existing template, doctrine, and hook files
- [x] `communication-doctrine` — BLUF macro layout, STE imperative steps (<=20 words), zero vague qualifiers
- [x] `antislop` — Concise rules, zero boilerplate
- [x] `test-driven-development` — Failing hook and integrity sentinel tests first
- [x] `verification-before-completion` — Non-interactive terminating checks (`npm test`, `node setup.mjs sync --dry-run`)

---

## 2. Context & Settled Design Decisions
- **Cross-Harness Reach:** `doctrine/AGENTS.md` and `playbooks/05-canonical-plan-template.md` govern `claude`, `agy` (Antigravity), and `codex`; `hooks/heimdall-hook.cjs` enforces runtime gates in Claude Code.
- **Canonical Plan Matrix:** Add `Heimdall Agent Persona` and `Required Skills (SKILL.md)` columns to Section 3 of `playbooks/05-canonical-plan-template.md`.
- **Goldfish Review Gate:** Mandate `reviewer.md` / `code-sentinel.md` (and `security-auditor.md` for auth/visibility) in Section 5 + add a `Persona & Skill Compliance` gate in `agents/reviewer.md`.
- **Orchestrator Dispatch:** List all 10 personas in `agents/orchestrator.md` (including `cloud-engineer`, `modernizer`, `orchestrator`) and require loading `~/.<harness>/agents/<persona>.md` + injecting `SKILL.md` paths before dispatch.
- **Runtime Hooks:** Add `/plan` / `/orchestrate` prompt reminder in `user-prompt` and `docs/designs/*.md` schema lint in `pre-write` inside `hooks/heimdall-hook.cjs`.

---

## 3. Multi-Agent Orchestration & Model Allocation Matrix

| Task ID | Phase & Task Description | Heimdall Agent Persona | Required Skills (`SKILL.md`) | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Update `05-canonical-plan-template.md`, `orchestrator.md`, `reviewer.md`, `AGENTS.md` | `orchestrator` | `writing-plans`, `communication-doctrine`, `karpathy-guidelines` | `claude-fable-5.2` | `high` | Cross-document invariant alignment across 4 core files | `gemini-4-hydrogen` |
| T2 | Phase 2: Add `/plan` reminder (`user-prompt`) & `docs/designs/*.md` lint (`pre-write`) in `heimdall-hook.cjs` | `code-sentinel` | `karpathy-guidelines`, `test-driven-development` | `claude-fable-5.2` | `medium` | Bounded Node.js CJS hook extension | `gemini-3.8-flash` |
| T3 | Phase 3: Add `test/plan-integrity.test.mjs` & hook tests in `test/hook-sentinel.test.mjs` | `tester` | `test-driven-development`, `verification-before-completion` | `gemini-3.8-flash` | `medium` | Deterministic sentinel and stdin/stdout hook assertions | `claude-fable-5.2` |
| T4 | Phase 4: Sync harnesses (`node setup.mjs sync`) & run `npm test` | `orchestrator` | `verification-before-completion` | `gemini-3.8-flash` | `low` | Terminating sync & full test verification | N/A |

---

## 4. Multi-Phase Implementation Plan

### Phase 1: Canonical Template, Orchestrator, Reviewer & Doctrine Alignment (T1)
- **Step 1.1:** Edit `playbooks/05-canonical-plan-template.md` Section 3 to add `Heimdall Agent Persona` and `Required Skills (SKILL.md)` columns.
- **Step 1.2:** Edit `playbooks/05-canonical-plan-template.md` Section 5 to require `reviewer.md`, `code-sentinel.md`, and `security-auditor.md` skill verification.
- **Step 1.3:** Edit `agents/orchestrator.md` Section 7 to list all 10 personas and mandate loading `<harness>/agents/<persona>.md` plus `SKILL.md` paths.
- **Step 1.4:** Edit `agents/reviewer.md` to add a mandatory `Persona & Skill Compliance` review gate.
- **Step 1.5:** Edit `doctrine/AGENTS.md` `<subagent_execution_contract>` and `<planning_protocol>` to enforce persona and `SKILL.md` path injection across all harnesses.

### Phase 2: Hook Runtime Enforcement (T2)
- **Step 2.1:** Edit `hooks/heimdall-hook.cjs` `user-prompt` handler to inject `[Heimdall Plan Gate]` when prompt contains `/plan` or `/orchestrate`.
- **Step 2.2:** Edit `hooks/heimdall-hook.cjs` `pre-write` handler to warn on stderr when `docs/designs/*.md` omits `Heimdall Agent Persona` or `Required Skills`.

### Phase 3: Test Sentinels & Hook Verification (T3)
- **Step 3.1:** Create `test/plan-integrity.test.mjs` asserting `05-canonical-plan-template.md`, `orchestrator.md`, `reviewer.md`, and `doctrine/AGENTS.md` include all 10 personas and required columns.
- **Step 3.2:** Add `/plan` `user-prompt` and `docs/designs/*.md` `pre-write` assertions to `test/hook-sentinel.test.mjs`.

### Phase 4: Sync & Regression Verification (T4)
- **Step 4.1:** Run `npm test` and verify all existing (118) + new tests pass.
- **Step 4.2:** Run `node setup.mjs sync` (if approved) or `node setup.mjs sync --dry-run` to align `~/.claude/`, `~/.gemini/`, `~/.codex/`, and `C:\Apps\AGENTS.md`.

---

## 5. Symmetric Cross-Family Validation Loop
- **Branch A (In Herdr, `HERDR_ENV=1`):** Open side panel (`herdr pane split --direction right --no-focus`), run `reviewer.md` + `code-sentinel.md` against git diff and task `Required Skills (SKILL.md)`, close panel upon completion.
- **Branch B (Standalone Harness):** Dispatch stateless Goldfish subagent adopting `agents/reviewer.md` with diff, test output, and required `SKILL.md` list only.

---

## 6. Orchestrator Heartbeat
- Run `npm test` after Phase 2 and Phase 3 before proceeding to sync.

---

## 7. Verification Harness
- **Strict Zero Dev-Server Policy:** No dev servers launched; terminating commands only.
- **Primary Gates:**
  1. `npm test` — All tests (118+ existing + new sentinels) pass.
  2. `node setup.mjs sync --dry-run` — Completes with exit code 0.
