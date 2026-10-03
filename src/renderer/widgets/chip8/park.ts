import type { Chip8 } from '@shared/chip8/machine'
import type { Chip8Program } from '@shared/chip8-library'
import { createPark } from '../emu/park.ts'

/**
 * Where a CHIP-8 pane's machine waits while its pane is remounted (docs/architecture.md
 * section 5.18): the emulators' parking place (widgets/emu/park.ts), with the program and its
 * bytes kept beside the machine so the new mount can show it at once.
 */

export interface Parked {
  program: Chip8Program
  rom: Uint8Array
  machine: Chip8
  paused: boolean
}

export { PARK_MS } from '../emu/park.ts'

export const { park, claim } = createPark<Parked>()
