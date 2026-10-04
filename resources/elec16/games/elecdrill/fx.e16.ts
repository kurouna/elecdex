// ELECDRILL's effects (docs/elec16-elecdrill.md section 6): the pop a block vanishes in, stars
// flung from it, dust where the drill bites and where the driller lands, sparks off ALLOY,
// bubbles from a capsule, the chain's count rising from where it struck. Kept in the well's
// own places (y from row 0) and drawn against the camera.
import { div, i16, u16, words, wrap16 } from '../../../../src/shared/e16c/builtins'
import { randBelow, S8, S16, spr } from '../lib/kit.e16'
import { FONT_TILE, FX_TILE, POP_TILE } from './assets.e16'

const FX_N = 32
const fxK = words(32)
const fxX = words(32)
const fxY = words(32)
const fxVX = words(32)
const fxVY = words(32)
const fxT = words(32)
const fxA = words(32)
let fxNext: u16 = 0

const K_POP = 1
const K_DUST = 2
const K_SPARK = 3
const K_STAR = 4
const K_BUBBLE = 5
const K_CHAIN = 6
const K_PLUS = 7

let velX: i16 = 0
let velY: i16 = 0

/** The next effect's speed, sixteenths of a point a frame. */
function fxVel(vx: i16, vy: i16): void {
  velX = vx
  velY = vy
}

/** An effect at (x, y) points, moving as `fxVel` said (then still); `a` its own value. */
function fxAdd(k: u16, x: i16, y: i16, a: u16): void {
  const vx = velX
  const vy = velY
  velX = 0
  velY = 0
  const s = fxNext
  fxNext = (fxNext + 1) & 31
  fxK[s] = k
  fxX[s] = u16(x) << 4
  // Wrapped: the well is deeper than a word of sixteenths, but an effect is never far from the camera.
  fxY[s] = wrap16(u16(y) << 4)
  fxVX[s] = u16(vx)
  fxVY[s] = u16(vy)
  fxT[s] = 0
  fxA[s] = a
}

/** A block vanishing at (x, y) (its top left): the pop in its colour, and a star or two. */
export function pop(x: i16, y: i16, colour: u16, stars: u16): void {
  fxVel(0, 0)
  fxAdd(K_POP, x, y, colour)
  let n = stars
  while (n > 0) {
    fxVel(i16(randBelow(48)) - 24, -i16(randBelow(24)) - 20)
    fxAdd(K_STAR, x + 4, y + 4, 0)
    n--
  }
}

/** Dust where something scrapes or lands: `more` for a bigger cloud. */
export function dust(x: i16, y: i16, more: u16): void {
  let n: u16 = more !== 0 ? 4 : 1
  while (n > 0) {
    fxVel(i16(randBelow(32)) - 16, -i16(randBelow(12)) - 4)
    fxAdd(K_DUST, x - 4, y - 4, 0)
    n--
  }
}

export function sparks(x: i16, y: i16, n: u16): void {
  while (n > 0) {
    fxVel(i16(randBelow(64)) - 32, -i16(randBelow(40)) - 8)
    fxAdd(K_SPARK, x - 4, y - 4, 0)
    n--
  }
}

export function bubbles(x: i16, y: i16): void {
  let n: u16 = 4
  while (n > 0) {
    fxVel(i16(randBelow(16)) - 8, -i16(randBelow(12)) - 10)
    fxAdd(K_BUBBLE, x + i16(randBelow(12)) - 6, y + 4, 0)
    n--
  }
}

/** "n CHAIN" rising from (x, y). */
export function chainShow(x: i16, y: i16, n: u16): void {
  fxVel(0, -12)
  fxAdd(K_CHAIN, x, y, n)
}

/** "+n" (points) rising from (x, y). */
export function plusShow(x: i16, y: i16, n: u16): void {
  fxVel(0, -10)
  fxAdd(K_PLUS, x, y, n)
}

export function fxClear(): void {
  let k: u16 = 0
  while (k < FX_N) {
    fxK[k] = 0
    k++
  }
}

