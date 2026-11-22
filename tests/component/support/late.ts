import { vi } from 'vitest'

/**
 * For a call that answers after its pane is gone: a promise the test settles when it wants,
 * and how many timers of `ms` were armed while `during` ran.
 */
export function later<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

export async function timersArmed(ms: number, during: () => Promise<void>): Promise<number> {
  const spy = vi.spyOn(globalThis, 'setTimeout')
  try {
    await during()
    return spy.mock.calls.filter((call) => call[1] === ms).length
  } finally {
    spy.mockRestore()
  }
}
