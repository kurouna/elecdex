<script lang="ts">
import { type CandlePoint, type ChartRange, dividerIndices, mergeCandles } from '@shared/markets'
import { appearance } from '../../stores/appearance.svelte.ts'
import {
  barsFor,
  drawBaseline,
  drawCandles,
  drawDividers,
  observeCanvas,
  valueScale,
} from './chart-draw.ts'

/**
 * One symbol's range as candles in even slots, with the range's base (the
 * previous close for 1D) as a dashed baseline. When the pane is too narrow for
 * every bar, neighbours are merged - never dropped - so each high and low still
 * shows.
 *
 * Rising and falling bars take the board's --up and --down. Those are
 * color-mix() expressions a canvas cannot read from a custom property, so two
 * hidden probes resolve them to rgb() through their computed `color`.
 *
 * Drawn only when the data, the size or the theme changes, never on an
 * animation loop.
 */
interface Props {
  candles: CandlePoint[]
  baseline: number | null
  range: ChartRange
}

const { candles, baseline, range }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let upProbe = $state<HTMLElement | null>(null)
let downProbe = $state<HTMLElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })

const shown = $derived(mergeCandles(candles, barsFor(size.width)))

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    size = next
  })
})

$effect(() => {
  void appearance.revision
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || upProbe === null || downProbe === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  if (shown.length === 0) return

  const muted = getComputedStyle(el).getPropertyValue('--text-muted').trim() || '#888'
  const colors = {
    up: getComputedStyle(upProbe).color || '#6c6',
    down: getComputedStyle(downProbe).color || '#c66',
  }

  let lo = baseline ?? Number.POSITIVE_INFINITY
  let hi = baseline ?? Number.NEGATIVE_INFINITY
  for (const bar of shown) {
    if (bar.l < lo) lo = bar.l
    if (bar.h > hi) hi = bar.h
  }
  const y = valueScale(lo, hi, height, 0.08)
  const slot = width / shown.length

  drawDividers(
    ctx,
    dividerIndices(shown, range).map((i) => i * slot),
    height,
    muted,
  )
  if (baseline !== null) drawBaseline(ctx, y(baseline), width, muted)
  drawCandles(ctx, shown, slot, y, colors)
})
</script>

<canvas
  bind:this={canvas}
  class="candles"
  data-testid="market-candles"
  data-bars={shown.length}
></canvas>
<i class="probe up" bind:this={upProbe}></i>
<i class="probe down" bind:this={downProbe}></i>

<style>
.candles {
  display: block;
  width: 100%;
  height: 100%;
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
