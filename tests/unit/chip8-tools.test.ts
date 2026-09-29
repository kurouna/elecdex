import { readFileSync } from 'node:fs'
import path from 'node:path'
import { disassemble } from '@shared/chip8/disasm'
import { fontBytes } from '@shared/chip8/fonts'
import { KEYPAD_CODES, KEYPAD_LAYOUT, type KeyLike, keyFate, padOf } from '@shared/chip8/keys'
import { guessPlatform } from '@shared/chip8/platform'
import { profileOf, QUIRK_PROFILES, quirksFor, quirksFromOcto } from '@shared/chip8/quirks'
import { FONT_STYLES, maxProgramSize, PLATFORMS } from '@shared/chip8/types'
import { describe, expect, it } from 'vitest'

describe('disassembly', () => {
  it.each([
    [0x00e0, 'clear'],
    [0x00c4, 'scroll-down 4'],
    [0x00ff, 'hires'],
    [0x1234, 'jump 0x234'],
    [0x2abc, 'call 0xABC'],
    [0x3a07, 'if va != 0x07 then'],
    [0x5122, 'save v1 - v2'],
    [0x7cff, 'vc += 0xFF'],
    [0x8017, 'v0 =- v1'],
    [0xb300, 'jump0 0x300'],
    [0xd125, 'sprite v1 v2 5'],
    [0xe49e, 'if v4 -key then'],
    [0xf301, 'plane 3'],
    [0xf40a, 'v4 := key'],
    [0xf730, 'i := bighex v7'],
  ])('reads %s as Octo writes it', (op, text) => {
    expect(disassemble(op)).toEqual({ text, words: 1 })
  })

  it('reads F000 NNNN as two words and a stranger as its bytes', () => {
    expect(disassemble(0xf000, 0x1234)).toEqual({ text: 'i := long 0x1234', words: 2 })
    expect(disassemble(0x5121)).toEqual({ text: '0x51 0x21', words: 1 })
    expect(disassemble(0x0123).text).toBe('0x01 0x23')
  })
})

describe('fonts', () => {
  it('has sixteen small digits in every style, and big ones after them where the style has them', () => {
    for (const style of FONT_STYLES) {
      const bytes = fontBytes(style)
      expect(bytes).toHaveLength(16 * 15)
      expect(bytes.subarray(0, 80).some((b) => b !== 0)).toBe(true)
    }
    expect(
      fontBytes('vip')
        .subarray(80)
        .every((b) => b === 0),
    ).toBe(true)
    expect(
      fontBytes('octo')
        .subarray(80)
        .some((b) => b !== 0),
    ).toBe(true)
  })
})

describe('quirk profiles', () => {
  it('name each platform by its own profile', () => {
    for (const platform of PLATFORMS) expect(profileOf(quirksFor(platform))).toBe(platform)
    expect(profileOf({ ...quirksFor('chip8'), clip: false })).toBeNull()
  })

  it('hands out copies, so a tuned machine never changes the profile', () => {
    const quirks = quirksFor('chip8')
    quirks.clip = false
    expect(QUIRK_PROFILES.chip8.clip).toBe(true)
  })

  it("reads chip8Archive's Octo flags, loadStoreQuirks the other way round", () => {
    const quirks = quirksFromOcto('chip8', {
      shiftQuirks: true,
      loadStoreQuirks: true,
      clipQuirks: false,
      vBlankQuirks: false,
      tickrate: '15',
    })
    expect(quirks).toEqual({
      ...quirksFor('chip8'),
      shiftVx: true,
      memIncrement: false,
      clip: false,
      displayWait: false,
    })
    // A flag a program does not set keeps its platform's value.
    expect(quirksFromOcto('schip', {})).toEqual(quirksFor('schip'))
    expect(quirksFromOcto('xochip', { jumpQuirks: 'yes' })).toEqual(quirksFor('xochip'))
  })
})

