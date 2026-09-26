import {
  CODEC_GROUPS,
  CODEC_OPS,
  fromBase64,
  fromHex,
  localStamp,
  readJwt,
  runCodec,
  toFullWidth,
  toHalfWidth,
} from '@shared/codec'
import { describe, expect, it } from 'vitest'

const NOW = Date.UTC(2026, 8, 27, 5, 12, 0)
const run = (op: Parameters<typeof runCodec>[0], input: string) => runCodec(op, input, NOW)

describe('encoding', () => {
  it('turns UTF-8 text into Base64, Base64URL, URL and hex', async () => {
    expect(await run('b64', 'elecdex 日本')).toEqual({ ok: true, text: 'ZWxlY2RleCDml6XmnKw=' })
    expect(await run('b64url', '>>>???')).toEqual({ ok: true, text: 'Pj4-Pz8_' })
    expect(await run('url', 'a b&c=日')).toEqual({ ok: true, text: 'a%20b%26c%3D%E6%97%A5' })
    expect(await run('hex', 'Aé')).toEqual({ ok: true, text: '41c3a9' })
  })

  it('handles a text larger than one slice of the encoder', async () => {
    const long = 'x'.repeat(100_000)
    const encoded = await run('b64', long)
    expect(encoded.ok && (await run('unb64', encoded.text))).toEqual({ ok: true, text: long })
  })
})

describe('decoding', () => {
  it('reads Base64 with or without padding, URL-safe or not, over lines', async () => {
    expect(await run('unb64', 'ZWxlY2RleCDml6XmnKw=')).toEqual({ ok: true, text: 'elecdex 日本' })
    expect(await run('unb64', 'ZWxlY2RleCDml6XmnKw')).toEqual({ ok: true, text: 'elecdex 日本' })
    expect(await run('unb64', 'Pj4-Pz8_')).toEqual({ ok: true, text: '>>>???' })
    expect(await run('unb64', 'ZWxl\nY2Rl\neA==')).toEqual({ ok: true, text: 'elecdex' })
  })

  it('shows bytes that are not text as hex, and says so', async () => {
    expect(await run('unb64', '/w==')).toEqual({
      ok: true,
      text: 'ff',
      note: '1 byte that is not UTF-8 text: shown as hex',
    })
  })

  it('says what is wrong with what is not Base64, URL-encoding or hex', async () => {
    expect(await run('unb64', 'not base64!')).toEqual({ ok: false, error: 'not Base64' })
    expect(await run('unb64', 'A')).toEqual({ ok: false, error: 'not Base64' })
    expect((await run('unurl', '%E6%97')).ok).toBe(false)
    expect((await run('unhex', 'abc')).ok).toBe(false)
    expect((await run('unhex', 'zz')).ok).toBe(false)
  })

  it('reads URL-encoding and hex in the forms people paste', async () => {
    expect(await run('unurl', 'a%20b%26c%3D%E6%97%A5')).toEqual({ ok: true, text: 'a b&c=日' })
    expect(await run('unhex', '0x41 c3:a9')).toEqual({ ok: true, text: 'Aé' })
    expect(fromHex('41-42')).toEqual(Uint8Array.from([0x41, 0x42]))
    expect(fromBase64('')).toBeNull()
  })
})

describe('a JWT', () => {
  const part = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: 'me', exp: NOW / 1000 - 60, iat: NOW / 1000 - 3600 })}.sig`

  it('is laid out as its header and payload, its times read, the signature not checked', () => {
    const result = readJwt(token, NOW)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.note).toBe('the signature is not checked')
    expect(result.text).toContain('"alg": "HS256"')
    expect(result.text).toContain('"sub": "me"')
    expect(result.text).toContain('exp   2026-09-27T05:11:00.000Z (expired)')
    expect(result.text).toContain('iat   2026-09-27T04:12:00.000Z')
  })

  it('is refused when it is not one', () => {
    expect(readJwt('abc', NOW)).toEqual({
      ok: false,
      error: 'not a JWT: two or three parts joined by dots',
    })
    expect(readJwt('a.b.c', NOW)).toEqual({
      ok: false,
      error: 'not a JWT: a part is not Base64URL JSON',
    })
  })
})

describe('hashing', () => {
  it('gives the known digests of "abc"', async () => {
    expect(await run('sha1', 'abc')).toEqual({
      ok: true,
      text: 'a9993e364706816aba3e25717850c26c9cd0d89d',
    })
    expect(await run('sha256', 'abc')).toEqual({
      ok: true,
      text: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    })
    const sha512 = await run('sha512', 'abc')
    expect(sha512.ok && sha512.text.slice(0, 16)).toBe('ddaf35a193617aba')
  })
})

describe('time', () => {
  it('reads seconds, milliseconds and dates, and nothing as now', async () => {
    const lines = (text: string) => text.split('\n')
    const seconds = await run('time', String(NOW / 1000))
    expect(seconds.ok && lines(seconds.text).slice(0, 3)).toEqual([
      `UNIX  ${NOW / 1000}`,
      `MS    ${NOW}`,
      'UTC   2026-09-27T05:12:00.000Z',
    ])
    const ms = await run('time', String(NOW))
    expect(ms.ok && lines(ms.text)[2]).toBe('UTC   2026-09-27T05:12:00.000Z')
    const iso = await run('time', '2026-09-27T05:12:00Z')
    expect(iso.ok && lines(iso.text)[0]).toBe(`UNIX  ${NOW / 1000}`)
    expect(await run('time', '')).toMatchObject({ ok: true, note: 'now' })
    expect((await run('time', 'someday')).ok).toBe(false)
  })

  it('writes the local time with its offset', () => {
    expect(localStamp(NOW)).toMatch(/^2026-09-2\d \d\d:\d2:00 [+-]\d\d:\d\d$/)
  })
})

describe('width', () => {
  it('turns full-width ASCII half and back, leaving kana alone', () => {
    expect(toHalfWidth('ＡＢＣ　１２３！ かな')).toBe('ABC 123! かな')
    expect(toFullWidth('ABC 123!')).toBe('ＡＢＣ　１２３！')
    expect(toHalfWidth(toFullWidth('~elecdex~'))).toBe('~elecdex~')
  })

  it('normalises half-width kana with NFKC', async () => {
    expect(await run('nfkc', 'ｶﾀｶﾅ ＡＢ')).toEqual({ ok: true, text: 'カタカナ AB' })
  })
})

describe('UUID', () => {
  it('is a new version 4 id each time', async () => {
    const a = await run('uuid', '')
    const b = await run('uuid', '')
    expect(a.ok && a.text).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(a).not.toEqual(b)
  })
})

describe('the operations', () => {
  it('each belong to a group, and every group has one', () => {
    for (const group of CODEC_GROUPS) expect(CODEC_OPS.some((op) => op.group === group)).toBe(true)
    expect(new Set(CODEC_OPS.map((op) => op.id)).size).toBe(CODEC_OPS.length)
  })
})
