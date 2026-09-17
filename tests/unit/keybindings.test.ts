import { describe, expect, it } from 'vitest'
import {
  availableOn,
  chordFromEvent,
  conflicts,
  effectiveBindings,
  formatChord,
  isGlobal,
  isValidChord,
  keymap,
  normalizeChord,
  withBinding,
} from '../../src/shared/keybindings.js'

const key = (
  code: string,
  mods: Partial<Record<'ctrl' | 'meta' | 'alt' | 'shift', boolean>> = {},
) => ({
  code,
  ctrlKey: mods.ctrl ?? false,
  metaKey: mods.meta ?? false,
  altKey: mods.alt ?? false,
  shiftKey: mods.shift ?? false,
})

describe('keybindings', () => {
  it('only accepts chords a shell does not need typed', () => {
    expect(isValidChord('Ctrl+Shift+KeyA')).toBe(true)
    expect(isValidChord('Alt+KeyX')).toBe(true)
    expect(isValidChord('F11')).toBe(true)
    expect(isValidChord('Shift+F5')).toBe(true)
    expect(isValidChord('KeyA')).toBe(false)
    expect(isValidChord('Shift+KeyA')).toBe(false)
    expect(isValidChord('Ctrl+ShiftLeft')).toBe(false)
    expect(isValidChord('Ctrl+Ctrl+KeyA')).toBe(false)
    expect(isValidChord('Super+KeyA')).toBe(false)
  })

  it('opens the settings with Ctrl+Shift+.', () => {
    expect(keymap({}, 'win32').get('Ctrl+Shift+Period')).toBe('settings.open')
    expect(keymap({}, 'win32').get('Ctrl+Shift+Comma')).toBeUndefined()
    expect(chordFromEvent(key('Period', { ctrl: true, shift: true }))).toBe('Ctrl+Shift+Period')
    expect(formatChord('Ctrl+Shift+Period')).toBe('Ctrl+Shift+.')
  })

  it('reads chords from key events, Cmd counting as Ctrl', () => {
    expect(chordFromEvent(key('KeyA', { ctrl: true, shift: true }))).toBe('Ctrl+Shift+KeyA')
    expect(chordFromEvent(key('KeyA', { meta: true, shift: true }))).toBe('Ctrl+Shift+KeyA')
    expect(chordFromEvent(key('F11'))).toBe('F11')
    expect(chordFromEvent(key('ShiftLeft', { shift: true }))).toBeNull()
    expect(chordFromEvent(key('KeyA'))).toBeNull()
  })

  it('normalizes and formats', () => {
    expect(normalizeChord('Shift+Ctrl+KeyA')).toBe('Ctrl+Shift+KeyA')
    expect(formatChord('Ctrl+Shift+BracketRight')).toBe('Ctrl+Shift+]')
    expect(formatChord('Ctrl+Alt+Digit1')).toBe('Ctrl+Alt+1')
  })

  it('applies overrides, falls back from invalid ones, and can unbind', () => {
    const bindings = effectiveBindings(
      {
        'pane.add': 'Alt+KeyP',
        'app.quit': null,
        'pane.close': 'KeyW',
      },
      'win32',
    )
    expect(bindings['pane.add']).toBe('Alt+KeyP')
    expect(bindings['app.quit']).toBeNull()
    expect(bindings['pane.close']).toBe('Ctrl+Shift+KeyW')
    const map = keymap({ 'pane.add': 'Alt+KeyP' }, 'win32')
    expect(map.get('Alt+KeyP')).toBe('pane.add')
    expect(map.has('Ctrl+Shift+KeyA')).toBe(false)
  })

  it('leaves the system-wide show/hide shortcut to main, on Windows only', () => {
    expect(isGlobal('window.toggle')).toBe(true)
    expect(isGlobal('app.quit')).toBe(false)
    expect(effectiveBindings({}, 'win32')['window.toggle']).toBe('Ctrl+Alt+Shift+KeyE')
    expect(effectiveBindings({}, 'darwin')['window.toggle']).toBeNull()
    expect(effectiveBindings({}, 'linux')['window.toggle']).toBeNull()
    // The page never acts on it: main takes the keys from the OS.
    expect(keymap({}, 'win32').has('Ctrl+Alt+Shift+KeyE')).toBe(false)
    expect([...keymap({}, 'win32').values()]).not.toContain('window.toggle')
    // Off, it takes part in no clash: the OS does not hold its keys.
    expect(conflicts({ 'pane.add': 'Ctrl+Alt+Shift+KeyE' }, 'win32')).toEqual({})
    // On, it holds them before the page, so the app action is the one that loses.
    expect(
      conflicts({ 'pane.add': 'Ctrl+Alt+Shift+KeyE' }, 'win32', { globalActive: true }),
    ).toEqual({ 'pane.add': 'window.toggle' })
    expect(conflicts({}, 'win32', { globalActive: true })).toEqual({})
    // Clashes between app actions are reported as before either way.
    expect(conflicts({ 'app.quit': 'Ctrl+Shift+KeyA' }, 'win32', { globalActive: true })).toEqual({
      'app.quit': 'pane.add',
    })
  })

  it('reports conflicts, the first action keeping the chord', () => {
    const overrides = { 'app.quit': 'Ctrl+Shift+KeyA' }
    expect(conflicts(overrides, 'win32')).toEqual({ 'app.quit': 'pane.add' })
    expect(keymap(overrides, 'win32').get('Ctrl+Shift+KeyA')).toBe('pane.add')
  })

  it('has minimise on Windows and Linux only, and elsewhere its chord stays free', () => {
    expect(availableOn('window.minimize', 'win32')).toBe(true)
    expect(availableOn('window.minimize', 'linux')).toBe(true)
    expect(availableOn('window.minimize', 'darwin')).toBe(false)
    expect(availableOn('pane.add', 'darwin')).toBe(true)

    expect(keymap({}, 'win32').get('Ctrl+Shift+KeyM')).toBe('window.minimize')
    expect(keymap({}, 'darwin').has('Ctrl+Shift+KeyM')).toBe(false)
    expect(
      effectiveBindings({ 'window.minimize': 'Alt+KeyM' }, 'darwin')['window.minimize'],
    ).toBeNull()
    // On macOS another action may take the chord without being told it clashes.
    const overrides = { 'pane.add': 'Ctrl+Shift+KeyM' }
    expect(conflicts(overrides, 'darwin')).toEqual({})
    expect(conflicts(overrides, 'linux')).toEqual({ 'window.minimize': 'pane.add' })
  })

  it('drops an override equal to the default', () => {
    expect(withBinding({}, 'pane.add', 'Alt+KeyP')).toEqual({ 'pane.add': 'Alt+KeyP' })
    expect(withBinding({ 'pane.add': 'Alt+KeyP' }, 'pane.add', 'Ctrl+Shift+KeyA')).toEqual({})
    expect(withBinding({}, 'pane.add', null)).toEqual({ 'pane.add': null })
    expect(withBinding({ 'pane.add': null }, 'pane.add', undefined)).toEqual({})
  })
})
