// ELECFIGHTER's fighters for the game (docs/elec16-elecfighter-design.md 2.2-2.5): every used
// slot in every picture of poses.json's `rows`, drawn by three.js (bitmaps.mjs, the scene the
// viewer shows), cut into 16 x 16 cells with the empty ones dropped, and written into the game's
// folder as
//   fighters/<id>/art/cells.png   the slot's cells, a picture's cells one after another (the
//                                 source from then on: touch it up keeping to the P1 palette)
//   fighters/<id>/art.txt         where each row's cells are and where each is drawn
//   fighters/<id>/poses.txt       the rows' boxes: drafted from the posed model's parts, then the
//                                 hand table fighters/<id>/boxes.txt laid over them (never
//                                 written here, so a redraw keeps every hand-set box)
//   fighters/<id>/limbs.txt       the striking limb's extent in each striking picture (only the
//                                 tests read it: a hit box lies within 2 points of it)
// and a check picture of the boxes over the poses, docs/elecfighter-mock/p3-boxes-<id>.png.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPng, writePng } from '../png.mjs'
import { Img } from './img.mjs'
import { fighterPalette, q8 } from './palettes.mjs'
import { isolated } from './pixels.mjs'
import { bbox, cells } from './sprite.mjs'

/** The words of an art row: first cell, count, then 32 places (dx & 255 | (dy & 255) << 8). */
export const ART_W = 34
export const ROOM = 32
/** The rows' meaning (engine/fighter.e16.ts): the moves' rows begin at 12, three a move. */
const MOVES_AT = 12
const MOVES = 13
const HEAVY_MOVES = new Set([1, 3, 5, 7])
/** The rows of a crouch: their hurt boxes all reach the same height (design 7.6). */
const CROUCH_ROWS = new Set([1, 6, 8, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35])
const CROUCH_TOP = 60
/** The anti-air's startup and active rows: its hurt boxes split at the line above which it cannot be struck (engine UPPER, design 7.7). */
const ANTI_AIR_ROWS = new Set([27, 28])
const UPPER_LINE = 28
/** Rows struck nowhere (down, waking): no hurt box, as the engine's invulnerability says. */
const UNTOUCHED = new Set([9, 10])
const UPPER = ['head', 'neck', 'chest', 'spine', 'clavicle_l', 'clavicle_r']
const ARMS = ['upperarm', 'forearm', 'hand'].flatMap((b) => [`${b}_l`, `${b}_r`])
const LOWER = ['hips', 'thigh', 'shin', 'foot'].flatMap((b) =>
  b === 'hips' ? [b] : [`${b}_l`, `${b}_r`],
)
const MIN_BOX = 8

const rowRole = (r) => {
  if (r < MOVES_AT || r >= MOVES_AT + MOVES * 3) return { kind: 'common' }
  const m = Math.floor((r - MOVES_AT) / 3)
  return { kind: ['startup', 'active', 'recovery'][(r - MOVES_AT) % 3], move: m }
}

/** Jobs for the renderer: every slot's pictures, and its KO pieces. */
export function fighterJobs(slots, poses) {
  const jobs = {}
  for (const s of slots.slots.filter((x) => x.used)) {
    for (const p of new Set(poses.rows)) jobs[`${s.id}/${p}`] = { slot: s.id, pose: p }
    jobs[`${s.id}/pieces`] = { kind: 'pieces', slot: s.id, pose: 'air', cell: 16, most: ROOM }
  }
  return jobs
}

/**
 * A sprite's pixel box [x0, y0, x1, y1] as a game box: x ahead of the feet, top, w, h. The
 * camera looks down a little, so what is nearer it is drawn a point or two below the feet's
 * line: a box ends at the floor.
 */
function gameBox(s, b) {
  const top = s.oy - b[1]
  const bottom = Math.max(0, s.oy - b[3] - 1)
  return [b[0] - s.ox, top, b[2] - b[0] + 1, Math.max(1, top - bottom)]
}

