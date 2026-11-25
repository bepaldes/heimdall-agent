'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const readline = require('node:readline/promises');

const {
  colors,
  checkCommand,
  getHermesDir,
  getOpenClawDir,
  getCopilotDir,
  getVSCodeUserDir,
  targetPaths,
  targetAgentPaths,
  targetDoctrinePaths,
  targetPlaybookPaths,
  targetCommandPaths,
  targetHookPaths,
  getAgentRootDir,
  isAgentConfigurable,
  resolveSelectedAgents,
  detectEnvironment
} = require('./harness-detection.cjs');
const { loadHeimdallState, resolveProfileTargets } = require('./profiles.cjs');
const { syncMcpServers, auditMcpServers } = require('./mcp-installer.cjs');
const { CANONICAL_MODEL_CONTEXTS, resolveModelMaxContext } = require('./model-context.cjs');
const {
  discoverInstalledHarnesses,
  discoverCustomEndpoints,
  syncGeminiModelsForHarness,
  buildOfficialHarnessModels
} = require('./harness-models.cjs');
const { syncAgentsWithModels, syncModelRegistryPlaybook } = require('./model-router.cjs');
const { syncHerdrPrograms } = require('./herdr-programs.cjs');
const { updateHermesConfigContext } = require('./hermes-context.cjs');
const { syncCatalogCounts } = require('./catalog-sync.cjs');
const {
  configureClaudeStatusLine,
  configureAntigravityStatusLine,
  configureCodexStatusLine,
  disableClaudeStatusLine,
  disableAntigravityStatusLine,
  disableCodexStatusLine,
  writeHudConfig
} = require('./hud-sync.cjs');

const ROOT_DIR = path.join(__dirname, '..');
const userHome = os.homedir();
const skillsDir = path.join(ROOT_DIR, 'skills');
const agentsDir = path.join(ROOT_DIR, 'agents');
const playbooksDir = path.join(ROOT_DIR, 'playbooks');
const toolsDir = path.join(ROOT_DIR, 'tools');
const doctrineDir = path.join(ROOT_DIR, 'doctrine');
const commandsDir = path.join(ROOT_DIR, 'commands');
const hooksDir = path.join(ROOT_DIR, 'hooks');
const modelsPath = path.join(ROOT_DIR, 'config', 'models.json');
const skillsConfigPath = path.join(ROOT_DIR, 'config', 'skills.json');

const HUD_THEMES = ['night-blue', 'heimdall', 'claude-warm', 'titanium'];

function cleanTargetDirectory(targetDir, dryRun = false, preserveList = ['.system']) {
  if (!fs.existsSync(targetDir)) return 0;
  let cleanedCount = 0;
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });

  for (const entry of entries) {
    if (preserveList.includes(entry.name)) continue;
    const fullPath = path.join(targetDir, entry.name);
    if (!dryRun) {
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) {
          fs.rmSync(fullPath);
        } else {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      } catch {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
    cleanedCount++;
  }
  return cleanedCount;
}

function registerClaudeHooks(targetHookDir, dryRun = false, claudeDir = path.join(userHome, '.claude')) {
  if (dryRun) return;
  if (!fs.existsSync(claudeDir)) return;
  const claudeSettingsPath = path.join(claudeDir, 'settings.json');
  const hooksJsonSrc = path.join(hooksDir, 'hooks.json');
  if (!fs.existsSync(hooksJsonSrc)) return;

  try {
    let rawTemplate = fs.readFileSync(hooksJsonSrc, 'utf8');
    const normalizedHookDir = targetHookDir.replace(/\\/g, '/');
    rawTemplate = rawTemplate.replace(/\{\{HOOKS_DIR\}\}/g, normalizedHookDir);
    const parsedConfig = JSON.parse(rawTemplate);

    let settings = {};
    if (fs.existsSync(claudeSettingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      } catch {
        settings = {};
      }
    }

    settings.hooks = parsedConfig.hooks;
    fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`   ${colors.green}✔ Registered Heimdall lifecycle hooks in ${claudeSettingsPath}${colors.reset}`);
  } catch (err) {
    console.log(`   ${colors.yellow}⚠ Failed to register hooks in settings.json: ${err.message}${colors.reset}`);
  }
}

