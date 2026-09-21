import { describe, expect, it } from 'vitest'
import {
  floorPhase,
  nextPackets,
  PACKET_GAP_MS,
  PACKET_MS,
  PACKETS_PER_UNIT,
  type Packet,
  steppedBack,
} from '../../src/renderer/widgets/elec/light.js'

describe("an answer's packets", () => {
  it('puts one on the spoke for a piece received', () => {
    const packets = nextPackets([], 1, 1000)
    expect(packets).toEqual([{ id: 1, unit: 1, at: 1000 }])
  })

  it('shows main sending ten pieces a second as no more than the gap allows', () => {
    let packets: readonly Packet[] = []
    for (let now = 0; now < 1000; now += 100) packets = nextPackets(packets, 0, now)
    const gaps = packets.slice(1).map((p, i) => p.at - (packets[i]?.at ?? 0))
    expect(packets.length).toBeGreaterThan(1)
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(PACKET_GAP_MS)
  })

  it('never carries more than a few at once, and hands back the same list when it has no room', () => {
    let packets: readonly Packet[] = []
    for (let i = 0; i < 10; i++) packets = nextPackets(packets, 2, i * PACKET_GAP_MS)
    expect(packets.filter((p) => p.unit === 2).length).toBeLessThanOrEqual(PACKETS_PER_UNIT)
    const full = nextPackets([], 2, 0)
    expect(nextPackets(full, 2, 1)).toBe(full)
  })

  it('keeps each spoke its own: one full does not hold another back', () => {
    const one = nextPackets([], 0, 0)
    const both = nextPackets(one, 1, 1)
    expect(both.map((p) => p.unit)).toEqual([0, 1])
    expect(new Set(both.map((p) => p.id)).size).toBe(2)
  })

  it('drops what never landed (a tab behind another runs no animation), so the spoke is not left full', () => {
    let packets: readonly Packet[] = []
    for (let i = 0; i < PACKETS_PER_UNIT; i++) packets = nextPackets(packets, 0, i * PACKET_GAP_MS)
    expect(packets).toHaveLength(PACKETS_PER_UNIT)
    const later = nextPackets(packets, 0, PACKET_MS * 10)
    expect(later).toHaveLength(1)
    expect(later[0]?.at).toBe(PACKET_MS * 10)
    // Ids stay unique against what was dropped, since a leaving element may still hold one.
    expect(later[0]?.id).toBeGreaterThan(PACKETS_PER_UNIT - 1)
  })
})

describe('where the floor stopped', () => {
  it('is the part of a cell its running layer had moved', () => {
    expect(floorPhase('matrix(1, 0, 0, 1, 0, 10)', 40)).toBe(0.25)
    expect(floorPhase('matrix(1, 0, 0, 1, 0, 39.99)', 40)).toBe(1)
    expect(floorPhase('matrix(1, 0, 0, 1, 0, 50)', 40)).toBe(0.25)
  })

  it('is the start for anything it cannot read', () => {
    expect(floorPhase('none', 40)).toBe(0)
    expect(floorPhase('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 10, 0, 1)', 40)).toBe(0)
    expect(floorPhase('matrix(1, 0, 0, 1, 0, 10)', 0)).toBe(0)
    expect(floorPhase('matrix(1, 0, 0, 1, 0, 10)', Number.NaN)).toBe(0)
  })
})

describe('who steps back once the council has decided', () => {
  it('is nobody while it sits or before a motion', () => {
    for (const state of ['standby', 'queued', 'tx', 'rx', 'approve', 'reject']) {
      expect(steppedBack(null, state)).toBe(false)
    }
  })

  it('is whoever did not carry the decision', () => {
    expect(steppedBack('approved', 'approve')).toBe(false)
    expect(steppedBack('approved', 'reject')).toBe(true)
    expect(steppedBack('approved', 'abstain')).toBe(true)
    expect(steppedBack('approved', 'invalid')).toBe(true)
    expect(steppedBack('rejected', 'reject')).toBe(false)
    expect(steppedBack('rejected', 'approve')).toBe(true)
  })

  it('is all three alike when nothing was decided', () => {
    for (const outcome of ['deadlock', 'no-consensus', 'no-quorum', 'interrupted'] as const) {
      for (const state of ['approve', 'reject', 'abstain', 'invalid']) {
        expect(steppedBack(outcome, state)).toBe(true)
      }
    }
  })
})
