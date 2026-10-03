import { framesDue } from '@shared/emu/clock'

/**
 * Plays one emulated machine for a pane (docs/emu.md): the loop, the pause, and being seen.
 * What a machine is - how it loads, its keys, its sound - is its own runner's, built on this.
 *
 * The one kind of frame loop the page has besides the shared 10 fps one: a game is played at
 * sixty frames a second or not at all (a user decision, docs/decisions.md). It runs only
 * while the machine runs *and* the pane is seen - not paused, not halted, not behind a tab,
 * not in a window put away - and each tick runs as many machine frames as time says
 * (`framesDue`, a few at most, so a long stall is dropped, not raced through). Seen no more,
 * it pauses and stays paused until the player goes on.
 *
 * When to tick is the machine's policy. An animation frame asked for costs a pass of the
 * browser's rendering every vsync even when nothing is drawn - measured, most of what a
 * running CHIP-8 program cost. So once the screen has stood still for `stillFrames` frames
 * (a menu waiting for a key), the machine is run from a timer at the frame rate instead,
 * which asks the compositor for nothing; the first change to the screen brings the animation
 * frames back for smooth motion.
 *
 * Reactive state changes only when what it shows changes; the picture itself is not state
 * but a call to whoever draws (`onFrame`), once a tick.
 */

export type RunStatus = 'empty' | 'running' | 'paused' | 'halted'

/** Why it is paused: the player's own choice, or the pane going out of sight. */
export type PauseReason = 'player' | 'hidden'

/** The page's clocks, so a test can run a runner on its own. */
export interface LoopHost {
  requestFrame(callback: (now: number) => void): number
  cancelFrame(handle: number): void
  setTimer(callback: () => void, ms: number): number
  clearTimer(handle: number): void
  now(): number
}

/** What the loop needs of a machine. */
export interface EmuMachine {
  /** False once it has stopped by itself (an exit, an illegal instruction). */
  readonly running: boolean
  /** Counts every change to the screen, so the loop knows whether it moved. */
  readonly screenRevision: number
  /** Runs one machine frame. */
  frame(): void
}

/** When the loop ticks, the machine's own choice. */
export interface LoopPolicy {
  /** A machine frame, in milliseconds. */
  frameMs: number
  /** The most machine frames one tick runs after a stall. */
  maxCatchUp: number
  /** Machine frames with the screen unchanged before the loop drops to the timer. */
  stillFrames: number
}

export const browserLoop: LoopHost = {
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
  setTimer: (callback, ms) => window.setTimeout(callback, ms),
  clearTimer: (handle) => window.clearTimeout(handle),
  now: () => performance.now(),
}

function statusOf(machine: EmuMachine | null, pausedBy: PauseReason | null): RunStatus {
  if (machine === null) return 'empty'
  if (!machine.running) return 'halted'
  return pausedBy !== null ? 'paused' : 'running'
}

export class EmuRunner<M extends EmuMachine> {
  status = $state<RunStatus>('empty')
  pausedBy = $state<PauseReason | null>(null)

  readonly #host: LoopHost
  readonly #policy: LoopPolicy
  #machine: M | null = null
  #seen = true
  #frame: number | null = null
  /** The timer standing in for animation frames while the screen is still. */
  #timer: number | null = null
  /** Machine frames in a row that left the screen as it was. */
  #still = 0
  /** Inside a tick, which schedules the next one itself. */
  #ticking = false
  #last = 0
  #carry = 0
  #changes = 0
  #disposed = false
  readonly #listeners = new Set<() => void>()

  constructor(host: LoopHost, policy: LoopPolicy) {
    this.#host = host
    this.#policy = policy
  }

  /** The machine, to read (a view of its registers, the screen). */
  get machine(): M | null {
    return this.#machine
  }

  /** Puts a machine in (or none): its runner settles the loop round it afterwards. */
  protected setMachine(machine: M | null): void {
    this.#machine = machine
  }

