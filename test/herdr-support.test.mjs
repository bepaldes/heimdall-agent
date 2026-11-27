import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { syncHerdrPrograms } = require('../lib/herdr-programs.cjs');
const { syncHerdrAppConfig, detectLinuxGui } = require('../lib/installer-engine.cjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SETUP_PATH = path.join(ROOT, 'setup.mjs');

test('Herdr-App CLI Support & Configuration', async (t) => {
  await t.test('--help lists herdr as a primary subcommand and in examples', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, '--help'], { encoding: 'utf8' });
    assert.match(out, /\bherdr\b.*Configure Herdr-App/i);
    assert.match(out, /heimdall herdr/i);
  });

  await t.test('herdr --dry-run completes cleanly without modifying state', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, 'herdr', '--dry-run'], { encoding: 'utf8' });
    assert.match(out, /=== Herdr-App Configuration & Clipboard Fix ===/i);
    assert.match(out, /\[DRY RUN\]/i);
  });

  await t.test('--herdr-fix alias is recognized', () => {
    const out = execFileSync(process.execPath, [SETUP_PATH, '--herdr-fix', '--dry-run'], { encoding: 'utf8' });
    assert.match(out, /=== Herdr-App Configuration & Clipboard Fix ===/i);
    assert.match(out, /\[DRY RUN\]/i);
  });

  await t.test('herdr command configures keys.json and settings.json with valid UTF-8 without BOM', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-cli-test-'));
    try {
      const out = execFileSync(process.execPath, [SETUP_PATH, 'herdr'], {
        encoding: 'utf8',
        env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome }
      });
      assert.match(out, /✔ Configured keys\.json/i);
      assert.match(out, /✔ Configured settings\.json/i);

      const herdrDir = path.join(tmpHome, '.config', 'herdr-app');
      const keysPath = path.join(herdrDir, 'keys.json');
      const settingsPath = path.join(herdrDir, 'settings.json');

      assert.ok(fs.existsSync(keysPath), 'keys.json should exist');
      assert.ok(fs.existsSync(settingsPath), 'settings.json should exist');

      // Verify raw bytes do not start with UTF-8 BOM (\xEF\xBB\xBF)
      const keysBuf = fs.readFileSync(keysPath);
      assert.notDeepStrictEqual(keysBuf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'keys.json must not have UTF-8 BOM');

      const settingsBuf = fs.readFileSync(settingsPath);
      assert.notDeepStrictEqual(settingsBuf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'settings.json must not have UTF-8 BOM');

      const keys = JSON.parse(keysBuf.toString('utf8'));
      if (os.platform() === 'darwin') {
        assert.equal(keys.terminal?.['cmd-v'], 'terminal.paste');
      } else if (os.platform() === 'win32') {
        assert.equal(keys.terminal?.['ctrl-v'], 'terminal.paste');
        assert.equal(keys.terminal?.['ctrl-shift-v'], 'send:\u001bv');
        assert.equal(keys.terminal?.['ctrl-c'], 'terminal.copy');
      } else {
        assert.equal(keys.terminal?.['ctrl-c'], undefined, 'Linux must not override Ctrl+C SIGINT');
        assert.equal(keys.terminal?.['ctrl-v'], undefined, 'Linux must not override Ctrl+V');
        assert.equal(keys.terminal?.['ctrl-shift-c'], 'terminal.copy');
        assert.equal(keys.terminal?.['ctrl-shift-v'], 'terminal.paste');
      }

      const settings = JSON.parse(settingsBuf.toString('utf8'));
      assert.equal(settings.copy_on_select, true);
      if (fs.existsSync(path.join(herdrDir, 'layouts', 'Herdr-Roundup.json'))) {
        assert.equal(settings.layout, 'Herdr-Roundup', 'Herdr-Roundup should be active when installed');
      } else {
        assert.equal(settings.layout, undefined, 'Herdr-Roundup must not be forced when layout file is missing');
      }

      const modDir = path.join(herdrDir, 'mods', 'heimdall-auto-resume');
      assert.ok(fs.existsSync(path.join(modDir, 'mod.json')), 'heimdall-auto-resume mod.json should be installed');
      assert.ok(fs.existsSync(path.join(modDir, 'main.js')), 'heimdall-auto-resume main.js should be installed');
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  await t.test('syncHerdrPrograms registers non-native proxy models, preserves manual entries, and writes without BOM', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-programs-test-'));
    try {
      const programsPath = path.join(tmpDir, 'programs.json');
      const errorPath = path.join(tmpDir, 'programs.error');

      // Seed with BOM, manual entries, and an existing claude --model entry with a custom key
      const initial = {
        programs: {
          'my-custom-tool': { name: 'My Tool', run: ['mytool'] },
          'glm-5-3': { name: 'GLM 5.3', icon: 'icons/claude.svg', run: ['claude', '--model', 'z-ai/glm-5.3'] },
          'hunyuan-hy4': { name: 'Old Hunyuan', icon: 'icons/claude.svg', run: ['claude', '--model', 'tencent/Hy4-preview'] }
        },
        shells: ['pwsh']
      };
      fs.writeFileSync(programsPath, '\uFEFF' + JSON.stringify(initial, null, 2), 'utf8');
      fs.writeFileSync(errorPath, 'stale error', 'utf8');

      const catalog = {
        ghostcli: [
          { id: 'claude-fable-5.2', displayName: 'Claude Fable 5.2' },
          { id: 'gpt-6-astra', displayName: 'GPT-6 Astra' },
          { id: 'gemini-4-hydrogen-high', displayName: 'Gemini 4 Hydrogen' },
          { id: 'z-ai/glm-5.3', displayName: 'GLM 5.3' },
          { id: 'tencent/Hy4-preview', displayName: 'Hunyuan Hy4 Preview' },
          { id: 'deepseek-ai/DeepSeek-V4.1-Flash-1017', displayName: 'DeepSeek V4.1 Flash' },
          { id: 'XiaomiMiMo/MiMo-V2.6-Pro', displayName: 'MiMo V2.6 Pro' }
        ]
      };

      const res = syncHerdrPrograms(tmpDir, catalog, { claudeInstalled: true });
      assert.equal(res.updated, true);
      assert.equal(res.count, 3);
      assert.equal(fs.existsSync(errorPath), false, 'programs.error should be cleared');

      const buf = fs.readFileSync(programsPath);
      assert.notDeepStrictEqual(buf.slice(0, 3), Buffer.from([0xef, 0xbb, 0xbf]), 'programs.json must not have UTF-8 BOM');

      const parsed = JSON.parse(buf.toString('utf8'));
      assert.deepEqual(parsed.shells, ['pwsh']);
      assert.deepEqual(parsed.programs['my-custom-tool'], { name: 'My Tool', run: ['mytool'] });
      assert.equal(parsed.programs['glm-5-3'], undefined, 'GLM entries should be removed/excluded');
      // Updated in place under existing key without creating a duplicate key
      assert.deepEqual(parsed.programs['hunyuan-hy4'], {
        name: 'Hunyuan Hy4 Preview',
        icon: 'icons/claude.svg',
        run: ['claude', '--model', 'tencent/Hy4-preview']
      });
      assert.equal(parsed.programs['hunyuan-hy4-preview'], undefined);
      assert.equal(parsed.programs['claude-fable-5-2'], undefined);
      assert.equal(parsed.programs['gpt-6-astra'], undefined);
      assert.equal(parsed.programs['gemini-4-hydrogen'], undefined);

      // Skips when claude is not installed
      const skipped = syncHerdrPrograms(tmpDir, catalog, { claudeInstalled: false });
      assert.equal(skipped.updated, false);
      assert.equal(skipped.count, 0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('syncHerdrAppConfig applies macOS cmd bindings and preserves existing layout when Roundup is absent', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-mac-test-'));
    try {
      const herdrDir = path.join(tmpHome, '.config', 'herdr-app');
      fs.mkdirSync(herdrDir, { recursive: true });
      fs.writeFileSync(path.join(herdrDir, 'settings.json'), JSON.stringify({ layout: 'main', theme: 'graphite', copy_on_select: false }));
      fs.writeFileSync(path.join(herdrDir, 'keys.json'), JSON.stringify({ terminal: { 'ctrl-v': 'terminal.paste' } }));

      const ok = syncHerdrAppConfig(false, { platform: 'darwin', homeDir: tmpHome, skipRoundupFetch: true });
      assert.equal(ok, true);

      const keys = JSON.parse(fs.readFileSync(path.join(herdrDir, 'keys.json'), 'utf8'));
      assert.equal(keys.terminal['cmd-v'], 'terminal.paste');
      assert.equal(keys.terminal['cmd-shift-v'], 'send:\u001bv');
      assert.equal(keys.terminal['ctrl-shift-v'], 'send:\u001bv');
      assert.equal(keys.terminal['cmd-c'], 'terminal.copy');
      assert.equal(keys.terminal['ctrl-v'], undefined);

      const settings = JSON.parse(fs.readFileSync(path.join(herdrDir, 'settings.json'), 'utf8'));
      assert.equal(settings.layout, 'main');
      assert.equal(settings.theme, 'graphite');
      assert.equal(settings.copy_on_select, true);
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  await t.test('detectLinuxGui identifies Omarchy, Hyprland, KDE, GNOME, X11, and headless', () => {
    assert.deepEqual(detectLinuxGui({ OMARCHY_PATH: '/usr/share/omarchy', XDG_SESSION_TYPE: 'wayland' }), { desktop: 'omarchy', sessionType: 'wayland' });
    assert.deepEqual(detectLinuxGui({ XDG_CURRENT_DESKTOP: 'Hyprland', WAYLAND_DISPLAY: 'wayland-1' }), { desktop: 'hyprland', sessionType: 'wayland' });
    assert.deepEqual(detectLinuxGui({ XDG_CURRENT_DESKTOP: 'KDE', XDG_SESSION_TYPE: 'wayland' }), { desktop: 'kde', sessionType: 'wayland' });
    assert.deepEqual(detectLinuxGui({ XDG_CURRENT_DESKTOP: 'GNOME', XDG_SESSION_TYPE: 'x11' }), { desktop: 'gnome', sessionType: 'x11' });
    assert.deepEqual(detectLinuxGui({ DISPLAY: ':0' }), { desktop: 'x11', sessionType: 'x11' });
    assert.deepEqual(detectLinuxGui({}), { desktop: 'headless', sessionType: 'headless' });
  });

  await t.test('syncHerdrAppConfig on Linux/Omarchy repairs broken Ctrl+C/Ctrl+V bindings and stale Herdr-Roundup layout', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-linux-test-'));
    try {
      const herdrDir = path.join(tmpHome, '.config', 'herdr-app');
      fs.mkdirSync(herdrDir, { recursive: true });
      fs.writeFileSync(path.join(herdrDir, 'settings.json'), JSON.stringify({ layout: 'Herdr-Roundup', theme: 'graphite', copy_on_select: false }));
      fs.writeFileSync(path.join(herdrDir, 'keys.json'), JSON.stringify({
        terminal: {
          'ctrl-c': 'terminal.copy',
          'ctrl-v': 'terminal.paste',
          'ctrl-shift-v': 'send:\u001bv',
          'ctrl-shift-c': 'terminal.copy'
        },
        global: {
          'ctrl-v': 'terminal.paste'
        }
      }));

      const ok = syncHerdrAppConfig(false, {
        platform: 'linux',
        homeDir: tmpHome,
        env: { OMARCHY_PATH: '/usr/share/omarchy', XDG_SESSION_TYPE: 'wayland' },
        skipRoundupFetch: true
      });
      assert.equal(ok, true);

      const keys = JSON.parse(fs.readFileSync(path.join(herdrDir, 'keys.json'), 'utf8'));
      assert.equal(keys.terminal['ctrl-c'], undefined, 'Ctrl+C must be repaired to SIGINT');
      assert.equal(keys.terminal['ctrl-v'], undefined, 'Ctrl+V must not be forced to terminal.paste on Linux');
      assert.equal(keys.global['ctrl-v'], undefined, 'Global Ctrl+V must be cleared on Linux');
      assert.equal(keys.terminal['ctrl-shift-c'], 'terminal.copy');
      assert.equal(keys.terminal['ctrl-shift-v'], 'terminal.paste');

      const settings = JSON.parse(fs.readFileSync(path.join(herdrDir, 'settings.json'), 'utf8'));
      assert.equal(settings.layout, undefined, 'Stale Herdr-Roundup layout must be cleared when missing');
      assert.equal(settings.theme, 'graphite');
      assert.equal(settings.copy_on_select, true);
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  await t.test('syncHerdrAppConfig installs Herdr-Roundup layout, mods, themes, and keys from cached repo', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-roundup-cache-test-'));
    try {
      const cacheDir = path.join(tmpHome, '.cache', 'heimdall', 'herdr-roundup');
      fs.mkdirSync(path.join(cacheDir, 'layouts'), { recursive: true });
      fs.mkdirSync(path.join(cacheDir, 'mods', 'roundup-tabs'), { recursive: true });
      fs.mkdirSync(path.join(cacheDir, 'themes'), { recursive: true });
      fs.writeFileSync(path.join(cacheDir, 'layouts', 'Herdr-Roundup.json'), JSON.stringify({ id: 'root' }));
      fs.writeFileSync(path.join(cacheDir, 'mods', 'roundup-tabs', 'mod.json'), JSON.stringify({ name: 'roundup-tabs' }));
      fs.writeFileSync(path.join(cacheDir, 'mods', 'roundup-tabs', 'gpui-kit.d.ts'), '// ignore');
      fs.writeFileSync(path.join(cacheDir, 'themes', 'Herdr-Roundup.json'), JSON.stringify({ background: '#000000' }));
      fs.writeFileSync(path.join(cacheDir, 'keys.json'), JSON.stringify({
        'layout:Herdr-Roundup': { 'cmd-w': 'roundup-tabs.close' }
      }));

      const ok = syncHerdrAppConfig(false, {
        platform: 'linux',
        homeDir: tmpHome,
        env: { OMARCHY_PATH: '/usr/share/omarchy', XDG_SESSION_TYPE: 'wayland' },
        skipRoundupFetch: true
      });
      assert.equal(ok, true);

      const herdrDir = path.join(tmpHome, '.config', 'herdr-app');
      assert.ok(fs.existsSync(path.join(herdrDir, 'layouts', 'Herdr-Roundup.json')));
      assert.ok(fs.existsSync(path.join(herdrDir, 'mods', 'roundup-tabs', 'mod.json')));
      assert.equal(fs.existsSync(path.join(herdrDir, 'mods', 'roundup-tabs', 'gpui-kit.d.ts')), false);
      assert.ok(fs.existsSync(path.join(herdrDir, 'themes', 'Herdr-Roundup.json')));

      const settings = JSON.parse(fs.readFileSync(path.join(herdrDir, 'settings.json'), 'utf8'));
      assert.equal(settings.layout, 'Herdr-Roundup');
      const keys = JSON.parse(fs.readFileSync(path.join(herdrDir, 'keys.json'), 'utf8'));
      assert.deepEqual(keys['layout:Herdr-Roundup'], { 'cmd-w': 'roundup-tabs.close' });
    } finally {
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });
});
