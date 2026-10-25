---
paths:
  - "src/shared/clipboard.ts"
  - "src/shared/snippets.ts"
  - "src/main/clipboard/**"
  - "src/renderer/widgets/clipboard/**"
  - "tests/unit/clipboard*"
  - "tests/unit/snippets*"
  - "tests/e2e/panes/clipboard.spec.ts"
  - "scripts/demo-snippets.mjs"
  - "src/main/ipc/clipboard.ts"
  - "src/main/ipc/snippets.ts"
  - "tests/component/clipboard-*"
---

# The CLIPBOARD pane

The clipboard history and snippets (architecture.md §5.14, shared/clipboard.ts, shared/snippets.ts,
main/clipboard/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The clipboard pane reads only while it is seen** (§5.14, shared/clipboard.ts,
  main/clipboard/). Main reads (Electron's async API, never the page) on the quarter seconds,
  only while a pane is subscribed and not paused; what is copied unseen is never kept. The
  history is main's memory only; the page gets previews and puts back by id; no plugin API.
  - A copy marked private (`privateMark`) is recognised from its formats alone; its text is never
    read. Keep that list of formats in one place.
  - Decisions are pure (`recordRead`); a selection is absorbed only between looks in a row.
  - Snippets (shared/snippets.ts) are the one thing it writes, to `snippets.json`, only what the
    user kept. A history entry becomes one by id, so its text and formatting never pass through
    the page; the editor asks for one text by id. COPY goes through the watcher (`put`), not into the history (user
    decision 2026-09-27); main says which rows are kept and which snippet is on the clipboard.
  - Tests: `ELECDEX_CLIPBOARD_STUB=1`, copy through `globalThis.__elecdexClipboard`.
