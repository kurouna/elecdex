import { afterEach, describe, expect, it, vi } from 'vitest'
import { RunFollower } from '../../src/renderer/widgets/translate/run-follower.svelte.ts'
import {
  historyDays,
  historyPair,
  historyTime,
  pickerRows,
  swapped,
  targetInfo,
  targetMode,
  targetText,
  withRecent,
} from '../../src/renderer/widgets/translate/translate-view.ts'
import type { HistoryRow } from '../../src/shared/translate/history'
import type { RunEvent, RunView } from '../../src/shared/translate/run'

/** TEXT's page side (docs/translate.md §3, §8.5): following a run, and what the view decides. */

const run = (over: Partial<RunView> = {}): RunView => ({
  paneId: 'p1',
  draftId: 'd1',
  version: 1,
  mode: 'translate',
  srcLang: 'en',
  tgtLang: 'ja',
  form: 'polite',
  state: 'running',
  reason: null,
  blocks: [
    {
      index: 0,
      lead: '',
      source: 'A.',
      text: '',
      state: 'running',
      note: null,
      tokens: null,
      ms: null,
      history: 0,
      terms: 0,
      edited: false,
      trip: null,
    },
    {
      index: 1,
      lead: '\n\n',
      source: 'B.',
      text: '',
      state: 'queued',
      note: null,
      tokens: null,
      ms: null,
      history: 0,
      terms: 0,
      edited: false,
      trip: null,
    },
  ],
  tail: '\n',
  detected: null,
  context: '',
  glossary: null,
  ...over,
})

function stubFollow() {
  const handlers: ((event: RunEvent) => void)[] = []
  let follows = 0
  let releases = 0
  vi.stubGlobal('elecdex', {
    translate: {
      follow: (_paneId: string, handler: (event: RunEvent) => void) => {
        follows++
        handlers.push(handler)
        return () => {
          releases++
        }
      },
    },
  })
  const send = (event: RunEvent) => handlers.at(-1)?.(structuredClone(event))
  return { send, follows: () => follows, releases: () => releases }
}

afterEach(() => vi.unstubAllGlobals())

describe('RunFollower', () => {
  it('takes the snapshot, then the patches in order', () => {
    const io = stubFollow()
    const follower = new RunFollower('p1')
    follower.follow()
    io.send({ paneId: 'p1', seq: 4, kind: 'snapshot', run: run() })
    io.send({
      paneId: 'p1',
      seq: 5,
      kind: 'patch',
      version: 1,
      blocks: [{ index: 0, append: 'あ' }],
    })
    io.send({
      paneId: 'p1',
      seq: 6,
      kind: 'patch',
      version: 1,
      blocks: [{ index: 0, append: '。', state: 'done' }],
      state: 'running',
    })
    expect(follower.run?.blocks[0]).toMatchObject({ text: 'あ。', state: 'done' })
    expect(io.follows()).toBe(1)
  })

  it('asks for the run again when a patch does not follow the last one', () => {
    const io = stubFollow()
    const follower = new RunFollower('p1')
    follower.follow()
    io.send({ paneId: 'p1', seq: 1, kind: 'snapshot', run: run() })
    io.send({
      paneId: 'p1',
      seq: 3,
      kind: 'patch',
      version: 1,
      blocks: [{ index: 0, append: 'x' }],
    })
    expect(io.follows()).toBe(2)
    expect(io.releases()).toBe(1)
    // Nothing of the patch it could not place.
    expect(follower.run?.blocks[0]?.text).toBe('')
  })

  it('asks again for a patch of another version', () => {
    const io = stubFollow()
    const follower = new RunFollower('p1')
    follower.follow()
    io.send({ paneId: 'p1', seq: 1, kind: 'snapshot', run: run() })
    io.send({ paneId: 'p1', seq: 2, kind: 'patch', version: 7, blocks: [] })
    expect(io.follows()).toBe(2)
  })

  it('shows nothing once CLEAR has put the run away', () => {
    const io = stubFollow()
    const follower = new RunFollower('p1')
    follower.follow()
    io.send({ paneId: 'p1', seq: 1, kind: 'snapshot', run: run({ state: 'done' }) })
    io.send({ paneId: 'p1', seq: 2, kind: 'snapshot', run: null, cleared: true })
    expect(follower.run).toBeNull()
  })

  it('keeps what it saw when main has dropped the run, and says one cut short', () => {
    const io = stubFollow()
    const follower = new RunFollower('p1')
    follower.follow()
    io.send({ paneId: 'p1', seq: 1, kind: 'snapshot', run: run() })
    io.send({ paneId: 'p1', seq: 9, kind: 'snapshot', run: null })
    expect(follower.run?.state).toBe('stopped')
    expect(follower.run?.blocks.map((b) => b.state)).toEqual(['stopped', 'none'])
    const done = run({ state: 'done' })
    io.send({ paneId: 'p1', seq: 10, kind: 'snapshot', run: done })
    io.send({ paneId: 'p1', seq: 11, kind: 'snapshot', run: null })
    expect(follower.run?.state).toBe('done')
  })
})

