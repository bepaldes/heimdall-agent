# `heimdall-agent` — Multi-Agent Engineering Sentinel & Environment Bootstrapper

<p align="left">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 18" /></a>
  <a href="#skill-inventory-49-curated-skills"><img src="https://img.shields.io/badge/skills-49%20frozen-blueviolet.svg?style=flat-square" alt="Skills: 49 Frozen" /></a>
  <a href="#supported-runtimes"><img src="https://img.shields.io/badge/runtimes-Antigravity%20%7C%20Claude%20%7C%20Codex%20%7C%20Desktop-black.svg?style=flat-square" alt="Runtimes" /></a>
</p>

**Heimdall** is a portable bootstrap toolkit and quality sentinel for multi-agent software engineering. It enforces planning gates before code generation, eliminates hallucinated AI slop, isolates module boundaries, and synchronizes 49 version-frozen skills across **Google Antigravity**, **Claude Code**, **OpenAI Codex CLI**, and **Claude Desktop**.

```
               ┌────────────────────────────────────────────────────────┐
               │                Heimdall Detection Engine              │
               │  • CLI Tools: claude.exe, agy.exe, codex.exe, cursor   │
               │  • Desktop: %APPDATA%\Claude                           │
               │  • Endpoints: GhostCLI Proxy / Vendor Direct APIs      │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │               Interactive Selection Gate               │
               │  [1] Full Ecosystem   [2] Claude Only   [3] Gemini     │
               │  [4] Codex CLI Only   [5] Desktop Only  [6] Custom     │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                   Atomic Deployment                    │
               │  • 49 Curated Skills (~/.gemini, ~/.claude, ~/.codex)  │
               │  • Context7 MCP live doc resolver                      │
               │  • Subagent briefs & desktop playbooks                 │
               │  • Dynamic model sync (--sync-models)                  │
               └────────────────────────────────────────────────────────┘
```

---

## Why Heimdall

Unconstrained AI coding assistants frequently hallucinate deprecated APIs, write speculative abstractions before understanding requirements, and bypass established architecture patterns. 

Heimdall restructures agent pairing into a disciplined engineering pipeline:

1. **Mandatory Grilling Gate (`/grill-me`)**: Forbids agents from writing code until they uncover hidden assumptions, challenge ambiguous requirements, and align on architectural tradeoffs.
2. **Karpathy Simplicity & Deep Verification**: Enforces minimal surgical edits without speculative bloat, paired with rigorous verification (TDD failing tests first, Playwright E2E visual checks, and negative path coverage).
3. **Specialized Subagent Division of Labor**: Replaces generic prompts with dedicated agent roles:
   - 🎨 **Designer**: Enforces tokens, responsive constraints, and zero visual clipping.
   - 🧪 **Tester**: Authors regression suites, race-condition tests, and boundary assertions.
   - 🛡️ **Security Auditor**: Executes differential HTTP probing (`strix-security`) and least-privilege checks.
   - 🧹 **Code Hygiene**: Audits module boundaries and eliminates unused exports (`knip`/`ts-prune`).
   - ⚖️ **Adversarial Reviewer**: Cross-examines git diffs with alternate models before merge.
4. **Live Context & Schema Integrity**: Includes **Context7 MCP** to query up-to-date documentation directly from source repositories, plus **`postgres-best-practices`** (maintained by Supabase) for migration idempotency, index optimization, and connection pooling.
5. **Universal Multi-Agent Parity**: All 49 skills are version-frozen locally. Upstream breaking changes or external prompt alterations never destabilize your workstation.

---

## Interactive Environment Detection

When you run `node setup.mjs`, Heimdall audits the host system without assuming default locations or credentials:

```text
==================================================
        Heimdall Environment Detection
==================================================
[✔] Claude Code CLI     -> Found (C:\Users\...\.local\bin\claude.exe)
                           Endpoint: https://ghostcli.cloud
[✔] Google Antigravity  -> Found (C:\Users\...\AppData\Local\agy\bin\agy.exe)
                           Endpoint: Google GenAI Direct
[✔] OpenAI Codex CLI    -> Found (C:\Users\...\Programs\OpenAI\Codex\bin\codex.exe)
                           Endpoint: https://ghostcli.cloud/v1
[✔] Claude Desktop      -> Found (%APPDATA%\Claude)
[ ] Cursor / Windsurf   -> Not detected on PATH

--------------------------------------------------
Where would you like Heimdall installed?
  1. All Detected Tools (Full Ecosystem) [Recommended]
  2. Claude Code CLI only
  3. Google Antigravity CLI only
  4. OpenAI Codex CLI only
  5. Claude Desktop only (MCP & Playbooks)
  6. Custom Multi-Selection (e.g. Claude + Gemini)
```

