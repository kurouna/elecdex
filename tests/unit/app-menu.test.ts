import { KEYBINDING_ACTIONS } from '@shared/keybindings'
import type { MenuItemConstructorOptions } from 'electron'
import { describe, expect, it } from 'vitest'
import { APP_MENU_KEYS, appMenuTemplate } from '../../src/main/app-menu.js'

/**
 * The application menu: none on Windows and Linux, and on macOS only the app and Edit menus
 * (issue 18: without Edit, Cmd+C and Cmd+V did nothing in a text field), never one that reloads
 * or zooms the workspace, and no key registered that the keymap has.
 */

/** An Electron accelerator as the keymap writes a chord: Cmd is its Ctrl on a Mac. */
function asChord(accelerator: string): string {
  const parts = accelerator.split('+')
  const key = parts.pop() ?? ''
  const mods = new Set(parts.map((part) => (part === 'CommandOrControl' ? 'Ctrl' : part)))
  const ordered = ['Ctrl', 'Alt', 'Shift'].filter((mod) => mods.has(mod))
  return [...ordered, /^[A-Z]$/.test(key) ? `Key${key}` : key].join('+')
}

function registered(items: readonly MenuItemConstructorOptions[]): string[] {
  return items.flatMap((item) => [
    ...(typeof item.accelerator === 'string' && item.registerAccelerator !== false
      ? [asChord(item.accelerator)]
      : []),
    ...(Array.isArray(item.submenu) ? registered(item.submenu) : []),
  ])
}

describe('the application menu', () => {
  it('is none on Windows and Linux', () => {
    expect(appMenuTemplate('win32')).toBeNull()
    expect(appMenuTemplate('linux')).toBeNull()
  })

  it('is the app and Edit menus on macOS, nothing that reloads or zooms', () => {
    const template = appMenuTemplate('darwin') ?? []
    expect(template[0]?.role).toBe('appMenu')
    const edit = template[1]?.submenu as MenuItemConstructorOptions[]
    expect(edit.map((item) => item.role).filter(Boolean)).toEqual([
      'undo',
      'redo',
      'cut',
      'copy',
      'paste',
      'selectAll',
    ])
    expect(JSON.stringify(template)).not.toMatch(/reload|zoom|viewMenu|DevTools/i)
  })

  it('registers no key the keymap has: Redo shows Shift+Cmd+Z, which is the pane zoom', () => {
    const keys = [...registered(appMenuTemplate('darwin') ?? []), ...APP_MENU_KEYS]
    expect(keys).toContain('Ctrl+KeyC')
    const keymap = new Set<string>(KEYBINDING_ACTIONS.map((action) => action.chord))
    for (const key of keys) expect(keymap.has(key), key).toBe(false)
    expect(keymap.has('Ctrl+Shift+KeyZ')).toBe(true)
  })
})
