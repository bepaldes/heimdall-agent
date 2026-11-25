import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { moveCursor, toggleSelection, selectOne, selectMany } = require('../lib/tui.cjs');

test('lib/tui.cjs', async (t) => {
  await t.test('moveCursor wraps around forward and backward', () => {
    assert.equal(moveCursor(0, -1, 3), 2);
    assert.equal(moveCursor(2, 1, 3), 0);
    assert.equal(moveCursor(1, 1, 3), 2);
    assert.equal(moveCursor(0, 1, 0), 0);
  });

  await t.test('toggleSelection adds and removes items cleanly', () => {
    const s = new Set(['claude']);
    toggleSelection(s, 'codex');
    assert.deepEqual(Array.from(s), ['claude', 'codex']);
    toggleSelection(s, 'claude');
    assert.deepEqual(Array.from(s), ['codex']);
  });

  await t.test('selectOne and selectMany fall back gracefully in non-TTY environments', async () => {
    const one = await selectOne('Pick one', [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }]);
    assert.equal(one, 'a');

    const many = await selectMany('Pick many', [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: false }
    ]);
    assert.deepEqual(many, ['a']);
  });
});
