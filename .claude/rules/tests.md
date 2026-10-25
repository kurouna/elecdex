---
paths:
  - "tests/**"
  - "playwright.config.*"
  - "vitest.config.*"
---

# Writing and running the tests

The stubs every test runs with, test craft, and what a failing or hanging run must say
(docs/e2e-design.md; tests/e2e/support.ts).
The always-loaded rules in [CLAUDE.md](../../CLAUDE.md) apply as well; this file loads when one of
the files above is read or edited.

- **Tests never contact external services, and never touch the machine.** tests/e2e/support.ts
  sets, by default, in `STUB_ENV` (a spec that starts the app itself spreads it in too):
  - closed ports for `ELECDEX_JMA_BASE_URL` (also quakes and tsunamis), `ELECDEX_MET_BASE_URL`,
    `ELECDEX_NWS_BASE_URL`, `ELECDEX_USGS_BASE_URL`, `ELECDEX_NOAA_BASE_URL`,
    `ELECDEX_CELESTRAK_BASE_URL`, `ELECDEX_MARKETS_STUB_URL`, `ELECDEX_UPDATES_URL` and
    `ELECDEX_WEB_HOMES`; specs that need data run a local stub server;
  - `ELECDEX_AUDIO_STUB=1`: a steady tone and a made-up mixer, never the machine's sound or
    volume, with sound off (`=tracks` plays the WAV files `ELECDEX_AUDIO_TRACKS` names, only when
    `globalThis.__elecdexAudio` says which, and aloud only when it says so: the tours);
  - `ELECDEX_BACKGROUND_STUB=1`: no tray icon, system-wide shortcut or sign-in entry;
  - `ELECDEX_SOCKETS_STUB=1`: a made-up socket table (`=demo` for screenshots);
  - `ELECDEX_CLIPBOARD_STUB=1`, `ELECDEX_NOWPLAYING_STUB=1`: stand-ins in main (`=demo`);
  - `ELECDEX_WIFI_STUB=1`: a made-up link, echoes and log (`=train`, `=dual`, `=demo`);
  - `ELECDEX_ETHER_STUB=1`: a made-up wired link and echoes (`=flapping`, `=crc`, `=dual`, `=demo`, ...);
  - `ELECDEX_DOCKER_STUB=1`: a stand-in engine (`=demo`, `=down`, `=denied`);
  - `ELECDEX_AWAKE_STUB=1`: no real power-save blocker or power source;
  - `ELECDEX_AI_KEYS_STUB=1`: a reversible stand-in for `safeStorage`; AI providers are a spec's
    local stub;
  - `ELECDEX_GPU_STUB=1`: a made-up GPU, so every machine draws the same panes (`=demo`, `=none`);
  - `ELECDEX_PING_HOST=127.0.0.1`: the network panes' internet echo stays on this machine (only a
    loopback address is taken);
  - `ELECDEX_SEED_LAYOUTS=0`: no presets in a new profile (layout-presets.spec.ts turns it on).
  A plugin's hosts reach a stub through `ELECDEX_PLUGIN_HOST_MAP`. Keep it that way.
- **Test craft.** A test that fails only under load is usually its own fault.
  - Zoom out to the 1920x1080 design size where the screen is smaller (the macOS runner's is about
    1024x640).
  - A fake-clock harness waits on promises (`await Promise.resolve()`), never real timers per step.
  - Measure a pane after `settleLayout`, never as soon as it is visible: an arriving layout powers
    its panes on scaled from a line.
  - Click on what lies over other elements (the status bar over the panes) with
    `click({ delay: 20 })`: a release in the same few milliseconds once landed on the shell
    underneath, and press and release on different elements make no click.
  - Catch one by running the spec under CPU load (a dozen busy `node -e` loops) with the page's
    events logged.
  - Component tests flush (`layout.flush()`) before unstubbing `window.elecdex`, and IPC mocks
    `structuredClone` their arguments (IPC cannot clone a `$state` proxy).
  - A test's own pty session belongs to no pane, and the workspace's reaper ends it about four
    seconds after the panes last changed: go through `runCapture` (support/pty.ts).
- **A failure says whether an elecdex runs outside the tests** (tests/e2e/reporter.ts): an installed app or
  `npm run dev` left open makes launches and drags fail; the reporter logs it to
  test-results/elecdex-running.log. Close it and re-run only the failed tests.
- **A test that hangs must say where**: `launch` and the guarded `quit`/`close` in support.ts warn
  while still going (SLOW_MS) as well as after. A second app on the same profile uses
  `launched.quit()`, never `launched.app.close()`.
