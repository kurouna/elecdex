/**
 * A CHIP-8 machine (docs/architecture.md section 5.18): the one object the page holds.
 *
 * It runs by frames, as Octo does: a frame is up to `ipf` instructions and then one tick
 * of the 60 Hz timers. Who calls `frame`, and how often, is the page's business
 * (shared/emu/clock.ts) - the machine keeps no time of its own, which is what lets a
 * test, a preview in main and the pane all run the same program the same way.
 */

import { type Tone, toneOf } from './audio.js'
import { execute } from './exec.js'
import { decodeSnapshot, encodeSnapshot } from './snapshot.js'
import { type Chip8State, createState, word } from './state.js'
import { IPF_MAX, IPF_MIN, KEY_COUNT, type MachineConfig, type Quirks } from './types.js'

const clampIpf = (ipf: number): number =>
  Math.min(IPF_MAX, Math.max(IPF_MIN, Math.round(Number.isFinite(ipf) ? ipf : IPF_MIN)))

const validKey = (key: number): boolean => Number.isInteger(key) && key >= 0 && key < KEY_COUNT

export class Chip8 {
  readonly #s: Chip8State

  private constructor(state: Chip8State) {
    this.#s = state
  }

  /** A machine with `program` loaded at 0x200. Throws if the program does not fit. */
  static load(program: Uint8Array, config: MachineConfig, seed: number): Chip8 {
    return new Chip8(createState(program, { ...config, ipf: clampIpf(config.ipf) }, seed))
  }

  /** A machine as a snapshot left it, or null for bytes that are not a snapshot of ours. */
  static restore(bytes: Uint8Array): Chip8 | null {
    const state = decodeSnapshot(bytes)
    return state === null ? null : new Chip8(state)
  }

  /** Everything the machine is, to read (a debugger, a screen). Change it through the methods. */
  get state(): Readonly<Chip8State> {
    return this.#s
  }

  get running(): boolean {
    return this.#s.halt === null
  }

  /** Whether the buzzer sounds now. */
  get sounding(): boolean {
    return this.#s.halt === null && this.#s.st > 0
  }

  /** What the buzzer should play now: nothing once the machine has stopped. */
  get tone(): Tone {
    const s = this.#s
    return toneOf(s.halt === null ? s.st : 0, s.pattern, s.pitch, s.patternSet)
  }

  /** Waiting for a key (FX0A): its instructions stop until one is pressed and let go. */
  get waiting(): boolean {
    return this.#s.waitReg >= 0
  }

  /**
   * One 60 Hz frame. With the `displayWait` quirk a sprite is drawn only at the start of
   * a frame, so the frame ends with the first DXYN. The timers count down even while
   * the program waits for a key, as on the VIP.
   */
  frame(): void {
    const s = this.#s
    if (s.halt !== null) return
    for (let k = 0; k < s.config.ipf && !this.waiting && s.halt === null; k++) {
      const drawing = s.config.quirks.displayWait && word(s, s.pc) >> 12 === 0xd
      execute(s)
      if (drawing) break
    }
    if (s.dt > 0) s.dt--
    if (s.st > 0) s.st--
  }

  /** One instruction and no timer tick: the debugger's STEP. */
  step(): void {
    if (!this.waiting) execute(this.#s)
  }

  press(key: number): void {
    if (!validKey(key)) return
    const s = this.#s
    s.keys |= 1 << key
    // FX0A takes a key pressed while it waits, never one that was already down.
    if (s.waitReg >= 0 && s.waitKey < 0) s.waitKey = key
  }

  release(key: number): void {
    if (!validKey(key)) return
    const s = this.#s
    s.keys &= ~(1 << key)
    if (s.waitReg >= 0 && s.waitKey === key) {
      s.v[s.waitReg] = key
      s.sensed |= 1 << key
      s.waitReg = -1
      s.waitKey = -1
    }
  }

  /** Lets go of every key without delivering any: the pane lost the keyboard. */
  releaseAll(): void {
    this.#s.keys = 0
    this.#s.waitKey = -1
  }

  /** Changes the speed or the quirks while it runs. */
  tune(change: { ipf?: number; quirks?: Partial<Quirks> }): void {
    const config: MachineConfig = { ...this.#s.config }
    if (change.ipf !== undefined) config.ipf = clampIpf(change.ipf)
    if (change.quirks !== undefined) config.quirks = { ...config.quirks, ...change.quirks }
    this.#s.config = config
  }

  snapshot(): Uint8Array {
    return encodeSnapshot(this.#s)
  }
}
