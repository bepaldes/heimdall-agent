import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { syncCatalogCounts } = require('../lib/catalog-sync.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

test('lib/catalog-sync.cjs', async (t) => {
  await t.test('syncCatalogCounts returns suiteCount and skillCount and is converged on repo', () => {
    const res = syncCatalogCounts(ROOT_DIR, true);
    assert.ok(res);
    assert.ok(res.suiteCount > 0);
    assert.ok(res.skillCount > 0);
    assert.equal(res.modified, false);
  });
});
