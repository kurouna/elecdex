// ELECFIGHTER's effects for the game (design 2.4, 10.2): the hit spark - effects.gltf's
// icosahedron in wire and fill, flying apart over three frames - the guard's hexagonal
// "firewall" in two, and the floor shadows in three widths, all in the `fx` palette (sprite
// slot 10). Written into the game's art/ as spark.png (32 x 32 frames) and shadow.png (16 x 16).
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { writePng } from '../png.mjs'
import { GROUND, q8 } from './palettes.mjs'

/** The fx palette: 1-5 the spark (wire and hot fills, as the renderer writes them), 6-7 the firewall, 8-9 the shadow. */
export const FX = [
  GROUND,
  [248, 248, 248],
  [248, 200, 96],
  [248, 240, 200],
  [248, 200, 112],
  [216, 128, 40],
  [192, 232, 248],
  [72, 144, 192],
  [0, 0, 0],
  [24, 64, 80],
  [40, 40, 40],
  [56, 56, 56],
  [72, 72, 72],
  [88, 88, 88],
  [104, 104, 104],
  [120, 120, 120],
].map(q8)

/** The spark's three frames: the icosahedron whole, then its faces flying apart. */
export const SPARK_STEPS = [0, 0.3, 0.6]

export function sparkJobs() {
  const jobs = {}
  SPARK_STEPS.forEach((e, k) => {
    jobs[`spark${k}`] = {
      kind: 'prop',
      file: 'models/effects.gltf',
      mesh: 'spark',
      explode: e,
      scale: 9,
      rot: [20, 30, 0],
    }
  })
  return jobs
}

/** A frame of `n` square, `src` (a rendered sprite) centred on its origin. */
function centred(src, n) {
  const out = new Uint8Array(n * n)
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const v = src.px[y * src.w + x]
      const tx = x - src.ox + n / 2
      const ty = y - src.oy + n / 2
      if (v && tx >= 0 && ty >= 0 && tx < n && ty < n) out[ty * n + tx] = v
    }
  return out
}

/** A line of 1-point steps from (x0, y0) to (x1, y1) (Bresenham's), every point touching the last. */
function line(px, n, x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    if (x0 >= 0 && y0 >= 0 && x0 < n && y0 < n) px[y0 * n + x0] = c
    if (x0 === x1 && y0 === y1) return
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

/** A hexagon standing on a point, half-width `rx`, half-height `ry`, about (16, 16). */
function hexagon(px, rx, ry, c) {
  const pts = [
    [16, 16 - ry],
    [16 + rx, 16 - (ry >> 1)],
    [16 + rx, 16 + (ry >> 1)],
    [16, 16 + ry],
    [16 - rx, 16 + (ry >> 1)],
    [16 - rx, 16 - (ry >> 1)],
  ]
  pts.forEach((p, k) => {
    const q = pts[(k + 1) % 6]
    line(px, 32, p[0], p[1], q[0], q[1], c)
  })
}

/** The firewall: a bright hexagon round a dim one, then the dim one alone as it fades. */
function firewall() {
  const a = new Uint8Array(32 * 32)
  hexagon(a, 10, 15, 6)
  hexagon(a, 6, 10, 7)
  const b = new Uint8Array(32 * 32)
  hexagon(b, 12, 15, 7)
  return [a, b]
}

/**
 * The shadows: ellipses 8 points high and 48, 32 or 16 wide, black inside a dim rim, cut into
 * 16 x 16 cells (the shadow on the cell's top 8 lines): the wide one's left and middle cells
 * (its right is the left mirrored), the middle one's left, the narrow one whole.
 */
function shadows() {
  const ellipse = (w) => {
    const px = new Uint8Array(w * 8)
    const inside = (x, y) => {
      const nx = (x + 0.5 - w / 2) / (w / 2)
      const ny = (y + 0.5 - 4) / 4
      return nx * nx + ny * ny <= 1
    }
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < w; x++) {
        if (!inside(x, y)) continue
        const edge =
          !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
        px[y * w + x] = edge ? 9 : 8
      }
    return px
  }
  const cell = (src, w, x0) => {
    const out = new Uint8Array(256)
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) out[y * 16 + x] = src[y * w + x0 + x]
    return out
  }
  const big = ellipse(48)
  const mid = ellipse(32)
  const small = ellipse(16)
  return [cell(big, 48, 0), cell(big, 48, 16), cell(mid, 32, 0), cell(small, 16, 0)]
}

function strip(frames, n) {
  const data = new Uint8Array(frames.length * n * n * 4)
  const W = frames.length * n
  frames.forEach((f, k) => {
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = f[y * n + x]
        if (v) data.set([...FX[v], 255], (y * W + k * n + x) * 4)
      }
  })
  return writePng({ width: W, height: n, data })
}

/** Writes art/spark.png and art/shadow.png into the game's folder `game`. */
export function writeEffects(results, game) {
  const sparks = SPARK_STEPS.map((_, k) => {
    const s = results[`spark${k}`]
    if (s.w - s.ox > 32 || s.h - s.oy > 32) throw new Error('the spark is larger than 32 points')
    return centred(s, 32)
  })
  writeFileSync(path.join(game, 'art', 'spark.png'), strip([...sparks, ...firewall()], 32))
  writeFileSync(path.join(game, 'art', 'shadow.png'), strip(shadows(), 16))
  return `effects: spark ${SPARK_STEPS.length} frames, firewall 2, shadows 4 cells`
}
