# Plan: Heimdall ANSI TUI, Strict Harness Scoping & Multi-Account Profiles

**Date:** 2026-11-25  
**Status:** COMPLETED (2026-11-25)  
**Author:** Gemini 4 Hydrogen  
**Scope:** `setup.mjs`, `lib/tui.cjs`, `lib/profiles.cjs`, `lib/harness-detection.cjs`, `lib/installer-engine.cjs`, `lib/interactive-menu.cjs`, `lib/mcp-installer.cjs`, `lib/hud-sync.cjs`, `lib/herdr-programs.cjs`, `scripts/resolve-mcp.mjs`, `test/`

---

## 1. Active Skills & Directives Checklist
- [x] `karpathy-guidelines` — Minimal, surgical edits to existing `lib/` boundaries; zero speculative bloat
- [x] `communication-doctrine` — BLUF macro layout, STE imperative steps (<=20 words), zero vague qualifiers
- [x] `antislop` — Clean comments, zero runtime dependencies, concise single-purpose helpers
- [x] `codebase-design` — Deep module boundaries (`lib/tui.cjs`, `lib/profiles.cjs`)
- [x] `test-driven-development` — Failing unit tests first for TUI state logic, profile isolation, and strict scoping
- [x] `verification-before-completion` — Non-interactive terminating verification only (`npm test`, `--dry-run` CLI gates)

---

## 2. Context & Settled Design Decisions
- **UI Architecture:** Zero-dependency Node.js ANSI TUI (raw stdin keypresses, arrow-key navigation, spacebar multi-select checkboxes) with a 3-item main hub (`1. Express Sync`, `2. Configure Harnesses & Profiles`, `3. Tools & Maintenance`) and 1-step Express install. Non-TTY fallback preserves scripted/CI compatibility.
- **Strict Harness Scoping:** `heimdall sync`, `heimdall hud`, and `scripts/resolve-mcp.mjs --sync` strictly read `~/.heimdall-state.json` (`agents` + `selectedProfiles`) and never mutate unselected harnesses unless `--agents` or `--profiles` overrides.
- **Multi-Account Profiles (`claude`, `codex`, `agy` across Win/macOS/Linux):**
  - Stored in `~/.heimdall-state.json` (`profiles: { "claude/work": { tool, name, dir, managed } }`).
  - Supports registering existing directories (`--dir <path>`) or creating managed directories under `~/.heimdall-profiles/<tool>/<name>/`.
  - Isolation per OS:
    - `claude`: `CLAUDE_CONFIG_DIR=<dir>`
    - `codex`: `CODEX_HOME=<dir>`
    - `agy`: `HOME` (macOS/Linux) + `USERPROFILE` (Windows) pointing to `<dir>`, with `.ssh`, `.gitconfig`, and `.npmrc` junctioned/symlinked to real home.
  - `heimdall run <tool>/<name> [args...]` launches the target CLI with its isolated environment; Herdr-App `programs.json` optionally registers profiles.

---

## 3. Multi-Agent Orchestration & Model Allocation Matrix

| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T1 | Phase 1: Implement `lib/profiles.cjs` (CRUD, env-var mapping, `agy` home-shim linking, state persistence) | `claude-fable-5.2` | high | Cross-OS symlink/junction & state schema correctness | `gemini-4-hydrogen` |
| T2 | Phase 1: Wire strict scoping & multi-profile targets into `harness-detection.cjs`, `installer-engine.cjs`, `hud-sync.cjs`, `resolve-mcp.mjs` | `claude-fable-5.2` | high | Coordinated multi-file refactor across sync/MCP/HUD | `gemini-4-hydrogen` |
| T3 | Phase 2: Build zero-dep `lib/tui.cjs` (arrow-key list, multi-select checkboxes, Express vs Custom wizard) | `claude-fable-5.2` | high | Raw-mode TTY handling & cross-platform ANSI safety | `gemini-4-hydrogen` |
| T4 | Phase 2: Refactor `lib/interactive-menu.cjs` to 3-item hub + profile selector using `lib/tui.cjs` | `gemini-3.8-flash` | medium | Bounded UI wiring over T3 primitives | `claude-fable-5.2` |
| T5 | Phase 3: Add `heimdall profile ...` & `heimdall run <tool>/<name>` CLI subcommands in `setup.mjs` + Herdr `programs.json` integration | `claude-fable-5.2` | medium | CLI dispatch + Herdr program entry generation | `gemini-3.8-flash` |
| T6 | Phase 4: Write unit tests for `profiles.cjs`, strict scoping, `tui.cjs` state helpers, and `resolve-mcp.mjs` scoping | `gemini-3.8-flash` | medium | Deterministic fixture-based test coverage | `claude-fable-5.2` |

---

## 4. Multi-Phase Implementation Plan

### Phase 1: Profile Registry & Strict Harness Scoping (T1–T2)

