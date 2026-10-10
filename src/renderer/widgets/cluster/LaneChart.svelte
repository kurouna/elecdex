<script lang="ts">
import {
  CLUSTER_LIMITS,
  HISTORY_SECONDS,
  LANE_JOIN_SECONDS,
  type LaneId,
  type LaneSecond,
  laneHeight,
  laneScale,
  scaleLabel,
} from '@shared/cluster'
import { appearance } from '../../stores/appearance.svelte.ts'

/**
 * A lane's last sixty seconds as a line over a soft fill, on a 2D canvas
 * (docs/cluster.md §5). The fill is one flat wash per run, not area-fill.ts's
 * strip-by-strip fade: six full-width lanes of that cost a third of a core
 * (measured 2026-10-10: 35% of one core at 1920x1080, against 10% this way).
 *
 * Drawn once per second that arrives, with no animation (user decision
 * 2026-10-10). The percentages keep their whole range; the network and the ping
 * are scaled to the minute they show, the top written at the lane's corner.
 * A hot reading changes nothing on the line, as on the CPU pane's charts (user
 * decision 2026-10-10): the number, the lamp and the message say it. An echo
 * that never came back is a red stroke the lane's height.
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
  line: string
  crit: string
  guide: string
  label: string
  font: string
  labelSize: number
}

function readColors(el: Element): Colors {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback
  const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return {
    line: read('--accent', '#aacfd1'),
    crit: read('--danger', '#e05050'),
    guide: read('--panel-rule', 'rgba(170,207,209,0.3)'),
    label: read('--text-muted', 'rgba(170,207,209,0.5)'),
    font: read('--font-mono', 'monospace'),
    // --step--2: the smallest the type scale allows.
    labelSize: Math.max(8, Math.round(root * 0.625)),
  }
}

/** Where amber starts on this lane, for a faint guide; none for the network. */
function warnAt(): number | null {
  if (lane === 'cpu' || lane === 'mem') return CLUSTER_LIMITS[lane].warn
  if (lane === 'io') return CLUSTER_LIMITS.io.warn
  if (lane === 'ping') return CLUSTER_LIMITS.pingMs.warn
  return null
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
    const top = laneScale(seconds, lane)
    const frame: Frame = { ctx, width, height, top, colors }
    drawGuide(frame)
    drawLine(frame, seconds)
    drawLabel(frame)
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

interface Frame {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  /** The top of the scale, in the lane's unit. */
  top: number
  colors: Colors
}

/** Room kept at the top for the line's peak and at the right for the newest dot. */
const PAD_TOP = 3
const PAD_RIGHT = 4

const yOf = (f: Frame, value: number): number =>
  f.height - laneHeight(value, f.top) * (f.height - PAD_TOP)

const xOf = (f: Frame, age: number): number =>
  f.width - PAD_RIGHT - (age * (f.width - PAD_RIGHT)) / (HISTORY_SECONDS - 1)

function drawGuide(f: Frame): void {
  const at = warnAt()
  if (at === null || at > f.top) return
  const y = Math.round(yOf(f, at)) + 0.5
  f.ctx.strokeStyle = f.colors.guide
  f.ctx.lineWidth = 1
  f.ctx.setLineDash([1, 3])
  f.ctx.beginPath()
  f.ctx.moveTo(0, y)
  f.ctx.lineTo(f.width, y)
  f.ctx.stroke()
  f.ctx.setLineDash([])
}

type Point = [number, number]

/** The seconds the lane shows, with their age (0 the newest). */
function shown(seconds: readonly LaneSecond[]): Array<{ age: number; value: LaneSecond[LaneId] }> {
  const newest = seconds.length - 1
  return seconds
    .map((second, i) => ({ age: newest - i, value: second[lane] }))
    .filter((point) => point.age < HISTORY_SECONDS && point.value !== undefined)
}

/** The line's runs: broken by a long gap or by a reading that says nothing. */
function runsOf(f: Frame, seconds: readonly LaneSecond[]): Point[][] {
  const runs: Point[][] = []
  let run: Point[] = []
  let lastAge = Number.POSITIVE_INFINITY
  for (const { age, value } of shown(seconds)) {
    if (value === null || lastAge - age > LANE_JOIN_SECONDS) {
      if (run.length > 0) runs.push(run)
      run = []
    }
    if (typeof value === 'number') run.push([xOf(f, age), yOf(f, value)])
    lastAge = age
  }
  if (run.length > 0) runs.push(run)
  return runs
}

function drawLine(f: Frame, seconds: readonly LaneSecond[]): void {
  const { ctx, colors } = f
  for (const run of runsOf(f, seconds)) {
    fillRun(ctx, run, f.height, colors.line)
    ctx.strokeStyle = colors.line
    ctx.lineWidth = 1.25
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (const [i, [x, y]] of run.entries()) {
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  drawNewest(f, seconds)
  // An echo that never came back: a red stroke the lane's height.
  ctx.fillStyle = colors.crit
  for (const { age, value } of shown(seconds)) {
    if (value === null && lane === 'ping') ctx.fillRect(Math.round(xOf(f, age)) - 1, 0, 2, f.height)
  }
}

/** How strong the wash under a line is. */
const WASH_ALPHA = 0.16

function fillRun(
  ctx: CanvasRenderingContext2D,
  run: readonly Point[],
  baseline: number,
  color: string,
): void {
  const first = run[0]
  const last = run.at(-1)
  if (first === undefined || last === undefined || run.length < 2) return
  ctx.save()
  ctx.globalAlpha = WASH_ALPHA
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(first[0], baseline)
  for (const [x, y] of run) ctx.lineTo(x, y)
  ctx.lineTo(last[0], baseline)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** A dot on the newest reading: where the lane is now. */
function drawNewest(f: Frame, seconds: readonly LaneSecond[]): void {
  const newest = seconds.length - 1
  const i = seconds.findLastIndex((second) => typeof second[lane] === 'number')
  const value = seconds[i]?.[lane]
  if (typeof value !== 'number' || newest - i >= HISTORY_SECONDS) return
  f.ctx.fillStyle = f.colors.line
  f.ctx.beginPath()
  f.ctx.arc(xOf(f, newest - i), yOf(f, value), 2.5, 0, Math.PI * 2)
  f.ctx.fill()
}

function drawLabel(f: Frame): void {
  const { ctx, colors } = f
  ctx.fillStyle = colors.label
  ctx.font = `${colors.labelSize}px ${colors.font}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(scaleLabel(lane, f.top), 0, 0)
}
</script>

<!-- The figures beside it say the same in words: the chart is a picture of them. -->
<canvas bind:this={canvas} class="chart" data-testid="cluster-lane-{lane}" aria-hidden="true"></canvas>

<style>
.chart {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
