import { appendFileSync, mkdtempSync, renameSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { LogItem, LogLine, LogWatchEvent } from '@shared/logwatch/types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { LogEntryRecord } from '../../src/main/logwatch/catalog.js'
import { nodeFs } from '../../src/main/logwatch/node-fs.js'
import {
  DELIVER_MS,
  LOOK_MS,
  type LogFs,
  LogWatchService,
  SETTLE_MS,
} from '../../src/main/logwatch/service.js'

/**
 * LogWatchService on real files in a temporary folder, with a fake clock: the watch is ours to
 * fire, so what is read is what the test says, when it says.
 */

const ID = '0123456789abcdef'
const ID2 = 'fedcba9876543210'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'logwatch-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const lines = (from: number, to: number, word = 'line'): string =>
  Array.from({ length: to - from + 1 }, (_, i) => `INFO ${word} ${from + i}\n`).join('')

function rig(
  entries: Record<string, Omit<LogEntryRecord, 'id' | 'lastUsed'>>,
  keep = 5000,
  initial = 5,
  fsOverride: Partial<LogFs> = {},
) {
  const limits = { keep }
  let now = Date.UTC(2026, 9, 12, 3, 0, 0, 100)
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const sent: { page: string; event: LogWatchEvent }[] = []
  const watches = new Map<string, (name: string | null) => void>()
  const service = new LogWatchService<string>({
    fs: {
      ...nodeFs,
      ...fsOverride,
      watch: (folder, onChange) => {
        watches.set(folder, onChange)
        return { close: () => watches.delete(folder) }
      },
    },
    entry: (id) => {
      const entry = entries[id]
      return entry === undefined ? null : { id, lastUsed: 0, ...entry }
    },
    keepLines: () => limits.keep,
    initialLines: () => initial,
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextTimer++
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (id) => {
      timers.delete(id as number)
    },
    send: (page, event) => sent.push({ page, event: structuredClone(event) }),
  })
  const settle = async () => {
    for (let i = 0; i < 5; i++) {
      await service.settled()
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
  return {
    service,
    limits,
    sent,
    watches,
    timers,
    settle,
    now: () => now,
    /** Everything a page was sent, as it would hold it. */
    held(page: string, key = `${ID}/auto`): LogItem[] {
      let items: LogItem[] = []
      for (const { page: to, event } of sent) {
        if (to !== page || event.key !== key) continue
        items = event.reset ? [...event.items] : [...items, ...event.items]
      }
      return items
    },
    texts(page: string, key?: string): string[] {
      return this.held(page, key)
        .filter((item): item is LogLine => item.kind === 'line')
        .map((line) => line.text)
    },
    /** Runs the timers due within `ms` without waiting for reads: a beat in the middle of one. */
    fire(ms: number) {
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
      }
      now = end
    },
    async advance(ms: number) {
      await settle()
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
        await settle()
      }
      now = end
      await settle()
    },
  }
}

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

  it('reads nothing while hidden, and the gap with a banner on coming back', async () => {
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
    const away = after.find((item) => item.kind === 'mark' && item.mark === 'away')
    expect(away).toMatchObject({ lines: 4, err: 1, warn: 1, partial: false })
    expect(r.texts('page').slice(-4)).toEqual(['line 4', 'line 5', 'boom', 'careful'])
    // The banner sits before what it sums up, by place and by number.
    const at = after.indexOf(away as LogItem)
    expect(after[at + 1]).toMatchObject({ text: 'line 4' })
    const seqs = after.map((item) => item.seq)
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs)
  })

  it('reads only the end of a long gap, and says so', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('page').at(-1)?.seq ?? -1
    r.service.unsubscribe('page', ID, 'auto')
    appendFileSync(file, `${'x'.repeat(100)}\n`.repeat(50_000))
    r.service.subscribe('page', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    const away = r.held('page').find((item) => item.kind === 'mark' && item.mark === 'away')
    expect(away).toMatchObject({ partial: true })
    expect(r.texts('page').every((text) => text === 'line 1' || text === 'x'.repeat(100))).toBe(
      true,
    )
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
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, 10, 5)
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(2, 40))
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    const context = r.service.context(ID, 'auto', r.held('page').at(-1)?.seq ?? 0)
    expect(context?.target.text).toBe('line 40')
    expect(context?.before.map((l) => l.text)).toEqual(
      Array.from({ length: 9 }, (_, i) => `line ${31 + i}`),
    )
  })

  it('gives EXPLAIN the line and the ten before it', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 30))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, 5000, 2000)
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const target = r.held('page').find((item) => item.kind === 'line' && item.text === 'line 25')
    const context = r.service.context(ID, 'auto', target?.seq ?? -1)
    expect(context?.before.map((l) => l.text)).toEqual(
      Array.from({ length: 10 }, (_, i) => `line ${15 + i}`),
    )
    expect(context).toMatchObject({ file: 'app.log', format: 'plain' })
    expect(r.service.context(ID, 'auto', 12345)).toBeNull()
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

  it('delivers nothing while gathering a long gap, so every line arrives once, after its banner', async () => {
    // Found in review: a beat between two chunks of the gap sent lines to nobody (the only page
    // was still waiting), then the banner went out twice and a line never.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let gate: (() => void) | null = null
    let gated = false
    const reads: number[] = []
    const r = rig({ [ID]: { path: file, pattern: null, format: null } }, 200_000, 5, {
      read: async (target, start, length) => {
        reads.push(start)
        if (!gated && start > 0 && start < 2_000_000 && reads.filter((s) => s > 0).length === 2) {
          gated = true
          await new Promise<void>((resolve) => {
            gate = resolve
          })
        }
        return nodeFs.read(target, start, length)
      },
    })
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
    expect(held.filter((item) => item.kind === 'mark' && item.mark === 'away')).toHaveLength(1)
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

  it('lists the folder of a pattern again only for a name that could be a newer file', async () => {
    // Found in review: every append to the file being read listed the whole folder again.
    writeFileSync(path.join(dir, 'app-1.log'), lines(1, 1))
    writeFileSync(path.join(dir, 'other.txt'), 'x')
    let listed = 0
    const r = rig({ [ID]: { path: dir, pattern: 'app-*.log', format: null } }, 5000, 5, {
      list: async (folder) => {
        listed++
        return nodeFs.list(folder)
      },
    })
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

  it('holds no more than the lines kept as soon as the setting is lowered', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 5))
    const r = rig({ [ID]: { path: file, pattern: null, format: null } })
    r.service.subscribe('page', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.limits.keep = 2
    await r.advance(DELIVER_MS * 2)
    expect(r.service.context(ID, 'auto', r.held('page')[0]?.seq ?? -1)).toBeNull()
  })
})
