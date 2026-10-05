// ELECLANCE's later foes (docs/elec16-eleclance.md section 5): PRISM, which the lance glances
// off; SERPENT, a head whose segments follow its trail and go up in a chain when it dies; and
// SPINNER, a mine that drifts after the ship and bursts into a ring when it is shot. In
// cartridge bank 3, with the foes' tables and everything they call in RAM.
import { type bool, i16, mulShift, u16, words } from '../../../../src/shared/e16c/builtins'
import { cos, S16, spr } from '../lib/kit.e16'
import { PRISM_TILE, SERPENT_TILE, SPINNER_TILE } from './assets.e16'
import { IT_STAR, item } from './fx.e16'
import { aimed, BK_BLUE, BK_PINK, fan, fanOf, ring, ringOf } from './shots.e16'
import { shake } from './view.e16'

/** A serpent's segments, and how far apart along its trail (in samples). */
const SEGMENTS = 6
const SPACING = 3
/** Two serpents at most: each a head's slot and a trail of 32 places (x, y). */
const serpentHead = words(2)
const trail = words(128)
const trailAt = words(2)

/** A frame of a later foe. */
export function newFoeMove(k: u16, t: u16): void {
  const kind = fK[k]
  if (kind === K_PRISM) prismMove(k, t)
  else if (kind === K_SPINNER) spinnerMove(k, t)
  else if (kind === K_SERPENT) serpentMove(k, t)
  else segmentMove(k, t)
}

/** A prism drops to its row, sways and fires blue fans; it leaves after ten seconds. */
function prismMove(k: u16, t: u16): void {
  const y = i16(fY[k]) >> 4
  // Its time up, it climbs away for good: tested first, or its row would call it back down.
  fVY[k] = t > 600 ? u16(-16) : y < 60 + i16(fP[k]) ? 20 : 0
  fVX[k] = u16(mulShift(cos(t * 2), 24, 8))
  if (t % 80 === 40 && y > 30 && t < 600) {
    fan(
      i16(fX[k]),
      i16(fY[k]),
      aimed(i16(fX[k]), i16(fY[k])),
      fanOf(3 + (rank >> 2), 12, 30, BK_BLUE),
    )
  }
}

/** A spinner falls slowly, edging toward the ship's side. */
function spinnerMove(k: u16, t: u16): void {
  const dx = targetX - i16(fX[k])
  const toward: i16 = dx > 0 ? 10 : -10
  fVX[k] = u16(t < 30 ? 0 : toward)
  fVY[k] = 14
}

/** The head weaves down the screen; its trail is kept for the segments behind. */
function serpentMove(k: u16, t: u16): void {
  fVY[k] = 12
  fVX[k] = u16(mulShift(cos(t * 3), 52, 8))
  const slot = fP[k] >> 8
  if ((t & 1) === 0) {
    const at = (trailAt[slot] + 1) & 31
    trailAt[slot] = at
    trail[slot * 64 + at * 2] = fX[k]
    trail[slot * 64 + at * 2 + 1] = fY[k]
  }
}

/**
 * A segment sits where the head was a little while ago; with the head shot down, it goes up in
 * turn; with the head gone off the screen, it falls away after it.
 */
function segmentMove(k: u16, t: u16): void {
  const slot = (fP[k] >> 8) & 1
  const index = fP[k] & 15
  fVX[k] = 0
  fVY[k] = 0
  if ((fP[k] & 0x80) !== 0) {
    // Dying in a chain: one after another down the body.
    if (t > index * 5) foeHurt(k, 999)
    return
  }
  if ((fP[k] & 0x40) !== 0) {
    fVY[k] = 32
    return
  }
  const at = (trailAt[slot] + 32 - index * SPACING) & 31
  fX[k] = trail[slot * 64 + at * 2]
  fY[k] = trail[slot * 64 + at * 2 + 1]
}

/** Whether a serpent may come: two at most, each with a trail of its own. */
export function serpentRoom(): bool {
  return serpentHead[0] === 0 || serpentHead[1] === 0
}

/** A serpent born at foe k: its slot, its trail all at its start, its segments behind it. */
export function serpentBorn(k: u16): void {
  const slot: u16 = serpentHead[0] === 0 ? 0 : 1
  serpentHead[slot] = k + 1
  fP[k] = slot << 8
  let s: u16 = 0
  while (s < 32) {
    trail[slot * 64 + s * 2] = fX[k]
    trail[slot * 64 + s * 2 + 1] = fY[k]
    s++
  }
  trailAt[slot] = 0
  let i: u16 = 1
  while (i <= SEGMENTS) {
    const seg = foe(K_SEGMENT, i16(fX[k]) >> 4, i16(fY[k]) >> 4, 0)
    if (seg !== 0xffff) fP[seg] = (slot << 8) | i
    i++
  }
}

/** What a later foe leaves when it dies. */
export function newFoeDies(k: u16, kind: u16, x: i16, y: i16): void {
  if (kind === K_SPINNER) {
    // Its ring, near or far: the reason to shoot it at a distance.
    ring(x, y, u16(x >> 4) & 255, ringOf(8 + (rank >> 2), 20, BK_PINK))
  } else if (kind === K_SERPENT) {
    serpentDown(fP[k] >> 8)
    shake(14)
    let s: u16 = 0
    while (s < 4) {
      item(IT_STAR, x, y)
      s++
    }
  }
}

/** The head is shot down: its segments go up one after another. */
function serpentDown(slot: u16): void {
  segmentsLet(slot, 0x80)
}

/** The head has left the screen: its segments fall away after it. */
export function serpentGone(slot: u16): void {
  segmentsLet(slot, 0x40)
}

