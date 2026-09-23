import {
  footprint,
  type GroundPoint,
  hourRuler,
  splitAtDateLine,
  subsolarPoint,
  sunAltitude,
} from './astro.ts'
import landMask from './land-mask.json'
import tzLines from './tz-lines.json'

/**
 * The ORBIT pane's map, drawn on a 2D canvas in three layers, each redrawn only
 * as often as it changes:
 *
 *  - the ground (dotted land, the graticule, the lines where clocks change),
 *    when the size or the theme changes;
 *  - the night, once a minute;
 *  - what moves (tracks, stations, the Starlink cloud, the hour ruler), once a
 *    second, over the other two.
 *
 * The map is equirectangular, twice as wide as it is high, as mission control's
 * ground track is: a degree is the same number of pixels both ways.
 */

export interface Palette {
  ground: string
  land: string
  grid: string
  zones: string
  text: string
  muted: string
  accent: string
  strong: string
  info: string
  warn: string
  ok: string
  /** Font families, as the theme names them: a canvas reads no CSS variables. */
  mono: string
  ui: string
  display: string
}

/** The map's placement inside the canvas, and the projection with it. */
export interface Frame {
  width: number
  height: number
  /** Pixels per degree. */
  scale: number
  left: number
  top: number
}

/** Height of the hour ruler along the map's top, in CSS pixels. */
export const RULER = 16

export function frameFor(width: number, height: number): Frame {
  const room = height - RULER
  const scale = Math.max(0.1, Math.min(width / 360, room / 180))
  return {
    width,
    height,
    scale,
    left: (width - 360 * scale) / 2,
    // Up against the bar above, as a screen is hung: any room left goes below.
    top: RULER,
  }
}

export const px = (f: Frame, lon: number): number => f.left + (lon + 180) * f.scale
export const py = (f: Frame, lat: number): number => f.top + (90 - lat) * f.scale

const landBits = Uint8Array.from(atob(landMask.bits), (c) => c.charCodeAt(0))
const zonePath = typeof Path2D === 'undefined' ? null : new Path2D(tzLines.path)

/** The ground: drawn once per size and theme into its own canvas. */
export function drawGround(ctx: CanvasRenderingContext2D, f: Frame, p: Palette, dpr: number): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, f.width, f.height)
  ctx.fillStyle = p.ground
  ctx.fillRect(f.left, f.top, 360 * f.scale, 180 * f.scale)

  // Land as a dot matrix; a small map thins the grid so the dots stay apart.
  const { cols, rows, resolution } = landMask
  const step = Math.max(1, Math.round(2.2 / (resolution * f.scale)))
  const dot = Math.max(0.8, Math.min(1.6, resolution * step * f.scale * 0.45))
  ctx.fillStyle = p.land
  for (let r = 0; r < rows; r += step) {
    for (let c = 0; c < cols; c += step) {
      const i = r * cols + c
      if (((landBits[i >> 3] ?? 0) >> (i & 7)) & 1) {
        ctx.fillRect(
          f.left + (c + 0.5) * resolution * f.scale - dot / 2,
          f.top + (r + 0.5) * resolution * f.scale - dot / 2,
          dot,
          dot,
        )
      }
    }
  }

  // Meridians every 15 degrees: the nominal hour zones.
  ctx.lineWidth = 1
  ctx.strokeStyle = p.grid
  ctx.beginPath()
  for (let lon = -165; lon < 180; lon += 15) {
    ctx.moveTo(Math.round(px(f, lon)) + 0.5, f.top)
    ctx.lineTo(Math.round(px(f, lon)) + 0.5, f.top + 180 * f.scale)
  }
  for (const lat of [-60, -30, 30, 60]) {
    ctx.moveTo(f.left, Math.round(py(f, lat)) + 0.5)
    ctx.lineTo(f.left + 360 * f.scale, Math.round(py(f, lat)) + 0.5)
  }
  ctx.stroke()
  ctx.strokeStyle = p.muted
  ctx.beginPath()
  ctx.moveTo(f.left, Math.round(py(f, 0)) + 0.5)
  ctx.lineTo(f.left + 360 * f.scale, Math.round(py(f, 0)) + 0.5)
  ctx.stroke()
  ctx.setLineDash([3, 5])
  ctx.beginPath()
  for (const lat of [23.44, -23.44]) {
    ctx.moveTo(f.left, Math.round(py(f, lat)) + 0.5)
    ctx.lineTo(f.left + 360 * f.scale, Math.round(py(f, lat)) + 0.5)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Where clocks really change (timezone-boundary-builder, ODbL), over the dots.
  if (zonePath !== null) {
    ctx.save()
    ctx.translate(f.left, f.top)
    ctx.scale(f.scale, f.scale)
    ctx.lineWidth = 1 / f.scale
    ctx.strokeStyle = p.zones
    ctx.stroke(zonePath)
    ctx.restore()
  }
}

