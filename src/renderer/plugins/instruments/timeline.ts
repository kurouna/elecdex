/**
 * The events an instrument on the audio thread has been told of, in order of their frame, and
 * a block cut at each: an event lands on its sample, not on the block it fell in.
 */

export interface Timed {
  at: number
}

export class Timeline<E extends Timed> {
  private events: E[] = []

  /** Adds an event, after every other at the same frame: a release then a strike stays so. */
  add(event: E): void {
    let i = this.events.length
    while (i > 0 && (this.events[i - 1] as E).at > event.at) i--
    this.events.splice(i, 0, event)
  }

  clear(): void {
    this.events = []
  }

  get size(): number {
    return this.events.length
  }

  /**
   * Walks `frames` samples from frame `from`: every event due is applied before the stretch
   * after it is rendered, `span(offset, count)`.
   */
  run(
    frames: number,
    from: number,
    apply: (event: E, now: number) => void,
    span: (offset: number, count: number) => void,
  ): void {
    let done = 0
    while (done < frames) {
      const now = from + done
      while (this.events.length > 0 && (this.events[0] as E).at <= now)
        apply(this.events.shift() as E, now)
      const next = this.events[0]?.at ?? Number.POSITIVE_INFINITY
      const run = Math.min(frames - done, Math.max(1, next - now))
      span(done, run)
      done += run
    }
  }
}
