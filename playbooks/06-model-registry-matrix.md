# Playbook 06: Authoritative Model Registry & Effort Matrix

> **For Desktop & Web AI**: Use this authoritative matrix to select authorized models, canonical flags, allowed effort levels, and API routing for multi-agent tasks and bridge reviews.

---

## 1. Access Channels & Multi-Agent Multiplexing

Models are partitioned into two architectural access channels:

- **Channel 1: GhostCLI Unified Gateway (`https://ghostcli.cloud`)**
  - Powers **Claude Code CLI**, **OpenAI Codex CLI**, and **Hermes Agent**.
  - Serves all GhostCLI-proxied model families (Anthropic `claude-*`, OpenAI `gpt-*`, Zhipu `z-ai/glm-*`, Tencent `tencent/Hy4-*`, Xiaomi `XiaomiMiMo/*`, and any newly discovered models in `config/models.json`).
  - Because GhostCLI exposes multi-protocol translation (`/v1/messages`, `/v1/responses`, `/v1/chat/completions`), any CLI harness can run any GhostCLI model directly (e.g. `claude --model z-ai/glm-5.3`, `claude --model tencent/Hy4-preview`, `codex --model claude-sonnet-5-5`).
  - When coordinating between harnesses in Herdr (`HERDR_ENV=1`), use native Herdr multiplexing (`herdr agent start/prompt`) directly.

- **Channel 2: Google Gemini Direct API (`gemini.googleapis.com`)**
  - Powers **Google Antigravity** natively (via direct Google OAuth).
  - Coordinated across harnesses via native Herdr (`herdr agent start <name> --kind agy`).

---

## 2. GhostCLI Models (via `https://ghostcli.cloud`)

<!-- heimdall:ghostcli-models:start -->
All GhostCLI models are discovered dynamically via `heimdall sync` / `heimdall sync-models` and stored in `config/models.json`:

| Model Name | Canonical Flag | Family | Context Window | Allowed Effort Levels | Specialization / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GLM 5.3** | `z-ai/glm-5.3` | z-ai | 1M | `low`, `medium`, `high`, `xhigh` | Código agêntico com contexto de 1M |
| **GLM 5.3 Flash** | `z-ai/glm-5.3-flash` | z-ai | 1M | `low`, `medium`, `high` | Respostas rápidas para código |
| **GPT-6 Astra** | `gpt-6-astra` | openai | 1M | `low`, `medium`, `high`, `xhigh` | Trabalho agêntico longo com janela de 1M |

> [!NOTE]
> **Dynamic Model Registry**: Always resolve live model IDs from `config/models.json` or this table after `heimdall sync` / `heimdall sync-models`. Route tasks by **capability tier** across all available families (Anthropic, Google, OpenAI, GLM, Hunyuan, MiMo, etc.), not only Claude/Gemini/Codex.
<!-- heimdall:ghostcli-models:end -->

---

## 3. Google Antigravity Models (Google API Direct)

Accessed natively via Google Antigravity / `agy` CLI (never through GhostCLI):

| Model Name | Canonical Flag | Allowed Effort Levels | Tier & Optimal Specialization |
| :--- | :--- | :--- | :--- |
| **Gemini 4 Neon** | `gemini-4-neon-{effort}` (e.g. `gemini-4-neon-high`) | `low`, `medium`, `high`, `xhigh` | **Quota-Limited Flagship**. High-end Gemini 4 model; reserve for specialized architecture and critical reasoning tasks. |
| **Gemini 4 Argon** | `gemini-4-argon-{effort}` (e.g. `gemini-4-argon-high`) | `low`, `medium`, `high` | **Quota-Limited Flagship**. High-end Gemini 4 frontier reasoning; reserve for specialized high-stakes tasks. Subject to quota cooldowns. |
| **Gemini 4 Hydrogen** | `gemini-4-hydrogen-{effort}` (e.g. `gemini-4-hydrogen-xhigh`) | `low`, `medium`, `high`, `xhigh` | **Mid-Tier Reviewer & Balanced Workhorse**. Stronger reasoning than Flash with lower quota pressure than Argon/Neon; default for cross-family review. |
| **Orchestrator (Argon)** | N/A (model dropdown option in Antigravity) | Auto-managed | Dynamic mode that splits tasks between Carbon (planning/review) and Hydrogen (implementation) within one session. |
| **Gemini 3.8 Flash** | `gemini-3.8-flash-{effort}` (e.g. `gemini-3.8-flash-high`) | `low`, `medium`, `high` | **Fast Utility**. Rapid scans, boilerplate scaffolding, and quick verification. Lower reasoning depth than Hydrogen. |

