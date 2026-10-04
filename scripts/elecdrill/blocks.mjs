// ELECDRILL's field (docs/elec16-elecdrill.md section 6): the coloured blocks, which join into
// one rounded, glossy shape with their neighbours of a colour, the ALLOY block and its cracks,
// the air capsule, the core at 500 m, the dug ground and the pop a block vanishes in.
//
// A block is drawn by lighting a shape: the cell and its joined neighbours make a region, its
// outer corners rounded; a dome rises a few points in from its edge, lit from the top left.
// Every tile is a crop of such a picture, so any neighbours meet without a seam.
import { bayer, Canvas, chance, each, fbm } from '../eleclance/draw.mjs'

/** Neighbours: north, east, south, west, then the corners. */
export const N = 1
export const E = 2
export const S = 4
export const W = 8
export const NE = 16
export const SE = 32
export const SW = 64
export const NW = 128

const OFFSETS = [
  [N, 0, -1],
  [E, 1, 0],
  [S, 0, 1],
  [W, -1, 0],
  [NE, 1, -1],
  [SE, 1, 1],
  [SW, -1, 1],
  [NW, -1, -1],
]

/** The region of a cell and the neighbours in `mask`, 48 points square, the cell in the middle. */
function region(mask) {
  const inside = new Uint8Array(48 * 48)
  const fill = (cx, cy) => each(16, 16, (x, y) => (inside[(cy + y) * 48 + cx + x] = 1))
  fill(16, 16)
  for (const [bit, dx, dy] of OFFSETS) if (mask & bit) fill(16 + dx * 16, 16 + dy * 16)
  return inside
}

const isOut = (inside, px, py) => px < 0 || py < 0 || px >= 48 || py >= 48 || !inside[py * 48 + px]

/** From (x, y) inside: the distance to the nearest point outside (to `reach`) and the way to it. */
function nearestOut(inside, x, y, reach) {
  let best = [reach, 0, 0]
  for (let yy = -reach; yy <= reach; yy++) {
    for (let xx = -reach; xx <= reach; xx++) {
      const d = Math.hypot(xx, yy)
      if (d < best[0] && isOut(inside, x + xx, y + yy)) best = [d, xx, yy]
    }
  }
  return best
}

/** For every point inside, its `nearestOut` (to 9 points); none for a point outside. */
function nearest(inside) {
  const out = new Array(48 * 48)
  each(48, 48, (x, y) => {
    if (inside[y * 48 + x]) out[y * 48 + x] = nearestOut(inside, x, y, 9)
  })
  return out
}

/** Whether a point of `core` lies within `r` of (x, y). */
function nearCore(core, x, y, r) {
  for (let yy = -r - 1; yy <= r + 1; yy++) {
    for (let xx = -r - 1; xx <= r + 1; xx++) {
      if (Math.hypot(xx, yy) <= r + 0.5 && !isOut(core, x + xx, y + yy)) return true
    }
  }
  return false
}

/** The region with its outer corners rounded: opened by a disc of radius `r`. */
function rounded(inside, r) {
  const near = nearest(inside)
  const core = new Uint8Array(48 * 48)
  for (let k = 0; k < core.length; k++) core[k] = near[k] !== undefined && near[k][0] > r ? 1 : 0
  const out = new Uint8Array(48 * 48)
  each(48, 48, (x, y) => {
    if (inside[y * 48 + x]) out[y * 48 + x] = nearCore(core, x, y, r) ? 1 : 0
  })
  return out
}

/**
 * A point of a block's face: the outline, the rim (lit where the edge faces up and left,
 * shaded where it faces down and right), or the face, a soft dome of light up and left in
 * each cell, darker towards its foot.
 */
function shadeAt([dist, dx, dy], x, y) {
  if (dist <= 1.01) return 1
  if (dist <= 3.6) return rimAt(dist, dx, dy)
  const lx = x - 5.5
  const ly = y - 5
  if (lx * lx * 0.8 + ly * ly < 10) return 5
  return y > 11 ? 3 : 4
}

