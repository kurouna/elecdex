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
import { playing } from './support/effects.ts'
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
    expect(playing(layout.effects.reflow, 'land').get(a.id)).toEqual({
      dx: -600,
      dy: 0,
      sx: 1,
      sy: 1,
    })
    expect(playing(layout.effects.reflow, 'land').get(b.id)).toEqual({
      dx: 600,
      dy: 0,
      sx: 1,
      sy: 1,
    })
    vi.advanceTimersByTime(CRT_LAND_MS)
    expect(playing(layout.effects.reflow, 'land').size).toBe(0)
  })

  it('flickers a pane on in the group it joined, rather than flying the group', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, tabs([b, c])]), a.id)
    layout.move(a.id, b.id, 'tab')
    expect(layout.effects.flashing).toBe(a.id)
    expect(playing(layout.effects.reflow, 'land').has(a.id)).toBe(false)
    expect(playing(layout.effects.reflow, 'extend').has(a.id)).toBe(false)
    vi.advanceTimersByTime(CRT_TAB_MS)
    expect(layout.effects.flashing).toBeNull()
  })

  it('focuses the tab a whole group shows once it has joined another, and flickers it on', () => {
    // The group's own id is gone once its tabs have joined: nothing was focused, and the
    // keyboard stayed with a tab now behind the one shown.
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    const d = pane('rss')
    const group = tabs([b, c], 1)
    load(split('row', [a, group, d]), c.id)
    layout.move(group.id, d.id, 'tab')
    expect(findNode(layout.tree.root, group.id)).toBeNull()
    const joined = findNode(layout.tree.root, layout.groupOf(b.id) ?? '')
    expect(joined?.kind === 'tabs' && joined.children[joined.activeIndex]?.id).toBe(b.id)
    expect(layout.focusedPaneId).toBe(b.id)
    expect(layout.effects.flashing).toBe(b.id)
  })

  it('focuses the tab a whole group shows once it has joined another by its strip', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    const d = pane('rss')
    const e = pane('weather')
    const group = tabs([b, c], 1)
    load(split('row', [a, group, tabs([d, e])]), a.id)
    layout.moveTab(group.id, d.id, 1)
    expect(layout.focusedPaneId).toBe(b.id)
    const joined = findNode(layout.tree.root, layout.groupOf(b.id) ?? '')
    expect(joined?.kind === 'tabs' && joined.children[joined.activeIndex]?.id).toBe(b.id)
  })

  it('plays nothing without motion', () => {
    animates = false
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.move(a.id, b.id, 'right')
    expect(playing(layout.effects.reflow, 'land').size).toBe(0)
  })
})

describe('a split', () => {
  it('lights the edge the new pane came in by, and leaves the new pane to power on', () => {
    const a = pane('clock')
    load(a, a.id)
    layout.split(a.id, 'right', 'calendar')
    const added = ids()[1] as string
    expect(playing(layout.effects.reflow, 'edge').get(a.id)).toEqual({
      top: 0,
      right: 2,
      bottom: 0,
      left: 0,
    })
    expect(playing(layout.effects.reflow, 'edge').has(added)).toBe(false)
    expect(playing(layout.effects.reflow, 'extend').size).toBe(0)
    expect(layout.arrived(added)).toBe(true)
    vi.advanceTimersByTime(CRT_EDGE_MS)
    expect(playing(layout.effects.reflow, 'edge').size).toBe(0)
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

  it('stops flickering when a tree is taken without motion, as a layout read from disk is', async () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(tabs([a, b]), a.id)
    layout.focus(b.id)
    expect(layout.effects.flashing).toBe(b.id)
    animates = false
    const other = pane('notes')
    vi.stubGlobal('elecdex', {
      layout: {
        save: vi.fn(async (_tree: LayoutTree) => {}),
        load: vi.fn(async () => ({ version: LAYOUT_VERSION, root: other })),
      },
    })
    await layout.load()
    expect(layout.effects.flashing).toBeNull()
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
    expect(playing(layout.effects.reflow, 'edge').get(b.id)).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 2,
    })
    expect(undoToast()).toBeUndefined()
    expect(layout.undoablePanes).toEqual([])
  })

  it('keeps only the newest close when the same pane is closed again', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(undoToast()).toBeDefined()
    layout.undoClose()
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    // A newer close takes its place, with its own toast.
    expect(toasts.items.filter((toast) => toast.title.endsWith(' closed'))).toHaveLength(1)
  })

  it('answers the same empty list while nothing can be undone, so the reaper is not put off by every toast', () => {
    const empty = layout.undoablePanes
    expect(empty).toEqual([])
    toasts.show({ title: 'something else' })
    expect(layout.undoablePanes).toBe(empty)
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

  it('comes back beside its neighbour, keeping a divider moved since', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, b, c]), a.id)
    closeAndUndo(a.id, () => {
      const row = layout.tree.root
      if (row.kind === 'split') layout.resize(row.id, [0.8, 0.2])
    })
    expect(ids()).toEqual([a.id, b.id, c.id])
    const row = layout.tree.root
    // a takes back its third, b and c making room for it as the divider left them.
    expect(row.kind === 'split' && row.sizes.map((n) => Number(n.toFixed(2)))).toEqual([
      0.33, 0.53, 0.13,
    ])
  })

  it('comes back keeping another tab brought to the front since', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    const group = tabs([b, c])
    load(split('row', [a, group]), a.id)
    closeAndUndo(a.id, () => layout.focus(c.id))
    expect(ids()).toEqual([a.id, b.id, c.id])
    const back = findNode(layout.tree.root, group.id)
    expect(back?.kind === 'tabs' && back.activeIndex).toBe(1)
  })

  it('comes back after a pane added since', () => {
    const a = pane('clock')
    const b = pane('calendar')
    load(split('row', [a, b]), a.id)
    closeAndUndo(a.id, () => layout.split(b.id, 'down', 'notes'))
    expect(ids()).toHaveLength(3)
    expect(ids()[0]).toBe(a.id)
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

  it('leaves the keyboard where it is when the close put back did not have it', () => {
    // The focus at the close was put back as it was, though another tab had been shown since:
    // the keyboard went to a tab behind the one on screen.
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    load(split('row', [a, tabs([b, c])]), b.id)
    closeAndUndo(a.id, () => layout.focus(c.id))
    expect(ids()).toEqual([a.id, b.id, c.id])
    expect(layout.focusedPaneId).toBe(c.id)
  })

  it('gives the keyboard back to the pane put back when it had it, bringing its tab forward', () => {
    const a = pane('clock')
    const b = pane('calendar')
    const c = pane('notes')
    const d = pane('rss')
    const group = tabs([b, c, d], 1)
    load(split('row', [a, group]), c.id)
    closeAndUndo(c.id, () => layout.focus(a.id))
    expect(layout.focusedPaneId).toBe(c.id)
    const back = findNode(layout.tree.root, group.id)
    expect(back?.kind === 'tabs' && back.children[back.activeIndex]?.id).toBe(c.id)
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
