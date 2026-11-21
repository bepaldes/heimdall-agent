import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  renderHud,
  renderContextBar,
  formatTokens,
  formatDuration,
  formatResetTime,
  formatQuotaSegments,
  resolveHudConfig,
  THEMES
} from '../tools/heimdall-hud.mjs';

const require = createRequire(import.meta.url);
const {
  formatHudCommand,
  configureClaudeStatusLine,
  configureAntigravityStatusLine,
  configureCodexStatusLine,
  disableClaudeStatusLine,
  disableAntigravityStatusLine,
  disableCodexStatusLine,
  writeHudConfig
} = require('../lib/hud-sync.cjs');

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

test('Heimdall HUD Renderer & Harness Sync', async (t) => {
  await t.test('formatTokens, formatDuration, and renderContextBar format thresholds cleanly', () => {
    assert.equal(formatTokens(1048576), '1M');
    assert.equal(formatTokens(200000), '200K');
    assert.equal(formatDuration(147000), '2m 27s');
    assert.match(renderContextBar(80), /\x1b\[38;2;248;113;113m/); // crit >= 75%
    assert.match(renderContextBar(60), /\x1b\[38;2;251;191;36m/);  // warn >= 50% (night-blue)
    assert.match(renderContextBar(20), /\x1b\[38;2;52;211;153m/);  // ok < 50% (night-blue)
  });

  await t.test('renderHud renders 2-line Antigravity (agy) payload with dirty count', () => {
    const out = stripAnsi(renderHud({
      agent_state: 'working',
      model: 'Gemini 4 Hydrogen (Medium)',
      workspace: { current_dir: 'C:\\Apps\\heimdall-agent', branch: 'main', dirty_count: 3 },
      context_window: { used_percentage: 25.4, context_window_size: 1048576 },
      terminal: { columns: 120 }
    }, { skipGit: true }));

    const lines = out.split('\n');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /Gemini 4 Hydrogen \(Medium\).*25% \(1M\).*working/);
    assert.match(lines[1], /heimdall-agent \(main \*3\)/);
  });

  await t.test('renderHud renders 2-line Claude Code payload with tokens, cost, and duration', () => {
    const out = stripAnsi(renderHud({
      model: { id: 'claude-opus-5-5', display_name: 'Opus 5.5' },
      workspace: { current_dir: '/tmp/my-app', branch: 'feat/hud' },
      context_window: { used_percentage: 78, size: 200000, total_input_tokens: 45200, total_output_tokens: 3100 },
      cost: { total_cost_usd: 0.42, total_duration_ms: 147000 },
      terminal: { columns: 120 }
    }, { skipGit: true }));

    const lines = out.split('\n');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /Opus 5\.5.*78% \(200K\).*\$0\.42/);
    assert.match(lines[1], /my-app \(feat\/hud\).*↑45K ↓3K.*2m 27s/);
  });

  await t.test('supports 1-line mode and theme presets (claude-warm, night-blue, titanium)', () => {
    for (const themeName of Object.keys(THEMES)) {
      const resolved = resolveHudConfig({ theme: themeName, lines: 1 });
      assert.equal(resolved.themeName, themeName);
      assert.equal(resolved.lines, 1);

      const single = stripAnsi(renderHud({
        model: 'Opus 5.5',
        workspace: { current_dir: '/tmp/app', branch: 'main' },
        context_window: { used_percentage: 10, size: 200000 }
      }, { theme: themeName, lines: 1, skipGit: true }));
      assert.equal(single.includes('\n'), false);
    }
  });

  await t.test('renders Antigravity (agy) bucket quota and windowed 5h/weekly rate limits when available', () => {
    const now = Date.UTC(2026, 10, 19, 12, 0, 0);
    assert.equal(formatResetTime(Math.floor((now + 135 * 60_000) / 1000), now), '2h15m');
    assert.equal(formatResetTime(new Date(now + 26 * 3600_000).toISOString(), now), '1d2h');

    // Antigravity StatusLineQuotaBucket shape
    const agyOut = stripAnsi(renderHud({
      model: 'Gemini 4 Hydrogen (Medium)',
      workspace: { current_dir: '/tmp/app', branch: 'main' },
      context_window: { used_percentage: 30, context_window_size: 1048576 },
      quota: { used_percentage: 64, reset_time: Math.floor((now + 90 * 60_000) / 1000) },
      terminal: { columns: 120 }
    }, { skipGit: true, now }));
    const agyLines = agyOut.split('\n');
    assert.match(agyLines[1], /quota:64% \(1h30m\)/);

    // Windowed 5h / weekly rate_limits shape (Claude Code or future agy)
    const rateOut = stripAnsi(renderHud({
      model: 'Opus 5.5',
      workspace: { current_dir: '/tmp/app', branch: 'main' },
      context_window: { used_percentage: 20, size: 200000 },
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: Math.floor((now + 45 * 60_000) / 1000) },
        seven_day: { used_percentage: 82, resets_at: Math.floor((now + 50 * 3600_000) / 1000) }
      },
      terminal: { columns: 120 }
    }, { skipGit: true, now }));
    const rateLines = rateOut.split('\n');
    assert.match(rateLines[1], /5h:42% \(45m\) wk:82% \(2d2h\)/);

    // Threshold coloring on quota segments
    const colored = formatQuotaSegments({
      rate_limits: {
        five_hour: { used_percentage: 20 },
        seven_day: { used_percentage: 85 }
      }
    }, THEMES['night-blue'], { now });
    assert.match(colored, /\x1b\[38;2;52;211;153m5h:20%/);   // ok < 50%
    assert.match(colored, /\x1b\[38;2;248;113;113mwk:85%/); // crit >= 75%

    // Array / map quotas with remaining_percentage or remaining_fraction
    const arrayQuotas = stripAnsi(formatQuotaSegments({
      quotas: [
        { display_name: 'gemini', remaining_percentage: 70, reset_time: Math.floor((now + 60 * 60_000) / 1000) },
        { quota_bucket: 'claude', remaining_fraction: 0.25 }
      ]
    }, THEMES['night-blue'], { now }));
    assert.equal(arrayQuotas, 'gemini:30% (1h) claude:75%');

    // Real agy bucket map payload (gemini-5h / gemini-weekly / 3p-5h / 3p-weekly)
    const agyMapOut = stripAnsi(renderHud({
      model: { id: 'Gemini 4 Hydrogen (Medium)', display_name: 'Gemini 4 Hydrogen (Medium)' },
      workspace: { current_dir: 'C:\\Apps\\heimdall-agent' },
      context_window: { used_percentage: 7.3, context_window_size: 1048576 },
      quota: {
        '3p-5h': { remaining_fraction: 1, reset_in_seconds: 17889 },
        '3p-weekly': { remaining_fraction: 1, reset_in_seconds: 604689 },
        'gemini-5h': { remaining_fraction: 0.8643823, reset_time: new Date(now + 11711 * 1000).toISOString(), reset_in_seconds: 11711 },
        'gemini-weekly': { remaining_fraction: 0.09946935, reset_time: new Date(now + 418013 * 1000).toISOString(), reset_in_seconds: 418013 }
      },
      terminal_width: 129
    }, { skipGit: true, now }));
    assert.match(agyMapOut.split('\n')[1], /5h:14% \(3h16m\) wk:90% \(4d20h\)/);

    // 3rd-party model inside agy selects 3p-5h / 3p-weekly
    const agy3pOut = stripAnsi(formatQuotaSegments({
      model: { id: 'Claude Opus 5.5 (Medium)' },
      quota: {
        '3p-5h': { remaining_fraction: 0.6, reset_in_seconds: 3600 },
        '3p-weekly': { remaining_fraction: 0.8, reset_in_seconds: 86400 },
        'gemini-5h': { remaining_fraction: 0.1 },
        'gemini-weekly': { remaining_fraction: 0.1 }
      }
    }, THEMES['night-blue'], { now }));
    assert.equal(agy3pOut, '5h:40% (1h) wk:20% (1d)');
  });

  await t.test('HUD sync configures Claude, Antigravity, and Codex idempotently', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-hud-'));
    try {
      const claudeDir = path.join(tmp, '.claude');
      const agyDir = path.join(tmp, '.gemini', 'antigravity-cli');
      const codexDir = path.join(tmp, '.codex');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.mkdirSync(agyDir, { recursive: true });
      fs.mkdirSync(codexDir, { recursive: true });

      fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({ model: 'opus' }));
      fs.writeFileSync(path.join(agyDir, 'settings.json'), JSON.stringify({ agentMode: 'auto' }));
      fs.writeFileSync(path.join(codexDir, 'config.toml'), 'model = "gpt-6-astra"\n\n[tui]\nnotifications = true\n');

      const hudPath = path.join(tmp, 'heimdall-hud.mjs');
      assert.equal(configureClaudeStatusLine(hudPath, false, tmp), true);
      assert.equal(configureClaudeStatusLine(hudPath, false, tmp), false);

      assert.equal(configureAntigravityStatusLine(hudPath, false, tmp), true);
      assert.equal(configureAntigravityStatusLine(hudPath, false, tmp), false);

      assert.equal(configureCodexStatusLine(false, tmp), true);
      assert.equal(configureCodexStatusLine(false, tmp), false);

      const claudeCfg = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
      assert.equal(claudeCfg.model, 'opus');
      assert.equal(claudeCfg.statusLine.command, formatHudCommand(hudPath));

      const agyCfg = JSON.parse(fs.readFileSync(path.join(agyDir, 'settings.json'), 'utf8'));
      assert.equal(agyCfg.agentMode, 'auto');
      assert.equal(agyCfg.statusLine.enabled, true);
      assert.equal(agyCfg.statusLine.stack_with_default, false);

      const codexToml = fs.readFileSync(path.join(codexDir, 'config.toml'), 'utf8');
      assert.match(codexToml, /status_line = \[/);
      assert.match(codexToml, /notifications = true/);

      // Disable removes statusLine / status_line cleanly while preserving other keys
      assert.equal(disableClaudeStatusLine(false, tmp), true);
      assert.equal(disableClaudeStatusLine(false, tmp), false);
      assert.equal(JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8')).statusLine, undefined);

      assert.equal(disableAntigravityStatusLine(false, tmp), true);
      assert.equal(disableAntigravityStatusLine(false, tmp), false);
      assert.equal(JSON.parse(fs.readFileSync(path.join(agyDir, 'settings.json'), 'utf8')).statusLine, undefined);

      assert.equal(disableCodexStatusLine(false, tmp), true);
      assert.equal(disableCodexStatusLine(false, tmp), false);
      assert.doesNotMatch(fs.readFileSync(path.join(codexDir, 'config.toml'), 'utf8'), /status_line\s*=/);

      // writeHudConfig persists theme & lines
      const saved = writeHudConfig({ theme: 'claude-warm', lines: 1 }, false, tmp);
      assert.equal(saved.theme, 'claude-warm');
      assert.equal(saved.lines, 1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
