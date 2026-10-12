import {
  badChars,
  bomOf,
  detectEncoding,
  looksBinary,
  looksGarbled,
} from '@shared/logwatch/encoding'
import { EXPLAIN_SYSTEM, explainSystem, explainText } from '@shared/logwatch/explain'
import {
  countBreaks,
  isPattern,
  lineStart,
  matchesPattern,
  patternFor,
} from '@shared/logwatch/files'
import { detectFormat, logfmtPairs } from '@shared/logwatch/formats'
import {
  BUCKET_MS,
  BUCKETS,
  bursting,
  burstLit,
  burstStreak,
  type LevelCounts,
  laneBuckets,
  ratePerSecond,
  totals,
} from '@shared/logwatch/rate'
import { LogReader, PatternMemory, splitLines } from '@shared/logwatch/reader'
import { maskText, signature, signatureText, tokens } from '@shared/logwatch/text'
import {
  groupOf,
  isLogId,
  keyOf,
  LOG_LIMITS,
  type LogLine,
  parseExplainRequest,
  parseSubscribeRequest,
} from '@shared/logwatch/types'
import { describe, expect, it } from 'vitest'

const NOW = Date.UTC(2026, 9, 12, 3, 30, 0)
const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

describe('requests from the page', () => {
  it('takes only an id, an encoding and a count', () => {
    const id = '0123456789abcdef'
    expect(parseSubscribeRequest({ id, encoding: 'auto', since: -1 })).toEqual({
      id,
      encoding: 'auto',
      since: -1,
    })
    expect(parseSubscribeRequest({ id: 'C:/x.log', encoding: 'auto', since: -1 })).toBeNull()
    expect(parseSubscribeRequest({ id, encoding: 'utf-7', since: -1 })).toBeNull()
    expect(parseSubscribeRequest({ id, encoding: 'auto', since: 1.5 })).toBeNull()
    expect(isLogId('0123456789ABCDEF')).toBe(false)
    expect(keyOf(id, 'shift_jis')).toBe(`${id}/shift_jis`)
  })

  it('checks an EXPLAIN request', () => {
    const ok = {
      id: '0123456789abcdef',
      encoding: 'auto',
      seq: 3,
      provider: '',
      model: '',
      mask: true,
    }
    expect(parseExplainRequest(ok)).toEqual(ok)
    expect(parseExplainRequest({ ...ok, seq: -1 })).toBeNull()
    expect(parseExplainRequest({ ...ok, mask: 'yes' })).toBeNull()
    expect(parseExplainRequest({ ...ok, model: 'x'.repeat(500) })).toBeNull()
  })

  it('groups levels for the filter', () => {
    expect(groupOf('TRC')).toBe('DBG')
    expect(groupOf('LOG')).toBe('INF')
    expect(groupOf('FTL')).toBe('ERR')
  })
})

describe('encoding', () => {
  it('follows a byte order mark', () => {
    expect(bomOf(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]))).toBe('utf-8')
    expect(bomOf(new Uint8Array([0xff, 0xfe]))).toBe('utf-16le')
    expect(bomOf(new Uint8Array([0xfe, 0xff]))).toBe('utf-16be')
    expect(bomOf(bytes('abc'))).toBeNull()
  })

  it('finds UTF-16 by its NULs, UTF-8 by its validity', () => {
    const le = new Uint8Array([...bytes('hello log line')].flatMap((b) => [b, 0]))
    const be = new Uint8Array([...bytes('hello log line')].flatMap((b) => [0, b]))
    expect(detectEncoding(new Uint8Array(), le)).toBe('utf-16le')
    expect(detectEncoding(new Uint8Array(), be)).toBe('utf-16be')
    expect(detectEncoding(new Uint8Array(), bytes('接続に失敗しました\n'))).toBe('utf-8')
    // A sequence cut by the end of the read is not held against UTF-8.
    expect(detectEncoding(new Uint8Array(), bytes('接続').slice(0, 4))).toBe('utf-8')
  })

  it('tells Shift_JIS from EUC-JP', () => {
    // 「接続に失敗しました」 in each.
    const sjis = new Uint8Array([
      0x90, 0xda, 0x91, 0xb1, 0x82, 0xc9, 0x8e, 0xb8, 0x94, 0x73, 0x82, 0xb5, 0x82, 0xdc, 0x82,
      0xb5, 0x82, 0xbd,
    ])
    const euc = new Uint8Array([
      0xc0, 0xdc, 0xc2, 0xb3, 0xa4, 0xcb, 0xbc, 0xba, 0xc7, 0xd4, 0xa4, 0xb7, 0xa4, 0xde, 0xa4,
      0xb7, 0xa4, 0xbf,
    ])
    expect(detectEncoding(new Uint8Array(), sjis)).toBe('shift_jis')
    expect(new TextDecoder('shift_jis').decode(sjis)).toBe('接続に失敗しました')
    expect(detectEncoding(new Uint8Array(), euc)).toBe('euc-jp')
    expect(new TextDecoder('euc-jp').decode(euc)).toBe('接続に失敗しました')
  })

  it('knows binary from text', () => {
    expect(looksBinary(new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0, 1, 2]))).toBe(true)
    expect(looksBinary(bytes('plain text\n'))).toBe(false)
    expect(looksBinary(new Uint8Array([...bytes('text')].flatMap((b) => [b, 0])))).toBe(false)
  })

  it('calls text garbled only when there is enough of it', () => {
    expect(badChars('a\ufffdb\u0085')).toBe(2)
    expect(looksGarbled(5, 100)).toBe(false)
    expect(looksGarbled(5, 300)).toBe(true)
    expect(looksGarbled(1, 300)).toBe(false)
  })
})

