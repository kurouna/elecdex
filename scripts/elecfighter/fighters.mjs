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
//   fighters/frames.txt           every slot's rows' pictures in turn (poses.json `seq`): which
//                                 art row each row shows, frame by frame (engine/look.e16.ts)
//   fighters/transitions.txt      the pictures a row begins with, by the row before (`trans`)
//   fighters/throws.txt           the throw frame by frame, forward and back (`throws`)
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
    for (const p of new Set([...poses.rows, ...poses.tweens]))
      jobs[`${s.id}/${p}`] = { slot: s.id, pose: p }
    for (const [k, pose] of PIECES.entries())
      jobs[`${s.id}/pieces${k}`] = { kind: 'pieces', slot: s.id, pose, cell: 16, most: ROOM }
  }
  return jobs
}

/**
 * The KO's pieces are cut from the pose the fighter breaks in (design 2.4): lying down (the
 * KO on the ground, a throw's, an air KO that has landed), or still falling. Rows after the
 * poses' in art.txt, in this order (engine/data.e16.ts SHARDS_ROW, SHARDS_AIR).
 */
export const PIECES = ['down', 'air']

/**
 * The slot's pictures moved so the stand's lowest point is on the foot line (the camera looks
 * down a little, so a model's origin on the ground is drawn a point or two above its nearer
 * foot): every picture of the slot by the same amount, so the poses keep their heights.
 */
function onFootLine(slot, results) {
  const stand = results[`${slot.id}/stand`]
  let low = 0
  for (let y = 0; y < stand.h; y++)
    for (let x = 0; x < stand.w; x++) if (stand.px[y * stand.w + x]) low = y
  const lift = low - stand.oy
  for (const [id, r] of Object.entries(results)) {
    if (!id.startsWith(`${slot.id}/`)) continue
    for (const s of Array.isArray(r) ? r : [r]) s.oy += lift
  }
  return lift
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
  const lines = slots.slots
    .filter((x) => x.used)
    .map((slot) => writeSlot(slot, results, poses, game, docs))
  writeFileSync(path.join(game, 'fighters', 'frames.txt'), framesText(poses))
  writeFileSync(path.join(game, 'fighters', 'transitions.txt'), transText(poses))
  writeFileSync(path.join(game, 'fighters', 'throws.txt'), throwsText(poses))
  return lines
}

/** The art row of picture `name`: a pose row's own, or an in-between's after the KO's pieces. */
function artRowOf(poses, name) {
  const r = poses.rows.indexOf(name)
  if (r >= 0) return r
  const k = poses.tweens.indexOf(name)
  if (k < 0) throw new Error(`no picture ${name}`)
  return poses.rows.length + PIECES.length + k
}

/**
 * The words of a row of frames.txt: the clock, 4 pictures and their ends, the transitions
 * (engine/look.e16.ts SEQ_W; the tests hold the file to it, a row of it for each pose row).
 */
const SEQ_W = 10
function framesText(poses) {
  const lines = [
    "# ELECFIGHTER: each pose row's pictures in turn, the same for every slot (docs/elec16-",
    '# elecfighter-design.md 2.5; poses.json `seq`, written by scripts/elecfighter-art.mjs). A row',
    '# of 10 words: the clock (0 the frames since the row began, 1 the points walked into a step,',
    '# 0-7), then 4 pairs: an art row (fighters/<id>/art.txt) and the clock it shows until (the',
    '# first pair whose end is past the clock is shown; the last holds), then the transitions into',
    '# the row: its first entry in transitions.txt | their count << 8 (0 none).',
  ]
  const into = transInto(poses)
  poses.seq.forEach((q, r) => {
    const pairs = q.pics.map(([name, until]) => [artRowOf(poses, name), until])
    const last = pairs[pairs.length - 1]
    while (pairs.length < 4) pairs.push(last)
    const t = into[r]
    const words = [q.step ? 1 : 0, ...pairs.flat(), t ? t.first | (t.count << 8) : 0]
    if (words.length !== SEQ_W) throw new Error(`row ${r}: ${words.length} words`)
    lines.push(`${words.join(' ')} # ${r} ${q.pics.map(([n]) => n).join(' ')}`)
  })
  return `${lines.join('\n')}\n`
}

/** Each row's transitions: its first entry and how many (a row's entries are together). */
function transInto(poses) {
  const into = []
  poses.trans.forEach((t, k) => {
    const now = into[t.to]
    if (now) now.count++
    else into[t.to] = { first: k, count: 1 }
  })
  return into
}

