import type { Bucket, TrackEvent, TrackKind, WifiPoint } from '@shared/wifi'
import { WIFI_LIMITS } from '@shared/wifi'

/**
 * The Wi-Fi pane's canvas drawing: the echo ribbons under the path and the
 * timeline's lanes. Plain 2D canvas, drawn once a second on the frame loop
 * (and when the pointer moves over the timeline), never on its own clock.
 *
 * The functions take everything they draw from their arguments, so the
 * component test can hand them a recording context.
 */

export interface Palette {
  accent: string
  strong: string
  dim: string
  faint: string
  rule: string
  muted: string
  ok: string
  warn: string
  danger: string
  font: string
  /** Theme glow strength, 0-1: how much the lines bloom. */
  glow: number
}

export function readPalette(el: Element): Palette {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback
  return {
    accent: read('--accent', '#aacfd1'),
    strong: read('--accent-strong', '#d0f0f0'),
    dim: read('--accent-dim', 'rgba(170,207,209,0.35)'),
    faint: read('--accent-faint', 'rgba(170,207,209,0.12)'),
    rule: read('--panel-rule', 'rgba(170,207,209,0.3)'),
    muted: read('--text-muted', 'rgba(170,207,209,0.5)'),
    ok: read('--ok', '#4caf50'),
    warn: read('--warn', '#e0b030'),
    danger: read('--danger', '#e04040'),
    font: read('--font-mono', 'monospace'),
    glow: Number.parseFloat(read('--glow', '0')) || 0,
  }
}

export type Tone = 'ok' | 'warn' | 'bad' | 'lost' | 'none'

/** How one echo reads on a ribbon: by its round trip against the hop's limits. */
export function echoTone(
  value: number | null | undefined,
  limit: { warn: number; bad: number },
): Tone {
  if (value === undefined) return 'none'
  if (value === null) return 'lost'
  if (value >= limit.bad) return 'bad'
  if (value >= limit.warn) return 'warn'
  return 'ok'
}

const toneColor = (p: Palette, tone: Tone): string =>
  tone === 'ok'
    ? p.accent
    : tone === 'warn'
      ? p.warn
      : tone === 'bad' || tone === 'lost'
        ? p.danger
        : p.faint

export interface Surface {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  ratio: number
}

export function begin(s: Surface): void {
  s.ctx.setTransform(s.ratio, 0, 0, s.ratio, 0, 0)
  s.ctx.clearRect(0, 0, s.width, s.height)
}

/**
 * Two rows of cells, a second each, newest on the right: the gateway's echoes
 * above, the internet's below. A lost echo is a hollow cell with a cross.
 */
export function drawRibbons(
  s: Surface,
  p: Palette,
  points: readonly WifiPoint[],
  now: number,
  seconds: number,
): void {
  begin(s)
  const { ctx, width, height } = s
  const label = 30
  const gap = 2
  const cell = Math.max(2, (width - label) / seconds)
  const row = (height - gap) / 2
  const bySecond = new Map<number, WifiPoint>()
  for (const point of points) bySecond.set(Math.floor(point.at / 1000), point)
  const newest = Math.floor(now / 1000)
  ctx.font = `${Math.max(8, Math.min(10, row * 0.7))}px ${p.font}`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = p.muted
  ctx.fillText('GW', 0, row / 2)
  ctx.fillText('NET', 0, row + gap + row / 2)
  for (let i = 0; i < seconds; i++) {
    const point = bySecond.get(newest - (seconds - 1 - i))
    const x = label + i * cell
    drawCell(ctx, p, x, 0, cell - 1, row, echoTone(point?.gateway, WIFI_LIMITS.gatewayRtt))
    drawCell(
      ctx,
      p,
      x,
      row + gap,
      cell - 1,
      row,
      echoTone(point?.internet, WIFI_LIMITS.internetRtt),
    )
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  tone: Tone,
): void {
  if (tone === 'lost') {
    ctx.strokeStyle = p.danger
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    ctx.beginPath()
    ctx.moveTo(x + 1, y + 1)
    ctx.lineTo(x + w - 1, y + h - 1)
    ctx.stroke()
    return
  }
  ctx.fillStyle = toneColor(p, tone)
  ctx.globalAlpha = tone === 'none' ? 1 : tone === 'ok' ? 0.75 : 0.95
  ctx.fillRect(x, y, w, h)
  ctx.globalAlpha = 1
}

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
const EVENTS_HEIGHT = 16
const LANE_GAP = 5
export const LABEL_WIDTH = 46

export interface LaneBox {
  lane: Lane
  y: number
  h: number
}

export function laneBoxes(height: number): LaneBox[] {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  const room = height - EVENTS_HEIGHT - LANE_GAP * (LANES.length - 1)
  let y = 0
  return LANES.map((lane) => {
    const h = lane === 'events' ? EVENTS_HEIGHT : (room * WEIGHTS[lane]) / total
    const box = { lane, y, h }
    y += h + LANE_GAP
    return box
  })
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

const LANE_NAMES: Record<Lane, string> = {
  signal: 'SIGNAL',
  retry: 'RETRY',
  latency: 'RTT',
  loss: 'LOSS',
  traffic: 'TRAFFIC',
  events: 'EVENTS',
}

export function drawTimeline(s: Surface, p: Palette, t: TimelineInput): void {
  begin(s)
  const plot = { x: LABEL_WIDTH, w: Math.max(1, s.width - LABEL_WIDTH) }
  const boxes = laneBoxes(s.height)
  for (const box of boxes) drawLaneFrame(s, p, box, plot)
  const column = plot.w / Math.max(1, t.buckets.length)
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
        break
      case 'loss':
        drawLoss(s, p, box, plot, t.buckets, column)
        break
      case 'traffic':
        drawTraffic(s, p, box, plot, t, column)
        break
      case 'events':
        drawEvents(s, p, box, plot, t)
        break
    }
  }
  if (t.hoverX !== null && t.hoverX >= plot.x) drawCrosshair(s, p, t.hoverX)
}

