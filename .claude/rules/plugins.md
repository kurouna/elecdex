---
paths:
  - "src/shared/plugin*.ts"
  - "src/main/plugins/**"
  - "src/renderer/plugins/**"
  - "examples/**"
  - "tests/unit/plugin*"
  - "tests/e2e/extensions/plugins.spec.ts"
  - "tests/e2e/extensions/keystream.spec.ts"
  - "tests/e2e/app/plugin-containment.spec.ts"
  - "docs/plugins.md"
  - "scripts/instruments-wav.mjs"
  - "scripts/keystream-wav.mjs"
  - "scripts/demo-keystream*.mjs"
  - "src/main/ipc/plugins.ts"
  - "tests/unit/keystream*"
  - "tests/unit/pomodoro*"
  - "tests/unit/instruments*"
  - "tests/e2e/support/plugins.ts"
  - "tests/component/plugin*"
---

# Plugins

The plugin host, runtime and API (docs/plugins.md is the public API; shared/plugins.ts,
shared/plugin-runtime.ts, shared/plugin-api.ts, main/plugins/, renderer/plugins/; the samples in
examples/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Plugins** (docs/plugins.md) run in a blob Web Worker each; main only transforms their text.
  - Everything a worker posts is checked (shared/plugins.ts); every request, redirect, storage
    write and notification is checked in main against the grant in settings.json, never against
    what the renderer says a plugin asked for. Consent binds
    the plugin id and its file or folder name. The host re-checks sizes even where the runtime
    does.
  - `stripGlobals` and `pluginRuntime` (shared/plugin-runtime.ts) are source text and refer to
    nothing outside themselves. The page CSP (`connect-src 'self'`, no `unsafe-eval`,
    `worker-src blob:`) is the real containment: relaxing it means
    re-auditing plugins. A background service learns whether its panes are open from
    `ctx.views`, counted in the worker.
  - Plugins draw only through blocks: add one to plugin-api.ts, the schema and Blocks.svelte
    together. plugin-api.ts is types only and is the public API (update docs/plugins.md).
  - Install from a folder (main/plugins/install.ts): main opens the picker; only the module graph
    from the entry is copied; resolution mirrors shared/plugin-runtime.ts - change both.
  - API 2 (plugins.md §13): canvas is 2D OffscreenCanvas, new per mount (`epoch`); `ctx.animate` only
    while the pane is visible and the window on screen. Keys only while the pane has focus, never with Ctrl/Alt/system key, Tab or function
    keys (`keyFate`), with the KEYS lamp. Sound is the page's synth from a fixed voice list; bound
    notes, `hold` and sustain are the host's. Keys and sound are grant-checked and need
    `apiVersion: 2`. Times cross as epoch milliseconds.
  - The `piano` voice (plugins.md §13.8) is physics and textbook curves, never a recording or
    sample. The physics is pure (worklet, tests and the script run the same code); listen through `node scripts/instruments-wav.mjs` after changing it.
  - Personal or unofficial-API plugins live in the separate private repository, never here. The
    committed samples are pomodoro and KEYSTREAM. The private repository deploys with its own
    `npm run deploy`.
