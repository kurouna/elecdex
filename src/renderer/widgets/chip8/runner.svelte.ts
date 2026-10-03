import type { Tone } from '@shared/chip8/audio'
import { Chip8 } from '@shared/chip8/machine'
import type { Quirks } from '@shared/chip8/types'
import { type Chip8Program, tunedConfig } from '@shared/chip8-library'
import {
  browserLoop,
  EmuRunner,
  type LoopHost,
  type LoopPolicy,
  type PauseReason,
  type RunStatus,
} from '../emu/runner.svelte.ts'

/**
 * Plays one CHIP-8 machine for a pane (docs/architecture.md section 5.18), on the emulators'
 * runner (widgets/emu/runner.svelte.ts, docs/emu.md), which keeps the loop, the pause and
 * being seen. Here is what is CHIP-8's: loading a program with its tuning, the keypad, the
 * buzzer, and its policy - sixty frames a second on animation frames while the screen
 * moves, a timer once it has stood still for half a second.
 */

export type { PauseReason, RunStatus }

export interface RunnerHost extends LoopHost {
  /** Called after the frames of each tick, with the tone to sound, or null for silence. */
  sound(tone: Tone | null): void
}

/** Machine frames with the screen unchanged before the loop drops to the timer. */
export const STILL_FRAMES = 30

const POLICY: LoopPolicy = { frameMs: 1000 / 60, maxCatchUp: 3, stillFrames: STILL_FRAMES }

export const browserHost = (sound: (tone: Tone | null) => void): RunnerHost => ({
  ...browserLoop,
  sound,
})

export class Chip8Runner extends EmuRunner<Chip8> {
  /** Raw: replaced whole, and read in the machine's hot paths (see library.svelte.ts). */
  program = $state.raw<Chip8Program | null>(null)
  /** The pads held down, from the keyboard or the on-screen keypad (one bit each). */
  keys = $state(0)
  /** The pads the program has asked about. */
  sensed = $state(0)
  sounding = $state(false)
  /** SUPER-CHIP's high resolution is on. */
  hires = $state(false)
  /** Counts loads (a start, a kept machine taken up), so CORE types its boot line again. */
  loads = $state(0)
  /** The last load went on from a kept machine. */
  resumed = $state(false)
  /** Counts changes made by hand (a step, a reset), so a view of the registers reads again. */
  stepped = $state(0)

  readonly #host: RunnerHost
  #rom: Uint8Array | null = null

  constructor(host: RunnerHost) {
    super(host, POLICY)
    this.#host = host
  }

  /** The program's bytes, as loaded: kept for a reset, and for a moved pane to take up. */
  get rom(): Uint8Array | null {
    return this.#rom
  }

  /**
   * Starts `program` from its bytes, or from a snapshot of it when one is given and good;
   * true when it went on from the snapshot. Either way it runs with the program's tuning,
   * which is main's per program (a snapshot kept before the tuning changed runs as tuned
   * now). A snapshot of another machine - an imported program since run as another - is
   * not taken up. It runs at once unless asked to wait `paused`.
   *
   * `strict` asks for the snapshot or nothing: a slot's LOAD that cannot be read must leave
   * the game being played as it is, not start the program again over it. A runner already
   * disposed (a start that finished after its pane went) loads nothing.
   */
  load(
    program: Chip8Program,
    rom: Uint8Array,
    seed: number,
    {
      snapshot,
      paused = false,
      strict = false,
    }: { snapshot?: Uint8Array | null; paused?: boolean; strict?: boolean } = {},
  ): boolean {
    if (this.disposed) return false
    const { ipf, quirks } = tunedConfig(program)
    const restored = snapshot != null ? Chip8.restore(snapshot) : null
    const fits = restored !== null && restored.state.config.platform === program.platform
    if (strict && !fits) return false
    this.stopLoop()
    this.silence()
    if (fits) restored.tune({ ipf, quirks })
    this.setMachine(
      fits
        ? restored
        : Chip8.load(rom, { platform: program.platform, quirks, ipf, font: program.font }, seed),
    )
    this.#rom = rom
    this.program = program
    this.keys = 0
    this.pausedBy = paused ? 'player' : null
    this.resumed = fits
    this.loads++
    this.countChange()
    this.stepped++
    this.settle()
    this.emit()
    return fits
  }

