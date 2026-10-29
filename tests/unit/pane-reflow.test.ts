import { describe, expect, it } from 'vitest'
import type { Frame } from '../../src/renderer/layout/geometry.js'
import { edgeStyle, edgesFrom, landStyle, reflowOf } from '../../src/renderer/layout/pane-reflow.js'
import { CRT_EDGE_MS, CRT_LAND_MS } from '../../src/renderer/lib/crt-timing.js'

/**
 * What the panes play after the layout changes under them, from where each was
 * and where it is now: a moved pane flies, one that gained room extends, one that
 * only lost room lights the edges that came in.
 */

const box = (top: number, right: number, bottom: number, left: number): Frame => ({
  top,
  right,
  bottom,
  left,
})
const LEFT = box(0, 600, 600, 0)
const RIGHT = box(0, 1200, 600, 600)
const WHOLE = box(0, 1200, 600, 0)
const LEFT_THIRD = box(0, 400, 600, 0)

describe('edgesFrom', () => {
  it('lights the edges that moved, and only those', () => {
    expect(edgesFrom(LEFT, LEFT_THIRD)).toEqual({ top: 0, right: 2, bottom: 0, left: 0 })
    expect(edgesFrom(WHOLE, box(300, 1200, 600, 0))).toEqual({
      top: 2,
      right: 0,
      bottom: 0,
      left: 0,
    })
  })

  it('lights nothing for a pane that stayed, or one that was not shown', () => {
    expect(edgesFrom(LEFT, box(0.4, 600.3, 600, 0))).toBeNull()
    expect(edgesFrom(undefined, LEFT)).toBeNull()
  })
})

describe('reflowOf', () => {
  it('flies a moved pane in from where it was', () => {
    const reflow = reflowOf(new Map([['m', LEFT]]), new Map([['m', RIGHT]]), new Set(['m']))
    expect([...reflow]).toEqual([['m', { kind: 'land', flip: { dx: -600, dy: 0, sx: 1, sy: 1 } }]])
  })

  it('does not fly a moved pane that ended where it began, nor one that was not shown', () => {
    const reflow = reflowOf(
      new Map([['m', LEFT]]),
      new Map([
        ['m', LEFT],
        ['n', RIGHT],
      ]),
      new Set(['m', 'n']),
    )
    expect(reflow.size).toBe(0)
  })

  it('flies a pane that only changed place, as the one a moved pane swapped with', () => {
    const reflow = reflowOf(new Map([['b', RIGHT]]), new Map([['b', LEFT]]))
    expect([...reflow]).toEqual([['b', { kind: 'land', flip: { dx: 600, dy: 0, sx: 1, sy: 1 } }]])
  })

  it('extends what gained room and lights what only lost it', () => {
    const before = new Map([
      ['a', LEFT],
      ['b', RIGHT],
    ])
    const after = new Map([
      ['a', LEFT_THIRD],
      ['b', box(0, 1200, 600, 400)],
    ])
    const reflow = reflowOf(before, after)
    expect(reflow.get('a')).toEqual({
      kind: 'edge',
      edges: { top: 0, right: 2, bottom: 0, left: 0 },
    })
    expect(reflow.get('b')).toEqual({
      kind: 'extend',
      inset: { top: 0, right: 0, bottom: 0, left: 200 },
    })
  })

  it('uncovers a pane that was not shown before from a line across its middle', () => {
    const reflow = reflowOf(new Map(), new Map([['t', WHOLE]]))
    expect(reflow.get('t')).toEqual({
      kind: 'extend',
      inset: { top: 300, right: 0, bottom: 300, left: 0 },
    })
  })

  it('leaves the panes the change added to power on by themselves', () => {
    const reflow = reflowOf(
      new Map([['a', WHOLE]]),
      new Map([
        ['a', LEFT],
        ['new', RIGHT],
      ]),
      new Set(),
      new Set(['new']),
    )
    expect([...reflow.keys()]).toEqual(['a'])
    expect(reflow.get('a')?.kind).toBe('edge')
  })
})

describe('the styles they play by', () => {
  it('fly by whole pixels and short ratios', () => {
    expect(landStyle({ dx: -600.4, dy: 12, sx: 0.333333, sy: 1 })).toBe(
      `--land-dx: -600px; --land-dy: 12px; --land-sx: 0.3333; --land-sy: 1; --crt-duration: ${CRT_LAND_MS}ms`,
    )
  })

  it('light the edges by their width', () => {
    expect(edgeStyle({ top: 0, right: 2, bottom: 0, left: 0 })).toBe(
      `--edge-top: 0px; --edge-right: 2px; --edge-bottom: 0px; --edge-left: 0px; --crt-duration: ${CRT_EDGE_MS}ms`,
    )
  })
})
