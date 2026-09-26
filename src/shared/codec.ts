/**
 * The UTILITY pane's CODEC (docs/architecture.md section 5.16): text turned
 * into another form - encoded, decoded, hashed, a time read both ways, widths
 * changed - by pure functions, in the page, with no network.
 *
 * Text is UTF-8 wherever bytes are meant. A decoding whose bytes are not UTF-8
 * text is shown as hex, and says so, rather than as mojibake.
 */

export type CodecGroup = 'encode' | 'decode' | 'hash' | 'time' | 'width' | 'uuid'

export const CODEC_OPS = [
  { id: 'b64', group: 'encode', label: 'BASE64' },
  { id: 'b64url', group: 'encode', label: 'BASE64URL' },
  { id: 'url', group: 'encode', label: 'URL' },
  { id: 'hex', group: 'encode', label: 'HEX' },
  { id: 'unb64', group: 'decode', label: 'BASE64' },
  { id: 'unurl', group: 'decode', label: 'URL' },
  { id: 'unhex', group: 'decode', label: 'HEX' },
  { id: 'jwt', group: 'decode', label: 'JWT' },
  { id: 'sha1', group: 'hash', label: 'SHA-1' },
  { id: 'sha256', group: 'hash', label: 'SHA-256' },
  { id: 'sha512', group: 'hash', label: 'SHA-512' },
  { id: 'time', group: 'time', label: 'UNIX ⇄ DATE' },
  { id: 'half', group: 'width', label: '→ HALF' },
  { id: 'full', group: 'width', label: '→ FULL' },
  { id: 'nfkc', group: 'width', label: 'NFKC' },
  { id: 'uuid', group: 'uuid', label: 'UUID v4' },
] as const satisfies readonly { id: string; group: CodecGroup; label: string }[]

export type CodecOp = (typeof CODEC_OPS)[number]['id']

export const CODEC_GROUPS: readonly CodecGroup[] = [
  'encode',
  'decode',
  'hash',
  'time',
  'width',
  'uuid',
]

/** The longest input taken: longer text is cut, and the pane says so. */
export const CODEC_MAX_CHARS = 200_000

export type CodecResult = { ok: true; text: string; note?: string } | { ok: false; error: string }

const encoder = new TextEncoder()

const ok = (text: string, note?: string): CodecResult =>
  note === undefined ? { ok: true, text } : { ok: true, text, note }
const fail = (error: string): CodecResult => ({ ok: false, error })

export function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0')
  return out
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  // In slices: a spread of a large array would pass the engine's argument limit.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

