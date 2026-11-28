'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const { colors, detectEnvironment } = require('./harness-detection.cjs');
const { writeHudConfig } = require('./hud-sync.cjs');
const { selectOne, selectMany } = require('./tui.cjs');
const { loadHeimdallState, saveHeimdallState, addProfile, removeProfile, listProfiles } = require('./profiles.cjs');
const { applyAutonomousPermissions } = require('./permissions.cjs');
const { generateDashboard } = require('./dashboard.cjs');
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
    console.log(`  1. Enable / Update HUD (Selected Harnesses)`);
    console.log(`  2. Disable HUD across selected harnesses`);
    console.log(`  3. Choose HUD Theme only (night-blue, heimdall, claude-warm, titanium)`);
    const action = (await rl.question(`Choose an option [1-3, default: 1]: `)).trim();

    if (action === '2') {
      const updated = syncHud(options.dryRun, { off: true });
      if (!updated) console.log(`  ${colors.dim}HUD was not active in any selected harness.${colors.reset}`);
      return;
    }

    console.log(`\n${colors.yellow}Select HUD Color Theme:${colors.reset}`);
    HUD_THEMES.forEach((t, idx) => console.log(`  ${idx + 1}. ${t}${idx === 0 ? ' [Default]' : ''}`));
    const tChoice = (await rl.question(`Choose theme [1-${HUD_THEMES.length}, default: 1]: `)).trim();
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

async function selectSyncScopeTui(options, detected) {
  const state = loadHeimdallState();
  const savedAgents = new Set(state.agents || ['claude', 'gemini', 'codex']);
  const allFlag = savedAgents.has('all');

  const harnessItems = [
    { value: 'claude', label: 'Claude Code CLI', hint: detected.tools.claude ? 'detected' : 'not found', checked: allFlag || savedAgents.has('claude') },
    { value: 'gemini', label: 'Google Antigravity (agy)', hint: detected.tools.agy ? 'detected' : 'not found', checked: allFlag || savedAgents.has('gemini') },
    { value: 'codex', label: 'OpenAI Codex CLI', hint: detected.tools.codex ? 'detected' : 'not found', checked: allFlag || savedAgents.has('codex') },
    { value: 'hermes', label: 'Hermes Agent', hint: detected.tools.hermes ? 'detected' : 'not found', checked: allFlag || savedAgents.has('hermes') },
    { value: 'openclaw', label: 'OpenClaw', hint: detected.tools.openclaw ? 'detected' : 'not found', checked: allFlag || savedAgents.has('openclaw') },
    { value: 'vscode', label: 'VS Code (Copilot)', hint: detected.tools.vscode ? 'detected' : 'not found', checked: allFlag || savedAgents.has('vscode') },
    { value: 'desktop', label: 'Claude Desktop', hint: detected.tools.claudeDesktop ? 'detected' : 'not found', checked: allFlag || savedAgents.has('desktop') }
  ];

  const chosenAgents = await selectMany('Select Harnesses to Scope Heimdall Sync', harnessItems);
  if (chosenAgents === null) return; // Esc pressed -> back without saving
  state.agents = chosenAgents.length > 0 ? chosenAgents : ['claude'];

  const profiles = listProfiles();
  if (profiles.length > 0) {
    const selectedSet = new Set(state.selectedProfiles || profiles.map(p => p.id));
    const profItems = profiles.map(p => ({
      value: p.id,
      label: `Profile: ${p.id}`,
      hint: p.dir,
      checked: selectedSet.has(p.id)
    }));
    const chosenProfiles = await selectMany('Select Account Profiles to Sync', profItems);
    if (chosenProfiles === null) return;
    state.selectedProfiles = chosenProfiles;
  }

  saveHeimdallState(state);
  options.agents = state.agents;
  options.profiles = state.selectedProfiles;
  console.log(`${colors.green}✔ Saved scope: harnesses=[${state.agents.join(', ')}]${state.selectedProfiles?.length ? `, profiles=[${state.selectedProfiles.join(', ')}]` : ''}${colors.reset}\n`);
}

