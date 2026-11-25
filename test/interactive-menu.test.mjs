import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getCanonicalSkillCount,
  runHudInteractive,
  runPostInstallMenu,
  runInteractive,
  runListSkills,
  runUpdateSkill
} = require('../lib/interactive-menu.cjs');

test('lib/interactive-menu.cjs', async (t) => {
  await t.test('exports all interactive menu handlers', () => {
    assert.equal(typeof runHudInteractive, 'function');
    assert.equal(typeof runPostInstallMenu, 'function');
    assert.equal(typeof runInteractive, 'function');
    assert.equal(typeof runListSkills, 'function');
    assert.equal(typeof runUpdateSkill, 'function');
  });

  await t.test('getCanonicalSkillCount dynamically resolves positive skill count from skills.json', () => {
    const count = getCanonicalSkillCount();
    assert.equal(typeof count, 'number');
    assert.ok(count >= 69);
  });
});
