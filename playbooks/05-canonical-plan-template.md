# Playbook 05: Canonical 7-Section Plan Template

> **For Desktop & Web AI**: Use this authoritative schema whenever generating implementation plans (`/plan`, plan mode, or architectural prompts). Generic, simplified, or abbreviated templates are strictly forbidden.

---

````markdown
# Plan: [Feature / Task Name]

## 1. Active Skills & Directives Checklist
- [x] `brainstorming` — Intent discovered, assumptions surfaced, tradeoffs evaluated
- [x] `karpathy-guidelines` — Simplicity first, surgical edits, no speculative bloat
- [x] `antislop` — Clean comments, no AI boilerplate, accessible contrast
- [x] `taste-skill` — [Required for UI / Features] Design Read declared, design system tokens enforced

## 2. Context & Design Read (Required for UI / Features)
- **Design Read**: Reading this as: <page kind> for <audience>, with <vibe>, leaning toward <design system / tokens>.
- **Design System Tokens**: Explicit mapping to workspace tokens (e.g. `--bg`, `--panel`, `--line`, `--accent`, `--text`).
- **Anti-Default Discipline**: Specific AI tropes explicitly rejected for this surface.

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Scaffolding | claude-sonnet-5 | high | Schema & component structure | Gemini 3.8 Flash (`gemini-bridge review`) |
| T2 | Phase 2: Implementation | claude-sonnet-5 | high | Core business logic & UI | Gemini 3.8 Flash (`gemini-bridge review`) |
| T3 | Phase 3: Playwright E2E | claude-sonnet-5 | high | Full user journey verification | Gemini 3.8 Flash (`gemini-bridge review`) |

## 4. Multi-Phase Implementation Plan
### Phase 1: Architecture & Scaffolding
### Phase 2: Core Implementation
### Phase 3: Integration & Playwright E2E Verification
### Phase 4: Review, Purge & Handoff

## 5. Symmetric & Tri-Directional Cross-Model Validation Loop
- Tasks executed by Claude -> Validate with Gemini or Codex:
  `powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`
  `powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`
- Tasks executed by Gemini -> Validate with Claude or Codex:
  `powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"`
  `powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`
- Tasks executed by Codex -> Validate with Claude or Gemini:
  `powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"`
  `powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`

## 6. Orchestrator Heartbeat
- Orchestrator monitors progress every 3 minutes.

## 7. Verification Harness
- **Playwright E2E Primary Gate**: Real browser execution (DOM state, visibility assertions, non-zero bounding box checks).
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
   - Baseline minimum: `brainstorming`, `karpathy-guidelines`, `antislop`.
   - Any UI, styling, or frontend surface requires `taste-skill`.
2. **Section 2: Context & Design Read**:
   - Required for any user-facing feature or UI change.
   - Must declare page kind, target audience, aesthetic vibe, and exact design token mappings.
   - Must state specific anti-default rejections (e.g., no centered dark mesh heroes, no generic card layouts).
3. **Section 3: Model Allocation Matrix**:
   - Decomposes plan into discrete tasks with explicit task IDs.
   - Each task assigns a canonical model and effort level from [`playbooks/06-model-registry-matrix.md`](file:///C:/Apps/heimdall-agent/playbooks/06-model-registry-matrix.md).
   - Declares the cross-reviewer harness and bridge execution command.
4. **Section 4: Multi-Phase Implementation Plan**:
   - Organized into logical progression (Scaffolding -> Core Implementation -> E2E Verification -> Review/Handoff).
   - Strict TDD: failing test first, minimal code, passing test, self-review.
5. **Section 5: Symmetric & Tri-Directional Cross-Model Validation Loop**:
   - Defines validation commands using shared bridge scripts in `C:\Apps\tools\`.
   - Claude tasks validated by Gemini/Codex; Gemini tasks validated by Claude/Codex; Codex tasks validated by Claude/Gemini.
6. **Section 6: Orchestrator Heartbeat**:
   - Cadence for monitoring task progress, status checks, and liveness during subagent runs.
7. **Section 7: Verification Harness**:
   - Primary verification standard is full Playwright E2E with real DOM state and non-zero bounding box assertions.
   - Enforces the strict ban on pseudo-verification (`curl`, `grep`, `tsc --noEmit`, container status).
   - Mandates browser verification for backend changes with UI impact.

### Effort Constraint Rules
- Every task must explicitly declare one of the registered models and an allowed effort level (`low`, `medium`, `high`, `xhigh`) defined in `playbooks/06-model-registry-matrix.md`.
- Tasks requiring deep architectural reasoning, type safety, or complex algorithms must use `high` or `xhigh`.
- Fast scans, boilerplate scaffolding, or rapid audits may use `low` or `medium`.
- When Gemini 4 Argon reaches quota cooldown, immediately fallback to Gemini 3.8 Flash, Gemini 3.1 Pro, or GhostCLI (Claude Sonnet 5 / GPT-6 Astra).
