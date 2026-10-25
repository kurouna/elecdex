English | [日本語](index.ja.md) | [简体中文](index.zh-CN.md)

# User guide — elecdex

elecdex is a science-fiction desktop terminal emulator and system monitor for Windows, macOS and
Linux, a ground-up rewrite of eDEX-UI on Electron 45, Svelte 5 and TypeScript 7 (GPL-3.0). This
guide describes every pane and feature: what each one shows, where its data comes from, how often
it updates, what it never reads or sends, and how it differs between platforms. elecdex is
developed and used on Windows; macOS and Linux builds are tested by CI only and are not
sufficiently verified by hand.

## Start here

| Page | What it covers |
| --- | --- |
| [Layout presets](presets.md) | The ten presets (standard, network, earth, dev, media, desk, ai, cockpit, retro, blank), the keys Ctrl+Shift+F1 to F10, and the panes in each |
| [Workspace](workspace.md) | Panes, splits and tabs, moving and closing, bringing a pane forward, pop-up panes, saved layouts, the action palette, motion and sound, running in the background |
| [Keyboard shortcuts](keyboard.md) | Every default chord, how to rebind them, and the system-wide show/hide shortcut |
| [Themes and settings](themes-settings.md) | The seven themes and `settings.json` |

## Panes

| Page | Panes |
| --- | --- |
| [System panes](panes-system.md) | Terminal, Clock, System, CPU, Memory, GPU, Disk, Top processes, Cluster, Launcher, Filesystem |
| [Network panes](panes-network.md) | Network status, Network traffic, World view, Connections, Wi-Fi, Ethernet |
| [Development panes](panes-dev.md) | AI Agent, Git, Docker, Log Watch |
| [World panes](panes-world.md) | Orbit, Markets, Weather, RSS, Quakes, earthquake and tsunami alerts |
| [AI panes](panes-ai.md) | AI chat, ELEC system |
| [Desk panes](panes-desk.md) | Calculator, Notes, Tasks, Timer, Clipboard, Calendar, Utility |
| [Media panes](panes-media.md) | Spectrum, Browser, YouTube, X, Mixer, Now playing |
| [Retro panes](panes-retro.md) | CHIP-8, ELEC-16 (POCKET, HANDHELD, PLAY-320, SCI-128) |

## Extending, privacy and development

| Page | What it covers |
| --- | --- |
| [Plugins](plugins-use.md) | Installing a plugin, the permissions it asks for, the samples; the API is in [plugins.md](../plugins.md) |
| [Network access and data sources](data-sources.md) | Every service elecdex contacts, what it sends, how often, and under which terms |
| [Develop](develop.md) | Building, testing and releasing elecdex, and why it is a rewrite |

## Manuals and design documents

- ELEC-16, in Japanese: [BASIC](../elec16-basic.md), [the E16 machine](../elec16-e16.md),
  [e16c and CODE](../elec16-e16c.md), [the SOFT CARD](../elec16-soft.md),
  [PLAY-320](../elec16-play-manual.md), [SCI-128](../elec16-sci-manual.md); HTML quick guides for
  [the pocket computer](../elec16-guide/pocket.html) and [the calculator](../elec16-guide/sci.html)
  (open them from a checkout: GitHub shows an HTML file as its source)
- [Architecture](../architecture.md) and [decisions](../decisions.md), in Japanese: the design and
  every decision with its reason and measured numbers
- [Plugin API](../plugins.md)
