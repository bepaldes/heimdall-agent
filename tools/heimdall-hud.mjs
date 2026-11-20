#!/usr/bin/env node
/**
 * Heimdall HUD — Cross-Harness Terminal Statusline Renderer
 *
 * Normalizes session telemetry JSON piped to stdin by:
 *   - Google Antigravity CLI (agy)
 *   - Claude Code CLI
 *
 * Supports 2-line telemetry + truecolor theme presets:
 *   heimdall (default), claude-warm, night-blue, titanium
 *
 * Zero external dependencies; always exits 0 to avoid CLI circuit breakers.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

function fg(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

export const THEMES = {
  heimdall: {
    model: fg(56, 189, 248),     // sky cyan
    dir: fg(226, 232, 240),      // slate 200
    branch: fg(96, 165, 250),    // blue 400
    dirty: fg(251, 191, 36),     // amber 400
    cost: fg(74, 222, 128),      // green 400
    state: fg(192, 132, 252),    // purple 400
    sep: fg(100, 116, 139),      // slate 500
    ok: fg(74, 222, 128),
    warn: fg(250, 204, 21),
    crit: fg(248, 113, 113)
  },
  'claude-warm': {
    model: fg(224, 122, 95),     // terracotta
    dir: fg(244, 241, 222),      // warm cream
    branch: fg(242, 204, 143),   // sand gold
    dirty: fg(245, 158, 11),     // warm amber
    cost: fg(129, 178, 154),     // sage green
    state: fg(224, 122, 95),
    sep: fg(140, 122, 107),      // mutedtaupe
    ok: fg(129, 178, 154),
    warn: fg(242, 204, 143),
    crit: fg(231, 111, 81)
  },
  'night-blue': {
    model: fg(96, 165, 250),     // electric blue
    dir: fg(219, 234, 254),      // ice blue
    branch: fg(167, 139, 250),   // soft indigo
    dirty: fg(251, 191, 36),
    cost: fg(52, 211, 153),      // mint
    state: fg(125, 211, 252),    // sky 300
    sep: fg(71, 85, 105),
    ok: fg(52, 211, 153),
    warn: fg(251, 191, 36),
    crit: fg(248, 113, 113)
  },
  titanium: {
    model: fg(248, 250, 252),    // bright silver
    dir: fg(203, 213, 225),      // slate 300
    branch: fg(148, 163, 184),   // slate 400
    dirty: fg(251, 191, 36),
    cost: fg(56, 189, 248),      // steel cyan
    state: fg(148, 163, 184),
    sep: fg(71, 85, 105),
    ok: fg(148, 163, 184),
    warn: fg(251, 191, 36),
    crit: fg(239, 68, 68)
  }
};

/**
 * Formats a token count into a compact human-readable string (e.g. 1M, 200K).
 */
export function formatTokens(n) {
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

/**
 * Formats milliseconds into a compact duration string (e.g. 2m 27s).
 */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

/**
 * Resolves HUD theme & line-count config from options, env, or ~/.heimdall-hud.json.
 */
export function resolveHudConfig(options = {}, homeDir = os.homedir()) {
  let fileCfg = {};
  const cfgPath = path.join(homeDir, '.heimdall-hud.json');
  if (fs.existsSync(cfgPath)) {
    try {
      fileCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    } catch { /* ignore invalid JSON */ }
  }
  const themeName = options.theme || process.env.HEIMDALL_HUD_THEME || fileCfg.theme || 'night-blue';
  const lines = Number(options.lines || process.env.HEIMDALL_HUD_LINES || fileCfg.lines || 2);
  return {
    themeName: THEMES[themeName] ? themeName : 'night-blue',
    theme: THEMES[themeName] || THEMES['night-blue'],
    lines: lines === 1 ? 1 : 2
  };
}

/**
 * Builds an 8-block context saturation bar color-coded to Heimdall's 75% sentinel threshold.
 */
export function renderContextBar(pct, width = 8, theme = THEMES['night-blue']) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const filled = Math.round((clamped / 100) * width);
  const empty = Math.max(0, width - filled);
  const color = clamped >= 75 ? theme.crit : clamped >= 50 ? theme.warn : theme.ok;
  return `${color}[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(clamped)}%${RESET}`;
}

function resolveGitInfo(cwd) {
  if (!cwd) return { branch: null, dirtyCount: 0 };
  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      timeout: 400,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim() || null;

    let dirtyCount = 0;
    if (branch) {
      const status = execFileSync('git', ['status', '--porcelain'], {
        cwd,
        encoding: 'utf8',
        timeout: 400,
        stdio: ['ignore', 'pipe', 'ignore']
      });
      dirtyCount = status ? status.split(/\r?\n/).filter(Boolean).length : 0;
    }
    return { branch, dirtyCount };
  } catch {
    return { branch: null, dirtyCount: 0 };
  }
}

