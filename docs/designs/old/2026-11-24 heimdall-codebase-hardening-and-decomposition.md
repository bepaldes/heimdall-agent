# Plan: Heimdall Codebase Hardening, Decomposition & Test Coverage

**Date:** 2026-11-24 (Reassessed 2026-11-25)  
**Status:** COMPLETED (Reassessed & Executed 2026-11-25)  
**Author:** Claude Fable 5.2 (Reassessed by Gemini 4 Hydrogen)  
**Scope:** `.gitignore`, `package.json`, `docs/`, `tools/`, `readme.html`, `setup.mjs`, `hooks/heimdall-hook.cjs`, `scripts/resolve-mcp.mjs`, `lib/*.cjs`, `test/`

---

## 1. Active Skills & Directives Checklist
- [x] `karpathy-guidelines` — Surgical decomposition, minimal edits, no speculative bloat
- [x] `communication-doctrine` — BLUF macro layout, STE imperative steps (<=20 words), zero vague qualifiers
- [x] `antislop` — Clean comments, no AI boilerplate, meaningful naming
- [x] `codebase-design` — Deep module boundaries, single-responsibility extraction, pass-through layers rejected
- [x] `project-hygiene` — Dead file purge, .gitignore correction, npm package size reduction
- [x] `test-driven-development` — Failing tests first for all new lib modules and hook guardrails
- [x] `verification-before-completion` — Non-interactive terminating verification only

---

## 2. Context & Design Read
- **Design Read**: N/A — Internal tooling refactor, no user-facing UI surface.
- **Anti-Default Discipline**: Reject over-abstraction; keep extracted modules as flat CJS files with explicit exports. Reject adding runtime dependencies unless strictly necessary for correctness (TOML/YAML parsers are justified).

---

## 3. Multi-Agent Orchestration & Model Allocation Matrix

| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T0a | Phase 0: Fix .gitignore to track active designs, ignore only runs/ and scratch | `claude-fable-5.2` | medium | Repository hygiene prerequisite; blocks correct plan lifecycle | `gemini-3.8-flash` (fast review) |
| T0b | Phase 0: Audit and clean tools/, docs/, root-level generated files | `claude-fable-5.2` | medium | Reduce npm package size and repo clutter before decomposition | `gemini-3.8-flash` (fast review) |
| T1 | Phase 1: Extract harness detection & path resolution from setup.mjs into lib/harness-detection.cjs | `claude-fable-5.2` | high | Unlimited workhorse for surgical multi-file extraction with zero regressions | `gemini-4-hydrogen` (adversarial review) |
| T2 | Phase 1: Extract MCP installer/sync/audit into lib/mcp-installer.cjs | `claude-fable-5.2` | high | Same session continuity for coordinated extraction | `gemini-4-hydrogen` (adversarial review) |
| T3 | Phase 1: Extract installer engine (runSync, runUninstall, link/copy/clean) into lib/installer-engine.cjs | `claude-fable-5.2` | high | Largest extraction block requires full context awareness | `gemini-4-hydrogen` (adversarial review) |
| T4 | Phase 1: Extract interactive menus into lib/interactive-menu.cjs | `claude-fable-5.2` | medium | Self-contained readline logic, lower risk | `gemini-3.8-flash` (fast review) |
| T5 | Phase 2: Harden hook regex guardrails with token-based command parsing | `claude-fable-5.2` | high | Security-critical change requires deep reasoning | `gemini-4-hydrogen` (adversarial review) |
| T6 | Phase 2: Replace hand-rolled TOML/YAML serialization in resolve-mcp.mjs | `claude-fable-5.2` | medium | Correctness fix, bounded scope | `gemini-3.8-flash` (fast review) |
| T7 | Phase 3: Write unit tests for all 8 lib modules | `gemini-3.8-flash` | medium | Fast utility for test scaffolding across many pure functions | `claude-fable-5.2` (review test quality) |
| T8 | Phase 3: Write unit tests for hook guardrail bypass vectors | `gemini-3.8-flash` | medium | Deterministic security test cases | `claude-fable-5.2` (review coverage) |
| T9 | Phase 4: Consolidate duplicate path resolvers & fix formatHudCommand quoting | `claude-fable-5.2` | medium | Hygiene fixes, low blast radius | `gemini-3.8-flash` (fast review) |
| T10 | Phase 4: Remove hardcoded skill counts, clean tools/archive, add error logging | `claude-fable-5.2` | low | Minor hygiene, fast execution | `gemini-3.8-flash` (fast review) |
| T11 | Phase 4: Full regression verification (npm test + npm run audit) | `gemini-3.8-flash` | medium | Terminating verification gate | N/A |

---

## 4. Multi-Phase Implementation Plan

