'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SUPPORTED_PROFILE_TOOLS = new Set(['claude', 'codex', 'agy']);

/**
 * Resolves the ~/.heimdall-state.json path for a given home directory.
 */
function getStateFilePath(homeDir = os.homedir()) {
  return path.join(homeDir, '.heimdall-state.json');
}

/**
 * Loads ~/.heimdall-state.json safely, returning normalized defaults.
 */
function loadHeimdallState(homeDir = os.homedir()) {
  const stateFile = getStateFilePath(homeDir);
  let raw = {};
  if (fs.existsSync(stateFile)) {
    try {
      raw = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {}
  }
  return {
    agents: Array.isArray(raw.agents) ? raw.agents : null,
    profiles: raw.profiles && typeof raw.profiles === 'object' ? raw.profiles : {},
    selectedProfiles: Array.isArray(raw.selectedProfiles) ? raw.selectedProfiles : null,
    savedAt: raw.savedAt || null
  };
}

/**
 * Persists ~/.heimdall-state.json cleanly without BOM.
 */
function saveHeimdallState(state, homeDir = os.homedir()) {
  const stateFile = getStateFilePath(homeDir);
  const payload = {
    agents: Array.isArray(state.agents) ? state.agents : ['all'],
    profiles: state.profiles && typeof state.profiles === 'object' ? state.profiles : {},
    selectedProfiles: Array.isArray(state.selectedProfiles) ? state.selectedProfiles : null,
    savedAt: new Date().toISOString()
  };
  fs.writeFileSync(stateFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return payload;
}

/**
 * Parses a profile identifier "<tool>/<name>" into normalized parts.
 */
function parseProfileId(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Profile ID must be in the format <tool>/<name> (e.g. claude/work).');
  }
  const parts = id.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid profile ID "${id}". Expected <tool>/<name>.`);
  }
  const tool = parts[0].toLowerCase();
  const name = parts[1].toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  if (!SUPPORTED_PROFILE_TOOLS.has(tool)) {
    throw new Error(`Unsupported profile tool "${tool}". Supported: claude, codex, agy.`);
  }
  return { id: `${tool}/${name}`, tool, name };
}

/**
 * Creates a directory junction (Windows) or symlink (POSIX) if missing.
 */
function linkIfMissing(src, dest, platform = os.platform()) {
  if (!fs.existsSync(src) || fs.existsSync(dest)) return false;
  try {
    const stat = fs.lstatSync(src);
    if (stat.isDirectory()) {
      fs.symlinkSync(src, dest, platform === 'win32' ? 'junction' : 'dir');
      return true;
    }
    if (stat.isFile()) {
      fs.symlinkSync(src, dest, 'file');
      return true;
    }
  } catch {
    // Fallback to copy if symlink privilege is unavailable for files
    try {
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        return true;
      }
    } catch {}
  }
  return false;
}

/**
 * Links common developer dotfiles (.ssh, .gitconfig, .npmrc) into an agy profile home
 * so git/ssh/npm keep working when HOME/USERPROFILE is scoped to the profile.
 */
function ensureAgyHomeLinks(profileDir, realHome = os.homedir(), platform = os.platform()) {
  fs.mkdirSync(profileDir, { recursive: true });
  fs.mkdirSync(path.join(profileDir, '.gemini', 'antigravity-cli'), { recursive: true });
  const linked = [];
  for (const entry of ['.ssh', '.gitconfig', '.npmrc']) {
    const src = path.join(realHome, entry);
    const dest = path.join(profileDir, entry);
    if (linkIfMissing(src, dest, platform)) {
      linked.push(entry);
    }
  }
  return linked;
}

/**
 * Registers a new profile or existing custom directory in ~/.heimdall-state.json.
 */
function addProfile(profileId, { dir = null, homeDir = os.homedir(), platform = os.platform() } = {}) {
  const { id, tool, name } = parseProfileId(profileId);
  const state = loadHeimdallState(homeDir);
  const managed = !dir;
  const resolvedDir = dir
    ? path.resolve(dir)
    : path.join(homeDir, '.heimdall-profiles', tool, name);

  fs.mkdirSync(resolvedDir, { recursive: true });
  if (tool === 'agy') {
    ensureAgyHomeLinks(resolvedDir, homeDir, platform);
  }

  const entry = {
    id,
    tool,
    name,
    dir: resolvedDir,
    managed,
    createdAt: new Date().toISOString()
  };

  state.profiles[id] = entry;
  if (Array.isArray(state.selectedProfiles) && !state.selectedProfiles.includes(id)) {
    state.selectedProfiles.push(id);
  }
  saveHeimdallState(state, homeDir);
  return entry;
}

/**
 * Removes a profile registration from ~/.heimdall-state.json (does not delete user credentials on disk).
 */
function removeProfile(profileId, { homeDir = os.homedir() } = {}) {
  const { id } = parseProfileId(profileId);
  const state = loadHeimdallState(homeDir);
  if (!state.profiles[id]) return false;
  delete state.profiles[id];
  if (Array.isArray(state.selectedProfiles)) {
    state.selectedProfiles = state.selectedProfiles.filter(p => p !== id);
  }
  saveHeimdallState(state, homeDir);
  return true;
}

/**
 * Returns all registered profiles sorted by ID.
 */
function listProfiles(homeDir = os.homedir()) {
  const state = loadHeimdallState(homeDir);
  return Object.values(state.profiles).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Returns the environment variable overrides required to launch a profile cleanly across OSes.
 */
function getProfileLaunchEnv(profile, platform = os.platform()) {
  if (!profile || !profile.tool || !profile.dir) return {};
  if (profile.tool === 'claude') {
    return { CLAUDE_CONFIG_DIR: profile.dir };
  }
  if (profile.tool === 'codex') {
    return { CODEX_HOME: profile.dir };
  }
  if (profile.tool === 'agy') {
    if (platform === 'win32') {
      return { USERPROFILE: profile.dir, HOME: profile.dir };
    }
    return { HOME: profile.dir };
  }
  return {};
}

/**
 * Maps a profile entry to its Heimdall target directories (skills, agents, doctrine, playbooks, hooks, mcp, hud).
 */
function resolveProfileTargets(profile) {
  const baseRoot = profile.tool === 'agy'
    ? path.join(profile.dir, '.gemini')
    : profile.dir;

  const target = {
    id: profile.id,
    tool: profile.tool,
    agentKey: profile.tool === 'agy' ? 'gemini' : profile.tool,
    rootDir: baseRoot,
    skillsDir: path.join(baseRoot, 'skills'),
    agentsDir: path.join(baseRoot, 'agents'),
    playbooksDir: path.join(baseRoot, 'playbooks'),
    commandsDir: profile.tool === 'claude' ? path.join(baseRoot, 'commands') : null,
    hooksDir: profile.tool === 'claude' ? path.join(baseRoot, 'hooks') : null,
    doctrineFile: profile.tool === 'claude'
      ? path.join(baseRoot, 'CLAUDE.md')
      : profile.tool === 'agy'
        ? path.join(baseRoot, 'GEMINI.md')
        : path.join(baseRoot, 'AGENTS.md')
  };
  return target;
}

module.exports = {
  SUPPORTED_PROFILE_TOOLS,
  getStateFilePath,
  loadHeimdallState,
  saveHeimdallState,
  parseProfileId,
  ensureAgyHomeLinks,
  addProfile,
  removeProfile,
  listProfiles,
  getProfileLaunchEnv,
  resolveProfileTargets
};
