# `heimdall-agent` — Autonomous Multi-Agent Sentinel & Quality Bootstrapper

> Named after **Heimdall**, the all-seeing Norse guardian sentinel who perceives every sound, sees across all realms, and guards the Bifröst with unyielding vigilance. In your development environment, `heimdall-agent` guards against hallucinated AI slop, enforces boundary contracts, and orchestrates multi-agent pairing across **Google Antigravity**, **Claude Code**, and **OpenAI Codex CLI**.

---

## 1. Quickstart: 1-Click Bootstrap

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
# Full 48-skill multi-agent powerhouse
node setup.mjs --profile full --yes

# Minimal lean setup (Claude only, 15 core skills)
node setup.mjs --profile minimal --agents claude --yes

# Verify current environment health
node setup.mjs --audit
```

---

## 2. Supported AI Runtimes

| Harness | Family | Target Directory | Discovery Mechanism |
| :--- | :--- | :--- | :--- |
| **Google Antigravity** | Gemini 4 Argon / Gemini 3.8 Flash / Gemini 3.1 Pro | `~/.gemini/skills/` | Dynamic Progressive Disclosure |
| **Claude Code** | Claude Opus 5.5 / Claude Sonnet 5.5 / Fable 5.1 | `~/.claude/skills/` | Dynamic Progressive Disclosure |
| **OpenAI Codex CLI** | GPT-6 Astra (via GhostCLI) | `~/.codex/skills/` | Dynamic Progressive Disclosure |
| **Shared Multi-Agent** | Portable fallback | `~/.agents/skills/` | Universal Hierarchical Traversal |
| **Claude Desktop / Web**| Claude 3.7 / 3.5 Sonnet | `%APPDATA%\Claude\` & `playbooks/` | System Instructions & MCP Config |

---

## 3. Profiles

Configure exactly which capabilities to deploy:

- **`full` (Default, 48 skills)**: Everything. Process, Anti-Slop, Design Systems, Differential Security, Hygiene, and Cross-Agent Bridges.
- **`minimal` (15 skills)**: Fast, lean, and surgical. Planning, TDD, Anti-Slop, Taste-Skill, and Project Hygiene.
- **`security` (12 skills)**: Penetration testing, Strix differential HTTP probing, OWASP, Snyk, and Trail of Bits audits.
- **`design` (14 skills)**: Frontend design engineering, token enforcement, GSAP motion, and Brandkit.

---

## 4. Desktop & Web AI Playbooks (`playbooks/`)

For AI assistants that don't support dynamic filesystem skill discovery (Claude Desktop, Cursor, ChatGPT, Claude Web Projects), `heimdall-agent` includes copy-pasteable prompt playbooks:

- **`playbooks/01-interactive-grilling-gate.md`**: Enforces the 3-point questioning gate before any code is generated.
- **`playbooks/02-fast-code-deep-verification.md`**: Mandates surgical Karpathy code paired with deep TDD verification.
- **`playbooks/03-adversarial-code-review.md`**: Critical diff review and security sanity checks.
- **`playbooks/04-design-system-and-taste.md`**: Design Read declaration, anti-default tokens, and zero-clipping overflow protection.

---

## 5. Universal Doctrine (`doctrine/AGENTS.md`)

`heimdall-agent` installs the universal cross-agent doctrine at `C:\Apps\AGENTS.md`, establishing:
1. **Interactive Grilling Gate**: Forbids unreviewed code generation.
2. **Quota Resilience**: Instant fallback when Gemini 4 reaches quota limits (Gemini 3.8 Flash, 3.1 Pro, Claude Sonnet 5.5, GPT-6 Astra).
3. **Specialized Subagent Roles**: Designer, Tester, Security Auditor, Code Hygiene, and Adversarial Reviewer.
4. **Cross-Model Bridge Tools**: Bi-directional review loops via `claude-bridge`, `gemini-bridge`, and `codex-bridge`.

---

## 6. Pushing to Your GitHub

To link this local setup to your GitHub account:

```powershell
cd C:\Apps\heimdall-agent
git init
git add .
git commit -m "feat: initial release of heimdall-agent multi-agent sentinel"
git branch -M main
git remote add origin https://github.com/bepaldes/heimdall-agent.git
git push -u origin main
```
