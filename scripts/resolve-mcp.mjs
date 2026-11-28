#!/usr/bin/env node
/**
 * Heimdall MCP Resolver
 * Reads config/mcp.template.json, resolves {{PLACEHOLDER}} tokens to local paths,
 * writes config/mcp.resolved.json, and optionally syncs to agent harness configs.
 *
 * Usage:
 *   node scripts/resolve-mcp.mjs              # Generate mcp.resolved.json only
 *   node scripts/resolve-mcp.mjs --sync       # Also write to ~/.gemini/config/mcp_config.json
 *   node scripts/resolve-mcp.mjs --dry-run    # Print resolved config without writing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { escapeToml, escapeYamlString } = require('../lib/mcp-serialize.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'config', 'mcp.template.json');
const RESOLVED_PATH = path.join(ROOT, 'config', 'mcp.resolved.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SYNC = args.includes('--sync');

function resolveAllowedAgents() {
  const idx = args.indexOf('--agents');
  if (idx !== -1 && args[idx + 1]) {
    return new Set(args[idx + 1].split(',').map(s => s.trim().toLowerCase()));
  }
  const statePath = path.join(os.homedir(), '.heimdall-state.json');
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (Array.isArray(state.agents) && state.agents.length > 0) {
        return new Set(state.agents.map(s => String(s).toLowerCase()));
      }
    } catch {}
  }
  return new Set(['all']);
}

const ALLOWED_AGENTS = resolveAllowedAgents();
const isAgentAllowed = (agent) => ALLOWED_AGENTS.has('all') || ALLOWED_AGENTS.has(agent);

// ── Path Resolution ──────────────────────────────────────────────

// Strip \r and trailing whitespace from shell output (Windows dir/where emit \r\n)
function cleanPath(s) {
  return s ? s.replace(/\r/g, '').trim() : s;
}

function findNodeExe() {
  if (process.platform === 'win32') {
    try {
      return cleanPath(execSync('where node.exe', { encoding: 'utf8' }).split('\n')[0]);
    } catch {
      return 'C:\\Program Files\\nodejs\\node.exe';
    }
  }
  try {
    return cleanPath(execSync('which node', { encoding: 'utf8' }));
  } catch {
    return '/usr/local/bin/node';
  }
}

function findNpmGlobalRoot() {
  try {
    return cleanPath(execSync('npm root -g', { encoding: 'utf8' }));
  } catch {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA || '', 'npm', 'node_modules');
    }
    return '/usr/local/lib/node_modules';
  }
}

function resolveEntrypoint(npmRoot, pkg, entrypoint) {
  const candidate = path.join(npmRoot, pkg, entrypoint);
  if (fs.existsSync(candidate)) return candidate;
  // Fallback: search recursively for the entrypoint filename
  const basename = path.basename(entrypoint);
  const pkgDir = path.join(npmRoot, pkg);
  if (!fs.existsSync(pkgDir)) return null;
  try {
    const found = cleanPath(execSync(`dir /s /b "${pkgDir}\\${basename}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).split('\n')[0]);
    return found && fs.existsSync(found) ? found : null;
  } catch {
    return null;
  }
}

function detectOpenDesign() {
  if (process.platform !== 'win32') return {};
  const appData = process.env.APPDATA || '';
  const odBase = path.join(appData, 'Open Design');
  if (!fs.existsSync(odBase)) return {};

  // Find the exe
  let exe = null;
  try {
    const exes = execSync(`dir /s /b "${odBase}\\Open Design.exe"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      .split('\n').map(cleanPath).filter(Boolean);
    exe = exes.find(e => e.includes('\\en\\')) || exes[0] || null;
  } catch { /* not found */ }

  // Find daemon-cli.mjs
  let daemonCli = null;
  try {
    const results = execSync(`dir /s /b "${odBase}\\daemon-cli.mjs"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      .split('\n').map(cleanPath).filter(Boolean);
    daemonCli = results[0] || null;
  } catch { /* not found */ }

  // Find data dir
  let dataDir = null;
  try {
    const results = execSync(`dir /s /b /ad "${odBase}\\data"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      .split('\n').map(cleanPath).filter(Boolean);
    dataDir = results.find(d => d.includes('release-stable')) || results[0] || null;
  } catch { /* not found */ }

  // Find pipe name from existing config or generate placeholder
  let pipe = null;
  try {
    const geminiConfig = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
    if (fs.existsSync(geminiConfig)) {
      const existing = JSON.parse(fs.readFileSync(geminiConfig, 'utf8'));
      pipe = existing.mcpServers?.['open-design']?.env?.OD_SIDECAR_CLIENT_ENDPOINT || null;
    }
  } catch { /* ignore */ }

  // Bootstrap exe
  let bootstrapExe = null;
  const localPrograms = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Open Design', 'Open Design.exe');
  if (fs.existsSync(localPrograms)) bootstrapExe = localPrograms;

  return { exe, daemonCli, dataDir, pipe, bootstrapExe };
}