/** No picture: the row's own shows (an entry that only stops later ones). */
const NO_PIC = 255

function transText(poses) {
  const lines = [
    '# ELECFIGHTER: the pictures a pose row begins with, by the row before (docs/elec16-elecfighter-',
    '# design.md 2.5; poses.json `trans`, written by scripts/elecfighter-art.mjs), shared by every',
    '# slot. An entry of 3 words: the rows from (first | last << 8), then two pictures: an art row |',
    "# the new row's clock it shows until << 8 (art row 255: none). frames.txt's last word finds a",
    "# row's entries; the first whose rows hold the row before is taken; past its ends the row's own.",
  ]
  for (const t of poses.trans) {
    const pics = t.pics.map(([name, until]) => [artRowOf(poses, name), until])
    if (pics.length === 0) pics.push([NO_PIC, 0])
    while (pics.length < 2) pics.push(pics[0])
    const words = [t.from[0] | (t.from[1] << 8), ...pics.map(([a, u]) => a | (u << 8))]
    const names = t.pics.map(([n, u]) => `${n} ${u}`).join(' ') || 'none'
    lines.push(`${words.join(' ')} # ${t.from[0]}-${t.from[1]} > ${t.to} ${names}`)
  }
  return `${lines.join('\n')}\n`
}

/**
 * The throw both ways, as many frames each as pose-book.mjs writes (its THROW_KS): the engine
 * takes the count from the table's length (look.e16.ts), and the tests hold it to hit.e16.ts's.
 */
