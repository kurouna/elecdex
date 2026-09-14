import type { SpectrumUpdate } from '@shared/audio'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpectrumCapture } from '../../src/main/audio/spectrum-capture.js'

vi.mock('electron', () => ({}))
const { validBins } = await import('../../src/main/audio/capture-window.js')

/** A capture the test drives: each open is recorded with its update callback. */
function harness() {
  const opened: Array<{ report: (u: SpectrumUpdate) => void; close: ReturnType<typeof vi.fn> }> = []
  const published: SpectrumUpdate[] = []
  const capture = new SpectrumCapture({
    open: (onUpdate) => {
      const entry = { report: onUpdate, close: vi.fn() }
      opened.push(entry)
      return { close: entry.close }
    },
    publish: (update) => published.push(update),
  })
  return { capture, opened, published }
}

const failed: SpectrumUpdate = { t: 'status', status: 'failed', message: 'NotAllowedError' }
const running: SpectrumUpdate = { t: 'status', status: 'running', message: null }

describe('SpectrumCapture', () => {
  let h: ReturnType<typeof harness>
  beforeEach(() => {
    h = harness()
  })

  it('opens with the first subscriber, once, and closes with the last', () => {
    h.capture.subscribers(1)
    h.capture.subscribers(2)
    expect(h.opened).toHaveLength(1)
    expect(h.capture.running).toBe(true)
    h.capture.subscribers(1)
    expect(h.opened[0]?.close).not.toHaveBeenCalled()
    h.capture.subscribers(0)
    expect(h.opened[0]?.close).toHaveBeenCalledOnce()
    expect(h.capture.running).toBe(false)
  })

  it('tells a newcomer where capture stands, and passes updates on', () => {
    h.capture.subscribers(1)
    expect(h.capture.joined()).toEqual({ t: 'status', status: 'starting', message: null })
    h.opened[0]?.report(running)
    h.opened[0]?.report({ t: 'frame', bins: [0.5] })
    expect(h.capture.joined()).toEqual(running)
    expect(h.published.map((u) => u.t)).toEqual(['status', 'frame'])
  })

  it('retries a failed capture when a pane joins', () => {
    h.capture.subscribers(1)
    h.opened[0]?.report(failed)
    expect(h.capture.joined()).toEqual({ t: 'status', status: 'starting', message: null })
    expect(h.opened).toHaveLength(2)
    expect(h.opened[0]?.close).toHaveBeenCalledOnce()
    // Joining again while the retry runs does not start a third.
    h.capture.joined()
    expect(h.opened).toHaveLength(2)
  })

  it('ignores what a closed capture still reports on its way out', () => {
    h.capture.subscribers(1)
    const first = h.opened[0]
    h.capture.subscribers(0)
    first?.report(failed)
    first?.report({ t: 'frame', bins: [1] })
    expect(h.published).toEqual([])
    h.capture.subscribers(1)
    expect(h.capture.joined()).toMatchObject({ status: 'starting' })
  })

  it('accepts updates a capture sends while it is still opening', () => {
    const published: SpectrumUpdate[] = []
    const capture = new SpectrumCapture({
      open: (onUpdate) => {
        onUpdate(failed)
        return { close: () => {} }
      },
      publish: (u) => published.push(u),
    })
    capture.subscribers(1)
    expect(published).toEqual([failed])
  })

  it('closes on dispose', () => {
    h.capture.subscribers(1)
    h.capture.dispose()
    expect(h.opened[0]?.close).toHaveBeenCalledOnce()
  })
})

describe('validBins', () => {
  const bins = (value: unknown, length = 60) => new Array(length).fill(value)

  it('accepts sixty levels from 0 to 1', () => {
    expect(validBins(bins(0.5))).toHaveLength(60)
    expect(validBins([0, ...bins(1, 59)])).not.toBeNull()
  })

  it('refuses anything else a page could send', () => {
    expect(validBins(bins(0.5, 59))).toBeNull()
    expect(validBins(bins(0.5, 61))).toBeNull()
    expect(validBins([...bins(0.5, 59), 1.01])).toBeNull()
    expect(validBins([...bins(0.5, 59), -0.01])).toBeNull()
    expect(validBins([...bins(0.5, 59), Number.NaN])).toBeNull()
    expect(validBins([...bins(0.5, 59), '0.5'])).toBeNull()
    expect(validBins('bins')).toBeNull()
    expect(validBins(null)).toBeNull()
  })
})
