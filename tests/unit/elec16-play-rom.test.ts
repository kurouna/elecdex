import { existsSync, readFileSync } from 'node:fs'
import { compilePlay } from '@shared/e16c/play-rom'
import { assemble, ramImage } from '@shared/elec16/asm'
import { screenText } from '@shared/elec16/font'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import { BANK_SIZE, IO, XRAM_BANK, XRAM_MAX } from '@shared/elec16/map'
import { buildRom, romFile, romFromFile } from '@shared/elec16/rom'
import {
  BITMAP_HEIGHT,
  BITMAP_ROW,
  BITMAP_SIZE,
  BITMAP_WIDTH,
  PALETTE_AT,
  VIDEO_PAGE_SIZE,
  VIDEO_REG,
} from '@shared/elec16/video'
import { describe, expect, it } from 'vitest'
import playJson from '../../src/renderer/widgets/elec16/play-rom.json'

/**
 * The ELEC-16 PLAY ROM (resources/elec16/play, docs/elec16-play.md, G2): no BASIC and no
 * monitor - the start screen, the ROM services on mode 0's bitmap, and a program the pane
 * calls (CODE's RUN) coming back to it. The screen is read back through the font.
 */

const DIR = 'resources/elec16/play/'
const read = (name: string) => (existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null)
const built = buildRom(read)

/** The bitmap as the pocket LCD's memory (a byte a column of eight dots), for the font to read. */
function screen(m: Elec16): string[] {
  const mem = m.state.video?.mem ?? new Uint8Array()
  const columns = new Uint8Array(BITMAP_WIDTH * (BITMAP_HEIGHT / 8))
  for (let y = 0; y < BITMAP_HEIGHT; y++) {
    for (let x = 0; x < BITMAP_WIDTH; x++) {
      const dot = ((mem[y * BITMAP_ROW + (x >> 2)] ?? 0) >> (6 - (x & 3) * 2)) & 3
      if (dot !== 0) columns[(y >> 3) * BITMAP_WIDTH + x] |= 1 << (y & 7)
    }
  }
  return screenText(columns, BITMAP_WIDTH, BITMAP_HEIGHT).map((row) => row.trimEnd())
}

/** What is written on the screen, its blank rows left out. */
const written = (m: Elec16) => screen(m).filter((row) => row !== '')

/** Runs until it sleeps or stops. */
function settle(m: Elec16): void {
  for (let k = 0; k < 200; k++) {
    const r = m.run(2_000_000)
    if (r.halted !== null || r.sleeping !== null) return
  }
  throw new Error('the ROM never slept')
}

function switchOn(xram = XRAM_MAX): Elec16 {
  const m = Elec16.boot(built.image, 'play-320', undefined, xram)
  settle(m)
  return m
}

const symbol = (name: string): number => {
  const at = built.symbols[name]
  if (at === undefined) throw new Error(`no ${name}`)
  return at
}

/** CODE's RUN: machine code at 7000, called to come back to the start screen's sleep. */
function callCode(m: Elec16, src: string): void {
  const out = assemble(`.org 0x7000\n${src}`)
  expect(out.errors).toEqual([])
  expect(m.loadCode(0x7000, ramImage(out, 0x7000))).toBe(true)
  m.callAt(0x7000, symbol('code_return'))
}

function runCode(m: Elec16, src: string): void {
  callCode(m, src)
  settle(m)
}

const reg = (m: Elec16, name: (typeof REG_NAMES)[number]) => m.state.regs[REG_NAMES.indexOf(name)]

describe('the PLAY ROM file', () => {
  it('is what the sources build now (run npm run gen:elec16 after changing them)', () => {
    const play = compilePlay((name) => read(name) ?? '')
    expect(play.errors).toEqual([])
    expect(read('play.s')).toBe(play.asm)
    expect(built.errors).toEqual([])
    expect(playJson).toEqual(romFile(built))
    expect(romFromFile(playJson)).toEqual(built.image)
  })

  it('says what the e16c source says of the machine as the machine has it', () => {
    const source = read('play.e16.ts') ?? ''
    const constant = (name: string) =>
      Number(new RegExp(`const ${name} = (\\w+)`).exec(source)?.[1])
    expect(constant('VCTRL')).toBe(VIDEO_REG.ctrl)
    expect(constant('VPAGE')).toBe(VIDEO_REG.page)
    expect(constant('WINDOW')).toBe(0xe000)
    expect(constant('PAGE_SIZE')).toBe(VIDEO_PAGE_SIZE)
    expect(constant('ROW_BYTES')).toBe(BITMAP_ROW)
    expect(constant('SCREEN_ROWS')).toBe(BITMAP_HEIGHT)
    expect(constant('BITMAP_SIZE')).toBe(BITMAP_SIZE)
    expect(constant('PALETTE')).toBe(PALETTE_AT)
    expect(constant('IO_BANK')).toBe(0xff04)
    expect(constant('XRAM_BANK')).toBe(XRAM_BANK)
    expect(constant('XRAM_BANKS')).toBe(XRAM_MAX / BANK_SIZE)
    expect(constant('COLS')).toBe(Math.floor(BITMAP_WIDTH / 6))
    expect(constant('ROWS')).toBe(BITMAP_HEIGHT / 8)
  })
})

