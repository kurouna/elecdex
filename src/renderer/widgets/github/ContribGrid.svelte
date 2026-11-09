<script lang="ts">
import { appearance } from '../../stores/appearance.svelte.ts'
import { heatLevel, heatPad } from './github-view.ts'

/**
 * The contribution grid, GITHUB STATUS's own band (docs/github.md §5): 53 weeks by 7 days on one
 * 2D canvas, drawn like the pads of a circuit board in the accent's steps rather than GitHub's
 * green. Words (the months) are HTML over it, never drawn on the canvas. Redrawn only when the
 * days, the size or the theme change - nothing moves on its own.
 */
interface Props {
  days: readonly number[]
  /** 26 weeks in a narrow pane. */
  weeks: number
  /** The day under the pointer (its index in `days`), or null. */
  onday: (index: number | null, x: number) => void
}

const { days, weeks, onday }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let room = $state(0)
const GAP = 2

function observe(node: HTMLElement): () => void {
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box !== undefined) room = box.width
  })
  observer.observe(node)
  return () => observer.disconnect()
}

const cell = $derived(Math.max(3, Math.min((room - GAP * (weeks - 1)) / weeks, 7.5)))
const width = $derived(Math.round(cell * weeks + GAP * (weeks - 1)))
const height = $derived(Math.round(cell * 7 + GAP * 6))
const start = $derived(Math.max(0, days.length - weeks * 7))

const months = $derived.by(() => {
  const out: { left: number; name: string }[] = []
  const today = new Date()
  for (let w = 0; w < weeks; w++) {
    const day = new Date(today.getTime() - (weeks - 1 - w) * 7 * 86_400_000)
    if (day.getDate() <= 7)
      out.push({ left: w * (cell + GAP), name: day.toLocaleString('en', { month: 'short' }) })
  }
  return out
})

$effect(() => {
  void appearance.revision
  const target = canvas
  if (target === null || width <= 0) return
  const dpr = window.devicePixelRatio || 1
  target.width = Math.round(width * dpr)
  target.height = Math.round(height * dpr)
  const g = target.getContext('2d')
  if (g === null) return
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, width, height)
  const style = getComputedStyle(target)
  const accent = style.getPropertyValue('--accent').trim() || '#9fd'
  for (let i = 0; i < weeks * 7; i++) {
    const level = heatLevel(days[start + i] ?? 0)
    const pad = heatPad(level)
    const x = Math.floor(i / 7) * (cell + GAP)
    const y = (i % 7) * (cell + GAP)
    g.globalAlpha = pad.alpha
    g.fillStyle = accent
    // The busiest days glow like lit pads; drawn once, as the rest of the grid is.
    g.shadowColor = accent
    g.shadowBlur = pad.glow * cell * 0.45
    g.fillRect(x, y, cell, cell)
    g.shadowBlur = 0
    if (level === 4 && cell > 5) {
      // A lit pad: the busiest days get a bright core rather than only a solid square.
      g.globalAlpha = 1
      g.fillStyle = style.getPropertyValue('--accent-strong').trim() || accent
      g.fillRect(x + cell * 0.3, y + cell * 0.3, cell * 0.4, cell * 0.4)
    }
  }
  g.globalAlpha = 1
})

function onmove(event: PointerEvent): void {
  if (canvas === null) return
  const box = canvas.getBoundingClientRect()
  const week = Math.floor((event.clientX - box.left) / (cell + GAP))
  const day = Math.floor((event.clientY - box.top) / (cell + GAP))
  if (week < 0 || week >= weeks || day < 0 || day > 6) {
    onday(null, 0)
    return
  }
  onday(start + week * 7 + day, event.clientX)
}
</script>

<div class="grid" {@attach observe}>
  <div class="months" style:width="{width}px" aria-hidden="true">
    {#each months as month (month.left)}<span style:left="{month.left}px">{month.name}</span>{/each}
  </div>
  <canvas
    bind:this={canvas}
    style:width="{width}px"
    style:height="{height}px"
    onpointermove={onmove}
    onpointerleave={() => onday(null, 0)}
    aria-label="contributions over the last {weeks} weeks"
    data-testid="github-contrib-grid"
  ></canvas>
</div>

<style>
.grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.months {
  position: relative;
  height: 0.85rem;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-muted);
}

.months span {
  position: absolute;
  top: 0;
  padding-left: 0.2rem;
  border-left: 1px solid var(--panel-rule);
  line-height: 0.85rem;
}

canvas {
  display: block;
  cursor: crosshair;
}
</style>
