# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex (latest pre-release: v0.0.2) is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a
sci-fi terminal emulator and system monitor — on Electron 44, Svelte 5, TypeScript 7 and
xterm.js 6. GPL-3.0, like the original. The full design and every decision with its reason
live in [docs/architecture.md](docs/architecture.md) (§16 is the decision log); plugins in
[docs/plugins.md](docs/plugins.md). Read the relevant section before changing a subsystem.

## Commands

```bash
npm ci                 # install; postinstall downloads Electron and fixes node-pty on macOS
npm run dev            # electron-vite dev server + app (add `-- -- --windowed --no-intro`)
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
src/main/        main process: window, IPC handlers (ipc/), pty/, fs/, weather/, markets/, launcher/
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas, channel names and pure logic used by both sides
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/, stores/, styles/
tests/unit/      vitest (node); tests/component/ (jsdom); tests/e2e/ (Playwright _electron)
scripts/         asset generators (icon, repo card, geo data, city list, README screenshots)
docs/            architecture.md (design + §16 decision log), weather-providers.md, plugins.md
                 (designed, not yet implemented), screenshots/ (README images)
```

## Rules that matter

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node)
  with CSP `connect-src 'self'`: it has no network and no filesystem. Everything goes through
  `window.elecdex` (src/shared/api.ts, src/preload/index.ts). Main validates every input
  (zod or explicit checks). Never expose a generic channel, a path-taking "run" or raw
  `ipcRenderer`. The launcher launches by opaque id from main's own catalog, never by path.
- **Network lives in main**, never the renderer: weather (JMA, MET Norway, NWS - see
  docs/weather-providers.md; follow each service's terms), markets (yahoo-finance2 is
  Node-only — CORS and cookies block it in a browser). Fetch only while a pane needs the data,
  batch, back off on failure, and keep the last good data on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols) are
  reference-counted in preload and in main, and a page's subscriptions are dropped on reload
  (`did-start-navigation`) and destroy. Polling must stop when the last subscriber leaves —
  there are e2e tests asserting exactly that.
- **Tests never contact external services.** `tests/e2e/support.ts` points
  `ELECDEX_JMA_BASE_URL`, `ELECDEX_MET_BASE_URL`, `ELECDEX_NWS_BASE_URL`,
  `ELECDEX_MARKETS_STUB_URL` and `ELECDEX_UPDATES_URL` at closed ports by default and starts
  with sound off; specs that need data run a local stub server. Keep it that way.
- **Performance is measured, not assumed.** The idle budget is enforced in
  tests/e2e/metrics.spec.ts (default layout ~13% of one core). On Windows never spawn a process
  per reading — frequent readings go through `WindowsSampler` (one long-lived PowerShell).
  Animations share the 10 fps frame loop (`lib/frame-loop.ts`) instead of their own rAF loops.
  Record measured numbers in docs/architecture.md §16 when a decision depends on them.
- **No location prompts.** Chromium permission requests are denied except clipboard
  (src/main/window.ts). Windows shows a location prompt for `netsh wlan`, which
  systeminformation's network functions run — do not call `si.networkInterfaces`,
  `si.wifi*` or similar on Windows.
- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY: ConPTY
  rewraps its buffer to every size and garbles history (see the remount regression test).
- **Shortcuts** are data (src/shared/keybindings.ts): add an action there with its default chord
  and handle it in Workspace.svelte; never hard-code a key check elsewhere. A chord must include
  Ctrl/Alt or be a function key, so the shell keeps every other key.
- **README screenshots** must not show personal data: regenerate them with
  `npm run gen:screenshots`, which uses a demo home and curated launcher entries.
- **Releases**: bump `package.json` version, push tag `v<version>`; .github/workflows/release.yml
  builds every platform into a GitHub pre-release that a person promotes to a full release.
- **Layout state** is a persisted tree (src/shared/layout-ops.ts, pure and unit-tested).
  Widgets keep per-pane choices in pane state (`layout.setPaneState`). Every tree change goes
  through a pure op there; a tabbed pane is split, moved beside or dropped on through its group,
  and a group only ever holds panes. Pane moves (drag a title; Ctrl for a tab) are covered at three
  levels - unit (layout-ops, including seeded random moves), component (pane-drag gesture) and
  e2e (pane-move) - so extend those when touching it.
- **Remounts happen.** Moving a pane remounts its widget, so keep what must survive in pane state
  or in main (a shell reattaches to its session). A widget that creates a WebGL context must give
  it back when it unmounts (`forceContextLoss`, or `releaseWebglContexts` in lib/webgl.ts):
  Chromium keeps only about 16 and drops the oldest, which may be a visible pane's.
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens, not primitives.
- **Attribution.** JMA forecasts show「出典：気象庁ホームページ（URL）を加工して作成」; the GeoIP
  data is CC BY 4.0 (NRO) and credited in the globe pane; Yahoo data is marked unofficial,
  possibly delayed, not investment advice. Keep these visible.

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

No `[` `]`, no absolute paths, no attribution trailers. Run `npm run verify`, `npm run build`
and the relevant Playwright specs before committing; update docs/architecture.md §16 and the
README when behaviour or data sources change.
