import type { LogItem, LogLine, LogMark } from '@shared/logwatch/types'
import { describe, expect, it } from 'vitest'
import {
  buildRows,
  clockText,
  columns,
  compileFilter,
  encodingLabel,
  errorMarks,
  hitParts,
  lineCardRows,
  markText,
  type Row,
  type RowFilter,
  readLogPane,
  rowAt,
  rowLines,
  rowOffsets,
  tallyPatterns,
  timeText,
} from '../../src/renderer/widgets/logwatch/view.js'

const NOW = new Date(2026, 9, 12, 12, 0, 0).getTime()

let seq = 0
const line = (extra: Partial<LogLine> = {}): LogLine => ({
  kind: 'line',
  seq: seq++,
  at: NOW,
  timed: true,
  zoned: true,
  level: 'INF',
  source: 'api',
  text: 'GET /x 200',
  fields: [],
  more: [],
  moreCut: 0,
  raw: 'raw line',
  sig: 'INF api GET /x {n}',
  fresh: false,
  cut: false,
  ...extra,
})

const ALL: RowFilter = { hidden: new Set(), muted: new Set(), match: null, fold: true }

describe('readLogPane', () => {
  it('gives every choice its default, and refuses what is not one', () => {
    expect(readLogPane(undefined)).toEqual({
      file: null,
      encoding: 'auto',
      time: 'abs',
      wrap: false,
      fold: true,
      chart: true,
      errorBar: true,
      hidden: ['DBG'],
      muted: [],
      tab: 'stream',
      mask: false,
      provider: '',
      model: '',
    })
    const odd = readLogPane({
      file: 'C:/secret.log',
      encoding: 'utf-7',
      time: 'soon',
      hidden: ['ERR', 'NOPE', 3],
      chart: false,
      errorBar: false,
      muted: Array.from({ length: 300 }, (_, i) => `s${i}`),
    })
    expect(odd).toMatchObject({
      file: null,
      encoding: 'auto',
      time: 'abs',
      hidden: ['ERR'],
      chart: false,
      errorBar: false,
    })
    expect(odd.muted).toHaveLength(200)
    expect(readLogPane({ hidden: [] }).hidden).toEqual([])
  })
})

describe('compileFilter', () => {
  it('takes text literally and /regex/ as one, keeping a bad one apart', () => {
    expect(compileFilter('  ').match).toBeNull()
    expect(compileFilter('a.b').match?.test('axb')).toBe(false)
    expect(compileFilter('A.B').match?.test('xa.bx')).toBe(true)
    expect(compileFilter('/^GET \\/x/').match?.test('GET /x 200')).toBe(true)
    expect(compileFilter('/(/')).toEqual({ match: null, bad: true })
    // A global flag would make test() remember where it stopped: it is dropped.
    expect(compileFilter('/x/g').match?.flags).toBe('')
    // Found in review: y has the same memory, and every other line went missing.
    const sticky = compileFilter('/x/y').match
    expect(sticky?.flags).toBe('')
    expect([sticky?.test('x'), sticky?.test('x'), sticky?.test('x')]).toEqual([true, true, true])
  })

  it('cuts a text where it matches', () => {
    expect(hitParts('a GET b GET', /get/i)).toEqual([
      { text: 'a ', hit: false },
      { text: 'GET', hit: true },
      { text: ' b ', hit: false },
      { text: 'GET', hit: true },
    ])
    expect(hitParts('abc', null)).toEqual([{ text: 'abc', hit: false }])
    expect(hitParts('abc', /x*/)).toEqual([{ text: 'abc', hit: false }])
  })
})

describe('buildRows', () => {
  it('folds a run of one pattern, not across a mark or a NEW line', () => {
    const items: LogItem[] = [
      line(),
      line({ at: NOW + 1 }),
      line({ at: NOW + 2 }),
      { kind: 'mark', seq: seq++, at: NOW, mark: 'rotated' },
      line(),
      line({ sig: 'other', fresh: true }),
      line({ sig: 'other' }),
    ]
    const rows = buildRows(items, ALL)
    expect(rows.map((r) => r.reps)).toEqual([3, 1, 1, 2])
    expect(rows[0]?.last.at).toBe(NOW + 2)
    expect(buildRows(items, { ...ALL, fold: false })).toHaveLength(7)
  })

  it('leaves out hidden levels, muted patterns and what the filter does not match', () => {
    const items = [
      line({ level: 'DBG', sig: 'd' }),
      line({ level: 'TRC', sig: 't' }),
      line({ level: 'ERR', sig: 'e', text: 'boom' }),
      line({ level: 'WRN', sig: 'w', source: 'db' }),
    ]
    const shown = (filter: Partial<RowFilter>) =>
      buildRows(items, { ...ALL, ...filter }).map((r) => (r.item as LogLine).sig)
    expect(shown({ hidden: new Set(['DBG']) })).toEqual(['e', 'w'])
    expect(shown({ muted: new Set(['e']) })).toEqual(['d', 't', 'w'])
    expect(shown({ match: /boom|db/ })).toEqual(['e', 'w'])
  })

  it('gives each row the line before it, for the time since', () => {
    const rows = buildRows([line({ at: NOW }), line({ sig: 'x', at: NOW + 1500 })], ALL)
    expect(timeText(rows[1] as Row, 'delta', NOW)).toBe('+1.500')
    expect(timeText(rows[0] as Row, 'delta', NOW)).toBe('+0.000')
  })
})

