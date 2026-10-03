/**
 * Where an emulator pane's machine waits while its pane is remounted (docs/emu.md). Moving
 * a pane in the layout unmounts its widget and mounts it again at the new place; the new
 * mount takes the machine back as it was - mid-frame, keys up - so a moved game goes on. A
 * machine nobody takes within a few seconds (the pane was closed) is let go. Nothing here
 * knows the layout: it is keyed by pane id alone, one place per kind of machine, so a CHIP-8
 * pane never takes up another kind's machine.
 */

/** Longer than any remount takes, short enough that a closed pane's machine goes soon. */
export const PARK_MS = 10_000

export interface Park<T> {
  /**
   * Keeps `entry` for the pane's next mount, replacing anything kept for it before. `expired`
   * is told when nobody took it in time: the pane was closed, and what it held can go.
   */
  park(paneId: string, entry: T, expired?: (entry: T) => void): void
  /** What was kept for this pane, taken (it is no longer kept), or null. */
  claim(paneId: string): T | null
}

/** A place for one kind of machine. */
export function createPark<T>(): Park<T> {
  const parked = new Map<string, { entry: T; timer: ReturnType<typeof setTimeout> }>()
  const claim = (paneId: string): T | null => {
    const held = parked.get(paneId)
    if (held === undefined) return null
    clearTimeout(held.timer)
    parked.delete(paneId)
    return held.entry
  }
  const park = (paneId: string, entry: T, expired?: (entry: T) => void): void => {
    claim(paneId)
    const timer = setTimeout(() => {
      parked.delete(paneId)
      expired?.(entry)
    }, PARK_MS)
    parked.set(paneId, { entry, timer })
  }
  return { park, claim }
}
