import {
  detectFormat,
  formatState,
  isStackLine,
  levelFromSeverity,
  levelFromWord,
  logfmtPairs,
  parseHead,
  parseTime,
  plainHead,
} from '@shared/logwatch/formats'
import type { LogFormat } from '@shared/logwatch/types'
import { describe, expect, it } from 'vitest'

const NOW = new Date(2026, 9, 12, 12, 30, 0).getTime()
const local = (...parts: [number, number, number, number, number, number, number?]): number =>
  new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6] ?? 0).getTime()

const head = (format: LogFormat, line: string) => {
  const read = parseHead(line, formatState(format), NOW)
  if (read === null || read === 'skip') throw new Error(`not a head: ${line}`)
  return read
}

describe('levels', () => {
  it('folds every spelling', () => {
    expect(levelFromWord('Warning')).toBe('WRN')
    expect(levelFromWord('INFORMATION')).toBe('INF')
    expect(levelFromWord('crit')).toBe('FTL')
    expect(levelFromWord('verbose')).toBe('TRC')
    expect(levelFromWord('chatty')).toBeNull()
  })

  it('reads syslog severities', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(levelFromSeverity)).toEqual([
      'FTL',
      'FTL',
      'FTL',
      'ERR',
      'WRN',
      'INF',
      'INF',
      'DBG',
    ])
  })
})

describe('parseTime', () => {
  it('reads ISO with and without a zone', () => {
    expect(parseTime('2026-10-12T03:04:01.231Z', NOW)).toEqual({
      at: Date.UTC(2026, 9, 12, 3, 4, 1, 231),
      zoned: true,
    })
    expect(parseTime('2026-10-12 12:04:01+09:00', NOW)).toEqual({
      at: Date.UTC(2026, 9, 12, 3, 4, 1),
      zoned: true,
    })
    expect(parseTime('2026/10/12 12:04:01,5', NOW)).toEqual({
      at: local(2026, 9, 12, 12, 4, 1, 500),
      zoned: false,
    })
  })

  it('takes a time of day as today, or yesterday when today is ahead', () => {
    expect(parseTime('12:04:01.123', NOW)?.at).toBe(local(2026, 9, 12, 12, 4, 1, 123))
    expect(parseTime('23:59:00', NOW)?.at).toBe(local(2026, 9, 11, 23, 59, 0))
  })

  it('reads the access log time', () => {
    expect(parseTime('10/Oct/2026:13:55:36 -0700', NOW)?.at).toBe(Date.UTC(2026, 9, 10, 20, 55, 36))
  })

  it('refuses what is no date', () => {
    expect(parseTime('2026-13-40 99:99:99', NOW)).toBeNull()
    expect(parseTime('hello', NOW)).toBeNull()
  })
})

describe('JSON lines', () => {
  it('reads pino', () => {
    const read = head(
      'jsonl',
      '{"level":50,"time":1791779041231,"pid":12,"name":"worker","msg":"job failed","job":"a1"}',
    )
    expect(read).toMatchObject({
      at: 1791779041231,
      zoned: true,
      level: 'ERR',
      source: 'worker',
      text: 'job failed',
    })
    expect(read.fields).toEqual([
      ['pid', '12'],
      ['job', 'a1'],
    ])
  })

  it('reads Serilog compact, whose Information has no level', () => {
    expect(
      head('jsonl', '{"@t":"2026-10-12T03:00:00Z","@mt":"Started {App}","App":"x"}'),
    ).toMatchObject({ level: 'INF', text: 'Started {App}' })
  })

  it('says what a line without a message holds', () => {
    expect(head('jsonl', '{"a":1,"b":"two"}').text).toBe('a=1 b=two')
  })

  it('is not a head when it is not an object', () => {
    expect(parseHead('[1,2]', formatState('jsonl'), NOW)).toBeNull()
    expect(parseHead('{broken', formatState('jsonl'), NOW)).toBeNull()
  })
})

describe('logfmt', () => {
  it('reads pairs that make the line', () => {
    expect(logfmtPairs('level=info msg="hello world" took=3ms')).toEqual({
      level: 'info',
      msg: 'hello world',
      took: '3ms',
    })
    expect(logfmtPairs('just some words with a=b in them')).toBeNull()
  })

  it('reads an entry', () => {
    expect(
      head('logfmt', 'time=2026-10-12T03:00:00Z level=warn logger=db msg="slow query" ms=812'),
    ).toMatchObject({ level: 'WRN', source: 'db', text: 'slow query', fields: [['ms', '812']] })
  })
})

describe('syslog', () => {
  it('reads RFC 3164 with and without a priority', () => {
    expect(head('syslog', '<11>Oct 12 12:04:01 host sshd[42]: Failed password')).toMatchObject({
      at: local(2026, 9, 12, 12, 4, 1),
      level: 'ERR',
      source: 'sshd',
      text: 'Failed password',
    })
    expect(head('syslog', 'Oct 12 12:04:01 host kernel: usb 1-1: new device')).toMatchObject({
      level: 'LOG',
      source: 'kernel',
    })
  })

  it('puts a December line in last year in January', () => {
    const jan = new Date(2027, 0, 2).getTime()
    const read = parseHead('Dec 31 23:00:00 host cron: ran', formatState('syslog'), jan)
    expect(read !== null && read !== 'skip' && new Date(read.at ?? 0).getFullYear()).toBe(2026)
  })

  it('reads RFC 5424', () => {
    expect(
      head('syslog', '<165>1 2026-10-12T03:04:01.003Z mymachine evntslog 77 ID47 - An event'),
    ).toMatchObject({ level: 'INF', source: 'evntslog', text: 'An event', zoned: true })
  })
})

