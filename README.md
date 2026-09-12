# elecdex

A science-fiction desktop terminal emulator and system monitor — a ground-up rewrite of
[eDEX-UI](https://github.com/GitSquared/edex-ui) (archived in 2021) on a current stack.

> **Status: Phase 1 — terminal.** A working multi-tab terminal emulator with shell
> integration on Windows, macOS and Linux. Layout tree and system monitoring are next.
> See [docs/architecture.md](docs/architecture.md) and [docs/plugins.md](docs/plugins.md).

## Why a rewrite

eDEX-UI was archived with, in its author's words, a codebase "in dire need of a fresh
refactoring". elecdex keeps the idea and drops the implementation:

| eDEX-UI | elecdex |
| --- | --- |
| PTY tunnelled over a localhost WebSocket (ports 3000+) | `MessageChannelMain`, one channel per session; no listening socket |
| `nodeIntegration: true`, `contextIsolation: false`, `@electron/remote` | `sandbox: true`, `contextIsolation: true`, a single typed preload bridge |
| `cluster` fork per core; every widget polls `systeminformation` on its own timer | one `utilityProcess` and a subscription-driven scheduler that stops when nobody is watching |
| CWD tracked by polling `/proc`, `lsof` and `ps` — unsupported on Windows | shell integration (`OSC 7` / `OSC 133`), so Windows works too |
| Five hardcoded screen regions, five terminal tabs | a persisted layout tree: unlimited panes, splits and tabs |
| No bundler; minify-as-postprocess | electron-vite (Vite + Rollup) |

## Stack

Electron 44 · TypeScript 7 (native) · electron-vite 5 / Vite 7 · Svelte 5 (runes) ·
`@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three + threlte · zod · Biome 2 ·
Vitest 5 · Playwright · electron-builder 26

## Develop

```bash
npm install
npm run dev          # electron-vite dev, with HMR in the renderer
```

```bash
npm run verify       # lint + typecheck + unit/component tests
npm run build        # bundle main / preload / renderer into out/
npm run test:e2e     # Playwright against the built app (run build first)
npm run package      # installers into release/
```

`npm run dev -- --windowed` (or passing `--windowed` to the packaged binary) starts in a normal
window instead of fullscreen.

## Layout

```
src/shared/     contracts shared by all three processes (API types, IPC channel names, schemas)
src/main/       app lifecycle, window, IPC handlers, pty, metrics broker, settings, themes
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, design tokens
src/services/   utilityProcess entrypoints (metrics, geoip)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron)
```

## Licensing and assets

elecdex is MIT licensed and shares **no code or assets** with eDEX-UI (which is GPL-3.0).

| Asset | Source | License |
| --- | --- | --- |
| Display font | [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) | SIL OFL 1.1 |
| UI font | [Saira Condensed](https://fonts.google.com/specimen/Saira+Condensed) | SIL OFL 1.1 |
| Monospace font | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | SIL OFL 1.1 |
| IP geolocation | [`@ip-location-db/geo-whois-asn-country-mmdb`](https://github.com/sapics/ip-location-db) | CC0-1.0 |
| Globe geometry | [Natural Earth](https://www.naturalearthdata.com/) | Public domain |

The geolocation database is bundled, so there is no account to create, no API key and no
first-run download — and IP lookups never leave the machine.
