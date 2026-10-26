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
});
