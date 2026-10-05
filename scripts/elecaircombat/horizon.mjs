// ELECAIRCOMBAT's sky and sea (docs/elec16-elecaircombat.md section 4): the tiles BG0 is
// rewritten with every frame, and the tables that choose them. A cell's tile depends only on
// its centre's distance from the horizon, in points (the sky positive): far from it a band of
// one colour; within six points of it a tile that draws the horizon across the cell at the
// angle it lies, smoothed. Those are drawn for a quarter turn of angles (ANGLES of them); the
// game flips them for the rest. Which distances share a tile is what the game's row writer
// pays for, never what the tiles show. Band meets band with a plain change of colour - no
// seam, dither or texture - and the palette's steps between them are small and even, so a
// banked sky's cell steps are barely seen and the whole reads as one smooth gradient (user
// review 2026-10-05). The sea has no waves: only its gradient, from the bright haze at the
// horizon to the deep water below.

import { Canvas } from '../eleclance/draw.mjs'
import { SEA_PLACES, SKY_PLACES } from './palettes.mjs'

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

/**
 * Bayer 4x4: a threshold 0-1 for ordered dithering at (x, y), only along the horizon's line;
 * a tile of 8 repeats it whole.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16

/**
 * A point's colour in a horizon cell by its distance from the horizon (the sky positive): the
 * first band of each side meets the glow, so the cell joins the bands beyond it.
 */
function zoneOf(s) {
  if (s >= 1.5) return HAZE
  if (s >= 0) return GLOW
  return SEA_HAZE
}

/**
 * Where each band begins, away from the horizon (points): the sky up and the sea down, a band
 * for each step of the palette's gradient (palettes.mjs `SKY_PLACES`, `SEA_PLACES`). A band's
 * tile is one colour wherever its run reaches, so the colours step in runs; the steps are
 * small and even, so they are not seen as edges. The bands narrow a little towards the
 * horizon (by the power 1.15), where the light changes fastest. Each band edge is a change of
 * tile the row writer meets; it pays for them cell by cell (tests hold the frame's cost).
 */
const starts = (n, end) =>
  Array.from({ length: n }, (_, k) => Math.round(7 + (end - 7) * (k / (n - 1)) ** 1.15))
const SKY_FROM = starts(SKY_PLACES.length, 150)
const SEA_FROM = starts(SEA_PLACES.length, 120)

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

/** The band's step for a centre distance `d` beyond the horizon's cells. */
function bandOf(from, d) {
  let k = 0
  while (k + 1 < from.length && d >= from[k + 1]) k++
  return k
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

/**
 * The band entries of one side (the sky up, the sea down) by centre distance from the horizon:
 * a one-colour tile, and the slot its colour is in as a tile word's palette bits (10-12).
 */
function bandTiles(tiles, from, places) {
  const out = new Map()
  for (let d = REACH + 1; d <= RANGE; d++) {
    const [slot, colour] = places[bandOf(from, d)]
    out.set(d, tiles.add(solid(colour)) + (slot << 10))
  }
  return out
}

/**
 * Every tile, and the table: RANGE * 2 + 1 band entries (distance -RANGE first), then ANGLES *
 * OFFSETS horizon entries (angle by angle, offset -REACH first). Entries are tile numbers in
 * the sheet, a band's with its slot in bits 10-12 (the game adds the sheet's first tile); the
 * band entries within REACH of the horizon are the level horizon's.
 */
export function horizon() {
  const tiles = new Tiles()
  tiles.add(solid(1))
  const partial = []
  for (let a = 0; a < ANGLES; a++) {
    for (let o = -REACH; o <= REACH; o++) partial.push(tiles.add(horizonTile(a, o)))
  }
  const sky = bandTiles(tiles, SKY_FROM, SKY_PLACES)
  const sea = bandTiles(tiles, SEA_FROM, SEA_PLACES)
  const bands = []
  for (let s = -RANGE; s <= RANGE; s++) {
    if (Math.abs(s) <= REACH) bands.push(partial[s + REACH] ?? 0)
    else bands.push((s > 0 ? sky.get(s) : sea.get(-s)) ?? 0)
  }
  return { tiles: tiles.list, table: [...bands, ...partial] }
}
