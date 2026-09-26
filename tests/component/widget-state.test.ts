import { afterEach, describe, expect, it, vi } from 'vitest'
import { layout } from '../../src/renderer/stores/layout.svelte.ts'
import { widgetState } from '../../src/renderer/stores/widget-state.svelte.ts'

/**
 * A widget writes its own choices through `widgetState`, wherever it is shown: a
 * pane of the layout into its node, a widget popped up into memory kept for the
 * session, one set per widget.
 */

afterEach(() => vi.restoreAllMocks())

describe('widgetState.patch', () => {
  it('hands a layout pane change to the layout, as it was', () => {
    const patch = vi.spyOn(layout, 'patchPaneState').mockImplementation(() => {})
    widgetState.patch('p1', { view: 'bars' })
    expect(patch).toHaveBeenCalledWith('p1', { view: 'bars' })
    expect(widgetState.popup('p1')).toBeUndefined()
  })

  it('keeps a popped-up widget choices itself, merged, and never in the layout', () => {
    const patch = vi.spyOn(layout, 'patchPaneState')
    widgetState.patch('popup:calc', { tape: ['1+1'], hex: true })
    widgetState.patch('popup:calc', { hex: undefined, grouped: true })
    expect(widgetState.popup('popup:calc')).toEqual({ tape: ['1+1'], grouped: true })
    expect(patch).not.toHaveBeenCalled()
  })

  it('keeps one set per widget, and the same object when nothing changes', () => {
    widgetState.patch('popup:cpu', { view: 'bars' })
    widgetState.patch('popup:notes', { wrap: true })
    const before = widgetState.popup('popup:cpu')
    widgetState.patch('popup:cpu', { view: 'bars', missing: undefined })
    expect(widgetState.popup('popup:cpu')).toBe(before)
    expect(widgetState.popup('popup:notes')).toEqual({ wrap: true })
  })
})