### Phase 0: Repository Hygiene & File/Folder Optimization (T0a–T0b)

**Goal:** Correct `.gitignore` so active design docs are tracked, remove dead files, reduce npm package size.

#### Current State Assessment
| Path | Current Status | Problem | Action |
| :--- | :--- | :--- | :--- |
| `docs/designs/` | **Ignored** by `.gitignore:4` | Active plans cannot be committed; contradicts plan lifecycle doctrine | Change rule to `docs/designs/old/` (archive only); track active designs |
| `docs/designs/old/` | Partially tracked (2 of 7 files in git) | Inconsistent: some archived plans tracked, others ignored by parent rule | After fixing parent rule, all archived plans become consistently tracked |
| `docs/runs/` | Ignored by `.gitignore:3` | Correct — ephemeral execution artifacts | Keep ignored |
| `tools/archive/` | **Tracked** (11 bridge scripts) | Deprecated bridges superseded by `setup.mjs` native detection | Remove from git tracking; add to `.npmignore` or exclude from `package.json` `files` |
| `readme.html` | Tracked (70KB generated file) | Generated artifact, duplicates README.md content | Add to `.gitignore`; remove from git tracking; exclude from `package.json` `files` |
| `config/mcp.resolved.json` | Ignored by `.gitignore:10` | Correct — machine-generated per-machine config | Keep ignored |
| `hooks/herdr-agent-state.ps1` | Ignored by `.gitignore:5` | Correct — local state file | Keep ignored |
| `*.tgz` | Ignored by `.gitignore:6` | Correct — npm pack artifacts | Keep ignored |
| `docs/assets/` | Tracked (2 PNG screenshots) | Valid documentation assets | Keep tracked |
| `docs/install-guide.html` | Tracked | Valid documentation | Keep tracked |
| `tools/herdr-mods/` | Tracked (2 files) | Active Herdr integration mods | Keep tracked |
| `tools/heimdall-hud.mjs` | Tracked | Active HUD statusline script | Keep tracked |

- **Step 0.1:** Edit `.gitignore`. Replace line 4 (`docs/designs/`) with `docs/designs/old/`. This tracks active plans while keeping archived plans in version control (they are historical records, not ephemeral). Verify with `git check-ignore -v docs/designs/2026-11-24*.md` (should NOT be ignored) and `git check-ignore -v docs/designs/old/*.md` (SHOULD be ignored or explicitly tracked).
- **Step 0.2:** Decide on `docs/designs/old/` policy. Two options:
  - **Option A (Recommended):** Un-ignore `docs/designs/old/` entirely. Archived plans are completed historical records that should be in git for auditability. Remove the old/ ignore rule. Run `git add docs/designs/old/` to stage previously-ignored files.
  - **Option B:** Keep `docs/designs/old/` ignored. Accepts that archived plans are disposable. Simpler but loses history.
- **Step 0.3:** Remove `tools/archive/` from git tracking. Run `git rm --cached -r tools/archive/`. Add `tools/archive/` to `.gitignore`. Exclude from `package.json` `files` array (it is already absent, but confirm no glob pulls it in).
- **Step 0.4:** Remove `readme.html` from git tracking. Run `git rm --cached readme.html`. Add `readme.html` to `.gitignore`. Confirm `package.json` `files` does not include it.
- **Step 0.5:** Create `.npmignore` if needed to exclude `docs/runs/`, `tools/archive/`, `readme.html`, `.github/`, and test fixtures from the published npm package. Alternatively, tighten `package.json` `files` to an explicit allowlist (preferred over `.npmignore`).
- **Step 0.6:** Verify `npm pack --dry-run` output. Confirm excluded files are absent and package size decreased.
- **Step 0.7:** Run `git status` to review staged deletions and additions. Do NOT commit — leave for user approval.

### Phase 1: Setup.mjs Decomposition (T1–T4)

**Goal:** Reduce `setup.mjs` from 2857 lines to ~250 lines (CLI arg parser, `main()` with `~/.heimdall-state.json` persistence, + dispatcher) while preserving `df84ff7` (strict Gemini install gating & IPv4 DNS), `d79ff03` (persisted harness selection), and local `syncHerdrAutoResumeMod`.

