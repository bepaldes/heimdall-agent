#!/usr/bin/env node

/**
 * ==============================================================================
 * Heimdall Agent — Intelligent Multi-Agent Sentinel & Environment Bootstrapper
 * ==============================================================================
 * Detects installed tools (Claude Code, Antigravity, Codex CLI, Claude Desktop),
 * inspects active API endpoints (Custom Proxies / API or Custom Vendors, Google OAuth, or Official APIs),
 * dynamically discovers user PATH & doctrine directories (zero hardcoded paths),
 * provides 1-second auto-sync ('heimdall sync') for newly installed AI tools,
 * and deploys skills via native live junctions (--link) or isolated copies.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

// Force IPv4 DNS resolution globally — avoids IPv6 timeouts on networks
// where AAAA records resolve but IPv6 connectivity is broken or slow.
dns.setDefaultResultOrder('ipv4first');

import { syncCatalogCounts } from './lib/catalog-sync.cjs';
import {
  colors,
  checkCommand,
  getHermesDir,
  targetPaths,
  targetAgentPaths,
  targetDoctrinePaths,
  targetPlaybookPaths,
  targetCommandPaths,
  targetHookPaths,
  getAgentRootDir,
  isAgentConfigurable,
  detectEnvironment
} from './lib/harness-detection.cjs';
import { syncMcpServers } from './lib/mcp-installer.cjs';
import {
  registerClaudeHooks,
  linkDirectory,
  copyDirectory,
  cleanTargetDirectory,
  deployAgentContracts,
  cleanLegacyLocalAgents,
  deployGlobalShims,
  configureHermesExternalDirs,
  configureHermesContextLimit,
  syncHerdrAppConfig,
  runHerdrApp,
  syncHud,
  syncModelsFromEndpoint,
  convergeModelAwareArtifacts,
  runSync,
  runAudit,
  isHeimdallInstalled,
  runUninstall
} from './lib/installer-engine.cjs';
import {
  runHudInteractive,
  runPostInstallMenu,
  runInteractive,
  runListSkills,
  runUpdateSkill
} from './lib/interactive-menu.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userHome = os.homedir();
const skillsDir = path.join(__dirname, 'skills');
const agentsDir = path.join(__dirname, 'agents');
const playbooksDir = path.join(__dirname, 'playbooks');
const toolsDir = path.join(__dirname, 'tools');
const doctrineDir = path.join(__dirname, 'doctrine');
const commandsDir = path.join(__dirname, 'commands');
const hooksDir = path.join(__dirname, 'hooks');
const profilesPath = path.join(__dirname, 'config', 'profiles.json');

const pkgJsonPath = path.join(__dirname, 'package.json');
let currentVersion = '1.0.0';
try {
  currentVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version || '1.0.0';
} catch {}

function isNewerVersion(current, latest) {
  if (!latest || !current) return false;
  const c = current.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const l = latest.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

async function checkForUpdates() {
  const cacheFile = path.join(userHome, '.heimdall-update.json');
  let cache = { lastChecked: 0, latestVersion: null };

  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch {}
  }

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let latestVersion = cache.latestVersion;

  if (now - (cache.lastChecked || 0) > ONE_DAY) {
    try {
      const res = await fetch('https://registry.npmjs.org/heimdall-agent/latest', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(1200)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          latestVersion = data.version;
          cache = { lastChecked: now, latestVersion };
          try {
            fs.writeFileSync(cacheFile, JSON.stringify(cache), 'utf8');
          } catch {}
        }
      }
    } catch {
      // Offline, timeout, or registry unreachable - fail silently
    }
  }

  if (latestVersion && isNewerVersion(currentVersion, latestVersion)) {
    console.log(`${colors.yellow}╭────────────────────────────────────────────────────────────╮
│  ${colors.bold}Update available:${colors.reset}${colors.yellow} ${currentVersion} → ${colors.green}${colors.bold}${latestVersion}${colors.reset}${colors.yellow}                              │
│  Run: ${colors.cyan}npm install -g heimdall-agent${colors.reset}${colors.yellow}                         │
│  Or:  ${colors.cyan}npx heimdall-agent@latest${colors.reset}${colors.yellow}                             │
╰────────────────────────────────────────────────────────────╯${colors.reset}`);
  }
}

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}   ██╗  ██╗███████╗██╗███╗   ███╗██████╗  █████╗ ██╗     ██╗     
   ██║  ██║██╔════╝██║████╗ ████║██╔══██╗██╔══██╗██║     ██║     
   ███████║█████╗  ██║██╔████╔██║██║  ██║███████║██║     ██║     
   ██╔══██║██╔══╝  ██║██║╚██╔╝██║██║  ██║██╔══██║██║     ██║     
   ██║  ██║███████╗██║██║ ╚═╝ ██║██████╔╝██║  ██║███████╗███████╗
   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝${colors.reset}
   ${colors.dim}Intelligent Multi-Agent Sentinel & Quality Bootstrapper${colors.reset}
`);
}

function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}Heimdall Agent CLI${colors.reset} — Intelligent Multi-Agent Sentinel & Quality Bootstrapper

${colors.bold}USAGE:${colors.reset}
  heimdall [command] [options]
  node setup.mjs [command] [options]

${colors.dim}Note: 'heimdall' and 'node setup.mjs' are identical. 'heimdall' is the global CLI shortcut.${colors.reset}

${colors.bold}PRIMARY SUBCOMMANDS:${colors.reset}
  ${colors.green}sync${colors.reset} (or ${colors.dim}--sync${colors.reset})           Scan PATH for newly installed AI tools and link skills (1-sec zero-drift)
  ${colors.green}sync-docs${colors.reset} (or ${colors.dim}--sync-docs${colors.reset})      Synchronize documentation and config count references from Single Source of Truth
  ${colors.green}audit${colors.reset} (or ${colors.dim}--audit${colors.reset})         Audit installed harnesses, active API endpoints, and skill counts
  ${colors.green}uninstall${colors.reset} (or ${colors.dim}--uninstall${colors.reset})     Safely remove Heimdall skills and agent personas from all harnesses
  ${colors.green}sync-models${colors.reset} (or ${colors.dim}--sync-models${colors.reset}) Probe installed harnesses, Gemini/Antigravity, and custom APIs to refresh models.json
  ${colors.green}hud${colors.reset} (or ${colors.dim}--hud${colors.reset})             Enable, disable, or theme Heimdall HUD (--on | --off | --theme <name> | --lines <1|2>)
  ${colors.green}skills${colors.reset} (or ${colors.dim}--skills${colors.reset})         List all canonical skills, categories, and upstream provenance
  ${colors.green}update-skill <name|all>${colors.reset}     Inspect upstream repository, updates, and bounded review protocol
  ${colors.green}herdr${colors.reset} (or ${colors.dim}--herdr, herdr-fix${colors.reset})   Configure Herdr-App clipboard reliability & Herdr-Roundup layout
  ${colors.green}help${colors.reset} (or ${colors.dim}--help, -h${colors.reset})      Display this parameter and command reference

${colors.bold}SETUP & BOOTSTRAP OPTIONS:${colors.reset}
  ${colors.yellow}--profile <name>${colors.reset}       Skill profile tier: full (69), minimal (16), security (12), design (14) [default: full]
  ${colors.yellow}--agents <targets>${colors.reset}     Comma-separated harnesses: claude, gemini, codex, hermes, openclaw, vscode, desktop, all [default: all]
  ${colors.yellow}--link / --no-link${colors.reset}     Use live NTFS junctions / symlinks vs static copies [default: false in wizard, true recommended]
  ${colors.yellow}--clean${colors.reset}                Wipe legacy skills from target directory before deploying
  ${colors.yellow}-y, --yes${colors.reset}              Non-interactive mode (use defaults or provided CLI arguments)
  ${colors.yellow}--dry-run${colors.reset}              Simulate execution without modifying the filesystem
  ${colors.yellow}--tools-dir <dir>${colors.reset}      Custom directory to deploy cross-model bridge tools and 'heimdall' CLI
  ${colors.yellow}--doctrine-path <file>${colors.reset} Custom file destination for AGENTS.md universal doctrine
  ${colors.yellow}--no-tools${colors.reset}             Skip deploying bridge tools and CLI shims
  ${colors.yellow}--no-doctrine${colors.reset}          Skip deploying AGENTS.md universal doctrine
  ${colors.yellow}--no-hud${colors.reset}               Skip configuring Heimdall HUD statusline during install/sync
  ${colors.yellow}--theme <name>${colors.reset}         HUD color theme: night-blue [default], heimdall, claude-warm, titanium

${colors.bold}EXAMPLES:${colors.reset}
  heimdall                                  # Interactive management hub (audit, sync, uninstall)
  heimdall sync                             # Instant sync after installing a new tool
  heimdall audit                            # Environment health check
  heimdall herdr                            # Optimize Herdr-App (fix clipboard paste/copy & enable Roundup layout)
  heimdall uninstall                        # Safely unbind Heimdall skills and agents
  heimdall skills                           # Browse canonical skills catalog
  heimdall update-skill ponytail           # Inspect upstream provenance & review protocol for single skill
  heimdall update-skill all                # Generate full bounded review audit report
  heimdall sync-models                      # Refresh model catalogs
  node setup.mjs --clean --link --yes       # Recommended full automated setup with live junctions
  node setup.mjs --profile minimal --yes    # Minimal install for lightweight laptop
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    profile: 'full',
    agents: null,
    link: false,
    clean: false,
    sync: false,
    syncDocs: false,
    uninstall: false,
    tools: true,
    doctrine: true,
    toolsDir: null,
    doctrinePath: null,
    dryRun: false,
    audit: false,
    syncModels: false,
    hud: false,
    herdr: false,
    hudEnabled: true,
    hudOff: false,
    hudTheme: null,
    hudLines: null,
    listSkills: false,
    updateSkill: null,
    help: false,
    yes: false,
    hasArgs: args.length > 0
  };

  for (let i = 0; i < args.length; i++) {
    const rawArg = args[i];
    const arg = rawArg.toLowerCase();

    if (arg === 'help' || arg === '--help' || arg === '-h') options.help = true;
    else if (arg === 'audit' || arg === '--audit') options.audit = true;
    else if (arg === 'sync' || arg === '--sync') options.sync = true;
    else if (arg === 'sync-docs' || arg === '--sync-docs' || arg === 'syncdocs') options.syncDocs = true;
    else if (arg === 'uninstall' || arg === '--uninstall') options.uninstall = true;
    else if (arg === 'sync-models' || arg === '--sync-models' || arg === 'syncmodels') options.syncModels = true;
    else if (arg === 'hud' || arg === '--hud') options.hud = true;
    else if (arg === 'herdr' || arg === '--herdr' || arg === 'herdr-fix' || arg === '--herdr-fix') options.herdr = true;
    else if (arg === '--on') options.hudOff = false;
    else if (arg === '--off') options.hudOff = true;
    else if (arg === '--no-hud') options.hudEnabled = false;
    else if ((arg === '--theme' || arg === '--hud-theme') && args[i + 1]) {
      options.hudTheme = args[++i].toLowerCase();
    } else if (arg === '--lines' && args[i + 1]) {
      options.hudLines = parseInt(args[++i], 10);
    }
    else if (arg === 'skills' || arg === '--skills') options.listSkills = true;
    else if (arg === 'update-skill' || arg === '--update-skill' || arg === 'updateskill') {
      options.updateSkill = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : 'all';
    }
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--link') options.link = true;
    else if (arg === '--no-link') options.link = false;
    else if (arg === '--clean') options.clean = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--no-tools') options.tools = false;
    else if (arg === '--no-doctrine') options.doctrine = false;
    else if (arg === '--profile' && args[i + 1]) {
      options.profile = args[++i].toLowerCase();
    } else if (arg === '--agents' && args[i + 1]) {
      options.agents = args[++i].split(',').map(s => s.trim().toLowerCase());
    } else if (arg === '--tools-dir' && args[i + 1]) {
      options.toolsDir = args[++i];
    } else if (arg === '--doctrine-path' && args[i + 1]) {
      options.doctrinePath = args[++i];
    }
  }

  return options;
}

async function main() {
  printBanner();
  await checkForUpdates();
  const options = parseArgs();
  const detected = detectEnvironment();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.audit) {
    runAudit(options);
    process.exit(0);
  }

  if (options.listSkills) {
    runListSkills();
    process.exit(0);
  }

  if (options.updateSkill) {
    runUpdateSkill(options.updateSkill);
    process.exit(0);
  }

  if (options.syncModels) {
    await syncModelsFromEndpoint();
    process.exit(0);
  }

  if (options.herdr) {
    runHerdrApp(options);
    process.exit(0);
  }

  if (options.hud) {
    if (!options.hudOff && !options.hudTheme && !options.hudLines && !options.yes && process.stdin.isTTY && !process.argv.includes('--on')) {
      await runHudInteractive(options);
    } else {
      console.log(`${colors.bold}${colors.cyan}=== Heimdall HUD Statusline Sync ===${colors.reset}\n`);
      const updated = syncHud(options.dryRun, {
        off: options.hudOff,
        theme: options.hudTheme,
        lines: options.hudLines
      });
      if (!updated) {
        console.log(`  ${colors.green}✔${colors.reset} HUD statusline already up to date across detected harnesses.`);
      }
    }
    process.exit(0);
  }

  if (options.syncDocs) {
    const res = syncCatalogCounts(__dirname, options.dryRun);
    if (res) {
      console.log(`${colors.green}✔ Documentation and catalog counts synchronized (${res.suiteCount} suites / ${res.skillCount} modules).${colors.reset}\n`);
    } else {
      console.log(`${colors.red}Failed to synchronize catalog counts.${colors.reset}\n`);
    }
    process.exit(0);
  }

  if (options.sync) {
    await runSync(options, detected);
    process.exit(0);
  }

  if (options.uninstall) {
    await runUninstall(options, detected);
    process.exit(0);
  }

  if (!options.toolsDir) {
    options.toolsDir = detected.pathCandidates[0];
  }
  if (!options.doctrinePath) {
    options.doctrinePath = detected.doctrineCandidates.find(p => fs.existsSync(p)) || detected.doctrineCandidates[0];
  }

  if (!options.yes && !options.hasArgs) {
    const installState = isHeimdallInstalled();
    if (installState.installed) {
      const action = await runPostInstallMenu(options, detected);
      if (action !== 'reinstall') {
        process.exit(0);
      }
    }
  }

  // Load persisted agent selection from previous install/sync
  const stateFile = path.join(userHome, '.heimdall-state.json');
  let savedState = {};
  try { savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch {}

  if (!options.yes) {
    await runInteractive(options, detected);
    // Persist the user's harness selection for future resyncs
    try {
      savedState.agents = options.agents;
      savedState.savedAt = new Date().toISOString();
      fs.writeFileSync(stateFile, JSON.stringify(savedState, null, 2));
    } catch {}
  } else if (!options.agents) {
    // Non-interactive mode: use saved selection if available, otherwise fall back to all
    options.agents = savedState.agents || ['all'];
  }

  const profilesData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
  const selectedProfile = profilesData.profiles[options.profile] || profilesData.profiles.full;

  console.log(`\n${colors.bold}${colors.cyan}=== Executing Heimdall Installation ===${colors.reset}`);
  console.log(`Profile:   ${colors.bold}${selectedProfile.name}${colors.reset} (${options.profile})`);

  await convergeModelAwareArtifacts(options);
  console.log(`Mode:      ${options.link ? colors.cyan + 'Live Junctions (Single Source of Truth)' + colors.reset : 'Physical Copies'}`);
  console.log(`Cleanup:   ${options.clean ? colors.yellow + 'Wiping legacy skills before install' + colors.reset : 'Incremental update'}`);
  console.log(`Targets:   ${options.agents.join(', ')}`);
  console.log(`Tools Dir: ${options.tools ? colors.green + options.toolsDir + colors.reset : 'Skipped'}`);
  console.log(`Doctrine:  ${options.doctrine ? colors.green + options.doctrinePath + colors.reset : 'Skipped'}`);
  console.log(`Dry Run:   ${options.dryRun ? colors.yellow + 'ENABLED' + colors.reset : 'No'}\n`);

  const allAvailableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const skillsToInstall = selectedProfile.skills === '*'
    ? allAvailableSkills
    : selectedProfile.skills.filter(s => allAvailableSkills.includes(s));

  console.log(`Selected Skills to Deploy: ${colors.green}${skillsToInstall.length}${colors.reset}`);

  let activeDestinations = [];
  if (options.agents.includes('all')) {
    activeDestinations = Object.entries(targetPaths).filter(([agent]) => isAgentConfigurable(agent));
  } else {
    for (const agent of options.agents) {
      if (targetPaths[agent]) {
        if (isAgentConfigurable(agent)) {
          activeDestinations.push([agent, targetPaths[agent]]);
        } else {
          const rootDir = getAgentRootDir(agent);
          console.log(`\n-> ${colors.bold}${agent.toUpperCase()}${colors.reset} directory not found at ${rootDir} (skipped; only configured if exists)`);
        }
      }
    }
  }

  for (const [agent, targetDir] of activeDestinations) {
    const rootDir = getAgentRootDir(agent);
    if (!rootDir) continue;
    if (!fs.existsSync(rootDir)) {
      if (agent === 'vscode' && !options.dryRun) {
        fs.mkdirSync(rootDir, { recursive: true });
      } else if (agent !== 'vscode') {
        continue;
      }
    }

    console.log(`\n-> Deploying to ${colors.bold}${agent.toUpperCase()}${colors.reset} (${targetDir})...`);
    if (!options.dryRun && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (options.clean) {
      const cleaned = cleanTargetDirectory(targetDir, options.dryRun);
      if (cleaned > 0) {
        console.log(`   ${colors.yellow}Cleaned ${cleaned} legacy entries (preserved vendor files)${colors.reset}`);
      }
    }

    let installedCount = 0;
    for (const skill of skillsToInstall) {
      const srcSkill = path.join(skillsDir, skill);
      const destSkill = path.join(targetDir, skill);

      if (options.link) {
        linkDirectory(srcSkill, destSkill, options.dryRun);
      } else {
        copyDirectory(srcSkill, destSkill, options.dryRun);
      }
      installedCount++;
    }
    const modeVerb = options.link ? 'Linked (NTFS Junctions)' : 'Synchronized';
    console.log(`   ${colors.green}✔ ${modeVerb} ${installedCount} skills to ${agent}${colors.reset}`);

    if (agent === 'hermes') {
      const hermesConfigured = configureHermesExternalDirs(getHermesDir(), options.dryRun);
      if (hermesConfigured) {
        console.log(`   ${colors.green}✔ Registered ~/.agents/skills in Hermes config.yaml external_dirs${colors.reset}`);
      }
      const hermesContextUpdated = configureHermesContextLimit(getHermesDir(), null, options.dryRun);
      if (hermesContextUpdated) {
        console.log(`   ${colors.green}✔ Enforced maximum context limits in Hermes config.yaml${colors.reset}`);
      }
    }
  }

  console.log(`\n${colors.bold}${colors.cyan}--- Deploying Predefined Agents ---${colors.reset}`);
  const allAvailableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];
  const agentsToInstall = (selectedProfile.agents === '*' || !selectedProfile.agents)
    ? allAvailableAgents
    : selectedProfile.agents.map(a => `${a}.md`).filter(f => allAvailableAgents.includes(f));

  for (const [agent] of activeDestinations) {
    const targetAgentDir = targetAgentPaths[agent];
    if (targetAgentDir) {
      const count = deployAgentContracts(targetAgentDir, options.link, options.clean, options.dryRun, agentsToInstall);
      const modeVerb = options.link ? 'Linked (NTFS Junctions)' : 'Synchronized';
      console.log(`   ${colors.green}✔ ${modeVerb} ${count} predefined agents to ${agent} (${targetAgentDir})${colors.reset}`);
    }
  }

  if (options.clean) {
    const cleanedLocal = cleanLegacyLocalAgents(options.dryRun);
    if (cleanedLocal) {
      console.log(`   ${colors.yellow}✔ Cleaned legacy local agents in ${cleanedLocal} and linked canonical registry${colors.reset}`);
    }
  }

  syncMcpServers(detected, options);

  if (options.tools && options.toolsDir) {
    if (!fs.existsSync(options.toolsDir)) {
      console.log(`\n-> Tools directory not found at ${options.toolsDir} (skipped)`);
    } else {
      console.log(`\n-> Deploying Bridge Tools & 'heimdall' CLI to ${colors.bold}${options.toolsDir}${colors.reset}...`);
      const tools = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isFile());
      for (const tool of tools) {
        const src = path.join(toolsDir, tool);
        const dest = path.join(options.toolsDir, tool);
        if (!options.dryRun) {
          fs.copyFileSync(src, dest);
          if (os.platform() !== 'win32' && tool.endsWith('.sh')) {
            try { fs.chmodSync(dest, 0o755); } catch {}
          }
        }
      }
      deployGlobalShims(options.toolsDir, options.dryRun, __filename);
      console.log(`   ${colors.green}✔ Deployed ${tools.length} cross-model bridge tools + 'heimdall' global CLI shim${colors.reset}`);
    }
  }

  if (options.doctrine) {
    console.log(`\n-> Deploying Universal Doctrine & Playbooks...`);
    const srcDoc = path.join(doctrineDir, 'AGENTS.md');
    if (fs.existsSync(srcDoc) && !options.dryRun) {
      if (options.doctrinePath) {
        const docParent = path.dirname(options.doctrinePath);
        if (!fs.existsSync(docParent)) fs.mkdirSync(docParent, { recursive: true });
        fs.copyFileSync(srcDoc, options.doctrinePath);
        console.log(`   ${colors.green}✔ Universal AGENTS.md doctrine active at ${options.doctrinePath}${colors.reset}`);
      }

      for (const [agent, targetDocFile] of Object.entries(targetDoctrinePaths)) {
        if (!isAgentConfigurable(agent)) continue;
        const parentDir = path.dirname(targetDocFile);
        if (fs.existsSync(parentDir)) {
          fs.copyFileSync(srcDoc, targetDocFile);
          console.log(`   ${colors.green}✔ Synchronized doctrine to ${targetDocFile}${colors.reset}`);
        }
      }

      if (fs.existsSync(playbooksDir)) {
        for (const [agent, targetPlayDir] of Object.entries(targetPlaybookPaths)) {
          if (!isAgentConfigurable(agent)) continue;
          const parentDir = path.dirname(targetPlayDir);
          if (fs.existsSync(parentDir)) {
            if (options.link) {
              linkDirectory(playbooksDir, targetPlayDir, options.dryRun);
            } else {
              copyDirectory(playbooksDir, targetPlayDir, options.dryRun);
            }
            console.log(`   ${colors.green}✔ Synchronized playbooks to ${targetPlayDir}${colors.reset}`);
          }
        }
      }

      if (fs.existsSync(commandsDir)) {
        for (const [agent, targetCmdDir] of Object.entries(targetCommandPaths)) {
          if (!isAgentConfigurable(agent)) continue;
          const parentDir = path.dirname(targetCmdDir);
          if (fs.existsSync(parentDir)) {
            if (options.link) {
              linkDirectory(commandsDir, targetCmdDir, options.dryRun);
            } else {
              copyDirectory(commandsDir, targetCmdDir, options.dryRun);
            }
            console.log(`   ${colors.green}✔ Synchronized commands to ${targetCmdDir}${colors.reset}`);
          }
        }
      }

      if (fs.existsSync(hooksDir)) {
        for (const [agent, targetHookDir] of Object.entries(targetHookPaths)) {
          if (!isAgentConfigurable(agent)) continue;
          const parentDir = path.dirname(targetHookDir);
          if (fs.existsSync(parentDir)) {
            if (options.link) {
              linkDirectory(hooksDir, targetHookDir, options.dryRun);
            } else {
              copyDirectory(hooksDir, targetHookDir, options.dryRun);
            }
            console.log(`   ${colors.green}✔ Synchronized lifecycle hooks to ${targetHookDir}${colors.reset}`);
            if (agent === 'claude') {
              registerClaudeHooks(targetHookDir, options.dryRun);
            }
          }
        }
      }
    }
  }

  if (options.hudEnabled !== false) {
    console.log(`\n-> Configuring Heimdall HUD Statusline...`);
    syncHud(options.dryRun, { theme: options.hudTheme, lines: options.hudLines });
  }

  const herdrConfigDir = path.join(userHome, '.config', 'herdr-app');
  if (fs.existsSync(herdrConfigDir) || checkCommand('herdr-app')) {
    console.log(`\n-> Configuring Herdr-App Integration...`);
    const herdrUpdated = syncHerdrAppConfig(options.dryRun);
    if (herdrUpdated) {
      console.log(`   ${colors.green}✔ Configured Herdr-App clipboard reliability (Ctrl+V text paste, Alt+V image paste, Shift+Drag copy) & Herdr-Roundup layout${colors.reset}`);
    }
  }

  console.log(`\n${colors.bold}${colors.green}=== Heimdall Installation Complete! ===${colors.reset}\n`);
}

main().catch(err => {
  console.error(`\n${colors.red}Error executing Heimdall installer:${colors.reset}`, err);
  process.exit(1);
});
