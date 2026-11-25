'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');
const { detectPathCandidates } = require('./path-discovery.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const userHome = os.homedir();

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

/**
 * Checks whether a CLI command exists on PATH and returns its resolved path.
 */
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
 * Resolves the Claude Code configuration directory (respecting CLAUDE_CONFIG_DIR).
 */
function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(userHome, '.claude');
}

/**
 * Resolves the Codex CLI configuration directory (respecting CODEX_HOME).
 */
function getCodexDir() {
  return process.env.CODEX_HOME || path.join(userHome, '.codex');
}

/**
 * Resolves the Gemini / Antigravity configuration directory (respecting GEMINI_CLI_HOME).
 */
function getGeminiDir() {
  return process.env.GEMINI_CLI_HOME || path.join(userHome, '.gemini');
}

/**
 * Resolves the platform-specific Hermes Agent directory (respecting HERMES_HOME).
 */
function getHermesDir() {
  if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
  const platform = os.platform();
  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
    const winPath = path.join(localAppData, 'hermes');
    if (fs.existsSync(winPath)) return winPath;
  }
  const homePath = path.join(userHome, '.hermes');
  if (fs.existsSync(homePath)) return homePath;
  return platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local'), 'hermes')
    : homePath;
}

/**
 * Resolves the platform-specific OpenClaw directory.
 */
function getOpenClawDir() {
  const homePath = path.join(userHome, '.openclaw');
  if (fs.existsSync(homePath)) return homePath;
  if (os.platform() === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
    const winPath = path.join(localAppData, 'openclaw');
    if (fs.existsSync(winPath)) return winPath;
  }
  return homePath;
}

/**
 * Resolves the GitHub Copilot / VS Code user skills & agents directory (~/.copilot).
 */
function getCopilotDir() {
  return path.join(userHome, '.copilot');
}

/**
 * Resolves the VS Code User configuration directory across Windows, macOS, and Linux.
 */
function getVSCodeUserDir() {
  const platform = os.platform();
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
    return path.join(appData, 'Code', 'User');
  }
  if (platform === 'darwin') {
    return path.join(userHome, 'Library', 'Application Support', 'Code', 'User');
  }
  return path.join(userHome, '.config', 'Code', 'User');
}

/**
 * Resolves the platform-specific Claude Desktop configuration directory.
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

const targetPaths = {
  claude: path.join(getClaudeDir(), 'skills'),
  gemini: path.join(getGeminiDir(), 'skills'),
  codex: path.join(getCodexDir(), 'skills'),
  agents: path.join(userHome, '.agents', 'skills'),
  hermes: path.join(getHermesDir(), 'skills'),
  openclaw: path.join(getOpenClawDir(), 'skills'),
  vscode: path.join(getCopilotDir(), 'skills')
};

const targetAgentPaths = {
  claude: path.join(getClaudeDir(), 'agents'),
  gemini: path.join(getGeminiDir(), 'agents'),
  codex: path.join(getCodexDir(), 'agents'),
  agents: path.join(userHome, '.agents', 'agents'),
  hermes: path.join(getHermesDir(), 'agents'),
  openclaw: path.join(getOpenClawDir(), 'agents'),
  vscode: path.join(getCopilotDir(), 'agents')
};

const targetDoctrinePaths = {
  claude: path.join(getClaudeDir(), 'CLAUDE.md'),
  gemini: path.join(getGeminiDir(), 'GEMINI.md'),
  codex: path.join(getCodexDir(), 'AGENTS.md'),
  agents: path.join(userHome, '.agents', 'AGENTS.md'),
  hermes: path.join(getHermesDir(), 'AGENTS.md'),
  openclaw: path.join(getOpenClawDir(), 'AGENTS.md'),
  vscode: path.join(getCopilotDir(), 'copilot-instructions.md')
};

const targetPlaybookPaths = {
  claude: path.join(getClaudeDir(), 'playbooks'),
  gemini: path.join(getGeminiDir(), 'playbooks'),
  agents: path.join(userHome, '.agents', 'playbooks'),
  hermes: path.join(getHermesDir(), 'playbooks'),
  openclaw: path.join(getOpenClawDir(), 'playbooks'),
  vscode: path.join(getCopilotDir(), 'playbooks')
};

const targetCommandPaths = {
  claude: path.join(getClaudeDir(), 'commands')
};

const targetHookPaths = {
  claude: path.join(getClaudeDir(), 'hooks')
};

/**
 * Resolves the root directory of a target agent harness.
 */
