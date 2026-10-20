#!/usr/bin/env node

/**
 * ==============================================================================
 * Heimdall Agent — Intelligent Multi-Agent Sentinel & Environment Bootstrapper
 * ==============================================================================
 * Detects installed tools (Claude Code, Antigravity, Codex CLI, Claude Desktop),
 * inspects active API endpoints (GhostCLI, Google OAuth, or Official APIs),
 * dynamically discovers user PATH & doctrine directories (zero hardcoded paths),
 * provides 1-second auto-sync ('heimdall sync') for newly installed AI tools,
 * and deploys skills via native live junctions (--link) or isolated copies.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal color formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const userHome = os.homedir();
const skillsDir = path.join(__dirname, 'skills');
const toolsDir = path.join(__dirname, 'tools');
const doctrineDir = path.join(__dirname, 'doctrine');
const profilesPath = path.join(__dirname, 'config', 'profiles.json');
const modelsPath = path.join(__dirname, 'config', 'models.json');

const targetPaths = {
  claude: path.join(userHome, '.claude', 'skills'),
  gemini: path.join(userHome, '.gemini', 'skills'),
  codex: path.join(userHome, '.codex', 'skills'),
  agents: path.join(userHome, '.agents', 'skills')
};

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}   ██╗  ██╗███████╗██╗███╗   ███╗██████╗  █████╗ ██╗     ██╗     
   ██║  ██║██╔════╝██║████╗ ████║██╔══██╗██╔══██╗██║     ██║     
   ███████║█████╗  ██║██╔████╔██║██║  ██║███████║██║     ██║     
   ██╔══██║██╔══╝  ██║██║╚██╔╝██║██║  ██║██╔══██║██║     ██║     
   ██║  ██║███████╗██║██║ ╚═╝ ██║██████╔╝██║  ██║███████╗███████╗
   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝${colors.reset}
   ${colors.dim}Intelligent Multi-Agent Sentinel & Quality Bootstrapper${colors.reset}
`);
}

function checkCommand(cmd) {
  try {
    const isWin = os.platform() === 'win32';
    const checkCmd = isWin ? `where.exe ${cmd}` : `which ${cmd}`;
    const result = execSync(checkCmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf8' });
    return result.split('\r\n')[0].split('\n')[0].trim();
  } catch {
    return null;
  }
}

/**
 * Resolves the platform-specific Claude Desktop configuration directory:
 * - Windows: %APPDATA%\Claude
 * - macOS:   ~/Library/Application Support/Claude
 * - Linux:   $XDG_CONFIG_HOME/Claude or ~/.config/Claude
 */
function getClaudeDesktopDir() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(userHome, 'Library', 'Application Support', 'Claude');
  }
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
    return path.join(appData, 'Claude');
  }
  const configHome = process.env.XDG_CONFIG_HOME || path.join(userHome, '.config');
  return path.join(configHome, 'Claude');
}

/**
 * Resiliently discovers the OpenAI Codex CLI binary on PATH and standard Windows/POSIX install paths.
 */
