import { pane, split } from '@shared/layout-ops'
import { LAYOUT_VERSION, type SplitNode } from '@shared/schemas/layout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/stores/sound.svelte.ts', () => ({ sfx: { play: vi.fn() } }))

const { startDividerDrag } = await import('../../src/renderer/layout/split-drag.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The divider gesture, driven by synthetic pointer events.
 *
 * jsdom has no layout and no pointer capture, so the container's length is given
 * to the gesture and capture is recorded rather than performed. The layout store
 * is the real one, so a drag really resizes the split.
 *
 * What is checked here is mostly how the gesture *ends*: a divider that is left
 * listening after the pointer has gone resizes the layout as the pointer passes
 * over it, with no button pressed, and a capture never given back swallows every
 * click in the window.
 */

const TOTAL = 1000

const a = pane('clock')
const b = pane('terminal')

let handle: HTMLElement
/** Pointer ids this handle has captured, as the browser would hold them. */
let captured: Set<number>
let releaseThrows: boolean

const pointer = (type: string, x: number, init: PointerEventInit = {}) =>
  new PointerEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: 0,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  })

/** The split as it stands, for the sizes a drag has written. */
const root = (): SplitNode => layout.tree.root as SplitNode
const sizes = () => root().sizes.map((size) => Math.round(size * 100) / 100)

/** Presses the divider, which starts the gesture with the handle as its target. */
function press(x: number, total = TOTAL): void {
  const down = pointer('pointerdown', x)
  Object.defineProperty(down, 'currentTarget', { value: handle })
  startDividerDrag(down, { node: root(), index: 0, row: true, total })
}

beforeEach(() => {
  vi.stubGlobal('elecdex', { layout: { save: vi.fn(async () => {}) } })
  layout.tree = { version: LAYOUT_VERSION, root: split('row', [a, b]) }
  handle = document.createElement('div')
  document.body.append(handle)
  captured = new Set()
  releaseThrows = false
  handle.setPointerCapture = (id: number) => {
    captured.add(id)
  }
  handle.hasPointerCapture = (id: number) => captured.has(id)
  handle.releasePointerCapture = (id: number) => {
    // The browser throws when the pointer is not one this element has captured:
    // it has been lost (the window was put away, the system took the pointer).
    if (releaseThrows || !captured.has(id))
      throw new DOMException('no such pointer', 'NotFoundError')
    captured.delete(id)
  }
})

afterEach(() => {
  handle.remove()
  layout.settle()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('dragging a divider', () => {
  it('moves size between the two panes it divides, and stops when the pointer is released', () => {
    press(500)
    handle.dispatchEvent(pointer('pointermove', 700))
    expect(sizes()).toEqual([0.7, 0.3])

    handle.dispatchEvent(pointer('pointerup', 700))
    expect(captured.size).toBe(0)

    // Released: the divider is no longer live under a pointer passing over it.
    handle.dispatchEvent(pointer('pointermove', 200))
    expect(sizes()).toEqual([0.7, 0.3])
  })

  it('keeps a pane from vanishing at either end', () => {
    press(500)
    handle.dispatchEvent(pointer('pointermove', -400))
    expect(sizes()).toEqual([0.05, 0.95])
    handle.dispatchEvent(pointer('pointermove', 1400))
    expect(sizes()).toEqual([0.95, 0.05])
  })

  it('ends when the capture is lost without a release', () => {
    press(500)
    handle.dispatchEvent(pointer('pointermove', 700))
    expect(sizes()).toEqual([0.7, 0.3])

    // The pointer is gone: the window was put away, or the system took it. The
    // browser gives the capture back and says so, and no pointerup ever comes.
    captured.clear()
    handle.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }))

    handle.dispatchEvent(pointer('pointermove', 200, { buttons: 0 }))
    expect(sizes()).toEqual([0.7, 0.3])
  })

  it('ends even when the capture can no longer be given back', () => {
    press(500)
    handle.dispatchEvent(pointer('pointermove', 700))
    releaseThrows = true

    expect(() => handle.dispatchEvent(pointer('pointerup', 700))).not.toThrow()
    handle.dispatchEvent(pointer('pointermove', 200, { buttons: 0 }))
    expect(sizes()).toEqual([0.7, 0.3])
  })

  it('takes no capture it would never give back when there is nothing to resize', () => {
    // A container with no length yet: the drag cannot mean anything, and a
    // pointer captured for it would swallow every click in the window.
    press(500, 0)
    expect(captured.size).toBe(0)
    handle.dispatchEvent(pointer('pointermove', 700))
    expect(sizes()).toEqual([0.5, 0.5])
  })
})
