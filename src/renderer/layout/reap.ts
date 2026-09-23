/**
 * Which shells no pane claims, and may be ended now.
 *
 * A pane creates its shell and only then records the id, so a shell a moment
 * old may be one a pane is about to claim: ended then, the pane was left
 * attached to nothing, a blank terminal. Such a shell is left for the next look
 * (`later`) rather than ended; one that has been unclaimed for longer than
 * `grace` is ended.
 */
export function sessionsToReap(
  alive: readonly { id: string; createdAt: number }[],
  claimed: ReadonlySet<string>,
  now: number,
  grace: number,
): { reap: string[]; later: boolean } {
  const reap: string[] = []
  let later = false
  for (const session of alive) {
    if (claimed.has(session.id)) continue
    if (now - session.createdAt < grace) later = true
    else reap.push(session.id)
  }
  return { reap, later }
}
