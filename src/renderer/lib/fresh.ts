/**
 * Which rows of a live list are new, for the entrance and highlight a list gives
 * them (styles/motion.css).
 *
 * A row is new when its key arrives in a later reading than the first: the first
 * reading a list gets - at mount, after a remount or a reload, from a cache - only
 * sets what is already known, so nothing on screen at the start claims to be new.
 * Keys once seen stay seen, so a row that drops off the end of the list and comes
 * back is not new again.
 */
export class FreshTracker {
  #seen: Set<string> | null = null
  readonly #limit: number

  /** `limit` bounds the keys remembered; the oldest are forgotten first. */
  constructor(limit = 1000) {
    this.#limit = limit
  }

  /** The keys of `keys` not seen before, in their order; none the first time. */
  next(keys: Iterable<string>): string[] {
    const first = this.#seen === null
    const seen = this.#seen ?? new Set<string>()
    this.#seen = seen
    const added: string[] = []
    for (const key of keys) {
      if (seen.has(key)) continue
      seen.add(key)
      if (!first) added.push(key)
    }
    // A Set iterates in insertion order, so the first keys are the oldest.
    for (const key of seen) {
      if (seen.size <= this.#limit) break
      seen.delete(key)
    }
    return added
  }

  /** Starts over, as for a different list: the next reading sets what is known. */
  reset(): void {
    this.#seen = null
  }
}

/**
 * The keys to show as new: those still new from before, joined by those just
 * added, of the keys still in the list.
 */
export function carryFresh(
  fresh: ReadonlySet<string>,
  added: readonly string[],
  present: readonly string[],
): ReadonlySet<string> {
  if (fresh.size === 0 && added.length === 0) return fresh
  const next = new Set<string>()
  for (const key of present) if (fresh.has(key) || added.includes(key)) next.add(key)
  return next
}
