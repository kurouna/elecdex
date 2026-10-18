import {
  ETHER_LIMITS,
  type EtherBucket,
  type EtherEvent,
  type EtherEventKind,
  SPEED_STEPS,
  speedLabel,
  stepIndex,
} from '@shared/ethernet'
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
 * The Ethernet pane's timeline lanes: the link's speed, the cable's damaged and
 * broadcast frames, round trips, loss, traffic and events, on one time axis - the
 * Wi-Fi pane's timeline with the cable where it has the radio. No words are drawn
 * here; the component lays them over the canvas from what `drawEtherTimeline`
 * returns.
 */

export const ETHER_LANES = ['link', 'l2', 'latency', 'loss', 'traffic', 'events'] as const
export type EtherLane = (typeof ETHER_LANES)[number]

const WEIGHTS: Record<EtherLane, number> = {
  link: 0.7,
  l2: 0.7,
  latency: 1.3,
  loss: 0.45,
  traffic: 1.1,
  events: 0,
}

export const ETHER_LANE_NAMES: Record<EtherLane, string> = {
  link: 'LINK',
  l2: 'L2',
  latency: 'RTT',
  loss: 'LOSS',
  traffic: 'TRAFFIC',
  events: 'EVENTS',
}

export function etherLaneBoxes(height: number): LaneBox<EtherLane>[] {
  return stackLanes(WEIGHTS, ETHER_LANES, height)
}

/** The glyph and tone each kind of event is marked with, on the lane and in the log: Wi-Fi's where they mean the same. */
export const ETHER_EVENT_MARKS: Record<
  EtherEventKind,
  { glyph: string; tone: 'ok' | 'warn' | 'danger' | 'accent' }
> = {
  connected: { glyph: '▲', tone: 'ok' },
  'link-lost': { glyph: '▼', tone: 'danger' },
  speed: { glyph: '◆', tone: 'warn' },
  duplex: { glyph: '◆', tone: 'warn' },
  'upstream-lost': { glyph: '◌', tone: 'warn' },
  'upstream-back': { glyph: '●', tone: 'ok' },
  'sign-in': { glyph: '!', tone: 'warn' },
  crc: { glyph: '◆', tone: 'danger' },
  broadcast: { glyph: '◆', tone: 'warn' },
  unseen: { glyph: '▽', tone: 'accent' },
  conflict: { glyph: '!', tone: 'danger' },
}

export interface EtherTimelineInput {
  buckets: readonly EtherBucket[]
  events: readonly EtherEvent[]
  from: number
  to: number
  /** The best speed the adapter has had while watched: below it is a fall. */
  bestSeen: number | null
  /** The adapter's best, for the link lane's scale. */
  capMbps: number | null
  latencyTop: number
  /** The traffic lane's half-height, bytes per second, and whether it is the link speed. */
  trafficTop: number
  trafficIsLink: boolean
  /** The L2 lane's top, frames a second. */
  l2Top: number
  hoverX: number | null
}

export function drawEtherTimeline(s: Surface, p: Palette, t: EtherTimelineInput): TimelineLabels {
  begin(s)
  const plot = { x: LABEL_WIDTH, w: Math.max(1, s.width - LABEL_WIDTH) }
  const boxes = etherLaneBoxes(s.height)
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
  // A scale over lanes with nothing drawn in them says nothing: only while the link was up in the window.
  const scale = t.buckets.some((b) => b.speed !== null)
    ? (y: number, text: string) => scales.push({ y, text })
    : () => 0
  for (const box of boxes) {
    switch (box.lane) {
      case 'link':
        drawLink(s, p, box, plot, t, column)
        scale(box.y, `${speedLabel(t.capMbps ?? t.bestSeen)} max`)
        break
      case 'l2':
        drawL2(s, p, box, plot, t, column)
        scale(box.y, `${Math.round(t.l2Top).toLocaleString('en')}/s`)
        break
      case 'latency':
        drawLatency(s, p, box, plot, t, column)
        scale(box.y, `${Math.round(t.latencyTop)} ms`)
        break
      case 'loss':
        drawLoss(s, p, box, plot, t.buckets, column)
        break
      case 'traffic':
        drawTraffic(s, p, box, plot, t, column)
        scale(
          box.y,
          t.trafficIsLink ? `link ${megabits(t.trafficTop)}` : `↑↓ ${megabits(t.trafficTop)}`,
        )
        break
      case 'events':
        events = drawEvents(s, p, box, plot, t)
        break
    }
  }
  if (t.hoverX !== null && t.hoverX >= plot.x) drawCrosshair(s, p, t.hoverX)
  return { scales, unwatched, events }
}

/** Diagonal stripes in a rectangle: the link holding, or (in red) down. */
function hatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = x - h; i < x + w; i += 3) {
    ctx.moveTo(i, y + h)
    ctx.lineTo(i + h, y)
  }
  ctx.stroke()
  ctx.restore()
}

/**
 * The speed as a step of the ladder. Hatched while it holds, so the theme's accent
 * never reads as the warning; solid yellow where it fell below the best seen; red
 * hatching while the link was down.
 */