function detectCodexBinary() {
  const onPath = checkCommand('codex');
  if (onPath) return onPath;

  if (os.platform() === 'win32') {
    const candidates = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'OpenAI', 'Codex', 'bin', 'codex.exe'),
      path.join(userHome, '.codex', 'packages', 'standalone', 'current', 'bin', 'codex.exe'),
      path.join(userHome, '.local', 'bin', 'codex.exe'),
      'C:\\Program Files\\OpenAI\\Codex\\bin\\codex.exe',
      'C:\\Apps\\codex\\codex.exe'
    ];
    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  } else {
    const posixCandidates = [
      path.join(userHome, '.local', 'bin', 'codex'),
      path.join(userHome, '.codex', 'bin', 'codex'),
      '/usr/local/bin/codex'
    ];
    for (const cand of posixCandidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

/**
 * Dynamically discovers candidate tools/bin directories registered in the user's PATH.
 * Never assumes a hardcoded system path.
 */
function detectPathCandidates() {
  const pathEnv = process.env.PATH || '';
  const delimiter = path.delimiter;
  const rawDirs = pathEnv.split(delimiter).map(d => d.trim()).filter(Boolean);
  const candidates = [];
  const seen = new Set();

  for (const raw of rawDirs) {
    try {
      const resolved = path.resolve(raw);
      const lower = resolved.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      if (fs.existsSync(resolved)) {
        // Exclude system directories
        const isSystem = lower.includes('\\windows\\system32') ||
                         lower.includes('\\windows\\system') ||
                         lower.includes('/usr/sbin') ||
                         lower.includes('/sbin') ||
                         lower.includes('\\powershell');
        if (!isSystem) {
          const isToolLike = lower.includes('tool') ||
                             lower.includes('bin') ||
                             lower.includes('.local') ||
                             lower.includes('apps') ||
                             lower.includes('npm') ||
                             lower.includes('cargo') ||
                             lower.includes('heimdall');
          if (isToolLike) {
            candidates.push(resolved);
          }
        }
      }
    } catch {}
  }

  // Fallback candidate if none detected
  const defaultUserTools = path.join(userHome, '.heimdall', 'bin');
  if (candidates.length === 0) {
    candidates.push(defaultUserTools);
  }

  return candidates;
}

/**
 * Dynamically discovers candidate paths for universal doctrine AGENTS.md.
 */
function detectDoctrineCandidates() {
  const candidates = [];
  const seen = new Set();

  // 1. User home agents (~/.agents/AGENTS.md)
  const userDoctrine = path.join(userHome, '.agents', 'AGENTS.md');
  candidates.push(userDoctrine);
  seen.add(userDoctrine.toLowerCase());

  // 2. Parent workspace directory if exists
  const parentWorkspace = path.join(path.dirname(__dirname), 'AGENTS.md');
  if (!seen.has(parentWorkspace.toLowerCase())) {
    if (fs.existsSync(parentWorkspace)) {
      candidates.unshift(parentWorkspace); // Prioritize if already active
    } else {
      candidates.push(parentWorkspace);
    }
    seen.add(parentWorkspace.toLowerCase());
  }

  // 3. Current working directory if different
  const cwdDoctrine = path.join(process.cwd(), 'AGENTS.md');
  if (!seen.has(cwdDoctrine.toLowerCase())) {
    candidates.push(cwdDoctrine);
  }

  return candidates;
}

function detectEnvironment() {
  const detected = {
    tools: {},
    endpoints: {},
    pathCandidates: detectPathCandidates(),
    doctrineCandidates: detectDoctrineCandidates()
  };

  // 1. Check CLI binaries on PATH / standard install paths
  detected.tools.claude = checkCommand('claude');
  detected.tools.agy = checkCommand('agy');
  detected.tools.codex = detectCodexBinary();
  detected.tools.cursor = checkCommand('cursor');
  detected.tools.windsurf = checkCommand('windsurf');

  // 2. Check Claude Desktop directory (Windows, macOS, Linux)
  const claudeDesktopDir = getClaudeDesktopDir();
  detected.tools.claudeDesktop = fs.existsSync(claudeDesktopDir) ? claudeDesktopDir : null;

  // 3. Check Claude Code endpoint
  const claudeSettingsPath = path.join(userHome, '.claude', 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      if (settings.env?.ANTHROPIC_BASE_URL || settings.env?.CLAUDE_BASE_URL) {
        detected.endpoints.claude = settings.env.ANTHROPIC_BASE_URL || settings.env.CLAUDE_BASE_URL;
      }
    } catch {}
  }
  if (!detected.endpoints.claude && process.env.ANTHROPIC_BASE_URL) {
    detected.endpoints.claude = process.env.ANTHROPIC_BASE_URL;
  }
  if (!detected.endpoints.claude) {
    detected.endpoints.claude = 'https://api.anthropic.com (Official)';
  }

  // 4. Check Codex endpoint
  const codexConfigPath = path.join(userHome, '.codex', 'config.toml');
  if (fs.existsSync(codexConfigPath)) {
    try {
      const content = fs.readFileSync(codexConfigPath, 'utf8');
      const match = content.match(/base_url\s*=\s*"([^"]+)"/);
      if (match) detected.endpoints.codex = match[1];
    } catch {}
  }
  if (!detected.endpoints.codex && process.env.OPENAI_BASE_URL) {
    detected.endpoints.codex = process.env.OPENAI_BASE_URL;
  }
  if (!detected.endpoints.codex) {
    detected.endpoints.codex = 'https://api.openai.com (Official)';
  }

  // 5. Check Gemini / Google Antigravity
  // Antigravity connects via Google OAuth / Cloud credentials by default unless a custom API key or proxy is set.
  if (process.env.GEMINI_BASE_URL) {
    detected.endpoints.gemini = `Custom Proxy (${process.env.GEMINI_BASE_URL})`;
  } else if (process.env.GEMINI_API_KEY) {
    detected.endpoints.gemini = 'Google GenAI API Key (Custom Direct API)';
  } else if (detected.tools.agy || fs.existsSync(path.join(userHome, '.gemini', 'antigravity-cli'))) {
    detected.endpoints.gemini = 'Google OAuth (Default Native Account)';
  } else {
    detected.endpoints.gemini = 'Not Installed / Unconfigured';
  }

  return detected;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    profile: 'full',
    agents: null,
    link: false,
    clean: false,
    sync: false,
    tools: true,
    doctrine: true,
    toolsDir: null,
    doctrinePath: null,
    dryRun: false,
    audit: false,
    syncModels: false,
    yes: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--audit') options.audit = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--sync-models') options.syncModels = true;
    else if (arg === 'sync' || arg === '--sync') options.sync = true;
    else if (arg === '--link') options.link = true;
    else if (arg === '--no-link') options.link = false;
    else if (arg === '--clean') options.clean = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--no-tools') options.tools = false;
    else if (arg === '--no-doctrine') options.doctrine = false;
    else if (arg === '--profile' && args[i + 1]) {
      options.profile = args[++i];
    } else if (arg === '--agents' && args[i + 1]) {
      options.agents = args[++i].split(',').map(s => s.trim().toLowerCase());
    } else if (arg === '--tools-dir' && args[i + 1]) {
      options.toolsDir = args[++i];
    } else if (arg === '--doctrine-path' && args[i + 1]) {
      options.doctrinePath = args[++i];
    }
  }

  return options;
}

