// ELECLANCE's enemies (docs/elec16-eleclance.md section 5): who they are, how they fly and shoot,
// how they are hit (by shots, the lance, a bomb) and what they leave; and the stage's script,
// which sends them as the stage scrolls past their rows.
import { type bool, i16, peek16, u16, words } from '../../../../src/shared/e16c/builtins'
import { bank, FLIP_H, randBelow, S16, S32, spr } from '../lib/kit.e16'
import {
  DART_TILE,
  HALBERD_TILE,
  MOTE_TILE,
  PIKE_TILE,
  ROCK_BIG_TILE,
  ROCK_SMALL_TILE,
  STAGE_SCRIPT_AT,
  STAGE_SCRIPT_BANK,
  WARDEN_TILE,
} from './assets.e16'
import { abs, burst, IT_BOMB, IT_LIFE, IT_STAR, item } from './fx.e16'
import {
  aimed,
  BK_AMBER,
  BK_BLUE,
  BK_NEEDLE,
  BK_ORB,
  BK_PINK,
  bullet,
  cancelNear,
  fan,
  fanOf,
  ring,
  ringOf,
  sk,
  targetX,
} from './shots.e16'
import { FIELD_X, reached, SL_ENEMY, SL_FLASH, SL_HEAVY, shake, shakeDX, shakeDY } from './view.e16'

export const K_MOTE = 1
export const K_DART = 2
export const K_PIKE = 3
export const K_HALBERD = 4
export const K_WARDEN = 5
export const K_ROCK = 6
export const K_PEBBLE = 7
export const K_TURRET = 8

/** Script commands, past the enemies. */
const C_SPEED = 20
const C_MIDBOSS = 21
const C_BOSS = 22
const C_PICKUP = 23

const F_N = 24
const fK = words(24)
const fX = words(24)
const fY = words(24)
const fVX = words(24)
const fVY = words(24)
const fHP = words(24)
const fT = words(24)
const fP = words(24)
const fFlash = words(24)

/** Each kind's half size (points), life, and points (x10). */
const HALF = words(9)
const LIFE = words(9)
const WORTH = words(9)

export function foesInit(): void {
  kindIs(K_MOTE, 7, 3, 10)
  kindIs(K_DART, 7, 4, 15)
  kindIs(K_PIKE, 7, 10, 30)
  kindIs(K_HALBERD, 15, 60, 200)
  kindIs(K_WARDEN, 15, 90, 300)
  kindIs(K_ROCK, 14, 22, 50)
  kindIs(K_PEBBLE, 7, 4, 10)
  kindIs(K_TURRET, 7, 14, 40)
  foesClear()
}

function kindIs(k: u16, half: u16, life: u16, worth: u16): void {
  HALF[k] = half
  LIFE[k] = life
  WORTH[k] = worth
}

export function foesClear(): void {
  let k: u16 = 0
  while (k < F_N) {
    fK[k] = 0
    k++
  }
}

/** How many foes are about (the stage waits for a boss's field to be clear). */
export let foeCount: u16 = 0
/** The second round: foes shoot back when they die, and faster. */
export let round: u16 = 1
/** Rank, 0-15: rises as the game goes; more and faster bullets. */
export let rank: u16 = 0

export function roundIs(r: u16): void {
  round = r
}

export function rankUp(): void {
  if (rank < 15) rank++
}

/** A foe of `kind` at (x, y) points, with `p` for its path. */
export function foe(kind: u16, x: i16, y: i16, p: u16): void {
  let k: u16 = 0
  while (k < F_N && fK[k] !== 0) k++
  if (k === F_N) return
  fK[k] = kind
  fX[k] = u16(x * 16)
  fY[k] = u16(y * 16)
  fVX[k] = 0
  fVY[k] = 0
  fHP[k] = LIFE[kind] + (round > 1 ? LIFE[kind] >> 1 : 0)
  fT[k] = 0
  fP[k] = p
  fFlash[k] = 0
}

/** Every foe on a frame: moves, shoots, is drawn. `scroll` the stage's speed (sixteenths). */
export function foesStep(scroll: u16): void {
  foeCount = 0
  let k: u16 = 0
  while (k < F_N) {
    if (fK[k] !== 0) foeOne(k, scroll)
    k++
  }
}

function foeOne(k: u16, scroll: u16): void {
  foeCount++
  const t = fT[k] + 1
  fT[k] = t
  switch (fK[k]) {
    case K_MOTE:
      moteMove(k, t)
      break
    case K_DART:
      dartMove(k, t)
      break
    case K_PIKE:
      pikeMove(k, t)
      break
    case K_HALBERD:
      halberdMove(k, t)
      break
    case K_WARDEN:
      wardenMove(k, t)
      break
    case K_TURRET:
      fVY[k] = scroll
      if (t % (70 - rank * 2) === 0 && i16(fY[k]) > 320 && i16(fY[k]) < 3200)
        shootAimed(k, BK_NEEDLE, 40)
      break
    default:
      // Rocks and pebbles drift as they were thrown.
      break
  }
  const x = i16(fX[k]) + i16(fVX[k])
  const y = i16(fY[k]) + i16(fVY[k])
  fX[k] = u16(x)
  fY[k] = u16(y)
  // Gone off any edge but the top it came in by.
  if (y > 4900 || y < -1200 || x < (FIELD_X - 48) * 16 || x > (FIELD_X + 272) * 16) {
    fK[k] = 0
    return
  }
  foeDraw(k, x, y, t)
}