function drawLink(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: EtherTimelineInput,
  column: number,
): void {
  const { ctx } = s
  t.buckets.forEach((b, i) => {
    const x = plot.x + i * column
    const w = Math.max(1, column)
    if (b.down) {
      hatch(ctx, x, box.y + 1, w, box.h - 2, p.danger)
      return
    }
    if (b.speed === null) return
    const h = ((stepIndex(b.speed) + 1) / SPEED_STEPS.length) * (box.h - 2)
    const top = box.y + box.h - 1 - h
    if (t.bestSeen !== null && b.speed < t.bestSeen) {
      ctx.fillStyle = p.warn
      ctx.fillRect(x, top, w, h)
    } else hatch(ctx, x, top, w, h, p.dim)
  })
}

/** CRC errors in red under broadcast frames in yellow, a second's worst each, on one scale; the broadcast limit dashed. */
function drawL2(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: EtherTimelineInput,
  column: number,
): void {
  const { ctx } = s
  const yOf = (v: number): number => (Math.min(v, t.l2Top) / t.l2Top) * (box.h - 2)
  const limit = box.y + box.h - 1 - yOf(ETHER_LIMITS.broadcast.warn)
  ctx.strokeStyle = p.warn
  ctx.globalAlpha = 0.45
  ctx.setLineDash([1, 3])
  ctx.beginPath()
  ctx.moveTo(plot.x, Math.round(limit) + 0.5)
  ctx.lineTo(plot.x + plot.w, Math.round(limit) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  t.buckets.forEach((b, i) => {
    const x = plot.x + i * column
    const w = Math.max(1, column - 0.5)
    const hc = yOf(b.errors ?? 0)
    const hb = yOf(b.broadcast ?? 0)
    if (hb > 0.3) {
      ctx.fillStyle = p.warn
      ctx.globalAlpha = 0.7
      ctx.fillRect(x, box.y + box.h - 1 - hb - hc, w, hb)
      ctx.globalAlpha = 1
    }
    if ((b.errors ?? 0) > 0) {
      ctx.fillStyle = p.danger
      ctx.fillRect(x, box.y + box.h - 1 - Math.max(1.5, hc), w, Math.max(1.5, hc))
    }
  })
}

function drawLatency(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: EtherTimelineInput,
  column: number,
): void {
  const { ctx } = s
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
  buckets: readonly EtherBucket[],
  column: number,
): void {
  const { ctx } = s
  buckets.forEach((b, i) => {
    if (b.loss === null || b.loss === 0) return
    const h = Math.max(2, (b.loss / 100) * box.h)
    ctx.fillStyle = b.loss >= ETHER_LIMITS.internetLoss.bad ? p.danger : p.warn
    ctx.fillRect(plot.x + i * column, box.y + box.h - h, Math.max(1, column - 0.5), h)
  })
}

function drawTraffic(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: EtherTimelineInput,
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
    if (b.downBytes !== null && b.downBytes > 0) {
      const h = Math.min(1, b.downBytes / t.trafficTop) * half
      ctx.fillStyle = p.dim
      ctx.globalAlpha = 1
      ctx.fillRect(x, mid, w, h)
    }
    ctx.globalAlpha = 1
  })
  if (t.trafficIsLink) {
    // The link's ceiling, both ways: traffic pressed against it is held by the link.
    ctx.strokeStyle = p.muted
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    for (const y of [Math.round(mid - half) + 0.5, Math.round(mid + half) - 0.5]) {
      ctx.moveTo(plot.x, y)
      ctx.lineTo(plot.x + plot.w, y)
    }
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawEvents(
  s: Surface,
  p: Palette,
  box: LaneBox,
  plot: Plot,
  t: EtherTimelineInput,
): TimelineLabels['events'] {
  const span = t.to - t.from
  const out: TimelineLabels['events'] = []
  for (const e of t.events) {
    if (e.at < t.from || e.at >= t.to) continue
    const x = plot.x + ((e.at - t.from) / span) * plot.w
    const mark = ETHER_EVENT_MARKS[e.kind]
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

/** A top for the latency lane: the window's worst, rounded up to a step, at least the gateway's limit. */
export function etherLatencyTop(buckets: readonly EtherBucket[]): number {
  let top: number = ETHER_LIMITS.gatewayRtt.bad
  for (const b of buckets) top = Math.max(top, b.internet?.max ?? 0, b.gateway?.max ?? 0)
  const steps = [20, 50, 100, 150, 250, 500, 1000, 2000]
  return steps.find((s) => s >= top * 1.2) ?? top
}

/**
 * A top for the traffic lane: the window's busier direction, at least 1 Mb/s -
 * or the link speed itself once traffic comes within 70 % of it, so a link held
 * at its ceiling is drawn against it.
 */
export function etherTrafficTop(
  buckets: readonly EtherBucket[],
  speedMbps: number | null,
): { top: number; isLink: boolean } {
  let top = 125_000
  for (const b of buckets) top = Math.max(top, b.up ?? 0, b.downBytes ?? 0)
  const link = speedMbps === null ? null : (speedMbps * 1e6) / 8
  if (link !== null && top >= link * 0.7) return { top: link, isLink: true }
  return { top: top * 1.1, isLink: false }
}

/** A top for the L2 lane: the broadcast limit and a little, or the window's worst. */
export function etherL2Top(buckets: readonly EtherBucket[]): number {
  let top = ETHER_LIMITS.broadcast.warn * 1.2
  for (const b of buckets) top = Math.max(top, (b.errors ?? 0) + (b.broadcast ?? 0))
  return top
}
