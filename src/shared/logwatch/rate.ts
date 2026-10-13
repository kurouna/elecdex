import { groupOf, LEVEL_GROUP_IDS, type LevelGroup, type LogItem } from './types.js'

/**
 * How many lines of each level, five seconds at a time, by the log's own time (docs/logwatch.md
 * §5): the lanes and the five minutes' figures. Counted by the log's time, the gap of a pane
 * that was hidden fills in when it is read on coming back. Pure: `now` comes in.
 */

export const BUCKET_MS = 5000
/** Five minutes of buckets. */
export const BUCKETS = 60

export type LevelCounts = Record<LevelGroup, number>

const zero = (): LevelCounts => ({ DBG: 0, INF: 0, WRN: 0, ERR: 0 })

/** The last five minutes' buckets, oldest first, from the items held. */
export function laneBuckets(items: readonly LogItem[], now: number): LevelCounts[] {
  const last = Math.floor(now / BUCKET_MS)
  const first = last - BUCKETS + 1
  const buckets = Array.from({ length: BUCKETS }, zero)
  // Items are in the order read, which is nearly the order of time: walking back stops at the
  // first line well before the window, past any that were written a little out of order.
  let older = 0
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (item === undefined || item.kind !== 'line') continue
    // A line from ahead of the clock (another machine's) is counted now.
    const bucket = Math.min(Math.floor(item.at / BUCKET_MS), last)
    if (bucket < first) {
      if (++older > 200) break
      continue
    }
    const slot = buckets[bucket - first]
    if (slot !== undefined) slot[groupOf(item.level)]++
  }
  return buckets
}

export function totals(buckets: readonly LevelCounts[]): LevelCounts {
  const sum = zero()
  for (const bucket of buckets) for (const group of LEVEL_GROUP_IDS) sum[group] += bucket[group]
  return sum
}

/**
 * Lines a second over the ten seconds before now's bucket: the RATE figure. Now's own is left
 * out - it has only begun, and counted in, a steady stream read half its rate at each bucket's
 * start (found in review).
 */
export function ratePerSecond(buckets: readonly LevelCounts[]): number {
  const recent = buckets.slice(-3, -1)
  const lines = recent.reduce((sum, b) => sum + b.DBG + b.INF + b.WRN + b.ERR, 0)
  return Math.round(lines / ((recent.length * BUCKET_MS) / 1000))
}

/** Errors in the last fifteen seconds at least this many... */
export const BURST_MIN = 5
/** ...and this many times the usual fifteen seconds of the minutes before. */
export const BURST_FACTOR = 4

/** Whether errors are coming much faster than they were. */
export function bursting(buckets: readonly LevelCounts[]): boolean {
  const recent = buckets.slice(-3).reduce((sum, b) => sum + b.ERR, 0)
  const before = buckets.slice(0, -3)
  const usual =
    before.length === 0 ? 0 : (before.reduce((s, b) => s + b.ERR, 0) / before.length) * 3
  return recent >= BURST_MIN && recent >= usual * BURST_FACTOR + 1
}

/** Seconds the burst must last before the lamp says so, so one clump does not flash it. */
export const BURST_HOLD = 2

/** The burst lamp's count: seconds in a row a burst has been seen, back to 0 when it ends. */
export const burstStreak = (previous: number, now: boolean): number => (now ? previous + 1 : 0)

export const burstLit = (streak: number): boolean => streak >= BURST_HOLD
