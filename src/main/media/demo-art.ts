/**
 * Album art for the stand-in media session's demo tracks (ELECDEX_NOWPLAYING_STUB=demo): drawn
 * here pixel by pixel, so a screenshot or a recorded take shows a cover without shipping, or
 * copying, anyone's artwork. Two pictures, one per demo track: a sun setting over a grid for
 * "Night Transit", a ringed planet in the stars for "Low Orbit".
 *
 * Pure: the pixels come back as BGRA rows (what Electron's nativeImage.createFromBitmap takes on
 * the little-endian machines it runs on); main/ipc/now-playing.ts turns them into JPEGs.
 */

export type DemoCover = 'sunset' | 'orbit'

type Rgb = readonly [number, number, number]

const clamp = (v: number): number => Math.max(0, Math.min(1, v))
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
/** A gradient through stops at 0..1. */
function ramp(stops: readonly (readonly [number, Rgb])[], t: number): Rgb {
  let prev = stops[0] as readonly [number, Rgb]
  for (const stop of stops) {
    if (t <= stop[0])
      return mix(prev[1], stop[1], stop[0] === prev[0] ? 0 : (t - prev[0]) / (stop[0] - prev[0]))
    prev = stop
  }
  return prev[1]
}
/** A repeatable scatter, for stars. */
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43_758.5453
  return s - Math.floor(s)
}

const SKY: readonly (readonly [number, Rgb])[] = [
  [0, [22, 6, 48]],
  [0.35, [92, 22, 104]],
  [0.58, [226, 72, 110]],
  [0.64, [255, 150, 90]],
]
const SUN: readonly (readonly [number, Rgb])[] = [
  [0, [255, 236, 120]],
  [0.55, [255, 150, 90]],
  [1, [240, 60, 140]],
]
const HORIZON = 0.64

/** Where a sunset's pixel is, in 0..1 of the picture. */
function sunset(x: number, y: number): Rgb {
  if (y < HORIZON) {
    let color = ramp(SKY, y)
    const dx = x - 0.5
    const dy = y - 0.46
    const r = Math.hypot(dx, dy)
    // The sun, cut into bands that widen towards the horizon.
    const band = y > 0.44 ? Math.sin((y - 0.44) * 150) > 0.75 - (y - 0.44) * 6 : false
    const inSun = 1 - smooth(0.245, 0.255, r)
    if (inSun > 0 && !band) color = mix(color, ramp(SUN, clamp((y - 0.21) / 0.5)), inSun)
    // A glow round it.
    color = mix(color, [255, 120, 150], 0.35 * (1 - smooth(0.25, 0.45, r)) * (1 - inSun))
    return color
  }
  // The floor: lines running to the vanishing point, and lines across that close up towards it.
  const depth = (y - HORIZON) / (1 - HORIZON)
  const z = 1 / Math.max(depth, 0.02)
  const across = Math.abs(((z * 0.9) % 1) - 0.5)
  const along = Math.abs((((((x - 0.5) * z * 1.6) % 1) + 1.5) % 1) - 0.5)
  const width = 0.05 * z * 0.12 + 0.02
  const line = Math.max(1 - smooth(0, width, 0.5 - across), 1 - smooth(0, width * 1.4, 0.5 - along))
  const floor = mix([14, 4, 30], [40, 8, 60], depth)
  const lit = mix(floor, [60, 230, 255], line * (0.35 + 0.65 * depth))
  // The horizon's haze.
  return mix(lit, [255, 120, 150], 0.5 * (1 - smooth(0, 0.08, depth)))
}

/** Where a ringed planet's pixel is. */
function orbit(x: number, y: number): Rgb {
  let color = mix([4, 8, 26], [12, 30, 64], y)
  const star = hash(Math.floor(x * 220), Math.floor(y * 220))
  if (star > 0.992) color = mix(color, [230, 240, 255], (star - 0.992) / 0.008)
  const cx = 0.56
  const cy = 0.58
  const dx = x - cx
  const dy = y - cy
  const r = Math.hypot(dx, dy)
  // The ring, an ellipse tilted a little; its far half behind the planet.
  const rx = dx * Math.cos(-0.35) - dy * Math.sin(-0.35)
  const ry = dx * Math.sin(-0.35) + dy * Math.cos(-0.35)
  const e = Math.hypot(rx / 0.46, ry / 0.12)
  const ring = (1 - smooth(0, 0.035, Math.abs(e - 1))) * 0.85
  const behind = ry < 0
  const inPlanet = 1 - smooth(0.285, 0.295, r)
  if (behind) color = mix(color, [120, 220, 230], ring)
  if (inPlanet > 0) {
    // Lit from the upper left, with bands of cloud.
    const light = clamp(0.55 - (dx * 1.4 + dy * 1.6))
    const cloud = 0.5 + 0.5 * Math.sin((dy * 5 + Math.sin(dx * 9) * 0.08) * 18)
    const surface = mix(
      mix([8, 60, 80], [40, 170, 170], light),
      [150, 240, 220],
      cloud * 0.25 * light,
    )
    color = mix(color, surface, inPlanet)
  }
  if (!behind) color = mix(color, [150, 235, 240], ring)
  // The atmosphere's rim.
  return mix(color, [80, 200, 255], 0.4 * (1 - smooth(0, 0.02, Math.abs(r - 0.29))))
}

/** The picture, `size` pixels square, as BGRA bytes. */
export function demoCoverPixels(cover: DemoCover, size: number): Uint8Array {
  const paint = cover === 'sunset' ? sunset : orbit
  const out = new Uint8Array(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const [r, g, b] = paint((px + 0.5) / size, (py + 0.5) / size)
      const at = (py * size + px) * 4
      out[at] = Math.round(b)
      out[at + 1] = Math.round(g)
      out[at + 2] = Math.round(r)
      out[at + 3] = 255
    }
  }
  return out
}