describe('times', () => {
  it('says a time three ways', () => {
    const row = buildRows([line({ at: NOW - 90_000 + 5 })], ALL)[0] as Row
    expect(timeText(row, 'abs', NOW)).toBe('11:58:30.005')
    expect(timeText(row, 'rel', NOW)).toBe('1m ago')
    expect(clockText(NOW)).toBe('12:00:00')
  })
})

describe('heights', () => {
  it('counts wide characters twice', () => {
    expect(columns('abc')).toBe(3)
    expect(columns('接続に')).toBe(6)
  })

  it('takes one line, or the wrapped text, and the trace when open', () => {
    const row = buildRows(
      [line({ text: 'x'.repeat(25), more: ['  at a', '  at b'], moreCut: 3 })],
      ALL,
    )[0] as Row
    expect(rowLines(row, false, false, 10)).toBe(1)
    expect(rowLines(row, false, true, 10)).toBe(3)
    expect(rowLines(row, true, false, 10)).toBe(4)
    const away: LogMark = {
      kind: 'mark',
      seq: 1,
      at: NOW,
      mark: 'away',
      from: NOW,
      lines: 1,
      until: 2,
      err: 0,
      warn: 0,
      fresh: 0,
      partial: false,
    }
    expect(rowLines({ item: away, reps: 1, last: away, prev: null }, false, false, 10)).toBe(2)
  })

  it('finds the row at a height', () => {
    const offsets = rowOffsets([1, 3, 1])
    expect([...offsets]).toEqual([0, 1, 4, 5])
    expect(rowAt(offsets, 0)).toBe(0)
    expect(rowAt(offsets, 1)).toBe(1)
    expect(rowAt(offsets, 3.9)).toBe(1)
    expect(rowAt(offsets, 4)).toBe(2)
    expect(rowAt(offsets, 99)).toBe(2)
    expect(rowAt(rowOffsets([]), 5)).toBe(0)
  })
})

describe('patterns', () => {
  it('counts each pattern, errors first, with the last minute in spans', () => {
    const items = [
      line({ sig: 'INF api a {n}', at: NOW - 1000 }),
      line({ sig: 'INF api a {n}', at: NOW - 61_000 }),
      line({ sig: 'INF api a {n}', at: NOW }),
      line({ sig: 'ERR db boom', level: 'ERR', at: NOW - 30_000 }),
    ]
    const rows = tallyPatterns(items, NOW)
    expect(rows.map((r) => [r.sig, r.count])).toEqual([
      ['ERR db boom', 1],
      ['INF api a {n}', 3],
    ])
    expect(rows[1]?.text).toBe('a {n}')
    // Now is on a five-second boundary: a second before it is the span before.
    expect(rows[1]?.recent.slice(-2)).toEqual([1, 1])
    expect(rows[1]?.recent.reduce((a, b) => a + b)).toBe(2)
    expect(rows[0]?.recent[5]).toBe(1)
  })
})

describe('error marks', () => {
  it('marks errors and warnings where they are in the stream', () => {
    const rows = buildRows(
      [
        line({ sig: 'a' }),
        line({ sig: 'b', level: 'ERR' }),
        line({ sig: 'c', level: 'WRN' }),
        line({ sig: 'd' }),
      ],
      ALL,
    )
    expect(errorMarks(rows, rowOffsets([1, 1, 1, 1]))).toEqual([
      { at: 0.25, level: 'ERR' },
      { at: 0.5, level: 'WRN' },
    ])
    expect(errorMarks([], rowOffsets([]))).toEqual([])
  })

  it('makes one mark of rows closer than a pixel, an error if any is', () => {
    // Found in review: only errors were merged, so a run of warnings was an element a row.
    const many = Array.from({ length: 2000 }, (_, i) => line({ sig: `w${i}`, level: 'WRN' }))
    many[1000] = line({ sig: 'e', level: 'ERR' })
    const rows = buildRows(many, ALL)
    const marks = errorMarks(rows, rowOffsets(rows.map(() => 1)))
    expect(marks.length).toBeLessThanOrEqual(500)
    expect(marks.some((mark) => mark.level === 'ERR')).toBe(true)
  })
})

