<script lang="ts">
import {
  type CandlePoint,
  type ChartRange,
  dividerIndices,
  formatPrice,
  isIntraday,
  mergeCandles,
  rangeSpec,
} from '@shared/markets'
import { observeCanvas } from '../../lib/canvas.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  barsFor,
  drawBaseline,
  drawCandles,
  drawDividers,
  niceTicks,
  timeTicks,
  valueScale,
} from './chart-draw.ts'

/**
 * One symbol's range over the whole pane, as a line or as candles: the board's
 * charts with what their size leaves no room for - a price axis with the latest
 * price marked on it, the time along the bottom, and a readout of the bar under
 * the pointer.
 *
 * Bars sit in even slots as on the board, so nights and weekends take no room.
 * The crosshair and the readout are elements over the canvas, so moving the
 * pointer redraws nothing. Drawn only when the data, the size or the theme
 * changes, never on an animation loop.
 */
interface Props {
  candles: CandlePoint[]
  baseline: number | null
  range: ChartRange
  view: 'line' | 'candles'
  up: boolean
}

const { candles, baseline, range, view, up }: Props = $props()

/** Between the plot and the axis labels, in pixels. */
const AXIS_GAP = 6
/** Price labels are about this far apart. */
const TICK_SPACING = 44
/** Time labels no closer than this. */
const LABEL_SPACING = 56

let canvas = $state<HTMLCanvasElement | null>(null)
let upProbe = $state<HTMLElement | null>(null)
let downProbe = $state<HTMLElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })
let fontPx = $state(10)
let hover = $state<number | null>(null)

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    fontPx = Number.parseFloat(getComputedStyle(el).fontSize) || 10
    size = next
  })
})

/** Where everything goes: the plot's box, the bars shown in it and the prices it spans. */
const frame = $derived.by(() => {
  let lo = baseline ?? Number.POSITIVE_INFINITY
  let hi = baseline ?? Number.NEGATIVE_INFINITY
  for (const bar of candles) {
    lo = Math.min(lo, view === 'candles' ? bar.l : bar.c)
    hi = Math.max(hi, view === 'candles' ? bar.h : bar.c)
  }
  // The font is monospaced: the widest label is the longest one.
  const chars = Math.max(formatPrice(lo).length, formatPrice(hi).length, 4)
  const axis = Math.ceil(chars * fontPx * 0.62) + AXIS_GAP + 4
  const plotW = Math.max(1, size.width - axis)
  const plotH = Math.max(1, size.height - Math.ceil(fontPx * 1.6))
  const shown = view === 'candles' ? mergeCandles(candles, barsFor(plotW)) : candles
  return { lo, hi, axis, plotW, plotH, shown, slot: plotW / Math.max(1, shown.length) }
})

const hovered = $derived(hover === null ? null : (frame.shown[hover] ?? null))

function when(t: number): string {
  const options: Intl.DateTimeFormatOptions = isIntraday(rangeSpec(range))
    ? { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }
    : { year: 'numeric', month: 'numeric', day: 'numeric' }
  return new Date(t).toLocaleString(navigator.language, options)
}

function point(event: PointerEvent): void {
  const el = canvas
  if (el === null || frame.shown.length === 0) return
  const x = event.clientX - el.getBoundingClientRect().left
  const next =
    x < 0 || x > frame.plotW ? null : Math.min(frame.shown.length - 1, Math.floor(x / frame.slot))
  if (next !== hover) hover = next
}

interface Palette {
  series: string
  up: string
  down: string
  muted: string
  ground: string
}

function drawAxes(ctx: CanvasRenderingContext2D, y: (v: number) => number, palette: Palette): void {
  const { lo, hi, plotW, plotH, shown, slot } = frame
  ctx.font = `${fontPx}px ${getComputedStyle(ctx.canvas).fontFamily}`
  ctx.fillStyle = palette.muted
  ctx.strokeStyle = palette.muted
  ctx.lineWidth = 1
  ctx.textBaseline = 'middle'
  for (const tick of niceTicks(lo, hi, Math.max(2, Math.floor(plotH / TICK_SPACING)))) {
    const at = Math.round(y(tick)) + 0.5
    ctx.globalAlpha = 0.18
    ctx.beginPath()
    ctx.moveTo(0, at)
    ctx.lineTo(plotW, at)
    ctx.stroke()
    ctx.globalAlpha = 1
    // The latest price's tag is drawn over the axis: a label under it would show round its edges.
    if (Math.abs(at - tagY(y)) > fontPx * 1.5) ctx.fillText(formatPrice(tick), plotW + AXIS_GAP, at)
  }
  ctx.textBaseline = 'top'
  for (const tick of timeTicks(shown, range, slot, LABEL_SPACING, navigator.language)) {
    const width = ctx.measureText(tick.text).width
    // The last label stays inside the plot rather than running under the price axis.
    ctx.fillText(tick.text, Math.min(tick.index * slot + 2, plotW - width), plotH + 3)
  }
}

