import { framesDue } from '@shared/emu/clock'

/**
 * How an emulator's machine is run in time (docs/emu.md section 4): the machine's own policy,
 * given to the runner. Two kinds so far.
 *
 * `FrameLoop` (CHIP-8): a machine that runs in whole frames, sixty a second. Ticks on an
 * animation frame while the screen moves; once it has stood still for `stillFrames` frames
 * (a menu waiting for a key) it ticks from a timer instead, which asks the compositor for
 * nothing - an animation frame asked for costs a pass of the browser's rendering every vsync
 * even when nothing is drawn (measured: most of what a running CHIP-8 program cost).
 *
 * `TimedLoop` (ELEC-16): a machine that runs cycles and keeps time from the host. It runs
 * from a timer at the frame rate, asks for one animation frame only when the screen changed,
 * and stops altogether while the machine sleeps (WFI): it then waits for a key (the runner
 * calls `wake`) or for the one time the machine says it will wake, on a single timer. A
 * computer waiting at its prompt costs nothing.
 */

/** The page's clocks, so a test can run a loop on its own. */
export interface LoopHost {
  requestFrame(callback: (now: number) => void): number
  cancelFrame(handle: number): void
  setTimer(callback: () => void, ms: number): number
  clearTimer(handle: number): void
  now(): number
}

/** What a loop needs of the runner round it. */
export interface LoopOwner<M> {
  readonly machine: M | null
  /** The loop ran the machine: count it, and sound it. */
  ran(): void
  /**
   * Draw now: the screen changed (or a frame passed, for a frame machine). True while the
   * picture still changes by itself - an LCD's dots fading out - asking a timed loop for
   * one more frame; a frame loop draws every frame anyway.
   */
  draw(): boolean
  /** Brings the status and the loop in line with the machine (it may stop the loop). */
  settle(): void
  /** Whether the loop should go on: running, and seen. */
  wanted(): boolean
}

/** A loop the runner starts and stops; how it ticks is its own. */
export interface Loop {
  /** Started and not stopped (a sleeping timed loop is still active). */
  readonly active: boolean
  /** Inside a tick, which schedules the next one itself. */
  readonly ticking: boolean
  start(): void
  stop(): void
}

/* ---------------- frames ---------------- */

export interface FrameMachine {
  readonly running: boolean
  readonly screenRevision: number
  frame(): void
}

export interface FramePolicy {
  /** A machine frame, in milliseconds. */
  frameMs: number
  /** The most machine frames one tick runs after a stall. */
  maxCatchUp: number
  /** Machine frames with the screen unchanged before the loop drops to the timer. */
  stillFrames: number
}

export class FrameLoop<M extends FrameMachine> implements Loop {
  readonly #host: LoopHost
  readonly #owner: LoopOwner<M>
  readonly #policy: FramePolicy
  #frame: number | null = null
  /** The timer standing in for animation frames while the screen is still. */
  #timer: number | null = null
  /** Machine frames in a row that left the screen as it was. */
  #still = 0
  #ticking = false
  #last = 0
  #carry = 0

  constructor(host: LoopHost, owner: LoopOwner<M>, policy: FramePolicy) {
    this.#host = host
    this.#owner = owner
    this.#policy = policy
  }

  get active(): boolean {
    return this.#frame !== null || this.#timer !== null
  }

  get ticking(): boolean {
    return this.#ticking
  }

  start(): void {
    this.#last = this.#host.now()
    this.#carry = 0
    this.#still = 0
    this.#schedule()
  }

  stop(): void {
    if (this.#frame !== null) this.#host.cancelFrame(this.#frame)
    if (this.#timer !== null) this.#host.clearTimer(this.#timer)
    this.#frame = null
    this.#timer = null
  }

  /** The next tick: on an animation frame while the screen moves, on the timer once it is still. */
  #schedule(): void {
    if (this.#still >= this.#policy.stillFrames) {
      this.#timer = this.#host.setTimer(() => {
        this.#timer = null
        this.#tick(this.#host.now())
      }, this.#policy.frameMs)
    } else {
      this.#frame = this.#host.requestFrame(this.#tick)
    }
  }