- **Step 1.1:** Create `lib/profiles.cjs` with `loadHeimdallState()`, `saveHeimdallState()`, `addProfile(tool, name, opts)`, `removeProfile(id)`, `listProfiles()`, and `resolveProfileTargetPaths(state)`.
- **Step 1.2:** Add `ensureAgyHomeLinks(profileDir, realHome)` in `lib/profiles.cjs` to junction/symlink `.ssh`, `.gitconfig`, and `.npmrc` for `agy` profiles across Windows, macOS, and Linux.
- **Step 1.3:** Add `getProfileLaunchEnv(profile)` in `lib/profiles.cjs` returning `CLAUDE_CONFIG_DIR` (`claude`), `CODEX_HOME` (`codex`), or `HOME`/`USERPROFILE` (`agy`).
- **Step 1.4:** Update `lib/harness-detection.cjs` to resolve `claude`, `codex`, and `gemini` roots via `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, and `GEMINI_CLI_HOME` when set.
- **Step 1.5:** Update `runSync()` in `lib/installer-engine.cjs` to iterate only over selected harnesses and selected profiles from `~/.heimdall-state.json` (unless `--agents` / `--profiles` overrides).
- **Step 1.6:** Update `syncHud()` in `lib/installer-engine.cjs` and `lib/hud-sync.cjs` to accept target root overrides and skip unselected harnesses.
- **Step 1.7:** Update `scripts/resolve-mcp.mjs` and `lib/mcp-installer.cjs` to accept `--agents` / `--profiles` (or read `~/.heimdall-state.json`) and sync MCP configs only to selected targets.

### Phase 2: Zero-Dependency ANSI TUI & Simplified Hub (T3–T4)

- **Step 2.1:** Create `lib/tui.cjs` with `selectOne(title, items)` (arrow keys + Enter) and `selectMany(title, items, preselected)` (arrow keys + Spacebar + `a` toggle all + Enter), plus clean non-TTY fallback.
- **Step 2.2:** Replace the 8-item `runPostInstallMenu()` in `lib/interactive-menu.cjs` with a 3-item hub: `1. Express Sync`, `2. Harnesses & Profiles`, `3. Tools & Maintenance` (Audit, HUD, Herdr, Sync-Models, Uninstall).
- **Step 2.3:** Replace the 7-prompt `runInteractive()` with a 2-step Express vs Custom TUI flow: checkbox selection for Harnesses & Profiles, then `[Express Install (Recommended)]` vs `[Customize Path/Mode/HUD]`.

### Phase 3: Profile CLI Subcommands & Herdr-App Integration (T5)

- **Step 3.1:** Add `profile` (`add`, `list`, `remove`) and `run <tool>/<name>` subcommands to `parseArgs()`, `printHelp()`, and `main()` in `setup.mjs`.
- **Step 3.2:** Update `lib/herdr-programs.cjs` to register named profiles from `~/.heimdall-state.json` into Herdr-App `programs.json` with their `env` overrides.

### Phase 4: TDD Coverage & Regression Verification (T6)

- **Step 4.1:** Create `test/profiles.test.mjs` covering `addProfile`, `removeProfile`, `getProfileLaunchEnv` (`claude`, `codex`, `agy`), and `ensureAgyHomeLinks` in temp dirs.
- **Step 4.2:** Create `test/scoping.test.mjs` verifying `runSync`, `syncHud`, and `resolve-mcp.mjs` do not touch unselected harnesses when `~/.heimdall-state.json` restricts `agents`.
- **Step 4.3:** Create `test/tui.test.mjs` verifying `tui.cjs` selection state helpers and non-TTY fallback behavior.
- **Step 4.4:** Run `npm test` and terminating CLI `--dry-run` checks (`audit`, `sync --dry-run`, `profile list`, `--help`).

---

## 5. Symmetric Cross-Family Validation Loop
- **Branch A (In Herdr, `HERDR_ENV=1`):** Split ephemeral review pane (`herdr pane split --direction right --no-focus`), dispatch cross-family reviewer (`gemini-4-hydrogen` for T1–T3, `claude-fable-5.2` for T4/T6), close pane upon completion.
- **Branch B (Standalone Harness):** Dispatch stateless reviewer subagent with diff + test output only.

---

## 6. Orchestrator Heartbeat
- Run `npm test` after each phase before proceeding.
- Halt and diagnose on any test failure or unrequested mutation outside `savedState.agents`.

---

## 7. Verification Harness
- **Strict Zero Dev-Server Policy:** No dev servers launched; terminating commands only.
- **Primary Gates:**
  1. `npm test` — All existing (107) + new unit tests pass.
  2. `node setup.mjs --help` — Documents `profile`, `run`, and `--profiles`.
  3. `node setup.mjs profile list` — Exits 0 cleanly.
  4. `node setup.mjs sync --dry-run` — Respects `~/.heimdall-state.json` scoping without mutating unselected harnesses.
  5. `node setup.mjs audit` — Reports environment + registered profiles cleanly.
