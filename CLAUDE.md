# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex (latest pre-release: v0.0.10) is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a
sci-fi terminal emulator and system monitor — on Electron 44, Svelte 5, TypeScript 7 and
xterm.js 6. GPL-3.0, like the original. The full design and every decision with its reason
live in [docs/architecture.md](docs/architecture.md) (§16 is the decision log); plugins in
[docs/plugins.md](docs/plugins.md). Read the relevant section before changing a subsystem.

## Commands

```bash
npm ci                 # install; postinstall downloads Electron and fixes node-pty on macOS
npm run dev            # electron-vite dev server + app (add `-- -- --windowed --no-intro`); npm start is the same
npm run verify         # biome lint + typecheck (node, e2e, web) + vitest — run before committing
npm run build          # production bundle into out/ (the e2e tests run against this)
npx playwright test    # end-to-end tests against out/ — run `npm run build` first
npm run package:dir    # unpacked app in release/win-unpacked (or mac/linux equivalent)
npm run gen:icon       # build/icon.svg -> build/icon.png + resources/icons/icon.png
npm run gen:card       # README banner: public/elecdex_repo_card.svg
npm run gen:geo        # globe land points, country centroids, time zone table
npm run gen:cities     # weather picker city list (GeoNames)
npm run gen:screenshots # README screenshots in a demo profile (Windows; build first)
```

Single tests: `npx vitest run tests/unit/<file>.test.ts`, `npx playwright test tests/e2e/<file>.spec.ts -g "<name>"`.

App flags: `--windowed` (not fullscreen), `--no-intro` (skip the boot sequence).

**Install scripts:** Electron 44 has no install script of its own and downloads its binary on
first `require('electron')`, which electron-vite bypasses — so this project's `postinstall` runs
`install-electron`. If `npm run dev` fails with "Electron uninstall" (e.g. after
`--ignore-scripts`), run `npx install-electron`. npm 11 blocks dependency install scripts until
approved; none are needed on Windows/macOS, but Linux must approve node-pty to compile it.
Electron flags go after a second `--`: `npm run dev -- -- --windowed`.

## Layout of the code

```
src/main/        main process: window, IPC handlers (ipc/), pty/, fs/, weather/, markets/, feeds/, quakes/, launcher/, audio/, plugins/, web/, background/
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas, channel names and pure logic used by both sides
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/, plugins/ (host, plugin pane, blocks), stores/, styles/
examples/        plugins/pomodoro: the sample plugin written into a new plugins folder
tests/unit/      vitest (node); tests/component/ (jsdom); tests/e2e/ (Playwright _electron)
scripts/         asset generators (icon, repo card, geo data, city list, README screenshots)
docs/            architecture.md (design + §16 decision log), weather-providers.md, plugins.md
                 (the plugin API and its rules), screenshots/ (README images)
```

## Rules that matter

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node)
  with CSP `connect-src 'self'`: it has no network and no filesystem. Everything goes through
  `window.elecdex` (src/shared/api.ts, src/preload/index.ts). Main validates every input
  (zod or explicit checks). Never expose a generic channel, a path-taking "run" or raw
  `ipcRenderer`. The launcher launches by opaque id from main's own catalog, never by path.
- **The connections pane reads the kernel, not the network.** Its `net.sockets` source lives in
  `src/services/metrics/sockets/`, one file per platform behind one `RawSocket` (Linux reads
  /proc, macOS runs netstat and cannot name an owner, Windows goes through the sampler's
  GetExtendedTcpTable P/Invoke). Peers are placed with the bundled GeoIP database, never a
  lookup service. It is the one reading a plugin can never be granted, so a new metric source
  goes into `PLUGIN_METRIC_SOURCE_IDS` or `PRIVATE_METRIC_SOURCE_IDS` deliberately (a unit test
  checks every source is in one of them).
- **Network lives in main**, never the renderer: weather (JMA, MET Norway, NWS - see
  docs/weather-providers.md; follow each service's terms), markets (yahoo-finance2 is
  Node-only — CORS and cookies block it in a browser), RSS feeds (src/main/feeds; the XML
  parser is imported lazily so an app without an RSS pane never loads it), earthquakes and
  tsunamis from JMA, or the USGS and NOAA (src/main/quakes; running only while alerts are on or a
  quakes pane is open, and only for the chosen source). Fetch only
  while a pane needs the data, batch, back off on failure, and keep the last good data on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols, feed URLs, the quake list) are
  reference-counted in preload and in main, and a page's subscriptions are dropped on reload
  (`did-start-navigation`) and destroy. Polling must stop when the last subscriber leaves —
  there are e2e tests asserting exactly that. A pane in a background tab (display:none)
  holds only its widget's `keepWhileHidden` sources (builtins.ts): the ones it charts, whose
  history would otherwise have a gap, and once-only ones; everything else is released until
  the tab is shown. List a new charted source there.
