/**
 * Runs `read` inside a derived, as a template expression is, and reports how many
 * times it has been worked out: a test helper for what a read reacts to.
 */
export function tracked<T>(read: () => T): {
  value: () => T
  runs: () => number
  stop: () => void
} {
  let runs = 0
  let current = $state.raw<T | undefined>(undefined)
  const stop = $effect.root(() => {
    const value = $derived.by(() => {
      runs += 1
      return read()
    })
    $effect(() => {
      current = value
    })
  })
  return { value: () => current as T, runs: () => runs, stop }
}