  /** A runner whose pane has gone: it loads and runs nothing more. */
  protected get disposed(): boolean {
    return this.#disposed
  }

  /**
   * Counts what changed the machine - frames run, steps, loads and resets - so a machine
   * kept when the pane stops (AUTO) is written only when there is something new to keep.
   * Not state: nothing shows it.
   */
  get changes(): number {
    return this.#changes
  }

  protected countChange(): void {
    this.#changes++
  }

  /** Called after every tick that ran the machine, and when it changes by hand. */
  onFrame(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /** Whether the pane is seen. Going out of sight pauses; coming back does not resume. */
  setSeen(seen: boolean): void {
    if (seen === this.#seen) return
    this.#seen = seen
    if (!seen && this.status === 'running') this.pause('hidden')
    else this.settle()
  }

  pause(reason: PauseReason = 'player'): void {
    if (this.#machine === null || !this.#machine.running) return
    this.pausedBy = reason
    this.settle()
  }

  resume(): void {
    if (this.#machine === null || !this.#machine.running) return
    this.pausedBy = null
    this.settle()
  }

  togglePause(): void {
    if (this.pausedBy === null) this.pause()
    else this.resume()
  }

  dispose(): void {
    this.#disposed = true
    this.stopLoop()
    this.silence()
    this.#listeners.clear()
  }

  /** The machine's state shown beside the status (its keys, its screen mode), brought in line. */
  protected settled(_machine: M | null): void {}

  /** What a machine does after the frames of a tick (its sound). */
  protected afterFrames(_machine: M): void {}

  /** Stops the machine's sound at once. */
  protected silence(): void {}

  /** The loop has stopped: the sound goes, and whatever says it sounds. */
  protected quiet(): void {
    this.silence()
  }

  /** Brings status and the loop in line with the machine, the pause and being seen. */
  protected settle(): void {
    const machine = this.#machine
    // Loaded or taken up while out of sight (a start that landed after the pane was hidden):
    // paused for being hidden, as if it had been running when it went, so it never runs
    // unseen nor goes on by itself when seen.
    if (machine?.running && this.pausedBy === null && !this.#seen) this.pausedBy = 'hidden'
    const status = statusOf(machine, this.pausedBy)
    if (this.status !== status) this.status = status
    this.settled(machine)
    const wantLoop = status === 'running' && this.#seen
    if (wantLoop && !this.#looping && !this.#ticking) this.#startLoop()
    if (!wantLoop) {
      this.stopLoop()
      this.quiet()
    }
  }

  protected emit(): void {
    for (const listener of this.#listeners) listener()
  }

  get #looping(): boolean {
    return this.#frame !== null || this.#timer !== null
  }

  #startLoop(): void {
    this.#last = this.#host.now()
    this.#carry = 0
    this.#still = 0
    this.#schedule()
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

  protected stopLoop(): void {
    if (this.#frame !== null) this.#host.cancelFrame(this.#frame)
    if (this.#timer !== null) this.#host.clearTimer(this.#timer)
    this.#frame = null
    this.#timer = null
  }

  readonly #tick = (now: number): void => {
    this.#frame = null
    const machine = this.#machine
    if (machine === null) return
    this.#ticking = true
    const { frameMs, maxCatchUp } = this.#policy
    const due = framesDue(now - this.#last, this.#carry, frameMs, maxCatchUp)
    this.#last = now
    this.#carry = due.carryMs
    const before = machine.screenRevision
    for (let k = 0; k < due.frames && machine.running; k++) machine.frame()
    if (due.frames > 0) this.#changes++
    if (machine.screenRevision !== before) this.#still = 0
    else this.#still += due.frames
    if (due.frames > 0) this.afterFrames(machine)
    this.emit()
    this.settle()
    this.#ticking = false
    // Still running and seen: the next tick, keeping the time owed.
    if (this.status === 'running' && this.#seen && !this.#looping) this.#schedule()
  }
}
