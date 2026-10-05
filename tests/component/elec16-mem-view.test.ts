import { assemble, romImage } from '@shared/elec16/asm'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'
import MemView from '../../src/renderer/widgets/elec16/MemView.svelte'
import { Elec16Runner } from '../../src/renderer/widgets/elec16/runner.svelte.ts'
import { browserLoop } from '../../src/renderer/widgets/emu/runner.svelte.ts'

/**
 * MEM (widgets/elec16/MemView.svelte): a byte is lit when it changed since the last look - in
 * the same memory. Moving to another of PLAY-320's memories, whose bytes sit at the same
 * addresses, lights nothing.
 */

afterEach(cleanup)

describe('MEM', () => {
  it('lights nothing when it moves from one memory to another', async () => {
    const runner = new Elec16Runner({
      ...browserLoop,
      clock: () => ({ second: 0, minute: 0, hour: 0, day: 1, month: 1, year: 2026, weekday: 4 }),
    })
    const rom = romImage(assemble('.org 0x8000\nloop:\n  j loop'))
    runner.boot(rom, 'play-320', 4_000_000, undefined, 0x2000)
    runner.pause()
    const s = runner.machine?.state
    s?.xram.fill(0x11)
    s?.video?.mem.fill(0x22)
    render(MemView, { runner })
    await tick()
    const pick = (space: string) =>
      fireEvent.click(
        screen.getAllByTestId('elec16-mem-space').find((b) => b.dataset.space === space) as Element,
      )
    await pick('xram')
    await tick()
    await pick('video')
    await tick()
    expect(screen.getByTestId('elec16-mem-rows').querySelectorAll('.changed')).toHaveLength(0)
    runner.dispose()
  })
})
