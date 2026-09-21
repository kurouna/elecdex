import { collectPanes, pane, split, tabs } from '@shared/layout-ops'
import { LAYOUT_VERSION, type LayoutNode, type LayoutTree } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Frame } from '../../src/renderer/layout/pane-close.ts'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { CLOSE_SETTLE_MS, CRT_EXTEND_MS, measureFrames } = await import(
  '../../src/renderer/layout/pane-close.ts'
)
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
const { sfx } = await import('../../src/renderer/stores/sound.svelte.ts')

/**
 * Closing a shown pane in two steps: it powers off while still in the tree, then
 * goes, and the panes that took its room extend into it. Only one close runs at a
 * time: anything else that changes the tree finishes it first.
 */

/**
 * Boxes as a row of equal columns, a column split into equal rows: enough geometry
 * to tell which panes gained room, without a layout engine. A tab group is one box.
 */
function framesOf(tree: LayoutTree): Map<string, Frame> {
  const frames = new Map<string, Frame>()
  const place = (node: LayoutNode, box: Frame): void => {
    if (node.kind === 'pane') frames.set(node.id, box)
    else if (node.kind === 'tabs') {
      const shown = node.children[node.activeIndex]
      if (shown) frames.set(shown.id, box)
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
  place(tree.root, { top: 0, right: 1200, bottom: 600, left: 0 })
  return frames
}

let animates = true
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
  layout.closeMotion = { animates: () => animates, frames: () => framesOf(layout.tree) }
})

