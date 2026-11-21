'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Authoritative Canonical Context Mappings (Max Capacity)
 * Derived from playbooks/06-model-registry-matrix.md
 */
const CANONICAL_MODEL_CONTEXTS = {
  // Google Gemini Direct
  'gemini-4': 2097152,
  'gemini-4-neon': 1048576,
  'gemini-4-argon': 2097152,
  'gemini-4-hydrogen': 1048576,
  'argon': 2097152,
  'gemini-3.1-pro': 2097152,
  'gemini-3.8-flash': 1048576,

  // GhostCLI / Custom Proxies (Max extended capacity)
  'claude-opus-5-5': 1000000,
  'claude-sonnet-5': 1000000,
  'claude-sonnet-5-5': 1000000,
  'claude-fable-5.1': 1000000,
  'claude-fable-5.2': 1000000,
  'z-ai/glm-5.3': 1000000,
  'glm-5.3': 1000000,
  'z-ai/glm-5.3-flash': 1000000,
  'glm-5.3-flash': 1000000,
  'tencent/Hy4-preview': 1000000,
  'tencent/hy4-preview': 1000000,
  'hy4-preview': 1000000,
  'XiaomiMiMo/MiMo-V2.6-Pro': 1000000,
  'xiaomimimo/mimo-v2.6-pro': 1000000,
  'mimo-v2.6-pro': 1000000,
  'gpt-6-astra': 1000000,
  'astra': 1000000
};

/**
 * Normalizes token numbers into an integer token count and human-readable label.
 */
function normalizeContextTokens(raw) {
  let tokens = 0;
  if (typeof raw === 'number') {
    tokens = Math.round(raw);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.endsWith('M')) {
      const num = parseFloat(trimmed.replace('M', ''));
      tokens = Math.round(num * 1000000);
    } else if (trimmed.endsWith('K')) {
      const num = parseFloat(trimmed.replace('K', ''));
      tokens = Math.round(num * 1000);
    } else {
      tokens = parseInt(trimmed, 10) || 0;
    }
  }

  if (tokens <= 0) {
    tokens = 131072; // 128K baseline default
  }

  let label = '';
  if (tokens >= 1900000) {
    label = '2M';
  } else if (tokens >= 950000) {
    label = '1M';
  } else if (tokens === 131072 || (tokens >= 125000 && tokens <= 135000)) {
    label = '128K';
  } else if (tokens === 262144 || (tokens >= 250000 && tokens <= 265000)) {
    label = '256K';
  } else {
    label = `${Math.round(tokens / 1000)}K`;
  }

  return { tokens, label };
}

/**
 * Resolves the maximum context window for a model.
 * Prioritizes maximum allowable context (e.g. 1M extended capacity for Claude 5.5/5),
 * falling back to canonical matrices when remote API does not specify it.
 */
function resolveModelMaxContext(model, options = {}) {
  const prioritizeMax = options.prioritizeMax !== false;
  const modelId = typeof model === 'string' ? model : (model?.id || model?.slug || '');
  const cleanId = modelId.toLowerCase().trim();

  const canonicalTokens = CANONICAL_MODEL_CONTEXTS[cleanId] ||
    CANONICAL_MODEL_CONTEXTS[cleanId.split('/').pop()] ||
    null;

  let rawContext = null;
  if (typeof model === 'object' && model !== null) {
    rawContext = model.context_window || model.max_context_tokens || model.context;
  }

  // If user requests maximum context and canonical defines an extended limit (e.g. 1M vs 256K)
  if (prioritizeMax && canonicalTokens) {
    return normalizeContextTokens(canonicalTokens);
  }

  if (rawContext) {
    return normalizeContextTokens(rawContext);
  }

  if (canonicalTokens) {
    return normalizeContextTokens(canonicalTokens);
  }

  return normalizeContextTokens(131072); // 128K safe fallback
}

/**
 * Normalizes a custom proxy/vendor base URL into its /models endpoint URL.
 * Returns null for official 1P endpoints (Anthropic, OpenAI, Google GenAI).
 */
function normalizeCustomModelsUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;
  if (
    trimmed.includes('api.anthropic.com') ||
    trimmed.includes('api.openai.com') ||
    trimmed.includes('generativelanguage.googleapis.com')
  ) {
    return null;
  }
  if (trimmed.includes('ghostcli.cloud')) {
    return 'https://ghostcli.cloud/v1/models';
  }
  const base = trimmed.replace(/\/+$/, '');
  return base.endsWith('/v1') ? `${base}/models` : (base.endsWith('/models') ? base : `${base}/v1/models`);
}

/**
 * Resolves the live /v1/models endpoint URL when a custom proxy/vendor endpoint is configured.
 * Returns null when only official 1P endpoints (Anthropic, OpenAI, Google OAuth) are active.
 */
function resolveCustomModelsEndpoint(endpoints = {}) {
  const candidates = [endpoints.claude, endpoints.codex, endpoints.gemini, endpoints.hermes, endpoints.openclaw, endpoints.vscode];
  for (const raw of candidates) {
    const resolved = normalizeCustomModelsUrl(raw);
    if (resolved) return resolved;
  }
  return null;
}

/**
 * Resolves all unique custom /v1/models endpoint URLs configured across all harnesses.
 */
function resolveAllCustomModelsEndpoints(endpoints = {}) {
  const seen = new Set();
  const results = [];
  for (const [harness, raw] of Object.entries(endpoints)) {
    if (harness.endsWith('_key')) continue;
    const url = normalizeCustomModelsUrl(raw);
    if (url && !seen.has(url)) {
      seen.add(url);
      results.push({ harness, url });
    }
  }
  return results;
}

/**
 * Looks up a model's maximum context window from config/models.json first,
 * falling back to CANONICAL_MODEL_CONTEXTS and the safe 128K default.
 */
function lookupModelContextFromCatalog(modelId, rootDir) {
  if (!modelId || typeof modelId !== 'string') {
    return normalizeContextTokens(131072);
  }
  const cleanId = modelId.toLowerCase().trim().replace(/\[1m\]$/i, '');
  const shortId = cleanId.split('/').pop();

  if (rootDir) {
    try {
      const modelsPath = path.join(rootDir, 'config', 'models.json');
      if (fs.existsSync(modelsPath)) {
        const catalog = JSON.parse(fs.readFileSync(modelsPath, 'utf8'));
        const all = [
          ...(catalog.google || []),
          ...(catalog.ghostcli || []),
          ...(catalog.custom_proxies || []),
          ...(catalog.anthropic || []),
          ...(catalog.openai || [])
        ];
        const match = all.find(m => {
          const mId = (m.id || '').toLowerCase().trim();
          return mId === cleanId || mId.split('/').pop() === shortId;
        });
        if (match) {
          return resolveModelMaxContext(match, { prioritizeMax: true });
        }
      }
    } catch {}
  }

  return resolveModelMaxContext(cleanId, { prioritizeMax: true });
}

module.exports = {
  CANONICAL_MODEL_CONTEXTS,
  normalizeContextTokens,
  resolveModelMaxContext,
  normalizeCustomModelsUrl,
  resolveCustomModelsEndpoint,
  resolveAllCustomModelsEndpoints,
  lookupModelContextFromCatalog
};
