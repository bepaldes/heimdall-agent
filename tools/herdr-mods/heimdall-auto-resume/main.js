// Tracks active AI agent panes (Claude Code, Codex, Antigravity) and
// auto-resumes them via `hc send` when herdr-core restarts them as plain shells
// after a PC reboot. Also provides a manual "Resume Parked" button.

import { View, div } from "gpui-kit";
import { h_flex } from "gpui-base";
import { terminals, hc, theme, shared, setShared, notify, checking } from "herdr";

const KEY_ENABLED = "heimdall.autoResume.enabled";
const KEY_MAP = "heimdall.autoResume.map";
const SHELL_NAMES = new Set([
  "powershell.exe",
  "pwsh.exe",
  "pwsh",
  "cmd.exe",
  "bash",
  "bash.exe",
  "zsh",
  "fish",
  "sh",
  "nu",
  "nu.exe"
]);

function isPlainShellArgv(argv) {
  if (!Array.isArray(argv) || argv.length === 0) return true;
  const joined = argv.join(" ").toLowerCase();
  if (joined.includes("& 'claude'") || joined.includes("& 'codex'") || joined.includes("& 'agy'")) {
    return false;
  }
  const exe = String(argv[0] ?? "").toLowerCase().split(/[\\/]/).pop();
  return SHELL_NAMES.has(exe);
}

function extractModelFlag(argv) {
  if (!Array.isArray(argv)) return null;
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i] === "--model" && typeof argv[i + 1] === "string" && argv[i + 1].trim()) {
      return argv[i + 1].trim();
    }
  }
  const joined = argv.join(" ");
  const m = joined.match(/--model\s+['"]?([^\s'"]+)['"]?/);
  return m ? m[1] : null;
}

function detectAgent(t) {
  const fgName = String(t?.foreground?.name ?? "").toLowerCase();
  const fgArgv = Array.isArray(t?.foreground?.argv) ? t.foreground.argv : [];
  const argv = Array.isArray(t?.argv) ? t.argv : [];
  const app = String(t?.status?.app ?? "").toLowerCase();
  const joinedArgv = argv.join(" ").toLowerCase();

  if (fgName.includes("claude") || app === "claude-code" || joinedArgv.includes("'claude'")) {
    const model = extractModelFlag(fgArgv) || extractModelFlag(argv);
    const cmd = model ? `claude --model ${model} --continue` : "claude --continue";
    return { agent: "claude", resumeCmd: cmd };
  }

  if (fgName.includes("codex") || app === "codex" || joinedArgv.includes("'codex'")) {
    return { agent: "codex", resumeCmd: "codex resume --last" };
  }

  if (fgName.includes("agy") || app === "antigravity" || joinedArgv.includes("'agy'")) {
    return { agent: "agy", resumeCmd: "agy" };
  }

  return null;
}

function isParkedShell(t) {
  if (!t || t.state !== "live") return false;
  if (t.status?.app) return false;
  const fgName = String(t?.foreground?.name ?? "").toLowerCase();
  if (fgName && !SHELL_NAMES.has(fgName)) return false;
  return isPlainShellArgv(t.argv);
}

export default class HeimdallAutoResume extends View {
  init(_props, cx) {
    this.resumedRuns = new Map();
    this.resuming = false;
    this.lastStatus = "";
    this.parkedCount = 0;
    this.bootTicks = 0;
    this.autoRan = false;

    if (shared(KEY_ENABLED) === undefined) {
      setShared(KEY_ENABLED, true);
    }

    if (checking()) return;

    // Wait ~3 seconds after launch so restored PowerShell prompts finish loading,
    // then run auto-resume once; continue tracking active agents every 5 seconds.
    cx.timer.every(1000, (cx) => {
      this.bootTicks += 1;
      if (!this.autoRan && this.bootTicks >= 3) {
        this.autoRan = true;
        this.syncMap(cx);
        if (shared(KEY_ENABLED) !== false) {
          this.resumeParked(cx, true);
        }
        return;
      }
      if (this.bootTicks % 5 === 0) {
        this.syncMap(cx);
      }
    });
  }

