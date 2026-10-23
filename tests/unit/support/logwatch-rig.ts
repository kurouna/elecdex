import type { LogItem, LogLine, LogWatchEvent } from '@shared/logwatch/types'
import type { LogEntryRecord } from '../../../src/main/logwatch/catalog.js'
import { nodeFs } from '../../../src/main/logwatch/node-fs.js'
import { type LogFs, LogWatchService } from '../../../src/main/logwatch/service.js'

/**
 * LogWatchService on real files in a temporary folder, with a fake clock: the watch is ours to
 * fire, so what is read is what the test says, when it says. The service's tests and its edges'
 * cover different cases of one service, so they share the rig rather than keep two copies that
 * could drift apart.
 */

/** The catalogue id the tests' first file goes by. */
export const LOG_ID = '0123456789abcdef'

export type Entries = Record<string, Omit<LogEntryRecord, 'id' | 'lastUsed'>>

/** Numbered INFO lines, one per line, as a log writes them. */
export const lines = (from: number, to: number, word = 'line'): string =>
  Array.from({ length: to - from + 1 }, (_, i) => `INFO ${word} ${from + i}\n`).join('')

export function logWatchRig(
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
  /** Everything a page was sent, as it would hold it. */
  const held = (page: string, key = `${LOG_ID}/auto`): LogItem[] => {
    let items: LogItem[] = []
    for (const { page: to, event } of sent) {
      if (to !== page || event.key !== key) continue
      items = event.reset ? [...event.items] : [...items, ...event.items]
    }
    return items
  }
  /** Runs the next timer due by `end`, if there is one. */
  const runDue = (end: number): boolean => {
    const due = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0]
    if (due === undefined || due[1].at > end) return false
    timers.delete(due[0])
    now = due[1].at
    due[1].fn()
    return true
  }
  return {
    service,
    sent,
    watches,
    timers,
    limits,
    settle,
    held,
    now: () => now,
    texts: (page: string, key?: string) =>
      held(page, key)
        .filter((item): item is LogLine => item.kind === 'line')
        .map((line) => line.text),
    marks: (page: string, key?: string) =>
      held(page, key).flatMap((item) => (item.kind === 'mark' ? [item.mark] : [])),
    last: (page: string) => sent.filter((s) => s.page === page).at(-1)?.event,
    /** Runs the timers due within `ms` without waiting for reads: a beat in the middle of one. */
    fire(ms: number) {
      const end = now + ms
      while (runDue(end)) {}
      now = end
    },
    async advance(ms: number) {
      await settle()
      const end = now + ms
      while (runDue(end)) await settle()
      now = end
      await settle()
    },
  }
}