function cleanTargetDirectory(targetDir, dryRun = false, preserveList = ['.system']) {
  if (!fs.existsSync(targetDir)) return 0;
  let cleanedCount = 0;
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });

  for (const entry of entries) {
    if (preserveList.includes(entry.name)) continue;
    const fullPath = path.join(targetDir, entry.name);
    if (!dryRun) {
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          fs.rmSync(fullPath);
        } else {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      } catch {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
    cleanedCount++;
  }
  return cleanedCount;
}

function linkDirectory(src, dest, dryRun = false) {
  if (dryRun) return;
  if (fs.existsSync(dest)) {
    try {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        fs.rmSync(dest);
      } else {
        fs.rmSync(dest, { recursive: true, force: true });
      }
    } catch {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  }
  const symlinkType = os.platform() === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(src, dest, symlinkType);
}

function copyDirectory(src, dest, dryRun = false) {
  if (!fs.existsSync(src)) return 0;
  if (!dryRun && !fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirectory(srcPath, destPath, dryRun);
    } else {
      if (!dryRun) {
        fs.copyFileSync(srcPath, destPath);
      }
      count++;
    }
  }

  return count;
}

function deployGlobalShims(targetToolsDir, dryRun = false) {
  if (!targetToolsDir) return;
  if (!dryRun && !fs.existsSync(targetToolsDir)) {
    fs.mkdirSync(targetToolsDir, { recursive: true });
  }

  const isWin = os.platform() === 'win32';
  const entryPath = path.resolve(__filename);

  if (isWin) {
    const cmdShim = path.join(targetToolsDir, 'heimdall.cmd');
    const psShim = path.join(targetToolsDir, 'heimdall.ps1');

    const cmdContent = `@echo off\nnode "${entryPath}" %*\n`;
    const psContent = `param([Parameter(ValueFromRemainingArguments=$true)]$args)\n& node "${entryPath}" @args\n`;

    if (!dryRun) {
      fs.writeFileSync(cmdShim, cmdContent, 'utf8');
      fs.writeFileSync(psShim, psContent, 'utf8');
    }
  } else {
    const shShim = path.join(targetToolsDir, 'heimdall');
    const shContent = `#!/usr/bin/env sh\nexec node "${entryPath}" "$@"\n`;
    if (!dryRun) {
      fs.writeFileSync(shShim, shContent, { mode: 0o755 });
    }
  }
}