const union = (boxes) => {
  const bs = boxes.filter(Boolean)
  if (!bs.length) return null
  return [
    Math.min(...bs.map((b) => b[0])),
    Math.min(...bs.map((b) => b[1])),
    Math.max(...bs.map((b) => b[2])),
    Math.max(...bs.map((b) => b[3])),
  ]
}

/** A box at least MIN_BOX each way, grown about its middle. */
function atLeast(b) {
  const grow = (lo, hi) => {
    const n = hi - lo + 1
    if (n >= MIN_BOX) return [lo, hi]
    const add = MIN_BOX - n
    return [lo - (add >> 1), hi + (add - (add >> 1))]
  }
  const [x0, x1] = grow(b[0], b[2])
  const [y0, y1] = grow(b[1], b[3])
  return [x0, y0, x1, y1]
}

/** The drafted boxes of row `r` (picture `s`): 6 boxes of [x, top, w, h], empty as zeros. */
function draft(r, s, pose) {
  const out = Array.from({ length: 6 }, () => [0, 0, 0, 0])
  if (UNTOUCHED.has(r)) return out
  const role = rowRole(r)
  const strikes = new Set(pose.strikes ?? [])
  const part = (names) => union(names.filter((n) => !strikes.has(n)).map((n) => s.parts[n]))
  const upper = part([...UPPER, ...ARMS])
  const lower = part(LOWER)
  if (upper) out[1] = gameBox(s, atLeast(upper))
  if (lower) out[2] = gameBox(s, atLeast(lower))
  if (s.tip && role.kind === 'active') out[4] = hitBox(gameBox(s, atLeast(s.tip)), role.move)
  if (s.tip && role.kind === 'recovery' && HEAVY_MOVES.has(role.move))
    out[3] = gameBox(s, atLeast(s.tip))
  if (!AIR_ROWS.has(r)) toFloor(out)
  if (CROUCH_ROWS.has(r)) crouchTop(out)
  if (ANTI_AIR_ROWS.has(r)) splitAt(out, UPPER_LINE)
  return out
}

/** The hurt boxes as two: all of them above the line, and all of them below it. */
function splitAt(out, line) {
  const hurt = [1, 2, 3].map((k) => out[k]).filter((b) => b[2] !== 0)
  const x0 = Math.min(...hurt.map((b) => b[0]))
  const x1 = Math.max(...hurt.map((b) => b[0] + b[2]))
  const top = Math.max(...hurt.map((b) => b[1]))
  out[1] = [x0, top, x1 - x0, top - line]
  out[2] = [x0, line, x1 - x0, line]
  out[3] = [0, 0, 0, 0]
}

/**
 * A hit box from the striking limb's: from REACH_FROM ahead of the feet at the nearest (a limb
 * reaching back past the body strikes only in front of it), and a standing punch's above the
 * crouch's height, so it passes over one crouching (design 7.6: by the boxes' shape).
 */
const REACH_FROM = 10
const OVER_CROUCH = new Set([0, 1])
function hitBox(b, move) {
  let [x, top, w, h] = b
  if (x < REACH_FROM) {
    w = Math.max(MIN_BOX, x + w - REACH_FROM)
    x = REACH_FROM
  }
  if (OVER_CROUCH.has(move) && top - h <= CROUCH_TOP) h = Math.max(MIN_BOX, top - CROUCH_TOP - 1)
  return [x, top, w, h]
}

/** A picture on the ground is struck down to its feet: its lowest hurt box reaches the floor. */
const AIR_ROWS = new Set([3, 11, 55, ...Array.from({ length: 12 }, (_, k) => 36 + k)])
function toFloor(out) {
  const hurt = [1, 2, 3].filter((k) => out[k][2] !== 0)
  if (!hurt.length) return
  const low = hurt.reduce((a, k) => (out[k][1] - out[k][3] < out[a][1] - out[a][3] ? k : a))
  out[low][3] = out[low][1]
}

