# `heimdall-agent` — Multi-Agent Engineering Sentinel & Environment Bootstrapper

<p align="left">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 18" /></a>
  <a href="#predefined-agents-8-specialized-personas"><img src="https://img.shields.io/badge/agents-8%20predefined-orange.svg?style=flat-square" alt="Agents: 8 Predefined" /></a>
  <a href="#skill-inventory-15-curated-suites--toolkits--50-modules"><img src="https://img.shields.io/badge/skills-15%20suites%20%2850%20modules%29-blueviolet.svg?style=flat-square" alt="Skills: 15 Suites (50 Modules)" /></a>
  <a href="#supported-runtimes"><img src="https://img.shields.io/badge/runtimes-Antigravity%20%7C%20Claude%20%7C%20Codex%20%7C%20Desktop-black.svg?style=flat-square" alt="Runtimes" /></a>
</p>

**Heimdall** is a portable bootstrap toolkit and quality sentinel for multi-agent software engineering. It enforces planning gates before code generation, prevents hallucinated AI slop, isolates module boundaries, and synchronizes **8 predefined specialized agent personas** and **15 curated skill suites (50 modular capabilities)** across **Google Antigravity**, **Claude Code**, **OpenAI Codex CLI**, and **Claude Desktop**.

---

<a id="table-of-contents"></a>
## Table of Contents

