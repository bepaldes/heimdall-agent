import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { runDoctor } = require('../lib/doctor.cjs');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('runDoctor reports pass when links, MCP entrypoints, Claude hooks, and git pre-push are valid', () => {
  const tmp = makeTempDir('heimdall-doctor-pass-');
  try {
    const rootDir = path.join(tmp, 'heimdall');
    const claudeDir = path.join(tmp, '.claude');
    const repoDir = path.join(tmp, 'repo');

    fs.mkdirSync(path.join(rootDir, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'agents'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'config'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(path.join(repoDir, '.git', 'hooks'), { recursive: true });

    fs.writeFileSync(path.join(rootDir, 'hooks', 'heimdall-hook.cjs'), '// hook\n');
    const mcpEntry = path.join(tmp, 'fake-mcp.js');
    fs.writeFileSync(mcpEntry, '// mcp\n');
    fs.writeFileSync(path.join(rootDir, 'config', 'mcp.resolved.json'), JSON.stringify({
      mcpServers: {
        context7: {
          disabled: false,
          config: { command: process.execPath, args: [mcpEntry] }
        }
      }
    }));

    fs.symlinkSync(path.join(rootDir, 'skills'), path.join(claudeDir, 'skills'), 'dir');
    fs.symlinkSync(path.join(rootDir, 'agents'), path.join(claudeDir, 'agents'), 'dir');
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
      hooks: {
        PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node heimdall-hook.cjs pre-bash' }] }]
      }
    }));
    fs.writeFileSync(path.join(repoDir, '.git', 'hooks', 'pre-push'), '#!/bin/sh\n', { mode: 0o755 });

    const result = runDoctor({
      rootDir,
      repoDir,
      harnesses: [{ id: 'claude', dir: claudeDir }],
      claudeSettingsPath: path.join(claudeDir, 'settings.json')
    });

    assert.equal(result.status, 'pass');
    assert.equal(result.summary.fail, 0);
    assert.equal(result.summary.warn, 0);
    assert.ok(result.summary.pass >= 4);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runDoctor detects dangling per-skill child symlinks inside real skills/ directory', () => {
  const tmp = makeTempDir('heimdall-doctor-child-link-');
  try {
    const rootDir = path.join(tmp, 'heimdall');
    const claudeDir = path.join(tmp, '.claude');
    const repoDir = path.join(tmp, 'repo');

    fs.mkdirSync(path.join(rootDir, 'config'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
    fs.mkdirSync(path.join(claudeDir, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(claudeDir, 'agents'), { recursive: true });
    fs.mkdirSync(repoDir, { recursive: true });

    fs.writeFileSync(path.join(rootDir, 'hooks', 'heimdall-hook.cjs'), '// hook\n');
    fs.writeFileSync(path.join(rootDir, 'config', 'mcp.resolved.json'), JSON.stringify({ mcpServers: {} }));
    fs.symlinkSync(path.join(tmp, 'missing-skill-dir'), path.join(claudeDir, 'skills', 'onboard'), 'dir');

    const result = runDoctor({
      rootDir,
      repoDir,
      harnesses: [{ id: 'claude', dir: claudeDir }],
      claudeSettingsPath: path.join(claudeDir, 'settings.json')
    });

    const linkCheck = result.checks.find(c => c.id === 'harness-links');
    assert.equal(linkCheck.status, 'fail');
    assert.match(linkCheck.message, /claude\/skills\/onboard/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runDoctor reports fail on dangling harness symlinks and missing MCP entrypoints', () => {
  const tmp = makeTempDir('heimdall-doctor-fail-');
  try {
    const rootDir = path.join(tmp, 'heimdall');
    const claudeDir = path.join(tmp, '.claude');
    const repoDir = path.join(tmp, 'repo');

    fs.mkdirSync(path.join(rootDir, 'config'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(repoDir, { recursive: true });

    fs.writeFileSync(path.join(rootDir, 'hooks', 'heimdall-hook.cjs'), '// hook\n');
    fs.symlinkSync(path.join(tmp, 'does-not-exist'), path.join(claudeDir, 'skills'), 'dir');
    fs.writeFileSync(path.join(rootDir, 'config', 'mcp.resolved.json'), JSON.stringify({
      mcpServers: {
        context7: {
          disabled: false,
          config: { command: process.execPath, args: [path.join(tmp, 'missing-mcp.js')] }
        }
      }
    }));
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({}));

    const result = runDoctor({
      rootDir,
      repoDir,
      harnesses: [{ id: 'claude', dir: claudeDir }],
      claudeSettingsPath: path.join(claudeDir, 'settings.json')
    });

    assert.equal(result.status, 'fail');
    assert.ok(result.summary.fail >= 2);
    const linkCheck = result.checks.find(c => c.id === 'harness-links');
    const mcpCheck = result.checks.find(c => c.id === 'mcp-entrypoints');
    assert.equal(linkCheck.status, 'fail');
    assert.equal(mcpCheck.status, 'fail');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runDoctor reports warn when git pre-push hook is missing in a git repo', () => {
  const tmp = makeTempDir('heimdall-doctor-warn-');
  try {
    const rootDir = path.join(tmp, 'heimdall');
    const claudeDir = path.join(tmp, '.claude');
    const repoDir = path.join(tmp, 'repo');

    fs.mkdirSync(path.join(rootDir, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'agents'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'config'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(path.join(repoDir, '.git', 'hooks'), { recursive: true });

    fs.writeFileSync(path.join(rootDir, 'hooks', 'heimdall-hook.cjs'), '// hook\n');
    fs.writeFileSync(path.join(rootDir, 'config', 'mcp.resolved.json'), JSON.stringify({ mcpServers: {} }));
    fs.symlinkSync(path.join(rootDir, 'skills'), path.join(claudeDir, 'skills'), 'dir');
    fs.symlinkSync(path.join(rootDir, 'agents'), path.join(claudeDir, 'agents'), 'dir');
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
      hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node heimdall-hook.cjs pre-bash' }] }] }
    }));

    const result = runDoctor({
      rootDir,
      repoDir,
      harnesses: [{ id: 'claude', dir: claudeDir }],
      claudeSettingsPath: path.join(claudeDir, 'settings.json')
    });

    assert.equal(result.status, 'warn');
    assert.equal(result.summary.fail, 0);
    assert.equal(result.summary.warn, 1);
    const gitCheck = result.checks.find(c => c.id === 'git-pre-push');
    assert.equal(gitCheck.status, 'warn');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('runDoctor scopes harness checks to saved state.agents when configured', () => {
  const tmp = makeTempDir('heimdall-doctor-scope-');
  try {
    const rootDir = path.join(tmp, 'heimdall');
    const homeDir = path.join(tmp, 'home');
    const claudeDir = path.join(homeDir, '.claude');
    const hermesDir = path.join(homeDir, '.hermes');

    fs.mkdirSync(path.join(rootDir, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'agents'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'config'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'hooks'), { recursive: true });
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.mkdirSync(hermesDir, { recursive: true }); // Exists on disk, but NOT in saved state.agents

    fs.writeFileSync(path.join(rootDir, 'hooks', 'heimdall-hook.cjs'), '// hook\n');
    fs.writeFileSync(path.join(rootDir, 'config', 'mcp.resolved.json'), JSON.stringify({ mcpServers: {} }));
    fs.symlinkSync(path.join(rootDir, 'skills'), path.join(claudeDir, 'skills'), 'dir');
    fs.symlinkSync(path.join(rootDir, 'agents'), path.join(claudeDir, 'agents'), 'dir');
    fs.writeFileSync(path.join(homeDir, '.heimdall-state.json'), JSON.stringify({ agents: ['claude'] }));

    const result = runDoctor({
      rootDir,
      homeDir,
      repoDir: tmp,
      claudeSettingsPath: path.join(claudeDir, 'settings.json')
    });

    const linkCheck = result.checks.find(c => c.id === 'harness-links');
    assert.equal(linkCheck.status, 'pass');
    assert.match(linkCheck.message, /claude/);
    assert.doesNotMatch(linkCheck.message, /hermes/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
