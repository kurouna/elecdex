import type { CandlePoint } from '@shared/markets'

/**
 * Drawing shared by the market board's two charts. Both place their points by
 * index, evenly, so the nights and weekends between sessions take no space;
 * dividers mark where the day (or week, month, year) changed instead.
 */

export interface CanvasSize {
  width: number
  height: number
  ratio: number
}

/**
 * Keeps a canvas's backing store at its CSS size times the pixel ratio, and
 * reports each new size. Returns the disconnect.
 */
export function observeCanvas(
  el: HTMLCanvasElement,
  onSize: (size: CanvasSize) => void,
): () => void {
  const observer = new ResizeObserver(() => {
    const ratio = window.devicePixelRatio || 1
    el.width = Math.max(1, Math.round(el.clientWidth * ratio))
    el.height = Math.max(1, Math.round(el.clientHeight * ratio))
    onSize({ width: el.clientWidth, height: el.clientHeight, ratio })
  })
  observer.observe(el)
  return () => observer.disconnect()
}

/** A vertical mapping from value to y, padded so the extremes do not touch the edges. */
export function valueScale(
  lo: number,
  hi: number,
  height: number,
  pad = 0.12,
): (value: number) => number {
  // A range that is reversed, or that a missing quote left as NaN or Infinity, must
  // still give a usable scale: without this every point would land off the chart, or
  // the whole chart would be blank, rather than the bad bar alone being wrong.
  let low = Number.isFinite(lo) ? lo : 0
  let high = Number.isFinite(hi) ? hi : 0
  if (high < low) [low, high] = [high, low]
  if (high === low) {
    high += 1
    low -= 1
  }
  const margin = (high - low) * pad
  low -= margin
  high += margin
  return (value) => height - ((value - low) / (high - low)) * height
}

/** The previous close (or the range's base) as a dashed line across the chart. */
export function drawBaseline(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  color: string,
): void {
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.6
  ctx.setLineDash([2, 3])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, Math.round(y) + 0.5)
  ctx.lineTo(width, Math.round(y) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** Faint full-height lines at the given x positions. */
export function drawDividers(
  ctx: CanvasRenderingContext2D,
  xs: readonly number[],
  height: number,
  color: string,
): void {
  if (xs.length === 0) return
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 1
  ctx.beginPath()
  for (const x of xs) {
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, height)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** The narrowest slot a candle is drawn in: a one-pixel wick with a body either side. */
export const MIN_SLOT_PX = 3

/** The bars that fit a width: at most one per MIN_SLOT_PX pixels. */
export const barsFor = (width: number): number => Math.max(1, Math.floor(width / MIN_SLOT_PX))

export interface CandleColors {
  up: string
  down: string
}

/**
 * Candles in even slots: a one-pixel wick from high to low and a body from open
 * to close, in the rising colour when the bar closed at or above its open.
 */
export function drawCandles(
  ctx: CanvasRenderingContext2D,
  candles: readonly CandlePoint[],
  slot: number,
  y: (value: number) => number,
  colors: CandleColors,
): void {
  const body = Math.max(1, Math.floor(slot * 0.7) - (Math.floor(slot * 0.7) % 2 === 0 ? 1 : 0))
  candles.forEach((bar, i) => {
    const centre = Math.floor(i * slot + slot / 2)
    ctx.fillStyle = bar.c >= bar.o ? colors.up : colors.down
    const top = Math.round(y(bar.h))
    ctx.fillRect(centre, top, 1, Math.max(1, Math.round(y(bar.l)) - top))
    const open = y(bar.o)
    const close = y(bar.c)
    const bodyTop = Math.round(Math.min(open, close))
    const bodyHeight = Math.max(1, Math.round(Math.max(open, close)) - bodyTop)
    ctx.fillRect(centre - (body - 1) / 2, bodyTop, body, bodyHeight)
  })
}
