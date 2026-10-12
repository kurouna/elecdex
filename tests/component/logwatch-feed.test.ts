import type { LogLine, LogSubscribeRequest, LogWatchEvent } from '@shared/logwatch/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { feedFor } = await import('../../src/renderer/widgets/logwatch/feed.svelte.ts')

/**
 * The page's feeds (feed.svelte.ts): one per file and encoding, shared by the panes, and the
 * oldest idle ones past eight let go of what they hold.
 */

let handlers = new Map<string, (event: LogWatchEvent) => void>()
let requests: LogSubscribeRequest[] = []

const line = (seq: number): LogLine => ({
  kind: 'line',
  seq,
  at: 0,
  timed: true,
  zoned: true,
  level: 'INF',
  source: '',
  text: `line ${seq}`,
  fields: [],
  more: [],
  moreCut: 0,
  raw: `line ${seq}`,
  sig: 'INF line {n}',
  fresh: false,
  cut: false,
})

const status = {
  state: 'reading' as const,
  problem: null,
  file: 'app.log',
  format: 'plain' as const,
  encoding: 'utf-8' as const,
  garbled: false,
  read: 10,
}

beforeEach(() => {
  handlers = new Map()
  requests = []
  vi.stubGlobal('elecdex', {
    logwatch: {
      subscribe: (request: LogSubscribeRequest, handler: (event: LogWatchEvent) => void) => {
        requests.push(structuredClone(request))
        const key = `${request.id}/${request.encoding}`
        handlers.set(key, handler)
        return () => handlers.delete(key)
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('feedFor', () => {
  it('keeps one feed a key past the eight kept: the oldest forgets its lines, not itself', () => {
    // Found in review: a feed past the eight was dropped from the map while a hidden pane still
    // held it, and a pane asking anew made a second feed of the same key - which preload, having
    // subscribed the key once, never sent what came before.
    const ids = Array.from({ length: 9 }, (_, i) => `a${'0'.repeat(14)}${i}`)
    const first = feedFor(ids[0] as string, 'auto')
    const stop = first.use()
    handlers.get(`${ids[0]}/auto`)?.({ key: '', reset: true, items: [line(1), line(2)], status })
    stop()
    for (const id of ids.slice(1)) {
      const feed = feedFor(id, 'auto')
      const done = feed.use()
      handlers.get(`${id}/auto`)?.({ key: '', reset: true, items: [line(1)], status })
      done()
    }
    expect(feedFor(ids[0] as string, 'auto')).toBe(first)
    expect(first.items).toEqual([])
    // Used again, it asks main for everything.
    first.use()()
    expect(requests.at(-1)).toMatchObject({ id: ids[0], since: -1 })
  })
})
