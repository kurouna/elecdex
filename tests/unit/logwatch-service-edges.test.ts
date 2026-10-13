import {
  appendFileSync,
  mkdtempSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { LOG_LIMITS, type LogItem, type LogLine, type LogWatchEvent } from '@shared/logwatch/types'
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
 * LogWatchService at the edges: files replaced, deleted or unreadable, several encodings and
 * sources at once, what a page holds against what main holds, and the shapes bytes come in.
 * Real files in a temporary folder, a fake clock (as logwatch-service.test.ts).
 */

const ID = '0123456789abcdef'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'logwatch-edges-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const lines = (from: number, to: number, word = 'line'): string =>
  Array.from({ length: to - from + 1 }, (_, i) => `INFO ${word} ${from + i}\n`).join('')

type Entries = Record<string, Omit<LogEntryRecord, 'id' | 'lastUsed'>>

function rig(
  entries: Entries,
  options: { keep?: number; initial?: number; fs?: Partial<LogFs> } = {},
) {
  let now = Date.UTC(2026, 9, 12, 3, 0, 0, 100)
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const sent: { page: string; event: LogWatchEvent }[] = []
  const watches = new Map<string, (name: string | null) => void>()
  const limits = { keep: options.keep ?? 5000, initial: options.initial ?? 5 }
  const service = new LogWatchService<string>({
    fs: {
      ...nodeFs,
      ...options.fs,
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
    initialLines: () => limits.initial,
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
  const held = (page: string, key = `${ID}/auto`): LogItem[] => {
    let items: LogItem[] = []
    for (const { page: to, event } of sent) {
      if (to !== page || event.key !== key) continue
      items = event.reset ? [...event.items] : [...items, ...event.items]
    }
    return items
  }
  return {
    service,
    sent,
    watches,
    timers,
    limits,
    settle,
    held,
    texts: (page: string, key?: string) =>
      held(page, key)
        .filter((item): item is LogLine => item.kind === 'line')
        .map((line) => line.text),
    marks: (page: string, key?: string) =>
      held(page, key).flatMap((item) => (item.kind === 'mark' ? [item.mark] : [])),
    last: (page: string) => sent.filter((s) => s.page === page).at(-1)?.event,
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

const one = (file: string): Entries => ({ [ID]: { path: file, pattern: null, format: null } })

describe('files that change under the pane', () => {
  it('reads a file replaced while hidden from its start', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 3, 'old'))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('p').at(-1)?.seq ?? -1
    r.service.unsubscribe('p', ID, 'auto')
    renameSync(file, `${file}.1`)
    writeFileSync(file, lines(1, 2, 'new'))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    expect(r.texts('p')).toEqual(['old 1', 'old 2', 'old 3', 'new 1', 'new 2'])
    expect(r.marks('p')).toEqual(['opened', 'rotated'])
  })

  it('waits while the file is gone, and reads the new one from its start', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 2))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    unlinkSync(file)
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status.state).toBe('waiting')
    writeFileSync(file, lines(1, 1, 'again'))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status.state).toBe('reading')
    expect(r.texts('p').at(-1)).toBe('again 1')
    expect(r.marks('p')).toContain('rotated')
  })

  it('says when the file may not be read, or cannot be, and reads again once it can', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let answer: 'denied' | 'failed' | 'ok' = 'ok'
    const r = rig(one(file), {
      fs: {
        stat: async (target) =>
          answer === 'denied'
            ? { denied: true }
            : answer === 'failed'
              ? { failed: 'EIO: i/o error' }
              : nodeFs.stat(target),
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    answer = 'denied'
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status).toMatchObject({
      state: 'denied',
      problem: 'this user may not read the file',
    })
    answer = 'failed'
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status).toMatchObject({ state: 'error', problem: 'EIO: i/o error' })
    answer = 'ok'
    appendFileSync(file, lines(2, 2))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status.state).toBe('reading')
    expect(r.texts('p').at(-1)).toBe('line 2')
  })

  it('says an error thrown at opening, rather than opening for ever', async () => {
    // Found in review: a read failing at opening (the file held by its writer) never reached
    // the page, which went on showing OPENING.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 3))
    let fail = true
    const r = rig(one(file), {
      fs: {
        read: async (target, start, length) => {
          if (fail) throw new Error('EBUSY: resource busy')
          return nodeFs.read(target, start, length)
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.last('p')?.status).toMatchObject({ state: 'error', problem: 'EBUSY: resource busy' })
    fail = false
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.texts('p')).toEqual(['line 1', 'line 2', 'line 3'])
  })

  it('reads the tail once at opening, not counted and then read again', async () => {
    // Found in review: the back-scan's bytes were read a second time to be parsed.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 2000))
    let read = 0
    const r = rig(one(file), {
      fs: {
        read: async (target, start, length) => {
          const bytes = await nodeFs.read(target, start, length)
          read += bytes.length
          return bytes
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.texts('p').at(-1)).toBe('line 2000')
    // The file once, with the few bytes of its head (a BOM) and the one that tells a rewrite;
    // read twice it was about double.
    expect(read).toBeLessThan(statSync(file).size + 64)
  })

  it('marks no line NEW of the first ones written to a file opened empty', async () => {
    // Found in review: with nothing learnt, every first line of an empty file was NEW.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '')
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(1, 30))
    await r.advance(LOOK_MS + DELIVER_MS)
    const held = r.held('p').filter((item) => item.kind === 'line')
    expect(held.length).toBeGreaterThan(0)
    expect(held.some((item) => item.kind === 'line' && item.fresh)).toBe(false)
  })

  it('says an error thrown while reading, and goes on at the next look', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let fail = false
    const r = rig(one(file), {
      fs: {
        read: async (target, start, length) => {
          if (fail) throw new Error('EBUSY: resource busy')
          return nodeFs.read(target, start, length)
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    fail = true
    appendFileSync(file, lines(2, 2))
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status).toMatchObject({ state: 'error', problem: 'EBUSY: resource busy' })
    fail = false
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.texts('p').at(-1)).toBe('line 2')
  })

  it('reads again only what was not sent when a read fails midway through a long range', async () => {
    // Found in review: where the file was read to moved only when the whole range was read, so
    // a failure in its second chunk sent the first chunk's lines twice.
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let failAt = Number.POSITIVE_INFINITY
    const r = rig(one(file), {
      keep: 200_000,
      fs: {
        read: async (target, start, length) => {
          if (start >= failAt) {
            failAt = Number.POSITIVE_INFINITY
            throw new Error('EBUSY: resource busy')
          }
          return nodeFs.read(target, start, length)
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const size = statSync(file).size
    // Longer than one chunk: the second read fails once.
    appendFileSync(file, lines(2, 100_000, 'row'))
    failAt = size + LOG_LIMITS.chunkBytes
    await r.advance(LOOK_MS + DELIVER_MS)
    expect(r.last('p')?.status.state).toBe('error')
    await r.advance(LOOK_MS + DELIVER_MS)
    const texts = r.texts('p').filter((text) => text.startsWith('row'))
    expect(texts.at(-1)).toBe('row 100000')
    expect(texts).toHaveLength(99_999)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('reads a file that shrank between the stat and the read without going wrong', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let shrink = false
    const r = rig(one(file), {
      fs: {
        read: async (target, start, length) => {
          if (shrink) {
            shrink = false
            writeFileSync(file, '')
          }
          return nodeFs.read(target, start, length)
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    appendFileSync(file, lines(2, 2))
    shrink = true
    await r.advance(LOOK_MS + DELIVER_MS)
    appendFileSync(file, lines(1, 1, 'after'))
    await r.advance(LOOK_MS * 2 + DELIVER_MS)
    expect(r.texts('p').at(-1)).toBe('after 1')
  })
})

describe('the shapes bytes come in', () => {
  it('reads CRLF, a UTF-8 mark, and a line finished by a later write', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '﻿INFO first\r\nINFO sec')
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.texts('p')).toEqual(['first'])
    appendFileSync(file, 'ond\r\n')
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.texts('p')).toEqual(['first', 'second'])
  })

  it('reads UTF-16LE with its mark, opening and appending', async () => {
    const file = path.join(dir, 'wide.log')
    writeFileSync(file, Buffer.from('﻿INFO 上の行\nINFO two\n', 'utf16le'))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.last('p')?.status.encoding).toBe('utf-16le')
    expect(r.texts('p')).toEqual(['上の行', 'two'])
    appendFileSync(file, Buffer.from('ERROR 三つ目\n', 'utf16le'))
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.texts('p').at(-1)).toBe('三つ目')
  })

  it('opens UTF-16LE from inside the file on a whole character, past a 0A inside one', async () => {
    const file = path.join(dir, 'wide.log')
    const body = Array.from({ length: 400 }, (_, i) => `INFO 上 ${i}\n`).join('')
    writeFileSync(file, Buffer.from(`﻿${body}`, 'utf16le'))
    const r = rig(one(file), { initial: 3 })
    r.service.subscribe('p', { id: ID, encoding: 'utf-16le', since: -1 })
    await r.settle()
    expect(r.texts('p', `${ID}/utf-16le`)).toEqual(['上 397', '上 398', '上 399'])
  })

  it('joins a trace written in one beat, and takes a frame after a quiet beat as a line of its own', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, '')
    const r = rig(one(file), { initial: 5 })
    writeFileSync(file, '2026-10-12 12:00:00 INFO start\n')
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    // Two writes, each heard at once, less than a beat apart.
    appendFileSync(file, '2026-10-12 12:00:01 ERROR boom\n    at a (x.js:1)\n')
    r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS)
    appendFileSync(file, '    at b (x.js:2)\n')
    r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS + DELIVER_MS * 3)
    const boom = r.held('p').find((item) => item.kind === 'line' && item.text === 'boom') as LogLine
    expect(boom.more).toEqual(['    at a (x.js:1)', '    at b (x.js:2)'])
    // Quiet for a whole beat: the entry was complete. A frame written later is a line by itself
    // (the limit of reading as it is written; the frame is still shown).
    await r.advance(DELIVER_MS * 3)
    appendFileSync(file, '    at c (x.js:3)\n')
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.texts('p').at(-1)).toBe('    at c (x.js:3)')
  })

  it('takes no more lines on opening than it keeps', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 20))
    const r = rig(one(file), { keep: 3, initial: 10 })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.held('p')).toHaveLength(3)
    expect(r.texts('p')).toEqual(['line 19', 'line 20'])
  })
})

