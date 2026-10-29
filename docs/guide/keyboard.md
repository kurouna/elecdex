English | [日本語](keyboard.ja.md) | [简体中文](keyboard.zh-CN.md)

# Keyboard and layouts — elecdex

elecdex is a science-fiction terminal emulator and system monitor for Windows, macOS and Linux, a rewrite of eDEX-UI. This page lists every keyboard shortcut by purpose, with its default chord and its id in `settings.json`, and explains how to rebind shortcuts, how conflicts and the system-wide show/hide shortcut work, and how to arrange the workspace with the mouse: moving panes, bringing one forward, saved layouts, presets, tab groups and pop-up panes. macOS and Linux are built and run by the automated tests only and are not sufficiently verified by hand.

## On this page

- [Shortcuts by purpose](#shortcuts-by-purpose)
- [Keys on other keyboard layouts](#keys-on-other-keyboard-layouts)
- [Shortcuts and the shell](#shortcuts-and-the-shell)
- [Rebinding shortcuts](#rebinding-shortcuts)
- [Conflicts](#conflicts)
- [System-wide show/hide shortcut](#system-wide-showhide-shortcut)
- [Running in the background](#running-in-the-background)
- [Status bar and window corner](#status-bar-and-window-corner)
- [Moving panes](#moving-panes)
- [Bringing a pane forward](#bringing-a-pane-forward)
- [Saved layouts](#saved-layouts)
- [Presets](#presets)
- [Tab groups](#tab-groups)
- [Pop up](#pop-up)

## Shortcuts by purpose

Every shortcut below is the default. All but the divider keys and Escape can be rebound in *Settings → Keyboard* (see [Rebinding shortcuts](#rebinding-shortcuts)); the *Action* column is the name the settings list and the action palette use, and the *id* is the key for `keybindings` in `settings.json`. On macOS, Ctrl in a chord also matches Cmd.

A shortcut that does nothing in the current state (*Applies when* below) is not taken: the key goes on to the focused pane. With no pane to its left or right, for example, Ctrl+Shift+← / → still reach the shell, where PSReadLine selects by word.

### Panes

| Chord | Action | id | What it does |
| --- | --- | --- | --- |
| Ctrl+Shift+A | Add a pane | `pane.add` | Opens the add-pane picker: any widget, right of, below or as a tab beside the focused pane (or popped up) |
| Ctrl+Shift+E | Split right | `pane.splitRight` | Splits the focused pane (a tab: its whole group) to the right |
| Ctrl+Shift+O | Split down | `pane.splitDown` | Splits the focused pane (a tab: its whole group) downward |
| Ctrl+Shift+T | New tab | `pane.newTab` | A new tab beside the focused pane |
| Ctrl+Shift+W | Close pane | `pane.close` | Closes the focused pane (or its × button, shown on hover); while a pane is forward, closes that pane |
| Ctrl+Shift+Z | Bring the pane forward | `pane.zoom` | Brings the focused pane forward over the workspace, and puts it back (Escape too). Applies only to a pane that can come forward |

### Focus and tabs

| Chord | Action | id | Applies when |
| --- | --- | --- | --- |
| Ctrl+Shift+] | Focus next pane | `focus.next` | Always |
| Ctrl+Shift+[ | Focus previous pane | `focus.previous` | Always |
| Ctrl+Shift+← | Focus the pane to the left | `focus.left` | *unreleased*. A pane lies that way - beside it and sharing some of that side; the nearest, the one sharing most when several touch - and the keyboard is not in a text field |
| Ctrl+Shift+→ | Focus the pane to the right | `focus.right` | As above |
| Ctrl+Shift+↑ | Focus the pane above | `focus.up` | As above |
| Ctrl+Shift+↓ | Focus the pane below | `focus.down` | As above |
| Ctrl+Tab | Next tab | `tab.next` | The focused pane is in a tab group (such as the shell's tabs), and the keyboard is not in a text field. *unreleased*: was Ctrl+Shift+→ |
| Ctrl+Shift+Tab | Previous tab | `tab.previous` | As above. *unreleased*: was Ctrl+Shift+← |
| Ctrl+Alt+Shift+→ | Next shell pane | `shell.next` | From a shell, when there is another shell pane (or group of shell tabs) to go to |
| Ctrl+Alt+Shift+← | Previous shell pane | `shell.previous` | As above |

### Layouts and presets

| Chord | Action | id | What it does |
| --- | --- | --- | --- |
| Ctrl+Shift+G | Saved layouts | `layout.saved` | Opens the layouts dialog: keep this arrangement by name, or go back to one |
| Ctrl+Shift+1 … 9, 0 | Apply the 1st … 10th saved layout | `layout.saved1` … `layout.saved10` | Applies the first ten saved layouts, in the order the dialog lists them (0 is the tenth). A key whose slot is empty is left to the focused pane |
| Ctrl+Shift+F1 … F10 | Go to the standard … blank preset | `layout.preset.standard` … `layout.preset.blank` | Goes to a preset: F1 standard, F2 network, F3 earth, F4 dev, F5 media, F6 desk, F7 ai, F8 cockpit, F9 retro, F10 blank |
| Ctrl+Shift+Backspace | Reset layout | `layout.reset` | Resets to the default layout; asks first while shells are open, as a switch does |

The preset keys are tied to the preset's id, not to its place, so a key you moved stays on the same preset.

### Shells

| Chord | Action | id | What it does |
| --- | --- | --- | --- |
| Ctrl+Shift+S | Focus the shell | `shell.focus` | Focuses the shell in its selected tab (adds a shell pane if there is none) |
| Ctrl+Shift+F | Search the shell | `shell.find` | Finds in the shell's scrollback: Enter / Shift+Enter for next and previous, Escape closes. Applies when there is a shell to search |
| Ctrl+Shift+K | Clear the shell's scrollback | `shell.clear` | Clears the focused shell's scrollback; cannot be undone. Only from a shell |
| Ctrl+Shift+= | Larger type in the shells | `shell.fontBigger` | Larger type in every shell. Applies when a shell is open |
| Ctrl+Shift+- | Smaller type in the shells | `shell.fontSmaller` | Smaller type in every shell |

The type size is kept as `terminal.fontSize` in `settings.json`: 13 px by default, from 8 to 32.

### Find and open

| Chord | Action | id | What it does |
| --- | --- | --- | --- |
| Ctrl+Shift+P | Find an action | `palette.open` | The action palette: every shortcut's action, saved layout, preset, theme, pane and settings section, found by typing, each with its key. What cannot be undone takes Enter twice |
| Ctrl+Shift+L | Search the launcher | `launcher.focus` | Searches the launcher; pops one up over the workspace if the layout has none |
| Ctrl+Shift+U | Open the utility pane | `utility.focus` | The utility pane: the next one in the layout, or popped up if the layout has none; pressed again, put away |
| Ctrl+Shift+. | Open settings | `settings.open` | The settings dialog |

In the action palette, ↑ ↓ choose, Tab and Shift+Tab change the kind of row, PageUp and PageDown move eight rows, Enter runs and Escape closes. A row that cannot run now stays in the list, set back with the reason (for example *not in a tab group*). Design: [docs/palette.md](../palette.md) (Japanese).

On Linux, IBus may keep Ctrl+Shift+U for typing a character by its code, so the key can be taken before elecdex sees it: rebind *Open the utility pane* there.

### Window and app

| Chord | Action | id | Platforms |
| --- | --- | --- | --- |
| F11 | Toggle fullscreen | `window.fullscreen` | All |
| Ctrl+Shift+M | Minimize window | `window.minimize` | Windows, Linux (macOS does not minimise a fullscreen window) |
| Ctrl+Shift+Q | Quit | `app.quit` | All. Quits even when closing only hides elecdex to the notification area |
| Ctrl+Alt+Shift+E | Show or hide elecdex | `window.toggle` | Works from any app. Off until turned on in *Settings → Window*; not in a Wayland session |

### Keys that are not rebindable

| Key | Where | What it does |
| --- | --- | --- |
| Arrow keys on a divider | Between two panes | Resize; Shift for larger steps |
| Double-click on a divider | Between two panes | Shares the room of the two panes beside it evenly |
| Escape | A pane brought forward | Puts it back |
| Escape | A dialog, the palette, a popped-up pane, a drag | Closes or cancels |

## Keys on other keyboard layouts

Chords are stored as physical keys (`KeyboardEvent.code`, such as `Ctrl+Shift+KeyA`), so a shortcut is the same key on every keyboard layout. This page names keys as a US keyboard prints them. On a Japanese keyboard, Ctrl+Shift+= is Ctrl+Shift+^ and Ctrl+Shift+[ / ] are Ctrl+Shift+@ / [. The app's own lists and tooltips name keys as your keyboard prints them.

## Shortcuts and the shell

- The shell has focus when elecdex starts.
- In a shell, selecting text copies it and a right-click pastes, as in PuTTY or Windows Terminal. Ctrl+C stays the shell's interrupt.
- A match the search bar moves to is not copied; only what you select yourself is.
- Shortcuts are taken before the focused shell sees the key. That is why every chord must include Ctrl or Alt (Cmd on macOS) or be a function key: every other key, plain or with Shift, still reaches the shell.
- While a dialog is open, shortcuts do nothing except *Quit* and *Toggle fullscreen*, so nothing behind the dialog changes unseen. Over a popped-up pane, the shortcuts that call up a pane and the action palette's also work.
- When a web pane has the keyboard, main takes the shortcuts from the page and runs them; a shortcut that does nothing at that moment is left to the page (a web page zooms with Ctrl+Shift+=, for example).

## Rebinding shortcuts

| | |
| --- | --- |
| Where | *Settings → Keyboard* (Ctrl+Shift+.) |
| Settings | `keybindings` in `settings.json`: action id → chord, or `null` for none |

![The settings dialog in the Tron theme, keyboard section, listing each shortcut's action and chord](../screenshots/elecdex-settings.jpg)

1. Open *Settings → Keyboard*.
2. Click a shortcut's chord. It shows *press keys…*.
3. Press the new keys. Escape cancels the recording.

- A chord needs Ctrl (Cmd on macOS), Alt or a function key (F1 to F24). Anything else is refused with *use Ctrl, Alt or a function key - the shell needs the rest*.
- *clear* removes a shortcut (it shows *none*); *default* puts one shortcut back; *reset all shortcuts* restores every default in the list. It leaves the system-wide show/hide shortcut alone.
- A tooltip in the app names a chord as it is bound now, never the default.
- In `settings.json`, only changed shortcuts are written; a chord equal to the default is dropped. An unusable chord, or an action id this build does not know, is ignored rather than failing the whole file. At most 64 overrides are kept.

```json
{
  "keybindings": {
    "app.quit": null,
    "utility.focus": "Ctrl+Alt+KeyU"
  }
}
```

## Conflicts

- A chord already in use is flagged in *Settings → Keyboard* with *in use by* and the other action.
- When two app actions share a chord, the one higher in the list keeps it.
- The system-wide show/hide shortcut is the exception. While it is on, the OS hands its keys to elecdex's window shortcut first, so an app shortcut with the same keys is the one flagged (*taken by the system-wide shortcut*) and stops working. While it is off, it holds no keys and takes part in no conflict.

## System-wide show/hide shortcut

| | |
| --- | --- |
| Where | *Settings → Window*, beside its switch; default Ctrl+Alt+Shift+E |
| Platforms | Windows, macOS, and Linux on X11. A Wayland session keeps system-wide shortcuts to itself, so the option says so instead |
| Settings | `window.globalShortcut` (default `false`); its chord is `window.toggle` in `keybindings` |

- It is registered with the operating system by the main process, and only when you turn it on, because it works from every app.
- It takes letters, digits and function keys only (the OS names punctuation keys by character, which moves between keyboard layouts). Anything else is refused with *use a letter, a digit or a function key*.
- If another app already holds the keys, it is turned back off with a note.
- It is left alone by *reset all shortcuts*, and gives its keys up while a shortcut is being recorded, so it can be recorded too.
- With elecdex in front it puts elecdex away; anywhere else it brings elecdex to the front.

## Running in the background

| | |
| --- | --- |
| Where | *Settings → Window* |
| Settings | `window.trayIcon`, `window.minimizeToTray`, `window.closeToTray`, `window.globalShortcut`, `window.startInBackground`: all `false` by default |
| Platforms | Differs; see the table. elecdex offers only what the machine can actually do |

*Settings → Window* has the icon outside the window (in the notification area, the menu bar or the tray), where a click opens elecdex and the right-click menu opens the settings or quits, and *launch elecdex when you sign in*, which the settings show as turned off again if the system has turned it off. What else is there depends on the machine:

| | Windows | macOS | Linux |
| --- | --- | --- | --- |
| minimise / close to the icon | yes | no — closing the window already leaves elecdex running, and it comes back from the Dock | when the desktop has somewhere to put an icon |
| system-wide show/hide shortcut | yes | yes | on X11; a Wayland session keeps those keys to itself, so the option says so instead |
| launch when you sign in | Run-key entry, removed by the uninstaller | the app's login item (macOS may ask you to allow it) | `~/.config/autostart/elecdex.desktop` |
| *start in the background* | yes | no — the login item takes no arguments | yes |

- Every option is off until you turn it on. Whether elecdex launches at sign-in is not kept in `settings.json`: the platform holds it, and you can turn it off there too.
- Whatever happens, starting elecdex again brings the running one back, so the window is never out of reach.
- The macOS and Linux columns are built and tested by CI only; they are not sufficiently verified by hand.

## Status bar and window corner

- The status bar appears when you move the pointer to the bottom edge. At its left is a numbered button per saved layout (the number is the key that applies it), then buttons for adding a pane, saved layouts, resetting the layout, settings, theme, sound and exit.
- In fullscreen on Windows and Linux, moving the pointer into the top-right corner brings down minimize, leave-fullscreen and close buttons. Close puts elecdex in the notification area when it is set to keep running there, and otherwise quits after asking.

## Moving panes

- Drag a pane by its title (a pane without one, such as the clock, by the rule along its top) and drop it on another pane: it goes in beside that pane, on the side nearest the pointer.
- Hold Ctrl (Cmd on macOS) while dropping to add it to that pane as a tab instead, at the place along the tab strip your pointer picks. Over the group a tab is already in, the same Ctrl reorders it.
- A shell tab drags out on its own, and a tab group's header moves the whole group.
- Escape cancels a drag.
- A moved shell keeps its session.

## Bringing a pane forward

| | |
| --- | --- |
| Where | Ctrl+Shift+Z, or the ⤢ button beside a pane's × in its top-right corner |
| Settings | None; nothing is saved |

- A pane brought forward covers most of the window over the other panes, which keep their place behind a shade.
- A tab group has the same corner; its × closes every tab in it, and a tab's own × closes just that tab. A tab comes forward with its group, so its other tabs are still there to switch to.
- Panes that gain nothing from the room are left out: the system strip and the network status have no ⤢ at all, and the calculator, timer, mixer, now playing, disk and process list come forward as a panel in the middle rather than over the whole window.
- While forward, the pane is framed just outside its own edges (the shell's notched border a size up, with corner brackets), so it keeps all the room it was given. Its corner holds ⤡ alone, and Ctrl+Shift+W closes it.
- Escape, the shortcut again, the button or a click on the shade puts it back.
- Nothing is rearranged and nothing is saved: a shell keeps its session and a web pane its page, and the app starts with every pane in its place.

## Saved layouts

![The layouts dialog over the standard layout in the Tron theme: the presets as saved layouts, 1 to 9 in view, each with a thumbnail of its arrangement, and below them the shelf of presets with their keys Ctrl+Shift+F1 to F10](../screenshots/elecdex-layouts.jpg)

| | |
| --- | --- |
| Where | Ctrl+Shift+G, or *layouts* in the status bar; the first ten on Ctrl+Shift+1 to 9 and 0, and on the numbered status bar buttons |
| Files | `layouts.json` (the saved layouts) and `layout.json` (the live arrangement) in the app's data folder; see [Themes and settings](themes-settings.md#layout-files) |
| Settings | `layout.confirmSwitch` (default `true`): *Settings → General → Layouts* |

- A layout follows the work: the one you are in is marked, and whatever you do to the workspace is kept in it, so coming back finds it as you left it.
- Resetting the layout leaves every saved layout as it is; what you arrange after that belongs to none until you save it or apply one.
- In the dialog a layout can be renamed, and moved up or down; its place in the list *is* its number key. Up to twelve are kept.
- Applying a layout replaces the workspace, which ends the shells of the panes it replaces, exactly as closing those panes would. While shells are open you are asked first, and the question carries the way to stop asking (*Settings → General → Layouts*).
- The old arrangement powers off like a tube and the new one comes up pane by pane, as at boot; with motion reduced, there is no animation.
- **Copy `layouts.json` to another computer and your arrangements come with you.** It holds nothing that belongs to this machine. The dialog's *layouts.json* button shows it in the file manager.

## Presets

Ten presets sit under the list in the layouts dialog, each drawn as a small map of its panes.

| Preset | Key | Panes |
| --- | --- | --- |
| **standard** | Ctrl+Shift+F1 | The default layout |
| **network** | Ctrl+Shift+F2 | The globe over the connections, beside Wi-Fi over Ethernet |
| **earth** | Ctrl+Shift+F3 | ORBIT, the globe, quakes and the weather |
| **dev** | Ctrl+Shift+F4 | AI AGENT; Docker and a shell; the clipboard, a timer and a shell; GIT, an AI chat and Log Watch (each group as tabs) |
| **media** | Ctrl+Shift+F5 | YouTube (TV) with what is playing, the spectrum and the mixer beneath, X and RSS as tabs |
| **desk** | Ctrl+Shift+F6 | Notes, a timer, the calculator, tasks, the calendar, the clipboard and the utility pane |
| **ai** | Ctrl+Shift+F7 | Two AI chats one over the other, and the ELEC system over the GPU pane |
| **cockpit** | Ctrl+Shift+F8 | The CLUSTER pane in place of the system column, a shell under it, and Wi-Fi over Ethernet beside it |
| **retro** | Ctrl+Shift+F9 | The ELEC-16 and the CHIP-8 as tabs of one pane, the spectrum at sixteen bands under them |
| **blank** | Ctrl+Shift+F10 | No pane at all, to add your own |

- Every preset but cockpit and blank keeps the system column on the left, so a switch changes the stage and leaves the instruments where they were.
- Choosing a preset adds a layout made from it and goes there; from then on it is one of your layouts, following your work. Choosing it again goes back to that layout rather than adding another. ↺ puts it back to the preset.
- Each preset's key does the same from anywhere.
- A new install starts with all ten on Ctrl+Shift+1 to 0; an existing list is never added to.

## Tab groups

- A tab group can hold any panes, not only shells, so a pane you need now and then can share a place with the shells instead of taking room of its own (RSS or the weather behind the shell tabs, for example).
- To put a pane in a group, Ctrl-drag it onto the group (see [Moving panes](#moving-panes)), or focus a pane of the group, open the picker (Ctrl+Shift+A or the status bar's add button) and choose **⧉ new tab** before the widget.
- Clicking the tabs switches between them. A shell in a background tab keeps running, and its session and screen are there when you switch back.
- Groups do not nest: a tab holds one pane.

## Pop up

- **▣ pop up** in the add-pane picker shows a widget over the workspace instead, framed with only a ×, and leaves the layout as it was. It is not saved; Escape, the × or a click beside it puts it away.
- Every built-in pane can be popped up except the shell, the timer (a countdown put away could not ring) and the file browser; no web page or plugin can.
- What you choose in a popped-up pane is there when you pop it up again, until the app quits.
- Ctrl+Shift+L does the same for the launcher when the layout has none, and the launcher goes once it has started something. Ctrl+Shift+U does it for the utility pane.

See also: [Themes and settings](themes-settings.md) · [Plugins](plugins-use.md) · [Develop](develop.md)
