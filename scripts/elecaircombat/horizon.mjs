// ELECAIRCOMBAT's sky and sea (docs/elec16-elecaircombat.md section 4): the tiles BG0 is
// rewritten with every frame, and the tables that choose them. A cell's tile depends only on
// its centre's distance from the horizon, in points (the sky positive): far from it a band of
// solid colour (dithered where two bands meet); within six points of it a tile that draws the
// horizon across the cell at the angle it lies. Those are drawn for a quarter turn of angles
// (ANGLES of them); the game flips them for the rest.

import { Canvas } from '../eleclance/draw.mjs'

/** The horizon's angles over a quarter turn (0 level, ANGLES - 1 upright), and the offsets. */
export const ANGLES = 17
export const OFFSETS = 13
const REACH = (OFFSETS - 1) / 2
/** The band table covers centre distances -RANGE to RANGE points. */
export const RANGE = 160

/** The sky palette's colours (scripts/elecaircombat/palettes.mjs). */
const HAZE = 7
const GLOW = 8
const SEA_HAZE = 9
const SEA = 10

/** A point's colour in a horizon cell, by its distance from the horizon. */
function horizonColour(s) {
  if (s >= 1.5) return HAZE
  if (s >= 0) return GLOW
  if (s >= -2) return SEA_HAZE
  return SEA
}

/** Bands away from the horizon: [from (points), colour], the sky up and the sea down. */
const SKY_BANDS = [
  [7, 7],
  [26, 6],
  [44, 5],
  [66, 4],
  [90, 3],
  [116, 2],
  [144, 1],
]
const SEA_BANDS = [
  [7, 10],
  [24, 11],
  [42, 12],
  [62, 13],
  [86, 14],
  [114, 15],
]
/** The width of the dithered seam before each band but the first. */
const SEAM = 6

class Tiles {
  constructor() {
    this.list = []
    this.known = new Map()
  }

  /** The tile's number, new or one already drawn alike. */
  add(c) {
    const key = c.px.join(',')
    const k = this.known.get(key)
    if (k !== undefined) return k
    this.known.set(key, this.list.length)
    this.list.push(c)
    return this.list.length - 1
  }
}

const solid = (k) => {
  const c = new Canvas(8, 8)
  c.rect(0, 0, 8, 8, k)
  return c
}

const dither = (a, b) => {
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) c.set(x, y, (x + y) & 1 ? b : a)
  return c
}

/** The band tile for a centre distance beyond the horizon's cells. */
function bandTile(tiles, s) {
  const bands = s > 0 ? SKY_BANDS : SEA_BANDS
  const d = Math.abs(s)
  let k = 0
  while (k + 1 < bands.length && d >= bands[k + 1][0]) k++
  const colour = bands[k][1]
  const next = bands[k + 1]
  if (next !== undefined && d >= next[0] - SEAM) return tiles.add(dither(colour, next[1]))
  return tiles.add(solid(colour))
}

/** The horizon across a cell: normal angle `a` of ANGLES, centre distance `o` points. */
function horizonTile(a, o) {
  const b = (a / (ANGLES - 1)) * (Math.PI / 2)
  const nx = Math.sin(b)
  const ny = -Math.cos(b)
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const s = o + (x + 0.5 - 4) * nx + (y + 0.5 - 4) * ny
      c.set(x, y, horizonColour(s))
    }
  }
  return c
}

/**
 * Every tile, and the table: RANGE * 2 + 1 band entries (distance -RANGE first), then ANGLES *
 * OFFSETS horizon entries (angle by angle, offset -REACH first). Entries are tile numbers in
 * the sheet; the band entries within REACH of the horizon are the level horizon's.
 */
export function horizon() {
  const tiles = new Tiles()
  tiles.add(solid(1))
  const partial = []
  for (let a = 0; a < ANGLES; a++) {
    for (let o = -REACH; o <= REACH; o++) partial.push(tiles.add(horizonTile(a, o)))
  }
  const bands = []
  for (let s = -RANGE; s <= RANGE; s++) {
    bands.push(Math.abs(s) <= REACH ? (partial[s + REACH] ?? 0) : bandTile(tiles, s))
  }
  return { tiles: tiles.list, table: [...bands, ...partial] }
}
