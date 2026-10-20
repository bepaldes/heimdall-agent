#!/usr/bin/env node

/**
 * ==============================================================================
 * Heimdall Agent — Autonomous Multi-Agent Sentinel & Environment Bootstrapper
 * ==============================================================================
 * Zero-dependency Node.js installer that configures and synchronizes 48 vetted
 * skills, cross-model bridges, and universal doctrine across:
 *   1. Google Antigravity / Gemini CLI (~/.gemini)
 *   2. Claude Code CLI (~/.claude)
 *   3. OpenAI Codex CLI (~/.codex)
 *   4. Universal Shared Agents Registry (~/.agents)
 *   5. Claude Desktop (%APPDATA%\Claude\claude_desktop_config.json)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

const userHome = os.homedir();
const skillsDir = path.join(__dirname, 'skills');
const toolsDir = path.join(__dirname, 'tools');
const doctrineDir = path.join(__dirname, 'doctrine');
const profilesPath = path.join(__dirname, 'config', 'profiles.json');

const targetPaths = {
  gemini: path.join(userHome, '.gemini', 'skills'),
  claude: path.join(userHome, '.claude', 'skills'),
  codex: path.join(userHome, '.codex', 'skills'),
  agents: path.join(userHome, '.agents', 'skills')
};

const globalToolsPath = 'C:\\Apps\\tools';
const globalDoctrinePath = 'C:\\Apps\\AGENTS.md';

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}   ██╗  ██╗███████╗██╗███╗   ███╗██████╗  █████╗ ██╗     ██╗     
   ██║  ██║██╔════╝██║████╗ ████║██╔══██╗██╔══██╗██║     ██║     
   ███████║█████╗  ██║██╔████╔██║██║  ██║███████║██║     ██║     
   ██╔══██║██╔══╝  ██║██║╚██╔╝██║██║  ██║██╔══██║██║     ██║     
   ██║  ██║███████╗██║██║ ╚═╝ ██║██████╔╝██║  ██║███████╗███████╗
   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝${colors.reset}
   ${colors.dim}Autonomous Multi-Agent Sentinel & Quality Bootstrapper${colors.reset}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    profile: 'full',
    agents: ['all'],
    tools: true,
    doctrine: true,
    dryRun: false,
    audit: false,
    yes: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--audit') options.audit = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--no-tools') options.tools = false;
    else if (arg === '--no-doctrine') options.doctrine = false;
    else if (arg === '--profile' && args[i + 1]) {
      options.profile = args[++i];
    } else if (arg === '--agents' && args[i + 1]) {
      options.agents = args[++i].split(',').map(s => s.trim().toLowerCase());
    }
  }

  return options;
}

function copyDirectory(src, dest, dryRun = false) {
  if (!fs.existsSync(src)) return 0;
  if (!dryRun && !fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirectory(srcPath, destPath, dryRun);
    } else {
      if (!dryRun) {
        fs.copyFileSync(srcPath, destPath);
      }
      count++;
    }
  }

  return count;
}

function runAudit() {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Environment Audit ===${colors.reset}\n`);

  const availableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Repository Canonical Skills: ${colors.green}${availableSkills.length}${colors.reset}\n`);

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    if (fs.existsSync(targetDir)) {
      const installed = fs.readdirSync(targetDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== '.system')
        .map(d => d.name);

      const missing = availableSkills.filter(s => !installed.includes(s));
      const extra = installed.filter(s => !availableSkills.includes(s));

      const statusColor = missing.length === 0 ? colors.green : colors.yellow;
      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${statusColor}${installed.length} skills${colors.reset} in ${targetDir}`);
      if (missing.length > 0) {
        console.log(`    ${colors.red}Missing (${missing.length}):${colors.reset} ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`    ${colors.yellow}Extra (${extra.length}):${colors.reset} ${extra.join(', ')}`);
      }
    } else {
      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${colors.dim}NOT INSTALLED (${targetDir})${colors.reset}`);
    }
  }

  console.log(`\n${colors.bold}Cross-Agent Bridge Tools:${colors.reset}`);
  if (fs.existsSync(globalToolsPath)) {
    const tools = fs.readdirSync(globalToolsPath).filter(f => f.includes('bridge'));
    console.log(`  ${colors.green}Found ${tools.length} bridge tools in ${globalToolsPath}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}Missing tools directory: ${globalToolsPath}${colors.reset}`);
  }

  console.log(`\n${colors.bold}Universal Doctrine:${colors.reset}`);
  if (fs.existsSync(globalDoctrinePath)) {
    console.log(`  ${colors.green}Universal AGENTS.md active at ${globalDoctrinePath}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}Missing universal doctrine: ${globalDoctrinePath}${colors.reset}`);
  }

  console.log('');
}

async function runInteractive(options) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(`${colors.yellow}Select Installation Profile:${colors.reset}`);
    console.log(`  1. full     - All 48 curated skills (Default powerhouse)`);
    console.log(`  2. minimal  - 15 core skills (Planning, TDD, Anti-Slop, Taste, Hygiene)`);
    console.log(`  3. security - 12 security skills (Differential HTTP probing, OWASP, Trail of Bits)`);
    console.log(`  4. design   - 14 frontend skills (Taste, GSAP motion, Brandkit, Tokens)`);

    const pChoice = await rl.question(`Choose profile [1-4, default: 1]: `);
    if (pChoice === '2') options.profile = 'minimal';
    else if (pChoice === '3') options.profile = 'security';
    else if (pChoice === '4') options.profile = 'design';
    else options.profile = 'full';

    console.log(`\n${colors.yellow}Select Target Agent Runtimes:${colors.reset}`);
    console.log(`  1. all      - Gemini, Claude Code, Codex, and .agents (Recommended)`);
    console.log(`  2. claude   - Claude Code CLI only (~/.claude)`);
    console.log(`  3. gemini   - Antigravity / Gemini CLI only (~/.gemini)`);
    console.log(`  4. codex    - OpenAI Codex CLI only (~/.codex)`);

    const aChoice = await rl.question(`Choose agent runtime [1-4, default: 1]: `);
    if (aChoice === '2') options.agents = ['claude'];
    else if (aChoice === '3') options.agents = ['gemini'];
    else if (aChoice === '4') options.agents = ['codex'];
    else options.agents = ['all'];

    const tChoice = await rl.question(`Install cross-model bridge tools to C:\\Apps\\tools? (y/n, default: y): `);
    options.tools = tChoice.toLowerCase() !== 'n';

    const dChoice = await rl.question(`Deploy universal doctrine to C:\\Apps\\AGENTS.md? (y/n, default: y): `);
    options.doctrine = dChoice.toLowerCase() !== 'n';
  } finally {
    rl.close();
  }
}

async function main() {
  printBanner();
  const options = parseArgs();

  if (options.audit) {
    runAudit();
    process.exit(0);
  }

  if (!options.yes) {
    await runInteractive(options);
  }

  const profilesData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
  const selectedProfile = profilesData.profiles[options.profile] || profilesData.profiles.full;

  console.log(`\n${colors.bold}${colors.cyan}=== Executing Heimdall Installation ===${colors.reset}`);
  console.log(`Profile:   ${colors.bold}${selectedProfile.name}${colors.reset} (${options.profile})`);
  console.log(`Agents:    ${options.agents.join(', ')}`);
  console.log(`Tools:     ${options.tools ? 'Yes (C:\\Apps\\tools)' : 'No'}`);
  console.log(`Doctrine:  ${options.doctrine ? 'Yes (C:\\Apps\\AGENTS.md)' : 'No'}`);
  console.log(`Dry Run:   ${options.dryRun ? colors.yellow + 'ENABLED' + colors.reset : 'No'}\n`);

  // 1. Resolve skills to copy
  const allAvailableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const skillsToInstall = selectedProfile.skills === '*'
    ? allAvailableSkills
    : selectedProfile.skills.filter(s => allAvailableSkills.includes(s));

  console.log(`Selected Skills to Deploy: ${colors.green}${skillsToInstall.length}${colors.reset}`);

  // 2. Resolve destination agent directories
  let activeDestinations = [];
  if (options.agents.includes('all')) {
    activeDestinations = Object.entries(targetPaths);
  } else {
    for (const agent of options.agents) {
      if (targetPaths[agent]) {
        activeDestinations.push([agent, targetPaths[agent]]);
      }
    }
  }

  // 3. Deploy skills
  for (const [agent, targetDir] of activeDestinations) {
    console.log(`\n-> Deploying to ${colors.bold}${agent.toUpperCase()}${colors.reset} (${targetDir})...`);
    if (!options.dryRun && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let installedCount = 0;
    for (const skill of skillsToInstall) {
      const srcSkill = path.join(skillsDir, skill);
      const destSkill = path.join(targetDir, skill);
      copyDirectory(srcSkill, destSkill, options.dryRun);
      installedCount++;
    }
    console.log(`   ${colors.green}✔ Synchronized ${installedCount} skills to ${agent}${colors.reset}`);
  }

  // 4. Deploy tools if requested
  if (options.tools) {
    console.log(`\n-> Deploying Bridge Tools to ${colors.bold}${globalToolsPath}${colors.reset}...`);
    if (!options.dryRun && !fs.existsSync(globalToolsPath)) {
      fs.mkdirSync(globalToolsPath, { recursive: true });
    }
    const tools = fs.readdirSync(toolsDir);
    for (const tool of tools) {
      const src = path.join(toolsDir, tool);
      const dest = path.join(globalToolsPath, tool);
      if (!options.dryRun) {
        fs.copyFileSync(src, dest);
      }
    }
    console.log(`   ${colors.green}✔ Deployed ${tools.length} cross-model bridge tools${colors.reset}`);
  }

  // 5. Deploy universal doctrine if requested
  if (options.doctrine) {
    console.log(`\n-> Deploying Universal Doctrine to ${colors.bold}${globalDoctrinePath}${colors.reset}...`);
    const srcDoc = path.join(doctrineDir, 'AGENTS.md');
    if (fs.existsSync(srcDoc) && !options.dryRun) {
      fs.copyFileSync(srcDoc, globalDoctrinePath);
    }
    console.log(`   ${colors.green}✔ Universal AGENTS.md doctrine active${colors.reset}`);
  }

  console.log(`\n${colors.bold}${colors.green}=== Heimdall Installation Complete! ===${colors.reset}\n`);
}

main().catch(err => {
  console.error(`\n${colors.red}Error executing Heimdall installer:${colors.reset}`, err);
  process.exit(1);
});
