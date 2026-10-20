# Universal Cross-Agent Doctrine (AGENTS.md)

Universal directives for all coding agents (Google Antigravity, Claude Code, OpenAI Codex CLI, etc.) operating across all projects in `C:\Apps\`.

---

## 1. Skill Precedence & Contradiction Resolution

All 40+ global skills are installed with 100% SHA-256 parity in `~/.gemini/skills`, `~/.claude/skills`, `~/.agents/skills`, and `~/.codex/skills`. Because skills use progressive disclosure, Antigravity, Claude Code, and Codex CLI automatically discover them in all projects.

Follow this hierarchy to resolve cross-skill tensions:
1. **Universal Baseline Hygiene (`antislop` suite — MANDATORY THROUGHOUT)**:
   - Always active across ALL phases: planning, code generation, UI layout, copy, and code review.
   - Eliminates generic AI filler, boilerplate comments (`antislop-code`), conversational fluff, accessibility gaps (`antislop-human`), and unprompted refactoring.
2. **UI Adjustments & New Features (`taste-skill` — ALWAYS PRESENT)**:
   - Whenever any task or plan involves **UI adjustments, styling, layout changes, frontend components, redesigns, or new user-facing features**, `taste-skill` (`~/.claude/skills/taste-skill/SKILL.md` / `~/.gemini/skills/taste-skill/SKILL.md`) **MUST ALWAYS BE PRESENT and active**.
   - The agent must output a **"Design Read"** (page kind, audience, vibe, design system alignment) per Section 0.B of `taste-skill`.
   - Adhere strictly to the workspace design system and tokens (e.g. `docs/05.DESIGN.md` Warm Paper / Obsidian Slate in Podium).
   - Enforce anti-default discipline: reject generic AI templates, centered dark mesh heroes, AI-purple gradients, generic card layouts, and Inter+slate-900 defaults.
   - For aesthetic themes, select **exactly one** cohesive design language (`taste-skill`, `brutalist-skill`, `minimalist-skill`, or `soft-skill`). Never blend contradictory themes.
3. **Workflow Structure vs. Code Restraint**:
   - `superpowers` (`writing-plans`, `subagent-driven-development`) dictates the lifecycle phases, orchestrator role, and verification checkpoints.
   - `karpathy-guidelines` dictates code restraint (minimum code, zero speculative bloat, surgical changes).
4. **Surgical Edits vs. Purging**:
   - Follow `karpathy-guidelines` surgically during implementation (touch only what you must, never touch adjacent code).
   - Use `purge-workspace` (`python ~/.gemini/skills/purge-workspace/scripts/purge_workspace.py .`) for dedicated sweeps of build artifacts and stale caches.

---

## 2. Mandatory Planning & Multi-Agent Protocol

When in plan mode or handling a `/plan` request in any project:
1. **Defaults When Planning (No User Prompting Needed)**:
   - **`brainstorming` and Interactive Grilling are DEFAULT and MANDATORY**:
     - Hard gate: Never touch code without alignment.
     - Interrogate assumptions: Ask at least 2–3 probing questions about edge cases, constraints, and hidden assumptions before locking the plan.
     - Suggest at least 2 alternative approaches and articulate the concrete tradeoffs of each.
   - **`karpathy-guidelines` (Fast, Surgical Implementation) is DEFAULT and MANDATORY**:
     - Simplicity first: write the minimum code necessary (if 200 lines can be 50, write 50). Touch only what you must, avoid speculative bloat.
   - **Deep, Slow Verification is DEFAULT and MANDATORY**:
     - Implement fast, verify slow with high effort.
     - Verification is not a checkbox: write automated tests first (TDD), assert non-zero bounding box visual renders, check error/regression paths, and run full boundary checks.
   - **Orchestrator Role & Specialized Subagent Dispatch is DEFAULT**:
     - The agent handling the plan acts as the **Orchestrator**.
     - Break plans into distinct phases and dispatch specialized parallel subagents:
       - 🎨 **Designer**: Enforces design systems, tokens, zero clipping, anti-slop.
       - 🧪 **Tester**: Writes failing tests, covers edge cases and regressions.
       - 🛡️ **Security Auditor**: Verifies IAM, differential HTTP probes, input sanitization.
       - 🧹 **Code Hygiene**: Scans dead code, unreferenced exports, boundary violations.
       - ⚖️ **Adversarial Reviewer**: Performs deep diff critique before completion.
   - **Tri-Directional Cross-Model Reviews are DEFAULT**:
     - Tasks executed by Claude $\rightarrow$ Gemini validates (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`) or Codex validates (`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`).
     - Tasks executed by Gemini $\rightarrow$ Claude validates (`powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"`) or Codex validates (`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"`).
     - Tasks executed by Codex $\rightarrow$ Claude validates (`powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"`) or Gemini validates (`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"`).
   - **Quota Resilience & Model Registry Fallback**:
     - When **Gemini 4 Argon** reaches quota cooldown, immediately fall back to **Gemini 3.8 Flash** (for fast scans and bridge reviews) or **Gemini 3.1 Pro** (for massive context reasoning) on the Gemini side, and leverage **Claude Sonnet 5.5 / Opus 5.5** or **GPT-6 Astra** via GhostCLI.

