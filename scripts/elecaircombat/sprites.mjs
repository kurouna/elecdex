// ELECAIRCOMBAT's sprites besides the fighter: the HUD's marks (green, and red through another
// palette), tracers, missiles and flares, clouds and smoke, the sun and its flare.
// Explosions and debris are drawn here too, in the fire palette (which ELECLANCE's shares
// colour for colour).
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
/** The shot palette's glow, dark amber out to white at the core. */
const GLOW = [S.a0, S.a1, S.a2, S.a3, S.w0, S.w1]

/**
 * A round glow of `size` points: `level` at a distance from its centre (0 the centre) through
 * `colours`, its fringe dithered thin so it fades into the sky instead of ending in a rim.
 */
function glowOf(size, colours, level, cx = size / 2, cy = size / 2) {
  const c = new Canvas(size, size)
  each(size, size, (x, y) => {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
    const v = level(d, x, y)
    if (v <= 0) return
    if (v < 0.22 && bayer(x, y) > v * 4.5) return
    c.set(x, y, ramp(colours, v, x, y))
  })
  return c
}

/**
 * Tracers (four, near to far: a white-hot core in an amber glow that thins at its edge, the
 * far ones a hard bright point), a missile seen from behind (two: a steel ring round its
 * burner, the flame flickering larger and smaller), a flare (two: a white star whose rays
 * turn between the frames).
 */
export function shots() {
  const out = []
  for (const [r, hot] of [
    [3.9, 1.25],
    [3.1, 1.2],
    [2.3, 1.15],
    [1.5, 1.4],
  ]) {
    out.push(glowOf(8, GLOW, (d) => (d < r ? hot * (1 - d / r) ** 0.8 : 0)))
  }
  for (const flame of [3.6, 2.7]) {
    const c = new Canvas(8, 8)
    each(8, 8, (x, y) => {
      const v = missilePoint(Math.hypot(x + 0.5 - 4, y + 0.5 - 4), flame, x, y)
      if (v !== 0) c.set(x, y, v)
    })
    out.push(c)
  }
  for (const turn of [0, Math.PI / 4]) {
    out.push(
      glowOf(8, GLOW, (d, x, y) => {
        const a = Math.atan2(y + 0.5 - 4, x + 0.5 - 4) - turn
        const ray = Math.abs(Math.cos(a * 2)) ** 8
        return Math.max(1.3 - d / 1.6, ray * (1.1 - d / 4.2))
      }),
    )
  }
  return out
}

/** A missile from behind at distance `d` from its middle: burner, steel ring, flame. */
function missilePoint(d, flame, x, y) {
  if (d < 1.1) return S.w1
  if (d < 1.8) return S.w0
  if (d < 2.6) return (x + y) & 1 ? S.steel : S.o1
  if (d < flame && bayer(x, y) < (flame - d) * 1.2) return S.o0
  return 0
}

/** The fire palette's ramp: dark red, orange, yellow, white. */
const FIRE = [1, 2, 3, 4, 5, 6, 7, 8, 9]
/** Its smoke, dark to light. */
const ASH = [10, 11, 12, 13]

/**
 * A burst's flash (16x16, three frames, each smaller): a white core, four long rays and four
 * short ones, and a faint halo round it - a missile's burst or a launch reads as a point of
 * light at any distance.
 */
export function bursts() {
  const out = []
  for (let f = 0; f < 3; f++) {
    const c = new Canvas(16, 16)
    const core = 3.6 - f * 0.9
    const ray = 7.8 - f * 2
    each(16, 16, (x, y) => {
      const level = burstLevel(Math.abs(x + 0.5 - 8), Math.abs(y + 0.5 - 8), core, ray)
      if (level <= 0.06) return
      if (level < 0.3 && bayer(x, y) > level * 3) return
      c.set(x, y, ramp(FIRE, level, x, y))
    })
    out.push(c)
  }
  return out
}

/** A burst's light at (dx, dy) from its middle: the core, the long and short rays, the halo. */
function burstLevel(dx, dy, core, ray) {
  const d = Math.hypot(dx, dy)
  const along = Math.min(dx, dy) < 0.8 ? Math.max(dx, dy) / ray : 9
  const diag = Math.abs(dx - dy) < 0.8 ? (d * 1.6) / ray : 9
  const halo = d < core * 1.9 ? 0.45 - d / (core * 4.5) : 0
  return Math.max(1.3 - d / core, 1.05 - along, 0.9 - diag, halo)
}

