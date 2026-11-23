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

function thresholdColor(pct, theme) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  return clamped >= 75 ? theme.crit : clamped >= 50 ? theme.warn : theme.ok;
}

/**
 * Builds an 8-block context saturation bar color-coded to Heimdall's 75% sentinel threshold.
 */
export function renderContextBar(pct, width = 8, theme = THEMES['night-blue']) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  // Guard: at 0% or near-zero, force empty bar to avoid false solid-fill appearance
  const filled = clamped < 1 ? 0 : Math.round((clamped / 100) * width);
  const empty = Math.max(0, width - filled);
  const color = thresholdColor(clamped, theme);
  return `${color}[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(clamped)}%${RESET}`;
}

/**
 * Formats a quota reset timestamp, epoch seconds/ms, or relative seconds into a compact string.
 */
export function formatResetTime(value, now = Date.now()) {
  if (value === null || value === undefined || value === '') return '';
  let msRemaining = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const targetMs = value > 1e12 ? value : value > 1e9 ? value * 1000 : now + value * 1000;
    msRemaining = targetMs - now;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d+$/.test(trimmed)) {
      return formatResetTime(Number(trimmed), now);
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      msRemaining = parsed - now;
    } else {
      return trimmed;
    }
  }
  if (msRemaining === null) return '';
  if (msRemaining <= 0) return 'now';
  const totalMins = Math.ceil(msRemaining / 60_000);
  if (totalMins < 60) return `${totalMins}m`;
  const totalHrs = Math.floor(totalMins / 60);
  const remMins = totalMins % 60;
  if (totalHrs < 24) return remMins > 0 ? `${totalHrs}h${remMins}m` : `${totalHrs}h`;
  const days = Math.floor(totalHrs / 24);
  const remHrs = totalHrs % 24;
  return remHrs > 0 ? `${days}d${remHrs}h` : `${days}d`;
}

function parseQuotaPct(windowObj) {
  if (!windowObj || typeof windowObj !== 'object') return null;
  if (typeof windowObj.used_percentage === 'number') return windowObj.used_percentage;
  if (typeof windowObj.remaining_percentage === 'number') return 100 - windowObj.remaining_percentage;
  if (typeof windowObj.used_fraction === 'number') return windowObj.used_fraction * 100;
  if (typeof windowObj.remaining_fraction === 'number') return (1 - windowObj.remaining_fraction) * 100;
  if (typeof windowObj.quota_remaining === 'number') {
    return windowObj.quota_remaining <= 1 ? (1 - windowObj.quota_remaining) * 100 : 100 - windowObj.quota_remaining;
  }
  return null;
}

function formatQuotaWindow(label, windowObj, theme, compact, now) {
  const pct = parseQuotaPct(windowObj);
  if (!Number.isFinite(pct)) return '';
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const color = thresholdColor(clamped, theme);
  const resetRaw = windowObj.resets_at ?? windowObj.reset_time ?? windowObj.quota_resets ?? windowObj.reset_in_seconds;
  const resetStr = !compact ? formatResetTime(resetRaw, now) : '';
  const resetSuffix = resetStr ? ` ${DIM}(${resetStr})${RESET}` : '';
  return `${color}${label}:${clamped}%${RESET}${resetSuffix}`;
}

function resolveAgyQuotaPair(quotaObj, modelName = '') {
  const lower = String(modelName).toLowerCase();
  const isThirdParty = /claude|opus|sonnet|haiku|gpt|oss|3p/.test(lower);
  const isArgon = /argon/.test(lower);

  const fiveKey = isThirdParty
    ? (quotaObj['3p-5h'] ? '3p-5h' : 'gemini-5h')
    : (quotaObj['gemini-5h'] ? 'gemini-5h' : '3p-5h');

  let weekKey;
  if (isThirdParty) {
    weekKey = quotaObj['3p-weekly'] ? '3p-weekly' : 'gemini-weekly';
  } else if (isArgon && quotaObj['gemini-argon-wtu-weekly']) {
    weekKey = 'gemini-argon-wtu-weekly';
  } else {
    weekKey = quotaObj['gemini-weekly'] ? 'gemini-weekly' : '3p-weekly';
  }

  return { fiveHour: quotaObj[fiveKey], weekly: quotaObj[weekKey] };
}

/**
 * Extracts rate-limit / quota segments from Antigravity (agy) or Claude Code payloads.
 */
