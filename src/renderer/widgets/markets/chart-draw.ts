import type { CandlePoint, ChartRange } from '@shared/markets'

/**
 * Drawing shared by the market board's two charts. Both place their points by
 * index, evenly, so the nights and weekends between sessions take no space;
 * dividers mark where the day (or week, month, year) changed instead.
 */

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

export interface ScaleBounds {
  lo: number
  hi: number
  /** Where the base is: on the chart, or too far above or below it to be drawn. */
  base: 'on' | 'above' | 'below' | 'none'
}

/**
 * The prices a chart spans: its data, and the base it is measured from when that
 * is near enough. Over a long range the base can be far from anything the chart
 * shows (5Y, after a run), and stretching the scale to reach it would press the
 * whole line flat against one edge; further than the data's own height away, it
 * is left out and an arrow at the edge says which way it lies.
 */
export function scaleBounds(lo: number, hi: number, baseline: number | null): ScaleBounds {
  if (baseline === null || !Number.isFinite(baseline)) return { lo, hi, base: 'none' }
  if (!Number.isFinite(lo) || !Number.isFinite(hi))
    return { lo: baseline, hi: baseline, base: 'on' }
  const span = hi - lo
  if (baseline > hi + span) return { lo, hi, base: 'above' }
  if (baseline < lo - span) return { lo, hi, base: 'below' }
  return { lo: Math.min(lo, baseline), hi: Math.max(hi, baseline), base: 'on' }
}

/** A base off the chart: a small arrow in the left corner, pointing to where it lies. */
export function drawBaseArrow(
  ctx: CanvasRenderingContext2D,
  side: 'above' | 'below',
  height: number,
  color: string,
): void {
  const tip = side === 'above' ? 1 : height - 1
  const back = side === 'above' ? 6 : height - 6
  ctx.fillStyle = color
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.moveTo(4.5, tip)
  ctx.lineTo(8, back)
  ctx.lineTo(1, back)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
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
  const share = Math.floor(slot * 0.7)
  // Odd, so it sits evenly on the wick. A four-pixel slot's share is two, which would
  // round down to a body no wider than the wick: three still leaves a pixel between bars.
  const body = Math.max(slot >= 4 ? 3 : 1, share - (share % 2 === 0 ? 1 : 0))
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

/**
 * Round prices between `lo` and `hi` for a price axis, about `target` of them,
 * a 1-2-5 step apart.
 */
export function niceTicks(lo: number, hi: number, target: number): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || target < 1) return []
  const rough = (hi - lo) / target
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 5].find((m) => m * power >= rough) ?? 10) * power
  const out: number[] = []
  // Counted in whole steps, so the sum's rounding error never drops the last tick.
  const last = Math.floor(hi / step + 1e-9)
  for (let n = Math.ceil(lo / step - 1e-9); n <= last; n++)
    out.push(Number((n * step).toPrecision(12)))
  return out
}

export interface TimeTick {
  /** The bar the label belongs to: the first of its hour, day, month or year. */
  index: number
  text: string
}

/** What the time axis counts in, per range: finer than the dividers only for 1D, which has none. */
const TICK_UNITS: Readonly<Record<ChartRange, 'hour' | 'day' | 'month' | 'year'>> = {
  '1d': 'hour',
  '5d': 'day',
  '1mo': 'day',
  '6mo': 'month',
  '1y': 'month',
  '5y': 'year',
}

const TICK_FORMATS: Readonly<
  Record<'hour' | 'day' | 'month' | 'year', Intl.DateTimeFormatOptions>
> = {
  hour: { hour: '2-digit', minute: '2-digit', hour12: false },
  day: { month: 'numeric', day: 'numeric' },
  month: { year: '2-digit', month: 'numeric' },
  year: { year: 'numeric' },
}

function tickUnit(t: number, unit: 'hour' | 'day' | 'month' | 'year'): number {
  const d = new Date(t)
  const day = d.getFullYear() * 10_000 + d.getMonth() * 100 + d.getDate()
  if (unit === 'hour') return day * 100 + d.getHours()
  if (unit === 'day') return day
  return unit === 'month' ? d.getFullYear() * 12 + d.getMonth() : d.getFullYear()
}

/**
 * The labels under a chart whose bars sit in even slots: one where the hour (1D),
 * day, month or year changes in local time, leaving out any that would start
 * within `minGap` pixels of the one before.
 */
export function timeTicks(
  candles: readonly { t: number }[],
  range: ChartRange,
  slot: number,
  minGap: number,
  locale?: string,
): TimeTick[] {
  const unit = TICK_UNITS[range]
  const format = new Intl.DateTimeFormat(locale, TICK_FORMATS[unit])
  const out: TimeTick[] = []
  let lastX = Number.NEGATIVE_INFINITY
  for (let i = 1; i < candles.length; i++) {
    const t = (candles[i] as { t: number }).t
    if (tickUnit((candles[i - 1] as { t: number }).t, unit) === tickUnit(t, unit)) continue
    if (i * slot - lastX < minGap) continue
    out.push({ index: i, text: format.format(t) })
    lastX = i * slot
  }
  return out
}

/** The base where the scale put it: the dashed line across the chart, or the arrow towards it. */
export function drawBase(
  ctx: CanvasRenderingContext2D,
  bounds: ScaleBounds,
  baseline: number | null,
  y: (value: number) => number,
  width: number,
  height: number,
  color: string,
): void {
  if (baseline === null || bounds.base === 'none') return
  if (bounds.base === 'on') drawBaseline(ctx, y(baseline), width, color)
  else drawBaseArrow(ctx, bounds.base, height, color)
}