/** A crouch's hurt boxes brought to the one height every slot shares. */
function crouchTop(out) {
  const hurt = [1, 2, 3].filter((k) => out[k][2] !== 0)
  const top = Math.max(...hurt.map((k) => out[k][1]))
  for (const k of hurt) {
    const b = out[k]
    const bottom = b[1] - b[3]
    if (b[1] === top || b[1] > CROUCH_TOP) b[1] = CROUCH_TOP
    b[3] = Math.max(MIN_BOX, b[1] - bottom)
  }
}

/** The hand table: `row box x top w h` lines laid over the draft. */
function readHand(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .map((l) => l.split(/\s+/).map(Number))
}

/**
 * The hand table for a slot that has none yet: the body boxes of the poses.txt it had (the
 * placeholder's push boxes, rows 0-50), a new row's copied from the row it stands like.
 */
const BODY_LIKE = { 51: 0, 52: 0, 53: 0, 54: 0, 55: 3, 56: 0, 57: 0, 58: 0, 59: 0, 60: 0 }
function handStart(file, posesFile, rows) {
  const words = readFileSync(posesFile, 'utf8')
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(Number)
  const old = []
  for (let k = 0; k + 24 <= words.length; k += 24) old.push(words.slice(k, k + 4))
  const lines = [
    '# Boxes set by hand, laid over the ones scripts/elecfighter-art.mjs drafts from the drawings',
    '# (design 2.5). The script never writes this file once it is there: a redraw keeps them.',
    '#   row box x top w h   (box 0 the body, 1-3 hurt, 4-5 hit; x ahead of the feet, top above',
    '#   them; w 0 is none). The body boxes are all here: only the push between fighters reads them.',
  ]
  rows.forEach((_, r) => {
    const b = old[r] ?? old[BODY_LIKE[r] ?? 0]
    lines.push(`${r} 0 ${b.join(' ')}`)
  })
  writeFileSync(file, `${lines.join('\n')}\n`)
}

/** The 16 x 16 block at (x, y) of a sprite, as 256 indices. */
function block(s, x, y) {
  const out = new Uint8Array(256)
  for (let j = 0; j < 16; j++)
    for (let i = 0; i < 16; i++) {
      const sx = x + i
      const sy = y + j
      if (sx >= 0 && sy >= 0 && sx < s.w && sy < s.h) out[j * 16 + i] = s.px[sy * s.w + sx]
    }
  return out
}

/** A picture cut into its cells: [{ px, dx, dy }], top row first. */
function cut(s) {
  return cells(s)
    .list.sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .map(([cx, cy]) => ({ px: block(s, cx, cy), dx: cx - s.ox, dy: cy - s.oy }))
}

/** A KO piece (drawn in the whole body's frame) as one cell from its drawn box's corner. */
function pieceCell(s) {
  const b = bbox(s)
  return {
    px: block(s, b.x0, b.y0),
    dx: b.x0 - s.ox,
    dy: b.y0 - s.oy,
    clipped: b.w > 16 || b.h > 16,
  }
}

const pack = (dx, dy) => (dx & 255) | ((dy & 255) << 8)

/** The cells as a sheet PNG, 16 across, in palette `pal`. */
function sheetPng(frames, pal) {
  const across = 16
  const h = Math.ceil(frames.length / across) * 16
  const data = new Uint8Array(across * 16 * h * 4)
  frames.forEach((f, k) => {
    const fx = (k % across) * 16
    const fy = Math.floor(k / across) * 16
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < 16; i++) {
        const v = f[j * 16 + i]
        if (!v) continue
        const at = ((fy + j) * across * 16 + fx + i) * 4
        data.set([...pal[v], 255], at)
      }
  })
  return writePng({ width: across * 16, height: h, data })
}

/** Draws every used slot into the game's folder; answers counts for the log. */
export function writeFighters(results, slots, poses, game, docs) {
  return slots.slots
    .filter((x) => x.used)
    .map((slot) => writeSlot(slot, results, poses, game, docs))
}

