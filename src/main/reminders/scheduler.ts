import { dueAt, nextReminder, type Task } from '@shared/tasks'

/**
 * One timer for every deadline there is.
 *
 * The tasks are searched for the one that comes due first and a single
 * `setTimeout` waits for that moment; nothing is polled. A thousand tasks cost
 * the same as one, and a machine with no deadlines at all has no timer running.
 *
 * Two things a plain timeout would get wrong, both handled here:
 *
 *  - `setTimeout` counts monotonic time, so a machine asleep for an hour wakes
 *    with its timers an hour behind. The schedule is recomputed on resume.
 *  - A deadline further out than `MAX_DELAY_MS` overflows the 32-bit delay and
 *    fires immediately, so long waits are taken in hops.
 */

/** Just under 24.8 days, the largest delay setTimeout takes without overflowing. */
const MAX_DELAY_MS = 2_000_000_000

export interface ReminderScheduler {
  /** Recomputes the schedule from the tasks as they are now. */
  update: (tasks: readonly Task[], leadMs: number) => void
  /** The moment the next reminder is due, for tests and diagnostics. */
  next: () => number | null
  dispose: () => void
}

export function createScheduler(
  fire: (task: Task, at: number) => void,
  now: () => number = Date.now,
): ReminderScheduler {
  let timer: NodeJS.Timeout | null = null
  let tasks: readonly Task[] = []
  let leadMs = 0
  let due: number | null = null

  /**
   * What has been announced, by task id and the moment it was announced for.
   *
   * The caller records the same thing on the task itself, but it may not have
   * come back by the time the schedule is worked out again - and if it never
   * does, a deadline already past would be announced on every turn of the loop.
   * This is what makes "once" true regardless of what the caller does with it.
   */
  const announced = new Map<string, number>()

  const clear = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /** The tasks as the search should see them, with what this scheduler already said. */
  const pending = (): Task[] =>
    tasks.map((task) => {
      const said = announced.get(task.id)
      if (said === undefined) return task
      return { ...task, remindedAt: Math.max(task.remindedAt ?? 0, said) }
    })

  const schedule = (): void => {
    clear()
    const candidate = nextReminder(pending(), leadMs)
    due = candidate?.at ?? null
    if (candidate === null) return

    const wait = candidate.at - now()
    if (wait <= 0) {
      // Already due. Announce on the next turn of the loop rather than from
      // inside the update that found it, so a caller's own state is settled
      // before it hears about the reminder.
      timer = setTimeout(() => {
        timer = null
        ring(candidate.task, candidate.at)
      }, 0)
      return
    }
    timer = setTimeout(
      () => {
        timer = null
        // A hop towards a distant deadline: look again rather than announce.
        if (wait > MAX_DELAY_MS) schedule()
        else ring(candidate.task, candidate.at)
      },
      Math.min(wait, MAX_DELAY_MS),
    )
  }

  /** Announces one task, then looks for the next. */
  const ring = (task: Task, at: number): void => {
    // The task may have been ticked off or moved between being scheduled and
    // coming due; only announce what is still waiting for this moment.
    const current = tasks.find((entry) => entry.id === task.id)
    if (current !== undefined && dueAt(current, leadMs) === at) {
      announced.set(task.id, at)
      fire(current, at)
    }
    schedule()
  }

  return {
    update: (next, lead) => {
      tasks = next
      leadMs = lead
      // Forget tasks that are gone, so the map cannot grow without end.
      for (const id of [...announced.keys()]) {
        if (!next.some((task) => task.id === id)) announced.delete(id)
      }
      schedule()
    },
    next: () => due,
    dispose: clear,
  }
}
