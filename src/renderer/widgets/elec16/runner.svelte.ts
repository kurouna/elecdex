import { CARD_STATUS, type CardAnswer, type CardRequest } from '@shared/elec16/card'
import { keyCode } from '@shared/elec16/keys'
import type { LinkAnswer, LinkRequest } from '@shared/elec16/link'
import { LINK_STATUS } from '@shared/elec16/link-services'
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

/** What main answers without giving the request to any service: nothing was sent. */
const NOT_SENT: ReadonlySet<number> = new Set([
  LINK_STATUS.off,
  LINK_STATUS.badRequest,
  LINK_STATUS.noService,
])

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
  /** CORE's breakpoints, in address order: kept across another LCD and a move, not a restart. */
  breakpoints = $state<readonly number[]>([])
  /** Where the machine stopped at one of them; null when it did not. */
  breakAt = $state<number | null>(null)
  /** Keys PASTE has still to press: TUNE shows them, and pressing PASTE again stops it. */
  pasting = $state(0)
  /** The LCD fitted: the machine itself is not state, so its model is kept here for the views. */
  model = $state<ModelId>(DEFAULT_MODEL)
  /**
   * Where a card command the machine gives goes (the pane's unit, through main); none: the
   * card is not there, and the command is answered so.
   */
  onCard: ((request: CardRequest) => Promise<CardAnswer>) | null = null
  /**
   * Where a LINK request goes (the pane's unit, through main), and where one the machine let
   * go is dropped; none: LINK is not there, and the request FAILED.
   */
  onLink: ((request: LinkRequest) => Promise<LinkAnswer>) | null = null
  onLinkDrop: ((serial: number) => void) | null = null
  /** A LINK request is out: the LINK mark blinks. */
  linkBusy = $state(false)
  /** Why the last LINK request failed, in the service's words; null after one that did not. */
  linkNote = $state<string | null>(null)
  /** LINK requests a service was given since the pane opened (TUNE shows them). */
  linkSent = $state(0)
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
  /** Who waits for the machine to fall asleep at its prompt (CODE's RUN and LOAD). */
  #sleepers: (() => void)[] = []

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
    this.#armBreakpoints(machine)
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
    // The machine brings its breakpoints with it.
    this.breakpoints = [...machine.breakpoints].sort((x, y) => x - y)
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

  /**
   * A key on the machine goes down; it wakes a sleeping machine. `byPerson` is false for
   * PASTE's keys: only a person's lets LINK send again.
   */
  press(code: number, byPerson = true): void {
    const machine = this.machine
    if (machine === null) return
    // As the ROM has it: SHIFT holds for the next key, and CAPS does not use it up.
    if (code === SHIFT) this.#shift = !this.#shift
    else if (code !== CAPS) this.#shift = false
    machine.press(code, byPerson)
    this.#timed.wake()
    // A key to a machine asleep for one starts auto power-off's count again (the loop tells
    // only of falling asleep, not of a key taken between two sleeps).
    if (this.#asleepForKey()) this.#armOff()
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
      this.press(code, false)
      this.release(code)
      room--
    }
    if (this.pasting !== this.#paste.length) this.pasting = this.#paste.length
  }

  /** A person's RUN or LOAD in the pane: the program it starts may use LINK once. */
  vouch(): void {
    this.machine?.vouch()
  }

  /** BRK/ON: stops what runs and gets the prompt back; starts a machine off or stopped. */
  brk(): void {
    const machine = this.machine
    if (machine === null) return
    machine.brk()
    // Woken by BRK: asleep again only once it sleeps at a prompt, so whenAsleep waits for that
    // rather than taking the sleep before it (a program at an INPUT) as the prompt.
    this.asleep = false
    this.#shift = false
    this.stopPaste()
    if (this.pausedBy !== null && machine.running) this.pausedBy = null
    this.#timed.wake()
    this.#changed()
  }

  /**
   * RESET: the CPU starts again from the reset vector, as a pocket computer's reset button
   * does - the RAM, battery-backed, is kept (BASIC finds its program there), the screen and
   * the keys waiting are not. Switched off, it comes on.
   */
  reset(): void {
    const machine = this.machine
    if (machine === null) return
    this.stopPaste()
    machine.reset()
    machine.releaseAll()
    this.#shift = false
    if (this.pausedBy === 'player') this.pausedBy = null
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

  /**
   * CODE: machine code put into RAM, the machine asleep at its prompt or stopped; false when
   * it could not go there.
   */
  loadCode(at: number, bytes: Uint8Array): boolean {
    const done = this.machine?.loadCode(at, bytes) ?? false
    if (done) this.#changed()
    return done
  }

  /**
   * True once the machine sleeps for a key (at a prompt), at once if it does; false after
   * `ms` without. One timer on the host, none while it already sleeps.
   */
  whenAsleep(ms: number): Promise<boolean> {
    if (this.asleep && !this.off) return Promise.resolve(true)
    return new Promise((resolve) => {
      let timer: number | null = null
      const done = (asleep: boolean) => {
        if (timer !== null) this.#host.clearTimer(timer)
        this.#sleepers = this.#sleepers.filter((s) => s !== wake)
        resolve(asleep)
      }
      const wake = () => done(true)
      this.#sleepers.push(wake)
      timer = this.#host.setTimer(() => done(false), ms)
    })
  }

  /** CORE: a breakpoint at `address`, or none there any more. */
  toggleBreakpoint(address: number): void {
    const at = address & 0xffff
    const now = new Set(this.breakpoints)
    if (!now.delete(at)) now.add(at)
    this.breakpoints = [...now].sort((a, b) => a - b)
    const machine = this.machine
    if (machine !== null) this.#armBreakpoints(machine)
  }

  /** Paused at a breakpoint, it goes on from the instruction there. */
  override resume(): void {
    this.machine?.goOn()
    super.resume()
  }

  #armBreakpoints(machine: Elec16): void {
    machine.breakpoints.clear()
    for (const at of this.breakpoints) machine.breakpoints.add(at)
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
    const at = machine?.breakAt ?? null
    if (this.breakAt !== at) this.breakAt = at
    const busy = machine?.state.link.busy ?? false
    if (this.linkBusy !== busy) this.linkBusy = busy
  }

  protected override afterFrames(machine: Elec16): void {
    // Stopped at a breakpoint: paused as by the player, for CORE to look and STEP or go on.
    if (machine.breakAt !== null && this.pausedBy === null) {
      this.pause('player')
      this.stepped++
    }
    machine.setClock(this.#host.clock())
    const b = machine.state.buzzer
    const left = b.gate ? Number.POSITIVE_INFINITY : b.duration - (machine.state.time - b.started)
    this.#host.buzz?.(b.freq, left, `${b.freq}:${b.gate}:${b.started}`)
    const request = machine.takeCardRequest()
    if (request !== null) void this.#relay(machine, request)
    const dropped = machine.takeLinkDrop()
    if (dropped !== null) this.onLinkDrop?.(dropped)
    const asked = machine.takeLinkRequest()
    if (asked !== null) void this.#ask(machine, asked)
    this.#feed(machine)
  }

  /** A LINK request to main and its answer back, waking the machine that waits for it. */
  async #ask(machine: Elec16, request: LinkRequest): Promise<void> {
    let answer: LinkAnswer = { status: LINK_STATUS.failed, note: 'LINK is not there' }
    try {
      if (this.onLink !== null) answer = await this.onLink(request)
    } catch {
      answer = { status: LINK_STATUS.failed, note: 'main could not be asked' }
    }
    if (!NOT_SENT.has(answer.status)) this.linkSent++
    const failed = answer.status !== LINK_STATUS.ready && answer.status !== LINK_STATUS.cancelled
    this.linkNote = failed ? (answer.note ?? null) : null
    machine.answerLink(request.serial, answer)
    if (this.machine !== machine) return
    this.#timed.wake()
    this.#changed()
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
    if (wake?.key === true && !this.#waitsForMain() && this.#sleepers.length > 0) {
      for (const sleeper of [...this.#sleepers]) sleeper()
    }
    if (this.#forKey(wake)) this.#armOff()
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
      if (machine === null || machine.state.off || !this.#asleepForKey()) return
      machine.powerOff()
      this.stopPaste()
      this.#changed()
      this.onAutoOff?.()
    }, this.autoOffMs)
  }

  /**
   * Asleep in WFI for a key and nothing else: no timer, no running program, no answer from
   * main on its way (a program waiting for LINK or the card sleeps with KEY enabled too).
   */
  #asleepForKey(): boolean {
    return this.status === 'running' && this.#forKey(this.#timed.asleep)
  }

  /** This sleep waits for a key and nothing else. */
  #forKey(wake: Wake | null): boolean {
    return wake?.key === true && wake.timerMs === null && !this.#waitsForMain()
  }

  /** An answer from main (LINK, the card) is on its way: the machine is not at its prompt. */
  #waitsForMain(): boolean {
    const s = this.machine?.state
    return s !== undefined && (s.link.busy || s.card.busy)
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
