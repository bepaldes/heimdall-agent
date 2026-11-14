---
name: mcp-sync
description: Resolve Heimdall MCP template to local paths and sync to agent harness configs. Use when toggling MCP servers, setting up a new machine, or after installing/updating global npm MCP packages.
---

# MCP Sync Skill (`mcp-sync`)

Use this skill when the user wants to update MCP server configurations, toggle servers on/off, set up MCP on a new machine, or after running `npm install -g` / `npm update -g` for MCP packages.

---

## When to Invoke

- User says `/mcp-sync`, "sync mcp", "update mcp config", "enable/disable <server>"
- After installing or updating global MCP npm packages
- When setting up Heimdall on a new workstation
- When an MCP server fails to connect due to path issues

---

## Execution Steps

1. **Check prerequisites**: Verify `config/mcp.template.json` exists. If missing, report error and stop.

2. **Toggle servers if requested**: If the user asked to enable or disable a specific server, edit `config/mcp.template.json` and set `"disabled": true/false` on that server entry before resolving.

3. **Run the resolver**:
   ```bash
   node scripts/resolve-mcp.mjs --sync
   ```
   This generates `config/mcp.resolved.json` and writes to `~/.gemini/config/mcp_config.json` and `~/.claude/settings.json`.

4. **Report results**: Show which servers are enabled/disabled, any unresolved placeholders, and remind the user to restart agent sessions.

5. **If unresolved placeholders exist**: Tell the user which packages to install globally:
   ```bash
   npm install -g @upstash/context7-mcp chrome-devtools-mcp rea-agents
   ```
   Then re-run the resolver.

---

## Architecture Notes

- `config/mcp.template.json` is the portable source of truth (committed to git).
- `config/mcp.resolved.json` is machine-specific (gitignored).
- The resolver replaces `{{PLACEHOLDER}}` tokens with local paths detected at runtime.
- Disabled servers are excluded from harness configs but preserved in the template.
- Never use `npx` in resolved configs — always direct `node.exe` calls to avoid Windows process multiplication.

---

## Guardrails

- NEVER edit `config/mcp.resolved.json` directly — it is generated.
- NEVER add `npx` commands to any MCP config.
- NEVER start dev servers to test MCP connectivity.
- Always run `--sync` to propagate changes to harness configs; generating `mcp.resolved.json` alone does not update running agents.