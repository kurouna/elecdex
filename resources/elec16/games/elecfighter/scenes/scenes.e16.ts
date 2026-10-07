// ELECFIGHTER's scenes round the fight (docs/elec16-elecfighter-design.md 5.3, 5.4, 6.1, 7.11):
// until P3 draws them, a plain title with the controls' table - SELECT switches the button set,
// TYPE A (the pad's diamond) or TYPE B (the kicks swapped for PC keys), A turns the log line on
// and off, both kept in save RAM - and START, which seeds chance from the machine's clock and
// the cycle counter. The pause's CONTROLS shows the same table. In bank 1: rarely run.
import { csrr, peek, str, type u16, wrap16 } from '../../../../../src/shared/e16c/builtins'
import {
  B_A,
  B_B,
  B_SELECT,
  B_START,
  pressed,
  randSeed,
  saveRead,
  saveWrite,
} from '../../lib/kit.e16'
import { hudClear, logOff, say } from '../engine/draw.e16'
import { buttonSet, buttonSetIs } from '../engine/input.e16'
import { frameBegin, pauseFrame, screenClear } from '../engine/main.e16'

/** Save RAM: a mark, then the button set, then the log (1 off). */
const SAVE_MARK = 0x4645
const SV_MARK = 0
const SV_SET = 2
const SV_LOG = 4
/** The machine's clock (seconds, minutes, hours, day, month, year, weekday): FF38-FF3E. */
const CLOCK = 0xff38
const CSR_CYCLE = 0xc00
const TL_TEXT = 1
const TL_DIM = 3

/** The button set and the log kept in save RAM, if there are. */
export function controlsLoad(): void {
  if (saveRead(SV_MARK) !== SAVE_MARK) return
  buttonSetIs(saveRead(SV_SET))
  logOff[0] = saveRead(SV_LOG) & 1
}

/** The title and the controls until START. */
export function title(): void {
  screenClear()
  say(14, 6, str('ELECFIGHTER'), TL_TEXT)
  say(14, 9, str('PRESS START'), TL_DIM)
  controlsDraw()
  for (;;) {
    frameBegin()
    controlsKeys()
    if (pressed(B_START)) {
      seedFromClock()
      return
    }
  }
}

/** The pause's CONTROLS: the table alone on BG1 until START or B. */
export function controlsRun(): void {
  hudClear()
  say(14, 6, str('CONTROLS'), TL_TEXT)
  say(11, 9, str('START OR B: BACK'), TL_DIM)
  controlsDraw()
  for (;;) {
    pauseFrame()
    controlsKeys()
    if (pressed(B_START) || pressed(B_B)) return
  }
}

/** SELECT switches the button set, A the log; both kept. */
function controlsKeys(): void {
  if (pressed(B_SELECT)) {
    buttonSetIs(1 - buttonSet)
    keep()
    setShow()
  }
  if (pressed(B_A)) {
    logOff[0] = 1 - logOff[0]
    keep()
    setShow()
  }
}

function keep(): void {
  saveWrite(SV_MARK, SAVE_MARK)
  saveWrite(SV_SET, buttonSet)
  saveWrite(SV_LOG, logOff[0])
}

function controlsDraw(): void {
  say(6, 14, str('PAD    PC KEY  ACTION'), TL_DIM)
  say(6, 16, str('D-PAD  ARROWS  MOVE, BACK GUARDS'), TL_TEXT)
  say(6, 17, str('Y      A       LIGHT PUNCH'), TL_TEXT)
  say(6, 18, str('X      S       HEAVY PUNCH'), TL_TEXT)
  say(6, 19, str('B      X'), TL_TEXT)
  say(6, 20, str('A      Z'), TL_TEXT)
  say(6, 21, str('NEAR, FWD OR BACK + HEAVY PUNCH: THROW'), TL_TEXT)
  say(6, 22, str('FWD FWD OR BACK BACK: DASH'), TL_TEXT)
  say(6, 24, str('SELECT: SWITCH THE BUTTON SET'), TL_DIM)
  say(6, 25, str('A: THE LOG LINE ON OR OFF'), TL_DIM)
  setShow()
}

/** The set's name and what B and A do in it; the log's state. */
function setShow(): void {
  if (buttonSet === 0) {
    say(6, 12, str('CONTROLS  TYPE A'), TL_TEXT)
    say(21, 19, str('LIGHT KICK'), TL_TEXT)
    say(21, 20, str('HEAVY KICK'), TL_TEXT)
  } else {
    say(6, 12, str('CONTROLS  TYPE B'), TL_TEXT)
    say(21, 19, str('HEAVY KICK'), TL_TEXT)
    say(21, 20, str('LIGHT KICK'), TL_TEXT)
  }
  say(26, 12, logOff[0] !== 0 ? str('LOG OFF') : str('LOG ON '), TL_TEXT)
}

/**
 * Chance seeded as the match begins (design 7.11): the clock the page gives, which reads to
 * the second, mixed with the cycle counter at the moment START was pressed.
 */
function seedFromClock(): void {
  let h: u16 = 0x2b1d
  let k: u16 = 0
  while (k < 7) {
    h = wrap16((h ^ peek(CLOCK + k)) * 31 + 7)
    k++
  }
  randSeed(h ^ csrr(CSR_CYCLE))
}