### 2.1 Authoritative Model Registry & Effort Matrix

Models are accessed through three channels: **GhostCLI** (`https://ghostcli.cloud`) as the unified API proxy for Claude Code and OpenAI Codex CLI sessions, and **Gemini Bridge** (`gemini-bridge.ps1`) hitting Google's API directly for Gemini sessions. Cross-model reviews use bridge scripts that hit each provider's native API.

**GhostCLI Models** (via `https://ghostcli.cloud` proxy — all support text + image input):

| Model Name | Canonical Flag | Context Window | Max Output | Parallel Tools | Search | Allowed Effort Levels | Optimal Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Claude Opus 5.5** | `claude-opus-5-5` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Deepest architectural reasoning, complex multi-system debugging, critical security audits, knotty algorithms. |
| **Claude Sonnet 5** | `claude-sonnet-5` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Primary full-stack coding driver, type-safe API schemas, database mutation logic, Playwright E2E test authoring. |
| **Claude Fable 5.1** | `claude-fable-5.1` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Visual storytelling, high-polish frontend design, copycrafting, UI aesthetic alignment, interaction flows. |
| **GLM 5.3** | `z-ai/glm-5.3` | 1M | 128K | ❌ | ❌ | `low`, `medium`, `high`, `xhigh` | Massive context analysis, long-document processing, Zhipu AI reasoning. |
| **GPT-6 Astra** | `gpt-6-astra` | 1M | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | OpenAI reasoning, broad general-purpose tasks, alternative perspective for cross-validation. |

**Gemini Bridge Models** (via `gemini-bridge.ps1` → Google API directly — not through GhostCLI):

| Model Name | Canonical Flag | Allowed Effort Levels | Optimal Specialization |
| :--- | :--- | :--- | :--- |
| **Gemini 4 (Argon)** | `gemini-4` (`gemini-4-argon`, `argon`) | `low`, `medium`, `high`, `xhigh` | Next-generation flagship Gemini reasoning, complex multi-file architecture, deep cross-workspace synthesis, high-velocity full-stack implementation. |
| **Gemini 3.8 Flash** | `gemini-3.8-flash` | `low`, `medium`, `high` | Fast scans, workspace audits, boilerplate generation, unit test scaffolding, rapid prototyping, responsive styling. |
| **Gemini 3.1 Pro** | `gemini-3.1-pro` | `medium`, `high`, `xhigh` | Massive context analysis, repository-wide multi-file refactoring, deep documentation synthesis, architectural audits. |

**API Endpoints** (GhostCLI base URL: `https://ghostcli.cloud`):

| Format | Endpoint | Client |
|--------|----------|--------|
| Anthropic Messages | `/v1/messages` | Claude Code, Anthropic SDK |
| OpenAI Responses | `/v1/responses` | Codex CLI |
| OpenAI Chat Completions | `/v1/chat/completions` | OpenAI SDK, Cursor, Continue, Aider, LangChain |
| Gemini GenerateContent | `/v1beta/models/{model}:generateContent` | Google Gen AI SDK, Gemini clients |

Auth: `Authorization: Bearer gcli_…` or `x-api-key: gcli_…` (server accepts both). Gemini format also accepts `x-goog-api-key` and `?key=`.

**Agent Tool Model Override**: The `/model` picker in Claude Code shows a hardcoded list that may include models not on GhostCLI (e.g. Haiku) and omit models that are (e.g. Astra, GLM). To use any GhostCLI model — including those invisible in the picker — pass its canonical flag via the Agent tool's `model` parameter when spawning subagents (e.g. `model: "gpt-6-astra"`, `model: "z-ai/glm-5.3"`). The API call routes through GhostCLI regardless of what `/model` displays. Gemini models (`gemini-4`, `gemini-3.8-flash`, `gemini-3.1-pro`) are never reachable through GhostCLI; they require `gemini-bridge.ps1` hitting Google's API directly.

*Effort Constraint Rule*: Each task in a plan must explicitly declare one of the registered models and an allowed effort level matching the tables above.

### 2.2 Canonical Plan Template (Mandatory Output Structure)

