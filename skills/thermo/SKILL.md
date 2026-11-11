---
name: thermo
description: >
  Run an unusually strict architectural and maintainability review focusing on "Code Judo"
  structural simplification, spaghetti conditional elimination, and modularity health.
  Use when the user asks for a thermo review, thermonuclear audit, or deep maintainability critique.
---

# Thermo Architectural & Maintainability Review

Use this skill for an uncompromising, senior-staff level audit focused on structural simplification, abstraction quality, and long-term codebase health. 

Above all, this skill pushes the reviewer to be **ambitious** about code structure. Do not merely identify local cleanup opportunities. Actively search for **"Code Judo"** moves: restructurings that preserve behavior while making the implementation dramatically simpler, smaller, more direct, and more elegant.

---

## Core Audit Directives

### 1. "Code Judo" Structural Simplification
* Do not settle for "this could be a bit cleaner."
* Look for opportunities to reframe the design so that whole branches, redundant helpers, temporary modes, condition chains, or intermediate layers disappear entirely.
* Prefer solutions that make the resulting code feel inevitable in hindsight.

### 2. Hunt Down Spaghetti Growth
* Flag branching logic that scatters special cases across files.
* Detect ad-hoc state mutations and flag variables that multiply execution paths.
* Identify thin wrappers and indirection layers that add cognitive load without providing real safety, encapsulation, or clarity.

### 3. Modularity & File Health (Flexible Guideline)
* Flag files where uncontrolled growth has led to mixed responsibilities or "god-object" scope.
* Prompt for structural decomposition when a file becomes difficult to reason about as a single unit (typically 500–1,000+ lines depending on the stack).
* **Explicit Exemptions**:
  * Database migrations
  * Test suites and integration fixtures
  * Generated files (`openapi.ts`, schema outputs, protobuf)
  * Standalone build/bootstrap utility scripts

### 4. Type-Boundary & Contract Integrity
* Scrutinize type-boundary erosion: loose casts (`as unknown as T`), non-null assertions (`!`), or weakened interfaces introduced just to appease the compiler without accurately modeling the domain.
* Ensure domain invariants are enforced at system boundaries, not patched with defensive guards throughout internal functions.

### 5. Passing Tests Do Not Excuse Architectural Decay
* Functional correctness is a baseline requirement, not an excuse for structural debt.
* If a PR or diff adds technical debt, bloated glue code, or brittle couplings, reject it even if the test suite passes 100%.

---

## Preferred Remedies

When identifying code-quality flaws, recommend root structural fixes:
* **Delete** an entire layer of indirection rather than polishing it.
* **Reframe the state model** so that conditional branching vanishes instead of being centralized.
* **Change ownership boundaries** so the feature becomes a natural extension of an existing abstraction.
* **Replace condition ladders** with a typed state machine, strategy map, or explicit dispatcher.
* **Turn special-case branches** into a simpler default flow with fewer exceptions.
* **Extract pure, decoupled modules** when a single file handles distinct domain concepts.

---

## Tone & Output Standard

* **Voice**: Direct, demanding, and objective. Zero sycophancy or performative praise.
* **Actionable Critiques**: Always accompany critiques with concrete, minimal architectural remedies.
* **Example Prompts & Verdicts**:
  * *"This adds another special-case branch into an already busy flow. Can we reframe the state model to eliminate the branch?"*
  * *"This wrapper file only re-exports two functions with minor type conversions. Delete the wrapper and import the primitives directly."*
  * *"This module mixes database access with UI formatting across 800+ lines. Decompose this into domain logic and presentation before adding new routes."*
