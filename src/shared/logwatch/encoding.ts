import type { LogEncoding } from './types.js'

/**
 * Which encoding a log is written in, judged from its bytes (docs/logwatch.md §4.1), and
 * whether text decoded with one looks garbled. Pure: bytes in, a name out.
 *
 * `auto` is decided once, from the first bytes read, and never changed on its own while the
 * pane follows: lines read one way and then another would be harder to make out than lines
 * read wrong throughout, which the user can put right with one choice.
 */

const SAMPLE = 64 * 1024

/** A byte order mark's encoding, or null. */
export function bomOf(bytes: Uint8Array): LogEncoding | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8'
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le'
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be'
  return null
}

/** UTF-16 without a mark: ASCII text leaves a NUL in every other byte. */
function utf16Of(bytes: Uint8Array): LogEncoding | null {
  const n = Math.min(bytes.length, SAMPLE) & ~1
  if (n < 8) return null
  let evenNul = 0
  let oddNul = 0
  for (let i = 0; i < n; i += 2) {
    if (bytes[i] === 0) evenNul++
    if (bytes[i + 1] === 0) oddNul++
  }
  const pairs = n / 2
  if (oddNul > pairs * 0.3 && evenNul < pairs * 0.05) return 'utf-16le'
  if (evenNul > pairs * 0.3 && oddNul < pairs * 0.05) return 'utf-16be'
  return null
}

/** Valid UTF-8, a sequence cut at the end of the sample forgiven. */
function isUtf8(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, SAMPLE)
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(sample, { stream: true })
    return true
  } catch {
    return false
  }
}

/** Replacement characters and C1 controls in a text: what a wrong encoding leaves. */
export function badChars(text: string): number {
  let bad = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code === 0xfffd || (code >= 0x80 && code < 0xa0)) bad++
  }
  return bad
}

function badShare(bytes: Uint8Array, encoding: LogEncoding): number {
  const text = new TextDecoder(encoding).decode(bytes.subarray(0, SAMPLE))
  return text.length === 0 ? 0 : badChars(text) / text.length
}

/**
 * Half-width katakana: EUC-JP read as Shift_JIS comes out as runs of them (Shift_JIS's single
 * bytes A1-DF), where it leaves no replacement character; a log written in Shift_JIS has few.
 */
function halfWidthShare(bytes: Uint8Array): number {
  const text = new TextDecoder('shift_jis').decode(bytes.subarray(0, SAMPLE))
  let kana = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0xff61 && code <= 0xff9f) kana++
  }
  return text.length === 0 ? 0 : kana / text.length
}

/**
 * The encoding of a log, from its first bytes (`head`, for a mark) and the bytes about to be
 * read (`sample`): a mark, then UTF-16's NULs, then UTF-8 if it is valid, then whichever of
 * Shift_JIS and EUC-JP leaves fewer bad characters, and Windows-1252 when both leave many.
 */
export function detectEncoding(head: Uint8Array, sample: Uint8Array): LogEncoding {
  const marked = bomOf(head)
  if (marked !== null) return marked
  const wide = utf16Of(sample)
  if (wide !== null) return wide
  if (isUtf8(sample)) return 'utf-8'
  const sjis = badShare(sample, 'shift_jis')
  const euc = badShare(sample, 'euc-jp')
  if (Math.min(sjis, euc) > 0.01) return 'windows-1252'
  return sjis + halfWidthShare(sample) / 2 <= euc ? 'shift_jis' : 'euc-jp'
}

/**
 * A file that is not text: a NUL where no UTF-16 would put one. Checked on the first bytes when
 * a file is chosen.
 */
export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 8192)
  if (bomOf(sample) !== null || utf16Of(sample) !== null) return false
  return sample.includes(0)
}

/** The share of bad characters above which the pane offers another encoding. */
export const GARBLED_SHARE = 0.01

/** Text decoded wrongly, to the eye: enough bad characters among enough text to judge by. */
export function looksGarbled(bad: number, chars: number): boolean {
  return chars >= 200 && bad / chars > GARBLED_SHARE
}
