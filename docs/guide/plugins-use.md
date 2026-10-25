English | [日本語](plugins-use.ja.md) | [简体中文](plugins-use.zh-CN.md)

# Plugins — elecdex

elecdex is a science-fiction terminal emulator and system monitor for Windows, macOS and Linux, a rewrite of eDEX-UI. A plugin adds a pane of your own to it. This page is the user's side of plugins: how to install one, what turning it on grants and asks you, what a plugin can and cannot reach, where its files go, and the two sample plugins, the pomodoro timer and the rhythm game KEYSTREAM. The plugin API, for writing one, is [docs/plugins.md](../plugins.md) (Japanese). macOS and Linux are built and run by the automated tests only and are not sufficiently verified by hand.

## On this page

- [What a plugin is](#what-a-plugin-is)
- [Installing a plugin](#installing-a-plugin)
- [Turning a plugin on](#turning-a-plugin-on)
- [What a plugin can reach](#what-a-plugin-can-reach)
- [Managing plugins](#managing-plugins)
- [Where the files go](#where-the-files-go)
- [pomodoro](#pomodoro)
- [KEYSTREAM](#keystream)
- [Writing a plugin](#writing-a-plugin)

## What a plugin is

| | |
| --- | --- |
| Where | *Settings → Plugins*; a turned-on plugin appears in the add-pane picker (Ctrl+Shift+A) with a *plugin* badge |
| Reads | Only what you grant it: metric sources, named hosts, a sign-in session, keys, sound |
| Updates | Its worker runs while one of its panes is open, or all the time if you granted *keep running* |
| Privacy | No access to the page, your files or the network of its own; every request is made by the app and checked against your grant |
| Settings | `plugins` in `settings.json`, by plugin id |

- A plugin adds a pane. It is a TypeScript or JavaScript file, or a folder with an `index.ts`, in the `plugins` folder under the app's data folder.
- Edits load as you save: the folder is watched, and only a plugin whose content changed is restarted.
- `elecdex-plugin.d.ts` beside the plugins gives an editor the API's types. elecdex rewrites it on every start to match its own API; do not edit it.
- A plugin is never popped up, and cannot replace a built-in pane.

## Installing a plugin

### From a folder

1. Open *Settings → Plugins* and click **install from a folder…**.
2. Pick the plugin's folder.

elecdex takes the plugin out of it: the entry and what it imports, and nothing else. A README, a `package.json`, a `.git`, a `node_modules` and any test beside the code stay where they are. A file under `tests/` that the plugin does import comes with it: what counts is whether the plugin reaches it, not what the folder is called.

- The plugin is copied under the folder's own name. If a plugin of that name is already there, you are asked first; its permissions and stored data stay with its id.
- What can be known without running it is checked before anything is copied: that the code compiles, and that every import is a file that came with it. A folder that is not a plugin, or one that needs npm (a package import such as `from 'lodash'`), is refused with the reason rather than failing later.
- A folder that *holds* plugins (another elecdex's plugins folder, for example) is told apart from one that is one.
- An installed plugin starts off, like one put in by hand.

### By hand

*open plugins folder* in *Settings → Plugins* opens the folder; put a plugin in it.

| Form | Rule |
| --- | --- |
| One file | A `.ts` or `.js` file directly in `plugins/` (not `.d.ts`) |
| A folder | A folder directly in `plugins/` with an `index.ts` or `index.js`; files up to 4 levels deep and 64 files |
| Size | Up to 1 MiB per plugin in all |
| Links | Only regular files and folders are read; symbolic links are not followed |

A plugin that fails to load is kept apart and does not stop the others; its row in the settings shows the reason.

## Turning a plugin on

Plugins are off until turned on in *Settings → Plugins*. A new plugin, installed or put in by hand, is off.

1. Tick the plugin's switch.
2. If it asks for permissions, the row lists them in plain words, *[plugin] will be able to:*, and waits.
3. Click **agree and turn on**, or **cancel**.

A plugin that asks for no permissions turns on without asking.

| Permission | What the settings say it may do |
| --- | --- |
| Metric sources | read the names of the programs running, the addresses this computer is connected to, your network address, this computer's make and model, the operating system and machine name, or other readings |
| Hosts | reach a named host over the internet, without cookies |
| Session | use a host signed in as you: it sees what that site shows you (you sign in once, in a window of its own; sign out in the settings) |
| Background | keep running while none of its panes is open |
| Notify | play a sound and show system notifications |
| Keys (API version 2) | receive the keys you press while its pane has the focus (never with Ctrl or Alt) |
| Sound (API version 2) | play music and sounds |

- When a plugin may read personal readings (program names, connections, network address, make and model, OS and machine name) and also reach a host, the consent says so outright: *It could send … to …*.
- Consent binds the plugin's id and its file or folder name. A different file that claims an id you agreed to for another is asked about again (*x.ts now uses the id you agreed to for y.ts*).
- Editing a plugin keeps your consent as long as it asks for nothing more. If it asks for more, it stops and waits (*It now asks for more than you agreed to*).
- The connections pane's socket table (`net.sockets`, which program talks to where) can never be granted to any plugin.

## What a plugin can reach

| | |
| --- | --- |
| Runs in | A Web Worker of its own, in the page's sandbox; the main process only transforms its text and never runs it |
| Draws with | Blocks the app renders in the theme: text, numbers, meters, charts, tables, lists, buttons. From API version 2, also a canvas of its own in the worker |
| Network | Only through the app, only to granted hosts: https only, exact host names (no wildcards, IP addresses or `localhost`), redirects only to granted hosts |
| Storage | Its own key-value store, kept by main (`plugin-data/<id>.json`, up to 1 MiB) |
| Keys | API version 2 only, while its pane has the focus, never with Ctrl or Alt, Tab or function keys; a KEYS lamp shows when it has them |
| Sound | API version 2 only, through elecdex's synthesiser from a fixed list of voices |

- A plugin has no access to the page, your files or the network. The page's content security policy (`connect-src 'self'`) is what contains it.
- A plugin that stops answering is stopped without holding up the app: its panes say *plugin not responding*, with a button to restart it.
- A plugin's settings marked secret are only masked on screen. They are stored in plain text in `settings.json` and given to the plugin as they are, unlike AI keys.

## Managing plugins

Each plugin has a row in *Settings → Plugins*:

| Part | What it shows or does |
| --- | --- |
| Status | *loading*, *error*, *needs a newer elecdex*, *duplicate id*, *off*, *needs your agreement*, *on* |
| Permissions | What it may do, in the words above |
| Settings | The plugin's own settings (text, number, switch or choice), with a description under each where it has one |
| *sign in to [host]* / *sign out* | For a plugin granted a session: opens its sign-in window, or deletes its session |
| *forget* | Turns the plugin off and deletes what it stored and its sign-in (asks by a second click) |

- A pane of a plugin that is off, removed or failing stays in the layout, showing the reason and a button that opens the settings; turning the plugin back on brings it back.
- A plugin removed from the folder keeps its consent until you *forget* it, so a save in an editor that briefly removes or renames the file does not turn it off.

## Where the files go

All in the app's data folder ([Where the files are](themes-settings.md#where-the-files-are)):

| Path | What it holds |
| --- | --- |
| `plugins/` | The plugins, one file or folder each. Created on first start with the pomodoro sample; once the folder exists, even empty, nothing is written into it again |
| `plugins/<folder name>/` | A plugin installed from a folder, under that folder's name |
| `plugins/elecdex-plugin.d.ts` | The API's types for an editor, rewritten on every start |
| `plugin-data/<id>.json` | What a plugin stored |
| `settings.json` → `plugins` | Per plugin id: whether it is on, what you agreed to, its setting values |
| `persist:plugin-<id>` | A signed-in plugin's own cookies, apart from the web panes'; deleted by *sign out* and *forget* |

## pomodoro

| | |
| --- | --- |
| Where | Written into a new plugins folder; source `examples/plugins/pomodoro` in this repository |
| Permissions | Notify (a chime and a system notification) |
| Settings | Focus (minutes) 25, Short break (minutes) 5, Long break (minutes) 15, Rounds before a long break 4, Start the next phase by itself off |

A pomodoro timer: focus sessions, short breaks and a long break every few rounds, with a VFD meter, a chime and a notification when a phase ends, carrying on across restarts. It makes no network requests. It can be brought forward as a panel.

## KEYSTREAM

| | |
| --- | --- |
| Where | `examples/plugins/keystream` in this repository; install it from its folder (it is not written into the plugins folder, as it asks for keys and sound) |
| Permissions | Keys and sound (API version 2) |
| Settings | Volume (%) 80; Timing offset (ms) 0, from −150 to +150 in steps of 5; Guide melody (your part played quietly underneath) off |

A rhythm game and the sample for the plugin API's second version.

- Letters fall down lanes that stand over the keys that play them, and typing each as it reaches the line plays the melody while the game plays the band.
- The home row is the white keys and the row above the black ones (the keyboard's stagger is a piano's), so every key always plays the same note.
- Twenty-one tracks, filed under four genre tabs (CLASSICS, POP, DANCE, ELECTRO) with stars for how hard each is and a preview of the one under the cursor. Each has a band written for it and a style word to pick by.
  - Thirteen are elecdex's own, among them a J-pop, a K-pop, an EDM, a city pop and a chiptune one, and an idol pop at 180 BPM and a J-core at 200 whose every beat falls on one key, so EASY is one key tapped in time.
  - Eight are tunes in the public domain in elecdex's arrangements: *Twinkle, Twinkle*, the frog round, *Ode to Joy*, *Swan Lake*, Offenbach's can-can, Mozart's Symphony No. 40 and *Turkish March*, and *In the Hall of the Mountain King*.
- Enter opens the chosen track's three levels on a panel over the list. EASY types only the notes on the beat and the game plays the rest; HARD narrows the windows and ends the play when the signal runs out. Space turns the preview off and on.
- The eDEX-UI on-screen keyboard is back as the judgement line.
- A play ends as a game ends a stage: the score counts up, the rank is slammed into its diamond and a lamp says how it went (CLEAR, FULL CHAIN, ALL SYNC or NO CARRIER), beside the best before it and how early or late the keys landed.
- The timing is one clock end to end: a key is judged by the moment the system received it, the band is scheduled to the moment it is heard, and the field is drawn a frame ahead, where it will stand when the frame is on screen, so a note reaches the line as it sounds. What is left is the player and their keyboard, and the result says what to do about it: when the hits ran late or early on the whole, it names the *Timing offset* to set (SET OFFSET +20), which the plugin's settings take.
- **FREE PLAY** makes the keyboard an instrument: keys sound while held, Space is the sustain pedal, Z X and C V change the octave and the strength as in a DAW's musical typing, the number row changes the instrument (on every screen, mid-song too), any track's band can go round underneath to play over, and the chord under your fingers is named as you hold it.

| Screen | Keys |
| --- | --- |
| Track list | ↑ ↓ track; ← → or < > genre tab; Enter opens the levels; Space preview on or off |
| Levels panel | ↑ ↓ or ← → level; Enter starts; Escape or Backspace goes back |
| Playing | Escape or Space pauses (then R retries, Q goes to the menu); ↑ ↓ change the falling speed. Play pauses when the pane loses the focus or goes out of sight |
| Any screen | The number row changes the instrument: 1 E.PIANO, 2 PIANO, 3 GUITAR, 4 SYNTH LEAD, 5 CHIP, 6 ORGAN, 7 MARIMBA, 8 E.BASS, 9 PAD, 0 PLUCK, - SYNTH BASS |

Judgement windows are SYNC ±40 ms, LOCK ±80 ms and ACK ±120 ms; HARD narrows them to three quarters.

The instruments are worked out on the audio thread as they play; none is a recording.

- Its piano is a physical model: stiff, stretched strings in pairs and threes that beat and die away in two stages, a felt hammer that plays brighter the harder it lands, the clang of a hard blow in the bass, a soundboard and a room, and, with the pedal down, the strings nobody struck ringing along.
- Its lead guitar is played on the string and fret a player would use, through a pickup, an overdriven amplifier worked out at four times the sample rate and a speaker cabinet: held into the next note it hammers on or slides, held on it bends into vibrato and feeds back.
- The other voices: an electric piano whose pickup makes a hard note bark, drums as the classic drum machines' circuits make them, an old console's sound chip, analogue synthesisers with a transistor-ladder filter, a tonewheel organ into a rotating speaker (the sustain pedal is its speed switch), a marimba and a fingered electric bass.

## Writing a plugin

The API and its rules (the descriptor, blocks, `ctx`, permissions, network, storage, canvas, keys and sound) are in [docs/plugins.md](../plugins.md), written for developers, in Japanese. The two samples above are its worked examples. Personal plugins, or ones that use unofficial APIs, belong in your own plugins folder, not in this repository.

See also: [Themes and settings](themes-settings.md) · [Keyboard and layouts](keyboard.md) · [Develop](develop.md)
