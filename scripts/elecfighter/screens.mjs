// ELECFIGHTER's screens' pictures (docs/elec16-elecfighter-design.md 5.2, 5.4, 5.5), drawn into
// the game's art/ by scripts/elecfighter-art.mjs and the source from then on:
//   art/big.png     the bands' large lettering: the bold font's letters drawn 2 x 3, amber, on
//                   the band's own ground so a band reads whole (a 16 x 24 glyph, six tiles)
//   art/title.png   the title's background map: the stage GRID as the fight's camera sees it in
//                   the middle, and the ELECFIGHTER logo in the sky above its skyline - ELEC in
//                   amber, FIGHTER large and slanted in the theme's cyan, both drawn here from
//                   the bold font (original lettering: no typeface of anyone else's)
//   art/busts.png   the select screen's busts: each slot's model drawn again with the camera
//                   nearer (not enlarged), cut to 64 x 64; only their drawn 8 x 8 tiles, the
//                   first one clear, and busts.txt saying which tile goes in each cell
// all in the `big` palette (row 6 of art/palettes.png) but the busts, which are the fighters'.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPng, writePng } from '../png.mjs'
import { fighterPalette, q8 } from './palettes.mjs'
import { despeck } from './pixels.mjs'

/** The large letters, in this order: only the ones the bands' words use (engine/draw.e16.ts). */
export const BIG = 'ABCDEFGHIKLMNOPRSTUVWY.?123'

/** The `big` palette: amber lettering, the logo's cyan, the band's ground. */
export const BIG_PAL = [
  [0, 8, 16],
  [248, 232, 160],
  [248, 200, 72],
  [232, 152, 40],
  [176, 96, 24],
  [8, 16, 24],
  [200, 248, 248],
  [120, 232, 240],
  [64, 176, 192],
  [8, 24, 32],
  [24, 96, 112],
  [16, 48, 64],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
].map(q8)
const BAND = 9

/** The bold font's glyph of `ch` as rows of its four colours (0 its ground). */
function boldGlyph(font, ch) {
  const k = ch.charCodeAt(0) - 32
  const fx = (k % 16) * 8
  const fy = Math.floor(k / 16) * 8
  const key = (x, y) => {
    const a = ((fy + y) * font.width + fx + x) * 4
    return `${font.data[a]},${font.data[a + 1]},${font.data[a + 2]}`
  }
  // The font's colours (art/fontb.png): its ground, the edge, the shadow, the light, the core.
  const role = { '8,24,32': 0, '168,184,200': 1, '8,16,24': 2, '216,224,232': 3, '248,248,248': 4 }
  return Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => role[key(x, y)] ?? 0),
  )
}

/** A glyph drawn `sx` x `sy`: its roles to colours by `ink(role, row of the drawn glyph)`. */
function scaled(g, sx, sy, ink) {
  const w = 8 * sx
  const h = 8 * sy
  const out = Array.from({ length: h }, () => new Array(w).fill(0))
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) out[y][x] = ink(g[Math.floor(y / sy)][Math.floor(x / sx)], y, h)
  return out
}

/** Amber: the light on top, the core shading down, the edge dark, the shadow. */
const amber = (r, y, h) => {
  if (r === 0) return 0
  if (r === 2) return 5
  if (r === 1) return 4
  if (r === 3) return 1
  return y < h * 0.55 ? 2 : 3
}

/** Cyan, for FIGHTER: pale on top, the theme's cyan, deeper toward the foot. */
const cyan = (r, y, h) => {
  if (r === 0) return 0
  if (r === 2) return 11
  if (r === 1) return 10
  if (r === 3) return 6
  return y < h * 0.45 ? 7 : y < h * 0.8 ? 8 : 10
}

function sheetOf(cells, across, colours) {
  const h = Math.ceil(cells.length / across) * 8
  const data = new Uint8Array(across * 8 * h * 4)
  cells.forEach((c, k) => {
    const fx = (k % across) * 8
    const fy = Math.floor(k / across) * 8
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const v = c[y * 8 + x]
        if (v) data.set([...colours[v], 255], ((fy + y) * across * 8 + fx + x) * 4)
      }
  })
  return writePng({ width: across * 8, height: h, data })
}

/** art/big.png: each letter 16 x 24, 2 tiles across and 3 down, on the band's ground. */
function bigLetters(font) {
  const data = new Uint8Array(16 * 24 * BIG.length * 4)
  ;[...BIG].forEach((ch, k) => {
    const g = scaled(boldGlyph(font, ch), 2, 3, amber)
    for (let y = 0; y < 24; y++)
      for (let x = 0; x < 16; x++) {
        const v = g[y][x] || BAND
        data.set([...BIG_PAL[v], 255], ((k * 24 + y) * 16 + x) * 4)
      }
  })
  return writePng({ width: 16, height: 24 * BIG.length, data })
}

/**
 * The logo, `w` x `h` indices: ELEC 2 x 2 in amber at its top left, FIGHTER 3 x 4 in cyan
 * below, slanted a point every four lines, a dark rule under both.
 */
