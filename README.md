# `heimdall-agent` — Autonomous Multi-Agent Sentinel & Quality Bootstrapper

> Named after **Heimdall**, the all-seeing Norse guardian sentinel who perceives every sound, sees across all realms, and guards the Bifröst with unyielding vigilance. In your development environment, `heimdall-agent` guards against hallucinated AI slop, enforces boundary contracts, prevents speculative code bloat, and orchestrates multi-agent pairing across **Google Antigravity**, **Claude Code**, **OpenAI Codex CLI**, and **Claude Desktop**.

---

## 1. Why `heimdall-agent`? (The Core Benefits)

Standard AI coding setups often degrade into a guessing game: agents hallucinate outdated library methods, produce generic "AI-slop" code, bypass architectural boundaries, and rush into writing speculative bloat without understanding edge cases.

`heimdall-agent` transforms your AI from a sloppy assistant into a rigorous, disciplined engineering team:

1. **Mandatory Interactive Grilling Gate**:
   - Forbids any agent from touching code until it has surfaced hidden assumptions, asked 2–3 probing questions about edge cases, and proposed alternative architectural tradeoffs.
2. **Fast Implementation, Deep Slow Verification**:
   - Enforces **Karpathy simplicity guidelines** (minimal code, surgical edits, no bloat) while demanding **deep verification** (TDD failing tests first, Playwright E2E visible bounding-box assertions, and negative error coverage).
3. **Specialized Subagent Orchestration**:
   - Rather than relying on a single generalist prompt, `heimdall-agent` provides dedicated subagent role briefs:
     - 🎨 **Designer**: Enforces design systems, tokens (`@podium/tokens`), and zero-clipping invariants.
     - 🧪 **Tester**: Writes failing tests first, covers concurrency, error paths, and regression suites.
     - 🛡️ **Security Auditor**: Conducts differential HTTP probing (`strix-security`) and least-privilege checks.
     - 🧹 **Code Hygiene**: Scans for dead code (`knip`/`ts-prune`), removes unused exports, and polices module boundaries.
     - ⚖️ **Adversarial Reviewer**: Conducts deep diff scrutiny before any branch is completed.
4. **Live Documentation (Context7 MCP) & Database Safety**:
   - Ships with **Context7 MCP** to fetch live, version-accurate documentation from Upstash, eliminating API hallucinations.
   - Includes **`postgres-best-practices`** (maintained by Supabase) for query optimization, migration idempotency, composite index design, and connection pool sizing.
5. **Universal Multi-Agent Parity & Version Freeze**:
   - All 49 curated skills are version-frozen in this repository. Upstream breaking changes or external prompt alterations will never destabilize your workstation.
   - Synchronizes 100% identically across Antigravity, Claude Code, and Codex CLI.

---

## 2. Universal Model Resilience & Quota Failover Matrix

Rate limits and quota cooldowns are a reality across **all** frontier AI models (whether Gemini 4 Argon, Claude Opus 5.5, or GPT-6 Astra). When a model hits its quota limit, your workflow should **never stall**.

`heimdall-agent` enforces an automatic cross-model fallback matrix:

| Task Domain | Primary Flagship | High-Throughput Fallback | Cross-Provider Fallback |
| :--- | :--- | :--- | :--- |
| **Broad Context / Scaffolding** | Gemini 4 Argon (`argon`) | **Gemini 3.1 Pro** (2M context) | Claude Opus 5.5 (`claude-opus-5-5`) |
| **High-Velocity Coding** | Claude Sonnet 5.5 (`claude-sonnet-5-5`) | **Gemini 3.8 Flash** (unlimited throughput) | GPT-6 Astra (`gpt-6-astra`) |
| **Deep Reasoning & Bug Hunting**| Claude Opus 5.5 (`claude-opus-5-5`) | **GPT-6 Astra** (`gpt-6-astra`) | Gemini 3.1 Pro (`gemini-3.1-pro`) |
| **Adversarial Diff Review** | Gemini 4 Argon (`gemini-bridge review`) | **Gemini 3.8 Flash** (`gemini-bridge review`) | GPT-6 Astra (`codex-bridge review`) |
| **Fast Sanity Checks / Scans** | Gemini 3.8 Flash (`gemini-3.8-flash`) | Claude Haiku 4.5 (`claude-haiku-4-5`) | GPT-6 Astra (`gpt-6-astra`) |