Selecting an option installs skills and configs strictly to the targeted runtimes, leaving untouched tools completely isolated.

---

## Quickstart

### 1-Click Bootstrap

Run on any new machine or fresh environment:

```powershell
# Clone repository
git clone https://github.com/bepaldes/heimdall-agent.git C:\Apps\heimdall-agent
cd C:\Apps\heimdall-agent

# Run interactive setup
node setup.mjs
```

### Headless & CI Installation

Automate setup using profiles and non-interactive flags:

```powershell
# Full 49-skill deployment across all detected tools
node setup.mjs --profile full --yes

# Minimal setup targeted to Claude Code only
node setup.mjs --profile minimal --agents claude --yes

# Audit current configuration and verify MCP connections
node setup.mjs --audit
```

---

## Dynamic Model Registry (`--sync-models`)

Rather than relying on outdated static model lists, Heimdall discovers available model catalogs dynamically from active provider or proxy endpoints (e.g. GhostCLI, LiteLLM, or native vendor APIs):

```powershell
node setup.mjs --sync-models
```

This queries live catalog endpoints, registers new models (e.g. `gemini-4`, `claude-opus-5-5`, `gpt-6-astra`), and updates `config/models.json` automatically.

---

## Profiles

| Profile | Skills | Primary Focus | Best For |
| :--- | :---: | :--- | :--- |
| **`full`** | 49 | Complete engineering suite: planning, antislop, design, security, hygiene, database | Everyday development across all runtimes |
| **`minimal`** | 15 | Lean core: planning, Karpathy simplicity, TDD, antislop, hygiene | Fast workflows, lightweight laptops |
| **`security`** | 12 | Differential HTTP probing, OWASP top 10, Snyk scans, Trail of Bits checks | Penetration testing & pre-deployment audits |
| **`design`** | 14 | Design tokens, responsive layouts, motion curves, antislop UI rules | Frontend development & design system work |

---

## Supported Runtimes

