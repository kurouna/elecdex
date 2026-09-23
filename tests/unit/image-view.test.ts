import { describe, expect, it } from 'vitest'
import {
  clampView,
  fitView,
  MAX_SCALE,
  minScale,
  pairLayout,
  panBy,
  wheelFactor,
  zoomAt,
} from '../../src/renderer/lib/image-view.js'

/** Zooming and panning a picture in the diff's image viewer. */

const BOX = { w: 800, h: 600 }
const WIDE = { w: 1600, h: 400 }

describe('the image viewer', () => {
  it('fits the whole picture, centred, up or down', () => {
    expect(fitView(WIDE, BOX)).toEqual({ scale: 0.5, x: 0, y: 200 })
    // An icon is brought up to fill the room: that is what it was opened for.
    expect(fitView({ w: 16, h: 16 }, BOX)).toEqual({ scale: MAX_SCALE, x: 144, y: 44 })
    // Before the viewer has a size, nothing divides by zero.
    expect(fitView(WIDE, { w: 0, h: 0 }).scale).toBe(1)
  })

  it('keeps the point under the pointer where it is as it zooms', () => {
    const start = fitView(WIDE, BOX)
    const at = { x: 300, y: 250 }
    const imageX = (at.x - start.x) / start.scale
    const imageY = (at.y - start.y) / start.scale
    const next = zoomAt(start, 2, at, WIDE, BOX)
    expect(next.scale).toBe(1)
    expect((at.x - next.x) / next.scale).toBeCloseTo(imageX)
    expect((at.y - next.y) / next.scale).toBeCloseTo(imageY)
  })

  it('zooms no further out than a quarter of the fit, and no further in than MAX_SCALE', () => {
    const fitted = fitView(WIDE, BOX)
    expect(zoomAt(fitted, 1e-6, { x: 0, y: 0 }, WIDE, BOX).scale).toBe(minScale(WIDE, BOX))
    expect(minScale(WIDE, BOX)).toBe(0.125)
    expect(zoomAt(fitted, 1e6, { x: 0, y: 0 }, WIDE, BOX).scale).toBe(MAX_SCALE)
  })

  it('never lets the picture be dragged out of reach', () => {
    const view = { x: 0, y: 0, scale: 1 }
    const far = panBy(view, -1e5, 1e5, WIDE, BOX)
    // At least 32 pixels of it stay in the viewer on each side it was dragged to.
    expect(far.x + WIDE.w).toBe(32)
    expect(far.y).toBe(BOX.h - 32)
    expect(clampView({ x: 10, y: 10, scale: 1 }, WIDE, BOX)).toEqual({ x: 10, y: 10, scale: 1 })
  })

  it('reads a wheel notch as a gentle step, and a page as a bounded one', () => {
    expect(wheelFactor(-100, 0)).toBeGreaterThan(1)
    expect(wheelFactor(100, 0)).toBeLessThan(1)
    expect(wheelFactor(3, 1)).toBeCloseTo(wheelFactor(48, 0))
    expect(wheelFactor(-10, 2)).toBeCloseTo(Math.exp(0.9))
  })
})

describe('before and after, side by side or one above the other', () => {
  const chrome = { pad: 8, gap: 8, caption: 20, frame: 16 }
  // The screenshot the pane was reported with: two 1360 x 880 shots in a diff 660 px wide, 950 tall.
  const shot = { w: 1360, h: 880 }

  it('stacks two wide images in a tall, narrow diff, where they are drawn larger', () => {
    const layout = pairLayout([shot, shot], { w: 660, h: 950 }, chrome)
    expect(layout.direction).toBe('column')
    // Stacked, each is drawn about twice the width it had beside the other.
    const beside = pairLayout([shot, shot], { w: 660, h: 950 }, { ...chrome, gap: 10_000 })
    expect(layout.cell.w).toBeGreaterThan(600)
    expect(beside.direction).toBe('column')
  })

  it('keeps them side by side where the diff is wide, and for tall images', () => {
    expect(pairLayout([shot, shot], { w: 1600, h: 500 }, chrome).direction).toBe('row')
    const tall = { w: 400, h: 1200 }
    expect(pairLayout([tall, tall], { w: 660, h: 950 }, chrome).direction).toBe('row')
  })

  it('keeps small images side by side: drawn at their own size either way', () => {
    const icon = { w: 32, h: 32 }
    expect(pairLayout([icon, icon], { w: 300, h: 900 }, chrome).direction).toBe('row')
  })

  it('goes by the image it knows while the other loads, or is not there', () => {
    expect(pairLayout([null, shot], { w: 660, h: 950 }, chrome).direction).toBe('column')
    expect(pairLayout([null, null], { w: 660, h: 950 }, chrome)).toMatchObject({ direction: 'row' })
  })

  it('never gives an image less than a sliver of room', () => {
    const { cell } = pairLayout([shot], { w: 20, h: 20 }, chrome)
    expect(cell.w).toBeGreaterThanOrEqual(32)
    expect(cell.h).toBeGreaterThanOrEqual(32)
  })
})
