// ELECAIRCOMBAT's cockpit (docs/elec16-elecaircombat.md section 3): the canopy's bow and rails,
// the HUD's combiner posts and the instrument panel, drawn on BG1 in front of every sprite; and
// the displays' glass under the panel's holes, on BG0's bottom rows. Flat plates and bevelled
// edges, so the kit's builder finds few distinct tiles.
import { Canvas } from '../eleclance/draw.mjs'
import { fontFrames } from '../eleclance/font.mjs'

/** Where the panel's holes are, in cells: the left and right displays and the centre one. */
export const SCREENS = {
  left: { x: 3, y: 28, w: 9, h: 7 },
  right: { x: 28, y: 28, w: 9, h: 7 },
  centre: { x: 15, y: 29, w: 10, h: 5 },
}
/** The rows of BG0 under the panel: from this row down, the displays' glass. */
export const PANEL_ROW = 27

/** The frame palette's colours. */
const F = {
  black: 1,
  d0: 2,
  d1: 3,
  d2: 4,
  m0: 5,
  m1: 6,
  l0: 7,
  l1: 8,
  l2: 9,
  stripe: 10,
  stripeHi: 11,
  mirror: 12,
  lampMissile: 13,
  lampAlt: 14,
  lampLock: 15,
}

/** The bottom edge of the canopy's bow at column x (thicker towards the corners). */
const bowEdge = (x) => Math.round(9 + 30 * Math.abs((x - 159.5) / 160) ** 5)
/** The inner edge of a canopy rail at row y (x from the side). */
const railEdge = (y) => Math.round(5 + (y / 216) * 19)
/** The glare shield's top edge at column x (highest in the middle). */
const shieldEdge = (x) => Math.round(204 + 14 * ((x - 159.5) / 160) ** 2)

function bow(c) {
  for (let x = 0; x < 320; x++) {
    const e = bowEdge(x)
    for (let y = 0; y < e; y++) c.set(x, y, y < 2 ? F.d0 : F.d1)
    c.set(x, e - 1, F.l0)
    c.set(x, e - 2, F.m0)
    c.set(x, e, F.black)
  }
  // Three rear-view mirrors on the bow.
  for (const mx of [110, 148, 186]) {
    c.rect(mx - 2, 1, 28, 10, F.black)
    c.rect(mx - 1, 2, 26, 8, F.m0)
    c.rect(mx, 3, 24, 6, F.mirror)
    c.rect(mx, 3, 24, 1, F.d2)
    c.rect(mx + 3, 5, 6, 1, F.m1)
  }
}

function rails(c) {
  for (let y = 0; y < 224; y++) {
    const e = railEdge(y)
    for (let x = 0; x < e; x++) {
      const v = x < e - 3 ? F.d1 : F.d2
      c.set(x, y, v)
      c.set(319 - x, y, v)
    }
    c.set(e - 1, y, F.l0)
    c.set(e, y, F.black)
    c.set(320 - e, y, F.l0)
    c.set(319 - e, y, F.black)
    // A bolt every 32 rows.
    if (y % 32 === 16) {
      c.set(e - 5, y, F.l1)
      c.set(320 - e + 4, y, F.l1)
    }
  }
}

/** The HUD's combiner: two posts standing on the glare shield. */
function combiner(c) {
  for (const px of [100, 217]) {
    for (let y = 168; y < 210; y++) {
      c.set(px, y, F.l0)
      c.set(px + 1, y, F.m0)
      c.set(px + 2, y, F.d1)
    }
    c.rect(px - 1, 166, 5, 3, F.m1)
  }
}

function shield(c) {
  for (let x = 0; x < 320; x++) {
    const e = shieldEdge(x)
    for (let y = e; y < 288; y++) c.set(x, y, y < e + 12 ? F.d0 : F.d2)
    c.set(x, e, F.l0)
    c.set(x, e + 1, F.m1)
    c.set(x, e + 12, F.l0)
  }
  // The panel's face: plates, seams and screws.
  for (let x = 0; x < 320; x += 40) {
    for (let y = 224; y < 288; y++) c.set(x, y, F.d1)
  }
}

/** A display's bezel round its hole (cleared), with buttons along its sides. */
function bezel(c, s) {
  const x0 = s.x * 8
  const y0 = s.y * 8
  const w = s.w * 8
  const h = s.h * 8
  c.rect(x0 - 8, y0 - 6, w + 16, h + 12, F.black)
  c.rect(x0 - 7, y0 - 5, w + 14, h + 10, F.m0)
  c.rect(x0 - 6, y0 - 4, w + 12, h + 8, F.d2)
  for (let k = 0; k < 4; k++) {
    for (const bx of [x0 - 6, x0 + w + 2]) {
      const by = y0 + 4 + k * Math.floor((h - 8) / 3)
      c.rect(bx, by, 4, 4, F.black)
      c.rect(bx, by, 3, 3, F.l0)
      c.set(bx + 1, by + 1, F.l2)
    }
  }
  c.rect(x0 - 1, y0 - 1, w + 2, h + 2, F.black)
  c.rect(x0, y0, w, h, 0)
}