describe('text', () => {
  it('makes one pattern of lines that differ in their values', () => {
    const a = signature(
      'ERR',
      'worker',
      'job 3f2a9c01-aaaa-bbbb-cccc-123456789012 failed in 812ms from 10.0.0.1',
    )
    const b = signature(
      'ERR',
      'worker',
      'job 9c01aaaa-1111-2222-3333-abcdefabcdef failed in 40ms from 10.9.8.7',
    )
    expect(a).toBe(b)
    expect(signatureText(a)).toBe('job {id} failed in {n}ms from {ip}')
    expect(signature('ERR', 'db', 'x')).not.toBe(signature('WRN', 'db', 'x'))
    expect(signature('INF', '', 'user "aki" in')).toBe(signature('INF', '', 'user "rin" in'))
  })

  it('cuts a text into coloured parts, every character once', () => {
    const text = 'GET /users/12 200 31ms user="aki" from 10.0.0.1 id=ab12cd34ef'
    const parts = tokens(text)
    expect(parts.map((p) => p.text).join('')).toBe(text)
    expect(parts.filter((p) => p.kind !== 'text').map((p) => [p.kind, p.text])).toEqual([
      ['path', '/users/12'],
      ['number', '200'],
      ['number', '31ms'],
      ['key', 'user='],
      ['string', '"aki"'],
      ['address', '10.0.0.1'],
      ['key', 'id='],
      ['id', 'ab12cd34ef'],
    ])
  })

  it('masks what identifies someone or lets someone in', () => {
    expect(maskText('login rin@example.com from 10.0.0.1')).toBe('login ••• from •••')
    expect(maskText('password=hunter2 token: abc.def')).toBe('password=••• token: •••')
    expect(maskText('Authorization: Bearer eyJhbGciOi.payload')).not.toContain('eyJ')
    expect(maskText('key AKIAABCDEFGHIJKLMNOP1234567890abcd')).toBe('key •••')
    expect(maskText('peer fe80::1 and 2001:db8:0:0:0:0:2:1')).toBe('peer ••• and •••')
  })

  it('leaves times, ids and words alone when masking', () => {
    const text = 'at 12:04:01.231 job 3f2a9c01-aaaa-bbbb-cccc-123456789012 Foo::bar done'
    expect(maskText(text)).toBe(text)
  })
})

describe('a long line costs one pass', () => {
  // Found in review: unanchored runs made these quadratic - seconds of main or the page for one
  // 64 KB line of the right shape (a minified script, a hex dump, base64).
  const LONG = 64 * 1024
  const shapes = [
    'a'.repeat(LONG),
    'a.'.repeat(LONG / 2),
    'a/'.repeat(LONG / 2),
    'a+'.repeat(LONG / 2),
    'a1'.repeat(LONG / 2),
    'tokena.'.repeat(LONG / 7),
    'x@'.repeat(LONG / 2),
    '"'.repeat(LONG),
  ]
  const slowest = (run: (text: string) => unknown): number =>
    Math.max(
      ...shapes.map((text) => {
        const t = performance.now()
        run(text)
        return performance.now() - t
      }),
    )

  it('in reading a line as logfmt, colouring it and masking it', () => {
    expect(slowest((text) => logfmtPairs(text))).toBeLessThan(250)
    expect(slowest((text) => tokens(text))).toBeLessThan(250)
    expect(slowest((text) => maskText(text))).toBeLessThan(250)
    expect(slowest((text) => signature('INF', '', text))).toBeLessThan(250)
    expect(slowest((text) => detectFormat([text], NOW))).toBeLessThan(500)
  })
})

