<script lang="ts">
import { observeCanvas } from '../../lib/canvas.ts'
import { appearance } from '../../stores/appearance.svelte.ts'
import type { Bar } from './bars.ts'

/**
 * A row of bars with a peak-hold line, the spectrum pane's vocabulary put to
 * other uses: stopwatch laps stacking up, and the spread of a column of numbers.
 *
 * The bar being measured now is the rightmost one and grows while it is watched,
 * which is what makes a running stopwatch read as an instrument rather than a
 * number. Everything is plain 2D canvas - no WebGL context to hand back when the
 * pane is moved.
 */

interface Props {
  bars: readonly Bar[]
  /** Draws the hold line across the tallest bar. */
  peak?: boolean
  testid?: string
  label?: string
}

const { bars, peak = true, testid, label }: Props = $props()

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
  const el = canvas
  const { width, height, ratio } = size
  if (el === null || width === 0 || height === 0) return
  const ctx = el.getContext('2d')
  if (ctx === null) return

  const style = getComputedStyle(el)
  const accent = style.getPropertyValue('--bars-accent').trim() || '#8cf'
  const faint = style.getPropertyValue('--bars-faint').trim() || '#234'
  const best = style.getPropertyValue('--bars-best').trim() || '#6c6'
  const worst = style.getPropertyValue('--bars-worst').trim() || '#c66'

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, width, height)
  if (bars.length === 0) return

  const pitch = width / bars.length
  // Two pixels is the floor: below it neighbouring bars merge into a block.
  const barWidth = Math.max(2, pitch - Math.max(1, Math.min(4, pitch * 0.25)))
  let tallest = 0

  bars.forEach((bar, i) => {
    const value = Math.max(0, Math.min(1, bar.value))
    tallest = Math.max(tallest, value)
    const h = Math.max(1, value * (height - 3))
    const x = i * pitch + (pitch - barWidth) / 2

    ctx.fillStyle =
      bar.mark === 'best'
        ? best
        : bar.mark === 'worst'
          ? worst
          : bar.mark === 'live'
            ? accent
            : accent
    // The bar being measured now is at full strength; the ones already taken sit back.
    ctx.globalAlpha = bar.mark === 'live' ? 1 : bar.mark === undefined ? 0.72 : 0.9
    ctx.fillRect(x, height - h, barWidth, h)
    ctx.globalAlpha = 1

    // A dim footing under every bar, so an empty lap still has a place on the row.
    ctx.fillStyle = faint
    ctx.fillRect(x, height - 1, barWidth, 1)
  })

  if (!peak || tallest <= 0) return
  const y = Math.max(0.5, height - tallest * (height - 3) - 1.5)
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.45
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(width, y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
})
</script>

<canvas
  bind:this={canvas}
  class="bars"
  data-testid={testid}
  data-bars={bars.length}
  aria-label={label}
  role={label ? 'img' : undefined}
></canvas>

<style>
.bars {
  display: block;
  width: 100%;
  height: 100%;
  --bars-accent: var(--accent);
  --bars-faint: var(--accent-faint);
  --bars-best: var(--ok);
  --bars-worst: var(--danger);
}
</style>
