import {
  boardOf,
  type ClipBoard,
  type ClipEntry,
  type ClipHistory,
  type ClipRead,
  type ClipRestoreResult,
  cleared,
  emptyHistory,
  nextTick,
  recordRead,
  restored,
  shouldReadText,
  withoutEntry,
} from '@shared/clipboard'

export interface ClipboardDeps {
  /**
   * One look at the clipboard. `last` is the text seen last time: when the
   * clipboard still holds it, the HTML beside it need not be read again.
   */
  read(last: string | null): Promise<ClipRead>
  /** Puts an entry on the clipboard, its HTML with it. */
  write(entry: ClipEntry): Promise<void>
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  publish(board: ClipBoard): void
  /** A history to start from: the screenshots' made-up one. */
  initial?: ClipHistory
}

/**
 * The clipboard history, kept in main's memory (architecture.md §5.14).
 *
 * It looks at the clipboard only while a pane wants it (`sync(true)`) and the
 * user has not paused it, on the wall clock's quarter seconds - one timer,
 * armed for the next boundary after each look, never an interval. Electron's
 * clipboard is asynchronous, so a look holds main for microseconds; a look still
 * running when the next boundary comes is not overlapped, that boundary is
 * skipped. The history outlives the panes (a pane moved, or shown again, finds
 * it where it was) and ends with the app: nothing is written to disk.
 */
export class ClipboardWatcher {
  readonly #deps: ClipboardDeps
  #history: ClipHistory
  #wanted = false
  #paused = false
  #timer: unknown = null
  #busy = false
  #count = 0
  /** The length of the text last read, and when: a very long one is read less often. */
  #lastChars = 0
  #lastReadAt = 0
  /** When the last look was, while looks are in a row; null after a stop. */
  #lookedAt: number | null = null

  constructor(deps: ClipboardDeps) {
    this.#deps = deps
    this.#history = deps.initial ?? emptyHistory()
  }

  /** Whether the clipboard is being read now. */
  get active(): boolean {
    return this.#wanted && !this.#paused
  }

  board(): ClipBoard {
    return boardOf(this.#history, this.active, this.#paused)
  }

  /** Whether any pane wants the history kept current. */
  sync(wanted: boolean): void {
    if (wanted === this.#wanted) return
    const before = this.active
    this.#wanted = wanted
    this.#follow(before)
  }

  setPaused(paused: boolean): void {
    if (paused === this.#paused) return
    const before = this.active
    this.#paused = paused
    this.#follow(before)
    this.#publish()
  }

  async restore(id: string): Promise<ClipRestoreResult> {
    const entry = this.#history.entries.find((e) => e.id === id)
    if (entry === undefined) return 'missing'
    if (!entry.kept) return 'not-kept'
    try {
      await this.#deps.write(entry)
    } catch {
      return 'failed'
    }
    this.#set(restored(this.#history, id))
    return 'ok'
  }

  remove(id: string): void {
    this.#set(withoutEntry(this.#history, id))
  }

  clear(): void {
    this.#set(cleared(this.#history))
  }

  dispose(): void {
    this.#wanted = false
    this.#stop()
  }

  #follow(before: boolean): void {
    if (this.active === before) return
    if (this.active) {
      // A look at once, so a pane coming into view is told what is on the clipboard now.
      void this.#look()
      this.#arm()
    } else this.#stop()
    this.#publish()
  }

  #arm(): void {
    if (!this.active || this.#timer !== null) return
    const now = this.#deps.now()
    this.#timer = this.#deps.setTimer(() => {
      this.#timer = null
      // Armed before looking, so the next look stays on the grid however long this one takes.
      this.#arm()
      void this.#look()
    }, nextTick(now) - now)
  }

  #stop(): void {
    this.#lookedAt = null
    if (this.#timer === null) return
    this.#deps.clearTimer(this.#timer)
    this.#timer = null
  }

  async #look(): Promise<void> {
    const now = this.#deps.now()
    if (this.#busy || !shouldReadText(this.#lastChars, this.#lastReadAt, now)) return
    this.#busy = true
    try {
      const read = await this.#deps.read(this.#history.last)
      // Paused, or the last pane gone, while it was reading: what it read is not kept.
      if (!this.active) return
      this.#lastChars = read.kind === 'text' ? read.text.length : 0
      this.#lastReadAt = now
      const before = this.#lookedAt
      this.#lookedAt = now
      this.#set(recordRead(this.#history, read, now, () => this.#nextId(), before))
    } catch {
      // The clipboard held by another program for a moment: the next look tries again.
    } finally {
      this.#busy = false
    }
  }

  #nextId(): string {
    this.#count += 1
    return `c${this.#count.toString(36)}`
  }

  #set(next: ClipHistory): void {
    if (next === this.#history) return
    this.#history = next
    this.#publish()
  }

  #publish(): void {
    this.#deps.publish(this.board())
  }
}
