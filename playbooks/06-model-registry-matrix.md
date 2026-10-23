# Playbook 06: Authoritative Model Registry & Effort Matrix

> **For Desktop & Web AI**: Use this authoritative matrix to select authorized models, canonical flags, allowed effort levels, and API routing for multi-agent tasks and bridge reviews.

---

## 1. Access Channels

Models are accessed through three primary channels:
- **GhostCLI** (`https://ghostcli.cloud`): Unified API proxy for Claude Code and OpenAI Codex CLI sessions.
- **Gemini Bridge** (`gemini-bridge.ps1`): Direct connection to Google's API for Gemini sessions and reviews (not through GhostCLI).
- **Bridge Scripts** (`C:\Apps\tools\`): Canonical shared scripts (`claude-bridge.ps1`, `gemini-bridge.ps1`, `codex-bridge.ps1`) hitting native APIs for cross-model validation.

---

## 2. GhostCLI Models (via `https://ghostcli.cloud`)

All GhostCLI models support text and image input:

| Model Name | Canonical Flag | Context Window | Max Output | Parallel Tools | Search | Allowed Effort Levels | Optimal Specialization |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Claude Opus 5.5** | `claude-opus-5-5` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Deepest architectural reasoning, complex multi-system debugging, critical security audits, knotty algorithms. |
| **Claude Sonnet 5** | `claude-sonnet-5` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Primary full-stack coding driver, type-safe API schemas, database mutation logic, Playwright E2E test authoring. |
| **Claude Fable 5.1** | `claude-fable-5.1` | 256K / 1M extended | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | Visual storytelling, high-polish frontend design, copycrafting, UI aesthetic alignment, interaction flows. |
| **GLM 5.3** | `z-ai/glm-5.3` | 1M | 128K | ❌ | ❌ | `low`, `medium`, `high`, `xhigh` | Massive context analysis, long-document processing, Zhipu AI reasoning. |
| **GPT-6 Astra** | `gpt-6-astra` | 1M | 128K | ✅ | ✅ | `low`, `medium`, `high`, `xhigh` | OpenAI reasoning, broad general-purpose tasks, alternative perspective for cross-validation. |

---

## 3. Gemini Bridge Models (Google API Direct)

Accessed via `gemini-bridge.ps1` hitting Google's API directly (never through GhostCLI):

| Model Name | Canonical Flag | Allowed Effort Levels | Optimal Specialization |
| :--- | :--- | :--- | :--- |
| **Gemini 4 (Argon)** | `gemini-4` (`gemini-4-argon`, `argon`) | `low`, `medium`, `high`, `xhigh` | Next-generation flagship Gemini reasoning, complex multi-file architecture, deep cross-workspace synthesis, high-velocity full-stack implementation. |
| **Gemini 3.8 Flash** | `gemini-3.8-flash` | `low`, `medium`, `high` | Fast scans, workspace audits, boilerplate generation, unit test scaffolding, rapid prototyping, responsive styling. |
| **Gemini 3.1 Pro** | `gemini-3.1-pro` | `medium`, `high`, `xhigh` | Massive context analysis, repository-wide multi-file refactoring, deep documentation synthesis, architectural audits. |

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

Gemini models (`gemini-4`, `gemini-3.8-flash`, `gemini-3.1-pro`) are never reachable through GhostCLI; they require `gemini-bridge.ps1` hitting Google's API directly.

---

## 6. Effort Constraint & Fallback Rules

- **Effort Constraint Rule**: Each task in a plan must explicitly declare one of the registered models and an allowed effort level matching the tables above.
- **Quota Fallback Rule**: When Gemini 4 Argon reaches quota cooldown, immediately fallback to Gemini 3.8 Flash (for fast scans/reviews) or Gemini 3.1 Pro (for massive context), or Claude Sonnet 5 / GPT-6 Astra via GhostCLI.