function findChromeExe() {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    ];
    return candidates.find(c => fs.existsSync(c)) || candidates[0];
  }
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return '/usr/bin/google-chrome';
}

// ── Main ─────────────────────────────────────────────────────────

const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
const npmRoot = findNpmGlobalRoot();
const nodeExe = findNodeExe();
const od = detectOpenDesign();

const vars = {
  NODE_EXE: nodeExe,
  CONTEXT7_ENTRYPOINT: resolveEntrypoint(npmRoot, '@upstash/context7-mcp', 'dist/index.js') || '{{CONTEXT7_ENTRYPOINT_UNRESOLVED}}',
  REA_ENTRYPOINT: resolveEntrypoint(npmRoot, 'rea-agents', 'scripts/rea.mjs') || '{{REA_ENTRYPOINT_UNRESOLVED}}',
  CHROME_DEVTOOLS_ENTRYPOINT: resolveEntrypoint(npmRoot, 'chrome-devtools-mcp', 'out/Default/gen/src/bin/chrome-devtools-mcp.js') || '{{CHROME_DEVTOOLS_ENTRYPOINT_UNRESOLVED}}',
  CHROME_EXE: findChromeExe(),
  OPEN_DESIGN_EXE: od.exe || '{{OPEN_DESIGN_EXE_UNRESOLVED}}',
  OPEN_DESIGN_DAEMON_CLI: od.daemonCli || '{{OPEN_DESIGN_DAEMON_CLI_UNRESOLVED}}',
  OPEN_DESIGN_DATA_DIR: od.dataDir || '{{OPEN_DESIGN_DATA_DIR_UNRESOLVED}}',
  OPEN_DESIGN_PIPE: od.pipe || '{{OPEN_DESIGN_PIPE_UNRESOLVED}}',
  OPEN_DESIGN_BOOTSTRAP_EXE: od.bootstrapExe || '{{OPEN_DESIGN_BOOTSTRAP_EXE_UNRESOLVED}}',
};

// Deep-replace {{VAR}} tokens in the parsed object tree (avoids JSON escape issues with Windows backslash paths)
function resolveTokens(obj) {
  if (typeof obj === 'string') {
    for (const [key, value] of Object.entries(vars)) {
      obj = obj.replaceAll(`{{${key}}}`, value);
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(resolveTokens);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = resolveTokens(v);
    return out;
  }
  return obj;
}

const resolved = resolveTokens(template);

// Strip resolve hints and autoDetect from output (they're template-only metadata)
for (const [name, server] of Object.entries(resolved.mcpServers)) {
  delete server.resolve;
  delete server.autoDetect;
}

if (DRY_RUN) {
  console.log(JSON.stringify(resolved, null, 2));
  process.exit(0);
}

// Write resolved config
fs.writeFileSync(RESOLVED_PATH, JSON.stringify(resolved, null, 2) + '\n');
console.log(`✓ Wrote ${RESOLVED_PATH}`);

// Report unresolved placeholders in enabled servers only
const enabledServers = Object.fromEntries(
  Object.entries(resolved.mcpServers).filter(([, srv]) => !srv.disabled)
);
const unresolved = JSON.stringify(enabledServers).match(/\{\{[^}]+_UNRESOLVED\}\}/g);
if (unresolved) {
  console.warn(`⚠ Unresolved placeholders in enabled servers: ${unresolved.join(', ')}`);
  console.warn('  Install missing packages globally: npm install -g <package-name>');
}

