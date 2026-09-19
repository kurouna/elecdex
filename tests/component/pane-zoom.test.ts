import { collectPanes, pane, split, tabs } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Frame } from '../../src/renderer/layout/pane-close.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { CRT_UNZOOM_MS, CRT_ZOOM_MS } = await import('../../src/renderer/layout/pane-zoom.ts')
const { frameOfPane } = await import('../../src/renderer/layout/pane-close.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { paneDrag } = await import('../../src/renderer/layout/pane-drag.svelte.ts')

/**
 * Bringing one pane to the front of the workspace and putting it back: what is
 * pinned, what flies, and everything that must let go of it again.
 *
 * The workspace here is a 1000x800 box and every pane fills its share of it, so
 * the store measures fixed numbers rather than a layout jsdom cannot do.
 */

const AREA: Frame = { top: 0, right: 1000, bottom: 800, left: 0 }
/** Nine tenths of that, centred. */
const PINNED: Frame = { top: 40, right: 950, bottom: 760, left: 50 }

/** Panes as equal columns of a row, a tab group as one box, as the closing test does. */
function framesOf(tree: LayoutTree): Map<string, Frame> {
  const frames = new Map<string, Frame>()
  const place = (node: LayoutNode, box: Frame): void => {
    if (node.kind === 'pane') frames.set(node.id, box)
    else if (node.kind === 'tabs') {
      for (const child of node.children) frames.set(child.id, box)
    } else {
      const row = node.direction === 'row'
      const span = row ? box.right - box.left : box.bottom - box.top
      let at = row ? box.left : box.top
      node.children.forEach((child, i) => {
        const size = span * (node.sizes[i] ?? 0)
        place(
          child,
          row ? { ...box, left: at, right: at + size } : { ...box, top: at, bottom: at + size },
        )
        at += size
      })
    }
  }
  place(tree.root, AREA)
  return frames
}

let animates = true
let area: Frame | null = AREA
const saved = vi.fn(async (_tree: LayoutTree) => {})

function load(root: LayoutNode, focused: string): void {
  layout.tree = { version: LAYOUT_VERSION, root }
  layout.focusedPaneId = focused
}

const ids = () => collectPanes(layout.tree.root).map((p) => p.id)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('elecdex', { layout: { save: saved } })
  animates = true
  area = AREA
  layout.closeMotion = { animates: () => animates, frames: () => framesOf(layout.tree) }
  layout.zoomMotion = {
    animates: () => animates,
    area: () => area,
    // As laid out, never where the pin put it: the real one measures the pane's
    // slot while the pane itself is pinned over the workspace.
    frameOf: (paneId) => framesOf(layout.tree).get(paneId) ?? null,
  }
})

afterEach(() => {
  layout.settle()
  layout.closeMotion = null
  layout.zoomMotion = null
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('zooming a pane', () => {
  const a = pane('clock')
  const b = pane('terminal')

  it('pins it over the workspace, focuses it, and flies it out of its place', () => {
    load(split('row', [a, b]), b.id)
    layout.zoom(a.id)

    expect(layout.zoomedPaneId).toBe(a.id)
    expect(layout.pinnedPaneId).toBe(a.id)
    expect(layout.focusedPaneId).toBe(a.id)
    expect(layout.zoomPin).toEqual(PINNED)
    expect(layout.zoomPhase).toBe('in')
    // From the left half of the window into the middle of it.
    expect(layout.zoomFlip).toMatchObject({ sx: 500 / 900, sy: 800 / 720 })
    expect(layout.zoomStyle).toContain('--zoom-width: 900px')

    vi.advanceTimersByTime(CRT_ZOOM_MS)
    expect(layout.zoomPhase).toBeNull()
    expect(layout.zoomFlip).toBeNull()
    // Still pinned, and still placed: only the flight is over.
    expect(layout.zoomPin).toEqual(PINNED)
    expect(layout.zoomStyle).toContain('--zoom-height: 720px')
  })

  it('flies it back into its place before letting go of it', () => {
    load(split('row', [a, b]), a.id)
    layout.zoom(a.id)
    vi.advanceTimersByTime(CRT_ZOOM_MS)

    layout.toggleZoom(a.id)
    expect(layout.zoomedPaneId).toBeNull()
    // Held over the workspace for as long as the flight lasts.
    expect(layout.pinnedPaneId).toBe(a.id)
    expect(layout.zoomPhase).toBe('out')
    expect(layout.zoomFlip).toMatchObject({ sx: 500 / 900 })

    vi.advanceTimersByTime(CRT_UNZOOM_MS)
    expect(layout.pinnedPaneId).toBeNull()
    expect(layout.zoomPin).toBeNull()
    expect(layout.zoomStyle).toBeNull()
  })

  it('goes there and back at once with motion reduced', () => {
    animates = false
    load(split('row', [a, b]), a.id)
    layout.zoom(a.id)
    expect(layout.zoomPhase).toBeNull()
    expect(layout.zoomFlip).toBeNull()
    expect(layout.zoomPin).toEqual(PINNED)

    layout.unzoom()
    expect(layout.pinnedPaneId).toBeNull()
    expect(layout.zoomPin).toBeNull()
  })

  it('pins nothing when the workspace cannot be measured', () => {
    area = null
    load(split('row', [a, b]), a.id)
    layout.zoom(a.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.zoomPin).toBeNull()
  })

  it('does nothing for a pane that is not in the layout', () => {
    load(split('row', [a, b]), a.id)
    layout.zoom('nowhere')
    expect(layout.zoomedPaneId).toBeNull()
  })
})

/**
 * The pane's own box is where the zoom put it, so a pinned pane must be measured
 * by the slot it came out of - and that is decided by what is painted, not by
 * what the store has set, which a flight or a second toggle can disagree with.
 */
describe('frameOfPane', () => {
  function build(pinned: boolean): HTMLElement {
    const slot = document.createElement('div')
    const pane = document.createElement('section')
    pane.dataset.testid = 'pane'
    pane.dataset.paneId = 'p'
    pane.setAttribute('data-testid', 'pane')
    slot.append(pane)
    document.body.append(slot)
    slot.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 100, height: 80 })
    pane.getBoundingClientRect = () =>
      DOMRect.fromRect(
        pinned ? { x: 50, y: 40, width: 900, height: 720 } : { x: 0, y: 0, width: 100, height: 80 },
      )
    if (pinned) pane.style.position = 'fixed'
    return slot
  }

  afterEach(() => {
    document.body.replaceChildren()
  })

  it('measures the pane where it is laid out', () => {
    build(false)
    expect(frameOfPane('p')).toEqual({ top: 0, right: 100, bottom: 80, left: 0 })
  })

  it('and a pinned one by the slot it came out of', () => {
    build(true)
    expect(frameOfPane('p')).toEqual({ top: 0, right: 100, bottom: 80, left: 0 })
  })

  it('knows nothing of a pane that is not in the page', () => {
    expect(frameOfPane('gone')).toBeNull()
  })
})

