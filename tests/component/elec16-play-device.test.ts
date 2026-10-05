import { cleanup, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlayDevice from '../../src/renderer/widgets/elec16/PlayDevice.svelte'
import { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { browserLoop } from '../../src/renderer/widgets/emu/runner.svelte.ts'

/**
 * PLAY-320's body (widgets/elec16/PlayDevice.svelte) at whole device pixels a dot: moved to a
 * screen of another density with no resize (or the page zoomed), it is scaled for it.
 */

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("PLAY-320's body", () => {
  it('scales again when the device pixel ratio changes without a resize', async () => {
    vi.stubGlobal('devicePixelRatio', 1)
    vi.stubGlobal(
      'ResizeObserver',
      class {
        readonly #callback: ResizeObserverCallback
        constructor(callback: ResizeObserverCallback) {
          this.#callback = callback
        }
        observe() {
          const entry = { contentRect: { width: 1100, height: 1100 } } as ResizeObserverEntry
          this.#callback([entry], this as unknown as ResizeObserver)
        }
        disconnect() {}
      },
    )
    const listeners = new Set<() => void>()
    vi.stubGlobal('matchMedia', (_query: string) => ({
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    }))
    const runner = new Elec16Runner({
      ...browserLoop,
      clock: () => ({ second: 0, minute: 0, hour: 0, day: 1, month: 1, year: 2026, weekday: 4 }),
    })
    render(PlayDevice, { runner, shape: 'tall', skin: 'graphite', seen: true })
    await tick()
    const body = screen.getByTestId('elec16-play-body')
    const before = Number.parseFloat(body.style.width)
    // The window goes to a screen at 1.5: two device pixels a dot fit now, where one did.
    vi.stubGlobal('devicePixelRatio', 1.5)
    for (const fn of [...listeners]) fn()
    await tick()
    const after = Number.parseFloat(body.style.width)
    expect(after).not.toBe(before)
    expect(after).toBeLessThanOrEqual(1100)
    runner.dispose()
  })
})
