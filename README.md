<p align="center">
  <img src="./public/elecdex_repo_card.svg" width="800" alt="elecdex - Sci-fi terminal and system monitor, rebuilt">
</p>

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Zenn](https://img.shields.io/badge/Zenn-kurouna-blue)](https://zenn.dev/kurouna)
[![X](https://img.shields.io/badge/X-elecxzy-black)](https://x.com/elecxzy)

# elecdex

A science-fiction desktop terminal emulator and system monitor — a ground-up rewrite of
[eDEX-UI](https://github.com/GitSquared/edex-ui) (archived in 2021) on a current stack.

> **Status: Phase 6 — world view.** The eDEX-UI HUD, rebuilt: live CPU, memory,
> process, network and system widgets around a multi-tab terminal, a file browser that follows
> the terminal's directory (Windows included) and a JMA weather forecast, in a persisted layout
> tree, behind eDEX-UI's boot sequence with each pane switching on like a CRT. Three themes
> (Tron, Amber, Phosphor) switch live, interface sounds are synthesised, and a globe shows
> where the machine's connections go, placed with a bundled GeoIP database, beside an
> application launcher and a market board.
> The default layout idles at about 13% of one core.
> See [docs/architecture.md](docs/architecture.md) and [docs/plugins.md](docs/plugins.md).

## Why a rewrite

eDEX-UI was archived with, in its author's words, a codebase "in dire need of a fresh
refactoring". elecdex keeps the idea and drops the implementation:

| eDEX-UI | elecdex |
| --- | --- |
| PTY tunnelled over a localhost WebSocket (ports 3000+) | `MessageChannelMain`, one channel per session; no listening socket |
| `nodeIntegration: true`, `contextIsolation: false`, `@electron/remote` | `sandbox: true`, `contextIsolation: true`, a single typed preload bridge |
| `cluster` fork per core; every widget polls `systeminformation` on its own timer | one `utilityProcess` and a subscription-driven scheduler that stops when nobody is watching; on Windows, one long-lived sampler instead of a PowerShell per reading (monitoring cost measured 144% → 14% of one core) |
| CWD tracked by polling `/proc`, `lsof` and `ps` — unsupported on Windows | shell integration (`OSC 7` / `OSC 133`), so Windows works too |
| Five hardcoded screen regions, five terminal tabs | a persisted layout tree: unlimited panes, splits and tabs |
| No bundler; minify-as-postprocess | electron-vite (Vite + Rollup) |

## Stack

Electron 44 · TypeScript 7 (native) · electron-vite 5 / Vite 7 · Svelte 5 (runes) ·
`@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three + threlte · zod · Biome 2 ·
Vitest 5 · Playwright · electron-builder 26

## Develop

No native toolchain is needed on **Windows or macOS**. node-pty is an N-API addon that ships
prebuilt, ABI-stable binaries which Electron loads as-is, so `npm ci` never invokes node-gyp and
you do not need Visual Studio or Xcode. On **Linux** node-pty has no prebuild and compiles once
during install, which needs `python3`, `make` and a C++ compiler (e.g. `build-essential`).

The Electron binary is downloaded by this project's own `postinstall` script. Electron 44 no
longer downloads it from a lifecycle script of its own, and electron-vite looks for the binary
without triggering Electron's download-on-first-use, so without this step `npm run dev` would
stop with "Electron uninstall". If you installed with scripts disabled (`--ignore-scripts`), run
it once by hand:

```bash
npx install-electron
```

npm 11 asks for approval before running *dependencies'* install scripts and lists the ones it
skipped (esbuild, node-pty, electron-winstaller). None of them is needed on Windows or macOS:
esbuild ships its binary as a platform package and node-pty ships prebuilds. On Linux, approve
node-pty so it can compile: `npm install-scripts approve node-pty && npm rebuild node-pty`.

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

`npm run dev -- -- --windowed` (the second `--` hands the flag to Electron rather than to
electron-vite; the packaged binary takes `--windowed` directly) starts in a normal
window instead of fullscreen, and `--no-intro` skips the boot sequence. The boot sequence also
plays only once per window (a reload skips it), any key or click cuts it short, and it is
skipped when the OS asks for reduced motion.

In a window, the title bar is drawn in the theme's colours, with the system's window controls
recoloured to match. The status bar along the bottom stays hidden until the pointer reaches the
bottom edge; its lower-case `elecdex` opens the GitHub repository.

## Keyboard

| Shortcut | Action |
| --- | --- |
| Ctrl+Shift+E | split the focused pane to the right |
| Ctrl+Shift+O | split the focused pane downward |
| Ctrl+Shift+T | new tab beside the focused pane |
| Ctrl+Shift+W | close the focused pane (or its × button, shown on hover) |
| Ctrl+Shift+[ / ] | move focus between panes |
| Ctrl+Shift+Backspace | reset to the default layout (also RESET LAYOUT in the status bar and in the add-pane picker, clicked twice) |
| Ctrl+Shift+A | add a pane: pick any widget, placed right of, below or as a tab beside the focused pane (also the + PANE button) |
| Ctrl+Shift+Q | quit (or the EXIT button in the status bar, clicked twice) |
| Ctrl+Shift+, | settings (also the SETTINGS button in the status bar) |
| F11 | toggle fullscreen |
| Arrow keys on a divider | resize (Shift for larger steps) |

Every shortcut above except the divider keys can be rebound in Settings → Keyboard: click one and
press the new keys. A shortcut needs Ctrl (Cmd on macOS), Alt or a function key, so every other
key still reaches the shell; a chord already in use is flagged. They are stored as
`"keybindings": { "pane.add": "Alt+KeyP" }` in `settings.json` (`null` removes one).

The layout is saved to `layout.json` in the app's userData directory. Editing it by hand is
supported: it is validated and normalised on load, and a file that cannot be read is moved
aside to `layout.json.bak` rather than discarded.

## Themes and settings

Pick a theme from the status bar or the settings dialog (Ctrl+Shift+,); it applies at once,
terminal included, with no reload. The dialog also sets motion, sound and volume, whether the
launcher lists installed applications, the shortcuts and the update check. Everything is saved
to `settings.json` in the userData directory, which can also be edited by hand while the app
runs:

```json
{
  "theme": "amber",
  "sound": { "enabled": true, "volume": 0.5 },
  "motion": "system",
  "keybindings": { "app.quit": null },
  "updates": { "check": true }
}
```

To add a theme, drop a JSON file into the `themes` folder next to it. It appears in the menu
straight away; one with a built-in's `id` replaces that theme.

```json
{
  "id": "ice",
  "name": "Ice",
  "accent": { "h": 200, "s": 60, "l": 70 },
  "surfaces": { "s0": "#000000", "s1": "#010203", "s2": "#040506", "line": "#101820" },
  "terminal": { "ansiPull": 0.5, "ansi": { "red": "#ff5f56" } },
  "effects": { "scanlines": false, "glow": 0.2 }
}
```

Colours are `#rrggbb`; `status` (hues for danger / warn / ok / info) and `fonts` are optional.
The glow effect costs a couple of percent of a core at idle.

## Default layout

Arranged by what the panes are for:

- **Left — this machine:** a compact clock, the system strip, CPU, memory, top processes, and
  its network: connection status and traffic.
- **Centre — work:** three shell tabs, and beneath them the launcher beside the file browser
  (which follows the shell).
- **Right — the world outside:** the globe of connections, the market board, the weather
  forecast and a calendar.

Anything can be closed, moved or brought back with the add-pane picker (Ctrl+Shift+A).

## Launcher, markets, calendar and CPU views

- **Launcher** — the Start Menu on Windows (`/Applications` on macOS, `.desktop` files on
  Linux), your own entries first. Once you start things from it, the most used come first
  (counts are kept in `launcher-usage.json`). Icons are drawn in the theme's accent colour and
  show their own colours on hover. Type to filter, Enter to launch. Add entries
  under `launcher.items` in `settings.json` (the pane's EDIT LIST button opens it):

  ```json
  "launcher": {
    "showSystem": true,
    "items": [
      { "name": "Project notes", "target": "C:\\Users\\me\\notes.md" },
      { "name": "Docs", "target": "https://github.com/kurouna/elecdex" },
      { "name": "Node REPL", "target": "C:\\Program Files\\nodejs\\node.exe", "args": ["-i"] }
    ]
  }
  ```

- **Markets** — indices, currencies and anything else Yahoo Finance quotes, refreshed about
  once a minute, as sparklines against the previous close or as diverging bars of the day's
  change (toggle in the pane). SYMBOLS edits the list, each symbol optionally followed by a
  label: `^N225 日経平均, JPY=X ドル円, 7203.T トヨタ`. Well-known symbols without a label of your
  own are named in the app's language — Japanese when Electron's locale is Japanese, English
  otherwise ("日経平均" / "Nikkei 225"); run with `--lang=en-US` to force one. Yahoo publishes no live TOPIX index,
  so the default board shows the CME yen TOPIX future (`TPY=F`).

- **Calendar** — the month with today marked, in English; ‹ › or the mouse wheel change month.
  Saturdays are blue, Sundays and holidays red. The settings button in the corner lists holiday
  calendars to tick - Japan for now, substitute holidays included, computed locally; none by
  default and remembered per pane - and the next holiday is named below the month.

- **CPU usage** has the same toggle, switching to a bar per logical core.

## Layout

```
src/shared/     contracts shared by all three processes (API types, IPC channel names, schemas)
src/main/       app lifecycle, window, IPC handlers, pty, metrics broker, settings, themes
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, design tokens
src/services/   utilityProcess entrypoints (metrics, geoip)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron)
```

## Third-party assets

| Asset | Source | License |
| --- | --- | --- |
| Display font | [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) | SIL OFL 1.1 |
| UI font | [Saira Condensed](https://fonts.google.com/specimen/Saira+Condensed) | SIL OFL 1.1 |
| Monospace font | [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | SIL OFL 1.1 |
| IP geolocation | [`@ip-location-db/geo-whois-asn-country-mmdb`](https://github.com/sapics/ip-location-db), data by the [NRO](https://www.nro.net/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (the npm package is labelled CC0-1.0; its bundled NRO_LICENSE requires attribution to nro.net) |
| Globe land and country shapes | [Natural Earth](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) | Public domain / ISC (build time only) |
| Country codes and time zones | [i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries), [countries-and-timezones](https://github.com/manuelmhtr/countries-and-timezones) | MIT (build time only) |
| README banner font | [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) | SIL OFL 1.1 (outlined into the SVG at build time) |
| Market data client | [yahoo-finance2](https://github.com/gadicc/yahoo-finance2) | MIT (bundled into the main process) |

The geolocation database is bundled, so there is no account to create, no API key and no
first-run download — and IP lookups never leave the machine. The globe pane credits the NRO.
"You are here" on the globe is the country of the system time zone, so no online service is
asked for the machine's public address either.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Market quotes | [Yahoo Finance](https://finance.yahoo.com/), through yahoo-finance2 | Unofficial API, not endorsed by Yahoo; quotes may be delayed and are not investment advice (the pane says so). Fetched only while a markets pane is open: one batched quote request a minute (every five minutes when every listed market is closed) and each intraday chart every five minutes. |
| Weather forecast | 出典：気象庁ホームページ（[https://www.jma.go.jp/bosai/forecast/](https://www.jma.go.jp/bosai/forecast/)）を加工して作成 | Fetched only while a weather pane is open, and only around JMA's publication times (0, 5, 11 and 17 o'clock JST), with conditional requests. The weather pane shows the same attribution. Used under JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html). |

| Update check | [GitHub Releases API](https://docs.github.com/rest/releases/releases#get-the-latest-release) | One request for the latest published release, 15 seconds after start and then daily, while "check for updates daily" is on (the default). Nothing is downloaded or installed: a newer release shows a notice that opens its page. |

The forecast JSON is what JMA's own pages load, not a documented API; elecdex parses it
leniently and keeps showing the last forecast if the format or the network fails.

---

## Releasing

1. Set `version` in `package.json`, commit, and push.
2. Tag that commit `v<version>` and push the tag: `git tag v0.1.0 && git push origin v0.1.0`.
3. The Release workflow checks the tag against `package.json`, runs lint, typecheck and unit
   tests, creates a GitHub pre-release with generated notes, and attaches installers for
   Windows (x64, arm64), macOS (arm64, x64) and Linux (AppImage and deb, x64 and arm64).
4. Review the pre-release and, when it is ready, untick "Set as a pre-release". The update check
   ignores pre-releases, so only then do running copies announce it.

Builds are unsigned: Windows SmartScreen and macOS Gatekeeper will ask before the first launch.

---

## License / ライセンス

This software is released under the [GNU General Public License v3.0](./LICENSE), the same license
as eDEX-UI.  
本ソフトウェアは、eDEX-UI と同じ [GNU General Public License v3.0](./LICENSE) のもとで公開されています。

## Acknowledgements / 謝辞

This application is deeply inspired by the design and philosophy of the following pioneering
project. We express our utmost respect and gratitude to its creator and contributors:

本アプリケーションは、以下の先駆的なプロジェクトの設計と哲学に深くインスパイアされています。
この優れたソフトウェアを生み出した開発者およびコミュニティの皆様に、最大限の敬意と謝意を表します。

- **[eDEX-UI](https://github.com/GitSquared/edex-ui)**
  - Copyright (c) 2017-2021 Gabriel "Squared" Saillard
  - Created by Gabriel "Squared" Saillard ([gaby.dev](https://gaby.dev))
  - Licensed under the GNU General Public License v3.0
