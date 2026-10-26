English | [日本語](panes-dev.ja.md) | [简体中文](panes-dev.zh-CN.md)

# Developer panes: AI Agent, Git, Docker and Log Watch — elecdex

elecdex is a science-fiction terminal emulator and system monitor, a rewrite of eDEX-UI on Electron, Svelte and TypeScript. This page covers its four panes for software work: **AI Agent** (the Claude Code sessions running on your computer, read from their local records), **Git** (one repository: changed files, diffs, the commit graph, and FETCH, PULL and PUSH), **Docker** (the local engine's containers, with start, stop, restart and pause) and **Log Watch** (a log file followed as it grows, with an AI explanation of the lines you choose). For each it states what it reads, how often, what it never reads or does, and its settings. elecdex runs on Windows, macOS and Linux; it is developed and used on Windows, and macOS and Linux have only been built and run by the automated tests, so they are not sufficiently verified.

On this page:

- [The dev preset](#the-dev-preset)
- [AI Agent](#ai-agent)
- [Git](#git)
- [Docker](#docker)
- [Log Watch](#log-watch)
- [Common behaviour](#common-behaviour)
- [Design documents](#design-documents)

## The dev preset

<p align="center">
  <a href="https://youtu.be/YLxHhQ7wAyE">
    <img src="../screenshots/elecdex-dev.jpg" alt="The dev preset in the Phosphor theme: an AI AGENT pane with two Claude Code sessions, one busy with a subagent at work, a subagent of its own hanging under it, and the tests running in the background, and its changed files; under it a DOCKER pane with made-up containers grouped by Compose project - ledger and shop - with their health, ports and use, a shell tab behind it; below that a clipboard history of made-up copies, with a timer and a shell in the tabs behind; a GIT pane on the right, an AI chat tab and a log watch tab behind it, with the same checkout, the diff of passes.ts, and the commit graph with the card of a commit the pointer rests on">
  </a>
  <br><sub>dev · Phosphor</sub>
  <br>
  ▶ <a href="https://youtu.be/YLxHhQ7wAyE">Watch the dev layout at work</a> (1 min) · <a href="https://youtu.be/eLKHc9nyWgc">日本語版</a>
</p>

The dev preset (Ctrl+Shift+F4) is agents at work, the containers they run, and the repository they change:

| Place | Panes |
| --- | --- |
| Left column | The system column every preset but cockpit and blank shares |
| Centre, top | AI Agent |
| Centre, middle | Docker in front, a shell in a tab behind it |
| Centre, bottom | The clipboard history in front, a timer and one more shell in tabs behind |
| Right, full height | Git in front (its diff needs the height), an AI chat and Log Watch in tabs behind |

- The panes in front are the ones that read only while they are on screen (the Docker engine, the clipboard), so a fresh dev layout shows them working.
- In short: **AI Agent** shows the Claude Code sessions at work on your computer - what each is doing this moment, how much it carries, its subagents and background tasks, and a diff of every file it changed. **Git** shows a repository you choose, kept current as it changes; FETCH, PULL fast-forward only, and PUSH, never forced; one pane per repository. **Docker** shows the engine's containers by Compose project; start, stop, restart and pause from the row. **Log Watch** follows a log file as it grows, with **EXPLAIN** to ask the model of your AI settings about the lines you choose.
- Presets are templates: choosing one adds a saved layout that then follows your changes. A new install starts with all ten presets; an existing list of layouts is never added to.

## AI Agent

<p align="center">
  <img src="../screenshots/pane-agents.jpg" alt="The AI Agent pane on its own: session cards with their folder, status, last tool, model and token counts, a tree of subagents and background commands under one, and the list of changed files">
  <br><sub>AI Agent · made-up sessions</sub>
</p>

| | |
| --- | --- |
| Where | dev preset (Ctrl+Shift+F4); picker (Ctrl+Shift+A) "ai agent". One per layout: the picker focuses the pane already on screen. Can be popped up (▣ pop up) and brought forward (Ctrl+Shift+Z). |
| Reads | Claude Code's own local records in `~/.claude`, or the folder `CLAUDE_CONFIG_DIR` names |
| Updates | Only while an AI Agent pane is open. Folders are watched; a record that grew is read 400 ms later, only the part written since the last look. A session's process is checked for life once a minute. |
| Platforms | Wherever Claude Code keeps these records. Not verified by hand on macOS or Linux. |
| Privacy | Reads only; sends nothing anywhere, starts and stops nothing. Tool output inside a record is skipped, not parsed. |
| Settings | `agents.sources` in `settings.json`: whose records are read (so far `claude-code`; only agents listed there are read at all) |
| Status | *Experimental*: the records are Claude Code's and not documented, so a new version of Claude Code may change what can be shown. |

What a session card shows:

- One card per running Claude Code session: its name and folder, whether it is busy, the last thing it did (the tool, and what on), the model, the tokens in its view and the tokens written, and its answers.
- Below the card, the subagents it started and the commands it left running in the background, each **RUN**, **DONE**, **FAIL** or **STOP** (— when unknown), with a running subagent's own last step. They hang from the session as a tree; what a subagent starts in turn hangs under it (up to four levels).
- The finished ones fold into one row that says how they ended (for example *4 FINISHED 3 DONE 1 FAIL*); click it to see them. They stay ten minutes. All running tasks are shown, and up to 12 finished ones. A subagent that has reported but still has subagents of its own at work counts as running.
- A subagent or command still running when its session's process went is shown as unknown, never as done.
- Open a card for the tools it has used and the files it has changed (up to 60, with room for 20 of a subagent's). A file opens as a diff against the copy Claude Code kept before the session first touched it, drawn with the same diff view as the Git pane. What a subagent changed is marked **SUB** and has no such copy, so its diff says so.
- In a wide pane the list and the diff sit side by side; in a narrow one they are stacked. The divider between them can be dragged, and its position is kept per pane.

How it reads:

- Only while a pane is open, and incrementally: from the place it stopped, in 1 MB steps. A record over 32 MB is read from its last 512 kB, and its counts say *recent*.
- Measured on the developer's machine: parsing a whole 124 MB record took 944 ms; reading the last 64 kB took 0.27 ms. That is why a record is never parsed whole on a change.
- Only the model's own lines are parsed as JSON, plus a background task's ending notice and the result of a call it is waiting for; other tool results are skipped as text.

Limits:

- Only Claude Code is read today. A source for OpenAI's Codex is designed, with a mock-up, but not built ([agents-codex.md](../agents-codex.md), in Japanese).
- Because the format is undocumented, a Claude Code update can change or break what is shown until elecdex is updated.

## Git

<p align="center">
  <img src="../screenshots/pane-git.jpg" alt="The Git pane on its own: the changed files with lines added and removed, the diff of one file with changed words lit, and the commit graph with branch lines and names">
  <br><sub>Git</sub>
</p>

| | |
| --- | --- |
| Where | dev preset (Ctrl+Shift+F4); picker (Ctrl+Shift+A) "git status". Several panes can be added, one repository each. Can be popped up and brought forward (Ctrl+Shift+Z). |
| Reads | The repository you choose with **SELECT REPOSITORY**, through the `git` program (2.31 or later must be on `PATH`) |
| Updates | Only while the pane is shown. Re-read after each change, at most once a second, and never while nothing changes (no polling). |
| Writes | Only **FETCH**, **PULL** (fast-forward only) and **PUSH** (never forced), each pressed twice. Never stages, commits, checks out, merges or rebases. |
| Platforms | Windows: `.cmd` open commands are run through `cmd.exe`. Elsewhere a file with its execute bit set is shown in its folder, not opened. Not verified by hand on macOS or Linux. |
| Privacy | The layout keeps only an id for the repository (`git-repos.json` in the app's data folder holds the path), so a saved layout carries no path. The pane is tied to no other pane. |
| Settings | `git.openCommand` in `settings.json` (set there only, never from the page) |

What it shows:

- The staged, unstaged, untracked and conflicted files, each with its lines added and removed.
- The diff of the file chosen, unified or side by side, with the changed words lit and its syntax coloured. Text in a diff is drawn as text, never as HTML. An untracked file is shown up to 512 KB; a diff is cut at 3,000 lines.
- Changed pictures (PNG, JPEG, GIF, WebP, BMP, ICO, AVIF, up to 5 MB) are shown before and after instead of a diff, side by side or stacked, whichever draws them larger. Click one to see it alone: the wheel zooms, a drag moves, and **BEFORE** / **AFTER** compare the two at the same place. SVG is diffed as text.
- The commit graph: the lines of the branches and the names on each commit (the branch checked out, other branches, remotes, tags). It shows this branch with its upstream, or **ALL** of them, a hundred commits at a time with **MORE** (up to 2,000). A click opens a commit's files and diff; a rest on one shows a card with its message, author, date and what it changed.
- The divider between the file list and the diff, and between the files and the graph, can be dragged; double-click puts it back. The positions are kept per pane.

FETCH, PULL and PUSH:

| Button | What it does | When it refuses |
| --- | --- | --- |
| **FETCH** | Fetches from the remote and reports how far behind the branch is | Only in the cases below, which apply to all three |
| **PULL** | `--ff-only`: a fast-forward, never a merge commit, a conflict or an editor | The branch has diverged: it says **DIVERGED** and leaves the merge or rebase to the terminal |
| **PUSH** | Sends the branch onto the upstream its config names (`branch.<name>.remote` and `.merge`), one refspec, no tags, never `+` or `--force` | The remote has moved on: **REJECTED** (fetch, then pull). No upstream: left to `git push -u` in the terminal. Nothing to push, behind, or diverged: the button is not offered |

- None of the three is offered while the repository cannot be read, during a merge or rebase, with a detached HEAD, or when the branch has no upstream. elecdex checks this against its own last reading of the repository.
- Each button is pressed twice. The first press of PUSH says how many commits go where and that no hooks run, for example `push ↑2 to origin/main · no hooks`.
- **No hook runs**, for any of the three: `core.hooksPath` points at an empty folder of elecdex's own. A push therefore skips its pre-push checks (tests, lint), and says so before the second press.
- **A transport program named by the repository's own config refuses the press** (for example its own `core.sshCommand`, `core.gitProxy`, a credential helper that is not one git ships, `remote.<name>.uploadpack`). Such a repository is synced in the terminal.
- **Only https, http, ssh and git are spoken**: not a folder on this machine, not `ext::`, not a remote helper. A press on such a remote (a shared folder, often) fails with git's `transport 'file' not allowed` and says to run the same command in the terminal.
- Your own global and system git configuration is used for authentication, ssh and proxies. git is told there is no terminal to ask in; a transfer still waiting after 120 seconds is stopped and reported as **TIMED OUT**.
- The result is a toast with a short code (`PULLED 3 COMMITS`, `FETCHED · 2 COMMITS BEHIND`, `PUSHED 2 COMMITS`, `DIVERGED`, `REJECTED`, `PULL FAILED`) beside git's own words. One operation runs at a time per repository, and the pane re-reads the repository afterwards.

How git is run safely when it only reads:

- Every call disables `core.fsmonitor`, signature checks in the log, external diff programs and textconv. Clean filters set in the repository's own config are emptied; the user's global filters (Git LFS, for example) are left alone.
- Submodule working trees are not read. `--no-optional-locks` keeps status from writing the index, so the pane never competes with your own git for `index.lock`.
- If git is missing or the folder goes, the pane tries again every 30 seconds.

Opening a file:

- A double-click opens the file (in a diff, at that line). With `git.openCommand` set, that command is run as a program and its arguments, never through a shell, with `{file}`, `{line}` and `{dir}` filled in, for example `code -g "{file}:{line}"`.
- With it empty, the system's own application opens only text, pictures and PDFs that would not run (judged by the file's first bytes and its kind); anything else, such as a `setup.bat` in a fresh clone, is shown in its folder instead.
- Only files inside the working tree, outside `.git`, are opened or revealed.

## Docker

<p align="center">
  <img src="../screenshots/pane-docker.jpg" alt="The Docker pane on its own: made-up containers grouped by Compose project with their state, health, published ports, CPU and memory">
  <br><sub>Docker</sub>
</p>

| | |
| --- | --- |
| Where | dev preset (Ctrl+Shift+F4); picker (Ctrl+Shift+A) "docker containers". One per layout. Can be popped up and brought forward (Ctrl+Shift+Z). |
| Reads | The local Docker engine's API, over its socket, named pipe or a TCP port on this machine. The `docker` command is never run. |
| Updates | Only while the pane is on screen: one event stream; the list at the next quarter second after an event and every ten seconds; running containers' CPU and memory every five seconds. Behind another tab, minimised or put away, the engine is not asked. |
| Presses | ▶ start, ■ stop, ↻ restart, ❚❚ pause, ▶ resume (unpause). Never remove, kill or prune. |
| Platforms | Windows: Docker Desktop's `docker_engine` pipe. macOS: `~/.docker/run/docker.sock`, `/var/run/docker.sock`. Linux: `/var/run/docker.sock`, rootless `$XDG_RUNTIME_DIR/docker.sock`, Docker Desktop's `~/.docker/desktop/docker.sock`. Not verified by hand on macOS or Linux. |
| Privacy | Nothing is written to disk or logged. Commands, mounts and environment variables are not read; of the labels, only the Compose project, service and folder. No plugin can reach it. |

Finding the engine: as the `docker` command does, without running it - `DOCKER_HOST`, then the current context (`DOCKER_CONTEXT`, or `currentContext` in `~/.docker/config.json`), then the usual socket. This reaches Docker Desktop, the Linux daemon, rootless Docker, colima and OrbStack. An engine on another machine, over TLS or over ssh is not used, and the page cannot name one. The engine is looked for again on each connection, so switching context takes effect on the next.

What it shows:

- Containers grouped by Compose project (a click on a project folds it), in project, service and name order. **A row never moves when its container changes state**, so a button does not run away from the pointer.
- For each: the state and how long (UP, HEALTHY, UNHEALTHY, STARTING, PAUSED, RESTARTING, EXITED with a non-zero code, CREATED, DEAD), the health where the image has a check, the published ports and, for those running, CPU and memory.
- **ALL** or **RUN** (running only). Columns fold as the pane narrows: IMAGE first, then CPU and MEM, then PORTS.
- A click on a name copies it; a published TCP port opens in the browser; `›_` copies `docker exec -it <name> sh` for a shell. A rest on a name opens a card with what the row has no room for (the full image, Compose project and service, folder, every port with its address, memory limit, created time, id).
- The row under the pointer (or the keyboard) offers what its state takes. Stop, restart and pause ask a second time (the second press is armed for three seconds). Stop and restart give the container the usual 10-second grace. While a press is sent the row says STOPPING… and so on; the result arrives with the next listing.
- Up to 100 containers are listed (running ones first, then the newest). Usage is read for up to 24 running containers.

The link states, in the header:

| State | Meaning |
| --- | --- |
| STANDBY | The pane is not on screen, so the engine is not asked |
| LINKING / LINKED | Connecting / connected |
| NO DAEMON | Nothing answers: start Docker Desktop, or the service |
| DENIED | This user may not open the socket (on Linux, the docker group) |
| UNSUPPORTED | The engine's API is older than 1.24 |
| LINK ERROR | The engine is slow to answer; the last list stays on screen |

Not included: container logs, images, volumes and networks, Kubernetes, a shell inside the pane, remote engines.

## Log Watch

<p align="center">
  <img src="../screenshots/pane-logwatch.jpg" alt="The Log Watch pane on its own: a made-up log with levels coloured, a stack trace folded, five minutes of lines by level above, and an EXPLAIN answer from a stand-in below">
  <br><sub>Log Watch · a made-up log, EXPLAIN by a stand-in</sub>
</p>

| | |
| --- | --- |
| Where | dev preset (Ctrl+Shift+F4), the third tab behind Git and the AI chat; picker (Ctrl+Shift+A) "log watch". Several panes can be added, one file each. Can be popped up and brought forward (Ctrl+Shift+Z). |
| Reads | One log file per pane, chosen with **SELECT LOG FILE** (files only; Windows event logs, journald and macOS's `log stream` are not read) |
| Updates | Only while the pane is seen: the folder is watched and the file looked at once a second; only what was appended is read, and new lines reach the pane every quarter second. Nothing while hidden, and no notification. |
| Platforms | Windows: another process's appends can be reported late, and network drives or `\\wsl$` may report nothing - the once-a-second look covers both. On a Mac, ⌘ replaces Ctrl. Not verified by hand on macOS or Linux. |
| Privacy | Nothing is ever written to the file, and its contents are not written anywhere. **EXPLAIN** sends only the lines you chose, only on **SEND**. |
| Settings | Per pane: encoding, time display, WRAP, folding repeats, CHART, ERROR BAR, MASK, EXPLAIN's provider and model, muted patterns. For every pane: lines kept and lines read on opening (`logWatch` in `settings.json`). |

Choosing a file:

- **SELECT LOG FILE** opens the system's file picker. Files chosen before are listed under RECENT (up to 40). The layout keeps only an id; the path is in `log-files.json` in the app's data folder.
- **FOLLOW THE NEWEST LIKE IT** follows the newest file in that folder whose name differs only in its numbers - a log that starts a new file each day or each run (`2026-10-12T09_08_16_117Z-debug-0.log` becomes `*-debug-*.log`). When a newer one appears the pane switches to it and marks the switch.
- A file with NUL bytes in its first 8 KB is refused as binary. A file it may not read says CANNOT READ and why; one that does not exist yet says WAITING FOR FILE and opens when it appears.
- The file name in the status row is a button: a rest shows the full path, a click picks another file.

Reading:

- On opening, the last lines are read (500 by default; at most 4 MB from the end), then only what is appended.
- Behind another tab or with the window put away nothing is read. On coming back, what was written meanwhile arrives like any other lines, up to the latest (if more than 4 MB, its last 4 MB).
- A rotated or truncated file is read again from its start, marked *rotated · reading from its start*. The file is never held open.
- The encoding is detected (UTF-8, UTF-16LE/BE, Shift_JIS, EUC-JP, Windows-1252) and can be chosen by hand. When the text looks garbled, the status row says **TEXT LOOKS GARBLED · CHOOSE THE ENCODING ▸**.

Recognised formats: JSON lines (pino, bunyan, winston, Serilog...), logfmt, syslog (RFC 3164 and 5424), Apache and nginx access logs, IIS's W3C files, and the common "time [level] text". The rest is read as plain lines, with the level guessed from keywords. The format can be set by hand per file.

What it shows:

- Levels coloured; stack traces folded under their line (▸ +n opens them); a run of one pattern folded into ×n; a pattern seen for the first time marked **NEW**; **ERROR BURST** lit when errors come much faster than before (at least five errors in the last 15 seconds and at least four times the earlier 15-second average plus one, held for two seconds).
- Above, five minutes of lines by level (CHART); down the right, the errors and warnings marked (ERROR BAR), click to jump.
- A filter (text or `/regex/`, Escape clears it) and level toggles; **PAUSE** (reading goes on, the screen holds, *n HELD*); **MASK** (IP addresses, e-mail addresses, keys, `Bearer` tokens and values named password, secret, token, key, auth, session or cookie hidden); **WRAP**.
- A **PATTERNS** tab with each pattern's count, last minute and last seen, and **MUTE**.
- While the pointer is over the list it does not scroll on its own; new lines are counted in a *▼ n NEW* button.

EXPLAIN:

- Shown only when *Settings → AI* has a provider; otherwise the button reads **EXPLAIN · SET UP AI** and opens those settings.
- Click lines to choose them (Ctrl+click adds one, Shift+click a run; ⌘ on a Mac). **EXPLAIN** shows the text exactly as it will be sent; **SEND** sends it. **COPY** copies the same lines.
- **Only the lines you chose are sent** - with their stack traces, but not the lines around them, not the file's name or path, not the detected format. A chosen line hidden by the filter or levels is neither sent nor copied.
- With MASK on, the text is masked before it is sent; with it off, the preview says *MASK is off*.
- Up to 200 lines and 12,000 characters. A choice too long is refused, never cut.
- The answer is drawn as markdown, never as HTML, kept only in the pane's memory, and not added to the AI chat's history. One request at a time, stopped after 180 seconds. Your system prompt from the AI settings is added after EXPLAIN's own.

Lines kept and read:

| Setting | Choices | Default |
| --- | --- | --- |
| Lines kept to scroll back (`logWatch.keepLines`) | 1k, 5k, 20k, 50k | 5k |
| Lines read on opening (`logWatch.initialLines`) | 100, 500, 2k | 500 |

Measured on the developer's Windows machine: at 1,000 lines a second, parsing in main takes about 1 ms per quarter second; the whole app used 0.2% of a core in main and 2.4% in the page with 5k lines kept (0.3% in the page when repeats fold).

To try it, `node scripts/log-feed.mjs [file] --format=jsonl|logfmt|generic|syslog|clf|plain --rate=20` (in a checkout of the repository) writes a made-up log with stack traces, bursts and rotation.

## Common behaviour

- **Read only while seen.** Each of the four reads only while its pane is on screen (AI Agent: while it is open). Main's watches, streams and timers stop when the last such pane goes, and are dropped when the page reloads.
- **Nothing reaches the network** except Git's FETCH, PULL and PUSH, and Log Watch's EXPLAIN to the AI provider you set up.
- **No plugin API** reaches any of them.
- **Paths stay in main.** Git and Log Watch know repositories and files by id; the page never sends a path.
- **Text is drawn as text.** File contents, log lines and commit messages are never inserted as HTML.
- **For developers:** the tests never touch the machine. The AI Agent tests point `ELECDEX_CLAUDE_DIR` at a made-up folder, the Docker tests use a stand-in engine (`ELECDEX_DOCKER_STUB=1`), and the Git and Log Watch tests work in temporary folders.

## Design documents

In Japanese:

- [architecture.md](../architecture.md): §5.9 Git, §5.11 AI Agent, §5.17 Docker, §5.21 Log Watch
- [logwatch.md](../logwatch.md): Log Watch's design, decisions and measurements
- [agents-codex.md](../agents-codex.md): the Codex source, designed and not built
- [decisions.md](../decisions.md): decisions with reasons and measured numbers
- [Network access and data sources](data-sources.md)
