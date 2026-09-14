import type { MixerState, MixerUpdate } from '@shared/audio'
import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Every meter paint, as [level, peak, force]. */
const drawMeter = vi.fn()
vi.mock('../../src/renderer/widgets/audio/spectrum-draw.ts', () => ({
  MeterPainter: class {
    paint(_canvas: HTMLCanvasElement, level: number, peak: number, force = false) {
      drawMeter(_canvas, level, peak, force)
    }
  },
  SpectrumPainter: class {
    paint() {}
  },
}))

const { default: MixerWidget } = await import('../../src/renderer/widgets/audio/MixerWidget.svelte')

/**
 * The mixer pane's meters, driven by hand-sent updates. jsdom has no layout, so
 * the pane's visibility observer is replaced by one that reports it on screen.
 */

const state = (volume: number): MixerState => ({
  support: 'full',
  device: 'Speakers',
  master: { id: 'master', name: 'Master', volume, muted: false },
  apps: [{ id: 'app:music', name: 'Music', volume: 1, muted: false }],
  error: null,
})

let send: (update: MixerUpdate) => void = () => {}

beforeEach(() => {
  drawMeter.mockClear()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly #callback: IntersectionObserverCallback
      constructor(callback: IntersectionObserverCallback) {
        this.#callback = callback
      }
      observe() {
        this.#callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
      }
      disconnect() {}
    },
  )
  vi.stubGlobal('elecdex', {
    audio: {
      mixer: (handler: (update: MixerUpdate) => void) => {
        send = handler
        return () => {}
      },
      mixerCommand: vi.fn(),
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MixerWidget', () => {
  it('keeps meters lit when the mixer state is read again', () => {
    render(MixerWidget, {
      props: { paneId: 'p', title: 'mixer', props: undefined, state: undefined, active: true },
    })
    flushSync()
    send({ t: 'state', state: state(0.5) })
    flushSync()
    send({ t: 'peaks', peaks: { master: 0.64, 'app:music': 0.25 } })
    flushSync()
    expect(drawMeter.mock.calls.at(-1)?.[1]).toBeGreaterThan(0)

    // The state arrives again every second; no meter may be drawn empty for it.
    drawMeter.mockClear()
    send({ t: 'state', state: state(0.51) })
    flushSync()
    for (const [, level] of drawMeter.mock.calls) expect(level).toBeGreaterThan(0)
  })
})
