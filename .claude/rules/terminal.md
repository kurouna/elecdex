---
paths:
  - "src/main/pty/**"
  - "src/renderer/widgets/terminal/**"
  - "resources/shell-integration/**"
  - "tests/unit/pty*"
  - "tests/unit/osc-parser*"
  - "tests/unit/shell-cwd*"
  - "tests/unit/terminal*"
  - "tests/e2e/panes/terminal*.spec.ts"
  - "src/main/ipc/pty.ts"
  - "src/renderer/lib/shell-quote.ts"
  - "tests/unit/*shell*"
  - "tests/unit/powershell*"
  - "tests/e2e/support/pty.ts"
  - "tests/e2e/support/terminal.ts"
  - "tests/component/terminal-*"
---

# Shell panes: sizing and the folder

The terminal widget and the PTY behind it (architecture.md §6.2, main/pty/, widgets/terminal/,
resources/shell-integration/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY (ConPTY rewraps
  history; see the remount regression test).
- **A shell pane's folder** (§6.2, main/pty/osc-parser.ts, main/pty/start-directory.ts) is what
  its shell reports: PowerShell by OSC 9;9 with the quoted `ProviderPath`, as Windows Terminal
  reads it (user decision 2026-10-07); bash, zsh and fish by OSC 7, percent-encoded UTF-8 bytes
  (`LC_ALL=C`; zsh's `path` is PATH's array - never a local of that name). The parser takes
  9;9 only as an absolute path and lets other OSC 9 through. The pane keeps it as `cwd` in its
  state, saved with layouts; a pane brought back starts there, a new one (no `cwd`) where
  `terminal.startDirectory` says. Main checks the folder without blocking
  (`resolveShellDirectory`, given up after `SHELL_DIRECTORY_WAIT_MS`) and falls back.
  tests/unit/shell-cwd-scripts.test.ts runs each shell's real script (CI installs zsh and fish).
