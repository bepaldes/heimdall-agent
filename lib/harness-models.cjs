'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const dns = require('node:dns');
const { execSync } = require('node:child_process');

// Force IPv4 DNS resolution — avoids IPv6 timeouts on networks where AAAA
// records resolve but IPv6 connectivity is broken or slow.
dns.setDefaultResultOrder('ipv4first');
const { normalizeCustomModelsUrl, normalizeContextTokens } = require('./model-context.cjs');

/**
 * Canonical Antigravity / Google Gemini models used as baseline when OAuth is active
 * without a direct GenAI API key.
 */
const CANONICAL_GOOGLE_MODELS = [
  {
    id: 'gemini-4-neon',
    displayName: 'Gemini 4 Neon',
    family: 'google',
    specialization: 'Antigravity Gemini 4 Neon model.',
    context: '1M',
    context_window_tokens: 1048576,
    effort: ['low', 'medium', 'high', 'xhigh']
  },
  {
    id: 'gemini-4',
    displayName: 'Gemini 4 (Argon)',
    family: 'google',
    specialization: 'Next-generation flagship Gemini reasoning, complex multi-file architecture, deep cross-workspace synthesis.',
    context: '1M / 2M',
    context_window_tokens: 2097152,
    effort: ['low', 'medium', 'high', 'xhigh']
  },
  {
    id: 'gemini-4-hydrogen',
    displayName: 'Gemini 4 Hydrogen',
    family: 'google',
    specialization: 'Efficient frontier reasoning with speed and long decodes up to 1M tokens.',
    context: '1M',
    context_window_tokens: 1048576,
    effort: ['low', 'medium', 'high', 'xhigh']
  },
  {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    family: 'google',
    specialization: 'Fast scans, workspace audits, boilerplate generation, unit test scaffolding, responsive styling.',
    context: '1M',
    context_window_tokens: 1048576,
    effort: ['low', 'medium', 'high']
  },
  {
    id: 'gemini-3.1-pro',
    displayName: 'Gemini 3.1 Pro',
    family: 'google',
    specialization: 'Massive context analysis, repository-wide multi-file refactoring, deep documentation synthesis.',
    context: '2M',
    context_window_tokens: 2097152,
    effort: ['medium', 'high', 'xhigh']
  }
];

const OFFICIAL_ANTHROPIC_MODELS = [
  {
    id: 'claude-3-7-sonnet-latest',
    displayName: 'Claude 3.7 Sonnet',
    family: 'anthropic',
    context: '200K',
    context_window_tokens: 200000,
    description: 'Official Anthropic Sonnet hybrid reasoning model'
  },
  {
    id: 'claude-3-5-sonnet-latest',
    displayName: 'Claude 3.5 Sonnet',
    family: 'anthropic',
    context: '200K',
    context_window_tokens: 200000,
    description: 'Official Anthropic Sonnet coding workhorse'
  },
  {
    id: 'claude-3-5-haiku-latest',
    displayName: 'Claude 3.5 Haiku',
    family: 'anthropic',
    context: '200K',
    context_window_tokens: 200000,
    description: 'Official Anthropic fast lightweight model'
  }
];

const OFFICIAL_OPENAI_MODELS = [
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    family: 'openai',
    context: '128K',
    context_window_tokens: 128000,
    description: 'Official OpenAI multimodal flagship model'
  },
  {
    id: 'o3-mini',
    displayName: 'o3-mini',
    family: 'openai',
    context: '200K',
    context_window_tokens: 200000,
    description: 'Official OpenAI fast reasoning model'
  },
  {
    id: 'gpt-4o-mini',
    displayName: 'GPT-4o mini',
    family: 'openai',
    context: '128K',
    context_window_tokens: 128000,
    description: 'Official OpenAI fast cost-efficient model'
  }
];

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Parses an Antigravity UI model string like "Gemini 4 Hydrogen (Medium)"
 * into a canonical ID, displayName, and effort level.
 */