async function manageProfilesTui() {
  while (true) {
    const profiles = listProfiles();
    console.log(`${colors.bold}${colors.cyan}=== Account Profiles (${profiles.length}) ===${colors.reset}`);
    if (profiles.length > 0) {
      for (const p of profiles) {
        console.log(`  • ${colors.green}${p.id.padEnd(20)}${colors.reset} ${colors.dim}${p.dir}${colors.reset}`);
      }
      console.log('');
    } else {
      console.log(`  ${colors.dim}No multi-account profiles registered yet.${colors.reset}\n`);
    }

    const action = await selectOne('Manage Account Profiles:', [
      { label: 'Add a new profile (claude / codex / agy)', value: 'add' },
      ...(profiles.length > 0 ? [{ label: 'Remove an existing profile', value: 'remove' }] : []),
      { label: '← Back to Hub', value: 'back' }
    ]);

    if (!action || action === 'back') return;

    if (action === 'add') {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      try {
        const id = (await rl.question(`Profile ID (<tool>/<name>, e.g. claude/work, codex/client, agy/personal; blank to cancel): `)).trim();
        if (!id) continue;
        const customDir = (await rl.question(`Custom directory path (blank for ~/.heimdall-profiles/<tool>/<name>): `)).trim();
        const created = addProfile(id, { dir: customDir || null });
        console.log(`${colors.green}✔ Registered profile ${created.id} -> ${created.dir}${colors.reset}\n`);
      } catch (err) {
        console.log(`${colors.red}✖ ${err.message}${colors.reset}\n`);
      } finally {
        rl.close();
      }
    } else if (action === 'remove') {
      const target = await selectOne('Select profile to unregister:', [
        ...profiles.map(p => ({ label: p.id, value: p.id, hint: p.dir })),
        { label: '← Back', value: null }
      ]);
      if (target && removeProfile(target)) {
        console.log(`${colors.yellow}✔ Unregistered profile ${target}${colors.reset}\n`);
      }
    }
  }
}

async function runPostInstallMenu(options, detected) {
  let currentDetected = detected;
  while (true) {
    const state = loadHeimdallState();
    const scopeLabel = (state.agents || ['all']).join(', ');
    const profCount = Object.keys(state.profiles || {}).length;

    console.log(`${colors.bold}${colors.cyan}=== Heimdall Hub ===${colors.reset} ${colors.dim}(Scope: ${scopeLabel} | Profiles: ${profCount})${colors.reset}\n`);

    const action = await selectOne('Choose an action:', [
      { label: '1. Express Sync', value: 'sync', hint: 'Sync skills, agents, MCP & HUD for saved scope' },
      { label: '2. Select Harnesses & Sync Scope', value: 'scope', hint: 'Choose which tools & profiles sync touches' },
      { label: '3. Manage Account Profiles', value: 'profiles', hint: 'Add or remove claude / codex / agy accounts' },
      { label: '4. Tools & Maintenance', value: 'tools', hint: 'Audit, HUD, Herdr-App, Models, Uninstall, Reinstall' },
      { label: 'Exit', value: 'exit' }
    ], { allowBack: false });

    if (action === 'exit' || !action) {
      console.log('Goodbye!');
      process.exit(0);
    }

    if (action === 'sync') {
      await runSync(options, currentDetected);
    } else if (action === 'scope') {
      await selectSyncScopeTui(options, currentDetected);
    } else if (action === 'profiles') {
      await manageProfilesTui();
    } else if (action === 'tools') {
      const sub = await selectOne('Tools & Maintenance:', [
        { label: 'Audit Environment & Health Check', value: 'audit' },
        { label: 'Open Static HTML Dashboard', value: 'dashboard', hint: 'Generate ~/.heimdall/dashboard.html (zero server)' },
        { label: 'Configure Autonomous Permissions', value: 'permissions', hint: 'safe-dev / full-autonomous / reset' },
        { label: 'Configure / Toggle Heimdall HUD', value: 'hud' },
        { label: 'Herdr-App Fix & Layout (Win / macOS / Linux)', value: 'herdr' },
        { label: 'Refresh Dynamic Models (sync-models)', value: 'sync-models' },
        { label: 'Reinstall / Reconfigure Full Wizard', value: 'reinstall' },
        { label: 'Uninstall Heimdall', value: 'uninstall' },
        { label: '← Back to Hub', value: 'back' }
      ]);
      if (sub === 'audit') runAudit(options);
      else if (sub === 'dashboard') {
        const dash = generateDashboard({ rootDir: ROOT_DIR, repoDir: process.cwd() });
        console.log(`   ${colors.green}✔ Dashboard generated at ${dash.outPath}${colors.reset}`);
      } else if (sub === 'permissions') {
        const presetChoice = await selectOne('Autonomous Permissions Preset:', [
          { label: 'Safe Dev (Recommended)', value: 'safe-dev', hint: 'git, node, npm/pnpm, docker, heimdall, agy' },
          { label: 'Full Autonomous', value: 'full-autonomous', hint: 'Adds OS admin cmds (sudo systemctl/docker, omarchy, brew, winget)' },
          { label: 'Reset to Backups', value: 'reset', hint: 'Restore .heimdall.bak config files' },
          { label: '← Back', value: 'back' }
        ]);
        if (presetChoice && presetChoice !== 'back') {
          const permRes = applyAutonomousPermissions({
            preset: presetChoice === 'reset' ? 'safe-dev' : presetChoice,
            reset: presetChoice === 'reset',
            agents: state.agents,
            includeProfiles: true,
            dryRun: options.dryRun
          });
          console.log(permRes.mode === 'reset'
            ? `   ${colors.yellow}✔ Restored ${permRes.restored.length} config file(s)${colors.reset}`
            : `   ${colors.green}✔ Applied '${permRes.preset}' to ${permRes.updated.length} config file(s)${colors.reset}`);
        }
      }
      else if (sub === 'hud') await runHudInteractive(options);
      else if (sub === 'herdr') runHerdrApp(options);
      else if (sub === 'sync-models') await syncModelsFromEndpoint();
      else if (sub === 'reinstall') return 'reinstall';
      else if (sub === 'uninstall') await runUninstall(options, currentDetected);
    }

    currentDetected = detectEnvironment();
  }
}

