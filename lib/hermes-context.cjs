'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Updates Hermes Agent's config.yaml to set model context_length to maximum allowable tokens.
 * Performs surgical in-place replacement preserving all comments, indentation, and structure.
 */
function updateHermesConfigContext(hermesDir, modelContextMap, dryRun = false) {
  const configPath = path.join(hermesDir, 'config.yaml');
  if (!fs.existsSync(configPath)) return false;

  try {
    let content = fs.readFileSync(configPath, 'utf8');
    let modified = false;

    // Fix base_url if it's missing the /v1 suffix (Hermes requires /v1 for model discovery)
    const baseUrlRegex = /(base_url:[ \t]*["']https:\/\/ghostcli\.cloud)(["'])/g;
    if (baseUrlRegex.test(content)) {
      content = content.replace(baseUrlRegex, '$1/v1$2');
      modified = true;
    }

    for (const [modelId, maxTokens] of Object.entries(modelContextMap)) {
      if (!maxTokens) continue;

      // Escape dots or special chars in modelId (e.g. claude-fable-5.1)
      const escapedModel = modelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match pattern like:
      // claude-opus-5-5:
      //   context_length: 256000
      const regex = new RegExp(`(${escapedModel}:[\\r\\n]+(?:[ \\t]+.*[\\r\\n]+)*?[ \\t]+context_length:[ \\t]*)(\\d+)`, 'm');
      const match = content.match(regex);
      if (match) {
        const currentTokens = parseInt(match[2], 10);
        if (currentTokens < maxTokens) {
          content = content.replace(regex, `$1${maxTokens}`);
          modified = true;
        }
      }
    }

    if (modified && !dryRun) {
      fs.writeFileSync(configPath, content, 'utf8');
    }

    return modified;
  } catch {
    return false;
  }
}

module.exports = {
  updateHermesConfigContext
};
