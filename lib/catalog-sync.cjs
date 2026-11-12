'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Synchronizes skill and suite count references across all repository files:
 * config/skills.json, config/profiles.json, docs/SKILLS.md, README.md,
 * README.pt-BR.md, and setup.mjs.
 *
 * Single Source of Truth: The actual count of entries in config/skills.json ("skills" and "suites").
 *
 * @param {string} rootDir Repository root directory
 * @param {boolean} dryRun If true, computes changes without writing to disk
 * @returns {{ skillCount: number, suiteCount: number, modified: boolean }}
 */
function syncCatalogCounts(rootDir, dryRun = false) {
  const skillsConfigPath = path.join(rootDir, 'config', 'skills.json');
  if (!fs.existsSync(skillsConfigPath)) return null;

  try {
    const rawCatalog = fs.readFileSync(skillsConfigPath, 'utf8');
    const catalog = JSON.parse(rawCatalog);
    const skillCount = Object.keys(catalog.skills || {}).length;
    const suiteCount = Object.keys(catalog.suites || {}).length;
    const multiSuites = Object.values(catalog.suites || {}).filter(s => s.type === 'Multi-Skill Suite');
    const multiSuiteCount = multiSuites.length;
    const multiModuleCount = multiSuites.reduce((acc, s) => acc + (s.modules ? s.modules.length : 1), 0);
    const standaloneCount = suiteCount - multiSuiteCount;
    const agentsDir = path.join(rootDir, 'agents');
    const agentCount = fs.existsSync(agentsDir)
      ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length
      : 10;

    let modified = false;

    // 1. Sync config/skills.json total counts
    if (catalog.totalModules !== skillCount || catalog.totalSuites !== suiteCount) {
      catalog.totalModules = skillCount;
      catalog.totalSuites = suiteCount;
      if (!dryRun) {
        fs.writeFileSync(skillsConfigPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
      }
      modified = true;
    }

    // 2. Sync config/profiles.json
    const profilesPath = path.join(rootDir, 'config', 'profiles.json');
    if (fs.existsSync(profilesPath)) {
      const rawProfiles = fs.readFileSync(profilesPath, 'utf8');
      const profiles = JSON.parse(rawProfiles);
      if (profiles.profiles && profiles.profiles.full) {
        const expectedDesc = `Complete ${skillCount}-skill suite & ${agentCount} predefined agents: Process, Anti-Slop, Design, Security, Hygiene, and Cross-Agent Bridges.`;
        if (profiles.profiles.full.description !== expectedDesc) {
          profiles.profiles.full.description = expectedDesc;
          if (!dryRun) {
            fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2) + '\n', 'utf8');
          }
          modified = true;
        }
      }
    }

    // 3. Sync docs/SKILLS.md
    const docsSkillsPath = path.join(rootDir, 'docs', 'SKILLS.md');
    if (fs.existsSync(docsSkillsPath)) {
      let content = fs.readFileSync(docsSkillsPath, 'utf8');
      const regex = /Heimdall's \*\*\d+ Primary Toolkits & Suites \(\d+ modular capabilities\)\*\*/g;
      const targetStr = `Heimdall's **${suiteCount} Primary Toolkits & Suites (${skillCount} modular capabilities)**`;
      if (regex.test(content) && !content.includes(targetStr)) {
        content = content.replace(regex, targetStr);
        if (!dryRun) fs.writeFileSync(docsSkillsPath, content, 'utf8');
        modified = true;
      }
    }

    // 4. Sync README.md
    const readmePath = path.join(rootDir, 'README.md');
    if (fs.existsSync(readmePath)) {
      let content = fs.readFileSync(readmePath, 'utf8');
      const orig = content;

      content = content.replace(/skills-\d+%20toolkits%20%28\d+%20modules%29/g, `skills-${suiteCount}%20toolkits%20%28${skillCount}%20modules%29`);
      content = content.replace(/Skills: \d+ Toolkits \(\d+ Modules\)/g, `Skills: ${suiteCount} Toolkits (${skillCount} Modules)`);
      content = content.replace(/#skill-inventory-\d+-modules-across-\d+-toolkits/g, `#skill-inventory-${skillCount}-modules-across-${suiteCount}-toolkits`);
      content = content.replace(/<a id="skill-inventory-\d+-modules-across-\d+-toolkits"><\/a>/g, `<a id="skill-inventory-${skillCount}-modules-across-${suiteCount}-toolkits"></a>`);
      content = content.replace(/### Skill Inventory \(\d+ Modules Across \d+ Toolkits\)/g, `### Skill Inventory (${skillCount} Modules Across ${suiteCount} Toolkits)`);
      content = content.replace(/\*\*\d+ modular skills\*\*/g, `**${skillCount} modular skills**`);
      content = content.replace(/\* \*\*Modular Skills\*\*:\s*\d+\s*task-activated capabilities/g, `* **Modular Skills**: ${skillCount} task-activated capabilities`);
      content = content.replace(/(\|\s*`skills\/`\s*\|\s*`~\/\.<tool>\/skills\/`\s*\|\s*)\d+(\s*domain toolkits)/g, `$1${skillCount}$2`);
      content = content.replace(/(\|\s*\*\*`full`\*\*\s*\*\(Default\)\*\s*\|\s*)\d+(\s*\|\s*)\d+(\s*\|)/g, `$1${skillCount}$2${agentCount}$3`);
      content = content.replace(/agents-\d+%20predefined/g, `agents-${agentCount}%20predefined`);
      content = content.replace(/alt="Agents: \d+ Predefined"/g, `alt="Agents: ${agentCount} Predefined"`);
      content = content.replace(/#\d+-predefined-agent-personas/g, `#${agentCount}-predefined-agent-personas`);
      content = content.replace(/<a id="\d+-predefined-agent-personas"><\/a>/g, `<a id="${agentCount}-predefined-agent-personas"></a>`);
      content = content.replace(/### \d+ Predefined Agent Personas/g, `### ${agentCount} Predefined Agent Personas`);
      content = content.replace(/synchronizes \*\*\d+ specialized agent personas\*\*/g, `synchronizes **${agentCount} specialized agent personas**`);
      content = content.replace(/\* \*\*Specialized Agent Personas\*\*:\s*\d+\s*predefined roles/g, `* **Specialized Agent Personas**: ${agentCount} predefined roles`);
      content = content.replace(/(\|\s*`agents\/`\s*\|\s*`~\/\.<tool>\/agents\/`\s*\|\s*)\d+(\s*specialized agent persona)/g, `$1${agentCount}$2`);
      content = content.replace(/(Heimdall organizes capabilities into \*\*)\d+(\s*Core Multi-Skill Suites \()\d+(\s*modules\)\*\* and \*\*)\d+(\s*Standalone Toolkits \()\d+(\s*modules\)\*\*)/g, `$1${multiSuiteCount}$2${multiModuleCount}$3${standaloneCount}$4${standaloneCount}$5`);
      content = content.replace(/(#### Core Multi-Skill Suites \()\d+(\s*Suites \/ \s*)\d+(\s*Modules\))/g, `$1${multiSuiteCount}$2${multiModuleCount}$3`);
      content = content.replace(/(#### Standalone Toolkits \()\d+(\s*Curated Toolkits \/ \s*)\d+(\s*Modules\))/g, `$1${standaloneCount}$2${standaloneCount}$3`);

      if (content !== orig) {
        if (!dryRun) fs.writeFileSync(readmePath, content, 'utf8');
        modified = true;
      }
    }

    // 5. Sync README.pt-BR.md
    const readmePtPath = path.join(rootDir, 'README.pt-BR.md');
    if (fs.existsSync(readmePtPath)) {
      let content = fs.readFileSync(readmePtPath, 'utf8');
      const orig = content;

      content = content.replace(/skills-\d+%20toolkits%20%28\d+%20m%C3%B3dulos%29/g, `skills-${suiteCount}%20toolkits%20%28${skillCount}%20m%C3%B3dulos%29`);
      content = content.replace(/Skills: \d+ Toolkits \(\d+ Módulos\)/g, `Skills: ${suiteCount} Toolkits (${skillCount} Módulos)`);
      content = content.replace(/#inventario-de-skills-\d+-modulos-em-\d+-toolkits/g, `#inventario-de-skills-${skillCount}-modulos-em-${suiteCount}-toolkits`);
      content = content.replace(/<a id="inventario-de-skills-\d+-modulos-em-\d+-toolkits"><\/a>/g, `<a id="inventario-de-skills-${skillCount}-modulos-em-${suiteCount}-toolkits"></a>`);
      content = content.replace(/### Inventário de Skills \(\d+ Módulos em \d+ Toolkits\)/g, `### Inventário de Skills (${skillCount} Módulos em ${suiteCount} Toolkits)`);
      content = content.replace(/\*\*\d+ skills modulares\*\*/g, `**${skillCount} skills modulares**`);
      content = content.replace(/\* \*\*Skills Modulares\*\*:\s*\d+\s*capacidades/g, `* **Skills Modulares**: ${skillCount} capacidades`);
      content = content.replace(/(\|\s*`skills\/`\s*\|\s*`~\/\.<ferramenta>\/skills\/`\s*\|\s*)\d+(\s*toolkits de domínio)/g, `$1${skillCount}$2`);
      content = content.replace(/(\|\s*\*\*`full`\*\*\s*\*\(Padrão\)\*\s*\|\s*)\d+(\s*\|\s*)\d+(\s*\|)/g, `$1${skillCount}$2${agentCount}$3`);
      content = content.replace(/agents-\d+%20predefinidos/g, `agents-${agentCount}%20predefinidos`);
      content = content.replace(/alt="Agentes: \d+ Predefinidos"/g, `alt="Agentes: ${agentCount} Predefinidos"`);
      content = content.replace(/#\d+-personas-de-agentes-predefinidas/g, `#${agentCount}-personas-de-agentes-predefinidas`);
      content = content.replace(/<a id="\d+-personas-de-agentes-predefinidas"><\/a>/g, `<a id="${agentCount}-personas-de-agentes-predefinidas"></a>`);
      content = content.replace(/### \d+ Personas de Agentes Predefinidas/g, `### ${agentCount} Personas de Agentes Predefinidas`);
      content = content.replace(/sincroniza \*\*\d+ personas de agentes especializados\*\*/g, `sincroniza **${agentCount} personas de agentes especializados**`);
      content = content.replace(/\* \*\*Personas de Agentes Especializados\*\*:\s*\d+\s*papéis predefinidos/g, `* **Personas de Agentes Especializados**: ${agentCount} papéis predefinidos`);
      content = content.replace(/(\|\s*`agents\/`\s*\|\s*`~\/\.<ferramenta>\/agents\/`\s*\|\s*)\d+(\s*definições de personas)/g, `$1${agentCount}$2`);
      content = content.replace(/(O Heimdall organiza as capacidades em \*\*)\d+(\s*Suítes Multi-Skill Principais \()\d+(\s*módulos\)\*\* e \*\*)\d+(\s*Toolkits Independentes \()\d+(\s*módulos\)\*\*)/g, `$1${multiSuiteCount}$2${multiModuleCount}$3${standaloneCount}$4${standaloneCount}$5`);
      content = content.replace(/(#### Suítes Multi-Skill Principais \()\d+(\s*Suítes \/ \s*)\d+(\s*Módulos\))/g, `$1${multiSuiteCount}$2${multiModuleCount}$3`);
      content = content.replace(/(#### Toolkits Independentes \()\d+(\s*Toolkits Curados \/ \s*)\d+(\s*Módulos\))/g, `$1${standaloneCount}$2${standaloneCount}$3`);

      if (content !== orig) {
        if (!dryRun) fs.writeFileSync(readmePtPath, content, 'utf8');
        modified = true;
      }
    }

    // 6. Sync setup.mjs
    const setupMjsPath = path.join(rootDir, 'setup.mjs');
    if (fs.existsSync(setupMjsPath)) {
      let content = fs.readFileSync(setupMjsPath, 'utf8');
      const orig = content;

      content = content.replace(/Skill profile tier: full \(\d+\)/g, `Skill profile tier: full (${skillCount})`);
      content = content.replace(/All \d+ curated skills/g, `All ${skillCount} curated skills`);

      if (content !== orig) {
        if (!dryRun) fs.writeFileSync(setupMjsPath, content, 'utf8');
        modified = true;
      }
    }

    return { skillCount, suiteCount, modified };
  } catch (err) {
    console.error('Error during catalog count synchronization:', err);
    return null;
  }
}

module.exports = {
  syncCatalogCounts
};
