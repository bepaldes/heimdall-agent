import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { generateDashboard } = require('../lib/dashboard.cjs');

test('generateDashboard creates self-contained HTML with doctor, MCP, telemetry, and workspace profile', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-dash-'));
  try {
    const outPath = path.join(tmp, 'dashboard.html');
    const telemetryPath = path.join(tmp, 'telemetry.jsonl');
    const repoDir = path.join(tmp, 'repo');
    fs.mkdirSync(path.join(repoDir, '.heimdall'), { recursive: true });
    fs.writeFileSync(path.join(repoDir, '.heimdall', 'workspace.md'), '- **Stack**: Node.js + ESM\n');
    fs.writeFileSync(telemetryPath, JSON.stringify({
      timestamp: '2026-11-27T12:00:00Z',
      rule: 'zero-dev-server',
      action: 'block',
      detail: 'npm run dev'
    }) + '\n');

    const rootDir = path.resolve('.');
    const res = generateDashboard({
      rootDir,
      repoDir,
      outPath,
      telemetryPath,
      openBrowser: false
    });

    assert.equal(res.outPath, outPath);
    assert.equal(fs.existsSync(outPath), true);
    const html = fs.readFileSync(outPath, 'utf8');
    assert.match(html, /<!DOCTYPE html>/i);
    assert.match(html, /Heimdall Diagnostic Console/);
    assert.match(html, /zero-dev-server/);
    assert.match(html, /Node\.js \+ ESM/);
    assert.ok(!html.includes('https://cdn.'), 'Must not depend on external CDNs');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
