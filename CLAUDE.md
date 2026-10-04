# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a sci-fi
terminal emulator and system monitor — on Electron 44, Svelte 5, TypeScript 7 and xterm.js 6.
GPL-3.0, like the original; the version is in package.json, and releases are pre-releases.
It is developed and used on Windows; macOS and Linux have only been run by the e2e tests on GitHub
Actions and are **not sufficiently verified** - the README says so, and must go on saying so until
someone has used them by hand.

This file is the index of the rules that must not be broken, and where each one lives. The design
is in [docs/architecture.md](docs/architecture.md), every decision with its reason and measured
numbers in [docs/decisions.md](docs/decisions.md) (both Japanese), plugins in
[docs/plugins.md](docs/plugins.md). **Read the section named by a rule before changing that
subsystem.**

## Commands

```bash
npm ci                 # install; postinstall downloads Electron and fixes node-pty on macOS
npm run dev            # electron-vite dev server + app; npm start is the same
npm run verify         # biome lint + typecheck (node, e2e, web) + vitest
npm run build          # production bundle into out/ (the e2e tests run against this)
npx playwright test    # end-to-end tests against out/ — run `npm run build` first
npm run package:dir    # unpacked app in release/win-unpacked (or mac/linux equivalent)
npm run gen:icon       # build/icon.svg -> build/icon.png + resources/icons/icon.png
npm run gen:card       # README banner: public/elecdex_repo_card.svg
npm run gen:geo        # globe land points, country centroids, time zone table
npm run gen:cities     # weather picker city list (GeoNames)
npm run gen:orbit-map  # ORBIT map: land dots, and time zone lines (timezone-boundary-builder, ODbL)
npm run gen:chip8      # CHIP-8 library + previews: resources/chip8/programs.json (--archive <dir> to update chip8Archive)
npm run gen:elec16     # ELEC-16 ROM: BASIC (e16c) -> basic.s, rom/*.s -> rom.json; soft/ -> soft.json
npm run gen:screenshots # README screenshots in a demo profile (Windows; build first)
npm run demo:elec      # drives the ELEC pane for a screen recording (Windows; build first; --alone)
npm run demo:full      # the whole app for a screen recording, windowed (Windows; build first; --probe)
npm run demo:dev       # AI AGENT + GIT at work, then ORBIT, for a recording (Windows; build first; --probe)
npm run demo:presets   # the layouts dialog stepping through every preset, for a recording (Windows; build first; --probe)
npm run demo:shorts    # the same in a tall 9:16 window, layouts in 2 or 3 tiers (--tiers=2|3; Windows; build first)
npm run demo:wifi      # the Wi-Fi pane on the train stub, 9:16, cards opening on the way (Windows; build first)
npm run demo:panes     # DOCKER, CLIPBOARD, NOW PLAYING and UTILITY at work, 16:9, under 30 s (Windows; build first)
npm run demo:tour      # the introduction video: boot, presets, ORBIT, agents, Docker, media, ELEC, themes (Windows; build first)
npm run demo:tour-shorts # the same tour, 9:16 in two tiers, under 2 min, for Shorts (Windows; build first)
npm run demo:keystream # KEYSTREAM: menu previews, a track typed on time through instrument changes, its result (Windows; build first)
npm run demo:snippets  # the clipboard pane's snippets: kept, written, moved, pasted into the shell, 16:9, under 30 s (Windows; build first)
npm run demo:whatsnew  # what v0.0.19-v0.0.20 added, most striking first: CHIP-8, files in the ai preset's chat, dev's agent tree and FETCH/PULL, 16:9 (Windows; build first)
npm run demo:elec16    # the ELEC-16 alone, 1280x600: BASIC, the SOFT CARD, CODE, the skins (Windows; build first)
node scripts/eleclance-art.mjs           # ELECLANCE's pictures drawn afresh (overwrites its PNGs, the source)
node scripts/sync-calc.mjs <elecxzy>  # overwrite the vendored calculator from an elecxzy checkout
node scripts/instruments-wav.mjs [dir] [voice]  # the plugins' instruments to WAV files, to listen to
```

Single tests: `npx vitest run tests/unit/<file>.test.ts`,
`npx playwright test tests/e2e/<file>.spec.ts -g "<name>"`.

App flags: `--windowed` (not fullscreen), `--no-intro` (skip the boot sequence). Electron flags go
after a second `--`: `npm run dev -- -- --windowed --no-intro`.

**Install scripts:** Electron 44 has no install script of its own and downloads its binary on
first `require('electron')`, which electron-vite bypasses — so `postinstall` runs
`install-electron`. If `npm run dev` fails with "Electron uninstall" (e.g. after
`--ignore-scripts`), run `npx install-electron`. npm 11 blocks dependency install scripts until
approved; none are needed on Windows/macOS, but Linux must approve node-pty to compile it.

## Layout of the code

```
src/main/        main process: window, ipc/ (handlers, table.ts), store/ (json files), pty/, fs/,
                 weather/, markets/, feeds/, quakes/, orbits/, clipboard/, media/, ai/, agents/, git/,
                 chip8/, launcher/, audio/, plugins/, web/, background/, reminders/, updates/, awake/,
                 docker/, secrets/, metrics/ (the broker between the collector and pages),
                 boundary-timer.ts (readings on the wall clock's grid)
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/: sockets/, wifi/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas (schemas/), channel names and pure logic used by both sides;
                 calc/ (vendor/ is elecxzy's evaluator, the wrapper beside it is ours)
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/ (builtins.ts is the
                 registry), plugins/ (host, plugin pane, blocks), stores/, styles/, lib/
examples/        plugins/pomodoro: the sample plugin written into a new plugins folder;
                 plugins/keystream: the API 2 sample (canvas, keys, sound), a rhythm game
tests/           unit/ (vitest, node), component/ (jsdom), e2e/ (Playwright _electron; support.ts)
scripts/         asset generators, sync-calc, fix-node-pty
docs/            architecture.md, decisions.md, plugins.md (the plugin API), weather-providers.md,
                 emu.md (the emulators' shared base), elec16.md (the ELEC-16 pane),
                 elec16-basic.md, elec16-e16.md, elec16-e16c.md, elec16-soft.md (its manuals),
                 elec16-play.md (the game model ELEC-16 PLAY), elec16-play-manual.md (its user's
                 manual), elec16-kit.md (making its games), elec16-eleclance.md (the sample game),
                 screenshots/ (README images)
```

