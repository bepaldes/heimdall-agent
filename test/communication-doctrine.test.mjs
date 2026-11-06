import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Communication Doctrine (BLUF & STE) Invariants', async (t) => {
  await t.test('skill file exists and contains valid frontmatter & core doctrine sections', () => {
    const skillPath = path.join(rootDir, 'skills', 'communication-doctrine', 'SKILL.md');
    assert.equal(fs.existsSync(skillPath), true, 'SKILL.md should exist');
    const content = fs.readFileSync(skillPath, 'utf8');

    assert.ok(content.startsWith('---'), 'Should start with YAML frontmatter delimiter');
    assert.ok(content.includes('name: communication-doctrine'), 'Should declare skill name');
    assert.ok(content.includes('Bottom Line Up Front (BLUF)'), 'Should define BLUF section');
    assert.ok(content.includes('Simplified Technical English (STE)'), 'Should define STE section');
    assert.ok(content.includes('Banned Ambiguous Qualifiers'), 'Should define banned qualifiers');
    assert.ok(content.includes('ensure'), 'Should list "ensure" in banned table');
    assert.ok(content.includes('properly'), 'Should list "properly" in banned table');
  });

  await t.test('config/skills.json registers communication-doctrine and matches module count', () => {
    const configPath = path.join(rootDir, 'config', 'skills.json');
    assert.equal(fs.existsSync(configPath), true, 'skills.json should exist');
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    assert.ok(data.suites['communication-doctrine'], 'Should be listed in suites');
    assert.ok(data.skills['communication-doctrine'], 'Should be listed in skills');
    assert.equal(data.skills['communication-doctrine'].category, 'Communication & Planning');
    assert.equal(data.totalModules, Object.keys(data.skills).length, 'totalModules should match total skills');
  });

  await t.test('doctrine/AGENTS.md enforces BLUF & STE across core discipline and subagent contracts', () => {
    const doctrinePath = path.join(rootDir, 'doctrine', 'AGENTS.md');
    const content = fs.readFileSync(doctrinePath, 'utf8');

    assert.ok(content.includes('COMMUNICATION DISCIPLINE (BLUF & STE)'), 'Should define communication discipline');
    assert.ok(content.includes('mandatory 3-line BLUF header'), 'Subagent execution contract must enforce 3-line BLUF header');
  });

  await t.test('playbooks/05-canonical-plan-template.md enforces communication-doctrine and STE step granularity', () => {
    const playbookPath = path.join(rootDir, 'playbooks', '05-canonical-plan-template.md');
    const content = fs.readFileSync(playbookPath, 'utf8');

    assert.ok(content.includes('communication-doctrine'), 'Plan checklist must include communication-doctrine');
    assert.ok(content.includes('Strict STE Step Granularity'), 'Must mandate STE step granularity');
  });

  await t.test('agents/reviewer.md enforces BLUF Review Verdict and references communication-doctrine', () => {
    const reviewerPath = path.join(rootDir, 'agents', 'reviewer.md');
    const content = fs.readFileSync(reviewerPath, 'utf8');

    assert.ok(content.includes('communication-doctrine'), 'Reviewer skills must include communication-doctrine');
    assert.ok(content.includes('BLUF Verdict Standard'), 'Reviewer persona must include BLUF Verdict Standard');
    assert.ok(content.includes('Review Verdict: APPROVED | BLOCKED | REVISION_NEEDED'), 'Step 6 must format Review Verdict');
  });

  await t.test('README.md and README.pt-BR.md accurately reflect canonical skills and suites', () => {
    const skillsConfigPath = path.join(rootDir, 'config', 'skills.json');
    const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
    const skillCount = Object.keys(catalog.skills || {}).length;
    const suiteCount = Object.keys(catalog.suites || {}).length;

    const readmeEn = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
    const readmePt = fs.readFileSync(path.join(rootDir, 'README.pt-BR.md'), 'utf8');
    const docsSkills = fs.readFileSync(path.join(rootDir, 'docs', 'SKILLS.md'), 'utf8');

    assert.ok(readmeEn.includes(`${skillCount} modular skills`), `README.md must specify ${skillCount} modular skills`);
    assert.ok(readmeEn.includes(`${skillCount} Modules Across ${suiteCount} Toolkits`), `README.md heading must specify ${skillCount} Modules Across ${suiteCount} Toolkits`);
    assert.ok(readmeEn.includes('communication-doctrine'), 'README.md must list communication-doctrine');

    assert.ok(readmePt.includes(`${skillCount} skills modulares`), `README.pt-BR.md must specify ${skillCount} skills modulares`);
    assert.ok(readmePt.includes(`${skillCount} Módulos em ${suiteCount} Toolkits`), `README.pt-BR.md heading must specify ${skillCount} Módulos em ${suiteCount} Toolkits`);
    assert.ok(readmePt.includes('communication-doctrine'), 'README.pt-BR.md must list communication-doctrine');

    assert.ok(docsSkills.includes(`${suiteCount} Primary Toolkits & Suites (${skillCount} modular capabilities)`), `docs/SKILLS.md must declare ${skillCount} modular capabilities`);
    assert.ok(docsSkills.includes('communication-doctrine'), 'docs/SKILLS.md must list communication-doctrine');
  });
});