function normalizeAntigravityModelSelection(rawModel) {
  if (!rawModel || typeof rawModel !== 'string') return null;
  const trimmed = rawModel.trim();
  if (!trimmed) return null;

  const effortMatch = trimmed.match(/\((low|medium|high|xhigh)\)\s*$/i);
  const effort = effortMatch ? effortMatch[1].toLowerCase() : null;
  const displayName = trimmed.replace(/\s*\((low|medium|high|xhigh)\)\s*$/i, '').trim();
  const id = displayName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return { id, displayName, effort };
}

function resolveHermesRoot(userHome, localAppData) {
  if (localAppData) {
    const winPath = path.join(localAppData, 'hermes');
    if (fs.existsSync(winPath)) return winPath;
  }
  return path.join(userHome, '.hermes');
}

function resolveOpenClawRoot(userHome, localAppData) {
  const homePath = path.join(userHome, '.openclaw');
  if (fs.existsSync(homePath)) return homePath;
  if (localAppData) {
    const winPath = path.join(localAppData, 'openclaw');
    if (fs.existsSync(winPath)) return winPath;
  }
  return homePath;
}

/**
 * Inspects installed AI harnesses on the user's PC and extracts each harness's
 * active model, provider, base URL, and API credentials.
 */
function discoverInstalledHarnesses(options = {}) {
  const userHome = options.userHome || os.homedir();
  const env = options.env || process.env;
  const platform = options.platform || os.platform();
  const localAppData = options.localAppData || env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
  const appData = options.appData || env.APPDATA || path.join(userHome, 'AppData', 'Roaming');

  const harnesses = {};

  // 1. Claude Code CLI (~/.claude)
  const claudeDir = path.join(userHome, '.claude');
  const claudeSettings = readJsonSafe(path.join(claudeDir, 'settings.json'));
  const claudeBaseUrl =
    claudeSettings?.env?.ANTHROPIC_BASE_URL ||
    claudeSettings?.env?.CLAUDE_BASE_URL ||
    env.ANTHROPIC_BASE_URL ||
    env.CLAUDE_BASE_URL ||
    null;
  const claudeApiKey =
    claudeSettings?.env?.ANTHROPIC_API_KEY ||
    claudeSettings?.env?.CLAUDE_API_KEY ||
    env.ANTHROPIC_API_KEY ||
    null;
  const claudeCustomUrl = normalizeCustomModelsUrl(claudeBaseUrl);

  harnesses.claude = {
    id: 'claude',
    label: 'Claude Code CLI',
    deliversModels: true,
    installed: fs.existsSync(claudeDir),
    baseUrl: claudeBaseUrl || 'https://api.anthropic.com',
    modelsUrl: claudeCustomUrl,
    apiKey: claudeApiKey,
    activeModel: claudeSettings?.model || null,
    mode: claudeCustomUrl ? 'custom_proxy' : 'official'
  };

  // 2. Google Antigravity / Gemini (~/.gemini)
  const geminiDir = path.join(userHome, '.gemini');
  const agyDir = path.join(geminiDir, 'antigravity-cli');
  const agySettings = readJsonSafe(path.join(agyDir, 'settings.json'));
  const geminiBaseUrl = env.GEMINI_BASE_URL || null;
  const geminiApiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || null;
  const geminiCustomUrl = normalizeCustomModelsUrl(geminiBaseUrl);
  const parsedAgyModel = normalizeAntigravityModelSelection(agySettings?.model);

  // Strict install check: require agy binary on PATH or antigravity-cli config dir.
  // Do NOT treat ~/.gemini alone as proof — Heimdall creates that dir for its own config.
  let agyOnPath = false;
  try { execSync('command -v agy', { stdio: 'ignore' }); agyOnPath = true; } catch {}
  const geminiInstalled = agyOnPath || fs.existsSync(agyDir);

  harnesses.gemini = {
    id: 'gemini',
    label: 'Google Antigravity / Gemini',
    deliversModels: true,
    installed: geminiInstalled,
    baseUrl: geminiBaseUrl || (geminiApiKey ? 'https://generativelanguage.googleapis.com' : (geminiInstalled ? 'Google OAuth' : null)),
    modelsUrl: geminiCustomUrl,
    apiKey: geminiApiKey,
    activeModel: parsedAgyModel ? parsedAgyModel.id : null,
    activeModelDisplay: agySettings?.model || null,
    mode: geminiCustomUrl ? 'custom_proxy' : (geminiApiKey ? 'official_api' : (geminiInstalled ? 'oauth' : null))
  };

  // 3. OpenAI Codex CLI (~/.codex)
  const codexDir = path.join(userHome, '.codex');
  const codexToml = readTextSafe(path.join(codexDir, 'config.toml'));
  let codexBaseUrl = null;
  let codexModel = null;
  let codexProvider = null;
  let codexEnvKeyName = null;

  if (codexToml) {
    const modelMatch = codexToml.match(/^\s*model\s*=\s*"([^"]+)"/m);
    const providerMatch = codexToml.match(/^\s*model_provider\s*=\s*"([^"]+)"/m);
    const baseUrlMatch = codexToml.match(/^\s*base_url\s*=\s*"([^"]+)"/m);
    const envKeyMatch = codexToml.match(/^\s*env_key\s*=\s*"([^"]+)"/m);
    if (modelMatch) codexModel = modelMatch[1].trim();
    if (providerMatch) codexProvider = providerMatch[1].trim();
    if (baseUrlMatch) codexBaseUrl = baseUrlMatch[1].trim();
    if (envKeyMatch) codexEnvKeyName = envKeyMatch[1].trim();
  }
  if (!codexBaseUrl && env.OPENAI_BASE_URL) {
    codexBaseUrl = env.OPENAI_BASE_URL;
  }
  const codexApiKey =
    (codexEnvKeyName && env[codexEnvKeyName]) ||
    env.GHOSTCLI_API_KEY ||
    env.OPENAI_API_KEY ||
    null;
  const codexCustomUrl = normalizeCustomModelsUrl(codexBaseUrl);

  harnesses.codex = {
    id: 'codex',
    label: 'OpenAI Codex CLI',
    deliversModels: true,
    installed: fs.existsSync(codexDir),
    provider: codexProvider || 'openai',
    baseUrl: codexBaseUrl || 'https://api.openai.com',
    modelsUrl: codexCustomUrl,
    apiKey: codexApiKey,
    activeModel: codexModel,
    mode: codexCustomUrl ? 'custom_proxy' : 'official'
  };

  // 4. Hermes Agent
  const hermesDir = resolveHermesRoot(userHome, localAppData);
  const hermesYaml = readTextSafe(path.join(hermesDir, 'config.yaml'));
  let hermesBaseUrl = null;
  let hermesModel = null;
  let hermesProvider = null;

  if (hermesYaml) {
    const baseMatch = hermesYaml.match(/^\s*base_url:\s*["']?([^"'#\r\n]+)["']?/m);
    const modelMatch = hermesYaml.match(/^\s*(?:default|model):\s*["']?([^"'#\r\n]+)["']?/m);
    const provMatch = hermesYaml.match(/^\s*provider:\s*["']?([^"'#\r\n]+)["']?/m);
    if (baseMatch) hermesBaseUrl = baseMatch[1].trim();
    if (modelMatch) hermesModel = modelMatch[1].trim();
    if (provMatch) hermesProvider = provMatch[1].trim();
  }
  const hermesCustomUrl = normalizeCustomModelsUrl(hermesBaseUrl);

  harnesses.hermes = {
    id: 'hermes',
    label: 'Hermes Agent',
    deliversModels: false,
    installed: fs.existsSync(hermesDir),
    provider: hermesProvider,
    baseUrl: hermesBaseUrl || null,
    modelsUrl: hermesCustomUrl,
    apiKey: env.GHOSTCLI_API_KEY || env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY || null,
    activeModel: hermesModel,
    mode: hermesCustomUrl ? 'custom_proxy' : 'consumer'
  };

  // 5. OpenClaw
  const openclawDir = resolveOpenClawRoot(userHome, localAppData);
  const openclawCfg = readJsonSafe(path.join(openclawDir, 'openclaw.json'));
  const openclawBaseUrl = openclawCfg?.base_url || openclawCfg?.baseUrl || null;
  const openclawCustomUrl = normalizeCustomModelsUrl(openclawBaseUrl);

  harnesses.openclaw = {
    id: 'openclaw',
    label: 'OpenClaw',
    deliversModels: false,
    installed: fs.existsSync(openclawDir),
    baseUrl: openclawBaseUrl,
    modelsUrl: openclawCustomUrl,
    apiKey: openclawCfg?.api_key || openclawCfg?.apiKey || null,
    activeModel: openclawCfg?.model || null,
    mode: openclawCustomUrl ? 'custom_proxy' : 'consumer'
  };

  // 6. VS Code / Copilot
  const copilotDir = path.join(userHome, '.copilot');
  const vscodeUserDir =
    platform === 'win32'
      ? path.join(appData, 'Code', 'User')
      : platform === 'darwin'
        ? path.join(userHome, 'Library', 'Application Support', 'Code', 'User')
        : path.join(userHome, '.config', 'Code', 'User');
  const vscodeRaw = readTextSafe(path.join(vscodeUserDir, 'settings.json'));
  let vscodeBaseUrl = null;
  if (vscodeRaw) {
    const match =
      vscodeRaw.match(/"ANTHROPIC_BASE_URL"\s*:\s*"([^"]+)"/) ||
      vscodeRaw.match(/"OPENAI_BASE_URL"\s*:\s*"([^"]+)"/);
    if (match) vscodeBaseUrl = match[1];
  }
  const vscodeCustomUrl = normalizeCustomModelsUrl(vscodeBaseUrl);

  harnesses.vscode = {
    id: 'vscode',
    label: 'VS Code (Copilot)',
    deliversModels: false,
    installed: fs.existsSync(copilotDir) || fs.existsSync(vscodeUserDir),
    baseUrl: vscodeBaseUrl,
    modelsUrl: vscodeCustomUrl,
    apiKey: null,
    activeModel: null,
    mode: vscodeCustomUrl ? 'custom_proxy' : 'consumer'
  };

  return harnesses;
}

