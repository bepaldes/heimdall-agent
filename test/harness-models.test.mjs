import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  normalizeAntigravityModelSelection,
  discoverInstalledHarnesses,
  discoverCustomEndpoints,
  syncGeminiModelsForHarness,
  buildOfficialHarnessModels
} from '../lib/harness-models.cjs';

describe('Multi-Harness Model & Custom Endpoint Discovery', () => {
  test('normalizeAntigravityModelSelection extracts canonical ID and effort', () => {
    const res1 = normalizeAntigravityModelSelection('Gemini 4 Hydrogen (Medium)');
    assert.deepEqual(res1, {
      id: 'gemini-4-hydrogen',
      displayName: 'Gemini 4 Hydrogen',
      effort: 'medium'
    });

    const res2 = normalizeAntigravityModelSelection('Gemini 3.8 Flash (High)');
    assert.deepEqual(res2, {
      id: 'gemini-3.8-flash',
      displayName: 'Gemini 3.8 Flash',
      effort: 'high'
    });
  });

  test('discoverInstalledHarnesses detects only harnesses present on user PC and extracts configs', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-harness-test-'));
    try {
      // Create Claude Code with custom proxy
      const claudeDir = path.join(tmpRoot, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.writeFileSync(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify({
          model: 'opus',
          env: {
            ANTHROPIC_BASE_URL: 'https://ghostcli.cloud',
            ANTHROPIC_API_KEY: 'gcli_test_key'
          }
        })
      );

      // Create Google Antigravity with active model
      const agyDir = path.join(tmpRoot, '.gemini', 'antigravity-cli');
      fs.mkdirSync(agyDir, { recursive: true });
      fs.writeFileSync(
        path.join(agyDir, 'settings.json'),
        JSON.stringify({ model: 'Gemini 4 Hydrogen (Medium)' })
      );

      // Create Codex CLI with official endpoint
      const codexDir = path.join(tmpRoot, '.codex');
      fs.mkdirSync(codexDir, { recursive: true });
      fs.writeFileSync(
        path.join(codexDir, 'config.toml'),
        'model = "gpt-4o"\n'
      );

      const harnesses = discoverInstalledHarnesses({
        userHome: tmpRoot,
        localAppData: path.join(tmpRoot, 'AppData', 'Local'),
        appData: path.join(tmpRoot, 'AppData', 'Roaming'),
        env: {}
      });

      assert.equal(harnesses.claude.installed, true);
      assert.equal(harnesses.claude.mode, 'custom_proxy');
      assert.equal(harnesses.claude.modelsUrl, 'https://ghostcli.cloud/v1/models');
      assert.equal(harnesses.claude.apiKey, 'gcli_test_key');

      assert.equal(harnesses.gemini.installed, true);
      assert.equal(harnesses.gemini.mode, 'oauth');
      assert.equal(harnesses.gemini.activeModel, 'gemini-4-hydrogen');

      assert.equal(harnesses.codex.installed, true);
      assert.equal(harnesses.codex.mode, 'official');
      assert.equal(harnesses.codex.activeModel, 'gpt-4o');

      assert.equal(harnesses.hermes.installed, false);
      assert.equal(harnesses.openclaw.installed, false);
      assert.equal(harnesses.vscode.installed, false);

      // Verify custom endpoints only include GhostCLI proxy, not official Codex
      const endpoints = discoverCustomEndpoints(harnesses, {});
      assert.equal(endpoints.length, 1);
      assert.equal(endpoints[0].modelsUrl, 'https://ghostcli.cloud/v1/models');
      assert.deepEqual(endpoints[0].harnesses, ['claude']);

      // Verify official models are built only for installed official harnesses (Codex, not Claude)
      const official = buildOfficialHarnessModels(harnesses);
      assert.equal(official.anthropic, undefined);
      assert.ok(Array.isArray(official.openai));
      assert.ok(official.openai.some(m => m.id === 'gpt-4o'));
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  test('discoverCustomEndpoints detects custom env URLs like LiteLLM and Ollama and ignores official URLs', () => {
    const endpoints = discoverCustomEndpoints(
      {},
      {
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
        LITELLM_BASE_URL: 'https://litellm.internal.corp/v1',
        LITELLM_API_KEY: 'sk-litellm',
        OLLAMA_HOST: 'http://127.0.0.1:11434'
      }
    );

    assert.equal(endpoints.length, 2);
    const urls = endpoints.map(e => e.modelsUrl).sort();
    assert.deepEqual(urls, [
      'http://127.0.0.1:11434/v1/models',
      'https://litellm.internal.corp/v1/models'
    ]);
    const ollama = endpoints.find(e => e.modelsUrl.includes('11434'));
    assert.equal(ollama.isLocal, true);
  });

  test('syncGeminiModelsForHarness merges live Google GenAI API models when key is present', async () => {
    const mockFetch = async (url) => {
      assert.ok(url.includes('generativelanguage.googleapis.com/v1beta/models?key=test-gem-key'));
      return {
        ok: true,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-2.5-pro',
              displayName: 'Gemini 2.5 Pro',
              description: 'Live Google GenAI Pro model',
              inputTokenLimit: 2097152,
              supportedGenerationMethods: ['generateContent']
            },
            {
              name: 'models/embedding-001',
              displayName: 'Embedding',
              supportedGenerationMethods: ['embedContent']
            }
          ]
        })
      };
    };

    const result = await syncGeminiModelsForHarness(
      {
        installed: true,
        mode: 'official_api',
        apiKey: 'test-gem-key',
        activeModel: 'gemini-4-hydrogen',
        activeModelDisplay: 'Gemini 4 Hydrogen (Medium)'
      },
      [],
      mockFetch
    );

    assert.equal(result.updated, true);
    assert.equal(result.source, 'google_genai_api');
    assert.equal(result.liveCount, 1);
    assert.ok(result.models.some(m => m.id === 'gemini-2.5-pro'));
    assert.ok(result.models.some(m => m.id === 'gemini-4-hydrogen'));
    assert.ok(!result.models.some(m => m.id === 'embedding-001'));
  });
});
