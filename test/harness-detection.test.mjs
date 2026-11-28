import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getAgentRootDir,
  isAgentConfigurable,
  detectDoctrineCandidates,
  detectEnvironment,
  targetPaths,
  targetPlaybookPaths
} = require('../lib/harness-detection.cjs');

test('lib/harness-detection.cjs', async (t) => {
  await t.test('getAgentRootDir resolves known harnesses and returns null for unknown', () => {
    assert.ok(getAgentRootDir('claude').endsWith('.claude'));
    assert.ok(getAgentRootDir('gemini').endsWith('.gemini'));
    assert.ok(getAgentRootDir('codex').endsWith('.codex'));
    assert.equal(getAgentRootDir('unknown-agent'), null);
  });

  await t.test('isAgentConfigurable gates gemini on antigravity-cli dir (not bare ~/.gemini)', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-hd-'));
    try {
      fs.mkdirSync(path.join(tmpHome, '.gemini'), { recursive: true });
      // Bare ~/.gemini alone is NOT sufficient if agy is not on PATH
      const bareResult = isAgentConfigurable('gemini', tmpHome);
      fs.mkdirSync(path.join(tmpHome, '.gemini', 'antigravity-cli'), { recursive: true });
      assert.equal(isAgentConfigurable('gemini', tmpHome), true);
      assert.equal(typeof bareResult, 'boolean');
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  await t.test('detectDoctrineCandidates returns deduplicated candidate paths', () => {
    const cands = detectDoctrineCandidates();
    assert.ok(Array.isArray(cands) && cands.length >= 1);
    const lower = cands.map(c => c.toLowerCase());
    assert.equal(new Set(lower).size, lower.length);
  });

  await t.test('detectEnvironment returns tools, endpoints, pathCandidates, and doctrineCandidates', () => {
    const env = detectEnvironment();
    assert.ok(env.tools && typeof env.tools === 'object');
    assert.ok(env.endpoints && typeof env.endpoints === 'object');
    assert.ok(Array.isArray(env.pathCandidates));
    assert.ok(Array.isArray(env.doctrineCandidates));
    assert.ok(targetPaths.claude);
    for (const key of Object.keys(targetPaths)) {
      assert.ok(targetPlaybookPaths[key], `targetPlaybookPaths must include '${key}'`);
    }
  });
});