describe('guessing the platform', () => {
  const words = (...ops: number[]): Uint8Array =>
    new Uint8Array(ops.flatMap((w) => [w >> 8, w & 0xff]))

  it('calls a program too big for 4 KB XO-CHIP', () => {
    expect(guessPlatform(new Uint8Array(maxProgramSize('schip') + 1))).toEqual({
      platform: 'xochip',
      reason: 'size',
    })
  })

  it('reads the instructions the program reaches', () => {
    expect(guessPlatform(words(0x6000, 0x00ff, 0x1204))).toEqual({
      platform: 'schip',
      reason: 'super-instructions',
    })
    expect(guessPlatform(words(0xf000, 0x1234, 0x1204))).toEqual({
      platform: 'xochip',
      reason: 'xo-instructions',
    })
    expect(guessPlatform(words(0xf201, 0x1202))).toEqual({
      platform: 'xochip',
      reason: 'xo-instructions',
    })
    expect(guessPlatform(words(0x6000, 0x1202))).toEqual({ platform: 'chip8', reason: 'plain' })
  })

  it('never reads data as instructions', () => {
    // jump over 00FF and F000: they are sprite rows, not code.
    expect(guessPlatform(words(0x1206, 0x00ff, 0xf000, 0x1206))).toEqual({
      platform: 'chip8',
      reason: 'plain',
    })
    // A word straddling two instructions is not one either.
    expect(guessPlatform(new Uint8Array([0x60, 0x00, 0xff, 0x60]))).toEqual({
      platform: 'chip8',
      reason: 'plain',
    })
  })

  it('follows calls, both sides of a skip and the two words of F000 NNNN', () => {
    // call 0x206; hang | 0x206: if v0 != 0 then jump 0x20C; return | 0x20C: hires
    const call = words(0x2206, 0x1202, 0x0000, 0x3000, 0x120c, 0x00ee, 0x00ff)
    expect(guessPlatform(call).platform).toBe('schip')
    // if v0 != 0 then (skips the long load) ...; 0x208: scroll-down 1
    expect(guessPlatform(words(0x3000, 0xf000, 0x0000, 0x00c1)).platform).toBe('xochip')
  })

  it('guesses the test suite as it is meant', () => {
    const rom = (name: string): Uint8Array =>
      new Uint8Array(
        readFileSync(
          path.resolve(__dirname, '..', '..', 'resources', 'chip8', 'test-suite', `${name}.ch8`),
        ),
      )
    expect(guessPlatform(rom('2-ibm-logo')).platform).toBe('chip8')
    expect(guessPlatform(rom('8-scrolling')).platform).not.toBe('chip8')
  })
})

describe('keys', () => {
  const key = (code: string, extra: Partial<KeyLike> = {}): KeyLike => ({
    code,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    isComposing: false,
    repeat: false,
    ...extra,
  })

  it('lays the VIP keypad over 1234 / QWER / ASDF / ZXCV by position', () => {
    expect(KEYPAD_LAYOUT.map((row) => row.map((k) => k.key.toString(16)).join(''))).toEqual([
      '123c',
      '456d',
      '789e',
      'a0bf',
    ])
    expect(new Set(Object.values(KEYPAD_CODES)).size).toBe(16)
  })

  it("presses Octo's pads with the arrows and Space", () => {
    expect([
      padOf('ArrowUp'),
      padOf('ArrowLeft'),
      padOf('ArrowDown'),
      padOf('ArrowRight'),
      padOf('Space'),
    ]).toEqual([5, 7, 8, 9, 6])
    expect(keyFate(key('Space'), false)).toEqual({ kind: 'pad', key: 6 })
  })

  it('never takes a key held with Ctrl, Alt or the system key, or while composing', () => {
    for (const extra of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
    ]) {
      expect(keyFate(key('KeyQ', extra), false)).toEqual({ kind: 'pass' })
    }
  })

  it('leaves Tab, Escape and the function keys to the app', () => {
    for (const code of ['Tab', 'Escape', 'F1', 'F12', 'KeyG'])
      expect(keyFate(key(code), false)).toEqual({ kind: 'pass' })
  })

  it('pauses on P, steps on Enter only while paused, and swallows a repeat', () => {
    expect(keyFate(key('KeyP'), false)).toEqual({ kind: 'pause' })
    expect(keyFate(key('Enter'), false)).toEqual({ kind: 'pass' })
    expect(keyFate(key('Enter'), true)).toEqual({ kind: 'step' })
    expect(keyFate(key('KeyQ', { repeat: true }), false)).toEqual({ kind: 'swallow' })
    expect(keyFate(key('KeyP', { repeat: true }), false)).toEqual({ kind: 'swallow' })
  })
})
