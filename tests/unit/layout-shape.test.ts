import { describe, expect, it } from 'vitest'
import { defaultLayout } from '../../src/shared/default-layout.js'
import { pane, split, tabs } from '../../src/shared/layout-ops.js'
import { layoutShape, MAX_SHAPE_RECTS } from '../../src/shared/layout-shape.js'

describe('layoutShape', () => {
  it('is the whole workspace for a single pane', () => {
    expect(layoutShape(pane('terminal'))).toEqual([
      { x: 0, y: 0, w: 1, h: 1, widget: 'terminal', tabs: 1 },
    ])
  })

  it('shares a split out by its sizes, across for a row and down for a column', () => {
    const shape = layoutShape(
      split('row', [pane('a'), split('column', [pane('b'), pane('c')], [0.25, 0.75])], [0.4, 0.6]),
    )
    expect(shape).toEqual([
      { x: 0, y: 0, w: 0.4, h: 1, widget: 'a', tabs: 1 },
      { x: 0.4, y: 0, w: 0.6, h: 0.25, widget: 'b', tabs: 1 },
      { x: 0.4, y: 0.25, w: 0.6, h: 0.75, widget: 'c', tabs: 1 },
    ])
  })

  it('draws a tab group as one place, named by the tab on show', () => {
    const shape = layoutShape(tabs([pane('web.x'), pane('rss')], 1))
    expect(shape).toEqual([{ x: 0, y: 0, w: 1, h: 1, widget: 'rss', tabs: 2 }])
  })

  it('still fills the workspace when a hand-edited split does not sum to one', () => {
    const shape = layoutShape(split('row', [pane('a'), pane('b')], [2, 2]))
    expect(shape.map((r) => [r.x, r.w])).toEqual([
      [0, 0.5],
      [0.5, 0.5],
    ])
  })

  it('covers the default layout without gaps or overlaps', () => {
    const shape = layoutShape(defaultLayout())
    const area = shape.reduce((sum, r) => sum + r.w * r.h, 0)
    expect(area).toBeCloseTo(1, 3)
    for (const r of shape) {
      expect(r.x + r.w).toBeLessThanOrEqual(1.0001)
      expect(r.y + r.h).toBeLessThanOrEqual(1.0001)
    }
  })

  it('stops at a bound, so a pathological tree cannot flood the IPC answer', () => {
    const many = split(
      'row',
      Array.from({ length: MAX_SHAPE_RECTS + 20 }, () => pane('clock')),
    )
    expect(layoutShape(many)).toHaveLength(MAX_SHAPE_RECTS)
  })
})
