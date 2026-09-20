<script lang="ts">
import type { PricePoint } from '@shared/markets'
import { observeCanvas } from '../../lib/canvas.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import { drawBase, drawDividers, scaleBounds, valueScale } from './chart-draw.ts'

/**
 * One symbol's range as a line with a fading fill, and the range's base (the
 * previous close for 1D) as a dashed baseline, coloured by whether the price is
 * above or below it. A base too far off to share the scale is left out of it
 * (scaleBounds), with an arrow towards it.
 *
 * Points are spaced evenly by index, not by time, so the nights and weekends of
 * a multi-day range take no room; `dividers` (point indices) mark where the day
 * or month changed.
 *
 * Drawn only when the data, the size or the theme changes - at most once a
 * minute in normal use - never on an animation loop.
 */
interface Props {
  points: PricePoint[]
  baseline: number | null
  up: boolean
  dividers?: number[]
}

const { points, baseline, up, dividers = [] }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    size = next
  })
})

$effect(() => {
  void appearance.revision
  // Redraw when the direction flips: the colour comes from the class it sets.
  void up
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  if (points.length < 2) return

  const style = getComputedStyle(el)
  // The canvas's own CSS colour, resolved to rgb(): the board's --up / --down.
  const color = style.color || '#6c6'
  const muted = style.getPropertyValue('--text-muted').trim() || '#888'

  const values = points.map((p) => p.v)
  const bounds = scaleBounds(Math.min(...values), Math.max(...values), baseline)
  // A row is short: a thin margin, so the line has the height there is.
  const y = valueScale(bounds.lo, bounds.hi, height, 0.08)
  const last = points.length - 1
  const x = (i: number) => (i / last) * (width - 2) + 1

  drawDividers(
    ctx,
    dividers.filter((i) => i > 0 && i <= last).map((i) => (x(i - 1) + x(i)) / 2),
    height,
    muted,
  )
  drawBase(ctx, bounds, baseline, y, width, height, muted)

  const line = new Path2D()
  points.forEach((p, i) => {
    if (i === 0) line.moveTo(x(i), y(p.v))
    else line.lineTo(x(i), y(p.v))
  })

  // Fill under the line, fading toward the bottom.
  const fill = new Path2D(line)
  fill.lineTo(x(last), height)
  fill.lineTo(x(0), height)
  fill.closePath()
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.22
  ctx.fillStyle = gradient
  ctx.fill(fill)
  ctx.globalAlpha = 1

  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.stroke(line)

  // The latest price, as a dot at the end.
  const end = points[last]
  if (end) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x(last), y(end.v), 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
})
</script>

<canvas bind:this={canvas} class="spark" class:up class:down={!up} data-testid="market-spark" data-points={points.length}></canvas>

<style>
.spark {
  display: block;
  color: var(--ok);
  width: 100%;
  height: 100%;
}

.spark.up {
  color: var(--up, var(--ok));
}

.spark.down {
  color: var(--down, var(--danger));
}
</style>