/** The three lamps and their names (dark until the game lights the colour). */
function lamps(c) {
  const font = fontFrames()
  const lamp = (x, colour, word) => {
    c.rect(x - 1, 275, 30, 11, F.black)
    c.rect(x, 276, 28, 9, colour)
    ;[...word].forEach((ch, k) => {
      const g = font[ch.charCodeAt(0) - 32]
      for (let y = 0; y < 8; y++) {
        for (let xx = 0; xx < 8; xx++) {
          if (g.get(xx, y) >= 4) c.set(x + 2 + k * 8 + xx, 277 + y, F.black)
        }
      }
    })
  }
  lamp(118, F.lampMissile, 'MSL')
  lamp(150, F.lampAlt, 'ALT')
  lamp(182, F.lampLock, 'LCK')
}

/** The cockpit on BG1 (front): 320 x 288 in the frame palette, the displays left clear. */
export function cockpit() {
  const c = new Canvas(320, 288)
  rails(c)
  bow(c)
  combiner(c)
  shield(c)
  bezel(c, SCREENS.left)
  bezel(c, SCREENS.right)
  bezel(c, SCREENS.centre)
  lamps(c)
  return c
}

/** The screen palette's colours. */
const S = {
  glass: 2,
  dim: 3,
  grid: 4,
  ring: 5,
  line: 6,
  bright: 8,
  nose: 10,
  left: 11,
  right: 12,
  tail: 13,
  edge: 14,
  canopy: 15,
}

/** The left display's radar: rings round us at its foot, bearing lines. */
function radar(c, s) {
  const cx = s.x * 8 + (s.w * 8) / 2
  const cy = (s.y - PANEL_ROW) * 8 + s.h * 8 - 6
  for (let y = (s.y - PANEL_ROW) * 8; y < (s.y - PANEL_ROW + s.h) * 8; y++) {
    for (let x = s.x * 8; x < (s.x + s.w) * 8; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const ring = [16, 32, 48].some((r) => Math.abs(d - r) < 0.6)
      const bearing =
        Math.abs(x + 0.5 - cx) < 0.6 || Math.abs(Math.abs(x + 0.5 - cx) - (cy - y - 0.5)) < 0.6
      if (ring) c.set(x, y, S.ring)
      else if (bearing && (x + y) % 2 === 0) c.set(x, y, S.grid)
    }
  }
  // Us: a small arrowhead at the centre.
  c.grid(cx - 3, cy - 3, ['...#...', '..###..', '.#####.', '###.###', '#.....#'], { '#': S.bright })
}

/**
 * The right display: our fighter from above in four parts - the nose (with the canards), the
 * left wing, the right wing, the tail (the rear and the fins) - each in its own colour of the
 * palette (10-13), which the game sets by that part's damage. Seams of the edge colour part
 * them, so each reads alone.
 */
function status(c, s) {
  const cx = s.x * 8 + 22
  const cy = (s.y - PANEL_ROW) * 8 + 28
  const big = new Canvas(26, 39)
  const both = (points, left, right) => {
    big.poly(points, left)
    big.poly(
      points.map(([x, y]) => [26 - x, y]),
      right,
    )
  }
  both(
    [
      [9.5, 14],
      [0.5, 28],
      [0.5, 31.5],
      [9.5, 31.5],
    ],
    S.left,
    S.right,
  )
  big.poly(
    [
      [9.5, 21],
      [16.5, 21],
      [17, 34],
      [15, 38.5],
      [11, 38.5],
      [9, 34],
    ],
    S.tail,
  )
  both(
    [
      [9.6, 29],
      [5.5, 35.5],
      [5.5, 38],
      [10, 36],
    ],
    S.tail,
    S.tail,
  )
  big.poly(
    [
      [13, 0],
      [15.6, 6],
      [16.5, 13],
      [16.5, 21],
      [9.5, 21],
      [9.5, 13],
      [10.4, 6],
    ],
    S.nose,
  )
  both(
    [
      [9.6, 11],
      [4.5, 15.5],
      [4.5, 17],
      [9.6, 15],
    ],
    S.nose,
    S.nose,
  )
  // The seams: a point beside another part (right or below) becomes the edge.
  const parts = [S.nose, S.left, S.right, S.tail]
  const seam = []
  for (let y = 0; y < big.h; y++) {
    for (let x = 0; x < big.w; x++) {
      const v = big.get(x, y)
      if (!parts.includes(v)) continue
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        const w = big.get(x + dx, y + dy)
        if (w !== v && parts.includes(w)) seam.push([x, y])
      }
    }
  }
  for (const [x, y] of seam) big.set(x, y, S.edge)
  // The canopy, which takes no damage colour.
  big.rect(12, 6, 2, 5, S.canopy)
  big.outline(S.edge)
  c.blit(big, cx - 13, cy - 19)
}

/** BG0's rows under the panel: the displays' glass, the radar's rings, our status. */
export function screens() {
  const c = new Canvas(320, (36 - PANEL_ROW) * 8)
  c.rect(0, 0, 320, c.h, S.glass)
  // A faint grid on the centre display.
  const m = SCREENS.centre
  for (let y = (m.y - PANEL_ROW) * 8; y < (m.y - PANEL_ROW + m.h) * 8; y++) {
    for (let x = m.x * 8; x < (m.x + m.w) * 8; x++) if (y % 8 === 7) c.set(x, y, S.dim)
  }
  radar(c, SCREENS.left)
  status(c, SCREENS.right)
  return c
}
