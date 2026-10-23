import { isDeepStrictEqual } from 'node:util'

/** How often `quietFor` looks again. */
const LOOK_MS = 100

/**
 * Checks that nothing happens for `ms`: `probe` (a counter, what main is watching, a pane's text)
 * answers the same throughout as it did at the start, looked at every tenth of a second, and that
 * answer is returned. The only way an e2e test waits a fixed time to see that something does
 * not happen (tests/unit/e2e-waits.test.ts): a negative needs a window, and this names it.
 */
export async function quietFor<T>(ms: number, probe: () => Promise<T>, what = 'it'): Promise<T> {
  const first = await probe()
  const until = Date.now() + ms
  while (Date.now() < until) {
    // wait: the window over which nothing may change is the point of this helper.
    await new Promise((resolve) => setTimeout(resolve, Math.min(LOOK_MS, until - Date.now())))
    const now = await probe()
    if (!isDeepStrictEqual(now, first)) {
      throw new Error(
        `${what} changed within ${ms} ms: ${JSON.stringify(first)} -> ${JSON.stringify(now)}`,
      )
    }
  }
  return first
}
