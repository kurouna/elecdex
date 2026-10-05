// ELECDRILL's title word and small effects (docs/elec16-elecdrill.md section 6).
//
// The word is drawn as the blocks are: each letter a shape lit as a soft dome from the top
// left, in the four block colours by turns; the I of DRILL is a drill bit pointing down.
// Palette `logo`: 1 outline, 2-4 red, 5-7 yellow, 8-10 green, 11-13 blue (dark, mid, light),
// 14 white, 15 steel.

import { Canvas, each } from '../eleclance/draw.mjs'
import { fontFrames } from '../eleclance/font.mjs'

const COLOURS = [
  [2, 3, 4],
  [5, 6, 7],
  [8, 9, 10],
  [11, 12, 13],
]

/** Distance (to 6) from each point inside `inside` to the nearest outside. */
function distanceField(inside, w, h) {
  const d = new Float32Array(w * h)
  each(w, h, (x, y) => {
    if (!inside[y * w + x]) return
    let best = 6
    for (let yy = -6; yy <= 6; yy++) {
      for (let xx = -6; xx <= 6; xx++) {
        const px = x + xx
        const py = y + yy
        if (px < 0 || py < 0 || px >= w || py >= h || !inside[py * w + px])
          best = Math.min(best, Math.hypot(xx, yy))
      }
    }
    d[y * w + x] = best
  })
  return d
}

/** The word ELECDRILL. */
export function logo() {
  const glyphs = fontFrames()
  const word = 'ELECDRILL'
  const w = Math.ceil((word.length * STEP + 12) / 8) * 8
  const c = new Canvas(w, LOGO_H)
  ;[...word].forEach((ch, k) => {
    const x0 = 6 + k * STEP
    const inside = new Uint8Array(w * LOGO_H)
    if (k === 6) drillShape(inside, w, x0)
    else letterShape(inside, w, x0, glyphs[ch.charCodeAt(0) - 32])
    // A letter bobs a little from its neighbours, like blocks in a heap.
    const lift = [0, 2, 0, 1, 0, 2, 0, 1, 0][k]
    const ramp = k === 6 ? [15, 15, 14] : COLOURS[k % 4]
    letterLit(c, inside, w, lift, ramp)
    glint(c, x0, ramp)
  })
  // A shadow below the word, dithered.
  each(w, LOGO_H, (x, y) => {
    const v = c.get(x - 2, y - 3)
    if (c.get(x, y) === 0 && v > 1 && (x + y) % 2 === 0) c.set(x, y, 1)
  })
  return c
}

const STEP = 26
const LOGO_H = 48

/** A glyph's letter points (its ramp, 4 and up), each four points square, a little fattened. */
function letterShape(inside, w, x0, g) {
  each(8, 8, (gx, gy) => {
    if (g.get(gx, gy) < 4) return
    each(6, 6, (sx, sy) => {
      const px = x0 + gx * 4 + sx - 1
      const py = 6 + gy * 4 + sy - 1
      if (px >= 0 && px < w && py < LOGO_H) inside[py * w + px] = 1
    })
  })
  smooth(inside, w)
  smooth(inside, w)
}

/** A shape's stair-steps filled: a point with five or more of its eight neighbours inside. */
function smooth(inside, w) {
  const add = []
  each(w, LOGO_H, (x, y) => {
    if (inside[y * w + x]) return
    let n = 0
    for (const [dx, dy] of NEIGHBOURS) n += inside[(y + dy) * w + x + dx] ?? 0
    if (n >= 5) add.push(y * w + x)
  })
  for (const k of add) inside[k] = 1
}

const NEIGHBOURS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

/** A letter's shape lit as a block is, in its colour's three tones, `lift` points up. */
function letterLit(c, inside, w, lift, ramp) {
  const d = distanceField(inside, w, LOGO_H)
  const at = (x, y) => d[y * w + x] ?? 0
  each(w, LOGO_H, (x, y) => {
    if (inside[y * w + x] && y >= lift) c.set(x, y - lift, letterTone(at, x, y, ramp))
  })
}

