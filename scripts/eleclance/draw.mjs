// A small pixel-art canvas for ELECLANCE's art script (scripts/eleclance-art.mjs): indexed
// colours (a palette's 0-15), shapes, mirrored drawing, outlines, bevels and dithered shading.
// Everything is seeded, so the script writes the same pictures every time.

export class Canvas {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.px = new Uint8Array(w * h)
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0
    return this.px[y * this.w + x]
  }

  set(x, y, c) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    this.px[y * this.w + x] = c
  }

  /** Sets only where something is already drawn. */
  paint(x, y, c) {
    if (this.get(Math.round(x), Math.round(y)) !== 0) this.set(x, y, c)
  }

  rect(x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c)
  }

  /** A filled polygon (points [[x, y], ...]), by the even-odd rule at pixel centres. */
  poly(points, c) {
    const ys = points.map((p) => p[1])
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = []
      for (let k = 0; k < points.length; k++) {
        const [x0, y0] = points[k]
        const [x1, y1] = points[(k + 1) % points.length]
        const cy = y + 0.5
        if (y0 <= cy !== y1 <= cy) xs.push(x0 + ((cy - y0) * (x1 - x0)) / (y1 - y0))
      }
      xs.sort((a, b) => a - b)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++)
          this.set(x, y, c)
      }
    }
  }

  /** A filled ellipse centred at (cx, cy). `shade(nx, ny, nz)` gives the colour by surface normal. */
  ellipse(cx, cy, rx, ry, shade) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx
        const ny = (y + 0.5 - cy) / ry
        const d = nx * nx + ny * ny
        if (d > 1) continue
        const c = typeof shade === 'function' ? shade(nx, ny, Math.sqrt(1 - d), x, y) : shade
        if (c !== null && c !== undefined) this.set(x, y, c)
      }
    }
  }

  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let k = 0; k <= n; k++) this.set(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, c)
  }

  /** Copies the left half onto the right, mirrored (columns 0..w/2-1 to w-1..w/2). */
  mirrorX() {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w / 2; x++)
        this.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x]
    }
  }

  /** A one-point outline in colour `c` round everything drawn (8 neighbours or 4). */
  outline(c, diagonal = false) {
    const out = this.px.slice()
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== 0) continue
        const n = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          ...(diagonal
            ? [
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
              ]
            : []),
        ]
        if (
          n.some(([dx, dy]) => this.get(x + dx, y + dy) !== 0 && this.get(x + dx, y + dy) !== c)
        ) {
          out[y * this.w + x] = c
        }
      }
    }
    this.px = out
  }

  /**
   * Light from the top left: a drawn point with nothing (or the outline) above or to its
   * left becomes `light`, with nothing below or to its right `dark`. Only points of `on`.
   */
  bevel(on, light, dark, outline = -1) {
    const out = this.px.slice()
    const empty = (x, y) => {
      const v = this.get(x, y)
      return v === 0 || v === outline
    }
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y) !== on) continue
        if (empty(x, y - 1) || empty(x - 1, y)) out[y * this.w + x] = light
        else if (empty(x, y + 1) || empty(x + 1, y)) out[y * this.w + x] = dark
      }
    }
    this.px = out
  }

  /** Draws `grid` (rows of characters, `.` nothing) at (x, y) through `key` (char -> colour). */
  grid(x, y, rows, key) {
    rows.forEach((row, yy) => {
      ;[...row].forEach((ch, xx) => {
        if (ch !== '.' && ch !== ' ') this.set(x + xx, y + yy, key[ch] ?? 0)
      })
    })
  }

  /** Another canvas drawn on this one at (x, y), its 0s clear. */
  blit(src, x, y, flipX = false, flipY = false) {
    for (let yy = 0; yy < src.h; yy++) {
      for (let xx = 0; xx < src.w; xx++) {
        const c = src.get(flipX ? src.w - 1 - xx : xx, flipY ? src.h - 1 - yy : yy)
        if (c !== 0) this.set(x + xx, y + yy, c)
      }
    }
  }

  /** Each point's colour through `map` (colour -> colour). */
  remap(map) {
    for (let k = 0; k < this.px.length; k++) {
      const v = map[this.px[k]]
      if (v !== undefined) this.px[k] = v
    }
  }
}