/** The rim, `dist` in from the edge that lies (dx, dy) away. */
function rimAt(dist, dx, dy) {
  const s = -(dx * 0.62 + dy * 0.78) / Math.max(dist, 0.001)
  const close = dist < 2.3
  if (s > 0.3) return close ? 6 : 5
  if (s < -0.3) return close ? 2 : 3
  return s > 0 ? 5 : 3
}

/**
 * The middle cell of a joined shape (neighbours in `mask`), 16 points square, in the blocks'
 * layout: 1 outline, 2-6 dark to light, 7 the glint.
 */
export function blob(mask) {
  const shape = rounded(region(mask), 5)
  const near = nearest(shape)
  const c = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const at = (16 + y) * 48 + 16 + x
    if (shape[at]) c.set(x, y, shadeAt(near[at], x, y))
  })
  // Each cell's own glint, up and left of its middle: a bead of light that tiles in a group.
  for (const [x, y, k] of [
    [4, 4, 7],
    [5, 4, 7],
    [6, 4, 6],
    [4, 5, 7],
    [4, 6, 6],
    [9, 4, 6],
  ]) {
    if (c.get(x, y) >= 4) c.set(x, y, k)
  }
  return c
}

/** A quarter's look from its vertical, horizontal and diagonal neighbours: 0-4. */
const CASES = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [1, 1, 1],
]

/**
 * The twenty quarter tiles of the field's blocks, quarter by quarter (top left, top right,
 * bottom left, bottom right), five cases each: alone at that corner, joined up or down, joined
 * across, joined both ways round an inner corner, inside.
 */
export function blockQuarters() {
  const quarters = [
    [N, W, NW, 0, 0],
    [N, E, NE, 8, 0],
    [S, W, SW, 0, 8],
    [S, E, SE, 8, 8],
  ]
  const out = []
  for (const [v, h, dg, qx, qy] of quarters) {
    for (const [cv, ch, cd] of CASES) {
      const mask = (cv ? v : 0) | (ch ? h : 0) | (cd ? dg : 0)
      const full = blob(mask)
      const t = new Canvas(8, 8)
      each(8, 8, (x, y) => t.set(x, y, full.get(qx + x, qy + y)))
      out.push(t)
    }
  }
  return out
}

/** A loose block's sixteen frames, by its joined neighbours (N E S W bits), corners filled. */
export function looseFrames() {
  const out = []
  for (let m = 0; m < 16; m++) {
    let mask = m
    if (m & N && m & E) mask |= NE
    if (m & S && m & E) mask |= SE
    if (m & S && m & W) mask |= SW
    if (m & N && m & W) mask |= NW
    out.push(blob(mask))
  }
  return out
}

/* ---------------- ALLOY, the capsule, the core ---------------- */

// In the panel palette: 1 black, 2-5 steel dark to light, 6-8 glass, 9 orange, 10 red,
// 11 green, 15 white.

/** ALLOY: a riveted steel crate with a hazard cross, cracked a little more with each hit. */
export function alloyFrames() {
  const cracks = crackLines(chance(31))
  const out = []
  for (let hits = 0; hits < 5; hits++) {
    const c = alloyPlate()
    for (const pts of cracks.slice(0, hits)) crack(c, pts)
    // Heated by the drill: the last hits glow red at the cracks' ends.
    if (hits >= 3) {
      for (const pts of cracks.slice(0, hits)) {
        const [x, y] = pts[pts.length - 1]
        c.set(Math.round(x), Math.round(y), 10)
      }
    }
    out.push(c)
  }
  return out
}

/** Four cracks, each a short jagged line from an edge in. */
function crackLines(rnd) {
  const out = []
  const starts = [
    () => [2 + rnd() * 3, 4 + rnd() * 8],
    () => [13, 4 + rnd() * 8],
    () => [8 + rnd() * 4, 13],
    () => [8 + rnd() * 4, 2],
  ]
  for (const start of starts) {
    let [x, y] = start()
    const pts = [[x, y]]
    for (let s = 0; s < 4; s++) {
      x += (8 - x) * 0.3 + (rnd() - 0.5) * 3
      y += (8 - y) * 0.3 + (rnd() - 0.5) * 3
      pts.push([x, y])
    }
    out.push(pts)
  }
  return out
}

