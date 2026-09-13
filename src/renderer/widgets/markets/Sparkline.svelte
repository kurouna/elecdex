<script lang="ts">
import type { PricePoint } from '@shared/markets'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * One symbol's session as a line with a fading fill, and the previous close as a
 * dashed baseline, coloured by whether the price is above or below it.
 *
 * Drawn only when the data, the size or the theme changes - at most once a
 * minute in normal use - never on an animation loop.
 */
interface Props {
  points: PricePoint[]
  baseline: number | null
  up: boolean
}

const { points, baseline, up }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })

$effect(() => {
  const el = canvas
  if (el === null) return
  const observer = new ResizeObserver(() => {
    const ratio = window.devicePixelRatio || 1
    el.width = Math.max(1, Math.round(el.clientWidth * ratio))
    el.height = Math.max(1, Math.round(el.clientHeight * ratio))
    size = { width: el.clientWidth, height: el.clientHeight, ratio }
  })
  observer.observe(el)
  return () => observer.disconnect()
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
  if (baseline !== null) values.push(baseline)
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi === lo) {
    hi += 1
    lo -= 1
  }
  const pad = (hi - lo) * 0.12
  lo -= pad
  hi += pad
  const t0 = points[0]?.t ?? 0
  const t1 = points.at(-1)?.t ?? 1
  const x = (t: number) => ((t - t0) / Math.max(1, t1 - t0)) * (width - 2) + 1
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height

  if (baseline !== null) {
    ctx.strokeStyle = muted
    ctx.globalAlpha = 0.6
    ctx.setLineDash([2, 3])
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, Math.round(y(baseline)) + 0.5)
    ctx.lineTo(width, Math.round(y(baseline)) + 0.5)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  ctx.beginPath()
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(x(p.t), y(p.v))
    else ctx.lineTo(x(p.t), y(p.v))
  })
  const line = new Path2D()
  points.forEach((p, i) => {
    if (i === 0) line.moveTo(x(p.t), y(p.v))
    else line.lineTo(x(p.t), y(p.v))
  })

  // Fill under the line, fading toward the bottom.
  const fill = new Path2D(line)
  fill.lineTo(x(t1), height)
  fill.lineTo(x(t0), height)
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
  const last = points.at(-1)
  if (last) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x(last.t), y(last.v), 2.2, 0, Math.PI * 2)
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
