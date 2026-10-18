/**
 * Canvas drawing the Wi-Fi and Ethernet panes share: the palette read from the
 * theme, the echo ribbons under the path, the hatching over time not watched,
 * the crosshair, and the sparklines on the path's wires. Plain 2D canvas, drawn
 * once a second on the frame loop (and when the pointer moves), never on its own
 * clock.
 *
 * No words are drawn on a canvas: a lane's name, a scale or "NOT WATCHED" is
 * HTML laid over it at a step of the type scale (CLAUDE.md, type sizes by role),
 * placed from what these functions return. The canvas once drew them at 8-10 px,
 * below the scale's floor, and they could not carry a card.
 *
 * The functions take everything they draw from their arguments, so a test can
 * hand them a recording context.
 */

import type { Health } from '@shared/netpath'

/** A station on the path strip (PathStrip.svelte), as a pane fills it in. */
export interface StationView {
  id: string
  name: string
  health: Health
  main: string
  sub: string
}

/** The wire leading to a station: its sparkline, and this second's packet. */
export interface WireView {
  to: string
  health: Health
  spark: string
  /** This second's echo got this far. */
  runs: boolean
  /** This second's echo was lost on this wire. */
  lost: boolean
}

/** A wire's sparkline box: drawn in it, stretched to the wire. */
export const SPARK_W = 100
export const SPARK_H = 20

/** A detail card's words (HintCard.svelte); each pane's hints.ts holds its own. */
export interface Hint {
  title: string
  /** What it is and how to read it: a sentence or two a line. */
  body: string[]
  /** The limits it is judged by, when it has any. */
  limits?: string
}

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

/** A second of echoes, as the ribbons read it. */
export interface Echoes {
  at: number
  gateway: number | null | undefined
  internet: number | null | undefined
}

export interface RibbonLimits {
  gateway: { warn: number; bad: number }
  internet: { warn: number; bad: number }
}

/**
 * Two rows of cells, a second each, newest on the right: the gateway's echoes
 * above, the internet's below. A lost echo is a hollow cell with a cross. The
 * rows' names (GW, NET) are the component's, beside the canvas.
 */
