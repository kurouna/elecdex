// ELECAIRCOMBAT's sprites besides the fighter: the HUD's marks (green, and red through another
// palette), tracers, missiles and flares, clouds and smoke, the sun and its flare.
// Explosions and debris are ELECLANCE's (scripts/eleclance/foes.mjs), whose fire palette this
// game's shares colour for colour.
import { bayer, Canvas, chance, each, fbm, ramp } from '../eleclance/draw.mjs'

/** The HUD palette: its dark edge and green ramp. */
const H = { edge: 1, g0: 2, g1: 3, g2: 4, g3: 5, g4: 6 }

/**
 * A line through the middle of an 8x8 cell at `deg` degrees (0 level, 90 upright, counted
 * anticlockwise as the eye sees), drawn as far as the cell's edges, two points wide where it
 * runs level, with its dark edge.
 */
function segment(deg) {
  const c = new Canvas(8, 8)
  const r = (deg * Math.PI) / 180
  const dx = Math.cos(r)
  const dy = -Math.sin(r)
  each(8, 8, (x, y) => {
    const px = x + 0.5 - 4
    const py = y + 0.5 - 4
    const d = Math.abs(px * dy - py * dx)
    if (d < 0.75) c.set(x, y, H.g3)
  })
  c.outline(H.edge)
  return c
}

/** The HUD's 8x8 marks: seventeen line angles (0 to 90 degrees), then the small marks. */
export function hudSmall() {
  const out = []
  for (let k = 0; k < 17; k++) out.push(segment(k * 5.625))
  const mark = (rows) => {
    const c = new Canvas(8, 8)
    c.grid(0, 0, rows, { '#': H.g3, o: H.g4 })
    c.outline(H.edge)
    return c
  }
  // 17 a tick, 18 the heading caret, 19 a box's corner (top left), 20 a blip, 21 a small
  // blip, 22 the pipper, 23 a dashed segment.
  out.push(mark(['', '...#', '...#', '...#', '...#']))
  out.push(mark(['', '.#####', '..###', '...#']))
  out.push(mark(['', '.######', '.#', '.#', '.#', '.#', '.#']))
  out.push(mark(['', '...#', '..#o#', '.#ooo#', '..#o#', '...#']))
  out.push(mark(['', '', '...##', '..#oo#', '...##']))
  out.push(mark(['', '', '', '...o', '', '', '']))
  out.push(mark(['', '', '', '', '##..##', '', '', '']))
  return out
}

/** The HUD's 16x16 marks: the gun cross, the lock's diamond (two), arrows (0-90 degrees). */
export function hudLarge() {
  const out = []
  const cross = new Canvas(16, 16)
  cross.grid(
    0,
    0,
    [
      '',
      '',
      '',
      '.......#',
      '.......#',
      '.......#',
      '',
      '..###.....###',
      '',
      '.......#',
      '.......#',
      '.......#',
    ],
    { '#': H.g3 },
  )
  cross.set(7, 7, H.g4)
  cross.outline(H.edge)
  out.push(cross)
  for (const r of [7, 6]) {
    const c = new Canvas(16, 16)
    for (let k = 0; k <= r; k++) {
      for (const [x, y] of [
        [7.5 - r + k, 7.5 - k],
        [7.5 + r - k, 7.5 - k],
        [7.5 - r + k, 7.5 + k],
        [7.5 + r - k, 7.5 + k],
      ]) {
        c.set(Math.floor(x), Math.floor(y), H.g3)
      }
    }
    c.set(7, 7, H.g4)
    c.set(8, 8, H.g4)
    c.outline(H.edge)
    out.push(c)
  }
  for (let k = 0; k < 5; k++) out.push(arrow(k * 22.5))
  return out
}

/** An arrowhead pointing `deg` degrees clockwise from the right (down the screen at 90). */
function arrow(deg) {
  const c = new Canvas(16, 16)
  const r = (deg * Math.PI) / 180
  const f = [Math.cos(r), Math.sin(r)]
  const s = [-f[1], f[0]]
  const at = (a, b) => [8 + f[0] * a + s[0] * b, 8 + f[1] * a + s[1] * b]
  c.poly([at(6, 0), at(-4, 5), at(-1.5, 0), at(-4, -5)], H.g3)
  c.outline(H.edge)
  return c
}

/** A quarter (the top left) of the missile seeker's circle, 64 points across. */
export function seekerQuarter() {
  const c = new Canvas(32, 32)
  each(32, 32, (x, y) => {
    const d = Math.hypot(x + 0.5 - 32, y + 0.5 - 32)
    if (Math.abs(d - 30) < 0.7) c.set(x, y, H.g3)
  })
  // Ticks at 45 degrees and on the axes' ends.
  c.line(9, 9, 11, 11, H.g3)
  c.outline(H.edge)
  return c
}

/** The shot palette: amber tracer, white, steel, burner, blue, red. */
const S = { a0: 1, a1: 2, a2: 3, a3: 4, w0: 5, w1: 6, steel: 7, dark: 8, o0: 9, o1: 10 }

/**
 * Tracers (four, near to far), a missile seen from behind (two: its burner flickers), a flare
 * (two), the muzzle's flash (two, 8x8 halves are drawn as one 16x16 below).
 */