/** Every effect a frame on, and drawn (the well's top at `camY`). Words first, in front. */
export function fxStep(camY: u16): void {
  let k: u16 = 0
  while (k < FX_N) {
    const kind = fxK[k]
    if (kind === K_CHAIN || kind === K_PLUS) fxOne(k, kind, camY)
    k++
  }
  k = 0
  while (k < FX_N) {
    const kind = fxK[k]
    if (kind !== 0 && kind !== K_CHAIN && kind !== K_PLUS) fxOne(k, kind, camY)
    k++
  }
}

function fxOne(k: u16, kind: u16, camY: u16): void {
  const t = fxT[k] + 1
  fxT[k] = t
  if (t >= lifeOf(kind)) {
    fxK[k] = 0
    return
  }
  fxMove(k, kind, t)
  const x = i16(fxX[k] >> 4)
  const y = i16(wrap16(fxY[k] - (camY << 4))) >> 4
  if (y < -16 || y > 296) return
  fxDraw(k, x, y)
}

/** How many frames an effect of `kind` lasts. */
function lifeOf(kind: u16): u16 {
  if (kind === K_POP) return 15
  if (kind === K_DUST) return 20
  if (kind === K_SPARK) return 12
  if (kind === K_STAR) return 30
  if (kind === K_BUBBLE) return 40
  return 50
}

/** A frame's move: gravity for stars and sparks, drag on dust, the words slowing to a stop. */
function fxMove(k: u16, kind: u16, t: u16): void {
  fxX[k] = fxX[k] + fxVX[k]
  fxY[k] = fxY[k] + fxVY[k]
  if (kind === K_STAR || kind === K_SPARK) fxVY[k] = fxVY[k] + 3
  else if (kind === K_DUST && (t & 3) === 0) {
    fxVX[k] = u16(i16(fxVX[k]) >> 1)
    fxVY[k] = u16(i16(fxVY[k]) >> 1)
  } else if ((kind === K_CHAIN || kind === K_PLUS) && t > 20) fxVY[k] = 0
}

function fxDraw(k: u16, x: i16, y: i16): void {
  const kind = fxK[k]
  const t = fxT[k]
  const fx = 6 << 10
  if (kind === K_POP) spr(x, y, (POP_TILE + div(t, 3) * 4) | (fxA[k] << 10), S16)
  else if (kind === K_DUST) spr(x, y, (FX_TILE + (t >> 2 > 3 ? 3 : t >> 2)) | fx, S8)
  else if (kind === K_SPARK) spr(x, y, (FX_TILE + 4 + ((t >> 1) & 1)) | fx, S8)
  else if (kind === K_BUBBLE) spr(x, y, (FX_TILE + 6 + (t > 20 ? 1 : 0)) | fx, S8)
  else if (kind === K_STAR) {
    if (t < 20 || (t & 2) !== 0) spr(x, y, (FX_TILE + 8 + ((t >> 2) & 1)) | fx, S8)
  } else if (t < 36 || (t & 2) !== 0) wordDraw(x, y, kind, fxA[k])
}

/** A character of the lettering in gold (sprite slot 15). */
function gold(c: u16): u16 {
  return (FONT_TILE + c - 32) | (7 << 10)
}

/** A number and its word in gold lettering (slot 15), centred on x but kept in the well. */
function wordDraw(x: i16, y: i16, kind: u16, n: u16): void {
  const digits: u16 = n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : 1
  const width: u16 = kind === K_CHAIN ? digits + 6 : digits + 1
  let at = x - i16(width * 4)
  if (at < 90) at = 90
  if (at + i16(width * 8) > 230) at = 230 - i16(width * 8)
  if (kind === K_PLUS) {
    spr(at, y, gold(43), S8)
    at = at + 8
  }
  let d = digits
  let v = n
  while (d > 0) {
    d--
    spr(at + i16(d * 8), y, gold(48 + (v % 10)), S8)
    v = div(v, 10)
  }
  if (kind !== K_CHAIN) return
  at = at + i16(digits * 8) + 8
  spr(at, y, gold(67), S8)
  spr(at + 8, y, gold(72), S8)
  spr(at + 16, y, gold(65), S8)
  spr(at + 24, y, gold(73), S8)
  spr(at + 32, y, gold(78), S8)
}
