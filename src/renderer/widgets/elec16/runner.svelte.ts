import { keyCode } from '@shared/elec16/keys'
import { type ClockFields, Elec16 } from '@shared/elec16/machine'
import type { ModelId } from '@shared/elec16/map'
import { type LoopHost, TimedLoop, type TimedPolicy } from '../emu/loops.ts'
import { browserLoop, EmuRunner, type PauseReason, type RunStatus } from '../emu/runner.svelte.ts'

/**
 * Runs one ELEC-16 for a pane (docs/elec16.md section 9), on the emulators' runner
 * (widgets/emu/runner.svelte.ts) with the timed loop: cycles from a 60 Hz timer at the
 * unit's clock, a frame drawn only when the LCD changed, and nothing at all while the
 * machine sleeps in WFI - a key, BRK or the machine's own timer wakes it.
 *
 * Here is what is the ELEC-16's: booting a ROM on a model, the keys (the page's own picture
 * of SHIFT, so a character typed on the PC gets the shift it needs), BRK and the power
 * switch, the clock MAX, and going on by itself, when it comes back into sight, from the
 * prompt it was asleep at.
 */

export type { PauseReason, RunStatus }

export interface Elec16Host extends LoopHost {
  /** The time and date for the machine's CLOCK. */
  clock(): ClockFields
}

export const browserElec16Host: Elec16Host = {
  ...browserLoop,
  clock: () => {
    const d = new Date()
    return {
      second: d.getSeconds(),
      minute: d.getMinutes(),
      hour: d.getHours(),
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      weekday: d.getDay(),
    }
  },
}

const SHIFT = keyCode('shift')

export class Elec16Runner extends EmuRunner<Elec16> {
  /** Asleep in WFI: the lamp, and whether coming back into sight goes on by itself. */
  asleep = $state(false)
  /** Switched off (by the program, or the power switch). */
  off = $state(false)
  /** The LCD's annunciators, as the machine last set them. */
  annunciators = $state(0)
  /** Counts changes by hand (a step, BRK, a reset), so CORE reads the registers again. */
  stepped = $state(0)

  readonly #host: Elec16Host
  /** MAX: as many cycles as the budget allows. Shared with the loop, built before `this`. */
  readonly #speed: { max: boolean }
  /** Whether the machine's SHIFT is on, as the page has pressed it. */
  #shift = false

  constructor(host: Elec16Host) {
    const speed = { max: false }
    const sleeps: { to: (asleep: boolean) => void } = { to: () => {} }
    super(
      (owner) =>
        new TimedLoop(
          host,
          owner,
          policy(() => (speed.max ? Number.POSITIVE_INFINITY : (owner.machine?.hz ?? 0))),
          (wake) => sleeps.to(wake !== null),
        ),
    )
    this.#host = host
    this.#speed = speed
    sleeps.to = (asleep) => this.#slept(asleep)
  }

  get #timed(): TimedLoop<Elec16> {
    return this.loop as TimedLoop<Elec16>
  }

  /** Switches a machine on with `rom` in it, on `model`; the RAM given is kept (a new LCD). */
  boot(rom: Uint8Array, model: ModelId, hz: number, ram?: Uint8Array): void {
    if (this.disposed) return
    this.stopLoop()
    const machine = Elec16.boot(rom, model, ram)
    machine.setClock(this.#host.clock())
    this.setMachine(machine)
    this.setHz(hz)
    this.#shift = false
    this.pausedBy = null
    this.asleep = false
    this.#changed()
  }

  /** Takes over a machine another mount of this pane was running (a moved pane). */
  adopt(machine: Elec16, hz: number, paused: boolean): void {
    if (this.disposed) return
    this.stopLoop()
    // Keys held as the pane moved: the new mount never hears them go up.
    machine.releaseAll()
    this.setMachine(machine)
    this.setHz(hz)
    this.#shift = false
    this.pausedBy = paused ? 'player' : null
    this.#changed()
  }

  /** The machine handed over for a moved pane; this runner has none after. */
  detach(): Elec16 | null {
    const machine = this.machine
    this.stopLoop()
    this.setMachine(null)
    return machine
  }

  /** The unit's clock: cycles a second, or Infinity for MAX. */
  setHz(hz: number): void {
    this.#speed.max = !Number.isFinite(hz)
    const machine = this.machine
    if (machine !== null && Number.isFinite(hz)) machine.hz = hz
  }

  /** A key on the machine goes down; it wakes a sleeping machine. */
  press(code: number): void {
    const machine = this.machine
    if (machine === null) return
    this.#shift = code === SHIFT ? !this.#shift : false
    machine.press(code)
    this.#timed.wake()
  }

  release(code: number): void {
    this.machine?.release(code)
  }

  releaseAll(): void {
    this.machine?.releaseAll()
  }

  /**
   * A key from the PC goes down, held until its key-up: `shift` says whether the machine's
   * SHIFT must be on for it, and SHIFT is tapped first when it is not as wanted (a SHIFT left
   * on by the screen's key is taken off for a character that needs none).
   */
  down(code: number, shift: boolean): void {
    if (code !== SHIFT && this.#shift !== shift) {
      this.press(SHIFT)
      this.release(SHIFT)
    }
    this.press(code)
  }

  /** BRK/ON: stops what runs and gets the prompt back; starts a machine off or stopped. */
  brk(): void {
    const machine = this.machine
    if (machine === null) return
    machine.brk()
    this.#shift = false
    if (this.pausedBy !== null && machine.running) this.pausedBy = null
    this.#timed.wake()
    this.#changed()
  }

  /** The power switch: off, the machine keeps its RAM and waits for ON. */
  power(): void {
    const machine = this.machine
    if (machine === null) return
    if (machine.state.off) {
      this.brk()
      return
    }
    machine.powerOff()
    this.#changed()
  }

  /** One instruction, by hand (CORE's STEP), while paused. */
  step(): void {
    const machine = this.machine
    if (machine === null || this.status !== 'paused') return
    machine.step()
    this.#changed()
  }

  /** Coming back into sight, a machine that was asleep at its prompt goes on by itself. */
  override setSeen(seen: boolean): void {
    const wasAsleep = this.asleep
    super.setSeen(seen)
    if (seen && wasAsleep && this.pausedBy === 'hidden') this.resume()
  }

  /** The machine as it is now shown beside it: off, and its annunciators. */
  protected override settled(machine: Elec16 | null): void {
    const off = machine?.state.off ?? false
    if (this.off !== off) this.off = off
    const marks = machine?.state.lcd.annunciators ?? 0
    if (this.annunciators !== marks) this.annunciators = marks
  }

  protected override afterFrames(machine: Elec16): void {
    machine.setClock(this.#host.clock())
  }

  #slept(asleep: boolean): void {
    if (this.asleep !== asleep) this.asleep = asleep
  }

  #changed(): void {
    this.countChange()
    this.stepped++
    this.settle()
    this.emit()
  }
}

/** The timed loop's policy for this machine; `rate` is the unit's clock, or MAX. */
function policy(rate: () => number): TimedPolicy {
  // An LCD answers in tens of milliseconds: drawn at most thirty times a second.
  return {
    tickMs: 1000 / 60,
    maxCatchUpMs: 50,
    budgetMs: 8,
    slice: 20_000,
    rate,
    drawMs: 1000 / 30,
  }
}
