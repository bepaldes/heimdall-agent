#!/usr/bin/env node
'use strict';

/**
 * Heimdall Lifecycle Hook Dispatcher
 * Surgical, event-driven guardrails for Claude Code & AI harnesses.
 */

const MAX_STDIN = 1024 * 1024; // 1 MiB

function readStdin(timeoutMs = 150) {
  return new Promise((resolve) => {
    let raw = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { process.stdin.pause(); } catch {}
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
      const command = (toolInput.command || '').trim();
      // Block destructive system commands
      if (/(^|[;&|]\s*)(rm\s+-rf\s+(\/|~|\$HOME|\.\/|\*)|rmdir\s+\/s\s+\/q\s+[a-zA-Z]:\\)/i.test(command)) {
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Destructive root/system command detected.\n');
        process.exit(2);
      }
      // Block forced git push to main / master
      if (/git\s+push\s+.*(-f|--force).*(main|master)/i.test(command)) {
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Force push to protected branch (main/master) is strictly forbidden.\n');
        process.exit(2);
      }
      // Warn on accidental secret commits
      if (/git\s+add\s+.*(\.env($|\.local)|id_rsa|.*\.pem)/i.test(command)) {
        process.stderr.write('[Heimdall Sentinel Guardrail] BLOCKED: Attempting to stage sensitive credential or secret files.\n');
        process.exit(2);
      }
      break;
    }

    case 'pre-write': {
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
