import { describe, expect, it } from 'vitest'
import { CHANGE_DEBOUNCE_MS, DirWatches, REOPEN_MS } from '../../src/main/fs/dir-watches.js'

/** The file pane's directory watches, against a made-up watcher and clock. */
function harness() {
  let now = 0
  const timers: { at: number; fn: () => void }[] = []
  const opened: string[] = []
  const notified: string[] = []
  const handlers = new Map<string, { change: () => void; error: () => void; closed: boolean }>()
  const active = new Set<string>()
  const gone = new Set<string>()
  const watches = new DirWatches({
    watch: (dir, change, error) => {
      if (gone.has(dir)) throw new Error('ENOENT')
      opened.push(dir)
      const handler = { change, error, closed: false }
      handlers.set(dir, handler)
      return {
        close: () => {
          handler.closed = true
        },
      }
    },
    notify: (dir) => notified.push(dir),
    active: () => [...active],
    setTimer: (fn, ms) => {
      const timer = { at: now + ms, fn }
      timers.push(timer)
      return timer
    },
    clearTimer: (timer) => {
      const i = timers.indexOf(timer as (typeof timers)[number])
      if (i >= 0) timers.splice(i, 1)
    },
  })
  const advance = (ms: number) => {
    const until = now + ms
    for (;;) {
      timers.sort((a, b) => a.at - b.at)
      const next = timers[0]
      if (next === undefined || next.at > until) break
      timers.shift()
      now = next.at
      next.fn()
    }
    now = until
  }
  return { watches, opened, notified, handlers, active, gone, advance, timers }
}

describe('directory watches', () => {
  it('report a burst of changes once', () => {
    const h = harness()
    h.active.add('/w')
    h.watches.sync()
    h.handlers.get('/w')?.change()
    h.handlers.get('/w')?.change()
    h.advance(CHANGE_DEBOUNCE_MS)
    expect(h.notified).toEqual(['/w'])
  })

  it('open again after a failure, and the page is told to list the folder again', () => {
    // Found in the sweep: a watcher's error closed it for good, and the pane followed nothing.
    const h = harness()
    h.active.add('/w')
    h.watches.sync()
    h.handlers.get('/w')?.error()
    expect(h.notified).toEqual(['/w'])
    expect(h.watches.watching()).toEqual([])
    h.advance(REOPEN_MS)
    expect(h.opened).toEqual(['/w', '/w'])
    expect(h.watches.watching()).toEqual(['/w'])
    // And it follows changes again.
    h.handlers.get('/w')?.change()
    h.advance(CHANGE_DEBOUNCE_MS)
    expect(h.notified).toEqual(['/w', '/w'])
  })

  it('stay closed for a folder that has gone, or that nobody watches any more', () => {
    const h = harness()
    h.active.add('/w')
    h.watches.sync()
    h.gone.add('/w')
    h.handlers.get('/w')?.error()
    h.advance(REOPEN_MS)
    expect(h.watches.watching()).toEqual([])

    const k = harness()
    k.active.add('/v')
    k.watches.sync()
    k.handlers.get('/v')?.error()
    k.active.delete('/v')
    k.watches.sync()
    expect(k.timers).toHaveLength(0)
    k.advance(REOPEN_MS)
    expect(k.opened).toEqual(['/v'])
  })
})
