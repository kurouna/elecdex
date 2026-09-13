<p align="center">
  <img src="./public/elecdex_repo_card.svg" width="800" alt="elecdex - Sci-fi terminal and system monitor, rebuilt">
</p>

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Zenn](https://img.shields.io/badge/Zenn-kurouna-blue)](https://zenn.dev/kurouna)
[![X](https://img.shields.io/badge/X-elecxzy-black)](https://x.com/elecxzy)

# elecdex

A science-fiction desktop terminal emulator and system monitor — a ground-up rewrite of
[eDEX-UI](https://github.com/GitSquared/edex-ui) (archived in 2021) on a current, secure stack,
for Windows, macOS and Linux.

<p align="center">
  <img src="./docs/screenshots/elecdex-tron.jpg" alt="elecdex with the Tron theme: system monitors on the left, three shell tabs with the launcher and file browser in the middle, and the world view, markets, weather and calendar on the right">
</p>

> **v0.0.1 — first pre-release.** Everything below works today; builds are unsigned.
> Design notes and every decision with its reason: [docs/architecture.md](docs/architecture.md).

## Features

- **Terminal** — real shells (PowerShell, bash, zsh, fish) in unlimited tabs and splits. Shell
  integration reports the working directory and exit codes, on Windows too, and a session keeps
  its scrollback when its pane is moved or reloaded.
- **System monitor** — clock with time zone, system strip with a battery gauge, per-core CPU (as
  graphs or bars), memory and swap over time, disks with read/write activity, top processes,
  network status and traffic. The default layout idles at about 13–15% of one core.
- **World view** — a globe of where the machine's connections go, placed with a bundled GeoIP
  database; nothing is looked up online.
- **Files and apps** — a file browser that follows the shell (click to `cd` or insert a path),
  and a launcher for the Start Menu, `/Applications` or `.desktop` entries plus your own, most
  used first.
- **Weather, markets and calendar** — forecasts for anywhere (JMA in Japan, the National Weather
  Service in the United States, MET Norway elsewhere), a market board from Yahoo Finance, and a
  month calendar with optional Japanese holidays.
- **Layout** — every pane can be closed, split, tabbed, resized and brought back; the layout is
  saved and can be reset.
- **Look and feel** — four themes (Tron, Amber, Phosphor, White) that switch live, CRT power-on
  boot sequence, scanlines and glow, synthesised interface sounds, a themed title bar and a status
  bar that slides in from the bottom edge.
- **Settings** — a settings dialog for theme, motion, sound, the launcher, rebindable keyboard
  shortcuts and the update check, all saved to a hand-editable `settings.json`.

<table>
  <tr>
    <td><img src="./docs/screenshots/elecdex-white.jpg" alt="The White theme, with scanlines"></td>
    <td><img src="./docs/screenshots/elecdex-settings.jpg" alt="The settings dialog, keyboard section"></td>
  </tr>
  <tr>
    <td align="center">White theme</td>
    <td align="center">Settings → Keyboard</td>
  </tr>
</table>

## Install

Download the installer for your platform from
[Releases](https://github.com/kurouna/elecdex/releases):

| Platform | File |
| --- | --- |
| Windows x64 / arm64 | `elecdex-win-x64-<version>.exe` / `elecdex-win-arm64-<version>.exe` |
| macOS Apple silicon / Intel | `elecdex-mac-arm64-<version>.dmg` / `elecdex-mac-x64-<version>.dmg` |
| Linux x64 | `elecdex-linux-x86_64-<version>.AppImage` or `elecdex-linux-amd64-<version>.deb` |
| Linux arm64 | `elecdex-linux-arm64-<version>.AppImage` or `elecdex-linux-arm64-<version>.deb` |

The builds are not code-signed yet. Windows SmartScreen shows "Windows protected your PC" — choose
*More info → Run anyway*. On macOS, open the app once with right-click → *Open* (or allow it in
*System Settings → Privacy & Security*).

elecdex starts fullscreen. **F11** leaves fullscreen and **Ctrl+Shift+Q** quits; `--windowed`
starts in a window and `--no-intro` skips the boot sequence.

## Keyboard

| Shortcut | Action |
| --- | --- |
| Ctrl+Shift+E | split the focused pane to the right |
| Ctrl+Shift+O | split the focused pane downward |
| Ctrl+Shift+T | new tab beside the focused pane |
| Ctrl+Shift+W | close the focused pane (or its × button, shown on hover) |
| Ctrl+Shift+[ / ] | move focus between panes |
| Ctrl+Shift+A | add a pane: any widget, right of, below or as a tab beside the focused pane |
| Ctrl+Shift+Backspace | reset to the default layout |
| Ctrl+Shift+L | search the launcher (adds a launcher pane if there is none) |
| Ctrl+Shift+, | settings |
| F11 | toggle fullscreen |
| Ctrl+Shift+Q | quit |
| Arrow keys on a divider | resize (Shift for larger steps) |

The shell has focus when elecdex starts. In a shell, selecting text copies it and a right-click
pastes, as in PuTTY or Windows Terminal; Ctrl+C stays the shell's interrupt.

Every shortcut except the divider keys can be rebound in *Settings → Keyboard*: click one and
press the new keys. A shortcut needs Ctrl (Cmd on macOS), Alt or a function key, so every other
key still reaches the shell, and a chord already in use is flagged. The status bar (move the
pointer to the bottom edge) has buttons for adding a pane, resetting the layout, settings, theme,
sound and exit.

## Panes

The default layout is arranged by what the panes are for — **left, this machine:** clock, system,
CPU, memory, disk, top processes, network status and traffic; **centre, work:** three shell tabs
over the launcher and the file browser; **right, the world outside:** world view, markets,
weather and calendar.

- **Terminal** — tabs show the shell and its directory; a non-zero exit code is flagged on the
  pane.
- **System** — date and weekday, uptime, OS, and power with a battery gauge (green, red below 20%).
- **CPU** — two graphs of the cores' average load, or a bar per logical core (toggle in the pane).
- **Memory** — the share in use and swap over the last minute, scrolling in step with the CPU
  graphs, with bars for the amounts now.
- **Disk** — each volume as a bar of used space against its size (amber from 90%, red from 97%),
  with space left, filesystem and whether it is removable or on the network; above them the read
  and write rates and how busy the disks are (not shown on macOS, which has no cheap reading).
- **Launcher** — the platform's applications plus your own entries, most used first. Type to
  filter, Enter to launch. Icons take the theme's accent and show their own colours on hover. Add
  entries under `launcher.items` in `settings.json` (the pane's EDIT LIST button opens it):

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

- **Filesystem** — the followed shell's directory as a grid; click a folder to `cd` into it, a
  file to type its quoted path at the prompt.
- **World view** — connections by country on a turning globe. "You are here" is the country of
  the system time zone (or of the locale, when the zone names none); the OS location service is
  never asked.
- **Markets** — indices, currencies and anything Yahoo Finance quotes, about once a minute, as
  sparklines against the previous close or as bars of the day's change. SYMBOLS edits the list,
  each symbol optionally followed by a label: `^N225 日経平均, JPY=X ドル円, 7203.T トヨタ`. Built-in
  names follow the app language (`--lang=en-US` forces English). Yahoo has no live TOPIX index, so
  the default board shows the CME yen TOPIX future (`TPY=F`).
- **Weather** — the settings button → PLACE opens a picker over a bundled list of large cities and
  capitals and JMA's forecast offices, or takes `lat, lon`. Japan uses JMA, the United States the
  National Weather Service (or MET Norway, by choice), everywhere else MET Norway. °C or °F per
  pane; the default is New York City.
- **Calendar** — the month with today marked; ‹ › or the mouse wheel change month. The settings
  button ticks holiday calendars (Japan for now, computed locally), and the next holiday is named
  below the month.

## Themes and settings

Everything in the settings dialog is saved at once to `settings.json` in the app's userData
folder, which can also be edited by hand while the app runs:

```json
{
  "theme": "amber",
  "sound": { "enabled": true, "volume": 0.5 },
  "motion": "system",
  "keybindings": { "app.quit": null },
  "updates": { "check": true }
}
```

To add a theme, drop a JSON file into the `themes` folder next to it (*Settings → General →
themes folder*). It appears straight away; one with a built-in's `id` replaces that theme.

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
The layout lives in `layout.json` beside them; a hand-edited file is validated on load, and one
that cannot be read is moved aside to `layout.json.bak` rather than discarded.

## Why a rewrite

eDEX-UI was archived with, in its author's words, a codebase "in dire need of a fresh
refactoring". elecdex keeps the idea and drops the implementation:

| eDEX-UI | elecdex |
| --- | --- |
| PTY tunnelled over a localhost WebSocket (ports 3000+) | `MessageChannelMain`, one channel per session; no listening socket |
| `nodeIntegration: true`, `contextIsolation: false`, `@electron/remote` | `sandbox: true`, `contextIsolation: true`, a single typed preload bridge; the renderer has no network or filesystem access |
| `cluster` fork per core; every widget polls `systeminformation` on its own timer | one `utilityProcess` and a subscription-driven scheduler that stops when nobody is watching; on Windows, one long-lived sampler instead of a PowerShell per reading (monitoring cost measured 144% → 14% of one core) |
| CWD tracked by polling `/proc`, `lsof` and `ps` — unsupported on Windows | shell integration (`OSC 7` / `OSC 133`), so Windows works too |
| Five hardcoded screen regions, five terminal tabs | a persisted layout tree: unlimited panes, splits and tabs |
| No bundler; minify-as-postprocess | electron-vite (Vite + Rollup) |

## Develop

Stack: Electron 44 · TypeScript 7 (native) · electron-vite 5 / Vite 7 · Svelte 5 (runes) ·
`@xterm/xterm` 6 · node-pty 1.1 · systeminformation · three · zod 4 · Biome 2 · Vitest 5 ·
Playwright · electron-builder 26

```bash
npm ci
npm run dev -- -- --windowed --no-intro   # the second -- hands flags to Electron
```

```bash
npm run verify       # lint + typecheck + unit/component tests
npm run build        # bundle main / preload / renderer into out/
npm run test:e2e     # Playwright against the built app (run build first)
npm run package      # installers into release/
```

No native toolchain is needed on **Windows or macOS**: node-pty ships prebuilt N-API binaries that
Electron loads as-is. On **Linux** node-pty compiles once during install (`python3`, `make`, a C++
compiler); npm 11 asks for approval first: `npm install-scripts approve node-pty && npm rebuild
node-pty`.

The Electron binary is downloaded by this project's `postinstall` script (Electron 44 has no
install script of its own, and electron-vite does not trigger its download-on-first-use), which
also makes node-pty's macOS `spawn-helper` executable. After `--ignore-scripts`, run
`npx install-electron` once.

End-to-end tests never contact a real service: weather, markets and the update check are pointed
at closed ports or local stubs.

```
src/shared/     contracts shared by all processes (API types, IPC channel names, schemas, pure logic)
src/main/       app lifecycle, window, IPC handlers, pty, weather, markets, launcher, updates
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, dialogs, design tokens
src/services/   utilityProcess: the metrics collector
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron)
scripts/        asset generators (icon, banner, globe data, city list)
```

### Releasing

1. Set `version` in `package.json`, commit, and push.
2. Tag that commit `v<version>` and push the tag: `git tag v0.1.0 && git push origin v0.1.0`.
3. The Release workflow checks the tag against `package.json`, runs lint, typecheck and unit tests,
   creates a GitHub pre-release with generated notes, and attaches installers for Windows (x64,
   arm64), macOS (arm64, x64) and Linux (AppImage and deb, x64 and arm64).
4. Review the pre-release and, when it is ready, untick "Set as a pre-release". The update check
   ignores pre-releases, so only then do running copies announce it.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Weather, Japan | 出典：気象庁ホームページ（[https://www.jma.go.jp/bosai/forecast/](https://www.jma.go.jp/bosai/forecast/)）を加工して作成 | Fetched only while a weather pane shows a place in Japan, around JMA's publication times (0, 5, 11 and 17 o'clock JST), with conditional requests. The pane shows the same attribution. Used under JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html). The forecast JSON is what JMA's own pages load, not a documented API; it is parsed leniently and the last forecast stays on screen if it fails. |
| Weather, United States | [National Weather Service](https://www.weather.gov/) (api.weather.gov) | Open data. The point lookup is kept for a day; the forecast is asked for about hourly, only while a pane shows the place. |
| Weather, everywhere else | [MET Norway](https://api.met.no/) Locationforecast 2.0 | [CC BY 4.0](https://api.met.no/doc/License), credited in the pane. Requests follow the [terms of service](https://api.met.no/doc/TermsOfService): an identifying User-Agent, coordinates to four decimals, nothing before the `Expires` of the last response (and at least 30 minutes apart), If-Modified-Since. |
| City list for the weather picker | [GeoNames](https://www.geonames.org/) (cities of 500,000 people or more, and capitals) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bundled. Nothing typed in the picker is sent anywhere. |
| Market quotes | [Yahoo Finance](https://finance.yahoo.com/), through yahoo-finance2 | Unofficial API, not endorsed by Yahoo; quotes may be delayed and are not investment advice (the pane says so). Fetched only while a markets pane is open: one batched request a minute (every five minutes when every listed market is closed) and each intraday chart every five minutes. |
| Update check | [GitHub Releases API](https://docs.github.com/rest/releases/releases#get-the-latest-release) | One request for the latest published release, 15 seconds after start and then daily, while enabled (the default). Nothing is downloaded or installed: a newer release shows a notice that opens its page. |

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

The geolocation database is bundled, so there is no account, no API key and no first-run
download, and IP lookups never leave the machine.

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
