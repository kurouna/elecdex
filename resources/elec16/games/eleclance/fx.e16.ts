// ELECLANCE's effects and pickups (docs/elec16-eleclance.md section 6): explosions, debris,
// sparks, chain numbers that float up, the stars a cancelled bullet becomes (drawn to the
// ship), the bomb and extra-ship pickups, and the far stars behind everything.
import { div, i16, peek, str, u16, words } from '../../../../src/shared/e16c/builtins'
import { BEHIND, rand, randBelow, S8, S16, S32, spr } from '../lib/kit.e16'
import {
  BITS_TILE,
  BLAST_BIG_TILE,
  BLAST_SMALL_TILE,
  FAR_STARS_TILE,
  FONT_TILE,
  PICKUPS_TILE,
  STARS_TILE,
} from './assets.e16'
import { FIELD_W, FIELD_X, SL_FIRE, SL_ITEM, shakeDX, shakeDY } from './view.e16'

/* ---------------- explosions, debris, sparks, numbers ---------------- */

export const FX_SMALL = 1
export const FX_BIG = 2
export const FX_BIT = 3
export const FX_SPARK = 4
export const FX_NUMBER = 5
/** A pickup's word floating up (BOMB+1, 1UP, POWER UP): `v` the pickup's kind. */
export const FX_WORD = 6

const FX_N = 32
const fxKind = words(32)
const fxX = words(32)
const fxY = words(32)
const fxVX = words(32)
const fxVY = words(32)
const fxT = words(32)
let fxNext: u16 = 0

/** An effect at (x, y) in sixteenths of a point, moving (vx, vy). `kind` 0 frees its slot. */
export function fx(kind: u16, x: i16, y: i16, v: u16): void {
  const k = fxNext
  fxNext = (fxNext + 1) & 31
  fxKind[k] = kind
  fxX[k] = u16(x)
  fxY[k] = u16(y)
  fxT[k] = 0
  // `v` packs the velocity (high byte vx, low byte vy, each signed) or a number to show.
  fxVX[k] = u16(i16(v) >> 8)
  fxVY[k] = u16(i16(v << 8) >> 8)
}

/** A packed velocity for `fx`. */
export function vel(vx: i16, vy: i16): u16 {
  return ((u16(vx) & 255) << 8) | (u16(vy) & 255)
}

/** An explosion with debris thrown out: `big` for a large machine. */
export function burst(x: i16, y: i16, big: u16): void {
  fx(big ? FX_BIG : FX_SMALL, x, y, 0)
  let n: u16 = big ? 6 : 3
  while (n > 0) {
    const vx = i16(randBelow(48)) - 24
    const vy = i16(randBelow(48)) - 30
    fx(FX_BIT, x, y, vel(vx, vy))
    n--
  }
  let s: u16 = big ? 4 : 2
  while (s > 0) {
    fx(FX_SPARK, x + i16(randBelow(160)) - 80, y + i16(randBelow(160)) - 80, 0)
    s--
  }
}

/** A number (the chain) floating up from (x, y). */
export function floatNumber(x: i16, y: i16, n: u16): void {
  fx(FX_NUMBER, x, y, n)
}

/** What a pickup of `kind` gave, in words floating up from (x, y). */
export function floatWord(x: i16, y: i16, kind: u16): void {
  fx(FX_WORD, x, y, kind)
}

/** Every effect on by a frame, and drawn. */
export function fxStep(): void {
  let k: u16 = 0
  while (k < FX_N) {
    if (fxKind[k] !== 0) fxOne(k)
    k++
  }
}

function fxOne(k: u16): void {
  const kind = fxKind[k]
  const t = fxT[k] + 1
  fxT[k] = t
  if (kind === FX_BIT) {
    fxX[k] = fxX[k] + fxVX[k]
    fxY[k] = fxY[k] + fxVY[k]
    // Drag: the bits slow, then fall behind the scroll.
    if ((t & 3) === 0) fxVY[k] = fxVY[k] + 1
  } else if (kind >= FX_NUMBER) fxY[k] = fxY[k] - 6
  if (t > fxLife(kind)) fxKind[k] = 0
  else fxDraw(k, kind, t)
}