describe('the TEXT view', () => {
  const board = (phase: string) =>
    ({ engine: { phase }, models: [], fetch: null, selectedModel: 'm' }) as never

  it('shows the blocks, or the state when there is nothing of them to show', () => {
    expect(targetMode(board('absent'), null)).toBe('nomodel')
    expect(targetMode(board('stopped'), null)).toBe('empty')
    expect(targetMode(board('starting'), run())).toBe('boot')
    expect(targetMode(board('fault'), run({ state: 'stopped' }))).toBe('fault')
    expect(targetMode(board('ready'), run())).toBe('blocks')
  })

  it('offers Easy Japanese only as a target, under Japanese, and AUTO only as a source', () => {
    const tgt = pickerRows('tgt', [], '').map((r) => r.code)
    expect(tgt.indexOf('ja(easy)')).toBe(tgt.indexOf('ja') + 1)
    expect(tgt).not.toContain('auto')
    const src = pickerRows('src', [], '').map((r) => r.code)
    expect(src[0]).toBe('auto')
    expect(src).not.toContain('ja(easy)')
  })

  it('puts the recent languages first, and filters by code or name', () => {
    const rows = pickerRows('tgt', ['fr', 'ko'], '')
    expect(rows.slice(0, 2).map((r) => [r.group, r.code])).toEqual([
      ['recent', 'fr'],
      ['recent', 'ko'],
    ])
    expect(rows.filter((r) => r.code === 'fr')).toHaveLength(1)
    expect(pickerRows('tgt', [], 'korean').map((r) => r.code)).toEqual(['ko'])
    expect(withRecent(['fr', 'ko', 'de', 'es', 'it'], 'ko')).toEqual(['ko', 'fr', 'de', 'es', 'it'])
    expect(withRecent(['a', 'b', 'c', 'd', 'e'], 'f')).toHaveLength(5)
  })

  it('swaps Easy Japanese back as Japanese, and not from AUTO', () => {
    expect(swapped('en', 'ja(easy)')).toEqual({ src: 'ja', tgt: 'en' })
    expect(swapped('auto', 'ja')).toBeNull()
  })

  it('puts the translation together as the source was laid out', () => {
    const r = run({
      blocks: run().blocks.map((b, i) => ({ ...b, text: ['あ', 'い'][i] ?? '' })),
    })
    expect(targetText(r)).toBe('あ\n\nい\n')
  })

  it('says where a run stands', () => {
    expect(targetInfo(run({ state: 'waiting' }))).toBe('waiting for another pane')
    expect(targetInfo(run({ state: 'stopped' }))).toBe('stopped at 0 / 2')
  })
})

describe('the HISTORY list', () => {
  const row = (over: Partial<HistoryRow> = {}): HistoryRow => ({
    id: 'h1',
    at: 0,
    updatedAt: new Date(2026, 10, 6, 9, 5).getTime(),
    srcLang: 'auto',
    detected: null,
    tgtLang: 'ja',
    form: 'polite',
    source: 'Hello there.',
    target: 'こんにちは。',
    chars: 12,
    partial: null,
    ...over,
  })

  it('writes the languages, AUTO only when nothing was certain', () => {
    expect(historyPair(row())).toBe('AUTO → JA')
    expect(historyPair(row({ detected: 'en' }))).toBe('EN → JA')
    expect(historyPair(row({ srcLang: 'fr', tgtLang: 'ja(easy)' }))).toBe('FR → EASY JA')
  })

  it('puts the rows under their days, and filters by either side', () => {
    const now = new Date(2026, 10, 6, 12).getTime()
    const rows = [
      row(),
      row({
        id: 'h2',
        updatedAt: new Date(2026, 10, 5, 22).getTime(),
        source: 'Bye.',
        target: 'さようなら。',
      }),
      row({ id: 'h3', updatedAt: new Date(2026, 9, 1).getTime() }),
    ]
    expect(historyDays(rows, '', now).map((d) => [d.label, d.rows.length])).toEqual([
      ['Today', 1],
      ['Yesterday', 1],
      ['2026-10-01', 1],
    ])
    expect(historyDays(rows, 'さよう', now).map((d) => d.rows[0]?.id)).toEqual(['h2'])
    expect(historyTime(row().updatedAt)).toBe('09:05')
  })
})
