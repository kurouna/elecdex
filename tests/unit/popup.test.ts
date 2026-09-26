import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  isPopupPaneId,
  pickerChoice,
  pickerRowState,
  popupPaneId,
} from '../../src/renderer/layout/popup.js'

/**
 * A pane popped up over the workspace, outside the layout (layout/popup.ts):
 * what the add-pane picker does with each placement, and which widgets may be
 * popped up at all.
 */

describe('pickerChoice', () => {
  it('adds a widget to the layout for the layout placements', () => {
    for (const placement of ['right', 'down', 'tab'] as const) {
      expect(pickerChoice({ popup: true }, placement, null)).toEqual({ kind: 'add', placement })
      expect(pickerChoice({}, placement, null)).toEqual({ kind: 'add', placement })
    }
  })

  it('pops up only a widget that says it can be', () => {
    expect(pickerChoice({ popup: true }, 'popup', null)).toEqual({ kind: 'popup' })
    expect(pickerChoice({}, 'popup', null)).toEqual({ kind: 'none' })
    expect(pickerChoice({ popup: false }, 'popup', null)).toEqual({ kind: 'none' })
  })

  it('focuses a single-instance widget already in the layout, whatever the placement', () => {
    for (const placement of ['right', 'down', 'tab', 'popup'] as const) {
      expect(pickerChoice({ popup: true }, placement, 'p1')).toEqual({
        kind: 'focus',
        paneId: 'p1',
      })
    }
  })
})

describe('pickerRowState', () => {
  it('says what Enter would do', () => {
    expect(pickerRowState({ kind: 'focus', paneId: 'p' }, false)).toBe('on screen · focus')
    expect(pickerRowState({ kind: 'popup' }, false)).toBe('pop up')
    expect(pickerRowState({ kind: 'none' }, true)).toBe('pane only')
    expect(pickerRowState({ kind: 'add', placement: 'right' }, undefined)).toBe('add')
    expect(pickerRowState({ kind: 'add', placement: 'tab' }, true)).toBe('add another')
  })
})

describe('popupPaneId', () => {
  it('is outside the layout ids and one per widget', () => {
    expect(popupPaneId('launcher')).toBe('popup:launcher')
    expect(popupPaneId('mixer')).not.toBe(popupPaneId('launcher'))
  })
})

/**
 * A popped-up widget has no node in the tree. It keeps its choices through
 * `widgetState`, but nothing of the layout may reach it: a shell would be reaped
 * as unclaimed, a web view closed, a pane of the layout followed or focused from
 * behind the popup. And it goes when put away, so nothing may depend on it
 * staying: a countdown is announced by the timer on screen. The registry imports
 * Svelte components, which a unit test cannot load, so the files are read as text,
 * each widget with the files of its own it imports.
 */
describe('the widgets that pop up', () => {
  const WIDGETS = new URL('../../src/renderer/widgets/', import.meta.url)
  const read = (url: URL): string => readFileSync(url, 'utf8')
  const builtins = read(new URL('builtins.ts', WIDGETS))
  const imports = new Map(
    [...builtins.matchAll(/^import (\w+) from '\.\/([^']+\.svelte)'$/gm)].map((m) => [m[1], m[2]]),
  )
  const blocks = builtins.split('registerBuiltin({').slice(1)
  const idOf = (block: string) => /^ {2}id: '([^']+)',$/m.exec(block)?.[1] ?? ''
  const popups = blocks
    .filter((block) => /^ {2}popup: true,$/m.test(block))
    .map((block) => ({
      id: idOf(block),
      component: /^ {2}component: (\w+),$/m.exec(block)?.[1] ?? '',
    }))

  /** A widget's source and every file under widgets/ it imports, however deep. */
  function sources(entry: URL): Map<string, string> {
    const found = new Map<string, string>()
    const visit = (url: URL): void => {
      if (found.has(url.href) || !url.href.startsWith(WIDGETS.href)) return
      const text = read(url)
      found.set(url.href, text)
      for (const [, path] of text.matchAll(/from '(\.{1,2}\/[^']+\.(?:svelte|ts))'/g)) {
        visit(new URL(path ?? '', url))
      }
    }
    visit(entry)
    return found
  }

  it('are every built-in but the shell, the timer and the file browser', () => {
    const never = ['terminal', 'timer', 'filesystem']
    // The web presets are registered in a loop, with no written id: never popped up
    // (one marked so would appear here with an empty id, and fail the test).
    const all = blocks.map(idOf).filter((id) => id !== '')
    expect(popups.map((p) => p.id).sort()).toEqual(all.filter((id) => !never.includes(id)).sort())
  })

  it('reach nothing of the layout, and write their choices through widgetState', () => {
    for (const { id, component } of popups) {
      const file = imports.get(component)
      expect(file, `${id}: component file`).toBeDefined()
      for (const [href, text] of sources(new URL(file ?? '', WIDGETS))) {
        const where = `${id}: ${href.slice(WIDGETS.href.length)}`
        expect(text, where).not.toMatch(/stores\/layout\.svelte/)
        expect(text, where).not.toMatch(/patchPaneState|setPaneState/)
      }
    }
  })
})

describe('isPopupPaneId', () => {
  it('tells a popped-up widget from a layout pane', () => {
    expect(isPopupPaneId(popupPaneId('calc'))).toBe(true)
    expect(isPopupPaneId('p1-abc')).toBe(false)
  })
})
