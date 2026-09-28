import type { ServiceContext } from '../elecdex-plugin'
import type { Level } from './chart'
import type { Rank } from './judge'

/**
 * Best results, kept by the service in ctx.storage so they outlive panes and restarts.
 *
 * The service and every view of a plugin run in the one worker, so a view reaches the
 * records through this module rather than through messages: the service binds the storage
 * here when it starts, which is before any view is mounted.
 */

export interface Best {
  score: number
  rank: Rank
  maxChain: number
  /** Every note typed, none dropped. */
  fullChain: boolean
}

type Store = Pick<ServiceContext<Record<string, never>, unknown>['storage'], 'get' | 'set'>

const KEY = 'records'
let store: Store | null = null
let records: Record<string, Best> = {}

const keyOf = (song: string, level: Level) => `${song}:${level}`

export function bindRecords(storage: Store): void {
  store = storage
  const saved = storage.get<Record<string, Best>>(KEY)
  records = saved !== undefined && typeof saved === 'object' && saved !== null ? saved : {}
}

export function bestOf(song: string, level: Level): Best | null {
  return records[keyOf(song, level)] ?? null
}

/** The best on every level of a song, as the menu's row shows them side by side. */
export function bestsOf(song: string): Record<Level, Best | null> {
  return { easy: bestOf(song, 'easy'), normal: bestOf(song, 'normal'), hard: bestOf(song, 'hard') }
}

/** Keeps a result if it beats the best; answers whether it did. */
export function submit(song: string, level: Level, result: Best): boolean {
  const best = bestOf(song, level)
  const better = best === null || result.score > best.score
  const merged: Best = better
    ? { ...result, fullChain: result.fullChain || (best?.fullChain ?? false) }
    : {
        ...best,
        fullChain: best.fullChain || result.fullChain,
        maxChain: Math.max(best.maxChain, result.maxChain),
      }
  records = { ...records, [keyOf(song, level)]: merged }
  store?.set(KEY, records)
  return better
}
