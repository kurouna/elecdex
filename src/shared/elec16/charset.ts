/**
 * Text between the PC and the machine's character set (docs/elec16.md section 5): 20-7E are
 * ASCII, A1-DF the half-width kana (U+FF61-FF9F). IMPORT turns a .bas listing into the
 * machine's bytes, a line a CR; EXPORT turns them back, a line a CRLF. Pure.
 */

const CR = 0x0d
const LF = 0x0a

/** A character the machine has as a byte; null when it has none. */
function byteOf(code: number): number | null {
  if (code >= 0x20 && code <= 0x7e) return code
  if (code >= 0xff61 && code <= 0xff9f) return code - 0xff61 + 0xa1
  if (code === 0x09) return 0x20
  return null
}

/**
 * A text file's lines as the machine's bytes, each ended by a CR (CRLF, LF or CR in the file
 * alike; blank lines dropped); or the first character it cannot show, with its line.
 */
export function toMachineText(text: string): { bytes: Uint8Array } | { problem: string } {
  const out: number[] = []
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/)
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n] ?? ''
    if (line.trim() === '') continue
    for (const ch of line) {
      const b = byteOf(ch.codePointAt(0) ?? 0)
      if (b === null) {
        const shown = ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')
        return { problem: `Line ${n + 1} has "${ch}" (U+${shown}), which the ELEC-16 cannot show.` }
      }
      out.push(b)
    }
    out.push(CR)
  }
  return { bytes: new Uint8Array(out) }
}

/**
 * A source CODE keeps on the card (.TS): every line as it is, blank ones too, each ended by a
 * CR, in the machine's characters (a tab as a space); or the first character it has none for.
 */
export function sourceToMachine(text: string): { bytes: Uint8Array } | { problem: string } {
  const out: number[] = []
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  for (let n = 0; n < lines.length; n++) {
    for (const ch of lines[n] ?? '') {
      const b = byteOf(ch.codePointAt(0) ?? 0)
      if (b === null) {
        const shown = ch.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')
        return { problem: `Line ${n + 1} has "${ch}" (U+${shown}), which the ELEC-16 cannot keep.` }
      }
      out.push(b)
    }
    out.push(CR)
  }
  return { bytes: new Uint8Array(out) }
}

/** A .TS source from the card as the editor's text: a line a LF. */
export const sourceFromMachine = (bytes: Uint8Array): string =>
  fromMachineText(bytes).replace(/\r\n/g, '\n')

/** The machine's text as a PC's: a line a CRLF, kana as half-width kana, other bytes dropped. */
export function fromMachineText(bytes: Uint8Array): string {
  let out = ''
  for (const b of bytes) {
    if (b === CR) out += '\r\n'
    else if (b === LF) continue
    else if (b >= 0x20 && b <= 0x7e) out += String.fromCharCode(b)
    else if (b >= 0xa1 && b <= 0xdf) out += String.fromCharCode(b - 0xa1 + 0xff61)
  }
  return out
}

/**
 * A card name from a PC file's name: letters and digits made upper case, the stem cut to
 * eight and the extension (`ext` when given) to three; IMPORT when nothing is left.
 */
export function cardNameOf(fileName: string, ext?: string): string {
  const base = (fileName.split(/[\\/]/).pop() ?? '').toUpperCase()
  const dot = base.lastIndexOf('.')
  const stemPart = dot > 0 ? base.slice(0, dot) : base
  const extPart = ext ?? (dot > 0 ? base.slice(dot + 1) : '')
  const stem = stemPart.replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'IMPORT'
  const extension = extPart.replace(/[^A-Z0-9]/g, '').slice(0, 3)
  return extension === '' ? stem : `${stem}.${extension}`
}
