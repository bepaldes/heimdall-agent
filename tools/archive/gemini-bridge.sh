#!/usr/bin/env sh
# ==============================================================================
# Cross-Agent Multi-Model Bridge -> Google Antigravity / Gemini CLI
# Portable POSIX shim for Linux and macOS environments.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if command -v pwsh >/dev/null 2>&1; then
    exec pwsh -NoLogo -NoProfile -File "$SCRIPT_DIR/gemini-bridge.ps1" "$@"
elif command -v powershell >/dev/null 2>&1; then
    exec powershell -NoLogo -NoProfile -File "$SCRIPT_DIR/gemini-bridge.ps1" "$@"
else
    echo "[!] PowerShell Core (pwsh) is required to run multi-agent bridge scripts on Linux/macOS." >&2
    echo "    Install pwsh via: 'brew install powershell' (macOS) or package manager on Linux." >&2
    exit 1
fi