## Rules that matter

Each rule names where its design and reasons are: a section of architecture.md (§n), plugins.md,
or the decision log, [docs/decisions.md](docs/decisions.md). "User decision" marks a choice the
user made; do not reverse one without asking.

### Boundaries

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node) with
  CSP `connect-src 'self'`: no network, no filesystem. Everything goes through `window.elecdex`
  (src/shared/api.ts, src/preload/index.ts). Main validates every input (zod or explicit checks).
  Never expose a generic channel, a path-taking "run" or raw `ipcRenderer`. The launcher launches
  by opaque id from main's own catalog, never by path. A main module's channels are one
  `registerTable` table (main/ipc/table.ts, §4.1), so dispose never lists them again; a single
  board's pages are a `PageSubscribers`.
- **Network lives in main**, never the renderer: weather (docs/weather-providers.md; follow each
  service's terms), markets, RSS, earthquakes and tsunamis (only while alerts are on or a quakes
  pane is open, only for the chosen source), CelesTrak orbital elements (§5.10: only while an
  ORBIT pane shows the set, at most the stations twice a day and Starlink once, kept on disk,
  nothing for a day after any answer but a 200). Positions are computed in the page (SGP4); no
  service is asked where something is. Fetch only while a pane needs the data, batch, back off on
  failure, keep the last good data on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols, feed URLs, the quake
  list, every pane board) are reference-counted in preload and main, and dropped on reload and
  destroy through `whenPageGoes` (main/ipc/page-gone.ts) - never a module's own page listeners.
  A page store shared by panes starts and stops with `refCounted` (lib/ref-counted.ts), whose
  release counts once. Polling stops when the last subscriber leaves (e2e asserts it). Each
  module's `watching()` diagnostic (§4.1) answers a sorted `string[]`, empty when idle.
  - A pane in a background tab holds only its widget's `keepWhileHidden` sources (builtins.ts):
    the ones it charts, and once-only ones. List a new charted source there.
  - Everything else a pane subscribes to, or writes on a timer or pulse, is taken only while it is
    `seen` (stores/window-state.svelte.ts), keeping what it showed. Only a shell, an answer being
    written, a timer or alarm, quake alerts and plugins (`ctx.views`) go on unseen.
  - tests/e2e/hidden-panes.spec.ts checks every built-in pane behind a tab and in a minimised
    window; a unit test holds its list to builtins.ts.
- **The connections pane reads the kernel, not the network** (src/services/metrics/sockets/, one
  file per platform behind `RawSocket`). Peers are placed with the bundled GeoIP database, never a
  lookup service. `net.sockets` is the one reading a plugin can never be granted: every metric
  source goes into `PLUGIN_METRIC_SOURCE_IDS` or `PRIVATE_METRIC_SOURCE_IDS` deliberately (a
  unit test checks).
- **The Wi-Fi pane reads nothing behind the location consent** (§5.12, shared/wifi.ts,
  services/metrics/wifi/). No BSSID and no scan, on any platform (user decision 2026-09-25): on
  Windows never WlanGetNetworkBssList, WlanGetAvailableNetworkList, WlanScan or
  WlanQueryInterface opcode 7 (a unit test holds the script to it); on macOS never CoreWLAN. Only
  the named event-log fields leave the script.
  - One echo round serves the network status pane and this one, pinged in the collector, never
    in main.
  - `net.wifi` and `net.wifi.events` are private and not kept while hidden. Judgements are pure
    in shared/wifi.ts. Every `data-hint` figure has a card in widgets/wifi/hints.ts quoting
    `WIFI_LIMITS` (a unit test checks).
- **The clipboard pane reads only while it is seen** (§5.14, shared/clipboard.ts,
  main/clipboard/). Main reads (Electron's async API, never the page) on the quarter seconds,
  only while a pane is subscribed and not paused; what is copied unseen is never kept. The
  history is main's memory only; the page gets previews and puts back by id; no plugin API.
  - A copy marked private (`privateMark`) is recognised from its formats alone; its text is never
    read. Keep that list of formats in one place.
  - Decisions are pure (`recordRead`); a selection is absorbed only between looks in a row.
  - Snippets (shared/snippets.ts) are the one thing it writes, to `snippets.json`, only what the
    user kept. A history entry becomes one by id, so its text and formatting never pass through
    the page; the editor asks for one text by id. COPY goes through the watcher (`put`), not into the history (user
    decision 2026-09-27); main says which rows are kept and which snippet is on the clipboard.
  - Tests: `ELECDEX_CLIPBOARD_STUB=1`, copy through `globalThis.__elecdexClipboard`.
- **The NOW PLAYING pane reads only while it is seen** (§5.15, shared/now-playing.ts,
  main/media/). Main reads the media session (Windows: SMTC through one long-lived PowerShell) on
  the half seconds while subscribed; not a metric source, no plugin API, nothing logged or
  written. The page may press only previous, play/pause and next, and seek where the player takes
  a position (never the volume), only while subscribed; a bar the player cannot seek does not look
  draggable. Art is made small in the reader and passed as a checked JPEG data URL; the card's
  larger copy stays in main until a card opens.
  Decisions are pure (`readSession`, `positionNow`, `appLabel`). Tests:
  `ELECDEX_NOWPLAYING_STUB=1`, `globalThis.__elecdexNowPlaying`.
- **The UTILITY pane** (§5.16, shared/utility.ts, shared/codec.ts, main/awake/): small tools in
  `UTILITY_MODULES`, never panes of their own; each starts with the user's action, runs in main
  through what is already there (no process per action), uses no network, reads nothing behind a
  consent, and is out of the plugin API.
  - AWAKE: `powerSaveBlocker` only, OFF / SYSTEM / DISPLAY. The hold is main's (`AwakeService`,
    `awake.json`), never pane state, and goes on with no pane open (the status bar and tray say
    so); its end waits on one `setTimeout`, rechecked on `resume`, never a tick.
  - Copies go through main (`utility.copy`). A Wi-Fi password is kept only sealed (`utility.seal`,
    safeStorage, purpose-checked by `unseal`), unsealed only while its code is shown, never in
    plain. CODEC's input is never written.
  - A QR code is dark on light, in theme colours only when contrast holds (`qrColours`); a test
    reads every theme's code back.
  - Tests: `ELECDEX_AWAKE_STUB=1`, `globalThis.__elecdexAwake`.
