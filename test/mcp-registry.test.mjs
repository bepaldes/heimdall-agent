import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '..', 'config', 'mcp.template.json');
const RESOLVED_PATH = path.join(__dirname, '..', 'config', 'mcp.resolved.json');

test('Heimdall MCP Registry Template and Resolver', async (t) => {
  await t.test('mcp.template.json exists and is valid JSON', () => {
    assert.equal(fs.existsSync(TEMPLATE_PATH), true);
    const raw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data.mcpServers);
    assert.equal(data.version, '2.0.0');
  });

  await t.test('template contains all standard server definitions', () => {
    const data = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    assert.ok(data.mcpServers['open-design']);
    assert.ok(data.mcpServers['context7']);
    assert.ok(data.mcpServers['rea']);
    assert.ok(data.mcpServers['chrome-devtools']);
    assert.ok(data.mcpServers['mobbin']);
  });

  await t.test('template uses resolve hints for npm-global servers instead of npx', () => {
    const data = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    const ctx7 = data.mcpServers['context7'];
    assert.ok(ctx7.resolve, 'context7 must have a resolve hint');
    assert.equal(ctx7.resolve.type, 'npm-global');
    assert.equal(ctx7.resolve.package, '@upstash/context7-mcp');

    const chrome = data.mcpServers['chrome-devtools'];
    assert.ok(chrome.resolve, 'chrome-devtools must have a resolve hint');
    assert.equal(chrome.resolve.type, 'npm-global');
    assert.equal(chrome.resolve.package, 'chrome-devtools-mcp');
  });

  await t.test('template never uses npx in any command field', () => {
    const raw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const data = JSON.parse(raw);
    for (const [name, server] of Object.entries(data.mcpServers)) {
      if (server.config?.command) {
        assert.ok(
          !server.config.command.includes('npx'),
          `${name} config.command must not use npx — got: ${server.config.command}`
        );
      }
    }
  });

  await t.test('every server has a disabled field', () => {
    const data = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    for (const [name, server] of Object.entries(data.mcpServers)) {
      assert.equal(
        typeof server.disabled,
        'boolean',
        `${name} must have a boolean "disabled" field`
      );
    }
  });

  await t.test('open-design template contains required env placeholders', () => {
    const data = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf8'));
    const od = data.mcpServers['open-design'].config;
    assert.ok(od.env);
    assert.equal(od.env.ELECTRON_RUN_AS_NODE, '1');
    assert.ok(od.env.OD_SIDECAR_CLIENT_ENDPOINT);
    assert.ok(od.env.OD_DATA_DIR);
  });

  await t.test('resolved config exists and contains no npx commands', () => {
    assert.equal(fs.existsSync(RESOLVED_PATH), true, 'Run scripts/resolve-mcp.mjs first');
    const data = JSON.parse(fs.readFileSync(RESOLVED_PATH, 'utf8'));
    for (const [name, server] of Object.entries(data.mcpServers)) {
      if (server.config?.command) {
        assert.ok(
          !server.config.command.includes('npx'),
          `Resolved ${name} must not use npx — got: ${server.config.command}`
        );
      }
    }
  });

  await t.test('resolved config strips resolve hints and autoDetect metadata', () => {
    const data = JSON.parse(fs.readFileSync(RESOLVED_PATH, 'utf8'));
    for (const [name, server] of Object.entries(data.mcpServers)) {
      assert.equal(server.resolve, undefined, `${name} should not have resolve hint in resolved output`);
      assert.equal(server.autoDetect, undefined, `${name} should not have autoDetect in resolved output`);
    }
  });

  await t.test('escapeToml and escapeYamlString escape quotes, backslashes, newlines, and tabs', async () => {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const { escapeToml, escapeYamlString } = require('../lib/mcp-serialize.cjs');
    const sample = 'C:\\path\\"test"\nline2\tü';
    assert.equal(escapeToml(sample), 'C:\\\\path\\\\\\"test\\"\\nline2\\tü');
    assert.equal(escapeYamlString(sample), 'C:\\\\path\\\\\\"test\\"\\nline2\\tü');
  });
});