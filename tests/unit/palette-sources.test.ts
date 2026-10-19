import {
  effectiveBindings,
  isGlobal,
  KEYBINDING_ACTIONS,
  type KeybindingAction,
} from '@shared/keybindings'
import { LAYOUT_PRESETS } from '@shared/layout-presets'
import type { SavedLayoutSummary } from '@shared/layouts'
import { ACTION_DETAIL, armsFirst, type PaletteItem, UNAVAILABLE_REASON } from '@shared/palette'
import { type ShortcutFacts, shortcutApplies } from '@shared/shortcut-applies'
import { BUILTIN_THEMES } from '@shared/theme'
import { describe, expect, it } from 'vitest'
import { pickerChoice } from '../../src/renderer/layout/popup.js'
import {
  type ActionSource,
  actionItems,
  layoutItems,
  paneChoice,
  paneItems,
  presetItems,
  settingsItems,
  themeItems,
  type WidgetLike,
} from '../../src/renderer/palette/sources.js'

/** Where the palette's rows come from (docs/palette.md section 5.1). */

const WIN = effectiveBindings({}, 'win32')

const actions = (extra: Partial<ActionSource> = {}): PaletteItem[] =>
  actionItems({
    platform: 'win32',
    bindings: WIN,
    labels: {},
    applies: () => true,
    arm: { anyShell: true, confirmSwitch: true },
    ...extra,
  })

const ids = (items: readonly PaletteItem[]) => items.map((i) => i.key)

/** Nothing any conditional shortcut looks for is there. */
const NOTHING: ShortcutFacts = {
  focusedIsShell: false,
  zoomable: false,
  savedCount: 0,
  anyShell: false,
  shellToFind: false,
  inTabGroup: false,
  otherShell: false,
  editingText: false,
}

const SAVED_SLOT = /^layout\.saved\d+$/
const PRESET_ACTION = /^layout\.preset\./

describe('actionItems', () => {
  it('offers every action of the page but the palette itself, the slots and the presets', () => {
    const offered = ids(actions())
    const expected = KEYBINDING_ACTIONS.map((a) => a.id)
      .filter((id) => !isGlobal(id) && id !== 'palette.open')
      .filter((id) => !SAVED_SLOT.test(id) && !PRESET_ACTION.test(id))
      .map((id) => `action:${id}`)
    expect(offered).toEqual(expected)
    expect(offered).toContain('action:pane.splitRight')
    expect(offered).not.toContain('action:window.toggle')
  })

  it('leaves out what this platform does not have', () => {
    const mac = actions({ platform: 'darwin', bindings: effectiveBindings({}, 'darwin') })
    expect(ids(mac)).not.toContain('action:window.minimize')
    expect(ids(actions())).toContain('action:window.minimize')
  })

  it('names each action by its label and its chord as bound now, as the keyboard prints it', () => {
    const split = actions().find((i) => i.key === 'action:pane.splitRight')
    expect(split).toMatchObject({ kind: 'action', label: 'Split right', chord: 'Ctrl+Shift+E' })
    const rebound = effectiveBindings({ 'pane.splitRight': 'Ctrl+Alt+KeyR' }, 'win32')
    expect(
      actions({ bindings: rebound }).find((i) => i.key === 'action:pane.splitRight')?.chord,
    ).toBe('Ctrl+Alt+R')
    const unbound = effectiveBindings({ 'pane.splitRight': null }, 'win32')
    expect(
      actions({ bindings: unbound }).find((i) => i.key === 'action:pane.splitRight')?.chord,
    ).toBeNull()
    // A Japanese keyboard prints ^ on the Equal key.
    const font = actions({ labels: { Equal: '^' } }).find(
      (i) => i.key === 'action:shell.fontBigger',
    )
    expect(font?.chord).toBe('Ctrl+Shift+^')
  })

  it('marks an action that does nothing now with its reason, and runs the rest', () => {
    const items = actions({ applies: (a) => a !== 'tab.next' })
    expect(items.find((i) => i.key === 'action:tab.next')?.state).toEqual({
      kind: 'off',
      reason: 'not in a tab group',
    })
    expect(items.find((i) => i.key === 'action:tab.previous')?.state).toEqual({ kind: 'ready' })
  })

  it('says why the bringing forward is also the putting back', () => {
    expect(actions().find((i) => i.key === 'action:pane.zoom')?.detail).toBe(
      ACTION_DETAIL['pane.zoom'],
    )
    expect(ACTION_DETAIL['pane.zoom']).toMatch(/put it back/)
  })

  it('arms what cannot be undone', () => {
    const armed = (arm: ActionSource['arm']) =>
      actions({ arm })
        .filter((i) => i.arm)
        .map((i) => i.key)
    expect(armed({ anyShell: true, confirmSwitch: true })).toEqual([
      'action:shell.clear',
      'action:app.quit',
    ])
    expect(armed({ anyShell: true, confirmSwitch: false })).toContain('action:layout.reset')
  })
})

