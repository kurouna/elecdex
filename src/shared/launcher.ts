/** An application the launcher can start, as the renderer sees it: no paths, no commands. */
export interface LauncherEntry {
  /** Opaque; the only thing the renderer can ask main to launch. */
  id: string
  name: string
  /** Start Menu folder or desktop category, where the platform has one. */
  group: string | null
  /** 'user' entries come from settings.json and are listed first. */
  source: 'user' | 'system'
  /** Times started from elecdex; the list comes ordered by it. */
  launches: number
}

export type LaunchResult = { ok: true } | { ok: false; error: string }

/** How often, and when last, each launcher id was started. Kept in launcher-usage.json. */
export interface LaunchUsage {
  count: number
  /** Epoch milliseconds. */
  last: number
}

/** Enough to remember every entry anyone uses; the least recent are forgotten beyond it. */
export const USAGE_LIMIT = 500

/**
 * Orders entries by use: most launches first, the most recent breaking ties.
 * Entries never launched keep their catalog order (the user's own entries first),
 * so a fresh install looks exactly as it did before anything was counted.
 */
export function rankByUse<T extends { id: string }>(
  entries: readonly T[],
  usage: Readonly<Record<string, LaunchUsage>>,
): T[] {
  return entries
    .map((entry, index) => ({ entry, index, use: usage[entry.id] }))
    .sort(
      (a, b) =>
        (b.use?.count ?? 0) - (a.use?.count ?? 0) ||
        (b.use?.last ?? 0) - (a.use?.last ?? 0) ||
        a.index - b.index,
    )
    .map(({ entry }) => entry)
}

/** Counts one launch, forgetting the least recently used ids beyond USAGE_LIMIT. */
export function recordLaunch(
  usage: Readonly<Record<string, LaunchUsage>>,
  id: string,
  now: number,
): Record<string, LaunchUsage> {
  const next = { ...usage, [id]: { count: (usage[id]?.count ?? 0) + 1, last: now } }
  const ids = Object.keys(next)
  if (ids.length <= USAGE_LIMIT) return next
  const keep = ids.sort((a, b) => (next[b]?.last ?? 0) - (next[a]?.last ?? 0)).slice(0, USAGE_LIMIT)
  return Object.fromEntries(keep.map((k) => [k, next[k] as LaunchUsage]))
}
