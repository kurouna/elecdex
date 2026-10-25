---
paths:
  - "src/shared/docker.ts"
  - "src/main/docker/**"
  - "src/renderer/widgets/docker/**"
  - "tests/unit/docker*"
  - "tests/e2e/panes/docker.spec.ts"
  - "src/main/ipc/docker.ts"
  - "tests/component/docker-*"
---

# The DOCKER pane

The container list and its presses (architecture.md §5.17, shared/docker.ts, main/docker/).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **The DOCKER pane talks to the engine only while it is seen** (§5.17, shared/docker.ts,
  main/docker/). Engine API over node `http` on the socket, pipe or loopback TCP - never the CLI
  or a client library - found by reading files as the CLI does; never a remote, TLS or ssh
  engine, and the page cannot name one.
  - While subscribed: one event stream, the list at the next quarter second after an event and
    on the ten seconds (user decision 2026-09-27), usage on the five; one timer each. Nothing
    written or logged.
  - The page gets short ids and only what row and card show (labels: Compose project, service,
    folder; never command, mounts or env).
  - Presses: start, stop, restart, pause, unpause only - never remove, kill or prune - on a
    container of the last listing, in a state that takes it, from a page that shows it. Not a metric source; no plugin API. Rows never move by state.
  - Tests: `ELECDEX_DOCKER_STUB=1`, `globalThis.__elecdexDocker`.
