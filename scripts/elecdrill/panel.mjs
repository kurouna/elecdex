// ELECDRILL's machine round the well (docs/elec16-elecdrill.md section 2): the two side panels
// (riveted steel, wells for the readings, the AIR tank and the depth gauge), the big digits of
// the depth, the tank's fill, the small icons, the lettering and the title's word.
//
// Palette `panel`: 1 black, 2-5 steel dark to light, 6-8 glass and air, 9 orange, 10 red,
// 11 green, 12-15 the white lettering (edge, then light).

import { Canvas, chance, each } from '../eleclance/draw.mjs'
import { fontFrames } from '../eleclance/font.mjs'

/** Where the readings go, in cells (the game writes them there: hud.e16.ts). */
export const LAYOUT = {
  left: { x: 0, w: 11 },
  right: { x: 29, w: 11 },
  // Recessed wells: [x, y, w, h] in cells.
  wells: [
    [1, 1, 8, 4], // DEPTH, and the depth in big digits
    [1, 6, 8, 2], // STRATUM and its name
    [1, 9, 8, 2], // SCORE
    [1, 12, 8, 2], // BEST
    [6, 16, 3, 16], // the gauge's marks
    [30, 1, 3, 1], // AIR
    [31, 18, 8, 1], // AIR in per cent
    [31, 20, 8, 2], // DRILLERS left
    [31, 23, 8, 2], // CHAIN
    [31, 26, 8, 2], // CAPSULES
    [31, 29, 8, 2], // LEVEL, the difficulty
  ],
  /** The AIR tank: its glass two cells wide from (34, 3), 14 cells high. */
  tank: [34, 3, 2, 14],
  /** The depth gauge: a tube one cell wide from (4, 16), 15 cells high (100 m in three). */
  gauge: [4, 16, 1, 15],
}

/** The lettering: ELECLANCE's alphabet in the panel's white (and any block's text, 12-15). */
export function fontTiles() {
  return fontFrames().map((c) => {
    c.remap({ 1: 12, 4: 13, 5: 14, 6: 15 })
    return c
  })
}

/** The two panels: everything outside the well's 144 points, which stay clear. */
export function panels() {
  const c = new Canvas(320, 288)
  const rnd = chance(12)
  for (const left of [true, false]) {
    const x0 = left ? 0 : 232
    plates(c, x0, rnd)
    lip(c, left ? 80 : 232, left)
  }
  // The outer edges' bevels.
  for (let y = 0; y < 288; y++) {
    c.set(0, y, 5)
    c.set(1, y, 4)
    c.set(318, y, 4)
    c.set(319, y, 1)
  }
  for (const [x, y, w, h] of LAYOUT.wells) well(c, x * 8 - 2, y * 8 - 2, w * 8 + 4, h * 8 + 4)
  tank(c)
  gauge(c)
  return c
}

/** Brushed plates 88 points wide from `x0`: a seam every 48 points, faint streaks, rivets. */
function plates(c, x0, rnd) {
  each(88, 288, (x, y) => {
    const seam = y % 48
    let k = seam === 0 ? 4 : seam === 47 ? 2 : 3
    if (k === 3 && rnd() < 0.015) k = 2
    c.set(x0 + x, y, k)
  })
  for (let y = 6; y < 288; y += 48) {
    for (const x of [4, 83]) {
      c.set(x0 + x, y, 5)
      c.set(x0 + x + 1, y + 1, 1)
    }
  }
}

/** The well's lip, eight points from `x`: a hazard stripe down its length, bevelled. */
function lip(c, x0, left) {
  const edge = left ? [2, 0, 0, 0, 0, 0, 4, 1] : [1, 4, 0, 0, 0, 0, 0, 2]
  each(8, 288, (x, y) => {
    const stripe = Math.floor((y + x * (left ? 1 : -1) + 64) / 6) % 2 === 0
    c.set(x0 + x, y, edge[x] || (stripe ? 9 : 1))
  })
}

/** A recessed well: a dark floor, shadowed above and left, lit below and right. */
function well(c, x, y, w, h) {
  c.rect(x, y, w, h, 1)
  for (let k = 0; k < w; k++) {
    c.set(x + k, y, 2)
    c.set(x + k, y + h - 1, 5)
  }
  for (let k = 0; k < h; k++) {
    c.set(x, y + k, 2)
    c.set(x + w - 1, y + k, 5)
  }
}

/** The AIR tank's case: a steel frame round the glass, with marks every fifth. */
function tank(c) {
  const [tx, ty, tw, th] = LAYOUT.tank
  const x = tx * 8
  const y = ty * 8
  const w = tw * 8
  const h = th * 8
  // The case, rounded at the ends.
  c.rect(x - 4, y - 6, w + 8, h + 12, 2)
  c.rect(x - 3, y - 5, w + 6, h + 10, 4)
  c.rect(x - 1, y - 1, w + 2, h + 2, 1)
  // The glass is the game's to draw (empty glass is tile... drawn by the fill), clear here.
  each(w, h, (xx, yy) => c.set(x + xx, y + yy, 1))
  // Marks every fifth beside it.
  for (let k = 0; k <= 4; k++) {
    const my = y + Math.round((h * k) / 4)
    c.rect(x + w + 4, my, 3, 1, k === 2 ? 9 : 5)
    c.rect(x - 7, my, 3, 1, k === 2 ? 9 : 5)
  }
  // The valve on top.
  c.rect(x + 4, y - 9, 8, 3, 5)
  c.rect(x + 6, y - 11, 4, 2, 9)
}

