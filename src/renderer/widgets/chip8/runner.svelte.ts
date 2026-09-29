import type { Tone } from '@shared/chip8/audio'
import { Chip8 } from '@shared/chip8/machine'
import type { Quirks } from '@shared/chip8/types'
import type { Chip8Program } from '@shared/chip8-library'
import { framesDue } from '@shared/emu/clock'

/**
 * Plays one CHIP-8 machine for a pane (docs/architecture.md section 5.18).
 *
 * The one place in the page with a frame loop of its own: a game is played at 60 frames a
 * second or not at all, so the 10 fps loop cannot carry it (a decision recorded in section
 * 16). It runs only while the program runs *and* the pane is seen - not paused, not halted,
 * not behind a tab, not in a window put away - and each animation frame runs as many
 * machine frames as time says (`framesDue`, three at most, so a long stall is dropped, not
 * raced through). Seen no more, it pauses and stays paused until the player goes on.
 *
 * An animation frame asked for costs a pass of the browser's rendering every vsync even when
 * nothing is drawn - measured, most of what a running program cost. So once the screen has
 * stood still for half a second (a menu waiting for a key, a test that has finished), the
 * machine is run from a 60 Hz timer instead, which asks the compositor for nothing; the
 * first change to the screen brings the animation frames back for smooth motion.
 *
 * Reactive state changes only when what it shows changes; the picture itself is not state
 * but a call to whoever draws (`onFrame`), up to sixty a second.
 */

export type RunStatus = 'empty' | 'running' | 'paused' | 'halted'

/** Why it is paused: the player's own choice, or the pane going out of sight. */
export type PauseReason = 'player' | 'hidden'

export interface RunnerHost {
  requestFrame(callback: (now: number) => void): number
  cancelFrame(handle: number): void
  setTimer(callback: () => void, ms: number): number
  clearTimer(handle: number): void
  now(): number
  /** Called after the frames of each animation frame, with the tone to sound, or null for silence. */
  sound(tone: Tone | null): void
}

const FRAME_MS = 1000 / 60
const MAX_CATCH_UP = 3
/** Machine frames with the screen unchanged before the loop drops to the timer. */
export const STILL_FRAMES = 30

function statusOf(machine: Chip8 | null, pausedBy: PauseReason | null): RunStatus {
  if (machine === null) return 'empty'
  if (!machine.running) return 'halted'
  return pausedBy !== null ? 'paused' : 'running'
}

export const browserHost = (sound: (tone: Tone | null) => void): RunnerHost => ({
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
  setTimer: (callback, ms) => window.setTimeout(callback, ms),
  clearTimer: (handle) => window.clearTimeout(handle),
  now: () => performance.now(),
  sound,
})

export class Chip8Runner {
  status = $state<RunStatus>('empty')
  pausedBy = $state<PauseReason | null>(null)
  program = $state<Chip8Program | null>(null)
  /** The pads held down, from the keyboard or the on-screen keypad (one bit each). */
  keys = $state(0)
  /** The pads the program has asked about. */
  sensed = $state(0)
  sounding = $state(false)
  /** SUPER-CHIP's high resolution is on. */
  hires = $state(false)
  /** Counts steps taken by hand, so a view of the registers redraws after each. */
  stepped = $state(0)

  readonly #host: RunnerHost
  #machine: Chip8 | null = null
  #rom: Uint8Array | null = null
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
  readonly #listeners = new Set<() => void>()

  constructor(host: RunnerHost) {
    this.#host = host
  }

  /** The program's bytes, as loaded: kept for a reset, and for a moved pane to take up. */
  get rom(): Uint8Array | null {
    return this.#rom
  }

  /** The machine, to read (a view of its registers, the screen). */
  get machine(): Chip8 | null {
    return this.#machine
  }

