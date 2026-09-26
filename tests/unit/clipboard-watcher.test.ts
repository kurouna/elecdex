import { readFileSync } from 'node:fs'
import { CLIP_LARGE_CHARS, CLIP_PERIOD_MS, type ClipBoard, type ClipRead } from '@shared/clipboard'
import { describe, expect, it } from 'vitest'
import { demoHistory } from '../../src/main/clipboard/stub.js'
import { ClipboardWatcher } from '../../src/main/clipboard/watcher.js'

/** A watcher on a fake clock and a fake clipboard, whose timers are run by hand. */
function rig(start = 10_000) {
  let now = start
  let held: ClipRead = { kind: 'other' }
  const timers = new Map<number, { at: number; fn: () => void }>()
  let nextTimer = 1
  const boards: ClipBoard[] = []
  const written: string[] = []
  let reads = 0
  let failWrite = false
  const watcher = new ClipboardWatcher({
    read: async () => {
      reads += 1
      return held
    },
    write: async (entry) => {
      if (failWrite) throw new Error('busy')
      written.push(entry.text)
      held = { kind: 'text', text: entry.text, html: entry.html }
    },
    now: () => now,
    setTimer: (fn, ms) => {
      const id = nextTimer++
      timers.set(id, { at: now + ms, fn })
      return id
    },
    clearTimer: (id) => {
      timers.delete(id as number)
    },
    publish: (board) => boards.push(board),
  })
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  }
  return {
    watcher,
    boards,
    written,
    copy: (read: ClipRead) => {
      held = read
    },
    reads: () => reads,
    timers,
    failWrites: () => {
      failWrite = true
    },
    /** Moves the clock on, running each timer due, one look at a time. */
    async advance(ms: number) {
      // A look started just before (by sync or a resume) finishes first.
      await flush()
      const end = now + ms
      for (;;) {
        const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (due === undefined || due[1].at > end) break
        timers.delete(due[0])
        now = due[1].at
        due[1].fn()
        await flush()
      }
      now = end
      await flush()
    },
    flush,
    last: () => boards.at(-1),
    now: () => now,
  }
}

const text = (value: string): ClipRead => ({ kind: 'text', text: value, html: null })