describe('pages, encodings and sources together', () => {
  it('follows one file in two encodings at once, each decoded its own way', async () => {
    const file = path.join(dir, 'sjis.log')
    const sjis = Buffer.from([0x49, 0x4e, 0x46, 0x4f, 0x20, 0x90, 0xda, 0x91, 0xb1, 0x0a])
    writeFileSync(file, sjis)
    const r = rig(one(file))
    r.service.subscribe('a', { id: ID, encoding: 'shift_jis', since: -1 })
    r.service.subscribe('b', { id: ID, encoding: 'utf-8', since: -1 })
    await r.settle()
    appendFileSync(file, sjis)
    await r.advance(LOOK_MS + DELIVER_MS * 2)
    expect(r.texts('a', `${ID}/shift_jis`)).toEqual(['接続', '接続'])
    const garbled = r.texts('b', `${ID}/utf-8`)
    expect(garbled).toHaveLength(2)
    expect(garbled[1]).toContain('�')
  })

  it('reads afresh, not from the gap, after a channel nobody showed missed what was read', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig(one(file))
    r.service.subscribe('a', { id: ID, encoding: 'auto', since: -1 })
    r.service.subscribe('b', { id: ID, encoding: 'utf-8', since: -1 })
    await r.settle()
    const since = r.held('b', `${ID}/utf-8`).at(-1)?.seq ?? -1
    r.service.unsubscribe('b', ID, 'utf-8')
    appendFileSync(file, lines(2, 2))
    await r.advance(LOOK_MS + DELIVER_MS)
    r.service.subscribe('b', { id: ID, encoding: 'utf-8', since })
    await r.advance(DELIVER_MS)
    const last = r.sent.filter((s) => s.page === 'b').at(-1)?.event
    expect(last?.reset).toBe(true)
    expect(r.texts('b', `${ID}/utf-8`)).toEqual(['line 1', 'line 2'])
  })

  it('keeps the place of eight hidden files, and forgets the oldest past that', async () => {
    const entries: Entries = {}
    const ids = Array.from({ length: 9 }, (_, i) => `${'0'.repeat(15)}${i.toString(16)}`)
    for (const id of ids) {
      const file = path.join(dir, `${id}.log`)
      writeFileSync(file, lines(1, 1))
      entries[id] = { path: file, pattern: null, format: null }
    }
    const r = rig(entries)
    const since: Record<string, number> = {}
    for (const id of ids) {
      r.service.subscribe(id, { id, encoding: 'auto', since: -1 })
      await r.advance(10)
      since[id] = r.held(id, `${id}/auto`).at(-1)?.seq ?? -1
      r.service.unsubscribe(id, id, 'auto')
      await r.advance(10)
    }
    const first = ids[0] as string
    const recent = ids[8] as string
    appendFileSync(path.join(dir, `${first}.log`), lines(2, 2))
    appendFileSync(path.join(dir, `${recent}.log`), lines(2, 2))
    r.service.subscribe(first, { id: first, encoding: 'auto', since: since[first] ?? -1 })
    r.service.subscribe(recent, { id: recent, encoding: 'auto', since: since[recent] ?? -1 })
    await r.advance(DELIVER_MS * 2)
    const lastOf = (id: string) => r.sent.filter((s) => s.page === id).at(-1)?.event
    // The forgotten one opens afresh (its own last lines); the kept one reads the gap.
    expect(r.sent.filter((s) => s.page === first).some((s, i) => i > 0 && s.event.reset)).toBe(true)
    expect(
      lastOf(recent)?.items.some((item) => item.kind === 'line' && item.text === 'line 2'),
    ).toBe(true)
  })

  it('tells a page about a file no longer known, and stops following it', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const entries = one(file)
    const r = rig(entries)
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.service.unsubscribe('p', ID, 'auto')
    delete entries[ID]
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    expect(r.last('p')?.status.state).toBe('unknown')
    expect(r.service.watching()).toEqual([])
  })

  it('reads once for a burst of changes', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    let reads = 0
    const r = rig(one(file), {
      fs: {
        read: async (target, start, length) => {
          // The byte checked before a read (is the file still the one read?) is not a read of it.
          if (length > 1) reads++
          return nodeFs.read(target, start, length)
        },
      },
    })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const before = reads
    appendFileSync(file, lines(2, 4))
    for (let i = 0; i < 10; i++) r.watches.get(dir)?.('app.log')
    await r.advance(SETTLE_MS)
    expect(reads - before).toBe(1)
  })

  it('sends a page nothing new when nothing changed, and the state alone when it did', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const before = r.sent.length
    await r.advance(LOOK_MS * 3)
    expect(r.sent.length).toBe(before)
    unlinkSync(file)
    await r.advance(LOOK_MS + DELIVER_MS)
    const event = r.last('p')
    expect(event).toMatchObject({ reset: false, items: [] })
    expect(event?.status.state).toBe('waiting')
  })

  it('brings a page holding a gap, or more than main, up to date with everything', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 10))
    const r = rig(one(file), { keep: 4, initial: 3 })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const held = r.held('p')
    const first = held[0]?.seq ?? 0
    const last = held.at(-1)?.seq ?? 0
    for (const since of [first - 5, last + 100]) {
      r.service.subscribe(`q${since}`, { id: ID, encoding: 'auto', since })
      await r.settle()
      expect(r.last(`q${since}`)?.reset).toBe(true)
    }
    r.service.subscribe('r', { id: ID, encoding: 'auto', since: last })
    await r.settle()
    expect(r.last('r')).toMatchObject({ reset: false, items: [] })
  })

  it('adds only the opened mark across a quiet hide', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('p').at(-1)?.seq ?? -1
    r.service.unsubscribe('p', ID, 'auto')
    await r.advance(60_000)
    r.service.subscribe('p', { id: ID, encoding: 'auto', since })
    await r.advance(DELIVER_MS * 2)
    expect(r.marks('p')).toEqual(['opened'])
  })

  it('does nothing more once disposed', async () => {
    const file = path.join(dir, 'app.log')
    writeFileSync(file, lines(1, 1))
    const r = rig(one(file))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    r.service.dispose()
    expect(r.timers.size).toBe(0)
    expect(r.watches.size).toBe(0)
    const before = r.sent.length
    appendFileSync(file, lines(2, 2))
    await r.advance(LOOK_MS * 2)
    expect(r.sent.length).toBe(before)
    expect(r.service.watching()).toEqual([])
  })
})