function crack(c, pts) {
  for (let s = 0; s + 1 < pts.length; s++) {
    const [x0, y0] = pts[s].map(Math.round)
    const [x1, y1] = pts[s + 1].map(Math.round)
    c.line(x0, y0, x1, y1, 1)
  }
}

/** The crate whole: a bevelled steel plate, its corners cut, the orange cross, rivets. */
function alloyPlate() {
  const c = new Canvas(16, 16)
  c.rect(1, 1, 14, 14, 3)
  for (let k = 1; k < 15; k++) {
    c.set(k, 0, 1)
    c.set(k, 15, 1)
    c.set(0, k, 1)
    c.set(15, k, 1)
    c.set(k, 1, 5)
    c.set(1, k, 4)
    c.set(k, 14, 2)
    c.set(14, k, 2)
  }
  c.set(1, 1, 5)
  for (let k = 3; k <= 12; k++) {
    c.set(k, k, 9)
    c.set(15 - k, k, 9)
    c.set(k + 1, k, 9)
    c.set(14 - k, k, 9)
  }
  // The cross edged dark where the plate meets it below and right.
  each(16, 16, (x, y) => {
    if (c.get(x, y) === 3 && (c.get(x - 1, y) === 9 || c.get(x, y - 1) === 9)) c.set(x, y, 2)
  })
  for (const [x, y] of [
    [3, 3],
    [12, 3],
    [3, 12],
    [12, 12],
  ]) {
    c.set(x, y, 5)
    c.set(x + 1, y + 1, 2)
  }
  return c
}

/** The air capsule: a glass bubble of blue air in a steel cradle; two frames, the glint moving. */
export function capsuleFrames() {
  const bubbles = [
    [
      [6, 11],
      [9, 7],
      [10, 11],
    ],
    [
      [6, 10],
      [9, 6],
      [10, 12],
    ],
  ]
  return [0, 1].map((f) => {
    const c = new Canvas(16, 16)
    // The cradle's caps, top and bottom.
    c.rect(4, 1, 8, 2, 4)
    c.rect(4, 13, 8, 2, 3)
    c.rect(5, 0, 6, 1, 1)
    c.rect(4, 15, 8, 1, 1)
    c.ellipse(8, 8, 6.4, 5.6, glass)
    c.outline(1)
    // Bubbles rising in the air inside, and a band round the glass.
    for (let x = 3; x < 13; x++) if (c.get(x, 9) !== 0) c.set(x, 9, f === 0 ? 8 : 7)
    for (const [x, y] of bubbles[f]) c.set(x, y, 8)
    // The glint slides round.
    const gx = 5 + f
    c.set(gx, 4, 15)
    c.set(gx + 1, 4, 15)
    c.set(gx - 1, 5, 15)
    c.set(12, 2, 9)
    c.set(3, 2, 9)
    return c
  })
}

/** Glass lit from the top left: deep, mid and pale cyan. */
function glass(nx, ny, nz) {
  const lit = -nx * 0.5 - ny * 0.6 + nz * 0.6
  return lit > 0.75 ? 8 : lit > 0.25 ? 7 : 6
}

/** The core at 500 m: a glowing crystal floor (flash palette 8-11, which the game pulses). */
export function coreFrame() {
  const c = new Canvas(16, 16)
  const rnd = chance(77)
  each(16, 16, (x, y) => {
    const ridge =
      Math.abs(((x + y * 2) % 16) - 8) < 2 || Math.abs(((x * 2 - y + 32) % 16) - 8) < 1.5
    c.set(x, y, ridge ? 10 : rnd() < 0.15 ? 11 : 9)
  })
  for (let k = 0; k < 16; k++) {
    c.set(k, 0, 11)
    c.set(k, 15, 8)
  }
  return c
}

