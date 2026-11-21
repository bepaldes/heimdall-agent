'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { resolveModelMaxContext } = require('./model-context.cjs');

/**
 * Infers the model family/vendor from a model ID.
 * Supports Anthropic, Google, OpenAI, Zhipu (GLM), Tencent (Hunyuan), Xiaomi (MiMo),
 * and any future slash-prefixed or named provider.
 */
function inferModelFamily(modelId) {
  const id = (modelId || '').toLowerCase().trim();
  if (!id) return 'unknown';
  if (id.startsWith('claude-') || id.includes('anthropic')) return 'anthropic';
  if (id.startsWith('gemini-') || id.includes('google')) return 'google';
  if (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4') || id.includes('codex')) return 'openai';
  if (id.startsWith('z-ai/') || id.includes('glm')) return 'z-ai';
  if (id.startsWith('tencent/') || id.includes('hy4') || id.includes('hunyuan')) return 'tencent';
  if (id.startsWith('xiaomimimo/') || id.includes('mimo')) return 'xiaomi';
  if (id.includes('/')) return id.split('/')[0];
  return id.split('-')[0] || 'unknown';
}

/**
 * Classifies a model's capabilities, speed tier, and context capacity
 * from its ID, displayName, description/specialization, and context window.
 */
function classifyModelCapabilities(model, channel = 'ghostcli') {
  const id = model?.id || model?.slug || '';
  const displayName = model?.displayName || model?.display_name || id;
  const text = `${id} ${displayName} ${model?.description || ''} ${model?.specialization || ''}`.toLowerCase();
  const family = model?.family || inferModelFamily(id);
  const resolvedCtx = resolveModelMaxContext(model, { prioritizeMax: true });

  const isFast = /flash|fast|rápid|rapido|mini|lite|haiku|instant/.test(text);
  const isUiCreative = /fable|design|ui|story|creative|visual|frontend/.test(text);
  const isReasoning = /opus|pro|astra|reasoning|racioc[ií]nio|architect|frontier|gemini-4|hy4|mimo/.test(text);
  const isAgentic = /agentic|ag[eê]ntic|c[oó]digo|code|sonnet|glm|astra|mimo|hy4/.test(text);
  const isLongContext = resolvedCtx.tokens >= 950000;

  const traits = new Set();
  if (isFast) traits.add('fast');
  if (isUiCreative) traits.add('ui_creative');
  if (isReasoning) traits.add('deep_reasoning');
  if (isAgentic) traits.add('agentic_coding');
  if (isLongContext) traits.add('long_context');
  if (traits.size === 0) traits.add('general');

  return {
    id,
    displayName,
    family,
    channel,
    contextLabel: resolvedCtx.label,
    contextTokens: resolvedCtx.tokens,
    description: model?.description || model?.specialization || '',
    traits: [...traits],
    isFast,
    isUiCreative,
    isReasoning,
    isAgentic,
    isLongContext
  };
}

/**
 * Flattens and deduplicates models from config/models.json into classified entries.
 */
function collectCatalogModels(catalog = {}) {
  const byId = new Map();
  const sources = [
    ['google', catalog.google || []],
    ['ghostcli', catalog.ghostcli || []],
    ['custom_proxies', catalog.custom_proxies || []],
    ['anthropic', catalog.anthropic || []],
    ['openai', catalog.openai || []]
  ];

  for (const [channel, list] of sources) {
    for (const raw of list) {
      if (!raw || !raw.id) continue;
      if (!byId.has(raw.id)) {
        byId.set(raw.id, classifyModelCapabilities(raw, channel));
      }
    }
  }
  return [...byId.values()];
}

const TIER_SCORING_RULES = {
  deep_reasoning: (m) =>
    (m.isReasoning ? 40 : 0) +
    (m.isAgentic ? 15 : 0) +
    (m.isLongContext ? 10 : 0) +
    (/opus|gemini-4|astra/.test(m.id.toLowerCase()) ? 25 : 0) +
    (m.isFast ? -15 : 0),
  high_polish_vision: (m) =>
    (m.isUiCreative ? 50 : 0) +
    (m.isAgentic ? 20 : 0) +
    (/sonnet|fable|flash|mimo/.test(m.id.toLowerCase()) ? 15 : 0),
  responsive_flex_safety: (m) =>
    (m.isUiCreative ? 35 : 0) +
    (m.isFast ? 20 : 0) +
    (m.isAgentic ? 20 : 0),
  fast_verification: (m) =>
    (m.isFast ? 45 : 0) +
    (m.isAgentic ? 25 : 0) +
    (/flash|sonnet|mimo|glm/.test(m.id.toLowerCase()) ? 15 : 0),
  deep_assurance_audit: (m) =>
    (m.isReasoning ? 45 : 0) +
    (m.isLongContext ? 15 : 0) +
    (/opus|gemini-4|astra|hy4/.test(m.id.toLowerCase()) ? 20 : 0) +
    (m.isFast ? -15 : 0),
  schema_migration_safety: (m) =>
    (m.isReasoning ? 35 : 0) +
    (m.contextTokens >= 1900000 ? 20 : (m.isLongContext ? 10 : 0)) +
    (m.isAgentic ? 20 : 0),
  surgical_restraint: (m) =>
    (m.isFast ? 30 : 0) +
    (m.isAgentic ? 30 : 0) +
    (/sonnet|flash|glm|mimo/.test(m.id.toLowerCase()) ? 15 : 0),
  adversarial_diff_eval: (m) =>
    (m.isReasoning ? 45 : 0) +
    (m.isAgentic ? 20 : 0) +
    (/opus|gemini-4|astra|hy4|mimo/.test(m.id.toLowerCase()) ? 15 : 0),
  legacy_migration_safety: (m) =>
    (m.isLongContext ? 25 : 0) +
    (m.isAgentic ? 25 : 0) +
    (m.isReasoning ? 20 : 0)
};

/**
 * Ranks all available models for a given agent capabilityTier and selects
 * diverse cross-family models for adversarial review.
 */
function rankModelsForCapabilityTier(capabilityTier, catalog) {
  const models = Array.isArray(catalog) ? catalog : collectCatalogModels(catalog);
  const scorer = TIER_SCORING_RULES[capabilityTier] || TIER_SCORING_RULES.surgical_restraint;

  const scored = models
    .map(m => ({ model: m, score: scorer(m) }))
    .sort((a, b) => b.score - a.score || b.model.contextTokens - a.model.contextTokens || a.model.id.localeCompare(b.model.id));

  // Pick top model per distinct family so non-Claude/Gemini/Codex models are surfaced
  const topByFamily = new Map();
  for (const { model } of scored) {
    if (!topByFamily.has(model.family)) {
      topByFamily.set(model.family, model);
    }
  }

  const recommendedModels = [...topByFamily.values()].slice(0, 6).map(m => m.id);
  const primary = scored[0]?.model;
  const crossReviewers = [...topByFamily.values()]
    .filter(m => !primary || m.family !== primary.family)
    .slice(0, 4)
    .map(m => m.id);

  const pickFamily = (fam) => topByFamily.get(fam)?.id;
  const vendorPreferences = {};
  if (pickFamily('google')) vendorPreferences.gemini = pickFamily('google');
  if (pickFamily('anthropic')) vendorPreferences.claude = pickFamily('anthropic');
  if (pickFamily('openai')) vendorPreferences.codex = pickFamily('openai');

  // Include non-legacy families dynamically (z-ai, tencent, xiaomi, etc.)
  for (const [fam, model] of topByFamily.entries()) {
    if (fam !== 'google' && fam !== 'anthropic' && fam !== 'openai') {
      vendorPreferences[fam] = model.id;
    }
  }
  vendorPreferences.default = 'inherit';

  return { recommendedModels, crossReviewers, vendorPreferences };
}

const MODEL_TIER_POLICY = {
  quota_limited_flagship: {
    models: ['gemini-4-argon', 'gemini-4-neon'],
    rule: 'Reserve strictly for specialized architecture, complex synthesis, and critical final reviews.'
  },
  unlimited_workhorse: {
    models: ['claude-opus-5-5', 'claude-fable-5.2', 'gpt-6-astra', 'claude-sonnet-5-5'],
    rule: 'No Antigravity quota limits (via GhostCLI/Codex). Default for core implementation, migrations, and heavy execution.'
  },
  mid_tier_reviewer: {
    models: ['gemini-4-hydrogen'],
    rule: 'Stronger reasoning than Flash with lower quota pressure than Argon/Neon. Default for cross-family reviews.'
  },
  fast_utility: {
    models: ['gemini-3.8-flash', 'z-ai/glm-5.3-flash', 'deepseek-ai/DeepSeek-V4.1-Flash-1017', 'claude-sonnet-5'],
    rule: 'Rapid scans, boilerplate scaffolding, and quick utility checks.'
  }
};

/**
 * Synchronizes config/agents.json with live models from config/models.json.
 * Returns { modified: boolean, agentCount: number } or null if files are missing.
 */
function syncAgentsWithModels(rootDir, dryRun = false) {
  const modelsPath = path.join(rootDir, 'config', 'models.json');
  const agentsPath = path.join(rootDir, 'config', 'agents.json');
  if (!fs.existsSync(modelsPath) || !fs.existsSync(agentsPath)) return null;

  try {
    const catalog = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
    const classified = collectCatalogModels(catalog);
    if (classified.length === 0) return { modified: false, agentCount: 0 };

    const rawAgents = fs.readFileSync(agentsPath, 'utf8');
    const agentsConfig = JSON.parse(rawAgents);
    const agentsMap = agentsConfig.agents || {};

    let modified = false;
    if (JSON.stringify(agentsConfig.modelTierPolicy || {}) !== JSON.stringify(MODEL_TIER_POLICY)) {
      agentsConfig.modelTierPolicy = MODEL_TIER_POLICY;
      modified = true;
    }
    for (const agentDef of Object.values(agentsMap)) {
      const { recommendedModels, crossReviewers, vendorPreferences } =
        rankModelsForCapabilityTier(agentDef.capabilityTier, classified);

      const nextVendor = JSON.stringify(vendorPreferences);
      const prevVendor = JSON.stringify(agentDef.vendorPreferences || {});
      const nextRec = JSON.stringify(recommendedModels);
      const prevRec = JSON.stringify(agentDef.recommendedModels || []);
      const nextCross = JSON.stringify(crossReviewers);
      const prevCross = JSON.stringify(agentDef.crossReviewers || []);

      if (nextVendor !== prevVendor || nextRec !== prevRec || nextCross !== prevCross) {
        agentDef.vendorPreferences = vendorPreferences;
        agentDef.recommendedModels = recommendedModels;
        agentDef.crossReviewers = crossReviewers;
        modified = true;
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(agentsPath, JSON.stringify(agentsConfig, null, 2) + '\n', 'utf8');
    }

    return { modified, agentCount: Object.keys(agentsMap).length };
  } catch {
    return null;
  }
}

/**
 * Builds the Markdown table for Section 2 (GhostCLI Models) from live catalog entries.
 */
function buildGhostCliMarkdownSection(ghostcliModels) {
  const rows = ghostcliModels.map(m => {
    const c = classifyModelCapabilities(m, 'ghostcli');
    const spec = c.description || c.traits.join(', ');
    const effort = c.isFast ? '`low`, `medium`, `high`' : '`low`, `medium`, `high`, `xhigh`';
    return `| **${c.displayName}** | \`${c.id}\` | ${c.family} | ${c.contextLabel} | ${effort} | ${spec} |`;
  });

  return [
    '<!-- heimdall:ghostcli-models:start -->',
    'All GhostCLI models are discovered dynamically via `heimdall sync` / `heimdall sync-models` and stored in `config/models.json`:',
    '',
    '| Model Name | Canonical Flag | Family | Context Window | Allowed Effort Levels | Specialization / Description |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ...rows,
    '',
    '> [!NOTE]',
    '> **Dynamic Model Registry**: Always resolve live model IDs from `config/models.json` or this table after `heimdall sync` / `heimdall sync-models`. Route tasks by **capability tier** across all available families (Anthropic, Google, OpenAI, GLM, Hunyuan, MiMo, etc.), not only Claude/Gemini/Codex.',
    '<!-- heimdall:ghostcli-models:end -->'
  ].join('\n');
}

/**
 * Synchronizes playbooks/06-model-registry-matrix.md Section 2 with config/models.json.
 * Returns { modified: boolean } or null if files are missing.
 */
function syncModelRegistryPlaybook(rootDir, dryRun = false) {
  const modelsPath = path.join(rootDir, 'config', 'models.json');
  const playbookPath = path.join(rootDir, 'playbooks', '06-model-registry-matrix.md');
  if (!fs.existsSync(modelsPath) || !fs.existsSync(playbookPath)) return null;

  try {
    const catalog = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
    const ghostcliModels = catalog.ghostcli || catalog.custom_proxies || [];
    if (ghostcliModels.length === 0) return { modified: false };

    const orig = fs.readFileSync(playbookPath, 'utf8');
    const generatedBlock = buildGhostCliMarkdownSection(ghostcliModels);

    let updated = orig;
    const markerRegex = /<!-- heimdall:ghostcli-models:start -->[\s\S]*?<!-- heimdall:ghostcli-models:end -->/;
    if (markerRegex.test(updated)) {
      updated = updated.replace(markerRegex, generatedBlock);
    } else {
      const sectionRegex = /(## 2\. GhostCLI Models[^\n]*\n\n)[\s\S]*?(\n---\n)/;
      if (sectionRegex.test(updated)) {
        updated = updated.replace(sectionRegex, `$1${generatedBlock}\n$2`);
      }
    }

    const modified = updated !== orig;
    if (modified && !dryRun) {
      fs.writeFileSync(playbookPath, updated, 'utf8');
    }

    return { modified };
  } catch {
    return null;
  }
}

module.exports = {
  MODEL_TIER_POLICY,
  inferModelFamily,
  classifyModelCapabilities,
  collectCatalogModels,
  rankModelsForCapabilityTier,
  syncAgentsWithModels,
  syncModelRegistryPlaybook
};