/** How many frames an effect of `kind` lasts. */
function fxLife(kind: u16): u16 {
  if (kind === FX_BIT) return 36
  if (kind === FX_WORD) return 60
  if (kind === FX_NUMBER) return 40
  if (kind === FX_SMALL) return 17
  if (kind === FX_BIG) return 31
  return 9
}

function fxDraw(k: u16, kind: u16, t: u16): void {
  const x = (i16(fxX[k]) >> 4) + shakeDX()
  const y = (i16(fxY[k]) >> 4) + shakeDY()
  const pal = (SL_FIRE - 8) << 10
  if (kind === FX_SMALL) spr(x - 8, y - 8, (BLAST_SMALL_TILE + div(t, 3) * 4) | pal, S16)
  else if (kind === FX_BIG) spr(x - 16, y - 16, (BLAST_BIG_TILE + (t >> 2) * 16) | pal, S32)
  else if (kind === FX_BIT) spr(x - 4, y - 4, (BITS_TILE + ((t >> 2) & 3)) | pal, S8)
  else if (kind === FX_SPARK) spr(x - 4, y - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | pal, S8)
  else if (kind === FX_NUMBER) numberDraw(x, y, (fxVX[k] << 8) | (fxVY[k] & 255))
  else if (t < 44 || (t & 2) !== 0) wordDraw(x, y, fxVY[k])
}

/** A pickup's word centred on (x, y), in the stars' colours. */
function wordDraw(x: i16, y: i16, kind: u16): void {
  const s = kind === IT_BOMB ? str('BOMB+1') : kind === IT_LIFE ? str('1UP') : str('POWER UP')
  let n: u16 = 0
  while (peek(s + n) !== 0) n++
  let at = x - i16(n * 4)
  const tile = (FONT_TILE - 32) | ((SL_ITEM - 8) << 10)
  let k: u16 = 0
  while (k < n) {
    spr(at, y - 4, tile + peek(s + k), S8)
    at = at + 8
    k++
  }
}

/** "x" and a chain's number in gold, centred on (x, y), blinking as it fades. */
function numberDraw(x: i16, y: i16, n: u16): void {
  const tile = (FONT_TILE - 32) | ((SL_ITEM - 8) << 10)
  let digits: u16 = n >= 100 ? 3 : n >= 10 ? 2 : 1
  let at = x + i16(digits * 4) - 4
  spr(at - i16(digits * 8) - 4, y, tile + 88, S8)
  while (digits > 0) {
    spr(at, y, tile + 48 + (n % 10), S8)
    n = div(n, 10)
    at = at - 8
    digits--
  }
}

/* ---------------- stars to pick up, and the pickups ---------------- */

export const IT_STAR = 1
export const IT_BOMB = 2
export const IT_LIFE = 3
export const IT_POWER = 4

const IT_N = 40
const itKind = words(40)
const itX = words(40)
const itY = words(40)
const itVX = words(40)
const itVY = words(40)
const itT = words(40)
let itNext: u16 = 0

/** A pickup at (x, y): stars burst out a little, then home in on the ship. */
export function item(kind: u16, x: i16, y: i16): void {
  const k = itNext
  itNext = itNext + 1 === IT_N ? 0 : itNext + 1
  itKind[k] = kind
  itX[k] = u16(x)
  itY[k] = u16(y)
  itVX[k] = u16(i16(randBelow(64)) - 32)
  itVY[k] = u16(i16(randBelow(40)) - 40)
  itT[k] = 0
}

/** Every pickup on a frame: answers what the ship at (sx, sy) caught, by kind, in `caught`. */
export const caught = words(5)

/** This frame's magnet (OVERDRIVE draws every star at once). */
let magnetNow: u16 = 0

export function itemsStep(sx: i16, sy: i16, magnet: u16): void {
  magnetNow = magnet
  caught[1] = 0
  caught[2] = 0
  caught[3] = 0
  caught[4] = 0
  let k: u16 = 0
  while (k < IT_N) {
    if (itKind[k] !== 0) itemOne(k, sx, sy)
    k++
  }
}

