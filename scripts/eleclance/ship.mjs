// ELECLANCE's ship, its flame, its shots and the lance (palettes `ship` and `shot`).
import { Canvas, each } from './draw.mjs'

/** The ship's colours: see palettes.mjs `ship`. */
const S = {
  k: 1,
  d: 2,
  m: 3,
  l: 4,
  w: 5,
  c: 6,
  C: 7,
  h: 8,
  p: 9,
  P: 10,
  y: 11,
  Y: 12,
  o: 13,
  r: 14,
  b: 15,
}

// The left half, the centre between columns 7 and 8; the right half is its mirror. A swept
// dart: a long nose, a canopy, wings raked back with a magenta stripe, twin engine pods.
const HALF = [
  '.......k',
  '......kw',
  '......kl',
  '.....kwl',
  '.....klC',
  '.....kmh',
  '....kdlC',
  '....kdlc',
  '...kpdml',
  '..kPpdml',
  '.kPpkdmm',
  'kwPkkdlm',
  'klkdkdml',
  'kk.kbkdk',
  '...kbbk.',
  '....kk..',
]

/** The ship banked by `tilt` (-2 to 2, minus to the left): the far half narrows and darkens. */
export function shipFrame(tilt) {
  const full = new Canvas(16, 16)
  full.grid(0, 0, HALF, S)
  full.mirrorX()
  if (tilt === 0) {
    // Lit from the top left: the right half's steel a step darker.
    each(7, 16, (x, y) => full.set(9 + x, y, shade(full.get(9 + x, y), -1, 1)))
    return full
  }
  // The half moving away is squeezed toward the centre; the near half shows its top, lighter.
  const out = new Canvas(16, 16)
  const squeeze = Math.abs(tilt) === 1 ? 6.5 / 8 : 5 / 8
  const right = tilt > 0
  each(16, 16, (x, y) => {
    const inFar = right ? x >= 8 : x < 8
    const sx = inFar ? farColumn(x, right, squeeze) : x
    if (sx === null) return
    let c = full.get(Math.max(0, Math.min(15, sx)), y)
    if (c !== 0) c = shade(c, inFar ? -1 : 1, Math.abs(tilt))
    out.set(x, y, c)
  })
  return out
}

/**
 * Where column `x` of the far half (the right or the left) reads the level ship from when
 * that half is squeezed by `squeeze` toward the centre; null past the squeezed wing's tip.
 */
function farColumn(x, right, squeeze) {
  const d = right ? x - 7.5 : 7.5 - x
  const back = d / squeeze
  if (back > 8) return null
  return Math.round(right ? 7.5 + back : 7.5 - back)
}

/** Steel lighter on the near side, darker on the far, by `amount` steps. */
function shade(c, toward, amount) {
  const steel = [S.d, S.m, S.l, S.w]
  const k = steel.indexOf(c)
  if (k < 0) return c
  const step = toward > 0 ? Math.min(1, amount) : -Math.min(1, amount)
  return steel[Math.max(0, Math.min(3, k + step))]
}

/** The engines' flame below the ship: a 16x16 frame (the flame in its top half), three flickers. */
export function flameFrames() {
  const shapes = [
    ['...yy...', '...Yo...', '...Yo...', '....r...', '....r...'],
    ['...yy...', '..yYYo..', '..YYor..', '...Yor..', '...or...', '....r...', '....r...'],
    ['...yy...', '...Yo...', '...o....', '...r....'],
  ]
  return shapes.map((rows) => {
    const c = new Canvas(16, 16)
    c.grid(0, 0, rows, S)
    c.mirrorX()
    return c
  })
}

/** The shot palette's colours (palettes.mjs `shot`). */
const T = { k: 1, n: 2, b: 3, B: 4, s: 5, S: 6, w: 7, v: 8, V: 9, L: 10, y: 11, t: 12 }

/** A forward shot (8x8, two frames) and a wide one leaning out (mirrored for the other side). */
export function shotFrames() {
  const straight = [
    [
      '...ww...',
      '..SwwS..',
      '..sSSs..',
      '..BssB..',
      '...BB...',
      '...bb...',
      '...nn...',
      '........',
    ],
    [
      '...ww...',
      '..wwwS..',
      '..SSSs..',
      '..ssB...',
      '...BB...',
      '...b....',
      '...n....',
      '........',
    ],
  ]
  const lean = [
    [
      '.....ww.',
      '....wwS.',
      '...SSs..',
      '..sSB...',
      '..BB....',
      '.bb.....',
      '.n......',
      '........',
    ],
  ]
  return [...straight, ...lean].map((rows) => {
    const c = new Canvas(8, 8)
    c.grid(0, 0, rows, T)
    return c
  })
}

