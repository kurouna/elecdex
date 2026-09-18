import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WindowState } from '../../src/shared/api.ts'

/**
 * The window state store, with the frame loop replaced: what matters here is which
 * answer wins when main's first reply and its change events race, since the store
 * decides whether the frame loop draws at all.
 */

const setWindowHidden = vi.fn()
vi.mock('../../src/renderer/lib/frame-loop.ts', () => ({
  setWindowHidden: (hidden: boolean) => setWindowHidden(hidden),
}))

let answer: (state: WindowState) => void = () => {}
let push: (state: WindowState) => void = () => {}
let asked = 0
let followed = 0

/** A store that has not followed the window yet, with main's two paths in hand. */
async function fresh(): Promise<{ fullscreen: boolean; follow: () => void }> {
  vi.resetModules()
  const { windowState } = await import('../../src/renderer/stores/window-state.svelte.ts')
  return windowState
}

/** Lets the answer's `then` run. */
const settle = (): Promise<void> => Promise.resolve().then(() => {})

beforeEach(() => {
  setWindowHidden.mockClear()
  asked = 0
  followed = 0
  answer = () => {}
  push = () => {}
  vi.stubGlobal('elecdex', {
    system: {
      windowState: () => {
        asked += 1
        return new Promise<WindowState>((resolve) => {
          answer = resolve
        })
      },
      onWindowState: (handler: (state: WindowState) => void) => {
        followed += 1
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
  it('assumes fullscreen until main answers', async () => {
    const store = await fresh()
    expect(store.fullscreen).toBe(true)
    expect(setWindowHidden).not.toHaveBeenCalled()
  })

  it('takes the first answer when nothing changed before it', async () => {
    const store = await fresh()
    store.follow()
    answer({ fullscreen: false, hidden: false })
    await settle()
    expect(store.fullscreen).toBe(false)
    expect(setWindowHidden).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('keeps a change that arrived before the first answer', async () => {
    const store = await fresh()
    store.follow()
    // Put away while the page was still loading: the answer is the older of the two.
    push({ fullscreen: true, hidden: true })
    answer({ fullscreen: true, hidden: false })
    await settle()
    expect(setWindowHidden).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('follows changes after the first answer', async () => {
    const store = await fresh()
    store.follow()
    answer({ fullscreen: true, hidden: false })
    await settle()
    push({ fullscreen: false, hidden: true })
    expect(store.fullscreen).toBe(false)
    expect(setWindowHidden).toHaveBeenLastCalledWith(true)
    push({ fullscreen: false, hidden: false })
    expect(setWindowHidden).toHaveBeenLastCalledWith(false)
  })

  it('asks and subscribes once, however many components read it', async () => {
    const store = await fresh()
    store.follow()
    store.follow()
    store.follow()
    expect(asked).toBe(1)
    expect(followed).toBe(1)
  })
})