export function shots() {
  const out = []
  const glow = (r, core) => {
    const c = new Canvas(8, 8)
    each(8, 8, (x, y) => {
      const d = Math.hypot(x + 0.5 - 4, y + 0.5 - 4)
      if (d < r * 0.45) c.set(x, y, core)
      else if (d < r * 0.75) c.set(x, y, S.a3)
      else if (d < r) c.set(x, y, S.a2)
    })
    return c
  }
  out.push(glow(3.9, S.w1), glow(3, S.w0), glow(2.1, S.a3), glow(1.2, S.a3))
  for (const hot of [S.w1, S.w0]) {
    const c = new Canvas(8, 8)
    c.grid(0, 0, ['', '...ss', '..sOOs', '..sOOs', '...ss'], { s: S.steel, O: S.o1 })
    c.set(3, 2, hot)
    c.set(4, 3, hot)
    out.push(c)
  }
  for (const r of [3.6, 2.8]) out.push(glow(r, S.w1))
  return out
}

/** The cloud palette's ramp, shadow to sunlit. */
const CLOUD = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const SMOKE = [11, 12, 13, 14, 15]

/** A cloud `w` by `h`: lumps of noise inside a soft ellipse, lit from above. */
function cloud(w, h, seed) {
  const n = fbm(seed, 4)
  const c = new Canvas(w, h)
  const lumps = Array.from({ length: 5 }, (_, k) => {
    const rnd = chance(seed * 31 + k)
    return [w * (0.2 + rnd() * 0.6), h * (0.45 + rnd() * 0.2), w * (0.18 + rnd() * 0.14)]
  })
  each(w, h, (x, y) => {
    let inside = 0
    for (const [lx, ly, lr] of lumps) {
      const d = Math.hypot((x + 0.5 - lx) / lr, ((y + 0.5 - ly) / lr) * 1.3)
      inside = Math.max(inside, 1 - d)
    }
    // A flat base, as a fair-weather cloud has.
    if (y > h * 0.8) inside = Math.min(inside, (h - y) / (h * 0.2) - 0.2)
    const edge = n(x * (6 / w), y * (6 / h)) * 0.35
    if (inside + edge < 0.32 + bayer(x, y) * 0.12) return
    const lit = 1 - y / h + n(x * (9 / w) + 3, y * (9 / h)) * 0.5 - 0.15
    c.set(x, y, ramp(CLOUD, lit, x, y))
  })
  return c
}

/** Clouds: two big ones (64x32, as two 32-point halves), then 32, 16 and 8 points, two each. */
export function clouds() {
  const big = [cloud(64, 32, 11), cloud(64, 32, 23)]
  const halves = []
  for (const b of big) {
    for (const x0 of [0, 32]) {
      const c = new Canvas(32, 32)
      each(32, 32, (x, y) => c.set(x, y, b.get(x0 + x, y)))
      halves.push(c)
    }
  }
  return {
    big: halves,
    mid: [cloud(32, 24, 5), cloud(32, 20, 9)].map((c) => pad(c, 32)),
    small: [cloud(16, 12, 3), cloud(16, 10, 7)].map((c) => pad(c, 16)),
    tiny: [cloud(8, 6, 2), cloud(8, 5, 4)].map((c) => pad(c, 8)),
  }
}

/** A picture centred in a square of `size`. */
function pad(c, size) {
  const out = new Canvas(size, size)
  out.blit(c, Math.floor((size - c.w) / 2), Math.floor((size - c.h) / 2))
  return out
}

/** Smoke puffs (16x16): four frames, dense and dark to wide and thin. */
export function smoke() {
  const out = []
  const n = fbm(41, 3)
  for (let f = 0; f < 4; f++) {
    const c = new Canvas(16, 16)
    const r = 3 + f * 1.6
    each(16, 16, (x, y) => {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8) / r
      const b = n(x * 0.4 + f, y * 0.4)
      if (d > 0.8 + b * 0.4) return
      if (f >= 2 && bayer(x, y) < (f - 1) * 0.3) return
      c.set(x, y, ramp(SMOKE, 1 - d * 0.6 - f * 0.12 + b * 0.3, x, y))
    })
    out.push(c)
  }
  return out
}

/** The sun palette: gold ramp to white, then the flare's tints. */
const SUN = [1, 2, 3, 4, 5, 6, 7]

/** The sun (32x32) and the flare's ghosts: a ring and a disc (16x16), a speck (two of 8x8). */
export function sun() {
  const disc = new Canvas(32, 32)
  each(32, 32, (x, y) => {
    const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16)
    const rays = Math.abs(Math.sin(Math.atan2(y + 0.5 - 16, x + 0.5 - 16) * 4))
    if (d < 6) disc.set(x, y, 7)
    else if (d < 9) disc.set(x, y, ramp(SUN, 1.15 - (d - 6) / 6, x, y))
    else if (d < 15 && rays > 0.92 && bayer(x, y) < 1.4 - d / 12) disc.set(x, y, 4)
  })
  const ring = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8)
    if (Math.abs(d - 6) < 0.8 && bayer(x, y) < 0.7) ring.set(x, y, 10)
  })
  const ghost = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8)
    if (d < 5 && bayer(x, y) < 0.5) ghost.set(x, y, d < 3 ? 15 : 14)
  })
  const ghost2 = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8)
    if (d < 6 && bayer(x, y) < 0.4) ghost2.set(x, y, d < 3 ? 13 : 12)
  })
  return { disc, ghosts: [ring, ghost, ghost2] }
}
