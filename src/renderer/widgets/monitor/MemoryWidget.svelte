<script lang="ts">
import { formatBytes, stableShuffle } from '../../lib/format.ts'
import { metrics } from '../../stores/metrics.svelte.ts'
import { paneMeta } from '../../stores/pane-meta.svelte.ts'
import type { WidgetProps } from '../registry.ts'

/**
 * eDEX-UI's memory module: a 40x11 field of dots lit in a scattered order -
 * bright for memory in use, dim for reclaimable cache, faint for free - above a
 * swap bar.
 *
 * The original built the field from 440 <div>s and restyled them every 1.5s.
 * Here it is one canvas, redrawn only when the number of lit dots changes.
 */
const { paneId }: WidgetProps = $props()

const COLUMNS = 40
const ROWS = 11
const POINTS = COLUMNS * ROWS
const order = stableShuffle(POINTS)

const usage = $derived(metrics.get('mem.usage'))
const swap = $derived(metrics.get('mem.swap'))

const levels = $derived.by(() => {
  if (usage === null || usage.total <= 0) return { used: 0, cached: 0 }
  const used = Math.round((POINTS * usage.used) / usage.total)
  // Reclaimable cache, where the OS distinguishes it from free memory.
  const cachedBytes = swap ? Math.max(0, swap.available - usage.free) : 0
  const cached = Math.min(POINTS - used, Math.round((POINTS * cachedBytes) / usage.total))
  return { used, cached }
})

const GIB = 1024 ** 3

// "USING 3.4 OUT OF 7.7 GIB", as in the original's title row.
$effect(() => {
  paneMeta.set(paneId, {
    subtitle: usage
      ? `USING ${(usage.used / GIB).toFixed(1)} OUT OF ${(usage.total / GIB).toFixed(1)} GIB`
      : '',
  })
})

// Primitive deriveds: they only notify when the number itself changes, which is
// what lets the draw effect below skip samples that light no new dot.
const usedDots = $derived(levels.used)
const cachedDots = $derived(levels.cached)

let canvas = $state<HTMLCanvasElement | null>(null)
/** Canvas size in CSS pixels, updated only when the element actually resizes. */
let size = $state({ width: 0, height: 0, ratio: 1 })

// Sizing. Assigning canvas.width reallocates its backing store, so it happens
// on resize only - never per sample.
$effect(() => {
  const el = canvas
  if (el === null) return
  const observer = new ResizeObserver(() => {
    const ratio = window.devicePixelRatio || 1
    const width = el.clientWidth
    const height = el.clientHeight
    el.width = Math.max(1, Math.round(width * ratio))
    el.height = Math.max(1, Math.round(height * ratio))
    size = { width, height, ratio }
  })
  observer.observe(el)
  return () => observer.disconnect()
})

// Drawing. Re-runs when the lit counts or the size change, not on every sample:
// memory usage moving by less than one dot's worth redraws nothing.
$effect(() => {
  const el = canvas
  const used = usedDots
  const cached = cachedDots
  const { width, height, ratio } = size
  if (el === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const cellW = width / COLUMNS
  const cellH = height / ROWS
  const dot = Math.max(1.2, Math.min(cellW, cellH) * 0.34)

  ctx.fillStyle = getComputedStyle(el).getPropertyValue('--accent').trim() || '#aacfd1'
  for (let rank = 0; rank < POINTS; rank++) {
    const index = order[rank] ?? rank
    ctx.globalAlpha = rank < used ? 1 : rank < used + cached ? 0.3 : 0.1
    // Column-major, like the original grid-auto-flow: column.
    const col = Math.floor(index / ROWS)
    const row = index % ROWS
    ctx.fillRect(col * cellW + (cellW - dot) / 2, row * cellH + (cellH - dot) / 2, dot, dot)
  }
  ctx.globalAlpha = 1
})

const swapFraction = $derived(swap && swap.total > 0 ? swap.used / swap.total : 0)
</script>

<div class="memory" data-testid="memory">
  <canvas bind:this={canvas} class="dots" data-testid="memory-dots" data-used={levels.used}></canvas>
  <div class="swap">
    <span class="label">swap</span>
    <span class="bar"><span class="fill" style="width: {swapFraction * 100}%"></span></span>
    <span class="amount">{swap ? formatBytes(swap.used) : '--'}</span>
  </div>
</div>

<style>
.memory {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  height: 100%;
  min-height: 0;
  padding: var(--space-1) var(--space-1) 0;
}

.dots {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.swap {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--step--1);
}

.label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.amount {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* The original's two-part bar: a thin track and a thicker value, with an end cap. */
.bar {
  position: relative;
  height: 0.4rem;
  border-right: 1px solid var(--panel-border);
}

.bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--accent-dim);
}

.fill {
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  background: var(--accent);
  transition: width var(--dur-panel) var(--ease-out);
}
</style>
