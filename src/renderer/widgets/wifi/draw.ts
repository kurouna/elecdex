import type { Bucket, TrackEvent, TrackKind } from '@shared/wifi'
import { WIFI_LIMITS } from '@shared/wifi'
import {
  begin,
  centres,
  drawCrosshair,
  drawEventLine,
  drawLaneRule,
  drawUnwatched,
  glowOff,
  glowOn,
  LABEL_WIDTH,
  type LaneBox,
  megabits,
  type Palette,
  type Plot,
  type Surface,
  stackLanes,
  strokeSeries,
  type TimelineLabels,
} from '../netpath/draw.js'

/**
 * The Wi-Fi pane's timeline lanes. What it shares with the Ethernet pane - the
 * palette, the ribbons, the hatching, the sparklines - is netpath/draw.ts, and
 * the names it re-exports below stay where the pane's parts import them from.
 * No words are drawn here: the lanes' names and scales are HTML over the canvas.
 */

export {
  drawRibbons,
  echoTone,
  LABEL_WIDTH,
  megabits,
  type Palette,
  readPalette,
  sparkPath,
  type Tone,
  unwatchedRuns,
} from '../netpath/draw.js'

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export const LANES = ['signal', 'retry', 'latency', 'loss', 'traffic', 'events'] as const
export type Lane = (typeof LANES)[number]

/** Each lane's share of the height; the events lane is a fixed strip. */
const WEIGHTS: Record<Lane, number> = {
  signal: 1.1,
  retry: 0.6,
  latency: 1.4,
  loss: 0.45,
  traffic: 1,
  events: 0,
}
export function laneBoxes(height: number): LaneBox<Lane>[] {
  return stackLanes(WEIGHTS, LANES, height)
}

export interface TimelineInput {
  buckets: readonly Bucket[]
  events: readonly TrackEvent[]
  from: number
  to: number
  /** The latency lane's top, ms. */
  latencyTop: number
  /** The traffic lane's half-height, bytes per second. */
  trafficTop: number
  hoverX: number | null
}

export const LANE_NAMES: Record<Lane, string> = {
  signal: 'SIGNAL',
  retry: 'RETRY',
  latency: 'RTT',
  loss: 'LOSS',
  traffic: 'TRAFFIC',
  events: 'EVENTS',
}

export function drawTimeline(s: Surface, p: Palette, t: TimelineInput): TimelineLabels {
  begin(s)
  const plot = { x: LABEL_WIDTH, w: Math.max(1, s.width - LABEL_WIDTH) }
  const boxes = laneBoxes(s.height)
  for (const box of boxes) drawLaneRule(s, p, box, plot)
  const column = plot.w / Math.max(1, t.buckets.length)
  const last = boxes[boxes.length - 1]
  const unwatched = drawUnwatched(
    s,
    p,
    last === undefined ? s.height : last.y + last.h,
    plot,
    t.buckets,
  )
  const scales: TimelineLabels['scales'] = []
  let events: TimelineLabels['events'] = []
  for (const box of boxes) {
    switch (box.lane) {
      case 'signal':
        drawSignal(s, p, box, plot, t.buckets, column)
        break
      case 'retry':
        drawBars(s, p, box, plot, t.buckets, column)
        break
      case 'latency':
        drawLatency(s, p, box, plot, t, column)
        scales.push({ y: box.y, text: `${Math.round(t.latencyTop)} ms` })
        break
      case 'loss':
        drawLoss(s, p, box, plot, t.buckets, column)
        break
      case 'traffic':
        drawTraffic(s, p, box, plot, t, column)
        scales.push({ y: box.y, text: `↑ ${megabits(t.trafficTop)}` })
        break
      case 'events':
        events = drawEvents(s, p, box, plot, t)
        break
    }
  }
  if (t.hoverX !== null && t.hoverX >= plot.x) drawCrosshair(s, p, t.hoverX)
  return { scales, unwatched, events }
}

function drawSignal(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  buckets: readonly Bucket[],
  column: number,
): void {
  const { ctx } = s
  const yOf = (dbm: number): number =>
    box.y + box.h - ((Math.min(-30, Math.max(-90, dbm)) + 90) / 60) * box.h
  // The levels a call is designed for, and the one it breaks up below.
  for (const [dbm, color] of [
    [WIFI_LIMITS.rssi.warn, p.warn],
    [WIFI_LIMITS.rssi.bad, p.danger],
  ] as const) {
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.45
    ctx.setLineDash([1, 3])
    ctx.beginPath()
    ctx.moveTo(plot.x, Math.round(yOf(dbm)) + 0.5)
    ctx.lineTo(plot.x + plot.w, Math.round(yOf(dbm)) + 0.5)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }
  ctx.fillStyle = p.faint
  buckets.forEach((b, i) => {
    if (b.rssi === null) return
    const top = yOf(b.rssi.max)
    ctx.fillRect(plot.x + i * column, top, Math.max(1, column), Math.max(1, yOf(b.rssi.min) - top))
  })
  ctx.strokeStyle = p.strong
  ctx.lineWidth = 1.4
  glowOn(ctx, p, p.accent)
  strokeSeries(
    ctx,
    centres(plot, buckets.length, column),
    buckets.map((b) => (b.rssi === null ? null : yOf(b.rssi.mid))),
  )
  glowOff(ctx)
}

