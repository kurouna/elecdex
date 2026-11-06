import { describe, expect, it } from 'vitest'
import { RunFollowers, type RunPage } from '../../src/main/translate/followers'
import type { Completion } from '../../src/main/translate/llama'
import { ORPHAN_MS, RELOAD_HOLD_MS, TranslateRuns } from '../../src/main/translate/runs'
import { runFollowing } from '../../src/preload/run-follow'
import type { RunEvent } from '../../src/shared/translate/run'

/**
 * Who follows a pane's run, in main and in the preload (docs/translate.md §8.5): a page that
 * follows gets its snapshot before any patch, each follow is one follower, and a page that goes
 * lets go of them all - at once when closed, after it has loaded again when reloaded.
 */

class Page implements RunPage {
  received: RunEvent[] = []
  destroyed = false
  send(_channel: string, payload: unknown): void {
    this.received.push(structuredClone(payload as RunEvent))
  }
  isDestroyed(): boolean {
    return this.destroyed
  }
}

function world() {
  const timers = new Map<number, { fn: () => void; at: number }>()
  let clock = 0
  let next = 1
  let write: ((text: string) => void) | null = null
  const followers: { publish: (event: RunEvent) => void } = { publish: () => {} }
  const runs = new TranslateRuns({
    ensure: async () => ({ origin: 'http://127.0.0.1:1', key: null }),
    begin: () => {},
    end: () => {},
    settle: async () => {},
    glossary: () => null,
    record: () => {},
    external: () => false,
    unreachable: () => {},
    ctx: () => 16384,
    tokenize: async (_e, text) => text.length,
    complete: (_e, _b, signal, onText) =>
      new Promise<Completion>((_resolve, reject) => {
        write = onText
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    setTimer: (fn, ms) => {
      const id = next++
      timers.set(id, { fn, at: clock + ms })
      return id
    },
    clearTimer: (id) => timers.delete(id as number),
    publish: (event) => followers.publish(event),
  })
  const pages = new RunFollowers<Page>(runs, 'run-event')
  followers.publish = (event) => pages.publish(event)
  const tick = (ms: number) => {
    clock += ms
    for (const [id, timer] of [...timers]) {
      if (timer.at > clock) continue
      timers.delete(id)
      timer.fn()
    }
  }
  const settle = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  return { runs, pages, tick, settle, write: (text: string) => write?.(text) }
}

const request = {
  paneId: 'p1',
  draftId: 'd1',
  text: 'Hello.',
  srcLang: 'en',
  tgtLang: 'ja',
  mode: 'translate' as const,
}

describe('RunFollowers', () => {
  it('gives a page that follows while a block is written its snapshot before any patch', async () => {
    const w = world()
    const first = new Page()
    w.pages.follow(first, 'p1')
    w.runs.start(request)
    await w.settle()
    w.write('こん')
    // A patch is gathered, not yet sent, as the second page follows.
    const second = new Page()
    w.pages.follow(second, 'p1')
    expect(second.received.map((e) => e.kind)).toEqual(['snapshot'])
    const snapshot = second.received[0]
    expect(snapshot?.kind === 'snapshot' && snapshot.run?.blocks[0]?.text).toBe('こん')
    // The first page had the patch; both go on from the same number.
    expect(first.received.at(-1)?.kind).toBe('patch')
    expect(first.received.at(-1)?.seq).toBe(snapshot?.seq)
    w.write('にちは')
    w.tick(100)
    expect(second.received.at(-1)).toMatchObject({ kind: 'patch', seq: (snapshot?.seq ?? 0) + 1 })
  })

  it('counts each follow, and a page that closes lets go of every one at once', () => {
    const w = world()
    const page = new Page()
    w.pages.follow(page, 'p1')
    w.pages.follow(page, 'p1')
    w.runs.start(request)
    w.pages.unfollow(page, 'p1')
    w.tick(ORPHAN_MS)
    expect(w.runs.watching()).toEqual(['run:p1'])
    page.destroyed = true
    w.pages.gone(page)
    w.tick(ORPHAN_MS)
    expect(w.runs.watching()).toEqual([])
  })

  it('a page reloading holds its runs until it has loaded', () => {
    const w = world()
    const page = new Page()
    w.pages.follow(page, 'p1')
    w.runs.start(request)
    w.pages.gone(page)
    w.tick(ORPHAN_MS * 2)
    expect(w.runs.watching()).toEqual(['run:p1'])
    w.runs.pageLoaded()
    w.tick(ORPHAN_MS)
    expect(w.runs.watching()).toEqual([])
  })

  it('does not hold a reloading page past the hold', () => {
    const w = world()
    const page = new Page()
    w.pages.follow(page, 'p1')
    w.runs.start(request)
    w.pages.gone(page)
    w.tick(RELOAD_HOLD_MS + ORPHAN_MS)
    expect(w.runs.watching()).toEqual([])
  })

  it('ignores an unfollow it was never sent a follow for', () => {
    const w = world()
    const page = new Page()
    w.pages.follow(page, 'p1')
    w.runs.start(request)
    w.pages.unfollow(new Page(), 'p1')
    w.pages.unfollow(page, 'p2')
    w.tick(ORPHAN_MS * 2)
    expect(w.runs.watching()).toEqual(['run:p1'])
  })
})

describe('runFollowing (preload)', () => {
  function fakeIpc() {
    const sent: [string, string][] = []
    let listener: ((event: unknown, payload: RunEvent) => void) | null = null
    return {
      ipc: {
        send: (channel: string, paneId: string) => sent.push([channel, paneId]),
        on: (_channel: string, l: (event: unknown, payload: RunEvent) => void) => {
          listener = l
        },
      },
      sent,
      emit: (payload: RunEvent) => listener?.(null, payload),
    }
  }

  it('lets two handlers on a pane follow again from inside a dispatch, without looping', () => {
    const io = fakeIpc()
    const follow = runFollowing(io.ipc, { follow: 'f', unfollow: 'u', event: 'e' })
    let calls = 0
    // Each handler, on any event, lets go and follows again: what a missed patch makes it do.
    const refollowing = () => {
      let release: () => void = () => {}
      const handler = () => {
        calls++
        release()
        release = follow('p1', handler)
      }
      release = follow('p1', handler)
    }
    refollowing()
    refollowing()
    io.emit({ paneId: 'p1', seq: 1, kind: 'snapshot', run: null })
    expect(calls).toBe(2)
  })

  it('sends one follow and one unfollow for each handler, and the second release does nothing', () => {
    const io = fakeIpc()
    const follow = runFollowing(io.ipc, { follow: 'f', unfollow: 'u', event: 'e' })
    const a = follow('p1', () => {})
    const b = follow('p1', () => {})
    a()
    a()
    b()
    expect(io.sent).toEqual([
      ['f', 'p1'],
      ['f', 'p1'],
      ['u', 'p1'],
      ['u', 'p1'],
    ])
  })
})
