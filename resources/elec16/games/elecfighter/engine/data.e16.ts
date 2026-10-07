// ELECFIGHTER's data (docs/elec16-elecfighter-design.md 3, 4, 7.7, 11): the registries of the
// fighters' slots and of the stages - a line each, the only place a slot or a stage is named -
// and the reading of their tables. Everything else asks by number; no code branches on a slot
// or a stage. In RAM: it moves the window to read the cartridge's tables.
import { peek16, poke16, str, type u16, words } from '../../../../../src/shared/e16c/builtins'
import { BG0X, bank, IO_BANK, load, mapRow, palette, palKeep, RASTER } from '../../lib/kit.e16'
import {
  GRID_H,
  GRID_MAP_BANK,
  GRID_TILE,
  GRID_TILES_AT,
  GRID_TILES_BANK,
  GRID_TILES_BYTES,
  OPPONENTS_AT,
  OPPONENTS_BANK,
  S1_MOVES_AT,
  S1_MOVES_BANK,
  S1_POSES_AT,
  S1_POSES_BANK,
  S1_PROFILE_AT,
  S1_PROFILE_BANK,
  S2_MOVES_AT,
  S2_MOVES_BANK,
  S2_POSES_AT,
  S2_POSES_BANK,
  S2_PROFILE_AT,
  S2_PROFILE_BANK,
  S3_MOVES_AT,
  S3_MOVES_BANK,
  S3_POSES_AT,
  S3_POSES_BANK,
  S3_PROFILE_AT,
  S3_PROFILE_BANK,
  S4_MOVES_AT,
  S4_MOVES_BANK,
  S4_POSES_AT,
  S4_POSES_BANK,
  S4_PROFILE_AT,
  S4_PROFILE_BANK,
  STAGE_GRID_AT,
  STAGE_GRID_BANK,
} from '../assets.e16'

/** A move's row (moves.txt): its columns. */
export const M_STARTUP = 0
export const M_ACTIVE = 1
export const M_RECOVERY = 2
export const M_DAMAGE = 3
export const M_HITSTUN = 5
export const M_BLOCKSTUN = 6
export const M_HITSTOP = 7
export const M_PUSH_HIT = 8
export const M_PUSH_GUARD = 9
export const M_HEIGHT = 10
export const M_KIND = 11
export const M_FLAGS = 12
export const M_POSE = 14
const MOVE_W = 16
export const MOVES = 13

/** A move's height (column 10) and kind's bits (column 11), its flags (column 12). */
export const H_HIGH = 1
export const H_LOW = 2
export const H_MID = 3
export const K_KICK = 1
export const K_HEAVY = 2
export const F_CHAIN = 1
export const F_KNOCKDOWN = 2

/** A pose's row (poses.txt): the body box, three hurt boxes, two hit boxes, 4 words each. */
export const POSE_W = 24
export const BOXES = 6

/** A slot's profile (profile.txt). */
export const P_LIFE = 0
export const P_WEIGHT = 1
export const P_WALK_F = 2
export const P_WALK_B = 3
export const P_JUMP = 4
export const P_GRAVITY = 5
export const P_JUMP_F = 6
export const P_JUMP_B = 7
const PROF_W = 16

/* ---------------- the registry of slots: a line each ---------------- */

export const SLOTS = 4
const slMovesB = words(4)
const slMovesA = words(4)
const slPosesB = words(4)
const slPosesA = words(4)
const slProfB = words(4)
const slProfA = words(4)
/** Each slot's number and role, as the HUD shows it. */
export const slName = words(4)

/** The slots' tables and names. */
export function slotsIn(): void {
  slotTables(0, S1_MOVES_BANK, S1_MOVES_AT, S1_POSES_BANK)
  slotPlaces(0, S1_POSES_AT, S1_PROFILE_BANK, S1_PROFILE_AT)
  slName[0] = str('S1 BALANCE')
  slotTables(1, S2_MOVES_BANK, S2_MOVES_AT, S2_POSES_BANK)
  slotPlaces(1, S2_POSES_AT, S2_PROFILE_BANK, S2_PROFILE_AT)
  slName[1] = str('S2 RUSH')
  slotTables(2, S3_MOVES_BANK, S3_MOVES_AT, S3_POSES_BANK)
  slotPlaces(2, S3_POSES_AT, S3_PROFILE_BANK, S3_PROFILE_AT)
  slName[2] = str('S3 POWER')
  slotTables(3, S4_MOVES_BANK, S4_MOVES_AT, S4_POSES_BANK)
  slotPlaces(3, S4_POSES_AT, S4_PROFILE_BANK, S4_PROFILE_AT)
  slName[3] = str('S4 OUTBOX')
}

function slotTables(k: u16, mb: u16, ma: u16, pb: u16): void {
  slMovesB[k] = mb
  slMovesA[k] = ma
  slPosesB[k] = pb
}

function slotPlaces(k: u16, pa: u16, fb: u16, fa: u16): void {
  slPosesA[k] = pa
  slProfB[k] = fb
  slProfA[k] = fa
}

/* ---------------- a fighter's tables in RAM ---------------- */

