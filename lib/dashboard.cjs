'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { runDoctor, readTelemetrySummary } = require('./doctor.cjs');

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readJsonSafe(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {}
  return fallback;
}

function openInBrowser(filePath, platform = process.platform) {
  if (platform === 'linux' && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
    return false;
  }
  try {
    let child;
    if (platform === 'win32') {
      child = spawn('cmd', ['/c', 'start', '', filePath], { detached: true, stdio: 'ignore' });
    } else if (platform === 'darwin') {
      child = spawn('open', [filePath], { detached: true, stdio: 'ignore' });
    } else {
      child = spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' });
    }
    child.on('error', () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function renderHtml({ doctor, telemetry, mcpServers, models, workspaceMd }) {
  const doctorRows = doctor.checks.map((c) => `
    <tr>
      <td><span class="badge ${escapeHtml(c.status)}">${escapeHtml(c.status.toUpperCase())}</span></td>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.message)}${c.remediation ? `<div class="muted">${escapeHtml(c.remediation)}</div>` : ''}</td>
    </tr>`).join('');

  const mcpRows = Object.entries(mcpServers).map(([id, srv]) => {
    const state = srv.disabled ? 'warn' : 'pass';
    const label = srv.disabled ? 'DISABLED' : 'ENABLED';
    return `<tr><td><span class="badge ${state}">${label}</span></td><td><strong>${escapeHtml(id)}</strong></td><td>${escapeHtml(srv.name || '')}</td></tr>`;
  }).join('') || '<tr><td colspan="3" class="muted">No MCP servers configured.</td></tr>';

  const ruleRows = Object.entries(telemetry.byRule).map(([rule, count]) =>
    `<tr><td><code>${escapeHtml(rule)}</code></td><td><strong>${count}</strong></td></tr>`
  ).join('') || '<tr><td colspan="2" class="muted">No guardrail events logged yet.</td></tr>';

  const modelRows = models.map((m) =>
    `<tr><td><code>${escapeHtml(m.id)}</code></td><td>${escapeHtml(m.displayName || '')}</td><td>${escapeHtml(m.context || '')}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Heimdall Diagnostic Console</title>
  <style>
    :root { --bg:#0b0f17; --panel:#111827; --line:#1f2937; --text:#f3f4f6; --muted:#9ca3af; --pass:#10b981; --warn:#f59e0b; --fail:#ef4444; --accent:#38bdf8; }
    * { box-sizing:border-box; }
    body { margin:0; padding:28px; background:var(--bg); color:var(--text); font-family:ui-sans-serif,system-ui,-apple-system,sans-serif; line-height:1.5; }
    .wrap { max-width:1100px; margin:0 auto; }
    header { display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid var(--line); padding-bottom:14px; margin-bottom:22px; }
    h1 { margin:0; font-size:20px; letter-spacing:0.02em; }
    .meta { color:var(--muted); font-size:13px; }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px; margin-bottom:16px; }
    section { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:16px; }
    h2 { margin:0 0 12px; font-size:14px; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent); }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    td, th { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); vertical-align:top; }
    .badge { display:inline-block; padding:2px 7px; border-radius:4px; font-size:11px; font-weight:700; }
    .pass { background:rgba(16,185,129,.15); color:var(--pass); }
    .warn { background:rgba(245,158,11,.15); color:var(--warn); }
    .fail { background:rgba(239,68,68,.15); color:var(--fail); }
    .muted { color:var(--muted); font-size:12px; margin-top:2px; }
    pre { margin:0; white-space:pre-wrap; font-size:12px; color:#d1d5db; }
    code { color:var(--accent); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Heimdall Diagnostic Console</h1>
      <div class="meta">Generated ${escapeHtml(new Date().toISOString())} &middot; Status: <strong>${escapeHtml(doctor.status.toUpperCase())}</strong></div>
    </header>
    <div class="grid">
      <section>
        <h2>Doctor Healthcheck (${doctor.summary.pass} Pass / ${doctor.summary.warn} Warn / ${doctor.summary.fail} Fail)</h2>
        <table><tbody>${doctorRows}</tbody></table>
      </section>
      <section>
        <h2>Guardrail Telemetry (${telemetry.total} Events)</h2>
        <table><tbody>${ruleRows}</tbody></table>
      </section>
    </div>
    <div class="grid">
      <section>
        <h2>MCP Server Matrix</h2>
        <table><tbody>${mcpRows}</tbody></table>
      </section>
      <section>
        <h2>Registered Models (${models.length})</h2>
        <table><tbody>${modelRows}</tbody></table>
      </section>
    </div>
    <section>
      <h2>Workspace Profile (.heimdall/workspace.md)</h2>
      <pre>${escapeHtml(workspaceMd || 'Not onboarded yet. Run /onboard in this workspace.')}</pre>
    </section>
  </div>
</body>
</html>`;
}

/**
 * Generates a zero-server static HTML diagnostic dashboard and optionally opens it in the browser.
 */
function generateDashboard(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const repoDir = options.repoDir || process.cwd();
  const homeDir = options.homeDir || os.homedir();
  const outPath = options.outPath || path.join(homeDir, '.heimdall', 'dashboard.html');

  const doctor = runDoctor({ rootDir, repoDir });
  const telemetry = readTelemetrySummary(options.telemetryPath || path.join(homeDir, '.heimdall', 'telemetry.jsonl'));
  const mcpData = readJsonSafe(path.join(rootDir, 'config', 'mcp.resolved.json'), { mcpServers: {} });
  const modelsData = readJsonSafe(path.join(rootDir, 'config', 'models.json'), {});
  const models = Object.values(modelsData).flatMap((v) => (Array.isArray(v) ? v : []));
  const workspacePath = path.join(repoDir, '.heimdall', 'workspace.md');
  const workspaceMd = fs.existsSync(workspacePath) ? fs.readFileSync(workspacePath, 'utf8') : '';

  const html = renderHtml({
    doctor,
    telemetry,
    mcpServers: mcpData.mcpServers || {},
    models,
    workspaceMd
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  const opened = options.openBrowser !== false ? openInBrowser(outPath, options.platform) : false;
  return { outPath, opened, doctorStatus: doctor.status };
}

module.exports = { generateDashboard, openInBrowser };
