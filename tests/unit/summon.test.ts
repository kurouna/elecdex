import { readFileSync } from 'node:fs'
import { KEYBINDING_ACTIONS } from '@shared/keybindings'
import { describe, expect, it } from 'vitest'
import { popupPaneId } from '../../src/renderer/layout/popup.js'
import { SUMMONS, summonActions, summonChoice } from '../../src/renderer/layout/summon.js'

/**
 * Calling up a pane by its shortcut (layout/summon.ts): its pane in the layout,
 * the next of several, or it popped up; called again while it is up, the
 * widget is told so.
 */

const panes = [
  { id: 't', widget: 'terminal' },
  { id: 'u1', widget: 'utility' },
  { id: 'c', widget: 'clock' },
  { id: 'u2', widget: 'utility' },
]

describe('summonChoice', () => {
  it('pops the widget up when the layout has none of it', () => {
    expect(summonChoice('launcher', panes, 't', null)).toEqual({
      kind: 'popup',
      paneId: popupPaneId('launcher'),
    })
  })

  it('focuses the first of its panes from anywhere else', () => {
    expect(summonChoice('utility', panes, 't', null)).toEqual({ kind: 'focus', paneId: 'u1' })
    expect(summonChoice('utility', panes, null, null)).toEqual({ kind: 'focus', paneId: 'u1' })
  })

  it('walks on to the next of its panes, and round to the first', () => {
    expect(summonChoice('utility', panes, 'u1', null)).toEqual({ kind: 'focus', paneId: 'u2' })
    expect(summonChoice('utility', panes, 'u2', null)).toEqual({ kind: 'focus', paneId: 'u1' })
    const one = panes.slice(0, 2)
    expect(summonChoice('utility', one, 'u1', null)).toEqual({ kind: 'focus', paneId: 'u1' })
  })

  it('goes to the layout pane over another widget popped up', () => {
    expect(summonChoice('utility', panes, 't', 'launcher')).toEqual({ kind: 'focus', paneId: 'u1' })
  })

  it('says "again" when the widget is popped up already', () => {
    expect(summonChoice('launcher', panes, 't', 'launcher')).toEqual({
      kind: 'again',
      paneId: popupPaneId('launcher'),
    })
  })
})

describe('the shortcuts that call up a pane', () => {
  const builtins = readFileSync(
    new URL('../../src/renderer/widgets/builtins.ts', import.meta.url),
    'utf8',
  )
  const blocks = builtins.split('registerBuiltin({').slice(1)

  it('each call up their own widget', () => {
    const called: string[] = []
    const actions = summonActions((widget) => called.push(widget))
    for (const action of Object.keys(SUMMONS) as (keyof typeof SUMMONS)[]) actions[action]()
    expect(called).toEqual(Object.values(SUMMONS))
  })

  it('are each a keybinding, for a widget that pops up', () => {
    for (const [action, widget] of Object.entries(SUMMONS)) {
      expect(
        KEYBINDING_ACTIONS.some((a) => a.id === action),
        action,
      ).toBe(true)
      const block = blocks.find((b) => b.includes(`  id: '${widget}',`))
      expect(block, widget).toBeDefined()
      expect(block, widget).toMatch(/^ {2}popup: true,$/m)
    }
  })
})