/** Each fighter's moves (13 rows of 16 words), copied when the match begins. */
export const mv = words(416)
/** Each fighter's profile (16 words). */
export const pr = words(32)
/** Each fighter's pose's boxes (24 words), copied when the pose changes. */
export const bx = words(48)
/** The pose each fighter's boxes are of. */
export const boxPose = words(2)

/** Fighter `i` takes slot `s`: its moves and profile into RAM. */
export function fighterLoad(i: u16, s: u16): void {
  copyIn(slMovesB[s], slMovesA[s], i * MOVES * MOVE_W, MOVES * MOVE_W)
  const old = bank(slProfB[s])
  let k: u16 = 0
  while (k < PROF_W) {
    pr[i * PROF_W + k] = peek16(slProfA[s] + k * 2)
    k++
  }
  poke16(IO_BANK, old)
  boxPose[i] = 0xffff
}

function copyIn(b: u16, at: u16, to: u16, n: u16): void {
  const old = bank(b)
  let k: u16 = 0
  while (k < n) {
    mv[to + k] = peek16(at + k * 2)
    k++
  }
  poke16(IO_BANK, old)
}

/** Fighter `i` (of slot `s`) in pose `p`: its boxes read, if they are another pose's. */
export function poseLoad(i: u16, s: u16, p: u16): void {
  if (boxPose[i] === p) return
  boxPose[i] = p
  const old = bank(slPosesB[s])
  const from = slPosesA[s] + p * POSE_W * 2
  let k: u16 = 0
  while (k < POSE_W) {
    bx[i * POSE_W + k] = peek16(from + k * 2)
    k++
  }
  poke16(IO_BANK, old)
}

/** Column `c` of fighter `i`'s move `m`. */
export function mvAt(i: u16, m: u16, c: u16): u16 {
  return mv[(i * MOVES + m) * MOVE_W + c]
}

/** Word `c` of fighter `i`'s profile. */
export function prAt(i: u16, c: u16): u16 {
  return pr[i * PROF_W + c]
}

/* ---------------- the registry of stages: a line each ---------------- */

export const STAGES = 1
const stTile = words(1)
const stTilesB = words(1)
const stTilesA = words(1)
const stTilesN = words(1)
const stMapB = words(1)
const stRows = words(1)
const stDataB = words(1)
const stDataA = words(1)

/** The stages' pictures and numbers. */
export function stagesIn(): void {
  stagePictures(0, GRID_TILE, GRID_TILES_BANK, GRID_TILES_AT)
  stagePlaces(0, GRID_TILES_BYTES, GRID_MAP_BANK, GRID_H)
  stDataB[0] = STAGE_GRID_BANK
  stDataA[0] = STAGE_GRID_AT
}

function stagePictures(k: u16, tile: u16, b: u16, at: u16): void {
  stTile[k] = tile
  stTilesB[k] = b
  stTilesA[k] = at
}

function stagePlaces(k: u16, n: u16, mapB: u16, rows: u16): void {
  stTilesN[k] = n
  stMapB[k] = mapB
  stRows[k] = rows
}

/** A stage's numbers (stage.txt): palette row, music, horizon, ground, raster, 36 bands. */
const S_PALETTE = 0
const S_RASTER = 4
const S_BANDS = 5
const stageWords = words(41)
/** The stage the round is on. */
export let stageNow: u16 = 0
/** The stage's 36 bands' parallax (16ths of the camera's move), for the raster. */
export function stageBand(k: u16): u16 {
  return stageWords[S_BANDS + k]
}
export function stageRaster(): u16 {
  return stageWords[S_RASTER]
}

/** Stage `k` into BG0: its numbers, its palette in slot 0, its tiles and its map's rows. */
export function stageLoad(k: u16): void {
  stageNow = k
  const old = bank(stDataB[k])
  let w: u16 = 0
  while (w < 41) {
    stageWords[w] = peek16(stDataA[k] + w * 2)
    w++
  }
  poke16(IO_BANK, old)
  palette(stageWords[S_PALETTE], 0)
  palKeep(stageWords[S_PALETTE], 0)
  load(stTilesB[k], stTilesA[k], stTile[k] * 32, stTilesN[k])
  let y: u16 = 0
  while (y < stRows[k]) {
    mapRow(stMapB[k], 0xc000 + y * 128, 0, y)
    y++
  }
  w = 0
  while (w < 36) {
    poke16(RASTER + w * 2, 0)
    w++
  }
  poke16(BG0X, 0)
}

/** BG0's clear tile, while no stage is shown: a map's first tile is its clear one. */
export function stageClearTile(): u16 {
  return stTile[0]
}

/* ---------------- the CPU's opponents ---------------- */

export const O_SLOT = 0
export const O_STAGE = 1
export const O_THINK = 2
export const O_ATTACK = 3
export const O_GUARD = 4
export const O_JUMP = 5
export const O_REACH = 6
const OPP_W = 8
/** The opponent met: its row. */
export const opp = words(8)

/** Opponent `k`'s row into `opp`. */
export function oppLoad(k: u16): void {
  const old = bank(OPPONENTS_BANK)
  let c: u16 = 0
  while (c < OPP_W) {
    opp[c] = peek16(OPPONENTS_AT + (k * OPP_W + c) * 2)
    c++
  }
  poke16(IO_BANK, old)
}
