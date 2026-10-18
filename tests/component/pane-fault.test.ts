import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { default: FaultHost } = await import('./FaultHost.svelte')
const { fault } = await import('./fault-switch.svelte.ts')
const { toasts } = await import('../../src/renderer/stores/toasts.svelte.ts')
const { faultText, forgetSaid, reportFault, reportProblems, watchPageFaults } = await import(
  '../../src/renderer/lib/fault-report.ts'
)

/**
 * A fault said where it is seen (lib/fault-report.ts): a pane that throws, even
 * from an effect of its own, becomes a toast and a way back, never a blank pane
 * or a workspace taken down with it; an exception nothing caught is a toast too;
 * a fault said once is said once, and a burst is held to a few.
 */

const clipboard = { writeText: vi.fn(async (_text: string) => {}) }

beforeEach(() => {
  toasts.clear()
  forgetSaid()
  fault.on = false
  clipboard.writeText.mockClear()
  vi.stubGlobal('navigator', { ...navigator, clipboard })
  vi.stubGlobal('elecdex', {
    system: { info: async () => ({ version: '0.0.0', platform: 'win32', arch: 'x64' }) },
  })
})

afterEach(() => {
  cleanup()
  toasts.clear()
  vi.unstubAllGlobals()
})

describe('a pane that throws', () => {
  it('shows what stopped it, says it as a red toast naming the pane, and starts again on RETRY', async () => {
    fault.on = true
    render(FaultHost)
    await Promise.resolve()
    expect(screen.getByTestId('pane-fault').textContent).toContain('THE PANE STOPPED')
    expect(screen.getByTestId('pane-fault').textContent).toContain('TypeError: a made-up fault')
    const said = toasts.items.find((t) => t.tone === 'danger')
    expect(said?.title).toBe('ETHERNET: something failed')
    fault.on = false
    await fireEvent.click(screen.getByTestId('pane-fault-retry'))
    expect(screen.queryByTestId('pane-fault')).toBeNull()
    expect(screen.getByTestId('fault-child').textContent).toBe('drawn')
    expect(screen.getByTestId('outside').textContent).toBe('still here')
  })
})

describe('the reports', () => {
  it('says a problem once, and copies only it and the app’s version and platform', async () => {
    reportProblems('ETHERNET', ['the adapters could not be read: a made-up failure'])
    reportProblems('ETHERNET', ['the adapters could not be read: a made-up failure'])
    expect(toasts.items).toHaveLength(1)
    toasts.items[0]?.actions.find((a) => a.label === 'copy details')?.run()
    await vi.waitFor(() => expect(clipboard.writeText).toHaveBeenCalled())
    expect(clipboard.writeText.mock.calls[0]?.[0]).toBe(
      'ETHERNET problem\nelecdex 0.0.0 on win32 x64\nthe adapters could not be read: a made-up failure',
    )
  })

  it('holds a burst of different faults to three a minute', () => {
    for (let i = 0; i < 6; i++) reportFault('elecdex', new Error(`fault ${i}`))
    expect(toasts.items.map((t) => t.body?.split('.')[0])).toEqual([
      'Error: fault 0',
      'Error: fault 1',
      'Error: fault 2',
    ])
  })

  it('a fault’s text is one line of its name and message, never its stack, at most 300', () => {
    const error = new RangeError('two\n  lines')
    expect(faultText(error)).toBe('RangeError: two lines')
    expect(faultText('x'.repeat(400))).toHaveLength(300)
    expect(faultText(undefined)).toBe('unknown')
  })

  it('an exception or a rejection nothing caught is a toast; a ResizeObserver note is not', () => {
    const target = new EventTarget() as unknown as Window
    const stop = watchPageFaults(target)
    target.dispatchEvent(
      Object.assign(new Event('error'), { error: new Error('nobody caught this'), message: '' }),
    )
    target.dispatchEvent(
      Object.assign(new Event('error'), {
        error: null,
        message: 'ResizeObserver loop completed with undelivered notifications.',
      }),
    )
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'refused' }))
    expect(toasts.items.map((t) => t.body?.split('.')[0])).toEqual([
      'Error: nobody caught this',
      'refused',
    ])
    stop()
    target.dispatchEvent(
      Object.assign(new Event('error'), { error: new Error('after'), message: '' }),
    )
    expect(toasts.items).toHaveLength(2)
  })
})