describe('ClipboardWatcher', () => {
  it('reads nothing, and arms no timer, until a pane wants it', async () => {
    const r = rig()
    r.copy(text('before'))
    await r.advance(5000)
    expect(r.reads()).toBe(0)
    expect(r.timers.size).toBe(0)
    expect(r.watcher.active).toBe(false)
  })

  it('looks at once, then on the quarter seconds of the wall clock', async () => {
    const r = rig(10_010)
    r.watcher.sync(true)
    await r.flush()
    expect(r.reads()).toBe(1)
    const [timer] = [...r.timers.values()]
    expect(timer?.at).toBe(10_250)
    await r.advance(1000)
    expect(r.reads()).toBe(5)
    expect([...r.timers.values()][0]?.at).toBe(11_250)
    expect(1000 % CLIP_PERIOD_MS).toBe(0)
  })

  it('records copies while wanted, and stops reading when the last pane goes', async () => {
    const r = rig()
    r.watcher.sync(true)
    r.copy(text('one'))
    await r.advance(300)
    r.copy(text('two'))
    await r.advance(2000)
    expect(r.last()?.entries.map((e) => e.preview)).toEqual(['two', 'one'])
    r.watcher.sync(false)
    expect(r.last()?.watching).toBe(false)
    const reads = r.reads()
    r.copy(text('unseen'))
    await r.advance(5000)
    expect(r.reads()).toBe(reads)
    expect(r.timers.size).toBe(0)
    // The history is kept in memory for when a pane is back; what was copied meanwhile
    // is read only as what the clipboard holds then.
    expect(r.watcher.board().entries.map((e) => e.preview)).toEqual(['two', 'one'])
  })

  it('does not take a copy after a gap for the selection before it still being dragged', async () => {
    const r = rig()
    r.watcher.sync(true)
    r.copy(text('seen'))
    await r.advance(300)
    r.watcher.sync(false)
    r.copy(text('seen again, later'))
    r.watcher.sync(true)
    await r.advance(300)
    expect(r.watcher.board().entries.map((e) => e.preview)).toEqual(['seen again, later', 'seen'])
  })

  it('reads nothing while paused, and keeps nothing read as the pause came', async () => {
    const r = rig()
    r.watcher.sync(true)
    await r.advance(300)
    r.watcher.setPaused(true)
    expect(r.last()).toMatchObject({ paused: true, watching: false })
    const reads = r.reads()
    r.copy(text('secret'))
    await r.advance(3000)
    expect(r.reads()).toBe(reads)
    expect(r.watcher.board().entries).toEqual([])
    r.watcher.setPaused(false)
    await r.flush()
    // Resumed, the clipboard is looked at once more: what it holds now is listed.
    expect(r.watcher.board().entries.map((e) => e.preview)).toEqual(['secret'])
  })

  it('never overlaps two looks: a slow read skips the boundaries it spans', async () => {
    let resolve: ((read: ClipRead) => void) | null = null
    let reads = 0
    let now = 0
    const timers: { at: number; fn: () => void }[] = []
    const watcher = new ClipboardWatcher({
      read: () => {
        reads += 1
        return new Promise((r) => {
          resolve = r
        })
      },
      write: async () => {},
      now: () => now,
      setTimer: (fn, ms) => timers.push({ at: now + ms, fn }),
      clearTimer: () => {},
      publish: () => {},
    })
    watcher.sync(true)
    for (let i = 0; i < 4; i++) {
      const timer = timers.shift()
      if (timer === undefined) break
      now = timer.at
      timer.fn()
    }
    expect(reads).toBe(1)
    ;(resolve as unknown as (read: ClipRead) => void)({ kind: 'other' })
  })

  it('reads a very long text only every few seconds while it stays', async () => {
    const r = rig()
    r.copy(text('x'.repeat(CLIP_LARGE_CHARS)))
    r.watcher.sync(true)
    await r.advance(1000)
    expect(r.reads()).toBe(1)
    await r.advance(2000)
    expect(r.reads()).toBe(2)
  })

  it('puts an entry back, marks it current, and does not list it again', async () => {
    const r = rig()
    r.watcher.sync(true)
    r.copy(text('one'))
    await r.advance(300)
    r.copy(text('two'))
    await r.advance(300)
    const one = r.watcher.board().entries[1]?.id ?? ''
    expect(await r.watcher.restore(one)).toBe('ok')
    expect(r.written).toEqual(['one'])
    await r.advance(1000)
    const board = r.watcher.board()
    expect(board.current).toBe(one)
    expect(board.entries.map((e) => [e.preview, e.copies])).toEqual([
      ['two', 1],
      ['one', 1],
    ])
  })

  it('says why an entry could not be put back', async () => {
    const r = rig()
    r.watcher.sync(true)
    r.copy(text('y'.repeat(300_000)))
    await r.advance(300)
    const long = r.watcher.board().entries[0]?.id ?? ''
    expect(await r.watcher.restore(long)).toBe('not-kept')
    expect(await r.watcher.restore('c999')).toBe('missing')
    r.copy(text('short'))
    await r.advance(300)
    r.failWrites()
    expect(await r.watcher.restore(r.watcher.board().entries[0]?.id ?? '')).toBe('failed')
  })

  it('removes and clears only its own list', async () => {
    const r = rig()
    r.watcher.sync(true)
    r.copy(text('one'))
    await r.advance(300)
    r.copy(text('two'))
    await r.advance(300)
    r.watcher.remove(r.watcher.board().entries[0]?.id ?? '')
    expect(r.watcher.board().entries.map((e) => e.preview)).toEqual(['one'])
    r.watcher.clear()
    expect(r.watcher.board().entries).toEqual([])
    expect(r.written).toEqual([])
  })

  it('does not stop on a clipboard another program holds for a moment', async () => {
    let fail = true
    let now = 0
    let timer: (() => void) | null = null
    const boards: ClipBoard[] = []
    const watcher = new ClipboardWatcher({
      read: async () => {
        if (fail) throw new Error('OpenClipboard failed')
        return text('later')
      },
      write: async () => {},
      now: () => now,
      setTimer: (fn) => {
        timer = fn
      },
      clearTimer: () => {},
      publish: (b) => boards.push(b),
    })
    watcher.sync(true)
    await Promise.resolve()
    fail = false
    now = 250
    ;(timer as unknown as () => void)()
    for (let i = 0; i < 5; i++) await Promise.resolve()
    expect(watcher.board().entries.map((e) => e.preview)).toEqual(['later'])
  })
})

describe('the stand-in and its demo', () => {
  it('makes a history whose ages spread over a morning, with one private copy left out', () => {
    const board = new ClipboardWatcher({
      read: async () => ({ kind: 'other' }),
      write: async () => {},
      now: () => 0,
      setTimer: () => 0,
      clearTimer: () => {},
      publish: () => {},
      initial: demoHistory(1_000_000_000),
    }).board()
    expect(board.entries.length).toBeGreaterThan(5)
    expect(board.skipped).toBe(1)
    expect(new Set(board.entries.map((e) => e.kind)).size).toBeGreaterThan(3)
  })

  it('is what the end-to-end tests run on, so no run reads this machine', () => {
    const support = readFileSync('tests/e2e/support.ts', 'utf8')
    expect(support).toMatch(/ELECDEX_CLIPBOARD_STUB: '1'/)
  })
})
