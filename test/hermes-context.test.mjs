import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { updateHermesConfigContext } from '../lib/hermes-context.cjs';

describe('Hermes config.yaml Max Context Enforcement', () => {
  test('updates provider models context_length to maximum allowed tokens', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-test-'));
    const configPath = path.join(tmpDir, 'config.yaml');

    const sampleYaml = `# Sample Hermes Config
model:
  default: "ghostcli/claude-opus-5-5"
  provider: "ghostcli"

providers:
  ghostcli:
    base_url: "https://ghostcli.cloud"
    models:
      claude-opus-5-5:
        context_length: 256000
      claude-sonnet-5:
        context_length: 256000
      gpt-6-astra:
        context_length: 1000000
`;
    fs.writeFileSync(configPath, sampleYaml, 'utf8');

    const modelsToUpdate = {
      'claude-opus-5-5': 1000000,
      'claude-sonnet-5': 1000000,
      'claude-fable-5.1': 1000000,
      'gpt-6-astra': 1000000,
      'z-ai/glm-5.3': 1000000
    };

    const updated = updateHermesConfigContext(tmpDir, modelsToUpdate, false);
    assert.equal(updated, true);

    const resultingYaml = fs.readFileSync(configPath, 'utf8');
    assert.match(resultingYaml, /claude-opus-5-5:\s*[\r\n]+\s*context_length:\s*1000000/);
    assert.match(resultingYaml, /claude-sonnet-5:\s*[\r\n]+\s*context_length:\s*1000000/);
    assert.match(resultingYaml, /gpt-6-astra:\s*[\r\n]+\s*context_length:\s*1000000/);

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('idempotent: does not modify file if already set to max context', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-test-'));
    const configPath = path.join(tmpDir, 'config.yaml');

    const sampleYaml = `providers:
  ghostcli:
    models:
      claude-opus-5-5:
        context_length: 1000000
`;
    fs.writeFileSync(configPath, sampleYaml, 'utf8');

    const updated = updateHermesConfigContext(tmpDir, { 'claude-opus-5-5': 1000000 }, false);
    assert.equal(updated, false);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