afterEach(() => {
  layout.settle()
  layout.closeMotion = null
  vi.clearAllMocks()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('closing a pane', () => {
  const a = pane('clock')
  const b = pane('calendar')
  const c = pane('weather')

  it('powers it off in the tree first, then removes it and extends what took its room', () => {
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    expect(layout.closingId).toBe(a.id)
    expect(ids()).toEqual([a.id, b.id])
    // Focus moves on at once, to what will still be there.
    expect(layout.focusedPaneId).toBe(b.id)
    expect(sfx.play).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([b.id])
    // b was the right half and is now everything: its clip starts at its old left.
    expect(layout.extending.get(b.id)).toEqual({ top: 0, right: 0, bottom: 0, left: 600 })

    vi.advanceTimersByTime(CRT_EXTEND_MS)
    expect(layout.extending.size).toBe(0)
    expect(sfx.play).toHaveBeenCalledTimes(1)
  })

  it('extends only the panes that gained room', () => {
    load(split('row', [a, split('column', [b, c])]), b.id)
    layout.close(b.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect([...layout.extending.keys()]).toEqual([c.id])
    expect(layout.extending.get(c.id)).toEqual({ top: 300, right: 0, bottom: 0, left: 0 })
  })

  it('opens the tab that takes a closed tab’s place from its middle', () => {
    const d = pane('rss')
    load(split('row', [a, tabs([b, c, d], 1)]), c.id)
    layout.close(c.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toEqual([a.id, b.id, d.id])
    expect([...layout.extending.keys()]).toEqual([d.id])
    expect(layout.extending.get(d.id)).toEqual({ top: 300, right: 0, bottom: 300, left: 0 })
  })

  it('closes a whole group by its id: it powers off as one, then every tab goes', () => {
    const group = tabs([b, c], 0)
    load(split('row', [a, group]), b.id)
    layout.close(group.id)
    expect(layout.closingId).toBe(group.id)
    expect(ids()).toEqual([a.id, b.id, c.id])
    expect(layout.focusedPaneId).toBe(a.id)
    expect(sfx.play).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([a.id])
    // a was the left half and is now everything: its clip starts at its old right.
    expect(layout.extending.get(a.id)).toEqual({ top: 0, right: 600, bottom: 0, left: 0 })
  })

  it('a group closed to nothing gives way to the fallback pane', () => {
    const group = tabs([a, b], 1)
    load(group, b.id)
    layout.close(group.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toHaveLength(1)
    expect(ids()).not.toContain(a.id)
    expect(ids()).not.toContain(b.id)
    expect(layout.extending.size).toBe(0)
  })

  it('a group closes at once when motion is reduced', () => {
    animates = false
    const group = tabs([b, c], 0)
    load(split('row', [a, group]), c.id)
    layout.close(group.id)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([a.id])
    expect(layout.focusedPaneId).toBe(a.id)
  })

  it('closes at once when motion is reduced or during the boot', () => {
    animates = false
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([b.id])
    expect(layout.extending.size).toBe(0)
  })

  it('closes at once without a workspace to animate in', () => {
    layout.closeMotion = null
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    expect(ids()).toEqual([b.id])
  })

  it('closes a tab behind another at once, and leaves the shown one alone', () => {
    load(tabs([a, b, c], 0), a.id)
    layout.close(b.id)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([a.id, c.id])
    expect(layout.focusedPaneId).toBe(a.id)
  })

  it('ignores a second close of the pane already closing', () => {
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    layout.close(a.id)
    expect(layout.closingId).toBe(a.id)
    expect(ids()).toEqual([a.id, b.id])
    expect(sfx.play).toHaveBeenCalledTimes(1)
  })

  it('ignores a pane that is not there', () => {
    load(split('row', [a, b]), a.id)
    layout.close('missing')
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([a.id, b.id])
    expect(sfx.play).not.toHaveBeenCalled()
  })

  it('powers on the pane put in when the last one closes, and extends nothing', () => {
    load(a, a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    const [fallback] = ids()
    expect(fallback).not.toBe(a.id)
    expect(layout.arrived(fallback as string)).toBe(true)
    expect(layout.extending.size).toBe(0)
    expect(layout.focusedPaneId).toBe(fallback)
  })

  it('does not focus the closing pane', () => {
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    layout.focus(a.id)
    expect(layout.focusedPaneId).toBe(b.id)
    // The keyboard's order skips it too, rather than getting stuck on it.
    layout.cycleFocus(1)
    expect(layout.focusedPaneId).toBe(b.id)
    expect(layout.closingId).toBe(a.id)
  })

  it('keeps the closing pane while its state changes, and removes it on time', () => {
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    layout.setPaneState(a.id, { x: 1 })
    expect(layout.closingId).toBe(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toEqual([b.id])
  })
})

describe('a change during a close', () => {
  const a = pane('clock')
  const b = pane('calendar')
  const c = pane('weather')

  it('another close finishes the first at once and animates only the second', () => {
    // Closing b collapses the column, which would remount c mid-power-off if the two overlapped.
    load(split('row', [a, split('column', [b, c])]), b.id)
    layout.close(b.id)
    layout.close(c.id)
    expect(ids()).toEqual([a.id, c.id])
    expect(layout.closingId).toBe(c.id)
    expect(layout.extending.size).toBe(0)

    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toEqual([a.id])
    expect([...layout.extending.keys()]).toEqual([a.id])
    // Measured from the tree the first close left: a was the left half.
    expect(layout.extending.get(a.id)).toEqual({ top: 0, right: 600, bottom: 0, left: 0 })
  })

  it('a close during an extension stops it before measuring', () => {
    load(split('row', [a, b, c]), a.id)
    layout.close(a.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(layout.extending.size).toBe(2)
    layout.close(b.id)
    expect(layout.extending.size).toBe(0)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect([...layout.extending.keys()]).toEqual([c.id])
    expect(layout.extending.get(c.id)).toEqual({ top: 0, right: 0, bottom: 0, left: 600 })
  })

  it('closing the other tab of a pair finishes the close first', () => {
    load(split('row', [a, tabs([b, c], 0)]), b.id)
    layout.close(b.id)
    layout.close(c.id)
    expect(ids()).toEqual([a.id, c.id])
    expect(layout.closingId).toBe(c.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS)
    expect(ids()).toEqual([a.id])
  })

  it.each([
    ['split', () => layout.split(a.id, 'down', 'rss')],
    ['addTab', () => layout.addTab(a.id, 'rss')],
    ['move', () => layout.move(a.id, c.id, 'left')],
    ['resize', () => layout.resize('missing', [0.5, 0.5])],
  ])('%s finishes the close first', (_name, change) => {
    load(split('row', [a, b, c]), a.id)
    layout.close(b.id)
    change()
    expect(layout.closingId).toBeNull()
    expect(ids()).not.toContain(b.id)
    vi.advanceTimersByTime(CLOSE_SETTLE_MS + CRT_EXTEND_MS)
    expect(ids()).not.toContain(b.id)
    expect(layout.extending.size).toBe(0)
  })

  it('switching tabs finishes the close first, and skips the tab that closed', () => {
    load(tabs([a, b, c], 1), b.id)
    layout.close(b.id)
    // Focus went to c, the tab taking b's place; b is its neighbour until b has gone.
    expect(layout.focusedPaneId).toBe(c.id)
    expect(layout.cycleTab(-1)).toBe(true)
    expect(layout.closingId).toBeNull()
    expect(ids()).toEqual([a.id, c.id])
    expect(layout.focusedPaneId).toBe(a.id)
  })

  it('moving to the next shell finishes the close first', () => {
    const [t1, t2, t3] = [pane('terminal'), pane('terminal'), pane('terminal')]
    load(split('row', [t1, t2, t3]), t1.id)
    layout.close(t2.id)
    expect(layout.cycleShell(1)).toBe(true)
    expect(layout.closingId).toBeNull()
    expect(layout.focusedPaneId).toBe(t3.id)
  })

  it('a tab or shell key with nowhere to go leaves the close running', () => {
    load(split('row', [a, b, c]), a.id)
    layout.close(b.id)
    expect(layout.cycleTab(1)).toBe(false)
    expect(layout.cycleShell(1)).toBe(false)
    expect(layout.closingId).toBe(b.id)
  })

  it('the shell to follow or focus is never the one powering off', () => {
    const [t1, t2] = [pane('terminal'), pane('terminal')]
    load(split('row', [t1, t2]), t1.id)
    layout.focus(t1.id)
    expect(layout.followedTerminalId).toBe(t1.id)
    layout.close(t1.id)
    expect(layout.followedTerminalId).toBe(t2.id)
    expect(layout.shellToFocus()).toBe(t2.id)
  })

  it('a move onto the closing pane does nothing once it has gone', () => {
    load(split('row', [a, b, c]), a.id)
    layout.close(b.id)
    layout.move(a.id, b.id, 'left')
    expect(ids()).toEqual([a.id, c.id])
  })

  it('a reset finishes the close first', async () => {
    const fresh = pane('clock')
    vi.stubGlobal('elecdex', {
      layout: { save: saved, reset: vi.fn(async () => ({ version: LAYOUT_VERSION, root: fresh })) },
    })
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    const done = layout.reset()
    // The default tree replaces the layout, which powers the old one off and the
    // new one on (layout-switch.ts).
    await vi.advanceTimersByTimeAsync(3000)
    await done
    expect(layout.closingId).toBeNull()
    vi.advanceTimersByTime(CLOSE_SETTLE_MS + CRT_EXTEND_MS)
    expect(ids()).toEqual([fresh.id])
  })

  it('a flush saves the layout without the closing pane', async () => {
    load(split('row', [a, b]), a.id)
    layout.close(a.id)
    await layout.flush()
    expect(saved).toHaveBeenCalledTimes(1)
    const [[tree]] = saved.mock.calls as [[LayoutTree]]
    expect(collectPanes(tree.root).map((p) => p.id)).toEqual([b.id])
  })
})

describe('measureFrames', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  const at = (el: HTMLElement, top: number, left: number) => {
    el.getBoundingClientRect = () => DOMRect.fromRect({ x: left, y: top, width: 100, height: 50 })
  }

  it('measures shown panes, a tab by its group, and skips hidden tabs', () => {
    document.body.innerHTML = `
      <section data-testid="pane" data-pane-id="solo"></section>
      <section data-testid="tabs-host">
        <section data-testid="pane" data-pane-id="front"></section>
        <section data-testid="pane" class="hidden" data-pane-id="back"></section>
      </section>`
    const solo = document.querySelector<HTMLElement>('[data-pane-id=solo]') as HTMLElement
    const group = document.querySelector<HTMLElement>('[data-testid=tabs-host]') as HTMLElement
    const front = document.querySelector<HTMLElement>('[data-pane-id=front]') as HTMLElement
    at(solo, 0, 0)
    at(group, 10, 200)
    at(front, 40, 210)
    const frames = measureFrames()
    expect([...frames.keys()]).toEqual(['solo', 'front'])
    expect(frames.get('front')).toEqual({ top: 10, right: 300, bottom: 60, left: 200 })
  })
})
