'use strict';

const readline = require('node:readline');
const { colors } = require('./harness-detection.cjs');

/**
 * Wraps cursor movement within [0, length - 1].
 */
function moveCursor(index, delta, length) {
  if (length <= 0) return 0;
  return (index + delta + length) % length;
}

/**
 * Toggles a value in a Set and returns the updated Set.
 */
function toggleSelection(selectedSet, value) {
  if (selectedSet.has(value)) {
    selectedSet.delete(value);
  } else {
    selectedSet.add(value);
  }
  return selectedSet;
}

/**
 * Interactive single-select menu using arrow keys + Enter (Esc to go back).
 * Falls back to the first item when stdin is not a TTY.
 * @param {string} title
 * @param {Array<{label: string, value: any, hint?: string}>} items
 * @param {{allowBack?: boolean}} [opts]
 */
async function selectOne(title, items, { allowBack = true } = {}) {
  if (!items || items.length === 0) return null;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return items[0].value;
  }

  return new Promise((resolve) => {
    let cursor = 0;
    let renderedLines = 0;

    const render = () => {
      if (renderedLines > 0) {
        process.stdout.write(`\x1b[${renderedLines}A\x1b[0J`);
      }
      const lines = [`${colors.bold}${colors.cyan}${title}${colors.reset}`];
      items.forEach((item, idx) => {
        const prefix = idx === cursor ? `${colors.cyan}❯${colors.reset}` : ' ';
        const label = idx === cursor ? `${colors.bold}${item.label}${colors.reset}` : item.label;
        const hint = item.hint ? ` ${colors.dim}${item.hint}${colors.reset}` : '';
        lines.push(`  ${prefix} ${label}${hint}`);
      });
      const backHint = allowBack ? '  |  Esc: Back' : '';
      lines.push(`${colors.dim}  ↑/↓: Move  |  Enter: Select${backHint}${colors.reset}`);
      process.stdout.write(lines.join('\n') + '\n');
      renderedLines = lines.length;
    };

    readline.emitKeypressEvents(process.stdin);
    const prevRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(Boolean(prevRaw));
      process.stdin.pause();
    };

    const onKeypress = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
      }
      if (!key) return;
      if (key.name === 'up' || key.name === 'k') {
        cursor = moveCursor(cursor, -1, items.length);
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = moveCursor(cursor, 1, items.length);
        render();
      } else if (allowBack && (key.name === 'escape' || key.name === 'backspace')) {
        cleanup();
        process.stdout.write('\n');
        resolve(null);
      } else if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        process.stdout.write('\n');
        resolve(items[cursor].value);
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

/**
 * Interactive multi-select checkbox menu using arrow keys + Spacebar + Enter (Esc to go back).
 * Returns null if cancelled via Esc, or an array of selected values on Enter.
 * Falls back to preselected values when stdin is not a TTY.
 * @param {string} title
 * @param {Array<{label: string, value: string, hint?: string, checked?: boolean}>} items
 * @param {{allowBack?: boolean}} [opts]
 */
async function selectMany(title, items, { allowBack = true } = {}) {
  if (!items || items.length === 0) return [];
  const selected = new Set(items.filter(i => i.checked).map(i => i.value));

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return Array.from(selected);
  }

  return new Promise((resolve) => {
    let cursor = 0;
    let renderedLines = 0;

    const render = () => {
      if (renderedLines > 0) {
        process.stdout.write(`\x1b[${renderedLines}A\x1b[0J`);
      }
      const lines = [
        `${colors.bold}${colors.cyan}${title}${colors.reset} ${colors.yellow}(${selected.size} selected)${colors.reset}`
      ];
      items.forEach((item, idx) => {
        const active = idx === cursor;
        const pointer = active ? `${colors.cyan}❯${colors.reset}` : ' ';
        const box = selected.has(item.value) ? `${colors.green}[✔]${colors.reset}` : `${colors.dim}[ ]${colors.reset}`;
        const label = active ? `${colors.bold}${item.label}${colors.reset}` : item.label;
        const hint = item.hint ? ` ${colors.dim}${item.hint}${colors.reset}` : '';
        lines.push(`  ${pointer} ${box} ${label}${hint}`);
      });
      const backHint = allowBack ? '  |  Esc: Back' : '';
      lines.push(`${colors.dim}  Space: Toggle  |  a: All  |  Enter: Save & Continue${backHint}${colors.reset}`);
      process.stdout.write(lines.join('\n') + '\n');
      renderedLines = lines.length;
    };

    readline.emitKeypressEvents(process.stdin);
    const prevRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) process.stdin.setRawMode(Boolean(prevRaw));
      process.stdin.pause();
    };

    const onKeypress = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.exit(0);
      }
      if (!key) return;
      if (key.name === 'up' || key.name === 'k') {
        cursor = moveCursor(cursor, -1, items.length);
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        cursor = moveCursor(cursor, 1, items.length);
        render();
      } else if (key.name === 'space') {
        toggleSelection(selected, items[cursor].value);
        render();
      } else if (str === 'a' || str === 'A') {
        if (selected.size === items.length) {
          selected.clear();
        } else {
          items.forEach(i => selected.add(i.value));
        }
        render();
      } else if (allowBack && key.name === 'escape') {
        cleanup();
        process.stdout.write('\n');
        resolve(null);
      } else if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        process.stdout.write('\n');
        resolve(Array.from(selected));
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

module.exports = {
  moveCursor,
  toggleSelection,
  selectOne,
  selectMany
};
