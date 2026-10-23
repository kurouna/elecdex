import { assemble, romImage } from '@shared/elec16/asm'
import { REG_NAMES } from '@shared/elec16/isa'
import { Elec16 } from '@shared/elec16/machine'
import type { ModelId } from '@shared/elec16/map'
import { expect } from 'vitest'

/**
 * A few lines of E16 assembly run on a bare machine, the way the machine's own tests (the CPU,
 * the pad, video, tiles, extended RAM, cartridges, sound) try one part at a time. Apart from
 * elec16-helpers.ts on purpose: that one assembles the whole ROM when it is imported, which none
 * of these tests need.
 */

/** A machine whose ROM is `src` from 8000 (its reset address), the extended RAM it is given. */
export function bootAsm(src: string, model?: ModelId, xram = 0): Elec16 {
  const out = assemble(`.org 0x8000\n${src}`)
  expect(out.errors).toEqual([])
  return Elec16.boot(romImage(out), model, undefined, xram)
}

/**
 * Runs to the program's EBREAK, which stops the machine ("breakpoint"), and answers its
 * registers by ABI name, so a test reads them where it stopped.
 */
export function finishAsm(m: Elec16, cycles = 1_000_000): Record<string, number> {
  const result = m.run(cycles)
  expect(result.halted?.cause, `stopped at ${result.halted?.pc.toString(16)}`).toBe('breakpoint')
  return Object.fromEntries(REG_NAMES.map((name, k) => [name, m.state.regs[k] ?? 0]))
}
