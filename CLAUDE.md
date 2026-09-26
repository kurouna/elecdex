# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

elecdex is a ground-up rewrite of [eDEX-UI](https://github.com/GitSquared/edex-ui) — a sci-fi
terminal emulator and system monitor — on Electron 44, Svelte 5, TypeScript 7 and xterm.js 6.
GPL-3.0, like the original; the version is in package.json, and releases are pre-releases.
It is developed and used on Windows; macOS and Linux have only been run by the e2e tests on GitHub
Actions and are **not sufficiently verified** - the README says so, and must go on saying so until
someone has used them by hand.

This file holds the rules that must not be broken and where each one lives. The design, and every
decision with its reason and its measured numbers, is in [docs/architecture.md](docs/architecture.md)
(Japanese; §16 is the decision log); plugins are in [docs/plugins.md](docs/plugins.md). **Read the
section named by a rule before changing that subsystem.**

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
npm run gen:screenshots # README screenshots in a demo profile (Windows; build first)
npm run demo:elec      # drives the ELEC pane for a screen recording (Windows; build first; --alone)
npm run demo:full      # the whole app for a screen recording, windowed (Windows; build first; --probe)
npm run demo:dev       # AI AGENT + GIT at work, then ORBIT, for a recording (Windows; build first; --probe)
npm run demo:presets   # the layouts dialog stepping through every preset, for a recording (Windows; build first; --probe)
npm run demo:shorts    # the same in a tall 9:16 window, layouts in 2 or 3 tiers (--tiers=2|3; Windows; build first)
npm run demo:wifi      # the Wi-Fi pane on the train stub, 9:16, cards opening on the way (Windows; build first)
node scripts/sync-calc.mjs <elecxzy>  # overwrite the vendored calculator from an elecxzy checkout
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
src/main/        main process: window, ipc/ (handlers), store/ (json files), pty/, fs/, weather/,
                 markets/, feeds/, quakes/, ai/, launcher/, audio/, plugins/, web/, background/,
                 reminders/, updates/, metrics/ (the broker between the collector and pages)
src/services/    utilityProcess: the metrics collector (metrics.worker.ts, metrics/: sockets/, wifi/)
src/preload/     the single contextBridge API, window.elecdex
src/shared/      types, zod schemas (schemas/), channel names and pure logic used by both sides;
                 calc/ (vendor/ is elecxzy's evaluator, the wrapper beside it is ours)
src/renderer/    Svelte UI: layout/ (panes, tabs, splits, picker), widgets/ (builtins.ts is the
                 registry), plugins/ (host, plugin pane, blocks), stores/, styles/, lib/
examples/        plugins/pomodoro: the sample plugin written into a new plugins folder
tests/           unit/ (vitest, node), component/ (jsdom), e2e/ (Playwright _electron; support.ts)
scripts/         asset generators, sync-calc, fix-node-pty
docs/            architecture.md, plugins.md (the plugin API and its rules), weather-providers.md,
                 screenshots/ (README images)
```

## Rules that matter

### Boundaries

- **Security boundary.** The renderer is sandboxed (`sandbox`, `contextIsolation`, no Node) with
  CSP `connect-src 'self'`: it has no network and no filesystem. Everything goes through
  `window.elecdex` (src/shared/api.ts, src/preload/index.ts). Main validates every input (zod or
  explicit checks). Never expose a generic channel, a path-taking "run" or raw `ipcRenderer`. The
  launcher launches by opaque id from main's own catalog, never by path.
- **Network lives in main**, never the renderer: weather (JMA, MET Norway, NWS — see
  docs/weather-providers.md; follow each service's terms), markets (yahoo-finance2 is Node-only),
  RSS feeds (src/main/feeds; the XML parser is imported lazily, so an app without an RSS pane
  never loads it), earthquakes and tsunamis from JMA, or the USGS and NOAA (src/main/quakes;
  running only while alerts are on or a quakes pane is open, and only for the chosen source),
  orbital elements from CelesTrak (src/main/orbits; only while an ORBIT pane shows the set, the
  stations twice a day and Starlink once a day, kept on disk, and nothing for a day after any
  answer but a 200 - CelesTrak's policy, architecture.md §5.10). Positions are computed in the
  page (SGP4); a service is never asked where something is.
  Fetch only while a pane needs the data, batch, back off on failure, and keep the last good data
  on screen.
- **Subscriptions** (metrics, fs watches, weather offices, market symbols, feed URLs, the quake
  list) are reference-counted in preload and in main, and a page's subscriptions are dropped on
  reload (`did-start-navigation`) and destroy - through `whenPageGoes` (main/ipc/page-gone.ts), one
  pair of listeners per page, never listeners of a module's own (a dozen passed Node's limit; a
  unit test checks). A page store shared by its panes starts and stops with `refCounted`
  (lib/ref-counted.ts), whose release counts once. Polling must stop when the last subscriber leaves —
  e2e tests assert exactly that. A pane in a background tab (display:none) holds only its widget's
  `keepWhileHidden` sources (builtins.ts): the ones it charts, whose history would otherwise have
  a gap, and once-only ones. List a new charted source there. Every other subscription a pane
  makes (a forecast, quotes, feeds, orbital elements, a repository, agents' records) is taken
  only while the pane is seen (`seen` in stores/window-state.svelte.ts: shown in its tab, and
  the window neither minimised nor put away), keeping what it showed; so is anything it writes on
  a timer or a pulse, and so are the metric sources outside `keepWhileHidden`. Only what must go on unseen goes on: a shell, an answer being written (main's), a
  timer or alarm, quake alerts, and a plugin (which decides for itself from `ctx.views`).
  tests/e2e/hidden-panes.spec.ts puts every built-in pane behind a tab and checks that main
  fetches nothing for it and its DOM does not change, and does the same for a minimised window and
  its restore; a unit test holds its list to builtins.ts.
- **The connections pane reads the kernel, not the network.** Its `net.sockets` source lives in
  `src/services/metrics/sockets/`, one file per platform behind one `RawSocket` (Linux reads
  /proc, macOS runs netstat and cannot name an owner, Windows goes through the sampler's
  GetExtendedTcpTable P/Invoke). Peers are placed with the bundled GeoIP database, never a lookup
  service. It is the one reading a plugin can never be granted, so a new metric source goes into
  `PLUGIN_METRIC_SOURCE_IDS` or `PRIVATE_METRIC_SOURCE_IDS` deliberately (a unit test checks every
  source is in one of them).
- **The Wi-Fi pane reads nothing behind the location consent** (architecture.md §5.12,
  shared/wifi.ts, src/services/metrics/wifi/). No BSSID, no scan of the networks around, on any
  platform (user decision 2026-09-25): on Windows never WlanGetNetworkBssList,
  WlanGetAvailableNetworkList, WlanScan or WlanQueryInterface opcode 7 - the name comes from the
  WinRT connection profile - and a unit test holds the script to it; on macOS never CoreWLAN.
  The event log names the access point too: only the fields named leave the script.
  - One echo round serves both the network status pane and this one (the sampler's `probe`, or a
    long-lived `ping` elsewhere); pinging is done in the collector, never in main.
  - `net.wifi` and `net.wifi.events` are private, and not kept while hidden: a pane nobody sees
    pings nothing, and its timeline keeps the gap. Its judgements are pure functions in
    shared/wifi.ts; the page only wires them. Every figure marked `data-hint` has a card in
    widgets/wifi/hints.ts that quotes `WIFI_LIMITS` rather than restating them (a unit test
    checks both).
- **No location prompts.** Chromium permission requests are denied except clipboard
  (src/main/window.ts). Windows shows a location prompt for `netsh wlan`, which
  systeminformation's network functions run — do not call `si.networkInterfaces`, `si.wifi*` or
  similar on Windows.
- **Audio capture stays out of the workspace.** The spectrum's system audio comes through screen
  capture with loopback audio, granted only in the hidden capture window
  (main/audio/capture-window.ts: its own session, its own two-function preload, a page with no
  network); only spectrum levels leave that window. On Linux, where Electron has no loopback, main
  runs `parec` on `@DEFAULT_MONITOR@` (main/audio/pulse-capture.ts) — never the default input.
  Linux audio goes through the pulse protocol (parec, pactl), which PulseAudio and PipeWire both
  serve; WirePlumber's wpctl is only a fallback, never required (main/audio/mixer-linux.ts).
  Code that means "the elecdex window" asks `appWindows()` (main/app-windows.ts), never
  `BrowserWindow.getAllWindows()`, so the helper window is never taken for it.
- **Web panes** (architecture.md §5.4) are WebContentsViews that main owns, one per pane id, over
  the pane's body — never an iframe or `<webview>` in the workspace, whose CSP stays as it is.
  - A site is a preset in `WEB_PRESETS` (shared/web.ts): its home and the hosts that stay in the
    pane; add a site there, not as a widget. A preset may carry a `userAgent` (how the YouTube
    (TV) pane asks for the television interface); an `unlisted` one still opens for a layout that
    names it but is not in the picker (plain YouTube, which the television one supersedes).
  - All web panes share the `persist:web` session and nothing else does; pages get no preload, no
    permission but clipboard write and fullscreen, no downloads, and only http(s).
  - Only the television pane can be signed in, because Google refuses an embedded browser; its
    device flow (a code entered on a phone) is the sanctioned way — never dress the pane up as
    Chrome to get past the check.
  - Each mount claims its view with a token, so a moved pane's old component cannot hide the new
    one's page, and opens it once per mount without tracking props.
  - A view is native and covers the DOM: anything drawn over panes registers with `coverWeb`
    (stores/web.svelte.ts), and dialogs, drags and CRT transitions hide views behind a snapshot,
    retaken when the page's colours change. A view leaves HTML fullscreen before it is put away.
  - The view sits on the theme's ground, so main tells the page which `color-scheme` its own
    defaults follow (otherwise a page that brings no colours is black on black). The theme tint
    is off by default (`web.tint`); each pane overrides it with the switch beside its address.
- **Plugins** (docs/plugins.md) run in a blob Web Worker, one per plugin; main only transforms
  their text (sucrase) and never runs it.
  - Everything a worker posts is checked (shared/plugins.ts), and every request, redirect, storage
    write and notification is checked in main against the grant in settings.json, never against
    what the renderer says a plugin asked for. Consent is bound to the plugin id *and* its file or
    folder name. The host re-checks sizes (pane state, blocks, storage keys) even where the worker
    runtime already does, since a plugin can post around the runtime.
  - The worker script is built from `stripGlobals` and `pluginRuntime` (shared/plugin-runtime.ts)
    as source text, so they must not refer to anything outside themselves. The real containment
    is the page CSP (`connect-src 'self'`, no `unsafe-eval`, `worker-src blob:`): relaxing it
    means re-auditing plugins.
  - Plugins draw only through blocks; add a block to plugin-api.ts, the schema and Blocks.svelte
    together. plugin-api.ts is copied verbatim into the user's plugins folder as
    elecdex-plugin.d.ts, so it holds types only, and every change to it is a change to the public
    API (update docs/plugins.md). A background service learns whether its panes are open from
    `ctx.views`, counted in the worker.
  - *Settings -> Plugins -> install from a folder* (main/plugins/install.ts): main opens the
    picker, so the page never hands over a path, and what is copied is the module graph from the
    entry — what the worker would actually load — so a repository's tests and scratch files are
    neither copied nor judged. Walking that graph is also the check that the plugin compiles and
    its imports resolve; the resolution mirrors the worker's (shared/plugin-runtime.ts), so change
    one and change the other.
  - Plugins that use unofficial APIs or are personal (such as claude-usage) live in a separate
    private repository, cloned beside this one and deployed with its `npm run deploy` — never
    here. The committed sample is the pomodoro timer.
- **The AI chat pane** (architecture.md §5.7, shared/ai.ts, main/ai/). A provider is an address
  and a dialect: OpenAI-compatible `chat/completions` (plain fetch + SSE, which covers Ollama,
  LM Studio, llama.cpp and most hosted services) or Anthropic's Messages API (the official SDK,
  imported lazily). Add a service as a preset in `AI_PRESETS`, not as code.
  - **A key never reaches the page**: it goes to main once (`ai.setKey`), is encrypted with
    `safeStorage` into `ai-keys.json` - never settings.json, which travels - and the page only
    learns whether one is held. The dots of a held key are the field's placeholder, never its
    value, and "show" only ever shows what is being typed. Asking that decrypts nothing (the first decryption is what makes
    the macOS Keychain entry). A key is not sent over plain http beyond the local network
    (`keyMayTravel`), and requests follow no redirects.
  - The conversation *and the answer being written* are main's (`AiChatService`): a moved pane
    remounts, and the answer must not care. Pages get a snapshot and then deltas that say where
    they append; one that does not fit is a resync, never a text with a hole. An answer nobody
    follows is stopped after a few seconds.
  - A provider is asked only when the user sends, presses test, or opens the model list - never
    on mount.
  - **The conversation is never cut; what is sent of it is** (`chatWindow`, a pure function in
    shared/ai.ts, called by main only). The window is the provider's (`contextTokens`; by its
    address when unset), in estimated tokens - never characters, which are four times off for
    Japanese. It cuts rarely and by a lot, and keeps the place in `Chat.context`, because a
    beginning that moves every turn throws away the server's prompt cache every turn: do not
    turn it into a per-turn sliding window. A provider's token count corrects the estimate
    upwards only - a server that silently truncated reports a small one. The pane says where
    the model's view begins (`NOT SENT`).
  - A summary of what stays behind (`ai.compact`, off by default) is asked for at a cut - and once
    more with the next question if that came to nothing, never with every question - as
    part of the send - never after an answer or on a timer - and goes after the system prompt,
    never as a message (templates that want roles to alternate fail on two user turns). Its
    failure costs the summary, never the question. It is held to its room (`summaryRoom`, a tenth
    of the window), so writing one never moves the cut it was written for. What the model is told on the user's behalf
    is theirs to read: the `SUMMARISED` line opens, and draws it as text.
  - A model's text is untrusted: it is drawn from the tree `lib/markdown.ts` makes, never as HTML.
  - The Anthropic adapter follows the claude-api skill: capabilities from the Models API rather
    than the model's name, `stop_reason` read before content, thinking shown summarized and never
    replayed, server-side fallbacks only on Anthropic's own endpoint.
  - The pane speaks the link's language (LINK STANDBY, TX / RX, LOG, NO CARRIER), but never at
    the cost of what the user needs to read: how an answer ended is a short code *with the
    provider's own words beside it*, not in a tooltip. The ways of failing are one set (`FAILED`)
    read by both the mark's colour and the sound; add a new `ChatStop` there deliberately. The
    caret and the receive lamp step with `lib/pulse.svelte.ts`, not a CSS animation. The pane
    badge stays in words (`receiving`), like the other panes' badges.
  - No tools, no MCP, no images, no branching, no named prompt profiles: left out on purpose
    (user decisions 2026-09-20 and 2026-09-21). A model that can start processes or read files
    needs a consent design like the plugins' first. Do not add any of them without asking.
- **The git pane** (architecture.md §5.9, shared/git.ts, main/git/) only reads: it never stages,
  commits or checks out. A repository is chosen through main's folder picker and known to the page
  by an id (`git-repos.json`), so a layout carries no path; a pane is tied to no other pane.
  - git runs with `GIT_FLAGS` (main/git/run.ts) and the diff flags, always: a repository's own
    config can name programs (`core.fsmonitor`, external diff, textconv, `gpg.program` through
    `log.showSignature`, a clean filter), and the pane must never run one by looking. The filters
    the repository itself defines are emptied per repository (`filterGuard`), and a submodule's
    working tree is not looked into. `--no-optional-locks` keeps its reads off the user's
    index.lock.
  - With no open command set, a file the system would run rather than show (a program, script,
    shortcut or installer: `runsWhenOpened`) is shown in its folder instead.
  - Main answers a diff only for a file its last reading listed, and opens or reveals only a file
    that resolves inside the working tree (`GitService.locate`).
  - `git.openCommand` is set in settings.json only, never by settings.patch (as launcher entries):
    a command the page could change is a program the page could start. It runs as a program and
    its arguments, never through a shell; a Windows .cmd goes through `cmd.exe` only with every
    argument free of what cmd.exe acts on (main/git/open.ts).
  - The commit graph is asked for by the page (`git.log`: scope and count only), read again when
    the state's `historyAt` moves - HEAD, or a ref (a tag, a fetch) - and laid out by the pure
    `graphRows` (shared/git-graph.ts). Its hover card stays inside the pane.
  - A repository is watched only while a pane shows it, read after changes at most once a second,
    and git's own bookkeeping in the git folder (`index.lock`, objects) is not a change.
  - A file's text is untrusted: highlight.js's answer is read back into tokens (lib/highlight.ts)
    and drawn as text, never as HTML.
- **The AI AGENT pane** (architecture.md §5.11, shared/agents.ts, main/agents/) is experimental and
  reads coding agents' own local records - never sends anything, never runs them.
  - The page talks to one layer (`AgentHub`), which asks the sources `agents.sources` turns on;
    an agent is an `AgentSource` adapter (main/agents/source.ts). Add an agent there and in
    `AGENT_SOURCE_IDS`, never in the pane.
  - Claude Code's records are read only while a pane is open, from where the last reading stopped;
    a record over 32 MB from its last 512 kB, marked partial. Never parse a whole record on a
    change (a 124 MB one took 944 ms), and never parse a line that is not the model's own - but
    for the small ones that end a task: its notice, and the result of a call still waiting for it
    (told by its id in the record's own quotes, so an output quoting the id is not taken).
  - A session's subagents and background commands are its tasks: started by its own tool calls,
    ended by the `<task-notification>` lines (matched by the call's id, which only the first
    notice of a task carries, or else by the task id its result gave; an interim one ends
    nothing), a TaskStop naming that task id, or their
    own result (refused, interrupted, or a subagent's report; its next answer as the fallback),
    and a subagent is read from its own record under `<session>/subagents/`. A task still running
    when its session went is `unknown`, never guessed done.
  - Tests never read this machine's `~/.claude`: support.ts points `ELECDEX_CLAUDE_DIR` at a
    folder that does not exist, and specs make their own.
- **The ELEC system pane** (architecture.md §5.8, shared/elec.ts, main/ai/elec.ts) puts a
  motion to three units - LOGOS, ETHOS, PATHOS - on the AI chat's providers, keys and adapters,
  under the same rules (main asks, snapshot + deltas, an unfollowed deliberation stops, nothing
  asked on mount). The seats, standpoints, rule and rounds are settings (`elec`); a deliberation
  keeps its own copy, and the page sends only the motion.
  - A vote is read from the answer's last `VERDICT` line (`readVote`), never from structured
    output. An invalid vote (a failed link, NO VERDICT) is not an abstention; CONFIDENCE is
    shown, never counted. The resolution is computed from the ballots (`resolve`), never stored.
  - Seats on one local server are asked one after another, hosted ones at once; the second
    round passes the other statements cut to the provider's window (`statementRoom`).
  - The app's words never name MAGI or its source (user decision 2026-09-21).
  - **Its drawing is one geometry** (widgets/elec/geometry.ts): the three plates are one height
    and one area (a unit test holds them to it), and the ring, the spokes' mouths, the boxes the
    words sit in and the clip of what is laid over a plate (`plateClip`: the vote's flash, the
    power-on's scan line) all follow from the plates' points. Change a plate there, never a
    coordinate in Stage or Effects.
  - **Its light** (architecture.md §5.8; the decisions are pure, in widgets/elec/light.ts) moves
    only while the council sits, or once for an event. An answer's packets are its traffic - one
    per delta from main, as many as `nextPackets` lets on a spoke - never a loop. The resolution
    waits for the dark (`HOLD_MS`): `held` is marked *while* the council sits, so the hold is in
    the very update that ends it; the strip, the console's last line, the core's word and the
    sound all wait, and a deliberation that was not watched, or motion reduced, does not. The
    floor stops where it is by holding its phase, not by pausing its animation.
  - Animate opacity and transform there, **never a colour in keyframes**: between the hsl accent
    and a colour mixed with `transparent` Chromium drew a black plate with a yellow rim. A plate
    is never dimmed by opacity either (the ring shows through): thin its colour towards the ground.
  - Taken out as too theatrical, and not to come back without asking: a convergence on the core with a shock wave, orbits round the core, a
    radar in it (user decisions 2026-09-21).
  - **Its light stays smooth, at the display's rate, and may use the CPU for it** (user decision
    2026-09-21): about 70% of one core while the council sits, 0.5% otherwise, and the pane is
    not in the default layout. Stepping it on the 10 fps frame loop was built (28%) and taken
    out as visibly jerky - do not move it to the loop again. The cost is not any one effect: one
    endless animation has the whole stage composited every frame (§5.8 has the measurements),
    so dropping an effect or two saves nothing.
- **The vendored calculator is never edited.** `src/shared/calc/vendor` is elecxzy's evaluator
  copied whole (MIT), kept out of tsconfig and biome, typed through hand-written `.d.ts` behind
  `@calc/*`. What elecdex needs goes in the wrapper beside it; `scripts/sync-calc.mjs` overwrites
  the folder (architecture.md §16).
- **Desk data lives in main.** Notes, tasks and alarms are main's files (notes.json, tasks.json, alarms.json);
  a pane keeps only display choices and ids. Reminders wait on one `setTimeout` for the next due
  item (src/main/reminders), never a poll.

### Performance

- **Measured, not assumed.** The idle budget is enforced in tests/e2e/metrics.spec.ts (default
  layout ~13% of one core). Record measured numbers in architecture.md §16 when a decision
  depends on them.
- On Windows never spawn a process per reading — frequent readings go through `WindowsSampler`
  (one long-lived PowerShell).
- **`spawn` is synchronous, and main is the browser process**: while it waits, the window draws
  nothing. Windows scans a new process's command line inside `CreateProcess`, and a PowerShell
  script there (`-EncodedCommand`, or P/Invoke code after `-Command`) held main for 0.7-1.7 s -
  that was the wait before the boot log (§16). Hand PowerShell its script in an environment
  variable (`powerShellStart`, the shell integration's `ELECDEX_PS_INIT`), and time the `spawn`
  of any new PowerShell start: the cost follows the content, not the length.
- Animations share the 10 fps frame loop (`lib/frame-loop.ts`) instead of their own rAF loops.
  A CSS animation is the compositor's, not the loop's, and `backgroundThrottling` is off, so one
  keeps painting a window that has been put away: the frame loop marks the page `data-offscreen`
  and tokens.css takes `--motion-scale` to zero there. A hidden or minimised window is not
  reported hidden to such a page, so main sends `WindowState.hidden` and the loop stops drawing.
  - An animation that outlives the frame it started in — endless, or merely long (a toast's
    ten-second fuse) — cannot be scaled to nothing by `--motion-scale`, so it takes
    `animation-play-state: var(--ambient-play-state)` after its `animation` shorthand, in every
    rule that sets the shorthand (which resets it).
  - The loop only draws. Anything that must happen at a moment whether or not the window is on
    screen (a countdown landing) waits on its own `setTimeout`, never on a frame.
  - No `will-change`, and no fill that outlasts an animation (`forwards`, `both`) on what stays in
    the page: either keeps a GPU layer for good. `crt-on` is left on dialogs, toasts and the
    notes' sheet, so styles/crt.css holds to this too.
- Weigh a new animation by the area it repaints — the clock's rolling digits cost ~4% of one core
  on the default layout, measured.
- Other timed screen updates wake on wall-clock boundaries through `onBoundary(period, …)`
  (lib/frame-loop.ts: the clock, the system pane's date, the tasks' T-minus), never a timer of
  their own or an unaligned `setInterval`: their change lands in the loop's frame, everyone on a
  period shares one timer, and none runs while the window is put away (they catch up the moment
  it is back). Assign `$state` only when the shown value changes.
- **GPU contexts are a budget.** Chromium keeps only about 16 WebGL contexts and drops the oldest,
  which may be a visible pane's. Only the shell (xterm's WebGL addon) and the globe (three.js) take
  one, and a widget that creates one gives it back on unmount (`forceContextLoss`, or
  `releaseWebglContexts` in lib/webgl.ts); every other drawing widget is plain 2D canvas,
  deliberately. **There is no WebGPU here** and none is wanted (asked and left as it is,
  2026-09-19): with two dozen widgets created and destroyed freely the context budget decides,
  and the one measured animation cost is the compositor rasterising glyphs.

### Panes and layout

- **Layout state** is a persisted tree (src/shared/layout-ops.ts, pure and unit-tested); every
  tree change goes through a pure op there. Widgets keep per-pane choices in pane state, changed
  with `layout.patchPaneState(paneId, change)` (undefined removes a key) - never by spreading the
  `state` prop into `setPaneState`, which lost a change made in the same moment. A tabbed pane is split, moved beside or dropped on through its group,
  and a group only ever holds panes — of any widget (Ctrl-drag, or the picker's "new tab").
  Nested groups were designed and deliberately postponed (user decision 2026-09-17): do not add
  them without asking. Splits carry no header (eDEX-UI's PANEL / SYSTEM labels were dropped
  because panes move between columns); the shell's TERMINAL header stays, as the group's drag
  handle and the path. Pane moves are covered at three levels — unit (layout-ops, including seeded
  random moves), component (pane-drag gesture) and e2e (pane-move) — so extend those.
- **A pane popped up is never in the layout** (architecture.md §5.13, layout/popup.ts): one
  widget over the workspace in a frame with only a ×, held in `ui.popup` as one of the dialogs
  (opening any dialog puts it away, and it counts in `dialogOpen`), drawn by PopupPane.svelte.
  The layout store knows nothing of it, and it is not saved. Only a widget whose registry entry
  says `popup: true` is offered, and only one that keeps nothing in pane state and belongs to no
  other pane may say so - there is no node to patch, a shell would be reaped, a web view closed
  (a unit test reads the sources). The launcher's shortcut pops one up when the layout has none,
  rather than adding a pane; a widget ends its popup through `ondone`, never by knowing it is in one.
- **Remounts happen.** Moving a pane remounts its widget, so keep what must survive in pane state
  or in main (a shell reattaches to its session).
- **Terminal sizing.** Never fit a hidden pane or send transient sizes to the PTY: ConPTY rewraps
  its buffer to every size and garbles history (see the remount regression test).
- **Saved layouts** (src/shared/layouts.ts, architecture.md §5.6). `layout.json` is the live
  arrangement, with the volatile state a reload needs (a terminal's session id); `layouts.json`
  holds the named copies with that state stripped (`portableTree`), so it can travel to another
  machine and a new shell does not rewrite it. Main writes the live tree back into the active
  entry on every save, only when it differs. A layout follows the work: never turn it back into a
  snapshot without asking (user decision 2026-09-20). Switching flushes the pending save *and
  waits for one in flight*, since main writes each save into whichever layout is active when it
  arrives. A broken entry is dropped on its own; the file is never discarded whole. The first
  `KEYED_LAYOUTS` answer Ctrl+Shift+1..9 *by their place in the list* — add a slot in
  shared/layouts.ts, keybindings.ts and Workspace.svelte together (a unit test checks they match).
  Switching asks first while shells are open (`layout.confirmSwitch`); that question is a promise
  the switch awaits, so anything that takes the screen from it must answer it.
  - **Presets** (shared/layout-presets.ts, §5.6) are templates, never a second kind of layout:
    choosing one adds a saved layout carrying `preset` and goes there, and it then follows the
    work like any other. Every preset keeps the default layout's system column, at its width and
    heights (a unit test holds it, and every pane to its `minSize`). Only a first start (neither
    layout.json nor layouts.json) is given them; an existing list is never added to (user
    decision 2026-09-24). The decisions are pure functions there and in layout-shape.ts, and only
    layout/presets.ts knows presets in the page: the layout store does not.
- **Shortcuts** are data (src/shared/keybindings.ts): add an action there with its default chord
  and handle it in Workspace.svelte; never hard-code a key check elsewhere. A chord must include
  Ctrl/Alt or be a function key, so the shell keeps every other key. An action with
  `scope: 'global'` is registered with the OS by main instead, so it is out of the page's
  `keymap`, the shortcut list and "reset all shortcuts", and `conflicts` reports the app action as
  the loser while the OS holds the keys.
- **Open and close with the CRT effect.** Everything that appears or goes on top of the workspace
  powers on and off like a tube (styles/crt.css, lib/crt-transitions.ts), and a new pane, dialog
  or notice must do the same:
  - Panes: added ones power on through `layout.arrived`. A closed one powers off in the tree
    (`layout.closingId`), and the panes that gain its room are uncovered by a `crt-extend` clip
    (layout/pane-close.ts), never by animating sizes, which would send transient sizes to a shell.
    One close runs at a time; a tree change first calls `layout.settle()`.
  - Layouts: applying a saved one powers the whole screen off as one (`layout.leaving`, a tab
    group with its header and strip), and the arrangement arriving powers on pane by pane as at
    boot, quicker (layout/layout-switch.ts). Overlapping switches are last-one-wins by token.
  - A pane brought forward (`layout.zoom`, architecture.md §5.5) is pinned over the workspace with
    `position: fixed` and flies there with a transform (`crt-zoom`), never by growing: the tree is
    untouched, nothing is remounted, and the pane's own size changes once. Every tree change lets
    go of it (`settle`). A widget's registry entry says `zoom: 'full'` (it fills the room it is
    given), `'panel'` (reads better at a fixed size) or nothing (a readout of a few figures: no
    button, no shortcut — the default); plugins declare the same in their descriptor. A widget
    that lays itself out by its own size (the calendar) reads it from the `ResizeObserver`
    entry's rectangle, never by measuring the element inside the callback: a pane just pinned
    still answers with the size it had in the layout it left.
  - Dialogs: the dialog has `crt-on`, `transition:crtPower` and
    `style:--crt-delay={dialogDelay()}`, its backdrop `transition:backdropShade`, and its
    open/close goes through `ui` so `ui.closedAt` is kept (a dialog opened just after another
    closed opens out of its line).
  - Notices and toasts: `crt-on` and `transition:crtPower`, with `|global` when the element can
    leave with a block around it (the last of a list).
  - With motion reduced, all of it is skipped. Cover a new one in tests/e2e/motion.spec.ts (or its
    own spec, with `clickThen` from support.ts).
- **Themes** are data turned into CSS variables; canvas/WebGL widgets re-read colours on
  `appearance.revision`. Components read semantic tokens, not primitives. Text is the accent
  unless a theme sets `text` (Business does); never assume a dark ground — `mode: 'light'`
  (Business (Light)) sets `data-mode="light"`, which darkens status colours in tokens.css and turns
  on xterm's minimum contrast, so check a colour change in both Business themes. Every theme sets
  every variable (`themeVariables`), so switching never leaves one stale.
- **Type sizes by role** (architecture.md §7): what people read - a list's rows, a state word, a
  figure, a time, an error - is `--step--1` or larger; `--step--2` is for legends, credits, labels
  and chrome, and nothing goes below it. Name only the steps tokens.css defines: an unknown one
  falls back to the parent's size. A size in `em` only where the parent's size varies (a clock's
  digits, code in prose); under a fixed parent use a step (a unit test checks both).

### Running in the background

Architecture.md §16. The icon outside the window, minimising or closing to it, the system-wide
show/hide shortcut and the sign-in entry; every option is off until the user turns it on.

- **Never gate any of it on the platform name**: ask `backgroundCapabilities`
  (shared/background.ts), which main computes from what this machine actually has — it probes for
  a tray (a Linux desktop may have none, and a window put somewhere that does not exist is lost)
  and reads the session type (Wayland swallows system-wide shortcuts). The answer travels to the
  page in `BackgroundState` (`stores/background.svelte.ts`). Main also ignores an option the
  machine cannot do, since settings.json travels between machines.
- The decisions are pure (`decideClose`, `decideMinimize`, `decideToggle`, `trayWanted`,
  `closesToTray`) and main/background/ carries them out. The page never hides the window itself:
  its close button asks main (`system.closeWindow`) and main decides. macOS keeps the app running
  with no window, so closing and minimising stay the platform's (`staysWithoutWindow`) and
  `window-all-closed` does not quit there.
- Putting the window away is told apart from quitting by `quitting` (before-quit, Windows'
  session-end); an explicit quit — the shortcut, the status bar, the tray menu — always quits.
- The sign-in entry is one file per platform behind one `LoginBackend` (main/background/login/): a
  Run-key value, a macOS login service, a freedesktop autostart file. The platform, not
  settings.json, holds whether it is on, because the user can also turn it off in Task Manager,
  System Settings or their desktop.

### Tests

- **Tests never contact external services, and never touch the machine.** tests/e2e/support.ts
  sets, by default:
  - closed ports for `ELECDEX_JMA_BASE_URL` (also the earthquake and tsunami lists),
    `ELECDEX_MET_BASE_URL`, `ELECDEX_NWS_BASE_URL`, `ELECDEX_USGS_BASE_URL`,
    `ELECDEX_NOAA_BASE_URL`, `ELECDEX_CELESTRAK_BASE_URL`, `ELECDEX_MARKETS_STUB_URL`, `ELECDEX_UPDATES_URL` and
    `ELECDEX_WEB_HOMES` (the web presets' homes); specs that need data run a local stub server;
  - `ELECDEX_AUDIO_STUB=1` (a steady tone and a made-up mixer, never the machine's sound or
    volume), with sound off;
  - `ELECDEX_BACKGROUND_STUB=1` for the notification-area icon, the system-wide shortcut and the
    sign-in entry, so no run touches the taskbar, keys or startup;
  - `ELECDEX_SOCKETS_STUB=1` for a made-up socket table (`=demo` for screenshots), so no run
    depends on — or records — where this machine has been;
  - `ELECDEX_WIFI_STUB=1` for a made-up Wi-Fi link, echoes and log (`=train` for a trip with
    tunnels and changes of car, `=dual` for two adapters, `=demo` for screenshots), so no run
    reads the network or pings;
  - `ELECDEX_AI_KEYS_STUB=1` for a reversible stand-in for `safeStorage`, so no run opens the
    Keychain or a keyring. AI providers are the user's own addresses, so a spec lists a local stub.
  - `ELECDEX_SEED_LAYOUTS=0`, so a new profile starts with no saved layouts rather than the
    presets a real first start is given (layout-presets.spec.ts turns it back on).
  A plugin's hosts reach a stub through `ELECDEX_PLUGIN_HOST_MAP`
  (`api.example.test=127.0.0.1:port`), which keeps the grant checks as they are. Keep it that way.
- **Every bug found gets a test.** When a problem turns up (from a user, a review, a flaky run),
  add a test that fails on the old code and passes on the fix — and cover the related cases around
  it (the same path through another widget, the edit or reload that reaches it another way).
  Check that the test really fails without the fix. Put it at the lowest level that can see the
  bug (unit, then component, then e2e), plus an e2e check when the bug was only visible in the
  running app.
- **Test craft.** A test that needs the window the default layout is designed for (1920x1080)
  zooms out to get it in CSS pixels where the screen is smaller (the macOS CI runner's is about
  1024x640). A test that fails only under load is usually its own fault: a harness driving a fake
  clock waits on promises (`await Promise.resolve()`), never on real timers per step. A component
  test that stubs `window.elecdex` flushes what it started (`layout.flush()`) before unstubbing,
  and its IPC mocks `structuredClone` their arguments, since IPC cannot clone a `$state` proxy.
  A pty session a test makes for itself belongs to no pane, so the workspace's reaper ends it
  four seconds after the panes last changed (one younger than that at the next look, 4 s on:
  a pane records its new shell only after main has made it, layout/reap.ts): go through `runCapture` (terminal.spec.ts), which
  starts over when that happens, rather than waiting on a shell that is gone.
- **A test that hangs must say where.** A Playwright timeout prints nothing when it was waiting on
  an app to start or quit, so `launch` and the guarded `quit`/`close` in support.ts warn while
  they are still going (SLOW_MS) as well as after. A test that starts a second app on the same
  profile calls `launched.quit()`, never `launched.app.close()`: the guarded one kills an app that
  will not quit instead of holding the test until it times out with nothing in the log.

### Publishing

- **README screenshots** must not show personal data: regenerate them with
  `npm run gen:screenshots`, which uses a demo home and curated launcher entries. The README's
  Features are grouped by layout preset, one shot per preset, each in a different theme (so every
  built-in theme is shown once), plus the layouts dialog, the settings dialog, the AI chat pane
  (talking to a stand-in the script serves: no model, no key) and the ELEC pane. The preset trees
  come from the built app itself (scripts/preset-shots.mjs), never written out in the script.
  What would show someone else's pages or this machine is made up: the web panes show stand-in
  pages (never YouTube's or X's own), the feed, the socket table (`ELECDEX_SOCKETS_STUB=demo`),
  the Wi-Fi link (`ELECDEX_WIFI_STUB=demo`),
  the sound (`ELECDEX_AUDIO_STUB=demo`), notes and tasks, a Claude Code folder and a demo
  repository by a made-up author. Web panes are native views the page's screenshot cannot see,
  so the script lays main's pictures of them over it. Name shots to take only those. Regenerate
  after a visible change to a theme, a preset or the default layout; a new theme or preset gets a
  shot and a place in the three READMEs.
- **Attribution** stays visible. JMA forecasts and the quakes pane show
  「出典：気象庁ホームページ（URL）を加工して作成」; earthquake and tsunami alerts name their source
  (JMA, USGS, NOAA) and say they are not an early warning (tsunami cards: follow local
  authorities); the GeoIP data is CC BY 4.0 (NRO), credited in the globe pane; the ORBIT pane
  credits CelesTrak and the Space Defense Squadrons, and the time zone lines are ODbL
  (© OpenStreetMap contributors) - the pane says so, and `tz-lines.json` carries its licence; Yahoo data is marked
  unofficial, possibly delayed, not investment advice.
- **Third-party notices**: `npm run build` writes `out/THIRD_PARTY_NOTICES.txt`
  (scripts/gen-notices.mjs) from the packages each build actually bundled (the `bundledPackages`
  plugin in electron.vite.config.ts), the production dependencies and `DATA_SOURCES`; the
  package puts it, and LICENSE, beside the executable. New bundled data from someone else's data
  goes into `DATA_SOURCES` (scripts/third-party-notices.mjs) as well as the README table.
- **README.ja.md** and **README.zh-CN.md** are the README in Japanese and in Simplified
  Chinese, section for section: a change to one is made to the others in the same commit.
- **The README's status line** names the last *released* version (package.json), and marks what
  is on main but not in it as *unreleased*; update both when the version is bumped. It also says
  macOS and Linux are not sufficiently verified - keep that until they are.
- **Releases**: run the whole Playwright suite (`npx playwright test`) before bumping the version.
  Then bump `package.json` version and push tag `v<version>`; .github/workflows/release.yml builds
  every platform into a GitHub pre-release that a person promotes to a full release.
- **The builds are unsigned**, so the README's *If a warning appears* says, per OS, what to do when
  SmartScreen or Gatekeeper stops the first run, and release.yml opens every release's notes with
  a short copy of it in English and Japanese. Change one and change the other.

## Conventions

- TypeScript 7 (`@typescript/native`) with TS 6 alongside for the JS API; `svelte-check --tsgo`.
  `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`
  (no constructor parameter properties, no enums).
- Biome for lint and format (no ESLint/Prettier). Cognitive complexity ≤ 15: split functions.
- Svelte 5 runes. `$state.snapshot` before sending state over IPC (Proxies do not clone).
- Comments explain *why*, in full sentences; match the density of the surrounding code.
- Library versions are pinned to the latest release; when the latest cannot be used, the reason
  is recorded in architecture.md (e.g. Vite 7 because Vite 8's Rolldown cannot parse Svelte 5.57).
- A file main writes by renaming a temp file over it goes through `replaceFile`
  (main/store/replace-file.ts), never a bare `renameSync`: Windows refuses the rename while
  anything - a scanner, an editor, a test - has the file open, and the write was lost.
- Renderer-only and build-time packages are devDependencies (bundled by Vite), so they are not
  shipped twice; runtime Node dependencies of main stay in dependencies (tests/unit/package-deps.test.ts
  checks both ways). A heavy package only one pane needs (yahoo-finance2, the Anthropic SDK, the
  XML parser) is loaded by main with `import()` on first use, never at start (lazy-imports.test.ts).
  The page is built minified.

## Commits

Conventional commits, bilingual English / Japanese in one message, separated by ` / `:

```
feat(scope): english subject / 日本語の件名

English paragraph. / 日本語の段落。
```

No `[` `]`, no absolute paths, no attribution trailers. Update architecture.md §16 and the README
when behaviour or data sources change.

**What to run before committing.** The whole e2e suite takes minutes, so it is not the toll on
every change:

- **A feature or a fix**: `npm run verify`, `npm run build`, then the e2e specs added or changed
  for it, plus the ones the change could plausibly reach — the spec of the subsystem touched, and
  any spec that drives what was changed (a new shortcut: the specs that press shortcuts; a change
  to the status bar or a dialog: the specs that open them). Say which specs were run.
- **Before a release**, or for a change whose blast radius really is the whole app (the layout
  tree, the settings schema, the preload surface): the whole suite, `npx playwright test`.
