// RIVET, ELECDRILL's driller (docs/elec16-elecdrill.md sections 3 and 6): walks, climbs a step,
// falls, drills left, right, down and up, and is crushed or runs out of air. The driller stands
// in a cell; moves between cells are animated a point or two a frame.
import { type bool, i16, type u16, wrap16 } from '../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_DOWN,
  B_LEFT,
  B_RIGHT,
  B_UP,
  FLIP_H,
  held,
  pressed,
  S16,
  spr,
} from '../lib/kit.e16'
import { BIT_TILE, DRILLER_TILE } from './assets.e16'
import { sfxClank, sfxClink, sfxDig, sfxLand, sfxSwing } from './audio.e16'
import { cellClear, chainNew, groupOf, targetIs, vanish } from './fall.e16'
import {
  ALLOY_HITS,
  COLS,
  cellOf,
  cells,
  F_LOOSE,
  F_PEND,
  FIELD_X,
  markAround,
  T_AIR,
  T_ALLOY,
  T_CORE,
  T_EMPTY,
  T_WALL,
} from './field.e16'
import { dust, sparks } from './fx.e16'

export const P_STAND = 0
export const P_WALK = 1
export const P_CLIMB = 2
export const P_FALL = 3
export const P_DIG = 4
export const P_LAND = 5
export const P_CRUSH = 6
export const P_GASP = 7
export const P_CHEER = 8

/** Where the driller is: its cell, and its place in points (x in the well, y from row 0). */
export let pCol: u16 = 4
export let pRow: u16 = 5
export let pX: u16 = 64
export let pY: u16 = 80
export let pState: u16 = P_STAND
let pT: u16 = 0
/** 0 facing right, 1 left. */
export let pFace: u16 = 0
/** The way it drills: 0 right, 1 left, 2 down, 3 up. */
let pDir: u16 = 0
let pTo: u16 = 0
let pSpeed: u16 = 0
let pPush: u16 = 0
let pIdle: u16 = 0
/** Frames left of the time after coming back, when nothing can crush it (it blinks). */
export let pSafe: u16 = 0

/** AIR, 0-100, and the frames to a unit of it. */
export let air: u16 = 100
let airSub: u16 = 0
let airDrain: u16 = 60

/** This frame's news, for the score and the sound: blocks dug, ALLOY broken, capsules caught. */
export let dugN: u16 = 0
export let alloyBroken: u16 = 0
export let capsuleN: u16 = 0
export let capsules: u16 = 0

export function playerNew(): void {
  pCol = 4
  pRow = 5
  pX = 64
  pY = 80
  pState = P_STAND
  pT = 0
  pFace = 0
  air = 100
  airSub = 0
  pSafe = 0
  capsules = 0
}

export function airPace(drain: u16): void {
  airDrain = drain
}

export function airAdd(n: u16): void {
  air = air + n > 100 ? 100 : air + n
}

/** AIR spent (a broken ALLOY); none is left at 0. */
export function airLose(n: u16): void {
  air = air > n ? air - n : 0
}

export function alive(): bool {
  return pState < P_CRUSH
}

/** The driller's cell, for falling blocks; while it is safe, none. */
function aim_(): void {
  if (pSafe > 0 || !alive()) {
    targetIs(0xffff)
    return
  }
  let col = pCol
  let row = pRow
  // Half way through a move it is in the cell it is going to.
  if (pState === P_WALK && pT >= 4) col = pTo
  if (pState === P_CLIMB && pT >= 8) row = pRow - 1
  if (pState === P_FALL && (pY & 15) >= 8) row = pRow + 1
  targetIs(cellOf(col, row))
}

/** A frame of the driller: input, moving, drilling, air. */
export function playerStep(now: u16, frozen: bool): void {
  dugN = 0
  alloyBroken = 0
  capsuleN = 0
  if (pSafe > 0) pSafe--
  if (frozen) {
    pT++
    return
  }
  const s = pState
  if (s === P_STAND) stand()
  else if (s === P_WALK) walk()
  else if (s === P_CLIMB) climb()
  else if (s === P_FALL) fall()
  else if (s === P_DIG) dig(now)
  else if (s === P_LAND) {
    pT++
    if (pT >= 6) pState = P_STAND
  } else pT++
  if (alive() && s !== P_CHEER) breathe()
  aim_()
}

function breathe(): void {
  airSub++
  if (airSub < airDrain) return
  airSub = 0
  if (air > 0) air--
  if (air === 0) {
    pState = P_GASP
    pT = 0
  }
}

