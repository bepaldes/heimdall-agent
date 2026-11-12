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
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Scaffolding | claude-sonnet-5 | high | Schema & component structure | Gemini 3.8 Flash (`herdr agent prompt gemini-reviewer`) |
| T2 | Phase 2: Implementation | claude-sonnet-5 | high | Core business logic & UI | Gemini 3.8 Flash (`herdr agent prompt gemini-reviewer`) |
| T3 | Phase 3: Playwright E2E | claude-sonnet-5 | high | Full user journey verification | Gemini 3.8 Flash (`herdr agent prompt gemini-reviewer`) |

## 4. Multi-Phase Implementation Plan
### Phase 1: Architecture & Scaffolding
### Phase 2: Core Implementation
### Phase 3: Integration & Playwright E2E Verification
### Phase 4: Review, Purge & Handoff

## 5. Symmetric & Tri-Directional Cross-Model Validation Loop
- In Herdr (`HERDR_ENV=1`), validate tasks directly via peer agent prompts:
  - Tasks executed by Claude -> Validate with Gemini or Codex:
    `herdr agent prompt gemini-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000`
    `herdr agent prompt codex-reviewer "Review git diff for security regressions and boundary conditions." --wait --timeout 120000`
  - Tasks executed by Gemini -> Validate with Claude or Codex:
    `herdr agent prompt claude-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000`
    `herdr agent prompt codex-reviewer "Review git diff for security regressions and boundary conditions." --wait --timeout 120000`
  - Tasks executed by Codex -> Validate with Claude or Gemini:
    `herdr agent prompt claude-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000`
    `herdr agent prompt gemini-reviewer "Review git diff for security regressions and type errors." --wait --timeout 120000`

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
   - Defines validation commands using native Herdr agent commands.
   - Claude tasks validated by Gemini/Codex; Gemini tasks validated by Claude/Codex; Codex tasks validated by Claude/Gemini.
6. **Section 6: Orchestrator Heartbeat**:
   - Cadence for monitoring task progress, status checks, and liveness during subagent runs.
7. **Section 7: Verification Harness**:
   - Zero Dev-Server policy: No agent may start background or dev servers (`npm run dev`, `vite`, `next dev`).
   - Primary verification standard is full Playwright E2E with real DOM state and non-zero bounding box assertions against pre-existing servers or static builds.
   - Enforces the strict ban on pseudo-verification (`curl`, `grep`, `tsc --noEmit` alone, container status).
   - Mandates browser verification for backend changes with UI impact.

### Effort Constraint Rules
- Every task must explicitly declare one of the registered models and an allowed effort level (`low`, `medium`, `high`, `xhigh`) defined in `playbooks/06-model-registry-matrix.md`.
- Tasks requiring deep architectural reasoning, type safety, or complex algorithms must use `high` or `xhigh`.
- Fast scans, boilerplate scaffolding, or rapid audits may use `low` or `medium`.
- When Gemini 4 Argon reaches quota cooldown, immediately fallback to Gemini 3.8 Flash, Gemini 3.1 Pro, or GhostCLI (Claude Sonnet 5 / GPT-6 Astra).