  /** The machine as it is, to keep (a save slot, AUTO), or null with none. */
  snapshot(): Uint8Array | null {
    return this.machine?.snapshot() ?? null
  }

  /** Takes over a machine another mount of this pane was running (a moved pane). */
  adopt(program: Chip8Program, rom: Uint8Array, machine: Chip8, paused: boolean): void {
    if (this.disposed) return
    this.stopLoop()
    // Keys held as the pane moved: the new mount never hears them go up.
    machine.releaseAll()
    this.keys = 0
    this.setMachine(machine)
    this.#rom = rom
    this.program = program
    this.pausedBy = paused ? 'player' : null
    this.countChange()
    this.settle()
    this.emit()
  }

  /**
   * Starts the program again from its first instruction, with its tuning kept. Paused, it
   * stays paused at the start, where CORE's STEP can walk it from the first instruction.
   */
  reset(seed: number): void {
    const machine = this.machine
    const program = this.program
    if (machine === null || program === null || this.#rom === null) return
    const { config } = machine.state
    this.stopLoop()
    this.silence()
    this.setMachine(Chip8.load(this.#rom, config, seed))
    if (this.pausedBy === 'hidden') this.pausedBy = 'player'
    this.countChange()
    this.stepped++
    this.settle()
    this.emit()
  }

  /** One whole frame while paused (the pane's Enter). */
  stepFrame(): void {
    if (this.machine === null || this.pausedBy === null) return
    this.machine.frame()
    this.#afterHand()
  }

  /** One instruction while paused (CORE's STEP). */
  stepInstruction(): void {
    if (this.machine === null || this.pausedBy === null) return
    this.machine.step()
    this.#afterHand()
  }

  press(key: number): void {
    this.machine?.press(key)
    this.keys |= 1 << key
  }

  release(key: number): void {
    this.machine?.release(key)
    this.keys &= ~(1 << key)
  }

  /** The pane lost the keyboard: every pad goes up, and none is delivered. */
  releaseAll(): void {
    this.machine?.releaseAll()
    this.keys = 0
  }

  tune(change: { ipf?: number; quirks?: Partial<Quirks> }): void {
    this.machine?.tune(change)
    this.emit()
  }

  /** Puts the machine away: its program is gone from the library (an import removed). */
  unload(): void {
    this.stopLoop()
    this.silence()
    this.setMachine(null)
    this.#rom = null
    this.program = null
    this.keys = 0
    this.pausedBy = null
    this.countChange()
    this.settle()
    this.emit()
  }

  /** Lets go of the machine for another mount to take up: the loop stops, the machine stays. */
  detach(): Chip8 | null {
    this.stopLoop()
    this.silence()
    this.machine?.releaseAll()
    this.keys = 0
    return this.machine
  }

  protected override settled(machine: Chip8 | null): void {
    const sensed = machine?.state.sensed ?? 0
    if (this.sensed !== sensed) this.sensed = sensed
    const hires = machine?.state.hires ?? false
    if (this.hires !== hires) this.hires = hires
  }

  protected override afterFrames(machine: Chip8): void {
    const tone = machine.tone
    this.#host.sound(tone)
    const sounding = tone.seconds > 0
    if (this.sounding !== sounding) this.sounding = sounding
  }

  protected override silence(): void {
    this.#host.sound(null)
  }

  protected override quiet(): void {
    this.silence()
    if (this.sounding) this.sounding = false
  }

  #afterHand(): void {
    this.countChange()
    this.stepped++
    this.settle()
    this.emit()
  }
}
