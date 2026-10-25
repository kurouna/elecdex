English | [日本語](develop.ja.md) | [简体中文](develop.zh-CN.md)

# Develop — elecdex

elecdex is a science-fiction terminal emulator and system monitor for Windows, macOS and Linux, a ground-up rewrite of eDEX-UI on Electron 45, Svelte 5, TypeScript 7 and xterm.js 6, under GPL-3.0. This page is for building and changing it: why it was rewritten, the stack and its versions, how to install and run it from source, the commands, how the tests are laid out, where the design documents are, and how a release is made. It is developed and used on Windows; macOS and Linux are built and run by the end-to-end tests on GitHub Actions only and are not sufficiently verified by hand.

## On this page

- [Why a rewrite](#why-a-rewrite)
- [Stack](#stack)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Tests](#tests)
- [Source layout](#source-layout)
- [Design documents and rules](#design-documents-and-rules)
- [Releasing](#releasing)

## Why a rewrite

eDEX-UI was archived with, in its author's words, a codebase "in dire need of a fresh refactoring". elecdex keeps the idea and drops the implementation:

| eDEX-UI | elecdex |
| --- | --- |
| PTY tunnelled over a localhost WebSocket (ports 3000+) | `MessageChannelMain`, one channel per session; no listening socket |
| `nodeIntegration: true`, `contextIsolation: false`, `@electron/remote` | `sandbox: true`, `contextIsolation: true`, a single typed preload bridge; the renderer has no network or filesystem access |
| `cluster` fork per core; every widget polls `systeminformation` on its own timer | one `utilityProcess` and a subscription-driven scheduler that stops when nobody is watching; on Windows, one long-lived sampler instead of a PowerShell per reading (monitoring cost measured 144% → 14% of one core) |
| CWD tracked by polling `/proc`, `lsof` and `ps` — unsupported on Windows | shell integration (`OSC 7` / `OSC 9;9` / `OSC 133`), so Windows works too |
| Five hardcoded screen regions, five terminal tabs | a persisted layout tree: unlimited panes, splits and tabs |
| No bundler; minify-as-postprocess | electron-vite (Vite + Rollup) |

Also unlike eDEX-UI: the built page is served from `app://elecdex`, never `file://`, under the content security policy `connect-src 'self'`; every network request is made by the main process; and themes are validated data turned into CSS variables, never spliced into a `<style>` tag.

## Stack

Electron 45 · TypeScript 7 (native) · electron-vite 6 / Vite 8 · Svelte 5 (runes) · `@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three · zod 4 · Biome 2 · Vitest 5 · Playwright · electron-builder 26

| Part | Package and version (package.json) |
| --- | --- |
| Runtime | `electron` 45.0.0; Node.js 22 or later for the tools (`engines`) |
| Language | TypeScript 7 (`@typescript/native` 7.0.2) for type checking, with `typescript` 6.0.3 for the JavaScript API; `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` |
| Build | `electron-vite` 6.0.0, `vite` 8.3.5; the page is built minified |
| UI | `svelte` 5.57.2 (runes), `svelte-check` 4.7.7 |
| Terminal | `@xterm/xterm` 6, `@xterm/headless` 6, `node-pty` 1.1 |
| System readings | `systeminformation` 5.33, in a `utilityProcess`; on Windows a long-lived sampler |
| Globe | `three` 0.186 |
| Validation | `zod` 4.6 |
| Plugins | `sucrase` 3.35.1 (TypeScript to the plugin worker's modules) |
| AI | `@anthropic-ai/sdk` 1.1.0 (loaded on first use); other providers as OpenAI-compatible HTTP |
| Lint and format | `@biomejs/biome` 2.6.2 (no ESLint or Prettier); cognitive complexity at most 15 |
| Tests | `vitest` 5.0.5, `jsdom` 30.1.3, `@testing-library/svelte` 5.4.2, `@playwright/test` 1.64.1 |
| Packaging | `electron-builder` 26.15.3 |

Library versions are pinned to the latest release; an exception is recorded in [docs/decisions.md](../decisions.md) (for example `@types/node` follows Electron's Node).

## Getting started

```bash
npm ci
npm run dev -- -- --windowed --no-intro   # the second -- hands flags to Electron; npm start is the same
```

| App flag | Effect |
| --- | --- |
| `--windowed` | Not fullscreen (fullscreen is the default) |
| `--no-intro` | Skip the boot sequence |

- No native toolchain is needed on **Windows or macOS**: node-pty ships prebuilt N-API binaries that Electron loads as-is.
- On **Linux** node-pty compiles once during install (`python3`, `make`, a C++ compiler); npm 11 asks for approval first: `npm install-scripts approve node-pty && npm rebuild node-pty`.
- The Electron binary is downloaded by this project's `postinstall` script (Electron 45 has no install script of its own, and electron-vite does not trigger its download-on-first-use), which also makes node-pty's macOS `spawn-helper` executable. After `--ignore-scripts`, run `npx install-electron` once. If `npm run dev` fails with "Electron uninstall", that is the cause.

## Commands

### Build and check

```bash
npm run verify       # lint + typecheck + unit/component tests
npm run build        # bundle main / preload / renderer into out/
npm run test:e2e     # Playwright against the built app (run build first)
npm run test:e2e:smoke # a few minutes of the e2e: launch and the mount and lifecycle contracts
npm run test:packaged  # the packaged app from release/ started once (after package)
npm run package      # installers into release/
```

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm start` | electron-vite dev server and the app |
| `npm run verify` | `biome check .`, the type checks (node, e16c, e2e, web with `svelte-check --tsgo`) and `vitest run` |
| `npm run build` | Production bundle into `out/`, and `out/THIRD_PARTY_NOTICES.txt` from what the build bundled |
| `npx playwright test` (`npm run test:e2e`) | The whole end-to-end suite against `out/`, the `@perf` tests last; `--project=e2e` leaves them out |
| `npm run test:e2e:smoke` | Launch, and the mount and lifecycle contracts: a quick look before a commit (build first) |
| `npm run package` | Installers into `release/` |
| `npm run package:dir` | The unpacked app in `release/win-unpacked` (or the macOS or Linux equivalent) |
| `npm run test:packaged` | The packaged app from `release/` started once over CDP (after `package` or `package:dir`) |
| `npm run lint:fix` / `npm run format` | Biome's fixes and formatting |

Single tests:

```bash
npx vitest run tests/unit/<file>.test.ts
npx playwright test tests/e2e/<folder>/<file>.spec.ts -g "<name>"   # folders: app, workspace, panes, extensions, contracts
```

### Generators and tools

| Command | What it writes |
| --- | --- |
| `npm run gen:icon` | `build/icon.svg` → `build/icon.png` and `resources/icons/icon.png` |
| `npm run gen:card` | The README banner, `public/elecdex_repo_card.svg` |
| `npm run gen:geo` | Globe land points, country centroids, the time zone table |
| `npm run gen:cities` | The weather picker's city list (GeoNames) |
| `npm run gen:orbit-map` | The ORBIT map: land dots, and time zone lines (timezone-boundary-builder, ODbL) |
| `npm run gen:chip8` | The CHIP-8 library and previews, `resources/chip8/programs.json` |
| `npm run gen:elec16` | The ELEC-16 ROMs (BASIC through e16c, the assembly), the SOFT CARD and the game shelf |
| `npm run gen:screenshots` | The README screenshots in a demo profile (Windows; build first) |
| `npm run demo:*` | Screen recordings of the app on stand-ins (Windows; build first); how each is made: [docs/demos.md](../demos.md) |
| `node scripts/log-feed.mjs [file] [--format=…] [--rate=20]` | A made-up log for trying LOG WATCH by hand |
| `node scripts/instruments-wav.mjs [dir] [voice]` | The plugins' instruments to WAV files, to listen to |
| `node scripts/sync-calc.mjs <elecxzy>` | Overwrites the vendored calculator (`src/shared/calc/vendor`, never edited by hand) from an elecxzy checkout |

## Tests

End-to-end tests never contact a real service, and never touch the machine they run on: weather, markets and the update check are pointed at closed ports or local stubs (JMA's earthquake and tsunami lists with the forecasts, and the USGS and NOAA feeds), RSS feeds, AI providers, plugin hosts and the web panes' sites are served by a local server, and the sound, the notification-area icon, the sign-in entry, the socket table and the encryption of API keys are stand-ins. The whole suite takes minutes; it is run in full before a release, and a change runs the specs it can reach.

| Folder | Runner | What it holds |
| --- | --- | --- |
| `tests/unit/` | Vitest, Node | Pure logic, schemas, the rules held by tests (every pane in the lifecycle table, every theme setting every variable, and so on) |
| `tests/component/` | Vitest + jsdom + Testing Library | Svelte components |
| `tests/e2e/app/` | Playwright `_electron` | The whole app: launch, boot, settings, exit, single instance, background, plugin containment, upgrades from older profiles |
| `tests/e2e/workspace/` | Playwright | Layout, saved layouts, presets, moving panes, zoom, the palette |
| `tests/e2e/panes/` | Playwright | One spec per pane |
| `tests/e2e/extensions/` | Playwright | Plugins (API 1 and 2, KEYSTREAM) and web presets |
| `tests/e2e/contracts/` | Playwright | Table-driven checks over every pane, key, dialog and IPC method: mount, lifecycle, persistence, motion, themes, keybindings, IPC, faults, attribution, no external requests |

- Playwright runs two projects: `e2e` (everything but `@perf`) and `perf` (the idle budget and CPU measurements), which runs after it.
- The stubs are environment variables set by `tests/e2e/support.ts` (`STUB_ENV`), such as `ELECDEX_AUDIO_STUB=1`, `ELECDEX_WIFI_STUB=1` or `ELECDEX_DOCKER_STUB=1`.
- The design of the e2e suite, where each kind of check lives and why: [docs/e2e-design.md](../e2e-design.md) (Japanese).
- If an elecdex runs outside the tests (an installed app, or `npm run dev` left open), launches and drags fail; the reporter logs it to `test-results/elecdex-running.log`.

## Source layout

```
src/shared/     contracts shared by all processes (API types, IPC channel names, schemas, pure logic)
src/main/       app lifecycle, window, IPC handlers, pty, weather, markets, feeds, quakes, launcher,
                audio, plugins, web panes, reminders, running in the background, updates
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, the plugin host, dialogs, design tokens
src/services/   utilityProcess: the metrics collector
examples/       the sample plugins (pomodoro, and KEYSTREAM for API version 2)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron; docs/e2e-design.md)
scripts/        asset generators (icon, banner, globe data, city list, README screenshots)
docs/           architecture.md (the design, in Japanese), decisions.md (the decision log,
                in Japanese), plugins.md, weather-providers.md, elec16.md (the ELEC-16 design),
                elec16-basic.md, elec16-e16.md, elec16-e16c.md, elec16-soft.md, elec16-play-manual.md, elec16-kit.md,
                elec16-sci-manual.md (the ELEC-16 manuals, elec16-sci.md the calculator's design,
                in Japanese)
```

## Design documents and rules

| Document | What it is |
| --- | --- |
| [docs/architecture.md](../architecture.md) | The design, section by section, one per pane (Japanese) |
| [docs/decisions.md](../decisions.md) | Every decision with its reason and the measured numbers it rests on (Japanese) |
| [docs/plugins.md](../plugins.md) | The plugin API (Japanese) |
| [docs/e2e-design.md](../e2e-design.md) | The end-to-end test design (Japanese) |
| [docs/weather-providers.md](../weather-providers.md) | The weather services and their terms |
| [docs/palette.md](../palette.md), [docs/cluster.md](../cluster.md), [docs/logwatch.md](../logwatch.md) | The action palette, the CLUSTER pane and the LOG WATCH pane |
| [docs/elec16.md](../elec16.md), [docs/emu.md](../emu.md) | The ELEC-16 pane and the emulators' shared base |
| [docs/demos.md](../demos.md) | Making, changing and recording the demos |
| [docs/guide/data-sources.md](data-sources.md) | Every network connection, what it sends and under which terms |

The rules a change must keep - the security boundary, where the network lives, what tests may touch - are in [CLAUDE.md](../../CLAUDE.md), and those of one pane or subsystem in [.claude/rules/](../../.claude/rules).

## Releasing

1. Set `version` in `package.json`, commit, and push.
2. Tag that commit `v<version>` and push the tag: `git tag v0.1.0 && git push origin v0.1.0`.
3. The Release workflow checks the tag against `package.json`, runs lint, typecheck and unit tests, creates a GitHub pre-release with generated notes, and attaches installers for Windows (x64, arm64), macOS (arm64, x64) and Linux (AppImage and deb, x64 and arm64).
4. Review the pre-release and, when it is ready, untick "Set as a pre-release". The update check ignores pre-releases, so only then do running copies announce it.

- The workflow ([.github/workflows/release.yml](../../.github/workflows/release.yml)) also starts each package once as a user gets it, where the runner can run what it built (not the cross-built Windows arm64 and macOS x64).
- The builds are unsigned; the README's *If a warning appears* says what each OS shows and how to get past it.
- The maintainers' full checklist, which runs the whole test suite and the packaged app before tagging and reads the release afterwards, is under *Releases* in [CLAUDE.md](../../CLAUDE.md).

See also: [Keyboard and layouts](keyboard.md) · [Themes and settings](themes-settings.md) · [Plugins](plugins-use.md)
