# Playbook 05: Canonical 7-Section Plan Template

> **For Desktop & Web AI**: Use this authoritative schema whenever generating implementation plans (`/plan`, plan mode, or architectural prompts). Generic, simplified, or abbreviated templates are strictly forbidden.

## Mandatory Plan Storage & Archiving Lifecycle
1. **Creation Path & Naming**:
   - All plans MUST be written directly to disk under the `docs/designs/` directory.
   - The file name MUST strictly follow the format: `YYYY-MM-DD <plan name>.md` (e.g. `docs/designs/2026-10-31 user-authentication-flow.md`).
2. **Archiving Upon Completion**:
   - Once all phases of the plan have finished, tests have passed, and functionality is confirmed working, the plan file MUST be moved into:
     `docs/designs/old/YYYY-MM-DD <plan name>.md`
   - Active plans remain in `docs/designs/`; only finalized, delivered work is archived to `docs/designs/old/`.

---

````markdown
# Plan: [Feature / Task Name]

## 1. Active Skills & Directives Checklist
- [x] `grill-me` / `brainstorming` — Intent discovered via Frontier questioning, assumptions surfaced, tradeoffs evaluated
- [x] `domain-modeling` — [Required for Tier 3] Architectural decisions recorded in `docs/adr/`, domain terms aligned
- [x] `codebase-design` — Deep module boundaries established, pass-through layers rejected, deletion test applied
- [x] `karpathy-guidelines` — Simplicity first, surgical edits, no speculative bloat
- [x] `antislop` — Clean comments, no AI boilerplate, accessible contrast
- [x] `communication-doctrine` — BLUF macro layout, STE imperative steps (<=20 words), zero vague qualifiers
- [x] `taste-skill` — [Required for UI / Features] Design Read declared, design system tokens enforced

## 2. Context & Design Read (Required for UI / Features)
- **Design Read**: Reading this as: <page kind> for <audience>, with <vibe>, leaning toward <design system / tokens>.
- **Design System Tokens**: Explicit mapping to workspace tokens (e.g. `--bg`, `--panel`, `--line`, `--accent`, `--text`).
- **Anti-Default Discipline**: Specific AI tropes explicitly rejected for this surface.

## 3. Multi-Agent Orchestration & Model Allocation Matrix

> **Model Tier Policy**:
> - **Quota-Limited Flagships** (`gemini-4-argon`, `gemini-4-neon`): High-end models with strict quota limits. Reserve for specialized architecture, complex synthesis, and critical final reviews.
> - **Unlimited Workhorses** (`claude-opus-5-5`, `claude-fable-5.2`, `gpt-6-astra` / Codex, `claude-sonnet-5-5`): No Antigravity quota cooldowns. Use as default workhorses for core implementation, migrations, and heavy execution.
> - **Mid-Tier Reviewer** (`gemini-4-hydrogen`): Stronger reasoning than Flash with lower quota pressure than Argon/Neon. Default for cross-family code reviews and balanced verification.
> - **Fast Utility** (`gemini-3.8-flash`, `z-ai/glm-5.3-flash`, `deepseek-ai/DeepSeek-V4.1-Flash-1017`): Rapid scans, boilerplate scaffolding, and quick utility checks.

| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Architecture & Schema | `gemini-4-argon` | `high` | Quota-limited flagship reserved for specialized domain & boundary design | `claude-opus-5-5` (`herdr agent prompt claude-reviewer`) |
| T2 | Phase 2: Core Implementation | `claude-opus-5-5` | `high` | Unlimited workhorse for multi-file implementation & business logic | `gemini-4-hydrogen` (`herdr agent prompt agy-reviewer`) |
| T3 | Phase 3: Test Scaffolding & Lint | `gemini-3.8-flash` | `medium` | Fast utility for rapid test boilerplate and static checks | `gpt-6-astra` (`herdr agent prompt codex-reviewer`) |
| T4 | Phase 4: Playwright E2E & Audit | `gpt-6-astra` | `high` | Unlimited Codex workhorse for full browser verification & final audit | `gemini-4-hydrogen` (`herdr agent prompt agy-reviewer`) |

## 4. Multi-Phase Implementation Plan
### Phase 1: Architecture & Scaffolding
### Phase 2: Core Implementation
### Phase 3: Integration & Playwright E2E Verification
### Phase 4: Review, Purge & Handoff

## 5. Symmetric Cross-Family Validation Loop
- **Runtime Harness & Environment Detection**:
  - Detect if running inside Herdr / Herdr-App (`$env:HERDR_ENV = "1"` or `$env:HC_TERMINAL_ID` present).
- **Branch A: In Herdr / Herdr-App (Visual Ephemeral Side Panel)**:
  - Open side panel: `herdr-app do pane.split --direction right --argv '["<cross-family-reviewer>"]' --task "Review Task N"` (or `herdr pane split --current --direction right --cwd "$pwd" --no-focus`).
  - Execute adversarial review in the visible side panel across distinct model families (e.g., Anthropic ↔ Google ↔ OpenAI/Codex ↔ Zhipu/GLM ↔ Tencent/Hunyuan ↔ Xiaomi/MiMo) selected from `config/models.json` / `playbooks/06-model-registry-matrix.md`.
  - Await verdict: `herdr agent prompt <cross-family-reviewer> "Review git diff for security regressions, boundary conditions, and type errors." --wait --timeout 120000`.
  - Ingest findings report and triage ledger.
  - Close side panel upon completion: `herdr-app do pane.close --pane <id>` (or `herdr pane close <id>`) to keep workspace clean.
  - *Background Mode*: If background execution is requested, omit `--wait` and `pane close` to allow live asynchronous observation in Herdr-App.
