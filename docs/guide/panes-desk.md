English | [日本語](panes-desk.ja.md) | [简体中文](panes-desk.zh-CN.md)

# Desk panes — elecdex

elecdex is a science-fiction terminal emulator and system monitor for Windows, macOS and Linux. This page covers its desk panes: the **Calculator** (with its expression syntax), **Notes**, **Tasks** with reminders, the **Timer** with countdowns and alarms, the **Clipboard** history and snippets, the **Calendar** with holidays, and the **Utility** pane (AWAKE, QR, CODEC). It says what each pane keeps and where (notes, tasks, alarms and snippets are files the main process owns, not pane state), what the clipboard pane reads and never reads, and how reminders and alarms are scheduled. Nothing on this page uses the network. elecdex is developed and used on Windows; on macOS and Linux it has been built and run only by the automated tests and is not sufficiently verified by hand.

**On this page**

- [desk preset](#desk-preset)
- [Calculator](#calculator)
- [Notes](#notes)
- [Tasks](#tasks)
- [Timer](#timer)
- [Clipboard](#clipboard)
- [Calendar](#calendar)
- [Utility](#utility)
- [Where desk data is kept](#where-desk-data-is-kept)
- [See also](#see-also)

## desk preset

<p align="center">
  <img src="../screenshots/elecdex-desk.jpg" alt="The desk preset in the Black theme: a notes pane with a release checklist, a timer and a calculator under it; a tasks pane with deadlines drawn as meters over a clipboard history of made-up copies; three months of the calendar over the calculator ELEC-16 SCI, in front of the utility pane's tab, answering sin(45)+1/2 with its exact form (1+√2)/2">
  <br><sub>desk · Black</sub>
</p>

The **desk** preset (Ctrl+Shift+F6) holds, beside the system column: notes over a timer and a calculator; tasks over the clipboard history; and the calendar over the utility pane, with the scientific calculator [ELEC-16](panes-retro.md#elec-16) SCI in a tab behind it.

- **Desk panes** — a calculator you type into (full-width digits and 3百万 read as typed, with a tape and a tally for a pasted column of numbers), plain notes that save themselves, tasks whose deadlines are drawn as meters and announced whether or not their pane is open, and a timer with a stopwatch whose laps stack up like a spectrum, countdowns that run beside it, and alarms for the times the day is built around. A clipboard history, under the tasks, of what you copy while it is on screen, to put back with a click, and under the calendar the utility pane (keep the machine awake, QR codes, encoding and hashes) with the scientific calculator ELEC-16 SCI behind its tab.
- **Utility** — small tools in one pane: keep the machine awake while you say so, make a QR code (a text, an address or a Wi-Fi network), and encode, decode, hash or read a time.

The **dev** preset (Ctrl+Shift+F4) also holds a clipboard pane, with a timer and a shell in the tabs behind it. The default layout has the calendar in its right column.

## Calculator

<p align="center">
  <img src="../screenshots/pane-calc.jpg" alt="The Calculator pane on its own: an input line with its answer beneath it, and the tape of earlier answers">
  <br><sub>Calculator</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** preset (Ctrl+Shift+F6), or the picker (Ctrl+Shift+A, "calculator"); several may be open. Not in the default layout. Can be brought forward at a fixed size (Ctrl+Shift+Z). |
| Reads / data source | What you type. Nothing is evaluated as code: the parser is elecxzy's, vendored unedited with its tests. |
| Privacy | No network, no files. |

A line you type into with the answer already showing beneath it, and everything answered so far on a tape you can take numbers back out of. Full-width digits, `×` `÷`, a magnitude after digits (`3百万`, `5千`) and thousands separators (`1,234,567`; inside a function's brackets a comma still parts its arguments) are read as typed, so an expression can be written without leaving the Japanese keyboard or retyping a figure copied from a document.

- `ans` is the answer before this one; `rate = 8 * percent` keeps a name in the register row for later lines.
- `0x` adds a 32-column bit map under the answer (for an integer that fits in 32 bits; a negative one is shown as its two's complement).
- `C` clears the line and, with nothing on it, the tape. `?` on an empty line shows everything the calculator knows, and ↑ walks back through what was typed.
- The **tally** mode summarises a pasted column of numbers - count, sum, mean, median, standard deviation, quartiles - with a histogram and a box plot, and does not mistake the parts of a date for numbers of their own. It reads up to 20,000 numbers.
- Results are rounded to 12 significant digits and shown with thousands separators, and with hex and binary where they help.
- The same evaluator works out `Ctrl+=` in [Notes](#notes) and a duration typed into the [Timer](#timer).

### Expression syntax

| Element | Syntax |
| --- | --- |
| Numbers | `42`, `3.14`, `.5`, `1e-3`; `0x1F`, `0b1010`, `0o17`; `1,234,567` |
| Japanese magnitudes | After digits only: `十` `百` `千` `万` `億` `兆` and combinations such as `百万`, `千万`, `百億` (`3百万` is 3,000,000). Kanji numerals alone (`三百万`) are not read. |
| Full-width input | `１２３`, `＋`, `×`, `÷` are read as `123`, `+`, `*`, `/` |
| Arithmetic | `+ - * / %`; division by zero is an error, not infinity |
| Power | `^`, right to left (`2^3^2` is `2^9`); `-2^2` is `-4` |
| Factorial | `5!`, up to `170!` |
| Bitwise (32-bit) | `&` `\|` `~` `<<` `>>`; exclusive or is `xor(a, b)` |
| Grouping | `( )`, nested up to 64 deep |
| Names | `ans`; your own names set with `name = expression` |

Operator precedence, loosest first: `|`, `&`, `<< >>`, `+ -`, `* / %`, unary `+ - ~`, `!`, `^`. There is no implicit multiplication: `2tb` is an error; write `2 * tb`. A line may be at most 500 characters.

| Functions | Notes |
| --- | --- |
| `sqrt cbrt abs exp sign pow` | |
| `ln log log2 log10` | `log(x)` is base 10; `log(x, base)` |
| `sin cos tan asin acos atan atan2 sinh cosh tanh` | Radians: `sin(rad(30))` |
| `rad deg` | Degrees to radians and back |
| `round floor ceil trunc` | `round(x, digits)` |
| `min max sum avg hypot` | Any number of arguments |
| `gcd lcm fact` | |
| `and or xor not shl shr` | 32-bit |

| Constants | Value |
| --- | --- |
| `pi e tau phi` | Mathematical constants |
| `percent permille bp` | 0.01, 0.001, 0.0001 (`4800 * 12 * percent`) |
| `k thousand million billion trillion` | 10³ to 10¹² |
| `man oku cho` | 万 億 兆 (10⁴, 10⁸, 10¹²) |
| `kb mb gb tb` | Decimal bytes (10³ ...) |
| `kib mib gib tib` | Binary bytes (1024 ...) |
| `minute hour day week` | In seconds |
| `tsubo` | In square metres |

Names you assign: up to 20 in the register row, 1 to 16 letters, digits or underscores starting with a letter or underscore. A constant, a function name or `ans` cannot be assigned to.

Examples: `1920 * 1080`, `2 * tb / (512 * gib)`, `3百万 / 12`, `round(2 / 3, 4)`, `(1 << 20) / kib`.

## Notes

<p align="center">
  <img src="../screenshots/pane-notes.jpg" alt="The Notes pane on its own: plain text with the note's title in the title bar and the save bar in the footer">
  <br><sub>Notes</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** preset (Ctrl+Shift+F6), or the picker (Ctrl+Shift+A, "notes"); several may be open. Not in the default layout. |
| Data | `notes.json` in the app's data folder (userData), written by the main process; not in the layout. |
| Updates | Saved half a second after you stop typing. |

Plain text with no markup and no rendering, saved half a second after you stop typing - the bar in the footer fills while the write is due and flashes when it lands, so a silent autosave is never something to wonder about.

- Notes are kept in `notes.json` under the app's userData, not in the layout, so they outlive the pane and two panes can show the same note (the second says *edited elsewhere* rather than overwriting what you are typing).
- The first line names the note; the title bar lists them all, each with a × to delete it (with an undo).
- *Save as .md…* and *delete* (with an undo) are under the settings button.

| Key | Action |
| --- | --- |
| Ctrl+= | Works out the expression the caret is in and writes the answer after it, leaving prose alone |
| Ctrl+F | Find in the note (Esc closes the search) |
| Ctrl+N | New note |
| Ctrl+S | Save now |

## Tasks

<p align="center">
  <img src="../screenshots/pane-todo.jpg" alt="The Tasks pane on its own: tasks with their deadlines drawn as meters and the nearest deadline counting down in the header">
  <br><sub>Tasks</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** preset (Ctrl+Shift+F6), or the picker (Ctrl+Shift+A, "tasks"); several may be open. Not in the default layout. |
| Data | `tasks.json` in the app's data folder, written by the main process. |
| Updates | Reminders are scheduled by the main process with one timer for the next deadline; nothing is polled. |
| Settings | The pane's settings button: reminders (kept in `settings.json`, shared by every tasks pane). |

A list where each deadline is drawn as a meter of how much of the task's life has gone, amber as it runs out and red once it is past, with the nearest deadline counting down in the header.

- Typing `歯医者 明日 9:00`, `review fri 18:30` or `毎週 掃除` reads the date and the repeat out of the line - and shows what it understood before the task is added, so a misreading is caught there and then; a line it does not understand is left exactly as typed.
- A task is corrected where it is read: click its title to rename it, click its time to set a deadline in the same words (an empty line takes it off), and from the keyboard Delete removes the task and F2 renames it.
- Completed tasks are listed under DONE, which folds away when you want it to.

### Reminders

The reminder for the next deadline is scheduled by the app itself: it arrives with the pane closed, on another tab, or never opened, as a card in the corner with *done*, *snooze* and *open*, and as a system notification when elecdex is not in front.

| Setting | Default |
| --- | --- |
| remind me | On |
| system notification when away | On |
| sound (when interface sounds are on) | On |
| snooze | 10 minutes (1 to 1440) |
| warn … min early | 0 minutes (0 to 1440) |

- One timer waits for the next deadline of all; a machine with nothing waiting has no timer running.
- The schedule is worked out again when the computer wakes from sleep, since a timer counts time the machine was awake.
- A wait longer than about 24.8 days is taken in steps, and each deadline is announced once.

## Timer

<p align="center">
  <img src="../screenshots/pane-timer.jpg" alt="The Timer pane on its own: a stopwatch with its laps drawn as bars">
  <br><sub>Timer</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** preset (Ctrl+Shift+F6), behind the clipboard in the **dev** preset (Ctrl+Shift+F4), or the picker (Ctrl+Shift+A, "timer"); several may be open. Not in the default layout. Can be brought forward at a fixed size (Ctrl+Shift+Z). |
| Data | Running timers are wall-clock moments in the pane's state; alarms are `alarms.json` in the app's data folder, written by the main process. |
| Updates | The readout is drawn by the shared 10 fps loop; alarms are scheduled by the main process. |

Three instruments in one pane.

- **Stopwatch.** Laps stand as bars that grow while they are being timed and lock with a flash when taken, fastest and slowest marked, with a held peak across the tallest.
- **Countdowns.** Up to six, each with its own duration, that burn down a ladder of segments, one going out at a time, pulsing in the last ten seconds and saying so in a card when they land. A countdown is built up by tapping `+1 +3 +5 +10 +25`, which add to what is set, and the field beside them sets an exact number of minutes. A duration typed by hand goes through the calculator, so `90/2` is forty-five minutes.
- The stopwatch and the countdowns are separate machines, as they are on a phone: starting one does not start the other, resetting one leaves the other alone, and a countdown goes on running (and still goes off) while the stopwatch is the mode on screen, which each mode says in its heading.
- Space starts and stops what is on screen, wherever the focus is in the pane (except in a field or on a button).
- Everything is kept as wall-clock moments rather than a count of ticks, so a pane moved, a tab switched away from, a reload and a restart all leave a running timer exactly where it was. The readout shows tenths, which is what the shared 10 fps draw loop can honestly show, while laps are recorded to the millisecond.
- **Alarms.** A time of day with a label, on the days you choose, switched on and off from a list rather than made again each time - waking up, the start of lunch. They are kept in `alarms.json` and scheduled by the app, so one goes off with the pane closed or never opened, as a card that waits to be answered and (when elecdex is not in front) a system notification. A one-off switches itself off once it has rung. `07:30`, `1730`, `7`, `19.5` and `１９：３０` are all read as times.

## Clipboard

<p align="center">
  <img src="../screenshots/pane-clipboard.jpg" alt="The Clipboard pane on its own: copies of made-up text, newest first, each tagged TXT, URL, PATH, NUM or CLR">
  <br><sub>Clipboard</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** and **dev** presets, or the picker (Ctrl+Shift+A, "clipboard history"). One pane at a time. Not in the default layout. |
| Reads / data source | The system clipboard, read by the main process (never by the page). |
| Updates | Four times a second (on the quarter seconds), only while a clipboard pane is on screen and not paused. A text over a million characters is read every 2 seconds. |
| Platforms | Private copies are recognised on Windows, macOS and KDE (below). macOS and Linux are not sufficiently verified by hand. |
| Privacy | What is copied while no clipboard pane is on screen is never kept. A copy marked private is never read. The history lives in memory only and is gone when elecdex quits; no plugin can reach it. Only snippets you keep are written to disk. |
| Settings | None in the settings dialog. In the pane: **PAUSE**, **MASK**, **CLEAR**, and the **history** / **snippets** switch. |

What you copy while the pane is on screen, newest first, with its size and how long ago, each tagged with what it is - TXT, URL, PATH, NUM, or CLR with a swatch - and RICH under that when it was copied with its formatting (HTML, or the RTF that Word and WordPad copy).

- Resting the pointer on one (or reaching it with the keyboard) opens a card with the whole of it (up to its first 600 characters), as the git pane does for a commit: its text, what came with it and when it was copied.
- Click one (or Enter) to put it back on the clipboard, formatting and all, and paste it wherever you like; ↑ ↓ move between entries and Delete or × takes one out. Putting an entry back does not move it in the list.
- The same text copied again moves up rather than appearing twice, and a selection dragged in a shell - which copies at every step - is one entry.
- **Only while seen.** Behind another tab, with the window minimised or put away, or with **PAUSE** pressed, nothing is read, and what is copied then is not kept. When the pane appears, what is on the clipboard at that moment is taken in.
- **Private copies.** A copy marked private the way password managers mark theirs is recognised from the list of its formats alone; its text is never read, only counted ("N private copies left out"):

| System | Mark |
| --- | --- |
| Windows | `ExcludeClipboardContentFromMonitorProcessing`, `Clipboard Viewer Ignore`, `CanIncludeInClipboardHistory` set to 0 |
| macOS | `org.nspasteboard.ConcealedType`, `org.nspasteboard.TransientType` |
| KDE | `x-kde-passwordManagerHint` |

- Up to 50 entries are kept in memory and are gone when elecdex quits - nothing is written to disk, and no plugin can reach them. A text is kept whole up to 200,000 characters; a longer one shows its beginning, marked NOT KEPT, and cannot be put back. The page receives only a preview of each entry; the full text stays in the main process.
- **MASK** hides what they say (the filter field and the cards too); **CLEAR** (pressed twice) empties the list and the clipboard with it.
- Text only: an image or files on the clipboard are not kept. The pane learns of a copy by seeing the clipboard's text change, so the same text copied twice with nothing in between is one copy.
- It does not paste for you and does not sync with the system's own clipboard history.

### Snippets

Behind the pane's **snippets** switch are the texts you chose to keep.

- **SNIP** on an entry keeps it, formatting and all (a ★ marks it from then on); its text is copied by the main process and never passes through the page. **+ NEW** writes one by hand, with an optional name (Ctrl+Enter saves, Esc cancels). The same text is not kept twice.
- **COPY** puts a snippet on the clipboard without adding it to the history.
- Drag a snippet by its number (or Alt+↑ ↓) to move it, **EDIT** or F2 to change it - a new text drops the formatting it was copied with - and × pressed twice deletes it.
- Up to 100 snippets are kept in `snippets.json` beside the settings: unlike the history, they are written to disk, but only what you kept. MASK hides them too. No plugin can reach them.

## Calendar

<p align="center">
  <img src="../screenshots/pane-calendar.jpg" alt="The Calendar pane on its own: the month with today marked">
  <br><sub>Calendar</sub>
</p>

| | |
| --- | --- |
| Where | The default layout's right column, the **desk** preset, or the picker (Ctrl+Shift+A, "calendar"). |
| Reads / data source | Nothing; holidays are computed locally. |
| Settings | The pane's settings button: holiday calendars (none by default; kept in the pane's state). |

The month with today marked; ‹ › or the mouse wheel change month, and the dates sweep in the way it moved. Given room - a wide pane, or the pane brought forward with Ctrl+Shift+Z - the month before and the month after join it either side, dimmed, and the arrows move all three. The settings button ticks holiday calendars (Japan for now, computed locally), and the next holiday is named below the month.

- Japan's national holidays are computed from the holiday law: fixed dates, the Monday holidays, the equinoxes from the standard approximation, substitute holidays and the day between two holidays, with the one-off moves of 2019 to 2021 listed. They cover 2000 to 2099 and are checked against the Cabinet Office's published lists. No network, and no yearly data to refresh.
- Saturdays are drawn in the theme's information colour, Sundays and holidays in its danger colour. The calendar's text is in English whatever the language. With more than one country ticked, a holiday's name carries its country's tag.

## Utility

<p align="center">
  <img src="../screenshots/pane-utility.jpg" alt="The Utility pane on its own, showing the AWAKE module">
  <br><sub>Utility</sub>
</p>

| | |
| --- | --- |
| Where | The **desk** preset, or the picker (Ctrl+Shift+A, "utility"); several may be open. Ctrl+Shift+U focuses a utility pane in the layout (pressed again, the next), pops one up when the layout has none, and closes the pop-up when pressed again. Can be brought forward at a fixed size (Ctrl+Shift+Z). |
| Reads / data source | Nothing outside the pane; everything runs on this machine. |
| Platforms | AWAKE goes through Electron's power-save blocker on every platform. On Linux, IBus uses Ctrl+Shift+U for Unicode input; rebind the shortcut in *Settings → Keyboard* ([Rebinding shortcuts](keyboard.md#rebinding-shortcuts)) if it does not arrive. macOS and Linux are not sufficiently verified by hand. |
| Privacy | No network. No plugin can reach any of it. CODEC's input is never written to disk; a Wi-Fi password is kept only sealed by the system's encryption. |
| Settings | In the pane. The module shown and each module's choices are kept in the pane's state; the AWAKE hold is kept in `awake.json`. |

Small tools behind a switch (`AWAKE | QR | CODEC`), one at a time, and the pane can be popped up. Everything runs on this machine with no network, and no plugin can reach any of it.

### AWAKE

AWAKE keeps the machine from sleeping.

| Choice | Effect |
| --- | --- |
| OFF | Nothing held |
| SYSTEM | The system does not sleep; the screen may go dark |
| DISPLAY | The screen stays on too (and so does the system) |
| For | ∞, 30M, 1H, 2H or 4H; +30M adds half an hour (up to 24 hours from now) |

- It is asked of the system through Electron's power-save blocker, so no program is started. Closing the lid or choosing sleep still sleeps.
- The hold belongs to the app, not the pane: it goes on with the pane closed and is taken up again after a restart until you turn it off or its time runs out. While elecdex is not running, nothing holds (the operating system releases the request with the process, a crash included).
- While it holds, the status bar says so (`awake · system · until 15:42`, and its bottom-edge tick lights up; clicking it pops up the pane on AWAKE), as does the tray's tooltip, and the boot log names it. On battery the pane says so, but does not turn the hold off.
- The end waits on one timer, checked again when the computer wakes; nothing ticks.

### QR

QR makes a code for a text, an address (`https://` is added when there is no scheme) or a Wi-Fi network (the format a phone joins by pointing its camera).

- Error correction L to H (M by default). Input is UTF-8, so Japanese works. The pane shows the bytes used against the largest code's capacity at that level (L 2953, M 2331, Q 1663, H 1273 bytes) and says `OVER CAPACITY` past it.
- In the theme's colours - always dark on light, and black on white where a theme's contrast is not enough - with a quiet zone of four modules. COPY puts it on the clipboard as a picture.
- The Wi-Fi password is kept only sealed by the system's encryption, as the AI keys are, and a code that holds it is veiled until you press REVEAL (veiled again when the pane is hidden or moved). A password sealed on another machine cannot be opened (`SEALED ON ANOTHER MACHINE`); on Linux without a keyring it is not saved at all (`NOT SAVED · NO KEYRING`).

### CODEC

| Operation | What it does |
| --- | --- |
| ENCODE | Base64, Base64URL, URL-encoding, hex |
| DECODE | Base64, URL-encoding, hex; lays out a JWT (the signature is not checked) |
| HASH | SHA-1, SHA-256, SHA-512 |
| TIME | A Unix time (seconds or milliseconds) to a date and back; empty is now |
| WIDTH | Full-width ASCII to half-width and back, and NFKC |
| UUID | A new version 4 UUID each time |

- The result updates as you type; a failure is said in the result field. COPY copies the result; ⇅ moves the result into the input, to decode again.
- What you type into it is never written to disk (it survives a pane being moved, not a quit). Input is up to 200,000 characters.

## Where desk data is kept

| What | Where | Written by |
| --- | --- | --- |
| Notes | `notes.json` | The main process |
| Tasks | `tasks.json` | The main process |
| Alarms | `alarms.json` | The main process |
| Clipboard snippets | `snippets.json` | The main process |
| AWAKE hold | `awake.json` | The main process |
| Reminder settings | `settings.json` (`reminders`) | The main process |
| Clipboard history | Memory only, gone at quit | — |
| CODEC input | Page memory only, gone at quit | — |
| Calendar holidays, the utility module, QR inputs, a running timer | The pane's state | — |

All files are in the app's data folder (Electron's userData). A pane keeps only display choices and ids, so notes, tasks, alarms and snippets outlive the pane that shows them, and reminders and alarms go off with no pane open: they wait on one `setTimeout` in the main process, never a poll.

## See also

- [Presets: desk](presets.md#desk)
- [Design: §5.14 clipboard, §5.16 utility](../architecture.md) (Japanese).
- [Decision log](../decisions.md) (Japanese): the calculator's evaluator, notes without markdown, reminders on one timer, alarms.
- [The vendored calculator](../../src/shared/calc/vendor/README.md).
