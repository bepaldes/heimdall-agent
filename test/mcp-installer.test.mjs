import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  resolveOpenDesignMcpConfig,
  installMcpPackages,
  syncMcpServers,
  auditMcpServers
} = require('../lib/mcp-installer.cjs');

test('lib/mcp-installer.cjs', async (t) => {
  await t.test('exports expected functions', () => {
    assert.equal(typeof resolveOpenDesignMcpConfig, 'function');
    assert.equal(typeof installMcpPackages, 'function');
    assert.equal(typeof syncMcpServers, 'function');
    assert.equal(typeof auditMcpServers, 'function');
  });

  await t.test('auditMcpServers inspects Claude and Antigravity configs in isolated homeDir', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-mcp-audit-'));
    try {
      const claudeDir = path.join(tmpHome, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({ mcpServers: { context7: { command: 'node', args: [] } } })
      );

      const agyDir = path.join(tmpHome, '.gemini', 'antigravity-cli');
      const agyCfgDir = path.join(tmpHome, '.gemini', 'config');
      fs.mkdirSync(agyDir, { recursive: true });
      fs.mkdirSync(agyCfgDir, { recursive: true });
      fs.writeFileSync(
        path.join(agyCfgDir, 'mcp_config.json'),
        JSON.stringify({ mcpServers: { 'chrome-devtools': { command: 'node', args: [] } } })
      );

      const results = auditMcpServers(tmpHome);
      const claudeCtx = results.find(r => r.harness === 'Claude Code' && r.server === 'context7');
      const agyChrome = results.find(r => r.harness === 'Google Antigravity' && r.server === 'chrome-devtools');
      assert.equal(claudeCtx?.configured, true);
      assert.equal(agyChrome?.configured, true);
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });
});
