import { describe, expect, it } from 'vitest'
import { CRT_EXTEND_MS, extendFrom, insetStyle } from '../../src/renderer/layout/pane-close.js'

/** Where the panes left behind by a close start uncovering their new room from. */
describe('extendFrom', () => {
  const box = (top: number, right: number, bottom: number, left: number) => ({
    top,
    right,
    bottom,
    left,
  })

  it('clips a pane that grew rightwards to its old right edge', () => {
    expect(extendFrom(box(0, 400, 300, 0), box(0, 800, 300, 0))).toEqual(box(0, 400, 0, 0))
  })

  it('clips a pane that grew upwards and leftwards from its old top and left', () => {
    expect(extendFrom(box(200, 800, 600, 300), box(0, 800, 600, 0))).toEqual(box(200, 0, 0, 300))
  })

  it('leaves alone a pane that gained no room, or only a rounding error', () => {
    expect(extendFrom(box(0, 400, 300, 0), box(0, 400, 300, 0))).toBeNull()
    expect(extendFrom(box(0.4, 400, 300, 0), box(0, 400.5, 300, 0))).toBeNull()
  })

  it('does not clip past a side that moved inwards', () => {
    // A same-direction split flattened into its parent can shift a side the other way.
    expect(extendFrom(box(0, 400, 300, 0), box(0, 800, 290, 10))).toEqual(box(0, 400, 0, 0))
  })

  it('opens a pane that was not shown from a line across its middle', () => {
    expect(extendFrom(undefined, box(100, 500, 300, 0))).toEqual(box(100, 0, 100, 0))
  })
})

describe('insetStyle', () => {
  it('gives whole pixels and the extension length', () => {
    expect(insetStyle({ top: 0.4, right: 399.6, bottom: 0, left: 12 })).toBe(
      `--from-top: 0px; --from-right: 400px; --from-bottom: 0px; --from-left: 12px; --crt-duration: ${CRT_EXTEND_MS}ms`,
    )
  })
})