---

## 3. Quickstart: 1-Click Bootstrap

On any new workstation or fresh Windows install:

```powershell
# 1. Clone repository
git clone https://github.com/bepaldes/heimdall-agent.git C:\Apps\heimdall-agent
cd C:\Apps\heimdall-agent

# 2. Run interactive setup
node setup.mjs
```

Or run non-interactively with a preset profile:
```powershell
# Full 49-skill multi-agent powerhouse
node setup.mjs --profile full --yes

# Minimal lean setup (Claude only, 15 core skills)
node setup.mjs --profile minimal --agents claude --yes

# Verify current environment health
node setup.mjs --audit
```

---

## 4. Supported AI Runtimes

| Harness | Target Directory | Primary Models | Discovery Mechanism |
| :--- | :--- | :--- | :--- |
| **Google Antigravity** | `~/.gemini/skills/` | Gemini 4 Argon, 3.8 Flash, 3.1 Pro | Dynamic Progressive Disclosure |
| **Claude Code** | `~/.claude/skills/` | Claude Opus 5.5, Sonnet 5.5, Fable 5.1 | Dynamic Progressive Disclosure |
| **OpenAI Codex CLI** | `~/.codex/skills/` | GPT-6 Astra (via GhostCLI) | Dynamic Progressive Disclosure |
| **Shared Multi-Agent** | `~/.agents/skills/` | Universal fallback registry | Universal Hierarchical Traversal |
| **Claude Desktop** | `%APPDATA%\Claude\` | Claude 3.7 / 3.5 Sonnet | Automatic `claude_desktop_config.json` |
| **Web AI & IDEs** | `playbooks/` & `.cursorrules` | Cursor, Windsurf, ChatGPT, Claude Projects | Standalone Prompt Packs |

---

## 5. Companion Tools & Remote Workflow Recommendations

For modern multi-agent development and remote orchestration, `heimdall-agent` integrates smoothly with the following complementary developer tools:

1. **[Herdr (`herdr.dev`)](https://herdr.dev/)**:
   - A terminal-native agent multiplexer written in Rust.
   - Keeps your background agent tasks and terminal panes running persistently on remote servers or workstations even across network disconnects.
   - Monitors agent states (`working`, `blocked`, `idle`) with a clean socket/CLI API.
2. **[Moshi (`getmoshi.app`)](https://getmoshi.app/)**:
   - A specialized mobile SSH and Mosh client (iOS/Android) built specifically for monitoring and steering AI coding agents on the go.
   - Pairs with `tmux` or `herdr` on your machine, enabling push notifications for agent decision gates, prompt approvals from your phone, and voice-to-terminal input.

---

## 6. Desktop & Web AI Playbooks (`playbooks/`)

For AI assistants that don't support dynamic filesystem skill discovery (Claude Desktop, Cursor, ChatGPT, Claude Web Projects), `heimdall-agent` includes copy-pasteable prompt playbooks:

- **[`playbooks/01-interactive-grilling-gate.md`](playbooks/01-interactive-grilling-gate.md)**: Enforces the 3-point questioning gate before any code is generated.
- **[`playbooks/02-fast-code-deep-verification.md`](playbooks/02-fast-code-deep-verification.md)**: Mandates surgical Karpathy implementation paired with deep TDD verification.
- **[`playbooks/03-adversarial-code-review.md`](playbooks/03-adversarial-code-review.md)**: Critical diff review and security sanity checks.
- **[`playbooks/04-design-system-and-taste.md`](playbooks/04-design-system-and-taste.md)**: Design Read declaration, anti-default tokens, and zero-clipping invariants.

---

## 7. Pushing to Your GitHub

To publish this setup to your GitHub account:

```powershell
cd C:\Apps\heimdall-agent
git remote add origin https://github.com/bepaldes/heimdall-agent.git
git push -u origin main
```