function throwsText(poses) {
  const n = poses.throws.fwd.length
  const lines = [
    '# ELECFIGHTER: the throw frame by frame (docs/elec16-elecfighter-design.md 7.9; poses.json',
    `# \`throws\`, written by scripts/elecfighter-art.mjs), shared by every slot: ${n} frames forward,`,
    `# then ${n} back, by the thrower's frames since it took hold (it is free at ${n}). A frame of 4`,
    "# words: the thrower's art row | turned about << 8, the thrown's the same (read only to 15:",
    '# from the slam at 16 it is down), where the thrown is drawn from the thrower (share:',
    '# sixteenths of the way from the thrower to where it stands, below 0 of the way to where the',
    '# slam lands it | points more ahead << 8, each signed), and points up.',
  ]
  for (const way of ['fwd', 'back']) {
    const frames = poses.throws[way]
    if (frames.length !== n) throw new Error(`the throw ${way}: ${frames.length} frames, not ${n}`)
    frames.forEach(([a, ta, d, td, share, off, dy], k) => {
      const words = [
        artRowOf(poses, a) | (ta << 8),
        artRowOf(poses, d) | (td << 8),
        (share & 255) | ((off & 255) << 8),
        dy,
      ]
      const turned = ta ? ' turned' : ''
      lines.push(`${words.join(' ')} # ${way} ${k} ${a}${turned} ${d} ${share} ${off} ${dy}`)
    })
  }
  return `${lines.join('\n')}\n`
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

/** The in-between pictures cut into cells, after everything else in the sheet. */
function cutTweens(slot, results, poses, frames) {
  const rows = []
  let isolatedLeft = 0
  let most = 0
  for (const name of poses.tweens) {
    const s = results[`${slot.id}/${name}`]
    const cs = cut(s)
    rows.push({ first: frames.length, cs })
    for (const c of cs) frames.push(c.px)
    isolatedLeft += isolated(s.px, s.w, s.h)
    most = Math.max(most, cs.length)
  }
  if (most > ROOM)
    throw new Error(`${slot.id}: an in-between of ${most} cells, the room has ${ROOM}`)
  return { rows, isolatedLeft, most }
}

function writeSlot(slot, results, poses, game, docs) {
  const id = slot.id.toLowerCase()
  const dir = path.join(game, 'fighters', id)
  mkdirSync(path.join(dir, 'art'), { recursive: true })
  const lift = onFootLine(slot, results)
  const { frames, rows, distinct, isolatedLeft, most } = cutSlot(slot, results, poses)
  const cellsN = frames.length
  // The KO's pieces of its own mesh, a cell each, after the poses: a row for each pose it breaks in.
  const pieceRows = PIECES.map((_, k) => results[`${slot.id}/pieces${k}`].map(pieceCell))
  for (const pieces of pieceRows) {
    rows.push({ first: frames.length, cs: pieces })
    for (const c of pieces) frames.push(c.px)
  }
  // The in-betweens, after the pieces (art rows 63 on: frames.txt points at them).
  const tweens = cutTweens(slot, results, poses, frames)
  rows.push(...tweens.rows)
  const pieces = pieceRows.flat()
  writeFileSync(path.join(dir, 'art', 'cells.png'), sheetPng(frames, fighterPalette('p1')))
  writeFileSync(path.join(dir, 'art.txt'), artText(slot, rows, poses))
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
  return `${slot.id}: ${distinct} + ${poses.tweens.length} in-between pictures (isolated ${tweens.isolatedLeft}, at most ${tweens.most} cells) for ${poses.rows.length} rows, ${cellsN} cells (${(cellsN / distinct).toFixed(1)} a picture, at most ${most}), ${pieceRows.map((p) => p.length).join(' + ')} KO pieces${clipped}, feet ${lift} up, ${((frames.length * 128) / 1024).toFixed(1)} KB, isolated points ${isolatedLeft}`
}

function artText(slot, rows, poses) {
  const names = poses.rows
  const lines = [
    `# ${slot.id} ${slot.role.toUpperCase()}: where each pose row's cells are (art/cells.png, 16 x 16 each) and`,
    '# where each is drawn. Written by scripts/elecfighter-art.mjs with the drawing. A row of 34 words:',
    '#   first cell, count (at most 32: the room each fighter streams into), then 32 places, a cell',
    '#   each: dx & 255 | (dy & 255) << 8, its top left from the feet (facing right; FLIP_H mirrors).',
    `# The rows of poses.txt (${names.length}), then the KO's pieces of the slot's own mesh (a cell each),`,
    `# cut from the poses ${PIECES.join(' and ')}, then the in-between pictures (fighters/frames.txt).`,
  ]
  rows.forEach((r, k) => {
    const offs = r.cs.map((c) => pack(c.dx, c.dy))
    while (offs.length < ROOM) offs.push(0)
    const tween = k - names.length - PIECES.length
    const name =
      names[k] ??
      (tween < 0 ? `ko pieces (${PIECES[k - names.length]})` : `in-between ${poses.tweens[tween]}`)
    lines.push(`${[r.first, r.cs.length, ...offs].join(' ')} # ${k} ${name}`)
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
  const all = [...poses.rows, ...poses.tweens]
  const rowsN = Math.ceil(all.length / across)
  const img = new Img(across * colW * S, rowsN * 140 * S)
  const colours = [q8([120, 128, 136]), q8([64, 232, 96]), q8([64, 232, 96]), q8([64, 232, 96])]
  colours.push(q8([248, 72, 72]), q8([248, 72, 72]))
  all.forEach((name, r) => {
    const s = results[`${slot.id}/${name}`]
    const ox = ((r % across) * colW + 50) * S
    const oy = (Math.floor(r / across) * 140 + 118) * S
    img.sprite(s, ox - s.ox * S, oy - s.oy * S, P1, S)
    ;(boxes[r] ?? []).forEach(([x, top, w, h], k) => {
      if (!w) return
      const c = colours[k]
      const x0 = ox + x * S
      const y0 = oy - top * S
      img.rect(x0, y0, w * S, 1, c)
      img.rect(x0, y0 + h * S - 1, w * S, 1, c)
      img.rect(x0, y0, 1, h * S, c)
      img.rect(x0 + w * S - 1, y0, 1, h * S, c)
    })
    img.text(
      r < poses.rows.length ? `${r} ${name}` : `+ ${name}`,
      ox - 46 * S,
      oy + 6 * S,
      P1[1],
      1,
    )
  })
  img.save(file)
}

/** Rows of the game's palette picture (the fighters', the effects', the screens'). */
export function writePalettes(file, rows) {
  const old = readPng(readFileSync(file))
  // A row past the picture's foot grows it.
  const height = Math.max(old.height, ...rows.map(([y]) => y + 1))
  const pals = { width: 16, height, data: new Uint8Array(16 * height * 4) }
  pals.data.set(old.data)
  for (const [y, colours] of rows) {
    for (let x = 0; x < 16; x++) {
      const [r, g, b] = colours[x] ?? [0, 0, 0]
      pals.data.set([r, g, b, 255], (y * 16 + x) * 4)
    }
  }
  writeFileSync(file, writePng(pals))
}