async function syncModelsFromEndpoint() {
  console.log(`${colors.cyan}${colors.bold}=== Live Model Synchronization ===${colors.reset}\n`);
  const detected = detectEnvironment();
  let proxyUrl = detected.endpoints.claude || detected.endpoints.codex;

  if (proxyUrl.includes('ghostcli.cloud')) {
    const targetUrl = 'https://ghostcli.cloud/v1/models';
    console.log(`Probing GhostCLI Models API: ${colors.yellow}${targetUrl}${colors.reset}...`);
    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const data = await res.json();
        const modelsList = data.data || data.models || [];
        console.log(`${colors.green}✔ Successfully discovered ${modelsList.length} live models from GhostCLI!${colors.reset}\n`);

        let currentModels = {};
        if (fs.existsSync(modelsPath)) {
          currentModels = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
        }

        currentModels.ghostcli = modelsList.map(m => ({
          id: m.id || m.slug,
          displayName: m.display_name || m.id,
          context: m.context_window ? `${Math.round(m.context_window / 1000)}K` : '1M',
          description: m.description || ''
        }));

        fs.writeFileSync(modelsPath, JSON.stringify(currentModels, null, 2));
        console.log(`${colors.green}✔ Synchronized models catalog to config/models.json${colors.reset}\n`);
      } else {
        console.log(`${colors.yellow}Notice: Endpoint returned HTTP ${res.status}. Preserving cached models.json.${colors.reset}\n`);
      }
    } catch (err) {
      console.log(`${colors.yellow}Notice: Could not reach remote models API (${err.message}). Using local models.json.${colors.reset}\n`);
    }
  } else {
    console.log(`Using configured models from ${modelsPath}.\n`);
  }
}

