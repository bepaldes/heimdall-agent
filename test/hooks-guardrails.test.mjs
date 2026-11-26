import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOK_SCRIPT = path.resolve(__dirname, '..', 'hooks', 'heimdall-hook.cjs');

function runPreBash(command) {
  return spawnSync(process.execPath, [HOOK_SCRIPT, 'pre-bash'], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: 'utf8'
  });
}

test('hooks/heimdall-hook.cjs pre-bash guardrails', async (t) => {
  const blockedVectors = [
    'node node_modules/.bin/vite',
    '/bin/rm -rf /',
    'rm -r -f ~',
    'npx --yes vite',
    'PORT=3000 vite',
    'npm run dev',
    'pnpm start',
    'python3 manage.py runserver',
    'rmdir /s /q C:\\'
  ];

  for (const cmd of blockedVectors) {
    await t.test(`blocks bypass vector: ${cmd}`, () => {
      const res = runPreBash(cmd);
      assert.equal(res.status, 2, `Expected exit 2 for "${cmd}", got ${res.status} (stderr: ${res.stderr})`);
      assert.match(res.stderr, /BLOCKED/i);
    });
  }

  const safeCommands = [
    'npm test',
    'node setup.mjs --help',
    'rm -rf ./dist/build',
    'git status'
  ];

  for (const cmd of safeCommands) {
    await t.test(`allows safe command: ${cmd}`, () => {
      const res = runPreBash(cmd);
      assert.equal(res.status, 0, `Expected exit 0 for "${cmd}", got ${res.status} (stderr: ${res.stderr})`);
    });
  }

  await t.test('user-prompt injects Heimdall Plan Gate on /plan prompts', () => {
    const res = spawnSync(process.execPath, [HOOK_SCRIPT, 'user-prompt'], {
      input: JSON.stringify({ prompt: '/plan add billing' }),
      encoding: 'utf8'
    });
    assert.equal(res.status, 0);
    assert.match(res.stdout, /\[Heimdall Plan Gate\]/);
  });

  await t.test('pre-write warns when docs/designs/*.md omits Persona or Required Skills columns', () => {
    const res = spawnSync(process.execPath, [HOOK_SCRIPT, 'pre-write'], {
      input: JSON.stringify({ tool_input: { file_path: 'docs/designs/2026-11-25 test.md', content: '# Plan\nNo columns' } }),
      encoding: 'utf8'
    });
    assert.equal(res.status, 0);
    assert.match(res.stderr, /\[Heimdall Plan Sentinel\]/);
  });
});
