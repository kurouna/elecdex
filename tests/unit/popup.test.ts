import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { pickerChoice, pickerRowState, popupPaneId } from '../../src/renderer/layout/popup.js'

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
 * A popped-up widget has no node in the tree: `patchPaneState` would change
 * nothing, a shell would be reaped as unclaimed and a web view closed. So only a
 * widget that needs none of it may say `popup: true`. The registry imports
 * Svelte components, which a unit test cannot load, so the files are read as text.
 */
describe('the widgets that pop up', () => {
  const read = (file: string): string => readFileSync(new URL(file, import.meta.url), 'utf8')
  const builtins = read('../../src/renderer/widgets/builtins.ts')
  const imports = new Map(
    [...builtins.matchAll(/^import (\w+) from '\.\/([^']+\.svelte)'$/gm)].map((m) => [m[1], m[2]]),
  )
  const popups = builtins
    .split('registerBuiltin({')
    .filter((block) => /^ {2}popup: true,$/m.test(block))
    .map((block) => ({
      id: /^ {2}id: '([^']+)',$/m.exec(block)?.[1],
      component: /^ {2}component: (\w+),$/m.exec(block)?.[1] ?? '',
    }))

  it('include the launcher, and no shell, page or plugin', () => {
    const ids = popups.map((p) => p.id)
    expect(ids).toContain('launcher')
    expect(ids).not.toContain('terminal')
    expect(ids.filter((id) => id?.startsWith('web') || id?.startsWith('plugin:'))).toEqual([])
  })

  it('keep nothing in pane state and reach for no other pane', () => {
    for (const { id, component } of popups) {
      const file = imports.get(component)
      expect(file, `${id}: component file`).toBeDefined()
      const source = read(`../../src/renderer/widgets/${file}`)
      expect(source, id).not.toMatch(/patchPaneState|setPaneState/)
      // Neither the pane's state nor the layout it is not in.
      expect(source, id).not.toMatch(/\bstate\b[^:]*}: WidgetProps/)
      expect(source, id).not.toMatch(/stores\/layout\.svelte/)
    }
  })
})