async function runSync(options, detected) {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Auto-Sync Engine ===${colors.reset}\n`);
  console.log(`Scanning for newly installed AI tools on PATH...\n`);

  const allAvailableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let syncedAny = false;

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    let toolInstalled = false;
    if (agent === 'claude' && detected.tools.claude) toolInstalled = true;
    else if (agent === 'gemini' && (detected.tools.agy || fs.existsSync(path.join(userHome, '.gemini', 'antigravity-cli')))) toolInstalled = true;
    else if (agent === 'codex' && detected.tools.codex) toolInstalled = true;
    else if (agent === 'agents') toolInstalled = true;

    if (toolInstalled) {
      const exists = fs.existsSync(targetDir);
      const currentSkills = exists
        ? fs.readdirSync(targetDir, { withFileTypes: true }).filter(d => d.name !== '.system')
        : [];

      if (!exists || currentSkills.length < allAvailableSkills.length) {
        console.log(`-> Newly active harness detected: ${colors.bold}${agent.toUpperCase()}${colors.reset} (${targetDir})`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        let count = 0;
        for (const skill of allAvailableSkills) {
          const srcSkill = path.join(skillsDir, skill);
          const destSkill = path.join(targetDir, skill);
          linkDirectory(srcSkill, destSkill, false);
          count++;
        }
        console.log(`   ${colors.green}✔ Linked ${count} skills via NTFS Junctions${colors.reset}\n`);
        syncedAny = true;
      } else {
        console.log(`  ${colors.green}✔${colors.reset} ${agent.toUpperCase().padEnd(8)}: 100% in sync (${currentSkills.length} skills active)`);
      }
    }
  }

  // Check Claude Desktop
  if (detected.tools.claudeDesktop) {
    const claudeDesktopFile = path.join(detected.tools.claudeDesktop, 'claude_desktop_config.json');
    let deskConfig = { mcpServers: {} };
    if (fs.existsSync(claudeDesktopFile)) {
      try { deskConfig = JSON.parse(fs.readFileSync(claudeDesktopFile, 'utf8')); } catch {}
    }
    if (!deskConfig.mcpServers?.context7) {
      if (!deskConfig.mcpServers) deskConfig.mcpServers = {};
      deskConfig.mcpServers.context7 = {
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"]
      };
      fs.writeFileSync(claudeDesktopFile, JSON.stringify(deskConfig, null, 2));
      console.log(`  ${colors.green}✔${colors.reset} Configured Context7 MCP for Claude Desktop`);
      syncedAny = true;
    }
  }

  // Refresh bridge tools & shims
  const activeToolsDir = options.toolsDir || detected.pathCandidates[0];
  if (activeToolsDir && fs.existsSync(activeToolsDir)) {
    deployGlobalShims(activeToolsDir, false);
  }

  if (syncedAny) {
    console.log(`\n${colors.bold}${colors.green}✔ Auto-sync complete! All active AI tools are now synchronized.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bold}${colors.green}✔ All detected AI tools are already up to date.${colors.reset}\n`);
  }
}

function runAudit(options) {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Environment Audit ===${colors.reset}\n`);

  const detected = detectEnvironment();
  console.log(`${colors.bold}Detected Tools on Machine:${colors.reset}`);
  console.log(`  Claude Code CLI:    ${detected.tools.claude ? colors.green + detected.tools.claude + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.claude}${colors.reset}`);
  console.log(`  Google Antigravity: ${detected.tools.agy ? colors.green + detected.tools.agy + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.gemini}${colors.reset}`);
  console.log(`  OpenAI Codex CLI:   ${detected.tools.codex ? colors.green + detected.tools.codex + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.codex}${colors.reset}`);
  console.log(`  Claude Desktop:     ${detected.tools.claudeDesktop ? colors.green + detected.tools.claudeDesktop + colors.reset : colors.dim + 'Not found' + colors.reset}`);
  console.log('');

  const availableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Repository Canonical Skills: ${colors.green}${availableSkills.length}${colors.reset}\n`);

  const unlinkedTools = [];

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    if (fs.existsSync(targetDir)) {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true })
        .filter(d => (d.isDirectory() || d.isSymbolicLink()) && d.name !== '.system');

      let linkedCount = 0;
      for (const entry of entries) {
        try {
          if (fs.lstatSync(path.join(targetDir, entry.name)).isSymbolicLink()) {
            linkedCount++;
          }
        } catch {}
      }

      const installed = entries.map(d => d.name);
      const missing = availableSkills.filter(s => !installed.includes(s));
      const statusColor = missing.length === 0 ? colors.green : colors.yellow;
      const linkLabel = linkedCount === installed.length && installed.length > 0
        ? ` (${colors.cyan}Live Junctions / Single Source of Truth${colors.reset})`
        : linkedCount > 0 ? ` (${linkedCount} linked, ${installed.length - linkedCount} copies)` : ' (Static copies)';

      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${statusColor}${installed.length} skills${colors.reset} in ${targetDir}${linkLabel}`);

      if (installed.length === 0) {
        unlinkedTools.push(agent);
      }
    } else {
      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${colors.dim}NOT INSTALLED (${targetDir})${colors.reset}`);
      if ((agent === 'claude' && detected.tools.claude) ||
          (agent === 'gemini' && detected.tools.agy) ||
          (agent === 'codex' && detected.tools.codex)) {
        unlinkedTools.push(agent);
      }
    }
  }

  if (unlinkedTools.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}[!] Notice:${colors.reset} Installed tools missing skill links: ${unlinkedTools.join(', ')}`);
    console.log(`    Run ${colors.cyan}heimdall sync${colors.reset} to link skills automatically in 1 second.`);
  }

  const activeToolsDir = options.toolsDir || detected.pathCandidates[0];
  console.log(`\n${colors.bold}Cross-Agent Bridge Tools Directory:${colors.reset}`);
  if (activeToolsDir && fs.existsSync(activeToolsDir)) {
    const tools = fs.readdirSync(activeToolsDir).filter(f => f.includes('bridge') || f.includes('heimdall'));
    console.log(`  ${colors.green}Found ${tools.length} active scripts in ${activeToolsDir}${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}Tools directory unconfigured or empty (${activeToolsDir || 'None'})${colors.reset}`);
  }

  const activeDoctrine = options.doctrinePath || (detected.doctrineCandidates.find(p => fs.existsSync(p)) || detected.doctrineCandidates[0]);
  console.log(`\n${colors.bold}Universal Doctrine:${colors.reset}`);
  if (fs.existsSync(activeDoctrine)) {
    console.log(`  ${colors.green}Active at ${activeDoctrine}${colors.reset}`);
  } else {
    console.log(`  ${colors.dim}Not found at ${activeDoctrine}${colors.reset}`);
  }

  console.log('');
}

