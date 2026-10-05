import { cleanup, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PlayScreen from '../../src/renderer/widgets/elec16/PlayScreen.svelte'
import { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { browserLoop } from '../../src/renderer/widgets/emu/runner.svelte.ts'

/**
 * PLAY-320's screen alone (widgets/elec16/PlayScreen.svelte), the "screen" body: sized from the
 * room in device pixels a ResizeObserver gives, at any devicePixelRatio, never larger than the
 * room it is in.
 */

/** A ResizeObserver that reports `room` CSS pixels at `ratio`, as Chromium does. */
function observeRoom(w: number, h: number, ratio: number) {
  vi.stubGlobal('devicePixelRatio', ratio)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly #callback: ResizeObserverCallback
      constructor(callback: ResizeObserverCallback) {
        this.#callback = callback
      }
      observe() {
        const entry = {
          contentRect: { width: w, height: h },
          contentBoxSize: [{ inlineSize: w, blockSize: h }],
          devicePixelContentBoxSize: [{ inlineSize: w * ratio, blockSize: h * ratio }],
        } as unknown as ResizeObserverEntry
        this.#callback([entry], this as unknown as ResizeObserver)
      }
      disconnect() {}
    },
  )
}

const runner = () =>
  new Elec16Runner({
    ...browserLoop,
    clock: () => ({ second: 0, minute: 0, hour: 0, day: 1, month: 1, year: 2026, weekday: 4 }),
  })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("PLAY-320's screen alone", () => {
  it.each([1, 1.25, 1.5, 2])(
    'fits its room in whole device pixels a dot at a ratio of %s',
    async (ratio) => {
      // 640 x 576 CSS pixels: twice the screen at 1, its device pixels a whole number of dots.
      observeRoom(640, 576, ratio)
      render(PlayScreen, { runner: runner(), seen: true })
      await tick()
      const canvas = screen.getByTestId('elec16-play-screen')
      const scale = Number(canvas.dataset.scale)
      expect(scale).toBe(Math.floor(2 * ratio))
      // The picture, in CSS pixels, inside the room: at 1.5 it was 4 dots a device pixel, 853
      // CSS pixels wide in a room of 640, and clipped.
      expect(Number.parseFloat(canvas.style.width)).toBeLessThanOrEqual(640)
      expect(Number.parseFloat(canvas.style.height)).toBeLessThanOrEqual(576)
    },
  )
})
