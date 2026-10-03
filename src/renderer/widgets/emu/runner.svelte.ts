import type { Loop, LoopHost, LoopOwner } from './loops.ts'

/**
 * Plays one emulated machine for a pane (docs/emu.md): the status, the pause, and being seen.
 * When and how the machine runs in time is its loop's (loops.ts: frames for CHIP-8, timed
 * cycles with sleep for ELEC-16), which each machine's runner gives this one; what a machine
 * is - how it loads, its keys, its sound - is that runner's too.
 *
 * The one kind of loop the page has besides the shared 10 fps one: a game is played at sixty
 * frames a second or not at all (a user decision, docs/decisions.md). It runs only while the
 * machine runs *and* the pane is seen - not paused, not halted, not behind a tab, not in a
 * window put away. Seen no more, it pauses and stays paused until the player goes on.
 *
 * Reactive state changes only when what it shows changes; the picture itself is not state
 * but a call to whoever draws (`onFrame`).
 */

export type { LoopHost }

export type RunStatus = 'empty' | 'running' | 'paused' | 'halted'

/** Why it is paused: the player's own choice, or the pane going out of sight. */
export type PauseReason = 'player' | 'hidden'

/** What the runner needs of a machine, whatever its loop. */
export interface EmuMachine {
  /** False once it has stopped by itself (an exit, an illegal instruction). */
  readonly running: boolean
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

  readonly #loop: Loop
  #machine: M | null = null
  #seen = true
  #changes = 0
  #disposed = false
  readonly #listeners = new Set<() => void>()

  /** `makeLoop` builds the machine's loop round the owner this runner gives it. */
  constructor(makeLoop: (owner: LoopOwner<M>) => Loop) {
    const owner: LoopOwner<M> = {
      machine: null,
      ran: () => {
        this.#changes++
        if (this.#machine !== null) this.afterFrames(this.#machine)
      },
      draw: () => this.emit(),
      settle: () => this.settle(),
      wanted: () => this.status === 'running' && this.#seen,
    }
    Object.defineProperty(owner, 'machine', { get: () => this.#machine })
    this.#loop = makeLoop(owner)
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

  /** The loop, for a runner that wakes it (a key to a sleeping machine). */
  protected get loop(): Loop {
    return this.#loop
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

  /** What a machine does after its loop ran it (its sound). */
  protected afterFrames(_machine: M): void {}

  /** Stops the machine's sound at once. */
  protected silence(): void {}

  /** The loop has stopped: the sound goes, and whatever says it sounds. */
  protected quiet(): void {
    this.silence()
  }

  protected stopLoop(): void {
    this.#loop.stop()
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
    if (wantLoop && !this.#loop.active && !this.#loop.ticking) this.#loop.start()
    if (!wantLoop) {
      this.#loop.stop()
      this.quiet()
    }
  }

  protected emit(): void {
    for (const listener of this.#listeners) listener()
  }
}
