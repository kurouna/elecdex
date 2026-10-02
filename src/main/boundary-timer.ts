import { nextBoundary } from '@shared/wall-clock'

/** What a boundary timer needs of the world: injected, so a test drives a fake clock. */
export interface TimerDeps {
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
}

/**
 * One timer on the wall clock's grid (shared/wall-clock.ts): it fires on the next boundary of
 * its period, and, started, arms itself again before it runs - so the next run stays on the grid
 * however long this one takes - never an interval. The watchers that read only while a pane is
 * seen (the clipboard, the media session, the Docker engine) each kept their own copy of this.
 *
 * A run that is still going when the next boundary comes is the caller's to skip: what counts as
 * busy differs from one reading to the next.
 */
export class BoundaryTimer {
  readonly #deps: TimerDeps
  readonly #period: number
  readonly #run: () => void
  #handle: unknown = null
  #repeat = false

  constructor(deps: TimerDeps, period: number, run: () => void) {
    this.#deps = deps
    this.#period = period
    this.#run = run
  }

  /** Whether it is waiting for a boundary. */
  get armed(): boolean {
    return this.#handle !== null
  }

  /** Runs on every boundary from the next one on, until stopped. Started already, nothing changes. */
  start(): void {
    this.#repeat = true
    this.#arm()
  }

  /**
   * Runs once, on the next boundary. Already waiting for one, nothing changes - and that includes
   * a timer that is started: a run it already has coming is not added to. A one-off beside a
   * repeating reading is a second timer (the Docker watcher's `#settle` beside `#reconcile`).
   */
  once(): void {
    this.#arm()
  }

  stop(): void {
    this.#repeat = false
    if (this.#handle === null) return
    this.#deps.clearTimer(this.#handle)
    this.#handle = null
  }

  #arm(): void {
    if (this.#handle !== null) return
    const now = this.#deps.now()
    this.#handle = this.#deps.setTimer(() => {
      this.#handle = null
      // Armed before running, so the next run stays on the grid however long this one takes.
      if (this.#repeat) this.#arm()
      this.#run()
    }, nextBoundary(now, this.#period) - now)
  }
}
