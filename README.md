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

## 2. Interactive Tool & Environment Auto-Detection

Heimdall **does not assume** what tools or endpoints you run. When you run `node setup.mjs`, it scans your system:
- **CLI Tools on PATH**: Detects `claude.exe`, `agy.exe`, `codex.exe`, `cursor`, `windsurf`.
- **Desktop Apps**: Checks for Claude Desktop (`%APPDATA%\Claude`).
- **Active Endpoints & Keys**: Inspects whether you use custom proxies (e.g. GhostCLI, LiteLLM) or official vendor APIs.

It then presents an interactive menu and **asks you** where you want it installed:

```
==================================================
        Heimdall Environment Detection
==================================================
[✔] Claude Code CLI     -> Found (C:\Users\Bernardo\.local\bin\claude.exe)
                           Endpoint: https://ghostcli.cloud
[✔] Google Antigravity  -> Found (C:\Users\Bernardo\AppData\Local\agy\bin\agy.exe)
                           Endpoint: Google GenAI Direct
[✔] OpenAI Codex CLI    -> Found (C:\Users\Bernardo\AppData\Local\Programs\OpenAI\Codex\bin\codex.exe)
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

You stay in full control. If you choose `2`, Heimdall touches *only* `~/.claude/skills/` and leaves other tools intact.

---

## 3. Dynamic Model Syncing (`--sync-models`)

Whenever new models drop on your proxy or provider, run:
```powershell
node setup.mjs --sync-models
```
Heimdall queries live endpoints (e.g. `https://ghostcli.cloud/v1/models`), discovers new model IDs dynamically, and refreshes `config/models.json` with zero manual editing.

---

## 4. Quickstart: 1-Click Bootstrap

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

## 5. Supported AI Runtimes

| Harness | Target Directory | Discovery Mechanism |
| :--- | :--- | :--- |
| **Google Antigravity** | `~/.gemini/skills/` | Dynamic Progressive Disclosure |
| **Claude Code** | `~/.claude/skills/` | Dynamic Progressive Disclosure |
| **OpenAI Codex CLI** | `~/.codex/skills/` | Dynamic Progressive Disclosure |
| **Shared Multi-Agent** | `~/.agents/skills/` | Universal Hierarchical Traversal |
| **Claude Desktop** | `%APPDATA%\Claude\` | Automatic `claude_desktop_config.json` |
| **Web AI & IDEs** | `playbooks/` & `.cursorrules` | Standalone Prompt Packs |

---

## 6. Profiles

Configure exactly which capabilities to deploy:

- **`full` (Default, 49 skills)**: Everything. Process, Anti-Slop, Design Systems, Differential Security, Hygiene, Postgres Best Practices, and Cross-Agent Bridges.
- **`minimal` (15 skills)**: Fast, lean, and surgical. Planning, TDD, Anti-Slop, Taste-Skill, and Project Hygiene.
- **`security` (12 skills)**: Penetration testing, Strix differential HTTP probing, OWASP, Snyk, and Trail of Bits audits.
- **`design` (14 skills)**: Frontend design engineering, token enforcement, GSAP motion, and Brandkit.

---

## 7. Companion Remote Orchestrators

For remote pair programming and mobile monitoring, `heimdall-agent` pairs cleanly with:

1. **[Herdr (`herdr.dev`)](https://herdr.dev/)**:
   - A terminal-native agent multiplexer in Rust.
   - Keeps your background agent tasks and panes alive across network drops and tracks agent state (`working`, `blocked`, `idle`).
2. **[Moshi (`getmoshi.app`)](https://getmoshi.app/)**:
   - A specialized mobile client (iOS/Android) pairing with `herdr` or `tmux`.
   - Receive push notifications on plan gates, approve prompts from your phone, and use voice-to-terminal input.

---

## 8. Pushing to Your GitHub

To publish this setup to your GitHub account:

```powershell
cd C:\Apps\heimdall-agent
git remote add origin https://github.com/bepaldes/heimdall-agent.git
git push -u origin main
```
