const fs = require('fs');
const os = require('os');
const path = require('path');
const { inferModelFamily } = require('./model-router.cjs');

const EXCLUDED_MENU_FAMILIES = new Set(['anthropic', 'openai', 'google', 'z-ai']);

const HERDR_BUILTIN_AGENTS = {
  claude: { bin: 'claude', configDirs: ['.claude'] },
  codex: { bin: 'codex', configDirs: ['.codex'] },
  pi: { bin: 'pi', configDirs: ['.pi'] },
  pig: { bin: 'pig', configDirs: [] },
  opencode: { bin: 'opencode', configDirs: ['.config/opencode'] },
  cursor: { bin: 'agent', altBins: ['cursor-agent'], configDirs: ['.cursor'] },
  copilot: { bin: 'copilot', configDirs: ['.copilot'] },
  amp: { bin: 'amp', configDirs: [] },
  grok: { bin: 'grok', configDirs: [] },
  'dsh-tui': { bin: 'dsh-tui', configDirs: [] },
  goose: { bin: 'goose', configDirs: ['.config/goose'] },
  antigravity: { bin: 'agy', configDirs: ['.gemini/antigravity-cli'] },
  kimi: { bin: 'kimi', configDirs: [] },
  kiro: { bin: 'kiro-cli', configDirs: [] },
  hermes: { bin: 'hermes', configDirs: ['.hermes'] },
  qoder: { bin: 'qodercli', configDirs: [] },
  crush: { bin: 'crush', configDirs: [] },
  gemini: { bin: 'gemini', configDirs: [] },
  omp: { bin: 'omp', configDirs: [] }
};

/**
 * Checks if a binary exists on PATH (excluding lazy mise shims) or has an active config dir.
 * Works across Windows, macOS, and Linux.
 */
function isHerdrAgentInstalled(spec, { platform = process.platform, env = process.env, homeDir = os.homedir() } = {}) {
  const bins = [spec.bin, ...(spec.altBins || [])];
  const pathDirs = (env.PATH || '').split(path.delimiter).filter(Boolean);
  const pathExts = platform === 'win32'
    ? (env.PATHEXT || '.EXE;.CMD;.BAT;.PS1').split(';').filter(Boolean)
    : [''];

  for (const dir of pathDirs) {
    const norm = dir.replace(/\\/g, '/').toLowerCase();
    // Skip mise shims / command-wrappers since lazy tools create shims before install
    if (norm.includes('/mise/shims') || norm.includes('/mise/command-wrappers')) continue;
    for (const bin of bins) {
      for (const ext of pathExts) {
        const candidate = path.join(dir, bin + ext);
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return true;
          }
        } catch {}
      }
    }
  }

  for (const relDir of spec.configDirs || []) {
    if (fs.existsSync(path.join(homeDir, relDir))) {
      return true;
    }
  }
  return false;
}

/**
 * Converts a model display name or ID into a stable programs.json key.
 * @param {string} label
 * @returns {string}
 */