  readonly #tick = (now: number): void => {
    this.#frame = null
    const machine = this.#owner.machine
    if (machine === null) return
    this.#ticking = true
    const { frameMs, maxCatchUp } = this.#policy
    const due = framesDue(now - this.#last, this.#carry, frameMs, maxCatchUp)
    this.#last = now
    this.#carry = due.carryMs
    const before = machine.screenRevision
    for (let k = 0; k < due.frames && machine.running; k++) machine.frame()
    if (machine.screenRevision !== before) this.#still = 0
    else this.#still += due.frames
    if (due.frames > 0) this.#owner.ran()
    this.#owner.draw()
    this.#owner.settle()
    this.#ticking = false
    // Still running and seen: the next tick, keeping the time owed.
    if (this.#owner.wanted() && !this.active) this.#schedule()
  }
}

/* ---------------- timed ---------------- */

/** What a sleeping machine waits for: a key, or the timer in so many milliseconds. */
export interface Wake {
  key: boolean
  /** A pad's buttons wake it (a machine that has one). */
  pad?: boolean
  timerMs: number | null
}

export interface TimedMachine {
  readonly running: boolean
  readonly screenRevision: number
  /** Cycles a second. */
  readonly hz: number
  /** Host time passes (its timer counts). */
  advance(ms: number): void
  /** Runs up to `cycles` cycles. */
  run(cycles: number): { cycles: number; sleeping: Wake | null }
}

export interface TimedPolicy {
  /** How often it runs while awake, in milliseconds. */
  tickMs: number
  /** The most host time one tick catches up, in milliseconds (a stall is dropped, not raced). */
  maxCatchUpMs: number
  /** The most a tick may take, in milliseconds, whatever the clock asks for (MAX, a slow PC). */
  budgetMs: number
  /** Cycles run between looks at the time, against the budget. */
  slice: number
  /** Cycles a second to run, when not the machine's own clock: Infinity is MAX (the budget). */
  rate?: () => number
  /**
   * The least time between two draws, in milliseconds: a screen slower than the display (an
   * LCD) need not be drawn at its rate, and every frame drawn costs the compositor and the
   * GPU about a fifth of a core here (measured).
   */
  drawMs?: number
}

export class TimedLoop<M extends TimedMachine> implements Loop {
  readonly #host: LoopHost
  readonly #owner: LoopOwner<M>
  readonly #policy: TimedPolicy
  #active = false
  #ticking = false
  #timer: number | null = null
  #frame: number | null = null
  /** The timer holding back a draw until `drawMs` has passed since the last. */
  #drawTimer: number | null = null
  #drawnAt = Number.NEGATIVE_INFINITY
  /** What the sleeping machine waits for, or null while it is awake. */
  #asleep: Wake | null = null
  /** wake() came from outside since the last run settled: its next sleep is told. */
  #woken = false
  #last = 0
  /** Cycles owed to the next tick (the clock does not divide the tick evenly). */
  #owed = 0
  #drawn = -1
  readonly #onSleep: (wake: Wake | null) => void

  constructor(
    host: LoopHost,
    owner: LoopOwner<M>,
    policy: TimedPolicy,
    onSleep: (wake: Wake | null) => void,
  ) {
    this.#host = host
    this.#owner = owner
    this.#policy = policy
    this.#onSleep = onSleep
  }

  get active(): boolean {
    return this.#active
  }

  get ticking(): boolean {
    return this.#ticking
  }

  /** Asleep in WFI: what it waits for. */
  get asleep(): Wake | null {
    return this.#asleep
  }

  start(): void {
    this.#active = true
    this.#last = this.#host.now()
    this.#owed = 0
    // Started afresh - perhaps on another machine: whether it sleeps is told again, and its
    // screen is drawn whatever count of changes it shows. The owner hears that it is awake
    // now, or a machine that wakes in the first tick would still be told asleep.
    if (this.#asleep !== null) {
      this.#asleep = null
      this.#onSleep(null)
    }
    this.#drawn = -1
    this.#schedule(0)
  }

