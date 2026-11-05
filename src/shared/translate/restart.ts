/**
 * Whether a llama-server that ended on its own may be started again (docs/translate.md §4.3).
 * Once in ten minutes: a chance exit is mended by a restart, but a server that falls over every
 * time it starts (a broken model, a GPU without room) would otherwise be restarted for ever. The
 * PLaMo test app reset its flag at every ready state and did exactly that. Reaching ready does
 * not count the restarts again here.
 */

export const RESTART_WINDOW_MS = 10 * 60_000
export const MAX_RESTARTS_IN_WINDOW = 1

/** `recent`: when the automatic restarts were made. Pass the answer's `recent` next time. */
export function decideRestart(
  recent: readonly number[],
  now: number,
): { allow: boolean; recent: number[] } {
  const kept = recent.filter((at) => now - at < RESTART_WINDOW_MS)
  if (kept.length >= MAX_RESTARTS_IN_WINDOW) return { allow: false, recent: kept }
  return { allow: true, recent: [...kept, now] }
}
