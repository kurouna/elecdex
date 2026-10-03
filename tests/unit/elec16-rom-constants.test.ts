import { readFileSync } from 'node:fs'
import { REG } from '@shared/elec16/bus'
import { CARD_APPEND, CARD_OP, CARD_REG, CARD_STATUS } from '@shared/elec16/card'
import { CONTROL } from '@shared/elec16/keys'
import { CODE_AREA, CODE_AREA_END, VRAM } from '@shared/elec16/map'
import { MATH_OP, MATH_REG } from '@shared/elec16/math-unit'
import { ANNUNCIATORS, CSR_NAMES, IRQ } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'

/**
 * BASIC's e16c sources name the machine's addresses and codes by hand (e16c reads no imports
 * from the shared code): each one held here to the shared table it copies, and the work-area
 * offsets to ram.inc, which the hand-written ROM uses.
 */

const DIR = 'resources/elec16/rom/'

/** Every `const NAME = number` in a source, exported or not. */
function constants(file: string): Map<string, number> {
  const out = new Map<string, number>()
  const text = readFileSync(`${DIR}${file}`, 'utf8')
  for (const m of text.matchAll(
    /^(?:export )?const (\w+)(?::\s*\w+)? = (-?(?:0x[0-9a-f]+|\d+))$/gim,
  )) {
    out.set(m[1] ?? '', Number(m[2]))
  }
  return out
}

/** `NAME = value` lines of an assembly include. */
function inc(file: string): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of readFileSync(`${DIR}${file}`, 'utf8').matchAll(
    /^(\w+)\s*=\s*(0x[0-9a-f]+|\d+)/gim,
  )) {
    out.set(m[1] ?? '', Number(m[2]))
  }
  return out
}

const ann = (name: (typeof ANNUNCIATORS)[number]) => 1 << ANNUNCIATORS.indexOf(name)

describe("BASIC's copied constants", () => {
  it('in rom.e16.ts are the I/O registers, codes and memory map they name', () => {
    const rom = constants('basic/rom.e16.ts')
    const want: Record<string, number> = {
      IO_POWER: REG.power,
      IO_KEY_COUNT: REG.keyCount,
      IO_WIDTH: REG.width,
      IO_HEIGHT: REG.height,
      IO_CURMODE: REG.cursorMode,
      IO_TCOUNT: REG.timerCount,
      IO_TCMP: REG.timerCompare,
      IO_TCTRL: REG.timerCtrl,
      IO_CLOCK: REG.clock,
      IO_FREQ: REG.buzzerFreq,
      IO_DUR: REG.buzzerDuration,
      CARD_CMD: CARD_REG.cmd,
      CARD_BLOCK: CARD_REG.block,
      CARD_STATUS: CARD_REG.status,
      CARD_RESULT: CARD_REG.result,
      CARD_RESULT_HIGH: CARD_REG.resultHigh,
      MATH_OP: MATH_REG.op,
      MATH_A: MATH_REG.a,
      MATH_B: MATH_REG.b,
      MATH_ARG: MATH_REG.arg,
      MATH_STATUS: MATH_REG.status,
      MATH_RESULT: MATH_REG.result,
      MATH_ANGLE: MATH_REG.angle,
      CSR_MIE: CSR_NAMES.mie,
      MIE_TIMER: 1 << IRQ.timer,
      VRAM,
      CODE_AREA,
      CODE_AREA_END,
      LIMIT: CODE_AREA,
      ANN_BUSY: ann('BUSY'),
      ANN_RUN: ann('RUN'),
      ANN_PRO: ann('PRO'),
      ANN_DEG: ann('DEG'),
      ANN_RAD: ann('RAD'),
      ANN_GRAD: ann('GRAD'),
      K_ENTER: CONTROL.enter,
      // Not a key of the matrix: what getkey gives for BRK, ram.inc's.
      K_BRK: inc('ram.inc').get('K_BRK') ?? -1,
      K_BS: CONTROL.bs,
      K_CLS: CONTROL.cls,
      K_INS: CONTROL.ins,
      K_DEL: CONTROL.del,
      K_MODE: CONTROL.mode,
      K_LEFT: CONTROL.left,
      K_RIGHT: CONTROL.right,
      K_UP: CONTROL.up,
      K_DOWN: CONTROL.down,
    }
    for (const [name, value] of Object.entries(want)) expect(rom.get(name), name).toBe(value)
    // Every I/O, card, maths, CSR, annunciator and key constant is one of those.
    const copied = [...rom.keys()].filter((n) => /^(IO|CARD|MATH|CSR|MIE|ANN|K)_/.test(n))
    expect(copied.filter((n) => !(n in want))).toEqual([])
  })

  it('in rom.e16.ts give the work area where ram.inc has it', () => {
    const rom = constants('basic/rom.e16.ts')
    const ram = inc('ram.inc')
    for (const name of [
      'CURX',
      'CURY',
      'COLS',
      'ROWS',
      'WIDTH',
      'PLANE',
      'DEPTH',
      'ANNMODE',
      'INBASIC',
      'BRKFLAG',
    ]) {
      expect(rom.get(name), name).toBe(ram.get(name))
    }
  })

  it("in basic.e16.ts and files.e16.ts are the maths unit's operations and the card's codes", () => {
    const basic = constants('basic/basic.e16.ts')
    const ops: Record<string, number> = {
      M_ADD: MATH_OP.add,
      M_SUB: MATH_OP.sub,
      M_MUL: MATH_OP.mul,
      M_DIV: MATH_OP.div,
      M_POW: MATH_OP.pow,
      M_CMP: MATH_OP.cmp,
      M_NEG: MATH_OP.neg,
      M_INT: MATH_OP.int,
      M_RND: MATH_OP.rnd,
      M_PI: MATH_OP.pi,
      M_FROMINT: MATH_OP.fromInt,
      M_TOINT: MATH_OP.toInt,
      M_TOWORD: MATH_OP.toWord,
      M_PARSE: MATH_OP.parse,
      M_FORMAT: MATH_OP.format,
    }
    for (const [name, value] of Object.entries(ops)) expect(basic.get(name), name).toBe(value)
    expect([...basic.keys()].filter((n) => n.startsWith('M_') && !(n in ops))).toEqual([])
    const files = constants('basic/files.e16.ts')
    const card: Record<string, number> = {
      OP_DIR: CARD_OP.dir,
      OP_READ: CARD_OP.read,
      OP_WRITE: CARD_OP.write,
      OP_DELETE: CARD_OP.delete,
      OP_FREE: CARD_OP.free,
      ST_BUSY: CARD_STATUS.busy,
      ST_NOFILE: CARD_STATUS.noFile,
      ST_BADNAME: CARD_STATUS.badName,
      APPEND: CARD_APPEND,
    }
    for (const [name, value] of Object.entries(card)) expect(files.get(name), name).toBe(value)
  })
})
