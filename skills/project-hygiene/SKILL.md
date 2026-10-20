---
name: project-hygiene
description: Audit and enforce codebase hygiene across any project: eliminate dead code, purge unused dependencies and exports, enforce architectural module boundaries, clear stale build caches, and verify type safety.
---

# Project Hygiene Skill (`project-hygiene`)

Use this skill to conduct repeatable, automated code and repository hygiene sweeps across any software project. It is generic, language-aware, and safe to execute periodically or prior to releases.

## The 4-Phase Hygiene Audit

### Phase 1: Boundary & Architectural Integrity
Verify that no forbidden imports or layer violations exist:
- In TypeScript/JavaScript monorepos:
  ```bash
  pnpm boundaries   # or npx dependency-cruiser --config .dependency-cruiser.js src
  ```
- In modular monoliths: assert zero cross-schema direct queries and zero imports bypassing public interfaces (e.g. `@podium/contracts`).

### Phase 2: Dead Code & Orphaned Export Detection
Identify unreferenced exports, unused files, and stale packages:
- Run AST-based dead code analyzers:
  ```bash
  npx knip
  # or
  npx ts-prune
  ```
- Rule: Do not delete public contract interfaces or migration registry exports. Focus on unreferenced internal utilities, dead helpers, and orphaned test files.

### Phase 3: Workspace & Cache Purging
Reclaim disk space and eliminate cached build artifacts that mask clean build errors:
- Remove build outputs (`dist/`, `.next/`, `build/`, `out/`).
- Remove compiler and test caches (`.tsbuildinfo`, `.turbo/`, `.pytest_cache/`, `e2e/test-results/`).
- Remove temporary provisioning logs, obsolete scratch files (`.openapi-spec.txt`, `.provision-*.txt`, `tmp-*.mjs`).
- Never delete node_modules or source fixtures unless explicitly requested.

### Phase 4: Type Safety & Validation Gate
Confirm that zero syntax or compilation regressions were introduced:
- Run strict compilation check:
  ```bash
  pnpm build
  # or
  npx tsc --noEmit
  ```
- Run unit test suite:
  ```bash
  pnpm test
  ```