/** What is in the cell at (col, row): a column off the well is wall. */
function at(col: u16, row: u16): u16 {
  if (col >= COLS) return T_WALL
  return cells[cellOf(col, row)]
}

function stand(): void {
  pT++
  pIdle++
  if (!standsOn()) {
    startFall()
    return
  }
  if (digWanted()) return
  const left = held(B_LEFT)
  if (!left && !held(B_RIGHT)) {
    pPush = 0
    return
  }
  pIdle = 0
  pFace = left ? 1 : 0
  if (left && pCol === 0) return
  step(left ? pCol - 1 : pCol + 1)
}

/** A is the drill (down with down held, up with up), B the drill down; held, they go on. */
function digWanted(): bool {
  if (pressed(B_A) || (held(B_A) && pT > 10)) {
    startDig(held(B_DOWN) ? 2 : held(B_UP) ? 3 : pFace)
    return true
  }
  if (pressed(B_B) || (held(B_B) && pT > 10)) {
    startDig(2)
    return true
  }
  return false
}

/** A step to column `to`: walk into an empty cell (catching a capsule), or up a step. */
function step(to: u16): void {
  const v = at(to, pRow)
  if ((v & 15) === T_AIR && (v & (F_LOOSE | F_PEND)) === 0) collect(cellOf(to, pRow))
  if ((at(to, pRow) & 15) === T_EMPTY) {
    pTo = to
    pState = P_WALK
    pT = 0
    pPush = 0
    return
  }
  // Pushing on a block one high, with room above it and above the driller: up the step.
  pPush++
  const up = wrap16(pRow - 1)
  if (pPush >= 8 && (at(to, up) & 15) === T_EMPTY && (at(pCol, up) & 15) === T_EMPTY) {
    pTo = to
    pState = P_CLIMB
    pT = 0
    pPush = 0
  }
}

/** Whether there is something under the driller (a capsule is caught as it falls past it). */
function standsOn(): bool {
  const below = cellOf(pCol, pRow + 1)
  const v = cells[below]
  if ((v & 15) === T_AIR && (v & (F_LOOSE | F_PEND)) === 0) {
    collect(below)
    return false
  }
  return (v & 15) !== T_EMPTY
}

function startFall(): void {
  pState = P_FALL
  pT = 0
  pSpeed = 1
}

function walk(): void {
  pT++
  if (pTo > pCol) pX = pX + 2
  else pX = pX - 2
  if (pT < 8) return
  pCol = pTo
  pX = pCol * 16
  pState = P_STAND
  pT = 11
  if ((pIdle & 1) === 0) dust(i16(FIELD_X + pX) + (pFace === 0 ? -2 : 18), i16(pY) + 14, 0)
  pIdle++
}

function climb(): void {
  pT++
  if (pT <= 8) pY = pY - 2
  else if (pTo > pCol) pX = pX + 2
  else pX = pX - 2
  if (pT < 16) return
  pCol = pTo
  pRow = pRow - 1
  pX = pCol * 16
  pY = pRow * 16
  pState = P_STAND
  pT = 11
}

function fall(): void {
  pT++
  if ((pT & 3) === 0 && pSpeed < 4) pSpeed++
  const next = (pRow + 1) * 16
  const step = next - pY < pSpeed ? next - pY : pSpeed
  pY = pY + step
  if (pY < next) return
  pRow++
  if (standsOn()) {
    pY = pRow * 16
    pState = P_LAND
    pT = 0
    sfxLand()
    dust(i16(FIELD_X + pX) + 2, i16(pY) + 14, 0)
    dust(i16(FIELD_X + pX) + 14, i16(pY) + 14, 0)
  }
}

/* ---------------- drilling ---------------- */

function startDig(dir: u16): void {
  pDir = dir
  if (dir < 2) pFace = dir
  pState = P_DIG
  pT = 0
  pIdle = 0
}

/** The cell the drill is aimed at. */
function aimed(): u16 {
  const col = pDir === 0 ? pCol + 1 : pDir === 1 ? pCol - 1 : pCol
  const row = pDir === 2 ? pRow + 1 : pDir === 3 ? pRow - 1 : pRow
  if (col >= COLS) return 0xffff
  return cellOf(col, row)
}

function dig(now: u16): void {
  pT++
  if (pT === 3) bite(now)
  if (pT >= 10) {
    pState = P_STAND
    pT = 0
  }
}

