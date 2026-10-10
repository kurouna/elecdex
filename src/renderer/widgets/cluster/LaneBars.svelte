<script lang="ts">
import {
  HISTORY_SECONDS,
  type LaneId,
  type LaneSecond,
  laneLevel,
  lanePosition,
  NET_GUIDES_MBPS,
  netPosition,
} from '@shared/cluster'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * A lane's last sixty seconds as a bar each, on a 2D canvas (docs/cluster.md §5).
 *
 * Drawn once per second that arrives, with the new bar added at the right - no
 * animation between (user decision 2026-10-10: a step that slid the bars along
 * looked wrong). So a reading is drawn the frame it lands and nothing moves in
 * between. Amber and red bars carry a mark over them as well as their colour.
 */
interface Props {
  lane: LaneId
  history: readonly LaneSecond[]
  /** On screen: nothing is drawn otherwise, and everything is once it is. */
  visible: boolean
}

const { lane, history, visible }: Props = $props()

let canvas = $state<HTMLCanvasElement | null>(null)

interface Colors {
  bar: string
  warn: string
  crit: string
  guide: string
}

function readColors(el: Element): Colors {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback
  return {
    bar: read('--accent', '#aacfd1'),
    warn: read('--warn', '#f0c040'),
    crit: read('--danger', '#e05050'),
    guide: read('--panel-rule', 'rgba(170,207,209,0.3)'),
  }
}

$effect(() => {
  void appearance.revision
  const el = canvas
  if (el === null || !visible) return
  const ctx = el.getContext('2d')
  if (ctx === null) return
  const colors = readColors(el)
  const seconds = history
  let width = 0
  let height = 0
  let ratio = 1

  const resize = (): void => {
    ratio = window.devicePixelRatio || 1
    width = el.clientWidth
    height = el.clientHeight
    el.width = Math.max(1, Math.round(width * ratio))
    el.height = Math.max(1, Math.round(height * ratio))
  }

  const draw = (): void => {
    if (width <= 0 || height <= 0) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    drawGuides(ctx, width, height, colors)
    drawBars(ctx, seconds, { width, height }, colors)
  }

  const observer = new ResizeObserver(() => {
    resize()
    draw()
  })
  observer.observe(el)
  resize()
  draw()
  return () => observer.disconnect()
})

function drawGuides(ctx: CanvasRenderingContext2D, width: number, height: number, c: Colors): void {
  if (lane !== 'rx' && lane !== 'tx') return
  ctx.strokeStyle = c.guide
  ctx.lineWidth = 1
  ctx.setLineDash([1, 3])
  ctx.beginPath()
  for (const mbps of NET_GUIDES_MBPS) {
    const y = Math.round(height - netPosition(mbps) * height) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()
  ctx.setLineDash([])
}

interface Geometry {
  width: number
  height: number
}

/** Bars of the most recent seconds are drawn full; older ones at half strength. */
const RECENT = 5

function drawBars(
  ctx: CanvasRenderingContext2D,
  seconds: readonly LaneSecond[],
  g: Geometry,
  c: Colors,
): void {
  const slot = g.width / HISTORY_SECONDS
  const barWidth = Math.max(1, Math.round(slot * 0.5))
  const newest = seconds.length - 1
  seconds.forEach((second, i) => {
    const age = newest - i
    const value = second[lane]
    if (value === undefined || age >= HISTORY_SECONDS) return
    const x = Math.round(g.width - (age + 1) * slot + (slot - barWidth) / 2)
    drawBar(ctx, { x, width: barWidth, height: lanePosition(lane, value) * (g.height - 3) }, g, {
      level: laneLevel(lane, value),
      faded: age >= RECENT,
      colors: c,
    })
  })
  ctx.globalAlpha = 1
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  bar: { x: number; width: number; height: number },
  g: Geometry,
  how: { level: ReturnType<typeof laneLevel>; faded: boolean; colors: Colors },
): void {
  const h = Math.round(bar.height)
  const { level, colors: c } = how
  ctx.globalAlpha = level === 'none' && how.faded ? 0.5 : 1
  ctx.fillStyle = level === 'crit' ? c.crit : level === 'warn' ? c.warn : c.bar
  ctx.fillRect(bar.x, g.height - h, bar.width, h)
  // The mark over an amber or red bar: its level read by shape, not colour alone.
  if (level !== 'none' && h > 0) ctx.fillRect(bar.x, g.height - h - 3, bar.width, 1)
}
</script>

<!-- The figures beside it say the same in words: the bars are a picture of them. -->
<canvas bind:this={canvas} class="bars" data-testid="cluster-lane-{lane}" aria-hidden="true"></canvas>

<style>
.bars {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