describe('UNAVAILABLE_REASON', () => {
  it('says why for every action of the page that can do nothing', () => {
    const conditional = KEYBINDING_ACTIONS.map((a) => a.id).filter(
      (id) =>
        !isGlobal(id) && !SAVED_SLOT.test(id) && !shortcutApplies(id as KeybindingAction, NOTHING),
    )
    expect(conditional.length).toBeGreaterThan(0)
    for (const id of conditional) {
      expect(UNAVAILABLE_REASON[id as KeybindingAction], id).toMatch(/\S/)
    }
  })
})

describe('armsFirst', () => {
  const facts = (anyShell: boolean, confirmSwitch: boolean) => ({ anyShell, confirmSwitch })

  it('always arms quitting and clearing a scrollback', () => {
    for (const anyShell of [false, true]) {
      for (const confirmSwitch of [false, true]) {
        expect(armsFirst('app.quit', facts(anyShell, confirmSwitch))).toBe(true)
        expect(armsFirst('shell.clear', facts(anyShell, confirmSwitch))).toBe(true)
      }
    }
  })

  it('arms the reset only when its own question would not be asked', () => {
    expect(armsFirst('layout.reset', facts(false, true))).toBe(true)
    expect(armsFirst('layout.reset', facts(true, true))).toBe(false)
    expect(armsFirst('layout.reset', facts(true, false))).toBe(true)
  })

  it('arms nothing else', () => {
    const rest = KEYBINDING_ACTIONS.map((a) => a.id).filter(
      (id) => !['app.quit', 'shell.clear', 'layout.reset'].includes(id),
    )
    for (const id of rest) expect(armsFirst(id, facts(false, false)), id).toBe(false)
  })
})

const summary = (id: string, name: string, extra: Partial<SavedLayoutSummary> = {}) =>
  ({ id, name, active: false, preset: null, shape: [], ...extra }) satisfies SavedLayoutSummary

describe('layoutItems', () => {
  it('names each saved layout with its number key, the first ten only, the one in use current', () => {
    const saved = Array.from({ length: 11 }, (_, i) =>
      summary(`l${i}`, `Layout ${i}`, { active: i === 1 }),
    )
    const items = layoutItems(saved, WIN, {})
    expect(ids(items)).toEqual(saved.map((s) => `layout:${s.id}`))
    expect(items[0]).toMatchObject({ kind: 'layout', label: 'Layout 0', chord: 'Ctrl+Shift+1' })
    expect(items[9]?.chord).toBe('Ctrl+Shift+0')
    expect(items[10]?.chord).toBeNull()
    expect(items[1]?.state).toEqual({ kind: 'current' })
    expect(items[0]?.state).toEqual({ kind: 'ready' })
  })
})

