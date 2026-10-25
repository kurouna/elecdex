# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a sci-fi
terminal emulator and system monitor — on Electron 45, Svelte 5, TypeScript 7 and xterm.js 6.
GPL-3.0, like the original; the version is in package.json, and releases are pre-releases.
It is developed and used on Windows; macOS and Linux have only been run by the e2e tests on GitHub
Actions and are **not sufficiently verified** - the README says so, and must go on saying so until
someone has used them by hand.

## How the rules are organised

This file holds what applies in every session: the boundaries, performance, tests, publishing,
conventions and commits. The rules of one subsystem live in [.claude/rules/](.claude/rules), one
file each, with `paths` naming the files they are about: Claude Code loads such a file when one of
those files is read or edited, not when it is only mentioned. **Before planning a change to a
subsystem, read its rules file, then the design section it names** - a plan made from the code
alone tends to break a promise the code quietly depends on. The design is in
[docs/architecture.md](docs/architecture.md), every decision with its reason and measured numbers in
[docs/decisions.md](docs/decisions.md) (both Japanese), the plugin API in
[docs/plugins.md](docs/plugins.md).

| Subsystem | Rules | Design |
|---|---|---|
| Panes, layout, dialogs, shortcuts, palette, CRT transitions, themes, cards, type sizes | [panes-layout.md](.claude/rules/panes-layout.md) | architecture.md §5.5, §5.6, §5.13, §5.24, §7; docs/palette.md |
| Shell panes: sizing, the folder | [terminal.md](.claude/rules/terminal.md) | §6.2 |
| Running in the background (tray, shortcut, sign-in entry) | [background.md](.claude/rules/background.md) | decisions.md |
| The metrics collector: sockets, GPU | [metrics.md](.claude/rules/metrics.md) | §5.22 |
| Wi-Fi and Ethernet panes | [wifi-ethernet.md](.claude/rules/wifi-ethernet.md) | §5.12, §5.23; docs/ethernet-mock |
| CLIPBOARD | [clipboard.md](.claude/rules/clipboard.md) | §5.14 |
| NOW PLAYING | [now-playing.md](.claude/rules/now-playing.md) | §5.15 |
| UTILITY (AWAKE, CODEC, QR) | [utility.md](.claude/rules/utility.md) | §5.16 |
| DOCKER | [docker.md](.claude/rules/docker.md) | §5.17 |
| CHIP-8 and the emulators' shared base | [chip8.md](.claude/rules/chip8.md) | §5.18; docs/emu.md |
| ELEC-16: the pocket, PLAY-320, its games and kit, SCI | [elec16.md](.claude/rules/elec16.md) | §5.19; docs/elec16.md and the elec16-*.md documents |
| CLUSTER | [cluster.md](.claude/rules/cluster.md) | §5.20; docs/cluster.md |
| LOG WATCH | [logwatch.md](.claude/rules/logwatch.md) | §5.21; docs/logwatch.md |
| Web panes | [web-panes.md](.claude/rules/web-panes.md) | §5.4 |
| Plugins | [plugins.md](.claude/rules/plugins.md) | docs/plugins.md |
| AI chat | [ai-chat.md](.claude/rules/ai-chat.md) | §5.7 |
| ELEC (the council) | [elec.md](.claude/rules/elec.md) | §5.8 |
| git pane | [git.md](.claude/rules/git.md) | §5.9 |
| AI AGENT | [agents.md](.claude/rules/agents.md) | §5.11; docs/agents-codex.md |
| Tests: the stubs, test craft, the reporter | [tests.md](.claude/rules/tests.md) | docs/e2e-design.md |
| Publishing: screenshots, demos, notices, the release procedure | [publishing.md](.claude/rules/publishing.md) | docs/demos.md |
| Generators and demo scripts (their commands) | [scripts.md](.claude/rules/scripts.md) | docs/demos.md |

A rule stated for one pane, channel, shortcut, dialog or theme holds for every one of its kind,
including the ones added later. A test named beside a rule is what holds it: change the test with
the rule, never around it.

## Commands

