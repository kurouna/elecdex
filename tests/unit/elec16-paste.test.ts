import { keyCode } from '@shared/elec16/keys'
import { pasteKeys } from '@shared/elec16/paste'
import { describe, expect, it } from 'vitest'

/** PASTE's keys (docs/elec16.md section 7), named for reading. */
const named = (codes: readonly number[]): string[] =>
  codes.map((c) => {
    for (const id of ['shift', 'kana', 'enter', ' ', 'a', 'b', 'k', 'z', '1', '3', '(', '-', '*']) {
      if (keyCode(id) === c) return id
    }
    return `#${c}`
  })

describe('PASTE', () => {
  it('types letters in the case asked for, whatever CAPS is, and a line as ENTER', () => {
    expect(named(pasteKeys('aB\r\n', { caps: true, kana: false }).keys)).toEqual([
      'shift',
      'a',
      'b',
      'enter',
    ])
    expect(named(pasteKeys('aB\n', { caps: false, kana: false }).keys)).toEqual([
      'a',
      'shift',
      'b',
      'enter',
    ])
    // A symbol on a shifted face takes SHIFT; one on a key's face does not.
    expect(named(pasteKeys('!1', { caps: true, kana: false }).keys)).toEqual(['shift', '1', '1'])
  })

  it('goes into KANA mode for a kana, out for what shares its key, and back as it was', () => {
    expect(named(pasteKeys('ｱ1', { caps: true, kana: false }).keys)).toEqual([
      'kana',
      '3',
      'kana',
      '1',
    ])
    // A space has no kana: the mode stays for it.
    expect(named(pasteKeys('ｯ ｧ', { caps: true, kana: true }).keys)).toEqual([
      'shift',
      'z',
      ' ',
      'shift',
      '3',
    ])
  })

  it('takes Japanese text as the machine has it, and counts what no key types', () => {
    // Hiragana, full-width katakana with a voiced mark, the long vowel and full-width letters.
    expect(named(pasteKeys('かガー', { caps: true, kana: false }).keys)).toEqual(
      named(pasteKeys('ｶｶﾞｰ', { caps: true, kana: false }).keys),
    )
    expect(named(pasteKeys('Ａ', { caps: true, kana: false }).keys)).toEqual(['a'])
    const { keys, skipped } = pasteKeys('a漢😀\tb', { caps: true, kana: false })
    expect(named(keys)).toEqual(['shift', 'a', ' ', 'shift', 'b'])
    expect(skipped).toBe(2)
  })
})