function itemOne(k: u16, sx: i16, sy: i16): void {
  const t = itT[k] + 1
  itT[k] = t
  const x = i16(itX[k])
  const y = i16(itY[k])
  const dx = sx - x
  const dy = sy - y
  const kind = itKind[k]
  itemSteer(k, t, dx, dy)
  itX[k] = u16(x + i16(itVX[k]))
  itY[k] = u16(y + i16(itVY[k]))
  if (abs(dx) < 224 && abs(dy) < 224) {
    caught[kind] = caught[kind] + 1
    itKind[k] = 0
    return
  }
  if (i16(itY[k]) > 4800 || t > 900) {
    itKind[k] = 0
    return
  }
  itemDraw(k, kind, t)
}

/**
 * A pickup's course: a star falls a little, then homes in on the ship (at once with the
 * magnet), faster as time goes; a bomb or a ship drifts down, side to side.
 */
function itemSteer(k: u16, t: u16, dx: i16, dy: i16): void {
  if (itKind[k] !== IT_STAR) {
    itVY[k] = 10
    itVX[k] = u16((t & 64) !== 0 ? 6 : -6)
    return
  }
  if (t <= 16 && magnetNow === 0) {
    itVY[k] = u16(i16(itVY[k]) + 2)
    return
  }
  const pull: i16 = t > 40 ? 6 : 3
  itVX[k] = u16(clamp(i16(itVX[k]) + (dx > 0 ? pull : -pull), 96))
  itVY[k] = u16(clamp(i16(itVY[k]) + (dy > 0 ? pull : -pull), 96))
}

function itemDraw(k: u16, kind: u16, t: u16): void {
  const x = (i16(itX[k]) >> 4) + shakeDX()
  const y = (i16(itY[k]) >> 4) + shakeDY()
  const pal = (SL_ITEM - 8) << 10
  if (kind === IT_STAR) spr(x - 4, y - 4, (STARS_TILE + ((t >> 2) & 3)) | pal, S8)
  else {
    // Pickups: B, then 1, then P, two glints each.
    const which: u16 = kind === IT_BOMB ? 0 : kind === IT_LIFE ? 8 : 16
    spr(x - 8, y - 8, (PICKUPS_TILE + which + ((t >> 3) & 1) * 4) | pal, S16)
  }
}

/** Every star homes in at once (a boss's end, a bomb). */
export function itemsAll(): void {
  let k: u16 = 0
  while (k < IT_N) {
    itT[k] = 41
    k++
  }
}

export function itemsClear(): void {
  let k: u16 = 0
  while (k < IT_N) {
    itKind[k] = 0
    k++
  }
  k = 0
  while (k < FX_N) {
    fxKind[k] = 0
    k++
  }
}

export function clamp(v: i16, m: i16): i16 {
  if (v > m) return m
  if (v < -m) return -m
  return v
}

export function abs(v: i16): i16 {
  return v < 0 ? -v : v
}

/* ---------------- the far stars ---------------- */

const farX = words(10)
const farY = words(10)

/** The far stars scattered once. */
export function farStarsInit(): void {
  let k: u16 = 0
  while (k < 10) {
    farX[k] = FIELD_X + randBelow(FIELD_W)
    farY[k] = randBelow(255) + (rand() & 31)
    k++
  }
}

/** The far stars down by a quarter of the scroll (three depths), drawn behind the backgrounds. */
export function farStarsStep(speed: u16, frame: u16): void {
  let k: u16 = 0
  while (k < 10) {
    const depth = k % 3
    // Every 4th, 2nd or every frame, by depth: the nearer, the faster.
    const every: u16 = depth === 0 ? 3 : depth === 1 ? 1 : 0
    if ((frame & every) === 0 && speed > 0) farY[k] = farY[k] + 1
    if (farY[k] > 288) {
      farY[k] = 0
      farX[k] = FIELD_X + randBelow(FIELD_W)
    }
    spr(
      i16(farX[k]) - 3,
      i16(farY[k]) - 3,
      (FAR_STARS_TILE + depth) | ((SL_ITEM - 8) << 10) | BEHIND,
      S8,
    )
    k++
  }
}