/**
 * The lance: a 16x16 segment of an electric arc stacked up the screen, four frames that
 * crackle; its root (a ball of light at the nose) and its head where it strikes.
 */
export function lanceFrames(rnd) {
  const frames = []
  for (let f = 0; f < 4; f++) {
    const c = new Canvas(16, 16)
    // A glow round a white core, its edge rippling down the frames.
    for (let y = 0; y < 16; y++) {
      const ripple = (y + f * 4) % 8 < 4 ? 0 : 1
      for (let x = 3 + ripple; x <= 12 - ripple; x++) c.set(x, y, glow(Math.abs(x - 7.5)))
    }
    // Arcs that jump across the glow, violet and lilac, jagged.
    for (let arc = 0; arc < 3; arc++) lanceArc(c, rnd, arc === 1 ? T.L : T.V)
    frames.push(c)
  }
  return frames
}

/** The lance's glow at `d` points from its middle: white, then fading out through blue. */
function glow(d) {
  if (d < 1) return T.w
  if (d < 2) return T.S
  if (d < 3) return T.s
  if (d < 4) return T.B
  return T.b
}

/** One arc up a lance segment, wandering by `rnd`, drawn only outside the white core. */
function lanceArc(c, rnd, colour) {
  let x = 7.5 + (rnd() - 0.5) * 8
  for (let y = 0; y < 16; y++) {
    x += (rnd() - 0.5) * 3.5
    x = Math.max(1, Math.min(14, x))
    const xi = Math.round(x)
    if (Math.abs(xi - 7.5) > 1.2) c.set(xi, y, colour)
  }
}

/** The lance's root (two pulses) and the spray where it strikes (two). */
export function lanceEnds() {
  const out = []
  for (const r of [6.5, 7.5]) {
    const c = new Canvas(16, 16)
    c.ellipse(7.5, 8, r, r, (_nx, _ny, nz) =>
      nz > 0.85 ? T.w : nz > 0.6 ? T.S : nz > 0.35 ? T.s : T.B,
    )
    out.push(c)
  }
  for (let f = 0; f < 2; f++) {
    const c = new Canvas(16, 16)
    c.ellipse(7.5, 10, 5 + f, 4, (_nx, _ny, nz) => (nz > 0.8 ? T.w : nz > 0.5 ? T.S : T.s))
    const rays =
      f === 0
        ? [
            [-6, -6],
            [6, -5],
            [-2, -8],
            [3, -7],
          ]
        : [
            [-7, -3],
            [7, -4],
            [0, -8],
            [-4, -7],
            [5, -7],
          ]
    for (const [dx, dy] of rays) c.line(7.5, 9, 7.5 + dx, 9 + dy, T.L)
    out.push(c)
  }
  return out
}

/**
 * A homing missile (8x8, palette `shot`): pointing along +x, then by sixteenths of a turn to
 * straight down; the game flips these for the other three quarters.
 */
export function missileFrames() {
  return [0, Math.PI / 8, Math.PI / 4, (3 * Math.PI) / 8, Math.PI / 2].map((angle) => {
    const c = new Canvas(8, 8)
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    // A white nose, a blue body, a flame behind.
    for (let t = -3.5; t <= 3.5; t += 0.25) {
      const colour = t > 1.5 ? T.w : t > -1.5 ? T.s : T.y
      c.set(3.5 + dx * t, 3.5 + dy * t, colour)
    }
    c.set(3.5 - dx * 3.5 - dy, 3.5 - dy * 3.5 + dx, T.V)
    c.set(3.5 - dx * 3.5 + dy, 3.5 - dy * 3.5 - dx, T.V)
    return c
  })
}

/** The lance's chain: a jagged spark that jumps to the next foe, four frames (8x8). */
export function arcFrames(rnd) {
  return [0, 1, 2, 3].map(() => {
    const c = new Canvas(8, 8)
    let x = 0
    let y = 3.5
    while (x < 8) {
      c.set(x, y, T.w)
      c.set(x, y + 1, T.L)
      x += 1
      y = Math.max(1, Math.min(6, y + (rnd() - 0.5) * 3))
    }
    return c
  })
}