  /** Called after every animation frame that ran the machine, and when it changes by hand. */
  onFrame(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  /** Starts `program` from its bytes, or from a snapshot of it when one is given and good. */
  load(program: Chip8Program, rom: Uint8Array, seed: number, snapshot?: Uint8Array): void {
    this.#stopLoop()
    const restored = snapshot !== undefined ? Chip8.restore(snapshot) : null
    this.#machine =
      restored ??
      Chip8.load(
        rom,
        {
          platform: program.platform,
          quirks: program.quirks,
          ipf: program.ipf,
          font: program.font,
        },
        seed,
      )
    this.#rom = rom
    this.program = program
    this.keys = 0
    this.pausedBy = null
    this.#settle()
    this.#emit()
  }

  /** Takes over a machine another mount of this pane was running (a moved pane). */
  adopt(program: Chip8Program, rom: Uint8Array, machine: Chip8, paused: boolean): void {
    this.#stopLoop()
    this.#machine = machine
    this.#rom = rom
    this.program = program
    this.pausedBy = paused ? 'player' : null
    this.#settle()
    this.#emit()
  }

  /** Starts the program again from its first instruction, with its tuning kept. */
  reset(seed: number): void {
    const machine = this.#machine
    const program = this.program
    if (machine === null || program === null || this.#rom === null) return
    const { config } = machine.state
    this.#stopLoop()
    this.#host.sound(null)
    this.#machine = Chip8.load(this.#rom, config, seed)
    this.pausedBy = null
    this.#settle()
    this.#emit()
  }

  /** Whether the pane is seen. Going out of sight pauses; coming back does not resume. */
  setSeen(seen: boolean): void {
    if (seen === this.#seen) return
    this.#seen = seen
    if (!seen && this.status === 'running') this.pause('hidden')
    else this.#settle()
  }

  pause(reason: PauseReason = 'player'): void {
    if (this.#machine === null || !this.#machine.running) return
    this.pausedBy = reason
    this.#settle()
  }

  resume(): void {
    if (this.#machine === null || !this.#machine.running) return
    this.pausedBy = null
    this.#settle()
  }

  togglePause(): void {
    if (this.pausedBy === null) this.pause()
    else this.resume()
  }

  /** One whole frame while paused (the pane's Enter). */
  stepFrame(): void {
    if (this.#machine === null || this.pausedBy === null) return
    this.#machine.frame()
    this.#afterHand()
  }

  /** One instruction while paused (CORE's STEP). */
  stepInstruction(): void {
    if (this.#machine === null || this.pausedBy === null) return
    this.#machine.step()
    this.#afterHand()
  }

  press(key: number): void {
    this.#machine?.press(key)
    this.keys |= 1 << key
  }

  release(key: number): void {
    this.#machine?.release(key)
    this.keys &= ~(1 << key)
  }

  /** The pane lost the keyboard: every pad goes up, and none is delivered. */
  releaseAll(): void {
    this.#machine?.releaseAll()
    this.keys = 0
  }

  tune(change: { ipf?: number; quirks?: Partial<Quirks> }): void {
    this.#machine?.tune(change)
    this.#emit()
  }

  dispose(): void {
    this.#stopLoop()
    this.#host.sound(null)
    this.#listeners.clear()
  }

  /** Lets go of the machine for another mount to take up: the loop stops, the machine stays. */
  detach(): Chip8 | null {
    this.#stopLoop()
    this.#host.sound(null)
    return this.#machine
  }

  #afterHand(): void {
    this.stepped++
    this.#settle()
    this.#emit()
  }

  /** Brings status, sound and the loop in line with the machine, the pause and being seen. */
  #settle(): void {
    const machine = this.#machine
    const status = statusOf(machine, this.pausedBy)
    if (this.status !== status) this.status = status
    const sensed = machine?.state.sensed ?? 0
    if (this.sensed !== sensed) this.sensed = sensed
    const hires = machine?.state.hires ?? false
    if (this.hires !== hires) this.hires = hires
    const wantLoop = status === 'running' && this.#seen
    if (wantLoop && !this.#looping && !this.#ticking) this.#startLoop()
    if (!wantLoop) {
      this.#stopLoop()
      this.#host.sound(null)
      if (this.sounding) this.sounding = false
    }
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
    if (this.#still >= STILL_FRAMES) {
      this.#timer = this.#host.setTimer(() => {
        this.#timer = null
        this.#tick(this.#host.now())
      }, FRAME_MS)
    } else {
      this.#frame = this.#host.requestFrame(this.#tick)
    }
  }

  #stopLoop(): void {
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
    const due = framesDue(now - this.#last, this.#carry, FRAME_MS, MAX_CATCH_UP)
    this.#last = now
    this.#carry = due.carryMs
    const before = machine.state.screenRevision
    for (let k = 0; k < due.frames && machine.running; k++) machine.frame()
    if (machine.state.screenRevision !== before) this.#still = 0
    else this.#still += due.frames
    if (due.frames > 0) {
      const tone = machine.tone
      this.#host.sound(tone)
      const sounding = tone.seconds > 0
      if (this.sounding !== sounding) this.sounding = sounding
    }
    this.#emit()
    this.#settle()
    this.#ticking = false
    // Still running and seen: the next tick, keeping the time owed.
    if (this.status === 'running' && this.#seen && !this.#looping) this.#schedule()
  }

  #emit(): void {
    for (const listener of this.#listeners) listener()
  }
}