describe('presetItems', () => {
  it('offers every preset with its key, going to the layout made from it or adding one', () => {
    const saved = [summary('d', 'dev', { preset: 'dev' })]
    const items = presetItems(LAYOUT_PRESETS, saved, WIN, {})
    expect(ids(items)).toEqual(LAYOUT_PRESETS.map((p) => `preset:${p.id}`))
    expect(items.find((i) => i.key === 'preset:standard')?.chord).toBe('Ctrl+Shift+F1')
    expect(items.find((i) => i.key === 'preset:dev')?.detail).toMatch(/goes to “dev”/)
    expect(items.find((i) => i.key === 'preset:media')?.detail).toMatch(/adds a layout/)
  })

  it('marks the preset whose layout is in use current: going to it would do nothing', () => {
    const saved = [summary('d', 'dev', { preset: 'dev', active: true })]
    const items = presetItems(LAYOUT_PRESETS, saved, WIN, {})
    expect(items.find((i) => i.key === 'preset:dev')?.state).toEqual({ kind: 'current' })
    expect(items.find((i) => i.key === 'preset:media')?.state).toEqual({ kind: 'ready' })
  })
})

describe('themeItems', () => {
  it('offers every theme, the user’s too, the one in use current', () => {
    const mine = { id: 'mine', name: 'Mine', author: 'me' }
    const items = themeItems([...BUILTIN_THEMES, mine], 'amber')
    expect(ids(items)).toEqual([...BUILTIN_THEMES.map((t) => `theme:${t.id}`), 'theme:mine'])
    expect(items.find((i) => i.key === 'theme:amber')?.state).toEqual({ kind: 'current' })
    expect(items.find((i) => i.key === 'theme:mine')?.state).toEqual({ kind: 'ready' })
    expect(items.find((i) => i.key === 'theme:black')?.words).toContain('light')
  })
})

const widget = (id: string, extra: Partial<WidgetLike> = {}): WidgetLike => ({
  id,
  title: id.toUpperCase(),
  ...extra,
})

describe('paneChoice and paneItems', () => {
  it('pops up what can be, adds the rest right of the focused pane, focuses one on screen', () => {
    const clock = widget('clock', { popup: true })
    const shell = widget('terminal', { multiple: true })
    expect(paneChoice(clock, null)).toEqual(pickerChoice(clock, 'popup', null))
    expect(paneChoice(clock, null)).toEqual({ kind: 'popup' })
    expect(paneChoice(shell, null)).toEqual({ kind: 'add', placement: 'right' })
    expect(paneChoice(clock, 'p1')).toEqual({ kind: 'focus', paneId: 'p1' })
  })

  it('offers what the picker offers, saying what Enter does', () => {
    const widgets = [
      widget('clock', { popup: true, pickerTitle: 'clock & date', description: 'the time' }),
      widget('old', { unlisted: true }),
      widget('plugin:off', { plugin: true }),
      widget('plugin:on', { plugin: true }),
      widget('terminal', { multiple: true }),
    ]
    const items = paneItems(
      widgets,
      (w) => (w.id === 'terminal' ? 'p9' : null),
      (w) => w.id !== 'plugin:off',
    )
    expect(ids(items)).toEqual(['pane:clock', 'pane:plugin:on', 'pane:terminal'])
    expect(items[0]).toMatchObject({ label: 'clock & date', detail: 'the time', note: 'pop up' })
    expect(items[1]?.note).toBe('add')
    // A shell may be added again even with one on screen: it is not single.
    expect(items[2]?.note).toBe('add another')
  })
})

describe('settingsItems', () => {
  it('opens the settings at each section', () => {
    const items = settingsItems([
      { id: 'general', label: 'general' },
      { id: 'keyboard', label: 'keyboard' },
    ])
    expect(ids(items)).toEqual(['settings:general', 'settings:keyboard'])
    expect(items[1]).toMatchObject({ kind: 'settings', label: 'Settings: keyboard' })
  })
})

describe('every source', () => {
  it('gives each row a key of its own', () => {
    const all = [
      ...actions(),
      ...layoutItems([summary('a', 'A')], WIN, {}),
      ...presetItems(LAYOUT_PRESETS, [], WIN, {}),
      ...themeItems(BUILTIN_THEMES, 'tron'),
      ...paneItems(
        [widget('clock')],
        () => null,
        () => true,
      ),
      ...settingsItems([{ id: 'general', label: 'general' }]),
    ]
    expect(new Set(ids(all)).size).toBe(all.length)
  })
})
