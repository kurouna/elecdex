<script lang="ts">
import type { PulseBin } from '@shared/aws/types'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * ACCOUNT PULSE, AWS STATUS's own band (docs/aws.md §6): the last 24 hours in 96 quarters on one
 * 2D canvas. Writes are ticks, errors and refusals danger, console sign-ins info diamonds, an
 * alarm ringing a danger bar from when it began; the last quarter is drawn faint (CloudTrail is
 * about five minutes late, with no promise). Words are HTML. Redrawn only when the bins, the size
 * or the theme change.
 */
interface Props {
  bins: readonly PulseBin[]
  /** When each alarm now ringing began. */
  alarms: readonly number[]
  /** The quarter under the pointer (its index), or null. */
  onbin: (index: number | null, x: number) => void
}

const { bins, alarms, onbin }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let room = $state(0)
const HEIGHT = 34

function observe(node: HTMLElement): () => void {
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box !== undefined) room = Math.floor(box.width)
  })
  observer.observe(node)
  return () => observer.disconnect()
}

const step = $derived(bins.length > 0 ? room / bins.length : 0)

$effect(() => {
  void appearance.revision
  const target = canvas
  if (target === null || room <= 0 || bins.length === 0) return
  const dpr = window.devicePixelRatio || 1
  target.width = Math.round(room * dpr)
  target.height = Math.round(HEIGHT * dpr)
  const g = target.getContext('2d')
  if (g === null) return
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, room, HEIGHT)
  const style = getComputedStyle(target)
  const accent = style.getPropertyValue('--accent').trim() || '#9fd'
  const danger = style.getPropertyValue('--danger').trim() || '#f55'
  const info = style.getPropertyValue('--info').trim() || '#5af'
  const most = Math.max(1, ...bins.map((b) => b.writes))
  const base = HEIGHT - 6
  // The rule along the bottom, and the alarms' bars from when each began.
  g.globalAlpha = 0.35
  g.fillStyle = accent
  g.fillRect(0, base, room, 1)
  const start = bins[0]?.at ?? 0
  for (const since of alarms) {
    const x = Math.max(0, ((since - start) / (15 * 60_000)) * step)
    g.globalAlpha = 0.85
    g.fillStyle = danger
    g.fillRect(x, HEIGHT - 3, room - x, 3)
  }
  bins.forEach((bin, i) => {
    const x = i * step
    const last = i === bins.length - 1
    g.globalAlpha = last ? 0.3 : 0.85
    if (bin.writes > 0) {
      const h = Math.max(3, (bin.writes / most) * (base - 4))
      g.fillStyle = bin.errors > 0 ? danger : accent
      g.fillRect(x + step * 0.2, base - h, Math.max(1, step * 0.6), h)
    }
    if (bin.logins > 0) {
      g.fillStyle = info
      const cx = x + step / 2
      g.beginPath()
      g.moveTo(cx, 1)
      g.lineTo(cx + 3, 4)
      g.lineTo(cx, 7)
      g.lineTo(cx - 3, 4)
      g.closePath()
      g.fill()
    }
  })
  g.globalAlpha = 1
})

function onmove(event: PointerEvent): void {
  if (canvas === null || step <= 0) return
  const box = canvas.getBoundingClientRect()
  const i = Math.floor((event.clientX - box.left) / step)
  onbin(i >= 0 && i < bins.length ? i : null, event.clientX)
}
</script>

<div class="pulse" {@attach observe}>
  <canvas
    bind:this={canvas}
    style:width="{room}px"
    style:height="{HEIGHT}px"
    onpointermove={onmove}
    onpointerleave={() => onbin(null, 0)}
    aria-label="account activity over the last 24 hours"
    data-testid="aws-pulse-canvas"
  ></canvas>
</div>

<style>
.pulse {
  flex: 1;
  min-width: 0;
}

canvas {
  display: block;
  cursor: crosshair;
}
</style>