---

## 4. API Endpoints & Authentication

Base URL: `https://ghostcli.cloud`

| Format | Endpoint | Client |
| :--- | :--- | :--- |
| Anthropic Messages | `/v1/messages` | Claude Code, Anthropic SDK |
| OpenAI Responses | `/v1/responses` | Codex CLI |
| OpenAI Chat Completions | `/v1/chat/completions` | OpenAI SDK, Cursor, Continue, Aider, LangChain |
| Gemini GenerateContent | `/v1beta/models/{model}:generateContent` | Google Gen AI SDK, Gemini clients |

**Authentication**:
- GhostCLI: `Authorization: Bearer gcli_…` or `x-api-key: gcli_…` (server accepts both).
- Gemini API: `x-goog-api-key` header or `?key=` query parameter.

---

## 5. Agent Tool Model Override

The `/model` picker in Claude Code shows a hardcoded list that may include models not on GhostCLI (e.g. Haiku) and omit models that are (e.g. Astra, GLM).

To dispatch any GhostCLI model — including those invisible in the picker — pass its canonical flag via the Agent tool's `model` parameter when spawning subagents (e.g. `model: "gpt-6-astra"`, `model: "z-ai/glm-5.3"`). The API call routes through GhostCLI regardless of what `/model` displays.

Gemini models (`gemini-4-hydrogen`, `gemini-4-argon`, `gemini-3.8-flash`) are never reachable through GhostCLI; they are accessed natively via Google Antigravity (`agy` CLI in Herdr). `Orchestrator (Argon)` is a dynamic mode that splits tasks between planning and implementation within one session — it is not a standalone model. Gemini 4 Carbon exists but is unavailable on current plan tier.

---

## 6. Effort Constraint, Tier Policy & Fallback Rules

- **Model Tier Policy**:
  - **Quota-Limited Flagships** (`gemini-4-argon`, `gemini-4-neon`): Reserve strictly for specialized architecture, deep synthesis, and critical final reviews.
  - **Unlimited Workhorses** (`claude-opus-5-5`, `claude-fable-5.2`, `gpt-6-astra` / Codex): No Antigravity quota limits; default for heavy implementation, migrations, and E2E verification.
  - **Mid-Tier Reviewer** (`gemini-4-hydrogen`): Stronger reasoning than Flash; default for cross-family reviews and balanced tasks.
  - **Fast Utility** (`gemini-3.8-flash`, `z-ai/glm-5.3-flash`, `deepseek-ai/DeepSeek-V4.1-Flash-1017`): Rapid scans, scaffolding, and quick utility checks.
- **Effort Constraint Rule**: Each task in a plan must explicitly declare a registered model, an allowed effort level, and a Selection Rationale.
- **Quota Fallback Rule**: When Gemini 4 Argon or Neon reaches quota cooldown, fallback in order: `Gemini 4 Hydrogen` → `Gemini 3.8 Flash` → GhostCLI unlimited workhorses (`Claude Opus 5.5` / `GPT-6 Astra`).
- **Headless Execution Limitation**: The `agy` CLI requires a TTY for all execution modes including `--print`. Non-interactive/headless invocations from scripts, CI, or piped environments will hang indefinitely. Use Herdr split/tab/window modes instead, or run `agy` interactively.