/** A letter's point: the outline, or a tone by which way its edge slopes (flat inside, banded). */
function letterTone(at, x, y, ramp) {
  const dist = at(x, y)
  if (dist <= 1.01) return 1
  if (dist > 3.5) return ramp[y % 12 < 4 && x % 9 < 3 ? 2 : 1]
  const slope = at(x, y + 1) - at(x, y - 1) + (at(x + 1, y) - at(x - 1, y)) * 0.8
  return ramp[slope > 0.5 ? 2 : slope < -0.5 ? 0 : 1]
}

/** A glint on a letter's top left: three white points at the first lit point from the top. */
function glint(c, x0, ramp) {
  for (let y = 0; y < LOGO_H; y++) {
    for (let x = x0; x < x0 + STEP; x++) {
      const v = c.get(x, y)
      if (v === ramp[2] || v === ramp[1]) {
        c.set(x + 1, y + 1, 14)
        c.set(x + 2, y + 1, 14)
        c.set(x + 1, y + 2, 14)
        return
      }
    }
  }
}

/** The I of DRILL: a drill bit, its point down, stripes turning across it. */
function drillShape(inside, w, x0) {
  for (let y = 6; y < 40; y++) {
    const t = (y - 6) / 34
    const half = y < 12 ? 7 : Math.max(1, 9 * (1 - t))
    for (let x = -half; x <= half; x++) {
      const px = Math.round(x0 + 12 + x)
      if (px >= 0 && px < w) inside[y * w + px] = 1
    }
  }
}

/** Effects of eight points (palette `fx`): dust 0-3, sparks 4-5, bubbles 6-7, a star 8-9. */
export function fxFrames() {
  return [0, 1, 2, 3]
    .map(dust)
    .concat([0, 1].map(spark), [0, 1].map(bubble), [0, 1].map(star), [0, 1].map(warnSign))
}

/** The warning over the driller's head: a sign with a mark, gold and dark, then orange and white. */
function warnSign(f) {
  const c = new Canvas(8, 8)
  const rows = [
    '...oo...',
    '..offo..',
    '..oxxo..',
    '.ofxxfo.',
    '.ofxxfo.',
    'offffffo',
    'offxxffo',
    'oooooooo',
  ]
  const ink = { o: 12, f: f === 0 ? 14 : 4, x: f === 0 ? 12 : 6 }
  rows.forEach((line, y) => {
    ;[...line].forEach((ch, x) => {
      if (ch !== '.') c.set(x, y, ink[ch])
    })
  })
  return c
}

/** A puff of dust growing, the last breaking up. */
function dust(f) {
  const c = new Canvas(8, 8)
  const r = 1.6 + f * 0.8
  c.ellipse(3.5, 4, r, r * 0.85, (nx, ny) => {
    if (f === 3 && (nx * 3 + ny * 5) % 2 > 0.5) return null
    return nx + ny < -0.3 ? 3 : ny > 0.4 ? 1 : 2
  })
  return c
}

const ARMS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

/** A spark: a white heart and four arms, longer in the second frame. */
function spark(f) {
  const c = new Canvas(8, 8)
  c.set(3, 3, 6)
  c.set(4, 4, 6)
  c.set(3, 4, f === 0 ? 6 : 5)
  c.set(4, 3, f === 0 ? 6 : 5)
  for (const [dx, dy] of ARMS) {
    for (let s = 2; s <= 2 + f; s++) c.set(3.5 + dx * s, 3.5 + dy * s, f === 0 ? 5 : 4)
  }
  return c
}

function bubble(f) {
  const c = new Canvas(8, 8)
  const r = f === 0 ? 1.8 : 2.6
  c.ellipse(3.5, 3.5, r, r, (nx, ny) => (nx * nx + ny * ny > 0.5 ? 10 : null))
  c.set(2, 2, 11)
  return c
}

/** A gold star, twinkling: its arms long, then short. */
function star(f) {
  const c = new Canvas(8, 8)
  c.set(3, 3, 6)
  c.set(4, 3, 15)
  c.set(3, 4, 15)
  c.set(4, 4, 14)
  for (let s = 1; s <= 3 - f; s++) {
    c.set(4 - s, 3, 14)
    c.set(4 + s, 4, 14)
    c.set(3, 4 - s, 14)
    c.set(4, 4 + s, 14)
  }
  return c
}
