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
 *    same instant on Windows, a CPU spike visible on the app's own CPU graph;
 *  - a source that cannot change while the app runs (the OS version, the machine
 *    model) is collected once per collector. Subscribing to it again - a pane
 *    moved, a page reloaded - is answered from the broker's cache instead of
 *    spending another second or two of wmic and PowerShell on the same answer.
 *    Only a failed collection is tried again, on a widening delay.
 *
 * Pure apart from the injected clock, so all of the above is unit-tested with
 * fake timers.
 */

/** A source polled every `intervalMs`, or collected once (`once: true`). */
export type SourceDefinition =
  | { intervalMs: number; once?: never; collect: () => Promise<unknown> }
  | { once: true; intervalMs?: never; collect: () => Promise<unknown> }

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

/** Delays before retrying a once-only source that failed; the last one repeats. */
export const ONCE_RETRY_MS = [30_000, 120_000, 600_000] as const

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

interface Retry {
  failures: number
  timer: unknown
}

export class MetricScheduler {
  private readonly sources: Readonly<Record<string, SourceDefinition>>
  private readonly events: SchedulerEvents
  private readonly clock: Clock
  private readonly groups = new Map<number, Group>()
  private readonly inFlight = new Set<string>()
  private readonly counts = new Map<string, number>()
  /** Once-only sources somebody is watching. */
  private readonly onceActive = new Set<string>()
  /** Once-only sources collected successfully: never collected again. */
  private readonly onceDone = new Set<string>()
  /** Once-only sources that failed, with how often, and the pending retry. */
  private readonly retries = new Map<string, Retry>()
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

  /** Removes sources no longer wanted, disarming any timer left without a use. */
  private dropUnwanted(wanted: ReadonlySet<string>): void {
    for (const [interval, group] of this.groups) {
      for (const id of group.ids) if (!wanted.has(id)) group.ids.delete(id)
      if (group.ids.size === 0) {
        this.clock.clearTimeout(group.timer)
        this.groups.delete(interval)
      }
    }
    for (const id of this.onceActive) {
      if (wanted.has(id)) continue
      this.onceActive.delete(id)
      // The failure count stays, so dropping and re-adding does not reset the backoff.
      const retry = this.retries.get(id)
      if (retry) this.disarm(retry)
    }
  }

  /**
   * Adds a source and schedules its first collection after `delayMs`. Returns
   * false when nothing was scheduled: the source was already active, or it is a
   * once-only source that already has its answer or is waiting to retry.
   */
  private addSource(id: string, delayMs: number): boolean {
    const definition = this.sources[id]
    if (!definition) return false
    if (definition.once) return this.addOnce(id, delayMs)

    let group = this.groups.get(definition.intervalMs)
    if (group?.ids.has(id)) return false

    if (!group) {
      group = { intervalMs: definition.intervalMs, ids: new Set(), timer: null }
      this.groups.set(definition.intervalMs, group)
      this.arm(group)
    }
    group.ids.add(id)
    this.collectLater(id, delayMs)
    return true
  }

  private addOnce(id: string, delayMs: number): boolean {
    if (this.onceActive.has(id)) return false
    this.onceActive.add(id)
    if (this.onceDone.has(id)) return false

    const retry = this.retries.get(id)
    if (retry) {
      this.scheduleRetry(id, retry)
      return false
    }
    this.collectLater(id, delayMs)
    return true
  }

  /** Collects a source after `delayMs`, if it is still wanted by then. */
  private collectLater(id: string, delayMs: number): void {
    if (delayMs === 0) {
      void this.collect(id)
      return
    }
    this.clock.setTimeout(() => {
      // It may have been deactivated while waiting its turn.
      if (!this.disposed && this.isActive(id)) void this.collect(id)
    }, delayMs)
  }

  private isActive(id: string): boolean {
    const definition = this.sources[id]
    if (!definition) return false
    if (definition.once) return this.onceActive.has(id)
    return this.groups.get(definition.intervalMs)?.ids.has(id) === true
  }

  private scheduleRetry(id: string, retry: Retry): void {
    this.disarm(retry)
    const step = Math.min(retry.failures, ONCE_RETRY_MS.length) - 1
    retry.timer = this.clock.setTimeout(() => {
      retry.timer = null
      if (!this.disposed && this.onceActive.has(id)) void this.collect(id)
    }, ONCE_RETRY_MS[step] ?? ONCE_RETRY_MS[0])
  }

  private disarm(retry: Retry): void {
    if (retry.timer !== null) this.clock.clearTimeout(retry.timer)
    retry.timer = null
  }

  private onceFailed(id: string): void {
    const retry = this.retries.get(id) ?? { failures: 0, timer: null }
    retry.failures += 1
    this.retries.set(id, retry)
    if (this.onceActive.has(id)) this.scheduleRetry(id, retry)
  }

  active(): string[] {
    const polled = [...this.groups.values()].flatMap((g) => [...g.ids])
    return [...polled, ...this.onceActive].sort()
  }

  collections(): Record<string, number> {
    return Object.fromEntries(this.counts)
  }

  /** Number of armed interval timers - one per distinct interval in use. */
  timerCount(): number {
    return this.groups.size
  }

  dispose(): void {
    this.disposed = true
    for (const group of this.groups.values()) this.clock.clearTimeout(group.timer)
    this.groups.clear()
    for (const retry of this.retries.values()) this.disarm(retry)
    this.onceActive.clear()
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
    if (!definition || this.inFlight.has(id) || this.onceDone.has(id)) return

    this.inFlight.add(id)
    try {
      const data = await definition.collect()
      if (this.disposed) return
      this.counts.set(id, (this.counts.get(id) ?? 0) + 1)
      if (definition.once) {
        this.onceDone.add(id)
        this.retries.delete(id)
      }
      this.events.sample(id, this.clock.now(), data)
    } catch (error) {
      if (this.disposed) return
      if (definition.once) this.onceFailed(id)
      this.events.error(id, error instanceof Error ? error.message : String(error))
    } finally {
      this.inFlight.delete(id)
    }
  }
}
