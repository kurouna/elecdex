import { describe, expect, it } from 'vitest'
import { dropPlacement, dropPreview, tabInsertion } from '../../src/renderer/lib/drop-zone.js'

const box = { left: 100, top: 50, width: 400, height: 200 }

/** Like DOMRect: the fields are getters on the prototype, not own properties. */
class RectLike {
  readonly #box: typeof box
  constructor(b: typeof box) {
    this.#box = b
  }
  get left() {
    return this.#box.left
  }
  get top() {
    return this.#box.top
  }
  get width() {
    return this.#box.width
  }
  get height() {
    return this.#box.height
  }
}

describe('dropPlacement', () => {
  it.each([
    [110, 150, 'left'],
    [490, 150, 'right'],
    [300, 55, 'up'],
    [300, 245, 'down'],
    // The very middle still picks a side: a plain drop never makes a tab.
    [290, 150, 'left'],
  ] as const)('(%i, %i) is %s', (x, y, expected) => {
    expect(dropPlacement(box, x, y, false)).toBe(expected)
  })

  it('is a tab anywhere over the pane when asked for one', () => {
    expect(dropPlacement(box, 110, 150, true)).toBe('tab')
    expect(dropPlacement(box, 300, 150, true)).toBe('tab')
  })

  it('measures each side as a share of it, so a flat pane still has side zones', () => {
    const flat = { left: 0, top: 0, width: 1000, height: 40 }
    expect(dropPlacement(flat, 100, 20, false)).toBe('left')
    expect(dropPlacement(flat, 500, 5, false)).toBe('up')
    expect(dropPlacement(flat, 500, 35, false)).toBe('down')
  })

  it('does not divide by a box with no size', () => {
    expect(dropPlacement({ left: 0, top: 0, width: 0, height: 0 }, 0, 0, false)).toBe('left')
  })
})

describe('dropPreview', () => {
  it.each([
    ['left', { left: 100, top: 50, width: 200, height: 200 }],
    ['right', { left: 300, top: 50, width: 200, height: 200 }],
    ['up', { left: 100, top: 50, width: 400, height: 100 }],
    ['down', { left: 100, top: 150, width: 400, height: 100 }],
    ['tab', box],
  ] as const)('%s covers the half (or whole) the pane would take', (placement, expected) => {
    expect(dropPreview(box, placement)).toEqual(expected)
  })

  it.each(['left', 'right', 'up', 'down', 'tab'] as const)(
    'reads a DOMRect-like box whose fields are getters (%s)',
    (placement) => {
      expect(dropPreview(new RectLike(box), placement)).toEqual(dropPreview(box, placement))
    },
  )
})

describe('tabInsertion', () => {
  // Four tabs of 60px along a 26px strip, as a group draws them.
  const strip = [0, 60, 120, 180].map((left) => ({ left, top: 10, width: 60, height: 26 }))
  const bounds = { left: 0, top: 10, width: 240, height: 26 }
  const insertion = (boxes: readonly (typeof box)[], x: number, within = bounds) =>
    tabInsertion(boxes, x, within)

  it.each([
    [-50, 0],
    [10, 0],
    [29, 0],
    [31, 1],
    [89, 1],
    [91, 2],
    // Exactly on a midpoint falls to the gap after it.
    [90, 2],
    [211, 4],
    [900, 4],
  ])('x %i falls in gap %i', (x, index) => {
    expect(insertion(strip, x)?.index).toBe(index)
  })

  it('puts the caret on the gap it picked, spanning the tabs', () => {
    expect(insertion(strip, 10)?.caret).toEqual({ left: 0, top: 10, width: 0, height: 26 })
    expect(insertion(strip, 91)?.caret).toEqual({ left: 120, top: 10, width: 0, height: 26 })
    // Past the last tab the caret goes on its trailing edge, not its leading one.
    expect(insertion(strip, 900)?.caret).toEqual({ left: 240, top: 10, width: 0, height: 26 })
  })

  it('holds the caret inside the strip, which clips the tabs it is drawn among', () => {
    // The first tab hangs out to the left of the strip, as the real one does.
    const clipped = { left: 10, top: 10, width: 220, height: 26 }
    expect(insertion(strip, 10, clipped)?.caret.left).toBe(10)
    expect(insertion(strip, 900, clipped)?.caret.left).toBe(230)
    // A gap well inside it is left where it is.
    expect(insertion(strip, 91, clipped)?.caret.left).toBe(120)
  })

  it('spans tabs of differing heights', () => {
    const ragged = [
      { left: 0, top: 20, width: 40, height: 10 },
      { left: 40, top: 10, width: 40, height: 30 },
    ]
    expect(insertion(ragged, 50)?.caret).toEqual({ left: 40, top: 10, width: 0, height: 30 })
  })

  it('offers both gaps of a strip with one tab, as a lone shell pane draws', () => {
    const one = [{ left: 0, top: 0, width: 100, height: 26 }]
    const within = { left: 0, top: 0, width: 100, height: 26 }
    expect(insertion(one, 10, within)?.index).toBe(0)
    expect(insertion(one, 49, within)?.index).toBe(0)
    expect(insertion(one, 51, within)?.index).toBe(1)
    expect(insertion(one, 51, within)?.caret.left).toBe(100)
  })

  it('divides each tab at its own midpoint, whatever its width', () => {
    const uneven = [
      { left: 0, top: 0, width: 200, height: 26 },
      { left: 200, top: 0, width: 40, height: 26 },
      { left: 240, top: 0, width: 80, height: 26 },
    ]
    const within = { left: 0, top: 0, width: 320, height: 26 }
    expect(insertion(uneven, 99, within)?.index).toBe(0)
    expect(insertion(uneven, 101, within)?.index).toBe(1)
    expect(insertion(uneven, 219, within)?.index).toBe(1)
    expect(insertion(uneven, 221, within)?.index).toBe(2)
    expect(insertion(uneven, 279, within)?.index).toBe(2)
    expect(insertion(uneven, 281, within)?.index).toBe(3)
  })

  it('holds the caret in from both ends when the strip is narrower than its tabs', () => {
    const narrow = { left: 30, top: 10, width: 180, height: 26 }
    // Every gap, clamped into the strip and never outside it.
    for (const x of [-100, 10, 91, 211, 900]) {
      const caret = insertion(strip, x, narrow)?.caret.left as number
      expect(caret).toBeGreaterThanOrEqual(30)
      expect(caret).toBeLessThanOrEqual(210)
    }
    expect(insertion(strip, -100, narrow)?.caret.left).toBe(30)
    expect(insertion(strip, 900, narrow)?.caret.left).toBe(210)
  })

  it('has no insertion point where there is no strip', () => {
    expect(insertion([], 100)).toBeNull()
  })

  it('reads DOMRect-like boxes whose fields are getters', () => {
    const rects = strip.map((b) => new RectLike(b))
    expect(insertion(rects, 91, new RectLike(bounds))).toEqual(insertion(strip, 91))
  })
})