- **The DOCKER pane talks to the engine only while it is seen** (§5.17, shared/docker.ts,
  main/docker/). Engine API over node `http` on the socket, pipe or loopback TCP - never the CLI
  or a client library - found by reading files as the CLI does; never a remote, TLS or ssh
  engine, and the page cannot name one.
  - While subscribed: one event stream, the list at the next quarter second after an event and
    on the ten seconds (user decision 2026-09-27), usage on the five; one timer each. Nothing
    written or logged.
  - The page gets short ids and only what row and card show (labels: Compose project, service,
    folder; never command, mounts or env).
  - Presses: start, stop, restart, pause, unpause only - never remove, kill or prune - on a
    container of the last listing, in a state that takes it, from a page that shows it. Not a metric source; no plugin API. Rows never move by state.
  - Tests: `ELECDEX_DOCKER_STUB=1`, `globalThis.__elecdexDocker`.
- **The CHIP-8 pane** (§5.18) runs our own TypeScript machine on 2D canvas - never WASM or eval.
  - `shared/chip8` imports only itself and `shared/emu`; `shared/emu` nothing; neither touches the
    DOM, Node, timers, the clock or `Math.random` (emu-boundary.test.ts holds them). A pane wraps
    them and never reaches in. A later emulator takes the same shape (docs/emu.md) and shares
    `shared/emu` and the page's `widgets/emu`, never another machine's folder; `widgets/emu`
    knows no machine. Extract a shared part when a second machine needs it, not before.
  - Octo is the reference: every platform runs every instruction, the platform decides only
    memory and quirks, and the keys are Octo's (arrows and Space are pads 5 7 8 9 and 6). Timendus's chip8-test-suite must pass on
    all three platforms (chip8-suite.test.ts): a change that moves a fixture is checked against
    the suite's README, not re-recorded.
  - Presses blink (lib/blink.ts), appearing and going use `crt-on` / `crtPower`, lamps `pulse`.
  - Its game loop runs on the emulators' runner (`EmuRunner`, widgets/emu/runner.svelte.ts), the
    one exception to the 10 fps loop (widened from CHIP-8 to every emulator, user decision
    2026-10-03): only while running and `seen`, paused out of sight. When to tick is the machine's
    policy; CHIP-8's is rAF while the screen moves, a 60 Hz timer once still.
  - Keys reach the machine only while the pane itself has focus (a press on its buttons hands it
    back). ROMs come from main by id (`chip8.list`, `chip8.rom`);
    programs.json is written only by `npm run gen:chip8`.
  - What the user keeps is main's (`chip8/library.json`, save files), never pane state, only for
    library programs, snapshots checked by the core's decoder and taken up only for the machine
    they were made on, with today's tuning. Imports go through main's picker, size
    checked first. AUTO is written when play stops (never on a timer, only if it moved). Changes
    broadcast `chip8:changed`; the page's library is replaced whole.
