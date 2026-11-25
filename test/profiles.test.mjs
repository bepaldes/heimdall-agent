import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  addProfile,
  removeProfile,
  listProfiles,
  getProfileLaunchEnv,
  resolveProfileTargets,
  loadHeimdallState
} = require('../lib/profiles.cjs');

test('lib/profiles.cjs multi-account profile management', async (t) => {
  await t.test('addProfile, listProfiles, and removeProfile manage claude, codex, and agy profiles', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-prof-'));
    try {
      fs.writeFileSync(path.join(tmpHome, '.gitconfig'), '[user]\nname = Test\n');
      fs.mkdirSync(path.join(tmpHome, '.ssh'));

      const c = addProfile('claude/work', { homeDir: tmpHome });
      const x = addProfile('codex/client', { dir: path.join(tmpHome, 'custom-codex'), homeDir: tmpHome });
      const a = addProfile('agy/personal', { homeDir: tmpHome });

      assert.equal(c.managed, true);
      assert.equal(x.managed, false);
      assert.ok(fs.existsSync(path.join(a.dir, '.gemini', 'antigravity-cli')));
      assert.ok(fs.existsSync(path.join(a.dir, '.gitconfig')));
      assert.ok(fs.existsSync(path.join(a.dir, '.ssh')));

      const all = listProfiles(tmpHome);
      assert.equal(all.length, 3);
      assert.deepEqual(all.map(p => p.id), ['agy/personal', 'claude/work', 'codex/client']);

      assert.equal(removeProfile('codex/client', { homeDir: tmpHome }), true);
      assert.equal(removeProfile('codex/client', { homeDir: tmpHome }), false);
      assert.equal(listProfiles(tmpHome).length, 2);
      assert.equal(Object.keys(loadHeimdallState(tmpHome).profiles).length, 2);
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  await t.test('getProfileLaunchEnv returns OS-appropriate isolation env vars', () => {
    assert.deepEqual(getProfileLaunchEnv({ tool: 'claude', dir: '/tmp/c' }, 'darwin'), { CLAUDE_CONFIG_DIR: '/tmp/c' });
    assert.deepEqual(getProfileLaunchEnv({ tool: 'codex', dir: '/tmp/x' }, 'linux'), { CODEX_HOME: '/tmp/x' });
    assert.deepEqual(getProfileLaunchEnv({ tool: 'agy', dir: '/tmp/a' }, 'darwin'), { HOME: '/tmp/a' });
    assert.deepEqual(getProfileLaunchEnv({ tool: 'agy', dir: 'C:\\a' }, 'win32'), { USERPROFILE: 'C:\\a', HOME: 'C:\\a' });
  });

  await t.test('resolveProfileTargets maps skills, agents, and doctrine paths for each tool', () => {
    const agyTargets = resolveProfileTargets({ id: 'agy/work', tool: 'agy', dir: '/p/agy' });
    assert.equal(agyTargets.skillsDir, path.join('/p/agy', '.gemini', 'skills'));
    assert.equal(agyTargets.doctrineFile, path.join('/p/agy', '.gemini', 'GEMINI.md'));

    const claudeTargets = resolveProfileTargets({ id: 'claude/work', tool: 'claude', dir: '/p/claude' });
    assert.equal(claudeTargets.hooksDir, path.join('/p/claude', 'hooks'));
    assert.equal(claudeTargets.doctrineFile, path.join('/p/claude', 'CLAUDE.md'));
  });
});
