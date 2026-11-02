/**
 * The platform's application list, served stale while it is refreshed.
 *
 * A scan is slow on Windows (about 1.3 s: the Start Menu folders plus one
 * PowerShell for packaged apps and display names). Only the very first request
 * waits for one. After that, a request past `maxAgeMs` gets the list it had at
 * once and starts a refresh behind it, so a launcher pane opened or moved then
 * shows its tiles instead of an empty "scanning" pane, and the re-order after a
 * launch is not held up. When a refresh finds a different list, `onChange` tells
 * the panes to ask again. Requests during a scan share it rather than starting
 * their own.
 *
 * `initial` is the list a previous start of elecdex saved (catalog-file.ts):
 * with one, not even the first request waits - it is served as stale, so the
 * first request also starts a scan behind it. Its age is not trusted: another
 * session's clock says nothing here. `onScanned` hears every successful scan,
 * and whether it found anything different from the list it replaces, to save it.
 */
export class SystemCache<T extends { id: string; name: string; group: string | null }> {
  readonly #scan: () => Promise<T[]>
  readonly #maxAgeMs: number
  readonly #onChange: () => void
  readonly #now: () => number
  readonly #initial: (() => T[] | null) | undefined
  readonly #onScanned: ((entries: T[], changed: boolean) => void) | undefined
  #entries: T[] | null = null
  #at = 0
  #started = false
  #scanning: Promise<T[]> | null = null

  constructor(options: {
    scan: () => Promise<T[]>
    maxAgeMs: number
    onChange: () => void
    now?: () => number
    initial?: () => T[] | null
    onScanned?: (entries: T[], changed: boolean) => void
  }) {
    this.#scan = options.scan
    this.#maxAgeMs = options.maxAgeMs
    this.#onChange = options.onChange
    this.#now = options.now ?? Date.now
    this.#initial = options.initial
    this.#onScanned = options.onScanned
  }

  async get(): Promise<T[]> {
    if (!this.#started) {
      this.#started = true
      // Read on the first request rather than at start-up, when nothing needs it yet.
      const saved = this.#initial?.() ?? null
      if (saved !== null) {
        this.#entries = saved
        this.#at = Number.NEGATIVE_INFINITY
      }
    }
    if (this.#entries === null) return this.#refresh()
    if (this.#now() - this.#at > this.#maxAgeMs) {
      // A failed background refresh keeps the old list; the next request retries.
      this.#refresh().catch(() => {})
    }
    return this.#entries
  }

  #refresh(): Promise<T[]> {
    this.#scanning ??= this.#scan()
      .then((entries) => {
        const previous = this.#entries
        this.#entries = entries
        this.#at = this.#now()
        if (previous !== null && !sameList(previous, entries)) this.#onChange()
        this.#onScanned?.(
          entries,
          previous === null || JSON.stringify(previous) !== JSON.stringify(entries),
        )
        return entries
      })
      .finally(() => {
        this.#scanning = null
      })
    return this.#scanning
  }
}

function sameList(
  a: ReadonlyArray<{ id: string; name: string; group: string | null }>,
  b: ReadonlyArray<{ id: string; name: string; group: string | null }>,
): boolean {
  return (
    a.length === b.length &&
    a.every((e, i) => e.id === b[i]?.id && e.name === b[i]?.name && e.group === b[i]?.group)
  )
}
