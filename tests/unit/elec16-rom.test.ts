import { assemble, ramImage } from '@shared/elec16/asm'
import { keyCode } from '@shared/elec16/keys'
import type { Elec16 } from '@shared/elec16/machine'
import { MODELS } from '@shared/elec16/map'
import { describe, expect, it } from 'vitest'
import {
  annunciated,
  boot,
  built,
  press,
  screen,
  settle,
  shown,
  switchOn,
  type,
} from './elec16-helpers'

const hex = (n: number, digits = 4): string => n.toString(16).toUpperCase().padStart(digits, '0')

/** E commands for machine code at 0x7000, eight bytes a line. */
function enter(m: Elec16, source: string): void {
  const out = assemble(`.org 0x7000\n${source}`)
  expect(out.errors).toEqual([])
  const bytes = Array.from(ramImage(out, 0x7000), (b) => hex(b, 2))
  for (let at = 0; at < bytes.length; at += 8) {
    type(m, `E ${hex(0x7000 + at)} ${bytes.slice(at, at + 8).join(' ')}\n`)
  }
}

describe('the ROM', () => {
  it('is built from its sources into the fixed 16 KB and the banks of BASIC, with its labels', () => {
    expect(built.errors).toEqual([])
    // The fixed ROM, then the 8 KB banks: BASIC's second half (0 to 3) and the monitor's U and B (4).
    expect(built.image).toHaveLength(0x4000 + 5 * 0x2000)
    expect(built.symbols.e16c_fixed_end).toBeLessThan(0xc000)
    expect(built.symbols.start).toBeGreaterThanOrEqual(0x8000)
    expect(built.symbols.services).toBe(0x8010)
    expect(built.symbols.font).toBeLessThan(0xc000)
  })

  it('starts in BASIC, and MON takes it to the monitor, waiting for a key at its prompt', () => {
    const m = switchOn()
    expect(shown(m)).toEqual(['ELEC-16 BASIC 1.0', expect.stringMatching(/^\d+ BYTES FREE$/), '>'])
    expect(m.run(1000).sleeping).toEqual({ key: true, timerMs: null })
    expect(annunciated(m)).toEqual(expect.arrayContaining(['CAPS', 'RUN']))
    type(m, 'MON\n')
    expect(shown(m).slice(-3)).toEqual(['>MON', 'ELEC-16 MONITOR 0.1', '*'])
    expect(annunciated(m)).toEqual(['CAPS', 'MON'])
    press(m, keyCode('cls'))
    expect(shown(m)).toEqual(['*'])
    expect(m.state.lcd.cursor).toBe(1)
    expect(m.state.lcd.cursorMode).toBe(6)
  })

  it('dumps memory with D, eight bytes and their characters a line, and goes on', () => {
    const m = boot()
    const at = built.symbols.font ?? 0
    type(m, `d ${at.toString(16)}\n`)
    const bytes = Array.from(built.image.subarray(at - 0x8000, at - 0x8000 + 8))
    const chars = bytes.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : '.'))
    const first = `${hex(at)}: ${bytes.map((b) => hex(b, 2)).join(' ')} ${chars.join('')}`
    // Five lines (a screen less the prompt's) after the command.
    expect(shown(m).slice(-6)).toEqual([
      first,
      expect.stringMatching(new RegExp(`^${hex(at + 8)}:`)),
      expect.stringMatching(new RegExp(`^${hex(at + 16)}:`)),
      expect.stringMatching(new RegExp(`^${hex(at + 24)}:`)),
      expect.stringMatching(new RegExp(`^${hex(at + 32)}:`)),
      '*',
    ])
    type(m, 'D\n')
    expect(shown(m).at(-6)).toMatch(new RegExp(`^${hex(at + 40)}:`))
  })

  it('writes bytes with E and runs them with G; a program prints through ECALL', () => {
    const m = boot()
    // An ECALL may change t0, so the service is named again each time.
    enter(
      m,
      `li t0, 0
      li a0, 'H'
      ecall
      li t0, 0
      li a0, 'I'
      ecall
      ret`,
    )
    type(m, 'G 7000\n')
    expect(shown(m).slice(-2)).toEqual(['HI', '*'])
  })

  it('stops a program at EBREAK, or a fault, and says where; R shows the registers', () => {
    const m = boot()
    enter(m, 'li a0, 0x1234\nebreak')
    type(m, 'G 7000\n')
    expect(shown(m).slice(-2)).toEqual(['BREAK AT 7004', '*'])
    type(m, 'R\n')
    const rows = shown(m)
    expect(rows.slice(-5)).toEqual([
      expect.stringMatching(/^PC=7004 RA=[0-9A-F]{4} SP=8000 GP=0000$/),
      expect.stringMatching(/^A0=1234 A1=[0-9A-F]{4} A2=[0-9A-F]{4} A3=[0-9A-F]{4}$/),
      expect.stringMatching(/^T0=[0-9A-F]{4} T1=[0-9A-F]{4} T2=[0-9A-F]{4} T3=[0-9A-F]{4}$/),
      expect.stringMatching(/^S0=[0-9A-F]{4} S1=[0-9A-F]{4} S2=[0-9A-F]{4} S3=[0-9A-F]{4}$/),
      '*',
    ])
    enter(m, 'li t0, 1\nlw a0, 0(t0)')
    type(m, 'G 7000\n')
    expect(shown(m).slice(-2)).toEqual(['FAULT 0004 AT 7002', '*'])
  })

  it('gets the machine back with BRK, from a program that never ends or from the prompt', () => {
    const m = boot()
    enter(m, 'j $')
    type(m, 'G 7000')
    m.press(keyCode('enter'))
    expect(m.run(100_000).sleeping).toBeNull()
    m.brk()
    settle(m)
    expect(shown(m).slice(-2)).toEqual(['BREAK AT 7000', '*'])
    type(m, 'D 00')
    m.brk()
    settle(m)
    // At its own prompt, BRK only gives up the line.
    expect(shown(m).slice(-2)).toEqual(['*D 00', '*'])
  })

  it('types letters by CAPS and SHIFT, and symbols on the shifted faces', () => {
    const m = boot()
    press(m, keyCode('caps'))
    expect(annunciated(m)).toEqual(['MON'])
    type(m, 'ab')
    press(m, keyCode('shift'))
    expect(annunciated(m)).toEqual(['SHIFT', 'MON'])
    press(m, keyCode('c'))
    type(m, '!{~')
    expect(annunciated(m)).toEqual(['MON'])
    expect(shown(m).at(-1)).toBe('*abC!{~')
  })

  it('types kana by the JIS layout in KANA mode, small ones with SHIFT, and the rest as before', () => {
    const m = boot()
    press(m, keyCode('kana'))
    expect(annunciated(m)).toEqual(['CAPS', 'KANA', 'MON'])
    for (const id of ['k', 'a', 'n', 'a', '*']) press(m, keyCode(id))
    press(m, keyCode('shift'))
    press(m, keyCode('z'))
    press(m, keyCode('shift'))
    press(m, keyCode('3'))
    // ENTER, SPACE and the arrows have no kana and keep their own.
    type(m, ' ')
    press(m, keyCode('kana'))
    expect(annunciated(m)).toEqual(['CAPS', 'MON'])
    type(m, 'a')
    // The long vowel mark is drawn as - is, and reads back as it.
    expect(shown(m).at(-1)).toBe('*ﾉﾁﾐﾁ-ｯｧ A')
  })

  it('rubs out with BS, clears with CLS, and says ? to what it does not know', () => {
    const m = boot()
    type(m, 'XY')
    press(m, keyCode('bs'))
    expect(shown(m).at(-1)).toBe('*X')
    type(m, '\n')
    expect(shown(m).slice(-2)).toEqual(['?', '*'])
    press(m, keyCode('cls'))
    expect(screen(m)).toEqual(['*', '', '', '', '', ''])
  })

  it('says where BRK stopped a program even while it waits for a key in a ROM service', () => {
    const m = boot()
    enter(m, 'li t0, 2\necall\nret')
    type(m, 'G 7000\n')
    expect(m.run(1000).sleeping?.key).toBe(true)
    m.brk()
    settle(m)
    expect(shown(m).slice(-2)).toEqual([expect.stringMatching(/^BREAK AT 8[0-9A-F]{3}$/), '*'])
  })

  it('stops at an ECALL with no such service, and says so', () => {
    const m = boot()
    enter(m, 'li t0, 99\necall\nret')
    type(m, 'G 7000\n')
    expect(shown(m).slice(-2)).toEqual([expect.stringMatching(/^FAULT 000B AT 7004$/), '*'])
  })

  it('keeps SHIFT across CAPS, and lets it go with BRK', () => {
    const m = boot()
    press(m, keyCode('shift'))
    press(m, keyCode('caps'))
    press(m, keyCode('1'))
    expect(shown(m).at(-1)).toBe('*!')
    press(m, keyCode('shift'))
    m.brk()
    settle(m)
    expect(annunciated(m)).not.toContain('SHIFT')
    press(m, keyCode('1'))
    expect(shown(m).at(-1)).toBe('*1')
  })

  it('answers ? to a number that is not one, or a byte too big', () => {
    const m = boot()
    for (const line of ['E 7000 1234', 'E 7000 12 zz 34', 'D 7Q', 'G 70G0']) {
      type(m, `${line}\n`)
      expect(shown(m).slice(-2), line).toEqual(['?', '*'])
    }
    expect(m.state.ram[0x7000]).toBe(0)
  })

  it('rubs out back across a line that wrapped and scrolled', () => {
    const m = boot()
    for (let k = 0; k < 4; k++) type(m, `${k}\n`)
    type(m, 'X'.repeat(41))
    expect(shown(m).at(-1)).toBe('XX')
    press(m, keyCode('bs'))
    press(m, keyCode('bs'))
    press(m, keyCode('bs'))
    expect(shown(m).at(-1)).toBe(`*${'X'.repeat(38)}`)
  })

  it('refuses to write the ROM', () => {
    const m = boot()
    type(m, 'E 8000 00\n')
    expect(shown(m).slice(-2)).toEqual(['?READ ONLY', '*'])
  })

  it('scrolls when the screen is full, takes a line longer than it, and fits every model', () => {
    const m = boot()
    for (let k = 0; k < 8; k++) type(m, `${k}\n`)
    expect(screen(m)).toEqual(['?', '*6', '?', '*7', '?', '*'])
    type(m, `E 7000${' 00'.repeat(14)}`)
    expect(shown(m).slice(-2)).toEqual([`*E 7000${' 00'.repeat(11)}`, ' 00'.repeat(3)])
    for (const model of ['pocket-32', 'pocket-64', 'handheld-160'] as const) {
      const other = boot(model)
      expect(screen(other), model).toHaveLength(MODELS[model].height / 8)
      expect(shown(other), model).toEqual(['*'])
      type(other, 'd 0\n')
      // A narrow screen dumps four bytes a line.
      const second = model === 'handheld-160' ? '0004:' : '0008:'
      expect(
        screen(other).some((r) => r.startsWith(second)),
        model,
      ).toBe(true)
    }
  })
})