/**
 * The night side, deepening through twilight to astronomical night, and on a
 * dark theme the day side faintly lit: worked out on a one-degree grid and
 * scaled up smooth.
 */
export function drawNight(
  ctx: CanvasRenderingContext2D,
  at: Date,
  glow: readonly [number, number, number] | null,
): void {
  const sun = subsolarPoint(at)
  const image = ctx.createImageData(360, 180)
  for (let y = 0; y < 180; y += 1) {
    for (let x = 0; x < 360; x += 1) {
      const altitude = sunAltitude({ lat: 89.5 - y, lon: x - 179.5 }, sun)
      const i = (y * 360 + x) * 4
      // Through twilight to astronomical night (-18 degrees), smoothly: steps drew
      // bands round the poles, where the Sun skims the horizon all day.
      const dark = Math.min(1, Math.max(0, -altitude / 18))
      if (glow !== null && altitude > 0) {
        // On a dark ground night cannot get much darker, so the day is lit instead.
        image.data[i] = glow[0]
        image.data[i + 1] = glow[1]
        image.data[i + 2] = glow[2]
        image.data[i + 3] = Math.min(1, altitude / 10) * 0.09 * 255
      } else {
        // A light ground shows a thin shade plainly; a dark one needs more to show at all.
        image.data[i + 3] = dark * (glow === null ? 0.22 : 0.55) * 255
      }
    }
  }
  ctx.putImageData(image, 0, 0)
}

export interface TrackPoint extends GroundPoint {
  t: number
  sunlit: boolean
}

export interface Scene {
  at: Date
  /** Every other second is a beat: the station's mark breathes with the clock. */
  beat: boolean
  focus: {
    code: string
    state: GroundPoint & { altKm: number }
    past: TrackPoint[]
    next: TrackPoint[]
  } | null
  others: { code: string; state: GroundPoint }[]
  starlink: Float32Array | null
  cities: { code: string; lat: number; lon: number; home: boolean }[]
  observer: (GroundPoint & { code: string }) | null
  footprintDeg: number
  show: { tracks: boolean; night: boolean; cities: boolean }
}

function stroke(ctx: CanvasRenderingContext2D, f: Frame, points: readonly GroundPoint[]): void {
  for (const run of splitAtDateLine(points)) {
    ctx.beginPath()
    run.forEach((point, i) => {
      if (i === 0) ctx.moveTo(px(f, point.lon), py(f, point.lat))
      else ctx.lineTo(px(f, point.lon), py(f, point.lat))
    })
    ctx.stroke()
  }
}

/** A track, bright where the station is in sunlight and dim in the Earth's shadow. */
function drawTrack(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  p: Palette,
  next: readonly TrackPoint[],
): void {
  let run: TrackPoint[] = []
  const flush = (lit: boolean) => {
    if (run.length < 2) return
    ctx.strokeStyle = lit ? p.strong : p.accent
    ctx.globalAlpha = lit ? 0.95 : 0.55
    ctx.setLineDash(lit ? [] : [5, 4])
    stroke(ctx, f, run)
  }
  for (const point of next) {
    if (run.length > 0 && run[0]?.sunlit !== point.sunlit) {
      run.push(point)
      flush(run[0]?.sunlit === true)
      run = [point]
      continue
    }
    run.push(point)
  }
  flush(run[0]?.sunlit === true)
  ctx.globalAlpha = 1
  ctx.setLineDash([])
  // Minutes from now along the way, every ten, labelled every thirty.
  ctx.fillStyle = p.strong
  ctx.font = `600 ${Math.max(9, Math.min(12, f.scale * 3))}px ${p.mono}`
  const start = next[0]?.t ?? 0
  for (const point of next) {
    const minutes = Math.round((point.t - start) / 60_000)
    if (
      minutes === 0 ||
      minutes % 10 !== 0 ||
      Math.abs(point.t - start - minutes * 60_000) > 15_000
    )
      continue
    const x = px(f, point.lon)
    const y = py(f, point.lat)
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
    if (minutes % 30 === 0) ctx.fillText(`+${minutes}`, x + 5, y + 12)
  }
}

