// ELECAIRCOMBAT's sky and sea (docs/elec16-elecaircombat.md section 4): the tiles BG0 is
// rewritten with every frame, and the tables that choose them. A cell's tile depends only on
// its centre's distance from the horizon, in points (the sky positive): far from it a band of
// colour - the sky plain, the sea with waves - and between two bands a cell-high step from one
// to the next; within six points of it a tile that draws the horizon across the cell at the
// angle it lies, smoothed. Those are drawn for a quarter turn of angles (ANGLES of them); the
// game flips them for the rest. Which distances share a tile is what the game's row writer
// pays for, never what the tiles show: the bands keep as many runs as they always had. Broad
// areas are flat tones and strokes, never a dither: only the horizon's own line is smoothed by
// one, where two tones meet (user decision 2026-10-05). The sea's band tiles come last, and
// are drawn again in each phase of the waves' motion (sea.png), which the game copies over
// them in turn.

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
 * between them are what make the steps a gradient.
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
 * horizon always puts exactly one row of cells on it, and that row's tile steps from one
 * band's colour to the next across its eight lines.
 */
const SEAM = 8

/**
 * A seam's lines, the outer band's (1) or the inner's (0), from the line nearer the horizon:
 * three of one, two lines interleaved where the two meet, three of the other. Whole lines,
 * never an ordered dither: at the screen's size a checker of two colours reads as a field of
 * dots (user decision 2026-10-05), a line or two of each reads as the step it is.
 */
const SEAM_LINES = [0, 0, 0, 1, 0, 1, 1, 1]

/**
 * The sea's waves for each band, nearest the horizon first: `+` a crest (a step lighter),
 * `#` its lit middle (two steps lighter), `-` the shadow under it (a step darker). Strokes,
 * never single points: a crest at least three points long, its shadow under it. Far off (near
 * the horizon) thin short crests close together; near, long ones with deep shadows. A band's
 * rows repeat every PERIOD lines (four far off, eight near) and every eight points across, so
 * the tile repeats seamlessly; the sea moves by drawing it again moved towards the viewer.
 */
const SEA_WAVES = [
  ['..+++...', '........', '++....++', '........'],
  ['.+++++..', '..-----.', '++...+++', '---...--'],
  ['.++++++.', '..------', '........', '........', '+++..+++', '----..--', '........', '........'],
  ['.++##++.', '..------', '........', '........', '#++..++#', '----..--', '........', '........'],
  ['++###++.', '.-------', '........', '........', '#++.++##', '----.---', '........', '........'],
  ['.++###+.', '..+++++.', '........', '........', '#+...+##', '++...+++', '........', '........'],
]
/** The phases of the sea's motion: each moves the waves on a quarter of their rows' repeat. */
export const SEA_PHASES = 4

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

/** A sky tile: `inner` (the band nearer the horizon) at the bottom, stepping to `outer` up a seam. */
function skyTile(inner, outer, seam) {
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) c.rect(0, y, 8, 1, seam && SEAM_LINES[7 - y] === 1 ? outer : inner)
  return c
}

/**
 * A sea tile of band `k` at `phase`: its colour, stepping to the next band's (deeper, at the
 * bottom) on a seam, then the band's waves over it, moved down `phase` steps.
 */
function seaTile(k, seam, phase) {
  const colour = SEA_BANDS[k][1]
  const deeper = SEA_BANDS[Math.min(k + 1, SEA_BANDS.length - 1)][1]
  const waves = SEA_WAVES[k]
  const step = waves.length / SEA_PHASES
  const c = new Canvas(8, 8)
  for (let y = 0; y < 8; y++) {
    const base = seam && SEAM_LINES[y] === 1 ? deeper : colour
    const row = waves[(((y - phase * step) % waves.length) + waves.length) % waves.length]
    for (let x = 0; x < 8; x++) c.set(x, y, waveOn(row[x], base))
  }
  return c
}

/** A sea point of colour `base` under the waves' `mark`. */
function waveOn(mark, base) {
  if (mark === '+') return Math.max(SEA_HAZE, base - 1)
  if (mark === '#') return Math.max(SEA_HAZE, base - 2)
  if (mark === '-') return Math.min(15, base + 1)
  return base
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

/** The sky's band tiles by centre distance. */
function skyBands(tiles) {
  const sky = new Map()
  for (let s = REACH + 1; s <= RANGE; s++) {
    const { k, seam } = bandOf(SKY_BANDS, s)
    const outer = SKY_BANDS[k + 1]?.[1] ?? 0
    sky.set(s, tiles.add(skyTile(SKY_BANDS[k][1], outer, seam)))
  }
  return sky
}

/**
 * The sea's band tiles: each distance's place among them (a band and its seam, deepest
 * first), and every phase's tiles in that order, phase by phase.
 */
function seaBands() {
  const seaKeys = []
  const sea = new Map()
  for (let s = -RANGE; s < -REACH; s++) {
    const { k, seam } = bandOf(SEA_BANDS, -s)
    const key = `${k}${seam ? 's' : ''}`
    if (!seaKeys.includes(key)) seaKeys.push(key)
    sea.set(s, seaKeys.indexOf(key))
  }
  const phases = []
  for (let p = 0; p < SEA_PHASES; p++) {
    for (const key of seaKeys) phases.push(seaTile(Number(key[0]), key.endsWith('s'), p))
  }
  return { sea, seaKeys, phases }
}

/**
 * Every tile, and the table: RANGE * 2 + 1 band entries (distance -RANGE first), then ANGLES *
 * OFFSETS horizon entries (angle by angle, offset -REACH first). Entries are tile numbers in
 * the sheet; the band entries within REACH of the horizon are the level horizon's. The sea's
 * band tiles come last in the sheet, in the order of `sea` (each phase's tiles in that order,
 * phase by phase): the game copies a phase over them to move the waves.
 */
export function horizon() {
  const tiles = new Tiles()
  tiles.add(solid(1))
  const partial = []
  for (let a = 0; a < ANGLES; a++) {
    for (let o = -REACH; o <= REACH; o++) partial.push(tiles.add(horizonTile(a, o)))
  }
  const sky = skyBands(tiles)
  // The sea's tiles, numbered after every other.
  const { sea, seaKeys, phases } = seaBands()
  const first = tiles.list.length
  const list = [...tiles.list, ...phases.slice(0, seaKeys.length)]
  const bands = []
  for (let s = -RANGE; s <= RANGE; s++) {
    if (Math.abs(s) <= REACH) bands.push(partial[s + REACH] ?? 0)
    else bands.push(s > 0 ? (sky.get(s) ?? 0) : first + (sea.get(s) ?? 0))
  }
  return { tiles: list, table: [...bands, ...partial], sea: phases, seaTiles: seaKeys.length }
}
