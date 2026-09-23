import { describe, expect, it } from 'vitest'
import {
  clampView,
  fitView,
  MAX_SCALE,
  minScale,
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