export function drawScene(ctx: CanvasRenderingContext2D, f: Frame, p: Palette, s: Scene): void {
  ctx.lineWidth = 1
  if (s.starlink !== null) drawStarlink(ctx, f, p, s.starlink)
  if (s.show.cities) drawCities(ctx, f, p, s.cities)
  if (s.observer !== null) drawObserver(ctx, f, p, s.observer)
  if (s.show.night) drawSun(ctx, f, p, s.at)
  ctx.font = `600 ${Math.max(10, Math.min(14, f.scale * 3.6))}px ${p.display}`
  for (const other of s.others) {
    const x = px(f, other.state.lon)
    const y = py(f, other.state.lat)
    ctx.strokeStyle = p.info
    ctx.fillStyle = p.info
    ctx.strokeRect(x - 3.5, y - 3.5, 7, 7)
    ctx.fillText(other.code, x + 7, y - 6)
  }
  if (s.focus !== null) drawFocus(ctx, f, p, s, s.focus)
  drawRuler(ctx, f, p, s.at)
}

/** The constellation as a faint cloud: two floats (latitude, longitude) per satellite. */
function drawStarlink(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  p: Palette,
  positions: Float32Array,
): void {
  ctx.fillStyle = p.info
  ctx.globalAlpha = 0.55
  const size = Math.max(1, Math.min(1.8, f.scale * 0.35))
  for (let i = 0; i + 1 < positions.length; i += 2) {
    ctx.fillRect(
      px(f, positions[i + 1] ?? 0) - size / 2,
      py(f, positions[i] ?? 0) - size / 2,
      size,
      size,
    )
  }
  ctx.globalAlpha = 1
}

function drawCities(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  p: Palette,
  cities: Scene['cities'],
): void {
  ctx.font = `600 ${Math.max(9, Math.min(12, f.scale * 3))}px ${p.ui}`
  for (const city of cities) {
    ctx.fillStyle = city.home ? p.strong : p.muted
    const x = px(f, city.lon)
    const y = py(f, city.lat)
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
    ctx.fillText(city.code, x + 4, y - 3)
  }
}

/** The observer as a sight: a ring with four ticks. */
function drawObserver(ctx: CanvasRenderingContext2D, f: Frame, p: Palette, at: GroundPoint): void {
  const x = px(f, at.lon)
  const y = py(f, at.lat)
  ctx.strokeStyle = p.ok
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    ctx.moveTo(x + dx * 5, y + dy * 5)
    ctx.lineTo(x + dx * 8, y + dy * 8)
  }
  ctx.stroke()
}

/** The point with the Sun overhead. */
function drawSun(ctx: CanvasRenderingContext2D, f: Frame, p: Palette, at: Date): void {
  const sun = subsolarPoint(at)
  ctx.strokeStyle = p.warn
  ctx.fillStyle = p.warn
  ctx.beginPath()
  ctx.arc(px(f, sun.lon), py(f, sun.lat), 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(px(f, sun.lon), py(f, sun.lat), 2, 0, Math.PI * 2)
  ctx.fill()
}

/** The focused station: its tracks, the ground that sees it, and its mark. */
function drawFocus(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  p: Palette,
  s: Scene,
  focus: NonNullable<Scene['focus']>,
): void {
  const { state } = focus
  if (s.show.tracks) {
    ctx.strokeStyle = p.accent
    ctx.globalAlpha = 0.35
    ctx.setLineDash([2, 5])
    stroke(ctx, f, focus.past)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    drawTrack(ctx, f, p, focus.next)
  }
  ctx.strokeStyle = p.strong
  ctx.globalAlpha = 0.4
  stroke(ctx, f, footprint(state, s.footprintDeg))
  const x = px(f, state.lon)
  const y = py(f, state.lat)
  ctx.globalAlpha = s.beat ? 1 : 0.55
  ctx.beginPath()
  ctx.arc(x, y, 9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = p.strong
  ctx.fillRect(x - 3, y - 3, 6, 6)
  ctx.font = `600 ${Math.max(10, Math.min(14, f.scale * 3.6))}px ${p.display}`
  ctx.fillText(focus.code, x + 12, y - 9)
}

/** The nominal hour of each fifteen-degree zone, along the map's top; midnight and noon lit. */
function drawRuler(ctx: CanvasRenderingContext2D, f: Frame, p: Palette, at: Date): void {
  const top = f.top - RULER
  ctx.font = `600 ${Math.max(9, Math.min(12, f.scale * 3))}px ${p.mono}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const zone of hourRuler(at)) {
    const x = px(f, zone.lon)
    if (x < f.left + 8 || x > f.left + 360 * f.scale - 8) continue
    ctx.fillStyle = zone.hour === 0 ? p.warn : zone.hour === 12 ? p.strong : p.muted
    ctx.fillText(String(zone.hour).padStart(2, '0'), x, top + RULER / 2)
  }
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
}
