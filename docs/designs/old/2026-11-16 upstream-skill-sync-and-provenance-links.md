# Plan: Upstream Skill Provenance Links & `upstream-skill-sync` Triage Skill

### Plan BLUF
- **Goal**: Add clickable upstream links to `readme.html` and `README*.md`, classify all 68+ skills by `integrationMode` in `config/skills.json`, and create `skills/upstream-skill-sync/SKILL.md` with a 3-tier update rubric.
- **Architectural Approach**: Approach A — enrich `config/skills.json` with `integrationMode` (`mirror` | `adapted` | `native`), bind a new `upstream-skill-sync` skill to `orchestrator` and `modernizer`, and surface `upstream` URLs across `readme.html`, `README.md`, and `README.pt-BR.md`.
- **Risk & Blast Radius**: Low — additive documentation, registry metadata, and one new skill (`68` → `69` modules, `29` → `30` toolkits); verified by `test/catalog-integrity.test.mjs` and `npm test`.
- **Human Approval Gate**: Required before modifying repository source/config files.

---

## Goal Description

Every skill in `config/skills.json` already records an `upstream` repository URL, and `heimdall update-skill <name|all>` prints those URLs. However:
1. `readme.html` and `README.md` / `README.pt-BR.md` do not link individual skills or toolkits directly to their original upstream sources.
2. Users have no standardized skill or decision rubric to instruct an AI harness to audit upstream repositories and classify changes into **Safe (1:1)**, **Defer / Selective Merge**, or **Not Recommended (Reject)** without overwriting Heimdall-specific customizations (such as `/ruminate` additions in `handoff` and `writing-plans`, BLUF/ASD-STE100 rules, or the Zero Dev-Server Policy).

This plan implements **Approach A** (Skill-Driven + Registry Metadata).

---

## Proposed Changes

### 1. Registry Metadata & Triage Rubric (`config/skills.json`)

- Add `integrationMode` to every skill entry in `skills`:
  - `"mirror"`: Clean 1:1 upstream skill (safe for direct diffing and 1:1 updates after security scan).
  - `"adapted"`: Upstream skill with Heimdall-specific additions or overrides (e.g., `handoff`, `writing-plans`, `modern-web-guidance`, `ruminate`). Requires selective delta incorporation.
  - `"native"`: Authored inside `heimdall-agent` (e.g., `communication-doctrine`, `mcp-sync`, `mcp-cleanup`, `claude-collaborator`, `gemini-collaborator`, `codex-collaborator`, `upstream-skill-sync`).
- Register the new `upstream-skill-sync` standalone suite & skill entry (`totalSuites`: `30`, `totalModules`: `69`).

---

### 2. Upstream Sync Skill & Agent Bindings

- Create `skills/upstream-skill-sync/SKILL.md` with frontmatter triggers (`"update skills"`, `"sync upstream skills"`, `"check skill updates"`, `"audit upstream"`).
- Define the 5-step execution workflow in ASD-STE100 syntax:
  1. **Read Registry**: Load `config/skills.json` and filter by target skill, suite, or `all`.
  2. **Check Upstream**: Run `git ls-remote <upstream>` or inspect upstream `SKILL.md` / release notes.
  3. **Security Gate**: Run `snyk-agent-scan` heuristics on fetched upstream diffs to block prompt injection or credential harvesting.
  4. **Classify via 3-Tier Triage Rubric**:
     - **Tier 1 — Safe (1:1 Replace / Fast-Forward)**: Applies to `"mirror"` skills when upstream adds bugfixes, clearer examples, or new Baseline rules without violating Heimdall doctrine.
     - **Tier 2 — Defer / Selective Merge**: Applies to `"adapted"` skills (or upstream skills overlapping existing Heimdall agents/doctrine). Extract only non-conflicting improvements; preserve `/ruminate` rules, BLUF/STE headers, and Goldfish isolation.
     - **Tier 3 — Not Recommended (Reject / Skip)**: Reject upstream changes that introduce dev-server commands, chatbot closers, vague qualifiers (`ensure`, `properly`), bloated wrappers, or vendor lock-in.
  5. **Report & Verify**: Output a `Review Verdict` BLUF summary listing each skill's tier, source revision, and `npm test` status.
- Bind `upstream-skill-sync` in `agents/orchestrator.md` and `agents/modernizer.md`.

---

### 3. Upstream Provenance Links & Documentation Sync

- Update `readme.html`: add an `Upstream ↗` link and `mirror` / `adapted` / `native` badge to every skill card, add `upstream-skill-sync`, and update counters (`69` skills, `30` toolkits).
- Update `README.md` and `README.pt-BR.md`: add clickable upstream links to suite headings and standalone toolkit bullets, add `upstream-skill-sync` to the Standalone Toolkits list and `orchestrator` / `modernizer` rows.
- Update `docs/SKILLS.md` and run `syncCatalogCounts`.

---

## Verification Plan

1. Run `npm test` (`node --test test/*.test.mjs`) to verify `Catalog and Documentation Count Integrity Sentinel` and `Communication Doctrine (BLUF & STE) Invariants` pass with `69` modules and `30` suites.
2. Verify every skill card in `readme.html` has a valid `href="https://..."` upstream link and zero AI-slop buzzwords.