/** A slot's pictures cut into cells, a row each pointing at its picture's (shared by name). */
function cutSlot(slot, results, poses) {
  const frames = []
  const placed = new Map()
  const rows = []
  let isolatedLeft = 0
  let most = 0
  for (const name of poses.rows) {
    const s = results[`${slot.id}/${name}`]
    if (!placed.has(name)) {
      const cs = cut(s)
      placed.set(name, { first: frames.length, cs })
      for (const c of cs) frames.push(c.px)
      isolatedLeft += isolated(s.px, s.w, s.h)
      most = Math.max(most, cs.length)
    }
    rows.push(placed.get(name))
  }
  if (most > ROOM) throw new Error(`${slot.id}: a picture of ${most} cells, the room has ${ROOM}`)
  return { frames, rows, distinct: placed.size, isolatedLeft, most }
}

function writeSlot(slot, results, poses, game, docs) {
  const id = slot.id.toLowerCase()
  const dir = path.join(game, 'fighters', id)
  mkdirSync(path.join(dir, 'art'), { recursive: true })
  const { frames, rows, distinct, isolatedLeft, most } = cutSlot(slot, results, poses)
  const cellsN = frames.length
  // The KO's pieces of its own mesh, a cell each, after the poses.
  const pieces = results[`${slot.id}/pieces`].map(pieceCell)
  rows.push({ first: frames.length, cs: pieces })
  for (const c of pieces) frames.push(c.px)
  writeFileSync(path.join(dir, 'art', 'cells.png'), sheetPng(frames, fighterPalette('p1')))
  writeFileSync(path.join(dir, 'art.txt'), artText(slot, rows, poses.rows))
  // The boxes: drafted, the hand table over them.
  const handFile = path.join(dir, 'boxes.txt')
  if (!existsSync(handFile)) handStart(handFile, path.join(dir, 'poses.txt'), poses.rows)
  const boxes = poses.rows.map((name, r) =>
    draft(r, results[`${slot.id}/${name}`], poses.poses[name]),
  )
  for (const [r, k, x, top, w, h] of readHand(handFile)) if (boxes[r]) boxes[r][k] = [x, top, w, h]
  writeFileSync(path.join(dir, 'poses.txt'), posesText(slot, boxes, poses.rows))
  writeFileSync(path.join(dir, 'limbs.txt'), limbsText(slot, results, poses))
  checkPicture(slot, results, poses, boxes, path.join(docs, `p3-boxes-${id}.png`))
  const clipped = pieces.some((p) => p.clipped) ? ' (some clipped)' : ''
  return `${slot.id}: ${distinct} pictures for ${poses.rows.length} rows, ${cellsN} cells (${(cellsN / distinct).toFixed(1)} a picture, at most ${most}), ${pieces.length} KO pieces${clipped}, ${((frames.length * 128) / 1024).toFixed(1)} KB, isolated points ${isolatedLeft}`
}

function artText(slot, rows, names) {
  const lines = [
    `# ${slot.id} ${slot.role.toUpperCase()}: where each pose row's cells are (art/cells.png, 16 x 16 each) and`,
    '# where each is drawn. Written by scripts/elecfighter-art.mjs with the drawing. A row of 34 words:',
    '#   first cell, count (at most 32: the room each fighter streams into), then 32 places, a cell',
    '#   each: dx & 255 | (dy & 255) << 8, its top left from the feet (facing right; FLIP_H mirrors).',
    `# The rows of poses.txt (${names.length}), then the KO's pieces of the slot's own mesh (a cell each).`,
  ]
  rows.forEach((r, k) => {
    const offs = r.cs.map((c) => pack(c.dx, c.dy))
    while (offs.length < ROOM) offs.push(0)
    lines.push(`${[r.first, r.cs.length, ...offs].join(' ')} # ${k} ${names[k] ?? 'ko pieces'}`)
  })
  return `${lines.join('\n')}\n`
}