- **Tests never contact external services.** `tests/e2e/support.ts` points
  `ELECDEX_JMA_BASE_URL`, `ELECDEX_MET_BASE_URL`, `ELECDEX_NWS_BASE_URL`,
  `ELECDEX_MARKETS_STUB_URL`, `ELECDEX_UPDATES_URL` and `ELECDEX_WEB_HOMES` (the YouTube and X
  presets) at closed ports by default (the JMA base
  also covers the earthquake and tsunami lists), `ELECDEX_USGS_BASE_URL` and `ELECDEX_NOAA_BASE_URL`
  at closed ports by default, sets `ELECDEX_AUDIO_STUB=1` (a steady tone for the spectrum, a
  made-up mixer - never the machine's sound or volume) and starts with sound off; specs that need
  data run a local stub server. A plugin's hosts reach a stub through `ELECDEX_PLUGIN_HOST_MAP`
  (`api.example.test=127.0.0.1:port`), which keeps the grant checks as they are, and
  `ELECDEX_BACKGROUND_STUB=1` stands in for the notification-area icon, the system-wide shortcut
  and the sign-in entry, so no run touches the machine's taskbar, keys or startup, and
  `ELECDEX_SOCKETS_STUB=1` gives the connections pane a made-up socket table instead of the real
  one (`=demo` for the screenshots), so no run depends on - or records - where this machine has
  actually been. Keep it that way.
- **Audio capture stays out of the workspace.** The spectrum's system audio comes through screen
  capture with loopback audio, granted only in the hidden capture window (main/audio/capture-window.ts:
  its own session, its own two-function preload, a page with no network). The workspace session
  still refuses every permission but the clipboard, and only spectrum levels leave that window.
  On Linux, where Electron has no loopback, main runs `parec` on the default output's monitor
  (main/audio/pulse-capture.ts) - always `@DEFAULT_MONITOR@`, never the default input.
  Linux audio goes through the pulse protocol (parec, pactl), which PulseAudio and PipeWire both
  serve; WirePlumber's wpctl is only a fallback, never required (main/audio/mixer-linux.ts).
  Code that means "the elecdex window" asks `appWindows()` (main/app-windows.ts), never
  `BrowserWindow.getAllWindows()`, so the helper window is never taken for it.
- **Web panes** (docs/architecture.md section 5.4) are WebContentsViews that main owns, one per
  pane id, over the pane's body - never an iframe or `<webview>` in the workspace, whose CSP stays
  as it is. A site is a preset in `WEB_PRESETS` (shared/web.ts): its home and the hosts that stay in
  the pane; add a site there, not as a widget. All web panes share the `persist:web` session and
  nothing else does; pages get no preload, no permission but clipboard write and fullscreen, no
  downloads, and only http(s). A preset may carry a `userAgent`, which is how the YouTube (TV)
  pane asks for the television interface, and an `unlisted` one is resolved for a layout that
  names it but is not offered in the picker (the plain YouTube pane, which the television one
  supersedes); that pane is also the only one that can be signed in,
  because Google refuses an embedded browser (its device flow, a code entered on a phone, is the
  sanctioned way - never dress the pane up as Chrome to get past the check). Each mount claims its
  view with a token, so a moved pane's old component cannot hide the new one's page, and opens it
  once per mount without tracking props. A view is native and covers the DOM: anything drawn over
  panes registers with `coverWeb` (stores/web.svelte.ts), and dialogs, drags and CRT transitions
  hide views behind a snapshot, which is taken again when the page's colours change under them.
  The view sits on the theme's ground, so main also tells the page which `color-scheme` its own
  defaults follow - without it a page that brings no colours is black on black. The theme tint is
  off by default (`web.tint`) and each pane overrides it with the switch beside its address.
  Tests point presets at a stub with `ELECDEX_WEB_HOMES`.
- **Plugins** (docs/plugins.md) run in a blob Web Worker, one per plugin; main only transforms their
  text (sucrase) and never runs it. Everything a worker posts is checked (shared/plugins.ts) and
  every request, redirect, storage write and notification is checked in main against the grant in
  settings.json, never against what the renderer says a plugin asked for. The worker script is built
  from `stripGlobals` and `pluginRuntime` (shared/plugin-runtime.ts) as source text, so they must
  not refer to anything outside themselves. The real containment is the page CSP (`connect-src
  'self'`, no `unsafe-eval`, `worker-src blob:`): relaxing it means re-auditing plugins. Plugins
  draw only through blocks; add a block to plugin-api.ts, the schema and Blocks.svelte together.
  plugin-api.ts is copied verbatim into the user's plugins folder as elecdex-plugin.d.ts, so it
  holds types only and every change to it is a change to the public API (update docs/plugins.md).
  Consent is bound to the plugin id *and* its file or folder name; the host re-checks sizes
  (pane state, blocks, storage keys) even where the worker runtime already does, since a plugin
  can post around the runtime. A background service learns whether its panes are open from
  `ctx.views`, counted in the worker. Plugins that use unofficial APIs or are personal (such as
  claude-usage) live in a separate private repository, cloned beside this one and copied into
  the plugins folder with its `npm run deploy` - never here; the committed sample is the
  pomodoro timer.
- **Performance is measured, not assumed.** The idle budget is enforced in
  tests/e2e/metrics.spec.ts (default layout ~13% of one core). On Windows never spawn a process
  per reading — frequent readings go through `WindowsSampler` (one long-lived PowerShell).
  Animations share the 10 fps frame loop (`lib/frame-loop.ts`) instead of their own rAF loops.
  A CSS animation is the compositor's, not the loop's, and `backgroundThrottling` is off, so one
  keeps painting a window that has been put away: the frame loop marks the page `data-offscreen`
  and tokens.css takes `--motion-scale` to zero there. Weigh a new animation by the area it
  repaints - the clock's rolling digits cost ~4% of one core on the default layout, measured.
  Other timed screen updates wake on wall-clock boundaries with a `setTimeout` chain on
  `msUntilBoundary(period)` (the clock, the system pane's date), never an unaligned
  `setInterval`, so their change lands in the loop's frame; assign `$state` only when the
  shown value actually changes.
  Record measured numbers in docs/architecture.md §16 when a decision depends on them.
- **No location prompts.** Chromium permission requests are denied except clipboard
  (src/main/window.ts). Windows shows a location prompt for `netsh wlan`, which
  systeminformation's network functions run — do not call `si.networkInterfaces`,
  `si.wifi*` or similar on Windows.
- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY: ConPTY
  rewraps its buffer to every size and garbles history (see the remount regression test).
- **Shortcuts** are data (src/shared/keybindings.ts): add an action there with its default chord
  and handle it in Workspace.svelte; never hard-code a key check elsewhere. A chord must include
  Ctrl/Alt or be a function key, so the shell keeps every other key. An action with
  `scope: 'global'` is registered with the OS by main instead, so it is out of the page's `keymap`,
  out of the shortcut list and out of "reset all shortcuts", and `conflicts` reports the app action
  as the loser while the OS holds the keys.
- **Running in the background** (Windows only, docs/architecture.md section 16): minimising or
  closing to the notification area, the system-wide show/hide shortcut and the sign-in entry.
  Every option is off until the user turns it on. The decisions are pure in shared/background.ts
  (`decideClose`, `decideMinimize`, `decideToggle`, `trayWanted`, `closesToTray`) and main/background/
  carries them out, so the page never hides the window itself: its close button asks main to close
  the window (`system.closeWindow`) and main decides. Putting the window away is told apart from
  quitting by `quitting` (before-quit, Windows' session-end); an explicit quit - the shortcut, the
  status bar, the tray menu - always quits. The icon is there only while a tray option is on or the
  window is hidden, so a hidden window is never unreachable. Windows holds whether elecdex launches
  at sign-in, not settings.json, and `launchItems` reports neither a moved install nor the
  arguments, so the entry is written only when the user changes something. A hidden or minimised
  window is not reported hidden to a page with `backgroundThrottling: false`, so main sends
  `WindowState.hidden` and the frame loop stops drawing on it.
- **README screenshots** must not show personal data: regenerate them with
  `npm run gen:screenshots`, which uses a demo home and curated launcher entries and shoots every
  built-in theme plus the settings dialog and the audio panes (with `ELECDEX_AUDIO_STUB=demo`, never
  the machine's sound or apps; name shots to take only those). Regenerate after a visible change to a theme or the
  default layout, and add a built-in theme to both the script and the README table.
- **Releases**: run the whole Playwright suite (`npx playwright test`) before bumping the version -
  this is the one point where every spec is expected to run. Then bump `package.json` version, push
  tag `v<version>`; .github/workflows/release.yml builds every platform into a GitHub pre-release
  that a person promotes to a full release.
- **Layout state** is a persisted tree (src/shared/layout-ops.ts, pure and unit-tested).
  Widgets keep per-pane choices in pane state (`layout.setPaneState`). Every tree change goes
  through a pure op there; a tabbed pane is split, moved beside or dropped on through its group,
  and a group only ever holds panes - of any widget, so a shell can share a group with RSS or the
  weather (Ctrl-drag, or the picker's "new tab" placement). Nested groups (a split or a group
  inside a tab) were designed and deliberately postponed (user decision 2026-09-17): do not add
  them without asking. Splits carry no header: eDEX-UI's column labels (PANEL / SYSTEM) were
  dropped because panes move between columns; the shell's TERMINAL header stays, as it is the
  group's drag handle and shows the path. Pane moves (drag a title; Ctrl for a tab) are covered at three
  levels - unit (layout-ops, including seeded random moves), component (pane-drag gesture) and
  e2e (pane-move) - so extend those when touching it.
- **Saved layouts** (src/shared/layouts.ts) are the arrangements the user works in, kept by name in
  `layouts.json` with the id of the one being worked in. Each file has one job: `layout.json` is the
  live arrangement, with the volatile state a reload needs (a terminal's session id) and the one a
  hand edit reaches; `layouts.json` holds named copies with that state stripped (`portableTree`), so
  it can be copied to another machine and so a new shell does not rewrite it. main writes the live
  tree back into the active entry on every save, and only when it differs. A layout follows the work:
  never turn it back into a snapshot without asking (user decision 2026-09-20). Switching flushes the
  pending save *and waits for one in flight* - main writes each save into whichever layout is active
  when it arrives. A broken entry is dropped on its own; the file is never discarded whole for one
  bad layout. The first `KEYED_LAYOUTS` of them answer Ctrl+Shift+1..9 *by their place in the list*,
  which is why the dialog can reorder them - add a slot in shared/layouts.ts, keybindings.ts and
  Workspace.svelte together (a unit test checks the actions match the constant). Switching asks
  first while shells are open (`layout.confirmSwitch`); that question is a promise the switch
  awaits, so anything that takes the screen from it must answer it.
- **Remounts happen.** Moving a pane remounts its widget, so keep what must survive in pane state
  or in main (a shell reattaches to its session). A widget that creates a WebGL context must give
  it back when it unmounts (`forceContextLoss`, or `releaseWebglContexts` in lib/webgl.ts):
  Chromium keeps only about 16 and drops the oldest, which may be a visible pane's. Only two
  things take a GPU context - the shell (xterm's WebGL addon) and the globe (three.js); every
  other drawing widget is plain 2D canvas, deliberately. **There is no WebGPU here** and none is
  wanted: with 23 widgets that panes create and destroy freely, the context budget is what
  decides, and the clock's rolling digits (the one measured animation cost, ~4% of one core) are
  the compositor rasterising glyphs, which no renderer API of ours would touch. Asked and left
  as it is, 2026-09-19.
- **Open and close with the CRT effect.** Everything that appears or goes on top of the
  workspace powers on and off like a tube (styles/crt.css, lib/crt-transitions.ts), and a new
  pane, dialog or notice must do the same:
  - Panes: added ones power on through `layout.arrived`. A closed one powers off in the tree
    (`layout.closingId`), and the panes that gain its room are uncovered by a `crt-extend`
    clip (layout/pane-close.ts), never by animating sizes, which would send transient sizes to a
    shell. One close runs at a time; a tree change first calls `layout.settle()`.
  - Layouts: applying a saved one replaces the whole workspace, so the screen powers off as one
    (`layout.leaving`, a tab group with its header and strip) and the arrangement arriving powers
    on pane by pane as at boot, quicker (`layout/layout-switch.ts`). Overlapping switches are
    last-one-wins through a token.
  - A pane brought forward (`layout.zoom`, docs/architecture.md section 5.5) is pinned over the
    workspace with `position: fixed` and flies there with a transform (`crt-zoom`), never by
    growing: the tree is untouched, so nothing is remounted, the panes behind keep their size,
    and the pane's own size changes once. Every tree change lets go of it (`settle`). Whether a
    widget is brought forward at all is its registry entry's `zoom` ('full', 'panel', or left out,
    which means no button and no shortcut - the default). A new widget that fills the room it is
    given says 'full'; one that reads better at a fixed size says 'panel'; a readout of a few
    figures says nothing. Plugins declare the same in their descriptor. A widget that lays
    itself out by its own size (the calendar shows three months when there is room) reads that
    size from the `ResizeObserver` entry's rectangle, never by measuring the element again
    inside the callback: a pane just pinned over the workspace still answers there with the size
    it had in the layout it left, so the widget would keep the layout it had before.
  - Dialogs: the dialog has `crt-on`, `transition:crtPower` and
    `style:--crt-delay={dialogDelay()}`, its backdrop `transition:backdropShade`, and its
    open/close goes through `ui` so `ui.closedAt` is kept (a dialog opened just after another
    closed opens out of its line).
  - Notices and toasts: `crt-on` and `transition:crtPower`, with `|global` when the element
    can leave with a block around it (the last of a list).
  - With motion reduced, all of it is skipped and things just appear and go. Cover a new one in
    tests/e2e/motion.spec.ts (or its own spec, with `clickThen` from support.ts).
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens, not primitives. Text is the accent
  unless a theme sets `text` (Business does); never assume a dark ground - `mode: 'light'`
  (Business (Light)) sets `data-mode="light"`, which darkens status colours in tokens.css and turns
  on xterm's minimum contrast, so check a colour change in both Business themes. Every theme sets
  every variable (`themeVariables`), so switching never leaves one stale.
- **Attribution.** JMA forecasts and the quakes pane show「出典：気象庁ホームページ（URL）を加工して作成」,
  earthquake and tsunami alerts name their source (JMA, USGS, NOAA) and say they are not an
  early warning (tsunami cards: follow local authorities); the GeoIP
  data is CC BY 4.0 (NRO) and credited in the globe pane; Yahoo data is marked unofficial,
  possibly delayed, not investment advice. Keep these visible.
- **Every bug found gets a test.** When a problem turns up (from a user, a review, a flaky run),
  add a test that fails on the old code and passes on the fix - and cover the related cases
  around it, not only the one reported (the same path through another widget, the edit or
  reload that reaches it another way). Check that the test really fails without the fix. Put it
  at the lowest level that can see the bug (unit, then component, then e2e), plus an e2e check
  when the bug was only visible in the running app. A test that needs the window the default
  layout is designed for (1920x1080) zooms out to get it in CSS pixels where the screen is
  smaller - the macOS CI runner's is about 1024x640 - rather than measuring a window that
  cannot fit what it asserts. A test that fails only under load is usually
  its own fault: a harness driving a fake clock waits on promises (`await Promise.resolve()`), never
  on real timers per step, which cost seconds against the five-second limit. A component test that
  stubs `window.elecdex` flushes what it started (`layout.flush()`) before unstubbing, and its IPC
  mocks `structuredClone` their arguments, since IPC cannot clone a `$state` proxy.

## Conventions

- TypeScript 7 (`@typescript/native`) with TS 6 alongside for the JS API; `svelte-check --tsgo`.
  `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`
  (no constructor parameter properties, no enums).
- Biome for lint and format (no ESLint/Prettier). Cognitive complexity ≤ 15: split functions.
- Svelte 5 runes. `$state.snapshot` before sending state over IPC (Proxies do not clone).
- Comments explain *why*, in full sentences; match the density of the surrounding code.
- Library versions are pinned to the latest release; when the latest cannot be used, the
  reason is recorded in docs/architecture.md (e.g. Vite 7 because Vite 8's Rolldown cannot
  parse Svelte 5.57).
- Renderer-only and build-time packages are devDependencies (bundled by Vite), so they are
  not shipped twice; runtime Node dependencies of main stay in dependencies.

## Commits

Conventional commits, bilingual English / Japanese in one message, separated by ` / `:

```
feat(scope): english subject / 日本語の件名

English paragraph. / 日本語の段落。
```

No `[` `]`, no absolute paths, no attribution trailers. Update docs/architecture.md §16 and the
README when behaviour or data sources change.

**What to run before committing.** The whole e2e suite takes minutes, so it is not the toll on
every change:

- **A feature or a fix**: `npm run verify`, `npm run build`, then the e2e specs added or changed
  for it, plus the ones the change could plausibly reach - the spec of the subsystem touched, and
  any spec that drives what was changed (a new shortcut: the specs that press shortcuts; a change
  to the status bar or a dialog: the specs that open them). Judge that list from what the change
  touches, and say which specs were run.
- **Before a release** - the version bump and the tag: the whole suite, `npx playwright test`.

A change whose blast radius really is the whole app (the layout tree, the settings schema, the
preload surface) is a release-shaped change: run everything for that one too.
