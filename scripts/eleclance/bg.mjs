// ELECLANCE's backgrounds: the stage (BG0, read from the bottom up), the side panels and the
// title's letters (BG1). Drawn so that cells repeat: clouds by marching squares over a coarse
// field (a cell's look depends only on its corners), the station from plates on an 8-point
// grid, so the kit's builder finds few distinct tiles.
import { bayer, Canvas, chance, each, fbm } from './draw.mjs'
import { fontFrames } from './font.mjs'

export const STAGE_W = 40

/** The stage's parts from the bottom up: name and rows (of 8 points). The game reads these. */
export const SECTIONS = [
  { name: 'launch', rows: 64 },
  { name: 'nebula', rows: 128 },
  { name: 'belt', rows: 96 },
  // A boss's arena loops: 64 rows (512 points, BG0's height), so letting go leaves no seam.
  { name: 'approach', rows: 64 },
  { name: 'station', rows: 192 },
  { name: 'beyond', rows: 64 },
]
export const STAGE_H = SECTIONS.reduce((n, s) => n + s.rows, 0)

/** Palette slots on BG0: space (and its far nebula), the near nebula, the station, the hull. */
export const SLOT = { space: 0, nebula: 1, station: 2, hull: 3 }

/**
 * A cloud cell from its four corner levels (0-2 each): each point's level is the corners'
 * blend, thresholded by Bayer dithering into nothing, thin or dense. `thin` and `dense` are
 * colour lists picked by a soft gradient inside.
 */
function cloudCell(c, x0, y0, corners, colours) {
  const [a, b, cc, d] = corners
  each(8, 8, (x, y) => {
    const u = (x + 0.5) / 8
    const v = (y + 0.5) / 8
    const level = a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + d * u * v
    const k = cloudShade(level, bayer(x, y))
    if (k >= 0) c.set(x0 + x, y0 + y, colours[k])
  })
}

/** Which of a cloud's four colours a level takes at dither threshold `t`, or -1 for none. */
function cloudShade(level, t) {
  if (level > 1 + t) return level > 1.6 + t * 0.4 ? 3 : 2
  if (level > t * 1.1 + 0.1) return level > 0.6 + t * 0.4 ? 1 : 0
  return -1
}

/** Stars: a few kinds of cell, placed by a hash where the cell is otherwise empty. */
function starCell(c, x0, y0, kind) {
  const spots = [
    [[2, 3, 9]],
    [
      [5, 1, 8],
      [1, 6, 7],
    ],
    [
      [4, 4, 10],
      [3, 4, 8],
      [5, 4, 8],
      [4, 3, 8],
      [4, 5, 8],
    ],
    [[6, 6, 7]],
    [
      [1, 2, 8],
      [6, 5, 9],
    ],
  ][kind]
  for (const [x, y, col] of spots ?? []) c.set(x0 + x, y0 + y, col)
}

const hash = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return (h ^ (h >>> 16)) / 4294967296
}

/**
 * The stage: `space` everywhere (palette `space`, index 0 the ground), far purple nebula,
 * near rose nebula in its part, amber dust in the belt, the station in its part. Returns the
 * canvases by palette slot so the picture can be written with each cell in its own palette.
 */
export function stage() {
  const H = STAGE_H * 8
  const W = STAGE_W * 8
  const layers = {
    space: new Canvas(W, H),
    nebula: new Canvas(W, H),
    station: new Canvas(W, H),
    hull: new Canvas(W, H),
  }
  const owner = new Uint8Array(STAGE_W * STAGE_H) // which layer each cell is drawn in
  // Rows counted from the bottom of the stage; a section's [start, end).
  const bounds = {}
  let at = 0
  for (const s of SECTIONS) {
    bounds[s.name] = [at, at + s.rows]
    at += s.rows
  }
  const scene = { layers, owner, bounds, far: fbm(101, 4), near: fbm(202, 4), dust: fbm(303, 3) }
  each(STAGE_W, STAGE_H, (cx, cy) => stageCell(scene, cx, cy))
  return { layers, owner }
}

