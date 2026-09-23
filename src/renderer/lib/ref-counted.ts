/**
 * Something shared by whoever is using it - a store's subscription to main, a
 * clock on the frame loop: started for the first user, stopped after the last.
 * Each `use()` returns its release, which counts once however often it is
 * called, so a component torn down twice never stops what another still needs.
 */
export function refCounted(start: () => () => void): () => () => void {
  let users = 0
  let stop: (() => void) | null = null
  return () => {
    users += 1
    if (users === 1) stop = start()
    let released = false
    return () => {
      if (released) return
      released = true
      users -= 1
      if (users > 0) return
      const running = stop
      stop = null
      running?.()
    }
  }
}
