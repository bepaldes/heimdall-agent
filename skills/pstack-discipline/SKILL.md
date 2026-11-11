---
name: pstack-discipline
description: >
  Enforce high-rigor engineering discipline from the pstack / poteto framework:
  "Prove It Works", "Fix Root Causes", "Test Behavior, Not Implementation",
  and "Subtract Before You Add" during orchestration and planning.
---

# PStack Engineering Discipline

A distilled set of non-negotiable operational principles originated by Lauren Tan (@poteto) in the `pstack` framework, designed to prevent AI agents from generating unverified, shallow, or symptom-masking code.

---

## The 5 Core Principles

### 1. Prove It Works
* Never assume, extrapolate, or assert that a system functions without empirical proof.
* Run terminating, non-interactive verification commands (unit tests, build checks, Playwright assertions) that actively observe behavior.
* A task is incomplete until the proof is captured.

### 2. Fix Root Causes
* Never apply defensive guards that merely hide runtime exceptions or symptoms.
* Trace failures back to the originating boundary or state inconsistency.
* A patch that masks a crash without resolving why invalid state reached that point is a rejected regression.

### 3. Test Behavior, Not Implementation
* Tests must exercise the system through its public boundaries exactly as a consumer or user does.
* Avoid brittle internal mocks and spy assertions that break during internal refactorings.
* If a test suite would still pass when internal functions return dummy values or no-ops, discard the test suite.

### 4. Subtract Before You Add
* Before adding new layers, abstractions, or dependencies, evaluate what can be removed or simplified.
* Reduce reader cognitive load, shrink state scope, and eliminate dead branches first.
* The cleanest feature is one that reuses existing architecture without expanding complexity.

### 5. Sequence Work into Verifiable Units
* Break complex tasks into small, self-contained, verifiable increments.
* Complete and verify unit $N$ before beginning unit $N+1$.
* Prevent speculative parallel diffs that fail together at integration time.
