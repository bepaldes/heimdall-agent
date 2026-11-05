---
name: communication-doctrine
description: >
  Bottom Line Up Front (BLUF) and Simplified Technical English (STE) communication doctrine.
  Enforces zero-latency verdicts in reports and unambiguous, imperative step definitions in plans.
---

# Communication Doctrine: BLUF & Simplified Technical English (STE)

This skill governs structured communication across Google Antigravity, Claude Code, and OpenAI Codex CLI. It eliminates AI throat-clearing, hidden conclusions, and linguistic ambiguity.

---

## 1. Macro Architecture: Bottom Line Up Front (BLUF)

Always state the decision, status, verdict, or core recommendation in the **first 1–2 sentences** before presenting context, analysis, or supporting steps.

### Schema A: Subagent Scratchpad Handoff (`docs/runs/<task_id>/report.md`)
Every subagent report must open with this exact 3-line block:
```markdown
### Subagent BLUF
- **Status**: SUCCESS | FAILURE | ESCALATED
- **Blast Radius**: [Files modified, tests added/executed, zero dev servers spawned]
- **Deliverable**: [Path to diff, artifact, or commit hash]
```

### Schema B: Code Reviewer & Security Sentinel Verdict (`agents/reviewer.md`)
Every review or audit output must open with this exact verdict block:
```markdown
### Review Verdict: APPROVED | BLOCKED | REVISION_NEEDED
- **Blockers**: <count>
- **Warnings**: <count>
- **Nits**: <count>
- **Mandatory Action**: [1-sentence summary of immediate action required before merge, or "None"]
```

### Schema C: Implementation Plan Header (`docs/designs/`)
Every implementation plan must lead with:
```markdown
### Plan BLUF
- **Goal**: [1 sentence describing exactly what is built]
- **Architectural Approach**: [1-2 sentences on core mechanism]
- **Risk & Blast Radius**: [Low | Medium | High — state key failure modes]
- **Human Approval Gate**: [Required before Phase X | Autonomous non-destructive]
```

---

## 2. Micro Syntax: Simplified Technical English (STE)

Derived from ASD-STE100 principles, STE eliminates ambiguous interpretation, reduces token waste, and guarantees deterministic execution by child subagents.

### Rule 1: Imperative Verb First
Every procedural step must start with an active imperative verb:
* **Approved Verbs**: `Create`, `Modify`, `Assert`, `Verify`, `Delete`, `Run`, `Open`, `Extract`, `Replace`, `Benchmark`.
* **Prohibited**: Passive constructions (*"The file should be updated..."*), conversational requests (*"Let's go ahead and..."*), or hedged steps (*"Consider checking..."*).

### Rule 2: Strict Sentence Length Limits
* **Procedural Steps**: Maximum **20 words** per step. Each step represents exactly one checkable operation.
* **Descriptive Text**: Maximum **25 words** per sentence.

### Rule 3: Banned Ambiguous Qualifiers (The Zero-Vagueness Lexicon)
The following words mask missing specifications and are strictly prohibited in implementation steps and suggested fixes:

| Banned Word | Why Prohibited | STE Replacement Pattern |
| :--- | :--- | :--- |
| `ensure` | Does not specify the mechanism. | `Verify <condition> equals <expected>. If not, <action>.` |
| `properly` | Subjective without testable criteria. | `Assert <field> matches regex <pattern>.` |
| `appropriately` | Defers specification to executor. | State the exact configuration parameter or value. |
| `gracefully` | Vague error handling. | `Catch <ErrorType>, log warning, and return <FallbackValue>.` |
| `as needed` / `as appropriate` | Unbounded scope. | Explicitly list the conditions or omit the step. |
| `robustly` / `seamlessly` | Pure AI marketing filler. | Delete the word. |
| `etc.` | Executor cannot guess remaining items. | List all items exhaustively. |

### Rule 4: Explicit Object Naming (No Floating Pronouns)
Do not use ambiguous pronouns (*"it"*, *"this"*, *"they"*, *"that"*) when referring to code symbols, files, or error states. Always repeat the specific noun:
* *Bad*: *"Read the config and update it so it does not fail when it is missing."*
* *STE*: *"Read `config.json`. If `port` key is missing, assign default port `8080`."*

---

## 3. Communication Checklist

Before finalizing any plan, subagent report, or review output:
- [ ] Verdict or conclusion is on Line 1 (BLUF).
- [ ] Procedural steps start with an approved imperative verb.
- [ ] No procedural step exceeds 20 words.
- [ ] No banned qualifiers (`ensure`, `properly`, `appropriately`, `gracefully`, `as needed`, `etc.`).
- [ ] All code targets and file paths are explicitly named.
