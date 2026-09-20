# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a sci-fi
terminal emulator and system monitor — on Electron 44, Svelte 5, TypeScript 7 and xterm.js 6.
GPL-3.0, like the original; the version is in package.json, and releases are pre-releases.

This file holds the rules that must not be broken and where each one lives. The design, and every
decision with its reason and its measured numbers, is in [docs/architecture.md](docs/architecture.md)
(Japanese; §16 is the decision log); plugins are in [docs/plugins.md](docs/plugins.md). **Read the
section named by a rule before changing that subsystem.**

## Commands

```bash
npm ci                 # install; postinstall downloads Electron and fixes node-pty on macOS
npm run dev            # electron-vite dev server + app; npm start is the same
npm run verify         # biome lint + typecheck (node, e2e, web) + vitest
npm run build          # production bundle into out/ (the e2e tests run against this)
npx playwright test    # end-to-end tests against out/ — run `npm run build` first
npm run package:dir    # unpacked app in release/win-unpacked (or mac/linux equivalent)
npm run gen:icon       # build/icon.svg -> build/icon.png + resources/icons/icon.png
npm run gen:card       # README banner: public/elecdex_repo_card.svg
npm run gen:geo        # globe land points, country centroids, time zone table
npm run gen:cities     # weather picker city list (GeoNames)
npm run gen:screenshots # README screenshots in a demo profile (Windows; build first)
node scripts/sync-calc.mjs <elecxzy>  # overwrite the vendored calculator from an elecxzy checkout
```

Single tests: `npx vitest run tests/unit/<file>.test.ts`,
`npx playwright test tests/e2e/<file>.spec.ts -g "<name>"`.

App flags: `--windowed` (not fullscreen), `--no-intro` (skip the boot sequence). Electron flags go
after a second `--`: `npm run dev -- -- --windowed --no-intro`.

**Install scripts:** Electron 44 has no install script of its own and downloads its binary on
first `require('electron')`, which electron-vite bypasses — so `postinstall` runs
`install-electron`. If `npm run dev` fails with "Electron uninstall" (e.g. after
`--ignore-scripts`), run `npx install-electron`. npm 11 blocks dependency install scripts until
approved; none are needed on Windows/macOS, but Linux must approve node-pty to compile it.

## Layout of the code

```
src/main/        main process: window, ipc/ (handlers), store/ (json files), pty/, fs/, weather/,
                 markets/, feeds/, quakes/, launcher/, audio/, plugins/, web/, background/,
                 reminders/, updates/, metrics/ (the broker between the collector and pages)
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas (schemas/), channel names and pure logic used by both sides;
                 calc/ (vendor/ is elecxzy's evaluator, the wrapper beside it is ours)
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/ (builtins.ts is the
                 registry), plugins/ (host, plugin pane, blocks), stores/, styles/, lib/
examples/        plugins/pomodoro: the sample plugin written into a new plugins folder
tests/           unit/ (vitest, node), component/ (jsdom), e2e/ (Playwright _electron; support.ts)
scripts/         asset generators, sync-calc, fix-node-pty
docs/            architecture.md, plugins.md (the plugin API and its rules), weather-providers.md,
                 screenshots/ (README images)
```

## Rules that matter

### Boundaries

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node) with
  CSP `connect-src 'self'`: it has no network and no filesystem. Everything goes through
  `window.elecdex` (src/shared/api.ts, src/preload/index.ts). Main validates every input (zod or
  explicit checks). Never expose a generic channel, a path-taking "run" or raw `ipcRenderer`. The
  launcher launches by opaque id from main's own catalog, never by path.
- **Network lives in main**, never the renderer: weather (JMA, MET Norway, NWS — see
  docs/weather-providers.md; follow each service's terms), markets (yahoo-finance2 is Node-only),
  RSS feeds (src/main/feeds; the XML parser is imported lazily, so an app without an RSS pane
  never loads it), earthquakes and tsunamis from JMA, or the USGS and NOAA (src/main/quakes;
  running only while alerts are on or a quakes pane is open, and only for the chosen source).
  Fetch only while a pane needs the data, batch, back off on failure, and keep the last good data
  on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols, feed URLs, the quake
  list) are reference-counted in preload and in main, and a page's subscriptions are dropped on
  reload (`did-start-navigation`) and destroy. Polling must stop when the last subscriber leaves —
  e2e tests assert exactly that. A pane in a background tab (display:none) holds only its widget's
  `keepWhileHidden` sources (builtins.ts): the ones it charts, whose history would otherwise have
  a gap, and once-only ones. List a new charted source there.