describe('PatternMemory', () => {
  it('says new once, and forgets the least recently seen first', () => {
    const memory = new PatternMemory(2)
    expect(memory.see('a')).toBe(true)
    expect(memory.see('a')).toBe(false)
    memory.see('b')
    memory.see('a')
    memory.see('c')
    expect(memory.size).toBe(2)
    expect(memory.see('b')).toBe(true)
    expect(memory.see('a')).toBe(true)
  })
})

describe('LogReader', () => {
  it('keeps the half line until its end comes', () => {
    expect(splitLines('a\r\nb\nc')).toEqual({ lines: ['a', 'b'], rest: 'c' })
    const reader = new LogReader('plain')
    expect(reader.read('first li', NOW, false)).toEqual([])
    expect(reader.read('ne\nsecond\n', NOW, false).map((l) => l.text)).toEqual(['first line'])
    expect(reader.flush().map((l) => l.text)).toEqual(['second'])
    expect(reader.flush()).toEqual([])
  })

  it('puts a stack trace under its entry, across reads', () => {
    const reader = new LogReader('generic')
    const done = [
      ...reader.read('2026-10-12 12:00:00 ERROR boom\n    at a (x.js:1)\n', NOW, false),
      ...reader.read('    at b (x.js:2)\nCaused by: y\n2026-10-12 12:00:01 INFO ok\n', NOW, false),
    ]
    expect(done).toHaveLength(1)
    expect(done[0]).toMatchObject({
      level: 'ERR',
      text: 'boom',
      more: ['    at a (x.js:1)', '    at b (x.js:2)', 'Caused by: y'],
    })
    expect(reader.flush()[0]?.text).toBe('ok')
  })

  it('takes an untimed line of timed text as a continuation', () => {
    const reader = new LogReader('generic')
    reader.read('2026-10-12 12:00:00 ERROR failed:\njava.lang.Bad: x\n', NOW, false)
    expect(reader.flush()[0]?.more).toEqual(['java.lang.Bad: x'])
  })

  it('reads a line of another kind as plain', () => {
    const reader = new LogReader('jsonl')
    const done = reader.read('{"level":30,"msg":"a"}\nWARN not json\n{"msg":"b"}\n', NOW, false)
    expect(done.map((l) => [l.level, l.text])).toEqual([
      ['INF', 'a'],
      ['WRN', 'not json'],
    ])
  })

  it('numbers lines and marks together, and times untimed lines by now', () => {
    const reader = new LogReader('plain', 10)
    const mark = reader.mark({ kind: 'mark', at: NOW, mark: 'rotated' })
    const [x] = reader.read('x\ny\n', NOW, false)
    reader.flush()
    expect(mark.seq).toBe(10)
    expect(reader.nextSeq).toBe(13)
    expect(x).toMatchObject({ seq: 11, at: NOW, timed: false })
  })

  it('calls a pattern new only after the opening lines', () => {
    const reader = new LogReader('plain')
    const opening = [...reader.read('a 1\nb 2\n', NOW, true), ...reader.flush()]
    expect(opening.map((l) => l.fresh)).toEqual([false, false])
    const live = [...reader.read('a 7\nc 3\n', NOW, false), ...reader.flush()]
    expect(live.map((l) => l.fresh)).toEqual([false, true])
  })

  it('cuts a line too long, and drops the rest of it', () => {
    const reader = new LogReader('plain')
    const long = 'x'.repeat(LOG_LIMITS.lineChars + 10)
    expect(reader.read(long, NOW, false)).toEqual([])
    const all = [...reader.read('tail of it\nnext\n', NOW, false), ...reader.flush()]
    expect(all).toHaveLength(2)
    expect(all[0]?.cut).toBe(true)
    expect(all[0]?.text).toHaveLength(LOG_LIMITS.textChars)
    expect(all[1]?.text).toBe('next')
    const whole = new LogReader('plain')
    whole.read(`${long}\n`, NOW, false)
    expect(whole.flush()[0]?.cut).toBe(true)
  })

  it('holds a line and its trace to a size, not only a count', () => {
    const reader = new LogReader('plain')
    reader.read(`${'t'.repeat(20_000)}\n  at ${'f'.repeat(20_000)}\n`, NOW, false)
    const [entry] = reader.flush()
    expect(entry?.text).toHaveLength(LOG_LIMITS.textChars)
    expect(entry?.cut).toBe(true)
    expect(entry?.more[0]).toHaveLength(LOG_LIMITS.rawChars)
  })

  it('counts continuation lines beyond those kept', () => {
    const reader = new LogReader('plain')
    const frames = Array.from({ length: LOG_LIMITS.moreLines + 3 }, (_, i) => `  at f${i}`)
    reader.read(`boom\n${frames.join('\n')}\n`, NOW, false)
    const [entry] = reader.flush()
    expect(entry?.more).toHaveLength(LOG_LIMITS.moreLines)
    expect(entry?.moreCut).toBe(3)
  })

  it('forgets the open entry when the file is replaced', () => {
    const reader = new LogReader('plain')
    reader.read('a\npartial', NOW, false)
    reader.restart()
    reader.read('b\n', NOW, false)
    expect(reader.flush().map((l) => l.text)).toEqual(['b'])
  })

  it('skips blank lines and IIS directives', () => {
    const reader = new LogReader('w3c')
    reader.read('#Fields: date time sc-status\n\n2026-10-12 00:00:00 200\n', NOW, false)
    expect(reader.flush().map((l) => l.text)).toEqual(['200'])
  })
})