  stop(): void {
    this.#active = false
    this.#clear()
    if (this.#frame !== null) this.#host.cancelFrame(this.#frame)
    if (this.#drawTimer !== null) this.#host.clearTimer(this.#drawTimer)
    this.#frame = null
    this.#drawTimer = null
  }

  /** A key went down, or something else the machine may wake for: run again now. */
  wake(): void {
    if (!this.#active || this.#asleep === null) return
    this.#woken = true
    this.#clear()
    this.#schedule(0)
  }

  #clear(): void {
    if (this.#timer !== null) this.#host.clearTimer(this.#timer)
    this.#timer = null
  }

  #schedule(ms: number): void {
    this.#clear()
    this.#timer = this.#host.setTimer(() => {
      this.#timer = null
      this.#tick()
    }, ms)
  }

  #tick(): void {
    const machine = this.#owner.machine
    if (machine === null || !this.#active) return
    this.#ticking = true
    const now = this.#host.now()
    const elapsed = Math.max(0, now - this.#last)
    this.#last = now
    // Time always passes in full for the machine's timer and clock; only the cycles it may
    // run for it are capped, so a stall is dropped rather than raced through.
    machine.advance(elapsed)
    const hz = this.#policy.rate?.() ?? machine.hz
    const wanted = (hz * Math.min(elapsed, this.#policy.maxCatchUpMs)) / 1000 + this.#owed
    const sleeping = this.#runFor(machine, wanted, now)
    this.#owner.ran()
    if (machine.screenRevision !== this.#drawn) this.#requestDraw()
    this.#owner.settle()
    this.#ticking = false
    this.#settleSleep(sleeping)
  }

  /** Runs `cycles` in slices, stopping at the budget; what it sleeps for, if it fell asleep. */
  #runFor(machine: M, cycles: number, started: number): Wake | null {
    // MAX asks for every cycle the budget allows: nothing is owed after it.
    let left = Number.isFinite(cycles) ? Math.floor(cycles) : Number.POSITIVE_INFINITY
    this.#owed = Number.isFinite(cycles) ? cycles - left : 0
    while (left > 0) {
      const result = machine.run(Math.min(left, this.#policy.slice))
      left -= result.cycles
      if (result.sleeping !== null || result.cycles === 0) {
        this.#owed = 0
        return result.sleeping
      }
      if (this.#host.now() - started > this.#policy.budgetMs) {
        // The PC cannot keep up: what is left is dropped, not owed.
        this.#owed = 0
        return null
      }
    }
    return null
  }

  #settleSleep(sleeping: Wake | null): void {
    const was = this.#asleep
    this.#asleep = sleeping
    // Woken from outside (BRK, a key), it may sleep again within the run: a new sleep, which
    // the owner hears though the one before it never ended for it (an INPUT, then the prompt).
    const again = this.#woken && sleeping !== null
    this.#woken = false
    if ((was === null) !== (sleeping === null) || again) this.#onSleep(sleeping)
    if (!this.#active || !this.#owner.wanted()) return
    if (sleeping === null) this.#schedule(this.#policy.tickMs)
    else if (sleeping.timerMs !== null) this.#schedule(Math.max(0, sleeping.timerMs))
  }

  /**
   * One animation frame to draw what changed, never more than one waiting, and not before
   * `drawMs` has passed since the last draw (a timer holds it back till then).
   */
  #requestDraw(): void {
    if (!this.#active || this.#frame !== null || this.#drawTimer !== null) return
    const wait = (this.#policy.drawMs ?? 0) - (this.#host.now() - this.#drawnAt)
    if (wait > 1) {
      this.#drawTimer = this.#host.setTimer(() => {
        this.#drawTimer = null
        this.#requestDraw()
      }, wait)
      return
    }
    this.#frame = this.#host.requestFrame(() => {
      this.#frame = null
      this.#drawnAt = this.#host.now()
      this.#drawn = this.#owner.machine?.screenRevision ?? -1
      // Still fading: one more frame, until the picture rests.
      if (this.#owner.draw()) this.#requestDraw()
    })
  }
}