- **The ELEC-16 pane** (§5.19, docs/elec16.md) is designed and built phase by phase: read
  elec16.md before working on it, and its section 15 (how a change is made, the test helpers,
  the traps met so far) before changing it.
  - Its user manuals, in Japanese, are docs/elec16-basic.md (BASIC), docs/elec16-e16.md (the
    ISA, the assembler, the monitor, ROM services), docs/elec16-e16c.md (e16c and CODE) and
    docs/elec16-soft.md (the SOFT CARD's programs), linked from all three READMEs. A SOFT CARD
    program has a .help beside it (English, what FILES shows when it is picked; gen:elec16
    refuses one without). A change a user can see in BASIC, the instruction set, the
    assembler, the monitor or e16c updates its manual in the same commit, as elec16.md; every
    example in a manual runs (check it on the core). An original machine only: no third-party ROM, font, BASIC
  dialect, trade dress or real model name in what is published (user decision 2026-10-03).
  - The encoding lives once, in shared/elec16/isa.ts; the assembler, disassembler and CPU read
    it, and a test round-trips every instruction (every 16-bit encoding). One encoding, one
    meaning: a do-nothing form is illegal, not a second spelling.
  - MCPY and MSET (block copy and fill) move at most `BLOCK_STEP` bytes and run again from the
    same address with their registers moved on, so an interrupt or BRK is never held up by a
    long block; e16c's `memcpy` and `memset` are one instruction each.
  - The ROM is hand-written E16 assembly (resources/elec16/rom); its font, key table and I/O
    addresses come from shared/elec16 (font.ts, keys.ts, bus.ts) through rom.ts, never copied
    into the assembly. `npm run gen:elec16` writes rom.json; a test holds it to the sources.
  - BASIC is e16c TypeScript (rom/basic/*.e16.ts); basic.s is e16c's -O2 output
    (`compileBasic`), written only by `npm run gen:elec16`, never by hand. Its function names
    share the ROM's labels. A function only assembly calls is exported (-O2 drops the rest).
  - e16c code runs alike as TypeScript and on the machine: `as` only widens; a change of
    reading is `u8()`, `u16()` or `i16()`. A miscompile gets a function in
    tests/fixtures/e16c/sample.e16.ts that shows it. tests/unit/e16c-fuzz.test.ts runs seeded programs five ways (TypeScript,
    the interpreter, -O0, -O1, -O2); before changing e16c, run it with E16C_FUZZ_SEEDS=2000.
  - BRK is a line of its own (IRQ 15), not a key in the FIFO: it always gets the machine back.
  - A unit (its RAM and card) is main's (main/elec16/units.ts); one pane runs it at a time, by
    claim. Its battery backup is the core's snapshot, written only when the pane is hidden or
    closed, the machine is switched off or the page goes - never on a timer. The core never
    touches the card: it makes a request, the page passes it on, main does it (`cardOp`).
  - BASIC's second half lives in ROM banks 0-3, the monitor's U and B in 4, ASK in 5 (`BASIC_SOURCES`);
    a bank's strings are read only in that bank. String variables have a fixed room: no
    garbage collector. B writes C.EBREAK into RAM code only while G runs it. The fixed ROM is
    nearly full: a new statement goes in a bank. A keyword is only ever added at the end of
    `KEYWORDS` (a program keeps tokens) and becomes a reserved word (the BASIC manual's appendix).
  - What a snapshot keeps is the unit's battery backup: a change to it bumps
    `SNAPSHOT_VERSION` and still reads every older version (a unit comes back with its RAM, the
    new part as a new machine's); a version's layout never changes once pushed.
  - The LCD is drawn at the machine's resolution, scaled crisp by CSS, the gaps a grid drawn
    once - never at device pixels - and at most thirty times a second (`drawMs`; measured).
  - CODE compiles in a blob worker (`?worker&inline`, CSP unchanged); a person's code runs only
    as E16 code on the core, never as JavaScript. Only the worker and tests import
    shared/e16c/program.ts (it pulls in TypeScript's parser); the page reads code-area.ts.
  - The body follows the agreed mock (name plate but on Business and PLAIN, key layout, key
    tops) and is never stretched: `deviceFit` sizes it, the pane's room goes round it. PLAIN
    draws no case (`bare`) and a flat screen (`lcd.flat`), every colour the theme's.
  - LINK (FF70-FF7E, elec16.md section 12) is the machine's only way out: it names a service
    of main's by number (the AI is 0; another is a `LinkService` in main/elec16/link and a line
    in link-services.ts, never code in the core, the page or the ROM). The core makes a request,
    the page passes it on, main answers - only for the page that holds the unit, nothing while
    LINK or that service is off in the panel's LINK (LINK on, the AI off, CART on by default;
    an old single switch is the AI's, `linkSettings`). A SEND goes only after a person's action since the last (HELD
    otherwise: PASTE's keys do not count), one at a time a unit, the answer capped, 60 s. The
    AI uses the AI settings' providers and keys (a key never reaches the page or the machine;
    a provider with none may be chosen); its answer reaches the machine only as the LCD's
    characters (`lcdReply`), and everything else - dictionary, translation, search, weather -
    is the model's (search on the provider's side, user decision 2026-10-04). A machine waiting
    for main (LINK, the card) is not at its prompt: the runner neither counts auto power-off
    nor tells CODE's RUN it is there. A device line enabled by the ROM is put back
    (`MIE_LINES`, mie at the monitor's way in).
  - The SOFT CARD (resources/elec16/soft) is written into soft.json only by `npm run gen:elec16`
    (a test holds it and runs every program); main lays it read-only over every unit's card
    and never writes it. PASTE and LOAD ▸ type through the key FIFO (`pasteKeys`), never
    into RAM.
  - PLAY-320 (docs/elec16-play.md) has what is new alone - extended RAM, video, the pad, the
    cartridge slot - by model data (`xramMax`, `video`, `pad`, `cart`, `drawHz`, `rom`), and
    tests hold every other model as it was. Its ROM is resources/elec16/play (no BASIC, no
    monitor), sharing link.s with the pocket ROM. A cartridge's ROM never goes in a snapshot:
    the page puts it back from main's shelf by hash. The game shelf is main's
    (main/elec16/games.ts), apart from CHIP-8's in every file, channel and list; games.json is
    written only by `npm run gen:elec16`. A press is a button PADHIT marks that was up at the
    last look (a tapped key is often down and up between two).
  - Its game kit (elec16-play.md section 10, shared/elec16/kit, games/lib) builds a game with
    `sources` in its game.json: code copied into RAM 2000-6FFF, data in banks, constants in a
    generated `assets.e16.ts` and e16c's output kept as `compiled.s` (neither edited). Code given a bank runs in the window and never
    moves it. A sprite's palette field is 0-7 for slots 8-15. Pictures are PNG in exact palette
    colours; music is the kit's MML, effects on channels 12-15. ELECLANCE
    (docs/elec16-eleclance.md) is its sample: its PNGs and stage.txt are the source once
    scripts/eleclance-art.mjs drew them; a test holds every song's channels in step.
  - GAMES ▸ DEVELOP (elec16-play.md section 11, docs/elec16-kit.md, main/elec16/devgame.ts):
    main picks a game's folder, keeps it per page and reads only the files game.json names,
    inside it; the build runs in CODE's worker, never in main; main writes back only
    assets.e16.ts and compiled.s, and a new game's template (resources/elec16/kit-template, a
    test builds it) only where no game.json is. A build replaces its own id on the shelf,
    never a bundled one; no automatic START (CART needs a person's action).
- **No location prompts.** Chromium permission requests are denied except clipboard
  (main/window.ts). On Windows never call `si.networkInterfaces`, `si.wifi*` or similar (they run
  `netsh wlan`).
- **Audio capture stays out of the workspace.** Loopback capture is granted only in the hidden
  capture window (main/audio/capture-window.ts: own session, report-only preload, no network);
  only spectrum levels leave it. Linux uses `parec` on `@DEFAULT_MONITOR@`, never the default
  input; pulse protocol first, wpctl only as fallback. Code meaning "the elecdex window" asks
  `appWindows()` (main/app-windows.ts), never `BrowserWindow.getAllWindows()`, so the capture
  window is never taken for it.
- **Web panes** (§5.4) are WebContentsViews main owns, one per pane id - never an iframe or
  `<webview>`.
  - A site is a preset in `WEB_PRESETS` (shared/web.ts), optionally with a `userAgent` or
    `unlisted`; never a widget.
  - All share `persist:web` and nothing else does; no preload, no permission but clipboard write
    and fullscreen, no downloads, http(s) only.
  - Only the television pane signs in, through Google's device flow; never disguise the pane as
    Chrome.
  - Each mount claims its view with a token and opens it once per mount.
  - Anything drawn over panes registers with `coverWeb`; dialogs, drags and CRT transitions hide
    views behind a snapshot. A view leaves HTML fullscreen before it is put away.
  - Main tells the page its `color-scheme`; the theme tint is off by default (`web.tint`).
- **Plugins** (docs/plugins.md) run in a blob Web Worker each; main only transforms their text.
  - Everything a worker posts is checked (shared/plugins.ts); every request, redirect, storage
    write and notification is checked in main against the grant in settings.json, never against
    what the renderer says a plugin asked for. Consent binds
    the plugin id and its file or folder name. The host re-checks sizes even where the runtime
    does.
  - `stripGlobals` and `pluginRuntime` (shared/plugin-runtime.ts) are source text and refer to
    nothing outside themselves. The page CSP (`connect-src 'self'`, no `unsafe-eval`,
    `worker-src blob:`) is the real containment: relaxing it means
    re-auditing plugins. A background service learns whether its panes are open from
    `ctx.views`, counted in the worker.
  - Plugins draw only through blocks: add one to plugin-api.ts, the schema and Blocks.svelte
    together. plugin-api.ts is types only and is the public API (update docs/plugins.md).
  - Install from a folder (main/plugins/install.ts): main opens the picker; only the module graph
    from the entry is copied; resolution mirrors shared/plugin-runtime.ts - change both.
  - API 2 (plugins.md §13): canvas is 2D OffscreenCanvas, new per mount (`epoch`); `ctx.animate` only
    while the pane is visible and the window on screen. Keys only while the pane has focus, never with Ctrl/Alt/system key, Tab or function
    keys (`keyFate`), with the KEYS lamp. Sound is the page's synth from a fixed voice list; bound
    notes, `hold` and sustain are the host's. Keys and sound are grant-checked and need
    `apiVersion: 2`. Times cross as epoch milliseconds.
  - The `piano` voice (plugins.md §13.8) is physics and textbook curves, never a recording or
    sample. The physics is pure (worklet, tests and the script run the same code); listen through `node scripts/instruments-wav.mjs` after changing it.
  - Personal or unofficial-API plugins live in the separate private repository, never here. The
    committed samples are pomodoro and KEYSTREAM. The private repository deploys with its own
    `npm run deploy`.
- **The AI chat pane** (§5.7, shared/ai.ts, main/ai/). A provider is an address and a dialect
  (OpenAI-compatible or Anthropic's SDK, lazily imported); add a service to `AI_PRESETS`, not code.
  - **A key never reaches the page**: sent once (`ai.setKey`), safeStorage-encrypted into
    `ai-keys.json` (never settings.json). The page learns only whether one is held; held dots are
    a placeholder, never a value, and "show" only shows what is being typed. Asking decrypts
    nothing. No key over plain http beyond the local
    network (`keyMayTravel`); no redirects followed.
  - The conversation and the answer being written are main's (`AiChatService`): snapshot then
    deltas; a delta that does not fit is a resync. An unfollowed answer stops after a few seconds.
  - A provider is asked only on send, test, or the model list - never on mount.
  - **The conversation is never cut; what is sent is** (`chatWindow`, pure, main only). The window
    is the provider's (`contextTokens`; by its address when unset), in estimated tokens (never
    characters), cut rarely and by a lot, place kept in `Chat.context` -
    never a per-turn sliding window. Provider token counts correct only upwards. The pane shows
    `NOT SENT`.
  - Summaries (`ai.compact`, off by default): asked for at a cut as part of the send (once more
    next send if empty), never after an answer or on a timer; placed after the system prompt,
    never as a message; held to `summaryRoom`; their failure costs only the summary. `SUMMARISED`
    shows the text.
  - A model's text is untrusted: drawn from lib/markdown.ts's tree, never as HTML.
  - The Anthropic adapter follows the claude-api skill (capabilities from the Models API,
    `stop_reason` first, thinking summarized and never replayed, fallbacks only on Anthropic's
    endpoint).
  - The link vocabulary never hides what the user must read: an end code always has the
    provider's words beside it, not in a tooltip. Failures are one set (`FAILED`, read by colour
    and sound); add a `ChatStop` deliberately. Caret and lamp step with lib/pulse.svelte.ts, not a
    CSS animation. The badge stays in words.
  - **Attached files** (§5.7, shared/ai-attach.ts, main/ai/files.ts) reach main as bytes, never a
    path, and no channel takes one. Main judges by first bytes; images are decoded and re-encoded
    in the page, never in main, which reads only their headers. Main's judging stays linear in
    the file's size (a crafted PDF or PNG once held it for seconds).
    Waiting files are main's memory under `filesDraft`; sent, they are written beside the chat
    (`<chat>.files/<sha256>`) first. Too-long text is refused, never cut. PDFs only to Anthropic
    and `pdf` presets (`takesPdf`), else refused or named in the history - never dropped unsaid.
    Files count in `chatWindow` and are cut with their message.
  - No tools, MCP, branching or prompt profiles (user decisions 2026-09-20/21). Do not add them
    without asking: a model that can start processes or read files needs a consent design like
    the plugins' first. The model never reads a file of its own accord.
- **The git pane** (§5.9, shared/git.ts, main/git/) reads, and writes only FETCH and PULL (two
  presses each); never stages, commits, checks out, merges or rebases. Repositories are chosen
  through main's picker and known by id (`git-repos.json`), so a layout carries no path; a pane
  is tied to no other pane.
  - FETCH/PULL live in main/git/sync.ts, apart from the reading GitService; a later write (a push)
    goes there too. PULL is `--ff-only` only (user decision 2026-09-30);
    diverged, it refuses. No hook runs (`core.hooksPath` is main's empty folder). `syncBlocked`
    is checked against main's own reading, one at a time per repository, only for a page showing
    it.
  - git always runs with `GIT_FLAGS` (main/git/run.ts) and the diff flags; repository filters are
    emptied (`filterGuard`); submodule trees are not read; `--no-optional-locks`.
  - Without an open command, a file that would run (`runsWhenOpened`) is revealed instead.
  - Diffs only for files of the last reading; open/reveal only inside the tree (`locate`).
  - `git.openCommand` is set in settings.json only, never by settings.patch; run as program and
    arguments, never a shell; `.cmd` via `cmd.exe` only with safe arguments (main/git/open.ts).
  - The graph is asked for by the page (`git.log`: scope and count only), re-read when
    `historyAt` moves, laid out by `graphRows` (shared/git-graph.ts); its hover card stays in the
    pane.
  - Watched only while shown, read at most once a second; git's own bookkeeping is not a change.
  - File text is untrusted: highlight tokens drawn as text (lib/highlight.ts), never HTML.
- **The AI AGENT pane** (§5.11, shared/agents.ts, main/agents/) is experimental and only reads
  agents' local records - never sends, never runs them.
  - The page talks to `AgentHub`; an agent is an `AgentSource` (main/agents/source.ts) plus
    `AGENT_SOURCE_IDS`, never code in the pane.
  - Claude Code records are read only while a pane is open, incrementally; over 32 MB from the
    last 512 kB, marked partial. Never parse a whole record on a change, nor a line that is not the
    model's own except a task's ending notice or a waiting call's result (matched by id in the
    record's own quotes).
  - Subagents and background commands are a session's tasks, ended by `<task-notification>` (an
    interim one ends nothing), TaskStop or their own result; a subagent is read from its own
    record under `<session>/subagents/`; still running when the session went is `unknown`, never done.
  - Tests never read this machine's `~/.claude` (`ELECDEX_CLAUDE_DIR`).
- **The ELEC system pane** (§5.8, shared/elec.ts, main/ai/elec.ts) runs a motion past LOGOS, ETHOS
  and PATHOS on the AI chat's providers, under the same rules; settings in `elec`, of which a
  deliberation keeps its own copy; the page sends only the motion.
  - A vote is the answer's last `VERDICT` line (`readVote`), never structured output. Invalid is
    not abstention; CONFIDENCE is shown, never counted; the resolution is computed (`resolve`), never stored.
  - Seats on one local server are asked in turn, hosted ones at once; round two cuts the others'
    statements to `statementRoom`.
  - Never name MAGI or its source (user decision 2026-09-21).
  - **One geometry** (widgets/elec/geometry.ts): change a plate there, never a coordinate in Stage
    or Effects (a unit test holds plate height and area).
  - **Its light** (pure, widgets/elec/light.ts) moves only while the council sits or once for an
    event; packets are traffic (`nextPackets`), never a loop. The resolution waits for the dark
    (`HOLD_MS`; `held` is marked while the council sits), unless it was unwatched or motion is
    reduced. The floor stops by holding its phase, not by pausing its animation.
  - Animate opacity and transform, **never a colour in keyframes**; never dim a plate by opacity -
    thin its colour towards the ground.
  - Removed and not to return without asking: convergence with a shock wave, orbits round the
    core, a radar (user decisions 2026-09-21).
  - **It runs at the display's rate** (user decision 2026-09-21, ~70% of a core while sitting):
    never move it to the 10 fps loop. The pane is not in the default layout.
- **The vendored calculator is never edited.** `src/shared/calc/vendor` is elecxzy's (MIT), out of
  tsconfig and biome; what elecdex needs goes in the wrapper; `scripts/sync-calc.mjs` overwrites
  the folder.
- **Desk data lives in main.** Notes, tasks and alarms are main's files; a pane keeps only display
  choices and ids. Reminders wait on one `setTimeout` (src/main/reminders), never a poll.

### Performance

- **Measured, not assumed.** The idle budget is enforced in tests/e2e/metrics.spec.ts. Record
  measured numbers in docs/decisions.md when a decision depends on them.
- On Windows never spawn a process per reading: frequent readings go through `WindowsSampler`.
- **`spawn` is synchronous on main**, and Windows scans a PowerShell script in its command line:
  hand PowerShell its script in an environment variable (`powerShellStart`, `ELECDEX_PS_INIT`),
  and time the `spawn` of any new PowerShell start.
- Animations share the 10 fps frame loop (lib/frame-loop.ts), never their own rAF loops. The loop
  marks the page `data-offscreen` and tokens.css zeroes `--motion-scale`; main sends
  `WindowState.hidden` for a hidden or minimised window.
  - An animation outliving its frame takes `animation-play-state: var(--ambient-play-state)`
    after its `animation` shorthand, in every rule that sets the shorthand.
  - The loop only draws; what must happen at a moment waits on its own `setTimeout`.
  - No `will-change`, and no `forwards`/`both` fill on what stays in the page (styles/crt.css
    too).
- Weigh a new animation by the area it repaints.
- Other timed updates wake on wall-clock boundaries through `onBoundary(period, …)`, never a timer
  of their own or an unaligned `setInterval`. Assign `$state` only when the shown value changes.
  In main, a reading on the grid is a `BoundaryTimer` (main/boundary-timer.ts), never a timer
  armed by hand.
- **GPU contexts are a budget** (Chromium keeps about 16 WebGL contexts): only the shell and the
  globe take one, and give it back on unmount (`forceContextLoss`, `releaseWebglContexts`).
  Everything else is plain 2D canvas. **No WebGPU** (user decision 2026-09-19).

### Panes and layout

- **Layout state** is a persisted tree; every change goes through a pure op in
  src/shared/layout-ops.ts. Widgets change their pane state only with
  `widgetState.patch(paneId, change)` (stores/widget-state.svelte.ts; undefined removes a key) -
  never `layout.patchPaneState` or spreading `state` into `setPaneState`. A tabbed pane is split,
  moved beside or dropped on through its group, and a group holds only panes, of any widget.
  Nested groups are postponed (user decision 2026-09-17). Splits carry no header; the shell's
  TERMINAL header stays, as the group's drag handle and the path. Pane moves are tested at unit,
  component and e2e level: extend those.
- **A popped-up pane is never in the layout** (§5.13, layout/popup.ts): held in `ui.popup` as one
  of the dialogs (opening any dialog puts it away; it counts in `dialogOpen`), drawn by
  PopupPane.svelte, never saved, nor its choices. Offered only for `popup: true` widgets (not the
  shell, timer, file browser, CHIP-8, web pages or plugins), which must reach nothing of the
  layout store (a unit test reads them). Only the weather place picker opens over a popup
  (`OVER`). The launcher's shortcut pops one up when the layout has none. A widget ends its popup
  through `ondone`, never by knowing it is in one. A summoning shortcut is a line in `SUMMONS`
  (layout/summon.ts) with its chord in keybindings.ts; `summonChoice` decides where it goes and
  the widget answers via `onSummoned` - never a branch for one widget in the shared part, nor a
  flag of its own in `ui`.
- **Remounts happen.** Moving a pane remounts its widget: keep what must survive in pane state or
  main (a shell reattaches to its session).
- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY (ConPTY rewraps
  history; see the remount regression test).
- **Saved layouts** (§5.6, src/shared/layouts.ts). `layout.json` is live, with volatile state;
  `layouts.json` holds copies stripped by `portableTree`. Main writes the live tree into the
  active entry on every save, only when it differs. A layout follows the work - never a snapshot
  (user decision 2026-09-20). Switching flushes the pending save and waits for one in flight. A
  broken entry is dropped alone; the file is never discarded whole. `KEYED_LAYOUTS`
  (Ctrl+Shift+1..9 by place): change shared/layouts.ts, keybindings.ts and Workspace.svelte
  together (a unit test). Switching asks first while shells are open (`layout.confirmSwitch`), a
  promise the switch awaits: whatever takes the screen from it must answer it.
  - **Presets** (shared/layout-presets.ts) are templates, never a second kind of layout: choosing
    one adds a saved layout carrying `preset` that then follows the work. Each keeps the default
    system column at its width and heights, every pane at its `minSize` (a unit test). Only a
    first start is given them; an existing list is never added to (user decision 2026-09-24).
    Decisions are pure (there and layout-shape.ts); only layout/presets.ts knows presets in the
    page. A new preset also needs its key (keybindings.ts, Workspace.svelte), the LAYOUTS
    dialog wide enough for every card in one row, tests/e2e/layout-presets.spec.ts's `PRESETS`,
    and a README shot (scripts/gen-screenshots.mjs) with the counts in all three READMEs.
- **Shortcuts** are data (src/shared/keybindings.ts), handled in Workspace.svelte; never a key
  check elsewhere. A chord includes Ctrl/Alt or is a function key. `scope: 'global'` actions are
  main's OS registrations, out of the page keymap, the list and "reset all", and `conflicts`
  reports the app action as the loser while the OS holds the keys.
- **Open and close with the CRT effect** (styles/crt.css, lib/crt-transitions.ts): everything that
  appears or goes over the workspace powers on and off.
  - Panes: `layout.arrived`; closing via `layout.closingId` and a `crt-extend` clip
    (layout/pane-close.ts), never animated sizes. One close at a time; tree changes call
    `layout.settle()` first.
  - Layouts: `layout.leaving`, then pane by pane (layout/layout-switch.ts); last switch wins.
  - Zoom (`layout.zoom`, §5.5): `position: fixed` and a transform (`crt-zoom`), never growing;
    the tree is untouched, nothing remounts, and every tree change lets go of it. Forward, its
    corner holds ⤡ alone, never a × beside it (user decision 2026-10-03); Ctrl+Shift+W closes
    the pane that is forward. Registry `zoom:
    'full'` (fills its room), `'panel'` (a fixed size) or nothing (no button, no shortcut - the
    default); plugins declare it in their descriptor. A widget laying itself out by its size
    reads it from the `ResizeObserver` entry, never by measuring inside the callback.
  - Dialogs: `crt-on`, `transition:crtPower`, `--crt-delay={dialogDelay()}`, backdrop
    `transition:backdropShade`, opened and closed through `ui` (so `ui.closedAt` is kept).
  - Notices and toasts: `crt-on` and `transition:crtPower` (`|global` where needed).
  - Skipped with motion reduced. Cover new ones in tests/e2e/motion.spec.ts (or their own spec,
    with `clickThen`).
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens. Text is the accent unless a theme sets
  `text`. Never assume a dark ground: `mode: 'light'` sets `data-mode="light"` (darker status
  colours, xterm's minimum contrast); check both Business themes. Every theme sets every variable
  (`themeVariables`).
- **Detail cards** (§7.4) are `widgets/common/HoverCard.svelte`, placed and timed by
  lib/hover-card.ts (`cardPlacement`, `anchorOf`, `HoverRest`) - never a widget's own card or a
  `title`. A card keeps inside its pane, opens after a rest (at once for the keyboard or from an
  open card), powers on and off like a dialog, and says what the row has no room for, never the
  row again. A unit test lists the cards: add new ones there.
- **Type sizes by role** (§7): what people read is `--step--1` or larger; `--step--2` is for
  legends, labels and chrome; nothing smaller. Only steps tokens.css defines; `em` only where the
  parent's size varies (a unit test checks).

### Running in the background

The tray icon, minimising or closing to it, the system-wide show/hide shortcut and the sign-in
entry (decisions.md). Every option is off until the user turns it on.

- **Never gate on the platform name**: ask `backgroundCapabilities` (shared/background.ts), computed
  by main from what this machine has (it probes for a tray, reads the session type); it travels in
  `BackgroundState`. Main ignores options the machine cannot do (settings.json travels).
- Decisions are pure (`decideClose`, `decideMinimize`, `decideToggle`, `trayWanted`,
  `closesToTray`); main/background/ carries them out. The page never hides the window itself
  (`system.closeWindow`). macOS keeps closing and minimising the platform's
  (`staysWithoutWindow`), and `window-all-closed` does not quit there.
- Putting away is told from quitting by `quitting`; an explicit quit always quits.
- The sign-in entry is one `LoginBackend` per platform (main/background/login/); the platform holds
  whether it is on.

### Tests

- **Tests never contact external services, and never touch the machine.** tests/e2e/support.ts
  sets, by default:
  - closed ports for `ELECDEX_JMA_BASE_URL` (also quakes and tsunamis), `ELECDEX_MET_BASE_URL`,
    `ELECDEX_NWS_BASE_URL`, `ELECDEX_USGS_BASE_URL`, `ELECDEX_NOAA_BASE_URL`,
    `ELECDEX_CELESTRAK_BASE_URL`, `ELECDEX_MARKETS_STUB_URL`, `ELECDEX_UPDATES_URL` and
    `ELECDEX_WEB_HOMES`; specs that need data run a local stub server;
  - `ELECDEX_AUDIO_STUB=1`: a steady tone and a made-up mixer, never the machine's sound or
    volume, with sound off (`=tracks` plays the WAV files `ELECDEX_AUDIO_TRACKS` names, only when
    `globalThis.__elecdexAudio` says which, and aloud only when it says so: the tours);
  - `ELECDEX_BACKGROUND_STUB=1`: no tray icon, system-wide shortcut or sign-in entry;
  - `ELECDEX_SOCKETS_STUB=1`: a made-up socket table (`=demo` for screenshots);
  - `ELECDEX_CLIPBOARD_STUB=1`, `ELECDEX_NOWPLAYING_STUB=1`: stand-ins in main (`=demo`);
  - `ELECDEX_WIFI_STUB=1`: a made-up link, echoes and log (`=train`, `=dual`, `=demo`);
  - `ELECDEX_DOCKER_STUB=1`: a stand-in engine (`=demo`, `=down`, `=denied`);
  - `ELECDEX_AWAKE_STUB=1`: no real power-save blocker or power source;
  - `ELECDEX_AI_KEYS_STUB=1`: a reversible stand-in for `safeStorage`; AI providers are a spec's
    local stub;
  - `ELECDEX_SEED_LAYOUTS=0`: no presets in a new profile (layout-presets.spec.ts turns it on).
  A plugin's hosts reach a stub through `ELECDEX_PLUGIN_HOST_MAP`. Keep it that way.
- **Every bug found gets a test** that fails on the old code and passes on the fix, covering the
  related paths too, at the lowest level that can see it, plus e2e when it was only visible in the
  running app. Check that it really fails without the fix.
- **Test craft.** A test that fails only under load is usually its own fault.
  - Zoom out to the 1920x1080 design size where the screen is smaller (the macOS runner's is about
    1024x640).
  - A fake-clock harness waits on promises (`await Promise.resolve()`), never real timers per step.
  - Measure a pane after `settleLayout`, never as soon as it is visible: an arriving layout powers
    its panes on scaled from a line.
  - Click on what lies over other elements (the status bar over the panes) with
    `click({ delay: 20 })`: a release in the same few milliseconds once landed on the shell
    underneath, and press and release on different elements make no click.
  - Catch one by running the spec under CPU load (a dozen busy `node -e` loops) with the page's
    events logged.
  - Component tests flush (`layout.flush()`) before unstubbing `window.elecdex`, and IPC mocks
    `structuredClone` their arguments (IPC cannot clone a `$state` proxy).
  - A test's own pty session belongs to no pane, and the workspace's reaper ends it about four
    seconds after the panes last changed: go through `runCapture` (terminal.spec.ts).
- **A test that hangs must say where**: `launch` and the guarded `quit`/`close` in support.ts warn
  while still going (SLOW_MS) as well as after. A second app on the same profile uses
  `launched.quit()`, never `launched.app.close()`.

### Publishing

- **README screenshots** must not show personal data: `npm run gen:screenshots` (demo home,
  curated launcher entries, made-up author). One shot per preset in a different theme, plus
  layouts, settings, ELEC and CHIP-8 (T8NKS). Preset trees come from the built app
  (scripts/preset-shots.mjs). Everything of someone else's or this machine is a stand-in: web
  panes show stand-in pages (never YouTube's or X's own), stubs run at `=demo`, the chats and the
  council talk to a stand-in (no model, no key). Regenerate after a visible change to a theme, a
  preset or the default layout; a new theme or preset gets a shot in all three READMEs.
- **The introduction demo** (`npm run demo:tour`, its 9:16 cut `demo-tour-shorts.mjs` under two
  minutes) is updated with every release (user decision 2026-09-27): a new central or showy
  feature gets a beat, a beat no longer true goes. About two minutes, boot first and themes last,
  stand-ins only (demo-take.mjs: nothing of this machine read, pressed or kept awake, no one's
  pages or artwork, no model or key; the music is KEYSTREAM's own tracks). The beats live once in
  scripts/demo-beats.mjs and both cuts use them. Check each take with `--shots`.
- **Attribution** stays visible: JMA (「出典：気象庁ホームページ（URL）を加工して作成」); quake and
  tsunami alerts name their source and say they are not an early warning (tsunami cards: follow
  local authorities); GeoIP CC BY 4.0 (NRO) in the globe pane; CelesTrak and the Space Defense
  Squadrons, and the time zone lines ODbL (© OpenStreetMap contributors) in the ORBIT pane, with
  `tz-lines.json` carrying its licence; Yahoo marked unofficial, possibly delayed, not investment
  advice.
- **Third-party notices**: `npm run build` writes `out/THIRD_PARTY_NOTICES.txt`
  (scripts/gen-notices.mjs) from what each build bundled; the package puts it, and LICENSE,
  beside the executable. New bundled data goes into `DATA_SOURCES`
  (scripts/third-party-notices.mjs) and the README table.
- **README.ja.md** and **README.zh-CN.md** follow the README section for section, in the same
  commit.
- **The README's status line** names the last released version, marks main-only work
  *unreleased*, and says macOS and Linux are not sufficiently verified.
- **Releases**: the whole Playwright suite first; then bump `package.json` and push tag
  `v<version>` (.github/workflows/release.yml makes a pre-release a person promotes).
- **The builds are unsigned**: the README's *If a warning appears* (per OS) and release.yml's
  notes (English and Japanese) say the same; change both.

## Conventions

- TypeScript 7 (`@typescript/native`) with TS 6 for the JS API; `svelte-check --tsgo`. `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (no constructor
  parameter properties, no enums).
- Biome for lint and format (no ESLint/Prettier). Cognitive complexity ≤ 15: split functions.
- Svelte 5 runes. `$state.snapshot` before sending state over IPC or to a worker.
- Comments explain *why*, in full sentences; match the surrounding density.
- Library versions are pinned to the latest release; an exception is recorded in decisions.md
  (e.g. `@types/node` follows Electron's Node, electron-vite's beta).
- Files main writes by renaming go through `replaceFile` (main/store/replace-file.ts), never a bare
  `renameSync`.
- Renderer-only and build-time packages are devDependencies; main's runtime ones are
  dependencies (package-deps.test.ts). A heavy package one pane needs (yahoo-finance2, the
  Anthropic SDK, the XML parser) is `import()`ed on first use (lazy-imports.test.ts). The page is
  built minified.

## Commits

Conventional commits, bilingual English / Japanese in one message, separated by ` / `:

```
feat(scope): english subject / 日本語の件名

English paragraph. / 日本語の段落。
```

No `[` `]`, no absolute paths, no attribution trailers. Update docs/decisions.md and the README
when behaviour or data sources change.

**What to run before committing:**

- **A feature or a fix**: `npm run verify`, `npm run build`, then the e2e specs added or changed,
  plus the ones the change could plausibly reach - the spec of the subsystem touched, and any spec
  that drives what changed (a new shortcut: the specs that press shortcuts; the status bar or a
  dialog: the specs that open them). Say which specs were run.
- **Before a release**, or for a change across the whole app (the layout tree, the settings
  schema, the preload surface): the whole suite, `npx playwright test`.