/** The drill bites: a group of a colour goes, ALLOY takes a hit, a capsule is caught. */
function bite(now: u16): void {
  const c = aimed()
  const v = c === 0xffff ? T_EMPTY : cells[c]
  const t = v & 15
  const x = i16(FIELD_X + pX + (pDir === 0 ? 16 : pDir === 1 ? 0 : 8))
  const y = i16(pY + (pDir === 2 ? 16 : pDir === 3 ? 0 : 8))
  if (t === T_EMPTY) sfxSwing()
  else if ((v & (F_LOOSE | F_PEND)) !== 0 || t === T_CORE || t === T_WALL) {
    sfxClink()
    sparks(x, y, 2)
  } else if (t === T_AIR) collect(c)
  else if (t === T_ALLOY) alloyHit(c, now, x, y)
  else {
    chainNew()
    const n = groupOf(c)
    vanish(n, now + 1, 1)
    dugN = n
    sfxDig()
    dust(x, y, 1)
  }
}

/** ALLOY takes a hit (its cracks deeper); the fourth breaks it, for a fifth of the AIR. */
function alloyHit(c: u16, now: u16, x: i16, y: i16): void {
  const v = cells[c]
  const hits = ((v >> 4) & 3) + 1
  sparks(x, y, 4)
  sfxClank()
  if (hits >= ALLOY_HITS) {
    groupOf(c)
    vanish(1, now, 0)
    alloyBroken = 1
    airLose(20)
    return
  }
  cells[c] = (v & 0xcf) | (hits << 4)
  markAround(c)
}

/** A capsule caught: AIR back, the cell empty. */
function collect(c: u16): void {
  cellClear(c)
  capsuleN++
  capsules++
  airAdd(20)
}

/** A capsule fell on the driller. */
export function caughtFalling(): void {
  capsuleN++
  capsules++
  airAdd(20)
}

/* ---------------- dying and coming back ---------------- */

export function crushed(): void {
  pState = P_CRUSH
  pT = 0
}

/** Whether the driller's last moment is over. */
export function deathDone(): bool {
  return (pState === P_CRUSH && pT >= 100) || (pState === P_GASP && pT >= 130)
}

/** Back where it fell: the cells over it cleared, AIR full, a moment safe. */
export function comeBack(): void {
  let k: u16 = 0
  while (k < 3) {
    const c = cellOf(pCol, pRow - k)
    const t = cells[c] & 15
    if (t !== T_CORE && t !== T_WALL && t !== T_EMPTY) cellClear(c)
    k++
  }
  pY = pRow * 16
  pX = pCol * 16
  pState = P_STAND
  pT = 0
  air = 100
  airSub = 0
  pSafe = 150
}

export function cheer(): void {
  pState = P_CHEER
  pT = 0
}

/* ---------------- drawing ---------------- */

/** The driller and its drill's bit on the screen, the well's top at `camY` points. */
export function playerDraw(camY: u16, frame: u16): void {
  if (pSafe > 0 && (frame & 4) !== 0) return
  const x = i16(FIELD_X + pX)
  const y = i16(pY - camY)
  const flip = pFace === 1 ? FLIP_H : 0
  const f = frameNow(frame)
  if (pState === P_DIG && pT >= 2 && pT < 9) bitDraw(x, y, flip)
  spr(x, y, (DRILLER_TILE + f * 4) | flip, S16)
}

function bitDraw(x: i16, y: i16, flip: u16): void {
  const spin = (pT >> 1) & 1
  const pal = 6 << 10
  if (pDir < 2) spr(x + (pDir === 0 ? 13 : -13), y, (BIT_TILE + spin * 4) | pal | flip, S16)
  else if (pDir === 2) spr(x, y + 13, (BIT_TILE + 8 + spin * 4) | pal, S16)
  else spr(x, y - 13, (BIT_TILE + 16 + spin * 4) | pal, S16)
}

/** The frame of the sheet for now (driller.mjs's order). */
function frameNow(frame: u16): u16 {
  const s = pState
  if (s === P_WALK) return 2 + ((pT >> 1) & 3)
  if (s === P_FALL) return 12
  if (s === P_CLIMB) return 14 + ((pT >> 2) & 1)
  if (s === P_DIG) return digFrame()
  if (s === P_LAND) return 13
  if (s === P_CRUSH) return 16 + ((pT >> 3) & 1)
  if (s === P_GASP) return pT > 90 ? 20 : 18 + ((pT >> 3) & 1)
  if (s === P_CHEER) return 21 + ((pT >> 4) & 1)
  // Standing: a blink now and then.
  return (frame & 127) < 6 ? 1 : 0
}

/** Drilling: the drill out to the side, down or up, shuddering. */
function digFrame(): u16 {
  const shake = (pT >> 1) & 1
  if (pDir < 2) return 6 + shake
  return pDir === 2 ? 8 + shake : 10 + shake
}