const inPart = (bounds, row, name) => row >= bounds[name][0] && row < bounds[name][1]

/** A coarse field's level (0-2) at a corner (cx, cy in cells, cy from the top). */
const levelAt = (cx, cy, field, scale, lift) => {
  const v = field(cx * scale, cy * scale) + lift
  return v < 0.5 ? 0 : v < 0.62 ? 1 : 2
}

/** The levels at a cell's four corners: top left, top right, bottom left, bottom right. */
const cornersOf = (cx, cy, field, scale, lift) => [
  levelAt(cx, cy, field, scale, lift),
  levelAt(cx + 1, cy, field, scale, lift),
  levelAt(cx, cy + 1, field, scale, lift),
  levelAt(cx + 1, cy + 1, field, scale, lift),
]

/** One cell of the stage: the station where it stands, else near clouds, far clouds or stars. */
function stageCell(scene, cx, cy) {
  const { layers, owner, bounds } = scene
  const row = STAGE_H - 1 - cy
  const x0 = cx * 8
  const y0 = cy * 8
  if (inPart(bounds, row, 'station') && stationCell(layers, cx, cy, row - bounds.station[0], owner))
    return
  if (nearCloudCell(scene, cx, cy, row)) return
  const farLift = inPart(bounds, row, 'launch') ? -0.1 : -0.05
  const farC = cornersOf(cx, cy, scene.far, 0.07, farLift)
  if (farC.some((v) => v > 0)) {
    cloudCell(layers.space, x0, y0, farC, [1, 11, 2, 12])
    return
  }
  const r = hash(cx, cy, 7)
  if (r < 0.22) starCell(layers.space, x0, y0, Math.floor(r * 22.7) % 5)
}

/**
 * Near nebula (rose) in its part and fading into the belt as amber dust, or false where none
 * reaches the cell. The near clouds thin out over a few dozen rows either side of their
 * parts, no edge.
 */
function nearCloudCell(scene, cx, cy, row) {
  const { bounds } = scene
  const belt = inPart(bounds, row, 'belt')
  const [from, to] = [bounds.nebula[0], bounds.belt[1]]
  const outside = row < from ? from - row : row >= to ? row - to + 1 : 0
  const nearLift = outside > 24 ? -1 : -0.04 - (belt ? 0.03 : 0) - outside * 0.025
  const nearC = cornersOf(cx, cy, belt ? scene.dust : scene.near, 0.11, nearLift)
  if (nearLift <= -1 || !nearC.some((v) => v > 0)) return false
  // Dark and quiet: the ground behind the bullets, never brighter than they are.
  const colours = belt ? [1, 10, 10, 10] : [1, 2, 2, 3]
  cloudCell(scene.layers.nebula, cx * 8, cy * 8, nearC, colours)
  scene.owner[cy * STAGE_W + cx] = SLOT.nebula
  return true
}

/**
 * One cell of the station, or false where open space shows: a trench between two walls that
 * narrow and widen, a floor of plates with lamps and vents, and bridges across.
 */
function stationCell(layers, cx, cy, row, owner) {
  const half = STAGE_W / 2
  // The trench's half width in cells, stepping every 16 rows.
  const widths = [7, 8, 9, 9, 8, 7, 6, 7, 8, 10, 11, 10, 9, 8]
  const band = Math.floor(row / 16)
  const width = widths[band % widths.length]
  const fromCentre = cx < half ? half - 1 - cx : cx - half
  // The first and last rows of the part: the station's edge, open space beyond.
  if (row < 2 || row >= 190) return false
  const bridge = row % 48 >= 40 && row % 48 < 43
  const s = layers.station
  const h = layers.hull
  const x0 = cx * 8
  const y0 = cy * 8
  if (fromCentre >= width) {
    wallCell(h, x0, y0, fromCentre - width, row, cx < half)
    owner[cy * STAGE_W + cx] = SLOT.hull
    return true
  }
  if (bridge) {
    girder(s, x0, y0, (row % 48) - 40)
    owner[cy * STAGE_W + cx] = SLOT.station
    return true
  }
  // The floor: steel plates in a 2x2 cell pattern, lamps down the centre line, vents.
  plate(s, x0, y0, [2, 3, 4, 5], (cx + row) % 2 === 0)
  if (fromCentre === 0 && row % 4 === 0) lamp(s, cx < half ? x0 + 7 : x0, y0 + 3, 11)
  if (fromCentre === 3 && row % 6 < 2) vent(s, x0, y0)
  owner[cy * STAGE_W + cx] = SLOT.station
  return true
}

