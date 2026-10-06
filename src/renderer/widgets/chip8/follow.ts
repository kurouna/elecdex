import type { RunStatus } from '../emu/runner.svelte.ts'

/**
 * What a mounted CHIP-8 pane does when its state changes under it. Switching to a saved layout
 * whose pane has the same id (a layout kept under a new name keeps every id) does not mount the
 * widget again: only its state changes, and the machine must follow it - to the program the
 * pane now names, or to a stop when it now shows the library.
 *
 * `asked` is the program the pane itself last started (LOAD, a slot, the mount's restore), so
 * its own changes, which write the state before the program's bytes have come, are not taken
 * for another layout's. No program runs behind the library: BACK pauses first, so a machine
 * running there was left by the layout before.
 */
export type Chip8Follow = { kind: 'start'; program: string } | { kind: 'pause' } | null

export function chip8Follow(
  view: 'library' | 'run',
  program: string | null,
  asked: string | null,
  status: RunStatus,
): Chip8Follow {
  if (view === 'library') return status === 'running' ? { kind: 'pause' } : null
  if (program === null || program === asked) return null
  return { kind: 'start', program }
}
