import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { syncHerdrPrograms } = require('../lib/herdr-programs.cjs');

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
    assert.equal(keys.terminal?.['ctrl-shift-v'], 'send:\u001bv');
    assert.equal(keys.terminal?.['alt-v'], undefined);
    assert.equal(keys.terminal?.['ctrl-c'], 'terminal.copy');
    assert.equal(keys.terminal?.['ctrl-shift-c'], 'terminal.copy');
    assert.ok(keys['layout:Herdr-Roundup'], 'Roundup keybindings must exist');

    const settings = JSON.parse(settingsBuf.toString('utf8'));
    assert.equal(settings.copy_on_select, true);
    assert.equal(settings.layout, 'Herdr-Roundup');
  });

  await t.test('syncHerdrPrograms registers non-native proxy models, preserves manual entries, and writes without BOM', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-programs-test-'));
    try {
      const programsPath = path.join(tmpDir, 'programs.json');
      const errorPath = path.join(tmpDir, 'programs.error');

      // Seed with BOM, manual entries, and an existing claude --model entry with a custom key
      const initial = {
        programs: {
          'my-custom-tool': { name: 'My Tool', run: ['mytool'] },
          'glm-5-3': { name: 'GLM 5.3', icon: 'icons/claude.svg', run: ['claude', '--model', 'z-ai/glm-5.3'] },
          'hunyuan-hy4': { name: 'Old Hunyuan', icon: 'icons/claude.svg', run: ['claude', '--model', 'tencent/Hy4-preview'] }
        },
        shells: ['pwsh']
      };
      fs.writeFileSync(programsPath, '\uFEFF' + JSON.stringify(initial, null, 2), 'utf8');
      fs.writeFileSync(errorPath, 'stale error', 'utf8');

      const catalog = {
        ghostcli: [
          { id: 'claude-fable-5.2', displayName: 'Claude Fable 5.2' },
          { id: 'gpt-6-astra', displayName: 'GPT-6 Astra' },
          { id: 'gemini-4-hydrogen-high', displayName: 'Gemini 4 Hydrogen' },
          { id: 'z-ai/glm-5.3', displayName: 'GLM 5.3' },
          { id: 'tencent/Hy4-preview', displayName: 'Hunyuan Hy4 Preview' },
          { id: 'deepseek-ai/DeepSeek-V4.1-Flash-1017', displayName: 'DeepSeek V4.1 Flash' },
          { id: 'XiaomiMiMo/MiMo-V2.6-Pro', displayName: 'MiMo V2.6 Pro' }
        ]
      };

      const res = syncHerdrPrograms(tmpDir, catalog, { claudeInstalled: true });
      assert.equal(res.updated, true);
      assert.equal(res.count, 3);
      assert.equal(fs.existsSync(errorPath), false, 'programs.error should be cleared');

      const buf = fs.readFileSync(programsPath);
      assert.notDeepStrictEqual(buf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'programs.json must not have UTF-8 BOM');

      const parsed = JSON.parse(buf.toString('utf8'));
      assert.deepEqual(parsed.shells, ['pwsh']);
      assert.deepEqual(parsed.programs['my-custom-tool'], { name: 'My Tool', run: ['mytool'] });
      assert.equal(parsed.programs['glm-5-3'], undefined, 'GLM entries should be removed/excluded');
      // Updated in place under existing key without creating a duplicate key
      assert.deepEqual(parsed.programs['hunyuan-hy4'], {
        name: 'Hunyuan Hy4 Preview',
        icon: 'icons/claude.svg',
        run: ['claude', '--model', 'tencent/Hy4-preview']
      });
      assert.equal(parsed.programs['hunyuan-hy4-preview'], undefined);
      assert.equal(parsed.programs['claude-fable-5-2'], undefined);
      assert.equal(parsed.programs['gpt-6-astra'], undefined);
      assert.equal(parsed.programs['gemini-4-hydrogen'], undefined);

      // Skips when claude is not installed
      const skipped = syncHerdrPrograms(tmpDir, catalog, { claudeInstalled: false });
      assert.equal(skipped.updated, false);
      assert.equal(skipped.count, 0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
