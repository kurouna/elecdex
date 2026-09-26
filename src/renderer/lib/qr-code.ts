import { QR_CAPACITY, type QrCode } from '@shared/qr'
import type { QrEcc } from '@shared/utility'
import qrcode from 'qrcode-generator'

/**
 * The UTILITY pane's QR code itself, made by qrcode-generator from the text's
 * UTF-8 bytes, so Japanese goes in as it is. Page-only: the library is
 * bundled into the page and never shipped for main (package-deps.test.ts).
 */

const encoder = new TextEncoder()

export type QrBuild =
  | { kind: 'code'; code: QrCode }
  | { kind: 'empty' }
  | { kind: 'over'; bytes: number; capacity: number }

/** The code for a text, the smallest version that holds it. */
export function qrBuild(text: string, ecc: QrEcc): QrBuild {
  if (text === '') return { kind: 'empty' }
  const bytes = encoder.encode(text)
  const capacity = QR_CAPACITY[ecc]
  if (bytes.length > capacity) return { kind: 'over', bytes: bytes.length, capacity }
  // The library reads a string one byte per character: hand it the UTF-8 bytes as such.
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  const qr = qrcode(0, ecc)
  qr.addData(binary, 'Byte')
  try {
    qr.make()
  } catch {
    return { kind: 'over', bytes: bytes.length, capacity }
  }
  const size = qr.getModuleCount()
  const modules = new Uint8Array(size * size)
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) modules[row * size + col] = qr.isDark(row, col) ? 1 : 0
  }
  return { kind: 'code', code: { size, version: (size - 17) / 4, modules, bytes: bytes.length } }
}
