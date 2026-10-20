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
const agentsDir = path.join(__dirname, 'agents');
const playbooksDir = path.join(__dirname, 'playbooks');
const toolsDir = path.join(__dirname, 'tools');
const doctrineDir = path.join(__dirname, 'doctrine');
const profilesPath = path.join(__dirname, 'config', 'profiles.json');
const modelsPath = path.join(__dirname, 'config', 'models.json');
const agentsConfigPath = path.join(__dirname, 'config', 'agents.json');
const skillsConfigPath = path.join(__dirname, 'config', 'skills.json');

const targetPaths = {
  claude: path.join(userHome, '.claude', 'skills'),
  gemini: path.join(userHome, '.gemini', 'skills'),
  codex: path.join(userHome, '.codex', 'skills'),
  agents: path.join(userHome, '.agents', 'skills')
};

const targetAgentPaths = {
  claude: path.join(userHome, '.claude', 'agents'),
  gemini: path.join(userHome, '.gemini', 'agents'),
  codex: path.join(userHome, '.codex', 'agents'),
  agents: path.join(userHome, '.agents', 'agents')
};

const targetDoctrinePaths = {
  claude: path.join(userHome, '.claude', 'CLAUDE.md'),
  gemini: path.join(userHome, '.gemini', 'GEMINI.md'),
  codex: path.join(userHome, '.codex', 'AGENTS.md'),
  agents: path.join(userHome, '.agents', 'AGENTS.md')
};

const targetPlaybookPaths = {
  claude: path.join(userHome, '.claude', 'playbooks'),
  gemini: path.join(userHome, '.gemini', 'playbooks'),
  agents: path.join(userHome, '.agents', 'playbooks')
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

function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}Heimdall Agent CLI${colors.reset} — Intelligent Multi-Agent Sentinel & Quality Bootstrapper

${colors.bold}USAGE:${colors.reset}
  heimdall [command] [options]
  node setup.mjs [command] [options]

${colors.dim}Note: 'heimdall' and 'node setup.mjs' are identical. 'heimdall' is the global CLI shortcut.${colors.reset}

${colors.bold}PRIMARY SUBCOMMANDS:${colors.reset}
  ${colors.green}sync${colors.reset} (or ${colors.dim}--sync${colors.reset})           Scan PATH for newly installed AI tools and link skills (1-sec zero-drift)
  ${colors.green}audit${colors.reset} (or ${colors.dim}--audit${colors.reset})         Audit installed harnesses, active API endpoints, and skill counts
  ${colors.green}sync-models${colors.reset} (or ${colors.dim}--sync-models${colors.reset}) Probe active proxy/endpoint (e.g. GhostCLI) and refresh models.json
  ${colors.green}skills${colors.reset} (or ${colors.dim}--skills${colors.reset})         List all canonical skills, categories, and upstream provenance
  ${colors.green}update-skill <name|all>${colors.reset}     Inspect upstream repository, updates, and bounded review protocol
  ${colors.green}help${colors.reset} (or ${colors.dim}--help, -h${colors.reset})      Display this parameter and command reference

${colors.bold}SETUP & BOOTSTRAP OPTIONS:${colors.reset}
  ${colors.yellow}--profile <name>${colors.reset}       Skill profile tier: full (49), minimal (16), security (12), design (14) [default: full]
  ${colors.yellow}--agents <targets>${colors.reset}     Comma-separated harnesses: claude, gemini, codex, desktop, all [default: all]
  ${colors.yellow}--link / --no-link${colors.reset}     Use live NTFS junctions / symlinks vs static copies [default: false in wizard, true recommended]
  ${colors.yellow}--clean${colors.reset}                Wipe legacy skills from target directory before deploying
  ${colors.yellow}-y, --yes${colors.reset}              Non-interactive mode (use defaults or provided CLI arguments)
  ${colors.yellow}--dry-run${colors.reset}              Simulate execution without modifying the filesystem
  ${colors.yellow}--tools-dir <dir>${colors.reset}      Custom directory to deploy cross-model bridge tools and 'heimdall' CLI
  ${colors.yellow}--doctrine-path <file>${colors.reset} Custom file destination for AGENTS.md universal doctrine
  ${colors.yellow}--no-tools${colors.reset}             Skip deploying bridge tools and CLI shims
  ${colors.yellow}--no-doctrine${colors.reset}          Skip deploying AGENTS.md universal doctrine

