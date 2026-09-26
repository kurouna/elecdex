import {
  type AwakeHold,
  type AwakeRequest,
  type AwakeState,
  type BlockerKind,
  blockerKind,
  extendHold,
  holdExpired,
  holdFor,
  RELEASED,
  restoreHold,
} from '@shared/utility'

/** Electron's powerSaveBlocker, as far as the hold uses it. */
export interface PowerBlocker {
  start(kind: BlockerKind): number
  stop(id: number): void
  isStarted(id: number): boolean
}

export interface AwakeDeps {
  blocker: PowerBlocker
  /** The hold saved last time, as the file had it. */
  load(): AwakeHold
  save(hold: AwakeHold): void
  now(): number
  setTimer(fn: () => void, ms: number): unknown
  clearTimer(handle: unknown): void
  onBattery(): boolean
  /** Told every time the state changes. */
  publish(state: AwakeState): void
}

/**
 * AWAKE's hold (docs/architecture.md section 5.16): one for the machine,
 * main's, whether or not a pane shows it.
 *
 * The system is asked through powerSaveBlocker, which Chromium carries out in
 * the process itself on every platform - no program is started, nothing has
 * to be asked again every so often, and the system lets go by itself when the
 * process ends, crashed or not. A change of level takes the new request
 * before letting go of the old one, so the machine is never unheld between.
 *
 * The hold is saved on every change and taken up again at start (`start`),
 * unless it has ended meanwhile. Its end is one timer for `until`, checked
 * again when it fires early and after the machine wakes (`check`): no tick.
 */
export class AwakeService {
  private readonly deps: AwakeDeps
  private hold: AwakeHold = RELEASED
  private blockId: number | null = null
  private timer: unknown = null

  constructor(deps: AwakeDeps) {
    this.deps = deps
  }

  /** Takes up the hold saved last time, or writes it off when it has ended. */
  start(): void {
    const saved = this.deps.load()
    const restored = restoreHold(saved, this.deps.now())
    if (restored.level === 'off') {
      if (saved.level !== 'off') this.deps.save(RELEASED)
      return
    }
    this.apply(restored)
  }

  state(): AwakeState {
    return {
      ...this.hold,
      held: this.blockId !== null && this.deps.blocker.isStarted(this.blockId),
      onBattery: this.deps.onBattery(),
    }
  }

  set(request: AwakeRequest): AwakeState {
    this.apply(holdFor(request, this.deps.now()))
    return this.state()
  }

  extend(ms: number): AwakeState {
    const next = extendHold(this.hold, ms, this.deps.now())
    if (next !== this.hold) this.apply(next)
    return this.state()
  }

  /** Lets go when the end has come: when the timer fires, and after a sleep. */
  check(): void {
    if (holdExpired(this.hold, this.deps.now())) this.apply(RELEASED)
    else this.arm()
  }

  /** The power source changed: only what the page shows. */
  powerChanged(): void {
    this.deps.publish(this.state())
  }

  /**
   * Lets go of the system's request and the timer, keeping the saved hold: a
   * quit is not a turning off, and the next start takes it up again.
   */
  dispose(): void {
    this.deps.clearTimer(this.timer)
    this.timer = null
    if (this.blockId !== null) this.deps.blocker.stop(this.blockId)
    this.blockId = null
  }

  private apply(next: AwakeHold): void {
    const kind = blockerKind(next.level)
    if (kind !== blockerKind(this.hold.level) || this.blockId === null) {
      // The new request first: between the two, the machine would be free to sleep.
      const previous = this.blockId
      this.blockId = kind === null ? null : this.deps.blocker.start(kind)
      if (previous !== null) this.deps.blocker.stop(previous)
    }
    this.hold = next
    this.deps.save(next)
    this.arm()
    this.deps.publish(this.state())
  }

  private arm(): void {
    this.deps.clearTimer(this.timer)
    this.timer = null
    if (this.hold.until === null) return
    const wait = Math.max(0, this.hold.until - this.deps.now())
    this.timer = this.deps.setTimer(() => this.check(), wait)
  }
}
