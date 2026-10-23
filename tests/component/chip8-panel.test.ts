import { quirksFor } from '@shared/chip8/quirks'
import type { Chip8Program } from '@shared/chip8-library'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { themePalette } from '../../src/renderer/widgets/chip8/palette.ts'
import { readChip8Pane } from '../../src/renderer/widgets/chip8/pane-state.ts'
import RunView from '../../src/renderer/widgets/chip8/RunView.svelte'
import { Chip8Runner } from '../../src/renderer/widgets/chip8/runner.svelte.ts'

/**
 * The CHIP-8 run view's PANEL button in a pane too narrow to keep the panel beside the screen
 * (jsdom measures nothing, so the view has no room at all). A panel shut by hand once took two
 * presses to come back there: the first only marked it wanted, still without room to show.
 */

const PROGRAM: Chip8Program = {
  id: 'diag/test',
  title: 'Test',
  authors: [],
  platform: 'chip8',
  genre: 'diag',
  description: '',
  ipf: 10,
  quirks: quirksFor('chip8'),
  font: 'octo',
  rotation: 0,
  licence: 'unknown',
  keys: 0,
  favourite: false,
}

/** A runner whose clock never moves: the view is drawn, nothing runs. */
function stillRunner(): Chip8Runner {
  const runner = new Chip8Runner({
    requestFrame: () => 0,
    cancelFrame: () => undefined,
    setTimer: () => 0,
    clearTimer: () => undefined,
    now: () => 0,
    sound: () => undefined,
  })
  runner.load(PROGRAM, new Uint8Array([0x12, 0x00]), 1)
  return runner
}

beforeEach(() => {
  // jsdom has no ResizeObserver: one that never reports leaves the view with no room.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  // Motion reduced, so the panel comes and goes without a transition.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('PANEL in a pane with no room for the panel', () => {
  it('opens a panel shut by hand with one press, and shuts it with the next', async () => {
    const onchange = vi.fn()
    render(RunView, {
      props: {
        runner: stillRunner(),
        program: PROGRAM,
        pane: readChip8Pane({ view: 'run', program: PROGRAM.id, panel: false }),
        panelWanted: false,
        palette: themePalette({}),
        listening: false,
        onback: () => undefined,
        onreset: () => undefined,
        onchange,
        onslot: async () => true,
      },
    })
    const toggle = screen.getByTestId('chip8-panel-toggle')
    expect(screen.queryByTestId('chip8-panel')).toBeNull()

    await fireEvent.click(toggle)
    flushSync()
    expect(screen.queryByTestId('chip8-panel')).not.toBeNull()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(onchange).toHaveBeenLastCalledWith({ panel: true })

    await fireEvent.click(toggle)
    flushSync()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('chip8-panel')).toBeNull()

    await fireEvent.click(toggle)
    flushSync()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByTestId('chip8-panel')).not.toBeNull()
  })
})
