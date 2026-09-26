<p align="center">
  <img src="./public/elecdex_repo_card.svg" width="800" alt="elecdex - Sci-fi terminal and system monitor, rebuilt">
</p>

[![CI](https://github.com/kurouna/elecdex/actions/workflows/ci.yml/badge.svg)](https://github.com/kurouna/elecdex/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/kurouna/elecdex?include_prereleases)](https://github.com/kurouna/elecdex/releases)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Zenn](https://img.shields.io/badge/Zenn-kurouna-blue)](https://zenn.dev/kurouna)
[![X](https://img.shields.io/badge/X-elecxzy-black)](https://x.com/elecxzy)

**English** | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

# elecdex

A science-fiction desktop terminal emulator and system monitor — a ground-up rewrite of
[eDEX-UI](https://github.com/GitSquared/edex-ui) (archived in 2021) on a current, secure stack,
for Windows, macOS and Linux.

<p align="center">
  <img src="./docs/screenshots/elecdex-tron.jpg" alt="elecdex with the Tron theme: system monitors on the left, three shell tabs with the launcher and file browser in the middle, and the world view, markets, weather and calendar on the right">
</p>

> **v0.0.16 — pre-release.** Everything below works today; builds are unsigned. What is marked
> *unreleased* is on `main` and arrives with the next release.
>
> **Developed and used on Windows.** macOS and Linux are built for every release, but they have
> only been run by the automated end-to-end tests on GitHub Actions - nobody has used them by hand
> for any length of time, so **macOS and Linux are not sufficiently verified**. Expect rough edges
> there, and please [report](https://github.com/kurouna/elecdex/issues) what you find.
>
> Design notes and every decision with its reason: [docs/architecture.md](docs/architecture.md).

## Features

The panes are arranged by what you are doing: six **layout presets** put the right ones on
screen at a key each - **Ctrl+Shift+F1** to **F6** - and every one keeps the system column on the
left, so a switch changes the stage and leaves the instruments where they were. The
features below are grouped by the preset that shows them, and each picture is that preset in a
different theme.

### standard — this machine, its shells and the world outside

The arrangement elecdex opens with, in the picture at the top (Tron).

- **Terminal** — real shells (PowerShell, bash, zsh, fish) in unlimited tabs and splits. Shell
  integration reports the working directory and exit codes, on Windows too, and a session keeps
  its scrollback when its pane is moved or reloaded. The shell has focus at start; selecting text
  copies it and a right-click pastes. Ctrl+Shift+F finds text in the scrollback, and a URL the
  shell prints opens in your browser.
- **System monitor** — clock with time zone, system strip with a battery gauge, per-core CPU (as
  graphs or bars), memory and swap over time, disks with read/write activity, top processes,
  network status and traffic. The default layout idles at about 13% of one core.
- **Files and apps** — a file browser that follows the shell (click to `cd` or insert a path),
  and a launcher for the Start Menu (Store and other packaged apps included), `/Applications` or
  `.desktop` entries plus your own, most used first.
- **Weather, markets and calendar** — forecasts for anywhere (JMA in Japan, the National Weather
  Service in the United States, MET Norway elsewhere), a market board from Yahoo Finance, and a
  month calendar with optional Japanese holidays.

### network — who this machine talks to

<p align="center">
  <img src="./docs/screenshots/elecdex-network.jpg" alt="The network preset in the Amber theme: the system column on the left, the world view globe in amber with arcs to where connections go, the connections pane beside it listing sockets by program - firefox, code, elecdex, thunderbird, curl, ssh, syncthing - and a wide shell below">
  <br><sub>network · Amber</sub>
</p>

- **World view and connections** — a globe of where the machine's connections go, and a pane
  listing every TCP socket by the program holding it, both placed with a bundled GeoIP database;
  nothing is looked up online. The shells beneath the globe are there for ping and traceroute.
- **Wi-Fi** — over the socket table, where the wireless link is failing, segment by segment
  (see *Panes*).

### earth — overhead and underfoot

<p align="center">
  <img src="./docs/screenshots/elecdex-earth.jpg" alt="The earth preset in the Tron theme: an ORBIT pane with the world map, time zone lines and nine cities' clocks, the ISS with its ground track, Tiangong, the Starlink satellites as faint dots and the card of one of them; beside it the world view, a quakes pane listing recent earthquakes in Japan, and the weather; a shell below the map">
  <br><sub>earth · Tron</sub>
</p>

- **Orbit** — mission control's front screen: a world map with the night side, the
  lines where clocks change and the hour each zone keeps, the ISS and Tiangong where they are now
  with their ground tracks, the next pass over a city you choose, and the world's clocks around
  mission control's GMT day-of-year clock. The Starlink constellation on request.
- **Earthquakes and tsunamis** — for Japan (JMA) or the world (USGS and NOAA): alerts at the
  intensity or magnitude you choose (off by default), tsunami warnings kept in sight while in
  effect, a quakes pane listing recent earthquakes, and their epicentres marked on the globe.

### dev — agents at work, and the repository they change

<p align="center">
  <img src="./docs/screenshots/elecdex-dev.jpg" alt="The dev preset in the Phosphor theme: an AI AGENT pane with two Claude Code sessions, one busy with a subagent at work and the tests running in the background, and its changed files; two shell tabs under it; a GIT pane on the right with the same checkout, the diff of passes.ts, and the commit graph with the card of a commit the pointer rests on">
  <br><sub>dev · Phosphor</sub>
</p>

- **AI Agent** *(experimental)* — the Claude Code sessions at work on your computer: what
  each is doing this moment, how much it carries, its subagents and background tasks, and a diff
  of every file it changed, read from Claude Code's own records on this machine.
- **Git** — a repository you choose, read only: the files changed, the diff of
  each with its syntax coloured, and the commit graph with its branches and tags, kept current as
  they change - watch an AI agent work in the next pane. One pane per repository.

### media — watch, scroll, and see the sound

<p align="center">
  <img src="./docs/screenshots/elecdex-media.jpg" alt="The media preset in the White theme: a YouTube (TV) pane and an X pane, each showing a stand-in page made for the screenshot in the manner of a television video home and a social timeline, with made-up channels and accounts, and an RSS tab behind X; under the television a 16-band spectrum in fluorescent cyan and a mixer with master, Music Player and Web Browser strips">
  <br><sub>media · White — the web panes show stand-in pages made for the picture</sub>
</p>

- **Web panes** — a browser, YouTube and X in panes you add when you want them, drawn in the
  theme's colour (or their own, by a setting) and sharing one sign-in per site.
- **Spectrum and mixer** — a spectrum analyser of what the computer is playing, drawn like a
  1990s car stereo's display (fluorescent cyan or amber, LED, or the theme's colour), and a mixer
  for the system volume and each app playing sound.
- **RSS** — headlines from the RSS and Atom feeds you list, newest first.

### desk — writing, counting and keeping time

<p align="center">
  <img src="./docs/screenshots/elecdex-desk.jpg" alt="The desk preset in the Business (Light) theme: a notes pane with a release checklist, a timer and a calculator under it, a tasks pane with deadlines drawn as meters under today, tomorrow and later, and a three-month calendar">
  <br><sub>desk · Business (Light)</sub>
</p>

- **Desk panes** — a calculator you type into (full-width digits and 3百万 read as typed, with a
  tape and a tally for a pasted column of numbers), plain notes that save themselves, tasks whose
  deadlines are drawn as meters and announced whether or not their pane is open, and a timer with
  a stopwatch whose laps stack up like a spectrum, countdowns that run beside it, and alarms for
  the times the day is built around. *Unreleased:* a clipboard history, beside the calendar, of
  what you copy while it is on screen, to put back with a click.

### Talking to models

<p align="center">
  <img src="./docs/screenshots/elecdex-aichat.jpg" alt="The Business (Dark) theme with an AI chat pane under the terminal: a question about watching a folder in Node.js answered with a code block and its token counts, and a second answer arriving, its heading reading RX with the seconds and characters so far">
  <br><sub>AI chat · Business (Dark)</sub>
</p>

- **AI chat** — talk to a language model you run yourself (Ollama, LM Studio, llama.cpp - anything
  that speaks the OpenAI chat API) or to a service you have an API key for (Anthropic, OpenAI,
  Gemini, OpenRouter). Answers stream in with their reasoning folded away, keys are encrypted by
  the operating system and never reach the page, and conversations stay on your computer.

<p align="center">
  <img src="./docs/screenshots/elecdex-elec.jpg" alt="The Tron theme with an ELEC system pane filling the middle column: three plates of one size in a triangle around a hexagonal core, LOGOS and PATHOS lit green with APPROVE and ETHOS, outvoted with REJECT, stepped back in dim red, the resolution strip reading APPROVED 2-1-0-0, and the three statements below">
  <br><sub>ELEC system · Tron</sub>
</p>

- **ELEC system** — put a yes-or-no motion to a council of three models, after the
  MAGI of *Neon Genesis Evangelion*: LOGOS (logic), ETHOS (ethics) and PATHOS (feeling) each
  judge it from their own standpoint and vote APPROVE, REJECT or ABSTAIN, and the pane resolves it
  by majority or unanimity. The seats use the providers of the AI chat - the same model in all
  three will do.

### Layouts, looks and the rest

<p align="center">
  <img src="./docs/screenshots/elecdex-layouts.jpg" alt="The layouts dialog over the standard layout in the Tron theme: the six presets as saved layouts numbered 1 to 6, each with a thumbnail of its arrangement, and below them the shelf of presets with their thumbnails, where each stands, and their keys Ctrl+Shift+F1 to F6">
  <br><sub>Layouts (Ctrl+Shift+G) · Tron</sub>
</p>

- **Layout** — every pane can be moved by dragging its title, closed, split, tabbed, resized and
  brought back; the layout is saved and can be reset. An arrangement can be kept by name and
  returned to later (Ctrl+Shift+G, or *layouts* in the status bar), or started from one of the six
  presets.
- **Look and feel** — six themes that switch live: Tron, Amber, Phosphor and White for the HUD,
  and Business (Dark) and Business (Light) in Windows 11 colours, system fonts and full-colour
  icons for an ordinary working day - every one of them is in a picture above. A CRT power-on boot
  sequence after a Linux-style boot log of
  this machine's real facts (a pane added later powers on the same way; a closed one powers off
  and the panes beside it extend into its room; switching to a saved layout powers the whole
  screen off and brings the next one up pane by pane; dialogs and notices power off too), scanlines and glow,
  synthesised interface sounds, a themed title bar and a status bar that slides in from the bottom edge. Short
  entrance effects - a wave of dates for each month, a forecast rising in, new headlines and
  earthquakes sliding in with a three-second highlight - follow the motion setting: with motion
  reduced (or the system's reduce-motion setting), nothing moves.
- **Settings** — a settings dialog for theme, motion, sound, the terminal's start folder, saved
  layouts, the launcher, rebindable keyboard shortcuts and the update check, all saved to a
  hand-editable `settings.json`.

<p align="center">
  <img src="./docs/screenshots/elecdex-settings.jpg" alt="The settings dialog in the Tron theme, keyboard section">
  <br><sub>Settings → Keyboard · Tron</sub>
</p>

- **Plugins** — a pane of your own from one TypeScript file, run in a sandboxed worker with only
  the permissions you grant it ([Plugins](#plugins)).
- **Running in the background** — an icon in the notification area, the menu bar or the tray; a
  system-wide show/hide shortcut; and launching when you sign in. What is offered is what the
  machine can actually do, so it differs: Windows adds minimising and closing to the notification
  area, macOS leaves those to the Dock (closing the window already keeps elecdex running) and its
  login item cannot start hidden, and on Linux the tray and the shortcut depend on the desktop —
  a session that has neither says so instead of showing a switch that does nothing. All off until
  turned on in *Settings → Window*.

## Install

Download the installer for your platform from
[Releases](https://github.com/kurouna/elecdex/releases):

| Platform | File |
| --- | --- |
| Windows x64 / arm64 | `elecdex-win-x64-<version>.exe` / `elecdex-win-arm64-<version>.exe` |
| macOS Apple silicon / Intel | `elecdex-mac-arm64-<version>.dmg` / `elecdex-mac-x64-<version>.dmg` |
| Linux x64 | `elecdex-linux-x86_64-<version>.AppImage` or `elecdex-linux-amd64-<version>.deb` |
| Linux arm64 | `elecdex-linux-arm64-<version>.AppImage` or `elecdex-linux-arm64-<version>.deb` |

The Windows builds are the ones the author runs. The macOS and Linux builds come out of the same
release workflow and pass the end-to-end tests on GitHub's runners, but have had no hands-on
testing: treat them as not sufficiently verified.

### If a warning appears

The installers are not code-signed: a certificate costs more than a personal project can carry. So
Windows and macOS warn before the first run. The warnings mean the publisher is unknown to them, not that
anything was found in the file. If you want to check a download first, the release page lists every
file's SHA-256 checksum. Each installer is built from the tagged source by the
[release workflow](.github/workflows/release.yml) on GitHub's runners. These steps are needed once
per install.

**Windows**

1. The browser may hold the download back ("isn't commonly downloaded"). In Edge, open the download's
   *⋯* menu → *Keep* → *Show more* → *Keep anyway*. In Chrome, choose *Keep*.
2. Run the `.exe`. SmartScreen shows **"Windows protected your PC"**: click **More info**, then
   **Run anyway**.
3. The installer installs for your user only, so it asks for no administrator rights.

If Windows says the file was blocked and offers no *Run anyway*, right-click the `.exe` →
*Properties* → tick **Unblock** → *OK*, and run it again.

**macOS** (15 Sequoia and later; older versions in the last step)

1. Open the `.dmg` and drag **elecdex** into *Applications*.
2. Open elecdex from *Applications*. macOS says it **"could not verify 'elecdex' is free of
   malware"**: click **Done** (not *Move to Trash*).
3. Open **System Settings → Privacy & Security**, scroll to *Security*, and click **Open Anyway**
   beside the line about elecdex. Confirm with your password or Touch ID, then **Open Anyway** again.
4. On macOS 14 or earlier, right-click the app → **Open** → **Open** does the same.

If macOS instead says **"elecdex is damaged and can't be opened"**, the file is not damaged. The
quarantine mark from the download is what stops it. Remove the mark and open the app again:

```bash
xattr -dr com.apple.quarantine /Applications/elecdex.app
```

**Linux** (no warning, but two things to know)

- **deb** (Debian, Ubuntu): `sudo apt install ./elecdex-linux-amd64-<version>.deb`. It also installs
  the AppArmor profile that Ubuntu 24.04 and later need before Electron's sandbox can start.
- **AppImage**: `chmod +x elecdex-linux-*.AppImage` and run it. It needs FUSE 2 (`libfuse2`, or
  `libfuse2t64` on Ubuntu 24.04). On Ubuntu 24.04 and later it may stop with a message about the
  *SUID sandbox helper*, because AppArmor blocks the sandbox there. Use the deb in that case. Do not
  start it with `--no-sandbox`: the sandbox is what keeps the renderer away from your files.

elecdex starts fullscreen. **F11** leaves fullscreen and **Ctrl+Shift+Q** quits; `--windowed`
starts in a window and `--no-intro` skips the boot sequence.

## Keyboard

| Shortcut | Action |
| --- | --- |
| Ctrl+Shift+E | split the focused pane (a tab: its whole group) to the right |
| Ctrl+Shift+O | split the focused pane (a tab: its whole group) downward |
| Ctrl+Shift+T | new tab beside the focused pane |
| Ctrl+Shift+W | close the focused pane (or its × button, shown on hover) |
| Ctrl+Shift+Z | bring the focused pane forward over the workspace, and put it back (Escape too) |
| Ctrl+Shift+[ / ] | move focus between panes |
| Ctrl+Shift+← / → | previous / next tab in the focused tab group, such as the shell's tabs |
| Ctrl+Alt+Shift+← / → | from a shell: previous / next shell pane (or group of shell tabs) |
| Ctrl+Shift+A | add a pane: any widget, right of, below or as a tab beside the focused pane |
| Ctrl+Shift+Backspace | reset to the default layout |
| Ctrl+Shift+G | saved layouts: keep this arrangement by name, or go back to one |
| Ctrl+Shift+1 … 9 | apply the first nine saved layouts, in the order the dialog lists them |
| Ctrl+Shift+F1 … F6 | go to a preset: standard, network, earth, dev, media, desk |
| Ctrl+Shift+L | search the launcher (pops one up over the workspace if the layout has none) |
| Ctrl+Shift+S | focus the shell in its selected tab (adds a shell pane if there is none) |
| Ctrl+Shift+F | find in the shell's scrollback (Enter / Shift+Enter for next and previous, Escape closes) |
| Ctrl+Shift+. | settings |
| F11 | toggle fullscreen |
| Ctrl+Shift+M | minimize the window (Windows, Linux) |
| Ctrl+Shift+Q | quit (also when closing only hides elecdex to the notification area) |
| Ctrl+Alt+Shift+E | show or hide elecdex from any app (not in a Wayland session; off until turned on in *Settings → Window*) |
| Arrow keys on a divider | resize (Shift for larger steps) |

The shell has focus when elecdex starts. In a shell, selecting text copies it and a right-click
pastes, as in PuTTY or Windows Terminal; Ctrl+C stays the shell's interrupt. A match the search
bar moves to is not copied - only what you select yourself is. Outside a tab group
Ctrl+Shift+← / → still reach the shell, where PSReadLine selects by word.

The system-wide show/hide shortcut is set beside its switch in *Settings → Window*; it takes
letters, digits and function keys only, and if another app already holds the keys it is turned
back off with a note. It is left alone by *reset all shortcuts*, and gives its keys up while a
shortcut is being recorded, so it can be recorded too. While it is on, an app shortcut with the
same keys is flagged in *Settings → Keyboard*: the OS hands the keys to elecdex's window
shortcut first. With elecdex in front it puts elecdex away; anywhere else it brings elecdex
to the front.

*Settings → Window* also has the icon outside the window — in the notification area, the menu bar
or the tray — where a click opens elecdex and the right-click menu opens the settings or quits, and
*launch elecdex when you sign in*, which the settings show as turned off again if the system has
turned it off. What else is there depends on the machine, and elecdex offers only what it can
actually do:

| | Windows | macOS | Linux |
| --- | --- | --- | --- |
| minimise / close to the icon | yes | no — closing the window already leaves elecdex running, and it comes back from the Dock | when the desktop has somewhere to put an icon |
| system-wide show/hide shortcut | yes | yes | on X11; a Wayland session keeps those keys to itself, so the option says so instead |
| launch when you sign in | Run-key entry, removed by the uninstaller | the app's login item (macOS may ask you to allow it) | `~/.config/autostart/elecdex.desktop` |
| *start in the background* | yes | no — the login item takes no arguments | yes |

Whatever happens, starting elecdex again brings the running one back, so the window is never out of
reach.

Every other shortcut except the divider keys can be rebound in *Settings → Keyboard*: click one and
press the new keys. A shortcut needs Ctrl (Cmd on macOS), Alt or a function key, so every other
key still reaches the shell, and a chord already in use is flagged. The status bar (move the
pointer to the bottom edge) has a numbered button per saved layout at the left — the number is the
key that applies it — and buttons for adding a pane, saved layouts, resetting the layout, settings,
theme, sound and exit. In fullscreen on Windows and Linux, moving the pointer into the top-right corner
brings down minimize, leave-fullscreen and close buttons; close puts elecdex in the notification
area when it is set to keep running there, and otherwise quits after asking.

To move a pane, drag it by its title (a pane without one, such as the clock, by the rule along its
top) and drop it on another pane: it goes in beside that pane, on the side nearest the pointer. Hold
Ctrl (Cmd on macOS) while dropping to add it to that pane as a tab instead, in the place along the
strip your pointer picks — and over the group a tab is already in, that same Ctrl reorders it. A
shell tab drags out on its own, and a tab group's header moves the whole group. Escape cancels. A
moved shell keeps its session.

A pane you want a better look at can be brought forward: **Ctrl+Shift+Z**, the ⤢ button beside its
× in the top-right corner (a tab group has the same corner, whose × closes every tab in it; a tab's
own × closes just that tab), and it covers most of the window over the other panes, which keep
their place behind a shade. Panes that gain nothing from the room are left out of it: the system
strip and the network status have no ⤢ at all, and the calculator, timer, mixer, disk and process
list come forward as a panel in the middle rather than over the whole window. It is framed while
it is forward - the shell's notched border a size up, with corner brackets - just outside its own
edges, so it keeps all the room it was given. Escape, the shortcut again, the button or a click on the shade puts it
back. A tab comes forward with its group, so its other tabs are still there to switch to. Nothing
is rearranged and nothing is saved: a shell keeps its session and a web pane its page, and the app
starts with every pane in its place.

An arrangement worth keeping can be saved by name — **Ctrl+Shift+G**, or *layouts* in the status
bar — and returned to later; the first nine are on Ctrl+Shift+1 to 9, and on the numbered buttons
at the left of the status bar. A layout follows the work: the one you are in is marked, and
whatever you do to the workspace is kept in it, so coming back finds it as you left it. Resetting
the layout leaves all of them, and what you arrange after that belongs to none until you save it or
apply one. In the dialog a layout can be renamed, and moved up or down — its place in the list *is*
its number key. Up to twelve are kept.

Applying a layout replaces the workspace, which ends the shells of the panes it replaces, exactly as
closing those panes would; while shells are open you are asked first, and the question carries the
way to stop asking (*Settings → General → Layouts*). The old arrangement powers
off like a tube and the new one comes up pane by pane, as at boot — and not at all with motion
reduced.

Six **presets** sit under the list, each drawn as a small map of its panes:
**standard** (the default layout), **network** (the globe and shells, beside Wi-Fi and connections), **earth**
(ORBIT, the globe, quakes and the weather), **dev** (AI AGENT, shells and GIT), **media**
(YouTube (TV) with the spectrum and mixer beneath, X and RSS as tabs) and **desk** (notes, a timer,
the calculator, tasks and the calendar, and - *unreleased* - the clipboard). Every one keeps the system column on the left, so a switch
changes the stage and leaves the instruments where they were. Choosing a preset adds a layout made
from it and goes there - from then on it is one of your layouts, following your work - and choosing
it again goes back to that layout rather than adding another; ↺ puts it back to the preset. Each
preset has a key of its own, Ctrl+Shift+F1 to F6, which does the same from anywhere. A new
install starts with all six on Ctrl+Shift+1 to 6; an existing list is never added to.

They are kept in one file that holds nothing belonging to this machine: **copy `layouts.json` to
another computer and your arrangements come with you.** The dialog's *layouts.json* button shows it
in the file manager (details under [Themes and settings](#themes-and-settings)).

A tab group can hold any panes, not only shells, so a pane you need now and then can share a place
with the shells instead of taking room of its own - RSS or the weather behind the shell tabs, for
example. Put a pane in a group by Ctrl-dragging it onto the group as above, or focus a pane of the
group, open the picker (Ctrl+Shift+A or the status bar's add button) and choose **⧉ new tab**
before the widget. Clicking the tabs then switches between them; a shell in a background tab keeps
running, and its session and screen are there when you switch back. Groups do not nest: a tab
holds one pane.

*Unreleased:* **▣ pop up** in the same picker shows a widget over the workspace instead, framed
with only a ×, and leaves the layout as it was - it is not saved, and Escape, the × or a click
beside it puts it away. Every built-in pane can be popped up but the shell, the timer (a
countdown put away could not ring) and the file browser, and no web page or plugin; what you
choose in a popped-up pane is there when you pop it up again, until the app quits. Ctrl+Shift+L does
the same for the launcher when the layout has none, and the launcher goes once it has started
something.

## Panes

The default layout is arranged by what the panes are for — **left, this machine:** clock, system,
CPU, memory, disk, top processes, network status and traffic; **centre, work:** three shell tabs
over the launcher and the file browser; **right, the world outside:** world view, markets,
weather and calendar.

- **Terminal** — the pane is headed TERMINAL with the selected shell's full path; each tab is
  named after its folder (home too, by its own name), with parent folders added only when two tabs would read
  the same, and shows the shell and full path on hover. A shell that has exited says so on its
  tab, with its exit code. New shells start in the home folder, or in the folder set under *Settings → General →
  Terminal* ("~" for home; a folder that no longer exists falls back to home). **Ctrl+Shift+F**
  opens a search bar over the pane: matches are marked in the theme's colour and counted, Enter
  and Shift+Enter step through them. A URL the shell prints is a link, and opens in your browser.
- **System** — date and weekday, uptime, OS type, and power with a battery gauge (green, red below
  20%); the full OS version and architecture (as `uname` or `winver` would put it); the machine's
  maker, model and chassis. What cannot change while the app runs is read once, not polled.
- **CPU** — two graphs of the cores' average load, or a bar per logical core (toggle in the pane).
- **Memory** — the share in use and swap over the last minute, scrolling in step with the CPU
  graphs, with bars for the amounts now.
- **Disk** — each volume as a bar of used space against its size (amber from 90%, red from 97%),
  with space left, filesystem and whether it is removable or on the network; above them the read
  and write rates and how busy the disks are (not shown on macOS, which has no cheap reading).
- **Launcher** — the platform's applications plus your own entries, most used first. Type to
  filter, Enter to launch. Icons take the theme's accent and show their own colours on hover (always, in the Business themes); on
  Windows they are drawn by the Windows shell, and apps are named, as the Start Menu shows them -
  packaged apps without a shortcut (Teams, Outlook, Terminal) included. Add
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
- **Connections** — every TCP socket this machine holds, grouped by the program holding it: the
  local port, the peer, what the port is known for, and the country the peer is in. A switch
  shows the listening sockets instead - the doors this machine leaves open. A connection that
  opened and closed between two readings is still drawn once, struck through, so a short-lived
  one is not invisible. The table comes from the kernel (`GetExtendedTcpTable` on Windows,
  `/proc/net/tcp*` on Linux, `netstat` on macOS - which cannot name the owning process, and the
  pane says so), and the countries from the same bundled GeoIP database the world view uses.
  Nothing is ever looked up online. **MASK** hides the second half of every address, for a
  screenshot or a shared screen. A listening program says what it serves, told from
  its command line - `node` becomes `vite · my-app` - without the port being asked anything.
- **Wi-Fi** — where a wireless connection is failing, for a call that stutters or a train's Wi-Fi
  that keeps dropping. The path from this machine to the internet is measured a segment at a time
  (the radio's signal and retries, an echo to the gateway and one to the internet every second,
  and what the machine itself is sending) and the pane names the segment at fault with the figures
  it rests on: RADIO, LOCAL LINK, UPSTREAM, UPSTREAM LOST (the access point answers, the way beyond
  does not), OWN UPLOAD or SIGN-IN NEEDED, with an estimated call score (MOS). Below that are the
  radio (signal gauge, the bands with its channel and the DFS range, standard and PHY rates), a
  timeline of 1 to 60 minutes with a crosshair, the drops the system logged in the last day with
  their reasons (Windows), changes of access point, and the frame counters. **MASK** hides the
  network's name and the addresses; **COPY** puts a report of the last minutes on the clipboard.
  Every figure explains itself when the pointer rests on it - what it is, the limits it is judged
  by, and what it reads now - and a legend under the verdict says how to read the rest. Brought
  forward on a wide screen, the pane goes to two columns, with each segment's last minute drawn on
  the wire between its stations and the last day of connections as a bar over the log. With more
  than one wireless adapter, chips under the header choose the one followed, each with its own
  gateway echo and its own history.
  Nothing that needs your location is read, so there is no BSSID and no scan of the networks
  around. The echoes run only while the pane is on screen.
- **AI Agent** *(experimental)* — one card per running Claude Code session: its name and
  folder, whether it is busy, the last thing it did (the tool, and what on), the model, the tokens
  in its view and written, and its answers. Below them, the subagents it started and the commands
  it left running in the background: running, done, failed or stopped, with a running subagent's
  own last step; a finished one stays ten minutes. Open a card for the tools it has used and the files it
  has changed; a file opens as a diff against the copy Claude Code kept before the session first
  touched it (what a subagent changed is marked SUB, and has no such copy). Read from Claude Code's own folder (`~/.claude`, or `CLAUDE_CONFIG_DIR`) only
  while the pane is open, and only the part of a record written since the last look - a long record
  is read from its end, and its counts say *recent*. Nothing is sent anywhere. These records are
  Claude Code's and not documented, so a new version of it may change what can be shown - hence
  *experimental*. `agents.sources` in `settings.json` says whose records are read (so far
  `claude-code`).
- **Orbit** — positions are worked out on your computer (SGP4) from orbital
  elements the app downloads from CelesTrak: the stations twice a day, and the roughly 10,000
  Starlink satellites once a day and only while a pane shows them (**STARLINK**). The focused
  station's track runs one orbit back and two ahead, bright in sunlight and dim in the Earth's
  shadow, marked every ten minutes; the ring round it is the ground that can see it. Below the
  map: where it is, how high and how fast, when it next enters or leaves the Earth's shadow, and
  its next pass over the observer - visible to the eye or not. The observer is the pane's own,
  chosen from the bundled city list (by default the largest city in your time zone); no location
  is asked for. The thin lines across the map are where clocks differ today, and the ruler along
  its top gives each fifteen-degree zone its hour, midnight and noon lit.
- **Git** — **SELECT REPOSITORY** picks a folder; the pane watches that repository
  from then on and reads it again after each change (at most once a second, and never while
  nothing changes). The staged, unstaged, untracked and conflicted files, each with its lines
  added and removed; the diff of the file chosen, unified or side by side, with the changed words
  lit; the commit graph - the lines of the branches, the names on each commit (the branch checked
  out, other branches, remotes, tags), this branch with its upstream or **ALL** of them, a hundred
  commits at a time with **MORE** - where a click opens a commit's files and diff and a rest on one
  shows the whole of it: its message, author, date and what it changed. It only reads: stage and
  commit in the terminal. A double-click opens the file - with the command in `git.openCommand`
  in `settings.json` (`{file}` and `{line}` are filled in, e.g. `code -g "{file}:{line}"`),
  or with the system's own application when it is empty. git must be on PATH.
- **Markets** — indices, currencies and anything Yahoo Finance quotes, about once a minute, as
  sparklines, candlesticks or bars of the change (in the list's order, or sorted by it). The rows
  share the pane: two columns when it is wide, one line each when it is short, and candles across
  the whole row under the name. Click a symbol and its chart takes the whole pane - with a price
  axis, the time along the bottom, the range's high, low and base, and a readout of the bar under
  the pointer - until the arrow takes you back to the list. The strip above the board picks the
  range - 1D (5-minute bars), 5D (30-minute), 1M (hourly), 6M (daily), 1Y (weekly) or 5Y
  (monthly) - and the settings button edits the list, each symbol optionally followed by a label:
  `^N225 日経平均, JPY=X ドル円, 7203.T トヨタ`. 1D
  measures from the previous close, longer ranges from the close before the range began. Built-in
  names follow the app language (`--lang=en-US` forces English). Yahoo has no live TOPIX index, so
  the default board shows the CME yen TOPIX future (`TPY=F`).
- **Weather** — the settings button → PLACE opens a picker over a bundled list of large cities and
  capitals and JMA's forecast offices, or takes `lat, lon`. Japan uses JMA, the United States the
  National Weather Service (or MET Norway, by choice), everywhere else MET Norway. °C or °F, and
  the week forecast on or off, per pane; the default is New York City. A click on the forecast
  opens the source's own page for the place in the browser - JMA's forecast page, the NWS point
  forecast or yr.no.
- **AI chat** — not in the default layout: add it from the picker (Ctrl+Shift+A), as many as you
  like. First list a provider in *Settings -> AI*: pick a preset (Ollama, LM Studio, llama.cpp,
  Anthropic, OpenAI, Gemini, OpenRouter, or a custom address), adjust the address, and - for a
  hosted service - paste its API key (kept as you leave the field, like every other setting;
  **show** lets you look at what you typed before that, and a key that is held reads as dots -
  it is never shown again). **test** asks the provider for its models, which then
  complete the model field. In the pane, choose the provider and the model, type, and press Enter
  (Shift+Enter for a new line; Esc or **stop** ends an answer and keeps what was written). Answers
  are drawn as markdown with a copy button on every code block; a model's reasoning, where the
  provider shows it (Claude's summarized thinking, `reasoning_content`, or inline `<think>`), is
  folded under **reasoning**. While an answer is written its heading counts the seconds and the
  characters; once it lands it shows the tokens read and written and the tokens a second, where
  the provider reports them. Hover a message to **copy** it, **edit** an earlier question (which
  replaces it and what followed) or ask **again**. An answer that did not simply finish says how it
  ended - `STOPPED`, `TRUNCATED`, `DECLINED`, `LINK ERROR`, or `NO CARRIER` when nobody answered
  at the address - with the provider's own words beside it. **+ new** starts a new conversation and **log** lists
  the ones you have, newest first; point at one to export it as markdown or delete it. A
  conversation reopened goes on with the provider and model that answered it (by name, if the
  provider was removed and added again), and when nothing can be sent the pane says why. An empty pane shows where it
  points (`LINK STANDBY`, the provider and model, the address) and the model field shows
  `QUERYING` while a provider's list is read, or `NO LIST` with the reason when it cannot be.
  **A long conversation is fitted to the model's context window**: a local server answers with
  the few thousand tokens it was started with and silently drops the beginning of anything
  longer, system prompt first - so every provider has a *context window* in the settings
  (8192 tokens for an address on this computer or network until you type another, unlimited for
  a hosted service; for Ollama, type the context length it is set to). Up to three quarters of
  it is sent; past that the oldest messages stay behind - in one large step, not one a turn, so
  the server's prompt cache survives - and a `NOT SENT · n ABOVE` line in the log marks where the
  model's view begins. The conversation itself, and its export, stay whole. With *summarise
  what no longer fits* on (Settings -> AI; off by default) the model is first asked for a
  summary of what stays behind - one more request to the same provider and model each time the
  conversation is cut, shown as `TX · COMPACTING` - which is sent after the system prompt from
  then on; the line then reads `SUMMARISED · n ABOVE` and opens to show what the model was told.
  A summary that fails costs only the summary: the question is still asked. A conversation belongs to the app, not the pane: moving the pane
  or putting it behind a tab does not interrupt an answer, and closing it stops the request.
  Nothing is sent anywhere until you send a message (or press **test**, or open the model list);
  an optional system prompt in the settings goes ahead of every conversation. There are no tools:
  the model cannot read your files, run commands or browse.
- **ELEC system** — not in the default layout: add it from the picker. It asks the
  providers of *Settings -> AI*, so list one there first. **seats** chooses the provider and model
  of each unit - LOGOS, ETHOS, PATHOS - and **all** puts one seat's choice in all three; the same
  model in every seat is fine, since each unit is told its own standpoint (edit them under
  *Settings -> AI -> elec system · standpoints*). Type a motion that can be answered yes or no and
  press Enter. Each unit writes a short statement, in the motion's language, ending with a
  `VERDICT` line (APPROVE, REJECT or ABSTAIN) and a `CONFIDENCE`; the plates light as they vote
  (`TX`, `RX`, then the verdict) - the units sit powered off until a motion comes and power on one
  after another; while the council sits, light runs round the plates being asked and over a moving grid floor,
  and each piece of an answer runs down its spoke as it arrives, so a quick model streams and one
  thinking it over leaves its spoke dark (none of it with motion reduced); a console in the
  corner logs each step. The last vote puts the lights out, and a moment later the
  **resolution** powers on - the units that did not carry it step back - following the rule
  chosen in the bar:
  **majority** (two seats decide; otherwise `DEADLOCK`) or **unanimous** (all three approve; one
  rejection rejects; otherwise `NO CONSENSUS`). A vote that does not count - a link that failed
  (`LINK ERROR`, `NO CARRIER`) or an answer with no verdict (`NO VERDICT`) - is invalid, not an
  abstention, and fewer than two valid votes is `QUORUM NOT MET`. Confidence is shown, never
  counted. With **2 rounds** each unit then reads the others' first statements (cut to fit a small
  context window) and votes again - twice the requests - and a changed vote shows as
  `REJECT › APPROVE`. Units on one server of your computer or network are asked one after
  another, hosted services at once. Esc or **stop** ends a deliberation, keeping what was written;
  **again** puts the same motion to the council as it is seated now; **log** lists past
  deliberations with their resolutions, to reopen, export as markdown or delete. The seats, rule
  and rounds are settings, and a deliberation keeps the seats it was put to. Nothing is sent until
  you submit a motion (or open a model list).
- **RSS** — not in the default layout: add it from the picker (Ctrl+Shift+A). It starts empty and
  fetches nothing until its settings button lists feed URLs, one per line (RSS 2.0, RSS 1.0 or Atom, up to 10
  per pane). The newest 20 headlines across its feeds are shown, each with its feed and the time
  (today) or date (earlier), and the list scrolls when the pane is shorter. A click opens the
  article in the browser. Each feed is checked **every 15 minutes** while a pane lists it — less
  often only when the feed itself asks (Cache-Control, Expires or `<ttl>`), and never less than
  hourly — with conditional requests, so an unchanged feed is not downloaded again. A feed that
  fails keeps its last headlines and marks the pane STALE. Several panes listing the same feed
  share one request, and closing the last one stops it. A headline that arrives while the pane is
  open slides in at its place and is highlighted for three seconds; if the list is scrolled down,
  what is being read stays put and a "↑ n new" pill leads back up.
- **Quakes** — not in the default layout: add it from the picker. Recent earthquakes, newest
  first, from the source chosen in *Settings → Alerts*: **Japan** (the Japan Meteorological Agency:
  the maximum seismic intensity, shindo, amber from 3 and red from 5-, and distant earthquakes JMA
  reports) or **the world** (the USGS: magnitude 4.5 and up, amber from 5 and red from 6). Each row
  has the place, time, magnitude and depth, and opens the source's page. A tsunami warning, watch or
  advisory in effect shows as a strip above the list. The pane shows what alerts are set to, and its
  settings button opens them. A new earthquake slides in highlighted in its colour, with the same
  "↑ n new" pill as the RSS pane when the list is scrolled down. While the pane is open, or alerts are on, the source is checked
  **every minute** (conditionally, so an unchanged list costs no download); with neither, nothing is
  fetched. The world view then marks the day's earthquakes at their epicentres, sized by magnitude
  and coloured like the list, and an earthquake from the last hour pulses. **Not an earthquake early
  warning:** reports come a minute or more after the shaking, and the pane and alerts say so.
- **Earthquake and tsunami alerts** — *Settings → Alerts*, off by default. The source is automatic
  (Japan when the system time zone is Tokyo or the locale is ja-JP, the world otherwise) or chosen.
  When on, an earthquake at or above the chosen maximum intensity (Japan, default 5-, 5弱) or
  magnitude (world, default 6.0) shows a banner at the top of the screen with the place, intensity
  or magnitude and depth, updated as later reports arrive; a severe one stays until closed, a weaker
  one goes after a minute. A **tsunami** warning, watch or advisory (JMA's 大津波警報・津波警報・津波注意報
  for Japan, NOAA's Pacific and National Tsunami Warning Centers for the world; can be turned off)
  shows a card with its level, the areas with expected arrival and height, and the issuer's
  headline. Closing it folds it into a small tab while it is in effect, and when it is lifted the
  card says so. A raised level is announced again. An alert sound plays (with interface sounds on),
  and a system notification appears when elecdex is not in front; both can be turned off. Each
  earthquake is announced once, and only while recent (30 minutes for Japan, an hour for the world),
  so starting the app later does not announce old news.
- **Calculator** — not in the default layout: add it from the picker. A line you type into with
  the answer already showing beneath it, and everything answered so far on a tape you can take
  numbers back out of. Full-width digits, `×` `÷` and a magnitude after digits (`3百万`, `5千`) are
  read as typed, so an expression can be written without leaving the Japanese keyboard. There are
  constants for bytes, time, percentages and 万・億・兆, functions from `sqrt` to `gcd`, 32-bit bit
  operations, and `ans` for the answer before this one; `rate = 8 * percent` keeps a name in the
  register row for later lines. `0x` adds a 32-column bit map under the answer. `C` clears the
  line and, with nothing on it, the tape; `?` on an empty line shows everything the calculator
  knows, and ↑ walks back through what was typed. The **tally** mode
  summarises a pasted column of numbers - count, sum, mean, median, standard deviation, quartiles -
  with a histogram and a box plot, and does not mistake the parts of a date for numbers of their
  own. Nothing is evaluated as code: the expression parser is elecxzy's, vendored with its tests.
- **Notes** — not in the default layout: add it from the picker. Plain text with no markup and no
  rendering, saved half a second after you stop typing - the bar in the footer fills while the
  write is due and flashes when it lands, so a silent autosave is never something to wonder about.
  Notes are kept in `notes.json` under the app's userData, not in the layout, so they outlive the
  pane and two panes can show the same note (the second says *edited elsewhere* rather than
  overwriting what you are typing). The first line names the note; the title bar lists them all,
  each with a × to delete it (with an undo).
  **Ctrl+=** works out the expression the caret is in and writes the answer after it, leaving prose
  alone. *Save as .md…* and *delete* (with an undo) are under the settings button.
- **Tasks** — not in the default layout: add it from the picker. A list where each deadline is
  drawn as a meter of how much of the task's life has gone, amber as it runs out and red once it is
  past, with the nearest deadline counting down in the header. Typing `歯医者 明日 9:00`,
  `review fri 18:30` or `毎週 掃除` reads the date and the repeat out of the line - and shows what it
  understood before the task is added, so a misreading is caught there and then; a line it does not
  understand is left exactly as typed. A task is corrected where it is read: click its title to
  rename it, click its time to set a deadline in the same words (an empty line takes it off), and
  from the keyboard Delete removes the task and F2 renames it. Completed tasks are listed under
  DONE, which folds away when you want it to. Tasks are kept in `tasks.json`, and the reminder for the next
  deadline is scheduled by the app itself: it arrives with the pane closed, on another tab, or never
  opened, as a card in the corner with *done*, *snooze* and *open*, and as a system notification when
  elecdex is not in front. One timer waits for the next deadline of all - nothing is polled.
  Reminders are set under the pane's own settings button: on by default, with the snooze and how
  far ahead to warn.
- **Timer** — not in the default layout: add it from the picker. Three instruments in one pane.
  A stopwatch whose laps stand as
  bars that grow while they are being timed and lock with a flash when taken, fastest and slowest
  marked, with a held peak across the tallest; and **countdowns** - up to six, each with its own
  duration - that burn down a ladder of segments, one going out at a time, pulsing in the last ten
  seconds and saying so in a card when they land. The stopwatch and the countdowns are separate
  machines, as they are on a phone: starting one does not start the other, resetting one leaves the
  other alone, and a countdown goes on running (and still goes off) while the stopwatch is the mode
  on screen, which each mode says in its heading. A duration typed by hand goes through the
  calculator, so `90/2` is forty-five minutes. Everything is kept as wall-clock moments rather than
  a count of ticks, so a pane moved, a tab switched away from, a reload and a restart all leave a
  running timer exactly where it was; the readout shows tenths, which is what the shared 10 fps
  draw loop can honestly show, while laps are recorded to the millisecond. A countdown is built up
  by tapping `+1 +3 +5 +10 +25`, which add to what is set, and the field beside them sets an exact
  number of minutes.
  The third is **alarms**: a time of day with a label, on the days you choose, switched on and off
  from a list rather than made again each time - waking up, the start of lunch. They are kept in
  `alarms.json` and scheduled by the app, so one goes off with the pane closed or never opened, as
  a card that waits to be answered and (when elecdex is not in front) a system notification. A
  one-off switches itself off once it has rung; `07:30`, `7`, `19.5` and `１９：３０` are all read as
  times.
- **Clipboard** *(unreleased)* — in the desk preset, or add it from the picker ("clipboard
  history"). What you copy while the pane is on screen, newest first, with its size and how long
  ago, each tagged with what it is - TXT, URL, PATH, NUM, or CLR with a swatch - and RICH under
  that when it was copied with its formatting (HTML, or the RTF that Word and WordPad copy).
  Resting the pointer on one (or reaching it with the keyboard) opens a card with the whole of it,
  as the git pane does for a commit: its text, what came with it and when it was copied. Click one (or Enter) to put it back on the clipboard, formatting and all, and paste it
  wherever you like; ↑ ↓ move between entries and Delete or × takes one out. The same text copied
  again moves up rather than appearing twice, and a selection dragged in a shell - which copies at
  every step - is one entry. The clipboard is read four times a second, and only while a
  clipboard pane is on screen: behind another tab, with the window minimised or put away, or with
  **PAUSE** pressed, nothing is read, and what is copied then is not kept. A copy marked private the
  way password managers mark theirs (Windows' `ExcludeClipboardContentFromMonitorProcessing` and
  clipboard-history flags, macOS's concealed type, KDE's password hint) is never read, only
  counted. Up to 50 entries are kept in memory and are gone when elecdex quits - nothing is written
  to disk, and no plugin can reach them. **MASK** hides what they say, **CLEAR** (pressed twice)
  empties the list and the clipboard with it. Text only: an image or files on the clipboard are
  not kept. The pane learns of a copy by seeing the clipboard's text change, so the same text
  copied twice with nothing in between is one copy.
- **Calendar** — the month with today marked; ‹ › or the mouse wheel change month, and the dates
  sweep in the way it moved. Given room - a wide pane, or the pane brought forward with
  Ctrl+Shift+Z - the month before and the month after join it either side, dimmed, and the arrows
  move all three. The settings
  button ticks holiday calendars (Japan for now, computed locally), and the next holiday is named
  below the month.
- **Spectrum** — not in the default layout: add it from the picker. The system's sound output in
  7, 10, 16 or 31 bands, in columns of segments with held peaks; the settings button picks the style
  (VFD cyan, the default, VFD amber, LED or the theme), the band count, bars, a mirrored pattern
  or peaks only, and peak hold. It listens only while the pane is on screen - not in a background
  tab - and draws only while there is sound, 20 frames a second (about a third of a core while
  sound plays, a tenth while it is silent, on an i5-1335U). Capture runs in a hidden window of its own, and only
  the levels reach the pane; nothing is recorded. Tested on Windows; macOS should work through
  the same screen-capture route (with screen recording permission) but is untested. On Linux,
  where Electron has no loopback capture, `parec` (pulseaudio-utils, for PulseAudio or PipeWire)
  records the monitor of the default output instead. A monitor turned down in the system
  settings is compensated, so the bars show the sound as it plays; a muted one is reported with
  a button that unmutes it.
- **Browser, YouTube and X** — not in the default layout: add them from the picker. *Browser*
  has an address bar and opens any http(s) page; *YouTube (TV)* and *X* open their site, keep
  to it, and send links to other sites to your default browser. *YouTube (TV)* is YouTube's
  living-room interface, driven by the arrow keys; it is the YouTube pane offered, because it is
  the one that can be signed in - with the code it shows entered at yt.be/activate on a phone -
  while Google refuses to sign in from an embedded browser ("this browser or app may not be
  secure"). Each pane has back, forward, reload
  (home for the sites) and "open in your browser" buttons, and remembers its page across restarts.
  The page is drawn by a separate, sandboxed browser view over the pane: it has no access to
  elecdex, may not use the camera, microphone, location or notifications, and cannot download
  files. All web panes share one sign-in per site (sign in to YouTube once), kept apart from the
  rest of the app; *Settings → General → sign out of all sites* deletes it. Pages are shown in
  their own colours by default. The ◐ button on the right of the address draws one pane's pages in the
  theme's colour instead, as you watch; *Settings → General → tint pages in the theme's colour*
  is the default for panes that have not used their own button, and the Business themes never
  tint. While a dialog, a notice or a dragged pane
  is over it, a still picture stands in for the page. App shortcuts work while a page has the
  keyboard; every other key goes to the page. The status bar and the fullscreen window controls
  do not appear while the pointer is over a page (use the shortcuts, or move the pointer to
  another pane).
- **Mixer** — not in the default layout: add it from the picker. The output device's volume and
  mute, and on Windows and Linux each app playing sound, with faders, mute buttons and, on
  Windows, peak meters. macOS has the master volume only. Read while the pane is on screen: on
  Windows through one long-lived PowerShell, on macOS with AppleScript and on Linux with
  pactl (PulseAudio or PipeWire; pactl from PulseAudio 16 or later), or WirePlumber's wpctl for
  the master volume where pactl is missing.

## Plugins

A plugin adds a pane. It is a TypeScript or JavaScript file, or a folder with an `index.ts`, in the
`plugins` folder under the app's userData; edits load as you save, and `elecdex-plugin.d.ts` beside
them gives an editor the API's types. *Settings → Plugins → **install from a folder…*** copies one
in for you: pick the plugin's folder and elecdex takes the plugin out of it — the entry and what it
imports, and nothing else, so a README, a `package.json`, a `.git`, a `node_modules` and any test
beside the code stay where they are (a file under `tests/` the plugin does import comes with it:
what counts is whether the plugin reaches it, not what the folder is called) — under the folder's own name, asking first
if a plugin of that name is already there. What can be known without running it is checked before
anything is copied — that the code compiles, and that every import is a file that came with it — so
a folder that is not a plugin, or one that needs npm, is refused with the reason rather than failing
later; a folder that *holds* plugins is told apart from one that is one. *Open plugins folder* is
still there for putting one in by hand. A new plugins
folder comes with a **pomodoro timer** (`examples/plugins/pomodoro` in this repository): focus
sessions, short breaks and a long break every few rounds, with a VFD meter, a chime and a
notification when a phase ends, carrying on across restarts.

Plugins are off until turned on in *Settings → Plugins*, which lists what each may do - read
metric sources, reach named hosts (each request made by the app and checked against that list),
use its own sign-in session for a site, keep running with no pane open, notify - and asks before
the first run and again if a plugin later asks for more. A plugin runs in a Web Worker of its own,
with no access to the page, your files or the network, and draws only through blocks the app
renders in the theme (text, numbers, meters, charts, tables, lists, buttons). A plugin that stops
answering is stopped without holding up the app. The API and the rules are in
[docs/plugins.md](docs/plugins.md).

## Themes and settings

Everything in the settings dialog is saved at once to `settings.json` in the app's userData
folder, which can also be edited by hand while the app runs. A file that does not parse is left where it
is (the defaults apply until it is fixed), and is copied to `settings.json.bak` before a change
from the app replaces it:

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

To add a theme, drop a JSON file into the `themes` folder next to it (*Settings → General →
themes folder*). It appears straight away; one with a built-in's `id` replaces that theme. A file
that cannot be read is listed under the theme picker with the reason, rather than silently
missing from it.

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

Colours are `#rrggbb`; `status` (hues for danger / warn / ok / info), `fonts` and `text`
(`primary` and `muted` text colours; text is the accent without it), `mode` (`"light"` for a
light ground: darker status colours, and the terminal raises faint colours to 4.5:1) and
`effects.iconTint` (`false` shows launcher icons in their own colours) are optional.
The layout lives in `layout.json` beside them: the one live arrangement, validated on load when
edited by hand, and moved aside to `layout.json.bak` rather than discarded when it cannot be read.

The saved layouts live in `layouts.json`, which holds each one by name plus the id of the one being
worked in. It carries nothing that belongs to this machine — a terminal's session id is stripped on
the way in — so **the file can be copied to another computer as it is**, and a new shell never
rewrites it. One entry that cannot be read is dropped on its own, leaving the rest; a file
that cannot be read at all is moved aside to `layouts.json.bak`.

```json
{
  "version": 1,
  "active": "k3f9d1ab",
  "items": [
    { "id": "k3f9d1ab", "name": "work", "tree": { "version": 1, "root": { "kind": "pane", "id": "p1", "widget": "terminal" } } }
  ]
}
```

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
npm run dev -- -- --windowed --no-intro   # the second -- hands flags to Electron; npm start is the same
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

End-to-end tests never contact a real service, and never touch the machine they run on: weather,
markets and the update check are pointed at closed ports or local stubs (JMA's earthquake and
tsunami lists with the forecasts, and the USGS and NOAA feeds), RSS feeds, AI providers, plugin
hosts and the web panes' sites are served by a local server, and the sound, the notification-area
icon, the sign-in entry, the socket table and the encryption of API keys are stand-ins. The whole suite takes minutes; it is run in full before a
release, and a change runs the specs it can reach.

```
src/shared/     contracts shared by all processes (API types, IPC channel names, schemas, pure logic)
src/main/       app lifecycle, window, IPC handlers, pty, weather, markets, feeds, quakes, launcher,
                audio, plugins, web panes, reminders, running in the background, updates
src/preload/    the one and only contextBridge surface
src/renderer/   Svelte 5 UI: layout tree, widgets, the plugin host, dialogs, design tokens
src/services/   utilityProcess: the metrics collector
examples/       the sample plugin (pomodoro)
tests/          unit (vitest) · component (vitest + jsdom) · e2e (playwright _electron)
scripts/        asset generators (icon, banner, globe data, city list, README screenshots)
docs/           architecture.md (the design and the decision log, in Japanese), plugins.md,
                weather-providers.md
```

The rules a change must keep - the security boundary, where the network lives, what tests may
touch - are in [CLAUDE.md](CLAUDE.md).

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
| Weather, Japan | [Japan Meteorological Agency](https://www.jma.go.jp/) forecast JSON: `https://www.jma.go.jp/bosai/forecast/data/forecast/<office code>.json` | Read directly as JSON, not scraped from the web page. This is the data JMA's own [forecast page](https://www.jma.go.jp/bosai/forecast/) loads, not a documented API, so it is parsed leniently and the last forecast stays on screen if it fails. Fetched only while a weather pane shows a place in Japan, around JMA's publication times (0, 5, 11 and 17 o'clock JST), with conditional requests. Used under JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html), which ask for the credit 「出典：気象庁ホームページ（https://www.jma.go.jp/bosai/forecast/）を加工して作成」; the pane shows it, naming the forecast page the JSON belongs to. |
| Weather, United States | [National Weather Service](https://www.weather.gov/) (api.weather.gov) | Open data. The point lookup is kept for a day; the forecast is asked for about hourly, only while a pane shows the place. |
| Weather, everywhere else | [MET Norway](https://api.met.no/) Locationforecast 2.0 | [CC BY 4.0](https://api.met.no/doc/License), credited in the pane. Requests follow the [terms of service](https://api.met.no/doc/TermsOfService): an identifying User-Agent, coordinates to four decimals, nothing before the `Expires` of the last response (and at least 30 minutes apart), If-Modified-Since. |
| City list for the weather picker | [GeoNames](https://www.geonames.org/) (cities of 500,000 people or more, and capitals) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); bundled. Nothing typed in the picker is sent anywhere. |
| Market quotes | [Yahoo Finance](https://finance.yahoo.com/), through yahoo-finance2 | Unofficial API, not endorsed by Yahoo; quotes may be delayed and are not investment advice (the pane says so). Fetched only while a markets pane is open: one batched request a minute (every five minutes when every listed market is closed), and each chart every five minutes (1D) to hourly (6M and longer). |
| Earthquakes | [Japan Meteorological Agency](https://www.jma.go.jp/) earthquake list JSON: `https://www.jma.go.jp/bosai/quake/data/list.json` | The data JMA's own [earthquake page](https://www.jma.go.jp/bosai/map.html#contents=earthquake_map) loads (about a month of reports), read as JSON. Fetched only while a quakes pane is open or earthquake alerts are on: once a minute, as its `max-age=60` asks, with If-None-Match, so an unchanged list is a 304. Used under JMA's [terms of use](https://www.jma.go.jp/jma/kishou/info/coment.html); the pane credits 「出典：気象庁ホームページ（URL）を加工して作成」 and the alerts name JMA. Not the Earthquake Early Warning. |
| Tsunamis, Japan | JMA tsunami list JSON: `https://www.jma.go.jp/bosai/tsunami/data/list.json` and each report it names | Checked with the earthquake list (usually an empty list, a 304 after the first request); a new report's details are fetched once. Warnings, major warnings and advisories count; forecasts and liftings do not. Credited like the earthquakes. |
| Earthquakes, world | [USGS](https://earthquake.usgs.gov/) real-time feed `summary/4.5_day.geojson` | Public domain. Fetched only while the world source is in use by a quakes pane or alerts: once a minute (its `max-age=60`), conditionally. |
| Tsunamis, world | [NOAA Tsunami Warning Centers](https://www.tsunami.gov/): the Pacific (`PHEBAtom.xml`) and National (`PAAQAtom.xml`) Atom feeds | Public domain. Each holds the centre's latest bulletin; warnings, watches, advisories and threat messages count, information statements do not. Checked with the USGS feed, conditionally. Alerts say to follow local authorities. |
| RSS feeds | The feed URLs you list in an RSS pane | Fetched by the app, never by the page, only while a pane lists them: every 15 minutes (or as the feed asks, at most hourly), conditionally (If-None-Match / If-Modified-Since), two at a time, up to 2 MB each, without cookies and with an `elecdex/<version>` User-Agent. Headlines are shown as plain text; the last ones per feed are kept in `feeds-cache.json` in the app's data folder. Nothing is sent to any other site. |
| AI chat | The providers you list in *Settings -> AI*: a server on your computer or network, or a hosted API (Anthropic through its [official SDK](https://github.com/anthropics/anthropic-sdk-typescript); the rest as OpenAI-compatible `chat/completions`) | Asked by the app, never by the page, and only when you send a message, press **test** or open a pane's model list - a chat pane sitting in a layout calls nobody. What is sent is the conversation so far, your system prompt and the model's name, to the address you chose and nowhere else; each provider's own terms and data retention apply. No cookies, no redirects followed. An API key is encrypted by the operating system (DPAPI, the Keychain, the desktop's keyring) into `ai-keys.json`, apart from `settings.json`, and is never shown again; where the system cannot encrypt, it is kept in memory until elecdex quits. A key is refused for a plain-http address outside your computer and local network. With no key of its own, the Anthropic SDK looks where it always does (`ANTHROPIC_API_KEY`, an `ant auth login` profile). On Anthropic's own endpoint, `claude-opus-5` and `claude-fable-5-1` are asked with server-side fallbacks (`fallbacks: "default"`), so a request their safety classifiers decline is re-run on another Claude model in the same call; the answer names the model that wrote it. Conversations are files in `chats/` in the app's data folder. |
| ELEC system | The same providers, as each seat names them | As for the AI chat, and only when you submit a motion (or open a model list): each unit is sent its standpoint, the voting instructions and the motion - in a second round, the other units' first statements too. Three requests a round, one or two rounds. Deliberations are files in `elec/` in the app's data folder. |
| Web panes | The sites you open in a browser, YouTube or X pane | Loaded by a sandboxed browser view of the app, as a browser would, only while such a pane exists; elecdex itself sends nothing to them. Cookies and site data are kept in the app's data folder (`Partitions/web`) until *sign out of all sites*. YouTube and X are used under their own terms. |
| Orbital elements | [CelesTrak](https://celestrak.org/) GP data (from the 18th and 19th Space Defense Squadrons via [Space-Track.org](https://www.space-track.org/)): `GROUP=stations` as OMM JSON, `GROUP=starlink` as TLE | Positions are computed on your computer; only elements are downloaded. Following CelesTrak's [usage policy](https://celestrak.org/usage-policy.php): only while an ORBIT pane shows the set, the stations at most twice a day and Starlink at most once a day (CelesTrak updates every two hours), kept on disk across restarts, an identifying User-Agent, and nothing more for a day after any answer but a 200. Credited in the pane. |
| Wi-Fi pane | Your own gateway, and `1.1.1.1` (the host the network status pane already pings) | One echo to each a second, and only while a Wi-Fi pane is on screen; the internet's echo is the one the network status pane reads too, so the host is not asked twice. The rest - the signal, the channel, the connection log - is read from the operating system, never from a service. On Windows the network's name comes from the connection profile and nothing behind the location permission is read (no BSSID, no scan); on macOS the name stays hidden without Location Services, which elecdex never asks for. |
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
| Time zone boundaries (ORBIT) | [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder) 2026d, from OpenStreetMap data | [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), © OpenStreetMap contributors. The derived lines in `src/renderer/widgets/orbit/tz-lines.json` (made by `npm run gen:orbit-map`) are under the ODbL too; credited in the pane. |
| Land for the ORBIT map | [Natural Earth](https://www.naturalearthdata.com/) 50m land via world-atlas | Public domain ("Made with Natural Earth", credited in the pane) |
| Orbit propagation (SGP4) | [satellite.js](https://github.com/shashwatak/satellite-js) | MIT |
| Syntax colours in the git pane's diffs | [highlight.js](https://highlightjs.org/) | BSD-3-Clause |
| Calculator's expression evaluator | [elecxzy](https://github.com/kurouna/elecxzy) `src/utils/calc`, copied unmodified into `src/shared/calc/vendor` | MIT |

The geolocation database is bundled, so there is no account, no API key and no first-run
download, and IP lookups never leave the machine.

Every package the app is built from, and the data above, are listed with their licence texts in
`THIRD_PARTY_NOTICES.txt`, beside the executable in each release (written by `npm run build`).

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

---

<p align="center">Copyright © 2026 elecxzy project</p>
