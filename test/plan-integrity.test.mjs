import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('Canonical Plan, Orchestrator, Reviewer & Doctrine Integrity', async (t) => {
  await t.test('agents/orchestrator.md lists all canonical agent personas and injection rule', () => {
    const agentFiles = fs.readdirSync(path.join(ROOT, 'agents'))
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace(/\.md$/, ''));
    const orch = fs.readFileSync(path.join(ROOT, 'agents', 'orchestrator.md'), 'utf8');

    assert.match(orch, /Persona & Skill Injection Rule/i);
    for (const persona of agentFiles) {
      assert.ok(orch.includes(`\`${persona}\``), `orchestrator.md must list persona '${persona}'`);
    }
  });

  await t.test('playbooks/05-canonical-plan-template.md enforces Persona & Required Skills columns and Goldfish gate', () => {
    const tpl = fs.readFileSync(path.join(ROOT, 'playbooks', '05-canonical-plan-template.md'), 'utf8');
    assert.match(tpl, /Heimdall Agent Persona/);
    assert.match(tpl, /Required Skills \(`SKILL\.md`\)/);
    assert.match(tpl, /agents\/reviewer\.md/);
    assert.match(tpl, /agents\/security-auditor\.md/);
  });

  await t.test('agents/reviewer.md and doctrine/AGENTS.md enforce Persona & Skill compliance', () => {
    const rev = fs.readFileSync(path.join(ROOT, 'agents', 'reviewer.md'), 'utf8');
    const doc = fs.readFileSync(path.join(ROOT, 'doctrine', 'AGENTS.md'), 'utf8');
    assert.match(rev, /Persona & Skill Compliance Gate/);
    assert.match(doc, /PERSONA & SKILL INJECTION/);
    assert.match(doc, /Heimdall Agent Persona/);
  });
});
