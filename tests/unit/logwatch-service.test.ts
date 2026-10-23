import {
  appendFileSync,
  mkdtempSync,
  renameSync,
  rmSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { charsOf, trimHeld } from '@shared/logwatch/held'
import type { LogItem, LogLine } from '@shared/logwatch/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nodeFs } from '../../src/main/logwatch/node-fs.js'
import { DELIVER_MS, LOOK_MS, SETTLE_MS } from '../../src/main/logwatch/service.js'
import { LOG_ID as ID, lines, logWatchRig as rig } from './support/logwatch-rig'

/**
 * LogWatchService on real files in a temporary folder, with a fake clock (support/logwatch-rig.ts).
 */

const ID2 = 'fedcba9876543210'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'logwatch-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('LogWatchService', () => {
  it('opens on the last lines, then sends only what is appended', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 20))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.texts('page')).toEqual(['line 16', 'line 17', 'line 18', 'line 19', 'line 20'])
    expect(r.held('page').at(-1)).toMatchObject({ kind: 'mark', mark: 'opened', lines: 5 })
    expect(r.sent[0]?.event.status).toMatchObject({
      state: 'reading',
      format: 'plain',
      encoding: 'utf-8',
    })

    appendFileSync(file, lines(21, 22))
    r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS + DELIVER_MS * 2)
    expect(r.texts('page').slice(-2)).toEqual(['line 21', 'line 22'])
    expect(r.service.watching()).toEqual([ID])
  })

  it('reads on the second’s look when no watch event comes', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 2))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(3, 3))
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.texts('page')).toContain('line 3')
  })

  it('ignores changes to other files in the folder', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.watches.get(dir)?.('other.log')
    expect([...r.timers.values()].some((t) => t.at === r.now() + SETTLE_MS)).toBe(false)
  })

  it('reads nothing while hidden, and on coming back what came, as the latest lines', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 3).replace('INFO line 3', 'ERROR line 3'))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const before = r.held('page')
    const since = before.at(-1)?.seq ?? -1
    r.service.unsubscribe('page', ID, 'auto')
    expect(r.service.watching()).toEqual([])
    expect(r.timers.size).toBe(0)
    appendFileSync(file, `${lines(4, 5)}ERROR boom\nWARN careful\n`)
    await r.advance(60_000)
    const sentWhileHidden = r.sent.length
    r.service.subscribe('page', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    expect(r.sent.length).toBeGreaterThan(sentWhileHidden)
    const events = r.sent.slice(sentWhileHidden).map((s) => s.event)
    expect(events.every((event) => !event.reset)).toBe(true)
    const after = r.held('page')
    expect(after.slice(0, before.length)).toEqual(before)
    // No banner of its own (user decision 2026-10-12): the lines, as any others.
    expect(after.slice(before.length).map((item) => item.kind)).toEqual([
      'line',
      'line',
      'line',
      'line',
    ])
    expect(r.texts('page').slice(-4)).toEqual(['line 4', 'line 5', 'boom', 'careful'])
    const seqs = after.map((item) => item.seq)
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs)
  })

  it('reads only the end of a long gap: the latest lines', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('page').at(-1)?.seq ?? -1
    r.service.unsubscribe('page', ID, 'auto')
    appendFileSync(file, `${'x'.repeat(100)}\n`.repeat(50_000))
    appendFileSync(file, lines(2, 2, 'last'))
    r.service.subscribe('page', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    const texts = r.texts('page')
    expect(texts.at(-1)).toBe('last 2')
    // About 4 MB of the 5 MB written: the end, from its first whole line.
    expect(texts.length).toBeLessThan(45_000)
    expect(texts.slice(1, -1).every((text) => text === 'x'.repeat(100))).toBe(true)
  })

  it('shares one reading between two pages, without sending anything twice', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 3))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('a', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(4, 4))
    await r.advance(LOOK_MS)
    r.service.subscribe('b', { id: ID, encoding: 'auto', since: -1 })
    await r.advance(DELIVER_MS * 2)
    expect(r.texts('a')).toEqual(['line 1', 'line 2', 'line 3', 'line 4'])
    expect(r.texts('b')).toEqual(r.texts('a'))
    r.service.unsubscribe('a', ID, 'auto')
    appendFileSync(file, lines(5, 5))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.texts('b').at(-1)).toBe('line 5')
    expect(r.texts('a').at(-1)).toBe('line 4')
  })

  it('starts again after a rotation, and says so', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 5))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    renameSync(file, `${file}.1`)
    writeFileSync(file, lines(1, 2, 'fresh'))
    await r.advance(LOOK_MS + DELIVER_MS)
    const held = r.held('page')
    expect(held.some((item) => item.kind === 'mark' && item.mark === 'rotated')).toBe(true)
    expect(r.texts('page').slice(-2)).toEqual(['fresh 1', 'fresh 2'])
    // Truncated in place.
    writeFileSync(file, lines(1, 1, 'again'))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.texts('page').at(-1)).toBe('again 1')
  })

  it('follows the newest file of a pattern, and moves on to a newer one', async () => {
    const old = path.join(dir, 'app-1.log')
    const newer = path.join(dir, 'app-2.log')
    writeFileSync(old, lines(1, 1, 'old'))
    writeFileSync(newer, lines(1, 1, 'newer'))
    utimesSync(old, new Date(2026, 0, 1), new Date(2026, 0, 1))
    const r = rig({ [ID]: { path: dir, pattern: 'app-*.log', format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.texts('page')).toEqual(['newer 1'])
    expect(r.sent[0]?.event.status.file).toBe('app-2.log')
    writeFileSync(path.join(dir, 'app-3.log'), lines(1, 1, 'newest'))
    r.watches.get(dir)?.('app-3.log')
    await r.advance(SETTLE_MS + DELIVER_MS * 2)
    expect(r.held('page').some((item) => item.kind === 'mark' && item.mark === 'switched')).toBe(
      true,
    )
    expect(r.texts('page').at(-1)).toBe('newest 1')
  })

  it('waits for a file that is not there, and opens it once it is', async () => {
    const file = path.join(dir, 'later.log')
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.sent.at(-1)?.event.status.state).toBe('waiting')
    const told = r.sent.length
    await r.advance(LOOK_MS * 3)
    expect(r.sent.length).toBe(told)
    writeFileSync(file, lines(1, 2))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.texts('page')).toEqual(['line 1', 'line 2'])
    expect(r.sent.at(-1)?.event.status.state).toBe('reading')
  })

  it('tells a page about an id it does not know', async () => {
    const r = rig({})
    r.service.subscribe('page', { id: ID2, encoding: 'auto', since: -1 })
    expect(r.sent[0]?.event.status.state).toBe('unknown')
    expect(r.service.watching()).toEqual([])
  })

  it('decodes Shift_JIS, chosen or detected, and calls UTF-8 garbled then', async () => {
    const file = path.join(dir, 'sjis.log')
    const sjisLine = Buffer.from([
      0x45, 0x52, 0x52, 0x4f, 0x52, 0x20, 0x90, 0xda, 0x91, 0xb1, 0x82, 0xc9, 0x8e, 0xb8, 0x94,
      0x73, 0x82, 0xb5, 0x82, 0xdc, 0x82, 0xb5, 0x82, 0xbd, 0x0a,
    ])
    writeFileSync(file, Buffer.concat(Array.from({ length: 40 }, () => sjisLine)))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    r.service.subscribe('page', { id: ID, encoding: 'utf-8', since: -1 })
    await r.settle()
    expect(r.texts('page').at(-1)).toBe('接続に失敗しました')
    const utf8 = r.sent.find((s) => s.event.key === `${ID}/utf-8`)
    expect(utf8?.event.status).toMatchObject({ encoding: 'utf-8', garbled: true })
    expect(r.sent[0]?.event.status).toMatchObject({ encoding: 'shift_jis', garbled: false })
  })

  it('keeps at most the lines it is told to', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, { keep: 10 })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(2, 40))
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    const seqs = r.held('page').flatMap((item) => (item.kind === 'line' ? [item.seq] : []))
    // Lines past the ten kept are gone in main too: asked for with them, nothing is answered.
    expect(r.service.lines(ID, 'auto', seqs)).toBeNull()
    expect(r.service.lines(ID, 'auto', seqs.slice(-10))?.map((l) => l.text)).toEqual(
      Array.from({ length: 10 }, (_, i) => `line ${31 + i}`),
    )
  })

  it('gives EXPLAIN the chosen lines and only those, or nothing if one is gone', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 30))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, { initial: 2000 })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const seqOf = (text: string) =>
      r.held('page').find((item) => item.kind === 'line' && item.text === text)?.seq ?? -1
    const chosen = r.service.lines(ID, 'auto', [seqOf('line 25'), seqOf('line 3')])
    expect(chosen?.map((l) => l.text)).toEqual(['line 3', 'line 25'])
    expect(r.service.lines(ID, 'auto', [seqOf('line 25'), 12345])).toBeNull()
    expect(r.service.lines(ID, 'utf-8', [seqOf('line 25')])).toBeNull()
    // The opening mark has a number too, but is no line: never sent.
    const mark = r.held('page').find((item) => item.kind === 'mark')?.seq ?? -1
    expect(r.service.lines(ID, 'auto', [mark])).toBeNull()
  })

  it('reads afresh in a dialect set by hand', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '2026-10-12 12:00:01 INFO one\n2026-10-12 12:00:02 WARN two\n')
    const entries = { [ID]: { path: file, pattern: null, format: null as null | 'plain' } }
    const r = rig(entries)
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.sent.at(-1)?.event.status.format).toBe('generic')
    entries[ID].format = 'plain'
    r.service.reload(ID)
    await r.settle()
    expect(r.sent.at(-1)?.event).toMatchObject({ reset: true, status: { format: 'plain' } })
    expect(r.texts('page')).toEqual([
      '2026-10-12 12:00:01 INFO one',
      '2026-10-12 12:00:02 WARN two',
    ])
  })

  it('lets go of a page that went', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.service.dropPage('page')
    expect(r.service.watching()).toEqual([])
    expect(r.watches.size).toBe(0)
    expect(r.timers.size).toBe(0)
  })

  it('sends every line of a long gap once, in order, with a beat in the middle of reading it', async () => {
    // Found in review: a beat between two chunks of the gap sent lines to nobody (the only page
    // was still waiting), and a line never arrived.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let gate: (() => void) | null = null
    let gated = false
    const reads: number[] = []
    const r = rig(
      { [ID]: { path: file, pattern: null, format: null } },
      {
        keep: 200_000,
        fs: {
          read: async (target, start, length) => {
            reads.push(start)
            if (
              !gated &&
              start > 0 &&
              start < 2_000_000 &&
              reads.filter((s) => s > 0).length === 2
            ) {
              gated = true
              await new Promise<void>((resolve) => {
                gate = resolve
              })
            }
            return nodeFs.read(target, start, length)
          },
        },
      },
    )
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('page').at(-1)?.seq ?? -1
    r.service.unsubscribe('page', ID, 'auto')
    appendFileSync(file, lines(2, 120_001))
    r.service.subscribe('page', { id: ID, encoding: 'auto', since })
    // Real reads: waited for, not counted in turns of the loop.
    for (let i = 0; i < 400 && gate === null; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    expect(gate).not.toBeNull()
    r.fire(DELIVER_MS * 2)
    ;(gate as unknown as () => void)()
    await r.advance(DELIVER_MS * 2)
    const held = r.held('page')
    const seqs = held.map((item) => item.seq)
    expect(new Set(seqs).size).toBe(seqs.length)
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs)
    const texts = r.texts('page')
    expect(texts).toHaveLength(120_001)
    expect(texts.at(-1)).toBe('line 120001')
  })

  it('judges a file opened empty once lines come, and a quiet one by its first line', async () => {
    // Found in review: a file empty when opened was read as plain UTF-8 for good.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '')
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const json = (i: number) =>
      `${JSON.stringify({ level: 'warn', name: 'db', msg: `slow ${i}` })}\n`
    appendFileSync(file, Array.from({ length: 25 }, (_, i) => json(i)).join(''))
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.sent.at(-1)?.event.status.format).toBe('jsonl')
    const line = r.held('page').find((item) => item.kind === 'line') as LogLine | undefined
    expect(line).toMatchObject({ level: 'WRN', source: 'db', text: 'slow 0' })
    expect(r.texts('page')).toHaveLength(25)

    const quiet = path.join(dir, 'quiet.log')
    writeFileSync(quiet, '')
    const q = rig({ [ID2]: { path: quiet, pattern: null, format: null } })
    q.service.subscribe('page', { id: ID2, encoding: 'auto', since: -1 })
    await q.settle()
    appendFileSync(quiet, '2026-10-12 12:00:00 ERROR one\n')
    await q.advance(LOOK_MS + DELIVER_MS * 3)
    expect(q.sent.at(-1)?.event.status.format).toBe('generic')
    expect(q.texts('page', `${ID2}/auto`)).toEqual(['one'])
  })

  it('tells every page waiting for a file that is not there', async () => {
    // Found in review: the state was remembered per channel, so a second page was never told.
    const r = rig({ [ID]: { path: path.join(dir, 'none.log'), pattern: null, format: null } })
    r.service.subscribe('a', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.service.subscribe('b', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    for (const page of ['a', 'b']) {
      expect(r.sent.filter((s) => s.page === page).at(-1)?.event.status.state).toBe('waiting')
    }
  })

  it('tells a page following a state that changed in the beat another page came', async () => {
    // Found in review: the page brought up to date marked the state as sent for every page.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('a', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('a').at(-1)?.seq ?? -1
    unlinkSync(file)
    r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS)
    r.service.subscribe('b', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    for (const page of ['a', 'b']) {
      expect(r.sent.filter((s) => s.page === page).at(-1)?.event.status.state).toBe('waiting')
    }
  })

  it('judges a file written without a line break once enough has come, not holding it all', async () => {
    // Found in review: a file opened empty kept every byte until a line break came.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '')
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, `progress ${'#'.repeat(100_000)}\r`)
    r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS + LOOK_MS + DELIVER_MS)
    expect(r.sent.at(-1)?.event.status.state).toBe('reading')
    expect(r.texts('page').some((text) => text.startsWith('progress'))).toBe(true)
  })

  it('lists the folder of a pattern again only for a name that could be a newer file', async () => {
    // Found in review: every append to the file being read listed the whole folder again.
    writeFileSync(path.join(dir, 'app-1.log'), lines(1, 1))
    writeFileSync(path.join(dir, 'other.txt'), 'x')
    let listed = 0
    const r = rig(
      { [ID]: { path: dir, pattern: 'app-*.log', format: null } },
      {
        fs: {
          list: async (folder) => {
            listed++
            return nodeFs.list(folder)
          },
        },
      },
    )
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const before = listed
    appendFileSync(path.join(dir, 'app-1.log'), lines(2, 2))
    r.watches.get(dir)?.('app-1.log')
    await r.advance(SETTLE_MS + DELIVER_MS)
    r.watches.get(dir)?.('other.txt')
    await r.advance(SETTLE_MS + DELIVER_MS)
    expect(listed).toBe(before)
    expect(r.texts('page').at(-1)).toBe('line 2')
    r.watches.get(dir)?.('app-2.log')
    await r.advance(SETTLE_MS + DELIVER_MS)
    expect(listed).toBe(before + 1)
  })

  it('lists the folder of a pattern by the clock, not at every settle of a busy file', async () => {
    // Found in review: counted in calls, the folder was listed every ~2 s on a busy file.
    writeFileSync(path.join(dir, 'app-1.log'), lines(1, 1))
    let listed = 0
    const r = rig(
      { [ID]: { path: dir, pattern: 'app-*.log', format: null } },
      {
        fs: {
          list: async (folder) => {
            listed++
            return nodeFs.list(folder)
          },
        },
      },
    )
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const before = listed
    for (let i = 0; i < 20; i++) {
      appendFileSync(path.join(dir, 'app-1.log'), lines(2 + i, 2 + i))
      r.watches.get(dir)?.('app-1.log')
      await r.advance(SETTLE_MS + 100)
    }
    // Six seconds of appends: under the ten seconds between listings.
    expect(listed).toBe(before)
    await r.advance(10_000)
    expect(listed).toBeGreaterThan(before)
  })

  it('holds no more than the lines kept as soon as the setting is lowered', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 5))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.limits.keep = 2
    await r.advance(DELIVER_MS * 2)
    const first = r.held('page').find((item) => item.kind === 'line')?.seq ?? -1
    expect(r.service.lines(ID, 'auto', [first])).toBeNull()
  })

  it('holds the same lines in main and the page, by the same rule, past the lines kept', async () => {
    // Found checking the review's fixes: main and the page held by different rules.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, { keep: 10 })
    const page = (): LogItem[] => {
      let items: LogItem[] = []
      for (const { event } of r.sent) {
        items = event.reset ? [...event.items] : [...items, ...event.items]
        trimHeld(
          items,
          10,
          items.reduce((n, item) => n + charsOf(item), 0),
        )
      }
      return items
    }
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(2, 41))
    await r.advance(LOOK_MS + DELIVER_MS)
    const held = page()
    expect(held.map((item) => (item.kind === 'line' ? item.text : item.mark))).toEqual(
      Array.from({ length: 10 }, (_, i) => `line ${32 + i}`),
    )
    expect(
      r.service.lines(
        ID,
        'auto',
        held.map((item) => item.seq),
      ),
    ).toHaveLength(10)
  })

  it('forgets the bytes of a file not yet judged when it is replaced', async () => {
    // Found checking the review's fixes: the old file's bytes stayed in front of the new one's.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '')
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, 'OLD half')
    await r.advance(LOOK_MS)
    renameSync(file, `${file}.1`)
    writeFileSync(file, '2026-10-12 12:00:00 INFO new\n')
    await r.advance(LOOK_MS + DELIVER_MS * 3)
    expect(r.texts('page')).toEqual(['new'])
  })
})
