import { collectPanes, findNode, pane, split, tabs } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CLOSE_SETTLE_MS,
  CRT_EDGE_MS,
  CRT_FLARE_MS,
  CRT_LAND_MS,
  CRT_TAB_MS,
} from '../../src/renderer/lib/crt-timing.ts'
import { framesOf } from './support/frames.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')

/**
 * What the panes play after the layout changes under them - a move, a split, a
 * tab shown, the keyboard arriving - and a close put back from its toast. The
 * geometry is a stand-in (support/frames.ts).
 */

let animates = true

function load(root: LayoutNode, focused: string): void {
  layout.tree = { version: LAYOUT_VERSION, root }
  layout.focusedPaneId = focused
}

const ids = () => collectPanes(layout.tree.root).map((p) => p.id)
const undoToast = () => toasts.items.find((toast) => toast.title.endsWith(' closed'))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async (_tree: LayoutTree) => {}) } })
  animates = true
  layout.closeMotion = { animates: () => animates, frames: () => framesOf(layout.tree) }
})

afterEach(() => {
  layout.settle()
  layout.closeMotion = null
  toasts.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a move', () => {
  it('flies the moved pane in, and the one it swapped with too', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.move(a.id, b.id, 'right')
    expect(ids()).toEqual([b.id, a.id])
    expect(layout.effects.landing.get(a.id)).toEqual({ dx: -600, dy: 0, sx: 1, sy: 1 })
    expect(layout.effects.landing.get(b.id)).toEqual({ dx: 600, dy: 0, sx: 1, sy: 1 })
    vi.advanceTimersByTime(CRT_LAND_MS)
    expect(layout.effects.landing.size).toBe(0)
  })

  it('flickers a pane on in the group it joined, rather than flying the group', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, tabs([b, c])]), a.id)
    layout.move(a.id, b.id, 'tab')
    expect(layout.effects.flashing).toBe(a.id)
    expect(layout.effects.landing.has(a.id)).toBe(false)
    expect(layout.effects.extending.has(a.id)).toBe(false)
    vi.advanceTimersByTime(CRT_TAB_MS)
    expect(layout.effects.flashing).toBeNull()
  })

  it('plays nothing without motion', () => {
    animates = false
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.move(a.id, b.id, 'right')
    expect(layout.effects.landing.size).toBe(0)
  })
})

describe('a split', () => {
  it('lights the edge the new pane came in by, and leaves the new pane to power on', () => {
    const a = pane('clock')
    load(a, a.id)
    layout.split(a.id, 'right', 'calendar')
    const added = ids()[1] as string
    expect(layout.effects.edging.get(a.id)).toEqual({ top: 0, right: 2, bottom: 0, left: 0 })
    expect(layout.effects.edging.has(added)).toBe(false)
    expect(layout.effects.extending.size).toBe(0)
    expect(layout.arrived(added)).toBe(true)
    vi.advanceTimersByTime(CRT_EDGE_MS)
    expect(layout.effects.edging.size).toBe(0)
  })
})

describe('a tab shown', () => {
  it('flickers on when it comes to the front, and not when it already was', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(tabs([a, b]), a.id)
    layout.focus(a.id)
    expect(layout.effects.flashing).toBeNull()
    layout.focus(b.id)
    expect(layout.effects.flashing).toBe(b.id)
  })

  it('does not flicker without motion', () => {
    animates = false
    const a = pane('clock')
    const b = pane('calendar')
    load(tabs([a, b]), a.id)
    layout.focus(b.id)
    expect(layout.effects.flashing).toBeNull()
  })
})

describe('the keyboard arriving', () => {
  it('flares the frame of the pane the keys moved to, and not one clicked', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.focus(b.id)
    expect(layout.effects.flaring).toBeNull()
    layout.cycleFocus(1)
    expect(layout.focusedPaneId).toBe(a.id)
    expect(layout.effects.flaring).toBe(a.id)
    vi.advanceTimersByTime(CRT_FLARE_MS)
    expect(layout.effects.flaring).toBeNull()
  })
})

