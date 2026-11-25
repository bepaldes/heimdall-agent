import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  cleanTargetDirectory,
  copyDirectory,
  isHeimdallInstalled,
  deduplicateModelsByMaxContext,
  syncHerdrAutoResumeMod
} = require('../lib/installer-engine.cjs');

test('lib/installer-engine.cjs', async (t) => {
  await t.test('cleanTargetDirectory preserves .system and removes other entries', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-clean-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.system'));
      fs.mkdirSync(path.join(tmpDir, 'old-skill'));
      fs.writeFileSync(path.join(tmpDir, 'old-file.txt'), 'hi');

      assert.equal(cleanTargetDirectory(tmpDir, true), 2);
      assert.ok(fs.existsSync(path.join(tmpDir, 'old-skill')));

      assert.equal(cleanTargetDirectory(tmpDir, false), 2);
      assert.ok(fs.existsSync(path.join(tmpDir, '.system')));
      assert.ok(!fs.existsSync(path.join(tmpDir, 'old-skill')));
      assert.ok(!fs.existsSync(path.join(tmpDir, 'old-file.txt')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('copyDirectory recursively copies files and counts them', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-copy-'));
    try {
      const src = path.join(tmpRoot, 'src');
      const dest = path.join(tmpRoot, 'dest');
      fs.mkdirSync(path.join(src, 'nested'), { recursive: true });
      fs.writeFileSync(path.join(src, 'a.txt'), '1');
      fs.writeFileSync(path.join(src, 'nested', 'b.txt'), '2');

      assert.equal(copyDirectory(src, dest, true), 2);
      assert.ok(!fs.existsSync(dest));

      assert.equal(copyDirectory(src, dest, false), 2);
      assert.equal(fs.readFileSync(path.join(dest, 'nested', 'b.txt'), 'utf8'), '2');
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  await t.test('isHeimdallInstalled detects installed skills in custom targetPaths', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-inst-'));
    try {
      assert.equal(isHeimdallInstalled({ claude: tmpDir }).installed, false);
      fs.mkdirSync(path.join(tmpDir, 'brainstorming'));
      const res = isHeimdallInstalled({ claude: tmpDir });
      assert.equal(res.installed, true);
      assert.deepEqual(res.targets, ['claude']);
      assert.equal(res.totalSkills, 1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('deduplicateModelsByMaxContext merges [1m] variants and keeps highest context', () => {
    const models = deduplicateModelsByMaxContext([
      { id: 'claude-opus-4-6', context_window: 200000, description: 'Base' },
      { id: 'claude-opus-4-6[1m]', context_window: 1000000, description: '1M variant' }
    ]);
    assert.equal(models.length, 1);
    assert.equal(models[0].id, 'claude-opus-4-6');
    assert.equal(models[0].context_window_tokens, 1000000);
    assert.equal(models[0].description, 'Base');
  });

  await t.test('syncHerdrAutoResumeMod copies mod.json and main.js into herdrDir/mods', () => {
    const tmpHerdr = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-mod-'));
    try {
      const ok = syncHerdrAutoResumeMod(tmpHerdr);
      assert.equal(ok, true);
      assert.ok(fs.existsSync(path.join(tmpHerdr, 'mods', 'heimdall-auto-resume', 'mod.json')));
      assert.ok(fs.existsSync(path.join(tmpHerdr, 'mods', 'heimdall-auto-resume', 'main.js')));
    } finally {
      fs.rmSync(tmpHerdr, { recursive: true, force: true });
    }
  });
});