async function runInteractive(options, detected) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(`${colors.bold}${colors.cyan}--- Detected Environment on Your Machine ---${colors.reset}`);
    console.log(`  [${detected.tools.claude ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Claude Code CLI      ${detected.tools.claude ? '(' + detected.tools.claude + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.claude}${colors.reset}`);
    console.log(`  [${detected.tools.agy ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Google Antigravity   ${detected.tools.agy ? '(' + detected.tools.agy + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.gemini}${colors.reset}`);
    console.log(`  [${detected.tools.codex ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] OpenAI Codex CLI     ${detected.tools.codex ? '(' + detected.tools.codex + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.codex}${colors.reset}`);
    console.log(`  [${detected.tools.claudeDesktop ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Claude Desktop       ${detected.tools.claudeDesktop ? '(' + detected.tools.claudeDesktop + ')' : '(Not found)'}`);
    console.log('');

    console.log(`${colors.yellow}Where would you like Heimdall installed?${colors.reset}`);
    console.log(`  1. All Detected Tools (Full Ecosystem) [Recommended]`);
    console.log(`  2. Claude Code CLI only`);
    console.log(`  3. Google Antigravity CLI only`);
    console.log(`  4. OpenAI Codex CLI only`);
    console.log(`  5. Claude Desktop only (MCP & Playbooks)`);
    console.log(`  6. Custom Multi-Selection (e.g. Claude + Gemini)`);

    const tChoice = await rl.question(`Choose installation targets [1-6, default: 1]: `);
    if (tChoice === '2') options.agents = ['claude'];
    else if (tChoice === '3') options.agents = ['gemini'];
    else if (tChoice === '4') options.agents = ['codex'];
    else if (tChoice === '5') options.agents = ['desktop'];
    else if (tChoice === '6') {
      const custom = await rl.question(`Enter comma-separated targets (claude, gemini, codex, desktop): `);
      options.agents = custom.split(',').map(s => s.trim().toLowerCase());
    } else {
      options.agents = ['all'];
    }

    console.log(`\n${colors.yellow}Select Installation Profile Tier:${colors.reset}`);
    console.log(`  1. full     - All 49 curated skills (Complete Powerhouse)`);
    console.log(`  2. minimal  - 15 core skills (Planning, TDD, Anti-Slop, Taste, Hygiene)`);
    console.log(`  3. security - 12 security skills (Differential HTTP probing, OWASP, Trail of Bits)`);
    console.log(`  4. design   - 14 frontend skills (Taste, GSAP motion, Brandkit, Tokens)`);

    const pChoice = await rl.question(`Choose profile tier [1-4, default: 1]: `);
    if (pChoice === '2') options.profile = 'minimal';
    else if (pChoice === '3') options.profile = 'security';
    else if (pChoice === '4') options.profile = 'design';
    else options.profile = 'full';

    console.log(`\n${colors.yellow}Select Deployment Mode:${colors.reset}`);
    console.log(`  1. Live NTFS Junctions / Symlinks (Single Source of Truth, Instant Sync) [Recommended]`);
    console.log(`  2. Physical Isolated Copies (Independent folders)`);
    const mChoice = await rl.question(`Choose mode [1-2, default: 1]: `);
    options.link = mChoice !== '2';

    const cleanChoice = await rl.question(`Clean existing legacy skills before installing? (y/n, default: y): `);
    options.clean = cleanChoice.toLowerCase() !== 'n';

    // Dynamic Tools Path Discovery
    console.log(`\n${colors.yellow}Cross-Agent Bridge Tools & CLI Shortcut Location:${colors.reset}`);
    detected.pathCandidates.forEach((cand, idx) => {
      console.log(`  ${idx + 1}. ${cand} (Found on PATH)`);
    });
    console.log(`  ${detected.pathCandidates.length + 1}. Custom Directory Path`);
    console.log(`  ${detected.pathCandidates.length + 2}. Skip Tools Installation`);

    const toolsInput = await rl.question(`Select destination [1-${detected.pathCandidates.length + 2}, default: 1]: `);
    const chosenIdx = parseInt(toolsInput, 10);
    if (chosenIdx >= 1 && chosenIdx <= detected.pathCandidates.length) {
      options.toolsDir = detected.pathCandidates[chosenIdx - 1];
      options.tools = true;
    } else if (chosenIdx === detected.pathCandidates.length + 1) {
      const customPath = await rl.question(`Enter custom directory: `);
      options.toolsDir = customPath.trim();
      options.tools = true;
    } else if (chosenIdx === detected.pathCandidates.length + 2) {
      options.tools = false;
    } else {
      options.toolsDir = detected.pathCandidates[0];
      options.tools = true;
    }

    // Dynamic Doctrine Path Discovery
    console.log(`\n${colors.yellow}Universal Doctrine (AGENTS.md) Location:${colors.reset}`);
    detected.doctrineCandidates.forEach((cand, idx) => {
      const existsLabel = fs.existsSync(cand) ? ` (${colors.green}Active${colors.reset})` : '';
      console.log(`  ${idx + 1}. ${cand}${existsLabel}`);
    });
    console.log(`  ${detected.doctrineCandidates.length + 1}. Custom File Path`);
    console.log(`  ${detected.doctrineCandidates.length + 2}. Skip Doctrine Deployment`);

    const docInput = await rl.question(`Select destination [1-${detected.doctrineCandidates.length + 2}, default: 1]: `);
    const chosenDocIdx = parseInt(docInput, 10);
    if (chosenDocIdx >= 1 && chosenDocIdx <= detected.doctrineCandidates.length) {
      options.doctrinePath = detected.doctrineCandidates[chosenDocIdx - 1];
      options.doctrine = true;
    } else if (chosenDocIdx === detected.doctrineCandidates.length + 1) {
      const customDoc = await rl.question(`Enter custom AGENTS.md path: `);
      options.doctrinePath = customDoc.trim();
      options.doctrine = true;
    } else if (chosenDocIdx === detected.doctrineCandidates.length + 2) {
      options.doctrine = false;
    } else {
      options.doctrinePath = detected.doctrineCandidates[0];
      options.doctrine = true;
    }
  } finally {
    rl.close();
  }
}

