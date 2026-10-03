/**
 * Everything a CHIP-8 machine is, as plain data (docs/architecture.md section 5.18).
 *
 * The state is kept apart from what acts on it (exec.ts, display.ts, machine.ts), so a
 * snapshot is a copy of this and nothing else, and a test can set up any moment directly.
 */

import { seedOf, xorshift32 } from '../emu/random.js'
import { fontBytes, SMALL_FONT_AT } from './fonts.js'
import {
  type Halt,
  HIRES,
  KEY_COUNT,
  type MachineConfig,
  maxProgramSize,
  memorySize,
  PROGRAM_START,
} from './types.js'

/** How deep calls may nest. The VIP had 12; SUPER-CHIP and Octo programs expect 16. */
export const STACK_DEPTH = 16

export interface Chip8State {
  /** Speed and quirks may be changed while it runs; the platform and font may not. */
  config: MachineConfig
  /** 4 KB, or 64 KB for XO-CHIP. Addresses wrap at its end. */
  readonly memory: Uint8Array
  readonly v: Uint8Array
  i: number
  pc: number
  readonly stack: Uint16Array
  sp: number
  /** The delay and sound timers, counted down once a frame. */
  dt: number
  st: number
  hires: boolean
  /** Which bit planes draw, clear and scroll: 1, 2 or both (3). XO-CHIP's FN01. */
  plane: number
  /**
   * The screen, one byte a dot, bit 0 for plane 1 and bit 1 for plane 2, row by row at
   * the current resolution's width. Always big enough for hires.
   */
  readonly pixels: Uint8Array
  /** XO-CHIP's audio: a 128-bit pattern played at a rate set by the pitch. */
  readonly pattern: Uint8Array
  pitch: number
  /** Whether the program has loaded a pattern (F002); until then the buzzer is a square wave. */
  patternSet: boolean
  /** SUPER-CHIP's persistent flags (FX75, FX85). Kept with the machine and in its snapshots. */
  readonly flags: Uint8Array
  /** The keys held down, one bit each. */
  keys: number
  /** FX0A: the register a key goes into, or -1 when not waiting. */
  waitReg: number
  /** FX0A: the key pressed while waiting, delivered when it is let go; -1 for none yet. */
  waitKey: number
  /** The keys the program has asked about (EX9E, EXA1, FX0A), one bit each. */
  sensed: number
  /** Why the machine stopped, or null while it runs. */
  halt: Halt | null
  /** Counts every change to the screen, so a page draws only when it moved. */
  screenRevision: number
  /** The random generator's state (xorshift32), so a snapshot resumes the same sequence. */
  rng: number
  /** Instructions run since the program started. */
  cycles: number
}

export function createState(program: Uint8Array, config: MachineConfig, seed: number): Chip8State {
  if (program.length > maxProgramSize(config.platform)) {
    throw new RangeError(`program of ${program.length} bytes does not fit ${config.platform}`)
  }
  const memory = new Uint8Array(memorySize(config.platform))
  memory.set(fontBytes(config.font), SMALL_FONT_AT)
  memory.set(program, PROGRAM_START)
  return {
    config,
    memory,
    v: new Uint8Array(16),
    i: 0,
    pc: PROGRAM_START,
    stack: new Uint16Array(STACK_DEPTH),
    sp: 0,
    dt: 0,
    st: 0,
    hires: false,
    plane: 1,
    pixels: new Uint8Array(HIRES.w * HIRES.h),
    pattern: new Uint8Array(16),
    pitch: 64,
    patternSet: false,
    flags: new Uint8Array(KEY_COUNT),
    keys: 0,
    waitReg: -1,
    waitKey: -1,
    sensed: 0,
    halt: null,
    screenRevision: 0,
    rng: seedOf(seed),
    cycles: 0,
  }
}

/** The byte at an address, wrapping at the end of memory. */
export const peek = (s: Readonly<Chip8State>, address: number): number =>
  s.memory[address & (s.memory.length - 1)] ?? 0

export function poke(s: Chip8State, address: number, value: number): void {
  s.memory[address & (s.memory.length - 1)] = value & 0xff
}

/** The two-byte word at an address. */
export const word = (s: Readonly<Chip8State>, address: number): number =>
  (peek(s, address) << 8) | peek(s, address + 1)

/** The next random byte (xorshift32, shared/emu/random.ts). */
export function randomByte(s: Chip8State): number {
  s.rng = xorshift32(s.rng)
  return (s.rng >>> 24) & 0xff
}