${colors.bold}EXAMPLES:${colors.reset}
  heimdall sync                             # Instant sync after installing a new tool
  heimdall audit                            # Environment health check
  heimdall skills                           # Browse canonical skills catalog
  heimdall update-skill ponytail           # Inspect upstream provenance & review protocol for single skill
  heimdall update-skill all                # Generate full bounded review audit report
  heimdall sync-models                      # Refresh model catalogs
  node setup.mjs --clean --link --yes       # Recommended full automated setup with live junctions
  node setup.mjs --profile minimal --yes    # Minimal install for lightweight laptop
`);
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
    listSkills: false,
    updateSkill: null,
    help: false,
    yes: false
  };

  for (let i = 0; i < args.length; i++) {
    const rawArg = args[i];
    const arg = rawArg.toLowerCase();

    if (arg === 'help' || arg === '--help' || arg === '-h') options.help = true;
    else if (arg === 'audit' || arg === '--audit') options.audit = true;
    else if (arg === 'sync' || arg === '--sync') options.sync = true;
    else if (arg === 'sync-models' || arg === '--sync-models' || arg === 'syncmodels') options.syncModels = true;
    else if (arg === 'skills' || arg === '--skills') options.listSkills = true;
    else if (arg === 'update-skill' || arg === '--update-skill' || arg === 'updateskill') {
      options.updateSkill = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : 'all';
    }
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--link') options.link = true;
    else if (arg === '--no-link') options.link = false;
    else if (arg === '--clean') options.clean = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--no-tools') options.tools = false;
    else if (arg === '--no-doctrine') options.doctrine = false;
    else if (arg === '--profile' && args[i + 1]) {
      options.profile = args[++i].toLowerCase();
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

function deployAgentContracts(targetDir, link = false, clean = false, dryRun = false, agentsList = null) {
  if (!fs.existsSync(agentsDir)) return 0;
  const allFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  const agentFiles = agentsList ? allFiles.filter(f => agentsList.includes(f)) : allFiles;

  if (link && agentFiles.length === allFiles.length) {
    linkDirectory(agentsDir, targetDir, dryRun);
    return agentFiles.length;
  }

  if (!dryRun && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (clean) {
    cleanTargetDirectory(targetDir, dryRun);
  }

  let count = 0;
  for (const file of agentFiles) {
    const src = path.join(agentsDir, file);
    const dest = path.join(targetDir, file);
    if (!dryRun) {
      fs.copyFileSync(src, dest);
    }
    count++;
  }
  return count;
}

function cleanLegacyLocalAgents(dryRun = false) {
  const parksAppAgents = path.join(path.dirname(__dirname), 'parks-app', '.claude', 'agents');
  if (fs.existsSync(parksAppAgents)) {
    try {
      if (!dryRun) {
        fs.rmSync(parksAppAgents, { recursive: true, force: true });
        linkDirectory(agentsDir, parksAppAgents, false);
      }
      return parksAppAgents;
    } catch {}
  }
  return null;
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

  const allAvailableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];

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

      const targetAgentDir = targetAgentPaths[agent];
      const agentExists = fs.existsSync(targetAgentDir);
      const currentAgents = agentExists
        ? fs.readdirSync(targetAgentDir).filter(f => f.endsWith('.md'))
        : [];

      if (!exists || currentSkills.length < allAvailableSkills.length || !agentExists || currentAgents.length < allAvailableAgents.length) {
        console.log(`-> Newly active harness detected: ${colors.bold}${agent.toUpperCase()}${colors.reset}`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

        let count = 0;
        for (const skill of allAvailableSkills) {
          const srcSkill = path.join(skillsDir, skill);
          const destSkill = path.join(targetDir, skill);
          linkDirectory(srcSkill, destSkill, false);
          count++;
        }

        let agentCount = 0;
        if (targetAgentDir) {
          agentCount = deployAgentContracts(targetAgentDir, true, false, false);
        }

        // Synchronize doctrine & playbooks
        const targetDocFile = targetDoctrinePaths[agent];
        const srcDoc = path.join(doctrineDir, 'AGENTS.md');
        if (targetDocFile && fs.existsSync(srcDoc)) {
          const parentDir = path.dirname(targetDocFile);
          if (fs.existsSync(parentDir)) fs.copyFileSync(srcDoc, targetDocFile);
        }

        const targetPlayDir = targetPlaybookPaths[agent];
        if (targetPlayDir && fs.existsSync(playbooksDir)) {
          const parentDir = path.dirname(targetPlayDir);
          if (fs.existsSync(parentDir)) linkDirectory(playbooksDir, targetPlayDir, false);
        }

        console.log(`   ${colors.green}✔ Linked ${count} skills and ${agentCount} predefined agents via Live Junctions${colors.reset}\n`);
        syncedAny = true;
      } else {
        console.log(`  ${colors.green}✔${colors.reset} ${agent.toUpperCase().padEnd(8)}: 100% in sync (${currentSkills.length} skills, ${currentAgents.length} agents active)`);
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

  const availableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];

  let suiteCountText = '';
  if (fs.existsSync(skillsConfigPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
      if (catalog.totalSuites) {
        suiteCountText = `${catalog.totalSuites} Suites (${availableSkills.length} modular capabilities)`;
      }
    } catch {}
  }
  if (!suiteCountText) {
    suiteCountText = `${availableSkills.length} modular capabilities`;
  }

  console.log(`Repository Canonical Skills:    ${colors.green}${suiteCountText}${colors.reset}`);
  console.log(`Repository Predefined Agents:   ${colors.green}${availableAgents.length} Specialized Personas${colors.reset}\n`);

  const unlinkedTools = [];

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    const targetAgentDir = targetAgentPaths[agent];
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

      const agentCount = fs.existsSync(targetAgentDir)
        ? fs.readdirSync(targetAgentDir).filter(f => f.endsWith('.md')).length
        : 0;

      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${statusColor}${installed.length} skills, ${agentCount} agents${colors.reset} in ${path.dirname(targetDir)}${linkLabel}`);

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
    console.log(`\n${colors.yellow}${colors.bold}[!] Notice:${colors.reset} Installed tools missing skill/agent links: ${unlinkedTools.join(', ')}`);
    console.log(`    Run ${colors.cyan}heimdall sync${colors.reset} to link automatically in 1 second.`);
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
  console.log(`\n${colors.bold}Universal Doctrine & Playbooks:${colors.reset}`);
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