const line = (at: number, level: LogLine['level'], extra: Partial<LogLine> = {}): LogLine => ({
  kind: 'line',
  seq: 0,
  at,
  timed: true,
  zoned: true,
  level,
  source: '',
  text: 't',
  fields: [],
  more: [],
  moreCut: 0,
  raw: 'raw',
  sig: '',
  fresh: false,
  cut: false,
  ...extra,
})

describe('rates', () => {
  it('counts the last five minutes by the log time', () => {
    const buckets = laneBuckets(
      [
        line(NOW - 10 * 60_000, 'ERR'),
        line(NOW - 60_000, 'WRN'),
        line(NOW, 'ERR'),
        line(NOW + 60_000, 'FTL'),
        { kind: 'mark', seq: 9, at: NOW, mark: 'rotated' },
      ],
      NOW,
    )
    expect(buckets).toHaveLength(BUCKETS)
    expect(totals(buckets)).toEqual({ DBG: 0, INF: 0, WRN: 1, ERR: 2 })
    expect(buckets.at(-1)?.ERR).toBe(2)
  })

  it('says lines a second', () => {
    const buckets: LevelCounts[] = Array.from({ length: BUCKETS }, () => ({
      DBG: 0,
      INF: 10,
      WRN: 0,
      ERR: 0,
    }))
    expect(ratePerSecond(buckets)).toBe(2)
  })

  it('calls a burst only when errors come much faster than before', () => {
    const quiet = (err: number): LevelCounts => ({ DBG: 0, INF: 0, WRN: 0, ERR: err })
    const steady = Array.from({ length: BUCKETS }, () => quiet(2))
    expect(bursting(steady)).toBe(false)
    const burst = [
      ...Array.from({ length: BUCKETS - 3 }, () => quiet(0)),
      quiet(2),
      quiet(2),
      quiet(2),
    ]
    expect(bursting(burst)).toBe(true)
    const few = [
      ...Array.from({ length: BUCKETS - 3 }, () => quiet(0)),
      quiet(1),
      quiet(1),
      quiet(1),
    ]
    expect(bursting(few)).toBe(false)
  })

  it('lights the lamp only once a burst has held', () => {
    let streak = 0
    streak = burstStreak(streak, true)
    expect(burstLit(streak)).toBe(false)
    streak = burstStreak(streak, true)
    expect(burstLit(streak)).toBe(true)
    expect(burstLit(burstStreak(streak, false))).toBe(false)
  })

  it('stops looking well before the window', () => {
    const old = Array.from({ length: 5000 }, () => line(NOW - 3_600_000, 'ERR'))
    const items = [line(NOW - 400_000, 'ERR'), ...old, line(NOW, 'INF')]
    expect(totals(laneBuckets(items, NOW))).toEqual({ DBG: 0, INF: 1, WRN: 0, ERR: 0 })
    expect(BUCKET_MS * BUCKETS).toBe(300_000)
  })
})