/**
 * Calls `fn(x, y)` for every point of a `w` by `h` area, row by row from the top: the order
 * the drawing loops always used, so a seeded picture comes out the same.
 */
export function each(w, h, fn) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(x, y)
}

/** Seeded chance (mulberry32). */
export function chance(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Bayer 4x4: a threshold 0-1 for ordered dithering at (x, y). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
export const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16

/** A ramp of colours (dark to light) at level 0-1, dithered between neighbours. */
export function ramp(colours, level, x, y) {
  const v = Math.max(0, Math.min(0.9999, level)) * (colours.length - 1)
  const k = Math.floor(v)
  return colours[v - k > bayer(x, y) ? Math.min(k + 1, colours.length - 1) : k]
}

/**
 * A ramp of colours (dark to light) at level 0-1, the nearest step and never dithered: areas
 * of one tone. At the screen's size a checker of two tones reads as a field of dots, not as
 * the tone between them (user decision 2026-10-05).
 */
export function tone(colours, level) {
  const v = Math.max(0, Math.min(0.9999, level)) * colours.length
  return colours[Math.min(colours.length - 1, Math.floor(v))]
}

/**
 * Takes out what reads as a dot: a drawn point with at most one drawn neighbour (of four)
 * goes, and a point unlike every one of its four drawn neighbours takes the tone most of
 * them have. `rounds` passes.
 */
export function despeckle(c, rounds = 2) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (let r = 0; r < rounds; r++) {
    const out = c.px.slice()
    each(c.w, c.h, (x, y) => {
      const v = c.get(x, y)
      if (v === 0) return
      const near = dirs.map(([dx, dy]) => c.get(x + dx, y + dy)).filter((n) => n !== 0)
      out[y * c.w + x] = undotted(v, near)
    })
    c.px = out
  }
  return c
}

/** A drawn point `v` among its drawn neighbours `near`: kept, gone, or the tone most have. */
function undotted(v, near) {
  if (near.length <= 1) return 0
  if (near.includes(v)) return v
  const count = new Map()
  for (const n of near) count.set(n, (count.get(n) ?? 0) + 1)
  return [...count].sort((p, q) => q[1] - p[1] || p[0] - q[0])[0][0]
}

/** Smooth value noise in 2D, seeded, about 0-1. */
export function noise2(seed) {
  const rnd = chance(seed)
  const table = Array.from({ length: 256 }, () => rnd())
  const perm = Array.from({ length: 256 }, (_, k) => k).sort(() => rnd() - 0.5)
  const at = (x, y) => table[perm[(perm[x & 255] + y) & 255]]
  const fade = (t) => t * t * (3 - 2 * t)
  return (x, y) => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = fade(x - x0)
    const fy = fade(y - y0)
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx
    return a + (b - a) * fy
  }
}

/** Several octaves of noise2. */
export function fbm(seed, octaves = 4) {
  const layers = Array.from({ length: octaves }, (_, k) => noise2(seed + k * 101))
  return (x, y) => {
    let sum = 0
    let amp = 0.5
    let f = 1
    let norm = 0
    for (const n of layers) {
      sum += n(x * f, y * f) * amp
      norm += amp
      amp /= 2
      f *= 2
    }
    return sum / norm
  }
}

/** A sheet of frames: each canvas placed left to right, `across` to a row. */
export function sheet(frames, cell, across) {
  const rows = Math.ceil(frames.length / across)
  const out = new Canvas(cell * Math.min(across, frames.length), cell * rows)
  frames.forEach((f, k) => {
    out.blit(f, (k % across) * cell, Math.floor(k / across) * cell)
  })
  return out
}
