import { describe, expect, it, vi } from 'vitest'
import { quitGate } from '../../src/main/quit-gate.js'

/**
 * The quit held for the shells (main/index.ts, PtyManager.disposeAll): before-quit closes them
 * once and lets the quit go on when their output workers have ended. Found in review: a second
 * quit while the first waited (the tray, the window, Ctrl+Shift+Q) closed them again, found none,
 * and quit at once; and what ends at once (TRANSLATE's engine) waited behind the shells.
 */

function harness() {
  let end = () => {}
  const workers = new Promise<void>((resolve) => {
    end = resolve
  })
  const closeShells = vi.fn(() => workers)
  const endAtOnce = vi.fn()
  const quit = vi.fn()
  const gate = quitGate({ closeShells, endAtOnce, quit })
  const event = () => ({ preventDefault: vi.fn() })
  return { end, closeShells, endAtOnce, quit, gate, event }
}

describe('the quit held for the shells', () => {
  it('holds the quit until the shells are closed, then quits once', async () => {
    const h = harness()
    const first = h.event()
    h.gate(first)
    expect(first.preventDefault).toHaveBeenCalled()
    expect(h.quit).not.toHaveBeenCalled()
    h.end()
    await vi.waitFor(() => expect(h.quit).toHaveBeenCalledTimes(1))
    // The quit asked again: it goes on.
    const again = h.event()
    h.gate(again)
    expect(again.preventDefault).not.toHaveBeenCalled()
    expect(h.closeShells).toHaveBeenCalledTimes(1)
  })

  it('holds a second quit asked while it waits, closing nothing twice', async () => {
    const h = harness()
    h.gate(h.event())
    const second = h.event()
    h.gate(second)
    expect(second.preventDefault).toHaveBeenCalled()
    expect(h.closeShells).toHaveBeenCalledTimes(1)
    await Promise.resolve()
    expect(h.quit).not.toHaveBeenCalled()
    h.end()
    await vi.waitFor(() => expect(h.quit).toHaveBeenCalledTimes(1))
    await Promise.resolve()
    expect(h.quit).toHaveBeenCalledTimes(1)
  })

  it('ends what ends at once on the first quit, not behind the shells, and only once', async () => {
    const h = harness()
    h.gate(h.event())
    expect(h.endAtOnce).toHaveBeenCalledTimes(1)
    h.gate(h.event())
    h.end()
    await vi.waitFor(() => expect(h.quit).toHaveBeenCalled())
    h.gate(h.event())
    expect(h.endAtOnce).toHaveBeenCalledTimes(1)
  })

  it('still quits when closing the shells fails', async () => {
    // A failed close must not leave an app that cannot quit (found in review).
    const quit = vi.fn()
    const gate = quitGate({
      closeShells: () => Promise.reject(new Error('gone')),
      endAtOnce: () => {},
      quit,
    })
    gate({ preventDefault: vi.fn() })
    await vi.waitFor(() => expect(quit).toHaveBeenCalledTimes(1))
    const again = { preventDefault: vi.fn() }
    gate(again)
    expect(again.preventDefault).not.toHaveBeenCalled()
  })

  it('lets the quit straight through with no shells to close', () => {
    const quit = vi.fn()
    const endAtOnce = vi.fn()
    const gate = quitGate({ closeShells: () => null, endAtOnce, quit })
    const event = { preventDefault: vi.fn() }
    gate(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(endAtOnce).toHaveBeenCalledTimes(1)
    expect(quit).not.toHaveBeenCalled()
  })
})