/* ---------------- the dug ground ---------------- */

/**
 * The dug cells' quarters in an earth palette: top left (a block above, a block left: four),
 * top right (above: two), bottom left (left: two), bottom right, each in two textures - 18
 * tiles. A block casts its shadow down and to the right into the hole beside it.
 */
export function groundQuarters() {
  const out = []
  for (const texture of [0, 1]) {
    const cell = groundCell(texture)
    const quarter = (qx, qy, above, left) => shadowed(cell, qx, qy, above, left)
    for (const [a, l] of [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ])
      out.push(quarter(0, 0, a, l))
    out.push(quarter(8, 0, 0, 0), quarter(8, 0, 1, 0))
    out.push(quarter(0, 8, 0, 0), quarter(0, 8, 0, 1))
    out.push(quarter(8, 8, 0, 0))
  }
  return out
}

/** One 16-point cell of ground: textured, a few pebbles lit from above, a seam of glint. */
function groundCell(texture) {
  const tex = fbm(400 + texture * 37, 3)
  const rnd = chance(90 + texture)
  const cell = new Canvas(16, 16)
  each(16, 16, (x, y) => {
    const v = tex(x * 0.35 + texture * 9, y * 0.35)
    const k = v > 0.62 ? 5 : v > 0.42 ? 4 : 3
    cell.set(x, y, v > 0.5 && bayer(x, y) > 0.8 ? Math.min(k + 1, 5) : k)
  })
  for (let p = 0; p < 2 + texture; p++) {
    const px = 2 + Math.floor(rnd() * 11)
    const py = 2 + Math.floor(rnd() * 11)
    cell.set(px, py, 7)
    cell.set(px + 1, py, 6)
    cell.set(px, py + 1, 6)
    cell.set(px + 1, py + 1, 2)
  }
  if (texture === 1) {
    cell.set(11, 4, 9)
    cell.set(12, 4, 10)
    cell.set(12, 5, 9)
  } else cell.set(4, 11, 9)
  return cell
}

/** A quarter of `cell` from (qx, qy), shadowed along the top and the left by the blocks there. */
function shadowed(cell, qx, qy, above, left) {
  const t = new Canvas(8, 8)
  each(8, 8, (x, y) => {
    const gx = qx + x
    const gy = qy + y
    let k = cell.get(gx, gy)
    if (above && gy < 3) k = [1, 2, Math.min(k, 3)][gy]
    if (left && gx < 3) k = [1, 2, Math.min(k, 3)][gx]
    if (above && left && gx + gy < 4) k = 1
    t.set(x, y, k)
  })
  return t
}

/* ---------------- a block vanishing ---------------- */

/** The pop: the block swells white, bursts into a ring and sparkles (blocks' layout). */
export function popFrames() {
  const out = []
  // 0: swollen and bright.
  const a = new Canvas(16, 16)
  a.ellipse(7.5, 7.5, 7.6, 7.6, (nx, ny) => (nx * nx + ny * ny > 0.75 ? 6 : 7))
  a.outline(5)
  out.push(a)
  // 1-4: a ring that widens and thins, with sparks flung out.
  for (let f = 1; f <= 4; f++) {
    const c = new Canvas(16, 16)
    const r = 2.5 + f * 1.4
    each(16, 16, (x, y) => {
      const d = Math.hypot(x - 7.5, y - 7.5)
      if (Math.abs(d - r) < (f < 3 ? 1.3 : 0.7)) c.set(x, y, f < 3 ? 6 : 5)
      else if (Math.abs(d - r) < 1.9 && f < 3) c.set(x, y, 4)
    })
    for (let k = 0; k < 8; k++) {
      const ang = (k / 8) * Math.PI * 2 + f * 0.3
      const rr = r + 1 + f * 0.6
      const x = Math.round(7.5 + Math.cos(ang) * rr)
      const y = Math.round(7.5 + Math.sin(ang) * rr)
      if (f < 4 || k % 2 === 0) c.set(x, y, 7)
    }
    out.push(c)
  }
  return out
}
