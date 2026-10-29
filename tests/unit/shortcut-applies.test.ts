import { KEYBINDING_ACTIONS, type KeybindingAction } from '@shared/keybindings'
import {
  LeftToPageSchema,
  type ShortcutFacts,
  shortcutApplies,
  shortcutsLeftToPage,
} from '@shared/shortcut-applies'
import { describe, expect, it } from 'vitest'

/**
 * Whether a shortcut applies now (issue 20): the one answer the workspace runs by and main
 * leaves a focused web page's keys by.
 */

/** Everything the conditional shortcuts look for is there. */
const ALL: ShortcutFacts = {
  focusedIsShell: true,
  zoomable: true,
  savedCount: 10,
  anyShell: true,
  shellToFind: true,
  inTabGroup: true,
  otherShell: true,
  toward: { left: true, right: true, up: true, down: true },
  editingText: false,
}

/** A web pane on its own, with no shell anywhere and nothing saved. */
const LONE_WEB_PANE: ShortcutFacts = {
  focusedIsShell: false,
  zoomable: true,
  savedCount: 0,
  anyShell: false,
  shellToFind: false,
  inTabGroup: false,
  otherShell: false,
  toward: { left: false, right: false, up: false, down: false },
  editingText: false,
}

const ids = KEYBINDING_ACTIONS.map((a) => a.id)

describe('shortcutApplies', () => {
  it('lets every page shortcut through when everything it needs is there', () => {
    const refused = ids.filter((id) => !shortcutApplies(id, ALL))
    // The system-wide one never reaches the page.
    expect(refused).toEqual(['window.toggle'])
  })

  it('moves the tabs from a text field too, and outside a tab group leaves the keys to the pane', () => {
    for (const id of ['tab.next', 'tab.previous'] as const) {
      expect(shortcutApplies(id, ALL)).toBe(true)
      // Ctrl+Tab, which a field has no use for.
      expect(shortcutApplies(id, { ...ALL, editingText: true })).toBe(true)
      expect(shortcutApplies(id, { ...ALL, inTabGroup: false })).toBe(false)
    }
    // Typing in a field leaves the arrows to it, to select by word, and every other shortcut as it was.
    const editing = { ...ALL, editingText: true }
    expect(ids.filter((id) => shortcutApplies(id, ALL) !== shortcutApplies(id, editing))).toEqual([
      'focus.left',
      'focus.right',
      'focus.up',
      'focus.down',
    ])
  })

  it('takes an arrow only when a pane lies that way, else leaves it to the pane', () => {
    const facts = { ...ALL, toward: { left: false, right: true, up: false, down: false } }
    expect(shortcutApplies('focus.right', facts)).toBe(true)
    expect(shortcutApplies('focus.left', facts)).toBe(false)
    expect(shortcutApplies('focus.up', facts)).toBe(false)
    expect(shortcutApplies('focus.down', facts)).toBe(false)
    // A text field keeps them, to select by word.
    expect(shortcutApplies('focus.right', { ...facts, editingText: true })).toBe(false)
  })

  it('takes a saved layout key only for a slot that holds one', () => {
    const facts = { ...ALL, savedCount: 2 }
    expect(shortcutApplies('layout.saved1', facts)).toBe(true)
    expect(shortcutApplies('layout.saved2', facts)).toBe(true)
    expect(shortcutApplies('layout.saved3', facts)).toBe(false)
    expect(shortcutApplies('layout.saved10', facts)).toBe(false)
    expect(shortcutApplies('layout.saved10', { ...ALL, savedCount: 10 })).toBe(true)
    // The dialog's key is not a slot.
    expect(shortcutApplies('layout.saved', { ...ALL, savedCount: 0 })).toBe(true)
  })

  it('takes the shell keys only where there is a shell for them', () => {
    const noShell = { ...ALL, focusedIsShell: false, anyShell: false, shellToFind: false }
    expect(shortcutApplies('shell.fontBigger', noShell)).toBe(false)
    expect(shortcutApplies('shell.fontSmaller', noShell)).toBe(false)
    expect(shortcutApplies('shell.find', noShell)).toBe(false)
    // Searching goes to the shell the keys would go to; clearing only to the focused one.
    const elsewhere = { ...ALL, focusedIsShell: false }
    expect(shortcutApplies('shell.find', elsewhere)).toBe(true)
    expect(shortcutApplies('shell.clear', elsewhere)).toBe(false)
    expect(shortcutApplies('shell.next', { ...ALL, otherShell: false })).toBe(false)
    expect(shortcutApplies('shell.previous', { ...ALL, otherShell: false })).toBe(false)
    // Calling a shell up adds one when there is none.
    expect(shortcutApplies('shell.focus', noShell)).toBe(true)
  })

  it('brings forward only a widget that is brought forward', () => {
    expect(shortcutApplies('pane.zoom', { ...ALL, zoomable: false })).toBe(false)
  })
})

