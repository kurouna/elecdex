import { CARD_STATUS } from '@shared/elec16/card'
import { keyCode } from '@shared/elec16/keys'
import { Elec16 } from '@shared/elec16/machine'
import { RAM_SIZE } from '@shared/elec16/map'
import { decodeSnapshot, SNAPSHOT_MAX_SIZE } from '@shared/elec16/snapshot'
import { describe, expect, it } from 'vitest'
import { built, press, screen, settle, switchOn, type } from './elec16-helpers'

/** A unit's battery backup (docs/elec16.md section 8): the machine as bytes, and back. */

/** The state without what a snapshot leaves out on purpose. */
function comparable(m: Elec16) {
  const { keys, screenRevision, card, ...rest } = m.state
  return { ...rest, card: { ...card, request: null } }
}

describe('a snapshot', () => {
  it('brings a machine back as it was, and it goes on the same', () => {
    const m = switchOn('pocket-64')
    type(m, '10 FOR I=1 TO 3:PRINT I*7;:NEXT\nA=42\n')
    press(m, keyCode('mode'))
    const bytes = m.snapshot()
    expect(bytes.length).toBeLessThanOrEqual(SNAPSHOT_MAX_SIZE)
    const back = Elec16.restore(built.image, bytes)
    expect(back).not.toBeNull()
    if (back === null) return
    expect(comparable(back)).toEqual(comparable(m))
    for (const machine of [m, back]) {
      press(machine, keyCode('mode'))
      type(machine, 'RUN\nPRINT I\n')
    }
    expect(screen(back)).toEqual(screen(m))
    expect(screen(back).slice(-4)).toEqual(['7 14 21', '>PRINT I', '4', '>'])
  })

  it('keeps a halt, and every key up', () => {
    const m = switchOn()
    type(m, 'MON\nG 0\n')
    m.press(keyCode('a'))
    const back = Elec16.restore(built.image, m.snapshot())
    expect(back?.state.keys.fifo).toEqual([])
    expect(Array.from(back?.state.keys.held ?? [])).toEqual(new Array(10).fill(0))
    expect(back?.state.halt).toEqual(m.state.halt)
  })

  it('ends a card command that was out when it was taken, as INTERRUPTED', () => {
    const m = switchOn()
    m.state.ram.set([0x41, 0, ...new Array(30).fill(0)], 0x7000)
    m.state.card.block = 0x7000
    // A READ of "A", given as a program would, and not yet answered.
    ;(m as unknown as { bus: { write16(a: number, v: number): void } }).bus.write16(0xff60, 2)
    expect(m.state.card.busy).toBe(true)
    const back = Elec16.restore(built.image, m.snapshot())
    expect(back?.state.card).toMatchObject({
      busy: false,
      status: CARD_STATUS.interrupted,
      pending: true,
    })
  })

  it('is not ours when anything about it is wrong', () => {
    const m = switchOn()
    settle(m)
    const good = m.snapshot()
    const broken = (change: (b: Uint8Array) => Uint8Array) => decodeSnapshot(change(good.slice()))
    expect(decodeSnapshot(good)).not.toBeNull()
    expect(broken((b) => b.subarray(0, b.length - 1))).toBeNull()
    expect(broken((b) => new Uint8Array([...b, 0]))).toBeNull()
    expect(broken((b) => b.fill(0x58, 0, 1))).toBeNull()
    expect(broken((b) => b.fill(2, 4, 5))).toBeNull()
    // The model, then a field of each device out of its range.
    expect(broken((b) => b.fill(9, 5, 6))).toBeNull()
    const head = 4 + 1 + 1 + 32 + 2 + 14 + 1 + 2 + 1 + 8 + 8
    expect(broken((b) => b.fill(12, head, head + 1))).toBeNull()
    expect(broken((b) => b.fill(16, head + 2, head + 3))).toBeNull()
    expect(new Uint8Array(RAM_SIZE).length).toBe(0x8000)
  })
})