/** Serpent `slot` is free again; its segments marked with `how` and their time begun again. */
function segmentsLet(slot: u16, how: u16): void {
  serpentHead[slot] = 0
  let k: u16 = 0
  while (k < 24) {
    if (fK[k] === K_SEGMENT && fP[k] >> 8 === slot) {
      fP[k] = fP[k] | how
      fT[k] = 0
    }
    k++
  }
}

/* ---------------- the first foes' flight (moved here from foes.e16.ts for RAM's room) ---------------- */

/** A mote's paths: 0 down and swaying, 1 in from the left on a curve, 2 from the right. */
export function moteMove(k: u16, t: u16): void {
  const p = fP[k]
  if (p === 0) {
    fVY[k] = 22
    fVX[k] = u16((t & 32) !== 0 ? 10 : -10)
  } else {
    const dir: i16 = p === 1 ? 1 : -1
    const sp: i16 = t < 60 ? 36 : 20
    fVX[k] = u16(dir * sp)
    fVY[k] = u16(t < 30 ? 6 : 24)
  }
  if (t === 50 + (k & 15) && randBelow(16) < 4 + rank) shootAimed(k, BK_PINK, 36)
}

/** A dart dives toward the ship, then sheers off sideways. */
export function dartMove(k: u16, t: u16): void {
  if (t < 40) {
    fVY[k] = 48
    fVX[k] = u16(chase(k))
  } else {
    const away: i16 = i16(fX[k]) < targetX ? -40 : 40
    fVX[k] = u16(away)
    fVY[k] = 56
    if (t === 40) shootAimed(k, BK_NEEDLE, 48)
  }
}

/** A pike drops to its row, fires three fans, and climbs away. */
export function pikeMove(k: u16, t: u16): void {
  const stop = 60 + fP[k]
  if (t < 200) {
    const y = i16(fY[k]) >> 4
    fVY[k] = y < i16(stop) ? 24 : 0
    if (y >= i16(stop) && t % 50 === 0) {
      fan(
        i16(fX[k]),
        i16(fY[k]),
        aimed(i16(fX[k]), i16(fY[k])),
        fanOf(3 + (rank >> 2), 10, 32, BK_BLUE),
      )
    }
  } else fVY[k] = u16(-24)
}

/** A halberd descends, strafes, fires pink fans and amber bursts, and leaves late. */
export function halberdMove(k: u16, t: u16): void {
  const y = i16(fY[k]) >> 4
  fVY[k] = t > 640 ? u16(-16) : y < 70 ? 20 : 0
  fVX[k] = u16((t & 128) !== 0 ? 8 : -8)
  if (y < 60 || t > 640) return
  if (t % 60 === 0) fan(i16(fX[k]), i16(fY[k]) + 160, 64, fanOf(5 + (rank >> 2), 12, 36, BK_PINK))
  if (t % 60 === 30) {
    const a = aimed(i16(fX[k]), i16(fY[k]))
    bullet(i16(fX[k]) - 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
    bullet(i16(fX[k]) + 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
  }
}

/** A warden settles high, rings bullets out and lets motes loose from its bay, and leaves late. */
export function wardenMove(k: u16, t: u16): void {
  const y = i16(fY[k]) >> 4
  fVY[k] = t > 760 ? u16(-12) : y < 50 ? 16 : 0
  if (y < 40 || t > 760) return
  if (t % 90 === 0) ring(i16(fX[k]), i16(fY[k]), t & 255, ringOf(12 + rank, 24, BK_ORB))
  if (t % 80 === 40) foe(K_MOTE, i16(fX[k] >> 4), i16(fY[k] >> 4) + 8, 0)
}

/** A speed toward the ship's x: a thirty-second of the way a frame. */
function chase(k: u16): i16 {
  return (targetX - i16(fX[k])) >> 5
}

/**
 * Whether a heavy foe is about to loose its big volley (the frames before a halberd's pink fan,
 * a warden's ring, a prism's blue fan): it blinks white as a warning.
 */
export function foeCharging(kind: u16, t: u16): bool {
  if (kind === K_HALBERD) return t % 60 >= 46 && t < 640
  if (kind === K_WARDEN) return t % 90 >= 70 && t < 760
  return t % 80 >= 26 && t % 80 < 40 && t < 600
}

/** An aimed bullet from the foe. */
export function shootAimed(k: u16, kind: u16, speed: u16): void {
  const x = i16(fX[k])
  const y = i16(fY[k])
  bullet(x, y, aimed(x, y), sk(speed + rank * 2, kind))
}

/** A later foe drawn, in the colours `foePal` chose. */
export function newFoeDraw(k: u16, x: i16, y: i16, t: u16): void {
  const kind = fK[k]
  if (kind === K_PRISM) spr(x, y, (PRISM_TILE + ((t >> 3) & 3) * 4) | foePal, S16)
  else if (kind === K_SPINNER) spr(x, y, (SPINNER_TILE + ((t >> 1) & 3) * 4) | foePal, S16)
  else if (kind === K_SERPENT) spr(x, y, (SERPENT_TILE + ((t >> 4) & 1) * 4) | foePal, S16)
  else spr(x, y, (SERPENT_TILE + 8) | foePal, S16)
}

/** Every serpent forgotten (a new round). */
export function serpentsClear(): void {
  serpentHead[0] = 0
  serpentHead[1] = 0
}

import { randBelow } from '../lib/kit.e16'
import {
  fK,
  foe,
  foeHurt,
  foePal,
  fP,
  fT,
  fVX,
  fVY,
  fX,
  fY,
  K_HALBERD,
  K_MOTE,
  K_PRISM,
  K_SEGMENT,
  K_SERPENT,
  K_SPINNER,
  K_WARDEN,
  rank,
} from './foes.e16'
import { BK_AMBER, BK_NEEDLE, BK_ORB, bullet, sk, targetX } from './shots.e16'