- **The connections pane reads the kernel, not the network.** Its `net.sockets` source lives in
  `src/services/metrics/sockets/`, one file per platform behind one `RawSocket` (Linux reads
  /proc, macOS runs netstat and cannot name an owner, Windows goes through the sampler's
  GetExtendedTcpTable P/Invoke). Peers are placed with the bundled GeoIP database, never a lookup
  service. It is the one reading a plugin can never be granted, so a new metric source goes into
  `PLUGIN_METRIC_SOURCE_IDS` or `PRIVATE_METRIC_SOURCE_IDS` deliberately (a unit test checks every
  source is in one of them).
- **No location prompts.** Chromium permission requests are denied except clipboard
  (src/main/window.ts). Windows shows a location prompt for `netsh wlan`, which
  systeminformation's network functions run — do not call `si.networkInterfaces`, `si.wifi*` or
  similar on Windows.
- **Audio capture stays out of the workspace.** The spectrum's system audio comes through screen
  capture with loopback audio, granted only in the hidden capture window
  (main/audio/capture-window.ts: its own session, its own two-function preload, a page with no
  network); only spectrum levels leave that window. On Linux, where Electron has no loopback, main
  runs `parec` on `@DEFAULT_MONITOR@` (main/audio/pulse-capture.ts) — never the default input.
  Linux audio goes through the pulse protocol (parec, pactl), which PulseAudio and PipeWire both
  serve; WirePlumber's wpctl is only a fallback, never required (main/audio/mixer-linux.ts).
  Code that means "the elecdex window" asks `appWindows()` (main/app-windows.ts), never
  `BrowserWindow.getAllWindows()`, so the helper window is never taken for it.
- **Web panes** (architecture.md §5.4) are WebContentsViews that main owns, one per pane id, over
  the pane's body — never an iframe or `<webview>` in the workspace, whose CSP stays as it is.
  - A site is a preset in `WEB_PRESETS` (shared/web.ts): its home and the hosts that stay in the
    pane; add a site there, not as a widget. A preset may carry a `userAgent` (how the YouTube
    (TV) pane asks for the television interface); an `unlisted` one still opens for a layout that
    names it but is not in the picker (plain YouTube, which the television one supersedes).
  - All web panes share the `persist:web` session and nothing else does; pages get no preload, no
    permission but clipboard write and fullscreen, no downloads, and only http(s).
  - Only the television pane can be signed in, because Google refuses an embedded browser; its
    device flow (a code entered on a phone) is the sanctioned way — never dress the pane up as
    Chrome to get past the check.
  - Each mount claims its view with a token, so a moved pane's old component cannot hide the new
    one's page, and opens it once per mount without tracking props.
  - A view is native and covers the DOM: anything drawn over panes registers with `coverWeb`
    (stores/web.svelte.ts), and dialogs, drags and CRT transitions hide views behind a snapshot,
    retaken when the page's colours change. A view leaves HTML fullscreen before it is put away.
  - The view sits on the theme's ground, so main tells the page which `color-scheme` its own
    defaults follow (otherwise a page that brings no colours is black on black). The theme tint
    is off by default (`web.tint`); each pane overrides it with the switch beside its address.
