#!/usr/bin/env node
'use strict';

/**
 * Heimdall Lifecycle Hook Dispatcher
 * Surgical, event-driven guardrails for Claude Code & AI harnesses.
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { lookupModelContextFromCatalog } = require('../lib/model-context.cjs');

const MAX_STDIN = 1024 * 1024; // 1 MiB

function recordTelemetryEvent(rule, action, detail = '') {
  try {
    const telemetryPath = process.env.HEIMDALL_TELEMETRY_PATH || path.join(os.homedir(), '.heimdall', 'telemetry.jsonl');
    fs.mkdirSync(path.dirname(telemetryPath), { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      rule,
      action,
      detail: String(detail).slice(0, 200),
      cwd: process.cwd()
    };
    fs.appendFileSync(telemetryPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch {}
}

function getSessionFilePath() {
  const ppid = process.ppid || 'global';
  return path.join(os.tmpdir(), `heimdall-session-${ppid}.json`);
}

function loadSessionState() {
  try {
    const p = getSessionFilePath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {}
  return { turns: 0, estimatedTokens: 0, updatedAt: Date.now() };
}

function saveSessionState(state) {
  try {
    const p = getSessionFilePath();
    fs.writeFileSync(p, JSON.stringify(state), 'utf8');
  } catch {}
}

function clearSessionState() {
  try {
    const p = getSessionFilePath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

function getActiveContextLimit() {
  if (process.env.HEIMDALL_ACTIVE_CONTEXT_LIMIT) {
    const parsed = parseInt(process.env.HEIMDALL_ACTIVE_CONTEXT_LIMIT, 10);
    if (parsed > 0) return parsed;
  }
  const activeModel =
    process.env.HEIMDALL_ACTIVE_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.GEMINI_MODEL;
  if (activeModel) {
    const resolved = lookupModelContextFromCatalog(activeModel, path.join(__dirname, '..'));
    if (resolved && resolved.tokens > 0) return resolved.tokens;
  }
  return 1000000; // 1M default maximum
}

function trackContextUsage(payloadRaw) {
  const session = loadSessionState();
  session.turns = (session.turns || 0) + 1;
  // Advisory-only heuristic (~3.8 chars/token); not a live tokenizer count
  const turnTokens = Math.round((payloadRaw ? payloadRaw.length : 0) / 3.8);
  session.estimatedTokens = (session.estimatedTokens || 0) + turnTokens;
  session.updatedAt = Date.now();
  saveSessionState(session);

  const limit = getActiveContextLimit();
  const warningTokens = Math.round(limit * 0.75);

  if (session.estimatedTokens >= warningTokens || session.turns >= 40) {
    const tokenDisplay = session.estimatedTokens >= 1000
      ? `${Math.round(session.estimatedTokens / 1000)}K`
      : `${session.estimatedTokens}`;
    const limitDisplay = limit >= 1000000
      ? `${Math.round(limit / 1000000)}M`
      : `${Math.round(limit / 1000)}K`;
    process.stderr.write(`[Heimdall Context Sentinel] WARNING: Session approaching context threshold (~${tokenDisplay} / ${limitDisplay} max tokens, turn ${session.turns} of 40-turn cadence). Trigger /compact or persist active state to disk.\n`);
    recordTelemetryEvent('context-threshold', 'warn', `turns=${session.turns}`);
  }
}

function readStdin(timeoutMs = 800) {
  return new Promise((resolve) => {
    let raw = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(raw);
      }
    }, timeoutMs);
    timer.unref();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      if (raw.length < MAX_STDIN) {
        const remaining = MAX_STDIN - raw.length;
        raw += chunk.substring(0, remaining);
      }
    });
    process.stdin.on('end', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(raw);
      }
    });
    process.stdin.on('error', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(raw);
      }
    });
  });
}

function getActiveGitBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

/**
 * Splits a shell command string into individual command segments on ;, &&, ||, |, &, or newlines,
 * respecting single and double quotes.
 */
function splitShellSegments(command) {
  const segments = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === '\\' && quote === '"' && i + 1 < command.length) {
        current += ch + command[++i];
        continue;
      }
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === ';' || ch === '\n' || ch === '|' || ch === '&') {
      if (current.trim()) segments.push(current.trim());
      current = '';
      if ((ch === '|' || ch === '&') && command[i + 1] === ch) i++;
      continue;
    }

    current += ch;
  }

  if (current.trim()) segments.push(current.trim());
  return segments;
}

/**
 * Tokenizes a single shell segment into normalized lowercase tokens with outer quotes stripped.
 */
function tokenizeSegment(segment) {
  const tokens = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (quote) {
      if (ch === '\\' && quote === '"' && i + 1 < segment.length) {
        current += segment[++i];
        continue;
      }
      if (ch === quote) {
        quote = null;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current.toLowerCase());
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current) tokens.push(current.toLowerCase());
  return tokens;
}

function commandBasename(token) {
  const norm = token.replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/');
  const base = idx >= 0 ? norm.slice(idx + 1) : norm;
  return base.replace(/\.(exe|cmd|bat|ps1)$/i, '');
}