describe('a pattern', () => {
  it('waits while nothing matches, and opens the first file that does', async () => {
    const r = rig({ [ID]: { path: dir, pattern: 'app-*.log', format: null } })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    expect(r.last('p')?.status).toMatchObject({
      state: 'waiting',
      problem: 'nothing matches app-*.log',
    })
    writeFileSync(path.join(dir, 'app-1.log'), lines(1, 1))
    r.watches.get(dir)?.('app-1.log')
    await r.advance(SETTLE_MS + LOOK_MS + DELIVER_MS)
    expect(r.texts('p')).toEqual(['line 1'])
    expect(r.last('p')?.status.file).toBe('app-1.log')
  })

  it('moves on to a newer file that came while hidden', async () => {
    writeFileSync(path.join(dir, 'app-1.log'), lines(1, 1, 'one'))
    const r = rig({ [ID]: { path: dir, pattern: 'app-*.log', format: null } })
    r.service.subscribe('p', { id: ID, encoding: 'auto', since: -1 })
    await r.settle()
    const since = r.held('p').at(-1)?.seq ?? -1
    r.service.unsubscribe('p', ID, 'auto')
    writeFileSync(path.join(dir, 'app-2.log'), lines(1, 2, 'two'))
    r.service.subscribe('p', { id: ID, encoding: 'auto', since })
    // Listed again within ten looks at most, or at once on a name heard.
    r.watches.get(dir)?.('app-2.log')
    await r.advance(SETTLE_MS + DELIVER_MS * 2)
    expect(r.texts('p')).toEqual(['one 1', 'two 1', 'two 2'])
    expect(r.marks('p')).toContain('switched')
  })
})
