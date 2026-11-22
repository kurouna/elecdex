import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CopyFlag } from '../../src/renderer/lib/copied.svelte.ts'

/**
 * The COPY buttons' "copied" (lib/copied.svelte.ts): said for a moment by the button pressed,
 * only when the copy was made, and nothing left behind by a copy that ends after its
 * component was gone.
 */

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('a COPY button saying "copied"', () => {
  it('says so for a moment, only when the copy was made', async () => {
    const flag = new CopyFlag()
    expect(await flag.through('a', async () => false)).toBe(false)
    expect(flag.key).toBeNull()
    expect(await flag.through('a', async () => true)).toBe(true)
    expect(flag.key).toBe('a')
    vi.advanceTimersByTime(1500)
    expect(flag.key).toBeNull()
    flag.dispose()
  })

  it('arms nothing for a copy that ends after it was disposed', async () => {
    const flag = new CopyFlag()
    let done: (ok: boolean) => void = () => {}
    const copying = flag.through('a', () => new Promise<boolean>((resolve) => (done = resolve)))
    flag.dispose()
    done(true)
    // The button is gone: nothing is said or timed, and the caller plays no sound for it.
    expect(await copying).toBe(false)
    expect(flag.key).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
})
