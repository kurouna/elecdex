import { existsSync, readFileSync } from 'node:fs'
import { fontTable, glyphColumns, screenText } from '@shared/elec16/font'
import {
  CONTROL,
  KEY_BY_ID,
  kanaTable,
  keyForChar,
  keyForKana,
  keyTable,
  MACHINE_KEYS,
} from '@shared/elec16/keys'
import { buildRom, romFile, romFromFile } from '@shared/elec16/rom'
import { KEY_ROWS } from '@shared/elec16/state'
import { describe, expect, it } from 'vitest'
import romJson from '../../src/renderer/widgets/elec16/rom.json'

/**
 * The tables the ROM and the page share (docs/elec16.md sections 5 to 7): one source each,
 * in TypeScript, and the ROM file the page loads, built from them.
 */

const DIR = 'resources/elec16/rom/'

describe('the ROM file', () => {
  it('is what the sources build now (run npm run gen:elec16 after changing them)', () => {
    const built = buildRom((name) =>
      existsSync(DIR + name) ? readFileSync(DIR + name, 'utf8') : null,
    )
    expect(built.errors).toEqual([])
    expect(romJson).toEqual(romFile(built))
    expect(romFromFile(romJson)).toEqual(built.image)
  })

  it('refuses a file that is not a ROM', () => {
    expect(romFromFile({ image: 'not base64!', symbols: {} })).toBeNull()
    expect(romFromFile({ image: 'AAAA', symbols: {} })).toBeNull()
  })
})

describe('the font', () => {
  it('draws every character from space to the block apart from every other', () => {
    const seen = new Map<string, number>()
    for (let code = 0x20; code < 0x80; code++) {
      const key = glyphColumns(code).join()
      expect(
        seen.get(key),
        `${code.toString(16)} looks like ${seen.get(key)?.toString(16)}`,
      ).toBeUndefined()
      seen.set(key, code)
      // Seven rows: bit 7 of a column is the gap below.
      expect(glyphColumns(code).every((b) => b < 0x80)).toBe(true)
    }
    expect(fontTable()).toHaveLength(224 * 5)
  })

  it('draws every kana apart from every other character, but the long vowel mark as -', () => {
    const ascii = new Set(Array.from({ length: 0x60 }, (_, k) => glyphColumns(0x20 + k).join()))
    const kana = new Set<string>()
    for (let code = 0xa1; code <= 0xdf; code++) {
      const key = glyphColumns(code).join()
      expect(kana.has(key), code.toString(16)).toBe(false)
      kana.add(key)
      expect(ascii.has(key), code.toString(16)).toBe(code === 0xb0)
    }
    const vram = new Uint8Array(24)
    ;[0xb1, 0xb0, 0xdd, 0xdf].forEach((code, k) => {
      vram.set(glyphColumns(code), k * 6)
    })
    expect(screenText(vram, 24, 8)).toEqual(['ｱ-ﾝﾟ'])
  })

  it('reads a screen back into its text, a cell that is no character as ?', () => {
    const width = 24
    const vram = new Uint8Array(width * 2)
    ;[...'HI!'].forEach((ch, k) => {
      vram.set(glyphColumns(ch.charCodeAt(0)), k * 6)
    })
    vram[width + 2] = 0xff
    expect(screenText(vram, width, 16)).toEqual(['HI! ', '?   '])
  })
})

describe('the keys', () => {
  it('type every half-width kana in KANA mode, each from one key and face', () => {
    const table = kanaTable(KEY_ROWS * 8)
    const typed = new Set<number>()
    for (let k = 0; k < 63; k++) {
      const ch = String.fromCharCode(0xff61 + k)
      const key = keyForKana(ch)
      expect(key, ch).not.toBeNull()
      if (key === null) continue
      const byte = table[key.code * 2 + (key.shift ? 1 : 0)]
      expect(byte, ch).toBe(0xa1 + k)
      typed.add(key.code * 2 + (key.shift ? 1 : 0))
    }
    // A key with no small form gives its kana with SHIFT too, so that face types nothing new.
    expect(typed.size).toBe(63)
    expect([...table].every((b) => b === 0 || (b >= 0xa1 && b <= 0xdf))).toBe(true)
  })

  it('each have their own code within the matrix, and their own id', () => {
    const codes = MACHINE_KEYS.map((k) => k.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(Math.max(...codes)).toBeLessThan(KEY_ROWS * 8)
    expect(KEY_BY_ID.size).toBe(MACHINE_KEYS.length)
    // A game reads the arrows, SPACE, ENTER and SHIFT from row 0.
    for (const id of ['up', 'down', 'left', 'right', ' ', 'enter', 'shift']) {
      expect(KEY_BY_ID.get(id)?.code, id).toBeLessThan(8)
    }
  })

  it('type every printable character, each from one key with or without SHIFT', () => {
    for (let c = 0x20; c < 0x7f; c++) {
      const ch = String.fromCharCode(c)
      const key = keyForChar(ch)
      expect(key, ch).not.toBeNull()
      const machine = MACHINE_KEYS.find((k) => k.code === key?.code)
      const made = key?.shift ? machine?.shifted : machine?.char
      expect(made, ch).toBe(ch.toLowerCase().charCodeAt(0))
    }
    expect(keyForChar('é')).toBeNull()
  })

  it('leave a letter key without a symbol, so SHIFT only changes its case', () => {
    for (const key of MACHINE_KEYS) {
      if (key.char >= 0x61 && key.char <= 0x7a) expect(key.shifted, key.id).toBe(0)
    }
  })

  it('give the ROM two bytes a code, controls below space', () => {
    const table = keyTable(KEY_ROWS * 8)
    expect(table).toHaveLength(160)
    const enter = KEY_BY_ID.get('enter')
    expect(table[(enter?.code ?? 0) * 2]).toBe(CONTROL.enter)
    for (const value of Object.values(CONTROL)) expect(value).toBeLessThan(0x20)
  })
})
