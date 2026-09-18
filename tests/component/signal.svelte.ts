/** A value the runes system follows, standing in for the state a store holds. */
export function signal<T>(initial: T): { get: () => T; set: (value: T) => void } {
  let value = $state.raw(initial)
  return {
    get: () => value,
    set: (next: T) => {
      value = next
    },
  }
}
