<script lang="ts">
import { BUCKET_MS, type LevelCounts } from '@shared/logwatch/rate'
import { untrack } from 'svelte'
import { observeCanvas } from '../../lib/canvas.ts'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * Five minutes of lines, five seconds a bar, stacked by level: errors at the foot in the
 * danger colour, warnings above them, the rest in the accent's shades (docs/logwatch.md §2).
 * Plain 2D canvas, drawn again once a second while seen (the window moves on), and on a theme.
 */
interface Props {
  buckets: readonly LevelCounts[]
}

const { buckets }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let size = $state({ width: 0, height: 0, ratio: 1 })

$effect(() => {
  const el = canvas
  if (el === null) return
  return observeCanvas(el, (next) => {
    size = next
  })
})

/** What the lanes show, as text: the canvas is drawn again only when it changes. */
const shown = $derived(buckets.map((b) => `${b.DBG},${b.INF},${b.WRN},${b.ERR}`).join('|'))

$effect(() => {
  void appearance.revision
  void shown
  const drawn = untrack(() => buckets)
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  const style = getComputedStyle(el)
  const colour = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback
  const fills = {
    ERR: colour('--lanes-err', '#e55'),
    WRN: colour('--lanes-warn', '#eb4'),
    INF: colour('--lanes-info', '#589'),
    DBG: colour('--lanes-debug', '#234'),
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  const tallest = Math.max(8, ...drawn.map((b) => b.DBG + b.INF + b.WRN + b.ERR))
  const pitch = width / Math.max(1, drawn.length)
  const bar = Math.max(1, pitch - Math.max(1, Math.min(3, pitch * 0.2)))
  drawn.forEach((counts, i) => {
    let y = height
    for (const group of ['ERR', 'WRN', 'INF', 'DBG'] as const) {
      const h = (counts[group] / tallest) * (height - 1)
      if (h <= 0) continue
      ctx.fillStyle = fills[group]
      ctx.fillRect(i * pitch, y - h, bar, h)
      y -= h
    }
  })
})
</script>

<div
  class="lanes"
  role="img"
  aria-label="lines of each level, the last five minutes"
  data-testid="logwatch-lanes"
>
  <canvas bind:this={canvas}></canvas>
  <span class="axis from">−{Math.round((buckets.length * BUCKET_MS) / 60_000)} min</span>
  <span class="axis to">now</span>
</div>

<style>
.lanes {
  position: relative;
  flex: none;
  height: 2.6rem;
  margin: 0 0 0.9rem;
  border-bottom: 1px solid var(--panel-rule);
  --lanes-err: var(--danger);
  --lanes-warn: var(--warn);
  --lanes-info: var(--accent-dim);
  --lanes-debug: var(--accent-faint);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.axis {
  position: absolute;
  top: calc(100% + 1px);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.from {
  left: 0;
}

.to {
  right: 0;
}
</style>
