import { describe, expect, it } from 'vitest'
import {
  inFlight,
  lap,
  nextPackets,
  PACKET_GAP_MS,
  PACKET_MS,
  PACKETS_PER_UNIT,
  type Packet,
  packetProgress,
  RUN_MS,
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

describe('a run of light, stepped by the frame loop', () => {
  it('is placed by the time alone: a lap every period, the second of a pair half a lap on', () => {
    expect(lap(0, RUN_MS.trace)).toBe(0)
    expect(lap(RUN_MS.trace / 4, RUN_MS.trace)).toBeCloseTo(0.25, 6)
    expect(lap(RUN_MS.trace * 3.25, RUN_MS.trace)).toBeCloseTo(0.25, 6)
    expect(lap(RUN_MS.trace / 4, RUN_MS.trace, 0.5)).toBeCloseTo(0.75, 6)
    expect(lap(RUN_MS.trace / 4, RUN_MS.trace, 0.9)).toBeCloseTo(0.15, 6)
  })

  it('stays on the path for any moment, and still for a period that is none', () => {
    for (const now of [-1, -12345.6, 0, 1e9]) {
      const at = lap(now, RUN_MS.comet)
      expect(at).toBeGreaterThanOrEqual(0)
      expect(at).toBeLessThan(1)
    }
    expect(lap(500, 0)).toBe(0)
  })

  it('moves a step a frame that reads as a run: less than the dash it moves', () => {
    // Ten frames a second. A comet's dash is 22 of 300, a plate's 9 of 100 at the slower pace.
    expect((300 * 100) / RUN_MS.comet).toBeLessThan(22)
    expect((100 * 100) / RUN_MS.trace).toBeLessThan(9)
  })
})

describe('a packet on its way', () => {
  const packet: Packet = { id: 1, unit: 0, at: 1000 }

  it('is as far down its spoke as the time since it set out', () => {
    expect(packetProgress(packet, 1000)).toBe(0)
    expect(packetProgress(packet, 1000 + PACKET_MS / 2)).toBe(0.5)
    expect(packetProgress(packet, 900)).toBe(0)
  })

  it('is taken away once it has landed, and the list is the same one while none has', () => {
    const packets = [packet, { id: 2, unit: 1 as const, at: 1300 }]
    expect(inFlight(packets, 1400)).toBe(packets)
    expect(inFlight(packets, 1000 + PACKET_MS)).toEqual([packets[1]])
    expect(inFlight(packets, 1e6)).toEqual([])
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
