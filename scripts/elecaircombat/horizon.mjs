// ELECAIRCOMBAT's sky and sea (docs/elec16-elecaircombat.md section 4): the tiles BG0 is
// rewritten with every frame, and the tables that choose them. A cell's tile depends only on
// its centre's distance from the horizon, in points (the sky positive): far from it a band of
// one colour, and between two bands a cell-high ramp from one to the next; within six points
// of it a tile that draws the horizon across the cell at the angle it lies, smoothed. Those
// are drawn for a quarter turn of angles (ANGLES of them); the game flips them for the rest.
// Which distances share a tile is what the game's row writer pays for, never what the tiles
// show: the bands keep as many runs as they always had, so the gradient is made by the
// palette's steps being small and the ramps between them soft - short dashes, never a checker
// of single points and never a flat edge (user review 2026-10-05). The sea has no waves: only
// its gradient, from the bright haze at the horizon to the deep water below.

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

/**
 * Bayer 4x4: a threshold 0-1 for ordered dithering at (x, y), only along the horizon's line;
 * a tile of 8 repeats it whole.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16

/** A point's colour in a horizon cell by its distance from the horizon (the sky positive). */
function zoneOf(s) {
  if (s >= 1.5) return HAZE
  if (s >= 0) return GLOW
  if (s >= -2) return SEA_HAZE
  return SEA
}

/**
 * Bands away from the horizon: [from (points), colour], the sky up and the sea down. A
 * band's tile is the same wherever its run reaches, so the colours step in runs; the seams
 * between them, and the palette's small steps, are what make the steps a gradient. The bands
 * narrow towards the horizon, as the light changes fastest there.
 */
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
/**
 * The width of the seam before each band but the first: one cell's height, so a level
 * horizon always puts exactly one row of cells on it, and that row's tile ramps from one
 * band's colour to the next across its eight lines.
 */
const SEAM = 8

/**
 * A seam's eight lines, from the one nearer the horizon: `#` the outer band's colour, `.` the
 * inner's. Short horizontal dashes of the one colour in the other, longer line by line, so
 * the step between two bands is a soft ramp across the cell rather than an edge - never a
 * checker of single points, which at the screen's size reads as a field of dots, and never
 * flat (user review 2026-10-05). Each dash is two points or more, and the dashes of one line
 * sit between those of the next, so no column of them forms.
 */
const SEAM_MASK = [
  '........',
  '.##.....',
  '.....##.',
  '..####..',
  '##....##',
  '#..#####',
  '#####..#',
  '########',
]

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

/**
 * A band's tile: `inner` (the band nearer the horizon) all over, or on a seam stepping to
 * `outer` across the cell - up it in the sky, down it in the sea.
 */
function bandTile(inner, outer, seam, up) {
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) {
    const line = SEAM_MASK[up ? 7 - y : y]
    for (let x = 0; x < 8; x++) c.set(x, y, seam && line[x] === '#' ? outer : inner)
  }
  return c
}

/** The band and whether it is the seam before the next, for a centre distance `d` beyond the horizon's cells. */
function bandOf(bands, d) {
  let k = 0
  while (k + 1 < bands.length && d >= bands[k + 1][0]) k++
  const next = bands[k + 1]
  return { k, seam: next !== undefined && d >= next[0] - SEAM }
}

/**
 * The horizon across a cell: normal angle `a` of ANGLES, centre distance `o` points. Each
 * point is sampled four by four: the colour covering most of it, or (dithered by how much it
 * covers) the next most - so the line is smooth at every angle. The glow is a line, not an
 * edge: a point it covers three eighths of is the glow, so the line keeps unbroken at every
 * angle and offset, and is never dithered away.
 */
function horizonTile(a, o) {
  const b = (a / (ANGLES - 1)) * (Math.PI / 2)
  const nx = Math.sin(b)
  const ny = -Math.cos(b)
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) c.set(x, y, horizonPoint(coverOf(o, nx, ny, x, y), x, y))
  }
  return c
}

/** How many of a point's sixteen samples each colour of the horizon covers. */
function coverOf(o, nx, ny, x, y) {
  const cover = new Map()
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const z = zoneOf(o + (x + (sx + 0.5) / 4 - 4) * nx + (y + (sy + 0.5) / 4 - 4) * ny)
      cover.set(z, (cover.get(z) ?? 0) + 1)
    }
  }
  return cover
}

/** A horizon point's colour from its cover: the glow if it has enough, else the dithered two. */
function horizonPoint(cover, x, y) {
  if ((cover.get(GLOW) ?? 0) >= 6) return GLOW
  cover.delete(GLOW)
  const [first, second] = [...cover].sort((p, q) => q[1] - p[1] || p[0] - q[0])
  const share = second === undefined ? 0 : second[1] / (first[1] + second[1])
  return share > bayer(x, y) ? second[0] : first[0]
}

/** The band tiles of one side (the sky up, the sea down) by centre distance from the horizon. */
function bandTiles(tiles, bands, up) {
  const out = new Map()
  for (let d = REACH + 1; d <= RANGE; d++) {
    const { k, seam } = bandOf(bands, d)
    const outer = bands[k + 1]?.[1] ?? bands[k][1]
    out.set(d, tiles.add(bandTile(bands[k][1], outer, seam, up)))
  }
  return out
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
  const sky = bandTiles(tiles, SKY_BANDS, true)
  const sea = bandTiles(tiles, SEA_BANDS, false)
  const bands = []
  for (let s = -RANGE; s <= RANGE; s++) {
    if (Math.abs(s) <= REACH) bands.push(partial[s + REACH] ?? 0)
    else bands.push((s > 0 ? sky.get(s) : sea.get(-s)) ?? 0)
  }
  return { tiles: tiles.list, table: [...bands, ...partial] }
}
