import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectPathCandidates } from '../lib/path-discovery.cjs';

describe('Cross-Agent Bridge Tools PATH Candidate Discovery', () => {
  test('excludes Program Files, JDK, Git, and IDE runtime bin directories and prioritizes user tools directory', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-path-test-'));
    const jdkBin = path.join(tmpRoot, 'Program Files', 'Microsoft', 'jdk-17.0.20.101-hotspot', 'bin');
    const agyCliBin = path.join(tmpRoot, '.gemini', 'antigravity-cli', 'bin');
    const localBin = path.join(tmpRoot, '.local', 'bin');
    const appsTools = path.join(tmpRoot, 'Apps', 'tools');

    fs.mkdirSync(jdkBin, { recursive: true });
    fs.mkdirSync(agyCliBin, { recursive: true });
    fs.mkdirSync(localBin, { recursive: true });
    fs.mkdirSync(appsTools, { recursive: true });

    // Place a bridge script in Apps/tools
    fs.writeFileSync(path.join(appsTools, 'claude-bridge.ps1'), '# bridge', 'utf8');

    const fakePath = [jdkBin, agyCliBin, localBin, appsTools].join(path.delimiter);
    const candidates = detectPathCandidates(fakePath, tmpRoot);

    assert.ok(!candidates.includes(jdkBin), 'Must exclude JDK Program Files bin');
    assert.ok(!candidates.includes(agyCliBin), 'Must exclude antigravity-cli internal bin');
    assert.equal(candidates[0], appsTools, 'Must prioritize tools directory with active bridge scripts first');
    assert.ok(candidates.includes(localBin), 'Should still include valid user .local/bin as secondary candidate');

    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