async function runInteractive(options, detected) {
  const totalSkillCount = getCanonicalSkillCount();
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Guided Setup ===${colors.reset}\n`);

  const harnessItems = [
    { value: 'claude', label: 'Claude Code CLI', hint: detected.tools.claude || 'Not found', checked: Boolean(detected.tools.claude) },
    { value: 'gemini', label: 'Google Antigravity (agy)', hint: detected.tools.agy || 'Not found', checked: Boolean(detected.tools.agy) },
    { value: 'codex', label: 'OpenAI Codex CLI', hint: detected.tools.codex || 'Not found', checked: Boolean(detected.tools.codex) },
    { value: 'hermes', label: 'Hermes Agent', hint: detected.tools.hermes || 'Not found', checked: Boolean(detected.tools.hermes) },
    { value: 'openclaw', label: 'OpenClaw', hint: detected.tools.openclaw || 'Not found', checked: Boolean(detected.tools.openclaw) },
    { value: 'vscode', label: 'VS Code (Copilot)', hint: detected.tools.vscode || 'Not found', checked: Boolean(detected.tools.vscode) },
    { value: 'desktop', label: 'Claude Desktop', hint: detected.tools.claudeDesktop || 'Not found', checked: Boolean(detected.tools.claudeDesktop) }
  ];

  const chosen = await selectMany('Step 1 — Select Harnesses to Configure:', harnessItems);
  options.agents = chosen.length > 0 ? chosen : ['all'];

  const modeChoice = await selectOne('Step 2 — Choose Setup Mode:', [
    { label: `Express Install (Full ${totalSkillCount} skills, Live Junctions, HUD night-blue)`, value: 'express' },
    { label: 'Customize Profile, Deployment Mode, Paths & HUD', value: 'custom' }
  ]);

  if (modeChoice === 'express') {
    options.profile = 'full';
    options.link = true;
    options.clean = true;
    options.toolsDir = detected.pathCandidates[0];
    options.tools = true;
    options.doctrinePath = detected.doctrineCandidates[0];
    options.doctrine = true;
    options.hudEnabled = true;
    options.hudTheme = 'night-blue';
    const permPrompt = await selectOne('Step 3 — Autonomous Command Permissions (Optional):', [
      { label: 'Keep Default Harness Prompts (No config edits)', value: 'none' },
      { label: 'Enable Safe Dev Allowlist (git, node, npm/pnpm, docker, heimdall, agy)', value: 'safe-dev' },
      { label: 'Enable Full Autonomous (Adds OS admin commands for Linux/macOS/Windows)', value: 'full-autonomous' }
    ], { allowBack: false });
    if (permPrompt && permPrompt !== 'none') options.autoAllow = permPrompt;
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let minimalCount = 18;
    try {
      const profilesCfg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'config', 'profiles.json'), 'utf8'));
      if (Array.isArray(profilesCfg?.profiles?.minimal?.skills)) minimalCount = profilesCfg.profiles.minimal.skills.length;
    } catch {}
    console.log(`\n${colors.yellow}Select Installation Profile Tier:${colors.reset}`);
    console.log(`  1. full     - All ${totalSkillCount} curated skills (Complete Powerhouse)`);
    console.log(`  2. minimal  - ${minimalCount} core skills`);
    console.log(`  3. security - 12 security skills`);
    console.log(`  4. design   - 14 frontend skills`);

    const pChoice = await rl.question(`Choose profile tier [1-4, default: 1]: `);
    if (pChoice === '2') options.profile = 'minimal';
    else if (pChoice === '3') options.profile = 'security';
    else if (pChoice === '4') options.profile = 'design';
    else options.profile = 'full';

    const mChoice = await rl.question(`Use Live Junctions / Symlinks? (y/n, default: y): `);
    options.link = mChoice.toLowerCase() !== 'n';

    const cleanChoice = await rl.question(`Clean existing legacy skills before installing? (y/n, default: y): `);
    options.clean = cleanChoice.toLowerCase() !== 'n';

    options.toolsDir = detected.pathCandidates[0];
    options.tools = true;
    options.doctrinePath = detected.doctrineCandidates[0];
    options.doctrine = true;

    const hudChoice = (await rl.question(`Enable Heimdall HUD statusline? (y/n, default: y): `)).trim().toLowerCase();
    options.hudEnabled = hudChoice !== 'n' && hudChoice !== 'no';
    if (options.hudEnabled) {
      const htChoice = (await rl.question(`HUD theme [1=night-blue, 2=heimdall, 3=claude-warm, 4=titanium, default: 1]: `)).trim();
      const htIdx = parseInt(htChoice, 10);
      options.hudTheme = (htIdx >= 1 && htIdx <= HUD_THEMES.length) ? HUD_THEMES[htIdx - 1] : 'night-blue';
    }
  } finally {
    rl.close();
  }
  const permPrompt = await selectOne('Step 3 — Autonomous Command Permissions (Optional):', [
    { label: 'Keep Default Harness Prompts (No config edits)', value: 'none' },
    { label: 'Enable Safe Dev Allowlist (git, node, npm/pnpm, docker, heimdall, agy)', value: 'safe-dev' },
    { label: 'Enable Full Autonomous (Adds OS admin commands for Linux/macOS/Windows)', value: 'full-autonomous' }
  ], { allowBack: false });
  if (permPrompt && permPrompt !== 'none') options.autoAllow = permPrompt;
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
    return;
  }

  const skillInfo = skills[targetSkill];
  if (!skillInfo) {
    console.log(`${colors.red}Skill '${targetSkill}' not found in canonical registry.${colors.reset}`);
    return;
  }

  console.log(`${colors.bold}Skill Target:${colors.reset}         ${colors.green}${skillInfo.name}${colors.reset}`);
  console.log(`${colors.bold}Category:${colors.reset}             ${skillInfo.category}`);
  console.log(`${colors.bold}Upstream Repository:${colors.reset}  ${colors.cyan}${skillInfo.upstream}${colors.reset}\n`);
}

module.exports = {
  getCanonicalSkillCount,
  runHudInteractive,
  runPostInstallMenu,
  runInteractive,
  runListSkills,
  runUpdateSkill
};
