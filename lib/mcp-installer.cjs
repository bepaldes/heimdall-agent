'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync } = require('node:child_process');
const { colors, getHermesDir, getVSCodeUserDir } = require('./harness-detection.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const userHome = os.homedir();
const mcpConfigPath = path.join(ROOT_DIR, 'config', 'mcp.json');

/**
 * Dynamically resolves the active Open Design installation and MCP configuration.
 */
function resolveOpenDesignMcpConfig() {
  const platform = os.platform();
  let fallbackConfig = null;
  if (fs.existsSync(mcpConfigPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      fallbackConfig = data.mcpServers?.['open-design']?.config || null;
    } catch {}
  }

  if (platform !== 'win32') return fallbackConfig;

  const appData = process.env.APPDATA || path.join(userHome, 'AppData', 'Roaming');
  const localAppData = process.env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
  const odRoaming = path.join(appData, 'Open Design');

  if (!fs.existsSync(odRoaming)) return fallbackConfig;

  let odExe = null;
  const enDir = path.join(odRoaming, 'en');
  if (fs.existsSync(enDir)) {
    try {
      const subdirs = fs.readdirSync(enDir);
      for (const sub of subdirs) {
        const cand = path.join(enDir, sub, 'Open Design.exe');
        if (fs.existsSync(cand)) {
          odExe = cand;
          break;
        }
      }
    } catch {}
  }
  if (!odExe) {
    const defaultLocalExe = path.join(localAppData, 'Programs', 'Open Design', 'Open Design.exe');
    if (fs.existsSync(defaultLocalExe)) odExe = defaultLocalExe;
  }

  let daemonCli = null;
  const versionsDir = path.join(odRoaming, 'launcher', 'channels', 'stable', 'namespaces', 'release-stable-win', 'versions');
  if (fs.existsSync(versionsDir)) {
    try {
      const versions = fs.readdirSync(versionsDir);
      for (const ver of versions) {
        const cand = path.join(versionsDir, ver, 'payload', 'resources', 'app', 'prebundled', 'daemon', 'daemon-cli.mjs');
        if (fs.existsSync(cand)) {
          daemonCli = cand;
          break;
        }
      }
    } catch {}
  }

  let activePipe = null;
  try {
    const pipeCandidates = fs.readdirSync('\\\\.\\pipe');
    const odPipe = pipeCandidates.find(p => p.startsWith('open-design-sidecar-'));
    if (odPipe) {
      activePipe = `\\\\.\\pipe\\${odPipe}`;
    }
  } catch {}

  if (!odExe || !daemonCli) return fallbackConfig;

  const dataDir = path.join(odRoaming, 'namespaces', 'release-stable-win', 'data');
  const bootstrapExe = path.join(localAppData, 'Programs', 'Open Design', 'Open Design.exe');

  return {
    command: odExe,
    args: [daemonCli, 'mcp'],
    env: {
      OD_DATA_DIR: dataDir,
      OD_SIDECAR_CLIENT_ENDPOINT: activePipe || fallbackConfig?.env?.OD_SIDECAR_CLIENT_ENDPOINT || '\\\\.\\pipe\\open-design-sidecar-active',
      OD_MCP_BOOTSTRAP_COMMAND: fs.existsSync(bootstrapExe) ? bootstrapExe : odExe,
      OD_MCP_BOOTSTRAP_ARGS: '["--headless"]',
      ELECTRON_RUN_AS_NODE: '1'
    }
  };
}

/**
 * Installs required MCP npm packages globally so configs use direct node.exe calls.
 */
function installMcpPackages(options = {}) {
  const requiredPackages = ['@upstash/context7-mcp', 'chrome-devtools-mcp'];
  const missing = [];

  try {
    const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).replace(/\r/g, '').trim();
    for (const pkg of requiredPackages) {
      const pkgDir = path.join(npmRoot, pkg);
      if (!fs.existsSync(pkgDir)) missing.push(pkg);
    }
  } catch {
    missing.push(...requiredPackages);
  }

  if (missing.length === 0) {
    console.log(`  ${colors.green}✔${colors.reset} MCP packages already installed globally (${requiredPackages.join(', ')})`);
    return true;
  }

  console.log(`  ${colors.cyan}→${colors.reset} Installing MCP packages globally: ${missing.join(', ')}`);
  if (options.dryRun) {
    console.log(`  ${colors.yellow}(dry run — would run: npm install -g ${missing.join(' ')})${colors.reset}`);
    return true;
  }

  try {
    execSync(`npm install -g ${missing.join(' ')}`, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
    console.log(`  ${colors.green}✔${colors.reset} Installed ${missing.join(', ')} globally`);
    return true;
  } catch (err) {
    console.log(`  ${colors.red}✘${colors.reset} Failed to install MCP packages: ${err.message}`);
    console.log(`  ${colors.yellow}  Run manually: npm install -g ${missing.join(' ')}${colors.reset}`);
    return false;
  }
}

/**
 * Synchronizes MCP servers across all harnesses using scripts/resolve-mcp.mjs.
 */
function syncMcpServers(detected, options = {}, rootDir = ROOT_DIR) {
  installMcpPackages(options);

  const resolverScript = path.join(rootDir, 'scripts', 'resolve-mcp.mjs');
  if (!fs.existsSync(resolverScript)) {
    console.log(`  ${colors.red}✘${colors.reset} MCP resolver not found at ${resolverScript}`);
    return false;
  }

  if (options.dryRun) {
    console.log(`  ${colors.yellow}(dry run — would run: node scripts/resolve-mcp.mjs --sync)${colors.reset}`);
    return true;
  }

  try {
    const agentArg = Array.isArray(options.agents) && options.agents.length > 0 && !options.agents.includes('all')
      ? ` --agents "${options.agents.join(',')}"`
      : '';
    const output = execSync(`node "${resolverScript}" --sync${agentArg}`, {
      encoding: 'utf8',
      cwd: rootDir,
      timeout: 60000
    });
    for (const line of output.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('✓')) {
        console.log(`  ${colors.green}✔${colors.reset} ${trimmed.slice(2).trim()}`);
      } else if (trimmed.startsWith('⚠')) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${trimmed.slice(2).trim()}`);
      } else if (trimmed) {
        console.log(`  ${colors.dim}${trimmed}${colors.reset}`);
      }
    }
    return true;
  } catch (err) {
    console.log(`  ${colors.red}✘${colors.reset} MCP resolver failed: ${err.message}`);
    return false;
  }
}

/**
 * Audits registered and configured MCP servers across all harnesses.
 * Preserves strict Gemini install gating (agy binary or antigravity-cli dir).
 */
function auditMcpServers(homeDir = userHome) {
  const results = [];
  const serverNames = ['context7', 'chrome-devtools', 'open-design', 'rea', 'mobbin'];

  const agyMcpFile = path.join(homeDir, '.gemini', 'config', 'mcp_config.json');
  const agyDir = path.join(homeDir, '.gemini', 'antigravity-cli');
  let agyOnPath = false;
  try { execSync('command -v agy', { stdio: 'ignore' }); agyOnPath = true; } catch {}
  if ((agyOnPath || fs.existsSync(agyDir)) && fs.existsSync(agyMcpFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(agyMcpFile, 'utf8'));
      for (const s of serverNames) {
        results.push({ harness: 'Google Antigravity', server: s, configured: Boolean(cfg.mcpServers?.[s]) });
      }
    } catch {}
  }

  const claudeSettingsFile = path.join(homeDir, '.claude', 'settings.json');
  if (fs.existsSync(claudeSettingsFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(claudeSettingsFile, 'utf8'));
      for (const s of serverNames) {
        results.push({ harness: 'Claude Code', server: s, configured: Boolean(cfg.mcpServers?.[s]) });
      }
    } catch {}
  }

  const codexConfigFile = path.join(homeDir, '.codex', 'config.toml');
  if (fs.existsSync(codexConfigFile)) {
    try {
      const content = fs.readFileSync(codexConfigFile, 'utf8');
      for (const s of serverNames) {
        results.push({ harness: 'Codex CLI', server: s, configured: content.includes(`[mcp_servers.${s}]`) });
      }
    } catch {}
  }

  const hermesConfigFile = path.join(getHermesDir(), 'config.yaml');
  if (fs.existsSync(hermesConfigFile)) {
    try {
      const content = fs.readFileSync(hermesConfigFile, 'utf8');
      const mcpSection = content.match(/^mcp_servers:[\s\S]*?(?=^[a-z_]+:|\s*$)/m);
      for (const s of serverNames) {
        results.push({ harness: 'Hermes', server: s, configured: Boolean(mcpSection && mcpSection[0].includes(`  ${s}:`)) });
      }
    } catch {}
  }

  const vscodeMcpFile = path.join(getVSCodeUserDir(), 'mcp.json');
  if (fs.existsSync(vscodeMcpFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(vscodeMcpFile, 'utf8'));
      for (const s of serverNames) {
        results.push({ harness: 'VS Code', server: s, configured: Boolean(cfg.servers?.[s]) });
      }
    } catch {}
  }

  return results;
}

module.exports = {
  resolveOpenDesignMcpConfig,
  installMcpPackages,
  syncMcpServers,
  auditMcpServers
};
