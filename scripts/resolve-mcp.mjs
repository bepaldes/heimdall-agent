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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'config', 'mcp.template.json');
const RESOLVED_PATH = path.join(ROOT, 'config', 'mcp.resolved.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SYNC = args.includes('--sync');

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

// Report unresolved placeholders
const serialized = JSON.stringify(resolved);
const unresolved = serialized.match(/\{\{[^}]+_UNRESOLVED\}\}/g);
if (unresolved) {
  console.warn(`⚠ Unresolved placeholders: ${unresolved.join(', ')}`);
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

  const geminiPath = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
  fs.mkdirSync(path.dirname(geminiPath), { recursive: true });
  fs.writeFileSync(geminiPath, JSON.stringify(geminiConfig, null, 2) + '\n');
  console.log(`✓ Synced to ${geminiPath}`);

  // Claude Code uses settings.json mcpServers — same flat format
  const claudeSettingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
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
  const codexConfigPath = path.join(os.homedir(), '.codex', 'config.toml');
  if (fs.existsSync(codexConfigPath)) {
    let codexToml = fs.readFileSync(codexConfigPath, 'utf8');
    // Strip existing [mcp_servers.*] sections
    codexToml = codexToml.replace(/^\[mcp_servers\.[^\]]*\][\s\S]*?(?=^\[|\s*$)/gm, '');
    // Append new mcp_servers sections for enabled non-URL servers
    for (const [name, server] of Object.entries(resolved.mcpServers)) {
      if (server.disabled || server.config.serverUrl) continue;
      const argsStr = server.config.args.map(a => ` "${a.replace(/"/g, '\\"')}"`).join(',');
      codexToml += `\n[mcp_servers.${name}]\ncommand = "${server.config.command.replace(/\\/g, '\\\\')}"\nargs = [${argsStr} ]\nstartup_timeout_sec = 30\ntool_timeout_sec = 450\n`;
    }
    fs.writeFileSync(codexConfigPath, codexToml.trimEnd() + '\n');
    console.log(`✓ Synced to ${codexConfigPath}`);
  }

  // ── Hermes CLI (config.yaml) ─────────────────────────────────────
  const hermesConfigPath = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'hermes', 'config.yaml');
  if (fs.existsSync(hermesConfigPath)) {
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
        mcpBlock += `  ${name}:\n    url: "${server.config.serverUrl}"\n`;
      } else {
        mcpBlock += `  ${name}:\n    command: "${server.config.command.replace(/\\/g, '\\\\')}"\n    args:\n`;
        for (const arg of server.config.args) {
          mcpBlock += `      - "${arg.replace(/\\/g, '\\\\')}"\n`;
        }
        if (server.config.env) {
          mcpBlock += `    env:\n`;
          for (const [k, v] of Object.entries(server.config.env)) {
            mcpBlock += `      ${k}: "${v.replace(/\\/g, '\\\\')}"\n`;
          }
        }
      }
    }
    if (!hasEntries) mcpBlock = '';
    hermesYaml = hermesYaml.trimEnd() + '\n\n' + mcpBlock;
    fs.writeFileSync(hermesConfigPath, hermesYaml);
    console.log(`✓ Synced to ${hermesConfigPath}`);
  }
}

console.log('\nDone. Restart agent sessions to pick up changes.');