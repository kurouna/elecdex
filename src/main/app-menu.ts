import type { MenuItemConstructorOptions } from 'electron'

/**
 * The application menu: none, but on macOS the two the system expects - the app's own (About,
 * Hide, Quit) and Edit (Cut, Copy, Paste, Select All), without which Cmd+C and Cmd+V do nothing
 * in a text field there. Never Electron's default: its View menu took Ctrl+R (reloading the
 * workspace) and Ctrl+0, Ctrl+= and Ctrl+- (zooming it) from keys a web pane or a dialog did not
 * use. Every shortcut of elecdex's own is the keymap's (shared/keybindings.ts). Pure, so a unit
 * test holds it on every platform.
 */
export function appMenuTemplate(platform: NodeJS.Platform): MenuItemConstructorOptions[] | null {
  if (platform !== 'darwin') return null
  return [{ role: 'appMenu' }, { role: 'editMenu' }]
}
