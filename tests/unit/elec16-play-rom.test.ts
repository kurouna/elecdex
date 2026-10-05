import { existsSync, readFileSync } from 'node:fs'
import { compilePlay, playRomFile } from '@shared/e16c/play-rom'
import { APU_REG, CHANNELS } from '@shared/elec16/apu'
import { assemble, ramImage } from '@shared/elec16/asm'
import { buildGame } from '@shared/elec16/cart-build'
import { CART_BANK, readCart } from '@shared/elec16/cartridge'
import { REG_NAMES } from '@shared/elec16/isa'
import { LINK_STATUS } from '@shared/elec16/link-services'
import { Elec16 } from '@shared/elec16/machine'
import { BANK_SIZE, IO, XRAM_BANK, XRAM_MAX } from '@shared/elec16/map'
import { padBit } from '@shared/elec16/pad'
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
import { fromBase64 } from '@shared/emu/base64'
import { beforeEach, describe, expect, it } from 'vitest'
import { playText } from '../../src/renderer/widgets/elec16/play-painter'
import playJson from '../../src/renderer/widgets/elec16/play-rom.json'

/**
 * The ELEC-16 PLAY ROM (resources/elec16/play, docs/elec16-play.md, G2): no BASIC and no
 * monitor - the start screen, the ROM services on mode 0's bitmap, and a program the pane
 * calls (CODE's RUN) coming back to it. The screen is read back through the font.
 */

const DIR = 'resources/elec16/play/'
const read = (name: string) => (existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null)
const built = buildRom((name) => {
  const file = `resources/elec16/${playRomFile(name)}`
  return existsSync(file) ? readFileSync(file, 'utf8') : null
})

/** The screen's text, read back through the font as the pane does. */
const screen = (m: Elec16): string[] => playText(m.state.video?.mem ?? new Uint8Array())

/** What is written on the screen, its blank rows left out. */
const written = (m: Elec16) => screen(m).filter((row) => row !== '')

/**
 * What CART (main's LINK service 1) answers in these tests: the cartridge in the slot, none,
 * or LINK switched off. Main's own CART is tested in elec16-games.test.ts.
 */
const slot: { image: Uint8Array | null; off: boolean; asked: number[] } = {
  image: null,
  off: false,
  asked: [],
}
beforeEach(() => {
  slot.image = null
  slot.off = false
  slot.asked = []
})

function answerCart(m: Elec16): boolean {
  const request = m.takeLinkRequest()
  if (request === null) return false
  slot.asked.push(request.type)
  const image = slot.image
  if (slot.off) m.answerLink(request.serial, { status: LINK_STATUS.off })
  else if (image === null) m.answerLink(request.serial, { status: LINK_STATUS.failed })
  else {
    m.answerLink(request.serial, {
      status: LINK_STATUS.ready,
      data: image.subarray(0, 64),
      ...(request.type === 1 ? { cart: { image, digest: new Uint8Array(32) } } : {}),
    })
  }
  return true
}

