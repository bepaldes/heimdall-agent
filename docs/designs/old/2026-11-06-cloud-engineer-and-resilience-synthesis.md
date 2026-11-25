# Plan: Cloud Engineer Persona, Resilience Invariants, and MCP/Threat-Modeling Skills Synthesis

## 1. Active Skills & Directives Checklist
- [x] `brainstorming` — Synthesized top-tier capabilities from VoltAgent, pruned 170+ redundant/sprawl agents.
- [x] `karpathy-guidelines` — Surgical additions only: 1 missing persona, 2 high-value skills, and targeted agent infusions.
- [x] `antislop` — Zero conversational filler, strict Gemini 3-Tier instruction standard across all prompts.
- [x] `communication-doctrine` — BLUF summaries, STE imperative steps (<=20 words), zero vague qualifiers.
- [x] `taste-skill` — [N/A] Non-visual backend/prompt architectural specification.

## 2. Context & Design Read
- **Design Read**: Non-visual system architecture read for AI engineering agents, with strict adherence to the Gemini 3-Tier standard (*Persona*, *Chronological Rules*, *Unmistakable Guardrails*), multi-agent model matrix, and self-contained zero-sprawl repository integrity.
- **System Boundaries**: All agent personas declare `model: inherit` and canonical tool names. Skills adhere to standard `SKILL.md` frontmatter and register into `config/skills.json`.
- **Anti-Default Discipline**: Reject dumping 186 uncurated agent files; reject unadapted bash-only scripts; reject hallucinated model flags (`claude-sonnet-5-5`, `sonnet`).

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Create `agents/cloud-engineer.md` persona | claude-sonnet-5 | high | Infrastructure, Docker, K8s, Caddy/Nginx, and IaC domain precision | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`) |
| T2 | Phase 2: Infuse Docs-Drift & Resilience into existing agents | claude-sonnet-5 | high | Surgical updates to `reviewer.md`, `code-sentinel.md`, `tester.md`, `database-architect.md` | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`) |
| T3 | Phase 3: Create `skills/threat-modeling` & `skills/mcp-engineering` | claude-sonnet-5 | high | Modular skill authoring with structured checklists and zero AI slop | GPT-6 Astra (`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`) |
| T4 | Phase 4: Register skills in catalog & verify test suite | claude-sonnet-5 | medium | Update `config/skills.json`, profiles, and run terminating test suite | Gemini 3.8 Flash (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`) |

## 4. Multi-Phase Implementation Plan

### Phase 1: Architecture & Scaffolding
- Step 1.1: Create `agents/cloud-engineer.md` defining the infrastructure, container, reverse proxy, and IaC persona.
- Step 1.2: Structure `cloud-engineer.md` strictly into Gemini 3-Tier standard: Persona, Chronological Rules, and Unmistakable Guardrails.
- Step 1.3: Include cloud architecture checklists: Dockerfile optimization, multi-stage builds, Caddy/Nginx reverse proxying, and Terraform/IaC boundaries.
- Step 1.4: Set persona frontmatter to `model: inherit` and bind tools to `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`.

### Phase 2: Core Implementation (Agent Infusions)
- Step 2.1: Update `agents/reviewer.md` to add Docs-Drift Guard enforcing review blockers when exported signatures change without documentation updates.
- Step 2.2: Update `agents/code-sentinel.md` to add surgical documentation-sync rules with a strict 40% file blast-radius cap.
- Step 2.3: Update `agents/tester.md` to mandate chaos and fault-injection invariants (timeout, retry backoff, network failure assertions).
- Step 2.4: Update `agents/database-architect.md` to include pgvector, HNSW indexing, chunking guidelines, and connection-pool exhaustion checks.

### Phase 3: Modular Skills Scaffolding & Registration
- Step 3.1: Create `skills/threat-modeling/SKILL.md` covering STRIDE attack-surface mapping, boundary trust transitions, and IAM privilege reduction.
- Step 3.2: Create `skills/mcp-engineering/SKILL.md` covering JSON-RPC 2.0 schema validation, stdio/SSE transports, and tool error handling.
- Step 3.3: Register both skills into `config/skills.json` under their appropriate toolkits (`security` and `core-engineering`).
- Step 3.4: Synchronize skill counts across `config/profiles.json`, `docs/SKILLS.md`, `README.md`, and `README.pt-BR.md`.

### Phase 4: Review, Verification & Handoff
- Step 4.1: Execute `npm test` to verify catalog count integrity and documentation invariants pass with zero failures.
- Step 4.2: Inspect git diff with context-blinded Goldfish criteria to confirm zero unintentional regressions in existing agents.
- Step 4.3: Move this design plan from `docs/designs/` to `docs/designs/old/` upon successful verification.

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
- Evaluates test suite execution and validates zero dev-server processes are spawned.

## 7. Verification Harness
- **Strict Zero Dev-Server Policy**: NEVER run development servers (`npm run dev`, `vite`, `next dev`).
- **Terminating Verification**: Execute `npm test` (`node --test test/*.test.mjs`). All tests must pass cleanly.
- **Catalog Integrity Sentinel**: `test/catalog.test.mjs` must assert zero drift across `skills.json`, `profiles.json`, `SKILLS.md`, `README.md`, and `README.pt-BR.md`.
- **Formatting Invariants**: Verify all modified markdown files follow standard YAML frontmatter and proper link references.
