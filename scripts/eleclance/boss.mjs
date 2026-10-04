// ELECLANCE's two great machines (palette `heavy`), cut into 32x32 frames for the sprite
// engine: BASTION, the orbital gun platform half way, and ZENITH, the battleship at the end.
import { Canvas, chance } from './draw.mjs'
import { CRIMSON, GOLD, H, hull, PURPLE } from './foes.mjs'

/** A canvas cut into 32x32 frames, row by row. */
function cut(c) {
  const out = []
  for (let y = 0; y < c.h; y += 32) {
    for (let x = 0; x < c.w; x += 32) {
      const f = new Canvas(32, 32)
      for (let yy = 0; yy < 32; yy++)
        for (let xx = 0; xx < 32; xx++) f.set(xx, yy, c.get(x + xx, y + yy))
      out.push(f)
    }
  }
  return out
}

/** A row of lamps along y from x0 to x1, every `step`. */
function lamps(c, x0, x1, y, step, colour) {
  for (let x = x0; x <= x1; x += step) c.set(x, y, colour)
}

/**
 * BASTION, 64x64 (four frames): a ring of armour round a gun core, two gun arms that can be
 * shot away. The arms are separate (a 32x32 frame, flipped for the right).
 */
export function bastionFrames() {
  const rnd = chance(31)
  const c = new Canvas(64, 64)
  hull(
    c,
    [
      [6, 20],
      [18, 6],
      [32, 2],
      [32, 62],
      [18, 58],
      [6, 44],
    ],
    PURPLE,
    rnd,
    4,
  )
  hull(
    c,
    [
      [14, 22],
      [24, 12],
      [32, 10],
      [32, 54],
      [24, 52],
      [14, 42],
    ],
    CRIMSON,
    rnd,
    2,
  )
  c.rect(10, 30, 22, 4, H.p1)
  lamps(c, 12, 30, 31, 4, H.cy)
  c.mirrorX()
  // The core: an eye of gold round a hot centre.
  c.ellipse(31.5, 32, 9, 9, (_nx, _ny, nz) => (nz > 0.75 ? H.o3 : nz > 0.45 ? H.o2 : H.o1))
  c.ellipse(31.5, 32, 5, 5, (_nx, _ny, nz) => (nz > 0.7 ? H.wh : nz > 0.4 ? H.hot : H.c3))
  c.outline(H.k)
  const arm = new Canvas(32, 32)
  hull(
    arm,
    [
      [4, 8],
      [26, 4],
      [30, 12],
      [30, 22],
      [26, 28],
      [4, 24],
    ],
    CRIMSON,
    chance(32),
    1,
  )
  arm.rect(0, 13, 8, 6, H.p2)
  arm.rect(0, 14, 3, 4, H.hot)
  for (let y = 9; y < 24; y += 5) arm.rect(10, y, 14, 1, GOLD[0])
  arm.outline(H.k)
  return [...cut(c), ...cut(arm)]
}

/**
 * ZENITH, the battleship: a hull of 96x64 (six frames), its core (32x32: shut, open, burning),
 * a cannon (32x32: whole, wrecked; flipped for the right) and a wing (32x32: folded, spread).
 */
export function zenithFrames() {
  const rnd = chance(41)
  const body = new Canvas(96, 64)
  // The left half of the hull, mirrored: a long prow down the middle, swept armour, gold ribs.
  hull(
    body,
    [
      [8, 14],
      [24, 4],
      [48, 0],
      [48, 63],
      [36, 60],
      [20, 48],
      [8, 34],
    ],
    PURPLE,
    rnd,
    6,
  )
  hull(
    body,
    [
      [22, 16],
      [36, 8],
      [48, 6],
      [48, 58],
      [38, 54],
      [26, 40],
    ],
    CRIMSON,
    rnd,
    3,
  )
  hull(
    body,
    [
      [36, 20],
      [48, 16],
      [48, 48],
      [40, 46],
    ],
    PURPLE,
    rnd,
  )
  for (let y = 12; y < 56; y += 6) body.rect(12 + Math.abs(30 - y) / 3, y, 8, 1, GOLD[1])
  lamps(body, 26, 44, 50, 3, H.cy)
  body.rect(40, 56, 8, 8, H.p1)
  body.rect(42, 58, 6, 6, H.hot)
  body.mirrorX()
  body.outline(H.k)

  const cores = [0, 1, 2].map((state) => {
    const c = new Canvas(32, 32)
    hull(
      c,
      [
        [3, 6],
        [16, 1],
        [16, 31],
        [3, 26],
      ],
      CRIMSON,
      chance(42),
    )
    c.mirrorX()
    if (state === 0) {
      // Shut: two armoured leaves over the eye.
      c.rect(6, 12, 20, 8, H.p2)
      c.rect(6, 15, 20, 2, H.p1)
    } else {
      const hot = state === 1 ? [H.o2, H.hot, H.wh] : [H.c2, H.c4, H.hot]
      c.ellipse(15.5, 16, 9, 9, (_nx, _ny, nz) => (nz > 0.75 ? hot[2] : nz > 0.4 ? hot[1] : hot[0]))
      c.ellipse(15.5, 16, 3, 3, state === 1 ? H.wh : H.o3)
    }
    c.outline(H.k)
    return c
  })

  const cannons = [0, 1].map((wrecked) => {
    const c = new Canvas(32, 32)
    const r = chance(43)
    hull(
      c,
      [
        [6, 4],
        [24, 2],
        [30, 10],
        [30, 24],
        [20, 30],
        [6, 26],
      ],
      wrecked ? [H.c1, H.c1, H.c2, H.c2, H.c3] : PURPLE,
      r,
      wrecked ? 0 : 2,
    )
    // Twin barrels pointing down.
    if (!wrecked) {
      c.rect(11, 22, 3, 10, H.p3)
      c.rect(19, 22, 3, 10, H.p3)
      c.rect(11, 30, 3, 2, H.hot)
      c.rect(19, 30, 3, 2, H.hot)
    } else {
      for (let k = 0; k < 14; k++) c.set(8 + r() * 18, 6 + r() * 20, r() < 0.5 ? H.hot : H.k)
    }
    c.outline(H.k)
    return c
  })

  const wings = [0, 1].map((open) => {
    const c = new Canvas(32, 32)
    const pts = open
      ? [
          [31, 6],
          [10, 2],
          [0, 14],
          [4, 30],
          [31, 22],
        ]
      : [
          [31, 8],
          [22, 4],
          [16, 14],
          [20, 30],
          [31, 24],
        ]
    hull(c, pts, CRIMSON, chance(44), open ? 3 : 1)
    if (open) for (let y = 8; y < 26; y += 4) c.rect(6, y, 22, 1, GOLD[0])
    c.outline(H.k)
    return c
  })

  return [...cut(body), ...cores, ...cannons, ...wings]
}
