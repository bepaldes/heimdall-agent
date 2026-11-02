# Plan: Skill Upstream Audit & Sequential Update Pipeline

## 1. Active Skills & Directives Checklist
- [x] `brainstorming` — Intent discovered (full inventory scan + upstream sync), assumptions surfaced (local customizations exist, breaking changes possible)
- [x] `karpathy-guidelines` — Surgical audit scope, no speculative refactors, minimal update surface per skill
- [x] `antislop` — Clean diff reports, no boilerplate commentary in update manifests
- [x] `verification-before-completion` — Post-update behavioral test required before sign-off
- [x] `clean-code` (`ub-mode`) — Quality gates applied to any locally-patched skill merges

## 2. Context & Design Read
- **Design Read**: N/A (infrastructure/tooling task, no UI surface)
- **Design System Tokens**: N/A
- **Anti-Default Discipline**: No automated blind overwrites; every divergence flagged for human review

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Inventory extraction & upstream URL normalization from `config/skills.json` | claude-sonnet-5 | medium | Structured JSON parsing, deterministic output | Gemini 3.8 Flash (`gemini-bridge.ps1 review -Model "gemini-3.8-flash-medium"`) |
| T2 | Phase 2: Sequential upstream GitHub API polling (latest commit/tag vs. `sourceRevision`) | claude-sonnet-5 | medium | HTTP API calls, rate-limit aware, serial execution | Gemini 3.8 Flash (`gemini-bridge.ps1 review -Model "gemini-3.8-flash-medium"`) |
| T3 | Phase 3: Local customization detection (git diff of each skill dir against last known clean revision) | claude-sonnet-5 | high | Diff analysis, semantic patch classification | Claude Opus 5.5 (`claude-bridge.ps1 review -Model "claude-opus-5-5" -Effort "high"`) |
| T4 | Phase 4: Divergence report generation (categorized: clean-update / local-patch / breaking-change) | claude-sonnet-5 | medium | Structured markdown manifest | Gemini 3.8 Flash (`gemini-bridge.ps1 review -Model "gemini-3.8-flash-medium"`) |
| T5 | Phase 5a: Apply approved clean updates (one skill at a time, individual commits) | claude-sonnet-5 | high | File writes, frontmatter validation | Gemini 3.8 Flash (`gemini-bridge.ps1 review -Model "gemini-3.8-flash-high"`) |
| T5b | Phase 5b: Flagged manual-review items — present diff + upstream changelog, await human decision | claude-opus-5-5 | high | Deep context synthesis for merge recommendations | Human gate (no auto-apply) |
| T6 | Phase 6: Post-update verification harness (invoke each updated skill against canonical test prompt) | claude-sonnet-5 | high | Behavioral regression detection | Codex (`codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`) |
| T7 | Phase 7: Update `config/skills.json` sourceRevision fields & archive plan | claude-sonnet-5 | medium | Registry consistency | Gemini 3.8 Flash (`gemini-bridge.ps1 review -Model "gemini-3.8-flash-medium"`) |

## 4. Multi-Phase Implementation Plan

### Phase 1: Inventory Extraction & Normalization
- Parse `config/skills.json` → extract all 52 modules with their `upstream` URLs and current `sourceRevision`.
- Normalize GitHub URLs to API endpoints (`/repos/{owner}/{repo}/commits?per_page=1` or `/releases/latest`).
- Output: `docs/runs/skill-audit/inventory.json` (structured manifest).
- **Gate**: Validate inventory count matches 52 modules before proceeding.

### Phase 2: Sequential Upstream Polling
- For each skill in inventory, query GitHub API for latest commit SHA or release tag.
- Respect rate limits: 1-second delay between requests; use conditional requests (`If-None-Match`) where possible.
- Record: `{ skill, currentRevision, latestRevision, hasUpdate, latestCommitDate, latestCommitMessage }`.
- Output: `docs/runs/skill-audit/upstream-status.json`.
- **Gate**: All 52 entries populated; any API failures logged with retry count.

