import { CARD_STATUS, type CardAnswer, type CardRequest } from '@shared/elec16/card'
import { keyCode } from '@shared/elec16/keys'
import { type ClockFields, Elec16 } from '@shared/elec16/machine'
import { DEFAULT_MODEL, type ModelId } from '@shared/elec16/map'
import { KEY_FIFO_SIZE } from '@shared/elec16/state'
import { type LoopHost, TimedLoop, type TimedPolicy, type Wake } from '../emu/loops.ts'
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
  /** The buzzer: `freq` Hz for `ms` more (Infinity while gated), `mark` one tone's; 0 silence. */
  buzz?(freq: number, ms: number, mark: string): void
  /** The buzzer quiet at once. */
  hush?(): void
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
const CAPS = keyCode('caps')

export class Elec16Runner extends EmuRunner<Elec16> {
  /** Asleep in WFI: the lamp, and whether coming back into sight goes on by itself. */
  asleep = $state(false)
  /** Switched off (by the program, or the power switch). */
  off = $state(false)
  /** The LCD's annunciators, as the machine last set them. */
  annunciators = $state(0)
  /** Counts changes by hand (a step, BRK, a reset), so CORE reads the registers again. */
  stepped = $state(0)
  /** Keys PASTE has still to press: TUNE shows them, and pressing PASTE again stops it. */
  pasting = $state(0)
  /** The LCD fitted: the machine itself is not state, so its model is kept here for the views. */
  model = $state<ModelId>(DEFAULT_MODEL)
  /**
   * Where a card command the machine gives goes (the pane's unit, through main); none: the
   * card is not there, and the command is answered so.
   */
  onCard: ((request: CardRequest) => Promise<CardAnswer>) | null = null
  /** Auto power-off: how long asleep waiting for a key switches it off; 0 never. */
  autoOffMs = 0
  /** Switched off by auto power-off (the pane keeps the battery backup, as for the switch). */
  onAutoOff: (() => void) | null = null

  readonly #host: Elec16Host
  /** MAX: as many cycles as the budget allows. Shared with the loop, built before `this`. */
  readonly #speed: { max: boolean }
  /** Whether the machine's SHIFT is on, as the page has pressed it. */
  #shift = false
  /** PASTE's keys, pressed as the key FIFO has room (`pasteKeys`). */
  #paste: number[] = []
  /** Auto power-off's one timer, while the machine sleeps for a key and nothing else. */
  #offTimer: number | null = null

  constructor(host: Elec16Host) {
    const speed = { max: false }
    const sleeps: { to: (wake: Wake | null) => void } = { to: () => {} }
    super(
      (owner) =>
        new TimedLoop(
          host,
          owner,
          policy(() => (speed.max ? Number.POSITIVE_INFINITY : (owner.machine?.hz ?? 0))),
          (wake) => sleeps.to(wake),
        ),
    )
    this.#host = host
    this.#speed = speed
    sleeps.to = (wake) => this.#slept(wake)
  }