function linkDirectory(src, dest, dryRun = false) {
  if (dryRun) return;
  const parentDir = path.dirname(dest);
  if (!fs.existsSync(parentDir)) return;
  if (fs.existsSync(dest)) {
    try {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        fs.rmSync(dest);
      } else {
        fs.rmSync(dest, { recursive: true, force: true });
      }
    } catch {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  }
  const symlinkType = os.platform() === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(src, dest, symlinkType);
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

function deployAgentContracts(targetDir, link = false, clean = false, dryRun = false, agentsList = null) {
  if (!fs.existsSync(agentsDir)) return 0;
  const parentDir = path.dirname(targetDir);
  if (!fs.existsSync(parentDir)) return 0;
  const allFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  const agentFiles = agentsList ? allFiles.filter(f => agentsList.includes(f)) : allFiles;

  if (link && agentFiles.length === allFiles.length) {
    linkDirectory(agentsDir, targetDir, dryRun);
    return agentFiles.length;
  }

  if (!dryRun && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (clean) {
    cleanTargetDirectory(targetDir, dryRun);
  }

  let count = 0;
  for (const file of agentFiles) {
    const src = path.join(agentsDir, file);
    const dest = path.join(targetDir, file);
    if (!dryRun) {
      fs.copyFileSync(src, dest);
    }
    count++;
  }
  return count;
}

function cleanLegacyLocalAgents(dryRun = false) {
  const parksAppAgents = path.join(path.dirname(ROOT_DIR), 'parks-app', '.claude', 'agents');
  if (fs.existsSync(parksAppAgents)) {
    try {
      if (!dryRun) {
        fs.rmSync(parksAppAgents, { recursive: true, force: true });
        linkDirectory(agentsDir, parksAppAgents, false);
      }
      return parksAppAgents;
    } catch {}
  }
  return null;
}

function deployGlobalShims(targetToolsDir, dryRun = false, entryPath = path.join(ROOT_DIR, 'setup.mjs')) {
  if (!targetToolsDir) return;
  if (!dryRun && !fs.existsSync(targetToolsDir)) {
    fs.mkdirSync(targetToolsDir, { recursive: true });
  }

  const isWin = os.platform() === 'win32';
  const resolvedEntry = path.resolve(entryPath);

  if (isWin) {
    const cmdShim = path.join(targetToolsDir, 'heimdall.cmd');
    const psShim = path.join(targetToolsDir, 'heimdall.ps1');

    const cmdContent = `@echo off\nnode "${resolvedEntry}" %*\n`;
    const psContent = `param([Parameter(ValueFromRemainingArguments=$true)]$args)\n& node "${resolvedEntry}" @args\n`;

    if (!dryRun) {
      fs.writeFileSync(cmdShim, cmdContent, 'utf8');
      fs.writeFileSync(psShim, psContent, 'utf8');
    }
  } else {
    const shShim = path.join(targetToolsDir, 'heimdall');
    const shContent = `#!/usr/bin/env sh\nexec node "${resolvedEntry}" "$@"\n`;
    if (!dryRun) {
      fs.writeFileSync(shShim, shContent, { mode: 0o755 });
    }
  }
}

function configureHermesExternalDirs(hermesDir, dryRun = false) {
  const configPath = path.join(hermesDir, 'config.yaml');
  if (!fs.existsSync(configPath)) return false;
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    if (content.includes('.agents/skills') || content.includes('.agents\\skills')) {
      return true;
    }
    if (/^\s*external_dirs:\s*$/m.test(content)) {
      const updated = content.replace(/(external_dirs:\s*[\r\n]+)/m, `$1    - ~/.agents/skills\r\n`);
      if (!dryRun) fs.writeFileSync(configPath, updated, 'utf8');
      return true;
    }
    if (content.includes('#   external_dirs:')) {
      const updated = content.replace(/#\s*external_dirs:\s*[\r\n]+#\s*-\s*~\/\.agents\/skills/, `  external_dirs:\r\n    - ~/.agents/skills`);
      if (!dryRun) fs.writeFileSync(configPath, updated, 'utf8');
      return true;
    }
  } catch {}
  return false;
}

function configureHermesContextLimit(hermesDir, modelsList = null, dryRun = false) {
  if (!fs.existsSync(path.join(hermesDir, 'config.yaml'))) return false;

  let contextMap = {};
  if (Array.isArray(modelsList) && modelsList.length > 0) {
    for (const m of modelsList) {
      if (m.id && m.context_window_tokens) {
        contextMap[m.id] = m.context_window_tokens;
      }
    }
  } else if (fs.existsSync(modelsPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
      const allModels = [...(catalog.ghostcli || []), ...(catalog.custom_proxies || []), ...(catalog.google || [])];
      for (const m of allModels) {
        const resolved = resolveModelMaxContext(m, { prioritizeMax: true });
        contextMap[m.id] = resolved.tokens;
      }
    } catch {}
  }

  for (const [id, tokens] of Object.entries({ ...contextMap })) {
    if (!id.endsWith('[1m]')) {
      contextMap[`${id}[1m]`] = tokens;
    }
  }

  for (const [id, tokens] of Object.entries(CANONICAL_MODEL_CONTEXTS)) {
    if (!contextMap[id]) contextMap[id] = tokens;
  }

  return updateHermesConfigContext(hermesDir, contextMap, dryRun);
}

/**
 * Installs or updates the Heimdall Auto-Resume mod in Herdr-App's mods directory.
 */
function syncHerdrAutoResumeMod(herdrDir, rootDir = ROOT_DIR) {
  const srcDir = path.join(rootDir, 'tools', 'herdr-mods', 'heimdall-auto-resume');
  if (!fs.existsSync(srcDir)) return false;
  const destDir = path.join(herdrDir, 'mods', 'heimdall-auto-resume');
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of ['mod.json', 'main.js']) {
    const src = path.join(srcDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(destDir, file));
    }
  }
  return true;
}

/**
 * Synchronizes non-native GhostCLI / custom proxy models from config/models.json
 * into Herdr-App's programs.json when Herdr-App and Claude Code are present.
 */
function syncHerdrProgramsFromCatalog(dryRun = false, catalog = null) {
  const herdrDir = path.join(userHome, '.config', 'herdr-app');
  if (!fs.existsSync(herdrDir)) return { updated: false, count: 0, models: [] };

  let activeCatalog = catalog;
  if (!activeCatalog) {
    if (!fs.existsSync(modelsPath)) return { updated: false, count: 0, models: [] };
    try {
      activeCatalog = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
    } catch (err) {
      process.stderr.write(`[Heimdall] Warning: Failed to parse ${modelsPath}: ${err.message}\n`);
      return { updated: false, count: 0, models: [] };
    }
  }

  return syncHerdrPrograms(herdrDir, activeCatalog, {
    dryRun,
    claudeInstalled: checkCommand('claude'),
    profiles: Object.values(loadHeimdallState().profiles || {})
  });
}

function syncHerdrAppConfig(dryRun = false, { platform = os.platform(), homeDir = userHome } = {}) {
  const herdrDir = path.join(homeDir, '.config', 'herdr-app');
  if (!fs.existsSync(herdrDir)) {
    if (dryRun) return true;
    try {
      fs.mkdirSync(herdrDir, { recursive: true });
    } catch (err) {
      process.stderr.write(`[Heimdall] Warning: Failed to create ${herdrDir}: ${err.message}\n`);
      return false;
    }
  }

  const keysPath = path.join(herdrDir, 'keys.json');
  const settingsPath = path.join(herdrDir, 'settings.json');
  const keysErrPath = path.join(herdrDir, 'keys.error');

  if (dryRun) return true;

  try {
    let keysObj = {};
    if (fs.existsSync(keysPath)) {
      try {
        const raw = fs.readFileSync(keysPath, 'utf8').replace(/^\uFEFF/, '');
        keysObj = JSON.parse(raw);
      } catch {}
    }

    if (!keysObj.terminal) keysObj.terminal = {};
    if (!keysObj.global) keysObj.global = {};

    if (platform === 'darwin') {
      keysObj.terminal['cmd-v'] = 'terminal.paste';
      keysObj.terminal['cmd-shift-v'] = 'send:\u001bv';
      keysObj.terminal['ctrl-shift-v'] = 'send:\u001bv';
      keysObj.terminal['cmd-c'] = 'terminal.copy';
      keysObj.terminal['cmd-shift-c'] = 'terminal.copy';
      delete keysObj.terminal['ctrl-v'];
      delete keysObj.terminal['alt-v'];

      keysObj.global['cmd-v'] = 'terminal.paste';
      delete keysObj.global['ctrl-v'];
      delete keysObj.global['alt-v'];
    } else {
      keysObj.terminal['ctrl-v'] = 'terminal.paste';
      keysObj.terminal['ctrl-shift-v'] = 'send:\u001bv';
      keysObj.terminal['ctrl-shift-c'] = 'terminal.copy';
      keysObj.terminal['ctrl-c'] = 'terminal.copy';
      delete keysObj.terminal['alt-v'];

      keysObj.global['ctrl-v'] = 'terminal.paste';
      delete keysObj.global['alt-v'];
    }

    if (!keysObj['layout:Herdr-Roundup']) {
      keysObj['layout:Herdr-Roundup'] = {
        'cmd-w': 'roundup-tabs.close',
        'cmd-shift-w': 'roundup-tabs.close-pane'
      };
    }

    fs.writeFileSync(keysPath, JSON.stringify(keysObj, null, 2) + '\n', 'utf8');

    if (fs.existsSync(keysErrPath)) {
      try { fs.unlinkSync(keysErrPath); } catch {}
    }

    let settingsObj = { layout: 'Herdr-Roundup', copy_on_select: true };
    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, '');
        settingsObj = JSON.parse(raw);
      } catch {}
    }

    settingsObj.copy_on_select = true;
    settingsObj.layout = 'Herdr-Roundup';

    fs.writeFileSync(settingsPath, JSON.stringify(settingsObj, null, 2) + '\n', 'utf8');

    if (homeDir === userHome) {
      syncHerdrProgramsFromCatalog(false);
    }
    syncHerdrAutoResumeMod(herdrDir);
    return true;
  } catch (err) {
    process.stderr.write(`[Heimdall] Warning: Failed to update Herdr-App config in ${herdrDir}: ${err.message}\n`);
    return false;
  }
}

