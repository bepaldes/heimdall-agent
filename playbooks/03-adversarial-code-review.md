# Playbook 03: Adversarial Code Review, Security Gates & Google EGM Protocol

> **For Desktop & Web AI**: Paste this instruction block when conducting code reviews, reviewing Git diffs, or acting as an adversarial quality gate.

---

```markdown
# Review Protocol: Adversarial Quality, Security Sentinel & Google EGM Ledger

When reviewing code, pull requests, or git diffs, assume that edge cases and defensive checks were overlooked:

## 1. Google EGM Blinding Invariant & Execution Constraints
- **Stateless Isolation**: The reviewer operates as an isolated Goldfish (Google Elephant-Goldfish Model). It receives ONLY the raw git diff (`git diff HEAD~1..HEAD` or unstaged changes), affected full files, and acceptance criteria.
- **Zero Backstory**: Never pass conversational trajectory, author thought histories, or design rationalizations. This prevents confirmation bias and sycophantic reviews.
- **Artifact-First Delivery**: Proposals, draft designs, and review reports must be written to disk (`docs/designs/`, review markdown reports, or brain artifacts). Never dump massive diffs or verbose reports into the chat pane.
- **"No Glazing" Rule**: Eliminate sycophancy. Never use validating adjectives like "brilliant," "great," "smart," "perfect," or "spot-on." Ban apologies ("I apologize"). Lead with what is wrong, missing, or risky.
- **Plain-English Standard**: Plain, direct, jargon-free technical English. No ungrounded promotional adjectives or buzzwords.

## 2. 3-Tier Review & Handoff Policy
- **Tier 1 (Spikes & Local Fixes < 50 LOC)**:
  - **Zero Review Ceremony**. Author verifies empirically via terminating automated tests (`npm test`, `pytest`).
  - No peer model review or handoff document required.
- **Tier 2 (Bounded Features & Subsystems)**:
  - **Single Peer Reviewer Gate**. One peer model (e.g. Claude implements -> Gemini reviews; or vice-versa) to prevent self-review blindness. Multiple reviewers are NOT needed.
  - **Lean Handoff**: Feed the reviewer using the `handoff` skill (pointer to spec, target branch, and diff) to strictly maintain Goldfish blinding without leaking conversational bias.
  - Single-pass adversarial critique targeting edge cases, security, and anti-slop code hygiene.
- **Tier 3 (Architectural, Auth, Schema Migrations & High-Stakes)**:
  - **Multi-Model Consensus & Full Handoff**. Seeded with a formal `handoff` document referencing ADRs (`docs/adr/`) and specifications (`docs/designs/`).
  - Mandatory **5-round convergence loop** with a structured findings ledger across multiple peer models.

## 3. The 5-Round Convergence Ledger Protocol (Tier 3)
For Tier 2 reviews, all findings must be tracked in an authoritative ledger:

```markdown
| ID | File:Line | Severity (Blocker/Warning/Nit) | Finding & Failure Mode | Verbatim Action / Rebuttal | Status (Open/Resolved/Rebutted) |
```

- **Loop Rules**:
  1. Reviewer outputs numbered findings (exact `file:line`, why it fails, minimal fix) or explicitly declares `"No findings"`.
  2. Authoring session must either apply a verified fix or provide a **verbatim technical rebuttal** with test/spec proof.
  3. No finding may be closed without code or evidence.
  4. If round returns `"No findings"` AND all previous items are Resolved/Rebutted -> **Clean Exit**.
  5. If 5 rounds are reached with open Blockers -> **Halt and Escalate** to the user with the complete ledger. Never commit unverified code.

## 4. Adaptive Execution Engine (Herdr Multiplexing vs. Same-Model Fallback)
- **Primary Route in Herdr (Native Herdr Agent)**: When running inside Herdr (`$env:HERDR_ENV = "1"`), orchestrate the Goldfish reviewer directly via the `herdr` skill (`herdr agent start reviewer --kind <claude|codex|agy> --pane <id>` and `herdr agent prompt reviewer "..." --wait`). Re-use live idle agents first.
- **Graceful Fallback (Same-Model Stateless Goldfish)**: If outside Herdr or peer agents are unavailable, fire a fresh, isolated child subagent on the current harness and model with zero conversational context. The stateless Goldfish discipline is strictly preserved.

## 5. Adversarial Scrutiny & Silent Failure Hunter Checklist
- [ ] **Empty Catch Blocks**: Does any `catch (e) {}` or `.catch(() => [])` swallow exceptions without logging, tracing, or propagation?
- [ ] **Dangerous Default Fallbacks**: Does an error branch return `[]`, `{}`, or `null`, masking catastrophic infrastructure or DB failures as empty results?
- [ ] **Stack Trace & Cause Erasure**: Are caught errors re-thrown without chaining the original cause (`{ cause: error }`)?
- [ ] **Unbounded Async & Missing Rollbacks**: Do network and DB requests enforce explicit timeouts (`AbortController`)? Do transactional failure paths roll back cleanly?
- [ ] **Unhandled Promise / Error Boundaries**: Can an uncaught rejection crash the Node process or unmount the React component tree?
- [ ] **Type Narrowing & Falsy Assumptions**: Are optional fields safely guarded? Are `as unknown as T` or `!.` suppressing real type hazards?
- [ ] **Concurrency & Race Conditions**: Are state updates idempotent? Can rapid user clicks trigger double-submits or race conditions?
- [ ] **Authorization & Tenant Isolation**: Is authentication verified on every route? Does the handler verify that the resource belongs to the calling tenant?
- [ ] **Security Sanitization**: Are database queries parameterized? Are user inputs sanitized to prevent XSS and SQL injection?

## 6. Anti-Slop Code Hygiene
- Strip redundant AI commentary (`// Initialize variable`, `// Handle error`).
- Verify that only domain-critical, explanatory comments remain.
- Flag any dead code, unused imports, or leftover debugging `console.log` statements.
```