describe('what lets go of a zoomed pane', () => {
  const a = pane('clock')
  const b = pane('terminal')
  const c = pane('rss')

  const zoom = (root: LayoutNode, id: string): void => {
    load(root, id)
    layout.zoom(id)
    vi.advanceTimersByTime(CRT_ZOOM_MS)
  }

  it('focusing another pane', () => {
    zoom(split('row', [a, b]), a.id)
    layout.focus(b.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.zoomPhase).toBe('out')
    vi.advanceTimersByTime(CRT_UNZOOM_MS)
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('but another tab of the same group takes the zoom with it', () => {
    zoom(split('row', [a, tabs([b, c], 0)]), b.id)
    layout.focus(c.id)
    expect(layout.zoomedPaneId).toBe(c.id)
    expect(layout.pinnedPaneId).toBe(c.id)
    expect(layout.zoomPin).toEqual(PINNED)
    // The group has not moved, so nothing flies: only the tab shown in it changed.
    expect(layout.zoomPhase).toBeNull()
  })

  it('splitting or moving', () => {
    zoom(split('row', [a, b]), a.id)
    layout.split(a.id, 'right', 'clock')
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.pinnedPaneId).toBeNull()

    zoom(split('row', [a, b]), a.id)
    layout.move(a.id, b.id, 'right')
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('closing another pane', () => {
    zoom(split('row', [a, b]), a.id)
    layout.close(b.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('closing the zoomed pane itself, which powers off where it stands', () => {
    zoom(split('row', [a, b]), a.id)
    layout.close(a.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.closingId).toBe(a.id)
    // Still over the workspace: a pane that snapped back first would jump.
    expect(layout.pinnedPaneId).toBe(a.id)
    expect(layout.zoomPin).toEqual(PINNED)
    expect(layout.zoomPhase).toBeNull()

    vi.advanceTimersByTime(2000)
    expect(ids()).toEqual([b.id])
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('a drag of it, which needs the workspace back to find a drop target', () => {
    zoom(split('row', [a, b]), a.id)
    paneDrag.begin(a.id, 'clock')
    expect(layout.zoomedPaneId).toBeNull()
    paneDrag.end(false)
    vi.advanceTimersByTime(CRT_UNZOOM_MS)
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('resetting the layout, including a zoom asked for while the new tree was on its way', async () => {
    // reset() settles - which lets go of the zoom - and only then asks main for
    // the default tree. A pane zoomed while that was in flight would be left
    // zoomed over a tree it is not in, and every pane behind it is inert: the
    // workspace would take no click and no key at all.
    let deliver: (tree: LayoutTree) => void = () => {}
    const fresh: LayoutTree = {
      version: LAYOUT_VERSION,
      root: split('row', [pane('clock'), pane('terminal')]),
    }
    vi.stubGlobal('elecdex', {
      layout: {
        save: saved,
        reset: () =>
          new Promise<LayoutTree>((resolve) => {
            deliver = resolve
          }),
      },
    })

    zoom(split('row', [a, b]), a.id)
    const done = layout.reset()
    layout.zoom(b.id)
    expect(layout.zoomedPaneId).toBe(b.id)

    deliver(fresh)
    await done

    expect(ids()).toEqual(collectPanes(fresh.root).map((p) => p.id))
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.pinnedPaneId).toBeNull()
    expect(layout.zoomPin).toBeNull()
  })

  it('a window resize re-places it where it is', () => {
    zoom(split('row', [a, b]), a.id)
    area = { top: 0, right: 500, bottom: 400, left: 0 }
    layout.repin()
    expect(layout.zoomPin).toEqual({ top: 20, right: 475, bottom: 380, left: 25 })
    // Re-placing is not a flight: nothing replays.
    expect(layout.zoomPhase).toBeNull()
  })
})
