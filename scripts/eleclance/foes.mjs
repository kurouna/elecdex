// ELECLANCE's enemies, bullets, explosions and pickups (palettes `enemy`, `heavy`, `bullet`,
// `fire`, `item`). Drawn from shapes and light, mirrored where a machine is symmetric.
import { Canvas, chance, each, fbm, ramp } from './draw.mjs'

/** `enemy`: outline, gunmetal ramp, teal ramp, red eye ramp, warm lights. */
const E = {
  k: 1,
  g1: 2,
  g2: 3,
  g3: 4,
  g4: 5,
  g5: 6,
  t1: 7,
  t2: 8,
  t3: 9,
  r1: 10,
  r2: 11,
  r3: 12,
  a: 13,
  A: 14,
  dk: 15,
}
const GUN = [E.g1, E.g2, E.g3, E.g4, E.g5]
const TEAL = [E.t1, E.t2, E.t3]
const RED = [E.r1, E.r2, E.r3, E.a, E.A]

/** A sphere's light from the top left (0-1) at a normal. */
const lit = (nx, ny, nz) =>
  Math.max(0, Math.min(1, 0.35 + 0.65 * (-0.45 * nx - 0.55 * ny + 0.7 * nz)))

/** MOTE: a small drone - a gunmetal ball with a red eye, four fins turning (four frames). */
export function moteFrames() {
  return [0, 1, 2, 3].map((f) => {
    const c = new Canvas(16, 16)
    const turn = (f * Math.PI) / 8
    for (let k = 0; k < 4; k++) {
      const a = turn + (k * Math.PI) / 2
      const x = 7.5 + Math.cos(a) * 6.2
      const y = 7.5 + Math.sin(a) * 6.2
      c.ellipse(x, y, 1.8, 1.8, (nx, ny, nz) =>
        ramp(TEAL, lit(nx, ny, nz), Math.round(x), Math.round(y)),
      )
    }
    c.ellipse(7.5, 7.5, 5, 5, (nx, ny, nz, x, y) => ramp(GUN, lit(nx, ny, nz), x, y))
    const glow = [E.r2, E.r3, E.a, E.r3][f]
    c.ellipse(7.5, 8, 2.2, 2.2, (_nx, _ny, nz) => (nz > 0.7 ? E.A : glow))
    c.outline(E.k)
    return c
  })
}

/** DART: a diving interceptor pointing down, banked and level (the game flips for the other way). */
export function dartFrames() {
  const half = [
    'kkk.....',
    'k54kk...',
    '.k543kkk',
    '.k5443tk',
    '..k443Tk',
    '..k3432k',
    '...k332r',
    '...k322r',
    '....k22R',
    '....k21R',
    '.....k1k',
    '.....k1k',
    '......kk',
    '.......k',
  ]
  const key = {
    k: E.k,
    1: E.g1,
    2: E.g2,
    3: E.g3,
    4: E.g4,
    5: E.g5,
    t: E.t2,
    T: E.t3,
    r: E.r2,
    R: E.r3,
  }
  const level = new Canvas(16, 16)
  level.grid(0, 1, half, key)
  level.mirrorX()
  for (let y = 0; y < 16; y++) {
    for (let x = 9; x < 16; x++) {
      const k = GUN.indexOf(level.get(x, y))
      if (k > 0) level.set(x, y, GUN[k - 1])
    }
  }
  const banked = new Canvas(16, 16)
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const sx = x < 8 ? 7.5 - (7.5 - x) / 0.7 : x
      if (sx >= 0) banked.set(x, y, level.get(Math.round(sx), y))
    }
  }
  return [banked, level]
}

