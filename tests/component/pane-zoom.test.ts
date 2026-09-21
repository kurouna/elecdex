import { collectPanes, pane, split, tabs } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Frame } from '../../src/renderer/layout/pane-close.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { CRT_UNZOOM_MS, CRT_ZOOM_MS, PANEL_BOX } = await import(
  '../../src/renderer/layout/pane-zoom.ts'
)
const { frameOfPane } = await import('../../src/renderer/layout/pane-close.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { paneDrag } = await import('../../src/renderer/layout/pane-drag.svelte.ts')
const { registerBuiltin, zoomModeOf } = await import('../../src/renderer/widgets/registry.ts')

/**
 * Which widgets may be brought forward is the registry's to say, so the widgets
 * these tests use are registered here with the three answers: the whole
 * workspace, a panel, and not at all.
 */
const nothing = (() => {}) as unknown as Parameters<typeof registerBuiltin>[0]['component']
registerBuiltin({ id: 'clock', title: 'clock', component: nothing, zoom: 'full' })
registerBuiltin({ id: 'terminal', title: 'terminal', component: nothing, zoom: 'full' })
registerBuiltin({ id: 'rss', title: 'rss', component: nothing, zoom: 'full' })
registerBuiltin({ id: 'calc', title: 'calculator', component: nothing, zoom: 'panel' })
// No `zoom`: a readout with nothing more to show at any size (system, network status).
registerBuiltin({ id: 'netstat', title: 'network status', component: nothing })

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

describe('which panes may be brought forward', () => {
  const a = pane('clock')
  const small = pane('netstat')
  const panel = pane('calc')

  it('is the registry that says so, and a widget says nothing by default', () => {
    expect(zoomModeOf('clock')).toBe('full')
    expect(zoomModeOf('calc')).toBe('panel')
    expect(zoomModeOf('netstat')).toBeNull()
    // A widget this build does not have (a plugin that is not loaded) cannot either.
    expect(zoomModeOf('plugin:nowhere')).toBeNull()
  })

  it('a pane whose widget says nothing is left where it is', () => {
    load(split('row', [a, small]), small.id)
    layout.zoom(small.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.pinnedPaneId).toBeNull()
    expect(layout.zoomPin).toBeNull()
    // And the toggle does not put it forward either.
    layout.toggleZoom(small.id)
    expect(layout.zoomedPaneId).toBeNull()
  })

  it('a panel widget is pinned in its own box, not over the whole workspace', () => {
    load(split('row', [a, panel]), panel.id)
    layout.zoom(panel.id)
    const pin = layout.zoomPin
    expect(pin).not.toBeNull()
    expect(layout.zoomMode).toBe('panel')
    // The workspace here is 1000x800, so the panel is held to the nine tenths it
    // cannot exceed - what matters is that it is never wider than its own size.
    expect((pin?.right ?? 0) - (pin?.left ?? 0)).toBeLessThanOrEqual(PANEL_BOX.w)
    expect((pin?.bottom ?? 0) - (pin?.top ?? 0)).toBeLessThanOrEqual(PANEL_BOX.h)
  })

  it('a window resize keeps a panel a panel', () => {
    load(split('row', [a, panel]), panel.id)
    layout.zoom(panel.id)
    vi.advanceTimersByTime(CRT_ZOOM_MS)
    area = { top: 0, right: 4000, bottom: 3000, left: 0 }
    layout.repin()
    expect((layout.zoomPin?.right ?? 0) - (layout.zoomPin?.left ?? 0)).toBe(PANEL_BOX.w)
  })

  it('a tab of another size re-places the group it brought forward', () => {
    load(split('row', [a, tabs([pane('rss'), pane('calc')], 0)]), a.id)
    const [, full, panelTab] = collectPanes(layout.tree.root)
    if (full === undefined || panelTab === undefined) throw new Error('no tabs')
    layout.zoom(full.id)
    vi.advanceTimersByTime(CRT_ZOOM_MS)
    const wide = (layout.zoomPin?.right ?? 0) - (layout.zoomPin?.left ?? 0)

    layout.focus(panelTab.id)
    expect(layout.zoomedPaneId).toBe(panelTab.id)
    expect(layout.zoomMode).toBe('panel')
    // The group is still forward, but held to what a panel takes.
    expect((layout.zoomPin?.bottom ?? 0) - (layout.zoomPin?.top ?? 0)).toBeLessThanOrEqual(
      PANEL_BOX.h,
    )
    expect((layout.zoomPin?.right ?? 0) - (layout.zoomPin?.left ?? 0)).toBeLessThanOrEqual(wide)
  })

  it('a tab that cannot be brought forward puts the group back', () => {
    load(split('row', [a, tabs([pane('rss'), small], 0)]), a.id)
    const group = layout.tree.root
    const first = collectPanes(group)[1]
    const second = collectPanes(group)[2]
    if (first === undefined || second === undefined) throw new Error('no tabs')
    layout.zoom(first.id)
    vi.advanceTimersByTime(CRT_ZOOM_MS)
    expect(layout.zoomedPaneId).toBe(first.id)

    layout.focus(second.id)
    expect(layout.zoomedPaneId).toBeNull()
    vi.advanceTimersByTime(CRT_UNZOOM_MS)
    expect(layout.pinnedPaneId).toBeNull()
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

  it('closing the group of the zoomed tab, which powers off in front as a whole', () => {
    const group = tabs([b, c], 0)
    zoom(split('row', [a, group]), b.id)
    layout.close(group.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.closingId).toBe(group.id)
    // The group stays where it was brought forward, pinned by the tab it shows.
    expect(layout.pinnedPaneId).toBe(b.id)
    expect(layout.zoomPin).toEqual(PINNED)
    expect(layout.zoomPhase).toBeNull()

    vi.advanceTimersByTime(2000)
    expect(ids()).toEqual([a.id])
    expect(layout.pinnedPaneId).toBeNull()
  })

  it('closing a group the zoomed pane is not in', () => {
    const group = tabs([b, c], 0)
    zoom(split('row', [a, group]), a.id)
    layout.close(group.id)
    expect(layout.zoomedPaneId).toBeNull()
    expect(layout.pinnedPaneId).toBeNull()
    expect(layout.closingId).toBe(group.id)
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
    // reset writes out any pending save before it asks, so the ask - and the
    // `deliver` that answers it - exists only after those microtasks have run.
    await vi.advanceTimersByTimeAsync(0)
    layout.zoom(b.id)
    expect(layout.zoomedPaneId).toBe(b.id)

    deliver(fresh)
    // The tree arriving replaces the whole layout, which powers the old one off
    // and the new one on (layout-switch.ts); the timers carry that through.
    await vi.advanceTimersByTimeAsync(3000)
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
