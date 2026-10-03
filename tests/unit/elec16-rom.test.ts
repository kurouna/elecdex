import { existsSync, readFileSync } from 'node:fs'
import { assemble, ramImage } from '@shared/elec16/asm'
import { screenText } from '@shared/elec16/font'
import { keyCode, keyForChar } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { MODELS, type ModelId } from '@shared/elec16/map'
import { buildRom } from '@shared/elec16/rom'
import { ANNUNCIATORS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'

/**
 * The ROM (resources/elec16/rom, docs/elec16.md section 6) run in the machine as the pane
 * runs it: keys pressed one at a time, the screen read back through the font.
 */

const DIR = 'resources/elec16/rom/'
const built = buildRom((name) => (existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null))

/** Runs until the machine waits for a key (or stops). */
function settle(m: Elec16): void {
  for (let k = 0; k < 100; k++) {
    const r = m.run(200_000)
    if (r.sleeping !== null || r.halted !== null) return
  }
  throw new Error('the ROM never waited for a key')
}

function boot(model?: ModelId): Elec16 {
  const m = Elec16.boot(built.image, model)
  settle(m)
  return m
}

function press(m: Elec16, code: number): void {
  m.press(code)
  m.release(code)
  settle(m)
}

/** Types text as the page does: a symbol on a key's shifted face takes SHIFT first. */
function type(m: Elec16, text: string): void {
  for (const ch of text) {
    if (ch === '\n') {
      press(m, keyCode('enter'))
      continue
    }
    const key = keyForChar(ch)
    if (key === null) throw new Error(`no key types ${ch}`)
    if (key.shift) press(m, keyCode('shift'))
    press(m, key.code)
  }
}

const screen = (m: Elec16): string[] => {
  const { width, height } = MODELS[m.state.model]
  return screenText(m.state.vram, width, height).map((line) => line.trimEnd())
}

/** The screen's rows down to the cursor's: the last is the line being typed. */
const shown = (m: Elec16): string[] => screen(m).slice(0, (m.state.lcd.cursor >> 8) + 1)

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

const annunciated = (m: Elec16): string[] =>
  ANNUNCIATORS.filter((_, bit) => (m.state.lcd.annunciators & (1 << bit)) !== 0)

describe('the ROM', () => {
  it('is built from its sources into the fixed 16 KB, with its labels', () => {
    expect(built.errors).toEqual([])
    expect(built.image).toHaveLength(0x4000)
    expect(built.symbols.start).toBeGreaterThanOrEqual(0x8000)
    expect(built.symbols.services).toBe(0x8010)
    expect(built.symbols.font).toBeLessThan(0xc000)
  })

  it('starts at the monitor, waiting for a key at its prompt', () => {
    const m = boot()
    expect(shown(m)).toEqual(['ELEC-16 MONITOR 0.1', '*'])
    expect(m.run(1000).sleeping).toEqual({ key: true, timerMs: null })
    expect(annunciated(m)).toEqual(['CAPS', 'MON'])
    expect(m.state.lcd.cursor).toBe((1 << 8) | 1)
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
      expect(shown(other), model).toEqual(['ELEC-16 MONITOR 0.1', '*'])
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
