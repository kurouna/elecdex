import { describe, expect, it } from 'vitest'
import { dropPlacement, dropPreview } from '../../src/renderer/lib/drop-zone.js'

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