function getAgentRootDir(agent) {
  if (agent === 'claude') return getClaudeDir();
  if (agent === 'gemini') return getGeminiDir();
  if (agent === 'codex') return getCodexDir();
  if (agent === 'agents') return path.join(userHome, '.agents');
  if (agent === 'hermes') return getHermesDir();
  if (agent === 'openclaw') return getOpenClawDir();
  if (agent === 'vscode') return getCopilotDir();
  if (agent === 'desktop') return getClaudeDesktopDir();
  return null;
}

/**
 * Resolves the effective allowed agent list from CLI options and persisted ~/.heimdall-state.json.
 */
function resolveSelectedAgents(options = {}, savedState = {}) {
  if (Array.isArray(options.agents) && options.agents.length > 0) {
    return options.agents;
  }
  if (Array.isArray(savedState?.agents) && savedState.agents.length > 0) {
    return savedState.agents;
  }
  return ['all'];
}

/**
 * Detects Claude Desktop by checking for an existing configuration file
 * or the presence of the native desktop executable on OS-specific paths.
 */
function detectClaudeDesktop() {
  const configDir = getClaudeDesktopDir();
  const configFile = path.join(configDir, 'claude_desktop_config.json');

  if (fs.existsSync(configFile)) {
    return { dir: configDir, file: configFile, detected: true, configExists: true };
  }

  const platform = os.platform();
  let appInstalled = false;

  if (platform === 'win32') {
    const winCandidates = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude', 'Claude.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Claude', 'Claude.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Claude', 'Claude.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'Claude', 'Claude.exe')
    ];
    appInstalled = winCandidates.some(p => p && fs.existsSync(p));
  } else if (platform === 'darwin') {
    const macCandidates = [
      '/Applications/Claude.app',
      path.join(userHome, 'Applications', 'Claude.app')
    ];
    appInstalled = macCandidates.some(p => fs.existsSync(p));
  } else {
    appInstalled = !!checkCommand('claude-desktop') || fs.existsSync('/opt/Claude/claude');
  }

  return { dir: configDir, file: configFile, detected: appInstalled, configExists: false };
}

/**
 * Resiliently discovers the OpenAI Codex CLI binary on PATH and standard install paths.
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
 * Resiliently discovers the Hermes Agent CLI binary on PATH and standard install paths.
 */