```bash
npm ci                 # install; postinstall downloads Electron and fixes node-pty on macOS
npm run dev            # electron-vite dev server + app; npm start is the same
npm run verify         # biome lint + typecheck (node, e2e, web) + vitest
npm run build          # production bundle into out/ (the e2e tests run against this)
npx playwright test    # end-to-end tests against out/ — run `npm run build` first
npm run test:e2e:smoke # launch, the mount and lifecycle contracts: a quick look before a commit (build first)
npm run test:packaged  # the packaged app from release/ started once over CDP (after package or package:dir)
npm run package:dir    # unpacked app in release/win-unpacked (or mac/linux equivalent)
```

The asset generators (`gen:*`) and the demo recordings (`demo:*`) are listed, with what each makes,
in [.claude/rules/scripts.md](.claude/rules/scripts.md).

Single tests: `npx vitest run tests/unit/<file>.test.ts`,
`npx playwright test tests/e2e/<folder>/<file>.spec.ts -g "<name>"` (folders: app, workspace,
panes, extensions, contracts; docs/e2e-design.md). `--project=e2e` leaves out the `@perf` tests,
which `npx playwright test` runs last.

App flags: `--windowed` (not fullscreen), `--no-intro` (skip the boot sequence). Electron flags go
after a second `--`: `npm run dev -- -- --windowed --no-intro`.

**Install scripts:** Electron 45 has no install script of its own and downloads its binary on
first `require('electron')`, which electron-vite bypasses — so `postinstall` runs
`install-electron`. If `npm run dev` fails with "Electron uninstall" (e.g. after
`--ignore-scripts`), run `npx install-electron`. npm 11 blocks dependency install scripts until
approved; none are needed on Windows/macOS, but Linux must approve node-pty to compile it.

## Layout of the code

```
src/main/        main process: window, ipc/ (handlers, table.ts), store/ (json files), pty/, fs/,
                 one folder per service (weather/, markets/, feeds/, quakes/, orbits/, clipboard/,
                 media/, ai/, agents/, git/, chip8/, elec16/, launcher/, audio/, plugins/, web/,
                 background/, reminders/, updates/, awake/, docker/, logwatch/, secrets/),
                 metrics/ (the broker between the collector and pages),
                 boundary-timer.ts (readings on the wall clock's grid)
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/: sockets/, wifi/, ethernet/, gpu/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas (schemas/), channel names and pure logic used by both sides;
                 calc/ (vendor/ is elecxzy's evaluator, the wrapper beside it is ours)
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/ (builtins.ts is the
                 registry), plugins/ (host, plugin pane, blocks), palette/, stores/, styles/, lib/
examples/        plugins/pomodoro: the sample plugin written into a new plugins folder;
                 plugins/keystream: the API 2 sample (canvas, keys, sound), a rhythm game
tests/           unit/ (vitest, node), component/ (jsdom), e2e/ (Playwright _electron: app/, workspace/,
                 panes/, extensions/, contracts/ tables over every pane, key, dialog and IPC method;
                 support/, incl. shared.ts, one app shared by tests; docs/e2e-design.md)
scripts/         asset generators, demo recordings, sync-calc, fix-node-pty
docs/            architecture.md, decisions.md, plugins.md, e2e-design.md, demos.md,
                 weather-providers.md; a design document (and often a *-mock/ folder) per pane,
                 named in the table above; the ELEC-16's manuals (elec16-*.md, Japanese);
                 screenshots/ (README images)
```

## Rules that matter

Each rule names where its design and reasons are: a section of architecture.md (§n), plugins.md,
or the decision log, [docs/decisions.md](docs/decisions.md). "User decision" marks a choice the
user made; do not reverse one without asking.

### Boundaries

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node) with
  CSP `connect-src 'self'`: no network, no filesystem. Built, the page is served from
  `app://elecdex` (main/app-protocol.ts), never file://, so its 'self' is not the disk.
  Everything goes through `window.elecdex`
  (src/shared/api.ts, src/preload/index.ts). Main validates every input (zod or explicit checks).
  Never expose a generic channel, a path-taking "run" or raw `ipcRenderer`. The launcher launches
  by opaque id from main's own catalog, never by path. A main module's channels are one
  `registerTable` table (main/ipc/table.ts, §4.1), so dispose never lists them again; a single
  board's pages are a `PageSubscribers`.
