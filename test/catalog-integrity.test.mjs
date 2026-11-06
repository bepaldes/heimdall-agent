import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCatalogCounts } from '../lib/catalog-sync.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Catalog and Documentation Count Integrity Sentinel', async (t) => {
  const skillsConfigPath = path.join(rootDir, 'config', 'skills.json');
  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));

  const skillCount = Object.keys(catalog.skills || {}).length;
  const suiteCount = Object.keys(catalog.suites || {}).length;
  const standaloneCount = suiteCount - 5;

  await t.test('config/skills.json internal counts match actual keys', () => {
    assert.equal(catalog.totalModules, skillCount, 'totalModules should match skills count');
    assert.equal(catalog.totalSuites, suiteCount, 'totalSuites should match suites count');
  });

  await t.test('all skills listed in config/skills.json exist on disk with valid SKILL.md', () => {
    for (const skillName of Object.keys(catalog.skills)) {
      const skillFile = path.join(rootDir, 'skills', skillName, 'SKILL.md');
      assert.equal(fs.existsSync(skillFile), true, `Missing SKILL.md for skill: ${skillName}`);
    }
  });

  await t.test('filesystem skills/ directory matches catalog skills count', () => {
    const skillsDir = path.join(rootDir, 'skills');
    const diskSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(skillsDir, d.name, 'SKILL.md')))
      .map(d => d.name);

    assert.equal(diskSkills.length, skillCount, `On-disk skill directories (${diskSkills.length}) do not match catalog count (${skillCount})`);
  });

  await t.test('config/profiles.json full description matches canonical skill count', () => {
    const profilesPath = path.join(rootDir, 'config', 'profiles.json');
    const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    const expected = `Complete ${skillCount}-skill suite & 9 predefined agents: Process, Anti-Slop, Design, Security, Hygiene, and Cross-Agent Bridges.`;
    assert.equal(profiles.profiles.full.description, expected);
  });

  await t.test('docs/SKILLS.md reflects exact dynamic suite and skill counts', () => {
    const docsSkills = fs.readFileSync(path.join(rootDir, 'docs', 'SKILLS.md'), 'utf8');
    assert.ok(
      docsSkills.includes(`${suiteCount} Primary Toolkits & Suites (${skillCount} modular capabilities)`),
      `docs/SKILLS.md does not match ${suiteCount} suites / ${skillCount} modules`
    );
  });

  await t.test('README.md reflects exact dynamic suite and skill counts with zero stale values', () => {
    const readme = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');

    assert.ok(readme.includes(`skills-${suiteCount}%20toolkits%20%28${skillCount}%20modules%29`), 'Badge URL mismatch');
    assert.ok(readme.includes(`Skills: ${suiteCount} Toolkits (${skillCount} Modules)`), 'Badge alt mismatch');
    assert.ok(readme.includes(`**${skillCount} modular skills**`), 'Summary text mismatch');
    assert.ok(readme.includes(`* **Modular Skills**: ${skillCount} task-activated capabilities`), 'Feature list mismatch');
    assert.ok(readme.includes(`### Skill Inventory (${skillCount} Modules Across ${suiteCount} Toolkits)`), 'Inventory heading mismatch');
    assert.ok(readme.includes(`#### Standalone Toolkits (${standaloneCount} Curated Toolkits / ${standaloneCount} Modules)`), 'Standalone heading mismatch');

    // Anti-drift check: ensure stale N-1 or N+1 counts do NOT appear
    assert.doesNotMatch(readme, new RegExp(`\\b${skillCount - 1}\\b\\s+(modules|skills)`, 'i'), 'README contains stale lower count');
    assert.doesNotMatch(readme, new RegExp(`\\b${skillCount + 1}\\b\\s+(modules|skills)`, 'i'), 'README contains premature higher count');
  });

  await t.test('README.pt-BR.md reflects exact dynamic suite and skill counts with zero stale values', () => {
    const readmePt = fs.readFileSync(path.join(rootDir, 'README.pt-BR.md'), 'utf8');

    assert.ok(readmePt.includes(`skills-${suiteCount}%20toolkits%20%28${skillCount}%20m%C3%B3dulos%29`), 'Badge URL mismatch');
    assert.ok(readmePt.includes(`Skills: ${suiteCount} Toolkits (${skillCount} Módulos)`), 'Badge alt mismatch');
    assert.ok(readmePt.includes(`**${skillCount} skills modulares**`), 'Summary text mismatch');
    assert.ok(readmePt.includes(`* **Skills Modulares**: ${skillCount} capacidades`), 'Feature list mismatch');
    assert.ok(readmePt.includes(`### Inventário de Skills (${skillCount} Módulos em ${suiteCount} Toolkits)`), 'Inventory heading mismatch');
    assert.ok(readmePt.includes(`#### Toolkits Independentes (${standaloneCount} Toolkits Curados / ${standaloneCount} Módulos)`), 'Standalone heading mismatch');

    // Anti-drift check
    assert.doesNotMatch(readmePt, new RegExp(`\\b${skillCount - 1}\\b\\s+(módulos|skills)`, 'i'), 'README.pt-BR contains stale lower count');
    assert.doesNotMatch(readmePt, new RegExp(`\\b${skillCount + 1}\\b\\s+(módulos|skills)`, 'i'), 'README.pt-BR contains premature higher count');
  });

  await t.test('syncCatalogCounts reports zero pending modifications (fully converged)', () => {
    const result = syncCatalogCounts(rootDir, true);
    assert.ok(result, 'syncCatalogCounts should succeed');
    assert.equal(result.modified, false, 'Workspace should already be fully converged with zero pending count diffs');
  });
});