function logo(font) {
  const w = 216
  const h = 56
  const px = new Array(w * h).fill(0)
  const put = (x, y, v) => {
    if (v && x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = v
  }
  /** A glyph's points at (x0, y0), each row slid right by `slant(y)`. */
  const stamp = (g, x0, y0, slant) => {
    for (const [y, row] of g.entries())
      for (const [x, v] of row.entries()) put(x0 + x + slant(y), y0 + y, v)
  }
  for (const [k, ch] of [...'ELEC'].entries())
    stamp(scaled(boldGlyph(font, ch), 2, 2, amber), 8 + k * 16, 0, () => 0)
  for (const [k, ch] of [...'FIGHTER'].entries())
    stamp(scaled(boldGlyph(font, ch), 3, 4, cyan), 12 + k * 26, 18, (y) => (31 - y) >> 2)
  for (let x = 4; x < w - 4; x++) put(x, 53, 10)
  return { w, h, px }
}

/**
 * art/title.png: the stage map as the camera in its middle shows it (x 96 to 415), the logo
 * set in the sky; no tile holds both, so each takes one palette.
 */
function titleMap(game, font) {
  const stage = readPng(readFileSync(path.join(game, 'stages/grid/art/stage.png')))
  const W = 320
  const H = 288
  const data = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = (y * stage.width + x + 96) * 4
      data.set(stage.data.subarray(a, a + 4), (y * W + x) * 4)
    }
  const mine = new Uint8Array(W * H)
  const L = logo(font)
  const x0 = (W - L.w) >> 1
  const y0 = 32
  for (let y = 0; y < L.h; y++)
    for (let x = 0; x < L.w; x++) {
      const v = L.px[y * L.w + x]
      if (!v) continue
      const at = ((y0 + y) * W + x0 + x) * 4
      if (data[at + 3]) throw new Error('the logo runs into the stage')
      data.set([...BIG_PAL[v], 255], at)
      mine[(y0 + y) * W + x0 + x] = 1
    }
  oneEachTile(data, mine, W, H)
  return writePng({ width: W, height: H, data })
}

/** No 8 x 8 tile may hold both the stage's points and the logo's (`mine`): each takes a palette. */
function oneEachTile(data, mine, W, H) {
  const tileOf = (k) => `${Math.floor((k % W) / 8)},${Math.floor(k / W / 8)}`
  const stage = new Set()
  const logoTiles = new Set()
  for (let k = 0; k < W * H; k++) {
    if (!data[k * 4 + 3]) continue
    ;(mine[k] ? logoTiles : stage).add(tileOf(k))
  }
  for (const t of logoTiles)
    if (stage.has(t)) throw new Error(`the title's tile ${t} holds the stage and the logo`)
}

/** Jobs for the renderer: each used slot's stand drawn nearer, for its bust. */
export function bustJobs(slots) {
  const jobs = {}
  for (const s of slots.slots.filter((x) => x.used))
    jobs[`bust/${s.id}`] = { slot: s.id, pose: 'stand', ppm: 150 }
  return jobs
}

/** A bust: the drawing cut to 64 x 64 from just above the head, the head in the middle. */
function bust(s) {
  const drawn = []
  for (let k = 0; k < s.w * s.h; k++) if (s.px[k]) drawn.push([k % s.w, Math.floor(k / s.w)])
  const top = Math.min(...drawn.map((p) => p[1]))
  const upper = drawn.filter((p) => p[1] < top + 40)
  const left = Math.round(upper.reduce((a, p) => a + p[0], 0) / upper.length) - 30
  const out = new Uint8Array(64 * 64)
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const sx = left + x
      const sy = top - 3 + y
      if (sx >= 0 && sy >= 0 && sx < s.w && sy < s.h) out[y * 64 + x] = s.px[sy * s.w + sx]
    }
  despeck(out, 64, 64)
  return out
}

/** A 64 x 64 bust's 8 x 8 tiles, row by row. */
function tilesOf(b) {
  return Array.from({ length: 64 }, (_, k) => {
    const t = new Uint8Array(64)
    for (let i = 0; i < 64; i++) t[i] = b[((k >> 3) * 8 + (i >> 3)) * 64 + (k & 7) * 8 + (i & 7)]
    return t
  })
}

/** art/busts.png (the drawn tiles, the clear one first, shared where alike) and busts.txt. */
function busts(results, slots, game) {
  const tiles = [new Uint8Array(64)]
  const index = new Map([[tiles[0].join(','), 0]])
  const rows = []
  const tileAt = (t) => {
    const key = t.join(',')
    if (!index.has(key)) {
      index.set(key, tiles.length)
      tiles.push(t)
    }
    return index.get(key)
  }
  for (const s of slots.slots.filter((x) => x.used)) {
    const b = bust(results[`bust/${s.id}`])
    rows.push({ id: s.id, cells: tilesOf(b).map(tileAt) })
  }
  writeFileSync(path.join(game, 'art', 'busts.png'), sheetOf(tiles, 16, fighterPalette('p1')))
  const text = [
    "# The select screen's busts (design 5.5), written by scripts/elecfighter-art.mjs with",
    '# art/busts.png: for each used slot, 64 words, the tile of art/busts.png in each 8 x 8 cell',
    '# of its 64 x 64 bust, row by row (0 is the clear tile).',
    ...rows.map((r) => `${r.cells.join(' ')} # ${r.id}`),
    '',
  ]
  writeFileSync(path.join(game, 'art', 'busts.txt'), text.join('\n'))
  return tiles.length
}

/** Writes the screens' pictures into the game's folder; answers counts for the log. */
export function writeScreens(results, slots, game) {
  const font = readPng(readFileSync(path.join(game, 'art/fontb.png')))
  writeFileSync(path.join(game, 'art', 'big.png'), bigLetters(font))
  writeFileSync(path.join(game, 'art', 'title.png'), titleMap(game, font))
  const n = busts(results, slots, game)
  return `screens: ${BIG.length} large letters, the title, busts in ${n} tiles`
}
