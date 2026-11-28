'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { listProfiles } = require('./profiles.cjs');
const { getClaudeDir, getGeminiDir, getCodexDir } = require('./harness-detection.cjs');

const SAFE_DEV_COMMANDS = [
  'git', 'node', 'npm', 'pnpm', 'yarn', 'bun', 'npx',
  'docker', 'docker compose', 'curl', 'jq', 'rg',
  'heimdall', 'agy', 'claude', 'codex',
  'pytest', 'cargo', 'go', 'python', 'python3', 'make', 'cmake'
];

const OS_FULL_AUTONOMOUS = {
  linux: ['sudo docker', 'sudo docker compose', 'sudo systemctl', 'sudo journalctl', 'systemctl', 'journalctl', 'omarchy', 'pacman', 'apt', 'dnf', 'flatpak'],
  darwin: ['brew', 'launchctl', 'defaults', 'xcode-select'],
  win32: ['winget', 'choco', 'scoop', 'pwsh', 'powershell', 'wsl']
};

function stripBom(str) {
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

/**
 * Returns the deduplicated command allowlist for a preset and OS platform.
 */
function buildPermissionAllowlist(preset = 'safe-dev', platform = process.platform) {
  if (preset !== 'safe-dev' && preset !== 'full-autonomous') {
    throw new Error(`Unknown permissions preset '${preset}'. Use 'safe-dev' or 'full-autonomous'.`);
  }
  const base = [...SAFE_DEV_COMMANDS];
  if (preset === 'full-autonomous') {
    const osCmds = OS_FULL_AUTONOMOUS[platform] || OS_FULL_AUTONOMOUS.linux;
    base.push(...osCmds);
  }
  return Array.from(new Set(base));
}

function mergeUnique(existing, additions) {
  const list = Array.isArray(existing) ? [...existing] : [];
  const seen = new Set(list);
  for (const item of additions) {
    if (!seen.has(item)) {
      list.push(item);
      seen.add(item);
    }
  }
  return list;
}

function ensureBackup(filePath, dryRun) {
  const backupPath = `${filePath}.heimdall.bak`;
  if (!dryRun && fs.existsSync(filePath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  return backupPath;
}

function restoreBackup(filePath, dryRun) {
  const backupPath = `${filePath}.heimdall.bak`;
  if (!fs.existsSync(backupPath)) return false;
  if (!dryRun) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
  }
  return true;
}

function updateJsonFile(filePath, mutator, dryRun) {
  if (!fs.existsSync(filePath)) return false;
  let parsed;
  try {
    parsed = JSON.parse(stripBom(fs.readFileSync(filePath, 'utf8')));
  } catch {
    return false;
  }
  ensureBackup(filePath, dryRun);
  mutator(parsed);
  if (!dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  }
  return true;
}

function applyClaudePermissions(settingsPath, commands, preset, dryRun) {
  const patterns = commands.map((cmd) => `Bash(${cmd} *)`);
  return updateJsonFile(settingsPath, (cfg) => {
    cfg.permissions = cfg.permissions && typeof cfg.permissions === 'object' ? cfg.permissions : {};
    cfg.permissions.allow = mergeUnique(cfg.permissions.allow, patterns);
    cfg.autoMode = cfg.autoMode && typeof cfg.autoMode === 'object' ? cfg.autoMode : {};
    cfg.autoMode.allow = mergeUnique(cfg.autoMode.allow, patterns);
    cfg.sandbox = cfg.sandbox && typeof cfg.sandbox === 'object' ? cfg.sandbox : {};
    cfg.sandbox.excludedCommands = mergeUnique(cfg.sandbox.excludedCommands, ['docker', 'docker compose']);
    if (preset === 'full-autonomous') {
      cfg.sandbox.enabled = false;
    }
  }, dryRun);
}

function applyAntigravityPermissions(settingsPath, commands, dryRun) {
  const patterns = commands.map((cmd) => `command(${cmd})`);
  return updateJsonFile(settingsPath, (cfg) => {
    cfg.permissions = cfg.permissions && typeof cfg.permissions === 'object' ? cfg.permissions : {};
    cfg.permissions.allow = mergeUnique(cfg.permissions.allow, patterns);
    cfg.permissions.deny = mergeUnique(cfg.permissions.deny, ['command(rm -rf)']);
  }, dryRun);
}

function applyCodexPermissions(configPath, preset, dryRun) {
  if (!fs.existsSync(configPath)) return false;
  ensureBackup(configPath, dryRun);
  const policy = preset === 'full-autonomous' ? 'never' : 'on-failure';
  let content = stripBom(fs.readFileSync(configPath, 'utf8'));
  if (/^\s*approval_policy\s*=/m.test(content)) {
    content = content.replace(/^\s*approval_policy\s*=.*$/m, `approval_policy = "${policy}"`);
  } else {
    content = `approval_policy = "${policy}"\n${content}`;
  }
  if (!dryRun) {
    fs.writeFileSync(configPath, content, 'utf8');
  }
  return true;
}

function collectTargets(homeDir, includeProfiles) {
  const useDefaultEnv = homeDir === os.homedir();
  const claudeBase = useDefaultEnv ? getClaudeDir() : path.join(homeDir, '.claude');
  const geminiBase = useDefaultEnv ? getGeminiDir() : path.join(homeDir, '.gemini');
  const codexBase = useDefaultEnv ? getCodexDir() : path.join(homeDir, '.codex');

  const targets = [
    { tool: 'claude', file: path.join(claudeBase, 'settings.json') },
    { tool: 'agy', file: path.join(geminiBase, 'antigravity-cli', 'settings.json') },
    { tool: 'codex', file: path.join(codexBase, 'config.toml') }
  ];

  if (includeProfiles) {
    for (const p of listProfiles(homeDir)) {
      if (!p || !p.dir) continue;
      if (p.tool === 'claude') targets.push({ tool: 'claude', file: path.join(p.dir, 'settings.json') });
      else if (p.tool === 'agy') targets.push({ tool: 'agy', file: path.join(p.dir, '.gemini', 'antigravity-cli', 'settings.json') });
      else if (p.tool === 'codex') targets.push({ tool: 'codex', file: path.join(p.dir, 'config.toml') });
    }
  }
  return targets;
}

/**
 * Applies or resets autonomous execution permissions across Claude, Antigravity, Codex, and profiles.
 */
function applyAutonomousPermissions(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const platform = options.platform || process.platform;
  const preset = options.preset || 'safe-dev';
  const includeProfiles = options.includeProfiles !== false;
  const dryRun = Boolean(options.dryRun);
  const rawAgents = Array.isArray(options.agents) ? options.agents : [];
  const agentFilter = rawAgents.length > 0 && !rawAgents.includes('all')
    ? new Set(rawAgents.map((a) => (a === 'gemini' ? 'agy' : a)))
    : null;

  const targets = collectTargets(homeDir, includeProfiles)
    .filter((t) => !agentFilter || agentFilter.has(t.tool));

  if (options.reset) {
    const restored = [];
    for (const t of targets) {
      if (restoreBackup(t.file, dryRun)) restored.push(t.file);
    }
    return { mode: 'reset', restored, dryRun };
  }

  const commands = buildPermissionAllowlist(preset, platform);
  const updated = [];
  for (const t of targets) {
    let ok = false;
    if (t.tool === 'claude') ok = applyClaudePermissions(t.file, commands, preset, dryRun);
    else if (t.tool === 'agy') ok = applyAntigravityPermissions(t.file, commands, dryRun);
    else if (t.tool === 'codex') ok = applyCodexPermissions(t.file, preset, dryRun);
    if (ok) updated.push(t.file);
  }

  return { mode: 'apply', preset, platform, commandsCount: commands.length, updated, dryRun };
}

module.exports = {
  SAFE_DEV_COMMANDS,
  OS_FULL_AUTONOMOUS,
  buildPermissionAllowlist,
  applyAutonomousPermissions
};