function runHerdrApp(options) {
  console.log(`${colors.bold}${colors.cyan}=== Herdr-App Configuration & Clipboard Fix ===${colors.reset}\n`);
  const herdrDir = path.join(userHome, '.config', 'herdr-app');
  if (options.dryRun) {
    console.log(`[DRY RUN] Would configure Herdr-App clipboard reliability & Herdr-Roundup layout at:`);
    console.log(`  - ${path.join(herdrDir, 'keys.json')}`);
    console.log(`  - ${path.join(herdrDir, 'settings.json')}`);
    console.log(`  - ${path.join(herdrDir, 'programs.json')}`);
    console.log(`  - ${path.join(herdrDir, 'mods', 'heimdall-auto-resume')}`);
    return true;
  }

  const success = syncHerdrAppConfig(false);
  if (success) {
    if (os.platform() === 'darwin') {
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Cmd+V mapped to text paste (terminal.paste, UTF-8 clean)`);
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Cmd+Shift+V & Ctrl+Shift+V routed to image paste (send:\\u001bv); Ctrl+V left native`);
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Cmd+C / Cmd+Shift+C mapped to copy (terminal.copy)`);
    } else {
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Ctrl+V mapped to text paste (terminal.paste, UTF-8 clean)`);
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Alt+V & Ctrl+Shift+V routed to native agent image paste (send:\\u001bv)`);
      console.log(`  ${colors.green}✔ Configured keys.json:${colors.reset} Ctrl+C / Ctrl+Shift+C mapped to copy (terminal.copy)`);
    }
    console.log(`  ${colors.green}✔ Configured settings.json:${colors.reset} 'copy_on_select: true' and 'layout: Herdr-Roundup' active`);
    console.log(`  ${colors.green}✔ Configured programs.json:${colors.reset} Registered GhostCLI proxy models for '+' Start an agent menu`);
    console.log(`  ${colors.green}✔ Installed mod:${colors.reset} heimdall-auto-resume (auto-resume + manual Resume Parked bar)`);
    const shortcutHint = os.platform() === 'darwin'
      ? 'Shortcuts: On macOS in Claude Code, press Cmd+Shift+V or Ctrl+V to paste images; press Cmd+V for text.'
      : 'Shortcuts: In Claude Code on Windows/Linux, press Alt+V (or Ctrl+Shift+V) to paste images; press Ctrl+V for text.';
    console.log(`\n${colors.dim}${shortcutHint}${colors.reset}\n`);
    return true;
  } else {
    console.log(`  ${colors.red}✖ Failed to update Herdr-App configuration at ${herdrDir}.${colors.reset}\n`);
    return false;
  }
}

function syncHud(dryRun = false, hudOptions = {}) {
  const hudScript = path.join(toolsDir, 'heimdall-hud.mjs');
  if (!fs.existsSync(hudScript)) return false;
  let updated = false;

  const allowedAgents = Array.isArray(hudOptions.agents) && hudOptions.agents.length > 0
    ? hudOptions.agents
    : resolveSelectedAgents({}, loadHeimdallState());
  const isAllowed = (agent) => allowedAgents.includes('all') || allowedAgents.includes(agent);

  if (hudOptions.off) {
    if (isAllowed('claude') && disableClaudeStatusLine(dryRun)) {
      console.log(`   ${colors.yellow}✔ Disabled Heimdall HUD statusLine in Claude Code (~/.claude/settings.json)${colors.reset}`);
      updated = true;
    }
    if (isAllowed('gemini') && disableAntigravityStatusLine(dryRun)) {
      console.log(`   ${colors.yellow}✔ Disabled Heimdall HUD statusLine in Antigravity (~/.gemini/antigravity-cli/settings.json)${colors.reset}`);
      updated = true;
    }
    if (isAllowed('codex') && disableCodexStatusLine(dryRun)) {
      console.log(`   ${colors.yellow}✔ Disabled [tui] status_line in Codex CLI (~/.codex/config.toml)${colors.reset}`);
      updated = true;
    }
    return updated;
  }

  if (hudOptions.theme || hudOptions.lines) {
    writeHudConfig({ theme: hudOptions.theme, lines: hudOptions.lines }, dryRun);
    console.log(`   ${colors.green}✔ Saved HUD preferences (~/.heimdall-hud.json): theme=${hudOptions.theme || 'night-blue'}, lines=${hudOptions.lines || 2}${colors.reset}`);
    updated = true;
  }

  if (isAllowed('claude') && configureClaudeStatusLine(hudScript, dryRun)) {
    console.log(`   ${colors.green}✔ Configured Heimdall HUD statusLine in Claude Code (~/.claude/settings.json)${colors.reset}`);
    updated = true;
  }
  if (isAllowed('gemini') && configureAntigravityStatusLine(hudScript, dryRun)) {
    console.log(`   ${colors.green}✔ Configured Heimdall HUD statusLine in Antigravity (~/.gemini/antigravity-cli/settings.json)${colors.reset}`);
    updated = true;
  }
  if (isAllowed('codex') && configureCodexStatusLine(dryRun)) {
    console.log(`   ${colors.green}✔ Configured native [tui] status_line in Codex CLI (~/.codex/config.toml)${colors.reset}`);
    updated = true;
  }

  if (Array.isArray(hudOptions.profiles)) {
    for (const prof of hudOptions.profiles) {
      if (prof.tool === 'claude' && configureClaudeStatusLine(hudScript, dryRun, prof.dir)) {
        console.log(`   ${colors.green}✔ Configured HUD for profile ${prof.id}${colors.reset}`);
        updated = true;
      } else if (prof.tool === 'agy' && configureAntigravityStatusLine(hudScript, dryRun, prof.dir)) {
        console.log(`   ${colors.green}✔ Configured HUD for profile ${prof.id}${colors.reset}`);
        updated = true;
      } else if (prof.tool === 'codex' && configureCodexStatusLine(dryRun, prof.dir)) {
        console.log(`   ${colors.green}✔ Configured HUD for profile ${prof.id}${colors.reset}`);
        updated = true;
      }
    }
  }
  return updated;
}

async function probeModelHealth(messagesUrl, apiKey, modelId, timeoutMs = 20000) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(messagesUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'hi' }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) return 'alive';
      const isRetryable = res.status === 408 || res.status === 429 || res.status >= 500;
      if (!isRetryable || attempt === 1) return 'dead';
    } catch {
      clearTimeout(timeout);
      if (attempt === 1) return 'slow';
    }
  }
  return 'slow';
}

function deduplicateModelsByMaxContext(modelsList = []) {
  const byId = new Map();
  for (const m of modelsList) {
    if (!m || typeof m !== 'object') continue;
    const rawId = m.id || m.slug;
    if (!rawId || typeof rawId !== 'string') continue;

    const id = rawId.replace(/\[1m\]$/i, '');
    const resolved = resolveModelMaxContext(m, { prioritizeMax: true });
    const displayName = (m.display_name || id).replace(/\s*\(1M\)$/i, '');
    const description = m.description || '';
    const isVariant = /\[1m\]$/i.test(rawId);

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, {
        id,
        displayName,
        context: resolved.label,
        context_window_tokens: resolved.tokens,
        description
      });
    } else {
      if (resolved.tokens > existing.context_window_tokens) {
        existing.context_window_tokens = resolved.tokens;
        existing.context = resolved.label;
      }
      if (!isVariant && description) {
        existing.description = description;
        existing.displayName = displayName;
      } else if (!existing.description && description) {
        existing.description = description;
      }
    }
  }
  return Array.from(byId.values());
}

async function syncModelsFromEndpoint({ quiet = false } = {}) {
  if (!quiet) console.log(`${colors.cyan}${colors.bold}=== Multi-Harness Live Model Synchronization ===${colors.reset}\n`);

  const harnesses = discoverInstalledHarnesses({ userHome });
  const installedList = Object.values(harnesses).filter(h => h.installed && h.deliversModels !== false);

  if (!quiet) {
    if (installedList.length === 0) {
      console.log(`${colors.yellow}No model-delivering AI harnesses detected on this machine.${colors.reset}\n`);
    } else {
      console.log(`${colors.bold}Detected Model Harnesses on System (${installedList.length}):${colors.reset}`);
      for (const h of installedList) {
        const modelHint = h.activeModelDisplay || h.activeModel ? ` (model: ${colors.cyan}${h.activeModelDisplay || h.activeModel}${colors.reset})` : '';
        console.log(`  • ${colors.green}${h.label}${colors.reset} — ${colors.dim}${h.baseUrl || h.mode}${colors.reset}${modelHint}`);
      }
      console.log('');
    }
  }

  let currentModels = {};
  if (fs.existsSync(modelsPath)) {
    try {
      currentModels = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
    } catch {}
  }

  let catalogChanged = false;

  const customEndpoints = discoverCustomEndpoints(harnesses, process.env);
  const aggregatedCustomModels = new Map();

  for (const ep of customEndpoints) {
    if (!quiet) {
      console.log(`Probing Custom Endpoint [${colors.magenta}${ep.harnesses.join(', ')}${colors.reset}]: ${colors.yellow}${ep.modelsUrl}${colors.reset}...`);
    }
    const getHeaders = { Accept: 'application/json' };
    if (ep.apiKey) {
      getHeaders['Authorization'] = `Bearer ${ep.apiKey}`;
      getHeaders['x-api-key'] = ep.apiKey;
    }

    try {
      const probeController = new AbortController();
      const probeTimeout = setTimeout(() => probeController.abort(), 10000);
      const res = await fetch(ep.modelsUrl, { headers: getHeaders, signal: probeController.signal });
      clearTimeout(probeTimeout);

      if (res.ok) {
        const data = await res.json();
        const rawModelsList = data.data || data.models || [];
        const modelsList = deduplicateModelsByMaxContext(rawModelsList);
        if (!quiet) {
          console.log(`${colors.green}✔ Discovered ${modelsList.length} unique live model(s) from ${ep.modelsUrl}${colors.reset}`);
        }

        let liveSpecs = modelsList;
        const isAnthropicGateway = ep.modelsUrl.includes('ghostcli.cloud') || ep.harnesses.includes('claude');
        if (ep.apiKey && isAnthropicGateway && modelsList.length > 0) {
          if (!quiet) console.log(`Checking live health of discovered models...`);
          const baseUrl = ep.modelsUrl.replace(/\/v1\/models\/?$/, '').replace(/\/models\/?$/, '');
          const messagesUrl = `${baseUrl}/v1/messages`;

          const testedModels = await Promise.all(modelsList.map(async m => {
            const status = await probeModelHealth(messagesUrl, ep.apiKey, m.id, 20000);
            return { spec: m, modelId: m.id, status };
          }));

          const liveModels = testedModels.filter(t => t.status !== 'dead');
          const deadModels = testedModels.filter(t => t.status === 'dead');
          const slowModels = testedModels.filter(t => t.status === 'slow');

          if (deadModels.length > 0 && !quiet) {
            console.log(`${colors.yellow}⚠ Filtered out ${deadModels.length} unresponsive model(s): ${deadModels.map(d => d.modelId).join(', ')}${colors.reset}`);
          }
          if (slowModels.length > 0 && !quiet) {
            console.log(`${colors.yellow}⚠ Slow / timed-out model(s) preserved: ${slowModels.map(s => s.modelId).join(', ')}${colors.reset}`);
          }
          liveSpecs = liveModels.map(({ spec }) => spec);
        }

        for (const spec of liveSpecs) {
          if (!aggregatedCustomModels.has(spec.id)) {
            aggregatedCustomModels.set(spec.id, spec);
          }
        }
      } else if (!quiet) {
        console.log(`${colors.yellow}Notice: ${ep.modelsUrl} returned HTTP ${res.status}. Preserving cached models.${colors.reset}`);
      }
    } catch (err) {
      if (!quiet) {
        console.log(`${colors.yellow}Notice: Could not reach ${ep.modelsUrl} (${err.message}). Preserving cached models.${colors.reset}`);
      }
    }
    if (!quiet) console.log('');
  }

  const mappedCustom = Array.from(aggregatedCustomModels.values());
  const CODEX_MODEL_ALLOWLIST = new Set([
    'gpt-6-astra',
    'z-ai/glm-5.3',
    'z-ai/glm-5.3-flash'
  ]);
  const filteredCustom = mappedCustom.filter(m => CODEX_MODEL_ALLOWLIST.has(m.id));
  if (mappedCustom.length > 0) {
    currentModels.custom_proxies = filteredCustom;
    currentModels.ghostcli = filteredCustom;
    catalogChanged = true;
  }

  const geminiResult = await syncGeminiModelsForHarness(harnesses.gemini, currentModels.google || []);
  if (geminiResult.updated) {
    currentModels.google = geminiResult.models;
    catalogChanged = true;
    if (!quiet) {
      const liveNote = geminiResult.liveCount > 0 ? ` (${geminiResult.liveCount} live from Google GenAI API)` : '';
      const activeNote = geminiResult.activeModel ? ` | Active: ${colors.cyan}${geminiResult.activeModel}${colors.reset}` : '';
      console.log(`${colors.green}✔ Synchronized ${geminiResult.models.length} Google Gemini model(s) [${geminiResult.source}]${liveNote}${activeNote}${colors.reset}`);
    }
  }

  const officialSections = buildOfficialHarnessModels(harnesses);
  for (const [sectionKey, sectionModels] of Object.entries(officialSections)) {
    currentModels[sectionKey] = sectionModels;
    catalogChanged = true;
    if (!quiet) {
      console.log(`${colors.green}✔ Registered ${sectionModels.length} official ${sectionKey} model(s) for installed harness${colors.reset}`);
    }
  }

  if (catalogChanged) {
    fs.writeFileSync(modelsPath, JSON.stringify(currentModels, null, 2) + '\n');
    if (!quiet) {
      console.log(`\n${colors.green}✔ Synchronized multi-harness catalog to config/models.json${colors.reset}\n`);
      if (mappedCustom.length > 0) {
        console.log(`${colors.bold}Custom Proxy / Gateway Models (${mappedCustom.length}):${colors.reset}`);
        mappedCustom.forEach(m => {
          const idStr = `${colors.cyan}${m.id.padEnd(24)}${colors.reset}`;
          const ctxStr = `${colors.yellow}[${m.context}]${colors.reset}`;
          const descStr = m.description ? `${colors.dim}— ${m.description}${colors.reset}` : '';
          console.log(`  • ${idStr} ${ctxStr} ${descStr}`);
        });
        console.log('');
      }
      if (Array.isArray(currentModels.google) && currentModels.google.length > 0) {
        console.log(`${colors.bold}Google Gemini / Antigravity Models (${currentModels.google.length}):${colors.reset}`);
        currentModels.google.forEach(m => {
          const idStr = `${colors.cyan}${m.id.padEnd(24)}${colors.reset}`;
          const ctxStr = `${colors.yellow}[${m.context || '1M'}]${colors.reset}`;
          const descStr = m.specialization ? `${colors.dim}— ${m.specialization}${colors.reset}` : '';
          console.log(`  • ${idStr} ${ctxStr} ${descStr}`);
        });
        console.log('');
      }
    }

    syncAgentsWithModels(ROOT_DIR, false);
    syncModelRegistryPlaybook(ROOT_DIR, false);

    const herdrProgramsRes = syncHerdrProgramsFromCatalog(false, currentModels);
    if (herdrProgramsRes.updated && !quiet) {
      console.log(`${colors.green}✔ Registered ${herdrProgramsRes.count} GhostCLI proxy model(s) in Herdr-App programs.json${colors.reset}\n`);
    }

    const hermesDir = getHermesDir();
    if (fs.existsSync(hermesDir) && mappedCustom.length > 0) {
      const hermesContextUpdated = configureHermesContextLimit(hermesDir, mappedCustom);
      if (hermesContextUpdated && !quiet) {
        console.log(`${colors.green}✔ Enforced maximum context limits in Hermes config.yaml${colors.reset}\n`);
      }
    }
  } else if (!quiet) {
    console.log(`Using configured models from ${modelsPath}.\n`);
  }
}

async function convergeModelAwareArtifacts(options) {
  if (!options.dryRun) {
    await syncModelsFromEndpoint({ quiet: true });
  }
  const agentsSync = syncAgentsWithModels(ROOT_DIR, options.dryRun);
  const playbookSync = syncModelRegistryPlaybook(ROOT_DIR, options.dryRun);
  if (agentsSync?.modified) {
    console.log(`   ${colors.green}✔ Synchronized capability-based model routing in config/agents.json (${agentsSync.agentCount} agents)${colors.reset}`);
  }
  if (playbookSync?.modified) {
    console.log(`   ${colors.green}✔ Synchronized live model matrix in playbooks/06-model-registry-matrix.md${colors.reset}`);
  }
}

function syncTargetArtifacts({ label, targetDir, targetAgentDir, targetDocFile, targetPlayDir, targetCmdDir, targetHookDir, claudeRootDir, allAvailableSkills, allAvailableAgents, dryRun }) {
  const srcDoc = path.join(doctrineDir, 'AGENTS.md');
  if (targetDocFile && fs.existsSync(srcDoc) && !dryRun) {
    const parentDir = path.dirname(targetDocFile);
    if (fs.existsSync(parentDir)) fs.copyFileSync(srcDoc, targetDocFile);
  }

  if (targetPlayDir && fs.existsSync(playbooksDir)) {
    const parentDir = path.dirname(targetPlayDir);
    if (fs.existsSync(parentDir)) linkDirectory(playbooksDir, targetPlayDir, dryRun);
  }

  if (targetCmdDir && fs.existsSync(commandsDir)) {
    const parentDir = path.dirname(targetCmdDir);
    if (fs.existsSync(parentDir)) linkDirectory(commandsDir, targetCmdDir, dryRun);
  }

  if (targetHookDir && fs.existsSync(hooksDir)) {
    const parentDir = path.dirname(targetHookDir);
    if (fs.existsSync(parentDir)) {
      linkDirectory(hooksDir, targetHookDir, dryRun);
      if (claudeRootDir) registerClaudeHooks(targetHookDir, dryRun, claudeRootDir);
    }
  }

  const exists = fs.existsSync(targetDir);
  const currentSkills = exists
    ? fs.readdirSync(targetDir, { withFileTypes: true }).filter(d => d.name !== '.system')
    : [];

  const agentExists = targetAgentDir && fs.existsSync(targetAgentDir);
  const currentAgents = agentExists
    ? fs.readdirSync(targetAgentDir).filter(f => f.endsWith('.md'))
    : [];

  if (!exists || currentSkills.length < allAvailableSkills.length || !agentExists || currentAgents.length < allAvailableAgents.length) {
    console.log(`-> Syncing target: ${colors.bold}${label}${colors.reset}`);
    if (!dryRun && !fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    let count = 0;
    for (const skill of allAvailableSkills) {
      linkDirectory(path.join(skillsDir, skill), path.join(targetDir, skill), dryRun);
      count++;
    }

    let agentCount = 0;
    if (targetAgentDir) {
      agentCount = deployAgentContracts(targetAgentDir, true, false, dryRun);
    }

    console.log(`   ${colors.green}✔ Linked ${count} skills and ${agentCount} predefined agents via Live Junctions${colors.reset}\n`);
    return true;
  }

  console.log(`  ${colors.green}✔${colors.reset} ${label.padEnd(14)}: 100% in sync (${currentSkills.length} skills, ${currentAgents.length} agents active)`);
  return false;
}

async function runSync(options, detected) {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Auto-Sync Engine ===${colors.reset}\n`);

  const countSyncResult = syncCatalogCounts(ROOT_DIR, options.dryRun);
  if (countSyncResult && countSyncResult.modified) {
    console.log(`   ${colors.green}✔ Synchronized documentation & catalog counts (${countSyncResult.suiteCount} suites / ${countSyncResult.skillCount} modules)${colors.reset}\n`);
  }

  await convergeModelAwareArtifacts(options, detected);

  const savedState = loadHeimdallState();
  const allowedAgents = resolveSelectedAgents(options, savedState);
  const isAllowed = (agent) => allowedAgents.includes('all') || allowedAgents.includes(agent);

  const allProfiles = Object.values(savedState.profiles || {});
  const selectedProfileIds = Array.isArray(options.profiles) && options.profiles.length > 0
    ? options.profiles
    : (Array.isArray(savedState.selectedProfiles) ? savedState.selectedProfiles : null);
  const activeProfiles = selectedProfileIds && !selectedProfileIds.includes('all')
    ? allProfiles.filter(p => selectedProfileIds.includes(p.id))
    : allProfiles;

  console.log(`Scanning active harnesses (scope: ${allowedAgents.join(', ')})...\n`);

  const allAvailableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const allAvailableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];

  let syncedAny = false;

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    if (!isAllowed(agent)) continue;
    if (!isAgentConfigurable(agent)) continue;

    if (agent === 'hermes') {
      configureHermesExternalDirs(getHermesDir(), options.dryRun);
      const hermesContextUpdated = configureHermesContextLimit(getHermesDir(), null, options.dryRun);
      if (hermesContextUpdated) {
        console.log(`   ${colors.green}✔ Enforced maximum context limits in Hermes config.yaml${colors.reset}`);
      }
    }

    const didSync = syncTargetArtifacts({
      label: agent.toUpperCase(),
      targetDir,
      targetAgentDir: targetAgentPaths[agent],
      targetDocFile: targetDoctrinePaths[agent],
      targetPlayDir: targetPlaybookPaths[agent],
      targetCmdDir: targetCommandPaths[agent],
      targetHookDir: targetHookPaths[agent],
      claudeRootDir: agent === 'claude' ? path.dirname(targetDir) : null,
      allAvailableSkills,
      allAvailableAgents,
      dryRun: options.dryRun
    });
    if (didSync) syncedAny = true;
  }

  for (const prof of activeProfiles) {
    const t = resolveProfileTargets(prof);
    const didSync = syncTargetArtifacts({
      label: `profile:${prof.id}`,
      targetDir: t.skillsDir,
      targetAgentDir: t.agentsDir,
      targetDocFile: t.doctrineFile,
      targetPlayDir: t.playbooksDir,
      targetCmdDir: t.commandsDir,
      targetHookDir: t.hooksDir,
      claudeRootDir: prof.tool === 'claude' ? t.rootDir : null,
      allAvailableSkills,
      allAvailableAgents,
      dryRun: options.dryRun
    });
    if (didSync) syncedAny = true;
  }

  const mcpSynced = syncMcpServers(detected, { ...options, agents: allowedAgents });
  if (mcpSynced) syncedAny = true;

  if (options.hudEnabled !== false) {
    if (syncHud(options.dryRun, { theme: options.hudTheme, lines: options.hudLines, agents: allowedAgents, profiles: activeProfiles })) {
      syncedAny = true;
    }
  }

  const herdrConfigDir = path.join(userHome, '.config', 'herdr-app');
  if (fs.existsSync(herdrConfigDir) || checkCommand('herdr-app')) {
    if (syncHerdrAppConfig(options.dryRun)) syncedAny = true;
  }

  const activeToolsDir = options.toolsDir || detected.pathCandidates[0];
  if (activeToolsDir && fs.existsSync(activeToolsDir)) {
    deployGlobalShims(activeToolsDir, options.dryRun);
  }

  const srcDoc = path.join(doctrineDir, 'AGENTS.md');
  if (fs.existsSync(srcDoc) && !options.dryRun) {
    for (const cand of detected.doctrineCandidates) {
      if (fs.existsSync(cand)) {
        try { fs.copyFileSync(srcDoc, cand); } catch {}
      }
    }
  }

  if (syncedAny) {
    console.log(`\n${colors.bold}${colors.green}✔ Auto-sync complete! All active AI tools are now synchronized.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bold}${colors.green}✔ All detected AI tools are already up to date.${colors.reset}\n`);
  }
}

