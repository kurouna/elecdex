import { badChars, detectEncoding, looksBinary } from '@shared/logwatch/encoding'
import { detectFormat, formatState, parseHead, parseTime } from '@shared/logwatch/formats'
import {
  groupOf,
  isEncodingChoice,
  isExplainToken,
  isLogFormat,
  type LogFormat,
} from '@shared/logwatch/types'
import { describe, expect, it } from 'vitest'

/**
 * The dialects at their edges: every level number, times that are no time, fields that are not
 * text, syslog's "-" for nothing, an access line with nothing after its size, IIS's missing
 * columns, and what detection does with a mix.
 */

const NOW = new Date(2026, 9, 12, 12, 30, 0).getTime()

const head = (format: LogFormat, line: string) => {
  const read = parseHead(line, formatState(format), NOW)
  if (read === null || read === 'skip') throw new Error(`not a head: ${line}`)
  return read
}

describe('JSON lines at the edges', () => {
  it('reads every level pino and bunyan write', () => {
    const levels = [10, 20, 30, 40, 50, 60, 5].map(
      (n) => head('jsonl', `{"level":${n},"msg":"x"}`).level,
    )
    expect(levels).toEqual(['TRC', 'DBG', 'INF', 'WRN', 'ERR', 'FTL', 'LOG'])
    expect(head('jsonl', '{"level":"chatty","msg":"x"}').level).toBe('LOG')
    expect(head('jsonl', '{"level":true,"msg":"x"}').level).toBe('LOG')
  })

  it('reads epoch seconds and milliseconds, and no time from a small number or a word', () => {
    expect(head('jsonl', '{"time":1791779041,"msg":"x"}').at).toBe(1791779041000)
    expect(head('jsonl', '{"ts":1791779041231,"msg":"x"}').at).toBe(1791779041231)
    expect(head('jsonl', '{"time":12,"msg":"x"}')).toMatchObject({ at: null, zoned: false })
    expect(head('jsonl', '{"time":"soon","msg":"x"}').at).toBeNull()
  })

  it('writes out a message or field that is not text, and keeps it short', () => {
    expect(head('jsonl', '{"msg":{"a":1}}').text).toBe('{"a":1}')
    const long = head('jsonl', `{"msg":"m","blob":"${'x'.repeat(1000)}","n":null,"list":[1,2]}`)
    expect(long.fields).toEqual([
      ['blob', 'x'.repeat(300)],
      ['n', 'null'],
      ['list', '[1,2]'],
    ])
  })

  it('is no head for JSON that is not an object', () => {
    for (const line of ['{"a":1', '["x"]', 'null', '"text"']) {
      expect(parseHead(line, formatState('jsonl'), NOW)).toBeNull()
    }
  })
})

describe('logfmt at the edges', () => {
  it('reads quoted values with escapes, and keeps a key with no value', () => {
    const read = head('logfmt', 'level=error msg="said \\"no\\" twice" empty= code=7')
    expect(read).toMatchObject({ level: 'ERR', text: 'said "no" twice' })
    expect(read.fields).toEqual([
      ['empty', ''],
      ['code', '7'],
    ])
  })
})

describe('syslog at the edges', () => {
  it('reads RFC 5424 with "-" for what it has not', () => {
    const read = head('syslog', '<14>1 - - - - - - plain words')
    expect(read).toMatchObject({ at: null, level: 'INF', source: '', text: 'plain words' })
    expect(read.fields).toEqual([['host', '-']])
  })

  it('takes the level from a 3164 line without a priority by its first word', () => {
    expect(head('syslog', 'Oct 12 12:00:00 host app: WARNING disk low').level).toBe('WRN')
  })

  it('is no head for a month that is not one, or a day past the month', () => {
    expect(parseHead('Foo 12 12:00:00 host app: x', formatState('syslog'), NOW)).toBeNull()
    expect(parseHead('Oct 99 12:00:00 host app: x', formatState('syslog'), NOW)).toBeNull()
  })
})