- **Plugins** (docs/plugins.md) run in a blob Web Worker, one per plugin; main only transforms
  their text (sucrase) and never runs it.
  - Everything a worker posts is checked (shared/plugins.ts), and every request, redirect, storage
    write and notification is checked in main against the grant in settings.json, never against
    what the renderer says a plugin asked for. Consent is bound to the plugin id *and* its file or
    folder name. The host re-checks sizes (pane state, blocks, storage keys) even where the worker
    runtime already does, since a plugin can post around the runtime.
  - The worker script is built from `stripGlobals` and `pluginRuntime` (shared/plugin-runtime.ts)
    as source text, so they must not refer to anything outside themselves. The real containment
    is the page CSP (`connect-src 'self'`, no `unsafe-eval`, `worker-src blob:`): relaxing it
    means re-auditing plugins.
  - Plugins draw only through blocks; add a block to plugin-api.ts, the schema and Blocks.svelte
    together. plugin-api.ts is copied verbatim into the user's plugins folder as
    elecdex-plugin.d.ts, so it holds types only, and every change to it is a change to the public
    API (update docs/plugins.md). A background service learns whether its panes are open from
    `ctx.views`, counted in the worker.
  - *Settings -> Plugins -> install from a folder* (main/plugins/install.ts): main opens the
    picker, so the page never hands over a path, and what is copied is the module graph from the
    entry — what the worker would actually load — so a repository's tests and scratch files are
    neither copied nor judged. Walking that graph is also the check that the plugin compiles and
    its imports resolve; the resolution mirrors the worker's (shared/plugin-runtime.ts), so change
    one and change the other.
  - Plugins that use unofficial APIs or are personal (such as claude-usage) live in a separate
    private repository, cloned beside this one and deployed with its `npm run deploy` — never
    here. The committed sample is the pomodoro timer.
- **The vendored calculator is never edited.** `src/shared/calc/vendor` is elecxzy's evaluator
  copied whole (MIT), kept out of tsconfig and biome, typed through hand-written `.d.ts` behind
  `@calc/*`. What elecdex needs goes in the wrapper beside it; `scripts/sync-calc.mjs` overwrites
  the folder (architecture.md §16).
- **Desk data lives in main.** Notes, tasks and alarms are main's files (notes.json, tasks.json, alarms.json);
  a pane keeps only display choices and ids. Reminders wait on one `setTimeout` for the next due
  item (src/main/reminders), never a poll.

### Performance

- **Measured, not assumed.** The idle budget is enforced in tests/e2e/metrics.spec.ts (default
  layout ~13% of one core). Record measured numbers in architecture.md §16 when a decision
  depends on them.
- On Windows never spawn a process per reading — frequent readings go through `WindowsSampler`
  (one long-lived PowerShell).
- Animations share the 10 fps frame loop (`lib/frame-loop.ts`) instead of their own rAF loops.
  A CSS animation is the compositor's, not the loop's, and `backgroundThrottling` is off, so one
  keeps painting a window that has been put away: the frame loop marks the page `data-offscreen`
  and tokens.css takes `--motion-scale` to zero there. A hidden or minimised window is not
  reported hidden to such a page, so main sends `WindowState.hidden` and the loop stops drawing.
  - An animation that outlives the frame it started in — endless, or merely long (a toast's
    ten-second fuse) — cannot be scaled to nothing by `--motion-scale`, so it takes
    `animation-play-state: var(--ambient-play-state)` after its `animation` shorthand, in every
    rule that sets the shorthand (which resets it).
  - The loop only draws. Anything that must happen at a moment whether or not the window is on
    screen (a countdown landing) waits on its own `setTimeout`, never on a frame.
  - No `will-change`, and no fill that outlasts an animation (`forwards`, `both`) on what stays in
    the page: either keeps a GPU layer for good. `crt-on` is left on dialogs, toasts and the
    notes' sheet, so styles/crt.css holds to this too.
- Weigh a new animation by the area it repaints — the clock's rolling digits cost ~4% of one core
  on the default layout, measured.
- Other timed screen updates wake on wall-clock boundaries through `onBoundary(period, …)`
  (lib/frame-loop.ts: the clock, the system pane's date, the tasks' T-minus), never a timer of
  their own or an unaligned `setInterval`: their change lands in the loop's frame, everyone on a
  period shares one timer, and none runs while the window is put away (they catch up the moment
  it is back). Assign `$state` only when the shown value changes.
