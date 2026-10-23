/**
 * A virtual clock and due-time timers for MarketService, which every market test drives through
 * hours of polling. Kept in one place so the tests that count requests all step time the same
 * way, and the reason stepping is cheap is written once.
 */
export function marketClock(start: number) {
  let now = start
  const timers: Array<{ at: number; fn: () => void; id: number }> = []
  let nextId = 1
  // The service's own work is promises only (its timers are the ones here), so letting the
  // microtasks run is enough - and unlike a real timer per step, it costs nothing. A step per
  // virtual minute over an hour used to take seconds of real time, which left the market tests
  // failing their five-second limit whenever the machine was busy.
  const settle = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  }
  return {
    /** What the service takes for its clock and timers. */
    deps: {
      now: () => now,
      setTimer: (fn: () => void, ms: number) => {
        const id = nextId++
        timers.push({ at: now + ms, fn, id })
        return id
      },
      clearTimer: (id: unknown) => {
        const i = timers.findIndex((t) => t.id === id)
        if (i >= 0) timers.splice(i, 1)
      },
    },
    now: () => now,
    /** Runs every timer due within `ms`, in order, letting the service's promises run after each. */
    async advance(ms: number) {
      const target = now + ms
      for (;;) {
        timers.sort((a, b) => a.at - b.at)
        const due = timers[0]
        if (!due || due.at > target) break
        timers.shift()
        now = due.at
        due.fn()
        await settle()
      }
      now = target
    },
  }
}