interface Plot {
  x: number
  w: number
}

function drawLaneFrame(s: Surface, p: Palette, box: LaneBox, plot: Plot): void {
  const { ctx } = s
  ctx.fillStyle = p.muted
  ctx.font = `9px ${p.font}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(LANE_NAMES[box.lane], 0, box.y + 1)
  ctx.strokeStyle = p.rule
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.moveTo(plot.x, Math.round(box.y + box.h) + 0.5)
  ctx.lineTo(plot.x + plot.w, Math.round(box.y + box.h) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])
}

function glowOn(ctx: CanvasRenderingContext2D, p: Palette, color: string): void {
  ctx.shadowColor = color
  ctx.shadowBlur = p.glow * 8
}

function glowOff(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0
}

/** A line through the buckets' middles, broken where a bucket has nothing. */
function strokeSeries(
  ctx: CanvasRenderingContext2D,
  xs: readonly number[],
  ys: readonly (number | null)[],
): void {
  ctx.beginPath()
  let drawing = false
  ys.forEach((y, i) => {
    const x = xs[i] ?? 0
    if (y === null) {
      drawing = false
      return
    }
    if (drawing) ctx.lineTo(x, y)
    else ctx.moveTo(x, y)
    drawing = true
  })
  ctx.stroke()
}

const centres = (plot: Plot, count: number, column: number): number[] =>
  Array.from({ length: count }, (_, i) => plot.x + (i + 0.5) * column)

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
  ctx.fillStyle = p.muted
  ctx.font = `9px ${p.font}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(`${Math.round(t.latencyTop)} ms`, plot.x + plot.w - 2, box.y + 1)
  ctx.textAlign = 'left'
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
  ctx.fillStyle = p.muted
  ctx.font = `9px ${p.font}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(`↑ ${megabits(t.trafficTop)}`, plot.x + plot.w - 2, box.y + 1)
  ctx.textBaseline = 'bottom'
  ctx.fillText('↓', plot.x + plot.w - 2, box.y + box.h - 1)
  ctx.textAlign = 'left'
}

/** Bits a second, in kb/s below a megabit so an idle link does not read as nothing. */
export const megabits = (bytesPerSecond: number): string => {
  const bits = bytesPerSecond * 8
  if (bits < 1e6) return `${Math.round(bits / 1e3)} kb/s`
  const mbps = bits / 1e6
  return `${mbps >= 10 ? Math.round(mbps) : mbps.toFixed(1)} Mb/s`
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

function drawEvents(s: Surface, p: Palette, box: LaneBox, plot: Plot, t: TimelineInput): void {
  const { ctx } = s
  const span = t.to - t.from
  ctx.font = `${Math.min(12, box.h - 2)}px ${p.font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
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
    // A hairline up through the lanes, so what happened lines up with what it did.
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, box.y)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = color
    ctx.fillText(mark.glyph, x, box.y + box.h / 2)
  }
  ctx.textAlign = 'left'
}

function drawCrosshair(s: Surface, p: Palette, x: number): void {
  const { ctx, height } = s
  ctx.strokeStyle = p.strong
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.moveTo(Math.round(x) + 0.5, 0)
  ctx.lineTo(Math.round(x) + 0.5, height)
  ctx.stroke()
  ctx.globalAlpha = 1
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