// ── Harness Sync ─────────────────────────────────────────────────

if (SYNC) {
  // Build Gemini-compatible config (flat mcpServers, no category/name/description/disabled wrapper)
  const geminiConfig = { mcpServers: {} };
  for (const [name, server] of Object.entries(resolved.mcpServers)) {
    if (server.disabled) continue;
    const entry = {};
    if (server.config.serverUrl) {
      entry.serverUrl = server.config.serverUrl;
    } else {
      entry.command = server.config.command;
      entry.args = server.config.args;
      if (server.config.env) entry.env = server.config.env;
    }
    geminiConfig.mcpServers[name] = entry;
  }

  if (isAgentAllowed('gemini')) {
    const geminiPath = path.join(process.env.GEMINI_CLI_HOME || path.join(os.homedir(), '.gemini'), 'config', 'mcp_config.json');
    fs.mkdirSync(path.dirname(geminiPath), { recursive: true });
    fs.writeFileSync(geminiPath, JSON.stringify(geminiConfig, null, 2) + '\n');
    console.log(`✓ Synced to ${geminiPath}`);
  }

  // Claude Code uses settings.json mcpServers — same flat format
  const claudeSettingsPath = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'settings.json');
  if (isAgentAllowed('claude') && fs.existsSync(claudeSettingsPath)) {
    const claudeSettings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
    claudeSettings.mcpServers = {};
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled) continue;
      if (server.config.serverUrl) {
        claudeSettings.mcpServers[name] = { type: 'url', url: server.config.serverUrl };
      } else {
        claudeSettings.mcpServers[name] = {
          command: server.config.command,
          args: server.config.args,
          ...(server.config.env && { env: server.config.env }),
        };
      }
    }
    fs.writeFileSync(claudeSettingsPath, JSON.stringify(claudeSettings, null, 2) + '\n');
    console.log(`✓ Synced to ${claudeSettingsPath}`);
  }

  // ── Codex CLI (config.toml) ──────────────────────────────────────
  const codexConfigPath = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml');
  if (isAgentAllowed('codex') && fs.existsSync(codexConfigPath)) {
    const lines = fs.readFileSync(codexConfigPath, 'utf8').split(/\r?\n/);
    const keptLines = [];
    let inMcpSection = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\[mcp_servers\.[^\]]*\]/.test(trimmed)) {
        inMcpSection = true;
        continue;
      }
      if (inMcpSection && /^\[/.test(trimmed)) {
        inMcpSection = false;
      }
      if (!inMcpSection) keptLines.push(line);
    }
    let codexToml = keptLines.join('\n').trimEnd() + '\n';
    // Append new mcp_servers sections for enabled non-URL servers
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled || server.config.serverUrl) continue;
      const argsStr = server.config.args.map(a => ` "${escapeToml(a)}"`).join(',');
      codexToml += `\n[mcp_servers.${name}]\ncommand = "${escapeToml(server.config.command)}"\nargs = [${argsStr} ]\nstartup_timeout_sec = 30\ntool_timeout_sec = 450\n`;
    }
    fs.writeFileSync(codexConfigPath, codexToml.trimEnd() + '\n');
    console.log(`✓ Synced to ${codexConfigPath}`);
  }

  // ── Hermes CLI (config.yaml) ─────────────────────────────────────
  const hermesConfigPath = path.join(process.env.HERMES_HOME || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'hermes'), 'config.yaml');
  if (isAgentAllowed('hermes') && fs.existsSync(hermesConfigPath)) {
    let hermesYaml = fs.readFileSync(hermesConfigPath, 'utf8');
    // Strip existing mcp_servers block (from "mcp_servers:" to next top-level key or EOF)
    hermesYaml = hermesYaml.replace(/^mcp_servers:[\s\S]*?(?=^[a-z_]+:|\s*$)/m, '');
    // Build new mcp_servers YAML block
    let mcpBlock = 'mcp_servers:\n';
    let hasEntries = false;
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled) continue;
      hasEntries = true;
      if (server.config.serverUrl) {
        mcpBlock += `  ${name}:\n    url: "${escapeYamlString(server.config.serverUrl)}"\n`;
      } else {
        mcpBlock += `  ${name}:\n    command: "${escapeYamlString(server.config.command)}"\n    args:\n`;
        for (const arg of server.config.args) {
          mcpBlock += `      - "${escapeYamlString(arg)}"\n`;
        }
        if (server.config.env) {
          mcpBlock += `    env:\n`;
          for (const [k, v] of Object.entries(server.config.env)) {
            mcpBlock += `      ${k}: "${escapeYamlString(v)}"\n`;
          }
        }
      }
    }
    if (!hasEntries) mcpBlock = '';
    hermesYaml = hermesYaml.trimEnd() + '\n\n' + mcpBlock;
    fs.writeFileSync(hermesConfigPath, hermesYaml);
    console.log(`✓ Synced to ${hermesConfigPath}`);
  }

  // ── VS Code User (mcp.json) ──────────────────────────────────────
  const vscodeUserDir = process.platform === 'win32'
    ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Code', 'User')
    : process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User')
      : path.join(os.homedir(), '.config', 'Code', 'User');
  if (isAgentAllowed('vscode') && fs.existsSync(vscodeUserDir)) {
    const vscodeMcpPath = path.join(vscodeUserDir, 'mcp.json');
    let vscodeMcp = { servers: {} };
    if (fs.existsSync(vscodeMcpPath)) {
      try {
        vscodeMcp = JSON.parse(fs.readFileSync(vscodeMcpPath, 'utf8'));
      } catch (err) {
        console.warn(`⚠ Failed to parse ${vscodeMcpPath}: ${err.message}`);
        vscodeMcp = { servers: {} };
      }
    }
    if (!vscodeMcp.servers || typeof vscodeMcp.servers !== 'object') vscodeMcp.servers = {};
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled) {
        delete vscodeMcp.servers[name];
        continue;
      }
      if (server.config.serverUrl) {
        vscodeMcp.servers[name] = { type: 'http', url: server.config.serverUrl };
      } else {
        vscodeMcp.servers[name] = {
          type: 'stdio',
          command: server.config.command,
          args: server.config.args,
          ...(server.config.env && { env: server.config.env }),
        };
      }
    }
    fs.writeFileSync(vscodeMcpPath, JSON.stringify(vscodeMcp, null, 2) + '\n');
    console.log(`✓ Synced to ${vscodeMcpPath}`);
  }

  // ── GitHub Copilot CLI (~/.copilot/mcp-config.json) ──────────────
  const copilotDir = path.join(os.homedir(), '.copilot');
  if (isAgentAllowed('vscode') && fs.existsSync(copilotDir)) {
    const copilotMcpPath = path.join(copilotDir, 'mcp-config.json');
    let copilotMcp = { mcpServers: {} };
    if (fs.existsSync(copilotMcpPath)) {
      try {
        copilotMcp = JSON.parse(fs.readFileSync(copilotMcpPath, 'utf8'));
      } catch (err) {
        console.warn(`⚠ Failed to parse ${copilotMcpPath}: ${err.message}`);
        copilotMcp = { mcpServers: {} };
      }
    }
    if (!copilotMcp.mcpServers || typeof copilotMcp.mcpServers !== 'object') copilotMcp.mcpServers = {};
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled) {
        delete copilotMcp.mcpServers[name];
        continue;
      }
      if (server.config.serverUrl) {
        copilotMcp.mcpServers[name] = { type: 'http', url: server.config.serverUrl };
      } else {
        copilotMcp.mcpServers[name] = {
          type: 'stdio',
          command: server.config.command,
          args: server.config.args,
          ...(server.config.env && { env: server.config.env }),
        };
      }
    }
    fs.writeFileSync(copilotMcpPath, JSON.stringify(copilotMcp, null, 2) + '\n');
    console.log(`✓ Synced to ${copilotMcpPath}`);
  }
}

console.log('\nDone. Restart agent sessions to pick up changes.');