async function main() {
  printBanner();
  const options = parseArgs();
  const detected = detectEnvironment();

  if (options.audit) {
    runAudit(options);
    process.exit(0);
  }

  if (options.syncModels) {
    await syncModelsFromEndpoint();
    process.exit(0);
  }

  if (options.sync) {
    await runSync(options, detected);
    process.exit(0);
  }

  // Set default dynamic paths if not specified
  if (!options.toolsDir) {
    options.toolsDir = detected.pathCandidates[0];
  }
  if (!options.doctrinePath) {
    options.doctrinePath = detected.doctrineCandidates.find(p => fs.existsSync(p)) || detected.doctrineCandidates[0];
  }

  if (!options.yes) {
    await runInteractive(options, detected);
  } else if (!options.agents) {
    options.agents = ['all'];
  }

  const profilesData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
  const selectedProfile = profilesData.profiles[options.profile] || profilesData.profiles.full;

  console.log(`\n${colors.bold}${colors.cyan}=== Executing Heimdall Installation ===${colors.reset}`);
  console.log(`Profile:   ${colors.bold}${selectedProfile.name}${colors.reset} (${options.profile})`);
  console.log(`Mode:      ${options.link ? colors.cyan + 'Live Junctions (Single Source of Truth)' + colors.reset : 'Physical Copies'}`);
  console.log(`Cleanup:   ${options.clean ? colors.yellow + 'Wiping legacy skills before install' + colors.reset : 'Incremental update'}`);
  console.log(`Targets:   ${options.agents.join(', ')}`);
  console.log(`Tools Dir: ${options.tools ? colors.green + options.toolsDir + colors.reset : 'Skipped'}`);
  console.log(`Doctrine:  ${options.doctrine ? colors.green + options.doctrinePath + colors.reset : 'Skipped'}`);
  console.log(`Dry Run:   ${options.dryRun ? colors.yellow + 'ENABLED' + colors.reset : 'No'}\n`);

  // 1. Resolve skills to deploy
  const allAvailableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const skillsToInstall = selectedProfile.skills === '*'
    ? allAvailableSkills
    : selectedProfile.skills.filter(s => allAvailableSkills.includes(s));

  console.log(`Selected Skills to Deploy: ${colors.green}${skillsToInstall.length}${colors.reset}`);

  // 2. Resolve destination agent directories
  let activeDestinations = [];
  if (options.agents.includes('all')) {
    activeDestinations = Object.entries(targetPaths);
  } else {
    for (const agent of options.agents) {
      if (targetPaths[agent]) {
        activeDestinations.push([agent, targetPaths[agent]]);
      }
    }
  }

  // 3. Clean and deploy skills
  for (const [agent, targetDir] of activeDestinations) {
    console.log(`\n-> Deploying to ${colors.bold}${agent.toUpperCase()}${colors.reset} (${targetDir})...`);
    if (!options.dryRun && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (options.clean) {
      const cleaned = cleanTargetDirectory(targetDir, options.dryRun);
      if (cleaned > 0) {
        console.log(`   ${colors.yellow}Cleaned ${cleaned} legacy entries (preserved vendor files)${colors.reset}`);
      }
    }

    let installedCount = 0;
    for (const skill of skillsToInstall) {
      const srcSkill = path.join(skillsDir, skill);
      const destSkill = path.join(targetDir, skill);

      if (options.link) {
        linkDirectory(srcSkill, destSkill, options.dryRun);
      } else {
        copyDirectory(srcSkill, destSkill, options.dryRun);
      }
      installedCount++;
    }
    const modeVerb = options.link ? 'Linked (NTFS Junctions)' : 'Synchronized';
    console.log(`   ${colors.green}✔ ${modeVerb} ${installedCount} skills to ${agent}${colors.reset}`);
  }

  // 4. Configure Claude Desktop if selected or in 'all'
  if (options.agents.includes('desktop') || options.agents.includes('all')) {
    const claudeDesktopDir = getClaudeDesktopDir();
    const claudeDesktopFile = path.join(claudeDesktopDir, 'claude_desktop_config.json');

    console.log(`\n-> Configuring Claude Desktop (${claudeDesktopFile})...`);
    if (!options.dryRun) {
      if (!fs.existsSync(claudeDesktopDir)) fs.mkdirSync(claudeDesktopDir, { recursive: true });
      let deskConfig = { mcpServers: {} };
      if (fs.existsSync(claudeDesktopFile)) {
        try { deskConfig = JSON.parse(fs.readFileSync(claudeDesktopFile, 'utf8')); } catch {}
      }
      if (!deskConfig.mcpServers) deskConfig.mcpServers = {};
      deskConfig.mcpServers.context7 = {
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"]
      };
      fs.writeFileSync(claudeDesktopFile, JSON.stringify(deskConfig, null, 2));
    }
    console.log(`   ${colors.green}✔ Configured Context7 MCP for Claude Desktop${colors.reset}`);
  }

  // 5. Deploy tools & global heimdall CLI shims if requested
  if (options.tools && options.toolsDir) {
    console.log(`\n-> Deploying Bridge Tools & 'heimdall' CLI to ${colors.bold}${options.toolsDir}${colors.reset}...`);
    if (!options.dryRun && !fs.existsSync(options.toolsDir)) {
      fs.mkdirSync(options.toolsDir, { recursive: true });
    }
    const tools = fs.readdirSync(toolsDir);
    for (const tool of tools) {
      const src = path.join(toolsDir, tool);
      const dest = path.join(options.toolsDir, tool);
      if (!options.dryRun) {
        fs.copyFileSync(src, dest);
        if (os.platform() !== 'win32' && tool.endsWith('.sh')) {
          try { fs.chmodSync(dest, 0o755); } catch {}
        }
      }
    }
    // Deploy global heimdall shim
    deployGlobalShims(options.toolsDir, options.dryRun);
    console.log(`   ${colors.green}✔ Deployed ${tools.length} cross-model bridge tools + 'heimdall' global CLI shim${colors.reset}`);
  }

  // 6. Deploy universal doctrine if requested
  if (options.doctrine && options.doctrinePath) {
    console.log(`\n-> Deploying Universal Doctrine to ${colors.bold}${options.doctrinePath}${colors.reset}...`);
    const srcDoc = path.join(doctrineDir, 'AGENTS.md');
    if (fs.existsSync(srcDoc) && !options.dryRun) {
      const docParent = path.dirname(options.doctrinePath);
      if (!fs.existsSync(docParent)) fs.mkdirSync(docParent, { recursive: true });
      fs.copyFileSync(srcDoc, options.doctrinePath);
    }
    console.log(`   ${colors.green}✔ Universal AGENTS.md doctrine active at ${options.doctrinePath}${colors.reset}`);
  }

  console.log(`\n${colors.bold}${colors.green}=== Heimdall Installation Complete! ===${colors.reset}\n`);
}

main().catch(err => {
  console.error(`\n${colors.red}Error executing Heimdall installer:${colors.reset}`, err);
  process.exit(1);
});