| Harness | Deployment Target | Integration Mechanism |
| :--- | :--- | :--- |
| **Google Antigravity** | `~/.gemini/skills/` | Dynamic Progressive Disclosure |
| **Claude Code** | `~/.claude/skills/` | Dynamic Progressive Disclosure |
| **OpenAI Codex CLI** | `~/.codex/skills/` | Dynamic Progressive Disclosure |
| **Shared Multi-Agent** | `~/.agents/skills/` | Hierarchical Workspace Traversal |
| **Claude Desktop** | `%APPDATA%\Claude\` | Automated `claude_desktop_config.json` + Playbooks |
| **IDEs / Editors** | Workspace Root | Standalone Playbooks & Cursorrules |

---

## Skill Inventory (49 Curated Skills)

<details open>
<summary><b>1. Planning & Verification Discipline (10 skills)</b></summary>

- `brainstorming`: Surfaces implicit assumptions and explores alternatives before design lock.
- `writing-plans`: Structures modular, bite-sized tasks with verifiable completion criteria.
- `executing-plans`: Enforces step-by-step verification and halts execution upon unexpected failures.
- `karpathy-guidelines`: Demands minimal surgical edits and rejects speculative configurability.
- `test-driven-development`: Requires failing automated tests prior to implementation logic.
- `systematic-debugging`: Isolates root causes using scientific hypothesis testing.
- `verification-before-completion`: Mandates passing test suites and live verification before claiming completion.
- `finishing-a-development-branch`: Verifies branch hygiene, tests, and documentation before merge.
- `using-git-worktrees`: Manages parallel agent execution branches without dirtying working trees.
- `document-organizer`: Prevents documentation drift and keeps architectural specs organized.

</details>

<details>
<summary><b>2. Anti-Slop Guardrails (6 skills)</b></summary>

- `antislop`: Core guardrail prohibiting generic AI filler, fake buzzwords, and decorative bloat.
- `antislop-code`: Prohibits redundant comments, defensive dead code, and speculative abstractions.
- `antislop-copywriting`: Bans AI buzzwords (*unlock, elevate, robust*), signposting, and fake authority tropes.
- `antislop-ui`: Rejects generic purple gradients, uniform pill radius, and unmotivated dark modes.
- `antislop-human`: Enforces WCAG AAA contrast, semantic HTML, and accessible interactive targets.
- `antislop-layoutmobile`: Guarantees responsive flex safety, zero clipping, and touch-target padding.

</details>

<details>
<summary><b>3. Design Engineering & Aesthetics (12 skills)</b></summary>

- `taste-skill`: Enforces cohesive design reads, purpose-driven typography, and brand-first color logic.
- `taste-skill-v1`: Baseline visual hierarchy and layout balance heuristics.
- `gpt-tasteskill`: OpenAI-optimized aesthetic evaluation and UI critique prompt harness.
- `brandkit`: Manages design tokens, invariant brand assets, and multi-palette themes.
- `brutalist-skill`: High-contrast, bold typographic layouts with deliberate structural tension.
- `minimalist-skill`: Ultra-clean editorial layouts emphasizing typography, space, and restraint.
- `soft-skill`: Tactile micro-interactions, subtle elevation, and organic surface transitions.
- `redesign-skill`: Systematic visual elevation of legacy interfaces without breaking existing logic.
- `image-to-code-skill`: High-fidelity translation from visual wireframes/mockups to component code.
- `stitch-skill`: Cross-component layout integration and responsive flow alignment.
- `imagegen-frontend-web`: Web-optimized visual asset generation and placeholder authoring.
- `imagegen-frontend-mobile`: Mobile-native aspect ratio and resolution image scaffolding.

</details>

<details>
<summary><b>4. Security & Differential Probing (8 skills)</b></summary>

- `strix-security`: Dynamic differential HTTP probing across anonymous, unprivileged, and admin actors.
- `security-audit-sweep`: Automated surface scan for exposed credentials, open ports, and risky calls.
- `owasp-security`: Web application defense against injection, broken auth, and SSRF.
- `cloudflare-security-audit`: Edge proxy, WAF rule, and CORS header verification.
- `snyk-agent-scan`: Dependency vulnerability analysis and license compliance validation.
- `trailofbits-audit-context`: High-assurance security analysis modeled on Trail of Bits practices.
- `trailofbits-insecure-defaults`: Detection of insecure default configurations and permission creep.
- `trailofbits-triage-brocards`: Structured security triaging and vulnerability risk prioritization.

</details>

<details>
<summary><b>5. Architecture, Database & Platform (3 skills)</b></summary>

- `postgres-best-practices`: Supabase-curated guidelines for indexing, connection pooling, and migrations.
- `podium-docs-sync`: Automated container inventory sync, API catalog verification, and docs hygiene.
- `output-skill`: Structured output formatting for complex analysis artifacts.

</details>

<details>
<summary><b>6. Multi-Agent Orchestration & Review (10 skills)</b></summary>

- `subagent-driven-development`: Decomposes large tasks into isolated subagents with specialized briefs.
- `dispatching-parallel-agents`: Coordinates concurrent subagent workers on independent branches.
- `claude-collaborator`: Cross-model delegation bridge to Claude Opus / Sonnet for deep review.
- `gemini-collaborator`: Cross-model delegation bridge to Gemini for high-velocity workspace scans.
- `requesting-code-review`: Formats structured diff context for adversarial peer review.
- `receiving-code-review`: Parses peer critiques objectively and implements verified recommendations.
- `using-superpowers`: Multi-agent operational playbook for complex software development.
- `diagnosing-superpowers`: Health check and triage harness for agent tooling and skill resolution.
- `writing-skills`: Authors new modular skills adhering to standard frontmatter and trigger contracts.

</details>

---

## Companion Remote Orchestrators

For multi-device pair programming and mobile monitoring, Heimdall integrates with:

- **[Herdr (`herdr.dev`)](https://herdr.dev/)**: A terminal-native agent multiplexer written in Rust. Keeps background agent sessions persistent across connection drops and tracks status (`working`, `blocked`, `idle`).
- **[Moshi (`getmoshi.app`)](https://getmoshi.app/)**: A mobile client (iOS/Android) pairing with your terminal session. Delivers push notifications when an agent hits an interactive planning gate and enables remote approval.

---

## License

MIT © [bepaldes](https://github.com/bepaldes)
