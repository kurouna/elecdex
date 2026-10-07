// ELECFIGHTER's stage GRID (docs/elec16-elecfighter-design.md 4.1, 4.2) from svg/stage.svg: the
// SVG drawn by resvg with crisp edges and held to the stage's palette, written as the map the
// kit cuts into tiles (stages/grid/art/stage.png), the palette's row in art/palettes.png, and
// the stage's numbers (stages/grid/stage.txt): its raster's bands and lines and how far each
// moves with the camera.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPng, writePng } from '../png.mjs'
import { STAGE } from './palettes.mjs'
import { svgIndices, svgText } from './svg.mjs'

/** The screen's lines: the horizon (where the floor's lines begin) and the feet. */
export const HORIZON = 168
export const GROUND = 244
/** The last line the raster writes. */
export const LAST = 287
/** The camera the map is drawn for: the middle of its reach, 0 to 192 (design 4.2). */
export const CENTER = 96
/** The floor's lines meet at y 54: a line's share of the camera's move is (y - 54) / 190. */
const VANISH = 54
const DEPTH = GROUND - VANISH
/** The bands above the floor, in sixteenths: the skyline a quarter, the platform's rim a half. */
const FAR = 4
const MID = 8
const MID_BAND = 20

/** Each band's share of the camera's move, in sixteenths (16 moves with it). */
export function bands() {
  return Array.from({ length: 36 }, (_, k) => (k < MID_BAND ? FAR : k === MID_BAND ? MID : 16))
}

/** Each floor line's share, HORIZON to LAST, in 256ths: 154 (0.6) to 256 on the foot line. */
export function lines() {
  const out = []
  for (let y = HORIZON; y <= LAST; y++) out.push(Math.round((256 * (y - VANISH)) / DEPTH))
  return out
}

/** Distinct 8x8 tiles of an index picture, exactly and with flipped copies shared. */
export function tileCount({ w, h, px }) {
  const exact = new Set()
  const flip = new Set()
  for (let ty = 0; ty < h; ty += 8)
    for (let tx = 0; tx < w; tx += 8) {
      const at = (x, y) => px[(ty + y) * w + tx + x]
      const ways = [[], [], [], []]
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          ways[0].push(at(x, y))
          ways[1].push(at(7 - x, y))
          ways[2].push(at(x, 7 - y))
          ways[3].push(at(7 - x, 7 - y))
        }
      const keys = ways.map((w) => w.join(','))
      exact.add(keys[0])
      flip.add(keys.sort()[0])
    }
  return { exact: exact.size, flip: flip.size }
}

function stageText(palette) {
  return [
    "# GRID (docs/elec16-elecfighter-design.md 4.1), the first stage's numbers, written by",
    '# scripts/elecfighter-art.mjs with its picture (art/stage.png, the map `grid`) and read when a',
    '# round begins (engine/data.e16.ts). The map is drawn for the camera in the middle of its reach',
    '# (`center`); each band or line of BG0 is put at center + share * (camera - center).',
    '#   palette   the row of art/palettes.png for background slot 0 (0: stage)',
    "#   music     the song's number (0: none yet)",
    "#   horizon   the screen's line of the horizon: the first line of the floor",
    "#   ground    the screen's line of the feet (the floor moves with the camera there)",
    '#   raster    0: BG0 scrolls whole with the camera; 1: the 36 bands; 2: the bands above the',
    '#             horizon, then the floor a line at a time down to `last`',
    '#   center    the camera the map is drawn for',
    '#   last      the last line the raster writes',
    '# palette music horizon ground raster center last',
    `${palette} 0 ${HORIZON} ${GROUND} 2 ${CENTER} ${LAST}`,
    "# the 36 bands' share of the camera's move, in 16ths: the skyline 4, the platform's rim 8",
    bands().join(' '),
    `# the floor's lines ${HORIZON} to ${LAST}, their share in 256ths: (y - ${VANISH}) / ${DEPTH}`,
    ...chunks(lines(), 20).map((r) => r.join(' ')),
    '',
  ].join('\n')
}

const chunks = (a, n) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, k) => a.slice(k * n, k * n + n))

/** The camera's reach (design 4.2). */
export const CAM_MAX = 192

/**
 * The columns of floor line `y` a camera at either end of its reach reads round the map's edge
 * (BG0 is 512 wide and wraps): below the foot line a line moves more than the camera, so at the
 * left wall the screen's left edge reads the map's right end, and at the right wall its right
 * edge the map's left end. Answers how many columns at each end.
 */
export function wrapColumns(y) {
  if (y <= GROUND) return 0
  const share = lines()[y - HORIZON] / 256
  return Math.ceil(CENTER * (share - 1)) + 1
}

/**
 * Those columns hold only what is the same from either side: a row's line across the floor, or
 * nothing - never a line running into the depth, which read from the other end folded back
 * into a V at the bottom corners.
 */
function clearWraps(pic) {
  for (let y = GROUND + 1; y < pic.h; y++) {
    const n = wrapColumns(y)
    let drawn = 0
    for (let x = 0; x < pic.w; x++) if (pic.px[y * pic.w + x]) drawn++
    // A row's line is drawn across nearly the whole map; its colour at the middle of a side.
    const row = drawn > pic.w * 0.8 ? pic.px[y * pic.w + 128] : 0
    for (let k = 0; k < n; k++) {
      pic.px[y * pic.w + k] = row
      pic.px[y * pic.w + pic.w - 1 - k] = row
    }
  }
}

/** Draws the stage into the game's folder `game`; answers its counts. */
export function drawStage(here, game) {
  const pic = svgIndices(svgText(path.join(here, 'svg/stage.svg')), STAGE)
  if (pic.stray > 0) throw new Error(`stage.svg: ${pic.stray} points not in the stage's palette`)
  clearWraps(pic)
  const data = new Uint8Array(pic.w * pic.h * 4)
  for (let k = 0; k < pic.px.length; k++) {
    const c = pic.px[k]
    if (c === 0) continue
    const [r, g, b] = STAGE[c]
    data.set([r, g, b, 255], k * 4)
  }
  writeFileSync(
    path.join(game, 'stages/grid/art/stage.png'),
    writePng({ width: pic.w, height: pic.h, data }),
  )
  // The stage's palette is row 0 of the game's palettes; the other rows are kept as they are.
  const palFile = path.join(game, 'art/palettes.png')
  const pals = readPng(readFileSync(palFile))
  for (let x = 0; x < 16; x++) {
    const [r, g, b] = STAGE[x] ?? [0, 0, 0]
    pals.data.set([r, g, b, 255], x * 4)
  }
  writeFileSync(palFile, writePng(pals))
  writeFileSync(path.join(game, 'stages/grid/stage.txt'), stageText(0))
  return tileCount(pic)
}
