/**
 * What a mounting ELEC-16 pane takes of the machine parked under its pane id (emu/park.ts
 * keys by pane id alone). A moved pane takes its own machine back, mid-program. But another
 * saved layout can hold a pane of the same id on another unit: switching layouts unmounts the
 * one and mounts the other, and taking the parked machine would put the new pane on the old
 * pane's unit. So the machine is taken only for the same unit (or for a pane that names none
 * yet); otherwise it is let go, its unit released with its RAM, and the pane opens its own.
 */
export function takeParked<T extends { unit: string }>(
  parked: T | null,
  paneUnit: string | undefined,
): { take: T | null; letGo: T | null } {
  if (parked === null) return { take: null, letGo: null }
  if (paneUnit === undefined || parked.unit === paneUnit) return { take: parked, letGo: null }
  return { take: null, letGo: parked }
}

/**
 * The unit a mounted pane's session should move to, or null. Switching to a saved layout whose
 * pane has the same id does not mount the widget again: only its state's `unit` changes under
 * it, and the session must follow. TUNE's own switch writes the state back to the running unit,
 * so it never asks again; a session not running yet starts on the state's unit anyway.
 */
export function unitToFollow(
  paneUnit: string | undefined,
  running: string | null,
  isRunning: boolean,
): string | null {
  if (!isRunning || paneUnit === undefined || running === null) return null
  return paneUnit === running ? null : paneUnit
}
