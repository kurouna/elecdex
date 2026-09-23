import type { MixerCommand, MixerState, MixerUpdate, SpectrumUpdate } from '@shared/audio'
import { binEdge, SPECTRUM_BINS } from '@shared/audio'
import { fireEvent, render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Every spectrum paint: the meters' levels and whether it was forced. */
const spectrumPaints: Array<{ level: number[]; force: boolean; bands: number }> = []
vi.mock('../../src/renderer/widgets/audio/spectrum-draw.ts', () => ({
  SpectrumPainter: class {
    paint(
      _c: HTMLCanvasElement,
      meters: { level: number[] },
      prefs: { bands: number },
      _p: unknown,
      force = false,
    ) {
      spectrumPaints.push({ level: [...meters.level], force, bands: prefs.bands })
    }
  },
  MeterPainter: class {
    paint() {}
  },
}))
vi.mock('../../src/renderer/stores/layout.svelte.ts', () => ({
  layout: { setPaneState: vi.fn(), patchPaneState: vi.fn() },
}))

const { whileVisible } = await import('../../src/renderer/widgets/audio/while-visible.ts')
const { default: SpectrumWidget } = await import(
  '../../src/renderer/widgets/audio/SpectrumWidget.svelte'
)
const { default: MixerWidget } = await import('../../src/renderer/widgets/audio/MixerWidget.svelte')

/**
 * The audio panes with the bridge and the page's visibility in the test's hands.
 * jsdom has no layout, so IntersectionObserver is a stand-in the test flips.
 */
let observers: Array<{ callback: IntersectionObserverCallback; disconnected: boolean }> = []
const setVisible = (visible: boolean) => {
  for (const o of observers) {
    if (!o.disconnected)
      o.callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as never)
  }
  flushSync()
}

let spectrumHandler: ((u: SpectrumUpdate) => void) | null = null
let mixerHandler: ((u: MixerUpdate) => void) | null = null
const offSpectrum = vi.fn()
const restoreMonitor = vi.fn()
const commands: MixerCommand[] = []

