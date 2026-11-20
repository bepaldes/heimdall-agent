import os
from PIL import Image, ImageDraw, ImageFont

def render_herdr_cli():
    W, H = 1920, 1080
    img = Image.new('RGB', (W, H), color='#090d16')
    draw = ImageDraw.Draw(img)

    # Fonts
    font_title = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 15)
    font_mono = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 17)
    font_bold = ImageFont.truetype('C:/Windows/Fonts/consolab.ttf', 17)
    font_hud = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 15)

    # --- Windows Terminal Chrome ---
    draw.rectangle([(0, 0), (W, 42)], fill='#18181b')
    # Tab 1 (Active)
    draw.rectangle([(8, 6), (280, 42)], fill='#090d16')
    draw.text((24, 14), 'herdr: heimdall-cockpit', fill='#e2e8f0', font=font_title)
    draw.text((255, 14), 'x', fill='#71717a', font=font_title)
    # Tab 2 (+)
    draw.text((300, 14), '+', fill='#a1a1aa', font=font_title)

    # Window controls
    draw.text((W - 120, 12), '—', fill='#a1a1aa', font=font_title)
    draw.text((W - 75, 12), '□', fill='#a1a1aa', font=font_title)
    draw.rectangle([(W - 46, 0), (W, 42)], fill='#18181b')
    draw.text((W - 28, 12), '✕', fill='#e2e8f0', font=font_title)

    # Separator
    draw.line([(0, 42), (W, 42)], fill='#27272a', width=1)

    # --- Split Panes ---
    split_x = 1120
    top_y = 43
    bottom_y = H - 36

    # Left Pane Header
    draw.rectangle([(0, top_y), (split_x, top_y + 32)], fill='#0f172a')
    draw.text((16, top_y + 6), 'PANE 1 [ACTIVE] — claude-code (opus-4.5) │ dir: ~/heimdall-agent │ git:(main)', fill='#60a5fa', font=font_bold)
    draw.text((split_x - 140, top_y + 6), '● WORKING', fill='#34d399', font=font_bold)

    # Vertical split line
    draw.line([(split_x, top_y), (split_x, bottom_y)], fill='#3b82f6', width=2)

    # Right Pane Header
    draw.rectangle([(split_x + 2, top_y), (W, top_y + 32)], fill='#111827')
    draw.text((split_x + 16, top_y + 6), 'PANE 2 [HERDR AGENT] — peer-reviewer (astra) │ herdr agent prompt', fill='#a78bfa', font=font_bold)
    draw.text((W - 130, top_y + 6), '● STREAMING', fill='#fbbf24', font=font_bold)

    # --- Left Pane Content (Claude Code Execution) ---
    left_lines = [
        (True, '#38bdf8', '╭── Claude Code v0.9.1 ─────────────────────────────────────────────────────────────╮'),
        (False, '#94a3b8', '│ Model: claude-opus-4.5 (Extended 1M Reasoning) │ Provider: GhostCLI / Anthropic   │'),
        (False, '#94a3b8', '│ Context: 42.8k / 200k (21%)                    │ Session Cost: $0.042             │'),
        (True, '#38bdf8', '╰──────────────────────────────────────────────────────────────────────────────────╯'),
        (False, '#e2e8f0', ''),
        (True, '#34d399', 'antigravity> /plan Enrich install guide with dual Herdr & Herdr-App visual paths'),
        (False, '#94a3b8', 'Investigating user environment and terminal workspace architecture...'),
        (False, '#e2e8f0', '  • Found Herdr CLI: C:\\Users\\Bernardo\\.herdr\\...\\herdr.exe (v0.9.5)'),
        (False, '#e2e8f0', '  • Found Herdr-App: C:\\Users\\Bernardo\\...\\herdr-app.exe (GPU desktop)'),
        (False, '#e2e8f0', ''),
        (True, '#60a5fa', '● [EDIT] docs/install-guide.html'),
        (False, '#94a3b8', '  @@ -700,24 +700,56 @@'),
        (False, '#4ade80', '  + <section id="step-3">'),
        (False, '#4ade80', '  +   <h2>03 Herdr Multi-Agent Workspace (Choose: Herdr-App or Herdr CLI)</h2>'),
        (False, '#4ade80', '  +   <p>Select either the GUI desktop app or lightweight CLI multiplexer...</p>'),
        (False, '#94a3b8', '  [File updated: +56 lines, -4 lines]'),
        (False, '#e2e8f0', ''),
        (True, '#fbbf24', '● [TEST] Running non-interactive verification: npm test'),
        (False, '#94a3b8', '  ▶ Catalog and Documentation Integrity Sentinel (29ms) ........... PASS'),
        (False, '#94a3b8', '  ▶ Herdr CLI & Herdr-App Configuration Suites (1021ms) ........... PASS'),
        (False, '#94a3b8', '  ▶ Dynamic Model Router & Symmetric Peer Reviewer (53ms) ......... PASS'),
        (True, '#34d399', '  ✔ 60 passing (4.3s) — Terminating Verification Succeeded'),
        (False, '#e2e8f0', ''),
        (True, '#c084fc', '> herdr agent prompt reviewer "Blind audit of install-guide.html" --split-pane right'),
        (False, '#94a3b8', 'Dispatched ephemeral peer review panel to pane 2. Awaiting review verdict...')
    ]

    curr_y = top_y + 44
    for is_bold, color, text in left_lines:
        f = font_bold if is_bold else font_mono
        draw.text((20, curr_y), text, fill=color, font=f)
        curr_y += 24

    # --- Right Pane Content (Herdr Ephemeral Peer Reviewer) ---
    right_lines = [
        (True, '#a78bfa', '╭── Herdr Ephemeral Review Panel ────────────────────────────────╮'),
        (False, '#94a3b8', '│ Harness: herdr pane split --direction right                   │'),
        (False, '#94a3b8', '│ Peer Model: gpt-6-astra (OpenAI) | Blind Trajectory Reviewer   │'),
        (True, '#a78bfa', '╰────────────────────────────────────────────────────────────────╯'),
        (False, '#e2e8f0', ''),
        (True, '#34d399', '╔════════════════════════════════════════════════════════════════╗'),
        (True, '#34d399', '║ REVIEW VERDICT: APPROVED (READY FOR DEPLOYMENT)                ║'),
        (True, '#34d399', '╚════════════════════════════════════════════════════════════════╝'),
        (False, '#e2e8f0', ''),
        (True, '#e2e8f0', '1. Dual Installation Clarity:'),
        (False, '#94a3b8', '   Option A (Herdr-App) and Option B (Herdr CLI) are distinct.'),
        (False, '#94a3b8', '   The "Which one to choose" guide eliminates confusion.'),
        (False, '#e2e8f0', ''),
        (True, '#e2e8f0', '2. Optional GC-Helper Explanation:'),
        (False, '#94a3b8', '   Correctly emphasizes that standard Anthropic / OpenAI OAuth'),
        (False, '#94a3b8', '   requires zero GC-Helper setup. Clear skip conditions.'),
        (False, '#e2e8f0', ''),
        (True, '#e2e8f0', '3. Zero-Dev-Server Policy Compliance:'),
        (False, '#94a3b8', '   Verified 60/60 tests pass via non-interactive npm test.'),
        (False, '#94a3b8', '   Relative asset paths tested against GitHub Pages root.'),
        (False, '#e2e8f0', ''),
        (True, '#60a5fa', 'herdr: ephemeral review task complete. Auto-closing in 10s...')
    ]

    curr_y = top_y + 44
    for is_bold, color, text in right_lines:
        f = font_bold if is_bold else font_mono
        draw.text((split_x + 18, curr_y), text, fill=color, font=f)
        curr_y += 24

    # --- Bottom Statusline ---
    draw.rectangle([(0, bottom_y), (W, H)], fill='#18181b')
    draw.line([(0, bottom_y), (W, bottom_y)], fill='#27272a', width=1)

    # Status items
    draw.rectangle([(8, bottom_y + 4), (170, H - 4)], fill='#2563eb')
    draw.text((16, bottom_y + 8), '1: heimdall-cockpit*', fill='#ffffff', font=font_hud)

    draw.rectangle([(176, bottom_y + 4), (300, H - 4)], fill='#27272a')
    draw.text((186, bottom_y + 8), '2: peer-reviewer', fill='#cbd5e1', font=font_hud)

    draw.text((320, bottom_y + 8), '│ herdr v0.9.5 │ 2 panes │ socket: C:\\Users\\Bernardo\\AppData\\Roaming\\herdr\\herdr.sock', fill='#94a3b8', font=font_hud)
    draw.text((W - 380, bottom_y + 8), 'Ctrl+B % split │ Ctrl+B z zoom │ herdr pane close', fill='#60a5fa', font=font_hud)

    # Save to both paths
    dest1 = 'docs/assets/herdr-cli-cockpit.png'
    dest2 = 'C:/Apps/bepaldes.github.io/assets/herdr-cli-cockpit.png'
    os.makedirs(os.path.dirname(dest1), exist_ok=True)
    os.makedirs(os.path.dirname(dest2), exist_ok=True)
    img.save(dest1, 'PNG', optimize=True)
    img.save(dest2, 'PNG', optimize=True)
    print(f"Generated {dest1} and {dest2} successfully.")

if __name__ == '__main__':
    render_herdr_cli()