/** Base64 or Base64URL, with or without padding and line breaks; null when it is neither. */
export function fromBase64(input: string): Uint8Array | null {
  const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (clean === '' || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return null
  const body = clean.replace(/=+$/, '')
  if (body.length % 4 === 1) return null
  try {
    const binary = atob(body + '='.repeat((4 - (body.length % 4)) % 4))
    return Uint8Array.from(binary, (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

/** Hex, with spaces, colons or a 0x in it or not; null when it is not whole bytes of hex. */
export function fromHex(input: string): Uint8Array | null {
  const clean = input.replace(/0x/gi, '').replace(/[\s:,-]+/g, '')
  if (clean === '' || clean.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(clean)) return null
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i += 1)
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

/** Decoded bytes as text, or as hex with a note when they are not UTF-8. */
function bytesOut(bytes: Uint8Array): CodecResult {
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    const n = bytes.length
    return ok(
      toHex(bytes),
      `${n} ${n === 1 ? 'byte that is' : 'bytes that are'} not UTF-8 text: shown as hex`,
    )
  }
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0')

/** A moment in this machine's time zone: `2026-09-27 14:12:00 +09:00`. */
export function localStamp(ms: number): string {
  const d = new Date(ms)
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  )
}

/** Below this a number is taken for seconds, from it for milliseconds (year 5138 in seconds). */
const MS_FROM = 1e11

/**
 * A time read both ways: a Unix time (seconds, or milliseconds when it is that
 * large) or a date anything Date understands; nothing is now.
 */
export function readTime(input: string, now: number): CodecResult {
  const trimmed = input.trim()
  let ms: number
  if (trimmed === '') ms = now
  else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const value = Number(trimmed)
    ms = Math.abs(value) < MS_FROM ? value * 1000 : value
  } else ms = Date.parse(trimmed)
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15)
    return fail('not a time: a Unix time or a date')
  const rows = [
    ['UNIX', String(Math.floor(ms / 1000))],
    ['MS', String(Math.round(ms))],
    ['UTC', new Date(ms).toISOString()],
    ['LOCAL', localStamp(ms)],
  ]
  return ok(
    rows.map(([name, value]) => `${(name ?? '').padEnd(6)}${value}`).join('\n'),
    trimmed === '' ? 'now' : undefined,
  )
}

/** Full-width ASCII and the ideographic space made half-width; everything else as it is. */
export function toHalfWidth(input: string): string {
  return input
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
}

/** Printable ASCII and the space made full-width; everything else as it is. */
export function toFullWidth(input: string): string {
  return input
    .replace(/[\x21-\x7E]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0))
    .replace(/ /g, '　')
}

/** A JWT's claims that are times, read out under the JSON. */
const TIME_CLAIMS = ['exp', 'iat', 'nbf'] as const

/** A JWT's header and payload, laid out; the signature is not checked, and the note says so. */
export function readJwt(input: string, now: number): CodecResult {
  const parts = input.trim().split('.')
  if (parts.length < 2 || parts.length > 3)
    return fail('not a JWT: two or three parts joined by dots')
  const json = (part: string): Record<string, unknown> | null => {
    const bytes = fromBase64(part)
    if (bytes === null) return null
    try {
      const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  const header = json(parts[0] ?? '')
  const payload = json(parts[1] ?? '')
  if (header === null || payload === null) return fail('not a JWT: a part is not Base64URL JSON')
  const times = TIME_CLAIMS.flatMap((claim) => {
    const value = payload[claim]
    if (typeof value !== 'number') return []
    const at = value * 1000
    const late = claim === 'exp' && at <= now ? ' (expired)' : ''
    return [`${claim.padEnd(6)}${new Date(at).toISOString()}${late}`]
  })
  const text = [
    '// header',
    JSON.stringify(header, null, 2),
    '// payload',
    JSON.stringify(payload, null, 2),
    ...(times.length > 0 ? ['', ...times] : []),
  ].join('\n')
  return ok(text, 'the signature is not checked')
}

const HASHES = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' } as const

/**
 * Runs one operation on the input. Hashes are WebCrypto's, so the answer is a
 * promise for every operation alike. `now` is the time TIME reads an empty
 * input as, and JWT tells expiry by.
 */
export async function runCodec(op: CodecOp, input: string, now: number): Promise<CodecResult> {
  switch (op) {
    case 'b64':
      return ok(toBase64(encoder.encode(input)))
    case 'b64url':
      return ok(
        toBase64(encoder.encode(input)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
      )
    case 'url':
      return ok(encodeURIComponent(input))
    case 'hex':
      return ok(toHex(encoder.encode(input)))
    case 'unb64': {
      const bytes = fromBase64(input)
      return bytes === null ? fail('not Base64') : bytesOut(bytes)
    }
    case 'unurl':
      try {
        return ok(decodeURIComponent(input))
      } catch {
        return fail('not URL-encoded: a % without two hex digits after it')
      }
    case 'unhex': {
      const bytes = fromHex(input)
      return bytes === null ? fail('not hex: pairs of 0-9 and a-f') : bytesOut(bytes)
    }
    case 'jwt':
      return readJwt(input, now)
    case 'sha1':
    case 'sha256':
    case 'sha512': {
      const digest = await crypto.subtle.digest(HASHES[op], encoder.encode(input))
      return ok(toHex(new Uint8Array(digest)))
    }
    case 'time':
      return readTime(input, now)
    case 'half':
      return ok(toHalfWidth(input))
    case 'full':
      return ok(toFullWidth(input))
    case 'nfkc':
      return ok(input.normalize('NFKC'))
    case 'uuid':
      return ok(crypto.randomUUID())
  }
}

/** Whether an operation reads its input at all: UUID makes a new one each time instead. */
export const takesInput = (op: CodecOp): boolean => op !== 'uuid'
