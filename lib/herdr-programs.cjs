const fs = require('fs');
const path = require('path');
const { inferModelFamily } = require('./model-router.cjs');

const EXCLUDED_MENU_FAMILIES = new Set(['anthropic', 'openai', 'google', 'z-ai']);

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
  if (models.length === 0 && profiles.length === 0) {
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
  getProxyMenuModels,
  slugifyProgramKey,
  syncHerdrPrograms
};