describe('access logs', () => {
  it('reads the combined format, its level by the status', () => {
    const line =
      '10.0.0.1 - frank [10/Oct/2026:13:55:36 -0700] "GET /a.gif HTTP/1.0" 503 2326 "http://x/" "Mozilla"'
    expect(head('clf', line)).toMatchObject({ level: 'ERR', text: 'GET /a.gif HTTP/1.0 503 2326' })
    expect(head('clf', line.replace('503', '404')).level).toBe('WRN')
    expect(head('clf', line.replace('503', '200')).level).toBe('INF')
  })
})

describe('W3C', () => {
  it('reads columns named by #Fields, in UTC', () => {
    const state = formatState('w3c')
    expect(parseHead('#Software: Microsoft Internet Information Services', state, NOW)).toBe('skip')
    expect(
      parseHead(
        '#Fields: date time s-ip cs-method cs-uri-stem cs-uri-query sc-status time-taken',
        state,
        NOW,
      ),
    ).toBe('skip')
    const read = parseHead('2026-10-12 03:04:01 10.0.0.2 GET /api - 500 31', state, NOW)
    expect(read).toMatchObject({
      at: Date.UTC(2026, 9, 12, 3, 4, 1),
      level: 'ERR',
      text: 'GET /api 500 31ms',
    })
  })

  it('is no head before the columns are named', () => {
    expect(parseHead('2026-10-12 03:04:01 x', formatState('w3c'), NOW)).toBeNull()
  })
})

describe('generic text', () => {
  it('reads time, level and source in either order', () => {
    expect(head('generic', '2026-10-12 12:04:01.231 [INFO] [main] started')).toMatchObject({
      at: local(2026, 9, 12, 12, 4, 1, 231),
      level: 'INF',
      source: 'main',
      text: 'started',
    })
    expect(head('generic', '2026-10-12 12:04:01 [main] ERROR boom')).toMatchObject({
      level: 'ERR',
      source: 'main',
      text: 'boom',
    })
    expect(head('generic', '12:04:01 | WARN | low disk')).toMatchObject({
      level: 'WRN',
      text: 'low disk',
    })
    expect(head('generic', '[2026-10-12T03:04:01Z] just text').level).toBe('LOG')
  })

  it('is no head without a time', () => {
    expect(parseHead('INFO hello', formatState('generic'), NOW)).toBeNull()
  })
})

describe('plain', () => {
  it('takes a level only from the start', () => {
    expect(plainHead('ERROR: disk full')).toMatchObject({ level: 'ERR', text: 'disk full' })
    expect(plainHead('the error was handled')).toMatchObject({ level: 'LOG' })
  })
})

describe('stack lines', () => {
  it('knows frames and tracebacks', () => {
    expect(isStackLine('    at f (a.js:1:2)', false)).toBe(true)
    expect(isStackLine('at f (a.js:1:2)', false)).toBe(true)
    expect(isStackLine('Caused by: x', false)).toBe(true)
    expect(isStackLine('Traceback (most recent call last):', false)).toBe(true)
    expect(isStackLine('ValueError: bad', true)).toBe(true)
    expect(isStackLine('ValueError: bad', false)).toBe(false)
    expect(isStackLine('a line', false)).toBe(false)
  })
})

describe('detectFormat', () => {
  const lines = (...items: string[]) => items

  it('knows each dialect from a sample', () => {
    expect(detectFormat(lines('{"level":30,"msg":"a"}', '{"level":40,"msg":"b"}'), NOW)).toBe(
      'jsonl',
    )
    expect(detectFormat(lines('level=info msg=a x=1', 'level=warn msg=b x=2'), NOW)).toBe('logfmt')
    expect(detectFormat(lines('Oct 12 12:04:01 h a: x', 'Oct 12 12:04:02 h b[1]: y'), NOW)).toBe(
      'syslog',
    )
    expect(
      detectFormat(lines('1.2.3.4 - - [10/Oct/2026:13:55:36 -0700] "GET / HTTP/1.1" 200 1'), NOW),
    ).toBe('clf')
    expect(detectFormat(lines('#Fields: date time', '2026-10-12 00:00:00'), NOW)).toBe('w3c')
    expect(detectFormat(lines('just words', 'more words'), NOW)).toBe('plain')
    expect(detectFormat([], NOW)).toBe('plain')
  })

  it('judges timed text by its heads, not its stack frames', () => {
    expect(
      detectFormat(
        lines(
          '2026-10-12 12:00:00 ERROR boom',
          'java.lang.IllegalStateException: x',
          '    at a.b(C.java:1)',
          '    at a.c(C.java:2)',
          '    at a.d(C.java:3)',
          '2026-10-12 12:00:01 INFO ok',
        ),
        NOW,
      ),
    ).toBe('generic')
  })
})
