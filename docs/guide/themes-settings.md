English | [日本語](themes-settings.ja.md) | [简体中文](themes-settings.zh-CN.md)

# Themes and settings — elecdex

elecdex is a science-fiction terminal emulator and system monitor for Windows, macOS and Linux, a rewrite of eDEX-UI. This page covers its eight built-in themes and how to add your own, the motion and sound settings, the settings dialog, every key of `settings.json` with its default, where the app keeps its files on each operating system, the layout files, and the update check. macOS and Linux are built and run by the automated tests only and are not sufficiently verified by hand.

## On this page

- [Themes](#themes)
- [Adding a theme](#adding-a-theme)
- [Motion](#motion)
- [Sound](#sound)
- [Settings dialog](#settings-dialog)
- [settings.json](#settingsjson)
- [Where the files are](#where-the-files-are)
- [Layout files](#layout-files)
- [Updates](#updates)

## Themes

| | |
| --- | --- |
| Where | *Settings → General → appearance → theme*; *theme* in the status bar; the action palette (Ctrl+Shift+P) |
| Settings | `theme` in `settings.json` (default `"tron"`; an id no theme has falls back to it) |
| Files | Your own themes: the `themes` folder in the app's data folder |

Eight themes switch live, without a reload: the page sets the theme as CSS variables, and the canvas panes re-read their colours.

| Theme | id | Mode | Look |
| --- | --- | --- | --- |
| Tron | `tron` | dark | eDEX-UI's default look: a desaturated teal on near-black, no scanlines or glow. The default theme |
| Amber | `amber` | dark | A monochrome amber terminal, scanlines and a warm glow |
| Phosphor | `phosphor` | dark | Green P1 phosphor, the classic monitor, scanlines and glow |
| White | `white` | dark | A cool white monitor: text #D7E0EA on #0A0B0D, scanlines and a soft glow |
| Black | `black` | light | White turned over: near-black text #0A080D on the pale #D7E0EA, with the same scanlines and only a trace of glow |
| Business (Dark) | `business-dark` | dark | Windows 11's dark mode colours and default blue accent, Segoe UI and Cascadia Mono, Windows Terminal's Campbell scheme, no grid, scanlines or glow, launcher icons in their own colours |
| Business (Light) | `business-light` | light | The same in Windows 11's light mode, with the One Half Light scheme |
| Paper | `paper` | light | *unreleased*: monochrome and plain, like an e-paper display: ink #111111 on grey paper (#D9D9D5, panes #E5E5E1), a hueless accent, the terminal's sixteen colours as a ladder of distinct greys, Segoe UI and Cascadia Mono, no grid, scanlines or glow |

- Tron, Amber, Phosphor and White are for the HUD; Business (Dark) and Business (Light) are for an ordinary working day; Paper is monochrome and plain.
- Text is the theme's accent colour unless the theme sets text colours, as the Business themes and Paper do.
- A light theme (`mode: "light"`) gets darker status colours, and the terminal raises faint colours to a 4.5:1 contrast.
- The Business themes never tint web panes (see `web.tint` below).

![elecdex in the Tron theme: system monitors on the left, three shell tabs with the launcher and file browser in the middle, and the world view, markets, weather and calendar on the right](../screenshots/elecdex-tron.jpg)

![The cockpit preset in the Black theme, near-black on a pale ground with scanlines](../screenshots/elecdex-cockpit.jpg)

![The ai preset in the Business (Dark) theme: two AI chat panes, and the ELEC system over the GPU pane; every answer is a stand-in's, made for the picture](../screenshots/elecdex-ai.jpg)

Every theme appears in a picture: Tron (standard, earth), Amber (blank, CHIP-8), Phosphor (dev), White (network, media), Black (cockpit), Paper (desk), Business (Dark) (ai) and Business (Light) (the ELEC-16 SCI calculator).

## Adding a theme

To add a theme, drop a JSON file into the `themes` folder next to `settings.json` (*Settings → General → themes folder* opens it). It appears straight away; one with a built-in's `id` replaces that theme. A file that cannot be read is listed under the theme picker with the reason, rather than silently missing from it.

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

| Field | Required | Value |
| --- | --- | --- |
| `id` | yes | Lowercase letters, digits and hyphens |
| `name` | yes | 1 to 60 characters, shown in the picker |
| `author` | no | Up to 60 characters |
| `mode` | no | `"dark"` (default) or `"light"` for a light ground: darker status colours, and the terminal raises faint colours to 4.5:1 |
| `accent` | yes | `h` 0–360, `s` and `l` 0–100 |
| `surfaces` | yes | `s0`, `s1`, `s2` (ground and raised panels) and `line` (the grid), each `#rrggbb` |
| `text` | no | `primary` and `muted` text colours; without it, text is the accent, and muted is the primary at half strength |
| `status` | no | Hues for `danger`, `warn`, `ok` and `info` (`info` is also Saturdays in the calendar) |
| `fonts` | no | `display`, `ui` and `mono` font family lists (names, quotes and commas only) |
| `terminal.ansiPull` | no | 0 to 1: how far the derived ANSI colours lean toward the accent (default 0.45) |
| `terminal.ansi` | no | Any of the 16 ANSI colours by name (`black` … `brightWhite`), each `#rrggbb`; these win over the derived palette one by one |
| `effects.scanlines` | no | CRT scanlines over the whole screen |
| `effects.glow` | no | Phosphor glow on text, 0 to 1 |
| `effects.iconTint` | no | `false` shows launcher icons in their own colours |

Colours are `#rrggbb`. A theme is validated and turned into a fixed set of CSS variables; nothing in it is ever parsed as CSS or HTML.

## Motion

| | |
| --- | --- |
| Where | *Settings → General → appearance → motion* |
| Settings | `motion`: `"system"` (default), `"full"` or `"reduced"` |

- `system` follows the operating system's reduce-motion setting; `full` and `reduced` override it.
- The look includes a CRT power-on boot sequence after a Linux-style boot log of this machine's real facts. A pane added later powers on the same way; a closed one powers off and the panes beside it extend into its room; switching to a saved layout powers the whole screen off and brings the next one up pane by pane; dialogs and notices power off too.
- Short entrance effects (a wave of dates for each month, a forecast rising in, new headlines and earthquakes sliding in with a three-second highlight) follow the motion setting.
- With motion reduced, nothing moves: these effects and the CRT transitions are skipped.
- Animations pause while the window is hidden or minimised.

## Sound

| | |
| --- | --- |
| Where | *Settings → General → sound*; *sound on / off* in the status bar |
| Settings | `sound.enabled` (default `true`), `sound.volume` 0 to 1 (default `0.5`; the dialog shows it as 0–100 %) |

- Interface sounds are synthesised with WebAudio, not recorded: there are no audio files.
- The same switch governs the alert sounds of earthquake and tsunami alerts and task reminders, which play only with interface sounds on.
- The shell's bell is set apart: *Settings → General → terminal → bell* (`terminal.bell`: `both` flash and sound, `flash`, `sound` or `off`; default `both`).
- The CHIP-8 and ELEC-16 buzzers have volumes of their own (`chip8.volume`, `elec16.volume`), apart from the interface sounds' level.

## Settings dialog

![The settings dialog in the Tron theme, keyboard section](../screenshots/elecdex-settings.jpg)

| | |
| --- | --- |
| Where | Ctrl+Shift+.; *settings* in the status bar; a settings section from the action palette |
| Saves to | `settings.json`, at once, as you change something |

Its sections, in order:

| Section | What is in it |
| --- | --- |
| general | appearance (theme, themes folder, motion), sound, terminal (start folder, type size, ask before pasting several lines, bell), git (open files with), chip-8 (show the core, buzzer volume), elec-16 (buzzer volume, skin of a new pane), layouts (ask before switching layout), launcher (list installed applications), web panes (tint pages in the theme's colour, sign out of all sites) |
| window | The icon outside the window, minimising and closing to it, the system-wide show/hide shortcut, launching at sign-in and starting in the background. Shown only where the machine offers something ([Keyboard and layouts](keyboard.md#running-in-the-background)) |
| keyboard | Every shortcut, rebindable ([Keyboard and layouts](keyboard.md#rebinding-shortcuts)) |
| alerts | Earthquakes and tsunamis: source, alerts, thresholds, system notification, alert sound |
| ai | AI providers, the system prompt, summaries, and the ELEC system's seats |
| plugins | Installed plugins, their permissions and settings ([Plugins](plugins-use.md)) |
| updates | The version, the daily check, *check now* ([Updates](#updates)) |

The *settings.json* button at the top of the dialog opens the file. Escape closes the dialog.

## settings.json

Everything in the settings dialog is saved at once to `settings.json` in the app's data folder ([Where the files are](#where-the-files-are)), which can also be edited by hand while the app runs: main watches the file and applies the result. A file that does not parse is left where it is (the defaults apply until it is fixed), and is copied to `settings.json.bak` before a change from the app replaces it.

Every field has a default, so an empty or partial file is valid. An example:

```json
{
  "theme": "amber",
  "sound": { "enabled": true, "volume": 0.5 },
  "motion": "system",
  "terminal": { "startDirectory": "~/work" },
  "keybindings": { "app.quit": null },
  "window": { "minimizeToTray": false, "closeToTray": true, "globalShortcut": true, "startInBackground": false },
  "updates": { "check": true },
  "layout": { "confirmSwitch": true },
  "web": { "tint": false },
  "quakes": { "source": "auto", "notify": true, "minIntensity": "5-", "minMagnitude": 6, "tsunami": true, "system": true, "sound": true },
  "reminders": { "notify": true, "system": true, "sound": true, "snoozeMinutes": 10, "leadMinutes": 0 }
}
```

The keys and their defaults (from `src/shared/settings.ts`):

| Key | Default | Values and meaning |
| --- | --- | --- |
| `version` | `1` | The file's format |
| `theme` | `"tron"` | A theme id ([Themes](#themes)) |
| `sound.enabled` | `true` | Interface sounds |
| `sound.volume` | `0.5` | 0 to 1 |
| `motion` | `"system"` | `system`, `full`, `reduced` |
| `terminal.startDirectory` | `""` | The folder a new shell starts in; empty for home, `~` stands for home at the start. A folder that does not exist (or a network share) starts the shell at home instead |
| `terminal.fontSize` | `13` | The shells' type size in pixels, 8 to 32 |
| `terminal.confirmPaste` | `true` | Ask before pasting text of more than one line (each line break would run a command) |
| `terminal.bell` | `"both"` | `both`, `flash`, `sound`, `off` |
| `launcher.showSystem` | `true` | List the platform's own applications |
| `launcher.items` | `[]` | Launcher entries added by hand (`name`, `target`, optional `args`; up to 200); edited in this file only |
| `keybindings` | `{}` | Shortcut overrides: action id → chord, or `null` for none ([Keyboard and layouts](keyboard.md#rebinding-shortcuts)) |
| `window.trayIcon` | `false` | Show the icon outside the window |
| `window.minimizeToTray` | `false` | Minimising hides the window to the notification area |
| `window.closeToTray` | `false` | Closing the window hides it there, and elecdex keeps running |
| `window.globalShortcut` | `false` | The show/hide shortcut works from every app |
| `window.startInBackground` | `false` | Launched at sign-in, elecdex starts hidden |
| `layout.confirmSwitch` | `true` | Ask before applying a saved layout while shells are open |
| `web.tint` | `false` | Draw web pages in the theme's accent |
| `updates.check` | `true` | Ask GitHub once a day for a newer release |
| `quakes.source` | `"auto"` | `auto` (Japan when the system is set up for it), `jma`, `usgs` |
| `quakes.notify` | `false` | Earthquake alerts; while on, the source is checked every minute whether or not a quakes pane is open |
| `quakes.minIntensity` | `"5-"` | Japan: the weakest maximum intensity announced (`1` … `7`) |
| `quakes.minMagnitude` | `6` | The world: the smallest magnitude announced (4.5 to 9) |
| `quakes.tsunami` | `true` | Tsunami warnings, watches and advisories, whatever the earthquake thresholds |
| `quakes.system` | `true` | Also a system notification when the window is not in front |
| `quakes.sound` | `true` | An alert sound, with interface sounds on |
| `reminders.notify` | `true` | Task reminders |
| `reminders.system` | `true` | Also a system notification when the window is not in front |
| `reminders.sound` | `true` | A sound, with interface sounds on |
| `reminders.snoozeMinutes` | `10` | How long *snooze* puts a task off for, 1 to 1440 |
| `reminders.leadMinutes` | `0` | Announce this many minutes before the deadline, 0 to 1440 |
| `ai.providers` | `[]` | The AI providers you listed; no key is kept here |
| `ai.systemPrompt` | `""` | Sent ahead of every conversation |
| `ai.compact` | `false` | Ask the model for a summary when a conversation outgrows a provider's window |
| `agents.sources` | `["claude-code"]` | Whose records the AI AGENT pane reads |
| `git.openCommand` | `""` | How the git pane opens a double-clicked file (`{file}`, `{line}`, `{dir}` filled in; run as a program, never through a shell); empty for the system's application. Set in this file only |
| `logWatch.keepLines` | `5000` | Lines kept to scroll back: 1000, 5000, 20000 or 50000 |
| `logWatch.initialLines` | `500` | Lines read from the end when a pane opens a file: 100, 500 or 2000 |
| `chip8.core` | `true` | A new CHIP-8 pane shows its CORE view |
| `chip8.volume` | `0.5` | The CHIP-8 buzzer, 0 to 1 |
| `elec16.volume` | `0.5` | The ELEC-16 buzzer, 0 to 1 |
| `elec16.skin` | `"elec"` | The skin a new ELEC-16 pane is drawn in |
| `elec16.link.on` | `true` | LINK as a whole |
| `elec16.link.ai.on` | `false` | LINK's AI service |
| `elec16.link.ai.provider` | `""` | The AI provider LINK uses |
| `elec16.link.cart.on` | `true` | LINK's CART service |
| `elec` | — | The ELEC system's seats, standpoints, rule (default `majority`) and rounds (default 1) |
| `plugins` | `{}` | Per plugin id: whether it is on, what you agreed it may do, its setting values ([Plugins](plugins-use.md)) |

- A slip in a hand edit of some groups (the ELEC system, LINK, the ELEC-16 and CHIP-8 values, the terminal's newer fields) costs only that value, which falls back to its default.
- AI API keys are not in this file: they are encrypted by the operating system into `ai-keys.json`, so `settings.json` can be copied to another machine.

## Where the files are

The app's data folder is Electron's userData folder for the app name `elecdex`:

| OS | Folder |
| --- | --- |
| Windows | `%APPDATA%\elecdex` (usually `C:\Users\<you>\AppData\Roaming\elecdex`) |
| macOS | `~/Library/Application Support/elecdex` |
| Linux | `$XDG_CONFIG_HOME/elecdex`, usually `~/.config/elecdex` |

The macOS and Linux paths follow Electron's defaults; they are not sufficiently verified by hand.

What is in it:

| File or folder | What it holds |
| --- | --- |
| `settings.json` (`settings.json.bak`) | The settings |
| `themes/` | Your own themes |
| `layout.json` (`layout.json.bak`) | The live layout |
| `layouts.json` (`layouts.json.bak`) | The saved layouts |
| `plugins/`, `plugin-data/` | Plugins and what each stores ([Plugins](plugins-use.md#where-the-files-go)) |
| `notes.json`, `tasks.json`, `alarms.json` | The notes, tasks and alarms panes' data |
| `snippets.json` | The clipboard pane's snippets |
| `ai-keys.json` | AI API keys, encrypted by the operating system |
| `chats/`, `elec/` | AI conversations and ELEC system deliberations |
| `git-repos.json`, `log-files.json` | The repositories and log files chosen in the git and LOG WATCH panes, known by id |
| `awake.json` | The utility pane's AWAKE hold |
| `feeds-cache.json` | The last RSS headlines per feed |
| `Partitions/web` | The web panes' cookies and site data, until *sign out of all sites* |

## Layout files

| File | What it holds |
| --- | --- |
| `layout.json` | The one live arrangement |
| `layouts.json` | The saved layouts by name, plus the id of the one being worked in |

- The layout lives in `layout.json` beside `settings.json`: the one live arrangement, validated on load when edited by hand, and moved aside to `layout.json.bak` rather than discarded when it cannot be read.
- The saved layouts live in `layouts.json`, which holds each one by name plus the id of the one being worked in. It carries nothing that belongs to this machine (a terminal's session id is stripped on the way in), so **the file can be copied to another computer as it is**. It does keep each web pane's last page, the video a YouTube pane was on among them. A new shell never rewrites it.
- One entry that cannot be read is dropped on its own, leaving the rest; a file that cannot be read at all is moved aside to `layouts.json.bak`.

```json
{
  "version": 1,
  "active": "k3f9d1ab",
  "items": [
    { "id": "k3f9d1ab", "name": "work", "tree": { "version": 1, "root": { "kind": "pane", "id": "p1", "widget": "terminal" } } }
  ]
}
```

How saved layouts and presets behave: [Keyboard and layouts](keyboard.md#saved-layouts).

## Updates

| | |
| --- | --- |
| Where | *Settings → Updates* |
| Reads | The [GitHub Releases API](https://docs.github.com/rest/releases/releases#get-the-latest-release): the latest published release |
| Updates | 15 seconds after start, then once a day, while the setting is on; *check now* runs one at any time |
| Settings | `updates.check` (default `true`) |
| Privacy | One request for the latest release; nothing is downloaded or installed |

- A newer release shows a notice; *open release page* opens it in the browser. You install it yourself.
- The check ignores pre-releases: a release is announced only once it has been promoted from pre-release.
- More on what elecdex connects to: [Network access and data sources](data-sources.md).

See also: [Keyboard and layouts](keyboard.md) · [Plugins](plugins-use.md) · [Develop](develop.md)
