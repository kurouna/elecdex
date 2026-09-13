import { describe, expect, it } from 'vitest'
import { dropPlacement, dropPreview } from '../../src/renderer/lib/drop-zone.js'

const box = { left: 100, top: 50, width: 400, height: 200 }

describe('dropPlacement', () => {
  it.each([
    [110, 150, 'left'],
    [490, 150, 'right'],
    [300, 55, 'up'],
    [300, 245, 'down'],
    [300, 150, 'tab'],
  ] as const)('(%i, %i) is %s', (x, y, expected) => {
    expect(dropPlacement(box, x, y)).toBe(expected)
  })

  it('measures each side as a share of it, so a flat pane still has side zones', () => {
    const flat = { left: 0, top: 0, width: 1000, height: 40 }
    expect(dropPlacement(flat, 100, 20)).toBe('left')
    expect(dropPlacement(flat, 500, 5)).toBe('up')
    expect(dropPlacement(flat, 500, 20)).toBe('tab')
  })

  it('treats a box with no size as its centre', () => {
    expect(dropPlacement({ left: 0, top: 0, width: 0, height: 0 }, 0, 0)).toBe('tab')
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
})
