---
name: mcp-cleanup
description: Kill orphaned MCP server processes left behind by crashed or closed agent sessions. Use when node.exe/cmd.exe count is high, MCP servers are unresponsive, or after closing multiple IDE/CLI sessions.
---

# MCP Cleanup Skill (`mcp-cleanup`)

Use this skill when the user reports slow performance, high process counts, unresponsive MCP tools, or after closing multiple agent sessions without clean shutdown.

---

## When to Invoke

- User says `/mcp-cleanup`, "kill mcp orphans", "clean up mcp", "too many node processes"
- When MCP servers fail to connect and orphan processes are suspected
- As part of post-crash recovery

---

## Execution Steps

1. **Count current MCP-related processes** (diagnostic baseline):
   - On Windows (PowerShell):
     ```powershell
     Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cmd.exe'" |
       Where-Object { $_.CommandLine -match 'context7-mcp|chrome-devtools-mcp|rea\.mjs|npx\.cmd|open-design' } |
       Select-Object ProcessId, Name, @{N='CmdLine';E={$_.CommandLine.Substring(0, [Math]::Min(120, $_.CommandLine.Length))}} |
       Format-Table -AutoSize
     ```
   - On macOS/Linux:
     ```bash
     ps aux | grep -E 'context7-mcp|chrome-devtools-mcp|rea\.mjs|npx' | grep -v grep
     ```

2. **Warn the user**: Tell them how many orphan processes were found and that killing them will break any active MCP connections. Ask for confirmation unless the user explicitly said "force" or "kill all".

3. **Kill orphaned processes**:
   - On Windows (PowerShell):
     ```powershell
     Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cmd.exe'" |
       Where-Object { $_.CommandLine -match 'context7-mcp|chrome-devtools-mcp|rea\.mjs|npx\.cmd' } |
       ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
     ```
   - On macOS/Linux:
     ```bash
     pkill -f 'context7-mcp|chrome-devtools-mcp|rea\.mjs|npx.*mcp'
     ```

4. **Verify cleanup**: Re-run the diagnostic count from step 1 and report how many processes remain.

5. **Recommend prevention**: Remind the user about `/mcp-sync` to ensure configs use direct `node.exe` calls instead of `npx`, which prevents future orphan multiplication.

---

## Guardrails

- NEVER kill node.exe/cmd.exe processes that do NOT match the MCP command-line patterns above.
- NEVER run cleanup while the user has active agent sessions unless they explicitly confirm.
- NEVER use `taskkill /F /IM node.exe` — this kills ALL node processes including unrelated apps.
- Always filter by CommandLine content, not just process name.
- Report exact counts before and after — never claim cleanup succeeded without verification.