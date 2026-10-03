/**
 * Base64 by hand, for the emulators' bytes in text (a CHIP-8 preview, the ELEC-16 ROM file):
 * the cores have no Node Buffer and no DOM btoa (docs/emu.md).
 */

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Bytes as base64, padded. */
export function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let k = 0; k < bytes.length; k += 3) {
    const a = bytes[k] ?? 0
    const b = bytes[k + 1] ?? 0
    const c = bytes[k + 2] ?? 0
    const n = (a << 16) | (b << 8) | c
    out += BASE64[(n >> 18) & 63] ?? ''
    out += BASE64[(n >> 12) & 63] ?? ''
    out += k + 1 < bytes.length ? (BASE64[(n >> 6) & 63] ?? '') : '='
    out += k + 2 < bytes.length ? (BASE64[n & 63] ?? '') : '='
  }
  return out
}

/** Base64 back to bytes; null for text that is not padded base64. */
export function fromBase64(text: string): Uint8Array | null {
  if (text.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) return null
  const pad = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0
  const out = new Uint8Array((text.length / 4) * 3 - pad)
  let at = 0
  for (let k = 0; k < text.length; k += 4) {
    let n = 0
    for (let j = 0; j < 4; j++) {
      const ch = text[k + j] ?? '='
      n = (n << 6) | (ch === '=' ? 0 : BASE64.indexOf(ch))
    }
    for (let j = 0; j < 3 && at < out.length; j++) out[at++] = (n >> (16 - 8 * j)) & 255
  }
  return out
}
