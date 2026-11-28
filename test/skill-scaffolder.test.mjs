import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createSkill } = require('../lib/skill-scaffolder.cjs');
const { syncCatalogCounts } = require('../lib/catalog-sync.cjs');

test('createSkill scaffolds SKILL.md, registers catalog/profiles/docs, and converges counts', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-scaffold-'));
  try {
    const repoRoot = path.resolve('.');
    fs.mkdirSync(path.join(tmp, 'config'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(tmp, 'agents'), { recursive: true });

    fs.copyFileSync(path.join(repoRoot, 'config', 'skills.json'), path.join(tmp, 'config', 'skills.json'));
    fs.copyFileSync(path.join(repoRoot, 'config', 'profiles.json'), path.join(tmp, 'config', 'profiles.json'));
    fs.copyFileSync(path.join(repoRoot, 'docs', 'SKILLS.md'), path.join(tmp, 'docs', 'SKILLS.md'));
    fs.copyFileSync(path.join(repoRoot, 'README.md'), path.join(tmp, 'README.md'));
    fs.copyFileSync(path.join(repoRoot, 'README.pt-BR.md'), path.join(tmp, 'README.pt-BR.md'));

    const res = createSkill({
      rootDir: tmp,
      name: 'demo-audit',
      title: 'Demo Audit',
      category: 'Collaboration & Process',
      description: 'Run a demo audit.',
      profile: 'minimal'
    });

    assert.equal(res.name, 'demo-audit');
    assert.equal(fs.existsSync(path.join(tmp, 'skills', 'demo-audit', 'SKILL.md')), true);

    const catalog = JSON.parse(fs.readFileSync(path.join(tmp, 'config', 'skills.json'), 'utf8'));
    assert.ok(catalog.skills['demo-audit']);
    assert.ok(catalog.suites['demo-audit']);

    const profiles = JSON.parse(fs.readFileSync(path.join(tmp, 'config', 'profiles.json'), 'utf8'));
    assert.ok(profiles.profiles.minimal.skills.includes('demo-audit'));

    const readme = fs.readFileSync(path.join(tmp, 'README.md'), 'utf8');
    assert.match(readme, /\*\*`demo-audit`\*\*/);

    const syncRes = syncCatalogCounts(tmp, true);
    assert.equal(syncRes.modified, false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
