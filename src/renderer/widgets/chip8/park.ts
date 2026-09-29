import type { Chip8 } from '@shared/chip8/machine'
import type { Chip8Program } from '@shared/chip8-library'

/**
 * Where a CHIP-8 pane's machine waits while its pane is remounted (docs/architecture.md
 * section 5.18). Moving a pane in the layout unmounts its widget and mounts it again at
 * the new place; the new mount takes the machine back as it was - mid-frame, keys up - so
 * a moved game goes on. A machine nobody takes within a few seconds (the pane was closed)
 * is let go. Nothing here knows the layout: it is keyed by pane id alone.
 */

export interface Parked {
  program: Chip8Program
  rom: Uint8Array
  machine: Chip8
  paused: boolean
}

/** Longer than any remount takes, short enough that a closed pane's machine goes soon. */
export const PARK_MS = 10_000

const parked = new Map<string, { entry: Parked; timer: ReturnType<typeof setTimeout> }>()

export function park(paneId: string, entry: Parked): void {
  claim(paneId)
  const timer = setTimeout(() => parked.delete(paneId), PARK_MS)
  parked.set(paneId, { entry, timer })
}

/** The machine parked for this pane, taken (it is no longer parked), or null. */
export function claim(paneId: string): Parked | null {
  const held = parked.get(paneId)
  if (held === undefined) return null
  clearTimeout(held.timer)
  parked.delete(paneId)
  return held.entry
}
