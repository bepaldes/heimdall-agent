import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelMaxContext, normalizeContextTokens, resolveCustomModelsEndpoint } from '../lib/model-context.cjs';

describe('Model Context Discovery & Maximum Context Resolution', () => {
  test('normalizes raw token numbers into integer tokens and human readable string', () => {
    const res1 = normalizeContextTokens(1000000);
    assert.equal(res1.tokens, 1000000);
    assert.equal(res1.label, '1M');

    const res2 = normalizeContextTokens(2097152);
    assert.equal(res2.tokens, 2097152);
    assert.equal(res2.label, '2M');

    const res3 = normalizeContextTokens(256000);
    assert.equal(res3.tokens, 256000);
    assert.equal(res3.label, '256K');
  });

  test('prioritizes maximum allowed context for models with extended capacity', () => {
    // Claude Opus 5.5 and Sonnet 5 have 256K base, but 1M maximum extended
    const claudeModel = {
      id: 'claude-opus-5-5',
      context_window: 256000
    };
    const resolved = resolveModelMaxContext(claudeModel, { prioritizeMax: true });
    assert.equal(resolved.tokens, 1000000);
    assert.equal(resolved.label, '1M');
  });

  test('resolves context correctly when API returns raw context_window', () => {
    const astra = {
      id: 'gpt-6-astra',
      context_window: 1000000
    };
    const resolved = resolveModelMaxContext(astra);
    assert.equal(resolved.tokens, 1000000);
    assert.equal(resolved.label, '1M');
  });

  test('falls back to canonical registry when API does not specify context_window', () => {
    const geminiPro = {
      id: 'gemini-3.1-pro'
    };
    const resolved = resolveModelMaxContext(geminiPro);
    assert.equal(resolved.tokens, 2097152);
    assert.equal(resolved.label, '2M');
  });

  test('falls back to safe default (128K) for completely unknown models', () => {
    const unknownModel = {
      id: 'unknown-custom-model'
    };
    const resolved = resolveModelMaxContext(unknownModel);
    assert.equal(resolved.tokens, 131072);
    assert.equal(resolved.label, '128K');
  });

  test('resolveCustomModelsEndpoint returns null for official APIs and target URL for custom proxies', () => {
    assert.equal(
      resolveCustomModelsEndpoint({
        claude: 'https://api.anthropic.com (Official)',
        codex: 'https://api.openai.com (Official)'
      }),
      null
    );

    assert.equal(
      resolveCustomModelsEndpoint({
        claude: 'https://ghostcli.cloud',
        codex: 'https://api.openai.com (Official)'
      }),
      'https://ghostcli.cloud/v1/models'
    );

    assert.equal(
      resolveCustomModelsEndpoint({
        claude: 'https://api.anthropic.com (Official)',
        codex: 'https://my-proxy.internal/v1'
      }),
      'https://my-proxy.internal/v1/models'
    );
  });
});
