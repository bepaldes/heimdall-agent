'use strict';

/**
 * Authoritative Canonical Context Mappings (Max Capacity)
 * Derived from playbooks/06-model-registry-matrix.md
 */
const CANONICAL_MODEL_CONTEXTS = {
  // Google Gemini Direct
  'gemini-4': 2097152,
  'gemini-4-argon': 2097152,
  'argon': 2097152,
  'gemini-3.1-pro': 2097152,
  'gemini-3.8-flash': 1048576,

  // GhostCLI / Custom Proxies (Max extended capacity)
  'claude-opus-5-5': 1000000,
  'claude-sonnet-5': 1000000,
  'claude-fable-5.1': 1000000,
  'z-ai/glm-5.3': 1000000,
  'glm-5.3': 1000000,
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

module.exports = {
  CANONICAL_MODEL_CONTEXTS,
  normalizeContextTokens,
  resolveModelMaxContext
};
