'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const { colors, detectEnvironment } = require('./harness-detection.cjs');
const { writeHudConfig } = require('./hud-sync.cjs');
const {
  HUD_THEMES,
  syncHud,
  runAudit,
  runSync,
  syncModelsFromEndpoint,
  runHerdrApp,
  runUninstall
} = require('./installer-engine.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const skillsConfigPath = path.join(ROOT_DIR, 'config', 'skills.json');

/**
 * Resolves total skill count dynamically from config/skills.json.
 */
function getCanonicalSkillCount() {
  try {
    if (fs.existsSync(skillsConfigPath)) {
      const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
      return catalog.totalModules || Object.keys(catalog.skills || {}).length;
    }
  } catch {}
  return 69;
}

async function runHudInteractive(options, existingRl = null) {
  const rl = existingRl || readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`${colors.bold}${colors.cyan}=== Heimdall HUD Statusline Configuration ===${colors.reset}\n`);
    console.log(`  1. Enable / Update HUD (Claude Code, Antigravity, Codex)`);
    console.log(`  2. Disable HUD across all harnesses`);
    console.log(`  3. Choose HUD Theme only (night-blue, heimdall, claude-warm, titanium)`);
    const action = (await rl.question(`Choose an option [1-3, default: 1]: `)).trim();

    if (action === '2') {
      const updated = syncHud(options.dryRun, { off: true });
      if (!updated) console.log(`  ${colors.dim}HUD was not active in any harness.${colors.reset}`);
      return;
    }

    console.log(`\n${colors.yellow}Select HUD Color Theme:${colors.reset}`);
    console.log(`  1. night-blue  [Default]`);
    console.log(`  2. heimdall`);
    console.log(`  3. claude-warm`);
    console.log(`  4. titanium`);
    const tChoice = (await rl.question(`Choose theme [1-4, default: 1]: `)).trim();
    const themeIdx = parseInt(tChoice, 10);
    const chosenTheme = (themeIdx >= 1 && themeIdx <= HUD_THEMES.length) ? HUD_THEMES[themeIdx - 1] : 'night-blue';

    const lChoice = (await rl.question(`Layout lines? [1 or 2, default: 2]: `)).trim();
    const chosenLines = lChoice === '1' ? 1 : 2;

    if (action === '3') {
      writeHudConfig({ theme: chosenTheme, lines: chosenLines }, options.dryRun);
      console.log(`   ${colors.green}✔ Updated ~/.heimdall-hud.json (theme=${chosenTheme}, lines=${chosenLines})${colors.reset}`);
    } else {
      syncHud(options.dryRun, { theme: chosenTheme, lines: chosenLines });
    }
  } finally {
    if (!existingRl) rl.close();
  }
}

