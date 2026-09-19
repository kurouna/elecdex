/**
 * Rows that were there a moment ago.
 *
 * A socket table is read every few seconds, and plenty of connections do not
 * last that long: a page load opens half a dozen and closes them again between
 * two readings, so a pane that draws only what is there now shows nothing
 * happening on a machine that is busy. A row that has gone is therefore drawn
 * once more, marked, and only then dropped.
 *
 * The reading itself is the clock - a ghost lasts exactly one interval - so
 * nothing here schedules anything, and a pane nobody is looking at is not
 * keeping a timer alive to forget things with.
 */
export class GhostTracker<T> {
  readonly #key: (item: T) => string
  #previous = new Map<string, T>()
  #ghosts: T[] = []

  constructor(key: (item: T) => string) {
    this.#key = key
  }

  /**
   * Takes the reading and returns what to draw: the live rows as they are, and
   * the ones that went between this reading and the last, marked `gone`.
   */
  update(live: readonly T[]): { item: T; gone: boolean }[] {
    const present = new Map<string, T>()
    for (const item of live) present.set(this.#key(item), item)

    const ghosts: T[] = []
    for (const [key, item] of this.#previous) {
      if (!present.has(key)) ghosts.push(item)
    }
    this.#ghosts = ghosts
    this.#previous = present

    return [
      ...live.map((item) => ({ item, gone: false })),
      ...ghosts.map((item) => ({ item, gone: true })),
    ]
  }

  /** What went at the last reading, for a count beside the list. */
  get gone(): readonly T[] {
    return this.#ghosts
  }

  /** Starts over, as for a different list. */
  reset(): void {
    this.#previous = new Map()
    this.#ghosts = []
  }
}
