import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const hookScript = path.resolve('hooks/heimdall-hook.cjs');

describe('Runtime Lifecycle Sentinel Hook', () => {
  test('accumulates payload and issues context warning when approaching threshold', () => {
    // Generate a payload with ~800,000 characters (~200,000 tokens)
    // to trigger the 75% threshold of a 256K window or 75% warning
    const largeContent = 'a'.repeat(800000);
    const payload = JSON.stringify({
      tool_input: {
        command: 'echo test',
        content: largeContent
      }
    });

    const res = spawnSync(process.execPath, [hookScript, 'pre-bash'], {
      input: payload,
      encoding: 'utf8',
      env: {
        ...process.env,
        HEIMDALL_ACTIVE_CONTEXT_LIMIT: '256000'
      }
    });

    assert.equal(res.status, 0);
    assert.match(res.stderr, /\[Heimdall Context Sentinel\]/);
  });

  test('pre-compact event reminds preservation invariants and resets tracking', () => {
    const res = spawnSync(process.execPath, [hookScript, 'pre-compact'], {
      input: JSON.stringify({}),
      encoding: 'utf8'
    });

    assert.equal(res.status, 0);
    assert.match(res.stderr, /\[Heimdall Lifecycle Sentinel\] Context compaction occurring/);
  });

  test('pre-write exempts .html/.svg canvas prototypes and OpenDesign data-od-id from 800-line warning while warning on code files', () => {
    const longHtml = '<div>' + '\nline'.repeat(850) + '</div>';
    const htmlPayload = JSON.stringify({
      tool_input: {
        file_path: 'prototype.html',
        content: longHtml
      }
    });

    const resHtml = spawnSync(process.execPath, [hookScript, 'pre-write'], {
      input: htmlPayload,
      encoding: 'utf8'
    });
    assert.equal(resHtml.status, 0);
    assert.doesNotMatch(resHtml.stderr, /\[Heimdall Karpathy Sentinel\] Advisory/);

    const longTs = 'const a = 1;' + '\nconst b = 2;'.repeat(850);
    const tsPayload = JSON.stringify({
      tool_input: {
        file_path: 'src/component.ts',
        content: longTs
      }
    });

    const resTs = spawnSync(process.execPath, [hookScript, 'pre-write'], {
      input: tsPayload,
      encoding: 'utf8'
    });
    assert.equal(resTs.status, 0);
    assert.match(resTs.stderr, /\[Heimdall Karpathy Sentinel\] Advisory: File 'src\/component.ts' exceeds 800 lines/);

    // post-write should exempt canvas prototypes from TDD reminder
    const resPostHtml = spawnSync(process.execPath, [hookScript, 'post-write'], {
      input: htmlPayload,
      encoding: 'utf8'
    });
    assert.equal(resPostHtml.status, 0);
    assert.doesNotMatch(resPostHtml.stderr, /\[Heimdall Verification Sentinel\]/);
  });
});
