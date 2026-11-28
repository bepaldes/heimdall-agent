import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { addProfile } = require('../lib/profiles.cjs');
const {
  buildPermissionAllowlist,
  applyAutonomousPermissions
} = require('../lib/permissions.cjs');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('buildPermissionAllowlist includes OS-specific commands for full-autonomous', () => {
  const safeLinux = buildPermissionAllowlist('safe-dev', 'linux');
  assert.ok(safeLinux.includes('git'));
  assert.ok(safeLinux.includes('pnpm'));
  assert.ok(!safeLinux.includes('sudo systemctl'));

  const fullLinux = buildPermissionAllowlist('full-autonomous', 'linux');
  assert.ok(fullLinux.includes('sudo systemctl'));
  assert.ok(fullLinux.includes('omarchy'));

  const fullMac = buildPermissionAllowlist('full-autonomous', 'darwin');
  assert.ok(fullMac.includes('brew'));
  assert.ok(!fullMac.includes('sudo systemctl'));

  const fullWin = buildPermissionAllowlist('full-autonomous', 'win32');
  assert.ok(fullWin.includes('winget'));
  assert.ok(fullWin.includes('pwsh'));
});

test('applyAutonomousPermissions updates Claude, Antigravity, Codex, and profiles with backups and reset', () => {
  const homeDir = makeTempDir('heimdall-perms-');
  try {
    const claudeDir = path.join(homeDir, '.claude');
    const agyDir = path.join(homeDir, '.gemini', 'antigravity-cli');
    const codexDir = path.join(homeDir, '.codex');
    const heimdallDir = path.join(homeDir, '.heimdall');
    const profileClaudeDir = path.join(heimdallDir, 'profiles', 'claude-work');

    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(agyDir, { recursive: true });
    fs.mkdirSync(codexDir, { recursive: true });
    fs.mkdirSync(profileClaudeDir, { recursive: true });

    const origClaude = { permissions: { allow: ['Bash(git *)'] }, autoMode: { allow: ['Bash(git *)'] } };
    const profileAgyDir = path.join(heimdallDir, 'profiles', 'agy-work');
    const profileAgyCfgDir = path.join(profileAgyDir, '.gemini', 'antigravity-cli');
    fs.mkdirSync(profileAgyCfgDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), '\uFEFF' + JSON.stringify(origClaude, null, 2));
    fs.writeFileSync(path.join(agyDir, 'settings.json'), JSON.stringify({ permissions: { allow: [], deny: [] } }, null, 2));
    fs.writeFileSync(path.join(codexDir, 'config.toml'), '\uFEFFmodel = "gpt-6-astra"\n');
    fs.writeFileSync(path.join(profileClaudeDir, 'settings.json'), JSON.stringify({}, null, 2));
    fs.writeFileSync(path.join(profileAgyCfgDir, 'settings.json'), JSON.stringify({}, null, 2));
    addProfile('claude/work', { dir: profileClaudeDir, homeDir });
    addProfile('agy/work', { dir: profileAgyDir, homeDir });

    const res = applyAutonomousPermissions({
      preset: 'full-autonomous',
      platform: 'linux',
      homeDir,
      agents: ['all'],
      includeProfiles: true
    });

    assert.ok(res.updated.length >= 5);

    const claudeCfg = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
    assert.ok(claudeCfg.autoMode.allow.includes('Bash(sudo systemctl *)'));
    assert.ok(claudeCfg.permissions.allow.includes('Bash(pnpm *)'));
    assert.equal(claudeCfg.autoMode.allow.filter(x => x === 'Bash(git *)').length, 1);
    assert.equal(claudeCfg.sandbox.enabled, false);
    assert.ok(claudeCfg.sandbox.excludedCommands.includes('docker'));
    assert.ok(claudeCfg.sandbox.excludedCommands.includes('docker compose'));

    const agyCfg = JSON.parse(fs.readFileSync(path.join(agyDir, 'settings.json'), 'utf8'));
    assert.ok(agyCfg.permissions.allow.includes('command(pnpm)'));
    assert.ok(agyCfg.permissions.deny.includes('command(rm -rf)'));

    const codexToml = fs.readFileSync(path.join(codexDir, 'config.toml'), 'utf8');
    assert.match(codexToml, /approval_policy\s*=\s*"never"/);

    const profileCfg = JSON.parse(fs.readFileSync(path.join(profileClaudeDir, 'settings.json'), 'utf8'));
    assert.ok(profileCfg.autoMode.allow.includes('Bash(docker compose *)'));
    assert.equal(fs.existsSync(path.join(claudeDir, 'settings.json.heimdall.bak')), true);

    const resetRes = applyAutonomousPermissions({ homeDir, includeProfiles: true, reset: true });
    assert.ok(resetRes.restored.length >= 3);
    const restoredClaude = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8').replace(/^\uFEFF/, ''));
    assert.deepEqual(restoredClaude, origClaude);
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});
