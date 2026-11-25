# Plan: Standardized Plan Lifecycle, Backlog Governance & Clean-Code Skill

## 1. Active Skills & Directives Checklist
- [x] `brainstorming` — Alternative 1 agreed: native markdown ledger, standardized plan pathing & archive, zero-dependency `clean-code` (`ub-mode`) skill
- [x] `karpathy-guidelines` — Surgical updates to playbooks, doctrine, and skill registries; no unnecessary bloat
- [x] `antislop` — Direct, clear technical phrasing with zero conversational fluff
- [x] `writing-plans` — Adhering to the canonical 7-section planning structure

## 2. Context & Design Read (Governance & Architecture)
- **Domain**: Engineering governance, plan lifecycle, backlog tracking, and software design quality standard.
- **Surface**: Markdown playbooks, cross-agent doctrine, central backlog ledger, and skill module.
- **Invariant Rules**:
  - All future plans must be authored in `docs/designs/YYYY-MM-DD <plan-name>.md`.
  - When verified and completed, plans must be archived into `docs/designs/old/`.
  - Backlog tracking follows 4 explicit flows: Bugfixes (fast-path), New Features (backlog intake), Change Request (CR) Analysis (evaluation & decision gate), and Rejection handling.
  - `clean-code` (`ub-mode`) ingested as a zero-dependency skill distilling Uncle Bob's TDD, laziness protocol, boundary discipline, and behavior-over-implementation rules.

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Plan Lifecycle & Doctrine Update | claude-sonnet-5 | high | Exact phrasing in AGENTS.md, Playbook 05, and writing-plans | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash"`) |
| T2 | Phase 2: Backlog & CR Flow Playbook + Ledger | claude-sonnet-5 | high | Codify 4 lifecycle flows in Playbook 08 & create docs/backlog.md | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash"`) |
| T3 | Phase 3: Clean-Code (`ub-mode`) Skill Authoring | claude-sonnet-5 | high | Author skills/clean-code/SKILL.md (with optional companion tools contract) & register in config/skills.json | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash"`) |
| T4 | Phase 4: Documentation Updates (README & SKILLS.md) | claude-sonnet-5 | medium | Update README.md, README.pt-BR.md, and docs/SKILLS.md with 52 skills, new playbook 08, plan lifecycle, and backlog flows | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash"`) |
| T5 | Phase 5: Sync & Ecosystem Verification | claude-sonnet-5 | medium | Run `node setup.mjs --link` to deploy to all tool harnesses and verify audit | Codex (`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra"`) |

## 4. Multi-Phase Implementation Plan