beforeEach(() => {
  observers = []
  spectrumPaints.length = 0
  commands.length = 0
  spectrumHandler = mixerHandler = null
  offSpectrum.mockClear()
  restoreMonitor.mockClear()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly entry: { callback: IntersectionObserverCallback; disconnected: boolean }
      constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, disconnected: false }
        observers.push(this.entry)
      }
      observe() {}
      disconnect() {
        this.entry.disconnected = true
      }
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
  vi.stubGlobal('elecdex', {
    audio: {
      spectrum: (handler: (u: SpectrumUpdate) => void) => {
        spectrumHandler = handler
        return offSpectrum
      },
      mixer: (handler: (u: MixerUpdate) => void) => {
        mixerHandler = handler
        return () => {}
      },
      mixerCommand: (command: MixerCommand) => commands.push(command),
      restoreMonitor,
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('whileVisible', () => {
  it('starts on showing, stops on hiding, and stops for good on dispose', () => {
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const dispose = whileVisible(document.createElement('div'), start)
    expect(start).not.toHaveBeenCalled()
    setVisible(true)
    setVisible(true)
    expect(start).toHaveBeenCalledTimes(1)
    setVisible(false)
    expect(stop).toHaveBeenCalledTimes(1)
    setVisible(true)
    expect(start).toHaveBeenCalledTimes(2)
    dispose()
    expect(stop).toHaveBeenCalledTimes(2)
    setVisible(false)
    expect(stop).toHaveBeenCalledTimes(2)
  })
})

const props = (state?: Record<string, unknown>) => ({
  paneId: 'p',
  title: 'spectrum',
  props: undefined,
  state,
  active: true,
})

/** Bins with a tone at 1 kHz. */
const tone = () =>
  Array.from({ length: SPECTRUM_BINS }, (_, i) =>
    binEdge(i) <= 1000 && 1000 < binEdge(i + 1) ? 0.9 : 0,
  )

describe('SpectrumWidget', () => {
  it('subscribes only while on screen, and resets its bars when it stops', () => {
    render(SpectrumWidget, { props: props() })
    flushSync()
    expect(spectrumHandler).toBeNull()
    setVisible(true)
    expect(spectrumHandler).not.toBeNull()
    spectrumHandler?.({ t: 'frame', bins: tone() })
    expect(spectrumPaints.at(-1)?.level[5]).toBeCloseTo(0.9)
    setVisible(false)
    expect(offSpectrum).toHaveBeenCalledOnce()
    // The last paint on stopping shows empty bars.
    expect(spectrumPaints.at(-1)?.level.every((v) => v === 0)).toBe(true)
  })

  it('shows why there is no spectrum, and the running state once frames come', () => {
    const { getByTestId } = render(SpectrumWidget, { props: props() })
    flushSync()
    setVisible(true)
    expect(getByTestId('spectrum-note').textContent).toContain('starting capture')
    spectrumHandler?.({ t: 'status', status: 'unsupported', message: null })
    flushSync()
    expect(getByTestId('spectrum').dataset.status).toBe('unsupported')
    expect(getByTestId('spectrum-note').textContent).toContain('not available on this platform')
    spectrumHandler?.({ t: 'status', status: 'failed', message: 'NotAllowedError: denied' })
    flushSync()
    expect(getByTestId('spectrum-note').textContent).toContain('NotAllowedError: denied')
    spectrumHandler?.({ t: 'frame', bins: tone() })
    flushSync()
    expect(getByTestId('spectrum').dataset.status).toBe('running')
  })

  // A muted monitor records silence: "no sound" gave the user nothing to act on.
  it('says the monitor is muted, empties the bars and unmutes it only on a click', () => {
    const { getByTestId, queryByTestId } = render(SpectrumWidget, { props: props() })
    flushSync()
    setVisible(true)
    spectrumHandler?.({ t: 'frame', bins: tone() })
    expect(queryByTestId('spectrum-restore-monitor')).toBeNull()
    spectrumHandler?.({ t: 'status', status: 'muted', message: null })
    flushSync()
    expect(getByTestId('spectrum').dataset.status).toBe('muted')
    expect(getByTestId('spectrum-note').textContent).toContain('muted the output monitor')
    expect(spectrumPaints.at(-1)?.level.every((v) => v === 0)).toBe(true)
    expect(restoreMonitor).not.toHaveBeenCalled()
    fireEvent.click(getByTestId('spectrum-restore-monitor'))
    expect(restoreMonitor).toHaveBeenCalledOnce()
    spectrumHandler?.({ t: 'status', status: 'running', message: null })
    flushSync()
    expect(queryByTestId('spectrum-restore-monitor')).toBeNull()
    expect(getByTestId('spectrum').dataset.status).toBe('running')
  })

  it('shows "no sound" on the settings button row, not over the bars', () => {
    const { getByTestId, queryByTestId } = render(SpectrumWidget, { props: props() })
    flushSync()
    setVisible(true)
    spectrumHandler?.({ t: 'status', status: 'running', message: null })
    flushSync()
    const note = getByTestId('spectrum-note')
    expect(note.textContent).toContain('no sound')
    // A sibling of the settings button, outside the display the bars are drawn in.
    expect(note.closest('.display')).toBeNull()
    expect(note.parentElement).toBe(getByTestId('spectrum'))
    // The open settings take that row.
    fireEvent.click(getByTestId('spectrum-settings-toggle'))
    flushSync()
    expect(queryByTestId('spectrum-note')).toBeNull()
    fireEvent.click(getByTestId('spectrum-settings-toggle'))
    flushSync()
    // A problem is a longer message and stays over the (empty) display.
    spectrumHandler?.({ t: 'status', status: 'failed', message: 'denied' })
    flushSync()
    expect(getByTestId('spectrum-note').closest('.display')).not.toBeNull()
  })

  it('offers 31 bands and groups frames into them', async () => {
    const { layout } = await import('../../src/renderer/stores/layout.svelte.ts')
    const { getByTestId, container } = render(SpectrumWidget, { props: props({ bands: 31 }) })
    flushSync()
    setVisible(true)
    spectrumHandler?.({ t: 'frame', bins: tone() })
    const last = spectrumPaints.at(-1)
    expect(last?.bands).toBe(31)
    expect(last?.level).toHaveLength(31)
    expect(last?.level.findIndex((v) => v > 0)).toBe(17)
    fireEvent.click(getByTestId('spectrum-settings-toggle'))
    flushSync()
    const options = [...container.querySelectorAll('[data-testid=spectrum-bands]')]
    expect(options.map((b) => b.getAttribute('data-value'))).toEqual(['7', '10', '16', '31'])
    fireEvent.click(options[0] as Element)
    expect(layout.patchPaneState).toHaveBeenLastCalledWith(expect.anything(), { bands: 7 })
  })

  it('groups frames into the band count its settings name', () => {
    render(SpectrumWidget, { props: props({ bands: 16 }) })
    flushSync()
    setVisible(true)
    spectrumHandler?.({ t: 'frame', bins: tone() })
    const last = spectrumPaints.at(-1)
    expect(last?.bands).toBe(16)
    expect(last?.level).toHaveLength(16)
    expect(last?.level.findIndex((v) => v > 0)).toBe(8)
  })
})

const mixerState = (volume: number, muted = false): MixerState => ({
  support: 'full',
  device: 'Speakers',
  master: { id: 'master', name: 'Master', volume, muted },
  apps: [],
  error: null,
})

describe('MixerWidget', () => {
  it('keeps a held fader where the pointer put it while readings come in, and sends its last value', () => {
    vi.useFakeTimers()
    const { getByTestId } = render(MixerWidget, { props: props() })
    flushSync()
    setVisible(true)
    mixerHandler?.({ t: 'state', state: mixerState(0.5) })
    flushSync()
    const fader = getByTestId('mixer-fader') as HTMLInputElement
    fader.value = '20'
    fireEvent.input(fader)
    fader.value = '25'
    fireEvent.input(fader)
    flushSync()
    // A reading from before the change arrives while the fader is held.
    mixerHandler?.({ t: 'state', state: mixerState(0.5) })
    flushSync()
    expect(getByTestId('mixer-value').textContent?.trim()).toBe('25%')
    // Moves are sent at most every 50 ms: one command for the two moves, with the latest value.
    vi.advanceTimersByTime(50)
    expect(commands).toEqual([{ t: 'volume', id: 'master', volume: 0.25 }])
    // Letting go sends the final value at once.
    fader.value = '30'
    fireEvent.change(fader)
    expect(commands.at(-1)).toEqual({ t: 'volume', id: 'master', volume: 0.3 })
  })

  it('asks to mute a channel that is not muted, and to unmute one that is', () => {
    const { getByTestId } = render(MixerWidget, { props: props() })
    flushSync()
    setVisible(true)
    mixerHandler?.({ t: 'state', state: mixerState(0.5, false) })
    flushSync()
    getByTestId('mixer-mute').click()
    expect(commands.at(-1)).toEqual({ t: 'mute', id: 'master', muted: true })
    mixerHandler?.({ t: 'state', state: mixerState(0.5, true) })
    flushSync()
    getByTestId('mixer-mute').click()
    expect(commands.at(-1)).toEqual({ t: 'mute', id: 'master', muted: false })
  })

  it('says what went wrong instead of showing empty strips', () => {
    const { getByTestId, queryAllByTestId } = render(MixerWidget, { props: props() })
    flushSync()
    setVisible(true)
    mixerHandler?.({
      t: 'state',
      state: { ...mixerState(0.5), master: null, error: 'the Windows mixer stopped' },
    })
    flushSync()
    expect(getByTestId('mixer-note').textContent).toContain('the Windows mixer stopped')
    expect(queryAllByTestId('mixer-strip')).toHaveLength(0)
  })

  it('does not send a change still waiting when the pane goes', () => {
    vi.useFakeTimers()
    const { getByTestId, unmount } = render(MixerWidget, { props: props() })
    flushSync()
    setVisible(true)
    mixerHandler?.({ t: 'state', state: mixerState(0.5) })
    flushSync()
    const fader = getByTestId('mixer-fader') as HTMLInputElement
    fader.value = '10'
    fireEvent.input(fader)
    unmount()
    vi.advanceTimersByTime(100)
    expect(commands).toEqual([])
  })
})