/** A mote's paths: 0 down and swaying, 1 in from the left on a curve, 2 from the right. */
function moteMove(k: u16, t: u16): void {
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
function dartMove(k: u16, t: u16): void {
  if (t < 40) {
    fVY[k] = 48
    fVX[k] = u16(chase(k))
  } else {
    const away: i16 = i16(fX[k]) < targetXNow() ? -40 : 40
    fVX[k] = u16(away)
    fVY[k] = 56
    if (t === 40) shootAimed(k, BK_NEEDLE, 48)
  }
}

/** A pike drops to its row, fires three fans, and climbs away. */
function pikeMove(k: u16, t: u16): void {
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
function halberdMove(k: u16, t: u16): void {
  const y = i16(fY[k]) >> 4
  fVY[k] = y < 70 ? 20 : t > 640 ? u16(-16) : 0
  fVX[k] = u16((t & 128) !== 0 ? 8 : -8)
  if (y < 60) return
  if (t % 60 === 0) fan(i16(fX[k]), i16(fY[k]) + 160, 64, fanOf(5 + (rank >> 2), 12, 36, BK_PINK))
  if (t % 60 === 30) {
    const a = aimed(i16(fX[k]), i16(fY[k]))
    bullet(i16(fX[k]) - 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
    bullet(i16(fX[k]) + 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
  }
}

/** A warden settles high, rings bullets out and lets motes loose from its bay. */
function wardenMove(k: u16, t: u16): void {
  const y = i16(fY[k]) >> 4
  fVY[k] = y < 50 ? 16 : t > 760 ? u16(-12) : 0
  if (y < 40) return
  if (t % 90 === 0) ring(i16(fX[k]), i16(fY[k]), t & 255, ringOf(12 + rank, 24, BK_ORB))
  if (t % 80 === 40) foe(K_MOTE, i16(fX[k] >> 4), i16(fY[k] >> 4) + 8, 0)
}

/** A speed toward the ship's x, a fifth of the way a frame... softened. */
function chase(k: u16): i16 {
  const d = targetXNow() - i16(fX[k])
  return d >> 5
}

function targetXNow(): i16 {
  return targetX
}

/** An aimed bullet from the foe. */
function shootAimed(k: u16, kind: u16, speed: u16): void {
  const x = i16(fX[k])
  const y = i16(fY[k])
  bullet(x, y, aimed(x, y), sk(speed + rank * 2, kind))
}

function foeDraw(k: u16, x16: i16, y16: i16, t: u16): void {
  const kind = fK[k]
  const half = i16(HALF[kind])
  const x = (x16 >> 4) - half + shakeDX()
  const y = (y16 >> 4) - half + shakeDY()
  let flash: u16 = 0
  if (fFlash[k] > 0) {
    fFlash[k] = fFlash[k] - 1
    flash = 1
  }
  const heavy = kind === K_HALBERD || kind === K_WARDEN
  const pal = ((flash ? SL_FLASH : heavy ? SL_HEAVY : SL_ENEMY) - 8) << 10
  switch (kind) {
    case K_MOTE:
      spr(x, y, (MOTE_TILE + ((t >> 2) & 3) * 4) | pal, S16)
      break
    case K_DART: {
      const bank_ = i16(fVX[k]) > 8 ? FLIP_H : 0
      const lean = abs(i16(fVX[k])) > 8 ? 0 : 4
      spr(x, y, (DART_TILE + lean) | pal | bank_, S16)
      break
    }
    case K_PIKE:
    case K_TURRET:
      spr(x, y, (PIKE_TILE + (t % 50 > 40 ? 4 : 0)) | pal, S16)
      break
    case K_HALBERD:
      spr(x, y, (HALBERD_TILE + ((t >> 2) & 1) * 16) | pal, S32)
      break
    case K_WARDEN:
      spr(x, y, (WARDEN_TILE + (t % 80 > 30 && t % 80 < 50 ? 16 : 0)) | pal, S32)
      break
    case K_ROCK:
      spr(x, y, (ROCK_BIG_TILE + ((t >> 5) & 1) * 16) | pal, S32)
      break
    default:
      spr(x, y, (ROCK_SMALL_TILE + ((t >> 4) & 1) * 4) | pal, S16)
  }
}

/* ---------------- being hit ---------------- */

/** What a frame's kills came to: for the score and the chain (score.e16.ts). */
export let killed: u16 = 0
export let killWorth: u16 = 0
export let killX: i16 = 0
export let killY: i16 = 0

/** A shot at (x, y) hits a foe? Damages it by `damage`. */
export function foeHit(x: i16, y: i16, damage: u16, byLance: bool): bool {
  let k: u16 = 0
  while (k < F_N) {
    if (fK[k] !== 0 && within(k, x, y, 0)) {
      hurt(k, damage, byLance)
      return true
    }
    k++
  }
  return bossHit(x, y, damage, byLance)
}

function within(k: u16, x: i16, y: i16, more: i16): bool {
  const r = i16(HALF[fK[k]]) * 16 + more
  return abs(i16(fX[k]) - x) < r && abs(i16(fY[k]) - y) < r && i16(fY[k]) > -64
}

/**
 * The lance from (x, y) up: the nearest foe above in its path takes `damage`; answers where it
 * strikes (sixteenths), 0 for nothing (it reaches the top).
 */
export function foeLance(x: i16, y: i16, damage: u16): i16 {
  let best: u16 = 0xffff
  let bestY: i16 = 0
  let k: u16 = 0
  while (k < F_N) {
    if (fK[k] !== 0) {
      const r = i16(HALF[fK[k]]) * 16 + 64
      const fy = i16(fY[k]) + i16(HALF[fK[k]]) * 16
      if (abs(i16(fX[k]) - x) < r && fy < y && fy > bestY) {
        best = k
        bestY = fy
      }
    }
    k++
  }
  const boss = bossLance(x, y)
  if (boss > bestY) {
    bossHit(x, boss - 32, damage, true)
    return boss
  }
  if (best === 0xffff) return 0
  hurt(best, damage, true)
  return bestY
}

/** The bomb: every foe on the screen hurt hard. */
export function foeBomb(): void {
  let k: u16 = 0
  while (k < F_N) {
    if (fK[k] !== 0 && i16(fY[k]) > 0) hurt(k, 40, false)
    k++
  }
  bossBomb()
}

function hurt(k: u16, damage: u16, byLance: bool): void {
  fFlash[k] = 2
  if (fHP[k] > damage) {
    fHP[k] = fHP[k] - damage
    return
  }
  kill(k, byLance)
}

function kill(k: u16, byLance: bool): void {
  const kind = fK[k]
  const x = i16(fX[k])
  const y = i16(fY[k])
  fK[k] = 0
  const big = kind === K_HALBERD || kind === K_WARDEN || kind === K_ROCK
  burst(x, y, big ? 1 : 0)
  if (big) shake(10)
  // Stars: more for the lance's kills, a handful for a big one.
  let stars: u16 = (big ? 6 : 1) + (byLance ? 2 : 0)
  while (stars > 0) {
    item(IT_STAR, x, y)
    stars--
  }
  if (kind === K_ROCK) {
    foe(K_PEBBLE, (x >> 4) - 6, y >> 4, 0)
    foe(K_PEBBLE, (x >> 4) + 6, y >> 4, 0)
    pebbleThrow()
  }
  if (overdriveOn()) cancelNear(x, y, 960)
  // The second round: the dying shoot back.
  if (round > 1) bullet(x, y, aimed(x, y), sk(40, BK_PINK))
  killed++
  killWorth = killWorth + WORTH[kind]
  killX = x
  killY = y
  sfxKill(big)
}

/** The two pebbles just made fly apart. */
function pebbleThrow(): void {
  let k: u16 = F_N
  let n: u16 = 0
  while (k > 0 && n < 2) {
    k--
    if (fK[k] === K_PEBBLE && fT[k] === 0) {
      fVX[k] = u16(n === 0 ? -20 : 20)
      fVY[k] = 30
      n++
    }
  }
}

/** Clears what a frame's kills came to. */
export function killsReset(): void {
  killed = 0
  killWorth = 0
}

/* ---------------- the script ---------------- */

let scriptAt: u16 = 0

export function scriptStart(): void {
  scriptAt = STAGE_SCRIPT_AT
}

/** Sends what the script has for rows the stage has reached: answers a command for the game. */
export function scriptStep(): u16 {
  const old = bank(STAGE_SCRIPT_BANK)
  let cmd: u16 = 0
  for (;;) {
    const row = peek16(scriptAt)
    if (row === 0xffff || !reached(row)) break
    const kind = peek16(scriptAt + 2)
    const x = peek16(scriptAt + 4)
    const p = peek16(scriptAt + 6)
    scriptAt = scriptAt + 8
    if (kind < C_SPEED) foe(kind, i16(x), spawnY(p), p & 255)
    else if (kind === C_PICKUP) item(p === 0 ? IT_BOMB : IT_LIFE, i16(x) * 16, 0)
    else {
      cmd = kind
      scriptArg = x
      scriptArg2 = p
      break
    }
  }
  bank(old)
  return cmd
}

export let scriptArg: u16 = 0
export let scriptArg2: u16 = 0

/** Where a foe comes in: the script's row (`p`'s high byte), or just above the screen. */
function spawnY(p: u16): i16 {
  return p >> 8 !== 0 ? i16(p >> 8) : -16
}

export const CMD_SPEED = C_SPEED
export const CMD_MIDBOSS = C_MIDBOSS
export const CMD_BOSS = C_BOSS

import { sfxKill } from './audio.e16'
import { bossBomb, bossHit, bossLance } from './boss.e16'
import { overdriveOn } from './eleclance.e16'
