/**
 * One timer for every moment something has to be announced.
 *
 * The entries are searched for the one that comes first and a single
 * `setTimeout` waits for it; nothing is polled. A thousand deadlines cost the
 * same as one, and a machine with nothing waiting has no timer running at all.
 * Both the tasks' deadlines and the alarms' times of day are scheduled this way
 * - each gives the moments, this keeps the clock.
 *
 * Three things a plain timeout would get wrong, all handled here:
 *
 *  - `setTimeout` counts monotonic time, so a machine asleep for an hour wakes
 *    with its timers an hour behind. Callers recompute the schedule on resume.
 *  - A delay further out than `MAX_DELAY_MS` overflows the 32-bit value and
 *    fires immediately, so long waits are taken in hops.
 *  - The caller records what it has announced, but that record may not have come
 *    back by the time the schedule is worked out again - and if it never does, a
 *    moment already past would be announced on every turn of the loop. What has
 *    been fired is remembered here too, which is what makes "once" true whatever
 *    the caller does with it.
 */

/** Just under 24.8 days, the largest delay setTimeout takes without overflowing. */
const MAX_DELAY_MS = 2_000_000_000

/** One thing waiting to be announced, and when. */
export interface ScheduleEntry {
  id: string
  at: number
}

export interface Scheduler {
  /** Recomputes the schedule from the moments as they are now. */
  update: (entries: readonly ScheduleEntry[]) => void
  /** The moment the next announcement is due, for tests and diagnostics. */
  next: () => number | null
  dispose: () => void
}

export function createScheduler(
  fire: (id: string, at: number) => void,
  now: () => number = Date.now,
): Scheduler {
  let timer: NodeJS.Timeout | null = null
  let entries: readonly ScheduleEntry[] = []
  let due: number | null = null

  /** What has been announced, by id and the moment it was announced for. */
  const announced = new Map<string, number>()

  const clear = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /** The soonest entry this scheduler has not already announced. */
  const soonest = (): ScheduleEntry | null => {
    let best: ScheduleEntry | null = null
    for (const entry of entries) {
      const said = announced.get(entry.id)
      if (said !== undefined && said >= entry.at) continue
      if (best === null || entry.at < best.at) best = entry
    }
    return best
  }

  const schedule = (): void => {
    clear()
    const candidate = soonest()
    due = candidate?.at ?? null
    if (candidate === null) return

    const wait = candidate.at - now()
    if (wait <= 0) {
      // Already due. Announce on the next turn of the loop rather than from
      // inside the update that found it, so a caller's own state is settled
      // before it hears about the announcement.
      timer = setTimeout(() => {
        timer = null
        ring(candidate)
      }, 0)
      return
    }
    timer = setTimeout(
      () => {
        timer = null
        // A hop towards a distant moment: look again rather than announce.
        if (wait > MAX_DELAY_MS) schedule()
        else ring(candidate)
      },
      Math.min(wait, MAX_DELAY_MS),
    )
  }

  /** Announces one entry, then looks for the next. */
  const ring = (entry: ScheduleEntry): void => {
    // It may have been taken away or moved between being scheduled and coming
    // due; only announce what is still waiting for this very moment.
    const current = entries.find((candidate) => candidate.id === entry.id)
    if (current !== undefined && current.at === entry.at) {
      announced.set(entry.id, entry.at)
      fire(entry.id, entry.at)
    }
    schedule()
  }

  return {
    update: (next) => {
      entries = next
      // Forget what is gone, so the map cannot grow without end.
      for (const id of [...announced.keys()]) {
        if (!next.some((entry) => entry.id === id)) announced.delete(id)
      }
      schedule()
    },
    next: () => due,
    dispose: clear,
  }
}