- **Step 1.1:** Create `lib/harness-detection.cjs`. Move `getHermesDir()`, `getOpenClawDir()`, `getCopilotDir()`, `getVSCodeUserDir()`, `getClaudeDesktopDir()`, `detectClaudeDesktop()`, `detectCodexBinary()`, `detectHermesBinary()`, `detectOpenClawBinary()`, `detectVSCodeBinary()`, `isAgentConfigurable()` (including strict Gemini `agy` check from `df84ff7`), `getAgentRootDir()`, `detectDoctrineCandidates()`, `detectEnvironment()`, and target path maps. Export all.
- **Step 1.2:** Create `lib/mcp-installer.cjs`. Move `installMcpPackages()`, `syncMcpServers()`, `auditMcpServers()` (including strict Gemini check from `df84ff7`), `resolveOpenDesignMcpConfig()`. Export all.
- **Step 1.3:** Create `lib/installer-engine.cjs`. Move `runSync()`, `runUninstall()`, `runAudit()`, `linkDirectory()`, `copyDirectory()`, `cleanTargetDirectory()`, `registerClaudeHooks()`, `deployAgentContracts()`, `cleanLegacyLocalAgents()`, `configureHermesExternalDirs()`, `configureHermesContextLimit()`, `syncHerdrAppConfig()`, `syncHerdrAutoResumeMod()`, `syncHerdrProgramsFromCatalog()`, `runHerdrApp()`, `deployGlobalShims()`, `syncHud()`, `probeModelHealth()`, `deduplicateModelsByMaxContext()`, `syncModelsFromEndpoint()`, `convergeModelAwareArtifacts()`, `isHeimdallInstalled()`. Export all.
- **Step 1.4:** Create `lib/interactive-menu.cjs`. Move `runInteractive()`, `runPostInstallMenu()`, `runHudInteractive()`, `runListSkills()`, `runUpdateSkill()`. Export all.
- **Step 1.5:** Refactor `setup.mjs` to import from new modules. Retain only CLI argument parsing, `main()`, `printBanner()`, `checkForUpdates()`, and dispatch calls. Verify `node setup.mjs --help` and `node setup.mjs audit` produce identical output.
- **Step 1.6:** Run `npm test`. Assert all existing tests pass. Run `node setup.mjs --dry-run` for install, sync, and uninstall paths.

### Phase 2: Security & Correctness Hardening (T5–T6)

