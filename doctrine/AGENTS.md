# Universal Cross-Agent Doctrine (AGENTS.md)

Universal directives for Google Antigravity, Claude Code, and OpenAI Codex CLI across `C:\Apps\`.

<!-- cross-agent-harness-directives:start -->
<cross_agent_harness_discipline priority="CRITICAL_OVERRIDE">
  <planning_protocol>
    When receiving ANY planning request (/plan, /grill-me, plan mode, architectural/design prompt):
    1. TURN 1 IS HARD-GATED FOR INTERACTIVE GRILLING (ZERO-TOLERANCE):
       - Strictly forbidden from generating plans or code on Turn 1.
       - Immediately act as Orchestrator:
         a) Explicit Scope: Classify as 'Spike', 'Bounded', or 'Architectural'.
         b) Interrogate Assumptions: Ask 2-3 probing questions on edge cases, limits, failure modes.
         c) Concrete Alternatives: Suggest 2 distinct approaches with explicit architectural trade-offs.
       - Pause and await user response and direction approval before writing plans or code.
    2. TURN 2+ PLAN GENERATION:
       - Generate plan strictly following [`playbooks/05-canonical-plan-template.md`](file:///C:/Apps/heimdall-agent/playbooks/05-canonical-plan-template.md). Abbreviated templates forbidden.
  </planning_protocol>

  <subagent_execution_contract>
    When invoked as child subagent across ANY harness (Antigravity invoke_subagent, Claude Code Agent, Codex CLI):
    - Autonomous executor (Implementer, Tester, Reviewer, Code-Sentinel).
    - Turn 1 interactive grilling gate does NOT apply to child subagents.
    - Do NOT ask conversational questions back to caller.
    - Inspect files, write failing tests first (TDD), write surgical code, verify, return diff report.
  </subagent_execution_contract>
</cross_agent_harness_discipline>
<!-- cross-agent-harness-directives:end -->

---

## 1. Skill Precedence & Contradiction Resolution
1. **`antislop` (Universal Baseline — Mandatory Throughout)**: Zero AI filler, boilerplate comments (`antislop-code`), conversational fluff, or unprompted refactoring.
2. **`taste-skill` (UI & Features — Mandatory)**: Output Design Read (page kind, audience, vibe, tokens). Enforce workspace design system tokens; ban generic AI defaults (mesh purple gradients, Inter+slate-900). Pick one cohesive aesthetic.
3. **`karpathy-guidelines` (Code Restraint — Mandatory)**: Simplicity first. Minimum code (50 lines over 200). Surgical edits only; never touch neighboring code.
4. **`superpowers` (`writing-plans`, `subagent-driven-development`)**: Governs lifecycle, subagent dispatch, and review checkpoints.
5. **Workspace Cleanup**: Use `purge-workspace` and `project-hygiene` for sweep audits and dead-code removal.

---

## 2. Multi-Agent Orchestration & Model Allocation
- **Subagent Dispatch**: Multi-task plans must dispatch fresh specialized subagents (`orchestrator`, `frontend-designer`, `mobile-designer`, `tester`, `security-auditor`, `database-architect`, `code-sentinel`, `reviewer`). Fresh context per task, TDD first, surgical code, diff report.
- **Canonical Plan Schema**: Plans must strictly use [`playbooks/05-canonical-plan-template.md`](file:///C:/Apps/heimdall-agent/playbooks/05-canonical-plan-template.md).
- **Model Registry & Effort**: Follow [`playbooks/06-model-registry-matrix.md`](file:///C:/Apps/heimdall-agent/playbooks/06-model-registry-matrix.md). Declare assigned model and allowed effort (`low`, `medium`, `high`, `xhigh`). Override Claude `/model` picker via Agent tool `model` parameter. Quota fallback: Argon -> Flash/Pro/GhostCLI.
- **Tri-Directional Cross-Model Reviews**: Claude validated by Gemini/Codex; Gemini validated by Claude/Codex; Codex validated by Claude/Gemini via shared bridge scripts.

---

## 3. Playwright E2E Verification & Pseudo-Verification Ban
- **Primary Gate**: Playwright E2E at full capacity required for all interactive UI, web apps, and user journeys.
- **Visual & Runtime Assertions**: Verify DOM mount (`toBeVisible()`), non-zero bounding box (`expect(box.height).toBeGreaterThan(0)`), trap console errors (`page.on('pageerror')`).
- **Strict Pseudo-Verification Ban**: REJECT completion based on: `curl 200/302`, `grep` bundle, `tsc --noEmit`, container status, or reading file edits alone.
- **Backend with UI Impact**: Changes affecting user-facing views mandate Playwright E2E verification.
- **Missing Playwright**: Detect on Turn 1 planning; ask user for preferred setup. Silent fallback prohibited.

---

## 4. Canonical Shared Tools (Zero Duplication)
- Cross-model bridges live centrally in `C:\Apps\tools\` (`claude-bridge.ps1`, `gemini-bridge.ps1`, `codex-bridge.ps1`) and user PATH.
- **Zero-Duplication Mandate**: Never copy bridge scripts into project repositories. Local `tools/` is strictly repo-specific.

---

<!-- antislop:start -->
## antislop
For UI, copy, accessibility, mobile layout, or code comments, read `antislop` core and the task skill:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People / accessibility: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
<!-- antislop:end -->
