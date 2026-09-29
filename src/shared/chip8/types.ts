/**
 * The words the CHIP-8 core speaks (docs/architecture.md section 5.18).
 *
 * Everything under shared/chip8 is pure TypeScript with no DOM and no Node: the page runs
 * it, main runs it to make a program's preview, and vitest runs it as it is. It imports
 * nothing outside its own folder and shared/emu (a unit test holds it to that), so the
 * pane around it can change without the machine noticing.
 */

/** The three machines, named as chip8Archive names them. */
export const PLATFORMS = ['chip8', 'schip', 'xochip'] as const
export type Platform = (typeof PLATFORMS)[number]

/**
 * Where interpreters disagree. Each is named for what the machine does when it is on;
 * the profiles in quirks.ts say which each platform has.
 */
export interface Quirks {
  /** 8XY1, 8XY2 and 8XY3 set VF to 0 (the COSMAC VIP). */
  vfReset: boolean
  /** FX55 and FX65 leave I past the last register they touched. */
  memIncrement: boolean
  /** 8XY6 and 8XYE shift VX in place instead of VY into VX. */
  shiftVx: boolean
  /** BXNN jumps to XNN + VX instead of BNNN to NNN + V0. */
  jumpVx: boolean
  /** A sprite that crosses the edge is cut off rather than wrapped to the other side. */
  clip: boolean
  /** A sprite is drawn only at the start of a frame: DXYN ends the frame's instructions. */
  displayWait: boolean
  /** In 8XY4 to 8XYE with X = F, the result is written after the flag, overwriting it. */
  vfOrder: boolean
}

export const QUIRK_NAMES: readonly (keyof Quirks)[] = [
  'vfReset',
  'memIncrement',
  'shiftVx',
  'jumpVx',
  'clip',
  'displayWait',
  'vfOrder',
]

/** The hex font a program finds at address 0 (Octo's font styles). */
export const FONT_STYLES = ['octo', 'vip', 'dream6800', 'eti660', 'schip', 'fish'] as const
export type FontStyle = (typeof FONT_STYLES)[number]

export interface MachineConfig {
  platform: Platform
  quirks: Quirks
  /** Instructions per 60 Hz frame. */
  ipf: number
  font: FontStyle
}

/** Why a machine stopped. `exit` is the program's own choice (00FD); the rest are faults. */
export type HaltReason = 'exit' | 'illegal' | 'stack-overflow' | 'stack-underflow'

export interface Halt {
  reason: HaltReason
  /** Where the instruction that stopped it is. */
  pc: number
  op: number
}

/** Where a program is loaded and starts. */
export const PROGRAM_START = 0x200

/** The keypad: sixteen keys, 0 to F. */
export const KEY_COUNT = 16

export const LORES = { w: 64, h: 32 } as const
export const HIRES = { w: 128, h: 64 } as const

/** Instructions per frame: at least one, and no more than a frame can carry at 60 Hz. */
export const IPF_MIN = 1
export const IPF_MAX = 10000

export const memorySize = (platform: Platform): number => (platform === 'xochip' ? 0x10000 : 0x1000)

/** The largest program a platform can hold: its memory from 0x200 to the end. */
export const maxProgramSize = (platform: Platform): number => memorySize(platform) - PROGRAM_START
