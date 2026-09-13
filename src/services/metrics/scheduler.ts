/**
 * Polls metric sources, but only the ones somebody is watching.
 *
 * This is the fix for the original project's biggest problem. eDEX-UI gave
 * every widget its own setInterval, each independently calling
 * systeminformation - and on Windows many of those calls spawn a child process
 * (si.mem() alone costs ~400ms a call, and it ran every 1.5s). Here:
 *
 *  - a source with no subscribers is not polled at all;
 *  - sources sharing an interval run on one timer and are collected together;
 *  - a collection still running when its next tick comes is not started again,
 *    so a slow call (networkInterfaces takes ~1.4s on Windows) cannot pile up;
 *  - a newly activated source is collected immediately, so a widget does not
 *    sit empty for a whole interval - but when many activate at once (the whole
 *    default layout mounting at launch), those first collections are staggered.
 *    Firing them together spawned half a dozen wmic/PowerShell processes in the
 *    same instant on Windows, a CPU spike visible on the app's own CPU graph.
 *
 * Pure apart from the injected clock, so all of the above is unit-tested with
 * fake timers.
 */

export interface SourceDefinition {
  intervalMs: number
  collect: () => Promise<unknown>
}

export interface Clock {
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
  now(): number
}

export interface SchedulerEvents {
  sample(id: string, at: number, data: unknown): void
  error(id: string, message: string): void
}

/** Gap between the first collections of sources activated together. */
export const DEFAULT_STAGGER_MS = 150

const realClock: Clock = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
}

interface Group {
  intervalMs: number
  ids: Set<string>
  timer: unknown
}

export class MetricScheduler {
  private readonly sources: Readonly<Record<string, SourceDefinition>>
  private readonly events: SchedulerEvents
  private readonly clock: Clock
  private readonly groups = new Map<number, Group>()
  private readonly inFlight = new Set<string>()
  private readonly counts = new Map<string, number>()
  private readonly staggerMs: number
  private disposed = false

  constructor(
    sources: Readonly<Record<string, SourceDefinition>>,
    events: SchedulerEvents,
    clock: Clock = realClock,
    staggerMs = DEFAULT_STAGGER_MS,
  ) {
    this.sources = sources
    this.events = events
    this.clock = clock
    this.staggerMs = staggerMs
  }

  /**
   * Replaces the set of sources being polled.
   *
   * Taking the whole set rather than add/remove pairs makes the call idempotent,
   * so a lost or repeated message between processes cannot leave a source
   * running with nobody watching.
   */
  setActive(ids: Iterable<string>): void {
    if (this.disposed) return

    const wanted = new Set<string>()
    for (const id of ids) if (this.sources[id]) wanted.add(id)

    this.dropUnwanted(wanted)
    let added = 0
    for (const id of wanted) {
      if (this.addSource(id, added * this.staggerMs)) added += 1
    }
  }

  /** Removes sources no longer wanted, disarming any group left empty. */
  private dropUnwanted(wanted: ReadonlySet<string>): void {
    for (const [interval, group] of this.groups) {
      for (const id of group.ids) if (!wanted.has(id)) group.ids.delete(id)
      if (group.ids.size === 0) {
        this.clock.clearTimeout(group.timer)
        this.groups.delete(interval)
      }
    }
  }

  /**
   * Adds a source to its interval group and schedules its first collection after
   * `delayMs`. Returns false when the source was already active.
   */
  private addSource(id: string, delayMs: number): boolean {
    const definition = this.sources[id]
    if (!definition) return false

    let group = this.groups.get(definition.intervalMs)
    if (group?.ids.has(id)) return false

    if (!group) {
      group = { intervalMs: definition.intervalMs, ids: new Set(), timer: null }
      this.groups.set(definition.intervalMs, group)
      this.arm(group)
    }
    group.ids.add(id)

    if (delayMs === 0) {
      void this.collect(id)
    } else {
      this.clock.setTimeout(() => {
        // It may have been deactivated while waiting its turn.
        if (!this.disposed && this.groups.get(definition.intervalMs)?.ids.has(id)) {
          void this.collect(id)
        }
      }, delayMs)
    }
    return true
  }

  active(): string[] {
    return [...this.groups.values()].flatMap((g) => [...g.ids]).sort()
  }

  collections(): Record<string, number> {
    return Object.fromEntries(this.counts)
  }

  /** Number of armed timers - one per distinct interval in use. */
  timerCount(): number {
    return this.groups.size
  }

  dispose(): void {
    this.disposed = true
    for (const group of this.groups.values()) this.clock.clearTimeout(group.timer)
    this.groups.clear()
  }

  private arm(group: Group): void {
    group.timer = this.clock.setTimeout(() => {
      // The group may have been emptied and removed while the timer was pending.
      if (this.disposed || this.groups.get(group.intervalMs) !== group) return
      for (const id of group.ids) void this.collect(id)
      this.arm(group)
    }, group.intervalMs)
  }

  private async collect(id: string): Promise<void> {
    const definition = this.sources[id]
    if (!definition || this.inFlight.has(id)) return

    this.inFlight.add(id)
    try {
      const data = await definition.collect()
      if (this.disposed) return
      this.counts.set(id, (this.counts.get(id) ?? 0) + 1)
      this.events.sample(id, this.clock.now(), data)
    } catch (error) {
      if (this.disposed) return
      this.events.error(id, error instanceof Error ? error.message : String(error))
    } finally {
      this.inFlight.delete(id)
    }
  }
}