async function runPostInstallMenu(options, detected) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let currentDetected = detected;
  try {
    while (true) {
      console.log(`${colors.bold}${colors.cyan}=== Heimdall Management Hub ===${colors.reset}`);
      console.log(`Heimdall is currently installed and active across your environment.\n`);
      console.log(`What would you like to do?`);

      const menuItems = [
        { label: 'Audit Environment & Health Check', action: 'audit' },
        { label: 'Fast Sync Skills & Agents (1-sec zero-drift)', action: 'sync' },
        { label: 'Refresh Dynamic Models across Installed Harnesses (sync-models)', action: 'sync-models' },
        { label: 'Configure / Toggle Heimdall HUD Statusline', action: 'hud' },
        { label: 'Herdr-App Fix & Layout (Clipboard & Roundup)', action: 'herdr' },
        { label: 'Uninstall Heimdall', action: 'uninstall' },
        { label: 'Reinstall / Reconfigure Profile & Targets', action: 'reinstall' },
        { label: 'Exit', action: 'exit' }
      ];

      menuItems.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.label}`);
      });
      console.log('');

      const answer = await rl.question(`Choose an option [1-${menuItems.length}, default: 1]: `);
      const choice = answer.trim().toLowerCase();

      if (choice === 'q' || choice === 'exit') {
        console.log('Goodbye!');
        process.exit(0);
      }

      const idx = choice === '' ? 0 : parseInt(choice, 10) - 1;
      const selected = menuItems[idx] ? menuItems[idx].action : 'audit';

      if (selected === 'audit') {
        runAudit(options);
      } else if (selected === 'sync') {
        await runSync(options, currentDetected);
      } else if (selected === 'sync-models') {
        await syncModelsFromEndpoint();
      } else if (selected === 'hud') {
        await runHudInteractive(options, rl);
      } else if (selected === 'herdr') {
        runHerdrApp(options);
      } else if (selected === 'uninstall') {
        await runUninstall(options, currentDetected, rl);
      } else if (selected === 'reinstall') {
        return 'reinstall';
      } else if (selected === 'exit') {
        console.log('Goodbye!');
        process.exit(0);
      }

      const next = await rl.question(`\nReturn to main menu? (y/n, default: y): `);
      const nextChoice = next.trim().toLowerCase();
      if (nextChoice === 'n' || nextChoice === 'no' || nextChoice === 'q' || nextChoice === 'exit') {
        console.log('Goodbye!');
        process.exit(0);
      }
      console.log('');
      currentDetected = detectEnvironment();
    }
  } finally {
    rl.close();
  }
}

async function runInteractive(options, detected) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const totalSkillCount = getCanonicalSkillCount();

  try {
    console.log(`${colors.bold}${colors.cyan}--- Detected Environment on Your Machine ---${colors.reset}`);
    console.log(`  [${detected.tools.claude ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Claude Code CLI      ${detected.tools.claude ? '(' + detected.tools.claude + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.claude}${colors.reset}`);
    console.log(`  [${detected.tools.agy ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Google Antigravity   ${detected.tools.agy ? '(' + detected.tools.agy + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.gemini}${colors.reset}`);
    console.log(`  [${detected.tools.codex ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] OpenAI Codex CLI     ${detected.tools.codex ? '(' + detected.tools.codex + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.codex}${colors.reset}`);
    console.log(`  [${detected.tools.hermes ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Hermes Agent        ${detected.tools.hermes ? '(' + detected.tools.hermes + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.hermes}${colors.reset}`);
    console.log(`  [${detected.tools.openclaw ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] OpenClaw            ${detected.tools.openclaw ? '(' + detected.tools.openclaw + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.openclaw}${colors.reset}`);
    console.log(`  [${detected.tools.vscode ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] VS Code (Copilot)   ${detected.tools.vscode ? '(' + detected.tools.vscode + ')' : '(Not found)'}`);
    console.log(`       ${colors.dim}Endpoint: ${detected.endpoints.vscode}${colors.reset}`);
    console.log(`  [${detected.tools.claudeDesktop ? colors.green + '✔' : colors.dim + ' '}${colors.reset}] Claude Desktop       ${detected.tools.claudeDesktop ? '(' + detected.tools.claudeDesktop + ')' : '(Not found)'}`);
    console.log('');

    console.log(`${colors.yellow}Where would you like Heimdall installed?${colors.reset}`);
    console.log(`  1. All Detected Tools (Full Ecosystem) [Recommended]`);
    console.log(`  2. Claude Code CLI only`);
    console.log(`  3. Google Antigravity CLI only`);
    console.log(`  4. OpenAI Codex CLI only`);
    console.log(`  5. Hermes Agent only`);
    console.log(`  6. OpenClaw only`);
    console.log(`  7. VS Code (Copilot) only`);
    console.log(`  8. Claude Desktop only (MCP & Playbooks)`);
    console.log(`  9. Custom Multi-Selection (e.g. Claude + VS Code)`);

    const tChoice = await rl.question(`Choose installation targets [1-9, default: 1]: `);
    if (tChoice === '2') options.agents = ['claude'];
    else if (tChoice === '3') options.agents = ['gemini'];
    else if (tChoice === '4') options.agents = ['codex'];
    else if (tChoice === '5') options.agents = ['hermes'];
    else if (tChoice === '6') options.agents = ['openclaw'];
    else if (tChoice === '7') options.agents = ['vscode'];
    else if (tChoice === '8') options.agents = ['desktop'];
    else if (tChoice === '9') {
      const custom = await rl.question(`Enter comma-separated targets (claude, gemini, codex, hermes, openclaw, vscode, desktop): `);
      options.agents = custom.split(',').map(s => s.trim().toLowerCase());
    } else {
      options.agents = ['all'];
    }

    console.log(`\n${colors.yellow}Select Installation Profile Tier:${colors.reset}`);
    console.log(`  1. full     - All ${totalSkillCount} curated skills (Complete Powerhouse)`);
    console.log(`  2. minimal  - 16 core skills (Planning, TDD, Anti-Slop, Taste, Hygiene)`);
    console.log(`  3. security - 12 security skills (Differential HTTP probing, OWASP, Trail of Bits)`);
    console.log(`  4. design   - 14 frontend skills (Taste, GSAP motion, Brandkit, Tokens)`);

    const pChoice = await rl.question(`Choose profile tier [1-4, default: 1]: `);
    if (pChoice === '2') options.profile = 'minimal';
    else if (pChoice === '3') options.profile = 'security';
    else if (pChoice === '4') options.profile = 'design';
    else options.profile = 'full';

    console.log(`\n${colors.yellow}Select Deployment Mode:${colors.reset}`);
    console.log(`  1. Live NTFS Junctions / Symlinks (Single Source of Truth, Instant Sync) [Recommended]`);
    console.log(`  2. Physical Isolated Copies (Independent folders)`);
    const mChoice = await rl.question(`Choose mode [1-2, default: 1]: `);
    options.link = mChoice !== '2';

    const cleanChoice = await rl.question(`Clean existing legacy skills before installing? (y/n, default: y): `);
    options.clean = cleanChoice.toLowerCase() !== 'n';

    console.log(`\n${colors.yellow}Cross-Agent Bridge Tools & CLI Shortcut Location:${colors.reset}`);
    detected.pathCandidates.forEach((cand, idx) => {
      console.log(`  ${idx + 1}. ${cand} (Found on PATH)`);
    });
    console.log(`  ${detected.pathCandidates.length + 1}. Custom Directory Path`);
    console.log(`  ${detected.pathCandidates.length + 2}. Skip Tools Installation`);

    const toolsInput = await rl.question(`Select destination [1-${detected.pathCandidates.length + 2}, default: 1]: `);
    const chosenIdx = parseInt(toolsInput, 10);
    if (chosenIdx >= 1 && chosenIdx <= detected.pathCandidates.length) {
      options.toolsDir = detected.pathCandidates[chosenIdx - 1];
      options.tools = true;
    } else if (chosenIdx === detected.pathCandidates.length + 1) {
      const customPath = await rl.question(`Enter custom directory: `);
      options.toolsDir = customPath.trim();
      options.tools = true;
    } else if (chosenIdx === detected.pathCandidates.length + 2) {
      options.tools = false;
    } else {
      options.toolsDir = detected.pathCandidates[0];
      options.tools = true;
    }

    console.log(`\n${colors.yellow}Universal Doctrine (AGENTS.md) Location:${colors.reset}`);
    detected.doctrineCandidates.forEach((cand, idx) => {
      const existsLabel = fs.existsSync(cand) ? ` (${colors.green}Active${colors.reset})` : '';
      console.log(`  ${idx + 1}. ${cand}${existsLabel}`);
    });
    console.log(`  ${detected.doctrineCandidates.length + 1}. Custom File Path`);
    console.log(`  ${detected.doctrineCandidates.length + 2}. Skip Doctrine Deployment`);

    const docInput = await rl.question(`Select destination [1-${detected.doctrineCandidates.length + 2}, default: 1]: `);
    const chosenDocIdx = parseInt(docInput, 10);
    if (chosenDocIdx >= 1 && chosenDocIdx <= detected.doctrineCandidates.length) {
      options.doctrinePath = detected.doctrineCandidates[chosenDocIdx - 1];
      options.doctrine = true;
    } else if (chosenDocIdx === detected.doctrineCandidates.length + 1) {
      const customDoc = await rl.question(`Enter custom AGENTS.md path: `);
      options.doctrinePath = customDoc.trim();
      options.doctrine = true;
    } else if (chosenDocIdx === detected.doctrineCandidates.length + 2) {
      options.doctrine = false;
    } else {
      options.doctrinePath = detected.doctrineCandidates[0];
      options.doctrine = true;
    }

    console.log(`\n${colors.yellow}Heimdall HUD Statusline (Claude Code, Antigravity, Codex):${colors.reset}`);
    const hudChoice = (await rl.question(`Enable Heimdall HUD statusline? (y/n, default: y): `)).trim().toLowerCase();
    options.hudEnabled = hudChoice !== 'n' && hudChoice !== 'no';
    if (options.hudEnabled) {
      console.log(`  1. night-blue [Default]  2. heimdall  3. claude-warm  4. titanium`);
      const htChoice = (await rl.question(`Choose HUD theme [1-4, default: 1]: `)).trim();
      const htIdx = parseInt(htChoice, 10);
      options.hudTheme = (htIdx >= 1 && htIdx <= HUD_THEMES.length) ? HUD_THEMES[htIdx - 1] : 'night-blue';
    }
  } finally {
    rl.close();
  }
}

function runListSkills() {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Canonical Skills & Suites Catalog ===${colors.reset}\n`);

  if (!fs.existsSync(skillsConfigPath)) {
    console.log(`${colors.red}Registry file not found at ${skillsConfigPath}${colors.reset}`);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
  const skills = catalog.skills || {};
  const suites = catalog.suites || {};
  const totalSuites = catalog.totalSuites || Object.keys(suites).length;
  const totalModules = catalog.totalModules || Object.keys(skills).length;

  console.log(`Architecture: ${colors.bold}${colors.green}${totalSuites} Primary Toolkits & Suites (${totalModules} modular capabilities)${colors.reset}\n`);

  console.log(`${colors.bold}${colors.yellow}CORE MULTI-SKILL SUITES:${colors.reset}`);
  console.log(`${colors.dim}------------------------------------------------------------------------${colors.reset}`);
  for (const [, suite] of Object.entries(suites)) {
    if (suite.type === 'Multi-Skill Suite') {
      console.log(`\n📦 ${colors.bold}${colors.cyan}${suite.name}${colors.reset} (${suite.modules.length} modules)`);
      console.log(`   ${colors.dim}Upstream: ${suite.upstream}${colors.reset}`);
      for (const mod of suite.modules) {
        const modInfo = skills[mod];
        const descPreview = modInfo && modInfo.description ? `— ${modInfo.description.slice(0, 55)}...` : '';
        console.log(`   • ${colors.bold}${mod.padEnd(32)}${colors.reset} ${colors.dim}${descPreview}${colors.reset}`);
      }
    }
  }

  console.log(`\n\n${colors.bold}${colors.yellow}STANDALONE POWER TOOLKITS:${colors.reset}`);
  console.log(`${colors.dim}------------------------------------------------------------------------${colors.reset}`);
  for (const [, suite] of Object.entries(suites)) {
    if (suite.type === 'Standalone Toolkit') {
      const mod = suite.modules[0];
      const modInfo = skills[mod];
      const descPreview = modInfo && modInfo.description ? `— ${modInfo.description.slice(0, 48)}...` : '';
      console.log(`⚡ ${colors.bold}${mod.padEnd(28)}${colors.reset} ${colors.dim}${descPreview}${colors.reset}`);
    }
  }

  console.log(`\n${colors.dim}Run 'heimdall update-skill <name|all>' to inspect provenance and updates.${colors.reset}\n`);
}

function runUpdateSkill(targetSkill = 'all') {
  console.log(`${colors.bold}${colors.cyan}=== Upstream Skill Provenance & Bounded Review Protocol ===${colors.reset}\n`);

  if (!fs.existsSync(skillsConfigPath)) {
    console.log(`${colors.red}Registry file not found at ${skillsConfigPath}${colors.reset}`);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
  const skills = catalog.skills || {};
  const protocol = catalog.updateProtocol;

  console.log(`${colors.bold}Standard Verification Directive:${colors.reset}`);
  console.log(`${colors.dim}"${protocol}"${colors.reset}\n`);

  if (targetSkill.toLowerCase() === 'all') {
    const skillList = Object.entries(skills);
    console.log(`${colors.bold}Canonical Skills Provenance Table (${skillList.length} skills):${colors.reset}\n`);
    console.log(`${'Skill Name'.padEnd(32)} ${'Category'.padEnd(28)} Upstream Source`);
    console.log(`${'-'.repeat(31)} ${'-'.repeat(27)} ${'-'.repeat(45)}`);
    for (const [name, info] of skillList) {
      console.log(`${name.padEnd(32)} ${(info.category || '').padEnd(28)} ${colors.cyan}${info.upstream}${colors.reset}`);
    }

    console.log(`\n${colors.bold}${colors.green}Bounded Review Private Report Template:${colors.reset}`);
    console.log(`------------------------------------------------------------------------`);
    console.log(`Skill Name:           <name>`);
    console.log(`Upstream Repository:  <source URL>`);
    console.log(`Source Revision:      <commit hash / release tag>`);
    console.log(`Reviewed Range:       <diff range: e.g. v1.0.0..v1.1.0>`);
    console.log(`Actual Tests Run:     node setup.mjs audit && <skill-specific-tests>`);
    console.log(`Remaining Validation: <sign-off status>`);
    console.log(`------------------------------------------------------------------------\n`);
    console.log(`To inspect a single skill in detail, run: ${colors.bold}heimdall update-skill <name>${colors.reset}\n`);
    return;
  }

  const skillInfo = skills[targetSkill];
  if (!skillInfo) {
    console.log(`${colors.red}Skill '${targetSkill}' not found in canonical registry.${colors.reset}`);
    console.log(`Run ${colors.bold}heimdall skills${colors.reset} to view all available skills.\n`);
    return;
  }

  console.log(`${colors.bold}Skill Target:${colors.reset}         ${colors.green}${skillInfo.name}${colors.reset}`);
  console.log(`${colors.bold}Category:${colors.reset}             ${skillInfo.category}`);
  console.log(`${colors.bold}Description:${colors.reset}          ${skillInfo.description || '(none)'}`);
  console.log(`${colors.bold}Upstream Repository:${colors.reset}  ${colors.cyan}${skillInfo.upstream}${colors.reset}`);
  console.log(`${colors.bold}Frozen Revision:${colors.reset}      ${skillInfo.sourceRevision || 'v1.0.0'}\n`);

  console.log(`${colors.bold}Recommended Update Steps:${colors.reset}`);
  console.log(`1. Inspect upstream changes:`);
  console.log(`   ${colors.dim}git ls-remote ${skillInfo.upstream}${colors.reset}`);
  console.log(`2. Review changed instructions / references in the updated upstream commit.`);
  console.log(`3. Apply surgical edits to ${colors.cyan}skills/${skillInfo.name}/SKILL.md${colors.reset}.`);
  console.log(`4. Run boundary and audit checks:`);
  console.log(`   ${colors.dim}node setup.mjs audit${colors.reset}`);
  console.log(`5. Record your bounded review report:`);
  console.log(`   ---------------------------------------------------------------------`);
  console.log(`   Skill Name:           ${skillInfo.name}`);
  console.log(`   Upstream Repository:  ${skillInfo.upstream}`);
  console.log(`   Source Revision:      <new-commit-hash>`);
  console.log(`   Reviewed Range:       <diff range>`);
  console.log(`   Actual Tests Run:     node setup.mjs audit`);
  console.log(`   Remaining Validation: Verified compatible with multi-agent runtimes`);
  console.log(`   ---------------------------------------------------------------------\n`);
}

module.exports = {
  getCanonicalSkillCount,
  runHudInteractive,
  runPostInstallMenu,
  runInteractive,
  runListSkills,
  runUpdateSkill
};