/** PIKE: a turret pod - a hexagonal plate, a dome that opens to fire (two frames). */
export function pikeFrames() {
  return [0, 1].map((f) => {
    const c = new Canvas(16, 16)
    c.poly(
      [
        [4, 1],
        [11.9, 1],
        [15.5, 8],
        [11.9, 15],
        [4, 15],
        [0.5, 8],
      ],
      E.g3,
    )
    c.bevel(E.g3, E.g5, E.g1)
    c.rect(2, 7, 12, 2, E.g2)
    c.ellipse(7.5, 8, 4.2, 4.2, (nx, ny, nz, x, y) =>
      ramp(f === 0 ? TEAL : RED, lit(nx, ny, nz), x, y),
    )
    if (f === 1) c.ellipse(7.5, 8, 1.8, 1.8, E.A)
    c.outline(E.k)
    return c
  })
}

/** `heavy`: outline, crimson ramp, purple ramp, gold, hot orange, white, cyan light. */
export const H = {
  k: 1,
  c1: 2,
  c2: 3,
  c3: 4,
  c4: 5,
  c5: 6,
  p1: 7,
  p2: 8,
  p3: 9,
  o1: 10,
  o2: 11,
  o3: 12,
  hot: 13,
  wh: 14,
  cy: 15,
}
export const CRIMSON = [H.c1, H.c2, H.c3, H.c4, H.c5]
export const PURPLE = [H.p1, H.p2, H.p3]
export const GOLD = [H.o1, H.o2, H.o3]

/**
 * A hull plate: the polygon filled with a ramp lit from the top left by its own shape's
 * centre, bevelled edges, panel lines and lamps; drawn on the left half to be mirrored.
 */
export function hull(c, points, ramp_, rnd, lamps = 0) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const rx = (Math.max(...xs) - Math.min(...xs)) / 2 + 1
  const ry = (Math.max(...ys) - Math.min(...ys)) / 2 + 1
  const mark = 200
  c.poly(points, mark)
  each(c.w, c.h, (x, y) => {
    if (c.get(x, y) !== mark) return
    const nx = (x - cx) / rx
    const ny = (y - cy) / ry
    // Clean bands, not dithered: plates read as metal, not grain.
    const level = Math.max(0, Math.min(0.999, 0.6 - 0.35 * nx - 0.45 * ny))
    c.set(x, y, ramp_[Math.floor(level * ramp_.length)])
  })
  // Panel lines across, in the darkest of the ramp.
  for (let k = 0; k < 2; k++) {
    const y = Math.round(Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * (0.35 + 0.3 * k))
    for (let x = Math.ceil(Math.min(...xs)); x <= Math.max(...xs); x++) {
      if (ramp_.includes(c.get(x, y)) && rnd() < 0.85) c.set(x, y, ramp_[0])
    }
  }
  for (let k = 0; k < lamps; k++) {
    const x = Math.round(cx + (rnd() - 0.5) * rx)
    const y = Math.round(cy + (rnd() - 0.5) * ry)
    if (ramp_.includes(c.get(x, y))) c.set(x, y, H.cy)
  }
}

/** HALBERD: a gunship, 32x32 - twin hulls round a hot engine, two guns. Two frames (engine). */
export function halberdFrames() {
  return [0, 1].map((f) => {
    const rnd = chance(11)
    const c = new Canvas(32, 32)
    hull(
      c,
      [
        [4, 6],
        [11, 2],
        [14, 10],
        [14, 27],
        [9, 30],
        [3, 22],
      ],
      CRIMSON,
      rnd,
      2,
    )
    hull(
      c,
      [
        [10, 12],
        [16, 9],
        [16, 25],
        [12, 26],
      ],
      PURPLE,
      rnd,
    )
    c.rect(5, 26, 3, 5, H.p1)
    c.mirrorX()
    c.ellipse(15.5, 14, 3, 5, (_nx, _ny, nz) =>
      nz > 0.7 ? H.wh : nz > 0.4 ? (f ? H.o3 : H.hot) : H.o2,
    )
    c.outline(H.k)
    return c
  })
}