  syncMap(cx) {
    if (checking()) return;
    const list = terminals();
    if (!Array.isArray(list)) return;

    const prev = shared(KEY_MAP);
    const map = prev && typeof prev === "object" && !Array.isArray(prev) ? { ...prev } : {};
    const liveAddresses = new Set();
    let changed = false;

    for (const t of list) {
      if (!t?.address) continue;
      liveAddresses.add(t.address);
      if (t.state !== "live") continue;

      const detected = detectAgent(t);
      if (detected) {
        const cur = map[t.address];
        const label = String(t?.labels?.where ?? t.address);
        const cwd = String(t.last_cwd ?? t.cwd ?? "");
        if (!cur || cur.agent !== detected.agent || cur.resumeCmd !== detected.resumeCmd || cur.cwd !== cwd) {
          map[t.address] = {
            agent: detected.agent,
            resumeCmd: detected.resumeCmd,
            cwd,
            label,
            startedMs: t.program_started_ms ?? 0,
            updatedAt: Date.now()
          };
          changed = true;
        }
      }
    }

    for (const addr of Object.keys(map)) {
      if (!liveAddresses.has(addr)) {
        delete map[addr];
        changed = true;
      }
    }

    if (changed) {
      setShared(KEY_MAP, map);
    }

    const parked = this.findParkedTargets(list, map);
    if (parked.length !== this.parkedCount) {
      this.parkedCount = parked.length;
      cx.notify();
    }
  }

  findParkedTargets(list, map) {
    const targets = [];
    for (const t of list) {
      if (!t?.address || !isParkedShell(t)) continue;
      const saved = map[t.address];
      if (!saved || !saved.resumeCmd) continue;
      const runKey = `${t.address}:${t.program_started_ms ?? 0}`;
      if (this.resumedRuns.has(runKey)) continue;
      targets.push({ terminal: t, saved, runKey });
    }
    return targets;
  }

  resumeParked(cx, isAuto = false) {
    if (checking() || this.resuming) return;
    const list = terminals();
    const map = shared(KEY_MAP);
    if (!Array.isArray(list) || !map || typeof map !== "object") return;

    const targets = this.findParkedTargets(list, map);
    if (targets.length === 0) {
      if (!isAuto) {
        this.lastStatus = "No parked agents to resume";
        cx.notify();
      }
      return;
    }

    this.resuming = true;
    this.lastStatus = `Resuming ${targets.length}...`;
    cx.notify();

    cx.spawn(async (cx) => {
      let ok = 0;
      for (const item of targets) {
        const res = await hc(["send", item.terminal.address, item.saved.resumeCmd]).catch(() => null);
        if (res && res.code === 0) {
          this.resumedRuns.set(item.runKey, Date.now());
          ok += 1;
        }
      }
      this.resuming = false;
      this.parkedCount = this.findParkedTargets(terminals(), shared(KEY_MAP) ?? {}).length;
      this.lastStatus = ok > 0 ? `Resumed ${ok} agent${ok === 1 ? "" : "s"}` : "Resume failed";
      if (ok > 0) {
        notify({ title: "Heimdall Auto-Resume", body: `Resumed ${ok} agent pane${ok === 1 ? "" : "s"}.` });
      }
      cx.notify();
    });
  }

  toggleEnabled(cx) {
    const next = shared(KEY_ENABLED) === false;
    setShared(KEY_ENABLED, next);
    this.lastStatus = next ? "Auto-resume enabled" : "Auto-resume paused";
    cx.notify();
  }

  render(cx) {
    const t = theme();
    const enabled = shared(KEY_ENABLED) !== false;
    const label = this.resuming
      ? "Resuming..."
      : this.parkedCount > 0
        ? `Resume Parked (${this.parkedCount})`
        : "Resume Parked";

    return h_flex()
      .size_full()
      .px(12)
      .gap(10)
      .items_center()
      .bg(t.chrome)
      .border_t(1)
      .border_color(t.border)
      .text_size(11.5)
      .child(
        div()
          .id("heimdall-auto-toggle")
          .px(8)
          .py(3)
          .rounded(6)
          .cursor_pointer()
          .bg(enabled ? t.raised : t.background)
          .text_color(enabled ? t.accent : t.dim)
          .hover((s) => s.bg(t.hover))
          .on_click((_e, cx) => this.toggleEnabled(cx))
          .child(`Auto-Resume: ${enabled ? "ON" : "OFF"}`)
      )
      .child(
        div()
          .id("heimdall-resume-now")
          .px(8)
          .py(3)
          .rounded(6)
          .cursor_pointer()
          .bg(this.parkedCount > 0 ? t.accent : t.raised)
          .text_color(this.parkedCount > 0 ? t.solid_foreground : t.foreground)
          .hover((s) => s.opacity(0.88))
          .on_click((_e, cx) => this.resumeParked(cx, false))
          .child(label)
      )
      .when(Boolean(this.lastStatus), (el) =>
        el.child(div().text_color(t.muted).child(this.lastStatus))
      );
  }
}