/** How far a ragged star reaches at angle `a`: its core, or the ray nearest that way. */
function reachOf(rays, a) {
  let reach = 2.6
  for (const [ra, len] of rays) {
    const off = Math.abs(Math.atan2(Math.sin(a - ra), Math.cos(a - ra)))
    if (off < 0.42) reach = Math.max(reach, len * (1 - off / 0.42) ** 0.7)
  }
  return reach
}

/**
 * The gun's muzzle flash (16x16, two): a ragged star, white at the heart through yellow and
 * amber to an orange tip on each ray.
 */
export function muzzle() {
  const out = []
  for (const seed of [3, 8]) {
    const c = new Canvas(16, 16)
    const rnd = chance(seed)
    const rays = Array.from({ length: 7 }, (_, k) => [
      ((k + rnd() * 0.6) / 7) * Math.PI * 2,
      4.5 + rnd() * 3.2,
    ])
    each(16, 16, (x, y) => {
      const dx = x + 0.5 - 8
      const dy = y + 0.5 - 8
      const d = Math.hypot(dx, dy)
      const reach = reachOf(rays, Math.atan2(dy, dx))
      if (d <= reach) c.set(x, y, muzzleColour(d, d / reach, x, y))
    })
    out.push(c)
  }
  return out
}

/** A muzzle flash's colour at distance `d`, `t` of the way out along its ray. */
function muzzleColour(d, t, x, y) {
  if (d < 1.6) return S.w1
  if (t < 0.4) return S.w0
  if (t < 0.62) return S.a3
  if (t < 0.82) return S.o1
  return bayer(x, y) < 0.6 ? S.o0 : S.a2
}

/**
 * An explosion of `size` points, `count` frames: a white flash, a ball of fire that swells -
 * white-hot at its heart, lit from above, its underside darker - then breaks into billows of
 * smoke with embers in them, thinning away.
 */
export function fireball(size, count, seed) {
  const n = fbm(seed, 4)
  const crumble = fbm(seed + 17, 2)
  const embers = chance(seed * 7 + 1)
  const out = []
  for (let f = 0; f < count; f++) {
    const t = f / (count - 1)
    const c = new Canvas(size, size)
    const radius = (size / 2 - 1) * (0.42 + 0.58 * Math.sqrt(t))
    const heat = Math.max(0, 1 - t * 1.2)
    const fade = Math.max(0, (t - 0.55) / 0.55)
    const frame = { n, crumble, embers, f, t, radius, heat, fade }
    each(size, size, (x, y) => {
      const v = fireballPoint(frame, size, x, y)
      if (v !== 0) c.set(x, y, v)
    })
    out.push(c)
  }
  return out
}

/** A point of an explosion's frame: fire by its heat, smoke (with embers) where it cooled. */
function fireballPoint(frame, size, x, y) {
  const { n, crumble, embers, f, t, radius, heat, fade } = frame
  const dx = (x + 0.5 - size / 2) / radius
  const dy = (y + 0.5 - size / 2) / radius
  const d = Math.hypot(dx, dy)
  const billow = n(x * (6 / size) + f * 0.35, y * (6 / size) - f * 0.3)
  const edge = 0.68 + 0.46 * billow
  if (d > edge) return 0
  // Thinning: the old smoke breaks up into wisps, from its edge in.
  if (fade > 0 && crumble(x * 0.8 + f, y * 0.8) < fade * 1.1 - (1 - d) * 0.3) return 0
  const inner = 1 - d / edge
  // Lit from above: the top glows, the underside is the darker side.
  const lit = -dy * 0.22 - dx * 0.08
  const level = (inner * 0.95 + billow * 0.3 + lit) * heat * 1.45 + (f === 0 ? 0.7 : 0)
  if (level >= 0.2 || t <= 0.25) return ramp(FIRE, level, x, y)
  if (t < 0.75 && embers() < 0.04 * heat + 0.02) return FIRE[5]
  return ramp(ASH, billow * 0.9 + lit * 1.6 + 0.15 - t * 0.35, x, y)
}

