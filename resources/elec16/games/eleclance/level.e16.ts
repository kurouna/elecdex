// ELECLANCE's difficulty (docs/elec16-eleclance.md section 3): EASY, NORMAL or HARD, each a row
// of difficulty.txt read into RAM when it is chosen. Whatever fires a bullet asks here whether a
// volley goes, how many bullets it has and how fast they fly; ships, bombs and rank start here.
import {
  type bool,
  i16,
  mulShift,
  peek16,
  poke16,
  u16,
  words,
} from '../../../../src/shared/e16c/builtins'
import { bank, IO_BANK, randBelow } from '../lib/kit.e16'
import { DIFFICULTY_AT, DIFFICULTY_BANK } from './assets.e16'
import { rank } from './foes.e16'

export const LV_EASY = 0
export const LV_NORMAL = 1
export const LV_HARD = 2

/** A row of difficulty.txt: its words in order. */
const D_LIVES = 0
const D_BOMBS = 1
const D_RATE = 2
const D_BOSS = 3
const D_RISE = 4
const D_COUNT = 5
const D_SPEED = 6
const D_RANK = 7
const D_TOP = 8
const ROW = 9

/** The difficulty chosen on the title, and its row. */
export let level: u16 = LV_NORMAL
const lv = words(9)
/** Whether a boss is firing now: its volleys go by the row's `boss` share, not `rate`. */
let bossFiring: u16 = 0

/** Difficulty `l` (0-2; anything else is NORMAL) chosen: its row read from the cartridge. */
export function levelSet(l: u16): void {
  level = l > LV_HARD ? LV_NORMAL : l
  const old = bank(DIFFICULTY_BANK)
  let k: u16 = 0
  while (k < ROW) {
    lv[k] = peek16(DIFFICULTY_AT + (level * ROW + k) * 2)
    k++
  }
  poke16(IO_BANK, old)
}

export function levelLives(): u16 {
  return lv[D_LIVES]
}

export function levelBombs(): u16 {
  return lv[D_BOMBS]
}

export function levelRank(): u16 {
  return lv[D_RANK]
}

export function levelTop(): u16 {
  return lv[D_TOP]
}

/** A boss starts (1) or stops (0) firing: what fires meanwhile is the boss's. */
export function levelBoss(on: u16): void {
  bossFiring = on
}

/** A share in sixteenths at this rank: `base`, and `rise` quarters more a rank, to 16. */
function rising(base: u16): u16 {
  const v = base + u16(mulShift(i16(rank), i16(lv[D_RISE]), 2))
  return v > 16 ? 16 : v
}

/** Whether a volley fires: all of them at a share of 16, else that many sixteenths by chance. */
export function volleyGoes(): bool {
  const share = rising(lv[bossFiring ? D_BOSS : D_RATE])
  return share >= 16 || randBelow(16) < share
}

/** How many of a volley's `n` bullets fly, at least `least`. */
export function volleyCount(n: u16, least: u16): u16 {
  const share = rising(lv[D_COUNT])
  if (share >= 16) return n
  const v = (n * share + 8) >> 4
  if (v >= least) return v
  return n < least ? n : least
}

/** A bullet's speed `v` (sixteenths a frame) at this difficulty. */
export function volleySpeed(v: u16): u16 {
  return u16(mulShift(i16(v), i16(lv[D_SPEED]), 4))
}
