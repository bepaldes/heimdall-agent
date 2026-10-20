---
name: snyk-agent-scan
description: Scans AI agent skills, MCP configurations, prompts, and tooling environments for prompt injections, secret leakage, tool poisoning, and security vulnerabilities using Snyk Agent Scan CLI. Use when reviewing installed skills, testing agent security, auditing MCP servers, or auditing agent supply chain risks.
---

# Snyk Agent Scan

Discover and audit agent components, skills, tools, and MCP servers for security vulnerabilities and prompt injection vectors.

## Capabilities
- **Skill Vulnerability Scanning**: Detect malicious instructions, prompt injections, or unauthorized file access instructions inside `SKILL.md` files.
- **MCP Server Audit**: Discover and inspect installed Model Context Protocol (MCP) servers, tool schemas, and environment flags.
- **Agent Supply Chain Security**: Detect secret leaks, tool poisoning, and command injection paths across agent environments.

## Quick CLI Usage
```bash
# Scan all installed skills and configs across the machine
snyk-agent-scan scan

# Scan without contacting live stdio servers
snyk-agent-scan scan --no-skills

# Scan output formatted as JSON
snyk-agent-scan scan --json
```