### Phase 1: Plan Storage, Naming & Archiving Standards
- **File updates**:
  - [`playbooks/05-canonical-plan-template.md`](file:///C:/Apps/heimdall-agent/playbooks/05-canonical-plan-template.md): Mandate plan file path format (`docs/designs/YYYY-MM-DD <plan-name>.md`) and completion archive step (move to `docs/designs/old/`).
  - [`skills/writing-plans/SKILL.md`](file:///C:/Apps/heimdall-agent/skills/writing-plans/SKILL.md): Update trigger instructions and target output locations to enforce `docs/designs/` and archiving.
  - [`doctrine/AGENTS.md`](file:///C:/Apps/heimdall-agent/doctrine/AGENTS.md): Update `<planning_protocol>` Turn 2 to explicitly cite the storage and archive requirement.

### Phase 2: Backlog Management & Change Request (CR) Governance
- **New Playbook**:
  - Create [`playbooks/08-backlog-and-change-request-flow.md`](file:///C:/Apps/heimdall-agent/playbooks/08-backlog-and-change-request-flow.md).
  - Codify the 4 explicit lifecycle paths:
    1. **Bugfixes (Fast Path)**: Report received -> Assess/Plan fix -> Implement with failing test first -> Test & verify -> Mark complete.
    2. **New Features (Intake)**: Log directly into backlog with context, motivation, and priority.
    3. **Change Request (CR) Analysis Gate**: Evaluate selected backlog items against architecture, blast radius, and dependencies. If approved -> generate formal Plan in `docs/designs/` -> implement -> verify -> archive plan.
    4. **Rejection Route**: If rejected during CR analysis, move back to backlog with explicit rejection rationale or delete.
- **Initial Ledger**:
  - Create [`docs/backlog.md`](file:///C:/Apps/heimdall-agent/docs/backlog.md) seeded with the standard schema and initial Heimdall roadmap items.

### Phase 3: Clean-Code (`ub-mode`) Skill Ingestion
- **New Skill**:
  - Create [`skills/clean-code/SKILL.md`](file:///C:/Apps/heimdall-agent/skills/clean-code/SKILL.md) with aliases (`clean-code`, `ub-mode`).
  - Incorporate Uncle Bob's core engineering tenets:
    - *First, Make it Work*: Laziness protocol (smallest edit that solves problem), Redesign from first principles, Subtract before adding, Illegal states unrepresentable, Idempotent operations.
    - *Then, Make it Right*: Root-cause fixes over band-aids, Testing behavior rather than implementation, Mathematical complexity bounds (CRAP < 10, DRY similarity < 0.8, Mutation testing awareness).
    - *Companion Tools Contract*: Explicitly define how companion CLI tools (`unclebob/crapper`, `unclebob/dryer`, `unclebob/mutator`) are leveraged: if installed on `PATH`, the agent runs them as deterministic exit-code gates; if absent, the agent statically enforces the identical thresholds and rules.
    - *Practice*: Guard context window, small atomic commits.
- **Registry Update**:
  - Register `clean-code` in [`config/skills.json`](file:///C:/Apps/heimdall-agent/config/skills.json) under the `full` profile and tag it with `clean-code`, `ub-mode`, `tdd`, `refactoring`.

### Phase 4: Documentation Updates (README & Docs)
- **Files to update**:
  - [`README.md`](file:///C:/Apps/heimdall-agent/README.md):
    - Update skill badges and counts (from 51 to 52).
    - Add Playbook 08 (`08-backlog-and-change-request-flow.md`) to the Playbook registry.
    - Document the standardized plan directory conventions (`docs/designs/` -> `docs/designs/old/`).
    - Document the 4-stage Backlog and Change Request flows.
    - Add `clean-code` (`ub-mode`) to the Curated Toolkits section.
  - [`README.pt-BR.md`](file:///C:/Apps/heimdall-agent/README.pt-BR.md):
    - Apply identical updates in Brazilian Portuguese.
  - [`docs/SKILLS.md`](file:///C:/Apps/heimdall-agent/docs/SKILLS.md):
    - Document the new `clean-code` skill, its frontmatter, triggers, and companion tool contracts.

### Phase 5: Sync, Verification & Symlink Deployment
- Run `node setup.mjs --link` to deploy junctions to `~/.gemini`, `~/.claude`, and `~/.codex`.
- Run `node setup.mjs audit` to confirm 52 skills and full junction synchronization.
- Move this completed plan to `docs/designs/old/` upon final confirmation to validate the lifecycle end-to-end.

## 5. Symmetric & Tri-Directional Cross-Model Validation Loop
- Tasks executed by current runner -> validated with Gemini or Codex review bridges:
  - `powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`
  - `powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`

## 6. Orchestrator Heartbeat
- Cadence: Monitored at phase completions.
- Task status logged in run summaries.

## 7. Verification Harness
- **Schema & Link Verification**: Ensure all internal Markdown links in `playbooks/`, `doctrine/`, and `skills/` resolve to valid paths.
- **Setup & Audit Script**: Run `node setup.mjs audit` and verify that the 52nd skill (`clean-code`) is recognized and linked across all active harnesses without error.
- **Git Worktree Cleanliness**: Check `git status` to ensure only the intended surgical files are modified or added.