function slugifyProgramKey(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts supported non-native proxy models (e.g., Hunyuan, DeepSeek, MiMo)
 * from a models.json catalog. Native Anthropic/OpenAI/Google models and
 * unresponsive GLM (z-ai) models are excluded.
 * @param {object} catalog
 * @returns {Array<{id: string, displayName?: string}>}
 */
function getProxyMenuModels(catalog) {
  const candidates = [
    ...(Array.isArray(catalog?.ghostcli) ? catalog.ghostcli : []),
    ...(Array.isArray(catalog?.custom_proxies) ? catalog.custom_proxies : [])
  ];

  const seen = new Set();
  const result = [];
  for (const model of candidates) {
    if (!model || !model.id || seen.has(model.id)) continue;
    seen.add(model.id);

    const family = inferModelFamily(model.id);
    if (EXCLUDED_MENU_FAMILIES.has(family)) continue;
    result.push(model);
  }
  return result;
}

/**
 * Synchronizes non-native GhostCLI / custom proxy models into Herdr-App's
 * programs.json so they appear in the "+" Start an agent menu.
 * Preserves existing manual entries and avoids UTF-8 BOM.
 * @param {string} herdrDir
 * @param {object} catalog
 * @param {{dryRun?: boolean, claudeInstalled?: boolean}} [options]
 * @returns {{updated: boolean, count: number, models: string[], path: string}}
 */
function syncHerdrPrograms(herdrDir, catalog, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const claudeInstalled = options.claudeInstalled !== false;
  const programsPath = path.join(herdrDir, 'programs.json');
  const errorPath = path.join(herdrDir, 'programs.error');

  if (!claudeInstalled) {
    return { updated: false, count: 0, models: [], path: programsPath };
  }

  const models = getProxyMenuModels(catalog);
  const profiles = Array.isArray(options.profiles) ? options.profiles : [];
  const hideUninstalledAgents = options.hideUninstalledAgents !== false;
  if (models.length === 0 && profiles.length === 0 && !hideUninstalledAgents) {
    return { updated: false, count: 0, models: [], path: programsPath };
  }

  if (dryRun) {
    return {
      updated: true,
      count: models.length,
      models: models.map(m => m.id),
      path: programsPath
    };
  }

  let doc = {};
  if (fs.existsSync(programsPath)) {
    try {
      const raw = fs.readFileSync(programsPath, 'utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        doc = parsed;
      }
    } catch {}
  }

  if (!doc.programs || typeof doc.programs !== 'object' || Array.isArray(doc.programs)) {
    doc.programs = {};
  }

  // Index existing claude --model entries and prune excluded families (e.g. z-ai/glm).
  const existingKeyByModel = new Map();
  for (const [key, entry] of Object.entries(doc.programs)) {
    if (
      entry &&
      Array.isArray(entry.run) &&
      entry.run[0] === 'claude' &&
      entry.run[1] === '--model' &&
      typeof entry.run[2] === 'string'
    ) {
      if (EXCLUDED_MENU_FAMILIES.has(inferModelFamily(entry.run[2]))) {
        delete doc.programs[key];
      } else {
        existingKeyByModel.set(entry.run[2], key);
      }
    }
  }

  const registeredIds = [];
  for (const model of models) {
    const key =
      existingKeyByModel.get(model.id) ||
      slugifyProgramKey(model.displayName || model.id);
    if (!key) continue;

    doc.programs[key] = {
      name: model.displayName || model.id,
      icon: 'icons/claude.svg',
      run: ['claude', '--model', model.id]
    };
    registeredIds.push(model.id);
  }

  for (const prof of profiles) {
    if (!prof || !prof.id || !prof.tool || !prof.dir) continue;
    const key = `profile-${slugifyProgramKey(prof.id)}`;
    const icon = prof.tool === 'claude' ? 'icons/claude.svg' : prof.tool === 'codex' ? 'icons/codex.svg' : 'icons/gemini.svg';
    const env = prof.tool === 'claude'
      ? { CLAUDE_CONFIG_DIR: prof.dir }
      : prof.tool === 'codex'
        ? { CODEX_HOME: prof.dir }
        : process.platform === 'win32'
          ? { USERPROFILE: prof.dir, HOME: prof.dir }
          : { HOME: prof.dir };
    doc.programs[key] = {
      name: `${prof.tool.toUpperCase()} (${prof.name})`,
      icon,
      run: [prof.tool],
      env
    };
  }

const UNINSTALLED_RUN_SENTINEL = '__heimdall_uninstalled__';

function isDisabledRunOverride(entry) {
  return Boolean(
    entry &&
    Array.isArray(entry.run) &&
    (entry.run.length === 0 || entry.run[0] === UNINSTALLED_RUN_SENTINEL)
  );
}

  if (hideUninstalledAgents) {
    const installedOverride = options.installedAgents instanceof Set ? options.installedAgents : null;
    const detectOpts = {
      platform: options.platform || process.platform,
      env: options.env || process.env,
      homeDir: options.homeDir || os.homedir()
    };
    for (const [agentKey, spec] of Object.entries(HERDR_BUILTIN_AGENTS)) {
      const installed = installedOverride
        ? installedOverride.has(agentKey)
        : isHerdrAgentInstalled(spec, detectOpts);
      if (installed) {
        if (isDisabledRunOverride(doc.programs[agentKey])) {
          delete doc.programs[agentKey];
        }
      } else {
        const existing = (doc.programs[agentKey] && typeof doc.programs[agentKey] === 'object') ? doc.programs[agentKey] : {};
        doc.programs[agentKey] = { ...existing, run: [UNINSTALLED_RUN_SENTINEL] };
      }
    }
  }

  fs.writeFileSync(programsPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  if (fs.existsSync(errorPath)) {
    try { fs.unlinkSync(errorPath); } catch {}
  }

  return {
    updated: true,
    count: registeredIds.length,
    models: registeredIds,
    path: programsPath
  };
}

module.exports = {
  HERDR_BUILTIN_AGENTS,
  getProxyMenuModels,
  isHerdrAgentInstalled,
  slugifyProgramKey,
  syncHerdrPrograms
};
