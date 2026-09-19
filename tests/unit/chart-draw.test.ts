import type { CandlePoint } from '@shared/markets'
import { describe, expect, it } from 'vitest'
import { observeCanvas } from '../../src/renderer/lib/canvas.js'
import {
  barsFor,
  drawCandles,
  MIN_SLOT_PX,
  valueScale,
} from '../../src/renderer/widgets/markets/chart-draw.js'

/**
 * The market board's drawing, on its own: the value axis, how many bars fit, and
 * the candles' widths, which must stay odd so a body sits evenly on its wick.
 */

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A canvas context that only records the rectangles it was asked to fill. */
function recorder(): { ctx: CanvasRenderingContext2D; rects: Rect[] } {
  const rects: Rect[] = []
  const ctx = {
    fillStyle: '',
    fillRect: (x: number, y: number, w: number, h: number) => rects.push({ x, y, w, h }),
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects }
}

const bar = (o: number, h: number, l: number, c: number): CandlePoint => ({ t: 0, o, h, l, c })

describe('valueScale', () => {
  it('pads the range so the extremes do not touch the edges', () => {
    const y = valueScale(0, 100, 100)
    expect(y(100)).toBeCloseTo(100 * (12 / 124), 6)
    expect(y(0)).toBeCloseTo(100 * (112 / 124), 6)
    expect(y(50)).toBeCloseTo(50, 6)
  })

  it('turns a reversed range the right way round', () => {
    const y = valueScale(100, 0, 100)
    expect(y(100)).toBeCloseTo(valueScale(0, 100, 100)(100), 6)
    expect(y(0)).toBeCloseTo(valueScale(0, 100, 100)(0), 6)
  })

  it('falls back to a range around zero when a bound is not a number', () => {
    const bounds: [number, number][] = [
      [Number.NaN, 100],
      [0, Number.NaN],
      [Number.NaN, Number.NaN],
      [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY],
      [0, Number.POSITIVE_INFINITY],
    ]
    for (const [lo, hi] of bounds) {
      const y = valueScale(lo, hi, 100)
      expect(Number.isFinite(y(0))).toBe(true)
      expect(Number.isFinite(y(50))).toBe(true)
      // Still the right way up: a larger value is drawn higher.
      expect(y(1)).toBeLessThan(y(0))
    }
  })

  it('spreads a flat range instead of dividing by zero', () => {
    const y = valueScale(7, 7, 100)
    expect(Number.isFinite(y(7))).toBe(true)
    expect(y(7)).toBeCloseTo(50, 6)
  })
})

describe('barsFor', () => {
  it('fits one bar per slot and never fewer than one', () => {
    expect(barsFor(300)).toBe(300 / MIN_SLOT_PX)
    expect(barsFor(10)).toBe(3)
    expect(barsFor(2)).toBe(1)
    expect(barsFor(0)).toBe(1)
  })
})

describe('drawCandles', () => {
  const widths = (slot: number): number => {
    const { ctx, rects } = recorder()
    drawCandles(ctx, [bar(1, 2, 0, 1.5)], slot, (v) => 10 - v, { up: 'u', down: 'd' })
    return rects[1]?.w ?? 0
  }

  it('keeps the body odd, so it sits evenly on the wick', () => {
    expect(widths(3)).toBe(1)
    expect(widths(4)).toBe(1)
    expect(widths(5)).toBe(3)
    expect(widths(10)).toBe(7)
    for (const slot of [3, 4, 5, 6, 7, 8, 9, 10, 17, 40]) {
      expect(widths(slot) % 2).toBe(1)
    }
  })

  it('centres the body on the wick, on whole pixels', () => {
    const { ctx, rects } = recorder()
    drawCandles(ctx, [bar(1, 2, 0, 1.5)], 10, (v) => 10 - v, { up: 'u', down: 'd' })
    const [wick, body] = rects
    expect(wick?.w).toBe(1)
    expect(body && wick && body.x + (body.w - 1) / 2).toBe(wick?.x)
    expect(Number.isInteger(body?.x)).toBe(true)
  })

  it('colours a bar by its close against its open, and never draws nothing', () => {
    const { ctx, rects } = recorder()
    const colors = { up: 'u', down: 'd' }
    drawCandles(ctx, [bar(1, 1, 1, 1), bar(2, 2, 1, 1)], 10, (v) => 10 - v, colors)
    // A bar that opened and closed at the same price still shows a line.
    expect(rects[0]?.h).toBe(1)
    expect(rects[1]?.h).toBe(1)
    expect(rects.length).toBe(4)
  })
})

describe('observeCanvas', () => {
  it('reports the CSS size while keeping the backing store at least one pixel', () => {
    let fire: () => void = () => {}
    class FakeResizeObserver {
      constructor(callback: () => void) {
        fire = callback
      }
      observe(): void {}
      disconnect(): void {
        disconnected = true
      }
    }
    let disconnected = false
    const previous = { ro: globalThis.ResizeObserver, win: globalThis.window }
    Object.defineProperty(globalThis, 'ResizeObserver', {
      value: FakeResizeObserver,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'window', {
      value: { devicePixelRatio: 2 },
      configurable: true,
    })
    const el = { clientWidth: 0, clientHeight: 0, width: 0, height: 0 }
    const canvas = el as unknown as HTMLCanvasElement
    const sizes: { width: number; height: number; ratio: number }[] = []
    const stop = observeCanvas(canvas, (size) => sizes.push(size))

    // A pane that is not laid out yet: the backing store is clamped to a pixel (a
    // zero-sized canvas throws), but the chart is told the real size, so it can
    // decline to draw rather than drawing into that one pixel.
    fire()
    expect(el.width).toBe(1)
    expect(el.height).toBe(1)
    expect(sizes.at(-1)).toEqual({ width: 0, height: 0, ratio: 2 })

    el.clientWidth = 300
    el.clientHeight = 150
    fire()
    expect(el.width).toBe(600)
    expect(sizes.at(-1)).toEqual({ width: 300, height: 150, ratio: 2 })

    stop()
    expect(disconnected).toBe(true)
    Object.defineProperty(globalThis, 'ResizeObserver', {
      value: previous.ro,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'window', { value: previous.win, configurable: true })
  })
})
