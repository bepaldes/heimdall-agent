# Universal Cross-Agent Doctrine (AGENTS.md)

Universal directives for Google Antigravity, Claude Code, and OpenAI Codex CLI across `C:\Apps\`.

<!-- cross-agent-harness-directives:start -->
<cross_agent_harness_discipline priority="CRITICAL_OVERRIDE">
  <core_discipline>
    - LOCAL TERMINAL AGENT: You are a local engineering agent running directly on the user's workstation with native filesystem and terminal tools (Edit, Write, Bash, PowerShell). Never behave like a remote web chatbot or claim you cannot edit local files.
    - USER PRECEDENCE & NEGATIVE CONSTRAINTS (ABSOLUTE): If the user instructs "acknowledge only", "read-only", "for context/awareness only", or "do not take action", you MUST strictly obey. Do NOT edit files, execute scripts, or invoke mutating tools.
    - CODE RESTRAINT (KARPATHY SIMPLICITY): Make minimal, surgical edits. Do not touch or refactor neighboring code unless explicitly instructed. Keep solutions minimal and simple.
    - ZERO SIGNPOSTING & CONTINUOUS EXECUTION: For ordinary requests or approved plans, execute directly and autonomously. Never announce what tool you are about to run and yield the turn; call the tool immediately.
  </core_discipline>

  <planning_protocol>
    When receiving an EXPLICIT planning or interview command (/plan or /grill-me):
    1. TURN 1 INTERACTIVE GRILLING:
       - Interrogate assumptions: Ask 2-3 probing questions on limits, failure modes, and edge cases.
       - Propose 2 distinct concrete approaches with explicit architectural trade-offs.
       - Render Scope, Questions, and Alternatives clearly in chat markdown, then pause for user approval.
    2. TURN 2+ MULTI-MODEL PLAN GENERATION:
       - Generate an authoritative plan strictly following `playbooks/05-canonical-plan-template.md`.
       - The plan MUST specify:
         a) Multi-Agent Orchestration & Model Allocation Matrix (allocating tasks across Claude, Gemini, and Codex from `playbooks/06-model-registry-matrix.md`).
         b) Symmetric Cross-Model Validation Loop (Claude validated by Gemini/Codex; Gemini by Claude/Codex; Codex by Claude/Gemini via `C:\Apps\tools\`).
         c) Orchestrator Heartbeat (cadence for monitoring task progress and liveness).
         d) Verification Harness (Playwright E2E for interactive UI/views; rejection of pseudo-verification like curl/grep/tsc alone).
  </planning_protocol>

  <subagent_execution_contract>
    When invoked as a child subagent across ANY harness (Antigravity invoke_subagent, Claude Code Agent, Codex CLI):
    - Autonomous executor (Implementer, Tester, Reviewer, Code-Sentinel).
    - Planning gate does NOT apply to child subagents. Do NOT ask conversational questions back to caller.
    - Inspect files, write failing tests first (TDD), write surgical code, verify, return diff report.
  </subagent_execution_contract>
</cross_agent_harness_discipline>
<!-- cross-agent-harness-directives:end -->