export function drawRibbons(
  s: Surface,
  p: Palette,
  points: readonly Echoes[],
  now: number,
  seconds: number,
  limits: RibbonLimits,
): void {
  begin(s)
  const { ctx, width, height } = s
  const gap = 2
  const cell = Math.max(2, width / seconds)
  const row = (height - gap) / 2
  const bySecond = new Map<number, Echoes>()
  for (const point of points) bySecond.set(Math.floor(point.at / 1000), point)
  const newest = Math.floor(now / 1000)
  for (let i = 0; i < seconds; i++) {
    const point = bySecond.get(newest - (seconds - 1 - i))
    const x = i * cell
    drawCell(ctx, p, x, 0, cell - 1, row, echoTone(point?.gateway, limits.gateway))
    drawCell(ctx, p, x, row + gap, cell - 1, row, echoTone(point?.internet, limits.internet))
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

/**
 * An SVG path for a sparkline across `width` by `height`, one step per value,
 * low values at the bottom; broken where a value is missing (null or undefined).
 */
export function sparkPath(
  values: readonly (number | null | undefined)[],
  lo: number,
  hi: number,
  width: number,
  height: number,
): string {
  const step = values.length > 1 ? width / (values.length - 1) : width
  const span = hi - lo || 1
  let d = ''
  let drawing = false
  values.forEach((v, i) => {
    if (typeof v !== 'number') {
      drawing = false
      return
    }
    const y = height - ((Math.min(hi, Math.max(lo, v)) - lo) / span) * height
    d += `${drawing ? 'L' : 'M'}${(i * step).toFixed(1)} ${y.toFixed(1)}`
    drawing = true
  })
  return d
}

// ---------------------------------------------------------------------------
// Timelines
// ---------------------------------------------------------------------------

/** The plot's left edge: room for the lanes' names, laid over it in HTML. */
export const LABEL_WIDTH = 46
const LANE_GAP = 5
const EVENTS_HEIGHT = 16

export interface LaneBox<L extends string = string> {
  lane: L
  y: number
  h: number
}

/**
 * The lanes one under another, each its share of the height by weight; a lane
 * of weight 0 (the events) is a fixed strip.
 */
export function stackLanes<L extends string>(
  weights: Readonly<Record<L, number>>,
  order: readonly L[],
  height: number,
): LaneBox<L>[] {
  const total = order.reduce((a, l) => a + weights[l], 0)
  const fixed = order.filter((l) => weights[l] === 0).length * EVENTS_HEIGHT
  const room = height - fixed - LANE_GAP * (order.length - 1)
  let y = 0
  return order.map((lane) => {
    const h = weights[lane] === 0 ? EVENTS_HEIGHT : (room * weights[lane]) / total
    const box = { lane, y, h }
    y += h + LANE_GAP
    return box
  })
}

export interface Plot {
  x: number
  w: number
}

/** The dotted rule under a lane. */
export function drawLaneRule(s: Surface, p: Palette, box: LaneBox, plot: Plot): void {
  const { ctx } = s
  ctx.strokeStyle = p.rule
  ctx.lineWidth = 1
  ctx.setLineDash([2, 3])
  ctx.beginPath()
  ctx.moveTo(plot.x, Math.round(box.y + box.h) + 0.5)
  ctx.lineTo(plot.x + plot.w, Math.round(box.y + box.h) + 0.5)
  ctx.stroke()
  ctx.setLineDash([])
}

/** Runs of columns with no reading at all: time the pane was not on screen. */
export function unwatchedRuns(
  buckets: readonly { count: number }[],
): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = []
  let start = -1
  buckets.forEach((b, i) => {
    if (b.count === 0 && start < 0) start = i
    if (b.count > 0 && start >= 0) {
      runs.push({ from: start, to: i })
      start = -1
    }
  })
  if (start >= 0) runs.push({ from: start, to: buckets.length })
  return runs
}

/** A stretch of the plot not watched, in CSS pixels, for its hatching and its name. */
export interface Unwatched {
  x0: number
  x1: number
}

/**
 * Stretches the pane was not watching, hatched across the lanes: an empty stretch
 * is otherwise read as a dead link, or a broken chart. Returns where they are, so
 * the component can name the wide ones.
 */
export function drawUnwatched(
  s: Surface,
  p: Palette,
  bottom: number,
  plot: Plot,
  buckets: readonly { count: number }[],
): Unwatched[] {
  const { ctx } = s
  const column = plot.w / Math.max(1, buckets.length)
  const out: Unwatched[] = []
  for (const run of unwatchedRuns(buckets)) {
    const x0 = plot.x + run.from * column
    const x1 = plot.x + run.to * column
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0, 0, x1 - x0, bottom)
    ctx.clip()
    ctx.strokeStyle = p.faint
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = x0 - bottom; x < x1; x += 7) {
      ctx.moveTo(x, bottom)
      ctx.lineTo(x + bottom, 0)
    }
    ctx.stroke()
    ctx.restore()
    out.push({ x0, x1 })
  }
  return out
}

export function glowOn(ctx: CanvasRenderingContext2D, p: Palette, color: string): void {
  ctx.shadowColor = color
  ctx.shadowBlur = p.glow * 8
}

export function glowOff(ctx: CanvasRenderingContext2D): void {
  ctx.shadowBlur = 0
}

/** A line through the buckets' middles, broken where a bucket has nothing. */
export function strokeSeries(
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

export const centres = (plot: Plot, count: number, column: number): number[] =>
  Array.from({ length: count }, (_, i) => plot.x + (i + 0.5) * column)

export function drawCrosshair(s: Surface, p: Palette, x: number): void {
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

/** An event's mark: a hairline up through the lanes, so what happened lines up with what it did. */
export function drawEventLine(s: Surface, x: number, bottom: number, color: string): void {
  const { ctx } = s
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.25
  ctx.beginPath()
  ctx.moveTo(Math.round(x) + 0.5, 0)
  ctx.lineTo(Math.round(x) + 0.5, bottom)
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** Bits a second, in kb/s below a megabit so an idle link does not read as nothing. */
export const megabits = (bytesPerSecond: number): string => {
  const bits = bytesPerSecond * 8
  if (bits < 1e6) return `${Math.round(bits / 1e3)} kb/s`
  const mbps = bits / 1e6
  return `${mbps >= 10 ? Math.round(mbps) : mbps.toFixed(1)} Mb/s`
}

/** Labels laid over a timeline: the scales and the names of what the canvas drew. */
export interface TimelineLabels {
  scales: { y: number; text: string }[]
  unwatched: Unwatched[]
  events: { x: number; glyph: string; tone: string; key: string }[]
}

/** Whether two sets of labels differ, so a component sets its state only when they do. */
export function labelsChanged(a: TimelineLabels | null, b: TimelineLabels): boolean {
  return a === null || JSON.stringify(a) !== JSON.stringify(b)
}