- **Step 2.1:** In `hooks/heimdall-hook.cjs`, replace raw regex matching for dev-server and destructive-command blocking with a token-based parser. Split command string on whitespace and shell operators. Normalize tokens (lowercase, strip quotes). Match against normalized token arrays. Add advisory stderr for ambiguous patterns instead of silent pass-through.
- **Step 2.2:** Write failing tests for bypass vectors: `node node_modules/.bin/vite`, `/bin/rm -rf /`, `rm -r -f ~`, `npx --yes vite`. Assert all are now blocked.
- **Step 2.3:** In `scripts/resolve-mcp.mjs`, evaluate whether `@iarna/toml` or `yaml` is warranted. If dependency addition is unacceptable, at minimum add escaping unit tests for values containing quotes, backslashes, newlines, and Unicode. Document known limitations if hand-rolled serialization is retained.
- **Step 2.4:** Harden `formatHudCommand()` in `lib/hud-sync.cjs:15-18`. Preserve unquoted paths when safe (per `0932f56` Windows AGY fix), but quote paths containing whitespace or shell metacharacters (`$`, `` ` ``, `;`, `&`, `|`). Add test for metacharacter paths.

### Phase 3: Test Coverage Expansion (T7–T8)

Note: `context-discovery.test.mjs`, `harness-models.test.mjs`, `model-router.test.mjs`, `path-discovery.test.mjs`, `hermes-context.test.mjs`, `hud.test.mjs`, and `hook-sentinel.test.mjs` already exist. Focus on the uncovered modules and new guardrails:

- **Step 3.1:** Create `test/harness-detection.test.mjs` covering `lib/harness-detection.cjs` (including strict Gemini `isAgentConfigurable('gemini')` gating).
- **Step 3.2:** Create `test/mcp-installer.test.mjs` covering `lib/mcp-installer.cjs`.
- **Step 3.3:** Create `test/installer-engine.test.mjs` covering `lib/installer-engine.cjs` (`cleanTargetDirectory`, `copyDirectory`, `isHeimdallInstalled`, `deduplicateModelsByMaxContext`).
- **Step 3.4:** Create `test/interactive-menu.test.mjs` covering `lib/interactive-menu.cjs` exports and `runListSkills`.
- **Step 3.5:** Create `test/catalog-sync.test.mjs` covering `lib/catalog-sync.cjs`.
- **Step 3.6:** Create `test/hooks-guardrails.test.mjs` spawning `hooks/heimdall-hook.cjs` with bypass vectors (`node node_modules/.bin/vite`, `/bin/rm -rf /`, `rm -r -f ~`, `npx --yes vite`, safe commands).
- **Step 3.7:** Add HUD metacharacter test in `test/hud.test.mjs` and TOML/YAML escaping tests in `test/mcp-registry.test.mjs`.
- **Step 3.8:** Run `npm test`. Assert all new and existing tests pass. Report count.

### Phase 4: Hygiene & Regression Verification (T9–T11)

- **Step 4.1:** Consolidate `resolveHermesRoot()` and `resolveOpenClawRoot()` from `harness-models.cjs` into `path-discovery.cjs`. Update imports in both files. Remove duplicates.
- **Step 4.2:** Replace hardcoded "69 curated skills" string in `setup.mjs:2291` with dynamic count from `skillsConfigPath`.
- **Step 4.3:** Add `tools/archive/` to `.npmignore` or exclude from `package.json` `files` array.
- **Step 4.4:** Add non-fatal stderr logging to critical `catch {}` blocks in `syncHerdrPrograms()` and `resolve-mcp.mjs` where write failures are currently silent.
- **Step 4.5:** Run full regression: `npm test && node setup.mjs audit && node setup.mjs sync --dry-run && node setup.mjs --uninstall --yes --dry-run`. Assert zero errors.
- **Step 4.6:** Document token estimation heuristic (`payloadRaw.length / 3.8`) in `heimdall-hook.cjs:66` as advisory-only with inline comment.

---

## 5. Symmetric Cross-Family Validation Loop

- **Runtime Harness & Environment Detection**: Check `$env:HERDR_ENV` or `$env:HC_TERMINAL_ID`.
- **Branch A (In Herdr)**: Open side panel via `herdr pane split --direction right --no-focus`. Dispatch adversarial review against extracted module boundaries and hook guardrail changes. Await verdict. Close panel upon completion.
- **Branch B (Standalone Harness)**: Dispatch stateless reviewer subagent via native harness tool. Reviewer receives only the diff and test output, zero parent conversation context.
- **Cross-Family Pairs**: T1–T4 reviewed by `gemini-4-hydrogen`. T5 reviewed by `gemini-4-hydrogen`. T7–T8 reviewed by `claude-fable-5.2`. T9–T10 reviewed by `gemini-3.8-flash`.

---

## 6. Orchestrator Heartbeat

- Monitor progress every 3 minutes during Phase 1 (largest extraction phase).
- After each phase completion, run `npm test` before proceeding to next phase.
- If any phase fails verification, halt and diagnose before continuing.

---

## 7. Verification Harness

- **Strict Zero Dev-Server Policy**: No step launches `npm run dev`, `vite`, or any background server. All verification uses terminating commands only.
- **Primary Gates**:
  1. `git check-ignore -v docs/designs/active-plan.md` — Active plans are NOT ignored.
  2. `git ls-files tools/archive/` — Returns empty (archive removed from tracking).
  3. `git ls-files readme.html` — Returns empty (generated HTML removed from tracking).
  4. `npm pack --dry-run` — Excludes `tools/archive/`, `readme.html`, `docs/runs/`; package size decreased.
  5. `npm test` — All unit tests pass (existing + new).
  6. `node setup.mjs audit` — Produces valid environment report without errors.
  7. `node setup.mjs sync --dry-run` — Completes without file mutations or crashes.
  8. `node setup.mjs --uninstall --yes --dry-run` — Completes without file mutations or crashes.
  9. `node setup.mjs --help` — Displays updated help text with correct subcommands.
- **Rejection Criteria**: Any test failure, unhandled exception, or silent error in dry-run paths blocks phase completion.
- **No Playwright Required**: This is internal tooling with no browser surface. Static CLI verification is sufficient.

---

## Risk Assessment & Blast Radius

| Change | Blast Radius | Mitigation |
| :--- | :--- | :--- |
| .gitignore & tracking changes | Medium — alters what is version-controlled | `git diff --cached` review before commit; no file content deleted, only tracking metadata |
| tools/archive/ removal from git | Low — deprecated files, no active references | Confirm zero imports via grep before `git rm --cached` |
| readme.html removal from git | Low — generated artifact, README.md is source of truth | Verify no docs link to readme.html before removal |
| setup.mjs decomposition | High — touches all CLI entry points | Dry-run verification after each extraction; existing tests as regression net |
| Hook regex hardening | Medium — could false-positive legitimate commands | Advisory mode first; log blocked commands for review before enforcing |
| TOML/YAML parser addition | Low — isolated to resolve-mcp.mjs | Optional; hand-rolled escape tests as fallback |
| New test files | None — additive only | Tests use temp directories, no global state mutation |
| Path resolver consolidation | Low — internal refactor | Import-level tests verify no behavioral change |

---

## Out of Scope (Deferred)

- ESM migration of lib modules (cognitive overhead acceptable for now; revisit when Node 20+ is baseline).
- Live token counting integration (requires harness-specific API contracts; advisory heuristic documented instead).
- Skill catalog auto-count in menu text (deferred if dynamic resolution adds startup latency >50ms).