describe('files', () => {
  it('turns a name into the pattern of its kind', () => {
    expect(patternFor('2026-10-12T09_08_16_117Z-debug-0.log')).toBe('*-debug-*.log')
    expect(patternFor('app-20261012.log')).toBe('app-*.log')
    expect(patternFor('app.log')).toBe('app.log')
    expect(matchesPattern('2026-10-13T01_00_00_000Z-debug-0.log', '*-debug-*.log')).toBe(true)
    expect(matchesPattern('APP-1.LOG', 'app-*.log')).toBe(true)
    expect(matchesPattern('app-1.log.gz', 'app-*.log')).toBe(false)
    expect(matchesPattern('a+b.log', 'a+b.log')).toBe(true)
  })

  it('accepts only a name pattern', () => {
    expect(isPattern('*-debug-*.log')).toBe(true)
    expect(isPattern('app.log')).toBe(false)
    expect(isPattern('../*.log')).toBe(false)
    expect(isPattern('*.*')).toBe(false)
  })

  it('starts after the first break, and keeps UTF-16LE aligned', () => {
    expect(lineStart(bytes('tail\nwhole\n'), false, 'utf-8', 0)).toBe(5)
    expect(lineStart(bytes('tail\nwhole\n'), true, 'utf-8', 0)).toBe(0)
    expect(lineStart(new Uint8Array([0x61, 0, 0x0a, 0, 0x62, 0]), false, 'utf-16le', 0)).toBe(4)
    expect(lineStart(new Uint8Array([0, 0x61, 0, 0x0a, 0, 0x62]), false, 'utf-16be', 0)).toBe(4)
    expect(lineStart(bytes('no break'), false, 'utf-8', 0)).toBe(8)
  })

  it('takes no half of a UTF-16 character for a break', () => {
    // Found in review: 上 (U+4E0A) is 0A 4E in UTF-16LE; starting after its 0A read everything
    // after one byte off. "上\nA" in UTF-16LE:
    const le = new Uint8Array([0x0a, 0x4e, 0x0a, 0x00, 0x41, 0x00])
    expect(lineStart(le, false, 'utf-16le', 0)).toBe(4)
    expect(new TextDecoder('utf-16le').decode(le.subarray(4))).toBe('A')
    // The same bytes read from an odd place in the file: the even places are the odd indexes.
    const shifted = new Uint8Array([0x99, ...le])
    expect(lineStart(shifted, false, 'utf-16le', 1)).toBe(5)
    // No break at all: the end, on an even place.
    expect(lineStart(new Uint8Array([0x0a, 0x4e, 0x41]), false, 'utf-16le', 0)).toBe(2)
    expect(countBreaks(bytes('a\nb\nc'))).toBe(2)
  })
})

describe('explain', () => {
  const target = line(NOW, 'ERR', {
    raw: 'ERROR login failed for rin@example.com',
    more: ['  at auth (a.js:1)'],
    moreCut: 2,
  })

  it('sends the entry and the lines before it, masked when asked', () => {
    const before = [line(NOW - 1, 'INF', { raw: 'INFO from 10.0.0.1' })]
    const text = explainText(target, before, { file: 'app.log', format: 'generic' }, true)
    expect(text).toContain('Log file: app.log (text), values masked as •••')
    expect(text).toContain('INFO from •••')
    expect(text).toContain('ERROR login failed for •••\n  at auth (a.js:1)\n... 2 more lines')
    expect(text).not.toContain('example.com')
    expect(explainText(target, [], { file: 'a', format: 'plain' }, false)).not.toContain(
      'Lines before it',
    )
  })

  it('takes ten lines before at most, and drops the oldest when too long', () => {
    const many = Array.from({ length: 30 }, (_, i) => line(NOW, 'INF', { raw: `line ${i}` }))
    const text = explainText(target, many, { file: 'a', format: 'plain' }, false)
    expect(text).toContain('line 29')
    expect(text).toContain('line 20')
    expect(text).not.toContain('line 19')
    const long = Array.from({ length: 10 }, (_, i) =>
      line(NOW, 'INF', { raw: `${i}${'y'.repeat(3000)}` }),
    )
    const cut = explainText(target, long, { file: 'a', format: 'plain' }, false)
    expect(cut.length).toBeLessThanOrEqual(LOG_LIMITS.explainChars)
    expect(cut).toContain('login failed')
  })

  it('adds the user’s own instructions after its own', () => {
    expect(explainSystem('  ')).toBe(EXPLAIN_SYSTEM)
    expect(explainSystem('日本語で')).toBe(`${EXPLAIN_SYSTEM}\n\n日本語で`)
  })
})
