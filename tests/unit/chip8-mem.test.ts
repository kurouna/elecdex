import { Chip8 } from '@shared/chip8/machine'
import { quirksFor } from '@shared/chip8/quirks'
import {
  byteMap,
  changedBytes,
  MEM_COLUMNS,
  MEM_ROWS,
  memoryRows,
  scrollWindow,
  windowStart,
} from '@shared/emu/mem-window'
import { describe, expect, it } from 'vitest'
import { byteKind, spriteAt } from '../../src/renderer/widgets/chip8/mem.js'

const machine = (program: number[], platform: 'chip8' | 'xochip' = 'chip8') =>
  Chip8.load(
    new Uint8Array(program),
    { platform, quirks: quirksFor(platform), ipf: 10, font: 'octo' },
    1,
  )

describe('the MEM window', () => {
  it('puts what it follows a quarter of the way down, never past either end', () => {
    expect(windowStart(0x200, 4096)).toBe(0x200 - 4 * MEM_COLUMNS)
    expect(windowStart(0x203, 4096)).toBe(0x200 - 4 * MEM_COLUMNS)
    expect(windowStart(0x004, 4096)).toBe(0)
    expect(windowStart(0xfff, 4096)).toBe(4096 - MEM_ROWS * MEM_COLUMNS)
    expect(windowStart(0xfff0, 65536)).toBe(65536 - MEM_ROWS * MEM_COLUMNS)
  })

  it('scrolls by whole rows and stops at the ends', () => {
    expect(scrollWindow(0x200, 2, 4096)).toBe(0x210)
    expect(scrollWindow(0x008, -2, 4096)).toBe(0)
    expect(scrollWindow(0xf70, 4, 4096)).toBe(4096 - MEM_ROWS * MEM_COLUMNS)
  })

  it('reads eight bytes a row, the program where it was loaded', () => {
    const m = machine([0xa2, 0x2a, 0x60, 0x0c])
    const rows = memoryRows(m.state.memory, 0x200, 2)
    expect(rows).toEqual([
      { address: 0x200, bytes: [0xa2, 0x2a, 0x60, 0x0c, 0, 0, 0, 0] },
      { address: 0x208, bytes: [0, 0, 0, 0, 0, 0, 0, 0] },
    ])
    // The window stops at the end of memory.
    expect(memoryRows(m.state.memory, 4096 - MEM_COLUMNS, 4)).toHaveLength(1)
  })

  it('tells the fonts and the program from the rest', () => {
    expect(byteKind(0x000, 4)).toBe('font')
    expect(byteKind(0x0ef, 4)).toBe('font')
    expect(byteKind(0x0f0, 4)).toBe('free')
    expect(byteKind(0x203, 4)).toBe('program')
    expect(byteKind(0x204, 4)).toBe('free')
  })

  it('draws the bytes from I as a sprite, wrapping at the end of memory', () => {
    // I := 0 is the small font's 0: F0 90 90 90 F0.
    const m = machine([0xa0, 0x00])
    m.step()
    expect(spriteAt(m.state, 5)).toEqual([0xf0, 0x90, 0x90, 0x90, 0xf0])
    const end = machine([0xaf, 0xff])
    end.step()
    const sprite = spriteAt(end.state, 2)
    expect(sprite[1]).toBe(end.state.memory[0])
  })

  it('marks only the bytes that changed since the last look, and none on the first', () => {
    const m = machine([0x60, 0x2a, 0xa3, 0x00, 0xf0, 0x55])
    const first = memoryRows(m.state.memory, 0x300, 1)
    expect(changedBytes(null, first).size).toBe(0)
    const before = byteMap(first)
    for (let k = 0; k < 3; k++) m.step()
    expect([...changedBytes(before, memoryRows(m.state.memory, 0x300, 1))]).toEqual([0x300])
  })
})