function formatStateBadge(state, theme) {
  if (!state) return '';
  const map = {
    idle: `${DIM}● idle${RESET}`,
    thinking: `${theme.state}◐ thinking${RESET}`,
    working: `${theme.model}⟳ working${RESET}`,
    tool_use: `${theme.warn}⚙ tool${RESET}`,
    error: `${theme.crit}✖ error${RESET}`
  };
  return map[state] || `${DIM}${state}${RESET}`;
}

/**
 * Normalizes Claude Code / Antigravity telemetry payloads and renders the 1- or 2-line HUD.
 */
export function renderHud(payload = {}, options = {}) {
  const { theme, lines } = resolveHudConfig(options);
  const sep = ` ${theme.sep}│${RESET} `;

  const modelName =
    (typeof payload.model === 'object' ? payload.model?.display_name || payload.model?.id : payload.model) ||
    'Agent';

  const currentDir = payload.workspace?.current_dir || payload.cwd || process.cwd();
  const dirName = path.basename(currentDir) || currentDir;

  const gitInfo = options.skipGit ? { branch: null, dirtyCount: 0 } : resolveGitInfo(currentDir);
  const branch = payload.workspace?.branch || gitInfo.branch;
  const dirtyCount = typeof payload.workspace?.dirty_count === 'number'
    ? payload.workspace.dirty_count
    : gitInfo.dirtyCount;

  const pct = payload.context_window?.used_percentage ?? 0;
  const ctxSize = payload.context_window?.context_window_size || payload.context_window?.size || 0;
  const ctxSizeLabel = formatTokens(ctxSize);
  const inTok = formatTokens(payload.context_window?.total_input_tokens);
  const outTok = formatTokens(payload.context_window?.total_output_tokens);
  const duration = formatDuration(payload.cost?.total_duration_ms);

  const columns = payload.terminal?.columns || process.stdout.columns || 120;
  const compact = columns < 80;

  const bar = renderContextBar(pct, compact ? 6 : 8, theme);
  const ctxSegment = ctxSizeLabel && !compact ? `${bar} ${DIM}(${ctxSizeLabel})${RESET}` : bar;

  const locParts = [`${theme.dir}${dirName}${RESET}`];
  if (branch) {
    const dirtySuffix = dirtyCount > 0 ? ` ${theme.dirty}*${dirtyCount}${RESET}` : '';
    locParts.push(`${theme.branch}(${branch}${dirtySuffix}${theme.branch})${RESET}`);
  }
  const locSegment = locParts.join(' ');

  if (lines === 1) {
    const single = [`${BOLD}${theme.model}${modelName}${RESET}`, locSegment, ctxSegment];
    if (payload.agent_state) single.push(formatStateBadge(payload.agent_state, theme));
    if (typeof payload.cost?.total_cost_usd === 'number' && !compact) {
      single.push(`${theme.cost}$${payload.cost.total_cost_usd.toFixed(2)}${RESET}`);
    }
    if (payload.vim?.mode && !compact) single.push(`${theme.state}[${payload.vim.mode}]${RESET}`);
    return single.join(sep);
  }

  // Line 1: Model │ Context Bar │ State │ Cost │ Vim
  const line1 = [`${BOLD}${theme.model}${modelName}${RESET}`, ctxSegment];
  if (payload.agent_state) line1.push(formatStateBadge(payload.agent_state, theme));
  if (typeof payload.cost?.total_cost_usd === 'number') {
    line1.push(`${theme.cost}$${payload.cost.total_cost_usd.toFixed(2)}${RESET}`);
  }
  if (payload.vim?.mode && !compact) {
    line1.push(`${theme.state}[${payload.vim.mode}]${RESET}`);
  }

  // Line 2: Workspace (branch *dirty) │ Tokens │ Duration
  const line2 = [locSegment];
  if (inTok || outTok) {
    line2.push(`${DIM}↑${inTok || '0'} ↓${outTok || '0'}${RESET}`);
  }
  if (duration && !compact) {
    line2.push(`${DIM}⏱ ${duration}${RESET}`);
  }

  return `${line1.join(sep)}\n${line2.join(sep)}`;
}

function readStdinSafe() {
  try {
    if (process.stdin.isTTY) return '';
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes('--preview')) {
    const sample = {
      agent_state: 'working',
      model: 'Gemini 4 Hydrogen (Medium)',
      workspace: { current_dir: process.cwd(), branch: 'main', dirty_count: 2 },
      context_window: { used_percentage: 42, context_window_size: 1048576, total_input_tokens: 45200, total_output_tokens: 3100 },
      cost: { total_cost_usd: 0.14, total_duration_ms: 147000 },
      terminal: { columns: 120 }
    };
    for (const name of Object.keys(THEMES)) {
      process.stdout.write(`${BOLD}Theme: ${name}${RESET}\n${renderHud(sample, { theme: name, skipGit: true })}\n\n`);
    }
    process.exit(0);
  }

  try {
    const raw = readStdinSafe().trim();
    const payload = raw ? JSON.parse(raw) : {};
    process.stdout.write(renderHud(payload) + '\n');
  } catch {
    process.stdout.write(`${THEMES['night-blue'].model}Heimdall HUD${RESET}\n`);
  }
  process.exit(0);
}
