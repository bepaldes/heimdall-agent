# Plan: Communication Doctrine Integration (BLUF & Simplified Technical English)

## 1. Active Skills & Directives Checklist
- [x] `brainstorming` — Intent discovered, interactive grilling completed, Approach B selected
- [x] `karpathy-guidelines` — Minimal, surgical edits to existing doctrine, templates, and agent specs
- [x] `antislop` — Elimination of AI filler words, performative preambles, and vague qualifiers
- [ ] `taste-skill` — [N/A] Non-UI architectural and governance task

## 2. Context & Design Read (Required for UI / Features)
- **Design Read**: Non-UI governance and agent infrastructure feature.
- **Specification**: Implementation of Approach B (Modular `communication-doctrine` Skill + Canonical Integration) across `heimdall-agent`.
- **Target Surfaces**:
  - `skills/communication-doctrine/SKILL.md` (New modular skill)
  - `doctrine/AGENTS.md` (Cross-agent doctrine update)
  - `playbooks/05-canonical-plan-template.md` & `skills/writing-plans/SKILL.md` (Planning templates)
  - `agents/reviewer.md` & `agents/code-sentinel.md` (Reviewer specs)
  - `config/skills.json` & `docs/SKILLS.md` (Registry and documentation)
  - `test/communication-doctrine.test.mjs` (Automated regression suite)

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Author Modular Skill (`communication-doctrine/SKILL.md`) | claude-sonnet-5 | high | High-precision technical writing & YAML frontmatter | Gemini 3.8 Flash (`gemini-bridge review`) |
| T2 | Phase 2: Core Doctrine & Template Integration (`doctrine/AGENTS.md`, `playbooks/05`, `writing-plans`) | claude-sonnet-5 | high | Surgical integration into universal doctrine & templates | Gemini 3.8 Flash (`gemini-bridge review`) |
| T3 | Phase 3: Agent Personas Integration (`reviewer.md`, `code-sentinel.md`) | claude-sonnet-5 | high | Reviewer verdict schemas and Goldfish reporting contracts | GPT-6 Astra (`codex-bridge review`) |
| T4 | Phase 4: Registry, Docs & Verification Suite (`config/skills.json`, `docs/SKILLS.md`, `test/*.test.mjs`) | claude-sonnet-5 | medium | JSON registry sync, markdown docs index, Node.js test authoring | Gemini 3.8 Flash (`gemini-bridge review`) |

## 4. Multi-Phase Implementation Plan

### Phase 1: Modular Communication Doctrine Skill
- [x] **Step 1.1**: Create `skills/communication-doctrine/SKILL.md` with YAML frontmatter:
  - Name: `communication-doctrine`
  - Description: "Bottom Line Up Front (BLUF) and Simplified Technical English (STE) communication doctrine for AI agents, implementation plans, code reviews, and subagent handoffs."
- [x] **Step 1.2**: Define **Macro Structure (BLUF Standard)**:
  - Subagent Handoff Schema: Top 3 lines must contain Status (`SUCCESS | FAILURE | ESCALATED`), Blast Radius (files touched, tests run), and Artifact Location.
  - Reviewer Verdict Schema: Line 1 must declare Verdict (`APPROVED | BLOCKED | REVISION_NEEDED`), followed by findings breakdown (Blockers, Warnings, Nits).
  - Implementation Plan Header Schema: 1-sentence Goal, Scope, Key Risks, Human Step-up Triggers.
- [x] **Step 1.3**: Define **Micro Syntax (STE Principles & Banned Qualifiers)**:
  - Rule 1: Imperative verb first for all action steps (`Run`, `Create`, `Modify`, `Assert`, `Verify`, `Delete`).
  - Rule 2: Procedural sentences strictly $\le$ 20 words. Descriptive text $\le$ 25 words.
  - Rule 3: Banned Vague Qualifiers list: `ensure`, `properly`, `appropriately`, `as needed`, `as appropriate`, `gracefully`, `robustly`, `seamlessly`, `etc.` Every instruction must state an observable, testable condition.
  - Rule 4: No vague pronouns (`it`, `this`, `they`) without an explicit antecedent noun.

### Phase 2: Core Doctrine & Planning Templates Integration
- [x] **Step 2.1**: Update `doctrine/AGENTS.md`:
  - Under `<core_discipline>`, add rule: `COMMUNICATION DISCIPLINE (BLUF & STE)` requiring bottom-line-first handoffs and unambiguous, imperative procedural instructions.
  - Under `<subagent_execution_contract>`, require child subagents to emit BLUF summaries at the start of their scratchpad reports.
- [x] **Step 2.2**: Update `playbooks/05-canonical-plan-template.md`:
  - Update Section 4 instructions to mandate STE step granularity (imperative verbs, $\le$ 20 words per step, zero banned vague qualifiers).
  - Add explicit plan header BLUF requirement.
- [x] **Step 2.3**: Update `skills/writing-plans/SKILL.md`:
  - Under "Step Granularity", add the STE imperative rules and the banned qualifier lexicon.

### Phase 3: Agent Personas Integration
- [x] **Step 3.1**: Update `agents/reviewer.md`:
  - Add `skills: communication-doctrine` to frontmatter.
  - In Tier 1 / Tier 2 Step 6, mandate the BLUF Review Verdict header on all review outputs before the detailed findings ledger.
  - Require suggested fixes to follow STE imperative phrasing.
- [x] **Step 3.2**: Update `agents/code-sentinel.md`:
  - Add `skills: communication-doctrine` to frontmatter.
  - Mandate BLUF audit summary format on all security and hygiene sweeps.

### Phase 4: Registry, Documentation & Automated Regression Suite
- [x] **Step 4.1**: Update `config/skills.json`:
  - Register `communication-doctrine` under standalone toolkits.
  - Increment `totalModules` to 51.
- [x] **Step 4.2**: Update `docs/SKILLS.md`:
  - Add `communication-doctrine` entry under Standalone Power Toolkits with summary and usage instructions.
- [x] **Step 4.3**: Create `test/communication-doctrine.test.mjs`:
  - Test 1: `skills/communication-doctrine/SKILL.md` exists and contains valid frontmatter with name and description.
  - Test 2: `config/skills.json` lists `communication-doctrine` and has valid syntax.
  - Test 3: `doctrine/AGENTS.md` contains the BLUF and STE communication directives.
  - Test 4: `playbooks/05-canonical-plan-template.md` includes STE step constraints and banned qualifiers.
- [x] **Step 4.4**: Run `npm test` to verify all 5 test suites pass cleanly.

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
- **Strict Zero Dev-Server Policy**: NEVER include steps to run or launch dev servers (`npm run dev`, `vite`, `next dev`, etc.). All agent verification must be non-interactive and terminating (`npm test`, `npm run build`, `vitest run`, `lint`, `typecheck`).
- **Terminating Test Suite**: `npm test` runs Node test runner across `test/*.test.mjs`. All tests must pass with exit code 0.
- **Syntax & Schema Verification**: Validate `config/skills.json` parses as valid JSON without trailing commas or syntax defects.
- **Rejection of Pseudo-Verification**: Changes are only marked complete when `npm test` succeeds and modified files are inspected against their git diff.
