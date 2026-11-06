---
name: mcp-engineering
description: Standards, JSON-RPC 2.0 protocol compliance, schema validation, stdio/SSE transport discipline, and security sandboxing for authoring Model Context Protocol (MCP) servers and tools.
---

# MCP Engineering Skill (`mcp-engineering`)

Use this skill when designing, building, debugging, or auditing Model Context Protocol (MCP) servers and client integrations for Google Antigravity, Claude Code, and other LLM agent runtimes.

---

## 1. Protocol Architecture & JSON-RPC 2.0 Compliance

All MCP servers communicate via JSON-RPC 2.0. Every tool, resource, and prompt implementation must adhere to canonical protocol primitives:

- **Tools (`tools/list`, `tools/call`)**: Executable functions invoked by the LLM with structured input arguments.
- **Resources (`resources/list`, `resources/read`)**: Read-only contextual data, file contents, or real-time metrics referenced by URI.
- **Prompts (`prompts/list`, `prompts/get`)**: Pre-packaged prompt templates exposed to the host client.

---

## 2. Tool Schema & Input Validation Discipline

1. **Strict JSON Schema Typing**:
   - Every tool definition must declare an explicit `inputSchema` containing `type: "object"`, typed properties, and a non-empty `required` array when parameters are mandatory:
     ```json
     {
       "name": "query_database",
       "description": "Executes a parameterized read-only SQL query against the target database.",
       "inputSchema": {
         "type": "object",
         "properties": {
           "query": { "type": "string", "description": "Parameterized SELECT SQL query" },
           "params": { "type": "array", "description": "Positional parameter values" }
         },
         "required": ["query"]
       }
     }
     ```
2. **Descriptive Tool Documentation**:
   - Provide clear, actionable descriptions explaining *when* the model should invoke the tool and *what* it returns.
3. **Graceful Error Responses**:
   - Return structured tool error payloads (`isError: true`, `content: [{ type: "text", text: "..." }]`) rather than crashing the JSON-RPC connection process.

---

## 3. Transport Discipline: Stdio vs. SSE

### Stdio Transport (Local Processes)
- **Stdout Purity Invariant**: `stdout` is reserved exclusively for valid JSON-RPC 2.0 messages.
- **NEVER** write debug logs, print statements, or library banners (`console.log`, `print()`) to `stdout`.
- All operational logging, diagnostics, and stack traces must be directed strictly to `stderr` (`console.error`, `process.stderr.write`). Any extraneous text on `stdout` corrupts JSON-RPC framing and drops the client connection.

### SSE Transport (HTTP / Remote Services)
- Enforce Bearer token or API key authentication on the HTTP handshake.
- Maintain persistent SSE channels for server-to-client notifications with periodic keepalive heartbeats.
- Bind endpoints to localhost (`127.0.0.1`) by default unless deployed behind an authenticated reverse proxy.

---

## 4. Security Sandboxing & Guardrails

1. **Path Traversal Defense**:
   - When tools read or write filesystem paths, always resolve against a canonical root boundary:
     ```typescript
     const safePath = path.resolve(allowedRoot, requestedPath);
     if (!safePath.startsWith(allowedRoot)) {
       throw new Error("Access denied: path traversal detected");
     }
     ```
2. **Command Injection Prevention**:
   - Never execute arbitrary shell strings via `exec()` or `eval()`. Use `execFile` or `spawn` with explicit argument arrays.
3. **Terminating Verification**:
   - Test MCP servers by instantiating the client transport in unit tests (`npm test`) and asserting valid responses for `tools/list` and `tools/call`. Never leave orphan server processes running.