- **Network lives in main**, never the renderer: weather (docs/weather-providers.md; follow each
  service's terms), markets, RSS, earthquakes and tsunamis (only while alerts are on or a quakes
  pane is seen, only for the chosen source), CelesTrak orbital elements (§5.10: only while an
  ORBIT pane shows the set, at most the stations twice a day and Starlink once, kept on disk,
  nothing for a day after any answer but a 200). Positions are computed in the page (SGP4); no
  service is asked where something is. Fetch only while a pane needs the data, batch, back off on
  failure, keep the last good data on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols, feed URLs, the quake
  list, every pane board) are reference-counted in preload and main, and dropped on reload and
  destroy through `whenPageGoes` (main/ipc/page-gone.ts) - never a module's own page listeners.
  A page store shared by panes starts and stops with `refCounted` (lib/ref-counted.ts), whose
  release counts once. Polling stops when the last subscriber leaves (e2e asserts it). Each
  module's `watching()` diagnostic (§4.1) answers a sorted `string[]`, empty when idle.
  - A pane in a background tab holds only its widget's `keepWhileHidden` sources (builtins.ts):
    the ones it charts, and once-only ones. List a new charted source there.
  - Everything else a pane subscribes to, or writes on a timer or pulse, is taken only while it is
    `seen` (stores/window-state.svelte.ts), keeping what it showed. Only a shell, an answer being
    written, a timer or alarm, quake alerts, plugins (`ctx.views`) and web pages go on unseen: a
    web pane's page (a video) keeps playing behind a tab and in a minimised window (§5.4).
  - The e2e lifecycle contract (tests/e2e/contracts/lifecycle.spec.ts) checks every built-in pane
    behind a tab, in a minimised window, closed, reloaded and after a crash, from the table in
    contracts/panes.ts (a new pane needs its row: what main does for it while seen, what it keeps,
    what goes on unseen); tests/unit/e2e-contracts.test.ts holds the table to builtins.ts. Web
    panes, the exception above, are apart.
- **No location prompts.** Chromium permission requests are denied except clipboard
  (main/window.ts). On Windows never call `si.networkInterfaces`, `si.wifi*` or similar (they run
  `netsh wlan`).
- **Audio capture stays out of the workspace.** Loopback capture is granted only in the hidden
  capture window (main/audio/capture-window.ts: own session, report-only preload, no network);
  only spectrum levels leave it. Linux uses `parec` on `@DEFAULT_MONITOR@`, never the default
  input; pulse protocol first, wpctl only as fallback. Code meaning "the elecdex window" asks
  `appWindows()` (main/app-windows.ts), never `BrowserWindow.getAllWindows()`, so the capture
  window is never taken for it.
- **The vendored calculator is never edited.** `src/shared/calc/vendor` is elecxzy's (MIT), out of
  tsconfig and biome; what elecdex needs goes in the wrapper; `scripts/sync-calc.mjs` overwrites
  the folder.
- **Desk data lives in main.** Notes, tasks and alarms are main's files; a pane keeps only display
  choices and ids. Reminders wait on one `setTimeout` (src/main/reminders), never a poll.

### Performance

- **Measured, not assumed.** The idle budget is enforced in tests/e2e/panes/metrics.spec.ts (`@perf`). Record
  measured numbers in docs/decisions.md when a decision depends on them.
- On Windows never spawn a process per reading: frequent readings go through `WindowsSampler`.
- **`spawn` is synchronous on main**, and Windows scans a PowerShell script in its command line:
  hand PowerShell its script in an environment variable (`powerShellStart`, `ELECDEX_PS_INIT`),
  and time the `spawn` of any new PowerShell start.
- Animations share the 10 fps frame loop (lib/frame-loop.ts), never their own rAF loops. The loop
  marks the page `data-offscreen` and tokens.css zeroes `--motion-scale`; main sends
  `WindowState.hidden` for a hidden or minimised window.
  - An animation outliving its frame takes `animation-play-state: var(--ambient-play-state)`
    after its `animation` shorthand, in every rule that sets the shorthand.
  - The loop only draws; what must happen at a moment waits on its own `setTimeout`.
  - No `will-change`, and no `forwards`/`both` fill on what stays in the page (styles/crt.css
    too).
