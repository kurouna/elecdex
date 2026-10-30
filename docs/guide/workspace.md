English | [日本語](workspace.ja.md) | [简体中文](workspace.zh-CN.md)

# The workspace — elecdex

elecdex is a science-fiction desktop terminal emulator and system monitor, a rewrite of eDEX-UI on
Electron, Svelte and TypeScript. This page describes its workspace: panes, splits and tabs, moving,
closing and bringing a pane forward, pop-up panes, saved layouts, the CRT transitions and the
motion setting, themes, the settings dialog, the action palette, running in the background, and
every default keyboard shortcut. elecdex runs on Windows, macOS and Linux; it is developed and used
on Windows, and macOS and Linux have only been run by the automated tests on GitHub Actions, so
they are not sufficiently verified.

## On this page

- [Panes, splits and tabs](#panes-splits-and-tabs)
- [Moving and resizing panes](#moving-and-resizing-panes)
- [Adding and closing panes](#adding-and-closing-panes)
- [Bringing a pane forward](#bringing-a-pane-forward)
- [Pop-up panes](#pop-up-panes)
- [Saved layouts](#saved-layouts)
- [Look and feel](#look-and-feel)
- [Settings](#settings)
- [Action palette](#action-palette)
- [Plugins](#plugins)
- [Running in the background](#running-in-the-background)
- [Utility](#utility)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [The status bar and the window](#the-status-bar-and-the-window)

<p align="center">
  <img src="../screenshots/elecdex-layouts.jpg" alt="The layouts dialog over the standard layout in the Tron theme: the presets as saved layouts, 1 to 9 in view (blank, on 0, further down), each with a thumbnail of its arrangement, and below them the shelf of presets with their thumbnails - blank's an empty frame - where each stands, and their keys Ctrl+Shift+F1 to F10">
  <br><sub>Layouts (Ctrl+Shift+G) · Tron</sub>
</p>

**Layout** — every pane can be moved by dragging its title, closed, split, tabbed, resized and
brought back; the layout is saved and can be reset. An arrangement can be kept by name and returned
to later (Ctrl+Shift+G, or *layouts* in the status bar), or started from one of the ten
[presets](presets.md).

## Panes, splits and tabs

| | |
| --- | --- |
| Stored in | `layout.json` (the live arrangement, hand-editable); `layouts.json` (saved layouts) |
| Design | [architecture.md §5.1](../architecture.md) (Japanese) |

- The workspace is a tree. Its leaves are **panes**, each holding one widget - a shell, a monitor,
  a web page or a plugin alike. A **split** lays its children out in a row or a column at shares of
  its room; a **tab group** holds panes that share one place.
- A tab group can hold any panes, not only shells, so a pane you need now and then can share a
  place with the shells instead of taking room of its own - RSS or the weather behind the shell
  tabs, for example. Clicking the tabs switches between them; a shell in a background tab keeps
  running, and its session and screen are there when you switch back.
- Groups do not nest: a tab holds one pane.
- Splits carry no header. A shell keeps its TERMINAL header, which is also its group's drag handle
  and shows the shell's folder.
- A pane in a background tab or a minimised window stops reading what it does not need: most
  panes take their data only while they are seen and keep what they last showed. A shell, an
  answer being written, a timer or alarm, quake alerts, plugins and web pages go on unseen.
- **Moving a pane remounts it.** What must survive a move is kept in the pane's state or in the
  main process: a moved shell keeps its session and scrollback.
- If a pane fails, that pane alone stops with **RETRY**, and a red notice says what went wrong;
  **COPY DETAILS** copies only the message, the version and the platform.

## Moving and resizing panes

- **Drag a pane by its title** (a pane without one, such as the clock, by the rule along its top)
  and drop it on another pane: it goes in beside that pane, on the side nearest the pointer.
- Hold **Ctrl** (**Cmd** on macOS) while dropping to add it to that pane as a tab instead, in the
  place along the strip your pointer picks. Over the group a tab is already in, the same Ctrl
  reorders it.
- A shell tab drags out on its own, and a tab group's header moves the whole group.
- **Escape** cancels a drag. A moved shell keeps its session.
- While you drag, brackets at its corners mark the area the pane would take. A
  dropped pane flies from where it was to where it lands, and so does a pane it changed places
  with; one dropped into a group as a tab flickers on there.
- **Resize** by dragging the divider between two panes, or focus it and use the **arrow keys**
  (**Shift** for larger steps). **Double-click** a divider to share the room of the two panes
  beside it evenly. A divider moves only the two panes beside it.

## Adding and closing panes

<p align="center">
  <img src="../screenshots/elecdex-blank.jpg" alt="The blank preset in the Amber theme: a workspace with no pane, and over it the add-pane picker listing every widget with its description, the placements right, below, new tab and pop up at its top">
  <br><sub>The add-pane picker over an empty layout · Amber</sub>
</p>

- **Ctrl+Shift+A** (or the add button in the status bar) opens the **add-pane picker**: every
  widget with its description, and the placements **right**, **below**, **⧉ new tab** and
  **▣ pop up** at its top (**Tab** cycles them). The new pane goes beside the focused pane.
- To put a pane in a group, Ctrl-drag it onto the group, or focus a pane of the group, open the
  picker and choose **⧉ new tab** before the widget.
- A widget that can only exist once and is already in the layout is focused, whatever placement is
  chosen; no second one is made.
- **Ctrl+Shift+E** splits the focused pane to the right, **Ctrl+Shift+O** downward (a tab: its
  whole group), and **Ctrl+Shift+T** adds a tab beside the focused pane.
- **Ctrl+Shift+W** closes the focused pane, as does its **×** button (shown on hover). A tab
  group's × closes every tab in it; a tab's own × closes just that tab. The closed pane powers off
  and the panes beside it extend into its room.
- A close can be put back. Its notice offers **undo** for six seconds, and the pane
  goes back where it was - beside the same neighbour with the same share of the room, or among
  the same tabs - keeping whatever you changed in the meantime; with its neighbour gone too, it
  goes beside the first pane. Only the last close is kept. A shell put back keeps its session and
  scrollback; a web page opens again at the address it showed.
- Closing the last pane of any layout leaves it empty: *no panes in this layout* and
  **+ add pane** open the picker, and the first pane chosen fills the screen. In an empty layout
  the split and new-tab keys add a shell.
- **Ctrl+Shift+Backspace** resets to the default layout. While shells are open it asks first, as a
  layout switch does; the reset button in the status bar asks by a second click instead.

## Bringing a pane forward

| | |
| --- | --- |
| Shortcut | **Ctrl+Shift+Z** (again to put it back); the ⤢ button beside a pane's × |
| Saved | never: the app starts with every pane in its place |
| Design | [architecture.md §5.5](../architecture.md) (Japanese) |

A pane you want a better look at can be brought forward: **Ctrl+Shift+Z**, or the **⤢** button
beside its × in the top-right corner (a tab group has the same corner). It covers most of the
window over the other panes, which keep their place behind a shade.

- Most panes come forward over about 90% of the workspace. The calculator, timer, mixer, now
  playing, disk, process list and utility pane come forward as a panel in the middle (at most
  880x560) rather than over the whole window. The system strip and the network status have no ⤢
  at all.
- It is framed while it is forward - the shell's notched border a size up, with corner brackets and
  `ESC · RETURN` along the bottom - just outside its own edges, so it keeps all the room it was
  given.
- **Escape**, the shortcut again, the button or a click on the shade puts it back. While a pane is
  forward its corner holds only **⤡** (put back), never a × beside it; **Ctrl+Shift+W** closes
  the pane that is forward.
- A tab comes forward with its group, so its other tabs are still there to switch to. Moving to
  another pane from the keyboard flies the pane back as the button does; the next tab of its group
  stays forward.
- Nothing is rearranged and nothing is saved: a shell keeps its session and a web pane its page.
  The panes behind do not move by a pixel, so no other shell is resized. Any change to the tree
  (a split, a move, a reset, closing another pane), starting a drag, or focusing another pane puts
  it back.
- With motion reduced it appears and goes without the flight.

## Pop-up panes

| | |
| --- | --- |
| Where | **▣ pop up** in the add-pane picker; the action palette's PANE rows; **Ctrl+Shift+L** (launcher) and **Ctrl+Shift+U** (utility) when the layout has none |
| Saved | never: neither the pane nor its place; its choices last until the app quits |
| Design | [architecture.md §5.13](../architecture.md) (Japanese) |

**▣ pop up** shows a widget over the workspace instead, framed with only a ×, and leaves the layout
as it was - it is not saved, and **Escape**, the × or a click beside it puts it away.

- It has no zoom, drag, split or tabs. Opening any dialog puts it away.
- Every built-in pane can be popped up except the shell (a session nobody holds is ended), the
  timer (a countdown put away could not ring), the file browser (it follows a shell of the layout),
  CHIP-8 and ELEC-16; no web page or plugin can be. The picker lists those as *pane only*.
- What you choose in a popped-up pane is there when you pop it up again, until the app quits.
- **Ctrl+Shift+L** does the same for the launcher when the layout has none, and the launcher goes
  once it has started something. **Ctrl+Shift+U** goes to the utility pane: the next one in the
  layout, or popped up if the layout has none; pressed again, put away.
- Only the weather pane's place picker opens over a pop-up.

## Saved layouts

| | |
| --- | --- |
| Shortcut | **Ctrl+Shift+G** (the LAYOUTS dialog); **Ctrl+Shift+1** … **9**, **0** (the first ten); **Ctrl+Shift+F1** … **F10** (presets) |
| Stored in | `layouts.json`, at most 20 entries |
| Settings | *Settings → General → Layouts* → *ask before switching layout* (on by default) |
| Design | [architecture.md §5.6](../architecture.md) (Japanese) |

An arrangement worth keeping can be saved by name - **Ctrl+Shift+G**, or *layouts* in the status
bar - and returned to later; the first ten are on Ctrl+Shift+1 to 9 and 0, and on the numbered
buttons at the left of the status bar.

- **A layout follows the work.** The one you are in is marked, and whatever you do to the
  workspace is kept in it, so coming back finds it as you left it. It is not a snapshot.
- Resetting the layout leaves all of them, and what you arrange after that belongs to none until
  you save it or apply one.
- In the dialog a layout can be renamed, and moved up or down - its place in the list *is* its
  number key. Up to 20 are kept; the ones past the tenth have no key and are applied from the
  dialog.
- **Applying a layout replaces the workspace**, which ends the shells of the panes it replaces,
  exactly as closing those panes would. While shells are open you are asked first, and the question
  carries the way to stop asking (*Settings → General → Layouts*). The shells of the applied layout
  start new.
- The old arrangement powers off like a tube and the new one comes up pane by pane, as at boot -
  the shells first, then the other panes in no fixed order, in about a third of the boot's time -
  and not at all with motion reduced.
- Switching first writes out any change not yet saved, so nothing done just before is lost.
- The saved layouts are kept in one file that holds nothing belonging to this machine (a shell's
  session is left out): **copy `layouts.json` to another computer and your arrangements come with
  you.** The dialog's *layouts.json* button shows it in the file manager. A broken entry in the
  file is dropped alone; the rest are kept.
- The ten **presets** sit on a shelf under the list. Choosing one adds a layout made from it; see
  [Layout presets](presets.md#how-presets-work).

## Look and feel

**Look and feel** — seven themes that switch live: Tron, Amber, Phosphor and White for the HUD,
Black (White turned over, near-black on a pale ground with the same scanlines), and Business (Dark)
and Business (Light) in Windows 11 colours, system fonts and full-colour icons for an ordinary
working day - each of them is in a picture on the [presets](presets.md) page.

- **CRT power-on boot sequence** after a Linux-style boot log of this machine's real facts.
- **Panes power on and off.** A pane added later powers on the same way; a closed one powers off
  and the panes beside it extend into its room; switching to a saved layout powers the whole screen
  off and brings the next one up pane by pane; dialogs, notices and pop-ups power on and off too.
- When a split or a move takes room from a pane, a beam runs along the edges that
  moved; a tab brought to the front of its group flickers on, as a set changing channel; and the
  frame of the pane the keyboard moves to (**Ctrl+Shift+]** / **[** and the arrows, the shell keys, a pane's own
  shortcut) flares once. A pane you click does not flare.
- Scanlines and glow, synthesised interface sounds, a themed title bar and a status bar that slides
  in from the bottom edge.
- Short entrance effects - a wave of dates for each month, a forecast rising in, new headlines and
  earthquakes sliding in with a three-second highlight - follow the motion setting.
- **Motion** is in *Settings → General → Appearance*: **system** (follows the operating system's
  reduce-motion setting; the default), **full** or **reduced**. With motion reduced (or the
  system's reduce-motion setting), nothing moves: the CRT transitions, the flight of a pane brought
  forward and the entrance effects are skipped.
- Ambient animation pauses while the window is hidden or minimised.
- The light themes, Black and Business (Light), use darker status colours and a minimum contrast
  in the shell.

## Settings

| | |
| --- | --- |
| Shortcut | **Ctrl+Shift+.**; the settings button in the status bar |
| Stored in | `settings.json`, hand-editable |

<p align="center">
  <img src="../screenshots/elecdex-settings.jpg" alt="The settings dialog in the Tron theme, keyboard section">
  <br><sub>Settings → Keyboard · Tron</sub>
</p>

**Settings** — a settings dialog for theme, motion, sound, the terminal's start folder, saved
layouts, the launcher, rebindable keyboard shortcuts and the update check, all saved to a
hand-editable `settings.json`. Its sections:

| Section | What it holds |
| --- | --- |
| *General* | appearance (theme, motion), sound, terminal, git, chip-8, elec-16, layouts, launcher, web panes |
| *Window* | the icon outside the window, minimising and closing to it, the system-wide show/hide shortcut, and startup; shown only where the machine can do any of it |
| *Keyboard* | every shortcut, rebindable |
| *Alerts* | earthquakes and tsunamis |
| *AI* | AI providers and their keys, the chat's long conversations and system prompt, the ELEC system's standpoints |
| *Plugins* | plugins |
| *Updates* | the update check: it asks GitHub for the latest release once a day; nothing is downloaded or installed |

## Action palette

| | |
| --- | --- |
| Shortcut | **Ctrl+Shift+P** |
| Design | [docs/palette.md](../palette.md) (Japanese), [architecture.md §5.24](../architecture.md) |

**Action palette** — Ctrl+Shift+P finds anything by typing: every shortcut's action, saved layout,
preset, theme, pane and settings section, each with the key it is on now. A row that cannot run
here stays, set back with the reason; what cannot be undone takes Enter twice.

<p align="center">
  <img src="../screenshots/elecdex-palette.jpg" alt="The action palette over the standard layout in the Tron theme, with layout typed: the kinds of row as chips with their counts - all, action, layout, preset, theme, pane, settings - and the rows found, Reset layout and Saved layouts with layout underlined, then the ten saved layouts and the presets, each with its key on the right, standard marked current">
  <br><sub>Action palette (Ctrl+Shift+P) · Tron</sub>
</p>

| Kind | What Enter does |
| --- | --- |
| ACTION | what the action's shortcut does, judged the same way (from the pane focused before the palette opened) |
| LAYOUT | applies the saved layout, asking first while shells are open, as the number keys do |
| PRESET | goes to the layout made from the preset, or adds one, as Ctrl+Shift+F1 … F10 do |
| THEME | applies the theme |
| PANE | pops the widget up where it can be, otherwise adds it to the right; a single pane already in the layout is focused |
| SETTINGS | opens the settings dialog at that section |

- Type to filter: the matched letters of each name are underlined. With nothing typed, the five
  most recent rows come first (kept only until the page reloads), then each kind under a heading.
- **↑** / **↓** choose, **PageUp** / **PageDown** move eight rows, **Tab** / **Shift+Tab** cycle the
  kind, **Enter** runs, **Escape** closes. The mouse chooses and clicks.
- A row that cannot run here stays, dimmed, with its reason - for example *not in a tab group* for
  Next tab, *only from a shell* for Clear the shell's scrollback. Enter on it does nothing.
- **Enter twice**: Quit, Clear the shell's scrollback, and Reset layout when no confirmation
  dialog would ask (no shell open, or *ask before switching layout* off). The row turns red and
  says *ENTER AGAIN*; moving or typing disarms it.
- While the palette is open, other shortcuts do nothing except Quit and fullscreen; Ctrl+Shift+P
  again does nothing. It opens over a pop-up (which goes) and from a focused web pane.
- It has no theme preview, no individual settings, and no way for plugins to add rows; a plugin's
  pane is listed under PANE as in the picker.

## Plugins

**Plugins** — a pane of your own from one TypeScript file, run in a sandboxed worker with only the
permissions you grant it. See [Using plugins](plugins-use.md).

## Running in the background

| | |
| --- | --- |
| Settings | *Settings → Window* (show an icon, minimize to it, keep running when the window is closed, show or hide elecdex from any app); *Settings → Window → Startup* (launch elecdex when you sign in, start in the background) |
| Default | every option off until you turn it on |
| Platforms | what is offered is what this machine can do (see the table); macOS and Linux are not sufficiently verified |

**Running in the background** — an icon in the notification area, the menu bar or the tray; a
system-wide show/hide shortcut; and launching when you sign in. What is offered is what the machine
can actually do, so it differs: Windows adds minimising and closing to the notification area, macOS
leaves those to the Dock (closing the window already keeps elecdex running) and its login item
cannot start hidden, and on Linux the tray and the shortcut depend on the desktop — a session that
has neither says so instead of showing a switch that does nothing. All off until turned on in
*Settings → Window*.

| | Windows | macOS | Linux |
| --- | --- | --- | --- |
| icon outside the window | notification area | menu bar | system tray, when the desktop has one (stock GNOME needs an extension) |
| minimise / close to the icon | yes | no — closing the window already leaves elecdex running, and it comes back from the Dock | when the desktop has somewhere to put an icon |
| system-wide show/hide shortcut | yes | yes | on X11; a Wayland session keeps those keys to itself, so the option says so instead |
| launch when you sign in | Run-key entry, removed by the uninstaller | the app's login item (macOS may ask you to allow it) | `~/.config/autostart/elecdex.desktop` |
| *start in the background* | yes | no — the login item takes no arguments | yes |

- The icon: a click opens elecdex, and the right-click menu opens the settings or quits. On
  Windows a new icon may be kept under the **^** on the taskbar. The icon is also shown whenever
  the window is hidden, so a hidden window can always be brought back.
- **Show or hide elecdex from any app**: **Ctrl+Alt+Shift+E** by default, set beside its switch. It
  takes letters, digits and function keys only, and if another app already holds the keys it is
  turned back off with a note. It is left alone by *reset all shortcuts*, and gives its keys up
  while a shortcut is being recorded, so it can be recorded too. While it is on, an app shortcut
  with the same keys is flagged in *Settings → Keyboard*: the OS hands the keys to elecdex's
  window shortcut first. With elecdex in front it puts elecdex away (to the icon when a tray option
  is on, else to the taskbar); anywhere else it brings elecdex to the front.
- *Launch elecdex when you sign in*: the settings show it as turned off again if the system has
  turned it off (on Windows, in Task Manager's startup apps). It is available only in the installed
  app. *Start in the background* starts elecdex hidden at sign-in.
- **Ctrl+Shift+Q** quits, also when closing only hides elecdex to the notification area. An
  explicit quit always quits.
- Whatever happens, starting elecdex again brings the running one back, so the window is never out
  of reach.

## Utility

**Utility** — small tools in one pane: keep the machine awake while you say so, make a QR code (a
text, an address or a Wi-Fi network), and encode, decode, hash or read a time. **Ctrl+Shift+U**
goes to it, or pops it up. See [Utility](panes-desk.md#utility).

## Keyboard shortcuts

Every shortcut except the divider keys can be rebound in *Settings → Keyboard*: click one and press
the new keys. A shortcut needs **Ctrl** (**Cmd** on macOS), **Alt** or a function key, so every
other key still reaches the shell, and a chord already in use is flagged. Keys are named as a US
keyboard prints them; they are the same keys on others (on a Japanese keyboard, Ctrl+Shift+= is
Ctrl+Shift+^ and Ctrl+Shift+[ / ] are Ctrl+Shift+@ / [). The app's own lists and tooltips name
them as your keyboard prints them, as they are bound now.

| Shortcut | Action |
| --- | --- |
| Ctrl+Shift+A | add a pane: any widget, right of, below, as a tab beside the focused pane, or popped up |
| Ctrl+Shift+E | split the focused pane (a tab: its whole group) to the right |
| Ctrl+Shift+O | split the focused pane (a tab: its whole group) downward |
| Ctrl+Shift+T | new tab beside the focused pane |
| Ctrl+Shift+W | close the focused pane, or the pane that is forward |
| Ctrl+Shift+Z | bring the focused pane forward over the workspace, and put it back (Escape too) |
| Ctrl+Shift+] / [ | focus the next / previous pane |
| Ctrl+Shift+← / → / ↑ / ↓ | focus the pane that way; with none there, the key goes to the pane |
| Ctrl+Shift+Backspace | reset to the default layout (asks first while shells are open) |
| Ctrl+Shift+G | saved layouts |
| Ctrl+Shift+1 … 9, 0 | apply the first ten saved layouts, in the order the dialog lists them (0 is the tenth); an empty slot leaves the keys to the focused pane |
| Ctrl+Shift+F1 … F10 | go to a preset: standard, network, earth, dev, media, desk, ai, cockpit, retro, blank |
| Ctrl+Shift+L | search the launcher (pops one up if the layout has none) |
| Ctrl+Shift+U | the utility pane: the next one in the layout, or popped up; pressed again, put away (on Linux, IBus may keep these keys for typing by code: rebind it) |
| Ctrl+Shift+S | focus the shell in its selected tab (adds a shell pane if there is none) |
| Ctrl+Shift+F | find in the shell's scrollback (Enter / Shift+Enter for next and previous, Escape closes) |
| Ctrl+Shift+K | clear the shell's scrollback |
| Ctrl+Shift+= / - | larger or smaller type in every shell |
| Ctrl+Tab / Ctrl+Shift+Tab | next / previous tab in the focused tab group, such as the shell's tabs (Ctrl+Shift+→ / ← until v0.0.48) |
| Ctrl+Alt+Shift+→ / ← | from a shell: next / previous shell pane (or group of shell tabs) |
| Ctrl+Shift+. | settings |
| Ctrl+Shift+P | the action palette |
| F11 | toggle fullscreen |
| Ctrl+Shift+M | minimize the window (Windows, Linux) |
| Ctrl+Shift+Q | quit |
| Ctrl+Alt+Shift+E | show or hide elecdex from any app (off until turned on in *Settings → Window*; not in a Wayland session) |
| Arrow keys on a divider | resize (Shift for larger steps) |
| Double-click on a divider | share the room of the two panes beside it evenly |

- In a shell, selecting text copies it and a right-click pastes, as in PuTTY or Windows Terminal;
  Ctrl+C stays the shell's interrupt. A match the search bar moves to is not copied - only what you
  select yourself is. With no pane to its left or right, Ctrl+Shift+← / → still reach the shell,
  where PSReadLine selects by word.
- A shortcut that does not apply where you are leaves its keys to the pane: Ctrl+Shift+Z on a pane
  that does not come forward, the tab keys outside a tab group.

## The status bar and the window

- The **status bar** slides in when the pointer reaches the bottom edge. At its left is a numbered
  button per saved layout - the number is the key that applies it - and buttons for adding a pane,
  saved layouts, resetting the layout, settings, theme, sound and exit.
- In fullscreen on Windows and Linux, moving the pointer into the top-right corner brings down
  minimize, leave-fullscreen and close buttons; close puts elecdex in the notification area when it
  is set to keep running there, and otherwise quits after asking.
- App flags: `--windowed` (not fullscreen), `--no-intro` (skip the boot sequence).
