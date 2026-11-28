'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getAgentRootDir, isAgentConfigurable } = require('./harness-detection.cjs');

const DEFAULT_HARNESS_IDS = ['claude', 'gemini', 'codex', 'hermes', 'openclaw', 'vscode', 'agents'];

function isDanglingSymlink(targetPath) {
  try {
    fs.lstatSync(targetPath);
    return !fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function checkHarnessLinks(harnesses) {
  const active = harnesses.filter((h) => h.dir && fs.existsSync(h.dir));
  if (active.length === 0) {
    return {
      id: 'harness-links',
      name: 'Harness Links',
      status: 'warn',
      message: 'No installed AI harness directories found.',
      remediation: 'Run: node setup.mjs --link --clean --yes'
    };
  }

  const broken = [];
  const missing = [];
  for (const harness of active) {
    for (const sub of ['skills', 'agents']) {
      const target = path.join(harness.dir, sub);
      if (isDanglingSymlink(target)) {
        broken.push(`${harness.id}/${sub}`);
        continue;
      }
      if (!fs.existsSync(target)) {
        missing.push(`${harness.id}/${sub}`);
        continue;
      }
      try {
        for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
          if (entry.isSymbolicLink() && isDanglingSymlink(path.join(target, entry.name))) {
            broken.push(`${harness.id}/${sub}/${entry.name}`);
          }
        }
      } catch {
        // Ignore unreadable entries
      }
    }
  }

  if (broken.length > 0) {
    return {
      id: 'harness-links',
      name: 'Harness Links',
      status: 'fail',
      message: `Broken symlinks/junctions: ${broken.join(', ')}`,
      remediation: 'Run: node setup.mjs --link --clean --yes'
    };
  }

  if (missing.length > 0) {
    return {
      id: 'harness-links',
      name: 'Harness Links',
      status: 'warn',
      message: `Unlinked directories: ${missing.join(', ')}`,
      remediation: 'Run: node setup.mjs sync'
    };
  }

  return {
    id: 'harness-links',
    name: 'Harness Links',
    status: 'pass',
    message: `Verified skills & agents across ${active.map((h) => h.id).join(', ')}.`
  };
}

function isLocalPathArg(val) {
  const str = String(val);
  if (!str || str.startsWith('-') || /^https?:\/\//i.test(str)) return false;
  return str.includes('/') || str.includes('\\');
}

function checkMcpEntrypoints(rootDir) {
  const resolvedPath = path.join(rootDir, 'config', 'mcp.resolved.json');
  if (!fs.existsSync(resolvedPath)) {
    return {
      id: 'mcp-entrypoints',
      name: 'MCP Entrypoints',
      status: 'warn',
      message: 'config/mcp.resolved.json not found.',
      remediation: 'Run: node scripts/resolve-mcp.mjs'
    };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (err) {
    return {
      id: 'mcp-entrypoints',
      name: 'MCP Entrypoints',
      status: 'fail',
      message: `Invalid JSON in config/mcp.resolved.json: ${err.message}`,
      remediation: 'Run: node scripts/resolve-mcp.mjs'
    };
  }

  const servers = data.mcpServers || {};
  const failures = [];

  for (const [id, srv] of Object.entries(servers)) {
    if (!srv || srv.disabled === true || !srv.config) continue;
    const { command, args, env } = srv.config;
    if (!command) continue;

    if (String(command).includes('_UNRESOLVED}}')) {
      failures.push(`${id} (unresolved command)`);
      continue;
    }

    if (isLocalPathArg(command) && !fs.existsSync(command)) {
      failures.push(`${id} (missing command: ${command})`);
      continue;
    }

    if (Array.isArray(args)) {
      for (const rawArg of args) {
        const entry = String(rawArg);
        if (entry.includes('_UNRESOLVED}}')) {
          failures.push(`${id} (unresolved arg: ${entry})`);
          break;
        }
        if (isLocalPathArg(entry) && !fs.existsSync(entry)) {
          failures.push(`${id} (missing path: ${entry})`);
          break;
        }
      }
    }

    if (env && typeof env === 'object') {
      for (const [k, v] of Object.entries(env)) {
        if (String(v).includes('_UNRESOLVED}}')) {
          failures.push(`${id} (unresolved env: ${k})`);
          break;
        }
      }
    }
  }

  if (failures.length > 0) {
    return {
      id: 'mcp-entrypoints',
      name: 'MCP Entrypoints',
      status: 'fail',
      message: `Invalid enabled MCP servers: ${failures.join('; ')}`,
      remediation: 'Run: node scripts/resolve-mcp.mjs'
    };
  }

  return {
    id: 'mcp-entrypoints',
    name: 'MCP Entrypoints',
    status: 'pass',
    message: 'All enabled local MCP server entrypoints exist.'
  };
}

function checkClaudeHooks(rootDir, claudeDir, claudeSettingsPath) {
  const hookScript = path.join(rootDir, 'hooks', 'heimdall-hook.cjs');
  if (!fs.existsSync(hookScript)) {
    return {
      id: 'claude-hooks',
      name: 'Claude Lifecycle Hooks',
      status: 'fail',
      message: 'hooks/heimdall-hook.cjs is missing from repository.',
      remediation: 'Restore hooks/heimdall-hook.cjs from git.'
    };
  }

  const settingsFile = claudeSettingsPath || (claudeDir ? path.join(claudeDir, 'settings.json') : null);
  if (!settingsFile || !fs.existsSync(settingsFile)) {
    return {
      id: 'claude-hooks',
      name: 'Claude Lifecycle Hooks',
      status: 'pass',
      message: 'Claude settings.json not present; hook registration skipped.'
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (err) {
    return {
      id: 'claude-hooks',
      name: 'Claude Lifecycle Hooks',
      status: 'fail',
      message: `Invalid JSON in Claude settings.json: ${err.message}`,
      remediation: 'Fix JSON syntax in ~/.claude/settings.json and re-run setup.'
    };
  }

  if (!parsed || !parsed.hooks || !JSON.stringify(parsed.hooks).includes('heimdall-hook.cjs')) {
    return {
      id: 'claude-hooks',
      name: 'Claude Lifecycle Hooks',
      status: 'warn',
      message: 'Claude settings.json does not reference heimdall-hook.cjs.',
      remediation: 'Run: node setup.mjs --agents claude --link --yes'
    };
  }

  return {
    id: 'claude-hooks',
    name: 'Claude Lifecycle Hooks',
    status: 'pass',
    message: 'Claude settings.json registers heimdall-hook.cjs.'
  };
}

function resolveGitDir(repoDir) {
  const dotGit = path.join(repoDir, '.git');
  if (!fs.existsSync(dotGit)) return null;
  try {
    const stat = fs.statSync(dotGit);
    if (stat.isDirectory()) return dotGit;
    if (stat.isFile()) {
      const match = fs.readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m);
      if (match) return path.resolve(repoDir, match[1].trim());
    }
  } catch {
    return null;
  }
  return null;
}

function checkGitPrePush(rootDir, repoDir) {
  const gitDir = resolveGitDir(repoDir);
  if (!gitDir) {
    return {
      id: 'git-pre-push',
      name: 'Git Pre-Push Hook',
      status: 'pass',
      message: 'Current directory is not a git repository; skipped.'
    };
  }

  const prePush = path.join(gitDir, 'hooks', 'pre-push');
  const sourceHook = path.join(rootDir, 'hooks', 'git', 'pre-push');
  if (!fs.existsSync(prePush)) {
    return {
      id: 'git-pre-push',
      name: 'Git Pre-Push Hook',
      status: 'warn',
      message: 'Optional .git/hooks/pre-push hook is not installed.',
      remediation: `Copy ${sourceHook} to ${prePush}`
    };
  }

  if (process.platform !== 'win32') {
    try {
      const mode = fs.statSync(prePush).mode;
      if ((mode & 0o111) === 0) {
        return {
          id: 'git-pre-push',
          name: 'Git Pre-Push Hook',
          status: 'warn',
          message: 'Git pre-push hook is not executable (+x).',
          remediation: `Run: chmod +x "${prePush}"`
        };
      }
    } catch {
      // Ignore stat failures
    }
  }

  return {
    id: 'git-pre-push',
    name: 'Git Pre-Push Hook',
    status: 'pass',
    message: '.git/hooks/pre-push is installed.'
  };
}

/**
 * Run deterministic health checks across Heimdall links, MCP entrypoints, hooks, and git pre-push.
 */
function runDoctor(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const repoDir = options.repoDir || process.cwd();
  const harnesses = options.harnesses || DEFAULT_HARNESS_IDS
    .filter((id) => isAgentConfigurable(id))
    .map((id) => ({ id, dir: getAgentRootDir(id) }));
  const claudeHarness = harnesses.find((h) => h.id === 'claude');
  const claudeDir = claudeHarness ? claudeHarness.dir : path.join(os.homedir(), '.claude');

  const checks = [
    checkHarnessLinks(harnesses),
    checkMcpEntrypoints(rootDir),
    checkClaudeHooks(rootDir, claudeDir, options.claudeSettingsPath),
    checkGitPrePush(rootDir, repoDir)
  ];

  const summary = { pass: 0, warn: 0, fail: 0, total: checks.length };
  for (const check of checks) {
    if (check.status === 'pass') summary.pass++;
    else if (check.status === 'warn') summary.warn++;
    else summary.fail++;
  }

  const status = summary.fail > 0 ? 'fail' : (summary.warn > 0 ? 'warn' : 'pass');
  return { status, summary, checks };
}

module.exports = { runDoctor };