export function formatQuotaSegments(payload = {}, theme = THEMES['night-blue'], options = {}) {
  const now = typeof options.now === 'number' ? options.now : Date.now();
  const compact = Boolean(options.compact);
  const modelName =
    (typeof payload.model === 'object' ? payload.model?.display_name || payload.model?.id : payload.model) || '';
  const parts = [];

  const limits = payload.rate_limits || payload.quotas || payload.limits;
  if (Array.isArray(limits)) {
    for (const item of limits) {
      const label = item?.label || item?.display_name || item?.quota_bucket || item?.name || 'quota';
      const formatted = formatQuotaWindow(compact ? 'Q' : label, item, theme, compact, now);
      if (formatted) parts.push(formatted);
    }
  } else if (limits && typeof limits === 'object') {
    const fiveHour = limits.five_hour || limits.fiveHour || limits['5h'];
    const weekly = limits.seven_day || limits.sevenDay || limits.weekly || limits['7d'];
    if (fiveHour || weekly) {
      const fiveStr = formatQuotaWindow('5h', fiveHour, theme, compact, now);
      const weekStr = formatQuotaWindow('wk', weekly, theme, compact, now);
      if (fiveStr) parts.push(fiveStr);
      if (weekStr) parts.push(weekStr);
    } else {
      for (const [key, item] of Object.entries(limits)) {
        const label = item?.label || item?.display_name || item?.quota_bucket || key;
        const formatted = formatQuotaWindow(compact ? 'Q' : label, item, theme, compact, now);
        if (formatted) parts.push(formatted);
      }
    }
  }

  if (payload.quota && typeof payload.quota === 'object') {
    const qFive = payload.quota.five_hour || payload.quota.fiveHour || payload.quota['5h'];
    const qWeek = payload.quota.seven_day || payload.quota.sevenDay || payload.quota.weekly || payload.quota['7d'];
    if (qFive || qWeek) {
      const fiveStr = formatQuotaWindow('5h', qFive, theme, compact, now);
      const weekStr = formatQuotaWindow('wk', qWeek, theme, compact, now);
      if (fiveStr && !parts.length) parts.push(fiveStr);
      if (weekStr) parts.push(weekStr);
    } else if (parseQuotaPct(payload.quota) !== null) {
      const label = payload.quota.label || payload.quota.display_name || (compact ? 'Q' : 'quota');
      const bucketStr = formatQuotaWindow(label, payload.quota, theme, compact, now);
      if (bucketStr) parts.push(bucketStr);
    } else {
      // Antigravity (agy) bucket map: e.g. { "gemini-5h": {...}, "gemini-weekly": {...}, "3p-5h": {...}, "3p-weekly": {...} }
      const { fiveHour, weekly } = resolveAgyQuotaPair(payload.quota, modelName);
      const fiveStr = formatQuotaWindow('5h', fiveHour, theme, compact, now);
      const weekStr = formatQuotaWindow('wk', weekly, theme, compact, now);
      if (fiveStr) parts.push(fiveStr);
      if (weekStr) parts.push(weekStr);
    }
  }

  return parts.join(' ');
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

  const columns = payload.terminal?.columns || payload.terminal_width || process.stdout.columns || 120;
  const compact = columns < 80;

  const bar = renderContextBar(pct, compact ? 6 : 8, theme);
  const ctxSegment = ctxSizeLabel && !compact ? `${bar} ${DIM}(${ctxSizeLabel})${RESET}` : bar;
  const quotaSegment = formatQuotaSegments(payload, theme, { compact, now: options.now });

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
    if (quotaSegment && !compact) single.push(quotaSegment);
    if (payload.vim?.mode && !compact) single.push(`${theme.state}[${payload.vim.mode}]${RESET}`);
    return single.join(sep);
  }

  // Line 1: Model │ Context Bar │ State │ Cost │ Vim
  const line1 = [`${BOLD}${theme.model}${modelName}${RESET}`, ctxSegment];
  // Infer state badge when harness omits agent_state (e.g. Claude Code)
  const effectiveState = payload.agent_state ||
    (payload.cost?.total_duration_ms > 0 ? 'idle' : null);
  if (effectiveState) line1.push(formatStateBadge(effectiveState, theme));
  if (typeof payload.cost?.total_cost_usd === 'number') {
    line1.push(`${theme.cost}$${payload.cost.total_cost_usd.toFixed(2)}${RESET}`);
  }
  if (payload.vim?.mode && !compact) {
    line1.push(`${theme.state}[${payload.vim.mode}]${RESET}`);
  }

  // Line 2: Workspace (branch *dirty) │ Tokens │ Duration │ Quota / Rate Limits
  const line2 = [locSegment];
  // Always render token segment for visual parity across harnesses
  line2.push(`${DIM}↑${inTok || '0'} ↓${outTok || '0'}${RESET}`);
  if (duration && !compact) {
    line2.push(`${DIM}⏱ ${duration}${RESET}`);
  }
  if (quotaSegment) {
    line2.push(quotaSegment);
  } else if (compact) {
    // Compact fallback: show highest-usage quota bucket when full segments are hidden
    const compactQuota = formatQuotaSegments(payload, theme, { compact: true, now: options.now });
    if (compactQuota) line2.push(compactQuota);
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
      quota: { used_percentage: 28, reset_time: '2h15m' },
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
