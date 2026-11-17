---
name: ruminate
description: Mine historical Claude and Gemini session transcripts for correction patterns, repeated preferences, skill trigger failures, and doctrine violations. Writes findings as memory files or skill amendments. Use when bootstrapping a brain from existing conversation history or running periodic deep audits.
---

# Ruminate: Session Transcript Mining

Extract actionable behavioral signals from historical session JSONLs across Claude Code and Gemini/Antigravity. This is the `/ruminate` equivalent from brainmaxxing — finding what `/reflect` missed by scanning bulk history.

---

## 1. When to Run

- Bootstrapping a new project's memory from existing sessions
- Periodic deep audit (weekly/monthly) after accumulating corrections
- After noticing repeated friction with a specific agent or skill
- Before major skill/agent refactors to ground changes in evidence

---

## 2. Data Sources

### Claude Code Sessions
- **Location**: `C:\Users\Bernardo\.claude\projects\<project-dir>\*.jsonl`
- **Exclude**: `subagents\` subdirectories (noise; focus on main orchestrator turns)
- **Schema**: Each line is JSON. User messages have `"type":"user"` with `"message.content"`. Assistant messages have `"type":"assistant"`. Tool calls appear as `"type":"tool_use"`. Timestamps in ISO 8601.

### Gemini/Antigravity Sessions
- **Location**: `C:\Users\Bernardo\.gemini\antigravity-cli\history.jsonl`
- **Schema**: Each line is JSON with `"display"` (user prompt text), `"timestamp"` (epoch ms), `"workspace"`, optional `"conversationId"`. Simpler than Claude — user prompts only, no assistant responses inline.

---

## 3. Extraction Dimensions

Mine each dimension independently. For every finding, record: source file, timestamp, verbatim excerpt, and recommended action.

### 3.1 Correction Patterns (Highest Priority)
**Signal**: User message that contradicts, overrides, or corrects a preceding assistant action.
**Detection heuristics**:
- User messages containing: "no", "wrong", "don't", "stop", "actually", "I said", "not like that", "fix this", "that's incorrect"
- User messages immediately following an assistant tool call that revert or undo it
- Explicit negative feedback: "this is bad", "terrible", "waste of tokens"

**Output**: New rule for CLAUDE.md, AGENTS.md, or specific skill frontmatter.

### 3.2 Repeated Instructions
**Signal**: Same or semantically similar instruction given 3+ times across different sessions.
**Detection heuristics**:
- Fuzzy-match user prompts across sessions (normalize whitespace, lowercase)
- Cluster by semantic intent (e.g., "don't start dev server", "never run npm dev", "no dev servers")
- Count occurrences per cluster

**Output**: Promote to global default in CLAUDE.md or AGENTS.md if not already present. If already present but violated, flag as doctrine enforcement gap.

### 3.3 Skill Trigger Failures
**Signal**: Task description matches a skill's trigger phrases but no `Skill` tool invocation appears in the session.
**Detection heuristics**:
- Parse assistant messages for `"type":"tool_use"` with `"name":"Skill"`
- Compare user task descriptions against known skill trigger phrases (from skill frontmatter `description` fields)
- Flag sessions where trigger matched but skill was never invoked

**Output**: Amend skill `description` to add missing trigger phrases, or create new skill if gap is systemic.

### 3.4 Agent Selection Accuracy
**Signal**: Subagent spawned for task that didn't require specialization, or wrong agent type selected.
**Detection heuristics**:
- Count `Agent` tool invocations per session
- Correlate with session outcome (did subagent produce useful output vs. redundant work?)
- Flag sessions with 5+ subagents that could have been single-agent

**Output**: Tighten agent dispatch heuristics in orchestrator or agent descriptions.

### 3.5 Doctrine Compliance
**Signal**: Session violates explicit AGENTS.md constraints.
**Key doctrines to check**:
- ZERO DEV-SERVER: search for `npm run dev`, `vite`, `next dev`, `uvicorn`, `flask run`, etc. in tool calls
- BLUF/STE: check assistant response structure (does it lead with verdict?)
- KARPATHY SIMPLICITY: flag sessions with >20 tool calls for single-file edits
- PROGRESSIVE DISCLOSURE: flag unnecessary subagent spawns

**Output**: Strengthen guardrails, add hooks, or document justified exceptions.

### 3.6 Cross-Agent Consistency
**Signal**: Same task handled differently by Claude vs. Gemini, with divergent quality.
**Detection heuristics**:
- Match Gemini `workspace` to Claude project directory
- Compare prompt similarity across agents for same workspace/timeframe
- Note which agent produced fewer corrections or more complete output

**Output**: Codify winning pattern into shared skills or AGENTS.md.

---

## 4. Execution Protocol

1. **Scope selection**: Ask user which projects/date ranges to mine, or default to all sessions in current project.
2. **Stream processing**: Read JSONLs line-by-line. Never load entire file into context. Use `Get-Content -ReadCount 100` or equivalent streaming.
3. **Extraction pass**: For each dimension, emit candidate findings with source references.
4. **Deduplication**: Merge semantically identical findings. Keep highest-frequency version.
5. **Validation**: Present top-N findings to user with excerpts. Do NOT auto-write memory files without confirmation.
6. **Write confirmed findings**: Use memory file format (see §5). Update MEMORY.md index.

---

## 5. Output Format

Each confirmed finding becomes a memory file at `C:\Users\Bernardo\.claude\projects\<project>\memory\<slug>.md`:

```markdown
---
name: <kebab-case-slug>
description: <one-line summary for recall relevance>
metadata:
  type: feedback | project
  source_sessions: [<session-id-1>, <session-id-2>]
  extracted_by: ruminate
  extraction_date: YYYY-MM-DD
---

<The extracted rule, preference, or lesson. Be concrete and actionable.>

**Why:** <What went wrong or what pattern emerged from sessions.>
**How to apply:** <Specific behavioral change for agents/skills.>
```

Update `MEMORY.md` index with one line per new file:
```
- [<slug>](<slug>.md) — <hook phrase>
```

---

## 6. Guardrails

- **Never auto-modify skills or AGENTS.md**. Only propose amendments; user confirms.
- **Redact secrets**: Strip any API keys, tokens, or credentials found in transcripts before writing findings.
- **Respect scope**: If user says "podium-app only", do not mine heimdall-agent sessions.
- **Token hygiene**: Process in batches. Summarize intermediate results. Never dump raw JSONL into context.
- **Evidence over assertion**: Every finding must include verbatim transcript excerpt and source file path. No speculative patterns without grounding.