describe('access logs at the edges', () => {
  it('reads a line that ends after its size, with "-" for no user', () => {
    const read = head('clf', '1.2.3.4 - - [12/Oct/2026:12:00:00 +0900] "GET / HTTP/1.1" 304 -')
    expect(read).toMatchObject({ level: 'INF', text: 'GET / HTTP/1.1 304 -' })
    expect(read.fields).toEqual([['client', '1.2.3.4']])
  })

  it('takes a time in a month that is not one as none', () => {
    expect(head('clf', '1.2.3.4 - u [12/Xyz/2026:12:00:00 +0900] "GET /" 200 1').at).toBeNull()
  })
})

describe('W3C at the edges', () => {
  it('reads a line without date, query or time taken', () => {
    const state = formatState('w3c')
    parseHead('#Fields: cs-method cs-uri-stem cs-uri-query sc-status', state, NOW)
    const read = parseHead('GET /a q=1 200', state, NOW)
    expect(read).toMatchObject({ at: null, zoned: false, text: 'GET /a?q=1 200', level: 'INF' })
    parseHead('#Fields: cs-method cs-uri-stem', state, NOW)
    expect(parseHead('POST /b', state, NOW)).toMatchObject({ level: 'LOG', text: 'POST /b' })
    // A line with more or fewer columns than named is not one of them.
    expect(parseHead('POST /b extra', state, NOW)).toBeNull()
  })
})

describe('text with a time at the edges', () => {
  it('reads a bracketed time, a time of day alone, and a line that is only a time', () => {
    expect(head('generic', '[12:04:01] <ERROR> worker: x')).toMatchObject({ level: 'ERR' })
    expect(head('generic', '2026-10-12T12:00:00.123456789Z TRACE deep')).toMatchObject({
      level: 'TRC',
      text: 'deep',
    })
    expect(head('generic', '2026-10-12 12:00:00')).toMatchObject({ text: '', level: 'LOG' })
  })

  it('is no head for a date that is not one', () => {
    expect(parseHead('2026-02-30 25:00:00 INFO x', formatState('generic'), NOW)).toBeNull()
  })

  it('reads times with a comma and an offset written without a colon', () => {
    expect(parseTime('2026-10-12 12:00:00,250+0900', NOW)?.at).toBe(
      Date.UTC(2026, 9, 12, 3, 0, 0, 250),
    )
  })
})

describe('detection at the edges', () => {
  it('takes the dialect of most lines, and plain under six in ten', () => {
    const mixed = ['{"msg":"a"}', '{"msg":"b"}', '{"msg":"c"}', 'plain', 'plain']
    expect(detectFormat(mixed, NOW)).toBe('jsonl')
    expect(detectFormat(['{"msg":"a"}', 'plain', 'plain', 'plain'], NOW)).toBe('plain')
    expect(detectFormat(['', '   ', ''], NOW)).toBe('plain')
  })
})

describe('encoding at the edges', () => {
  it('falls back to Windows-1252 when no Japanese reading is clean', () => {
    const latin = new Uint8Array(
      [...'caf'].map((c) => c.charCodeAt(0)).concat([0xe9, 0x20, 0x80, 0x99, 0xff, 0xfe, 0x81]),
    )
    expect(
      detectEncoding(
        new Uint8Array(),
        new Uint8Array(Array.from({ length: 20 }, () => [...latin]).flat()),
      ),
    ).toBe('windows-1252')
    expect(detectEncoding(new Uint8Array(), new Uint8Array())).toBe('utf-8')
  })

  it('counts C1 controls as bad, and sees binary only past a mark-less NUL', () => {
    expect(badChars('\u0080\u009f ')).toBe(2)
    expect(looksBinary(new Uint8Array([0xff, 0xfe, 0x41, 0x00]))).toBe(false)
    expect(
      looksBinary(new Uint8Array([0x41, 0x42, 0x00, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49])),
    ).toBe(true)
  })
})

describe('checks of what the page sends', () => {
  it('knows the names it accepts and nothing else', () => {
    expect(isEncodingChoice('shift_jis')).toBe(true)
    expect(isEncodingChoice('SHIFT_JIS')).toBe(false)
    expect(isLogFormat('w3c')).toBe(true)
    expect(isLogFormat('xml')).toBe(false)
    expect(isExplainToken('0f1e2d3c-aaaa-bbbb-cccc-000000000000')).toBe(true)
    expect(isExplainToken('short')).toBe(false)
    expect(isExplainToken('../../etc')).toBe(false)
    expect(groupOf('INF')).toBe('INF')
  })
})