describe('the card', () => {
  it('says what the row has no room for, masked as the row is', () => {
    const [row] = buildRows(
      [
        line({
          timed: true,
          zoned: false,
          fields: [
            ['client', '10.0.0.1'],
            ['session_id', 'abc123'],
          ],
          cut: true,
        }),
        line(),
      ],
      ALL,
    )
    const rows = lineCardRows(row as Row, true)
    expect(rows.find((r) => r.label === 'time')?.value).toContain('no zone given')
    expect(rows.find((r) => r.label === 'client')?.value).toBe('•••')
    // A field named as a secret hides its value, whatever the value looks like.
    expect(rows.find((r) => r.label === 'session_id')?.value).toBe('•••')
    expect(rows.find((r) => r.label === 'pattern')?.value).toContain('2 in a row')
    expect(rows.some((r) => r.label === 'cut')).toBe(true)
    const untimed = buildRows([line({ timed: false })], ALL)[0] as Row
    expect(lineCardRows(untimed, false)[0]?.value).toContain('when read')
  })

  it('words marks and encodings', () => {
    expect(
      markText({ kind: 'mark', seq: 0, at: NOW, mark: 'opened', lines: 1500 }, clockText),
    ).toBe('last 1,500 lines · following')
    expect(
      markText({ kind: 'mark', seq: 0, at: NOW, mark: 'switched', name: 'b.log' }, clockText),
    ).toBe('12:00:00 · switched to b.log')
    expect(encodingLabel('auto', 'shift_jis')).toBe('auto · Shift_JIS')
    expect(encodingLabel('utf-8', 'utf-8')).toBe('UTF-8')
  })
})

describe('the view at its edges', () => {
  it('reads the choices that are strings and the PATTERNS tab', () => {
    expect(
      readLogPane({
        tab: 'patterns',
        time: 'rel',
        provider: 'p1',
        model: 'm',
        mask: true,
        wrap: true,
        fold: false,
      }),
    ).toMatchObject({
      tab: 'patterns',
      time: 'rel',
      provider: 'p1',
      model: 'm',
      mask: true,
      wrap: true,
      fold: false,
    })
    expect(readLogPane({ provider: 3, model: null }).provider).toBe('')
  })

  it('says times in hours and days, a long delta whole, and a line before its predecessor', () => {
    const at = (offset: number) => buildRows([line({ at: NOW - offset })], ALL)[0] as Row
    expect(timeText(at(30_000), 'rel', NOW)).toBe('30s ago')
    expect(timeText(at(2 * 3_600_000), 'rel', NOW)).toBe('2h ago')
    expect(timeText(at(3 * 86_400_000), 'rel', NOW)).toBe('3d ago')
    expect(timeText(at(-5000), 'rel', NOW)).toBe('0s ago')
    const rows = buildRows(
      [
        line({ at: NOW }),
        line({ sig: 'b', at: NOW + 2_000_000 }),
        line({ sig: 'c', at: NOW + 1_999_000 }),
      ],
      ALL,
    )
    expect(timeText(rows[1] as Row, 'delta', NOW)).toBe('+2000')
    expect(timeText(rows[2] as Row, 'delta', NOW)).toBe('−1.000')
  })

  it('words every mark', () => {
    const rotated = markText({ kind: 'mark', seq: 0, at: NOW, mark: 'rotated' }, clockText)
    expect(rotated).toContain('the file was replaced')
    const away = markText(
      {
        kind: 'mark',
        seq: 0,
        at: NOW,
        mark: 'away',
        from: NOW - 60_000,
        lines: 1,
        err: 0,
        warn: 0,
        fresh: 0,
        partial: false,
        until: 1,
      },
      clockText,
    )
    expect(away).toBe('while hidden 11:59:00–12:00:00')
    expect(encodingLabel('auto', 'something-new')).toBe('auto · something-new')
  })

  it('makes no card for a mark, and a trace of its lines and the count past them when open', () => {
    const mark: LogMark = { kind: 'mark', seq: 0, at: NOW, mark: 'rotated' }
    expect(lineCardRows({ item: mark, reps: 1, last: mark, prev: null }, false)).toEqual([])
    expect(rowLines({ item: mark, reps: 1, last: mark, prev: null }, true, true, 10)).toBe(1)
  })

  it('marks matches with a global expression as given, and counts patterns past the minute as none in it', () => {
    expect(hitParts('a-a', /a/g).filter((p) => p.hit)).toHaveLength(2)
    const old = tallyPatterns([line({ at: NOW - 120_000 })], NOW)
    expect(old[0]?.recent.every((n) => n === 0)).toBe(true)
    expect(old[0]?.count).toBe(1)
  })
})
