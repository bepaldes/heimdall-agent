import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  inferModelFamily,
  classifyModelCapabilities,
  rankModelsForCapabilityTier,
  syncAgentsWithModels,
  syncModelRegistryPlaybook
} from '../lib/model-router.cjs';

describe('Dynamic Model Router & Capability Sync', () => {
  test('infers families for known and newly released GhostCLI models', () => {
    assert.equal(inferModelFamily('claude-sonnet-5-5'), 'anthropic');
    assert.equal(inferModelFamily('claude-fable-5.2'), 'anthropic');
    assert.equal(inferModelFamily('gemini-4'), 'google');
    assert.equal(inferModelFamily('gpt-6-astra'), 'openai');
    assert.equal(inferModelFamily('z-ai/glm-5.3-flash'), 'z-ai');
    assert.equal(inferModelFamily('tencent/Hy4-preview'), 'tencent');
    assert.equal(inferModelFamily('XiaomiMiMo/MiMo-V2.6-Pro'), 'xiaomi');
    assert.equal(inferModelFamily('deepseek/deepseek-r2'), 'deepseek');
  });

  test('classifies capability traits dynamically from model metadata', () => {
    const glmFlash = classifyModelCapabilities({
      id: 'z-ai/glm-5.3-flash',
      displayName: 'GLM 5.3 Flash',
      context_window_tokens: 1000000,
      description: 'Respostas rápidas para código'
    });
    assert.equal(glmFlash.family, 'z-ai');
    assert.equal(glmFlash.isFast, true);
    assert.equal(glmFlash.isAgentic, true);
    assert.equal(glmFlash.isLongContext, true);

    const fable = classifyModelCapabilities({
      id: 'claude-fable-5.2',
      displayName: 'Claude Fable 5.2',
      context_window_tokens: 1000000,
      description: 'Máxima capacidade disponível'
    });
    assert.equal(fable.isUiCreative, true);
  });

  test('ranks diverse model families per capabilityTier and picks cross-family reviewers', () => {
    const catalog = {
      google: [{ id: 'gemini-4', displayName: 'Gemini 4', context: '2M', specialization: 'Frontier reasoning' }],
      ghostcli: [
        { id: 'claude-opus-5-5', displayName: 'Claude Opus 5.5', context_window_tokens: 1000000, description: 'Balanced reasoning' },
        { id: 'z-ai/glm-5.3-flash', displayName: 'GLM 5.3 Flash', context_window_tokens: 1000000, description: 'Fast code responses' },
        { id: 'tencent/Hy4-preview', displayName: 'Hunyuan Hy4 Preview', context_window_tokens: 1000000, description: 'Reasoning and code' },
        { id: 'XiaomiMiMo/MiMo-V2.6-Pro', displayName: 'MiMo V2.6 Pro', context_window_tokens: 1000000, description: 'Code and reasoning' },
        { id: 'gpt-6-astra', displayName: 'GPT-6 Astra', context_window_tokens: 1000000, description: 'Long agentic work' }
      ]
    };

    const fastRes = rankModelsForCapabilityTier('fast_verification', catalog);
    assert.equal(fastRes.recommendedModels[0], 'z-ai/glm-5.3-flash');
    assert.ok(fastRes.vendorPreferences['z-ai'], 'Should expose z-ai preference');
    assert.ok(fastRes.vendorPreferences['tencent'], 'Should expose tencent preference');
    assert.ok(fastRes.vendorPreferences['xiaomi'], 'Should expose xiaomi preference');
    assert.ok(fastRes.crossReviewers.every(id => !id.startsWith('z-ai/')), 'Cross-reviewers should come from other families');
  });

  test('syncAgentsWithModels and syncModelRegistryPlaybook converge and are idempotent', () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'heimdall-router-test-'));
    fs.mkdirSync(path.join(tmpRoot, 'config'), { recursive: true });
    fs.mkdirSync(path.join(tmpRoot, 'playbooks'), { recursive: true });

    fs.copyFileSync(path.resolve('config/models.json'), path.join(tmpRoot, 'config/models.json'));
    fs.copyFileSync(path.resolve('config/agents.json'), path.join(tmpRoot, 'config/agents.json'));
    fs.copyFileSync(path.resolve('playbooks/06-model-registry-matrix.md'), path.join(tmpRoot, 'playbooks/06-model-registry-matrix.md'));

    const firstAgents = syncAgentsWithModels(tmpRoot, false);
    assert.ok(firstAgents && firstAgents.agentCount > 0);
    const secondAgents = syncAgentsWithModels(tmpRoot, false);
    assert.equal(secondAgents.modified, false, 'Second syncAgentsWithModels call should be idempotent');

    const firstPlaybook = syncModelRegistryPlaybook(tmpRoot, false);
    assert.ok(firstPlaybook);
    const secondPlaybook = syncModelRegistryPlaybook(tmpRoot, false);
    assert.equal(secondPlaybook.modified, false, 'Second syncModelRegistryPlaybook call should be idempotent');

    const updatedPlaybook = fs.readFileSync(path.join(tmpRoot, 'playbooks/06-model-registry-matrix.md'), 'utf8');
    assert.ok(updatedPlaybook.includes('claude-sonnet-5-5'), 'Playbook should include claude-sonnet-5-5');
    assert.ok(updatedPlaybook.includes('tencent/Hy4-preview'), 'Playbook should include tencent/Hy4-preview');
    assert.ok(updatedPlaybook.includes('XiaomiMiMo/MiMo-V2.6-Pro'), 'Playbook should include XiaomiMiMo/MiMo-V2.6-Pro');
    assert.ok(!updatedPlaybook.includes('There is no 5.5 release for Sonnet'), 'Playbook should not contain stale Sonnet 5.5 ban');

    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });
});
