import type { MenuItemConstructorOptions } from 'electron'

/**
 * The application menu: none, but on macOS the two the system expects - the app's own (About,
 * Hide, Quit) and Edit (Cut, Copy, Paste, Select All), without which Cmd+C and Cmd+V do nothing
 * in a text field there (issue 18). Never Electron's default: its View menu took Ctrl+R
 * (reloading the workspace) and Ctrl+0, Ctrl+= and Ctrl+- (zooming it) from keys a web pane or
 * a dialog did not use. Every shortcut of elecdex's own is the keymap's (shared/keybindings.ts).
 *
 * Edit's items are written out rather than taken as `editMenu`, so each key is in sight: Redo's
 * Shift+Cmd+Z is shown but not registered, as it is the keymap's (pane.zoom takes Cmd for Ctrl
 * on a Mac), and a registered one would be taken before the page heard it. A unit test holds
 * every registered key off the keymap. Pure, so that test runs on every platform.
 */
export function appMenuTemplate(platform: NodeJS.Platform): MenuItemConstructorOptions[] | null {
  if (platform !== 'darwin') return null
  return [
    { role: 'appMenu' },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'CommandOrControl+Z' },
        { role: 'redo', accelerator: 'Shift+CommandOrControl+Z', registerAccelerator: false },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CommandOrControl+X' },
        { role: 'copy', accelerator: 'CommandOrControl+C' },
        { role: 'paste', accelerator: 'CommandOrControl+V' },
        { role: 'selectAll', accelerator: 'CommandOrControl+A' },
      ],
    },
  ]
}

/**
 * The keys the app menu registers with the system on macOS, as the keymap writes a chord (Cmd
 * is the keymap's Ctrl there). `appMenu`'s are Electron's own: Hide, Hide Others, Quit.
 */
export const APP_MENU_KEYS = ['Ctrl+KeyH', 'Ctrl+Alt+KeyH', 'Ctrl+KeyQ'] as const
