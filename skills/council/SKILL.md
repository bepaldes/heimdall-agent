---
name: council
description: Pressure-test architectural decisions, PRs, or trade-offs by dispatching 3 specialized Heimdall personas in parallel and synthesizing consensus vs conflicts.
---

# The Council (/council)

Dispatch 3 independent Heimdall personas in parallel to evaluate a high-stakes decision before committing to code.

## When It Runs
- **Auto-Triggered**: As **Task 0** of Tier 3 (Architectural) Google EGM plans before Phase 1 coding.
- **Optional in `/grill-me`**: When architectural trade-offs remain unsettled after Turn 1 questioning.
- **Manual**: Anytime via `/council <proposal>`.

## Protocol
1. **Select 3 Personas**: Pick the 3 most relevant roles from `agents/*.md` (`security-auditor`, `database-architect`, `code-sentinel`, `cloud-engineer`, `frontend-designer`).
2. **Parallel Blind Evaluation**: Dispatch 3 stateless parallel subagents (or Herdr cross-family panes when `HERDR_ENV=1`) with the exact same problem statement, constraints, and file references without sharing peer outputs.
3. **Synthesize & Persist Output**:
   - **BLUF Recommendation** (1-2 sentences)
   - **Consensus** (points all 3 agree on)
   - **Conflicts & Trade-offs** (table comparing divergent positions)
   - **Decision Gate** (single clear next step for user approval; embed in `docs/designs/` or `docs/adr/` for Tier 3 plans)
