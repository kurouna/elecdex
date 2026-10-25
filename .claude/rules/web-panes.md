---
paths:
  - "src/shared/web.ts"
  - "src/main/web/**"
  - "src/renderer/widgets/web/**"
  - "tests/unit/web.test.ts"
  - "tests/unit/web-views*"
  - "tests/e2e/extensions/web.spec.ts"
  - "src/main/ipc/web.ts"
  - "src/renderer/stores/web.svelte.ts"
  - "tests/component/web-*"
---

# Web panes

Sites shown in panes as WebContentsViews main owns (architecture.md §5.4, shared/web.ts, main/web/).
They are the exception to "only while seen": a web pane's page keeps playing behind a tab.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Web panes** (§5.4) are WebContentsViews main owns, one per pane id - never an iframe or
  `<webview>`.
  - A site is a preset in `WEB_PRESETS` (shared/web.ts), optionally with a `userAgent` or
    `unlisted`; never a widget.
  - All share `persist:web` and nothing else does; no preload, no permission but clipboard write
    and fullscreen, no downloads, http(s) only.
  - Only the television pane signs in, through Google's device flow; never disguise the pane as
    Chrome.
  - Each mount claims its view with a token and opens it once per mount.
  - Anything drawn over panes registers with `coverWeb`; dialogs, drags and CRT transitions hide
    views behind a snapshot. A view leaves HTML fullscreen before it is put away.
  - Main tells the page its `color-scheme`; the theme tint is off by default (`web.tint`).