Every plan artifact generated by any agent MUST follow this exact schema:

```markdown
# Plan: [Feature / Task Name]

## 1. Active Skills & Directives Checklist
- [x] \`brainstorming\` — Intent discovered, assumptions surfaced, tradeoffs evaluated
- [x] \`karpathy-guidelines\` — Simplicity first, surgical edits, no speculative bloat
- [x] \`antislop\` — Clean comments, no AI boilerplate, accessible contrast
- [x] \`taste-skill\` — [Required for UI / Features] Design Read declared, design system tokens enforced

## 2. Context & Design Read (Required for UI / Features)
- **Design Read**: Reading this as: <page kind> for <audience>, with <vibe>, leaning toward <design system / tokens>.
- **Design System Tokens**: Explicit mapping to workspace tokens (e.g. \`--bg\`, \`--panel\`, \`--line\`, \`--accent\`, \`--text\`).
- **Anti-Default Discipline**: Specific AI tropes explicitly rejected for this surface.

## 3. Multi-Agent Orchestration & Model Allocation Matrix
| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Scaffolding | claude-sonnet-5 | high | Schema & component structure | Gemini 3.8 Flash (\`gemini-bridge review\`) |
| T2 | Phase 2: Implementation | claude-sonnet-5 | high | Core business logic & UI | Gemini 3.8 Flash (\`gemini-bridge review\`) |
| T3 | Phase 3: Playwright E2E | claude-sonnet-5 | high | Full user journey verification | Gemini 3.8 Flash (\`gemini-bridge review\`) |

## 4. Multi-Phase Implementation Plan
### Phase 1: Architecture & Scaffolding
### Phase 2: Core Implementation
### Phase 3: Integration & Playwright E2E Verification
### Phase 4: Review, Purge & Handoff

## 5. Symmetric & Tri-Directional Cross-Model Validation Loop
- Tasks executed by Claude -> Validate with Gemini or Codex:
  \`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"\`
  \`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"\`
- Tasks executed by Gemini -> Validate with Claude or Codex:
  \`powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"\`
  \`powershell -File C:/Apps/tools/codex-bridge.ps1 review -Model "gpt-6-astra" -Effort "high"\`
- Tasks executed by Codex -> Validate with Claude or Gemini:
  \`powershell -File C:/Apps/tools/claude-bridge.ps1 review -Model "claude-sonnet-5" -Effort "high"\`
  \`powershell -File C:/Apps/tools/gemini-bridge.ps1 review -Model "Gemini 3.8 Flash" -Effort "high"\`

## 6. Orchestrator Heartbeat
- Orchestrator monitors progress every 3 minutes.

## 7. Verification Harness
- Playwright E2E at full capacity + local workspace gates (\`pnpm test\`, \`pnpm boundaries\`).
```

---

## 3. Testing Philosophy: Playwright E2E Full Capacity

- For all interactive user experiences, web applications, and APIs, **Playwright E2E at full capacity** is the required primary verification standard.
- Tests must validate end-to-end user journeys, visual rendering, error flows, and state transitions.
- No user-facing feature or bugfix is complete until Playwright E2E passes.

---

## 4. Workspace Hygiene: `project-hygiene`

- Run the `project-hygiene` skill to audit recoverable disk space, detect dead code, purge build caches, and verify architectural boundaries.

---

## 5. Canonical Shared Tools & Zero-Duplication Policy

- **Canonical Location**: All cross-model coordination scripts live canonically in a shared tools directory registered in the user's `PATH` (such as `~/.local/bin`, `C:\Apps\tools`, or a designated bin folder).
- **Global Invocation**: Cross-model bridge commands can be run directly from any workspace or shell without duplicating scripts:
  - **Gemini $\rightarrow$ Claude**: `claude-bridge review -Model "claude-sonnet-5" -Effort "high"`
  - **Claude $\rightarrow$ Gemini**: `gemini-bridge review -Model "Gemini 3.8 Flash" -Effort "high"`
  - **Cross-Agent $\rightarrow$ Codex (Astra)**: `codex-bridge review -Model "gpt-6-astra" -Effort "high"` (or `codexcli-bridge review ...`)
- **Zero-Duplication Mandate**:
  - **Never** copy or duplicate bridge scripts into individual project directories.
  - Project-level `tools/` directories are reserved exclusively for repo-specific build, boundary, or validation scripts.
  - Hardcoded one-off orchestrators are strictly prohibited; multi-agent coordination is governed dynamically via the Section 2 `/plan` protocol.

<!-- antislop:start -->
## antislop
For UI, copy, accessibility, mobile layout, or code comments, read `antislop` core and the task skill:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People / accessibility: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
<!-- antislop:end -->