/**
 * Discovers all unique custom / proxy / local API endpoints across installed harnesses
 * and standard environment variables.
 */
function discoverCustomEndpoints(harnesses = {}, env = process.env) {
  const byModelsUrl = new Map();

  const register = (harnessId, rawUrl, apiKey) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    let candidate = rawUrl.trim();
    if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
      if (candidate.startsWith('localhost') || candidate.startsWith('127.0.0.1')) {
        candidate = `http://${candidate}`;
      } else {
        return;
      }
    }
    const modelsUrl = normalizeCustomModelsUrl(candidate);
    if (!modelsUrl) return;

    const existing = byModelsUrl.get(modelsUrl);
    const isLocal = modelsUrl.includes('localhost') || modelsUrl.includes('127.0.0.1');
    const cleanKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : null;

    if (!existing) {
      byModelsUrl.set(modelsUrl, {
        harnesses: [harnessId],
        baseUrl: candidate.replace(/\/+$/, ''),
        modelsUrl,
        apiKey: cleanKey,
        isLocal
      });
    } else {
      if (!existing.harnesses.includes(harnessId)) {
        existing.harnesses.push(harnessId);
      }
      if (!existing.apiKey && cleanKey) {
        existing.apiKey = cleanKey;
      }
    }
  };

  // Register endpoints from model-delivering harnesses first, then unique custom endpoints from runners (Hermes/OpenClaw)
  for (const [id, info] of Object.entries(harnesses)) {
    if (info && info.installed && info.deliversModels !== false && info.baseUrl) {
      register(id, info.baseUrl, info.apiKey);
    }
  }
  for (const id of ['hermes', 'openclaw']) {
    const info = harnesses[id];
    if (info && info.installed && info.modelsUrl && !byModelsUrl.has(info.modelsUrl)) {
      register(id, info.baseUrl, info.apiKey);
    }
  }

  // Fallback / explicit environment variable custom endpoints
  register('env:anthropic', env.ANTHROPIC_BASE_URL || env.CLAUDE_BASE_URL, env.ANTHROPIC_API_KEY);
  register('env:openai', env.OPENAI_BASE_URL || env.CODEX_BASE_URL || env.OPENAI_API_BASE, env.OPENAI_API_KEY || env.GHOSTCLI_API_KEY);
  register('env:gemini', env.GEMINI_BASE_URL, env.GEMINI_API_KEY || env.GOOGLE_API_KEY);
  register('env:litellm', env.LITELLM_BASE_URL, env.LITELLM_API_KEY);
  register('env:ollama', env.OLLAMA_HOST, null);

  return Array.from(byModelsUrl.values());
}