- [1. New to AI Coding? Start Here](#1-new-to-ai-coding-start-here)
- [2. The Old Way vs. The Heimdall Way](#2-the-old-way-vs-the-heimdall-way)
- [3. Quickstart: 3 Steps to Better Code](#3-quickstart-3-steps-to-better-code)
- [4. Architecture & Environment Detection](#4-architecture--environment-detection)
- [5. Daily CLI Usage & Complete Parameter Reference](#5-daily-cli-usage--complete-parameter-reference)
- [6. Dynamic Model Registry (`sync-models`)](#6-dynamic-model-registry-sync-models)
- [7. Profiles](#7-profiles)
- [8. Predefined Agent Roster (8 Specialized Personas)](#predefined-agents-8-specialized-personas)
- [9. Supported Runtimes & Cross-Platform Matrix](#supported-runtimes)
- [10. Skill Inventory (15 Curated Suites & Toolkits / 50 Modules)](#skill-inventory-15-curated-suites--toolkits--50-modules)
- [11. Companion Remote Orchestrators & Architectural Memory](#11-companion-remote-orchestrators)
- [License](#license)

---

## 1. New to AI Coding? Start Here

If you have tried coding with AI assistants (ChatGPT, Claude, Cursor, or Copilot), you have likely run into the **Beginner AI Trap**:

1. You ask the AI: *"Build me a user authentication system."*
2. The AI immediately vomits 400 lines of complex, unverified code into your project.
3. The code uses deprecated or hallucinated functions that do not exist in modern libraries.
4. When you paste the error message back, the AI apologizes and writes *another* 400 lines of broken code.
5. You find yourself trapped in an infinite loop of fixing bugs caused by the AI's guesses.

### How Senior Engineers Actually Code with AI

Senior engineers do not let AI models rush into writing code. They force the AI to follow three strict engineering rules:

1. **The Planning Gate (`/grill-me`)**: Forbid the AI from writing a single line of code until it has surfaced hidden assumptions, asked 2–3 probing questions about edge cases, and agreed on architectural tradeoffs.
2. **Karpathy Simplicity**: Keep code minimal, surgical, and clear. Reject speculative bloat, premature configurability, and over-abstracted wrappers.
3. **Slow, Deep Verification**: Never trust an AI when it claims *"it works"*. Require automated tests (TDD failing tests first), visual UI bounds checks, and negative error coverage.

### What Are "Skills"? (In Plain English)

> *Think of a skill like hiring a specialized senior engineer into your AI's prompt.*

Instead of relying on a generic chatbot to guess how to write secure database queries or accessible CSS, Heimdall equips your agent with 49 specialized toolkits. When your AI is asked to touch a database, it automatically activates `postgres-best-practices` (curated by Supabase). When it works on UI, it activates `taste-skill` and `antislop-ui`. When it audits an API, it activates `strix-security`.

[↑ Back to top](#table-of-contents)

---

## 2. The Old Way vs. The Heimdall Way

| Area | Vanilla AI Coding (The Trap) | With Heimdall (The Engineering Standard) |
| :--- | :--- | :--- |
| **Prompt Gate** | AI rushes to generate 300 lines of code immediately. | **Interactive Gate**: AI pauses, asks probing questions, and creates a verified plan. |
| **API Accuracy** | Hallucinates outdated methods from 4-year-old training data. | **Live Context**: Context7 MCP queries real source documentation before writing imports. |
| **Code Style** | AI-slop: redundant comments, excessive abstractions, purple gradients. | **Antislop Guardrails**: Clean, minimal, readable code adhering to your design system. |
| **Verification** | AI claims "done!" blindly; breaks existing features. | **Mandatory Testing**: Writes failing tests first, verifies edge cases, checks error paths. |
| **Architecture** | Scattered duplicate configs drifting across tools. | **Single Source of Truth**: Linked via native junctions; one central repository. |

[↑ Back to top](#table-of-contents)

---

## 3. Quickstart: 3 Steps to Better Code

### Step 1: Install & Bootstrap Heimdall
Open your terminal and run:

```powershell
# 1. Clone repository
git clone https://github.com/bepaldes/heimdall-agent.git
cd heimdall-agent

# 2. Run automated setup with live junctions/symlinks & global CLI shortcut
node setup.mjs --clean --link --yes
```

> **Prefer a guided wizard?** Simply run `node setup.mjs` without flags to interactively choose specific agent harnesses, custom directories, and profile tiers.
>
> **Global terminal access**: Setup automatically places `heimdall` on your PATH (or run `npm link`). You can verify your installation and inspect all options anytime with `heimdall --help`.

### Step 2: Choose Your Profile
* **`full` (Default, 49 skills)**: Complete engineering powerhouse (planning, security, UI, database, hygiene).
* **`minimal` (15 skills)**: Fast and lean for quick tasks or lightweight laptops.
*(See [Section 7: Profiles](#7-profiles) for specialized Security and Design tiers).*

### Step 3: Type Your First Prompt
Open **Google Antigravity**, **Claude Code**, or **Codex**, and try this prompt:
```text
/plan Build a user registration flow. Grill me on edge cases and requirements first.
```
Notice the difference immediately: the AI stops, challenges your assumptions, proposes clean architecture, and writes surgical, tested code.

[↑ Back to top](#table-of-contents)

---

<a id="4-architecture--environment-detection"></a>
## 4. Architecture & Environment Detection

Heimdall dynamically inspects the host system without assuming default locations, hardcoded usernames, or preset credentials:

```
               ┌────────────────────────────────────────────────────────┐
               │                Heimdall Detection Engine              │
               │  • CLI Tools: claude, agy, codex, cursor, windsurf     │
               │  • Desktop: Windows APPDATA / macOS Library / Linux    │
               │  • PATH Discovery: Discovers candidate bin/tool dirs   │
               │  • Endpoints: GhostCLI Proxy / Vendor Direct APIs      │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │               Interactive Selection Gate               │
               │  [1] Target Harnesses (Claude, Gemini, Codex, Desktop) │
               │  [2] Profile Tier (Full, Minimal, Security, Design)    │
               │  [3] Mode: Live Junctions (Single Source) vs Copies    │
               │  [4] Tools & Doctrine Path Auto-Detection              │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                   Atomic Deployment                    │
               │  • 49 Curated Skills (~/.gemini, ~/.claude, ~/.codex)  │
               │  • Context7 MCP live doc resolver                      │
               │  • Subagent briefs & desktop playbooks                 │
               │  • Dynamic model sync (sync-models)                    │
               │  • Global 'heimdall' CLI shortcut on PATH              │
               └────────────────────────────────────────────────────────┘
```

When run interactively (`node setup.mjs`), Heimdall surfaces all detected tools and endpoints before making any changes:

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

[↑ Back to top](#table-of-contents)

---

<a id="5-daily-cli-usage--complete-parameter-reference"></a>
## 5. Daily CLI Usage & Complete Parameter Reference

> **`heimdall` vs. `node setup.mjs`**: They are the **exact same tool**. `heimdall` is the globally accessible terminal shortcut created by `setup.mjs` (or via `npm link`). Any command or flag shown below can be run interchangeably as either `heimdall <command>` or `node setup.mjs <command>`.

### Built-in Terminal Help (`heimdall --help`)

You can view the full interactive reference anytime by running:

```powershell
heimdall --help
# or
heimdall help
# or (from the repository root before global link)
node setup.mjs --help
```

<details open>
<summary><b>Click to preview <code>heimdall --help</code> terminal output</b></summary>

```text
Heimdall Agent CLI — Intelligent Multi-Agent Sentinel & Quality Bootstrapper

USAGE:
  heimdall [command] [options]
  node setup.mjs [command] [options]

Note: 'heimdall' and 'node setup.mjs' are identical. 'heimdall' is the global CLI shortcut.

PRIMARY SUBCOMMANDS:
  sync (or --sync)           Scan PATH for newly installed AI tools and link skills (1-sec zero-drift)
  audit (or --audit)         Audit installed harnesses, active API endpoints, and skill counts
  sync-models (or --sync-models) Probe active proxy/endpoint (e.g. GhostCLI) and refresh models.json
  skills (or --skills)       List all canonical skills, categories, and upstream provenance
  update-skill <name|all>    Inspect upstream repository, updates, and bounded review protocol
  help (or --help, -h)      Display this parameter and command reference

SETUP & BOOTSTRAP OPTIONS:
  --profile <name>       Skill profile tier: full (49), minimal (16), security (12), design (14) [default: full]
  --agents <targets>     Comma-separated harnesses: claude, gemini, codex, desktop, all [default: all]
  --link / --no-link     Use live NTFS junctions / symlinks vs static copies [default: false in wizard, true recommended]
  --clean                Wipe legacy skills from target directory before deploying
  -y, --yes              Non-interactive mode (use defaults or provided CLI arguments)
  --dry-run              Simulate execution without modifying the filesystem
  --tools-dir <dir>      Custom directory to deploy cross-model bridge tools and 'heimdall' CLI
  --doctrine-path <file> Custom file destination for AGENTS.md universal doctrine
  --no-tools             Skip deploying bridge tools and CLI shims
  --no-doctrine          Skip deploying AGENTS.md universal doctrine

EXAMPLES:
  heimdall sync                             # Instant sync after installing a new tool
  heimdall audit                            # Environment health check
  heimdall skills                           # Browse canonical skills catalog
  heimdall update-skill ponytail           # Inspect upstream provenance & review protocol for single skill
  heimdall update-skill all                # Generate full bounded review audit report
  heimdall sync-models                      # Refresh model catalogs
  node setup.mjs --clean --link --yes       # Recommended full automated setup with live junctions
  node setup.mjs --profile minimal --yes    # Minimal install for lightweight laptop
```

</details>

---

### Primary Subcommands

All primary actions can be called either as clean subcommands (`heimdall sync`) or as flags (`heimdall --sync`):

| Subcommand | Flag Alias | Description | Example |
| :--- | :--- | :--- | :--- |
| **`sync`** | `--sync` | Scans `PATH` for newly installed AI tools and links canonical skills in 1 second. | `heimdall sync` |
| **`audit`** | `--audit` | Audits installed harnesses, active API endpoints, link types, and skill counts. | `heimdall audit` |
| **`sync-models`** | `--sync-models` | Probes active proxy/endpoints (e.g. GhostCLI) and refreshes `config/models.json`. | `heimdall sync-models` |
| **`skills`** | `--skills` | Lists all 49 canonical skills, categories, and upstream repositories. | `heimdall skills` |
| **`update-skill`** | `--update-skill` | Inspects upstream git sources, updates, and bounded review protocols. | `heimdall update-skill all` |
| **`help`** | `--help`, `-h` | Displays the terminal help manual with all parameters and syntax. | `heimdall help` |

---

### Real-World Recipes & Practical Examples

#### Recipe 1: Fresh 1-Liner Installation (Recommended)
Deploys all 49 canonical skills across all detected agent harnesses using live NTFS junctions (Windows) or POSIX symlinks (macOS/Linux), cleans up any stale legacy copies, and registers the global `heimdall` CLI:
```powershell
node setup.mjs --profile full --link --clean --yes
```

#### Recipe 2: Adding a Newly Installed AI Tool Later (Zero-Drift Auto-Sync)
If you only have Claude Code installed today, and later install **Google Antigravity** or **OpenAI Codex**, never re-install from scratch. Just run:
```powershell
heimdall sync
```
Heimdall detects the new binary on `PATH` and links all 49 skills in under 1 second.

#### Recipe 3: Checking Ecosystem Health & Endpoint Verification
Verifies which harnesses are active, which API endpoints are probed, whether skills are live junctions or static copies, and checks doctrine file status:
```powershell
heimdall audit
```

#### Recipe 4: Lightweight Laptop Setup (Minimal Profile)
For smaller context windows or fast local tasks, deploy the lean 15-skill profile (planning, Karpathy simplicity, TDD, antislop) targeted only to Claude Code and Gemini:
```powershell
node setup.mjs --profile minimal --agents claude,gemini --link --yes
```

#### Recipe 5: Safe Non-Destructive Dry Run
Inspect exactly which directories, junctions, and configs would be touched without modifying the filesystem:
```powershell
node setup.mjs --dry-run --yes
```

#### Recipe 6: Refresh Live Model Catalog from Proxy/Vendor
Fetches dynamic models (e.g. `gemini-4`, `claude-opus-5-5`, `gpt-6-astra`) from your active endpoint (e.g. GhostCLI) and syncs `config/models.json`:
```powershell
heimdall sync-models
```

#### Recipe 7: Headless Docker & CI Container Bootstrapping
Automate deployment in container builds or CI runners with custom directories:
```bash
node setup.mjs --profile full --tools-dir /usr/local/bin --doctrine-path /workspace/AGENTS.md --clean --yes
```

---

### Complete Parameter Reference Table (`node setup.mjs` / `heimdall`)

These flags can be passed to either `node setup.mjs` or `heimdall` for headless automation, CI/CD pipelines, or custom configurations:

| Parameter | Type | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| **`--profile <name>`** | String | `full` | Skill profile tier: `full` (49 skills), `minimal` (15), `security` (12), or `design` (14). | `--profile minimal` |
| **`--agents <targets>`** | String | `all` | Comma-separated list of harnesses to configure: `claude`, `gemini`, `codex`, `desktop`, or `all`. | `--agents claude,gemini` |
| **`--link`** | Flag | `false`* | Deploy skills using live NTFS junctions (Windows) or POSIX symlinks (macOS/Linux). *(Recommended)* | `--link` |
| **`--no-link`** | Flag | `true`* | Deploy skills as independent physical directory copies instead of live junctions. | `--no-link` |
| **`--clean`** | Flag | `false` | Wipes existing legacy skills in target directories before installing (preserves vendor files). | `--clean` |
| **`-y`, `--yes`** | Flag | `false` | Non-interactive mode (skips interactive wizard prompts and applies defaults or passed flags). | `--yes` |
| **`--dry-run`** | Flag | `false` | Simulates the full installation and prints planned actions without touching the filesystem. | `--dry-run` |
| **`--tools-dir <dir>`** | Path | Auto (`PATH`) | Custom destination directory to deploy cross-model bridge tools and global `heimdall` CLI shim. | `--tools-dir ~/.local/bin` |
| **`--doctrine-path <file>`** | Path | Auto (`AGENTS.md`) | Custom destination path for `AGENTS.md` universal doctrine. | `--doctrine-path ~/.agents/AGENTS.md` |
| **`--no-tools`** | Flag | `false` | Skips installing cross-model bridge tools and CLI shims. | `--no-tools` |
| **`--no-doctrine`** | Flag | `false` | Skips deploying `AGENTS.md` universal doctrine. | `--no-doctrine` |

*Note: In the interactive wizard (`node setup.mjs`), Live Junctions (`--link`) is the recommended prompt default. In non-interactive mode without flags, specify `--link` to enable symlinks.

[↑ Back to top](#table-of-contents)

---

<a id="6-dynamic-model-registry-sync-models"></a>
## 6. Dynamic Model Registry (`sync-models`)

Rather than relying on outdated static model lists, Heimdall discovers available model catalogs dynamically from active provider or proxy endpoints (e.g. GhostCLI, LiteLLM, or native vendor APIs):

```powershell
heimdall sync-models
```

This queries live catalog endpoints, registers new models (e.g. `gemini-4`, `claude-opus-5-5`, `gpt-6-astra`), and updates `config/models.json` automatically.

[↑ Back to top](#table-of-contents)

---

<a id="7-profiles"></a>
## 7. Profiles

| Profile | Skills | Predefined Agents | Primary Focus | Best For |
| :--- | :---: | :---: | :--- | :--- |
| **`full`** | 15 Suites (50 modules) | 8 (All) | Complete engineering suite: planning, antislop, design, security, hygiene, database | Everyday development across all runtimes |
| **`minimal`** | 16 modules | 4 | Lean core: `orchestrator`, `tester`, `code-sentinel`, `reviewer` | Fast workflows, lightweight laptops, beginners |
| **`security`** | 12 modules | 4 | Security posture: `orchestrator`, `security-auditor`, `tester`, `reviewer` | Penetration testing & pre-deployment audits |
| **`design`** | 14 modules | 4 | Frontend & mobile: `orchestrator`, `frontend-designer`, `mobile-designer`, `code-sentinel` | Frontend development & design system work |

[↑ Back to top](#table-of-contents)

---

<a id="predefined-agents-8-specialized-personas"></a>
## 8. Predefined Agent Roster (8 Specialized Personas)

Heimdall equips your engineering harnesses with **8 specialized, model-agnostic agent personas**. Each agent is pre-configured with explicit behavioral contracts and bound to a curated subset of Heimdall's 50 skills.

### Model-Agnostic Execution (`model: inherit`)
To prevent vendor lock-in and support single-vendor setups, all agent contracts declare `model: inherit` (or omit `model:`):
* **Single-Vendor Autonomy**: If your machine only runs **Google Antigravity (`agy`)**, all agents execute on your active Gemini model. If you only run **OpenAI Codex CLI**, they run on your active Codex model. They will **never** fail by attempting to reach an unconfigured external vendor.
* **Per-Harness Capability Mapping**: [`config/agents.json`](config/agents.json) defines runtime-specific preferences so multi-model setups automatically dispatch the optimal model per task.

| Persona | Capability Tier | Key Role & Contract | Associated Skill Bundle |
| :--- | :--- | :--- | :--- |
| **`orchestrator`** | `deep_reasoning` | Planning gatekeeper (`/grill-me`), requirements interrogation, modular task decomposition, and subagent handoffs. | `brainstorming`, `writing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees`, `writing-skills` |
| **`frontend-designer`** | `high_polish_vision` | Enforces Section 0.B "Design Read", design token mappings, typographic hierarchy, and anti-slop UI aesthetics for web surfaces. | `taste-skill`, `taste-skill-v1`, `gpt-tasteskill`, `brandkit`, `minimalist-skill`, `brutalist-skill`, `soft-skill`, `antislop-ui`, `antislop-human`, `stitch-skill`, `image-to-code-skill`, `imagegen-frontend-web`, `redesign-skill` |
| **`mobile-designer`** | `responsive_flex_safety` | Dedicated to mobile viewports (320px–430px), minimum 48px touch targets, zero-clipping overflow flex containers, and responsive assets. | `antislop-layoutmobile`, `antislop-human`, `antislop-ui`, `imagegen-frontend-mobile`, `taste-skill` |
| **`tester`** | `fast_verification` | Enforces Test-Driven Development (TDD). Mandates authoring failing automated tests *before* code logic, plus boundary and negative coverage. | `test-driven-development`, `verification-before-completion`, `systematic-debugging`, `executing-plans` |
| **`security-auditor`** | `deep_assurance_audit` | Dynamic differential HTTP probing (anonymous vs unprivileged vs admin), OWASP Top 10 defenses, and Trail of Bits insecure defaults detection. | `strix-security`, `security-audit-sweep`, `owasp-security`, `cloudflare-security-audit`, `snyk-agent-scan`, `trailofbits-audit-context`, `trailofbits-insecure-defaults`, `trailofbits-triage-brocards` |
| **`database-architect`** | `schema_migration_safety` | Governs non-destructive schema migrations, normalization, query plan audits (`EXPLAIN ANALYZE`), and connection pooling (Postgres/Supabase, SQLite, MySQL, NoSQL). | `postgres-best-practices`, `systematic-debugging`, `karpathy-guidelines` |
| **`code-sentinel`** | `surgical_restraint` | Karpathy simplicity: writes minimal surgical code, strips boilerplate comments and defensive dead-code, and purges AI slop. | `karpathy-guidelines`, `ponytail`, `antislop`, `antislop-code`, `antislop-copywriting`, `antislop-human`, `finishing-a-development-branch` |
| **`reviewer`** | `adversarial_diff_eval` | Performs adversarial diff analysis, catches silent regressions, verifies test assertions, and coordinates cross-model validation reviews. | `requesting-code-review`, `receiving-code-review`, `claude-collaborator`, `gemini-collaborator`, `codex-collaborator`, `using-superpowers`, `diagnosing-superpowers`, `output-skill` |

### How Agents Are Deployed
Running `node setup.mjs --clean --link --yes` (or `heimdall sync`) links all 8 agent contracts via Live Junctions into:
* **Claude Code**: `~/.claude/agents/` (natively invokable by name)
* **Google Antigravity**: `~/.gemini/agents/` & universal `.agents/`
* **OpenAI Codex CLI**: `~/.codex/agents/`
* **Shared Multi-Agent**: `~/.agents/agents/`

[↑ Back to top](#table-of-contents)

---

<a id="supported-runtimes"></a>
## 9. Supported Runtimes & Cross-Platform Matrix

Heimdall operates across **Windows**, **macOS**, and **Linux**. It automatically selects native directory junctions (`junction`) on Windows or standard directory symlinks (`ln -s`) on POSIX systems.

| Harness | Deployment Target (Windows / macOS / Linux) | Integration Mechanism |
| :--- | :--- | :--- |
| **Google Antigravity** | `~/.gemini/skills/` | Dynamic Progressive Disclosure (Junction / Symlink) • Google OAuth Native |
| **Claude Code** | `~/.claude/skills/` | Dynamic Progressive Disclosure (Junction / Symlink) |
| **OpenAI Codex CLI** | `~/.codex/skills/` | Dynamic Progressive Disclosure (Junction / Symlink) |
| **Shared Multi-Agent** | `~/.agents/skills/` | Hierarchical Workspace Traversal |
| **Claude Desktop** | Windows: `%APPDATA%\Claude\`<br>macOS: `~/Library/Application Support/Claude/`<br>Linux: `~/.config/Claude/` | Automated `claude_desktop_config.json` + Playbooks |
| **IDEs / Editors** | Workspace Root | Standalone Playbooks & Cursorrules |

### Consumer Desktop Chat Apps vs. Agentic Coding CLIs

A common point of confusion is the distinction between consumer desktop chat apps and developer agent CLIs:

* **Gemini for Desktop (`gemini.google/desktop`) & ChatGPT Desktop**:
  * These are consumer chat GUIs. They run in sandboxed webviews/Electron environments and do **not** support automated local skill directory loading (`~/.<tool>/skills`) or arbitrary local shell tool execution loops.
  * *To use Heimdall principles with them*: Upload [`doctrine/AGENTS.md`](doctrine/AGENTS.md) or specific playbooks from [`playbooks/`](playbooks/) into a **Gemini Custom Gem** or **ChatGPT Project / Custom GPT** system prompt.
* **Google Antigravity (`agy`), Claude Code (`claude`), & OpenAI Codex CLI (`codex`)**:
  * These are full autonomous agent harnesses with terminal access, progressive skill disclosure, and filesystem mutation capabilities. Heimdall is engineered natively for these runtimes.

### OpenAI Codex CLI on Windows

OpenAI Codex CLI operates cleanly on Windows within Heimdall's multi-agent matrix:
1. **Binary Detection**: Heimdall automatically discovers `codex.exe` on `PATH`, `%LOCALAPPDATA%\Programs\OpenAI\Codex\bin\codex.exe`, or `%USERPROFILE%\.codex\packages\standalone\current\bin\codex.exe`.
2. **Windows Sandboxing Flag**: Unlike macOS (Seatbelt) or Linux (Landlock/Bubblewrap), Windows does not possess native POSIX sandbox isolation primitives. For headless cross-agent reviews and automated non-interactive tasks, [`tools/codex-bridge.ps1`](tools/codex-bridge.ps1) executes Codex with `--dangerously-bypass-approvals-and-sandbox` to allow uninterrupted execution.
3. **Endpoint Flexibility**: Codex can route either to official OpenAI endpoints or via GhostCLI (`https://ghostcli.cloud/v1`) using the `gpt-6-astra` model catalog.
4. **NTFS Junctions**: All 49 skills are linked directly into `%USERPROFILE%\.codex\skills` as NTFS junctions, ensuring zero file duplication and instantaneous sync.

### Linux & macOS Parity

* **Installer**: `setup.mjs` runs on Node.js >= 18 on all OSes, dynamically selecting `which` vs `where.exe`, and creating native directory symlinks.
* **Bridge Scripts**: `tools/` contains native Windows wrappers (`.cmd`, `.ps1`) and portable POSIX shell shims (`claude-bridge.sh`, `gemini-bridge.sh`, `codex-bridge.sh`) that invoke PowerShell Core (`pwsh`).
* **Skills**: 100% platform-agnostic Markdown, Python, and shell scripts.

[↑ Back to top](#table-of-contents)

---

<a id="skill-inventory-15-curated-suites--toolkits--50-modules"></a>
## 10. Skill Inventory (15 Curated Suites & Toolkits / 50 Modules)

Heimdall organizes capabilities into **15 Primary Toolkits & Suites (50 modular capabilities)**. For full trigger conditions, descriptions, and upstream repository links for every skill, see the complete [Skills Directory](docs/SKILLS.md).

<details open>
<summary><b>1. Superpowers Engineering Suite (10 planning & verification modules)</b></summary>

- `brainstorming`: Surfaces implicit assumptions and explores alternatives before design lock.
- `writing-plans`: Structures modular, bite-sized tasks with verifiable completion criteria.
- `executing-plans`: Enforces step-by-step verification and halts execution upon unexpected failures.
- `karpathy-guidelines`: Demands minimal surgical edits and rejects speculative configurability.
- `ponytail`: Pragmatic senior developer YAGNI code restraint and anti-bloat Decision Ladder.
- `test-driven-development`: Requires failing automated tests prior to implementation logic.
- `systematic-debugging`: Isolates root causes using scientific hypothesis testing.
- `verification-before-completion`: Mandates passing test suites and live verification before claiming completion.
- `finishing-a-development-branch`: Verifies branch hygiene, tests, and documentation before merge.
- `using-git-worktrees`: Manages parallel agent execution branches without dirtying working trees.

</details>

<details>
<summary><b>2. Anti-Slop Quality & Token Efficiency Suite (7 modules)</b></summary>

- `antislop`: Core guardrail prohibiting generic AI filler, fake buzzwords, and decorative bloat.
- `antislop-code`: Prohibits redundant comments, defensive dead code, and speculative abstractions.
- `antislop-copywriting`: Bans AI buzzwords (*unlock, elevate, robust*), signposting, and fake authority tropes.
- `antislop-ui`: Rejects generic purple gradients, uniform pill radius, and unmotivated dark modes.
- `antislop-human`: Enforces WCAG AAA contrast, semantic HTML, and accessible interactive targets.
- `antislop-layoutmobile`: Guarantees responsive flex safety, zero clipping, and touch-target padding.
- `caveman`: Token-efficiency protocol slashing conversational ceremony while preserving code and tool payloads.

</details>

<details>
<summary><b>3. Taste Design & Aesthetic Studio (12 modules)</b></summary>

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
<summary><b>4. Security & Differential Probing (8 modules)</b></summary>

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
<summary><b>5. Architecture, Database & Platform (3 modules)</b></summary>

- `postgres-best-practices`: Supabase-curated guidelines for indexing, connection pooling, and migrations.
- `project-hygiene`: Audits recoverable disk space, detects dead code, and purges build caches.
- `output-skill`: Structured output formatting for complex analysis artifacts.

</details>

<details>
<summary><b>6. Multi-Agent Orchestration & Cross-Model Bridges (10 modules)</b></summary>

- `subagent-driven-development`: Decomposes large tasks into isolated subagents with specialized briefs.
- `dispatching-parallel-agents`: Coordinates concurrent subagent workers on independent branches.
- `claude-collaborator`: Cross-model delegation bridge to Claude Opus / Sonnet for deep review.
- `gemini-collaborator`: Cross-model delegation bridge to Gemini for high-velocity workspace scans.
- `codex-collaborator`: Cross-model delegation bridge to OpenAI Codex CLI (Astra) for adversarial reviews.
- `requesting-code-review`: Formats structured diff context for adversarial peer review.
- `receiving-code-review`: Parses peer critiques objectively and implements verified recommendations.
- `using-superpowers`: Multi-agent operational playbook for complex software development.
- `diagnosing-superpowers`: Health check and triage harness for agent tooling and skill resolution.
- `writing-skills`: Authors new modular skills adhering to standard frontmatter and trigger contracts.

</details>

[↑ Back to top](#table-of-contents)

---

<a id="11-companion-remote-orchestrators"></a>
## 11. Companion Remote Orchestrators & Architectural Memory

For multi-device pair programming, mobile monitoring, and project memory, Heimdall integrates with:

- **[Herdr (`herdr.dev`)](https://herdr.dev/)**: A terminal-native agent multiplexer written in Rust. Keeps background agent sessions persistent across connection drops and tracks status (`working`, `blocked`, `idle`).
- **[Moshi (`getmoshi.app`)](https://getmoshi.app/)**: A mobile client (iOS/Android) pairing with your terminal session. Delivers push notifications when an agent hits an interactive planning gate and enables remote approval.
- **[Graphify (`github.com/Graphify-Labs/graphify`)](https://github.com/Graphify-Labs/graphify)**: An open-source, local-first code knowledge graph builder. Uses Tree-sitter AST parsing across 40+ programming languages to build deterministic dependency maps with zero LLM API costs, and exports directly to Obsidian vaults (`--obsidian`).
- **[Obsidian (`obsidian.md`)](https://obsidian.md/)**: A local-first, extensible Markdown knowledge base. Paired with Graphify-generated vaults (`[[wikilinks]]`), it serves as persistent external memory for AI coding agents (like Claude Code), loading immediate architectural context on startup without expensive token scanning.

[↑ Back to top](#table-of-contents)

---

<a id="license"></a>
## License

MIT © [Bernardo Paldes](https://github.com/bepaldes)

[↑ Back to top](#table-of-contents)
