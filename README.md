# `heimdall-agent` — Multi-Agent Engineering Sentinel & Environment Bootstrapper

<p align="left">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 18" /></a>
  <a href="#skill-inventory-49-curated-skills"><img src="https://img.shields.io/badge/skills-49%20frozen-blueviolet.svg?style=flat-square" alt="Skills: 49 Frozen" /></a>
  <a href="#supported-runtimes"><img src="https://img.shields.io/badge/runtimes-Antigravity%20%7C%20Claude%20%7C%20Codex%20%7C%20Desktop-black.svg?style=flat-square" alt="Runtimes" /></a>
</p>

**Heimdall** is a portable bootstrap toolkit and quality sentinel for multi-agent software engineering. It enforces planning gates before code generation, prevents hallucinated AI slop, isolates module boundaries, and synchronizes 49 version-frozen skills across **Google Antigravity**, **Claude Code**, **OpenAI Codex CLI**, and **Claude Desktop**.

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

---

## 2. The Old Way vs. The Heimdall Way

| Area | Vanilla AI Coding (The Trap) | With Heimdall (The Engineering Standard) |
| :--- | :--- | :--- |
| **Prompt Gate** | AI rushes to generate 300 lines of code immediately. | **Interactive Gate**: AI pauses, asks probing questions, and creates a verified plan. |
| **API Accuracy** | Hallucinates outdated methods from 4-year-old training data. | **Live Context**: Context7 MCP queries real source documentation before writing imports. |
| **Code Style** | AI-slop: redundant comments, excessive abstractions, purple gradients. | **Antislop Guardrails**: Clean, minimal, readable code adhering to your design system. |
| **Verification** | AI claims "done!" blindly; breaks existing features. | **Mandatory Testing**: Writes failing tests first, verifies edge cases, checks error paths. |
| **Architecture** | Scattered duplicate configs drifting across tools. | **Single Source of Truth**: Linked via native junctions; one central repository. |

---

## 3. Your First Day: 3 Steps to Better Code

### Step 1: Install Heimdall on Your Machine
Open your terminal and run:
```powershell
git clone https://github.com/bepaldes/heimdall-agent.git
cd heimdall-agent
node setup.mjs
```
Heimdall inspects your machine, detects your installed AI tools, and links all 49 skills.

### Step 2: Choose Your Profile
* **`full` (Default, 49 skills)**: Complete engineering powerhouse (planning, security, UI, database, hygiene).
* **`minimal` (15 skills)**: Fast and lean for quick tasks or lightweight laptops.

### Step 3: Type Your First Prompt
Open **Claude Code**, **Google Antigravity**, or **Codex**, and try this prompt:
```text
/plan Build a user registration flow. Grill me on edge cases and requirements first.
```
Notice the difference immediately: the AI stops, challenges your assumptions, proposes clean architecture, and writes surgical, tested code.

---

## 4. Architecture & Pipeline

Heimdall dynamically adapts to any user's directory structure without hardcoded paths:

```
               ┌────────────────────────────────────────────────────────┐
               │                Heimdall Detection Engine              │
               │  • CLI Tools: claude.exe, agy.exe, codex.exe, cursor   │
               │  • Desktop: %APPDATA%\Claude                           │
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
               │  • Dynamic model sync (--sync-models)                  │
               │  • Global 'heimdall' CLI shortcut on PATH              │
               └────────────────────────────────────────────────────────┘
```

---

## 5. Interactive Environment Detection

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

## 6. Quickstart & CLI Usage

### Interactive Setup
```powershell
# 1. Clone repository
git clone https://github.com/bepaldes/heimdall-agent.git
cd heimdall-agent

# 2. Run interactive setup
node setup.mjs
```

### Global CLI Installation
You can use Heimdall as a global command from any terminal:
```powershell
# Option A: Run setup with live NTFS junctions & global shortcut
node setup.mjs --clean --link --yes

# Option B: Standard npm global link
npm link
```
Now you can run `heimdall` anywhere:
```powershell
heimdall sync             # 1-second auto-sync: detects newly installed tools and links skills
heimdall --audit          # Verify health of all agent harnesses and auth status
heimdall --sync-models    # Fetch latest models from active proxy/vendor
```

### Future Tool Installation & Zero-Drift Sync
If you only have one tool installed today (e.g., Claude Code), and later install **Google Antigravity** or **OpenAI Codex**, you never have to re-configure Heimdall from scratch. Simply run:
```powershell
heimdall sync
```
Heimdall scans your `PATH`, detects the new tool binaries, and immediately links all 49 skills and MCP configurations. Furthermore, `heimdall --audit` proactively detects if any newly installed tool is missing skill links and prompts you to run `heimdall sync`.

### Headless & CI Installation Flags
Automate setup using profiles and non-interactive flags:
```powershell
# Full 49-skill deployment with live junctions across all detected tools
node setup.mjs --profile full --link --clean --yes

# Minimal setup targeted to Claude Code only
node setup.mjs --profile minimal --agents claude --yes

# Custom tool directory and doctrine paths
node setup.mjs --tools-dir ~/.local/bin --doctrine-path ~/.agents/AGENTS.md --yes

# Verify current environment health
node setup.mjs --audit
```

---

## 7. Dynamic Model Registry (`--sync-models`)

Rather than relying on outdated static model lists, Heimdall discovers available model catalogs dynamically from active provider or proxy endpoints (e.g. GhostCLI, LiteLLM, or native vendor APIs):

```powershell
heimdall --sync-models
```

This queries live catalog endpoints, registers new models (e.g. `gemini-4`, `claude-opus-5-5`, `gpt-6-astra`), and updates `config/models.json` automatically.

---

## 8. Profiles

| Profile | Skills | Primary Focus | Best For |
| :--- | :---: | :--- | :--- |
| **`full`** | 49 | Complete engineering suite: planning, antislop, design, security, hygiene, database | Everyday development across all runtimes |
| **`minimal`** | 15 | Lean core: planning, Karpathy simplicity, TDD, antislop, hygiene | Fast workflows, lightweight laptops, beginners |
| **`security`** | 12 | Differential HTTP probing, OWASP top 10, Snyk scans, Trail of Bits checks | Penetration testing & pre-deployment audits |
| **`design`** | 14 | Design tokens, responsive layouts, motion curves, antislop UI rules | Frontend development & design system work |

---

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

---

## 10. Skill Inventory (49 Curated Skills)

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

## 11. Companion Remote Orchestrators

For multi-device pair programming and mobile monitoring, Heimdall integrates with:

- **[Herdr (`herdr.dev`)](https://herdr.dev/)**: A terminal-native agent multiplexer written in Rust. Keeps background agent sessions persistent across connection drops and tracks status (`working`, `blocked`, `idle`).
- **[Moshi (`getmoshi.app`)](https://getmoshi.app/)**: A mobile client (iOS/Android) pairing with your terminal session. Delivers push notifications when an agent hits an interactive planning gate and enables remote approval.

---

## License

MIT © [Bernardo Paldes](https://github.com/bepaldes)
