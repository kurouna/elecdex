import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WindowState } from '../../src/shared/api.ts'

/**
 * The window state store, with the frame loop replaced: what matters here is which
 * answer wins when main's first reply and its change events race.
 */

const setWindowHidden = vi.fn()
vi.mock('../../src/renderer/lib/frame-loop.ts', () => ({
  setWindowHidden: (hidden: boolean) => setWindowHidden(hidden),
}))

const { windowState } = await import('../../src/renderer/stores/window-state.svelte.ts')

let answer: (state: WindowState) => void = () => {}
let push: (state: WindowState) => void = () => {}

beforeEach(() => {
  setWindowHidden.mockClear()
  vi.stubGlobal('elecdex', {
    system: {
      windowState: () =>
        new Promise<WindowState>((resolve) => {
          answer = resolve
        }),
      onWindowState: (handler: (state: WindowState) => void) => {
        push = handler
        return () => {}
      },
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the window state store', () => {
  it('keeps a change that arrived before the first answer', async () => {
    windowState.follow()
    push({ fullscreen: true, hidden: true })
    answer({ fullscreen: true, hidden: false })
    await Promise.resolve()
    await Promise.resolve()
    expect(setWindowHidden).toHaveBeenCalledTimes(1)
    expect(setWindowHidden).toHaveBeenCalledWith(true)
  })

  it('follows changes after the first answer', async () => {
    answer({ fullscreen: true, hidden: false })
    await Promise.resolve()
    await Promise.resolve()
    push({ fullscreen: false, hidden: true })
    expect(windowState.fullscreen).toBe(false)
    expect(setWindowHidden).toHaveBeenLastCalledWith(true)
  })
})