const ROW_NAMES = [
  'stand',
  'crouch',
  'prejump',
  'jump',
  'land',
  'hit',
  'hit crouching',
  'guard',
  'guard crouching',
  'down',
  'wake',
  'falling hit',
  ...[
    'sLP',
    'sHP',
    'sLK',
    'sHK',
    'cLP',
    'cHP',
    'cLK',
    'cHK',
    'jLP',
    'jHP',
    'jLK',
    'jHK',
    'throw',
  ].flatMap((m) => [`${m} startup`, `${m} active`, `${m} recovery`]),
  'walk 1',
  'walk 2',
  'walk 3',
  'walk 4',
  'jump falling',
  'dash',
  'backdash',
  'thrown',
  'win',
  'idle',
]

function posesText(slot, boxes, names) {
  const lines = [
    `# ${slot.id} ${slot.role.toUpperCase()}: its poses' boxes (design 2.5, 7.5), a row of 24 words each: the body`,
    '# box, three hurt boxes, two hit boxes. A box is x (ahead of the feet), top (height above the',
    '# feet), w, h; w 0 is none. Written by scripts/elecfighter-art.mjs: hurt and hit boxes drafted',
    "# from the posed model's parts in the row's picture (poses.json `rows`), then boxes.txt (set by",
    '# hand, never written by the script) laid over them. Edit boxes.txt, not this file.',
  ]
  boxes.forEach((b, r) => {
    lines.push(`${b.flat().join(' ')} # ${r} ${ROW_NAMES[r] ?? ''} (${names[r]})`)
  })
  return `${lines.join('\n')}\n`
}

function limbsText(slot, results, poses) {
  const lines = [
    `# ${slot.id}: the striking limb (fist and forearm's end, or foot and shin's end) in each active`,
    '# picture, as a box: row x top w h. Written by scripts/elecfighter-art.mjs; read only by the',
    "# tests (a hit box lies within 2 points of the limb's points). Not part of the game.",
  ]
  poses.rows.forEach((name, r) => {
    const s = results[`${slot.id}/${name}`]
    if (rowRole(r).kind === 'active' && s.tip) lines.push(`${r} ${gameBox(s, s.tip).join(' ')}`)
  })
  return `${lines.join('\n')}\n`
}

/** Every picture of a slot at 2x, its body (grey), hurt (green) and hit (red) boxes over it. */
function checkPicture(slot, results, poses, boxes, file) {
  const P1 = fighterPalette('p1')
  const S = 2
  const colW = 120
  const across = 11
  const rowsN = Math.ceil(poses.rows.length / across)
  const img = new Img(across * colW * S, rowsN * 140 * S)
  const colours = [q8([120, 128, 136]), q8([64, 232, 96]), q8([64, 232, 96]), q8([64, 232, 96])]
  colours.push(q8([248, 72, 72]), q8([248, 72, 72]))
  poses.rows.forEach((name, r) => {
    const s = results[`${slot.id}/${name}`]
    const ox = ((r % across) * colW + 50) * S
    const oy = (Math.floor(r / across) * 140 + 118) * S
    img.sprite(s, ox - s.ox * S, oy - s.oy * S, P1, S)
    boxes[r].forEach(([x, top, w, h], k) => {
      if (!w) return
      const c = colours[k]
      const x0 = ox + x * S
      const y0 = oy - top * S
      img.rect(x0, y0, w * S, 1, c)
      img.rect(x0, y0 + h * S - 1, w * S, 1, c)
      img.rect(x0, y0, 1, h * S, c)
      img.rect(x0 + w * S - 1, y0, 1, h * S, c)
    })
    img.text(`${r} ${name}`, ox - 46 * S, oy + 6 * S, P1[1], 1)
  })
  img.save(file)
}

/** The fighters' palettes as rows `p1` and `cpu` of the game's palette picture. */
export function writePalettes(file, rows) {
  const pals = readPng(readFileSync(file))
  for (const [y, colours] of rows) {
    for (let x = 0; x < 16; x++) {
      const [r, g, b] = colours[x] ?? [0, 0, 0]
      pals.data.set([r, g, b, 255], (y * 16 + x) * 4)
    }
  }
  writeFileSync(file, writePng(pals))
}
