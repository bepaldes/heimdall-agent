---
name: grill-me
description: Relentlessly interview the user to stress-test and sharpen a plan, architecture, or design before implementation. Use when planning features, resolving tradeoffs, or when the user invokes /grill-me.
---

# The Grilling Protocol (Stress-Test & Sharpen Plans)

Interview the user relentlessly until you reach an airtight shared understanding. Map the problem space as a **design tree**: every decision branches into the decisions that hang off it.

---

## 1. The Design Tree Frontier (Round-by-Round)

Work the design tree in **rounds**. 
- The **frontier** is every decision whose prerequisites are already settled: the questions you can ask *now* without guessing at answers you haven't heard yet.
- Ask the whole frontier in one round: number each question and provide your concrete recommendation.
- **Dependency Rule**: If Question B depends on the choice made in Question A, Question B does NOT belong in this round. It belongs in a *subsequent* round once Question A is resolved.

---

## 2. The "Yes-to-Approve" Triage Format

Always format questions so the user can quickly accept your recommendations with minimal keystrokes (e.g. replying *"1: yes, 2: yes, 3: no do Y"*):

```markdown
❓ **Q1 - <Decision Title>**: <Context, boundary conditions, edge cases, and options>

➡️ **Recommended**: <Your recommended answer and justification>

---

❓ **Q2 - <Decision Title>**: <Context, boundary conditions, edge cases, and options>

➡️ **Recommended**: <Your recommended answer and justification>
```

**Rule**: Word each question and recommendation so answering *"yes"* or *"accept"* selects your recommended path.

---

## 3. Autonomous Fact-Finding Invariant (Zero Lazy Questions)

**Finding facts is your job, never the user's.**
- If a question hinges on a fact from the repository (e.g., existing middleware, schema types, installed package versions, API endpoints, config flags):
  - **Look it up autonomously** using filesystem tools, greps, and doc inspections before asking.
  - Never ask the user for anything you can discover yourself.
  - Only present decisions, requirements, and business trade-offs that cannot be answered by the code.

---

## 4. ADR & Documentation Integration

When grilling uncovers settled architectural decisions for significant or multi-system features:
- Record each settled decision in an **Architectural Decision Record (ADR)** under `docs/adr/YYYY-MM-DD-<decision>.md` (or the project's designated ADR directory).
- Keep ADRs compact: Context, Decision, Invariants, Consequences.
- Maintain consistent domain terminology in the project's domain docs or glossary.

---

## 5. Exit Criteria

The grilling session is complete when:
1. The decision frontier is empty (all branches visited, zero hidden assumptions).
2. The user has confirmed the proposed recommendations or made their adjustments.
3. The agreed scope is ready to be compiled into a specification or plan (`to-spec` / `writing-plans` / `05-canonical-plan-template.md`).
