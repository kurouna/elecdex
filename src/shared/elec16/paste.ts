/**
 * PASTE (docs/elec16.md section 7): text from the PC as the keys a person would press on the
 * machine to type it. Pure; the runner feeds the keys to the machine as its key FIFO has room.
 *
 * A letter takes SHIFT when its case is not CAPS's; a kana takes the KANA key first when the
 * machine is not in KANA mode, and a character on a key that has a kana takes it off again;
 * the mode is put back as it was at the end. Japanese text comes as the machine has it:
 * hiragana and full-width katakana as half-width kana (a voiced one as its kana and ﾞ),
 * full-width letters and digits as ASCII. A line ends with ENTER; what no key types is
 * skipped and counted.
 */

import { KANA_KEYS, keyCode, keyForChar, keyForKana } from './keys.js'

const SHIFT = keyCode('shift')
const KANA = keyCode('kana')
const ENTER = keyCode('enter')

/** The keys that type a kana in KANA mode: anything else on them needs the mode off. */
const KANA_CODES: ReadonlySet<number> = new Set(Object.keys(KANA_KEYS).map(keyCode))

/** The half-width kana in their order from U+FF61, as the full-width forms they stand for. */
const FULL_KANA =
  '。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜'

const HALF_OF: ReadonlyMap<string, string> = new Map([
  ...Array.from(FULL_KANA, (ch, k): [string, string] => [ch, String.fromCharCode(0xff61 + k)]),
  // The combining voiced marks NFD leaves after a kana, and the full-width space.
  [String.fromCharCode(0x3099), 'ﾞ'],
  [String.fromCharCode(0x309a), 'ﾟ'],
  [String.fromCharCode(0x3000), ' '],
])

/** One character of the PC's text as the machine's: half-width kana or ASCII, as it is else. */
function machineChar(ch: string): string {
  const code = ch.codePointAt(0) ?? 0
  // Hiragana as katakana: the same place, 0x60 on.
  const kata = code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : ch
  const half = HALF_OF.get(kata)
  if (half !== undefined) return half
  // Full-width ASCII.
  if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0)
  return kata
}

export interface PasteModes {
  caps: boolean
  kana: boolean
}

/** One character's keys, with the mode it leaves; null when no key types it. */
function keysOf(
  ch: string,
  caps: boolean,
  kana: boolean,
): { keys: number[]; kana: boolean } | null {
  const asKana = keyForKana(ch)
  if (asKana !== null) {
    const keys = kana ? [] : [KANA]
    if (asKana.shift) keys.push(SHIFT)
    keys.push(asKana.code)
    return { keys, kana: true }
  }
  const key = keyForChar(ch)
  if (key === null) return null
  const off = kana && KANA_CODES.has(key.code)
  const keys = off ? [KANA] : []
  // A letter's case is CAPS's unless SHIFT is pressed; another character's face is SHIFT's.
  const shift = /^[a-z]$/i.test(ch) ? (ch >= 'A' && ch <= 'Z') !== caps : key.shift
  if (shift) keys.push(SHIFT)
  keys.push(key.code)
  return { keys, kana: kana && !off }
}

/** The key codes to press, one after another, and how many characters no key types. */
export function pasteKeys(text: string, modes: PasteModes): { keys: number[]; skipped: number } {
  const keys: number[] = []
  let kana = modes.kana
  let skipped = 0
  for (const raw of text.replace(/\r\n?/g, '\n').normalize('NFD')) {
    if (raw === '\n') {
      keys.push(ENTER)
      continue
    }
    const typed = keysOf(machineChar(raw === '\t' ? ' ' : raw), modes.caps, kana)
    if (typed === null) {
      skipped++
      continue
    }
    keys.push(...typed.keys)
    kana = typed.kana
  }
  if (kana !== modes.kana) keys.push(KANA)
  return { keys, skipped }
}
