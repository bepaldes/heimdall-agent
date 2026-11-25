# Plan: Visual Install Guide Enhancement with Live Herdr-App Cockpit Screenshots

**Date:** 2026-11-20  
**Status:** DRAFT (Awaiting Execution)  
**Author:** Antigravity Lead Orchestrator  
**File Target:** `docs/install-guide.html` and `C:\Apps\bepaldes.github.io\install-guide.html`  
**Assets Target:** `docs/assets/` and `C:\Apps\bepaldes.github.io\assets/`

---

## 1. Active Skills & Directives Checklist
- [x] `taste-skill` — High-contrast design, clean borders, responsive light/dark CSS, antislop layout
- [x] `communication-doctrine` — BLUF macro layout, STE imperative steps (<=20 words), zero vague qualifiers
- [x] `karpathy-guidelines` — Surgical asset generation, minimal dependencies, zero runtime bloat
- [x] `antislop` — Accessible contrast, no generic decorative fluff, meaningful UI annotations
- [x] `herdr` — Live capture using `herdr-app shot` for authentic multi-agent cockpit representations

---

## 2. Context & Design Read (Required for UI / Features)
- **Design Read**: Reading this as: Developer Documentation & Onboarding Visual Guide for senior AI engineers, with high-signal engineering vibe, leaning toward clean typography, subtle borders, high-contrast dark/light adaptability, and annotated screenshot cards.
- **Design System Tokens**:
  - Light mode: `--bg: #f8fafc`, `--panel: #ffffff`, `--line: #e2e8f0`, `--text: #0f172a`, `--accent: #3b82f6`
  - Dark mode: `--bg: #090d16`, `--panel: #111827`, `--line: #1e293b`, `--text: #f8fafc`, `--accent: #60a5fa`
- **Anti-Default Discipline**: Reject low-contrast fuzzy mockups; reject generic unannotated stock images; reject oversized uncompressed image files. Every screenshot must feature crisp UI window chrome and callout badges explaining how Herdr-App and Heimdall accelerate workflows.

---

## 3. Multi-Agent Orchestration & Model Allocation Matrix

| Task ID | Phase & Task Description | Assigned Model | Effort Level | Selection Rationale | Cross-Reviewer & Tool Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | Asset Generation: Capture high-res screenshots from `herdr-app` and optimize web payloads | `gemini-3.8-flash` | medium | Fast local image processing and filesystem capture | Claude Sonnet 4.5 (`herdr agent prompt claude-reviewer`) |
| **T2** | Layout & UI Enhancement: Embed responsive annotated screenshot cards in `install-guide.html` | `claude-sonnet-4-5` | high | Advanced frontend layout, CSS responsiveness & taste compliance | Gemini 3.8 Flash (`herdr agent prompt gemini-reviewer`) |
| **T3** | Verification & Sync: Terminating test runs, HTML validation, and deployment to GitHub Pages | `gemini-3.8-flash` | medium | Automated test suite and cross-repo Git synchronization | Claude Sonnet 4.5 (`herdr agent prompt claude-reviewer`) |

---

## 4. Multi-Phase Implementation Plan

### Phase 1: High-Resolution Screenshot Capture & Processing
- **Step 1.1**: Create `docs/assets/` directory in `C:\Apps\heimdall-agent` and `C:\Apps\bepaldes.github.io`.
- **Step 1.2**: Capture full-window multi-agent cockpit screenshot using `herdr-app shot docs/assets/herdr-app-cockpit.png`.
- **Step 1.3**: Capture focused layout showing multi-pane split (authoring terminal + review panel).
- **Step 1.4**: Capture Heimdall CLI setup wizard and 2-line HUD statusline payload as `docs/assets/heimdall-hud-cockpit.png`.
- **Step 1.5**: Verify image compression and ensure sharp rendering without artifacting.

### Phase 2: HTML/CSS Visual Card Component Architecture
- **Step 2.1**: Define `.screenshot-card` CSS with macOS/Windows-style window header dots and subtle border.
- **Step 2.2**: Add responsive image container with `loading="lazy"` and high-contrast captions.
- **Step 2.3**: Build UI annotation callouts (`.callout-badge`) highlighting:
  1. Multi-Agent Split Pane (Claude Code + Peer Reviewer).
  2. Spaces & Tabs sidebar with persistent daemon status indicators.
  3. Heimdall HUD 2-line token, cost, and context tracker.
  4. Interactive setup wizard menu.
- **Step 2.4**: Embed screenshot cards into Step 3 (Herdr-App) and Step 4 (Heimdall Setup) of `docs/install-guide.html`.

### Phase 3: Deployment & Cross-Repo Synchronization
- **Step 3.1**: Copy updated `docs/install-guide.html` and `docs/assets/` to `C:\Apps\bepaldes.github.io\`.
- **Step 3.2**: Run `npm test` across `heimdall-agent` to verify 60/60 tests pass.
- **Step 3.3**: Commit and push changes to `origin/main` in both repositories.
- **Step 3.4**: Verify live deployment at `https://bepaldes.github.io/install-guide.html`.

---

## 5. Symmetric Cross-Family Validation Loop

- **Runtime Harness & Environment Detection**:
  - Detect if running inside Herdr / Herdr-App (`$env:HERDR_ENV = "1"` or `$env:HC_TERMINAL_ID` present).
- **Branch A: In Herdr / Herdr-App (Visual Ephemeral Side Panel)**:
  - Open side panel: `herdr-app do pane.split --direction right --argv '["claude"]' --task "Validate visual install guide"`
  - Execute review: verify that screenshots display cleanly, contrast is sharp, and layout is mobile-responsive.
  - Await verdict: `herdr agent prompt claude "Review HTML diff and asset paths." --wait --timeout 120000`
  - Close side panel upon completion: `herdr-app do pane.close --pane <id>`
- **Branch B: In Standalone Harnesses (Antigravity IDE, Claude Code CLI, Codex CLI)**:
  - Dispatch review via harness native subagent / task (`invoke_subagent` in Antigravity, `Agent` tool in Claude Code).
  - Ingest review findings directly back into the primary conversation.

---

## 6. Orchestrator Heartbeat
- Monitor asset generation and cross-repository synchronization progress every 2 minutes.

---

## 7. Verification Harness
- **Strict Zero Dev-Server Policy**: No dev servers will be started or spawned (`npm run dev`, `vite`, `live-server`).
- **Terminating Verification**: Execute `npm test` across `heimdall-agent`.
- **HTML Integrity Check**: Validate that all `<img>` tags use relative paths that resolve correctly both locally and on GitHub Pages.
- **Live Preview Check**: Verify asset reachability at `https://bepaldes.github.io/assets/`.