  get #timed(): TimedLoop<Elec16> {
    return this.loop as TimedLoop<Elec16>
  }

  /**
   * Switches a machine on with `rom` in it, on `model`; the RAM given is kept (a new LCD), and
   * a machine the player had paused stays paused.
   */
  boot(rom: Uint8Array, model: ModelId, hz: number, ram?: Uint8Array): void {
    const paused = this.pausedBy === 'player'
    if (this.disposed) return
    this.stopLoop()
    const machine = Elec16.boot(rom, model, ram)
    machine.setClock(this.#host.clock())
    this.setMachine(machine)
    this.setHz(hz)
    this.#shift = false
    this.stopPaste()
    this.pausedBy = paused ? 'player' : null
    this.asleep = false
    this.model = model
    this.#changed()
  }

  /** Takes over a machine another mount of this pane was running (a moved pane). */
  adopt(machine: Elec16, hz: number, paused: boolean): void {
    if (this.disposed) return
    this.stopLoop()
    // Keys held as the pane moved: the new mount never hears them go up.
    machine.releaseAll()
    this.setMachine(machine)
    this.model = machine.state.model
    this.setHz(hz)
    this.#shift = false
    this.stopPaste()
    this.pausedBy = paused ? 'player' : null
    this.#changed()
  }

  /** The machine handed over for a moved pane; this runner has none after. */
  detach(): Elec16 | null {
    const machine = this.machine
    this.stopLoop()
    this.stopPaste()
    this.setMachine(null)
    this.settle()
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
    // As the ROM has it: SHIFT holds for the next key, and CAPS does not use it up.
    if (code === SHIFT) this.#shift = !this.#shift
    else if (code !== CAPS) this.#shift = false
    machine.press(code)
    this.#timed.wake()
    // A key to a machine asleep for one starts auto power-off's count again (the loop tells
    // only of falling asleep, not of a key taken between two sleeps).
    if (this.asleep) this.#armOff()
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

  /**
   * PASTE: these keys pressed one after another, a few at a time as the machine takes them
   * from its FIFO, so none is lost; a paste under way is replaced.
   */
  paste(keys: readonly number[]): void {
    if (this.machine === null || this.machine.state.off) return
    this.#paste = [...keys]
    this.#feed(this.machine)
  }

  /** PASTE stops where it is. */
  stopPaste(): void {
    this.#paste = []
    if (this.pasting !== 0) this.pasting = 0
  }

  /** As many of PASTE's keys as the FIFO has room for, one place kept for the person's own. */
  #feed(machine: Elec16): void {
    if (this.#paste.length === 0) return
    let room = KEY_FIFO_SIZE - 1 - machine.state.keys.fifo.length
    while (room > 0 && this.#paste.length > 0) {
      const code = this.#paste.shift() ?? 0
      this.press(code)
      this.release(code)
      room--
    }
    if (this.pasting !== this.#paste.length) this.pasting = this.#paste.length
  }

  /** BRK/ON: stops what runs and gets the prompt back; starts a machine off or stopped. */
  brk(): void {
    const machine = this.machine
    if (machine === null) return
    machine.brk()
    this.#shift = false
    this.stopPaste()
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
    this.stopPaste()
    this.#changed()
  }

  /** One instruction, by hand (CORE's STEP), while paused. */
  step(): void {
    const machine = this.machine
    if (machine === null || this.status !== 'paused') return
    machine.step()
    this.#changed()
  }

  /** Paused, out of sight, stopped: the buzzer too, and auto power-off waits no more. */
  protected override silence(): void {
    this.#host.hush?.()
    this.#disarmOff()
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
    const b = machine.state.buzzer
    const left = b.gate ? Number.POSITIVE_INFINITY : b.duration - (machine.state.time - b.started)
    this.#host.buzz?.(b.freq, left, `${b.freq}:${b.gate}:${b.started}`)
    const request = machine.takeCardRequest()
    if (request !== null) void this.#relay(machine, request)
    this.#feed(machine)
  }

  /** A card command to main and its answer back, waking the machine that waits for it. */
  async #relay(machine: Elec16, request: CardRequest): Promise<void> {
    let answer: CardAnswer = { status: CARD_STATUS.noCard }
    try {
      if (this.onCard !== null) answer = await this.onCard(request)
    } catch {
      // main could not be asked: the card is as good as not there.
    }
    machine.answerCard(request, answer)
    if (this.machine === machine) this.#timed.wake()
  }

  #slept(wake: Wake | null): void {
    const asleep = wake !== null
    if (this.asleep !== asleep) this.asleep = asleep
    if (wake?.key === true && wake.timerMs === null) this.#armOff()
    else this.#disarmOff()
    // Asleep waiting for a key: PASTE's next ones wake it - those given after the frames too,
    // which came while the loop still had it awake, when a key does not wake it.
    const machine = this.machine
    if (!asleep || machine === null) return
    this.#feed(machine)
    if (machine.state.keys.fifo.length > 0) this.#timed.wake()
  }

  #armOff(): void {
    this.#disarmOff()
    if (this.autoOffMs <= 0) return
    this.#offTimer = this.#host.setTimer(() => {
      this.#offTimer = null
      const machine = this.machine
      if (machine === null || machine.state.off || !this.asleep) return
      machine.powerOff()
      this.stopPaste()
      this.#changed()
      this.onAutoOff?.()
    }, this.autoOffMs)
  }

  #disarmOff(): void {
    if (this.#offTimer !== null) this.#host.clearTimer(this.#offTimer)
    this.#offTimer = null
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