/** WARDEN: a carrier, 32x32 - a broad armoured back with a bay that opens (two frames). */
export function wardenFrames() {
  return [0, 1].map((f) => {
    const rnd = chance(23)
    const c = new Canvas(32, 32)
    hull(
      c,
      [
        [1, 10],
        [6, 4],
        [16, 2],
        [16, 30],
        [8, 28],
        [2, 20],
      ],
      PURPLE,
      rnd,
      3,
    )
    hull(
      c,
      [
        [6, 8],
        [16, 6],
        [16, 18],
        [8, 20],
      ],
      CRIMSON,
      rnd,
    )
    for (let y = 22; y < 28; y += 2) c.rect(6, y, 10, 1, GOLD[1])
    c.mirrorX()
    c.rect(12, 9, 8, 7, f ? H.hot : H.c1)
    if (f) c.rect(14, 11, 4, 3, H.wh)
    c.outline(H.k)
    return c
  })
}

/** Rocks: a big one (32x32) and a small one (16x16), two turns each, gunmetal and rust. */
export function rockFrames() {
  const out = []
  for (const [size, seed] of [
    [32, 5],
    [32, 6],
    [16, 7],
    [16, 8],
  ]) {
    const c = new Canvas(size, size)
    const n = fbm(seed, 3)
    each(size, size, (x, y) => rockPoint(c, n, x, y))
    c.outline(E.k)
    out.push(c)
  }
  return out
}

/** A point of a rock: inside a lumpy edge, lit as a ball, darker in its craters. */
function rockPoint(c, n, x, y) {
  const size = c.w
  const r = size / 2 - 1.5
  const dx = (x + 0.5 - size / 2) / r
  const dy = (y + 0.5 - size / 2) / r
  const a = Math.atan2(dy, dx)
  const edge = 0.78 + 0.22 * n(Math.cos(a) * 1.5 + 3, Math.sin(a) * 1.5 + 3)
  const d = Math.hypot(dx, dy)
  if (d > edge) return
  const nz = Math.sqrt(Math.max(0, 1 - (d / edge) ** 2))
  const crater = n(x * 0.35, y * 0.35)
  const level =
    lit(dx / edge, dy / edge, nz) - (crater > 0.62 ? 0.3 : 0) + (crater < 0.3 ? 0.08 : 0)
  c.set(x, y, ramp([E.dk, E.g1, E.g2, E.g3, E.g4], level, x, y))
}

/** `bullet`: pink ramp to a white core, blue ramp, amber ramp. */
const B = {
  k: 15,
  p1: 1,
  p2: 2,
  p3: 3,
  p4: 4,
  p5: 5,
  w: 6,
  b1: 7,
  b2: 8,
  b3: 9,
  b4: 10,
  a1: 11,
  a2: 12,
  a3: 13,
  a4: 14,
}

/** Bullets: round 8x8 in pink, blue and amber, two pulses each; then 16x16 orbs, pink and blue. */
export function bulletFrames() {
  const small = []
  const big = []
  const sets = [
    [B.p2, B.p3, B.p4, B.p5],
    [B.b2, B.b3, B.b4, B.w],
    [B.a2, B.a3, B.a4, B.w],
  ]
  for (const ring of sets) {
    for (const r of [3.3, 3.8]) {
      const c = new Canvas(8, 8)
      c.ellipse(3.5, 3.5, r, r, (_nx, _ny, nz) =>
        nz > 0.85 ? B.w : nz > 0.6 ? ring[3] : nz > 0.35 ? ring[2] : ring[1],
      )
      small.push(c)
    }
  }
  // A needle: from along +x to straight down by sixteenths of a turn; the game flips the rest.
  for (const angle of [0, Math.PI / 8, Math.PI / 4, (3 * Math.PI) / 8, Math.PI / 2]) {
    const c = new Canvas(8, 8)
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    for (let t = -3.5; t <= 3.5; t += 0.25) {
      const x = 3.5 + dx * t
      const y = 3.5 + dy * t
      c.set(x, y, Math.abs(t) < 1.5 ? B.w : B.p4)
      c.set(x - dy * 0.9, y + dx * 0.9, B.p3)
    }
    small.push(c)
  }
  for (const ring of sets.slice(0, 2)) {
    for (const r of [6.6, 7.5]) {
      const c = new Canvas(16, 16)
      c.ellipse(7.5, 7.5, r, r, (_nx, _ny, nz) =>
        nz > 0.8 ? B.w : nz > 0.55 ? ring[3] : nz > 0.3 ? ring[2] : ring[1],
      )
      big.push(c)
    }
  }
  return { small, big }
}