describe('the start screen', () => {
  it('names the machine and its memory, and sleeps with nothing to wake it but BRK', () => {
    const m = switchOn()
    expect(written(m)).toEqual([
      expect.stringMatching(/^ +ELEC-16 PLAY$/),
      expect.stringMatching(/^ +PLAY-320$/),
      expect.stringMatching(/^ +RAM 32K {2}XRAM 512K$/),
      expect.stringMatching(/^ +NO CARTRIDGE$/),
    ])
    const r = m.run(1000)
    expect(r.sleeping).toEqual({ key: false, timerMs: null })
  })

  it('counts the extended RAM the unit has', () => {
    for (const kb of [0, 128, 256] as const) {
      const m = switchOn(kb * 1024)
      expect(written(m)[2]).toMatch(new RegExp(`RAM 32K {2}XRAM ${kb}K$`))
      expect(m.state.bank).toBe(0)
    }
  })

  it('sets the display on in mode 0 and palette 0 four colours, dark to light', () => {
    const m = switchOn()
    const v = m.state.video
    expect(m.bus.read16(VIDEO_REG.ctrl)).toBe(1)
    const colour = (k: number) =>
      (v?.mem[PALETTE_AT + k * 2] ?? 0) | ((v?.mem[PALETTE_AT + k * 2 + 1] ?? 0) << 8)
    const brightness = (c: number) => (c & 31) + ((c >> 5) & 31) + ((c >> 10) & 31)
    const shades = [0, 1, 2, 3].map((k) => brightness(colour(k)))
    expect(shades).toEqual([...shades].sort((a, b) => a - b))
    expect(colour(0)).not.toBe(colour(3))
  })

  it('draws itself again on BRK, saying nothing', () => {
    const m = switchOn()
    const before = written(m)
    m.brk()
    settle(m)
    expect(written(m)).toEqual(before)
  })
})

describe('a program the pane runs', () => {
  it("writes through the ROM's services and keeps what it wrote when it comes back", () => {
    const m = switchOn()
    runCode(
      m,
      `
      li t0, 3
      ecall
      la a0, hello
      li t0, 1
      ecall
      li a0, 0x1234
      li t0, 5
      ecall
      ret
    hello:
      .byte 72, 73, 32, 0`,
    )
    expect(written(m)).toEqual(['HI 1234'])
    expect(m.run(1000).sleeping).toEqual({ key: false, timerMs: null })
    // BRK then brings the start screen back.
    m.brk()
    settle(m)
    expect(written(m)[0]).toMatch(/ELEC-16 PLAY$/)
  })

  it('answers -1 for what PLAY-320 has no part for: a key, a line, LINK', () => {
    const m = switchOn()
    runCode(
      m,
      `
      li t0, 2
      ecall
      mv s0, a0
      li t0, 7
      ecall
      mv s1, a0
      li t0, 8
      ecall
      mv s2, a0
      ret`,
    )
    expect([reg(m, 's0'), reg(m, 's1'), reg(m, 's2')]).toEqual([0xffff, 0xffff, 0xffff])
  })

  it('stops at BRK and at EBREAK saying where, and at a fault saying which', () => {
    const m = switchOn()
    callCode(m, 'spin:\n  j spin')
    expect(m.run(100_000).sleeping).toBeNull()
    m.brk()
    settle(m)
    expect(written(m).at(-1)).toBe('  BREAK AT 7000')
    runCode(m, 'nop\nebreak')
    expect(written(m).at(-1)).toBe('  BREAK AT 7002')
    runCode(m, `li t0, 0x8000\nsw t0, 0(t0)`)
    expect(written(m).at(-1)).toMatch(/^ {2}FAULT 0007 AT 700[0-9A-F]$/)
    runCode(m, 'li t0, 40\necall')
    expect(written(m).at(-1)).toMatch(/^ {2}FAULT 000B AT 700[0-9A-F]$/)
  })

  it('scrolls the screen up a row when the text reaches the bottom', () => {
    const m = switchOn()
    // Forty lines, numbered: the first four go off the top of thirty-six rows.
    runCode(
      m,
      `
      li t0, 3
      ecall
      li s0, 0
    line:
      mv a0, s0
      li t0, 5
      ecall
      li t0, 6
      ecall
      addi s0, s0, 1
      li t1, 40
      blt s0, t1, line
      ret`,
    )
    const rows = screen(m)
    expect(rows[0]).toBe('0005')
    expect(rows[33]).toBe('0026')
    expect(rows[34]).toBe('0027')
    expect(rows[35]).toBe('')
  })

  it('leaves the reserved block and the I/O block where they are', () => {
    const m = switchOn()
    expect(IO).toBe(0xff00)
    expect(m.bus.read16(0xf000)).toBe(0)
  })
})