- **Branch B: In Standalone Harnesses (Antigravity IDE, Claude Code CLI, Codex CLI, VS Code Copilot)**:
  - Do NOT call Herdr commands. Dispatch review via harness native subagent / task:
    - In Antigravity: `invoke_subagent` (stateless goldfish review subagent).
    - In Claude Code: `Agent` tool (`subagent` with prompt and isolated scratchpad).
    - In Codex CLI: child subagent.
  - Maintain zero parent conversation context (Stateless Goldfish invariant).
  - Ingest review findings directly back into the main session thread.

## 6. Orchestrator Heartbeat
- Orchestrator monitors progress every 3 minutes.

## 7. Verification Harness
- **Strict Zero Dev-Server Policy**: NEVER include steps to run or launch dev servers (`npm run dev`, `vite`, `next dev`, etc.). All agent verification must be non-interactive and terminating (`npm test`, `npm run build`, `vitest run`, `lint`, `typecheck`).
- **Playwright E2E Primary Gate**: Real browser execution (DOM state, visibility assertions, non-zero bounding box checks) strictly against pre-existing human-managed servers or static build artifacts. Agents do NOT spin up servers.
- **Backend-with-UI-Impact Rule**: Backend tasks affecting user views must include browser verification.
- **Rejection of Pseudo-Verification**: No task sign-off on `tsc`, `curl`, `grep`, or container health alone.
- **Environment Detection**: Confirm Playwright presence; if absent, ask user during planning for preferred setup.
- Local workspace verification gates (`pnpm test`, `pnpm boundaries`).
````

---

## Required Section Contents & Effort Rules

### Section Requirements
1. **Section 1: Active Skills & Directives Checklist**:
   - Must explicitly list all active skills governing execution.
   - Baseline minimum: `brainstorming`, `karpathy-guidelines`, `antislop`, `communication-doctrine`.
   - Any UI, styling, or frontend surface requires `taste-skill`.
2. **Section 2: Context & Design Read**:
   - Required for any user-facing feature or UI change.
   - Must declare page kind, target audience, aesthetic vibe, and exact design token mappings.
   - Must state specific anti-default rejections (e.g., no centered dark mesh heroes, no generic card layouts).
3. **Section 3: Model Allocation Matrix**:
   - Decomposes plan into discrete tasks with explicit task IDs.
   - Each task assigns a canonical model and effort level from [`playbooks/06-model-registry-matrix.md`](file:///C:/Apps/heimdall-agent/playbooks/06-model-registry-matrix.md).
   - Declares the cross-reviewer harness and Herdr prompt command.
4. **Section 4: Multi-Phase Implementation Plan**:
   - Organized into logical progression (Scaffolding -> Core Implementation -> E2E Verification -> Review/Handoff).
   - Strict TDD: failing test first, minimal code, passing test, self-review.
   - Strict STE Step Granularity: Every step begins with an approved imperative verb (`Create`, `Modify`, `Assert`, `Verify`, `Delete`, `Run`), contains <= 20 words, and contains zero banned vague qualifiers (`ensure`, `properly`, `appropriately`, `as needed`).
5. **Section 5: Symmetric & Tri-Directional Cross-Model Validation Loop**:
   - Defines validation commands with adaptive runtime branching.
   - In Herdr / Herdr-App: Fires ephemeral visual side panel (`herdr-app do pane.split`), runs cross-family reviewer, auto-closes panel upon completion, or runs in background.
   - In Standalone Harnesses (Antigravity, Claude Code, Codex, VS Code): Fires stateless child subagent / task via harness native tool (`invoke_subagent`, `Agent` tool, or child process).
6. **Section 6: Orchestrator Heartbeat**:
   - Cadence for monitoring task progress, status checks, and liveness during subagent runs.
7. **Section 7: Verification Harness**:
   - Zero Dev-Server policy: No agent may start background or dev servers (`npm run dev`, `vite`, `next dev`).
   - Primary verification standard is full Playwright E2E with real DOM state and non-zero bounding box assertions against pre-existing servers or static builds.
   - Enforces the strict ban on pseudo-verification (`curl`, `grep`, `tsc --noEmit` alone, container status).
   - Mandates browser verification for backend changes with UI impact.

### Effort Constraint & Tier Rules
- Every task must explicitly declare one of the registered models, an allowed effort level (`low`, `medium`, `high`, `xhigh`), and a **Selection Rationale** column explaining why that tier fits the task.
- Avoid uniform model assignments across all rows; match each task to its tier (`Quota-Limited Flagship`, `Unlimited Workhorse`, `Mid-Tier Reviewer`, or `Fast Utility`).
- Tasks requiring deep architectural reasoning, type safety, or complex algorithms must use `high` or `xhigh`.
- Fast scans, boilerplate scaffolding, or rapid audits may use `low` or `medium`.
- When Gemini 4 Argon or Neon reaches quota cooldown, fallback in order: `Gemini 4 Hydrogen` → `Gemini 3.8 Flash` → GhostCLI unlimited workhorses (`Claude Opus 5.5` / `GPT-6 Astra`).