/** `fire`: dark reds through yellow to white; smoke greys. */
const F = {
  d1: 1,
  d2: 2,
  r1: 3,
  r2: 4,
  o1: 5,
  o2: 6,
  y1: 7,
  y2: 8,
  w: 9,
  s1: 10,
  s2: 11,
  s3: 12,
  s4: 13,
}
const FIRE = [F.d1, F.d2, F.r1, F.r2, F.o1, F.o2, F.y1, F.y2, F.w]
const SMOKE = [F.s1, F.s2, F.s3]

/**
 * An explosion of `size` points, `count` frames: a white flash, a ball of fire that swells
 * and breaks into billows, then smoke thinning away.
 */
export function blastFrames(size, count, seed) {
  const n = fbm(seed, 4)
  const out = []
  for (let f = 0; f < count; f++) {
    const t = f / (count - 1)
    const c = new Canvas(size, size)
    const radius = (size / 2 - 1) * (0.35 + 0.65 * Math.sqrt(t))
    const heat = Math.max(0, 1 - t * 1.25)
    const hole = t > 0.45 ? (t - 0.45) * 1.6 : 0
    const frame = { n, f, t, radius, heat, hole }
    each(size, size, (x, y) => blastPoint(c, frame, x, y))
    out.push(c)
  }
  return out
}

/** A point of an explosion's frame: fire by heat, smoke where it has cooled, a hole growing. */
function blastPoint(c, frame, x, y) {
  const { n, f, t, radius, heat, hole } = frame
  const size = c.w
  const dx = (x + 0.5 - size / 2) / radius
  const dy = (y + 0.5 - size / 2) / radius
  const d = Math.hypot(dx, dy)
  const billow = n(x * (5 / size) + f * 0.3, y * (5 / size) - f * 0.2)
  const edge = 0.7 + 0.45 * billow
  if (d > edge || d < hole * (0.6 + 0.6 * billow)) return
  const core = (1 - d / edge) * 0.9 + billow * 0.35
  const level = core * heat * 1.4 + (f === 0 ? 0.6 : 0)
  if (level < 0.12 && t > 0.3) c.set(x, y, ramp(SMOKE, billow * (1 - t) * 1.6, x, y))
  else c.set(x, y, ramp(FIRE, level, x, y))
}

/** Debris (8x8, four tumbling bits) and sparks (8x8, two). */
export function bitFrames() {
  const out = []
  const shapes = [
    ['.ss....', 'sSSs...', '.sSSs..', '..ss...'],
    ['..s....', '.sSs...', '.SSs...', '.ss....'],
    ['...ss..', '..sSS..', '.sSs...', '.s.....'],
    ['.s.....', 'sSs....', '.sSSs..', '...s...'],
  ]
  for (const rows of shapes) {
    const c = new Canvas(8, 8)
    c.grid(2, 2, rows, { s: F.s2, S: F.o2 })
    out.push(c)
  }
  for (const r of [1.5, 2.5]) {
    const c = new Canvas(8, 8)
    c.line(3.5 - r, 3.5, 3.5 + r, 3.5, F.y2)
    c.line(3.5, 3.5 - r, 3.5, 3.5 + r, F.y2)
    c.set(3.5, 3.5, F.w)
    out.push(c)
  }
  return out
}

