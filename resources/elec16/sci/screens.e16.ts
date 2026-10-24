// ELEC-16 SCI, ROM bank 1: the screens other than the calculator's own (docs/elec16-sci.md
// sections 4.5 and 6.6) - MENU, SETUP and the error screen - each in the one rhythm: a title
// band over rows 0-8, then a line every nine rows from row 11. Its code runs with bank 1 in the
// window; calc.e16.ts calls it through far_call.
import { addr, bytes, peek, poke, str, type u16 } from '../../../src/shared/e16c/builtins'
import { K_1, K_2, K_3, K_4, K_5, K_AC, refuse } from './calc.e16'
import { band, lineY, mark, textAt, textRight } from './lcd.e16'
import { E_MATH, E_STACK, KEEP_ANGLE } from './numbers.e16'

/* ---------------- the error screen ---------------- */

/** ERR:MATH, ERR:SYNTAX or ERR:STACK, what it means, and what the keys do now. */
export function errorScreen(code: u16): void {
  if (code === E_MATH) {
    band(str('ERR:MATH'))
    textAt(str("OUT OF A FUNCTION'S"), 1, lineY(0))
    textAt(str('RANGE, OR /0'), 1, lineY(1))
  } else if (code === E_STACK) {
    band(str('ERR:STACK'))
    textAt(str('TOO MANY BRACKETS OR'), 1, lineY(0))
    textAt(str('FUNCTIONS IN A LINE'), 1, lineY(1))
  } else {
    band(str('ERR:SYNTAX'))
    textAt(str('CANNOT READ THE LINE'), 1, lineY(0))
    textAt(str('AT THE CURSOR'), 1, lineY(1))
  }
  textAt(str('\x8c\x8b:BACK TO THE LINE'), 1, lineY(4))
  textAt(str('AC:CLEAR'), 1, lineY(5))
}

/* ---------------- MENU ---------------- */

/** The modes; CALC the one there is now, and marked so. */
export function menuScreen(): void {
  band(str('MENU'))
  textAt(str('1:CALC    2:STATS'), 1, lineY(0))
  textAt(str('3:BASE    4:TABLE'), 1, lineY(1))
  textAt(str('5:EQUATION'), 1, lineY(2))
  textAt(str('AC:BACK'), 1, lineY(5))
  mark(0, 6, 0)
}

/** A key on MENU: 1 (or AC) goes back to CALC; the modes to come refuse with a beep. Non-zero: leave. */
export function menuKey(k: u16): u16 {
  if (k === K_1 || k === K_AC) return 1
  if (k === K_2 || k === K_3 || k === K_4 || k === K_5) refuse()
  return 0
}

/* ---------------- SETUP ---------------- */

/** The angle, chosen by 3, 4 or 5; the current one marked. */
export function setupScreen(): void {
  band(str('SETUP'))
  textRight(str('1/2'), 1)
  textAt(str('3:DEG 4:RAD 5:GRAD'), 1, lineY(0))
  textAt(str('AC:BACK'), 1, lineY(5))
  const angle = peek(KEEP_ANGLE)
  if (angle === 1) mark(6, 5, 0)
  else if (angle === 2) mark(12, 6, 0)
  else mark(0, 5, 0)
}

/** A key on SETUP: an angle is set and shown; AC leaves (non-zero). */
export function setupKey(k: u16): u16 {
  if (k === K_AC) return 1
  if (k === K_3 || k === K_4 || k === K_5) {
    poke(KEEP_ANGLE, k === K_3 ? 0 : k === K_4 ? 1 : 2)
    setupScreen()
    return 0
  }
  refuse()
  return 0
}

/* ---------------- a fault ---------------- */

/** A break or a fault in a program (CODE's RUN): what stopped and where. */
export function faultScreen(cause: u16, pc: u16): void {
  if (cause === 0x800f || cause === 3) band(str('BREAK'))
  else band(str('FAULT'))
  textAt(str('CAUSE'), 1, lineY(0))
  hexAt(cause, 43, lineY(0))
  textAt(str('AT'), 1, lineY(1))
  hexAt(pc, 43, lineY(1))
  textAt(str('AC:CLEAR'), 1, lineY(5))
}

const hexText = bytes(6)

function hexAt(v: u16, x: u16, y: u16): void {
  for (let s: u16 = 0; s < 4; s++) {
    const d = (v >> (12 - s * 4)) & 15
    hexText[s] = d < 10 ? 0x30 + d : 0x37 + d
  }
  hexText[4] = 0
  textAt(addr(hexText), x, y)
}