/** Runs until it sleeps or stops, answering LINK as CART would. */
function settle(m: Elec16): void {
  for (let k = 0; k < 200; k++) {
    const r = m.run(2_000_000)
    if (answerCart(m)) continue
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
    expect(constant('APU_CHSEL')).toBe(APU_REG.sel)
    expect(constant('APU_KEY')).toBe(APU_REG.key)
    expect(constant('APU_MASTER')).toBe(APU_REG.master)
    expect(constant('APU_CHANNELS')).toBe(CHANNELS)
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
      // Switched on, nobody has pressed anything yet: CART is HELD, and START will ask.
      expect.stringMatching(/^ +PRESS START$/),
    ])
    const r = m.run(1000)
    expect(r.sleeping).toEqual({ key: false, pad: true, timerMs: null })
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
    // A BRK is a person's press: CART is asked from the first one on, as after this one.
    m.brk()
    settle(m)
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
    expect(m.run(1000).sleeping).toEqual({ key: false, pad: true, timerMs: null })
    // BRK then brings the start screen back.
    m.brk()
    settle(m)
    expect(written(m)[0]).toMatch(/ELEC-16 PLAY$/)
  })

  it('answers -1 for what PLAY-320 has no part for: a key and a line', () => {
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
      ret`,
    )
    expect([reg(m, 's0'), reg(m, 's1')]).toEqual([0xffff, 0xffff])
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

  it("never takes an interrupt into the program's handler on its way back to the start screen", () => {
    // Its own handler for VBLANK (the rest to the ROM's, as the kit's runtime does) with
    // interrupts on, VBLANK waiting, then BRK: the ROM's MRET to the start screen must not let
    // the waiting VBLANK into the program's handler.
    const m = switchOn()
    callCode(
      m,
      `
      la t0, irq
      csrw mtvec, t0
      li t0, ${1 << 5}
      csrw mie, t0
      csrsi mstatus, 8
    spin:
      j spin
    irq:
      csrr t0, mcause
      li t1, 0x8005
      bne t0, t1, rom
      li t1, 0x6000
      lw t0, 0(t1)
      addi t0, t0, 1
      sw t0, 0(t1)
      li t1, 0xf804
      li t0, 1
      sw t0, 0(t1)
      mret
    rom:
      li t0, ${symbol('trap')}
      jr t0`,
    )
    m.run(10_000)
    m.advance(1000 / 60 + 0.01)
    m.brk()
    settle(m)
    expect((m.state.ram[0x6000] ?? 0) | ((m.state.ram[0x6001] ?? 0) << 8)).toBe(0)
    expect(m.state.csr.mtvec).toBe(symbol('trap'))
    expect(written(m).at(-1)).toMatch(/^ {2}BREAK AT 70/)
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

/** What is written, each row trimmed: the start screen centres its words. */
const lines = (m: Elec16) => written(m).map((row) => row.trim())

/** A bundled game, built from its source as gen:elec16 builds it. */
function game(name: string): Uint8Array {
  const at = `resources/elec16/games/${name}/`
  const made = buildGame(
    readFileSync(`${at}game.s`, 'utf8'),
    JSON.parse(readFileSync(`${at}game.json`, 'utf8')),
    (file) => (existsSync(at + file) ? readFileSync(at + file, 'utf8') : null),
  )
  if ('errors' in made) throw new Error(JSON.stringify(made.errors))
  return made.image
}

const demo = () => game('demo')

/** A button pressed and let go, a frame apart. */
function tap(m: Elec16, bit: number): void {
  m.pad(bit)
  settle(m)
  m.advance(17)
  settle(m)
  m.pad(0)
  m.advance(17)
  settle(m)
}

describe('the cartridge on the start screen', () => {
  it('names the game in the slot once someone pressed something, and says START', () => {
    slot.image = demo()
    const m = switchOn()
    m.reset()
    settle(m)
    expect(lines(m)).toContain('ELEC-16 PLAY DEMO')
    expect(lines(m).at(-1)).toBe('PRESS START')
    expect(slot.asked).toEqual([0])
  })

  it('says when there is none, and when LINK or CART is off', () => {
    const m = switchOn()
    m.reset()
    settle(m)
    expect(lines(m).at(-1)).toBe('NO CARTRIDGE')
    slot.off = true
    m.reset()
    settle(m)
    expect(lines(m).at(-1)).toBe('LINK CART IS OFF')
  })

  it('loads the game with START and starts it; START in the game comes back', () => {
    slot.image = demo()
    const m = switchOn()
    tap(m, padBit('start'))
    expect(slot.asked).toEqual([1])
    expect(m.state.cart?.id).toBe('DEMO')
    expect(lines(m)[0]).toBe('ELEC-16 PLAY DEMO')
    expect(m.state.bank).toBe(CART_BANK)
    // Asleep for VBLANK each frame: a game, not the start screen.
    expect(m.run(1000).sleeping?.timerMs).not.toBeNull()
    tap(m, padBit('start'))
    expect(lines(m)).toContain('ELEC-16 PLAY')
    expect(lines(m)).toContain('PRESS START')
  })

  it('rings a note of the colour on channel 0 with A in DEMO, placed where the square is', () => {
    slot.image = demo()
    const m = switchOn()
    tap(m, padBit('start'))
    const c = m.state.apu?.ch[0]
    expect(c?.ons).toBe(0)
    tap(m, padBit('a'))
    // Colour 3 to 0, then on to 1: C6, in the middle of the screen.
    expect([c?.ons, c?.wave, c?.freq, c?.pan, c?.env]).toEqual([1, 4, 4186, 7, 0x80a1])
    tap(m, padBit('a'))
    expect([c?.ons, c?.freq]).toEqual([2, 5274])
    // Leaving the game lets every channel go, and a game's MASTER is put back.
    m.bus.write16(APU_REG.sel, 9)
    m.bus.write16(APU_REG.key, 1)
    m.bus.write16(APU_REG.master, 4)
    tap(m, padBit('start'))
    expect(lines(m)).toContain('PRESS START')
    expect(m.state.apu?.ch.map((x) => x.gate)).toEqual(Array(16).fill(false))
    expect([m.state.apu?.ch[9]?.offs, m.state.apu?.master, m.state.apu?.sel]).toEqual([1, 15, 0])
  })

  it('stays on the start screen saying why when START finds no cartridge', () => {
    const m = switchOn()
    tap(m, padBit('start'))
    expect(slot.asked).toEqual([1])
    expect(lines(m).at(-1)).toBe('NO CARTRIDGE')
    expect(m.state.cart).toBeNull()
    // And START again asks again.
    slot.image = demo()
    tap(m, padBit('start'))
    expect(m.state.cart?.id).toBe('DEMO')
  })

  it('takes START pressed and let go before the ROM looked, as a key tapped on the PC is', () => {
    slot.image = demo()
    const m = switchOn()
    m.pad(padBit('start'))
    m.pad(0)
    settle(m)
    expect(slot.asked).toEqual([1])
    expect(m.state.cart?.id).toBe('DEMO')
  })

  it('does not take START let go after it was held from before as a press', () => {
    slot.image = demo()
    const m = switchOn()
    // Held while the start screen was drawn, then let go: no press.
    m.pad(padBit('start'))
    m.reset()
    settle(m)
    expect(slot.asked).toEqual([0])
    m.pad(0)
    settle(m)
    expect(slot.asked).toEqual([0])
  })

  it('takes a button other than START at the start screen as nothing', () => {
    slot.image = demo()
    const m = switchOn()
    for (const b of ['a', 'b', 'select', 'up'] as const) tap(m, padBit(b))
    expect(slot.asked).toEqual([])
    expect(lines(m)).toContain('PRESS START')
  })
})

describe('the bundled demo', () => {
  /** The colour of the dot at (x, y) of the bitmap. */
  const dot = (m: Elec16, x: number, y: number) =>
    ((m.state.video?.mem[y * 80 + (x >> 2)] ?? 0) >> (6 - (x & 3) * 2)) & 3

  it('is what games.json holds (run npm run gen:elec16 after changing it)', () => {
    const file = JSON.parse(readFileSync('resources/elec16/games/games.json', 'utf8')) as {
      games: { data: string; about: string }[]
    }
    // The kit games between them each have a test that holds them to their sources
    // (elec16-eleclance.test.ts and the others): these two are the assembly samples.
    const images = file.games.map((g) => fromBase64(g.data) ?? new Uint8Array())
    const assembly = images.filter((i) => ['DEMO', 'SCROLL'].includes(readCart(i)?.id ?? ''))
    expect(assembly).toEqual([demo(), game('scroll')])
    expect(readCart(demo())).toMatchObject({ id: 'DEMO', name: 'ELEC-16 PLAY DEMO', saveBanks: 0 })
  })

  it('draws a square that the d-pad moves and A colours anew, and BRK stops it saying where', () => {
    slot.image = demo()
    const m = switchOn()
    tap(m, padBit('start'))
    expect(dot(m, 152, 140)).toBe(3)
    m.pad(padBit('right'))
    for (let k = 0; k < 4; k++) {
      m.advance(17)
      settle(m)
    }
    m.pad(0)
    m.advance(17)
    settle(m)
    expect(dot(m, 152, 140)).toBe(0)
    expect(dot(m, 168, 140)).toBe(3)
    tap(m, padBit('a'))
    expect(dot(m, 168, 140)).toBe(1)
    // A tapped between two frames counts as well.
    m.pad(padBit('a'))
    m.pad(0)
    m.advance(17)
    settle(m)
    expect(dot(m, 168, 140)).toBe(2)
    m.brk()
    settle(m)
    expect(lines(m).at(-1) ?? '').toMatch(/^BREAK AT C[0-9A-F]{3}$/)
  })
})

describe('the bundled SCROLL', () => {
  /** Plays a frame, a millisecond at a time: VBLANK, the program's frame, its LINE. */
  function frame(m: Elec16): void {
    for (let ms = 0; ms < 17; ms++) {
      m.advance(1)
      settle(m)
    }
  }

  it('starts mode 1, splits the scroll at line 144, moves its ship and goes back in mode 0', () => {
    slot.image = game('scroll')
    const m = switchOn()
    m.pad(padBit('start'))
    frame(m)
    m.pad(0)
    expect(m.state.cart?.id).toBe('SCROLL')
    expect(m.bus.read16(VIDEO_REG.ctrl)).toBe(3)
    for (let k = 0; k < 4; k++) frame(m)
    const log = m.state.video?.tiles.last.log ?? []
    const bg0x = log.filter((w) => w.which === 0)
    // Each frame: the stars' scroll at the top, the wall's (twice as far) from line 144.
    expect(bg0x.length).toBe(2)
    expect(bg0x[0]?.line).toBeLessThan(10)
    expect(bg0x[1]?.line).toBe(144)
    // The stars at half the scroll the frame began with, the wall at the scroll moved on.
    expect(bg0x[1]?.value).toBe(2 * (bg0x[0]?.value ?? 0) + 2)
    const ship = () => [m.bus.read16(0x0304), m.bus.read16(0x0306)]
    expect(ship()).toEqual([152, 200])
    m.pad(padBit('left'))
    for (let k = 0; k < 3; k++) frame(m)
    m.pad(0)
    frame(m)
    expect(ship()[0]).toBeLessThan(152)
    tap(m, padBit('start'))
    expect(m.bus.read16(VIDEO_REG.ctrl)).toBe(1)
    expect(lines(m)).toContain('PRESS START')
  })
})