function isDestructiveSegment(tokens) {
  if (tokens.length === 0) return false;
  const cmd = commandBasename(tokens[0]);

  if (cmd === 'rm') {
    let hasRecursive = false;
    let hasForce = false;
    const targets = [];

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.startsWith('--')) {
        if (t === '--recursive') hasRecursive = true;
        else if (t === '--force') hasForce = true;
      } else if (t.startsWith('-') && t.length > 1) {
        if (t.includes('r')) hasRecursive = true;
        if (t.includes('f')) hasForce = true;
      } else {
        targets.push(t);
      }
    }

    if (hasRecursive && hasForce) {
      return targets.some(t => /^(\/|\/\*|~|~\/*|\$home|\$\{home\}|\.\/|\*|[a-z]:\\?)$/i.test(t));
    }
  }

  if (cmd === 'rmdir') {
    const hasS = tokens.includes('/s');
    const hasQ = tokens.includes('/q');
    const hasDriveRoot = tokens.some(t => /^[a-z]:\\?$/i.test(t));
    if (hasS && hasQ && hasDriveRoot) return true;
  }

  return false;
}

function isDevServerSegment(tokens) {
  if (tokens.length === 0) return false;
  // Skip leading env assignments (e.g. PORT=3000 vite)
  let idx = 0;
  while (idx < tokens.length && /^[a-z_][a-z0-9_]*=/.test(tokens[idx])) idx++;
  if (idx >= tokens.length) return false;

  const cmd = commandBasename(tokens[idx]);
  const rest = tokens.slice(idx + 1);

  if (cmd === 'npm' || cmd === 'pnpm' || cmd === 'yarn' || cmd === 'bun') {
    const sub = rest[0] === 'run' ? rest[1] : rest[0];
    if (sub && /^(dev|start|serve)(:|$)/i.test(sub)) return true;
  }

  const directDevTools = new Set(['vite', 'live-server', 'http-server', 'nodemon', 'uvicorn']);
  if (directDevTools.has(cmd)) return true;

  if ((cmd === 'next' || cmd === 'nuxt') && rest[0] === 'dev') return true;
  if ((cmd === 'flask' && rest[0] === 'run')) return true;
  if ((cmd === 'python' || cmd === 'python3') && rest[0] === 'manage.py' && rest[1] === 'runserver') return true;

  if (cmd === 'npx' || cmd === 'bunx' || cmd === 'pnpx') {
    let i = 0;
    while (i < rest.length) {
      const t = rest[i];
      if (t === '-p' || t === '--package') { i += 2; continue; }
      if (t.startsWith('-')) { i++; continue; }
      const pkg = commandBasename(t.split('@')[0]);
      if (directDevTools.has(pkg) || pkg === 'next' || pkg === 'nuxt') return true;
      break;
    }
  }

  if (cmd === 'node') {
    const scriptToken = rest.find(t => !t.startsWith('-'));
    if (scriptToken) {
      const scriptBase = commandBasename(scriptToken).replace(/\.(m|c)?js$/i, '');
      if (directDevTools.has(scriptBase) || scriptBase === 'next' || scriptBase === 'nuxt') return true;
    }
  }

  return false;
}

async function main() {
  const event = process.argv[2] || '';
  const raw = await readStdin();

  let payload = {};
  if (raw && raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      // Not JSON or empty
    }
  }

  const toolInput = payload.tool_input || payload.input || {};

  switch (event) {
    case 'pre-bash': {
      trackContextUsage(raw);
      const command = (toolInput.command || '').trim();
      const segments = splitShellSegments(command);

      // Block destructive system commands
      if (segments.some(seg => isDestructiveSegment(tokenizeSegment(seg)))) {
        recordTelemetryEvent('destructive-cmd', 'block', command);
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Destructive root/system command detected.\n');
        process.exit(2);
      }

      // Block dev server commands (STRICT ZERO DEV-SERVER POLICY)
      if (segments.some(seg => isDevServerSegment(tokenizeSegment(seg)))) {
        recordTelemetryEvent('zero-dev-server', 'block', command);
        process.stderr.write(`[Heimdall Sentinel Guardrail] BLOCKED: Dev server execution detected ("${command}"). Running development servers is strictly prohibited by user doctrine. Use non-interactive terminating checks (npm test, npm run build, vitest run, lint, typecheck).\n`);
        process.exit(2);
      }

      // Branch-aware force push check
      if (/git\s+push\s+.*(-f\b|--force\b|--force-with-lease\b)/i.test(command)) {
        // Explicit protected branch in command target
        if (/\b(origin\s+)?(main|master|release|production)\b/i.test(command)) {
          recordTelemetryEvent('force-push', 'block', command);
          process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Force push to protected branch (main/master/release) is strictly forbidden.\n');
          process.exit(2);
        }

        const tokens = command.trim().split(/\s+/);
        const lastToken = tokens[tokens.length - 1];
        const isExplicitProtected = /^(main|master|release|production)$/i.test(lastToken);

        const currentBranch = getActiveGitBranch();
        const isCurrentProtected = /^(main|master|release|production)$/i.test(currentBranch);

        const hasExplicitFeature = tokens.some(t =>
          /^(feature|bugfix|hotfix|chore|test|experiment)\//i.test(t) ||
          (!/^(-|main|master|release|production|origin|git|push)$/i.test(t) && !t.startsWith('-'))
        );

        if (isExplicitProtected || (!hasExplicitFeature && isCurrentProtected)) {
          recordTelemetryEvent('force-push', 'block', command);
          process.stderr.write(`[Heimdall Sentinel Guardrail] BLOCKED: Force push to protected branch '${currentBranch || 'main'}' is strictly forbidden.\n`);
          process.exit(2);
        }

        // On feature/working branches, allow force push with an advisory
        if (currentBranch && !isCurrentProtected) {
          process.stderr.write(`[Heimdall Sentinel] Advisory: Force push permitted on feature branch '${currentBranch}'. Verify remote commits before rewriting history.\n`);
        }
      }

      // Warn on accidental secret commits
      if (/git\s+add\s+.*(\.env($|\.local)|id_rsa|.*\.pem)/i.test(command)) {
        recordTelemetryEvent('secret-staging', 'block', command);
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Attempting to stage sensitive credential or secret files.\n');
        process.exit(2);
      }
      break;
    }

    case 'pre-write': {
      trackContextUsage(raw);
      const filePath = toolInput.file_path || toolInput.path || '';
      const content = toolInput.content || '';
      const lineCount = content ? content.split('\n').length : 0;
      const isCanvasArtifact = /\.(html?|svg)$/i.test(filePath) || content.includes('data-od-id') || Boolean(process.env.OPENDESIGN);
      if (lineCount > 800 && !isCanvasArtifact) {
        recordTelemetryEvent('karpathy-800-lines', 'warn', `${filePath} (${lineCount} lines)`);
        process.stderr.write(`[Heimdall Karpathy Sentinel] Advisory: File '${filePath}' exceeds 800 lines (${lineCount} lines). Consider decomposing or keeping edits minimal.\n`);
      }
      const normPath = filePath.replace(/\\/g, '/');
      if (/(^|\/)(docs\/superpowers\/plans|\.claude\/plans)\/[^/]+\.md$/i.test(normPath)) {
        recordTelemetryEvent('plan-location', 'block', filePath);
        process.stderr.write(`[Heimdall Plan Sentinel] BLOCKED: Do not save plans to '${filePath}'. Save all plans to 'docs/designs/YYYY-MM-DD <plan name>.md' strictly following playbooks/05-canonical-plan-template.md.\n`);
        process.exit(2);
      }
      if (/(^|\/)docs\/designs\/[^/]+\.md$/i.test(normPath) && !normPath.includes('/old/')) {
        const missingCols = [];
        if (!/Heimdall Agent Persona/i.test(content)) missingCols.push('Heimdall Agent Persona');
        if (!/Required Skills/i.test(content)) missingCols.push('Required Skills (SKILL.md)');
        if (missingCols.length > 0) {
          process.stderr.write(`[Heimdall Plan Sentinel] Advisory: Plan '${filePath}' is missing required Section 3 columns: ${missingCols.join(', ')}. Follow playbooks/05-canonical-plan-template.md.\n`);
        }
      }
      break;
    }

    case 'post-write': {
      // Post-write prompt injection removed to prevent agent stalling between tool calls
      break;
    }

    case 'user-prompt': {
      process.stdout.write('[Heimdall Communication Doctrine] Lead with BLUF (conclusion in first 1-2 sentences). Use ASD-STE100 for procedural steps: active imperative verb first, <=20 words/step, zero banned words (ensure, properly, appropriately, gracefully, as needed, etc.).\n');
      const promptText = String(payload.prompt || payload.user_prompt || toolInput.prompt || '');
      const isPlanCommand = /(^|\s)\/(plan|orchestrate|grill-me)\b/i.test(promptText);
      const isNaturalPlan = /\b(make|create|write|build|draft)\s+(a|an|the)?\s*(implementation\s+)?plan\b/i.test(promptText);
      if (isPlanCommand || isNaturalPlan) {
        process.stdout.write('[Heimdall Plan Gate] Load ~/.claude/agents/orchestrator.md, save plan to docs/designs/YYYY-MM-DD <plan name>.md (never docs/superpowers/plans/), assign Heimdall Agent Persona (agents/*.md) + Required Skills (SKILL.md) per task in playbooks/05-canonical-plan-template.md, and enforce reviewer.md skill verification.\n');
      }
      break;
    }

    case 'pre-compact': {
      clearSessionState();
      process.stderr.write('[Heimdall Lifecycle Sentinel] Context compaction occurring. Verify active tasks, rulings, and pending ledger items are preserved on disk.\n');
      break;
    }

    default:
      break;
  }

  process.exit(0);
}

main().catch((err) => {
  // Fail open for unexpected errors to avoid blocking the user
  process.stderr.write(`[Heimdall Sentinel] Hook advisory: ${err.message}\n`);
  process.exit(0);
});