/** A cell of the walls, `depth` cells out from the trench: hull plates, a lit edge facing it. */
function wallCell(h, x0, y0, depth, row, left) {
  wall(h, x0, y0, depth, row)
  if (depth === 0) wallEdge(h, x0, y0, left)
  if (depth === 1 && row % 8 === 2) lamp(h, x0 + 3, y0 + 3, 11)
}

/** A bevelled plate filling a cell: `ramp` dark to light; `seam` draws a seam at its top. */
function plate(c, x0, y0, ramp, seam) {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let k = 1
      if (y === 0 || x === 0) k = 2
      if (y === 7 || x === 7) k = 0
      c.set(x0 + x, y0 + y, ramp[k])
    }
  }
  if (seam) for (let x = 1; x < 7; x++) c.set(x0 + x, y0 + 3, ramp[0])
  c.set(x0 + 1, y0 + 1, ramp[3])
}

/**
 * The walls' face, by depth from the trench (0 at its edge): a pipe run, then recessed
 * panels two cells high, then dark plates; seams every four rows.
 */
function wall(c, x0, y0, depth, row) {
  if (depth === 1) {
    each(8, 8, (x, y) => c.set(x0 + x, y0 + y, [2, 4, 6, 7, 6, 4, 3, 2][x]))
    if (row % 4 === 0) for (let x = 0; x < 8; x++) c.set(x0 + x, y0 + 7, 1)
    return
  }
  const ramp = depth % 2 === 0 ? [2, 3, 4, 5] : [1, 2, 3, 4]
  plate(c, x0, y0, ramp, row % 4 === 0)
  if (depth >= 2 && row % 2 === 0) for (let x = 2; x < 6; x++) c.set(x0 + x, y0 + 5, 9)
}

function wallEdge(c, x0, y0, left) {
  const x = left ? x0 + 7 : x0
  for (let y = 0; y < 8; y++) {
    c.set(x, y0 + y, 8)
    c.set(left ? x - 1 : x + 1, y0 + y, 7)
  }
}

function lamp(c, x, y, colour) {
  c.set(x, y, colour)
  c.set(x + 1, y, colour)
  c.set(x, y + 1, colour)
  c.set(x + 1, y + 1, 15)
}

function vent(c, x0, y0) {
  for (let y = 1; y < 7; y += 2) for (let x = 1; x < 7; x++) c.set(x0 + x, y0 + y, 1)
}

/** A girder across the trench: three rows of cells (0 top, 1 middle, 2 bottom). */
function girder(c, x0, y0, part) {
  each(8, 8, (x, y) => c.set(x0 + x, y0 + y, girderShade(part, x, y)))
}

/** A girder's colour at (x, y) in its cell: a lit top, a dark foot, cross bracing between. */
function girderShade(part, x, y) {
  if (part === 0 && y < 2) return 8
  if (part === 2 && y > 5) return 3
  if (part === 1 && ((x + y) % 8 < 2 || (x - y + 8) % 8 < 2)) return 4
  return 6
}