/**
 * Debris (8x8, four tumbling pieces: grey metal lit on one edge, burning on another) and
 * sparks (8x8, two: a white point with four rays).
 */
export function debris() {
  const out = []
  const shapes = [
    ['.mm....', 'mMMh...', '.mMMo..', '..mo...'],
    ['..m....', '.mMh...', '.MMm...', '.oo....'],
    ['...mm..', '..mMh..', '.mMo...', '.o.....'],
    ['.m.....', 'mMh....', '.mMMm..', '...o...'],
  ]
  for (const rows of shapes) {
    const c = new Canvas(8, 8)
    c.grid(2, 2, rows, { m: ASH[2], M: ASH[3], h: FIRE[6], o: FIRE[4] })
    c.outline(FIRE[0])
    out.push(c)
  }
  for (const r of [1.6, 2.7]) {
    const c = new Canvas(8, 8)
    each(8, 8, (x, y) => {
      const dx = Math.abs(x + 0.5 - 4)
      const dy = Math.abs(y + 0.5 - 4)
      const along = Math.min(dx, dy) < 0.6 ? 1 - Math.max(dx, dy) / (r + 0.6) : 0
      const level = Math.max(1.1 - Math.hypot(dx, dy) / 1.2, along)
      if (level > 0.05) c.set(x, y, ramp(FIRE.slice(4), level, x, y))
    })
    out.push(c)
  }
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

/**
 * A puff of `size` points and radius `r`: three lumps of noise, lit from above (`colours`
 * dark to light), its underside in shade and its fringe dithered thin; `thin` 0-1 breaks it
 * up as it ages.
 */
function puffOf(size, r, seed, colours, light, thin) {
  const c = new Canvas(size, size)
  const n = fbm(seed, 3)
  const crumble = fbm(seed + 29, 2)
  const h = size / 2
  const rnd = chance(seed)
  const lumps = Array.from({ length: 3 }, () => [
    h + (rnd() - 0.5) * r * 0.8,
    h + (rnd() - 0.5) * r * 0.6,
    r * (0.62 + rnd() * 0.25),
  ])
  each(size, size, (x, y) => {
    let inside = -1
    let top = 0
    for (const [lx, ly, lr] of lumps) {
      const dx = (x + 0.5 - lx) / lr
      const dy = (y + 0.5 - ly) / lr
      const v = 1 - Math.hypot(dx, dy)
      if (v > inside) {
        inside = v
        top = -dy * 0.6 - dx * 0.25
      }
    }
    const b = n(x * (4 / size) * 2, y * (4 / size) * 2)
    const v = inside + (b - 0.5) * 0.35
    if (v <= 0) return
    if (v < 0.18 && bayer(x, y) > v * 5) return
    if (thin > 0 && crumble(x * 0.9, y * 0.9) < thin * (1.15 - v)) return
    c.set(x, y, ramp(colours, light + top * 0.55 + v * 0.25 + (b - 0.5) * 0.3, x, y))
  })
  return c
}

/** Smoke puffs (16x16): four frames, dense and dark to wide and thin. */
export function smoke() {
  return [0, 1, 2, 3].map((f) =>
    puffOf(16, 3.6 + f * 1.4, 41 + f, SMOKE, 0.45 - f * 0.05, f * 0.17),
  )
}

/**
 * A missile's smoke trail: soft white puffs lit from above, in shade beneath, in the cloud
 * palette (so they take the hour's light as the clouds do) - two of 16 points and four of 8,
 * largest first.
 */
export function trail() {
  return {
    big: [puffOf(16, 6.2, 51, CLOUD, 0.62, 0), puffOf(16, 4.8, 52, CLOUD, 0.55, 0.25)],
    small: [
      puffOf(8, 3.6, 53, CLOUD, 0.62, 0),
      puffOf(8, 2.9, 54, CLOUD, 0.58, 0),
      puffOf(8, 2.2, 55, CLOUD, 0.55, 0.15),
      puffOf(8, 1.6, 56, CLOUD, 0.5, 0.3),
    ],
  }
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