function drawLine(ctx: CanvasRenderingContext2D, y: (v: number) => number, color: string): void {
  const { plotH, shown, slot } = frame
  const x = (i: number) => i * slot + slot / 2
  const last = shown.length - 1
  const line = new Path2D()
  shown.forEach((bar, i) => {
    if (i === 0) line.moveTo(x(i), y(bar.c))
    else line.lineTo(x(i), y(bar.c))
  })
  const fill = new Path2D(line)
  fill.lineTo(x(last), plotH)
  fill.lineTo(x(0), plotH)
  fill.closePath()
  const gradient = ctx.createLinearGradient(0, 0, 0, plotH)
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
}

/** Where the latest price's tag sits: at its price, kept whole inside the plot. */
function tagY(y: (v: number) => number): number {
  const last = frame.shown.at(-1)
  const half = Math.ceil(fontPx * 0.75)
  return Math.min(frame.plotH - half, Math.max(half, Math.round(y(last?.c ?? 0))))
}

/** The latest price, as a tag on the axis in the series' colour. */
function drawLast(ctx: CanvasRenderingContext2D, y: (v: number) => number, palette: Palette): void {
  const { axis, plotW } = frame
  const last = frame.shown.at(-1)
  if (last === undefined) return
  const half = Math.ceil(fontPx * 0.75)
  const at = tagY(y)
  ctx.fillStyle = palette.series
  ctx.fillRect(plotW + 1, at - half, axis - 1, half * 2)
  ctx.fillStyle = palette.ground
  ctx.textBaseline = 'middle'
  ctx.fillText(formatPrice(last.c), plotW + AXIS_GAP, at + 0.5)
}

$effect(() => {
  void appearance.revision
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || upProbe === null || downProbe === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  const { lo, hi, plotW, plotH, shown, slot } = frame
  if (shown.length === 0) return

  // --up and --down are color-mix() expressions: the probes resolve them to rgb().
  const style = getComputedStyle(el)
  const rising = getComputedStyle(upProbe).color || '#6c6'
  const falling = getComputedStyle(downProbe).color || '#c66'
  const palette: Palette = {
    series: up ? rising : falling,
    up: rising,
    down: falling,
    muted: style.getPropertyValue('--text-muted').trim() || '#888',
    ground: style.getPropertyValue('--app-bg').trim() || '#000',
  }
  const y = valueScale(lo, hi, plotH, 0.06)

  drawAxes(ctx, y, palette)
  drawDividers(
    ctx,
    dividerIndices(shown, range).map((i) => i * slot),
    plotH,
    palette.muted,
  )
  if (baseline !== null) drawBaseline(ctx, y(baseline), plotW, palette.muted)
  if (view === 'candles') drawCandles(ctx, shown, slot, y, palette)
  else drawLine(ctx, y, palette.series)
  drawLast(ctx, y, palette)
})
</script>

<div
  class="detail-chart"
  role="img"
  aria-label="price chart"
  onpointermove={point}
  onpointerleave={() => (hover = null)}
>
  <canvas
    bind:this={canvas}
    data-testid="market-detail-chart"
    data-view={view}
    data-bars={frame.shown.length}
  ></canvas>
  {#if hovered !== null && hover !== null}
    <i
      class="cross"
      style:left={`${Math.floor(hover * frame.slot + frame.slot / 2)}px`}
      style:height={`${frame.plotH}px`}
    ></i>
    <span class="readout" data-testid="market-detail-readout">
      <b>{when(hovered.t)}</b>
      {#if view === 'candles'}
        <span>O {formatPrice(hovered.o)}</span>
        <span>H {formatPrice(hovered.h)}</span>
        <span>L {formatPrice(hovered.l)}</span>
        <span>C {formatPrice(hovered.c)}</span>
      {:else}
        <span>{formatPrice(hovered.c)}</span>
      {/if}
    </span>
  {/if}
  <i class="probe up" bind:this={upProbe}></i>
  <i class="probe down" bind:this={downProbe}></i>
</div>

<style>
.detail-chart {
  position: absolute;
  inset: 0;
  cursor: crosshair;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  font-family: var(--font-mono);
  font-size: var(--step--2);
}

.cross {
  position: absolute;
  top: 0;
  width: 1px;
  background: var(--text-muted);
  opacity: 0.7;
  pointer-events: none;
}

/* Over the plot's top-left corner, on the ground colour so the line behind it
   cannot run through the figures. */
.readout {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-2);
  padding: 0 var(--space-1);
  background: color-mix(in srgb, var(--app-bg) 82%, transparent);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text);
  pointer-events: none;
}

.readout b {
  font-weight: 400;
  color: var(--text-muted);
}

.probe {
  display: none;
}

.probe.up {
  color: var(--up, var(--ok));
}

.probe.down {
  color: var(--down, var(--danger));
}
</style>
