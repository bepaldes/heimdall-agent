'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { syncCatalogCounts } = require('./catalog-sync.cjs');

const UPDATE_PROTOCOL = 'Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report.';

function toTitle(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function appendBulletToLastDetails(filePath, line) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(line)) return;
  const idx = content.lastIndexOf('</details>');
  if (idx === -1) return;
  const updated = `${content.slice(0, idx).replace(/\s*$/, '')}\n${line}\n\n${content.slice(idx)}`;
  fs.writeFileSync(filePath, updated, 'utf8');
}

/**
 * Scaffolds a new Heimdall skill, updates catalog/profiles/docs, and converges counts.
 */
function createSkill(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const dryRun = Boolean(options.dryRun);
  const name = String(options.name || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid skill name '${name}'. Use lowercase kebab-case (e.g. my-skill).`);
  }

  const title = options.title || toTitle(name);
  const category = options.category || 'Collaboration & Process';
  const description = options.description || `Execute ${title} workflow.`;
  const skillDir = path.join(rootDir, 'skills', name);
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  if (fs.existsSync(skillMdPath) && !options.force) {
    throw new Error(`Skill '${name}' already exists at ${skillMdPath}`);
  }
  if (dryRun) {
    return { name, skillMdPath, category, profile: options.profile || 'full', dryRun: true };
  }

  fs.mkdirSync(skillDir, { recursive: true });
  const body = options.content || `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${title}\n\n${description}\n`;
  fs.writeFileSync(skillMdPath, body, 'utf8');

  const skillsConfigPath = path.join(rootDir, 'config', 'skills.json');
  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
  catalog.suites = catalog.suites || {};
  catalog.skills = catalog.skills || {};

  if (!catalog.suites[name]) {
    catalog.suites[name] = {
      name: title,
      type: 'Standalone Toolkit',
      upstream: 'https://github.com/bepaldes/heimdall-agent',
      modules: [name]
    };
  }

  catalog.skills[name] = {
    name,
    category,
    description,
    upstream: 'https://github.com/bepaldes/heimdall-agent',
    sourceRevision: 'local',
    integrationMode: 'native',
    updateProtocol: UPDATE_PROTOCOL
  };
  fs.writeFileSync(skillsConfigPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');

  const profileTier = options.profile ? String(options.profile).toLowerCase() : null;
  if (profileTier && profileTier !== 'full') {
    const profilesPath = path.join(rootDir, 'config', 'profiles.json');
    if (fs.existsSync(profilesPath)) {
      const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
      const tier = profiles.profiles && profiles.profiles[profileTier];
      if (tier && Array.isArray(tier.skills) && !tier.skills.includes(name)) {
        tier.skills.push(name);
        if (typeof tier.description === 'string') {
          tier.description = tier.description.replace(/\b\d+(-skill)\b/, `${tier.skills.length}$1`);
        }
        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2) + '\n', 'utf8');
      }
    }
  }

  appendBulletToLastDetails(path.join(rootDir, 'README.md'), `- **\`${name}\`**: ${description}`);
  appendBulletToLastDetails(path.join(rootDir, 'README.pt-BR.md'), `- **\`${name}\`**: ${description}`);

  const docsSkillsPath = path.join(rootDir, 'docs', 'SKILLS.md');
  if (fs.existsSync(docsSkillsPath)) {
    let docsContent = fs.readFileSync(docsSkillsPath, 'utf8');
    const linkLine = `- [⚡ ${title}](#${name})`;
    if (!docsContent.includes(`#${name})`)) {
      docsContent = docsContent.replace(/\r?\n---\r?\n\r?\n## Core Multi-Skill Suites/, `\n${linkLine}\n\n---\n\n## Core Multi-Skill Suites`);
    }
    if (!docsContent.includes(`<a id="${name}"></a>`)) {
      docsContent = `${docsContent.trimEnd()}\n\n<a id="${name}"></a>\n### ⚡ ${title}\n\n- **Category**: ${category}\n- **Description**: ${description}\n`;
    }
    fs.writeFileSync(docsSkillsPath, docsContent, 'utf8');
  }

  syncCatalogCounts(rootDir, false);
  return { name, skillMdPath, category, profile: profileTier || 'full', dryRun: false };
}

module.exports = { createSkill };
