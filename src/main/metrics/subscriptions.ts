/**
 * Who is subscribed to which metric source.
 *
 * Kept free of Electron so the bookkeeping - the part that decides whether a
 * source is polled at all - is unit-tested directly. A subscriber is anything
 * with a stable identity; in practice a WebContents.
 *
 * The rule the whole metrics design rests on: a source is active exactly while
 * its subscriber set is non-empty. A subscriber that goes away without
 * unsubscribing (a closed window, a reloaded page) must be removed with
 * `dropSubscriber`, or its sources would poll forever.
 */
export class SubscriptionRegistry<S> {
  private readonly bySource = new Map<string, Set<S>>()

  /** Returns true when this made the source newly active. */
  subscribe(subscriber: S, sourceId: string): boolean {
    let set = this.bySource.get(sourceId)
    const wasActive = set !== undefined && set.size > 0
    if (!set) {
      set = new Set()
      this.bySource.set(sourceId, set)
    }
    set.add(subscriber)
    return !wasActive
  }

  /** Returns true when this made the source inactive. */
  unsubscribe(subscriber: S, sourceId: string): boolean {
    const set = this.bySource.get(sourceId)
    if (!set?.delete(subscriber)) return false
    if (set.size > 0) return false
    this.bySource.delete(sourceId)
    return true
  }

  /** Removes a subscriber from every source. Returns true if anything went inactive. */
  dropSubscriber(subscriber: S): boolean {
    let changed = false
    for (const [sourceId, set] of this.bySource) {
      if (!set.delete(subscriber)) continue
      if (set.size === 0) {
        this.bySource.delete(sourceId)
        changed = true
      }
    }
    return changed
  }

  subscribers(sourceId: string): ReadonlySet<S> {
    return this.bySource.get(sourceId) ?? new Set()
  }

  activeSources(): string[] {
    return [...this.bySource.keys()].sort()
  }
}
