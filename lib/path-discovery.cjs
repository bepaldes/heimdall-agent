'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const EXCLUDED_PATTERNS = [
  '\\windows\\',
  '\\program files\\',
  '\\program files (x86)\\',
  '\\programdata\\',
  '/usr/sbin',
  '/sbin',
  '\\powershell',
  'jdk',
  'jre',
  'javapath',
  'oracle',
  'antigravity-cli',
  '\\appdata\\local\\programs\\',
  '\\appdata\\local\\microsoft\\windowsapps',
  '\\appdata\\local\\agy\\',
  '\\appdata\\local\\hermes\\',
  '\\.codex\\packages\\',
  '\\git\\cmd',
  '\\git\\bin',
  '\\git\\usr\\bin',
  '\\nodejs',
  '\\dotnet'
];

function isExcludedPath(lowerPath) {
  const normalized = lowerPath.replace(/\//g, '\\');
  return EXCLUDED_PATTERNS.some(pattern => normalized.includes(pattern) || lowerPath.includes(pattern));
}

function scoreCandidate(resolvedPath) {
  const lower = resolvedPath.toLowerCase().replace(/\//g, '\\');
  let score = 0;

  try {
    const files = fs.readdirSync(resolvedPath);
    if (files.some(f => f === 'claude-bridge.ps1' || f === 'claude-bridge.sh' || f === 'gemini-bridge.ps1')) {
      score += 100;
    }
  } catch {}

  if (lower.endsWith('\\tools') || lower.includes('\\tools\\')) score += 50;
  if (lower.includes('heimdall')) score += 40;
  if (lower.endsWith('\\.local\\bin')) score += 30;
  if (lower.includes('\\apps\\')) score += 20;

  return score;
}

function detectPathCandidates(pathEnv = process.env.PATH || '', userHome = os.homedir()) {
  const rawDirs = pathEnv.split(path.delimiter).map(d => d.trim()).filter(Boolean);
  const candidates = [];
  const seen = new Set();

  for (const raw of rawDirs) {
    try {
      const resolved = path.resolve(raw);
      const lower = resolved.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);

      if (fs.existsSync(resolved) && !isExcludedPath(lower)) {
        const isToolLike = lower.includes('tool') ||
                           lower.includes('bin') ||
                           lower.includes('.local') ||
                           lower.includes('apps') ||
                           lower.includes('npm') ||
                           lower.includes('cargo') ||
                           lower.includes('heimdall');
        if (isToolLike) {
          candidates.push(resolved);
        }
      }
    } catch {}
  }

  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

  if (candidates.length === 0) {
    candidates.push(path.join(userHome, '.heimdall', 'bin'));
  }

  return candidates;
}

module.exports = {
  detectPathCandidates
};
