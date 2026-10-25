---
paths:
  - "src/shared/now-playing.ts"
  - "src/main/media/**"
  - "src/renderer/widgets/nowplaying/**"
  - "tests/unit/now-playing*"
  - "tests/e2e/panes/now-playing.spec.ts"
  - "src/main/ipc/now-playing.ts"
  - "tests/component/now-playing-*"
---

# The NOW PLAYING pane

The media session reader (architecture.md §5.15, shared/now-playing.ts, main/media/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The NOW PLAYING pane reads only while it is seen** (§5.15, shared/now-playing.ts,
  main/media/). Main reads the media session (Windows: SMTC through one long-lived PowerShell) on
  the half seconds while subscribed; not a metric source, no plugin API, nothing logged or
  written. The page may press only previous, play/pause and next, and seek where the player takes
  a position (never the volume), only while subscribed; a bar the player cannot seek does not look
  draggable. Art is made small in the reader and passed as a checked JPEG data URL; the card's
  larger copy stays in main until a card opens.
  Decisions are pure (`readSession`, `positionNow`, `appLabel`). Tests:
  `ELECDEX_NOWPLAYING_STUB=1`, `globalThis.__elecdexNowPlaying`.
