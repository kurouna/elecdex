import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REPLACE_RETRY_FOR_MS, replaceFile } from '../../src/main/store/replace-file.js'

/**
 * The rename behind every atomic write in main (src/main/store/replace-file.ts).
 * Windows refuses a rename over a file another process has open; the real race is
 * in json-store.test.ts, and these pin down what happens after a refusal.
 */

const refused = (code: string) => Object.assign(new Error(code), { code })

/** A rename that fails with `codes` in turn, then succeeds. */
function renameFailing(...codes: string[]) {
  const calls: Array<[string, string]> = []
  const rename = (from: string, to: string) => {
    calls.push([from, to])
    const next = codes.shift()
    if (next !== undefined) throw refused(next)
  }
  return { calls, rename }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.runAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('replaceFile', () => {
  it('renames once when nothing holds the file', () => {
    const { calls, rename } = renameFailing()
    replaceFile('a.tmp', 'a', { rename })
    expect(calls).toEqual([['a.tmp', 'a']])
  })

  it('does not throw a refusal, and tries again until the rename gets through', () => {
    const { calls, rename } = renameFailing('EPERM', 'EBUSY', 'EACCES')
    expect(() => replaceFile('b.tmp', 'b', { rename })).not.toThrow()
    expect(calls).toHaveLength(1)
    vi.advanceTimersByTime(1_000)
    expect(calls).toHaveLength(4)
    vi.advanceTimersByTime(10_000)
    expect(calls).toHaveLength(4)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('throws any other error at once, as a plain rename would', () => {
    const { calls, rename } = renameFailing('ENOSPC')
    expect(() => replaceFile('c.tmp', 'c', { rename })).toThrow('ENOSPC')
    vi.advanceTimersByTime(1_000)
    expect(calls).toHaveLength(1)
  })

  it('keeps one retry for a file however often it is written meanwhile', () => {
    const { calls, rename } = renameFailing(...Array(8).fill('EPERM'))
    for (let i = 0; i < 5; i++) replaceFile('d.tmp', 'd', { rename })
    expect(calls).toHaveLength(5)
    vi.advanceTimersByTime(5)
    expect(calls).toHaveLength(6)
  })

  it('stops quietly when a later write already moved the temp file', () => {
    const { calls, rename } = renameFailing('EPERM', 'ENOENT')
    replaceFile('e.tmp', 'e', { rename })
    vi.advanceTimersByTime(1_000)
    expect(calls).toHaveLength(2)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('gives up with a warning when the file stays held', () => {
    const { calls, rename } = renameFailing(...Array(10_000).fill('EPERM'))
    replaceFile('f.tmp', 'f', { rename })
    vi.advanceTimersByTime(REPLACE_RETRY_FOR_MS + 1_000)
    const tries = calls.length
    expect(console.warn).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(REPLACE_RETRY_FOR_MS)
    expect(calls).toHaveLength(tries)
  })
})