function drawBars(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  buckets: readonly Bucket[],
  column: number,
): void {
  const { ctx } = s
  const top = 50
  buckets.forEach((b, i) => {
    if (b.retry === null) return
    const v = Math.min(top, b.retry.max)
    const h = (v / top) * box.h
    ctx.fillStyle =
      v >= WIFI_LIMITS.retry.bad ? p.danger : v >= WIFI_LIMITS.retry.warn ? p.warn : p.dim
    ctx.fillRect(plot.x + i * column, box.y + box.h - h, Math.max(1, column - 0.5), h)
  })
}

function drawLatency(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: TimelineInput,
  column: number,
): void {
  const { ctx } = s
  // A square-root scale: a few ms at the gateway and a few hundred beyond both read.
  const yOf = (ms: number): number =>
    box.y + box.h - Math.sqrt(Math.min(ms, t.latencyTop) / t.latencyTop) * box.h
  ctx.fillStyle = p.faint
  t.buckets.forEach((b, i) => {
    if (b.internet === null) return
    const top = yOf(b.internet.max)
    ctx.fillRect(
      plot.x + i * column,
      top,
      Math.max(1, column),
      Math.max(1, yOf(b.internet.min) - top),
    )
  })
  const xs = centres(plot, t.buckets.length, column)
  ctx.strokeStyle = p.muted
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  strokeSeries(
    ctx,
    xs,
    t.buckets.map((b) => (b.gateway === null ? null : yOf(b.gateway.mid))),
  )
  ctx.setLineDash([])
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 1.4
  glowOn(ctx, p, p.accent)
  strokeSeries(
    ctx,
    xs,
    t.buckets.map((b) => (b.internet === null ? null : yOf(b.internet.mid))),
  )
  glowOff(ctx)
}

function drawLoss(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  buckets: readonly Bucket[],
  column: number,
): void {
  const { ctx } = s
  buckets.forEach((b, i) => {
    if (b.loss === null || b.loss === 0) return
    const h = Math.max(2, (b.loss / 100) * box.h)
    ctx.fillStyle = b.loss >= WIFI_LIMITS.internetLoss.bad ? p.danger : p.warn
    ctx.fillRect(plot.x + i * column, box.y + box.h - h, Math.max(1, column - 0.5), h)
  })
}

function drawTraffic(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: TimelineInput,
  column: number,
): void {
  const { ctx } = s
  const mid = box.y + box.h / 2
  const half = box.h / 2
  ctx.strokeStyle = p.rule
  ctx.beginPath()
  ctx.moveTo(plot.x, Math.round(mid) + 0.5)
  ctx.lineTo(plot.x + plot.w, Math.round(mid) + 0.5)
  ctx.stroke()
  t.buckets.forEach((b, i) => {
    const x = plot.x + i * column
    const w = Math.max(1, column - 0.5)
    if (b.up !== null && b.up > 0) {
      const h = Math.min(1, b.up / t.trafficTop) * half
      ctx.fillStyle = p.accent
      ctx.globalAlpha = 0.7
      ctx.fillRect(x, mid - h, w, h)
    }
    if (b.down !== null && b.down > 0) {
      const h = Math.min(1, b.down / t.trafficTop) * half
      ctx.fillStyle = p.dim
      ctx.globalAlpha = 1
      ctx.fillRect(x, mid, w, h)
    }
    ctx.globalAlpha = 1
  })
}

/** The glyph and tone each kind of event is marked with, on the lane and in the log. */
export const EVENT_MARKS: Record<
  TrackKind,
  { glyph: string; tone: 'ok' | 'warn' | 'danger' | 'accent' }
> = {
  connected: { glyph: '▲', tone: 'ok' },
  failed: { glyph: '✕', tone: 'danger' },
  disconnected: { glyph: '▼', tone: 'danger' },
  handover: { glyph: '◆', tone: 'accent' },
  'upstream-lost': { glyph: '◌', tone: 'warn' },
  'upstream-back': { glyph: '●', tone: 'ok' },
  'sign-in': { glyph: '!', tone: 'warn' },
}

/** The events' hairlines; their glyphs are the component's, in HTML at a step of the type scale. */
function drawEvents(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: TimelineInput,
): TimelineLabels['events'] {
  const span = t.to - t.from
  const out: TimelineLabels['events'] = []
  for (const e of t.events) {
    if (e.at < t.from || e.at >= t.to) continue
    const x = plot.x + ((e.at - t.from) / span) * plot.w
    const mark = EVENT_MARKS[e.kind]
    const color =
      mark.tone === 'ok'
        ? p.ok
        : mark.tone === 'danger'
          ? p.danger
          : mark.tone === 'warn'
            ? p.warn
            : p.strong
    drawEventLine(s, x, box.y, color)
    out.push({ x, glyph: mark.glyph, tone: mark.tone, key: e.key })
  }
  return out
}

/** A top for the latency lane: the window's worst, rounded up, at least the call limit. */
export function latencyTop(buckets: readonly Bucket[]): number {
  let top: number = WIFI_LIMITS.internetRtt.warn
  for (const b of buckets) top = Math.max(top, b.internet?.max ?? 0, b.gateway?.max ?? 0)
  const steps = [150, 250, 500, 1000, 2000]
  return steps.find((s) => s >= top) ?? top
}

/** A top for the traffic lane: the window's busier direction, at least 1 Mb/s. */
export function trafficTop(buckets: readonly Bucket[]): number {
  let top = 125_000
  for (const b of buckets) top = Math.max(top, b.up ?? 0, b.down ?? 0)
  return top * 1.1
}