/** `item`: gold ramp, white, cyan ramp, emerald ramp and its dark edge. */
const I = {
  g1: 1,
  g2: 2,
  g3: 3,
  g4: 4,
  g5: 5,
  w: 6,
  c1: 7,
  c2: 8,
  c3: 9,
  c4: 10,
  m1: 11,
  m2: 12,
  m3: 13,
  m4: 14,
  e1: 11,
  e2: 12,
  e3: 13,
  e4: 14,
  ek: 15,
}

/**
 * Stars to pick up: an emerald cut as a diamond (8x8), a glint sweeping across it over four
 * frames - green, which no bullet is; then the sparkles a cancelled bullet makes.
 */
export function starFrames() {
  const out = []
  const gem = ['...k....', '..kek...', '.ke3ek..', 'ke332ek.', '.k221k..', '..k1k...', '...k....']
  const key = { k: I.ek, e: I.e4, 3: I.e3, 2: I.e2, 1: I.e1 }
  for (let f = 0; f < 4; f++) {
    const c = new Canvas(8, 8)
    c.grid(0, 0, gem, key)
    // The glint: a white point moving down the left face, then gone.
    const glint = [[3, 2], [2, 3], [3, 4], null][f]
    if (glint) c.set(glint[0], glint[1], I.w)
    out.push(c)
  }
  for (let f = 0; f < 2; f++) {
    const c = new Canvas(8, 8)
    const r = 1 + f * 2
    c.line(3.5 - r, 3.5, 3.5 + r, 3.5, I.c3)
    c.line(3.5, 3.5 - r, 3.5, 3.5 + r, I.c3)
    c.set(3.5, 3.5, I.w)
    if (f === 1)
      for (const [x, y] of [
        [1, 1],
        [6, 1],
        [1, 6],
        [6, 6],
      ])
        c.set(x, y, I.c2)
    out.push(c)
  }
  return out
}

/** The bomb's ring: a quarter (16x16) of a ring of light, four sizes; the game flips it into four. */
export function ringFrames() {
  return [0, 1, 2, 3].map((f) => {
    const c = new Canvas(16, 16)
    const r = 5 + f * 3.3
    each(16, 16, (x, y) => {
      const d = Math.hypot(15.5 - x, 15.5 - y)
      const band = Math.abs(d - r)
      if (band < 0.8) c.set(x, y, I.w)
      else if (band < 1.6) c.set(x, y, I.c4)
      else if (band < 2.4 && d < r) c.set(x, y, I.c3)
    })
    return c
  })
}

/** Distant stars that drift behind the backgrounds (8x8, three sizes), in `item`'s cyan. */
export function farStarFrames() {
  return [0, 1, 2].map((f) => {
    const c = new Canvas(8, 8)
    c.set(3, 3, f === 2 ? I.w : I.c3)
    if (f >= 1) {
      c.set(2, 3, I.c1)
      c.set(4, 3, I.c1)
      c.set(3, 2, I.c1)
      c.set(3, 4, I.c1)
    }
    return c
  })
}

/** The pickups, 16x16, two glints each: a bomb (B, cyan), an extra ship (1, emerald), power (P, gold). */
export function pickupFrames() {
  const out = []
  const glyphs = {
    B: ['wwww.', 'w...w', 'wwww.', 'w...w', 'wwww.'],
    1: ['.ww..', 'www..', '.ww..', '.ww..', 'wwww.'],
    P: ['wwww.', 'w...w', 'wwww.', 'w....', 'w....'],
  }
  for (const [colour, mark] of [
    [[I.c1, I.c2, I.c3, I.c4], 'B'],
    [[I.e1, I.e2, I.e3, I.e4], '1'],
    [[I.g2, I.g3, I.g4, I.g5], 'P'],
  ]) {
    for (let f = 0; f < 2; f++) out.push(pickup(colour, glyphs[mark], f))
  }
  return out
}

