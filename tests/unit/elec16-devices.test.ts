import { assemble, romImage } from '@shared/elec16/asm'
import { REG } from '@shared/elec16/bus'
import { keyCode } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { MACHINE_ID, MODEL_IDS, MODELS, type ModelId } from '@shared/elec16/map'
import { KEY_FIFO_SIZE } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'

/**
 * The ELEC-16's devices as a program sees them through the bus (docs/elec16.md section 5):
 * the system registers, the keyboard, the LCD's control, the timer, the clock, the buzzer and
 * the reserved addresses. The maths unit and the card have their own tests; how a program
 * waits on these lines is elec16-machine.test.ts's.
 */

function machine(model?: ModelId): Elec16 {
  const out = assemble('.org 0x8000\nebreak')
  return Elec16.boot(romImage(out), model)
}

describe('the system registers', () => {
  it('say what the machine is and which model, and switch it off on POWER 0 with its RAM kept', () => {
    for (const id of MODEL_IDS) {
      const m = machine(id)
      expect(m.bus.read16(REG.id)).toBe(MACHINE_ID)
      expect(m.bus.read16(REG.model)).toBe(MODEL_IDS.indexOf(id))
    }
    const m = machine()
    m.bus.write16(0x2000, 0x1234)
    m.bus.write16(REG.power, 1)
    expect(m.state.off).toBe(false)
    m.bus.write16(REG.power, 0)
    expect(m.state.off).toBe(true)
    expect(m.bus.read16(0x2000)).toBe(0x1234)
  })
})

describe('the keyboard', () => {
  it('gives the FIFO a key a read of KEYDATA, peeked or by its high byte without taking it', () => {
    const m = machine()
    expect(m.bus.read16(REG.keyData)).toBe(0xffff)
    m.press(keyCode('a'))
    m.press(keyCode('b'))
    expect(m.bus.read16(REG.keyCount)).toBe(2)
    expect(m.bus.peek(REG.keyData)).toBe(keyCode('a'))
    expect(m.bus.read8(REG.keyData + 1)).toBe(0)
    expect(m.bus.read16(REG.keyCount)).toBe(2)
    expect(m.bus.read8(REG.keyData)).toBe(keyCode('a'))
    expect(m.bus.read16(REG.keyData)).toBe(keyCode('b'))
    expect(m.bus.read16(REG.keyCount)).toBe(0)
  })

  it('shows the keys held in KEYMAT, a bit each, until they go up; a code past the matrix is nothing', () => {
    const m = machine()
    const q = keyCode('q')
    const enter = keyCode('enter')
    m.press(q)
    m.press(enter)
    const row = (code: number) => m.bus.read8(REG.keyMatrix + (code >> 3))
    expect(row(q) & (1 << (q & 7))).not.toBe(0)
    expect(row(enter) & (1 << (enter & 7))).not.toBe(0)
    m.release(q)
    expect(row(q) & (1 << (q & 7))).toBe(0)
    m.releaseAll()
    expect(row(enter)).toBe(0)
    m.press(999)
    m.press(-1)
    expect(m.bus.read16(REG.keyCount)).toBe(2)
    // A word read gives two rows at once.
    m.press(q)
    const word = m.bus.read16(REG.keyMatrix + ((q >> 3) & ~1))
    expect(word).not.toBe(0)
    for (let k = 0; k < KEY_FIFO_SIZE + 4; k++) m.press(q)
    expect(m.bus.read16(REG.keyCount)).toBe(KEY_FIFO_SIZE)
  })
})

