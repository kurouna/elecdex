// ELECFIGHTER's data (docs/elec16-elecfighter-design.md 3, 4, 7.7, 11): the registries of the
// fighters' slots and of the stages - a line each, the only place a slot or a stage is named -
// and the reading of their tables. Everything else asks by number; no code branches on a slot
// or a stage. In RAM: it moves the window to read the cartridge's tables.
import {
  addr,
  type bool,
  i16,
  memcpy,
  mulShift,
  peek16,
  poke16,
  str,
  u16,
  words,
} from '../../../../../src/shared/e16c/builtins'
import {
  BG0X,
  bank,
  IO_BANK,
  load,
  mapRow,
  palette,
  palKeep,
  RASTER,
  raster,
  raster_lines,
} from '../../lib/kit.e16'
import {
  GRID_H,
  GRID_MAP_BANK,
  GRID_TILE,
  GRID_TILES_AT,
  GRID_TILES_BANK,
  GRID_TILES_BYTES,
  OPPONENTS_AT,
  OPPONENTS_BANK,
  PATTERNS_AT,
  PATTERNS_BANK,
  S1_ART_AT,
  S1_ART_BANK,
  S1_BANK,
  S1_MOVES_AT,
  S1_MOVES_BANK,
  S1_POSES_AT,
  S1_POSES_BANK,
  S1_PROFILE_AT,
  S1_PROFILE_BANK,
  S1_TILE,
  S2_ART_AT,
  S2_ART_BANK,
  S2_BANK,
  S2_MOVES_AT,
  S2_MOVES_BANK,
  S2_POSES_AT,
  S2_POSES_BANK,
  S2_PROFILE_AT,
  S2_PROFILE_BANK,
  S3_ART_AT,
  S3_ART_BANK,
  S3_BANK,
  S3_MOVES_AT,
  S3_MOVES_BANK,
  S3_POSES_AT,
  S3_POSES_BANK,
  S3_PROFILE_AT,
  S3_PROFILE_BANK,
  S4_ART_AT,
  S4_ART_BANK,
  S4_BANK,
  S4_MOVES_AT,
  S4_MOVES_BANK,
  S4_POSES_AT,
  S4_POSES_BANK,
  S4_PROFILE_AT,
  S4_PROFILE_BANK,
  STAGE_GRID_AT,
  STAGE_GRID_BANK,
  WEIGHTS_AT,
  WEIGHTS_BANK,
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
export const M_INVUL = 13
export const M_POSE = 14
const MOVE_W = 16
export const MOVES = 13
/** The throw's row (design 7.9): the last. */
export const MV_THROW = 12

/** A move's height (column 10) and kind's bits (column 11), its flags (column 12). */
export const H_HIGH = 1
export const H_LOW = 2
export const H_MID = 3
export const H_THROW = 4
export const K_KICK = 1
export const K_HEAVY = 2
export const K_CROUCH = 4
export const F_CHAIN = 1
export const F_KNOCKDOWN = 2
export const F_ANTIAIR = 4

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
export const P_THROW = 8
export const P_DASH_F = 10
export const P_DASH_V = 11
export const P_BACK_F = 12
export const P_BACK_V = 13
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
/** Each slot's art: its rows' cells and places (art.txt), and the bank its cells begin in. */
const slArtB = words(4)
const slArtA = words(4)
const slCellsB = words(4)

/** The slots' tables and names. */
export function slotsIn(): void {
  slotTables(0, S1_MOVES_BANK, S1_MOVES_AT, S1_POSES_BANK)
  slotPlaces(0, S1_POSES_AT, S1_PROFILE_BANK, S1_PROFILE_AT)
  slotArt(0, S1_ART_BANK, S1_ART_AT, S1_BANK)
  slName[0] = str('S1 BALANCE')
  slotTables(1, S2_MOVES_BANK, S2_MOVES_AT, S2_POSES_BANK)
  slotPlaces(1, S2_POSES_AT, S2_PROFILE_BANK, S2_PROFILE_AT)
  slotArt(1, S2_ART_BANK, S2_ART_AT, S2_BANK)
  slName[1] = str('S2 RUSH')
  slotTables(2, S3_MOVES_BANK, S3_MOVES_AT, S3_POSES_BANK)
  slotPlaces(2, S3_POSES_AT, S3_PROFILE_BANK, S3_PROFILE_AT)
  slotArt(2, S3_ART_BANK, S3_ART_AT, S3_BANK)
  slName[2] = str('S3 POWER')
  slotTables(3, S4_MOVES_BANK, S4_MOVES_AT, S4_POSES_BANK)
  slotPlaces(3, S4_POSES_AT, S4_PROFILE_BANK, S4_PROFILE_AT)
  slotArt(3, S4_ART_BANK, S4_ART_AT, S4_BANK)
  slName[3] = str('S4 OUTBOX')
}

function slotTables(k: u16, mb: u16, ma: u16, pb: u16): void {
  slMovesB[k] = mb
  slMovesA[k] = ma
  slPosesB[k] = pb
}

function slotArt(k: u16, ab: u16, aa: u16, cb: u16): void {
  slArtB[k] = ab
  slArtA[k] = aa
  slCellsB[k] = cb
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

/**
 * Fighter `i` takes slot `s`: its moves and profile into RAM, each table a block copied under
 * one bank (a match begins inside a frame: design 10.4).
 */
export function fighterLoad(i: u16, s: u16): void {
  let old = bank(slMovesB[s])
  memcpy(addr(mv) + i * MOVES * MOVE_W * 2, slMovesA[s], MOVES * MOVE_W * 2)
  poke16(IO_BANK, old)
  old = bank(slProfB[s])
  memcpy(addr(pr) + i * PROF_W * 2, slProfA[s], PROF_W * 2)
  poke16(IO_BANK, old)
  boxPose[i] = 0xffff
  reachLoad(i, s)
}

/** How far ahead of its feet each of fighter `i`'s moves reaches, in points (the CPU's measure). */
export const reach = words(26)

/** Each move's reach: the far edge of its first hit box in its active pose (the row's pose + 1). */
function reachLoad(i: u16, s: u16): void {
  const old = bank(slPosesB[s])
  let m: u16 = 0
  while (m < MOVES) {
    const p = mvAt(i, m, M_POSE) + 1
    const from = slPosesA[s] + (p * POSE_W + 16) * 2
    reach[i * MOVES + m] = peek16(from) + peek16(from + 4)
    m++
  }
  poke16(IO_BANK, old)
}

/**
 * Fighter `i` (of slot `s`) in pose `p`: its boxes and its picture read, if they are another
 * pose's.
 */
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
  if (artHold[i] === 0) artCopy(i, s, p)
}

/**
 * `n` words of slot `s`'s poses from word `at` (pose p's word w at p * POSE_W + w: the body box
 * 0-3, hurt boxes 4-15, hit boxes 16-23), copied to `to` under one bank: the CPU measures
 * reaches by them (ai.e16.ts).
 */
export function poseWords(s: u16, at: u16, n: u16, to: u16): void {
  const old = bank(slPosesB[s])
  memcpy(to, slPosesA[s] + at * 2, n * 2)
  poke16(IO_BANK, old)
}

/* ---------------- the pictures (design 2.2, 2.4): a room of 32 cells each ---------------- */

/**
 * Each fighter's room is 32 cells of 4 tiles from S1_TILE (the first sheet's `stream` of 64
 * keeps both rooms): P1's first, P2's after it. A row of art.txt: first cell, count, 32 places.
 * The KO's pieces are the rows after the poses, cut from the pose the fighter breaks in: lying
 * down, then falling (scripts/elecfighter/fighters.mjs).
 */
export const ART_W = 34
export const SHARDS_ROW = 61
export const SHARDS_AIR = 62
/** Each fighter's picture row (`art[i * 34 + c]`), and whether its cells wait to be copied. */
export const art = words(68)
export const artWant = words(2)
/** 1 while a fighter's picture is held (its KO pieces): a pose changes only its boxes. */
export const artHold = words(2)

/** Fighter `i`'s picture becomes row `row` of slot `s`'s art: copied into its room next frame. */
export function artCopy(i: u16, s: u16, row: u16): void {
  const old = bank(slArtB[s])
  const from = slArtA[s] + row * ART_W * 2
  let k: u16 = 0
  while (k < ART_W) {
    art[i * ART_W + k] = peek16(from + k * 2)
    k++
  }
  poke16(IO_BANK, old)
  artWant[i] = s + 1
}

/**
 * As a frame begins, just after `sprShow` (design 8): each picture chosen last frame streamed
 * into its fighter's room with one `load`, so it shows with the sprites made for it. A sheet
 * holds 64 cells a bank, from a bank's start.
 */
export function artStream(): void {
  let i: u16 = 0
  while (i < 2) {
    if (artWant[i] !== 0) {
      const f = art[i * ART_W]
      const b = slCellsB[artWant[i] - 1] + (f >> 6)
      load(b, 0xc000 + ((f & 63) << 7), (S1_TILE + i * 128) * 32, art[i * ART_W + 1] * 128)
      artWant[i] = 0
    }
    i++
  }
}

/**
 * Row `row` of slot `s`'s art (34 words) into RAM at `to`, and its cells into video memory from
 * tile `tile` at once: the screens round the fight draw a figure where they like (the title's
 * four, the select's, the versus's two), not in a fighter's room as the frame begins.
 */
export function artPut(s: u16, row: u16, to: u16, tile: u16): void {
  const old = bank(slArtB[s])
  memcpy(to, slArtA[s] + row * ART_W * 2, ART_W * 2)
  poke16(IO_BANK, old)
  const f = peek16(to)
  load(slCellsB[s] + (f >> 6), 0xc000 + ((f & 63) << 7), tile * 32, peek16(to + 2) * 128)
}

/**
 * Word `k` of a table in the cartridge (bank `b`, at `at`): for the screens in banks to read one.
 */
export function tableWord(b: u16, at: u16, k: u16): u16 {
  const old = bank(b)
  const v = peek16(at + k * 2)
  poke16(IO_BANK, old)
  return v
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

/**
 * A stage's numbers (stage.txt): palette row, music, horizon, ground, raster, the camera its map
 * is drawn for, the raster's last line; the 36 bands' share of the camera's move (16ths); the
 * floor's lines' (256ths), from the horizon to the last.
 */
const S_PALETTE = 0
const S_MUSIC = 1
const S_HORIZON = 2
const S_GROUND = 3
const S_RASTER = 4
const S_CENTER = 5
const S_LAST = 6
const S_BANDS = 7
const S_LINES = 43
const LINES_MAX = 120
/** S_LINES + LINES_MAX: `words` takes a number written out. */
const S_WORDS = 163
const stageWords = words(163)
/** The stage the round is on, and its feet's line on the screen (the fighters, shadows, sparks). */
export let stageNow: u16 = 0
export let groundY: u16 = 244

/**
 * The raster's tables for the next frame (design 8: made after the camera, shown as the next
 * frame begins, with the sprites made against the same camera): the bands, copied into the
 * runtime's, and the floor's lines in two halves - the one drawn and the one being made.
 */
const bandNext = words(36)
const lineTab = words(240)
let lineBack: u16 = 0
/** The camera the tables were last made for, and whether they wait to be shown. */
let scrollCam: u16 = 0xffff
let scrollMade: bool = false
/** BG0X at the frame's top: the first band's, or the camera's for a stage without a raster. */
let scrollTop: u16 = 0

/**
 * Stage `k` into BG0: its numbers, its palette in slot 0, its tiles, its map's rows, its raster.
 */
export function stageLoad(k: u16): void {
  stageNow = k
  raster(0)
  const old = bank(stDataB[k])
  memcpy(addr(stageWords), stDataA[k], S_WORDS * 2)
  poke16(IO_BANK, old)
  groundY = stageWords[S_GROUND]
  palette(stageWords[S_PALETTE], 0)
  palKeep(stageWords[S_PALETTE], 0)
  load(stTilesB[k], stTilesA[k], stTile[k] * 32, stTilesN[k])
  let y: u16 = 0
  while (y < stRows[k]) {
    mapRow(stMapB[k], 0xc000 + y * 128, 0, y)
    y++
  }
  // Made and shown for the camera in the middle, where a round begins, before the LINE goes on.
  scrollCam = 0xffff
  poke16(BG0X, stageScroll(stageWords[S_CENTER]))
  stageShow()
  raster(stageWords[S_RASTER])
}

/**
 * The raster's tables for camera `cam` (design 4.1): each band and each floor line at the
 * stage's centre plus its share of the camera's move from there. Made only when the camera
 * moved. Answers BG0X for the frame's top.
 */
export function stageScroll(cam: u16): u16 {
  if (cam === scrollCam) return scrollTop
  scrollCam = cam
  const c = stageWords[S_CENTER]
  if (stageWords[S_RASTER] === 0) {
    scrollTop = cam
    return cam
  }
  const d = i16(cam - c)
  let k: u16 = 0
  while (k < 36) {
    bandNext[k] = (c + u16(mulShift(d, i16(stageWords[S_BANDS + k]), 4))) & 511
    k++
  }
  const n = stageLines()
  const t = lineBack
  k = 0
  while (k < n) {
    lineTab[t + k] = (c + u16(mulShift(d, i16(stageWords[S_LINES + k]), 8))) & 511
    k++
  }
  scrollMade = true
  scrollTop = bandNext[0]
  return scrollTop
}

/** The floor's lines a stage's raster writes: from the horizon to the last, at most 120. */
function stageLines(): u16 {
  if (stageWords[S_RASTER] !== 2) return 0
  return stageWords[S_LAST] + 1 - stageWords[S_HORIZON]
}

/** As a frame begins: the tables made in the last one, drawn from this one. */
export function stageShow(): void {
  if (!scrollMade) return
  scrollMade = false
  memcpy(RASTER, addr(bandNext), 72)
  if (stageWords[S_RASTER] !== 2) return
  raster_lines(addr(lineTab) + lineBack * 2, stageWords[S_HORIZON], stageWords[S_LAST])
  lineBack = LINES_MAX - lineBack
}

/** The song the stage is fought to (engine/audio.e16.ts's number). */
export function stageMusic(): u16 {
  return stageWords[S_MUSIC]
}

/** BG0's clear tile, while no stage is shown: a map's first tile is its clear one. */
export function stageClearTile(): u16 {
  return stTile[0]
}

/* ---------------- the CPU's opponents (cpu/opponents.txt) ---------------- */

export const O_SLOT = 0
export const O_STAGE = 1
export const O_THINK = 2
export const O_R_GUARD = 3
export const O_R_AA = 4
export const O_R_PUNISH = 5
export const O_R_TECH = 6
export const O_R_SWITCH = 7
export const O_GUARD = 8
export const O_AA = 9
export const O_PUNISH = 10
export const O_READ = 11
export const O_RANGE = 12
export const O_WIDTH = 13
export const O_APPROACH = 14
export const O_RETREAT = 15
export const O_CHAIN = 16
export const O_WAKE = 17
export const O_PATTERN = 18
export const O_HABIT = 19
export const O_TRIG_MIN = 20
export const O_TRIG_MAX = 21
export const O_EVENT = 22
export const O_WHIM = 23
export const O_FLAGS = 24
export const O_WEIGHTS = 25
export const OW = 32
export const OPPONENTS = 5
/** The flags (column 24); 2 and 8 are kept for later. */
export const OF_FEINT = 1
export const OF_TURTLE = 4
export const OF_MIRROR = 16
export const OF_KEEP = 32
/** Reactions are never quicker than this (design 7.10.1), a tech's than its own. */
const REACT_MIN = 8
const TECH_MIN = 4
/** A beaten opponent's worth of reading: a tenth of 256. */
const READ_STEP = 26

/** Each CPU fighter's row, as met: `opp[i * OW + c]`. */
export const opp = words(64)

/**
 * Fighter `i` plays opponent `k`'s row, as the `pos`th of the ladder (0 first): quicker, reading
 * more.
 */
export function oppLoad(i: u16, k: u16, pos: u16): void {
  const old = bank(OPPONENTS_BANK)
  let c: u16 = 0
  while (c < OW) {
    opp[i * OW + c] = peek16(OPPONENTS_AT + (k * OW + c) * 2)
    c++
  }
  poke16(IO_BANK, old)
  c = O_R_GUARD
  while (c <= O_R_SWITCH) {
    const least = c === O_R_TECH ? TECH_MIN : REACT_MIN
    const r = opp[i * OW + c]
    opp[i * OW + c] = r >= least + pos * 2 ? r - pos * 2 : least
    c++
  }
  // One that never reads (0) learns no reading by its place: only a reader reads more.
  const r = opp[i * OW + O_READ]
  if (r === 0) return
  const read = r + pos * READ_STEP
  opp[i * OW + O_READ] = read > 255 ? 255 : read
}

/** Opponent `k`'s column `c`, as the table has it (the ladder reads slots and flags). */
export function oppWord(k: u16, c: u16): u16 {
  const old = bank(OPPONENTS_BANK)
  const v = peek16(OPPONENTS_AT + (k * OW + c) * 2)
  poke16(IO_BANK, old)
  return v
}

/** The weights the CPU draws from (weights.txt): fighter `i`'s for a band and a situation. */
export const wrow = words(10)
export function weightsLoad(i: u16, band: u16, sit: u16): void {
  const old = bank(WEIGHTS_BANK)
  const from = WEIGHTS_AT + (opp[i * OW + O_WEIGHTS] * 18 + band * 6 + sit) * 10 * 2
  let k: u16 = 0
  while (k < 10) {
    wrow[k] = peek16(from + k * 2)
    k++
  }
  poke16(IO_BANK, old)
}

/** Word `k` of pattern `p` (patterns.txt). */
export function patternWord(p: u16, k: u16): u16 {
  const old = bank(PATTERNS_BANK)
  const v = peek16(PATTERNS_AT + (p * 8 + k) * 2)
  poke16(IO_BANK, old)
  return v
}

/** Each opponent's name, as the ladder shows it: a line each, by the table's row. */
export const oppName = words(5)
export function oppNamesIn(): void {
  oppName[0] = str('PACKET')
  oppName[1] = str('MAINFRAME')
  oppName[2] = str('DAEMON')
  oppName[3] = str('KERNEL')
  oppName[4] = str('ROOT')
}