/**
 * Synchronizes Google Gemini / Antigravity models using local Antigravity settings,
 * optional live Google GenAI API discovery (when GEMINI_API_KEY is present), and
 * the canonical Google model registry.
 */
async function syncGeminiModelsForHarness(geminiHarness, existingGoogleModels = [], fetchFn = globalThis.fetch) {
  if (!geminiHarness || (!geminiHarness.installed && !geminiHarness.apiKey && !geminiHarness.baseUrl)) {
    return { updated: false, models: existingGoogleModels, source: 'not_installed', liveCount: 0 };
  }

  const byId = new Map();

  // Seed with existing Google models, then ensure canonical baseline entries exist
  for (const m of [...existingGoogleModels, ...CANONICAL_GOOGLE_MODELS]) {
    if (m && m.id && !byId.has(m.id)) {
      byId.set(m.id, { ...m });
    }
  }

  // Register active model configured in Antigravity settings.json if not already present
  if (geminiHarness.activeModel && !byId.has(geminiHarness.activeModel)) {
    const parsed = normalizeAntigravityModelSelection(geminiHarness.activeModelDisplay || geminiHarness.activeModel);
    byId.set(geminiHarness.activeModel, {
      id: geminiHarness.activeModel,
      displayName: parsed?.displayName || geminiHarness.activeModel,
      family: 'google',
      specialization: 'Active model configured in Google Antigravity CLI settings.',
      context: '1M',
      context_window_tokens: 1048576,
      effort: ['low', 'medium', 'high']
    });
  }

  let liveCount = 0;
  let source = geminiHarness.mode || 'oauth';

  // Probe live Google GenAI API if an API key is available on a non-proxy setup
  if (geminiHarness.apiKey && geminiHarness.mode === 'official_api' && typeof fetchFn === 'function') {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiHarness.apiKey)}`;
    try {
      const res = await fetchFn(apiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const payload = await res.json();
        const apiModels = Array.isArray(payload.models) ? payload.models : [];
        for (const m of apiModels) {
          const rawName = (m.name || '').replace(/^models\//, '');
          const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
          if (!rawName.startsWith('gemini-')) continue;
          if (methods.length > 0 && !methods.includes('generateContent')) continue;

          const ctx = normalizeContextTokens(m.inputTokenLimit || 1048576);
          liveCount += 1;
          const prev = byId.get(rawName) || {};
          byId.set(rawName, {
            ...prev,
            id: rawName,
            displayName: m.displayName || prev.displayName || rawName,
            family: 'google',
            specialization: m.description || prev.specialization || 'Google Gemini API model',
            context: ctx.label,
            context_window_tokens: ctx.tokens,
            effort: prev.effort || ['low', 'medium', 'high']
          });
        }
        source = 'google_genai_api';
      }
    } catch {
      // Preserve canonical + local Antigravity models on transient network error
    }
  }

  return {
    updated: true,
    models: Array.from(byId.values()),
    source,
    activeModel: geminiHarness.activeModelDisplay || geminiHarness.activeModel || null,
    liveCount
  };
}

/**
 * Builds official 1P model sections for installed harnesses that are NOT routed
 * through a custom proxy (e.g. Claude Code on api.anthropic.com, Codex on api.openai.com).
 */
function buildOfficialHarnessModels(harnesses = {}) {
  const sections = {};
  if (harnesses.claude?.installed && harnesses.claude.mode === 'official') {
    sections.anthropic = OFFICIAL_ANTHROPIC_MODELS.map(m => ({ ...m }));
  }
  if (harnesses.codex?.installed && harnesses.codex.mode === 'official') {
    sections.openai = OFFICIAL_OPENAI_MODELS.map(m => ({ ...m }));
  }
  return sections;
}

module.exports = {
  CANONICAL_GOOGLE_MODELS,
  OFFICIAL_ANTHROPIC_MODELS,
  OFFICIAL_OPENAI_MODELS,
  normalizeAntigravityModelSelection,
  discoverInstalledHarnesses,
  discoverCustomEndpoints,
  syncGeminiModelsForHarness,
  buildOfficialHarnessModels
};