function runAudit(options) {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Environment Audit ===${colors.reset}\n`);

  const detected = detectEnvironment();
  console.log(`${colors.bold}Detected Tools on Machine:${colors.reset}`);
  console.log(`  Claude Code CLI:    ${detected.tools.claude ? colors.green + detected.tools.claude + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.claude}${colors.reset}`);
  console.log(`  Google Antigravity: ${detected.tools.agy ? colors.green + detected.tools.agy + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.gemini}${colors.reset}`);
  console.log(`  OpenAI Codex CLI:   ${detected.tools.codex ? colors.green + detected.tools.codex + colors.reset : colors.dim + 'Not on PATH' + colors.reset}`);
  console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.codex}${colors.reset}`);
  if (detected.tools.hermes || fs.existsSync(getHermesDir())) {
    console.log(`  Hermes Agent:       ${detected.tools.hermes ? colors.green + detected.tools.hermes + colors.reset : colors.dim + getHermesDir() + colors.reset}`);
    console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.hermes}${colors.reset}`);
  }
  if (detected.tools.openclaw || fs.existsSync(getOpenClawDir())) {
    console.log(`  OpenClaw Agent:     ${detected.tools.openclaw ? colors.green + detected.tools.openclaw + colors.reset : colors.dim + getOpenClawDir() + colors.reset}`);
    console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.openclaw}${colors.reset}`);
  }
  if (detected.tools.vscode || fs.existsSync(getVSCodeUserDir()) || fs.existsSync(getCopilotDir())) {
    console.log(`  VS Code (Copilot):  ${detected.tools.vscode ? colors.green + detected.tools.vscode + colors.reset : colors.dim + getVSCodeUserDir() + colors.reset}`);
    console.log(`                      Endpoint: ${colors.cyan}${detected.endpoints.vscode}${colors.reset}`);
  }
  console.log(`  Claude Desktop:     ${detected.tools.claudeDesktop ? colors.green + detected.tools.claudeDesktop + colors.reset : colors.dim + 'Not found' + colors.reset}`);
  const herdrDir = path.join(userHome, '.config', 'herdr-app');
  if (fs.existsSync(herdrDir) || checkCommand('herdr-app')) {
    console.log(`  Herdr-App IDE:      ${colors.green}Detected (${herdrDir})${colors.reset}`);
  }
  console.log('');

  const availableSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const availableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];

  let suiteCountText = '';
  if (fs.existsSync(skillsConfigPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(skillsConfigPath, 'utf8'));
      if (catalog.totalSuites) {
        suiteCountText = `${catalog.totalSuites} Suites (${availableSkills.length} modular capabilities)`;
      }
    } catch {}
  }
  if (!suiteCountText) {
    suiteCountText = `${availableSkills.length} modular capabilities`;
  }

  console.log(`Repository Canonical Skills:    ${colors.green}${suiteCountText}${colors.reset}`);
  console.log(`Repository Predefined Agents:   ${colors.green}${availableAgents.length} Specialized Personas${colors.reset}\n`);

  const unlinkedTools = [];

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    const rootDir = getAgentRootDir(agent);
    const targetAgentDir = targetAgentPaths[agent];
    if (isAgentConfigurable(agent)) {
      if (fs.existsSync(targetDir)) {
        const entries = fs.readdirSync(targetDir, { withFileTypes: true })
          .filter(d => (d.isDirectory() || d.isSymbolicLink()) && d.name !== '.system');

        let linkedCount = 0;
        for (const entry of entries) {
          try {
            if (fs.lstatSync(path.join(targetDir, entry.name)).isSymbolicLink()) {
              linkedCount++;
            }
          } catch {}
        }

        const installed = entries.map(d => d.name);
        const missing = availableSkills.filter(s => !installed.includes(s));
        const statusColor = missing.length === 0 ? colors.green : colors.yellow;
        const linkLabel = linkedCount === installed.length && installed.length > 0
          ? ` (${colors.cyan}Live Junctions / Single Source of Truth${colors.reset})`
          : linkedCount > 0 ? ` (${linkedCount} linked, ${installed.length - linkedCount} copies)` : ' (Static copies)';

        const agentCount = fs.existsSync(targetAgentDir)
          ? fs.readdirSync(targetAgentDir).filter(f => f.endsWith('.md')).length
          : 0;

        console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${statusColor}${installed.length} skills, ${agentCount} agents${colors.reset} in ${rootDir}${linkLabel}`);

        if (installed.length === 0) {
          unlinkedTools.push(agent);
        }
      } else {
        console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${colors.yellow}INSTALLED BUT NOT LINKED (${targetDir})${colors.reset}`);
        unlinkedTools.push(agent);
      }
    } else {
      console.log(`  ${colors.bold}${agent.toUpperCase().padEnd(8)}${colors.reset} -> ${colors.dim}Not found (${rootDir || 'unconfigured'})${colors.reset}`);
    }
  }

  if (unlinkedTools.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}[!] Notice:${colors.reset} Installed tools missing skill/agent links: ${unlinkedTools.join(', ')}`);
    console.log(`    Run ${colors.cyan}heimdall sync${colors.reset} to link automatically in 1 second.`);
  }

  const activeToolsDir = options.toolsDir || detected.pathCandidates[0];
  console.log(`\n${colors.bold}Cross-Agent Bridge Tools Directory:${colors.reset}`);
  if (activeToolsDir && fs.existsSync(activeToolsDir)) {
    const tools = fs.readdirSync(activeToolsDir).filter(f => f.includes('bridge') || f.includes('heimdall'));
    console.log(`  ${colors.green}Found ${tools.length} active scripts in ${activeToolsDir}${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}Tools directory unconfigured or empty (${activeToolsDir || 'None'})${colors.reset}`);
  }

  const activeDoctrine = options.doctrinePath || (detected.doctrineCandidates.find(p => fs.existsSync(p)) || detected.doctrineCandidates[0]);
  console.log(`\n${colors.bold}Universal Doctrine & Playbooks:${colors.reset}`);
  if (fs.existsSync(activeDoctrine)) {
    console.log(`  ${colors.green}Active at ${activeDoctrine}${colors.reset}`);
  } else {
    console.log(`  ${colors.dim}Not found at ${activeDoctrine}${colors.reset}`);
  }

  console.log(`\n${colors.bold}Model Context Protocol (MCP) Servers:${colors.reset}`);
  const mcpReport = auditMcpServers();
  if (mcpReport.length > 0) {
    for (const item of mcpReport) {
      const status = item.configured ? `${colors.green}Configured${colors.reset}` : `${colors.dim}Not configured${colors.reset}`;
      console.log(`  ${item.harness.padEnd(20)} [${item.server}] -> ${status}`);
    }
  } else {
    console.log(`  ${colors.dim}No MCP server harnesses detected.${colors.reset}`);
  }

  console.log('');
}

function isHeimdallInstalled(customTargetPaths = targetPaths) {
  const allAvailableSkills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];
  const skillSet = new Set(allAvailableSkills);
  const targets = [];
  let totalSkills = 0;

  for (const [agent, targetDir] of Object.entries(customTargetPaths)) {
    if (!fs.existsSync(targetDir)) continue;
    try {
      const entries = fs.readdirSync(targetDir);
      let count = 0;
      for (const name of entries) {
        if (name !== '.system' && skillSet.has(name)) {
          count++;
        }
      }
      if (count > 0) {
        targets.push(agent);
        totalSkills += count;
      }
    } catch (err) {
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        console.warn(`${colors.yellow}Warning: Permission denied inspecting ${targetDir}${colors.reset}`);
      }
    }
  }

  return {
    installed: totalSkills > 0,
    targets,
    totalSkills
  };
}

async function runUninstall(options, detected, existingRl = null) {
  console.log(`${colors.bold}${colors.cyan}=== Heimdall Uninstallation ===${colors.reset}\n`);

  if (!options.yes) {
    const rl = existingRl || readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      const confirm = await rl.question(`Are you sure you want to remove Heimdall skills and agents from all harnesses? (y/N): `);
      const answer = confirm.trim().toLowerCase();
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Uninstallation cancelled.');
        return;
      }
    } finally {
      if (!existingRl) rl.close();
    }
  }

  const allAvailableSkills = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
    : [];
  const skillSet = new Set(allAvailableSkills);

  const allAvailableAgents = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];
  const agentSet = new Set(allAvailableAgents);

  let totalRemovedSkills = 0;
  let totalRemovedAgents = 0;

  for (const [agent, targetDir] of Object.entries(targetPaths)) {
    if (!fs.existsSync(targetDir)) continue;
    let removed = 0;
    try {
      const dirStat = fs.lstatSync(targetDir);
      if (dirStat.isSymbolicLink()) {
        if (!options.dryRun) {
          try { fs.unlinkSync(targetDir); } catch { fs.rmdirSync(targetDir); }
        }
        removed = skillSet.size;
      } else {
        const entries = fs.readdirSync(targetDir);
        for (const name of entries) {
          if (name === '.system') continue;
          if (skillSet.has(name)) {
            const itemPath = path.join(targetDir, name);
            try {
              if (!options.dryRun) {
                const stat = fs.lstatSync(itemPath);
                if (stat.isSymbolicLink() || stat.isFile()) {
                  try { fs.unlinkSync(itemPath); } catch { fs.rmdirSync(itemPath); }
                } else if (stat.isDirectory()) {
                  fs.rmSync(itemPath, { recursive: true, force: true });
                }
              }
              removed++;
            } catch {}
          }
        }
      }
    } catch {}
    if (removed > 0) {
      console.log(`  ${colors.green}✔${colors.reset} Removed ${removed} skills from ${agent.toUpperCase()} (${targetDir})`);
      totalRemovedSkills += removed;
    }
  }

  for (const [agent, targetAgentDir] of Object.entries(targetAgentPaths)) {
    if (!fs.existsSync(targetAgentDir)) continue;
    let removed = 0;
    try {
      const dirStat = fs.lstatSync(targetAgentDir);
      if (dirStat.isSymbolicLink()) {
        if (!options.dryRun) {
          try { fs.unlinkSync(targetAgentDir); } catch { fs.rmdirSync(targetAgentDir); }
        }
        removed = agentSet.size;
      } else {
        const entries = fs.readdirSync(targetAgentDir);
        for (const file of entries) {
          if (agentSet.has(file)) {
            const itemPath = path.join(targetAgentDir, file);
            try {
              if (!options.dryRun) {
                const stat = fs.lstatSync(itemPath);
                if (stat.isSymbolicLink() || stat.isFile()) {
                  try { fs.unlinkSync(itemPath); } catch { fs.rmdirSync(itemPath); }
                } else if (stat.isDirectory()) {
                  fs.rmSync(itemPath, { recursive: true, force: true });
                } else {
                  fs.unlinkSync(itemPath);
                }
              }
              removed++;
            } catch {}
          }
        }
      }
    } catch {}
    if (removed > 0) {
      console.log(`  ${colors.green}✔${colors.reset} Removed ${removed} agent personas from ${agent.toUpperCase()} (${targetAgentDir})`);
      totalRemovedAgents += removed;
    }
  }

  for (const [agent, targetHookDir] of Object.entries(targetHookPaths)) {
    if (!fs.existsSync(targetHookDir)) continue;
    try {
      if (!options.dryRun) {
        const dirStat = fs.lstatSync(targetHookDir);
        if (dirStat.isSymbolicLink()) {
          try { fs.unlinkSync(targetHookDir); } catch { fs.rmdirSync(targetHookDir); }
        } else {
          fs.rmSync(targetHookDir, { recursive: true, force: true });
        }
      }
      console.log(`  ${colors.green}✔${colors.reset} Removed hooks from ${agent.toUpperCase()} (${targetHookDir})`);
    } catch {}
  }

  const claudeSettingsPath = path.join(userHome, '.claude', 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      if (settings.hooks) {
        if (!options.dryRun) {
          delete settings.hooks;
          fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
        }
        console.log(`  ${colors.green}✔${colors.reset} Unregistered hooks from ${claudeSettingsPath}`);
      }
    } catch {}
  }

  disableClaudeStatusLine(options.dryRun);
  disableAntigravityStatusLine(options.dryRun);
  disableCodexStatusLine(options.dryRun);

  console.log(`\n${colors.bold}${colors.green}Uninstallation Complete:${colors.reset} Removed ${totalRemovedSkills} skill bindings and ${totalRemovedAgents} agent personas across harnesses.\n`);
}

module.exports = {
  HUD_THEMES,
  cleanTargetDirectory,
  registerClaudeHooks,
  linkDirectory,
  copyDirectory,
  deployAgentContracts,
  cleanLegacyLocalAgents,
  deployGlobalShims,
  configureHermesExternalDirs,
  configureHermesContextLimit,
  syncHerdrAppConfig,
  syncHerdrAutoResumeMod,
  syncHerdrProgramsFromCatalog,
  runHerdrApp,
  syncHud,
  probeModelHealth,
  deduplicateModelsByMaxContext,
  syncModelsFromEndpoint,
  convergeModelAwareArtifacts,
  runSync,
  runAudit,
  isHeimdallInstalled,
  runUninstall
};
