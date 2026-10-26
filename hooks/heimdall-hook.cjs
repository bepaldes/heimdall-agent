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

const MAX_STDIN = 1024 * 1024; // 1 MiB

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
  return 1000000; // 1M default maximum
}

function trackContextUsage(payloadRaw) {
  const session = loadSessionState();
  session.turns = (session.turns || 0) + 1;
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
      // Block destructive system commands
      if (/(^|[;&|]\s*)(rm\s+-rf\s+(\/|~|\$HOME|\.\/|\*)|rmdir\s+\/s\s+\/q\s+[a-zA-Z]:\\)/i.test(command)) {
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Destructive root/system command detected.\n');
        process.exit(2);
      }

      // Branch-aware force push check
      if (/git\s+push\s+.*(-f\b|--force\b|--force-with-lease\b)/i.test(command)) {
        // Explicit protected branch in command target
        if (/\b(origin\s+)?(main|master|release|production)\b/i.test(command)) {
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
      if (lineCount > 800) {
        process.stderr.write(`[Heimdall Karpathy Sentinel] Advisory: File '${filePath}' exceeds 800 lines (${lineCount} lines). Consider decomposing or keeping edits minimal.\n`);
      }
      break;
    }

    case 'post-write': {
      process.stderr.write('[Heimdall Verification Sentinel] File updated. Verify changes with automated tests (TDD) / Playwright E2E before concluding.\n');
      break;
    }

    case 'pre-compact': {
      clearSessionState();
      process.stderr.write('[Heimdall Lifecycle Sentinel] Context compaction occurring. Ensure active tasks, rulings, and pending ledger items are preserved on disk.\n');
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