function pickup(colour, glyph, f) {
  const c = new Canvas(16, 16)
  c.ellipse(7.5, 7.5, 7, 7, (nx, ny, nz, x, y) =>
    ramp(colour, lit(nx, ny, nz) + (f ? 0.15 : 0), x, y),
  )
  c.grid(6, 5, glyph, { w: I.w })
  c.outline(I.ek)
  return c
}

/** PRISM: a crystal that turns, four frames (palette `heavy`): the lance glances off it. */
export function prismFrames() {
  return [0, 1, 2, 3].map((f) => {
    const c = new Canvas(16, 16)
    const turn = (f * Math.PI) / 8
    const pts = [0, 1, 2, 3, 4, 5].map((k) => {
      const a = turn + (k * Math.PI) / 3
      const r = k % 2 === 0 ? 7 : 5
      return [7.5 + Math.cos(a) * r + 0.5, 7.5 + Math.sin(a) * r * 0.85 + 0.5]
    })
    c.poly(pts, H.p2)
    c.bevel(H.p2, H.p3, H.p1)
    // Facets: lines from the centre to every other corner, a cyan heart.
    for (const [x, y] of pts.filter((_, k) => k % 2 === 0)) c.line(7.5, 7.5, x - 0.5, y - 0.5, H.p3)
    c.ellipse(7.5, 7.5, 1.8, 1.8, H.cy)
    c.set(7, 7, H.wh)
    c.outline(H.k)
    return c
  })
}

/** SERPENT's head (two frames: jaws shut and open) and a body segment, 16x16 (palette `enemy`). */
export function serpentFrames() {
  const out = []
  for (let f = 0; f < 2; f++) {
    const c = new Canvas(16, 16)
    c.ellipse(7.5, 7, 6, 6.5, (nx, ny, nz, x, y) => ramp(TEAL, lit(nx, ny, nz), x, y))
    // Jaws down the front, an eye each side.
    const gap = f === 0 ? 0 : 2
    c.rect(4 - gap, 12, 3, 3, E.g3)
    c.rect(9 + gap, 12, 3, 3, E.g3)
    c.set(5, 6, E.r3)
    c.set(10, 6, E.r3)
    c.set(5, 5, E.A)
    c.set(10, 5, E.A)
    c.outline(E.k)
    out.push(c)
  }
  const body = new Canvas(16, 16)
  body.ellipse(7.5, 7.5, 5.5, 5.5, (nx, ny, nz, x, y) => ramp(GUN, lit(nx, ny, nz), x, y))
  body.rect(3, 7, 10, 2, E.t2)
  body.set(7, 7, E.r2)
  body.set(8, 7, E.r2)
  body.outline(E.k)
  out.push(body)
  return out
}

/** SPINNER: a mine with four blades, turning (four frames, palette `enemy`). */
export function spinnerFrames() {
  return [0, 1, 2, 3].map((f) => {
    const c = new Canvas(16, 16)
    for (let k = 0; k < 4; k++) {
      const a = (f * Math.PI) / 8 + (k * Math.PI) / 2
      c.poly(
        [
          [7.5 + Math.cos(a) * 2 + 0.5, 7.5 + Math.sin(a) * 2 + 0.5],
          [7.5 + Math.cos(a + 0.5) * 7.5 + 0.5, 7.5 + Math.sin(a + 0.5) * 7.5 + 0.5],
          [7.5 + Math.cos(a + 0.9) * 4 + 0.5, 7.5 + Math.sin(a + 0.9) * 4 + 0.5],
        ],
        E.g4,
      )
    }
    c.bevel(E.g4, E.g5, E.g2)
    c.ellipse(7.5, 7.5, 3, 3, (_nx, _ny, nz) => (nz > 0.7 ? E.A : f % 2 === 0 ? E.r3 : E.r2))
    c.outline(E.k)
    return c
  })
}
