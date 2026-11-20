import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SETUP_PATH = path.join(ROOT, 'setup.mjs');

test('VS Code (Copilot) Support', async (t) => {
  await t.test('--help lists vscode as a supported --agents target', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, '--help'], { encoding: 'utf8' });
    assert.match(out, /--agents <targets>.*vscode/i);
  });

  await t.test('--audit includes VSCODE target row', () => {
    const raw = execFileSync(process.execPath, [SETUP_PATH, '--audit'], { encoding: 'utf8' });
    const out = raw.replace(/\x1b\[[0-9;]*m/g, '');
    assert.match(out, /\bVSCODE\b/);
    assert.match(out, /VS Code \(Copilot\)/);
  });

  await t.test('--agents vscode --dry-run -y completes without error', () => {
    const out = execFileSync(
      process.execPath,
      [SETUP_PATH, '--agents', 'vscode', '--dry-run', '-y'],
      { encoding: 'utf8' }
    );
    assert.match(out, /Targets:\s+vscode/);
  });
});
