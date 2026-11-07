---
paths:
  - "src/main/translate/**"
  - "src/main/ipc/translate.ts"
  - "src/shared/translate/**"
  - "src/renderer/widgets/translate/**"
  - "tests/unit/translate-*"
  - "tests/component/translate-*"
  - "tests/e2e/panes/translate.spec.ts"
  - "tests/e2e/support/llama-stub.mjs"
  - "scripts/gen-llama-licenses.mjs"
---

# The TRANSLATE pane

PLaMo 3 Translate run on this computer through llama.cpp's `llama-server` (architecture.md §5.25;
the design, every decision and the test app's lessons in docs/translate.md, Japanese).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Main owns it all** (translate.md §8): the engine (fetch, start, watch, stop), the fetcher,
  the runs and their queue, the glossaries and the history are main/translate/, behind one
  `registerTable` (main/ipc/translate.ts). The page shows the board and never talks to
  llama-server (its CSP stays `connect-src 'self'`).
- **Nothing translated leaves the computer** (user's request 2026-11-05). The only requests out
  are the model's and the engine's downloads (SETUP, UPDATE) and Hugging Face's revision API (as
  a licence is agreed to, and when ENGINE opens, at most once every 24 hours), all listed in
  docs/guide/data-sources.md. An
  external server is reached only once the user typed its address, pressed TEST and chose it, and
  the footer goes on saying where the text goes (§10).
- **Where the engine comes from** (fetched, own, external), its path and its address live only in
  main's `engine.json`, never in `settings.patch`. An executable runs only when it matches the
  manifest's sha256 or was picked in main's own dialog; the page never hands main a path.
  llama-server listens on 127.0.0.1 only, with a key the page never sees, and no web UI.
- **The model in use goes on translating while another is fetched** (user decision 2026-11-07).
  SETUP fetches the chosen model and changes the settings' model only at READY, with that model
  placed. A consent is the model's own, by commit, size and sha256; a newer version on Hugging
  Face makes RESUME refuse the old consent. A paused download survives a restart, and CANCEL
  removes that model's `.part`.
- **The last choice of engine wins** (user decision 2026-11-07): TEST, the own llama-server and
  a change of source share one `AbortController` (`#choose()` in service.ts). A new choice cuts
  the previous one's connection off; a choice refused before it is checked cuts nothing. No
  sequence numbers. The page says nothing of `CHOSEN_MEANWHILE`.
- **A server that does not answer is unreachable, wherever it is asked** (translation or ROUND
  TRIP): the lamp says so, and the round trips queued behind fail with it, as they do when the
  server, asked again, is no longer usable. An HTTP error stays that block's.
- DOM only, no WebGL; the caret and lamps share the pulse. Nothing LIVE starts while the pane is unseen.
- **Tests**: the stubs are in [tests.md](tests.md) (closed ports for Hugging Face and the llama.cpp
  releases, `ELECDEX_LLAMA_SERVER` the stand-in, failures by `ELECDEX_LLAMA_STUB_MODE`). A check
  with the user's real engine and models is done by hand when asked, and never committed.