describe('shortcutsLeftToPage', () => {
  it("leaves a lone web pane the keys that would do nothing, and never the app's own", () => {
    expect(shortcutsLeftToPage(LONE_WEB_PANE)).toEqual([
      'focus.left',
      'focus.right',
      'focus.up',
      'focus.down',
      'layout.saved1',
      'layout.saved2',
      'layout.saved3',
      'layout.saved4',
      'layout.saved5',
      'layout.saved6',
      'layout.saved7',
      'layout.saved8',
      'layout.saved9',
      'layout.saved10',
      'shell.find',
      'shell.clear',
      'shell.fontBigger',
      'shell.fontSmaller',
      'tab.next',
      'tab.previous',
      'shell.next',
      'shell.previous',
    ])
  })

  it('keeps the protected keys whatever the workspace is like', () => {
    const nothing: ShortcutFacts = { ...LONE_WEB_PANE, zoomable: false }
    const left = new Set<KeybindingAction>(shortcutsLeftToPage(nothing))
    for (const id of [
      'pane.close',
      'pane.add',
      'focus.next',
      'settings.open',
      'app.quit',
    ] as const) {
      expect(left.has(id), id).toBe(false)
    }
    expect(left.has('pane.zoom')).toBe(true)
    // The system-wide shortcut is main's own and never listed.
    expect(left.has('window.toggle')).toBe(false)
  })

  it('always opens the action palette, so a web page never keeps its key', () => {
    const nothing: ShortcutFacts = { ...LONE_WEB_PANE, zoomable: false }
    for (const facts of [ALL, LONE_WEB_PANE, nothing]) {
      expect(shortcutApplies('palette.open', facts)).toBe(true)
      expect(shortcutsLeftToPage(facts)).not.toContain('palette.open')
    }
    expect([...LeftToPageSchema.parse(['palette.open'])]).toEqual(['palette.open'])
  })

  it('leaves nothing when everything applies', () => {
    expect(shortcutsLeftToPage(ALL)).toEqual([])
  })
})

describe('LeftToPageSchema', () => {
  it('takes known action ids, once each', () => {
    const parsed = LeftToPageSchema.parse(['tab.next', 'tab.next', 'shell.clear'])
    expect([...parsed]).toEqual(['tab.next', 'shell.clear'])
    expect(LeftToPageSchema.parse([]).size).toBe(0)
  })

  it('refuses anything else whole', () => {
    expect(LeftToPageSchema.safeParse(['tab.next', 'no.such']).success).toBe(false)
    expect(LeftToPageSchema.safeParse('tab.next').success).toBe(false)
    expect(LeftToPageSchema.safeParse([1]).success).toBe(false)
    expect(LeftToPageSchema.safeParse(null).success).toBe(false)
    const tooMany = Array.from({ length: ids.length + 1 }, () => 'tab.next')
    expect(LeftToPageSchema.safeParse(tooMany).success).toBe(false)
  })
})