### Phase 3: Local Customization Detection
- For each skill with `hasUpdate: true`, run `git log --oneline <skill-dir>` since last known clean revision.
- Classify local changes:
  - **Clean**: No local commits touching skill files since installation.
  - **Patched**: Local commits exist but are additive (new references, tuned triggers).
  - **Divergent**: Local commits modify core instructions or remove upstream content.
- Output: `docs/runs/skill-audit/customization-report.json`.
- **Gate**: Every updated skill categorized; divergent items flagged for T5b.

### Phase 4: Divergence Report & Human Approval Manifest
- Generate `docs/runs/skill-audit/update-manifest.md` with three sections:
  1. **Auto-Approve Queue**: Clean updates, no breaking changes detected.
  2. **Manual Review Queue**: Patched or divergent skills, with side-by-side diff summary.
  3. **Breaking Change Alerts**: Upstream removed aliases, changed trigger phrases, or altered tool dependencies.
- Present manifest to user for explicit approval of Auto-Approve queue and disposition of Manual Review items.
- **Gate**: User sign-off on manifest before any file writes.

### Phase 5: Sequential Application (Approved Updates Only)
- **T5a (Auto-Approve)**: For each approved skill:
  1. Fetch upstream SKILL.md and reference files at `latestRevision`.
  2. Write to local skill directory.
  3. Validate frontmatter (name, triggers, description present).
  4. Git commit: `chore(skills): update {skill-name} to {latestRevision}`.
- **T5b (Manual Review)**: For each flagged item:
  1. Present upstream diff + local patch summary + merge recommendation.
  2. Await human decision: accept-upstream / keep-local / manual-merge.
  3. Apply decision, commit with descriptive message referencing human approval.
- **Gate**: Each skill committed individually; no batch commits.

### Phase 6: Post-Update Verification Harness
- For each updated skill, invoke against a canonical test prompt that exercises its primary trigger and core behavior.
- Capture: skill loaded successfully, expected instructions present in context, no parse errors.
- Record pass/fail per skill in `docs/runs/skill-audit/verification-results.json`.
- **Failure protocol**: Revert the failing skill's commit, flag for re-review, do NOT proceed until resolved.
- **Gate**: 100% pass rate on updated skills before registry update.

### Phase 7: Registry Update & Plan Archival
- Update `config/skills.json` `sourceRevision` fields for all successfully verified skills.
- Validate JSON schema integrity.
- Git commit: `chore(config): update skill sourceRevisions after upstream audit`.
- Move this plan to `docs/designs/old/2026-11-02 skill-upstream-audit-and-update.md`.
- **Gate**: Plan archived only after all phases complete and verification passes.

## 5. Symmetric & Tri-Directional Cross-Model Validation Loop
- **T1, T2, T4, T7** (Claude Sonnet 5 execution) → Validate with Gemini 3.8 Flash:
  `powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "gemini-3.8-flash-medium"`
- **T3** (Claude Sonnet 5 diff analysis) → Validate with Claude Opus 5.5:
  `powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-opus-5-5" -Effort "high"`
- **T5a, T5b** (Claude Sonnet 5 file writes) → Validate with Gemini 3.8 Flash:
  `powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "gemini-3.8-flash-high"`
- **T6** (Claude Sonnet 5 verification) → Validate with Codex GPT-6 Astra:
  `powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`

## 6. Orchestrator Heartbeat
- Orchestrator monitors progress every 3 minutes during Phases 2–6.
- Rate-limit backoff: if GitHub API returns 429, pause 60 seconds and resume.
- Stuck detection: if any phase exceeds 15 minutes without progress, alert user and pause.

## 7. Verification Harness
- **Strict Zero Dev-Server Policy**: No dev servers launched. Verification is non-interactive skill invocation against canonical prompts.
- **Behavioral Test Standard**: Each updated skill must load without error and produce expected instruction markers in agent context when triggered by its canonical alias.
- **Rejection of Pseudo-Verification**: File existence checks or frontmatter parsing alone are insufficient; actual skill invocation is required.
- **Rollback Protocol**: Any skill failing verification is reverted via `git revert <commit>` before proceeding.
- **Registry Consistency Check**: Final `config/skills.json` validated against JSON schema and cross-checked against git log of applied commits.