- Weigh a new animation by the area it repaints.
- Other timed updates wake on wall-clock boundaries through `onBoundary(period, …)`, never a timer
  of their own or an unaligned `setInterval`. Assign `$state` only when the shown value changes.
  In main, a reading on the grid is a `BoundaryTimer` (main/boundary-timer.ts), never a timer
  armed by hand.
- **GPU contexts are a budget** (Chromium keeps about 16 WebGL contexts): only the shell and the
  globe take one, and give it back on unmount (`forceContextLoss`, `releaseWebglContexts`).
  Everything else is plain 2D canvas. **No WebGPU** (user decision 2026-09-19).

### Tests

- **Tests never contact external services, and never touch the machine.** tests/e2e/support.ts
  sets stubs for every service and device by default (`STUB_ENV`, listed in
  [.claude/rules/tests.md](.claude/rules/tests.md)); a spec that needs data runs a local stub
  server. Keep it that way: a test that reaches a real service or this machine's sound, clipboard
  or network passes on one machine and fails on the next, and may touch what the user has.
- **Every bug found gets a test** that fails on the old code and passes on the fix, covering the
  related paths too, at the lowest level that can see it, plus e2e when it was only visible in the
  running app. Check that it really fails without the fix.
- Test craft (what makes an e2e test flaky and how to write one that is not), the reporter and the
  hang warnings are in [.claude/rules/tests.md](.claude/rules/tests.md), loaded with any test file.

### Publishing

- **Attribution** stays visible: JMA (「出典：気象庁ホームページ（URL）を加工して作成」); quake and
  tsunami alerts name their source and say they are not an early warning (tsunami cards: follow
  local authorities); GeoIP CC BY 4.0 (NRO) in the globe pane; CelesTrak and the Space Defense
  Squadrons, and the time zone lines ODbL (© OpenStreetMap contributors) in the ORBIT pane, with
  `tz-lines.json` carrying its licence; Yahoo marked unofficial, possibly delayed, not investment
  advice.
- **README.ja.md** and **README.zh-CN.md** follow the README section for section, in the same
  commit.
- **The README's status line** names the last released version, marks main-only work
  *unreleased*, and says macOS and Linux are not sufficiently verified.
- **A visible addition goes out with the release**: a new pane, preset or theme gets its README
  shot and its lines in all three READMEs, new bundled data its third-party notice, and a new
  central or showy feature a beat in the introduction demo; a visible change to a theme, a preset
  or the default layout regenerates the shots. How each is made, and the release procedure, are
  in [.claude/rules/publishing.md](.claude/rules/publishing.md).

## Conventions

- TypeScript 7 (`@typescript/native`) with TS 6 for the JS API; `svelte-check --tsgo`. `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (no constructor
  parameter properties, no enums).
- Biome for lint and format (no ESLint/Prettier). Cognitive complexity ≤ 15: split functions.
- Svelte 5 runes. `$state.snapshot` before sending state over IPC or to a worker.
- Comments explain *why*, in full sentences; match the surrounding density.
- Library versions are pinned to the latest release; an exception is recorded in decisions.md
  (e.g. `@types/node` follows Electron's Node).
- Files main writes by renaming go through `replaceFile` (main/store/replace-file.ts), never a bare
  `renameSync`.
- Renderer-only and build-time packages are devDependencies; main's runtime ones are
  dependencies (package-deps.test.ts). A heavy package one pane needs (yahoo-finance2, the
  Anthropic SDK, the XML parser) is `import()`ed on first use (lazy-imports.test.ts). The page is
  built minified.

## Commits

Conventional commits, bilingual English / Japanese in one message, separated by ` / `:

```
feat(scope): english subject / 日本語の件名

English paragraph. / 日本語の段落。
```

No `[` `]`, no absolute paths, no attribution trailers. Update docs/decisions.md and the README
when behaviour or data sources change.

**What to run before committing:**

- **A feature or a fix**: `npm run verify`, `npm run build`, `npm run test:e2e:smoke`, then the e2e
  specs added or changed, plus the ones the change could plausibly reach - the spec of the subsystem touched, and any spec
  that drives what changed (a new shortcut: the specs that press shortcuts; the status bar or a
  dialog: the specs that open them). Say which specs were run.
- **Before a release**, or for a change across the whole app (the layout tree, the settings
  schema, the preload surface): the whole suite, `npx playwright test`.
