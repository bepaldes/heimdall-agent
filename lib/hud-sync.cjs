const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CODEX_STATUS_LINE_ITEMS = [
  'model-with-reasoning',
  'current-dir',
  'git-branch',
  'context-used',
  'context-window-size',
  'five-hour-limit',
  'weekly-limit'
];

function formatHudCommand(hudScriptPath) {
  const normalized = String(hudScriptPath).replace(/\\/g, '/');
  // Omit quotes on safe paths to prevent Windows AGY Module._resolveFilename failures,
  // but always quote if whitespace or shell metacharacters are present.
  return /[\s$`;&|]/.test(normalized) ? `node "${normalized}"` : `node ${normalized}`;
}

/**
 * Configures Claude Code's ~/.claude/settings.json statusLine command.
 */
function configureClaudeStatusLine(hudScriptPath, dryRun = false, homeDir = os.homedir()) {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const desiredCmd = formatHudCommand(hudScriptPath);
    if (cfg.statusLine?.command === desiredCmd && cfg.statusLine?.type === 'command') {
      return false;
    }
    cfg.statusLine = { type: 'command', command: desiredCmd };
    if (!dryRun) {
      fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Configures Antigravity CLI's ~/.gemini/antigravity-cli/settings.json statusLine command.
 */
function configureAntigravityStatusLine(hudScriptPath, dryRun = false, homeDir = os.homedir()) {
  const settingsPath = path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const desiredCmd = formatHudCommand(hudScriptPath);
    if (cfg.statusLine?.command === desiredCmd && cfg.statusLine?.enabled === true) {
      return false;
    }
    cfg.statusLine = {
      type: 'command',
      command: desiredCmd,
      enabled: true,
      padding: 0,
      stack_with_default: false
    };
    if (!dryRun) {
      fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures Codex CLI's ~/.codex/config.toml [tui] table includes status_line items.
 */
function configureCodexStatusLine(dryRun = false, homeDir = os.homedir()) {
  const configPath = path.join(homeDir, '.codex', 'config.toml');
  if (!fs.existsSync(configPath)) return false;
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    if (/^\s*status_line\s*=/m.test(content)) {
      return false;
    }
    const itemsLiteral = CODEX_STATUS_LINE_ITEMS.map(item => `"${item}"`).join(', ');
    const snippet = `status_line = [${itemsLiteral}]`;

    if (/^\[tui\]/m.test(content)) {
      content = content.replace(/^(\[tui\]\s*\r?\n)/m, `$1${snippet}\n`);
    } else {
      content = content.trimEnd() + `\n\n[tui]\n${snippet}\n`;
    }

    if (!dryRun) {
      fs.writeFileSync(configPath, content);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes statusLine from Claude Code's ~/.claude/settings.json.
 */
function disableClaudeStatusLine(dryRun = false, homeDir = os.homedir()) {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (!cfg.statusLine) return false;
    delete cfg.statusLine;
    if (!dryRun) {
      fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes statusLine from Antigravity CLI's ~/.gemini/antigravity-cli/settings.json.
 */
function disableAntigravityStatusLine(dryRun = false, homeDir = os.homedir()) {
  const settingsPath = path.join(homeDir, '.gemini', 'antigravity-cli', 'settings.json');
  if (!fs.existsSync(settingsPath)) return false;
  try {
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (!cfg.statusLine) return false;
    delete cfg.statusLine;
    if (!dryRun) {
      fs.writeFileSync(settingsPath, JSON.stringify(cfg, null, 2) + '\n');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes status_line and status_line_use_colors from Codex CLI's ~/.codex/config.toml.
 */
function disableCodexStatusLine(dryRun = false, homeDir = os.homedir()) {
  const configPath = path.join(homeDir, '.codex', 'config.toml');
  if (!fs.existsSync(configPath)) return false;
  try {
    const original = fs.readFileSync(configPath, 'utf8');
    const updated = original
      .replace(/^\s*status_line\s*=.*\r?\n?/gm, '')
      .replace(/^\s*status_line_use_colors\s*=.*\r?\n?/gm, '');
    if (updated === original) return false;
    if (!dryRun) {
      fs.writeFileSync(configPath, updated);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Persists user HUD theme and line-count preferences to ~/.heimdall-hud.json.
 */
function writeHudConfig({ theme, lines }, dryRun = false, homeDir = os.homedir()) {
  const cfgPath = path.join(homeDir, '.heimdall-hud.json');
  let existing = {};
  if (fs.existsSync(cfgPath)) {
    try { existing = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
  }
  const next = {
    ...existing,
    ...(theme ? { theme } : {}),
    ...(lines ? { lines: Number(lines) === 1 ? 1 : 2 } : {})
  };
  if (!dryRun) {
    fs.writeFileSync(cfgPath, JSON.stringify(next, null, 2) + '\n');
  }
  return next;
}

module.exports = {
  CODEX_STATUS_LINE_ITEMS,
  formatHudCommand,
  configureClaudeStatusLine,
  configureAntigravityStatusLine,
  configureCodexStatusLine,
  disableClaudeStatusLine,
  disableAntigravityStatusLine,
  disableCodexStatusLine,
  writeHudConfig
};
