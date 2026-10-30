import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpConfigPath = path.join(__dirname, '..', 'config', 'mcp.json');

test('Heimdall MCP Registry and OpenDesign Specification', async (t) => {
  await t.test('mcp.json registry exists and is valid JSON', () => {
    assert.equal(fs.existsSync(mcpConfigPath), true);
    const raw = fs.readFileSync(mcpConfigPath, 'utf8');
    const data = JSON.parse(raw);
    assert.ok(data.mcpServers);
  });

  await t.test('contains standard server definitions including open-design and context7', () => {
    const data = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    assert.ok(data.mcpServers['open-design']);
    assert.ok(data.mcpServers['context7']);
    assert.ok(data.mcpServers['rea']);
    assert.ok(data.mcpServers['chrome-devtools']);
  });

  await t.test('open-design MCP contains required executable, args, and sidecar env', () => {
    const data = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const od = data.mcpServers['open-design'].config;
    assert.ok(od.command.includes('Open Design'));
    assert.ok(Array.isArray(od.args));
    assert.equal(od.args[od.args.length - 1], 'mcp');
    assert.ok(od.env);
    assert.equal(od.env.ELECTRON_RUN_AS_NODE, '1');
    assert.ok(od.env.OD_SIDECAR_CLIENT_ENDPOINT);
    assert.ok(od.env.OD_DATA_DIR);
  });
});
