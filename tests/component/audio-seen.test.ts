import { cleanup, render } from '@testing-library/svelte'
import { flushSync, tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/renderer/widgets/audio/spectrum-draw.ts', () => ({
  MeterPainter: class {
    paint() {}
  },
  SpectrumPainter: class {
    paint() {}
    resize() {}
    setPalette() {}
  },
}))

const { default: MixerWidget } = await import('../../src/renderer/widgets/audio/MixerWidget.svelte')
const { default: SpectrumWidget } = await import(
  '../../src/renderer/widgets/audio/SpectrumWidget.svelte'
)
const { windowState } = await import('../../src/renderer/stores/window-state.svelte.ts')
const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')

/**
 * The audio panes capture and read the mixer only while seen: on screen in the page, and the
 * window on screen. Found by the e2e lifecycle contract (2026-10-23): they asked only an
 * IntersectionObserver, which a minimised window does not change, so the capture window and the
 * mixer's reading went on with nobody looking. jsdom has no layout, so the observer is replaced
 * by one that reports the pane on screen.
 */

const live = { spectrum: 0, mixer: 0 }

beforeEach(() => {
  live.spectrum = 0
  live.mixer = 0
  windowState.onScreen = true
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
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  const counted = (key: keyof typeof live) => () => {
    live[key] += 1
    return () => {
      live[key] -= 1
    }
  }
  vi.stubGlobal('elecdex', {
    audio: {
      spectrum: counted('spectrum'),
      mixer: counted('mixer'),
      mixerCommand: vi.fn(),
      restoreMonitor: vi.fn(),
    },
    layout: { save: vi.fn(async () => {}) },
  })
})

afterEach(async () => {
  cleanup()
  windowState.onScreen = true
  await layout.flush()
  vi.unstubAllGlobals()
})

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await tick()
  flushSync()
}

describe.each([
  { name: 'spectrum', component: SpectrumWidget, key: 'spectrum' as const },
  { name: 'mixer', component: MixerWidget, key: 'mixer' as const },
])('the $name pane', ({ name, component, key }) => {
  it('lets go while the window is minimised, and takes up again when it is back', async () => {
    render(component, {
      props: { paneId: 'p', title: name, props: {}, state: {}, active: true, visible: true },
    })
    await settle()
    expect(live[key]).toBe(1)
    windowState.onScreen = false
    await settle()
    expect(live[key]).toBe(0)
    windowState.onScreen = true
    await settle()
    expect(live[key]).toBe(1)
  })
})