/** The depth gauge's tube: dark glass with a tick at each stratum (every three cells). */
function gauge(c) {
  const [gx, gy, , gh] = LAYOUT.gauge
  const x = gx * 8
  const y = gy * 8
  c.rect(x - 2, y - 2, 12, gh * 8 + 4, 2)
  c.rect(x - 1, y - 1, 10, gh * 8 + 2, 4)
  c.rect(x, y, 8, gh * 8, 1)
  for (let k = 0; k <= 5; k++) {
    const my = y + k * 24
    c.rect(x - 6, Math.min(my, y + gh * 8 - 1), 4, 1, k === 5 ? 9 : 5)
    c.rect(x + 10, Math.min(my, y + gh * 8 - 1), 4, 1, k === 5 ? 9 : 5)
  }
}

/** The tank's fill: for each of 0-8 points of air in a cell, its left and right halves. */
export function tankTiles() {
  const out = []
  for (let level = 0; level <= 8; level++) {
    for (const half of [0, 1]) {
      const t = new Canvas(8, 8)
      each(8, 8, (x, y) => t.set(x, y, tankAt(half * 8 + x, y, level)))
      out.push(t)
    }
  }
  return out
}

/** A point of the tank's glass, x 0-15 across it: air lit from the left with a bright top. */
function tankAt(gx, y, level) {
  if (y < 8 - level) return gx === 2 || gx === 3 ? 2 : 1
  if (y === 8 - level) return 8
  return gx < 4 ? 8 : gx < 11 ? 7 : 6
}

/** Icons in the panel's colours: 0 a driller's helmet, 1 an empty place, 2 the gauge's marker. */
export function iconTiles() {
  const helmet = new Canvas(8, 8)
  helmet.ellipse(3.5, 4.5, 3.4, 3.2, (nx, ny) => (ny > 0.3 ? null : nx + ny < -0.6 ? 15 : 9))
  helmet.rect(0, 5, 8, 1, 2)
  helmet.set(5, 2, 15)
  helmet.rect(1, 6, 6, 1, 13)
  const empty = new Canvas(8, 8)
  empty.set(3, 4, 2)
  empty.set(4, 4, 2)
  const marker = new Canvas(8, 8)
  marker.ellipse(3.5, 3.5, 3.2, 3, (nx, ny) => (nx + ny < -0.5 ? 15 : 9))
  marker.set(1, 3, 1)
  marker.set(6, 3, 1)
  // The gauge's glass, empty (behind and below the marker).
  const glass = new Canvas(8, 8)
  each(8, 8, (x) => glass.set(x, 0, x === 2 ? 2 : 1))
  glass.rect(0, 0, 8, 8, 1)
  glass.rect(2, 0, 1, 8, 2)
  // The gauge's part already passed: lit orange.
  const passed = new Canvas(8, 8)
  passed.rect(0, 0, 8, 8, 1)
  passed.rect(1, 0, 6, 8, 9)
  passed.rect(2, 0, 1, 8, 15)
  for (const t of [helmet, empty, marker]) t.outline(1)
  return [helmet, empty, marker, glass, passed]
}

/** The seven segments of a big digit: x, y, w, h on its 16 x 24 face. */
const SEGMENTS = {
  a: [4, 1, 8, 3],
  b: [12, 4, 3, 7],
  c: [12, 13, 3, 7],
  d: [4, 20, 8, 3],
  e: [1, 13, 3, 7],
  f: [1, 4, 3, 7],
  g: [4, 10, 8, 3],
}
const LIT = [
  'abcdef',
  'bc',
  'abged',
  'abgcd',
  'fgbc',
  'afgcd',
  'afgedc',
  'abc',
  'abcdefg',
  'abcdfg',
]

/** Big digits, 16 x 24 (two cells by three), each digit's six tiles in a row: an LCD. */
export function bigDigitTiles() {
  const out = []
  for (let d = 0; d < 10; d++) {
    const c = new Canvas(16, 24)
    for (const [name, [x, y, w, h]] of Object.entries(SEGMENTS)) {
      const lit = LIT[d].includes(name)
      each(w, h, (xx, yy) => segmentPoint(c, x + xx, y + yy, lit, xx === 0 || yy === 0))
    }
    for (let ty = 0; ty < 3; ty++) {
      for (let tx = 0; tx < 2; tx++) {
        const t = new Canvas(8, 8)
        each(8, 8, (x, y) => t.set(x, y, c.get(tx * 8 + x, ty * 8 + y) || 1))
        out.push(t)
      }
    }
  }
  return out
}

/** A segment's point: lit (bright on its top and left edges, dimmer low down) or faintly dark. */
function segmentPoint(c, px, py, lit, edge) {
  if (lit) c.set(px, py, edge ? 15 : py > 12 ? 13 : 14)
  else if ((px + py) % 2 === 0) c.set(px, py, 2)
}

/** The dark band behind a banner in the well (sprites, palette `panel`): its top, middle, foot. */
export function bandFrames() {
  return [0, 1, 2].map((part) => {
    const c = new Canvas(16, 16)
    c.rect(0, 0, 16, 16, 1)
    if (part === 0) {
      c.rect(0, 0, 16, 1, 9)
      c.rect(0, 1, 16, 1, 2)
    }
    if (part === 2) {
      c.rect(0, 14, 16, 1, 2)
      c.rect(0, 15, 16, 1, 9)
    }
    return c
  })
}
