<script lang="ts">
import { onFrame } from '../../lib/frame-loop.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import type { ChartSeries } from './chart-types.ts'

/**
 * A scrolling line chart in the manner of eDEX-UI's smoothie charts, drawn on a
 * canvas from the shared frame loop.
 *
 * The x axis is wall-clock time, so the line glides left between samples rather
 * than jumping once a second. Drawing is skipped when the canvas has no size (a
 * hidden tab) and when less than a pixel of time has passed since the last frame.
 */
interface Props {
  series: readonly ChartSeries[]
  /** Visible time span. */
  windowMs?: number
  /**
   * How far behind "now" the right edge sits. One sample interval keeps the
   * newest segment from visibly growing into the edge.
   */
  delayMs?: number
  /** Fixed range; when omitted the range follows the data with some headroom. */
  min?: number
  max?: number
  /** Horizontal grid divisions. */
  divisions?: number
  /** Print the current range at the right edge, like smoothie's labels. */
  labels?: boolean
  /** Formats a range label. */
  label?: (value: number) => string
  /** Draw a solid axis at zero, for charts whose range spans it. */
  zeroLine?: boolean
}

const {
  series,
  windowMs = 60_000,
  delayMs = 1000,
  min,
  max,
  divisions = 3,
  labels = false,
  label = (v: number) => v.toFixed(2),
  zeroLine = false,
}: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)

interface Colors {
  line: string
  dim: string
  grid: string
  label: string
  font: string
  /** Label size in CSS pixels: a fraction of the viewport-scaled root size. */
  labelSize: number
}

/** Everything a draw pass needs about the canvas and the time axis. */
interface Frame {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  now: number
  msPerPixel: number
  colors: Colors
}

$effect(() => {
  // Colours are read into the closure below; a theme switch rebuilds it.
  void appearance.revision
  const el = canvas
  if (el === null) return
  const ctx = el.getContext('2d')
  if (ctx === null) return

  let width = 0
  let height = 0
  let ratio = 1
  let colors = readColors(el)
  let lastPixelClock = Number.NaN

  const resize = (): void => {
    ratio = window.devicePixelRatio || 1
    width = el.clientWidth
    height = el.clientHeight
    el.width = Math.max(1, Math.round(width * ratio))
    el.height = Math.max(1, Math.round(height * ratio))
    colors = readColors(el)
    lastPixelClock = Number.NaN
  }

  const observer = new ResizeObserver(resize)
  observer.observe(el)
  resize()

  const draw = (): void => {
    if (width <= 0 || height <= 0) return

    const now = Date.now() - delayMs
    const msPerPixel = windowMs / width
    const pixelClock = Math.floor(now / msPerPixel)
    if (pixelClock === lastPixelClock) return
    lastPixelClock = pixelClock

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const frame: Frame = { ctx, width, height, now, msPerPixel, colors }
    const range = computeRange(series, min, max)
    drawGrid(frame, divisions, windowMs)
    if (zeroLine) drawZero(frame, range)
    for (const s of series) drawSeries(frame, s, range)
    if (labels) drawLabels(frame, label(range.max), label(range.min))
  }

  const stop = onFrame(draw)

  return () => {
    stop()
    observer.disconnect()
  }
})

/** Dashed horizontals, and time verticals at a sixth of the window. */
function drawGrid(f: Frame, parts: number, windowMs: number): void {
  const { ctx, width, height, now, msPerPixel } = f
  ctx.lineWidth = 1
  ctx.strokeStyle = f.colors.grid
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  for (let i = 1; i < parts; i++) {
    const y = Math.round((height * i) / parts) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  const step = windowMs / 6
  for (let t = now - (now % step); t > now - windowMs; t -= step) {
    const x = Math.round(width - (now - t) / msPerPixel) + 0.5
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  ctx.stroke()
  ctx.setLineDash([])
}

function drawSeries(f: Frame, s: ChartSeries, range: { min: number; max: number }): void {
  const { ctx, width, height, now, msPerPixel } = f
  if (s.points.length < 2) return

  const span = range.max - range.min || 1
  const inverted = s.inverted === true

  ctx.strokeStyle = s.tone === 'dim' ? f.colors.dim : f.colors.line
  ctx.lineWidth = 1.25
  ctx.lineJoin = 'round'
  ctx.beginPath()

  let started = false
  for (const p of s.points) {
    const x = width - (now - p.at) / msPerPixel
    if (x < -2) continue
    const v = inverted ? -p.v : p.v
    const y = height - ((v - range.min) / span) * height
    if (started) {
      ctx.lineTo(x, y)
    } else {
      ctx.moveTo(x, y)
      started = true
    }
  }
  ctx.stroke()
}

function drawZero(f: Frame, range: { min: number; max: number }): void {
  if (range.min >= 0 || range.max <= 0) return
  const { ctx, width, height } = f
  const y = Math.round(height - ((0 - range.min) / (range.max - range.min)) * height) + 0.5
  ctx.strokeStyle = f.colors.grid
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(width, y)
  ctx.stroke()
}

function drawLabels(f: Frame, top: string, bottom: string): void {
  const { ctx, width, height } = f
  ctx.fillStyle = f.colors.label
  ctx.font = `${f.colors.labelSize}px ${f.colors.font}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(top, width - 2, 2)
  ctx.textBaseline = 'bottom'
  ctx.fillText(bottom, width - 2, height - 2)
}

/** The data's extent across every series, or null when there is none. */
function extent(all: readonly ChartSeries[]): { lo: number; hi: number } | null {
  let lo = Number.POSITIVE_INFINITY
  let hi = Number.NEGATIVE_INFINITY
  for (const s of all) {
    const sign = s.inverted ? -1 : 1
    for (const p of s.points) {
      lo = Math.min(lo, sign * p.v)
      hi = Math.max(hi, sign * p.v)
    }
  }
  return Number.isFinite(lo) && Number.isFinite(hi) ? { lo, hi } : null
}

function computeRange(
  all: readonly ChartSeries[],
  fixedMin: number | undefined,
  fixedMax: number | undefined,
): { min: number; max: number } {
  if (fixedMin !== undefined && fixedMax !== undefined) return { min: fixedMin, max: fixedMax }
  const e = extent(all)
  if (e === null) return { min: fixedMin ?? 0, max: fixedMax ?? 1 }
  const headroom = (e.hi - e.lo) * 0.15 || Math.abs(e.hi) * 0.15 || 1
  return {
    min: fixedMin ?? Math.max(0, e.lo - headroom),
    max: fixedMax ?? e.hi + headroom,
  }
}

function readColors(el: Element): Colors {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback
  return {
    line: read('--accent', '#aacfd1'),
    dim: read('--text-muted', 'rgba(170,207,209,0.5)'),
    grid: read('--panel-rule', 'rgba(170,207,209,0.3)'),
    label: read('--text-muted', 'rgba(170,207,209,0.5)'),
    font: read('--font-mono', 'monospace'),
    labelSize: Math.max(
      8,
      Math.round(Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.6),
    ),
  }
}
</script>


<canvas bind:this={canvas} class="chart" data-testid="stream-chart"></canvas>

<style>
.chart {
  display: block;
  width: 100%;
  height: 100%;
  border-top: var(--rule-width) dashed var(--panel-rule);
  border-bottom: var(--rule-width) dashed var(--panel-rule);
}
</style>