function runListSkills() {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Canonical Skills & Suites Catalog ===${colors.reset}\n`);

  if (!fs.existsSync(skillsConfigPath)) {
    console.log(`${colors.red}Registry file not found at ${skillsConfigPath}${colors.reset}`);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
  const skills = catalog.skills || {};
  const suites = catalog.suites || {};
  const totalSuites = catalog.totalSuites || Object.keys(suites).length;
  const totalModules = catalog.totalModules || Object.keys(skills).length;

  console.log(`Architecture: ${colors.bold}${colors.green}${totalSuites} Primary Toolkits & Suites (${totalModules} modular capabilities)${colors.reset}\n`);

  // 1. Multi-Skill Core Suites
  console.log(`${colors.bold}${colors.yellow}CORE MULTI-SKILL SUITES:${colors.reset}`);
  console.log(`${colors.dim}------------------------------------------------------------------------${colors.reset}`);
  for (const [key, suite] of Object.entries(suites)) {
    if (suite.type === 'Multi-Skill Suite') {
      console.log(`\n📦 ${colors.bold}${colors.cyan}${suite.name}${colors.reset} (${suite.modules.length} modules)`);
      console.log(`   ${colors.dim}Upstream: ${suite.upstream}${colors.reset}`);
      for (const mod of suite.modules) {
        const modInfo = skills[mod];
        const descPreview = modInfo && modInfo.description ? `— ${modInfo.description.slice(0, 55)}...` : '';
        console.log(`   • ${colors.bold}${mod.padEnd(32)}${colors.reset} ${colors.dim}${descPreview}${colors.reset}`);
      }
    }
  }

  // 2. Standalone Toolkits
  console.log(`\n\n${colors.bold}${colors.yellow}STANDALONE POWER TOOLKITS:${colors.reset}`);
  console.log(`${colors.dim}------------------------------------------------------------------------${colors.reset}`);
  for (const [key, suite] of Object.entries(suites)) {
    if (suite.type === 'Standalone Toolkit') {
      const mod = suite.modules[0];
      const modInfo = skills[mod];
      const descPreview = modInfo && modInfo.description ? `— ${modInfo.description.slice(0, 48)}...` : '';
      console.log(`⚡ ${colors.bold}${mod.padEnd(28)}${colors.reset} ${colors.dim}${descPreview}${colors.reset}`);
    }
  }

  console.log(`\n${colors.dim}Run 'heimdall update-skill <name|all>' to inspect provenance and updates.${colors.reset}\n`);
}

function runUpdateSkill(targetSkill = 'all') {
  console.log(`${colors.bold}${colors.cyan}=== Upstream Skill Provenance & Bounded Review Protocol ===${colors.reset}\n`);

  if (!fs.existsSync(skillsConfigPath)) {
    console.log(`${colors.red}Registry file not found at ${skillsConfigPath}${colors.reset}`);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
  const skills = catalog.skills || {};
  const protocol = catalog.updateProtocol;

  console.log(`${colors.bold}Standard Verification Directive:${colors.reset}`);
  console.log(`${colors.dim}"${protocol}"${colors.reset}\n`);

  if (targetSkill.toLowerCase() === 'all') {
    const skillList = Object.entries(skills);
    console.log(`${colors.bold}Canonical Skills Provenance Table (${skillList.length} skills):${colors.reset}\n`);
    console.log(`${'Skill Name'.padEnd(32)} ${'Category'.padEnd(28)} Upstream Source`);
    console.log(`${'-'.repeat(31)} ${'-'.repeat(27)} ${'-'.repeat(45)}`);
    for (const [name, info] of skillList) {
      console.log(`${name.padEnd(32)} ${(info.category || '').padEnd(28)} ${colors.cyan}${info.upstream}${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}Bounded Review Private Report Template:${colors.reset}`);
    console.log(`------------------------------------------------------------------------`);
    console.log(`Skill Name:           <name>`);
    console.log(`Upstream Repository:  <source URL>`);
    console.log(`Source Revision:      <commit hash / release tag>`);
    console.log(`Reviewed Range:       <diff range: e.g. v1.0.0..v1.1.0>`);
    console.log(`Actual Tests Run:     node setup.mjs audit && <skill-specific-tests>`);
    console.log(`Remaining Validation: <sign-off status>`);
    console.log(`------------------------------------------------------------------------\n`);
    console.log(`To inspect a single skill in detail, run: ${colors.bold}heimdall update-skill <name>${colors.reset}\n`);
    return;
  }

  const skillInfo = skills[targetSkill];
  if (!skillInfo) {
    console.log(`${colors.red}Skill '${targetSkill}' not found in canonical registry.${colors.reset}`);
    console.log(`Run ${colors.bold}heimdall skills${colors.reset} to view all available skills.\n`);
    return;
  }

  console.log(`${colors.bold}Skill Target:${colors.reset}         ${colors.green}${skillInfo.name}${colors.reset}`);
  console.log(`${colors.bold}Category:${colors.reset}             ${skillInfo.category}`);
  console.log(`${colors.bold}Description:${colors.reset}          ${skillInfo.description || '(none)'}`);
  console.log(`${colors.bold}Upstream Repository:${colors.reset}  ${colors.cyan}${skillInfo.upstream}${colors.reset}`);
  console.log(`${colors.bold}Frozen Revision:${colors.reset}      ${skillInfo.sourceRevision || 'v1.0.0'}\n`);

  console.log(`${colors.bold}Recommended Update Steps:${colors.reset}`);
  console.log(`1. Inspect upstream changes:`);
  console.log(`   ${colors.dim}git ls-remote ${skillInfo.upstream}${colors.reset}`);
  console.log(`2. Review changed instructions / references in the updated upstream commit.`);
  console.log(`3. Apply surgical edits to ${colors.cyan}skills/${skillInfo.name}/SKILL.md${colors.reset}.`);
  console.log(`4. Run boundary and audit checks:`);
  console.log(`   ${colors.dim}node setup.mjs audit${colors.reset}`);
  console.log(`5. Record your bounded review report:`);
  console.log(`   ---------------------------------------------------------------------`);
  console.log(`   Skill Name:           ${skillInfo.name}`);
  console.log(`   Upstream Repository:  ${skillInfo.upstream}`);
  console.log(`   Source Revision:      <new-commit-hash>`);
  console.log(`   Reviewed Range:       <diff range>`);
  console.log(`   Actual Tests Run:     node setup.mjs audit`);
  console.log(`   Remaining Validation: Verified compatible with multi-agent runtimes`);
  console.log(`   ---------------------------------------------------------------------\n`);
}

async function main() {
  printBanner();
  const options = parseArgs();
  const detected = detectEnvironment();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.audit) {
    runAudit(options);
    process.exit(0);
  }

  if (options.listSkills) {
    runListSkills();
    process.exit(0);
  }

  if (options.updateSkill) {
    runUpdateSkill(options.updateSkill);
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

  // 3.b Deploy Predefined Agents
  console.log(`\n${colors.bold}${colors.cyan}--- Deploying Predefined Agents ---${colors.reset}`);
  const allAvailableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];
  const agentsToInstall = (selectedProfile.agents === '*' || !selectedProfile.agents)
    ? allAvailableAgents
    : selectedProfile.agents.map(a => `${a}.md`).filter(f => allAvailableAgents.includes(f));

  for (const [agent, targetDir] of activeDestinations) {
    const targetAgentDir = targetAgentPaths[agent];
    if (targetAgentDir) {
      const count = deployAgentContracts(targetAgentDir, options.link, options.clean, options.dryRun, agentsToInstall);
      const modeVerb = options.link ? 'Linked (NTFS Junctions)' : 'Synchronized';
      console.log(`   ${colors.green}✔ ${modeVerb} ${count} predefined agents to ${agent} (${targetAgentDir})${colors.reset}`);
    }
  }

  // Cleanup legacy local agents if clean requested
  if (options.clean) {
    const cleanedLocal = cleanLegacyLocalAgents(options.dryRun);
    if (cleanedLocal) {
      console.log(`   ${colors.yellow}✔ Cleaned legacy local agents in ${cleanedLocal} and linked canonical registry${colors.reset}`);
    }
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

  // 6. Deploy universal doctrine & playbooks if requested
  if (options.doctrine) {
    console.log(`\n-> Deploying Universal Doctrine & Playbooks...`);
    const srcDoc = path.join(doctrineDir, 'AGENTS.md');
    if (fs.existsSync(srcDoc) && !options.dryRun) {
      if (options.doctrinePath) {
        const docParent = path.dirname(options.doctrinePath);
        if (!fs.existsSync(docParent)) fs.mkdirSync(docParent, { recursive: true });
        fs.copyFileSync(srcDoc, options.doctrinePath);
        console.log(`   ${colors.green}✔ Universal AGENTS.md doctrine active at ${options.doctrinePath}${colors.reset}`);
      }

      // Synchronize doctrine across all active harnesses
      for (const [agent, targetDocFile] of Object.entries(targetDoctrinePaths)) {
        const parentDir = path.dirname(targetDocFile);
        if (fs.existsSync(parentDir)) {
          fs.copyFileSync(srcDoc, targetDocFile);
          console.log(`   ${colors.green}✔ Synchronized doctrine to ${targetDocFile}${colors.reset}`);
        }
      }

      // Synchronize playbooks
      if (fs.existsSync(playbooksDir)) {
        for (const [agent, targetPlayDir] of Object.entries(targetPlaybookPaths)) {
          const parentDir = path.dirname(targetPlayDir);
          if (fs.existsSync(parentDir)) {
            if (options.link) {
              linkDirectory(playbooksDir, targetPlayDir, options.dryRun);
            } else {
              copyDirectory(playbooksDir, targetPlayDir, options.dryRun);
            }
            console.log(`   ${colors.green}✔ Synchronized playbooks to ${targetPlayDir}${colors.reset}`);
          }
        }
      }
    }
  }

  console.log(`\n${colors.bold}${colors.green}=== Heimdall Installation Complete! ===${colors.reset}\n`);
}

main().catch(err => {
  console.error(`\n${colors.red}Error executing Heimdall installer:${colors.reset}`, err);
  process.exit(1);
});