/** The stage as one RGBA picture, each cell in its palette (`colours(slot)` gives RGB lists). */
export function stagePicture(colours) {
  const { layers, owner } = stage()
  const W = STAGE_W * 8
  const H = STAGE_H * 8
  const data = new Uint8Array(W * H * 4)
  const bySlot = [layers.space, layers.nebula, layers.station, layers.hull]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const slot = owner[Math.floor(y / 8) * STAGE_W + Math.floor(x / 8)]
      const c = bySlot[slot].get(x, y)
      if (c === 0) continue
      const [r, g, b] = colours(slot)[c]
      data.set([r, g, b, 255], (y * W + x) * 4)
    }
  }
  return { width: W, height: H, data }
}

/**
 * The side panels (BG1, palette `panel`): 48 points each side of the 224-point field, dark
 * metal with a bevelled frame, a neon line on the inner edge and wells for the readings.
 * The middle is clear. Wells: rows (in cells) where the game writes, for the left and right.
 */
export const PANEL_WELLS = {
  left: [2, 3, 6, 7, 11, 12, 15, 16],
  right: [2, 3, 7, 8, 12, 13, 17, 18, 22, 23],
}

export function panels() {
  const c = new Canvas(320, 288)
  for (const left of [true, false]) panel(c, left)
  return c
}

/** One side panel, the left or the right. */
function panel(c, left) {
  const x0 = left ? 0 : 272
  // The body: dark plates, rivets every two cells.
  for (let y = 0; y < 288; y++) panelRow(c, x0, y, left)
  for (let y = 4; y < 288; y += 32) {
    c.set(x0 + 3, y, 7)
    c.set(x0 + 44, y, 7)
  }
  // Wells for the readings: recessed, a cell high, inside the frame.
  for (const row of left ? PANEL_WELLS.left : PANEL_WELLS.right) {
    each(40, 8, (x, y) => c.set(x0 + 4 + x, row * 8 + y, y === 0 ? 1 : 2))
  }
}

/** A row of a panel's body and its frame. */
function panelRow(c, x0, y, left) {
  for (let x = 0; x < 48; x++) {
    // Plain dark plates, a seam every 32 points: quiet beside the field.
    let k = 3
    if (y % 32 === 0) k = 5
    if (y % 32 === 31) k = 1
    if (x === (left ? 6 : 41)) k = 2
    c.set(x0 + x, y, k)
  }
  // The frame: a bright bevel on the outer edge, the neon on the inner.
  const outer = left ? x0 : x0 + 47
  const inner = left ? x0 + 47 : x0
  c.set(outer, y, 6)
  c.set(inner, y, 10)
  c.set(left ? inner - 1 : inner + 1, y, 9)
  c.set(left ? inner - 2 : inner + 2, y, 1)
}

/** The title's word, ELECLANCE: the alphabet's letters drawn four times as big, chrome with an edge. */
export function logo() {
  const font = fontFrames()
  const word = 'ELECLANCE'
  const scale = 3
  const w = word.length * 7 * scale + 16
  const c = new Canvas(Math.ceil(w / 8) * 8, 40)
  const rnd = chance(5)
  ;[...word].forEach((ch, k) => {
    bigLetter(c, font[ch.charCodeAt(0) - 32], 8 + k * 7 * scale, scale)
  })
  c.outline(11, true)
  c.outline(9)
  // A lance of light under the word.
  for (let x = 4; x < c.w - 4; x++) {
    c.set(x, 33, rnd() < 0.85 ? 14 : 8)
    if (x % 3 === 0) c.set(x, 34, 2)
  }
  return c
}

/** A glyph of the alphabet drawn `scale` times as big at column `x0`, in chrome. */
function bigLetter(c, glyph, x0, scale) {
  each(8, 8, (x, y) => {
    if (glyph.get(x, y) < 4) return
    each(scale, scale, (sx, sy) => {
      const py = y * scale + sy
      c.set(x0 + x * scale + sx, 6 + py, chrome(py / (7 * scale)))
    })
  })
}

/** Chrome at height `t` (0 top): light at the top, a dark band at the waist, light again below. */
function chrome(t) {
  if (t < 0.15) return 8
  if (t < 0.35) return 7
  if (t < 0.45) return 6
  if (t < 0.55) return 3
  if (t < 0.75) return 5
  return 6
}