function detectHermesBinary() {
  const onPath = checkCommand('hermes');
  if (onPath) return onPath;

  if (os.platform() === 'win32') {
    const candidates = [
      path.join(process.env.LOCALAPPDATA || '', 'hermes', 'bin', 'hermes.cmd'),
      path.join(process.env.LOCALAPPDATA || '', 'hermes', 'bin', 'hermes.exe'),
      path.join(userHome, '.hermes', 'bin', 'hermes.cmd'),
      path.join(userHome, '.local', 'bin', 'hermes.cmd')
    ];
    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  } else {
    const posixCandidates = [
      path.join(userHome, '.local', 'bin', 'hermes'),
      path.join(userHome, '.hermes', 'bin', 'hermes'),
      '/usr/local/bin/hermes'
    ];
    for (const cand of posixCandidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

/**
 * Resiliently discovers the OpenClaw binary on PATH and standard install paths.
 */
function detectOpenClawBinary() {
  const onPath = checkCommand('openclaw');
  if (onPath) return onPath;

  if (os.platform() === 'win32') {
    const candidates = [
      path.join(userHome, '.openclaw', 'bin', 'openclaw.exe'),
      path.join(userHome, '.openclaw', 'bin', 'openclaw.cmd'),
      path.join(process.env.LOCALAPPDATA || '', 'openclaw', 'bin', 'openclaw.exe'),
      path.join(userHome, '.local', 'bin', 'openclaw.cmd')
    ];
    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  } else {
    const posixCandidates = [
      path.join(userHome, '.local', 'bin', 'openclaw'),
      path.join(userHome, '.openclaw', 'bin', 'openclaw'),
      '/usr/local/bin/openclaw'
    ];
    for (const cand of posixCandidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  }
  return null;
}

/**
 * Resiliently discovers the VS Code CLI binary on PATH and standard install paths.
 */
function detectVSCodeBinary() {
  const onPath = checkCommand('code');
  if (onPath) return onPath;

  if (os.platform() === 'win32') {
    const candidates = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
      path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft VS Code', 'bin', 'code.cmd')
    ];
    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) return cand;
    }
  } else if (os.platform() === 'darwin') {
    const macCand = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
    if (fs.existsSync(macCand)) return macCand;
  } else {
    const linuxCand = '/usr/bin/code';
    if (fs.existsSync(linuxCand)) return linuxCand;
  }
  return null;
}

/**
 * Checks whether an agent harness exists and is configurable.
 * Preserves strict Gemini gating (agy binary or antigravity-cli config dir).
 */
function isAgentConfigurable(agent, homeDir = userHome) {
  if (agent === 'desktop') {
    const status = detectClaudeDesktop();
    return Boolean(status.configExists);
  }
  if (agent === 'vscode') {
    return Boolean(fs.existsSync(getCopilotDir()) || fs.existsSync(getVSCodeUserDir()) || detectVSCodeBinary());
  }
  // Gemini: require agy binary on PATH or antigravity-cli config dir.
  // Do NOT treat ~/.gemini alone as installed — Heimdall creates that dir for its own config.
  if (agent === 'gemini') {
    const agyDir = path.join(homeDir, '.gemini', 'antigravity-cli');
    let agyOnPath = false;
    try { execSync('command -v agy', { stdio: 'ignore' }); agyOnPath = true; } catch {}
    return agyOnPath || fs.existsSync(agyDir);
  }
  const rootDir = getAgentRootDir(agent);
  return Boolean(rootDir && fs.existsSync(rootDir));
}

/**
 * Dynamically discovers candidate paths for universal doctrine AGENTS.md.
 */
function detectDoctrineCandidates(rootDir = ROOT_DIR) {
  const candidates = [];
  const seen = new Set();

  const userDoctrine = path.join(userHome, '.agents', 'AGENTS.md');
  candidates.push(userDoctrine);
  seen.add(userDoctrine.toLowerCase());

  const parentWorkspace = path.join(path.dirname(rootDir), 'AGENTS.md');
  if (!seen.has(parentWorkspace.toLowerCase())) {
    if (fs.existsSync(parentWorkspace)) {
      candidates.unshift(parentWorkspace);
    } else {
      candidates.push(parentWorkspace);
    }
    seen.add(parentWorkspace.toLowerCase());
  }

  const cwdDoctrine = path.join(process.cwd(), 'AGENTS.md');
  if (!seen.has(cwdDoctrine.toLowerCase())) {
    candidates.push(cwdDoctrine);
  }

  return candidates;
}

/**
 * Probes installed tools, endpoints, PATH candidates, and doctrine candidates.
 */
function detectEnvironment(rootDir = ROOT_DIR) {
  const detected = {
    tools: {},
    endpoints: {},
    pathCandidates: detectPathCandidates(),
    doctrineCandidates: detectDoctrineCandidates(rootDir)
  };

  detected.tools.claude = checkCommand('claude');
  detected.tools.agy = checkCommand('agy');
  detected.tools.codex = detectCodexBinary();
  detected.tools.hermes = detectHermesBinary();
  detected.tools.openclaw = detectOpenClawBinary();
  detected.tools.vscode = detectVSCodeBinary();
  detected.tools.cursor = checkCommand('cursor');
  detected.tools.windsurf = checkCommand('windsurf');

  const desktopStatus = detectClaudeDesktop();
  detected.tools.claudeDesktop = desktopStatus.detected ? desktopStatus.dir : null;

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

  if (process.env.GEMINI_BASE_URL) {
    detected.endpoints.gemini = `Custom Proxy (${process.env.GEMINI_BASE_URL})`;
  } else if (process.env.GEMINI_API_KEY) {
    detected.endpoints.gemini = 'Google GenAI API Key (Custom Direct API)';
  } else if (detected.tools.agy || fs.existsSync(path.join(userHome, '.gemini', 'antigravity-cli'))) {
    detected.endpoints.gemini = 'Google OAuth (Default Native Account)';
  } else {
    detected.endpoints.gemini = 'Not Installed / Unconfigured';
  }

  const hermesDir = getHermesDir();
  const hermesConfigPath = path.join(hermesDir, 'config.yaml');
  if (fs.existsSync(hermesConfigPath)) {
    try {
      const content = fs.readFileSync(hermesConfigPath, 'utf8');
      const defaultMatch = content.match(/^\s*default:\s*["']?([^"'#\r\n]+)["']?/m);
      const modelMatch = content.match(/^\s*model:\s*["']?([^"'#\r\n]+)["']?/m);
      const providerMatch = content.match(/^\s*provider:\s*["']?([^"'#\r\n]+)["']?/m);
      const resolvedModel = (defaultMatch && defaultMatch[1].trim()) || (modelMatch && modelMatch[1].trim());
      if (resolvedModel) {
        const prov = providerMatch ? `${providerMatch[1].trim()}/` : '';
        detected.endpoints.hermes = `${prov}${resolvedModel}`;
      }
    } catch {}
  }
  if (!detected.endpoints.hermes && (detected.tools.hermes || fs.existsSync(hermesDir))) {
    detected.endpoints.hermes = 'Nous Research / Configured Provider';
  } else if (!detected.endpoints.hermes) {
    detected.endpoints.hermes = 'Not Installed / Unconfigured';
  }

  const openclawDir = getOpenClawDir();
  const openclawConfigPath = path.join(openclawDir, 'openclaw.json');
  if (fs.existsSync(openclawConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf8'));
      if (cfg.model) detected.endpoints.openclaw = cfg.model;
    } catch {}
  }
  if (!detected.endpoints.openclaw && (detected.tools.openclaw || fs.existsSync(openclawDir))) {
    detected.endpoints.openclaw = 'Local-First Gateway';
  } else if (!detected.endpoints.openclaw) {
    detected.endpoints.openclaw = 'Not Installed / Unconfigured';
  }

  const vscodeSettingsPath = path.join(getVSCodeUserDir(), 'settings.json');
  if (fs.existsSync(vscodeSettingsPath)) {
    try {
      const raw = fs.readFileSync(vscodeSettingsPath, 'utf8');
      const envMatch = raw.match(/"ANTHROPIC_BASE_URL"\s*:\s*"([^"]+)"/) || raw.match(/"OPENAI_BASE_URL"\s*:\s*"([^"]+)"/);
      if (envMatch) detected.endpoints.vscode = envMatch[1];
    } catch {}
  }
  if (!detected.endpoints.vscode && (detected.tools.vscode || fs.existsSync(getVSCodeUserDir()) || fs.existsSync(getCopilotDir()))) {
    detected.endpoints.vscode = 'GitHub Copilot / Local User Config';
  } else if (!detected.endpoints.vscode) {
    detected.endpoints.vscode = 'Not Installed / Unconfigured';
  }

  return detected;
}

module.exports = {
  colors,
  checkCommand,
  getClaudeDir,
  getCodexDir,
  getGeminiDir,
  getHermesDir,
  getOpenClawDir,
  getCopilotDir,
  getVSCodeUserDir,
  getClaudeDesktopDir,
  targetPaths,
  targetAgentPaths,
  targetDoctrinePaths,
  targetPlaybookPaths,
  targetCommandPaths,
  targetHookPaths,
  getAgentRootDir,
  detectClaudeDesktop,
  detectCodexBinary,
  detectHermesBinary,
  detectOpenClawBinary,
  detectVSCodeBinary,
  isAgentConfigurable,
  resolveSelectedAgents,
  detectDoctrineCandidates,
  detectEnvironment
};