describe("the LCD's control", () => {
  it('tells its size and shades for every model', () => {
    for (const id of MODEL_IDS) {
      const m = machine(id)
      expect([m.bus.read16(REG.width), m.bus.read16(REG.height), m.bus.read16(REG.depth)]).toEqual([
        MODELS[id].width,
        MODELS[id].height,
        MODELS[id].depth,
      ])
    }
  })

  it('takes the display, contrast, cursor, its shape and the annunciators, and counts a change only when one is made', () => {
    const m = machine()
    const changes = () => m.screenRevision
    const writes: [number, number, number][] = [
      [REG.lcdCtrl, 0, 0],
      [REG.contrast, 0x1f, 15],
      [REG.cursor, 0x0203, 0x0203],
      [REG.cursorMode, 0xff, 7],
      [REG.annunciators, 0x0411, 0x0411],
    ]
    for (const [reg, value, reads] of writes) {
      const before = changes()
      m.bus.write16(reg, value)
      expect(m.bus.read16(reg), reg.toString(16)).toBe(reads)
      expect(changes(), reg.toString(16)).toBe(before + 1)
      // The same again changes nothing shown.
      m.bus.write16(reg, value)
      expect(changes(), reg.toString(16)).toBe(before + 1)
    }
    m.bus.write16(REG.lcdCtrl, 1)
    expect(m.state.lcd.on).toBe(true)
  })

  it("takes video memory the model's screen uses, and ignores the rest of the window", () => {
    const m = machine('pocket-32')
    const used = (MODELS['pocket-32'].width * MODELS['pocket-32'].height) / 8
    m.bus.write8(0xe000 + used - 1, 0x81)
    m.bus.write8(0xe000 + used, 0x81)
    expect(m.bus.read8(0xe000 + used - 1)).toBe(0x81)
    expect(m.bus.read8(0xe000 + used)).toBe(0)
  })
})

describe('the timer, the clock and the buzzer', () => {
  it('counts 1,024 a second of host time, and shows its enable and pending bits', () => {
    const m = machine()
    m.advance(1000)
    expect(m.bus.read16(REG.timerCount)).toBe(1024)
    // A part of a tick is kept for the next.
    for (let k = 0; k < 1000; k++) m.advance(0.5)
    expect(m.bus.read16(REG.timerCount)).toBe(1536)
    m.bus.write16(REG.timerCompare, 1540)
    m.bus.write16(REG.timerCtrl, 1)
    expect(m.bus.read16(REG.timerCtrl)).toBe(1)
    m.advance(10)
    expect(m.bus.read16(REG.timerCtrl)).toBe(3)
    // Writing the control or the compare drops what was pending.
    m.bus.write16(REG.timerCtrl, 1)
    expect(m.bus.read16(REG.timerCtrl)).toBe(1)
  })

  it('reads the clock the page gives it, a byte a field', () => {
    const m = machine()
    m.setClock({ second: 7, minute: 8, hour: 9, day: 10, month: 11, year: 2026, weekday: 2 })
    const fields = Array.from({ length: 7 }, (_, k) => m.bus.read8(REG.clock + k))
    expect(fields).toEqual([7, 8, 9, 10, 11, 26, 2])
  })

  it('holds the buzzer’s tone, its length from when it was written, and its gate', () => {
    const m = machine()
    m.advance(250)
    m.bus.write16(REG.buzzerFreq, 440)
    m.bus.write16(REG.buzzerDuration, 120)
    m.bus.write16(REG.buzzerGate, 1)
    expect(m.state.buzzer).toMatchObject({ freq: 440, duration: 120, gate: true, started: 250 })
    expect([
      m.bus.read16(REG.buzzerFreq),
      m.bus.read16(REG.buzzerDuration),
      m.bus.read16(REG.buzzerGate),
    ]).toEqual([440, 120, 1])
  })
})

describe('the addresses with nothing behind them', () => {
  it('read 0 and ignore writes: the reserved block, LINK and any other I/O register', () => {
    const m = machine()
    for (const at of [0xf800, 0xfa00, 0xfefe, 0xff70, 0xff7e, 0xff0e, 0xff4e, 0xfffe]) {
      expect(m.bus.write16(at, 0xabcd), at.toString(16)).toBe(true)
      expect(m.bus.read16(at), at.toString(16)).toBe(0)
    }
  })

  it('refuses a write to the ROM, fixed or banked', () => {
    const m = machine()
    const before = m.bus.read16(0x8000)
    expect(m.bus.write8(0x8000, 0)).toBe(false)
    expect(m.bus.write16(0xc000, 0)).toBe(false)
    expect(m.bus.read16(0x8000)).toBe(before)
  })
})
