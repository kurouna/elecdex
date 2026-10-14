/**
 * A press whose work waits on main, taken once until that work is done: a second press (a double
 * click, Enter twice) while the first is still on its way is let go. Before, it made the work
 * twice - two alarms, a second picker over the first, a second EXPLAIN refused beside the first
 * (found in the sweep after the chat's double send). The guard is synchronous, set before the
 * first await, so no second call can pass it.
 */
export function oneAtATime<A extends unknown[]>(
  work: (...args: A) => Promise<void>,
): (...args: A) => Promise<void> {
  let running = false
  return async (...args) => {
    if (running) return
    running = true
    try {
      await work(...args)
    } finally {
      running = false
    }
  }
}
