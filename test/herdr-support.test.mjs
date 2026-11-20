import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SETUP_PATH = path.join(ROOT, 'setup.mjs');

test('Herdr-App CLI Support & Configuration', async (t) => {
  await t.test('--help lists herdr as a primary subcommand and in examples', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, '--help'], { encoding: 'utf8' });
    assert.match(out, /\bherdr\b.*Configure Herdr-App/i);
    assert.match(out, /heimdall herdr/i);
  });

  await t.test('herdr --dry-run completes cleanly without modifying state', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, 'herdr', '--dry-run'], { encoding: 'utf8' });
    assert.match(out, /=== Herdr-App Configuration & Clipboard Fix ===/i);
    assert.match(out, /\[DRY RUN\]/i);
  });

  await t.test('--herdr-fix alias is recognized', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, '--herdr-fix', '--dry-run'], { encoding: 'utf8' });
    assert.match(out, /=== Herdr-App Configuration & Clipboard Fix ===/i);
    assert.match(out, /\[DRY RUN\]/i);
  });

  await t.test('herdr command configures keys.json and settings.json with valid UTF-8 without BOM', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, 'herdr'], { encoding: 'utf8' });
    assert.match(out, /✔ Configured keys\.json/i);
    assert.match(out, /✔ Configured settings\.json/i);

    const herdrDir = path.join(os.homedir(), '.config', 'herdr-app');
    const keysPath = path.join(herdrDir, 'keys.json');
    const settingsPath = path.join(herdrDir, 'settings.json');

    assert.ok(fs.existsSync(keysPath), 'keys.json should exist');
    assert.ok(fs.existsSync(settingsPath), 'settings.json should exist');

    // Verify raw bytes do not start with UTF-8 BOM (\xEF\xBB\xBF)
    const keysBuf = fs.readFileSync(keysPath);
    assert.notDeepStrictEqual(keysBuf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'keys.json must not have UTF-8 BOM');

    const settingsBuf = fs.readFileSync(settingsPath);
    assert.notDeepStrictEqual(settingsBuf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'settings.json must not have UTF-8 BOM');

    // Parse contents
    const keys = JSON.parse(keysBuf.toString('utf8'));
    assert.equal(keys.terminal?.['ctrl-v'], 'terminal.paste');
    assert.equal(keys.terminal?.['alt-v'], 'terminal.paste_image');
    assert.equal(keys.terminal?.['ctrl-shift-v'], 'terminal.paste_image');
    assert.equal(keys.terminal?.['ctrl-c'], 'terminal.copy');
    assert.equal(keys.terminal?.['ctrl-shift-c'], 'terminal.copy');
    assert.ok(keys['layout:Herdr-Roundup'], 'Roundup keybindings must exist');

    const settings = JSON.parse(settingsBuf.toString('utf8'));
    assert.equal(settings.copy_on_select, true);
    assert.equal(settings.layout, 'Herdr-Roundup');
  });
});