- **GPU contexts are a budget.** Chromium keeps only about 16 WebGL contexts and drops the oldest,
  which may be a visible pane's. Only the shell (xterm's WebGL addon) and the globe (three.js) take
  one, and a widget that creates one gives it back on unmount (`forceContextLoss`, or
  `releaseWebglContexts` in lib/webgl.ts); every other drawing widget is plain 2D canvas,
  deliberately. **There is no WebGPU here** and none is wanted (asked and left as it is,
  2026-09-19): with two dozen widgets created and destroyed freely the context budget decides,
  and the one measured animation cost is the compositor rasterising glyphs.

### Panes and layout

- **Layout state** is a persisted tree (src/shared/layout-ops.ts, pure and unit-tested); every
  tree change goes through a pure op there. Widgets keep per-pane choices in pane state
  (`layout.setPaneState`). A tabbed pane is split, moved beside or dropped on through its group,
  and a group only ever holds panes — of any widget (Ctrl-drag, or the picker's "new tab").
  Nested groups were designed and deliberately postponed (user decision 2026-09-17): do not add
  them without asking. Splits carry no header (eDEX-UI's PANEL / SYSTEM labels were dropped
  because panes move between columns); the shell's TERMINAL header stays, as the group's drag
  handle and the path. Pane moves are covered at three levels — unit (layout-ops, including seeded
  random moves), component (pane-drag gesture) and e2e (pane-move) — so extend those.
- **Remounts happen.** Moving a pane remounts its widget, so keep what must survive in pane state
  or in main (a shell reattaches to its session).
- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY: ConPTY rewraps
  its buffer to every size and garbles history (see the remount regression test).
- **Saved layouts** (src/shared/layouts.ts, architecture.md §5.6). `layout.json` is the live
  arrangement, with the volatile state a reload needs (a terminal's session id); `layouts.json`
  holds the named copies with that state stripped (`portableTree`), so it can travel to another
  machine and a new shell does not rewrite it. Main writes the live tree back into the active
  entry on every save, only when it differs. A layout follows the work: never turn it back into a
  snapshot without asking (user decision 2026-09-20). Switching flushes the pending save *and
  waits for one in flight*, since main writes each save into whichever layout is active when it
  arrives. A broken entry is dropped on its own; the file is never discarded whole. The first
  `KEYED_LAYOUTS` answer Ctrl+Shift+1..9 *by their place in the list* — add a slot in
  shared/layouts.ts, keybindings.ts and Workspace.svelte together (a unit test checks they match).
  Switching asks first while shells are open (`layout.confirmSwitch`); that question is a promise
  the switch awaits, so anything that takes the screen from it must answer it.
- **Shortcuts** are data (src/shared/keybindings.ts): add an action there with its default chord
  and handle it in Workspace.svelte; never hard-code a key check elsewhere. A chord must include
  Ctrl/Alt or be a function key, so the shell keeps every other key. An action with
  `scope: 'global'` is registered with the OS by main instead, so it is out of the page's
  `keymap`, the shortcut list and "reset all shortcuts", and `conflicts` reports the app action as
  the loser while the OS holds the keys.
- **Open and close with the CRT effect.** Everything that appears or goes on top of the workspace
  powers on and off like a tube (styles/crt.css, lib/crt-transitions.ts), and a new pane, dialog
  or notice must do the same:
  - Panes: added ones power on through `layout.arrived`. A closed one powers off in the tree
    (`layout.closingId`), and the panes that gain its room are uncovered by a `crt-extend` clip
    (layout/pane-close.ts), never by animating sizes, which would send transient sizes to a shell.
    One close runs at a time; a tree change first calls `layout.settle()`.
  - Layouts: applying a saved one powers the whole screen off as one (`layout.leaving`, a tab
    group with its header and strip), and the arrangement arriving powers on pane by pane as at
    boot, quicker (layout/layout-switch.ts). Overlapping switches are last-one-wins by token.
  - A pane brought forward (`layout.zoom`, architecture.md §5.5) is pinned over the workspace with
    `position: fixed` and flies there with a transform (`crt-zoom`), never by growing: the tree is
    untouched, nothing is remounted, and the pane's own size changes once. Every tree change lets
    go of it (`settle`). A widget's registry entry says `zoom: 'full'` (it fills the room it is
    given), `'panel'` (reads better at a fixed size) or nothing (a readout of a few figures: no
    button, no shortcut — the default); plugins declare the same in their descriptor. A widget
    that lays itself out by its own size (the calendar) reads it from the `ResizeObserver`
    entry's rectangle, never by measuring the element inside the callback: a pane just pinned
    still answers with the size it had in the layout it left.
  - Dialogs: the dialog has `crt-on`, `transition:crtPower` and
    `style:--crt-delay={dialogDelay()}`, its backdrop `transition:backdropShade`, and its
    open/close goes through `ui` so `ui.closedAt` is kept (a dialog opened just after another
    closed opens out of its line).
  - Notices and toasts: `crt-on` and `transition:crtPower`, with `|global` when the element can
    leave with a block around it (the last of a list).
  - With motion reduced, all of it is skipped. Cover a new one in tests/e2e/motion.spec.ts (or its
    own spec, with `clickThen` from support.ts).
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens, not primitives. Text is the accent
  unless a theme sets `text` (Business does); never assume a dark ground — `mode: 'light'`
  (Business (Light)) sets `data-mode="light"`, which darkens status colours in tokens.css and turns
  on xterm's minimum contrast, so check a colour change in both Business themes. Every theme sets
  every variable (`themeVariables`), so switching never leaves one stale.

### Running in the background

Architecture.md §16. The icon outside the window, minimising or closing to it, the system-wide
show/hide shortcut and the sign-in entry; every option is off until the user turns it on.

- **Never gate any of it on the platform name**: ask `backgroundCapabilities`
  (shared/background.ts), which main computes from what this machine actually has — it probes for
  a tray (a Linux desktop may have none, and a window put somewhere that does not exist is lost)
  and reads the session type (Wayland swallows system-wide shortcuts). The answer travels to the
  page in `BackgroundState` (`stores/background.svelte.ts`). Main also ignores an option the
  machine cannot do, since settings.json travels between machines.
- The decisions are pure (`decideClose`, `decideMinimize`, `decideToggle`, `trayWanted`,
  `closesToTray`) and main/background/ carries them out. The page never hides the window itself:
  its close button asks main (`system.closeWindow`) and main decides. macOS keeps the app running
  with no window, so closing and minimising stay the platform's (`staysWithoutWindow`) and
  `window-all-closed` does not quit there.
- Putting the window away is told apart from quitting by `quitting` (before-quit, Windows'
  session-end); an explicit quit — the shortcut, the status bar, the tray menu — always quits.
- The sign-in entry is one file per platform behind one `LoginBackend` (main/background/login/): a
  Run-key value, a macOS login service, a freedesktop autostart file. The platform, not
  settings.json, holds whether it is on, because the user can also turn it off in Task Manager,
  System Settings or their desktop.

### Tests

- **Tests never contact external services, and never touch the machine.** tests/e2e/support.ts
  sets, by default:
  - closed ports for `ELECDEX_JMA_BASE_URL` (also the earthquake and tsunami lists),
    `ELECDEX_MET_BASE_URL`, `ELECDEX_NWS_BASE_URL`, `ELECDEX_USGS_BASE_URL`,
    `ELECDEX_NOAA_BASE_URL`, `ELECDEX_MARKETS_STUB_URL`, `ELECDEX_UPDATES_URL` and
    `ELECDEX_WEB_HOMES` (the web presets' homes); specs that need data run a local stub server;
  - `ELECDEX_AUDIO_STUB=1` (a steady tone and a made-up mixer, never the machine's sound or
    volume), with sound off;
  - `ELECDEX_BACKGROUND_STUB=1` for the notification-area icon, the system-wide shortcut and the
    sign-in entry, so no run touches the taskbar, keys or startup;
  - `ELECDEX_SOCKETS_STUB=1` for a made-up socket table (`=demo` for screenshots), so no run
    depends on — or records — where this machine has been.
  A plugin's hosts reach a stub through `ELECDEX_PLUGIN_HOST_MAP`
  (`api.example.test=127.0.0.1:port`), which keeps the grant checks as they are. Keep it that way.
- **Every bug found gets a test.** When a problem turns up (from a user, a review, a flaky run),
  add a test that fails on the old code and passes on the fix — and cover the related cases around
  it (the same path through another widget, the edit or reload that reaches it another way).
  Check that the test really fails without the fix. Put it at the lowest level that can see the
  bug (unit, then component, then e2e), plus an e2e check when the bug was only visible in the
  running app.
- **Test craft.** A test that needs the window the default layout is designed for (1920x1080)
  zooms out to get it in CSS pixels where the screen is smaller (the macOS CI runner's is about
  1024x640). A test that fails only under load is usually its own fault: a harness driving a fake
  clock waits on promises (`await Promise.resolve()`), never on real timers per step. A component
  test that stubs `window.elecdex` flushes what it started (`layout.flush()`) before unstubbing,
  and its IPC mocks `structuredClone` their arguments, since IPC cannot clone a `$state` proxy.
- **A test that hangs must say where.** A Playwright timeout prints nothing when it was waiting on
  an app to start or quit, so `launch` and the guarded `quit`/`close` in support.ts warn while
  they are still going (SLOW_MS) as well as after. A test that starts a second app on the same
  profile calls `launched.quit()`, never `launched.app.close()`: the guarded one kills an app that
  will not quit instead of holding the test until it times out with nothing in the log.

### Publishing

- **README screenshots** must not show personal data: regenerate them with
  `npm run gen:screenshots`, which uses a demo home and curated launcher entries and shoots every
  built-in theme plus the settings dialog and the audio panes (with `ELECDEX_AUDIO_STUB=demo`;
  name shots to take only those). Regenerate after a visible change to a theme or the default
  layout, and add a built-in theme to both the script and the README table.
- **Attribution** stays visible. JMA forecasts and the quakes pane show
  「出典：気象庁ホームページ（URL）を加工して作成」; earthquake and tsunami alerts name their source
  (JMA, USGS, NOAA) and say they are not an early warning (tsunami cards: follow local
  authorities); the GeoIP data is CC BY 4.0 (NRO), credited in the globe pane; Yahoo data is marked
  unofficial, possibly delayed, not investment advice.
- **Releases**: run the whole Playwright suite (`npx playwright test`) before bumping the version.
  Then bump `package.json` version and push tag `v<version>`; .github/workflows/release.yml builds
  every platform into a GitHub pre-release that a person promotes to a full release.

## Conventions

- TypeScript 7 (`@typescript/native`) with TS 6 alongside for the JS API; `svelte-check --tsgo`.
  `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`
  (no constructor parameter properties, no enums).
- Biome for lint and format (no ESLint/Prettier). Cognitive complexity ≤ 15: split functions.
- Svelte 5 runes. `$state.snapshot` before sending state over IPC (Proxies do not clone).
- Comments explain *why*, in full sentences; match the density of the surrounding code.
- Library versions are pinned to the latest release; when the latest cannot be used, the reason
  is recorded in architecture.md (e.g. Vite 7 because Vite 8's Rolldown cannot parse Svelte 5.57).
- Renderer-only and build-time packages are devDependencies (bundled by Vite), so they are not
  shipped twice; runtime Node dependencies of main stay in dependencies.

## Commits

Conventional commits, bilingual English / Japanese in one message, separated by ` / `:

```
feat(scope): english subject / 日本語の件名

English paragraph. / 日本語の段落。
```

No `[` `]`, no absolute paths, no attribution trailers. Update architecture.md §16 and the README
when behaviour or data sources change.

**What to run before committing.** The whole e2e suite takes minutes, so it is not the toll on
every change:

- **A feature or a fix**: `npm run verify`, `npm run build`, then the e2e specs added or changed
  for it, plus the ones the change could plausibly reach — the spec of the subsystem touched, and
  any spec that drives what was changed (a new shortcut: the specs that press shortcuts; a change
  to the status bar or a dialog: the specs that open them). Say which specs were run.
- **Before a release**, or for a change whose blast radius really is the whole app (the layout
  tree, the settings schema, the preload surface): the whole suite, `npx playwright test`.
