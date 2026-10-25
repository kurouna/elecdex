---
paths:
  - "src/shared/logwatch/**"
  - "src/main/logwatch/**"
  - "src/renderer/widgets/logwatch/**"
  - "tests/unit/logwatch*"
  - "tests/e2e/panes/logwatch.spec.ts"
  - "docs/logwatch.md"
  - "docs/logwatch-mock/**"
  - "scripts/log-feed.mjs"
  - "scripts/demo-logwatch.mjs"
  - "scripts/demo-logfeed.mjs"
  - "src/main/ipc/logwatch.ts"
  - "tests/unit/support/logwatch-rig.ts"
  - "tests/e2e/support/logwatch.ts"
  - "tests/component/logwatch-*"
---

# The LOG WATCH pane

A log file followed and explained (architecture.md §5.21, docs/logwatch.md, shared/logwatch/,
main/logwatch/). EXPLAIN asks the AI chat pane's providers under ai-chat.md's rules: a model's text
is untrusted and drawn from lib/markdown.ts's tree, never as HTML.
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The LOG WATCH pane reads a log only while it is seen** (§5.21, docs/logwatch.md,
  shared/logwatch/, main/logwatch/). Files only (Windows event logs wait for the user, decision
  2026-10-12); one file a pane, chosen through main's picker and known by id (`log-files.json`),
  never a path from the page. Nothing is ever written to the file.
  - Main watches the file's folder and looks once a second only while a page shows it, reads only
    where the file grew, never holds it open, and on coming back reads the gap (its end past 4 MB)
    as any other lines - no banner (user decision 2026-10-12). Nothing while hidden, no
    notification.
  - Parsing is pure (shared/logwatch) and runs in main (measured: about 1 ms a quarter second at
    1000 lines/s). One channel per file and encoding in main, one feed per key in the page
    (feed.svelte.ts), shared by panes; the feed's array is replaced, never grown in place.
  - EXPLAIN only on a press, only with an AI provider set, and only the lines the user chose
    (user decision 2026-10-12: nothing reaches a model unintended) - never the lines around them,
    the file's name or path. The page sends their numbers; main takes them from what it holds
    (`lines`), puts the text together (`explainText`, the same for preview and send), masked
    when MASK is on, and refuses rather than cut a choice too long. A chosen line the filter hides
    is neither sent nor copied (`chosenLines`). The key stays in main, the answer is drawn from
    the markdown tree.
  - Tests write logs in a temp folder and replace `dialog.showOpenDialog`; `scripts/log-feed.mjs`
    is for trying it by hand.
