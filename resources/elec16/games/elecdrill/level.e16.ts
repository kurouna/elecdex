// ELECDRILL's difficulty (docs/elec16-elecdrill.md section 4): EASY, NORMAL or HARD, each a row
// of difficulty.txt read into RAM when it is chosen on the title. A stratum's pace (AIR, the
// wobble, the fall) and ALLOY's share are asked of it; nothing else differs. In RAM: it moves
// the window to read the row.
import { peek16, poke16, type u16, words } from '../../../../src/shared/e16c/builtins'
import { bank, IO_BANK } from '../lib/kit.e16'
import { DIFFICULTY_AT, DIFFICULTY_BANK } from './assets.e16'

export const LV_EASY = 0
export const LV_NORMAL = 1
export const LV_HARD = 2

/** A row of difficulty.txt: its words in order. */
const D_AIR = 0
const D_AIR_STEP = 1
const D_WOBBLE = 2
const D_WOBBLE_STEP = 3
const D_FALL = 4
const D_ALLOY = 5
const D_ALLOY_STEP = 6
const ROW = 7

/** The difficulty chosen on the title, and its row. */
export let level: u16 = LV_NORMAL
const lv = words(7)

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

/** Frames to breathe a unit of AIR in stratum `s`. */
export function levelAir(s: u16): u16 {
  return lv[D_AIR] - s * lv[D_AIR_STEP]
}

/** Frames a loose group wobbles in stratum `s`. */
export function levelWobble(s: u16): u16 {
  return lv[D_WOBBLE] - s * lv[D_WOBBLE_STEP]
}

/** Quarter points a falling block moves a frame in stratum `s`. */
export function levelFall(s: u16): u16 {
  return lv[D_FALL] + s
}

/** ALLOY's chance in a hundred in stratum `s`. */
export function levelAlloy(s: u16): u16 {
  return lv[D_ALLOY] + s * lv[D_ALLOY_STEP]
}