describe('putting a close back', () => {
  it('offers it in a toast, and puts the tree back with the panes as they are now', () => {
    const a = pane('terminal', { state: { sessionId: 's1' } })
    const b = pane('clock')
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toEqual([b.id])
    const toast = undoToast()
    expect(toast?.title).toBe('terminal closed')
    // Its shell is still claimed while the close can be undone.
    expect(layout.undoablePanes.map((node) => node.id)).toEqual([a.id])
    layout.patchPaneState(b.id, { seen: 1 })

    const undo = toast?.actions[0]
    expect(undo?.label).toBe('undo')
    if (toast !== undefined && undo !== undefined) toasts.run(toast.id, undo)
    expect(ids()).toEqual([a.id, b.id])
    const restored = findNode(layout.tree.root, b.id)
    expect(restored?.kind === 'pane' && restored.state).toEqual({ seen: 1 })
    expect(layout.focusedPaneId).toBe(a.id)
    // It powers on as a new pane does, and the pane that gives it room lights its edge.
    expect(layout.arrived(a.id)).toBe(true)
    expect(layout.effects.edging.get(b.id)).toEqual({ top: 0, right: 0, bottom: 0, left: 2 })
    expect(undoToast()).toBeUndefined()
    expect(layout.undoablePanes).toEqual([])
  })

  it('is let go of by the next change to the arrangement', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(undoToast()).toBeDefined()
    layout.split(b.id, 'down', 'notes')
    expect(undoToast()).toBeUndefined()
    expect(layout.undoablePanes).toEqual([])
  })

  it('stops claiming the shells once its toast has gone', () => {
    const a = pane('terminal')
    const b = pane('clock')
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    expect(layout.undoablePanes).toHaveLength(1)
    vi.advanceTimersByTime(10_000)
    expect(undoToast()).toBeUndefined()
    expect(layout.undoablePanes).toEqual([])
  })

  it('keeps only the last close', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, b, c]), a.id)
    layout.close(a.id)
    layout.close(b.id)
    expect(toasts.items.filter((toast) => toast.title.endsWith(' closed'))).toHaveLength(1)
    expect(layout.undoablePanes.map((node) => node.id)).toEqual([b.id])
  })
})

describe('what a close put back keeps', () => {
  /** The close of `id`, past its power-off, and its toast's undo. */
  function closeAndUndo(id: string, between: () => void = () => {}): void {
    layout.close(id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    between()
    const toast = undoToast()
    const undo = toast?.actions[0]
    if (toast !== undefined && undo !== undefined) toasts.run(toast.id, undo)
  }

  it('is let go of by a divider moved, which putting the old tree back would undo', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, b, c]), a.id)
    closeAndUndo(a.id, () => {
      const row = layout.tree.root
      if (row.kind === 'split') layout.resize(row.id, [0.8, 0.2])
    })
    expect(ids()).toEqual([b.id, c.id])
    expect(layout.undoablePanes).toEqual([])
  })

  it('is let go of by another tab brought to the front', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, tabs([b, c])]), a.id)
    closeAndUndo(a.id, () => layout.focus(c.id))
    expect(ids()).toEqual([b.id, c.id])
  })

  it('puts a whole group back, its tab in front as it was', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    const group = tabs([b, c], 1)
    load(split('row', [a, group]), a.id)
    closeAndUndo(group.id)
    const back = findNode(layout.tree.root, group.id)
    expect(back?.kind === 'tabs' && back.activeIndex).toBe(1)
    expect(ids()).toEqual([a.id, b.id, c.id])
  })

  it('puts back a tab that was behind another, which has nothing to power on', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, tabs([b, c])]), a.id)
    closeAndUndo(c.id)
    expect(ids()).toEqual([a.id, b.id, c.id])
    expect(layout.arrived(c.id)).toBe(false)
  })

  it('cannot be undone once its toast has gone', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(10_000)
    layout.undoClose()
    expect(ids()).toEqual([b.id])
  })
})

describe('the arrows', () => {
  it('do not count a pane powering off as one to go to', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    expect(layout.neighboursOf(a.id).right).toBe(b.id)
    layout.close(b.id)
    expect(layout.closingId).toBe(b.id)
    expect(layout.neighboursOf(a.id).right).toBeNull()
    expect(layout.focusToward('right')).toBe(false)
  })
})
