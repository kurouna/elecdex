English | [日本語](presets.ja.md) | [简体中文](presets.zh-CN.md)

# Layout presets — elecdex

elecdex is a science-fiction desktop terminal emulator and system monitor, a rewrite of eDEX-UI on
Electron, Svelte and TypeScript. This page describes its ten **layout presets** - standard,
network, earth, dev, media, desk, ai, cockpit, retro and blank - which put the panes for one kind
of work on screen at a key each (**Ctrl+Shift+F1** to **F10**): what each preset holds, how presets
become saved layouts, and the features each one shows. elecdex runs on Windows, macOS and Linux; it
is developed and used on Windows, and macOS and Linux have only been run by the automated tests on
GitHub Actions, so they are not sufficiently verified.

## On this page

- [The ten presets at a glance](#the-ten-presets-at-a-glance)
- [How presets work](#how-presets-work)
- [standard](#standard)
- [network](#network)
- [earth](#earth)
- [dev](#dev)
- [media](#media)
- [desk](#desk)
- [ai](#ai)
- [cockpit](#cockpit)
- [retro](#retro)
- [blank](#blank)

The panes are arranged by what you are doing: ten layout presets put the right ones on screen at a
key each - Ctrl+Shift+F1 to F10 - and every one but cockpit and blank keeps the system column on
the left, so a switch changes the stage and leaves the instruments where they were. The last,
blank, has no pane at all, for a layout of your own built pane by pane. The features below are
grouped by the preset that shows them, and each picture is that preset in a different theme.

## The ten presets at a glance

The **system column** is the default layout's left column, the same in every preset that has it:
clock, [system](panes-system.md#system), [CPU](panes-system.md#cpu),
[memory](panes-system.md#memory), [disk](panes-system.md#disk), top processes, network status and
network traffic, top to bottom, in 18% of the window's width.

| Key | Preset | Panes (besides the system column) | Picture's theme |
| --- | --- | --- | --- |
| Ctrl+Shift+F1 | [standard](#standard) | three [Terminal](panes-system.md#terminal) tabs; [Launcher](panes-system.md#launcher) beside [Filesystem](panes-system.md#filesystem); [World view](panes-network.md#world-view), [Markets](panes-world.md#markets), [Weather](panes-world.md#weather), [Calendar](panes-desk.md#calendar) | Tron |
| Ctrl+Shift+F2 | [network](#network) | [World view](panes-network.md#world-view) over [Connections](panes-network.md#connections); [Wi-Fi](panes-network.md#wi-fi) over [Ethernet](panes-network.md#ethernet) | White |
| Ctrl+Shift+F3 | [earth](#earth) | [Orbit](panes-world.md#orbit) over a [Terminal](panes-system.md#terminal); [World view](panes-network.md#world-view), [Quakes](panes-world.md#quakes), [Weather](panes-world.md#weather) | Tron |
| Ctrl+Shift+F4 | [dev](#dev) | [AI Agent](panes-dev.md#ai-agent); [Docker](panes-dev.md#docker) and a Terminal as tabs; [Clipboard](panes-desk.md#clipboard), [Timer](panes-desk.md#timer) and a Terminal as tabs; [Git](panes-dev.md#git), [AI chat](panes-ai.md#ai-chat) and [Log Watch](panes-dev.md#log-watch) as tabs | Phosphor |
| Ctrl+Shift+F5 | [media](#media) | YouTube (TV) ([web pane](panes-media.md#browser-youtube-and-x)); [Now playing](panes-media.md#now-playing), [Spectrum](panes-media.md#spectrum), [Mixer](panes-media.md#mixer); X and [RSS](panes-world.md#rss) as tabs | White |
| Ctrl+Shift+F6 | [desk](#desk) | [Notes](panes-desk.md#notes); [Timer](panes-desk.md#timer) beside [Calculator](panes-desk.md#calculator); [Tasks](panes-desk.md#tasks) over [Clipboard](panes-desk.md#clipboard); [Calendar](panes-desk.md#calendar) over [Utility](panes-desk.md#utility) and [ELEC-16](panes-retro.md#elec-16) SCI as tabs | Black |
| Ctrl+Shift+F7 | [ai](#ai) | two [AI chat](panes-ai.md#ai-chat) panes, one over the other; [ELEC system](panes-ai.md#elec-system) over [GPU](panes-system.md#gpu) | Business (Dark) |
| Ctrl+Shift+F8 | [cockpit](#cockpit) | no system column: [Cluster](panes-system.md#cluster) over a [Terminal](panes-system.md#terminal); [Wi-Fi](panes-network.md#wi-fi) over [Ethernet](panes-network.md#ethernet) | Black |
| Ctrl+Shift+F9 | [retro](#retro) | [ELEC-16](panes-retro.md#elec-16), ELEC-16 SCI and [CHIP-8](panes-retro.md#chip-8) as tabs of one pane; [Spectrum](panes-media.md#spectrum) at sixteen bands under them | Tron |
| Ctrl+Shift+F10 | [blank](#blank) | none | Amber |

## How presets work

| | |
| --- | --- |
| Where | the LAYOUTS dialog (**Ctrl+Shift+G**, or *layouts* in the status bar): the shelf of presets under the list of saved layouts; **Ctrl+Shift+F1** to **F10**; the action palette (**Ctrl+Shift+P**), whose PRESET rows run the same keys |
| Stored in | `layouts.json`, as saved layouts that remember which preset they came from |
| Settings | *Settings → General → Layouts* → *ask before switching layout* (on by default); the keys in *Settings → Keyboard* |

A preset is a **template**, never a second kind of layout:

- **Choosing a preset adds a saved layout made from it and goes there.** From then on it is one of
  your saved layouts: it has a number key (Ctrl+Shift+1 to 9 and 0, by its place in the list), and
  it follows your work - whatever you do to the workspace is kept in it, so coming back finds it as
  you left it.
- **Choosing it again goes back to that layout** rather than adding another. The layout remembers
  only which preset it was made from, so the preset is never added twice.
- **↺ puts a layout back to its preset**, keeping its name and its place in the list.
- If you already keep a layout of your own with the preset's name, the new one is numbered
  (`desk 2`).
- Each preset has a key of its own, **Ctrl+Shift+F1** to **F10**, in the shelf's order, which does
  the same from anywhere: it goes to the layout made from the preset, or adds one. The keys are
  bound to the preset, not to its place, so a key you rebind stays on the same preset when presets
  are added. They carry Ctrl+Shift because bare F keys belong to the tasks pane (F2 edits) and to
  programs in the shell such as htop or mc.
- **A new install starts with all ten**, on Ctrl+Shift+1 to 0, standard active. A new install is
  one with neither `layout.json` nor `layouts.json`. An existing list of saved layouts is never
  added to: add a preset from the shelf.
- At most 20 layouts are kept; when the list is full, a preset cannot be added until one is
  deleted.
- A preset turns nothing on: Starlink, quake alerts and the like stay yours to opt into.
- Applying any layout replaces the workspace, which ends the shells of the panes it replaces; while
  shells are open you are asked first (see [Saved layouts](workspace.md#saved-layouts)).

The LAYOUTS dialog:

<p align="center">
  <img src="../screenshots/elecdex-layouts.jpg" alt="The layouts dialog over the standard layout in the Tron theme: the presets as saved layouts, 1 to 9 in view (blank, on 0, further down), each with a thumbnail of its arrangement, and below them the shelf of presets with their thumbnails - blank's an empty frame - where each stands, and their keys Ctrl+Shift+F1 to F10">
  <br><sub>Layouts (Ctrl+Shift+G) · Tron</sub>
</p>

- Each row of the list and each card on the shelf is drawn as a small map of its panes; the
  system column is drawn faint so the differences stand out.
- A card says where its preset stands: **on 3** (the layout made from it is on that number key),
  **kept** (among your layouts, past the first ten), **in this one** (the layout you are in) or
  **+ add** (not among them). The card shows its preset's key underneath.
- The shelf is one row that scrolls sideways; the mouse wheel scrolls it. **Tab** moves from the
  list to the shelf, **←** / **→** between cards, **↑** back to the list. At the 1920x1080 design
  size all ten cards fit in one row.
- The chosen row or card blinks (three times, 100 ms each), then the dialog powers off and the
  switch begins. With motion reduced it switches at once.

Every preset keeps every pane at or above its minimum size at 1920x1080, and the panes of the stage
at 1366x768 (checked by a unit test). Design notes: [architecture.md §5.6](../architecture.md)
(Japanese).

## standard

*This machine, its shells and the world outside.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F1** |
| Panes | system column; three [Terminal](panes-system.md#terminal) tabs over [Launcher](panes-system.md#launcher) and [Filesystem](panes-system.md#filesystem); on the right [World view](panes-network.md#world-view), [Markets](panes-world.md#markets), [Weather](panes-world.md#weather) and [Calendar](panes-desk.md#calendar) |
| Picture | Tron |

The arrangement elecdex opens with.

<p align="center">
  <a href="https://youtu.be/JlCZzLhp_PM">
    <img src="../screenshots/elecdex-tron.jpg" alt="elecdex with the Tron theme: system monitors on the left, three shell tabs with the launcher and file browser in the middle, and the world view, markets, weather and calendar on the right">
  </a>
  <br><sub>standard · Tron</sub>
  <br>
  ▶ <a href="https://youtu.be/JlCZzLhp_PM">Watch the 3-minute tour</a> · <a href="https://youtube.com/shorts/K-Is8LihR1w">Shorts (vertical)</a>
</p>

- **[Terminal](panes-system.md#terminal)** — real shells (PowerShell - 7 where it is installed -
  bash, zsh, fish) in unlimited tabs and splits. Shell integration reports the working directory
  and exit codes, on Windows too, and a session keeps its scrollback when its pane is moved or
  reloaded. Each pane starts again in its last folder at the next start; a new pane starts in the
  folder the settings name. The shell has focus at start; selecting text copies it and a
  right-click pastes. Ctrl+Shift+F finds text in the scrollback, and a URL the shell prints opens in
  your browser on Ctrl+click (⌘+click on a Mac).
- **System monitor** — clock with time zone, [system](panes-system.md#system) strip with a battery
  gauge, per-core [CPU](panes-system.md#cpu) (as graphs or bars), [memory](panes-system.md#memory)
  and swap over time, [disks](panes-system.md#disk) with read/write activity, top processes,
  network status and traffic, and the [GPU](panes-system.md#gpu)'s load and video memory. The
  default layout idles at about 13% of one core.
- **Files and apps** — a [file browser](panes-system.md#filesystem) that follows the shell (click
  to `cd` or insert a path), and a [launcher](panes-system.md#launcher) for the Start Menu (Store
  and other packaged apps included), `/Applications` or `.desktop` entries plus your own, most used
  first.
- **Weather, markets and calendar** — [forecasts](panes-world.md#weather) for anywhere (JMA in
  Japan, the National Weather Service in the United States, MET Norway elsewhere), a
  [market board](panes-world.md#markets) from Yahoo Finance (unofficial, possibly delayed, not
  investment advice), and a month [calendar](panes-desk.md#calendar) with optional Japanese
  holidays.

## network

*Who this machine talks to.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F2** |
| Panes | system column; [World view](panes-network.md#world-view) over [Connections](panes-network.md#connections) (two to one, three fifths of the stage); beside them [Wi-Fi](panes-network.md#wi-fi) over [Ethernet](panes-network.md#ethernet), half and half |
| Picture | White |

<p align="center">
  <img src="../screenshots/elecdex-network.jpg" alt="The network preset in the White theme: the system column on the left, the world view globe in white with arcs to where connections go, and under it the connections pane listing sockets by program - firefox, code, elecdex, thunderbird; on the right the Wi-Fi pane over the Ethernet pane, each on a made-up link with every segment from the PC to the internet clear and a one-minute timeline - the cable at 1 Gb/s full duplex">
  <br><sub>network · White</sub>
</p>

- **[World view](panes-network.md#world-view) and [connections](panes-network.md#connections)** —
  a globe of where the machine's connections go, and a pane listing every TCP socket by the
  program holding it, both placed with a bundled GeoIP database; nothing is looked up online. The
  socket table sits under the globe.
- **[Wi-Fi](panes-network.md#wi-fi) and [Ethernet](panes-network.md#ethernet)** — one over the
  other, where the wireless link and the cable are failing, segment by segment.
- Network status and traffic are already in the system column, so the preset has no shell.

## earth

*Overhead and underfoot.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F3** |
| Panes | system column; [Orbit](panes-world.md#orbit) over a [Terminal](panes-system.md#terminal); beside them [World view](panes-network.md#world-view), [Quakes](panes-world.md#quakes) and [Weather](panes-world.md#weather) |
| Picture | Tron |

<p align="center">
  <img src="../screenshots/elecdex-earth.jpg" alt="The earth preset in the Tron theme: an ORBIT pane with the world map, time zone lines and nine cities' clocks, the ISS with its ground track, Tiangong, the Starlink satellites as faint dots and the card of one of them; beside it the world view, a quakes pane listing recent earthquakes in Japan, and the weather; a shell below the map">
  <br><sub>earth · Tron</sub>
</p>

- **[Orbit](panes-world.md#orbit)** — mission control's front screen: a world map with the night
  side, the lines where clocks change and the hour each zone keeps, the ISS and Tiangong where they
  are now with their ground tracks, the next pass over a city you choose, and the world's clocks
  around mission control's GMT day-of-year clock. The Starlink constellation on request. Orbital
  elements come from CelesTrak.
- **[Earthquakes and tsunamis](panes-world.md#earthquake-and-tsunami-alerts)** — for Japan (JMA)
  or the world (USGS and NOAA): alerts at the intensity or magnitude you choose (off by default),
  tsunami warnings kept in sight while in effect, a [quakes pane](panes-world.md#quakes) listing
  recent earthquakes, and their epicentres marked on the globe. Alerts name their source and are
  not an early warning; for a tsunami, follow your local authorities.
- The preset turns on neither Starlink nor quake alerts: both stay yours to opt into.

## dev

*Agents at work, the containers they run, and the repository they change.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F4** |
| Panes | system column; [AI Agent](panes-dev.md#ai-agent) over [Docker](panes-dev.md#docker) (a Terminal tab behind it) over [Clipboard](panes-desk.md#clipboard) ([Timer](panes-desk.md#timer) and a Terminal behind it); on the right, full height, [Git](panes-dev.md#git) ([AI chat](panes-ai.md#ai-chat) and [Log Watch](panes-dev.md#log-watch) behind it) |
| Picture | Phosphor |

<p align="center">
  <a href="https://youtu.be/YLxHhQ7wAyE">
    <img src="../screenshots/elecdex-dev.jpg" alt="The dev preset in the Phosphor theme: an AI AGENT pane with two Claude Code sessions, one busy with a subagent at work, a subagent of its own hanging under it, and the tests running in the background, and its changed files; under it a DOCKER pane with made-up containers grouped by Compose project - ledger and shop - with their health, ports and use, a shell tab behind it; below that a clipboard history of made-up copies, with a timer and a shell in the tabs behind; a GIT pane on the right, an AI chat tab and a log watch tab behind it, with the same checkout, the diff of passes.ts, and the commit graph with the card of a commit the pointer rests on">
  </a>
  <br><sub>dev · Phosphor</sub>
  <br>
  ▶ <a href="https://youtu.be/YLxHhQ7wAyE">Watch the dev layout at work</a> (1 min) · <a href="https://youtu.be/eLKHc9nyWgc">日本語版</a>
</p>

- **[AI Agent](panes-dev.md#ai-agent)** *(experimental)* — the Claude Code sessions at work on your
  computer: what each is doing this moment, how much it carries, its subagents and background
  tasks, and a diff of every file it changed, read from Claude Code's own records on this machine.
- **[Git](panes-dev.md#git)** — a repository you choose: the files changed, the diff of each with
  its syntax coloured, and the commit graph with its branches and tags, kept current as they
  change - watch an AI agent work in the next pane. FETCH, PULL fast-forward only, and PUSH, never
  forced. One pane per repository. It has the full height, which its diff needs.
- **[Docker](panes-dev.md#docker)** — the containers of the Docker engine on your computer, by
  Compose project: up or down, healthy or not, their published ports (a click opens one in the
  browser) and what each uses; start, stop, restart and pause from the row.
- **[Log Watch](panes-dev.md#log-watch)** — a log file followed as it grows: levels coloured, stack
  traces folded, repeats counted, patterns never seen before marked NEW, an error burst lit, and
  **EXPLAIN** to ask the model of your AI settings about the lines you choose.
- Tabs keep the rest at hand: a shell behind Docker, the [clipboard history](panes-desk.md#clipboard)
  with a [timer](panes-desk.md#timer) and one more shell at the foot, and an
  [AI chat](panes-ai.md#ai-chat) and Log Watch behind GIT.
- The panes in front are the ones that read only while they are seen - the Docker engine and the
  clipboard - so a fresh dev layout shows them working.

## media

*Watch, scroll, and see the sound.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F5** |
| Panes | system column; YouTube (TV) over [Now playing](panes-media.md#now-playing), [Spectrum](panes-media.md#spectrum) and [Mixer](panes-media.md#mixer) in a row; X and [RSS](panes-world.md#rss) as tabs down the side, X in front |
| Picture | White |

<p align="center">
  <img src="../screenshots/elecdex-media.jpg" alt="The media preset in the White theme: a YouTube (TV) pane and an X pane, each showing a stand-in page made for the screenshot in the manner of a television video home and a social timeline, with made-up channels, accounts and pictures, and an RSS tab behind X; under the television a now playing pane with a made-up track and a cover drawn for it, a 16-band spectrum in fluorescent cyan and a mixer with master, Music Player and Web Browser strips">
  <br><sub>media · White — the web panes show stand-in pages made for the picture</sub>
</p>

- **[Web panes](panes-media.md#browser-youtube-and-x)** — a browser, YouTube and X in panes you add when
  you want them, drawn in the theme's colour (or their own, by a setting) and sharing one sign-in
  per site.
- **[Spectrum](panes-media.md#spectrum) and [mixer](panes-media.md#mixer)** — a spectrum analyser
  of what the computer is playing, drawn like a 1990s car stereo's display (fluorescent cyan or
  amber, LED, or the theme's colour), and a mixer for the system volume and each app playing
  sound.
- **[Now playing](panes-media.md#now-playing)** — what a player is playing, as Windows' own media
  overlay knows it: the art, the title, artist and album, where the track is, and previous,
  play/pause and next. **Windows only: macOS and Linux are not supported yet.**
- **[RSS](panes-world.md#rss)** — headlines from the RSS and Atom feeds you list, newest first.

## desk

*Writing, counting and keeping time.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F6** |
| Panes | system column; three columns: [Notes](panes-desk.md#notes) over [Timer](panes-desk.md#timer) and [Calculator](panes-desk.md#calculator); [Tasks](panes-desk.md#tasks) over [Clipboard](panes-desk.md#clipboard); [Calendar](panes-desk.md#calendar) over [Utility](panes-desk.md#utility), with ELEC-16 SCI as a tab beside it. No shell |
| Picture | Black |

<p align="center">
  <img src="../screenshots/elecdex-desk.jpg" alt="The desk preset in the Black theme: a notes pane with a release checklist, a timer and a calculator under it; a tasks pane with deadlines drawn as meters over a clipboard history of made-up copies; three months of the calendar over the calculator ELEC-16 SCI, in front of the utility pane's tab, answering sin(45)+1/2 with its exact form (1+√2)/2">
  <br><sub>desk · Black</sub>
</p>

- **Desk panes** — a [calculator](panes-desk.md#calculator) you type into (full-width digits and
  3百万 read as typed, with a tape and a tally for a pasted column of numbers), plain
  [notes](panes-desk.md#notes) that save themselves, [tasks](panes-desk.md#tasks) whose deadlines
  are drawn as meters and announced whether or not their pane is open, and a
  [timer](panes-desk.md#timer) with a stopwatch whose laps stack up like a spectrum, countdowns
  that run beside it, and alarms for the times the day is built around. A
  [clipboard history](panes-desk.md#clipboard), under the tasks, of what you copy while it is on
  screen, to put back with a click, and under the calendar the [utility pane](panes-desk.md#utility)
  (keep the machine awake, QR codes, encoding and hashes) with the scientific calculator
  [ELEC-16 SCI](panes-retro.md#elec-16) behind its tab.
- The clipboard pane is on screen rather than in a tab because it reads the clipboard only while it
  is seen. The utility pane sits under the calendar, where its QR code has a square and an AWAKE
  hold stays in sight.

## ai

*Two conversations, a council, and the GPU they run on.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F7** |
| Panes | system column; two [AI chat](panes-ai.md#ai-chat) panes, one over the other; on the right, with the most room, [ELEC system](panes-ai.md#elec-system) over [GPU](panes-system.md#gpu) |
| Picture | Business (Dark) |

<p align="center">
  <img src="../screenshots/elecdex-ai.jpg" alt="The ai preset in the Business (Dark) theme, every answer written by a stand-in made for the picture: two AI chat panes one over the other - the top one on Ollama with a question about watching a folder in Node.js answered with a code block, and a second answer arriving, its heading reading RX with the seconds and characters so far; the bottom one on LM Studio, answering what git pull --ff-only refuses to do - and on the right an ELEC system pane, LOGOS and PATHOS lit green with APPROVE, ETHOS outvoted with REJECT, the resolution strip reading APPROVED 2-1-0-0; under it a GPU pane charting a made-up adapter's load and video memory over a minute, with its engines and VRAM and shared memory as bars">
  <br><sub>ai · Business (Dark) — the answers are a stand-in's, made for the picture</sub>
</p>

- **[AI chat](panes-ai.md#ai-chat)** — talk to a language model you run yourself (Ollama, LM
  Studio, llama.cpp - anything that speaks the OpenAI chat API) or to a service you have an API key
  for (Anthropic, OpenAI, Gemini, OpenRouter). Answers stream in with their reasoning folded away,
  keys are encrypted by the operating system and never reach the page, and conversations stay on
  your computer. Text files, images and PDFs go with a question - picked with **+**, dropped on the
  pane or pasted as a picture; an image is made small and drawn again before it is sent, so what a
  camera wrote into the file (where a photo was taken) never leaves.
- **[GPU](panes-system.md#gpu)** — under the council, the GPU's load and how full its own memory
  is: what a model run on this machine leans on.
- Both kinds of AI pane ask a provider only when you send, so the preset costs nothing until then.

<p align="center">
  <img src="../screenshots/elecdex-elec.jpg" alt="The Tron theme with an ELEC system pane filling the middle column: three plates of one size in a triangle around a hexagonal core, LOGOS and PATHOS lit green with APPROVE and ETHOS, outvoted with REJECT, stepped back in dim red, the resolution strip reading APPROVED 2-1-0-0, and the three statements below">
  <br><sub>ELEC system · Tron</sub>
</p>

- **[ELEC system](panes-ai.md#elec-system)** — put a yes-or-no motion to a council of three
  models: LOGOS (logic), ETHOS (ethics) and PATHOS (feeling) each judge it from their own
  standpoint and vote APPROVE, REJECT or ABSTAIN, and the pane resolves it by majority or
  unanimity. The seats use the providers of the AI chat - the same model in all three will do.

## cockpit

*The whole machine on one pane, a shell, and both links.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F8** |
| Panes | no system column: [Cluster](panes-system.md#cluster) where the column would be, over a [Terminal](panes-system.md#terminal); beside them [Wi-Fi](panes-network.md#wi-fi) over [Ethernet](panes-network.md#ethernet) |
| Picture | Black |

<p align="center">
  <img src="../screenshots/elecdex-cockpit.jpg" alt="The cockpit preset in the Black theme, near-black on a pale ground with scanlines: the CLUSTER pane in the top left in place of the system column - the lamps in a row with ALL SYSTEMS NOMINAL, the clock over the date, memory, VRAM, swap, the fullest disk, connections, the busiest program, power, uptime, the link's total and the address beside them in two rows of five, a line of the OS, maker, model, chassis, CPU, a made-up GPU and AWAKE, then a minute of CPU as a line, a bar for each of sixteen cores, memory, GPU, disk I/O, network down and up and ping as lines with their peaks and averages - a shell under it; on the right the Wi-Fi pane over the Ethernet pane, each on a made-up link">
  <br><sub>cockpit · Black</sub>
</p>

- **[Cluster](panes-system.md#cluster)** — the whole machine on one pane, like a car's instrument
  cluster: warning lamps and the worst of them in words, the clock and the date, a minute of CPU,
  memory, GPU, disk I/O, network and ping, every core's load when there is room, and the rest at a
  glance. It rearranges itself for any size, from the full screen to a narrow column.
- cockpit is the one preset with panes but without the system column: the Cluster pane does its
  job, and more. At 1600x900 it is large enough to lay itself out at its widest, with every core.
- [Wi-Fi](panes-network.md#wi-fi) and [Ethernet](panes-network.md#ethernet) are on made-up links in
  the picture.

## retro

*Two machines of elecdex's own, and the sound.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F9** |
| Panes | system column; one pane with [ELEC-16](panes-retro.md#elec-16), ELEC-16 SCI and [CHIP-8](panes-retro.md#chip-8) as tabs, ELEC-16 in front; the [Spectrum](panes-media.md#spectrum) at sixteen bands under it |
| Picture | Tron (ELEC-16 SCI in front) |

The machine behind its tab is paused while it is out of sight.

<p align="center">
  <img src="../screenshots/elecdex-retro.jpg" alt="The retro preset in the Tron theme: the system column on the left; on the right one pane with ELEC-16, its calculator ELEC-16 SCI and CHIP-8 as tabs, the calculator in front in its SLATE body, its LCD answering sin(45)+1/2 with its exact form (1+√2)/2 over two rows of function keys and the number keys, its panel's CORE beside it with the registers and the ROM's code running; under it the spectrum at sixteen bands">
  <br><sub>retro · Tron · ELEC-16 SCI in front</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-chip8.jpg" alt="The Amber theme with a CHIP-8 pane filling the middle column: the title screen of T8NKS, two tanks facing each other drawn in four shades of amber, with the keypad, the registers and the code round the program counter beside it">
  <br><sub>CHIP-8 · Amber</sub>
</p>

- **[CHIP-8](panes-retro.md#chip-8)** — CHIP-8, SUPER-CHIP and XO-CHIP programs on a machine of
  elecdex's own: the 104 games, visual novels and toys of chip8Archive, each with a frame of its
  screen, your own program files, saves, and the registers, memory and code beside the screen.

<p align="center">
  <img src="../screenshots/elecdex-elec16.jpg" alt="An ELEC-16 pane in the middle column in the CLASSIC skin: a dark pocket computer with ELEC-16 and 16-BIT POCKET COMPUTER on its name plate, a green-grey LCD drawing a sine wave, the keyboard with a red BRK key, and CORE beside it showing the registers and the code">
  <br><sub>ELEC-16 · CLASSIC skin</sub>
</p>

<table>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-alloy.jpg" alt="ALLOY: brushed metal with the plate letters pressed in, one amber rule, black keys on a sunk black deck"><br><sub>ALLOY</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-graphite.jpg" alt="GRAPHITE: a matte graphite case, light keys, a near-white keypad, dark function keys and a red BRK"><br><sub>GRAPHITE</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-neo.jpg" alt="NEO: a cool light-grey case, low keys set in their own cuts, a paper-like screen, a cobalt ENTER"><br><sub>NEO</sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-mochi.jpg" alt="MOCHI: sakura pink with white polka dots, glazed pastel keys in mint, cream, lemon and lavender, a plum screen"><br><sub>MOCHI</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass.jpg" alt="GLASS on a dark theme: a dark glass case lit at its rim, the board seen deep inside, glass keys"><br><sub>GLASS</sub></td>
    <td align="center" width="33%"><img src="../screenshots/elecdex-skin-glass-light.jpg" alt="GLASS on a light theme: the same glass made light, the accent blue in its ENTER"><br><sub>GLASS · light theme</sub></td>
  </tr>
</table>

<p align="center">
  <img src="../screenshots/elecdex-play-air.jpg" alt="An ELEC-16 pane made a PLAY-320 in its wide graphite body, in the Phosphor theme: ELECAIRCOMBAT's cockpit on the screen, the ace GANNET ahead in the seeker circle under a red lock box with ENGAGE above, a missile bursting on it, the radar, score and damage panels below with the LCK lamp lit; CORE beside it with the E16's registers and the code at the program counter as it runs">
  <br><sub>ELEC-16 PLAY (PLAY-320) · ELECAIRCOMBAT · Phosphor · CORE beside it</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play.jpg" alt="An ELEC-16 pane made a PLAY-320 in its tall coral body, in the Business (Dark) theme: ELECLANCE on its colour screen, the ship firing the LANCE straight up between small enemies, its side panels with the score, CHAIN, SHIP, BOMB and VOLT, and GAMES beside it with ELECLANCE in the slot, the shelf of three games and DEVELOP">
  <br><sub>ELEC-16 PLAY (PLAY-320) · ELECLANCE · Business (Dark)</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-drill.jpg" alt="An ELEC-16 pane made a PLAY-320 showing its screen alone, in the Business (Light) theme: ELECDRILL's well of red, yellow, green and blue blocks, the driller at 34 m with a 3 CHAIN lit up above him, the depth gauge, AIR tank, DRILLERS and CHAIN panels either side; MEM beside it with the E16's memory in hex">
  <br><sub>ELEC-16 PLAY (PLAY-320) · ELECDRILL · Business (Light) · the screen alone, MEM beside it</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-play-fighter.jpg" alt="An ELEC-16 pane made a PLAY-320 showing its screen alone, in the Tron theme: ELECFIGHTER's first fight on the GRID stage, S4 OUTBOX in blue wire and fill landing a punch with a burst of sparks on S2 RUSH in red, the skyline and the perspective floor behind them, the life bars and TIME above; GAMES beside it with ELECFIGHTER in the slot">
  <br><sub>ELEC-16 PLAY (PLAY-320) · ELECFIGHTER · Tron · the screen alone, GAMES beside it</sub>
</p>

<p align="center">
  <img src="../screenshots/elecdex-sci.jpg" alt="An ELEC-16 pane made an SCI-128 calculator in its tall chalk-white body, in the Business (Light) theme: sin(45)+1/2 typed in 2D with the fraction set as a textbook sets it, the answer (1+√2)/2 in its exact form below; the keys with SHIFT faces in orange and ALPHA letters, a dark cursor pad, red DEL and AC and a blue =; CORE beside it with the E16's registers and code">
  <br><sub>ELEC-16 SCI (SCI-128) · CHALK · Business (Light)</sub>
</p>

- **[ELEC-16](panes-retro.md#elec-16)** — a 16-bit pocket computer of elecdex's own design: its own
  RISC CPU, BASIC and machine-code monitor in ROM, an LCD and a keyboard, a memory card, and a CODE
  view that compiles TypeScript into its machine code, and LINK to talk with the AI. Made a
  **PLAY-320**, it is a game console with cartridges, sprites and sixteen sound channels, with
  games of its own - ELECLANCE, ELECAIRCOMBAT, ELECDRILL and the one-on-one fighter ELECFIGHTER -
  and a kit to make games for it. Picked as **ELEC-16 SCI** (a tab of retro and desk), it is a
  scientific calculator: lines set as a textbook sets them, answers kept as fractions and roots,
  modes for statistics, bases, tables, equations, complex numbers, matrices and programs, and
  physical constants, unit conversions, Σ, derivatives and integrals.
- The ELEC-16 SCI tab in retro and desk starts on a new SCI-128 unit of its own, as the picker's
  *elec-16 sci* row does, so no one's BASIC program is cleared to make a calculator of it; its
  panel is folded so the body has the room.

## blank

*Nothing yet, to build your own.*

| | |
| --- | --- |
| Key | **Ctrl+Shift+F10** |
| Panes | none |
| Picture | Amber, with the add-pane picker open for the first pane |
| Status | Released in v0.0.44 |

<p align="center">
  <img src="../screenshots/elecdex-blank.jpg" alt="The blank preset in the Amber theme: a workspace with no pane, and over it the add-pane picker listing every widget with its description, the placements right, below, new tab and pop up at its top">
  <br><sub>blank · Amber · the picker open for the first pane</sub>
</p>

- **blank** — a layout with no pane in it: *no panes in this layout* and
  **+ add pane** (or Ctrl+Shift+A) open the picker, and the first pane chosen fills the screen;
  split it, add tabs and drag panes from there. Closing the last pane of any layout leaves it empty
  in the same way.
- In an empty layout the first pane fills the screen whatever placement the picker has selected,
  and the split and new-tab keys (Ctrl+Shift+E, Ctrl+Shift+O, Ctrl+Shift+T) add a shell as the first pane.
- How to arrange panes from there: [The workspace](workspace.md).
