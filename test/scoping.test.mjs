import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveSelectedAgents } = require('../lib/harness-detection.cjs');
const { syncHerdrPrograms } = require('../lib/herdr-programs.cjs');
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Strict Harness Scoping & Herdr Profile Registration', async (t) => {
  await t.test('resolveSelectedAgents prefers explicit options.agents, then savedState.agents, else all', () => {
    assert.deepEqual(resolveSelectedAgents({ agents: ['codex'] }, { agents: ['claude'] }), ['codex']);
    assert.deepEqual(resolveSelectedAgents({}, { agents: ['claude', 'gemini'] }), ['claude', 'gemini']);
    assert.deepEqual(resolveSelectedAgents({}, {}), ['all']);
  });

  await t.test('syncHerdrPrograms registers multi-account profiles with isolated env vars', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-prof-reg-'));
    try {
      const catalog = { ghostcli: [{ id: 'tencent/Hy4-preview', displayName: 'Hunyuan 4' }] };
      const profiles = [
        { id: 'claude/work', tool: 'claude', name: 'work', dir: '/tmp/claude-work' },
        { id: 'codex/client', tool: 'codex', name: 'client', dir: '/tmp/codex-client' },
        { id: 'agy/personal', tool: 'agy', name: 'personal', dir: '/tmp/agy-personal' }
      ];
      const res = syncHerdrPrograms(tmpDir, catalog, { claudeInstalled: true, profiles });
      assert.equal(res.updated, true);

      const parsed = JSON.parse(fs.readFileSync(path.join(tmpDir, 'programs.json'), 'utf8'));
      assert.equal(parsed.programs['profile-claude-work'].env.CLAUDE_CONFIG_DIR, '/tmp/claude-work');
      assert.equal(parsed.programs['profile-codex-client'].env.CODEX_HOME, '/tmp/codex-client');
      assert.equal(parsed.programs['profile-agy-personal'].env.HOME, '/tmp/agy-personal');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
